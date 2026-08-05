# The feedback loop — how content gets tested and the pipeline improves itself

**The problem this solves:** an agent pipeline can produce fifteen format-correct videos a
week forever without ever getting better, because agents are excellent at format and have
nothing to say. Without a measurement loop, more throughput just means more slop, faster.

**The single diagnostic that matters most**, taken directly from
`../platforms/tiktok/credibility.md` §6:

> **Track installs per 1,000 views per content format, not views.** A video with 12,000
> views and 80 installs beats one with 400,000 views and 10 — and the second is a *worse*
> outcome than the first, because it burned our shot at the audience on a message that
> doesn't convert.

Everything below is in service of computing that number honestly and feeding it back into
[1] Idea generation.

---

## 1. What we can actually measure (and what we cannot)

Be honest about this up front, because half the "analytics" advice in this space assumes
data the platforms do not give us.

| Platform | Available via API | **Not available at any price** |
|---|---|---|
| **TikTok** | `view_count`, `like_count`, `comment_count`, `share_count`, sometimes `collect_count` (saves) via `POST /v2/video/list/`, scopes `user.info.stats` + `video.list` | **Watch time, FYP impressions, per-video reach, audience demographics.** Values are point-in-time snapshots — poll and store history yourself `[ANECDOTAL]` ([KeyAPI](https://www.keyapi.ai/blog/how-to-fetch-tiktok-user-data-video-metrics-api/)) |
| **Instagram** | `GET /{ig-media-id}/insights` → likes, reach, comments, plays, saves, shares — **only for accounts over 1,000 followers** `[ANECDOTAL]` | `profile_views`, `website_clicks`, non-Reels `video_views` — deprecated from Graph API v21 (8 Jan 2025). Trial Reels results are readable in-app but graduation is manual |
| **YouTube** | YouTube Analytics API — the richest of the three: watch time, AVD, impressions, CTR, audience-overlap report | Test & Compare results (Studio UI only) |
| **X** | Post-level metrics via API reads at $0.005/post read | — |
| **App Store** | **Analytics Reports API**: impressions, product page views, downloads, usage, sales and subscriptions **per campaign token**, plus cohort analysis by download date *and source* (shipped 25 Mar 2026) `[DOCUMENTED]` ([Apple](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api)) | Per-campaign data is **detailed-report export only**, not in the dashboard |

**Two consequences the design has to absorb:**

1. **Below 1,000 Instagram followers we get no media insights at all.** For the first
   months, the only trustworthy per-video numbers on IG are the view count and whatever
   Apple attributes. Do not build dashboards that will be empty for eight weeks.
2. **TikTok gives us no watch time.** The platform's own most important ranking input is
   invisible to us. We approximate hook quality with `shares / views` and `comments /
   views`, and we get the real signal from YouTube Shorts' *"Viewed (vs swiped away)"*,
   which is the only true hook-quality metric either platform exposes.

---

## 2. Attribution: closing the loop from view to install, for £0

**No MMP.** SKAdNetwork gives a bootstrapped organic studio essentially nothing, AppsFlyer
and Branch are priced for funded companies, and RevenueCat gates attribution-partner
integrations behind a higher tier. The free path is Apple's own.

**The mechanism:**

```
one video  →  one campaign token  →  one short link  →  App Store product page
                     │
                     └──► App Store Connect Analytics Reports API (weekly export)
                          → impressions · product page views · downloads · D-cohort revenue
```

Apple's campaigns feature *"leverages URL-based campaign parameters, with each link mapping
traffic back to a specific campaign so you can measure the performance of ads, social
promotions, email, and more, in a privacy-friendly way"* `[DOCUMENTED]`.

**One token per video, not per platform.** That is the whole trick. It means the same demo
posted to TikTok and Reels gets two tokens and we can see which platform converts, and it
means "format" and "hook" become dimensions we can group by afterwards, because the
pipeline already recorded which format and hook each video used.

**The link path per platform:**

| Platform | Path to the store | Leakage |
|---|---|---|
| TikTok (organic) | **No clickable link exists in-video.** Pinned comment with the exact App Store search string; bio link after 1,000 followers | Highest — this is why the comment section *is* the funnel |
| Instagram | Bio link (up to 5) or Story link sticker. **Feed and Reels captions are never clickable** | 3-hop funnel: watch → profile → bio → store. Every hop leaks |
| YouTube | **Description link and pinned comment are both clickable** | Lowest of the three. Use both, every upload |
| X | Link in a reply, not the post (the API charges $0.20 for a post containing a URL, and links historically suppress reach) | Low |

**The number to plan against:** `../platforms/instagram/algorithm.md` §9 documents the one
indie case with published end-to-end numbers — 182 App Store product-page impressions →
11 downloads (**9% store conversion**) from ~2,000 short-video views, i.e. roughly
**0.5% view→install**. Plan volume against 0.5%, not a fantasy 5%.

### Gate 0 — the instrumentation that must exist first

From `../platforms/paid/triggers.md` §1, and it applies to organic just as hard:

> **Rule: no acquisition dimension, no spend.** Without it every pound is unmeasurable and
> every conclusion drawn from it is fiction.

The same is true of founder-hours. Before the loop can run, the apps need:

- [ ] An `acquisition` block on the standard analytics envelope (source, campaign-id, cpp-id, country, attribution-method), **set once at install and immutable thereafter**
- [ ] An `app-install-attributed` event
- [ ] AdServices attribution token captured on first launch (iOS); Play Install Referrer (Android)
- [ ] Day-indexed cohort revenue: RPI at D0 / D7 / D30 / D60
- [ ] Retention on the **habit event**, not app-open, sliceable by source
- [ ] Rating and review-count monitoring with an alert

**None of this is content-pipeline work — it is app work.** But the feedback loop returns
noise until it exists. Recommendation: ship the `acquisition` envelope block as a
`feature-dev` run on each rig *before* the pipeline goes live, not after.

---

## 3. What we record per video

Every `content-cut` run writes these as telemetry artifacts (via the engine's existing
`tArtifact()`), so the analysis step can group by any of them:

| Dimension | Example | Why it's the unit of learning |
|---|---|---|
| `source_clip_id` | `2026-W32-04` | Reuse-cap enforcement, and "which recordings were worth making" |
| `format` | `search-answer` · `comment-reply` · `bug-confession` · `feature-demo` | **The primary learning dimension.** We are testing formats, not individual videos |
| `hook_variant` | `question` · `problem-first` · `result-first` · `contradiction` | Second-order: which opening shape holds attention |
| `target_query` | `"app to split rent with housemates"` | Ties a video to the search-intent inventory |
| `platform` + `post_url` | | Joins to platform metrics |
| `campaign_token` | `v0412` | Joins to Apple |
| `app` | `skip-hero` | Which product the traffic was for |
| `published_at` | | Cohorting; age-adjusts comparisons |

**Metrics collected nightly**, per post: views, likes, comments, shares, saves (where
available), plus YouTube's watch time / AVD / impressions / CTR / *viewed-vs-swiped-away*.
Snapshots, appended — never overwritten — so we can see the decay curve.

**Computed weekly, per format:**

```
installs_per_1k_views  =  attributed_downloads / (views / 1000)
store_cvr              =  attributed_downloads / product_page_views
view_to_store          =  product_page_views / views
send_rate (IG)         =  shares / reach            ← the documented unconnected-reach lever
comment_rate           =  comments / views
```

And the frame `../platforms/paid/triggers.md` §6 recommends for anything creator-driven,
because it requires no MMP and no assumption about customer lifetime:

```
RPM  =  revenue per 1,000 views     (compare against CPM if we ever buy distribution)
```

---

## 4. The test cadence

**Weekly is the loop. Nothing faster is honest**, because a video's view count is still
climbing for days and App Store data lands on a reporting lag.

| When | What | Who |
|---|---|---|
| **Nightly, 03:00** | `content-report` collect step: poll every post published in the last 30 days, append snapshots to `telemetry.db` | Agent (Haiku) |
| **Weekly, Sunday 16:00** | Compute per-format tables over a **14-day trailing window**; write `docs/marketing/reports/YYYY-WW.md`; update `search-queries.md` statuses; update the idea bank scores | Agent (Opus 5) |
| **Weekly, Sunday 17:00** | The report is the *first input* to the next brief | Agent |
| **Monthly** | Read Instagram **Account Status** and YouTube **YPP standing**. Re-check the reuse ledger for drift | Agent, flagged to founder |
| **Quarterly** | Re-baseline everything. The US TikTok algorithm is being retrained on US-only data through 2026 | Founder + agent |

### The per-platform A/B harnesses that are actually free

**Instagram Trial Reels — the best free tool we have.** `[DOCUMENTED]` Announced 10 Dec
2024: shown to non-followers first, does not appear on your grid unless you publish it,
metrics at **~24 hours**, with a comparison against your previous trials, and an option to
auto-share to followers if it performs well within the first 72 hours.

> This is a free A/B harness against the exact audience segment that matters — strangers —
> with a 24-hour read and no reputational cost to the main grid.

**Our use:** post the strongest cut with **hook variant A** as a trial; read at 24h against
the trailing trial median; if it clears, publish and use that hook's shape on the other
platforms. If it fails, publish with **hook variant B** instead. That is one real
experiment per video for £0.

Two catches: **Trial Reels need 1,000 followers**, and **graduation is not exposed by
Meta's API** — the pipeline can publish a trial but a human must promote the winner
`[ANECDOTAL]`. So this harness switches on later than we'd like, and adds one tap.

**YouTube Test & Compare — better, but manual.** `[DOCUMENTED]` Three title/thumbnail
variants, ~two weeks, **winner chosen by which variant produces the most watch time, not
the highest CTR.** Used over 15 million times since its 2023 launch. **Not exposed via the
API** — the pipeline generates three candidates and posts them to Slack; the founder
uploads them into the test in Studio. Two minutes per long-form upload, once a week.

> **Do not override the test with your CTR intuition.** A lower-CTR thumbnail that attracts
> the right viewer can and does win on watch time.

**TikTok has no native test surface.** The unit of experiment there is the **search-query
inventory**: one video per real query, phrase verbatim in speech + on-screen text +
caption. These may never trend, but they are permanently discoverable inventory for
high-intent traffic, and each one is a clean read on whether that query converts.

---

## 5. How results feed back into idea generation

This is the part that makes it a loop rather than a dashboard.

**The idea bank** (`docs/marketing/inventory/`) carries a score per *format* and per
*query*, recomputed weekly:

```
format_score  = median(installs_per_1k_views over last 14d, ≥3 videos)
                × age_adjust
                × novelty_penalty        ← ↓ if we've used it 4+ times in 14 days
query_score   = installs_per_1k_views for the video covering that query
                (or 'untested' — untested queries carry a fixed exploration bonus)
```

**The weekly brief's composition is then driven by the scores**, with an explicit
exploration budget so the pipeline cannot collapse onto one winning template — which is
precisely the failure mode YouTube's inauthentic-content policy names (*"template with
little to no variation across videos," "easily replicable at scale"*) and Instagram's
sameness ceiling describes:

| Slot | Share of the week | Selection rule |
|---|---|---|
| **Exploit** | ~50% | Top-scoring formats, applied to new subject matter |
| **Explore** | ~30% | Untested search queries and formats with <3 videos of data |
| **Mandatory** | ~20% | ≥1 comment-reply per day; ≥1 "something broke" per week — these ship regardless of score, because they are the originality and authenticity guarantees, not growth bets |

**The novelty penalty is the anti-slop governor.** A format that wins gets used more — but
only up to a cap, after which its score is deliberately discounted. Reach will not degrade
because of frequency; **it will degrade because of sameness.**

**Three other feedback edges:**

- **Comments → next week's shots.** The nightly collector extracts questions from comments; every question is a candidate comment-reply video. This is free content derived from real demand rather than invented angles, and it is unambiguously original.
- **Store conversion → product work, not content work.** If `view_to_store` is healthy but `store_cvr` is poor, the problem is the store listing, not the video. Route it to ASO (screenshots, first 3 seconds of the preview video, the 100-char keyword field), and consider a Product Page Optimization test. LifePilot lost its launch to a store-page language bug it could not see.
- **Reviewer false-negatives → prompt updates.** Every video the founder rejects at Human Gate 2 *after* the reviewer passed it is logged with his one-line reason. When the same reason appears three times, the weekly report proposes an addition to the reviewer checklist. **The checklist improves from real rejections, not from theory.**

---

## 6. Kill criteria and red flags — write these down before, not after

**Per-format kill:** a format with ≥5 videos and a median `installs_per_1k_views` below
20% of our best format is retired from the exploit pool for a month. Not deleted — retired,
because platform behaviour shifts.

**Per-app kill signal:** if an app has ≥300 cumulative organic installs over ≥60 days and
D30 retention on the habit event is still below 8% and falling, **the content is not the
problem and more content will not fix it.** Route to product or kill the app. Do not spend
another quarter making better videos for something nobody keeps.

**Red flags — stop and reassess if any appear:**

| Signal | What it means | Action |
|---|---|---|
| *"Restricted in search results"* notices on TikTok | Originality budget exceeded | Cut reuse to 1 clip per video immediately; audit the ledger |
| Instagram **Account Status** not green | Recommendation eligibility lost | Read the status **before** diagnosing "the algorithm hates us". Green + zero reach = the content is the problem |
| YouTube **YPP standing** lost | The clearest possible external verdict that the pipeline has drifted into slop | Treat as a quality alarm, not an income line. Stop, re-read the inauthentic-content categories |
| Posting more, `installs_per_1k_views` falling | Generating slop, not content | Cut volume, raise the explore share, re-read the anti-slop checklist |
| Comments per 1,000 views trending to zero | Format-correct and substance-empty | The founder needs to be *more* specific, not the agent more polished |
| Long-form CTR under 2% | Below YouTube's published middle-50% band | Fix thumbnails before adding uploads |
| Reviewer PASS rate approaching 100% | The checklist has stopped biting | Audit against the last 10 founder rejections |

---

## 7. What the weekly report says

One page, posted to `#factory-marketing` Sunday afternoon, before the brief:

1. **Headline:** attributed installs this week, by app, vs the trailing 4-week median.
2. **The table that matters:** per format — videos, median views, median `installs_per_1k_views`, best and worst individual video with links.
3. **Query inventory:** covered / open, and the top 3 untested queries by estimated intent.
4. **Trial Reels:** every A/B run this week, hook shape, and the 24h verdict.
5. **Hygiene:** reuse-ledger status, Account Status, YPP standing, watermark-check failures.
6. **Proposed changes:** to the reviewer checklist, to the format mix, to the cadence — each with the evidence that triggered it.
7. **One honest sentence** on whether the week's output was better than the week before, or just larger.

Item 7 is not decoration. It is the question the entire loop exists to answer.

---

## Sources

- [Apple — Analytics reports API](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api) · [Acquisition](https://developer.apple.com/help/app-store-connect-analytics/acquisition/acquisition/)
- [Meta — Trial Reels announcement (10 Dec 2024)](https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/) · [Help centre](https://help.instagram.com/835643311711702/)
- [Instagram — Account Status](https://help.instagram.com/338481628002750)
- [YouTube — Test & Compare](https://support.google.com/youtube/answer/13861714) · [Audience overlap report](https://support.google.com/youtube/answer/12220281) · [YPP thresholds](https://support.google.com/youtube/answer/72851?hl=en)
- [KeyAPI — TikTok user data & video metrics via API](https://www.keyapi.ai/blog/how-to-fetch-tiktok-user-data-video-metrics-api/)
- [RevenueCat — LTV:CAC alternatives](https://www.revenuecat.com/blog/growth/ltv-cac-subscription-apps-alternatives/)
- Internal: `../platforms/tiktok/credibility.md` §6 · `../platforms/instagram/algorithm.md` §4, §9 · `../platforms/youtube/algorithm.md` §5, §13 · `../platforms/paid/triggers.md` §1, §6
