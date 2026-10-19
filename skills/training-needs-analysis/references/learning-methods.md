# Choosing learning methods and checking they worked

Original guidance written for this plugin. Read it when choosing a method for
each role × task in the TNA, when building the training plan, and when
deciding how ability will be checked.

## Choosing a method

Start from the gap (required minus current proficiency, 0–3 scale in
[rating-scales.md](rating-scales.md)) and how often the task is done.

| Gap | Frequent task (daily / weekly) | Occasional task (monthly or less) | Judgement or behaviour change |
| --- | --- | --- | --- |
| 1 | Briefing or short demo + job aid | Job aid only | Manager conversation |
| 2 | Hands-on practice (classroom or practice environment) + job aid | Short practice + job aid; refresher close to first use | Practice with feedback + manager coaching |
| 3 | Hands-on practice, assessed scenario, floor support at go-live | Hands-on practice + job aid + named expert to call | Structured coaching over weeks; practice in real conditions |

### Methods at a glance

| Method | Good for | Weak for | Watch out for |
| --- | --- | --- | --- |
| Briefing or demo | Awareness of what changes; small gaps | Building ability | Counts as communication, not training |
| Job aid / quick reference | Rare tasks; step-by-step; support on the day | Judgement, complex decisions | Needs SME review and to be where people work |
| Self-paced module | Knowledge, policy, consistent content at scale | Gaps of 2 or more on their own | Completion is not ability |
| Instructor-led, classroom or virtual | Practice with feedback; questions; small groups where everyone gets hands-on time | Very large populations on a short timeline | Release time and shifts; trainer capacity |
| Practice environment / sandbox | System tasks that need repetition | Process or behaviour change alone | Must be ready and loaded with realistic data |
| Train-the-trainer / super-user | Scale; local credibility; floor support | Highly technical content | Super-users need time released and depth beyond end users |
| On-the-job coaching | Behaviour, judgement, proficiency after go-live | Initial knowledge | Managers need coaching guidance and time |
| Floor support / hypercare | First weeks of use | Replacing training | Plan rota in `golive-transition` |

### Design checks

- **Closest to use.** Hands-on training is best held close to go-live so it
  isn't forgotten. The plugin's planning default is the two to three weeks
  before go-live; adjust to the organisation's experience.
- **Managers first.** Leaders learn the process before their teams, plus how
  to coach it.
- **Real tasks, real data.** Practise the group's actual work, not a generic
  tour of the system.
- **Plan the catch-up.** Leave, shifts and sickness always leave some people
  out of the first round. Schedule a catch-up round sized from the
  organisation's own history (ask), and say how absentees will be found.
- **Accessibility.** Ask about language, literacy, hearing and vision needs,
  and offline or shift workers.

## Checking it worked

A widely used way to evaluate training, first described by Donald
Kirkpatrick, looks at four levels: how people reacted, what they learned,
whether their behaviour changed at work, and whether the business result
followed. The plugin uses the same idea in its own words:

| Level | Question | Example check | When |
| --- | --- | --- | --- |
| 1. Reaction | Did people find it relevant and usable? | Two-question session feedback ("relevant to my work", "I can apply this") | End of session |
| 2. Learning | Can they do the task in training? | Observed scenario, practice-environment assessment, supervisor sign-off | End of training |
| 3. Behaviour | Are they doing it at work? | Error / rework rates, sampled cases, manager observation, first-use sign-off | 2–6 weeks after go-live |
| 4. Results | Did the business outcome follow? | The outcome measures in `measurement-plan.md` | At the measurement plan's review points |

Level 2 feeds the "trained" readiness criterion. Levels 3 and 4 belong to
`adoption-measurement` — name the measure there rather than duplicating it.

Report results by role or group in aggregate only. No individual results are
recorded in the change record.
