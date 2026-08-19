import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { projectRoot, sha256, loadEnv, setEnvValue, getConfig, findGptOsRoot } from "../server/config.js";

function tmpFile(content = "") {
  const p = path.join(os.tmpdir(), `cic-cfg-${Math.random().toString(36).slice(2)}.env`);
  if (content) fs.writeFileSync(p, content);
  return p;
}

function preserveEnv(keys) {
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("sha256 produces a hex digest", () => {
  const hash = sha256("hello");
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]+$/);
});

test("sha256 is stable for the same input", () => {
  assert.equal(sha256("secret"), sha256("secret"));
});

test("sha256 differs for different inputs", () => {
  assert.notEqual(sha256("a"), sha256("b"));
});

test("loadEnv sets missing env vars from file", () => {
  const envFile = tmpFile("CIC_TEST_UNIQUE_1=hello\nCIC_TEST_UNIQUE_2=world\n");
  delete process.env.CIC_TEST_UNIQUE_1;
  delete process.env.CIC_TEST_UNIQUE_2;
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_1, "hello");
    assert.equal(process.env.CIC_TEST_UNIQUE_2, "world");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_1;
    delete process.env.CIC_TEST_UNIQUE_2;
    fs.unlinkSync(envFile);
  }
});

test("loadEnv does not overwrite existing env vars", () => {
  const envFile = tmpFile("CIC_TEST_UNIQUE_3=new_value\n");
  process.env.CIC_TEST_UNIQUE_3 = "original";
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_3, "original");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_3;
    fs.unlinkSync(envFile);
  }
});

test("loadEnv does not overwrite env vars explicitly set to empty", () => {
  const envFile = tmpFile("CIC_TEST_UNIQUE_EMPTY=file_value\n");
  process.env.CIC_TEST_UNIQUE_EMPTY = "";
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_EMPTY, "");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_EMPTY;
    fs.unlinkSync(envFile);
  }
});

test("loadEnv strips surrounding quotes from values", () => {
  const envFile = tmpFile('CIC_TEST_UNIQUE_4="quoted"\n');
  delete process.env.CIC_TEST_UNIQUE_4;
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_4, "quoted");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_4;
    fs.unlinkSync(envFile);
  }
});

test("loadEnv skips missing file without error", () => {
  assert.doesNotThrow(() => loadEnv("/nonexistent/.env.file"));
});

test("loadEnv skips comment lines and blank lines", () => {
  const envFile = tmpFile("# this is a comment\n\nCIC_TEST_UNIQUE_5=valid\n");
  delete process.env.CIC_TEST_UNIQUE_5;
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_5, "valid");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_5;
    fs.unlinkSync(envFile);
  }
});

test("loadEnv never imports the process-only CIC_RUNTIME_ROOT bootstrap", () => {
  const envFile = tmpFile("CIC_RUNTIME_ROOT=/tmp/dotenv-redirect\nCIC_TEST_BOOTSTRAP_SAFE=loaded\n");
  const isolatedEnv = {};

  try {
    loadEnv(envFile, isolatedEnv);
    assert.equal(isolatedEnv.CIC_RUNTIME_ROOT, undefined);
    assert.equal(isolatedEnv.CIC_TEST_BOOTSTRAP_SAFE, "loaded");
  } finally {
    fs.unlinkSync(envFile);
  }
});

test("setEnvValue creates a new file when none exists", () => {
  const p = path.join(os.tmpdir(), `cic-setenv-${Math.random().toString(36).slice(2)}.env`);
  try {
    setEnvValue("MY_KEY", "my_value", p);
    const content = fs.readFileSync(p, "utf8");
    assert.ok(content.includes("MY_KEY=my_value"));
  } finally {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

test("setEnvValue updates an existing key in place", () => {
  const p = tmpFile("FOO=old\nBAR=keep\n");
  try {
    setEnvValue("FOO", "new", p);
    const content = fs.readFileSync(p, "utf8");
    assert.ok(content.includes("FOO=new"));
    assert.ok(content.includes("BAR=keep"));
    assert.ok(!content.includes("FOO=old"));
  } finally {
    fs.unlinkSync(p);
  }
});

test("setEnvValue appends a new key when not found", () => {
  const p = tmpFile("EXISTING=1\n");
  try {
    setEnvValue("NEWKEY", "99", p);
    const content = fs.readFileSync(p, "utf8");
    assert.ok(content.includes("EXISTING=1"));
    assert.ok(content.includes("NEWKEY=99"));
  } finally {
    fs.unlinkSync(p);
  }
});

test("getConfig exposes spotifyRequestTimeoutMs from env", () => {
  const prev = process.env.SPOTIFY_REQUEST_TIMEOUT_MS;
  process.env.SPOTIFY_REQUEST_TIMEOUT_MS = "5000";
  try {
    const config = getConfig();
    assert.equal(config.spotifyRequestTimeoutMs, 5000);
  } finally {
    if (prev === undefined) delete process.env.SPOTIFY_REQUEST_TIMEOUT_MS;
    else process.env.SPOTIFY_REQUEST_TIMEOUT_MS = prev;
  }
});

test("getConfig defaults spotifyRequestTimeoutMs to 2500", () => {
  const prev = process.env.SPOTIFY_REQUEST_TIMEOUT_MS;
  delete process.env.SPOTIFY_REQUEST_TIMEOUT_MS;
  try {
    const config = getConfig();
    assert.equal(config.spotifyRequestTimeoutMs, 2500);
  } finally {
    if (prev !== undefined) process.env.SPOTIFY_REQUEST_TIMEOUT_MS = prev;
  }
});

test("getConfig keeps source-root topology when CIC_RUNTIME_ROOT is unset", () => {
  const keys = [
    "CIC_RUNTIME_ROOT",
    "CIC_DB",
    "CIC_DATA_FEED",
    "PLATFORM_HEALTH_REPORT",
    "CIC_HARNESS_REPORT",
    "CIC_HARNESS_REPORT_MAX_AGE_MINUTES",
    "CIC_SKILL_CATALOG_PATH",
    "CIC_SKILL_DEPLOYED_ROOT"
  ];
  const restore = preserveEnv(keys);
  for (const key of keys) delete process.env[key];

  try {
    const config = getConfig();
    assert.equal(config.dbPath, path.join(projectRoot, "data", "cic.sqlite"));
    assert.equal(config.dataFeedPath, path.join(projectRoot, "data.js"));
    // projectsRoot must resolve against the discovered GPT_OS root (the
    // ancestor holding Projects/INDEX.md), not "one directory up from
    // wherever this checkout physically sits". CIC moved from
    // Projects/Command Information Center to
    // Foundry/Modules/Command Information Center in S-007/TK-011; the old
    // one-level-up assumption silently broke the live portfolio endpoint
    // (it looked for Foundry/Modules/INDEX.md, which never existed) without
    // any test catching it, because this exact assertion encoded the same
    // wrong assumption. Fixed 2026-07-20/21.
    const gptOsRoot = findGptOsRoot(projectRoot);
    if (gptOsRoot) {
      assert.equal(config.projectsRoot, path.join(gptOsRoot, "Projects"));
      assert.equal(config.gptOsRoot, gptOsRoot);
    } else {
      // An isolated Git worktree can live outside GPT_OS; production installs
      // and producer checkouts discover the ancestor marker normally.
      assert.equal(config.projectsRoot, path.dirname(projectRoot));
      assert.equal(config.gptOsRoot, null);
    }
    assert.equal(
      config.platformHealthReport,
      gptOsRoot
        ? path.join(gptOsRoot, "Foundry", "Sockets", "Personal Intelligence Platform", ".local", "platform-health.json")
        : path.resolve(projectRoot, "../Personal Intelligence Platform/.local/platform-health.json")
    );
    assert.equal(config.harnessReportPath, path.join(projectRoot, "harness-flow.example.json"));
    assert.equal(config.harnessReportMaxAgeMinutes, 90);
    // S-022 TK-001: canonical skill catalog reads from the Forge (Workbench
    // Factory) checkout; the deployed copy reads from the discovered GPT_OS
    // root's .claude/skills/. Both derive from the same discovered root as
    // platformHealthReport above.
    assert.match(config.skillCatalogPath, /\.agents\/skills$/);
    assert.equal(config.skillDeployedRoot, config.skillCatalogPath);
  } finally {
    restore();
  }
});

test("findGptOsRoot walks up to the ancestor holding Projects/INDEX.md regardless of nesting depth", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-findroot-"));
  try {
    fs.mkdirSync(path.join(workspace, "Projects"), { recursive: true });
    fs.writeFileSync(path.join(workspace, "Projects", "INDEX.md"), "# Project Routing Index\n");
    const nested = path.join(workspace, "Foundry", "Modules", "Command Information Center");
    fs.mkdirSync(nested, { recursive: true });

    assert.equal(findGptOsRoot(nested), fs.realpathSync(workspace));
    assert.equal(findGptOsRoot(path.join(workspace, "Projects")), fs.realpathSync(workspace));
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("findGptOsRoot returns null when no ancestor holds Projects/INDEX.md within the search bound", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-findroot-miss-"));
  const nested = path.join(workspace, "a", "b", "c", "d", "e", "f", "g", "h", "i", "j");
  fs.mkdirSync(nested, { recursive: true });
  try {
    assert.equal(findGptOsRoot(nested), null);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("getConfig falls back to the pre-discovery topology when no GPT_OS root marker is found", () => {
  const restore = preserveEnv(["CIC_RUNTIME_ROOT", "PLATFORM_HEALTH_REPORT"]);
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-nodiscovery-runtime-root-"));
  const runtimeRoot = path.join(workspace, "Command Information Center");
  fs.mkdirSync(runtimeRoot);
  delete process.env.PLATFORM_HEALTH_REPORT;
  process.env.CIC_RUNTIME_ROOT = runtimeRoot;

  try {
    const config = getConfig();
    const canonicalRuntimeRoot = fs.realpathSync(runtimeRoot);
    assert.equal(config.projectsRoot, path.dirname(canonicalRuntimeRoot));
  } finally {
    restore();
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("getConfig anchors env and relative runtime paths to CIC_RUNTIME_ROOT", () => {
  const keys = [
    "CIC_RUNTIME_ROOT",
    "CIC_DB",
    "CIC_DATA_FEED",
    "PLATFORM_HEALTH_REPORT",
    "CIC_HARNESS_REPORT",
    "CIC_HARNESS_REPORT_MAX_AGE_MINUTES",
    "CIC_SKILL_CATALOG_PATH",
    "CIC_SKILL_DEPLOYED_ROOT",
    "CIC_PASSCODE",
    "CIC_PASSCODE_HASH",
    "CIC_TEST_RUNTIME_ENV"
  ];
  const restore = preserveEnv(keys);
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-runtime-root-"));
  const runtimeRoot = path.join(workspace, "Command Information Center");
  fs.mkdirSync(runtimeRoot);
  const passcode = "runtime-secret-must-not-surface";
  fs.writeFileSync(
    path.join(runtimeRoot, ".env"),
    [
      "CIC_DB=state/runtime.sqlite",
      "CIC_DATA_FEED=operator.js",
      "PLATFORM_HEALTH_REPORT=../Personal Intelligence Platform/.local/platform-health.json",
      "CIC_HARNESS_REPORT=.local/harness-flow-export.json",
      "CIC_HARNESS_REPORT_MAX_AGE_MINUTES=45",
      "CIC_SKILL_CATALOG_PATH=.local/skills-catalog/README.md",
      "CIC_SKILL_DEPLOYED_ROOT=.local/deployed-skills",
      `CIC_PASSCODE=${passcode}`,
      "CIC_TEST_RUNTIME_ENV=loaded-from-runtime-root",
      ""
    ].join("\n")
  );
  for (const key of keys) delete process.env[key];
  process.env.CIC_RUNTIME_ROOT = runtimeRoot;

  try {
    const config = getConfig();
    const canonicalRuntimeRoot = fs.realpathSync(runtimeRoot);
    const canonicalWorkspace = path.dirname(canonicalRuntimeRoot);
    assert.equal(config.dbPath, path.join(canonicalRuntimeRoot, "state", "runtime.sqlite"));
    assert.equal(config.dataFeedPath, path.join(canonicalRuntimeRoot, "operator.js"));
    assert.equal(config.projectsRoot, canonicalWorkspace);
    assert.equal(
      config.platformHealthReport,
      path.join(canonicalWorkspace, "Personal Intelligence Platform", ".local", "platform-health.json")
    );
    assert.equal(
      config.harnessReportPath,
      path.join(canonicalRuntimeRoot, ".local", "harness-flow-export.json")
    );
    assert.equal(config.harnessReportMaxAgeMinutes, 45);
    assert.equal(
      config.skillCatalogPath,
      path.join(canonicalRuntimeRoot, ".local", "skills-catalog", "README.md")
    );
    assert.equal(
      config.skillDeployedRoot,
      path.join(canonicalRuntimeRoot, ".local", "deployed-skills")
    );
    assert.equal(process.env.CIC_TEST_RUNTIME_ENV, "loaded-from-runtime-root");
    assert.equal(config.passcodeHash, sha256(passcode));
    assert.doesNotMatch(JSON.stringify(config), new RegExp(passcode));
  } finally {
    restore();
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("setEnvValue writes only to its explicit environment file", () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cic-set-runtime-root-"));
  const envFilePath = path.join(runtimeRoot, ".env");

  try {
    setEnvValue("CIC_TEST_RUNTIME_WRITE", "safe-value", envFilePath);
    assert.equal(fs.readFileSync(envFilePath, "utf8"), "CIC_TEST_RUNTIME_WRITE=safe-value\n");
    assert.throws(() => setEnvValue("CIC_TEST_RUNTIME_WRITE", "unsafe-value"), /explicit environment file path/);
  } finally {
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
});

test("config pins later env writes to the runtime root selected at startup", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-pinned-runtime-root-"));
  const selectedRoot = path.join(workspace, "selected");
  const redirectRoot = path.join(workspace, "redirect");
  fs.mkdirSync(selectedRoot);
  fs.mkdirSync(redirectRoot);
  const isolatedEnv = { CIC_RUNTIME_ROOT: selectedRoot };

  try {
    const config = getConfig(isolatedEnv);
    isolatedEnv.CIC_RUNTIME_ROOT = redirectRoot;
    setEnvValue("CIC_TEST_PINNED_WRITE", "safe-value", config.envFilePath);
    assert.equal(fs.readFileSync(path.join(selectedRoot, ".env"), "utf8"), "CIC_TEST_PINNED_WRITE=safe-value\n");
    assert.equal(fs.existsSync(path.join(redirectRoot, ".env")), false);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("CIC_RUNTIME_ROOT canonicalizes symlinks before deriving sibling topology", () => {
  const restore = preserveEnv(["CIC_RUNTIME_ROOT", "PLATFORM_HEALTH_REPORT"]);
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cic-real-runtime-root-"));
  const realProjectsRoot = path.join(workspace, "Projects");
  const realRuntimeRoot = path.join(realProjectsRoot, "Command Information Center");
  const aliasParent = path.join(workspace, "Aliases");
  const aliasRoot = path.join(aliasParent, "cic");
  fs.mkdirSync(realRuntimeRoot, { recursive: true });
  fs.mkdirSync(aliasParent);
  fs.symlinkSync(realRuntimeRoot, aliasRoot, "dir");
  process.env.CIC_RUNTIME_ROOT = aliasRoot;
  delete process.env.PLATFORM_HEALTH_REPORT;

  try {
    const config = getConfig();
    const canonicalRuntimeRoot = fs.realpathSync(realRuntimeRoot);
    const canonicalProjectsRoot = path.dirname(canonicalRuntimeRoot);
    assert.equal(config.runtimeRoot, canonicalRuntimeRoot);
    assert.equal(config.projectsRoot, canonicalProjectsRoot);
    assert.equal(
      config.platformHealthReport,
      path.join(canonicalProjectsRoot, "Personal Intelligence Platform", ".local", "platform-health.json")
    );
  } finally {
    restore();
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

test("CIC_RUNTIME_ROOT rejects invalid paths without echoing their values", () => {
  const restore = preserveEnv(["CIC_RUNTIME_ROOT"]);
  const invalidFile = tmpFile();
  fs.writeFileSync(invalidFile, "not a directory\n");

  try {
    for (const invalidRoot of ["relative/secret-value", path.join(os.tmpdir(), "missing-secret-value"), invalidFile]) {
      process.env.CIC_RUNTIME_ROOT = invalidRoot;
      assert.throws(
        () => getConfig(),
        (error) => {
          assert.match(error.message, /CIC_RUNTIME_ROOT must be an absolute existing directory/);
          assert.doesNotMatch(error.message, /secret-value/);
          return true;
        }
      );
    }
  } finally {
    restore();
    fs.unlinkSync(invalidFile);
  }
});
