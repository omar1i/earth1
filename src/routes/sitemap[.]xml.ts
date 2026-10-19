import { createFileRoute } from '@tanstack/react-router';
import { loadCatalog } from '@/lib/catalog.functions';

// /sitemap.xml: every page in English and Arabic (/ar/...), with hreflang links. Uses whatever domain the site runs on.
const pages = ['/', '/destinations', '/about', '/gallery', '/reviews', '/contact', '/book', '/privacy', '/terms'];

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        const catalog = await loadCatalog();
        const paths = [
          ...pages,
          ...catalog.privateDestinations.map((d) => `/private-trips/${d.id}`),
          ...catalog.groupTrips.map((g) => `/group-trips/${g.id}`),
        ];
        const ar = (p: string) => '/ar' + (p === '/' ? '' : p);
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const entry = (loc: string, p: string) =>
          `<url><loc>${esc(origin + loc)}</loc>` +
          `<xhtml:link rel="alternate" hreflang="en" href="${esc(origin + p)}"/>` +
          `<xhtml:link rel="alternate" hreflang="ar" href="${esc(origin + ar(p))}"/>` +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + p)}"/></url>`;
        const body = paths.map((p) => entry(p, p) + entry(ar(p), p)).join('');
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
        return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
      },
    },
  },
});
