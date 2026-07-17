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

const SPEC_ONE = `# S-001 - Demo Backend Baseline

> Generated from LLM Workbench v2.3.

**Spec ID:** S-001
**Status:** in-progress
**Priority:** 1
**Owner:** Kayden (product)
**Updated:** 2026-07-15
**Catalog description:** Preserve the verified backend baseline.
**Blockers:** none
**Latest event:** TK-001 closed with proof.
**Next gate:** Complete TK-002.

## Outcome

A private, recoverable data backend.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Preserve the implemented baseline | done | none | 11 Node tests pass |
| TK-002 | Remove fallback dependence | blocked | TK-001 review | pending |
`;

const SPEC_TWO = `# S-002 - Publication Gate

**Spec ID:** S-002
**Status:** ready
**Priority:** 2
**Catalog description:** Owner-gated publication.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Publish behind the owner gate | ready | none | - |
`;

function writeProjectIndex(root, rows = [
  ["P-001", "Alpha Project", path.join(root, "Alpha Project")]
]) {
  fs.writeFileSync(path.join(root, "INDEX.md"), [
    "# Project Routing Index",
    "",
    "## Canonical Project Repositories",
    "",
    "| Project ID | Project | Canonical source | Remote | Controls | Stable context |",
    "|---|---|---|---|---|---|",
    ...rows.map(([projectId, name, source]) => `| ${projectId} | ${name} | \`${source}\` | missing repository | current surface present | context |`),
    "",
    "## Non-Canonical Or Noncompliant Entries",
    ""
  ].join("\n"));
}

function makeProjectsRoot({ withIndex = true, indexRows } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-projects-"));
  const project = path.join(root, "Alpha Project");
  fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, "TASKBOARD.md"), SAMPLE);
  if (withIndex) writeProjectIndex(root, indexRows);
  return root;
}

function addSpecs(root) {
  const specsDir = path.join(root, "Alpha Project", "specs");
  fs.mkdirSync(path.join(specsDir, "S-002-publication-gate"), { recursive: true });
  fs.mkdirSync(path.join(specsDir, "S-001-demo-backend-baseline"), { recursive: true });
  fs.writeFileSync(path.join(specsDir, "S-001-demo-backend-baseline", "SPEC.md"), SPEC_ONE);
  fs.writeFileSync(path.join(specsDir, "S-002-publication-gate", "SPEC.md"), SPEC_TWO);
}

test("project taskboards expose summaries, open decisions, and grouped tasks", () => {
  const root = makeProjectsRoot();
  const projects = listProjectTaskboards(root);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, "Alpha Project");
  assert.equal(projects[0].projectId, "P-001");
  assert.deepEqual(projects[0].counts, { ready: 2, inProgress: 1, blocked: 1, deferred: 0, done: 1 });
  assert.equal(projects[0].decisionCount, 1);

  const board = readProjectTaskboard(root, projects[0].slug);
  assert.equal(board.projectId, "P-001");
  assert.equal(board.brief.length, 2);
  assert.equal(board.decisions.length, 1);
  assert.equal(board.decisions[0].id, "D-001");
  assert.equal(board.groups.ready[0].priority, "P1");
  assert.equal(board.groups.ready[1].title, "Keep SNAKE_CASE unchanged");
  assert.equal(board.groups.inProgress[0].title, "Wire the API");
  assert.equal(board.groups.blocked[0].detail, "Credentials");
  assert.equal(board.groups.done[0].lastUpdated, "2026-07-09");
});

test("specs and their tickets are parsed from specs/*/SPEC.md in spec-ID order", () => {
  const root = makeProjectsRoot();
  addSpecs(root);
  const projects = listProjectTaskboards(root);
  assert.equal(projects[0].specCount, 2);

  const board = readProjectTaskboard(root, projects[0].slug);
  assert.equal(board.specs.length, 2);

  const [first, second] = board.specs;
  assert.equal(first.id, "S-001");
  assert.equal(first.title, "Demo Backend Baseline");
  assert.equal(first.status, "in-progress");
  assert.equal(first.priority, "1");
  assert.equal(first.owner, "Kayden (product)");
  assert.equal(first.updated, "2026-07-15");
  assert.equal(first.description, "Preserve the verified backend baseline.");
  assert.equal(first.blockers, "none");
  assert.equal(first.latestEvent, "TK-001 closed with proof.");
  assert.equal(first.nextGate, "Complete TK-002.");
  assert.equal(first.tickets.length, 2);
  assert.deepEqual(first.tickets[0], {
    id: "TK-001",
    title: "Preserve the implemented baseline",
    status: "done",
    blockers: "none",
    proof: "11 Node tests pass"
  });
  assert.equal(first.tickets[1].status, "blocked");

  assert.equal(second.id, "S-002");
  assert.equal(second.title, "Publication Gate");
  assert.equal(second.owner, "");
  assert.equal(second.tickets.length, 1);

  assert.equal(projects[0].taskCount, 3);
  assert.deepEqual(projects[0].counts, {
    ready: 1,
    inProgress: 0,
    blocked: 1,
    deferred: 0,
    done: 1
  });
  assert.equal(board.taskCount, 3);
  assert.equal(board.legacyTaskCount, 5);
});

test("projects without a specs directory report an empty spec list", () => {
  const root = makeProjectsRoot();
  const projects = listProjectTaskboards(root);
  assert.equal(projects[0].specCount, 0);
  const board = readProjectTaskboard(root, projects[0].slug);
  assert.deepEqual(board.specs, []);
});

test("missing, malformed, or duplicate project identities remain visibly unnumbered", () => {
  const missingRoot = makeProjectsRoot({ withIndex: false });
  assert.equal(listProjectTaskboards(missingRoot)[0].projectId, null);

  const malformedRoot = makeProjectsRoot({ withIndex: false });
  writeProjectIndex(malformedRoot, [["project-1", "Alpha Project", path.join(malformedRoot, "Alpha Project")]]);
  assert.equal(listProjectTaskboards(malformedRoot)[0].projectId, null);

  const lowercaseRoot = makeProjectsRoot({ withIndex: false });
  writeProjectIndex(lowercaseRoot, [["p-001", "Alpha Project", path.join(lowercaseRoot, "Alpha Project")]]);
  assert.equal(listProjectTaskboards(lowercaseRoot)[0].projectId, null);

  const duplicateRoot = makeProjectsRoot({ withIndex: false });
  writeProjectIndex(duplicateRoot, [
    ["P-001", "Alpha Project", path.join(duplicateRoot, "Alpha Project")],
    ["P-001", "Another Project", path.join(duplicateRoot, "Another Project")]
  ]);
  assert.equal(listProjectTaskboards(duplicateRoot)[0].projectId, null);
});

test("malformed or oversized SPEC.md files degrade honestly instead of crashing the board", () => {
  const root = makeProjectsRoot();
  const specDir = path.join(root, "Alpha Project", "specs", "S-009-broken");
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, "SPEC.md"), "no headings, no fields");
  const board = readProjectTaskboard(root, listProjectTaskboards(root)[0].slug);
  assert.equal(board.specs.length, 1);
  assert.equal(board.specs[0].id, "S-009");
  assert.equal(board.specs[0].status, "unknown");
  assert.deepEqual(board.specs[0].tickets, []);
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
