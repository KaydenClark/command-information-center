import fs from "node:fs";
import path from "node:path";

const EXPORT_MAX_BYTES = 512 * 1024;
const SUPPORTED_SCHEMA_VERSION = 1;
const DEFAULT_MAX_AGE_MINUTES = 90;
const TEXT_LIMIT = 200;
const MAX_CONTROLS = 64;
const MAX_EXCLUSIONS = 64;
const MAX_LIMIT_KEYS = 12;
const SHA_PREFIX_LENGTH = 12;
const MAX_FUTURE_SKEW_MINUTES = 5;

export const HARNESS_FLOW_STAGE_KEYS = Object.freeze([
  "available",
  "eligible",
  "shown",
  "consulted",
  "actedThrough",
  "checked",
  "accepted"
]);

export const HARNESS_EVIDENCE_STATES = Object.freeze([
  "RECEIPT",
  "USER_REPORTED",
  "INACCESSIBLE"
]);

function clampText(value, limit = TEXT_LIMIT) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function isAbsolutePathLike(value) {
  return path.isAbsolute(value)
    || /^[A-Za-z]:[\\/]/.test(value)
    || value.startsWith("\\\\")
    || /^~[\\/]/.test(value)
    || /^file:(?:\/\/)?[\\/]/i.test(value);
}

function basenameForLabel(value) {
  const normalized = value.replaceAll("\\", "/");
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      return path.posix.basename(parsed.pathname) || parsed.hostname;
    } catch {
      // Fall through to the path-only basename for malformed URI-like input.
    }
  }
  return path.posix.basename(normalized.replace(/^file:(?:\/\/)?/i, ""));
}

function sanitizePathLabel(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const basename = basenameForLabel(trimmed);
  if (isAbsolutePathLike(trimmed) || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(trimmed)) {
    return sanitizeText(basename, 120);
  }
  const cleaned = trimmed
    .split(/[\\/]+/)
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
  return sanitizeText(cleaned || basename, 160);
}

function sanitizeText(value, limit = TEXT_LIMIT) {
  const clamped = clampText(value, limit);
  if (!clamped) return null;
  return clamped
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_-]{8,}|xox[baprs]-[A-Za-z0-9-]{8,})\b/gi, "[REDACTED]")
    .replace(/(\b[A-Za-z][A-Za-z0-9+.-]*:\/\/)[^/\s:@]+:[^@\s/]+@/g, "$1[REDACTED]@")
    .replace(/\bAuthorization\s*[:=]\s*(?:Basic|Bearer)?\s*\S+/gi, "Authorization: [REDACTED]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/\bBasic\s+[A-Za-z0-9+/=]{8,}/gi, "Basic [REDACTED]")
    .replace(/\b(?:password|passcode|token|secret|api[_ -]?key)\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/\b[a-f0-9]{32,}\b/gi, "[digest]")
    .replace(/(^|[^A-Za-z0-9_])\/[^\s,;)"']+/g, (match, prefix) => (
      `${prefix}${path.basename(match.slice(prefix.length))}`
    ))
    .replace(/\b[A-Za-z]:\\[^\s,;)"']+/g, (match) => path.win32.basename(match))
    .replace(/\\\\[^\s,;)"']+/g, (match) => path.win32.basename(match));
}

function normalizeEvidenceState(value) {
  const state = String(value || "").trim().toUpperCase();
  return HARNESS_EVIDENCE_STATES.includes(state) ? state : "INACCESSIBLE";
}

function normalizeEvidenceValue(value) {
  if (typeof value === "boolean" || value === null || value === undefined) {
    return value ?? null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return sanitizeText(value, 120);
}

function normalizeEvidenceNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return { value: null, evidenceState: "INACCESSIBLE", present: false };
  }
  return {
    value: normalizeEvidenceValue(node.value),
    evidenceState: normalizeEvidenceState(node.evidenceState),
    present: true
  };
}

function normalizeControl(control) {
  if (!control || typeof control !== "object" || Array.isArray(control)) return null;
  const name = sanitizePathLabel(control.path) || sanitizeText(control.id, 120);
  if (!name) return null;
  const sha = typeof control.sha256 === "string" && /^[a-f0-9]{64}$/i.test(control.sha256)
    ? control.sha256.slice(0, SHA_PREFIX_LENGTH).toLowerCase()
    : null;
  return {
    id: sanitizeText(control.id, 120),
    name,
    kind: sanitizeText(control.kind, 60),
    bytes: Number.isFinite(control.bytes) && control.bytes >= 0
      ? Math.floor(control.bytes)
      : null,
    sha256Prefix: sha,
    runtime: normalizeEvidenceState(control.runtime)
  };
}

function normalizeExclusion(entry) {
  if (typeof entry === "string") {
    const label = sanitizePathLabel(entry) || sanitizeText(entry, 120);
    return label ? { label, reason: null } : null;
  }
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const label = sanitizePathLabel(entry.path) || sanitizeText(entry.label, 120);
  if (!label) return null;
  return { label, reason: sanitizeText(entry.reason, 160) };
}

function normalizeCoverage(coverage) {
  const source = coverage && typeof coverage === "object" && !Array.isArray(coverage)
    ? coverage
    : {};
  const limits = {};
  if (source.limits && typeof source.limits === "object" && !Array.isArray(source.limits)) {
    for (const rawKey of Object.keys(source.limits).slice(0, MAX_LIMIT_KEYS)) {
      const key = sanitizeText(rawKey, 60);
      const value = source.limits[rawKey];
      if (!key) continue;
      if (typeof value === "number" && Number.isFinite(value)) limits[key] = value;
      else if (typeof value === "string") limits[key] = sanitizeText(value, 60);
    }
  }
  const exclusions = Array.isArray(source.exclusions)
    ? source.exclusions.slice(0, MAX_EXCLUSIONS).map(normalizeExclusion).filter(Boolean)
    : [];
  return {
    limits,
    inspectedEntries: Number.isFinite(source.inspectedEntries)
      ? Math.max(0, Math.floor(source.inspectedEntries))
      : null,
    inspectedBytes: Number.isFinite(source.inspectedBytes)
      ? Math.max(0, Math.floor(source.inspectedBytes))
      : null,
    exclusions,
    excludedCount: Array.isArray(source.exclusions) ? source.exclusions.length : 0,
    limitReached: source.limitReached === true
  };
}

function parseGeneratedAt(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function ageMinutesBetween(generated, current) {
  return Math.max(0, Math.round((current.getTime() - generated.getTime()) / 60_000));
}

export function normalizeHarnessReport(raw, { now = () => new Date() } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "Report is not an object." };
  }
  if (raw.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `Unsupported report schema version (expected ${SUPPORTED_SCHEMA_VERSION}).`
    };
  }
  const generated = parseGeneratedAt(raw.generatedAt);
  if (!generated) {
    return { ok: false, reason: "Report generation time is missing or unparseable." };
  }
  const current = now();
  const futureSkewMinutes = (generated.getTime() - current.getTime()) / 60_000;
  if (futureSkewMinutes > MAX_FUTURE_SKEW_MINUTES) {
    return { ok: false, reason: "Report generation time is too far in the future." };
  }
  const scopeLabel = raw.scope && typeof raw.scope === "object"
    ? sanitizePathLabel(raw.scope.label) || sanitizeText(raw.scope.label, 120)
    : null;
  const scopeKind = raw.scope && typeof raw.scope === "object"
    ? sanitizeText(raw.scope.kind, 40)
    : null;
  if (!scopeLabel || !scopeKind) {
    return { ok: false, reason: "Report scope label or kind is missing." };
  }

  const run = raw.run && typeof raw.run === "object" && !Array.isArray(raw.run)
    ? raw.run
    : {};
  const receipt = run.receipt && typeof run.receipt === "object" && !Array.isArray(run.receipt)
    ? run.receipt
    : {};
  const rawStages = run.stages && typeof run.stages === "object" && !Array.isArray(run.stages)
    ? run.stages
    : {};
  const controls = raw.setup && Array.isArray(raw.setup.controls)
    ? raw.setup.controls.slice(0, MAX_CONTROLS).map(normalizeControl).filter(Boolean)
    : [];

  return {
    ok: true,
    report: {
      status: "ok",
      reason: null,
      scope: { label: scopeLabel, kind: scopeKind },
      generatedAt: generated.toISOString(),
      ageMinutes: ageMinutesBetween(generated, current),
      setup: { controls },
      run: {
        receipt: {
          status: sanitizeText(receipt.status, 60) || "unknown",
          reason: sanitizeText(receipt.reason, TEXT_LIMIT)
        },
        surface: normalizeEvidenceNode(run.surface),
        model: normalizeEvidenceNode(run.model),
        stages: HARNESS_FLOW_STAGE_KEYS.map((key) => ({
          key,
          ...normalizeEvidenceNode(rawStages[key])
        }))
      },
      coverage: normalizeCoverage(raw.coverage)
    }
  };
}

// Adapter interface:
// () => { status: "ok", source: string, reports: HarnessReport[] }
//    | { status: "unavailable" | "malformed", source: string, reason: string }
// Each reports[] entry uses the exact S-023 fixture contract. The array is only
// the export aggregation needed to carry one root and zero or more components.
export function createHarnessExportFixtureReader({
  fixturePath,
  maxBytes = EXPORT_MAX_BYTES
}) {
  const source = path.basename(String(fixturePath || "harness-flow-export.json"));
  return () => {
    let stats;
    try {
      stats = fs.statSync(fixturePath);
    } catch {
      return {
        status: "unavailable",
        source,
        reason: "Harness report export is not readable."
      };
    }
    if (!stats.isFile()) {
      return {
        status: "unavailable",
        source,
        reason: "Harness report export is not a regular file."
      };
    }
    if (stats.size > maxBytes) {
      return {
        status: "unavailable",
        source,
        reason: "Harness report export exceeds the size bound."
      };
    }
    let content;
    try {
      content = fs.readFileSync(fixturePath, "utf8");
    } catch {
      return {
        status: "unavailable",
        source,
        reason: "Harness report export is not readable."
      };
    }
    try {
      return { status: "ok", source, reports: JSON.parse(content) };
    } catch {
      return {
        status: "malformed",
        source,
        reason: "Harness report export is not valid JSON."
      };
    }
  };
}

export function buildHarnessFlow({
  readExport,
  now = () => new Date(),
  maxAgeMinutes = DEFAULT_MAX_AGE_MINUTES
}) {
  const checkedAt = now().toISOString();
  const staleAfterMinutes = Number.isFinite(maxAgeMinutes) && maxAgeMinutes >= 0
    ? maxAgeMinutes
    : DEFAULT_MAX_AGE_MINUTES;
  const envelope = (status, reason, extra = {}) => ({
    source: extra.source || "harness-flow-export",
    checkedAt,
    status,
    reason: reason || null,
    generatedAt: null,
    ageMinutes: null,
    staleAfterMinutes,
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    root: null,
    components: [],
    skippedReports: 0,
    ...extra
  });

  if (typeof readExport !== "function") {
    return envelope("unavailable", "Harness report reader is not configured.");
  }

  let result;
  try {
    result = readExport();
  } catch {
    return envelope("unavailable", "Harness report reader failed.");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return envelope("unavailable", "Harness report reader returned no result.");
  }
  const source = sanitizePathLabel(result.source)
    || sanitizeText(result.source, 120)
    || "harness-flow-export";
  if (result.status === "unavailable") {
    return envelope(
      "unavailable",
      sanitizeText(result.reason) || "Harness report export is unavailable.",
      { source }
    );
  }
  if (result.status === "malformed") {
    return envelope(
      "malformed",
      sanitizeText(result.reason) || "Harness report export is malformed.",
      { source }
    );
  }
  if (result.status !== "ok") {
    return envelope("unavailable", "Harness report reader returned an unknown status.", { source });
  }
  if (!Array.isArray(result.reports)) {
    return envelope(
      "malformed",
      "Harness report export is not an array of scope reports.",
      { source }
    );
  }

  const roots = [];
  const components = [];
  let skippedReports = 0;
  for (const raw of result.reports) {
    const kind = raw && typeof raw === "object" && raw.scope && typeof raw.scope === "object"
      ? String(raw.scope.kind || "")
      : "";
    const scopeLabel = raw && typeof raw === "object" && raw.scope && typeof raw.scope === "object"
      ? sanitizePathLabel(raw.scope.label) || sanitizeText(raw.scope.label, 120)
      : null;
    if (kind !== "root" && kind !== "component") {
      skippedReports += 1;
      continue;
    }
    const normalized = normalizeHarnessReport(raw, { now });
    const entry = normalized.ok
      ? normalized.report
      : {
          status: "malformed",
          reason: normalized.reason,
          scope: { label: scopeLabel || "Unknown scope", kind },
          generatedAt: null,
          ageMinutes: null,
          setup: null,
          run: null,
          coverage: null
        };
    if (kind === "root") roots.push(entry);
    else components.push(entry);
  }

  if (roots.length !== 1) {
    return envelope(
      "malformed",
      roots.length === 0
        ? "Harness report export contains no root Foundry scope."
        : "Harness report export contains more than one root scope.",
      { source, skippedReports }
    );
  }
  const root = roots[0];
  if (root.status === "malformed") {
    return envelope(
      "malformed",
      `Root Foundry report is malformed: ${root.reason}`,
      { source, skippedReports }
    );
  }

  const classifiedComponents = components.map((component) => {
    if (component.status !== "ok" || component.ageMinutes <= staleAfterMinutes) {
      return component;
    }
    return {
      ...component,
      status: "stale",
      reason: `Component report is ${component.ageMinutes} minutes old; stale after ${staleAfterMinutes} minutes.`
    };
  });
  const stale = root.ageMinutes > staleAfterMinutes;
  return envelope(
    stale ? "stale" : "fresh",
    stale
      ? `Report is ${root.ageMinutes} minutes old; stale after ${staleAfterMinutes} minutes.`
      : null,
    {
      source,
      generatedAt: root.generatedAt,
      ageMinutes: root.ageMinutes,
      root,
      components: classifiedComponents,
      skippedReports
    }
  );
}
