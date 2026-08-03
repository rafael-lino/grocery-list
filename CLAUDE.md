# Grocery List App — Project Context

## Overview

A mobile-first Next.js PWA that helps users manage their home grocery inventory. Users interact via a chat interface powered by an LLM, which can read and update a local SQLite database. The goal is to make it effortless to know what's at home, what's running low, and what to buy on the next supermarket run.

## Tech Stack

| Concern        | Choice                                      |
| -------------- | ------------------------------------------- |
| Framework      | Next.js 14 (App Router)                     |
| Language       | TypeScript                                  |
| Styling        | Tailwind CSS (mobile-first, dark theme)     |
| Database       | SQLite via `better-sqlite3` + Drizzle ORM   |
| LLM            | Any OpenAI-compatible API (OpenAI, Gemini, Groq, OpenRouter, etc.) |
| PWA            | `next-pwa`                                  |
| State          | React built-ins (`useState`, `useReducer`)  |

## Design System

- **Theme:** Dark background (`#0a0a0a` / `#111`), purple/pink gradient accents
- **Accent colors:** Purple (`#7c3aed`), Pink (`#ec4899`), gradient blends between them
- **Typography:** Clean sans-serif, high contrast on dark backgrounds
- **Mobile-first:** All layouts designed for 390px viewport first

## Project Structure

```
/app
  /page.tsx              — Chat interface (main page)
  /settings/page.tsx     — LLM configuration
  /api/chat/route.ts     — LLM proxy + tool execution
/lib
  /db.ts                 — SQLite connection (singleton)
  /schema.ts             — Drizzle schema definition
  /repository.ts         — Data access layer (CRUD functions)
  /tools.ts              — LLM tool definitions and handlers
/public
  /manifest.json         — PWA manifest
  /icons/                — App icons
```

## Data Model

### `items` table

| Column           | Type    | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| `id`             | integer | Primary key, auto-increment                 |
| `name`           | text    | Item name (e.g. "Rice", "Milk")             |
| `type`           | text    | Unit type — dynamic string (kg, unit, package, liter, etc.) |
| `quantity`       | real    | Current quantity stored at home             |
| `ideal_quantity` | real    | Target quantity to keep stocked             |
| `created_at`     | integer | Unix timestamp                              |
| `updated_at`     | integer | Unix timestamp                              |

## LLM Tools

The LLM has access to the following tools to interact with the database:

| Tool                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `list_items`            | Return all items with current and ideal quantities       |
| `get_shopping_list`     | Return items where `quantity < ideal_quantity`           |
| `create_item`           | Add a new item                                           |
| `update_item`           | Update any field of an item by ID                        |
| `delete_item`           | Delete an item by ID                                     |
| `bulk_update_quantities`| Batch update quantities after a shopping trip            |

## LLM Integration

- Users configure their LLM in the Settings page: API Key, Base URL, and Model name
- Settings are stored in `localStorage` on the client and passed as request headers to `/api/chat`
- The `/api/chat` route proxies requests to the configured LLM using the OpenAI SDK
- Supports any OpenAI-compatible endpoint, including:
  - OpenAI: `https://api.openai.com/v1`
  - Gemini: `https://generativelanguage.googleapis.com/v1beta/openai/`
  - Groq: `https://api.groq.com/openai/v1`
  - OpenRouter: `https://openrouter.ai/api/v1`

## Key User Flows

1. **Check inventory** — User asks "what do I have?", LLM calls `list_items` and presents a readable summary
2. **Shopping list** — User asks "what do I need to buy?", LLM calls `get_shopping_list` and lists items below ideal quantity
3. **After shopping** — User says "I bought 2kg of rice and 3 liters of milk", LLM calls `bulk_update_quantities`
4. **Add item** — User says "add olive oil, I want to keep 2 bottles", LLM calls `create_item`
5. **Delete item** — User says "remove pasta from the list", LLM calls `delete_item`

## Development Notes

- Database file lives at `./grocery.db` (gitignored)
- API keys are never logged or persisted server-side
- All timestamps stored as Unix integers
- `next-pwa` handles service worker generation automatically on build
