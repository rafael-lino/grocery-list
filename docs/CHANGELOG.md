# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

---

## [2026-08-03] — Fix delete/update broken by sanitizeToolResult

- Removed `sanitizeToolResult` from `app/api/chat/route.ts` — it was stripping `id` from tool results, preventing the LLM from passing IDs back as arguments to `delete_item`, `update_item`, and `bulk_update_quantities`
- IDs are kept out of user-facing replies via the system prompt instruction alone, which is the correct boundary

## [2026-08-03] — Fix markdown rendering on mobile

- Replaced `transpilePackages` list (31 entries) with `experimental: { esmExternals: false }` in `next.config.js`
- This tells Webpack to bundle all ESM packages automatically — no need to maintain a per-package list as dependencies update

## [2026-08-03] — Upgrade react-markdown to v10 + remark-gfm to v4

- Upgraded `react-markdown` from v8 → v10 and `remark-gfm` from v3 → v4
- Added `transpilePackages: ['react-markdown', 'remark-gfm']` to `next.config.js` — required because v10/v4 are ESM-only and Next.js 14's Webpack treats node_modules as CJS by default, causing silent render failures without this flag

## [2026-08-03] — Markdown responses

- Installed `react-markdown` and `remark-gfm`
- Updated system prompt: LLM now always responds in Markdown, uses GFM tables for item lists, bullet lists for single confirmations, never exposes IDs
- Added `sanitizeToolResult` in `api/chat/route.ts`: strips `id`, `createdAt`, `updatedAt` from all tool results before they reach the LLM
- Added `AssistantMarkdown` component in `app/page.tsx` with custom dark-theme styles for tables (purple header, bordered, alternating rows), lists, strong, code, and paragraphs
- User bubbles remain plain text

## [2026-08-03] — SQLite → Turso migration

- Removed `better-sqlite3` and `@types/better-sqlite3`
- Added `@libsql/client`
- Rewrote `lib/db.ts`: replaced file-based SQLite singleton with `@libsql/client` + `drizzle-orm/libsql` HTTP adapter
- Updated `drizzle.config.ts`: `dialect: 'turso'`, credentials from `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` env vars
- Credentials stored in `.env` (gitignored); must also be set in Vercel project settings

## [2026-08-03] — PWA icons & docs reorganisation

- Moved `BACKLOG.md` and `CHANGELOG.md` to `/docs`
- Generated `public/icons/icon-192.png` and `icon-512.png` — square cart icon, purple→pink gradient background, white cart graphic
- Fixed `manifest.json`: split `"any maskable"` into separate icon entries (Lighthouse requirement)
- Added `apple-touch-icon` via `metadata.icons.apple` in `app/layout.tsx` (iOS Add to Home Screen)

## [2026-08-03] — Authentication

- Added `lib/auth.ts`: Edge-compatible HMAC-SHA256 token sign/verify using Web Crypto API
- Added `app/api/auth/route.ts`: POST login (validates `AUTH_SECRET`, sets 60-day httpOnly cookie) + DELETE logout + IP-based rate limiting (10 attempts / 15 min)
- Added `middleware.ts`: protects all routes except `/login`, `/api/auth`, and static assets
- Added `app/login/page.tsx`: password unlock screen matching the app's dark theme
- Added Sign Out button to Settings page

## [2026-08-03] — Initial implementation

- Created `CLAUDE.md` with full project context, data model, and LLM tool documentation
- Created `BACKLOG.md` with phased task breakdown
- Created `CHANGELOG.md`
- Scaffolded Next.js 14 App Router project with TypeScript
- Configured Tailwind CSS with custom dark theme (surface colors + purple/pink accent palette)
- Added `next-pwa` configuration for PWA support
- Defined Drizzle ORM schema for `items` table (`lib/schema.ts`)
- Implemented SQLite singleton connection with auto-table-creation (`lib/db.ts`)
- Built full data access layer with 6 repository functions (`lib/repository.ts`)
- Defined 6 LLM tools in OpenAI function-calling format (`lib/tools.ts`)
- Implemented agentic `/api/chat` route with tool execution loop
- Built mobile-first dark chat UI with gradient bubbles, typing indicator, suggestion chips
- Built Settings page with provider presets (OpenAI, Gemini, Groq, OpenRouter), API key masking, and test connection
- Added PWA manifest (`public/manifest.json`)
- Added app layout with viewport and theme-color meta tags
