import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createTask, recordRefreshRun } from "./db.js";
import { loadMissionData, priorityForGmailTag } from "./dataFeed.js";

const execFileAsync = promisify(execFile);

export async function refreshGmailSuggestions({ db, config }) {
  const startedAt = new Date().toISOString();
  try {
    if (config.gmailRefreshCommand) {
      const [cmd, ...args] = config.gmailRefreshCommand.split(" ").filter(Boolean);
      await execFileAsync(cmd, args, { cwd: process.cwd(), timeout: 120000 });
    }

    const data = loadMissionData(config.dataFeedPath);
    let created = 0;
    for (const thread of data.gmail?.threads || []) {
      const title = String(thread.subject || "").trim();
      if (!title) continue;
      const existing = db.prepare("SELECT id FROM tasks WHERE title = ? AND source = 'gmail' AND dismissed = 0").get(title);
      if (existing) continue;
      createTask(db, {
        title,
        notes: `${thread.from || "Gmail"} ${thread.date || ""} ${thread.tag || ""}`.trim(),
        source: "gmail",
        priority: priorityForGmailTag(thread.tag),
        status: "Inbox",
        suggested: true
      });
      created += 1;
    }
    recordRefreshRun(db, "gmail", "ok", `${created} summarized suggestions created`, startedAt);
    return { ok: true, created, detail: "Gmail suggestions refreshed from summarized feed." };
  } catch (error) {
    recordRefreshRun(db, "gmail", "degraded", error.message, startedAt);
    return { ok: false, created: 0, detail: error.message };
  }
}

export function startGmailWorker({ db, config }) {
  const minutes = Math.max(15, config.gmailRefreshIntervalMinutes || 180);
  const timer = setInterval(() => {
    refreshGmailSuggestions({ db, config }).catch(() => {});
  }, minutes * 60 * 1000);
  timer.unref?.();
  return timer;
}
