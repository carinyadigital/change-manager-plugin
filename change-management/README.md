# change-management

A **practice plugin** for organisational change managers. One install gives a
change lead and their team a skill library for the full Prepare → Manage →
Sustain lifecycle, writing to one shared **change record** in `docs/change/` so
each piece of work builds on the last.

It covers **people change** — helping groups of people adopt a new system,
process, structure or policy. It does **not** cover IT change control (change
requests, CAB, release approvals).

Every output is a draft for your review. Nothing is sent to employees, leaders
or customers by the plugin.

## Personas

Five job roles share one skill library. One person can wear every hat.

| Persona | Focus | Skills |
| --- | --- | --- |
| **Change Lead** | Shape and steer the change | `understand-change`, `impact-assessment`, `change-risk-assessment`, `change-strategy`, `go-live-support`, `bau-handover`, `lessons-learned`, `status-report` |
| **Stakeholder & Sponsor Coach** | Leaders, stakeholders, champions, pushback | `stakeholder-analysis`, `change-health-check`, `sponsor-engagement`, `stakeholder-engagement`, `change-network`, `resistance-management` |
| **Communications Specialist** | Who hears what, when, from whom | `communications-plan`, `comms-draft`, `reinforcement` |
| **Training & Capability Designer** | Knowledge and ability | `training-needs-analysis` |
| **Readiness & Adoption Analyst** | Evidence that people are ready and using it | `measurement-plan`, `readiness-assessment`, `go-no-go`, `saturation-heatmap`, `adoption-review` |

Invoke skills directly, e.g.:

```
/change-management:setup
/change-management:understand-change
/change-management:impact-assessment
/change-management:comms-draft "manager briefing for wave 1"
/change-management:go-no-go
```

Not sure where to start? `/change-management:skills-index`.

## First run

```
/change-management:setup          # 5-minute quick interview, or --full
```

Setup records your method (method-neutral by default), whether you hold a
Prosci licence, people-data jurisdiction, thresholds, cadence and comms
approval chain in a personal practice profile. Every other skill reads it and
falls back to [defaults](references/rating-scales.md) if it is missing.

## Skills

Type: **D** draft for review · **G** read-only gate or review · **R** report · **O** orchestration

| Phase | Skill | Type | Writes |
| --- | --- | --- | --- |
| — | **setup** | O | Practice profile (personal config) |
| — | **skills-index** | O | Nothing — recommends the next skill |
| Prepare | **understand-change** | D | `scope.md` |
| Prepare | **stakeholder-analysis** | D | `stakeholder-register.md` / `.csv` |
| Prepare | **impact-assessment** | D | `impact-register.md` / `.csv` |
| Prepare | **change-risk-assessment** | D | `risk-register.md` |
| Prepare | **change-health-check** | G | `health-check.md` |
| Prepare | **change-strategy** | D | `strategy.md` |
| Prepare | **measurement-plan** | D | `measurement-plan.md` / `.csv` |
| Manage | **sponsor-engagement** | D | `sponsor-plan.md` |
| Manage | **stakeholder-engagement** | D | `engagement-plan.md` |
| Manage | **change-network** | D | `change-network.md`, `network-feedback.csv` |
| Manage | **communications-plan** | D | `comms-plan.md` / `.csv` |
| Manage | **comms-draft** | D | `comms/<date>-<slug>.md` — never sends |
| Manage | **training-needs-analysis** | D | `tna.md` / `.csv`, `job-aids/` |
| Manage | **readiness-assessment** | R | `readiness/<date>.md` |
| Manage | **go-no-go** | G | `go-no-go.md` |
| Manage | **resistance-management** | D | `resistance-log.md` |
| Manage | **go-live-support** | D | `go-live-plan.md` |
| Portfolio | **saturation-heatmap** | G | `portfolio/heatmap.md` |
| Sustain | **adoption-review** | G | `adoption/<date>.md` |
| Sustain | **reinforcement** | D | `reinforcement-plan.md` |
| Sustain | **bau-handover** | D | `handover-pack.md` |
| Throughout | **lessons-learned** | D | `lessons-learned.md` (append) |
| Manage/Sustain | **status-report** | R | `status/<date>.md` |

Paths are under `docs/change/`. The record's structure, front block and
writing rules: [references/change-conventions.md](references/change-conventions.md).

## Scheduled agents

| Agent | Cadence | What it does |
| --- | --- | --- |
| **change-status-digest** | status cadence | Drafts the change status report; never sends |
| **readiness-pulse** | monthly → weekly before go-live | Re-runs readiness with trend; recommends early go/no-go if critical gaps |
| **sentiment-pulse** | weekly | Aggregates champion, chat and survey signals into barrier themes; proposes resistance-log rows |
| **adoption-digest** | fortnightly to 90 days, then monthly | Checks adoption against the measurement plan; recommends reinforcement |

## Guardrails

| Guardrail | How |
| --- | --- |
| Draft, never send | Comms are saved to `docs/change/comms/`. The `draft_guard` hook asks for confirmation before any connected tool sends, posts, publishes or creates calendar events. |
| People data | Groups and roles, not individuals. The `people_data_guard` hook asks before personal emails or phone numbers are written to the record. Sentiment is reported only for groups at or above the minimum size. |
| Grounded output | Unknowns are asked or marked `[ASSUMPTION — confirm with …]`. No invented names, numbers or quotes. |
| Read-only gates | `change-health-check`, `go-no-go`, `saturation-heatmap` and `adoption-review` write only their own verdict and name the skill that fixes each finding. Decisions stay with named people. |
| Method IP | Prosci, Kotter, Bridges, ACMP and others are described in our own words and linked — see [methods.md](references/methods.md). |

## Bundled scripts

Deterministic helpers so scores are consistent run to run (Python 3, standard
library only):

| Script | Skill |
| --- | --- |
| `score_impacts.py` | impact-assessment |
| `grid.py` | stakeholder-analysis |
| `coverage.py` | change-network |
| `gap_summary.py` | training-needs-analysis |
| `readiness_rag.py` | readiness-assessment |
| `checklist_gate.py` | go-no-go |
| `heatmap.py` | saturation-heatmap |

## Connectors

Optional. The plugin works with no connectors — paste or upload instead. See
[CONNECTORS.md](CONNECTORS.md) for categories, suggested servers and the
read-first / draft-never-send policy.

## Companion plugins

| Need | Plugin | Invoke |
| --- | --- | --- |
| Project delivery status (not people change) | **product-management** | `/product-management:stakeholder-update` |
| Review a document set for quality | **engineering** | `/engineering:docs-review` |
