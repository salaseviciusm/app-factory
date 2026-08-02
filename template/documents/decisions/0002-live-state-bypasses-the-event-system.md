# ADR 0002 — High-frequency live state bypasses the event system

**Status:** accepted · Aug 2026

## Context

Event logs are for durable facts. Per-tick UI values, timers, and sensor-ish signals
would flood the log and make replays meaningless (skip-hero ADR precedent).

## Decision

Live state uses the ~40-line `Cell` observable (`mobile-overlay/src/lib/observable.ts`)
together with `useSyncExternalStore`. No Redux/Zustand/MobX/Jotai in template apps; no
React Context as a state carrier — the composition root is a module-level singleton import.

## Consequences

- Two channels exist by design: durable (events) and live (cells). Choosing which one
  a new piece of state belongs to is an explicit design decision.

**Do not** "unify" cells into the event bus. **Do not** introduce a state-management
library to template apps without a measured limitation of cells and a new ADR.
**Do not** wrap the app context in a React provider "for testability" — seams and
in-memory impls are the testability mechanism.
