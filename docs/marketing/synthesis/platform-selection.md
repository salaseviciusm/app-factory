# Platform selection — the decision procedure, per app

**Compiled:** 2026-08-05. Wave 3 synthesis. Run this before committing a single founder-hour
of recording to a new app. Companion to `ranking.md` (the default order) and every
`platforms/*/audience.md` (the evidence).

**The conclusion first.** For the factory's actual portfolio — consumer camera/fitness apps
with a 3-second visual reveal, cheap subscriptions, individual impulse buyers — the answer is
almost always the same: **IG Reels + YT Shorts + TikTok primary, YouTube long-form + search
inventory where a real query exists, Reddit as participation-only support, X/LinkedIn never.**
The procedure below exists to *prove* that per app, and to catch the app where the default is
wrong (a workflow tool, a dev tool, a B2B product — none of which the factory currently
ships, but the gate must still be run).

---

## The procedure — six questions, in order

Answer honestly. The first "no" that matters routes the app, or kills the marketing plan.

### Q1 — Is the buyer a consumer, 16–45, paying with their own money, ≤ $30/yr or ≤ $10/wk, in under 60 seconds?
- **Yes →** continue. This is the short-form lane. (`platforms/tiktok/audience.md` §4; `platforms/instagram/audience.md` §9)
- **No — B2B / team / professional / >$100/yr →** short-form is the *wrong* channel and the
  factory probably shouldn't have built it. X/LinkedIn/community, not Reels. Tube2Blog got
  1M TikTok views and **zero** conversions doing exactly this (`platforms/tiktok/case-studies.md` F1). `[DOCUMENTED]`

### Q2 — Is the value legible in a **muted 5-second phone clip** — a reveal, a score, a number going up, a before/after?
- **Yes →** short-form (IG Reels + YT Shorts + TikTok) is **primary**. The reveal *is* the ad.
  Cal AI designed its first screen against "understood within three seconds of a TikTok"
  (`platforms/tiktok/case-studies.md` §1). `[DOCUMENTED]`
- **No — the value is a workflow / system / invisible-until-week-2 →** YouTube **long-form is
  primary**; short-form is a weak secondary. Obsidian's entire growth was long-form because a
  PKM system is unshowable in 15s and fully showable in 20min (`platforms/youtube/case-studies.md` WIN 3). `[DOCUMENTED]`

### Q3 — Name the existing content community whose vocabulary you can enter or search. Can you?
- **Yes →** you are entering an assembled audience — the moat. Name it (FitTok, jump-rope,
  calisthenics, r/running). (`platforms/tiktok/audience.md` §3, §5)
- **No →** you are building from zero, which the 2025 data says is now "brutally slow for
  small accounts" (−59% YoY reach). Reconsider whether to market this app at all.

### Q4 — Can you write **ten** "how do I X / best X for Y / is my X legit" search queries the app is the honest answer to?
- **Yes →** the evergreen lane is open: **YouTube long-form** (compounds for years) + **TikTok
  search-query inventory** (permanently discoverable). This is the highest-defensibility
  organic tactic for a demo library (`platforms/youtube/audience.md` §4; `platforms/tiktok/algorithm.md` §6). `[DOCUMENTED]`
- **No →** treat YouTube as **Shorts-only** (a second Reels feed). Fine — just don't build a
  long-form library with no search demand (the "dusty SaaS channel" failure, `platforms/youtube/case-studies.md` FAILURE 1).

### Q5 — Does *using* the app produce a shareable artifact, or need other people to work?
- **Yes →** build the loop into the product; it beats posting. Hevy hit 2M downloads with an
  in-product social loop and **no marketing**; Locket turned 100K views into 2M signups
  because the widget needs 3–5 friends; Yuka reached ~80M on word-of-mouth from a scan-and-show
  moment (`platforms/instagram/case-studies.md` WIN 4; `platforms/paid/case-studies.md` §4). `[DOCUMENTED]`
- **No →** the content carries 100% of acquisition. That's viable, but it must be the plan.

### Q6 — Hard paywall or freemium?
- **Hard paywall →** paid acquisition *can* eventually open (D60 RPI $3.09 vs $0.38 —
  8×). (`platforms/paid/triggers.md` §3) `[DOCUMENTED]`
- **Freemium →** the app is **permanently organic-only**. Legitimate (Yuka), but state it in
  the spec at stage 1, not discover it at stage 11. `[DOCUMENTED]`

**Routing rule:** Q1 says whether we're in the consumer lane at all; Q2 says short-form vs
long-form primary; Q3 says whether there's an audience to enter; Q4 unlocks the evergreen
lane; Q5 finds free distribution; Q6 sets whether paid is ever reachable. Reddit is
*participation support* for any consumer app (never a posting channel); X/LinkedIn stay off
unless Q1 answered "B2B/dev."

---

## Worked examples — the factory's current apps

All three are consumer camera/fitness apps, so all three land in the same primary lane. The
*differences* are in the community, the search inventory, and the monetisation caveat.

### running-with-pace — running/pace tracker for casual runners
- **Q1** consumer, cheap sub, own money → **yes**. **Q2** visible pace/distance numbers going
  up → **yes, reveal-shaped**. **Q3** FitTok + the running community (`platforms/tiktok/audience.md`
  §4 names it explicitly: *"A running/pace tracker for casual runners → Yes, FitTok + hobby
  community… Strong fit"*). `[DOCUMENTED]` **Q4** yes — "how to run a faster 5k," "couch to
  5k pace," "what pace for a sub-30 5k" are real, high-volume, honest queries. **Q5** a shared
  run/PR is naturally screenshot-worthy → build a share card. **Q6** likely freemium → assume
  organic-only, state it.
- **Verdict:** IG Reels + YT Shorts + TikTok primary (reveal = pace/PR on screen); **YouTube
  long-form + TikTok search inventory** genuinely open here (strong query demand); Reddit
  r/running (4.2M) is **participation-only** — gear/app discussion lives in weekly threads,
  direct promo is removed (`platforms/communities/audience.md` §1.2). r/AppHookup for a spike.
  Not X/LinkedIn.

### skip-hero — camera rope-skipping trainer (front camera counts skips)
- **Q1 yes. Q2** the purest reveal of the three — "point the camera, it counts your skips" is
  the Cal AI shape, legible muted in <3s. **Q3** FitTok + jump-rope/boxing/CrossFit/HIIT
  communities. **Q4** partial — "jump rope workout for beginners," "how to do double-unders,"
  "jump rope vs running" exist but are thinner than running's; treat YouTube as Shorts-first
  with a few long-form query answers. **Q5** skip count / streak / session is share-worthy →
  in-product share loop is worth building (Q5 is a genuine yes here). **Q6** subscription.
- **Verdict:** **the best short-form fit in the portfolio** — a pure visual-reveal camera app.
  Lead with IG Reels + YT Shorts + TikTok; the reveal carries it. Prioritise the in-product
  share loop (Hevy pattern). This is the app to run the pipeline's first real experiment on
  (see `open-questions.md`).

### pullup — camera pull-up rep verifier (iOS, freemium annual ~$19.99, intermediate calisthenics)
- **Q1 yes** (consumer, own money) but **small TAM, flagged in the spec itself**: GOLDEN Bars
  shipped the near-exact concept and stalled at **7 ratings** (`apps/pullup/spec.md` §2). **Q2
  yes** — "strict reps counted, kips/half-reps rejected" is a legible, opinionated reveal, and
  it doubles as *argument-bait*: calisthenics people already argue about "was that chin over
  the bar?" (spec §1) — natural shareability, the documented unconnected-reach lever. **Q3**
  r/bodyweightfitness, r/calisthenics, calisthenics FitTok — dense, high-trust, **promo-hostile**.
  **Q4 yes, strong** — "are my pull-ups legit," "chin over bar rules," "how to stop kipping,"
  "am I doing full ROM" are real high-intent queries the verifier is the honest answer to →
  YouTube long-form + TikTok search inventory genuinely open. **Q5** the per-rep verdict is
  shareable; leaderboards are cheatable (review-mining warns — spec §2) so lean on the honest
  verdict, not social scores. **Q6** freemium subscription **with a frequency problem**:
  2–4×/week usage caps subscription comfort (spec §2). Per `platforms/paid/triggers.md` §3,
  freemium = **permanently organic-only**; and if the progression content isn't real, this
  should be a one-time unlock, not a sub (spec's own §1 conclusion).
- **Verdict:** IG Reels + YT Shorts + TikTok primary, into the calisthenics community, with the
  "kip rejected — was that a real rep?" verdict as the hook. **Strong YouTube long-form +
  search-inventory case** (the query demand is the best of the three). But two honest brakes:
  (a) it is the *narrowest* audience — the marketing-widening move the market notes already
  recommend is **broaden the pose pipeline to pull-ups + dips + push-ups** (`apps/pullup/market-notes.md`),
  which enlarges the addressable short-form audience toward the proven push-up cluster; (b) the
  open question is whether the pull-up-only niche has enough demand for even organic short-form
  to matter — see `open-questions.md`.

---

## The selection table (default routing, once Q1–Q2 place an app)

| App shape (Q2 / Q4 result) | Primary | Evergreen | Support | Never |
|---|---|---|---|---|
| **Reveal-shaped, strong search queries** (pullup, running-with-pace) | IG Reels + YT Shorts + TikTok | YT long-form + TikTok search inventory | Reddit participation, r/AppHookup spike | X, LinkedIn, HN, PH |
| **Reveal-shaped, thin queries** (skip-hero) | IG Reels + YT Shorts + TikTok + in-product share loop | YT Shorts-only + few query answers | Reddit participation | X, LinkedIn, HN, PH |
| **Workflow/system, invisible in 3s** (none current) | YT long-form | YT search library | HN if OSS/dev; Reddit tool subs | TikTok-primary |
| **Dev tool / B2B** (none current) | X (dev) / LinkedIn (B2B) | YT tutorials | HN (one-shot), r/SideProject | TikTok, IG as acquisition |

**The rule the table encodes:** the factory currently ships only row 1–2 apps, so its default
is fixed. The procedure exists so that the day an app doesn't fit row 1, someone notices at the
spec gate instead of after two months of Reels into an audience that was never there.
