import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Pencil,
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
const STATUSES = ["ready", "claimed", "in-progress", "gated", "needs-review", "blocked", "deferred", "done"];

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

function InlineEdit({ value, fallback, disabled, label, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const committedRef = useRef(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="inline-edit"
        disabled={disabled}
        onClick={() => { committedRef.current = false; setDraft(value || ""); setEditing(true); }}
        aria-label={`Edit ${label}`}
      >
        <span>{value || fallback}</span>
        <Pencil size={11} />
      </button>
    );
  }

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    const next = draft.trim();
    if (next !== (value || "").trim()) onSave(next);
  };

  return (
    <input
      className="inline-edit-input"
      autoFocus
      value={draft}
      aria-label={label}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") { committedRef.current = true; setEditing(false); }
      }}
    />
  );
}

export function ProjectTaskboards() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [board, setBoard] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState("");
  const [savingDecision, setSavingDecision] = useState("");
  const [resolvingDecision, setResolvingDecision] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
    setConflict(false);
    requestJson(`/api/project-taskboards/${encodeURIComponent(selected)}`)
      .then((nextBoard) => {
        if (cancelled) return;
        setBoard(nextBoard);
        setExpandedTask("");
        setResolvingDecision("");
      })
      .catch((nextError) => !cancelled && setError(nextError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [selected, reloadKey]);

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

  function handleSaveError(nextError) {
    setError(nextError.message);
    if (/changed on disk/i.test(nextError.message)) setConflict(true);
  }

  function applyTaskPatch(current, taskId, patch) {
    return {
      ...current,
      groups: Object.fromEntries(Object.entries(current.groups).map(([key, tasks]) => [
        key,
        tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
      ]))
    };
  }

  async function saveTaskEdit(taskId, patch, request) {
    const previous = board;
    setSavingTask(taskId);
    setError("");
    setBoard((current) => applyTaskPatch(current, taskId, patch));
    try {
      const result = await request(board.version);
      setBoard((current) => ({ ...current, updatedAt: result.updatedAt, version: result.version }));
    } catch (nextError) {
      setBoard(previous);
      handleSaveError(nextError);
    } finally {
      setSavingTask("");
    }
  }

  function changePriority(taskId, priority) {
    return saveTaskEdit(taskId, { priority }, (version) => requestJson(
      `/api/project-taskboards/${encodeURIComponent(selected)}/tasks/${encodeURIComponent(taskId)}/priority`,
      { method: "PATCH", body: JSON.stringify({ priority, version }) }
    ));
  }

  function changeTaskField(taskId, field, value, patch) {
    return saveTaskEdit(taskId, patch, (version) => requestJson(
      `/api/project-taskboards/${encodeURIComponent(selected)}/tasks/${encodeURIComponent(taskId)}`,
      { method: "PATCH", body: JSON.stringify({ field, value, version }) }
    ));
  }

  async function saveDecision(decisionId, body, applyBoard) {
    const previous = board;
    setSavingDecision(decisionId);
    setError("");
    setBoard(applyBoard);
    try {
      const result = await requestJson(
        `/api/project-taskboards/${encodeURIComponent(selected)}/decisions/${encodeURIComponent(decisionId)}`,
        { method: "PATCH", body: JSON.stringify({ ...body, version: board.version }) }
      );
      setBoard((current) => ({ ...current, updatedAt: result.updatedAt, version: result.version }));
      return true;
    } catch (nextError) {
      setBoard(previous);
      handleSaveError(nextError);
      return false;
    } finally {
      setSavingDecision("");
    }
  }

  async function resolveDecision(decisionId) {
    const note = resolutionNote.trim();
    const done = await saveDecision(
      decisionId,
      { status: "decided", ...(note ? { recommendation: note } : {}) },
      (current) => ({ ...current, decisions: current.decisions.filter((decision) => decision.id !== decisionId) })
    );
    if (done) {
      setResolvingDecision("");
      setResolutionNote("");
    }
  }

  function changeDecisionOwner(decisionId, owner) {
    return saveDecision(
      decisionId,
      { owner },
      (current) => ({
        ...current,
        decisions: current.decisions.map((decision) => (decision.id === decisionId ? { ...decision, owner } : decision))
      })
    );
  }

  function toggleTask(key, task) {
    const taskKey = `${key}:${task.id}`;
    if (expandedTask === taskKey) {
      setExpandedTask("");
      return;
    }
    setExpandedTask(taskKey);
    setNoteDraft(task.detail || "");
  }

  const visibleGroups = GROUPS.filter(({ key }) => statusFilter === "all" || statusFilter === key);

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
              onClick={() => setSelected(project.slug)}
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
        {error ? (
          <div className="error-banner project-error">
            {error}
            {conflict ? (
              <button className="banner-refresh" onClick={() => setReloadKey((key) => key + 1)}>
                <RefreshCw size={13} /> Reload board
              </button>
            ) : null}
          </div>
        ) : null}
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
                    <article key={decision.id} className="decision-record">
                      <div className="decision-row">
                        <span className="decision-id">{decision.id}</span>
                        <div><strong>{decision.decision}</strong><small>{decision.options || decision.impact || "Owner input is required."}</small></div>
                        <div><small>Recommendation</small><span>{decision.recommendation || "No recommendation recorded"}</span></div>
                        <div>
                          <small>Owner</small>
                          {decision.editable?.owner ? (
                            <InlineEdit
                              value={decision.owner}
                              fallback="Unassigned"
                              disabled={savingDecision === decision.id}
                              label={`owner for decision ${decision.id}`}
                              onSave={(value) => changeDecisionOwner(decision.id, value)}
                            />
                          ) : <span>{decision.owner || "Unassigned"}</span>}
                        </div>
                        <div className="decision-actions">
                          {decision.editable?.status ? (
                            <button
                              className="decision-resolve"
                              disabled={savingDecision === decision.id}
                              onClick={() => {
                                setResolvingDecision(resolvingDecision === decision.id ? "" : decision.id);
                                setResolutionNote(decision.recommendation || "");
                              }}
                            >
                              <CheckCircle2 size={13} /> Resolve
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {resolvingDecision === decision.id ? (
                        <div className="decision-resolve-form">
                          <textarea
                            rows={2}
                            value={resolutionNote}
                            onChange={(event) => setResolutionNote(event.target.value)}
                            placeholder="Resolution note — stored in the Recommendation column"
                            aria-label={`Resolution for decision ${decision.id}`}
                          />
                          <div className="decision-resolve-buttons">
                            <button className="decision-confirm" disabled={savingDecision === decision.id} onClick={() => resolveDecision(decision.id)}>
                              Mark decided
                            </button>
                            <button className="decision-cancel" onClick={() => { setResolvingDecision(""); setResolutionNote(""); }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : <div className="decision-clear"><Archive size={16} /> No open owner decisions in this taskboard.</div>}
            </section>

            <div className="taskboard-toolbar">
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
                      const statusValue = String(task.status || "").toLowerCase();
                      const statusOptions = STATUSES.includes(statusValue) ? STATUSES : [statusValue, ...STATUSES];
                      return (
                        <article className="project-task-record" key={`${key}:${task.id}`}>
                          <div className="project-task-row">
                            <span className="task-id">{task.id}</span>
                            <button className="task-title-button" onClick={() => toggleTask(key, task)}>
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
                            {task.editable?.status ? (
                              <select
                                className={`task-status task-status-select ${taskStatusClass(key)}`}
                                value={statusValue}
                                disabled={savingTask === task.id}
                                onChange={(event) => changeTaskField(task.id, "status", event.target.value, { status: event.target.value })}
                                aria-label={`Status for ${task.title}`}
                              >
                                {statusOptions.map((status) => <option key={status}>{status}</option>)}
                              </select>
                            ) : <span className={`task-status ${taskStatusClass(key)}`}>{task.status}</span>}
                            <span className="task-owner">
                              {task.editable?.owner ? (
                                <InlineEdit
                                  value={task.owner}
                                  fallback="Unassigned"
                                  disabled={savingTask === task.id}
                                  label={`owner for ${task.title}`}
                                  onSave={(value) => changeTaskField(task.id, "owner", value, { owner: value })}
                                />
                              ) : (task.owner || "Unassigned")}
                            </span>
                            <time>{task.lastUpdated || "—"}</time>
                            <button className="row-expand" onClick={() => toggleTask(key, task)} aria-label={`${isExpanded ? "Hide" : "Show"} details for ${task.title}`}>
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                          </div>
                          {isExpanded ? (
                            <div className="project-task-detail">
                              {task.editable?.note ? (
                                <div className="task-note-editor">
                                  <textarea
                                    rows={2}
                                    value={noteDraft}
                                    onChange={(event) => setNoteDraft(event.target.value)}
                                    aria-label={`Note for ${task.title}`}
                                  />
                                  <button
                                    className="note-save"
                                    disabled={savingTask === task.id || noteDraft.trim() === (task.detail || "").trim()}
                                    onClick={() => changeTaskField(task.id, "note", noteDraft, { detail: noteDraft.trim() })}
                                  >
                                    Save note
                                  </button>
                                </div>
                              ) : (task.detail || "No additional task detail is recorded in this row.")}
                            </div>
                          ) : null}
                        </article>
                      );
                    }) : <div className="group-empty">No matching {label.toLowerCase()} tasks.</div>}
                  </section>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
