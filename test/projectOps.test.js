import test from "node:test";
import assert from "node:assert/strict";
import { matchGithubPrs, matchVercelProject, nextStatusFilter } from "../src/projectOps.js";

const DEPLOYS = [
  { name: "cic-dashboard", state: "READY" },
  { name: "dungeon-friends-game", state: "READY" },
  { name: "little-local-world", state: "ERROR" }
];

test("vercel matching links a project to its deploy by name, slug, or acronym", () => {
  assert.equal(matchVercelProject(DEPLOYS, "Dungeon_Friends_Game", "dungeon-friends-game")?.name, "dungeon-friends-game");
  assert.equal(matchVercelProject(DEPLOYS, "Little_Local_World", "little-local-world")?.name, "little-local-world");
  assert.equal(matchVercelProject(DEPLOYS, "Command Information Center", "command-information-center")?.name, "cic-dashboard");
  assert.equal(matchVercelProject(DEPLOYS, "OpenBrain", "openbrain"), null);
  assert.equal(matchVercelProject(undefined, "OpenBrain", "openbrain"), null);
});

test("github pr matching prefers the exact remote repo and falls back to name similarity", () => {
  const prs = [
    { repo: "KaydenClark/CIC_Dashboard", number: 4 },
    { repo: "KaydenClark/eredent", number: 9 },
    { repo: "example/widgets", number: 14 }
  ];
  const byRemote = matchGithubPrs(prs, { repo: "KaydenClark/CIC_Dashboard", name: "Command Information Center", slug: "command-information-center" });
  assert.deepEqual(byRemote.map((pr) => pr.number), [4]);
  const byName = matchGithubPrs(prs, { name: "eredent", slug: "eredent" });
  assert.deepEqual(byName.map((pr) => pr.number), [9]);
  assert.deepEqual(matchGithubPrs(prs, { name: "OpenBrain", slug: "openbrain" }), []);
  assert.deepEqual(matchGithubPrs(undefined, { name: "OpenBrain" }), []);
});

test("status chip clicks toggle a single filter and Total always resets", () => {
  assert.equal(nextStatusFilter("all", "ready"), "ready");
  assert.equal(nextStatusFilter("ready", "ready"), "all");
  assert.equal(nextStatusFilter("ready", "blocked"), "blocked");
  assert.equal(nextStatusFilter("blocked", "all"), "all");
  assert.equal(nextStatusFilter("all", "all"), "all");
});
