import { formatFreshnessAge } from "./freshness.js";

// S-022 TK-001: pure view-model builder for the read-only Skills catalog.
// Converts the GET /api/skills payload (server/skillCatalog.js) into display
// strings and tones; renders nothing itself so it stays testable without a
// browser (see test/skillCatalogModel.test.js and test/skillsReact.test.js).

const STATUS_PRESENTATION = Object.freeze({
  ok: { label: "In sync", tone: "ok" },
  degraded: { label: "Degraded", tone: "warn" },
  unavailable: { label: "Unavailable", tone: "bad" }
});

const DRIFT_PRESENTATION = Object.freeze({
  in_sync: { label: "In sync", tone: "ok" },
  drifted: { label: "Drifted", tone: "warn" },
  missing: { label: "Missing from deployment", tone: "bad" },
  deployed_only: { label: "Deployed only", tone: "warn" },
  not_applicable: { label: "Pending — not deployed", tone: "neutral" },
  unknown: { label: "Drift unknown", tone: "warn" }
});

function statusPresentation(status) {
  return STATUS_PRESENTATION[status] || { label: "Unavailable", tone: "bad" };
}

function driftPresentation(drift) {
  return DRIFT_PRESENTATION[drift] || { label: "Drift unknown", tone: "warn" };
}

function sourcePresentation(node, fallbackLabel) {
  if (!node) return { statusLabel: fallbackLabel, tone: "bad", detail: "" };
  const tone = node.status === "ok" ? "ok" : node.status === "unknown" ? "warn" : "bad";
  return {
    statusLabel: node.status === "ok" ? "Readable" : node.status === "unknown" ? "Unknown" : "Unavailable",
    tone,
    detail: node.detail || ""
  };
}

function entryViewModel(entry, now) {
  const drift = driftPresentation(entry.drift);
  const freshnessSource = entry.canon?.reflectedAt || entry.deployed?.reflectedAt || null;
  return {
    name: entry.name,
    definition: entry.definition || "No definition recorded.",
    lane: entry.lane || "—",
    availability: entry.availability || "—",
    source: entry.source,
    driftLabel: drift.label,
    driftTone: drift.tone,
    freshnessLabel: formatFreshnessAge(freshnessSource, now),
    canonPath: entry.canon?.path || null,
    deployedPath: entry.deployed?.path || null
  };
}

// Builds the Skills view model. `payload` is the raw GET /api/skills body;
// `now` (ms epoch, injectable for tests) anchors freshness-age labels so
// nothing ever renders as fresher than its source.
export function buildSkillsViewModel(payload, now = Date.now()) {
  if (!payload) {
    return {
      status: "unavailable",
      statusLabel: "Unavailable",
      tone: "bad",
      detail: "The skill catalog has not loaded yet.",
      sourceLabel: "",
      checkedAtLabel: formatFreshnessAge(null, now),
      catalog: { statusLabel: "Unavailable", tone: "bad", detail: "" },
      deployed: { statusLabel: "Unavailable", tone: "bad", detail: "" },
      counts: { total: 0, active: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0 },
      entries: []
    };
  }

  const status = statusPresentation(payload.status);
  return {
    status: payload.status,
    statusLabel: status.label,
    tone: status.tone,
    detail: payload.detail || "",
    sourceLabel: payload.source || "skills/README.md",
    checkedAtLabel: formatFreshnessAge(payload.checkedAt, now),
    catalog: sourcePresentation(payload.catalog, "Unavailable"),
    deployed: sourcePresentation(payload.deployed, "Unavailable"),
    counts: payload.counts || { total: 0, active: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0 },
    entries: (payload.entries || []).map((entry) => entryViewModel(entry, now))
  };
}
