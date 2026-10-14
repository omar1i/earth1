// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real SQL migrations run against an in-memory SQLite (Node's built-in), wrapped to look like D1,
// so seat capacity, triggers and constraints are tested for real. Only the e-mail sender is mocked.
const notifyBooking = vi.fn();
let db: unknown = null;
vi.mock("@/lib/db.server", () => ({ getDb: async () => db, getRuntimeEnv: async () => ({}), getSecret: async () => undefined }));
vi.mock("../lib/db.server", () => ({ getDb: async () => db, getRuntimeEnv: async () => ({}), getSecret: async () => undefined }));
vi.mock("@/lib/booking-notify.server", () => ({ notifyBooking }));
vi.mock("../lib/booking-notify.server", () => ({ notifyBooking }));

type Row = Record<string, unknown>;
function makeD1() {
  const sqlite = (process as unknown as { getBuiltinModule: (n: string) => { DatabaseSync: new (p: string) => any } }).getBuiltinModule("node:sqlite");
  const s = new sqlite.DatabaseSync(":memory:");
  s.exec("PRAGMA foreign_keys=ON");
  for (const f of ["0001_init.sql", "0002_seed_existing_content.sql"]) s.exec(fs.readFileSync(path.resolve(process.cwd(), "migrations", f), "utf8"));
  s.exec("UPDATE trip_schedules SET departure_date = '2099-01-01'"); // keep seeded departures in the future
  const stmt = (sql: string) => {
    let args: unknown[] = [];
    const o = {
      bind(...a: unknown[]) { args = a; return o; },
      first: async () => (s.prepare(sql).get(...args) as Row | undefined) ?? null,
      all: async () => ({ results: s.prepare(sql).all(...args) as Row[], success: true, meta: {} }),
      run: async () => { const r = s.prepare(sql).run(...args); return { results: [], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
    };
    return o;
  };
  return { prepare: stmt, batch: async (list: { run: () => Promise<unknown> }[]) => { const out = []; for (const x of list) out.push(await x.run()); return out; }, raw: s };
}

const { processBooking } = await import("@/lib/bookings.server");
const { muscatToday } = await import("@/lib/booking-schema");
type Input = Parameters<typeof processBooking>[0];

let n = 0;
const input = (over: Partial<Input> = {}): Input => ({
  submission_key: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  experience_id: "salalah", customer_name: "Test Visitor", contact_number: `+9687000${String(n).padStart(4, "0")}`,
  email: "", preferred_date: muscatToday(), participant_count: 2, preferred_language: "en",
  special_requirements: "", additional_notes: "", terms_accepted: true, ...over,
});
const count = (sql: string, ...a: unknown[]) => Number((((db as ReturnType<typeof makeD1>).raw.prepare(sql).get(...a)) as Row)["c"]);
const groupSchedule = () => ((db as ReturnType<typeof makeD1>).raw.prepare("SELECT s.id, s.capacity FROM trip_schedules s JOIN trips t ON t.id = s.trip_id WHERE t.slug = 'masirah-island-trip'").get() as { id: number; capacity: number });

beforeEach(() => {
  db = makeD1();
  notifyBooking.mockReset().mockResolvedValue({ sent: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("processBooking with D1", () => {
  it("stores the booking, sends the e-mail and marks it sent", async () => {
    const data = input();
    expect(await processBooking(data)).toEqual({ ok: true, reference: data.submission_key, emailed: true });
    expect(count("SELECT COUNT(*) AS c FROM bookings WHERE email_sent = 1")).toBe(1);
    expect(notifyBooking).toHaveBeenCalledTimes(1);
  });

  it("keeps the booking when the e-mail fails and flags it for the dashboard", async () => {
    notifyBooking.mockResolvedValue({ sent: false, reason: "network" });
    const data = input();
    expect(await processBooking(data)).toEqual({ ok: true, reference: data.submission_key, emailed: false });
    expect(count("SELECT COUNT(*) AS c FROM bookings WHERE email_sent = 0")).toBe(1);
  });

  it("a retry with the same reference never creates a duplicate and re-attempts the e-mail", async () => {
    notifyBooking.mockResolvedValueOnce({ sent: false, reason: "timeout" });
    const data = input();
    await processBooking(data);
    expect(await processBooking(data)).toEqual({ ok: true, reference: data.submission_key, emailed: true });
    expect(count("SELECT COUNT(*) AS c FROM bookings")).toBe(1);
  });

  it("rejects unknown trips", async () => {
    expect(await processBooking(input({ experience_id: "does-not-exist" }))).toEqual({ ok: false, error: "invalid_trip" });
  });

  it("never overbooks a group trip departure", async () => {
    const s = groupSchedule();
    expect((await processBooking(input({ experience_id: "masirah-island-trip", schedule_id: s.id, participant_count: s.capacity - 1 }))).ok).toBe(true);
    expect(await processBooking(input({ experience_id: "masirah-island-trip", schedule_id: s.id, participant_count: 2 }))).toEqual({ ok: false, error: "not_enough_seats", seatsLeft: 1 });
    expect((await processBooking(input({ experience_id: "masirah-island-trip", schedule_id: s.id, participant_count: 1 }))).ok).toBe(true);
    expect(await processBooking(input({ experience_id: "masirah-island-trip", schedule_id: s.id, participant_count: 1 }))).toEqual({ ok: false, error: "sold_out", seatsLeft: 0 });
    expect(count("SELECT seats_booked AS c FROM trip_schedules WHERE id = ?1", s.id)).toBe(s.capacity);
  });

  it("frees the seats when a booking is cancelled", async () => {
    const s = groupSchedule();
    const data = input({ experience_id: "masirah-island-trip", schedule_id: s.id, participant_count: 5 });
    await processBooking(data);
    expect(count("SELECT seats_booked AS c FROM trip_schedules WHERE id = ?1", s.id)).toBe(5);
    (db as ReturnType<typeof makeD1>).raw.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?1").run(data.submission_key);
    expect(count("SELECT seats_booked AS c FROM trip_schedules WHERE id = ?1", s.id)).toBe(0);
  });

  it("uses the departure's own date for group trips, whatever the browser sent", async () => {
    const s = groupSchedule();
    await processBooking(input({ experience_id: "masirah-island-trip", schedule_id: s.id, preferred_date: muscatToday() }));
    expect(count("SELECT COUNT(*) AS c FROM bookings WHERE preferred_date = '2099-01-01'")).toBe(1);
  });
});

describe("processBooking without a database (e-mail-only fallback)", () => {
  beforeEach(() => { db = null; });
  it("succeeds when the e-mail is delivered", async () => {
    const data = input({ experience_id: "sea-fishing" });
    expect(await processBooking(data)).toEqual({ ok: true, reference: data.submission_key, emailed: true });
  });
  it("reports failure (no false promise) when the e-mail is not delivered", async () => {
    notifyBooking.mockResolvedValue({ sent: false, reason: "not_configured" });
    expect(await processBooking(input({ experience_id: "sea-fishing" }))).toEqual({ ok: false, error: "unavailable" });
  });
});
