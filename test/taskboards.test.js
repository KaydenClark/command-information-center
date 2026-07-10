import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  listProjectTaskboards,
  readProjectTaskboard,
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

| ID | Priority | Task | Owner | Started | Status |
|---|---:|---|---|---|---|
| T-003 | 2 | Wire the API | Codex | 2026-07-10 | in-progress |

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

test("priority update refuses duplicate task IDs instead of guessing", () => {
  const root = makeProjectsRoot();
  const [{ slug }] = listProjectTaskboards(root);
  const filePath = path.join(root, "Alpha Project", "TASKBOARD.md");
  fs.appendFileSync(filePath, `\n## Also Ready\n\n| ID | Priority | Task |\n|---|---:|---|\n| T-001 | 3 | Duplicate task ID |\n`);
  assert.throws(() => updateProjectTaskPriority(root, slug, "T-001", "P2"), /multiple matching rows/);
  assert.match(fs.readFileSync(filePath, "utf8"), /\| T-001 \| 1 \| Build the project board \|/);
});
