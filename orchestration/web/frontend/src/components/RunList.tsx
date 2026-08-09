import type { RunSummary } from "../types";
import { Badge } from "./Badge";
import { RUN_SECTIONS, fmtWhen, runSection, stateKind, stateLabel, usageLine } from "../format";

interface Props {
  runs: RunSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function RunCard({ run: r, selected, onSelect }: { run: RunSummary; selected: boolean; onSelect: (id: string) => void }) {
  const usage = usageLine(r.usage);
  return (
    <button
      className={`run-card ${selected ? "run-card-selected" : ""}`}
      onClick={() => onSelect(r.id)}
    >
      <div className="run-card-top">
        <span className="run-id">{r.id}</span>
        <Badge kind={stateKind(r.state)}>{stateLabel(r.state)}</Badge>
      </div>
      <div className="run-card-prompt">{r.prompt.split("\n")[0].slice(0, 120) || "(no prompt)"}</div>
      <div className="run-card-meta">
        <span>{r.rig}</span>
        <span>{r.workflow}</span>
        <span>{fmtWhen(r.createdAt)}</span>
        {usage && <span>{usage.split(" · ")[0]}</span>}
      </div>
      <div className="run-card-flags">
        {r.state === "awaiting-merge" && (
          <Badge
            kind="merge"
            title={
              r.pr
                ? `Run finished green — review & merge PR #${r.pr.number}, then Sync marks it done`
                : `Run finished green — merge ${r.branch} when happy (local merge only)`
            }
          >
            {r.pr ? `merge PR #${r.pr.number}` : `merge ${r.branch} when happy`}
          </Badge>
        )}
        {r.deployHeld && <Badge kind="warn" title="Deploy held by rig policy — release it from the run page">deploy held</Badge>}
        {r.stalled && <Badge kind="warn" title="No update in >10 min — executor may be dead. Open the run to retry.">stalled?</Badge>}
        {r.worktreeMissing && <Badge kind="muted" title="The run's git worktree directory no longer exists">no worktree</Badge>}
        {r.source === "db" && <Badge kind="muted" title="Run directory deleted; showing telemetry only">telemetry only</Badge>}
        {r.auto && <Badge kind="muted" title="Plan gate skipped (--auto)">auto</Badge>}
      </div>
    </button>
  );
}

/** Order a section's runs by lineage: chain members sit directly under their
 *  root (depth-first, keeping the incoming newest-first order among siblings)
 *  and are flagged `chained` for the indent. A run whose parent lives in
 *  another section still indents — the lineage is real either way. */
function groupByLineage(runs: RunSummary[]): { run: RunSummary; chained: boolean }[] {
  const ids = new Set(runs.map((r) => r.id));
  const children = new Map<string, RunSummary[]>();
  const roots: RunSummary[] = [];
  for (const r of runs) {
    if (r.parentRun && ids.has(r.parentRun)) {
      const list = children.get(r.parentRun) ?? [];
      list.push(r);
      children.set(r.parentRun, list);
    } else {
      roots.push(r);
    }
  }
  const out: { run: RunSummary; chained: boolean }[] = [];
  const visit = (r: RunSummary) => {
    out.push({ run: r, chained: Boolean(r.parentRun) });
    for (const c of children.get(r.id) ?? []) visit(c);
  };
  for (const r of roots) visit(r);
  return out;
}

export function RunList({ runs, selectedId, onSelect }: Props) {
  if (runs.length === 0) {
    return <div className="empty-state">No runs yet. Start one from “New run”.</div>;
  }
  return (
    <div className="run-sections">
      {RUN_SECTIONS.map(({ key, label }) => {
        const sectionRuns = groupByLineage(runs.filter((r) => runSection(r.state) === key));
        if (sectionRuns.length === 0) return null;
        return (
          <section key={key} className="run-section">
            <h3 className="run-section-header">
              {label} <span className="run-section-count">{sectionRuns.length}</span>
            </h3>
            <ul className="run-list">
              {sectionRuns.map(({ run: r, chained }) => (
                <li key={r.id} className={chained ? "run-chained" : ""}>
                  <RunCard run={r} selected={selectedId === r.id} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
