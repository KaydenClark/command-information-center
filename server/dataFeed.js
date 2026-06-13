import fs from "node:fs";
import vm from "node:vm";

export function loadMissionData(filePath) {
  const fallback = {
    meta: { version: 0, generatedAt: null, generatedAtLocal: "not generated" },
    sources: [],
    briefing: { headline: "Command Information Center data feed is unavailable.", summary: "", actions: [] },
    gmail: { windowDays: 7, inboxThreadEstimate: 0, threads: [] },
    calendar: { window: "", events: [], note: "Calendar data unavailable." },
    github: { user: "", openPrCount: 0, batchNote: "", prs: [] },
    vercel: { projects: [] },
    drive: { recent: [], note: "" },
    money: { events: [], accounts: [] },
    spotify: { nowPlaying: null, nowPlayingNote: "Spotify data unavailable.", library: {}, topArtists: [], recentAdds: [] },
    projects: { items: [] },
    wiki: { entries: [] },
    ifttt: { applets: [] }
  };

  if (!fs.existsSync(filePath)) return fallback;

  try {
    const source = fs.readFileSync(filePath, "utf8");
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: filePath, timeout: 1000 });
    return context.window.CIC_DATA || fallback;
  } catch (error) {
    return {
      ...fallback,
      sources: [{ id: "data", name: "DATA FEED", status: "offline", detail: error.message }]
    };
  }
}

export function priorityForGmailTag(tag) {
  if (tag === "DEADLINE" || tag === "HEALTH") return "P1";
  if (tag === "MONEY") return "P2";
  return "P3";
}
