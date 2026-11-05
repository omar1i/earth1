import { createFileRoute } from '@tanstack/react-router';
import { loadCatalog } from '@/lib/catalog.functions';

// /sitemap.xml: every page in English and Arabic (/ar/...), with hreflang links and, for trips, the date they were last edited.
// Uses whatever domain the site runs on. Browsers show it as a styled table (see STYLESHEET below); search engines read the plain XML.
const pages = ['/', '/destinations', '/about', '/gallery', '/reviews', '/contact', '/book', '/privacy', '/terms'];

const STYLESHEET = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex"/>
<title>XML Sitemap | Earth Adventure</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;margin:0;background:#f4f7fb;color:#12263f}
header{background:#12263f;color:#fff;padding:28px 32px}
header h1{margin:0 0 6px;font-size:24px}
header p{margin:0;color:#b9c8dc;font-size:14px}
main{max-width:1100px;margin:24px auto;padding:0 16px}
.count{margin:0 0 14px;font-size:14px;color:#44566f}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(18,38,63,.08)}
th{background:#e8eff8;text-align:left;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#44566f;padding:12px 14px}
td{padding:11px 14px;border-top:1px solid #e6edf5;font-size:14px;word-break:break-all}
tr:hover td{background:#f7fafe}
a{color:#2a73d4;text-decoration:none}a:hover{text-decoration:underline}
.n{color:#8aa0bb;width:48px}.d{white-space:nowrap;width:130px;color:#44566f}.l{white-space:nowrap;width:110px}
.tag{display:inline-block;background:#eaf5d9;color:#4a7a12;border-radius:10px;padding:1px 8px;font-size:12px;margin-right:4px}
</style></head>
<body>
<header><h1>XML Sitemap</h1><p>Earth Adventure &#8211; this file helps search engines find every page of the site.</p></header>
<main>
<p class="count">Total pages: <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong></p>
<table><thead><tr><th>#</th><th>URL</th><th>Languages</th><th>Last modified</th></tr></thead><tbody>
<xsl:for-each select="sm:urlset/sm:url">
<tr><td class="n"><xsl:value-of select="position()"/></td>
<td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
<td class="l"><xsl:for-each select="xhtml:link[@hreflang!='x-default']"><span class="tag"><xsl:value-of select="@hreflang"/></span></xsl:for-each></td>
<td class="d"><xsl:value-of select="sm:lastmod"/></td></tr>
</xsl:for-each>
</tbody></table></main></body></html>
</xsl:template></xsl:stylesheet>`;

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        if (url.searchParams.has('xsl')) {
          return new Response(STYLESHEET, { headers: { 'content-type': 'text/xsl; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
        }
        const origin = url.origin;
        const catalog = await loadCatalog();
        const items: { path: string; lastmod?: string }[] = [
          ...pages.map((path) => ({ path })),
          ...catalog.privateDestinations.map((d) => ({ path: `/private-trips/${d.id}`, lastmod: d.updatedAt })),
          ...catalog.groupTrips.map((g) => ({ path: `/group-trips/${g.id}`, lastmod: g.updatedAt })),
        ];
        const ar = (p: string) => '/ar' + (p === '/' ? '' : p);
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const day = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined);
        const entry = (loc: string, p: string, lastmod?: string) =>
          [
            '  <url>',
            `    <loc>${esc(origin + loc)}</loc>`,
            ...(day(lastmod) ? [`    <lastmod>${day(lastmod)}</lastmod>`] : []),
            `    <xhtml:link rel="alternate" hreflang="en" href="${esc(origin + p)}"/>`,
            `    <xhtml:link rel="alternate" hreflang="ar" href="${esc(origin + ar(p))}"/>`,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + p)}"/>`,
            '  </url>',
          ].join('\n');
        const body = items.map((i) => entry(i.path, i.path, i.lastmod) + '\n' + entry(ar(i.path), i.path, i.lastmod)).join('\n');
        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<?xml-stylesheet type="text/xsl" href="/sitemap.xml?xsl=1"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
          body +
          '\n</urlset>\n';
        return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
      },
    },
  },
});
