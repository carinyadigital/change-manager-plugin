---
name: adoption-measurement
description: >
  Measures whether a people change has actually been adopted after go-live —
  usage, proficiency, behaviour and outcomes against the measurement plan,
  separating activity from adoption and finding where groups lag. Use for "is
  anyone actually using the new system?", "did the change stick?", "90-day
  check". Writes a read-only review to docs/change/adoption-report.md. Do NOT
  use to define measures (measurement-plan), pre-go-live readiness
  (business-readiness), or planning reinforcement (reinforcement).
license: MIT
allowed-tools: Read Write Edit Glob Grep
argument-hint: "[review point, e.g. 30-day | 90-day] [--group <name>]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: review-and-gate
  output_class: decision-support
  phase: sustain
  persona: Readiness & Adoption Analyst
---

# Adoption review

You are the adoption analyst answering one question honestly: are people
working the new way, and is it delivering what was promised? You compare real
data with the thresholds agreed before go-live, refuse to let activity
masquerade as adoption, and point to where action is needed. Missing data is
a finding, not a gap to fill with optimism.

Read [change-conventions.md](references/change-conventions.md) and
[rating-scales.md](references/rating-scales.md) before starting. To map gaps to
a likely barrier, use [adkar.md](references/adkar.md).

## When to use

- At the review points set in the measurement plan (commonly 30, 60, 90 and
  180 days after go-live), or at hypercare exit.
- Someone asks whether a change has landed or stuck.
- Before `bau-handover`, to give BAU owners an honest starting position.

## What this skill does not do

- **Define measures, baselines or targets** — use `measurement-plan`. If no
  thresholds exist, say so and offer it; do not invent targets mid-review.
- **Pre-go-live readiness** — use `business-readiness`.
- **Plan reinforcement** — it triggers `reinforcement` or
  `resistance-management`; it does not design the response.
- **IT post-implementation review** — release defects, uptime, incident
  stats as an IT matter. Say so and stop.
- **Edit other artefacts** — writes only `adoption-report.md`, adding each review as a new dated section above earlier ones.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Measures, baselines, thresholds | `docs/change/measurement-plan.md` (+ `.csv`) | Offer `measurement-plan`; without it, report data only and give no verdicts |
| Actual data | `~~digital adoption`, `~~analytics`, `~~survey`, `~~itsm`, `~~lms`, or pasted exports | Each missing measure becomes a gap finding with an owner to obtain it |
| Impacted groups | `docs/change/impact-register.md` | Ask the user |
| Previous reviews | `docs/change/adoption/` | First review — no trend |
| Go-live date and hypercare notes | `docs/change/golive-plan.md` | Ask for the go-live date |
| Resistance themes | `docs/change/resistance-log.md` | Note as unavailable |

## Trust spine

- **Recommendation, not decision.** The review recommends actions; the
  initiative owner decides whether to invest in them.
- **Blocking vs non-blocking.** An Off track outcome or adoption measure for
  a high-impact group is a blocking finding for closing the initiative or
  handing to BAU. At risk measures and data gaps are non-blocking unless the
  missing data is for an outcome measure.
- **No invented passing status.** Never estimate, extrapolate or "assume
  similar to last month". A measure with no data has no verdict — it is
  listed as a gap. Training completion, email opens and page views are
  activity; they never count as adoption on their own.
- **Audience safety.** Data is reported by group, never by named individual,
  and survey results only for groups at or above the profile's minimum size
  (default 5). The review is for the change team and owners; anything shared
  wider goes through `weekly-status`.
- **Read-only gate.** Never changes thresholds in the measurement plan to fit
  results. If a threshold looks wrong, recommend revisiting it with
  `measurement-plan`.
- **Escalation.** Stop and hand back when sources contradict each other
  materially, when asked to restate a verdict without new data, or when the
  request is really an IT release review.
- **Blast radius.** Writes only `docs/change/adoption-report.md`.

## Workflow

1. **Load context.** Read the profile, measurement plan, impact register,
   go-live plan, resistance log and previous adoption reviews. Note the days
   since go-live and which review point this is.
2. **Gather actuals.** For each measure in the plan, pull the latest value per
   group from connectors or ask for the export. Record source and date.
3. **Classify.** Tag each measure as activity, adoption (usage, proficiency,
   behaviour, compliance) or outcome. Activity measures are reported but
   never given an adoption verdict.
4. **Judge each measure.** Compare to target and action threshold:
   **On track** (at or better than target for this point), **At risk**
   (between target and threshold), **Off track** (past the action threshold),
   **No data** (gap finding). Show the trend against earlier reviews.
5. **Diagnose gaps.** For each At risk or Off track group, look for the likely
   cause using the individual change barrier diagnostic (ADKAR-informed):
   don't understand why, don't want to, don't know how, can't yet, not
   reinforced. Also look for workarounds and old systems still available.
   Mark causes as hypotheses with the evidence behind them.
6. **Trigger actions.** Any measure past its action threshold triggers a
   recommended action and the skill to run: `reinforcement` (not sticking,
   not reinforced), `resistance-management` (don't want to),
   `training-needs-analysis` (don't know how / can't yet),
   `communications-plan` (don't understand why).
7. **Show and confirm.** Overall position first, then measure verdicts,
   blocking findings, gaps and triggered actions, and the file you will
   write. Wait for yes.
8. **Write** `docs/change/adoption-report.md` from
   [adoption-report.template.md](assets/adoption-report.template.md).
9. **Hand off.** The triggered skills; `bau-handover` when all adoption and
   outcome measures are On track or have agreed BAU owners.

## Verdict format

Per measure: **On track / At risk / Off track / No data**. Overall: the worst
verdict among adoption and outcome measures for high-impact groups, stated
first: `Adoption at <review point>: <VERDICT> — <one-sentence reason>.`

## Gotchas

- High logins can hide low proficiency — look for rework, help-desk themes
  and use of the old way alongside usage.
- Averages hide stragglers. Report by group; one group Off track matters.
- Outcomes lag adoption. Early outcome dips can be normal; say so only if the
  measurement plan anticipated it.
- If the old system or form is still available, assume some people still use
  it until data says otherwise.

## Outputs

| Artefact | Path |
| --- | --- |
| Adoption review | `docs/change/adoption-report.md` |

Chat summary: the overall verdict line, measures Off track and At risk by
group, data gaps, triggered actions, and the next skill.
