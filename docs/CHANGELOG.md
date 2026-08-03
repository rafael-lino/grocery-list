# Changelog

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] — Description`

---

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
