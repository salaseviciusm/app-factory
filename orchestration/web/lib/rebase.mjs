/*
 * Rebase-train pure core (D36): the one deterministic verb that rebases an
 * open PR's head onto the rig's default branch, re-runs checks and tests, and
 * lease-force-pushes the PR head — never merging, never resolving a conflict.
 * Shared by the engine (bin/factory-run, via require(esm) like retry.mjs) and
 * the web server; pure — no filesystem, git, gh, or clock access. Callers feed
 * in what they observed (gh pr view JSON, git probe results) and act on the
 * verdicts.
 *
 * The push is the only force-push the engine owns, and its literal is built
 * here: `--force-with-lease=refs/heads/<head>:<sha gh reported at run start>`
 * plus an explicit `HEAD:refs/heads/<head>` refspec, so the selftest
 * push-source scan (pushLiteralAllowed) can prove both shapes structurally.
 */

export const REBASE_WORKFLOW = "rebase-train";

/** The gh pr view fields the engine resolves a rebase target from. */
export const PR_VIEW_FIELDS = "number,url,title,state,isDraft,isCrossRepository,headRefName,baseRefName,headRefOid";

/** `gh pr view` argv for a rebase target (run in the rig checkout). */
export function prViewCommand(number) {
  return ["pr", "view", String(number), "--json", PR_VIEW_FIELDS];
}

/** A PR number from CLI/API input: an integer in 1..999999 (strings must be
 *  plain decimal digits), else null. */
export function parsePrNumber(raw) {
  if (typeof raw === "number") return Number.isInteger(raw) && raw >= 1 && raw <= 999999 ? raw : null;
  if (typeof raw !== "string" || !/^[0-9]{1,6}$/.test(raw.trim())) return null;
  const n = parseInt(raw.trim(), 10);
  return n >= 1 && n <= 999999 ? n : null;
}

/** Refusals checked before any worktree exists. `pr` is gh's view JSON,
 *  `liveRuns` the OTHER non-terminal runs as {id, workflow, branch, rebasePr}
 *  (branch null for branchless runs). Returns {ok: true} or {ok: false,
 *  reason}. Draft PRs are refused because their author may be mid-edit;
 *  cross-repository PRs because the lease push targets origin; a head equal
 *  to the default branch or the base because the push would rewrite it. */
export function classifyRebaseTarget({ pr, defaultBranch, liveRuns = [] }) {
  if (!pr || typeof pr !== "object") return { ok: false, reason: "gh pr view returned no PR" };
  const ref = `PR #${pr.number}`;
  if (pr.state !== "OPEN") return { ok: false, reason: `${ref} is ${String(pr.state || "unknown").toLowerCase()}, not open` };
  if (pr.isDraft) return { ok: false, reason: `${ref} is a draft (its author may be mid-edit)` };
  if (pr.isCrossRepository) return { ok: false, reason: `${ref} is cross-repository (fork PRs are out of scope)` };
  const head = pr.headRefName;
  if (typeof head !== "string" || !head) return { ok: false, reason: `${ref} has no head ref` };
  if (head === defaultBranch) return { ok: false, reason: `${ref} head ref '${head}' is the default branch` };
  if (head === pr.baseRefName) return { ok: false, reason: `${ref} head ref '${head}' equals its base` };
  if (pr.baseRefName !== defaultBranch) {
    return { ok: false, reason: `${ref} targets '${pr.baseRefName}', not the rig default branch '${defaultBranch}'` };
  }
  if (typeof pr.headRefOid !== "string" || !/^[0-9a-f]{7,40}$/.test(pr.headRefOid)) {
    return { ok: false, reason: `${ref} has no usable head sha` };
  }
  const owner = liveRuns.find((r) => r.branch && r.branch === head);
  if (owner) return { ok: false, reason: `${ref} head ref '${head}' is the branch of live run ${owner.id}` };
  const holder = liveRuns.find((r) => r.workflow === REBASE_WORKFLOW && r.rebasePr === pr.number);
  if (holder) return { ok: false, reason: `${ref} is already held by live rebase-train run ${holder.id}` };
  return { ok: true };
}

/** `git fetch` argv (after `git -C <rig>`) for the base and head refs. */
export function fetchRefsCommand({ baseRef, headRef }) {
  return ["fetch", "origin", baseRef, headRef];
}

/** `git worktree add` argv (after `git -C <rig>`): a detached checkout of
 *  the sha gh reported — never the ref name, and no local branch. */
export function worktreeAddCommand({ worktree, sha }) {
  return ["worktree", "add", "--detach", worktree, sha];
}

/** What a `git rebase origin/<base>` attempt means: clean, a conflict (the
 *  rebase stopped with unmerged paths — a founder item), or an error (it
 *  failed for any other reason). */
export function classifyRebaseOutcome({ rebaseOk, unmergedFiles = [] }) {
  if (rebaseOk) return { outcome: "clean" };
  if (Array.isArray(unmergedFiles) && unmergedFiles.length > 0) return { outcome: "conflict" };
  return { outcome: "error" };
}

/** The failure summary for a conflicted rebase: `conflict: needs founder`,
 *  every unmerged file, and the base-side range that introduced the clash. */
export function conflictSummary({ unmergedFiles, mergeBase, baseSha }) {
  return (
    `conflict: needs founder — ${unmergedFiles.length} unmerged file(s): ${unmergedFiles.join(", ")}; ` +
    `base-side range ${mergeBase}..${baseSha}`
  );
}

/** Push invariants, checked before any push. Returns {ok: true} or {ok:
 *  false, reason} naming the first failed invariant. */
export function classifyPushReadiness({ rebaseInProgress, baseIsAncestor, commitsBefore, commitsAfter, head, headShaBefore }) {
  if (rebaseInProgress) return { ok: false, reason: "a rebase is still in progress in the worktree" };
  if (!baseIsAncestor) return { ok: false, reason: "origin base is not an ancestor of HEAD" };
  if (commitsAfter !== commitsBefore) {
    return { ok: false, reason: `commit count changed (${commitsBefore} before, ${commitsAfter} after — a commit was dropped or added)` };
  }
  if (!head || head === headShaBefore) return { ok: false, reason: `HEAD is unchanged at ${headShaBefore} (nothing to push)` };
  return { ok: true };
}

/** The exact lease force-push of a PR head. Throws on any input that could
 *  aim it anywhere else: the default branch, an empty/whitespace/`:` ref,
 *  a ref that reads as an option, or a lease sha that is not 7–40 hex. */
export function pushPrBranchCommand({ headRef, expectedSha, defaultBranch }) {
  if (typeof headRef !== "string" || !headRef || /[\s:]/.test(headRef) || headRef.startsWith("-")) {
    throw new Error(`invalid PR head ref '${headRef}'`);
  }
  if (headRef === defaultBranch) throw new Error(`refusing to push the default branch '${defaultBranch}'`);
  if (typeof expectedSha !== "string" || !/^[0-9a-f]{7,40}$/.test(expectedSha)) {
    throw new Error(`invalid lease sha '${expectedSha}'`);
  }
  return `git push --force-with-lease=refs/heads/${headRef}:${expectedSha} origin HEAD:refs/heads/${headRef}`;
}

/** The push-source scan's predicate for one source line holding a `git push`
 *  literal: it must name a factory/ run branch, or be the PR-head lease push
 *  (an explicit lease ref AND an explicit HEAD:refs/heads/ refspec). */
export function pushLiteralAllowed(line) {
  const s = String(line);
  if (/git +push[^"'`]*factory\//.test(s)) return true;
  return s.includes("--force-with-lease=refs/heads/") && s.includes("HEAD:refs/heads/");
}

const short = (sha) => (typeof sha === "string" && sha ? sha.slice(0, 12) : "—");

/** rebase-summary.md: the founder-facing record, written on every exit and
 *  posted by the notify step. `rebase` is run.rebase. */
export function composeRebaseSummary(rebase) {
  const r = rebase || {};
  const lines = [];
  lines.push(`*Rebase train* — PR #${r.pr}${r.title ? `: ${r.title}` : ""}`);
  if (r.url) lines.push(r.url);
  lines.push(`Outcome: ${r.outcome || "pending"}`);
  if (r.headRef) lines.push(`Head: \`${r.headRef}\` ${short(r.headShaBefore)} → ${r.headShaAfter ? short(r.headShaAfter) : "not pushed"}`);
  if (r.baseRef) {
    lines.push(
      `Base: ${r.baseRef}@${short(r.baseSha)}` +
        (r.mergeBase ? ` (merge-base ${short(r.mergeBase)}, ${r.commitsBefore} PR commit(s))` : "")
    );
  }
  if (r.conflicted && Array.isArray(r.unmergedFiles)) lines.push(`Unmerged files: ${r.unmergedFiles.join(", ")}`);
  lines.push(`Checks: ${r.checks || "not run"} · Tests: ${r.tests || "not run"}`);
  if (r.dryRun) lines.push("Dry run: nothing was pushed.");
  lines.push("Not merged — rebase-train never merges; the founder merges the PR on GitHub.");
  return lines.join("\n") + "\n";
}
