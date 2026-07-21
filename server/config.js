import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

export function getRuntimeRoot(env = process.env) {
  const configuredRoot = env.CIC_RUNTIME_ROOT;
  const candidateRoot = configuredRoot || projectRoot;

  if (!path.isAbsolute(candidateRoot)) {
    throw new Error("CIC_RUNTIME_ROOT must be an absolute existing directory.");
  }

  try {
    const canonicalRoot = fs.realpathSync(candidateRoot);
    if (!fs.statSync(canonicalRoot).isDirectory()) {
      throw new Error("not a directory");
    }
    return canonicalRoot;
  } catch {
    throw new Error("CIC_RUNTIME_ROOT must be an absolute existing directory.");
  }
}

export function loadEnv(filePath = path.join(projectRoot, ".env"), env = process.env) {
  const resolvedFilePath = filePath;
  if (!fs.existsSync(resolvedFilePath)) return;
  const lines = fs.readFileSync(resolvedFilePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key === "CIC_RUNTIME_ROOT") continue;
    if (!(key in env)) {
      env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function setEnvValue(key, value, filePath) {
  if (!filePath) throw new Error("An explicit environment file path is required.");
  const resolvedFilePath = filePath;
  const nextLine = `${key}=${value}`;
  if (!fs.existsSync(resolvedFilePath)) {
    fs.writeFileSync(resolvedFilePath, `${nextLine}\n`, { mode: 0o600 });
    return;
  }

  const lines = fs.readFileSync(resolvedFilePath, "utf8").split(/\r?\n/);
  let found = false;
  const nextLines = lines.map((line) => {
    if (!line.startsWith(`${key}=`)) return line;
    found = true;
    return nextLine;
  });
  if (!found) {
    if (nextLines.length && nextLines[nextLines.length - 1] !== "") nextLines.push("");
    nextLines.push(nextLine);
  }
  fs.writeFileSync(resolvedFilePath, nextLines.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
}

const DEFAULT_INTELLIGENCE_TTL_MS = 30 * 60 * 1000;

// Clamp to a non-negative finite number; fall back to the 30-minute default for
// blank or malformed values so a bad env var can never disable the cache silently.
function intelligenceTtlMs(raw) {
  if (raw == null || String(raw).trim() === "") return DEFAULT_INTELLIGENCE_TTL_MS;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_INTELLIGENCE_TTL_MS;
  return value;
}

export function getConfig(env = process.env) {
  const runtimeRoot = getRuntimeRoot(env);
  const envFilePath = path.join(runtimeRoot, ".env");
  loadEnv(envFilePath, env);
  return {
    runtimeRoot,
    envFilePath,
    host: env.HOST || "0.0.0.0",
    port: Number(env.PORT || 8787),
    dbPath: path.resolve(runtimeRoot, env.CIC_DB || "data/cic.sqlite"),
    dataFeedPath: path.resolve(runtimeRoot, env.CIC_DATA_FEED || "data.js"),
    projectsRoot: path.resolve(runtimeRoot, ".."),
    platformHealthReport: path.resolve(
      runtimeRoot,
      env.PLATFORM_HEALTH_REPORT || "../Personal Intelligence Platform/.local/platform-health.json"
    ),
    platformHealthMaxAgeMinutes: Number(env.PLATFORM_HEALTH_MAX_AGE_MINUTES || 90),
    harnessReportPath: env.CIC_HARNESS_REPORT
      ? path.resolve(runtimeRoot, env.CIC_HARNESS_REPORT)
      : path.join(projectRoot, "harness-flow.example.json"),
    harnessReportMaxAgeMinutes: Number(env.CIC_HARNESS_REPORT_MAX_AGE_MINUTES || 90),
    passcodeHash: env.CIC_PASSCODE_HASH || (env.CIC_PASSCODE ? sha256(env.CIC_PASSCODE) : ""),
    gmailRefreshIntervalMinutes: Number(env.GMAIL_REFRESH_INTERVAL_MINUTES || 180),
    gmailRefreshCommand: env.GMAIL_REFRESH_COMMAND || "",
    atlasUrl: env.ATLAS_URL || "",
    openAiApiKey: env.OPENAI_API_KEY || "",
    openAiModel: env.OPENAI_MODEL || "gpt-5.4-mini",
    openAiReasoningEffort: env.OPENAI_REASONING_EFFORT || "low",
    openAiEmbeddingModel: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    // Cost controls for the AI Intelligence overview synthesis. The overview
    // used to hit the OpenAI Responses API on every dashboard mount; the TTL
    // cache serves the last successful synthesis, and the autosynth toggle can
    // disable auto-on-mount synthesis entirely (deterministic fallback only).
    intelligenceTtlMs: intelligenceTtlMs(env.CIC_INTELLIGENCE_TTL_MS),
    intelligenceAutosynth: String(env.CIC_INTELLIGENCE_AUTOSYNTH ?? "on").trim().toLowerCase() !== "off",
    supabaseUrl: env.SUPABASE_URL || "",
    supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "",
    queryWikiAccessToken: env.QUERY_WIKI_ACCESS_TOKEN || "",
    queryWikiUrl: env.QUERY_WIKI_URL || "",
    openBrainMatchCount: Number(env.OPENBRAIN_MATCH_COUNT || 8),
    openBrainMatchThreshold: Number(env.OPENBRAIN_MATCH_THRESHOLD || 0.2),
    spotifyAccessToken: env.SPOTIFY_ACCESS_TOKEN || "",
    spotifyClientId: env.SPOTIFY_CLIENT_ID || "",
    spotifyClientSecret: env.SPOTIFY_CLIENT_SECRET || "",
    spotifyRedirectUri: env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${Number(env.PORT || 8787)}/auth/spotify/callback`,
    spotifyRefreshToken: env.SPOTIFY_REFRESH_TOKEN || "",
    spotifyRequestTimeoutMs: Number(env.SPOTIFY_REQUEST_TIMEOUT_MS || 2500)
  };
}
