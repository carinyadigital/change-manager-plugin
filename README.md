# Change Manager Plugin for Agents

A single, multi-persona **practice plugin** for organisational change managers,
for Claude Code, Claude (Cowork) and Cursor. One install gives a change lead
and their team a skill library for the full Prepare → Manage → Sustain
lifecycle, writing to one shared **change record** in `docs/change/` so each
piece of work builds on the last.

It covers **people change** — helping groups of people adopt a new system,
process, structure or policy. It does **not** cover IT change control (change
requests, change advisory boards, release approvals).

Every output is a draft for your review. Nothing is sent to employees, leaders
or customers by the plugin.

## Install

This repo is one plugin; the repo root is the plugin root. Add it to a
marketplace you already use with an entry whose `source` points at this repo,
or load it locally while developing:

```bash
claude --plugin-dir ~/Projects/change-manager-plugin
```

Bundled scripts and hooks are TypeScript that Node 22.18+ runs directly (Claude
Cowork runs Node natively). Users install nothing.

## First run

```
/change-practice:setup          # quick interview, or --full
```

Setup records your method (method-neutral by default), whether you hold a
Prosci licence, people-data jurisdiction, thresholds, cadence, comms approval
chain and whether you want distinct personas or one merged role, in a personal
practice profile. Every other skill reads it and falls back to
[defaults](references/rating-scales.md) if it is missing.

## Personas

Five persona agents share one skill library. Each owns a set of skills and
works only with the tools it needs.

| Agent | Owns |
| --- | --- |
| **change-lead** | `understand-change`, `change-impact-assessment`, `change-risk-assessment`, `change-strategy`, `golive-transition`, `bau-handover`, `lessons-learned`, `weekly-status`, `meeting-prep` |
| **stakeholder-sponsor-coach** | `stakeholder-analysis`, `sponsor-assessment`, `sponsor-engagement`, `stakeholder-engagement`, `change-network`, `resistance-management`, `stakeholder-pulse` |
| **comms-specialist** | `communications-plan`, `comms-draft`, `reinforcement` |
| **training-designer** | `training-needs-analysis` |
| **readiness-adoption-analyst** | `measurement-plan`, `business-readiness`, `readiness-review`, `portfolio-saturation`, `adoption-measurement` |

`setup` and `skills-index` serve every persona. Not sure where to start?
`/change-practice:skills-index`.

## Skills

Type: **A** authoring (draft for review) · **R** read-only review or gate · **F** fix/update

| Phase | Skill | Type | Writes (under `docs/change/`) |
| --- | --- | --- | --- |
| — | **setup** | A | Practice profile (personal config) |
| — | **skills-index** | R | Nothing — recommends the next skill |
| Prepare | **understand-change** | A | `scope.md` |
| Prepare | **stakeholder-analysis** | A | `stakeholder-register.md` / `.csv` |
| Prepare | **change-impact-assessment** | A | `impact-register.md` / `.csv` |
| Prepare | **change-risk-assessment** | A | `risk-register.md` |
| Prepare | **sponsor-assessment** | R | `pct-assessment.md` |
| Prepare | **change-strategy** | A | `strategy.md` |
| Prepare | **measurement-plan** | A | `measurement-plan.md` / `.csv` |
| Manage | **sponsor-engagement** | A | `sponsor-plan.md` |
| Manage | **stakeholder-engagement** | A | `engagement-plan.md` |
| Manage | **change-network** | A | `change-network.md`, `network-feedback.csv` |
| Manage | **communications-plan** | A | `comms-plan.md` / `.csv` |
| Manage | **comms-draft** | A | `comms/<id>.md` — never sends |
| Manage | **training-needs-analysis** | A | `tna.md` / `.csv`, `qrg/` |
| Manage | **business-readiness** | R | `readiness-checklist.md` / `.csv` |
| Manage | **readiness-review** | R | `go-no-go.md` |
| Manage | **resistance-management** | A/F | `resistance-log.md` |
| Manage | **golive-transition** | R/A | `golive-plan.md` |
| Manage | **portfolio-saturation** | R | `portfolio-heatmap.md`, `portfolio.csv` |
| Manage | **stakeholder-pulse** | R | Proposed rows for `resistance-log.md` |
| Manage | **meeting-prep** | A | Optional `meetings/<date>-<slug>.md` |
| Sustain | **adoption-measurement** | R | `adoption-report.md` |
| Sustain | **reinforcement** | A | `reinforcement-plan.md` |
| Sustain | **bau-handover** | A | `handover-pack.md` |
| Throughout | **lessons-learned** | A | `lessons-learned.md` (append) |
| Manage/Sustain | **weekly-status** | A | `status/<YYYY-Www>.md` |

The record's structure, front block and writing rules:
[references/change-conventions.md](references/change-conventions.md).

## Daily and weekly workflows

| Workflow | How |
| --- | --- |
| Daily stakeholder pulse | `stakeholder-pulse` → deeper issues to `resistance-management` |
| Meeting prep and follow-up | `meeting-prep` (`--follow-up` after the meeting) |
| Comms that never send | `communications-plan` → `comms-draft`; you approve and send |
| Readiness check | `business-readiness` on cadence; `readiness-review` at the gate |
| Weekly status | `weekly-status` drafts the RAG report from the record |

## Guardrails

| Guardrail | How |
| --- | --- |
| Draft, never send | Comms are saved to `docs/change/comms/`. The `draft_guard.ts` hook asks for confirmation before any connected tool sends, posts, publishes or creates calendar events. |
| People data | Groups and roles, not individuals. The `people_data_guard.ts` hook asks before personal emails or phone numbers are written to the record. Sentiment is reported only for groups at or above the minimum size. |
| Profile writes | Only `setup` writes the practice profile. The `profile_guard.ts` hook asks before any write to it. |
| Grounded output | Unknowns are asked or marked `[ASSUMPTION — confirm with …]`. No invented names, numbers or quotes. |
| Read-only gates | `sponsor-assessment`, `business-readiness`, `readiness-review`, `portfolio-saturation` and `adoption-measurement` write only their own verdict and name the skill that fixes each finding. Decisions stay with named people. |
| Method IP | Prosci (ADKAR, PCT), Kotter, Bridges, ACMP and others are described in our own words with attribution — see [methods.md](references/methods.md). |

## Bundled scripts

Deterministic helpers so scores are consistent from run to run. They are
TypeScript, standard library only, run with `node <file>.ts`:

| Script | Skill |
| --- | --- |
| `score_impacts.ts` | change-impact-assessment |
| `grid.ts` | stakeholder-analysis |
| `coverage.ts` | change-network |
| `gap_summary.ts` | training-needs-analysis |
| `readiness_rag.ts` | business-readiness |
| `checklist_gate.ts` | readiness-review |
| `heatmap.ts` | portfolio-saturation |

## Connectors

The plugin bundles Slack and Atlassian in `.mcp.json` and expects Microsoft 365
through Claude's connector. All are optional: every skill degrades to paste or
upload. See [CONNECTORS.md](CONNECTORS.md) for categories, suggested servers
and the read-first / draft-never-send policy.

## Repo layout

Follows the [Agent Skills](https://agentskills.io/specification) standard:
each skill is a self-contained folder.

```
.claude-plugin/plugin.json      # manifest (identical copy in .cursor-plugin/)
.mcp.json                       # bundled connectors: Slack, Atlassian
CLAUDE.md                       # practice profile TEMPLATE (setup writes a personal copy)
CONNECTORS.md                   # ~~category map and connector policy
agents/                         # five persona agents
hooks/                          # hooks.json + draft, people-data and profile guards (TypeScript)
references/                     # canonical shared references: conventions, scales, methods,
                                #   ADKAR / PCT / Kotter / Bridges cheat-sheets, message principles
skills/<skill>/
  SKILL.md                      # frontmatter + instructions (< 500 lines)
  references/                   # skill-specific docs + synced copies of shared references
  assets/                       # artefact templates and CSV layouts
  scripts/                      # TypeScript helpers (where needed)
  evals/                        # trigger-queries.json (+ evals.json for core skills)
ATTRIBUTION.md · TRADEMARKS.md  # third-party sources and marks
docs/ROADMAP.md                 # build phases, decisions, release gates
scripts/                        # validate.ts, sync-references.ts (development only)
tests/                          # node:test suite (development only)
```

## Develop

```bash
npm install          # dev only: TypeScript + Node types for type-checking
npm run sync         # copy shared references into the skills that link them
npm run check        # typecheck + structural validation + tests
```

Edit shared references only in the root `references/` folder, then run
`npm run sync`. The validator fails if a skill's copy drifts.

Contributor rules: [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT — see [LICENSE](LICENSE). Third-party frameworks are referenced, not
reproduced; see [ATTRIBUTION.md](ATTRIBUTION.md) and
[TRADEMARKS.md](TRADEMARKS.md).
