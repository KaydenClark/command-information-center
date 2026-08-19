import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Foundry primary navigation stays separate from the reachable Personal shelf", () => {
  const source = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const navBlock = source.match(/export const NAV_ITEMS = \[([\s\S]*?)\];/);
  const personalBlock = source.match(/export const PERSONAL_NAV_ITEMS = \[([\s\S]*?)\];/);
  assert.ok(navBlock, "NAV_ITEMS config should be present");
  assert.ok(personalBlock, "PERSONAL_NAV_ITEMS config should be present");

  const labels = [...navBlock[1].matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, [
    "Command Deck",
    "Awaiting You",
    "Foundry Intelligence",
    "Steward's Summary",
    "Master Taskboard",
    "Scheduling",
    "Projects",
    "Deployments",
    "Foundry",
    "Skills"
  ]);
  assert.equal(labels.includes("Drive"), false);
  assert.equal(labels.includes("Settings"), false);
  assert.equal(labels.includes("Code"), false);

  const personalLabels = [...personalBlock[1].matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(personalLabels, ["Inbox", "Finance", "Music"]);
  assert.equal(labels.some((label) => personalLabels.includes(label)), false);
});
