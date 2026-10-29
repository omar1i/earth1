// Pictures for the About page that the administrator can change from the admin panel (About page tab).
// fishTuna / fishKingfish / fishGrouper / fishReef: the fish photos on the Masirah fishing trip page ("About Masirah" section).
export const SITE_IMAGE_KEYS = ['purpose', 'company', 'vision', 'mission', 'why', 'founder', 'gallery', 'fishTuna', 'fishKingfish', 'fishGrouper', 'fishReef'] as const;
export type SiteImageKey = (typeof SITE_IMAGE_KEYS)[number];
export type SiteImages = { [K in Exclude<SiteImageKey, 'gallery'>]?: string } & { gallery?: string[] };
export const GALLERY_MAX = 12;
