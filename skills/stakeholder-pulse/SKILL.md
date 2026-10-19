---
name: stakeholder-pulse
description: >
  Use for the regular (often daily) stakeholder pulse on an organisational
  change — scanning champion feedback, nominated chat channels and pulse
  survey results for emerging barriers, grouped by impacted team and reported
  in aggregate. Triggers on "run the daily pulse", "what are people saying
  about the change", "any new pushback this week", "check the champion
  feedback", "how is sentiment tracking". Proposes resistance-log rows and
  engagement follow-ups; writes only on approval. Covers people/organisational
  change only. Do NOT use for diagnosing and planning interventions for a
  known resistance issue in depth (resistance-management), designing the
  champion network (change-network), adoption metrics after go-live
  (adoption-measurement), or monitoring IT incidents or service tickets.
license: MIT
allowed-tools: Read Write Edit Glob Grep
argument-hint: "[--since YYYY-MM-DD]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: monitor-and-report
  output_class: decision-support
  phase: manage
  persona: Stakeholder & Sponsor Coach
---

# Stakeholder pulse

You listen for how the change is landing and turn scattered signals into a
short, aggregated view of where people are stuck — early enough to act.

Read [change-conventions.md](references/change-conventions.md) and
[adkar.md](references/adkar.md) before starting.

## When to use

- On the pulse cadence (daily or weekly) during the Manage phase.
- When the user asks what people are saying or whether pushback is building.

## What this skill does not do

- **In-depth resistance planning** — hands themes to `resistance-management`.
- **Champion network design** — `change-network`.
- **Adoption metrics** — `adoption-measurement`.
- **Read private or direct messages, or identify individuals.**
- **IT incident or ticket monitoring.** Say so and stop.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Champion feedback | `docs/change/network-feedback.csv` | Ask the user to paste notes |
| Chat signals | `~~chat` channels nominated in the practice profile | Skip; say which channels were not read |
| Survey results | latest `~~survey` export, aggregated | Skip or ask for an aggregated export |
| Impacted groups | `docs/change/stakeholder-register.md`, `impact-register.csv` | Ask for the groups to report against |
| Minimum group size | practice profile, default 5 | Use 5 and say so |

## Trust spine

- **Definition of done.** A pulse reports only what the sources show; "no new
  signals" is a valid result. Silence is not support, and gaps in coverage are
  stated.
- **Audience safety.** Aggregate by group; drop groups below the minimum size;
  never quote, name or profile individuals; never read private messages.
- **Scope.** Writes nothing without approval. On a yes, appends rows to
  `docs/change/resistance-log.md` only.
- **No invented sentiment.** Every theme cites its source type and count of
  signals.

## Workflow

1. **Set the window** — since the last pulse (latest entry date in
   `resistance-log.md`) or `--since`.
2. **Gather** champion feedback, nominated chat channels and survey results
   for the window.
3. **Group** signals by impacted group; drop groups below the minimum size.
4. **Diagnose** each theme's likely barrier using the individual change
   barrier diagnostic (ADKAR-informed) in [adkar.md](references/adkar.md).
5. **Suggest** an action and owner per theme, and any "you said, we did"
   follow-up for `stakeholder-engagement`.
6. **Show** the pulse in chat and the proposed `resistance-log.md` rows. Write
   only on a yes. Hand deeper issues to `resistance-management`.

## Gotchas

- One loud channel is not the organisation — note coverage by group.
- A spike after an announcement is normal; watch whether it fades.
- Champions report what they're asked about; vary the questions.

## Outputs

| Artefact | Path |
| --- | --- |
| Pulse (chat only) | — |
| New resistance-log rows (on approval) | `docs/change/resistance-log.md` |

Chat summary: themes by group with likely barrier, signal counts and sources,
coverage gaps, suggested actions and owners.
