// =====================================================================
// COMMAND INFORMATION CENTER — EXAMPLE DATA FEED (demo mode)
// All values below are synthetic and for demonstration only.
// Copy this file to data.js to run the dashboard with no backend:
//     cp data.example.js data.js && npm start
// In a real deployment, a refresh job rewrites data.js from live sources.
// =====================================================================
window.CIC_DATA = {
  meta: {
    generatedAt: "2026-01-01T15:00:00Z",
    generatedAtLocal: "01/01/2026 08:00 AM (demo)",
    operator: "Demo Operator",
    version: 1
  },

  // ---- SOURCE STATUS (never remove entries; flip status on failure) ----
  sources: [
    { id: "email",    name: "EMAIL",    status: "online",        detail: "12 sampled / 7d; ~80 inbox threads in window (demo)" },
    { id: "calendar", name: "CALENDAR", status: "online",        detail: "primary calendar reachable; 2 events this week (demo)" },
    { id: "github",   name: "GITHUB",   status: "online",        detail: "4 open PRs across demo repos" },
    { id: "vercel",   name: "VERCEL",   status: "online",        detail: "2/2 demo deploys READY" },
    { id: "drive",    name: "DRIVE",    status: "online",        detail: "6 recent demo items" },
    { id: "spotify",  name: "SPOTIFY",  status: "online",        detail: "live player idle; demo library stats loaded" },
    { id: "files",    name: "LOCAL FS", status: "online",        detail: "demo project folder scan complete" },
    { id: "ifttt",    name: "IFTTT",    status: "online",        detail: "2 demo applets, both enabled" },
    { id: "tracker",  name: "TRACKER",  status: "auth_required", detail: "OAuth required; not called in demo mode" }
  ],

  // ---- MORNING BRIEFING (cross-references the sources above) ----
  briefing: {
    headline: "Demo briefing: 4 open PRs are ready for review, the calendar has two light meetings this week, and a routine monthly statement landed overnight. Nothing urgent.",
    summary: "This is synthetic placeholder content shipped with the public repo so the dashboard renders fully without any backend credentials. The briefing normally cross-references the live source panels below: open pull requests, calendar load, recent files, and account activity. Connect a real feed (or point CIC_DATA_FEED at your own data.js) to replace everything here. With no OpenAI or OpenBrain credentials configured, the Intelligence tab shows these deterministic fallback states instead of generated text.",
    actions: [
      {
        priority: "P1",
        title: "Review and merge the open demo pull requests",
        detail: "Four PRs are open across the example repos (example/widgets #14, example/api #7, example/site #3, example/cli #2). All report green CI in this demo feed. This is sample data — wire up a GitHub source to populate real PRs.",
        sources: ["github"],
        due: "01/02/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Prepare for the two meetings on the calendar this week",
        detail: "The demo calendar shows a planning sync and a design review. Calendar data is synthetic; connect a real calendar source to replace it.",
        sources: ["calendar"],
        due: "01/03/2026",
        money: false
      },
      {
        priority: "P2",
        title: "File the monthly brokerage statement",
        detail: "A routine monthly statement is available in the demo feed. Rows like this are flagged money-sensitive so the privacy blur can hide values. This is placeholder content with no real account behind it.",
        sources: ["email", "drive"],
        due: "01/05/2026",
        money: true
      },
      {
        priority: "P3",
        title: "Ingest the latest demo data export",
        detail: "A sample export sits in the demo Drive panel awaiting ingest. Replace with your own pipeline.",
        sources: ["drive", "files"],
        due: "01/07/2026",
        money: false
      }
    ]
  },

  // ---- PANEL DATA ----
  gmail: {
    windowDays: 7,
    inboxThreadEstimate: 80,
    threads: [
      { subject: "Your monthly brokerage statement is ready",        from: "statements.example.com", date: "01/01 6:02 AM", unread: true,  tag: "MONEY",    money: true },
      { subject: "PR review requested: example/widgets #14",          from: "github.example",         date: "12/31 9:14 PM", unread: true,  tag: "WORK",     money: false },
      { subject: "Calendar: Planning sync moved to Thursday",         from: "calendar.example",       date: "12/31 4:30 PM", unread: false, tag: "CALENDAR", money: false },
      { subject: "Receipt for your recent purchase",                  from: "shop.example.com",       date: "12/30 1:11 PM", unread: false, tag: "SHOPPING", money: false },
      { subject: "Your weekly project digest",                        from: "digest.example",         date: "12/30 8:00 AM", unread: false, tag: "WORK",     money: false }
    ]
  },

  calendar: {
    window: "01/01 - 01/05",
    events: [
      { title: "Planning sync",  when: "01/02 10:00 AM", duration: "30m" },
      { title: "Design review",  when: "01/03 02:00 PM", duration: "1h" }
    ],
    note: "Demo calendar. Two light meetings this week. Connect a real calendar source to replace this."
  },

  github: {
    user: "demo-user",
    openPrCount: 4,
    batchNote: "Demo set: four open PRs across the example repos, all green in this synthetic feed.",
    prs: [
      { repo: "example/widgets", number: 14, title: "Add empty-state illustrations", opened: "12/30", readyToMerge: true },
      { repo: "example/api",     number: 7,  title: "Rate-limit the search endpoint", opened: "12/29", readyToMerge: true },
      { repo: "example/site",    number: 3,  title: "Fix mobile nav overflow",        opened: "12/28", readyToMerge: false },
      { repo: "example/cli",     number: 2,  title: "Support --json output",          opened: "12/27", readyToMerge: true }
    ]
  },

  vercel: {
    team: "demo-team",
    projects: [
      { name: "example-site",   state: "READY", target: "production", commit: "Fix mobile nav overflow", branch: "main", deployed: "12/31/2025 10:09 PM" },
      { name: "example-docs",   state: "READY", target: "production", commit: "Update getting-started",  branch: "main", deployed: "12/31/2025 10:08 PM" }
    ]
  },

  drive: {
    recent: [
      { title: "Demo Exports (folder)",   type: "folder", when: "12/31 4:58 PM", money: false },
      { title: "sample-export.zip",       type: "zip",    when: "12/31 4:57 PM", money: false },
      { title: "Project Notes (folder)",  type: "folder", when: "12/30 1:59 PM", money: false },
      { title: "Statements (folder)",     type: "folder", when: "12/29",         money: true },
      { title: "roadmap.pdf",             type: "pdf",    when: "12/28 1:54 PM", money: false },
      { title: "budget-2026.pdf",         type: "pdf",    when: "12/27 1:54 PM", money: true }
    ],
    note: "Demo Drive activity. The example export awaits ingest; statement folders are flagged money-sensitive for the privacy blur."
  },

  money: {
    events: [
      { label: "Monthly brokerage statement", amount: "available", status: "AVAILABLE", date: "01/01" },
      { label: "Recurring transfer",          amount: "$0.00",     status: "SCHEDULED", date: "01/03" }
    ],
    accounts: []
  },

  // ---- Spotify: live player idle; library stats from a sample export ----
  spotify: {
    nowPlaying: null,
    nowPlayingNote: "Spotify live-player probe returned no active session (idle). Library stats below are sample values shipped with the demo feed.",
    library: {
      tracks: 1234,
      hours: 96.5,
      playlists: 8,
      lastAdded: "12/30/2025",
      exportNote: "Sample stats for the demo feed. Replace with a real export to populate the Audio panel."
    },
    topArtists: [
      { name: "Demo Artist One",   liked: 32 },
      { name: "Demo Artist Two",   liked: 28 },
      { name: "Demo Artist Three", liked: 21 },
      { name: "Demo Artist Four",  liked: 17 }
    ],
    recentAdds: [
      { track: "Sample Track A", artist: "Demo Artist One", added: "12/30" },
      { track: "Sample Track B", artist: "Demo Artist Two", added: "12/29" },
      { track: "Sample Track C", artist: "Demo Artist Three", added: "12/28" }
    ]
  },

  // ---- Local projects by last-modified ----
  projects: {
    root: "Projects",
    items: [
      { name: "Command Information Center", touched: "01/01/2026", note: "this dashboard; data.js refresh target" },
      { name: "Example Widgets",            touched: "12/31/2025", note: "component library; 1 open PR" },
      { name: "Example API",                touched: "12/30/2025", note: "search service; rate-limit work in review" },
      { name: "Example Site",               touched: "12/29/2025", note: "marketing site on Vercel" }
    ]
  },

  // ---- Knowledge-base / wiki activity log (newest dated entries) ----
  wiki: {
    name: "Demo Knowledge Base",
    entries: [
      { date: "01/01/2026", title: "setup | Command Information Center demo feed" },
      { date: "12/31/2025", title: "review | Example Widgets empty-state pass" },
      { date: "12/30/2025", title: "planning | Q1 roadmap draft" }
    ]
  },

  ifttt: {
    applets: [
      { name: "Demo: nightly backup",   enabled: true, services: "Scheduler -> Cloud Storage" },
      { name: "Demo: deploy notify",    enabled: true, services: "GitHub -> Chat" }
    ]
  }
};
