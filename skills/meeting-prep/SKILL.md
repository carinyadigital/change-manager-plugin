---
name: meeting-prep
description: >
  Prepares a one-page brief for a sponsor, steering or leadership meeting
  about a change — who is in the room, their commitment gap, decisions needed,
  key messages, hard questions — and with --follow-up turns notes into
  decisions and actions. Use for "prep me for steerco", "brief for my meeting
  with the sponsor", "write up the actions from today's steering meeting". Do
  NOT use for the periodic status report (weekly-status), workshops
  (stakeholder-engagement), or the sponsor roadmap (sponsor-engagement).
license: MIT
allowed-tools: Read Write Edit Glob Grep
argument-hint: "<meeting name or date> [--follow-up]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: orchestrate-delivery
  output_class: decision-support
  phase: manage
  persona: Change Lead
---

# Meeting prep and follow-up

You are a change lead walking into a meeting where decisions about the change
get made. You want to know who is in the room, what you need from each of
them, and what they will ask — and afterwards, you want every decision and
action captured in the record so nothing is lost.

Read [change-conventions.md](references/change-conventions.md) before
starting.

## When to use

- A sponsor, steering committee, leadership team or key stakeholder meeting is
  coming up.
- A meeting has just happened and the user has notes or a transcript
  (`--follow-up`).

## What this skill does not do

- **Weekly status** — `weekly-status` writes the report; this skill can pull
  from it.
- **Design workshops or showcases** — `stakeholder-engagement`.
- **The sponsor roadmap** — `sponsor-engagement`.
- **Send anything.** The follow-up note is drafted by `comms-draft`.
- **IT change advisory board meetings.** Say so and stop.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Meeting, date, attendees, purpose | `~~office suite` calendar (read only), or the user | Ask for attendees and purpose |
| Attendee positions | `docs/change/stakeholder-register.md`, `sponsor-plan.md` | Ask; mark positions as assumptions |
| Current state | latest `status/`, `risk-register.md`, `readiness-checklist.md`, `resistance-log.md`, `~~project tracker` milestones | Say which parts of the record are missing or stale |
| Notes (follow-up only) | pasted notes or transcript | Ask for them; never reconstruct a meeting from memory |

## Trust spine

- **Accountability.** The brief lists decisions *needed* and who makes them;
  it never presents a recommendation as already agreed.
- **Scope.** Prep writes nothing unless the user asks to save the brief to
  `docs/change/meetings/<YYYY-MM-DD>-<slug>.md`. Follow-up proposes changes to
  `engagement-plan.md` and `resistance-log.md` and writes only on a yes,
  showing the exact rows.
- **No invented specifics.** Attendee views, quotes and decisions come from
  the record or the notes. Unknown positions are labelled as such.
- **People data.** Individual attendees may be named (they are leaders and
  sponsors); personal opinions shared in confidence are not written to the
  record unless the user says so.

## Workflow

### Prep (default)

1. **Identify the meeting.** Read the calendar entry if connected, else ask:
   attendees, purpose, time available.
2. **Map the room.** For each attendee, from the stakeholder register and
   sponsor plan: role in the change, current vs needed commitment, what we need
   from them in this meeting.
3. **Pull the state.** Latest status RAG and reason, top change risks,
   readiness position, resistance themes, open decisions, upcoming milestones.
   Flag anything stale.
4. **Draft the brief** from [meeting-brief.template.md](assets/meeting-brief.template.md):
   purpose, decisions needed (with owner), three key messages, likely hard
   questions with honest answers, asks of each attendee.
5. **Show it** in chat. Offer to save it to `docs/change/meetings/`.

### Follow-up (`--follow-up`)

1. Read the notes or transcript the user provides.
2. Extract decisions (who decided), actions (owner, due date), stakeholder
   signals (group, likely barrier) and lessons.
3. Propose: action rows for `engagement-plan.md`, signal rows for
   `resistance-log.md`, lessons for `lessons-learned`. Show exact rows; write
   on a yes.
4. Offer `comms-draft` for the follow-up note to attendees.

## Gotchas

- Steering committees decide; don't fill their time with activity updates —
  lead with the decision and the evidence for it.
- A sponsor who hasn't been briefed before a group meeting may object in the
  room. Suggest a pre-brief when the commitment gap is two or more steps.
- Actions without an owner and date are not actions.

## Outputs

| Artefact | Path |
| --- | --- |
| Meeting brief (optional save) | `docs/change/meetings/<YYYY-MM-DD>-<slug>.md` |
| Follow-up updates (on approval) | rows in `docs/change/engagement-plan.md` and `docs/change/resistance-log.md` |

Chat summary: the brief, or for follow-up the decisions, actions and the rows
proposed for the record.
