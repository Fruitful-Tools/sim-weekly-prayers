import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      // We own the service worker source (src/sw.ts) and let Workbox inject the
      // hashed-asset precache manifest into it. This is the fix for the old
      // hand-written sw.js, which precached CRA-era paths that 404 in Vite.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // User-controlled updates: the app shows a "reload to update" toast
      // (see src/components/PWAUpdatePrompt.tsx) instead of silently reloading.
      registerType: 'prompt',
      injectRegister: false,
      // Static assets that aren't part of the JS/CSS graph but should be cached
      // and available offline (favicon, apple-touch-icon).
      includeAssets: [
        'favicon.ico',
        'icons/apple-touch-icon.png',
        'robots.txt',
      ],
      manifest: {
        id: '/',
        name: 'SIM Weekly Prayers',
        short_name: 'SIM Prayers',
        description: 'Weekly Prayers for the Nations from SIM',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'zh-TW',
        dir: 'ltr',
        categories: ['education', 'books', 'lifestyle'],
        background_color: '#f8fafc',
        theme_color: '#f8fafc',
        icons: [
          { src: 'icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
          { src: 'icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: 'icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
          { src: 'icons/icon-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Weekly Prayers',
            short_name: 'Prayers',
            url: '/prayers',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }],
          },
          {
            name: 'Family Prayers',
            short_name: 'Family',
            url: '/family-prayers',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }],
          },
        ],
        screenshots: [
          {
            src: 'screenshots/narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: 'screenshots/wide.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },
      injectManifest: {
        // Precache the immutable, hashed build output plus the app shell.
        // Only index.html exists at build time (per-route snapshots are written
        // later by the prerender step), so this catches just the shell — used
        // solely as the offline fallback in src/sw.ts. Route HTML is served at
        // runtime (NetworkFirst) so online visitors get the prerendered pages.
        globPatterns: ['**/*.{js,css,woff2}', 'index.html'],
      },
      devOptions: {
        // Keep the SW out of `npm run dev`; test it via `npm run preview`.
        enabled: false,
        type: 'module',
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
