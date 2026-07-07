# Command Information Center Agent Instructions

> Generated from LLM Workbench v2.1. To pull later harness improvements into this project, see `RUNBOOK.md` -> Upgrading The Harness.

Command Information Center is a private local web app under `/Users/kayden/GPT_OS/Projects/Command Information Center`.

## Authority Order

When instructions conflict, use this order:

1. Current user request.
2. This `AGENTS.md`.
3. Source code and tests, verified live.
4. `BLUEPRINT.md`.
5. `TASKBOARD.md`.
6. `RUNBOOK.md`.
7. `README.md` and older handoff notes.

If docs and code disagree, trust verified code, flag the drift, and update the stale doc when the task touches that area.

## Read Order

1. `README.md`
2. `BLUEPRINT.md`
3. `TASKBOARD.md`
4. `RUNBOOK.md`
5. `server/`
6. `src/`
7. `refresh-skill/SKILL.md`
8. `data.js`
9. `archive/static-v0/` only for static-dashboard fallback context

## Read Scope

Agents may read this project root, source, tests, docs, configs, dependency manifests, build output needed for debugging, and explicitly referenced GPT_OS wiki pages. Do not read secrets, credentials, OAuth tokens, local databases, raw personal data, or unrelated projects unless the current task requires it and the source is explicitly in scope.

## Edit Scope

Agents may edit:

- `server/`
- `src/`
- `test/`
- `refresh-skill/`
- project docs in the root
- `.env.example`
- dependency manifests and lockfiles only when a dependency change is necessary and explained
- GPT_OS wiki/log pages only when the project documentation rules below require it

Agents must not edit:

- `.env`
- `data/`
- `logs/`
- SQLite files, WAL files, OAuth tokens, client secrets, raw exports, generated build output, dependency folders, or unrelated projects

If the correct change requires leaving scope, stop and explain the smallest needed scope expansion.

## Web App Rules

- Keep the app LAN-local unless Kayden explicitly asks for remote access.
- Use the existing React + Vite + Express + SQLite architecture.
- Store runtime data under `data/` and logs under `logs/`.
- Do not commit `.env`, SQLite files, logs, OAuth tokens, or client secrets.
- Prefer degraded states over fake connector data.
- Keep Gmail task suggestions summarized; do not store full email bodies.
- Keep money-sensitive UI blur-compatible.

## Routine Data Refresh Rules

- Routine connector refreshes still rewrite only `data.js`.
- Do not claim live connector values unless they came from a current connector call or local source read.
- Preserve the top-level `window.CIC_DATA` keys documented in `refresh-skill/SKILL.md`.
- If a source is unavailable, mark it `offline` or `auth_required` and keep the UI renderable.

## Coding Rules

- Use red/green TDD for behavior changes where practical.
- Run `npm test`, `npm run build`, and `npm audit --omit=dev` before handoff.
- For UI changes, verify desktop and mobile rendering in a browser.
- For UI changes, read `VISUAL_DESIGN.md` first and follow Kayden's palette and iconography rules unless the current user request overrides them.

## Work Selection

Default loop:

1. Read `BLUEPRINT.md` to understand project purpose, constraints, and stable direction.
2. Read `TASKBOARD.md` to choose the next concrete task.
3. Pick the highest-priority `ready` task that is in scope and unclaimed.
4. Mark it `claimed` or `in-progress` before editing.
5. Do the smallest correct change.
6. Verify it with the proof required by the task and `RUNBOOK.md`.
7. Update `TASKBOARD.md` with the result, documentation status, and remaining gaps.

Do not invent a different next task while `TASKBOARD.md` has a valid `ready` item unless the user explicitly redirects you.

## Documentation Rules

- When behavior, location, schema, or refresh cadence changes, update the Command Information Center wiki page in `Wiki - Kayden/01 Projects/`.
- For machine/workspace changes, update the relevant `Wiki - Machine/` page.
- Append log entries with `Agent: Codex` or `Agent: Claude` as appropriate.

Documentation is part of done. Use this routing when deciding what to update:

| Change type | Documentation to check |
|---|---|
| Purpose, product behavior, architecture, data model, routes, invariants, safety boundary | `BLUEPRINT.md` |
| Current work queue, blockers, deferred work, task proof, handoff state | `TASKBOARD.md` |
| Setup, install, run, test, build, deploy, recovery, environment, operations | `RUNBOOK.md` |
| User-facing setup, usage, demo, handoff, public instructions | `README.md` |
| Agent rules, scope, authority, verification contract | `AGENTS.md` |

If no docs need edits, record `Docs checked; no update needed` in the final response and in the relevant `TASKBOARD.md` proof row.

## Verification And Proof

Every completed task leaves proof in two places:

- Final response: what changed, why, risks, and how verified.
- `TASKBOARD.md` proof log: one row with actual results, not stale claims.

Milestone tasks should also include a demo artifact the owner can check in under a minute: a screenshot, short recording, preview URL, or one-command demo.

## Long Session Control

- Re-read `BLUEPRINT.md` and `TASKBOARD.md` after any context summary or long interruption.
- Keep task statuses current as work changes state.
- Tick or move a task only once its proof exists.
- Append proof rows; do not rewrite existing proof history.
- A `claimed` or `in-progress` task with no update after one working day may be reclaimed after checking branch, commit, and visible handoff state.
