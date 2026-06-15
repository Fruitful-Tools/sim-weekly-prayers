// Generates dist/sitemap.xml from the live route list. Run after `vite build`.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRoutes, SITE_ORIGIN } from './site.mjs';

const DIST = 'dist';

// GitHub Pages serves directory-index pages at their trailing-slash URL
// (e.g. /prayers/), so we emit that canonical form to avoid redirect chains.
const routeToUrl = (route) =>
  route === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}/`;

const routes = await getRoutes();

const body = routes
  .map((route) => `  <url>\n    <loc>${routeToUrl(route)}</loc>\n  </url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

await writeFile(join(DIST, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml: wrote ${routes.length} URLs`);
