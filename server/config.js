import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

export function getRuntimeRoot() {
  const configuredRoot = process.env.CIC_RUNTIME_ROOT;
  if (!configuredRoot) return projectRoot;

  if (!path.isAbsolute(configuredRoot)) {
    throw new Error("CIC_RUNTIME_ROOT must be an absolute existing directory.");
  }

  try {
    if (!fs.statSync(configuredRoot).isDirectory()) {
      throw new Error("not a directory");
    }
  } catch {
    throw new Error("CIC_RUNTIME_ROOT must be an absolute existing directory.");
  }

  return path.resolve(configuredRoot);
}

export function loadEnv(filePath) {
  const resolvedFilePath = filePath || path.join(getRuntimeRoot(), ".env");
  if (!fs.existsSync(resolvedFilePath)) return;
  const lines = fs.readFileSync(resolvedFilePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function setEnvValue(key, value, filePath) {
  const resolvedFilePath = filePath || path.join(getRuntimeRoot(), ".env");
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

export function getConfig() {
  const runtimeRoot = getRuntimeRoot();
  loadEnv(path.join(runtimeRoot, ".env"));
  return {
    runtimeRoot,
    host: process.env.HOST || "0.0.0.0",
    port: Number(process.env.PORT || 8787),
    dbPath: path.resolve(runtimeRoot, process.env.CIC_DB || "data/cic.sqlite"),
    dataFeedPath: path.resolve(runtimeRoot, process.env.CIC_DATA_FEED || "data.js"),
    projectsRoot: path.resolve(runtimeRoot, ".."),
    platformHealthReport: path.resolve(
      runtimeRoot,
      process.env.PLATFORM_HEALTH_REPORT || "../Personal Intelligence Platform/.local/platform-health.json"
    ),
    platformHealthMaxAgeMinutes: Number(process.env.PLATFORM_HEALTH_MAX_AGE_MINUTES || 90),
    passcodeHash: process.env.CIC_PASSCODE_HASH || (process.env.CIC_PASSCODE ? sha256(process.env.CIC_PASSCODE) : ""),
    workbenchGithubToken: process.env.WORKBENCH_GITHUB_TOKEN || "",
    gmailRefreshIntervalMinutes: Number(process.env.GMAIL_REFRESH_INTERVAL_MINUTES || 180),
    gmailRefreshCommand: process.env.GMAIL_REFRESH_COMMAND || "",
    atlasUrl: process.env.ATLAS_URL || "",
    openAiApiKey: process.env.OPENAI_API_KEY || "",
    openAiModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    openAiReasoningEffort: process.env.OPENAI_REASONING_EFFORT || "low",
    openAiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "",
    queryWikiAccessToken: process.env.QUERY_WIKI_ACCESS_TOKEN || "",
    queryWikiUrl: process.env.QUERY_WIKI_URL || "",
    openBrainMatchCount: Number(process.env.OPENBRAIN_MATCH_COUNT || 8),
    openBrainMatchThreshold: Number(process.env.OPENBRAIN_MATCH_THRESHOLD || 0.2),
    spotifyAccessToken: process.env.SPOTIFY_ACCESS_TOKEN || "",
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${Number(process.env.PORT || 8787)}/auth/spotify/callback`,
    spotifyRefreshToken: process.env.SPOTIFY_REFRESH_TOKEN || "",
    spotifyRequestTimeoutMs: Number(process.env.SPOTIFY_REQUEST_TIMEOUT_MS || 2500)
  };
}
