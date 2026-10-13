// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const notifyBooking = vi.fn();

// Only TanStack's request plumbing is stubbed (validator + handler wiring); the real handler code runs.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate: (input: unknown) => unknown = (input) => input;
    const builder = {
      inputValidator(fn: (input: unknown) => unknown) {
        validate = fn;
        return builder;
      },
      handler(fn: (ctx: { data: unknown }) => unknown) {
        return async ({ data }: { data: unknown }) => fn({ data: validate(data) });
      },
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: () => undefined }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ insert }),
    auth: { getUser: async () => ({ error: null }) },
  }),
}));
vi.mock("@/lib/booking-notify.server", () => ({ notifyBooking }));
vi.mock("../lib/booking-notify.server", () => ({ notifyBooking }));

const { submitBooking } = await import("@/lib/booking.functions");
const { muscatToday } = await import("@/lib/booking-schema");

const data = () => ({
  submission_key: "55c1ad41-1b0e-4b1c-a513-7246ad52f3fb",
  experience_id: "sea-fishing" as const,
  customer_name: "Test Visitor",
  contact_number: "+96800000000",
  email: "",
  preferred_date: muscatToday(),
  participant_count: 2,
  preferred_language: "en" as const,
  special_requirements: "",
  additional_notes: "",
  terms_accepted: true as const,
  company_url: "",
});

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://db.example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fake");
  insert.mockReset().mockResolvedValue({ error: null });
  notifyBooking.mockReset().mockResolvedValue({ sent: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("submitBooking: email is primary, database is an optional backup", () => {
  it("emails and stores a backup copy, then reports success", async () => {
    const result = await submitBooking({ data: data() });
    expect(result).toEqual({ ok: true, reference: data().submission_key });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(notifyBooking).toHaveBeenCalledTimes(1);
  });

  it("works with NO database configured (email only)", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    expect(await submitBooking({ data: data() })).toEqual({
      ok: true,
      reference: data().submission_key,
    });
    expect(insert).not.toHaveBeenCalled();
    expect(notifyBooking).toHaveBeenCalledTimes(1);
  });

  it("does not send consent/honeypot fields to the database table", async () => {
    await submitBooking({ data: data() });
    const row = insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row).not.toHaveProperty("terms_accepted");
    expect(row).not.toHaveProperty("company_url");
    expect(row["id"]).toBe(data().submission_key);
  });

  it("still succeeds when the database backup fails but the email was delivered", async () => {
    insert.mockResolvedValue({ error: { code: "XX000" } });
    expect(await submitBooking({ data: data() })).toEqual({
      ok: true,
      reference: data().submission_key,
    });
    expect(notifyBooking).toHaveBeenCalledTimes(1);
  });

  it("still succeeds when the database throws unexpectedly", async () => {
    insert.mockRejectedValue(new Error("network down"));
    expect(await submitBooking({ data: data() })).toEqual({
      ok: true,
      reference: data().submission_key,
    });
  });

  it("reports failure (no false promise) when the email is not delivered", async () => {
    notifyBooking.mockResolvedValue({ sent: false, reason: "network" });
    expect(await submitBooking({ data: data() })).toEqual({ ok: false, error: "save_failed" });
  });

  it("reports failure when the email code throws unexpectedly", async () => {
    notifyBooking.mockRejectedValue(new Error("boom"));
    expect(await submitBooking({ data: data() })).toEqual({ ok: false, error: "save_failed" });
  });

  it("reports 'unavailable' when email fails and there is no database either", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    notifyBooking.mockResolvedValue({ sent: false, reason: "not_configured" });
    expect(await submitBooking({ data: data() })).toEqual({ ok: false, error: "unavailable" });
  });

  it("treats a retry of an already-stored booking as success and re-attempts the email", async () => {
    insert.mockResolvedValue({ error: { code: "23505" } });
    expect(await submitBooking({ data: data() })).toEqual({
      ok: true,
      reference: data().submission_key,
    });
    expect(notifyBooking).toHaveBeenCalledTimes(1);
  });

  it("rejects missing terms acceptance and the filled honeypot before doing anything", async () => {
    await expect(
      submitBooking({ data: { ...data(), terms_accepted: false as never } }),
    ).rejects.toThrow();
    await expect(submitBooking({ data: { ...data(), company_url: "spam" } })).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
    expect(notifyBooking).not.toHaveBeenCalled();
  });
});
