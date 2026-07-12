import fs from "node:fs";

const ALLOWED_STATUSES = new Set(["healthy", "degraded", "failed", "skipped", "unknown"]);
const CHECK_NAMES = ["repositories", "contract", "openbrain", "cic"];

function safeDetail(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 240) : "";
}

function sanitizeCheck(value) {
  if (!value || typeof value !== "object") return { status: "unknown", detail: "No result recorded." };
  const status = ALLOWED_STATUSES.has(value.status) ? value.status : "unknown";
  return { status, detail: safeDetail(value.detail) };
}

export function readPlatformHealth(filePath, options = {}) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { configured: false, status: "not_configured", checkedAt: null, mode: null, stale: false, checks: {} };
  }

  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size > 1024 * 1024) throw new Error("Platform health report is not a valid file.");
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const checkedAtMs = Date.parse(report.checkedAt);
    if (report.schemaVersion !== 1 || !Number.isFinite(checkedAtMs)) {
      throw new Error("Platform health report has an unsupported schema.");
    }

    const now = options.now ?? Date.now();
    const maxAgeMinutes = options.maxAgeMinutes ?? 90;
    const stale = now - checkedAtMs > maxAgeMinutes * 60_000;
    const checks = Object.fromEntries(
      CHECK_NAMES.filter((name) => report.checks?.[name]).map((name) => [name, sanitizeCheck(report.checks[name])])
    );

    return {
      configured: true,
      status: stale ? "stale" : ALLOWED_STATUSES.has(report.overall) ? report.overall : "unknown",
      checkedAt: new Date(checkedAtMs).toISOString(),
      mode: report.mode === "live" ? "live" : "portable",
      stale,
      checks
    };
  } catch (error) {
    return {
      configured: true,
      status: "error",
      checkedAt: null,
      mode: null,
      stale: false,
      checks: {},
      detail: safeDetail(error instanceof Error ? error.message : "Platform health report could not be read.")
    };
  }
}
