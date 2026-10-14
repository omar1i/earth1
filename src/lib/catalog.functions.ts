import { createServerFn } from '@tanstack/react-start';
import { buildCatalog, staticCatalog, type Catalog, type CatalogRows } from './catalog';

// Public, read-only. Returns the active trips and departures from D1, or null if D1 is not available.
export const getCatalogRows = createServerFn({ method: 'GET' }).handler(async (): Promise<CatalogRows | null> => {
  try {
    const { readCatalogRows } = await import('./catalog.server');
    return await readCatalogRows();
  } catch (error) {
    console.error('[catalog] unexpected error', error instanceof Error ? error.message : '');
    return null;
  }
});

/** Loads the catalog for pages. Falls back to the built-in content only when no database is connected. */
export async function loadCatalog(): Promise<Catalog> {
  try {
    const rows = await getCatalogRows();
    return rows ? buildCatalog(rows) : staticCatalog();
  } catch {
    return staticCatalog();
  }
}
