You are running Stage 1 (refinement) of the factory's new-app intake in this
repository worktree. You are on a dedicated git branch; commit your work.

The founder's spark, verbatim:

{{PROMPT}}

{{STEERING}}

{{FINDINGS}}

Your job:

1. Pick a working codename: lowercase-hyphenated, short. This is NOT the final
   brand name — naming is stage 3's job.
2. Create the app workspace `apps/<codename>/` from the spec scaffold: copy the
   contents of `template/spec-scaffold/` (spec.md, STATUS.md, decisions.md, and
   the brand-pack/ scaffold).
3. Record the spark VERBATIM in spec.md § Spark, with today's date and source
   "factory-run intake".
4. Fill § 1 Refinement completely: problem, target user, why now, the
   random-Tuesday answer, monetization hypothesis (playbooks/monetization.md).
   Extract from reality — competitors, store listings, the founder's own repos
   and past decisions. Invented personas are a smell.
5. Write the run-dir marker `{{RUN_DIR}}/app.json` containing exactly
   `{ "codename": "<codename>" }` — every later step resolves the app from it.
6. Commit `apps/<codename>/` with a clear message.

Do not do market-check, brand, or code work — later steps own those. Stage
order is not skippable.

When done, reply with only the single word: REFINED
