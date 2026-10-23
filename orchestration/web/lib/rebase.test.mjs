/* Tests for the rebase-train pure core — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  PR_VIEW_FIELDS,
  REBASE_WORKFLOW,
  classifyPushReadiness,
  classifyRebaseOutcome,
  classifyRebaseTarget,
  composeRebaseSummary,
  conflictSummary,
  fetchRefsCommand,
  parsePrNumber,
  prViewCommand,
  pushLiteralAllowed,
  pushPrBranchCommand,
  worktreeAddCommand,
} from "./rebase.mjs";

/** An open, non-draft, same-repo PR into main — the one shape accepted. */
function pr(over = {}) {
  return {
    number: 78,
    url: "https://github.com/o/r/pull/78",
    title: "Fix the pace chart",
    state: "OPEN",
    isDraft: false,
    isCrossRepository: false,
    headRefName: "codex/pace-chart",
    baseRefName: "main",
    headRefOid: "abc1234def5678",
    ...over,
  };
}

const target = (over, liveRuns) => classifyRebaseTarget({ pr: pr(over), defaultBranch: "main", liveRuns });

function assertRefused(v, re) {
  assert.equal(v.ok, false);
  assert.equal(typeof v.reason, "string");
  assert.ok(v.reason.length > 0);
  if (re) assert.match(v.reason, re);
}

test("prViewCommand asks gh for exactly the target fields", () => {
  assert.deepEqual(prViewCommand(78), ["pr", "view", "78", "--json", PR_VIEW_FIELDS]);
  assert.equal(PR_VIEW_FIELDS, "number,url,title,state,isDraft,isCrossRepository,headRefName,baseRefName,headRefOid");
  assert.equal(REBASE_WORKFLOW, "rebase-train");
});

test("parsePrNumber accepts integers in 1..999999 only", () => {
  assert.equal(parsePrNumber("78"), 78);
  assert.equal(parsePrNumber(78), 78);
  assert.equal(parsePrNumber("999999"), 999999);
  for (const bad of ["0", 0, "abc", "-1", "1.5", 1.5, "1e3", "", undefined, null, 1000000, "1000000"]) {
    assert.equal(parsePrNumber(bad), null, `rejects ${JSON.stringify(bad)}`);
  }
});

test("classifyRebaseTarget accepts an open same-repo PR on the default branch", () => {
  assert.deepEqual(target({}), { ok: true });
});

test("classifyRebaseTarget refuses every unsafe target with a reason", () => {
  assertRefused(target({ state: "MERGED" }), /merged/);
  assertRefused(target({ state: "CLOSED" }), /closed/);
  assertRefused(target({ isDraft: true }), /draft/);
  assertRefused(target({ isCrossRepository: true }), /cross-repository/);
  assertRefused(target({ headRefName: "main" }), /default branch/);
  assertRefused(target({ headRefName: "develop", baseRefName: "develop" }), /equals its base/);
  assertRefused(target({ baseRefName: "release" }), /not the rig default branch/);
  assertRefused(target({ headRefOid: "" }), /head sha/);
  assertRefused(classifyRebaseTarget({ pr: null, defaultBranch: "main" }));
});

test("classifyRebaseTarget refuses a head owned by a live run or a PR already held", () => {
  assertRefused(
    target({}, [{ id: "feature-pace", workflow: "feature-dev", branch: "codex/pace-chart", rebasePr: null }]),
    /live run feature-pace/
  );
  assertRefused(target({}, [{ id: "rebase-pr-78", workflow: "rebase-train", branch: null, rebasePr: 78 }]), /rebase-pr-78/);
  // A live rebase run on another PR, or a live run on another branch, is fine.
  assert.equal(target({}, [{ id: "rebase-pr-81", workflow: "rebase-train", branch: null, rebasePr: 81 }]).ok, true);
  assert.equal(target({}, [{ id: "feature-y", workflow: "feature-dev", branch: "factory/feature-y", rebasePr: null }]).ok, true);
});

test("fetch and worktree argv check out the reported sha, never the ref name", () => {
  assert.deepEqual(fetchRefsCommand({ baseRef: "main", headRef: "codex/x" }), ["fetch", "origin", "main", "codex/x"]);
  assert.deepEqual(worktreeAddCommand({ worktree: "/w/rebase-pr-78", sha: "abc1234" }), ["worktree", "add", "--detach", "/w/rebase-pr-78", "abc1234"]);
});

test("classifyRebaseOutcome: clean, conflict, error", () => {
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: true }), { outcome: "clean" });
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false, unmergedFiles: ["a.ts"] }), { outcome: "conflict" });
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false, unmergedFiles: [] }), { outcome: "error" });
  assert.deepEqual(classifyRebaseOutcome({ rebaseOk: false }), { outcome: "error" });
});

test("conflictSummary starts with the founder item and names files and range", () => {
  const s = conflictSummary({ unmergedFiles: ["a.ts", "b.ts"], mergeBase: "1111111", baseSha: "2222222" });
  assert.match(s, /^conflict: needs founder/);
  assert.ok(s.includes("a.ts") && s.includes("b.ts"));
  assert.ok(s.includes("1111111..2222222"));
});

test("classifyPushReadiness names each failed invariant", () => {
  const ready = (over) =>
    classifyPushReadiness({
      rebaseInProgress: false,
      baseIsAncestor: true,
      commitsBefore: 2,
      commitsAfter: 2,
      head: "def5678",
      headShaBefore: "abc1234",
      ...over,
    });
  assert.deepEqual(ready({}), { ok: true });
  assertRefused(ready({ rebaseInProgress: true }), /rebase is still in progress/);
  assertRefused(ready({ baseIsAncestor: false }), /not an ancestor/);
  assertRefused(ready({ commitsAfter: 1 }), /commit count changed/);
  assertRefused(ready({ commitsAfter: null }), /commit count changed/);
  assertRefused(ready({ head: "abc1234" }), /unchanged/);
});

test("pushPrBranchCommand returns the exact lease push", () => {
  assert.equal(
    pushPrBranchCommand({ headRef: "codex/x", expectedSha: "abc1234", defaultBranch: "main" }),
    "git push --force-with-lease=refs/heads/codex/x:abc1234 origin HEAD:refs/heads/codex/x"
  );
  const full = "a".repeat(40);
  assert.ok(pushPrBranchCommand({ headRef: "x", expectedSha: full, defaultBranch: "main" }).includes(`:${full} `));
});

test("pushPrBranchCommand throws on anything that could aim elsewhere", () => {
  const cmd = (over) => () => pushPrBranchCommand({ headRef: "codex/x", expectedSha: "abc1234", defaultBranch: "main", ...over });
  assert.throws(cmd({ headRef: "main" }), /default branch/);
  for (const headRef of ["", "a b", "a\tb", "a:b", "-f", undefined]) assert.throws(cmd({ headRef }), /invalid PR head ref/);
  for (const expectedSha of ["abc123", "a".repeat(41), "ABC1234", "zzzzzzz", "", undefined]) {
    assert.throws(cmd({ expectedSha }), /invalid lease sha/);
  }
});

test("pushLiteralAllowed accepts only run-branch pushes and the lease push shape", () => {
  assert.equal(pushLiteralAllowed("return `git push --force-with-lease -u origin factory/${ref}`;"), true);
  assert.equal(pushLiteralAllowed(pushPrBranchCommand({ headRef: "codex/x", expectedSha: "abc1234", defaultBranch: "main" })), true);
  assert.equal(pushLiteralAllowed("git push origin main"), false);
  assert.equal(pushLiteralAllowed("git push --force origin HEAD:refs/heads/x"), false);
  assert.equal(pushLiteralAllowed("git push --force-with-lease=refs/heads/x:abc origin main"), false);
});

test("composeRebaseSummary carries the PR, both shas, the base, results, and Not merged", () => {
  const s = composeRebaseSummary({
    pr: 78,
    url: "https://github.com/o/r/pull/78",
    title: "Fix the pace chart",
    headRef: "codex/x",
    headShaBefore: "aaaaaaaaaaaa1111",
    headShaAfter: "bbbbbbbbbbbb2222",
    baseRef: "main",
    baseSha: "cccccccccccc3333",
    mergeBase: "dddddddddddd4444",
    commitsBefore: 2,
    checks: "3 checks command(s) green",
    tests: "1 tests command(s) green",
    outcome: "pushed codex/x",
  });
  for (const bit of ["PR #78", "Fix the pace chart", "https://github.com/o/r/pull/78", "aaaaaaaaaaaa", "bbbbbbbbbbbb", "main@cccccccccccc", "3 checks command(s) green", "1 tests command(s) green", "Not merged"]) {
    assert.ok(s.includes(bit), `summary includes ${bit}`);
  }
  const pending = composeRebaseSummary({ pr: 81, headRef: "x", headShaBefore: "a", conflicted: true, unmergedFiles: ["a.ts"], dryRun: true });
  assert.ok(pending.includes("not pushed") && pending.includes("Unmerged files: a.ts") && pending.includes("Dry run") && pending.includes("Not merged"));
});
