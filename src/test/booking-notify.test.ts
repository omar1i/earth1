// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyBooking } from "@/lib/booking-notify.server";
import type { BookingInput } from "@/lib/booking-schema";

const SECRET = "test-secret-value-123";
const URL_ = "https://script.example.invalid/macros/s/FAKE/exec";
const env = { BOOKING_WEBHOOK_URL: URL_, BOOKING_WEBHOOK_SECRET: SECRET };
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
const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

let logs: string[];
beforeEach(() => {
  logs = [];
  vi.spyOn(console, "error").mockImplementation((...a) => void logs.push(a.join(" ")));
  vi.spyOn(console, "warn").mockImplementation((...a) => void logs.push(a.join(" ")));
});
afterEach(() => vi.restoreAllMocks());

describe("notifyBooking", () => {
  it("posts the booking with the secret and reference, and reports success", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await notifyBooking(booking, { env, fetchImpl: fetchImpl as never });
    expect(result).toEqual({ sent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(URL_);
    const body = JSON.parse(String(init.body));
    expect(body.secret).toBe(SECRET);
    expect(body.reference).toBe(booking.submission_key);
    expect(body.experience_name).toBe("Sea Fishing Adventure");
    expect(body.terms_accepted).toBe(true);
    expect(body.customer_name).toBe("Test Visitor");
  });

  it("skips quietly when the webhook is not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await notifyBooking(booking, { env: {}, fetchImpl: fetchImpl as never });
    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("retries once after a network error and then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(okResponse());
    const result = await notifyBooking(booking, {
      env,
      fetchImpl: fetchImpl as never,
      retryDelayMs: 0,
    });
    expect(result).toEqual({ sent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after one retry and never throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const result = await notifyBooking(booking, {
      env,
      fetchImpl: fetchImpl as never,
      retryDelayMs: 0,
    });
    expect(result).toEqual({ sent: false, reason: "network" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports a timeout", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const fetchImpl = vi.fn().mockRejectedValue(timeout);
    const result = await notifyBooking(booking, {
      env,
      fetchImpl: fetchImpl as never,
      retryDelayMs: 0,
    });
    expect(result).toEqual({ sent: false, reason: "timeout" });
  });

  it("does not retry a 4xx and treats a non-JSON 200 (e.g. a sign-in page) as rejected", async () => {
    const f4xx = vi.fn(async () => new Response("nope", { status: 403 }));
    expect(
      await notifyBooking(booking, { env, fetchImpl: f4xx as never, retryDelayMs: 0 }),
    ).toEqual({ sent: false, reason: "http_error" });
    expect(f4xx).toHaveBeenCalledTimes(1);
    const fHtml = vi.fn(async () => new Response("<html>Sign in</html>", { status: 200 }));
    expect(
      await notifyBooking(booking, { env, fetchImpl: fHtml as never, retryDelayMs: 0 }),
    ).toEqual({ sent: false, reason: "rejected" });
  });

  it("treats {ok:false} from the script as rejected", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 200 }),
    );
    const result = await notifyBooking(booking, {
      env,
      fetchImpl: fetchImpl as never,
      retryDelayMs: 0,
    });
    expect(result).toEqual({ sent: false, reason: "rejected" });
  });

  it("never logs the secret, the webhook URL, or customer details", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError(`fetch failed ${URL_} ${SECRET}`));
    await notifyBooking(booking, { env, fetchImpl: fetchImpl as never, retryDelayMs: 0 });
    const output = logs.join("\n");
    expect(output).toContain(booking.submission_key);
    for (const forbidden of [SECRET, URL_, "Test Visitor", "+96800000000", "visitor@example.com"]) {
      expect(output).not.toContain(forbidden);
    }
  });
});
