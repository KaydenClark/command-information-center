import fs from "node:fs";
import https from "node:https";
import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { startGmailWorker } from "./gmail.js";
import { runKanbanCheck } from "./kanbanCheck.js";

const config = getConfig();
const app = createApp(config);

startGmailWorker({ db: app.locals.db, config });
scheduleKanbanCheck({ db: app.locals.db, config });

const tlsCredentials = loadTlsCredentials(config);
const scheme = tlsCredentials ? "https" : "http";
const server = tlsCredentials ? https.createServer(tlsCredentials, app) : app;

server.listen(config.port, config.host, () => {
  console.log(`Command Information Center listening on ${scheme}://${config.host}:${config.port}`);
});

// TLS is optional: unset CIC_TLS_CERT_PATH/CIC_TLS_KEY_PATH to keep running
// plain HTTP for localhost-only or demo use (see RUNBOOK.md -> HTTPS For LAN Access).
function loadTlsCredentials({ tlsCertPath, tlsKeyPath }) {
  if (!tlsCertPath || !tlsKeyPath) return null;
  return {
    cert: fs.readFileSync(tlsCertPath),
    key: fs.readFileSync(tlsKeyPath)
  };
}

// Nightly background job: flag stalled / mis-staged work into OpenBrain's prescient_tasks.
// Runs once shortly after startup, then every 24 hours. Skipped silently without an OpenAI key.
function scheduleKanbanCheck({ db, config }) {
  if (!config.openAiApiKey) return;

  const runOnce = async () => {
    try {
      const result = await runKanbanCheck(config, db);
      console.log(`[kanban-check] ${result.status}: ${result.detail || ""}`.trim());
    } catch (error) {
      console.error(`[kanban-check] failed: ${error instanceof Error ? error.message : error}`);
    }
  };

  setTimeout(runOnce, 10_000);
  setInterval(runOnce, 24 * 60 * 60 * 1000);
}
