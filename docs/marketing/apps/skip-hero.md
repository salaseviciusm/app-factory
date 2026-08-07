# skip-hero — audience candidates, angles, and what each would need us to build

**Compiled:** 2026-08-07. Runs the six-question procedure in
[`../synthesis/platform-selection.md`](../synthesis/platform-selection.md) against skip-hero with
the founder's explicit brief: **find multiple audiences, not one.** Companion to
[`../synthesis/ranking.md`](../synthesis/ranking.md) (channel order),
[`../synthesis/playbook.md`](../synthesis/playbook.md) (operating rhythm) and
[`../failures/bootstrapped-baseline.md`](../failures/bootstrapped-baseline.md) (what "normal" is).

This document **tests** `/Users/morkus/src/skip-hero/marketing/*.md` (5 files, 2026-08-06) rather
than restating them. Section 6 lists where that draft is wrong.

Evidence tags: `[DOCUMENTED]` (source given) · `[ANECDOTAL]` (real but unaudited/self-reported) ·
`[ASSUMPTION]` (my inference, no source) · `[GAP]` (I looked and could not establish it).

---

## 0. Product truth as of 2026-08-07 — verified against the repo, not the marketing docs

I read the code. Three of the four "key product facts" in the brief needed correcting.

| Claim | Verdict | Evidence |
|---|---|---|
| Camera skip counting is table stakes because competitors ship it | **Half true — and the wrong half matters.** Competitors ship it; nobody has traction. See §1 | `[DOCUMENTED]` iTunes Lookup API, US store, retrieved 2026-08-07 |
| Footwork classification (6 landing patterns) is shipped | **Shipped in core, invisible in the app.** `LANDING_PATTERNS` = `left-only`, `right-only`, `both-simultaneous`, `both-quick-succession`, `feet-close`, `feet-spread` (`packages/core/src/landing/landing-detector.ts:53`). They surface in exactly three places: the **Debug** screen (`apps/mobile/src/app/debug.tsx:185`), **Tile rush lanes** (`src/tile-rush/scoring.ts:52`), and **lesson step gating** (`src/lessons/*.ts` `counts: [...]`). **Neither the live session screen nor the Summary shows any footwork readout.** | `[DOCUMENTED]` repo, HEAD `0285e4d` |
| The app names moves like "boxer step: clean" | **False.** There is no move classifier. The lesson engine *tells you* to do a boxer step, then counts `left-only`/`right-only` landings to check you alternated (`src/lessons/rhythm-cadence.ts:156`). It cannot identify a boxer step unprompted. | `[DOCUMENTED]` repo |
| History/streaks/PBs reset on app restart, SQLite not shipped | **False — this is stale.** `packages/data-sqlite` landed **2026-08-02** (commit `ad0bd8a`, ADR 0014). The composition root opens `SqliteEventStore` by default (`apps/mobile/src/context/app-context.ts`). **Caveats that keep it from being a clean yes:** it falls back to `memory-fallback` when expo-sqlite's native side is missing (old dev clients), and real-device validation is still pending an EAS rebuild (`documents/todo-summary.md`, "Remaining"). | `[DOCUMENTED]` repo + git log |
| Founder footage is shirtless-in-the-garden | **Confirmed as a constraint, unaddressed anywhere in the 08-06 docs.** See §5. | `[DOCUMENTED]` — `examples/IMG_0446` is a 133 s garden session; founder brief |

**Two more facts nothing in the marketing set acknowledges:**

- **There is no monetisation.** No RevenueCat, no StoreKit, no paywall anywhere in the repo. `[DOCUMENTED]`
- **There is no App Store listing.** `apps/mobile/app.json` is at `version 0.1.0`, dev/EAS builds only.
  Rank 0 in `ranking.md` — *"the precondition for all of it"* — **is not done.** Every calendar in the
  08-06 set assumes a launch that cannot happen yet. `[DOCUMENTED]`

**What is genuinely filmable today, with no new product work:** the propped-phone counter climb, the
warm-up "we can see you" presence check, hands-free gestures (raise arm → pause, both arms → finish),
**Tile rush** in full (four lanes, combo multiplier ×8 cap, trip penalty −50), the Foundations /
Rhythm / Endurance / Power lesson flow with spoken cues and metronome, trip detection + recovery
overlay, the skeleton preview, and Save-video export. `[DOCUMENTED]` repo.

**What is not filmable today:** any shot where the app tells you what your feet did. That is the
08-06 draft's designated hero clip.

---

## 1. The competitive fact that reframes every audience below

I pulled every jump-rope app I could find from the iTunes Search/Lookup API on 2026-08-07 (US store
unless noted). Ratings count is a weak proxy for installs, but it is a *consistent* one, and the
spread here is not subtle.

**Camera-based counters — our supposed competitive set:** `[DOCUMENTED]`

| App | Ratings | Avg | Released |
|---|---|---|---|
| NextJump — Jump Rope Counter | **18** | 4.39 | 2023-07 |
| Jump Rope Counter — AI Counter (id1662453801) | **13** | 4.15 | 2023-01 |
| Jump Rope Counter Pro | **11** | 4.00 | 2021-02 |
| Jump Rope Counter AI (id6760291364, "JRC") | **2** | 3.00 | 2026-03 |
| RopeBeat — Jump Rope Counter | **0** | — | 2026-03 |

**The wider jump-rope category — who actually has an audience:** `[DOCUMENTED]`

| App | Ratings | Avg | Shape |
|---|---|---|---|
| **Jump Rope Training \| Crossrope** | **13,476** | 4.85 | Hardware-tethered, programming + community |
| YaoYao — Jump Rope | 1,016 | 4.69 | Apple Watch motion sensor |
| Jump Rope Master | 912 | 4.55 | Tracker |
| Jump Rope Fit | 326 | 4.50 | Apple Watch |
| SmartRope (Tangram) | 267 | 3.56 | Hardware |
| Fancy Feats (Lauren Jumps) | 205 | 3.90 | Trick tutorials |
| JumRop — Jump Rope Rep Counter | 100 | 4.75 | Counter |

**Read this carefully, because the 08-06 strategy read it backwards.** It says camera counting is
"table stakes, not the wedge" — implying a table everyone is already sitting at. There is no table.
The entire camera-counting category, across five apps and three and a half years, has **44 US
ratings between them.** Crossrope — hardware you must buy, with a *paywalled counter* The Verge
called "jarring" — has **306× more ratings than all five camera counters combined.**

**The correct inference is not "counting is commodity." It is "counting has never sold a jump-rope
app to anyone."** What sells is *programming, structure and community* (Crossrope), or *sensor
convenience for people already committed* (YaoYao, watch apps). This is the pullup / GOLDEN Bars
pattern from `platform-selection.md` §pullup, and it should be read the same way: a competitor
shipping your feature and stalling at single-digit ratings is evidence about **demand**, not about
crowding.

Two further readings that matter for audience selection:

- **UK is a fifth of the US market here.** Crossrope: 13,476 US vs **1,064 GB**; YaoYao 1,016 vs 162;
  Fancy Feats 205 vs 106. `[DOCUMENTED]` The founder is UK-based and will film UK-idiom ("skipping").
  Post to a US-weighted audience, but the term split in `naming-aso.md` is real and load-bearing.
- **Adjacent categories are 10–100× bigger than jump rope.** Boxing Interval Timer **12,800**,
  Boxing Timer Pro **6,720**, Boxing iTimer Lite **6,677**, FightCamp **23,159**, Seconds Interval
  Timer **23,476**. Soccer footwork: Techne Futbol **16,881**, Train Effective **12,941**. Camera
  motion-game: Nex Active Arcade **1,128**. `[DOCUMENTED]` The audiences with money are *next door*
  to jump rope, not inside it.

---

## 2. Audience candidates

Eight. For each: who, size signal, want, hook, platform, format, and **the strongest reason it's
wrong for us** — that last field is the one to argue with.

---

### A1 — Boxing / combat-sports conditioning

**Who.** Amateur boxers, Muay Thai, MMA hobbyists, and the much larger "trains like a boxer" cohort.
Skipping is not optional in this world; it is the warm-up, and 3-minute rounds are the unit of work.
Male-skewed, 18–40, trains 3–6×/week, already owns a rope.

**Size / reachability.** The strongest purchase signal of any audience here: boxing *timer* apps —
single-purpose utilities — hold **12,800 / 6,720 / 6,677** US ratings, FightCamp **23,159**.
`[DOCUMENTED]` These people demonstrably buy phone apps for the gym floor. Community concentration on
short-form is dense (boxing/MMA training content is a permanent FitTok genre) but I could not size it
with a defensible number. `[GAP]` — hashtag view counts are not independently verifiable and I will
not invent one.

**What they'd want.** Round structure (3 min work / 1 min rest, bell), skips-per-round and cadence as
a conditioning metric, a record of whether round 6 fell off vs round 1, and footwork variation as
*work quality* (boxer step, alternate foot) rather than as a trick.

**Angle / hook.** *"Six rounds of skipping. It counted every one and told me exactly where I fell
apart."* The pain is real and specific: nobody knows how much their cadence decays across rounds
because nobody counts.

**Platform.** IG Reels + YT Shorts primary (per `ranking.md` #1); YouTube long-form has genuine query
demand ("jump rope workout for boxing", "how many skips should a boxer do") and compounds.

**Format.** Round-by-round decay reveal: 6 stacked bars, round 1 vs round 6, one number. Sweat, real
gym or garden, no screen-record needed for the hook — screen-record only for the payoff.

**Strongest reason this is wrong for us.** Skip-hero has **no round timer, no rest phase bell and no
per-round breakdown surfaced for skipping** in the form this audience thinks in — intervals exist as
a ModePlan but the product is built around lessons, patterns and a rhythm game, none of which a boxer
asked for. We would be entering the audience with the *one thing we do that they don't value*
(footwork classification — they already know their footwork) and *without* the thing they do value
(round structure). That's an inverted fit, and the competitor set here is mature, cheap and beloved
(4.79–4.90 avg ratings). We'd be the worst boxing timer on the store with a jump counter bolted on.

---

### A2 — Jump-rope-as-a-skill: freestyle, tricks, the "learn the boxer step" learner

**Who.** People for whom the rope is the sport, not the cardio. They watch trick tutorials, they have
a skill they're chasing (crossovers, double-unders, side swings), and they film themselves. 16–35,
mixed gender, high-trust community.

**Size / reachability.** The **only** audience here with an *assembled content community* whose
vocabulary we can enter — Q3 in the procedure. Lauren Jumps reports a **4M+ multi-platform following**
`[ANECDOTAL — self-reported on laurenjumps.com]`; Jump Rope Dudes reports **1.4M YouTube subscribers**
`[ANECDOTAL — channel-reported, retrieved via search 2026-08-07]`. But their *app* monetisation is
weak: Fancy Feats, the trick-tutorial app from that exact audience, has **205 US ratings at 3.90**.
`[DOCUMENTED]` Big content audience, small app wallet. Subreddit sizing: `[GAP]` — Reddit blocks
programmatic `about.json` access from this environment and public subscriber counts appear to have
been removed from subreddit pages in Sept 2025 `[ASSUMPTION, unverified]`; I could not establish
r/jumprope's size and will not guess it.

**What they'd want.** *Verification.* Every other app in this space **shows** you a move; none can
tell you whether you did it. That is precisely the gap the market scan named
(`documents/market-scan-2026-08.md`, "Whitespace nobody occupies: trick *detection*").

**Angle / hook.** *"Every jump rope app shows you the move. This one is the first that can tell you
whether you actually did it."* Then the proof beat: the phone calls the landing before the person
says anything.

**Platform.** IG Reels + YT Shorts primary. This community lives on IG and YouTube more than TikTok
(skill/technique content rewards rewatch and slow-mo). Reddit r/jumprope is **participation-only**
per `communities/audience.md` — the founder posts as himself or not at all.

**Format.** Slow-mo split-screen: feet on the left, app's read on the right, in sync. This is the
"wait, it saw that?" beat and it is the highest save/share content the product can generate.

**Strongest reason this is wrong for us.** **We cannot film it today** (§0). And when we can, the
read is honest but *unimpressive to an expert*: "left-only / right-only / feet-spread" is not a trick
vocabulary. A freestyler doing a toad or an EB gets told "both feet, close." To this audience that
reads as a broken product, not a limited one — and they are the harshest, most technically literate
judges in the space. Shipping the readout to *them* first risks burning the one high-trust community
we have.

---

### A3 — At-home beginner cardio / weight-loss ("cardio that isn't running")

**Who.** 25–45, wants 15 minutes of hard cardio in a bedroom or garden without a gym or a treadmill.
Bought a £10 rope, can do 30 seconds, gets discouraged, stops. The single largest addressable group
by headcount and by far the weakest by intent.

**Size / reachability.** Largest short-form audience of the eight; fitness/body-composition is the
densest converting vertical on both IG and TikTok (`instagram/audience.md` §9; `tiktok/audience.md`
§3 Tier A). Health & Fitness D35 download→paid **2.9%**, D60 RPI **$0.66** — the best category in
RevenueCat's data `[DOCUMENTED — bootstrapped-baseline.md §3]`.

**What they'd want.** "Am I doing enough?" A number that goes up, a session short enough to finish,
and permission to be bad at it. Not footwork. Not a game. Progress and streaks — **which now
persist** (§0).

**Angle / hook.** *"I couldn't skip for 30 seconds. Here's day 1 vs day 14, counted by my phone."*
Founder-as-subject, the only format where his own footage is the asset rather than a liability.

**Platform.** TikTok + IG Reels. Highest volume, lowest intent.

**Format.** Progress montage; day-N counter overlays; the streak strip. Cheap, repeatable, endlessly
variable from one recording session.

**Strongest reason this is wrong for us.** This audience does not need a camera to count — they need
a reason to keep going, which is a *content and coaching* problem, and Crossrope (13,476 ratings)
already solved it with 3,000 workouts and a community we structurally cannot match
(`market-scan-2026-08.md` explicitly rejects competing on content volume). Worse: this framing puts
us in the widest, most ad-saturated corner of the App Store with **no paywall, no Apple Health, no
calories** — the three things every review in this category demands. And it makes the founder's
shirtless garden footage central rather than incidental (§5).

---

### A4 — CrossFit / functional fitness (the double-under problem)

**Who.** CrossFit and functional-fitness athletes for whom double-unders are a named, feared,
competition-relevant skill with a specific failure mode (whipping the shins, tripping at rep 12 of
50). Affluent, gear-buying, coach-trained, 25–45.

**Size / reachability.** High purchasing power and a strong existing content culture. But: I could
not find any jump-rope app with meaningful traction inside this audience `[GAP]`, and CrossFit's own
2025–26 organisational turmoil makes the community's centre of gravity hard to locate `[ASSUMPTION]`.
Notably, an App Store search for "double unders" returns **no jump-rope app at all** in the top
results — the query surfaces MyFitnessPal, Nike and Map My Run. `[DOCUMENTED]` That is either an
open lane or a dead one, and I cannot tell which from this evidence.

**What they'd want.** Double-under **detection and a trip-free streak count** — "unbroken 42" is the
unit of currency. Nothing else.

**Angle / hook.** *"42 unbroken. It counted them, and it caught the exact rep I whipped my shin."*

**Platform.** IG Reels primary (CrossFit's home platform), YT Shorts secondary.

**Format.** Trip-detection reveal — we already have `trip-v1` cadence-collapse detection, the
`RecoveringOverlay` and "N rope catches" on the summary. This is shipped and filmable *today*.

**Strongest reason this is wrong for us.** **We cannot detect a double-under.** It is
recommendation #1 in our own market scan and it is unbuilt; `hip-oscillation-v2` counts revolutions of
the *body*, not the rope, so a double-under counts as one skip. Marketing to this audience with a
counter that under-reports their headline metric by 2× is not a limitation, it is a wrong answer, and
they will say so in the reviews. Everything else we offer (footwork patterns, a rhythm game, lessons)
is irrelevant to them.

---

### A5 — Kids, families and PE teachers

**Who.** Two distinct buyers wearing one label. (a) Parents wanting a screen-based activity that
makes a child move. (b) PE teachers running jump-rope units — a real, institutional, decades-old use
case.

**Size / reachability.** The most *documented* scale of any audience here. Jump Rope For Heart /
Kids Heart Challenge (AHA + SHAPE) raised **$1.2bn in the US 1978–2017**; Australia reports **8M+
children since 1983**; Canada **955,000 children in 2014/15 alone**. `[DOCUMENTED — vendor blog
citing programme figures, elitejumps.co; MEDIUM confidence, secondary source]` Jump rope is
institutionally embedded in schools in a way no other audience here is.

**What they'd want.** Tile rush, essentially unchanged. Multiplayer or turn-taking. A projector or TV
output for a hall. Zero setup, zero account, no data collection.

**Angle / hook.** *"I turned my phone into a jump-rope arcade for the class."* Or, for parents:
*"They did 400 skips because they thought it was a game."*

**Platform.** **Not short-form.** `x-linkedin/audience.md` §75 is explicit for kids/family/education:
*"NEITHER. Parent communities, Facebook groups, school channels, ASO."* This audience is reached
through PE-teacher Facebook groups, SHAPE America channels, and word of mouth between teachers.

**Format.** Not applicable to our pipeline — this is a relationship channel, which
`ranking.md` says the factory structurally cannot serve.

**Strongest reason this is wrong for us.** Three compounding blockers. (1) **Distribution is
un-servable by an edited-demo pipeline** — the whole premise of our channel ranking. (2) **Apple's
Kids Category rules** bar third-party analytics and data transmission and require parental gates
(Guideline 1.3) `[DOCUMENTED — Apple App Store Review Guidelines]` — our sync outbox posts the whole
event log to a server URL by default, which would have to be removed or gated. (3) **Filming children
for marketing** is a consent and moderation minefield the founder cannot solve with garden footage.
Genuinely large, genuinely wrong for *this* studio at *this* stage.

---

### A6 — Footwork athletes and return-to-sport rehab (basketball, football/soccer, tennis, physio)

**Who.** Athletes in sports where foot speed and ground-contact quality decide outcomes, plus the
rehab cohort: post-ankle-sprain, post-ACL, told by a physio to do single-leg hops and bilateral
symmetry work. Rope skipping is a standard prescription in both.

**Size / reachability.** The best evidence that *footwork specifically* sells apps:
Techne Futbol **16,881** ratings, Train Effective **12,941**, box-to-box **749**, Dr. Dish Player
**4,914**, FPRO **1,628**. `[DOCUMENTED]` These are footwork/skill-training apps with real audiences —
an order of magnitude above anything in jump rope. Rehab-side sizing: `[GAP]`.

**What they'd want.** The one stat only we can produce: **left/right symmetry**. "You are landing 58%
on your right." For a rehab patient that is a clinically meaningful number; for an athlete it is a
performance one. Plus single-leg hop counts and contact-time proxies.

**Angle / hook.** *"Six weeks after my ankle went, my phone told me I was still favouring the other
leg 62/38. I couldn't feel it."* This is the strongest single hook available to the product in any
audience — it is a genuinely new piece of information about your own body.

**Platform.** IG Reels + YT Shorts. Physio/S&C content is heavily IG-native. YouTube long-form has
real, high-intent query demand ("ankle sprain return to sport", "how to test single leg symmetry").

**Format.** The asymmetry reveal — one number, one reaction. Very cheap to film, and it does not
require the founder to be the subject.

**Strongest reason this is wrong for us.** **The asymmetry projection is not shipped** — the 08-06
docs already flag this and correctly refuse to fake it. And the moment we frame a number as
rehab-relevant we are making a **health claim about an injured person from an unvalidated
consumer-grade pose estimate**, which is an Apple review risk, a liability risk, and — most
importantly — probably wrong: our own `model-tuning-notes` show the landing detector needed
`passthroughLandmarks` on the ankles because stabilisation was destroying signal. We do not currently
have the measurement confidence to tell someone which leg to trust. `[ASSUMPTION — no accuracy study
exists; that itself is the finding]`

---

### A7 — Rhythm-game and camera-game players (Tile rush as a *game*, not a fitness app)

**Who.** People who play Beat Saber, Just Dance, Ring Fit, Nex Playground — who want *play* that
happens to be exercise. Not fitness-app buyers. Game buyers.

**Size / reachability.** The closest analogue, Nex's Active Arcade (phone-camera motion games), has
**1,128 US ratings at 4.73** `[DOCUMENTED]` — modest, but it is the only genuinely comparable product
and it validates that camera-driven play works on a phone. `platform-selection.md` Q2 is answered more
emphatically here than by any other angle: falling tiles + a combo counter + feet hitting lanes is
legible muted in under two seconds, to *anyone*, with no fitness context required.

**What they'd want.** Charts, difficulty, a score to beat, music. Tile rush already has four lanes,
seeded-RNG charts, three difficulties (1000/750/550 ms beats), a ×8 combo cap and a −50 trip penalty.
`[DOCUMENTED — src/tile-rush/]`

**Angle / hook.** *"Guitar Hero, except the buttons are your feet and the controller is a skipping
rope."* No explanation needed. This is the only hook in this document that requires zero setup
sentence.

**Platform.** TikTok primary (the one audience where TikTok genuinely beats IG — game clips and
"watch me fail" content are native there), IG Reels + YT Shorts as the same edit.

**Format.** Split-screen gameplay: feet bottom, lanes top, combo climbing, then the miss. Score
challenge in the caption drives comments, which per `playbook.md` §5 is the entire install funnel on
TikTok. Duet/stitch-native.

**Strongest reason this is wrong for us.** Game audiences are the **worst-monetising cohort in the
RevenueCat data**: Gaming D35 download→paid **1.0%** and D60 RPI **$0.14**, versus Health & Fitness
2.9% / $0.66 — a **4.7× revenue gap per install**. `[DOCUMENTED — bootstrapped-baseline.md §3]` We
would be trading the best-converting category on the store for the worst. Also: one 90-second chart
with no music licence, no leaderboard and no unlock progression is a demo, not a game, and this
audience churns in one session. And "Guitar Hero" phrasing is exactly the trade-dress line
`naming-aso.md` correctly told us not to cross.

---

### A8 — On-device-AI / privacy / quantified-self gadget people

**Who.** The "it runs locally, no account, no cloud" cohort. Overlaps r/LocalLLaMA, privacy Mastodon,
Hacker News, self-hosting. Technically literate, allergic to sign-up walls, will read an architecture
post.

**Size / reachability.** Real and reachable, but `ranking.md` puts HN and X/LinkedIn in the
**don't-bother tier** for exactly this shape of product: mobile apps hit ≥30 points on HN **2.5%** of
the time and are 0.7% of the top 300 `[DOCUMENTED — communities/case-studies.md]`; and Roman Koch ran
X + LinkedIn + YouTube across six consumer apps for a year for **$1,464** `[DOCUMENTED]`.

**What they'd want.** The architecture. Event-sourced append-only log, versioned detectors, golden-
master regression, recompute-the-past, keypoints-never-footage. All of which is real, unusual, and
genuinely well built — and all of which is in the repo already.

**Angle / hook.** *"My jump-rope app can re-count every session I've ever done with a better detector,
because it never threw the raw signal away."* This is the one audience for which the product's actual
engineering is the pitch.

**Platform.** YouTube long-form (one good 15-minute build video) + a single, honest, disclosed HN or
r/SideProject post — the **M2 one-shot mechanism** from `bootstrapped-baseline.md` §6. Never at volume.

**Format.** Long-form, founder talking over the debug renderer. Also: this is the audience that
produces **M3 third-party reviews** — the single highest-ROI action in the whole ranking.

**Strongest reason this is wrong for us.** *"Founders are not the market"* — `x-linkedin/audience.md`
§4 says engagement from this crowd is **zero signal, not weak signal**. They will star the repo,
compliment the ADRs, and not skip. It is a **credibility** channel with a one-shot ceiling, not an
acquisition channel, and treating it as the latter is how the factory wastes a month.

---

## 3. Angles ranked

Ranked on: filmable-today × audience density × how well our actual wedge answers their actual want ×
what it costs to be wrong. Each has a stated falsifier — the thing that, if it happens, kills it.

### #1 — Tile rush × rhythm-game framing × TikTok + IG Reels + YT Shorts

**Why first.** It is the only angle that is **100% filmable today with zero product work**, has **no
competitor anywhere** (Nex does camera rhythm games but not for rope; no rope app has play), and
clears Q2 harder than anything else we have: falling tiles and a combo counter are legible muted in
two seconds to a viewer who has never held a rope. It is also the only angle where a *failure* is
content — missing at combo ×12 is a better clip than hitting.

**Why not first on revenue.** It recruits the worst-monetising cohort (§A7). Treat #1 as a
**distribution experiment, not a positioning decision** — we are buying a read on whether the founder
can get reach at all, at the lowest possible production cost. Per `playbook.md`, the diagnostic is
**installs per 1,000 views**, not views.

**Falsified by:** 30 posts (the `taxonomy.md` F5 floor — under 30, any conclusion is void) producing
**zero comments** across the set, or view→link-click under 1%. Either means the reveal isn't landing
and no amount of Tile rush footage will fix it.

---

### #2 — Footwork verification × jump-rope skill learners × IG Reels + YT Shorts

**Why second, not first.** This is the *real* wedge and the only defensible one — but it is
**gated on building a footwork readout the app does not have** (§0). Rank it second because the
product work is small and well-specified (§5, F1), and because it enters the one genuine assembled
community (Q3) with the one thing that community has never had: verification rather than instruction.

**The honest brake.** Our vocabulary is landing geometry, not trick names. Lead with *"it can tell
which foot you landed on, every single rep"* — which is true, novel and demonstrable — and **never**
with "it names your move," which is not true and which the 08-06 content samples script three times.

**Falsified by:** ship the readout, post 10 clips, and the modal comment is *"so what?"* or *"my
watch does that."* Also falsified if founder self-testing shows the read is visibly wrong on camera —
a wrong readout on video is worse than no readout, and we have **no published accuracy figure** to
lean on `[GAP]`.

---

### #3 — "No £199 rope, no account, no subscription to count your own jumps" × Crossrope-curious × YouTube search + Shorts

**Why third.** It is the only angle pointed at an audience we have **proven exists and spends money**
(Crossrope: 13,476 ratings at 4.85). It answers real, high-intent, evergreen queries — *"Crossrope
alternative", "jump rope app without the rope", "is Crossrope worth it", "free jump rope counter"* —
which opens the Q4 evergreen lane and is the only **compounding** asset in the plan (`ranking.md` #3).
It is also the sharpest true contrast we have: Crossrope charges $4.99/mo *to count your jumps*, and
we do it for nothing, on hardware you already own.

**Why not higher.** Comparison content is slow, YouTube pays out in month 4 not week 1, and this
angle is a **conversion** play into an audience that has to already be shopping. It cannot generate
demand, only intercept it.

**Falsified by:** the query volume isn't there. Test cheaply — publish three query-answer videos, and
if none reaches triple-digit views in 30 days, the search inventory thesis for this niche is dead and
YouTube reverts to Shorts-only per `platform-selection.md` Q4.

---

### #4 — Round-structured conditioning × boxing / combat sports × IG Reels + YT long-form

**Why fourth, and why it's on the list at all.** It is the largest *proven app-buying* audience
adjacent to us (boxing timers at 6,700–12,800 ratings) and the one place where "how many skips, at
what cadence, over six rounds" is a question people already ask. But it needs a round timer with a
bell and a per-round breakdown — real work, aimed at an audience that does not care about our wedge.

**Falsified by:** cheapest test in the document, and it needs **no code**: film three round-decay
clips using the existing interval mode and see whether the boxing side of FitTok engages at all. If
not, drop it permanently.

---

**Deliberately not ranked:** kids/PE (A5 — un-servable by the pipeline, Kids Category compliance),
CrossFit (A4 — we get their headline metric wrong), rehab (A6 — no asymmetry stat, no accuracy study,
health-claim risk), gadget/HN (A8 — credibility only, one-shot).

---

## 4. Per-audience content — what the founder could film in one session

Tied to `playbook.md` §2: one ~40-minute session, **8–15 distinct clips** (distinct premises, never
one clip cut fifteen ways — that is the TikTok originality trap, `tiktok/credibility.md` §1).

### For #1 Tile rush (film today, no product work)

1. **Cold open, no words.** Lanes falling, feet hitting, combo climbs to ×8. 12 seconds. On-screen
   text at 0.5s only: *"jump rope, but it's Guitar Hero for your feet."*
2. **The miss.** Build to ×12, break it, genuine reaction. Caption: the score to beat. Comment-bait
   by construction.
3. **Three difficulties, three tempos.** 1000 ms → 750 ms → 550 ms in one clip. The escalation is the
   structure; no VO needed.
4. **Trip penalty.** Catch the rope, `TripBloom` fires, −50, the recovery overlay, three catch-up
   skips, back in. *"It knew I tripped before I did."* — shipped, real, filmable.
5. **Hands-free.** Raise an arm mid-run → paused. Both arms → finished. *"Never touched the phone."*
6. **Setup ritual / propped-phone POV.** Phone against a wall, walk back six feet, the presence check
   goes green ("we can see you"), start. This is the ASMR-shaped broad-reach filler.

### For #2 Footwork verification (film once the readout exists)

7. **Split-screen slow-mo.** Feet left, live read right, in sync, deliberately switching between
   two-foot bounce and alternating. The whole clip is the sync. **No voiceover** — let the viewer
   catch it.
8. **The blind test.** Founder does a pattern off-camera-frame, the app calls it, then the camera
   pans down to reveal it was right. Argument-bait in the comments, which is the documented
   unconnected-reach lever (`platform-selection.md`, pullup §Q2).
9. **The lesson that grades you.** Foundations, metronome ticking, spoken cue, the step gate refusing
   to advance until the alternating landings actually register. *"It wouldn't let me move on."*

### For #3 Crossrope-alternative (film today)

10. **£199 vs £0.** Crossrope's paywalled-counter pricing page on screen, then the same count
    happening on a propped phone with a £10 rope. One cut. Fact-based, no sneering.
11. **YouTube long-form, ~8 min:** *"I tried counting jump ropes four different ways: a £10 rope, an
    LCD handle, an Apple Watch, and a camera."* Honest, includes where the camera loses. This is the
    query-answer inventory play and the review-bait piece.

### For #4 Boxing round decay (film today)

12. **Six rounds, one graph.** Cadence round 1 vs round 6. *"Round 6 was 22% slower and I'd have sworn
    it was my best one."* One number, one reaction.

**Two cross-cutting production rules, both from our own research and both violated by the 08-06 plan:**

- **The founder must answer every comment in the first ~2 hours** (`playbook.md` §5). It is the only
  in-video path to the App Store on TikTok/IG. The 08-06 calendar budgets this for "the first 3
  posts" — that is not enough, and it is the cheapest thing being under-budgeted.
- **Every good comment question becomes tomorrow's video.** Unambiguously original, self-hooking,
  free. This is what makes 8–15 distinct clips/week sustainable.

---

## 5. Per-audience feature asks — the roadmap this implies

Ordered by (audience value ÷ build cost). Specific and buildable; everything below is expressible in
the existing event/projection architecture.

### F0 — Ship a store listing and decide monetisation *(blocks everything)*
Rank 0 in `ranking.md`. There is no App Store presence and no paywall in the repo. Per
`bootstrapped-baseline.md` §7, **default to a hard paywall** (10.7% vs 2.1% D35, a 5× lever) and
**trials of 17–32 days** (42.5% vs 25.5% conversion, and the market is moving the wrong way — a cheap
edge). Also do PPP pricing + full store localisation on day one (M6, the only fully automatable
portfolio-wide lever). **No content should be produced before this exists.**

### F1 — A footwork readout on the live session and summary screens *(unblocks angle #2)*
The detector already emits everything. The work is a UI surface: a live "last landing" chip on
`session.tsx` (left / right / both / close / spread), and a summary breakdown — *"113 landings: 48
left, 45 right, 20 both."* Reuse `debug.tsx:183-210`, which already renders exactly this feed.
**Smallest, highest-leverage build in this document.** Audience: A2, A6.

### F2 — Left/right symmetry projection *(the single best hook in the product)*
A pure fold over `landing-detected` events — no new detection. Ships the "you favour your right,
58/42" reveal that A6 wants and A2 will share. Our own market scan ranks it #2. **Gate it on an
accuracy check first:** film a deliberate 60/40 session and confirm the number is right before it
goes on screen or in a clip. Audience: A6, A2, A3.

### F3 — Round mode: work/rest with a bell, and a per-round breakdown *(unblocks angle #4)*
Intervals exist as a ModePlan; this is presentation plus a boxing-idiom preset (3 min / 1 min, bell
cue, round counter) and a summary that shows skips + cadence per round. Audience: A1.

### F4 — Double-under detection *(gates A4 entirely)*
Market-scan recommendation #1. Rope revolutions per body oscillation from wrist-revolution rate +
flight time; new `trick-detected` event + detector version; the recompute pipeline re-scores stored
sessions the day it ships. High tuning cost, footage-gated. **Do not market to CrossFit before this.**

### F5 — Tile rush as an actual game *(makes angle #1 retain)*
Multiple charts, unlock progression, a persistent high score, and difficulty beyond three tempos.
Today it is a 90-second demo. Audience: A7, A5.

### F6 — Apple Health + Watch *(table stakes we lack)*
Every serious competitor has it; it is the most common complaint we will get. `HealthSink` adapter
per the coding standards. Audience: A3, A1, A4 — i.e. everyone who isn't A7 or A8.

### F7 — Skeleton-replay share export *(the growth loop)*
`scripts/debug-video.sh` already renders skeleton + counter + landing flashes offline. Port it into
the app over `SignalStore` recordings. Privacy-safe (keypoints, not footage), branded, and —
critically — **it solves the shirtless problem** (§below). Market-scan recommendation #4; the 08-06
strategy correctly makes it growth investment #1. Audience: all.

### F8 — Instrumentation *(Gate 0, `playbook.md` §6)*
Immutable `acquisition` envelope block, `app-install-attributed` event, AdServices token, RPI by
cohort-day. Ship as a feature-dev run **before** the pipeline goes live. No acquisition dimension, no
spend, and no honest read on which of these angles worked.

---

### The shirtless-garden constraint — confronted, not routed around

The founder's raw footage is frequently shirtless in a garden. This is real and it is a **reach**
problem, not just a taste one.

**What I can establish.** TikTok's 2026 moderation stack uses automated computer vision that flags
body exposure frame-by-frame and weighs it against declared context, with fitness/outdoor activity
treated as a mitigating context rather than an exemption; creators report shirtless fitness posts
being appealed-and-restored but with suppressed views. Instagram down-ranks "borderline"/adult-adjacent
content without notification. `[DOCUMENTED — directional; secondary sources via search 2026-08-07.
I could not retrieve TikTok's primary For-You-feed eligibility text — the policy pages truncate
past the fetch limit. `[GAP]` — the specific rule wording remains unverified.]`

**Why it matters more than it looks.** Per `ranking.md`, IG's whole value to us is that every post is
tested on a small stranger audience first — a free A/B harness. A silent reach penalty applied to
that first test **corrupts the only fast signal we have**. We would read "hook didn't land" when the
truth is "torso was flagged." That is worse than a ban, because it is invisible and it poisons the
feedback loop the entire pipeline is built on.

**Three responses, in order of cost:**

1. **Wear a shirt.** A vest or t-shirt costs nothing and removes the variable entirely. Not a
   compromise — an unambiguous improvement to the measurement.
2. **Build F7 (skeleton replay).** A glowing cyan skeleton on Nocturne black is *more* on-brand than
   a person, unambiguously safe, and it is the product rendering its own marketing asset. This is the
   strongest argument for F7 and the 08-06 docs already ranked it #1 for a different reason.
3. **Frame from the knees down.** Angle #2 is a *feet* story. The best footwork clip in the world
   contains no torso at all.

Any of the three works. Doing none of them means the founder cannot trust a single number the
pipeline reports.

---

## 6. Where the 2026-08-06 draft strategy is wrong

Read as a prior draft to be tested, per the brief. It is strong on positioning and voice; these are
the load-bearing errors.

1. **The persistence gate is stale.** `strategy.md` "Feature-truth gates" says *"the event log resets
   with the app (SQLite not shipped)"* and decision #4 asks the founder to withhold streak/history
   marketing. **SQLite landed 2026-08-02** (`ad0bd8a`, ADR 0014) — four days before that document was
   written. Decision #4 is moot. Streaks, history and PBs are marketable, with two real caveats: the
   `memory-fallback` path on clients built without expo-sqlite, and pending on-device validation.

2. **The designated hero clip cannot be filmed.** `content-samples.md` Draft 2 scripts the app calling
   *"Both feet." "Alternate foot." "Boxer step: clean."* and annotates it *"(landing-pattern detection
   — shipped.)"* The **detection** is shipped; the **readout is not on any user-facing screen** — it
   exists only in Debug, in Tile rush lanes, and inside lesson step gating. F1 (§5) is required before
   the wedge format exists. This is the most consequential error in the set: the entire content plan
   is built on a shot that cannot be taken.

3. **"Boxer step: clean" is not a thing the app can say.** There is no move classifier. The lesson
   engine instructs, then verifies alternating landings within a step it already prescribed. Marketing
   this as recognition invites a review-driven expectation gap.

4. **The competitive read is inverted.** The draft treats camera counting as *"table stakes, not the
   wedge"* because competitors ship it. The store data says all five camera counters together hold
   **44 US ratings**, while hardware-tethered Crossrope holds **13,476** (§1). Competitors shipping a
   feature nobody downloads is evidence about **demand**, not saturation. The implication is not
   "counting is commodity, lead with footwork" — it is "**nothing in this category has ever sold on
   counting; the money is in programming and structure**," which points at angle #3 and at F3/F6.

5. **"Not the target: Apple-Watch quantified-fitness users — those want persistence we haven't
   shipped."** Wrong reason. Persistence shipped; **Apple Health did not**. The blocker is F6.

6. **The shirtless-footage constraint appears nowhere** across all five documents, despite being a
   known property of the founder's raw input and a documented reach risk (§5).

7. **Rank 0 is skipped.** Both calendars schedule a 14-day launch push with an App Store link, against
   a repo at `version 0.1.0` with no listing, no paywall and no IAP. Per `ranking.md`, *"the store page
   is where indie apps most reliably die."* F0 must precede day 1.

8. **Cadence conflicts with the factory playbook, in the risky direction.** The draft proposes *1 hero
   asset/day crossposted ×3* for two weeks. Cross-posting one edit to three platforms is correct and
   endorsed; the risk is the implied **4–5 films/week** producing 14 posts/week per platform. The
   playbook wants **8–15 distinct clips** from ~40 minutes of recording, because *"volume comes from
   more raw footage, not more permutations of the same footage"* — the TikTok originality-crackdown
   penalty is silent search-restriction, which we would not notice.

9. **Comment budget is an order of magnitude low.** Draft: *"reply to every comment in the first hour
   of the first 3 posts."* Playbook: **every comment, first ~2 hours, every post, daily** — it is the
   only in-video path to the App Store and the one thing that cannot be automated.

10. **Expectations are unset.** No document in the set states the baseline. Per
    `bootstrapped-baseline.md`: median subscription app = **$72/month at one year**; 17.3% ever reach
    $1,000 MRR; months 3–8 flat is the *modal* path. A month-3 review with four pre-agreed outcomes
    (continue / reprice / reposition / kill) should be on the calendar before launch, not after.

---

## 7. Evidence and gaps

**Documented and verifiable (method stated so it can be re-run).**
All App Store figures: iTunes Search + Lookup API, `country=us` unless marked GB, retrieved
**2026-08-07** — re-runnable via `https://itunes.apple.com/search?term=...&entity=software`. Rating
counts are a proxy for installs, not a measure of them; treat ratios between apps as meaningful and
absolute levels as indicative. All product claims: `/Users/morkus/src/skip-hero` at HEAD `0285e4d`,
with file and line references given inline. Benchmarks (RevenueCat percentiles, retention medians,
category RPI/conversion): `../failures/bootstrapped-baseline.md`, sourced there. Channel rankings and
community rules: `../synthesis/ranking.md`, `../platforms/*/audience.md`.

**Explicit gaps — I looked and could not establish these. Each is a real open question, not a
placeholder.**

1. **Subreddit sizes for every community named** (r/jumprope, r/amateur_boxing, r/crossfit,
   r/physicaltherapy). Reddit blocks programmatic `about.json` from this environment, and public
   subscriber counts appear to have been removed from subreddit pages around September 2025
   `[ASSUMPTION — I could not verify that change from a primary source]`. **Resolve by:** the founder
   opening each subreddit in a browser and reading the sidebar. Five minutes, and it would materially
   sharpen A1, A2 and A6.
2. **Hashtag / short-form community scale for jump rope.** No independently verifiable view counts
   exist; vendor "trend report" blogs recycle each other. **I have deliberately not quoted a number.**
   The honest substitute is the creator-scale figures in A2, and those are self-reported.
3. **Skip-hero's own detection accuracy.** No accuracy study exists — not for skip counting, not for
   landing classification. Goldens prove *reproducibility*, not *correctness*; the two device
   recordings are pre-fix. Angle #2 and feature F2 both depend on a number nobody has measured. **This
   is the most important gap in the document**, because a footwork readout that is visibly wrong on
   camera is worse than no readout.
4. **CrossFit / double-under demand.** An App Store search for "double unders" returns no jump-rope
   app in the top results. Open lane or dead lane — unresolvable from search data alone.
5. **Rehab / physio market sizing for consumer movement apps.** Not established.
6. **TikTok's primary policy text on body exposure and For-You-feed eligibility.** The guideline pages
   truncate past the fetch limit; §5 rests on secondary reporting and is tagged directional.
7. **Kids Heart Challenge current-year participation.** Only historical and per-school figures found;
   the $1.2bn / 8M-children figures come from a vendor blog citing programme sources, not from AHA
   directly.
8. **Whether any competitor's traction is understated by rating counts** — a free ad-supported app can
   have many installs and few ratings. The *relative* spread (44 vs 13,476) is large enough to survive
   that objection; the absolute levels are not.

**Sources consulted this session:**
[iTunes Search API](https://itunes.apple.com/search) ·
[Crossrope App Store listing](https://apps.apple.com/us/app/jump-rope-training-crossrope/id1146061856) ·
[Jump Rope Counter — AI Counter](https://apps.apple.com/us/app/jump-rope-counter-ai-counter/id1662453801) ·
[RopeBeat](https://apps.apple.com/in/app/ropebeat-jump-rope-counter/id6759896128) ·
[NextJump](https://apps.apple.com/us/app/nextjump-jump-rope-counter/id6451026115) ·
[Elite Jumps — What Happened to Jump Rope for Heart?](https://elitejumps.co/blogs/guides/jump-rope-for-heart-explained) ·
[Lauren Jumps](https://laurenjumps.com/) ·
[Jump Rope Dudes](https://www.youtube.com/c/JumpRopeDudes) ·
[Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) ·
[App Store Review Guidelines History — kids apps, ads and analytics](https://www.appstorereviewguidelineshistory.com/articles/2019-09-14-kids-apps-ads-analytics-and-sign-in-with-apple/) ·
[TikTok — approach to content moderation](https://www.tiktok.com/safety/en/policies-and-engagement/content-moderation) ·
[TikTok Community Guidelines 2026 summary](https://www.auditsocials.com/platforms/tiktok-community-guidelines) ·
[Instagram adult content policy 2026 summary](https://arunatalent.com/blog/instagram-adult-content-policy-2026/) ·
[Fortune Business Insights — jump rope market](https://www.fortunebusinessinsights.com/jump-ropes-market-114903)

---

## 8. The recommendation in one paragraph

Do **F0** (store listing, hard paywall, 17–32 day trial, PPP + localisation) and **F1** (put the
footwork readout on the session and summary screens) before filming anything — the first is the
precondition for every install and the second is the precondition for the only defensible hook we
have. Then run **angle #1 (Tile rush)** as the distribution experiment, because it is free to film
today, has no competitor, and reads in two seconds muted; run **angle #2 (footwork verification)** the
week F1 lands, because it is the wedge; and let **angle #3 (the Crossrope-alternative query set)**
compound slowly on YouTube in the background, because it is the only audience in this space we have
*proven* spends money. Film in a shirt or from the knees down, answer every comment within two hours,
judge everything on **installs per 1,000 views** rather than views, hold thirty posts before drawing
any conclusion, and put a month-3 review on the calendar now — because the baseline says $72/month at
one year and a flat months-3–8 stretch is the normal path, not the failure.
