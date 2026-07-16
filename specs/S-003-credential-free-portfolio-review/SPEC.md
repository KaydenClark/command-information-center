# S-003 - Credential-Free Portfolio Review

> Generated from LLM Workbench v2.3.

**Spec ID:** S-003
**Status:** active
**Priority:** 0
**Owner:** Kayden (product); project agents (execution)
**Updated:** 2026-07-15
**Catalog description:** Package CIC's verified synthetic demo into an honest, repeatable portfolio review that takes under one minute to assess.
**Blockers:** none
**Latest event:** Live discovery verified the product baseline and isolated the missing durable review artifact.
**Next gate:** Complete TK-001 without changing product behavior or requiring private services.

## Outcome

A reviewer can assess CIC's core promise in under one minute from a durable,
credential-free review package that shows the operator surface, a real task
workflow, and honest degraded intelligence or connector state.

## Current Verified State

On 2026-07-15, the registered `Integration` worktree was clean and aligned with
`origin/Integration` at `47e12b5`. Live verification passed 169 Node tests (163
pass, 6 explicit TODO), four desktop/mobile Playwright checks, the production
build, a production dependency audit with zero findings, and the spec doctor.

`README.md` documents the synthetic demo, while `test/browser/smoke.spec.js`
proves navigation, a task create-and-move workflow, the Intelligence partial
state, platform health, and clean browser consoles. The stable capability
records do not yet link a current screenshot, short recording, or equivalent
review manifest that packages those proofs for an under-one-minute portfolio
review. No repository-local feedback or regression evidence justifies product
polish; the owner-directed portfolio-readiness request is the evidence for this
bounded packaging gap.

## Desired Behavior

- The review package launches from the documented synthetic demo with no
  credentials or private feeds.
- A reviewer can confirm the CIC heading and operational dashboard, exercise or
  observe one Personal To-Dos create-and-move workflow, and see that unavailable
  intelligence or connector state is labeled honestly.
- The package identifies the exact commit, commands, viewport, duration, and
  artifact location so another agent can repeat the proof.
- The review remains explicitly separate from deployment readiness and live
  connector readiness.

## Decisions And Contracts

- Use synthetic `data.example.js` and an isolated temporary SQLite database.
- Prefer a short recording plus a compact review manifest; screenshots are
  acceptable only if the full review path remains clear and takes under one
  minute to inspect.
- Do not include environment files, credentials, OAuth state, personal feeds,
  local databases, raw browser state, or private platform-health content.
- Product source is out of scope for this slice. A discovered regression becomes
  a named blocker and separate evidence-backed task rather than hidden scope.

## Non-Goals

- Deploying CIC or changing repository/public visibility.
- Configuring OpenAI, OpenBrain, Supabase, Gmail, Spotify, or paid services.
- Redesigning the dashboard or reopening completed baseline capabilities.
- Treating synthetic proof as evidence that private integrations are configured.

## Dependencies And Blockers

- Node.js 22 or newer and the already documented npm/Playwright toolchain.
- The committed synthetic feed and existing credential-free demo path.
- Blockers: none. Missing local browser binaries must be recorded explicitly if
  they prevent artifact capture.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Capture the credential-free under-one-minute review artifact and repeatable proof manifest (15-45 minutes) | ready | none | pending |

## Acceptance Criteria

- [ ] One durable artifact and its manifest let the owner review the core CIC
  promise in under one minute.
- [ ] The proof uses only the synthetic feed and an isolated temporary database;
  it contains no secrets, personal data, or private runtime output.
- [ ] The review visibly covers the dashboard, one task create-and-move workflow,
  and an honest unavailable/degraded Intelligence or connector state.
- [ ] The manifest records commit, launch command, targeted check, viewport,
  duration, artifact path, and any limitation without claiming live-service or
  deployment readiness.
- [ ] Targeted and full verification pass, and the stable spec contains the
  resulting evidence and documentation status.

## Testing Seams

- Existing Playwright desktop/mobile workflows and console-error assertions.
- Synthetic `/api/state` plus isolated task persistence.
- Manual timing and visual inspection of the final review artifact.

## Verification Procedure

Targeted proof:

```bash
npm run test:browser
```

Capture the artifact from the documented credential-free demo using
`data.example.js` and a temporary `CIC_DB`, then confirm the manifest can be
followed and reviewed in under one minute.

Full verification:

```bash
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Add the artifact and compact manifest under `docs/show-readiness/`.
- Update this spec's acceptance, proof ledger, completion result, and remaining
  limitations when TK-001 closes.
- Check `README.md`; update it only if the existing credential-free launch path
  changes. Product, API, vocabulary, and operations docs are otherwise expected
  to remain unchanged.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-15 | TK-001 | Discovery scoped one review-package slice | 163 pass, 6 TODO, 0 fail; 4 browser checks; build green; audit 0; doctor green | S-003 and generated projections | Capture and link the under-one-minute credential-free artifact and manifest |

## Completion Result

Pending TK-001.

## Remaining Limitations Or Follow-Up Specs

- Live connector and deployment readiness remain owner-gated and are not implied
  by this synthetic review package.

## Supersession

- Supersedes: none
- Superseded by: none
