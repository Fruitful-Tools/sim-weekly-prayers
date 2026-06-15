// Post-build prerender: snapshots each route's fully-rendered DOM into a static
// HTML file so non-JS AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot,
// PerplexityBot) and search engines see real content instead of an empty SPA
// shell. Run after `vite build`.
//
// How it works: serve dist/ with an SPA fallback, drive a headless browser over
// every route, wait for the Supabase-backed content to render, then write the
// resulting HTML to dist/<route>/index.html. The app boots via createRoot (not
// hydrate), so on a real visit React simply re-renders over the snapshot.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sirv from 'sirv';
import puppeteer from 'puppeteer';
import { getRoutes } from './site.mjs';

const DIST = 'dist';
const PORT = 4179;
const ORIGIN = `http://localhost:${PORT}`;
const MAX_ATTEMPTS = 3;

const routeToFile = (route) =>
  route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');

const launch = () =>
  puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

// Capture the pristine SPA shell ONCE, before we start writing prerendered
// pages back into dist/. Every route must boot from this clean shell — if we
// let the fallback serve a mutated dist/index.html (which we overwrite with the
// rendered home), later routes would load an already-rendered tree and crash
// createRoot (React #299), producing empty snapshots.
const shell = await readFile(join(DIST, 'index.html'), 'utf8');

// Serve real asset files (anything with a file extension: JS/CSS/images/sw.js)
// from disk; serve the in-memory pristine shell for every route navigation.
const serveFiles = sirv(DIST, { dev: false, etag: false });
const sendShell = (res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(shell);
};
const server = createServer((req, res) => {
  const path = req.url.split('?')[0];
  const isAssetFile = path !== '/' && /\.[a-zA-Z0-9]+$/.test(path);
  if (isAssetFile) {
    serveFiles(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    });
  } else {
    sendShell(res);
  }
});
await new Promise((resolve) => server.listen(PORT, resolve));

const routes = await getRoutes();
let browser = await launch();

// Snapshot a single route. Throws on failure so the caller can retry.
async function snapshot(route) {
  const page = await browser.newPage();
  try {
    // The app registers a cache-first service worker (public/sw.js). Once the
    // first route registers it, it would intercept every later navigation in
    // this shared browser session and serve a stale/empty shell. Bypass it so
    // each route renders fresh from the dev server.
    await page.setBypassServiceWorker(true);
    await page.goto(`${ORIGIN}${route}`, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    // Wait until the app has rendered real content into #root — specifically,
    // past the "載入中..." / "Loading..." placeholder that all list/detail pages
    // show while their Supabase fetch is in flight. Without this the snapshot
    // can capture the loading state. Falls through after the timeout so a page
    // that genuinely never resolves still gets snapshotted as-is.
    await page
      .waitForFunction(
        () => {
          const root = document.getElementById('root');
          if (!root) return false;
          const text = (root.innerText || '').trim();
          if (text.length <= 50) return false;
          return !/載入中|Loading/i.test(text);
        },
        { timeout: 20000 }
      )
      .catch(() => {});

    const html = await page.content();
    const file = routeToFile(route);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html, 'utf8');
  } finally {
    // A dead browser connection makes close() throw; never let that abort the
    // run — the per-route retry below handles relaunching.
    await page.close().catch(() => {});
  }
}

let succeeded = 0;
let failed = 0;

for (const route of routes) {
  let done = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt += 1) {
    try {
      // Recover from a crashed/disconnected browser (e.g. a transient network
      // blip) by relaunching before retrying.
      if (!browser.connected) {
        browser = await launch();
      }
      await snapshot(route);
      done = true;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.warn(`✗ ${route}: ${error.message}`);
      } else if (!browser.connected) {
        browser = await launch().catch(() => browser);
      }
    }
  }
  if (done) {
    succeeded += 1;
    console.log(`✓ ${route}`);
  } else {
    failed += 1;
  }
}

await browser.close().catch(() => {});
server.close();

console.log(`prerender: ${succeeded} ok, ${failed} failed`);
if (succeeded === 0) {
  process.exit(1);
}
