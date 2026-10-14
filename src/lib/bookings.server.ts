// Server-only: stores a booking in D1, enforces seat capacity, then sends the owner e-mail.
import { getDb, type D1Like } from './db.server';
import { muscatToday, type BookingInput } from './booking-schema';
import { staticCatalog, type ScheduleRow, type TripRow } from './catalog';

export type BookingResult =
  | { ok: true; reference: string; emailed: boolean }
  | { ok: false; error: 'invalid_trip' | 'invalid_departure' | 'no_departure' | 'schedule_required' | 'sold_out' | 'not_enough_seats' | 'too_many' | 'unavailable' | 'save_failed'; seatsLeft?: number };

type EmailInfo = { tripName: string; departure?: string };

async function sendOwnerEmail(booking: BookingInput, info: EmailInfo): Promise<boolean> {
  try {
    const { notifyBooking } = await import('./booking-notify.server');
    return (await notifyBooking(booking, info)).sent;
  } catch {
    console.error(`[booking-email] FAILED (unexpected) for booking ${booking.submission_key}.`);
    return false;
  }
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** No database connected (or not migrated yet): keep the original e-mail-only behaviour. */
async function legacyEmailOnly(data: BookingInput): Promise<BookingResult> {
  const cat = staticCatalog();
  const group = cat.groupTrips.find((g) => g.id === data.experience_id);
  const known = group || cat.privateDestinations.some((d) => d.id === data.experience_id) || cat.experiences.some((e) => e.id === data.experience_id);
  if (!known) return { ok: false, error: 'invalid_trip' };
  if (group && data.preferred_date !== group.startDate) return { ok: false, error: 'invalid_departure' };
  const name = group?.name.en ?? cat.privateDestinations.find((d) => d.id === data.experience_id)?.name.en ?? cat.experiences.find((e) => e.id === data.experience_id)?.name.en ?? data.experience_id;
  const emailed = await sendOwnerEmail(data, { tripName: name });
  if (!emailed) {
    console.error(`[booking] Booking ${data.submission_key} was NOT delivered by email and no database is connected.`);
    return { ok: false, error: 'unavailable' };
  }
  return { ok: true, reference: data.submission_key, emailed: true };
}

async function findTrip(db: D1Like, slug: string): Promise<TripRow | null> {
  const bookable = await db
    .prepare("SELECT * FROM trips WHERE slug = ?1 AND is_active = 1 AND kind IN ('group','private') LIMIT 1")
    .bind(slug)
    .first<TripRow>();
  if (bookable) return bookable;
  return db.prepare("SELECT * FROM trips WHERE slug = ?1 AND is_active = 1 AND kind = 'experience' LIMIT 1").bind(slug).first<TripRow>();
}

export async function processBooking(data: BookingInput): Promise<BookingResult> {
  const db = await getDb();
  if (!db) return legacyEmailOnly(data);

  try {
    const trip = await findTrip(db, data.experience_id);
    if (!trip) return { ok: false, error: 'invalid_trip' };

    // 1. Idempotency: a retry of the same submission never creates a second record.
    const existing = await db
      .prepare('SELECT id, email_sent, trip_name FROM bookings WHERE id = ?1')
      .bind(data.submission_key)
      .first<{ id: string; email_sent: number; trip_name: string }>();
    if (existing) return finishExisting(db, data, existing.trip_name, existing.email_sent === 1);

    // 2. Same person double-clicking from two tabs: treat an identical request in the last 3 minutes as a duplicate.
    const dupe = await db
      .prepare(
        `SELECT id, email_sent, trip_name FROM bookings
         WHERE contact_number = ?1 AND trip_slug = ?2 AND preferred_date = ?3 AND participant_count = ?4
           AND status <> 'cancelled' AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-3 minutes') LIMIT 1`,
      )
      .bind(data.contact_number, trip.slug, data.preferred_date, data.participant_count)
      .first<{ id: string; email_sent: number; trip_name: string }>();
    if (dupe) return { ok: true, reference: dupe.id, emailed: dupe.email_sent === 1 };

    // 3. Basic abuse limit per phone number.
    const recent = await db
      .prepare("SELECT COUNT(*) AS n FROM bookings WHERE contact_number = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 hour')")
      .bind(data.contact_number)
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= 5) return { ok: false, error: 'too_many' };

    // 4. Group trips: pick and validate the departure. Everything is decided here, not in the browser.
    let scheduleId: number | null = null;
    let preferredDate = data.preferred_date;
    let departureLabel: string | undefined;
    if (trip.kind === 'group') {
      const rows = (
        await db
          .prepare("SELECT * FROM trip_schedules WHERE trip_id = ?1 AND status = 'open' AND departure_date >= ?2 ORDER BY departure_date, departure_time")
          .bind(trip.id, muscatToday())
          .all<ScheduleRow>()
      ).results;
      let chosen: ScheduleRow | undefined;
      if (data.schedule_id !== undefined) {
        chosen = rows.find((s) => s.id === data.schedule_id);
        if (!chosen) return { ok: false, error: 'invalid_departure' };
      } else if (rows.length === 1) {
        chosen = rows[0];
      } else if (rows.length === 0) {
        return { ok: false, error: 'no_departure' };
      } else {
        const byDate = rows.filter((s) => s.departure_date === data.preferred_date);
        if (byDate.length === 1) chosen = byDate[0];
        else return { ok: false, error: 'schedule_required' };
      }
      if (!chosen) return { ok: false, error: 'invalid_departure' };
      const left = chosen.capacity - chosen.seats_booked;
      if (left <= 0) return { ok: false, error: 'sold_out', seatsLeft: 0 };
      if (data.participant_count > left) return { ok: false, error: 'not_enough_seats', seatsLeft: left };
      scheduleId = chosen.id;
      preferredDate = chosen.departure_date;
      departureLabel = `${chosen.label_en?.trim() || chosen.departure_date}${chosen.departure_time ? ' ' + chosen.departure_time : ''}`;
    }

    // 5. Insert. The seat counter is updated by a trigger inside the same statement; the CHECK
    //    (seats_booked <= capacity) rolls the insert back if another booking took the last seats first.
    try {
      await db
        .prepare(
          `INSERT INTO bookings (id, trip_id, schedule_id, trip_slug, trip_name, customer_name, contact_number, email,
             preferred_date, participant_count, preferred_language, special_requirements, additional_notes, status, email_sent)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'pending', 0)`,
        )
        .bind(
          data.submission_key, trip.id, scheduleId, trip.slug, trip.name_en, data.customer_name, data.contact_number,
          data.email || null, preferredDate, data.participant_count, data.preferred_language,
          data.special_requirements || null, data.additional_notes || null,
        )
        .run();
    } catch (e) {
      const msg = errText(e);
      if (/CHECK constraint failed/i.test(msg)) return { ok: false, error: 'sold_out' };
      if (/UNIQUE constraint failed: bookings\.id/i.test(msg)) return finishExisting(db, data, trip.name_en, false);
      throw e;
    }

    // 6. Owner e-mail (existing Apps Script webhook). The booking is already safely stored, so an
    //    e-mail problem is recorded (email_sent = 0, visible in the dashboard) instead of losing the booking.
    const emailed = await sendOwnerEmail({ ...data, preferred_date: preferredDate }, { tripName: trip.name_en, ...(departureLabel ? { departure: departureLabel } : {}) });
    if (emailed) await db.prepare("UPDATE bookings SET email_sent = 1 WHERE id = ?1").bind(data.submission_key).run().catch(() => undefined);
    else console.error(`[booking] Booking ${data.submission_key} saved in D1 but the e-mail was NOT delivered; use "Resend e-mail" in the dashboard.`);
    return { ok: true, reference: data.submission_key, emailed };
  } catch (e) {
    const msg = errText(e);
    if (/no such table|no such column/i.test(msg)) {
      console.error('[booking] D1 is bound but not migrated; using e-mail-only mode.');
      return legacyEmailOnly(data);
    }
    console.error('[booking] database error', msg);
    return { ok: false, error: 'save_failed' };
  }
}

async function finishExisting(db: D1Like, data: BookingInput, tripName: string, alreadyEmailed: boolean): Promise<BookingResult> {
  let emailed = alreadyEmailed;
  if (!emailed) {
    emailed = await sendOwnerEmail(data, { tripName });
    if (emailed) await db.prepare('UPDATE bookings SET email_sent = 1 WHERE id = ?1').bind(data.submission_key).run().catch(() => undefined);
  }
  return { ok: true, reference: data.submission_key, emailed };
}
