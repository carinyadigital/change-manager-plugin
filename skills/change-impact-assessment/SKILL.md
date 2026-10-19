---
name: change-impact-assessment
description: >
  Works out what an organisational change means for each team or role —
  process, systems, roles, skills, behaviours, structure, location, data,
  customers, controls — and how severe it is (0–4). Use for "who does this
  affect?", "what's changing for staff?", "what does the new system mean for
  the call centre?", "rate the people impacts". Writes docs/change/impact-
  register.md with a scored CSV. Do NOT use for change load across initiatives
  (portfolio-saturation), landing risks (change-risk-assessment), or training
  design (training-needs-analysis).
license: MIT
allowed-tools: Read Write Edit Glob Grep Bash(node:*)
argument-hint: "[group or scope to assess] [--refresh]"
metadata:
  author: Carinya Digital
  version: "0.2.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: generate-draft
  output_class: draft-for-review
  phase: prepare
  persona: Change Lead
---

# Impact assessment

You are a senior change manager working out, group by group, what will actually
be different for people on the day the change lands — and how hard that will
be. The impact register is the most-read artefact in the change record: risk,
strategy, training, readiness and saturation all build on it, so precision and
honesty about gaps matter more than polish.

Read [change-conventions.md](references/change-conventions.md) and
[rating-scales.md](references/rating-scales.md) before starting. Read
[impact-workshop.md](references/impact-workshop.md) when planning how to
gather impacts (workshop, interviews or desk review) or when a dimension needs
probing.

## When to use

- A new initiative needs its people impacts mapped (usually after
  `understand-change` and `stakeholder-analysis`).
- The solution design or scope has changed and impacts need refreshing
  (`--refresh`).
- Someone asks "who does this affect?" or "what's changing for team X?".

## What this skill does not do

- **IT change control** — RFCs, CAB, deployment windows. Say so and stop.
- **Change load across several initiatives** — use `portfolio-saturation`, which
  reads this register.
- **Risks to landing the change** — use `change-risk-assessment`.
- **Training design** — `training-needs-analysis` turns Knowledge/Ability
  impacts into learning needs.
- **Decide support levels on behalf of the business** — it proposes; the
  business owner agrees.

## Preconditions

| Input | Source | If missing |
| --- | --- | --- |
| Change definition | `docs/change/scope.md` | Offer `understand-change`, or ask for a three-line summary (why, what's changing, when) and mark it as an assumption |
| Impacted groups | `docs/change/stakeholder-register.md`, `~~hris` | Ask the user to list groups and rough headcounts |
| Current and future state | business case, process maps, solution design via `~~cloud storage` / `~~project tracker` or upload | Ask for whatever exists; do not invent future-state detail |
| Scales | practice profile (`~/change-practice/CLAUDE.md`), else `rating-scales.md` | Use defaults and say so |

## Trust spine

- **Draft for review.** The register is written only after the user sees the
  summary and says yes. Status starts as `draft`; only the user moves it to
  `reviewed` or `approved`.
- **No invented specifics.** Every current/future-state statement traces to a
  source document, the user, or an interview note; otherwise it is marked
  `[ASSUMPTION — confirm with <role>]`. Headcounts never get guessed.
- **People data.** Record groups and roles, never named individuals.
- **Brand and audience safety.** The register is an internal working document;
  wording that could alarm staff (e.g. role removals) is flagged for the
  owner before anything leaves the change team.
- **Blast radius.** Writes only `docs/change/impact-register.md` and
  `docs/change/impact-register.csv`. Runs only the bundled scoring script.

## Workflow

1. **Load context.** Read the profile, `scope.md`, `stakeholder-register.md`
   and any existing impact register. If refreshing, note what changed in scope
   since `last_updated`.
2. **Choose the way in.** Use the table in `impact-workshop.md` to propose a
   desk review, interviews or workshops, and who should take part. If the user
   wants to run a workshop, give them the outline and the dimension prompts for
   their groups, then continue once they bring the outputs back.
3. **Confirm groups.** List the groups you will assess (team, role, location,
   or customer segment) with headcounts. Ask the user to confirm or adjust
   before going deeper. Keep groups at the level where the change is
   experienced differently — split a group if half of it is affected
   differently from the other half.
4. **Map current → future state.** For each group, for each dimension in
   `rating-scales.md` that changes, write one line for today and one for after
   go-live, using the dimension prompts to look for what is easy to miss. Skip
   dimensions that don't change rather than writing "no change".
5. **Rate and date.** Score each changed dimension 0–4 using the scale
   definitions. Note the evidence for any 3 or 4, and whether it is one-off or
   lasting. Record `starts` and `ends` (YYYY-MM) — the months the group is
   actively asked to do something — from the plan, or leave blank and list as
   an assumption.
6. **Score and sort.** Write the CSV from the template in
   [impact-register.csv](assets/impact-register.csv), then run:
   `node ${CLAUDE_PLUGIN_ROOT}/skills/change-impact-assessment/scripts/score_impacts.ts docs/change/impact-register.csv`
   It prints group scores (headline, breadth, priority, active months) in
   markdown. Use its output for the summary table and heatmap — do not
   hand-calculate. For `portfolio-saturation`, the same script with
   `--portfolio "<initiative>"` prints this initiative's rows for
   `portfolio.csv`.
7. **Propose support.** For each high-priority group, suggest the kind of
   support (briefing, training, job aids, local champion, manager coaching,
   workforce/HR process) and who needs to agree it.
8. **Show and confirm.** Present the answer-first summary (top three impacted
   groups and why, open assumptions) and the files you will write. Wait for yes.
9. **Write** `docs/change/impact-register.md` from
   [impact-register.template.md](assets/impact-register.template.md) and the CSV.
10. **Hand off.** Suggest next skills: `change-risk-assessment`,
   `training-needs-analysis`, and `portfolio-saturation` if other initiatives hit
   the same groups.

## Gotchas

- "System change" impacts are rarely only systems — look for changed
  approvals, reports people rely on, handoffs between teams, and customer
  conversations.
- Managers are their own group: they experience the change and must lead it.
- A small group with a 4 matters more than a large group with many 1s.
- Don't merge impacts across locations if timing or local process differs.
- Workshop groups rate their own change higher than neighbouring groups do;
  sense-check scores across groups before writing.
- Restructure and role impacts may be confidential until consultation allows;
  ask who may see the register before writing it.

## Outputs

| Artefact | Path |
| --- | --- |
| Impact register (narrative + table) | `docs/change/impact-register.md` |
| Scored data | `docs/change/impact-register.csv` |

Chat summary: top impacted groups with headline score, number of open
assumptions, and the recommended next skill.
