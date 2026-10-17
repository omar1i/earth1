// Server-only: Gallery page photos stored in D1 (table is created on first use, no manual migration needed).
import { getDb, type D1Like } from './db.server';
import { GALLERY_DEFAULTS, type GalleryPhoto } from './gallery-defaults';

let tableReady = false;
async function ensureTable(db: D1Like) {
  if (tableReady) return;
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS gallery_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '', title_ar TEXT NOT NULL DEFAULT '', category TEXT, sort_order INTEGER NOT NULL DEFAULT 0)",
    )
    .run();
  tableReady = true;
}

export async function readGalleryWith(db: D1Like): Promise<GalleryPhoto[]> {
  await ensureTable(db);
  const res = await db.prepare('SELECT image, title_en, title_ar, category FROM gallery_photos ORDER BY sort_order, id').all<GalleryPhoto>();
  return res.results ?? [];
}

/** Replaces the whole gallery with the given list (order = list order), atomically. */
export async function writeGallery(db: D1Like, photos: GalleryPhoto[]) {
  await ensureTable(db);
  await db.batch([
    db.prepare('DELETE FROM gallery_photos'),
    ...photos.map((p, i) =>
      db
        .prepare('INSERT INTO gallery_photos (image, title_en, title_ar, category, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)')
        .bind(p.image, p.title_en, p.title_ar, p.category, i),
    ),
  ]);
}

/** Public read. `custom` is false while the built-in sample photos are shown. Never throws. */
export async function readGalleryPublic(): Promise<{ photos: GalleryPhoto[]; custom: boolean }> {
  try {
    const db = await getDb();
    if (db) {
      const rows = await readGalleryWith(db);
      if (rows.length) return { photos: rows, custom: true };
    }
  } catch (error) {
    console.error('[gallery] read failed; using built-in photos.', error instanceof Error ? error.message : '');
  }
  return { photos: GALLERY_DEFAULTS, custom: false };
}
