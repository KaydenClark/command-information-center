# S-011 - Personal Task Workspace

> Generated from LLM Workbench v2.3.

**Spec ID:** S-011
**Status:** complete
**Priority:** 3
**Owner:** Kayden (product); prior CIC Engineers (execution)
**Updated:** 2026-07-17
**Catalog description:** Preserve CIC's validated SQLite-backed personal task workflow without confusing it with canonical repository taskboards.
**Blockers:** none
**Latest event:** Canon harvest separated the implemented personal task workspace from the broad S-001 baseline.
**Next gate:** none

## Outcome

Kayden can create, find, group, move, complete, and dismiss local personal task
cards while project repositories retain ownership of their own specs and
generated Taskboards.

## Why It Matters

Personal operational tasks and project implementation tickets are both useful
inside CIC, but they have different authorities and persistence. A durable
capability spec prevents UI terminology or future workflows from silently
turning local SQLite into a second project queue.

## Current Verified State

- `server/db.js` validates and persists tasks, task events, source status, and
  suggestion dismissal in local SQLite.
- `server/app.js` exposes authenticated task create, update, and dismiss routes.
- `src/main.jsx` supports board/list presentation, search, grouping, status
  movement, creation, completion, and dismissal.
- Current DB, API, task-view, and browser tests exercise the task lifecycle.

## Desired Behavior

- Local personal tasks remain fast to create and organize from desktop or phone.
- Inputs fail closed, task events remain attributable, and dismissed suggestions
  do not silently reappear as duplicates.
- Feed-derived suggestions remain summarized and never persist full email bodies.
- Repository specs and generated Taskboards remain separate, canonical project
  surfaces.

## Decisions And Contracts

- `tasks` and `task_events` in CIC SQLite own Personal Taskboard state only.
- Repository taskboards are read from project files and never copied into the
  personal task database.
- Board and List are two views over the same task rows.
- Suggested tasks may be dismissed; normal tasks may be completed or moved.

## Non-Goals

- Using CIC SQLite as a canonical project queue.
- Storing full email bodies or raw connector exports.
- Owning canonical project priority or owner-decision changes; S-012 owns that
  interaction boundary.

## Dependencies And Blockers

- Local writable SQLite runtime.
- Summarized feed input for suggestion seeding.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Validated local task persistence and audit events | done | none | Current DB and API tests cover create, update, move, validation, events, and dismissal |
| TK-002 | Searchable grouped Board/List workflow | done | TK-001 | Archived v2.1 T-006 plus current task-view and browser tests cover Board/List, search, grouping, and mobile layout |
| TK-003 | Summarized suggestion seeding and duplicate-safe dismissal | done | TK-001 | Current DB and Gmail tests cover bounded seeding, existing-task protection, and dismissal behavior |

## Ticket Done Contracts

### TK-001 - Validated Local Task Persistence And Audit Events

Done when create, partial update, status movement, completion, and dismissal
validate inputs, persist in local SQLite, and record the relevant task event.
Closing proof is focused DB/API tests against a temporary database.

### TK-002 - Searchable Grouped Board/List Workflow

Done when Board and List expose the same task state, search is
case-insensitive across useful fields, grouping and priority order are stable,
and desktop/mobile browser workflows pass.

### TK-003 - Summarized Suggestion Seeding And Duplicate-Safe Dismissal

Done when bounded summarized feed actions and Gmail threads seed useful tasks,
existing active rows are not duplicated, dismissed suggestions remain
dismissed, and no full message body is stored.

## Acceptance Criteria

- [x] Personal tasks can be created, updated, moved, completed, and dismissed.
- [x] Invalid inputs fail closed and changes leave local event evidence.
- [x] Board/List, grouping, priority order, and search share one SQLite source.
- [x] Suggested tasks are summarized and duplicate-safe.
- [x] Personal task state remains separate from project-owned specs and Taskboards.

## Testing Seams

- `test/db.test.js`, `test/api.test.js`, and `test/taskViews.test.js`.
- `test/browser/smoke.spec.js` for representative desktop/mobile workflow.
- Temporary SQLite paths isolate verification from private runtime data.

## Verification Procedure

```bash
node --test test/db.test.js test/api.test.js test/taskViews.test.js
npm run test:browser
npm run build
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Add this capability owner to the Blueprint matrix and generated catalog.
- Keep the Personal Taskboard versus Repository Taskboard distinction in
  Blueprint, Lexicon, and README.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Converted the implemented personal task workspace into stable capability truth | Current DB/API/UI and archive inspected; Node 230 pass + 6 TODO; Playwright 16 pass + 8 intended skips; build, production audit 0, render, doctor, harness checks, evaluator, and diff check green | S-011, Blueprint coverage, Lexicon, and generated controls updated | none |

## Completion Result

The shipped personal task workflow now has a stable owner and an explicit
boundary from canonical repository work.

## Remaining Limitations Or Follow-Up Specs

- Canonical project interactions are planned in S-012.

## Supersession

- Supersedes: the personal-task portion of S-001's broad migration baseline
- Superseded by: none
