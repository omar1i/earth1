-- Earth Adventure Oman: Cloudflare D1 schema (SQLite).
-- Apply with:  npx wrangler d1 migrations apply earth-adventure --remote

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------------------------
-- Trips. One row per public trip. kind:
--   'group'      scheduled group trip with its own detail page and departures (trip_schedules)
--   'private'    private-trip idea card (booked with a free preferred date)
--   'experience' inquiry-style experience (sea / camping / land / international)
-- Bilingual text lives in *_en / *_ar columns. List fields are JSON arrays stored as text.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE trips (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL CHECK (length(slug) BETWEEN 1 AND 100 AND slug NOT GLOB '*[^a-z0-9-]*'),
  kind            TEXT NOT NULL CHECK (kind IN ('group','private','experience')),
  category        TEXT,
  region          TEXT NOT NULL DEFAULT 'oman' CHECK (region IN ('oman','international')),
  destination     TEXT,
  name_en         TEXT NOT NULL CHECK (length(name_en) BETWEEN 1 AND 200),
  name_ar         TEXT NOT NULL CHECK (length(name_ar) BETWEEN 1 AND 200),
  description_en  TEXT NOT NULL DEFAULT '' CHECK (length(description_en) <= 5000),
  description_ar  TEXT NOT NULL DEFAULT '' CHECK (length(description_ar) <= 5000),
  image           TEXT,
  location_en     TEXT,
  location_ar     TEXT,
  duration_en     TEXT,
  duration_ar     TEXT,
  group_size_en   TEXT,
  group_size_ar   TEXT,
  max_group       INTEGER CHECK (max_group IS NULL OR max_group > 0),
  accommodation_en TEXT,
  accommodation_ar TEXT,
  price           REAL CHECK (price IS NULL OR price >= 0),
  price_type      TEXT NOT NULL DEFAULT 'contact' CHECK (price_type IN ('fixed','person','group','contact')),
  itinerary       TEXT NOT NULL DEFAULT '[]',   -- JSON: [{"title":{"en","ar"},"text":{"en","ar"}}]
  inclusions      TEXT NOT NULL DEFAULT '[]',   -- JSON: [{"en","ar"}]
  exclusions      TEXT NOT NULL DEFAULT '[]',
  requirements    TEXT NOT NULL DEFAULT '[]',
  terms           TEXT NOT NULL DEFAULT '[]',
  details         TEXT NOT NULL DEFAULT '{}',   -- JSON object: private-trip page extras (label on photo, itinerary / cancellation switches, boat section)
  is_sample       INTEGER NOT NULL DEFAULT 0 CHECK (is_sample IN (0,1)),
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (kind, slug)
);
-- Private and group trips share the booking form, so their slugs must not collide.
CREATE UNIQUE INDEX trips_bookable_slug ON trips (slug) WHERE kind IN ('group','private');
CREATE INDEX trips_kind_active ON trips (kind, is_active, sort_order);

-- ---------------------------------------------------------------------------------------------
-- Departures (schedule) of a trip, with the seat capacity of that departure.
-- seats_booked is maintained ONLY by the triggers below; the CHECK makes overbooking impossible.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE trip_schedules (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id        INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  departure_date TEXT NOT NULL CHECK (departure_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  departure_time TEXT CHECK (departure_time IS NULL OR departure_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  label_en       TEXT,       -- optional display text, e.g. "20-21 November 2026"
  label_ar       TEXT,
  capacity       INTEGER NOT NULL DEFAULT 14 CHECK (capacity >= 0 AND capacity <= 1000),
  seats_booked   INTEGER NOT NULL DEFAULT 0 CHECK (seats_booked >= 0),
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (seats_booked <= capacity)
);
CREATE INDEX trip_schedules_trip ON trip_schedules (trip_id, departure_date);

-- ---------------------------------------------------------------------------------------------
-- Bookings (customer information included). id = the per-submission reference (UUID), which is
-- also the idempotency key: a retry of the same submission can never create a second row.
-- trip_name / trip_slug / departure_date are snapshots so records survive trip edits or deletion.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE bookings (
  id                   TEXT PRIMARY KEY CHECK (length(id) BETWEEN 8 AND 64),
  trip_id              INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  schedule_id          INTEGER REFERENCES trip_schedules(id) ON DELETE SET NULL,
  trip_slug            TEXT NOT NULL,
  trip_name            TEXT NOT NULL,
  customer_name        TEXT NOT NULL CHECK (length(customer_name) BETWEEN 2 AND 100),
  contact_number       TEXT NOT NULL CHECK (length(contact_number) BETWEEN 8 AND 25),
  email                TEXT CHECK (email IS NULL OR length(email) <= 255),
  preferred_date       TEXT NOT NULL CHECK (preferred_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  participant_count    INTEGER NOT NULL CHECK (participant_count BETWEEN 1 AND 200),
  preferred_language   TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ar')),
  special_requirements TEXT CHECK (special_requirements IS NULL OR length(special_requirements) <= 2000),
  additional_notes     TEXT CHECK (additional_notes IS NULL OR length(additional_notes) <= 2000),
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','confirmed','cancelled')),
  admin_notes          TEXT CHECK (admin_notes IS NULL OR length(admin_notes) <= 4000),
  email_sent           INTEGER NOT NULL DEFAULT 0 CHECK (email_sent IN (0,1)),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX bookings_status_created ON bookings (status, created_at DESC);
CREATE INDEX bookings_trip ON bookings (trip_id);
CREATE INDEX bookings_schedule ON bookings (schedule_id);
CREATE INDEX bookings_contact ON bookings (contact_number, created_at);

-- Seat accounting. Cancelled bookings do not hold seats. If a change would push seats_booked above
-- capacity, the CHECK constraint on trip_schedules aborts the whole statement (nothing is written).
CREATE TRIGGER bookings_seats_insert AFTER INSERT ON bookings
WHEN NEW.schedule_id IS NOT NULL AND NEW.status <> 'cancelled'
BEGIN
  UPDATE trip_schedules SET seats_booked = seats_booked + NEW.participant_count WHERE id = NEW.schedule_id;
END;

CREATE TRIGGER bookings_seats_update AFTER UPDATE OF status, participant_count, schedule_id ON bookings
BEGIN
  UPDATE trip_schedules SET seats_booked = seats_booked - OLD.participant_count
    WHERE id = OLD.schedule_id AND OLD.status <> 'cancelled';
  UPDATE trip_schedules SET seats_booked = seats_booked + NEW.participant_count
    WHERE id = NEW.schedule_id AND NEW.status <> 'cancelled';
END;

CREATE TRIGGER bookings_seats_delete AFTER DELETE ON bookings
WHEN OLD.schedule_id IS NOT NULL AND OLD.status <> 'cancelled'
BEGIN
  UPDATE trip_schedules SET seats_booked = seats_booked - OLD.participant_count WHERE id = OLD.schedule_id;
END;

-- ---------------------------------------------------------------------------------------------
-- Administrator accounts and sessions. Passwords are stored as salted PBKDF2 hashes.
-- Session tokens are random; only their SHA-256 hash is stored.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE CHECK (length(username) BETWEEN 3 AND 60),
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,   -- epoch milliseconds
  created_at INTEGER NOT NULL
);
CREATE INDEX admin_sessions_expires ON admin_sessions (expires_at);

CREATE TABLE login_attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ip           TEXT NOT NULL,
  attempted_at INTEGER NOT NULL  -- epoch milliseconds
);
CREATE INDEX login_attempts_ip ON login_attempts (ip, attempted_at);

-- ---------------------------------------------------------------------------------------------
-- Images uploaded from the dashboard (kept in D1 so no extra Cloudflare product is needed).
-- The dashboard shrinks pictures before upload; the server enforces a size limit as well.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE images (
  id          TEXT PRIMARY KEY,
  mime        TEXT NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  data_base64 TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
