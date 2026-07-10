// =====================================================================
// COMMAND INFORMATION CENTER DATA FEED - v20
// Generated: 2026-07-01 from live connector probes and local GPT_OS
// filesystem reads. Every number comes from this run. No mocked data.
// Failed sources are marked offline or auth_required and render degraded.
// This file is the ONLY file the routine refresh rewrites.
// =====================================================================
window.CIC_DATA = {
  meta: {
    generatedAt: "2026-07-01T13:10:19Z",
    generatedAtLocal: "07/01/2026 07:10 AM MDT",
    operator: "Kayden Clark",
    version: 20
  },

  // ---- SOURCE STATUS (never remove entries; flip status on failure) ----
  sources: [
    { id: "gmail",    name: "GMAIL",     status: "online",        detail: "Gmail reachable. ~201 inbox threads in 7d. DailyPay balance climbed to $1,035.73 available (06/30, up from $927.68 last run). Two Venmo Amazon Marketplace charges landed 06/30 ($26.19 + $17.34). Stripe emailed 07/01 that a card on file is expiring - update it before a subscription lapses. A Cinemark purchase confirmation (06/30) ties directly to tonight's auto-created calendar event. A Google security alert (06/30) noted a sign-in tied to a linked recovery account. Otherwise promo/social noise: MongoDB Voyage AI newsletter, Meetup AWS event invite, r/Utah rent thread, Udemy AI-certs promo, Robinhood crypto livestream promo, Amazon shipment notices. No Supabase Digital Tome status update appeared in this run's pulled sample." },
    { id: "calendar", name: "GCAL",      status: "online",        detail: "Primary Google Calendar reachable (owner). One event in the 07/01-07/05 window: SUPERGIRL tonight, 6:20-7:20 PM MDT at Cinemark Jordan Landing 24 and XD - auto-created from the Cinemark confirmation email. Otherwise clear through 07/05." },
    { id: "github",   name: "GITHUB",    status: "online",        detail: "29 open PRs by author:KaydenClark (DOWN from 35). Last run's 9-PR Little_Local_World truth-loop stack (#21-#29) is gone (merged) and LLM_Workbench #3 is gone too, replaced by four new PRs opened today under an owner-directed 'crisis -> response -> consequence' line of work: Little_Local_World #32 (Slice 0, ready, 245 tests green), #33 (Slice 1 dig-out, ready, 259 tests green, stacked on #32), #34 (observer decision audit, DRAFT - a Mac LM gate rerun is still needed, last recorded RED), and LLM_Workbench #4 (harness metadata/guardrails, ready, 124/124 local). Unchanged: AI_Agents_Presentation #7 (room cleanup, 06/28, ready - Playwright E2E blocked by a sandboxed download, not a merge blocker), OpenBrain #1 (draft, 06/26), dndAPI #15 + command-information-center #1 (06/16 TDD, ready), the 10 'Patch dependency security alerts' + 10 'Document dependency issue triage' PRs (06/11), and the stale draft TwinCountdown #1 (04/07)." },
    { id: "vercel",   name: "VERCEL",    status: "online",        detail: "4 projects; all 4 latest production deploys READY - unchanged from last run. digital-tome production READY (06/23 12:10 AM MDT, main, 'Record hosted deployment verification'). ai-agents-presentation production READY (06/22 01:14 AM MDT, codex/v2.1-five-scene-ladder beta); the PR #7 preview branch and its predecessors remain green through the 06/28 burst. dndwebapp client+api READY on Game_Plan_CC (06/03 10:09/10:08 PM MDT). The older digital-tome cluster from kayden@Kaydens-Mac-mini.local is still BLOCKED/ERROR - a deploy-identity issue, not a production outage, unchanged from last run." },
    { id: "drive",    name: "GDRIVE",    status: "online",        detail: "Drive reachable. Top 10 recent files unchanged since last run; newest by recency is still the worldbuilding doc 'Gods of Azlemzyk' (viewed 06/25) - no new Drive activity this run. Investing/Deep Research folders + 3 AI-infrastructure research docs tagged money." },
    { id: "spotify",  name: "SPOTIFY",   status: "online",        detail: "Now-playing probe returned no active session this run (idle). Local export OK (5,247 liked / 315.0 hrs / 10 playlists, static since the 04/04/2026 export)." },
    { id: "gptos",    name: "GPT_OS FS", status: "online",        detail: "OpenBrain is the newest-touched project (07/01 05:09 AM), matching the fresh 'OpenBrain Workbench v2' wiki entry. DnDWebApp touched 07/01 04:09 AM. Little_Local_World touched 07/01 03:47 AM, matching today's 3 new PRs. Command Information Center 06/30. AI_Agents_Presentation 06/28. ChatDev 06/24. Robinhood Trading 06/23. DigitalTome 06/22." },
    { id: "ifttt",    name: "IFTTT",     status: "online",        detail: "2 applets, both enabled (ACC Shutdown PC + ACC Restart PC; Google Assistant -> Dropbox)" },
    { id: "clickup",  name: "CLICKUP",   status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "slack",    name: "SLACK",     status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "linear",   name: "LINEAR",    status: "auth_required", detail: "OAuth required; not called this run" },
    { id: "notion",   name: "NOTION",    status: "auth_required", detail: "OAuth required; not called this run" }
  ],

  // ---- AI MORNING BRIEFING (cross-references the live sources) ----
  briefing: {
    headline: "The GitHub backlog dropped from 35 to 29 open PRs as last run's 9-PR Little_Local_World stack merged out, replaced by three new PRs under an owner-directed 'crisis -> response -> consequence' initiative kicked off today - two are green and ready, one is still gate-blocked. Tonight's calendar has one hard commitment: SUPERGIRL at Cinemark Jordan Landing, 6:20 PM MDT, ticket already purchased per last night's Cinemark email. Gmail also shows a growing DailyPay balance ($1,035.73) and a Stripe card-expiring notice worth a quick fix. Vercel is fully green and unchanged; Spotify is idle.",
    summary: "GitHub's open-PR count fell to 29 (from 35): the entire prior Little_Local_World #21-#29 stack and LLM_Workbench #3 are no longer open, and four new PRs appeared today instead - Little_Local_World #32 and #33 (Slice 0 and Slice 1 of a new crisis-response-consequence line, both green with 245 and 259 tests respectively) plus #34 (an observer/audit PR still in draft, blocked on a Mac LM gate rerun after a recorded RED result) and LLM_Workbench #4 (harness metadata and guardrails, 124/124 local tests). Everything else on GitHub held steady: AI_Agents_Presentation #7, OpenBrain #1 (draft), dndAPI #15, command-information-center #1, the 20 bulk dependency-triage PRs from 06/11, and the stale TwinCountdown #1. Vercel is unchanged and fully green across all four projects, with the same digital-tome deploy-identity BLOCKED/ERROR cluster persisting from a prior CLI push. On the personal side, Gmail shows DailyPay's available balance climbing to $1,035.73 (from $927.68 last run), two small Venmo/Amazon charges ($26.19 + $17.34) from 06/30, and a Stripe notice that a card on file is expiring. The calendar's only entry through 07/05 is tonight's SUPERGIRL showing, auto-created from the Cinemark purchase confirmation email - a nice example of Gmail and Calendar already talking to each other. Locally, OpenBrain, DnDWebApp, and Little_Local_World were all touched within the last few hours, and the Wiki log picked up a fresh 07/01 OpenBrain entry, though AI_Agents_Presentation's PR #7 and today's DnDWebApp work still have no wiki footprint. Spotify's connector is healthy but idle this run; library stats are static since the April export.",
    actions: [
      {
        priority: "P1",
        title: "Tonight: SUPERGIRL at Cinemark Jordan Landing, 6:20 PM MDT",
        detail: "The Cinemark purchase confirmation (06/30 10:45 PM MDT) auto-created a calendar event for 6:20-7:20 PM MDT tonight at Cinemark Jordan Landing 24 and XD. Ticket is already purchased - just make sure to leave in time.",
        sources: ["gmail", "calendar"],
        due: "07/01/2026",
        money: false
      },
      {
        priority: "P1",
        title: "Sequence the Little_Local_World merge before the stack grows further",
        detail: "Three new PRs opened today under the owner-directed crisis-response-consequence line: #32 (Slice 0, ready, 245 tests) and #33 (Slice 1 dig-out, ready, 259 tests, stacked on #32) can merge in order now. #34 (observer decision audit) is still draft and explicitly flagged as needing a Mac LM gate rerun after a recorded RED result on commit 5f56638 - do not treat it as merge-ready until that rerun happens. LLM_Workbench #4 (124/124 local) is a separate, unstacked ready PR.",
        sources: ["github", "gptos"],
        due: "07/02/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Update the expiring card before a subscription lapses",
        detail: "Stripe emailed 07/01 04:42 AM MDT that a card on file is expiring. No dollar amount was named, but letting it lapse risks an interrupted subscription - update the payment method proactively.",
        sources: ["gmail"],
        due: "07/03/2026",
        money: false
      },
      {
        priority: "P2",
        title: "Reconcile the $1,035.73 DailyPay balance and the weekend Venmo/Amazon charges",
        detail: "DailyPay's available balance is now $1,035.73 (up from $927.68 last run) - decide whether to transfer it or let it ride to the regular paycheck. Two Venmo receipts for Amazon Marketplace purchases ($26.19 and $17.34, both 06/30) should be reconciled against the order history.",
        sources: ["gmail"],
        due: "07/03/2026",
        money: true
      },
      {
        priority: "P3",
        title: "Promote-or-close the two long-idle draft PRs",
        detail: "OpenBrain #1 (codex session sync) has been draft since 06/26 but OpenBrain was touched again this morning (07/01) per the local filesystem and wiki - worth deciding whether to finish and merge it. TwinCountdown #1 has been a stale draft since 04/07 and is a good candidate to just close.",
        sources: ["github", "gptos", "wiki"],
        due: "07/07/2026",
        money: false
      },
      {
        priority: "P3",
        title: "Close the remaining wiki gaps for this week's shipped work",
        detail: "The wiki log picked up a fresh 07/01 entry (OpenBrain Workbench v2), but AI_Agents_Presentation's PR #7 (room cleanup, 06/28) and today's DnDWebApp local work still have no dated entries. Add them so the log doesn't drift from the repos again.",
        sources: ["wiki", "gptos", "github"],
        due: "07/03/2026",
        money: false
      }
    ]
  },

  // ---- PANEL DATA ----
  gmail: {
    windowDays: 7,
    inboxThreadEstimate: 201,
    threads: [
      { subject: "You have $1035.73 available now. (DailyPay)",                         from: "support@dailypay.com",           date: "06/30", tag: "MONEY", money: true },
      { subject: "Receipt from AMAZON MKTPLACE PMTS - $26.19 (Venmo)",                   from: "venmo@venmo.com",                date: "06/30", tag: "MONEY", money: true },
      { subject: "Receipt from AMAZON MKTPLACE PMTS - $17.34 (Venmo)",                   from: "venmo@venmo.com",                date: "06/30", tag: "MONEY", money: true },
      { subject: "Please update your payment information",                              from: "card-expiring@stripe.com",       date: "07/01", tag: "DEADLINE" },
      { subject: "Cinemark Purchase Confirmation",                                       from: "cinemark@info.cinemark.com",     date: "06/30", tag: "INFO" },
      { subject: "Sign in to your Google Account",                                       from: "no-reply@accounts.google.com",   date: "06/30", tag: "INFO" },
      { subject: "Your one-time code is 446338 (Visa Click to Pay)",                     from: "no-reply@email.clicktopay.visa.com", date: "06/30", tag: "INFO" },
      { subject: "Introducing voyage-context-4: a next-gen contextualized chunk embedding model", from: "mongodb@team.mongodb.com", date: "07/01", tag: "INFO" },
      { subject: "Just scheduled: AWS virtual event - build agentic AI at scale (Meetup)", from: "info@email.meetup.com",        date: "07/01", tag: "INFO" },
      { subject: "\"Please drop your rental prices!\" (r/Utah)",                          from: "noreply@redditmail.com",        date: "07/01", tag: "INFO" }
    ],
    note: "~201 threads in 7d. Notable: DailyPay balance up to $1,035.73 (06/30); two Venmo/Amazon charges ($26.19 + $17.34, 06/30); a Stripe card-expiring notice (07/01); a Cinemark ticket confirmation (06/30) that auto-created tonight's calendar event; and a Google account sign-in security alert tied to a linked recovery address (06/30). No Robinhood daily statement or SOL staking notice surfaced this run, and no update on the Supabase Digital Tome pause from last run appeared in the pulled sample. Remaining noise is promo/social: MongoDB newsletter, Meetup AWS invite, r/Utah, Udemy AI-certs promo, Robinhood crypto livestream promo, Amazon shipment/credit notices."
  },

  calendar: {
    window: "07/01 - 07/05",
    events: [
      { title: "SUPERGIRL", start: "07/01/2026 06:20 PM MDT", end: "07/01/2026 07:20 PM MDT", location: "Cinemark Jordan Landing 24 and XD, 7301 S Jordan Landing, West Jordan, UT 84084", note: "Auto-created from the Cinemark purchase confirmation email (06/30)." }
    ],
    note: "Primary Google Calendar reachable (owner). One event in the 07/01-07/05 window: SUPERGIRL tonight, 6:20-7:20 PM MDT. Otherwise clear through 07/05."
  },

  github: {
    user: "KaydenClark",
    openPrCount: 29,
    batchNote: "author:KaydenClark open PRs DOWN to 29 (from 35). Last run's 9-PR Little_Local_World truth-loop stack (#21-#29) and LLM_Workbench #3 are no longer open (merged). Four new PRs opened today (07/01): Little_Local_World #32 (Slice 0, ready, 245 tests green), #33 (Slice 1 dig-out, ready, 259 tests green, stacked on #32), #34 (observer decision audit, DRAFT - Mac LM gate last recorded RED, needs rerun before merge-ready), and LLM_Workbench #4 (harness metadata/guardrails, ready, 124/124 local). Unchanged: AI_Agents_Presentation #7 (room cleanup, 06/28, ready - Playwright E2E blocked by a sandboxed download, not a merge blocker); OpenBrain #1 (codex session sync, 06/26) still draft; dndAPI #15 + command-information-center #1 (06/16 TDD, ready); 10 'Patch dependency security alerts' (06/11); 10 'Document dependency issue triage' (06/11); stale draft TwinCountdown #1 (04/07).",
    prs: [
      { repo: "Little_Local_World",          number: 34, title: "Observer decision audit + live LLM governor verification", opened: "07/01", readyToMerge: false },
      { repo: "Little_Local_World",          number: 33, title: "Slice 1: the dig-out - governor grows more food during a shortage", opened: "07/01", readyToMerge: true  },
      { repo: "Little_Local_World",          number: 32, title: "Make the starvation spiral escapable + governor food-sight (Slice 0)", opened: "07/01", readyToMerge: true  },
      { repo: "LLM_Workbench",               number: 4,  title: "Add structured harness metadata and guardrails", opened: "07/01", readyToMerge: true  },
      { repo: "AI_Agents_Presentation",      number: 7,  title: "Interactive room cleanup flow: drag -> prompt -> agent + Chat slide", opened: "06/28", readyToMerge: true  },
      { repo: "OpenBrain",                   number: 1,  title: "[codex] Add Codex session sync (draft)", opened: "06/26", readyToMerge: false },
      { repo: "dndAPI",                      number: 15, title: "test: expand coverage with Red/Green TDD setup and graceful MongoDB fallback", opened: "06/16", readyToMerge: true  },
      { repo: "command-information-center",  number: 1,  title: "Add comprehensive test coverage (Red/Green TDD) + wire SPOTIFY_REQUEST_TIMEOUT_MS", opened: "06/16", readyToMerge: true  },
      { repo: "TwinCountdown",               number: 1,  title: "Add horse-racing countdown landing page with interactive track and celebration (Codex, stale)", opened: "04/07", readyToMerge: false }
    ]
  },

  vercel: {
    team: "kaydenclark725's projects",
    projects: [
      { name: "digital-tome",           state: "READY", target: "production", commit: "Record hosted deployment verification", branch: "main", deployed: "06/23/2026 12:10 AM MDT" },
      { name: "ai-agents-presentation", state: "READY", target: "production", commit: "Record Vercel beta deployment (06/28 preview burst still green: PR #7 branch + prior merges all READY)", branch: "codex/v2.1-five-scene-ladder", deployed: "06/22/2026 01:14 AM MDT" },
      { name: "dndwebapp-client",       state: "READY", target: "production", commit: "Update client validation docs", branch: "Game_Plan_CC", deployed: "06/03/2026 10:09 PM MDT" },
      { name: "dndwebapp-api",          state: "READY", target: "production", commit: "Update API validation docs",    branch: "Game_Plan_CC", deployed: "06/03/2026 10:08 PM MDT" }
    ]
  },

  drive: {
    recent: [
      { type: "DOC",    title: "Gods of Azlemzyk (worldbuilding)",                        when: "06/25/2026", money: false },
      { type: "DOC",    title: "claude-code-agent-demo-prompt.md",                        when: "06/21/2026", money: false },
      { type: "FOLDER", title: "Investing",                                               when: "06/15/2026", money: true  },
      { type: "FOLDER", title: "Deep Research",                                           when: "05/26/2026", money: true  },
      { type: "DOC",    title: "AI_Infrastructure_Public_Market_Beneficiaries_Research",  when: "06/18/2026", money: true  },
      { type: "MD",     title: "AI Infrastructure Buildout: Public-Market Beneficiaries", when: "06/15/2026", money: true  }
    ],
    note: "Drive reachable. Top 6 of 10 recent files shown; unchanged since last run - newest by recency is still the worldbuilding doc 'Gods of Azlemzyk' (viewed 06/25). No new Drive activity this run."
  },

  money: {
    events: [
      { label: "DailyPay - available wages", status: "$1,035.73 of earned wages available in the Connexus account", amount: "$1035.73", date: "06/30", money: true },
      { label: "Venmo - Amazon Marketplace",  status: "Purchase receipt", amount: "$26.19", date: "06/30", money: true },
      { label: "Venmo - Amazon Marketplace",  status: "Purchase receipt", amount: "$17.34", date: "06/30", money: true }
    ],
    accounts: [],
    note: "DailyPay's available balance climbed to $1,035.73 (from $927.68 last run) - collect or let it ride to the regular check. Two small Venmo/Amazon Marketplace charges landed 06/30 ($26.19 + $17.34). Separately, Stripe flagged an expiring card (07/01, no dollar amount named - see briefing P2). No Robinhood daily statement or SOL staking notice surfaced this run."
  },

  // ---- Spotify: connector healthy this run (idle, no active playback); library stats from local export ----
  spotify: {
    nowPlaying: null,
    nowPlayingNote: "Spotify now-playing probe returned no active session this run (idle). Library stats below from the local April 04.04.26 export, unchanged since it's a static file.",
    library: {
      tracks: 5247,
      hours: 315.0,
      playlists: 10,
      lastAdded: "04/04/2026",
      exportNote: "Stats parsed this run from Projects/Spotify/Playlists 04.04.26/Liked_Songs.csv (5,247 rows, 315.0 hrs); 10 playlist CSVs alongside it (excluding Liked_Songs and audit files)."
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
      { track: "mostly chimes",               artist: "Adrianne Lenker", added: "04/04" },
      { track: "Sadness As A Gift",           artist: "Adrianne Lenker", added: "04/04" },
      { track: "Aria Math Bass Orchestra",    artist: "Juuuyh",          added: "04/04" },
      { track: "Aria Math Double Bass Cover", artist: "Landon Bassier",  added: "04/04" }
    ]
  },

  // ---- Local GPT_OS projects by last-modified ----
  projects: {
    root: "GPT_OS/Projects",
    items: [
      { name: "OpenBrain",                  touched: "07/01/2026", note: "newest-touched project (07/01 05:09 AM); matches the fresh 'OpenBrain Workbench v2' wiki entry; OpenBrain PR #1 (codex session sync) still a draft" },
      { name: "DnDWebApp",                  touched: "07/01/2026", note: "touched 07/01 04:09 AM; dndAPI PR #15 unchanged (06/16) - no new PR yet for this session's local work" },
      { name: "Little_Local_World",         touched: "07/01/2026", note: "touched 07/01 03:47 AM; matches today's 3 new PRs (#32 Slice 0 ready, #33 Slice 1 ready, #34 observer audit draft/gate-RED) under the crisis-response-consequence initiative" },
      { name: "Command Information Center", touched: "06/30/2026", note: "this dashboard's repo; command-information-center PR #1 (TDD) still open" },
      { name: "AI_Agents_Presentation",     touched: "06/28/2026", note: "PR #7 (room cleanup, ready) open, Vercel previews green" },
      { name: "ChatDev",                    touched: "06/24/2026", note: "still local-only with no repo or Wiki footprint" },
      { name: "Robinhood Trading",          touched: "06/23/2026", note: "no new Robinhood email activity surfaced this run" },
      { name: "DigitalTome",                touched: "06/22/2026", note: "digital-tome Vercel production still READY (06/23); older BLOCKED/ERROR CLI deploys persist; no Supabase pause status update in this run's Gmail sample" }
    ]
  },

  // ---- Wiki - Kayden activity log (newest dated entries) ----
  wiki: {
    name: "Wiki - Kayden",
    entries: [
      { date: "06/19/2026", title: "ops | Command Information Center local dashboard" },
      { date: "06/20/2026", title: "project | AI Agents Presentation OpenAI migration" },
      { date: "06/23/2026", title: "organization | GPT_OS project routing cleanup" },
      { date: "06/23/2026", title: "project update | Robinhood Trading workbench cleanup" },
      { date: "07/01/2026", title: "project update | OpenBrain Workbench v2" }
    ]
  },

  ifttt: {
    applets: [
      { name: "ACC Shutdown PC", enabled: true, services: "Google Assistant -> Dropbox" },
      { name: "ACC Restart PC",  enabled: true, services: "Google Assistant -> Dropbox" }
    ]
  }
};
