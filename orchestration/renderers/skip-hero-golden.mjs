/*
 * skip-hero-golden: check-gate renderer for skip-hero's golden-master
 * regression check (`npm run golden:check`).
 *
 * Contract (loadRenderer in bin/factory-run): export render(ctx) ->
 * { text, mediaPath } — synchronous. ctx: { run, rig, check, failure: { cmd,
 * output, status }, runDir, artifactsDir, worktree, log }. A falsy/empty
 * `text` (or a throw) makes the engine degrade to the failing command's
 * output tail — the gate itself is never skipped or blank.
 *
 * What it produces, all under ctx.artifactsDir (run dir/check-gate/, served
 * by the web console's token-gated /gate/ routes):
 *   golden-report.json  — full matched/failed pairing (golden-check --report)
 *   timeline.svg/.png   — golden-vs-run event timeline, one lane per event
 *                         type; matched, time-shifted, missing, unexpected,
 *                         and mismatched events visually distinct. The PNG is
 *                         the Slack attachment (notify mediaPath).
 *   <fixture>.debug.mov — annotated debug video of the fixture (borrowed
 *                         .MOV from the rig's main checkout — examples/*.mov
 *                         is gitignored, so the worktree has no source video
 *                         — rendered by scripts/debug-video.sh, ~190MB, far
 *                         too big for Slack: web-console download only).
 *   <fixture>.debug-preview.png — annotated preview frame when produced.
 *
 * Every stage degrades independently: no report → engine tail fallback; no
 * rasterizer → text-only gate; no video → gate with image + numbers.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPORT_FILE = "golden-report.json";
const SVG_FILE = "timeline.svg";
const PNG_FILE = "timeline.png";
const CHECK_TIMEOUT_MIN = 15;
const VIDEO_TIMEOUT_MIN = 15;
const MAX_FAILURE_LINES = 20;

const q = (s) => JSON.stringify(s);

function run(cmd, cwd, timeoutMinutes) {
  const res = spawnSync("bash", ["-lc", cmd], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMinutes * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: res.status === 0, status: res.status, output: (res.stdout || "") + (res.stderr || "") };
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/** mm:ss.mmm, mirroring golden-check.ts's own formatting. */
export function fmtTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
}

function fmtEvent(event) {
  const fields = Object.entries(event.fields || {})
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  return `${event.type} @ ${fmtTime(event.t)}${fields ? ` (${fields})` : ""}`;
}

/**
 * Deterministic digest of a golden-check --report document (pure, exercised
 * by factory-run selftest): per-type matched/golden-total counts, the max
 * matched |Δt|, and one line per missing/unexpected/mismatched/time-shifted
 * event. "Time-shifted" = a matched pair whose |Δt| exceeds the per-event
 * tolerance (pairs stay pairable up to twice the tolerance).
 */
export function summarizeReport(report) {
  const perType = new Map(); // type -> { matched, golden }
  const bump = (type, key) => {
    const row = perType.get(type) || { matched: 0, golden: 0 };
    row[key] += 1;
    perType.set(type, row);
  };
  const failureLines = [];
  const failing = [];
  let maxAbsDeltaMs = 0;
  let toleranceMs = 50;
  let totalFailures = 0;

  for (const fx of report.fixtures || []) {
    const c = fx.comparison;
    toleranceMs = fx.timingToleranceMs ?? toleranceMs;
    if (!c) {
      failing.push(fx.fixture);
      failureLines.push(`${fx.fixture}: no comparison possible (missing golden or fixture changed) — see the checks log`);
      totalFailures += 1;
      continue;
    }
    if (!c.pass) failing.push(fx.fixture);
    for (const pair of c.matched || []) {
      bump(pair.expected.type, "matched");
      bump(pair.expected.type, "golden");
      maxAbsDeltaMs = Math.max(maxAbsDeltaMs, Math.abs(pair.deltaMs));
      if (Math.abs(pair.deltaMs) > (fx.timingToleranceMs ?? toleranceMs)) {
        failureLines.push(`shifted     ${fmtEvent(pair.expected)} (Δ ${pair.deltaMs > 0 ? "+" : ""}${pair.deltaMs.toFixed(0)}ms)`);
      }
    }
    for (const f of c.failures || []) {
      totalFailures += 1;
      switch (f.reason) {
        case "missing":
          bump(f.expected.type, "golden");
          failureLines.push(`missing     ${fmtEvent(f.expected)} — in golden, not produced by this run`);
          break;
        case "unexpected":
          failureLines.push(`unexpected  ${fmtEvent(f.actual)} — produced by this run, not in golden`);
          break;
        case "type-mismatch":
          bump(f.expected.type, "golden");
          failureLines.push(`type-shift  golden ${fmtEvent(f.expected)} ↔ run ${fmtEvent(f.actual)} (Δ ${f.deltaMs.toFixed(0)}ms)`);
          break;
        case "field-mismatch":
          bump(f.expected.type, "golden");
          failureLines.push(
            `fields      ${fmtEvent(f.expected)} (Δ ${f.deltaMs.toFixed(0)}ms): ${(f.fields || [])
              .map((k) => `${k} '${f.expected.fields[k] ?? "null"}' → '${f.actual.fields[k] ?? "null"}'`)
              .join(", ")}`
          );
          break;
      }
    }
    for (const m of c.producerMismatches || []) {
      totalFailures += 1;
      failureLines.push(`version     ${m.type}: golden '${m.expected ?? "—"}' vs run '${m.actual ?? "—"}' (detector version drift)`);
    }
  }
  return {
    failing,
    perType: [...perType.entries()].sort().map(([type, row]) => ({ type, ...row })),
    maxAbsDeltaMs,
    toleranceMs,
    failureLines,
    totalFailures,
  };
}

// ---------- SVG timeline ----------

const LANE_H = 56;
const GUTTER = 230;
const PLOT_W = 1150;
const TOP = 46;

const MARK_STYLE = {
  matched: { color: "#2da44e", label: "matched" },
  shifted: { color: "#d4a72c", label: "time-shifted (|Δt| > tolerance)" },
  missing: { color: "#cf222e", label: "missing (golden only)" },
  unexpected: { color: "#8250df", label: "unexpected (run only)" },
  "field-mismatch": { color: "#bc4c00", label: "field mismatch" },
  "type-mismatch": { color: "#cf222e", label: "type mismatch" },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Golden-vs-run event timeline for one fixture's comparison (pure, exercised
 * by factory-run selftest): one lane per event type; matched dots, amber
 * time-shifted pairs with a divergence connector, red open circles for
 * missing, purple crosses for unexpected, diamonds for mismatches.
 */
export function buildTimelineSvg(fixture, comparison, toleranceMs) {
  const marks = [];
  for (const pair of comparison.matched || []) {
    const shifted = Math.abs(pair.deltaMs) > toleranceMs;
    marks.push({ type: pair.expected.type, t: pair.actual.t, fromT: pair.expected.t, kind: shifted ? "shifted" : "matched" });
  }
  for (const f of comparison.failures || []) {
    if (f.reason === "missing") marks.push({ type: f.expected.type, t: f.expected.t, kind: "missing" });
    else if (f.reason === "unexpected") marks.push({ type: f.actual.type, t: f.actual.t, kind: "unexpected" });
    else marks.push({ type: f.expected.type, t: f.expected.t, fromT: f.expected.t, toT: f.actual.t, kind: f.reason });
  }
  const types = [...new Set(marks.map((m) => m.type))].sort();
  const maxT = Math.max(1000, ...marks.map((m) => Math.max(m.t, m.toT ?? 0, m.fromT ?? 0)));
  const width = GUTTER + PLOT_W + 40;
  const height = TOP + types.length * LANE_H + 88;
  const x = (t) => GUTTER + (t / maxT) * PLOT_W;
  const laneY = (type) => TOP + types.indexOf(type) * LANE_H + LANE_H / 2;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Helvetica, Arial, sans-serif">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="16" y="26" font-size="17" font-weight="bold" fill="#1f2328">${esc(fixture)} — golden vs run event timeline (pairing tolerance ±${toleranceMs}ms)</text>`
  );
  // Lanes + labels.
  types.forEach((type, i) => {
    const y = TOP + i * LANE_H;
    parts.push(
      `<rect x="${GUTTER}" y="${y}" width="${PLOT_W}" height="${LANE_H}" fill="${i % 2 ? "#f6f8fa" : "#ffffff"}"/>`,
      `<line x1="${GUTTER}" y1="${y + LANE_H / 2}" x2="${GUTTER + PLOT_W}" y2="${y + LANE_H / 2}" stroke="#d0d7de" stroke-width="1"/>`,
      `<text x="${GUTTER - 12}" y="${y + LANE_H / 2 + 4}" font-size="13" text-anchor="end" fill="#1f2328">${esc(type)}</text>`
    );
  });
  // Time axis: ~8 ticks rounded to whole seconds.
  const axisY = TOP + types.length * LANE_H;
  const tickStep = Math.max(1000, Math.ceil(maxT / 8 / 1000) * 1000);
  for (let t = 0; t <= maxT; t += tickStep) {
    parts.push(
      `<line x1="${x(t)}" y1="${TOP}" x2="${x(t)}" y2="${axisY}" stroke="#d0d7de" stroke-width="0.5"/>`,
      `<text x="${x(t)}" y="${axisY + 16}" font-size="11" text-anchor="middle" fill="#57606a">${esc(fmtTime(t))}</text>`
    );
  }
  // Marks. Divergence connectors first so dots draw on top.
  for (const m of marks) {
    const y = laneY(m.type);
    const color = MARK_STYLE[m.kind].color;
    if (m.kind === "shifted" && m.fromT !== undefined) {
      parts.push(
        `<line x1="${x(m.fromT)}" y1="${y}" x2="${x(m.t)}" y2="${y}" stroke="${color}" stroke-width="3"/>`,
        `<line x1="${x(m.fromT)}" y1="${y - 7}" x2="${x(m.fromT)}" y2="${y + 7}" stroke="${color}" stroke-width="2"/>`
      );
    }
    if (m.kind === "type-mismatch" && m.toT !== undefined) {
      parts.push(`<line x1="${x(m.fromT)}" y1="${y}" x2="${x(m.toT)}" y2="${y}" stroke="${color}" stroke-width="2" stroke-dasharray="4 3"/>`);
    }
    if (m.kind === "matched") {
      parts.push(`<circle cx="${x(m.t)}" cy="${y}" r="4" fill="${color}"/>`);
    } else if (m.kind === "shifted") {
      parts.push(`<circle cx="${x(m.t)}" cy="${y}" r="5" fill="${color}"/>`);
    } else if (m.kind === "missing") {
      parts.push(`<circle cx="${x(m.t)}" cy="${y}" r="6" fill="none" stroke="${color}" stroke-width="2.5"/>`);
    } else if (m.kind === "unexpected") {
      const r = 5;
      parts.push(
        `<line x1="${x(m.t) - r}" y1="${y - r}" x2="${x(m.t) + r}" y2="${y + r}" stroke="${color}" stroke-width="2.5"/>`,
        `<line x1="${x(m.t) - r}" y1="${y + r}" x2="${x(m.t) + r}" y2="${y - r}" stroke="${color}" stroke-width="2.5"/>`
      );
    } else {
      const r = 6;
      parts.push(`<path d="M ${x(m.t)} ${y - r} L ${x(m.t) + r} ${y} L ${x(m.t)} ${y + r} L ${x(m.t) - r} ${y} Z" fill="${color}"/>`);
    }
  }
  // Legend, only for kinds actually present.
  const present = [...new Set(marks.map((m) => m.kind))];
  let lx = 16;
  const ly = axisY + 44;
  for (const kind of Object.keys(MARK_STYLE).filter((k) => present.includes(k))) {
    const { color, label } = MARK_STYLE[kind];
    parts.push(
      `<circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${kind === "missing" ? "none" : color}" ${kind === "missing" ? `stroke="${color}" stroke-width="2"` : ""}/>`,
      `<text x="${lx + 16}" y="${ly}" font-size="12" fill="#1f2328">${esc(label)}</text>`
    );
    lx += 16 + label.length * 6.4 + 28;
  }
  parts.push("</svg>");
  return parts.join("\n");
}

// ---------- rasterize + debug video ----------

/** Width/height from a PNG's IHDR chunk, or null. */
function pngDimensions(p) {
  try {
    const buf = fs.readFileSync(p);
    if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/** True when the PNG's aspect ratio is within 10% of the SVG's — Quick Look
 *  is known to stretch SVGs into a square canvas, and a distorted timeline
 *  would mislead the founder's judgment (worse than no image). */
function aspectOk(pngPath, expected, log) {
  const dims = pngDimensions(pngPath);
  if (!dims || !dims.width || !dims.height) return false;
  const want = expected.width / expected.height;
  const got = dims.width / dims.height;
  if (Math.abs(got - want) / want > 0.1) {
    log(`rasterized PNG aspect ${dims.width}x${dims.height} distorts the ${expected.width}x${expected.height} timeline; discarding it`);
    fs.rmSync(pngPath, { force: true });
    return false;
  }
  return true;
}

/** SVG → PNG: npx sharp-cli first, qlmanage (macOS Quick Look) fallback,
 *  both aspect-validated. Returns true when a faithful PNG exists after. */
function rasterize(svgPath, pngPath, expected, cwd, log) {
  const a = run(`npx --yes sharp-cli -i ${q(svgPath)} -o ${q(pngPath)}`, cwd, 5);
  if (a.ok && fs.existsSync(pngPath) && aspectOk(pngPath, expected, log)) return true;
  log(`sharp-cli rasterize failed or was discarded (exit ${a.status}); trying qlmanage`);
  const outDir = path.dirname(pngPath);
  const b = run(`qlmanage -t -s ${expected.width} -o ${q(outDir)} ${q(svgPath)}`, cwd, 5);
  const qlOut = path.join(outDir, `${path.basename(svgPath)}.png`);
  if (b.ok && fs.existsSync(qlOut)) {
    fs.renameSync(qlOut, pngPath);
    if (aspectOk(pngPath, expected, log)) return true;
  }
  log(`qlmanage rasterize failed (exit ${b.status}); gate goes out without a PNG (the run page still shows the SVG)`);
  return false;
}

/** Annotated debug video for one fixture, into ctx.artifactsDir. The source
 *  .MOV is gitignored, so it is borrowed from the rig's main checkout; the
 *  committed recording JSON means pose extraction is skipped, and the stale
 *  trace is deleted so the current detectors re-trace. Time-boxed. */
function generateDebugVideo(ctx, fixture, log) {
  const mainExamples = path.join(ctx.rig.path, "examples");
  const mov = [".MOV", ".mov"].map((ext) => path.join(mainExamples, `${fixture}${ext}`)).find((p) => fs.existsSync(p));
  if (!mov) return { ok: false, reason: `no ${fixture}.MOV in ${mainExamples}` };
  const wtMov = path.join(ctx.worktree, "examples", path.basename(mov));
  if (!fs.existsSync(wtMov)) fs.copyFileSync(mov, wtMov);
  fs.rmSync(path.join(ctx.worktree, "examples", `${fixture}.trace.json`), { force: true });
  log(`rendering debug video for ${fixture} (time-boxed ${VIDEO_TIMEOUT_MIN}m)`);
  const r = run(`scripts/debug-video.sh ${q(path.join("examples", path.basename(mov)))}`, ctx.worktree, VIDEO_TIMEOUT_MIN);
  const debugMov = wtMov.replace(/\.[^.]+$/, ".debug.mov");
  if (!r.ok || !fs.existsSync(debugMov)) {
    return { ok: false, reason: `debug-video.sh failed (exit ${r.status}): ${r.output.split("\n").filter(Boolean).slice(-3).join(" | ").slice(0, 200)}` };
  }
  const dest = path.join(ctx.artifactsDir, path.basename(debugMov));
  fs.copyFileSync(debugMov, dest);
  const preview = wtMov.replace(/\.[^.]+$/, ".debug-preview.png");
  if (fs.existsSync(preview)) fs.copyFileSync(preview, path.join(ctx.artifactsDir, path.basename(preview)));
  return { ok: true, file: path.basename(dest) };
}

// ---------- entry point ----------

export function render(ctx) {
  const log = ctx.log || (() => {});
  const reportPath = path.join(ctx.artifactsDir, REPORT_FILE);

  // Re-run the check with --report to capture the full pairing. A non-zero
  // exit is expected — that failure is why the gate is opening.
  const rr = run(`npm run golden:check -- --report ${q(reportPath)}`, ctx.worktree, CHECK_TIMEOUT_MIN);
  const report = readJson(reportPath);
  if (!report || !Array.isArray(report.fixtures)) {
    log(`no usable report JSON (golden:check exit ${rr.status}); degrading to the output tail`);
    return { text: null, mediaPath: null };
  }
  const summary = summarizeReport(report);

  // Timeline image for the first failing fixture that has a comparison.
  let mediaPath = null;
  const failingFx = (report.fixtures || []).find((fx) => fx.comparison && !fx.comparison.pass);
  if (failingFx) {
    try {
      const svg = buildTimelineSvg(failingFx.fixture, failingFx.comparison, failingFx.timingToleranceMs ?? summary.toleranceMs);
      const svgPath = path.join(ctx.artifactsDir, SVG_FILE);
      const pngPath = path.join(ctx.artifactsDir, PNG_FILE);
      fs.writeFileSync(svgPath, svg);
      const dims = /width="(\d+)" height="(\d+)"/.exec(svg);
      const expected = dims ? { width: +dims[1], height: +dims[2] } : { width: 1420, height: 400 };
      if (rasterize(svgPath, pngPath, expected, ctx.artifactsDir, log)) mediaPath = pngPath;
    } catch (err) {
      log(`timeline build failed (gate continues without an image): ${String(err.message || err).slice(0, 200)}`);
    }
  }

  // Debug video for the first failing fixture. Failure degrades gracefully.
  let videoNote = "Debug video: none (no failing fixture with a comparison).";
  const firstFailing = summary.failing[0];
  if (firstFailing) {
    try {
      const video = generateDebugVideo(ctx, firstFailing, log);
      videoNote = video.ok
        ? `Debug video: ${video.file} — download it from the run page (too big for Slack).`
        : `Debug video: generation failed (${video.reason}).`;
    } catch (err) {
      videoNote = `Debug video: generation failed (${String(err.message || err).slice(0, 200)}).`;
    }
  }

  const lines = [
    `*Golden regression* — this run's event timeline diverges from the committed baseline.`,
    `Failing fixture(s): ${summary.failing.join(", ") || "(none reported)"}`,
    `Matched by type: ${summary.perType.map((r) => `${r.type} ${r.matched}/${r.golden}`).join(" · ") || "(no events)"}`,
    `Max |Δt| ${summary.maxAbsDeltaMs.toFixed(0)}ms (pairing tolerance ±${summary.toleranceMs}ms) · ${summary.totalFailures} failing event(s)`,
    ...summary.failureLines.slice(0, MAX_FAILURE_LINES).map((l) => `• ${l}`),
    ...(summary.failureLines.length > MAX_FAILURE_LINES ? [`… and ${summary.failureLines.length - MAX_FAILURE_LINES} more (full report on the run page)`] : []),
    videoNote,
  ];
  return { text: lines.join("\n"), mediaPath };
}
