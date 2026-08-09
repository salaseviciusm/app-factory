/*
 * Derive a rig's GitHub web URL (https://github.com/<owner>/<repo>) from its
 * checkout's `origin` remote, so the frontend can link commits/PRs. Read-only;
 * returns null on any failure (missing rig/dir, no remote, non-GitHub remote).
 *
 * Also the pure `gh` CLI contract for review-policy PRs (argv builders +
 * JSON/output parsers), shared by the engine (bin/factory-run, via
 * require(esm) like retry.mjs) and covered by github.test.mjs.
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

// ---------- gh CLI contract (pure: argv in, parsed JSON/stdout out) ----------

/** argv for `gh <...>`: open PRs whose head is `branch` (idempotence probe). */
export function prListCommand(branch) {
  return ["pr", "list", "--head", branch, "--state", "open", "--json", "number,url"];
}

/** Parse `gh pr list --json number,url` output into [{number, url}]. Garbage
 *  (non-array, malformed entries) degrades to [] — never throws. */
export function parsePrList(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((p) => p && typeof p === "object" && Number.isInteger(p.number) && typeof p.url === "string")
    .map((p) => ({ number: p.number, url: p.url }));
}

/** argv for `gh <...>`: create a PR from `branch` into `base`. Pushes nothing —
 *  the run branch is already published by the engine's pushRunBranch. */
export function prCreateCommand({ branch, base, title, body }) {
  return ["pr", "create", "--head", branch, "--base", base, "--title", title, "--body", body];
}

/** PR {number, url} from `gh pr create` stdout (the PR URL is its last
 *  meaningful line), or null when no PR URL is present. */
export function parsePrCreateUrl(output) {
  const m = String(output || "").match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/(\d+)/);
  return m ? { number: parseInt(m[1], 10), url: m[0] } : null;
}

/** argv for `gh <...>`: one PR's live merge status. */
export function prStatusCommand(number) {
  return ["pr", "view", String(number), "--json", "state,mergedAt,mergeCommit"];
}

/** Parse `gh pr view --json state,mergedAt,mergeCommit` output into
 *  { state: "open"|"merged"|"closed", mergedAt, mergeCommit } (mergeCommit is
 *  the merge commit sha or null). Null on anything unrecognizable. */
export function parsePrStatus(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const states = { OPEN: "open", MERGED: "merged", CLOSED: "closed" };
  const state = states[String(parsed.state || "").toUpperCase()];
  if (!state) return null;
  return {
    state,
    mergedAt: typeof parsed.mergedAt === "string" && parsed.mergedAt ? parsed.mergedAt : null,
    mergeCommit:
      parsed.mergeCommit && typeof parsed.mergeCommit === "object" && typeof parsed.mergeCommit.oid === "string"
        ? parsed.mergeCommit.oid
        : null,
  };
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
