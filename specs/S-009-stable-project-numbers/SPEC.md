# S-009 - Stable Project Numbers

> Generated from LLM Workbench v2.3.

**Spec ID:** S-009
**Status:** active
**Priority:** 0
**Owner:** Codex
**Updated:** 2026-07-17
**Catalog description:** Give every canonical GPT_OS project a stable P-### identity and show composite P-###/S-### references on the CIC Projects board.
**Blockers:** none
**Latest event:** TK-001 claimed by Codex.
**Next gate:** Close TK-001 with verification and documentation proof.

## Outcome

The Projects board gives each canonical project a short, stable number and uses
that number to disambiguate repository-local spec IDs. An operator can refer to
`P-005/S-007` and identify one project/spec pair without repeating a long
project name.

## Why It Matters

Every Workbench project starts its own spec sequence at `S-001`, so a bare spec
ID is not unique across GPT_OS. Alphabetical screen positions are also unsafe
identifiers because adding or renaming a project would silently renumber later
rows.

## Current Verified State

- `Wiki/Machine/Project Source Registry.md` assigns permanent `P-001` through
  `P-017` identities and generated `Projects/INDEX.md` preserves them.
- `tools/project-index.mjs` rejects malformed and duplicate project IDs before
  generating the canonical routing index.
- `server/taskboards.js` reads identities defensively from the generated index,
  returns them on summaries and detail payloads, and emits `null` when identity
  evidence is missing or ambiguous.
- `src/projectTaskboards.jsx` renders project badges and composite
  `P-###/S-###` references; search includes the composite value.
- The live Projects board resolves CIC as `P-005`, Dungeon Friends as `P-008`,
  OpenBrain as `P-010`, and leaves duplicate or unenrolled folders visibly
  `Unnumbered`.

## Desired Behavior

- The canonical GPT_OS registry assigns each enrolled project one explicit,
  unique `P-###` ID. Existing assignments do not change when projects are
  added, removed, renamed, or reordered.
- The generated `Projects/INDEX.md` preserves the IDs for bounded CIC parsing.
- CIC returns the matching project ID on project summaries and detail payloads.
- The project rail and selected-project heading show the project ID, while spec
  rows and search expose a composite `P-###/S-###` reference.
- A missing or invalid registry assignment degrades visibly as unnumbered; CIC
  does not invent an ordinal from directory order.

## Decisions And Contracts

- Project IDs use uppercase `P-###`; spec and ticket IDs retain their existing
  repository-local formats.
- The curated root project registry owns project-number assignment. CIC remains
  a read-only consumer and does not maintain a second mapping.
- Initial IDs follow the current curated registry order. Later projects receive
  the next unused number; retired IDs are not reused.
- Composite references use `P-###/S-###` in API-independent operator language.

## Non-Goals

- Renaming repository folders, specs, tickets, Git remotes, or runtime services.
- Replacing project names with numbers.
- Writing project IDs into every project repository or local SQLite state.
- Changing spec numbering within a project.

## Dependencies And Blockers

- The GPT_OS root registry generator must accept and preserve a project ID
  column.
- The runtime topology must keep generated `Projects/INDEX.md` at the configured
  Projects root.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Assign stable project IDs and render composite project/spec references | in-progress | none | pending |

## Acceptance Criteria

- [x] Every canonical project in the root registry has one unique `P-###` ID.
- [x] Generated `Projects/INDEX.md` preserves each ID and rejects missing,
  malformed, or duplicate assignments.
- [x] CIC taskboard summary and detail payloads expose the enrolled project ID.
- [x] The project rail and heading show `P-###`, and spec rows show
  `P-###/S-###` without hiding the project or spec title.
- [x] Filtering matches a composite project/spec reference.
- [x] Missing identity data is visibly unnumbered rather than inferred from
  alphabetical order.
- [x] Desktop and mobile Projects layouts remain readable without horizontal
  overflow.

## Testing Seams

- Root `tools/project-index.mjs` validation and
  `tools/test-control-plane.mjs` generated-index assertions.
- `test/taskboards.test.js` fixtures for valid, missing, malformed, and duplicate
  project IDs.
- Playwright Projects coverage at desktop and mobile viewport sizes.

## Verification Procedure

```bash
# GPT_OS root
node tools/project-index.mjs
node tools/project-index.mjs --check
node tools/test-control-plane.mjs

# Command Information Center
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Update the root project registry, generated index, and root routing
  documentation with the stable-ID contract.
- Update CIC `BLUEPRINT.md` and `README.md` with composite project/spec
  references.
- No runtime setup, environment, API route, credential, or storage change is
  expected; check `RUNBOOK.md` and `CONTRACT.md`.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | planning | Created the stable capability record from the owner request and verified the root registry generator plus current CIC taskboard API and UI | CIC `doctor` passed before planning; `next --json` was null because the only other hot item is an owner acceptance gate | Added this spec; generated Blueprint and Taskboard pending render | Implement TK-001 |
| 2026-07-17 | TK-001 | Implemented stable registry IDs, defensive CIC parsing, composite references, search, and responsive presentation | Red: root generator omitted the identity column and CIC returned undefined. Green: root index checks, control-plane tests, Wiki audit and 6/6 Wiki tests; CIC 230 pass + 6 TODO, Playwright 16 pass + 8 intended skips, build, audit 0, doctor; in-app Browser desktop and 390x844 mobile checks showed the live `P-005/S-009` flow with zero console errors and no document overflow | Root registry, index, Lexicon, README, and Runbook updated; CIC Blueprint, Lexicon, README, spec, and generated Taskboard updated. CIC Runbook checked; no update needed because setup and operations are unchanged. CONTRACT checked; no update needed because the external OpenBrain contract is unchanged. | Publish remotely recoverable checkpoints and complete immutable review |

## Completion Result

Implementation and owner-checkable browser proof are complete. Immutable
checkpoint review and final publication remain before ticket closure.

## Remaining Limitations Or Follow-Up Specs

- Duplicate worktrees and unenrolled project folders remain visibly
  `Unnumbered`; enrollment stays an explicit root-registry decision.
