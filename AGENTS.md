# Command Information Center - Agent Instructions

> Generated from LLM Workbench v2.3. To pull later harness improvements into
> this project, see `RUNBOOK.md` -> Upgrading The Harness.

This file controls agents working in this repository. Command Information
Center (CIC) is a React + Express operations dashboard that runs with a
synthetic demo feed and can connect to private OpenBrain-style services at
runtime.

## Authority Order

When instructions conflict, use this order:

1. Current user request.
2. This `AGENTS.md`.
3. Source code and tests, verified live.
4. The assigned stable `specs/S-###-slug/SPEC.md`.
5. `BLUEPRINT.md`, then `LEXICON.md`.
6. `TASKBOARD.md`, then `RUNBOOK.md`.
7. `README.md`, `CONTRACT.md`, `SPEC_DIARY.md`, and older handoff notes.

If docs and source disagree, trust verified source state, flag the drift, and
update the stale owning doc when the task touches that area.

## Read Scope

Agents may read:

- this repository root;
- `src/`, `server/`, `test/`, and `supabase/migrations/` as needed;
- project docs, configuration examples, dependency manifests, and lockfiles;
- generated output only while debugging build or runtime behavior;
- external paths only when the current request or a project control doc puts
  them explicitly in scope.

Do not read real `.env` files, credentials, tokens, local databases, raw
personal feeds, browser state, or unrelated projects unless the current task
requires that specific source and the user has put it in scope.

## Edit Scope

Agents may edit when the task requires it:

- `src/` for the React interface;
- `server/` for the Express API and server-side integrations;
- `test/` for automated specifications;
- `supabase/migrations/` only when a schema task explicitly requires it;
- `data.example.js`, `.env.example`, `CONTRACT.md`, and the six project control
  files when their contracts change;
- dependency manifests and lockfiles only for a necessary, explained dependency
  change.

Agents must not edit or commit:

- `.env`, `data.js`, SQLite files, logs, OAuth tokens, credentials, or raw
  personal data;
- `node_modules/`, `dist/`, or other generated output;
- unrelated repositories or external services;
- `main` or `Integration` directly during normal feature work.

Schema migrations, public API changes, auth-boundary changes, and changes to
durable personal-data storage require explicit review. If the correct change
requires leaving scope, stop and explain the smallest needed expansion.

## Work Selection

Default loop:

1. Run `node tools/spec-workbench.mjs doctor`; stop on contradictory lifecycle state.
2. Run `node tools/spec-workbench.mjs next --json`.
3. Load only the returned spec with `node tools/spec-workbench.mjs show S-###`.
4. Read `BLUEPRINT.md`, `LEXICON.md`, and `RUNBOOK.md` only as needed.
5. Claim the eligible slice before implementation.
6. Make the smallest correct change and verify it with the spec and runbook.
7. Close the ticket with proof, update acceptance and completion when satisfied,
   then render and doctor the generated `TASKBOARD.md` projection.

If blocked, record the concrete cause and next action in the owning spec. Do not
silently replace a valid ready ticket with invented work.

## Version Control

- `main` is the release branch.
- `Integration` is the staging bridge where completed task branches are merged
  and exercised together before release.
- Create task branches from `Integration` using `type/short-description`.
- Open task pull requests into `Integration` unless the user names another
  target.
- Do not commit normal task work directly to `Integration`; its initial harness
  commit is the one-time staging-branch bootstrap authorized by the owner.
- Only the owner merges `Integration` into `main`.
- Never force-push shared branches or rewrite published history without explicit
  approval.

## Product And Coding Rules

- Preserve the React 18 + Vite + Express 5 + SQLite architecture unless a task
  explicitly changes it.
- Validate request and connector inputs at the server boundary.
- Keep privileged OpenAI, Supabase, OpenBrain, and Spotify credentials
  server-side.
- Prefer honest unavailable/degraded states over fabricated connector or AI
  output.
- Keep personal feeds summarized; do not store full email bodies.
- Keep financial, purchase, medical, and device-related UI blur-compatible.
- Use red/green TDD for behavior changes when the stack supports it.
- Preserve the SLK brand system and Lucide icon usage for visual changes unless
  the current request supplies a new design direction.
- Use explicit error handling at file, network, database, process, and external
  service boundaries; do not silently turn a failure into healthy state.

The Workbench supplies no generic house visual style. For asset work, follow the
SLK direction already present in `src/styles.css`, search for license-safe free
assets before generating replacements, and record source URL, author, license,
and attribution requirements. Avoid emoji as interface icons when Lucide or a
platform-native symbol can do the job.

## Documentation Ownership

Documentation is part of done. The agent making a durable change owns the
matching documentation update.

| Change type | Documentation to check |
|---|---|
| Purpose, product behavior, architecture, routes, data model, invariants, privacy boundary | `BLUEPRINT.md` |
| Durable capability requirements, decisions, proof, and completion | Owning stable `SPEC.md` |
| Active work, blockers, and next gates | Generated `TASKBOARD.md` projection |
| Shared project vocabulary | `LEXICON.md` |
| Install, run, test, build, deploy, recovery, environment, operations | `RUNBOOK.md` |
| User-facing setup, usage, demo, public contract | `README.md` and `CONTRACT.md` when relevant |
| Raw, unfiltered UI/UX walkthrough observations awaiting triage | `SPEC_DIARY.md`; promote an actioned item into a spec/ticket without deleting the diary entry |
| Agent rules, scope, branch flow, verification contract | `AGENTS.md`; keep `CLAUDE.md` thin |

If no docs need edits, record exactly `Docs checked; no update needed` in the
final response and the relevant proof row, with a short reason.

## Verification And Proof

For behavior changes:

1. Define expected behavior.
2. Add or update a failing test.
3. Confirm it fails for the expected reason.
4. Implement the smallest fix.
5. Run the targeted test.
6. Run the full verification suite from `RUNBOOK.md`.

Every completed task leaves proof in the final response and the owning stable
spec. Milestones also require a demo artifact the owner can
check in under one minute, such as a preview URL, screenshot, recording, or
one-command local demo.

Treat tests as the project specification, not a comfort signal. Keep assertions
that would fail when a route, validation rule, data contract, workflow, privacy
boundary, or regression fix is removed. Improve tests that pass without proving
meaningful behavior; remove stale or purely duplicative tests.

If a required check cannot run, name the specific reason, run the strongest
repeatable manual check available, and record the unverified risk. Do not use a
generic statement such as "tests unavailable."

For all completion reports, state:

1. What changed.
2. Why it changed.
3. Risks or side effects.
4. How it was verified.

Do not claim a check passed unless it actually ran.

## Team Coordination

The active agent is the manager for the selected task and owns the consolidated
result. When subagents are explicitly requested or useful under the current
environment rules:

- give each subagent a concrete, bounded, non-overlapping research or test lane;
- keep shared control docs and source files under one durable writer at a time;
- use `TASKBOARD.md` as the team taskboard for claims, blockers, and proof;
- require subagents to return evidence and file references to the manager rather
  than independently publishing or broadening scope;
- have the manager reconcile findings, run final verification, update docs, and
  perform the branch handoff.

These plain Markdown controls are intentionally portable across Codex, Claude,
ChatGPT, and other agents. Tool-specific convenience must not become the only
place a project rule or task state exists.

## Escalation Contract

Proceed on low-risk, reversible work inside verified scope. Ask one focused
question when a missing answer changes architecture, public contract, privacy,
money, safety, or destructive risk. Phrase the escalation as product tradeoffs:
give the owner the options, a recommendation, and the cost or impact of each
choice, then record an unresolved choice in `TASKBOARD.md`.

## Long Session Control

- Re-run doctor and next, then reload the assigned spec after context compaction
  or a long interruption.
- Keep spec status current and append proof rather than rewriting history.
- A claim older than one working day may be reclaimed only after checking for a
  branch, commit, pull request, or handoff that is still advancing it.
- If the same verification fails twice and the next step is not clearly safe,
  record the blocker and surface the decision needed.

## What Not To Do

- Do not invent APIs, paths, behavior, task state, or test results.
- Do not create `ROADMAP.md`, `GAMEPLAN.md`, or `GAME_PLAN.md` beside the active
  `TASKBOARD.md`.
- Do not expose runtime secrets or personal data in commits, client bundles,
  logs, screenshots, or responses.
- Do not broaden scope, make the app remotely accessible, or add or change paid
  services without explicit approval.
- Do not treat passing Node tests as proof that browser layout and interaction
  are correct when the task changes the UI.
