# S-022 - Skill Catalog Visibility

> Generated from LLM Workbench v2.3.

**Spec ID:** S-022
**Status:** active
**Priority:** 3
**Owner:** CIC Engineer; Kayden (catalog acceptance)
**Updated:** 2026-07-21
**Catalog description:** Show Kayden's agent skill catalog in the CIC dashboard read-only, with source, freshness, and canon-versus-deployed drift, so he never digs through GitHub or the filesystem to see what his agents can run.
**Blockers:** none
**Latest event:** 2026-07-21: TK-001 tracer bullet closed — one skill row flows end to end through server/skillCatalog.js (merged prior slice) → new GET /api/skills route → src/skillCatalogModel.js → src/skills.jsx Skills view, with an in-sync drift/freshness badge on desktop and mobile.
**Next gate:** TK-002 — widen coverage to every catalog entry in order.

## Outcome

Kayden opens the CIC dashboard and sees the current agent skill catalog —
every skill's name, plain-language definition, rewrite lane, and availability —
plus whether the deployed runtime copy matches Factory canon, without visiting
GitHub or digging through the remote environment.

## Why It Matters

The skill library is how Kayden's agents actually behave, but today its state
is only visible by opening the Workbench Factory repository on GitHub or
reading `.claude/skills/` on the Mac Mini. During skill redesign sessions the
owner cannot quickly answer "what skills exist, what do they do, and is the
deployed copy current?" CIC is the human-facing monitoring surface and should
answer that read-only, the same way it surfaces projects and Taskboards.

## Current Verified State

- The canonical skill catalog lives in the Workbench Factory repository at
  `skills/README.md` (owner-selected table between the
  `<!-- selected-skills:start -->` and `<!-- selected-skills:end -->` markers)
  with one folder per Active skill under `skills/` and pending rewrites under
  `skills-pending/`.
- The deployed runtime copies live in `/Users/kayden/GPT_OS/.claude/skills/`
  and are synced by hand; they can drift from Factory canon, and drift has
  already caused confusion in practice.
- CIC has no skills view, no skill data source, and no drift indicator.

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

- The Workbench Factory `skills/README.md` catalog table and `skills/`
  frontmatter remain the only canonical skill truth; CIC stores at most a
  regenerable cache and never becomes a second skill store.
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
| TK-002 | Widen coverage: parse and render every catalog entry in catalog order with per-entry name, definition, lane, availability, provenance, and freshness | ready | none | pending |
| TK-003 | Richer drift and fail-closed states: classify drifted / missing / deployed-only and render fail-closed stale/unavailable states, with fixtures and desktop+mobile proof per state | blocked | TK-002 | pending |

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

Done when the reader, route, and Skills view handle every entry between the
`<!-- selected-skills:start -->` / `<!-- selected-skills:end -->` markers in
catalog order — each with name, definition, rewrite lane, availability,
per-entry provenance, and freshness — and deterministic fixtures prove
full-table parsing including multi-row ordering. Builds on the TK-001 tracer
without changing its route or payload contract.

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
| 2026-07-20 | S-022 | Verticality re-cut of open work: replaced the horizontal TK-001 (backend catalog source) / TK-002 (frontend Skills view) split with dependency-ordered tracer-bullet slices — TK-001 pierces reader -> Express route -> React model -> Skills view (desktop+mobile) -> in-sync drift/freshness badge for one skill row, TK-002 widens to every catalog entry in order, TK-003 adds the richer drift taxonomy and fail-closed states with per-state proof. Rationale: the horizontal split deferred all integration and every user-visible result to the final ticket and hid stack-connection risk until the end; the tracer proves the whole stack end to end for one row first, then widens. Prior rows and evidence preserved; no skill feature code implemented in this re-cut. spec-workbench render + doctor rerun after the edit. | plan re-cut only |
| 2026-07-21 | TK-001 | Wired the tracer bullet through the whole stack: `server/config.js` adds `skillCatalogPath`/`skillDeployedRoot` (discovered-GPT_OS-root-aware, env-overridable via `CIC_SKILL_CATALOG_PATH`/`CIC_SKILL_DEPLOYED_ROOT`, mirroring the existing `harnessReportPath` pattern); `server/app.js` adds `GET /api/skills` calling the already-merged `buildSkillCatalog` reader; `src/skillCatalogModel.js` is a new pure view-model (status/drift/freshness presentation, fails closed with no payload); `src/skills.jsx` adds `SkillsContent`/`SkillsView` rendering name, definition, lane, availability, freshness, and an in-sync canon-vs-deployed badge; wired into `src/main.jsx` NAV_ITEMS ("Skills", Blocks icon, lavender tone) and `src/styles.css` (`.skill-*` block mirroring the Harness Flow badge system, with an 820px mobile collapse). No skill write/sync/deploy route exists. | pass — `node --test test/config.test.js` 24/24; `node --test test/skillsRoute.test.js` 3/3 (happy path against real fixture dirs, fail-closed unavailable, no write verbs routable); `node --test test/skillCatalogModel.test.js` 4/4 (in-sync entry, all 5 drift classes, fail-closed, no-payload); `node --test test/skillsReact.test.js` 3/3 via Vite SSR (in-sync happy path, visible unavailable state, fetch-error banner); `test/nav.test.js` updated and passing for the new "Skills" label; full `npm test` 311 tests / 305 pass / 6 pre-existing todo / 0 fail; `npm run test:browser` 26 pass / 8 expected skip (baseline 22 pass + 4 new `test/browser/skills.spec.js` assertions across the desktop and iPhone 13 Playwright projects: exact field text end-to-end, viewport-bounded panel on both layouts, fail-closed empty state never silently blank); `npm run build` clean Vite production build; `npm audit --omit=dev` shows one pre-existing low-severity `body-parser` advisory unrelated to this change (no dependency manifest touched); `node tools/spec-workbench.mjs doctor` clean after render. TK-002's blocker is cleared in the table above since its only dependency (TK-001) is now done; TK-002 itself is not implemented by this row. Remaining gap: TK-002 (widen to full catalog) and TK-003 (drift taxonomy + fail-closed states + desktop/mobile proof) stay open. |
