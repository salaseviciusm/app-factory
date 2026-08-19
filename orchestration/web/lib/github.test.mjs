/* Tests for github.mjs — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  commitUrl,
  compareUrl,
  githubWebUrl,
  parsePrAttention,
  parsePrCreateUrl,
  parsePrList,
  parsePrStatus,
  prAttentionListCommand,
  prChecksUrl,
  prCreateCommand,
  prListCommand,
  prStatusCommand,
  repoUrlForRig,
  rigCheckoutPath,
  slackLink,
} from "./github.mjs";

test("githubWebUrl normalizes GitHub remotes", () => {
  assert.equal(
    githubWebUrl("git@github.com:salaseviciusm/app-factory.git"),
    "https://github.com/salaseviciusm/app-factory"
  );
  assert.equal(githubWebUrl("ssh://git@github.com/owner/repo.git"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo.git"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo/\n"), "https://github.com/owner/repo");
});

test("githubWebUrl rejects non-GitHub or malformed remotes", () => {
  assert.equal(githubWebUrl("git@gitlab.com:owner/repo.git"), null);
  assert.equal(githubWebUrl("https://example.com/owner/repo"), null);
  assert.equal(githubWebUrl("/local/bare/repo.git"), null);
  assert.equal(githubWebUrl(""), null);
  assert.equal(githubWebUrl(undefined), null);
});

test("rigCheckoutPath resolves rigs.json entries and factory:<app> rigs", (t) => {
  const orchDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-test-"));
  t.after(() => fs.rmSync(orchDir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(orchDir, "rigs.json"),
    JSON.stringify({
      rigs: { "some-rig": { path: "/srv/some-rig" } },
      factoryApps: { basePath: "/srv/apps" },
    })
  );
  assert.equal(rigCheckoutPath(orchDir, "some-rig"), "/srv/some-rig");
  assert.equal(rigCheckoutPath(orchDir, "factory:my-app"), path.join("/srv/apps", "my-app"));
  assert.equal(rigCheckoutPath(orchDir, "unknown-rig"), null);
  assert.equal(rigCheckoutPath(orchDir, null), null);
});

test("repoUrlForRig reads the origin remote of a real checkout, null otherwise", (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gh-test-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const repoDir = path.join(tmp, "checkout");
  fs.mkdirSync(repoDir);
  execFileSync("git", ["-C", repoDir, "init", "-q"]);
  execFileSync("git", ["-C", repoDir, "remote", "add", "origin", "git@github.com:owner/repo.git"]);
  const orchDir = path.join(tmp, "orch");
  fs.mkdirSync(orchDir);
  fs.writeFileSync(
    path.join(orchDir, "rigs.json"),
    JSON.stringify({ rigs: { good: { path: repoDir }, gone: { path: path.join(tmp, "missing") } } })
  );
  assert.equal(repoUrlForRig(orchDir, "good"), "https://github.com/owner/repo");
  assert.equal(repoUrlForRig(orchDir, "gone"), null);
  assert.equal(repoUrlForRig(orchDir, "never-registered"), null);
});

test("pr command builders emit the exact gh argv", () => {
  assert.deepEqual(prListCommand("factory/feature-x"), [
    "pr", "list", "--head", "factory/feature-x", "--state", "open", "--json", "number,url",
  ]);
  assert.deepEqual(prCreateCommand({ branch: "factory/feature-x", base: "main", title: "T", body: "B" }), [
    "pr", "create", "--head", "factory/feature-x", "--base", "main", "--title", "T", "--body", "B",
  ]);
  assert.deepEqual(prStatusCommand(12), ["pr", "view", "12", "--json", "state,mergedAt,mergeCommit"]);
});

test("parsePrList keeps well-formed open PRs and degrades garbage to []", () => {
  assert.deepEqual(parsePrList([{ number: 7, url: "https://github.com/o/r/pull/7" }]), [
    { number: 7, url: "https://github.com/o/r/pull/7" },
  ]);
  assert.deepEqual(parsePrList([{ number: "7" }, null, { url: "x" }, { number: 8, url: "https://github.com/o/r/pull/8" }]), [
    { number: 8, url: "https://github.com/o/r/pull/8" },
  ]);
  assert.deepEqual(parsePrList(null), []);
  assert.deepEqual(parsePrList({ number: 7 }), []);
});

test("parsePrCreateUrl extracts the PR number/url from gh pr create output", () => {
  assert.deepEqual(parsePrCreateUrl("Creating pull request for factory/x into main\nhttps://github.com/o/r/pull/42\n"), {
    number: 42,
    url: "https://github.com/o/r/pull/42",
  });
  assert.equal(parsePrCreateUrl("no url here"), null);
  assert.equal(parsePrCreateUrl(""), null);
});

test("slackLink renders mrkdwn links and escapes the label", () => {
  assert.equal(slackLink("https://github.com/o/r/pull/7", "PR #7"), "<https://github.com/o/r/pull/7|PR #7>");
  assert.equal(
    slackLink("https://github.com/o/r", "a & b <c> >d"),
    "<https://github.com/o/r|a &amp; b &lt;c&gt; &gt;d>"
  );
  assert.equal(slackLink("http://127.0.0.1:4620/#/run/x", "run x"), "<http://127.0.0.1:4620/#/run/x|run x>");
});

test("slackLink degrades to null instead of a broken <|> fragment", () => {
  assert.equal(slackLink(null, "label"), null);
  assert.equal(slackLink("", "label"), null);
  assert.equal(slackLink("not a url", "label"), null);
  assert.equal(slackLink("ftp://example.com/x", "label"), null);
  assert.equal(slackLink("https://github.com/o/r", ""), null);
  assert.equal(slackLink("https://github.com/o/r", "   "), null);
  assert.equal(slackLink("https://github.com/o/r", null), null);
});

test("commitUrl builds commit pages and rejects unusable inputs", () => {
  assert.equal(commitUrl("https://github.com/o/r", "abc123d"), "https://github.com/o/r/commit/abc123d");
  assert.equal(
    commitUrl("https://github.com/o/r", "0f9e8d7c6b5a43210f9e8d7c6b5a43210f9e8d7c"),
    "https://github.com/o/r/commit/0f9e8d7c6b5a43210f9e8d7c6b5a43210f9e8d7c"
  );
  assert.equal(commitUrl(null, "abc123d"), null);
  assert.equal(commitUrl("https://github.com/o/r", null), null);
  assert.equal(commitUrl("https://github.com/o/r", ""), null);
  assert.equal(commitUrl("https://github.com/o/r", "not-a-sha"), null);
  assert.equal(commitUrl("https://github.com/o/r", "abc"), null);
});

test("compareUrl builds base...branch compare views and rejects missing parts", () => {
  assert.equal(
    compareUrl("https://github.com/o/r", "main", "factory/feature-x"),
    "https://github.com/o/r/compare/main...factory/feature-x"
  );
  assert.equal(compareUrl(null, "main", "factory/feature-x"), null);
  assert.equal(compareUrl("https://github.com/o/r", "", "factory/feature-x"), null);
  assert.equal(compareUrl("https://github.com/o/r", "main", "  "), null);
  assert.equal(compareUrl("https://github.com/o/r", "main", null), null);
});

test("prChecksUrl points at the PR checks page, null for non-PR URLs", () => {
  assert.equal(prChecksUrl("https://github.com/o/r/pull/42"), "https://github.com/o/r/pull/42/checks");
  assert.equal(prChecksUrl("https://github.com/o/r"), null);
  assert.equal(prChecksUrl("https://example.com/o/r/pull/42"), null);
  assert.equal(prChecksUrl(null), null);
  assert.equal(prChecksUrl(""), null);
});

test("prAttentionListCommand emits the exact gh argv", () => {
  assert.deepEqual(prAttentionListCommand(), [
    "pr", "list", "--state", "open",
    "--json", "number,title,url,createdAt,reviewDecision,mergeable,statusCheckRollup,isDraft",
  ]);
});

test("parsePrAttention classifies open PRs by founder attention", () => {
  const pr = (over) => ({
    number: 1,
    title: "T",
    url: "https://github.com/o/r/pull/1",
    createdAt: "2026-08-01T00:00:00Z",
    reviewDecision: "",
    mergeable: "MERGEABLE",
    statusCheckRollup: [{ conclusion: "SUCCESS" }],
    isDraft: false,
    ...over,
  });
  assert.equal(parsePrAttention([pr({ reviewDecision: "APPROVED" })])[0].attention, "approved-mergeable");
  assert.equal(parsePrAttention([pr({ reviewDecision: "REVIEW_REQUIRED" })])[0].attention, "review-requested");
  // No review decision at all: every factory PR is founder-merged, so an
  // unreviewed open PR is still his to look at.
  assert.equal(parsePrAttention([pr({})])[0].attention, "review-requested");
  assert.equal(
    parsePrAttention([pr({ reviewDecision: "APPROVED", statusCheckRollup: [{ conclusion: "FAILURE" }] })])[0].attention,
    "failing-checks"
  );
  assert.equal(parsePrAttention([pr({ reviewDecision: "CHANGES_REQUESTED" })])[0].attention, "none");
  assert.equal(parsePrAttention([pr({ reviewDecision: "APPROVED", mergeable: "CONFLICTING" })])[0].attention, "none");
});

test("parsePrAttention summarizes checks and fills the entry shape", () => {
  const [entry] = parsePrAttention([
    {
      number: 9,
      title: "Add thing",
      url: "https://github.com/o/r/pull/9",
      createdAt: "2026-08-10T09:00:00Z",
      reviewDecision: "REVIEW_REQUIRED",
      mergeable: "UNKNOWN",
      statusCheckRollup: [{ conclusion: "SUCCESS" }, { status: "IN_PROGRESS" }],
      isDraft: false,
    },
  ]);
  assert.deepEqual(entry, {
    number: 9,
    title: "Add thing",
    url: "https://github.com/o/r/pull/9",
    createdAt: "2026-08-10T09:00:00Z",
    attention: "review-requested",
    checks: "pending",
  });
  assert.equal(parsePrAttention([{ number: 2, url: "u", statusCheckRollup: [] }])[0].checks, "none");
  assert.equal(parsePrAttention([{ number: 3, url: "u", statusCheckRollup: [{ state: "FAILURE" }] }])[0].checks, "failing");
  assert.equal(parsePrAttention([{ number: 4, url: "u", statusCheckRollup: [{ state: "SUCCESS" }] }])[0].checks, "passing");
});

test("parsePrAttention excludes drafts and degrades garbage safely", () => {
  assert.deepEqual(parsePrAttention([{ number: 1, url: "https://github.com/o/r/pull/1", isDraft: true }]), []);
  assert.deepEqual(parsePrAttention(null), []);
  assert.deepEqual(parsePrAttention("gh exploded"), []);
  assert.deepEqual(parsePrAttention({ number: 1 }), []);
  // Malformed entries are skipped, well-formed ones survive.
  const kept = parsePrAttention([null, { url: "x" }, { number: "5", url: "x" }, ["nope"], {
    number: 5,
    url: "https://github.com/o/r/pull/5",
  }]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].number, 5);
  assert.equal(kept[0].title, "");
  assert.equal(kept[0].createdAt, null);
  assert.equal(kept[0].checks, "none");
});

test("parsePrStatus normalizes gh pr view JSON to open/merged/closed", () => {
  assert.deepEqual(
    parsePrStatus({ state: "MERGED", mergedAt: "2026-08-09T10:00:00Z", mergeCommit: { oid: "abc123def456" } }),
    { state: "merged", mergedAt: "2026-08-09T10:00:00Z", mergeCommit: "abc123def456" }
  );
  assert.deepEqual(parsePrStatus({ state: "OPEN", mergedAt: null, mergeCommit: null }), {
    state: "open",
    mergedAt: null,
    mergeCommit: null,
  });
  assert.deepEqual(parsePrStatus({ state: "CLOSED" }), { state: "closed", mergedAt: null, mergeCommit: null });
  assert.equal(parsePrStatus({ state: "DRAFT?" }), null);
  assert.equal(parsePrStatus(null), null);
  assert.equal(parsePrStatus("MERGED"), null);
});
