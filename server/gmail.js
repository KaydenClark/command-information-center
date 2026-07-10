import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createTask, recordRefreshRun } from "./db.js";
import { loadMissionData, priorityForGmailTag } from "./dataFeed.js";

const execFileAsync = promisify(execFile);

export function parseCommandLine(commandLine) {
  const args = [];
  let current = "";
  let quote = "";
  let escaping = false;
  let tokenStarted = false;
  for (const character of String(commandLine || "")) {
    if (escaping) {
      current += character;
      escaping = false;
      tokenStarted = true;
    } else if (character === "\\") {
      escaping = true;
      tokenStarted = true;
    } else if (quote) {
      if (character === quote) quote = "";
      else current += character;
    } else if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
    } else if (/\s/.test(character)) {
      if (tokenStarted) {
        args.push(current);
        current = "";
        tokenStarted = false;
      }
    } else {
      current += character;
      tokenStarted = true;
    }
  }
  if (quote) throw new Error("GMAIL_REFRESH_COMMAND contains an unterminated quote.");
  if (escaping) current += "\\";
  if (tokenStarted) args.push(current);
  if (!args.length) throw new Error("GMAIL_REFRESH_COMMAND is empty.");
  return args;
}

export async function refreshGmailSuggestions({ db, config, execFileImpl = execFileAsync }) {
  const startedAt = new Date().toISOString();
  try {
    if (config.gmailRefreshCommand) {
      const [cmd, ...args] = parseCommandLine(config.gmailRefreshCommand);
      await execFileImpl(cmd, args, { cwd: process.cwd(), timeout: 120000 });
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
