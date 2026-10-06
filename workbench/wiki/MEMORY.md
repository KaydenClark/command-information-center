---
type: memory
status: active
sensitivity: normal
knowledge_role: canonical
provenance:
  - Adoption of this room onto LLM Workbench v3.1.1
  - Update of this room onto LLM Workbench v3.2.1
source_paths:
  - workbench/wiki
last_verified: 2026-10-06
---

# Command Information Center Memory

> Generated from LLM Workbench v3.2.1. This is the room brain: the canonical,
> human-editable memory router for this project, kept at
> `workbench/wiki/MEMORY.md`. Start here and follow the smallest relevant
> link instead of browsing folders or searching.

This router holds durable room memory only: context, decision-history
pointers, and routing. It never duplicates live task state; it routes to it.

## Source Precedence

1. Verified runtime and this room's live controls: `AGENTS.md`, `BLUEPRINT.md`,
   the assigned stable spec, `TASKBOARD.md`, and `RUNBOOK.md`.
2. Maintained notes routed from this file.
3. `archive/` and generated material.

When sources disagree, verify the higher-authority source and repair the stale
note (`AGENTS.md` -> State Resolution). The wiki is a map, not a Governance
Plane: it routes to Canon, Grounding, and verified Actuality and authorizes
nothing.

## Leaving The Wiki

| Go to | For |
|---|---|
| [AGENTS.md](../../AGENTS.md) | Authority, scope, safety, and the work loop |
| [BLUEPRINT.md](../../BLUEPRINT.md) | What the product is, who it serves, the outcomes it promises and what it is not (still the stale eight-section page until S-000B, CIC Blueprint Teardown, replaces it with the four-part short page) |
| [LEXICON.md](../../LEXICON.md) | Shared terms, the Governance Core, and design-concept routing |
| [TASKBOARD.md](../../TASKBOARD.md) | Current execution state |
| `workbench/specs/` | Stable capability records, acceptance, evidence, and proof |
| [RUNBOOK.md](../../RUNBOOK.md) | Exact operating and verification commands |
| [SCHEMA.md](SCHEMA.md) | Wiki CRUD, metadata, sensitivity, and freshness rules |
| [design-concepts/](design-concepts/README.md) | Articles explaining durable design models and each landmark's evolving synthesis |
| [features/](features/README.md) | Readable articles capturing each completed Spec's delivered capability |
| [guidebooks/](guidebooks/) | Ordered procedures that outgrew the Runbook |

## Project References

| Go to | For |
|---|---|
| [CONTRACT.md](../../CONTRACT.md) | The consumer-side OpenBrain backend contract CIC calls. This is a product integration document, not a Workbench control. |
| [SPEC_DIARY.md](../../SPEC_DIARY.md) | Raw, untriaged UI/UX walkthrough observations awaiting promotion into a spec |
| [README.md](../../README.md) | Human-facing setup, demo mode, and navigation |

## Routing

| Question | Read first |
|---|---|

Add a row only when a durable note exists to route to. A young room may have an
empty table; that is fine. Grow flat notes beside this router and inside the
declared collections; only `archive/` may nest.

## Landmark Synthesis Pages

These are candidate groupings from the Owner-authorized main exploration,
not confirmed landmark assignments. Their linked decision records preserve
confirmed answers; the pages distinguish those answers from open questions.

- [Operational Picture](design-concepts/landmark-operational-picture.md) - candidate grouping for the cross-project homepage, source visibility and destination progress.
- [Owner Direction](design-concepts/landmark-owner-direction.md) - candidate grouping for attention, Priority and Value, decisions and commands.
- [Personal and Project Work](design-concepts/landmark-personal-and-project-work.md) - candidate grouping for personal life in the central picture and familiar taskboards.

Every page this router links carries a one-line summary beside its link, so a
reader can choose a page without opening it. In a list, write
`- [Schema](SCHEMA.md) - what the page is for`; in a table, give the
link's row a second cell that says what the page is for. `wiki.mjs validate`
reports a routed page without one as attention, never as a failure.

## Up-Link

Deployment wiki note: `Wiki/Projects/Command Information Center` in the GPT_OS
deployment wiki keeps a pointer note for this room that links here; keep the
pair resolvable in both directions.
