import { useMemo, useState } from "react";
import { compileEdits, parsePlan, type PlanEdit } from "../markdown";
import { BlockNode } from "./PlanView";

/*
 * Discussion edit mode: block-level delete / replace / comment on a FROZEN
 * snapshot of the plan, collected into a pending-edits tray and compiled into
 * one structured founder reply (only the edited parts, each quoting the
 * original). The agent stays the only writer of plan.md — this never mutates
 * run files. If the live plan drifts from the snapshot while editing (the
 * agent rewrites plan.md between turns), sending is blocked and the tray
 * offers a re-base onto the fresh text instead of mis-referencing blocks.
 */

const OP_LABEL = { delete: "delete", replace: "replace", comment: "comment" } as const;

export function PlanEditor({
  planMd,
  onSubmit,
  onCancel,
}: {
  /** Live (polled) plan text — compared against the frozen snapshot. */
  planMd: string;
  onSubmit: (reply: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [snapshot, setSnapshot] = useState(planMd);
  const [edits, setEdits] = useState<Record<string, PlanEdit>>({});
  const [draft, setDraft] = useState<{ key: string; op: "replace" | "comment"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useMemo(() => parsePlan(snapshot), [snapshot]);
  const stale = planMd !== snapshot;
  const pending = parse.blocks.filter((b) => edits[b.key]).map((b) => edits[b.key]);

  if (!parse.ok) {
    return (
      <div className="plan-editor">
        <div className="error-box">
          Cannot edit: the plan markdown failed to parse ({parse.problems.join("; ")}). Reply via reject/steer instead.
        </div>
        <button className="btn btn-ghost" onClick={onCancel}>
          Close editor
        </button>
      </div>
    );
  }

  const setEdit = (edit: PlanEdit) => {
    setEdits((prev) => ({ ...prev, [edit.block.key]: edit }));
    setDraft(null);
  };
  const clearEdit = (key: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const rebase = () => {
    setSnapshot(planMd);
    setEdits({});
    setDraft(null);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(compileEdits(pending));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="plan-editor">
      <p className="pe-hint">
        Edit the plan block by block — deletes, rewrites, and comments are compiled into one reply to the discussion
        agent, which applies them to the plan.
      </p>
      {stale && (
        <div className="error-box">
          The plan changed while you were editing (the agent posted a new turn). Sending is paused so edits don’t
          reference stale text.{" "}
          <button className="btn btn-ghost" onClick={rebase}>
            Re-base on the fresh plan (discards pending edits)
          </button>
        </div>
      )}
      <div className="markdown pe-blocks">
        {parse.blocks.map((block) => {
          const edit = edits[block.key];
          const editing = draft?.key === block.key;
          return (
            <div key={block.key} className={`pe-block${edit?.op === "delete" ? " pe-deleted" : ""}`}>
              <div className="pe-block-body">
                {edit?.op === "replace" ? (
                  <pre className="pe-replacement">{edit.text}</pre>
                ) : (
                  <BlockNode block={block} />
                )}
                {edit?.op === "comment" && <span className="pe-comment-chip">💬 {edit.text}</span>}
              </div>
              {editing ? (
                <div className="pe-draft">
                  <textarea
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    rows={draft.op === "replace" ? 4 : 2}
                    placeholder={draft.op === "replace" ? "Replacement text (markdown)" : "Comment for the agent"}
                    autoFocus
                  />
                  <div className="pe-actions">
                    <button
                      className="btn btn-steer"
                      disabled={!draft.text.trim()}
                      onClick={() => setEdit({ block, op: draft.op, text: draft.text.trim() })}
                    >
                      {draft.op === "replace" ? "Set replacement" : "Attach comment"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pe-actions">
                  {edit ? (
                    <button className="btn btn-ghost" onClick={() => clearEdit(block.key)}>
                      ↺ undo {OP_LABEL[edit.op]}
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={() => setEdit({ block, op: "delete", text: "" })}>
                        ✕ delete
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => setDraft({ key: block.key, op: "replace", text: block.raw })}
                      >
                        ✎ replace
                      </button>
                      <button className="btn btn-ghost" onClick={() => setDraft({ key: block.key, op: "comment", text: "" })}>
                        💬 comment
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pe-tray">
        <h4>
          Pending edits <span className="pe-tray-count">{pending.length}</span>
        </h4>
        {pending.length === 0 ? (
          <p className="pe-hint">No edits yet — delete, replace, or comment on a block above.</p>
        ) : (
          <ul className="pe-tray-list">
            {pending.map((e) => (
              <li key={e.block.key}>
                <strong>{OP_LABEL[e.op]}</strong> — {e.block.section ?? "preamble"}, {e.block.label}
                <button className="btn btn-ghost" onClick={() => clearEdit(e.block.key)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="gate-actions">
          <button className="btn btn-primary" disabled={busy || stale || pending.length === 0} onClick={() => void send()}>
            {busy ? "Sending…" : `Send ${pending.length || ""} edit(s) to the agent`}
          </button>
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            Cancel editing
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}
