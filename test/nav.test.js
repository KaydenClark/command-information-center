import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("visible navigation is limited to the approved page set", () => {
  const source = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  const navBlock = source.match(/export const NAV_ITEMS = \[([\s\S]*?)\];/);
  assert.ok(navBlock, "NAV_ITEMS config should be present");

  const labels = [...navBlock[1].matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, [
    "Dashboard",
    "Intelligence",
    "Briefing",
    "Kanban",
    "Calendar",
    "Projects",
    "Deployments",
    "Inbox",
    "Finance",
    "Music"
  ]);
  assert.equal(labels.includes("Drive"), false);
  assert.equal(labels.includes("Settings"), false);
  assert.equal(labels.includes("Code"), false);
});
