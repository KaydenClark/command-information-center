const PLAYER_URL = "https://api.spotify.com/v1/me/player";
const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const TOKEN_REFRESH_SKEW_MS = 60_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 2_500;

export const SPOTIFY_CONTROL_SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-modify-playback-state"
];

function hasOAuthConfig(config) {
  return Boolean(config.spotifyClientId && config.spotifyClientSecret && config.spotifyRedirectUri);
}

function authHeader(config) {
  return `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString("base64")}`;
}

function degraded(config, detail, { authRequired = false } = {}) {
  const canAuthorize = Boolean(config?.spotifyClientId && config?.spotifyRedirectUri);
  return {
    ok: false,
    degraded: true,
    detail,
    authUrl: authRequired && canAuthorize ? "/auth/spotify/login" : null,
    player: {
      active: false,
      track: null,
      artist: null,
      albumArt: null,
      isPlaying: false,
      device: null,
      progressMs: 0,
      durationMs: 0
    }
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function buildSpotifyAuthorizeUrl(config, state) {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.spotifyClientId);
  url.searchParams.set("scope", SPOTIFY_CONTROL_SCOPES.join(" "));
  url.searchParams.set("redirect_uri", config.spotifyRedirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

async function requestToken(config, body) {
  if (!hasOAuthConfig(config)) {
    throw Object.assign(new Error("Spotify client ID, client secret, and redirect URI are required."), { status: 503 });
  }

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader(config),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  }, config.spotifyRequestTimeoutMs);
  if (!response.ok) {
    throw Object.assign(new Error(`Spotify token endpoint returned ${response.status}.`), { status: response.status });
  }
  return response.json();
}

export async function exchangeSpotifyCode(config, code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.spotifyRedirectUri
  });
  const token = await requestToken(config, body);
  config.spotifyAccessToken = token.access_token || "";
  config.spotifyAccessTokenExpiresAt = Date.now() + Number(token.expires_in || 3600) * 1000;
  if (token.refresh_token) config.spotifyRefreshToken = token.refresh_token;
  return token;
}

async function refreshSpotifyAccessToken(config) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: config.spotifyRefreshToken
  });
  const token = await requestToken(config, body);
  config.spotifyAccessToken = token.access_token || "";
  config.spotifyAccessTokenExpiresAt = Date.now() + Number(token.expires_in || 3600) * 1000;
  if (token.refresh_token) config.spotifyRefreshToken = token.refresh_token;
  return config.spotifyAccessToken;
}

async function getAccessToken(config) {
  if (config.spotifyAccessToken && (!config.spotifyAccessTokenExpiresAt || config.spotifyAccessTokenExpiresAt - Date.now() > TOKEN_REFRESH_SKEW_MS)) {
    return config.spotifyAccessToken;
  }
  if (config.spotifyRefreshToken) return refreshSpotifyAccessToken(config);
  return config.spotifyAccessToken || "";
}

export async function getSpotifyPlayer(config) {
  let accessToken;
  try {
    accessToken = await getAccessToken(config);
  } catch (error) {
    if (error.name === "AbortError") return degraded(config, "Spotify API timed out while refreshing authorization.");
    return degraded(config, error.message);
  }
  if (!accessToken) {
    return degraded(config, "Spotify authorization is not configured. Connect Spotify once to enable playback controls.", { authRequired: true });
  }

  let response;
  try {
    response = await fetchWithTimeout(PLAYER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }, config.spotifyRequestTimeoutMs);
  } catch (error) {
    if (error.name === "AbortError") return degraded(config, "Spotify API timed out while reading playback state.");
    return degraded(config, error.message);
  }
  if (response.status === 204) return degraded(config, "No active Spotify device.");
  if (!response.ok) return degraded(config, `Spotify API returned ${response.status}.`);

  const data = await response.json();
  const item = data.item || {};
  return {
    ok: true,
    degraded: false,
    detail: data.device?.is_active ? "Spotify player online." : "No active Spotify device.",
    player: {
      active: Boolean(data.device?.is_active),
      track: item.name || null,
      artist: (item.artists || []).map((artist) => artist.name).join(", ") || null,
      albumArt: item.album?.images?.[0]?.url || null,
      isPlaying: Boolean(data.is_playing),
      device: data.device?.name || null,
      progressMs: data.progress_ms || 0,
      durationMs: item.duration_ms || 0
    }
  };
}

export async function controlSpotify(config, action) {
  if (!["play", "pause", "next", "previous"].includes(action)) {
    throw Object.assign(new Error("Unsupported Spotify control action."), { status: 400 });
  }
  let accessToken;
  try {
    accessToken = await getAccessToken(config);
  } catch (error) {
    const status = error.name === "AbortError" ? 504 : error.status || 503;
    throw Object.assign(new Error(error.name === "AbortError" ? "Spotify API timed out while refreshing authorization." : error.message), { status });
  }
  if (!accessToken) {
    throw Object.assign(new Error("Connect Spotify before using playback controls."), { status: 503 });
  }

  const endpoint = `${PLAYER_URL}/${action}`;
  const method = action === "next" || action === "previous" ? "POST" : "PUT";
  let response;
  try {
    response = await fetchWithTimeout(endpoint, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` }
    }, config.spotifyRequestTimeoutMs);
  } catch (error) {
    const status = error.name === "AbortError" ? 504 : error.status || 503;
    throw Object.assign(new Error(error.name === "AbortError" ? "Spotify API timed out while sending playback control." : error.message), { status });
  }
  if (response.status === 404) {
    throw Object.assign(new Error("No active Spotify device."), { status: 409 });
  }
  if (!response.ok && response.status !== 204) {
    throw Object.assign(new Error(`Spotify API returned ${response.status}.`), { status: response.status });
  }
  return { ok: true };
}
