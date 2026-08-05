import type { RunSummary } from "../types";
import { Badge } from "./Badge";
import { fmtWhen, stateKind, stateLabel, usageLine } from "../format";

interface Props {
  runs: RunSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RunList({ runs, selectedId, onSelect }: Props) {
  if (runs.length === 0) {
    return <div className="empty-state">No runs yet. Start one from “New run”.</div>;
  }
  return (
    <ul className="run-list">
      {runs.map((r) => {
        const usage = usageLine(r.usage);
        return (
          <li key={r.id}>
            <button
              className={`run-card ${selectedId === r.id ? "run-card-selected" : ""}`}
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
                  <Badge kind="merge" title={`Run finished green — merge factory/${r.id} when happy (local merge only)`}>
                    merge factory/{r.id} when happy
                  </Badge>
                )}
                {r.deployHeld && <Badge kind="warn" title="Deploy held by rig policy — release it from the run page">deploy held</Badge>}
                {r.stalled && <Badge kind="warn" title="No update in >10 min — executor may be dead. Open the run to retry.">stalled?</Badge>}
                {r.worktreeMissing && <Badge kind="muted" title="The run's git worktree directory no longer exists">no worktree</Badge>}
                {r.source === "db" && <Badge kind="muted" title="Run directory deleted; showing telemetry only">telemetry only</Badge>}
                {r.auto && <Badge kind="muted" title="Plan gate skipped (--auto)">auto</Badge>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
