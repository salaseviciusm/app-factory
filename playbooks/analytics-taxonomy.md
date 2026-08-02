# Analytics Taxonomy

Events are defined at stage 4 (design), implemented in stage 6, and reviewed at stage 11.
Implementation goes through the template's `packages/analytics` seam — typed events only;
raw provider calls are forbidden outside the adapter.

## Naming

Same convention as domain events: `category-entity-action`, lowercase-hyphenated.
Every event carries the standard envelope automatically (session id, app version,
template version, brand id, platform); features add only their specific properties.

## Standard events (every app, wired by the template)

| Event | When | Key props |
|---|---|---|
| `app-session-started` | cold/warm open | source (push/deeplink/organic) |
| `onboarding-step-viewed` / `-completed` / `-skipped` | per step | step-id |
| `onboarding-completed` | end of flow | duration-s |
| `paywall-viewed` | paywall impression | placement, variant |
| `paywall-dismissed` | closed without purchase | placement, variant |
| `purchase-started` / `-completed` / `-failed` | RevenueCat flow | product-id, placement |
| `subscription-renewed` / `-cancelled` | server events via RevenueCat | product-id |
| `settings-changed` | any setting | key (no values that could be sensitive) |
| `review-prompt-shown` / `review-prompt-accepted` | rating ask | trigger-milestone |
| `error-displayed` | user-visible error state | surface, error-code |

## Per-app events (defined in the spec, stage 4)

Rules:
- Every spec defines its **activation event** (the aha moment, e.g. `run-first-completed`),
  its **habit event** (the repeatable core action), and 3–8 feature events. If you can't
  name the activation event, the spec isn't done.
- Milestone events (`milestone-<n>-reached`) power review prompts and retention analysis.
- No PII in properties, ever. No free-text properties. Coordinates/health data never
  leave the device as analytics.

## Metrics the portfolio runs on (nightly digest / weekly review)

- Activation rate: `onboarding-completed` → activation event within day 0
- D1/D7/D30 retention on the habit event (not on app-open — opens lie)
- Funnel: `paywall-viewed` → `purchase-completed` per placement/variant
- Revenue: trials, conversion, churn, ARPU (RevenueCat), refunds
- Quality: crash-free sessions, `error-displayed` rate by surface

## Discipline

- An event not in the spec doesn't get shipped; an event in the spec MUST ship with the
  feature (tech-lead review item).
- Renaming an event is a versioned migration with a decision-log entry — dashboards
  break silently otherwise.
- Once per quarter per app: prune events nobody queried; unused telemetry is cost and
  privacy surface with no payoff.
