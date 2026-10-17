// Gallery page: shared types + the built-in sample photos shown until photos are saved from the admin panel.
export type GalleryPhoto = { image: string; title_en: string; title_ar: string; category: string | null };
export const GALLERY_CATEGORY_IDS = ['sea-fishing', 'camping-overnight', 'land-adventures', 'international'] as const;
export const GALLERY_PAGE_MAX = 60;
export const GALLERY_DEFAULTS: GalleryPhoto[] = [
  { image: 'asset:coast', category: 'sea-fishing', title_en: 'The open blue', title_ar: 'البحر الأزرق' },
  { image: 'asset:camping', category: 'camping-overnight', title_en: 'A night under the stars', title_ar: 'ليلة تحت النجوم' },
  { image: 'asset:wadi', category: 'land-adventures', title_en: 'Hidden natural beauty', title_ar: 'جمال الطبيعة الخفي' },
  { image: 'asset:mountains', category: 'land-adventures', title_en: 'Beyond the everyday', title_ar: 'بعيدًا عن المألوف' },
];
