import React, { useEffect, useState } from "react";
import {
  Database,
  FileText,
  MessageSquareText,
  RefreshCw,
  Send
} from "lucide-react";
import { privacyClass } from "./privacy.js";

const FALLBACK_QUESTIONS = [
  "What should I work on today?",
  "Which tasks look stalled?",
  "What changed recently across my projects?",
  "What evidence supports the current briefing?"
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

function formatTimestamp(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function IntelligenceDashboard({ expanded = false }) {
  const [overview, setOverview] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  // On mount we do a cache-friendly read (may serve a cached synthesis or, when
  // auto-synthesis is disabled, the deterministic fallback at zero OpenAI cost).
  // The Refresh control forces a fresh synthesis that bypasses the server cache.
  async function loadOverview(force = false) {
    setBusy(true);
    setError("");
    try {
      const result = force
        ? await api("/api/intelligence/overview?refresh=1")
        : await api("/api/intelligence/overview");
      setOverview(result);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

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
    loadOverview(false);
  }, []);

  const refresh = () => loadOverview(true);

  if (error && !loaded) {
    return (
      <section className={cx("panel intelligence-panel", expanded && "intelligence-page")}>
        <PanelTitle title="Intelligence" meta="unavailable" busy={busy} onRefresh={refresh} />
        <div className="error-banner">{error}</div>
      </section>
    );
  }

  const questions = overview?.suggestedQuestions?.length ? overview.suggestedQuestions : FALLBACK_QUESTIONS;
  const provenance = overview?.generatedBy === "openai"
    ? (overview?.cached ? "AI synthesis · cached" : "AI synthesis")
    : (overview?.autosynth === "off" ? "Current feed · auto-synthesis off" : "Current feed");
  const metadata = overview
    ? `${provenance} · ${overview.insights?.length || 0} insights · ${formatTimestamp(overview.generatedAt)}`
    : "Loading";

  return (
    <section className={cx("panel intelligence-panel", expanded && "intelligence-page")}>
      <PanelTitle
        title={expanded ? "Personal Data Intelligence" : "Intelligence Brief"}
        meta={metadata}
        busy={busy}
        onRefresh={refresh}
      />
      {!loaded ? (
        <div className="empty-state">
          <RefreshCw className="spin" size={30} />
          <strong>Building your brief</strong>
        </div>
      ) : (
        <div className={expanded ? "intelligence-layout expanded" : "intelligence-layout"}>
          <div className="intelligence-main">
            <Briefing briefing={overview?.briefing} status={overview?.status} />
            <Insights insights={overview?.insights || []} expanded={expanded} />
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
              {questions.slice(0, 4).map((item) => (
                <button key={item} onClick={(event) => ask(event, item)} disabled={asking}>
                  {item}
                </button>
              ))}
            </div>
            {answer ? (
              <div className={cx("assistant-answer", privacyClass(answer.answer))}>
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

function Briefing({ briefing, status }) {
  return (
    <div className={cx("intelligence-brief", privacyClass(`${briefing?.headline || ""} ${briefing?.summary || ""}`))}>
      <h3>{briefing?.headline || "Intelligence brief unavailable"}</h3>
      <p>{briefing?.summary || "No current briefing was returned."}</p>
      <div className="intelligence-status-row">
        <span className={cx("status-label", status === "ready" ? "ok" : "warn")}>
          {status === "ready" ? "Source-backed" : "Partial data"}
        </span>
      </div>
    </div>
  );
}

function Insights({ insights, expanded }) {
  return (
    <div className="intelligence-section">
      <div className="section-header">
        <span><Database size={15} /> What needs attention</span>
        <small>{insights.length}</small>
      </div>
      {insights.length === 0 ? (
        <div className="assistant-answer muted">
          <FileText size={22} />
          <span>No current insights were returned.</span>
        </div>
      ) : (
        <div className="insight-grid">
          {insights.slice(0, expanded ? 8 : 4).map((insight) => (
            <article className={cx("insight-card", privacyClass(`${insight.title || ""} ${insight.summary || ""}`))} key={insight.id || insight.title}>
              <div className="connector-head">
                <strong>{insight.title || "Untitled insight"}</strong>
                {insight.severity ? <span className={cx("priority", insight.severity)}>{insight.severity}</span> : null}
              </div>
              {insight.area ? <small>{insight.area}</small> : null}
              <p>{insight.summary || "No detail supplied."}</p>
              <SourceLine sources={insight.sources} />
            </article>
          ))}
        </div>
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
