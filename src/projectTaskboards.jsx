import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Folder,
  FolderKanban,
  ListChecks,
  ListFilter,
  LockKeyhole,
  RefreshCw,
  Search
} from "lucide-react";

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

function specStatusClass(status) {
  const value = String(status || "").toLowerCase();
  if (/done|complete|applied|pass/.test(value)) return "ok";
  if (/block|unreadable|fail/.test(value)) return "bad";
  if (/ready|progress|active|claimed/.test(value)) return "active";
  return "warn";
}

function specReference(projectId, specId) {
  return projectId ? `${projectId}/${specId}` : `Unnumbered/${specId}`;
}

function specMatchesSearch(spec, query, projectId) {
  if (!query) return true;
  const haystack = [specReference(projectId, spec.id), spec.id, spec.title, spec.description, spec.owner, spec.status]
    .concat(spec.tickets.flatMap((ticket) => [ticket.id, ticket.title, ticket.status, ticket.blockers]));
  return haystack.some((value) => String(value || "").toLowerCase().includes(query));
}

function formatUpdated(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function ProjectTaskboards() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [board, setBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState("");
  const [expandedSpec, setExpandedSpec] = useState("");
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
    setExpandedSpec("");
    requestJson(`/api/project-taskboards/${encodeURIComponent(selected)}`)
      .then((nextBoard) => !cancelled && setBoard(nextBoard))
      .catch((nextError) => !cancelled && setError(nextError.message))
      .finally(() => !cancelled && setLoading(false));
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

  const visibleGroups = GROUPS.filter(({ key }) => statusFilter === "all" || statusFilter === key);
  const specs = board?.specs || [];
  const searchQuery = search.trim().toLowerCase();
  const visibleSpecs = specs.filter((spec) => specMatchesSearch(spec, searchQuery, board?.projectId));
  const showLegacyGroups = Boolean(board && (board.legacyTaskCount > 0 || !specs.length));

  return (
    <section className="project-taskboards" data-testid="project-taskboards">
      <aside className="panel project-rail">
        <div className="panel-title">
          <span className="panel-icon lavender"><FolderKanban size={17} /></span>
          <div><h2>Project Taskboards</h2><small>Canonical TASKBOARD.md files</small></div>
        </div>
        <label className="project-search">
          <Search size={15} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter specs and tickets" />
        </label>
        <nav className="project-list" aria-label="Projects with taskboards">
          {projects.map((project) => (
            <button
              key={project.slug}
              className={selected === project.slug ? "active" : ""}
              onClick={() => setSelected(project.slug)}
            >
              <span className="project-list-icon">{selected === project.slug ? <FolderKanban size={16} /> : <Folder size={16} />}</span>
              <span className="project-list-copy">
                <strong><span className={`project-id ${project.projectId ? "" : "missing"}`}>{project.projectId || "Unnumbered"}</span>{project.name}</strong>
                <small>{project.specCount ? `${project.specCount} specs · ` : ""}{project.decisionCount} decisions · {project.taskCount} tickets</small>
              </span>
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
                  <h2><span className={`project-id ${board.projectId ? "" : "missing"}`}>{board.projectId || "Unnumbered"}</span>{board.name}</h2>
                  <p>{board.brief[0] || "Repository-backed project taskboard"}</p>
                  <small className="project-freshness"><LockKeyhole size={12} /> Local project <span /> <RefreshCw size={12} /> Fresh from TASKBOARD.md · {formatUpdated(board.updatedAt)}</small>
                </div>
              </div>
              <div className="project-counts" aria-label="Project ticket counts">
                <span><ListChecks size={14} /><strong>{board.taskCount}</strong><small>Total</small></span>
                <span><CircleDot size={14} /><strong>{board.counts.ready}</strong><small>Ready</small></span>
                <span><Clock3 size={14} /><strong>{board.counts.inProgress}</strong><small>Active</small></span>
                <span><AlertTriangle size={14} /><strong>{board.counts.blocked}</strong><small>Blocked</small></span>
                <span><CheckCircle2 size={14} /><strong>{board.counts.done}</strong><small>Done</small></span>
              </div>
            </header>

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

            {specs.length ? (
              <section className="spec-section" data-testid="spec-section">
                <div className="section-header">
                  <span><ListChecks size={16} /> Specs</span>
                  <small>{visibleSpecs.length}{visibleSpecs.length !== specs.length ? ` of ${specs.length}` : ""}</small>
                </div>
                <div className="spec-list">
                  {visibleSpecs.map((spec) => {
                    const isOpen = expandedSpec === spec.id;
                    const doneTickets = spec.tickets.filter((ticket) => specStatusClass(ticket.status) === "ok").length;
                    return (
                      <article className="spec-record" key={spec.id}>
                        <button
                          className="spec-row"
                          onClick={() => setExpandedSpec(isOpen ? "" : spec.id)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Hide" : "Show"} tickets for ${specReference(board.projectId, spec.id)}`}
                        >
                          <span className="task-id">{specReference(board.projectId, spec.id)}</span>
                          <strong>{spec.title}</strong>
                          <span className={`task-status ${specStatusClass(spec.status)}`}>{spec.status}</span>
                          <small className="spec-ticket-count">{spec.tickets.length ? `${doneTickets}/${spec.tickets.length} tickets done` : "No tickets"}</small>
                          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                        {isOpen ? (
                          <div className="spec-detail">
                            {spec.description ? <p>{spec.description}</p> : null}
                            <div className="spec-meta">
                              <span><small>Owner</small>{spec.owner || "Unassigned"}</span>
                              <span><small>Priority</small>{spec.priority || "—"}</span>
                              <span><small>Updated</small>{spec.updated || "—"}</span>
                              <span><small>Blockers</small>{spec.blockers || "none"}</span>
                              <span><small>Next gate</small>{spec.nextGate || "—"}</span>
                            </div>
                            {spec.latestEvent ? <small className="spec-event">Latest event: {spec.latestEvent}</small> : null}
                            {spec.tickets.length ? (
                              <div className="spec-tickets">
                                {spec.tickets.map((ticket) => (
                                  <div className="spec-ticket-row" key={`${spec.id}:${ticket.id}`}>
                                    <span className="task-id">{ticket.id}</span>
                                    <strong>{ticket.title}</strong>
                                    <span className={`task-status ${specStatusClass(ticket.status)}`}>{ticket.status}</span>
                                    <span className="ticket-note">
                                      {ticket.blockers && ticket.blockers.toLowerCase() !== "none" ? `Blocked on: ${ticket.blockers}` : ticket.proof || ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : <div className="group-empty">No tickets recorded in this spec yet.</div>}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                  {!visibleSpecs.length ? <div className="group-empty">No specs match this filter.</div> : null}
                </div>
              </section>
            ) : null}

            {showLegacyGroups ? (
            <>
            <div className="taskboard-toolbar">
              <span><ListFilter size={15} /> Ticket view</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter project tickets by status">
                <option value="all">All statuses</option>
                {GROUPS.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter project tickets by priority">
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
                          {isExpanded ? <div className="project-task-detail">{task.detail || "No additional detail is recorded on this ticket."}</div> : null}
                        </article>
                      );
                    }) : <div className="group-empty">No matching {label.toLowerCase()} tickets.</div>}
                  </section>
                );
              })}
            </div>
            </>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
