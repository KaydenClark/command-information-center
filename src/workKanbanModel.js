export const WORK_COLUMNS = [
  { id: 'backlog', label: 'Backlog', status: 'deferred' },
  { id: 'todo', label: 'To Do', status: 'ready' },
  { id: 'inProgress', label: 'In Progress', status: 'in-progress' },
  { id: 'blocked', label: 'Blocked', status: 'blocked' },
  { id: 'complete', label: 'Complete', status: 'done' }
];

export function statusForColumn(columnId) {
  return WORK_COLUMNS.find((column) => column.id === columnId)?.status ?? null;
}

export function labelForColumn(columnId) {
  return WORK_COLUMNS.find((column) => column.id === columnId)?.label ?? 'Unknown';
}

export function buildWorkKanban(projection, { query = '', projectId = 'all' } = {}) {
  const needle = String(query).trim().toLowerCase();
  const board = Object.fromEntries(WORK_COLUMNS.map((column) => [column.id, { ...column, count: 0, specs: [] }]));
  for (const spec of projection?.specs || []) {
    if (projectId !== 'all' && spec.sourceKey !== projectId) continue;
    for (const column of WORK_COLUMNS) {
      const tickets = (spec.tickets || []).filter((ticket) => {
        if (ticket.column !== column.id) return false;
        if (!needle) return true;
        const pendingLabel = labelForColumn(ticket.pendingIntent?.pendingColumn);
        return [
          spec.fuid, spec.alias, spec.title, spec.created, spec.lastWorked,
          ticket.fuid, ticket.alias, ticket.title, ticket.status,
          ticket.created, ticket.lastWorked, ticket.blockers,
          ticket.pendingIntent?.requestedStatus, pendingLabel
        ].some((value) => String(value || '').toLowerCase().includes(needle));
      });
      if (!tickets.length) continue;
      board[column.id].specs.push({ ...spec, tickets });
      board[column.id].count += tickets.length;
    }
  }
  return board;
}
