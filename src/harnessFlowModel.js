export const HARNESS_STAGE_LABELS = Object.freeze({
  available: "Available",
  eligible: "Eligible",
  shown: "Shown",
  consulted: "Consulted",
  actedThrough: "Acted through",
  checked: "Checked",
  accepted: "Accepted"
});

const STATUS_PRESENTATION = Object.freeze({
  fresh: { label: "Fresh", tone: "ok" },
  stale: { label: "Stale", tone: "warn" },
  malformed: { label: "Malformed", tone: "bad" },
  unavailable: { label: "Unavailable", tone: "bad" }
});

export function evidenceTone(state) {
  if (state === "RECEIPT") return "ok";
  if (state === "USER_REPORTED") return "warn";
  return "bad";
}

export function formatEvidenceValue(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function formatAge(minutes) {
  if (!Number.isFinite(minutes)) return "age unknown";
  if (minutes < 1) return "generated just now";
  if (minutes < 60) return `${minutes}m old`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 60)}h old`;
  return `${Math.round(minutes / (60 * 24))}d old`;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatGeneratedAt(iso) {
  if (!iso) return "generation time unknown";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "generation time unknown";
  return new Date(parsed).toLocaleString();
}

function evidenceNodeViewModel(node) {
  const state = node && node.present ? node.evidenceState : "INACCESSIBLE";
  return {
    valueLabel: node && node.present ? formatEvidenceValue(node.value) : "—",
    evidenceState: state,
    tone: evidenceTone(state)
  };
}

function receiptTone(status) {
  if (status === "present") return "ok";
  if (status === "missing" || status === "invalid") return "bad";
  return "warn";
}

function coverageViewModel(coverage) {
  if (!coverage) return null;
  const limits = Object.entries(coverage.limits || {}).map(([key, value]) => ({
    key,
    value: String(value)
  }));
  const inspectedParts = [];
  if (Number.isFinite(coverage.inspectedEntries)) {
    inspectedParts.push(`${coverage.inspectedEntries} entries`);
  }
  if (Number.isFinite(coverage.inspectedBytes)) {
    inspectedParts.push(formatBytes(coverage.inspectedBytes));
  }
  return {
    limits,
    inspectedLabel: inspectedParts.length
      ? inspectedParts.join(" · ")
      : "inspection counts unavailable",
    exclusions: (coverage.exclusions || []).map((entry) => ({
      label: entry.label,
      reason: entry.reason || null
    })),
    excludedCount: coverage.excludedCount || 0,
    limitReached: coverage.limitReached === true
  };
}

export function buildReportViewModel(report) {
  if (!report || !["ok", "stale"].includes(report.status)) return null;
  return {
    scopeLabel: report.scope.label,
    scopeKind: report.scope.kind,
    generatedAtLabel: formatGeneratedAt(report.generatedAt),
    ageLabel: formatAge(report.ageMinutes),
    receipt: {
      status: report.run.receipt.status,
      reason: report.run.receipt.reason,
      tone: receiptTone(report.run.receipt.status)
    },
    surface: evidenceNodeViewModel(report.run.surface),
    model: evidenceNodeViewModel(report.run.model),
    stages: report.run.stages.map((stage) => ({
      key: stage.key,
      label: HARNESS_STAGE_LABELS[stage.key] || stage.key,
      valueLabel: stage.present ? formatEvidenceValue(stage.value) : "—",
      evidenceState: stage.present ? stage.evidenceState : "INACCESSIBLE",
      tone: evidenceTone(stage.present ? stage.evidenceState : "INACCESSIBLE"),
      present: stage.present === true
    })),
    controls: (report.setup?.controls || []).map((control) => ({
      name: control.name,
      kind: control.kind || "control",
      bytesLabel: formatBytes(control.bytes),
      sha256Prefix: control.sha256Prefix,
      runtime: control.runtime,
      runtimeTone: evidenceTone(control.runtime)
    })),
    coverage: coverageViewModel(report.coverage)
  };
}

export function buildHarnessFlowViewModel(envelope) {
  if (!envelope) {
    return {
      status: "loading",
      statusLabel: "Loading",
      tone: "warn",
      reason: null,
      sourceLabel: "source unknown",
      generatedAtLabel: "generation time unknown",
      ageLabel: "age unknown",
      root: null,
      components: []
    };
  }
  const presentation = STATUS_PRESENTATION[envelope.status]
    || { label: "Unavailable", tone: "bad" };
  return {
    status: envelope.status,
    statusLabel: presentation.label,
    tone: presentation.tone,
    reason: envelope.reason || null,
    sourceLabel: envelope.source || "source unknown",
    generatedAtLabel: formatGeneratedAt(envelope.generatedAt),
    ageLabel: Number.isFinite(envelope.ageMinutes)
      ? formatAge(envelope.ageMinutes)
      : "age unknown",
    skippedReports: envelope.skippedReports || 0,
    root: buildReportViewModel(envelope.root),
    components: (envelope.components || []).map((component, index) => ({
      key: `${component.scope?.label || "component"}-${index}`,
      label: component.scope?.label || "Unknown component",
      status: component.status,
      tone: component.status === "ok" ? "ok" : component.status === "stale" ? "warn" : "bad",
      reason: component.reason || null,
      report: buildReportViewModel(component)
    }))
  };
}
