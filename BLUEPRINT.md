# Command Information Center - Blueprint

> Generated from LLM Workbench v2.1. See `RUNBOOK.md` -> Upgrading The Harness.

**Last reviewed:** 2026-07-06  
**Status:** active  
**Source root:** `/Users/kayden/GPT_OS/Projects/Command Information Center`

This is the stable reference for what Command Information Center is. Keep it factual, source-backed, and short. Current work and proof history belong in `TASKBOARD.md`; commands and recovery steps belong in `RUNBOOK.md`.

## What This Project Is

Command Information Center is Kayden's private local GPT_OS operations web app. It runs on the Mac Mini, serves a React interface through Express, stores runtime task/source state in SQLite, reads the summarized `data.js` feed, and keeps connector failures visible without inventing live data.

Core promise:

> Give Kayden one LAN-local command surface for briefing, task routing, connector health, personal-data intelligence, project activity, finance-safe summaries, and music controls without leaking secrets or replacing the GPT_OS wiki/OpenBrain memory layer.

Primary users:

- Kayden, as local operator.
- Agents maintaining the local app and its control docs.

## Non-Goals

This project is not trying to:

- Become a public SaaS dashboard.
- Store full Gmail bodies, raw OAuth tokens, client secrets, or live financial account identifiers in committed files.
- Replace OpenBrain, Supabase, or the GPT_OS wikis as the durable memory layer.
- Fake connector values when a source is offline or unauthenticated.

## Current Product Shape

When the project is working, a user can:

- Open the local dashboard at `http://localhost:8787` or the same-WiFi LAN URL.
- Review source health, morning briefing, prioritized tasks, calendar, projects, deployments, inbox, finance, and Spotify state.
- Use Personal To-Dos to create, edit, move, dismiss, and complete SQLite-backed personal tasks.
- Open Project Taskboards to review canonical project executive briefs, owner decisions, grouped work, completion history, and validated inline priority changes from each repository's `TASKBOARD.md`.
- Use the Intelligence page for source-backed briefings, charts, source drilldowns, suggested questions, and server-side OpenBrain/OpenAI synthesis when credentials are present.
- Control Spotify playback after local OAuth setup, with degraded states when authorization or devices are unavailable.

The most important quality bar is:

- Privacy-preserving source truth: show degraded/offline states instead of fake data, keep sensitive values blur-compatible, and keep secrets server-side.

## Direction And Build Order

Current phase:

- Private operations cockpit hardening: preserve the existing local dashboard while improving task-board depth, intelligence reliability, privacy coverage, and connector degradation.

Build order:

1. Keep the current local app reliable - auth, `/api/state`, task persistence, and build/test health are the baseline.
2. Improve task-board ergonomics - richer ClickUp-like list/board behavior builds on the existing SQLite task model.
3. Harden Intelligence/OpenBrain routing - server-only synthesis and source normalization should stay partial-state friendly.
4. Tighten connector refreshes - routine refreshes should continue to rewrite only `data.js` and mark unavailable sources honestly.

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js with npm scripts | `package.json`; Express server starts from `server/index.js` |
| Frontend | React 18 + Vite + lucide-react | `src/main.jsx`, `src/intelligence.jsx`, `src/styles.css` |
| Backend | Express 5 | `server/app.js` exposes auth, task, refresh, intelligence, and Spotify routes |
| Database/storage | SQLite plus summarized `data.js` feed | `server/db.js`; runtime DB under `data/cic.sqlite`; feed contract in `refresh-skill/SKILL.md` |
| Auth | Optional local passcode cookie | `server/app.js`, `server/config.js`; `CIC_PASSCODE` or `CIC_PASSCODE_HASH` in ignored `.env` |
| Intelligence | Server-side OpenAI/OpenBrain/Supabase adapters with deterministic fallback | `server/intelligence.js`, `server/openaiSynthesisClient.js`, `server/openbrainClient.js`, `server/sourceNormalizer.js` |
| Spotify | Spotify Web API authorization-code flow | `server/spotify.js`; local callback uses `127.0.0.1` |
| Testing | Node test runner | `npm test` runs `test/*.test.js` |
| Deployment/runtime | Local/LAN Express process, optional LaunchAgent | `npm start`; `launchd/com.kayden.cic.plist` |

Architecture constraints:

- Keep the app LAN-local unless Kayden explicitly asks for remote access.
- Keep runtime data under `data/` and logs under `logs/`.
- Keep `.env`, SQLite files, logs, OAuth tokens, client secrets, and generated runtime data out of commits.
- Keep Gmail task suggestions summarized; do not store full email bodies.

## Directory Map

```text
/Users/kayden/GPT_OS/Projects/Command Information Center/
├── server/            <- Express app, config, SQLite, refresh, intelligence, Spotify
├── src/               <- React UI, privacy classifier, intelligence view, Spotify timing
├── test/              <- Node test-runner coverage for API/UI helpers
├── refresh-skill/     <- routine connector refresh contract for data.js
├── archive/static-v0/ <- old static dashboard fallback context
├── data/              <- ignored SQLite/runtime data
├── logs/              <- ignored service logs
├── AGENTS.md          <- agent behavior and project rules
├── BLUEPRINT.md       <- stable project definition and direction
├── TASKBOARD.md       <- live task queue, blockers, proof log
└── RUNBOOK.md         <- setup, operation, verification, recovery
```

## Main Contracts

### Routes / Screens

| Route or screen | Purpose | Status | Source |
|---|---|---|---|
| Dashboard | Compact overview of source health, Intelligence brief, tasks, calendar, inbox, projects, finance, and Spotify | working | `src/main.jsx` |
| Intelligence | Server-backed current-state briefing, insights, charts, sources, suggested questions, and assistant | working with partial states | `src/intelligence.jsx`, `server/intelligence.js` |
| Briefing | Full morning briefing and prioritized actions from `data.js` | working | `src/main.jsx`, `data.js` |
| Personal To-Dos | SQLite-backed personal task board with Inbox, Today, Next, Waiting, Done, and an inbox/task summary | working | `src/main.jsx`, `server/db.js` |
| Calendar | Summarized calendar feed views | working from feed | `src/main.jsx`, `data.js` |
| Project Taskboards | Repository-backed project workspace with project selection, open decisions, status/priority filters, grouped tasks, task details, and inline priority editing | working for discovered `GPT_OS/Projects/*/TASKBOARD.md` files | `src/projectTaskboards.jsx`, `server/taskboards.js` |
| Deployments / Inbox / Finance / Music | Connector, email-summary, money-safe, and Spotify surfaces | working/degraded by source availability | `src/main.jsx` |

### API Endpoints

| Method | Path | Auth | Purpose | Status | Source |
|---|---|---|---|---|---|
| GET | `/api/state` | passcode when configured | Dashboard state, tasks, source health, Spotify, Atlas config | working | `server/app.js` |
| POST | `/api/tasks` | yes | Create task | working | `server/app.js`, `server/db.js` |
| PATCH | `/api/tasks/:id` | yes | Update task fields/status | working | `server/app.js`, `server/db.js` |
| POST | `/api/tasks/:id/dismiss` | yes | Dismiss suggested task | working | `server/app.js`, `server/db.js` |
| GET | `/api/project-taskboards` | yes | List projects with canonical taskboards and summary counts | working | `server/app.js`, `server/taskboards.js` |
| GET | `/api/project-taskboards/:project` | yes | Return the selected parsed project taskboard | working | `server/app.js`, `server/taskboards.js` |
| PATCH | `/api/project-taskboards/:project/tasks/:taskId/priority` | yes | Atomically change one matching task Priority cell | working for rows with Priority columns | `server/app.js`, `server/taskboards.js` |
| POST | `/api/refresh/gmail` | yes | Refresh summarized Gmail suggestions from current feed or configured command | working/degraded | `server/app.js`, `server/gmail.js` |
| GET | `/api/intelligence/overview` | yes | Current-state intelligence briefing | working with fallback | `server/intelligence.js` |
| POST | `/api/intelligence/ask` | yes | Source-backed question answer | working with validation/fallback | `server/intelligence.js` |
| GET | `/api/intelligence/sources` | yes | Normalized source availability | working | `server/intelligence.js` |
| GET | `/api/spotify/player` | yes | Spotify playback state | working/degraded | `server/spotify.js` |
| POST | `/api/spotify/control` | yes | Spotify play/pause/next/previous | working when authorized/device active | `server/spotify.js` |
| GET | `/auth/spotify/login` | no | Start Spotify OAuth | working when local credentials exist | `server/app.js` |
| GET | `/auth/spotify/callback` | no | Complete Spotify OAuth and write refresh token to ignored `.env` | working | `server/app.js` |

### Commands

| Command | Purpose | Required for done? |
|---|---|---|
| `npm install` | Install dependencies | setup only |
| `npm test` | Run Node test suite | yes for code behavior changes |
| `npm run build` | Build Vite client | yes for UI/client changes and release handoff |
| `npm audit --omit=dev` | Check production dependency advisories | yes before handoff when practical |
| `npm start` | Run local/LAN Express app | manual runtime verification |

### Data Model

| Entity | Key fields | Stored where | Notes |
|---|---|---|---|
| `tasks` | title, notes, source, priority, due date, status, suggested/dismissed flags | SQLite `data/cic.sqlite` | created/updated through `/api/tasks` |
| `task_events` | task id, event type, payload, created at | SQLite | audit trail for task changes |
| `source_status` | id, name, status, detail, updated at | SQLite | hydrated from `data.js` source list |
| `refresh_runs` | source, status, detail, timestamps | SQLite | refresh history |
| `app_settings` | key, value, updated at | SQLite | local app settings |
| `window.CIC_DATA` | meta, sources, briefing, gmail, calendar, github, vercel, drive, money, spotify, projects, wiki, ifttt | `data.js` | routine refresh rewrites only this file |
| Project taskboard view | executive brief, open decisions, Ready/In Progress/Blocked/Deferred/Done rows | each project's canonical `TASKBOARD.md` | read live; not duplicated into CIC SQLite |

## Core Logic And Invariants

Rules:

- `/api/*` routes must return JSON errors, not the Vite app shell.
- `data.js` must keep the top-level `window.CIC_DATA` keys documented in `refresh-skill/SKILL.md`.
- Missing connector credentials or offline sources produce degraded states, not mocked data.
- Browser code must never receive OpenAI keys, Supabase service-role keys, OpenBrain bearer tokens, Spotify client secrets, or OAuth refresh tokens.
- Money-sensitive and privacy-sensitive text must stay blur-compatible through `money: true`, `money-val`, or the privacy classifier.
- Gmail-derived tasks and feed panels must stay summarized; full email bodies do not belong in the app DB or docs.
- Project taskboard writes must stay inside discovered direct children of `GPT_OS/Projects`, accept only `P1`/`P2`/`P3`, and change only the matching row's Priority cell through an atomic replacement.
- Personal SQLite tasks and repository project tasks remain separate stores with explicit UI labels.
- The HTML app shell must use `Cache-Control: no-store, must-revalidate` so `localhost` and `.local` reloads converge on the current build; hashed Vite assets may use immutable caching.

Do not duplicate this logic in:

- Ad hoc client-only connector calls that bypass the server privacy boundary.
- New refresh scripts that rewrite files other than `data.js` during routine refreshes.
- UI code that classifies privacy-sensitive data separately from `src/privacy.js`.

## Trust, Privacy, And Safety Boundaries

Sensitive data:

- Local passcode, OAuth client secrets/tokens, OpenAI/Supabase/OpenBrain credentials.
- SQLite runtime data, logs, Gmail summaries, financial/purchase/medical/device clues.

Rules:

- Do not commit `.env`, SQLite files, logs, OAuth tokens, client secrets, or runtime exports.
- Keep connector and LLM credentials server-side.
- Keep app access LAN-local unless Kayden explicitly requests remote exposure.
- Require explicit user approval before changing money-sensitive workflows, remote access, auth boundaries, or durable personal-data storage.

## Known Risks

| Risk | Impact | Mitigation / owner |
|---|---|---|
| Dirty local worktree contains substantial in-flight changes | Harness work can accidentally mingle with unrelated app work | Keep harness edits scoped to docs and review `git diff` before commit |
| Intelligence depends on optional OpenAI/OpenBrain/Supabase credentials | Full synthesis may be unavailable locally | Keep deterministic partial states and source availability visible |
| Routine refresh feed can go stale | Dashboard may show old connector values | Do not claim live values unless from a current connector call or local source read |
| Project taskboards vary in prose and table shape | Some custom sections or rows without a Priority column may be read-only or omitted | Parse only recognized task/decision tables; preserve the source file; fail closed on ambiguous/missing priority targets |
| LAN/local auth depends on ignored `.env` and local LaunchAgent state | Runtime behavior may differ across shells/restarts | Document exact env and launch commands in `RUNBOOK.md` |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use Workbench v2.1 `TASKBOARD.md`, not `ROADMAP.md` or `GAMEPLAN.md` | Current LLM Workbench `main` removed `ROADMAP.md` from the default harness and splits stable direction into `BLUEPRINT.md` with executable work in `TASKBOARD.md` | 2026-07-06 / `KaydenClark/LLM_Workbench` `origin/main` |
| Keep CIC LAN-local and private | App contains personal operations context and local credentials | Existing `AGENTS.md`, `README.md` |
| Keep OpenBrain/Supabase as memory/retrieval layer, CIC as UI/API surface | Avoid duplicating durable memory inside the dashboard | `README.md`, `server/intelligence.js` |
| Keep routine refreshes scoped to `data.js` | Reduces blast radius and preserves renderability when sources fail | `refresh-skill/SKILL.md` |
| Prefer degraded states over fake connector data | The dashboard is an operating surface; false confidence is worse than partial data | `AGENTS.md`, `README.md` |
| Keep personal and project task stores distinct | Personal cards are fast local operations; repository `TASKBOARD.md` files remain the canonical project queue and proof ledger | 2026-07-10 / T-002 |

## Health Criteria

The project is healthy when:

- `npm test` passes.
- `npm run build` passes.
- `npm audit --omit=dev` has no unresolved production advisories or records known accepted risk.
- `/api/state` returns JSON with dashboard, tasks, source health, Spotify, Atlas, settings, and refreshedAt.
- Empty, unavailable, and unauthenticated connector states render without crashing.
- Privacy mode blurs sensitive dashboard, intelligence, assistant, finance, purchase, medical, and device-related text.
- Secrets and local data are not exposed in committed files or built client assets.

Verification commands live in `RUNBOOK.md`. Current task status and proof history live in `TASKBOARD.md`.
