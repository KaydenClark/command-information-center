# S-016 - Runtime Deployment Identity

> Generated from LLM Workbench v2.3.

**Spec ID:** S-016
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer; Kayden (private-service promotion)
**Updated:** 2026-07-17
**Catalog description:** Show which reviewed CIC source SHA the private service is actually running and distinguish runtime freshness from repository release state.
**Blockers:** none for TK-001; owner approval for private-service promotion
**Latest event:** Live verification corrected the recorded runtime from stale `79e04de` to detached reviewed SHA `6284ecc`.
**Next gate:** After S-012/TK-002, claim TK-001 and add a sanitized build/runtime identity seam.

## Outcome

Kayden and CIC can identify the exact reviewed source SHA serving the private
runtime, when it was built/started, and whether it matches current staging or
release state without inspecting launchd manually or exposing local paths.

## Why It Matters

S-008 reports bounded repository release relationships, but that is not
deployment/runtime truth. S-005 recorded `79e04de` as the running build; live
launchd, process cwd, and Git evidence on 2026-07-17 show the service is actually
running from detached `runtime-integration-v2` at
`6284ecc0deb5cf754a46883bf81a3ec2c171d052`.

## Current Verified State

- `com.kayden.cic` is running and listening on port 8787.
- The launchd working directory and process cwd both resolve to the registered
  detached `runtime-integration-v2` worktree.
- That worktree is clean at exact SHA
  `6284ecc0deb5cf754a46883bf81a3ec2c171d052`.
- The launchd `CIC_RUNTIME_ROOT` remains the canonical CIC repository, so
  ignored config/state and source code correctly use separate roots.
- `/api/auth/status` returns `authRequired: true`.
- The app exposes no sanitized runtime build identity in its UI/API today.

## Desired Behavior

- Build/release tooling writes an immutable, sanitized identity containing exact
  commit SHA, build time, and optional reviewed range/source label.
- The running server exposes that identity only behind the existing app auth
  boundary and never returns local paths, branch credentials, environment, or
  dirty-file content.
- Deployments or System Health shows running SHA/time and compares it to current
  locally known `Integration` and `main` refs with explicit current, behind,
  ahead, divergent, or unavailable state.
- Runtime identity is evidence about served code, not hosting-provider health.
- Startup fails visibly or reports unavailable when identity is malformed; it
  never substitutes the canonical checkout HEAD for the serving source SHA.
- Private-service promotion/restart remains an explicit owner/runtime gate.

## Decisions And Contracts

- Source root owns code and built assets; `CIC_RUNTIME_ROOT` owns ignored state
  and sibling topology.
- Runtime SHA comes from the built source checkout, not runtime data root.
- Exact SHA is immutable for one build; launch time and check time are separate.
- Local paths are server-internal and absent from client payloads.
- S-008 remains repository release evidence; S-016 owns actual CIC runtime code
  identity.

## Non-Goals

- Claiming Vercel, Supabase, public deployment, or production health.
- Automatically promoting or restarting the private service.
- Reading `.env`, credentials, SQLite, or private feed contents.
- Treating a dirty runtime source checkout as acceptable release proof.

## Dependencies And Blockers

- Existing validated `CIC_RUNTIME_ROOT` source/runtime separation from S-005.
- Owner approval is required before changing launchd working directory,
  restarting the private service for promotion, or moving Integration to main.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Sanitized immutable build/runtime identity seam | ready | none | pending |
| TK-002 | Authenticated runtime SHA and staging/release comparison UI | ready | TK-001 | pending |
| TK-003 | Repeatable launchd/process/assets/auth/runtime-SHA verification | ready | TK-002 | pending |
| TK-004 | Owner-approved private-service promotion and phone acceptance | blocked | Owner private-service promotion approval | pending |

## Ticket Done Contracts

### TK-001 - Sanitized Immutable Build/Runtime Identity Seam

Done when a build step writes an exact-SHA identity artifact, the server reads
and validates only bounded allowlisted fields, malformed/missing identity
degrades honestly, and authenticated API proof cannot reveal local paths or
environment. Red/green tests must distinguish source checkout SHA from
`CIC_RUNTIME_ROOT` HEAD.

### TK-002 - Authenticated Runtime SHA And Staging/Release Comparison UI

Done when the private UI shows exact/short running SHA, build/start/check time,
and bounded comparison to local Integration/main refs with explicit evidence
scope. It must not claim hosting health, fetch remotes, or expose paths, and
desktop/mobile no-overflow proof must pass.

### TK-003 - Repeatable Launchd/Process/Assets/Auth/Runtime-SHA Verification

Done when Runbook commands verify launchd state, listening port, process cwd,
serving source SHA, built asset presence, auth contract, and reported runtime
identity without printing environment or secrets. A temporary isolated service
fixture provides automated proof.

### TK-004 - Owner-Approved Private-Service Promotion And Phone Acceptance

Owner-gated. Done when Kayden approves an exact reviewed CIC SHA for the private
service, the candidate worktree is clean, build/gates pass, launchd is updated
and restarted, live runtime identity matches the approved SHA, and a
secret-free phone artifact confirms the deployed UI. This ticket does not
authorize Integration-to-main promotion.

## Acceptance Criteria

- [ ] A validated exact source SHA is immutable for each built runtime.
- [ ] Authenticated UI/API shows runtime identity without local paths or secrets.
- [ ] Runtime identity is distinguished from repository release and hosting health.
- [ ] Repeatable verification checks launchd, process, assets, auth, and exact SHA.
- [ ] Private-service promotion occurs only for an owner-approved reviewed SHA.
- [x] The prior stale `79e04de` record is corrected to live verified `6284ecc`.

## Testing Seams

- Temporary Git source/runtime roots with intentionally different HEADs.
- Build identity fixture with valid, missing, malformed, oversized, and
  path-bearing payloads.
- Authenticated API and desktop/mobile UI tests.
- Safe launchd/runtime verification commands that filter to non-secret fields.

## Verification Procedure

```bash
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

For a live private service, use the secret-safe runtime identity procedure in
`RUNBOOK.md`; do not print the launchd environment or `.env`.

## Documentation Impact

- S-005 append-only evidence receives the corrected current runtime SHA.
- Blueprint owns runtime-versus-release semantics.
- README and Runbook update when runtime identity becomes user-visible and
  repeatably verifiable.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Corrected stale runtime record and created actual-runtime identity capability | launchd running, PID 1450, port 8787 listening, cwd and clean detached worktree at `6284ecc`, auth required, built index present; project/control gates green | S-005 corrected; S-016, Blueprint coverage, Lexicon, Runbook, and generated controls updated | TK-001 ready; promotion remains owner-gated |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Until TK-001/TK-002 ship, exact runtime identity still requires the Runbook
  diagnostic rather than an in-app view.

## Supersession

- Supersedes: stale runtime-SHA statements in S-005 current-state metadata
- Superseded by: none
