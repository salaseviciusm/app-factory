# UX Playbook

Judgment that can't be a library. Applied at stage 4 (design) and reviewed against at
stage 6 (build). Grounded in the founder's shipped work (skip-hero, running-with-pace).

## Principles

1. **One great interaction per app.** Every app names the single interaction that makes
   it feel great, and that interaction gets disproportionate design + engineering care
   (skip-hero: the live glow counter readable from meters away). Everything else can be
   conventional.
2. **Design for the usage posture.** Where is the phone, how far away, how much attention
   does the user have? Type scale, tap targets, and state signaling follow from posture,
   not from a generic scale. Write the posture into the spec.
3. **Data-driven features over branchy features.** Modes, lessons, and plans ship as
   data interpreted by one engine (skip-hero: "lessons are data, not code"). If a new
   feature means a new state-machine branch, question the design first.
4. **No dark patterns — ever.** From running-with-pace's brand rules: no guilt, no fake
   urgency, no social-pressure mechanics, no gamification tricks that manufacture
   compulsion. Retention comes from genuine usefulness. This also protects store review.
5. **Onboarding earns each screen.** Every onboarding step must either collect something
   the app needs or teach the one great interaction. Default is fewer screens; paywall
   placement follows the monetization playbook.
6. **Respect the platform.** iOS-native adaptive semantics where available; light+dark
   unless the brand pack explicitly commits to one (and then commits fully, as skip-hero
   does with dark).
7. **Live numbers are tabular.** Any number that changes on screen uses tabular numerals.
   Any state that matters at a glance is signaled by color/weight/glow, not by small text.

## Stage-4 deliverables checklist

- Screen inventory (route list with one-line purpose each)
- Flow notes for: first-open → aha moment; the one great interaction; paywall encounter
- Empty/loading/error states for every data-bearing screen (the forgotten 80% of polish)
- Copy direction referencing `voice.md` (tone per surface: buttons terse, empty states warm)
- Accessibility notes: dynamic type behavior, minimum contrast, haptics usage

## Review heuristics (for tech-lead / product-lead reviews)

- Can a new user reach the aha moment in under 60 seconds from install?
- Does any screen require explanation the UI doesn't give?
- Is anything animated that doesn't communicate state? (decoration budget: small)
- Would you be embarrassed to demo the empty states?
