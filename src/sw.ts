/// <reference lib="webworker" />
//
// Custom service worker, compiled by vite-plugin-pwa (injectManifest). Workbox
// replaces `self.__WB_MANIFEST` with the list of hashed build assets, so the
// precache always points at files that actually exist — the bug the old
// hand-written public/sw.js had (it precached CRA-era /static/* paths that 404,
// failing install and breaking offline entirely).
//
// Strategy:
//   - Precache the immutable JS/CSS build output (offline app boot).
//   - Navigations: NetworkFirst, so online visitors and crawlers always get the
//     freshly prerendered HTML; offline falls back to a visited page or the
//     cached app shell.
//   - Supabase REST reads: StaleWhileRevalidate (instant cached render + refresh),
//     matching the old cache-first-then-background-update behavior, now covering
//     family prayers too.
//   - Supabase Storage images: CacheFirst with a bounded expiration.
import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import {
  NavigationRoute,
  registerRoute,
  setCatchHandler,
} from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const APP_SHELL_URL = '/index.html';

// Precache hashed assets injected at build time. The app shell (index.html) is
// precached purely as the offline fallback below — `directoryIndex: null` +
// `cleanURLs: false` stop Workbox from auto-serving it for `/` (or any clean
// URL), so navigations fall through to the NetworkFirst route and online
// visitors keep getting the freshly prerendered HTML.
precacheAndRoute(self.__WB_MANIFEST, {
  directoryIndex: null,
  cleanURLs: false,
});
cleanupOutdatedCaches();

// Navigations: try the network first (fresh prerendered HTML), fall back to the
// last-cached version of that page, then to the precached app shell.
const navigationHandler = new NetworkFirst({
  cacheName: 'pages',
  networkTimeoutSeconds: 4,
  plugins: [
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 86400 }),
  ],
});
registerRoute(new NavigationRoute(navigationHandler));

// Supabase REST reads (prayers, family prayers, …): instant cached render with a
// background refresh.
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/rest/v1/'),
  new StaleWhileRevalidate({ cacheName: 'supabase-rest' })
);

// Supabase Storage prayer images: serve from cache, bounded so it can't grow
// without limit.
registerRoute(
  ({ url }) =>
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.includes('/storage/v1/object/public/'),
  new CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 86400 }),
    ],
  })
);

// Offline + an uncached route: boot the precached app shell so the installed app
// always opens and can render whatever Supabase data is already cached.
const appShellHandler = createHandlerBoundToURL(APP_SHELL_URL);
setCatchHandler((options) => {
  if (options.request.mode === 'navigate') {
    return appShellHandler(options);
  }
  return Response.error();
});

// The update toast (PWAUpdatePrompt) calls updateSW(), which posts SKIP_WAITING.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

clientsClaim();
