import test from "node:test";
import assert from "node:assert/strict";
import { buildSkillsViewModel } from "../src/skillCatalogModel.js";

const NOW = new Date("2026-07-21T12:00:00.000Z").getTime();

function okPayload(overrides = {}) {
  return {
    source: "skills/README.md",
    checkedAt: "2026-07-21T11:58:00.000Z",
    status: "ok",
    detail: "Read-only skill catalog with per-entry provenance and canon-versus-deployed drift.",
    catalog: { path: "/canon/README.md", status: "ok", detail: "Parsed 1 catalog entries.", reflectedAt: "2026-07-21T10:00:00.000Z" },
    deployed: { root: "/deployed", status: "ok", detail: "Read-only comparison.", reflectedAt: "2026-07-21T09:00:00.000Z" },
    entries: [
      {
        name: "ask-workbench",
        definition: "Route a situation to the smallest skill.",
        lane: "Native",
        availability: "Active",
        expectedDeployed: true,
        drift: "in_sync",
        source: "skills/README.md",
        canon: { path: "/canon/ask-workbench/SKILL.md", reflectedAt: "2026-07-21T10:00:00.000Z" },
        deployed: { path: "/deployed/ask-workbench/SKILL.md", present: true, reflectedAt: "2026-07-21T09:00:00.000Z" }
      }
    ],
    counts: { total: 1, active: 1, pending: 0, inSync: 1, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 },
    ...overrides
  };
}

test("buildSkillsViewModel renders the in-sync happy-path entry with a freshness and drift badge", () => {
  const vm = buildSkillsViewModel(okPayload(), NOW);
  assert.equal(vm.status, "ok");
  assert.equal(vm.statusLabel, "In sync");
  assert.equal(vm.tone, "ok");
  assert.equal(vm.entries.length, 1);
  const entry = vm.entries[0];
  assert.equal(entry.name, "ask-workbench");
  assert.equal(entry.definition, "Route a situation to the smallest skill.");
  assert.equal(entry.lane, "Native");
  assert.equal(entry.availability, "Active");
  assert.equal(entry.driftLabel, "In sync");
  assert.equal(entry.driftTone, "ok");
  // 2h old relative to NOW; freshness never renders fresher than its source.
  assert.equal(entry.freshnessLabel, "Updated 2h ago");
});

test("buildSkillsViewModel classifies drifted, missing, deployed-only, pending, and unknown entries", () => {
  const cases = [
    ["drifted", "Drifted", "warn"],
    ["missing", "Missing from deployment", "bad"],
    ["deployed_only", "Deployed only", "warn"],
    ["not_applicable", "Pending — not deployed", "neutral"],
    ["unknown", "Drift unknown", "warn"]
  ];
  for (const [drift, label, tone] of cases) {
    const payload = okPayload();
    payload.entries[0].drift = drift;
    const vm = buildSkillsViewModel(payload, NOW);
    assert.equal(vm.entries[0].driftLabel, label, `drift=${drift}`);
    assert.equal(vm.entries[0].driftTone, tone, `drift=${drift}`);
  }
});

test("buildSkillsViewModel fails closed with a visible unavailable state when the catalog source is unreadable", () => {
  const payload = {
    source: "skills/README.md",
    checkedAt: "2026-07-21T11:58:00.000Z",
    status: "unavailable",
    detail: "Canonical skill catalog is unavailable.",
    catalog: { path: "/canon/README.md", status: "unavailable", detail: "Canonical skill catalog is unavailable.", reflectedAt: null },
    deployed: { root: "/deployed", status: "unknown", detail: "Catalog unavailable; deployment not evaluated.", reflectedAt: null },
    entries: [],
    counts: { total: 0, active: 0, pending: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 }
  };
  const vm = buildSkillsViewModel(payload, NOW);
  assert.equal(vm.status, "unavailable");
  assert.equal(vm.statusLabel, "Unavailable");
  assert.equal(vm.tone, "bad");
  assert.equal(vm.entries.length, 0);
  assert.match(vm.detail, /unavailable/i);
});

test("buildSkillsViewModel never renders fresher than its source without a payload", () => {
  const vm = buildSkillsViewModel(null, NOW);
  assert.equal(vm.status, "unavailable");
  assert.equal(vm.checkedAtLabel, "Never updated");
  assert.deepEqual(vm.entries, []);
});
