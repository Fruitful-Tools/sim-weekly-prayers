# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
npm install          # Install deps (plain install — peer deps resolve cleanly since the React 19 alignment)
npm run dev          # Dev server on http://localhost:8080 (host '::', binds IPv4+IPv6)
npm run build        # Production build (outputs to dist/)
npm run build:dev    # Build with development mode (keeps lovable-tagger, unminified)
npm run lint         # ESLint — must pass in CI
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write across the repo
npm run format:check # Prettier check — must pass in CI
npm run preview      # Serve the production build locally
```

There is **no test runner** configured. CI quality gates are exactly three steps: `format:check`, `lint`, `build`. Run all three before pushing — that is what `.github/workflows/ci.yml` enforces (on Node 20.x and 22.x).

## Tech Stack Reality Check

The stack drifts from what older docs (README) claim. Trust this list:

- **React 19** (`react@19` + `react-dom@19`, types aligned) — the README/older notes say React 18; they are stale.
- **Vite 5 + `@vitejs/plugin-react-swc`** for build/dev.
- **TypeScript 5.8**, `typescript-eslint` flat config (`eslint.config.js`).
- **shadcn/ui** (Radix primitives) + **Tailwind CSS 4** (CSS-first via `@import 'tailwindcss'` + `@config`, PostCSS plugin `@tailwindcss/postcss`) with HSL CSS-variable theming.
- **Supabase** (`@supabase/supabase-js` v2) — Postgres + Auth + Storage.
- **TanStack Query v5** for server state; **React Context** for auth/font/theme.
- **react-router-dom v7**, **i18next/react-i18next** (default `zh-TW`).
- This was bootstrapped on **Lovable** (`lovable-tagger` Vite plugin runs in dev mode only).

## Dependency Management

This is a frequent source of trouble — read before touching dependencies.

- **Plain `npm install` / `npm ci` work** — no `--legacy-peer-deps` flag needed. React runtime + types are aligned on 19; `react-helmet` emits a harmless transitive peer warning that does not fail the install. If you bump a dep that reintroduces a hard peer conflict, fix the offending package rather than reaching for the flag.
- **Dependabot** opens npm PRs weekly (`.github/dependabot.yml`, limit 10). When reviewing them, prefer landing in small batches and confirm `npm run build` still passes — a Radix or Tailwind major can break the vendored UI components. Major UI bumps (e.g. Tailwind, vaul) need manual visual QA since CI has no visual tests.
- `package-lock.json` is committed; keep installs reproducible with `npm ci`.

## UI Components & Layout

shadcn/ui components are **vendored source code you own**, not an installed library.

- Config lives in `components.json`: style `default`, base color `slate`, CSS variables enabled, no class prefix. Aliases: `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`.
- **Add a new component** with the CLI: `npx shadcn@latest add <name>` (e.g. `button`, `dialog`). It writes into `src/components/ui/` and wires imports/deps. Prefer this over hand-copying so it matches the existing 40+ components.
- **Editing existing UI components is expected** — they are local files in `src/components/ui/`. Edit them directly for project-specific behavior; there is no upstream to break.
- **`cn()` from `@/lib/utils`** (clsx + tailwind-merge) is the canonical way to compose conditional/merged class names. Use it instead of string concatenation.
- **Theming is token-based.** Colors are HSL CSS variables defined in `src/index.css` and surfaced through `tailwind.config.ts` (e.g. `bg-background`, `text-primary`, `border-border`, the `sidebar-*` family). Style with these semantic tokens, **not** hard-coded hex/`gray-500` values, so light/dark modes (via `next-themes`, `darkMode: 'class'`) stay correct.
- **Layout shell** lives in `src/App.tsx`: a flex column `min-h-screen` with `<Navigation />`, a `flex-1` `<main>`, and `<Footer />`. The Tailwind `container` is centered with `2rem` padding, max width `1400px`. Responsive work uses Tailwind breakpoints; `src/hooks/use-mobile.tsx` provides a JS breakpoint check when CSS alone isn't enough.
- **Toasts:** both `Toaster` (Radix) and `Sonner` are mounted in `App.tsx`. Use the `use-toast` hook / `sonner` rather than adding another notification system.

When unsure about a shadcn/ui or Tailwind API, consult the context7 MCP server (live docs) rather than guessing — versions move fast here.

## Architecture

### Provider tree (`src/App.tsx`)
`QueryClientProvider` → `ThemeProvider` (next-themes, `defaultTheme="system"`) → `FontProvider` → `TooltipProvider` → toasters → `BrowserRouter`. New global concerns are added as providers here.

### Routing
Two content domains, each with **date-based and id-based** routes:
- Weekly prayers: `/prayers`, `/prayer/:date`, `/prayer/id/:id`
- Family prayers: `/family-prayers`, `/family-prayer/:date`, `/family-prayer/id/:id`
- Plus `/`, `/auth`, `/profile`, and a `*` catch-all (`NotFound`).

Routes must be declared **above** the `*` catch-all. SPA deep-linking on GitHub Pages works via `public/404.html`, which stashes the path in `sessionStorage.redirectPath`; `AppRoutes` reads and replays it on mount. Don't remove that handshake.

### Data layer (Supabase)
- `src/integrations/supabase/client.ts` and `types.ts` are **auto-generated — do not hand-edit.** The client URL/anon key are inlined (anon key is public by design; real protection is RLS).
- Core tables: `prayers` (`week_date`, `image_url`, timestamps) and `prayer_translations` (`language`, `title`, `content`) linked per prayer. Auth is Supabase Auth with **Row Level Security**.
- Local DB / schema work uses the **Supabase CLI**: SQL migrations live in `supabase/migrations/`, seed in `supabase/seed.sql`. After a schema change, regenerate types (`supabase gen types typescript ...`) rather than editing `types.ts`.
- **Edge Functions are Deno**, not Node — `.vscode/settings.json` scopes the Deno extension to `supabase/functions/`. Don't apply the app's Node/Vite tooling there.

### Internationalization
Default `zh-TW`, fallback/secondary `en`. Strings live in `src/i18n/locales/{en,zh-TW}.json`; never hard-code user-facing copy. Read via `useTranslation`; switch via `LanguageSwitcher`. Add every new key to **both** locale files.

### Images
User-uploaded prayer images are compressed client-side (`compressorjs`) before upload — see `src/lib/imageCompression.ts` and `src/lib/storageUtils.ts` (Supabase Storage).

## Commits, Releases & CI

- **Conventional Commits are mandatory** — release-please parses them. Recognized types map to changelog sections: `feat`, `fix`, `build`, `chore`, `refactor`, `docs`, `test` (`.github/release-please-config.json`).
- **Releases are commit-driven.** The release-please workflow only runs on `workflow_dispatch` or when a commit message starts with `release:`. It maintains a release PR; merging it tags a version and updates `CHANGELOG.md`.
- **Deployment = GitHub Pages on release publish** (`.github/workflows/pages.yml`), not self-hosted. A published GitHub Release triggers build + deploy; `BASE_PATH` is injected for correct asset paths.
- **Pre-commit:** Husky runs `lint-staged` — ESLint+Prettier on `*.{ts,tsx}`, Prettier on `*.{js,jsx,json,css,md}`. Don't bypass with `--no-verify`.

## Conventions

- **Imports:** always use the `@/` alias for internal modules (`import { Button } from '@/components/ui/button'`), configured in `vite.config.ts` and `tsconfig`.
- **Prettier** (`.prettierrc`): single quotes, semicolons, `printWidth` 80, 2-space indent, `trailingComma: es5`, always-parens arrows. Let `npm run format` settle style; don't fight it manually.
- **ESLint** intentionally disables `@typescript-eslint/no-unused-vars` and `react-refresh/only-export-components`; `prettier/prettier` is an error. Don't re-enable the disabled rules without reason.
