---
type: memory
status: active
sensitivity: normal
knowledge_role: canonical
provenance:
  - Adoption of this room onto LLM Workbench v3.1.1
source_paths:
  - workbench/wiki
last_verified: 2026-09-04
---

# Command Information Center Memory

> Generated from LLM Workbench v3.1.1. This is the room brain: the canonical,
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
| [BLUEPRINT.md](../../BLUEPRINT.md) | Product map, architecture, and the spec catalog |
| [LEXICON.md](../../LEXICON.md) | Shared terms, the Governance Core, and design-concept routing |
| [TASKBOARD.md](../../TASKBOARD.md) | Current execution state |
| `workbench/specs/` | Stable capability records, acceptance, evidence, and proof |
| [RUNBOOK.md](../../RUNBOOK.md) | Exact operating and verification commands |
| [SCHEMA.md](SCHEMA.md) | Wiki CRUD, metadata, sensitivity, and freshness rules |
| [design-concepts/](design-concepts/README.md) | Owner-directed articles explaining durable design models |
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

## Up-Link

Deployment wiki note: `Wiki/Projects/Command Information Center` in the GPT_OS
deployment wiki keeps a pointer note for this room that links here; keep the
pair resolvable in both directions.
