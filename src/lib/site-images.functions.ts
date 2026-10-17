import { createServerFn } from '@tanstack/react-start';
import type { SiteImages } from './site-images';

// Public, read-only. Returns the About-page pictures chosen in the admin panel ({} when none / no database).
export const getSiteImages = createServerFn({ method: 'GET' }).handler(async (): Promise<SiteImages> => {
  try {
    const { readSiteImages } = await import('./site-images.server');
    return await readSiteImages();
  } catch (error) {
    console.error('[site-images] unexpected error', error instanceof Error ? error.message : '');
    return {};
  }
});
