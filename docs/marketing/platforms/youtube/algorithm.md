# YouTube: How Distribution Actually Works (as of August 2026)

**Research date:** 2026-08-05
**Scope:** Shorts feed, long-form (browse/suggested/search), the Shorts→long funnel, thumbnails/titles, comments and subscriber signals, monetisation thresholds.

**Labelling convention:**
- `[DOCUMENTED]` — YouTube Help, YouTube Blog, or an on-record YouTube/Google statement.
- `[DATASET]` — third-party study with stated methodology.
- `[ANECDOTAL]` — practitioner claim or single-source report.

YouTube documents its ranking system far more explicitly than Instagram does. Almost everything below §1–§7 is a direct quote from Google's own help pages. That is a real advantage: **you can plan against YouTube's stated mechanics with much higher confidence than Instagram's.**

---

## 1. Shorts: the feed is a swipe-rate machine

`[DOCUMENTED]` YouTube's Shorts search & discovery page states the ranking inputs verbatim:

> "Our systems use the signals for **% of viewers who chose to view, avg. view duration and avg. % viewed** to inform ranking."

and separately measures enjoyment via **"likes and post-watch survey results."** When a Short is recommended, YouTube looks at whether viewers "choose to watch it, ignore it, or click 'not interested'."

Source: https://support.google.com/youtube/answer/11914225?hl=en&co=YOUTUBE._YTVideoType%3Dshorts

`[DOCUMENTED]` The corresponding creator-facing metrics exist in Studio Analytics:
- **"Shown in feed"** — how many times your Short appeared in the Shorts feed.
- **"Viewed (vs swiped away)"** — the percentage of those impressions where the viewer stayed rather than swiped.

Source: https://support.google.com/youtube/answer/12942217?hl=en&co=YOUTUBE._YTVideoType%3Dshorts

**This is the single most useful number on either platform.** Instagram gives you no equivalent — you cannot see how many people scrolled past your Reel. YouTube tells you directly. For an app studio, "Viewed vs swiped away" is the hook-quality scoreboard: it isolates the first ~1 second of the edit from everything else.

`[DOCUMENTED]` Shorts personalisation additionally uses "Shorts or channels the viewer has enjoyed in the past," "topics or themes a viewer watches," and "trending songs or sampled audio they might have engaged with."

`[DOCUMENTED]` Shorts appear across five surfaces: the **Shorts tab** (performance-based), **Home** (personalised), **Subscriptions** (chronological), **Search**, and the **Trends page** (ranked by popularity).

---

## 2. Shorts cannot hurt you — YouTube says so explicitly

`[DOCUMENTED]`

> "**Shorts performance doesn't negatively impact long form Video recommendations. Shorts can help with audience discovery but can't hurt your Video performance.**"

Source: https://support.google.com/youtube/answer/11914225?hl=en&co=YOUTUBE._YTVideoType%3Dshorts

This kills the most common objection to a Shorts-first strategy on a channel that also wants long-form. There is no documented downside to shipping Shorts daily on the same channel as your product deep-dives. This is a materially different risk profile from Instagram, where posting volume and reach interact in undocumented ways.

---

## 3. Long-form: CTR × AVD × satisfaction

`[DOCUMENTED]` The long-form variant of the same help page describes the identical signal family — click behaviour ("do they choose to watch it, ignore it, or click 'not interested'?"), **"avg. view duration and avg. % viewed as signals to inform ranking,"** and **"likes and post-watch survey results."** The system also weighs "a viewer's watch history, a video's performance & engagement metrics, and external factors" (topic interest, competition, seasonality).

YouTube's own summary advice: **"Focus on what your audience likes. If you do that and people watch, the recommendations will follow."**

Source: https://support.google.com/youtube/answer/11914225?hl=en&co=YOUTUBE._YTVideoType%3Dvideo

`[DOCUMENTED]` On absolute vs relative watch time:

> "Broadly speaking, **relative watch time is more important for short videos and absolute watch time is more important for longer videos**."

Source: https://support.google.com/youtube/answer/141805

**Read:** a 6-minute product walkthrough that holds 55% AVP (≈3:20 absolute) will out-rank a 20-minute one that holds 20% (4:00 absolute) only if the audience-satisfaction signals agree. For a studio, 5–10 minutes is the sweet spot: long enough for absolute watch time to accumulate, short enough that a screen-recording-derived edit can sustain retention.

---

## 4. CTR: the only published benchmark

`[DOCUMENTED]`

> "**Half of all channels and videos on YouTube have an impressions CTR that can range between 2% and 10%.**"

New videos, channels less than a week old, or videos with fewer than 100 views "can see an even wider range."

`[DOCUMENTED]` Impressions are counted when your thumbnail appears on: **Home, "Up Next" on watch pages, Search results, Subscriptions feed, and Channel pages.** External-website impressions **do not count**. YouTube also cautions: **"Avoid checking your click-through-rate immediately after uploading."**

Source: https://support.google.com/youtube/answer/7628154?hl=en

**Read:** 2–10% is the middle 50%. If a product video is under 2% CTR, the thumbnail/title is failing, not the algorithm. If it's above 10% with poor AVD, you have a clickbait problem and YouTube's satisfaction signals will strangle it.

---

## 5. Thumbnails and titles: you can A/B test them, natively and free

`[DOCUMENTED]` YouTube's Test & Compare lets creators test up to **three** title/thumbnail variants. The test runs to a sample of viewers over roughly **two weeks**, and **the winner is chosen by which variant produces the most watch time** — not the highest CTR.

Sources: https://support.google.com/youtube/answer/13861714?hl=en · https://support.google.com/youtube/answer/16391400?hl=en-GB

`[DOCUMENTED]` YouTube reported the thumbnail A/B feature had been used **over 15 million times since its 2023 launch**, and expanded title testing to all creators with Advanced Features access.
Sources: https://blog.youtube/news-and-events/youtube-studio-made-on-youtube-2025/ · https://www.socialmediatoday.com/news/youtube-expands-access-to-title-ab-testing-adds-c-span-to-youtube-tv/807236/

**This is the direct analogue of Instagram's Trial Reels, and it is better** — it optimises for watch time rather than views, and it runs on published videos rather than hidden ones. An agent pipeline should generate 3 thumbnail concepts per long-form upload as standard.

**Important:** the winner is decided by *watch time*, which means a lower-CTR thumbnail that attracts the right viewer can and does win. Don't override the test with your CTR intuition.

---

## 6. Upload frequency: YouTube says it doesn't matter

`[DOCUMENTED]` From the official performance FAQ, unambiguously:

> "**No, we've done analyses over the years and found that growth in views across uploads is not correlated with time between uploads.**"

> "Many creators have established reliable connections with their audience through quality over quantity."

The same page states tags are **"Not important"** for ranking, that channel location settings don't influence recommendations, that taking breaks doesn't harm growth, and that subscriber count "doesn't represent the number of viewers who watch your videos."

It also lists the real causes of view declines: audience watching other channels more, audience spending less time on YouTube, "you had a few high-performing videos, or a video went 'viral' but those viewers didn't return," **"uploading less frequently than usual,"** and topic decline.

Source: https://support.google.com/youtube/answer/141805?hl=en

**Note the internal tension:** YouTube says cadence isn't correlated with growth, then lists "uploading less frequently than usual" as a cause of view decline. The reconciliation is that *consistency relative to your own baseline* matters for audience habit; *absolute cadence* doesn't buy algorithmic favour. For a studio: pick a cadence you can hold for 6 months and hold it. Don't burst.

**This is the sharpest contrast with Instagram.** Buffer's Instagram data shows measurable reach gains from posting more (§4 of `../instagram/algorithm.md`). YouTube explicitly denies a frequency effect. Same content budget, opposite optimisation.

---

## 7. The first 24 hours

`[ANECDOTAL]` YouTube publishes **nothing** confirming a special 24-hour or 48-hour window. The performance FAQ actively discourages early CTR reads. The "first 24 hours decides everything" belief is creator folklore, and is contradicted by the two-week window YouTube uses for its own Test & Compare experiments.

`[DOCUMENTED]` What *is* true: the recommendation system learns from how each video performs when recommended, and a video's ranking is per-video, not per-channel — "how viewers reply to each video when it's recommended to them" (source as §6). There is no documented penalty carried forward from an underperforming video.

**Read:** do not build a launch process around a 24-hour panic window. Build one around a two-week thumbnail test and a 28-day performance read. YouTube's long tail is real and is the opposite of Instagram's, where reach plateaus within days (`[ANECDOTAL]`, reported by creators comparing platforms: https://www.emarketer.com/content/creator-spotlight-jane-ko).

---

## 8. The Shorts → long-form funnel

`[DOCUMENTED]` YouTube Studio provides an **audience-overlap report showing "the breakdown and overlap of viewers consuming content by format (videos, Shorts, and live)."** This exists precisely because the funnel is not automatic and creators need to measure it.
Source: https://support.google.com/youtube/answer/12220281

`[DOCUMENTED]` YouTube's stated position is that creators uploading both Shorts and long-form see better overall watch time and subscriber growth than long-form-only creators.
Source: https://www.socialmediatoday.com/news/youtube-reports-that-15-billion-users-now-engage-with-youtube-shorts-conte/625587/

`[DOCUMENTED]` Scale of the Shorts surface: Neal Mohan's 2026 CEO letter reports **200 billion daily Shorts views**.
Source: https://blog.youtube/inside-youtube/the-future-of-youtube-2026/

`[ANECDOTAL]` The widely-quoted conversion figures — "Shorts get 10× more views but 5× lower subscriber conversion," "channels using both grow 41% faster," "70/30 Shorts/long split is optimal" — come from SEO content farms with no published methodology (e.g. https://miraflow.ai/blog/youtube-shorts-vs-long-form-which-grows-channel-faster-2026). **Do not plan against these numbers.** The structural claim (Shorts discover, long-form converts) is sound and matches YouTube's own framing; the multipliers are invented.

**What to actually do:** treat the funnel as something you must *build*, not something you receive. The documented mechanics available to you:
- Link a Short to a related long-form video (the "related video" attachment on Shorts).
- Pin a comment on the Short pointing to the long-form.
- Use the audience-overlap report to measure whether it's working, monthly.

---

## 9. Monetisation thresholds (2026)

`[DOCUMENTED]` YPP is two-tiered. Source: https://support.google.com/youtube/answer/72851?hl=en

**Tier 1 — fan funding, Super Thanks, channel memberships, shopping:**
- 500 subscribers, **and** 3 valid public uploads in the last 90 days, **and** either **3,000 public watch hours** (12 months) **or 3 million public Shorts views** (90 days).

**Tier 2 — ad revenue sharing:**
- 1,000 subscribers, **and** either **4,000 public watch hours** (12 months) **or 10 million public Shorts views** (90 days).

All tiers additionally require: no active Community Guidelines strikes, 2-Step Verification on, a linked AdSense account, and compliance with channel monetization policies.

`[DOCUMENTED]` **"Any public watch hours from Shorts views in the Shorts Feed don't count towards the 4,000 public watch hours threshold."** Shorts and long-form run on separate ladders.

`[DOCUMENTED]` **View counting changed on 31 March 2025.** Shorts "views" now count every time a Short *starts to play or replay*, with no minimum watch time — aligning with TikTok and Reels. The old metric survives as **"engaged views"** in Analytics Advanced Mode. Critically: **YPP eligibility and earnings are still based on engaged views, not the new inflated view count.**
Sources: https://techcrunch.com/2025/03/26/youtube-is-changing-how-youtube-shorts-views-are-counted/ · https://support.google.com/youtube/thread/333869549

**Read this carefully before anyone celebrates a Shorts number.** Your public Shorts view count is now a vanity metric by design. The 3M/10M thresholds are measured in *engaged* views.

### Revenue reality

`[ANECDOTAL]` Third-party RPM estimates put Shorts at roughly **$0.07–$0.20 per 1,000 views**, i.e. **3–14% of long-form RPM** for most niches, driven by the pooled Shorts ad-revenue model and the lower creator revenue share on Shorts. Sources: https://air.io/en/air-data-findings/youtube-shorts-rpm-vs-long-form-how-much-do-shorts-earn-in-2026 (claims 274 channels; methodology not retrievable), https://mediacube.io/en-US/blog/youtube-shorts-rpm. I could not verify the revenue-share percentages against a primary YouTube page in this research pass.

**For the App Factory this is mostly irrelevant.** We are not monetising the channel; we are acquiring app users. But it matters for one reason: **YPP is a credibility badge and unlocks features (Community posts at low sub counts, memberships).** Hitting Tier 1 via 3M Shorts engaged views is a realistic 6–12 month goal for a studio shipping daily Shorts; hitting Tier 2 is not, and shouldn't be a target.

---

## 10. Comments and subscribers: what they actually do

`[DOCUMENTED]` Comments are **not** in YouTube's stated ranking-signal list for either Shorts or long-form. The listed engagement signals are likes and post-watch survey results. Subscriber count is explicitly de-emphasised: "The count doesn't represent the number of viewers who watch your videos."
Source: https://support.google.com/youtube/answer/141805?hl=en

`[DOCUMENTED]` Likes/dislikes are "some of the hundreds of signals" considered.

**Read:** comments are valuable to *you* (support signal, feature requests, objection discovery, social proof for the next visitor) but there is no documented ranking payoff. Don't run comment-bait tactics on YouTube the way you would on Instagram — Instagram's data shows comment CTAs +202% comments and comments feed engagement rate; YouTube's stated model doesn't reward it the same way.

Subscribers matter for *distribution to a warm base* (Home + Subs feed impressions), not as a ranking multiplier. For an app studio, subscribers are a proxy for "people who will watch the next demo," which is exactly the retention asset Instagram struggles to build.

---

## 11. Search: the high-intent surface Instagram doesn't have

`[DOCUMENTED]` Search is one of the named Shorts surfaces and a core long-form surface. YouTube.com is the **second most-visited site on the web** with an estimated **2.85 billion unique visitors** and **53.12 billion monthly visits** (Statista, 2026).
Sources: https://www.statista.com/statistics/1201880/most-visited-websites-worldwide/ · https://www.statista.com/statistics/1201889/most-visited-websites-worldwide-unique-visits/

This is the structural difference between the two platforms and the reason `audience.md` recommends YouTube for anything with a "how do I..." shaped demand.

A search-optimised long-form video — "how to track macros without weighing food," "best free Notion alternative for Mac" — is an evergreen install asset. Instagram has no equivalent: its search is keyword-matched against captions but is a minority behaviour, and its content decays in days.

---

## 12. The AI-slop trap (also see `credibility.md`)

`[DOCUMENTED]` YouTube renamed its "repetitious content" policy to **"inauthentic content"** on 15 July 2025, and on 16 July 2026 clarified three demonetisable categories:
1. **Generic, repetitive, or template-based content** — "easily made with AI, CGI, or templates with minimal variation," including tutorials reproducing already-prevalent content.
2. **Off-putting or distressing content** designed to manipulate emotions for views.
3. **AI personas discussing sensitive topics** (finance, legal, healthcare, medical).

Channels with excessive amounts of any category lose YPP eligibility. **"High-quality content enhanced by AI that demonstrates creativity and originality" remains monetizable**, as do original tutorials.

Sources: https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/ · https://support.google.com/youtube/answer/1311392?hl=en · https://techcrunch.com/2025/07/09/youtube-prepares-crackdown-on-mass-produced-and-repetitive-videos-as-concern-over-ai-slop-grows/

**Direct risk to the App Factory model.** An agent pipeline that produces 30 near-identical "here's a feature of our app" Shorts from one template is squarely inside category 1. The defence is founder-supplied original footage plus genuine variation in framing/narrative — not a change to the tooling.

---

## 13. The distilled operating model

1. **Optimise Shorts for "Viewed (vs swiped away)."** It is the only true hook-quality metric either platform gives you. Read it per-Short.
2. **Optimise long-form for CTR × AVD.** 2–10% CTR is the middle 50%; below 2% is a thumbnail failure.
3. **Always run Test & Compare** on long-form uploads: 3 thumbnails, 2 weeks, and accept the watch-time winner.
4. **Ship Shorts freely — YouTube documents that they cannot hurt long-form.**
5. **Don't chase cadence.** YouTube states upload frequency isn't correlated with view growth. Consistency relative to your own baseline is the only cadence rule.
6. **Build the Shorts→long bridge manually** (related-video attachment + pinned comment) and measure it in the audience-overlap report.
7. **Make search-intent long-form the evergreen install engine.** "How do I..." videos compound; Shorts don't.
8. **Read engaged views, not views.** Public Shorts views have been inflated by design since 31 March 2025.
9. **Vary genuinely.** Templated output is a documented demonetisation and de-recommendation category as of July 2026.

---

## Open questions I could not resolve from primary sources

- YouTube publishes no weighting between CTR, AVD and satisfaction signals.
- No official first-24-hour mechanic exists; every claim about one is folklore.
- Official Shorts→long-form conversion rates have never been published. Studio's audience-overlap report is the only trustworthy source, and it's per-channel.
- Shorts/long-form revenue-share percentages (commonly cited as 45%/55%) were not verified against a primary Google page in this pass.
