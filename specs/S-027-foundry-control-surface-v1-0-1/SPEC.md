# S-027 - Foundry Control Surface v1.0.1

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-027
**Status:** active
**Priority:** 0
**Owner:** CIC Engineer
**Updated:** 2026-08-18
**Catalog description:** Rebuild CIC v1.0.1 as the Foundry's honest operator surface: one registry-backed Master Taskboard, exact deployment branches, a Foundry/Schematic view, current skills, and a Foundry-first rework of every tab.
**Blockers:** none for TK-001; live Job Order animation remains a separate future capability blocked by the Grounding Journal, Gatehouse/Sandcastle receipts, and Announced Activation.
**Latest event:** Kayden approved the complete v1.0.1 rework through `/make-it-so`; root S-035/TK-003 names this repository and acceptance surface.
**Next gate:** TK-001 — restore a green dependency/security baseline and lock the v1.0.1 portfolio contracts with failing tests.

## Outcome

Kayden opens `http://servitor.local:8787/` and immediately sees the next
actionable work across GPT_OS and every enrolled Foundry producer. One Master
Taskboard supports portfolio-wide search and project/status/owner/freshness
filters. Each scope shows its canonical source, exact deterministic next item,
owner, blocker, next gate, revision, dirtiness, and observation time.

Deployments shows the actual local branch and upstream state for every active
remote-backed scope, including GPT_OS. The Foundry tab embeds the live
Schematic as the Canon Projection and shows operational Mirror state beside it
without pretending the Schematic is Actuality. Skills reads the shared custom
skill home and reports real availability and freshness. Every remaining tab is
reworked around Foundry operation; personal email, finance, and music stop
occupying primary navigation.

## Why It Matters

The previous CIC was a broad personal-information dashboard. Its project view
scanned directories, invented its own next-work ranking, omitted GPT_OS, and
its deployment reader returned an empty portfolio from stale routing data. That
made the surface least reliable when Kayden needed it most. v1.0.1 restores the
operator contract: route to Canon, show observed Actuality with freshness, and
fail visibly when either cannot be evaluated.

## Verified Current State

- Producer checkout is clean on `Integration`
  `2e0f26fa796a22c08b82702145e4d85ac30cad2c`.
- The owner-visible service runs the installed product from
  `Foundry/Modules/Command Information Center` on stale feature branch
  `codex/s022-tk001-skill-catalog-tracer` at `c1e2fd2`; its built artifact is
  dated 2026-07-28 and reports v1.0.0.
- Current taskboard discovery finds only CIC and OpenBrain, assigns neither a
  Project ID, omits GPT_OS, and ranks tickets heuristically rather than using
  each Workbench's `next --json` result.
- Current deployment discovery returns `unavailable` with zero projects because
  it reads only an empty generated index section.
- Current Skills defaults point to retired `Foundry/Sockets/Forge` and
  `.claude/skills` paths. The actual shared custom-skill home is
  `/Users/kayden/.agents/skills` with one direct-child `SKILL.md` per skill.
- `servitor.local:5173` is live and iframe-compatible. Its source verification
  passes 140 tests and four safety checks. It remains a deterministic,
  non-executing Projection.
- The producer dependency tree is absent in the fresh worktree. The last clean
  installed-product suite reported 305 pass, six TODO, zero fail; the current
  production dependency audit reports one low and two high advisories.

## Decisions And Contracts

### One registry-backed portfolio read model

- Enrollment comes from the root's current source registry/topology contract,
  not direct directory discovery. GPT_OS is an explicit Factory scope and is
  not assigned an invented `P-###`.
- Each enrolled scope runs its own Workbench `doctor` and `next --json` through
  a bounded no-shell adapter. CIC does not reproduce selector logic.
- A scope that cannot be inspected remains present with `unavailable` or
  `partial` status and an exact finding.
- Source SHA, branch, upstream, dirtiness, observed time, Taskboard path, and
  selector result travel together. Filesystem mtime alone never proves Canon
  freshness.

### Master Taskboard is read-only

- Search spans scope name, stable/composite reference, spec/ticket text, owner,
  blocker, and next gate across the loaded portfolio.
- Project, status, owner, and freshness filters compose. The default is active
  work; completed history is optional.
- “Next” means the exact per-Workbench selector result. CIC does not invent a
  global execution order; Orchestration owns that future decision.
- v1.0.1 removes the ambient repository priority-write route from the operator
  surface. Personal SQLite tasks remain a secondary `Personal Tasks` shelf and
  never merge with repository work.

### Deployment provenance is explicit

- One entry separates producer checkout, remote, installed product, and runtime.
- Producer branch, SHA, upstream, ahead/behind, dirtiness, remote URL/default
  branch, and observation time are independent fields.
- Missing planned producer checkouts, stale installed products, and unverified
  runtime provenance remain visible. A Git read failure is never rendered
  “clean.”

### Foundry and Schematic boundary

- The primary label is **Foundry**; `Harness` remains only in historical proof.
- The live Schematic is embedded from `servitor.local:5173` and labeled
  **Canon Projection — not live Actuality** with a fallback link.
- The Operational Mirror beside it may show liveness, L0 activation, source
  revision, and freshness from current observed evidence.
- Live Job Order animation is unavailable in v1.0.1. It requires durable Job
  Order/Claim/Run events, the Grounding Journal, Gatehouse passage receipts,
  Announced Activation, a freshness-bearing socket, and independent Assay.

### Foundry-first every-tab information architecture

- Primary navigation: Command Deck, Awaiting You, Foundry Intelligence,
  Steward's Summary, Master Taskboard, Scheduling, Projects, Deployments,
  Foundry, Skills.
- Command Deck leads with next work, owner gates, deployment drift, and source
  freshness. Foundry Intelligence queries operational evidence; OpenBrain stays
  derived recall. Steward's Summary is an honest shift handover. Scheduling
  shows Foundry cadence or `unavailable`. Projects is the single-Workshop
  drill-down.
- Inbox, Finance, and Music leave primary navigation. No Foundry capability is
  fabricated to fill their place.

## Non-Goals

- Creating, editing, claiming, dispatching, merging, switching branches,
  deploying, or resolving project work from the Master Taskboard.
- A second canonical task/proof database or a generic repository executor.
- Live Job Order movement through the Schematic before its source contracts
  exist.
- Activating paused Slack/Discord work merely because those lanes are visible.
- Publishing secrets, runtime databases, full email content, or private feeds.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Restore a green producer dependency/security baseline and add failing contract tests for registry-backed enrollment, exact Workbench next evidence, GPT_OS inclusion, deployment provenance, current shared-skill discovery, retired ambient Taskboard writes, and v1.0.1 identity. | ready | none | `npm ci`; targeted red tests; production audit resolution or exact recorded exception; existing auth/privacy suite stays green. |
| TK-002 | Deliver one registry-backed portfolio API and Master Taskboard end to end: GPT_OS + enrolled scopes, exact per-Workbench `doctor`/`next`, portfolio search, project/status/owner/freshness filters, actionable detail, read-only boundary, desktop/mobile. | blocked | TK-001 | API/model/React/browser red-green plus live root/CIC/OpenBrain selector agreement. |
| TK-003 | Replace the empty deployment portfolio with producer/remote/installed/runtime provenance for every enrolled active remote, including exact current branches and visible missing/planned checkouts. | blocked | TK-002 | Git fixture/API/UI tests plus live branch/remote comparison. |
| TK-004 | Replace Harness with the Foundry view: embed the live Schematic, render the Projection/Mirror boundary and honest L0 state, provide fallback navigation, and state that live Job Order overlay is unavailable. | blocked | TK-002 | React/browser desktop/mobile proof and production Schematic load. |
| TK-005 | Repair Skills against `/Users/kayden/.agents/skills`: parse direct-child `SKILL.md` frontmatter, support search/filter, and show source branch/SHA/freshness/discovery availability without write actions. | blocked | TK-001 | Reader/API/model/UI/browser tests against fixtures and the shared checkout. |
| TK-006 | Rework every tab and navigation around Foundry operations, remove personal feeds from primary navigation, adopt Command Deck/Steward/Scheduling/Workshop language, update docs/lexicon, and report v1.0.1 in package and UI. | blocked | TK-002, TK-003, TK-004, TK-005 | Nav/React/browser accessibility and responsive proof; stale-name scan. |
| TK-007 | Run the full green gate, obtain independent immutable-SHA review, publish the producer checkpoint, install the exact reviewed build into the Module product, restart port 8787, and prove authenticated desktop/mobile production behavior and deployment provenance. | blocked | TK-006 | Node/browser/build/audit/doctor/secret/diff checks, review verdict, producer/install/runtime SHAs, HTTP/API/browser screenshots. |

## Acceptance Criteria

- [ ] Package, visible version, and production artifact report v1.0.1.
- [ ] Master Taskboard shows GPT_OS and every enrolled active scope without
      inventing a Project ID for GPT_OS.
- [ ] Portfolio search and project/status/owner/freshness filters find work by
      stable/composite reference, title, owner, blocker, and next gate.
- [ ] Every scope's next item matches its own deterministic Workbench selector,
      or displays an exact unavailable finding.
- [ ] Every active remote-backed scope appears in Deployments with observed
      branch, SHA, upstream, ahead/behind, dirtiness, remote, and freshness;
      producer/install/runtime are not conflated.
- [ ] Foundry replaces Harness in current UI and embeds the live Schematic as
      an explicitly non-operational Canon Projection.
- [ ] No live Job Order motion is fabricated; the unavailable future seam and
      its prerequisites are visible.
- [ ] Skills reads the shared custom-skill home, supports search/filter, and
      reports availability, source, freshness, and drift without writes.
- [ ] Every primary tab is Foundry-relevant, desktop/mobile readable, and
      honestly degraded when its source is absent. Inbox, Finance, and Music
      are absent from primary navigation.
- [ ] CIC remains a freshness-visible Mirror and preferred Entrance, not Canon,
      a second tracker, or ambient Actuality authority.
- [ ] The reviewed producer head, installed product head/artifact, LaunchAgent
      working directory, and owner-visible `servitor.local:8787` behavior are
      tied together by a release receipt.

## Testing Seams

- Hermetic registry and Workbench fixtures with passed, failed, missing, stale,
  dirty, and no-next states.
- Injected Git runner that proves failure is `unavailable`, never clean.
- Pure portfolio search/filter/view models and React SSR/browser fixtures.
- Schematic available/unavailable and mobile embed/fallback states.
- Direct-child skill fixture directories, malformed/missing frontmatter, and
  shared-home Git provenance.
- Existing auth, privacy, fixed-release, passphrase, and no-generic-executor
  suites remain regression gates.

## Documentation Impact

- `BLUEPRINT.md` owns the v1.0.1 product shape and data boundaries.
- `LEXICON.md` owns Master Taskboard, Portfolio read model, Foundry view,
  Schematic Projection, Operational Mirror, Personal Tasks, the Ward, and the
  Assay language.
- `README.md` and `RUNBOOK.md` own use, verification, installed-product release,
  recovery, and the under-one-minute production demo.
- S-022 and S-023 retain historical proof; this spec supersedes their forward
  Skills-path and Harness-tab implementation direction.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-08-18 | spec | Promoted Kayden's CIC v1.0.1 `/make-it-so` request into the owning project capability. Three independent read-only audits agreed on the current taskboard, deployments, skills, runtime, and Schematic gaps. | CIC and root doctors passed; live API/model checks reproduced missing GPT_OS, unnumbered producer projects, empty deployments, retired skill paths, stale v1.0.0 runtime, and healthy iframe-compatible Schematic. Root S-035/TK-003 launch preflights passed separately for the root and CIC writer branches. | This spec; Blueprint, Lexicon, Memory, and generated Taskboard promotion. | Push the plan, then implement TK-001 red/green. |

## Supersession

- Supersedes the forward implementation direction of S-022's retired skill
  catalog/deployment paths and S-023's current Harness-tab label; their completed
  fixture/privacy proof remains historical.
- Refines S-007, S-008, S-009, S-024, S-025, and S-026 without rewriting their
  completed evidence.
- Implements root S-004's deferred read-side status capability and root
  S-035/TK-003's CIC Mirror slice. Validated write-side control remains future.
