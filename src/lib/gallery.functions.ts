import { createServerFn } from '@tanstack/react-start';
import { GALLERY_DEFAULTS, type GalleryPhoto } from './gallery-defaults';

// Public, read-only. The photos saved from the admin panel (Gallery page tab), or the built-in samples.
export const getGalleryPhotos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ photos: GalleryPhoto[]; custom: boolean }> => {
    try {
      const { readGalleryPublic } = await import('./gallery.server');
      return await readGalleryPublic();
    } catch (error) {
      console.error('[gallery] unexpected error', error instanceof Error ? error.message : '');
      return { photos: GALLERY_DEFAULTS, custom: false };
    }
  },
);
