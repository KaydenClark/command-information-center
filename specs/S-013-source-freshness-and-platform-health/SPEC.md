# S-013 - Source Freshness And Platform Health

> Generated from LLM Workbench v2.3.

**Spec ID:** S-013
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer; Kayden selects any new live adapter
**Updated:** 2026-07-17
**Catalog description:** Make cached feed health, update attempts, successful refresh age, and platform-health evidence explicit for every CIC source.
**Blockers:** none for TK-003; owner source and credential choice for TK-004
**Latest event:** Canon harvest separated shipped Gmail and platform-health proof from the unresolved portfolio-wide freshness contract.
**Next gate:** After S-012/TK-002, claim TK-003 and normalize cached-versus-updated source truth.

## Outcome

Kayden can tell what CIC loaded, what source was actually contacted, whether the
attempt succeeded, and how old the last durable success is without confusing
response time with source freshness.

## Why It Matters

Operational confidence depends on knowing whether information is current.
Gmail and Personal Intelligence Platform already have stronger freshness seams,
but other panels can still appear online from cached feed data without an
executable update adapter.

## Current Verified State

- `refresh_runs` records source attempts and successes in SQLite.
- `/api/state.refreshFreshness` exposes durable update evidence while
  top-level `refreshedAt` remains only response time.
- Gmail has an on-demand update path, bounded command parsing, failure
  recording, and last-attempt/last-success UI.
- Personal Intelligence Platform health is read from a validated cached report
  and degrades after 90 minutes.
- Calendar, GitHub, Vercel, Drive, finance, OpenBrain, and other feed panels do
  not all have executable update adapters.

## Desired Behavior

- Every source distinguishes configured availability, cached feed status,
  last contact attempt, last successful update, age, and stale/unavailable
  state when evidence exists.
- Loading `/api/state` never implies that an external update occurred.
- Sources without an adapter say so explicitly and cannot present feed render
  time as live freshness.
- Failed updates preserve the previous last-success evidence and show the new
  failure.
- Platform health remains sanitized, cached, bounded, and browser-read-only.

## Decisions And Contracts

- Durable `refresh_runs` own update attempt/success history.
- `refreshedAt` is response generation time only.
- Update adapters are added one source at a time with bounded calls, explicit
  credentials, and source-specific proof.
- A page refresh is not a connector refresh.
- The browser never executes the Personal Intelligence Platform verifier.

## Non-Goals

- Claiming every visible feed has a live connector today.
- Selecting a new credentialed connector without owner direction.
- Persisting raw email, calendar, finance, or account exports.
- Treating project Git inspection or runtime SHA as hosting health; S-008 and
  S-016 own those boundaries.

## Dependencies And Blockers

- SQLite runtime for durable refresh history.
- TK-004 requires Kayden to select the next source and approve its credential
  and privacy boundary.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Gmail durable update attempt/success and age | done | none | Archived v2.1 T-003/T-005 plus current Gmail, freshness, API, and browser tests |
| TK-002 | Sanitized cached Personal Intelligence Platform health | done | none | Archived v2.1 T-007 plus current platform-health unit/browser coverage |
| TK-003 | Uniform cached-versus-contacted freshness contract for every visible source | ready | none | pending |
| TK-004 | First owner-selected non-Gmail executable update adapter | blocked | Owner selects source and credential/privacy boundary | pending |
| TK-005 | Desktop/mobile stale, failed, never-updated, and successful-update proof | ready | TK-003 | pending |

## Ticket Done Contracts

### TK-001 - Gmail Durable Update Attempt/Success And Age

Done when one supported update records attempt, success or failure, detail, and
age; failures preserve prior success; command parsing is shell-free and
bounded; and desktop/mobile UI reflects the durable record.

### TK-002 - Sanitized Cached Personal Intelligence Platform Health

Done when CIC reads only a bounded cached report, strips private/raw fields,
marks missing/malformed/old evidence degraded, and never starts the checker from
a browser request.

### TK-003 - Uniform Cached-Versus-Contacted Freshness Contract

Done when every visible source payload and UI can distinguish cached feed
health from an actual contact attempt and success, exposes no-adapter state
explicitly, and contains no fallback to response time as source freshness.
Proof includes deterministic normalization/API tests and representative UI
checks.

### TK-004 - First Owner-Selected Non-Gmail Executable Update Adapter

Blocked until Kayden chooses the source and approves its credential/privacy
boundary. Done when one bounded source-specific adapter records durable
attempt/success evidence, degrades safely, and has focused contract, timeout,
privacy, and browser proof. This gate must not be guessed from available local
credentials.

### TK-005 - Desktop/Mobile Freshness-State Proof

Done when desktop/mobile fixtures visibly distinguish never updated, cached
only, fresh success, stale success, failed latest attempt with prior success,
and unavailable source states with no overflow or misleading healthy label.

## Acceptance Criteria

- [x] Gmail reports durable attempt, success, failure, and age.
- [x] Cached platform health is validated, sanitized, and time-bounded.
- [ ] Every visible source distinguishes cached state from actual update evidence.
- [ ] Page-load response time is never labeled source freshness.
- [ ] Desktop/mobile proof covers material freshness states.
- [ ] Any new live adapter is owner-selected and credential/privacy reviewed.

## Testing Seams

- Temporary SQLite refresh history.
- `test/gmail.test.js`, `test/freshness.test.js`,
  `test/platformHealth.test.js`, source normalizer, API, and browser fixtures.
- Injected adapter command/fetch seams with bounded timeout.

## Verification Procedure

```bash
node --test test/gmail.test.js test/freshness.test.js test/platformHealth.test.js test/sourceNormalizer.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Blueprint owns the source-freshness invariant and known adapter limitation.
- README and Runbook describe supported update actions and the meaning of each
  timestamp.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Created cohesive freshness owner from shipped Gmail/platform proof and Blueprint direction | Source/tests and archived v2.1 proof inspected; full Node/browser/build/audit plus render, doctor, harness, evaluator, and diff checks green | S-013, Blueprint coverage, Lexicon, and generated controls updated | TK-003 ready; TK-004 owner-gated |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- The next credentialed adapter is intentionally not selected by the Planner.

## Supersession

- Supersedes: freshness/platform-health portions of S-001's broad baseline
- Superseded by: none
