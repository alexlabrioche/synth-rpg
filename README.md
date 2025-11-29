# Synth RPG Monorepo

A playground for generating modular-synth inspired RPG characters and running narrative sessions backed by LLMs. The repository is a PNPM workspace with shared domain packages so the API, specs, and upcoming frontend stay in sync.

## Monorepo Layout

| Path | Description |
| --- | --- |
| `apps/api` | Fastify service that exposes the RPG API, persists game state via lightweight JSON stores, and orchestrates the LLM prompts. |
| `apps/web` | TanStack Router + Vite client (to be implemented) that will consume the API and specs packages. |
| `packages/types` | Shared Zod schemas and TypeScript types (`Character`, `Session`, `Capability`, etc.). |
| `packages/specs` | Source of truth for capability metadata and translations (`capabilities-catalog.ts`, `i18n/en.json`, `i18n/fr.json`). |
| `scripts` | One-off utilities (e.g., `extract-icon-names.mjs` to sync icon assets, catalog entries, and translations). |

## API (apps/api)

- **Base URL:** `http://localhost:4000/api/v1`
- **Auth:** none (development purposes)
- **Content type:** `application/json`

### Resources & Endpoints

#### Capabilities
- `GET /capabilities` – returns the grouped capability catalog plus flattened list and i18n keys so clients can build capability pickers.

#### Characters
- `POST /characters` – body `{ "capabilityIds": string[], "lang": "en" | "fr" }`. Generates a character, persists it, and returns the full `Character` record with translated capability blurbs used for the LLM prompt.
- `GET /characters/:characterId` – retrieves a previously generated character (useful after refresh).
- `GET /characters` *(planned)* – list all generated characters in storage for debugging/demo purposes.

#### Sessions
- `POST /sessions` – body `{ "characterId": string, "lang": "en" | "fr" }`. Starts a session for the given character, returning `{ session, prelude }`.
- `GET /sessions/:sessionId` – fetches the current session state so UIs can rehyrdate on load.
- `POST /sessions/:sessionId/turns` – advances the campaign by one turn. The API rolls the d20 internally, feeds the context to the LLM, saves the resulting `GameEvent`, adjusts stats, and returns `{ session, event }`.
- `GET /sessions/:sessionId/events` – history endpoint to retrieve all prior events for rendering timelines or logs.

> **Note:** The API currently responds with English copy by default; pass `"lang": "fr"` wherever allowed to request French capability descriptions and LLM prompts.

### Error Model

- `4xx` codes for validation or missing resources (e.g., unknown `characterId` or `sessionId`).
- `500` for LLM/infra issues; payload includes `{ "error": string, "detail": string }`.

### Local Development

```bash
pnpm install
pnpm --filter @synth-rpg/api dev
```

The API boots on port `4000` with logging enabled. Data is written to `apps/api/data.json`, so delete the file between runs to reset state.
