const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2 };

export function filterTasks(tasks, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return tasks;
  return tasks.filter((task) => [task.title, task.notes, task.source, task.priority, task.status]
    .some((value) => String(value || "").toLowerCase().includes(needle)));
}

export function groupTasksByStatus(tasks, columns) {
  const grouped = Object.fromEntries(columns.map((column) => [column, []]));
  for (const task of tasks) grouped[task.status]?.push(task);
  for (const column of columns) {
    grouped[column].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
      || String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  return grouped;
}
