# ADR 0001 — Event-sourced core with projection reads

**Status:** accepted · Aug 2026

## Context

Both founder reference apps converged on event sourcing (running-with-pace first
generation, skip-hero refined). Factory apps need reproducible state, cheap sync, and
deterministic replays for agent-written logic.

## Decision

Durable state is an append-only log of zod-validated, versioned events. Reads are
projections that re-fold the log on every call. Corrections are new events; algorithm
outputs carry a version string and old versions are frozen.

## Consequences

- Projections can look "inefficient" — they are correct-by-construction and cached
  _inside_ the projection only when measurement demands it.
- Storage adapters stay two methods (`append`/`read`) so sync is a decorator.

**Do not** replace projections with cached mutable read-models "for performance"
without a measured case and a new ADR. **Do not** add update/delete to the store
interface. **Do not** re-tune a frozen algorithm version — ship a new version string.
