# Command Information Center

Command Information Center (CIC) v1.0.1 is the Foundry's private **React +
Express operator surface**. It reads GPT_OS enrollment, stable specs, each
scope's deterministic LLM Workbench selector, local Git evidence, and the live
Foundry Schematic into one freshness-visible Mirror. CIC renders and routes; it
does not become Canon or gain ambient authority to change Actuality.

When the sibling Personal Intelligence Platform is installed, CIC also renders
its latest cached repository, contract, OpenBrain, and CIC health result in the
System Health area.

The current primary surfaces are Command Deck, Awaiting You, Foundry
Intelligence, Steward's Summary, Master Taskboard, Scheduling, Projects,
Deployments, Foundry, and Skills. Personal email, finance, and music feeds are
not primary navigation. Existing connector and local-task APIs remain available
as secondary compatibility surfaces while their future disposition is decided.

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
- [`MEMORY.md`](MEMORY.md) — the room brain: durable room memory and routing for
  this project. It routes to the live controls above and up to the GPT_OS root
  Wiki; it never duplicates live task state.
- [`HARNESS_FEEDBACK.md`](HARNESS_FEEDBACK.md) — feedback to the reusable harness.
- [`SPEC_DIARY.md`](SPEC_DIARY.md) — raw, unfiltered UI/UX capture log from
  dashboard walkthroughs; promote an item into a spec/ticket rather than
  deleting the diary entry.

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

Open **http://localhost:8787**. Outside a GPT_OS checkout, the Foundry portfolio
degrades visibly because its registry is absent; no projects or next work are
invented. In the installed GPT_OS product, open
**http://servitor.local:8787/**.

## v1.0.1 operator check

In under one minute:

1. Open **Master Taskboard** and confirm `GPT_OS` is present.
2. Search for a known reference such as `S-027` or a ticket title, then filter
   by project and state. Rows marked **NEXT** must match that project's own
   `spec-workbench next --json` result.
3. Open **Deployments** and confirm every declared scope shows its remote,
   observed branch, SHA, dirty count, evidence boundary, and observation time.
4. Open **Foundry** and confirm the live Schematic loads from
   `servitor.local:5173` under the visible **Projection — never authority**
   boundary.
5. Open **Skills**, search for `lexicon`, and confirm the entry is sourced from
   the installed shared skill home.

The Master Taskboard is read-only and spans GPT_OS plus every active enrolled
scope. Enrollment comes from `Projects/INDEX.md`'s Active Portfolio table;
next-work evidence comes from the owning control surface, not a CIC heuristic.
Search spans stable references, project/spec/ticket names, owner, blockers, and
next gates. Project, status, owner, and freshness filters compose, and the
default hides completed history.

The older local SQLite-backed board remains a compatibility API. Those cards are
an operator workspace; repository `TASKBOARD.md` files remain their projects'
canonical queues. The Projects screen groups each project by its
`specs/*/SPEC.md` catalog, and every spec expands into its tickets. Canonical
projects display the stable `P-###` identity from generated
`Projects/INDEX.md`; spec rows combine it with the local spec ID as
`P-###/S-###`. Unenrolled folders remain visibly `Unnumbered`.
The Projects screen also shows one compact daily receipt card per enrolled
project plus a detailed card for the selected project. Receipts are derived
read-only from the selected stable spec, ticket, and latest append-only
evidence row. Missing or stale tests, audit/Medic, docs, recovery, or next-slice
proof stays visibly unrecorded; CIC does not create a second task or proof store.

The Awaiting You screen aggregates, across every discovered project, exactly the
work that is blocked on the owner: open Owner Decision rows and blocked
spec/ticket items whose blocker names the owner. Each entry states the precise
decision or acceptance being asked for — with options, recommendation,
cost/impact, next gate, and owner quoted from the project's own Markdown — so
you never open each board to reverse-engineer what you owe. A sidebar and mobile
badge shows the count, each item deep-links to its project spec, and the screen
says so honestly when nothing awaits you. It is read-only: CIC never approves or
resolves a decision on your behalf. To verify, open **Awaiting You** and confirm
the count matches the owner-gated items across your boards, or `curl
http://127.0.0.1:8787/api/awaiting-you`.

The Deployments screen shows a read-only release portfolio for canonical
projects enrolled in the generated GPT_OS `Projects/INDEX.md`, alongside the
release workflow for the fixed `KaydenClark/LLM_Workbench` `integration` to
`main` path. Project cards inspect bounded local Git refs and working-tree state;
they perform no fetch or deployment and do not claim production-host health.
The Workbench release action is available only
when CIC passcode protection is configured and remains blocked unless the
current detailed GitHub pull request is open and non-draft and its branch
ancestry, mergeability, and exact-SHA Auditor release gate all agree. Bounded
GitHub read failures preserve prior evidence as visibly stale and disable
mutations. A ready mobile card requires one fresh passphrase to record the
exact-fingerprint approval, explicitly confirms that GitHub is unchanged, and
then requires a separate fresh passphrase to execute only that durable operation.
Approval expires after 15 minutes and tolerates at most 60 seconds of future
clock skew. An expired or rejected operation for the same exact candidate can
be explicitly reapproved with a fresh approval passphrase while retaining its
prior events; execution still requires the separate Captain handoff passphrase.
Execution retries require the same current fingerprint, polling is sequential
and stops after 60 seconds, and applied operations expose verified merge evidence
without another merge action. There is no generic repository, branch, command,
URL, squash, rebase, force, or branch-delete input, and passphrases are cleared
after each response rather than persisted in the browser.
When no promotion PR is open, the card reports `Released` only if GitHub proves
the current integration head is already contained by main or an exact merged
promotion PR binds that integration SHA to the current main merge SHA. This
also recognizes the exact squash-merged Workbench PR #34 state.

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
| `GET /api/foundry-portfolio` | Registry-backed GPT_OS/Foundry portfolio: stable scope identity, exact Workbench next result, stable-spec tickets, local branch/SHA/upstream/dirtiness, and freshness. Read-only; performs no fetch or mutation. |
| `GET /api/project-deployments` | Legacy canonical-project release relationships retained for compatibility. The v1.0.1 Deployments screen uses `/api/foundry-portfolio`. |
| `POST /api/captain/workbench-release/approval` | `{ fingerprint, passcode }` revalidates the fixed candidate and records one approval intent. Requires a current session plus timing-safe step-up verification; accepts no repository, branch, command, or URL and performs no merge. |
| `POST /api/captain/workbench-release/execution` | `{ operationId, passcode }` atomically claims one approved operation, revalidates the exact PR/SHAs/gate, and queues one credential-free request to the fixed GPT_OS Captain worker. Requires a current session and a fresh second step-up; retries cannot duplicate an active handoff. |
| `GET /api/harness-flow` | Historical derived report adapter retained for compatibility. The primary Foundry tab now embeds the live non-executing Schematic and does not fabricate Job Order flow. |
| `GET /api/awaiting-you` | Aggregated owner queue across every discovered project: open Owner Decision rows and owner-gated blocked spec/ticket items, each with the exact decision, options, recommendation, cost/impact, next gate, owner, and a deep link. Read-only; approves or resolves nothing. |
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

When the service code runs from an isolated checkout, inject
`CIC_RUNTIME_ROOT=/absolute/path/to/canonical-cic` into the process environment
before startup. CIC then loads `.env`, SQLite, and the operator feed from that
existing canonical directory while serving the isolated checkout's code and
build. This bootstrap variable cannot be discovered from `.env` because it
selects which `.env` is loaded, and the dotenv loader always ignores that key.
CIC resolves symlinks once at startup and pins later local configuration writes
to that canonical root. An invalid, relative, missing, or non-directory value
stops startup explicitly.

Highlights:

- `PORT` / `HOST` — server bind (defaults `8787` / `0.0.0.0`).
- `CIC_RUNTIME_ROOT` — optional absolute existing canonical runtime directory; blank keeps source and runtime together.
- `CIC_GPT_OS_ROOT` — optional absolute GPT_OS root override. Installed and
  producer checkouts normally discover the ancestor containing
  `Projects/INDEX.md` automatically.
- `CIC_SKILL_CATALOG_PATH` — optional skill-root override. The default is the
  installed shared home `~/.agents/skills` and is read directly by v1.0.1.
- `CIC_DB` — local SQLite path for the task board and source status (auto-created).
- `CIC_DATA_FEED` — feed file the server reads (defaults to `data.js`).
- `PLATFORM_HEALTH_REPORT` — optional path to the cached sibling platform health report.
- `CIC_PASSCODE` — optional local passcode gate; only its SHA-256 hash is stored in memory. It is required to inspect the Workbench release candidate.
- `OPENAI_*` — model + embedding settings for server-side synthesis.
- `SUPABASE_*` / `QUERY_WIKI_*` / `OPENBRAIN_*` — backend retrieval (see `CONTRACT.md`).
- `SPOTIFY_*` / `ATLAS_URL` — optional music panel + player controls.

## Persistence

Local SQLite (auto-created at `CIC_DB`) holds `tasks`, `task_events`, `source_status`,
`refresh_runs`, `app_settings`, and fingerprint-bound `captain_operations` with
append-only `captain_operation_events`. Execution claims, request/result-bound
Captain handoffs, independently verified merge SHAs, sanitized failure codes,
and lifecycle events support fail-closed crash recovery.
Tasks are seeded from the briefing
actions and summarized email threads in the feed on first run. Full message
bodies and approval passcodes are never stored.

## Privacy model

- `.env`, SQLite files, logs, and `data.js` are gitignored and never committed.
- Rows and text classified as financial, purchase/device, or medical are tagged so the in-app
  privacy blur can hide them; the same classifier covers Intelligence cards and answers.
- The browser never receives server-side secrets such as OpenAI keys, Supabase
  service-role keys, or backend tokens. CIC holds no Workbench GitHub credential;
  the fixed Captain worker uses the Mac Mini `gh` Keychain session.

## License

MIT — see [`LICENSE`](LICENSE).
