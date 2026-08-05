# Indie & Bootstrapped App Marketing Failures — Post-Mortems

**Compiled:** 2026-08-05. Wave 2a. Companion to [`taxonomy.md`](./taxonomy.md) and
[`bootstrapped-baseline.md`](./bootstrapped-baseline.md).

**Scope.** Fifteen dissected cases where the *marketing* failed — not the code. Cases already
covered in Wave 1 platform bundles are **not** re-dissected here; they are cross-referenced in
§Ledger at the end so the taxonomy can draw on the full set.

**Evidence rules.** Every claim is tagged:

- `[DOCUMENTED]` — traceable to a named source with a URL. Numbers may still be
  *founder-reported* rather than audited; where that matters I say so.
- `[ANECDOTAL]` — a real, named person said it, but there is no data behind it. Useful as a
  hypothesis, never as evidence.

**The honest limitation up front.** There is no public dataset of indie app failures. Failures
are *underreported by construction* — the people who quit mostly stop writing. What exists is a
biased sample of failures written up by people articulate and motivated enough to write them up,
which skews toward developers who were already blogging. Where I could not source something, I
say so rather than inventing a case study.

---

## Index

| # | Case | Type | Headline failure |
|---|---|---|---|
| 1 | Buildfield | Bootstrapped, solo, 2026 | 67K views → 0 paying users |
| 2 | SelfOS | Bootstrapped, solo, 2026 | 700 downloads, $150, 2 months — channel economics laid bare |
| 3 | Habit Pixel (the dead zone) | Bootstrapped, solo, 2025–26 | 5 months stalled at $28 MRR inside an eventual win |
| 4 | HabitKit's Times Square billboard | Bootstrapped, solo, 2024 | Best-in-class brand moment, ~no downloads |
| 5 | Redchecker | Bootstrapped, solo, 2026 | Two Reddit accounts permanently banned in 6 weeks |
| 6 | Daveyon Mayne | Bootstrapped, solo, 2021 | Quit apps entirely — "the worst part? Marketing" |
| 7 | Oliver King's good-deeds app | Bootstrapped, solo, 2020 | 10 weeks building, zero weeks distributing |
| 8 | Privacy-first Jobs | Bootstrapped, solo, 2023 | Quiet shutdown: traffic "never really grew" |
| 9 | Everpix | Funded, small team, 2013 | Product obsession, distribution neglect — full financials public |
| 10 | Flowtab | Funded, small team, 2013 | Two years, three apps, no repeat use |
| 11 | Peach | Funded, 2016 | Press cycle mistaken for a growth loop |
| 12 | Vero | Funded, 2018 | #1 in many stores off one offer; collapsed in days |
| 13 | Artifact | Funded, elite team, 2024 | 44% of downloads from one country; never went global |
| 14 | The lifetime-deal trap | Cross-sector, 2026 | Growth promo that removes the business underneath it |
| 15 | The "40 days of SEO and community" pattern | Bootstrapped, 2026 | Effort in channels with no buying intent |

---

# PART A — Bootstrapped indie failures (the ones that actually resemble us)

## 1. Buildfield — 67,000 views, 137 visitors, 0 paying users

**Bootstrapped, solo. Job-invoicing/calculator tool for building contractors. 2026.**
`[DOCUMENTED]` — [Indie Hackers, 27 Apr 2026](https://www.indiehackers.com/post/2-weeks-later-still-no-paying-users-heres-what-i-ve-learned-0bc55f0cdb),
first-party post by NG (@Buildfield).

**What they built.** A tool for contractors to price and invoice jobs.

**What they tried.** TikTok and YouTube content for 2+ months; cold email and LinkedIn outreach
to accountants; a free "job calculator" lead magnet.

**The numbers, as reported:**

| Metric | Value |
|---|---|
| TikTok views | 42,000 |
| YouTube views | 25,000 |
| Landing-page visitors | 137/month (up 110% period-on-period) |
| Job-calculator signups | **0** |
| Paying users | **0** |
| MRR | **$0** |

**The founder's own diagnosis, verbatim:**

> "The content seems to be working... the conversion problem is real though. People land on the
> page and leave in under 10 seconds."

**Our diagnosis — the founder got it half right, and the half they got wrong is the expensive
half.**

1. **The click-through rate is the tell, not the bounce rate.** 67,000 views produced 137
   visitors. That is **0.2%**. On a working funnel that number is the *first* thing to look at,
   and it says the viewers had no intent — they were not withholding a click at the landing page,
   they never wanted one. The founder concluded the landing page was fine and the audience was
   right; the arithmetic says the opposite.
2. **A free calculator with 0 signups is not a broken calculator.** It is a no-urgency problem.
   A contractor pricing a job today does not need a calculator, they need to send the invoice.
   The lead magnet was solving a problem nobody had at the moment they saw it.
3. **The audience and the buyer were different people.** Content aimed at contractors; outreach
   aimed at accountants. Neither channel was doing the other's work.
4. **Two-plus months of content production is a serious cost for a solo founder** and it bought a
   number — 0.2% CTR — that could have been measured in week one with ten videos.

**Transferable lesson:** view count is not a funnel metric. **The first real metric is
views → link clicks.** If that ratio is below ~1%, the content is reaching people who are
interested in the *topic* rather than people with the *problem*, and no amount of extra volume
fixes it.

---

## 2. SelfOS — 700 downloads, 20 payers, $150, and the cleanest channel-cost table an indie has published

**Bootstrapped, solo (Viktoriia, @VirtualViki). Minimalist life planner with a gamified bonsai
mechanic. iOS + Android. 2026.**
`[DOCUMENTED]` — [Indie Hackers, 26 Mar 2026](https://www.indiehackers.com/post/the-indie-makers-dilemma-2-months-in-700-downloads-and-i-m-stuck-53db8107c1),
first-party.

**Two months in:**

| Metric | Value |
|---|---|
| Downloads (iOS + Android) | ~700 |
| Paying users | ~20 |
| Total revenue | **$150** |
| Store rating | 5.0 on both stores |

**The channel table — the most useful thing in this document:**

| Channel | Cost | Result | Effective CPI |
|---|---|---|---|
| Telegram ads, niche channel (3K subs) | paid | installs | **$0.21** |
| Telegram ads, large generic channel (230K subs) | paid | installs | **$5.83** |
| Indie App Santa promo | $75 | ~40 downloads, 18 lifetime purchases (~$100) | broke even |
| **Threads — a single organic comment** | **$0** | **120+ downloads overnight** | **$0.00** |

**Founder's conclusion, verbatim:** *"Smaller, niche communities convert way better than big
generic ones."*

**Our diagnosis.** This is only a "failure" against the fantasy baseline. Against the real one
(see [`bootstrapped-baseline.md`](./bootstrapped-baseline.md)) — median subscription app makes
~$72/month at *twelve* months — $150 at two months with a 5.0 rating is above median. The actual
failure is different and more subtle:

1. **A 28× CPI spread between two variants of the same channel** means channel choice is not the
   decision — *audience concentration within the channel* is. This is the same finding as Blake
   Anderson's $50 micro-creators (see `platforms/tiktok/case-studies.md` §3) arriving from a
   completely different direction. Two independent indie datapoints now say: **narrow beats big,
   by an order of magnitude, at every budget level.**
2. **The single best result was free and unrepeatable-by-design.** One organic Threads comment
   out-performed every paid channel. The founder cannot schedule that. Which means the honest
   read is: paid channels produced known-cost, low-volume installs; the outsized result came from
   being present in a conversation, which is a *volume-of-presence* strategy, not a campaign.
3. **20 payers on 700 downloads = ~2.9% download-to-paid.** That is *at or slightly above* the
   RevenueCat median for a freemium app (2.1% D35). The monetisation is not the problem. **The
   problem is that 700 is a rounding error.** At 2.9% conversion and ~$7.50 revenue per payer,
   this app needs ~100,000 downloads to make $3,000/month. Nothing in the channel table gets
   there.

**Transferable lesson:** run the arithmetic *before* the campaign. Conversion rate × price ×
downloads = revenue. If the download number required for a survivable revenue figure is not
reachable by the channels available, the campaign is not the problem — **the price or the
category is.**

---

## 3. Habit Pixel — the five-month dead zone inside a success story

**Bootstrapped, solo (Hirvesh Munogee). Habit tracker. Launched May 2025.**
`[DOCUMENTED]` — [Indie Hackers, Jan 2026](https://www.indiehackers.com/post/from-0-to-1k-mrr-in-8-months-bootstrapping-habit-pixel-as-a-solo-dev-53d8687d15),
first-party. All figures founder-reported.

I am including a *win* in a failures document deliberately, because the interesting part of this
case is the failure buried in the middle of it.

| Period | Downloads | MRR | Active subs |
|---|---|---|---|
| May 2025 (launch) | ~1,300 | **$28** | — |
| June 2025 | ~2,100 cumulative | **$28** | — |
| **Jun–Oct 2025** | — | **flat** | — |
| Early Nov 2025 | — | $208 | 171 |
| Late Nov 2025 | 10K (Play) | $407 | 341 |
| Dec 2025 | — | $840 | 697 |
| Early Jan 2026 | — | **$1,000+** | ~900 |

**The dead zone.** Launch produced 1,300 downloads and $28 MRR. Then **five months of
approximately nothing.** The founder attributes this to "stalled growth without consistent
marketing" over the summer, plus onboarding problems that "scared off users."

**What broke the dead zone — four things, none of them "posting more":**

1. **Purchasing-power-parity pricing** (late Oct 2025): *"Almost immediately, I saw purchases
   from countries I'd never reached before, like those in Southeast Asia and Latin America."*
2. **A Black Friday 40%-off lifetime promo** (20 Nov – 1 Dec) → ~$2K revenue month, user surge.
3. **Building in public on X** (Nov onward).
4. **App Store localisation into 12 languages** (30 Dec) → downloads from Europe.
5. Uneed launch (1 Jan 2026): 2nd Product of the Day, 200+ sales in two days.

**Our diagnosis.** Three of the five unlocks were **pricing and store-listing changes, not
content**. PPP pricing and 12-language localisation are one-off engineering tasks with permanent
effects; they are also exactly the tasks an AI-agent pipeline can do at near-zero marginal cost
across a portfolio. The founder spent five months trying to solve a distribution problem that
was substantially a *pricing and localisation* problem.

Note also the mirror image of LifePilot (`platforms/tiktok/case-studies.md` §F2), which died
because its store listing defaulted to Italian for US users. **Same lever, opposite sign.**

**Transferable lesson:** before spending a month on content, spend a day on the store listing in
every target locale and on regional pricing. It is the highest-leverage, lowest-effort, most
automatable work available to a bootstrapped studio, and two independent cases here turn on it.

---

## 4. HabitKit's Times Square billboard — the best brand moment money can't buy, and ~no downloads

**Bootstrapped, solo (Sebastian Röhl). Habit tracker. 2024.**
`[DOCUMENTED]` — [2024 — My Indie App Business Year In Review](https://sebastianroehl.substack.com/p/2024-my-indie-app-business-year-in),
first-party. Also covered from the YouTube angle in `platforms/youtube/case-studies.md`
(§WIN 1 and §FAILURE 4); dissected here for the channel-choice lesson.

Röhl won a RevenueCat contest whose prize was **a billboard in Times Square**. His own verdict:

> "Sadly, in terms of downloads and revenue, this wasn't a huge success."

**In the same year, the thing that actually moved the business was unpaid and unplanned:** an
**MKBHD-adjacent video** (the "Studio" channel) that discovered HabitKit **via Threads** and
featured it in December. Result: *"led to a huge spike in downloads and revenue"* and December
became his most successful month since starting the business. He reached **$10,000 MRR** in 2024.

**Our diagnosis.**

1. **Impressions without intent are worth approximately zero.** A Times Square billboard is the
   purest possible form of "reach" — and it produced a rounding error. This is the same finding
   as Buildfield's 0.2% CTR, at 10,000× the production value.
2. **The channel that worked was a third-party authority review**, and the *mechanism that
   caused it* was the founder being visible on Threads. He did not pitch MKBHD. He was findable.
3. **Röhl also reports his newsletter was the hardest thing to grow** — 400+ subscribers against
   14,000+ social followers and 42+ blog articles. `[DOCUMENTED]` The content volume was real;
   the email conversion was not.

**Transferable lesson:** for a bootstrapped studio the highest-value marketing outcome is **being
covered by someone with an existing audience**, and the only reliable way to cause that is
**public, continuous, findable presence** — not outreach and not paid reach. Budget attention,
not impressions.

---

## 5. Redchecker — two Reddit accounts permanently banned in six weeks

**Bootstrapped, solo (Musha Ahamed R Y, @redcheckerrr). 2026.**
`[DOCUMENTED]` — [Indie Hackers, 9 Feb 2026](https://www.indiehackers.com/post/reddit-killed-my-first-account-and-taught-me-exactly-what-not-to-do-expensive-lessons-learned-h6ecUkvMCcYZgmSf6RDx),
first-party.

**The timeline:**

| Week | Action | Result |
|---|---|---|
| 1–2 | Self-promo posts in r/Entrepreneur | Removed, "no self-promotion" |
| 3 | Long genuinely-useful guide, product mentioned briefly | **87 upvotes** — worked |
| 4 | 5 similar posts across r/productivity, r/SaaS, r/startups, r/smallbusiness in 7 days | Posts 3–5 removed or suppressed |
| 5 | — | **Permanent ban**, "repeated violation of Reddit's spam policy" |
| — | Second account | **Banned within two weeks** |

**The mechanism he identifies — and this is the part that matters for an automated content
pipeline.** Reddit's detection operates on **account-level patterns, not individual posts**:

1. Single-product focus across posts (flag threshold he estimates at 60–70% of posts)
2. Same/similar content across multiple subreddits within 24–72 hours
3. Repeatedly linking the same domain in comments
4. Self-promotion within days of account creation
5. Link-to-content ratio: *"if 50%+ of your activity contains links you're promotional"*
6. Coordinated upvotes from similar IPs

His conclusion, verbatim: *"you can't hack reddit. you can only work with its rules. the rules
are pattern-based."*

**Why this is the single most dangerous case in this document for the App Factory.** Our
structural advantage is *volume* — many apps, AI-assisted content, high posting cadence. That is
**precisely the pattern signature** Reddit's classifier is built to detect. An agent pipeline
posting about N apps from one account, or N accounts posting on the same schedule from the same
infrastructure, is a textbook detection case. See also MailTest
(`platforms/communities/case-studies.md` §8), whose friends' upvotes were silently filtered, and
Adam Lyttle's *"the downside was getting found out"* (`platforms/tiktok/case-studies.md` §5).

**Transferable lesson:** on community platforms, **cadence is the liability, not the content**.
Any automated posting design must be built around per-account pattern budgets (topic diversity,
link ratio, inter-post spacing) before it is built around volume.

---

## 6. Daveyon Mayne — gave up on apps entirely

**Bootstrapped, solo. 2021.**
`[DOCUMENTED]` (the statement) / `[ANECDOTAL]` (the causation) —
[Indie Hackers, 26 Jun 2021](https://www.indiehackers.com/post/ive-given-up-on-making-apps-0caeded1ec).

**What he built:** several products that never left localhost, plus a Shopify→Xero app he later
pulled from the Shopify app store.

**No download or revenue numbers are given.** I am including it anyway because the sentence is
the most common failure in this entire field and it is almost never written down:

> "The fun part was making the apps. The worst part? Marketing."

And on why he wouldn't do outreach: he felt *"like I was spamming a forum."*

**Our diagnosis.** This is the modal indie failure and it is a *motivational* failure, not a
tactical one. The founder was capable of building and unwilling to distribute, and the
unwillingness was rooted in a specific belief — that promotion is inherently spam. That belief is
correct about *bad* promotion and catastrophic when generalised.

**Why it matters to us specifically.** The App Factory's architecture removes the two things that
killed this: the founder does not have to write the content (agents do), and the founder does not
have to feel like a spammer in a forum (the raw material is him using his own app). **The
factory's design is, structurally, a fix for the most common indie failure mode.** That is worth
stating explicitly because it is the strongest argument for the model.

---

## 7. Oliver King's good-deeds app — ten weeks of building, zero weeks of distributing

**Bootstrapped, solo (Oliver King / PeridotOak). Gamified daily good-deeds app. Died 20 Jul 2020,
~10 weeks in.**
`[DOCUMENTED]` — [Indie Hackers, 25 Jul 2020](https://www.indiehackers.com/post/a-post-mortem-on-my-first-project-dbe06018ef),
first-party. **No user or revenue numbers exist because it never reached users.**

**His five stated causes:** insufficient upfront planning; misalignment with his own values
(*"I, personally, wouldn't ever use it"*); over-engineering before launch (*"running in place"*);
ignoring an early instinct the project was a *"massive detour"*; and poor articulation of what he
was building.

**His summary line:** *"No amount of engineering...is going to dress-up a bad product."*

**Our diagnosis — and I disagree with his own.** Marketing is **completely absent from his
post-mortem**, including from the list of things he thinks went wrong. He spent ten weeks on UX
perfection and user research and never got to distribution, then concluded the lesson was about
product quality. The actual lesson is that **he never ran the experiment.** A product that no one
was told about did not fail in the market; it failed to reach it.

**Transferable lesson:** the "built it and they came" failure is usually *invisible to the person
who suffered it*, because they diagnose it as a product problem. The counter-move is procedural,
not motivational: **the distribution plan is a launch gate, written before the first commit, with
a named channel and a named first hundred people.**

---

## 8. Privacy-first Jobs — the quiet shutdown

**Bootstrapped, solo (Daniel Davis, @tagawa). Job board + newsletter. Shut down 15 Aug 2023.**
`[DOCUMENTED]` — [Indie Hackers](https://www.indiehackers.com/product/privacy-first-jobs/closing-down--NbsIhLKP7ePv1IQZRh_).

Stated reason, verbatim: *"traffic or subscriber count never really grew, and I want to focus on
other projects that look more promising."*

**No numbers were published.** The shutdown notice itself received **2 likes and 2 comments.**

**Why it's here.** This is what the overwhelming majority of failures look like: no dramatic
collapse, no viral moment, no lesson thread. A slow flatline, a two-sentence goodbye, and
essentially no audience even for the goodbye. **The 2-likes-on-the-obituary detail is the
survivorship-bias correction in miniature** — the failures that get written up well are the ones
by people who already had an audience, which is itself the thing that separates the successes
from the failures.

---

# PART B — Larger failures whose mechanism is universal

These are not bootstrapped. They are here because each isolates one failure mode more cleanly
than any indie case does, usually because the numbers are public.

## 9. Everpix — the purest "we built, we did not distribute" case, with published financials

**Funded (~$2.3M angel/VC), small team. Photo-management service. Shut down Nov 2013.**
`[DOCUMENTED]` — [Everpix-Intelligence on GitHub](https://github.com/everpix/Everpix-Intelligence)
(the team published their **uncensored** metrics, financials and business data),
[TechCrunch, 5 Nov 2013](https://techcrunch.com/2013/11/05/everpix-shutting-down/),
[VentureBeat](https://venturebeat.com/business/goodbye-everpix-photo-storage-startup-shuts-down-as-bills-pile-up).
The Verge embedded a reporter for the final weeks.

**At shutdown:**

| Metric | Value |
|---|---|
| Signed-up users | ~50,000 |
| Paying subscribers | ~7,000 (14% of signups) |
| Photos imported | 400 million |
| Subscription revenue | **~$40,000/month** over the final 3 months |
| The bill that ended it | ~$35,000 AWS |
| Lifetime raised | ~$2.3M |

**The diagnosis, which the team stated themselves:** they *"had spent way too much time on the
product and not nearly enough on growth and distribution."* The product was widely regarded as
excellent. It converted at 14% signup-to-paid, which is *extraordinary* — better than the
RevenueCat 2026 hard-paywall median of 10.7% D35.

**This is the case that should frighten a studio of engineers.** Everpix built something people
paid for at a rate most apps never approach, and died anyway, because **conversion rate does not
compensate for lack of top-of-funnel.** 14% of nothing is nothing.

**Transferable lesson:** a great conversion rate is *evidence you should spend more on
distribution*, not evidence that distribution is handled. The two numbers multiply; a studio
optimising only one of them is optimising a factor, not the product.

---

## 10. Flowtab — two years, five employees, three apps, wrong vertical

**Funded, small team (Mike Townsend, Kyle Hill). Order drinks from your phone in bars. 2011–2013.**
`[DOCUMENTED]` — [TechCrunch, 31 Aug 2013](https://techcrunch.com/2013/08/31/the-decline-and-fall-of-flowtab-a-startup-story),
[Failory cemetery entry](https://www.failory.com/cemetery/flowtab), plus Townsend's own
[Medium post-mortem](https://medium.com/@mikettownsend/how-we-pivoted-flowtab-from-bars-to-stadiums-2a83d2a0f422).
Townsend published a full timeline — unusual at the time.

**What went wrong, per the post-mortem:**

- On-premise mobile ordering was **not a viable business in the bar/nightclub vertical**.
- They charged **$1 per order**, so profitability required enormous volume.
- **Users didn't return to the same bars** and **most used the app once or twice a month.**
- They cycled through business models without finding one both feasible and profitable.
- Understaffed: a tiny team doing everything.

**Our diagnosis.** The marketing was never the constraint. **The usage frequency was.** An app
used twice a month, at $1 of revenue per use, in a venue the user does not reliably revisit, has
no reachable customer-acquisition cost — every install must be re-acquired, effectively forever.
No content strategy fixes a per-user revenue figure of $2/month against a real-world install cost.

**Transferable lesson:** compute **revenue per user per month × expected months retained** before
choosing a channel. If that number is under a few dollars, no paid channel will ever work and
organic must carry 100% of acquisition — which is a viable plan, but it must be *the* plan from
day one, not the fallback.

---

## 11. Peach — a press cycle mistaken for a growth loop

**Funded (Dom Hofmann, Vine co-founder). "A space for friends." Launched 7 Jan 2016.**
`[DOCUMENTED]` — [Wikipedia](https://en.wikipedia.org/wiki/Peach_(social_network)),
[Startup Obituary](https://startupobituary.com/p/peach),
[Daily Dot](https://dailydot.com/peach-app),
[HowStuffWorks](https://computer.howstuffworks.com/internet/social-networking/networks/peach-pits-quick-rise-fall-social-media-app.htm).

**The arc, in days:**

- **7 Jan 2016** — launch.
- **11 Jan 2016** — HuffPost calls it a *"new social media obsession"*; the Guardian says it is
  *"taking the tech world by storm"*; Recode calls it the app *"for the kids at tech's cool
  table."*
- **~15 Jan 2016** — pronounced dead; falls off the charts.
- By mid-2016 the press had moved on; no further updates or team communication.

**Our diagnosis.** Peach got the single best top-of-funnel outcome available in tech — simultaneous
coverage in three tier-one outlets, from a founder with an unimpeachable track record — and it
bought **four days.** The app's stated design goal was *intimate, non-viral interaction among
close friends*, which is a coherent product thesis and a **direct contradiction of the acquisition
mechanism it actually used.** A product deliberately built without virality was launched via a
mechanism that only delivers a spike.

Compare Locket (`platforms/tiktok/case-studies.md` §4): same category, same "small circle of
friends" thesis, but Locket's product *required* you to recruit 3–5 people to get any value at
all. 100,000 views became 2 million signups because the loop was inside the product. Peach's
enormous press became nothing because there was no loop to feed.

**Transferable lesson:** ask, before any push, *what does the person who installs today do that
causes person #2 to install tomorrow?* If the honest answer is "nothing, they just like it," the
push buys a spike whose decay rate is set by novelty, and the correct budget for it is low.

---

## 12. Vero — #1 in many national app stores off a single offer, dead within months

**Funded. Ad-free social network. Viral surge Feb 2018.**
`[DOCUMENTED]` — [Wikipedia](https://en.wikipedia.org/wiki/Vero_(app)),
[TIME](https://time.com/5178976/vero-app-ceo/),
[The National](https://www.thenationalnews.com/arts-culture/comment/the-rise-and-fall-of-social-media-app-vero-1.709839).

**The mechanic:** no ads, no algorithmic interference, **and free for life for the first million
users.** It worked spectacularly — Vero hit **#1 in many national app stores.**

**Three things then happened, in order:**

1. **The servers could not take the load.** New-account demand overloaded infrastructure; the app
   glitched for exactly the cohort that had just arrived.
2. **The founder's history surfaced.** CEO Ayman Hariri had been vice-chairman of Saudi Oger,
   which was the subject of **over 31,000 non-payment-of-wages complaints** during his tenure.
3. **#DeleteVero trended** before many signups had even logged in.

**Our diagnosis — three separate lessons, and the third is the underrated one:**

1. **Scarcity offers work and are dangerous.** "Free for the first million" is a genuine,
   cheap, effective growth mechanic. It also *guarantees* a demand spike concentrated into hours,
   against infrastructure that has never been tested. If you run the offer, load-test first.
2. **A viral moment is a due-diligence event.** Going #1 means a million strangers, several of
   them journalists, simultaneously researching the founder. Anything findable will be found
   within 72 hours.
3. **The moment is one-shot.** Vero's users churned before forming a habit, and the brand damage
   was permanent. Compare Poparazzi and Gas (`platforms/tiktok/case-studies.md` §F3, §F4): the
   common structure is **attention arriving before the product could hold it.**

---

## 13. Artifact — best team, best product, 44% of downloads from one country

**Funded. News app by Instagram co-founders Kevin Systrom and Mike Krieger. Launched 2023,
shut down Jan 2024.**
`[DOCUMENTED]` — [TechCrunch, 18 Jan 2024](https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/),
[Engadget](https://www.engadget.com/instagrams-founders-are-shutting-down-artifact-their-year-old-news-app-233431390.html),
[Wikipedia](https://en.wikipedia.org/wiki/Artifact_(app)).

Systrom's stated reason: *"the market opportunity isn't big enough to warrant continued
investment."*

**The number that actually explains it:** **the US accounted for 44% of all downloads, and no
other country exceeded 4%.** Downloads dropped steeply after launch.

**Our diagnosis.** This is the geographic-concentration failure, and it is the one indie
developers most reliably ignore. Artifact had the two things every indie wishes for — an elite
team's distribution rolodex and unanimous press goodwill — and still could not get out of one
country. The reason is instructive: **the product's value was tied to English-language US news
supply.** International expansion wasn't a marketing task, it was a content-supply task the
product wasn't built for.

Set this against Habit Pixel (§3), where localising the *store listing* into 12 languages and
adding PPP pricing measurably opened new markets in weeks. **The difference is whether the
international ceiling is in the product or only in the listing.** For a habit tracker it is in
the listing. For a US news aggregator it is in the product. Knowing which one you are is a
launch-time decision.

**Where they are now:** Artifact's personalisation technology was acquired by Yahoo, March 2024.
The app is gone.

---

## 14. The lifetime-deal trap — the growth promo that removes the business

`[DOCUMENTED]` (the aggregate) — ["We Analyzed 89 Dead Lifetime Deals"](https://dev.to/dominique_abbey_b2a2f35ee/we-analyzed-89-dead-lifetime-deals-1-in-8-died-while-the-company-was-still-alive-6pe);
[RevenueCat's guide to lifetime subscriptions](https://www.revenuecat.com/blog/growth/lifetime-subscriptions);
Indie Hackers threads
[[1]](https://www.indiehackers.com/post/lifetime-deals-ltds-yes-or-no-210e5a7b1a)
[[2]](https://www.indiehackers.com/post/whats-new-don-t-offer-lifetime-deals-191668f974).

I could not source a single *named indie mobile app* killed specifically by a lifetime deal, and
I am not going to invent one. What is documented is the aggregate pattern:

- Of 89 dead lifetime deals analysed, **roughly 1 in 8 (12%) were not shutdowns at all** — the
  company was still operating and still taking money, and had simply **revoked or downgraded the
  lifetime licence** and pushed buyers onto a subscription.
- Recurring costs (servers, support, development) do not stop when revenue does. `[DOCUMENTED]`
- Multiple Shopify apps drew sustained public backlash for reneging on "free forever"
  promises. `[DOCUMENTED — app-store review record]`

**The relevance to us is specific and immediate.** Habit Pixel's growth unlock (§3) was a **40%-off
lifetime deal at Black Friday** that produced a ~$2K month. It worked. But it converts subscription
revenue into one-time revenue at a discount, permanently, for the cohort most likely to have been
long-term subscribers. It is a **cash-flow instrument disguised as a growth channel.**

**Transferable lesson:** lifetime deals are legitimate for (a) a genuine cash crunch, (b) early
users you want as evangelists, in small numbers. They are illegitimate as a repeatable growth
channel, and the reneging pattern above is the reputational bill that arrives 18 months later.
Cap them as a fixed number of units, never an open offer.

---

## 15. The "40 days of SEO and community" pattern — effort in channels with no buying intent

`[DOCUMENTED]` (the instance) — surfaced on
[Indie Hackers, 2026](https://www.indiehackers.com/post/why-indie-founders-fail-the-uncomfortable-truths-beyond-build-in-public-b51fd6509b)
discussion context: *"I built an AI tool for agencies, spent 40 days on SEO and community, and
still have zero paying strangers."* `[ANECDOTAL]` for the causation.

Paired with Angel Cee's synthesis post (10 Feb 2026, same link), which is explicitly **not**
data — the author presents it as accumulated observation. Its four claims worth carrying forward,
tagged honestly as `[ANECDOTAL]`:

1. *"Passion for a problem sustains you. Passion for a tool burns out."*
2. Technical founders over-invest in stack and infrastructure — *"a sophisticated form of
   procrastination."*
3. **Months 3–18 are where the failures happen** — the "messy middle," after launch adrenaline
   and before compounding.
4. Founders *"conflate building with launching"* and hope for silver-bullet platforms rather than
   sustained distribution.

**Why claim 3 matters more than it looks.** It is corroborated independently by the Habit Pixel
dead zone (§3: months 2–7 flat) and by the shape of every "quiet shutdown" in Part A. The failure
is not at launch. **Launch failure is loud and diagnosable. The failure that actually kills
bootstrapped apps is the flat months after launch, when there is no crisis to react to.**

**Transferable lesson for the factory:** the process risk is not the launch checklist, it is
**month 3 through month 8**. A portfolio studio must have a written, scheduled answer to "what
happens to an app that is flat at month 3" — continue, change price, change positioning, or kill
— decided in advance, because the founder's attention will not be there to make the call ad hoc.

---

# Ledger — Wave 1 failures cross-referenced (not re-dissected here)

These are already documented in the platform bundles. The taxonomy draws on all of them.

| Case | Where | One-line failure |
|---|---|---|
| Tube2Blog | `platforms/tiktok/case-studies.md` §F1 | 1M views, no product to buy, wrong audience |
| LifePilot | `platforms/tiktok/case-studies.md` §F2 | Store listing in Italian for US users; 11 downloads |
| Poparazzi | `platforms/tiktok/case-studies.md` §F3 | 6.2M installs → ~2,000 MAU |
| Gas | `platforms/tiktok/case-studies.md` §F4 | Cohort cascade with a hard ceiling |
| NGL | `platforms/tiktok/case-studies.md` §F5 | $5M FTC settlement; growth mechanic *was* the liability |
| Beep | `platforms/communities/case-studies.md` §7 | 3 weeks prep → PH #1 → ~1k visitors |
| MailTest | `platforms/communities/case-studies.md` §8 | PH #83, 1 upvote; no pre-existing audience |
| ClearNoteLab | `platforms/communities/case-studies.md` §9 | Show HN, 1 point, 0 signups |
| ScrollGuard relaunches | `platforms/communities/case-studies.md` §10 | Proven product, 1 point — HN is one-shot |
| GummySearch | `platforms/communities/case-studies.md` §5 | Profitable, killed by Reddit API pricing |
| Apollo | `platforms/communities/case-studies.md` §6 | ~1.5M MAU, killed by Reddit API pricing |
| Roman Koch | `platforms/x-linkedin/case-studies.md` §6 | Six apps, 2,461 downloads, $1,464/yr |
| Marc Lou — BioAge / ClipMarc | `platforms/x-linkedin/case-studies.md` §7 | Maximum audience, zero product-market fit |
| Anthony Castrio / Indie Worldwide | `platforms/x-linkedin/case-studies.md` §8 | Build-in-public community that lost money |
| Lensa AI | `platforms/paid/case-studies.md` §7 | Viral spike that could not be held |
| Quibi | `platforms/paid/case-studies.md` §6 | $1.75B raised, installs bought, retention absent |
| IRL | `platforms/paid/case-studies.md` §8 | $170M raised, 95% of users fake |
| The ¥50,000 meditation app | `platforms/paid/case-studies.md` §9 | Burned budget and the rating with it |
| Times Square billboard | `platforms/youtube/case-studies.md` §FAILURE 4 | Impressions without intent — see §4 above |

---

## What the fifteen cases collectively say

1. **The single most common indie failure is not a bad campaign — it is no campaign.** Cases 6, 7,
   8, and 9 all failed at the "we never seriously distributed" step, and in three of the four the
   founder's own post-mortem does not identify marketing as the problem. **The failure is
   invisible from the inside.**
2. **Views are not a funnel metric; views → clicks is.** Buildfield's 0.2% and the Times Square
   billboard's ~0% are the same finding at opposite ends of the production-budget scale.
3. **Narrow beats big by an order of magnitude, at every budget.** SelfOS: $0.21 CPI in a 3K-subscriber
   Telegram channel vs $5.83 in a 230K one — 28×. Blake Anderson: two $50 micro-creators →
   200K downloads. Same law, independently observed.
4. **Store listing and pricing are marketing, and they are the cheapest marketing there is.**
   Habit Pixel unlocked growth with PPP pricing and 12-language localisation; LifePilot died of a
   wrong-language listing. Both are one-day engineering tasks.
5. **Great conversion does not rescue thin top-of-funnel.** Everpix converted at 14% and died.
6. **A spike is only worth what the product can hold.** Peach (4 days), Vero (#1 → collapse),
   Poparazzi (6.2M → 2K MAU), Gas (7.4M → shut). Ask what makes user #1,000,001 join after the
   trend passes.
7. **On community platforms, cadence is the liability.** Redchecker lost two accounts in six weeks
   to *pattern* detection, not content quality. This is the specific risk our volume advantage
   creates.
8. **The dangerous period is months 3–8, not launch week.** Habit Pixel was flat for five months
   before four one-off changes broke it open. Most failures are flatlines, not crashes.

---

## Sources

**Buildfield:** [Indie Hackers, 27 Apr 2026](https://www.indiehackers.com/post/2-weeks-later-still-no-paying-users-heres-what-i-ve-learned-0bc55f0cdb)
**SelfOS:** [Indie Hackers, 26 Mar 2026](https://www.indiehackers.com/post/the-indie-makers-dilemma-2-months-in-700-downloads-and-i-m-stuck-53db8107c1)
**Habit Pixel:** [Indie Hackers, Jan 2026](https://www.indiehackers.com/post/from-0-to-1k-mrr-in-8-months-bootstrapping-habit-pixel-as-a-solo-dev-53d8687d15)
**HabitKit:** [Sebastian Röhl — 2024 Year In Review](https://sebastianroehl.substack.com/p/2024-my-indie-app-business-year-in)
**Redchecker:** [Indie Hackers, 9 Feb 2026](https://www.indiehackers.com/post/reddit-killed-my-first-account-and-taught-me-exactly-what-not-to-do-expensive-lessons-learned-h6ecUkvMCcYZgmSf6RDx)
**Daveyon Mayne:** [Indie Hackers, 26 Jun 2021](https://www.indiehackers.com/post/ive-given-up-on-making-apps-0caeded1ec)
**Oliver King:** [Indie Hackers, 25 Jul 2020](https://www.indiehackers.com/post/a-post-mortem-on-my-first-project-dbe06018ef)
**Privacy-first Jobs:** [Indie Hackers, 15 Aug 2023](https://www.indiehackers.com/product/privacy-first-jobs/closing-down--NbsIhLKP7ePv1IQZRh_)
**Everpix:** [Everpix-Intelligence (GitHub)](https://github.com/everpix/Everpix-Intelligence) · [TechCrunch](https://techcrunch.com/2013/11/05/everpix-shutting-down/) · [VentureBeat](https://venturebeat.com/business/goodbye-everpix-photo-storage-startup-shuts-down-as-bills-pile-up)
**Flowtab:** [TechCrunch](https://techcrunch.com/2013/08/31/the-decline-and-fall-of-flowtab-a-startup-story) · [Failory](https://www.failory.com/cemetery/flowtab) · [Mike Townsend on Medium](https://medium.com/@mikettownsend/how-we-pivoted-flowtab-from-bars-to-stadiums-2a83d2a0f422)
**Peach:** [Wikipedia](https://en.wikipedia.org/wiki/Peach_(social_network)) · [Startup Obituary](https://startupobituary.com/p/peach) · [Daily Dot](https://dailydot.com/peach-app)
**Vero:** [Wikipedia](https://en.wikipedia.org/wiki/Vero_(app)) · [TIME](https://time.com/5178976/vero-app-ceo/) · [The National](https://www.thenationalnews.com/arts-culture/comment/the-rise-and-fall-of-social-media-app-vero-1.709839)
**Artifact:** [TechCrunch, 18 Jan 2024](https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/) · [Engadget](https://www.engadget.com/instagrams-founders-are-shutting-down-artifact-their-year-old-news-app-233431390.html) · [Wikipedia](https://en.wikipedia.org/wiki/Artifact_(app))
**Lifetime deals:** [89 Dead Lifetime Deals analysis](https://dev.to/dominique_abbey_b2a2f35ee/we-analyzed-89-dead-lifetime-deals-1-in-8-died-while-the-company-was-still-alive-6pe) · [RevenueCat](https://www.revenuecat.com/blog/growth/lifetime-subscriptions)
**Messy middle:** [Angel Cee, Indie Hackers, 10 Feb 2026](https://www.indiehackers.com/post/why-indie-founders-fail-the-uncomfortable-truths-beyond-build-in-public-b51fd6509b)
</content>
</invoke>
