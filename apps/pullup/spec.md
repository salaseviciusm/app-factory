# pullup — Spec

> Owned by the product-lead. Stages 1–5 fill this in; the founder gate approves it.
> Every section must be answered before build — see the quality bar in
> docs/05-product-process.md.

## Spark

**2026-08-02, founder in `#factory-standup` (Slack):**

> "lets build out a pullup app - record yourself doing pullups. measures your
> range-of-motion, form etc using apples poses. Track progress over time - pullups
> done, range of motion, form, and track these analytics"

Analytics provider confirmed same message: PostHog (factory decision D16).

Chief-of-staff notes for the product-lead:
- "Apple's poses" ⇒ on-device pose estimation (Vision `VNDetectHumanBodyPoseRequest` /
  ARKit body tracking) ⇒ implies **iOS-native**, camera-based, likely on-device
  inference. Confirm platform assumption in stage 1.
- Core loop is capture → analyze rep quality (ROM, form) → log → trend over time.
  The "one great interaction" candidate is the live/post-set form read-out.

## 1. Refinement

- **Problem:** People training pull-ups can't tell if their reps are *legit*. The two
  things calisthenics people actually argue about — "was that chin *over* the bar?" and
  "did you reach a full dead-hang lockout, or half-rep and kip?" — are invisible to the
  person hanging from the bar. Today they either (a) manually log a number they can't
  trust, (b) film themselves and scrub the video afterward, or (c) buy a general AI
  rep-counter that treats a pull-up as just another of 11 exercises and grades form with a
  vague A/B/C. None of these give a trustworthy, pull-up-specific verdict per rep. The pain
  is small per session but chronic: pull-ups are the hardest common bodyweight movement,
  progress is slow, and self-deception (kipping, partial ROM) is the #1 thing that stalls it.

- **Target user:** The **intermediate calisthenics / bodyweight-strength enthusiast**
  who can already do 5–15 strict pull-ups and cares about *quality* — someone chasing a
  goal (first muscle-up, first weighted/one-arm progression, a military PT/PFT standard,
  or a public "20 strict reps" milestone). They train mostly at home on a doorway/wall bar
  or at a park/gym, film themselves already, and are the type to buy a chalk bag. **Not**
  the absolute beginner (can't do a rep to measure) and **not** the general-fitness user
  (better served by Hevy/Strong/Apple Fitness). Specific, opinionated, and self-selecting —
  which is also the risk (small TAM, see § reasons not to build).

- **Why now:** On-device single-camera pose estimation crossed the "good enough for gross
  movement" line, and Apple ships it free (Vision `VNDetectHumanBodyPoseRequest`). Third-
  party SDKs (QuickPose.ai) have commoditized rep counting to a weekend build — which is
  *why the shelf is filling up right now* and why a generic counter is no longer
  defensible. The window is not "can this be built" (it can, trivially) but "can someone
  own the pull-up specialist niche before it commoditizes." Neutral-to-slightly-negative
  timing signal, stated honestly.

- **Random-Tuesday answer:** Our user trains pull-ups 2–4×/week on a fixed split. On a
  random Tuesday they prop the phone against the wall opposite their bar, do their working
  sets, and open the app to (1) get a *trustworthy* strict-rep count for the set they just
  did — kips and half-reps rejected, not counted — and (2) watch their strict-rep PR and
  ROM consistency trend inch up. The retention hook is **verified progress on a hard
  goal**, not the novelty of camera counting (which wears off in a week). Honest caveat:
  pull-up training is 2–4×/week, not daily — the habit loop is real but lower-frequency
  than a steps/food tracker, which shapes monetization (below).

- **Monetization hypothesis:** **Freemium subscription, annual-forward** (aligns with
  monetization playbook: habit/tracker → subscription; RevenueCat seam). Free tier: live
  strict-rep counting + basic session log (the aha must be free — camera counting is the
  demo). Paid `pro`: history/trends beyond N sessions, ROM/form breakdown per rep, kip/
  anti-cheat detail, progression programs (weighted, one-arm, muscle-up), export. Pricing
  starting point per playbook: **weekly ≈ impulse + annual at ~55% off**, target annual
  **$19.99** — matching the ceiling competitors already charge (GOLDEN Bars $9.99/yr,
  RepSquad $19.99/yr). **Frequency-fit caveat, stated plainly:** 2–4×/week usage is on the
  low end for subscription comfort; the recurring value must come from *programming and
  progression* (a reason to keep paying), not from counting alone (a one-week novelty).
  If the progression content isn't real, this should be a one-time unlock, not a sub.

## 2. Market check

_Extracted from live App Store listings, 2026-08-02. Ratings counts are the signal that
matters here: this is a niche with lots of supply and very little demonstrated demand._

_Corroborating evidence + real review quotes in `market-notes.md` (independent iTunes API /
review-RSS pull). One refinement to "very little demonstrated demand": the **category**
demonstrably converts — the camera **push-up** counter by WSFU sits at **4.84★ / 3,124
ratings** with a loved lifetime unlock, and Muscle Booster at 136k. Demand for hands-free
camera rep-counting is real; what's unproven is demand for a **pull-up-only** version
(GOLDEN Bars shipped exactly that and stalled at 7 ratings). This sharpens rather than
softens the case: the risk is pull-up *specificity*, not the format — and is the core
argument for widening scope to pull-ups + dips + push-ups on one pose pipeline._

- **Competitors:**
  - **GOLDEN Bars — Pull ups & Dips** (Stephan Duechtel) — **the near-exact idea, already
    shipping.** AI pose-estimation rep counter, pull-up + dip specific, workout variety
    (EMOM/Tabata/max-reps), leaderboards, challenges, widgets, Strava. Freemium: $1.99/mo,
    **$9.99/yr**, $24.99 lifetime. *Strength:* full-featured, exactly our concept, solo dev
    moving fast. *Weakness:* **4.3★ on only 7 ratings** — near-zero traction after
    shipping the whole idea. This is the headline finding.
  - **RepSquad (fka "AI Rep Counter On-Device")** (Priye Singh) — 11-exercise on-device AI
    counter incl. pull-ups, **A/B/C form grade per rep**, rep battles, global leaderboards,
    gym "kiosk/FitStation" mode. Subs weekly $3.99 / annual $19.99 / lifetime $49.99.
    *Strength:* broad coverage + form grading + gym B2B angle. *Weakness:* **3.7★ / 3
    ratings**; pull-ups are one of eleven — nobody's specialist.
  - **Pull Ups Counter** (Big D's Roadhouse) — old-school *manual/goal* daily counter, no
    pose estimation. 3.0★ / 2 ratings, cheap subs. *Strength:* owns the literal keyword.
    *Weakness:* not AI, abandoned-feeling — evidence the exact-match keyword is low-value.
  - **PoseTracker AI** (Movelytics) — general real-time + video-upload rep/form/jump
    analyzer. *Strength:* video-upload analysis (async form review). *Weakness:* generalist,
    not calisthenics-native.
  - **Push-up cluster** (Pushup AI, PUSHUP, Top Pushup, Replo, PUSHapp) — the *proven*,
    crowded category. Relevant as the ASO/quality benchmark and as proof that **push-ups,
    not pull-ups, are where the volume is** (push-ups need no equipment; far larger TAM).

- **Review mining:** Positive reviews across the counters cluster on "hands-free counting
  is genuinely useful for home/solo training" and "on-device = private." The recurring
  *gaps and complaints* pulled from listings, comparison articles (trypushapp, sensai.fit),
  and the tech literature:
  1. **Accuracy/trust is the whole ballgame and it's shaky.** Single-camera pose estimation
     runs ~5.8° joint-angle error, "degrades in the transverse plane and under occlusion,"
     and is a *screening aid, not a measurement instrument.* Well-built apps deliberately
     **undercount** (skip a rep when unsure) to protect trust — a real UX constraint.
  2. **Environmental friction:** needs space, decent light, and a phone propped at the right
     angle. Worse for pull-ups than push-ups — the movement is vertical, the bar/hands
     occlude the top of the rep, and gym/park bars make phone placement awkward.
  3. **Counting alone doesn't retain.** Users say they still need a *separate* app for
     programming/progression (Hevy/Strong) — the counter is a gadget, not a training system.
  4. **"Just another of N exercises" dilutes trust** — generalist grading feels generic;
     nobody is the credible pull-up authority.

- **ASO landscape:** Primary phrase **"pull up counter"** (+ "pullup tracker",
  "calisthenics counter") — **low competition but also low volume**, and the exact-match
  keyword is held by an abandoned manual app (weak defenders, weak demand). The
  high-volume phrases — **"rep counter", "push up counter", "workout counter"** — are
  crowded with better-resourced apps (the push-up cluster) and general trackers. Realistic
  ASO play: *own the thin, uncontested pull-up/calisthenics long-tail* and accept that
  head-term volume must be bought or earned via content, not won on metadata. Competitive
  ceiling is modest either way. (Full keyword/difficulty pass deferred to a proper ASO
  stage per playbooks/aso.md.)

- **Differentiation statement (doubles as Apple 4.3 defense):** *"The pull-up specialist
  that only counts reps it can verify — strict chin-over-bar and full dead-hang lockout,
  with kipping and half-reps rejected on purpose — and turns that verified signal into a
  progression path toward weighted, one-arm, and the muscle-up."* The 4.3 defense is that
  this is **not** a reskinned N-exercise counter: the custom value is a pull-up-specific
  rep-validity model (ROM gates + anti-cheat) and a domain-specific progression system, not
  template configuration. **This defense only holds if the verification is genuinely
  better than the generalists' — which is unproven and is the gating risk below.**

- **Reasons NOT to build this (honest — a kill here is a success):**
  1. **The exact app already exists and hasn't found demand.** GOLDEN Bars ships our whole
     concept and sits at 7 ratings. That's the single loudest signal in this research:
     either the pull-up-only niche is too small to matter, or it's a marketing problem we
     have no more edge on than a motivated solo dev. Both are bad.
  2. **Small TAM.** Pull-ups gate on strength most people don't have and equipment they
     don't own. The addressable "cares about strict-rep quality" sub-segment is smaller
     still. Push-ups/squats are where the volume is — and we'd be *choosing* the narrower door.
  3. **The core promise sits on the weakest part of the tech.** Our entire differentiation
     is *better verification of ROM/form* — precisely what single-camera Vision is worst at
     (occlusion at the bar, out-of-plane rotation, ~5.8° angle error). If we can't reliably
     tell a strict rep from a kip/half-rep, the wedge collapses into another vague grader,
     and over-strict counting ("it didn't count my good rep!") drives 1-star reviews and refunds.
  4. **Commoditized foundation → 4.3 exposure is self-inflicted.** Off-the-shelf pose SDKs
     make this a weekend clone for anyone; the shelf is already filling. Without the
     verification edge, this reads to App Review as one more near-duplicate counter.
  5. **Frequency ceiling on the business model.** 2–4×/week caps subscription comfort and LTV
     for a single-purpose tool unless the progression content is genuinely good — which is
     real product work, not a pose-estimation demo.

  **Verdict: BUILD-WITH-CHANGES, gated on an accuracy spike.** Do *not* build the app as a
  generic "record pull-ups, measure ROM/form" counter — that lane is taken and empty. Build
  *only* the opinionated wedge (verified strict-rep specialist + progression), and only if a
  **stage-2.5 feasibility spike** proves Apple Vision can distinguish a strict pull-up from a
  kip / chin-under-bar / half-lockout reliably enough to *reject* reps without maddening
  false negatives. If that spike fails, this is a **DON'T BUILD** — and that would be the
  correct, cheap kill. See open questions at the spec gate.

- **Analytics note (provider fixed: PostHog — D16; full taxonomy is stage 4):** likely
  **activation event** = `set-first-completed` (first hands-free set with verified reps counted —
  the aha); likely **habit event** = `set-completed` (repeatable core action; run D1/D7/D30 on
  this, not app-open). Candidate feature events for stage 4: `rep-counted`, `rep-rejected-invalid`
  (the anti-cheat/undercount signal — instrument it, it's central to trust), `form-score-viewed`,
  `rom-trend-viewed`, `program-workout-started`. No PII; pose/health data never leaves device as
  analytics (taxonomy rule).

## 2.5 Feasibility spike — pose & capture (chief-of-staff, 2026-08-02)

The stage-2 gate required proving Apple Vision can *reject* kips/half-reps reliably. Ran a
real on-device spike (Swift + Vision, no cloud) on real footage. Artifacts:
`spikes/001-pose-feasibility/` (2D) and `spikes/002-3d-pose/` (3D, in progress).

- **2D `VNDetectHumanBodyPoseRequest` — VALIDATED on well-framed pull-ups.** Front-on stock
  clips: usable wrist confidence in **100%** of frames, **0.76–0.85 even at the occluded top
  of the rep** (the exact fear — bar occludes wrists at lockout — did *not* reproduce), and a
  clean, repeatable elbow-angle ROM (three reps within **6°**). Chin-over-bar via nose-vs-wrist
  works when the face is visible. Rep segmentation reliable. → the core mechanic is real.
- **PARTIAL on the founder's real "impromptu" clips** — and this is the important finding.
  Neither was a clean front/¾ pull-up: one was **push-ups filmed worm's-eye** (phone flat on
  the ground), the other **pull-ups filmed from behind**. From behind, the face is invisible,
  so the **nose tracked in only 3.6% of frames** — which *kills the nose-based chin-over-bar
  metric outright* — and wrists dropped to 44–61%. Body joints (shoulders/elbows/hips ~67%)
  survived from behind; the face-dependent signal did not.

**Decisive design consequence (fold into §4/§5):** **capture orientation & framing is a
first-class feature, not polish.** v1 must ship (a) a **capture guide** — phone stood upright,
front or ¾ angle, face + full body + bar in frame — and (b) a **live confidence/orientation
gate** that refuses to log when tracking is poor and tells the user to reframe, plus
**undercount-when-unsure** (matches review-mining finding #1: trust > count). Without this,
real-world angles degrade metrics badly.

**Reuse — this de-risks the build massively:** `~/src/skip-hero` (the factory's current-gen
base) is a shipped camera trainer on the **identical** Vision pose call, with an event-sourced
platform-free core, a pose "seam", a productionized `pose-extract` Swift CLI, a debug-render
overlay, an Expo native Vision module, and hard-won detector tuning (confidence gating / gap
reset). **The pull-up app is skip-hero's pipeline with a pull-up detector swapped in.** Note:
skip-hero succeeds by *controlling capture* (front camera, full body) — its own tuning notes
say thresholds come from "one camera angle" — which independently confirms the capture-gate
requirement above.

**Angle tolerance — RESOLVED, 3D spike VALIDATED (`spikes/002-3d-pose/`):**
`VNDetectHumanBodyPose3DRequest` run on the founder's *from-behind, worm's-eye* clip (the
one 2D failed on) produced a usable skeleton in **76% of frames (87% during the rep bouts)**,
a **3D elbow angle in 100% of tracked frames**, and — critically — a **face-independent
chin-over-bar** (`head.y` vs mean `wrist.y`, computable in 100% of tracked frames) where 2D's
nose metric was dead at 3.6%. The model infers head/shoulder/elbow/wrist from the *back* of
the body — **no face required**. So 3D materially widens angle tolerance and *removes the
face-forward constraint*. Caveats (honest): hips/legs are templated (ignore them — fine for
pull-ups), raw absolute angles need a light ground-truth calibration for form scoring (the
*differential* is trustworthy), rep counting needs a state machine not a threshold, and ~24%
of rear frames returned no observation (a framing guide + gap interpolation covers it). True
"works from *all* angles" with zero guidance still = a custom multi-angle model = **v2+**.

**Decision folded to §5:** v1 builds core metrics on **3D pose** (elbow angle for ROM +
`head.y`-vs-`wrist.y` for chin-over-bar), dropping the nose dependency. The capture gate stays
(covers the no-observation gap) but is no longer load-bearing for orientation.

**Net:** stage-2 verdict **BUILD-WITH-CHANGES holds and is stronger** — accuracy is feasible
*and* robust to casual angles via 3D. A clean front/¾ founder clip is now a nice-to-have, not
a gate.

## 3. Brand brief

_Name direction, personality, audience fit → handed to brand pack. Final identity
lives in brand-pack/, not here._

## 4. Design

_Seed (from §2.5): the "one great interaction" is the **trustworthy live rep verdict** —
strict reps counted, kips/half-reps visibly rejected — and the **capture guide + live
confidence/orientation gate is part of it**, not a settings screen (a bad frame must be
caught before the set, or the verdict can't be trusted). Product-lead authors stage 4._

- **The one great interaction:** _what it is; edge cases; why it feels great_
- **Feature list:** _must / should / later_
- **Screen inventory:** _route → one-line purpose_
- **Flows:** _first-open → aha; the great interaction; paywall encounter_
- **Empty/loading/error states:** _per data-bearing screen_
- **Analytics:** _activation event, habit event, feature events (playbooks/analytics-taxonomy.md)_

## 5. Architecture (tech-lead)

_Delta on the template: what is pure brand-pack configuration, what is custom code
(and where it lives), which domain events exist, storage needs, anything unusual.
Lives in architecture.md; summarize here with a link._

**Seeded by §2.5 (decided facts; tech-lead to formalize):**
- **Fork skip-hero's pipeline**, don't rebuild: `VNDetectHumanBodyPoseRequest` capture →
  event-sourced platform-free `packages/core` (pose seam + detectors) → Expo app + native
  Vision module; reuse `pose-extract` / `debug-render` Swift CLIs for offline tuning.
- **Custom code (the wedge):** a pull-up rep-validity detector (strict chin-over-bar +
  full dead-hang lockout gates, kip/half-rep rejection) replacing skip-hero's skip detector;
  the capture confidence/orientation gate; progression system.
- **Domain events:** `rep-counted`, `rep-rejected-invalid`, `set-completed`, plus trend/PR
  projections (mirror skip-hero's append-only log).
- **Pose dimensionality:** adopt **3D** (`VNDetectHumanBodyPose3DRequest`) — 002 spike
  VALIDATED: usable skeleton + 3D elbow angle + face-independent chin-over-bar from directly
  behind, where 2D failed. Core metrics = 3D elbow angle (ROM) + `head.y` vs `wrist.y`
  (chin-over-bar); no nose dependency. Upper-body joints only (hips/legs are templated).
- **On-device only** for pose/health; PostHog gets events, never raw pose (taxonomy rule).

---

## Gate record

- Spec approved by founder: _date / standup link_
