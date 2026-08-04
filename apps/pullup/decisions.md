# Decision Log — pullup

App-specific decisions. Format per the factory log (docs/process/decision-log.md);
append-only, record the why. Promote to an ADR anything a future agent might undo.

## Analytics — PostHog (inherits factory D16, 2026-08-02)

Per factory decision D16, pullup uses PostHog for product analytics. Stage-4 design
must define the activation event, habit event, and feature events (per
playbooks/analytics-taxonomy.md) before build. Domain events likely: set_recorded,
rep_scored, pr_hit, streak_continued.
