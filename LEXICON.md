# Command Information Center - Lexicon

> Generated from LLM Workbench v2.3.

| Term | Meaning |
|---|---|
| Command Information Center (CIC) | The human-facing monitoring and safe-control surface. |
| Personal To-Dos | Mutable operator tasks stored in CIC's local SQLite database. |
| Repository Taskboard | A generated projection of active project specs; it is not CIC's Personal To-Dos store. |
| OpenBrain | The separate source-backed retrieval and context infrastructure CIC consumes. |
| Personal Intelligence Platform | The cross-project compatibility and health layer between OpenBrain and CIC. |
| Degraded state | An honest, visible state showing a dependency is missing, stale, or failing. |
| Source freshness | The last durable attempt or success for a source, not the time CIC rendered a response. |
| Stable spec | A capability record owning requirements, decisions, acceptance, and append-only proof. |
| Canonical project action | A bounded request against an exact project/spec/ticket or owner-decision identity that is applied through the owning project's lifecycle; it never treats generated `TASKBOARD.md` as the source of truth. |
| Cached source state | Information loaded from the summarized feed or a cached report without proof that CIC contacted the source during the current request. |
| Durable source freshness | The last recorded external-source attempt and successful update plus its age; it is not page-load or API-response time. |
| Scheduled Gmail worker | The interval-first background path registered at server startup that invokes the same bounded Gmail refresh as the on-demand route; its machine-sensitive command and scheduler evidence remain server-side. |
| Scheduled Prescient assessment | The optional paid background OpenAI assessment that reconciles only system-flagged `prescient_tasks` through server-side Supabase service-role access; it is distinct from interactive Intelligence reads. |
| CIC-safe Atlas aggregate | The versioned, bounded, read-only Spotify Atlas projection CIC validates and further normalizes; it contains summarized listening statistics and provenance, never raw stream rows, provider credentials, or a sync/write action. |
| Runtime deployment identity | Sanitized evidence of the exact CIC source SHA whose built assets and server code are running, distinct from the canonical runtime-data root and repository release state. |
| Bounded connector action | One authenticated source-specific action with fixed inputs, server-owned configuration, bounded execution, and honest durable outcome; not a generic command or HTTP executor. |
| CIC notification event | An allowlisted server-originated alert with a fixed severity, sanitized source reference, deduplication identity, and server-only Discord destination. Its delivery result is notification evidence only; it never replaces the linked CIC or canonical-source outcome. |
| Captain daily pass | The externally scheduled once-daily GPT_OS Captain coordination run defined by `Scheduled/Captain/CAPTAIN_DAILY.md` and its automation config; CIC displays it read-only and never runs, edits, or owns it. |
| Selection-preview forecast | CIC's deterministic, bounded estimate of what the next Captain pass will select, derived from parsed canonical project specs under the one-focus-project and three-slice bounds; it is labeled non-authoritative and never a claim or dispatch. |
| Captain machine state | The pass runner's reconstructable `captain-state.json` envelope plus dated pass memory; machine-local evidence CIC validates and displays with freshness, never canonical project truth. |
| Project ID | The stable `P-###` operator reference owned by the canonical GPT_OS project registry. |
| Composite spec reference | A globally unambiguous `P-###/S-###` reference joining a Project ID to that repository's local stable spec ID. |
| Workbench release candidate | The fixed, read-only `KaydenClark/LLM_Workbench` `integration` to `main` PR and exact-SHA Auditor evidence that CIC revalidates before accepting intent. |
| Workbench release approval | A one-time, step-up-authenticated, fingerprint-bound Captain operation recorded in CIC; it is durable intent, not merge execution. |
| Workbench release executor | The narrow server-only path that atomically claims one recorded approval, revalidates its exact PR, SHAs, and Auditor gate, and requests only a merge commit for that fixed operation. |
