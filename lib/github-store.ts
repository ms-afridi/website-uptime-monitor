import type { Store } from "./types";

const API = "https://api.github.com";

function config() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = process.env.GITHUB_FILE_PATH || "data/websites.json";
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) {
    throw new Error("GitHub storage is not configured. Add GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN.");
  }
  return { owner, repo, branch, path, token };
}

async function githubRequest(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config().token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${body.slice(0, 300)}`);
  }
  return response;
}

export async function readStore(): Promise<{ store: Store; sha: string }> {
  const c = config();
  const url = `${API}/repos/${c.owner}/${c.repo}/contents/${c.path}?ref=${encodeURIComponent(c.branch)}`;
  const response = await githubRequest(url, { method: "GET" });
  const file = await response.json() as { content?: string; sha: string };
  if (!file.content) return { store: { websites: [] }, sha: file.sha };
  const decoded = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as Store;
  if (!parsed || !Array.isArray(parsed.websites)) {
    throw new Error("The GitHub JSON file must contain a websites array.");
  }
  return { store: parsed, sha: file.sha };
}

export async function writeStore(store: Store, sha: string, message: string) {
  const c = config();
  const content = Buffer.from(JSON.stringify(store, null, 2) + "\n", "utf8").toString("base64");
  const url = `${API}/repos/${c.owner}/${c.repo}/contents/${c.path}`;
  return githubRequest(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch: c.branch
    })
  });
}
