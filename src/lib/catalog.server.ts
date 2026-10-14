// Server-only: reads the public catalog (active trips and their departures) from D1.
import { getDb } from './db.server';
import type { CatalogRows, ScheduleRow, TripRow } from './catalog';

/** Returns null when no database is connected or it has not been migrated yet (site uses built-in content). */
export async function readCatalogRows(): Promise<CatalogRows | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [trips, schedules] = await db.batch<TripRow | ScheduleRow>([
      db.prepare('SELECT * FROM trips WHERE is_active = 1 ORDER BY sort_order, id'),
      db.prepare(
        `SELECT s.* FROM trip_schedules s JOIN trips t ON t.id = s.trip_id
         WHERE t.is_active = 1 ORDER BY s.departure_date, s.departure_time`,
      ),
    ]);
    return { trips: (trips?.results ?? []) as TripRow[], schedules: (schedules?.results ?? []) as ScheduleRow[] };
  } catch (error) {
    console.error('[catalog] D1 read failed; using built-in content.', error instanceof Error ? error.message : '');
    return null;
  }
}
