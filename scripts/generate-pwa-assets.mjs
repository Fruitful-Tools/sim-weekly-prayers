// One-off generator for the PWA image assets that can't be hand-authored:
//   - maskable icons (192, 512) with an Android safe-zone (logo within ~76%)
//   - apple-touch-icon (180, opaque background, no transparency)
//   - iOS apple-touch-startup-image splash screens for common devices
//
// Outputs are committed to public/ — this is NOT part of the CI build. Re-run
// locally with `node scripts/generate-pwa-assets.mjs` after changing the logo.
// Uses the project's existing puppeteer (Chromium is already cached for the
// prerender step), so no extra dependency or network access is needed.
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const PUBLIC = 'public';
const ICONS_DIR = join(PUBLIC, 'icons');
const SPLASH_DIR = join(ICONS_DIR, 'splash');

const BG = '#f8fafc'; // matches manifest background_color / light theme-color

// Square brand mark used for the launcher/home-screen icons.
const iconLogo = await readFile(join(ICONS_DIR, 'icon-512x512.png'));
const iconLogoUri = `data:image/png;base64,${iconLogo.toString('base64')}`;
// Wide wordmark used (centered) on splash screens.
const splashLogo = await readFile(join(PUBLIC, 'sim_logo.png'));
const splashLogoUri = `data:image/png;base64,${splashLogo.toString('base64')}`;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

async function shoot(html, width, height, dpr, file) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: dpr });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await mkdir(join(file, '..'), { recursive: true });
  await page.screenshot({ path: file, type: 'png' });
  await page.close();
}

// An icon: logo centered on an opaque background, scaled to `coverage` of the
// canvas so a circular/rounded mask never clips it.
function iconHtml(coverage) {
  return `<!doctype html><html><body style="margin:0">
    <div style="width:100vw;height:100vh;background:${BG};display:flex;
      align-items:center;justify-content:center">
      <img src="${iconLogoUri}" style="width:${coverage}%;height:${coverage}%;
        object-fit:contain" />
    </div></body></html>`;
}

// A splash: wordmark centered on the background.
const splashHtml = `<!doctype html><html><body style="margin:0">
  <div style="width:100vw;height:100vh;background:${BG};display:flex;
    align-items:center;justify-content:center">
    <img src="${splashLogoUri}" style="width:60%;max-width:480px;
      object-fit:contain" />
  </div></body></html>`;

// --- Icons -----------------------------------------------------------------
// Maskable: ~76% coverage leaves the 20% safe-zone Android masks require.
await shoot(iconHtml(76), 192, 192, 1, join(ICONS_DIR, 'maskable-192.png'));
await shoot(iconHtml(76), 512, 512, 1, join(ICONS_DIR, 'maskable-512.png'));
// Apple touch icon: iOS rounds the corners itself, so fill more; opaque bg
// flattens any transparency in the source.
await shoot(iconHtml(88), 180, 180, 1, join(ICONS_DIR, 'apple-touch-icon.png'));

// --- iOS splash screens ----------------------------------------------------
// [cssWidth, cssHeight, dpr] portrait, covering current iPhones/iPads.
const SPLASHES = [
  [430, 932, 3], // iPhone 15 Plus / 14 Pro Max
  [393, 852, 3], // iPhone 15 / 14 Pro
  [390, 844, 3], // iPhone 14 / 13 / 12
  [414, 896, 3], // iPhone 11 Pro Max / XS Max
  [414, 896, 2], // iPhone 11 / XR
  [375, 667, 2], // iPhone SE / 8
  [1024, 1366, 2], // iPad Pro 12.9"
  [834, 1194, 2], // iPad Pro 11"
  [820, 1180, 2], // iPad Air
  [768, 1024, 2], // iPad mini / 9.7"
];

const links = [];
for (const [w, h, dpr] of SPLASHES) {
  const name = `apple-splash-${w}-${h}-${dpr}x.png`;
  await shoot(splashHtml, w, h, dpr, join(SPLASH_DIR, name));
  links.push(
    `    <link rel="apple-touch-startup-image" ` +
      `media="(device-width: ${w}px) and (device-height: ${h}px) ` +
      `and (-webkit-device-pixel-ratio: ${dpr}) ` +
      `and (orientation: portrait)" ` +
      `href="/icons/splash/${name}" />`
  );
}

await browser.close();

// Print the <link> tags so they can be pasted into index.html when the device
// list changes. (Not written into public/ — these belong in the HTML head.)
console.log('PWA assets generated. Splash <link> tags for index.html:');
console.log(links.join('\n'));
