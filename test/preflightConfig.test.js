import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const configUrl = new URL("../tools/protected-checkouts.json", import.meta.url);

function loadProtectedCheckouts() {
  try {
    return JSON.parse(fs.readFileSync(configUrl, "utf8"));
  } catch (error) {
    throw new Error(`protected-config-unreadable: ${error.message}`);
  }
}

test("CIC launch Preflight has an explicit public-safe protected-checkout policy", () => {
  const config = loadProtectedCheckouts();

  assert.equal(typeof config.note, "string");
  assert.match(config.note, /CIC/);
  assert.deepEqual(config.checkouts, []);
});
