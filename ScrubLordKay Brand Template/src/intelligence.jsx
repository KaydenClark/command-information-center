import React, { useEffect, useMemo, useState } from "react";
import {
  Database,
  FileText,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  Send
} from "lucide-react";
import { privacyClass } from "./privacy.js";

// The Ask panel still drives OpenAI on user action; everything else on this tab is a
// plain read of OpenBrain, so we hard-code these quick prompts locally instead of
// asking the server (and an LLM) to generate them on every load.
const SUGGESTED_QUESTIONS = [
  "What should I work on today?",
  "Which tasks look stalled?",
  "What changed recently across my projects?",
  "What evidence supports the current briefing?"
];

// Prescient task buckets, in the order we want them surfaced.
const TASK_GROUPS = [
  { key: "stalled", label: "Stalled" },
  { key: "in_progress", label: "In Progress" },
  { key: "open", label: "Open" }
];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON from ${path}, received ${contentType || "an unknown response type"}.`);
  }
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

function truncate(text, max = 120) {
  const clean = String(text || "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function formatTimestamp(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function IntelligenceDashboard({ expanded = false }) {
  const [kb, setKb] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  // Primary load: a fast, AI-free database read of OpenBrain.
  async function loadKb() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/intelligence/kb");
      setKb(Array.isArray(data.kb) ? data.kb : []);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setGeneratedAt(data.generatedAt || null);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // OpenAI fires only here, on explicit user action.
  async function ask(event, nextQuestion = question) {
    event?.preventDefault();
    if (!nextQuestion.trim()) return;
    setAsking(true);
    setError("");
    try {
      const result = await api("/api/intelligence/ask", {
        method: "POST",
        body: JSON.stringify({ question: nextQuestion })
      });
      setAnswer(result);
      setQuestion(nextQuestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  }

  useEffect(() => {
    loadKb();
  }, []);

  const groupedTasks = useMemo(() => {
    const buckets = new Map(TASK_GROUPS.map((group) => [group.key, []]));
    const extras = new Map();
    for (const task of tasks) {
      const status = task.status || "open";
      if (buckets.has(status)) buckets.get(status).push(task);
      else {
        if (!extras.has(status)) extras.set(status, []);
        extras.get(status).push(task);
      }
    }
    const ordered = TASK_GROUPS.map((group) => ({ ...group, items: buckets.get(group.key) }));
    for (const [key, items] of extras) {
      ordered.push({ key, label: key.replace(/_/g, " "), items });
    }
    return ordered.filter((group) => group.items.length > 0);
  }, [tasks]);

  if (error && !loaded) {
    return (
      <section className={cx("panel intelligence-panel", expanded && "intelligence-page")}>
        <PanelTitle title="Intelligence" meta="unavailable" busy={busy} onRefresh={loadKb} />
        <div className="error-banner">{error}</div>
      </section>
    );
  }

  return (
    <section className={cx("panel intelligence-panel", expanded && "intelligence-page")}>
      <PanelTitle
        title={expanded ? "Personal Data Intelligence" : "Intelligence Brief"}
        meta={`OpenBrain · ${kb.length} chunks · ${tasks.length} tasks · ${formatTimestamp(generatedAt)}`}
        busy={busy}
        onRefresh={loadKb}
      />
      {!loaded ? (
        <div className="empty-state">
          <RefreshCw className="spin" size={30} />
          <strong>Reading OpenBrain</strong>
        </div>
      ) : (
        <div className={expanded ? "intelligence-layout expanded" : "intelligence-layout"}>
          <div className="intelligence-main">
            <KnowledgeFeed chunks={kb} expanded={expanded} />
            <PrescientTasks groups={groupedTasks} hasTasks={tasks.length > 0} />
          </div>
          <aside className="assistant-panel">
            <div className="section-header">
              <span>Assistant</span>
              <small>{answer?.status || "on demand"}</small>
            </div>
            <form className="assistant-form" onSubmit={ask}>
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your data" />
              <button aria-label="Ask intelligence assistant" disabled={asking || !question.trim()}>
                {asking ? <RefreshCw className="spin" size={15} /> : <Send size={15} />}
              </button>
            </form>
            <div className="question-list">
              {SUGGESTED_QUESTIONS.map((item) => (
                <button key={item} onClick={(event) => ask(event, item)} disabled={asking}>
                  {item}
                </button>
              ))}
            </div>
            {answer ? (
              <div className={cx("assistant-answer", privacyClass(answer))}>
                <strong>Answer</strong>
                <p>{answer.answer}</p>
                <SourceLine sources={answer.sources} />
              </div>
            ) : (
              <div className="assistant-answer muted">
                <MessageSquareText size={24} />
                <span>Ask a source-backed question.</span>
              </div>
            )}
          </aside>
        </div>
      )}
      {error ? <div className="form-error">{error}</div> : null}
    </section>
  );
}

function KnowledgeFeed({ chunks, expanded }) {
  return (
    <div className="intelligence-section">
      <div className="section-header">
        <span><Database size={15} /> OpenBrain Knowledge Feed</span>
        <small>{chunks.length}</small>
      </div>
      {chunks.length === 0 ? (
        <div className="assistant-answer muted">
          <FileText size={22} />
          <span>No knowledge chunks returned from OpenBrain.</span>
        </div>
      ) : (
        <div className="insight-grid">
          {chunks.slice(0, expanded ? 8 : 6).map((chunk) => (
            <article className="insight-card" key={chunk.id || `${chunk.vault}-${chunk.title}`}>
              <div className="connector-head">
                <strong>{chunk.title || "Untitled"}</strong>
                {typeof chunk.similarity === "number" ? (
                  <span className="kb-score">{chunk.similarity.toFixed(3)}</span>
                ) : null}
              </div>
              <small>{chunk.vault || "wiki"}</small>
              <p>{truncate(chunk.content, 120)}</p>
              {chunk.path ? (
                <div className="source-line">
                  <FileText size={13} />
                  <span>{chunk.path}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function PrescientTasks({ groups, hasTasks }) {
  return (
    <div className="intelligence-section">
      <div className="section-header">
        <span><ListChecks size={15} /> Prescient Tasks</span>
        <small>{groups.reduce((total, group) => total + group.items.length, 0)}</small>
      </div>
      {!hasTasks ? (
        <div className="assistant-answer muted">
          <ListChecks size={22} />
          <span>No flagged tasks — system check runs nightly.</span>
        </div>
      ) : (
        groups.map((group) => (
          <div className="prescient-group" key={group.key}>
            <div className="prescient-group-head">
              <span>{group.label}</span>
              <small>{group.items.length}</small>
            </div>
            <div className="insight-grid">
              {group.items.map((task) => (
                <article className="insight-card prescient-task" key={task.id || task.title}>
                  <div className="connector-head">
                    <strong>{task.title}</strong>
                    <span className={cx("priority", task.priority || "P3")}>{task.priority || "P3"}</span>
                  </div>
                  <small>{task.area || "general"}</small>
                  {task.detail ? <p>{truncate(task.detail, 160)}</p> : null}
                  <div className="task-meta">
                    {task.kanban_stage && task.expected_stage ? (
                      <span className="task-stage">{task.kanban_stage} → {task.expected_stage}</span>
                    ) : null}
                    <span className="flagged-tag">{task.flagged_by || "system"}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PanelTitle({ title, meta, busy, onRefresh }) {
  return (
    <div className="panel-title">
      <span className="panel-icon teal"><Database size={17} /></span>
      <div>
        <h2>{title}</h2>
        <small>{meta}</small>
      </div>
      <button className="icon-button" onClick={onRefresh} aria-label="Refresh intelligence" disabled={busy}>
        <RefreshCw className={busy ? "spin" : ""} size={15} />
      </button>
    </div>
  );
}

function SourceLine({ sources = [] }) {
  if (!sources.length) return null;
  return (
    <div className="source-line">
      <FileText size={13} />
      <span>{sources.slice(0, 4).map((source) => source.label || source.id || source.source).join(" + ")}</span>
    </div>
  );
}
