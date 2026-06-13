import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Columns3,
  DollarSign,
  Folder,
  Grid2X2,
  Inbox,
  Lock,
  LogOut,
  Mail,
  Menu,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
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
import "./styles.css";

const COLUMNS = ["Inbox", "Today", "Next", "Waiting", "Done"];
const PRIORITIES = ["P1", "P2", "P3"];
const STATUS_ORDER = Object.fromEntries(COLUMNS.map((column, index) => [column, index]));

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
  const [activeView, setActiveView] = useState("Overview");
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
        />
        {error ? <div className="error-banner">{error}</div> : null}
        <MobileTabs activeView={activeView} setActiveView={setActiveView} />
        <SystemHealth sources={state.sourceHealth} />
        <section className={cx("view-stack", activeView !== "Overview" && "focused")}>
          {(activeView === "Overview" || activeView === "Board") && (
            <div className="top-grid">
              <Briefing briefing={data.briefing} />
              <KanbanBoard tasks={state.tasks} onCreate={createTask} onUpdate={mutateTask} onDismiss={dismissTask} />
            </div>
          )}
          {(activeView === "Overview" || activeView === "Sources") && (
            <PanelGrid
              data={data}
              spotify={state.spotify}
              privacy={privacy}
              onGmailRefresh={refreshGmail}
              onSpotifyControl={controlSpotify}
              spotifyBusy={spotifyBusy}
            />
          )}
          {activeView === "Music" && <SpotifyPanel spotify={state.spotify} library={data.spotify} expanded onControl={controlSpotify} busyAction={spotifyBusy} />}
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
  const items = [
    ["Overview", Grid2X2],
    ["Briefing", Bell],
    ["Inbox", Inbox],
    ["Calendar", CalendarDays],
    ["Board", Columns3],
    ["Code", Code2],
    ["Deployments", Cloud],
    ["Drive", Folder],
    ["Finance", DollarSign],
    ["Music", Music],
    ["Settings", Settings]
  ];
  return (
    <aside className="sidebar">
      <button className="icon-button top-menu" aria-label="Menu">
        <Menu size={19} />
      </button>
      <nav>
        {items.map(([label, Icon]) => (
          <button
            key={label}
            className={cx("nav-item", activeView === label && "active")}
            onClick={() => setActiveView(label === "Briefing" || label === "Inbox" ? "Overview" : label)}
          >
            <Icon size={17} />
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

function TopBar({ data, busy, privacy, onPrivacy, onRefresh, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h1>Command Information Center</h1>
        <p>Kayden Ops Dashboard</p>
      </div>
      <div className="lan-status">
        <span className="dot ok" />
        <strong>Local LAN</strong>
        <span>{window.location.host}</span>
      </div>
      <div className="top-actions">
        <button className={cx("status-button", privacy && "active")} onClick={onPrivacy}>
          <Lock size={16} />
          <span>{privacy ? "Privacy: On" : "Privacy: Off"}</span>
        </button>
        <button className="status-button" onClick={onRefresh} disabled={busy}>
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
      {["Overview", "Board", "Sources", "Music"].map((view) => (
        <button key={view} className={activeView === view ? "active" : ""} onClick={() => setActiveView(view)}>
          {view}
        </button>
      ))}
    </div>
  );
}

function SystemHealth({ sources }) {
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
    </section>
  );
}

function Briefing({ briefing }) {
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
          <h2>AI Morning Briefing</h2>
          <small>{briefing.actions?.length || 0} actions</small>
        </div>
      </div>
      <h3>{briefing.headline}</h3>
      <p>{briefing.summary}</p>
      <div className="priority-stats">
        {PRIORITIES.map((priority) => (
          <div key={priority}>
            <span className={cx("priority", priority)}>{priority}</span>
            <strong>{counts[priority] || 0}</strong>
          </div>
        ))}
      </div>
      <div className="action-list">
        {(briefing.actions || []).slice(0, 5).map((action) => (
          <article key={`${action.priority}-${action.title}`} className="action-row">
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

function KanbanBoard({ tasks, onCreate, onUpdate, onDismiss }) {
  const grouped = useMemo(() => {
    const next = Object.fromEntries(COLUMNS.map((column) => [column, []]));
    for (const task of tasks) next[task.status]?.push(task);
    for (const column of COLUMNS) {
      next[column].sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.createdAt.localeCompare(b.createdAt));
    }
    return next;
  }, [tasks]);

  return (
    <section className="panel board-panel">
      <div className="panel-title">
        <span className="panel-icon gold"><Columns3 size={17} /></span>
        <div>
          <h2>Workflow Board</h2>
          <small>Kanban</small>
        </div>
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
        <span>{column}</span>
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
  const index = STATUS_ORDER[task.status];
  const canLeft = index > 0;
  const canRight = index < COLUMNS.length - 1;
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
        {task.suggested ? (
          <button onClick={() => onDismiss(task.id)} aria-label="Dismiss suggestion">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PanelGrid({ data, spotify, onGmailRefresh, onSpotifyControl, spotifyBusy }) {
  return (
    <div className="panel-grid">
      <GmailPanel gmail={data.gmail} onRefresh={onGmailRefresh} />
      <CalendarPanel calendar={data.calendar} />
      <GithubPanel github={data.github} />
      <VercelPanel vercel={data.vercel} />
      <DrivePanel drive={data.drive} />
      <MoneyPanel money={data.money} />
      <SpotifyPanel spotify={spotify} library={data.spotify} onControl={onSpotifyControl} busyAction={spotifyBusy} />
      <ListPanel title="Projects" icon={<Folder size={17} />} items={(data.projects?.items || []).map((item) => [item.name, item.touched, item.note])} />
      <ListPanel title="Wiki Activity" icon={<Save size={17} />} items={(data.wiki?.entries || []).map((item) => [item.title, item.date, ""])} />
      <DegradedPanel sources={data.sources || []} />
    </div>
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
        <div className="mini-row" key={`${thread.subject}-${thread.date}`}>
          <span className={cx("dot", thread.tag === "MONEY" ? "warn" : thread.tag === "DEADLINE" ? "bad" : "ok")} />
          <div>
            <strong>{thread.subject}</strong>
            <small>{thread.from}</small>
          </div>
          <time>{thread.date}</time>
        </div>
      ))}
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
      {calendar.events?.length ? calendar.events.map((event) => <div className="mini-row" key={event.title}><strong>{event.title}</strong><time>{event.when}</time></div>) : (
        <div className="empty-state">
          <CalendarDays size={38} />
          <strong>No events scheduled</strong>
          <small>{calendar.note}</small>
        </div>
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
        <div className={cx("mini-row", file.money && "money-val")} key={`${file.title}-${file.when}`}>
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
    <section className="panel compact-panel money-panel">
      <div className="panel-title">
        <span className="panel-icon gold"><DollarSign size={17} /></span>
        <div><h2>Money Snapshot</h2><small>{money.events?.length || 0}</small></div>
      </div>
      {(money.events || []).map((event) => (
        <div className="mini-row money-val" key={`${event.label}-${event.date}`}>
          <strong>{event.label}</strong>
          <span>{event.amount}</span>
          <time>{event.date}</time>
        </div>
      ))}
      <div className="money-hidden">Balance snapshot hidden</div>
    </section>
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
        <div className="mini-row" key={`${title}-${label}-${meta}`}>
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
        <div className="mini-row" key={source.id}>
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
