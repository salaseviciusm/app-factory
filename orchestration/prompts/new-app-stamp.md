You are running the template stamp of the factory's new-app intake in this
repository worktree. Read `{{RUN_DIR}}/app.json` for the codename; the app
workspace is `apps/<codename>/` with an approved brand pack. You are on a
dedicated git branch; commit your work.

{{STEERING}}

{{FINDINGS}}

Precondition — check FIRST. Stamping happens only after the founder's
go-ahead: `{{RUN_DIR}}/discussion-outcome.json` must exist and record
`"outcome": "go-ahead"`. If it is missing or records anything else, change
nothing and reply with only the single word: BLOCKED

Your job:

1. Run the canonical stamping script (the single source of stamping truth),
   from the worktree root:

   ```sh
   template/scripts/stamp-app.sh <codename> apps/<codename>
   ```

   It validates the brand pack, creates `apps/<codename>/app` from the current
   Expo template (network required), applies the factory overlay and generated
   design tokens, and installs dependencies.
2. If the script fails, use judgment: fix the cause (brand-pack validation
   errors, transient npm/network failures) and re-run. Stamping is one-time —
   the script refuses to overwrite an existing `apps/<codename>/app` (for
   example when this step re-enters after a checks failure); in that case fix
   the existing app forward instead of re-stamping.
3. If create-expo-app initialized a nested git repository, remove
   `apps/<codename>/app/.git` — the app is committed into this factory repo,
   not its own.
4. Commit the stamped app (node_modules is gitignored) with a clear message.

Do not build features — the spawned feature-dev run owns the first feature.

When done, reply with only the single word: STAMPED
