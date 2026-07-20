// Recall socket (K-001) consumer binding for CIC — GPT_OS S-014 TK-004.
//
// CIC is the interface layer. This module resolves ONE recall value THROUGH the
// declared K-001 socket contract (entrypoint `recall.query`) and renders it with
// provenance + freshness. The hard gate: a connection that reaches around the
// contract — reading OpenBrain's files or database directly — is rejected, never
// rendered. The Forge artifact (tools/socket-registry/registry.json) is the
// canonical contract; server/recallSocket.contract.json is a vendored copy whose
// obligations are enforced here and checked against these constants by the tests.

export const RECALL_SOCKET_ID = "K-001";
export const RECALL_ENTRYPOINT = "recall.query";
export const RECALL_REQUIRED_FIELDS = ["value", "source", "freshness"];
export const RECALL_FRESHNESS_STATES = ["fresh", "stale", "offline", "unknown"];

// The no-reach-around hard gate. A recall connection must declare it resolves
// via the socket contract at the declared entrypoint. Anything else — a
// filesystem path or database handle into OpenBrain — throws instead of
// resolving. This is the check that FAILS if resolution bypasses the contract.
export function assertResolvedViaContract(connection) {
  if (!connection || typeof connection !== "object") {
    throw new Error("recall connection is missing; cannot prove contract resolution");
  }
  if (connection.access !== "contract") {
    throw new Error(
      `recall reach-around rejected: access '${connection.access}' bypasses the K-001 socket contract. ` +
        `CIC must resolve recall through the entrypoint '${RECALL_ENTRYPOINT}', not by reading OpenBrain's files or database.`
    );
  }
  if (connection.entrypoint !== RECALL_ENTRYPOINT) {
    throw new Error(
      `recall connection entrypoint '${connection.entrypoint}' does not match the K-001 contract '${RECALL_ENTRYPOINT}'`
    );
  }
  return true;
}

export function recallConformanceErrors(response) {
  const errors = [];
  if (response === null || typeof response !== "object" || Array.isArray(response)) {
    return ["recall response must be an object"];
  }
  for (const field of RECALL_REQUIRED_FIELDS) {
    if (!(field in response)) errors.push(`missing required field '${field}'`);
  }
  if ("source" in response && (response.source === null || typeof response.source !== "object")) {
    errors.push("source (provenance) must be an object");
  }
  if ("freshness" in response) {
    const state = response.freshness && typeof response.freshness === "object"
      ? response.freshness.state
      : response.freshness;
    if (!RECALL_FRESHNESS_STATES.includes(state)) {
      errors.push(`freshness '${state}' must be one of ${RECALL_FRESHNESS_STATES.join(" | ")}`);
    }
  }
  return errors;
}

// Resolve a recall value THROUGH the contract. `client` must be a contract
// client that declares { access: 'contract', entrypoint: 'recall.query' } and
// exposes query(request) -> { value, source, freshness }. The gate runs BEFORE
// any query, so a reach-around client never even executes.
export async function resolveRecall({ client, request }) {
  assertResolvedViaContract(client);
  const response = await client.query(request);
  const errors = recallConformanceErrors(response);
  if (errors.length) {
    throw new Error(`recall response violates the K-001 contract: ${errors.join("; ")}`);
  }
  return response;
}

// Map a conforming recall response into a render model for the panel.
export function toRecallCard(response, request = {}) {
  const source = response.source || {};
  const freshness = normalizeFreshness(response.freshness);
  const pathLabel = [source.vault, source.path].filter(Boolean).join("/") || source.title || "unknown source";
  return {
    socket: `${RECALL_SOCKET_ID} recall`,
    entrypoint: RECALL_ENTRYPOINT,
    resolvedVia: "contract",
    query: request.query ?? request.id ?? null,
    value: response.value ?? null,
    provenance: {
      title: source.title ?? null,
      path: pathLabel,
      origin: source.origin ?? null
    },
    freshness
  };
}

export function normalizeFreshness(freshness) {
  const state = freshness && typeof freshness === "object" ? freshness.state : freshness;
  const asOf = freshness && typeof freshness === "object" ? freshness.asOf ?? null : null;
  return {
    state: RECALL_FRESHNESS_STATES.includes(state) ? state : "unknown",
    asOf
  };
}

// Build a K-001 contract client over OpenBrain's query-wiki entrypoint (the HTTP
// contract boundary — never a file/DB reach-around). `queryImpl(config, query,
// options)` is CIC's existing openbrainClient.queryOpenBrain. It maps the recall
// backend's top match into the { value, source, freshness } contract shape.
export function createOpenBrainContractClient({ config, queryImpl, matchThreshold }) {
  return {
    socketId: RECALL_SOCKET_ID,
    entrypoint: RECALL_ENTRYPOINT,
    access: "contract",
    async query(request) {
      const outcome = await queryImpl(config, request.query, { matchThreshold });
      const results = Array.isArray(outcome?.results) ? outcome.results : [];
      const top = results[0] || null;
      const configured = outcome?.status !== "not_configured";
      return {
        value: top ? (top.content ?? top.title ?? null) : null,
        source: top
          ? { vault: top.vault ?? null, path: top.path ?? null, title: top.title ?? null, origin: top.source ?? "wiki" }
          : { vault: null, path: null, title: null, origin: "openbrain-index" },
        freshness: {
          state: !configured ? "offline" : results.length ? "fresh" : "offline",
          asOf: outcome?.retrievedAt ?? null
        }
      };
    }
  };
}

// A hermetic demo contract client: resolves a real, verifiable fact from the
// canonical vault registry THROUGH the contract, so the panel and the contract
// path can be demoed with no live OpenBrain credentials. Still access:'contract'
// at the declared entrypoint — it proves the seam, not a reach-around.
export function createDemoContractClient({ asOf } = {}) {
  return {
    socketId: RECALL_SOCKET_ID,
    entrypoint: RECALL_ENTRYPOINT,
    access: "contract",
    demo: true,
    async query(request) {
      return {
        value: "K-003 (interface socket) is bound to P-005 Command Information Center.",
        source: {
          vault: "machine",
          path: "Machine/Project Source Registry.md",
          title: "Project Source Registry",
          origin: "wiki"
        },
        freshness: { state: "fresh", asOf: asOf ?? null },
        query: request?.query ?? request?.id ?? null
      };
    }
  };
}
