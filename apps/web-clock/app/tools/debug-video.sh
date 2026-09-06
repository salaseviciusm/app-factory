#!/usr/bin/env bash
# Suit Up — one-command debug pipeline (macOS), same shape as skip-hero.
#
#   tools/debug-video.sh <video> [preview-seconds] [--fixture path] [--from s] [--to s] [--out path]
#
# Writes <base>.debug.mov + <base>.debug-preview.png next to the video (or --out).
# Reuses a pose fixture when --fixture is set or /tmp/img-NNNN.json matches IMG_NNNN.
# Delete the .trace.json to re-run detectors after a retune.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <video> [preview-seconds] [--fixture path] [--from s] [--to s] [--out path]" >&2
  exit 1
fi

VIDEO="$1"
shift
PREVIEW_SEC=""
FIXTURE=""
FROM=""
TO=""
OUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fixture) FIXTURE="$2"; shift 2 ;;
    --from) FROM="$2"; shift 2 ;;
    --to) TO="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    *)
      if [[ -z "$PREVIEW_SEC" && "$1" =~ ^[0-9.]+$ ]]; then
        PREVIEW_SEC="$1"
        shift
      else
        echo "unknown arg: $1" >&2
        exit 1
      fi
      ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STEM="$(basename "${VIDEO%.*}")"
NUM="${STEM#IMG_}"
NUM="${NUM#img-}"
if [[ -z "$FIXTURE" && -f "/tmp/img-${NUM}.json" ]]; then
  FIXTURE="/tmp/img-${NUM}.json"
fi

RANGE_ARGS=()
RANGE_SUFFIX=""
if [[ -n "$FROM" ]]; then
  RANGE_ARGS+=(--from "$FROM")
  RANGE_SUFFIX="${RANGE_SUFFIX}-from${FROM}"
fi
if [[ -n "$TO" ]]; then
  RANGE_ARGS+=(--to "$TO")
  RANGE_SUFFIX="${RANGE_SUFFIX}-to${TO}"
fi

if [[ -n "$OUT" ]]; then
  OUTPUT="$OUT"
else
  OUTPUT="${VIDEO%.*}${RANGE_SUFFIX}.debug.mov"
fi
BASE="${OUTPUT%.debug.mov}"
BASE="${BASE%.mov}"
if [[ -n "$FIXTURE" ]]; then
  TRACE="${FIXTURE%.json}.trace.json"
else
  TRACE="${VIDEO%.*}.trace.json"
fi
PREVIEW="${BASE}.debug-preview.png"
CSV="/tmp/img-${NUM}.csv"

RENDER="/tmp/suit-up-debug-render"
if [[ ! -x "$RENDER" || "$ROOT/tools/debug-render.swift" -nt "$RENDER" ]]; then
  echo "==> compiling debug-render"
  xcrun swiftc -O "$ROOT/tools/debug-render.swift" -o "$RENDER"
fi

if [[ -z "$FIXTURE" ]]; then
  EXTRACT="/tmp/suit-up-pose-extract"
  if [[ ! -x "$EXTRACT" || "$ROOT/tools/pose-extract.swift" -nt "$EXTRACT" ]]; then
    echo "==> compiling pose-extract"
    xcrun swiftc -O "$ROOT/tools/pose-extract.swift" -o "$EXTRACT"
  fi
  if [[ ! -f "$CSV" ]]; then
    echo "==> extracting poses"
    "$EXTRACT" "$VIDEO" > "$CSV"
  else
    echo "==> reusing $CSV"
  fi
  FIXTURE="${CSV%.csv}.json"
  if [[ ! -f "$FIXTURE" ]]; then
    echo "==> building fixture"
    node "$ROOT/tools/csv-to-fixture.mjs" "$CSV" "$FIXTURE" --size 1080x1920
  fi
  TRACE="${FIXTURE%.json}.trace.json"
else
  echo "==> reusing fixture $FIXTURE"
fi

echo "==> tracing detectors"
(cd "$ROOT" && ./node_modules/.bin/vite-node tools/trace-fixture.ts "$FIXTURE" "$TRACE")

echo "==> rendering debug video"
PREVIEW_ARGS=()
if [[ -n "$PREVIEW_SEC" ]]; then
  PREVIEW_ARGS=(--preview "$PREVIEW_SEC" "$PREVIEW")
fi
"$RENDER" "$VIDEO" "$FIXTURE" "$TRACE" "$OUTPUT" "${PREVIEW_ARGS[@]}" "${RANGE_ARGS[@]}"

echo ""
echo "done:"
echo "  video:   $OUTPUT"
if [[ -n "$PREVIEW_SEC" ]]; then
  echo "  preview: $PREVIEW"
fi
