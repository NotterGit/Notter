# Notter — Notion-like note-taking application

## Development Commands
- **Start dev server:** `npm run dev` (or `npm run dev:https` for HTTPS)
- **Build production app:** `npm run build`
- **Start production server:** `npm run start`
- **Linter checks:** `npm run lint`
- **Find unused code/dependencies:** `npm run knip`
- **Build desktop application (pake-cli):**
  - Windows (MSI): `npm run pake:windows`
  - Linux (DEB, AppImage, RPM): `npm run pake:linux`
  - macOS (DMG): `npm run pake:macos`
  - All platforms: `npm run pake:all`
  - Dev/Beta (dev.notter.su):
    - Build: `npm run pake:dev`
    - Windows (MSI): `npm run pake:dev:windows`
- **Troubleshooting:**
  - If Next.js/Tailwind CSS compilation fails with a missing `lightningcss` binary error on Linux, ensure `lightningcss-linux-x64-gnu` is installed.

## Project Structure
- `public/` — Static assets organized by domain (`badges/`, `defaults/`, `fonts/`, `icons/`, `images/`, `landing/`, `logos/`).
- `src/app/` — Next.js 15 App Router routes.
  - `(landing)/` — Welcome and landing page.
  - `(main)/` — Primary application workspace (dashboard, document editor/viewer).
  - `(profile)/` — Profile, user, and organization settings.
  - `(public)/` — Publicly shared document views (accessible without auth).
  - `api/` — API route endpoints.
  - `globals.css` — Global styles (Tailwind CSS v4).
  - `manifest.ts` — Dynamic PWA manifest.
- `src/components/` — Shared React components.
  - `hooks/` — Custom React hooks (`use-settings`, `use-search`, `use-scroll-top`, `use-workspace-admin`, etc.).
  - `ui/` — Base UI components (Radix UI / custom).
- `src/lib/` — Utilities (PWA, Desktop App helper, image URLs, plan limits).
- `convex/` — Backend logic and Database configuration on Convex.
  - `schema.ts` — Database schema (defines `documents` and `archiveSettings` tables).
  - `document.ts` — Queries and mutations for document CRUD and archive auto-cleanup.
  - `rateLimits.ts` — API rate limiter implementation.

## Tech Stack & Core Features
- **Authentication:** Clerk (`@clerk/nextjs`).
- **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss`.
- **Editor:** BlockNote (`@blocknote/react` and `@blocknote/mantine`).
- **Drag & Drop:** `@hello-pangea/dnd` for hierarchical note reordering and nesting in the sidebar.
- **Database:** Convex Cloud. Document table schema features fields like `title`, `userId`, `isAcrhived`, `archivedTime`, `isPinned`, `parentDocument`, `order`, `content`, `coverImage`, `icon`, `isPublished`, etc. `archiveSettings` stores `userId` and `retentionDays` (1, 7, 30 days for Amber, 90 days for Diamond).
- **Convex Indexes:**
  - `documents.by_user`: `["userId"]`
  - `documents.by_user_parent`: `["userId", "parentDocument"]`
  - `archiveSettings.by_user`: `["userId"]`
- **Desktop Packaging:** Pake-cli integration for packaging web app into lightweight desktop builds.

## Coding Guidelines
- **TypeScript:** Strict type checks, avoid using `any`.
- **Convex Operations:** All DB reads/writes must go through Convex mutations/queries. Verify identity via `ctx.auth.getUserIdentity()`.
- **Imports:** Use absolute path aliases like `@/components/...` or `@/lib/...`.
- **Components:** Maintain modular architecture; separate layout structure, presentation, and logic.
- Do not run `npm run dev` or `npm run build`!

## Auto-Update Rule (English Only)
> [!IMPORTANT]
> When modifying the project (adding packages, modifying scripts in `package.json`, updating the Convex schema in `convex/schema.ts`, changing folder structures, or adjusting authentication/APIs), the AI assistant **MUST** update this `CLAUDE.md` file to reflect these changes.
> **Language:** This file must ALWAYS be maintained in English.
> **Line Limit:** The file must remain concise and strictly **under 200 lines** to preserve context window capacity.
