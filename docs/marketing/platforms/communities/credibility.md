# Community Platforms — Participating Without Getting Banned or Read as a Shill

**Compiled:** 2026-08-05. Companion to [`algorithm.md`](./algorithm.md), [`audience.md`](./audience.md), [`case-studies.md`](./case-studies.md).

This is the hard document. On paid channels the failure mode is wasted money. On community channels the failure mode is **permanent, retroactive, and reputational** — a domain ban means every future App Factory product is undistributable in that community, and a shill accusation attaches to a *studio name*, not a product.

Two structural facts frame everything below:

1. **A multi-app studio is, from a moderator's point of view, indistinguishable from a spam operation.** Several products, several launches, one entity behind them, an incentive to be everywhere. Reddit's own anti-abuse systems are explicitly tuned for *"subtle, coordinated patterns of artificial behavior and manufactured hype."* That description fits an honest studio's marketing calendar. You must actively differentiate yourself from what you structurally resemble.
2. **The enforcement environment hardened sharply in 2025–2026.** Reddit deployed LLM classifiers detecting on the order of **25,000 spam posts and comments per day**, cutting user exposure to spam ~20 % quarter-over-quarter ([Absolute Geeks](https://www.absolutegeeks.com/tech-news/reddit-deploys-llms-to-combat-ai-generated-spam-content/), [TechBuzz](https://www.techbuzz.ai/articles/reddit-deploys-llms-to-fight-ai-generated-spam-epidemic)). Tactics that worked in 2022 are now detection surfaces.

---

## 1. Reddit

### 1.1 The rules that actually bind

Three layers, in increasing order of how often they will actually stop you:

**Layer 1 — Reddit Content Policy (rarely your problem if you're honest).** Rule 2 requires authentic content posted into communities where you have a personal interest, and prohibits content manipulation: spamming, vote manipulation, ban evasion, subscriber fraud. Vote manipulation explicitly includes multiple accounts, voting services, automation, and **coordinated voting with an organised group** — which includes asking your team, your Discord, or your mailing list to go upvote something.

**Layer 2 — Reddiquette (a norm, not enforcement).** The operative line: *"it's fine to be a redditor with a website, it's not fine to be a website with a Reddit account."* Reddiquette permits posting your own content "within reason," and notes that if it's all you post, "you just might be a spammer."

**Layer 3 — subreddit rules and AutoModerator (this is what stops you).** Mods write their own promo rules and enforce them with automated karma gates, account-age gates, domain blocklists, and manual review. Removal is silent. This layer is where ~all of your posts will die.

### 1.2 The 9:1 rule, correctly understood

The 9:1 (or 90/10) rule — one self-promotional submission per nine non-promotional contributions — is **a community convention, not enforced site-wide policy**, and no longer appears as an explicit ratio in Reddit's official text.

**Do not treat it as a quota you can satisfy arithmetically.** Treat it as a description of what a moderator sees when they click your username, because that is the only moment it is ever applied.

Practical restatement for the App Factory:

> **A moderator reviewing your profile should be unable to tell, in ten seconds, that you work at a company.**

That is a much higher bar than 9:1 and it is the actual bar. Nine low-effort comments followed by a link post reads exactly as what it is. Ninety substantive comments over four months followed by one link post reads as a person.

**Recommended operating ratio at studio scale: 20:1 or better on link posts, and ideally 0 link posts** from the accounts you use for participation — see §1.6.

### 1.3 Building account history — the actual gates

Practitioner-reported thresholds ([ScreenFast, 2026](https://screenfast.app/blog/reddit-promotion-indie-ios-app)) — treat as directional, since every sub's AutoModerator config is private:

| Gate | Typical range |
|---|---|
| Comment karma before a sub will accept a post | 30–50 (permissive subs) to 500–1,000 (conservative subs) |
| Account age minimum | ~1 month; 2–3 weeks warm-up is the practitioner norm |
| Warm-up participation before any promo | 2–6 weeks of genuine commenting |

**Triggers that get accounts removed or suspended** (same source, consistent with Reddit's stated detection targets):

- New accounts posting at high volume
- Rapid cross-subreddit posting of the same or similar content
- Repeated links to the same domain
- Identical content in multiple subs
- Bot-like timing patterns
- VPN egress or IPs previously associated with banned accounts

**The single most important operational habit:** after posting, **open the subreddit in a logged-out private window and confirm your post is visible.** A removed post still appears normally on your own profile and in your own feed. Founders routinely conclude "Reddit didn't like my post" when in fact no human ever saw it. MailTest's Reddit post in [`case-studies.md` §8](./case-studies.md) died exactly this way, silently, on launch day.

### 1.4 Disclosure

Disclosure is cheap, protective, and works. The norms:

- **If you built it, say so in the first line.** "Disclosure: I built this." / "I'm the developer, so take this with the appropriate salt." Every sub that tolerates any self-promotion tolerates it more when disclosed, and the ones that don't will remove you either way — so you lose nothing.
- **Never recommend your own product in a thread without disclosing.** This is the specific act that gets a domain permanently banned and a studio named in a "these people are astroturfing" thread. It is also the highest-temptation move, because it feels like a small, helpful, natural mention.
- **Answer "what do you use?" honestly, including competitors.** The most credible comment you can write in your own category names three tools, one of which is yours, and is accurate about which is best for what. This is not a trick; it is the only version that survives contact with people who know the category.
- **Flair up.** Many subs offer developer/creator flair. Take it. Permanent, passive disclosure.

### 1.5 Why AI-generated comments get detected and nuked

This deserves a section because it is the most likely way an efficiency-minded studio destroys itself.

**Documented precedent.** In April 2025, University of Zurich researchers ran a covert experiment on **r/changemyview**, deploying **1,700+ AI-generated comments** over several months. The bots adopted fabricated personas — including *"a victim of sexual assault"* and *"a psychologist who specializes in abuse"* — and personalised replies by inferring each target's gender, age, ethnicity, location and political affiliation from their post history. Outcome: moderators filed a formal complaint, **Reddit banned every account associated with the research**, and Reddit issued **formal legal demands to the University of Zurich**. Ethics-committee approval did not protect them. ([dev.ua, 2025-04-29](https://dev.ua/en/news/reddit-1745918174))

Note what the researchers had that you don't: academic funding, careful prompt engineering, months of iteration, and no commercial motive. They were still caught, banned, and legally threatened.

**Why detection works, mechanically:**

1. **Platform-side classifiers.** Reddit's LLM-based anti-spam explicitly targets coordination patterns and "manufactured hype," not just individual message content. It sees your posting graph — timing, subreddit overlap, domain repetition, phrasing similarity across accounts — which no single comment can hide.
2. **Human pattern recognition, which is now extremely well-calibrated.** By 2026 the average Redditor has read tens of thousands of LLM outputs. The tells — tricolons, "it's not just X, it's Y," relentless even-handedness, an opening that restates the question, a closing that summarises, em-dashes, zero typos, no idiosyncratic opinion — are common knowledge. A comment that reads as generated gets called out, downvoted, and reported *even when it is factually excellent*.
3. **Corroborating context is checkable.** Community members click usernames. An account whose comment history is uniformly polished, topically scattered, and never wrong looks fake because it is unlike any real person's history.
4. **The penalty is asymmetric.** A great human comment gets 50 upvotes. A detected AI comment gets a mod ban, a domain ban, and a screenshot in r/AgainstAstroturfing. Expected value is deeply negative.

**Policy for the App Factory — non-negotiable:**

> **Never post an LLM-generated comment or post to Reddit, Hacker News, Product Hunt, Indie Hackers, or any Discord under a human identity.** Use LLMs to research which threads are worth answering, to draft internal notes, and to check facts. The text that gets posted is written by a person, in that person's voice, with that person's specific and occasionally wrong opinions.

This is not a moral position, it is a risk position: the downside is the permanent loss of the studio's single best organic channel, and the upside is saving twenty minutes.

**Corollary — no automation of engagement.** No scheduled posting, no reply bots, no "Reddit growth" SaaS that posts on your behalf, no upvote exchanges, no Telegram pods, no buying aged accounts. All of these are exactly what the classifiers are built to catch, and using them converts a survivable mistake into a coordinated-manipulation finding.

### 1.6 What genuine engagement looks like at a studio's scale

The hard constraint: **you cannot be authentically native to twenty communities.** Any plan that requires it will collapse into automation, which is the failure mode above. So the plan must be built around scarcity of attention.

**Structure that works:**

**One real human identity per person, not per product.** Named individuals from the studio, using their own accounts, permanently. Not "AppFactoryTeam." Not a fresh account per launch — that is ban evasion's shape even when it isn't ban evasion. Reddit's whole culture is built around persistent pseudonymous identity; a person with three years of history discussing music, running, and Swift is credible in a way no account created last month can be.

**Pick two or three communities per product and go deep, permanently.** Not ten. For a sleep app: one sleep sub, one ADHD-or-adjacent sub if genuinely relevant, one iOS sub. Read them daily. Comment where you know something. Accept that this is a 3–6 month runway before you post anything about your product, and that the runway is not skippable — it is the product.

**Weight comments over posts, roughly 20:1.** A single genuinely helpful comment reportedly earns "50+ upvotes and 5 to 10 product visits" ([ScreenFast](https://screenfast.app/blog/reddit-promotion-indie-ios-app)). That sounds trivial until you compare it to a Product Hunt #1 finish, which is worth ~1,000 visitors for three weeks of work ([Beep, `case-studies.md` §7](./case-studies.md)). Two hundred good comments over six months beats a launch, costs less, and cannot be taken away from you.

**Use the formats communities explicitly invite.**

- Weekly/monthly self-promo threads in r/SaaS, r/Entrepreneur, r/startups — low reach, zero risk, and mods notice that you used them.
- Beta recruitment in r/alphaandbetausers (41K), r/TestMyApp (28K), r/BetaTestersNeeded — this is what those subs are *for*.
- r/AppHookup (206K) for a time-limited free promotion — the sub's entire purpose. Expect bargain-hunter retention; take the App Store ranking movement and the reviews.
- Show-and-tell in r/SideProject (798K), r/IMadeThis, r/roastmystartup.
- AMAs and "I built X, here's what I learned" posts where the sub permits them.

**Lead with the artifact, not the ask.** The reliable Reddit and Indie Hackers genre is *specific numbers plus honest failure*. MailTest's post-mortem outdrew its own launch by orders of magnitude; Beep's write-up about winning Product Hunt outdrew winning Product Hunt. A studio has a structural advantage here — you ship many products and therefore accumulate many genuinely interesting comparative data points ("we shipped 6 apps; here's what the App Store analytics actually showed"). **That is content no solo founder can write, and it is the highest-leverage credible asset the App Factory owns.**

**Handle criticism in public and without defensiveness.** The ScrollGuard thread's top comment was a flat refusal to trust a closed-source app with device permissions. The developer engaged rather than deflected, and the thread reached 690 points. Communities reward people who take the hit visibly.

**Never ask anyone to vote.** Not the team, not the Discord, not friends. It's against the rules everywhere, it's detected (MailTest's friends' upvotes were suppressed for same-IP patterns), and a suppressed vote is indistinguishable from no vote — so the entire tactic has a maximum upside of zero and a real downside.

**Budget it honestly.** 3–5 hours per week of genuine reading and commenting by one or two named people, sustained for six months, before expecting anything. If the studio cannot commit that, do not enter Reddit organically — buy Reddit ads instead, where the rules are transparent and the failure mode is only money.

---

## 2. Hacker News

**The rules that bind:** no upvote solicitation (explicitly *"not ok on HN"* in the Show HN guidelines); voting-ring detection exists and fires; **direct-link referral upvotes don't count** and there is effectively one vote per IP, so vote campaigns are literally ineffective, not merely prohibited. Moderators (`dang` et al.) actively intervene and will publicly note astroturfing.

**Disclosure:** on HN, being the author is *expected and welcomed* — that's what Show HN is. In non-Show threads, always disclose before mentioning your product, in the same sentence: *"I built a thing in this space, so bias noted —"*. HN is unusually tolerant of self-interested comments that are honest and technically substantive, and unusually harsh on ones that aren't.

**The two specific ways studios burn HN:**

1. **Cadence.** HN gives one front page per product. ScrollGuard's relaunches scored 1 and 4 points ([`case-studies.md` §10](./case-studies.md)). Show HN's rules explicitly exclude version updates and platform ports. A studio that submits every new app and every new version reads as a firm running a channel, and moderators notice firms running channels.
2. **Marketing register.** Any sentence that could appear on a pricing page kills a thread. The highest-scoring posts are matter-of-fact and understated.

**What genuine participation looks like:** comment on other people's threads, in your actual area of expertise, with specifics — before you ever submit anything. Comments on HN accumulate real views and permit links; one practitioner account documents a single well-placed comment producing 590 visits ([Marketing Examples](https://marketingexamples.com/content/hacker-news)). That is a better return than most Show HNs, at a fraction of the risk.

---

## 3. Product Hunt

**The rules that bind:** vote solicitation is prohibited and enforced by spam filtering on IP/account patterns. Upvote-exchange groups (Telegram pods, "I'll upvote yours") are the most common violation and are detected. Featuring is a human editorial decision that a curator makes while looking at your product and, implicitly, at your reputation.

**Disclosure:** irrelevant — everyone on Product Hunt knows you're the maker. Responsiveness is the credibility currency. Answer every comment substantively on launch day; this is reported as a ranking input and is unambiguously an editorial input.

**The studio-specific risk:** launching many products from one account, close together, especially if they share a design system or a domain. The CEO's stated posture — *"We can't just feature everyone's AI wrapper"* and *"expect our bar to rise"* — is a filter aimed precisely at high-volume shippers. **Space launches out, and only launch products you'd defend to a curator's face.** A studio that launches six thin products gets a reputation with a small editorial team that also has a long memory.

---

## 4. Indie Hackers and Discord/Slack

**Indie Hackers.** Disclosure is the default and expected — it's a founder forum. The credibility risk is not shilling, it's **being boring or promotional**: launch announcements are ignored; specific numbers and honest failures get read. The one rule to observe: don't post the same launch text you posted everywhere else.

**Maker Discords/Slacks.** Reciprocal-attention economies. Post in the designated #showcase or #launch channel only. Give more feedback than you ask for; this is tracked socially and precisely. Never DM members with a pitch — it's the fastest way to be removed from a small community, and small communities talk to each other.

**User Discords (the ones that matter).** Assume zero promotion tolerance and moderators who are volunteers with no patience. The only entry is to be a genuine member for months. **At studio scale, pick at most one such community, for your single most important product.** Do not attempt this across a portfolio; you will either fail to be authentic or you will automate, and automating in a 2,000-person Discord where everyone knows everyone is instantly visible.

---

## 5. Incident response

Things will go wrong. What to do:

| Situation | Response |
|---|---|
| Post silently removed | Check logged-out. Read the sub's rules again. Message the mods **once**, politely, asking what to fix. Do not repost. |
| Post removed twice in the same sub | Stop posting there. That sub is closed to you for this product. |
| Account shadowbanned/suspended | Appeal through the official route once. **Do not create a new account** — that is ban evasion, a site-wide offence far worse than the original. |
| Domain banned from a subreddit | Modmail once, acknowledge the mistake plainly, ask what would need to change. Accept the answer. |
| Accused of shilling in a thread | Reply once, in your own voice, disclosing everything, without arguing. Then stop. Do not have a colleague defend you — that turns one accusation into proof of coordination. |
| Someone posts about your product organically | **Do nothing except disclose and answer questions.** Do not upvote it from the team. Do not amplify it in a way that reveals coordination. |

---

## 6. The one-paragraph policy

> App Factory people participate in communities as named individuals, using persistent personal accounts, in a small number of communities they actually care about, writing text they actually wrote. We disclose authorship every time we mention our own products. We never solicit votes, never automate engagement, never post LLM-generated text under a human name, and never create a new account to get around a removal. We use the promotional formats communities explicitly offer, and we treat every other post as an opportunity to be useful rather than seen. We accept that this is a six-month runway per community and that it does not scale to twenty communities — and we pick the two or three that matter instead of faking the rest.

---

## Sources

- [Reddiquette – Reddit Help](https://support.reddithelp.com/hc/en-us/articles/205926439-Reddiquette)
- Reddit Content Policy Rule 2 (authenticity / content manipulation) and vote-manipulation definitions — [Disrupting Communities, Reddit Help](https://support.reddithelp.com/hc/en-us/articles/360043066412-Disrupting-Communities)
- [Reddit deploys LLMs to combat AI-generated spam — Absolute Geeks](https://www.absolutegeeks.com/tech-news/reddit-deploys-llms-to-combat-ai-generated-spam-content/) · [TechBuzz](https://www.techbuzz.ai/articles/reddit-deploys-llms-to-fight-ai-generated-spam-epidemic)
- [University of Zurich covert AI experiment on r/changemyview — dev.ua, 2025-04-29](https://dev.ua/en/news/reddit-1745918174)
- [ScreenFast — Reddit Promotion for Indie iOS Apps: The Honest 2026 Playbook](https://screenfast.app/blog/reddit-promotion-indie-ios-app)
- [Show HN rules](https://news.ycombinator.com/showhn.html)
- [Marketing Examples — Hacker News](https://marketingexamples.com/content/hacker-news)
- [Product Hunt CEO AMA](https://www.producthunt.com/p/producthunt/i-m-the-product-hunt-ceo-and-i-ve-launched-8-times-on-ph-ama-unfiltered)
- Case evidence: [MailTest post-mortem](https://www.indiehackers.com/post/i-launched-on-product-hunt-today-with-0-followers-0-network-and-0-users-heres-what-i-learned-in-12-hours-1c89889702) · [Beep: Reddit vs Product Hunt](https://www.indiehackers.com/post/a-30-minute-reddit-post-brought-more-traffic-than-a-product-hunt-launch-we-prepared-for-3-weeks-15bff6d42e) · [ScrollGuard HN threads](https://news.ycombinator.com/item?id=44923520)
