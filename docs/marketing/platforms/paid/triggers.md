# Spend triggers — when the App Factory spends its first pound, and on what

Research date: **2026-08-05**. Decision rules derived from `landscape.md` (channel
economics), `aso.md` (organic mechanics) and `case-studies.md` (what actually happened to
people who tried).

Cross-checks `playbooks/analytics-taxonomy.md` and `playbooks/monetization.md` — read on
2026-08-05, **not edited**. Deltas reported in §7.

---

## 0. The default answer is £0, and it stays £0 for most apps

RevenueCat's 2026 dataset (115,000+ apps, $16B+ revenue) puts **median revenue per install
at day 60 at $0.55 in North America**
([RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)).
Median Apple Ads CPI in the US is **$4.06**
([AppTweak](https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks)).

**The median app is ~7× underwater on its first bought install and never catches up.**

Paid acquisition is not a growth stage that every app reaches. It is a privilege that a
minority of apps earn by monetising far above median. For most of our portfolio, the
correct lifetime paid budget is **zero**, and that is a successful outcome — see Yuka
(`case-studies.md` §4): ~80M users, profitable, never bought a single install.

Everything below exists to answer one question: **has this specific app earned the right to
spend?**

---

## 1. Gate 0 — Instrumentation (binary; no exceptions, no "we'll add it after")

You cannot evaluate paid spend with the analytics taxonomy as currently specified. This is
the hard blocker and it must be closed before any budget is approved.

### What must exist before the first pound

| # | Requirement | Status vs `playbooks/analytics-taxonomy.md` |
|---|---|---|
| 1 | **Acquisition source on every install**, carried for the user's lifetime | 🔴 **Missing.** The standard envelope carries session id, app version, template version, brand id, platform — **no acquisition dimension.** `app-session-started` has a `source` property but it distinguishes push/deeplink/organic, not campaigns. |
| 2 | **AdServices attribution token captured on first launch** (iOS) and **Play Install Referrer** (Android), forwarded to RevenueCat as subscriber attributes | 🔴 **Missing.** No install/first-open event is defined at all. |
| 3 | **Custom Product Page ID** captured, so CPP performance is measurable | 🔴 **Missing.** CPPs aren't in the ASO playbook either (`aso.md` §9). |
| 4 | **Day-indexed cohort revenue: RPI at D0 / D7 / D30 / D60** | 🔴 **Missing.** §Metrics specifies "Revenue: trials, conversion, churn, ARPU" — ARPU is not RPI and is not cohorted by days-since-install. **RPI is the number the CPI ceiling is computed from.** |
| 5 | **Retention split by acquisition source** | 🟡 Retention is correctly defined on the habit event, but cannot be sliced by source without #1. |
| 6 | **Rating and review-count monitoring with an alert** | 🔴 Not analytics — App Store Connect — but there is no runbook item anywhere. It is the primary kill trigger (§5). |
| 7 | **Refund rate by acquisition source** | 🟡 Refunds are tracked (RevenueCat) but not sliceable by source. |
| 8 | **Activation event defined and firing** | ✅ **Already correct.** "If you can't name the activation event, the spec isn't done." |
| 9 | **D1/D7/D30 retention on the habit event, not app-open** | ✅ **Already correct.** "opens lie" — exactly right, and it is what Quibi got wrong. |

### The one-line version

**Add an `acquisition` block to the standard envelope** (source, campaign-id, ad-group-id,
keyword-id, cpp-id, country, attribution-method) **set once at install and immutable
thereafter**, plus an `app-install-attributed` event. Everything else in the gate follows.

None of this is PII and none of it is free-text, so it sits inside the taxonomy's existing
discipline rules.

**Rule: no acquisition dimension, no spend. This is not negotiable, because without it
every pound spent is unmeasurable and every conclusion drawn from it is fiction.**

---

## 2. Gate 1 — Organic evidence required BEFORE any spend

Paid amplifies. It does not originate. **In all ten cases in `case-studies.md`, not one
shows paid acquisition discovering a growth channel from a standing start.**

All six must be true. Not five.

| # | Gate | Threshold | Why |
|---|---|---|---|
| 1 | **Store rating** | **≥ 4.0**, ideally ≥ 4.5, with ≥ 20 recent ratings | Sub-3.5 materially suppresses store visibility; the 3→4 star band is associated with ~89% conversion difference (`aso.md` §5). Below 4.0 you pay full CPI for a page that converts ~30% instead of ~50% — burning ~40% of every pound at the door. |
| 2 | **D1 retention on the habit event** | **≥ 30%** | Below this you are buying users who leave before the paywall. Threshold from [PickAppDuck](https://note.com/pickappduck/n/naae8c552077f) **[ANECDOTAL]**; adopted because it is consistent with every failure in `case-studies.md`. |
| 3 | **D30 retention on the habit event** | **≥ 8%**, and the curve must be **flattening**, not still falling | A curve still declining at D30 has no asymptote, which means no LTV, which means no CPI ceiling exists. |
| 4 | **Organic installs** | **≥ 300 cumulative**, with **≥ 60 days elapsed** since the first cohort | You need a cohort old enough to have a real D60 RPI. Anything younger is extrapolation. |
| 5 | **ASO complete and measured** | Title/subtitle/100-char keyword field filled; **≥ 1 PPO test concluded**; **≥ 1 CPP live**; Apple tags reviewed | Halo only applies to keywords already in your metadata (`aso.md` §7). Spending on a keyword absent from metadata forfeits the free half of the return. |
| 6 | **At least one organic channel producing installs** | Any: search, social, community, word of mouth | If nothing is working organically, paid buys you a more expensive version of nothing. |

### Gate 1b — the arithmetic gate

Gates 1–6 say the app is healthy. This one says whether spending is *possible*.

```
CPI ceiling  =  organic-cohort D60 RPI  ×  0.7  ×  0.5
                                          ↑       ↑
                    paid-traffic haircut ─┘       └─ margin for
                    (assumption, §6)                 store fee + error
```

**Two hard stops:**

- **If organic D60 RPI < £1.00, no paid channel is open to you at any budget.** The
  cheapest realistically-targetable geo (UK, Apple Ads, £2.60 ≈ £2.05 CPI at
  2026 rates) cannot be cleared. This will be true of most apps.
- **If the resulting CPI ceiling is below the category's median CPI for your target geo**
  (`landscape.md` §1 tables), **do not open the channel.** You are not going to beat the
  median with your first campaign.

**Worked example.** A UK health & fitness app with organic D60 RPI of £2.40:
`£2.40 × 0.7 × 0.5 = £0.84 CPI ceiling`. UK Apple Ads median CPI is **$2.60 ≈ £2.05**.
**Channel closed.** The answer is not "bid lower" — it's fix monetisation or grow organic.

This is exactly what happened to Matt Corey (`case-studies.md` §3): he found a channel
**5× cheaper than Apple Search Ads** and *still* could not scale, because his CPA exceeded
his ARPU. **The binding constraint was monetisation, not media buying.** It will be ours too.

---

## 3. Gate 2 — the monetisation shape has to permit it

From RevenueCat 2026 **[DOCUMENTED]**:

| Model | D35 trial→paid | **D60 RPI** |
|---|---|---|
| **Hard paywall** | **10.7%** | **$3.09** |
| **Freemium** | 2.1% | **$0.38** |

**An 8× gap in revenue per install.** At $0.38 D60 RPI, a freemium app has a CPI ceiling of
about **£0.10**. There is no channel on earth that sells installs at £0.10 to a Western
audience.

**Rule: freemium apps do not get paid budgets. Ever.** This is not a preference, it's
arithmetic. If an app is monetised freemium and we want to buy traffic for it, the decision
to make is a *monetisation* decision, not a *marketing* one — and it belongs in
`playbooks/monetization.md`, at stage 1, not in a campaign brief.

This **validates** the monetisation playbook's existing hard-paywall lean. It also means
the playbook's freemium options ("Freemium subscription with real free tier" for prosumer
tools; "free tier is the marketing channel") are choosing a **permanently organic-only**
growth path. That's a legitimate choice — Yuka made it — but it must be made *knowingly*,
at stage 1, with the consequence stated in the spec.

---

## 4. What the first £100 / £500 / £2,000 actually buys

Assuming Gates 0, 1 and 2 all pass. **Every tier buys information first and installs
second.**

### The first £100 — buy a hook, not installs

**Channel: Reddit Ads.** £5/day × 20 days, or £7/day × 14.

**Why Reddit and not Apple:** Matt Corey's real account data (`case-studies.md` §3) —
Reddit delivered **17,000+ impressions and 59 clicks on day one for ~$10**, against Apple
Search Ads' **~75 impressions and 6 clicks**. At £100, Apple Ads produces a sample too
small to read; Reddit produces a statistically usable one within a week. Apple Ads
eCPM was **$141.43** vs Reddit's **$0.47**.

**What you are buying:** an answer to *"does our hook make a stranger click?"*

**What to run:** 3 creatives, same app, different hooks. Based on the two independent indie
datapoints in `case-studies.md` (¥180 vs ¥250 CPI, 2.1% vs 1.2% CTR for emotion over
features; "End the bill panic" over feature lists), **at least two of the three must be
problem-state hooks, not feature lists.**

**How to measure it without an MMP:** unique App Store link per creative, read through
**App Store Connect's "App Referrer" / sources report**. Free, no SDK, no SKAdNetwork.

**Success looks like:** one creative with a clearly higher CTR than the others, plus a
measurable bump in the App Store Connect sources report.
**Success does NOT look like:** a profitable CPI. You will not get one at £100 and should
not expect one.

**Secondary payoff:** Reddit traffic to the store listing feeds download velocity on your
keywords, which is a ranking input (`aso.md` §7). Even a break-even test buys organic rank.

### The first £500 — buy a real CPI on real keywords

**Channel: Apple Ads Advanced. £15/day × 30 days, UK-first.**

**Why UK-first:** UK CPI is **$2.60 vs US $4.06** — 36% cheaper — while Western European Y1
realised LTV per payer is **$25 vs North America's $32**, only 22% lower
(`landscape.md` §1). **The UK is structurally the better first market for a UK studio**,
before counting the advantage of writing copy for a market you live in.

**Structure:**
- **Exact match only.** No discovery/broad campaigns at this budget — broad match at £15/day
  is a random-number generator.
- **3–5 keyword clusters**, long-tail. Apple's own published research shows the ranker
  delivers *"particularly strong gains for tail queries where behavioral data is limited"*
  ([Apple ML Research, Feb 2026](https://machinelearning.apple.com/research/augmenting-app)) —
  a new app with no download history is precisely that case.
- **Every cluster points at a matched Custom Product Page.** Measured lift is ~8%
  (56.4% vs 52.2% CR, `aso.md` §2) — modest, free, and compounding.
- **One brand-defence campaign at £1/day max.** Brand converts at **73%** vs generic at
  **54%** and will flatter your account average while proving nothing. Cap it so it can't
  contaminate the read.

**Statistical floor:** ~**50–100 taps per cluster** before a conversion difference means
anything. At UK CPT of $1.35 that is **£50–100 per cluster** — which is why the number of
clusters is 3–5 and not 15.

**What you are buying:** a real, first-party-attributed CPI per keyword cluster, and the
answer to *"is any cluster below our CPI ceiling?"*

**Success looks like:** ≥1 cluster with 60+ taps and a CPI below the §2 ceiling.
**Most likely outcome: zero clusters clear.** That is a valid, cheap, correct answer and
it should end the programme for that app.

### The first £2,000 — buy creative assets and scale exactly one thing

Only unlock this if the £500 tier produced **at least one cluster below the CPI ceiling**
*and* **the paid cohort's D7 retention is within 30% of the organic cohort's**.

| Allocation | Spend | Purpose |
|---|---|---|
| **Scale the proven cluster** | **£900** | Apple Ads, same geo, raise budget on the *one* cluster that cleared. Do not add clusters. Do not add geos. |
| **Buy creative, not audience** | **£600** | 3–4 UGC videos, **content-only licence, no posting**. ~£150–200 each, and UGC-without-posting is **40–60% cheaper** than an in-feed post (`landscape.md` §8). Negotiate paid-usage rights up front — retro-fitting them costs a 25–100% premium. |
| **Reddit, scaled on the winning hook** | **£300** | £10/day × 30 on the creative that won at £100. |
| **Reserve** | **£200** | Unallocated. Do not pre-spend it. |

**What you are NOT buying at £2,000:**

- **Google App Campaigns.** Google's own bidding guidance implies a daily budget around
  50× target CPI ("$100/day at a $2 target CPI ≈ 50 installs/day",
  [Google Ads Help](https://support.google.com/google-ads/answer/7100895)), and Google
  explicitly warns that "Maximize conversions campaigns with small budgets may not be able
  to get any conversions." **£2,000 is under one month's viable spend.**
- **Meta Advantage+.** Needs ~50 optimisation events per ad set per week to exit learning.
  On a *purchase* objective at a 2–5% install→trial rate that implies 1,000–2,500
  installs/week — a **£4,000–10,000/week** channel to run properly. Below that you get
  noise and mistake it for signal.
- **TikTok's ad auction.** Organic and creator-first only. If we ever pay TikTok it should
  be a Spark Ad boosting a creator video that already earned organic traction.
- **An MMP.** RevenueCat + AdServices + App Store Connect covers everything below ~£5k/month
  across 2+ non-Apple networks.

---

## 5. Kill criteria — write these down before you spend, not after

Any one of these fires → **stop that channel the same day.** Not "review at the end of the
week."

| # | Trigger | Rationale |
|---|---|---|
| 1 | **Store rating drops ≥ 0.2 points in a week** | 🚨 **Highest priority.** The meditation app in `case-studies.md` §9 spent ~£260, got 500 installs at ~£0.52 CPI — and dropped from **4.5 to 3.2 stars**. The spend was recoverable; the rating was not. This damages every future install, paid *and* organic, and now damages rank too. |
| 2 | **Paid cohort D7 retention < 70% of organic cohort D7** | You're buying the wrong people. Continuing degrades your post-install ranking signals (`aso.md` §1). |
| 3 | **CPI above ceiling for 2 consecutive weeks** after one round of optimisation | Two weeks is enough. Sunk-cost reasoning starts at week three. |
| 4 | **< 50 taps on a cluster after 14 days at target spend** | Not a performance problem — an *insufficient-volume* problem. Consolidate clusters or accept the channel is too thin. Matt Corey's "black hole" was this. |
| 5 | **Refund rate on paid cohort > 1.5× organic** | Classic ad-promise/product mismatch. Also a store-relationship risk. |
| 6 | **Reviews start citing something the ad promised** | The single earliest qualitative warning. Read the 2- and 3-star reviews weekly during any campaign. |
| 7 | **30 days of spend with no movement in blended revenue** and no attributable signal | If you can't see it in attribution *and* can't see it in the top line, it isn't there. |
| 8 | **Any channel where SKAdNetwork returns Tier 0 postbacks** and you cannot measure via RPM-vs-CPM or a geo holdout | At Tier 0 you receive only Postback 1 with a source ID and **no conversion value** (`landscape.md` §7). You are optimising blind. |

**Also write down the *scale* criterion**, because it's the one people forget: increase
budget only when the **prior 30 days cleared the CPI ceiling**, and then by **no more than
50% per week**. Both Google and Meta reset learning on large changes; Apple Ads doesn't,
but your ability to read the data does.

---

## 6. Measurement frame — what we actually track

### Not LTV:CAC

RevenueCat argues LTV:CAC is the wrong metric for subscription apps because customer
lifetime "can only be [calculated] retrospectively, after a user has churned," and
subscription users pause, lapse and return
([RevenueCat](https://www.revenuecat.com/blog/growth/ltv-cac-subscription-apps-alternatives/)). **[DOCUMENTED]**

Their recommended replacements, adopted here:

1. **Realised LTV** — ARPPU snapshots at **D0 / D7 / D30 / D90 / D365**
2. **Payback period** — when cumulative cohort revenue crosses cohort CAC
3. **Gross contribution after CAC** — "how much money have we actually made by month 12?"

### And RPM vs CPM for anything creator-driven

Cal AI's frame (`case-studies.md` §1): **revenue per 1,000 views vs cost per 1,000 views**.
It requires no MMP, no conversion values, and no assumption about customer lifetime — just
revenue and views. **At bootstrapped scale, where SKAdNetwork gives us nothing, this is the
only workable measurement frame for the creator channel.**

### Payback target

Common subscription-app guidance is CAC payback under 9 months and LTV:CAC above 3
**[UNVERIFIED — no disclosed methodology in the sources I found]**. **That guidance is for
funded companies and we should not use it.**

Our constraint is a **cash cycle**, not a benchmark. Apple and Google pay out roughly
30–45 days after month end. A 9-month payback means financing nine months of growth from
savings — which is precisely how bootstrapped studios die while their dashboard looks fine.

**Factory rule: target payback ≤ 60 days. Hard ceiling 90 days.** Anything longer is a
funded company's strategy being run without the funding.

Two facts that make long paybacks worse than they look, both RevenueCat 2026
**[DOCUMENTED]**:
- **35% of annual subscribers cancel auto-renewal in month 1; ~72% cancel within year 1.**
  Do not model an annual subscription as 12 months of revenue.
- **31% of Google Play cancellations are involuntary (billing failure), vs 14% on the App
  Store.** Android paid cohorts leak revenue through payment failure, not churn — a
  recoverable loss, but only if you instrument for it.

### Assumptions we are explicitly making

Flagged so they can be tested rather than inherited:

- **The 0.7 paid-traffic haircut in §2 is an assumption, not a sourced figure.** The
  reasoning: organic users arrive with higher intent than interrupted ones, so paid cohorts
  should monetise worse. Widely believed, directionally supported by every case study here,
  **not something I found a clean dataset for. Replace it with our own measured
  organic-vs-paid RPI ratio as soon as Gate 0 makes that computable.**
- The 0.5 margin factor covers store commission plus estimation error. Conservative by
  design.

---

## 7. Delta report — playbook cross-checks

### `playbooks/analytics-taxonomy.md`

Read 2026-08-05. **Not edited.** The taxonomy is well-built — the naming convention,
activation/habit event discipline, retention-on-habit-event rule, and the "an event not in
the spec doesn't get shipped" enforcement are all correct and better than most production
taxonomies.

**But it is a product-analytics taxonomy, not a growth taxonomy.** It cannot answer "did
that campaign make money," and the gap is structural.

| # | Gap | Severity |
|---|---|---|
| 1 | **No acquisition dimension in the standard envelope.** Carries session id, app version, template version, brand id, platform. `app-session-started.source` distinguishes push/deeplink/organic — useful, but not campaign attribution. | 🔴 **Blocking.** Every campaign conclusion is unmeasurable without it. |
| 2 | **No install / first-open event.** No place to capture the AdServices attribution token (iOS) or Play Install Referrer (Android). | 🔴 **Blocking.** |
| 3 | **No day-indexed cohort revenue (RPI at D0/D7/D30/D60).** §Metrics lists ARPU, which is neither cohorted nor day-indexed. | 🔴 **Blocking** — RPI is what the CPI ceiling is computed from. |
| 4 | **No Custom Product Page dimension.** With 70 CPPs available (`aso.md` §2) and CPPs now surfacing in organic search, CPP-level conversion is unmeasurable. | 🟡 |
| 5 | **Refunds and retention not sliceable by acquisition source.** Both are kill criteria (§5). | 🟡 Follows from #1. |
| 6 | **Rating/review-count monitoring exists nowhere.** It is our **highest-priority kill trigger** and there is no owner, threshold, or alert. | 🔴 Not analytics-taxonomy's natural home, but it has no home at all today. |
| 7 | **Retention defined on the habit event, "not on app-open — opens lie."** | ✅ **Exactly right.** This is the single thing Quibi got wrong (`case-studies.md` §6). |
| 8 | **Activation event mandated in every spec.** | ✅ Correct, and it is the only real defence against IRL-style worthless-install traffic (`case-studies.md` §8). |
| 9 | **Crash-free sessions + `error-displayed` already tracked.** | ✅ And now doubles as an **ASO** metric — Android Vitals affect Play visibility (`aso.md` §3). Worth noting in the playbook so nobody prunes it. |

**Minimal patch:** add an immutable `acquisition` envelope block (source, campaign-id,
ad-group-id, keyword-id, cpp-id, country, attribution-method), an `app-install-attributed`
event, and **RPI-by-cohort-day** to the §Metrics list. That closes 1–5.

### `playbooks/monetization.md`

Read 2026-08-05. **Not edited.** Strong playbook — the usage-frequency→model matrix is
genuinely good judgment, and the hard rule that "the spec must state why the model fits the
usage frequency" is the right kind of rule.

**Validated by 2026 data:**

| Playbook position | 2026 evidence |
|---|---|
| Hard paywall lean, "generous free tier ... otherwise hard paywall" | ✅ **Strongly validated.** Hard paywall D35 conversion **10.7% vs freemium 2.1%**; D60 RPI **$3.09 vs $0.38** (RevenueCat 2026). |
| "Weekly + annual polarizes better; no monthly tier unless data demands it" | ✅ Consistent with Adapty 2026, which finds **weekly + trial the highest-LTV paywall configuration** ([Adapty](https://adapty.io/state-of-in-app-subscriptions/)). |
| Every paywall variant is a tracked experiment | ✅ Correct, and Cal AI's reported **~10% conversion lift from paywall animation A/B tests** shows the headroom is real. |
| No fake urgency / fake discounts / countdown timers | ✅ Correct on both ethics and store-review risk. |

**Gaps and tensions:**

| # | Issue | Detail |
|---|---|---|
| 1 | **Model choice silently decides whether paid acquisition is ever possible** | At $0.38 D60 RPI, a freemium app has a CPI ceiling near **£0.10** — no channel exists. Choosing freemium is choosing **permanently organic-only growth**. Legitimate, but it should be stated in the spec at stage 1, not discovered at stage 11. |
| 2 | **"Weekly price ≈ impulse threshold" + "free trial only when the aha moment needs >1 session"** | 🔴 **Direct tension with the data.** Adapty 2026: **weekly plans with trials generate 636% more 12-month LTV than weekly without** ($54.50 vs $7.40); weekly+trial is the top configuration at **$49.27**. The playbook's rule would default most weekly plans to *no trial* — the worse configuration by a wide margin. **Worth re-testing.** |
| 3 | **Trial duration unspecified** | RevenueCat 2026: **17–32 day trials convert at 42.5% vs 25.5% for <4 days** — ~70% better. The playbook says when to use a trial but never how long. |
| 4 | **Day-0 cancellation not addressed** | **55.4% of 3-day-trial cancellations happen on day 0**; **84% within day 0–1**. The aha moment must land in the **first session** or the trial is already lost. This is a *product* requirement that belongs next to the paywall rules. |
| 5 | **Android billing failure not covered** | **31% of Google Play cancellations are involuntary** vs **14% on the App Store**. The playbook has "Offline grace: last-known entitlement honored" — that's an *entitlement* concern, not *billing recovery*. Grace periods, account hold, and retry configuration are a separate, recoverable ~17-point revenue difference. |
| 6 | **Annual-subscription churn assumption** | **35% cancel auto-renew in month 1; ~72% within year 1.** Anyone computing LTV as `annual price × N years` is wrong by a large factor. Belongs beside the pricing defaults. |
| 7 | **LTV:CAC not the right frame** | RevenueCat now argues against it explicitly for subscription apps; §6 above adopts realised-LTV snapshots + payback + gross contribution instead. The monetisation playbook's §Revenue review should track **payback period**, which it currently doesn't mention. |
| 8 | **AI-feature apps** | RevenueCat 2026: AI apps carry a **41% Y1 realised-LTV premium** ($30.16 vs $21.37) but **~36% worse 12-month payer retention**. Higher early revenue, faster decay — which shortens payback and *raises* the CPI ceiling short-term while making long paybacks more dangerous. Relevant if any portfolio app is AI-led. |

---

## 8. The decision, in one page

```
                    ┌─────────────────────────────────┐
                    │  Is Gate 0 (instrumentation)    │
                    │  complete?                      │
                    └───────────┬─────────────────────┘
                       NO ──────┤────── YES
                        │       │
                 SPEND £0.      ▼
                 Build the   ┌─────────────────────────────────┐
                 acquisition │  All 6 organic gates pass?      │
                 dimension.  │  (rating ≥4.0 · D1 ≥30% ·       │
                             │   D30 ≥8% flattening · 300      │
                             │   organic installs / 60 days ·  │
                             │   ASO complete · 1 organic      │
                             │   channel working)              │
                             └───────────┬─────────────────────┘
                                NO ──────┤────── YES
                                 │       │
                          SPEND £0.      ▼
                          Fix the app. ┌─────────────────────────────────┐
                          It is not a  │  Organic D60 RPI ≥ £1.00        │
                          marketing    │  AND CPI ceiling > category     │
                          problem.     │  median CPI in target geo?      │
                                       └───────────┬─────────────────────┘
                                          NO ──────┤────── YES
                                           │       │
                                    SPEND £0.      ▼
                                    Fix monetisation   £100 → Reddit hook test
                                    or grow organic.   £500 → Apple Ads UK, exact
                                    (This is the               match, CPP-matched
                                     most likely       £2,000 → scale ONE cluster
                                     outcome.)                  + buy UGC files
```

**And the sentence to remember, from `case-studies.md`:** every failure in this research
was a retention or expectation-match failure wearing a marketing costume. Not one was
caused by bad media buying. Quibi's media buying was excellent.
