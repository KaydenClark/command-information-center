// =====================================================================
// COMMAND INFORMATION CENTER DATA FEED - v4
// Generated: 2026-06-13 from live connector probes and local GPT_OS
// filesystem reads. Every number comes from this run. No mocked data.
// Failed sources are marked offline or auth_required and render degraded.
// This file is the ONLY file the routine refresh rewrites.
// =====================================================================
window.CIC_DATA = {
  meta: {
    generatedAt: "2026-06-13T21:43:46Z",
    generatedAtLocal: "06/13/2026 03:43 PM MDT",
    operator: "Kayden Clark",
    version: 4
  },

  // ---- SOURCE STATUS (never remove entries; flip status on failure) ----
  sources: [
    { id: "gmail",    name: "GMAIL",     status: "online",        detail: "15 sampled / 7d; ~201 inbox threads in window" },
    { id: "calendar", name: "GCAL",      status: "online",        detail: "primary calendar reachable; 0 events 06/13-06/17" },
    { id: "github",   name: "GITHUB",    status: "online",        detail: "24 open PRs; 11 dep-security PRs still awaiting merge" },
    { id: "vercel",   name: "VERCEL",    status: "online",        detail: "2/2 deploys READY" },
    { id: "drive",    name: "GDRIVE",    status: "online",        detail: "10 recent items; tax/Robinhood docs surfaced" },
    { id: "spotify",  name: "SPOTIFY",   status: "online",        detail: "live player idle; local export OK" },
    { id: "gptos",    name: "GPT_OS FS", status: "online",        detail: "10 projects + 2 wikis" },
    { id: "ifttt",    name: "IFTTT",     status: "online",        detail: "2 applets, both enabled" },
    { id: "clickup",  name: "CLICKUP",   status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "slack",    name: "SLACK",     status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "linear",   name: "LINEAR",    status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "notion",   name: "NOTION",    status: "auth_required", detail: "OAuth required; not called this run" }
  ],

  // ---- AI MORNING BRIEFING (cross-references the live sources) ----
  briefing: {
    headline: "11 dependency-security PRs still sitting open; calendar is clear but a doctor visit lands Thursday 06/18.",
    summary: "GitHub still shows all 24 PRs open, including the 11 'fix/dependency-security-updates' branches that were verified ready to merge two days ago - the merge step has not happened yet and remains the top priority. dndclient also carries a follow-up esbuild/vite advisory that needs its own PR after #5 merges. The next four days are empty on Google Calendar, but Gmail confirms a Riverton Family Health appointment for Thursday 06/18 at 2:00 PM that is not yet on the calendar. Money signals are quiet and routine: a DailyPay earned-wage balance of $974.70, plus small Venmo activity. Spotify's personal-data export is in progress and the verification link expires in 14 days.",
    actions: [
      {
        priority: "P1",
        title: "Merge the 11 dependency-security PRs (still open)",
        detail: "GitHub reports 24 open PRs; the 11 verified 'Patch dependency security alerts' branches are still unmerged: unsuedPort #21, formsReact #20, MyConnections-Frontend #3, reactAppStart #3, ToDoListCLient #4, ProfileClient #3, TableTopReact #14, reactTIcTacToe #12, TicTac-2 #13, dndclient #5, mongoTest #4. The local Dependency Issue Triage project (most-recently-touched GPT_OS project, 06/13) pairs with these. After merging, close the stale doc-triage PRs they superseded (mongoTest #3, dndclient #4, MyConnections-Frontend #2).",
        sources: ["github", "gptos"],
        due: "06/14/2026",
        money: false
      },
      {
        priority: "P1",
        title: "dndclient: open the vite/esbuild follow-up PR (GHSA-gv7w-rqvm-qjhr)",
        detail: "After PR #5 merges, the second HIGH esbuild->vite advisory remains. Upgrade vite and vitest, review vite.config.js for breaking changes, confirm npm run build and vitest run pass, then open a separate PR. dndclient is also the source behind the live Vercel dndwebapp-client deploy, so verify the production build still passes.",
        sources: ["github", "vercel"],
        due: "06/15/2026",
        money: false
      },
      {
        priority: "P1",
        title: "Add the Riverton Family Health appointment to Google Calendar",
        detail: "Google Calendar shows nothing for 06/13-06/17, but two Gmail confirmations from eclinicalmail.com book an appointment for Thursday 06/18 at 2:00 PM (Riverton Family Health Center, 1756 W Park Ave, Riverton UT). It falls just outside the 4-day dashboard window and is not on the calendar yet - add it so the schedule panel reflects reality.",
        sources: ["calendar", "gmail"],
        due: "06/17/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Confirm the Spotify data export before the link expires",
        detail: "Gmail shows Spotify 'gathering your personal data' plus a 'Confirm your Spotify data request' email whose verification link expires in 14 days (by 06/27). The local export still reads 5,169 liked tracks / 310.7 hours / 10 playlists; refresh the Spotify project once the new export arrives.",
        sources: ["gmail", "spotify"],
        due: "06/27/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Review routine money activity ($974.70 earned-wage available)",
        detail: "DailyPay reports a $974.70 Connexus earned-wage balance available now. Venmo shows $100.00 received (Kami Clark, groceries), $40.00 sent (Kassie Clark, spa day), and a $3.30 purchase. Google Drive also surfaced Robinhood 1099 tax docs (2020, 2021, 2025) in the recent set - confirm whether any tax follow-up is needed.",
        sources: ["gmail", "drive"],
        due: "06/16/2026",
        money: true
      },
      {
        priority: "P3",
        title: "Reauthenticate the four offline connectors",
        detail: "ClickUp, Slack, Linear, and Notion all require OAuth and returned no data this run. IFTTT is healthy (2 enabled applets). Decide whether the four need reconnecting for daily ops or should be dropped from the critical dashboard surface.",
        sources: ["clickup", "slack", "linear", "notion"],
        due: "06/18/2026",
        money: false
      }
    ]
  },

  // ---- PANEL DATA ----
  gmail: {
    windowDays: 7,
    inboxThreadEstimate: 201,
    threads: [
      { subject: "Robinhood daily futures/event statement available", from: "robinhood.com", date: "06/13 4:47 AM", unread: true,  tag: "MONEY",    money: true },
      { subject: "Venmo purchase receipt $3.30",                      from: "venmo.com",     date: "06/13 4:19 AM", unread: true,  tag: "MONEY",    money: true },
      { subject: "New account login alert",                           from: "onlyfans.com",  date: "06/13 4:14 AM", unread: true,  tag: "SECURITY", money: false },
      { subject: "You paid Kassie Clark $40.00 (Summer spa day)",     from: "venmo.com",     date: "06/12 8:12 PM", unread: false, tag: "MONEY",    money: true },
      { subject: "We're gathering your Spotify personal data",        from: "spotify.com",   date: "06/12 7:28 PM", unread: false, tag: "INFO",     money: false },
      { subject: "Confirm your Spotify data request (link 14d)",      from: "spotify.com",   date: "06/12 7:27 PM", unread: false, tag: "DEADLINE",  money: false },
      { subject: "Kami Clark paid you $100.00 (Groceries)",           from: "venmo.com",     date: "06/12 6:47 PM", unread: true,  tag: "MONEY",    money: true },
      { subject: "You have $974.70 available now",                    from: "dailypay.com",  date: "06/12 4:23 PM", unread: true,  tag: "MONEY",    money: true },
      { subject: "Appointment Confirmation - Thu 06/18 2:00 PM",      from: "eclinicalmail.com", date: "06/12 3:41 PM", unread: true, tag: "HEALTH", money: false }
    ]
  },

  calendar: {
    window: "06/13 - 06/17",
    events: [],
    note: "Primary Google Calendar is reachable (owner access). No events scheduled 06/13-06/17. Gmail confirms a doctor appointment Thursday 06/18 at 2:00 PM that is not yet on the calendar."
  },

  github: {
    user: "KaydenClark",
    openPrCount: 24,
    batchNote: "All 24 PRs still open. The 11 'fix/dependency-security-updates' branches were verified ready to merge on 06/11 but remain unmerged. dndclient has a follow-up esbuild advisory (GHSA-gv7w-rqvm-qjhr) needing a separate vite-upgrade PR.",
    prs: [
      { repo: "unsuedPort",             number: 21, title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "formsReact",             number: 20, title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "MyConnections-Frontend", number: 3,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "reactAppStart",          number: 3,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "ToDoListCLient",         number: 4,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "ProfileClient",          number: 3,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "TableTopReact",          number: 14, title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "reactTIcTacToe",         number: 12, title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "TicTac-2",               number: 13, title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "dndclient",              number: 5,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true, followUp: "GHSA-gv7w-rqvm-qjhr esbuild - vite upgrade needed in separate PR" },
      { repo: "mongoTest",              number: 4,  title: "Patch dependency security alerts", opened: "06/11", readyToMerge: true },
      { repo: "dndAPI",                 number: 12, title: "Add CLAUDE.md codebase guidance (draft)", opened: "06/11", readyToMerge: false }
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
      { title: "Robinhood (folder)",            type: "folder", when: "06/12 1:59 PM", money: true },
      { title: "Taxes (folder)",                type: "folder", when: "04/09 8:06 PM", money: true },
      { title: "Financials (folder)",           type: "folder", when: "04/01 12:52 AM", money: true },
      { title: "2025 RH Consolidated 1099.pdf", type: "pdf",    when: "06/12 1:55 PM", money: true },
      { title: "2025 Crypto Transactions.csv",  type: "csv",    when: "06/12 1:55 PM", money: true },
      { title: "2020 RH Crypto 1099.pdf",       type: "pdf",    when: "06/12 1:54 PM", money: true },
      { title: "2021 RH Crypto 1099.pdf",       type: "pdf",    when: "06/12 1:54 PM", money: true }
    ],
    note: "Recent Drive activity is dominated by Robinhood/tax documents uploaded 06/12 (1099s for 2020, 2021, and 2025 plus a crypto transactions CSV)."
  },

  money: {
    events: [
      { label: "DailyPay earned-wage balance", amount: "$974.70", status: "AVAILABLE", date: "06/12" },
      { label: "Venmo received (Kami Clark)",  amount: "$100.00", status: "CREDITED",  date: "06/12" },
      { label: "Venmo sent (Kassie Clark)",    amount: "$40.00",  status: "COMPLETED", date: "06/12" },
      { label: "Venmo purchase",               amount: "$3.30",   status: "COMPLETED", date: "06/13" }
    ],
    accounts: []
  },

  // ---- Spotify: live player idle; library stats from local export ----
  spotify: {
    nowPlaying: null,
    nowPlayingNote: "Spotify live-player probe returned no active session (idle). Library stats below come from the local export.",
    library: {
      tracks: 5169,
      hours: 310.7,
      playlists: 10,
      lastAdded: "03/08/2026",
      exportNote: "Stats parsed from Projects/Spotify/Liked_Songs.csv; 10 playlist CSVs in 'Playlists 04.04.26'"
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
      { name: "Dependency Issue Triage", touched: "06/13/2026", note: "pairs with the 11 open dep-security PRs" },
      { name: "Command Information Center",         touched: "06/13/2026", note: "dashboard + Spotify control work" },
      { name: "Spotify",                 touched: "06/13/2026", note: "local export feeding Audio panel" },
      { name: "Data Exports",            touched: "06/13/2026", note: "" },
      { name: "Robinhood Trading",       touched: "06/12/2026", note: "guardrails + runbook + MCP game plan" },
      { name: "Local Tools",             touched: "06/11/2026", note: "" },
      { name: "Claude",                  touched: "06/11/2026", note: "Open Brain planning docs" },
      { name: "Archived Code",           touched: "06/11/2026", note: "" }
    ]
  },

  // ---- Wiki - Kayden activity log (newest dated entries) ----
  wiki: {
    name: "Wiki - Kayden",
    entries: [
      { date: "06/13/2026", title: "security triage | Dependency push-readiness review (11 repos)" },
      { date: "06/13/2026", title: "implementation | Command Information Center local web app" },
      { date: "06/13/2026", title: "project setup | Command Information Center" },
      { date: "06/12/2026", title: "lint + housekeeping | Link-drift fixes; staging-doc marker" },
      { date: "06/12/2026", title: "ingest | Relationships and Values populated; Azlemzyk lore added" }
    ]
  },

  ifttt: {
    applets: [
      { name: "ACC Shutdown PC", enabled: true,  services: "Google Assistant -> Dropbox" },
      { name: "ACC Restart PC",  enabled: true,  services: "Google Assistant -> Dropbox" }
    ]
  }
};
