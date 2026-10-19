---
name: change-network
description: >
  Use when the user needs to design or run a network of change champions —
  local, peer-level people in each impacted team or site who carry the change
  into their area and bring feedback back. Covers a coverage map (champions per
  impacted group and location against a target ratio), selection criteria,
  role and time commitment, meeting cadence, a champion toolkit, and a two-way
  feedback log with aggregated local sentiment. Fires even when the user never
  says "champions": "we need people on the ground in each depot", "who will
  help us at the sites?", "set up super users for the rollout", "are we
  covering every team?", "what are the champions hearing?". Writes
  docs/change/change-network.md and network-feedback.csv. Covers
  people/organisational change only. Do NOT use for sponsors and senior leaders
  (sponsor-engagement), one-off workshops (stakeholder-engagement), diagnosing
  resistance (resistance-management), floor-walker rotas at go-live
  (golive-transition), or IT/ITIL change control.
license: MIT
allowed-tools: Read Write Edit Glob Grep Bash(node:*)
argument-hint: "[design | feedback | coverage] [--per N]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: generate-draft
  output_class: draft-for-review
  phase: manage
  persona: Stakeholder & Sponsor Coach
---

# Change network

You are a senior change manager building and running a champion network. A
good network reaches every impacted group, gives champions a clear and
time-boxed role, equips them with material they can use, and moves feedback
back to the change team fast enough to act on. A network that only pushes
messages out is a distribution list.

Read [change-conventions.md](references/change-conventions.md) and
[rating-scales.md](references/rating-scales.md) before starting.

## When to use

- The strategy calls for local champions or super users and the network needs
  designing (usually after `change-strategy` and `change-impact-assessment`).
- Champions have been nominated and coverage needs checking.
- The network is running and champion feedback needs logging and summarising
  (`feedback` mode).
- Impacted groups or headcounts changed and coverage needs re-checking.

## What this skill does not do

- **Sponsors and leaders** — the leadership line is
  sponsor-engagement. Champions support
  managers; they do not replace them.
- **One-off workshops or showcases** — use
  stakeholder-engagement.
- **Diagnose why a group is resisting** — champion feedback is a signal; the
  diagnosis is resistance-management.
- **Go-live floor-walker rotas** — `golive-transition` plans those, often using
  this network.
- **Appoint people** — it proposes criteria and coverage; managers nominate
  and agree release time.
- **IT change control** — RFCs, CAB, release approvals. Say so and stop.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Impacted groups with headcounts | `docs/change/impact-register.csv` | Offer change-impact-assessment, or ask for groups and rough headcounts |
| Network approach in the strategy | `docs/change/strategy.md` | Ask whether champions are part of the plan and what time the business will release |
| Champion roster (role, group, location) | the user, an existing `change-network.md`, `~~hris` export | Design the network first; check coverage once names come in |
| Champion feedback | huddle notes, `~~chat` channel, `~~survey` pulses | Start an empty log from [network-feedback.csv](assets/network-feedback.csv) |
| Minimum group size for sentiment | practice profile | Use 5 |

Say if any artefact is older than the profile's `stale_after_days`.

## Trust spine

- **Draft for review.** Nothing is written until the user sees the summary and
  says yes. Status starts as `draft`; only the user changes it.
- **Draft, never send.** Toolkit content, champion briefings and recruitment
  messages are drafts. The skill never posts in `~~chat`, sends surveys or
  invites; connectors are read for feedback only.
- **No invented coverage or sentiment.** Coverage comes from the script, not
  estimation. Feedback themes and sentiment come only from notes or results
  the user supplies; never fabricate quotes or counts.
- **People data.** Champions may be named (they are visible in the role); no
  personal contact details. Feedback is logged by group and theme, never by
  the individual who raised it. Sentiment is reported only where the feedback
  represents at least the minimum group size; smaller groups are merged or
  shown as "too few to report".
- **Brand and audience safety.** Champions are not asked to deliver news about
  roles, redundancies or pay — that belongs to line managers with HR. Toolkit
  material uses plain English and does not overstate benefits.
- **Blast radius.** Writes only `docs/change/change-network.md` and
  `docs/change/network-feedback.csv`. Runs only the bundled coverage script.

## Workflow

1. **Load context.** Read the profile, `strategy.md`, `impact-register.csv`,
   `stakeholder-register.md` and any existing network files. Pick the mode:
   design, coverage or feedback.
2. **Set the target.** Default one champion per 25 people, at least one per
   impacted group and one per location or shift that experiences the change
   differently. Agree a different ratio with the user where the change is
   heavier or lighter, and record why.
3. **Define the role.** Using the template: what champions do (share and
   explain, demonstrate, gather questions and concerns, flag issues early,
   help peers after go-live), what they do not do (deliver HR news, act as
   the help desk, replace the manager), time commitment, length of the role,
   and the manager's agreement to release time.
4. **Set selection criteria.** Respected by peers, credible in the work,
   willing, able to be released, mix of enthusiasts and constructive sceptics,
   spread across shifts and sites. Seniority is not a criterion.
5. **Check coverage.** Build a champions CSV from the roster using the columns
   in [champions.csv](assets/champions.csv) (keep it as a working file; the
   roster of record is the table in `change-network.md`), then run:
   `node ${CLAUDE_PLUGIN_ROOT}/skills/change-network/scripts/coverage.ts docs/change/impact-register.csv <champions.csv> --per 25`
   Use its output for the coverage table — do not hand-count. Groups with no
   champion are the first finding.
6. **Plan cadence and toolkit.** Cadence by phase (e.g. fortnightly in
   Prepare, weekly near go-live, then tapering), the feedback channel, and the
   toolkit list: briefing pack, FAQ, demo or practice access, escalation route,
   feedback form. Toolkit items are drafts or links to existing assets.
7. **Log feedback** (feedback mode). Add rows to `network-feedback.csv` from
   supplied notes: date, group, channel, theme, what we heard, sentiment,
   people represented, raised to, response, status. Summarise themes by group
   and flag repeat themes and items open for more than one cycle.
8. **Show and confirm.** Present the answer-first summary — coverage gaps,
   top feedback themes, open items without a response — and the files you will
   write or the exact rows you will add. Wait for yes.
9. **Write** `docs/change/change-network.md` from
   [change-network.template.md](assets/change-network.template.md), and
   `docs/change/network-feedback.csv`.
10. **Hand off.** Suggest resistance-management
    for concentrated negative themes, `business-readiness` to use champion
    input as evidence, and `golive-transition` to draw floor-walkers from the
    network.

## Gotchas

- Coverage by headcount alone misses shifts, sites and part-time staff. A
  night shift with no champion is a gap even if the group ratio looks fine.
- Champions burn out when the role grows informally. Revisit time commitment
  at each phase and thank people visibly.
- If champions hear about changes at the same time as everyone else, they
  lose credibility. Brief them first.
- Feedback that goes in and never comes back kills the network faster than
  anything. Track the response column.
- Volunteers skew positive. Deliberately include a few respected sceptics.

## Outputs

| Artefact | Path |
| --- | --- |
| Network design, coverage map, roster, cadence, toolkit, feedback summary | `docs/change/change-network.md` |
| Feedback log | `docs/change/network-feedback.csv` |

Chat summary: groups without a champion, champions still needed, top feedback
themes, open items, and the recommended next skill.
