# S-030 - Job Order Flight Rack

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-030
**Status:** planned
**Priority:** 0
**Owner:** Unassigned
**Updated:** 2026-08-30
**Catalog description:** Render real seven-stage Job Order flight Actuality in CIC from the declared Gauge observation feed with exact provenance, blockers, recovery, and closure.
**Blockers:** S-029 accepted and Gauge Flight Observation Feed landed
**Latest event:** Adapter and UI slices were promoted from settled Canon; no implementation began.
**Next gate:** the adopting instance issues the adapter slice after dependencies close.

## Outcome

CIC renders real Job Orders across Sitrep, Preflight, Launch-flight, In-flight,
Landing-check, Land, and PostFlight-check plus blocked, repair, recovery-required,
delivered-unclosed, and terminal dispositions. Every row exposes source and
freshness; no simulated or inferred motion appears as Actuality.

## Decisions And Contracts

- The adapter consumes only the declared Gauge Flight Observation Feed and
  preserves exact order/revision, Run, sequence, provenance, freshness, and findings.
- The UI makes delivery distinct from closure and shows stale/unavailable/
  conflicting data instead of guessing.
- Public source/fixtures remain redacted; private bindings, payloads, receipts,
  auth, install, and screenshots stay in GPT_OS.
- Source delivery, private install/restart, and authenticated final acceptance
  are separate adopting-instance Job Orders; all `main` refs are excluded.

## Non-Goals

- Orchestration, lifecycle mutation, Job Order control, Schematic animation,
  install, restart, credentials, or a second task/proof database.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Consume the Flight Observation Feed through a bounded public adapter with no reach-around. | blocked | accepted Gauge feed; adopting-instance issuance | Planning only. |
| TK-002 | Render accessible desktop/mobile Flight Rack states and exact provenance/freshness. | blocked | TK-001; adopting-instance issuance | Planning only. |

## Acceptance Criteria

- [ ] Adapter validates all seven stages and blocked/repair/recovery/delivery/
      terminal states, rejecting malformed, stale, conflicting, or unsafe data.
- [ ] Desktop and 375x812 mobile show exact stage/provenance/freshness, delivery
      versus closure, accessible labels, no overflow, and no console errors.
- [ ] No Schematic or generic task feed substitutes for lifecycle Actuality.
- [ ] Each source slice has independent exact-SHA PASS and non-force public
      `Integration` read-back; private install/auth/final proof is root-owned.

## Testing Seams

Adapter schema/sequence/recovery fixtures; SSR/API; desktop/mobile browser;
privacy scan; exact-ref recovery; no-mutation and source-mismatch cases.

## Documentation Impact

CIC `BLUEPRINT.md`, `LEXICON.md`, `README.md`, `RUNBOOK.md`, this Spec, and the
generated Taskboard. The adopting instance owns private release evidence.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-08-30 | spec | Promoted the public Flight Rack adapter/UI contract and private evidence boundary without implementation. | Portable lifecycle contract, Gauge feed ownership, and CIC public/private boundaries inspected. | This public Spec; private coordination remains adopting-instance evidence. | Lighthouse acceptance and Gauge Flight feed. |

## Supersession

- Extends S-027's honest Foundry Mirror without changing completed v1.0.1 proof.
