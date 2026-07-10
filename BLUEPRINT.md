# Command Information Center - Blueprint

> Generated from LLM Workbench v2.1. See `RUNBOOK.md` -> Upgrading The Harness.

**Last reviewed:** 2026-07-10
**Status:** active
**Source root:** this repository

This is the stable reference for what Command Information Center is. Current
work and proof live in `TASKBOARD.md`; exact operations live in `RUNBOOK.md`.

## What This Project Is

Command Information Center (CIC) is a React + Express dashboard for viewing an
operational feed, managing a local task board, inspecting connector health, and
querying an OpenBrain-style retrieval backend. The repository is a safe public
reference implementation: it runs with synthetic data and no credentials, while
real deployments keep private feeds, databases, and service credentials local.

Core promise:

> Give the operator one honest control surface for current work and connected
> information without fabricating live state or leaking private credentials.

Primary users:

- An operator running CIC locally or on a trusted LAN.
- Agents and maintainers extending the dashboard, API, and backend adapters.

## Non-Goals

This project is not trying to:

- Become the durable OpenBrain memory or vector-retrieval backend.
- Commit or publish a real operator feed, database, credentials, or OAuth tokens.
- Fabricate AI or connector results when a dependency is missing.
- Replace project-owned source files with a second hidden task database.

## Current Product Shape

When the project is working, a user can:

- Run a fully rendered synthetic demo without credentials.
- Review briefing, tasks, calendar, projects, deployments, inbox, finance, and
  music panels from one responsive interface.
- Create, update, move, complete, dismiss, search, and review grouped Board/List
  views of SQLite-backed task cards.
- Ask source-backed questions through the Intelligence surface when OpenAI and
  OpenBrain-style retrieval are configured, with deterministic partial states
  when they are not.
- Inspect source health and use Spotify playback controls when authorized.
- Run the supported Gmail update on demand and see its last attempt, last success,
  and age without mistaking page-load time for connector freshness.

The most important quality bar is source truth with privacy: stale, offline, or
unconfigured sources must be visible as such, and privileged data must stay on
the server or in ignored local files.

## Direction And Build Order

Current phase:

- Staging consolidation and operator-trust hardening on the `Integration`
  branch.

Build order:

1. Protect the existing app contracts: auth, API JSON behavior, task
   persistence, deterministic demo mode, test health, and a reproducible build.
2. Make freshness explicit: distinguish loading cached state from performing a
   real update and show source age/last success.
3. Deepen task workflows: evolve the board toward richer grouped list/board
   operations without creating a second canonical project queue.
4. Expand browser-level verification and connector hardening before promoting
   `Integration` to `main`.

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js 22+ | Required for built-in `node:sqlite`; `package.json` |
| Frontend | React 18, Vite 8, Lucide React | `src/main.jsx`, `src/intelligence.jsx`, `src/styles.css` |
| Backend | Express 5 | `server/app.js`, started by `server/index.js` |
| Local storage | SQLite plus a summarized JavaScript feed | `server/db.js`; ignored `data/cic.sqlite`; `data.example.js` contract |
| Auth | Optional passcode session cookie | `server/app.js`, `server/config.js` |
| Retrieval and synthesis | OpenBrain/Supabase adapters plus optional OpenAI synthesis | `server/openbrainClient.js`, `server/openbrainKeyword.js`, `server/openaiSynthesisClient.js` |
| Music | Spotify Web API and optional Atlas link | `server/spotify.js`, `src/atlasUrl.js` |
| Backend schema | Optional Supabase migration for prescient tasks | `supabase/migrations/` |
| Testing | Node test runner | `npm test` executes `test/*.test.js` |
| Delivery | Local/LAN Express service serving the Vite build | `npm run build`, `npm start` |

Architecture constraints:

- The committed repository must remain runnable without credentials.
- Real `.env`, `data.js`, SQLite, logs, and tokens remain ignored.
- Browser code must never receive server-side OpenAI, Supabase service-role,
  OpenBrain bearer, Spotify client-secret, or refresh-token values.
- Missing dependencies degrade visibly instead of producing fake live output.
- `main` is release; `Integration` is staging; task work enters through pull
  requests from short-lived branches.

## Directory Map

```text
command-information-center/
|-- src/                    <- React views, privacy classification, brand styles
|-- server/                 <- Express API, SQLite, connectors, intelligence
|-- test/                   <- Node unit and API specifications
|-- supabase/migrations/    <- optional backend schema owned by explicit tasks
|-- data.example.js         <- synthetic public demo feed
|-- CONTRACT.md             <- OpenBrain-style consumer contract
|-- AGENTS.md               <- agent behavior and scope
|-- BLUEPRINT.md            <- stable product and architecture truth
|-- CLAUDE.md               <- thin Claude entry point
|-- README.md               <- public setup and usage
|-- RUNBOOK.md              <- operations and verification
`-- TASKBOARD.md            <- live work, decisions, and proof
```

## Main Contracts

### Routes / Screens

| Route or screen | Purpose | Status | Source |
|---|---|---|---|
| Dashboard | Operational overview, health, brief, tasks, calendar, inbox, projects, finance, and music | working | `src/main.jsx` |
| Intelligence | Briefing, source drilldown, charts, suggested questions, and source-backed answers | working with partial states | `src/intelligence.jsx`, `server/intelligence.js` |
| Briefing | Full summarized briefing and actions | working from feed | `src/main.jsx`, `data.example.js` |
| Kanban | Local task creation and status workflow | working | `src/main.jsx`, `server/db.js` |
| Calendar / Projects / Deployments / Inbox / Finance / Music | Focused operational panels; calendar accepts `start`/`end` and legacy `when` fields | working or degraded by source availability | `src/main.jsx` |

### API Endpoints

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/api/auth/status` | no | Report passcode requirement/session state | `server/app.js` |
| POST | `/api/auth/login`, `/api/auth/logout` | no/current session | Manage local session | `server/app.js` |
| GET | `/api/state` | passcode when configured | Return dashboard feed, tasks, source health, Spotify, and settings | `server/app.js` |
| POST/PATCH | `/api/tasks`, `/api/tasks/:id` | passcode when configured | Create or update task cards | `server/app.js`, `server/db.js` |
| POST | `/api/tasks/:id/dismiss` | passcode when configured | Dismiss a suggested task | `server/app.js`, `server/db.js` |
| POST | `/api/refresh/gmail` | passcode when configured | Re-read summarized Gmail suggestions | `server/app.js`, `server/gmail.js` |
| GET/POST | `/api/intelligence/*` | passcode when configured | Source status, retrieval, overview, and answers | `server/intelligence.js` |
| GET/POST | `/api/spotify/player`, `/api/spotify/control` | passcode when configured | Playback state and controls | `server/app.js`, `server/spotify.js` |
| GET | `/auth/spotify/login`, `/auth/spotify/callback` | passcode when configured plus OAuth state | Complete local Spotify authorization | `server/app.js` |

### Data Model

| Entity | Key fields | Stored where | Notes |
|---|---|---|---|
| `tasks` | title, notes, source, priority, due date, status, suggestion/dismissal flags | local SQLite | mutable through task API |
| `task_events` | task id, event type, payload, timestamp | local SQLite | task audit trail |
| `source_status` | id, name, status, detail, updated time | local SQLite | reflects normalized feed state |
| `refresh_runs` | source, status, detail, start/finish | local SQLite | operational history |
| `app_settings` | key, value, updated time | local SQLite | local settings |
| `window.CIC_DATA` | summarized source panels and briefing | ignored `data.js`; example in `data.example.js` | public repo ships synthetic values only |
| `prescient_tasks` | flagged task state | optional Supabase backend | schema in `supabase/migrations/` |

## Core Logic And Invariants

- `/api/*` must return JSON errors rather than the frontend app shell.
- Task input is validated and normalized in `server/db.js`.
- Connector, retrieval, and synthesis failures produce explicit degraded or
  partial states.
- `/api/state.refreshFreshness` is derived from durable `refresh_runs`; the
  top-level `refreshedAt` remains response time and is not source freshness.
- The synthetic example feed contains no real personal or account information.
- Gmail-derived task suggestions remain summarized and must not persist full
  message bodies.
- Privacy-sensitive content uses the shared classifier in `src/privacy.js`.
- The browser must not call privileged external services directly.

Do not duplicate these contracts in new client-only connectors, ad hoc task
stores, or separate privacy classifiers.

## Trust, Privacy, And Safety Boundaries

Sensitive data includes runtime passcodes, private feeds, SQLite contents,
OpenAI/Supabase/OpenBrain credentials, Spotify OAuth values, and any real email,
calendar, finance, medical, purchase, or device information.

Rules:

- Never commit sensitive runtime data or include it in public test fixtures.
- Keep service-role credentials and synthesis/retrieval calls server-side.
- Require explicit approval before changing remote-access, auth, schema, paid
  services, or durable personal-data behavior.
- Treat the GitHub repository as public even when a deployment is private.

## Known Risks

| Risk | Impact | Mitigation / owner |
|---|---|---|
| Spotify OAuth depends on the browser retaining the app session through the provider redirect | A cleared or expired session prevents callback completion | Keep `SameSite=Lax`, require a current app session, and restart authorization after logging in |
| Only Gmail currently has an executable update adapter | Other feed sources can still be stale even when their cached health is online | Show freshness only for recorded refresh runs and add adapters source by source |
| Most automated coverage is server/helper-level | Responsive layout and complete browser workflows can regress while Node tests stay green | Add repeatable desktop/mobile browser smoke coverage |
| Configured external services can be unavailable or costly | Intelligence and music features may degrade or incur API spend | Keep optional configuration, visible source state, bounded calls, and deterministic fallback |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use the six-file Workbench v2.1 control surface | Keeps direction, work, operations, and agent scope explicit without a competing combined plan | 2026-07-10 / owner request and canonical local Workbench |
| Use `Integration` as the staging bridge | Task branches need a safe shared proving ground before release to `main` | 2026-07-10 / owner request |
| Keep CIC task cards separate from repository taskboards | Searchable Board/List views improve local operations without silently replacing canonical project files | 2026-07-10 / T-006 |
| Keep demo mode credential-free and deterministic | The repository can be evaluated safely without private services | `README.md`, `data.example.js` |
| Keep OpenBrain-style storage outside CIC | CIC is a consumer/control surface, not a second memory backend | `README.md`, `CONTRACT.md` |
| Prefer degraded states over fabricated data | Operational confidence depends on honest source status | `README.md`, server adapters |

## Health Criteria

The project is healthy when:

- `npm test` passes with no unexpected failures;
- `npm run build` succeeds;
- `npm audit --omit=dev` reports no unresolved production advisory or an
  explicitly accepted exception;
- the synthetic demo starts and `/api/state` returns JSON;
- missing connector credentials render honest degraded/partial states;
- built client assets and committed files contain no real secrets or private
  feed data;
- UI changes receive desktop and mobile browser verification.

Verification commands live in `RUNBOOK.md`. Current work and proof live in
`TASKBOARD.md`.
