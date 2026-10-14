// Client-safe catalog logic: turns database rows into the objects the pages already render, and
// provides the built-in content (src/lib/content.ts) as a fallback while no database is connected.
import {
  assetImages, bi, experiences as staticExperiences, groupTrips as staticGroupTrips,
  privateDestinations as staticPrivate, regionOf,
  type Experience, type GroupTrip, type PrivateDestination, type Schedule,
} from './content';
import type { Bilingual, Language } from './language';

export type TripRow = {
  id: number; slug: string; kind: 'group' | 'private' | 'experience';
  category: string | null; region: 'oman' | 'international'; destination: string | null;
  name_en: string; name_ar: string; description_en: string; description_ar: string; image: string | null;
  location_en: string | null; location_ar: string | null; duration_en: string | null; duration_ar: string | null;
  group_size_en: string | null; group_size_ar: string | null; max_group: number | null;
  accommodation_en: string | null; accommodation_ar: string | null;
  price: number | null; price_type: 'fixed' | 'person' | 'group' | 'contact';
  itinerary: string; inclusions: string; exclusions: string; requirements: string; terms: string;
  is_sample: number; is_active: number; sort_order: number;
};
export type ScheduleRow = {
  id: number; trip_id: number; departure_date: string; departure_time: string | null;
  label_en: string | null; label_ar: string | null; capacity: number; seats_booked: number; status: 'open' | 'closed';
};
export type CatalogRows = { trips: TripRow[]; schedules: ScheduleRow[] };
export type Catalog = {
  experiences: Experience[];
  internationalExperiences: Experience[];
  omanExperiences: Experience[];
  privateDestinations: PrivateDestination[];
  groupTrips: GroupTrip[];
  fromDatabase: boolean;
};

const muscatToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Image reference -> URL. Accepts asset:<name>, /api/images/<id>, or an https URL. */
export function resolveImage(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('asset:')) return assetImages[value.slice(6)];
  return value;
}

function parseList<T>(text: string | null | undefined): T[] {
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
const toBi = (v: unknown): Bilingual => {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Bilingual>;
  return bi(typeof o.en === 'string' ? o.en : '', typeof o.ar === 'string' ? o.ar : '');
};

export function formatTripPrice(price: number | null, type: TripRow['price_type'], sample: boolean, lang: Language): string {
  if (price === null || price === undefined || type === 'contact') return lang === 'ar' ? 'تواصل لمعرفة السعر' : 'Contact for Price';
  const n = Number.isInteger(price) ? String(price) : price.toFixed(3);
  const unit = type === 'person' ? (lang === 'ar' ? ' للشخص' : ' per person') : type === 'group' ? (lang === 'ar' ? ' للمجموعة' : ' per group') : '';
  const text = lang === 'ar' ? `${n} ر.ع.${unit}` : `OMR ${n}${unit}`;
  return sample ? (lang === 'ar' ? 'سعر تجريبي: ' : 'Sample price: ') + text : text;
}

export function formatDateLabel(date: string, lang: Language): string {
  const d = new Date(date + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

function buildSchedule(r: ScheduleRow, today: string): Schedule {
  const seatsLeft = Math.max(0, r.capacity - r.seats_booked);
  const time = r.departure_time || null;
  const base = (lang: Language, label: string | null) => (label && label.trim() ? label.trim() : formatDateLabel(r.departure_date, lang));
  const withTime = (text: string) => (time ? `${text} · ${time}` : text);
  return {
    id: r.id, date: r.departure_date, time,
    label: bi(withTime(base('en', r.label_en)), withTime(base('ar', r.label_ar))),
    capacity: r.capacity, seatsLeft,
    bookable: r.status === 'open' && r.departure_date >= today && seatsLeft > 0,
    soldOut: seatsLeft <= 0,
  };
}

export function buildCatalog(rows: CatalogRows): Catalog {
  const today = muscatToday();
  const byTrip = new Map<number, ScheduleRow[]>();
  for (const s of rows.schedules) byTrip.set(s.trip_id, [...(byTrip.get(s.trip_id) ?? []), s]);
  const trips = [...rows.trips].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const experiences: Experience[] = [];
  const privateDestinations: PrivateDestination[] = [];
  const groupTrips: GroupTrip[] = [];

  for (const t of trips) {
    const name = bi(t.name_en, t.name_ar);
    const description = bi(t.description_en, t.description_ar);
    const image = resolveImage(t.image);
    const optBi = (en: string | null, ar: string | null) => (en || ar ? { v: bi(en ?? '', ar ?? '') } : null);

    if (t.kind === 'private') {
      privateDestinations.push({ id: t.slug, name, description, image: image ?? assetImages['coast']! });
    } else if (t.kind === 'group') {
      const schedules = (byTrip.get(t.id) ?? [])
        .sort((a, b) => (a.departure_date + (a.departure_time ?? '')).localeCompare(b.departure_date + (b.departure_time ?? '')))
        .map((s) => buildSchedule(s, today));
      const next = schedules.find((s) => s.bookable) ?? schedules.find((s) => s.date >= today) ?? schedules[0];
      const sample = t.is_sample === 1;
      const loc = optBi(t.location_en, t.location_ar);
      const dur = optBi(t.duration_en, t.duration_ar);
      const size = optBi(t.group_size_en, t.group_size_ar);
      groupTrips.push({
        id: t.slug, name, description, image: image ?? assetImages['coast']!,
        location: loc?.v ?? bi('', ''), duration: dur?.v ?? bi('', ''), groupSize: size?.v ?? bi('', ''),
        startDate: next?.date ?? '',
        date: next ? bi((sample ? 'Sample date: ' : '') + next.label.en, (sample ? 'تاريخ تجريبي: ' : '') + next.label.ar) : bi('Date to be announced', 'سيُعلن عن الموعد لاحقًا'),
        price: bi(formatTripPrice(t.price, t.price_type, sample, 'en'), formatTripPrice(t.price, t.price_type, sample, 'ar')),
        itinerary: parseList<{ title?: unknown; text?: unknown }>(t.itinerary).map((i) => ({ title: toBi(i.title), text: toBi(i.text) })),
        inclusions: parseList(t.inclusions).map(toBi),
        exclusions: parseList(t.exclusions).map(toBi),
        terms: parseList(t.terms).map(toBi),
        sample, schedules,
      });
    } else {
      const e: Experience = { id: t.slug, category: t.category ?? 'international', name, description, price: t.price, priceType: t.price_type, region: t.region };
      if (image) e.image = image;
      const loc = optBi(t.location_en, t.location_ar);
      const dur = optBi(t.duration_en, t.duration_ar);
      const acc = optBi(t.accommodation_en, t.accommodation_ar);
      if (loc) e.location = loc.v;
      if (dur) e.duration = dur.v;
      if (acc) e.accommodation = acc.v;
      if (t.max_group) e.maxGroup = t.max_group;
      if (t.destination) e.destination = t.destination;
      const it = parseList<{ title?: unknown; text?: unknown }>(t.itinerary).map((i) => {
        const a = toBi(i.title), b = toBi(i.text);
        return bi(a.en + (b.en ? (a.en ? ': ' : '') + b.en : ''), a.ar + (b.ar ? (a.ar ? ': ' : '') + b.ar : ''));
      });
      if (it.length) e.itinerary = it;
      const inc = parseList(t.inclusions).map(toBi); if (inc.length) e.inclusions = inc;
      const exc = parseList(t.exclusions).map(toBi); if (exc.length) e.exclusions = exc;
      const req = parseList(t.requirements).map(toBi); if (req.length) e.requirements = req;
      experiences.push(e);
    }
  }
  return {
    experiences, privateDestinations, groupTrips,
    internationalExperiences: experiences.filter((e) => regionOf(e) === 'international'),
    omanExperiences: experiences.filter((e) => regionOf(e) === 'oman'),
    fromDatabase: true,
  };
}

/** The built-in content, used until a D1 database is connected (or if it cannot be read). */
export function staticCatalog(): Catalog {
  return {
    experiences: staticExperiences, privateDestinations: staticPrivate, groupTrips: staticGroupTrips,
    internationalExperiences: staticExperiences.filter((e) => regionOf(e) === 'international'),
    omanExperiences: staticExperiences.filter((e) => regionOf(e) === 'oman'),
    fromDatabase: false,
  };
}

/** Departures a visitor can still book (open, in the future, with seats left). */
export const bookableSchedules = (t: GroupTrip): Schedule[] => (t.schedules ?? []).filter((s) => s.bookable);
