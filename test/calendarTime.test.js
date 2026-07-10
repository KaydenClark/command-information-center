import test from "node:test";
import assert from "node:assert/strict";
import { calendarEventTime } from "../src/calendarTime.js";

test("calendarEventTime supports current start/end feeds and legacy when values", () => {
  assert.equal(calendarEventTime({ start: "2026-07-10 09:00", end: "2026-07-10 09:30" }), "2026-07-10 09:00 – 2026-07-10 09:30");
  assert.equal(calendarEventTime({ when: "Today 9:00 AM", start: "ignored" }), "Today 9:00 AM");
  assert.equal(calendarEventTime({}), "Time unavailable");
});
