export function resolveSpotifyAtlasUrl(configuredUrl = "", location = globalThis.location) {
  const trimmedUrl = String(configuredUrl || "").trim();
  if (trimmedUrl) return trimmedUrl;

  return `${location.protocol}//${location.hostname}:8899/dashboard.html`;
}
