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

// Fixed clock so daily-receipt classification stays deterministic regardless of
// the wall-clock date. The receipt fixtures below treat 2026-07-20 as "today",
// so 2026-07-19 evidence is stale and 2026-07-21 evidence is in the future.
const FIXED_NOW = new Date("2026-07-20T12:00:00Z");

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
**FUID:** 000001
**Status:** in-progress
**Priority:** 1
**Owner:** Kayden (product)
**Created:** 2026-07-10
**Last worked:** 2026-07-15
**Updated:** 2026-07-15
**Catalog description:** Preserve the verified backend baseline.
**Blockers:** none
**Latest event:** TK-001 closed with proof.
**Next gate:** Complete TK-002.

## Outcome

A private, recoverable data backend.

## Vertical Implementation Slices

| Ticket | FUID | Slice | Status | Blockers | Created | Last worked | Proof |
|---|---|---|---|---|---|---|---|
| TK-001 | 000002 | Preserve the implemented baseline | done | none | 2026-07-10 | 2026-07-15 | 11 Node tests pass |
| TK-002 | 000003 | Remove fallback dependence | blocked | TK-001 review | 2026-07-10 | 2026-07-14 | pending |

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-20 | TK-001 | Shipped a visible backend result. | 11 Node tests pass; independent Auditor passed at abcdef1234567890abcdef1234567890abcdef12. | README updated. | TK-002 is next; remote checkpoint abcdef1234567890abcdef1234567890abcdef12 is pushed and clean. |
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
  assert.equal(projects[0].dailyReceipt.status, "missing");

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
  const projects = listProjectTaskboards(root, { now: FIXED_NOW });
  assert.equal(projects[0].specCount, 2);
  assert.equal(projects[0].dailyReceipt.status, "current");

  const board = readProjectTaskboard(root, projects[0].slug, { now: FIXED_NOW });
  assert.equal(board.specs.length, 2);

  const [first, second] = board.specs;
  assert.equal(first.id, "S-001");
  assert.equal(first.fuid, "000001");
  assert.equal(first.title, "Demo Backend Baseline");
  assert.equal(first.status, "in-progress");
  assert.equal(first.priority, "1");
  assert.equal(first.owner, "Kayden (product)");
  assert.equal(first.updated, "2026-07-15");
  assert.equal(first.created, "2026-07-10");
  assert.equal(first.lastWorked, "2026-07-15");
  assert.equal(first.description, "Preserve the verified backend baseline.");
  assert.equal(first.blockers, "none");
  assert.equal(first.latestEvent, "TK-001 closed with proof.");
  assert.equal(first.nextGate, "Complete TK-002.");
  assert.equal(first.tickets.length, 2);
  assert.deepEqual(first.tickets[0], {
    id: "TK-001",
    fuid: "000002",
    title: "Preserve the implemented baseline",
    status: "done",
    blockers: "none",
    created: "2026-07-10",
    lastWorked: "2026-07-15",
    proof: "11 Node tests pass"
  });
  assert.equal(first.tickets[1].status, "blocked");
  assert.deepEqual(first.latestEvidence, {
    date: "2026-07-20",
    ticket: "TK-001",
    event: "Shipped a visible backend result.",
    verification: "11 Node tests pass; independent Auditor passed at abcdef1234567890abcdef1234567890abcdef12.",
    docs: "README updated.",
    remainingGap: "TK-002 is next; remote checkpoint abcdef1234567890abcdef1234567890abcdef12 is pushed and clean."
  });

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
  assert.equal(board.dailyReceipt.status, "current");
  assert.equal(board.dailyReceipt.specId, "S-001");
  assert.equal(board.dailyReceipt.slice.id, "TK-001");
  assert.equal(board.dailyReceipt.progress, "Shipped a visible backend result.");
  assert.match(board.dailyReceipt.tests, /11 Node tests pass/);
  assert.match(board.dailyReceipt.auditMedic, /Auditor passed/);
  assert.equal(board.dailyReceipt.docs, "README updated.");
  assert.match(board.dailyReceipt.recovery, /pushed and clean/);
  assert.equal(board.dailyReceipt.next, "S-002/TK-001 · Publish behind the owner gate");
});

test("projects without a specs directory report an empty spec list", () => {
  const root = makeProjectsRoot();
  const projects = listProjectTaskboards(root);
  assert.equal(projects[0].specCount, 0);
  const board = readProjectTaskboard(root, projects[0].slug);
  assert.deepEqual(board.specs, []);
  assert.equal(board.dailyReceipt.status, "missing");
  assert.match(board.dailyReceipt.reason, /No stable spec evidence/);
});

test("today's completed slice remains the receipt while the next active ticket supplies the handoff", () => {
  const root = makeProjectsRoot();
  addSpecs(root);
  const completedDir = path.join(root, "Alpha Project", "specs", "S-024-daily-receipts");
  fs.mkdirSync(completedDir, { recursive: true });
  fs.writeFileSync(path.join(completedDir, "SPEC.md"), `# S-024 - Daily Receipts

**Spec ID:** S-024
**Status:** complete
**Priority:** 0
**Updated:** 2026-07-20
**Latest event:** Spec completed.
**Next gate:** none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Show today's receipt | done | none | browser proof |

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-20 | TK-001 | Today's visual receipt shipped. | Browser and independent Auditor passed. | README updated. | none; remote checkpoint is pushed and clean. |
| 2026-07-20 | spec | Spec completed. | Acceptance gates satisfied. | Documentation impact recorded. | none |
`);
  const board = readProjectTaskboard(root, listProjectTaskboards(root)[0].slug, { now: FIXED_NOW });
  assert.equal(board.dailyReceipt.status, "current");
  assert.equal(board.dailyReceipt.specId, "S-024");
  assert.equal(board.dailyReceipt.slice.id, "TK-001");
  assert.equal(board.dailyReceipt.progress, "Today's visual receipt shipped.");
  assert.equal(board.dailyReceipt.next, "S-002/TK-001 · Publish behind the owner gate");
});

test("daily receipt classifies stale, future, and partial evidence without healthy defaults", () => {
  const staleRoot = makeProjectsRoot();
  addSpecs(staleRoot);
  const staleSpec = path.join(staleRoot, "Alpha Project", "specs", "S-001-demo-backend-baseline", "SPEC.md");
  fs.writeFileSync(staleSpec, fs.readFileSync(staleSpec, "utf8")
    .replace("| 2026-07-20 | TK-001 |", "| 2026-07-19 | TK-001 |"));
  assert.equal(readProjectTaskboard(staleRoot, listProjectTaskboards(staleRoot)[0].slug, { now: FIXED_NOW }).dailyReceipt.status, "stale");

  const futureRoot = makeProjectsRoot();
  addSpecs(futureRoot);
  const futureSpec = path.join(futureRoot, "Alpha Project", "specs", "S-001-demo-backend-baseline", "SPEC.md");
  fs.writeFileSync(futureSpec, fs.readFileSync(futureSpec, "utf8")
    .replace("| 2026-07-20 | TK-001 |", "| 2026-07-21 | TK-001 |"));
  assert.equal(readProjectTaskboard(futureRoot, listProjectTaskboards(futureRoot)[0].slug, { now: FIXED_NOW }).dailyReceipt.status, "future");

  const partialRoot = makeProjectsRoot();
  addSpecs(partialRoot);
  const partialSpec = path.join(partialRoot, "Alpha Project", "specs", "S-001-demo-backend-baseline", "SPEC.md");
  fs.writeFileSync(partialSpec, fs.readFileSync(partialSpec, "utf8")
    .replace("11 Node tests pass; independent Auditor passed at abcdef1234567890abcdef1234567890abcdef12.", "")
    .replace("README updated.", ""));
  const partialReceipt = readProjectTaskboard(partialRoot, listProjectTaskboards(partialRoot)[0].slug, { now: FIXED_NOW }).dailyReceipt;
  assert.equal(partialReceipt.status, "current");
  assert.equal(partialReceipt.tests, "Not recorded");
  assert.equal(partialReceipt.auditMedic, "Not recorded");
  assert.equal(partialReceipt.docs, "Not recorded");
});

test("project summaries expose exactly one receipt per discovered enrolled project", () => {
  const root = makeProjectsRoot({
    indexRows: [
      ["P-001", "Alpha Project", path.join(os.tmpdir(), "unused")]
    ]
  });
  const second = path.join(root, "Beta Project");
  fs.mkdirSync(second);
  fs.writeFileSync(path.join(second, "TASKBOARD.md"), SAMPLE.replace("Alpha", "Beta"));
  writeProjectIndex(root, [
    ["P-001", "Alpha Project", path.join(root, "Alpha Project")],
    ["P-002", "Beta Project", second]
  ]);
  const summaries = listProjectTaskboards(root);
  assert.equal(summaries.length, 2);
  assert.equal(summaries.filter((project) => project.dailyReceipt).length, 2);
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
