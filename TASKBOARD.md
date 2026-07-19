# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Repair the canonical project-action contradiction, then close scheduled-writer, freshness, private operation, Intelligence, runtime identity, and connector-action proof gaps.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-17

This is an active execution projection, not a requirements store or proof archive.
Use `node tools/spec-workbench.mjs next --json` to select work.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (blocked) | Kayden (owner acceptance) | Owner Meshnet phone acceptance | Kayden selected authenticated private Meshnet for phone acceptance; the under-one-minute acceptance demo remains required. | Kayden opens the authenticated private CIC service from a phone over Meshnet and completes the under-one-minute acceptance demo. |
| [S-012](specs/S-012-canonical-project-interaction/SPEC.md) | TK-003: Apply one exact spec priority request through the owning lifecycle (ready) | CIC Engineer | TK-002 | TK-002 closed with proof. | Complete TK-003. |
| [S-013](specs/S-013-source-freshness-and-platform-health/SPEC.md) | TK-003: Uniform cached-versus-contacted freshness contract for every visible source (ready) | CIC Engineer; Kayden selects any new live adapter | none for TK-003; the Finance workflow owns Gmail/Drive reconciliation, so CIC's next non-Gmail adapter remains intentionally deferred | Kayden kept Finance out of CIC: Finance will own source reconciliation and reports, while CIC may later consume only its operational status. | After S-012/TK-002, claim TK-003 and normalize cached-versus-updated source truth. |
| [S-014](specs/S-014-private-authenticated-operation-and-privacy/SPEC.md) | TK-003: General authenticated desktop/mobile workflow and secret-boundary proof (ready) | CIC Engineer; Kayden (private-device acceptance) | TK-001, TK-002 | Kayden selected authenticated private Meshnet as the phone acceptance path; no public exposure is permitted. | After S-012/TK-002, claim TK-003 for authenticated desktop/mobile coverage across the full surface. |
| [S-015](specs/S-015-source-backed-intelligence/SPEC.md) | TK-003: Desktop/mobile provenance, privacy, and degraded-state browser proof (ready) | CIC Engineer; Kayden (live configured acceptance) | TK-001, TK-002 | Kayden approved one bounded live configured acceptance using existing private configuration only; no credential creation is authorized. | After S-012/TK-002, claim TK-003 for source/citation/privacy browser proof. |
| [S-016](specs/S-016-runtime-deployment-identity/SPEC.md) | TK-001: Sanitized immutable build/runtime identity seam (ready) | CIC Engineer; Kayden (private-service promotion) | none for TK-001; private-service promotion remains deferred until identity proof exists | Kayden chose to retain the current reviewed runtime `6284ecc` until runtime identity proof supports one exact promotion candidate. | After S-012/TK-002, claim TK-001 and add a sanitized build/runtime identity seam. |
| [S-017](specs/S-017-bounded-connector-actions/SPEC.md) | TK-003: Shared desktop/mobile action-state and secret-boundary proof (ready) | CIC Engineer; Kayden (live device/account acceptance) | TK-001, TK-002 | Kayden approved bounded Gmail and Spotify live acceptance using existing configured account/device state only; no credential creation or unreviewed account mutation is authorized. | After higher-priority canonical/freshness work, claim TK-003 for shared action-state and secret-boundary proof. |
| [S-018](specs/S-018-scheduled-prescient-assessment/SPEC.md) | TK-001: Testable startup and non-overlapping 24-hour schedule with explicit config states (ready) | CIC Engineer; Kayden (paid/config enablement and live acceptance) | no live scheduled writes; Kayden permits only bounded no-write API verification after engineering proof, with a hard $5 total cap | Kayden kept the scheduled writer disabled and authorized limited API-path verification only after scheduler, timeout, reconciliation, and observability proof; no live write is approved. | After higher-priority trust repairs, claim TK-001 and make startup/24-hour scheduling plus disabled-state evidence testable. |
| [S-019](specs/S-019-spotify-atlas-aggregate-consumption/SPEC.md) | TK-001: Versioned CIC aggregate contract validator and synthetic compatibility fixture (ready) | CIC Engineer; Spotify S-006 owns the producer contract; Kayden owns private configuration and live acceptance | none for TK-001 synthetic contract work; Spotify S-006 producer endpoint for TK-002; private live configuration is intentionally deferred | Kayden chose a clearly labeled fixture overview now, then a small live headline summary plus Atlas link-out after producer and consumer proof; no private Atlas read is approved yet. | After higher-priority trust repairs, claim TK-001 and lock the versioned synthetic producer/consumer contract. |
| [S-020](specs/S-020-discord-operations-notifications/SPEC.md) | TK-001: Fixed notification event, severity, policy, and server-only configuration contract (ready) | CIC Engineer; Kayden (Discord configuration, routing decision, and private live acceptance) | none for TK-001; GitHub uses direct delivery, while private Discord configuration remains required for CIC-originated alerts and live acceptance | Kayden selected direct GitHub-to-Discord delivery for GitHub-native events; CIC emits only CIC-owned operational alerts. | After higher-priority CIC trust repairs, claim TK-001 and establish the fixed notification event and policy contract. |
| [S-021](specs/S-021-discord-agent-handoff/SPEC.md) | TK-001: Typed outbound SitRep and canonical-change handoff envelope (blocked) | CIC Engineer; Kayden (command policy and private acceptance) | S-012 TK-003/TK-004; S-020 TK-002/TK-003 | Kayden selected CIC as the sole command origin for phase one; Discord carries SitRep requests and canonical-change notices with acknowledgement/status replies only. | After S-012 TK-003/TK-004 and S-020 TK-002/TK-003, implement the fixed outbound handoff envelope with synthetic fixtures. |
| [S-022](specs/S-022-captain-pass-visibility/SPEC.md) | TK-001: Validated read-only Captain schedule and registry adapter with the `/api/captain/daily-pass` route seam (ready) | CIC Engineer; Kayden (machine-local source enrollment and live acceptance) | none for TK-001; live acceptance requires a completed real Captain pass and Kayden's approval | Spec created from Kayden's settled request for pass visibility without querying an agent; verified schedule, registry, and machine-state sources recorded. | Claim TK-001 and establish the validated read-only schedule and registry adapter. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

No unresolved owner choice currently blocks an active CIC spec. The 2026-07-17
grilling checkpoint is recorded in S-005, S-013, S-014 through S-021. Remaining
owner actions are acceptance or implementation gates, not decisions: the private
Meshnet phone demo, existing-configuration acceptance after proof, and private
Discord acceptance after fixture proof.
