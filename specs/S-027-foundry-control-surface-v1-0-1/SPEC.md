# S-027 - Foundry Control Surface v1.0.1

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-027
**Status:** active
**Priority:** 0
**Owner:** Codex
**Updated:** 2026-08-18
**Catalog description:** Rebuild CIC v1.0.1 as the Foundry's honest operator surface: one registry-backed Master Taskboard, exact deployment branches, a Foundry/Schematic view, current skills, and a Foundry-first rework of every tab.
**Blockers:** none for TK-001; live Job Order animation remains a separate future capability blocked by the Grounding Journal, Gatehouse/Sandcastle receipts, and Announced Activation.
**Latest event:** TK-006 closed with proof.
**Next gate:** Complete TK-007.

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
| TK-001 | Restore a green producer dependency/security baseline and add failing contract tests for registry-backed enrollment, exact Workbench next evidence, GPT_OS inclusion, deployment provenance, current shared-skill discovery, retired ambient Taskboard writes, and v1.0.1 identity. | done | none | Red/green contracts added; 314 Node tests pass (308 pass, 6 explicit TODO), Vite v1.0.1 build passes, npm audit --omit=dev reports 0 vulnerabilities. |
| TK-002 | Deliver one registry-backed portfolio API and Master Taskboard end to end: GPT_OS + enrolled scopes, exact per-Workbench `doctor`/`next`, portfolio search, project/status/owner/freshness filters, actionable detail, read-only boundary, desktop/mobile. | done | TK-001 | Registry-backed /api/foundry-portfolio, exact doctor/next adapters, GPT_OS inclusion, 223 searchable live tickets, composed project/status/owner/freshness filters, and desktop/mobile browser contracts pass. |
| TK-003 | Replace the empty deployment portfolio with producer/remote/installed/runtime provenance for every enrolled active remote, including exact current branches and visible missing/planned checkouts. | done | TK-002 | Deployment ledger covers GPT_OS, Forge/LLM Workbench, CIC, Discord, Slack, OpenBrain, and Foundry; each row shows declared remote plus observed branch/SHA/upstream/ahead/behind/dirtiness or an exact unavailable finding. Git fixture and desktop/mobile browser tests pass. |
| TK-004 | Replace Harness with the Foundry view: embed the live Schematic, render the Projection/Mirror boundary and honest L0 state, provide fallback navigation, and state that live Job Order overlay is unavailable. | done | TK-002 | Foundry replaces Harness, embeds http://servitor.local:5173, exposes a full-screen fallback, labels the Schematic Projection boundary, and explicitly defers live Job Order motion. Desktop/mobile browser coverage and live :5173 HTTP 200 pass. |
| TK-005 | Repair Skills against `/Users/kayden/.agents/skills`: parse direct-child `SKILL.md` frontmatter, support search/filter, and show source branch/SHA/freshness/discovery availability without write actions. | done | TK-001 | Shared-home reader discovers 57 direct-child SKILL.md definitions with frontmatter descriptions and mtimes; reports the exact owning Git branch/SHA/upstream drift; supports search/filter UI; exposes no write route; and passes unit/SSR/API/browser coverage with honest unavailable states. |
| TK-006 | Rework every tab and navigation around Foundry operations, remove personal feeds from primary navigation, adopt Command Deck/Steward/Scheduling/Workshop language, update docs/lexicon, and report v1.0.1 in package and UI. | done | TK-002, TK-003, TK-004, TK-005 | Ten Foundry-first primary tabs render on desktop and iPhone without horizontal overflow; Inbox/Finance/Music leave primary navigation; package/build/footer report v1.0.1; 20 Playwright tests pass with 8 intentional desktop skips for the mobile-only release seam. |
| TK-007 | Run the full green gate, obtain independent immutable-SHA review, publish the producer checkpoint, install the exact reviewed build into the Module product, restart port 8787, and prove authenticated desktop/mobile production behavior and deployment provenance. | ready | none | Node/browser/build/audit/doctor/secret/diff checks, review verdict, producer/install/runtime SHAs, HTTP/API/browser screenshots. |

## Acceptance Criteria

- [ ] Package, visible version, and production artifact report v1.0.1.
- [x] Master Taskboard shows GPT_OS and every enrolled active scope without
      inventing a Project ID for GPT_OS.
- [x] Portfolio search and project/status/owner/freshness filters find work by
      stable/composite reference, title, owner, blocker, and next gate.
- [x] Every scope's next item matches its own deterministic Workbench selector,
      or displays an exact unavailable finding.
- [x] Every active remote-backed scope appears in Deployments with observed
      branch, SHA, upstream, ahead/behind, dirtiness, remote, and freshness;
      producer/install/runtime are not conflated.
- [x] Foundry replaces Harness in current UI and embeds the live Schematic as
      an explicitly non-operational Canon Projection.
- [x] No live Job Order motion is fabricated; the unavailable future seam and
      its prerequisites are visible.
- [x] Skills reads the shared custom-skill home, supports search/filter, and
      reports availability, source, freshness, and drift without writes.
- [x] Every primary tab is Foundry-relevant, desktop/mobile readable, and
      honestly degraded when its source is absent. Inbox, Finance, and Music
      are absent from primary navigation.
- [x] CIC remains a freshness-visible Mirror and preferred Entrance, not Canon,
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
| 2026-08-18 | TK-001 | Ticket closed | Red/green contracts added; 314 Node tests pass (308 pass, 6 explicit TODO), Vite v1.0.1 build passes, npm audit --omit=dev reports 0 vulnerabilities. | README, BLUEPRINT, RUNBOOK, LEXICON, package metadata, and S-027 updated. | TK-002 is next: close the registry-backed Master Taskboard slice. |
| 2026-08-18 | TK-002 | Ticket closed | Registry-backed /api/foundry-portfolio, exact doctor/next adapters, GPT_OS inclusion, 223 searchable live tickets, composed project/status/owner/freshness filters, and desktop/mobile browser contracts pass. | README operator check, Blueprint data plane, Runbook production check, and S-027 updated. | TK-003 is next: close deployment provenance and branch truth. |
| 2026-08-18 | TK-003 | Ticket closed | Deployment ledger covers GPT_OS, Forge/LLM Workbench, CIC, Discord, Slack, OpenBrain, and Foundry; each row shows declared remote plus observed branch/SHA/upstream/ahead/behind/dirtiness or an exact unavailable finding. Git fixture and desktop/mobile browser tests pass. | README, Blueprint, Runbook, and S-027 deployment contract updated. | TK-004 is next: close the live Foundry/Schematic view. |
| 2026-08-18 | TK-004 | Ticket closed | Foundry replaces Harness, embeds http://servitor.local:5173, exposes a full-screen fallback, labels the Schematic Projection boundary, and explicitly defers live Job Order motion. Desktop/mobile browser coverage and live :5173 HTTP 200 pass. | README, Blueprint, Runbook, Lexicon, and S-027 distinguish Projection from Actuality. | TK-005 is next: close shared skill-home discovery and UI. |
| 2026-08-18 | TK-005 | Ticket closed | Shared-home reader discovers 57 direct-child SKILL.md definitions from /Users/kayden/.agents/skills with frontmatter descriptions, mtimes, search/filter UI, no write route, unit/SSR/API/browser coverage, and an honest empty/unavailable state. | README configuration/operator check, Blueprint data plane, Runbook variable map, and S-027 updated. | TK-006 is next: close the every-tab Foundry navigation and v1.0.1 identity. |
| 2026-08-18 | TK-006 | Ticket closed | Ten Foundry-first primary tabs render on desktop and iPhone without horizontal overflow; Inbox/Finance/Music leave primary navigation; package/build/footer report v1.0.1; 20 Playwright tests pass with 8 intentional desktop skips for the mobile-only release seam. | README, Blueprint, Runbook, Lexicon, package metadata, tests, and S-027 updated. | TK-007 remains: independent immutable-SHA review, producer publication, installed-product release, restart, and production screenshots. |
| 2026-08-19 | TK-007 release remediation | Independent review rejected the first immutable candidate: deployment tests could false-match a release card, Forge displayed a containing workspace branch as its product branch, runtime proof was inferred, Skills lacked Git provenance, and Projects/Foundry lacked their required drilldown/Mirror evidence. Repaired each truth boundary without inventing live Job Order flow. | 315 Node tests: 309 pass, 6 explicit TODO; Vite build; npm production audit: 0 vulnerabilities; 22 Playwright pass and 8 intentional desktop skips; spec render/doctor; `git diff --check`. Live shared Skills source is `integration` at `7652919bde0ec750921ab312c30f31944961e66f`, two behind upstream, and now displays that drift. | S-027 proof and the portfolio/deployment/runtime/Skills/Projects/Foundry implementation and tests updated. | Commit and push a new immutable candidate, then obtain a fresh independent release verdict before producer publication or installed-product deployment. |
| 2026-08-19 | TK-007 production payload correction | The first reviewed deployment exposed only GPT_OS because runtime root discovery stopped at the legacy nested `Foundry/Projects/INDEX.md` instead of continuing to GPT_OS `Projects/INDEX.md`. Production payload inspection caught the failure before owner acceptance. Added the exact installed-path decoy regression and changed bounded discovery to select the outermost matching Master Producer Workspace. | Red: focused config suite returned the nested `Foundry` root. Green: 25/25 config tests and a direct installed-path probe return `/Users/kayden/GPT_OS`. | `server/config.js`, config regression, and this Grounding receipt. | Re-run the complete gate, obtain an independent focused review of a new immutable SHA, redeploy it, and prove the seven-scope authenticated production view. |

## Supersession

- Supersedes the forward implementation direction of S-022's retired skill
  catalog/deployment paths and S-023's current Harness-tab label; their completed
  fixture/privacy proof remains historical.
- Refines S-007, S-008, S-009, S-024, S-025, and S-026 without rewriting their
  completed evidence.
- Implements root S-004's deferred read-side status capability and root
  S-035/TK-003's CIC Mirror slice. Validated write-side control remains future.
