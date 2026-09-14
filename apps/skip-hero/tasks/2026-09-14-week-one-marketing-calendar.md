# Task — skip-hero week-one marketing calendar (gate draft)

**Dispatched:** 2026-09-14 11:00 (standup cutoff, no founder reply — 08:00 proposal item 1 proceeds)
**Profile:** product-lead (`agents/product-lead.md`)
**Reviewer:** chief-of-staff → founder gate (weekly marketing calendar is a founder gate)

## Objective
Draft a week-one launch marketing calendar for skip-hero against a **provisional**
ship date, concrete enough that the founder can answer yes/no to it in Slack.

## Ship date
The real ship date has been unanswered for 23 days. Use a **provisional** date and
say so explicitly at the top of the document: **Monday 2026-09-28** (T+14 from today),
with every entry expressed as **D-n / D+n relative to launch day** so the calendar
survives a date change. Do not present the provisional date as decided.

## References (read before writing)
- `docs/marketing/apps/skip-hero.md` — app-specific marketing brief
- `docs/marketing/synthesis/playbook.md`, `synthesis/ranking.md`,
  `synthesis/platform-selection.md` — which channels earn a slot and why
- `docs/marketing/platforms/*/` — per-channel audience/algorithm/credibility notes
- `docs/marketing/failures/bootstrapped-baseline.md` — what realistically fails
- `~/src/skip-hero/marketing/{strategy,content-calendar,content-samples,naming-aso,brand-direction}.md`
  — existing app-side material; reuse it, do not re-derive it

## Definition of done
- **Output file (required): `docs/marketing/apps/skip-hero-week-one-calendar.md`**
  in `~/src/app-factory`, committed on `main` and pushed.
- Content: D-3 → D+7, one row per day with channel, asset, owner (me/founder/none),
  and the cheapest-viable production cost. No more than two channels in week one —
  name the one that gets dropped and why (D-style rationale, one line).
- Each entry states its success signal (a number, not a vibe) and what happens if
  it misses.
- A "what I need from you" block: at most three items, each with a default on the
  table so silence is answerable.
- A closing section listing every asset that does not yet exist, with its lead time —
  so the founder can see what a 2026-09-28 date actually costs.

## Boundaries
- No posting, no account creation, no paid spend, no store-listing edits. Draft only.
- Do not touch credentials, pricing, or store config (founder-gate items, D-rule).
- Do not invent performance data. Where the research has no number, say "unmeasured".

## Report
Post outcome-first in Slack `#factory-standup` (C0BMK8L1UAG) when done: the commit SHA,
the file path, and the three questions — framed as the marketing-calendar gate.
