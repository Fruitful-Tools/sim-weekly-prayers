# GEO Plan — Generative Engine Optimization for SIM Weekly Prayers

> **GEO (Generative Engine Optimization)** = structuring a site so AI answer engines
> (ChatGPT/OAI-SearchBot, Perplexity, Google AI Overviews/Gemini, Claude, Bing Copilot)
> **discover, extract, and cite** its content. This plan is tailored to this repo's
> actual stack: a **client-side-rendered React 19 + Vite SPA on GitHub Pages** with
> Supabase data and i18next (`zh-TW` default, `en`).

_Last researched: June 2026. Sources cited inline; see the bottom of this file._

---

## TL;DR — the one thing that gates everything

**Almost no AI crawler executes JavaScript.** GPTBot, OAI-SearchBot, ClaudeBot,
Claude-SearchBot, and PerplexityBot fetch the **raw HTML response** and never run
`main.tsx`. Only Googlebot/Gemini and Applebot render JS.
([Vercel](https://vercel.com/blog/the-rise-of-the-ai-crawler))

This site is a pure CSR SPA: the server sends `<div id="root"></div>` and a script tag.
**To an AI engine, every page on this site is currently blank** — and because
`react-helmet` is installed but never used, every route also shares one identical static
`<title>`/description from `index.html`.

Therefore the work splits cleanly:

1. **Foundation (non-negotiable): pre-render to static HTML at build time.** Without this,
   steps 2–5 are invisible to AI bots. This is ~80% of the value.
2. **Per-route metadata + structured data** (titles, descriptions, canonical, OG, JSON-LD).
3. **Crawler access + discovery** (robots.txt for AI bots, build-time sitemap.xml).
4. **Content structure** for AI extraction (answer-first chunks, FAQ, E-E-A-T).
5. **i18n URLs + canonical de-duplication** (the trickier, plan-ahead items).

---

## Current state (verified against the repo)

| Area | Current state | Gap |
|---|---|---|
| Rendering | CSR SPA (`src/App.tsx`, `BrowserRouter`), no SSR/SSG | AI bots see empty HTML |
| Meta tags | Static only in `index.html`; same for all routes. `react-helmet` is a dep but **unused** in `src/` | No per-route title/description/OG |
| Structured data | None | No JSON-LD anywhere |
| robots.txt | `public/robots.txt` lists Googlebot, Bingbot, Twitterbot, facebookexternalhit, `*` | No AI-crawler entries (allowed via `*`, but not explicit) |
| sitemap.xml | Does not exist | AI/search can't enumerate dynamic prayer routes |
| llms.txt | Does not exist | (Low priority — see §3) |
| Deep links | `public/404.html` stashes path → `location.replace('/')` | Non-JS bots hitting `/prayer/2026-06-15` get a redirect-to-root, not content |
| i18n | Client-side only (`src/i18n/index.ts`), one URL per item | No `hreflang`-addressable per-language URLs |
| Duplicate routes | `/prayer/:date` **and** `/prayer/id/:id` render same content | No canonical → citation/ranking dilution |
| Base path | CI injects `BASE_PATH` but `vite.config.ts` never consumes it; no `CNAME` file; assets use root-absolute `/...` | Must pin the real production origin before generating absolute URLs |

**Pre-req decision (blocks §2/§3 absolute URLs):** confirm the production origin.
The `BASE_PATH`-injected-but-unused state + root-absolute asset paths + `start_url: "/"`
imply the site is served at a **domain root** (custom domain configured in Pages
settings), not under `/sim-weekly-prayers/`. **Action: confirm the canonical origin
(e.g. `https://prayers.sim.org.tw` or the `*.github.io` root) and hard-code it as a
build env var** (`SITE_ORIGIN`). Every canonical/OG/sitemap URL depends on this.

---

## Phase 0 — Decisions to lock first

1. **Production origin** → set `SITE_ORIGIN` (see above). Reconcile the unused `BASE_PATH`.
2. **AI training vs. citation policy.** For a public ministry/devotional site, recommend
   **allow everything** — both training bots (GPTBot, ClaudeBot, Google-Extended, CCBot)
   and search/citation bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot). Blocking the
   *search* bots silently removes the site from AI citations. (If the ministry wants to opt
   out of model training only, block the training bots but keep the search bots.)
3. **Canonical URL shape per prayer.** Recommend **date-based** (`/prayer/2026-06-15`) as
   canonical (human- and AI-readable); the id-based route points its canonical at it.
4. **i18n URL strategy** (Phase 5) — biggest design choice; can be deferred but plan for it.

---

## Phase 1 — Pre-rendering (foundation) ⭐ highest impact

Goal: emit real static HTML per route into `dist/`, with content + meta baked in, so
non-JS AI crawlers see a full page. Must run inside the existing
`.github/workflows/pages.yml` build (Node 22, `npm run build`, output `dist/`).

### Recommended approach: post-build Puppeteer prerender

Use **`@prerenderer/rollup-plugin`** (the maintained successor to `react-snap`) fed an
**explicit route list generated from Supabase at build time**. Rationale:

- **No migration.** Keeps the current declarative `react-router-dom` v7 + Vite SPA exactly
  as-is. (React Router v7's *native* `prerender` requires migrating to framework mode **and**
  is currently broken when a `basename` is set — open issue
  [remix-run/react-router#13615](https://github.com/remix-run/react-router/issues/13615).
  Revisit only if that's fixed and a framework-mode migration is desired.)
- **It runs the page**, so once we add `react-helmet-async` (Phase 2) the meta + JSON-LD are
  captured into the static HTML automatically.
- `vite-react-ssg` is a viable alternative but its maintainers explicitly steer RR-v7 users
  to native SSG, so it's a less future-proof bet here.

### Build-time route enumeration (also feeds the sitemap)

Add a prebuild Node script (e.g. `scripts/generate-routes.mjs`) that:

1. Queries Supabase for all `prayers.week_date` (+ family-prayer equivalents) using the
   existing public anon key from `src/integrations/supabase/client.ts`.
2. Emits the route array consumed by the prerenderer:
   `['/', '/prayers', '/family-prayers', ...dates.map(d => '/prayer/' + d), ...]`.
3. Writes `dist/sitemap.xml` (Phase 3) from the same list.

Wire it into CI before `npm run build` (or as a Vite `buildStart` hook). Static pages and
sitemap entries then refresh on every release — which matches the
**release-publish → Pages deploy** trigger already in `pages.yml`.

### Important: fix the 404.html deep-link handshake for crawlers

Today `public/404.html` redirects all unknown paths to `/`. Once routes are prerendered,
each route has its own real `dist/<route>/index.html`, so GitHub Pages serves it directly
and the 404 fallback is only hit for *genuinely* unknown URLs — which is correct. **Keep
the `sessionStorage.redirectPath` handshake** for non-prerendered/dynamic edge cases (it's
documented as load-bearing in `CLAUDE.md`), but verify prerendered routes resolve to their
own HTML and don't fall through to the redirect.

**Effort:** M–L (new dep, prebuild script, CI wiring, Puppeteer in Actions). **This phase
is the prerequisite for all AI visibility.**

---

## Phase 2 — Per-route metadata + structured data

### 2a. Replace `react-helmet` → `react-helmet-async`

`react-helmet` is effectively unmaintained and has known issues under React 18/19
concurrent rendering; `react-helmet-async` is the SPA standard and serializes cleanly under
prerender. Add `<HelmetProvider>` to the provider tree in `src/App.tsx`.

### 2b. A reusable `<Seo>` component

Create `src/components/Seo.tsx` driven by the active route + locale, setting **per route**:

- `<title>` and `<meta name="description">` from `prayer_translations.title` / a trimmed
  `content` excerpt in the active language.
- **Open Graph:** `og:title`, `og:description`, `og:type=article`, `og:url` (absolute via
  `SITE_ORIGIN`), `og:image` (the prayer `image_url`), `og:locale` (`zh_TW` / `en_US`).
- **Twitter:** `summary_large_image` + title/description/image (replaces today's static,
  image-only card).
- **Canonical:** absolute, de-duplicating the date vs. id routes (Phase 0 decision).

Use it in `PrayerDetail.tsx`, `FamilyPrayerDetail.tsx`, `Prayers.tsx`,
`FamilyPrayers.tsx`, and `Home.tsx`.

### 2c. JSON-LD structured data (high GEO value, cheap)

JSON-LD is engine-independent of the DOM tree and is one of the most reliable AI/SEO
signals — **as long as it lands in the prerendered HTML** (Phase 1). Inject via
`react-helmet-async` as `<script type="application/ld+json">`:

- **Home:** `Organization` (SIM Taiwan: name, logo `sim_logo.png`, url, sameAs) + `WebSite`
  (with `inLanguage`).
- **Per prayer:** `Article` (or `CreativeWork`) — `headline`, `datePublished` = `week_date`,
  `inLanguage`, `image`, `author`/`publisher` = the Organization — plus `BreadcrumbList`
  (Home → Prayers → date).
- Add `FAQPage` **only** where genuine Q&A exists (don't force it).

Validate with Google Rich Results Test + the schema.org validator after a prerendered build.

**Effort:** M. **Impact:** high once Phase 1 lands.

---

## Phase 3 — Crawler access + discovery

### 3a. `public/robots.txt` — explicitly welcome AI crawlers

Extend the existing file (each provider runs separate training **and** search bots — naming
one does nothing for the others), and add the `Sitemap:` directive:

```
# Search/citation bots — keep these allowed to be eligible for AI answers
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /

# Training bots (allow = opt in to model training; remove to opt out)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /

# Existing
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Twitterbot
Allow: /
User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://SITE_ORIGIN/sitemap.xml
```

> robots.txt is honored only at the **domain root**. This is another reason Phase 0 must
> confirm a root/custom-domain origin — a `/sim-weekly-prayers/robots.txt` would be ignored.

### 3b. `sitemap.xml` — generated at build time

Emitted by the Phase 1 route script into `dist/`, absolute URLs from `SITE_ORIGIN`, with
`hreflang` alternates once Phase 5 lands. Include `lastmod` from prayer timestamps.

### 3c. `llms.txt` — **deprioritized** (optional experiment)

The `llms.txt` standard ([llmstxt.org](https://llmstxt.org/)) is a curated markdown site
map for LLMs. **No current answer engine demonstrably reads it** — Google's John Mueller
stated "no AI system currently uses llms.txt," and a Semrush experiment logged zero crawler
visits to a live file. Skip for now; it's cheap to add later if it gains adoption. A clean
sitemap + prerendered HTML deliver the same discovery value today.

**Effort:** S (robots) + S (sitemap, folds into Phase 1).

---

## Phase 4 — Content structure for AI extraction

AI engines retrieve at the **passage/chunk** level, not whole pages, and the GEO research
(Aggarwal et al., KDD 2024 — up to ~40% visibility lift) shows *structural + credibility*
edits beat raw volume. Apply to prayer content and any surrounding copy:

- **Answer-first chunks** (~40–60 words): lead each section with the direct point.
- **Question-based headings** (`<h2>`/`<h3>`) where natural (e.g. "How to pray for X this
  week?") with the answer immediately beneath.
- **Self-contained sections** — repeat the entity name instead of pronouns so a chunk makes
  sense in isolation.
- **Semantic HTML** — the content already renders via `react-markdown`, which emits proper
  `<h2>/<ul>/<table>`; ensure source markdown uses real heading hierarchy, not bold lines.
- **E-E-A-T signals:** author/publisher (SIM Taiwan), publish/update dates (`week_date` +
  timestamps surfaced in the UI and in JSON-LD), and links to credible sources where prayers
  cite facts/statistics. Avoid promotional/keyword-stuffed phrasing (measurably backfires).
- **FAQ blocks** where the content naturally Q&As, paired with `FAQPage` JSON-LD.

**Effort:** ongoing/editorial. **Impact:** compounding once pages are crawlable.

---

## Phase 5 — i18n URLs + canonical de-duplication (plan-ahead)

Today language is a `localStorage` toggle with **no per-language URL**, so `hreflang` can't
function and only one language gets prerendered. To make both `zh-TW` and `en` independently
discoverable and citable:

- Introduce **language-addressable URLs** — path-prefix (`/zh-TW/prayer/...`, `/en/prayer/...`)
  or equivalent — and prerender each language variant (the Phase 1 route list multiplies by
  locale).
- Emit reciprocal `hreflang` (`zh-TW`, `en`, `x-default`) in `<head>` and in the sitemap;
  **canonical and hreflang must agree** (same alternate cluster).
- Default `zh-TW` stays the `x-default`.

This is the largest design change (router + i18n + prerender all touch it). Sequence it
**after** Phases 1–3 prove out, since it multiplies the prerender matrix.

**Effort:** L. **Impact:** unlocks the `en` audience for AI/search; otherwise English content
is effectively invisible to crawlers.

---

## Recommended sequencing

1. **Phase 0** — confirm origin, reconcile `BASE_PATH`, set AI policy. _(blocker)_
2. **Phase 1** — prerender + build-time route enumeration. _(unlocks everything)_
3. **Phase 2** — `react-helmet-async` + `<Seo>` + JSON-LD.
4. **Phase 3** — robots.txt AI bots + sitemap.xml.
5. **Phase 4** — content-structure pass (editorial, ongoing).
6. **Phase 5** — i18n URLs + hreflang (larger, do last).

Each phase is independently shippable and respects the existing CI gates
(`format:check`, `lint`, `build`) and the release-publish → Pages deploy flow. Major UI/dep
changes (Phase 1/2 deps) need manual visual QA since CI has no visual tests.

---

## What NOT to do

- Don't add `llms.txt` expecting traffic — no engine reads it yet (re-evaluate later).
- Don't keyword-stuff or write promotional copy — the GEO research shows both *reduce*
  citation rates.
- Don't migrate to React Router framework mode for native prerender until issue #13615
  (basename + `ssr:false` prerender) is confirmed fixed.
- Don't rely on `react-helmet` tags being seen by AI bots **without** Phase 1 — in a CSR SPA
  they're injected after hydration and never reach non-JS crawlers.

---

## Sources

- GEO: Generative Engine Optimization — Aggarwal et al., KDD 2024 — https://arxiv.org/abs/2311.09735
- Vercel, "The rise of the AI crawler" (which bots render JS) — https://vercel.com/blog/the-rise-of-the-ai-crawler
- OpenAI bots (official) — https://developers.openai.com/api/docs/bots
- Anthropic Claude bots & robots.txt — https://searchengineland.com/anthropic-claude-bots-470171
- AI crawlers explained (GPTBot/ClaudeBot/PerplexityBot, 2026) — https://www.anagram.ai/blog/ai-crawlers-explained-gptbot-claudebot-perplexitybot-and-how-to-let-them-in-2026
- React Router pre-rendering & rendering strategies — https://reactrouter.com/how-to/pre-rendering
- RR v7 basename prerender bug — https://github.com/remix-run/react-router/issues/13615
- vite-react-ssg — https://github.com/Daydreamer-riri/vite-react-ssg
- JSON-LD for React apps — https://dev.to/lukefryer4/json-ld-structured-data-for-react-apps-complete-implementation-guide-34n1
- llms.txt spec — https://llmstxt.org/ ; "is it worth it?" — https://www.semrush.com/blog/llms-txt/
- Content chunking & AI extractability — https://www.lumar.io/blog/best-practice/content-chunking-ai-extractability-geo-aeo-explainer/
