import crypto from "node:crypto";

const SHA256_HEX = /^[a-f0-9]{64}$/;

export function isValidPasscodeHash(passcodeHash) {
  return SHA256_HEX.test(passcodeHash || "");
}

export function verifyStepUpPasscode(passcodeHash, passcode) {
  const configured = isValidPasscodeHash(passcodeHash);
  const boundedPasscode = typeof passcode === "string" && passcode.length <= 1024
    ? passcode
    : "";
  const actual = crypto.createHash("sha256").update(boundedPasscode).digest();
  const expected = configured
    ? Buffer.from(passcodeHash, "hex")
    : Buffer.alloc(actual.length);
  const matches = crypto.timingSafeEqual(actual, expected);
  return configured && typeof passcode === "string" && passcode.length <= 1024 && matches;
}

export function createApprovalThrottle(options = {}) {
  const maxFailures = options.maxFailures || 5;
  const windowMs = options.windowMs || 5 * 60 * 1000;
  const maxKeys = options.maxKeys || 1_000;
  const now = options.now || Date.now;
  const entries = new Map();

  function prune(currentTime) {
    for (const [key, entry] of entries) {
      if (currentTime - entry.windowStartedAt >= windowMs) entries.delete(key);
    }
  }

  function makeRoom() {
    while (entries.size >= maxKeys) {
      entries.delete(entries.keys().next().value);
    }
  }

  return {
    check(key) {
      const currentTime = now();
      prune(currentTime);
      const entry = entries.get(key);
      if (!entry || entry.failures < maxFailures) {
        return { allowed: true, retryAfterSeconds: 0 };
      }
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(
          (windowMs - (currentTime - entry.windowStartedAt)) / 1000
        ))
      };
    },
    recordFailure(key) {
      const currentTime = now();
      prune(currentTime);
      const entry = entries.get(key);
      if (entry) {
        entry.failures += 1;
        return;
      }
      makeRoom();
      entries.set(key, { failures: 1, windowStartedAt: currentTime });
    },
    reset(key) {
      entries.delete(key);
    },
    size() {
      prune(now());
      return entries.size;
    }
  };
}
