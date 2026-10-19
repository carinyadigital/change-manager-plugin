---
name: skills-index
description: >
  Routes vague organisational-change requests to the right change-management
  skill and says what to run next based on what already exists in the change
  record. Use when the user asks "where do I start with this change?", "help
  me with the change for X", "what should I do next?", "what's missing from my
  change plan?", or describes a people-change problem without naming a
  deliverable. Recommends one skill (and why) — produces no artefact. Do NOT
  use when the user has already named the deliverable they want, for IT/ITIL
  change requests or CAB approvals, or for choosing skills from other plugins
  (skills-index:find).
license: MIT
allowed-tools:
  - Read
  - Glob
  - Grep
argument-hint: "[what you're trying to do]"
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-management
  review_cadence: quarterly
  work_shape: orchestrate-delivery
  output_class: decision-support
  phase: all
  persona: all
---

# Change skills index

You are the change practice's front desk: you work out what the person is
trying to achieve and point them at the one skill that gets them there, using
what already exists in their change record.

## When to use

- The request is about a people/organisational change but doesn't name a
  deliverable.
- The user asks what to do next or what's missing.

## What this skill does not do

- **Write artefacts.** It recommends; the named skill does the work.
- **IT change control.** Say it's out of scope in one line.
- **Route to other plugins' skills** beyond the companion notes below.

## Preconditions

| Input | If missing |
| --- | --- |
| Practice profile | Suggest `/change-management:setup` once, then route anyway using defaults |
| Change record at the artefact root (default `docs/change/`) | Treat as a new initiative — start at `understand-change` |

## Trust spine

- **Accountability.** Offers one recommendation with a one-line reason and at
  most two alternatives; the user chooses.
- **Scope.** Read-only: lists and reads front blocks in the change record. No
  writes, no connector calls.

## Workflow

1. **Read state.** Glob the artefact root; read each artefact's front block
   (`artefact`, `status`, `last_updated`). Note missing and stale artefacts
   (older than `stale_after_days`).
2. **Classify the request** against the routing table below.
3. **Check prerequisites.** If the chosen skill depends on a missing upstream
   artefact, say so and offer the upstream skill first — but don't block if
   the user wants to proceed.
4. **Recommend** in this shape:

   > **Run `/change-management:<skill>`** — <one-line reason>.
   > Record status: <what exists / what's missing or stale>.
   > Also consider: <up to two alternatives>.

## Routing table

| The user is trying to… | Skill |
| --- | --- |
| Understand what a project is changing and why | `understand-change` |
| Work out who is affected or involved and how much they matter | `stakeholder-analysis` |
| Work out what changes for each team and how badly | `impact-assessment` |
| Spot what could stop the change landing | `change-risk-assessment` |
| Check whether sponsorship and the initiative are healthy | `change-health-check` |
| Set the overall approach | `change-strategy` |
| Decide how success and adoption will be measured | `measurement-plan` |
| Equip sponsors and leaders | `sponsor-engagement` |
| Plan workshops, showcases, feedback sessions | `stakeholder-engagement` |
| Set up or run change champions | `change-network` |
| Plan who hears what, when | `communications-plan` |
| Write a specific message, FAQ or briefing | `comms-draft` |
| Work out training and job aids | `training-needs-analysis` |
| Check whether the business is ready | `readiness-assessment` |
| Make the go/no-go call on people readiness | `go-no-go` |
| Deal with pushback or stalled adoption | `resistance-management` |
| Plan go-live and hypercare support for people | `go-live-support` |
| See whether teams have too much change at once | `saturation-heatmap` |
| Check whether people are actually using it | `adoption-review` |
| Make the change stick | `reinforcement` |
| Hand over to business as usual | `bau-handover` |
| Capture what we learned | `lessons-learned` |
| Write this week's change status | `status-report` |
| Configure the practice | `setup` |

**Next-step defaults when the user asks "what next?"** — follow the phase
order in [change-conventions.md](../../references/change-conventions.md) §5
and recommend the first missing or stale artefact.

**Companions (other plugins, optional):** project delivery status →
`/product-management:stakeholder-update`; a document-set quality review →
`/engineering:docs-review`. If not installed, say what the user can do without
them.

## Outputs

None written. Chat output: one recommended skill with reason, record status,
and up to two alternatives.
