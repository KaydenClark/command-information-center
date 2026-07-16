# Command Information Center

Command Information Center (CIC) is a reference **React + Express dashboard** for an
OpenBrain-style retrieval-augmented-generation (RAG) backend. It pulls a summarized
operational feed into a single operator view — a morning briefing, a task/Kanban board,
and panels for email, calendar, GitHub, deploys, files, finances, and music — and adds an
**Intelligence** tab that answers questions over your own knowledge base.

When the sibling Personal Intelligence Platform is installed, CIC also renders
its latest cached repository, contract, OpenBrain, and CIC health result in the
System Health area.

It runs **standalone in demo mode** with synthetic data and **no credentials**. Point it at
a real backend when you want live retrieval and AI synthesis.

> The frontend and HTTP API are the whole of this repo. The durable memory / vector-retrieval
> layer (Supabase/Postgres + embeddings) lives in a separate backend. See
> [`CONTRACT.md`](CONTRACT.md) for the exact interface CIC expects so you can bring your own.

## Project controls

This repository uses the LLM Workbench v2.3 spec-centered control surface:

- [`AGENTS.md`](AGENTS.md) — agent authority, scope, branch flow, and proof rules.
- [`BLUEPRINT.md`](BLUEPRINT.md) — stable product, architecture, and safety truth.
- [`LEXICON.md`](LEXICON.md) — shared project vocabulary.
- [`CLAUDE.md`](CLAUDE.md) — thin Claude entry point into the shared rules.
- [`README.md`](README.md) — public setup and usage.
- [`RUNBOOK.md`](RUNBOOK.md) — exact install, run, verification, and recovery steps.
- [`TASKBOARD.md`](TASKBOARD.md) — generated active-work projection.
- [`specs/`](specs/) — stable capability requirements, decisions, and proof.
- [`HARNESS_FEEDBACK.md`](HARNESS_FEEDBACK.md) — feedback to the reusable harness.

`main` is the release branch. `Integration` is the staging bridge: normal task
branches start from it and open pull requests back into it. Only the repository
owner promotes `Integration` to `main`.

## Quick start (demo mode)

Requires **Node ≥ 22** (`server/db.js` uses the built-in `node:sqlite` `DatabaseSync`).

```bash
npm install
cp data.example.js data.js     # synthetic feed; data.js is gitignored
npm run build                  # build the client into dist/
npm start                      # serves API + client on http://localhost:8787
```

Open **http://localhost:8787**. The dashboard renders fully from `data.example.js` — every
panel, the seeded task board, and the Intelligence tab — with no backend configured.

The Personal To-Dos screen supports a local SQLite-backed board. These cards are
an operator workspace; repository `TASKBOARD.md` files remain their projects'
canonical queues.

The Deployments screen shows the release workflow for the fixed
`KaydenClark/LLM_Workbench` `integration` to `main` path. It is available only
when CIC passcode protection is configured and remains blocked unless the
current detailed GitHub pull request is open and non-draft and its branch
ancestry, mergeability, and exact-SHA Auditor release gate all agree. Bounded
GitHub read failures preserve prior evidence as visibly stale and disable
mutations. A ready mobile card requires one fresh passphrase to record the
exact-fingerprint approval, explicitly confirms that GitHub is unchanged, and
then requires a separate fresh passphrase to execute only that durable operation.
Execution retries require the same current fingerprint, polling is sequential
and stops after 60 seconds, and applied operations expose verified merge evidence
without another merge action. There is no generic repository, branch, command,
URL, squash, rebase, force, or branch-delete input, and passphrases are cleared
after each response rather than persisted in the browser.

For client hot-reload during development, run `npm run dev` (Vite on `:5173`, proxying `/api`
to the server on `:8787`) in a second terminal alongside `npm start`.

```bash
npm test                       # node:test unit + API tests
npm run test:browser           # Chromium desktop/mobile workflow smoke tests
```

## Demo vs. live

CIC degrades deliberately — it never fabricates AI output.

- **No credentials (demo):** the server reads `data.js` and renders deterministic fallback
  states. The Intelligence tab shows briefing/insights derived straight from the feed and a
  keyword view of any configured knowledge base. No OpenAI calls are made.
- **With credentials (live):** set keys in `.env` (see [`.env.example`](.env.example)) to enable
  server-side embedding + synthesis and OpenBrain retrieval. The browser never receives OpenAI
  keys, Supabase service-role keys, or backend tokens — all privileged calls happen server-side
  behind `/api`.

If a backend is configured but unreachable, the affected source is marked degraded and the UI
falls back to the deterministic state rather than erroring out.

## Bring your own OpenBrain backend

CIC is the consumer side of a RAG system. To wire it to a real backend you provide:

1. A Postgres/Supabase database with the wiki tables and RPCs described in
   [`CONTRACT.md`](CONTRACT.md), plus the `prescient_tasks` table created by
   [`supabase/migrations/`](supabase/migrations/).
2. Embeddings using `text-embedding-3-small` (**1536 dimensions**).
3. The matching environment variables (`SUPABASE_URL`, a service-role key, optionally a
   `query-wiki` edge function URL + token, and `OPENAI_API_KEY` for synthesis).

[`CONTRACT.md`](CONTRACT.md) is the authoritative consumer-side summary: tables, RPC
signatures, env vars, and the edge-function request/response shape.

## API

All routes are served by the Express app in [`server/`](server/). When `CIC_PASSCODE` is set,
`/api/*` (except `/api/auth/*`) and Spotify OAuth routes require a session cookie obtained from `/api/auth/login` when a passcode is configured.

| Method & path | Purpose |
|---|---|
| `GET /api/state` | Full dashboard state: feed, task cards, source health, Spotify player, settings. |
| `GET /api/captain/workbench-release` | Fixed read-only Workbench `integration` to `main` candidate, exact-SHA Auditor evidence, and latest durable operation. Requires configured passcode protection and an authenticated session. |
| `POST /api/captain/workbench-release/approval` | `{ fingerprint, passcode }` revalidates the fixed candidate and records one approval intent. Requires a current session plus timing-safe step-up verification; accepts no repository, branch, command, or URL and performs no merge. |
| `POST /api/captain/workbench-release/execution` | `{ operationId, passcode }` atomically claims one approved operation, revalidates the exact PR/SHAs/gate, and uses only a merge commit. Requires a current session, step-up verification, and server-only `WORKBENCH_GITHUB_TOKEN`; retries cannot double-merge. |
| `GET /api/intelligence/overview` | Deterministic current-state briefing, insights, anomalies, chart data, suggested questions. |
| `GET /api/intelligence/kb` | Knowledge-base chunks (keyword search) + open prescient tasks. Pure DB read. |
| `GET /api/intelligence/sources` | Normalized availability of CIC, OpenBrain, Supabase, OpenAI, and connectors. |
| `POST /api/intelligence/ask` | `{ question, area? }` → source-backed answer + follow-ups (uses OpenAI + retrieval when configured). |
| `POST /api/tasks` | Create a task card. |
| `PATCH /api/tasks/:id` | Update task fields or move the card across the board. |
| `POST /api/tasks/:id/dismiss` | Dismiss a suggested card. |
| `POST /api/refresh/gmail` | Re-derive summarized email task suggestions from the current feed. |
| `GET /api/spotify/player` | Spotify playback state, or a degraded state when unavailable. |
| `POST /api/spotify/control` | `{ action }` ∈ `play \| pause \| next \| previous` when a token + active device exist. |
| `POST /api/refresh/gmail` | Run the configured summarized Gmail refresh and return its current attempt/success timestamps. |

The dashboard's **Refresh Gmail suggestions** control runs the supported Gmail adapter. Its age
comes from recorded refresh runs; `/api/state.refreshedAt` is only the response
time and must not be interpreted as connector freshness.

`/api/state.platformHealth` is a sanitized server-side view of the cached
Personal Intelligence Platform report. CIC never executes the platform checker
from a browser request.

## Configuration

All configuration is via environment variables, loaded from `.env` (gitignored). Copy
[`.env.example`](.env.example) and fill in only what you need — every credential is optional and
the app runs without any of them.

Highlights:

- `PORT` / `HOST` — server bind (defaults `8787` / `0.0.0.0`).
- `CIC_DB` — local SQLite path for the task board and source status (auto-created).
- `CIC_DATA_FEED` — feed file the server reads (defaults to `data.js`).
- `PLATFORM_HEALTH_REPORT` — optional path to the cached sibling platform health report.
- `CIC_PASSCODE` — optional local passcode gate; only its SHA-256 hash is stored in memory. It is required to inspect the Workbench release candidate.
- `WORKBENCH_GITHUB_TOKEN` — optional server-only token with the minimum permission needed to merge the fixed Workbench pull request. Without it, execution records a blocked result and GitHub is unchanged.
- `OPENAI_*` — model + embedding settings for server-side synthesis.
- `SUPABASE_*` / `QUERY_WIKI_*` / `OPENBRAIN_*` — backend retrieval (see `CONTRACT.md`).
- `SPOTIFY_*` / `ATLAS_URL` — optional music panel + player controls.

## Persistence

Local SQLite (auto-created at `CIC_DB`) holds `tasks`, `task_events`, `source_status`,
`refresh_runs`, `app_settings`, and fingerprint-bound `captain_operations` with
append-only `captain_operation_events`. Execution claims, verified merge SHAs,
sanitized failure codes, and lifecycle events support idempotent crash recovery.
Tasks are seeded from the briefing
actions and summarized email threads in the feed on first run. Full message
bodies and approval passcodes are never stored.

## Privacy model

- `.env`, SQLite files, logs, and `data.js` are gitignored and never committed.
- Rows and text classified as financial, purchase/device, or medical are tagged so the in-app
  privacy blur can hide them; the same classifier covers Intelligence cards and answers.
- The browser never receives server-side secrets (OpenAI keys, Supabase service-role keys, or
  backend tokens, or the Workbench GitHub token). All privileged calls run behind `/api`.

## License

MIT — see [`LICENSE`](LICENSE).
