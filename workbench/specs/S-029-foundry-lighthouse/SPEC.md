# S-029 - Foundry Lighthouse

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-029
**Status:** planned
**Priority:** 0
**Owner:** Unassigned
**Updated:** 2026-08-30
**Catalog description:** Show an honest owner-visible Foundry activity light in CIC from the declared Heartbeat Socket with exact source and freshness.
**Blockers:** accepted Gauge Heartbeat emitter and CIC S-027/TK-007 baseline
**Latest event:** Adapter and UI slices were promoted from settled Canon; no implementation began.
**Next gate:** the adopting instance issues the adapter slice after dependencies close.

## Outcome

CIC displays Lighthouse from the declared Heartbeat Socket. Desktop and mobile
views distinguish live, quiet, stale, unavailable, source-mismatched, and
unauthenticated states with exact observation time, last-received time, and
source provenance.

## Decisions And Contracts

- The adapter consumes the versioned socket envelope and preserves findings;
  it never reads Hall, producer, lifecycle, Journal, or private binding files.
- Each observation is one atomic L0-L3 load, active-worker, average/peak
  reasoning, cadence, sequence, emitted-time, source, and freshness snapshot.
  CIC acknowledges the exact sequence and returns observer health/freshness.
- Exact cadence is L0=60 seconds, L1=15 seconds, L2=5 seconds, and L3=1 second.
  One missed expected beat immediately makes Lighthouse dark/still while
  preserving the exact last-received time.
- The UI never treats PID, port, HTTP status, generic task activity, Schematic
  animation, or historical Canon as live Foundry activity.
- Public source and fixtures are redacted. Private binding, payload, auth, install,
  screenshots, and runtime evidence remain in GPT_OS.
- Source delivery, private install/restart, and authenticated acceptance are
  separate adopting-instance Job Orders. CIC `Integration` is the public
  target; `main` is excluded.

## Non-Goals

- A write control, scheduler, lifecycle store, private feed, install, restart,
  credential flow, Flight Rack, or Schematic change.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Consume Heartbeat Socket through a bounded public adapter with provenance/freshness/findings and no filesystem reach-around. | blocked | accepted Gauge emitter; adopting-instance issuance | Planning only. |
| TK-002 | Render accessible desktop/mobile Lighthouse states from the adapter and prove no Schematic/task-feed substitution. | blocked | TK-001; adopting-instance issuance | Planning only. |

## Acceptance Criteria

- [ ] Adapter rejects malformed, stale, mismatched, unavailable, and privacy-
      unsafe data without filesystem reach-around.
- [ ] Adapter and fixtures prove atomic snapshot preservation, exact cadence,
      sequence acknowledgement, observer health/freshness, and the one-missed-
      beat failure boundary.
- [ ] Desktop and 375x812 mobile show all required states, source/freshness,
      accessible labels, no overflow, and no console errors.
- [ ] Public fixtures contain no private bindings or evidence.
- [ ] Each source slice has independent exact-SHA PASS and non-force public
      `Integration` read-back; private install/auth proof remains root-owned.

## Testing Seams

Adapter schema/timeouts; stale/mismatch fixtures; SSR/API; desktop/mobile browser;
privacy scan; exact-ref recovery; no-mutation failure cases.

## Documentation Impact

CIC `BLUEPRINT.md`, `LEXICON.md`, `README.md`, `RUNBOOK.md`, this Spec, and the
generated Taskboard. The adopting instance owns private release evidence.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-08-30 | spec | Promoted the public adapter/UI contract and private evidence boundary without implementation. | Live CIC source/install/runtime split and portable socket ownership inspected. | This public Spec; private coordination remains adopting-instance evidence. | Workflow, baseline, and Gauge Heartbeat dependencies. |

## Supersession

- Supersedes S-027's statement that live Job Order motion requires Announced Activation only for this read-only Heartbeat surface; it does not reopen S-027 evidence.
