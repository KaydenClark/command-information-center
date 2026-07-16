# S-007 - Spec-Grouped Project Tickets

> Generated from LLM Workbench v2.3.

**Spec ID:** S-007
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer
**Updated:** 2026-07-16
**Catalog description:** Group the Projects view by each project's specs with expandable tickets, adopt ticket terminology, rename the personal board to Taskboard, and unmask the workbench passphrase fields.
**Blockers:** none
**Latest event:** Implementation and verification completed on `feature/spec-grouped-projects`; pull request into `Integration` awaits owner review.
**Next gate:** Owner reviews the pull request into `Integration`.

## Outcome

The Projects view mirrors the owner's mental model: the Taskboard is the board
of tasks; specs and issues create tickets; each ticket is a task. Projects that
adopted Workbench v2.3 show their `specs/*/SPEC.md` catalog as expandable
groups whose vertical slices render as tickets. The personal board is named
Taskboard, and the two workbench release passphrase fields show what the owner
types.

## Current Verified State

- `server/taskboards.js` parses `specs/*/SPEC.md` per project (header fields
  plus the Vertical Implementation Slices table) into `specs[]` with `tickets[]`,
  degrading honestly on malformed or oversized files.
- `src/projectTaskboards.jsx` renders a Specs section with expandable spec rows
  and per-ticket status pills; legacy TASKBOARD.md groups remain for projects
  without specs, relabeled to tickets.
- `src/main.jsx` renames Personal To-Dos to Taskboard and renders the approval
  and Captain handoff passphrase inputs as visible text.
- `server/config.js` `loadEnv` no longer overwrites env vars explicitly set to
  the empty string, and the Node and Playwright test harnesses neutralize local
  credentials so both suites are hermetic on machines with a live environment
  file.

## Decisions And Contracts

- Ticket terminology: the Taskboard is the board of tasks; a task can be a spec
  or an issue; specs and issues create tickets; each ticket row is a task.
- Spec parsing is read-only; CIC never writes to another project's `specs/`.
- Explicitly-set process environment values, including empty strings, outrank
  the environment file.

## Non-Goals

- Editing specs or tickets from the dashboard (the existing priority editor
  covers legacy TASKBOARD.md rows only).
- A deployments pipeline for projects other than the fixed LLM Workbench
  release.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Parse specs/*/SPEC.md into specs with tickets on the taskboard API | done | none | 7/7 taskboards unit tests pass, including malformed-spec degradation |
| TK-002 | Render spec groups with expandable tickets in the Projects view | done | none | Browser check on live specs; 232-test Node suite and build pass |
| TK-003 | Rename Personal To-Dos to Taskboard and unmask passphrase inputs | done | none | nav unit test and desktop/mobile smoke updated and passing |
| TK-004 | Make Node and browser suites hermetic against live local credentials | done | none | Full Playwright suite 11 passed / 7 desktop-skips, previously 11 failed |

## Acceptance Criteria

- [x] A project with `specs/` shows each spec as a row that expands to its
  tickets without navigating away.
- [x] Projects without specs keep their legacy grouped rows, labeled tickets.
- [x] The personal board is labeled Taskboard in the nav and page heading.
- [x] Both workbench passphrase fields show typed characters.
- [x] Node and browser suites pass on a machine with live local credentials.

## Testing Seams

- `test/taskboards.test.js` spec-parsing fixtures; `test/config.test.js`
  loadEnv empty-override case; `test/nav.test.js` labels; Playwright smoke and
  workbench release specs.

## Verification Procedure

```bash
npm test
npm run build
npm run test:browser
```

## Documentation Impact

- README Personal To-Dos wording updated to Taskboard.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | TK-001..TK-004 | Implemented on `feature/spec-grouped-projects` | Node suite 227 pass / 0 fail / 6 todo; build pass; Playwright 11 pass / 7 desktop-skips; visual check of spec expansion on live data | README updated; this spec added | Owner review of the pull request into `Integration` |
