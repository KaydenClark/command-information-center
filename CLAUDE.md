# Command Information Center - Claude Instructions

> Generated from LLM Workbench v3.1.1.

@AGENTS.md

Load `AGENTS.md` as the shared source of truth. Keep project behavior, scope,
branch rules, and verification requirements there so Claude, Codex, ChatGPT,
and future agents use one contract.

Ordinary entry is `AGENTS.md` -> `RUNBOOK.md` -> `LEXICON.md`, then the assigned
`workbench/specs/S-###-slug/SPEC.md`. `TASKBOARD.md` is a generated projection;
do not recreate a combined roadmap or gameplan beside it.

For normal work, branch from `Integration` and open the pull request back into
`Integration`; only the owner promotes `Integration` to `main`.
