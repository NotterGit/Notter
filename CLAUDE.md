# Notter — Notion-like note-taking application

## Development Commands
- **Check TypeScript types:** `npx tsc --noEmit`
- **Linter checks:** `npm run lint`
- **Find unused code/dependencies:** `npm run knip`
- **Prisma generate:** `npx prisma generate`
- **Prisma push:** `PRISMA_SCHEMA_ENGINE_BINARY="/run/current-system/sw/bin/schema-engine" npx prisma db push`
- **Start dev server (Turbopack):** `npm run dev` (or `npm run dev:https` for HTTPS, `npm run dev:webpack` for Webpack)
- **Build production app:** `npm run build`
- **Start production server:** `npm run start`
- **Build desktop application (pake-cli):**
  - Windows (MSI): `npm run pake:windows`
  - Linux (DEB, AppImage, RPM): `npm run pake:linux`
  - macOS (DMG): `npm run pake:macos`
  - All platforms: `npm run pake:all`
- **Rules for AI Assistant:**
  - **CRITICAL:** Do NOT run `npm run dev` or `npm run build`! Only verify code using `npx tsc --noEmit` and `npm run lint`.

## Project Structure
- `public/` — Static assets organized by domain (`ai-icons/`, `badges/`, `bg/`, `defaults/`, `fonts/`, `icons/`, `images/`, `landing/`, `logos/`).
- `prisma/` — Database schema (`schema.prisma`) defining `Document` (`Documents`), `NoteAuditLog` (`NoteAuditLogs`), and preserved `notter-todo` models (`Board`, `List`, `Card`, `AuditLog`) for shared MariaDB database.
- `src/actions/` — Server Actions following the `notter-todo` safe-action pattern (`index.ts`, `schema.ts`, `types.ts` via `createSafeAction`):
  - `create-document/`, `update-document/`, `archive-document/`, `restore-document/`, `delete-document/`, `reorder-documents/`, `move-document/`, `remove-icon/`, `remove-cover/`, `increment-views/`, `set-archive-retention/`, `clean-expired-trash/`.
- `src/api/` — Backend REST API clients (`client.ts`, `user.ts`, `org.ts`, `s3.ts`, `admin.ts`, `files.ts`, `document-limit.ts`, `image.ts`). User `archived_settings` are stored directly on the NotterAPI backend.
- `src/app/` — Next.js 15 App Router:
  - `(landing)/` — Welcome and landing page.
  - `(main)/` — Primary application workspace (dashboard, document editor/viewer).
  - `(profile)/` — Profile, user, and organization settings.
  - `(public)/` — Publicly shared document views (accessible without auth).
  - `api/documents/` — Route handlers for sidebar tree, trash, search, document limits, stats, archive settings, short URLs, and document by ID.
  - `api/image/route.ts` — S3 image proxy route handler (`/api/image`).
  - `api/ai/` — AI generation (`/api/ai/generate`) and weekly limit checking (`/api/ai/limits`).
  - `api/backgrounds/route.ts` — Cover collection listing route handler (`/api/backgrounds`).
- `src/components/` — Shared React components, Modals, Providers (`query-provider.tsx`, `clerk-theme-provider.tsx`), and hooks.
- `src/config/` — Centralized configuration:
  - `const/` — Constants (`editor.const.ts`, `limits.const.ts`, `banner-images.const.ts`, `components.const.ts`, `app.const.ts`, `api.const.ts`).
  - `types/` — TypeScript domain types (`editor.types.ts`, `limits.types.ts`, `ai.types.ts`, `components.types.ts`, `api.types.ts`, `main.types.ts`, `profile.types.ts`, `public.types.ts`, `landing.types.ts`, `actions.types.ts`).
  - `routing/` — Navigation paths (`pages.route.ts`, `api.route.ts`, `image.route.ts`, `links.route.ts`).
- `src/hooks/` — Application hooks (`use-action.ts`, `use-mobile.ts`, etc.).
- `src/lib/` — Utilities (`db.ts` with MariaDB driver adapter, `create-safe-action.ts`, `audit-log.ts`, `fetcher.ts`, `gen-id.ts`, `document-tree.ts`, `document-id.ts`, `image-url.ts`, `plan-limits.ts`).

## Tech Stack & Core Features
- **Authentication:** Clerk (`@clerk/nextjs`) with multi-session support and middleware session synchronization.
- **Database & ORM:** Prisma ORM with MariaDB via `@prisma/adapter-mariadb` driver adapter (connection pool limit 15, protocol compression enabled). Database is shared with `notter-todo` on `casaos` (`mysql`), maintaining PascalCase tables (`Documents`, `NoteAuditLogs`, `Board`, `List`, `Card`, `AuditLog`) with composite indexes for user document filters. User archive settings are managed on the primary NotterAPI backend (`users` collection).
- **Data Fetching & Mutations:**
  - Client reads use TanStack Query (`@tanstack/react-query`) fetching from internal Next.js REST API routes (`/api/documents/*`).
  - Client mutations use Server Actions (`src/actions/*`) wrapped with `useAction` hook (`use-action.ts`).
- **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss`.
- **Editor:** Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, custom extensions for resizable images, video, audio, AI text generation, color/highlight pickers, S3 media uploads) for all production documents and editor sandbox.
- **Desktop Packaging:** Pake-cli integration for packaging web app into lightweight desktop builds.

## Coding Guidelines
- **TypeScript:** Strict type checks (`npx tsc --noEmit`), avoid using `any`.
- **Centralized Config & Types:** All constants must reside in `@/config/const/` and all types in `@/config/types/`. Always import constants and types directly from `@/config/...`. Never create or keep proxy/alias re-export files or duplicate declarations in component directories.
- **Server Actions Pattern:** Structure all mutations under `src/actions/<action-name>/` with `schema.ts`, `types.ts`, and `index.ts`. Always validate input via Zod and wrap handlers with `createSafeAction`.
- **Database Access:** Access MariaDB exclusively through `db` (`@/lib/db`) using Prisma Client. Never execute raw unvalidated SQL.
- **Imports:** Use absolute path aliases like `@/components/...`, `@/config/...`, `@/actions/...`, `@/lib/...`.
- **Components:** Maintain modular architecture; separate layout structure, presentation, and logic.

## Auto-Update Rule (English Only)
> [!IMPORTANT]
> When modifying the project (adding packages, modifying scripts in `package.json`, updating Prisma schema in `prisma/schema.prisma`, changing folder structures, or adjusting authentication/APIs), the AI assistant **MUST** update this `CLAUDE.md` file to reflect these changes.
> **Language:** This file must ALWAYS be maintained in English.
> **Line Limit:** The file must remain concise and strictly **under 200 lines** to preserve context window capacity.
