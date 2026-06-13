export const SPOTIFY_PROGRESS_TICK_MS = 1_000;
export const SPOTIFY_SAFETY_RECONCILE_MS = 15_000;
export const SPOTIFY_TRACK_END_PADDING_MS = 900;
export const SPOTIFY_MIN_REFRESH_MS = 900;
export const SPOTIFY_CONTROL_FOLLOW_UP_DELAYS_MS = [900, 2_200];

export function stampSpotifyState(spotify, receivedAt = Date.now()) {
  return spotify ? { ...spotify, receivedAt } : spotify;
}

export function estimateSpotifyProgressMs(player, receivedAt, now = Date.now()) {
  if (!player?.active) return 0;
  const progressMs = Math.max(0, Number(player.progressMs || 0));
  const durationMs = Math.max(0, Number(player.durationMs || 0));
  if (!player.isPlaying || !receivedAt) return durationMs ? Math.min(progressMs, durationMs) : progressMs;

  const elapsedMs = Math.max(0, now - receivedAt);
  const estimatedMs = progressMs + elapsedMs;
  return durationMs ? Math.min(estimatedMs, durationMs) : estimatedMs;
}

export function getSpotifyRefreshDelayMs(spotify, now = Date.now()) {
  const player = spotify?.player;
  if (!spotify?.ok || !player?.active || !player.isPlaying || !player.durationMs) {
    return SPOTIFY_SAFETY_RECONCILE_MS;
  }

  const estimatedProgressMs = estimateSpotifyProgressMs(player, spotify.receivedAt, now);
  const remainingMs = Math.max(0, player.durationMs - estimatedProgressMs);
  const trackBoundaryMs = remainingMs + SPOTIFY_TRACK_END_PADDING_MS;
  return Math.max(SPOTIFY_MIN_REFRESH_MS, Math.min(SPOTIFY_SAFETY_RECONCILE_MS, trackBoundaryMs));
}
