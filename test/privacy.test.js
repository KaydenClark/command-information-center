import test from "node:test";
import assert from "node:assert/strict";
import { hasPrivacySensitiveContent, privacyClass } from "../src/privacy.js";

test("privacy classifier hides explicit financial content", () => {
  assert.equal(hasPrivacySensitiveContent({ title: "Brokerage statement", money: true }), true);
  assert.equal(privacyClass({ label: "Bank account reconnect", money: true }), "privacy-sensitive");
});

test("privacy classifier hides purchases and owned-device clues", () => {
  assert.equal(hasPrivacySensitiveContent("Ordered: protective case for a new device"), true);
  assert.equal(hasPrivacySensitiveContent("Delivered: new device package"), true);
  assert.equal(hasPrivacySensitiveContent("Receipt for your recent purchase"), true);
});

test("privacy classifier hides medical and appointment content", () => {
  assert.equal(hasPrivacySensitiveContent("Doctor appointment at the clinic"), true);
  assert.equal(hasPrivacySensitiveContent("Prescription refill from pharmacy"), true);
});

test("privacy classifier leaves ordinary operations content visible", () => {
  assert.equal(hasPrivacySensitiveContent("Merge dependency-security PRs and verify the Vercel build"), false);
});
