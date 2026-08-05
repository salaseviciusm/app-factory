/* Tests for discussion.mjs (discussion-step pure core) — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DISCUSSION_DEFAULTS,
  assembleConversation,
  lastActivityAt,
  parseReplyLines,
  pendingReplies,
  resolveOutcome,
} from "./discussion.mjs";

const TURNS = [
  { attempt: 1, at: "2026-01-01T00:00:00.000Z", text: "opening: verdict + questions" },
  { attempt: 2, at: "2026-01-01T02:00:00.000Z", text: "answer to the founder" },
];

test("parseReplyLines keeps valid lines in order and skips garbage", () => {
  const lines = [
    '{"at":"2026-01-01T01:00:00.000Z","text":"first"}',
    "not json at all",
    '{"at":"2026-01-01T01:30:00.000Z"}', // no text
    '{"text":"   "}', // blank text
    '{"text":42}', // non-string text
    "[1,2,3]", // array, not a reply object
    '{"text":"second, no timestamp"}',
    "",
  ];
  assert.deepEqual(parseReplyLines(lines), [
    { at: "2026-01-01T01:00:00.000Z", text: "first" },
    { at: null, text: "second, no timestamp" },
  ]);
});

test("assembleConversation returns the opening sentinel when empty", () => {
  assert.equal(assembleConversation([], []), "(no discussion yet — this is the opening turn)");
});

test("assembleConversation interleaves founder replies between the turns they arrived between", () => {
  const replies = [
    { at: "2026-01-01T01:00:00.000Z", text: "founder question after turn 1" },
    { at: "2026-01-01T03:00:00.000Z", text: "founder follow-up after turn 2" },
  ];
  const c = assembleConversation(TURNS, replies);
  const order = [
    "**Agent (turn 1):**",
    "founder question after turn 1",
    "**Agent (turn 2):**",
    "founder follow-up after turn 2",
  ].map((s) => c.indexOf(s));
  assert.ok(order.every((i) => i !== -1), c);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("assembleConversation puts replies with no parseable time after the last turn", () => {
  const c = assembleConversation(TURNS, [{ at: null, text: "untimed reply" }]);
  assert.ok(c.indexOf("**Agent (turn 2):**") < c.indexOf("untimed reply"));
});

test("assembleConversation puts a pre-first-turn reply first", () => {
  const c = assembleConversation(TURNS, [{ at: "2025-12-31T23:00:00.000Z", text: "early bird" }]);
  assert.ok(c.indexOf("early bird") < c.indexOf("**Agent (turn 1):**"));
});

test("pendingReplies counts only replies after the last turn", () => {
  const replies = [
    { at: "2026-01-01T01:00:00.000Z", text: "answered by turn 2" },
    { at: "2026-01-01T02:30:00.000Z", text: "pending" },
    { at: null, text: "untimed counts as pending" },
  ];
  assert.equal(pendingReplies(TURNS, replies), 2);
  assert.equal(pendingReplies([], replies), 3); // no turns yet: everything pending
  assert.equal(pendingReplies(TURNS, []), 0);
});

test("lastActivityAt picks the newest of turns and replies", () => {
  assert.equal(lastActivityAt(TURNS, []), "2026-01-01T02:00:00.000Z");
  assert.equal(
    lastActivityAt(TURNS, [{ at: "2026-01-01T05:00:00.000Z", text: "late reply" }]),
    "2026-01-01T05:00:00.000Z"
  );
  assert.equal(lastActivityAt([], [{ at: null, text: "untimed" }]), null);
});

// A live discussion 60 minutes after its last activity, well inside all bounds.
const BASE = {
  decision: null,
  pendingReplies: 0,
  turnsUsed: 2,
  maxTurns: 8,
  lastActivityAt: "2026-01-01T02:00:00.000Z",
  now: "2026-01-01T03:00:00.000Z",
  idleTimeoutMinutes: 240,
};

test("resolveOutcome: approve resolves go-ahead", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "approve" } }), { outcome: "go-ahead" });
});

test("resolveOutcome: reject resolves dont-build with the feedback", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "reject", feedback: "market too thin" } }), {
    outcome: "dont-build",
    feedback: "market too thin",
  });
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "reject" } }), {
    outcome: "dont-build",
    feedback: null,
  });
});

test("resolveOutcome: a pending reply past the turn cap is turn-cap; the cap alone keeps waiting", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, pendingReplies: 1, turnsUsed: 8 }), { outcome: "turn-cap" });
  // After the last allowed turn the founder can still approve/reject.
  assert.equal(resolveOutcome({ ...BASE, turnsUsed: 8 }), null);
});

test("resolveOutcome: silence past the idle timeout is idle-timeout", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, now: "2026-01-01T06:01:00.000Z" }), { outcome: "idle-timeout" });
  // Exactly at the bound is still waiting (strictly-greater comparison).
  assert.equal(resolveOutcome({ ...BASE, now: "2026-01-01T06:00:00.000Z" }), null);
});

test("resolveOutcome: an active discussion keeps waiting; the decision outranks every bound", () => {
  assert.equal(resolveOutcome({ ...BASE }), null);
  assert.deepEqual(
    resolveOutcome({ ...BASE, decision: { decision: "approve" }, pendingReplies: 3, turnsUsed: 8, now: "2026-02-01T00:00:00.000Z" }),
    { outcome: "go-ahead" }
  );
  const rejected = resolveOutcome({ ...BASE, decision: { decision: "reject", feedback: "no" }, pendingReplies: 3, turnsUsed: 8 });
  assert.equal(rejected.outcome, "dont-build");
});

test("resolveOutcome: an unparseable lastActivityAt never trips the idle timeout", () => {
  assert.equal(resolveOutcome({ ...BASE, lastActivityAt: null, now: "2027-01-01T00:00:00.000Z" }), null);
});

test("DISCUSSION_DEFAULTS carry the documented bounds", () => {
  assert.deepEqual(DISCUSSION_DEFAULTS, { maxTurns: 8, idleTimeoutMinutes: 240 });
});
