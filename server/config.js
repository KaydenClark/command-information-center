import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

export function loadEnv(filePath = path.join(projectRoot, ".env")) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
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

export function setEnvValue(key, value, filePath = path.join(projectRoot, ".env")) {
  const nextLine = `${key}=${value}`;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${nextLine}\n`, { mode: 0o600 });
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
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
  fs.writeFileSync(filePath, nextLines.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
}

export function getConfig() {
  loadEnv();
  return {
    host: process.env.HOST || "0.0.0.0",
    port: Number(process.env.PORT || 8787),
    dbPath: path.resolve(projectRoot, process.env.CIC_DB || "data/cic.sqlite"),
    dataFeedPath: path.resolve(projectRoot, process.env.CIC_DATA_FEED || "data.js"),
    passcodeHash: process.env.CIC_PASSCODE_HASH || (process.env.CIC_PASSCODE ? sha256(process.env.CIC_PASSCODE) : ""),
    gmailRefreshIntervalMinutes: Number(process.env.GMAIL_REFRESH_INTERVAL_MINUTES || 180),
    gmailRefreshCommand: process.env.GMAIL_REFRESH_COMMAND || "",
    spotifyAccessToken: process.env.SPOTIFY_ACCESS_TOKEN || "",
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI || `http://127.0.0.1:${Number(process.env.PORT || 8787)}/auth/spotify/callback`,
    spotifyRefreshToken: process.env.SPOTIFY_REFRESH_TOKEN || ""
  };
}
