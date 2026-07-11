import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sha256, loadEnv, setEnvValue, getConfig } from "../server/config.js";

function tmpFile(content = "") {
  const p = path.join(os.tmpdir(), `cic-cfg-${Math.random().toString(36).slice(2)}.env`);
  if (content) fs.writeFileSync(p, content);
  return p;
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

test("loadEnv treats an explicitly empty env var as set so tests can neutralize credentials", () => {
  const envFile = tmpFile("CIC_TEST_UNIQUE_4=leaked_secret\n");
  process.env.CIC_TEST_UNIQUE_4 = "";
  try {
    loadEnv(envFile);
    assert.equal(process.env.CIC_TEST_UNIQUE_4, "");
  } finally {
    delete process.env.CIC_TEST_UNIQUE_4;
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
