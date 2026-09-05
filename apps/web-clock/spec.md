# web-clock — Spec

> Owned by the product-lead. Canvases in `canvases/` are the reviewable stage-4/5
> boards. Founder gate has not approved this spec.

## Spark

**2026-09-05, founder (cloud agent thread):**

Look at https://youtube.com/shorts/eCL3aXcgU6U (title “spiderman workout”, Dhiman
Desilva) **and skip-hero**. Generate a workout app that tracks this — counts the
reps, and a timer. Use Apple Vision. The short is a reference, not raw footage;
examples can arrive tomorrow. Then: ASO design page first, before any UI; and an
infra canvas before implementation.

Chief-of-staff notes:

- “skip hero” = skip-hero’s on-device Vision pipeline (same reading as pullup
  spec §2.5), **and** skip a marketing hero/onboarding splash.
- The still is a collage: Holland “I do a CrossFit workout,” a Brand New Day
  poster, a one-legged gym drill. The workout that needs **both** a timer and a
  per-move count is Cindy: 20:00 AMRAP, 5 pull-ups / 10 push-ups / 15 air squats.
- Marvel / Holland / film strings stay off the listing (trademark + 4.3).

## 1. Refinement

- **Problem:** Doing the 20-minute 5-10-15, people either tap a WOD timer
  (breaks hands-free, lies when they lose count) or use a generic camera counter
  that does not know the circuit or the score. The pain is the combination:
  which move am I on, how many, how much clock, what is my score.
- **Target user:** The person who already knows Cindy — or just watched the
  Holland clip — and will prop a phone at a bar or in a garden for 20 minutes.
  Not the beginner who needs a pull-up program. Not the box that already runs
  SmartWOD on a TV.
- **Why now:** Vision is good enough for gross reps (pullup spikes VALIDATED).
  A tap-only Cindy app shipped 2026-08-18 to zero ratings — the WOD is named,
  the camera half is empty.
- **Random-Tuesday answer:** They open it to run the same 20:00 and beat last
  Tuesday’s `rounds + leftover`. Habit is low-frequency (2–4×/week).
- **Monetization hypothesis:** Freemium. Aha (live count + score) is free.
  History / PB is paid. Annual-forward ~$19.99. If history is not why they stay,
  switch to lifetime — do not invent a subscription around a novelty counter.

## 2. Market check

See `aso.md` and `canvases/aso.html` for the listing-shaped writeup. Headline:

- **Cindy: Workout Timer & Counter** and **CindyMax** — exact WOD, tap/timer
  only, 0 ratings. Do not clone.
- **SmartWOD Timer** — 54k ratings; general clock; no pose.
- **WSFU Push Up Counter** — 3,124 ratings; camera count *can* sell, for
  push-ups.
- **GOLDEN Bars** — 7 ratings; pull-up camera specialist stalled.

**Differentiation / 4.3:** single-benchmark Vision specialist (5-10-15 + Cindy
score + framing gate + undercount), not a timer skin and not an N-exercise AI
counter.

**Verdict: BUILD-WITH-CHANGES**, gated on (a) founder accepting the boards, (b)
raw clips proving three moves from one propped angle. If Vision cannot hold
squats and pull-ups in one frame, this is a don’t-build — we will not ship a
third 0-rating Cindy clock.

## 3. Brand brief

**Web Clock.** Home-screen 9 characters. Title `Web Clock: AMRAP Counter`.
Icon: 20-minute arc with 5 / 10 / 15 ticks. Dark, crimson accent — sibling to
skip-hero, not a cyan reskin. Voice: warm, direct, no superhero copy. Full pack
in `brand-pack/` (proposed).

## 4. Design

The one great interaction is the **propped-phone live HUD**: remaining time,
current move, reps in that move, rounds — readable from the bar — while Vision
counts and the director advances 5 → 10 → 15.

Screen inventory and screenshot frames: `canvases/aso.html`. No onboarding
hero. First open → framing gate → session.

Analytics: activation `session-first-completed`; habit `session-completed`.

## 5. Architecture

`architecture.md` + `canvases/infra.html`. Delta on the template: pose seam,
three versioned detectors, AMRAP director, native Vision module, fixture
replay. Skip-hero pipeline pattern; not the skip-hero repo.

## Gate record

- Spec approved by founder: _not yet_
