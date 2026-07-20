# S-023 - OpenBrain Answer Quality

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-023
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer
**Updated:** 2026-07-19
**Catalog description:** Make CIC send the operator's real question to OpenBrain and synthesize an answer rather than a raw activity dump.
**Blockers:** none for the deterministic request/synthesis seams; live provider proof remains separately credential-gated.
**Latest event:** Promoted the CIC-owned Phase-1 repair from the 2026-07-17 OpenBrain grilling.
**Next gate:** Claim TK-001 and drive the actual-question request seam red/green.

## Outcome

When an authenticated operator asks CIC an Intelligence question, the server
passes that actual question to OpenBrain and returns an explicit source-backed
answer or an honest degraded state. It does not substitute a fixed generic
query or present raw GitHub activity as if it answered the question.

## Decisions And Contracts

- This is OpenBrain Phase 1: repair the current engine over data already
  present before expanding capture, external MCP, or intent-feed scope.
- CIC owns BUG-1 (actual question propagation) and BUG-3 (answer-oriented
  synthesis). OpenBrain owns BUG-2's hourly Wiki-ingest safety net.
- Missing provider/synthesis data must remain visible as degraded or partial;
  no fabricated answer or private credential reaches the browser.
- Phase 1.5 intent-feed and event-driven sync-and-verify work belongs to the
  linked root/OpenBrain capability, not this answer-quality spec.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Pass the operator's actual question through the CIC Intelligence server boundary to the OpenBrain request adapter. | ready | none | Red/green server test proves the fixed generic query cannot substitute for a user question. |
| TK-002 | Synthesize answer-first Intelligence responses with bounded source citations and honest degraded states. | blocked | TK-001 | Red/green fixtures prove a question is answered, not dumped, and provider failures remain explicit. |
| TK-003 | Run the secret-free end-to-end Intelligence fixture and document the credentialed live-rehearsal gate. | blocked | TK-002 | Browser/API fixture plus named live-proof boundary. |

## Acceptance Criteria

- [ ] CIC forwards the user question rather than a hard-coded generic query.
- [ ] Synthesis is answer-oriented and provenance-bearing.
- [ ] Failure/degraded states are explicit and secret-safe.
- [ ] The phased boundary to OpenBrain freshness and later intent/MCP work stays intact.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-19 | spec | Promoted CIC's Phase-1 BUG-1/BUG-3 ownership from the already-promoted OpenBrain grilling. | Diary decision compared with CIC controls; no source or runtime behavior changed. | Added the missing CIC capability owner. | Implement TK-001..003 under normal red/green and review gates. |

## Completion Result

Pending.

