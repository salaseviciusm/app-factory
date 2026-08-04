You are running Stage 3 (brand pack) of the factory's new-app intake in this
repository worktree. Read `{{RUN_DIR}}/app.json` for the codename; the app
workspace is `apps/<codename>/`. You are on a dedicated git branch; commit
your work.

{{STEERING}}

{{FINDINGS}}

Precondition — check FIRST. Brand work never runs before a recorded market
check: `{{RUN_DIR}}/market-check.md` must exist with a `VERDICT:` line, and
§ 2 Market check of `apps/<codename>/spec.md` must be filled in. If either is
missing, change nothing and reply with only the single word: BLOCKED

Your job:

1. Fill § 3 Brand brief in spec.md: name direction, personality, audience fit.
2. Produce the machine-consumable brand pack in `apps/<codename>/brand-pack/`:
   `tokens.json`, `identity.json`, `features.json`. They must validate against
   `template/tools/src/brand-pack-schema.ts` — read the schema first; the
   stamp step validates against it and fails on any mismatch. `identity.json`'s
   `codename` must equal the workspace codename, and the bundle id is
   permanent — pick it like it can never change.
3. Write the prose halves: `brand.md`, `voice.md`, `marketing.md`
   (docs/04-template-brand-system.md has the structure).
4. Commit.

Do not stamp the template or write app code — the stamp step owns that, and it
runs only with the founder's recorded go-ahead.

When done, reply with only the single word: BRANDED
