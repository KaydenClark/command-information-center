# S-010 - Human-Facing Operations Surface

> Generated from LLM Workbench v2.3.

**Spec ID:** S-010
**Status:** complete
**Priority:** 3
**Owner:** Kayden (product); prior CIC Engineers (execution)
**Updated:** 2026-07-17
**Catalog description:** Preserve CIC's credential-free, responsive human-facing shell and focused operational views as one durable capability.
**Blockers:** none
**Latest event:** Canon harvest converted the implemented multi-view shell into a durable capability record.
**Next gate:** none

## Outcome

Kayden has one responsive CIC interface for current work and connected
information, and a reviewer can run the same interface safely with synthetic
data and no credentials.

## Why It Matters

The human-facing control surface is CIC's core product, but its durable proof
previously lived only in the broad S-001 migration baseline and archived
v2.1 tickets. A stable capability owner prevents the product shell from being
treated as incidental infrastructure.

## Current Verified State

- `src/main.jsx` exposes Dashboard, Briefing, Taskboard, Calendar, Projects,
  Deployments, Inbox, Finance, Music, and Intelligence navigation.
- `data.example.js` supports a fully rendered credential-free demo.
- `test/browser/smoke.spec.js` exercises primary navigation, responsive
  layouts, task workflow, platform health, projects, deployments, and
  Intelligence partial state.
- S-001 preserves the pre-harvest Node, browser, build, and audit baseline.

## Desired Behavior

- The app opens to an honest operational overview and provides focused views
  without requiring terminal inspection.
- Synthetic demo mode remains useful, deterministic, and free of personal data
  or credentials.
- Missing optional dependencies remain visible as degraded or partial rather
  than disappearing or fabricating live state.
- Desktop and narrow mobile layouts preserve readable navigation, controls,
  status, and content without horizontal overflow.

## Decisions And Contracts

- CIC is the human-facing monitoring and safe-control surface; it is not the
  canonical project queue, OpenBrain memory backend, or a hidden task database
  for other repositories.
- The existing SLK visual language and Lucide icons remain the product baseline.
- The same committed application must run in synthetic demo mode and in a
  private configured runtime.
- Focused views may summarize external systems, but their source and degraded
  state remain visible.

## Non-Goals

- Owning project-specific task state, OpenBrain storage, or arbitrary remote
  execution.
- Declaring optional connectors live without current source evidence.
- Replacing project-local specs that own deeper behavior for Projects,
  Deployments, Intelligence, privacy, or owner actions.

## Dependencies And Blockers

- S-001 historical baseline and S-002 Workbench adoption are complete.
- Deeper capability contracts are owned by S-011 through S-017 and existing
  S-004 through S-009.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Credential-free responsive application shell | done | none | S-001 archived baseline, `data.example.js`, and current browser smoke cover credential-free desktop/mobile rendering |
| TK-002 | Focused operational views with honest degraded panels | done | TK-001 | Current navigation, view components, source normalization, and API/browser tests cover the shipped view set and partial states |
| TK-003 | Repeatable under-one-minute primary workflow demo | done | TK-002 | `npm run test:browser` provides the repeatable desktop/mobile review seam recorded by S-001 and the v2.1 T-004 proof |

## Ticket Done Contracts

### TK-001 - Credential-Free Responsive Application Shell

Done when the committed app renders from synthetic data with no credentials,
desktop and mobile navigation remain usable, and no private runtime artifact is
required or committed. Closing proof is a production build plus desktop/mobile
browser smoke.

### TK-002 - Focused Operational Views With Honest Degraded Panels

Done when every Blueprint-listed view has a visible route or panel, optional
sources fail visibly, and no view fabricates live state. Closing proof is source
and route inspection plus focused Node/browser assertions.

### TK-003 - Repeatable Under-One-Minute Primary Workflow Demo

Done when one repeatable browser command proves primary navigation and a
representative workflow at desktop and mobile sizes with no unexpected console
errors. No owner or credential gate is required for synthetic proof.

## Acceptance Criteria

- [x] CIC renders a useful credential-free synthetic demo.
- [x] The Blueprint-listed operational views are present in one responsive shell.
- [x] Missing optional sources degrade visibly instead of fabricating data.
- [x] Desktop and mobile browser seams cover primary navigation and workflows.
- [x] Deeper project, privacy, Intelligence, freshness, runtime, and action
      contracts route to their owning stable specs.

## Testing Seams

- `test/nav.test.js` for the approved view set.
- `test/browser/smoke.spec.js` for primary desktop/mobile workflows.
- `test/sourceNormalizer.test.js` and API tests for deterministic partial state.
- `npm run build` for the production client.

## Verification Procedure

```bash
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Add this durable capability owner to the Blueprint coverage matrix and
  generated catalog.
- README and Runbook already describe demo startup and the current view set.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Converted implemented shell behavior into stable capability truth | Current source plus S-001/archive inspected; Node 230 pass + 6 TODO; Playwright 16 pass + 8 intended skips; build, production audit 0, render, doctor, harness checks, evaluator, and diff check green | S-010, Blueprint coverage, Lexicon, and generated controls updated | none |

## Completion Result

CIC's credential-free responsive shell and focused operational views now have
one durable capability owner without reopening completed implementation work.

## Remaining Limitations Or Follow-Up Specs

- Source-specific depth and live acceptance remain with S-013 through S-017.

## Supersession

- Supersedes: the human-facing shell portion of S-001's broad migration baseline
- Superseded by: none
