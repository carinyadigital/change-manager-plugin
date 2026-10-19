---
name: stakeholder-pulse
description: >
  Use for the regular (often daily or weekly) stakeholder pulse on an
  organisational change — reading across champion feedback, nominated chat
  channels and pulse survey results for emerging barriers, grouped by impacted
  team and reported in aggregate — and for designing the pulse survey itself.
  Triggers on "run the daily pulse", "what are people saying about the
  change", "any new pushback this week", "what's coming through from champions
  and the survey", "how is sentiment tracking", "write pulse survey
  questions", "what should we ask staff in the pulse". Writes a pulse summary
  and proposes resistance-log rows, only on approval. People/organisational
  change only. Do NOT use for logging champion meeting notes into the network
  log (change-network), diagnosing and planning interventions for a known
  resistance issue in depth (resistance-management), adoption metrics after
  go-live (adoption-measurement), go-live readiness status
  (business-readiness), or monitoring IT incidents or service tickets.
license: MIT
allowed-tools: Read Write Edit Glob Grep
argument-hint: "[--since YYYY-MM-DD] [--design-survey]"
metadata:
  author: Carinya Digital
  version: "0.2.0"
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
[adkar.md](references/adkar.md) before starting. Read
[pulse-questions.md](references/pulse-questions.md) whenever survey results
are in scope or the user asks for survey questions.

## When to use

- On the pulse cadence (daily or weekly) during the Manage phase.
- When the user asks what people are saying or whether pushback is building.
- When a pulse survey wave has closed and the results need reading.
- When the user wants pulse survey questions drafted (`--design-survey`).

## What this skill does not do

- **In-depth resistance planning** — hands themes to `resistance-management`.
- **Champion network design** — `change-network`.
- **Adoption metrics** — `adoption-measurement`.
- **Go-live readiness status** — `business-readiness`.
- **Read private or direct messages, or identify individuals.**
- **Send or publish a survey.** It drafts the questions; a person sets up and
  sends the survey.
- **IT incident or ticket monitoring.** Say so and stop.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Champion feedback | `docs/change/network-feedback.csv` | Ask the user to paste notes |
| Chat signals | `~~chat` channels nominated in the practice profile | Skip; say which channels were not read |
| Survey results | latest `~~survey` export, aggregated by group, in the layout of [pulse-results.csv](assets/pulse-results.csv) | Skip or ask for an aggregated export |
| Previous pulse | latest `docs/change/pulse/<date>.md` | First pulse — no trend; say so |
| Impacted groups | `docs/change/stakeholder-register.md`, `impact-register.csv` | Ask for the groups to report against |
| Minimum group size | practice profile, default 5 | Use 5 and say so |

## Trust spine

- **Definition of done.** A pulse reports only what the sources show; "no new
  signals" is a valid result. Silence is not support, and gaps in coverage are
  stated.
- **Audience safety.** Aggregate by group; drop or combine groups below the
  minimum size; never quote, name or profile individuals; never read private
  messages. Survey designs ask for the group only, never the name.
- **Scope.** Writes nothing without approval. On a yes, writes
  `docs/change/pulse/<YYYY-MM-DD>.md` and appends rows to
  `docs/change/resistance-log.md`. Survey designs are saved, on a yes, to
  `docs/change/pulse/survey-<YYYY-MM-DD>.md`.
- **No invented sentiment.** Every theme cites its source type and count of
  signals. Every survey figure cites the number of responses.

## Workflow

### Run the pulse (default)

1. **Set the window** — since the last pulse (latest `docs/change/pulse/`
   file or resistance-log entry) or `--since`.
2. **Gather** champion feedback, nominated chat channels and survey results
   for the window. Record each source as read or not read.
3. **Group** signals by impacted group; drop or combine groups below the
   minimum size.
4. **Read survey results** if a wave closed: % agree and "don't know" per
   question and group, compared with the previous wave. Apply the
   "no clear change" rule in [pulse-questions.md](references/pulse-questions.md)
   — do not call a small movement a trend.
5. **Diagnose** each theme's likely barrier using the individual change
   barrier diagnostic (ADKAR-informed) in [adkar.md](references/adkar.md) and
   the results patterns in `pulse-questions.md`.
6. **Suggest** an action and owner per theme, and any "you said, we did"
   follow-up for `stakeholder-engagement`.
7. **Show** the pulse in chat in the shape of
   [pulse-summary.template.md](assets/pulse-summary.template.md), with the
   proposed `resistance-log.md` rows. Write only on a yes. Hand deeper issues
   to `resistance-management`.

### Design a pulse survey (`--design-survey`)

1. Read the phase from `strategy.md` (or ask) and the impacted groups.
2. Propose the six core questions plus one or two phase questions and at most
   one open question from [pulse-questions.md](references/pulse-questions.md).
   Adjust wording to the organisation's terms (system name, team names) without
   changing what each question measures.
3. Add the single group question, using impacted groups combined to the
   minimum reporting size, and a two-line note telling people what happens to
   their answers.
4. Suggest a cadence (fortnightly is a sensible default; weekly only in the
   last six weeks before go-live) and the champion prompts to rotate.
5. Show the draft and save it on a yes. A person builds and sends the survey.

## Gotchas

- One loud channel is not the organisation — note coverage by group.
- A spike after an announcement is normal; watch whether it fades.
- Champions report what they're asked about; rotate the prompts.
- Changing a core question's wording breaks the trend. Keep it fixed.
- A high "don't know" is a finding, not missing data.

## Outputs

| Artefact | Path |
| --- | --- |
| Pulse summary (on approval) | `docs/change/pulse/<YYYY-MM-DD>.md` |
| New resistance-log rows (on approval) | `docs/change/resistance-log.md` |
| Pulse survey design (on approval) | `docs/change/pulse/survey-<YYYY-MM-DD>.md` |

Chat summary: themes by group with likely barrier, signal counts and sources,
coverage gaps, suggested actions and owners.
