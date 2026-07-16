import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Columns3,
  Command,
  DollarSign,
  Folder,
  FolderKanban,
  Grid2X2,
  Inbox,
  ListTodo,
  Lock,
  LogOut,
  Mail,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  SkipBack,
  SkipForward,
  X
} from "lucide-react";
import {
  SPOTIFY_CONTROL_FOLLOW_UP_DELAYS_MS,
  SPOTIFY_PROGRESS_TICK_MS,
  estimateSpotifyProgressMs,
  getSpotifyRefreshDelayMs,
  stampSpotifyState
} from "./spotifyTiming.js";
import { resolveSpotifyAtlasUrl } from "./atlasUrl.js";
import { IntelligenceDashboard } from "./intelligence.jsx";
import { ProjectTaskboards } from "./projectTaskboards.jsx";
import { privacyClass } from "./privacy.js";
import "./styles.css";

const COLUMNS = ["Inbox", "Today", "Next", "Waiting", "Done"];
const COLUMN_ICONS = {
  Inbox,
  Today: CalendarDays,
  Next: ChevronRight,
  Waiting: Pause,
  Done: CheckCircle2
};
const PRIORITIES = ["P1", "P2", "P3"];
const STATUS_ORDER = Object.fromEntries(COLUMNS.map((column, index) => [column, index]));
export const NAV_ITEMS = [
  { key: "Dashboard", label: "Dashboard", icon: Grid2X2, tone: "gold" },
  { key: "Intelligence", label: "Intelligence", icon: BrainCircuit, tone: "lavender" },
  { key: "Briefing", label: "Briefing", icon: Bell, tone: "pink" },
  { key: "Kanban", label: "Personal To-Dos", icon: ListTodo, tone: "orange" },
  { key: "Calendar", label: "Calendar", icon: CalendarDays, tone: "blue" },
  { key: "Projects", label: "Projects", icon: FolderKanban, tone: "lavender" },
  { key: "Deployments", label: "Deployments", icon: Cloud, tone: "teal" },
  { key: "Inbox", label: "Inbox", icon: Inbox, tone: "pink" },
  { key: "Finance", label: "Finance", icon: DollarSign, tone: "green" },
  { key: "Music", label: "Music", icon: Music, tone: "pink" }
];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || body.detail || `Request failed: ${response.status}`);
    error.status = response.status;
    error.code = body.code || "";
    error.retryAfter = response.headers.get("Retry-After") || "";
    throw error;
  }
  return response.json();
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function stampAppState(nextState) {
  return nextState?.spotify ? { ...nextState, spotify: stampSpotifyState(nextState.spotify) } : nextState;
}

function App() {
  const [auth, setAuth] = useState({ checked: false, authRequired: true, authenticated: false });
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [spotifyBusy, setSpotifyBusy] = useState("");
  const [spotifyControlRefreshUntil, setSpotifyControlRefreshUntil] = useState(0);
  const [privacy, setPrivacy] = useState(() => localStorage.getItem("mc_privacy") === "1");
  const [activeView, setActiveView] = useState("Dashboard");
  const hasLoadedState = Boolean(state);

  useEffect(() => {
    api("/api/auth/status")
      .then((status) => {
        setAuth({ checked: true, ...status });
        if (status.authenticated) loadState();
      })
      .catch((err) => {
        setError(err.message);
        setAuth((current) => ({ ...current, checked: true }));
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("mc_privacy", privacy ? "1" : "0");
    document.body.classList.toggle("privacy-mode", privacy);
  }, [privacy]);

  useEffect(() => {
    if (!auth.authenticated || !hasLoadedState) return undefined;
    let cancelled = false;
    let timeoutId = null;

    async function poll() {
      try {
        const spotify = await api("/api/spotify/player");
        if (!cancelled) {
          setState((current) => (current ? { ...current, spotify: stampSpotifyState(spotify) } : current));
        }
      } catch (err) {
        if (!cancelled && err.status === 401) {
          setAuth({ checked: true, authRequired: true, authenticated: false });
        }
      } finally {
        if (!cancelled) scheduleNext();
      }
    }

    function scheduleNext() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => poll(), getSpotifyRefreshDelayMs(state.spotify));
    }

    scheduleNext();
    const refreshOnFocus = () => {
      if (!document.hidden) {
        window.clearTimeout(timeoutId);
        poll();
      }
    };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [auth.authenticated, hasLoadedState, state?.spotify]);

  useEffect(() => {
    if (!auth.authenticated || !hasLoadedState || !spotifyControlRefreshUntil) return undefined;
    let cancelled = false;
    const timeouts = SPOTIFY_CONTROL_FOLLOW_UP_DELAYS_MS.map((delay) => window.setTimeout(async () => {
      try {
        const spotify = await api("/api/spotify/player");
        if (!cancelled) {
          setState((current) => (current ? { ...current, spotify: stampSpotifyState(spotify) } : current));
        }
      } catch (err) {
        if (!cancelled && err.status === 401) {
          setAuth({ checked: true, authRequired: true, authenticated: false });
        }
      }
    }, delay));

    return () => {
      cancelled = true;
      for (const timeout of timeouts) window.clearTimeout(timeout);
    };
  }, [auth.authenticated, hasLoadedState, spotifyControlRefreshUntil]);

  async function loadState() {
    setBusy(true);
    setError("");
    try {
      setState(stampAppState(await api("/api/state")));
    } catch (err) {
      if (err.status === 401) setAuth({ checked: true, authRequired: true, authenticated: false });
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(passcode) {
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ passcode }) });
    setAuth({ checked: true, authRequired: true, authenticated: true });
    await loadState();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setState(null);
    setAuth({ checked: true, authRequired: true, authenticated: false });
  }

  async function mutateTask(id, patch) {
    const updated = await api(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? updated : task))
    }));
  }

  async function createTask(input) {
    const created = await api("/api/tasks", { method: "POST", body: JSON.stringify(input) });
    setState((current) => ({ ...current, tasks: [...current.tasks, created] }));
  }

  async function dismissTask(id) {
    await api(`/api/tasks/${id}/dismiss`, { method: "POST" });
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  }

  async function refreshGmail() {
    setBusy(true);
    try {
      await api("/api/refresh/gmail", { method: "POST" });
      await loadState();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadSpotify() {
    const spotify = await api("/api/spotify/player");
    setState((current) => (current ? { ...current, spotify: stampSpotifyState(spotify) } : current));
  }

  async function controlSpotify(action) {
    setSpotifyBusy(action);
    setError("");
    try {
      await api("/api/spotify/control", { method: "POST", body: JSON.stringify({ action }) });
      await loadSpotify();
      setSpotifyControlRefreshUntil(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setSpotifyBusy("");
    }
  }

  if (!auth.checked) return <LoadingScreen />;
  if (!auth.authenticated) return <PasscodeGate onLogin={handleLogin} error={error} />;
  if (!state) return <LoadingScreen error={error} />;

  const data = state.dashboard;

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="workspace">
        <TopBar
          data={data}
          busy={busy}
          privacy={privacy}
          onPrivacy={() => setPrivacy((value) => !value)}
          onRefresh={loadState}
          onLogout={logout}
          compact={activeView === "Projects" || activeView === "Kanban"}
        />
        {error ? <div className="error-banner">{error}</div> : null}
        <MobileTabs activeView={activeView} setActiveView={setActiveView} />
        {activeView === "Dashboard" || activeView === "Deployments" ? (
          <SystemHealth sources={state.sourceHealth} platformHealth={state.platformHealth} />
        ) : null}
        <section className="view-stack">
          {activeView === "Dashboard" && (
            <DashboardView
              data={data}
              tasks={state.tasks}
              spotify={state.spotify}
              onGmailRefresh={refreshGmail}
              onSpotifyControl={controlSpotify}
              spotifyBusy={spotifyBusy}
            />
          )}
          {activeView === "Intelligence" && <IntelligenceDashboard expanded />}
          {activeView === "Briefing" && <BriefingPage briefing={data.briefing} />}
          {activeView === "Kanban" && <KanbanBoard tasks={state.tasks} onCreate={createTask} onUpdate={mutateTask} onDismiss={dismissTask} expanded />}
          {activeView === "Calendar" && <CalendarPage calendar={data.calendar} />}
          {activeView === "Projects" && <ProjectTaskboards />}
          {activeView === "Deployments" && <DeploymentsPage sourceHealth={state.sourceHealth} sources={data.sources || []} />}
          {activeView === "Inbox" && <InboxPage gmail={data.gmail} onRefresh={refreshGmail} />}
          {activeView === "Finance" && <FinancePage money={data.money} />}
          {activeView === "Music" && (
            <MusicView
              spotify={state.spotify}
              library={data.spotify}
              atlas={state.atlas}
              onControl={controlSpotify}
              spotifyBusy={spotifyBusy}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function LoadingScreen({ error }) {
  return (
    <div className="lock-screen">
      <div className="lock-card">
        <RefreshCw className="spin" size={28} />
        <h1>Command Information Center</h1>
        <p>{error || "Loading local app state..."}</p>
      </div>
    </div>
  );
}

function PasscodeGate({ onLogin, error }) {
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onLogin(passcode);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <div className="brand-mark">K</div>
        <h1>Command Information Center</h1>
        <p>Private local access</p>
        <label>
          Passcode
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Local passcode"
          />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button type="submit" className="primary-button" disabled={busy}>
          <Lock size={16} />
          Unlock
        </button>
      </form>
    </div>
  );
}

function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-crest">
          <Command size={21} />
        </span>
        <span className="brand-label">Command<br />Information Center</span>
      </div>
      <nav>
        {NAV_ITEMS.map(({ key, label, icon: Icon, tone }) => (
          <button
            key={key}
            className={cx("nav-item", `tone-${tone}`, activeView === key && "active")}
            onClick={() => setActiveView(key)}
          >
            <span className="nav-icon"><Icon size={18} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>v1.0.0</span>
        <span>Local App</span>
      </div>
    </aside>
  );
}

function TopBar({ data, busy, privacy, onPrivacy, onRefresh, onLogout, compact = false }) {
  return (
    <header className={cx("topbar", compact && "compact")}>
      <div className="topbar-copy">
        <h1>Command Information Center</h1>
        <p>Kayden Ops Dashboard</p>
      </div>
      <div className="lan-status">
        <span className="dot ok" />
        <strong>Private host</strong>
        <span>{window.location.host}</span>
      </div>
      <div className="top-actions">
        <button className={cx("status-button", privacy && "active")} onClick={onPrivacy}>
          <Lock size={16} />
          <span>{privacy ? "Privacy: On" : "Privacy: Off"}</span>
        </button>
        <button className="status-button" onClick={onRefresh} disabled={busy} aria-label="Refresh dashboard state">
          <RefreshCw size={16} className={busy ? "spin" : ""} />
          <span>Refresh</span>
          <small>{data.meta?.generatedAtLocal || "local"}</small>
        </button>
        <button className="danger-button" onClick={onLogout} aria-label="Log out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

function MobileTabs({ activeView, setActiveView }) {
  return (
    <div className="mobile-tabs">
      {NAV_ITEMS.map(({ key, label, icon: Icon, tone }) => (
        <button key={key} className={activeView === key ? "active" : ""} onClick={() => setActiveView(key)}>
          <Icon size={16} className={`tone-${tone}`} />
          {label}
        </button>
      ))}
    </div>
  );
}

function healthAge(checkedAt) {
  if (!checkedAt) return "Never checked";
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(checkedAt)) / 60_000));
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes}m ago`;
  return `Checked ${Math.round(minutes / 60)}h ago`;
}

function SystemHealth({ sources, platformHealth }) {
  const platformStatus = platformHealth?.status || "not_configured";
  const platformTone = platformStatus === "healthy" ? "ok" : platformStatus === "degraded" || platformStatus === "stale" ? "warn" : "bad";
  return (
    <section className="system-health">
      <div className="section-header">
        <span>System Health</span>
        <small>{sources.length} sources</small>
      </div>
      <div className="source-strip">
        {sources.map((source) => (
          <div className="source-chip" key={source.id}>
            <span className={cx("dot", source.status === "online" ? "ok" : source.status === "auth_required" ? "warn" : "bad")} />
            <strong>{source.name}</strong>
            <span>{source.status === "auth_required" ? "Auth" : source.status}</span>
          </div>
        ))}
      </div>
      <div className="platform-health-card" data-status={platformStatus}>
        <div className="platform-health-summary">
          <span className={cx("dot", platformTone)} />
          <strong>Personal Intelligence Platform</strong>
          <span>{platformStatus.replaceAll("_", " ")}</span>
          <small>{healthAge(platformHealth?.checkedAt)} · {platformHealth?.mode || "no report"}</small>
        </div>
        <div className="platform-health-checks">
          {["contract", "openbrain", "cic"].map((name) => {
            const check = platformHealth?.checks?.[name];
            return (
              <span key={name}>
                <strong>{name}</strong>
                {check?.status || "unknown"}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PageHeader({ icon, title, meta }) {
  return (
    <div className="page-header">
      <span className="panel-icon lavender">{icon}</span>
      <div>
        <h2>{title}</h2>
        {meta ? <small>{meta}</small> : null}
      </div>
    </div>
  );
}

function DashboardView({ data, tasks, spotify, onGmailRefresh, onSpotifyControl, spotifyBusy }) {
  const priorityTasks = [...tasks]
    .sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3);

  return (
    <div className="dashboard-grid">
      <IntelligenceDashboard />
      <BriefingPreview briefing={data.briefing} />
      <TaskPreview tasks={priorityTasks} />
      <CalendarPanel calendar={data.calendar} />
      <GmailPanel gmail={data.gmail} onRefresh={onGmailRefresh} />
      <ProjectWarningPanel github={data.github} vercel={data.vercel} sources={data.sources || []} />
      <MoneyPanel money={data.money} />
      <SpotifyPanel spotify={spotify} library={data.spotify} onControl={onSpotifyControl} busyAction={spotifyBusy} />
    </div>
  );
}

function BriefingPreview({ briefing }) {
  const counts = useMemo(() => {
    const result = { P1: 0, P2: 0, P3: 0 };
    for (const action of briefing.actions || []) result[action.priority] = (result[action.priority] || 0) + 1;
    return result;
  }, [briefing]);

  return (
    <section className="panel briefing-panel">
      <div className="panel-title">
        <span className="panel-icon lavender">AI</span>
        <div>
          <h2>Briefing Preview</h2>
          <small>{briefing.actions?.length || 0} actions</small>
        </div>
      </div>
      <h3 className={privacyClass(briefing.headline)}>{briefing.headline}</h3>
      <p className={privacyClass(briefing.summary)}>{briefing.summary}</p>
      <div className="priority-stats">
        {PRIORITIES.map((priority) => (
          <div key={priority}>
            <span className={cx("priority", priority)}>{priority}</span>
            <strong>{counts[priority] || 0}</strong>
          </div>
        ))}
      </div>
      <div className="action-list">
        {(briefing.actions || []).slice(0, 2).map((action) => (
          <article key={`${action.priority}-${action.title}`} className={cx("action-row", privacyClass(action))}>
            <span className={cx("priority", action.priority)}>{action.priority}</span>
            <div>
              <strong>{action.title}</strong>
              <small>{action.detail}</small>
            </div>
            <time>{action.due}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

function BriefingPage({ briefing }) {
  const actionsByPriority = useMemo(() => {
    const grouped = Object.fromEntries(PRIORITIES.map((priority) => [priority, []]));
    for (const action of briefing.actions || []) grouped[action.priority]?.push(action);
    return grouped;
  }, [briefing]);

  return (
    <section className="panel full-briefing">
      <PageHeader icon="AI" title="Morning Command Brief" meta={`${briefing.actions?.length || 0} actions`} />
      <h3 className={privacyClass(briefing.headline)}>{briefing.headline}</h3>
      <p className={cx("briefing-summary", privacyClass(briefing.summary))}>{briefing.summary}</p>
      <div className="briefing-sections">
        {PRIORITIES.map((priority) => (
          <section key={priority} className="briefing-section">
            <div className="section-header">
              <span>{priority} Actions</span>
              <small>{actionsByPriority[priority].length}</small>
            </div>
            <div className="action-list">
              {actionsByPriority[priority].length ? actionsByPriority[priority].map((action) => (
                <article key={`${priority}-${action.title}`} className={cx("action-row large", privacyClass(action))}>
                  <span className={cx("priority", priority)}>{priority}</span>
                  <div>
                    <strong>{action.title}</strong>
                    <small>{action.detail}</small>
                    {action.sources?.length ? <span className="source-list">{action.sources.join(" + ")}</span> : null}
                  </div>
                  <time>{action.due}</time>
                </article>
              )) : <EmptyState icon={<CheckCircle2 size={32} />} title={`No ${priority} actions`} />}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function TaskPreview({ tasks }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-title">
        <span className="panel-icon gold"><ListTodo size={18} /></span>
        <div>
          <h2>Priority Tasks</h2>
          <small>{tasks.length} shown</small>
        </div>
      </div>
      {tasks.length ? tasks.map((task) => (
        <div className={cx("mini-row", privacyClass(task))} key={task.id}>
          <span className={cx("priority", task.priority)}>{task.priority}</span>
          <div>
            <strong>{task.title}</strong>
            <small>{task.status}{task.dueDate ? ` / ${task.dueDate}` : ""}</small>
          </div>
          <span>{task.source}</span>
        </div>
      )) : <EmptyState icon={<Columns3 size={32} />} title="No tasks" />}
    </section>
  );
}

function KanbanBoard({ tasks, onCreate, onUpdate, onDismiss, expanded = false }) {
  const grouped = useMemo(() => {
    const next = Object.fromEntries(COLUMNS.map((column) => [column, []]));
    for (const task of tasks) next[task.status]?.push(task);
    for (const column of COLUMNS) {
      next[column].sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.createdAt.localeCompare(b.createdAt));
    }
    return next;
  }, [tasks]);

  return (
    <section className={cx("panel board-panel", expanded && "expanded-board")}>
      <div className="panel-title">
        <span className="panel-icon gold"><Columns3 size={17} /></span>
        <div>
          <h2>Personal To-Dos</h2>
          <small>SQLite-backed personal queue · project work stays in Project Taskboards</small>
        </div>
      </div>
      <div className="personal-summary" aria-label="Personal task summary">
        <div><span>Total</span><strong>{tasks.length}</strong></div>
        <div><span>Inbox</span><strong>{grouped.Inbox.length}</strong></div>
        <div><span>Today</span><strong>{grouped.Today.length}</strong></div>
        <div><span>Waiting</span><strong>{grouped.Waiting.length}</strong></div>
        <div><span>Done</span><strong>{grouped.Done.length}</strong></div>
        <p><Inbox size={15} /> Inbox summary: {grouped.Inbox.filter((task) => task.suggested).length} suggested item{grouped.Inbox.filter((task) => task.suggested).length === 1 ? "" : "s"} awaiting review.</p>
      </div>
      <div className="kanban">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column}
            column={column}
            tasks={grouped[column]}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </section>
  );
}

function KanbanColumn({ column, tasks, onCreate, onUpdate, onDismiss }) {
  const [draft, setDraft] = useState("");
  const ColumnIcon = COLUMN_ICONS[column];

  async function addTask(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    await onCreate({ title: draft, status: column, priority: column === "Today" ? "P1" : "P3" });
    setDraft("");
  }

  const testColumn = column.toLowerCase();
  return (
    <div className={cx("kanban-column", testColumn)} data-testid={`column-${testColumn}`}>
      <div className="column-head">
        <span className="column-label"><ColumnIcon size={15} />{column}</span>
        <small>{tasks.length}</small>
      </div>
      <div className="card-stack">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDismiss={onDismiss} />
        ))}
      </div>
      <form className="add-task" onSubmit={addTask}>
        <input data-testid={`add-task-${testColumn}`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add task" />
        <button data-testid={`submit-task-${testColumn}`} aria-label={`Add task to ${column}`}>
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}

function TaskCard({ task, onUpdate, onDismiss }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    title: task.title,
    notes: task.notes || "",
    dueDate: task.dueDate || "",
    priority: task.priority,
    status: task.status
  }));
  const index = STATUS_ORDER[task.status];
  const canLeft = index > 0;
  const canRight = index < COLUMNS.length - 1;

  useEffect(() => {
    if (!editing) {
      setDraft({
        title: task.title,
        notes: task.notes || "",
        dueDate: task.dueDate || "",
        priority: task.priority,
        status: task.status
      });
    }
  }, [editing, task]);

  async function saveEdit(event) {
    event.preventDefault();
    await onUpdate(task.id, {
      title: draft.title,
      notes: draft.notes,
      dueDate: draft.dueDate || null,
      priority: draft.priority,
      status: draft.status
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <article className="task-card editing" data-testid={`task-${task.id}`}>
        <form className="task-edit-form" onSubmit={saveEdit}>
          <label>
            Title
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            Notes
            <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <div className="task-edit-grid">
            <label>
              Due
              <input value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} placeholder="MM/DD/YYYY" />
            </label>
            <label>
              Priority
              <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
                {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                {COLUMNS.map((column) => <option key={column}>{column}</option>)}
              </select>
            </label>
          </div>
          <div className="task-controls">
            <button type="submit" aria-label={`Save ${task.title}`}>
              <Save size={14} />
            </button>
            <button type="button" onClick={() => setEditing(false)} aria-label="Cancel edit">
              <X size={14} />
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="task-card" data-testid={`task-${task.id}`}>
      <div>
        <strong>{task.title}</strong>
        {task.notes ? <small>{task.notes}</small> : null}
      </div>
      <div className="task-meta">
        <span className={cx("priority", task.priority)}>{task.priority}</span>
        <span>{task.source}</span>
        {task.dueDate ? <time>{task.dueDate}</time> : null}
      </div>
      <div className="task-controls">
        <button disabled={!canLeft} onClick={() => onUpdate(task.id, { status: COLUMNS[index - 1] })} aria-label={`Move ${task.title} left`}>
          <ChevronLeft size={14} />
        </button>
        <select value={task.priority} onChange={(event) => onUpdate(task.id, { priority: event.target.value })}>
          {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
        </select>
        <button disabled={!canRight} onClick={() => onUpdate(task.id, { status: COLUMNS[index + 1] })} aria-label={`Move ${task.title} right`}>
          <ChevronRight size={14} />
        </button>
        <button onClick={() => setEditing(true)} aria-label={`Edit ${task.title}`}>
          <Save size={14} />
        </button>
        {task.suggested ? (
          <button onClick={() => onDismiss(task.id)} aria-label="Dismiss suggestion">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CalendarPage({ calendar }) {
  const [view, setView] = useState("Week");
  return (
    <section className="panel calendar-page">
      <div className="panel-title">
        <span className="panel-icon grey"><CalendarDays size={17} /></span>
        <div>
          <h2>Calendar</h2>
          <small>{calendar.window}</small>
        </div>
        <SegmentedControl values={["Month", "Week", "Day"]} value={view} onChange={setView} />
      </div>
      <div className="calendar-shell">
        <div className="calendar-frame">
          <strong>{view}</strong>
          <small>{calendar.window || "Current window"}</small>
        </div>
        <div className="calendar-events">
          {calendar.events?.length ? calendar.events.map((event) => (
            <article className={cx("calendar-event", privacyClass(event))} key={`${event.title}-${event.when}`}>
              <strong>{event.title}</strong>
              <time>{event.when}</time>
            </article>
          )) : (
            <EmptyState icon={<CalendarDays size={38} />} title="No events scheduled" detail={calendar.note} />
          )}
        </div>
      </div>
    </section>
  );
}

function SegmentedControl({ values, value, onChange }) {
  return (
    <div className="segmented-control">
      {values.map((nextValue) => (
        <button key={nextValue} className={value === nextValue ? "active" : ""} onClick={() => onChange(nextValue)}>
          {nextValue}
        </button>
      ))}
    </div>
  );
}

function ProjectsPage({ projects, github, vercel }) {
  return (
    <div className="split-page projects-page">
      <section className="panel">
        <div className="panel-title">
          <span className="panel-icon lavender"><Folder size={17} /></span>
          <div>
            <h2>Active Projects</h2>
            <small>{projects?.root || "GPT_OS/Projects"}</small>
          </div>
        </div>
        {(projects?.items || []).map((item) => (
          <article className={cx("detail-row", privacyClass(item))} key={`${item.name}-${item.touched}`}>
            <div>
              <strong>{item.name}</strong>
              {item.note ? <small>{item.note}</small> : null}
            </div>
            <time>{item.touched}</time>
          </article>
        ))}
      </section>
      <div className="side-stack">
        <GithubPanel github={github} />
        <VercelPanel vercel={vercel} />
      </div>
    </div>
  );
}

function DeploymentsPage({ sourceHealth, sources }) {
  const sourceDetails = sourceHealth.map((source) => {
    const feedSource = sources.find((item) => item.id === source.id);
    return { ...feedSource, ...source, detail: source.detail || feedSource?.detail || "" };
  });
  return (
    <section className="panel deployments-page">
      <div className="panel-title">
        <span className="panel-icon white"><Cloud size={17} /></span>
        <div>
          <h2>Deployments And Connectors</h2>
          <small>{sourceDetails.length} sources</small>
        </div>
      </div>
      <WorkbenchReleaseCard />
      <div className="connector-grid">
        {sourceDetails.map((source) => (
          <article className={cx("connector-card", privacyClass(source))} key={source.id}>
            <div className="connector-head">
              <strong>{source.name}</strong>
              <span className={cx("status-label", source.status === "online" ? "ok" : source.status === "auth_required" ? "warn" : "bad")}>
                {source.status === "auth_required" ? "Auth" : source.status}
              </span>
            </div>
            <small>{source.detail || "No detail reported."}</small>
            {source.updated_at ? <time>{new Date(source.updated_at).toLocaleString()}</time> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

const WORKBENCH_RELEASE_PATH = "/api/captain/workbench-release";
const WORKBENCH_POLL_INTERVAL_MS = 2_000;
const WORKBENCH_POLL_LIMIT_MS = 60_000;
const WORKBENCH_POLL_ANNOUNCEMENTS = {
  applied: "Release applied. Verified merge evidence is available.",
  blocked: "Captain handoff blocked. Review the current evidence before retrying.",
  rejected: "Captain handoff rejected. A new approval is required."
};

function shortSha(sha) {
  return typeof sha === "string" ? sha.slice(0, 7) : "unknown";
}

function retryAfterMilliseconds(value) {
  if (/^\d+$/.test(value)) return Number(value) * 1_000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

function WorkbenchReleaseCard() {
  const [release, setRelease] = useState(null);
  const [checking, setChecking] = useState(true);
  const [refreshError, setRefreshError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [locked, setLocked] = useState(false);
  const [approvalPasscode, setApprovalPasscode] = useState("");
  const [executionPasscode, setExecutionPasscode] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [result, setResult] = useState("");
  const [throttleUntil, setThrottleUntil] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [monitorTimedOut, setMonitorTimedOut] = useState(false);
  const mountedRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const actionInFlightRef = useRef(false);
  const pollStartedAtRef = useRef(0);
  const previousOperationRef = useRef({ id: null, status: null });
  const resultRef = useRef(null);

  const clearPassphrases = useCallback(() => {
    setApprovalPasscode("");
    setExecutionPasscode("");
  }, []);

  const focusResult = useCallback(() => {
    window.setTimeout(() => resultRef.current?.focus(), 0);
  }, []);

  const refreshRelease = useCallback(async ({ announce = false, background = false } = {}) => {
    if (requestInFlightRef.current) return null;
    requestInFlightRef.current = true;
    if (!background) setChecking(true);
    try {
      const nextRelease = await api(WORKBENCH_RELEASE_PATH);
      if (!mountedRef.current) return null;
      setRelease(nextRelease);
      setRefreshError("");
      setLocked(false);
      setLastRefresh(new Date());
      if (nextRelease.latestOperation?.status !== "executing") {
        pollStartedAtRef.current = 0;
        setMonitorTimedOut(false);
      }
      if (announce) {
        setResult("Release evidence refreshed from the server.");
        focusResult();
      }
      return nextRelease;
    } catch (error) {
      if (!mountedRef.current) return null;
      if (error.status === 401) {
        clearPassphrases();
        setLocked(true);
        setResult("Session expired. Login required before release controls can be used.");
        focusResult();
      } else {
        setRefreshError(error.message);
        if (announce) {
          setResult(`Refresh failed: ${error.message}`);
          focusResult();
        }
      }
      return null;
    } finally {
      requestInFlightRef.current = false;
      if (mountedRef.current) setChecking(false);
    }
  }, [clearPassphrases, focusResult]);

  useEffect(() => {
    mountedRef.current = true;
    refreshRelease();
    return () => {
      mountedRef.current = false;
      actionInFlightRef.current = false;
    };
  }, [clearPassphrases, refreshRelease]);

  const operation = release?.latestOperation;
  useEffect(() => {
    const previous = previousOperationRef.current;
    const current = { id: operation?.id || null, status: operation?.status || null };
    if (previous.id === current.id && previous.status === "executing") {
      const announcement = WORKBENCH_POLL_ANNOUNCEMENTS[current.status];
      if (announcement) setResult(announcement);
    }
    previousOperationRef.current = current;
  }, [operation?.id, operation?.status]);

  useEffect(() => {
    if (operation?.status !== "executing" || monitorTimedOut) return undefined;
    if (!pollStartedAtRef.current) pollStartedAtRef.current = Date.now();
    let cancelled = false;
    let timeoutId = null;

    const stopMonitoring = () => {
      if (cancelled) return;
      setMonitorTimedOut(true);
      setResult("Automatic monitoring stopped after 60 seconds. Refresh manually for current durable status.");
    };

    const schedule = () => {
      const elapsed = Date.now() - pollStartedAtRef.current;
      if (elapsed >= WORKBENCH_POLL_LIMIT_MS) {
        stopMonitoring();
        return;
      }
      timeoutId = window.setTimeout(async () => {
        if (cancelled) return;
        if (Date.now() - pollStartedAtRef.current >= WORKBENCH_POLL_LIMIT_MS) {
          stopMonitoring();
          return;
        }
        const nextRelease = await refreshRelease({ background: true });
        if (cancelled) return;
        if (nextRelease?.latestOperation?.status === "executing") schedule();
      }, Math.min(WORKBENCH_POLL_INTERVAL_MS, WORKBENCH_POLL_LIMIT_MS - elapsed));
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [monitorTimedOut, operation?.id, operation?.status, refreshRelease]);

  useEffect(() => {
    if (!throttleUntil || throttleUntil <= Date.now()) return undefined;
    const timeoutId = window.setTimeout(() => setClockNow(Date.now()), Math.min(1_000, throttleUntil - Date.now()));
    return () => window.clearTimeout(timeoutId);
  }, [clockNow, throttleUntil]);

  async function submitAction(kind) {
    if (actionInFlightRef.current) return;
    const candidate = release?.candidate;
    const operation = release?.latestOperation;
    const passcode = kind === "approval" ? approvalPasscode : executionPasscode;
    if (!passcode || !candidate || (kind === "execution" && !operation)) return;

    actionInFlightRef.current = true;
    setActionPending(true);
    clearPassphrases();
    setResult(kind === "approval" ? "Recording approval…" : "Sending the approved release to Captain…");
    try {
      const path = kind === "approval" ? `${WORKBENCH_RELEASE_PATH}/approval` : `${WORKBENCH_RELEASE_PATH}/execution`;
      const body = kind === "approval"
        ? { fingerprint: candidate.fingerprint, passcode }
        : { operationId: operation.id, passcode };
      await api(path, { method: "POST", body: JSON.stringify(body) });
      await refreshRelease();
      setResult(kind === "approval"
        ? "Approval recorded. GitHub unchanged. Enter a fresh Captain handoff passphrase to continue."
        : "Captain handoff queued. Durable status refreshed from the server.");
    } catch (error) {
      if (error.status === 401) {
        setLocked(true);
        setResult("Session expired. Login required before release controls can be used.");
      } else if (error.status === 429) {
        const wait = retryAfterMilliseconds(error.retryAfter);
        const until = Date.now() + wait;
        setThrottleUntil(until);
        setClockNow(Date.now());
        setResult(wait > 0 ? `Step-up throttled. Try again in ${Math.ceil(wait / 1_000)}s.` : "Step-up throttled. Refresh before retrying.");
      } else {
        await refreshRelease();
        setResult(error.message);
      }
    } finally {
      clearPassphrases();
      actionInFlightRef.current = false;
      if (mountedRef.current) setActionPending(false);
      focusResult();
    }
  }

  const candidate = release?.candidate;
  const sameCandidate = Boolean(candidate?.fingerprint && operation?.candidateFingerprint === candidate.fingerprint);
  const throttleSeconds = Math.max(0, Math.ceil((throttleUntil - clockNow) / 1_000));
  const throttled = throttleSeconds > 0;
  const stale = Boolean(refreshError && release);
  const operationOwnsVisibleRelease = Boolean(operation && (candidate?.status !== "ready" || sameCandidate));
  let state = "checking";
  if (locked) state = "locked";
  else if (stale) state = "stale";
  else if (!release || checking) state = "checking";
  else if (operation?.status === "applied" && operationOwnsVisibleRelease) state = "applied";
  else if (operation?.status === "executing" && operationOwnsVisibleRelease) state = "executing";
  else if (candidate?.status !== "ready") state = "blocked";
  else if (operation?.status === "rejected" && sameCandidate) state = "rejected";
  else if (operation?.status === "blocked" && sameCandidate) state = "execution-blocked";
  else if (operation?.status === "approved" && sameCandidate) state = "approved";
  else state = "ready";

  const labels = {
    checking: "Checking",
    locked: "Login required",
    stale: "Stale evidence",
    blocked: "Blocked",
    ready: "Ready",
    approved: "Approved",
    executing: "Executing",
    "execution-blocked": "Captain handoff blocked",
    rejected: "Rejected",
    applied: "Applied"
  };
  const tone = ["ready", "approved", "applied"].includes(state) ? "ok" : ["checking", "stale", "executing"].includes(state) ? "warn" : "bad";
  const statusLabel = throttled ? "Throttled" : labels[state];
  const reasonLabel = state === "locked"
    ? "The CIC session expired. Log in again before continuing."
    : state === "stale"
      ? `Prior evidence is preserved but stale: ${refreshError}`
      : state === "checking"
        ? "Reading current GitHub evidence…"
        : state === "blocked"
          ? candidate?.reason?.code === "passcode_not_configured" ? "Passcode protection required" : candidate?.reason?.detail || "The fixed release candidate is blocked."
          : state === "approved"
            ? "Approval is durable. GitHub unchanged; Captain handoff needs a fresh passphrase."
            : state === "executing"
              ? monitorTimedOut ? "Automatic monitoring stopped; durable outcome is unresolved." : "Captain is processing the handoff; current status is monitored sequentially."
              : state === "execution-blocked"
                ? operation.executionErrorDetail || "The Captain handoff is safely blocked and may be retried against the same current fingerprint."
                : state === "rejected"
                  ? `${operation.executionErrorDetail || "Exact evidence changed."} This operation is terminal and needs a new approval.`
                  : state === "applied"
                    ? "The approved release is applied; a second merge is disabled."
                    : operation && !sameCandidate
                      ? "New approval required for the current exact fingerprint."
                      : "Release evidence is current and exact-SHA bound.";

  const renderRefresh = () => (
    <button className="status-button workbench-release-refresh" type="button" onClick={() => refreshRelease({ announce: true })} disabled={checking || actionPending}>
      <RefreshCw size={16} className={checking ? "spin" : ""} />
      Refresh release evidence
    </button>
  );

  const renderExecutionForm = (retry = false) => (
    <form className="workbench-release-form" onSubmit={(event) => { event.preventDefault(); submitAction("execution"); }}>
      <label htmlFor="workbench-execution-passphrase">Captain handoff passphrase</label>
      <input
        id="workbench-execution-passphrase"
        type="password"
        autoComplete="off"
        value={executionPasscode}
        onChange={(event) => setExecutionPasscode(event.target.value)}
        disabled={actionPending || throttled}
      />
      <button className="primary-button" type="submit" disabled={!executionPasscode || actionPending || throttled}>
        {retry ? "Retry Captain handoff" : "Send approved release to Captain"}
      </button>
    </form>
  );

  return (
    <article className="workbench-release-card" data-testid="workbench-release-card" data-status={state}>
      <div className="workbench-release-head">
        <span className="panel-icon teal"><Code2 size={17} /></span>
        <div>
          <strong>LLM Workbench</strong>
          <small>KaydenClark/LLM_Workbench</small>
        </div>
        <span className={cx("status-label", tone)}>{statusLabel}</span>
      </div>

      <section className="workbench-release-section" aria-label="Fixed release identity">
        <strong>Fixed release</strong>
        <span><code>integration</code> → <code>main</code></span>
      </section>

      <div className="workbench-release-meta">
        <small>{reasonLabel}</small>
      </div>

      <section className="workbench-release-section" aria-label="Current release evidence">
        <strong>Current evidence</strong>
        {candidate ? (
          <div className="workbench-release-proof">
            <span><strong>PR</strong> {candidate.pullRequest?.url ? <a href={candidate.pullRequest.url} target="_blank" rel="noreferrer">#{candidate.pullRequest.number}</a> : "Unavailable"}</span>
            <span><strong>Heads</strong> <code title={candidate.mainSha}>{shortSha(candidate.mainSha)}</code> → <code title={candidate.integrationSha}>{shortSha(candidate.integrationSha)}</code></span>
            <span><strong>Auditor</strong> {candidate.releaseGate?.auditorSummary || "No current passing evidence."}</span>
            <span><strong>Fingerprint</strong> {candidate.fingerprint ? <code className="workbench-release-fingerprint" title={candidate.fingerprint}>{candidate.fingerprint}</code> : "Unavailable"}</span>
            {candidate.releaseGate?.evidenceUrl ? <a href={candidate.releaseGate.evidenceUrl} target="_blank" rel="noreferrer">Open audit evidence</a> : null}
            <span><strong>Refreshed</strong> {lastRefresh ? lastRefresh.toLocaleTimeString() : "Never"}</span>
          </div>
        ) : <small>No current evidence loaded.</small>}
      </section>

      <section className="workbench-release-section" aria-label="Latest durable operation">
        <strong>Latest durable operation</strong>
        {operation ? (
          <div className="workbench-operation">
            <span><strong>Status</strong> {operation.status}</span>
            <span><strong>Operation</strong> <code title={operation.id}>{operation.id}</code></span>
            {operation.mergeSha ? <span><strong>Merge</strong> <code title={operation.mergeSha}>{shortSha(operation.mergeSha)}</code></span> : null}
            {operation.mergeEvidenceUrl ? <a href={operation.mergeEvidenceUrl} target="_blank" rel="noreferrer">Open verified merge</a> : null}
          </div>
        ) : <small>No approval recorded for this candidate.</small>}
      </section>

      <section className="workbench-release-action" aria-label="Release action">
        {state === "ready" ? (
          <form className="workbench-release-form" onSubmit={(event) => { event.preventDefault(); submitAction("approval"); }}>
            <label htmlFor="workbench-approval-passphrase">Approval passphrase</label>
            <input
              id="workbench-approval-passphrase"
              type="password"
              autoComplete="off"
              value={approvalPasscode}
              onChange={(event) => setApprovalPasscode(event.target.value)}
              disabled={actionPending || throttled}
            />
            <button className="primary-button" type="submit" disabled={!approvalPasscode || actionPending || throttled}>
              Approve exact SHA {shortSha(candidate?.integrationSha)}
            </button>
          </form>
        ) : state === "approved" ? renderExecutionForm(false)
          : state === "execution-blocked" ? renderExecutionForm(true)
            : state === "executing" && !monitorTimedOut ? <small>Monitoring Captain's durable handoff. Duplicate dispatch is disabled.</small>
              : state === "checking" || state === "locked" ? <small>Mutation controls are unavailable.</small>
                : renderRefresh()}
      </section>

      <div
        className="workbench-release-result"
        data-testid="workbench-release-result"
        ref={resultRef}
        tabIndex={-1}
        aria-live="polite"
      >
        {throttled ? `Step-up throttled. Try again in ${throttleSeconds}s. No request will be resubmitted automatically.` : result}
      </div>
    </article>
  );
}

function InboxPage({ gmail, onRefresh }) {
  const categories = useMemo(() => {
    const buckets = {};
    for (const thread of gmail.threads || []) {
      const tag = thread.tag || "INFO";
      if (!buckets[tag]) buckets[tag] = [];
      buckets[tag].push(thread);
    }
    return buckets;
  }, [gmail]);

  return (
    <section className="panel inbox-page">
      <div className="panel-title">
        <span className="panel-icon red"><Mail size={17} /></span>
        <div>
          <h2>Inbox</h2>
          <small>{gmail.inboxThreadEstimate || 0} estimated / {gmail.windowDays}d</small>
        </div>
        <button className="status-button" onClick={onRefresh}>
          <RefreshCw size={15} />
          <span>Refresh Gmail</span>
        </button>
      </div>
      <div className="category-grid">
        {["SECURITY", "MONEY", "SHOPPING", "DEADLINE", "INFO"].map((tag) => (
          <section className="category-section" key={tag}>
            <div className="section-header">
              <span>{tag}</span>
              <small>{categories[tag]?.length || 0}</small>
            </div>
            {(categories[tag] || []).length ? categories[tag].map((thread) => (
              <article className={cx("detail-row", privacyClass(thread))} key={`${tag}-${thread.subject}-${thread.date}`}>
                <div>
                  <strong>{thread.subject}</strong>
                  <small>{thread.from}</small>
                </div>
                <time>{thread.date}</time>
              </article>
            )) : <EmptyState icon={<Inbox size={28} />} title={`No ${tag.toLowerCase()} threads`} />}
          </section>
        ))}
      </div>
    </section>
  );
}

function FinancePage({ money }) {
  const accounts = money.accounts || [];
  return (
    <section className={cx("panel finance-page", privacyClass(money))}>
      <div className="panel-title">
        <span className="panel-icon gold"><DollarSign size={17} /></span>
        <div>
          <h2>Finance</h2>
          <small>{money.events?.length || 0} events / {accounts.length} accounts</small>
        </div>
      </div>
      <div className="split-page">
        <section className="sub-panel">
          <div className="section-header">
            <span>Money Activity</span>
            <small>summaries only</small>
          </div>
          {(money.events || []).length ? money.events.map((event) => (
            <article className={cx("detail-row money-val", privacyClass(event))} key={`${event.label}-${event.date}`}>
              <div>
                <strong>{event.label}</strong>
                <small>{event.status}</small>
              </div>
              <span>{event.amount}</span>
              <time>{event.date}</time>
            </article>
          )) : <EmptyState icon={<DollarSign size={32} />} title="No money events" />}
        </section>
        <section className="sub-panel">
          <div className="section-header">
            <span>Holdings</span>
            <small>feed-backed only</small>
          </div>
          {accounts.length ? accounts.map((account) => (
            <article className={cx("detail-row money-val", privacyClass(account))} key={account.name || account.id}>
              <div>
                <strong>{account.name || account.id}</strong>
                <small>{account.status || "reported"}</small>
              </div>
              {account.value ? <span>{account.value}</span> : null}
            </article>
          )) : <EmptyState icon={<DollarSign size={32} />} title="No holdings in CIC feed" detail="Robinhood/live portfolio data is not called from this page." />}
        </section>
      </div>
    </section>
  );
}

function MusicView({ spotify, library, atlas, onControl, spotifyBusy }) {
  const atlasUrl = resolveSpotifyAtlasUrl(atlas?.configuredUrl);
  return (
    <div className="music-view">
      <SpotifyPanel spotify={spotify} library={library} expanded onControl={onControl} busyAction={spotifyBusy} />
      <section className="panel atlas-gateway">
        <span className="panel-icon green"><Music size={17} /></span>
        <div>
          <h2>Spotify Atlas</h2>
          <p>Full listening stats, history, and trends.</p>
        </div>
        <a className="status-button atlas-link" href={atlasUrl} target="_blank" rel="noopener noreferrer">
          <Music size={16} />
          <span>Open Spotify Atlas</span>
        </a>
      </section>
    </div>
  );
}

function ProjectWarningPanel({ github, vercel, sources }) {
  const degraded = sources.filter((source) => source.status !== "online");
  return (
    <section className="panel compact-panel degraded-panel">
      <div className="panel-title">
        <span className="panel-icon orange"><AlertTriangle size={17} /></span>
        <div>
          <h2>Projects / Deploys</h2>
          <small>{github.openPrCount || 0} PRs / {degraded.length} degraded</small>
        </div>
      </div>
      <div className="mini-row tight">
        <strong>Open pull requests</strong>
        <span>{github.openPrCount || 0}</span>
      </div>
      {(vercel.projects || []).slice(0, 2).map((project) => (
        <div className="mini-row" key={project.name}>
          <span className="status-label ok">{project.state}</span>
          <div><strong>{project.name}</strong><small>{project.branch}</small></div>
          <time>{project.deployed}</time>
        </div>
      ))}
      {degraded.slice(0, 2).map((source) => (
        <div className={cx("mini-row", privacyClass(source))} key={source.id}>
          <span className={cx("status-label", source.status === "auth_required" ? "warn" : "bad")}>{source.status}</span>
          <div><strong>{source.name}</strong><small>{source.detail}</small></div>
        </div>
      ))}
    </section>
  );
}

function GmailPanel({ gmail, onRefresh }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-title">
        <span className="panel-icon red"><Mail size={17} /></span>
        <div>
          <h2>Gmail Suggestions</h2>
          <small>{gmail.windowDays}d</small>
        </div>
        <button className="icon-button" onClick={onRefresh} aria-label="Refresh Gmail suggestions">
          <RefreshCw size={15} />
        </button>
      </div>
      {(gmail.threads || []).slice(0, 5).map((thread) => (
        <div className={cx("mini-row", privacyClass(thread))} key={`${thread.subject}-${thread.date}`}>
          <span className={cx("dot", thread.tag === "MONEY" ? "warn" : thread.tag === "DEADLINE" ? "bad" : "ok")} />
          <div>
            <strong>{thread.subject}</strong>
            <small>{thread.from}</small>
          </div>
          <time>{thread.date}</time>
        </div>
      ))}
      {gmail.threads?.length ? null : <EmptyState icon={<Inbox size={32} />} title="No inbox suggestions" />}
    </section>
  );
}

function CalendarPanel({ calendar }) {
  return (
    <section className="panel compact-panel empty-panel">
      <div className="panel-title">
        <span className="panel-icon grey"><CalendarDays size={17} /></span>
        <div>
          <h2>Calendar</h2>
          <small>{calendar.window}</small>
        </div>
      </div>
      {calendar.events?.length ? calendar.events.map((event) => (
        <div className={cx("mini-row", privacyClass(event))} key={event.title}>
          <strong>{event.title}</strong>
          <time>{event.when}</time>
        </div>
      )) : (
        <EmptyState className={privacyClass(calendar.note)} icon={<CalendarDays size={38} />} title="No events scheduled" detail={calendar.note} />
      )}
    </section>
  );
}

function GithubPanel({ github }) {
  return (
    <section className="panel compact-panel stat-panel">
      <div className="panel-title">
        <span className="panel-icon blue"><Code2 size={17} /></span>
        <div><h2>GitHub</h2><small>{github.user}</small></div>
      </div>
      <div className="big-stat">{github.openPrCount}</div>
      <small>Open pull requests</small>
      {(github.prs || []).slice(0, 5).map((pr) => (
        <div className="mini-row tight" key={`${pr.repo}-${pr.number}`}>
          <strong>{pr.repo}</strong>
          <span>#{pr.number}</span>
        </div>
      ))}
    </section>
  );
}

function VercelPanel({ vercel }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-title">
        <span className="panel-icon white"><Cloud size={17} /></span>
        <div><h2>Vercel Deploys</h2><small>{vercel.projects?.length || 0}</small></div>
      </div>
      {(vercel.projects || []).map((project) => (
        <div className="mini-row" key={project.name}>
          <span className="status-label ok">{project.state}</span>
          <div><strong>{project.name}</strong><small>{project.branch}</small></div>
          <time>{project.deployed}</time>
        </div>
      ))}
    </section>
  );
}

function DrivePanel({ drive }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-title">
        <span className="panel-icon teal"><Folder size={17} /></span>
        <div><h2>Drive Recent</h2><small>{drive.recent?.length || 0}</small></div>
      </div>
      {(drive.recent || []).slice(0, 6).map((file) => (
        <div className={cx("mini-row", file.money && "money-val", privacyClass(file))} key={`${file.title}-${file.when}`}>
          <span className="file-type">{file.type}</span>
          <strong>{file.title}</strong>
          <time>{file.when}</time>
        </div>
      ))}
    </section>
  );
}

function MoneyPanel({ money }) {
  return (
    <section className={cx("panel compact-panel money-panel", privacyClass(money))}>
      <div className="panel-title">
        <span className="panel-icon gold"><DollarSign size={17} /></span>
        <div><h2>Money Snapshot</h2><small>{money.events?.length || 0}</small></div>
      </div>
      {(money.events || []).map((event) => (
        <div className={cx("mini-row money-val", privacyClass(event))} key={`${event.label}-${event.date}`}>
          <strong>{event.label}</strong>
          <span>{event.amount}</span>
          <time>{event.date}</time>
        </div>
      ))}
      {money.events?.length ? null : <EmptyState icon={<DollarSign size={32} />} title="No money events" />}
      <div className="money-hidden">Balance snapshot hidden</div>
    </section>
  );
}

function EmptyState({ icon, title, detail, className }) {
  return (
    <div className={cx("empty-state", className)}>
      {icon}
      <strong>{title}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function SpotifyPanel({ spotify, library, expanded = false, onControl, busyAction = "" }) {
  const player = spotify?.player;
  const active = Boolean(player?.active);
  const canControl = Boolean(spotify?.ok && active && onControl);
  const [now, setNow] = useState(() => Date.now());
  const estimatedProgressMs = estimateSpotifyProgressMs(player, spotify?.receivedAt, now);
  const progressPercent = active && player?.durationMs ? Math.min(100, estimatedProgressMs / player.durationMs * 100) : 0;

  useEffect(() => {
    if (!active || !player?.isPlaying) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), SPOTIFY_PROGRESS_TICK_MS);
    return () => window.clearInterval(interval);
  }, [active, player?.isPlaying, player?.track, spotify?.receivedAt]);

  return (
    <section className={cx("panel spotify-panel", expanded && "expanded")}>
      <div className="panel-title">
        <span className="panel-icon green"><Music size={17} /></span>
        <div>
          <h2>Spotify</h2>
          <small>{active ? player.device : "No active device"}</small>
        </div>
      </div>
      <div className="spotify-body">
        <div className="album-art">
          {player?.albumArt ? <img src={player.albumArt} alt="" /> : <Music size={34} />}
        </div>
        <div className="track-copy">
          <strong>{active ? player.track : "Nothing playing right now"}</strong>
          <small>{active ? player.artist : spotify?.detail || library?.nowPlayingNote}</small>
          <div className="progress"><span style={{ width: `${progressPercent}%` }} /></div>
        </div>
        <div className="player-controls">
          <button disabled={!canControl || Boolean(busyAction)} onClick={() => onControl("previous")} aria-label="Previous">
            {busyAction === "previous" ? <RefreshCw className="spin" size={16} /> : <SkipBack size={18} />}
          </button>
          <button
            className="play-button"
            disabled={!canControl || Boolean(busyAction)}
            onClick={() => onControl(player?.isPlaying ? "pause" : "play")}
            aria-label={player?.isPlaying ? "Pause" : "Play"}
          >
            {busyAction === "pause" || busyAction === "play" ? <RefreshCw className="spin" size={18} /> : player?.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button disabled={!canControl || Boolean(busyAction)} onClick={() => onControl("next")} aria-label="Next">
            {busyAction === "next" ? <RefreshCw className="spin" size={16} /> : <SkipForward size={18} />}
          </button>
        </div>
      </div>
      {spotify?.authUrl ? (
        <a className="spotify-connect" href={spotify.authUrl}>Connect Spotify</a>
      ) : null}
      <div className="library-strip">
        <span>{library?.library?.tracks?.toLocaleString?.() || "0"} tracks</span>
        <span>{library?.library?.hours || "0"} hours</span>
        <span>{library?.library?.playlists || "0"} playlists</span>
      </div>
    </section>
  );
}

function ListPanel({ title, icon, items }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-title">
        <span className="panel-icon lavender">{icon}</span>
        <div><h2>{title}</h2><small>{items.length}</small></div>
      </div>
      {items.slice(0, 6).map(([label, meta, note]) => (
        <div className={cx("mini-row", privacyClass(label, meta, note))} key={`${title}-${label}-${meta}`}>
          <strong>{label}</strong>
          <time>{meta}</time>
          {note ? <small>{note}</small> : null}
        </div>
      ))}
    </section>
  );
}

function DegradedPanel({ sources }) {
  const degraded = sources.filter((source) => source.status !== "online");
  return (
    <section className="panel compact-panel degraded-panel">
      <div className="panel-title">
        <span className="panel-icon orange"><AlertTriangle size={17} /></span>
        <div><h2>Degraded Sources</h2><small>{degraded.length}</small></div>
      </div>
      {degraded.length ? degraded.map((source) => (
        <div className={cx("mini-row", privacyClass(source))} key={source.id}>
          <strong>{source.name}</strong>
          <span className={cx("status-label", source.status === "auth_required" ? "warn" : "bad")}>{source.status}</span>
          <small>{source.detail}</small>
        </div>
      )) : (
        <div className="empty-state">
          <CheckCircle2 size={32} />
          <strong>All sources nominal</strong>
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
