# X + LinkedIn: How Distribution Actually Works (research, Aug 2026)

**Scope:** X/Twitter and LinkedIn ranking mechanics as of August 2026.
**Labelling:** every claim is tagged `[DOCUMENTED]` (published source code, official blog/paper/earnings call, or platform help docs) or `[ANECDOTAL]` (creator testing, vendor studies, secondhand reports of employee statements).

A warning that applies to this whole file: the "LinkedIn algorithm 2026" and "X algorithm 2026" blog genre is ~95% AI-generated SEO content that recycles each other's numbers with no primary source. Numbers like "comments weigh 15x more than likes" or "external links reduce reach by 60%" appear in dozens of posts with zero attribution. They are marked `[ANECDOTAL]` here and should be treated as folklore until someone shows the test data.

---

## Part 1 — X / Twitter

### 1.1 The pipeline has been rewritten twice, and the second rewrite matters

**2023 release** — `github.com/twitter/the-algorithm`, accompanied by an official engineering blog post (31 Mar 2023). This is the release that everyone still quotes. Architecture: candidate sourcing (Earlybird search index, User-Tweet-Entity-Graph, CR-Mixer, FRS) → ~1,500 candidates → ~6,000 hydrated features → light ranker → heavy ranker (a ~48M-parameter neural net) → heuristics/filters. `[DOCUMENTED]` — https://github.com/twitter/the-algorithm/blob/main/home-mixer/README.md

**2026 release** — `github.com/xai-org/x-algorithm`, published 20 Jan 2026, with a large update on 15 May 2026 that added an end-to-end inference pipeline and downloadable pre-trained "mini Phoenix" model artifacts (~3 GB via Git LFS). `[DOCUMENTED]` — https://github.com/xai-org/x-algorithm

The 2026 architecture is four pieces:
- **Home Mixer** — orchestration (query hydration → candidate sourcing → hydration → filtering → scoring → selection → post-selection validation)
- **Thunder** — in-memory store serving in-network posts (accounts you follow)
- **Phoenix** — a Grok-based transformer doing both retrieval (two-tower embeddings over the global corpus) and ranking
- **Candidate Pipeline** — the reusable trait framework (sources, hydrators, filters, scorers, selectors)

`[DOCUMENTED]` — https://github.com/xai-org/x-algorithm

**The single most important structural change:** the 2026 system "eliminates hand-engineered features," replacing the old feature-farm + heuristics stack with a transformer that reads your recent engagement sequence directly. `[DOCUMENTED]` — repo README.

**Practical consequence for us:** the 2023-era "hack the weights" playbook (bookmark-bait, reply-bait, avoid links) is aimed at a machine that no longer exists in that form. What survives is the *objective function*, which is still a hand-set weighted sum — see 1.2.

### 1.2 What the model actually predicts, and how it is combined

`home-mixer/scorers/weighted_scorer.rs` in the current repo combines these predicted actions, each multiplied by a named weight constant:

| Positive | Negative |
|---|---|
| `favorite`, `reply`, `retweet`, `quote` | `not_interested` |
| `click`, `quoted_click`, `profile_click` | `block_author` |
| `photo_expand`, `vqv` (video quality view, dynamic weight) | `mute_author` |
| `share`, `share_via_dm`, `share_via_copy_link` | `report` |
| `dwell` (binary) **and** `cont_dwell_time` (continuous) | |
| `follow_author` | |

`[DOCUMENTED]` — https://github.com/xai-org/x-algorithm/blob/main/home-mixer/scorers/weighted_scorer.rs

Final score = Σ (weight_i × P(action_i)). `[DOCUMENTED]`

**The numeric weight values are NOT published.** They live in a `params` module that is not in the public repo. Anyone quoting exact 2026 X weights is quoting the 2023 numbers and hoping. `[DOCUMENTED — by absence]`

**Dwell time on X is now a first-class ranking objective, twice over** (binary `dwell_score` + continuous `cont_dwell_time`). This is new relative to 2023 and is the closest X has come to LinkedIn's model. It is the strongest argument for posts that hold a reader — long-form, threads, images with text, native video — over one-liners. `[DOCUMENTED]`

**`share_via_dm` and `share_via_copy_link` are separate predicted actions.** Dark-social sharing is explicitly modelled. A post that people send to a friend privately is being scored for that. `[DOCUMENTED]`

### 1.3 The 2023 heavy-ranker weights (still the only real numbers we have)

From the released scoring config, as annotated by the community reference `igorbrigadir/awesome-twitter-algo`:

| Action | Weight |
|---|---:|
| Reply engaged by the author | **+75** |
| Open profile → engage | +12 |
| Reply | **+27** |
| Click and reply, or click and stay 2+ min | +11 |
| Retweet | +1 |
| Favorite (like) | +0.5 |
| Video watched ≥50% | +0.005 |
| Hide / block / mute | **−74** |
| Report | **−369** |

`[DOCUMENTED]` (2023 code) — https://github.com/igorbrigadir/awesome-twitter-algo

**Read this correctly.** These are weights on *predicted probabilities*, not on events. A like is far more likely than a reply, so multiplying by 0.5 vs 27 does not mean a reply is 54× a like in feed impact. But the ordering is unambiguous and has been stable across both releases: **conversation > amplification > passive approval**, and **a reply you answer is the highest-value event on the platform**.

**Direct implication for a founder account:** answering replies is not politeness, it is ranking. The +75 term is the author replying to a reply.

### 1.4 In-network vs For-You distribution

- The For You timeline was documented in 2023 as roughly **50% in-network (accounts you follow) / 50% out-of-network**. `[DOCUMENTED]` — 2023 home-mixer README and engineering blog.
- 2023 code applied a **0.75 scale factor** to out-of-network candidates. `[DOCUMENTED]`
- 2026 code has a dedicated `oon_scorer.rs` that multiplies base score by `OON_WEIGHT_FACTOR` for any candidate where `in_network == false`. The value is not published. `[DOCUMENTED]` — https://github.com/xai-org/x-algorithm/blob/main/home-mixer/scorers/oon_scorer.rs
- **Author diversity decay:** 2023 code applied `score × ((1 − 0.25) × 0.5^position + 0.25)` — the second post from the same author in one refresh is roughly halved. A dedicated `author_diversity_scorer.rs` still exists in 2026. `[DOCUMENTED]`

**Implication:** posting 12 times a day does not get you 12× reach — the second and third posts within a single user's refresh are actively attenuated. Follower count buys you a floor (the in-network half), not a ceiling.

### 1.5 The reply/mutuals change — July 2026

On 13 July 2026 X's head of product Nikita Bier announced the algorithm had been reweighted so replies from **mutuals** (people you follow who follow you back) surface above replies from strangers. Quote: *"We noticed this data was missing from the algo and it made your friends appear less in your replies. This resulted in the reply section feeling more like a battleground with people you don't recognize."* `[DOCUMENTED]` — https://techcrunch.com/2026/07/13/x-just-tweaked-its-algorithm-to-make-it-more-friendly-less-battleground/

Also shipped alongside: a thumbs-down on replies for Premium subscribers, feeding reply ranking. `[ANECDOTAL]` (reported, not in published code).

**Implication:** the value of a *mutual* follow just went up relative to a one-way follower. Reply visibility now depends on graph reciprocity. For a studio account, this rewards a small dense cluster of genuine mutuals over a broad follower count.

### 1.6 The link penalty: what is actually true

This is the most-repeated claim about X, and it's messier than either camp admits.

- **The suppression was real and large.** PPC Land's January 2026 technical analysis of the released code found posts containing links received **94% fewer views** than comparable posts without them. `[ANECDOTAL — third-party measurement]` — https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/
- **There was never an explicit URL penalty in the code.** The mechanism is structural: Phoenix predicts a fixed list of engagement types, and **outbound link clicks are not one of them**. A post whose entire purpose is to send you off-platform generates none of the actions the model is scored on, so it ranks low. Nothing "penalises" the link — the objective function is simply blind to its payoff. `[DOCUMENTED]` — confirmed by the action list in `weighted_scorer.rs` above.
- **Musk's position, 29 July 2026:** asked whether X still penalises link posts, he replied *"We haven't for over a year"* — i.e. since roughly mid-2025. No formal announcement, no date, no code change identified. `[ANECDOTAL — a tweet]`
- Claims of "8× increase in link post reach after the penalty was removed in October 2025" circulate widely and I could not trace any of them to a primary measurement. `[ANECDOTAL — treat as unverified]`

**Working assumption for us:** don't put the link in the post that's doing the reaching. Not because of a penalty flag, but because the model can't see a link click as success. Put the link in a reply, in the bio, or in a post you're not relying on for distribution.

### 1.7 Premium boost

- **2023 code: real and large.** `BlueVerifiedAuthorInNetworkMultiplierParam` default **4.0**, `BlueVerifiedAuthorOutOfNetworkMultiplierParam` default **2.0**, applied as a multiplier on the final score. `[DOCUMENTED]` — https://github.com/igorbrigadir/awesome-twitter-algo
- **2026 code: no equivalent.** The published scorer set is `author_diversity_scorer`, `oon_scorer`, `phoenix_scorer`, `ranking_scorer`, `vm_ranker`, `weighted_scorer`. None applies a subscription multiplier. The only subscription-related filter is `ineligible_subscription_filter.rs`, which gates access to *creator-subscription paywalled content* — a different thing entirely. `[DOCUMENTED — by absence]` — https://github.com/xai-org/x-algorithm/tree/main/home-mixer/scorers and `/filters`
- Every "Premium gives you 2–4× / 10× reach in 2026" blog post is citing the 2023 parameter and presenting it as current. `[ANECDOTAL — likely stale]`

**Practical note:** Premium is still worth $8/mo for a founder account for non-ranking reasons (longer posts, edit, analytics, monetisation eligibility, reply thumbs-down). Tiers reported at Basic $3 / Premium $8 / Premium+ $40; verify at https://help.x.com/en/using-x/x-premium before budgeting. `[ANECDOTAL]`

Creator payout eligibility is reported as Premium + 500 verified followers + 5M verified impressions/3 months, paying roughly $8–12 per million verified impressions. `[ANECDOTAL]` — and see `case-studies.md`, where Marc Lou's actual 2025 X payout was **$14,339 for the year while gaining 100,000 followers.** That's the honest number.

### 1.8 Video

- 2023: `video watched ≥50%` carried weight **+0.005** — the smallest positive weight in the table by three orders of magnitude. `[DOCUMENTED]`
- 2026: video is handled by a `vqv_score` (video quality view) with a **dynamic** weight (`vqv_weight`, not a constant), plus `min_video_duration_ms` metadata and a `video_filter.rs` that can exclude video candidates on request. Dwell-time terms also capture video watch implicitly. `[DOCUMENTED]`

A dynamic weight means X can dial video up or down globally without a code change, and almost certainly has dialled it up — Bier shipped a native in-app video editor in July 2026. `[ANECDOTAL]` The honest read: video's weight is now a business lever, not a constant, and we can't measure it from outside.

### 1.9 Thread mechanics

- Conversation modules are a first-class product feature in home-mixer (2023 README lists "conversations" under served features). `[DOCUMENTED]`
- 2026 filters include `dedup_conversation_filter.rs` and `retweet_deduplication_filter.rs` — the system collapses a conversation to a representative branch rather than showing you every tweet in it. `[DOCUMENTED]`
- Widely reported reading: each tweet in a thread is scored independently as a candidate, and the system promotes the best-performing branch. `[ANECDOTAL]`

**Implication:** every tweet in a thread must stand alone. "1/12 🧵" as a hook post is betting everything on one candidate; a self-contained post that happens to have more underneath it gets scored on its own merits and pulls the rest along.

---

## Part 2 — LinkedIn

LinkedIn does not open-source its ranking system, but it publishes research papers on it, which is nearly as good and far better sourced than the blog ecosystem suggests.

### 2.1 Dwell time is the documented core signal

- **2020, official engineering blog:** LinkedIn defines two dwell metrics — dwell "on the feed" (starts when ≥50% of an update is visible during scroll) and dwell "after the click." They shipped a **P(skip)** model predicting whether a member views an update for less than a threshold `T_skip`; A/B tests showed significant reductions in skipped updates and increases in click-through, viral actions, and time spent. `[DOCUMENTED]` — https://www.linkedin.com/blog/engineering/feed/understanding-feed-dwell-time (Dangi, Jia, Somaiya, Xuan — 12 May 2020)
- **2024, LiRank paper:** LinkedIn's production feed ranker is point-wise and predicts **like, comment, share, vote, click, and long dwell**. "Long dwell" is a binary classifier predicting whether time-on-post exceeds a **context-dependent percentile threshold** — adjusted by ranking position, content type, and platform. LiRank delivered +0.5% member sessions on Feed. `[DOCUMENTED]` — https://arxiv.org/abs/2402.06859
- **2026, Feed SR paper:** a transformer-based **sequential** recommender replaced the DCNv2 ranker, serving the majority of LinkedIn feed traffic. Reported A/B gains: **+2.10% time spent, +3.52% likes/comments/reshares.** Submitted 12 Feb 2026, revised 29 May 2026. `[DOCUMENTED]` — https://arxiv.org/abs/2602.12354

**This is the single most reliable fact in this document:** LinkedIn optimises for *time spent reading*, with an explicit long-dwell objective, and has done so continuously since 2020. Both platforms have now converged on dwell.

**Implication:** the format wins that keep a thumb still. A 900-character text post someone reads to the end beats a clever one-liner with more likes. A carousel someone swipes through beats both.

### 2.2 Comment weighting

- **Official, from earnings:** LinkedIn reported **comments up 24% year-over-year** in Microsoft's Q1 FY2026 update (30 Oct 2025) — the metric leadership chose to highlight. Notably, Microsoft dropped its usual "record levels of engagement" phrasing for the first time since 2018. `[DOCUMENTED]` — https://www.socialmediatoday.com/news/linkedin-reports-increase-in-post-comments-video-posts-microsoft-q1-2026/804353/
- **Documented in the model:** `comment` is one of the six predicted actions in LiRank. `[DOCUMENTED]`
- **"Comments are weighted 15× likes":** no primary source anywhere. `[ANECDOTAL — treat as folklore]`
- **"Posts with 3+ meaningful comments in the first 60 minutes get ~5.2× reach amplification"** (vendor study over 1.8M posts): plausible, single-vendor, not reproduced. `[ANECDOTAL]`

The defensible version: comments are an explicit ranking objective and the one LinkedIn's own leadership brags about. Substantive comments produce dwell for both the commenter and subsequent readers, so they compound with the dwell objective. Reply to every comment — same logic as X's +75.

### 2.3 Golden hour

Widely repeated as "the first 60–90 minutes decide reach." **There is no LinkedIn documentation of a golden-hour rule.** `[ANECDOTAL]`

What *is* documented: LiRank/Feed SR are point-wise per-(member, post) scorers with explore/exploit machinery, and posts age out of feeds. Early engagement plausibly informs the exploit side. But the specific 60-minute window, and every "post at 9:15am Tuesday" claim built on it, is creator folklore. Don't build a schedule around it; do be available to reply for an hour after posting, because *that* is documented value.

### 2.4 Why external links suppress reach — the honest version

- **The vendor benchmark:** Socialinsider, 1.3M posts across 16,645 company pages, Jan 2024–Dec 2025. Engagement rate by format for 2025: **native document 7.00%, multi-image 6.45%, video 6.00%, image 5.30%, text 4.50%, poll 4.20%, link 3.25%.** Link posts are dead last, at less than half the document rate. `[ANECDOTAL — vendor study, but large and dated]` — https://www.socialinsider.io/social-media-benchmarks/linkedin
- **LinkedIn's own position:** Rishi Jobanputra, Senior Director of Product Management at LinkedIn, publicly stated that "adding links reduces reach" is outdated advice, and that the problem is *intent* — posts whose sole purpose is driving traffic off-platform with no upfront value underperform, while links supplementing genuine content do not hurt. `[ANECDOTAL — secondhand; I could not locate the original video/post, only creator write-ups of it]` — https://www.linkedin.com/posts/mattjbarker1_last-week-linkedins-senior-director-of-product-activity-7363464041085767680-Nvr5
- **"External links cut reach 60%" / "the link-in-first-comment workaround is now also penalised":** no source, repeated verbatim across dozens of AI-written blogs. `[ANECDOTAL — unverified]`

**Reconciling the two:** both are consistent with a system that has no link detector. Link posts underperform because link posts are usually thin (headline + URL), generate no dwell, and no comments. The correlation is real; the causal story ("LinkedIn punishes URLs to keep you on-site") is unproven. Same structural logic as X §1.6.

**Working rule, identical on both platforms:** the post must be worth reading with the link removed.

### 2.5 Documents / carousels

Native document posts are the top-performing format in the Socialinsider data (7.00% in 2025, +14% YoY). `[ANECDOTAL — vendor]` The mechanism is obvious and consistent with §2.1: a swipeable PDF is a dwell-time machine — every swipe is another second on-post, and it never leaves the platform. This is the one format recommendation in this document that is supported by both a large benchmark *and* a documented ranking objective.

### 2.6 Video

- LinkedIn reported **three consecutive quarters of double-digit video upload growth**, video uploads +20% YoY, and video watch time **+36% YoY**. `[DOCUMENTED — Microsoft Q1 FY2026 / LinkedIn newsroom]`
- Video sits mid-table on engagement rate (6.00%), below documents. `[ANECDOTAL — vendor]`

LinkedIn is pushing video hard because it wants the format, not because it converts best. Supply is rising fast, which means the per-post advantage is compressing.

### 2.7 Newsletters — the one distribution cheat code LinkedIn documents

From LinkedIn's own help documentation:
- Any member can create a newsletter.
- **Every edition sends push, in-app, AND email notifications to all subscribers.**
- When someone follows you, LinkedIn **automatically sends them an invitation to subscribe**.
- **Subscribing to a newsletter also makes you follow the author.**

`[DOCUMENTED]` — https://www.linkedin.com/help/linkedin/answer/a522525

That is a documented, non-algorithmic, three-channel push to your whole list, that auto-grows off your follower graph, that LinkedIn does not throttle the way it throttles feed posts. It is structurally the strongest asset on either platform for anyone who can sustain a publishing cadence.

Reported at 500M+ newsletter subscriptions globally in 2026 `[ANECDOTAL]`. Analytics gained email-send and open-rate tracking in Feb 2025 `[ANECDOTAL]`.

### 2.8 Engagement pods and artificial engagement

Gyanda Sachdeva, LinkedIn VP of Product Management, on the record: *"Our goal is to make engagement pods entirely ineffective. We are increasing the number of ways we detect these pods and the suspicious behavior that happens in these pods."* — and LinkedIn is *"increasingly flagging any artificially boosted content internally, and then also, we are limiting the reach of this content."* They are also targeting browser extensions that automate mass commenting. `[DOCUMENTED]` — https://www.socialmediatoday.com/news/linkedin-vows-to-take-action-against-engagement-pods-fake-engagement/804970/

Claims of "97% detection accuracy" and "8,500 impressions to 340 overnight" have no source. `[ANECDOTAL]`

### 2.9 Personal profile vs company page

Vendor data consistently shows personal profiles beating company pages by wide margins — figures range from 2.75× impressions / 5× engagement (employee vs brand page, despite 46% fewer followers) up to "8×", with a claim that company-page content occupies ~5% of feed allocation vs ~65% for personal profiles. Every one of these traces to a marketing vendor, not to LinkedIn. `[ANECDOTAL]`

The direction is almost certainly right and is consistent with LiRank being a person-to-person social graph model. The magnitudes are marketing. **Do not run a "brand page" as the primary account** — see `credibility.md`.

### 2.10 B2B intent

LinkedIn's own business is the tell: LinkedIn revenue grew 10% in Q1 FY2026, **driven by Marketing Solutions**, with 1.3B members. `[DOCUMENTED]` The platform's entire economic model assumes commercial intent from professionals in a work context. That is genuinely different from X, and it is the only reason LinkedIn is worth discussing for a product company at all — see `audience.md` for who that does and doesn't help.

---

## Cross-platform summary: what is actually load-bearing

| Claim | X | LinkedIn |
|---|---|---|
| Dwell time is an explicit ranking objective | ✅ `[DOCUMENTED]` — 2 terms in `weighted_scorer.rs` | ✅ `[DOCUMENTED]` — P(skip) 2020, long-dwell in LiRank 2024, Feed SR 2026 |
| Comments/replies outrank likes | ✅ `[DOCUMENTED]` — reply +27, author-answered reply +75 vs like +0.5 (2023) | ✅ `[DOCUMENTED]` — comment is a modelled objective; +24% YoY highlighted officially |
| Author answering replies is the top signal | ✅ `[DOCUMENTED]` | ⚠️ `[ANECDOTAL]` but structurally consistent |
| Explicit penalty for external links | ❌ **No** — no link term in the objective at all `[DOCUMENTED by absence]` | ❌ **No** — denied by LinkedIn product leadership `[ANECDOTAL]` |
| Link posts nonetheless underperform badly | ✅ 94% fewer views measured `[ANECDOTAL]` | ✅ worst format in 1.3M-post benchmark `[ANECDOTAL]` |
| Premium/paid boost in current ranking | ❌ **Not in the 2026 published pipeline** (was 4×/2× in 2023) `[DOCUMENTED by absence]` | n/a (Premium is not a ranking factor LinkedIn claims) |
| Golden hour | ⚠️ `[ANECDOTAL]` | ⚠️ `[ANECDOTAL]` — no official source |
| Best-performing native format | Self-contained post + image/video, thread branches scored independently | **Native document/carousel** (7.00%) |
| Non-algorithmic push channel | ❌ none | ✅ **Newsletters** — push + in-app + email to all subs `[DOCUMENTED]` |
| Multiple posts/day compound | ❌ author-diversity decay halves the 2nd `[DOCUMENTED]` | ⚠️ unknown, likely similar |

**The one-line synthesis:** both platforms now optimise for *how long a stranger's thumb stops on your post* and *whether a conversation happens under it*, and neither rewards sending people away. That is the same content brief on both, and it is a brief that a demo video plus a real opinion satisfies and that an AI-generated "5 lessons from building in public" post does not.
