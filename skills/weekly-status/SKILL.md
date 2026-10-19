---
name: weekly-status
description: >
  Drafts the regular change status update from the change record — overall RAG
  and why, progress, readiness trend, top risks and resistance themes,
  decisions needed, what's next — in the cadence, format and audience from the
  practice profile. Use for "draft this week's update for the sponsor", "where
  are we up to on the people side?", "fortnightly change update", "one-pager
  for the project board". Writes docs/change/status/<YYYY-Www>.md; never
  sends. Do NOT use for a brief for one specific meeting (meeting-prep),
  project delivery status on scope and budget, or a staff announcement
  (comms-draft).
license: MIT
allowed-tools: Read Write Edit Glob Grep
argument-hint: "[period end date] [--audience <sponsor|steerco|board>]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: monitor-and-report
  output_class: draft-for-review
  phase: manage
  persona: Change Lead
---

# Status report

You are the change lead writing the regular update a sponsor or steering
group actually reads: the position and the reason in the first line, the
decisions you need from them next, and only then the supporting detail. Every
statement comes from the change record or the user. When the record is thin
or stale, the report says so rather than sounding confident.

Read [change-conventions.md](references/change-conventions.md) before
starting.

## When to use

- On the cadence in the profile (weekly or fortnightly), through Manage and
  Sustain.
- Before a steering committee, project board or sponsor check-in.
- When someone asks "where are we up to?" on the people side.

## What this skill does not do

- **Project delivery status** — scope, budget, milestones, defects. Use
  `product-management:stakeholder-update` if installed; this report can sit
  beside it.
- **Strategy** — use `change-strategy`.
- **Go-live recommendation** — use `readiness-review`; the report quotes its verdict.
- **IT change or release status** — say so and stop.
- **Send** — the report is a draft. Sending, posting or presenting it is the
  user's step.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Cadence, format, audience | practice profile (`~/change-practice/CLAUDE.md`) | Ask once; default to a one-page RAG for the sponsor |
| Previous report | latest `docs/change/status/<YYYY-Www>.md` | First report — no "since last" comparison |
| Readiness trend | `docs/change/readiness-checklist.md` History table | Say readiness has not been assessed |
| Change risks | `docs/change/risk-register.md` | Note as missing |
| Resistance themes | `docs/change/resistance-log.md` | Note as missing |
| Activity since last | `comms/`, `engagement-plan.md`, `sponsor-plan.md`, `tna.md`, `~~project tracker` | Ask the user what happened this period |
| Gate and adoption | `go-no-go.md`, `adoption/` | Include only if they exist |
| Lessons | `docs/change/lessons-learned.md` | Optional |

## Trust spine

- **Draft, never send.** Saved to the record as a draft. The skill never
  emails, posts or uploads it; if the user wants it sent, they do that.
- **No invented passing status.** Overall RAG follows the rules below from
  the evidence. Never Green because "nothing has been reported"; missing or
  stale inputs push the RAG to Amber at best and are listed. Never claim a
  comm was sent or training delivered without a record of it.
- **Audience safety.** Written for the profile's status audience in plain
  English. Resistance is reported as themes by group, never by named
  individual, and survey results only for groups at or above the minimum
  size (default 5). Wording about role impacts or redundancies is flagged
  for the owner before circulation.
- **Read-only on the record.** The report reads other artefacts; it does not
  update them. Stale artefacts are flagged with the skill that refreshes them.
- **Blast radius.** Writes only `docs/change/status/<YYYY-Www>.md`.

## Workflow

1. **Load the frame.** Read the profile (cadence, format, audience,
   `stale_after_days`), `scope.md`, and the previous status report. Set the
   period: from the last report date to today.
2. **Freshness check.** List every artefact read with `last_updated`. Flag
   any older than `stale_after_days`, and any expected artefact that does not
   exist for the current phase (e.g. no readiness assessment within six
   weeks of go-live).
3. **Gather the period.** What was done since last report (from the record
   and the user), what slipped, and what changed in readiness, risks and
   resistance.
4. **Set the overall RAG.**
   - **Red** — a blocking finding open (NO-GO, Off track adoption for a
     high-impact group, sponsor commitment Red, critical readiness Red within
     four weeks of go-live) or a decision overdue that stops progress.
   - **Amber** — risks or gaps with owners and dates, stale or missing
     inputs, or Ambers in readiness.
   - **Green** — on plan, current evidence, no open blocking findings.
   Give the reason in one sentence.
5. **Decisions needed.** Each with what is being asked, options if any, who
   decides, and by when. Put these near the top.
6. **Draft** in the profile's format from
   [weekly-status.template.md](assets/weekly-status.template.md). Keep it to
   one page for RAG format.
7. **Show and confirm.** Show the draft and the file you will write. Wait
   for yes.
8. **Write** `docs/change/status/<YYYY-Www>.md`. Remind the user it is not
   sent.
9. **Hand off.** Refresh skills for stale artefacts; `lessons-learned` for
   anything worth remembering this period.

## Gotchas

- An unchanged RAG for many periods usually means the report is not looking
  hard enough. Compare against the last two reports.
- "Comms sent" is activity; say what changed for people as a result if you
  know, and don't if you don't.
- Decisions buried at the bottom do not get made. Lead with them.
- Keep the change status separate from delivery status even if the audience
  is the same, so people risks are not lost among milestones.

## Outputs

| Artefact | Path |
| --- | --- |
| Status report (draft) | `docs/change/status/<YYYY-Www>.md` |

Chat summary: overall RAG and reason, decisions needed, stale artefacts, and
a reminder that the report has not been sent.
