# S-021 - Discord Agent Handoff

> Generated from LLM Workbench v2.3.

**Spec ID:** S-021
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (command policy and private acceptance)
**Updated:** 2026-07-17
**Catalog description:** Let CIC issue bounded, structured agent SitRep and canonical-change handoffs through Discord while project controls remain authoritative.
**Blockers:** S-012 canonical lifecycle actions, S-020 Discord dispatcher/presentation proof, and Kayden's private Discord acceptance
**Latest event:** Kayden selected CIC as the sole command origin for phase one; Discord carries SitRep requests and canonical-change notices with acknowledgement/status replies only.
**Next gate:** After S-012 TK-003/TK-004 and S-020 TK-002/TK-003, implement the fixed outbound handoff envelope with synthetic fixtures.

## Outcome

Kayden can use CIC as the private operator dashboard to send a concise SitRep
request or canonical-change notice to an agent through Discord, then inspect
the linked agent acknowledgement/status without treating Discord as canonical
project state or a generic command runner.

## Why It Matters

Discord is Kayden's phone-facing communication surface. CIC should make a
project change visible to the relevant agent without duplicating the project
queue, bypassing the owning spec lifecycle, or giving a chat message arbitrary
machine authority.

## Current Verified State

- S-012 reads canonical projects and fails closed on direct Taskboard edits;
  its bounded priority and owner-decision lifecycle actions remain unimplemented.
- S-020 has no committed Discord dispatcher yet and uses only fixed outbound
  webhook destinations when implemented.
- The current repository has no agent-command envelope, Discord bot, inbound
  command handler, agent acknowledgement store, or Discord credentials.

## Desired Behavior

- CIC can issue only two phase-one outbound handoff classes:
  `sitrep_request` and `canonical_change_notice`.
- Every handoff carries an exact project and target identity when applicable,
  a stable request identity, issued/expiry timestamps, a sanitized summary,
  and links to CIC plus the owning canonical spec/Taskboard.
- A SitRep request asks for verified facts, material risks, a recommendation,
  and the next safe action. The agent's durable project control remains the
  source for any resulting work state.
- A canonical-change notice is emitted only after S-012 records the exact
  priority or owner-decision change through the owning lifecycle and renders
  the target Taskboard.
- Agent acknowledgement or status is a bounded response to the handoff and
  must link to canonical evidence when it claims a state change. Discord is not
  queried or treated as the source of that evidence.

## Decisions And Contracts

- CIC is the sole phase-one command origin. Discord carries delivery and
  acknowledgement/status communication; it does not originate commands.
- Phase one contains SitRep requests plus canonical-change notices and
  acknowledgement/status replies only. Ticket dispatch and wider agent actions
  remain out of scope.
- The command vocabulary is allowlisted, typed, and validated. No raw free-text
  Discord message, shell string, repository path, webhook URL, or arbitrary
  payload can become an executable command.
- An expired, duplicate, malformed, stale-target, unauthorized, or unavailable
  handoff is visibly rejected or suppressed and cannot trigger a retry loop.
- CIC, the owning spec, and the generated Taskboard remain the system record;
  Discord delivery or acknowledgement never proves that a project change or
  agent action occurred.
- Handoff payloads exclude credentials, passphrases, raw private source data,
  financial data, provider responses, and machine-local paths.

## Non-Goals

- General Discord bot commands, arbitrary text-to-agent execution, shell
  execution, generic job dispatch, or a Discord-resident task tracker.
- Allowing Discord to mutate priority, owner decisions, schedules, credentials,
  deployments, production state, or paid-service settings.
- Capturing Discord message history, creating a public server, or configuring
  real Discord credentials during synthetic proof.

## Dependencies And Blockers

- S-012 TK-003/TK-004 must first prove canonical priority and owner-decision
  changes through owning project lifecycle controls.
- S-020 TK-002/TK-003 must first prove bounded Discord delivery, presentation,
  and secret boundaries.
- Private live acceptance requires existing private Discord configuration and
  Kayden's explicit approval after fixture proof.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Typed outbound SitRep and canonical-change handoff envelope | blocked | S-012 TK-003/TK-004; S-020 TK-002/TK-003 | pending |

## Ticket Done Contracts

### TK-001 - Typed Outbound SitRep And Canonical-Change Handoff Envelope

Done when deterministic fixtures prove that CIC accepts only the two named
handoff classes, binds exact canonical identities, rejects invalid/expired/
duplicate targets, sanitizes payloads, and emits a bounded linked delivery
request through the S-020 dispatcher. Fixture proof sends no real Discord
request and performs no live project mutation.

## Acceptance Criteria

- [ ] CIC can issue only the two allowlisted phase-one handoff classes.
- [ ] Handoffs bind exact canonical project/spec/decision identities and links.
- [ ] Canonical-change notices are emitted only after S-012 returns a durable
      lifecycle result.
- [ ] Expired, duplicate, malformed, and unavailable handoffs fail closed.
- [ ] Desktop/mobile CIC proof makes command, delivery, acknowledgement, and
      canonical-evidence state distinct.
- [ ] No browser, log, storage, screenshot, or Discord payload contains a
      secret, passphrase, raw private content, or arbitrary command field.

## Testing Seams

- Synthetic canonical lifecycle result fixtures from S-012.
- Injected clock, request identity, notification dispatcher, and agent-status
  response fixtures.
- Contract tests for class allowlists, identity validation, expiry,
  deduplication, payload truncation, secret sentinels, and delivery failure.
- Desktop/mobile fixtures for requested, delivered, suppressed, acknowledged,
  unavailable, and rejected states.

## Verification Procedure

```bash
node --test test/agentHandoff*.test.js test/notification*.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- S-012 owns canonical project-change lifecycle semantics.
- S-020 owns Discord transport, delivery policy, and notification privacy.
- S-021 owns the typed agent-handoff contract and its limits.
- README, RUNBOOK, `.env.example`, and CONTRACT remain unchanged until the
  first implementation establishes an operator-facing configuration contract.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | planning | Created from Kayden's settled CIC-to-Discord agent-communication direction. | Conversation and current S-012/S-020 source contracts reviewed; no code, runtime, Discord, credential, project, or provider action occurred. | Created S-021; Blueprint and Taskboard require render. | S-012/S-020 dependencies and private acceptance remain open. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- A later, separately approved capability may add more fixed agent request
  classes only after phase-one proof and a new owner decision.

## Supersession

- Supersedes: none.
- Superseded by: none.
