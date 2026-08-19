import React, { useEffect, useMemo, useState } from "react";
import { Blocks, Filter, RefreshCw, Search } from "lucide-react";
import { buildSkillsViewModel } from "./skillCatalogModel.js";

// S-022 TK-001: read-only tracer bullet for one skill row end to end. Renders
// the GET /api/skills payload — name, definition, rewrite lane, availability,
// freshness, and canon-versus-deployed drift badge — for every catalog entry
// the reader returns. CIC exposes no create/edit/sync/deploy action here.

async function requestJson(path) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function SkillBadge({ label, tone }) {
  return <span className={cx("skill-badge", `skill-badge-${tone}`)}>{label}</span>;
}

function SkillEntry({ entry }) {
  return (
    <article className="skill-entry" data-testid="skill-entry">
      <div className="skill-entry-head">
        <strong>{entry.name}</strong>
        <span className="skill-lane">{entry.lane}</span>
      </div>
      <p className="skill-definition">{entry.definition}</p>
      <div className="skill-entry-fields">
        <div className="skill-field">
          <small>Availability</small>
          <span>{entry.availability}</span>
        </div>
        <div className="skill-field">
          <small>Freshness</small>
          <span data-testid="skill-freshness">{entry.freshnessLabel}</span>
        </div>
        <div className="skill-field">
          <small>Canon vs. deployed</small>
          <span data-testid="skill-drift-badge">
            <SkillBadge label={entry.driftLabel} tone={entry.driftTone} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function SkillsContent({ payload, fetchError = "", busy = false, onReload = () => {} }) {
  const vm = buildSkillsViewModel(payload);
  const [query, setQuery] = useState("");
  const [drift, setDrift] = useState("all");
  const visibleEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vm.entries.filter((entry) => {
      if (drift !== "all" && entry.driftLabel !== drift) return false;
      if (!needle) return true;
      return [entry.name, entry.definition, entry.lane, entry.availability, entry.driftLabel]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [vm.entries, query, drift]);

  return (
    <section className="panel skill-panel" data-testid="skills-view">
      <div className="panel-title">
        <div className="page-header">
          <span className="panel-icon lavender"><Blocks size={17} /></span>
          <div>
            <h2>Skills</h2>
            <small>Read-only agent skill catalog, source, freshness, and canon-versus-deployed drift</small>
          </div>
        </div>
        <button className="status-button" onClick={onReload} disabled={busy} aria-label="Reload skill catalog">
          <RefreshCw size={15} className={busy ? "spin" : ""} />
          <span>Reload</span>
        </button>
      </div>

      <div className={cx("skill-banner", `skill-banner-${vm.tone}`)} data-status={vm.status}>
        <span className={cx("dot", vm.tone)} />
        <strong>{vm.statusLabel}</strong>
        <span className="skill-banner-meta">
          Source {vm.sourceLabel} · Checked {vm.checkedAtLabel}
        </span>
        {vm.detail ? <span className="skill-banner-reason">{vm.detail}</span> : null}
        {fetchError ? <span className="skill-banner-reason">{fetchError}</span> : null}
      </div>

      {vm.repository ? (
        <div className={cx("skill-repository", vm.repository.status)}>
          <strong>Shared skill repository</strong>
          <code>{vm.repository.branch || "unavailable"} @ {vm.repository.headSha?.slice(0, 12) || "—"}</code>
          <span>{vm.repository.upstream ? `${vm.repository.upstream} · ${vm.repository.aheadBy} ahead / ${vm.repository.behindBy} behind` : "No upstream evidence"}</span>
          <small>{vm.repository.dirtyFiles == null ? "Dirty state unavailable" : `${vm.repository.dirtyFiles} changed files`} · no fetch performed</small>
        </div>
      ) : null}

      {vm.entries.length ? (
        <div className="skill-controls">
          <label><Search size={15} /><input aria-label="Search installed skills" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skill, definition, or lane" /></label>
          <label><Filter size={15} /><select aria-label="Filter skills by state" value={drift} onChange={(event) => setDrift(event.target.value)}><option value="all">All skill states</option>{[...new Set(vm.entries.map((entry) => entry.driftLabel))].map((label) => <option value={label} key={label}>{label}</option>)}</select></label>
          <strong>{visibleEntries.length} / {vm.entries.length}</strong>
        </div>
      ) : null}

      {visibleEntries.length ? (
        <div className="skill-list">
          {visibleEntries.map((entry) => <SkillEntry key={entry.name} entry={entry} />)}
        </div>
      ) : (
        <p className="skill-empty" data-testid="skills-empty">
          {vm.status === "ok"
            ? (vm.entries.length ? "No installed skills match these filters." : "The shared skill home is readable but has no installed skills.")
            : "The skill catalog is currently unavailable; nothing is fabricated in its place."}
        </p>
      )}
    </section>
  );
}

export function SkillsView() {
  const [payload, setPayload] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setFetchError("");
    try {
      setPayload(await requestJson("/api/skills"));
    } catch (error) {
      setFetchError(error.message);
      setPayload(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return <SkillsContent payload={payload} fetchError={fetchError} busy={busy} onReload={load} />;
}
