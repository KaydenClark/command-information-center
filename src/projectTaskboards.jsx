import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Folder,
  FolderKanban,
  GitBranch,
  ListChecks,
  ListFilter,
  LockKeyhole,
  MonitorSmartphone,
  RefreshCw,
  Rocket,
  Search
} from "lucide-react";
import { matchGithubPrs, matchVercelProject, nextStatusFilter } from "./projectOps.js";

const GROUPS = [
  { key: "ready", label: "Ready", icon: CircleDot },
  { key: "inProgress", label: "In progress", icon: Clock3 },
  { key: "blocked", label: "Blocked", icon: AlertTriangle },
  { key: "deferred", label: "Deferred", icon: ChevronRight },
  { key: "done", label: "Done", icon: CheckCircle2 }
];
const PRIORITIES = ["P1", "P2", "P3"];

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function taskStatusClass(group) {
  if (group === "done") return "ok";
  if (group === "blocked") return "bad";
  if (group === "deferred") return "warn";
  return "active";
}

function formatUpdated(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function ProjectTaskboards({ vercel, github }) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [board, setBoard] = useState(null);
  const [repoStatus, setRepoStatus] = useState(null);
  const [mode, setMode] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestJson("/api/project-taskboards")
      .then(({ projects: nextProjects }) => {
        if (cancelled) return;
        setProjects(nextProjects);
        const preferred = nextProjects.find((project) => project.slug === "command-information-center") || nextProjects[0];
        setSelected((current) => current || preferred?.slug || "");
      })
      .catch((nextError) => !cancelled && setError(nextError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    requestJson(`/api/project-taskboards/${encodeURIComponent(selected)}`)
      .then((nextBoard) => !cancelled && setBoard(nextBoard))
      .catch((nextError) => !cancelled && setError(nextError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    if (!selected) return undefined;
    let cancelled = false;
    setRepoStatus(null);
    requestJson(`/api/project-taskboards/${encodeURIComponent(selected)}/status`)
      .then((status) => !cancelled && setRepoStatus(status))
      .catch(() => !cancelled && setRepoStatus({ unavailable: true }));
    return () => { cancelled = true; };
  }, [selected]);

  const filteredGroups = useMemo(() => {
    if (!board) return {};
    return Object.fromEntries(GROUPS.map(({ key }) => {
      if (statusFilter !== "all" && statusFilter !== key) return [key, []];
      return [key, (board.groups[key] || []).filter((task) => {
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return [task.id, task.title, task.owner, task.detail].some((value) => String(value || "").toLowerCase().includes(query));
      })];
    }));
  }, [board, priorityFilter, search, statusFilter]);

  async function changePriority(taskId, nextPriority) {
    const previous = board;
    setSavingTask(taskId);
    setError("");
    setBoard((current) => ({
      ...current,
      groups: Object.fromEntries(Object.entries(current.groups).map(([key, tasks]) => [
        key,
        tasks.map((task) => (task.id === taskId ? { ...task, priority: nextPriority } : task))
      ]))
    }));
    try {
      await requestJson(`/api/project-taskboards/${encodeURIComponent(selected)}/tasks/${encodeURIComponent(taskId)}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ priority: nextPriority })
      });
    } catch (nextError) {
      setBoard(previous);
      setError(nextError.message);
    } finally {
      setSavingTask("");
    }
  }

  function selectProject(slug) {
    if (slug === selected) return;
    setSelected(slug);
    setMode("overview");
    setExpandedTask("");
  }

  function handleCountClick(key) {
    setStatusFilter(nextStatusFilter(statusFilter, key));
    setMode("board");
  }

  const visibleGroups = GROUPS.filter(({ key }) => statusFilter === "all" || statusFilter === key);
  const countChips = board ? [
    { key: "all", label: "Total", icon: ListChecks, value: board.taskCount },
    { key: "ready", label: "Ready", icon: CircleDot, value: board.counts.ready },
    { key: "inProgress", label: "Active", icon: Clock3, value: board.counts.inProgress },
    { key: "blocked", label: "Blocked", icon: AlertTriangle, value: board.counts.blocked },
    { key: "done", label: "Done", icon: CheckCircle2, value: board.counts.done }
  ] : [];
  const deploy = board ? matchVercelProject(vercel?.projects, board.name, board.slug) : null;
  const openPrs = board ? matchGithubPrs(github?.prs, { repo: repoStatus?.remote?.repo, name: board.name, slug: board.slug }) : [];

  return (
    <section className="project-taskboards" data-testid="project-taskboards">
      <aside className="panel project-rail">
        <div className="panel-title">
          <span className="panel-icon lavender"><FolderKanban size={17} /></span>
          <div><h2>Project Taskboards</h2><small>Canonical TASKBOARD.md files</small></div>
        </div>
        <label className="project-search">
          <Search size={15} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter tasks" />
        </label>
        <nav className="project-list" aria-label="Projects with taskboards">
          {projects.map((project) => (
            <button
              key={project.slug}
              className={selected === project.slug ? "active" : ""}
              onClick={() => selectProject(project.slug)}
            >
              <span className="project-list-icon">{selected === project.slug ? <FolderKanban size={16} /> : <Folder size={16} />}</span>
              <span className="project-list-copy"><strong>{project.name}</strong><small>{project.decisionCount} decisions · {project.taskCount} tasks</small></span>
              <b>{project.counts.inProgress}</b>
            </button>
          ))}
        </nav>
      </aside>

      <div className="panel project-workspace">
        {loading && !board ? <div className="project-loading"><RefreshCw className="spin" size={24} /> Loading project taskboards…</div> : null}
        {error ? <div className="error-banner project-error">{error}</div> : null}
        {board ? (
          <>
            <header className="project-board-header">
              <div className="project-identity">
                <span className="project-title-icon"><FolderKanban size={22} /></span>
                <div>
                  <h2>{board.name}</h2>
                  <p>{board.brief[0] || "Repository-backed project taskboard"}</p>
                  <small className="project-freshness"><LockKeyhole size={12} /> Local project <span /> <RefreshCw size={12} /> Fresh from TASKBOARD.md · {formatUpdated(board.updatedAt)}</small>
                </div>
              </div>
              <div className="project-counts" aria-label="Project task counts">
                {countChips.map(({ key, label, icon: Icon, value }) => (
                  <button
                    key={key}
                    className={statusFilter === key && mode === "board" ? "active" : ""}
                    onClick={() => handleCountClick(key)}
                    aria-pressed={statusFilter === key && mode === "board"}
                    title={key === "all" ? "Show every task group" : `Show only ${label.toLowerCase()} tasks`}
                  >
                    <Icon size={14} /><strong>{value}</strong><small>{label}</small>
                  </button>
                ))}
              </div>
            </header>

            {mode === "overview" ? (
              <>
                <section className="decision-section">
                  <div className="section-header">
                    <span><AlertTriangle size={16} /> Decisions needed</span>
                    <small>{board.decisions.length} open</small>
                  </div>
                  {board.decisions.length ? (
                    <div className="decision-list">
                      {board.decisions.map((decision) => (
                        <article key={decision.id} className="decision-row">
                          <span className="decision-id">{decision.id}</span>
                          <div><strong>{decision.decision}</strong><small>{decision.options || decision.impact || "Owner input is required."}</small></div>
                          <div><small>Recommendation</small><span>{decision.recommendation || "No recommendation recorded"}</span></div>
                          <div><small>Owner</small><span>{decision.owner || "Unassigned"}</span></div>
                        </article>
                      ))}
                    </div>
                  ) : <div className="decision-clear"><Archive size={16} /> No open owner decisions in this taskboard.</div>}
                </section>

                <div className="project-ops" aria-label="Project delivery status">
                  <article className="ops-card">
                    <div className="ops-head">
                      <span className="ops-icon cerulean"><Rocket size={15} /></span>
                      <strong>Vercel</strong>
                      {deploy
                        ? <span className={`status-label ${deploy.state === "READY" ? "ok" : deploy.state === "ERROR" ? "bad" : "warn"}`}>{deploy.state}</span>
                        : <span className="status-label warn">No deploy</span>}
                    </div>
                    {deploy ? (
                      <>
                        <small>{deploy.name} · {deploy.target || deploy.branch}</small>
                        <p>{deploy.commit || "Latest deployment"}</p>
                        <time>Deployed {deploy.deployed}</time>
                      </>
                    ) : <p>No Vercel project in the feed matches this project.</p>}
                  </article>

                  <article className="ops-card">
                    <div className="ops-head">
                      <span className="ops-icon lavender"><GitBranch size={15} /></span>
                      <strong>GitHub</strong>
                      {openPrs.length
                        ? <span className="status-label warn">{openPrs.length} open PR{openPrs.length === 1 ? "" : "s"}</span>
                        : repoStatus?.remote ? <span className="status-label ok">No open PRs</span> : null}
                    </div>
                    {!repoStatus ? <p>Checking repository…</p>
                      : repoStatus.unavailable ? <p>Repo status is unavailable right now.</p>
                      : repoStatus.git === false ? <p>This project folder is not a git repository.</p>
                      : repoStatus.remote ? (
                        <>
                          <small>{repoStatus.remote.repo || repoStatus.remote.url}</small>
                          {repoStatus.remote.lastKnownCommit ? (
                            <>
                              <p>{repoStatus.remote.lastKnownCommit.subject || "Last known remote commit"}</p>
                              <time>Updated {formatUpdated(repoStatus.remote.lastKnownCommit.committedAt)} · {repoStatus.remote.lastKnownCommit.ref}</time>
                            </>
                          ) : <p>No remote history has been fetched yet.</p>}
                        </>
                      ) : <p>No origin remote is configured.</p>}
                  </article>

                  <article className="ops-card">
                    <div className="ops-head">
                      <span className="ops-icon gold"><MonitorSmartphone size={15} /></span>
                      <strong>Integration sync</strong>
                      {repoStatus?.git ? (
                        repoStatus.dirtyFiles
                          ? <span className="status-label warn">{repoStatus.dirtyFiles} uncommitted</span>
                          : <span className="status-label ok">Clean</span>
                      ) : null}
                    </div>
                    {!repoStatus ? <p>Checking repository…</p>
                      : repoStatus.git ? (
                        <>
                          <small>On {repoStatus.branch || "unknown branch"}</small>
                          <p>{repoStatus.integration
                            ? `Integration last commit ${formatUpdated(repoStatus.integration.committedAt)} (${repoStatus.integration.ref})`
                            : "No Integration branch in this repo."}</p>
                          <time>{repoStatus.lastSyncAt
                            ? `${repoStatus.machine} last synced ${formatUpdated(repoStatus.lastSyncAt)}`
                            : `No remote sync recorded on ${repoStatus.machine}`}</time>
                        </>
                      ) : <p>Sync status needs a git repository.</p>}
                  </article>
                </div>

                {board.brief.length > 1 ? (
                  <section className="overview-brief">
                    <div className="section-header"><span><ListChecks size={15} /> Executive brief</span></div>
                    <ul>{board.brief.map((line) => <li key={line}>{line}</li>)}</ul>
                  </section>
                ) : null}

                <div className="overview-actions">
                  <button className="open-board-button" onClick={() => setMode("board")}>
                    <FolderKanban size={16} /><span>Open taskboard</span><ChevronRight size={15} />
                  </button>
                </div>
              </>
            ) : (
            <>
            <div className="taskboard-toolbar">
              <button className="board-back" onClick={() => setMode("overview")} aria-label="Back to project overview">
                <ArrowLeft size={14} /> Overview
              </button>
              <span><ListFilter size={15} /> Task view</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter project tasks by status">
                <option value="all">All statuses</option>
                {GROUPS.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter project tasks by priority">
                <option value="all">All priorities</option>
                {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </div>

            <div className="project-task-groups">
              {visibleGroups.map(({ key, label, icon: Icon }) => {
                const tasks = filteredGroups[key] || [];
                return (
                  <section className={`project-task-group ${key}`} key={key}>
                    <div className="project-group-head">
                      <span><Icon size={16} /> {label}</span>
                      <small>{tasks.length}{tasks.length !== board.groups[key].length ? ` of ${board.groups[key].length}` : ""}</small>
                    </div>
                    {tasks.length ? tasks.map((task) => {
                      const isExpanded = expandedTask === `${key}:${task.id}`;
                      return (
                        <article className="project-task-record" key={`${key}:${task.id}`}>
                          <div className="project-task-row">
                            <span className="task-id">{task.id}</span>
                            <button className="task-title-button" onClick={() => setExpandedTask(isExpanded ? "" : `${key}:${task.id}`)}>
                              <strong>{task.title}</strong>
                            </button>
                            {task.priority ? (
                              <select
                                className={`priority-select ${task.priority}`}
                                value={task.priority}
                                disabled={savingTask === task.id}
                                onChange={(event) => changePriority(task.id, event.target.value)}
                                aria-label={`Priority for ${task.title}`}
                              >
                                {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                              </select>
                            ) : <span className="priority-empty">—</span>}
                            <span className={`task-status ${taskStatusClass(key)}`}>{task.status}</span>
                            <span className="task-owner">{task.owner || "Unassigned"}</span>
                            <time>{task.lastUpdated || "—"}</time>
                            <button className="row-expand" onClick={() => setExpandedTask(isExpanded ? "" : `${key}:${task.id}`)} aria-label={`${isExpanded ? "Hide" : "Show"} details for ${task.title}`}>
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                          </div>
                          {isExpanded ? <div className="project-task-detail">{task.detail || "No additional task detail is recorded in this row."}</div> : null}
                        </article>
                      );
                    }) : <div className="group-empty">No matching {label.toLowerCase()} tasks.</div>}
                  </section>
                );
              })}
            </div>
            </>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
