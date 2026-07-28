# S-022 - Skill Catalog Visibility

> Generated from LLM Workbench v2.3.

**Spec ID:** S-022
**Status:** active
**Priority:** 9
**Owner:** CIC Engineer; Kayden (catalog acceptance)
**Updated:** 2026-07-28
**Catalog description:** Show Kayden's agent skill catalog in the CIC dashboard read-only, with source, freshness, and canon-versus-deployed drift, so he never digs through GitHub or the filesystem to see what his agents can run.
**Blockers:** TK-002 and TK-003 are BLOCKED-STALE pending feature-branch reconciliation and source-contract revision.
**Latest event:** 2026-07-28: REVISE / BLOCKED-STALE. TK-002's full-catalog slice is on `feature/s022-tk002-full-skill-catalog` at `0aed45f`, while this checkout is `c1e2fd2`; reconcile before closure. TK-003 remains needed, and its source contract must move from Forge `skills/README.md` to `/Users/kayden/.agents/skills`.
**Next gate:** TK-002 — reconcile `feature/s022-tk002-full-skill-catalog` at `0aed45f` with checkout `c1e2fd2`; then revise TK-003 against `/Users/kayden/.agents/skills`. No catalog schema change is needed.

## Outcome

Kayden opens the CIC dashboard and sees the current agent skill catalog —
every skill's name, plain-language definition, rewrite lane, and availability —
plus whether the deployed runtime copy matches Factory canon, without visiting
GitHub or digging through the remote environment.

## Why It Matters

The skill library is how Kayden's agents actually behave, but today its state
is only visible by reading the canonical `/Users/kayden/.agents/skills`
directory or a deployed runtime copy. During skill redesign sessions the owner
cannot quickly answer "what skills exist, what do they do, and is the deployed
copy current?" CIC is the human-facing monitoring surface and should answer
that read-only, the same way it surfaces projects and Taskboards.

## Current Verified State

- The canonical skill catalog now lives at `/Users/kayden/.agents/skills/`.
  Each skill directory owns its canonical `SKILL.md` frontmatter; the former
  Forge `skills/README.md` selected-skills table is historical and is not the
  source contract for this capability.
- The deployed runtime copies live in `/Users/kayden/GPT_OS/.claude/skills/`
  and are synced by hand; they can drift from `/Users/kayden/.agents/skills`,
  and drift has already caused confusion in practice.
- CIC now has the TK-001 read-only Skills view, data source, and initial drift
  indicator; full-catalog reconciliation, the revised source contract, and
  richer fail-closed drift states remain open.

## Desired Behavior

- A read-only Skills view in the CIC dashboard lists every catalog entry with
  name, definition, rewrite lane, and availability, in catalog order.
- Each entry exposes provenance and freshness: which source file it came from,
  the commit or file mtime it reflects, and when CIC last read it.
- Each Active entry shows a canon-versus-deployed indicator: in sync, drifted
  (content differs), missing from deployment, or deployed-only.
- Unreadable or missing sources fail closed with a visible stale/unavailable
  state; CIC never renders a silently empty or fabricated catalog.
- The view works on desktop and mobile CIC.

## Decisions And Contracts

- The `/Users/kayden/.agents/skills/` directory and each skill's `SKILL.md`
  frontmatter are the only canonical skill truth for this capability; CIC
  stores at most a regenerable cache and never becomes a second skill store.
- CIC displays and never edits: no create, rename, enable, disable, or sync
  actions on skills from the dashboard in this spec.
- Source and freshness are always visible, matching the workspace rule that
  CIC never outranks a newer verified project file.

## Non-Goals

- Editing, syncing, or deploying skills from CIC.
- A live "what is each agent doing right now" feed (owned by Taskboard and
  portfolio views, not the skill catalog).
- Indexing skill bodies for search, or rendering full SKILL.md contents beyond
  name, definition, lane, availability, and drift.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Tracer bullet: one skill row end to end — catalog+deployed reader → Express route → React model → Skills view (desktop+mobile) → in-sync drift/freshness badge | done | none | GET /api/skills route + src/skillCatalogModel.js + src/skills.jsx Skills view (NAV item, desktop+mobile); test/skillsRoute.test.js, test/skillCatalogModel.test.js, test/skillsReact.test.js, test/browser/skills.spec.js all pass — see Evidence below |
| TK-002 | Widen coverage: parse and render every catalog entry in catalog order with per-entry name, definition, lane, availability, provenance, and freshness | blocked | BLOCKED-STALE: reconcile `feature/s022-tk002-full-skill-catalog` at `0aed45f` with current checkout `c1e2fd2` before closure; no catalog schema change is needed | REVISE — the full-catalog slice exists on the feature branch, but this checkout is older; reconcile the branch and retain its acceptance evidence before closure. |
| TK-003 | Richer drift and fail-closed states: classify drifted / missing / deployed-only and render fail-closed stale/unavailable states, with fixtures and desktop+mobile proof per state | blocked | TK-002; BLOCKED-STALE: update the source contract from Forge `skills/README.md` to `/Users/kayden/.agents/skills` | REVISE — catalog visibility remains needed; retain the TK-002 dependency and implement against the canonical skills directory, with no catalog schema change. |

## Ticket Done Contracts

### TK-001 - Tracer Bullet: One Skill Row End To End

Done when a single catalog entry flows through the entire stack: a CIC server
reader parses one skill's canonical catalog-table row plus its deployed
`.claude/skills/` frontmatter into one typed payload entry with provenance,
freshness, and an in-sync canon-versus-deployed status; an Express GET route
serves that payload; and the React Skills view renders that one entry (name,
definition, rewrite lane, availability) with its freshness and in-sync drift
badge on desktop and mobile. A deterministic fixture proves the in-sync happy
path end to end, and no write path to any skill file exists. This bullet proves
the reader -> route -> model -> view -> badge architecture connects before the
catalog is widened.

### TK-002 - Widen Coverage To The Full Catalog

Done when the reader, route, and Skills view handle the full canonical catalog
rooted at `/Users/kayden/.agents/skills/`, deriving each entry from its skill
directory and `SKILL.md` frontmatter in a deterministic source-defined order —
each with name, definition, rewrite lane, availability, per-entry provenance,
and freshness — and deterministic fixtures prove full-catalog ordering. Builds
on the TK-001 tracer without changing its route or payload contract; no catalog
schema change is needed.

### TK-003 - Richer Drift And Fail-Closed States

Done when each Active entry is classified across the full canon-versus-deployed
taxonomy (in sync, drifted, missing from deployment, deployed-only) with visible
per-entry badges, and unreadable, missing, malformed, or marker-less sources
fail closed with a visible stale/unavailable state instead of a silently empty
or fabricated catalog; deterministic fixtures cover each drift and failure case,
and desktop plus mobile proof artifacts for the drift and fail-closed states are
recorded in this spec's evidence.

## Acceptance Criteria

- [ ] The Skills view lists every catalog entry with name, definition, lane,
      and availability in catalog order.
- [ ] Every entry shows its source and freshness; nothing renders as fresher
      than its source.
- [ ] Canon-versus-deployed drift is classified and visibly badged per Active
      skill.
- [ ] Unreadable or missing sources fail closed with a visible state, never a
      silently empty catalog.
- [ ] CIC exposes no skill write, sync, or deploy action.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Fixture copies of the catalog README table and skill frontmatter, including
  malformed rows, missing markers, and frontmatter-less files.
- Injected filesystem reader for drift cases: identical, differing, missing,
  and deployed-only skill folders.
- Contract tests for fail-closed states and the absence of write endpoints.

## Verification Procedure

1. Run the CIC test suite including the new catalog-source contract tests.
2. Load the dashboard against fixtures for each drift and failure state.
3. Record desktop and mobile screenshots in this spec's evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
| 2026-07-28 | TK-002/TK-003 | Audit disposition: REVISE / BLOCKED-STALE. The projection showed TK-002 ready and TK-003 blocked on TK-002; actuality is that the full-catalog slice exists on `feature/s022-tk002-full-skill-catalog` at `0aed45f`, while the canonical checkout remains `c1e2fd2`, so TK-002 must be reconciled before closure. Catalog visibility remains needed for TK-003, but the canonical source moved from Forge `skills/README.md` to `/Users/kayden/.agents/skills`; the TK-002 dependency remains. No catalog schema change is needed. | Need: reconcile the existing TK-002 slice, then revise TK-003 against the canonical skills directory. Launch: NO — exact TK-002 command `node /Users/kayden/GPT_OS/tools/preflight.mjs --root '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --repo '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --spec S-022 --ticket TK-002 --json` exited 1 with `spec-branch-activity-fresher` and `protected-config-unreadable`; exact TK-003 command with `--ticket TK-003` exited 1 with the TK-002 dependency, Next Gate mismatch, fresher branch activity, and protected-config failure. Confidence: high on branch/source drift; missing evidence: reconciled current-head acceptance proof and TK-003 drift/fail-closed desktop/mobile proof. Sources: canonical checkout `/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center` HEAD `c1e2fd2`; feature branch `feature/s022-tk002-full-skill-catalog` at `0aed45f`; canonical source `/Users/kayden/.agents/skills/`. |
| 2026-07-28 | TK-002 audit | Projection versus actuality: projection was `ready`; actuality is REVISE / BLOCKED-STALE because the completed-looking slice is on feature branch `feature/s022-tk002-full-skill-catalog` at `0aed45f`, not the canonical checkout at `c1e2fd2`. Exact preflight: `node /Users/kayden/GPT_OS/tools/preflight.mjs --root '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --repo '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --spec S-022 --ticket TK-002 --json`; exit 1: `spec-branch-activity-fresher` and `protected-config-unreadable`. Need=REVISE; Launch=NO. Confidence=high. Missing evidence: reconciled current-head acceptance proof and independent verification of the recorded 33-entry demo. |
| 2026-07-28 | TK-003 audit | Projection versus actuality: projection was `blocked` by TK-002; actuality is REVISE / BLOCKED-STALE because catalog visibility remains needed but its Forge `skills/README.md` source premise is stale and must move to `/Users/kayden/.agents/skills`. Exact preflight: `node /Users/kayden/GPT_OS/tools/preflight.mjs --root '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --repo '/Users/kayden/GPT_OS/Foundry/Modules/Command Information Center' --spec S-022 --ticket TK-003 --json`; exit 1: TK-002 dependency, Next Gate mismatch, fresher branch activity, and `protected-config-unreadable`. Need=REVISE; Launch=NO. Confidence=medium. Missing evidence: approved shared-home catalog comparison contract and richer drift/fail-closed proof. |
| 2026-07-20 | S-022 | Verticality re-cut of open work: replaced the horizontal TK-001 (backend catalog source) / TK-002 (frontend Skills view) split with dependency-ordered tracer-bullet slices — TK-001 pierces reader -> Express route -> React model -> Skills view (desktop+mobile) -> in-sync drift/freshness badge for one skill row, TK-002 widens to every catalog entry in order, TK-003 adds the richer drift taxonomy and fail-closed states with per-state proof. Rationale: the horizontal split deferred all integration and every user-visible result to the final ticket and hid stack-connection risk until the end; the tracer proves the whole stack end to end for one row first, then widens. Prior rows and evidence preserved; no skill feature code implemented in this re-cut. spec-workbench render + doctor rerun after the edit. | plan re-cut only |
| 2026-07-21 | TK-001 | Wired the tracer bullet through the whole stack: `server/config.js` adds `skillCatalogPath`/`skillDeployedRoot` (discovered-GPT_OS-root-aware, env-overridable via `CIC_SKILL_CATALOG_PATH`/`CIC_SKILL_DEPLOYED_ROOT`, mirroring the existing `harnessReportPath` pattern); `server/app.js` adds `GET /api/skills` calling the already-merged `buildSkillCatalog` reader; `src/skillCatalogModel.js` is a new pure view-model (status/drift/freshness presentation, fails closed with no payload); `src/skills.jsx` adds `SkillsContent`/`SkillsView` rendering name, definition, lane, availability, freshness, and an in-sync canon-vs-deployed badge; wired into `src/main.jsx` NAV_ITEMS ("Skills", Blocks icon, lavender tone) and `src/styles.css` (`.skill-*` block mirroring the Harness Flow badge system, with an 820px mobile collapse). No skill write/sync/deploy route exists. | pass — `node --test test/config.test.js` 24/24; `node --test test/skillsRoute.test.js` 3/3 (happy path against real fixture dirs, fail-closed unavailable, no write verbs routable); `node --test test/skillCatalogModel.test.js` 4/4 (in-sync entry, all 5 drift classes, fail-closed, no-payload); `node --test test/skillsReact.test.js` 3/3 via Vite SSR (in-sync happy path, visible unavailable state, fetch-error banner); `test/nav.test.js` updated and passing for the new "Skills" label; full `npm test` 311 tests / 305 pass / 6 pre-existing todo / 0 fail; `npm run test:browser` 26 pass / 8 expected skip (baseline 22 pass + 4 new `test/browser/skills.spec.js` assertions across the desktop and iPhone 13 Playwright projects: exact field text end-to-end, viewport-bounded panel on both layouts, fail-closed empty state never silently blank); `npm run build` clean Vite production build; `npm audit --omit=dev` shows one pre-existing low-severity `body-parser` advisory unrelated to this change (no dependency manifest touched); `node tools/spec-workbench.mjs doctor` clean after render. TK-002's blocker is cleared in the table above since its only dependency (TK-001) is now done; TK-002 itself is not implemented by this row. Remaining gap: TK-002 (widen to full catalog) and TK-003 (drift taxonomy + fail-closed states + desktop/mobile proof) stay open. |
