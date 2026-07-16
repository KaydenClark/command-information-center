import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readPlatformHealth } from "../server/platformHealth.js";

function writeReport(report) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-platform-health-"));
  const filePath = path.join(dir, "platform-health.json");
  fs.writeFileSync(filePath, JSON.stringify(report));
  return filePath;
}

test("missing platform health report is visibly not configured", () => {
  const result = readPlatformHealth("");
  assert.equal(result.status, "not_configured");
  assert.equal(result.configured, false);
  assert.equal(readPlatformHealth("/definitely/missing/platform-health.json").status, "not_configured");
});

test("valid platform health report exposes bounded public fields", () => {
  const checkedAt = "2026-07-12T18:00:00.000Z";
  const filePath = writeReport({
    schemaVersion: 1,
    checkedAt,
    mode: "portable",
    overall: "healthy",
    checks: {
      contract: { status: "healthy", detail: "Compatible" },
      openbrain: { status: "healthy", detail: "Fresh" },
      cic: { status: "healthy", detail: "Reachable" }
    },
    secret: "must not escape"
  });

  const result = readPlatformHealth(filePath, {
    now: Date.parse("2026-07-12T18:30:00.000Z")
  });
  assert.deepEqual(result, {
    configured: true,
    status: "healthy",
    checkedAt,
    mode: "portable",
    stale: false,
    checks: {
      contract: { status: "healthy", detail: "Compatible" },
      openbrain: { status: "healthy", detail: "Fresh" },
      cic: { status: "healthy", detail: "Reachable" }
    }
  });
});

test("old or malformed health reports degrade without throwing", () => {
  const stalePath = writeReport({
    schemaVersion: 1,
    checkedAt: "2026-07-12T15:00:00.000Z",
    mode: "live",
    overall: "healthy",
    checks: {}
  });
  assert.equal(readPlatformHealth(stalePath, {
    now: Date.parse("2026-07-12T18:00:01.000Z"),
    maxAgeMinutes: 90
  }).status, "stale");

  const malformedPath = writeReport({ checkedAt: "not-a-date" });
  assert.equal(readPlatformHealth(malformedPath).status, "error");
});
