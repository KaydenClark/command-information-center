# S-029 - Foundry Lighthouse

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-029
**FUID:** 00009Q
**Status:** planned
**Priority:** 0
**Owner:** Unassigned
**Created:** 2026-08-30
**Last worked:** 2026-08-30
**Updated:** 2026-08-30
**Catalog description:** Show an honest owner-visible Foundry activity light in CIC from the declared Heartbeat Socket with exact source and freshness.
**Blockers:** accepted Gauge Heartbeat emitter and CIC S-027/TK-007 baseline
**Latest event:** Adapter and UI slices were promoted from settled Canon; no implementation began.
**Next gate:** the adopting instance issues the adapter slice after dependencies close.

## Outcome

CIC displays Lighthouse from the declared Heartbeat Socket. Desktop and mobile
views distinguish live, quiet, stale, unavailable, source-mismatched, and
unauthenticated states with exact observation time and source provenance.

## Decisions And Contracts

- The adapter consumes the versioned socket envelope and preserves findings;
  it never reads Hall, producer, lifecycle, Journal, or private binding files.
- The UI never treats PID, port, HTTP status, generic task activity, Schematic
  animation, or historical Canon as live Foundry activity.
- Public source and fixtures are redacted. Private binding, payload, auth, install,
  screenshots, and runtime evidence remain in GPT_OS.
- Source delivery, private install/restart, and authenticated acceptance are
  separate root Job Orders. CIC `Integration` is the public target; `main` is excluded.

## Non-Goals

- A write control, scheduler, lifecycle store, private feed, install, restart,
  credential flow, Flight Rack, or Schematic change.

## Vertical Implementation Slices

| Ticket | FUID | Slice | Status | Blockers | Created | Last worked | Proof |
|---|---|---|---|---|---|---|---|
| TK-001 | 00009R | Consume Heartbeat Socket through a bounded public adapter with provenance/freshness/findings and no filesystem reach-around. | blocked | accepted Gauge emitter; adopting-instance issuance | 2026-08-30 | 2026-08-30 | Planning only. |
| TK-002 | 00009S | Render accessible desktop/mobile Lighthouse states from the adapter and prove no Schematic/task-feed substitution. | blocked | TK-001; adopting-instance issuance | 2026-08-30 | 2026-08-30 | Planning only. |

## Acceptance Criteria

- [ ] Adapter rejects malformed, stale, mismatched, unavailable, and privacy-
      unsafe data without filesystem reach-around.
- [ ] Desktop and 375x812 mobile show all required states, source/freshness,
      accessible labels, no overflow, and no console errors.
- [ ] Public fixtures contain no private bindings or evidence.
- [ ] Each source slice has independent exact-SHA PASS and non-force public
      `Integration` read-back; private install/auth proof remains root-owned.

## Testing Seams

Adapter schema/timeouts; stale/mismatch fixtures; SSR/API; desktop/mobile browser;
privacy scan; exact-ref recovery; no-mutation failure cases.

## Documentation Impact

CIC `BLUEPRINT.md`, `LEXICON.md`, `README.md`, `RUNBOOK.md`, this Spec, generated
Taskboard, and private root S-038 release evidence.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-08-30 | spec | Promoted the public adapter/UI contract and private evidence boundary without implementation. | Live CIC source/install/runtime split and portable socket ownership inspected. | This public Spec; private coordination remains adopting-instance evidence. | Workflow, baseline, and Gauge Heartbeat dependencies. |

## Supersession

- Supersedes S-027's statement that live Job Order motion requires Announced Activation only for this read-only Heartbeat surface; it does not reopen S-027 evidence.
