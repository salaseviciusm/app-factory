# web-clock (Suit Up) — Spec

> Owned by the product-lead. `canvases/aso.html` is the reviewable listing board for
> the chosen direction; `canvases/directions.html` is the record of the four considered.
> Founder gate has not approved this spec.

## Spark

**2026-09-05, founder (cloud agent thread):**

Look at https://youtube.com/shorts/eCL3aXcgU6U (title "spiderman workout", Dhiman
Desilva) **and skip-hero**. Generate a workout app that tracks this — counts the
reps, and a timer. Use Apple Vision. The short is a reference, not raw footage;
examples can arrive tomorrow. Then: ASO design page first, before any UI; and an
infra canvas before implementation.

Chief-of-staff notes:

- "skip hero" = skip-hero's on-device Vision pipeline (same reading as pullup
  spec §2.5), **and** skip a marketing hero/onboarding splash.
- The still is a collage: Holland "I do a CrossFit workout," a Brand New Day
  poster, a one-legged gym drill. The workout that needs **both** a timer and a
  per-move count is Cindy: 20:00 AMRAP, 5 pull-ups / 10 push-ups / 15 air squats.
- Marvel / Holland / film strings stay off the listing (trademark + 4.3).

**2026-09-05, founder, second pass:** the first ASO board was rejected ("looks awful");
asked for a markdown architecture, four name/theme/angle variations, a viability and
market report, and a more creative name geared to a **workout challenge** that doubles
as the factory's first **distribution pilot**. Then: **"D sounds best — workout
challenge 30 days. Can go into the lock-in season angle also, as well as the Tom Holland
angle for marketing."** Direction D is chosen; see `directions.md`, `decisions.md` P5.

## 1. Refinement

- **Problem:** Thirty-day discipline challenges are the hottest self-improvement
  shape on the store, and every app running one takes your word for it. A checkbox
  is easy to tick and easy to quit. Doing the 20-minute 5-10-15 specifically, people
  tap a WOD timer that lies when they lose count, or a camera counter that does not
  know the circuit or the score.
- **Target user:** 16–30, the "lock in" / winter-arc crowd already downloading
  discipline trackers, plus at-home beginners who want a fixed-length challenge they
  can finish. Scaled variants make day 1 possible. Not the box on a TV; not the
  person who wants a program.
- **Why now:** Vision is good enough for gross reps (pullup spikes VALIDATED). The
  hero workout is in mainstream press with a public 27-round number; lock-in season
  opens Oct 1; the lane's incumbents (Lock In 26,542 ratings in 14 months) prove the
  wallet and cannot verify the work.
- **Random-Tuesday answer:** Day N of 30. Same 20:00, same three moves; the day lights
  when the camera saw it. After the arc: run the benchmark again and beat day 30.
- **Monetization hypothesis:** Freemium. Live count, today's card, the calendar are
  free. History across arcs / PBs / export are Pro; annual ~$19.99, lifetime ~$29.99.
  Hard paywall only at the *reprice* outcome. Do not invent a subscription around a
  novelty counter.

## 2. Market check

Full report: `market-check.md` (store data, review mining, why-now, audience,
platform, pilot design, monetization, IP, reasons not to build). Headline:

- **Lock In** 26,542 · **LOCKED** 5,056 · **75 Days Challenge** 8,662 · **75 Hard**
  6,406 · **Her 75** 4,993 — discipline-challenge trackers, all recent, all
  self-report. The wallet is proven; none verifies the work.
- **30 Day Fitness** 58k / 28k — coaching-content programs; the lane we do not fight on.
- **WSFU Push Up Counter** 3,283 — camera counting sells; 1★s are "missed my rep."
- **Cindy: Workout Timer**, **Winter Arc — 90 Days** — the WOD name alone or the
  phrase alone, at 0 ratings. Do not clone either.

**Differentiation / 4.3:** a fixed-length bodyweight challenge whose completion is
verified by on-device Vision for one three-movement benchmark — not a habit tracker,
not a timer skin, not an N-exercise AI counter.

**Verdict: BUILD**, as the distribution pilot, gated on (a) founder clips proving three
moves from one propped placement, (b) Rank 0 before the first post, (c) a 30-post read
with four pre-agreed outcomes. Falsifier and reasons-not-to in `market-check.md` §9.

## 3. Brand brief

**Suit Up.** Title `Suit Up: 30-Day Hero Workout` (28). Subtitle `The camera counts.
Lock in.` (27). Icon: thirty ticks around a "30", nine lit — the calendar, not a spider.
Graphite + volt `#D4FF3F` (the only colour that means "counted") + reject `#FF5F4A`.
Syne 800 numerals. Voice: second person, short, no guilt. Alternates on record: Round
One, Proof of Work, Thirty. Full pack in `brand-pack/` (proposed, validates). IP rules
permanent (`aso.md`).

## 4. Design

The one great interaction is the **propped-phone live HUD**: remaining time, day and
round, current move, reps in that move — readable from the bar — while Vision counts
and the director advances 5 → 10 → 15. The second is the **calendar day lighting**
only when the camera saw a finished 20:00.

Screens (contract from the listing, `canvases/aso.html` frames 1–6): pick your version
(day 1) → framing gate → live HUD → not-counted overlay with reason and "+1 · it was
clean" → day card (rounds + leftovers, day 1 vs today, target bar) → 30-day calendar →
share card (skeleton replay, no footage). No onboarding hero.

Challenge rules: 30 days · one workout · 5 of 7 days counted (rest is a rule) · scaled
variants count and are named on the card · score = day-1 vs day-30 rounds, optional
target (default 27) · share a card, never a rank.

Analytics: activation `session-finished` (early = false); habit `challenge-day-lit`;
share `card-shared`. Gate 0 attribution before the first post.

## 5. Architecture

`architecture.md` (primary; the infra canvas was retired). Delta on the template:
native Vision module, pose seam with live / fixture / sim adapters, framing gate, six
versioned detectors (Rx + scaled), AMRAP director, clock as a Cell, ChallengeService
and calendar projection, card renderer. Skip-hero pipeline pattern; not the repo.
Open risks ranked in `architecture.md` §18.

## 6. Distribution pilot

This app is the factory's first distribution pilot; the learning is for pace and
skip-hero as much as for this app. Design in `market-check.md` §6 and `aso.md`:
Rank 0 → Sep tease → Oct 1 Winter Arc cohort → day-N content → Oct 30 cards → the read
(installs per 1,000 views by format; continue / reposition / reprice / kill, written
down before Oct 1).

## Gate record

- Spec approved by founder: _not yet_
- Direction chosen by founder: **D — 30-day challenge (Suit Up)**, 2026-09-05
- Open founder calls: name, cohort date, hero-angle comfort line, free calendar
  (`aso.md` → Founder calls)
