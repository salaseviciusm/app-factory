# Monetization Playbook

Applied at stage 1 (model hypothesis) and stage 4 (paywall design). RevenueCat is the
implementation seam; this playbook is the judgment.

## Model selection — match monetization to usage frequency

| Usage pattern | Model | Why |
|---|---|---|
| Daily habit (tracker, trainer, companion) | Subscription (annual-forward) | Ongoing value justifies recurring price |
| Occasional utility (converter, scanner, planner) | One-time IAP / lifetime unlock | Subscription resentment kills ratings |
| High-volume casual (games, feeds) | Ads + remove-ads IAP | Volume monetizes; the IAP is the ad's exit |
| Prosumer tool | Freemium subscription with real free tier | Free tier is the marketing channel |

Hard rule: **the spec must state why the model fits the usage frequency** (quality bar,
`05-product-process.md`). "Subscription because it earns more" is not a rationale.

## Pricing defaults (starting points, tuned per app after launch)

- Subscription: weekly price ≈ impulse threshold; annual at 50–60% discount vs monthly;
  no monthly tier unless data demands it (weekly + annual polarizes better).
- Lifetime unlock: 2.5–3× annual equivalent.
- Always localize price tiers; never hand-set per-country prices at launch.
- Free trial only when the aha moment needs >1 session to land; otherwise hard paywall
  with a generous free tier.

## Paywall rules

- Paywall shows AFTER the aha moment, not before value is demonstrated — unless the
  category norm is onboarding-paywall (check stage-2 research, don't assume).
- The paywall states concrete benefits in brand voice; never fake urgency, fake
  discounts, or countdown timers (see UX playbook rule 4; also store-review risk).
- One primary CTA. Restore purchases + terms/privacy always visible. Close button never
  hidden or delayed beyond platform norms.
- Every paywall variant is an analytics-tracked experiment (see analytics taxonomy:
  `paywall-viewed`, `paywall-dismissed`, `purchase-started/completed/failed`).

## Implementation checklist (build stage)

- RevenueCat entitlements named by capability (`pro`), not by price point.
- All gating reads ONE entitlement check seam in core — never scattered `isPro` flags.
- Offline grace: last-known entitlement honored; never lock a paid user out at the gym.
- Purchase flows covered by a Maestro flow in sandbox mode.
- Refund/cancellation states handled and tested before submission.

## Revenue review (stage 11 / portfolio loop)

- Weekly per app: trials started, conversion, churn, ARPU, refund rate.
- A price/paywall change is an experiment with a decision-log entry: hypothesis,
  duration, success metric. One change at a time per app.
