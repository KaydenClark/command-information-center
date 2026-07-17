# S-018 - Scheduled Prescient Assessment

> Generated from LLM Workbench v2.3.

**Spec ID:** S-018
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (paid/config enablement and live acceptance)
**Updated:** 2026-07-17
**Catalog description:** Run a bounded, observable, privacy-safe scheduled OpenAI assessment that reconciles system-flagged Prescient tasks in the configured OpenBrain Supabase backend.
**Blockers:** no live scheduled writes; Kayden permits only bounded no-write API verification after engineering proof, with a hard $5 total cap
**Latest event:** Kayden kept the scheduled writer disabled and authorized limited API-path verification only after scheduler, timeout, reconciliation, and observability proof; no live write is approved.
**Next gate:** After higher-priority trust repairs, claim TK-001 and make startup/24-hour scheduling plus disabled-state evidence testable.

## Outcome

When explicitly configured and owner-enabled, CIC assesses summarized project
and action state shortly after server startup and every 24 hours, then safely
inserts, updates, or resolves only system-flagged Prescient tasks with bounded
requests and observable, privacy-safe outcomes.

## Why It Matters

`server/index.js` already schedules a background OpenAI assessment and
`server/kanbanCheck.js` writes to OpenBrain's `prescient_tasks` table through a
Supabase service-role key. This is a paid, privileged, durable write capability,
not merely another Intelligence view. Its scheduler, network lifetime,
reconciliation, and operational evidence are not fully proved today.

## Current Verified State

- `server/index.js` calls `scheduleKanbanCheck` at process startup.
- When `OPENAI_API_KEY` exists, the scheduler queues one run after 10 seconds
  and repeats every 24 hours; without that key it returns silently.
- `runKanbanCheck` separately skips when OpenAI or Prescient Supabase
  configuration is absent.
- The model receives only summarized briefing actions and project items from
  the configured feed, not OpenBrain retrieval results.
- Valid results are reconciled against open `flagged_by=system` rows through
  Supabase GET/POST/PATCH calls.
- Tests prove configuration skips, valid/empty/model-error handling, exact-title
  update, and one resolve case. Six parser/matching/empty-result expectations
  remain `test.todo`.
- The OpenAI and Prescient Supabase requests do not currently have a proved
  bounded timeout contract. Supabase errors may include provider detail, and
  scheduler state is console-only.

## Desired Behavior

- Scheduling is an exported/injectable seam with one 10-second startup run and
  one non-overlapping 24-hour cadence.
- Disabled, skipped, running, ready, error, and timed-out states are observable
  without logging prompts, keys, raw model output, provider bodies, or private
  feed content.
- Live execution requires both OpenAI and Supabase service-role configuration
  plus explicit owner acceptance of paid model use and durable remote writes.
- OpenAI and every Supabase read/write have bounded request lifetimes and
  sanitized failure results.
- Reconciliation inserts new stable flags, updates matched system flags, and
  resolves omitted system flags only after a valid non-empty assessment.
- Empty, invalid, partial, timed-out, or failed assessments never resolve
  existing flags.
- Only `flagged_by=system` rows are eligible for automatic reconciliation.
- Repeated runs avoid duplicate flags through proved exact and bounded fuzzy
  matching.

## Decisions And Contracts

- S-018 owns scheduled Prescient writes; S-015 owns interactive Intelligence
  reads and answers.
- The initial delay is 10 seconds and the repeat cadence is 24 hours unless a
  later owner-approved spec changes the product contract.
- The scheduler must not overlap runs. A long or stuck run cannot create a
  second concurrent reconciliation.
- Paid/config enablement is explicit. Merely finding local credentials does not
  authorize live model calls or Supabase writes during implementation/tests.
- Test fixtures inject fake timers and fetch implementations; they never use a
  real OpenAI key, service-role key, or remote table.
- Durable run evidence may use bounded local operational storage, but it cannot
  persist prompts, raw responses, secrets, or private source rows.

## Non-Goals

- Running the live assessment during Planner or automated fixture verification.
- Letting a browser trigger arbitrary scheduled runs or edit provider targets.
- Writing user-created Prescient tasks or rows not flagged by the system.
- Treating an empty model response as proof that every prior flag is resolved.
- Adding a generic scheduler, arbitrary prompt runner, or Supabase writer.

## Dependencies And Blockers

- OpenAI Responses configuration and the OpenBrain-compatible
  `prescient_tasks` Supabase table for live operation.
- Owner approval for paid model usage, service-role remote writes, and live
  acceptance.
- S-013 owns general source freshness semantics; S-014 owns private secret and
  auth boundaries.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Testable startup and non-overlapping 24-hour schedule with explicit config states | ready | none | pending |
| TK-002 | Bounded OpenAI and Prescient Supabase request lifetimes with sanitized failures | ready | TK-001 | pending |
| TK-003 | Durable insert/update/resolve reconciliation without empty-result erasure | ready | TK-002 | pending |
| TK-004 | Privacy-safe scheduled-run observability and operational verification | ready | TK-003 | pending |
| TK-005 | Owner-approved live scheduled-write acceptance | blocked | Owner paid/config enablement and live-write approval | pending |

## Ticket Done Contracts

### TK-001 - Testable Startup And Non-Overlapping 24-Hour Schedule

Done when red/green fake-timer tests prove exactly one run at 10 seconds, a
24-hour repeat cadence, no concurrent overlap, clean timer shutdown/unref
behavior, and explicit disabled/skipped evidence when either OpenAI or
Prescient configuration is absent. No live provider call is part of proof.

### TK-002 - Bounded OpenAI And Prescient Supabase Request Lifetimes

Done when injected hanging OpenAI and Supabase GET/POST/PATCH requests abort at
documented bounds, return stable sanitized error codes/details, and cannot leave
the scheduler permanently active. Closing proof must cover each request phase;
the current unbounded implementation is not accepted as done.

### TK-003 - Durable Insert/Update/Resolve Reconciliation

Done when deterministic fixtures prove new insert, exact/fuzzy update,
non-system-row exclusion, duplicate prevention, and resolution of unmatched
system flags only after a valid non-empty assessment. Empty, invalid, partial,
timed-out, or failed assessments must preserve every existing flag. All six
current TODO expectations are either activated with meaningful assertions or
superseded by stronger named tests.

### TK-004 - Privacy-Safe Scheduled-Run Observability

Done when operators can inspect last attempt, last success, status, bounded
counts, duration, next scheduled run, and sanitized failure without prompts,
raw model/provider bodies, credentials, private feed text, or service-role
details. Runbook verification must prove enabled and disabled fixture states
without invoking live providers.

### TK-005 - Owner-Approved Live Scheduled-Write Acceptance

Owner-gated. Done when Kayden explicitly approves existing private OpenAI and
Supabase configuration for paid assessment and durable writes, observes one
bounded scheduled run, verifies the expected system-only insert/update/resolve
effect, and records a secret-free under-one-minute artifact. No credential
creation or production-table cleanup is implied.

## Acceptance Criteria

- [ ] Startup and 24-hour scheduling are deterministic, non-overlapping, and testable.
- [ ] Missing OpenAI or Prescient configuration is observable and produces no provider call/write.
- [ ] Every OpenAI and Supabase request phase has a proved timeout and sanitized failure.
- [ ] Reconciliation inserts, updates, deduplicates, and conditionally resolves only system flags.
- [ ] Empty/invalid/failed/timed-out assessments never erase existing flags.
- [ ] Scheduled-run evidence is useful but contains no prompt, raw response,
      credential, provider body, or private feed content.
- [ ] Paid/configured live acceptance is explicitly owner-approved.

## Testing Seams

- Exported scheduler with injected timer, clock, and assessment function.
- Injected OpenAI/Supabase fetch implementations covering success, hang,
  abort, error, malformed, empty, and partial responses.
- Deterministic existing-row fixtures for exact/fuzzy matches, duplicates,
  user-created rows, and conditional resolution.
- Bounded local run-evidence fixture plus secret/privacy sentinel scans.

## Verification Procedure

```bash
node --test test/kanbanCheck.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

Live acceptance is separate and runs only after TK-001 through TK-004 pass,
the exact configuration boundary is reviewed, and Kayden approves paid remote
execution.

## Documentation Impact

- Blueprint owns the scheduled writer, paid/config, reconciliation, privacy,
  and separation from interactive Intelligence.
- Runbook owns enable/disable, cadence, timeout, observability, recovery, and
  live-acceptance procedures.
- README and CONTRACT update only if the user-facing setup or external
  `prescient_tasks` consumer contract changes.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | Auditor remediation | Created a dedicated capability owner without claiming unproved scheduler/write safety | `test/kanbanCheck.test.js`: 8 passed and 6 TODO; full Node: 230 passed and 6 TODO; Playwright: 16 passed and 8 intended skips; build and zero-vulnerability audit passed; render, doctor, harness, evaluator, and diff checks passed; no live provider calls or writes | S-018, Blueprint matrix, Taskboard owner gate, Lexicon, environment template, README, CONTRACT, and Runbook updated | TK-001 ready; timeout and scheduled-write acceptance remain open; TK-005 owner-gated |
| 2026-07-17 | owner decision checkpoint | Kayden kept scheduled Prescient writes disabled. After all engineering proof, one no-write API-path verification may spend at most $5 total; no live Supabase write is approved. | Conversation decision only; no provider call, schedule enablement, credential change, or remote write occurred. | S-018 and generated Taskboard updated. | TK-001 through TK-004 remain required before any bounded API-path verification. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Current source still has unproved/unbounded scheduler and Supabase request
  behavior until the ready tickets close.

## Supersession

- Supersedes: any implication that S-015 interactive Intelligence proof covers
  the scheduled Prescient writer
- Superseded by: none
