import test from "node:test";
import assert from "node:assert/strict";
import { filterTasks, groupTasksByStatus } from "../src/taskViews.js";

const tasks = [
  { id: "1", title: "Review launch", notes: "Check logs", source: "github", priority: "P2", status: "Today", createdAt: "2026-07-10T10:00:00Z" },
  { id: "2", title: "Pay invoice", notes: "", source: "gmail", priority: "P1", status: "Today", createdAt: "2026-07-10T11:00:00Z" },
  { id: "3", title: "Write notes", notes: "Launch recap", source: "manual", priority: "P3", status: "Next", createdAt: "2026-07-10T12:00:00Z" }
];

test("filterTasks searches task content and metadata case-insensitively", () => {
  assert.deepEqual(filterTasks(tasks, "LAUNCH").map((task) => task.id), ["1", "3"]);
  assert.deepEqual(filterTasks(tasks, "gmail").map((task) => task.id), ["2"]);
  assert.equal(filterTasks(tasks, "missing").length, 0);
});

test("groupTasksByStatus groups and priority-sorts list and board data", () => {
  const grouped = groupTasksByStatus(tasks, ["Today", "Next"]);
  assert.deepEqual(grouped.Today.map((task) => task.id), ["2", "1"]);
  assert.deepEqual(grouped.Next.map((task) => task.id), ["3"]);
});
