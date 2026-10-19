# Measure library

Original catalogue written for this plugin: example measures by type of
change, so the plan starts from proven shapes instead of a blank page. Pick
two to four per tier, rewrite each in the organisation's own terms, and give
it a source, baseline, threshold, action and owner. None of these come with
targets — targets come from the business case or the business owner.

Every measure is reported by group, in aggregate, at or above the minimum
group size. None tracks a named individual. The 30-, 90- and 180-day review
points are plugin defaults; use the organisation's own if it has them.

## How to choose

1. Start from the business outcome in `scope.md`.
2. Ask: *what must people do differently for that outcome to happen?* — that
   is the adoption measure.
3. Ask: *what must be true before they can?* — that is the leading measure.
4. Prefer a measure the organisation **already collects**. A new data feed is
   a project of its own.
5. Prefer the decline of the old way where the new way is hard to see.
6. Drop any measure where nobody can say what they would do if it moved.

## Measures that apply to most changes

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Leading | Sponsor and leader actions done as planned | Share of planned sponsor-roadmap actions completed on time | `sponsor-plan.md` |
| Leading | Leaders who have briefed their teams | Share of people leaders in impacted groups who have briefed their own team | Leader confirmation, champion feedback |
| Leading | Understanding of why | % agree "I understand why this change is happening", by group | `~~survey` pulse |
| Leading | Confidence to work the new way | % agree "I feel confident I will be able to work the new way" | `~~survey` pulse |
| Leading | Training effectiveness | Share of trained people who pass a practice or assessment task (not completion) | `~~lms`, trainer sign-off |
| Leading | Readiness | Groups rated Green on all critical readiness criteria | `readiness-checklist.md` |
| Adoption | How-to questions over time | Volume of "how do I" questions per 100 people, by week after go-live | `~~itsm`, champion log |
| Adoption | Self-reported use | % agree "I am using the new way for most or all of my work" | `~~survey` pulse |
| Outcome | Sustained adoption | The main adoption measure at 90 and 180 days, compared with its level at 30 days | As the adoption measure |

## By type of change

### System implementation

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Adoption | Work done in the new system | Share of the target transactions (cases, orders, claims, approvals) completed in the new system | `~~analytics`, system reports |
| Adoption | Old system or workaround use | Transactions still going through the old system, spreadsheets or email | Old system logs, IT, champion reports |
| Adoption | Proficiency | Error, rework or reversal rate on the target transactions | System reports, QA sampling |
| Adoption | Feature use | Use of the specific feature the business case depends on (not logins) | `~~digital adoption`, `~~analytics` |
| Outcome | Process time | Time to complete the target transaction end to end | System timestamps |
| Outcome | Customer or quality result | The customer or quality measure named in the business case | Business reporting |

### Process change

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Adoption | Process followed | Share of sampled cases that followed the new steps | QA or audit sampling |
| Adoption | Exceptions and escalations | Volume of cases escalated or handled outside the new process | Workflow reports, team leader log |
| Adoption | Handoff quality | Cases returned or bounced between teams | Workflow reports |
| Outcome | Cycle time or throughput | Time or volume through the process | Workflow reports |
| Outcome | Compliance result | The compliance or control finding the change was meant to fix | Audit, risk reporting |

### Restructure or operating model change

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Leading | Roles confirmed on time | Share of affected people with their new role confirmed by the agreed date | `~~hris`, HR |
| Leading | Consultation steps met | Consultation milestones completed as agreed | HR / employee relations |
| Adoption | New decision rights used | Share of decisions made at the new level (sampled) | Delegation logs, governance minutes |
| Adoption | New ways of working in place | Team routines (stand-ups, handoffs, reviews) running as designed | Team leader confirmation, observation |
| Outcome | Retention of key roles | Voluntary exits from roles identified as critical, compared with baseline — only where the role group meets the minimum group size; otherwise combine role groups | `~~hris` (aggregate only) |
| Outcome | Service continuity | The service measure most at risk during the transition | Business reporting |

### Policy change

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Leading | Policy acknowledged | Share of the affected population who have acknowledged the policy (activity, not adoption) | `~~lms`, policy system |
| Adoption | Policy applied | Share of sampled cases or requests that follow the new policy | Audit, approvals data |
| Adoption | Exceptions requested | Volume of exception requests, by group | Approvals system |
| Outcome | The risk or cost the policy targets | The incident, cost or risk measure the policy was written to change | Risk, finance reporting |

### Merger or integration

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Leading | Integration understanding | % agree "I know what the integration means for my role" | `~~survey` |
| Adoption | Shared processes and systems in use | Share of work running on the combined process or system | System, workflow reports |
| Adoption | Cross-team work | Volume of work handled jointly by teams from both organisations | Workflow, project data |
| Outcome | Retention and engagement | Voluntary exits and engagement compared with each side's baseline | `~~hris`, engagement survey (aggregate) |
| Outcome | Synergy or service target | The integration target in the business case | Finance, business reporting |

### Behaviour or culture change

| Tier | Measure | Definition shape | Typical source |
| --- | --- | --- | --- |
| Leading | Leaders role-modelling | Share of leaders, as a group, reported doing the target behaviour | Pulse items about leaders in the area, observation (never individual 360 or performance data) |
| Adoption | Target behaviour seen | Frequency of the specific, observable behaviour (e.g. safety reports raised, ideas logged, peer reviews held) | Operational logs |
| Adoption | Behaviour recognised | Recognition given for the target behaviour | Recognition system, team meetings |
| Outcome | The result the behaviour drives | Incident rates, quality, customer measure | Business reporting |

## Watch-outs

| Looks like adoption | Is really | Use instead |
| --- | --- | --- |
| Logins, accounts created | Access | Target transactions done in the new way |
| Training completion | Activity | Assessment pass rate (leading); proficiency (adoption) |
| Email opens, intranet views | Reach | Understanding (pulse), questions asked |
| Attendance at town halls | Activity | Understanding and confidence (pulse) |
| A single month's spike | Novelty | The level at 90 and 180 days |
