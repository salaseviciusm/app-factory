# skip-hero — week-one launch calendar (D-3 → D+7)

**Status: DRAFT for the marketing-calendar founder gate. Nothing here has been posted,
queued, registered, or paid for.**

**Drafted:** 2026-09-14 by product-lead. **Reviewer:** chief-of-staff → founder gate.

---

## The ship date is provisional and is not decided

> **Provisional launch day: Monday 2026-09-28** (T+14 from drafting).
> **This date is mine, not yours.** The real ship date has been unanswered for 23 days, and
> a calendar that waits for it produces nothing. So every entry below is expressed as
> **D-n / D+n relative to launch day**, not as a wall-clock date. Name any launch day and
> the calendar slides intact — the only thing that changes is the date column, which is
> printed in grey-italic to make that visible.

The provisional date is also a **test**: §7 lists every asset that does not exist yet and
what it costs to have it by D-3. If that list says 2026-09-28 is not reachable, the honest
output of this gate is a later date, not a compressed calendar.

---

## 1. What is actually true today (verified, not assumed)

Checked against `~/src/skip-hero` at `5685bc0` and `~/src/app-factory` at `55bd662`, today.
This section exists because the 2026-08-06 content plan was built on a shot that could not
be taken (`apps/skip-hero.md` §6.2), and I am not repeating that.

| Thing the calendar depends on | State | Consequence for week one |
|---|---|---|
| **App Store listing** | **Does not exist.** `apps/mobile/app.json` at `version 0.1.0`, bundle id `com.salaseviciusm.skip-hero` reserved, nothing submitted | Rank 0 is unmet. Every post below lands on nothing until this ships — see Q2 |
| **Paywall / IAP** | **Not in the repo.** No StoreKit, no RevenueCat, no purchase code anywhere in `apps/` or `packages/` | v1 is free-by-default unless you say otherwise (Q2). Freemium = permanently organic-only (`platforms/paid/triggers.md` §3) |
| **F1 footwork readout** | **Half shipped.** The live session screen carries a left / total / right landing row (`apps/mobile/src/app/session.tsx:212-214`, free mode). **`summary.tsx` has no landing breakdown at all** | The wedge is filmable **live** — the "113 landings: 48 left, 45 right" payoff shot is **not**. Calendar films the live read only |
| **F2 asymmetry stat** ("you favour your right, 58/42") | **Not shipped**, and no accuracy study exists for it | **Do not film.** Not on this calendar at any position. `apps/skip-hero.md` §7 gap 3 |
| **Tile rush** | Shipped (`tile-rush.tsx`), incl. trip penalty + hands-free gestures | Filmable today, zero product work |
| **"Save video"** | Shipped, but it shares **raw session footage** (`summary.tsx:226-245`) — not the branded skeleton replay (F7) | It is not a marketing asset and it does **not** solve the torso problem. See the production rule below |
| **Apple Health / Watch** | **Not shipped** (no HealthKit reference in the repo) | Will be the most common comment. Answer honestly; it becomes a comment-reply video, not a promise |
| **Instrumentation (F8)** | **Not started.** No acquisition envelope, no `app-install-attributed`, no AdServices token | **The one diagnostic — installs per 1,000 views — cannot be computed in week one.** Every install number below is `unmeasured` at source; the substitutes are named per row |
| **Content pipeline / Postiz / `~/factory-media`** | **None of it exists.** No inbox directory, no queue | Week one is **manual**: founder films, I cut locally (ffmpeg + auto-editor + `.ass` captions, £0), founder uploads |
| **@skiphero handles** | **Unverified / unregistered.** `naming-aso.md` decision #8 ("do it this week", 2026-08-02) was never actioned | Founder-only action. No accounts, no calendar — see Q3 |

---

## 2. Channels: two, and the one I am dropping

**In week one: Instagram Reels + YouTube Shorts.** One vertical edit, two uploads, near-zero
marginal cost — the exact shape of the factory's only structural advantage
(`synthesis/ranking.md` #1). YT Shorts is the half that carries the install path: its
description and pinned comment are clickable; IG's acquisition surface is not.

**Dropped: TikTok.** *A brand-new account posting the same edit as a third upload is the
literal signature of the originality crackdown, whose penalty is silent search-restriction
we cannot detect — a week-one risk we cannot measure against an upside we cannot measure
either.* (`platforms/tiktok/credibility.md` §1; small-account reach −59% YoY, median ~500
views/post.) It comes back in week three, as its own edit, after the IG/Shorts read exists.

**Not a week-one channel, by definition: YouTube long-form.** It pays out in month 4, not
week 1 (`ranking.md` #3). D+7 hands over a brief for the first long-form piece; nothing
more.

**Reddit: nothing, deliberately.** Participation-only, 6-month runway, and our posting shape
is the documented ban signature (`failures/post-mortems.md` §5).

### Standing production rules (not negotiable line items — they are cheap and they protect the read)

1. **Shirt on, or framed from the knees down.** IG tests every post on a small stranger
   audience first; that is our only fast signal. A silent body-exposure down-rank would make
   us read "hook didn't land" when the truth is "torso was flagged" — it corrupts the
   feedback loop, invisibly. Cost: £0. (`apps/skip-hero.md` §5, tagged directional.)
2. **The app must never claim to name a move.** No "boxer step: clean." There is no move
   classifier. Standing copy constraint from **D28**.
3. **8–15 *distinct* clips from one film session — never one clip cut 15 ways.**
4. **Every comment answered in the first ~2 hours, by the founder, in one line.** It is the
   only in-video path to the store on IG (`playbook.md` §5).

---

## 3. The calendar — D-3 → D+7

*Dates are the provisional anchor only. The D-column is the real schedule.*

| Day | *(provisional)* | Channel | Asset | Owner | Cheapest-viable cost |
|---|---|---|---|---|---|
| **D-3** | *Fri 2026-09-25* | — (prep) | Store listing live-check; @skiphero IG + YT profiles created, bio + link destination set; pinned-comment App Store string written | **founder** (accounts) / me (copy) | £0 + ~20 min founder |
| **D-2** | *Sat 2026-09-26* | — (prep) | **The one film session.** 8–15 distinct clips, shirt on, propped phone: tile rush cold open, the miss at ×12, three tempos, trip penalty, hands-free, setup ritual, live footwork read, £199-vs-£0 | **founder** (~40 min filming) | £0 + ~40 min founder |
| **D-1** | *Sun 2026-09-27* | — (prep) | I cut/caption/render all 8 posts locally (ffmpeg + auto-editor + `.ass`); founder approves each render (~20s each) | **me** (cut) / **founder** (gate) | £0 + ~5 min founder |
| **D0** | *Mon 2026-09-28* | IG Reels + YT Shorts | **Tile rush cold open.** Lanes falling, feet hitting, combo to ×8. 12s, no VO, one text card at 0.5s: *"jump rope, but it's Guitar Hero for your feet."* | me (edit) / founder (upload + comments) | £0 + ~25 min founder |
| **D+1** | *Tue 2026-09-29* | IG Reels + YT Shorts | **The live footwork read.** Split screen: feet left, the live left/right landing row right, in sync, deliberately alternating. No VO. *The wedge (D28).* | me / founder | £0 + ~25 min founder |
| **D+2** | *Wed 2026-09-30* | **IG Reels only** | **Setup ritual / propped-phone POV.** Phone against a wall, walk back six feet, presence check goes green, counter climbs. The ASMR-shaped broad-reach filler | me / founder | £0 + ~20 min founder |
| **D+3** | *Thu 2026-10-01* | IG Reels + YT Shorts | **The miss.** Build to ×12, break it, genuine reaction. Caption is the score to beat. Comment-bait by construction | me / founder | £0 + ~25 min founder |
| **D+4** | *Fri 2026-10-02* | IG Reels + YT Shorts | **£199 vs £0.** Crossrope's paywalled-counter pricing on screen, then the same count on a propped phone with a £10 rope. One cut, fact-based, no sneering | me / founder | £0 + ~25 min founder |
| **D+5** | *Sat 2026-10-03* | IG Reels + YT Shorts | **Comment-reply video #1** — the most-asked real question from D0–D+3, filmed as an answer. (Most likely: *"does it do Apple Watch?"* → honest no.) Requires ~5 min of founder re-filming | founder (film) / me (cut) | £0 + ~30 min founder |
| **D+6** | *Sun 2026-10-04* | IG Reels + YT Shorts | **Trip penalty + hands-free.** Catch the rope, TripBloom fires, −50, recovery, back in. Then an arm raised to pause. *"It knew I tripped before I did." / "Never touched the phone."* | me / founder | £0 + ~25 min founder |
| **D+7** | *Mon 2026-10-05* | IG Reels + YT Shorts | **Week-one honest recap** + I hand over the brief for the first YouTube long-form ("I counted jump ropes four ways: £10 rope, LCD handle, Apple Watch, a camera") and **book the month-3 review** | me / founder | £0 + ~25 min founder |

**Totals:** 8 posts, 15 uploads, one film session. IG 8/week (band is 5–8 ✓). YT Shorts 7/week
(band is 4–7 ✓ — which is exactly why D+2 is IG-only). Founder time across the whole week:
**~40 min filming + ~5 min gates + ~20–25 min/day of comments ≈ 4 hours.**

---

## 4. Success signals, and what happens if each misses

**Read this first: week one is 8 posts. The floor for drawing any conclusion is 30**
(`failures/taxonomy.md` F5). Nothing below is a verdict. They are **tripwires** — each one
fires an action, and none of them fires "the app is working" or "the app is dead."

**And the honest caveat on all of it:** with F8 not shipped, **installs-per-1,000-views —
the single diagnostic the playbook names — is not computable in week one.** `unmeasured`
below means exactly that: not "roughly zero", not "we'll estimate it". The substitutes named
are the best available and they are weaker.

| Day | Success signal (a number) | If it misses |
|---|---|---|
| **D-3** | Both accounts live and the store listing is **Ready for Sale**, ≥24h before D0 | **D0 does not happen.** The whole calendar slides by however many days the listing takes. Posting into a dead link is the LifePilot failure (2,000 views → 11 downloads) |
| **D-2** | **≥8 distinct clips** in the can, each a different premise | <8 → the week runs short rather than recutting one clip more ways. I drop the last day, not the distinctness rule |
| **D-1** | **8/8 renders approved** by the founder in ≤5 minutes total | Any render that needs >20s of attention gets cut from the week, not fixed. "If it can't survive 20s of your attention, it won't survive a viewer's 2" |
| **D0** | **≥1 comment** and **≥3% 3-second view rate** on IG (IG's own stranger-test surface) | 0 comments on the launch post is not yet signal (n=1). Logged, no action until D+3 |
| **D+1** | **The wedge post out-comments the D0 tile-rush post.** Wedge > distribution experiment on engagement | If tile rush wins on engagement two weeks running, that is a **positioning question for you**, not a decision I take — D28 says tile rush is a distribution experiment, not positioning. It goes to a founder gate, not into the calendar |
| **D+2** | IG reach **≥ the D0 post's** (the filler is supposed to be the broad one) | If the ASMR filler underperforms the wedge, drop filler from week two and spend the slot on a second comment-reply video — strictly better content for free |
| **D+3** | **Cumulative ≥4 comments** across the 4 posts so far | Still under the 10-post threshold where "0 comments" means "nobody was close to installing" (F2). Do not rewrite hooks yet — that is the trap |
| **D+4** | **YT Shorts description link clicks ≥1% of views**, cumulative (the only channel that exposes this; IG is `unmeasured`) | <1% = wrong-intent audience (F2). Action: rewrite hooks to the *moment of pain* and re-test for 10 posts — **not** a channel change |
| **D+5** | **≥1 real question** worth a reply video existed (i.e. the day's asset had a source) | No question = nobody engaged enough to ask. Substitute a second tile-rush cut and flag it in the D+7 recap as the week's weakest signal |
| **D+6** | **App Store impressions → downloads ≥15%** for the week (App Store Connect; available without F8) | <15% = the funnel is broken **downstream of the content** — listing, screenshots, locale. Fix the listing before making more content (F4) |
| **D+7** | Three numbers exist and are written down: total views, total link clicks, total first-time downloads. **Not a target — an existence check** | If any of the three cannot be produced, that is the F8 instrumentation gap made concrete, and it becomes the top of the week-two agenda |

**Week-one kill/pivot triggers that are explicitly NOT armed yet:** views→clicks <1% (needs
10 posts), comments=0 (needs 10 posts), any retention or MRR trigger (needs months).
Arming them early is how a normal week gets mistaken for a failure. Baseline for
calibration: the median subscription app is at **$72/month at one year**, and a flat
months-3–8 stretch is the *modal* path (`failures/bootstrapped-baseline.md`).

---

## 5. What I need from you — three items, each with a default

Silence is answerable. If you say nothing, the default happens.

**Q1 — The ship date. Is 2026-09-28 real?**
*Default on silence:* 2026-09-28 stays provisional and **D-3/D-2/D-1 run as a rehearsal** —
you film, I cut, **nothing is posted**. The eight assets sit on disk and stay valid for any
launch day you name later. Cost of the default: ~45 founder-minutes, £0, no risk. The one
thing it does not buy is a launch.

**Q2 — F0: the store listing, and whether v1 has a paywall.**
There is no listing and no purchase code. *Default on silence:* I prepare the **listing copy
only** — title `Skip Hero: Jump Rope Counter`, subtitle `AI footwork trainer & skip game`,
keywords per `naming-aso.md` — and **v1 ships free with no paywall and no IAP**. Be clear
what that default costs: it forfeits the hard-paywall lever (10.7% vs 2.1% D35) and, per
`platforms/paid/triggers.md` §3, a freemium app **never** qualifies for a paid budget. I am
not setting a price — pricing and store config are yours (D-rule). I am telling you that
silence sets one.

**Q3 — The two things only you can do: @skiphero handles, and ~20 min/day of comments.**
I cannot register accounts and the pipeline has no write access to comment endpoints, by
design. *Default on silence:* no accounts on D-3 → **Q1's rehearsal default absorbs it**, and
the D+5 comment-reply video is dropped from the calendar, since it has no source. That drop
removes the cheapest genuinely-original content in the week.

---

## 6. Booked at launch, not after: the month-3 review

Put on the calendar **now**, at D+90, with four pre-agreed outcomes — **continue / change
price / change positioning / kill**. The dangerous period for a portfolio studio is the quiet
months, not the loud week, because founder attention moves to the newest app
(`failures/taxonomy.md` F14). Booking it before launch is the single cheapest process
artifact on this page.

---

## 7. What a 2026-09-28 date actually costs — every asset that does not exist yet

Working days. `unmeasured` means I could not establish a lead time, not that it is short.

| # | Asset | State | Lead time to ready | Blocks |
|---|---|---|---|---|
| 1 | **App Store listing** — title, subtitle, keywords, description, privacy nutrition label | Copy drafted in `naming-aso.md`; **nothing submitted** | ~1 day to assemble + Apple review (`unmeasured` for this account; commonly ~24–48h, no first-hand data) | **D0. Everything.** |
| 2 | **Screenshots + app preview video** (6.7" + 6.1", per locale) | **None exist** | ~0.5 day from the D-2 footage — but only *after* the film session, which is D-2 | D0 |
| 3 | **@skiphero on IG + YouTube** (and skiphero.app) | **Unregistered / unverified** | ~20 min, **founder-only** | D-3, so D0 |
| 4 | **Link destination for the IG bio** | Does not exist (IG has no clickable acquisition surface — it is a 3-hop funnel) | ~1h for a one-page redirect, £0 | D0 install path |
| 5 | **Paywall / IAP** | **No purchase code in the repo** | A feature-dev run: `unmeasured`, realistically multiple days | Gate 2 and every future paid option |
| 6 | **PPP pricing + full store localisation** | Not started; the highest-ROI free work in the whole corpus (M6) | ~1 day, automatable portfolio-wide — **but needs a price to exist first (#5)** | Conversion, every locale |
| 7 | **F8 instrumentation** — acquisition envelope, `app-install-attributed`, AdServices token, RPI by cohort-day | **Not started** | A feature-dev run: `unmeasured` | **The week-one diagnostic.** Without it, installs-per-1,000-views is not computable, ever, retroactively |
| 8 | **F1 second half** — landing breakdown on `summary.tsx` | Live row shipped; **summary has nothing** | Small — the detector already emits it and `debug.tsx:183-210` already renders it | The wedge's *payoff* shot; a stronger D+1 |
| 9 | **F2 asymmetry projection** + an accuracy check | **Not shipped, never measured** | `unmeasured`, and gated on filming a deliberate 60/40 session first | Do **not** film it. A wrong readout on video is worse than no readout |
| 10 | **F7 branded skeleton-replay export** | Not in the app (`scripts/debug-video.sh` renders it offline) | `unmeasured` | The growth loop, and the clean fix for the torso constraint |
| 11 | **Content pipeline** — `~/factory-media` inbox, watcher, Postiz queue | **None of it exists** | `unmeasured`. Week one runs manually without it; week four does not scale without it | Cadence beyond ~8 posts/week |

**The honest read of this table.** Items 1–4 are the only ones that must land by D-3, and
together they are roughly **two founder-touched days plus Apple review**. That makes
2026-09-28 *reachable* — but only for a **free app with no instrumentation**, which means
week one produces content and a download count and **not a measurement**. Items 5 and 7 are
the ones a later date actually buys. That trade is the gate question, and it is yours.

---

## Sources

`synthesis/ranking.md` · `synthesis/platform-selection.md` · `synthesis/playbook.md` ·
`apps/skip-hero.md` · `failures/bootstrapped-baseline.md` · `failures/taxonomy.md` ·
`platforms/{instagram,youtube,tiktok,communities,paid}/*` ·
`~/src/skip-hero/marketing/{strategy,content-calendar,content-samples,naming-aso,brand-direction}.md`
(2026-08-06 — tested, not restated; its errors are catalogued in `apps/skip-hero.md` §6) ·
`docs/process/decision-log.md` **D27**, **D28** · `~/src/skip-hero` @ `5685bc0`, read today.
