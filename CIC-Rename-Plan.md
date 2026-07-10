# Rename Handoff: "Mission Control" -> "Command Information Center" (CIC)

Date: 06/13/2026
Goal: Rename the local dashboard project from "Mission Control" to "Command Information Center" across the project, both wikis, the scheduled refresh task, and memory.

This doc is split into two parts:
- **Part 1 - Codex scope:** everything in the `GPT_OS` git repo plus system services. Self-contained.
- **Part 2 - Claude scope:** two things Codex cannot reach (the Cowork scheduler registration and the agent memory files), run after Codex confirms done, plus verification.

---

## Naming convention

| Context | Old | New |
|---|---|---|
| Human-readable text (prose, headings, page titles, frontmatter title, briefing copy, comments) | Mission Control | Command Information Center |
| JS global identifier | `window.MISSION_DATA` | `window.CIC_DATA` |
| package.json `name` | `mission-control` | `cic` |
| Project folder | `Projects/Mission Control` | `Projects/Command Information Center` |
| Wiki page file | `01 Projects/Mission Control.md` | `01 Projects/Command Information Center.md` |
| SQLite DB file | `data/mission-control.sqlite` (+ `-shm`, `-wal`) | `data/cic.sqlite` |
| launchd plist file | `com.kayden.mission-control.plist` | `com.kayden.cic.plist` |
| launchd Label | `com.kayden.mission-control` | `com.kayden.cic` |
| Design asset files | `mission-control-*.png` | `cic-*.png` |

Rule: spell out "Command Information Center" wherever a human reads it; use the `cic` slug / `CIC_DATA` identifier only for filenames, paths, labels, and code.

### Defaults set for this run (override before sending if you disagree)
- Project folder uses the spelled-out name `Command Information Center` (not `CIC`).
- `archive/static-v0/` is left FROZEN (historical snapshot; do not rename inside it).
- Historical dated log entries keep their original wording; only `[[...]]` link targets get repointed. The renamed wiki page gets `aliases: [Mission Control]` so old by-name links still resolve.
- The scheduled-task id `mission-control-refresh` is NOT renamed (see Part 2 for why). Codex must not touch `Scheduled/`.

### Out of scope (unrelated to this project - do NOT change)
- `Wiki - Machine/z_Attachments/Post-Migration Organization Manifest.tsv` rows for `Mission Control ClickUp SOP.docx`, `Mission Control WBR - Template.pptx`, `Mission Control BR - Template.pptx`.
- `z_Archives/.../MissionControl-0.11.1-master-581ae0d.zip` (NSX emulator).

---

## PART 1 - CODEX SCOPE (Mac-side, in the GPT_OS git repo)

### Critical dependency
`Projects/Mission Control/data.js` defines `window.MISSION_DATA`. Producer is `server/dataFeed.js`; verify any consumer (current `dashboard.html`, archive) is updated in the same change. The DB path in `server/config.js` / `server/db.js` must switch to `data/cic.sqlite` at the same moment the file is renamed. Do all of this in one commit so the app never sits in a broken state. (The daily refresh prompt that also writes this identifier is handled by Claude in Part 2 - leave it alone.)

### 1a. Content edits inside `Projects/Mission Control/`
| File | Occ. | Change |
|---|---|---|
| `README.md` | 10 | prose -> Command Information Center |
| `data.js` | 5 | `MISSION_DATA`->`CIC_DATA`, header comment, db/label refs |
| `refresh-skill/SKILL.md` | 7 | prose + `MISSION_DATA`->`CIC_DATA` + update internal paths to new folder |
| `AGENTS.md` | 4 | prose + paths |
| `src/main.jsx` | 3 | UI title/labels |
| `server/config.js` | 3 | db path -> `data/cic.sqlite`, label `com.kayden.cic`, name |
| `server/app.js` | 3 | strings/comments |
| `server/dataFeed.js` | 2 | `MISSION_DATA`->`CIC_DATA` |
| `server/index.js` | 1 | string/comment |
| `dashboard.html` | 2 | `<title>` + body text (and `CIC_DATA` if it reads the global) |
| `index.html` | 1 | `<title>` |
| `test/api.test.js` | 1 | assertion text |
| `package.json` | 1 | `name` -> `cic` |
| `launchd/com.kayden.mission-control.plist` | 4 | Label `com.kayden.cic` + paths to new folder/db |

Leave `archive/static-v0/` untouched (frozen).

### 1b. File / folder renames (use `git mv` to preserve history)
- `Projects/Mission Control` -> `Projects/Command Information Center`
- `data/mission-control.sqlite`, `-shm`, `-wal` -> `data/cic.sqlite*`
- `launchd/com.kayden.mission-control.plist` -> `launchd/com.kayden.cic.plist`
- `design/mission-control-desktop-concept.png` -> `design/cic-desktop-concept.png`
- `design/mission-control-mobile-concept.png` -> `design/cic-mobile-concept.png`

### 1c. Wiki - Kayden
| File | Change |
|---|---|
| `01 Projects/Mission Control.md` | `git mv` -> `Command Information Center.md`; update H1, frontmatter title, all source-path lines, all prose; add `aliases: [Mission Control]` to frontmatter |
| `index.md` | update `[[...]]` link + visible label |
| `log.md` | repoint `[[01 Projects/Mission Control]]` link targets; keep dated narrative text as-is |
| `01 Projects/Small Apps and Experiments.md` | update the `[[01 Projects/Mission Control]]` link |

### 1d. Wiki - Machine
| File | Change |
|---|---|
| `01 Environment/GPT_OS.md` | 5 refs: path lines, `[[...]]` links, and the "daily mission-control dashboard refresh" line |
| `02 Source Maps/GPTCode Source Registry.md` | row label + `[[...]]` link + folder path |
| `05 Questions/Next Session Prompt.md` | 2 path refs -> new folder |
| `log.md` | repoint `[[...]]` link targets; keep dated narrative as-is |

### 1e. System + git
- `launchctl unload com.kayden.mission-control` then `launchctl load .../launchd/com.kayden.cic.plist` (verify with `launchctl list | grep cic`).
- `npm install` in the renamed folder to regenerate `package-lock.json` `name`.
- `npm test` should pass.
- `git commit` the whole change as one commit.

### Codex must NOT touch
- `Scheduled/` (any folder) - the refresh task is owned by Claude via the Cowork scheduler.
- The agent memory directory - outside this repo, not visible to Codex.

---

## PART 2 - CLAUDE SCOPE (after Codex confirms done)

### 2a. Cowork scheduled task `mission-control-refresh`
Why mine: the task is registered in the Cowork scheduler, not just as a repo file, and its taskId cannot be renamed. Codex cannot call the scheduler API.
- Update the task prompt via `update_scheduled_task`: `window.MISSION_DATA` -> `window.CIC_DATA`, "Command Information Center" naming, and correct the path it writes to `/Users/kayden/GPT_OS/Projects/Command Information Center/data.js` (current prompt has a stale `/Users/kayden/GPT_OS/mission-control/data.js`).
- Update the task description string to match.
- TaskId stays `mission-control-refresh` (internal id, never user-facing). Renaming it would require creating a new task + retiring the old one and would lose run history - only do this if Kayden explicitly asks.
- Note: this rewrites `Scheduled/mission-control-refresh/SKILL.md`. That edit will be uncommitted in the repo; Kayden commits it Mac-side afterward (or asks Codex to in a follow-up).

### 2b. Memory
Why mine: memory files live in the app's memory directory, outside `GPT_OS`.
- Update the `mission-control-dashboard` memory file content: name, `window.CIC_DATA`, new folder path, db/label names.
- Update the `MEMORY.md` index line label.

### 2c. Verification (Claude runs and reports)
- `node -e` load of the new `data.js` asserts `window.CIC_DATA` and required keys (`meta`, `sources`, `briefing`, `spotify`, `projects`, `wiki`) exist.
- `grep -rinE "mission[ _-]?control|MISSION_DATA"` across `Projects/Command Information Center`, both wikis, and memory returns only intentional leftovers (frozen `archive/static-v0/`, historical log narrative, the out-of-scope archive files).
- Confirm no broken wiki links: no remaining `[[01 Projects/Mission Control]]` path links.
- Confirm `launchctl list | grep cic` shows the new label and nothing under the old one.
- Confirm the `mission-control-refresh` scheduled task now writes `CIC_DATA` to the new path.
- Report a short pass/fail summary.

---

## Handoff back to Claude
When Codex finishes and you have committed, tell me. I will run Part 2 (scheduler sync + memory) and the Part 2c verification, then give you a pass/fail report and flag anything Codex missed.
