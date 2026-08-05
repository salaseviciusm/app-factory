# Instagram: Who Is Actually There, and Which Apps Convert

**Research date:** 2026-08-05
**Companion doc:** `../youtube/audience.md` — read both before choosing where to spend.

---

## 1. Size and shape

| Fact | Figure | Source |
|---|---|---|
| Monthly active users | ~3 billion (late 2025) | https://www.businessofapps.com/data/instagram-statistics/ |
| Largest market | India, ~480 million users | https://www.statista.com/topics/1882/instagram/ |
| US users | 188.4 million (March 2026) | https://www.statista.com/statistics/398166/us-instagram-user-age-distribution/ |
| US gender split | 55.2% women | same |
| Global 25–34 | ~34% (April 2026) | https://www.statista.com/statistics/325587/instagram-global-age-group/ |
| Global 18–24 | 27.6% | same |
| Global 35–44 | 16.6% | same |
| Global gender | roughly 50/50; India >65% male | https://datareportal.com/essential-instagram-stats |

**The headline:** ~62% of Instagram's global audience is 18–34. It skews slightly female in the US and heavily male in India. If your app's addressable market is people over 45, Instagram is the wrong first platform — that cohort is under 20% of the base and is not the cohort Reels distribution favours.

---

## 2. Intent level: discovery, not demand

This is the defining property of Instagram and it should drive every decision.

**Instagram users are not looking for your app.** They are scrolling. Reels distribution is an interruption model: the algorithm decides you might like this, and you have ~1 second to justify the interruption. Instagram's own ranking signals (`algorithm.md` §1) are all *reaction* signals — did you watch, did you like, did you send. None of them are *intent* signals. There is no query.

Instagram Search exists and is keyword-ranked (https://help.instagram.com/1482378711987121), but search is a minority behaviour on Instagram in a way it simply is not on YouTube.

**What this means concretely:**

- You cannot capture existing demand on Instagram. You can only *create* it.
- The conversion funnel is long and leaky by design — captions aren't clickable, so it's watch → profile → bio link → store page → install (`algorithm.md` §9).
- Content that assumes the viewer already has the problem in mind will fail. Content that *shows them the problem* — visibly, in three seconds — works.
- **The best-performing app content on Instagram is not a demo. It is a demonstration of a pain point, with the app appearing as the resolution.** The screen recording is the punchline, not the premise.

---

## 3. Where the niches actually concentrate

Instagram's audience is organised around *aesthetic and lifestyle identity*, not around *problems*. That is the sorting principle. Communities that thrive here are ones where people perform an identity publicly.

**Strongly concentrated on Instagram:**

| Vertical | Why it lives here | App implication |
|---|---|---|
| Fitness & body composition | Visual progress is the content. Massive creator supply. | Workout trackers, calorie counters, body-scan apps. This is the single densest app-conversion vertical on IG — Cal AI, Umax and Hevy all live here (see `case-studies.md`). |
| Beauty, skincare, "looksmaxxing" | Before/after is natively visual and natively shareable. | Face/skin analysis apps, routine trackers. |
| Food & recipes | High save + send rates. | Meal planners, grocery/macro apps. |
| Aesthetic productivity & "that girl" routines | Home screens, planners, journals as identity display. | Habit trackers, journals, widget/customisation apps. Widgetsmith's 131M downloads came from exactly this trend. |
| Travel | Visual by construction. | Itinerary, flight, packing apps. |
| Parenting & home | Large 25–44 female cohort. | Chore, budget, family-logistics apps. |
| Small-business/creator tools | Creators are the users AND the content. | Scheduling, editing, invoicing apps aimed at creators. |
| Pets | Reliably high send rates. | Pet-health, training apps. |

**Weakly or not concentrated on Instagram:**

| Vertical | Why not |
|---|---|
| Developer tools / technical infrastructure | The audience exists but doesn't discover software here. They are on YouTube, GitHub, HN, X. |
| B2B SaaS | Buying committees don't scroll Reels for procurement. |
| Anything with a considered, researched purchase | No query surface. See `../youtube/audience.md`. |
| Enterprise, compliance, finance-professional tools | Wrong audience, wrong intent, and Meta's ad-adjacent policies make finance content awkward even organically. |
| Local services | Instagram's geo-discovery is weak compared to Search/Maps. |

---

## 4. App categories that convert on Instagram — with evidence

Based on the case studies in `case-studies.md`, the pattern that converts on Instagram has four properties:

1. **The value is legible in under 3 seconds without narration.** Photograph food → calories appear. Point camera at face → score appears. Tap → widget changes.
2. **The output is screenshot-worthy.** The app produces an artefact the user wants to show someone. This is what generates *sends*, the documented unconnected-reach lever.
3. **The purchase is impulse-priced.** Weekly/monthly subs at $3–8 (Adam Lyttle's portfolio prices at $4.99–7.99/week, ~$29.99/year — https://www.starterstory.com/adam-lyttle-apps-breakdown). Nobody researches a $5 app; they tap.
4. **The category already has creator supply.** You are not building an audience from nothing; you are entering an existing content ecosystem that already has viewers.

**Converts well:** AI camera/scanner apps, calorie & macro trackers, workout loggers, face/skin analysis, habit & streak trackers, widget/customisation, photo & video editing, journaling, budgeting-for-consumers, dating helpers, pet care, plant/animal identification.

**Converts poorly:** note-taking (the value is invisible in 3 seconds), developer tools, project management, anything requiring team adoption, anything with a trial-to-paid cycle longer than a week, anything where the "aha" needs explanation.

### The test

> **If a stranger cannot understand what your app does from a muted 5-second clip, and cannot imagine one specific person they'd send it to, Instagram is not your platform.**

Both halves matter. Legibility gets you watch time. The send-to-someone imagination gets you unconnected reach.

---

## 5. Follower value vs. reach value

`[DOCUMENTED]` Mosseri has spent two years arguing creators should stop optimising follower count and optimise reach and engagement *rate* instead (https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/, 26 May 2026).

`[DATASET]` Socialinsider's 35M-post study found audience growth rates across brand cohorts **fell from 22–38% (2024) to 11–22% (2025)** — roughly halving. Source: https://www.socialinsider.io/social-media-benchmarks/instagram

**Read for a bootstrapped studio:** don't build an Instagram follower base as a strategic asset. It is expensive to build, halving in growth rate year on year, and Instagram itself is telling you not to. Instagram is a **distribution rental**, not an owned audience. Use it to move strangers into something you own — an App Store install, an email address, a DM thread.

This is the opposite conclusion to YouTube, where the subscriber base genuinely compounds.

---

## 6. Multi-app portfolio implications

The App Factory runs several apps. Instagram's structure has a specific consequence:

- **One brand account per app, not one studio account.** Instagram's recommendation engine is topic-and-audience matched. A single account posting fitness content on Monday and a budgeting app on Tuesday will confuse the interest graph and reach neither audience well. The originality/aggregator rules (`algorithm.md` §3) also mean the account must be *the creator* of what it posts.
- **The exception is a founder-face account** (see `credibility.md` §3), which can legitimately span apps because the through-line is the person, not the category.
- **Cross-posting the same cut to two of your accounts is actively harmful.** Instagram documents that when it finds identical content it recommends only the original.

---

## 7. Where Instagram beats YouTube for us

1. **Speed to first signal.** Trial Reels give you a read on a hook in 24 hours. YouTube's Test & Compare takes two weeks.
2. **Zero-follower cold start is genuinely viable.** Instagram states creators of all sizes have an equal chance in Reels recommendations; the Reels feed is a stranger-first surface by construction.
3. **Density of impulse-purchase consumer categories.** Fitness, beauty, aesthetics — the categories where a $5/week subscription converts on emotion.
4. **Volume tolerance.** Buffer's data shows reach-per-post rising with cadence up to 10+/week; YouTube explicitly says cadence doesn't help. If the factory's advantage is agent throughput, Instagram is the platform that rewards throughput.

## 8. Where Instagram loses to YouTube for us

1. **No intent capture.** Nothing you post captures existing demand.
2. **No evergreen.** Reels decay in days; there is no equivalent of a search-ranked video that installs users for two years.
3. **No clickable link on the acquisition surface.** Structural friction that YouTube doesn't have (descriptions and pinned comments are clickable there).
4. **No swipe-away metric.** You are blind to how many people scrolled past.
5. **Weak attribution.** Instagram will not tell you which Reel produced an install.

---

## 9. The concrete call, per app category

| If the app targets... | Instagram? | Reasoning |
|---|---|---|
| Gym-goers, calorie tracking, body comp | **Yes, first platform** | Densest converting vertical; visual proof; impulse price; existing creator ecosystem. |
| Skincare/beauty/appearance | **Yes, first platform** | Before/after is the highest-send content format on the platform. |
| Habit tracking, journaling, aesthetic productivity | **Yes** | Identity-display category; strong 18–34 fit. Carousels carry the explanation. |
| Home-screen customisation, widgets, wallpapers | **Yes** | Proven — this is literally the Widgetsmith trend. |
| Photo/video editing tools for creators | **Yes** | The audience is the content. |
| Budgeting/personal finance (consumer) | **Cautiously** | Works with a lifestyle framing, not a spreadsheet framing. |
| Pet, plant, food identification (AI camera) | **Yes** | Point-and-reveal is the perfect 3-second format. |
| Note-taking, PKM, second brain | **No** | Value is invisible in 3 seconds. Go to YouTube. |
| Developer tools, CLI, APIs | **No** | Wrong audience entirely. YouTube. |
| B2B, team collaboration, project management | **No** | No buying intent on the surface. |
| Anything priced above ~$15/month | **No, not as the primary channel** | Considered purchase → needs a search surface. |
| Anything targeting 45+ | **No** | Under 20% of the base, and not where Reels distribution concentrates. |

---

## Open questions

- Instagram publishes no organic install attribution. Every conversion number in this doc is inferred, not measured by Meta.
- Category-level engagement benchmarks by app vertical do not exist in any dataset I could verify; the vertical rankings above are inferred from case studies and creator-supply observation, not from a published study.
