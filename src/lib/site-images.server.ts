// Server-only: About-page pictures stored in D1 (table is created on first use, no manual migration needed).
import { getDb, type D1Like } from './db.server';
import { SITE_IMAGE_KEYS, type SiteImages } from './site-images';

let tableReady = false;
async function ensureTable(db: D1Like) {
  if (tableReady) return;
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS site_images (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))",
    )
    .run();
  tableReady = true;
}

export async function readSiteImagesWith(db: D1Like): Promise<SiteImages> {
  await ensureTable(db);
  const rows = (await db.prepare('SELECT key, value FROM site_images').all<{ key: string; value: string }>()).results ?? [];
  const out: SiteImages = {};
  for (const row of rows) {
    if (!(SITE_IMAGE_KEYS as readonly string[]).includes(row.key)) continue;
    if (row.key === 'gallery') {
      try {
        const list = JSON.parse(row.value);
        if (Array.isArray(list)) out.gallery = list.filter((x) => typeof x === 'string' && x);
      } catch {
        /* ignore a damaged row */
      }
    } else {
      (out as Record<string, string>)[row.key] = row.value;
    }
  }
  return out;
}

/** Public read. Never throws: the About page simply shows its built-in layout when nothing is set. */
export async function readSiteImages(): Promise<SiteImages> {
  try {
    const db = await getDb();
    return db ? await readSiteImagesWith(db) : {};
  } catch (error) {
    console.error('[site-images] read failed', error instanceof Error ? error.message : '');
    return {};
  }
}

export async function writeSiteImage(db: D1Like, key: string, value: string | string[] | null) {
  await ensureTable(db);
  const empty = value === null || (Array.isArray(value) && value.length === 0) || value === '';
  if (empty) {
    await db.prepare('DELETE FROM site_images WHERE key = ?1').bind(key).run();
    return;
  }
  const stored = Array.isArray(value) ? JSON.stringify(value) : value;
  await db
    .prepare(
      "INSERT INTO site_images (key, value, updated_at) VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(key, stored)
    .run();
}
