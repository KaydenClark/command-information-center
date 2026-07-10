# Command Information Center - Taskboard

> Generated from LLM Workbench v2.1. See `RUNBOOK.md` -> Upgrading The Harness.

**Current focus:** Establish `Integration` as the verified staging bridge, then improve operator trust through explicit freshness, stronger auth boundaries, and browser-level proof.
**Owner:** repository owner plus active agents
**Last updated:** 2026-07-10

This is the live work queue and append-only proof ledger. Stable direction and
architecture live in `BLUEPRINT.md`; exact commands live in `RUNBOOK.md`.

## Executive Brief

- **Shipping now:** The SLK-restyled React + Express dashboard runs in a credential-free demo and has a six-file Workbench v2.1 control surface.
- **Health:** green staging baseline / yellow product hardening - tests, build, and production audit pass, while browser QA and freshness/auth gaps remain.
- **Decision needed:** none.
- **Blocked on:** nothing for the staging branch; optional live integrations still require local credentials and services.
- **Next milestone:** land the highest-priority hardening task through a task branch and pull request into `Integration`.

## Pending Decisions

| ID | Decision | Options | Recommendation | Cost / impact | Owner | Status |
|---|---|---|---|---|---|---|
| none | No open owner decision | - | - | - | - | resolved |

## How To Use This Board

1. Read `BLUEPRINT.md` for context.
2. Pick the highest-priority `ready` task that is in scope and unclaimed.
3. Move it to `claimed` or `in-progress` before editing.
4. Branch from `Integration` and make the smallest correct change.
5. Run the required proof and relevant `RUNBOOK.md` checks.
6. Move the task to `done`, `blocked`, `deferred`, or `needs-review`.
7. Append one proof row with the actual result.

Do not rewrite existing proof rows. Append only.

## Status Values

| Status | Meaning |
|---|---|
| `ready` | Clear enough for the next agent to start. |
| `claimed` | Selected but edits have not started. |
| `in-progress` | Work is underway. |
| `gated` | Implementation is complete and awaiting verification, review, or merge. |
| `needs-review` | Human or manager review is required. |
| `blocked` | A named blocker prevents progress. |
| `deferred` | Valid work, intentionally not next. |
| `done` | Proof exists and documentation impact is resolved. |

## Ready

| ID | Priority | Task | Source / why now | Touches | Proof required | Docs impact | Owner | Status | Last update |
|---|---:|---|---|---|---|---|---|---|---|
| T-003 | 1 | Add a real Update now workflow with per-source last attempt, success, and age | `/api/state.refreshedAt` proves response time, not connector freshness; operator decisions need source age | `server/`, `src/`, tests | Red/green API contract; desktop/mobile loading/error/age proof; full suite and build | all product/operation controls | agent | ready | 2026-07-10 |
| T-004 | 1 | Add repeatable desktop and mobile browser smoke coverage for primary workflows | Current automated suite is Node/API/helper focused and cannot prove responsive interaction | browser test harness, `src/`, `RUNBOOK.md` | Login/demo, navigation, task lifecycle, Intelligence partial state, and responsive smoke proof | `RUNBOOK.md`, this board; behavior docs for discovered fixes | agent | ready | 2026-07-10 |
| T-005 | 2 | Harden `GMAIL_REFRESH_COMMAND` parsing and activate its TODO specifications | `server/gmail.js` splits on spaces; command execution, failure, and timeout tests are still TODO | `server/gmail.js`, `test/gmail.test.js` | Red/green quoted-path/argument, non-zero, and timeout coverage; full suite | `RUNBOOK.md` if command format changes | agent | ready | 2026-07-10 |
| T-006 | 2 | Deepen task workflows toward grouped list/board operations without duplicating canonical project taskboards | Current SQLite model supports basic cards; product direction calls for richer operator task management | `src/`, `server/db.js`, task/API tests | Red/green behavior specs, desktop/mobile proof, full suite/build | `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, this board | agent | ready | 2026-07-10 |

## In Progress

| ID | Priority | Task | Owner | Started | Touches | Current note | Proof required | Status |
|---|---:|---|---|---|---|---|---|---|
| none | - | No active claimed task | - | - | - | - | - | - |

## Blocked

| ID | Task / area | Blocked on | Evidence | Next action | Owner | Status |
|---|---|---|---|---|---|---|
| none | No current project blocker | - | - | - | - | - |

## Deferred

| ID | Task | Deferred until | Why it matters | Revisit trigger |
|---|---|---|---|---|
| F-001 | Add mechanical Claude Code permission settings | A dedicated review can map public source, migrations, generated output, and secret boundaries precisely | The thin `CLAUDE.md` bridge loads shared rules now; an unreviewed permission file could be misleading | Claude-specific enforcement task |

## Done

| ID | Task | Completed | Result | Proof row |
|---|---|---|---|---|
| T-001 | Adopt the current six-file Workbench harness and establish `Integration` from `design/slk-brand-restyle` | 2026-07-10 | pass | 2026-07-10 / T-001 |
| T-002 | Gate Spotify OAuth routes behind the private app boundary without breaking callback state | 2026-07-10 | pass | 2026-07-10 / T-002 |

## Documentation Check

| If the task changed... | Update or confirm |
|---|---|
| Product purpose, workflows, routes, data model, architecture, invariants, privacy/safety boundaries | `BLUEPRINT.md` |
| Current work, blockers, decisions, proof | `TASKBOARD.md` |
| Setup, install, run, test, build, branch flow, recovery, environment | `RUNBOOK.md` |
| User-facing setup, usage, demo, public contract | `README.md` and `CONTRACT.md` when relevant |
| Agent scope, authority, branch flow, verification | `AGENTS.md`; keep `CLAUDE.md` thin |

If no docs need edits, record `Docs checked; no update needed` in the final
response and the proof row with a short reason.

## Proof Log

Append a row when a task changes durable state. Milestones require a demo the
owner can check in under one minute. When this log passes roughly 30 active
rows, move the oldest rows verbatim into `TASKBOARD_ARCHIVE.md`.

| Date | Task ID | Agent | Proof | Demo | Result | Docs | Remaining gap |
|---|---|---|---|---|---|---|---|
| 2026-07-10 | T-001 | Codex | Clean base `c9d06ee`; final `npm test` discovered 151 tests with 142 pass, 0 fail, and 9 explicit TODO; `npm run build` passed; `npm audit --omit=dev` found 0 vulnerabilities; isolated `/api/state` smoke returned the seven expected top-level keys and 9 seeded tasks; Workbench evaluator scored `90.1/113` vs controls `0/113` and `2/113`; six project controls contain no retired coequal plan or unfilled template placeholder | `PORT=8797 HOST=127.0.0.1 CIC_DB=/tmp/cic-integration-smoke.sqlite CIC_DATA_FEED="$PWD/data.example.js" npm start`, then open `http://127.0.0.1:8797` | pass | Added `AGENTS.md`, `BLUEPRINT.md`, `CLAUDE.md`, `RUNBOOK.md`, `TASKBOARD.md`; updated `README.md` | Product hardening continues through task branches into `Integration` |
| 2026-07-10 | T-002 | Codex | Red test proved unauthenticated `/auth/spotify/login` returned `302`; after gating both OAuth routes, focused tests passed 2/2 and callback state remained valid for an authenticated session; full `npm test` discovered 153 tests with 144 pass, 0 fail, and 9 pre-existing TODO; build passed; production audit found 0 vulnerabilities | `node --test --test-name-pattern='Spotify OAuth' test/api.test.js` | pass | Updated `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, and `TASKBOARD.md` | none |
