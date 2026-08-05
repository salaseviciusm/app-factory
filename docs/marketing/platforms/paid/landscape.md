# Paid acquisition landscape — what a bootstrapped studio can actually buy (2026)

Research date: **2026-08-05**. Assumption: App Factory is bootstrapped, paid budget is
near zero, and the purpose of this document is to price the options so we know what the
first pounds buy — not to justify spending them. See `triggers.md` for the decision rules.

Claim tags follow the marketing README: **[DOCUMENTED]** = primary source or large-sample
industry dataset · **[ANECDOTAL]** = single operator's reported experience ·
**[UNVERIFIED]** = repeated in secondary/SEO sources, no primary confirmation found.

---

## 0. The number that frames everything

RevenueCat's *State of Subscription Apps 2026* (published 2026-03-19; 115,000+ apps,
$16B+ revenue) puts **median revenue per install at day 60 at $0.55 in North America and
$0.11 in India/SEA** — and that is the *median across apps that already monetise*
([RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/),
[regional breakdown](https://www.revenuecat.com/state-of-subscription-apps)). **[DOCUMENTED]**

Median Apple Ads CPI in the US is **$4.06**
([AppTweak](https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks)). **[DOCUMENTED]**

So the median subscription app buying US installs is roughly **7× underwater at day 60**.
Paid acquisition is not a growth channel you switch on; it is a channel that opens only
after your app is a long way above median on monetisation. Everything below is priced
against that fact.

The split matters: RevenueCat's data shows **hard-paywall apps at $3.09 RPI by D60 vs
$0.38 for freemium** — an 8× gap. **[DOCUMENTED]** A hard-paywall app in a high-intent
category is the only shape of app in our portfolio that will plausibly clear a US CPI.

---

## 1. Apple Ads (formerly Apple Search Ads)

**The only channel a bootstrapped studio should touch first.** High intent, no creative
production cost, first-party attribution that bypasses SKAdNetwork entirely, and a
genuine £1/day floor.

### Minimum viable budget

Apple publishes two products
([Apple Ads help — Compare solutions](https://ads.apple.com/app-store/help/apple-ads-basic/0001-compare-apple-ads-solutions)) **[DOCUMENTED]**:

| | **Basic** | **Advanced** |
|---|---|---|
| Budget cap | Up to **$10,000/app/month** | Unlimited |
| Pricing | **Cost-per-install** (you pay only for installs) | **Cost-per-tap**, second-price auction |
| Targeting | Automated; no keyword control | Full keyword + audience control |
| Placements | Search results only | Today tab, Search tab, search results, other apps' product pages |
| Apps | Up to 50 | Unlimited |
| API | AdServices Attribution API only | + Campaign Management API |

Apple states **no minimum spend** for either product. Secondary sources report a $1/day
minimum daily budget and a $100 new-account credit **[UNVERIFIED]** — Apple's own compare
page does not state either
([Sparrow Apps](https://sparrowapps.io/articles/apple-search-ads-guide/) claims both).

> Note: I found no evidence that Apple Ads Basic has been retired, contrary to a common
> claim. Apple's live help page still documents it as of 2026-08-05. What *has* been
> retired is iAd, Creative Sets, and lifetime campaign budgets.

**Practical floor for us: £5–10/day on Advanced, brand + 10–20 exact-match long-tail
keywords.** Basic's CPI pricing is superficially safer but gives you zero keyword data,
which is the entire point of running this at our scale.

### Benchmarks — Apple Ads, search results placement

Source for all figures in this section: [AppTweak Apple Ads Benchmarks](https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks),
methodology stated as ~3,500 apps / 50,000 campaigns / $1B ad spend. **[DOCUMENTED]**

**Global medians:** CPT **$0.92** · CPI **$1.80** · TTR **7.4%** · CR **56%**

**CPI by country** (search results, median):

| Country | CPI | Country | CPI |
|---|---|---|---|
| 🇺🇸 US | **$4.06** | 🇪🇸 Spain | $1.43 |
| 🇬🇧 UK | **$2.60** | 🇮🇪 Ireland | $1.42 |
| 🇯🇵 Japan | $2.57 | 🇸🇬 Singapore | $1.35 |
| 🇨🇦 Canada | $2.24 | 🇮🇹 Italy | $1.32 |
| 🇦🇺 Australia | $2.19 | 🇵🇱 Poland | $1.12 |
| 🇩🇪 Germany | $2.14 | 🇧🇷 Brazil | $1.05 |
| 🇰🇷 S. Korea | $1.84 | 🇮🇳 India | $0.89 |
| 🇫🇷 France | $1.78 | 🇵🇭 Philippines | $0.73 |

**CPI by category (US, search results):** Education $1.64 · Music $2.11 · Business $2.49 ·
Utilities $2.90 · Photo & Video $3.13 · Productivity $3.13 · Lifestyle $3.45 ·
Graphics & Design $3.68 · Health & Fitness $3.83 · Social Networking $3.90 ·
Shopping $6.20 · Finance $8.44 · Games $12.28 · Sports $26.81

**CPT by country:** US $1.91 · UK $1.35 · Canada $1.17 · Australia $1.15 ·
Japan $1.11 · Germany $1.11 · France $0.92

**CPM (search results):** US $125.16 · UK $105.05 · Germany $99.57 · Canada $94.99.
Note this is ~10–20× a social CPM — you're paying for intent, not reach.

**Conversion rate by placement:** Search results **56%** · Search tab **15%** ·
Product pages **15%** · Today tab **7.7%**.
**TTR by placement:** Search results **7.4%** · Product pages **2.0%** ·
Today tab **0.32%** · Search tab **0.29%**.

**Conversion rate by campaign type (US):** Brand **73%** · Generic **54%** ·
Competitor **50%**. This is why brand-defence campaigns look amazing and prove nothing —
you are buying users who already searched for you.

**Custom Product Page effect (US generic):** CR **56.4% with a CPP vs 52.2% without**.
**[DOCUMENTED]** — a real but modest ~8% relative lift, not the 156% figure floating
around secondary sources (see `aso.md` §CPP).

### The UK/low-cost-geo arbitrage

UK CPI ($2.60) is 36% below US ($4.06), while RevenueCat puts Western European Y1
realised LTV per payer at $25 vs North America $32 — only 22% lower. **[DOCUMENTED]**
For a UK-based studio, **the UK and Western Europe are structurally better first paid
geos than the US**, before you even count the founder's advantage in writing copy for a
market they live in. Tier-3 geos (India $0.89 CPI) are a trap for subscription apps:
RevenueCat has IN/SEA D60 RPI at **$0.11** and Y1 RLTV per payer at **$14**. Cheap
installs, cheaper users.

### Learning phase & speed to a read

Apple Ads Advanced has **no formal learning phase** — it's a keyword auction, not an
ML-optimised objective. This is its single biggest advantage at our budget level. You can
get a directional read on a keyword in **days, not weeks**, and the read is honest
(first-party AdServices attribution, no SKAN aggregation).

Practical statistical floor: at a 56% search-results CR you need ~**50–100 taps per
keyword cluster** before a conversion-rate difference means anything. At a UK CPT of
$1.35 that's roughly **£50–100 per keyword cluster tested**.

### Attribution reality

Apple Ads is the **only channel where attribution just works**. It uses the AdServices
Attribution API, which is first-party, deterministic, install-level, and outside ATT and
SKAdNetwork. Kochava's mid-2026 survey found **Apple Ads accounts for 36% of iOS
attribution volume** — against 11% for SKAN and ~10% device-level consented
([Kochava, 2026](https://www.kochava.com/blog/your-ios-attribution-strategy-2026-reality-check/)).
**[DOCUMENTED]**

### Verdict for App Factory

**Channel #1, and for a long time the only one.** £5–10/day, UK-first, Advanced,
exact-match long-tail, paired with a Custom Product Page per keyword theme.

---

## 2. Google App Campaigns (formerly UAC)

Covers Play Store search, Google Search, YouTube, Discover, Gmail and the Display Network
in one automated campaign. You give it assets and a target; it decides everything else.

### Minimum viable budget

Google's own bidding documentation frames the budget/target relationship by example:
"if you set your average daily budget for $100, and your target cost-per-install is $2,
you're aiming for about 50 installs per day"
([Google Ads Help](https://support.google.com/google-ads/answer/7100895)). **[DOCUMENTED]**

The widely-repeated "**set daily budget ≥ 50× target CPI**" rule is the industry's
generalisation of that example, not an explicit Google mandate — treat it as
**[UNVERIFIED]** as a hard rule but **[DOCUMENTED]** as the shape of Google's own guidance.

Google *does* explicitly warn: "Maximize conversions campaigns with small budgets may not
be able to get any conversions." **[DOCUMENTED]**

**What this means for us:** at a realistic $2 tCPI, the implied daily budget is **~$100/day
(~£2,300/month)**. That is not a bootstrapped number. Google App Campaigns is
structurally hostile to small budgets because the ML needs conversion volume it cannot get
from £10/day. **Do not open this channel below ~£1,500/month committed for 4+ weeks.**

### Learning phase

Practitioner consensus is 2–4 weeks to exit learning, with bid changes >20% in 24 hours
resetting it ([Adapty playbook](https://adapty.io/blog/google-app-campaigns-playbook-2025/),
[Admiral Media](https://admiral.media/google-app-campaigns-best-practices/)). **[UNVERIFIED]**
— neither figure appears in Google's own docs that I could retrieve.

### Speed to a read

**Slowest of all channels for a small budget.** Learning phase + Google's own warning
about small budgets + Play Store install-quality lag means realistically **6–8 weeks and
£3,000+ before you know anything.** Which is exactly the money we don't have.

### Attribution reality

Android is the easy case: Google Play Install Referrer is deterministic and intact. iOS
App Campaigns run through SKAdNetwork with all its limitations (§7).

### Verdict for App Factory

**Deferred indefinitely.** Only reconsider when a single app is doing >£10k/month and we
have Android traction worth scaling. The minimum viable spend is 10–20× our first paid
budget.

---

## 3. Meta (Advantage+ app campaigns)

Facebook + Instagram + Reels + Audience Network. The channel with the best creative
leverage and the worst small-budget economics.

### Minimum viable budget

Meta's published guidance is that an ad set needs **~50 optimisation events per week** to
exit the learning phase — cited consistently across practitioner sources
([adlibrary](https://adlibrary.com/posts/meta-ads-learning-phase-50-events-guide),
[Modern Marketing Institute](https://www.modernmarketinginstitute.com/blog/how-to-exit-the-meta-ads-learning-phase-fast-and-start-scaling-profitably-in-2026)).
**[DOCUMENTED]** as Meta's stated guidance; I did not retrieve Meta's own help page directly.

Do the arithmetic: 50 installs/week at a £2–4 CPI = **£100–200/week per ad set minimum,
just to exit learning on the *install* event**. If you optimise for a downstream event
(trial start, purchase) — which is the only version worth doing — you need 50 of *those*
per week. At a 2–5% install→trial rate that implies 1,000–2,500 installs/week.
**That is a £4,000–10,000/week channel to run properly on a purchase objective.**

### Benchmarks

Practitioner sources report Advantage+ App Ads delivering 20–35% lower CPI than manual
structures when fed 50+ installs/day, and Meta app CPIs running 20–40% above Google
equivalents ([vmobify](https://vmobify.com/blog/meta-app-install-campaigns)). **[UNVERIFIED]**
— single secondary source, no methodology disclosed. Do not plan against these.

The one operationally useful claim: **creative quality drives CPM more than targeting
does** — strong creatives holding CPMs near $25 vs $50+ for weak ones, with a stated
operational minimum of **6–8 new creative variants per month per campaign**. **[UNVERIFIED]**
but consistent with everything else in the industry.

### Learning phase & speed to a read

Two weeks minimum, and only if you're feeding it. Below the event threshold campaigns sit
in permanent learning and the delivery is effectively random — you will get noise and
mistake it for signal.

### Attribution reality

**This is where the ATT damage lands.** On iOS, Meta reports through SKAdNetwork with
aggregated, delayed, and threshold-suppressed data (§7). At our volumes we will land in
**crowd-anonymity Tier 0**, which returns only Postback 1 containing the source ID and
*no conversion value at all*. Meaning: on iOS, at bootstrapped budgets, **Meta cannot tell
you which ad drove a subscription.** You are optimising blind.

### Verdict for App Factory

**Not a first channel.** The creative pipeline the factory is building (founder demo
recordings → AI-assembled video) is genuinely a fit for Meta *eventually*, but the
learning-phase floor and the iOS attribution blackout make it a £5k/month-minimum channel.
Revisit only for a proven Android-heavy or high-ARPU app.

---

## 4. TikTok Ads

### Minimum viable budget

Secondary sources consistently report **$50 minimum campaign budget and $20 minimum ad
group daily budget** ([AdManage](https://admanage.ai/blog/tiktok-ads-cost),
[Stackmatix](https://www.stackmatix.com/blog/tiktok-ads-cost-2026-pricing-breakdown)).
**[UNVERIFIED]** — TikTok's own help-centre article on campaign/ad-group budgets returned
a 404 when I fetched it on 2026-08-05, so I could not confirm against primary source.

The same sources put the *practical* floor far higher: campaigns under $50/day exiting
learning only ~14% of the time in two weeks, with $100–250/day per active ad set as the
pragmatic minimum for conversion objectives. **[UNVERIFIED]** but directionally consistent
with Meta's mechanics.

### Benchmarks

Reported ranges: CPM **$4–13**, CPC **$0.30–1.50**, app-install CPI **$1.50–5.00**
depending on category and region ([AdManage](https://admanage.ai/blog/tiktok-ads-cost)).
Business of Apps lists TikTok CPI at **$1.75–$4.00**. **[UNVERIFIED]** — wide ranges,
undisclosed methodology, treat as order-of-magnitude only.

### The real TikTok opportunity is not the ad platform

Every documented bootstrapped success in `case-studies.md` that used TikTok used it as an
**organic + paid-creator** channel first, and only moved to TikTok's ad auction after
creator content had proven which hooks convert. Cal AI ran 250 creators on retainer before
scaling to $1M/month in ads (see `case-studies.md` §1). The ad platform is an
amplifier for creative you already validated — it is a poor discovery mechanism.

### Attribution reality

Same SKAN blackout as Meta on iOS. TikTok's self-attributing-network reporting will
over-claim; expect meaningful discrepancy vs RevenueCat truth.

### Verdict for App Factory

**Organic-first, always.** If we ever pay TikTok, it should be Spark Ads boosting a
creator video that already earned organic traction — never a cold ad.

---

## 5. Reddit Ads

The most interesting channel for us, and the one with the best evidence at indie scale.

### Minimum viable budget

Reported **$5/day minimum** ([Scribe](https://scribehow.com/page/Reddit_Ads_Pricing_2026_CPC_CPM_Real_Numbers_Hidden_Fees_and_Budget_Guide__zhq1jgsGSR-bK-GC1nVrDg)).
**[UNVERIFIED]** — not confirmed against Reddit's own docs.

### Benchmarks — and one very good real datapoint

Secondary benchmark ranges: CPC **$0.50–4.00** (median $1.25–1.85), CPM **$3–15**
(median ~$6.50). **[UNVERIFIED]**

Far more useful, an indie iOS developer published a direct head-to-head after moving
**$10/day** from Apple Search Ads to Reddit in May 2025
([Matt Corey, *Rethinking my Indie App Advertising*](https://mattcorey.substack.com/p/rethinking-my-indie-app-advertising)).
**[ANECDOTAL]** but real money, real account:

| Metric | Apple Search Ads | Reddit | Delta |
|---|---|---|---|
| eCPM | $141.43 | **$0.47** | ~300× cheaper |
| CPC | $1.59 | **$0.70** | 2.3× cheaper |
| CPA | $4.36 | **$0.82** | 5.3× cheaper |
| Day-1 impressions | ~75/day | **17,000+** | — |
| Day-1 clicks | 6/day | **59** | — |
| Day-1 installs | 4 | 4 | tie |

Two things to hold simultaneously: Reddit was **5× cheaper per install**, and Reddit's
$0.82 CPA **still exceeded his ARPU** — he could not scale it. Also notable: he ran Google
Ads for six months and got *zero clicks*.

The creative that worked was a simple screen-recording video with plain benefit copy:
"End the bill panic. Know what's due, what's safe to spend, and what's next." Exactly the
asset the factory's content pipeline already produces.

### Bonus mechanic

He reported measurable improvement in **organic App Store keyword rankings** from the
Reddit traffic, and could attribute it through App Store Connect's **"App Referrer"**
grouping — **no SKAN integration required**. **[ANECDOTAL]** This is a real structural
advantage: Reddit → App Store web link → App Store Connect sources report is a clean,
free measurement path.

### Verdict for App Factory

**Channel #2, and the highest-upside experiment we can run for £100.** Cheap enough that
£5–10/day buys statistically meaningful click volume within days, measurable without an
MMP, and it feeds the organic-rank flywheel. It is also the channel most likely to fail on
**relevance** rather than cost — Reddit users punish ads that don't belong in the subreddit.

---

## 6. YouTube

Not a standalone buy for app installs. YouTube inventory is bought **through Google App
Campaigns** (§2), which inherits that channel's budget floor.

The bootstrapped-relevant YouTube play is **direct sponsorship of small channels** —
covered in §8. A 30–60s integration in a 20k-view niche video is a fixed-price buy with no
learning phase, no attribution framework, and no minimum.

**Verdict: no paid YouTube auction spend. Sponsorship only, and only via §8 rules.**

---

## 7. Attribution reality post-ATT — what you can and cannot measure

This section is the reason most of the above is unaffordable, so it gets its own header.

### ATT

Kochava's mid-2026 survey ([source](https://www.kochava.com/blog/your-ios-attribution-strategy-2026-reality-check/))
**[DOCUMENTED]**:

- **69.7% of iOS users accept the ATT prompt when shown one** (up from 37% at launch;
  crossed 50% in Sept 2024) — the prompt is far less lethal than its reputation
- but **only 2% of iOS installs are ever prompted**; 24% of marketers never implement a
  prompt, 36% use only Apple's default system prompt
- **~10% of iOS attributions are device-level and consented**
- **21% of iOS marketers report confidence in their attribution strategy** — while 47%
  increased budgets anyway

The actionable insight: **the ATT prompt is worth showing.** A ~70% opt-in rate means
device-level attribution is recoverable for most of your users if you ask well
(post-value, in-context, with a priming screen).

### SKAdNetwork 4.0

Mechanics ([Adjust](https://help.adjust.com/en/article/how-skadnetwork-4-works),
[AppsFlyer](https://www.appsflyer.com/blog/trends-insights/skadnetwork-4-strategy/),
[Singular](https://support.singular.net/hc/en-us/articles/13864916074779-SKAN-4-0-FAQ)) **[DOCUMENTED]**:

- Three postback windows: **0–2 days, 3–7 days, 8–35 days** post-install
- First postback fires on a **random 24–48h timer** after the window closes
- **Crowd anonymity tiers 0–3.** Apple drops fields as your volume falls: fine-grained
  conversion value → coarse (low/medium/high only) → source app ID → source ID
- **At Tier 0 you receive only Postback 1, containing the source ID and nothing else**

**Translation for a bootstrapped studio: at £10–500/day you will be in Tier 0 or 1 on
every non-Apple channel. SKAdNetwork will tell you an install happened and roughly where
it came from, and nothing about whether that user paid you.** Kochava found **67% of
marketers experience reporting gaps or anomalies from privacy thresholds** — that's the
majority *with real budgets*. We are far below them.

Adoption is also worse than assumed: **33% of marketers have not implemented SKAN at all;
only 11% describe themselves as fully implemented and actively optimising.**

### AdAttributionKit

Apple's successor framework, introduced at WWDC 2024 and expanded at WWDC 2025 (shipping
in iOS 18.4). It adds re-engagement measurement with overlapping windows, configurable
attribution windows, **country codes natively in postbacks** (freeing conversion-value
bits), and support for alternative marketplaces
([Aarki](https://www.aarki.com/insights/aak-vs-skan-explained-top-faqs-about-apples-ios-attribution-framework/),
[Dentsu](https://www.dentsu.com/uk/en/blog/the-evolution-of-skadnetwork-and-the-rise-of-app-adttributionkit)). **[DOCUMENTED]**

**Apple has announced no SKAdNetwork deprecation date.** Both coexist. Adoption is
negligible: **27% of surveyed marketers had not heard of AAK; 7% have active testing
plans** (Kochava, mid-2026). **[DOCUMENTED]** WWDC 2026 passed without meaningful AAK or
ATT updates.

**Do not build anything for AdAttributionKit.** It is a 2028 problem.

### What actually works for us

Ranked by usefulness at our scale:

1. **Apple Ads → AdServices API.** First-party, deterministic, install-level. Works.
2. **App Store Connect "App Referrer" / sources report.** Free, no SDK, tells you which
   external domain drove the impression. This is how Matt Corey measured Reddit.
3. **Google Play Install Referrer.** Deterministic on Android. Works.
4. **ATT prompt + device-level attribution.** ~70% opt-in if you ask properly.
5. **Holdout / geo-split tests.** Turn spend on in one country, off in a matched one,
   read total revenue. Crude, slow, and the only method immune to attribution decay.
6. **SKAdNetwork.** At our volume: install counts only.
7. **MMM (marketing mix modelling).** Requires spend history we won't have for years.

**We do not need an MMP (AppsFlyer/Adjust/Branch) until we're spending £5k+/month across
2+ non-Apple networks.** RevenueCat + Apple Ads + App Store Connect covers everything
below that, at zero incremental cost.

---

## 8. Influencer / UGC creator buys and micro-sponsorships

The channel where bootstrapped studios have actually won (see `case-studies.md`), and the
only one with **no learning phase, no minimum, and no attribution framework at all**.

### Pricing (2026)

| Buy type | Rate | Source |
|---|---|---|
| UGC content, no posting (you get the file) | **~$190 average** | [Collabstr calculator](https://collabstr.com/influencer-price-calculator/user-generated-content) **[UNVERIFIED]** |
| UGC, beginner creator, 30–60s vertical | $150–400 | [UGC Roster](https://www.ugcroster.com/blog/ugc-rates-pricing-tiktok-instagram-youtube-shorts) **[UNVERIFIED]** |
| UGC, experienced creator | $800–2,500 | ibid. |
| TikTok in-feed post, micro (10k–100k followers) | **$200–1,250** | [Stan](https://stan.store/blog/influencer-rates/) **[UNVERIFIED]** |
| Micro-influencer, all platforms | $200–2,500 | ibid. |
| Podcast host-read, 60s | **$24–26 CPM** (Libsyn marketplace data) | [Operation Podcast](https://www.operationpodcast.com/blog/podcast-sponsorship-pricing-2026) **[UNVERIFIED]** |
| Podcast host-read, 30s | $18–22 CPM | ibid. |
| Podcast pre-roll | $15–25 CPM · post-roll $5–10 CPM | [ADOPTER Media](https://adopter.media/podcast-advertising-rates-explained/) **[UNVERIFIED]** |

Two structural rules worth internalising:

- **UGC-without-posting is 40–60% cheaper than an in-feed post.** If what you want is
  *creative to run as an ad*, buy the file, not the audience.
- **Whitelisting/Spark-Ad usage rights add a 25–100% premium.** Negotiate them up front;
  retro-fitting rights costs more than buying them.

### Minimum viable budget

**£150–200 buys one creator video.** This is the only channel where the first £200 buys
a complete, reusable asset rather than a rounding error in an auction.

### Speed to a read

**Fast on creative signal, slow and fuzzy on install signal.** A creator post tells you
within 48 hours whether a hook lands (views, comments, saves). It tells you almost nothing
attributable about installs unless you use a unique App Store link and read App Store
Connect's sources report — which you should always do.

### The scaled version (what Cal AI did)

Cal AI ran **250+ creators on monthly retainer**, tracking two numbers: **RPM (revenue per
1,000 views) vs CPM (cost per 1,000 views)** — "ideally you build a product with a high
RPM and a low CPM"
([Forbes, 2024-10-07](https://www.forbes.com/sites/josipamajic/2024/10/07/hacking-the-app-store-gen-zs-15m-arr-bootstrapped-success-story/)). **[DOCUMENTED]**

**This RPM-vs-CPM frame is the single most useful thing in this document for a
bootstrapped studio.** It sidesteps attribution entirely: you don't need to know *which*
install came from *which* video, only whether total revenue per 1,000 creator-delivered
views exceeds the cost per 1,000 views. It's measurable with a spreadsheet and RevenueCat.

### Verdict for App Factory

**Channel #3, and the one with the highest ceiling.** But — critically — the factory's
existing pipeline (founder demo recordings → AI-assembled content) means we can *produce*
UGC-shaped creative at near-zero marginal cost. **Test our own creative organically before
paying anyone else to make it.** Buy creators for their *audience*, not their *editing*.

---

## 9. Channel summary — the honest ranking for a bootstrapped studio

| Rank | Channel | Min viable | Time to a read | Attribution | Open to us? |
|---|---|---|---|---|---|
| 1 | **Apple Ads Advanced** | £5–10/day | **Days** | ✅ First-party, deterministic | **Yes, now** |
| 2 | **Reddit Ads** | £5–10/day | **Days** | ⚠️ App Referrer only | **Yes, now** |
| 3 | **Creator/UGC buys** | £150–200/video | 48h creative, weeks revenue | ⚠️ RPM-vs-CPM only | **Yes, selectively** |
| 4 | **Micro-sponsorship (podcast/newsletter)** | £200–500/slot | Weeks | ❌ Promo code / referrer | Maybe |
| 5 | **TikTok Ads** | ~£100–250/day realistic | 2–4 weeks | ❌ SKAN Tier 0 | No |
| 6 | **Meta Advantage+** | ~£100–200/day/ad set | 2–4 weeks | ❌ SKAN Tier 0 | No |
| 7 | **Google App Campaigns** | ~£1,500–2,300/month | **6–8 weeks** | ⚠️ Good on Android | No |
| 8 | **YouTube auction** | via GAC | via GAC | via GAC | No |

The pattern: **channels priced per-auction-event with no ML learning phase are open to us;
channels that require feeding a machine-learning optimiser are not.** That's not a
budget preference, it's a structural property of the products.

---

## 10. What I could not verify

Flagging honestly, per the research rules:

- **TikTok's official minimum budgets.** TikTok's own help article 404'd on 2026-08-05.
  All figures are secondary.
- **Reddit's official minimum daily budget.** Secondary sources only.
- **Meta's own learning-phase documentation.** The 50-events-per-week figure is
  universally cited but I did not retrieve Meta's primary page.
- **Apple Ads $1/day minimum and $100 starter credit.** Not on Apple's compare page.
- **Most 2026 CPI/CPM "benchmark" pages.** The top search results for every channel are
  SEO content farms (`cufinder.io`, `semnexus.com`, `thesocialoutline.com`,
  `benly.ai`, `stackmatix.com`, `admanage.ai`, `gamegrowthadvisor.com`) publishing
  precise-looking numbers with no stated methodology or sample size. **I have deliberately
  excluded their figures from the ranking tables above and marked them [UNVERIFIED]
  wherever quoted.** Anyone extending this research should apply the same filter — the
  only channel benchmark I found with a disclosed sample is AppTweak's Apple Ads dataset.
- **Whether AppTweak's "2026" page reflects 2026 or 2025 data.** The page is titled
  2026 and carries a July 2025 publication signal. Numbers are stable enough to plan
  against, but treat as "most recent 12 months" rather than "2026 YTD".
