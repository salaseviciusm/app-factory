/*
 * rebase-train pure core: the decisions and command literals behind the
 * engine's "rebase a PR onto its base and force-push it back" verb, shared by
 * bin/factory-run (via require(esm) like retry.mjs) and covered twice — by
 * rebase.test.mjs (runs without spawning the engine) and by selftest (the
 * engine's contract). Pure — no filesystem, git, or gh access: callers feed
 * in `gh pr view` JSON, git probe results, and run.json fields.
 *
 * The one push the engine performs outside factory/<id> is built here
 * (pushPrBranchCommand). Its shape is the whole safety story: the lease is
 * pinned to the head sha fetched at run start, the destination is a fully
 * qualified refs/heads/<headRef>, and the rig default branch is refused by the
 * builder itself — before any git process exists. pushLiteralAllowed is the
 * selftest push-source scan's predicate, so the literal's shape is proved
 * against the source, not just this module's tests.
 */

/** Upper bound on a PR number the engine will accept (CLI, API, console). */
export const PR_MAX = 999999;

/** The fields `gh pr view --json` must return for classifyRebaseTarget and
 *  the run record. Pinned as a single string so the CLI, the parser, and the
 *  tests agree byte-for-byte. */
export const PR_VIEW_FIELDS = "number,url,title,body,state,isCrossRepository,headRefName,baseRefName,headRefOid,mergeable";

/** True for a PR number the engine accepts: a positive integer up to PR_MAX. */
export function validPrNumber(n) {
  return Number.isInteger(n) && n >= 1 && n <= PR_MAX;
}

/** argv for `gh <...>`: one PR's rebase-relevant facts. */
export function prViewCommand(number) {
  return ["pr", "view", String(number), "--json", PR_VIEW_FIELDS];
}

/** Parse `gh pr view --json <PR_VIEW_FIELDS>` output into a plain record, or
 *  null on anything unrecognizable (missing number/url/refs). */
export function parsePrView(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const str = (v) => (typeof v === "string" ? v : "");
  if (!Number.isInteger(parsed.number) || !str(parsed.url) || !str(parsed.headRefName) || !str(parsed.baseRefName)) return null;
  return {
    number: parsed.number,
    url: parsed.url,
    title: str(parsed.title),
    body: str(parsed.body),
    state: str(parsed.state).toUpperCase(),
    isCrossRepository: parsed.isCrossRepository === true,
    headRefName: parsed.headRefName,
    baseRefName: parsed.baseRefName,
    headRefOid: str(parsed.headRefOid),
    mergeable: str(parsed.mergeable).toUpperCase() || null,
  };
}

/** Whether a PR is one the engine will rebase (pure). Only an open,
 *  same-repository PR whose base is the rig default branch and whose head is
 *  a real topic branch qualifies. Fork PRs cannot be pushed to by lease from
 *  this remote; a head equal to the default branch (or to the base) would
 *  turn the force-push into a default-branch rewrite. Every refusal carries a
 *  non-empty reason for the summary and the Slack message. */
export function classifyRebaseTarget({ state, isCrossRepository, headRefName, baseRefName, defaultBranch }) {
  const st = String(state || "").toUpperCase();
  if (st !== "OPEN") return { ok: false, reason: `PR is ${st || "in an unknown state"}, not OPEN — only open PRs are rebased` };
  if (isCrossRepository) return { ok: false, reason: "PR comes from a fork (cross-repository) — the engine only pushes branches of the rig's own remote" };
  const head = String(headRefName || "").trim();
  const base = String(baseRefName || "").trim();
  if (!head) return { ok: false, reason: "PR has no head ref" };
  if (head === defaultBranch) return { ok: false, reason: `PR head is the default branch ${defaultBranch} — the engine never force-pushes it` };
  if (head === base) return { ok: false, reason: `PR head and base are the same ref (${head})` };
  if (base !== defaultBranch) return { ok: false, reason: `PR base is ${base}, not the rig default branch ${defaultBranch} — non-default bases are out of scope (v2)` };
  return { ok: true, reason: `open same-repo PR ${head} → ${base}` };
}

/** argv for `git <...>`: refresh exactly the two refs a rebase reads. The
 *  fetch updates origin/<baseRef> and origin/<headRef> (standard refspec);
 *  no local branch is ever created. */
export function prFetchArgs({ baseRef, headRef }) {
  return ["fetch", "origin", baseRef, headRef];
}

/** argv for `git <...>`: a detached worktree at the fetched PR head. Detached
 *  because the head branch may already be checked out elsewhere (the
 *  founder's own rebase worktrees), and because a local branch would invite
 *  a `git push` without the lease. */
export function prWorktreeAddArgs({ worktree, headRef }) {
  return ["worktree", "add", "--detach", worktree, `origin/${headRef}`];
}

/** The rebase invocation, verbatim: onto the freshly fetched remote base,
 *  no --autostash (a stash re-applied under an agent-driven rebase is
 *  unreviewable), no -i, no --onto. */
export function rebaseCommand(baseRef) {
  return `git rebase origin/${baseRef}`;
}

/** Outcome of a `git rebase` run (pure). A non-zero exit with unmerged paths
 *  is the expected conflict stop the resolve step handles; a non-zero exit
 *  with nothing unmerged is an error (dirty tree, bad ref, editor) the engine
 *  must abort and fail on rather than hand to an agent. */
export function classifyRebaseOutcome({ rebaseOk, unmergedFiles }) {
  if (rebaseOk) return { conflicted: false };
  const files = Array.isArray(unmergedFiles) ? unmergedFiles.filter((f) => typeof f === "string" && f.trim()) : [];
  if (files.length) return { conflicted: true, files };
  return { error: true };
}

/** Whether the resolve agent's ending counts as a completed rebase (pure).
 *  RESOLVED is only believed when the worktree proves it: no rebase in
 *  progress, an empty porcelain status, and no tracked file at HEAD carrying
 *  a conflict marker. ESCALATED (or an escalation file) is a founder
 *  decision, never a defect. Anything else is an incomplete rebase. */
export function classifyResolveEnding({ agentOk, resultText, escalationPresent, rebaseInProgress, statusClean, markerFiles }) {
  const text = String(resultText || "").trim();
  if (escalationPresent || text === "ESCALATED") return { outcome: "escalated" };
  if (agentOk && text === "RESOLVED") {
    const markers = Array.isArray(markerFiles) ? markerFiles.filter(Boolean) : [];
    if (!rebaseInProgress && statusClean && markers.length === 0) return { outcome: "resolved" };
    const why = rebaseInProgress
      ? "a rebase is still in progress"
      : !statusClean
        ? "the worktree is not clean"
        : `conflict markers remain in ${markers.join(", ")}`;
    return { outcome: "incomplete", reason: `resolve agent finished but the rebase is not complete (${why})` };
  }
  return { outcome: "incomplete", reason: "resolve agent finished but the rebase is not complete" };
}

/** The exact PR-branch publish invocation (pure). Throws — before any git
 *  process exists — for the rig default branch, an empty ref, a ref with
 *  whitespace, or an expected sha that is not a hex object name. Shape:
 *    git push --force-with-lease=refs/heads/<headRef>:<expectedSha> origin HEAD:refs/heads/<headRef>
 *  The lease pins the remote to the sha fetched at run start (a branch that
 *  moved since is refused by the remote, never overwritten), and the
 *  destination is fully qualified so no refspec shorthand can widen it. */
export function pushPrBranchCommand({ headRef, expectedSha, defaultBranch }) {
  const ref = typeof headRef === "string" ? headRef : "";
  if (!ref.trim()) throw new Error("pushPrBranchCommand: headRef is empty");
  if (/\s/.test(ref)) throw new Error(`pushPrBranchCommand: headRef '${ref}' contains whitespace`);
  if (ref.startsWith("-") || ref.includes("..") || ref.endsWith("/") || ref.startsWith("/")) {
    throw new Error(`pushPrBranchCommand: headRef '${ref}' is not a plain branch name`);
  }
  if (ref === String(defaultBranch)) throw new Error(`pushPrBranchCommand: refusing to force-push the default branch ${defaultBranch}`);
  const sha = typeof expectedSha === "string" ? expectedSha.trim() : "";
  if (!/^[0-9a-f]{1,40}$/i.test(sha)) throw new Error(`pushPrBranchCommand: expectedSha '${sha}' is not a git object name`);
  return `git push --force-with-lease=refs/heads/${ref}:${sha} origin HEAD:refs/heads/${ref}`;
}

/** Push-source scan predicate (pure): a `git push` literal in the engine (or
 *  this module) is allowed only when it names a factory/ run branch or is
 *  the lease-pinned, fully qualified PR push shape above. `git push origin
 *  main` and a bare `--force` fail it. */
export function pushLiteralAllowed(line) {
  const s = String(line || "");
  if (!/git +push/.test(s)) return false;
  if (/git +push[^"'`]*factory\//.test(s)) return true;
  return s.includes("--force-with-lease=refs/heads/") && s.includes("HEAD:refs/heads/");
}

/** Classify a failed push (pure): a lease rejection (the remote head moved
 *  since the fetched sha) versus anything else (auth, network, protected
 *  branch). Both fail the step; only the lease case names the moved branch. */
export function classifyPushFailure(output) {
  const s = String(output || "");
  if (/stale info/.test(s) || (/\[rejected\]/.test(s) && /lease/.test(s))) return { kind: "lease" };
  return { kind: "other" };
}

/** The push step's pre-flight invariants (pure). Each refusal names the
 *  invariant it failed; the push is only built once all four hold. */
export function classifyPushReadiness({ conflicted, rebaseInProgress, commitsBefore, commitsNow, baseSha, mergeBaseNow }) {
  if (conflicted !== true && conflicted !== false) return { ok: false, reason: "push refused: no rebase outcome recorded (rebase.conflicted is null)" };
  if (rebaseInProgress) return { ok: false, reason: "push refused: a rebase is still in progress in the worktree" };
  if (!Number.isInteger(commitsBefore) || commitsNow !== commitsBefore) {
    return { ok: false, reason: `push refused: commit count changed across the rebase (${commitsBefore} before, ${commitsNow} now) — a commit was skipped, squashed, or added` };
  }
  if (!baseSha || mergeBaseNow !== baseSha) {
    return { ok: false, reason: `push refused: HEAD is not rebased onto the recorded base (merge-base ${String(mergeBaseNow || "unknown").slice(0, 12)}, expected ${String(baseSha || "unknown").slice(0, 12)})` };
  }
  return { ok: true, reason: `${commitsBefore} commit(s) on top of ${String(baseSha).slice(0, 12)}, no rebase in progress` };
}

/** rebase-summary.md (pure): the notify step's body and the run's durable
 *  record. Always says what happened to the branch, never claims a merge —
 *  the literal `Not merged` is part of the contract. */
export function composeRebaseSummary({
  runId,
  pr,
  url,
  title,
  headRef,
  baseRef,
  headShaBefore,
  headShaAfter,
  baseSha,
  conflicted,
  conflictFiles = [],
  escalation = null,
  gates = {},
  pushed = false,
  state,
  failedStep = null,
  failureSummary = null,
  mergeableAfter = null,
}) {
  const short = (s) => (typeof s === "string" && s ? s.slice(0, 12) : "none");
  const lines = [];
  lines.push(`:twisted_rightwards_arrows: rebase-train ${runId || ""}: PR #${pr}${title ? ` — ${title}` : ""}`.trimEnd());
  if (url) lines.push(`PR: ${url}`);
  lines.push(`Branch ${headRef || "?"} · head before ${short(headShaBefore)} · head after ${headShaAfter ? short(headShaAfter) : "unchanged (not pushed)"}`);
  lines.push(`Base: ${baseRef || "?"}@${short(baseSha)}`);
  if (escalation) lines.push(`Conflicts: escalated — ${escalation}`);
  else if (conflicted === true) {
    lines.push(`Conflicts: ${conflictFiles.length} file(s) resolved by the conflict-resolver agent${conflictFiles.length ? `: ${conflictFiles.join(", ")}` : ""}`);
  } else if (conflicted === false) lines.push("Conflicts: none (clean rebase)");
  else lines.push("Conflicts: rebase did not complete");
  const gate = (id) => (gates[id] === undefined ? "not run" : gates[id] === true ? "green" : `failed — ${gates[id]}`);
  lines.push(`Checks: ${gate("checks")} · Tests: ${gate("tests")}`);
  lines.push(pushed ? `Push: ${headRef} force-pushed with lease on ${short(headShaBefore)} → ${short(headShaAfter)}` : "Push: not pushed");
  if (pushed && mergeableAfter) lines.push(`GitHub mergeability after push: ${mergeableAfter}`);
  lines.push(state === "done" ? "Outcome: done" : `Outcome: ${state || "failed"}${failedStep ? ` at ${failedStep}` : ""}${failureSummary ? ` — ${failureSummary}` : ""}`);
  lines.push(`Not merged — the PR diff on GitHub stays the review surface${url ? `: ${url}` : ""}.`);
  return `${lines.join("\n")}\n`;
}
