# Command Information Center - Taskboard

> Generated from LLM Workbench v2.1. See `RUNBOOK.md` -> Upgrading The Harness.

**Current focus:** Fix the accepted critical-audit gaps, then make CIC useful enough that Kayden can keep up from fresh, on-demand state instead of stale background guesses.  
**Owner:** Kayden / agents  
**Last updated:** 2026-07-07

This is the live work queue and proof ledger. Agents use it to decide what to work on next. Keep stable direction in `BLUEPRINT.md`; keep commands and recovery procedures in `RUNBOOK.md`.

## Executive Brief

- **Shipping now:** Critical-audit fix stack: protect private OAuth paths, fix visible feed/UI bugs, reconcile Intelligence docs/runtime, and add a real "update this now" flow.
- **Health:** yellow - tests/build/audit pass, but the app is missing browser-level QA and still has substantial unrelated in-flight work.
- **Decision needed:** whether the first manual fresh-state CTA should live in the app, Codex scheduled actions, or both.
- **Blocked on:** clean handoff/commit readiness until unrelated worktree changes are isolated.
- **Next milestone:** a verified CIC bugfix/refresh pass with desktop and mobile browser proof.

## Pending Decisions

| ID | Decision | Options | Recommendation | Cost / impact | Owner | Status |
|---|---|---|---|---|---|---|
| D-001 | Next product priority after harness adoption | Task-board depth / Intelligence reliability / connector refresh hardening | Start with the accepted critical-audit fixes, then task-board depth | Prevents polishing a board on top of stale data and known UI/security gaps | Kayden | decided 2026-07-07 |
| D-002 | Where should the fresh-state "update this now" control live first? | In-app CTA / Codex scheduled action / both | In-app CTA first, with a later Codex scheduled action only if it proves useful | In-app is visible while using CIC; Codex action may be better for deeper connector refreshes but is easier to ignore | Kayden | open |

## Audit Intake Notes

Kayden accepted audit gaps 1-5 as the right fix direction:

- Gate Spotify OAuth and any token-writing path behind the private app boundary.
- Fix the calendar feed/UI mismatch where feed entries have `start`/`end` but the UI renders `when`.
- Isolate the dirty worktree so harness/docs changes and product work can be reviewed cleanly.
- Reconcile Intelligence runtime, docs, and tests around `/api/intelligence/kb`, `/overview`, `/ask`, and `/sources`.
- Continue the ClickUp-style task-board direction after the correctness/state gaps are under control.

Kayden clarified audit gap 6:

- Most automatic prescient/background checking was intentionally turned off because it had stopped being useful and stale.
- The desired direction is an explicit "update this now" call to action, either in Codex scheduled actions, inside CIC, or both.
- The CTA must fetch or compute real current data at request time and should not present stale cached guesses as fresh.

Kayden clarified audit gap 7:

- The app is missing too many bugs under the current test strategy.
- CIC needs a serious QA/browser-verification pass, not just Node tests.

Kayden accepted audit gap 8:

- Add `GMAIL_REFRESH_COMMAND` parsing hardening to the taskboard.

## How To Use This Board

1. Read `BLUEPRINT.md` for context.
2. Pick the highest-priority `ready` task that is in scope and unclaimed.
3. Move it to `claimed` or `in-progress` before editing.
4. Do the smallest correct change.
5. Run the task's required proof and the relevant `RUNBOOK.md` checks.
6. Move the task to `done`, `blocked`, `deferred`, or `needs-review`.
7. Append one proof row with the actual result.

Do not rewrite existing proof rows. Append only.

## Status Values

| Status | Meaning |
|---|---|
| `ready` | Clear enough for the next agent to start. |
| `claimed` | An agent has picked it but has not edited yet. |
| `in-progress` | Work is underway. |
| `gated` | Implementation is done and waiting on verification, review, or merge. |
| `needs-review` | Needs human or manager review before more work. |
| `blocked` | Cannot proceed until the blocker is resolved. |
| `deferred` | Valid work, intentionally not next. |
| `done` | Proof exists and docs impact is resolved. |

A `claimed` or `in-progress` task with no update after one working day may be reclaimed after checking `git status`, recent commits, and any visible branch/PR notes.

## Ready

| ID | Priority | Task | Source / why now | Touches | Proof required | Docs impact | Owner | Status | Last update |
|---|---:|---|---|---|---|---|---|---|---|
| T-005 | 1 | Gate Spotify OAuth and token-writing routes behind the private app boundary | Audit gap 1; `/auth/spotify/*` can write refresh-token state outside `/api` auth middleware | `server/app.js`, `server/spotify.js`, tests | Red/green auth tests for unauthenticated `/auth/spotify/login` and callback behavior; `npm test`; `npm run build` | Update `README.md`, `RUNBOOK.md`, `BLUEPRINT.md` if route/auth behavior changes | agent | ready | 2026-07-07 |
| T-006 | 1 | Fix calendar feed/UI field mismatch | Audit gap 2; `data.js` calendar events use `start`/`end` while UI renders `event.when` | `src/main.jsx`, tests | Regression test proving calendar event time renders from `start`; browser check Calendar/Dashboard; `npm test`; `npm run build` | Update docs only if feed schema changes | agent | ready | 2026-07-07 |
| T-007 | 1 | Isolate dirty worktree and define clean handoff path | Audit gap 3; many unrelated modified/untracked app files make review/commit unsafe | git state, task branches, handoff notes as needed | `git status --short --branch`; file grouping report; no source edits unless explicitly requested | Update `TASKBOARD.md`; wiki/log only if branch or project state changes | agent | ready | 2026-07-07 |
| T-009 | 1 | Design and build an on-demand "update this now" fresh-state CTA | Kayden clarified audit gap 6: stale scheduled/background checks were not useful; CIC needs a visible way to fetch real current data on request | likely `src/main.jsx`, `server/`, `refresh-skill/`, Codex scheduled-action docs if used | Red/green API tests for manual update status; browser check for CTA state/loading/error/last-updated; proof that output is from a current call or local read, not stale cached guesses | Update `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, `TASKBOARD.md`, and wiki if behavior/cadence changes | agent | ready | 2026-07-07 |
| T-010 | 1 | Add a serious browser QA and bug-discovery pass | Kayden clarified audit gap 7: too many bugs are slipping through Node-only tests | test harness, browser checks, `src/`, `server/` as findings require | Add repeatable browser smoke coverage for key views; run desktop and mobile checks; file bugs or fixes with proof | Update `RUNBOOK.md`, `TASKBOARD.md`, and docs for any verified behavior changes | agent | ready | 2026-07-07 |
| T-011 | 2 | Harden `GMAIL_REFRESH_COMMAND` parsing | Audit gap 8 accepted; current split-on-space parsing breaks quoted paths/arguments | `server/gmail.js`, tests, `RUNBOOK.md` | Red/green tests for quoted command/path handling; `npm test`; `npm run build` | Update `RUNBOOK.md` if command format changes | agent | ready | 2026-07-07 |
| T-003 | 3 | Harden Intelligence/OpenBrain partial-state and source-reference behavior | Existing task remains valid after route reconciliation; Intelligence must stay honest when credentials or sources are missing | `server/intelligence.js`, `server/openbrainClient.js`, `server/openaiSynthesisClient.js`, `server/sourceNormalizer.js`, `src/intelligence.jsx`, tests | Red/green route tests, `npm test`, `npm run build`, manual `/api/intelligence/*` check with missing credentials | Update docs for any route/env/schema change | agent | ready | 2026-07-07 |
| T-004 | 3 | Review routine refresh contract against current `data.js` feed shape | Refresh rules still say only `data.js` should change and top-level keys must stay stable | `refresh-skill/SKILL.md`, `data.js`, refresh scripts if any | `node -e` schema validation from `refresh-skill/SKILL.md`; no fake connector values | Update docs/wiki only if cadence/schema changes | agent | ready | 2026-07-07 |

## In Progress

| ID | Priority | Task | Owner | Started | Touches | Current note | Proof required | Status |
|---|---:|---|---|---|---|---|---|---|
| none | - | No active claimed task | - | - | - | - | - | - |

## Blocked

| ID | Task / area | Blocked on | Evidence | Next action | Owner | Status |
|---|---|---|---|---|---|---|
| B-001 | Clean handoff / commit readiness | Working tree already contains many unrelated modified and untracked app files | `git status --short --branch` before adoption showed modified app/server/test/data files and untracked implementation files | Review and isolate harness docs before any commit or PR | Kayden / agent | blocked |

## Deferred

| ID | Task | Deferred until | Why it matters | Revisit trigger |
|---|---|---|---|---|
| F-001 | Add optional `.claude/settings.json` mechanical scope enforcement | Kayden wants Claude Code enforcement for this repo | Workbench v2.1 supports it, but CIC already has substantial in-flight work and this request only required docs/no GAMEPLAN | A future Claude-specific CIC harness pass |
| F-002 | Add `HARNESS_FEEDBACK.md` for downstream feedback to LLM Workbench | A harness-upgrade task explicitly asks for feedback-loop capture | Useful, but not one of the four required control docs and not needed to satisfy this adoption | A real CIC harness rule fails or slows work |

## Done

Completed task summary. Detailed evidence belongs in the proof log below.

| ID | Task | Completed | Result | Proof row |
|---|---|---|---|---|
| T-008 | Reconcile Intelligence routes, docs, and tests | 2026-07-10 | pass | 2026-07-10 / T-008 |
| T-002 | Build separate Personal To-Dos and repository-backed Project Taskboards | 2026-07-10 | pass | 2026-07-10 / T-002 |
| T-012 | Capture Kayden's critical-audit follow-up notes into the taskboard | 2026-07-07 | pass | 2026-07-07 / T-012 |
| T-001 | Adopt current Workbench v2.1 control docs for CIC | 2026-07-06 | pass | 2026-07-06 / T-001 |

## Documentation Check

Documentation is part of done. Before marking a task complete, check:

| If the task changed... | Update or confirm |
|---|---|
| Product purpose, workflows, routes, data model, architecture, invariants, privacy/safety boundaries | `BLUEPRINT.md` |
| Task queue, blockers, deferred work, proof of completed work | `TASKBOARD.md` |
| Setup, install, run, test, build, deploy, recovery, environment, operations, evaluation procedure | `RUNBOOK.md` |
| User-facing setup, usage, demo, handoff, public instructions | `README.md` |
| Agent rules, scope, authority, verification policy | `AGENTS.md` |
| GPT_OS project location/behavior/schema/refresh cadence | `Wiki - Kayden/01 Projects/Command Information Center.md` |

If no docs need edits, record `Docs checked; no update needed` in the final response and in the proof row's `Docs` field.

## Proof Log

Append a row when a task changes durable project state or produces durable verification evidence. Use actual results, not stale claims. Milestone tasks must fill the Demo column with a <1-minute demo artifact (screenshot, recording, preview URL, or one-command demo); non-milestone rows may use `n/a`.

**Archival policy.** The proof log is append-only, but it should not grow without bound. When it passes ~30 rows, move the oldest rows into `TASKBOARD_ARCHIVE.md`, preserving them verbatim under a dated heading. `TASKBOARD_ARCHIVE.md` is append-only too.

| Date | Task ID | Agent | Proof | Demo | Result | Docs | Remaining gap |
|---|---|---|---|---|---|---|---|
| 2026-07-10 | T-008 | Codex | Added a red/green client-route regression test; Intelligence now renders `/overview` briefing/insight summaries rather than `/kb` chunks. Restored configured OpenAI synthesis for `/overview`, retaining the deterministic fallback. `npm test` 26/26, `npm run build` pass, `npm audit --omit=dev` 0 vulnerabilities. Isolated live-config check: HTTP 200 in 14.16s, `status=ready`, `generatedBy=openai`; desktop and 390x844 browser checks found zero raw chunk cards/headings and no console warnings/errors. Restarted `com.kayden.cic`. | Open `http://kaydens-mac-mini.local:8787/`, reload, then select Intelligence | pass | Updated `README.md`, `RUNBOOK.md`, `TASKBOARD.md`, and CIC wiki; `BLUEPRINT.md` checked, no update needed | First synthesized brief may take about 14 seconds while the server-side model responds. |
| 2026-07-10 | T-002 | Codex | Red/green parser and API coverage for varied Markdown tables, open decisions, grouped tasks, path/priority validation, duplicate-ID refusal, atomic numeric/P-prefixed priority edits, and technical identifiers with underscores. `npm test` 31/31, `npm run build` pass, `npm audit --omit=dev` 0 vulnerabilities. In-app browser verified separate Personal To-Dos and Project Taskboards, real CIC decision/task data, P3→P2→P3 priority persistence on only T-004, 1440x900 and 390x844 layouts without horizontal overflow, and zero console warnings/errors. | Open `http://kaydens-mac-mini.local:8787/`, select Projects, then choose a project | pass | Updated `README.md`, `BLUEPRINT.md`, `RUNBOOK.md`, `TASKBOARD.md`, CIC wiki, and Kayden wiki log | Task rows without a Priority column are intentionally read-only; richer status/decision editing remains future work. |
| 2026-07-07 | T-012 | Codex | Captured Kayden's audit follow-up: accepted gaps 1-5, reframed gap 6 as an on-demand fresh-state CTA, added gap 7 as browser QA/bug-discovery work, and added gap 8 as `GMAIL_REFRESH_COMMAND` parsing hardening | n/a | pass | Updated `TASKBOARD.md` | none |
| 2026-07-06 | T-001 | Codex | Used upstream `templates/ADOPTION.md`; fetched `KaydenClark/LLM_Workbench` `origin/main`; confirmed current templates include `BLUEPRINT.md`, `TASKBOARD.md`, `RUNBOOK.md`, and `ADOPTION.md`; local inventory found no `GAMEPLAN.md`, `Gameplan.md`, `GAME_PLAN.md`, or `ROADMAP.md`; `npm test` passed 24/24; `npm run build` passed; `npm audit --omit=dev` found 0 vulnerabilities | n/a | pass | Added/updated `AGENTS.md`, `BLUEPRINT.md`, `TASKBOARD.md`, `RUNBOOK.md`, `README.md`, CIC wiki page, and Kayden wiki log | Existing unrelated dirty worktree remains outside this harness change |
| 2026-07-10 | T-002 visual/runtime follow-up | Codex | Proved `localhost`, `127.0.0.1`, and `kaydens-mac-mini.local` returned the same index hash from one IPv6 dual-stack LaunchAgent process. Added red/green no-store shell coverage, icon-forward ScrubLordKay navigation/project/taskboard styling, compact focused-page headers, and exact-host runtime verification. `npm test` 32/32, build pass, production audit 0 vulnerabilities; desktop and 390x844 browser checks had no horizontal overflow or console issues. | Open `http://kaydens-mac-mini.local:8787/`, reload once, then select Projects or Personal To-Dos | pass | Updated `README.md`, `BLUEPRINT.md`, `RUNBOOK.md`, `TASKBOARD.md`, `design-qa.md`, CIC wiki, and Kayden wiki log; `AGENTS.md` checked, no update needed | Already-open tabs must reload once to discard an in-memory old bundle; future reloads receive the no-store shell. |
