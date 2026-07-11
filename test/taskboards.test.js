import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  listProjectTaskboards,
  readProjectTaskboard,
  updateProjectDecision,
  updateProjectTaskField,
  updateProjectTaskPriority
} from "../server/taskboards.js";

const SAMPLE = `# Alpha - Taskboard

## Executive Brief

- **Shipping now:** Make project work visible.
- **Blocker:** Waiting for Kayden's choice.

## Pending Decisions

| ID | Decision | Options | Recommendation | Owner | Status |
|---|---|---|---|---|---|
| D-001 | Pick the launch color | Blue / violet | Violet | Kayden | open |
| D-002 | Pick the database | SQLite | SQLite | Kayden | decided |

## Ready

| ID | Priority | Task | Owner | Status | Last update |
|---|---:|---|---|---|---|
| T-001 | 1 | Build the project board | agent | ready | 2026-07-10 |
| T-002 | P3 | Keep \`SNAKE_CASE\` unchanged | agent | ready | 2026-07-09 |

## In Progress

| ID | Priority | Task | Owner | Started | Current note | Status |
|---|---:|---|---|---|---|---|
| T-003 | 2 | Wire the API | Codex | 2026-07-10 | Halfway | in-progress |

## Blocked

| ID | Task / area | Blocked on | Owner | Status |
|---|---|---|---|---|
| B-001 | Publish | Credentials | Kayden | blocked |

## Done

| ID | Task | Completed | Result |
|---|---|---|---|
| T-000 | Adopt the harness | 2026-07-09 | pass |
`;

function makeProjectsRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-projects-"));
  const project = path.join(root, "Alpha Project");
  fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, "TASKBOARD.md"), SAMPLE);
  return root;
}

test("project taskboards expose summaries, open decisions, and grouped tasks", () => {
  const root = makeProjectsRoot();
  const projects = listProjectTaskboards(root);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, "Alpha Project");
  assert.deepEqual(projects[0].counts, { ready: 2, inProgress: 1, blocked: 1, deferred: 0, done: 1 });
  assert.equal(projects[0].decisionCount, 1);

  const board = readProjectTaskboard(root, projects[0].slug);
  assert.equal(board.brief.length, 2);
  assert.equal(board.decisions.length, 1);
  assert.equal(board.decisions[0].id, "D-001");
  assert.equal(board.groups.ready[0].priority, "P1");
  assert.equal(board.groups.ready[1].title, "Keep SNAKE_CASE unchanged");
  assert.equal(board.groups.inProgress[0].title, "Wire the API");
  assert.equal(board.groups.blocked[0].detail, "Credentials");
  assert.equal(board.groups.done[0].lastUpdated, "2026-07-09");
  assert.deepEqual(board.groups.ready[0].editable, { status: true, owner: true, note: false, priority: true });
  assert.deepEqual(board.groups.done[0].editable, { status: false, owner: false, note: true, priority: false });
  assert.deepEqual(board.decisions[0].editable, { status: true, recommendation: true, owner: true });
});

test("priority update changes only the requested task and preserves the board's priority style", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);

  const numeric = updateProjectTaskPriority(root, slug, "T-001", "P2");
  assert.equal(numeric.priority, "P2");
  let source = fs.readFileSync(path.join(root, "Alpha Project", "TASKBOARD.md"), "utf8");
  assert.match(source, /\| T-001 \| 2 \| Build the project board \|/);
  assert.match(source, /\| T-002 \| P3 \| Keep \`SNAKE_CASE\` unchanged \|/);

  const prefixed = updateProjectTaskPriority(root, slug, "T-002", "P1");
  assert.equal(prefixed.priority, "P1");
  source = fs.readFileSync(path.join(root, "Alpha Project", "TASKBOARD.md"), "utf8");
  assert.match(source, /\| T-002 \| P1 \| Keep \`SNAKE_CASE\` unchanged \|/);
});

test("project path and priority validation fail closed", () => {
  const root = makeProjectsRoot();
  assert.throws(() => readProjectTaskboard(root, ".."), /Project taskboard not found/);
  const [{ slug }] = listProjectTaskboards(root);
  assert.throws(() => updateProjectTaskPriority(root, slug, "T-001", "urgent"), /Priority must be P1, P2, or P3/);
  assert.throws(() => updateProjectTaskPriority(root, slug, "missing", "P1"), /Task priority could not be updated/);
});

test("status edit rewrites only the status cell and bumps the row's last update", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  const today = new Date().toISOString().slice(0, 10);

  const result = updateProjectTaskField(root, slug, "T-001", "status", "claimed");
  assert.equal(result.field, "status");
  assert.equal(result.value, "claimed");
  const source = fs.readFileSync(path.join(root, "Alpha Project", "TASKBOARD.md"), "utf8");
  assert.match(source, new RegExp(`\\| T-001 \\| 1 \\| Build the project board \\| agent \\| claimed \\| ${today} \\|`));
  assert.match(source, /\| T-002 \| P3 \| Keep `SNAKE_CASE` unchanged \| agent \| ready \| 2026-07-09 \|/);

  const board = readProjectTaskboard(root, slug);
  assert.equal(board.groups.ready[0].status, "claimed");
});

test("owner and note edits sanitize markdown-breaking input", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);

  updateProjectTaskField(root, slug, "T-003", "owner", "Kayden | Claude");
  updateProjectTaskField(root, slug, "T-003", "note", "Line one\nLine two");
  updateProjectTaskField(root, slug, "B-001", "note", "Waiting on DNS");

  const source = fs.readFileSync(path.join(root, "Alpha Project", "TASKBOARD.md"), "utf8");
  assert.match(source, /\| Kayden \\\| Claude \|/);
  assert.match(source, /\| Line one Line two \|/);

  const board = readProjectTaskboard(root, slug);
  assert.equal(board.groups.inProgress[0].owner, "Kayden | Claude");
  assert.equal(board.groups.inProgress[0].detail, "Line one Line two");
  assert.equal(board.groups.blocked[0].detail, "Waiting on DNS");
});

test("field edits fail closed on bad fields, bad statuses, and missing rows", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  assert.throws(() => updateProjectTaskField(root, slug, "T-001", "task", "Renamed"), /Field must be one of/);
  assert.throws(() => updateProjectTaskField(root, slug, "T-001", "status", "urgent"), /Status must be one of/);
  assert.throws(() => updateProjectTaskField(root, slug, "none", "status", "ready"), /Task field could not be updated/);
  assert.throws(() => updateProjectTaskField(root, slug, "missing", "owner", "Kayden"), /Task field could not be updated/);
  assert.throws(() => updateProjectTaskField(root, slug, "T-001", "note", "No note column here"), /Task field could not be updated/);
});

test("stale version precondition is refused before any write", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  const board = readProjectTaskboard(root, slug);
  assert.match(board.version, /^[0-9a-f]{12}$/);

  assert.throws(
    () => updateProjectTaskField(root, slug, "T-001", "status", "claimed", { expectedVersion: "000000000000" }),
    /changed on disk/
  );
  assert.equal(readProjectTaskboard(root, slug).groups.ready[0].status, "ready");

  const result = updateProjectTaskField(root, slug, "T-001", "status", "claimed", { expectedVersion: board.version });
  assert.equal(result.value, "claimed");
  assert.notEqual(result.version, board.version);
  assert.throws(
    () => updateProjectDecision(root, slug, "D-001", { status: "decided" }, { expectedVersion: board.version }),
    /changed on disk/
  );
  updateProjectDecision(root, slug, "D-001", { status: "decided" }, { expectedVersion: result.version });
  assert.equal(readProjectTaskboard(root, slug).decisions.length, 0);
});

test("decision edits update recommendation, owner, and resolution status", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);

  updateProjectDecision(root, slug, "D-001", { recommendation: "Violet, matching the brand", owner: "Kayden" });
  let board = readProjectTaskboard(root, slug);
  assert.equal(board.decisions.length, 1);
  assert.equal(board.decisions[0].recommendation, "Violet, matching the brand");
  assert.equal(board.decisions[0].owner, "Kayden");

  updateProjectDecision(root, slug, "D-001", { status: "decided" });
  board = readProjectTaskboard(root, slug);
  assert.equal(board.decisions.length, 0);
  const source = fs.readFileSync(path.join(root, "Alpha Project", "TASKBOARD.md"), "utf8");
  assert.match(source, /\| D-001 \| Pick the launch color \| Blue \/ violet \| Violet, matching the brand \| Kayden \| decided \|/);
});

test("decision edits fail closed on unknown rows, empty updates, and bad statuses", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  assert.throws(() => updateProjectDecision(root, slug, "D-404", { status: "decided" }), /Decision could not be updated/);
  assert.throws(() => updateProjectDecision(root, slug, "D-001", {}), /No editable decision fields/);
  assert.throws(() => updateProjectDecision(root, slug, "D-001", { status: "whenever" }), /Decision status must be one of/);
  assert.throws(() => updateProjectDecision(root, slug, "T-001", { status: "decided" }), /Decision could not be updated/);
});

test("priority update refuses duplicate task IDs instead of guessing", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  const filePath = path.join(root, "Alpha Project", "TASKBOARD.md");
  fs.appendFileSync(filePath, `\n## Also Ready\n\n| ID | Priority | Task |\n|---|---:|---|\n| T-001 | 3 | Duplicate task ID |\n`);
  assert.throws(() => updateProjectTaskPriority(root, slug, "T-001", "P2"), /multiple matching rows/);
  assert.match(fs.readFileSync(filePath, "utf8"), /\| T-001 \| 1 \| Build the project board \|/);
});
