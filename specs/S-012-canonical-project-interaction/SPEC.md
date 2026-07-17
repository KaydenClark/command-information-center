# S-012 - Canonical Project Interaction

> Generated from LLM Workbench v2.3.

**Spec ID:** S-012
**Status:** active
**Priority:** 0
**Owner:** CIC Engineer
**Updated:** 2026-07-17
**Catalog description:** Let Kayden inspect and safely request project changes from CIC while stable specs remain canonical and generated Taskboards remain projections.
**Blockers:** none
**Latest event:** Canon harvest found that adopted-project reads are canonical but the legacy priority route still rewrites generated Taskboard rows.
**Next gate:** Claim TK-002 and make adopted-project direct Taskboard priority writes fail closed.

## Outcome

Kayden can use CIC as the human-facing project control surface without CIC
becoming a second queue or directly mutating generated Workbench v2.3
Taskboards as if they were canonical requirements.

## Why It Matters

S-007 and S-009 made project specs and tickets readable, but the existing
priority editor still rewrites a matching row in another project's
`TASKBOARD.md`. For adopted projects, priority belongs to the owning stable
spec and the Taskboard must be regenerated. The current route therefore
contradicts the project ownership model even though its file update is bounded.

## Current Verified State

- S-007 parses project specs and tickets for the Projects view.
- S-009 binds canonical projects to registry-owned `P-###` identities and
  composite `P-###/S-###` references.
- `PATCH /api/project-taskboards/:project/tasks/:taskId/priority` calls
  `updateProjectTaskPriority`, which rewrites the matching Taskboard table row.
- `server/taskboards.js` validates project containment, priority values, and
  duplicate IDs, but it does not reject an adopted v2.3 generated Taskboard.
- CIC currently has no canonical spec-aware request/apply state for project
  priority or owner-decision changes.

## Desired Behavior

- Project inspection uses canonical registry enrollment and project-local specs.
- Adopted v2.3 projects never treat generated `TASKBOARD.md` as the owning write
  target.
- A supported project change is a bounded intent against one exact
  `P-###/S-###/TK-###` or owner-decision identity.
- The project lifecycle tool applies the change to the owning spec, renders the
  Taskboard, doctors the result, and returns durable evidence.
- Requested, applying, applied, rejected, or blocked are transient CIC states;
  the stable spec and generated Taskboard remain canonical.
- Legacy projects without specs stay read-only until an explicit safe legacy
  action is separately justified.

## Decisions And Contracts

- Stable specs own priority, ticket state, owner decisions, requirements, and
  proof for adopted projects.
- CIC may not infer a write target from a rendered row, alphabetical project
  order, folder scan, or duplicate task ID.
- The first repair is fail-closed: remove the known wrong write before adding a
  canonical mutation path.
- Later apply work uses fixed lifecycle operations and exact identities; it does
  not accept an arbitrary path, command, Markdown fragment, or shell string.
- One durable writer owns a project spec/change lane at a time.

## Non-Goals

- Editing arbitrary Markdown from the browser.
- Adding a generic command runner or repository writer.
- Moving project source truth into CIC SQLite.
- Auto-resolving owner decisions or implementing project tickets.
- Retrofitting legacy projects during an unrelated CIC action.

## Dependencies And Blockers

- S-007 and S-009 are complete read-model dependencies.
- The target project must expose valid v2.3 lifecycle controls before canonical
  apply is enabled.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Registry-backed project/spec/ticket read model | done | none | S-007 and S-009 exact-head proof cover canonical reads, identities, responsive rendering, and malformed-state degradation |
| TK-002 | Fail closed on direct priority writes to adopted generated Taskboards | ready | TK-001 | pending |
| TK-003 | Apply one exact spec priority request through the owning lifecycle | ready | TK-002 | pending |
| TK-004 | Resolve one exact owner decision through the owning lifecycle | ready | TK-003 | pending |
| TK-005 | Desktop/mobile canonical-action state and recovery proof | ready | TK-004 | pending |

## Ticket Done Contracts

### TK-001 - Registry-Backed Project/Spec/Ticket Read Model

Done when CIC lists only contained project roots, preserves registry identities,
parses stable specs and their tickets, degrades malformed inputs honestly, and
passes desktop/mobile no-overflow proof. Existing S-007/S-009 proof satisfies
this slice.

### TK-002 - Fail Closed On Direct Priority Writes To Adopted Generated Taskboards

Done when a red test proves the current route mutates an adopted generated
Taskboard, then the smallest repair rejects that request without changing the
file. Legacy projects become read-only unless a separate safe contract exists.
Proof includes before/after file bytes, focused API/helper tests, and no changes
to any external project during verification.

### TK-003 - Apply One Exact Spec Priority Request Through The Owning Lifecycle

Done when one fixed request identifies a contained canonical project and exact
spec, applies only an allowed priority through the project lifecycle seam,
renders and doctors the target, records bounded outcome evidence, and rejects
arbitrary paths/commands/fields. Proof uses temporary fixture repositories and
no live project mutation.

### TK-004 - Resolve One Exact Owner Decision Through The Owning Lifecycle

Done when CIC can submit one fixed, explicit decision choice already offered by
the owning spec, preserve recommendation/cost context, apply through the same
bounded lifecycle, and leave unsupported or stale choices blocked. It must not
invent an owner answer.

### TK-005 - Desktop/Mobile Canonical-Action State And Recovery Proof

Done when requested, applying, applied, rejected, and blocked states are
readable on desktop/mobile; duplicate requests are bounded; session loss and
stale target evidence fail closed; and an under-one-minute synthetic demo proves
that the owning spec changed and its Taskboard was regenerated. No owner gate is
required for fixture proof.

## Acceptance Criteria

- [x] Project/spec/ticket reads use canonical registry and stable-spec evidence.
- [ ] Adopted projects cannot be changed by rewriting generated Taskboard rows.
- [ ] One exact allowed priority change updates the owning spec through bounded lifecycle tooling.
- [ ] One exact predeclared owner decision can be applied without inventing a choice.
- [ ] CIC transient action state never becomes the canonical project queue.
- [ ] Arbitrary project paths, commands, Markdown, shell strings, and duplicate
      identities fail closed.
- [ ] Desktop/mobile proof covers action state, recovery, and canonical-file outcome.

## Testing Seams

- Temporary project fixtures with registry, specs, lifecycle tool, and generated
  Taskboard.
- `test/taskboards.test.js` and API tests for adopted/legacy rejection and exact
  input validation.
- Browser mocks for transient state without touching live project repositories.
- Byte-for-byte target checks before and after rejected operations.

## Verification Procedure

```bash
node --test test/taskboards.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Blueprint must state the current direct-write contradiction and the
  spec-centered target contract.
- README and Runbook update when the safe action path exists; CONTRACT remains
  unchanged unless an external consumer contract changes.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Classified legacy priority mutation as contradicted by live source and scoped the canonical replacement | Source/tests and S-007/S-009 inspected; full Node/browser/build/audit plus render, doctor, harness, evaluator, and diff checks green | S-012, Blueprint coverage, Lexicon, and generated controls updated | TK-002 is the smallest safe Engineer slice |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Project implementation remains project-owned; CIC applies only bounded
  lifecycle metadata/decision actions.

## Supersession

- Supersedes: direct adopted-project priority writes to generated Taskboard rows
- Superseded by: none
