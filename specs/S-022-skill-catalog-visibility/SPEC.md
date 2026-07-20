# S-022 - Skill Catalog Visibility

> Generated from LLM Workbench v2.3.

**Spec ID:** S-022
**Status:** active
**Priority:** 3
**Owner:** GPT-5.3 Codex Spark / Chain Engineer
**Updated:** 2026-07-20
**Catalog description:** Show Kayden's agent skill catalog in the CIC dashboard read-only, with source, freshness, and canon-versus-deployed drift, so he never digs through GitHub or the filesystem to see what his agents can run.
**Blockers:** none
**Latest event:** TK-001 claimed by GPT-5.3 Codex Spark / Chain Engineer.
**Next gate:** Close TK-001 with verification and documentation proof.

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
| TK-001 | Read-only skill catalog source with provenance and drift detection | in-progress | none | pending |
| TK-002 | Dashboard Skills view with lane, availability, freshness, and drift states | blocked | TK-001 | pending |

## Ticket Done Contracts

### TK-001 - Read-Only Skill Catalog Source With Provenance And Drift Detection

Done when a CIC server data source parses the canonical catalog table and the
deployed `.claude/skills/` frontmatter into one typed catalog payload with
per-entry provenance, freshness, and canon-versus-deployed drift status, and
deterministic fixtures prove correct parsing, drift classification (in sync,
drifted, missing, deployed-only), and fail-closed behavior for unreadable,
missing, and malformed sources. No write path to any skill file exists.

### TK-002 - Dashboard Skills View With Lane, Availability, Freshness, And Drift States

Done when the CIC dashboard renders the catalog payload as a Skills view with
name, definition, rewrite lane, availability, per-entry freshness, and drift
badges; unavailable sources render a visible stale/unavailable state; and
desktop plus mobile proof artifacts are recorded in this spec's evidence.

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
