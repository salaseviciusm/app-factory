# Agent Organization

The factory is staffed by agents with defined **profiles**: a role, a charter, the context
they load, what they may decide alone, and what they must escalate. Profiles live in this
repo (`agents/` once implemented) and are versioned like code.

## Org chart

```
Founder (Morkus) ── daily standup, approvals, direction
   │
Chief of Staff (OpenClaw primary agent)
   │        — runs the org, owns the standup, delegates, tracks status
   ├── Product Team
   │     ├── Product Lead ......... owns spec quality, runs the product process
   │     ├── Researcher ........... market sanity checks, competitor scans, ASO research
   │     └── UX Designer .......... interaction design, flows, screen inventory
   ├── Engineering
   │     ├── Tech Lead ............ owns architecture.md per app, reviews all merges
   │     ├── App Engineers (N) .... feature implementation on top of template
   │     ├── Data Engineer ........ analytics events, pipelines, portfolio dashboard
   │     └── QA Engineer .......... test plans, Maestro flows, release verification
   ├── Marketing Team
   │     ├── Marketing Lead ....... strategy per brand, weekly calendar, channel plan
   │     ├── Content Creator ...... copy, visuals briefs, video scripts
   │     └── Brand Designer ....... brand packs: identity, theme tokens, voice
   └── Ops
         └── Release Manager ...... pipeline health, store metadata, submission staging
```

Notes:
- "Team" ≠ always separate long-running processes. A profile is a *context + charter* that
  the chief of staff instantiates as a sub-agent session when there is work for it.
- Team leads (Product Lead, Tech Lead, Marketing Lead) are **reviewing roles**: sub-agent
  output flows through them before it counts as done. This is the org's quality mechanism.

## Agent profile format

Every profile is a markdown file with frontmatter:

```markdown
---
role: tech-lead
reports_to: chief-of-staff
reviews: [app-engineer, data-engineer, qa-engineer]
context:            # always loaded for this role
  - docs/03-coding-principles.md
  - <app>/architecture.md
decides_alone:      # no escalation needed
  - implementation approach within approved architecture
  - merge/reject engineer output
escalates:          # must go to chief of staff → founder if needed
  - architecture changes after spec approval
  - new dependencies with licensing/cost implications
  - anything touching credentials, payments config, or store metadata
---
Charter, working style, and quality bar for the role...
```

## Org restraint (D11)

The org chart above is a **menu, not a headcount target**. A profile is only instantiated
when there is work for it. Active set at start: chief of staff, product lead, tech lead,
one app engineer. Every additional activation — and any *new* role — needs a decision-log
entry naming the bottleneck it solves. More agents means more handoffs and more places to
stall; we scale the org behind the workload, never ahead of it.

## The daily standup

The steering heartbeat of the company. Runs in Slack (channel: `#factory-standup`),
prepared by the chief of staff on OpenClaw cron and **posted at 08:00** (founder-local).

Format (posted as one threaded message):
1. **Yesterday** — per active app: what shipped/merged, what's blocked, test status.
2. **Portfolio pulse** — installs, revenue, notable analytics movements (from Data Engineer).
3. **Today's proposal** — the chief of staff's suggested task allocation across the org.
4. **Needs founder** — pending gates (spec/submission/calendar approvals) and open questions.

The founder replies in-thread with adjustments; the chief of staff re-plans and delegates.
**Cutoff is 11:00** — no reply by then means the proposal proceeds as posted (gates always
still block). The standup is the *scheduled* steering point, not the only one: the founder
can message at any time for status or to change direction, and the chief of staff re-plans
immediately rather than waiting for the next standup.

## Delegation model

- Chief of staff decomposes standup outcomes into tasks with an assigned profile, the app
  context, and an explicit **definition of done**.
- Sub-agents work in isolated workspaces; leads review; the chief of staff only reports
  "done" upstream after review + green checks. No agent reports its own work as verified.
- Escalation path is always: worker → lead → chief of staff → founder. Escalations carry
  a recommendation, not just a question.

## Learning the founder's style (D13)

Agent profiles don't just carry role charters — they carry **how the founder works**,
distilled from live working sessions into `docs/process/example-run.md` → "Observed
founder patterns." When a pattern is observed (how he weighs options, when he wants
pros/cons, how he paces investment, what he pushes back on), it's added there and the
relevant profiles are updated. The org's target is autonomy in the founder's style,
not a generic one.

## Institutional memory

- Every app ships with a **retro** run by the chief of staff; accepted learnings become
  edits to principles/playbooks/templates via PR (reviewed at standup).
- Decisions of consequence get an entry in the app's decision log; factory-wide ones in
  `docs/process/decision-log.md`.
