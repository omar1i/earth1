// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyBooking } from "@/lib/booking-notify.server";
import type { BookingInput } from "@/lib/booking-schema";

const API_KEY = "re_test_key_abcdefghijklmnop";
const OWNER = "owner@example.com";
const env = { RESEND_API_KEY: API_KEY, BOOKING_NOTIFY_TO: OWNER };
const envWithBank = { ...env, BANK_DETAILS: "Bank: Test Bank | IBAN: OM00TEST123" };
const booking: BookingInput = {
  submission_key: "55c1ad41-1b0e-4b1c-a513-7246ad52f3fb",
  experience_id: "sea-fishing",
  customer_name: "Test Visitor",
  contact_number: "+96800000000",
  email: "visitor@example.com",
  preferred_date: "2030-01-01",
  participant_count: 2,
  preferred_language: "ar",
  special_requirements: "",
  additional_notes: "Hello",
  terms_accepted: true,
};
const okResponse = () => new Response(JSON.stringify({ id: "re-id-1" }), { status: 200 });

type Call = { url: string; headers: Record<string, string>; body: Record<string, unknown> };
const callsOf = (f: ReturnType<typeof vi.fn>): Call[] =>
  f.mock.calls.map((c) => {
    const [url, init] = c as unknown as [string, RequestInit];
    return { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
  });

let logs: string[];
beforeEach(() => {
  logs = [];
  vi.spyOn(console, "error").mockImplementation((...a) => void logs.push(a.join(" ")));
  vi.spyOn(console, "warn").mockImplementation((...a) => void logs.push(a.join(" ")));
});
afterEach(() => vi.restoreAllMocks());

describe("notifyBooking (Resend)", () => {
  it("e-mails the owner with the booking details and reports success", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await notifyBooking(booking, { env, fetchImpl: fetchImpl as never });
    expect(result).toEqual({ sent: true });
    const call = callsOf(fetchImpl)[0]!;
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no BANK_DETAILS -> no customer e-mail
    expect(call.url).toBe("https://api.resend.com/emails");
    expect(call.headers["Authorization"]).toBe(`Bearer ${API_KEY}`);
    expect(call.headers["Idempotency-Key"]).toBe(`owner-${booking.submission_key}`);
    expect(call.body["to"]).toEqual([OWNER]);
    expect(call.body["from"]).toBe("Earth Adventure <onboarding@resend.dev>");
    expect(call.body["reply_to"]).toBe("visitor@example.com");
    expect(String(call.body["subject"])).toContain("Sea Fishing Adventure");
    const text = String(call.body["text"]);
    expect(text).toContain("Test Visitor");
    expect(text).toContain("https://wa.me/96800000000");
    expect(text).toContain(booking.submission_key);
    expect(text).toContain("ACTION NEEDED"); // customer e-mail was skipped
  });

  it("uses BOOKING_FROM_EMAIL and supports several owner addresses", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await notifyBooking(booking, {
      env: { ...env, BOOKING_NOTIFY_TO: "a@example.com, b@example.com", BOOKING_FROM_EMAIL: "Bookings <bookings@example.com>" },
      fetchImpl: fetchImpl as never,
    });
    const call = callsOf(fetchImpl)[0]!;
    expect(call.body["to"]).toEqual(["a@example.com", "b@example.com"]);
    expect(call.body["from"]).toBe("Bookings <bookings@example.com>");
  });

  it("sends the Arabic bank-details mail to the customer first, then tells the owner", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await notifyBooking(booking, { env: envWithBank, fetchImpl: fetchImpl as never });
    expect(result).toEqual({ sent: true });
    const [customer, owner] = callsOf(fetchImpl);
    expect(callsOf(fetchImpl)).toHaveLength(2);
    expect(customer!.body["to"]).toEqual(["visitor@example.com"]);
    expect(customer!.headers["Idempotency-Key"]).toBe(`customer-${booking.submission_key}`);
    expect(String(customer!.body["subject"])).toContain("تم تأكيد حجزك");
    expect(String(customer!.body["text"])).toContain("IBAN: OM00TEST123");
    expect(String(customer!.body["text"])).not.toContain(" | "); // pipes become line breaks
    expect(String(owner!.body["text"])).toContain("Bank transfer details were emailed to the customer");
    expect(String(owner!.body["text"])).not.toContain("ACTION NEEDED");
  });

  it("sends the English customer mail when the customer prefers English", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await notifyBooking({ ...booking, preferred_language: "en" }, { env: envWithBank, fetchImpl: fetchImpl as never });
    expect(String(callsOf(fetchImpl)[0]!.body["subject"])).toContain("preliminarily confirmed");
  });

  it("does not e-mail the customer without an address, and flags it for the owner", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await notifyBooking({ ...booking, email: "" }, { env: envWithBank, fetchImpl: fetchImpl as never });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [owner] = callsOf(fetchImpl);
    expect(owner!.body["reply_to"]).toBeUndefined();
    expect(String(owner!.body["text"])).toContain("ACTION NEEDED");
  });

  it("a failed customer e-mail never blocks the owner e-mail", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: "validation_error" }), { status: 403 }))
      .mockResolvedValueOnce(okResponse());
    const result = await notifyBooking(booking, { env: envWithBank, fetchImpl: fetchImpl as never, retryDelayMs: 0 });
    expect(result).toEqual({ sent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(callsOf(fetchImpl)[1]!.body["text"])).toContain("The automatic email to the customer failed");
  });

  it("skips quietly when Resend is not configured", async () => {
    const fetchImpl = vi.fn();
    expect(await notifyBooking(booking, { env: {}, fetchImpl: fetchImpl as never })).toEqual({ sent: false, reason: "not_configured" });
    expect(await notifyBooking(booking, { env: { RESEND_API_KEY: API_KEY }, fetchImpl: fetchImpl as never })).toEqual({ sent: false, reason: "not_configured" });
    expect(await notifyBooking(booking, { env: { ...env, BOOKING_NOTIFY_TO: "not-an-email" }, fetchImpl: fetchImpl as never })).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("retries once after a network error with the same idempotency key", async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(okResponse());
    const result = await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, retryDelayMs: 0 });
    expect(result).toEqual({ sent: true });
    const [a, b] = callsOf(fetchImpl);
    expect(a!.headers["Idempotency-Key"]).toBe(b!.headers["Idempotency-Key"]);
    expect(a!.body).toEqual(b!.body);
  });

  it("retries on 5xx and 429, but not on other 4xx", async () => {
    const f500 = vi.fn().mockResolvedValueOnce(new Response("x", { status: 500 })).mockResolvedValueOnce(okResponse());
    expect(await notifyBooking(booking, { env, fetchImpl: f500 as never, retryDelayMs: 0 })).toEqual({ sent: true });
    expect(f500).toHaveBeenCalledTimes(2);
    const f429 = vi.fn().mockResolvedValueOnce(new Response("x", { status: 429 })).mockResolvedValueOnce(okResponse());
    expect(await notifyBooking(booking, { env, fetchImpl: f429 as never, retryDelayMs: 0 })).toEqual({ sent: true });
    const f403 = vi.fn(async () => new Response(JSON.stringify({ name: "validation_error" }), { status: 403 }));
    expect(await notifyBooking(booking, { env, fetchImpl: f403 as never, retryDelayMs: 0 })).toEqual({ sent: false, reason: "http_error" });
    expect(f403).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry and never throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const result = await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, retryDelayMs: 0 });
    expect(result).toEqual({ sent: false, reason: "network" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports a timeout", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const fetchImpl = vi.fn().mockRejectedValue(timeout);
    expect(await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, retryDelayMs: 0 })).toEqual({ sent: false, reason: "timeout" });
  });

  it("treats a 200 without an id as rejected", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>oops</html>", { status: 200 }));
    expect(await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, retryDelayMs: 0 })).toEqual({ sent: false, reason: "rejected" });
  });

  it("a manual resend uses a fresh idempotency key", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, fresh: true });
    const key = callsOf(fetchImpl)[0]!.headers["Idempotency-Key"]!;
    expect(key.startsWith(`owner-${booking.submission_key}-`)).toBe(true);
  });

  it("strips line breaks from the subject", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await notifyBooking({ ...booking, customer_name: "Evil\r\nBcc: x@y.z" }, { env, fetchImpl: fetchImpl as never });
    expect(String(callsOf(fetchImpl)[0]!.body["subject"])).not.toMatch(/[\r\n]/);
  });

  it("never logs the API key, e-mail addresses, or customer details", async () => {
    const fetchImpl = vi.fn(async () => new Response(
      JSON.stringify({ name: "validation_error", message: "only to visitor@example.com / owner@example.com" }),
      { status: 403 },
    ));
    await notifyBooking(booking, { env: envWithBank, fetchImpl: fetchImpl as never, retryDelayMs: 0 });
    const output = logs.join("\n");
    expect(output).toContain(booking.submission_key);
    for (const forbidden of [API_KEY, OWNER, "visitor@example.com", "Test Visitor", "+96800000000", "OM00TEST123"]) {
      expect(output).not.toContain(forbidden);
    }
  });
});
