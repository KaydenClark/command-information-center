import test from "node:test";
import assert from "node:assert/strict";
import {
  SPOTIFY_CONTROL_SCOPES,
  buildSpotifyAuthorizeUrl,
  controlSpotify,
  getSpotifyPlayer
} from "../server/spotify.js";

function createJsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

test("Spotify authorize URL requests playback control scopes", () => {
  const url = new URL(buildSpotifyAuthorizeUrl({
    spotifyClientId: "client-id",
    spotifyRedirectUri: "http://127.0.0.1:8787/auth/spotify/callback"
  }, "state-value"));

  assert.equal(url.origin + url.pathname, "https://accounts.spotify.com/authorize");
  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("redirect_uri"), "http://127.0.0.1:8787/auth/spotify/callback");
  assert.equal(url.searchParams.get("state"), "state-value");
  assert.deepEqual(url.searchParams.get("scope").split(" "), SPOTIFY_CONTROL_SCOPES);
});

test("Spotify player refreshes token before reading playback state", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET", body: String(options.body || "") });
    if (String(url).includes("/api/token")) {
      return createJsonResponse({ access_token: "fresh-token", expires_in: 3600, token_type: "Bearer" });
    }
    assert.equal(options.headers.Authorization, "Bearer fresh-token");
    return createJsonResponse({
      is_playing: true,
      progress_ms: 100,
      device: { is_active: true, name: "Demo Device" },
      item: {
        name: "Song",
        duration_ms: 200,
        artists: [{ name: "Artist" }],
        album: { images: [{ url: "https://example.com/art.jpg" }] }
      }
    });
  };

  try {
    const result = await getSpotifyPlayer({
      spotifyClientId: "client-id",
      spotifyClientSecret: "client-secret",
      spotifyRedirectUri: "http://127.0.0.1:8787/auth/spotify/callback",
      spotifyRefreshToken: "refresh-token"
    });
    assert.equal(result.ok, true);
    assert.equal(result.player.track, "Song");
    assert.equal(calls[0].method, "POST");
    assert.match(calls[0].body, /grant_type=refresh_token/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Spotify skip controls use POST and refreshed user token", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET", headers: options.headers || {} });
    if (String(url).includes("/api/token")) {
      return createJsonResponse({ access_token: "fresh-token", expires_in: 3600, token_type: "Bearer" });
    }
    assert.equal(String(url), "https://api.spotify.com/v1/me/player/next");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer fresh-token");
    return new Response(null, { status: 204 });
  };

  try {
    const result = await controlSpotify({
      spotifyClientId: "client-id",
      spotifyClientSecret: "client-secret",
      spotifyRedirectUri: "http://127.0.0.1:8787/auth/spotify/callback",
      spotifyRefreshToken: "refresh-token"
    }, "next");
    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Spotify player degrades instead of waiting on slow playback API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes("/api/token")) {
      return createJsonResponse({ access_token: "fresh-token", expires_in: 3600, token_type: "Bearer" });
    }
    return new Promise((resolve, reject) => {
      options.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    });
  };

  try {
    const startedAt = Date.now();
    const result = await getSpotifyPlayer({
      spotifyClientId: "client-id",
      spotifyClientSecret: "client-secret",
      spotifyRedirectUri: "http://127.0.0.1:8787/auth/spotify/callback",
      spotifyRefreshToken: "refresh-token",
      spotifyRequestTimeoutMs: 20
    });
    assert.equal(result.ok, false);
    assert.match(result.detail, /timed out/i);
    assert.ok(Date.now() - startedAt < 500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
