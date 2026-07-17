# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Repair the canonical project-action contradiction, then make freshness, private operation, Intelligence, runtime identity, and connector actions fully provable.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-17

This is an active execution projection, not a requirements store or proof archive.
Use `node tools/spec-workbench.mjs next --json` to select work.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (blocked) | Kayden (owner acceptance) | Owner Meshnet phone acceptance | Live launchd/process/Git verification shows the private service running clean detached reviewed SHA `6284ecc`; prior `79e04de` metadata was stale. | Kayden opens the authenticated private CIC service from a phone over Meshnet and completes the under-one-minute acceptance demo. |
| [S-012](specs/S-012-canonical-project-interaction/SPEC.md) | TK-002: Fail closed on direct priority writes to adopted generated Taskboards (ready) | CIC Engineer | TK-001 | Canon harvest found that adopted-project reads are canonical but the legacy priority route still rewrites generated Taskboard rows. | Claim TK-002 and make adopted-project direct Taskboard priority writes fail closed. |
| [S-013](specs/S-013-source-freshness-and-platform-health/SPEC.md) | TK-003: Uniform cached-versus-contacted freshness contract for every visible source (ready) | CIC Engineer; Kayden selects any new live adapter | none for TK-003; owner source and credential choice for TK-004 | Canon harvest separated shipped Gmail and platform-health proof from the unresolved portfolio-wide freshness contract. | After S-012/TK-002, claim TK-003 and normalize cached-versus-updated source truth. |
| [S-014](specs/S-014-private-authenticated-operation-and-privacy/SPEC.md) | TK-003: General authenticated desktop/mobile workflow and secret-boundary proof (ready) | CIC Engineer; Kayden (private-device acceptance) | TK-001, TK-002 | Canon harvest separated the general private mobile/privacy capability from S-005's Workbench-specific phone gate. | After S-012/TK-002, claim TK-003 for authenticated desktop/mobile coverage across the full surface. |
| [S-015](specs/S-015-source-backed-intelligence/SPEC.md) | TK-003: Desktop/mobile provenance, privacy, and degraded-state browser proof (ready) | CIC Engineer; Kayden (live configured acceptance) | TK-001, TK-002 | Canon harvest found implemented Intelligence APIs and UI without a cohesive durable capability owner or full browser proof. | After S-012/TK-002, claim TK-003 for source/citation/privacy browser proof. |
| [S-016](specs/S-016-runtime-deployment-identity/SPEC.md) | TK-001: Sanitized immutable build/runtime identity seam (ready) | CIC Engineer; Kayden (private-service promotion) | none for TK-001; owner approval for private-service promotion | Live verification corrected the recorded runtime from stale `79e04de` to detached reviewed SHA `6284ecc`. | After S-012/TK-002, claim TK-001 and add a sanitized build/runtime identity seam. |
| [S-017](specs/S-017-bounded-connector-actions/SPEC.md) | TK-003: Shared desktop/mobile action-state and secret-boundary proof (ready) | CIC Engineer; Kayden (live device/account acceptance) | TK-001, TK-002 | Canon harvest created one action-safety owner for Gmail refresh and Spotify playback while preserving Workbench release in S-004 through S-006. | After higher-priority canonical/freshness work, claim TK-003 for shared action-state and secret-boundary proof. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| S-005 / S-014 | Accept the authenticated private phone workflow | Meshnet or trusted private LAN; no public exposure | Reuse one under-one-minute phone session to cover the general surface and Workbench card | Owner device/time only; no engineering blocker before the acceptance tickets | Kayden | Complete S-005 TK-002 and S-014 TK-004 |
| S-013 | Select the first non-Gmail executable update adapter | Calendar, GitHub, Vercel, Drive, finance, music, or defer | Defer until one source has a clear value and credential/privacy contract | Selected adapter creates credential, privacy, and maintenance cost | Kayden | Unblock S-013 TK-004 |
| S-015 | Approve live configured Intelligence acceptance | Existing private OpenBrain/OpenAI configuration or deterministic-only acceptance | Use existing approved private configuration; do not create credentials for proof | May incur model cost and expose private retrieval context to the approved provider | Kayden | Unblock S-015 TK-004 |
| S-016 | Approve an exact reviewed SHA for private-service promotion | Keep current `6284ecc` or promote a later reviewed Integration SHA | Keep current runtime until S-016 identity/proof is implemented, then approve one exact candidate | Restart affects the private service; Integration-to-main remains separately owner-only | Kayden | Unblock S-016 TK-004 |
| S-017 | Approve live Gmail/Spotify action acceptance | Use existing configured account/device state or retain mocked proof | Use existing state only when convenient; do not create credentials for acceptance | Owner account/device availability; possible external API usage | Kayden | Unblock S-017 TK-004 |
