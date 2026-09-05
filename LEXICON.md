# Command Information Center - Lexicon

> Generated from LLM Workbench v3.1.1.

**Last reviewed:** 2026-09-04
**Status:** active

This is the canonical lookup table for terms whose meaning is shared across the
project. Read it when a request, spec, test, or skill uses project language that
could be ambiguous.

## Task Routing

The ordinary entry route is `AGENTS.md` -> `RUNBOOK.md` -> `LEXICON.md`.
Continue to the assigned `SPEC.md` resolved through `workbench/manifest.json`.
Use `BLUEPRINT.md` for architecture and cross-cutting direction; use the
manifest-declared Wiki `MEMORY.md` for task-relevant durable knowledge and the
ADR `REGISTER.md` for decision rationale. Read only the relevant linked owners.
`TASKBOARD.md` is a dashboard, not a prerequisite reading archive.

## Ownership Rules

- Add a term only after the parties agree on its meaning.
- Put project-wide definitions here; keep capability-specific terms in the
  owning spec until they become shared.
- Definitions belong here. Requirements and decisions remain in
  `BLUEPRINT.md` or the owning `SPEC.md`.
- Surface conflicts before changing an established definition.
- Link to detailed sources instead of copying them here.

## Workbench Terms

| Term | Definition | Distinction |
|---|---|---|
| **Design concept** | The shared understanding between the parties working on a project about what that project is. | It exists between participants. `BLUEPRINT.md` helps them reconstruct it but is not itself the design concept. |
| **Blueprint** | The compact project artifact that records product direction, principles, cross-cutting architecture, invariants, and non-goals. | It supports the design concept; it is not a PRD, work queue, glossary, or proof archive. |
| **Lexicon** | The canonical lookup table for definitions shared across the project. | It owns meanings, not requirements, implementation decisions, or work status. |
| **Spec** | A stable capability record containing scoped intent, requirements, decisions, implementation slices, acceptance, verification, evidence, and completion. | It combines the useful product and engineering roles often split between a PRD and technical spec. |
| **Ticket** | A temporary, one-context tracer-bullet slice inside a spec that produces independently verifiable progress. | It is execution structure, not durable capability history. |

## Stance Terms

| Term | Definition | Distinction |
|---|---|---|
| **Stance** | The method and obligations for performing one assigned task within already established authority. | It is neither an identity nor an authority grant; switching stance creates no handoff. |
| **Builder** | The stance that delivers a scoped, verified result and maintains its documentation. | Implementation includes relevant review and verification. |
| **Auditor** | The stance that checks claims against named evidence and reports a bounded verdict. | An audit does not authorize repairs or release. |
| **Reviewer** | The stance that challenges a candidate's correctness, impact and evidence. | At integration it runs in a separate context; it does not quietly repair the candidate. |
| **Reconciler** | The stance that reconciles achieved work with the state and owners needed for continuation. | It neither manufactures completion nor duplicates truth in a universal handoff. |
| **TASK** | The assigned ticket within a stable SPEC, carrying its normal stance assignment. | No additional task file or queue is introduced. |

## Governance Core

Design-concept routing: a question about what a product, subsystem, or
relationship *is* starts here, then follows the term to the owner-directed
articles in `workbench/wiki/design-concepts/`; the Blueprint and the assigned
spec still decide when a requirement or verified Actuality matters.

Shared by every Workbench. These rows describe roles and boundaries; the
binding behavior lives in `AGENTS.md`, cross-cutting architecture in
`BLUEPRINT.md`, and rationale in the project's `workbench/docs/adr/` collection.

| Term | Definition | Distinction |
|---|---|---|
| **Governance Plane** | The role one claim plays in one operation: **Intent** (the request), **Canon** (the binding current-state rule), **Grounding** (evidence about intended truth or whether work was done correctly), **Enduring Context** (durable reference consulted), **Actuality** (the target being changed, including files, source, runtime, and verified state), and **Projection** (a source-derived report). | Planes classify claims and their use, never whole files, directories, or artifact types. One assigned spec carries Canon, Projection, Grounding, and Enduring Context claims at once. |
| **Workbench Contract** | The logical set of current claims owned by the seven root controls plus the explicitly assigned spec. | It is not a file; no `CONTRACT.md` or other coequal root control exists. |
| **Instruction authority** | What an agent may do: the current owner request, then `AGENTS.md` with platform safety, then the explicitly assigned spec as a bounded capability delegate, then the procedural controls. | An assigned spec cannot enlarge the request, platform safety, or `AGENTS.md` scope; an unassigned spec is evidence. |
| **State resolution** | How a Canon claim and verified Actuality are reconciled: newer Canon is an implementation gap, newer verified Actuality is documentation drift, unclear ordering is an ambiguity to investigate. | Neither "code always wins" nor "Canon proves implementation"; the touched owner is repaired rather than a universal precedence applied. |
| **No-governance-tax rule** | Ordinary owner-directed project work requires only the Workbench Contract and its verification; no coordination system, order form, flight, or external mechanism is a prerequisite. | Available mechanisms a change genuinely needs still apply; the line is availability, not ceremony. |
| **Diagnostic** | A registered finding a Workbench tool emits with a stable code, a severity of `error` or `attention`, a scope, and a blocking effect of `all`, `selection`, `selected-slice`, or `none`. | The consuming command enforces the effect; no artifact chooses whether its own finding blocks. |
| **Support lane** | One of the six manifest-declared slots under lowercase `workbench/`: `docs`, `specs`, `wiki`, `sessions`, `feedback`, `tools`. | A lane is a structural slot, not a plane; the count coincides with the six planes by accident. |
| **Collection** | A manifest-declared, machine-used directory inside a lane: `docs/adr`, `wiki/design-concepts`, `wiki/guidebooks`, `wiki/archive`, `sessions/grilling`, `sessions/handoffs`, `sessions/checkpoints`. | Collections are flat and lowercase; a collection is never promoted to a lane because its contents differ in kind. |
| **ADR** | An architecture decision record in `workbench/docs/adr/`: title, decision, considered alternatives, consequences, provenance, and frontmatter naming the control that carries its rule. | An ADR owns rationale; the rule is binding only where `canonicalized_in` points. |
| **Checkpoint** | A privacy-checked, tracked copy of a live session record promoted into `sessions/checkpoints/`. | Live grilling and handoff records are untracked; an untracked path is not durable evidence. |
| **Design Concept article** | An owner-authorized, encyclopedic wiki article in `wiki/design-concepts/` explaining one durable cross-cutting design model, ending with `Evidence and Sources` and carrying `History`. | It documents a design concept; it is not the Blueprint, an ADR, a procedure, or task state, and agents suggest or repair it but do not create it. |
| **Wiki profile** | The manifest's declared wiki shape: `project` (one room's memory router and collections) or `deployment` (adds owner, machine, and project pointer collections). | A profile declares routing shape; it grants no authority and copies no live task state. |
| **Managed runtime tool** | A file in `workbench/tools/` installed from the Workbench release and listed in the tools receipt with its source release, commit, and hash. | It is updated only by explicit update with backup and rollback; an application's root `tools/` is application-owned. |

## Project Terms

| Term | Meaning |
|---|---|
| Command Information Center (CIC) | The Foundry's human-facing freshness-visible Mirror and preferred Entrance. It renders and routes; it does not become Canon or ambient authority over Actuality. |
| Master Taskboard | CIC's five-column Work-item Projection grouped by Spec with Tickets as child steps. It is queryable and freshness-visible, but canonical Workbench records remain authoritative. Movement creates Intent; it never directly mutates projected status. |
| Personal Tasks | Mutable secondary operator notes stored in CIC's local SQLite database. They never merge with repository work. Supersedes the primary-nav name Personal To-Dos. |
| Personal shelf | CIC's explicit secondary navigation for summarized personal feeds: Inbox, Finance, and Music. It is reachable on desktop and mobile, preserves the privacy and refresh boundaries of each source, and never affects Foundry work evidence. |
| Portfolio read model | The registry-backed derived envelope containing enrolled scopes, source revisions, Workbench selector results, findings, and freshness for CIC and Captain. |
| FUID (Foundry Unique Identifier) | Primary permanent uppercase base36 identity shown for a Project/Workshop, Spec, Ticket, or Intent request. CIC resolves and searches typed aliases but never infers type or parentage from a FUID. |
| Legacy alias | Existing typed reference such as `P-005`, `S-027`, or `TK-002`, displayed second and retained for links, search, CLI compatibility, and history. |
| Work-item Projection | Rebuildable SQLite materialization of canonical Projects/Workshops, Specs, and Tickets with source revision, capture time, FUID, alias, status, Created, and Last worked. It is not Canon and has no independent status mutation route. |
| Intent request | Separately stored validated request to change a work item. A pending overlay may be rendered, but only a Canon-backed Job Order and later projection refresh can change canonical status. |
| Created | Immutable canonical creation date projected from a Spec or Ticket. |
| Last worked | Latest substantive canonical lifecycle/content date; CIC refresh and polling do not advance it. |
| Foundry view | CIC's combined surface for the Schematic's Canon Projection and a separately freshness-stamped Operational Mirror. The older Harness tab is historical. |
| Schematic | The deterministic, non-executing visual blueprint of intended Canon embedded in the Foundry view; it is not live Actuality. |
| Operational Mirror | The observed liveness, activation, operational state, source revision, and freshness shown beside the Schematic without altering it. |
| OpenBrain | The separate derived recall and context infrastructure CIC consumes. It never outranks a newer canonical source. |
| the Ward | The Hall that checks cross-project fit and conformance. Supersedes the Personal Intelligence Platform name. |
| the Assay | The read-only Hall that judges quality and issues evidence-backed verdicts. Supersedes Audit Engine. |
| Degraded state | An honest, visible state showing a dependency is missing, stale, or failing. |
| Source freshness | The last durable attempt or success for a source, not the time CIC rendered a response. |
| Stable spec | A capability record owning requirements, decisions, acceptance, and append-only proof. |
| Project ID | The stable `P-###` operator reference owned by the canonical GPT_OS project registry. |
| Composite spec reference | A globally unambiguous `P-###/S-###` reference joining a Project ID to that repository's local stable spec ID. |
| Workbench release candidate | The fixed, read-only `KaydenClark/LLM_Workbench` `integration` to `main` PR and exact-SHA Auditor evidence that CIC revalidates before accepting intent. |
| Workbench release approval | A one-time, step-up-authenticated, fingerprint-bound Captain operation recorded in CIC; it is durable intent, not merge execution. |
| Workbench release handoff | The narrow credential-free path that atomically claims one recorded approval, revalidates its exact evidence, and hands the fixed request to Captain. CIC never owns a generic release executor. |
| Lighthouse | Planned read-only owner surface from S-029 that renders the declared two-way Heartbeat Socket: atomic L0-L3 load/worker/reasoning snapshots at exact 60/15/5/1-second cadence, sequence acknowledgement, observer health/freshness, and explicit live, quiet, stale, unavailable, source-mismatched, and unauthenticated states. One missed expected beat makes it dark/still while preserving last-received time. It never infers Actuality from PID, HTTP, a task feed, or Schematic animation. |
| Job Order Flight Rack | Planned read-only S-030 surface that renders real seven-stage Job Order observations plus blocked, repair, recovery-required, delivered-unclosed, and terminal state from the declared Gauge feed. It is not an executor or a Schematic simulation. |
| Heartbeat Socket | Gauge-owned FUID-primary `000M` contract consumed by Lighthouse. It is distinct from Activity Signal and has no K alias; K-002 remains messaging. Public CIC contains only its consumer mechanism and redacted fixtures. |
| `CONTRACT.md` (this repo) | The consumer-side document describing the OpenBrain-style backend surface CIC calls. It is a product integration reference, not a control and not the Workbench Contract defined in the Governance Core above. |
| FUID lifecycle schema | The eight-column Spec ticket table (`Ticket \| FUID \| Slice \| Status \| Blockers \| Created \| Last worked \| Proof`) that the Work-item Projection reads. CIC's own specs retired it at the v3.1.1 adoption to match the managed five-column selector contract, so this room reports as an `unavailable` projection source; enrolled scopes still carrying it project normally. |
