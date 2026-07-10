# Command Information Center - Taskboard

> Generated from LLM Workbench v2.1. See `RUNBOOK.md` -> Upgrading The Harness.

**Current focus:** Hold the verified `Integration` baseline and select the next owner-prioritized milestone; the current ready queue is complete.
**Owner:** repository owner plus active agents
**Last updated:** 2026-07-10

This is the live work queue and append-only proof ledger. Stable direction and
architecture live in `BLUEPRINT.md`; exact commands live in `RUNBOOK.md`.

## Executive Brief

- **Shipping now:** The SLK-restyled React + Express dashboard includes authenticated Spotify OAuth, honest Gmail freshness, searchable Board/List tasks, and repeatable desktop/mobile browser smoke coverage.
- **Health:** green staging baseline - 160 tests discovered with 154 pass, 0 fail, and 6 explicit TODO; browser smoke 4/4; build and production audit pass.
- **Decision needed:** none.
- **Blocked on:** nothing for the staging branch; optional live integrations still require local credentials and services.
- **Next milestone:** owner selects and records the next product milestone; no ready task remains unclaimed.

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
| T-003 | Add a real Update now workflow with per-source last attempt, success, and age | 2026-07-10 | pass | 2026-07-10 / T-003 |
| T-005 | Harden `GMAIL_REFRESH_COMMAND` parsing and activate its TODO specifications | 2026-07-10 | pass | 2026-07-10 / T-005 |
| T-004 | Add repeatable desktop and mobile browser smoke coverage for primary workflows | 2026-07-10 | pass | 2026-07-10 / T-004 |
| T-006 | Deepen task workflows toward grouped list/board operations without duplicating canonical project taskboards | 2026-07-10 | pass | 2026-07-10 / T-006 |

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
| 2026-07-10 | T-003 | Codex | Red tests established per-source attempt/success timestamps; final `npm test` discovered 156 tests with 147 pass, 0 fail, and 9 pre-existing TODO; build passed; production audit found 0 vulnerabilities; Browser QA at desktop and 390x844 exercised Update now, observed `Never updated` -> `Updated just now`, found and fixed mobile truncation, and reported no console warnings/errors | `PORT=8798 HOST=127.0.0.1 CIC_DB=/tmp/cic-t003-browser.sqlite CIC_DATA_FEED="$PWD/data.example.js" npm start` | pass | Updated `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, and `TASKBOARD.md`; CIC wiki update required after merge | Only Gmail has an executable current-call refresh adapter; other sources show feed health until adapters are added |
| 2026-07-10 | T-005 | Codex | Red import failure established missing parser; implemented quote/backslash-aware argv parsing without a shell and activated command execution, non-zero failure, and 120-second timeout specifications; focused Gmail tests passed 12/12; full suite discovered 157 tests with 151 pass, 0 fail, and 6 remaining TODO; build passed; production audit found 0 vulnerabilities | `node --test test/gmail.test.js` | pass | Updated `RUNBOOK.md` and `TASKBOARD.md`; no product contract change | none |
| 2026-07-10 | T-004 | Codex | Added Playwright Chromium smoke coverage for desktop and mobile dashboard/update behavior plus desktop navigation, task create/move, Intelligence partial state, and console errors; initial mobile run failed because the iPhone profile selected uninstalled WebKit, then passed after explicitly using Chromium; 3 passed and 1 intentionally skipped duplicate workflow; QA review also fixed calendar rendering for `start`/`end` feeds with legacy `when` compatibility | `npm run test:browser` | pass | Updated `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, and `TASKBOARD.md` | Passcode-login browser coverage remains for a future protected-runtime fixture |
| 2026-07-10 | T-006 | Codex | Added shared search/grouping logic plus Board/List modes over the existing SQLite tasks; red/green unit tests cover case-insensitive metadata search and priority-sorted status groups; desktop/mobile browser workflows create, move, switch to List, search, and verify the grouped result; the first mobile run exposed an overlapping toolbar and timed out, then passed 4/4 after the responsive layout fix | `node --test test/taskViews.test.js && npm run test:browser` | pass | Updated `BLUEPRINT.md`, `README.md`, and `TASKBOARD.md`; CIC wiki update required after merge | Local CIC cards intentionally remain separate from repository `TASKBOARD.md` files |
