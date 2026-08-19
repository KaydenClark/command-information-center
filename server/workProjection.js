const WORK_FUID = /^[0-9A-Z]{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TICKET_COLUMNS = new Map([
  ['deferred', 'backlog'],
  ['ready', 'todo'],
  ['in-progress', 'inProgress'],
  ['blocked', 'blocked'],
  ['done', 'complete']
]);

export function rebuildWorkProjection(db, sources, options = {}) {
  const now = options.now || new Date().toISOString();
  const startedAt = options.startedAt || now;
  let normalized;
  try {
    normalized = validateSources(sources);
  } catch (error) {
    recordFailedRefresh(db, options.refreshFuid, startedAt, now, sources?.length ?? 0, error);
    throw error;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare("DELETE FROM work_items_projection WHERE kind = 'ticket'").run();
    db.prepare("DELETE FROM work_items_projection WHERE kind = 'spec'").run();
    db.prepare('DELETE FROM work_projection_sources').run();

    const insertSource = db.prepare(`
      INSERT INTO work_projection_sources (
        source_key, source_path, source_revision, observed_at, captured_at, status, detail
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO work_items_projection (
        fuid, source_key, kind, typed_alias, parent_fuid, title,
        canonical_status, created, last_worked, priority, owner,
        blockers, next_gate, source_revision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const source of normalized) {
      insertSource.run(
        source.key, source.path, source.revision, source.observedAt,
        now, source.status, source.detail
      );
      for (const spec of source.specs) insertProjectionItem(insertItem, source, 'spec', spec, null);
      for (const spec of source.specs) {
        for (const ticket of spec.tickets) insertProjectionItem(insertItem, source, 'ticket', ticket, spec.fuid);
      }
    }
    const refreshFuid = reserveRuntimeFuid(db, options.refreshFuid, now);
    const itemCount = normalized.reduce((sum, source) => sum + source.specs.reduce((count, spec) => count + 1 + spec.tickets.length, 0), 0);
    db.prepare(`
      INSERT INTO work_projection_refreshes (
        fuid, started_at, completed_at, source_count, item_count, outcome, error_detail
      ) VALUES (?, ?, ?, ?, ?, 'ok', '')
    `).run(refreshFuid, startedAt, now, normalized.length, itemCount);
    db.exec('COMMIT');
    return { fuid: refreshFuid, sourceCount: normalized.length, itemCount, outcome: 'ok', completedAt: now };
  } catch (error) {
    db.exec('ROLLBACK');
    recordFailedRefresh(db, options.refreshFuid, startedAt, now, normalized.length, error);
    throw error;
  }
}

export function listWorkProjection(db) {
  const sources = db.prepare('SELECT * FROM work_projection_sources ORDER BY source_key').all().map((row) => ({
    key: row.source_key,
    path: row.source_path,
    revision: row.source_revision,
    observedAt: row.observed_at,
    capturedAt: row.captured_at,
    status: row.status,
    detail: row.detail
  }));
  const refreshRow = db.prepare('SELECT * FROM work_projection_refreshes ORDER BY completed_at DESC, rowid DESC LIMIT 1').get();
  const rows = db.prepare(`
    SELECT * FROM work_items_projection
    ORDER BY source_key, kind DESC, typed_alias
  `).all();
  const ticketsByParent = new Map();
  for (const row of rows.filter((item) => item.kind === 'ticket')) {
    const tickets = ticketsByParent.get(row.parent_fuid) ?? [];
    tickets.push(rowToProjection(row));
    ticketsByParent.set(row.parent_fuid, tickets);
  }
  const specs = rows.filter((item) => item.kind === 'spec').map((row) => ({
    ...rowToProjection(row),
    tickets: ticketsByParent.get(row.fuid) ?? []
  }));
  return {
    status: refreshRow?.outcome === 'ok' ? 'ok' : refreshRow ? 'degraded' : 'empty',
    source: 'SQLite Work-item Projection; canonical repositories remain authoritative',
    refresh: refreshRow ? rowToRefresh(refreshRow) : null,
    sources,
    specs
  };
}

export function columnForStatus(status) {
  return TICKET_COLUMNS.get(String(status || '').toLowerCase()) ?? null;
}

export function reserveRuntimeFuid(db, requested, now = new Date().toISOString()) {
  const occupied = new Set([
    ...db.prepare('SELECT fuid FROM work_items_projection').all().map((row) => row.fuid),
    ...db.prepare('SELECT fuid FROM work_projection_refreshes').all().map((row) => row.fuid),
    ...db.prepare('SELECT fuid FROM intent_requests').all().map((row) => row.fuid)
  ]);
  let fuid = requested;
  if (fuid) {
    validateFuid(fuid, 'runtime');
    if (occupied.has(fuid)) throw workError(`FUID ${fuid} is already in use.`, 409, 'fuid_collision');
  } else {
    const allocator = db.prepare("SELECT last_issued FROM fuid_allocators WHERE scope = 'cic-runtime'").get();
    const highest = [...occupied, allocator?.last_issued].filter(Boolean).sort((a, b) => fuidValue(b) - fuidValue(a))[0] || '000000';
    fuid = nextFuid(highest);
    while (occupied.has(fuid)) fuid = nextFuid(fuid);
  }
  const current = db.prepare("SELECT last_issued FROM fuid_allocators WHERE scope = 'cic-runtime'").get()?.last_issued;
  if (!current || fuidValue(fuid) > fuidValue(current)) {
    db.prepare(`
      INSERT INTO fuid_allocators (scope, width, last_issued, updated_at)
      VALUES ('cic-runtime', 6, ?, ?)
      ON CONFLICT(scope) DO UPDATE SET last_issued = excluded.last_issued, updated_at = excluded.updated_at
    `).run(fuid, now);
  }
  return fuid;
}

function validateSources(sources) {
  if (!Array.isArray(sources)) throw workError('Projection sources must be an array.', 400, 'projection_invalid');
  const sourceKeys = new Set();
  const fuids = new Set();
  return sources.map((source) => {
    const key = bounded(source?.key, 80, 'source key');
    if (sourceKeys.has(key)) throw workError(`Duplicate source key ${key}.`, 400, 'projection_duplicate_source');
    sourceKeys.add(key);
    const path = bounded(source?.path, 500, 'source path');
    const revision = bounded(source?.revision, 160, 'source revision');
    const observedAt = timestamp(source?.observedAt, 'source observedAt');
    const status = new Set(['current', 'stale', 'unavailable']).has(source?.status) ? source.status : 'current';
    const detail = String(source?.detail || '').slice(0, 500);
    if (!Array.isArray(source?.specs)) throw workError(`${key} specs must be an array.`, 400, 'projection_invalid');
    const specs = source.specs.map((spec) => normalizeItem(spec, 'spec', fuids));
    return { key, path, revision, observedAt, status, detail, specs };
  });
}

function normalizeItem(item, kind, fuids) {
  const fuid = validateFuid(item?.fuid, kind);
  if (fuids.has(fuid)) throw workError(`Duplicate FUID ${fuid}.`, 400, 'projection_duplicate_fuid');
  fuids.add(fuid);
  const alias = bounded(item?.alias, 120, `${kind} alias`);
  const title = bounded(item?.title, 500, `${kind} title`);
  const status = bounded(item?.status, 80, `${kind} status`).toLowerCase();
  if (kind === 'ticket' && !columnForStatus(status)) throw workError(`Unknown ticket status ${status}.`, 400, 'projection_status_invalid');
  const created = date(item?.created, `${kind} Created`);
  const lastWorked = date(item?.lastWorked, `${kind} Last worked`);
  if (created > lastWorked) throw workError(`${kind} Created is after Last worked.`, 400, 'projection_date_order');
  const normalized = {
    fuid, alias, title, status, created, lastWorked,
    priority: String(item?.priority || '').slice(0, 40),
    owner: String(item?.owner || '').slice(0, 160),
    blockers: String(item?.blockers || '').slice(0, 1000),
    nextGate: String(item?.nextGate || '').slice(0, 1000)
  };
  if (kind === 'spec') {
    if (!Array.isArray(item?.tickets)) throw workError(`${alias} tickets must be an array.`, 400, 'projection_invalid');
    normalized.tickets = item.tickets.map((ticket) => normalizeItem(ticket, 'ticket', fuids));
  }
  return normalized;
}

function insertProjectionItem(statement, source, kind, item, parentFuid) {
  statement.run(
    item.fuid, source.key, kind, item.alias, parentFuid, item.title,
    item.status, item.created, item.lastWorked, item.priority, item.owner,
    item.blockers, item.nextGate, source.revision
  );
}

function rowToProjection(row) {
  return {
    fuid: row.fuid,
    sourceKey: row.source_key,
    kind: row.kind,
    alias: row.typed_alias,
    parentFuid: row.parent_fuid,
    title: row.title,
    status: row.canonical_status,
    column: row.kind === 'ticket' ? columnForStatus(row.canonical_status) : null,
    created: row.created,
    lastWorked: row.last_worked,
    priority: row.priority,
    owner: row.owner,
    blockers: row.blockers,
    nextGate: row.next_gate,
    sourceRevision: row.source_revision
  };
}

function rowToRefresh(row) {
  return {
    fuid: row.fuid,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    sourceCount: row.source_count,
    itemCount: row.item_count,
    outcome: row.outcome,
    error: row.error_detail || null
  };
}

function recordFailedRefresh(db, requestedFuid, startedAt, completedAt, sourceCount, error) {
  if (!requestedFuid || !WORK_FUID.test(requestedFuid) || requestedFuid === '000000') return;
  try {
    db.exec('BEGIN IMMEDIATE');
    const fuid = reserveRuntimeFuid(db, requestedFuid, completedAt);
    db.prepare(`
      INSERT INTO work_projection_refreshes (
        fuid, started_at, completed_at, source_count, item_count, outcome, error_detail
      ) VALUES (?, ?, ?, ?, 0, 'failed', ?)
    `).run(fuid, startedAt, completedAt, Math.max(0, Number(sourceCount) || 0), String(error?.message || error).slice(0, 500));
    db.exec('COMMIT');
  } catch {
    try { db.exec('ROLLBACK'); } catch { /* transaction may not have started */ }
  }
}

function validateFuid(value, label) {
  if (!WORK_FUID.test(value || '') || value === '000000') throw workError(`Invalid FUID for ${label}.`, 400, 'fuid_invalid');
  return value;
}

function bounded(value, max, label) {
  const result = String(value || '').trim();
  if (!result || result.length > max) throw workError(`Invalid ${label}.`, 400, 'projection_invalid');
  return result;
}

function date(value, label) {
  if (!ISO_DATE.test(value || '') || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))) throw workError(`Invalid ${label}.`, 400, 'projection_date_invalid');
  return value;
}

function timestamp(value, label) {
  if (!value || !Number.isFinite(Date.parse(value))) throw workError(`Invalid ${label}.`, 400, 'projection_timestamp_invalid');
  return value;
}

function nextFuid(value) {
  const next = fuidValue(value) + 1;
  if (next >= 36 ** 6) throw workError('Six-character FUID space is exhausted.', 503, 'fuid_exhausted');
  return next.toString(36).toUpperCase().padStart(6, '0');
}

function fuidValue(value) {
  return parseInt(value, 36);
}

function workError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}
