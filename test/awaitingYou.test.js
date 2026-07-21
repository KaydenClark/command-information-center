import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collectAwaitingYou, isOwnerGatedBlocker } from "../server/awaitingYou.js";
import { createApp } from "../server/app.js";

function writeProject(root, name, { taskboard, specs = {} }) {
  const project = path.join(root, name);
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "TASKBOARD.md"), taskboard);
  for (const [dir, body] of Object.entries(specs)) {
    const specDir = path.join(project, "specs", dir);
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, "SPEC.md"), body);
  }
  return project;
}

function board(ownerDecisionRows) {
  return `# Project - Taskboard

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
${ownerDecisionRows.join("\n")}
`;
}

function spec(id, { status = "active", owner = "CIC Engineer", blockers = "none", nextGate = "none", tickets = [] }) {
  const ticketRows = tickets.length
    ? tickets.map((t) => `| ${t.id} | ${t.slice || "Slice"} | ${t.status || "blocked"} | ${t.blockers || "none"} | ${t.proof || "pending"} |`).join("\n")
    : "| TK-001 | Only slice | ready | none | pending |";
  return `# ${id} - Fixture Spec

**Spec ID:** ${id}
**Status:** ${status}
**Priority:** 1
**Owner:** ${owner}
**Updated:** 2026-07-20
**Catalog description:** Fixture.
**Blockers:** ${blockers}
**Latest event:** none
**Next gate:** ${nextGate}

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
${ticketRows}
`;
}

const NONE_ROW = "| none | No active owner decision. | n/a | n/a | none | Kayden | none |";

test("isOwnerGatedBlocker includes owner/Kayden gates and excludes dependencies and resolved notes", () => {
  assert.equal(isOwnerGatedBlocker("Owner has not selected the canonical vault-root model."), true);
  assert.equal(isOwnerGatedBlocker("Owner Meshnet phone acceptance"), true);
  assert.equal(isOwnerGatedBlocker("Kayden selects the storage tier."), true);
  // Dependency-only blockers name no owner:
  assert.equal(isOwnerGatedBlocker("TK-001"), false);
  assert.equal(isOwnerGatedBlocker("Audit Engine S-003 TK-003"), false);
  assert.equal(isOwnerGatedBlocker("PIP S-001/TK-001, S-003"), false);
  // Already-resolved owner notes are not open gates:
  assert.equal(isOwnerGatedBlocker("TK-003 (owner rotation approval on record)"), false);
  assert.equal(isOwnerGatedBlocker("Owner approval received 2026-07-20"), false);
  // Cleared blockers:
  assert.equal(isOwnerGatedBlocker("none"), false);
  assert.equal(isOwnerGatedBlocker(""), false);
});

test("collector aggregates owner decisions and owner-gated blockers across every discovered project", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-awaiting-"));
  writeProject(root, "Alpha", {
    taskboard: board([
      "| S-002 | Choose the launch color | Blue / Violet | Violet | Low | Kayden | Kayden picks the launch color |",
      NONE_ROW,
      "| S-009 | Approve vendor X contract | Yes / No | Yes | High | CIC Engineer | Engineer proceeds |"
    ]),
    specs: {
      "S-001-storage": spec("S-001", {
        blockers: "Owner has not chosen the storage tier.",
        nextGate: "Kayden chooses the storage tier (SQLite vs Postgres).",
        tickets: [{ id: "TK-001", status: "blocked", blockers: "Owner has not chosen the storage tier." }]
      }),
      "S-003-review": spec("S-003", {
        blockers: "S-001, TK-002",
        nextGate: "Finish S-001, then claim TK-002.",
        tickets: [
          { id: "TK-002", status: "blocked", blockers: "Owner sign-off needed before publish." }
        ]
      }),
      "S-004-rotation": spec("S-004", {
        blockers: "Owner rotation approval on record; awaits TK-003.",
        nextGate: "Execute TK-003.",
        tickets: [{ id: "TK-003", status: "blocked", blockers: "TK-002" }]
      })
    }
  });
  writeProject(root, "Beta", {
    taskboard: board([NONE_ROW]),
    specs: {
      "S-001-clean": spec("S-001", { blockers: "none", nextGate: "Claim TK-001." })
    }
  });

  const result = collectAwaitingYou(root);
  assert.equal(result.projectCount, 2, "scans both discovered projects");

  const ids = result.items.map((i) => `${i.projectSlug}:${i.specId}:${i.kind}:${i.ticketId || "spec"}`);
  // Owner decision owned by Kayden is present; none-sentinel and non-Kayden owner rows are excluded.
  assert.ok(ids.includes("alpha:S-002:decision:spec"), "Kayden owner decision surfaces");
  assert.ok(!ids.some((id) => id.startsWith("alpha:S-009")), "non-Kayden owner decision excluded");
  assert.ok(!ids.some((id) => id.includes(":none:")), "none-sentinel decision excluded");

  // Spec-level owner gate present; its duplicate ticket-level row is suppressed.
  assert.ok(ids.includes("alpha:S-001:blocker:spec"), "spec-level owner gate surfaces");
  assert.ok(!ids.includes("alpha:S-001:blocker:TK-001"), "duplicate ticket gate suppressed by spec gate");

  // Ticket-level owner gate present when the spec itself is a dependency blocker.
  assert.ok(ids.includes("alpha:S-003:blocker:TK-002"), "ticket-level owner gate surfaces");

  // Resolved owner note and dependency-only blockers are excluded.
  assert.ok(!ids.some((id) => id.startsWith("alpha:S-004")), "resolved owner note excluded");
  assert.ok(!ids.some((id) => id.startsWith("beta:")), "clean project contributes nothing");

  assert.equal(result.counts.decisions, 1);
  assert.equal(result.counts.blockers, 2);
  assert.equal(result.counts.total, 3);
  assert.equal(result.items.length, 3);
});

test("each item quotes the exact decision and offers a safe deep-link action", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-awaiting-detail-"));
  writeProject(root, "Alpha", {
    taskboard: board([
      "| S-002 | Choose the launch color | Blue / Violet | Violet | Low | Kayden | Kayden picks the launch color |"
    ]),
    specs: {
      "S-001-storage": spec("S-001", {
        blockers: "Owner has not chosen the storage tier.",
        nextGate: "Kayden chooses the storage tier (SQLite vs Postgres)."
      })
    }
  });
  const { items } = collectAwaitingYou(root);

  const decision = items.find((i) => i.kind === "decision");
  assert.equal(decision.decision, "Choose the launch color");
  assert.equal(decision.options, "Blue / Violet");
  assert.equal(decision.recommendation, "Violet");
  assert.equal(decision.impact, "Low");
  assert.equal(decision.nextGate, "Kayden picks the launch color");
  assert.equal(decision.owner, "Kayden");
  assert.deepEqual(decision.action, { type: "open-project", projectSlug: "alpha", specId: "S-002" });

  const blocker = items.find((i) => i.kind === "blocker");
  assert.equal(blocker.blocker, "Owner has not chosen the storage tier.");
  assert.equal(blocker.decision, "Kayden chooses the storage tier (SQLite vs Postgres).");
  assert.equal(blocker.specId, "S-001");
  assert.deepEqual(blocker.action, { type: "open-project", projectSlug: "alpha", specId: "S-001" });
});

test("GET /api/awaiting-you returns the aggregated queue over the configured projects root", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-awaiting-api-"));
  writeProject(root, "Alpha", {
    taskboard: board([
      "| S-002 | Choose the launch color | Blue / Violet | Violet | Low | Kayden | Kayden picks the launch color |"
    ]),
    specs: {
      "S-001-storage": spec("S-001", {
        blockers: "Owner has not chosen the storage tier.",
        nextGate: "Kayden chooses the storage tier."
      })
    }
  });
  const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-awaiting-db-"));
  const app = createApp({
    dbPath: path.join(dbDir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    projectsRoot: root,
    passcodeHash: "",
    port: 0,
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    platformHealthReport: ""
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/awaiting-you`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.counts.total, 2);
    assert.equal(body.projectCount, 1);
    assert.ok(body.items.some((item) => item.kind === "decision" && item.specId === "S-002"));
    assert.ok(body.items.some((item) => item.kind === "blocker" && item.specId === "S-001"));
    assert.ok(typeof body.generatedAt === "string");
  } finally {
    server.close();
  }
});

test("honest empty state when nothing awaits the owner", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-awaiting-empty-"));
  writeProject(root, "Alpha", {
    taskboard: board([NONE_ROW]),
    specs: { "S-001-clean": spec("S-001", { blockers: "none" }) }
  });
  const result = collectAwaitingYou(root);
  assert.equal(result.items.length, 0);
  assert.equal(result.counts.total, 0);
  assert.equal(result.projectCount, 1);
});
