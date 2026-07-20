import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  HARNESS_FLOW_STAGE_KEYS,
  buildHarnessFlow,
  createHarnessExportFixtureReader,
  normalizeHarnessReport
} from "../server/harnessFlow.js";
import { createApp } from "../server/app.js";

const NOW = new Date("2026-07-19T12:00:00Z");

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cic-harness-flow-"));
}

function stage(evidenceState, value = true) {
  return { value, evidenceState };
}

function receiptStages(overrides = {}) {
  return {
    available: stage("RECEIPT", 12),
    eligible: stage("RECEIPT", 9),
    shown: stage("RECEIPT", 6),
    consulted: stage("RECEIPT", 4),
    actedThrough: stage("RECEIPT", 2),
    checked: stage("RECEIPT"),
    accepted: stage("RECEIPT"),
    ...overrides
  };
}

function fixtureReport(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-19T11:30:00Z",
    scope: { label: "Foundry", kind: "root" },
    setup: {
      controls: [
        { id: "root-agents", path: "AGENTS.md", kind: "instructions", bytes: 9143, sha256: "a".repeat(64), runtime: "RECEIPT" }
      ]
    },
    run: {
      receipt: { status: "present", reason: null },
      surface: { value: "claude-code", evidenceState: "RECEIPT" },
      model: { value: "claude-fable-5", evidenceState: "USER_REPORTED" },
      stages: receiptStages()
    },
    coverage: {
      limits: { maxEntries: 500, maxBytes: 1048576 },
      inspectedEntries: 128,
      inspectedBytes: 402211,
      exclusions: [{ path: "node_modules", reason: "generated output" }],
      limitReached: false
    },
    ...overrides
  };
}

function componentReport(label, overrides = {}) {
  return fixtureReport({ scope: { label, kind: "component" }, ...overrides });
}

function writeFixture(reports) {
  const dir = tmpdir();
  const fixturePath = path.join(dir, "harness-flow-export.json");
  fs.writeFileSync(fixturePath, JSON.stringify(reports));
  return fixturePath;
}

// --- fixture reader -----------------------------------------------------------

test("fixture reader fails closed as unavailable when the file is missing", () => {
  const reader = createHarnessExportFixtureReader({ fixturePath: path.join(tmpdir(), "absent.json") });
  const result = reader();
  assert.equal(result.status, "unavailable");
  assert.equal(result.source, "absent.json");
  assert.ok(result.reason);
  assert.ok(!result.reason.includes(os.tmpdir()), "unavailable reason must not leak absolute paths");
});

test("fixture reader reports malformed for invalid JSON and unavailable for oversized files", () => {
  const dir = tmpdir();
  const badJson = path.join(dir, "bad.json");
  fs.writeFileSync(badJson, "{not json");
  assert.equal(createHarnessExportFixtureReader({ fixturePath: badJson })().status, "malformed");

  const big = path.join(dir, "big.json");
  fs.writeFileSync(big, "[]".padEnd(64, " "));
  const bounded = createHarnessExportFixtureReader({ fixturePath: big, maxBytes: 8 })();
  assert.equal(bounded.status, "unavailable");
  assert.match(bounded.reason, /size/i);
});

test("fixture reader parses a valid export file", () => {
  const fixturePath = writeFixture([fixtureReport()]);
  const result = createHarnessExportFixtureReader({ fixturePath })();
  assert.equal(result.status, "ok");
  assert.equal(result.source, "harness-flow-export.json");
  assert.equal(result.raw.length, 1);
});

// --- report normalization -----------------------------------------------------

test("normalizeHarnessReport keeps the seven ordered stages and receipt evidence", () => {
  const { ok, report } = normalizeHarnessReport(fixtureReport(), { now: () => NOW });
  assert.equal(ok, true);
  assert.deepEqual(report.run.stages.map((entry) => entry.key), [...HARNESS_FLOW_STAGE_KEYS]);
  assert.deepEqual(HARNESS_FLOW_STAGE_KEYS, [
    "available", "eligible", "shown", "consulted", "actedThrough", "checked", "accepted"
  ]);
  assert.ok(report.run.stages.every((entry) => entry.evidenceState === "RECEIPT" || entry.key === "model"));
  assert.equal(report.run.model.evidenceState, "USER_REPORTED");
  assert.equal(report.coverage.limitReached, false);
  assert.equal(report.coverage.exclusions[0].label, "node_modules");
});

test("missing or unrecognized stage evidence visibly remains INACCESSIBLE", () => {
  const source = fixtureReport();
  delete source.run.stages.checked;
  source.run.stages.accepted = { value: true, evidenceState: "TRUST_ME" };
  const { ok, report } = normalizeHarnessReport(source, { now: () => NOW });
  assert.equal(ok, true);
  const byKey = Object.fromEntries(report.run.stages.map((entry) => [entry.key, entry]));
  assert.equal(byKey.checked.evidenceState, "INACCESSIBLE");
  assert.equal(byKey.checked.present, false);
  assert.equal(byKey.accepted.evidenceState, "INACCESSIBLE");
});

test("setup controls are never promoted into run-stage evidence", () => {
  const source = fixtureReport();
  source.run.stages = {}; // controls exist, but no run evidence at all
  const { ok, report } = normalizeHarnessReport(source, { now: () => NOW });
  assert.equal(ok, true);
  assert.equal(report.setup.controls.length, 1);
  assert.ok(report.run.stages.every((entry) => entry.evidenceState === "INACCESSIBLE"));
});

test("normalization sanitizes absolute control paths and truncates hashes", () => {
  const source = fixtureReport();
  source.setup.controls = [
    { id: "abs", path: "/Users/kayden/GPT_OS/Foundry/AGENTS.md", kind: "instructions", bytes: 10, sha256: "b".repeat(64), runtime: "RECEIPT" },
    { id: "rel", path: "Roles/Captain.md", kind: "role", bytes: 20, sha256: "c".repeat(64), runtime: "INACCESSIBLE" }
  ];
  const { report } = normalizeHarnessReport(source, { now: () => NOW });
  assert.equal(report.setup.controls[0].name, "AGENTS.md");
  assert.equal(report.setup.controls[1].name, "Roles/Captain.md");
  assert.equal(report.setup.controls[0].sha256Prefix, "b".repeat(12));
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes("/Users/"), "normalized report must not contain absolute paths");
  assert.ok(!serialized.includes("b".repeat(64)), "normalized report must not contain full raw hashes");
});

test("normalizeHarnessReport rejects unsupported schema versions and missing scope", () => {
  assert.equal(normalizeHarnessReport(fixtureReport({ schemaVersion: 99 }), { now: () => NOW }).ok, false);
  assert.equal(normalizeHarnessReport(fixtureReport({ generatedAt: "not-a-date" }), { now: () => NOW }).ok, false);
  assert.equal(normalizeHarnessReport(fixtureReport({ scope: null }), { now: () => NOW }).ok, false);
  assert.equal(normalizeHarnessReport("nope", { now: () => NOW }).ok, false);
});

// --- envelope -----------------------------------------------------------------

test("buildHarnessFlow returns a fresh envelope with root and component drill-downs", () => {
  const fixturePath = writeFixture([
    fixtureReport(),
    componentReport("Forge"),
    componentReport("Command Information Center", {
      coverage: {
        limits: { maxEntries: 100 },
        inspectedEntries: 100,
        inspectedBytes: 900000,
        exclusions: ["dist"],
        limitReached: true
      }
    })
  ]);
  const flow = buildHarnessFlow({
    readExport: createHarnessExportFixtureReader({ fixturePath }),
    now: () => NOW
  });
  assert.equal(flow.status, "fresh");
  assert.equal(flow.source, "harness-flow-export.json");
  assert.equal(flow.generatedAt, "2026-07-19T11:30:00.000Z");
  assert.equal(flow.ageMinutes, 30);
  assert.equal(flow.root.scope.label, "Foundry");
  assert.equal(flow.components.length, 2);
  assert.equal(flow.components[1].coverage.limitReached, true);
  assert.equal(flow.components[1].coverage.exclusions[0].label, "dist");
});

test("buildHarnessFlow marks an old root report stale with a visible reason", () => {
  const fixturePath = writeFixture([fixtureReport({ generatedAt: "2026-07-19T09:00:00Z" })]);
  const flow = buildHarnessFlow({
    readExport: createHarnessExportFixtureReader({ fixturePath }),
    now: () => NOW,
    maxAgeMinutes: 90
  });
  assert.equal(flow.status, "stale");
  assert.equal(flow.ageMinutes, 180);
  assert.match(flow.reason, /90/);
  assert.ok(flow.root, "stale evidence stays visible rather than disappearing");
});

test("buildHarnessFlow fails closed on unavailable and malformed exports", () => {
  const missing = buildHarnessFlow({
    readExport: createHarnessExportFixtureReader({ fixturePath: path.join(tmpdir(), "absent.json") }),
    now: () => NOW
  });
  assert.equal(missing.status, "unavailable");
  assert.equal(missing.root, null);
  assert.ok(missing.reason);

  const notArray = buildHarnessFlow({
    readExport: () => ({ status: "ok", source: "export.json", raw: { schemaVersion: 1 } }),
    now: () => NOW
  });
  assert.equal(notArray.status, "malformed");

  const noRoot = buildHarnessFlow({
    readExport: () => ({ status: "ok", source: "export.json", raw: [componentReport("Forge")] }),
    now: () => NOW
  });
  assert.equal(noRoot.status, "malformed");
  assert.match(noRoot.reason, /root/i);

  const twoRoots = buildHarnessFlow({
    readExport: () => ({ status: "ok", source: "export.json", raw: [fixtureReport(), fixtureReport()] }),
    now: () => NOW
  });
  assert.equal(twoRoots.status, "malformed");

  const throwing = buildHarnessFlow({
    readExport: () => { throw new Error("boom with /Users/secret/path"); },
    now: () => NOW
  });
  assert.equal(throwing.status, "unavailable");
  assert.ok(!String(throwing.reason).includes("/Users/"), "reader errors must not leak paths");
});

test("an individually malformed component is surfaced without hiding the root", () => {
  const flow = buildHarnessFlow({
    readExport: () => ({
      status: "ok",
      source: "export.json",
      raw: [fixtureReport(), componentReport("Forge", { schemaVersion: 7 })]
    }),
    now: () => NOW
  });
  assert.equal(flow.status, "fresh");
  assert.equal(flow.components.length, 1);
  assert.equal(flow.components[0].status, "malformed");
  assert.equal(flow.components[0].scope.label, "Forge");
  assert.equal(flow.components[0].run, null);
});

// --- API route ----------------------------------------------------------------

async function startTestServer(overrides = {}) {
  const dir = tmpdir();
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    port: 0,
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    platformHealthReport: "",
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("GET /api/harness-flow serves the derived envelope from the injected reader", async () => {
  const fixturePath = writeFixture([
    fixtureReport({
      setup: {
        controls: [
          { id: "abs", path: "/Users/kayden/GPT_OS/Foundry/AGENTS.md", kind: "instructions", bytes: 10, sha256: "d".repeat(64), runtime: "RECEIPT" }
        ]
      }
    }),
    componentReport("Forge")
  ]);
  const { server, baseUrl } = await startTestServer({
    harnessExportReader: createHarnessExportFixtureReader({ fixturePath })
  });
  try {
    const response = await fetch(`${baseUrl}/api/harness-flow`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(["fresh", "stale"].includes(body.status));
    assert.equal(body.root.scope.label, "Foundry");
    assert.equal(body.components.length, 1);
    const serialized = JSON.stringify(body);
    assert.ok(!serialized.includes("/Users/"), "route payload must not expose absolute paths");
    assert.ok(!serialized.includes("d".repeat(64)), "route payload must not expose full hashes");
  } finally {
    server.close();
  }
});

test("GET /api/harness-flow stays 200 and honestly unavailable without an export", async () => {
  const { server, baseUrl } = await startTestServer({
    harnessReportPath: path.join(tmpdir(), "absent.json")
  });
  try {
    const response = await fetch(`${baseUrl}/api/harness-flow`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "unavailable");
    assert.equal(body.root, null);
    assert.ok(body.reason);
  } finally {
    server.close();
  }
});

test("harness-flow exposes no write route", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
      const response = await fetch(`${baseUrl}/api/harness-flow`, { method });
      assert.equal(response.status, 404, `${method} must not be routable`);
      const body = await response.json();
      assert.equal(body.error, "API route not found.");
    }
    for (const suffix of ["/refresh", "/repair", "/resolve", "/audit"]) {
      const response = await fetch(`${baseUrl}/api/harness-flow${suffix}`, { method: "POST" });
      assert.equal(response.status, 404, `POST ${suffix} must not be routable`);
    }
  } finally {
    server.close();
  }
});

test("reports with unknown scope kinds are skipped and counted, never invented", () => {
  const flow = buildHarnessFlow({
    readExport: () => ({
      status: "ok",
      source: "export.json",
      raw: [fixtureReport(), fixtureReport({ scope: { label: "??", kind: "galaxy" } })]
    }),
    now: () => NOW
  });
  assert.equal(flow.status, "fresh");
  assert.equal(flow.skippedReports, 1);
});
