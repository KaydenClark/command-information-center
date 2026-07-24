import test from "node:test";
import assert from "node:assert/strict";
import { buildSkillsViewModel } from "../src/skillCatalogModel.js";
import { fullCatalogPayload, FULL_CATALOG_ORDER } from "./fixtures/skillCatalogPayload.js";

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

test("buildSkillsViewModel widens to every catalog entry, preserving catalog order (TK-002)", () => {
  const vm = buildSkillsViewModel(fullCatalogPayload(), NOW);
  // Every entry in the payload is rendered, none dropped or reordered.
  assert.equal(vm.entries.length, FULL_CATALOG_ORDER.length);
  assert.deepEqual(vm.entries.map((entry) => entry.name), FULL_CATALOG_ORDER);
  // Each entry carries its own name, definition, lane, availability.
  const grilling = vm.entries[0];
  assert.equal(grilling.name, "grilling");
  assert.equal(grilling.definition, "Question-at-a-time interview primitive.");
  assert.equal(grilling.lane, "Core rewrite");
  assert.equal(grilling.availability, "Active");
});

test("buildSkillsViewModel exposes per-entry provenance and freshness (TK-002)", () => {
  const vm = buildSkillsViewModel(fullCatalogPayload(), NOW);
  const byName = Object.fromEntries(vm.entries.map((entry) => [entry.name, entry]));

  // Catalog-sourced entries name their source file and canon path.
  assert.equal(byName["ask-workbench"].provenanceLabel, "skills/README.md");
  assert.equal(byName["ask-workbench"].canonPath, "skills/ask-workbench/SKILL.md");
  assert.equal(byName["ask-workbench"].deployedPath, ".claude/skills/ask-workbench/SKILL.md");

  // Deployed-only entries carry the deployed source, not the catalog file.
  assert.equal(byName["orphan-skill"].provenanceLabel, ".claude/skills/");
  assert.equal(byName["orphan-skill"].canonPath, null);
  assert.equal(byName["orphan-skill"].deployedPath, ".claude/skills/orphan-skill/SKILL.md");

  // Freshness is per-entry and derived from that entry's own source mtime, so
  // two entries with different source ages render different freshness labels.
  // Anchor NOW after the fixture source times (grilling canon 10:00,
  // orphan deployed 06:00) so the ages are distinguishable.
  const later = new Date("2026-07-24T13:00:00.000Z").getTime();
  const vmLater = buildSkillsViewModel(fullCatalogPayload(), later);
  const byNameLater = Object.fromEntries(vmLater.entries.map((entry) => [entry.name, entry]));
  assert.equal(byNameLater["grilling"].freshnessLabel, "Updated 3h ago");
  assert.equal(byNameLater["orphan-skill"].freshnessLabel, "Updated 7h ago");
  assert.notEqual(byNameLater["grilling"].freshnessLabel, byNameLater["orphan-skill"].freshnessLabel);
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
