# Instagram: How Distribution Actually Works (as of August 2026)

**Research date:** 2026-08-05
**Scope:** Reels, feed (carousels/images), Stories, Explore, Search, link mechanics.

**Labelling convention used throughout:**
- `[DOCUMENTED]` — stated by Meta/Instagram in an official blog, help page, or a direct on-record quote from Adam Mosseri reported verbatim by a named outlet.
- `[DATASET]` — a third-party study with a stated sample size and methodology. Not Meta's word, but not folklore either.
- `[ANECDOTAL]` — practitioner claim, agency blog, or single-founder report. Treat as a hypothesis to test, never as a plan input.

---

## 1. The three signals that actually decide reach

`[DOCUMENTED]` On 22 January 2025, Adam Mosseri opened a video series on ranking with the plainest statement Instagram has ever made:

> "The top three signals that matter most for ranking are watch time, likes and sends."
> "When looking at your insights, pay close attention to **average watch time, likes per reach, and sends per reach**."
> "Likes are slightly more important for connected content, and sends are slightly more important for unconnected content."

Source: https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/

`[DOCUMENTED]` He reinforced and sharpened this on 26 May 2026 — the emphasis moved explicitly from *reach* to *rate*:

> "The thing I think that matters most, and that you really should focus on, is not how much reach your post got."
> "So of all the people who saw the post, how many of them actually engaged with that post?"
> "The engagement rates that matter most vary slightly. For instance, **like rates matter more for your followers, and send rates matter more for those who don't follow you**."

Source: https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/

**Why this matters for an app studio.** "Connected" = your followers. "Unconnected" = strangers. A bootstrapped app studio has almost no followers, so **essentially 100% of the distribution you care about is unconnected reach, which is governed by sends per reach.** Not likes. Not comments. Not saves. Sends — someone DMing your Reel to a specific person.

That single fact should drive the entire content brief. A screen-recording demo edited into a Reel must answer: *who would a viewer send this to, and why?* "Look at this thing that solves the problem you complained about last week" is a send. "Nice app" is a like, and likes barely move unconnected reach.

`[ANECDOTAL]` The commonly cited "sends are weighted 3–5× higher than likes" multiplier appears widely in SEO blogs (e.g. https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers) but **has no Meta source**. Mosseri only ever said "slightly more important." Do not plan against the 3–5× number.

---

## 2. Watch time vs. sends — the actual ordering

`[DOCUMENTED]` Mosseri lists watch time first in the Jan 2025 framing, and the *rate* framing in May 2026 treats like-rate and send-rate as the discriminators. The honest reading: **watch time gates whether you get tested at all; send rate decides how far the test expands.**

`[DATASET]` Metricool's 2026 Instagram study (24,364,803 posts across 375,118 accounts, Jan–Feb 2025 → Jan–Feb 2026, published 16 June 2026) found **average Reel watch time is 8.5 seconds — double the prior year.**
Source: https://metricool.com/press-release-instagram-study-2026/

8.5 seconds is the number to design against. A 30-second demo Reel that holds to 8.5s average is at platform par. The founder's raw screen recording almost never survives its first 3 seconds without an edited hook — that is the single highest-leverage edit an agent can make.

`[ANECDOTAL]` The "first 3 seconds are the critical threshold" claim is universal in practitioner blogs and consistent with the 8.5s average, but Meta has never published a 3-second threshold.

---

## 3. The originality regime (this is the big one for AI-edited content)

`[DOCUMENTED]` Instagram's originality policy, published 30 April 2024:
- When Instagram finds "two or more identical pieces of content," it will **"only recommend the original one."**
- **"Accounts that repeatedly (10 or more times in the last 30 days) post content from other Instagram users that they didn't create or enhance in a material way will not be shown in surfaces where we recommend content."**
- Original content must have **"no visible watermarks"** to be eligible for recommendation.
- Reposts get a label linking back to the original creator.
- The ranking system **"shows eligible content to small audiences first, expanding reach based on engagement."**

Source: https://creators.instagram.com/blog/recommendations-and-originality

`[DOCUMENTED]` On 30 April 2026 Instagram extended the aggregator restriction from Reels to **photos and carousels**. Accounts that primarily repost others' work are no longer eligible for recommendations anywhere in the app. Instagram's definition of original includes work that "reflects their unique perspective, or involves material editing"; meme accounts adding humour and commentary qualify; **"low-effort edits like watermarks or speed changes do not."**

Source: https://techcrunch.com/2026/04/30/instagram-restricts-reach-of-content-aggregators-in-new-crackdown/

**Direct implication for the App Factory model.** Founder-supplied raw screen recordings are unambiguously original footage — you are safe on the originality axis by construction, *provided*:
1. No TikTok/CapCut/other-platform watermark ever survives into the IG upload. A watermark is a documented disqualifier from recommendation.
2. The same cut is not posted identically to a second IG account you control (duplicate detection recommends only one).
3. Template-identical output across many posts is the risk zone — see `credibility.md`.

---

## 4. Trial Reels — the single best free tool for a studio with no audience

`[DOCUMENTED]` Announced 10 December 2024:
- A trial Reel is **shown to non-followers first**.
- It does **not** appear on your grid or Reels tab unless you later publish it.
- Metrics (views, likes, comments, shares) appear **~24 hours** after posting, plus a comparison against your previous trials.
- You can opt in to have Instagram **automatically share it with your followers if it performs well "based on the views it receives within the first 72 hours."**

Sources: https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/ · https://help.instagram.com/835643311711702/

**Why this is the killer feature for us.** Trial Reels are a free A/B harness against the exact audience segment that matters (strangers), with a 24-hour read and no reputational cost to the main grid. An agent pipeline can post 3 hook variants of the same demo as trials, read the 24h numbers, and promote only the winner. This is the closest thing Instagram has to YouTube's Test & Compare, and it is aimed squarely at accounts with no followers.

`[ANECDOTAL]` The widely repeated "40% of creators posted more often, 80% of those saw an increase in reach from non-followers" stat is attributed to Meta but **does not appear in the December 2024 announcement I fetched**. Treat as unverified.

---

## 5. Account size no longer gates reach (officially)

`[DOCUMENTED]` Instagram states it changed Reels recommendations so that **"creators of all sizes have an equal chance of breaking through and reaching new audiences,"** noting that recommendations historically favoured larger accounts.

Source: https://creators.instagram.com/blog/the-latest-with-instagram

`[DOCUMENTED]` The 2023 "Ranking Explained" page still lists "creator popularity — number of followers or level of engagement" as a Reels signal. Source: https://about.instagram.com/blog/announcements/instagram-ranking-explained (published 31 May 2023). The two statements are in tension; the 2024/2025 statement is newer and more specific. Plan on "small accounts can break through," but expect the first ~10 posts of a new account to be tested at very small audience sizes (per the "small audiences first" mechanic in §3).

---

## 6. Format economics: Reels reach, carousels convert

`[DATASET]` Socialinsider, 35 million posts across 447,613 pages, Jan–Dec 2025, published 20 February 2026 (https://www.socialinsider.io/social-media-benchmarks/instagram):

| Format | Engagement rate (2025 full year) | Engagement rate (Q2 2026) | Median posts/month |
|---|---|---|---|
| Carousels | 0.55% | 0.50% | 5 |
| Reels | 0.52% | 0.48% | 8 |
| Images | 0.37% | 0.33% | 7 |
| **All formats** | **0.48%** | — | — |

Also from that dataset: **audience growth rates fell from 22–38% (2024) to 11–22% (2025)** across brand-size cohorts. Instagram follower growth is structurally harder than it was.

`[DATASET]` Metricool (same study as §2):
- Reels generate **>4× the interactions** of single-image posts.
- Carousels generate **9× the saves** of single-image posts.
- Single-image posts YoY: **reach −21.96%, interactions −25.41%, engagement −45.98%.**
- Platform-wide: publishing volume **+24.04%**, views **+26.56%**, interactions **+19.25%** YoY. (Note: supply is growing faster than interactions — per-post reach dilution is real.)
- **Stories replies +88% YoY.**
- Posts containing a question: **+36.70% comments.** Comment-focused CTAs: **+202.78% comments.**
- **Hashtag usage correlated with 31.70% fewer views and 33.89% fewer interactions.**

`[ANECDOTAL]` Third-party claims that "Reels get ~36% more reach than carousels" and "2.25× the reach of single images" circulate widely (e.g. https://collabkit.me/blog/instagram-reels-vs-carousels-vs-images-data-study-2026) but the underlying data isn't independently verifiable. Directionally consistent with the above; don't quote the precise multiplier.

**Practical read for an app studio:** Reels are the acquisition surface. Carousels are the *explanation* surface — the thing a curious stranger saves and comes back to. A 60/30/10 Reels/carousel/image split is the practitioner consensus; the data supports Reels-heavy but does not support abandoning carousels, since carousel engagement rate is the highest of the three and saves are 9× images.

---

## 7. Hashtags are dead; keywords are not

`[DOCUMENTED]` Mosseri, February 2025: hashtags **"don't work"** to increase reach. Mosseri, May 2025: hashtags **"don't improve visibility on Instagram,"** though they remain "a great way to let people know what a post is about and connect posts."

`[DOCUMENTED]` As of 18 December 2025, Instagram **caps hashtags at five per post** platform-wide.

Source: https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/

`[DOCUMENTED]` Instagram Search ranks keyword results on "type of content, captions, when it was posted, and more," and instructs that **keywords and hashtags belong in the caption, not the comments.**
Source: https://help.instagram.com/1482378711987121

`[DOCUMENTED]` Meta has begun using AI to generate SEO summaries/titles for Instagram posts surfaced in external search engines.
Source: https://www.socialmediatoday.com/news/instagram-is-using-ai-to-generate-seo-summaries-of-posts/807613/

**Read:** write captions as plain-language descriptions containing the words a user would type ("budget app that splits rent," "workout tracker with rest timer"). Spoken words in the Reel are transcribed and indexed too. Do not spend agent effort on hashtag research; cap at ~3–5 topical tags and move on.

---

## 8. Stories: retention surface, not acquisition surface

`[DOCUMENTED]` Stories ranking signals are **viewing history, engagement history, and closeness** — all follower-relationship signals. There is no discovery mechanic in Stories.
Source: https://about.instagram.com/blog/announcements/instagram-ranking-explained

`[DOCUMENTED]` Mosseri, 6 April 2026, killing the most popular Stories "hack":

> "You can definitely share your own post to your Stories, or re-share your own post, but **it's not going to meaningfully change your reach overall**..."

Source: https://www.socialmediatoday.com/news/instagram-chief-debunks-popular-engagement-hack/816781/

`[DATASET]` Stories replies grew **+88% YoY** (Metricool 2026). Stories are where conversation happens, not where strangers arrive.

`[ANECDOTAL]` Story completion-rate benchmarks in the wild are wildly inconsistent (55–87% depending on source) and none of the sources I could reach published methodology. Ignore published Stories benchmarks; measure your own.

**Read for us:** Stories are worth exactly one thing early on — they are the only organic surface with a **native clickable link** (link sticker). Until you have a few thousand followers, Stories have near-zero acquisition value. Do not let an agent spend budget producing daily Stories for an account with 200 followers.

---

## 9. Link mechanics — the actual conversion bottleneck

`[DOCUMENTED]` Instagram's clickable-link surfaces:
- **Bio links** — up to 5 links on a profile.
- **Story link sticker** — clickable, followers only in practice.
- **Feed captions and Reels captions are not clickable.** This has never changed.

There is no documented organic way to make a Reel caption clickable. Every install from a Reel is therefore a **3-hop funnel**: watch Reel → tap profile → tap bio link → App Store page → install. Each hop leaks.

`[ANECDOTAL]` The comment-keyword → DM automation pattern ("comment LINK and I'll send it") is the standard workaround, and practitioners claim it materially beats bio links because the link lands in the inbox without the user leaving Instagram. Reported figures such as "22–35% reply-to-registration vs 4–8% for link-in-bio sticker taps" come from vendor blogs selling DM automation (https://www.inro.social/blog/link-in-bio-dead-link-in-dm-comment-to-dm-automation) and should be treated as marketing claims, not benchmarks.

However, the mechanic has a **documented** second-order benefit: Metricool measured **comment-focused CTAs driving +202.78% more comments**, and comments are an engagement signal. So "comment X for the link" is a defensible tactic on the engagement axis even if you discount the conversion claims entirely.

**The number you must instrument.** In the one indie case with published end-to-end numbers (see `case-studies.md`), 182 App Store product-page impressions converted to 11 downloads — a **9% store conversion rate** — from ~2,000 short-video views. That implies roughly a 9% view→store-visit rate and a 9% store→install rate, i.e. **~0.5% view→install**. Plan your Reel volume against ~0.5%, not against a fantasy 5%.

---

## 10. What Instagram documents about suppression

`[DOCUMENTED]` Meta reduces distribution of content that doesn't break rules but is "problematic or low-quality... including low-quality content, such as clickbait and engagement bait."
Source: https://transparency.meta.com/enforcement/taking-action/lowering-distribution-of-problematic-content/

`[DOCUMENTED]` Instagram's **Account Status** tool tells professional accounts whether their content is currently eligible to be recommended to non-followers. Mosseri's position is that Instagram penalises some content but tells you about it — "this is not a 'shadowban' as many view it."
Sources: https://help.instagram.com/338481628002750 · https://www.socialmediatoday.com/news/instagram-chief-answers-creator-questions/744813/

**Operational rule:** Account Status is the ground truth. Before an agent diagnoses "the algorithm hates us," it should read Account Status. If recommendation eligibility is green and reach is still zero, the content is the problem.

---

## 11. Metric definitions changed — read your own dashboard correctly

`[DOCUMENTED]` Instagram made **Views** the primary metric across all formats (Reels, live, photos, carousels, Stories), replacing the "Accounts Reached" graph.
Source: https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/

`[DOCUMENTED]` Reels can be up to **3 minutes** and remain recommendation-eligible (US, from 21 January 2025; previously 90 seconds).
Source: https://creators.instagram.com/blog/the-latest-with-instagram

**Warning:** "Views" now counts plays including replays. A Reel with high replay (short loops) inflates Views without inflating unique humans reached. For install math, use **Accounts Reached** (still available in insights), not Views.

---

## 12. The distilled operating model

1. **Optimise for sends per reach.** Every Reel brief must have an explicit "who does the viewer send this to" answer. This is the unconnected-reach lever, per Mosseri directly.
2. **Hold to ≥8.5s average watch time.** That's platform par (Metricool). Below it you are being throttled at the test stage.
3. **Use Trial Reels as the A/B harness.** 3 hooks per demo, read at 24h, publish the winner. Free, documented, and non-followers-first.
4. **Never ship a watermarked or duplicated cut.** Documented disqualifier from recommendations.
5. **Post 5–8 times/week.** Buffer's 2.1M-post dataset shows reach-per-post +18% at 6–9/week vs 1–2/week, with explicitly diminishing returns above that (see `credibility.md` §4).
6. **Captions are SEO, not hashtag soup.** Five tags max, plain-language keywords, question or comment-CTA to buy comment volume.
7. **Instrument view→reach→profile-tap→link-tap→install.** Assume ~0.5% view→install until your own data says otherwise.
8. **Stories are for people who already follow you.** Zero acquisition value at low follower counts.

---

## Open questions I could not resolve from primary sources

- Meta has published **no** numeric weighting between watch time, likes and sends. Every multiplier you see online is invented.
- Meta has published **no** posting-frequency ceiling or documented "reach degradation" from posting too often. The Buffer data shows diminishing returns, not a cliff.
- The "40%/80% Trial Reels creator stats" widely attributed to Meta are not in the Meta announcement.
- Instagram publishes no organic install-attribution. You will need a link-shortener or an ASO tool to close the loop; Instagram will not tell you.
