import { useEffect, useRef, useState } from "react";
import type { Workflow } from "../types";
import type { NodeInfo } from "../format";
import { fmtCost, fmtDuration } from "../format";

interface Props {
  workflow: Workflow;
  nodes: Record<string, NodeInfo>;
  selected: string | null;
  onSelect: (stepId: string) => void;
}

const NODE_W = 150;
const NODE_H = 48;
const GAP_H = 52; // gap between nodes, horizontal layout
const GAP_V = 36; // gap between nodes, vertical layout
const PAD = 12;

/**
 * Hand-rolled SVG node graph for a linear workflow DAG with onFail back-edges.
 * Desktop (wide container): horizontal rail, scrollable if long. Phone: vertical
 * rail sized to the container — no horizontal page overflow, tap to select.
 */
export function NodeGraph({ workflow, nodes, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const steps = workflow.steps;
  // Fall back to the viewport width until the container has been measured, so
  // a delayed ResizeObserver tick can't strand a wide screen in phone layout.
  const measured = width || window.innerWidth;
  const horizontal = measured >= 640;

  const subtitleOf = (stepId: string, type: string): string => {
    const info = nodes[stepId];
    if (info?.last) {
      const parts = [fmtDuration(info.last.duration_s)];
      if (info.last.cost_usd != null) parts.push(fmtCost(info.last.cost_usd));
      if (info.attempts > 1) parts.push(`×${info.attempts}`);
      return parts.join(" · ");
    }
    return type;
  };

  // Geometry per layout
  const nodeW = horizontal ? NODE_W : Math.min(Math.max(measured - 2 * PAD - 28, 180), 360);
  const pos = (i: number) =>
    horizontal
      ? { x: PAD + i * (NODE_W + GAP_H), y: PAD }
      : { x: PAD, y: PAD + i * (NODE_H + GAP_V) };

  const backEdges = steps
    .map((s, i) => ({ from: i, to: steps.findIndex((t) => t.id === s.onFail), maxLoops: s.maxLoops }))
    .filter((e) => e.to !== -1 && e.to < e.from);

  const backDepth = (k: number) => 34 + k * 16;
  const svgW = horizontal
    ? PAD * 2 + steps.length * NODE_W + (steps.length - 1) * GAP_H
    : Math.max(measured, 200);
  const svgH = horizontal
    ? PAD + NODE_H + backDepth(backEdges.length) + 16
    : PAD * 2 + steps.length * NODE_H + (steps.length - 1) * GAP_V;

  return (
    <div className={`graph-container ${horizontal ? "graph-h" : "graph-v"}`} ref={containerRef}>
      <svg
        width={horizontal ? svgW : "100%"}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        role="img"
        aria-label={`${workflow.name} workflow graph`}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="edge-arrow" />
          </marker>
          <marker id="arrow-fail" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="edge-arrow-fail" />
          </marker>
        </defs>

        {/* forward edges */}
        {steps.slice(0, -1).map((s, i) => {
          const a = pos(i);
          const b = pos(i + 1);
          const d = horizontal
            ? `M ${a.x + NODE_W} ${a.y + NODE_H / 2} L ${b.x - 2} ${b.y + NODE_H / 2}`
            : `M ${a.x + nodeW / 2} ${a.y + NODE_H} L ${b.x + nodeW / 2} ${b.y - 2}`;
          return <path key={`f-${s.id}`} d={d} className="edge" markerEnd="url(#arrow)" />;
        })}

        {/* onFail back-edges */}
        {backEdges.map((e, k) => {
          const a = pos(e.from);
          const b = pos(e.to);
          let d: string;
          let lx: number;
          let ly: number;
          if (horizontal) {
            const depth = NODE_H + backDepth(k);
            const sx = a.x + NODE_W / 2;
            const tx = b.x + NODE_W / 2;
            d = `M ${sx} ${a.y + NODE_H} C ${sx} ${a.y + depth}, ${tx} ${b.y + depth}, ${tx} ${b.y + NODE_H + 4}`;
            lx = (sx + tx) / 2;
            ly = a.y + depth - 4;
          } else {
            const depth = 30 + k * 14;
            const sx = a.x + nodeW;
            const sy = a.y + NODE_H / 2;
            const ty = b.y + NODE_H / 2;
            d = `M ${sx} ${sy} C ${sx + depth} ${sy}, ${sx + depth} ${ty}, ${sx + 4} ${ty}`;
            lx = sx + depth - 6;
            ly = (sy + ty) / 2;
          }
          return (
            <g key={`b-${e.from}-${e.to}`}>
              <path d={d} className="edge-fail" markerEnd="url(#arrow-fail)" />
              <text x={lx} y={ly} className="edge-label" textAnchor="middle">
                ↺{e.maxLoops ? ` ≤${e.maxLoops}` : ""}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {steps.map((s, i) => {
          const p = pos(i);
          const info = nodes[s.id];
          const status = info?.status ?? "pending";
          return (
            <g
              key={s.id}
              className={`gnode gnode-${status} ${selected === s.id ? "gnode-selected" : ""}`}
              transform={`translate(${p.x}, ${p.y})`}
              onClick={() => onSelect(s.id)}
              role="button"
              aria-label={`step ${s.id} (${status})`}
            >
              <rect width={nodeW} height={NODE_H} rx={10} />
              <circle cx={16} cy={NODE_H / 2} r={5} className="gnode-dot" />
              <text x={30} y={NODE_H / 2 - 4} className="gnode-title">
                {s.id}
              </text>
              <text x={30} y={NODE_H / 2 + 13} className="gnode-sub">
                {subtitleOf(s.id, s.type)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
