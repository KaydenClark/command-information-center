import test from "node:test";
import assert from "node:assert/strict";
import { formatFreshnessAge } from "../src/freshness.js";

const NOW = new Date("2026-07-10T12:00:00.000Z").getTime();

test("formatFreshnessAge distinguishes never, recent, and stale updates", () => {
  assert.equal(formatFreshnessAge(null, NOW), "Never updated");
  assert.equal(formatFreshnessAge("2026-07-10T11:59:40.000Z", NOW), "Updated just now");
  assert.equal(formatFreshnessAge("2026-07-10T11:42:00.000Z", NOW), "Updated 18m ago");
  assert.equal(formatFreshnessAge("2026-07-08T12:00:00.000Z", NOW), "Updated 2d ago");
});
