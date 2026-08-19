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
 * Slack mrkdwn link `<url|label>` with the label's mrkdwn control characters
 * escaped (&, <, > — Slack's documented escaping set). Pure; null when the
 * url is not http(s) or the label is blank, so call sites can `|| fallback`
 * to today's backtick text instead of ever emitting a broken `<|>` fragment.
 */
export function slackLink(url, label) {
  if (typeof url !== "string" || !/^https?:\/\/\S+$/.test(url.trim())) return null;
  const text = String(label ?? "").trim();
  if (!text) return null;
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<${url.trim()}|${escaped}>`;
}

/** GitHub commit page URL, or null when the repo URL or sha is unusable. */
export function commitUrl(repoUrl, sha) {
  if (typeof repoUrl !== "string" || !repoUrl) return null;
  const s = typeof sha === "string" ? sha.trim() : "";
  if (!/^[0-9a-f]{7,40}$/i.test(s)) return null;
  return `${repoUrl}/commit/${s}`;
}

/** GitHub compare view (base...branch) URL, or null on any missing part. */
export function compareUrl(repoUrl, base, branch) {
  if (typeof repoUrl !== "string" || !repoUrl) return null;
  const b = typeof base === "string" ? base.trim() : "";
  const h = typeof branch === "string" ? branch.trim() : "";
  if (!b || !h) return null;
  return `${repoUrl}/compare/${b}...${h}`;
}

/** A GitHub PR's checks page URL, or null when prUrl isn't a PR URL. */
export function prChecksUrl(prUrl) {
  const m = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+$/.exec(String(prUrl || "").trim());
  return m ? `${m[0]}/checks` : null;
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

/** argv for `gh <...>`: every open PR with the fields the attention
 *  classifier (parsePrAttention) reads — the `factory-run prs` feed. */
export function prAttentionListCommand() {
  return [
    "pr", "list", "--state", "open",
    "--json", "number,title,url,createdAt,reviewDecision,mergeable,statusCheckRollup,isDraft",
  ];
}

/** Roll a PR's statusCheckRollup (CheckRun `conclusion`/`status`, plain
 *  StatusContext `state`) into one word: "failing" beats "pending" beats
 *  "passing"; no checks at all is "none". Garbage entries are skipped. */
function summarizeChecks(rollup) {
  if (!Array.isArray(rollup) || rollup.length === 0) return "none";
  let pending = false;
  for (const c of rollup) {
    if (!c || typeof c !== "object") continue;
    const outcome = String(c.conclusion || c.state || "").toUpperCase();
    if (["FAILURE", "ERROR", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE"].includes(outcome)) {
      return "failing";
    }
    if (!outcome || ["PENDING", "QUEUED", "IN_PROGRESS", "WAITING", "EXPECTED"].includes(outcome)) pending = true;
  }
  return pending ? "pending" : "passing";
}

/**
 * Classify `gh pr list` output (prAttentionListCommand) into the open-PR
 * attention feed: [{number, title, url, createdAt, attention, checks}].
 * `attention` says why the PR needs the founder, first match wins:
 *   failing-checks     — any check failed (nothing to merge yet, but act);
 *   approved-mergeable — reviewed, green, one click from landing;
 *   review-requested   — awaiting a review (REVIEW_REQUIRED, or no review
 *                        decision at all — every factory PR is founder-merged,
 *                        so an unreviewed open PR is his to look at);
 *   none               — the ball is elsewhere (e.g. CHANGES_REQUESTED means
 *                        the implementer owes a revision, or approved but
 *                        conflicting).
 * Drafts are excluded. Garbage (non-array input, malformed entries) degrades
 * to [] / skipped entries — never throws.
 */
export function parsePrAttention(parsed) {
  if (!Array.isArray(parsed)) return [];
  const out = [];
  for (const p of parsed) {
    if (!p || typeof p !== "object" || Array.isArray(p)) continue;
    if (!Number.isInteger(p.number) || typeof p.url !== "string") continue;
    if (p.isDraft === true) continue;
    const checks = summarizeChecks(p.statusCheckRollup);
    const decision = String(p.reviewDecision || "").toUpperCase();
    const mergeable = String(p.mergeable || "").toUpperCase();
    let attention = "none";
    if (checks === "failing") attention = "failing-checks";
    else if (decision === "APPROVED" && mergeable === "MERGEABLE") attention = "approved-mergeable";
    else if (decision === "REVIEW_REQUIRED" || decision === "") attention = "review-requested";
    out.push({
      number: p.number,
      title: typeof p.title === "string" ? p.title : "",
      url: p.url,
      createdAt: typeof p.createdAt === "string" && p.createdAt ? p.createdAt : null,
      attention,
      checks,
    });
  }
  return out;
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
