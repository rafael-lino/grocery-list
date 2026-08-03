# Backlog

Status legend: `[ ]` pending · `[x]` done · `[~]` in progress

---

## Phase 1 — Project Scaffolding

- [x] Initialize Next.js 14 with TypeScript and App Router
- [x] Install and configure Tailwind CSS
- [x] Install dependencies: `@libsql/client`, `drizzle-orm`, `drizzle-kit`, `openai`, `next-pwa`
- [x] Configure `tsconfig.json` path aliases (`@/`)
- [x] Set up `.gitignore` (node_modules, grocery.db, .env.local)
- [x] Configure `next.config.js` with PWA plugin

## Phase 2 — Database & Data Layer

- [x] Define `items` table schema with Drizzle ORM (`/lib/schema.ts`)
- [x] Create SQLite connection singleton (`/lib/db.ts`)
- [x] Implement repository functions in `/lib/repository.ts`:
  - [x] `getAllItems()`
  - [x] `getShoppingList()` — items where quantity < ideal_quantity
  - [x] `createItem(data)`
  - [x] `updateItem(id, data)`
  - [x] `deleteItem(id)`
  - [x] `bulkUpdateQuantities(updates[])`

## Phase 3 — LLM Tool Integration

- [x] Define tool schemas in `/lib/tools.ts` (OpenAI function-calling format)
- [x] Implement tool handler that maps tool name → repository function
- [x] Build `/api/chat/route.ts`:
  - [x] Accept conversation history + user message
  - [x] Read LLM config from request headers (API key, base URL, model)
  - [x] Send messages + tools to LLM via OpenAI SDK
  - [x] Handle tool calls in an agentic loop
  - [x] Return final assistant message

## Phase 4 — Chat UI

- [x] Build chat page layout (`/app/page.tsx`):
  - [x] Dark background with gradient accents
  - [x] Scrollable message list
  - [x] User bubble (purple/pink gradient, right-aligned)
  - [x] Assistant bubble (dark card, left-aligned)
  - [x] Input bar pinned to bottom with send button
- [x] Handle loading / thinking state (animated dots)
- [x] Welcome screen with quick-action suggestion chips
- [x] Settings icon in header linking to `/settings`
- [x] Persist conversation history in component state

## Phase 5 — Settings Page

- [x] Build `/app/settings/page.tsx`
- [x] Fields: API Key (masked), Base URL, Model name
- [x] Save to `localStorage`
- [x] Load saved values on mount
- [x] Provider presets (OpenAI, Gemini, Groq, OpenRouter)
- [x] "Test connection" button
- [x] Back navigation to chat

## Phase 7 — Authentication

- [x] `lib/auth.ts` — Edge-compatible HMAC-SHA256 sign/verify helpers + cookie constants
- [x] `app/api/auth/route.ts` — POST (login) + DELETE (logout) with IP-based rate limiting
- [x] `middleware.ts` — protects all routes, redirects unauthenticated requests to `/login`
- [x] `app/login/page.tsx` — password login UI matching dark theme
- [x] Sign Out button in Settings page
- [ ] Set `AUTH_SECRET` env var in Vercel project settings

## Phase 6 — PWA & Polish

- [x] Create `public/manifest.json`
- [x] Configure `next-pwa` in `next.config.js`
- [x] Add `<meta>` viewport and theme-color tags in layout
- [x] Generate and add app icons (192x192, 512x512) — square cart, purple/pink gradient
- [x] Fix manifest icon entries: split `any` and `maskable` into separate entries
- [x] Add `apple-touch-icon` via layout metadata (iOS Home Screen support)
- [x] Verify installability on mobile (Lighthouse PWA check)
- [x] `npm install` and first run verification
