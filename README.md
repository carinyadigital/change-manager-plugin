# AI Agent skills for Change Practitioners

**A practice plugin for change managers and organisational change practitioners working in Claude Cowork and ChatGPT Work.**

Built from leading change management practice across the private and public sectors.

One install gives you and your team a skill library for the
full Prepare → Manage → Sustain lifecycle. Each piece of work writes to one
shared **change record** in `docs/change/`, so the next conversation builds on
the last.

It covers **people change** — helping groups of people adopt a new system,
process, structure or policy. It does **not** cover IT change control (change
requests, change advisory boards, release approvals).

Every output is a draft for your review. Nothing is sent to employees, leaders
or customers by the plugin.

## Install

Add Change Practice inside the app you already use. There is nothing to install
on your computer.

### Claude Cowork

When Change Practice is available for your organisation:

1. Open Claude and select the **Cowork** tab.
2. In the sidebar, open **Customize**, then **Plugins**.
3. Open **Discover**, select **Change Practice**, and select **Install**.
4. Microsoft 365 and Teams are optional. If you use them, open the plugin and
   connect them on the **Connectors** tab. You can skip this and paste
   documents, emails and plans instead.
5. Start a new Cowork task. Ask in plain language — for example, "Help me
   understand the rostering change" — or type `/` and choose a skill.

If it is not in Discover, ask your Claude administrator to add it for your
organisation, or to send you the plugin file. On the Plugins page, use the
upload option and select that file.

### ChatGPT Work

When Change Practice is available in your workspace:

1. Open ChatGPT and switch to **Work**.
2. Open **Plugins**.
3. Find **Change Practice** under your workspace name, or under **Personal** if
   it was shared with you. Open it and select **+**.
4. If it asks you to connect Microsoft 365 or Teams, connect only what you use.
   You can skip this and paste material instead.
5. Start a **new** Work chat. Describe what you need, or type `@` and choose
   Change Practice or one of its skills.

The first install offers a short setup conversation. That records how your team
works, and later skills follow it.

If it is not listed, ask a workspace admin to publish Change Practice to your
workspace from [ChatGPT Plugins](https://chatgpt.com/plugins). It stays inside
your organisation.

## First session

Run setup before the other skills. It asks how your team works: your change
method (method-neutral unless you say otherwise), whether you hold a Prosci
licence, how people data should be handled, reporting thresholds, how often you
update leaders, who approves employee messages, and whether one person covers
every role or you split the work. Later skills read those answers. If you skip
setup, they use the [defaults](references/rating-scales.md).

- **Claude Cowork:** `/change-practice:setup`
- **ChatGPT Work:** accept the setup conversation after install, or ask "Set up
  my change practice."

Not sure which skill to use next? Ask "What should I do next on this change?"
or, in Claude, run `/change-practice:skills-index`.

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
| Prepare | **change-impact-assessment** | A | `impact-register.md` / `.csv` (with active months) |
| Prepare | **change-risk-assessment** | A | `risk-register.md` |
| Prepare | **sponsor-assessment** | R | `pct-assessment.md` |
| Prepare | **change-strategy** | A | `strategy.md`; on request `case-for-change.md`, `force-field.md` |
| Prepare | **measurement-plan** | A | `measurement-plan.md` / `.csv` |
| Manage | **sponsor-engagement** | A | `sponsor-plan.md` |
| Manage | **stakeholder-engagement** | A | `engagement-plan.md` |
| Manage | **change-network** | A | `change-network.md`, `network-feedback.csv`, champion pack in `network/` |
| Manage | **communications-plan** | A | `change-story.md`, `comms-plan.md` / `.csv` |
| Manage | **comms-draft** | A | `comms/<id>.md` — never sends |
| Manage | **training-needs-analysis** | A | `tna.md` / `.csv`, `training-plan.md`, `training-schedule.csv`, `qrg/` |
| Manage | **business-readiness** | R | `readiness-checklist.md` / `.csv`; early `org-readiness.md` |
| Manage | **readiness-review** | R | `go-no-go.md` |
| Manage | **resistance-management** | A/F | `resistance-log.md`, `transition-plan.md` |
| Manage | **golive-transition** | R/A | `golive-plan.md`, `hypercare-issues.csv`, `hypercare/<date>.md` |
| Manage | **portfolio-saturation** | R | `portfolio-heatmap.md`, `portfolio.csv` |
| Manage | **stakeholder-pulse** | R | `pulse/<date>.md`, survey designs, proposed `resistance-log.md` rows |
| Manage | **meeting-prep** | A | Optional `meetings/<date>-<slug>.md` |
| Sustain | **adoption-measurement** | R | `adoption-report.md` |
| Sustain | **reinforcement** | A | `reinforcement-plan.md` |
| Sustain | **bau-handover** | A | `handover-pack.md` |
| Throughout | **lessons-learned** | A | `lessons-learned.md` (append), `retros/` session sheets |
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
| Hypercare check-in | `golive-transition --daily` reads the issue-theme log and drafts the day's check-in |
| Alpha testing | See [docs/ALPHA-TESTING.md](docs/ALPHA-TESTING.md) |

## Guardrails

| Guardrail | How |
| --- | --- |
| Draft, never send | Comms are saved to `docs/change/comms/`. The `draft_guard.ts` hook asks for confirmation before any connected tool sends, posts, publishes or changes a calendar. For Microsoft 365 and Teams it asks before anything other than a search, read or Outlook draft. |
| People data | Groups and roles, not individuals. The `people_data_guard.ts` hook asks before personal emails or phone numbers are written to the record. Sentiment is reported only for groups at or above the minimum size. |
| Profile writes | Only `setup` writes the practice profile. The `profile_guard.ts` hook asks before any write to it. |
| Grounded output | Unknowns are asked or marked `[ASSUMPTION — confirm with …]`. No invented names, numbers or quotes. |
| Read-only gates | `sponsor-assessment`, `business-readiness`, `readiness-review`, `portfolio-saturation` and `adoption-measurement` write only their own verdict and name the skill that fixes each finding. Decisions stay with named people. |
| Method IP | Prosci (ADKAR, PCT), Kotter, Bridges, ACMP and others are described in our own words with attribution — see [methods.md](references/methods.md). |

In Claude Cowork, the hooks above ask before a send, before personal contact
details are written, and before the practice profile is changed. ChatGPT Work
on the web does not run those hooks, so read every draft before you share it.

## Bundled scripts

Deterministic helpers so scores are consistent from run to run. They are
TypeScript, standard library only, run with `node <file>.ts`:

| Script | Skill |
| --- | --- |
| `score_impacts.ts` | change-impact-assessment (also `--portfolio` rows for portfolio-saturation) |
| `grid.ts` | stakeholder-analysis |
| `coverage.ts` | change-network |
| `gap_summary.ts` | training-needs-analysis |
| `readiness_rag.ts` | business-readiness |
| `checklist_gate.ts` | readiness-review |
| `heatmap.ts` | portfolio-saturation |

## Connectors

The plugin bundles Microsoft 365 and Teams in `.mcp.json` through Microsoft's
Work IQ server. Both are optional: every skill degrades to paste or upload.
See [CONNECTORS.md](CONNECTORS.md) for categories, suggested servers and the
read-first / draft-never-send policy.

## Repo layout

Follows the [Agent Skills](https://agentskills.io/specification) standard:
each skill is a self-contained folder.

```
.claude-plugin/plugin.json      # Claude Cowork manifest
.codex-plugin/plugin.json       # ChatGPT Work and Codex manifest
.mcp.json                       # bundled connector: Microsoft 365 and Teams
assets/                         # listing icon for ChatGPT
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

This repo is one plugin; the repo root is the plugin root. Load it locally
while developing:

```bash
claude --plugin-dir ~/Projects/change-manager-plugin
```

Bundled scripts and hooks are TypeScript that Node 22.18+ runs directly. Claude
Cowork runs Node natively. ChatGPT Work on the web does not run hook scripts.
The public ChatGPT plugin directory does not accept a plugin that bundles
lifecycle hooks, so ChatGPT distribution is a workspace publish.

```bash
npm install          # dev only: TypeScript + Node types for type-checking
npm run sync         # copy shared references into the skills that link them
npm run check        # typecheck + structural validation + tests
```

Edit shared references only in the root `references/` folder, then run
`npm run sync`. The validator fails if a skill's copy drifts.

Contributor rules: [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Licenced under the [MIT Licence](LICENSE).

Third-party frameworks are referenced, not reproduced; see [ATTRIBUTION.md](ATTRIBUTION.md) and [TRADEMARKS.md](TRADEMARKS.md).

Copyright (c) 2026 Carinya Digital
