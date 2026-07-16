import test from "node:test";
import assert from "node:assert/strict";
import { sha256 } from "../server/config.js";
import { createApprovalThrottle, isValidPasscodeHash, verifyStepUpPasscode } from "../server/workbenchApproval.js";

test("verifyStepUpPasscode accepts only a timing-safe match against a valid configured hash", () => {
  const configuredHash = sha256("correct horse battery staple");
  assert.equal(isValidPasscodeHash(configuredHash), true);
  assert.equal(verifyStepUpPasscode(configuredHash, "correct horse battery staple"), true);
  assert.equal(verifyStepUpPasscode(configuredHash, "wrong"), false);
  assert.equal(isValidPasscodeHash("not-a-sha256-hash"), false);
  assert.equal(verifyStepUpPasscode("not-a-sha256-hash", "anything"), false);
  assert.equal(verifyStepUpPasscode("", ""), false);
});

test("approval throttle blocks after bounded failures and expires without unbounded keys", () => {
  let now = 1_000;
  const throttle = createApprovalThrottle({
    maxFailures: 2,
    windowMs: 10_000,
    maxKeys: 2,
    now: () => now
  });

  assert.deepEqual(throttle.check("session-a"), { allowed: true, retryAfterSeconds: 0 });
  throttle.recordFailure("session-a");
  assert.deepEqual(throttle.check("session-a"), { allowed: true, retryAfterSeconds: 0 });
  throttle.recordFailure("session-a");
  assert.deepEqual(throttle.check("session-a"), { allowed: false, retryAfterSeconds: 10 });

  throttle.recordFailure("session-b");
  throttle.recordFailure("session-c");
  assert.ok(throttle.size() <= 2);

  now += 10_001;
  assert.deepEqual(throttle.check("session-a"), { allowed: true, retryAfterSeconds: 0 });
  throttle.recordFailure("session-a");
  throttle.reset("session-a");
  assert.deepEqual(throttle.check("session-a"), { allowed: true, retryAfterSeconds: 0 });
});
