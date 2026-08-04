/*
 * Derive a rig's GitHub web URL (https://github.com/<owner>/<repo>) from its
 * checkout's `origin` remote, so the frontend can link commits/PRs. Read-only;
 * returns null on any failure (missing rig/dir, no remote, non-GitHub remote).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

function expandHome(p) {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

/**
 * Normalize a git remote URL to a GitHub web URL, or null if it isn't GitHub.
 * Pure — exported for tests.
 *   git@github.com:owner/repo.git       → https://github.com/owner/repo
 *   ssh://git@github.com/owner/repo.git → https://github.com/owner/repo
 *   https://github.com/owner/repo(.git) → https://github.com/owner/repo
 */
export function githubWebUrl(remote) {
  if (typeof remote !== "string") return null;
  const m =
    /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(remote.trim()) ||
    /^(?:ssh:\/\/)?git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(remote.trim()) ||
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(remote.trim());
  return m ? `https://github.com/${m[1]}/${m[2]}` : null;
}

/** Resolve a rig name to its checkout path via rigs.json (same rules as server.mjs rigExists). */
export function rigCheckoutPath(orchDir, rigName) {
  if (!rigName) return null;
  const rigs = readJson(path.join(orchDir, "rigs.json"), { rigs: {} });
  if (rigs.rigs && Object.prototype.hasOwnProperty.call(rigs.rigs, rigName) && rigs.rigs[rigName].path) {
    return expandHome(String(rigs.rigs[rigName].path));
  }
  const m = /^factory:([a-z0-9-]+)$/.exec(rigName);
  if (m && rigs.factoryApps && rigs.factoryApps.basePath) {
    return path.join(expandHome(String(rigs.factoryApps.basePath)), m[1]);
  }
  return null;
}

const repoUrlCache = new Map();

/** GitHub web URL for a rig's origin remote, cached per rig. Null on any failure. */
export function repoUrlForRig(orchDir, rigName) {
  const key = `${orchDir}\0${rigName || ""}`;
  if (repoUrlCache.has(key)) return repoUrlCache.get(key);
  let url = null;
  try {
    const dir = rigCheckoutPath(orchDir, rigName);
    if (dir && fs.existsSync(dir)) {
      const remote = execFileSync("git", ["-C", dir, "remote", "get-url", "origin"], {
        encoding: "utf8",
        timeout: 5000,
        stdio: ["ignore", "pipe", "ignore"],
      });
      url = githubWebUrl(remote);
    }
  } catch {
    url = null;
  }
  repoUrlCache.set(key, url);
  return url;
}
