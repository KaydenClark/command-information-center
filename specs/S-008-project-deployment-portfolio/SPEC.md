# S-008 - Project Deployment Portfolio

> Generated from LLM Workbench v2.3.

**Spec ID:** S-008
**Status:** complete
**Priority:** 0
**Owner:** Codex
**Updated:** 2026-07-16
**Catalog description:** Show canonical GPT_OS projects and honest local release readiness on Deployments, while recognizing an already-promoted Workbench release as healthy instead of blocked.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

The Deployments tab answers two operator questions without requiring terminal
inspection: whether the Workbench staging branch has already been released, and
which canonical GPT_OS project repositories are clean, ahead of release, synced,
diverged, or unavailable according to bounded local Git evidence.

## Why It Matters

Calling a completed Workbench promotion blocked erodes operator trust, while a
connector-only deployment page hides the release state of the rest of the
workspace. CIC should expose the canonical project portfolio without promoting
duplicate worktrees or inventing deployment health from stale feed data.

## Current Verified State

- Workbench PR #34 merged `integration` into `main` on 2026-07-16, but the fixed
  CIC card reports `missing promotion PR` after the PR closes.
- `Projects/INDEX.md` is the generated routing surface for canonical project
  repositories and explicitly separates non-canonical folders and worktrees.
- The Deployments tab currently renders one fixed Workbench release card and
  connector-health cards; it has no project release portfolio.

## Desired Behavior

- A fixed Workbench candidate with no open promotion PR is `released` when the
  integration SHA is already reachable from main or one exact closed-and-merged
  promotion PR binds the current integration SHA to the current main merge SHA;
  it remains blocked when unreleased commits exist or evidence is unavailable.
- Deployments lists only canonical entries from the generated GPT_OS project
  index, with the enrolled name, repository, local branch, dirty state, release
  and staging relationship, evidence time, and an explicit unavailable state.
- All portfolio inspection is server-side, read-only, bounded, and based on
  local repository refs. The UI labels that evidence honestly and does not imply
  that a hosting provider or production runtime was contacted.

## Decisions And Contracts

- Enrollment comes from the canonical `Projects/INDEX.md` routing surface, not
  raw directory scanning.
- The portfolio is read-only. The fixed Workbench Captain flow remains the only
  release action on this tab.
- Squash and merge-commit promotions are both recognized only through exact
  current branch and merged-PR evidence; a merely closed PR is insufficient.
- `main` or `master` is the release branch when present. `Integration` or
  `integration` is staging when present. Missing branches are shown, not guessed.
- Local Git inspection uses argument-only subprocess calls with bounded output
  and timeouts; one broken repository degrades only its own card.

## Non-Goals

- Generic merge, push, deploy, or rollback controls for arbitrary projects.
- Claiming Vercel, Supabase, GitHub Actions, or production runtime health from
  local Git state.
- Adding non-canonical worktrees, duplicate checkouts, experiments, or archives.
- Fetching remotes during an HTTP request.

## Dependencies And Blockers

- The generated root `Projects/INDEX.md` must remain present at the validated
  `CIC_PROJECTS_ROOT` topology documented in `RUNBOOK.md`; when that override is
  absent, the runtime root's parent remains the default Projects directory.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Show canonical project release portfolio and truthful Workbench released state | done | none | Immutable 0729957..8bd7b5e review: no unresolved in-scope findings; Node 229 pass + 6 TODO; Playwright 14 pass + 8 intended skips; build, audit, doctor, diff, live PR #34, and 16-project index checks green |

## Acceptance Criteria

- [x] A merged Workbench integration head is shown as released/up to date rather than blocked, including the exact squash-merged PR #34 state.
- [x] An unreleased Workbench integration head with no open promotion PR still fails closed.
- [x] Deployments lists canonical repository entries from `Projects/INDEX.md` and excludes its non-canonical table.
- [x] Each repository card exposes bounded local evidence and a truthful state without performing a network or Git mutation.
- [x] One missing, malformed, slow, or non-repository entry does not hide healthy entries.
- [x] Desktop and mobile views remain readable without horizontal overflow.

## Testing Seams

- `test/workbenchRelease.test.js` for released-vs-unreleased GitHub evidence.
- A pure server project-portfolio parser/inspector fixture with temporary Git repositories.
- Browser coverage for released Workbench state and responsive project cards.

## Verification Procedure

```bash
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Update `BLUEPRINT.md` routes, behavior, and read-only deployment evidence.
- Update `RUNBOOK.md` with portfolio source/freshness and troubleshooting.
- Update `README.md` Deployments description.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | planning | Created the stable capability record from the owner request and verified current CIC, Workbench PR #34, and canonical project-index state | `gh pr` evidence; live files and branch topology inspected | Spec added; generated controls pending render | Implement TK-001 |
| 2026-07-16 | TK-001 | Implemented exact released-state recognition and the canonical read-only project release portfolio | Red: Workbench returned blocked and project module was absent; browser lacked released and portfolio UI. Green: focused server 26/26; full Node 235 discovered, 229 pass + 6 TODO; Playwright 14 pass + 8 intended skips; build; production audit 0; doctor; diff check; live GitHub PR #34 returns released; live index returns 16 canonical projects and no worktree/latest names | Blueprint, README, Runbook, S-005, S-006, S-007, S-008, and generated Taskboard updated | Publish checkpoint and complete immutable review |
| 2026-07-16 | TK-001 | Ticket closed | Immutable 0729957..8bd7b5e review: no unresolved in-scope findings; Node 229 pass + 6 TODO; Playwright 14 pass + 8 intended skips; build, audit, doctor, diff, live PR #34, and 16-project index checks green | Blueprint, README, Runbook, S-005, S-006, S-007, S-008, and generated Taskboard updated | Complete spec, publish close evidence, merge to Integration, and migrate the private service |
| 2026-07-16 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |
| 2026-07-18 | post-completion compatibility | Preserved project portfolio and platform-health discovery when CIC moved from `Projects/` into the GPT_OS `Foundry/` area by adding a validated absolute `CIC_PROJECTS_ROOT` seam | Red: focused config test resolved Projects to `Foundry/`; green: focused config suite 22/22 before full migration verification | `.env.example`, `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, and this stable capability record updated | Full CIC verification and migrated launchd proof remain owned by root S-007/TK-005 |
| 2026-07-18 | Foundry post-cutover | Deployed CIC from the new canonical `/Users/kayden/GPT_OS/Foundry/Command Information Center` checkout with explicit Projects and platform-health roots; removed the preserved legacy runtime worktree only after live proof | Node 233 pass + 6 TODO; Playwright 16 pass + 8 intended skips; build and production audit green; launchd cwd matched the Foundry checkout at pushed `754c8dc`; unauthenticated `/api/auth/status` returned HTTP 200 with the expected protected state | Proof-only append to this stable record; root S-007 owns the cross-project routing docs | none for the Foundry relocation |

## Completion Result

The Deployments tab now recognizes the exact merged Workbench PR #34 state as
released and renders all 16 canonical GPT_OS project entries from the generated
index with bounded local Git evidence. Non-canonical worktrees and duplicate
checkouts are excluded, and no generic release mutation was added.

## Remaining Limitations Or Follow-Up Specs

- Project cards describe repository release relationships, not hosting-provider
  or production-runtime health.
- S-005 still owns migration of the reviewed Integration build to the private
  service and the owner Meshnet phone acceptance.
