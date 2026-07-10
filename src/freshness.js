export function formatFreshnessAge(timestamp, now = Date.now()) {
  if (!timestamp) return "Never updated";
  const ageMs = Math.max(0, now - new Date(timestamp).getTime());
  if (!Number.isFinite(ageMs)) return "Unknown age";
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}
