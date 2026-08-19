import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb, createTask, listTasks } from '../server/db.js';
import {
  rebuildWorkProjection,
  listWorkProjection,
  createWorkIntent,
  listWorkIntents
} from '../server/workProjection.js';

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cic-work-projection-'));
  return openDb(path.join(dir, 'test.sqlite'));
}

function sources(overrides = {}) {
  return [{
    key: 'P-001',
    path: '/canonical/alpha',
    revision: 'a'.repeat(40),
    observedAt: '2026-08-18T12:00:00.000Z',
    status: 'current',
    detail: 'Workbench doctor passed.',
    specs: [{
      fuid: '000001',
      alias: 'S-001',
      title: 'Alpha capability',
      status: 'active',
      priority: '1',
      owner: 'Codex',
      blockers: 'none',
      nextGate: 'Complete TK-001.',
      created: '2026-08-10',
      lastWorked: '2026-08-18',
      tickets: [{
        fuid: '000002',
        alias: 'TK-001',
        title: 'Ship alpha',
        status: 'ready',
        blockers: 'none',
        created: '2026-08-10',
        lastWorked: '2026-08-18'
      }, {
        fuid: '000003',
        alias: 'TK-002',
        title: 'Archive proof',
        status: 'done',
        blockers: 'TK-001',
        created: '2026-08-10',
        lastWorked: '2026-08-17'
      }]
    }],
    ...overrides
  }];
}

test('openDb additively creates projection and Intent tables beside legacy personal tasks', () => {
  const db = tempDb();
  createTask(db, { title: 'Personal task' });
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN (
      'tasks', 'captain_operations', 'work_projection_sources',
      'work_items_projection', 'work_projection_refreshes',
      'intent_requests', 'intent_events', 'fuid_allocators'
    ) ORDER BY name
  `).all().map((row) => row.name);
  assert.deepEqual(tables, [
    'captain_operations', 'fuid_allocators', 'intent_events', 'intent_requests',
    'tasks', 'work_items_projection', 'work_projection_refreshes', 'work_projection_sources'
  ]);
  assert.equal(listTasks(db).length, 1);
  db.close();
});

test('rebuildWorkProjection is deterministic, provenance-bearing, and leaves personal tasks separate', () => {
  const db = tempDb();
  createTask(db, { title: 'Personal task' });
  const first = rebuildWorkProjection(db, sources(), {
    now: '2026-08-18T12:05:00.000Z',
    refreshFuid: '00000A'
  });
  assert.equal(first.itemCount, 3);
  const projected = listWorkProjection(db);
  assert.equal(projected.refresh.fuid, '00000A');
  assert.equal(projected.sources[0].revision, 'a'.repeat(40));
  assert.equal(projected.specs[0].fuid, '000001');
  assert.equal(projected.specs[0].alias, 'S-001');
  assert.equal(projected.specs[0].tickets[0].fuid, '000002');
  assert.equal(projected.specs[0].tickets[0].column, 'todo');
  assert.equal(projected.specs[0].tickets[1].column, 'complete');
  assert.equal(projected.specs[0].tickets[0].created, '2026-08-10');
  assert.equal(projected.specs[0].tickets[0].lastWorked, '2026-08-18');
  assert.equal(listTasks(db).length, 1);
  const firstRows = db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all();

  rebuildWorkProjection(db, sources(), {
    now: '2026-08-18T12:06:00.000Z',
    refreshFuid: '00000B'
  });
  assert.deepEqual(
    db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(),
    firstRows,
    'the same canonical capture produces the same materialized rows'
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM work_projection_refreshes').get().count, 2);
  db.close();
});

test('invalid or duplicate canonical FUID rolls back and preserves the last good projection', () => {
  const db = tempDb();
  rebuildWorkProjection(db, sources(), { now: '2026-08-18T12:05:00.000Z', refreshFuid: '00000A' });
  const before = db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all();
  const duplicate = sources();
  duplicate[0].specs[0].tickets[1].fuid = '000002';
  assert.throws(
    () => rebuildWorkProjection(db, duplicate, { now: '2026-08-18T12:06:00.000Z', refreshFuid: '00000B' }),
    /duplicate FUID/i
  );
  assert.deepEqual(db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(), before);

  const invalid = sources();
  invalid[0].specs[0].tickets[0].fuid = '000000';
  assert.throws(
    () => rebuildWorkProjection(db, invalid, { now: '2026-08-18T12:07:00.000Z', refreshFuid: '00000C' }),
    /invalid FUID/i
  );
  assert.deepEqual(db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(), before);
  assert.deepEqual(
    db.prepare("SELECT fuid, outcome FROM work_projection_refreshes WHERE outcome = 'failed' ORDER BY rowid").all().map((row) => ({ ...row })),
    [{ fuid: '00000B', outcome: 'failed' }, { fuid: '00000C', outcome: 'failed' }]
  );
  db.close();
});

test('failed automatic refresh receives a FUID-bearing receipt without replacing the last good projection', () => {
  const db = tempDb();
  rebuildWorkProjection(db, sources(), { now: '2026-08-18T12:05:00.000Z', refreshFuid: '00000A' });
  const before = db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all();
  assert.throws(
    () => rebuildWorkProjection(db, null, { now: '2026-08-18T12:06:00.000Z' }),
    /must be an array/i
  );
  const receipt = db.prepare("SELECT fuid, outcome, error_detail FROM work_projection_refreshes WHERE outcome = 'failed'").get();
  assert.match(receipt.fuid, /^[0-9A-Z]{6}$/);
  assert.notEqual(receipt.fuid, '000000');
  assert.match(receipt.error_detail, /must be an array/i);
  assert.deepEqual(db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(), before);
  db.close();
});

test('validated Intent is idempotent, append-only, and never mutates projected status', () => {
  const db = tempDb();
  rebuildWorkProjection(db, sources(), { now: '2026-08-18T12:05:00.000Z', refreshFuid: '00000A' });
  const before = db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all();
  const request = {
    targetFuid: '000002',
    requestedStatus: 'in-progress',
    actor: 'Kayden',
    sourceRevision: 'a'.repeat(40),
    idempotencyKey: 'drag-000002-in-progress-1'
  };
  const created = createWorkIntent(db, request, { now: '2026-08-18T12:06:00.000Z' });
  assert.match(created.fuid, /^[0-9A-Z]{6}$/);
  assert.equal(created.targetFuid, '000002');
  assert.equal(created.fromStatus, 'ready');
  assert.equal(created.requestedStatus, 'in-progress');
  assert.equal(created.status, 'pending');
  assert.equal(created.pendingColumn, 'inProgress');
  assert.deepEqual(db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(), before);

  const replay = createWorkIntent(db, request, { now: '2026-08-18T12:07:00.000Z' });
  assert.equal(replay.fuid, created.fuid);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM intent_requests').get().count, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM intent_events').get().count, 1);
  assert.equal(listWorkIntents(db)[0].idempotencyKey, request.idempotencyKey);
  assert.throws(() => db.prepare("UPDATE intent_events SET event_type = 'changed'").run(), /append-only/i);
  assert.throws(() => db.prepare('DELETE FROM intent_events').run(), /append-only/i);

  assert.throws(() => createWorkIntent(db, { ...request, idempotencyKey: 'bad-revision', sourceRevision: 'b'.repeat(40) }), {
    status: 409,
    code: 'intent_source_stale'
  });
  assert.throws(() => createWorkIntent(db, { ...request, idempotencyKey: 'same-state', requestedStatus: 'ready' }), {
    status: 400,
    code: 'intent_transition_invalid'
  });
  assert.throws(() => createWorkIntent(db, { ...request, idempotencyKey: 'bad-target', targetFuid: 'ZZZZZZ' }), {
    status: 404,
    code: 'intent_target_missing'
  });
  assert.deepEqual(db.prepare('SELECT * FROM work_items_projection ORDER BY fuid').all(), before);
  db.close();
});
