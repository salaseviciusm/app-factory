# Community Platforms — Case Studies

**Compiled:** 2026-08-05. Companion to [`algorithm.md`](./algorithm.md) and [`audience.md`](./audience.md).

Ten cases. **Seven are bootstrapped/indie** (the brief asked for a minimum of four). **Four are failures**, plus two more that are successes with a hard ending. Every case links the actual thread or post where one exists, gives numbers with a source, and states where the product is now as of the compile date.

Where a number could not be traced to a first-party source it is marked **[unverified]** and not used to support a conclusion.

---

## Index

| # | Product | Platform | Type | Outcome |
|---|---|---|---|---|
| 1 | ScrollGuard | Hacker News | Indie, solo, consumer mobile | ✅ 690 pts → 200K+ downloads |
| 2 | Plausible Analytics | Hacker News | Bootstrapped, 2 founders | ✅ 462 pts → $3.1M ARR |
| 3 | Alien Blue | Reddit | Indie, solo, consumer mobile | ✅ Acquired by Reddit |
| 4 | EntryLevel.io | Show HN | Indie | ✅ #1 on 3rd attempt |
| 5 | GummySearch | Reddit | Bootstrapped, solo | ⚠️ Profitable → shut down by platform |
| 6 | Apollo for Reddit | Reddit | Indie, solo, consumer mobile | ⚠️ ~1.5M MAU → killed by platform |
| 7 | Beep | Product Hunt | Indie | ❌ #1 Product of the Day, ~1k visitors |
| 8 | MailTest | Product Hunt | Indie, solo | ❌ #83, 1 upvote |
| 9 | ClearNoteLab | Show HN | Indie, solo | ❌ 1 point, 0 signups |
| 10 | ScrollGuard relaunches | Show HN | Indie, solo | ❌ 1 pt and 4 pts for a proven product |

---

## 1. ScrollGuard — the one consumer mobile app that actually worked on Hacker News

**Bootstrapped, solo (Adrian Hacar). Consumer mobile app, iOS + Android.**

This is the most instructive case in the entire document because the same developer launched the same product four times with radically different results — a natural experiment in framing.

| Date | Title | Points | Link |
|---|---|---|---|
| 2024-03-05 | *Show HN: ScrollGuard – An app to prevent mindless social media scrolling* | **4** | [39602878](https://news.ycombinator.com/item?id=39602878) |
| 2025-08-16 | *Show HN: I built an app to block Shorts and Reels* | **690** | [44923520](https://news.ycombinator.com/item?id=44923520) |
| 2026-02-11 | *Show HN: I created an app to remove Reels, now on iOS too* | **1** | [46974817](https://news.ycombinator.com/item?id=46974817) |
| 2026-02-19 | *Show HN: I created an app to remove Reels, now on iOS too* | **4** | [47073676](https://news.ycombinator.com/item?id=47073676) |

*(Points and dates retrieved from the HN Search API, 2026-08-05. Between 2025-08-18 and 2025-08-19 there were five further duplicate submissions of the winning title by the same author, all with no score — evidence that repetition does not compound.)*

**What he posted (the 690-point version).** A Show HN linking `scrollguard.app` — the product's own site, not an App Store page — with a first-person body text opening:

> *"I wanted to find a way to use Instagram without ending up scrolling for two hours every time I open the app to see a friend's story. Most screen time apps I found focus on blocking the app itself instead of the addictive feed, so I created this app to allow me to keep using the 'healthy' and 'social' features and block the infinite scrolling (Reels). After implementing the block on Instagram Reels, I got addicted to YouTube Shorts and Reddit feed. So, I extended the app to cover these as well."*

**Why the framing worked:**

1. **The title names the problem, not the product.** "ScrollGuard – An app to prevent mindless social media scrolling" (4 pts) is a product announcement. "I built an app to block Shorts and Reels" (690 pts) is a person describing a thing they made. HN-wide data confirms this: "Show HN: I built/made…" titles hit ≥30 points at 4.77 % vs 4.19 % for everything else (see [`algorithm.md` §2.3](./algorithm.md)).
2. **The 2024 attempt linked a Google Play Store URL.** The 2025 attempt linked a web page. HN's own Show HN guidance asks you to make the thing easy to try; a store listing is a barrier and reads as marketing.
3. **The subject is an HN cultural obsession.** Algorithmic-feed addiction, attention capture, "keep the social, kill the slot machine" — this is the one consumer-app topic HN has a standing appetite for.
4. **He answered every objection in the thread**, including the hardest one — *"I just can't authorize an app to have full control on my phone if it's not open-source"* — rather than defending.

**CTA:** none in the post. The link *was* the CTA; the app is free to download with optional paid features.

**Where are they now (2026-08-05):** live and growing. `scrollguard.app` reports **200,000+ downloads** and displays "689+ upvotes on Hacker News" as social proof on its own landing page. Still iOS + Android, still free-with-premium, still solo.

**Diagnosis:** a single well-framed Show HN turned a dormant 2024 product into a 200K-download business. It is also proof that this is a *one-shot* channel — the 2026 relaunches of the same working product scored 1 and 4 points. HN gives you exactly one front page per product, and only if you frame it as a story rather than an announcement.

---

## 2. Plausible Analytics — content on Hacker News, not a launch

**Bootstrapped (Uku Täht + Marko Šarić), no investors, open source.**

**What they posted:** not a Show HN. A blog post — *"An alternative to using Google Analytics on your website"* — submitted 2020-04-08. **462 points, 301 comments.** [Thread 22813168](https://news.ycombinator.com/item?id=22813168), linking [plausible.io/blog/remove-google-analytics](https://plausible.io/blog/remove-google-analytics).

**The framing that worked:** an argument, not a product. The post made the case for removing Google Analytics — a position HN already held — and mentioned the product as the obvious consequence. It gave the community a flag to plant rather than a thing to buy.

**Numbers, all first-party** from [plausible.io/blog/open-source-saas](https://plausible.io/blog/open-source-saas):

| Date | Milestone |
|---|---|
| May 2019 | $64 MRR, 60 active beta users |
| Jul 2019 | $118 MRR; "2,500 visitors in one day" from first traffic spike |
| Sep 2019 | $178 MRR (open-source launch) |
| Feb 2020 | $403 MRR |
| **Apr 2020** | **"more than 25,000 people visited our site"** — the 462-point HN post |
| May 2020 | **"94 trial signups on May 2nd, which is still our best day"** |
| Jul 2020 | "more than 35,000 visitors in a single day" |
| Sep 2020 | $5,035 MRR — first salaries paid |
| Jan 2021 | $11,303 MRR |
| Oct 2021 | $42,624 MRR ($500K ARR) |
| Jun 2022 | $83,637 MRR ($1M ARR) |

**Their Product Hunt launch, for contrast, produced "more than 1,000 visitors and 15 trial signups."** Same company, same week-scale effort, 25× less traffic than one HN post.

**CTA:** a link to the product at the end of an argument. No signup wall — Plausible offered a free trial with no credit card.

**Where are they now (2026-08-05):** still bootstrapped, no VC. Publicly reported **$3.1M ARR as of late 2024**, 14,000+ paying subscribers, 60,000+ websites; small remote team on a four-day week. ([Tiny Empires profile](https://tinyempires.substack.com/p/inside-a-tiny-empire-plausible-analytics), [Founder Ventures](https://founderventures.io/companies/plausible))

**Diagnosis:** the highest-leverage HN play is not launching, it is **publishing a position the community already believes, better than anyone else has**, and being the product that embodies it. It took 324 days to get to $400 MRR before this worked. The HN spike was an accelerant on an existing thesis, not a starting gun.

---

## 3. Alien Blue — pure Reddit, from subreddit posts to acquisition

**Indie, solo (Jason "Jase" Morrissey, Melbourne). Consumer mobile app.**

**What he posted:** launch announcements in relevant subreddits, principally **r/technology and r/iphone**, for a third-party Reddit client. Launched 2010-05-29 (iPhone/iPod Touch), iPad version 2010-09-15. ([Wikipedia](https://en.wikipedia.org/wiki/Alien_Blue))

**The framing that worked:** the audience *was* the subreddit. He was not marketing to Redditors — he was building the thing Redditors used to read Reddit, and telling them about it where they were. Distribution and product were the same act.

**Where are they now:** **acquired by Reddit on 2014-10-15** for an undisclosed sum; Morrissey was hired by Reddit and kept working from Australia. Alien Blue became Reddit's official iOS app, then was phased out for a rewritten client on 2016-04-07. Final release 2015-12-20.

**Diagnosis:** the only reliable way to promote in a big general subreddit is to build the thing that subreddit is *about*. This is not replicable at multi-app-studio scale — you cannot be native to twenty communities — but it defines the ceiling: when product and community are the same, Reddit is the single best distribution channel that exists for an indie developer. Note also the ending: building on someone else's community is building on their platform. See cases 5 and 6.

---

## 4. EntryLevel.io — #1 on Show HN, on the third attempt

**Indie.**

**What they posted:** *"Show HN: I made a site that aggregates entry-level positions"* — [thread 22691295](https://news.ycombinator.com/item?id=22691295), 2020-03-26, **270 points**. Reached #1 on the front page.

**Mechanics, per the founder's own write-up** ([Indie Hackers](https://www.indiehackers.com/product/entrylevel-io/10k-users-from-1-on-the-front-page-of-hacker-news--M3l9FFqAQo4O1oVwUDz)):

- **This was their third Show HN submission.** The first two did not land.
- Submitted at **12:01 AM PST**, deliberately, to get a full 24-hour window on the front page.
- Peak traffic 12 AM – 6 AM PST.
- Replied actively to every comment.
- Cross-posted to Makerlog, Reddit, LinkedIn, Twitter and Facebook groups after the fact — not before.

**CTA:** email capture, straight into a Postgres table. The headline claim is "10k users."

**Caveat:** the write-up gives the 10k figure but **does not break out visitors, conversion rate, or retention** — and the product's later trajectory is not documented in the source. Treat "10k users" as a first-party claim with no supporting funnel data. **[partially unverified]**

**Diagnosis:** two things generalise. **Persistence across attempts is normal** — three submissions to get one hit, matching the ~4 % base rate. And **the timing tactic is real but second-order**: 12:01 AM PST = 07:00–08:00 UTC, which our full-year dataset shows is actually the *worst* hour by hit rate (2.00 %). It worked here because the goal was a long front-page dwell, not initial velocity. Do not cargo-cult the clock; the third-attempt persistence mattered more.

---

## 5. GummySearch — built on Reddit, profitable, then shut down by Reddit ⚠️

**Bootstrapped, solo (Fed, [@foliofed](https://x.com/foliofed)). Zero funding.**

**What it was:** an audience-research tool for Reddit, launched 2021. **The growth channel was the product's own subject matter** — the founder acquired users by dogfooding in founder subreddits and publishing what he found.

**Numbers** ([Startup Obituary](https://startupobituary.com/p/gummysearch), [Indie Hackers](https://www.indiehackers.com/post/bootstrap-saas-to-100k-audience-research-tool-for-reddit-b1a07a4897)):

- **135,000+ registered users**, **10,000+ paying customers over its lifetime**
- **~$96K revenue in 2023**; ~$3K MRR at the ~2-year mark; **$35K MRR at peak** [unverified — reported in the obituary, not first-party]
- Always profitable, never funded
- Acquisition path, in the founder's words: first 10 users from validation interviews → **next 100 from Reddit** → next ~900 from building in public on Twitter *"and continuing to leverage Reddit communities"*

**Where are they now:** **closed.** `gummysearch.com` today displays: *"GummySearch is closed as of 11/30/2025."* (Verified directly, 2026-08-05.) Shutdown announced 2025-11-06. Cause: Reddit's API pricing and Data API usage policy, which the founder could not reach an agreement under.

**Diagnosis:** two lessons, pulling in opposite directions.

- **The positive one:** "be genuinely useful in public, in the exact community your product serves" produced 135K users and a profitable business with zero ad spend. This is the Reddit organic playbook working at its best.
- **The fatal one:** the business depended on Reddit's *API*, not just Reddit's *attention*. A profitable, well-run, well-liked bootstrapped company was ended by a pricing decision it had no input into. **For the App Factory: use Reddit as a channel, never as a dependency.** Do not build a product whose core function requires a platform's API on terms you don't control.

---

## 6. Apollo for Reddit — the largest indie Reddit success, deleted ⚠️

**Indie, solo (Christian Selig). Consumer mobile app.**

**What it was:** the leading third-party iOS Reddit client, grown almost entirely through the Reddit community itself — feature requests and feedback collected in **r/ApolloApp**, with the userbase acting as both product team and marketing channel.

**Numbers:**

- **~1.3–1.5M monthly active users**, **~900K daily active users**, **~5M lifetime installs** by 2023
- **100,000+ five-star ratings**
- ~50,000 subscribers at ~$10/yr ≈ $500K/yr [unverified — a widely-cited estimate; Selig declined to confirm specifics and stated that even keeping only paying subscribers he would be "in the red every month" under the new API pricing]
- Reddit's proposed API pricing — **$0.24 per 1,000 requests** — would have cost roughly **$20M/year**

Sources: [RevenueCat Sub Club interview with Christian Selig](https://www.revenuecat.com/blog/growth/christian-selig-apollo-sub-club-podcast/), [TechCrunch 2023-05-31](https://techcrunch.com/2023/05/31/popular-reddit-app-apollo-may-go-out-of-business-over-reddits-new-unaffordable-api-pricing/), [TechCrunch 2023-06-08](https://techcrunch.com/2023/06/08/popular-third-party-reddit-app-apollo-is-shutting-down-as-a-result-of-reddits-new-api-pricing/), [Wikipedia](https://en.wikipedia.org/wiki/Apollo_(app)).

**Where are they now:** **shut down 2023-06-30.** Selig has since shipped smaller independent apps.

**Diagnosis:** the strongest possible demonstration that a community can be a complete go-to-market — and the strongest possible warning about which side of the platform you build on. Apollo and GummySearch died of the same cause two years apart. Any App Factory product that reads, writes, or resells another platform's data is one pricing memo from zero, regardless of how loved it is.

---

## 7. Beep — #1 Product of the Day, beaten by a 30-minute Reddit post ❌

**Indie.**

**What happened** ([first-party write-up on Indie Hackers](https://www.indiehackers.com/post/a-30-minute-reddit-post-brought-more-traffic-than-a-product-hunt-launch-we-prepared-for-3-weeks-15bff6d42e)):

| | Effort | Result |
|---|---|---|
| Product Hunt launch (Beep — "add comments anywhere on the web") | **3 weeks of preparation** | **#1 Product of the Day** → *"a bit over 1k site visitors"* |
| Reddit post in r/SaaS and r/sideprojects about *how they won Product Hunt* | **30 minutes** | **1.2k site visitors** |

The founder did not track conversion separately but believed the rates were "close." His conclusion: *"stories about success bring more traffic"* than the launch itself, and PH effort should be reconsidered if traffic is the goal.

**Diagnosis:** this is the cleanest available answer to "does a Product Hunt #1 finish produce anything?" **A #1 finish is worth roughly 1,000 web visitors.** That is the ceiling of the channel, from a first-party account by someone who actually won it. Three weeks of preparation for 1,000 visitors is a catastrophic hourly rate for a studio shipping multiple apps.

The secondary lesson is more useful: **the meta-content outperformed the artifact.** A post about *what you learned doing the thing* beat the thing. This is the reliable Reddit/IH pattern and it costs 30 minutes.

---

## 8. MailTest — Product Hunt with no audience: #83 and one upvote ❌

**Indie, solo. Bootstrapped, built over 3 months between freelance work.**

**What happened** ([first-party post-mortem, Indie Hackers](https://www.indiehackers.com/post/i-launched-on-product-hunt-today-with-0-followers-0-network-and-0-users-heres-what-i-learned-in-12-hours-1c89889702)):

- **Rank #83.** **1 upvote — his own.** **0 paying users.** Single-digit Twitter following.
- Friends' upvotes were **suppressed by spam filtering** for same-IP patterns.
- His simultaneous Reddit post was **removed because the account was new**.
- The post-mortem he wrote about it got **700+ views** — more engagement than the launch.

**His own diagnosis, verbatim:** *"No network = no launch day traction. PH rewards existing audiences."* And: *"The launch isn't the moment you start building distribution. It's the deadline that reveals whether you already did."*

**Diagnosis:** three separate failure modes in one day, all avoidable, all common:

1. **Launching without an audience.** Product Hunt does not distribute; it amplifies distribution you already have. A cold launch is a coin flip weighted against you.
2. **Recruiting upvotes from a shared network.** It is against the rules, it is detected, and the detection is silent — you don't lose the votes visibly, they just never count.
3. **Posting to Reddit from a new account.** AutoModerator karma/age gates removed it before a human saw it. This is the single most common way founders "fail on Reddit" without ever having been read.

---

## 9. ClearNoteLab — Show HN, one point, zero signups ❌

**Indie, solo. Built in 9 days for $200.**

**What happened** ([first-party post-mortem, Indie Hackers](https://www.indiehackers.com/post/i-built-a-saas-in-9-days-for-200-launched-on-hn-to-zero-signups-heres-what-actually-happened-87c39638c6)):

- Show HN posted **Monday 2025-12-22, 7 AM Eastern (12:00 UTC)**.
- After four hours: **1 point (self-upvote), 0 comments, #28 on the Show HN page, 0 signups.**
- Product: an AI tool converting meeting notes into client-ready PDFs. Built with Bolt AI + React + Supabase + Stripe.

**Founder's diagnosis:** holiday timing (three days before Christmas); a landing page he scored 4/10 on trust signals — *"No testimonials. No customer logos. No case studies"*; and **"0 followers on Twitter, 0 email subscribers, 2 blog posts total. No existing audience anywhere."**

**Our additional diagnosis:**

- **1 point is the modal Show HN outcome, not an anomaly.** The median Show HN score over the last 12 months is **2 points**, and 34 % never get a second vote (n = 43,453 — see [`algorithm.md` §2.3](./algorithm.md)). This launch performed slightly below a coin-flip-normal result. The founder attributed to Christmas what is mostly just the base rate.
- **It was an AI wrapper posted to an AI-fatigued audience.** AI-titled Show HNs hit ≥30 points at 2.89 % vs 4.86 % for everything else.
- **It violated the Show HN brief.** Show HN is for *"something you've made that other people can play with"* without *"barriers such as signups or emails."* A Stripe-gated SaaS with a signup wall is the format HN explicitly deprioritises.
- **9 days of building bought 0 days of distribution.** As with MailTest: the launch measures the audience you had before you launched.

---

## 10. ScrollGuard's relaunches — a proven product, 1 point ❌

**Same developer, same app, same platform, as case 1.**

After 690 points and 200K downloads, Adrian Hacar returned to Show HN in February 2026 with the iOS release:

- 2026-02-11: *"Show HN: I created an app to remove Reels, now on iOS too"* → **1 point** ([46974817](https://news.ycombinator.com/item?id=46974817))
- 2026-02-19: identical title, resubmitted → **4 points** ([47073676](https://news.ycombinator.com/item?id=47073676))

Both linked the **App Store page** (`apps.apple.com/us/app/scrollguard-block-reels/id6754183872`) rather than a web page.

**Diagnosis:** the most disciplined possible control experiment, and the result is unambiguous.

- **Show HN explicitly rules out version/platform updates:** *"New features and upgrades, such as a new version of an existing product, usually aren't substantive enough. A major overhaul is probably ok."* An iOS port of an Android app is exactly the disallowed case.
- **The title reverted to announcement register** ("I created an app to remove Reels, **now on iOS too**") — the "now on X too" clause is a changelog, not a story.
- **It linked an App Store page**, reintroducing the barrier that the 2024 flop had and the 2025 hit didn't.
- **Prior success transfers nothing.** 200,000 downloads and a #1 front page bought exactly one additional point.

**For a multi-app studio this is the most expensive lesson here:** you cannot run a launch cadence on Hacker News. One product, one shot, and only if the product fits.

---

## What the ten cases collectively say

1. **Hacker News is a framing test, not a product test.** ScrollGuard scored 4, then 690, then 1 with the same product. The variable was the sentence.
2. **Product Hunt's ceiling is ~1,000 visitors**, evidenced twice first-party (Beep #1 ≈ 1k; Plausible ≈ 1k / 15 trials), and its floor is a rank in the 80s with one upvote.
3. **Reddit is the only channel here that produced a business from cold** (GummySearch: 135K users, 10K paying) **and the only one that produced an acquisition** (Alien Blue).
4. **The two biggest indie community successes both died of platform dependency** (Apollo, GummySearch). Channel, never dependency.
5. **Every documented failure traces to the same root cause: no pre-existing audience.** MailTest and ClearNoteLab both say so in their own words. The launch is a measurement instrument, not a growth mechanism.
6. **The post-mortem outperforms the launch, reliably.** MailTest: 1 PH upvote, 700+ views on the write-up. Beep: 1.0k from a #1 finish, 1.2k from a 30-minute post about the #1 finish. This is a 30-minute play with a better hit rate than a 3-week one.

---

## Sources

- HN threads and point values: [HN Search (Algolia) API](https://hn.algolia.com/api), retrieved 2026-08-05 — items [39602878](https://news.ycombinator.com/item?id=39602878), [44923520](https://news.ycombinator.com/item?id=44923520), [46974817](https://news.ycombinator.com/item?id=46974817), [47073676](https://news.ycombinator.com/item?id=47073676), [22813168](https://news.ycombinator.com/item?id=22813168), [22691295](https://news.ycombinator.com/item?id=22691295)
- [scrollguard.app](https://scrollguard.app/) — download count and HN social proof, retrieved 2026-08-05
- [Plausible — How we built a $1M ARR open source SaaS](https://plausible.io/blog/open-source-saas) · [Inside a Tiny Empire: Plausible Analytics](https://tinyempires.substack.com/p/inside-a-tiny-empire-plausible-analytics) · [Founder Ventures — Plausible](https://founderventures.io/companies/plausible)
- [Alien Blue — Wikipedia](https://en.wikipedia.org/wiki/Alien_Blue)
- [EntryLevel.io — 10k users from #1 on the front page of Hacker News](https://www.indiehackers.com/product/entrylevel-io/10k-users-from-1-on-the-front-page-of-hacker-news--M3l9FFqAQo4O1oVwUDz)
- [GummySearch](https://gummysearch.com/) (closure notice, retrieved 2026-08-05) · [Startup Obituary: GummySearch](https://startupobituary.com/p/gummysearch) · [Bootstrap SaaS to $100K — Indie Hackers](https://www.indiehackers.com/post/bootstrap-saas-to-100k-audience-research-tool-for-reddit-b1a07a4897)
- [Apollo's Rise & Shutdown — RevenueCat](https://www.revenuecat.com/blog/growth/christian-selig-apollo-sub-club-podcast/) · [TechCrunch, 2023-05-31](https://techcrunch.com/2023/05/31/popular-reddit-app-apollo-may-go-out-of-business-over-reddits-new-unaffordable-api-pricing/) · [TechCrunch, 2023-06-08](https://techcrunch.com/2023/06/08/popular-third-party-reddit-app-apollo-is-shutting-down-as-a-result-of-reddits-new-api-pricing/)
- [Beep — A 30 minute Reddit post brought more traffic than a Product Hunt launch](https://www.indiehackers.com/post/a-30-minute-reddit-post-brought-more-traffic-than-a-product-hunt-launch-we-prepared-for-3-weeks-15bff6d42e)
- [MailTest — I launched on Product Hunt with 0 followers](https://www.indiehackers.com/post/i-launched-on-product-hunt-today-with-0-followers-0-network-and-0-users-heres-what-i-learned-in-12-hours-1c89889702)
- [ClearNoteLab — I built a SaaS in 9 days for $200, launched on HN to zero signups](https://www.indiehackers.com/post/i-built-a-saas-in-9-days-for-200-launched-on-hn-to-zero-signups-heres-what-actually-happened-87c39638c6)
- [Show HN rules](https://news.ycombinator.com/showhn.html)
