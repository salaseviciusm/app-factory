# Cross-platform ranking — where a zero-budget, screen-recording app factory actually posts

**Compiled:** 2026-08-05. Wave 3 synthesis. Draws on every Wave 1/2 bundle; each ranking
carries its evidence pointer.

**The situation this ranks for, precisely.** Bootstrapped, **near-zero paid budget**, a
portfolio of **consumer camera/fitness apps** (pullup, skip-hero, running-with-pace), whose
**only raw marketing input is the founder's screen-recordings and demos, edited by AI
agents**. That input shape decides everything below: it is vertical-video-native and
participation-hostile. A platform that consumes founder demos at near-zero marginal cost
ranks high; a platform that needs the founder's *relationship hours* — which the pipeline
cannot manufacture — ranks low, no matter how good its audience is.

Tags carried from source: `[DOCUMENTED]` / `[ANECDOTAL]` as defined in the platform bundles.

---

## The one-line answer

> **Post the same vertical edit to Instagram Reels + YouTube Shorts + TikTok (in that order
> of confidence), build the YouTube search-library and third-party-review motion in
> parallel, and do everything else — Reddit, X, LinkedIn, HN, Product Hunt, paid — either
> narrowly-and-manually or not yet. The App Store listing is not on this list because it is
> the precondition for all of it.**

The factory's structural advantage is *throughput of edited demo video*. Exactly three
platforms monetise that advantage organically. The rest either punish volume (Reddit, HN),
cannot contain consumer buyers (X, LinkedIn), or cost money the studio has decided not to
spend (paid).

---

## Rank 0 (the precondition, not a channel) — the App Store listing + ASO

Every install from every platform below lands on a store page, and **the store page is
where indie apps most reliably die** — not the content.

- LifePilot: ~2,000 short-form views → 182 store impressions → **11 downloads** because the
  US listing rendered in Italian (`failures/taxonomy.md` F4; `platforms/tiktok/case-studies.md` F2). `[DOCUMENTED]`
- The ¥50,000 meditation app: 500 installs at £0.52 CPI that dropped the rating **4.5 → 3.2**
  and thereby suppressed conversion on every future install, paid *and* organic
  (`platforms/paid/case-studies.md` §9). `[ANECDOTAL]`

The highest-ROI free work in the entire research set is not social at all: **PPP pricing +
full store localisation** (Habit Pixel's dead-zone break-out, one-day tasks, automatable
across the portfolio — `failures/bootstrapped-baseline.md` M6), **App Store featuring
nominations** (template-level platform-tech adoption makes every app nominatable —
`platforms/paid/aso.md` §6), **Custom Product Pages** (~8% CR lift, keyword-assignable,
now surface in organic search — `aso.md` §2), and **holding ratings ≥4.0** (sub-3.5
suppresses visibility; 3→4 stars ≈ +89% conversion — `aso.md` §5). Do these before, and
regardless of, any platform ranking below. A leak here voids everything downstream.

---

## #1 — Instagram Reels + YouTube Shorts (one edit, two destinations)

**Why it's #1: best effort-per-reach, fastest honest signal, and it is the exact shape of
the factory's advantage.** One vertical cut posts to both surfaces at near-zero marginal
cost (`platforms/youtube/audience.md` §10). Both let a zero-follower account break through
by construction — IG states "creators of all sizes have an equal chance" and tests every
post on a small stranger audience first (`platforms/instagram/algorithm.md` §5); YT judges
every Short on its first second (`platforms/youtube/credibility.md` §2). `[DOCUMENTED]`

| Dimension | Verdict | Evidence |
|---|---|---|
| **Effort per unit reach** | **Best.** One edit → two uploads. IG *rewards* throughput: reach/post +12–24% up to 10+/wk (Buffer, 2.1M posts) | `platforms/instagram/credibility.md` §4 `[DOCUMENTED]` |
| **Time-to-first-signal** | **Fastest anywhere.** IG Trial Reels: shown to non-followers first, 24-hour read, zero grid cost — a free A/B harness against strangers. YT Shorts "Viewed vs swiped away" is the only true hook-quality metric either platform exposes | `platforms/instagram/algorithm.md` §4; `platforms/youtube/algorithm.md` §1 `[DOCUMENTED]` |
| **Volume tolerance** | **High on cadence, hard limit on *sameness*.** No frequency cliff exists; the real ceiling is duplication/watermarks (IG, silent total reach-kill) and templating | `platforms/instagram/credibility.md` §1, §4 `[DOCUMENTED]` |
| **Conversion to installs** | **Weak and leaky.** ~0.5% view→install; IG has no clickable link on the acquisition surface (3-hop bio funnel); YT Shorts descriptions/pinned comments *are* clickable — the tiebreaker | `platforms/instagram/algorithm.md` §9; `platforms/youtube/algorithm.md` §10 `[DOCUMENTED]` |
| **Ceiling** | IG is a *rental* (no evergreen, follower base decaying, Mosseri says stop optimising it); YT Shorts views are inflated by design. Neither compounds | `platforms/instagram/audience.md` §5; `platforms/youtube/algorithm.md` §9 `[DOCUMENTED]` |

**The honest caveat that keeps it from being a slam-dunk:** *no documented case exists of a
bootstrapped app grown primarily by the founder's **own organic** Instagram content.* Every
verified IG win was paid creator seeding (Cal AI's 250 creators, Umax's $50/creator) or an
unpaid third party (Widgetsmith) — `platforms/instagram/case-studies.md`, "what I could not
verify". This is #1 on *cost-and-fit*, not on *proof*. See `open-questions.md`.

**Why it's #1 for our apps specifically:** the densest impulse-consumer converting verticals
on both surfaces are fitness/body-composition/appearance, and our apps produce the exact
3-second visual reveal these platforms reward — "point camera, rep counts,"
"point camera, skips count" (`platforms/instagram/audience.md` §9).

---

## #2 — TikTok

**Why not #1: the biggest consumer audience and the sharpest AI-pipeline threat, in one
platform.** TikTok is the single best consumer product-*discovery* engine (63% discover
products there vs 38% on Google; 1-in-4 users search within 30s of opening —
`platforms/tiktok/audience.md` §2), and its highest-converting niches are precisely ours
(fitness, appearance, hobby trackers — §3). It takes the same edit as a third upload.

It drops to #2 on three documented facts:

1. **Small-account reach has collapsed.** Socialinsider (2M videos): 1K–5K-follower accounts
   fell from 860 to **350** median views/post YoY (−59%), while posting *more*. The median
   post gets ~500 views regardless of cadence (Buffer, 11.4M posts). `platforms/tiktok/algorithm.md` §3–4. `[DOCUMENTED]`
2. **The originality crackdown is the single most direct threat to an AI-edited pipeline.**
   Enforcement escalated 15 Sep 2025; "filters, overlays and minor edits do not make reused
   material original"; penalty is silent search-restriction, not a ban. Re-cutting one clip
   many ways *is* the definition. `platforms/tiktok/credibility.md` §1; `pipeline/risks.md`. `[DOCUMENTED]`
3. **No clickable in-video link** — the comment section is the entire install funnel, which
   is founder-relationship work, not pipeline work. `platforms/tiktok/algorithm.md` §8. `[DOCUMENTED]`

**But it holds #2, not lower, because of one thing the others don't have:** the
**search-query inventory** play — one video per real "app for X / how do I X" query, phrase
verbatim in speech + on-screen text + caption. It is called "the single most defensible
organic tactic on the platform for a studio with a demo library" (`algorithm.md` §6), it
is permanently discoverable high-intent inventory, and it is exactly what an agent pipeline
plus a demo library is built to mass-produce. Posting: **draft-mode upload + a human tap**
(no audit) — `pipeline/risks.md`.

---

## #3 — YouTube long-form (search) + third-party creator reviews

**Separated from #1 deliberately: Shorts and long-form are different products, and this half
is the only owned, compounding asset in the whole plan.** The docs stress this repeatedly —
"on Instagram, don't copy anyone; on YouTube, don't copy yourself" (`platforms/youtube/credibility.md` §8).

| Dimension | Verdict | Evidence |
|---|---|---|
| **Ceiling** | **Highest of any organic channel.** A search-ranked video installs users for years; subscribers compound; download-velocity → App Store rank halo means YT is *systematically under-measured* | `platforms/youtube/audience.md` §2, §5; case-studies WIN 2 `[DOCUMENTED / ANECDOTAL]` |
| **Time-to-first-signal** | **Slowest. Accept 3 months of nothing.** Search rankings and subscriber bases take months | `platforms/youtube/audience.md` §10 `[DOCUMENTED]` |
| **Effort per unit reach** | **Highest production floor.** A 6-min video that holds retention is genuinely hard to assemble from raw demos; cadence does *not* buy reach (YouTube states so) — so the factory's throughput advantage does **not** convert here | `platforms/youtube/algorithm.md` §6 `[DOCUMENTED]` |
| **Conversion** | **Best of the organic set.** Clickable links everywhere, higher price tolerance, and the highest-fidelity proof (using the app on camera for minutes) | `platforms/youtube/audience.md` §7 `[DOCUMENTED]` |
| **AI-volume tolerance** | Lowest — the inauthentic-content policy (3 named demonetisable categories, 16 Jul 2026) targets templated sameness by name. Defence is the *brief*, not the tooling | `platforms/youtube/credibility.md` §1 `[DOCUMENTED]` |

**The single highest-ROI action in this entire ranking lives here and is not "run a
channel":** getting the app into *someone else's* review video. HabitKit's best month ever
came from one MKBHD-adjacent mention; the founder's own Times Square billboard the same year
did ~nothing (`platforms/youtube/case-studies.md` WIN 1 / FAILURE 4). You cannot cause the
review; you can be findable and pitch a target list of 50 mid-size "apps I use" channels.
Costs outreach time, not production capacity. This is why YouTube ranks above the
don't-bother tier despite being slow.

**Every YouTube win in the corpus was organic** — the mirror image of Instagram. That makes
YT the bootstrapped studio's owned asset even though it pays out in month 4, not week 1.

---

## Don't-bother-yet tier (with the narrow exceptions spelled out)

These are not "bad platforms." They are platforms the factory's input shape does not feed,
or that the zero-budget constraint closes.

### Reddit & communities — *the* organic consumer channel, and structurally wrong for us
Reddit is the **only** organic surface that reaches consumer end-users at scale
(`platforms/communities/audience.md` thesis). It is in the don't-bother tier anyway because:

- It is **participation-only**, a documented 6-month runway per community, and *un-servable
  by a demo-editing pipeline* — the content is text, in a person's voice, in real time.
- Our volume + multi-app shape is the exact signature Reddit's classifier bans: Redchecker
  lost **two accounts in six weeks** to account-level *pattern* detection (`failures/post-mortems.md` §5; `failures/taxonomy.md` F8). Cadence is the liability, not the content.

**Narrow, manual exceptions worth taking:** r/AppHookup (206K) for a time-limited free-promo
install spike (bargain-hunter retention, but real App Store rank movement); one honest,
disclosed founder post per app in the sub that fits; and — the factory's genuine edge —
*"we shipped N apps, here's what the analytics showed"* comparative posts no solo founder can
write (`platforms/communities/credibility.md` §1.6). Never automated, never at volume.

### X / LinkedIn — zero for our category
Roman Koch ran X + LinkedIn + YouTube across **six consumer apps for a year: $1,464**
(`platforms/x-linkedin/case-studies.md` §6). The build-in-public audience is founders, and
*founders are not the market* for a pull-up counter — treat engagement from them as **zero
signal, not weak signal** (`platforms/x-linkedin/audience.md` §4). These become channels only
if the factory productises *itself* (a B2B/dev-tool audience) — until then, unbudgeted
founder brand, never reported as acquisition.

### Hacker News / Product Hunt — one-shot, and wrong audience for camera apps
HN: mobile apps hit ≥30 pts at **2.5%** and were 0.7% of the top 300; it is a one-shot,
dev/OSS/privacy channel (`platforms/communities/case-studies.md`, `algorithm.md` §2.3). PH:
a #1 finish is worth **~1,000 web visitors** (Beep, first-party), which for a mobile app is a
web→store→install funnel with three drop-offs. Neither fits pullup/skip-hero/running-with-pace.

### Paid (all channels) — closed until an app earns it
Under the zero-budget assumption, paid is out of scope. When an app later clears the gates
(`platforms/paid/triggers.md` §1–2: instrumentation, rating ≥4.0, D1≥30%, D30≥8% flattening,
300 organic installs/60d, ASO done, hard paywall with D60 RPI ≥ £1), the *only* two channels
open at bootstrapped scale are **Reddit Ads** (£100 hook test) and **Apple Ads Advanced,
UK-first** (£500) — everything ML-optimised (Meta, Google, TikTok auction) needs
£1,500–10,000/mo to exit learning (`platforms/paid/landscape.md` §9). Paid never *discovers*
a channel; it amplifies proven organic creative (every case in `platforms/paid/case-studies.md`).

---

## The ranking in one table

| Rank | Channel | Effort/reach | Time to signal | Volume tolerance | Conversion | Ceiling | Open now? |
|---|---|---|---|---|---|---|---|
| **0** | App Store listing + ASO | — | — | — | **decides all of it** | — | **Do first, always** |
| **1** | IG Reels + YT Shorts | **Best** | **24h (Trial Reels)** | High (sameness-capped) | ~0.5%, leaky | Rental | **Yes** |
| **2** | TikTok | Best (3rd upload) | ~days, median 500 views | **Riskiest** (originality) | Comment-funnel | Search inventory | **Yes** |
| **3** | YT long-form + 3rd-party review | High floor | **Months** | Low (templating) | **Best organic** | **Highest, compounds** | Yes, slow |
| — | Reddit / communities | Un-servable by pipeline | 6-mo runway | **Ban risk** | Real, at scale | Google-indexed | Manual only |
| — | X / LinkedIn | — | — | — | **~zero (consumer)** | — | No (until B2B) |
| — | HN / Product Hunt | One-shot | 24h | — | Web→store leak | Backlink | No (wrong apps) |
| — | Paid | £ | days–weeks | — | Gated | — | After the gates |

---

## The five load-bearing conclusions

1. **The factory's advantage (edited-demo throughput) monetises on exactly three surfaces:
   IG Reels, YT Shorts, TikTok.** One edit feeds all three. Everything else needs an input
   the pipeline can't produce.
2. **Judge every platform on installs-per-1,000-views by format, never on views.** A 12K-view
   video with 80 installs beats a 400K-view one with 10 (`platforms/tiktok/credibility.md` §6).
3. **YouTube long-form is the only compounding asset** and the only place a third-party review
   can 10× a month's work — run it slow and in parallel, never measured on cadence.
4. **Reddit is where the buyers are and the one place we structurally cannot go at volume.**
   Accept the narrow manual exceptions; do not let the pipeline near it.
5. **The store page and the rating gate the entire funnel.** Rank 0 is not optional — it is
   the difference between every ranking above mattering and none of them doing.
