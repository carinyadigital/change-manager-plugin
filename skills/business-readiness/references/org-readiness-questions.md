# Organisational readiness — questions and rating guide

Original questions written for this plugin. Use them early, in Prepare, to
judge whether the organisation as a whole is in a position to take this
change on — before the plan is set. This is different from the group-by-group
readiness check run before go-live (see [readiness-evidence.md](readiness-evidence.md)).

Eight areas, three questions each. The "alignment" area is informed by the
idea, popularised by McKinsey's 7-S framework, that strategy, structure,
systems, shared values, style, staff and skills need to line up for a change
to hold. The questions here are the plugin's own and do not reproduce any
McKinsey material.

## Rating anchors

| Score | Meaning |
| --- | --- |
| 1 | Absent or working against the change |
| 2 | Weak — some signs, mostly gaps |
| 3 | Partly in place — some evidence, clear gaps |
| 4 | Mostly in place — consistent evidence, minor gaps |
| 5 | Strong — consistent evidence from more than one source |
| — | Not rated — no evidence. Record as a gap; do not guess |

Rate from evidence, not intent. A 4 or 5 needs at least one concrete example.

## Questions

### 1. Case for change

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-A1 | Do leaders agree on why this change is needed and why now? | Same reasons given in separate conversations; a signed-off business case or scope |
| OR-A2 | Would the people affected recognise the problem the change solves? | Staff survey comments, complaints, customer feedback, workarounds people already use |
| OR-A3 | Is the cost of not changing understood? | Business case, risk register, leader statements |

### 2. Leadership and sponsorship

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-B1 | Is there one sponsor with authority over the people, money and decisions involved? | Charter, governance terms of reference |
| OR-B2 | Are the leaders of affected areas committed, or only aware? | Leaders' own actions: time released, messages sent, decisions made |
| OR-B3 | Do leaders have the time and skill to lead the change with their teams? | Leader workload, past change performance, manager capability data |

### 3. Change history

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-C1 | Have recent changes here landed well, by the organisation's own judgement? | Lessons-learned records, post-implementation reviews, staff survey trends |
| OR-C2 | Do people trust that what leaders say about a change will happen? | Survey trust items, comments such as "we've heard this before" |
| OR-C3 | Were earlier changes followed through, or quietly dropped? | Systems or processes still running in parallel, abandoned initiatives |

### 4. Capacity

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-D1 | Do the affected groups have time to take this change on alongside other changes? | Portfolio heatmap, roster and leave data, peak periods |
| OR-D2 | Can business experts be released to help design and test? | Resource plan, backfill arrangements |
| OR-D3 | Is there a change lead and team with enough time for the size of the change? | Named roles and time allocated |

### 5. Culture and ways of working

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-E1 | Do people feel able to raise concerns without penalty? | Survey items, how past feedback was handled |
| OR-E2 | Does the change fit how people already like to work, or cut against it? | Interviews, behaviours the change asks for versus what is rewarded today |
| OR-E3 | Are teams used to learning new ways of working, or is change rare here? | Frequency of past changes, training habits |

### 6. Alignment of the organisation

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-F1 | Do targets, measures and incentives support the new way, or the old one? | Scorecards, KPIs, bonus measures |
| OR-F2 | Do structure, roles and decision rights fit the new way of working? | Org charts, delegations, role descriptions |
| OR-F3 | Do supporting systems, policies and processes line up with the change? | Policy register, process maps, system roadmap |

### 7. Employee relations and obligations

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-G1 | Are consultation obligations (agreements, unions, works councils) known and planned for? | HR / employee relations advice, enterprise agreement clauses |
| OR-G2 | Is HR involved early enough for any role, location or working-pattern changes? | HR partner named and engaged |
| OR-G3 | Are wellbeing supports known and ready for a change that involves loss? | Support services, manager guidance |

### 8. Support and enablement

| ID | Question | What counts as evidence |
| --- | --- | --- |
| OR-H1 | Is there a way to train people at the scale needed (trainers, rooms, systems, practice environment)? | Training capability, LMS, past rollouts |
| OR-H2 | Are there channels to reach every affected group, including shift and offline workers? | Channel inventory, manager cascade habits |
| OR-H3 | Is there a support model that can carry people through go-live? | Service desk, super-users, floor support history |

## Rules

- **Area score** = average of rated questions, to one decimal. Fewer than two
  rated questions = "insufficient evidence".
Apply the verdicts **in this order** and stop at the first that fits:

1. **Low readiness** — any area below 2.5, or three or more areas below 3.
2. **Ready to proceed** — every area scored 3.5 or above, no question rated
   below 3, and no area with insufficient evidence.
3. **Mixed readiness** — everything else.

If two or more areas have insufficient evidence, add **(provisional)** to the
verdict and list the gaps first in the summary. Areas with insufficient
evidence are never treated as passing.
- Every area below 3 becomes an input to `change-risk-assessment` and a
  choice in `change-strategy` (more effort, different timing, or a decision
  from the sponsor). Name it; do not fix it here.

## Where findings go

| Area | Usually addressed by |
| --- | --- |
| Case for change | `understand-change`, `communications-plan` |
| Leadership and sponsorship | `sponsor-assessment`, `sponsor-engagement` |
| Change history | `change-strategy` (more listening, early proof), `lessons-learned` from past initiatives |
| Capacity | `portfolio-saturation`, sponsor decision on timing |
| Culture and ways of working | `change-strategy`, `stakeholder-engagement` |
| Alignment | `reinforcement` (measures), business owner and HR |
| Employee relations | HR and employee relations; may change timing |
| Support and enablement | `training-needs-analysis`, `communications-plan`, `golive-transition` |
