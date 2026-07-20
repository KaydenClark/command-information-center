import test from "node:test";
import assert from "node:assert/strict";
import {
  HARNESS_STAGE_LABELS,
  buildHarnessFlowViewModel,
  buildReportViewModel,
  evidenceTone,
  formatAge,
  formatBytes
} from "../src/harnessFlowModel.js";
import {
  HARNESS_FLOW_STAGE_KEYS,
  buildHarnessFlow,
  normalizeHarnessReport
} from "../server/harnessFlow.js";

const NOW = new Date("2026-07-19T12:00:00Z");

function stage(evidenceState, value = true) {
  return { value, evidenceState };
}

function contractReport(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-19T11:45:00Z",
    scope: { label: "Foundry", kind: "root" },
    setup: {
      controls: [
        {
          id: "root-agents",
          path: "AGENTS.md",
          kind: "instructions",
          bytes: 9143,
          sha256: "a".repeat(64),
          runtime: "RECEIPT"
        }
      ]
    },
    run: {
      receipt: { status: "present", reason: null },
      surface: { value: "claude-code", evidenceState: "RECEIPT" },
      model: { value: "claude-fable-5", evidenceState: "USER_REPORTED" },
      stages: {
        available: stage("RECEIPT", 12),
        eligible: stage("RECEIPT", 9),
        shown: stage("RECEIPT", 6),
        consulted: stage("USER_REPORTED", 4),
        actedThrough: stage("RECEIPT", 2),
        checked: stage("INACCESSIBLE", null)
      }
    },
    coverage: {
      limits: { maxEntries: 500 },
      inspectedEntries: 128,
      inspectedBytes: 402211,
      exclusions: [{ path: "node_modules", reason: "generated output" }],
      limitReached: false
    },
    ...overrides
  };
}

function normalizedRoot(overrides = {}) {
  const { report } = normalizeHarnessReport(contractReport(overrides), { now: () => NOW });
  return report;
}

function envelopeFor(reports, options = {}) {
  return buildHarnessFlow({
    readExport: () => ({ status: "ok", source: "harness-flow-export.json", reports }),
    now: () => NOW,
    ...options
  });
}

test("fresh envelope renders an ok banner with source, generation time, and age", () => {
  const vm = buildHarnessFlowViewModel(envelopeFor([contractReport()]));
  assert.equal(vm.status, "fresh");
  assert.equal(vm.statusLabel, "Fresh");
  assert.equal(vm.tone, "ok");
  assert.equal(vm.sourceLabel, "harness-flow-export.json");
  assert.equal(vm.ageLabel, "15m old");
  assert.notEqual(vm.generatedAtLabel, "generation time unknown");
  assert.equal(vm.reason, null);
  assert.ok(vm.root);
});

test("stale envelope keeps the report visible behind a warn banner with the reason", () => {
  const vm = buildHarnessFlowViewModel(
    envelopeFor([contractReport({ generatedAt: "2026-07-19T08:00:00Z" })], { maxAgeMinutes: 90 })
  );
  assert.equal(vm.status, "stale");
  assert.equal(vm.tone, "warn");
  assert.match(vm.reason, /stale after 90/);
  assert.ok(vm.root, "stale report body still renders");
});

test("unavailable and malformed envelopes render bad banners without a fabricated report", () => {
  const unavailable = buildHarnessFlowViewModel(
    buildHarnessFlow({
      readExport: () => ({ status: "unavailable", source: "x.json", reason: "gone" }),
      now: () => NOW
    })
  );
  assert.equal(unavailable.tone, "bad");
  assert.equal(unavailable.statusLabel, "Unavailable");
  assert.equal(unavailable.root, null);
  assert.equal(unavailable.reason, "gone");

  const malformed = buildHarnessFlowViewModel(envelopeFor([{ schemaVersion: 1 }]));
  assert.equal(malformed.status, "malformed");
  assert.equal(malformed.tone, "bad");
  assert.equal(malformed.root, null);
  assert.ok(malformed.reason);
});

test("the root flow renders all seven stages in order with distinct evidence states", () => {
  const vm = buildReportViewModel(normalizedRoot());
  assert.deepEqual(vm.stages.map((entry) => entry.key), [...HARNESS_FLOW_STAGE_KEYS]);
  assert.deepEqual(
    vm.stages.map((entry) => entry.label),
    ["Available", "Eligible", "Shown", "Consulted", "Acted through", "Checked", "Accepted"]
  );
  const byKey = Object.fromEntries(vm.stages.map((entry) => [entry.key, entry]));
  assert.equal(byKey.available.tone, "ok");
  assert.equal(byKey.available.valueLabel, "12");
  assert.equal(byKey.consulted.evidenceState, "USER_REPORTED");
  assert.equal(byKey.consulted.tone, "warn");
  assert.equal(byKey.checked.evidenceState, "INACCESSIBLE");
  assert.equal(byKey.checked.tone, "bad");
  assert.equal(byKey.accepted.evidenceState, "INACCESSIBLE");
  assert.equal(byKey.accepted.present, false);
  assert.equal(byKey.accepted.valueLabel, "—");
});

test("surface, model, and receipt render their own evidence and tones", () => {
  const vm = buildReportViewModel(normalizedRoot());
  assert.equal(vm.surface.valueLabel, "claude-code");
  assert.equal(vm.surface.tone, "ok");
  assert.equal(vm.model.evidenceState, "USER_REPORTED");
  assert.equal(vm.model.tone, "warn");
  assert.equal(vm.receipt.status, "present");
  assert.equal(vm.receipt.tone, "ok");

  const missingReceipt = buildReportViewModel(
    normalizedRoot({ run: { receipt: { status: "missing", reason: "no client receipt" }, stages: {} } })
  );
  assert.equal(missingReceipt.receipt.tone, "bad");
  assert.equal(missingReceipt.receipt.reason, "no client receipt");
});

test("setup controls render separately from run stages and never leak full hashes", () => {
  const vm = buildReportViewModel(normalizedRoot());
  assert.equal(vm.controls.length, 1);
  assert.equal(vm.controls[0].name, "AGENTS.md");
  assert.equal(vm.controls[0].bytesLabel, "8.9 KB");
  assert.equal(vm.controls[0].sha256Prefix.length, 12);
  assert.equal(vm.controls[0].runtimeTone, "ok");
});

test("component drill-down carries coverage, exclusions, and limit state", () => {
  const vm = buildHarnessFlowViewModel(envelopeFor([
    contractReport(),
    contractReport({
      scope: { label: "Command Information Center", kind: "component" },
      coverage: {
        limits: { maxEntries: 100, maxBytes: 1048576 },
        inspectedEntries: 100,
        inspectedBytes: 1048576,
        exclusions: ["dist", { path: "data/cic.sqlite", reason: "runtime state" }],
        limitReached: true
      }
    })
  ]));
  assert.equal(vm.components.length, 1);
  const component = vm.components[0];
  assert.equal(component.label, "Command Information Center");
  assert.equal(component.status, "ok");
  const coverage = component.report.coverage;
  assert.equal(coverage.limitReached, true);
  assert.equal(coverage.inspectedLabel, "100 entries · 1.0 MB");
  assert.deepEqual(coverage.exclusions.map((entry) => entry.label), ["dist", "data/cic.sqlite"]);
  assert.equal(coverage.exclusions[1].reason, "runtime state");
  assert.deepEqual(coverage.limits.map((entry) => entry.key), ["maxEntries", "maxBytes"]);
});

test("a malformed component renders its reason instead of an invented report", () => {
  const vm = buildHarnessFlowViewModel(envelopeFor([
    contractReport(),
    contractReport({ scope: { label: "Forge", kind: "component" }, schemaVersion: 3 })
  ]));
  const component = vm.components[0];
  assert.equal(component.status, "malformed");
  assert.equal(component.label, "Forge");
  assert.ok(component.reason);
  assert.equal(component.report, null);
});

test("a stale component keeps its report and exposes a warning presentation", () => {
  const vm = buildHarnessFlowViewModel(envelopeFor([
    contractReport(),
    contractReport({
      scope: { label: "Forge", kind: "component" },
      generatedAt: "2026-07-19T08:00:00Z"
    })
  ]));
  const component = vm.components[0];
  assert.equal(component.status, "stale");
  assert.equal(component.tone, "warn");
  assert.match(component.reason, /stale after 90/);
  assert.ok(component.report);
  assert.equal(component.report.ageLabel, "4h old");
});

test("loading state and formatting helpers stay honest", () => {
  const vm = buildHarnessFlowViewModel(null);
  assert.equal(vm.status, "loading");
  assert.equal(vm.root, null);
  assert.equal(evidenceTone("SOMETHING_ELSE"), "bad");
  assert.equal(formatAge(null), "age unknown");
  assert.equal(formatAge(0), "generated just now");
  assert.equal(formatAge(61), "1h old");
  assert.equal(formatBytes(null), "—");
  assert.equal(Object.keys(HARNESS_STAGE_LABELS).length, 7);
});
