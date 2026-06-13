import test from "node:test";
import assert from "node:assert/strict";
import {
  SPOTIFY_SAFETY_RECONCILE_MS,
  SPOTIFY_TRACK_END_PADDING_MS,
  estimateSpotifyProgressMs,
  getSpotifyRefreshDelayMs,
  stampSpotifyState
} from "../src/spotifyTiming.js";

test("Spotify timing estimates progress locally while playback is active", () => {
  const progress = estimateSpotifyProgressMs({
    active: true,
    isPlaying: true,
    progressMs: 10_000,
    durationMs: 30_000
  }, 1_000, 4_500);

  assert.equal(progress, 13_500);
});

test("Spotify timing schedules refresh just after expected track end", () => {
  const delay = getSpotifyRefreshDelayMs({
    ok: true,
    receivedAt: 1_000,
    player: {
      active: true,
      isPlaying: true,
      progressMs: 10_000,
      durationMs: 16_000
    }
  }, 4_000);

  assert.equal(delay, 3_000 + SPOTIFY_TRACK_END_PADDING_MS);
});

test("Spotify timing uses gentle reconciliation when track end is far away", () => {
  const delay = getSpotifyRefreshDelayMs({
    ok: true,
    receivedAt: 1_000,
    player: {
      active: true,
      isPlaying: true,
      progressMs: 10_000,
      durationMs: 180_000
    }
  }, 4_000);

  assert.equal(delay, SPOTIFY_SAFETY_RECONCILE_MS);
});

test("Spotify timing stamps state without mutating the original response", () => {
  const original = { ok: true, player: { active: false } };
  const stamped = stampSpotifyState(original, 123);

  assert.equal(stamped.receivedAt, 123);
  assert.equal(original.receivedAt, undefined);
});
