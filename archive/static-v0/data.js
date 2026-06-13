// =====================================================================
// MISSION CONTROL DATA FEED - v3
// Generated: 2026-06-13 by Codex from live connector probes and local
// GPT_OS filesystem reads. No mocked numbers.
// Failed sources are marked offline or auth_required and render degraded.
// This file is the ONLY file the routine refresh rewrites.
// =====================================================================
window.MISSION_DATA = {
  meta: {
    generatedAt: "2026-06-13T06:37:57Z",
    generatedAtLocal: "06/13/2026 12:37 AM MDT",
    operator: "Kayden Clark",
    version: 3
  },

  // ---- SOURCE STATUS (never remove entries; flip status on failure) ----
  sources: [
    { id: "gmail",    name: "GMAIL",     status: "online",        detail: "10 sampled / 7d; 90,975 inbox threads" },
    { id: "calendar", name: "GCAL",      status: "auth_required", detail: "availability scope missing; reauth required" },
    { id: "github",   name: "GITHUB",    status: "online",        detail: "24 open PRs" },
    { id: "vercel",   name: "VERCEL",    status: "online",        detail: "2/2 deploys READY" },
    { id: "drive",    name: "GDRIVE",    status: "online",        detail: "6 recent items" },
    { id: "spotify",  name: "SPOTIFY",   status: "online",        detail: "local export OK; live player not probed" },
    { id: "gptos",    name: "GPT_OS FS", status: "online",        detail: "13 projects + 2 wikis" },
    { id: "ifttt",    name: "IFTTT",     status: "offline",       detail: "no callable tool in this session" },
    { id: "clickup",  name: "CLICKUP",   status: "offline",       detail: "tool schema validation failed" },
    { id: "slack",    name: "SLACK",     status: "offline",       detail: "no callable tool in this session" },
    { id: "linear",   name: "LINEAR",    status: "online",        detail: "4 canceled setup issues visible" },
    { id: "notion",   name: "NOTION",    status: "online",        detail: "workspace search reachable; no recent hits" }
  ],

  // ---- AI MORNING BRIEFING (cross-references the live sources) ----
  briefing: {
    headline: "Mission Control is now a project; the live feed is current, but Calendar and automation connectors need attention.",
    summary: "The dashboard package was moved into GPT_OS/Projects and documented like the other project folders. Live probes show the same 24 open GitHub PRs, healthy Vercel production deployments, recent Spotify data-export activity, and fresh wiki/project activity around Mission Control. Calendar needs reauthentication, while ClickUp, Slack, and IFTTT are degraded from this session.",
    actions: [
      {
        priority: "P1",
        title: "Reauth Google Calendar for schedule awareness",
        detail: "Calendar availability failed because the current connection is missing required scopes. Until that is fixed, Mission Control cannot confirm free/busy runway for GitHub or appointment planning.",
        sources: ["calendar", "gmail"],
        due: "06/13/2026",
        money: false
      },
      {
        priority: "P1",
        title: "Triage the 24 open GitHub PRs",
        detail: "GitHub still shows 24 open PRs, led by dependency-security remediation PRs across the older React repos and dndclient. Vercel production is healthy, so prioritize review/merge deliberately rather than as an outage response.",
        sources: ["github", "vercel", "gptos"],
        due: "06/13/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Finish Mission Control handoff cleanup",
        detail: "GPT_OS now shows Mission Control as the most recently touched project. Verify the new project docs and wiki page are enough for another agent to refresh the dashboard without rediscovering the contract.",
        sources: ["gptos", "wiki"],
        due: "06/13/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Watch Spotify export completion",
        detail: "Gmail shows Spotify data export request activity, while the local Spotify export still reports 5,169 liked tracks and 310.7 library hours. When the new export arrives, refresh the Spotify project data before relying on playlist analytics.",
        sources: ["gmail", "spotify", "gptos"],
        due: "06/27/2026",
        money: false
      },
      {
        priority: "P3",
        title: "Decide whether degraded automation sources matter",
        detail: "IFTTT and Slack have no callable tool in this session, and ClickUp fails validation before auth can be assessed. If they are meant to drive daily operations, they need connector repair or removal from the critical dashboard surface.",
        sources: ["ifttt", "clickup", "slack"],
        due: "06/16/2026",
        money: false
      }
    ]
  },

  // ---- PANEL DATA ----
  gmail: {
    windowDays: 7,
    inboxThreadEstimate: 10,
    threads: [
      { subject: "Venmo payment sent", from: "venmo.com", date: "06/12 8:12 PM", unread: true, tag: "MONEY", money: true },
      { subject: "Spotify personal data export in progress", from: "spotify.com", date: "06/12 7:28 PM", unread: false, tag: "INFO", money: false },
      { subject: "Confirm Spotify data request", from: "spotify.com", date: "06/12 7:27 PM", unread: false, tag: "DEADLINE", money: false },
      { subject: "New login to Spotify", from: "spotify.com", date: "06/12 7:15 PM", unread: false, tag: "INFO", money: false },
      { subject: "Venmo payment received", from: "venmo.com", date: "06/12 6:47 PM", unread: true, tag: "MONEY", money: true },
      { subject: "Appointment confirmation", from: "health portal", date: "06/12 3:41 PM", unread: true, tag: "HEALTH", money: false }
    ]
  },

  calendar: {
    window: "06/13 - 06/17",
    events: [],
    note: "Calendar availability probe failed: current Google Calendar connection is missing required scopes. Reauthenticate before using this panel for schedule planning."
  },

  github: {
    user: "KaydenClark",
    openPrCount: 24,
    batchNote: "Open PRs include the dependency-security remediation batch plus prior triage docs and one TwinCountdown feature PR.",
    prs: [
      { repo: "unsuedPort",     number: 21, title: "Patch dependency security alerts", opened: "open" },
      { repo: "reactTIcTacToe", number: 12, title: "Patch dependency security alerts", opened: "open" },
      { repo: "reactAppStart",  number: 3,  title: "Patch dependency security alerts", opened: "open" },
      { repo: "mongoTest",      number: 4,  title: "Patch dependency security alerts", opened: "open" },
      { repo: "formsReact",     number: 20, title: "Patch dependency security alerts", opened: "open" },
      { repo: "dndclient",      number: 5,  title: "Patch dependency security alerts (prod-linked)", opened: "open" },
      { repo: "ToDoListCLient", number: 4,  title: "Patch dependency security alerts", opened: "open" },
      { repo: "TicTac-2",       number: 13, title: "Patch dependency security alerts", opened: "open" },
      { repo: "TableTopReact",  number: 14, title: "Patch dependency security alerts", opened: "open" }
    ]
  },

  vercel: {
    team: "kaydenclark725-5177's projects",
    projects: [
      { name: "dndwebapp-client", state: "READY", target: "production", commit: "Update client validation docs", branch: "Game_Plan_CC", deployed: "06/03/2026 10:09 PM MDT" },
      { name: "dndwebapp-api",    state: "READY", target: "production", commit: "Update API validation docs",    branch: "Game_Plan_CC", deployed: "06/03/2026 10:08 PM MDT" }
    ]
  },

  drive: {
    recent: [
      { title: "Recent PDF import",              type: "pdf", when: "06/12 2:00 PM", money: false },
      { title: "Recent PDF import",              type: "pdf", when: "06/12 2:00 PM", money: false },
      { title: "Recent PDF import",              type: "pdf", when: "06/12 2:00 PM", money: false },
      { title: "2021 RH Crypto 1099.pdf",        type: "pdf", when: "06/12 1:54 PM", money: true },
      { title: "Recent PDF import",              type: "pdf", when: "06/12 1:54 PM", money: false },
      { title: "2020 RH Crypto 1099.pdf",        type: "pdf", when: "06/12 1:54 PM", money: true }
    ],
    note: "Recent Drive results are mostly PDF uploads from 06/12; Robinhood tax files are still visible in the recent set."
  },

  money: {
    events: [
      { label: "Venmo payment sent",       amount: "$40.00",  status: "COMPLETED", date: "06/12" },
      { label: "Venmo payment received",   amount: "$100.00", status: "CREDITED",  date: "06/12" },
      { label: "Earned-wage balance email", amount: "$974.70", status: "NOTICE",   date: "06/12" }
    ],
    accounts: []
  },

  // ---- Spotify: local export data; live player tool unavailable in this session ----
  spotify: {
    nowPlaying: null,
    nowPlayingNote: "No Spotify live-player tool was callable in this session; local export data was refreshed.",
    library: {
      tracks: 5169,
      hours: 310.7,
      playlists: 11,
      lastAdded: "03/08/2026",
      exportNote: "Stats from Projects/Spotify/Liked_Songs.csv export"
    },
    topArtists: [
      { name: "The Beatles",     liked: 40 },
      { name: "Radiohead",       liked: 39 },
      { name: "Orla Gartland",   liked: 36 },
      { name: "Motherfolk",      liked: 32 },
      { name: "Imagine Dragons", liked: 26 },
      { name: "Bo Burnham",      liked: 25 }
    ],
    recentAdds: [
      { track: "i wanna be your girlfriend",       artist: "girl in red",        added: "03/08" },
      { track: "No Instructions",                  artist: "The Happy Fits",     added: "03/07" },
      { track: "Bang Bang (My Baby Shot Me Down)", artist: "Nancy Sinatra",      added: "03/06" },
      { track: "Vampire Disco",                    artist: "Friday Pilots Club", added: "03/04" }
    ]
  },

  // ---- Local GPT_OS projects by last-modified ----
  projects: {
    root: "GPT_OS/Projects",
    items: [
      { name: "Mission Control",          touched: "06/13/2026", note: "moved into Projects + documented" },
      { name: "Data Exports",             touched: "06/13/2026", note: "" },
      { name: "Spotify",                  touched: "06/12/2026", note: "local export feeding Audio panel" },
      { name: "Robinhood Trading",        touched: "06/12/2026", note: "guardrails + runbook + MCP game plan" },
      { name: "Local Tools",              touched: "06/11/2026", note: "" },
      { name: "Dependency Issue Triage",  touched: "06/11/2026", note: "pairs with the 24 open PRs" },
      { name: "Claude",                   touched: "06/11/2026", note: "Open Brain planning docs" },
      { name: "DnDWebApp",                touched: "06/03/2026", note: "deployed on Vercel (client + api)" }
    ]
  },

  // ---- Wiki - Kayden activity log ----
  wiki: {
    name: "Wiki - Kayden",
    entries: [
      { date: "06/13/2026", title: "project setup | Mission Control" },
      { date: "06/12/2026", title: "lint + housekeeping | Link-drift fixes; staging-doc marker" },
      { date: "06/12/2026", title: "ingest | Relationships and Values populated; Azlemzyk lore added" },
      { date: "06/12/2026", title: "project setup | Spotify" },
      { date: "06/12/2026", title: "project setup | Robinhood Trading" }
    ]
  },

  ifttt: {
    applets: []
  }
};
