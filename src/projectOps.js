function normalizeToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function acronymOf(name) {
  const words = String(name || "").split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return words.length >= 3 ? words.map((word) => word[0]).join("").toLowerCase() : "";
}

function candidateTokens(name, slug) {
  return [normalizeToken(name), normalizeToken(slug), acronymOf(name)]
    .filter((token, index, tokens) => token.length >= 3 && tokens.indexOf(token) === index);
}

export function matchVercelProject(vercelProjects, name, slug) {
  const candidates = candidateTokens(name, slug);
  return (vercelProjects || []).find((deploy) => {
    const deployName = normalizeToken(deploy.name);
    if (deployName.length < 3) return false;
    return candidates.some((token) => deployName.includes(token) || token.includes(deployName));
  }) || null;
}

export function matchGithubPrs(prs, { repo, name, slug } = {}) {
  const repoToken = normalizeToken(repo);
  const candidates = candidateTokens(name, slug);
  return (prs || []).filter((pr) => {
    const prRepo = normalizeToken(pr.repo);
    if (repoToken && prRepo === repoToken) return true;
    const prTail = normalizeToken(String(pr.repo || "").split("/").pop());
    if (prTail.length < 3) return false;
    return candidates.some((token) => prTail.includes(token) || token.includes(prTail));
  });
}

export function nextStatusFilter(current, clicked) {
  if (!clicked || clicked === "all") return "all";
  return current === clicked ? "all" : clicked;
}
