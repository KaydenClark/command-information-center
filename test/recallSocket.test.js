import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../server/app.js";
import {
  RECALL_SOCKET_ID,
  RECALL_ENTRYPOINT,
  RECALL_REQUIRED_FIELDS,
  RECALL_FRESHNESS_STATES,
  assertResolvedViaContract,
  recallConformanceErrors,
  resolveRecall,
  toRecallCard,
  createDemoContractClient
} from "../server/recallSocket.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// A well-behaved contract client that returns a conforming recall response.
const contractClient = {
  socketId: RECALL_SOCKET_ID,
  access: "contract",
  entrypoint: RECALL_ENTRYPOINT,
  async query() {
    return {
      value: "K-003 interface is bound to P-005 Command Information Center.",
      source: { vault: "machine", path: "Machine/Project Source Registry.md", title: "Project Source Registry", origin: "wiki" },
      freshness: { state: "fresh", asOf: "2026-07-20T00:00:00Z" }
    };
  }
};

// A reach-around client that would read OpenBrain's files directly.
const reachAroundClient = {
  socketId: RECALL_SOCKET_ID,
  access: "filesystem",
  entrypoint: "openbrain.readFile",
  async query() {
    return { value: "leaked from disk", source: {}, freshness: "fresh" };
  }
};

test("resolveRecall resolves a conforming value THROUGH the K-001 contract", async () => {
  const response = await resolveRecall({ client: contractClient, request: { query: "who fills interface?" } });
  for (const field of RECALL_REQUIRED_FIELDS) assert.ok(field in response, `must carry '${field}'`);
  assert.deepEqual(recallConformanceErrors(response), []);
  const card = toRecallCard(response, { query: "who fills interface?" });
  assert.match(card.value, /Command Information Center/);
  assert.equal(card.provenance.path, "machine/Machine/Project Source Registry.md");
  assert.equal(card.freshness.state, "fresh");
  assert.equal(card.resolvedVia, "contract");
  assert.equal(card.entrypoint, "recall.query");
});

// THE NEGATIVE CHECK: resolution must FAIL if it bypasses the contract into
// OpenBrain's files. This is the S-014 no-reach-around proof.
test("resolveRecall REJECTS a reach-around into OpenBrain's files", async () => {
  await assert.rejects(
    () => resolveRecall({ client: reachAroundClient, request: { query: "anything" } }),
    /reach-around rejected/
  );
  assert.throws(() => assertResolvedViaContract({ access: "database", entrypoint: RECALL_ENTRYPOINT }), /reach-around/);
  assert.throws(() => assertResolvedViaContract({ access: "contract", entrypoint: "wrong" }), /does not match the K-001 contract/);
});

test("conformance check has teeth: missing provenance or bad freshness rejected", () => {
  assert.ok(recallConformanceErrors({ value: "x", freshness: "fresh" }).some((e) => e.includes("'source'")));
  assert.ok(recallConformanceErrors({ value: "x", source: {}, freshness: "nope" }).some((e) => e.includes("freshness")));
  assert.ok(recallConformanceErrors({ value: "x", source: "str", freshness: "fresh" }).some((e) => e.includes("provenance")));
});

test("constants stay in sync with the vendored K-001 contract", () => {
  const contract = JSON.parse(fs.readFileSync(path.join(here, "../server/recallSocket.contract.json"), "utf8"));
  assert.equal(contract.socketId, RECALL_SOCKET_ID);
  assert.equal(contract.entrypoint, RECALL_ENTRYPOINT);
  assert.deepEqual(contract.response.required, RECALL_REQUIRED_FIELDS);
  assert.deepEqual(contract.response.freshnessStates, RECALL_FRESHNESS_STATES);
});

test("the demo client resolves via the contract, not a reach-around", async () => {
  const client = createDemoContractClient({ asOf: "2026-07-20T00:00:00Z" });
  assert.equal(client.access, "contract");
  assert.equal(client.entrypoint, RECALL_ENTRYPOINT);
  const response = await resolveRecall({ client, request: { query: "interface socket?" } });
  assert.deepEqual(recallConformanceErrors(response), []);
});

test("GET /api/recall renders one recall value resolved through the contract", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-recall-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    port: 0,
    queryWikiUrl: "",
    queryWikiAccessToken: "",
    supabaseUrl: "",
    supabaseServiceRoleKey: "",
    openAiApiKey: ""
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/recall`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.contract.socket, "K-001");
    assert.equal(body.contract.entrypoint, "recall.query");
    assert.equal(body.demo, true); // no OpenBrain creds → hermetic demo contract client
    assert.ok(body.card.value);
    assert.ok(body.card.provenance.path);
    assert.ok(RECALL_FRESHNESS_STATES.includes(body.card.freshness.state));
    assert.equal(body.card.resolvedVia, "contract");
  } finally {
    server.close();
  }
});
