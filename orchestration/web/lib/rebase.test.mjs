/* Tests for the rebase-train pure core — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  PR_MAX,
  PR_VIEW_FIELDS,
  validPrNumber,
  prViewCommand,
  parsePrView,
  classifyRebaseTarget,
  prFetchArgs,
  prWorktreeAddArgs,
  rebaseCommand,
  classifyRebaseOutcome,
  classifyResolveEnding,
  pushPrBranchCommand,
  pushLiteralAllowed,
  classifyPushFailure,
  classifyPushReadiness,
  composeRebaseSummary,
} from "./rebase.mjs";

const OPEN_PR = { state: "OPEN", isCrossRepository: false, headRefName: "codex/x", baseRefName: "main", defaultBranch: "main" };
const target = (over = {}) => classifyRebaseTarget({ ...OPEN_PR, ...over });

test("validPrNumber: positive integers up to PR_MAX only", () => {
  assert.equal(validPrNumber(1), true);
  assert.equal(validPrNumber(88), true);
  assert.equal(validPrNumber(PR_MAX), true);
  assert.equal(validPrNumber(0), false);
  assert.equal(validPrNumber(-3), false);
  assert.equal(validPrNumber(PR_MAX + 1), false);
  assert.equal(validPrNumber(1.5), false);
  assert.equal(validPrNumber("88"), false);
  assert.equal(validPrNumber(NaN), false);
});

test("prViewCommand pins the gh argv and field list", () => {
  assert.deepEqual(prViewCommand(88), ["pr", "view", "88", "--json", PR_VIEW_FIELDS]);
  assert.equal(PR_VIEW_FIELDS, "number,url,title,body,state,isCrossRepository,headRefName,baseRefName,headRefOid,mergeable");
});

test("parsePrView: well-formed gh JSON parses, garbage degrades to null", () => {
  const p = parsePrView({
    number: 88,
    url: "https://github.com/o/r/pull/88",
    title: "Add watch",
    body: "b",
    state: "open",
    isCrossRepository: false,
    headRefName: "codex/x",
    baseRefName: "main",
    headRefOid: "6191b658abd662221496871413d986c7249a9976",
    mergeable: "conflicting",
  });
  assert.equal(p.number, 88);
  assert.equal(p.state, "OPEN");
  assert.equal(p.mergeable, "CONFLICTING");
  assert.equal(p.headRefOid, "6191b658abd662221496871413d986c7249a9976");
  assert.equal(parsePrView(null), null);
  assert.equal(parsePrView("gh exploded"), null);
  assert.equal(parsePrView({ number: 1 }), null);
  assert.equal(parsePrView({ number: 1, url: "u", headRefName: "h" }), null);
});

test("classifyRebaseTarget: open same-repo PR onto the default branch is ok", () => {
  const d = target();
  assert.equal(d.ok, true);
});

test("classifyRebaseTarget: every refusal carries a non-empty reason", () => {
  const refusals = [
    ["MERGED", target({ state: "MERGED" })],
    ["CLOSED", target({ state: "CLOSED" })],
    ["fork", target({ isCrossRepository: true })],
    ["head is default", target({ headRefName: "main" })],
    ["head equals base", target({ headRefName: "release", baseRefName: "release" })],
    ["base not default", target({ baseRefName: "develop" })],
  ];
  for (const [label, d] of refusals) {
    assert.equal(d.ok, false, `${label} must be refused`);
    assert.ok(typeof d.reason === "string" && d.reason.length > 0, `${label} carries a reason`);
  }
  assert.match(target({ state: "MERGED" }).reason, /MERGED/);
  assert.match(target({ isCrossRepository: true }).reason, /fork/);
  assert.match(target({ headRefName: "main" }).reason, /default branch/);
  assert.match(target({ baseRefName: "develop" }).reason, /develop/);
});

test("fetch / worktree-add / rebase argv are pinned verbatim", () => {
  assert.deepEqual(prFetchArgs({ baseRef: "main", headRef: "codex/x" }), ["fetch", "origin", "main", "codex/x"]);
  assert.deepEqual(prWorktreeAddArgs({ worktree: "/w/rebase-pr-88", headRef: "codex/x" }), ["worktree", "add", "--detach", "/w/rebase-pr-88", "origin/codex/x"]);
  assert.equal(rebaseCommand("main"), "git rebase origin/main");
});

test("classifyRebaseOutcome: clean, conflicted, error", () => {
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: true }), { conflicted: false });
  const c = classifyRebaseOutcome({ rebaseOk: false, unmergedFiles: ["a.ts"] });
  assert.equal(c.conflicted, true);
  assert.deepEqual(c.files, ["a.ts"]);
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false, unmergedFiles: [] }), { error: true });
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false, unmergedFiles: ["", "  "] }), { error: true });
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false }), { error: true });
});

test("classifyResolveEnding: RESOLVED is believed only with proof", () => {
  const base = { agentOk: true, resultText: "RESOLVED", escalationPresent: false, rebaseInProgress: false, statusClean: true, markerFiles: [] };
  assert.equal(classifyResolveEnding(base).outcome, "resolved");
  assert.equal(classifyResolveEnding({ ...base, resultText: "  RESOLVED\n" }).outcome, "resolved");
  assert.equal(classifyResolveEnding({ ...base, rebaseInProgress: true }).outcome, "incomplete");
  assert.equal(classifyResolveEnding({ ...base, statusClean: false }).outcome, "incomplete");
  const markers = classifyResolveEnding({ ...base, markerFiles: ["src/a.ts"] });
  assert.equal(markers.outcome, "incomplete");
  assert.match(markers.reason, /src\/a\.ts/);
  assert.match(markers.reason, /^resolve agent finished but the rebase is not complete/);
});

test("classifyResolveEnding: escalation and other endings", () => {
  const base = { agentOk: true, resultText: "RESOLVED", escalationPresent: false, rebaseInProgress: false, statusClean: true, markerFiles: [] };
  assert.equal(classifyResolveEnding({ ...base, resultText: "ESCALATED" }).outcome, "escalated");
  assert.equal(classifyResolveEnding({ ...base, escalationPresent: true }).outcome, "escalated");
  assert.equal(classifyResolveEnding({ ...base, escalationPresent: true, resultText: "RESOLVED" }).outcome, "escalated");
  const other = classifyResolveEnding({ ...base, resultText: "I gave up" });
  assert.equal(other.outcome, "incomplete");
  assert.equal(other.reason, "resolve agent finished but the rebase is not complete");
  assert.equal(classifyResolveEnding({ ...base, agentOk: false, resultText: "timed out" }).outcome, "incomplete");
});

test("pushPrBranchCommand: the exact lease-pinned, fully qualified push", () => {
  assert.equal(
    pushPrBranchCommand({ headRef: "codex/x", expectedSha: "abc1234", defaultBranch: "main" }),
    "git push --force-with-lease=refs/heads/codex/x:abc1234 origin HEAD:refs/heads/codex/x"
  );
  assert.throws(() => pushPrBranchCommand({ headRef: "main", expectedSha: "abc1234", defaultBranch: "main" }), /default branch main/);
  assert.throws(() => pushPrBranchCommand({ headRef: "", expectedSha: "abc1234", defaultBranch: "main" }), /empty/);
  assert.throws(() => pushPrBranchCommand({ headRef: "  ", expectedSha: "abc1234", defaultBranch: "main" }), /empty/);
  assert.throws(() => pushPrBranchCommand({ headRef: "codex/x y", expectedSha: "abc1234", defaultBranch: "main" }), /whitespace/);
  assert.throws(() => pushPrBranchCommand({ headRef: "codex/x", expectedSha: "", defaultBranch: "main" }), /object name/);
  assert.throws(() => pushPrBranchCommand({ headRef: "codex/x", expectedSha: "not-a-sha", defaultBranch: "main" }), /object name/);
  assert.throws(() => pushPrBranchCommand({ headRef: "--delete", expectedSha: "abc1234", defaultBranch: "main" }), /plain branch name/);
});

test("pushLiteralAllowed: factory/ pushes and the lease shape only", () => {
  assert.equal(pushLiteralAllowed("git push --force-with-lease -u origin factory/x"), true);
  assert.equal(pushLiteralAllowed('return `git push --force-with-lease=refs/heads/${ref}:${sha} origin HEAD:refs/heads/${ref}`;'), true);
  assert.equal(pushLiteralAllowed("git push origin main"), false);
  assert.equal(pushLiteralAllowed("git push --force origin HEAD:refs/heads/x"), false);
  assert.equal(pushLiteralAllowed("git push --force-with-lease=refs/heads/x:abc origin x"), false);
  assert.equal(pushLiteralAllowed("git push --force-with-lease origin HEAD:refs/heads/x"), false);
  assert.equal(pushLiteralAllowed("no push here"), false);
});

test("classifyPushFailure: stale-info lease rejection vs anything else", () => {
  assert.equal(classifyPushFailure(" ! [rejected]        HEAD -> codex/x (stale info)\nerror: failed to push some refs").kind, "lease");
  assert.equal(classifyPushFailure("fatal: Authentication failed").kind, "other");
  assert.equal(classifyPushFailure("").kind, "other");
});

test("classifyPushReadiness: every invariant names itself", () => {
  const ok = { conflicted: false, rebaseInProgress: false, commitsBefore: 3, commitsNow: 3, baseSha: "b".repeat(40), mergeBaseNow: "b".repeat(40) };
  assert.equal(classifyPushReadiness(ok).ok, true);
  assert.equal(classifyPushReadiness({ ...ok, conflicted: true }).ok, true);
  assert.match(classifyPushReadiness({ ...ok, conflicted: null }).reason, /conflicted is null/);
  assert.match(classifyPushReadiness({ ...ok, rebaseInProgress: true }).reason, /in progress/);
  assert.match(classifyPushReadiness({ ...ok, commitsNow: 2 }).reason, /commit count changed.*3 before, 2 now/);
  assert.match(classifyPushReadiness({ ...ok, mergeBaseNow: "c".repeat(40) }).reason, /not rebased onto the recorded base/);
  assert.match(classifyPushReadiness({ ...ok, baseSha: null }).reason, /not rebased/);
});

test("composeRebaseSummary: names the PR, both heads, base@sha, outcome, and never a merge", () => {
  const s = composeRebaseSummary({
    runId: "rebase-pr-88",
    pr: 88,
    url: "https://github.com/o/r/pull/88",
    title: "Add watch",
    headRef: "codex/x",
    baseRef: "main",
    headShaBefore: "6191b658abd662221496871413d986c7249a9976",
    headShaAfter: "0123456789abcdef0123456789abcdef01234567",
    baseSha: "a2ab343c0e167abad97d814c2757b3059012a438",
    conflicted: true,
    conflictFiles: ["a.ts", "b.ts"],
    gates: { checks: true, tests: true },
    pushed: true,
    state: "done",
    mergeableAfter: "MERGEABLE",
  });
  for (const bit of ["PR #88", "Add watch", "https://github.com/o/r/pull/88", "6191b658abd6", "0123456789ab", "main@a2ab343c0e16", "a.ts, b.ts", "Checks: green", "Tests: green", "Outcome: done", "Not merged", "MERGEABLE"]) {
    assert.ok(s.includes(bit), `summary carries ${bit}`);
  }
  assert.ok(!/merged (the|this) PR/i.test(s));
});

test("composeRebaseSummary: failure and escalation shapes", () => {
  const failed = composeRebaseSummary({
    runId: "rebase-pr-9",
    pr: 9,
    url: "u",
    headRef: "codex/y",
    baseRef: "main",
    headShaBefore: "1111111111111",
    headShaAfter: null,
    baseSha: "2222222222222",
    conflicted: false,
    gates: { checks: "checks failed at: npm run lint" },
    pushed: false,
    state: "failed",
    failedStep: "checks",
    failureSummary: "checks failed at: npm run lint",
  });
  assert.ok(failed.includes("Checks: failed — checks failed at: npm run lint"));
  assert.ok(failed.includes("Tests: not run"));
  assert.ok(failed.includes("Push: not pushed"));
  assert.ok(failed.includes("Outcome: failed at checks"));
  assert.ok(failed.includes("Not merged"));
  const esc = composeRebaseSummary({ runId: "r", pr: 1, headRef: "h", baseRef: "main", conflicted: true, escalation: "semantic conflict in a.ts", state: "failed", failedStep: "resolve" });
  assert.ok(esc.includes("Conflicts: escalated — semantic conflict in a.ts"));
  assert.ok(esc.includes("head after unchanged (not pushed)"));
  const refused = composeRebaseSummary({ runId: "r", pr: 2, headRef: "h", baseRef: "main", conflicted: null, state: "failed", failureSummary: "PR is MERGED" });
  assert.ok(refused.includes("Conflicts: rebase did not complete"));
  assert.ok(refused.includes("PR is MERGED"));
});
