# S-028 - FUID Work-item Projection And Intent

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-028
**FUID:** 000003
**Status:** active
**Priority:** 0
**Owner:** Codex
**Created:** 2026-08-18
**Last worked:** 2026-08-18
**Updated:** 2026-08-18
**Catalog description:** Restore CIC's Spec-grouped five-column kanban from a rebuildable FUID work-item Projection and route movement through a separate validated Intent ledger.
**Blockers:** none
**Latest event:** TK-002 closed with proof; TK-003 is ready after its dependency passed.
**Next gate:** Complete TK-003.

## Outcome

CIC opens on a five-column project-work kanban grouped by Spec. Tickets appear
as child steps in Backlog, To Do, In Progress, Blocked, and Complete with FUID,
legacy alias, Created, and Last worked. SQLite accelerates query and preserves
pending Intent, but canonical repository controls remain authoritative.

## Decisions And Contracts

- Canonical source capture fully rebuilds the Work-item Projection in one
  transaction and records source path, source revision, source observation,
  and refresh completion.
- Personal `tasks` and their events remain unchanged and separate.
- Drag/drop calls a validated Intent API. It inserts an Intent request and
  append-only event, returns a pending overlay, and leaves projected status
  unchanged.
- FUID is primary in payloads and UI; typed aliases remain searchable and
  visible.
- Lifecycle mapping is `deferred` to Backlog, `ready` to To Do, `in-progress`
  to In Progress, `blocked` to Blocked, and `done` to Complete.
- Refresh/poll/render never advances canonical Last worked.

## Reviewed Additive SQLite Schema

This review is the explicit migration gate. The migration is additive and runs
through `CREATE TABLE IF NOT EXISTS`; it neither deletes nor rewrites a real
database and is tested against an in-memory legacy schema.

| Table | Purpose | Required constraints |
|---|---|---|
| `work_projection_sources` | One provenance/freshness row per canonical Workbench source. | unique source key; source path/revision/observed/captured timestamps; status and bounded detail |
| `work_items_projection` | Rebuildable Project/Spec/Ticket materialization. | primary FUID; unique source+kind+typed alias; parent FUID FK where present; canonical lifecycle/date/provenance fields; no user-authored status column |
| `work_projection_refreshes` | Append-only refresh receipt. | refresh FUID, started/completed time, source/item counts, outcome, bounded error |
| `intent_requests` | Validated pending Intent, separate from Projection. | six-character FUID PK; target FUID; requested transition; actor; source revision; idempotency key unique; status; created/updated timestamps |
| `intent_events` | Append-only Intent audit trail. | FK to request; event type; bounded JSON payload; created timestamp; update/delete triggers reject mutation |
| `fuid_allocators` | Plane-scoped high-water for CIC-born Intent/refresh identities only. | scope PK; fixed width; last issued; updated timestamp; never used to allocate canonical Project/Spec/Ticket identity |

Schema invariants: foreign keys stay enabled; refresh is transactional and
idempotent; an invalid/duplicate canonical FUID aborts without replacing the
last good projection; Intent idempotency returns the existing request; no
Projection trigger or Intent route updates canonical status; event rows are
append-only.

## Non-Goals

- Turning SQLite into Canon, editing repository Taskboards directly, or
  executing a Job Order.
- Reusing personal task tables for repository work.
- Reading or migrating the owner's real `data/cic.sqlite` during development.

## Vertical Implementation Slices

| Ticket | FUID | Slice | Status | Blockers | Created | Last worked | Proof |
|---|---|---|---|---|---|---|---|
| TK-001 | 00000D | Add the reviewed additive tables and deterministic transactional rebuild with red/green schema, provenance, uniqueness, rollback, and idempotency tests. | done | none | 2026-08-18 | 2026-08-18 | Red/green projection tests pass: additive schema preserves legacy tables, rebuild materializes FUID-primary Spec/Ticket rows with provenance, repeated capture is deterministic, and invalid/duplicate FUID rollback preserves the last good projection; API capture test passes. |
| TK-002 | 00000E | Add validated Intent creation/listing with six-character FUID allocation, transition/source-revision/idempotency checks, append-only events, and no Projection mutation. | done | TK-001 | 2026-08-18 | 2026-08-18 | Intent storage/API tests pass: target FUID, transition, actor, source revision, and idempotency are validated; replay returns one request/event; append-only triggers reject mutation; projected status remains canonical while pending overlay is returned. |
| TK-003 | 00000F | Replace the flat read-only Master Taskboard with the Spec-grouped five-column Projection view, FUID/alias/dates/search, and drag/drop pending Intent overlay. | ready | TK-002 | 2026-08-18 | 2026-08-18 | pending |
| TK-004 | 00000G | Run full API/UI/browser proof, document one-command rebuild/demo/recovery, and checkpoint the exact remote head for root S-036 acceptance. | blocked | TK-003 | 2026-08-18 | 2026-08-18 | pending |

## Acceptance Criteria

- [ ] Additive schema preserves legacy personal-task and Captain-operation
      tables and never opens the real owner database in tests.
- [ ] Rebuild is transactional, deterministic, idempotent, provenance-bearing,
      and fails closed on invalid or duplicate FUIDs.
- [ ] Intent validation and append-only events are separate from Projection;
      replaying an idempotency key returns the same request.
- [ ] The API returns FUID-primary Spec/Ticket groups, aliases, Created, Last
      worked, canonical status, and pending overlays.
- [ ] The default UI has Backlog, To Do, In Progress, Blocked, and Complete;
      each column groups Tickets under their Spec.
- [ ] Drag/drop creates Intent and leaves the Ticket in its canonical projected
      column until a later Canon change and projection refresh.
- [ ] Desktop and mobile browser proof shows grouping, search, dates, and
      pending movement without horizontal page overflow.

## Testing Seams

- In-memory SQLite initialized from a legacy schema.
- Canonical fixture capture with duplicate/invalid/changed sources.
- Intent API boundary and append-only trigger tests.
- Pure grouping/view-model tests plus Playwright drag/drop and responsive proof.

## Documentation Impact

- `BLUEPRINT.md`, `LEXICON.md`, `RUNBOOK.md`, `README.md`, this spec, API tests,
  and browser demo/proof.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-08-18 | spec | Created as the CIC implementation leg of root S-036 with an explicit reviewed additive schema. | Existing database tables, v1.0.1 portfolio capture, taskboard UI, API routes, and project controls were inspected without reading `.env` or real SQLite contents. | This spec. | Root FUID capture contract, render/doctor, checkpoint, then TK-001 preflight. |
| 2026-08-18 | TK-001 | Ticket closed | Red/green projection tests pass: additive schema preserves legacy tables, rebuild materializes FUID-primary Spec/Ticket rows with provenance, repeated capture is deterministic, and invalid/duplicate FUID rollback preserves the last good projection; API capture test passes. | Reviewed schema remains recorded in S-028 and BLUEPRINT.md; operational rebuild documentation remains for TK-004. | TK-002 Intent ledger, TK-003 kanban, and TK-004 proof remain. |
| 2026-08-18 | TK-002 | Ticket closed | Intent storage/API tests pass: target FUID, transition, actor, source revision, and idempotency are validated; replay returns one request/event; append-only triggers reject mutation; projected status remains canonical while pending overlay is returned. | S-028 schema and BLUEPRINT.md already define the separate Intent boundary; route/runbook details remain for TK-004. | TK-003 grouped kanban and TK-004 browser/recovery proof remain. |

## Completion Result

Pending.

## Supersession

- Supersedes only the forward flat/read-only Master Taskboard direction in
  S-007/S-027; their completed proof remains historical.
