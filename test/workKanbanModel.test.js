import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkKanban, WORK_COLUMNS, statusForColumn } from '../src/workKanbanModel.js';

const projection = {
  specs: [{
    fuid: '000001', sourceKey: 'P-001', alias: 'P-001/S-001', title: 'Alpha capability',
    created: '2026-08-10', lastWorked: '2026-08-18',
    tickets: [{
      fuid: '000002', alias: 'P-001/S-001/TK-001', title: 'Ship alpha', status: 'ready',
      column: 'todo', created: '2026-08-10', lastWorked: '2026-08-18', sourceRevision: 'a'.repeat(40), pendingIntent: null
    }, {
      fuid: '000003', alias: 'P-001/S-001/TK-002', title: 'Archive proof', status: 'done',
      column: 'complete', created: '2026-08-10', lastWorked: '2026-08-17', sourceRevision: 'a'.repeat(40),
      pendingIntent: { fuid: '00000A', requestedStatus: 'in-progress', pendingColumn: 'inProgress', status: 'pending' }
    }]
  }]
};

test('work kanban exposes exactly five columns and groups tickets under their Spec', () => {
  assert.deepEqual(WORK_COLUMNS.map((column) => column.label), ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Complete']);
  const board = buildWorkKanban(projection);
  assert.equal(board.todo.specs[0].fuid, '000001');
  assert.equal(board.todo.specs[0].tickets[0].fuid, '000002');
  assert.equal(board.complete.specs[0].tickets[0].pendingIntent.pendingColumn, 'inProgress');
  assert.equal(statusForColumn('inProgress'), 'in-progress');
});

test('work kanban search matches FUID, typed alias, title, and lifecycle dates without moving pending cards', () => {
  assert.equal(buildWorkKanban(projection, { query: '000002' }).todo.count, 1);
  assert.equal(buildWorkKanban(projection, { query: 'tk-002' }).complete.count, 1);
  assert.equal(buildWorkKanban(projection, { query: 'archive' }).complete.count, 1);
  assert.equal(buildWorkKanban(projection, { query: '2026-08-17' }).complete.count, 1);
  const pending = buildWorkKanban(projection, { query: 'in progress' });
  assert.equal(pending.complete.count, 1, 'pending Intent stays in the canonical Complete column');
  assert.equal(pending.inProgress.count, 0);
});
