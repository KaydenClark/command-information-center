import test from "node:test";
import assert from "node:assert/strict";
import { hasPrivacySensitiveContent, privacyClass } from "../src/privacy.js";

test("privacy classifier hides explicit financial content", () => {
  assert.equal(hasPrivacySensitiveContent({ title: "Robinhood statement", money: true }), true);
  assert.equal(privacyClass({ label: "RocketMoney reconnect", money: true }), "privacy-sensitive");
});

test("privacy classifier hides purchases and owned-device clues", () => {
  assert.equal(hasPrivacySensitiveContent("Ordered: JETech Case for Samsung Galaxy Tab"), true);
  assert.equal(hasPrivacySensitiveContent("New sign-in on Galaxy Tab S10+"), true);
  assert.equal(hasPrivacySensitiveContent("Changes to purchase verification settings on Google Play"), true);
});

test("privacy classifier hides medical and appointment content", () => {
  assert.equal(hasPrivacySensitiveContent("Doctor appointment at the clinic"), true);
  assert.equal(hasPrivacySensitiveContent("Prescription refill from pharmacy"), true);
});

test("privacy classifier leaves ordinary operations content visible", () => {
  assert.equal(hasPrivacySensitiveContent("Merge dependency-security PRs and verify the Vercel build"), false);
});
