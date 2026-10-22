# Changelog

## 0.3.1 — 2026-10-22

- Skills that run a bundled script now pre-approve only that script, so
  directory review no longer holds `Bash(node:*)` as a grant for any node
  command.

## 0.3.0 — 2026-10-19

- Getting started guide for a first install: working folder, setup, and what
  the plugin will and will not do.
- Stays standalone. Setup no longer reads an instance config, and skills name
  the practice profile as `~/change-practice/CLAUDE.md` rather than the plugin
  template.
- `readiness-review` treats a high-impact group that was never assessed as not
  ready, scores the candidate outside the record, and writes the checklist only
  after a yes.
- Draft guard treats Work IQ question-and-answer tools as reads. The
  people-data guard no longer reads dates, weeks or clock times as phone
  numbers.
- Skill descriptions no longer fold a line in the middle of a sibling skill
  name. The leader-facing case for change stays with `change-strategy`.
- Shared change-record conventions synced into the skills that link them.

## 0.2.0 — 2026-10-19 (alpha)

Artefact uplift across 14 skills so change managers start from leading-practice
material rather than blank templates. All new prose, questions and templates
are original; third-party methods are described in our own words and linked.

**Priority uplift**

- `stakeholder-pulse`: pulse survey question bank (six core questions, phase
  questions, champion prompts, results patterns, "no clear change" rule);
  pulse summary template written to `pulse/`; results CSV layout;
  `--design-survey` mode.
- `change-impact-assessment`: impact workshop guide with prompt questions for
  all ten dimensions; `starts`/`ends` columns and a heatmap in the register;
  `score_impacts.ts --portfolio` generates `portfolio.csv` rows for
  `portfolio-saturation`.
- `business-readiness`: `--organisational` mode with 24 questions across
  eight areas and verdict rules (`org-readiness.md`); evidence guide per
  go-live criterion; four confidence-check questions.
- `measurement-plan`: measure library by change type with activity-vs-adoption
  watch-outs; benefit-to-behaviour table and quality check in the template.
- `training-needs-analysis`: learning-method grid and four-level evaluation
  guide; `--plan` mode writing `training-plan.md` and `training-schedule.csv`.
- `communications-plan`: channel guide (frontline reach, phase rhythm);
  `change-story.md` (core narrative, key messages, hard questions); timeline
  and channel tables in the plan.
- `change-strategy`: ten-signal sizing worksheet; force-field guide and
  template; leader-facing case-for-change template.
- `change-network`: champion pack — role description, manager nomination
  note, onboarding / huddle / closing session plans.

**Secondary uplift**

- `comms-draft`: town-hall speaking notes with run sheet; shift-start briefing.
- `golive-transition`: hypercare issue-theme CSV; `--daily` check-in.
- `resistance-management`: transition plan for groups facing loss.
- `reinforcement`: mechanisms by weak sustainability factor; recognition
  guidance; reinforcement calendar.
- `lessons-learned`: retrospective guide and session sheet (`--retro`).
- `change-risk-assessment`: common people-side risk prompts per area.

**Alpha readiness**

- `evals/evals.json` added for every uplifted skill (14 skills now carry
  output-quality cases); new trigger queries for new modes.
- Change record conventions, README and attribution updated for the new
  artefacts. Alpha testing guide in `docs/ALPHA-TESTING.md`.

**Independent review fixes**

- Barrier diagnostic uses the plugin's own scale (in place / partly / not in
  place) and term ("sticking point") instead of Prosci's 1–5 "barrier point".
- Organisational readiness verdicts applied in order, with a provisional flag
  for thin evidence. Question IDs prefixed (`OR-`, `P-`) so they no longer
  collide with the health check.
- Trigger boundaries sharpened: resistance-management (never adopted) vs
  reinforcement (drift after adoption); stakeholder-pulse (reads across
  sources) vs change-network (logs champion notes); comms-draft vs
  communications-plan (change story). Near-miss trigger queries added.
- Conventions table now lists every file skills write (CSVs, snapshots,
  dated folders and their slugs); "Read by" links wired into the reading
  skills; unsourced figures relabelled as plugin defaults; people-data fixes
  in champion prompts and measures.

## 0.1.0 — 2026-10-19

- `change-practice`: single, multi-persona practice plugin at the repo root,
  following the design's skill catalogue, persona agents, hooks and connector
  policy.
- 25 skills as self-contained Agent Skills; shared references synced into each
  skill.
- Five persona agents with skill ownership and least-privilege scopes.
- Draft-never-send, people-data and practice-profile guard hooks.
- Microsoft 365 and Teams bundled in `.mcp.json` via Microsoft's Work IQ server.
- Seven scoring scripts, hooks, validator, reference sync and tests in
  TypeScript (Node 22.18+, no runtime dependencies).
- ChatGPT Work and Codex manifest in `.codex-plugin/plugin.json` (the Cursor
  manifest is retired). Install notes lead with Claude Cowork and ChatGPT Work.
