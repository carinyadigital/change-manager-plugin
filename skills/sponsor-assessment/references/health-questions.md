# Change health check — questions and rating guide

Twelve questions written for this plugin, four in each of three areas. The
three-area view (sponsorship, project management, change management) is a
widely used way of looking at initiative health; these questions, anchors and
rules are the plugin's own and are not taken from any proprietary instrument.
Do not call the result a "PCT assessment" unless the practice profile records a
Prosci licence (see [methods.md](methods.md)).

## Rating anchors (every question)

| Score | Meaning |
| --- | --- |
| 1 | Absent or contradicted by evidence |
| 2 | Weak — talked about, little or no action seen |
| 3 | Partly in place — some evidence, clear gaps |
| 4 | Mostly in place — consistent evidence, minor gaps |
| 5 | Strong — consistent evidence from more than one source |
| — | Not rated — no evidence available. Record as an evidence gap; do not guess |

Rate from evidence, not intent. "The sponsor is very supportive" with nothing
visible behind it is a 2. A rating of 4 or 5 needs at least one concrete
example (a meeting, a decision, a document, survey results, a plan).

## Sponsorship

| ID | Question | What counts as evidence |
| --- | --- | --- |
| S1 | Is there one named primary sponsor with authority over the people, money and decisions this change needs? | Named in the charter or governance; controls budget and the affected areas, or has a peer who does and is aligned |
| S2 | Has the sponsor personally and visibly explained why the change matters to the affected groups — not only to the project? | Town halls, messages, site visits, recorded briefings, staff survey comments |
| S3 | Are the leaders between the sponsor and affected staff aligned and acting on the change with their own teams? | Leaders briefed, leaders' own updates to teams, no open disagreement in steering forums |
| S4 | When the change team escalates a people-side issue, does the sponsor decide and remove the obstacle in reasonable time? | Escalation log, decisions recorded, resourcing or timing changes made |

## Project management

| ID | Question | What counts as evidence |
| --- | --- | --- |
| P1 | Are the scope, solution and go-live date settled enough for people to plan around? | Approved scope, design sign-off, date not moved in the recent period or moved with notice |
| P2 | Are people-side activities (comms, training, readiness, support) scheduled in the same plan as build, test and cutover? | Integrated plan or milestones that include change activities and dependencies |
| P3 | Are the right people in place to deliver — including business experts released from their day jobs? | Resource plan, backfill arrangements, roles filled |
| P4 | Does the project tell the change team promptly when scope, timing or design changes? | Change team in project forums, change log shared, no late surprises in recent history |

## Change management

| ID | Question | What counts as evidence |
| --- | --- | --- |
| C1 | Is there a change approach sized to the scale of this change, with a named change lead and enough capacity? | `docs/change/strategy.md` or equivalent, named lead, time allocated |
| C2 | Are the impacts on each affected group known, rated and agreed with the business? | `docs/change/impact-register.md` reviewed or approved by the business owner |
| C3 | Are people managers equipped and expected to lead the change with their own teams? | Manager briefings or toolkits planned or held, managers in the stakeholder register with actions |
| C4 | Is there a working way to hear from affected people and act on what they say? | Feedback channels, pulse results, champion feedback, resistance log, "you said, we did" examples |

## Rules

- **Area score** = average of rated questions in that area, to one decimal.
- **Insufficient evidence** — an area with fewer than three rated questions is
  reported as "insufficient evidence", not scored.
- **Material concern** — any area averaging below 3.
- **Some concern** — no area below 3, but any area below 3.5, any question
  rated 1 or 2, or any area with insufficient evidence.
- **Healthy** — every area 3.5 or above and no question below 3.
- **Blocking finding** — any question rated 1, or any question rated 2 in an
  area averaging below 3. Blocking findings need a decision from the sponsor
  or steering group before the next phase gate.
- **Non-blocking finding** — any other question rated 3 or below, and every
  evidence gap.

## Where findings are fixed

| Question | Fixing skill or owner |
| --- | --- |
| S1–S4 | `sponsor-engagement`; S1 may need the steering group |
| P1 | Project manager and business owner; refresh `understand-change` once settled |
| P2 | Project manager with `change-strategy` (high-level timeline) |
| P3 | Project manager and sponsor |
| P4 | Project manager; agree a change-notification step in governance |
| C1 | `change-strategy` |
| C2 | `change-impact-assessment` |
| C3 | `sponsor-engagement` (leaders down the line), `communications-plan` (manager briefings) |
| C4 | `change-network`, `stakeholder-engagement`, `resistance-management` |
