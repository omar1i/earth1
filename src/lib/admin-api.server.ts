// Server-only: the administrator dashboard (page + JSON API) and the public image endpoint.
// Every /api/admin/* route except session / login / setup requires a valid administrator session.
import { z } from 'zod';
import adminHtml from './admin-ui.html?raw';
import * as auth from './auth.server';
import { getDb, getRuntimeEnv, getSecret, type D1Like } from './db.server';
import type { BookingInput } from './booking-schema';
import { SITE_IMAGE_KEYS, GALLERY_MAX } from './site-images';
import { readSiteImagesWith, writeSiteImage } from './site-images.server';
import { GALLERY_CATEGORY_IDS, GALLERY_DEFAULTS, GALLERY_PAGE_MAX } from './gallery-defaults';
import { readGalleryWith, writeGallery } from './gallery.server';

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...extra } });
}
const fail = (message: string, status = 400, extra: Record<string, string> = {}) => json({ error: message }, status, extra);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 400_000) throw new HttpError(413, 'Request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const r = schema.safeParse(value);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new HttpError(400, `${issue?.path.join('.') || 'Request'}: ${issue?.message ?? 'invalid value'}`);
  }
  return r.data;
}

// ------------------------------------------------------------------------------------------------
// Input schemas
// ------------------------------------------------------------------------------------------------
const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const biItem = z.object({ en: text(600), ar: text(600) });
const biList = z.array(biItem).max(60);
const itineraryItem = z.object({ title: biItem, text: z.object({ en: text(2000), ar: text(2000) }) });
const imageRef = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^(asset:[a-z0-9-]+|\/api\/images\/[a-f0-9]{16,64}|https:\/\/[^\s"'<>]+)$/.test(v), 'Use an uploaded image or an https:// image address.');

const IMAGE_REF = /^(asset:[a-z0-9-]+|\/api\/images\/[a-f0-9]{16,64}|https:\/\/[^\s"'<>]+)$/;
const galleryRef = z.string().trim().max(500).regex(IMAGE_REF, 'Use an uploaded image or an https:// image address.');

// Extras for private trips (stored as one JSON column): label on the photo, itinerary / cancellation switches and the "Our Boat" section.
const biLong = z.object({ en: text(2000).default(''), ar: text(2000).default('') });
const biShort = z.object({ en: text(600).default(''), ar: text(600).default('') });
const detailsSchema = z.object({
  tag: biShort.default({ en: '', ar: '' }),
  show_itinerary: z.boolean().default(false),
  show_cancellation: z.boolean().default(true),
  cancellation: z.array(biLong).max(30).default([]),
  boat: z.object({
    enabled: z.boolean().default(false),
    name: biShort.default({ en: '', ar: '' }),
    tagline: biShort.default({ en: '', ar: '' }),
    description: biLong.default({ en: '', ar: '' }),
    image: imageRef,
    specs: z.array(z.object({ label: biShort, value: biShort })).max(12).default([]),
    amenities: z.array(biShort).max(30).default([]),
  }).default({ enabled: false, name: { en: '', ar: '' }, tagline: { en: '', ar: '' }, description: { en: '', ar: '' }, image: null, specs: [], amenities: [] }),
});

const tripSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{1,100}$/, 'Web address may only use a-z, 0-9 and dashes.').optional(),
  kind: z.enum(['group', 'private', 'experience']),
  category: optText(60),
  region: z.enum(['oman', 'international']).default('oman'),
  destination: optText(60),
  name_en: text(200).min(1, 'English name is required.'),
  name_ar: text(200).min(1, 'Arabic name is required.'),
  description_en: text(5000).default(''),
  description_ar: text(5000).default(''),
  image: imageRef,
  // Extra photos for the slideshow on a group trip (the main `image` above stays the cover).
  images: z.array(galleryRef).max(12, 'You can add up to 12 extra photos.').optional(),
  // Private-trip page extras (label, itinerary / cancellation switches, boat section). Only saved when sent.
  details: detailsSchema.optional(),
  location_en: optText(200), location_ar: optText(200),
  duration_en: optText(200), duration_ar: optText(200),
  group_size_en: optText(200), group_size_ar: optText(200),
  max_group: z.number().int().min(1).max(1000).nullish().transform((v) => v ?? null),
  accommodation_en: optText(500), accommodation_ar: optText(500),
  price: z.number().min(0).max(1_000_000).nullish().transform((v) => v ?? null),
  price_type: z.enum(['fixed', 'person', 'group', 'contact']).default('contact'),
  itinerary: z.array(itineraryItem).max(60).default([]),
  inclusions: biList.default([]), exclusions: biList.default([]), requirements: biList.default([]), terms: biList.default([]),
  is_sample: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(-100000).max(100000).default(0),
});
type TripInput = z.infer<typeof tripSchema>;

const scheduleSchema = z.object({
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.').refine((d) => new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d, 'Use a valid date.'),
  departure_time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 08:30.').nullish().transform((v) => v || null),
  label_en: optText(120), label_ar: optText(120),
  capacity: z.number().int().min(0).max(1000),
  status: z.enum(['open', 'closed']).default('open'),
});

const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'contacted', 'confirmed', 'cancelled']).optional(),
  admin_notes: z.string().trim().max(4000).nullish().transform((v) => (v === undefined ? undefined : v || null)).optional(),
  participant_count: z.number().int().min(1).max(200).optional(),
});

const passwordRules = (value: string) => auth.validatePasswordStrength(value);

// ------------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------------
const TRIP_COLUMNS = [
  'category', 'region', 'destination', 'name_en', 'name_ar', 'description_en', 'description_ar', 'image', 'images', 'details',
  'location_en', 'location_ar', 'duration_en', 'duration_ar', 'group_size_en', 'group_size_ar', 'max_group',
  'accommodation_en', 'accommodation_ar', 'price', 'price_type', 'itinerary', 'inclusions', 'exclusions',
  'requirements', 'terms', 'is_sample', 'is_active', 'sort_order',
] as const;

function tripValues(v: TripInput, cols: readonly string[] = TRIP_COLUMNS): unknown[] {
  const r = v as unknown as Record<string, unknown>;
  return cols.map((c) => {
    const x = r[c];
    if (c === 'itinerary' || c === 'inclusions' || c === 'exclusions' || c === 'requirements' || c === 'terms' || c === 'images') return JSON.stringify(x ?? []);
    if (c === 'details') return JSON.stringify(x ?? {});
    if (c === 'is_sample' || c === 'is_active') return x ? 1 : 0;
    return x === undefined ? null : x;
  });
}

// The extra columns (group-trip photos, private-trip details) are added to older databases automatically
// the first time they are needed, so no manual migration command is required.
let extraColumnsReady = false;
async function ensureExtraColumns(db: D1Like): Promise<void> {
  if (extraColumnsReady) return;
  const info = await db.prepare('PRAGMA table_info(trips)').all<{ name: string }>();
  const have = new Set((info.results ?? []).map((c) => c.name));
  const wanted: [string, string][] = [['images', "TEXT NOT NULL DEFAULT '[]'"], ['details', "TEXT NOT NULL DEFAULT '{}'"]];
  for (const [name, def] of wanted) {
    if (have.has(name)) continue;
    try {
      await db.prepare(`ALTER TABLE trips ADD COLUMN ${name} ${def}`).run();
    } catch (e) {
      if (!/duplicate column/i.test(e instanceof Error ? e.message : String(e))) throw e;
    }
  }
  extraColumnsReady = true;
}

function slugify(name: string): string {
  const s = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return s || 'trip-' + Math.random().toString(36).slice(2, 8);
}

const constraintMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => '\\' + m);
const intParam = (v: string | null, def: number, min: number, max: number) => {
  const n = v === null ? def : Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

type Ctx = { db: D1Like; request: Request; url: URL; session: auth.AdminSession; params: string[] };
type Handler = (ctx: Ctx) => Promise<Response>;

// ------------------------------------------------------------------------------------------------
// Handlers
// ------------------------------------------------------------------------------------------------
const summary: Handler = async ({ db }) => {
  const [byStatus, upcoming, counts] = await db.batch<Record<string, unknown>>([
    db.prepare('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status'),
    db.prepare(
      `SELECT s.id, s.departure_date, s.departure_time, s.capacity, s.seats_booked, s.status, t.name_en AS trip_name
       FROM trip_schedules s JOIN trips t ON t.id = s.trip_id
       WHERE s.departure_date >= ?1 ORDER BY s.departure_date LIMIT 8`,
    ).bind(new Date().toISOString().slice(0, 10)),
    db.prepare(
      `SELECT (SELECT COUNT(*) FROM trips) AS trips, (SELECT COUNT(*) FROM trips WHERE is_active = 1) AS active_trips,
              (SELECT COUNT(*) FROM bookings WHERE email_sent = 0) AS email_unsent`,
    ),
  ]);
  return json({ byStatus: byStatus?.results ?? [], upcoming: upcoming?.results ?? [], counts: counts?.results?.[0] ?? {} });
};

const listTrips: Handler = async ({ db }) => {
  const r = await db
    .prepare(
      `SELECT t.*,
        (SELECT COUNT(*) FROM trip_schedules s WHERE s.trip_id = t.id) AS schedule_count,
        (SELECT COUNT(*) FROM bookings b WHERE b.trip_id = t.id AND b.status <> 'cancelled') AS booking_count
       FROM trips t ORDER BY t.kind, t.sort_order, t.id`,
    )
    .all();
  return json({ trips: r.results });
};

const getTrip: Handler = async ({ db, params }) => {
  const id = Number(params[0]);
  const trip = await db.prepare('SELECT * FROM trips WHERE id = ?1').bind(id).first();
  if (!trip) return fail('Trip not found.', 404);
  const schedules = await db.prepare('SELECT * FROM trip_schedules WHERE trip_id = ?1 ORDER BY departure_date, departure_time').bind(id).all();
  const bookings = await db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE trip_id = ?1").bind(id).first<{ n: number }>();
  return json({ trip, schedules: schedules.results, bookingCount: bookings?.n ?? 0 });
};

const createTrip: Handler = async ({ db, request }) => {
  const v = parse(tripSchema, await readJson(request));
  await ensureExtraColumns(db);
  let slug = v.slug ?? slugify(v.name_en);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const taken =
      v.kind === 'experience'
        ? await db.prepare("SELECT 1 AS x FROM trips WHERE kind = 'experience' AND slug = ?1").bind(candidate).first()
        : await db.prepare("SELECT 1 AS x FROM trips WHERE kind IN ('group','private') AND slug = ?1").bind(candidate).first();
    if (!taken) {
      slug = candidate;
      break;
    }
    if (v.slug) throw new HttpError(409, 'A trip with this web address already exists. Choose another.');
  }
  try {
    const cols = ['slug', 'kind', ...TRIP_COLUMNS];
    const res = await db
      .prepare(`INSERT INTO trips (${cols.join(', ')}) VALUES (${cols.map((_, i) => '?' + (i + 1)).join(', ')})`)
      .bind(slug, v.kind, ...tripValues(v))
      .run();
    return json({ id: res.meta.last_row_id, slug }, 201);
  } catch (e) {
    if (/UNIQUE/i.test(constraintMessage(e))) throw new HttpError(409, 'A trip with this web address already exists.');
    throw e;
  }
};

const updateTrip: Handler = async ({ db, request, params }) => {
  const id = Number(params[0]);
  const existing = await db.prepare('SELECT id, kind FROM trips WHERE id = ?1').bind(id).first<{ id: number; kind: string }>();
  if (!existing) return fail('Trip not found.', 404);
  const body = (await readJson(request)) as Record<string, unknown>;
  const v = parse(tripSchema, { ...body, kind: existing.kind });
  // Only touch the photos / details columns when the request carries them (an old open admin tab never wipes them).
  if (v.images !== undefined || v.details !== undefined) await ensureExtraColumns(db);
  const cols = TRIP_COLUMNS.filter((c) => (c !== 'images' || v.images !== undefined) && (c !== 'details' || v.details !== undefined));
  const sets = cols.map((c, i) => `${c} = ?${i + 1}`).join(', ');
  await db
    .prepare(`UPDATE trips SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?${cols.length + 1}`)
    .bind(...tripValues(v, cols), id)
    .run();
  return json({ ok: true });
};

const deleteTrip: Handler = async ({ db, params }) => {
  const id = Number(params[0]);
  const [, , , del] = await db.batch([
    db.prepare('UPDATE bookings SET schedule_id = NULL WHERE schedule_id IN (SELECT id FROM trip_schedules WHERE trip_id = ?1)').bind(id),
    db.prepare('UPDATE bookings SET trip_id = NULL WHERE trip_id = ?1').bind(id),
    db.prepare('DELETE FROM trip_schedules WHERE trip_id = ?1').bind(id),
    db.prepare('DELETE FROM trips WHERE id = ?1').bind(id),
  ]);
  if (!del?.meta.changes) return fail('Trip not found.', 404);
  return json({ ok: true });
};

const createSchedule: Handler = async ({ db, request, params }) => {
  const tripId = Number(params[0]);
  const trip = await db.prepare('SELECT kind FROM trips WHERE id = ?1').bind(tripId).first<{ kind: string }>();
  if (!trip) return fail('Trip not found.', 404);
  if (trip.kind !== 'group') return fail('Departures and seats apply to group trips only.', 400);
  const v = parse(scheduleSchema, await readJson(request));
  const res = await db
    .prepare('INSERT INTO trip_schedules (trip_id, departure_date, departure_time, label_en, label_ar, capacity, status) VALUES (?1,?2,?3,?4,?5,?6,?7)')
    .bind(tripId, v.departure_date, v.departure_time, v.label_en, v.label_ar, v.capacity, v.status)
    .run();
  return json({ id: res.meta.last_row_id }, 201);
};

const updateSchedule: Handler = async ({ db, request, params }) => {
  const id = Number(params[0]);
  const v = parse(scheduleSchema, await readJson(request));
  try {
    const res = await db
      .prepare(
        `UPDATE trip_schedules SET departure_date = ?1, departure_time = ?2, label_en = ?3, label_ar = ?4, capacity = ?5, status = ?6,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?7`,
      )
      .bind(v.departure_date, v.departure_time, v.label_en, v.label_ar, v.capacity, v.status, id)
      .run();
    if (!res.meta.changes) return fail('Departure not found.', 404);
  } catch (e) {
    if (/CHECK constraint failed/i.test(constraintMessage(e))) return fail('Capacity cannot be lower than the seats already booked. Cancel or move bookings first.', 409);
    throw e;
  }
  return json({ ok: true });
};

const deleteSchedule: Handler = async ({ db, params }) => {
  const id = Number(params[0]);
  const [, del] = await db.batch([
    db.prepare('UPDATE bookings SET schedule_id = NULL WHERE schedule_id = ?1').bind(id),
    db.prepare('DELETE FROM trip_schedules WHERE id = ?1').bind(id),
  ]);
  if (!del?.meta.changes) return fail('Departure not found.', 404);
  return json({ ok: true });
};

const listBookings: Handler = async ({ db, url }) => {
  const where: string[] = [];
  const args: unknown[] = [];
  const add = (sql: string, ...vals: unknown[]) => {
    let n = args.length;
    where.push(sql.replace(/\?/g, () => `?${++n}`));
    args.push(...vals);
  };
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (q) {
    const like = `%${likeEscape(q)}%`;
    add(`(b.customer_name LIKE ? ESCAPE '\\' OR b.contact_number LIKE ? ESCAPE '\\' OR b.email LIKE ? ESCAPE '\\' OR b.id LIKE ? ESCAPE '\\' OR b.trip_name LIKE ? ESCAPE '\\')`, like, like, like, like, like);
  }
  const status = url.searchParams.get('status');
  if (status && ['pending', 'contacted', 'confirmed', 'cancelled'].includes(status)) add('b.status = ?', status);
  const trip = url.searchParams.get('trip');
  if (trip && /^\d+$/.test(trip)) add('b.trip_id = ?', Number(trip));
  const schedule = url.searchParams.get('schedule');
  if (schedule && /^\d+$/.test(schedule)) add('b.schedule_id = ?', Number(schedule));
  const from = url.searchParams.get('from');
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) add('b.preferred_date >= ?', from);
  const to = url.searchParams.get('to');
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) add('b.preferred_date <= ?', to);
  if (url.searchParams.get('email') === 'unsent') add('b.email_sent = 0');
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const limit = intParam(url.searchParams.get('limit'), 50, 1, 200);
  const offset = intParam(url.searchParams.get('offset'), 0, 0, 1_000_000);
  const total = await db.prepare(`SELECT COUNT(*) AS n FROM bookings b ${clause}`).bind(...args).first<{ n: number }>();
  const rows = await db
    .prepare(
      `SELECT b.*, s.departure_date AS departure_date, s.departure_time AS departure_time
       FROM bookings b LEFT JOIN trip_schedules s ON s.id = b.schedule_id ${clause}
       ORDER BY b.created_at DESC LIMIT ?${args.length + 1} OFFSET ?${args.length + 2}`,
    )
    .bind(...args, limit, offset)
    .all();
  return json({ bookings: rows.results, total: total?.n ?? 0, limit, offset });
};

const updateBooking: Handler = async ({ db, request, params }) => {
  const id = params[0]!;
  const v = parse(bookingUpdateSchema, await readJson(request));
  const sets: string[] = [];
  const args: unknown[] = [];
  if (v.status !== undefined) { args.push(v.status); sets.push(`status = ?${args.length}`); }
  if (v.admin_notes !== undefined) { args.push(v.admin_notes); sets.push(`admin_notes = ?${args.length}`); }
  if (v.participant_count !== undefined) { args.push(v.participant_count); sets.push(`participant_count = ?${args.length}`); }
  if (!sets.length) return fail('Nothing to update.');
  args.push(id);
  try {
    const res = await db
      .prepare(`UPDATE bookings SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?${args.length}`)
      .bind(...args)
      .run();
    if (!res.meta.changes) return fail('Booking not found.', 404);
  } catch (e) {
    if (/CHECK constraint failed/i.test(constraintMessage(e))) return fail('Not enough seats left on this departure for that change.', 409);
    throw e;
  }
  return json({ ok: true });
};

const deleteBooking: Handler = async ({ db, params }) => {
  const res = await db.prepare('DELETE FROM bookings WHERE id = ?1').bind(params[0]).run();
  if (!res.meta.changes) return fail('Booking not found.', 404);
  return json({ ok: true });
};

const resendEmail: Handler = async ({ db, params }) => {
  const b = await db.prepare('SELECT * FROM bookings WHERE id = ?1').bind(params[0]).first<Record<string, string | number | null>>();
  if (!b) return fail('Booking not found.', 404);
  const input: BookingInput = {
    submission_key: String(b['id']),
    experience_id: String(b['trip_slug']),
    customer_name: String(b['customer_name']),
    contact_number: String(b['contact_number']),
    email: b['email'] ? String(b['email']) : '',
    preferred_date: String(b['preferred_date']),
    participant_count: Number(b['participant_count']),
    preferred_language: b['preferred_language'] === 'ar' ? 'ar' : 'en',
    special_requirements: b['special_requirements'] ? String(b['special_requirements']) : '',
    additional_notes: b['additional_notes'] ? String(b['additional_notes']) : '',
    terms_accepted: true,
  };
  const { notifyBooking } = await import('./booking-notify.server');
  const result = await notifyBooking(input, { tripName: String(b['trip_name']), env: await getRuntimeEnv(), fresh: true });
  if (!result.sent) return json({ sent: false, reason: result.reason }, 200);
  await db.prepare('UPDATE bookings SET email_sent = 1 WHERE id = ?1').bind(params[0]).run();
  return json({ sent: true });
};

// --- images ---------------------------------------------------------------------------------------
const MAX_IMAGE_BYTES = 1_200_000;
function sniffImage(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}
function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const uploadImage: Handler = async ({ db, request }) => {
  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.byteLength === 0) return fail('No image received.');
  if (buf.byteLength > MAX_IMAGE_BYTES) return fail('Image is too large (max about 1.2 MB). Choose a smaller picture.', 413);
  const mime = sniffImage(buf);
  if (!mime) return fail('Only JPEG, PNG or WebP images are allowed.', 415);
  const id = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');
  await db.prepare('INSERT INTO images (id, mime, data_base64, size_bytes) VALUES (?1,?2,?3,?4)').bind(id, mime, toBase64(buf), buf.byteLength).run();
  return json({ url: `/api/images/${id}` }, 201);
};

// --- About-page pictures --------------------------------------------------------------------------
const getSiteImagesAdmin: Handler = async ({ db }) => json({ images: await readSiteImagesWith(db) });
const siteImageSchema = z.object({
  key: z.enum(SITE_IMAGE_KEYS),
  value: z.union([z.null(), z.string().trim().max(500), z.array(galleryRef).max(GALLERY_MAX, `You can add up to ${GALLERY_MAX} photos.`)]),
});
// --- Gallery page photos --------------------------------------------------------------------------
const getGalleryAdmin: Handler = async ({ db }) => {
  const rows = await readGalleryWith(db);
  return json({ photos: rows.length ? rows : GALLERY_DEFAULTS, isDefault: rows.length === 0 });
};
const galleryPageSchema = z.object({
  photos: z
    .array(
      z.object({
        image: galleryRef,
        title_en: z.string().trim().max(120, 'Titles can have up to 120 characters.'),
        title_ar: z.string().trim().max(120, 'Titles can have up to 120 characters.'),
        category: z.enum(GALLERY_CATEGORY_IDS).nullish().transform((v) => v ?? null),
      }),
    )
    .max(GALLERY_PAGE_MAX, `The gallery can have up to ${GALLERY_PAGE_MAX} photos.`),
});
const putGalleryAdmin: Handler = async ({ db, request }) => {
  const v = parse(galleryPageSchema, await readJson(request));
  await writeGallery(db, v.photos);
  return json({ ok: true });
};
const putSiteImage: Handler = async ({ db, request }) => {
  const v = parse(siteImageSchema, await readJson(request));
  if (v.key === 'gallery') {
    if (v.value !== null && !Array.isArray(v.value)) return fail('The gallery needs a list of photos.');
  } else if (Array.isArray(v.value)) {
    return fail('This spot takes a single picture.');
  } else if (typeof v.value === 'string' && v.value !== '' && !IMAGE_REF.test(v.value)) {
    return fail('Use an uploaded image or an https:// image address.');
  }
  await writeSiteImage(db, v.key, v.value);
  return json({ ok: true });
};

type EdgeCache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> };
async function serveImage(id: string): Promise<Response> {
  if (!/^[a-f0-9]{16,64}$/.test(id)) return new Response('Not found', { status: 404 });
  // Edge cache: after the first visitor, the picture is served from Cloudflare's cache instead of D1.
  // (Cloudflare only caches on a custom domain; on *.workers.dev these calls simply do nothing.)
  const cache = (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default;
  const cacheKey = new Request(`https://images.cache.invalid/${id}`);
  try {
    const hit = await cache?.match(cacheKey);
    if (hit) return hit;
  } catch { /* fall through to D1 */ }
  const db = await getDb();
  if (!db) return new Response('Not found', { status: 404 });
  const row = await db.prepare('SELECT mime, data_base64 FROM images WHERE id = ?1').bind(id).first<{ mime: string; data_base64: string }>();
  if (!row) return new Response('Not found', { status: 404 });
  const bin = atob(row.data_base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const response = new Response(bytes, {
    headers: { 'content-type': row.mime, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" },
  });
  try {
    await cache?.put(cacheKey, response.clone());
  } catch { /* caching is optional */ }
  return response;
}

// --- account --------------------------------------------------------------------------------------
const changePassword: Handler = async ({ db, request, session }) => {
  const v = parse(z.object({ current: z.string().max(200), next: z.string().max(200) }), await readJson(request));
  const weak = passwordRules(v.next);
  if (weak) return fail(weak);
  const row = await db.prepare('SELECT password_hash FROM admin_users WHERE id = ?1').bind(session.userId).first<{ password_hash: string }>();
  if (!row || !(await auth.verifyPassword(v.current, row.password_hash))) return fail('Current password is incorrect.', 403);
  await db.prepare('UPDATE admin_users SET password_hash = ?1 WHERE id = ?2').bind(await auth.hashPassword(v.next), session.userId).run();
  await auth.destroyOtherSessions(db, session.userId, request);
  return json({ ok: true });
};

// ------------------------------------------------------------------------------------------------
// Routing
// ------------------------------------------------------------------------------------------------
const routes: { method: string; pattern: RegExp; handler: Handler }[] = [
  { method: 'GET', pattern: /^\/api\/admin\/summary$/, handler: summary },
  { method: 'GET', pattern: /^\/api\/admin\/trips$/, handler: listTrips },
  { method: 'POST', pattern: /^\/api\/admin\/trips$/, handler: createTrip },
  { method: 'GET', pattern: /^\/api\/admin\/trips\/(\d+)$/, handler: getTrip },
  { method: 'PUT', pattern: /^\/api\/admin\/trips\/(\d+)$/, handler: updateTrip },
  { method: 'DELETE', pattern: /^\/api\/admin\/trips\/(\d+)$/, handler: deleteTrip },
  { method: 'POST', pattern: /^\/api\/admin\/trips\/(\d+)\/schedules$/, handler: createSchedule },
  { method: 'PUT', pattern: /^\/api\/admin\/schedules\/(\d+)$/, handler: updateSchedule },
  { method: 'DELETE', pattern: /^\/api\/admin\/schedules\/(\d+)$/, handler: deleteSchedule },
  { method: 'GET', pattern: /^\/api\/admin\/bookings$/, handler: listBookings },
  { method: 'PUT', pattern: /^\/api\/admin\/bookings\/([A-Za-z0-9-]{8,64})$/, handler: updateBooking },
  { method: 'DELETE', pattern: /^\/api\/admin\/bookings\/([A-Za-z0-9-]{8,64})$/, handler: deleteBooking },
  { method: 'POST', pattern: /^\/api\/admin\/bookings\/([A-Za-z0-9-]{8,64})\/resend-email$/, handler: resendEmail },
  { method: 'POST', pattern: /^\/api\/admin\/images$/, handler: uploadImage },
  { method: 'GET', pattern: /^\/api\/admin\/site-images$/, handler: getSiteImagesAdmin },
  { method: 'PUT', pattern: /^\/api\/admin\/site-images$/, handler: putSiteImage },
  { method: 'GET', pattern: /^\/api\/admin\/gallery$/, handler: getGalleryAdmin },
  { method: 'PUT', pattern: /^\/api\/admin\/gallery$/, handler: putGalleryAdmin },
  { method: 'POST', pattern: /^\/api\/admin\/password$/, handler: changePassword },
];

async function sessionInfo(request: Request): Promise<Response> {
  const db = await getDb();
  if (!db) return json({ dbConnected: false, authenticated: false, needsSetup: false });
  try {
    const session = await auth.getSession(db, request);
    const users = await db.prepare('SELECT COUNT(*) AS n FROM admin_users').first<{ n: number }>();
    return json({ dbConnected: true, authenticated: !!session, username: session?.username ?? null, needsSetup: (users?.n ?? 0) === 0 });
  } catch {
    return json({ dbConnected: false, migrated: false, authenticated: false, needsSetup: false });
  }
}

const sha = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}

async function loginOrSetup(request: Request, mode: 'login' | 'setup'): Promise<Response> {
  const db = await getDb();
  if (!db) return fail('The database is not connected yet. See DEPLOY.txt.', 503);
  const ip = auth.clientIp(request);
  if (await auth.tooManyFailures(db, ip)) return fail('Too many attempts. Wait 15 minutes and try again.', 429);
  const body = (await readJson(request)) as Record<string, unknown>;
  const username = typeof body['username'] === 'string' ? body['username'].trim() : '';
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  if (password.length > 200 || username.length > 60) return fail('Invalid credentials.', 401);

  if (mode === 'setup') {
    const secret = await getSecret('ADMIN_SETUP_TOKEN');
    if (!secret || secret.length < 16) return fail('ADMIN_SETUP_TOKEN is not configured on the server (it must be at least 16 characters). See DEPLOY.txt.', 503);
    const users = await db.prepare('SELECT COUNT(*) AS n FROM admin_users').first<{ n: number }>();
    if ((users?.n ?? 0) > 0) return fail('An administrator already exists. Please log in.', 403);
    const token = typeof body['token'] === 'string' ? body['token'] : '';
    if (!(await constantTimeEqual(token, secret))) {
      await auth.recordFailure(db, ip);
      return fail('Setup token is incorrect.', 403);
    }
    if (!/^[A-Za-z0-9._@-]{3,60}$/.test(username)) return fail('Username must be 3-60 characters (letters, numbers, . _ @ -).');
    const weak = passwordRules(password);
    if (weak) return fail(weak);
    const res = await db
      .prepare('INSERT INTO admin_users (username, password_hash) SELECT ?1, ?2 WHERE NOT EXISTS (SELECT 1 FROM admin_users)')
      .bind(username, await auth.hashPassword(password))
      .run();
    if (!res.meta.changes) return fail('An administrator already exists. Please log in.', 403);
    const user = await db.prepare('SELECT id FROM admin_users WHERE username = ?1').bind(username).first<{ id: number }>();
    const sessionToken = await auth.createSession(db, user!.id);
    return json({ ok: true }, 200, { 'Set-Cookie': auth.sessionCookie(sessionToken, request) });
  }

  const user = await db.prepare('SELECT id, password_hash FROM admin_users WHERE username = ?1').bind(username).first<{ id: number; password_hash: string }>();
  const valid = await auth.verifyPassword(password, user?.password_hash ?? auth.DUMMY_HASH);
  if (!user || !valid) {
    await auth.recordFailure(db, ip);
    return fail('Incorrect username or password.', 401);
  }
  await auth.clearFailures(db, ip);
  const sessionToken = await auth.createSession(db, user.id);
  return json({ ok: true }, 200, { 'Set-Cookie': auth.sessionCookie(sessionToken, request) });
}

/** Returns a Response for /admin, /api/admin/* and /api/images/*; null for anything else. */
export async function handleAdminRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (path === '/admin' || path.startsWith('/admin/')) {
    return new Response(adminHtml, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        ...SECURITY_HEADERS,
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      },
    });
  }

  const imageMatch = path.match(/^\/api\/images\/([a-f0-9]+)$/);
  if (imageMatch && (method === 'GET' || method === 'HEAD')) return serveImage(imageMatch[1]!);

  if (!path.startsWith('/api/admin/')) return null;

  try {
    // Public entry points of the dashboard: they never reveal data without credentials.
    if (path === '/api/admin/session' && method === 'GET') return await sessionInfo(request);
    if (method !== 'GET' && method !== 'HEAD' && !auth.sameOriginOk(request)) return fail('Blocked request.', 403);
    if (path === '/api/admin/login' && method === 'POST') return await loginOrSetup(request, 'login');
    if (path === '/api/admin/setup' && method === 'POST') return await loginOrSetup(request, 'setup');

    const db = await getDb();
    if (!db) return fail('The database is not connected yet. See DEPLOY.txt.', 503);

    if (path === '/api/admin/logout' && method === 'POST') {
      await auth.destroySession(db, request);
      return json({ ok: true }, 200, { 'Set-Cookie': auth.clearSessionCookie(request) });
    }

    // Everything below needs a valid administrator session, checked on every single request.
    const session = await auth.getSession(db, request);
    if (!session) return fail('Please log in.', 401);

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = path.match(r.pattern);
      if (m) return await r.handler({ db, request, url, session, params: m.slice(1) });
    }
    return fail('Not found.', 404);
  } catch (e) {
    if (e instanceof HttpError) return fail(e.message, e.status);
    console.error('[admin] error', e instanceof Error ? e.message : e);
    return fail('Something went wrong on the server. Please try again.', 500);
  }
}
