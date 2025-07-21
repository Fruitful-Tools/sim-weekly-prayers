# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
npm run dev         # Start development server (default port 8080)
npm run build       # Production build
npm run build:dev   # Development build  
npm run lint        # Run ESLint for code quality
npm run lint:fix    # Run ESLint and auto-fix issues
npm run format      # Format all files with Prettier
npm run format:check # Check if files are formatted correctly
npm run preview     # Preview production build locally
```

## Architecture Overview

This is a bilingual (English/Traditional Chinese) React web application for SIM weekly prayers with the following stack:

- **Frontend**: React 18 + TypeScript + Vite + SWC
- **UI**: shadcn/ui components + Tailwind CSS  
- **Backend**: Supabase (PostgreSQL with real-time capabilities)
- **State Management**: TanStack Query + React Context (auth)
- **Internationalization**: i18next with default Traditional Chinese (`zh-TW`)
- **PWA**: Service worker + manifest for mobile app experience
- **Code Quality**: ESLint + Prettier with Husky pre-commit hooks

## Database Schema

Core tables in Supabase:
- `prayers`: Main prayer records with `week_date`, `image_url`, timestamps
- `prayer_translations`: Bilingual content linked to prayers with `language`, `title`, `content`

Authentication uses Supabase Auth with Row Level Security (RLS) policies.

## Key Development Patterns

### File Structure
- `src/pages/`: Route components (Home, Prayers, PrayerDetail, Auth, etc.)
- `src/components/ui/`: shadcn/ui component library (40+ components)
- `src/hooks/`: Custom hooks including `useAuth` for authentication
- `src/i18n/`: Internationalization with EN/ZH-TW locale files
- `src/integrations/supabase/`: Database client and generated TypeScript types

### Import Aliases
- `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.json)
- Use this for all internal imports: `import { Button } from "@/components/ui/button"`

### Authentication Flow
- `AuthProvider` wraps the entire app providing auth context
- `useAuth` hook for accessing user state and auth methods
- Protected routes check authentication status

### Internationalization
- Default language: Traditional Chinese (`zh-TW`) 
- Language switching via `LanguageSwitcher` component
- Translation files in `src/i18n/locales/`
- Use `useTranslation` hook from react-i18next

### Styling Conventions
- Utility-first CSS with Tailwind
- Dark/light theme support via `next-themes`
- Responsive design using Tailwind breakpoints
- shadcn/ui provides consistent component styling

## Code Quality & Git Hooks

- **Pre-commit Hooks**: Husky runs lint-staged before commits
- **Automated Formatting**: Prettier formats TypeScript, JavaScript, JSON, CSS, and Markdown files
- **Linting**: ESLint with React, TypeScript, and Prettier integration
- **Configuration**: 
  - `.prettierrc`: Prettier formatting rules
  - `eslint.config.js`: ESLint configuration with Prettier integration
  - `.husky/pre-commit`: Runs lint-staged on commit

## Development Notes

- **Lovable Integration**: Built for Lovable platform with automatic deployment
- **PWA Features**: Configured with service worker and comprehensive icon set
- **Type Safety**: Full TypeScript coverage with generated Supabase types
- **Real-time**: Supabase provides real-time subscription capabilities (not actively used but available)
- **Search**: Full-text search indexes available in database for prayer content
- **Code Quality**: All commits are automatically linted and formatted via pre-commit hooks