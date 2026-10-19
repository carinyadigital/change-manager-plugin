# Default rating scales

Original scales written for this plugin. The practice profile can override any
of them; skills read the profile first and fall back to these.

## Impact severity (per group, per dimension)

| Score | Label | Meaning |
| --- | --- | --- |
| 0 | None | No change to how this group works in this dimension |
| 1 | Low | Minor adjustment; a short note or briefing is enough |
| 2 | Medium | Noticeable change to tasks or tools; needs explanation and some practice |
| 3 | High | Significant change to role, process or skills; needs training and local support |
| 4 | Very high | Role redesigned, removed or created; job security or identity affected |

**Dimensions:** process, systems and tools, roles and responsibilities, skills,
behaviours and culture, structure and reporting lines, location and working
pattern, data and reporting, customer interaction, policies and controls.

**Reach:** number of people in the group (from `~~hris` or the user).

**Group impact score** = highest dimension score (the headline) plus the count
of dimensions at 3 or above (the breadth). A group with any 4 is always
high-priority regardless of breadth. `impact-assessment/scripts/score_impacts.py`
computes this.

## Stakeholder position

- **Influence:** 1 low – 3 high. **Impact on them:** 1 low – 3 high.
- **Grid:** high/high = partner closely; high influence/low impact = keep
  satisfied; low influence/high impact = keep informed and supported;
  low/low = monitor.
- **"High"** means 3 by default. `stakeholder-analysis/scripts/grid.py --high-from 2`
  widens it; record the choice in the register if you change it.
- **Commitment (current → needed):** unaware → aware → understands → supports →
  committed / advocates. A gap of two or more steps on a high-influence
  stakeholder is a priority action.

## Change risk (landing risks)

Likelihood 1–3 × consequence 1–3 = 1–9. **High** 6–9 · **medium** 3–4 · **low** 1–2.

## Proficiency (training needs analysis)

| Score | Meaning |
| --- | --- |
| 0 | None — has not done this task |
| 1 | Aware — needs help to do it |
| 2 | Can do it with a guide or support |
| 3 | Can do it unaided and help others |

A gap of 2 or more between current and required is a priority learning need.

## Readiness (per group, per criterion)

| RAG | Meaning |
| --- | --- |
| Green | Evidence shows the criterion is met |
| Amber | Partly met, or met without evidence; action under way with an owner and date |
| Red | Not met, or no owner; will block the group working the new way |

Readiness without evidence is Amber at best. Default criteria: understands why;
knows what changes for them; leader has briefed them; trained; job aids
available; access and equipment ready; support route known; confidence
(self-reported). `readiness-assessment/scripts/readiness_rag.py` rolls these up.

## Go/no-go thresholds (defaults)

- **No-go** if any critical criterion is Red for a group with impact score 3 or
  more, or if sponsor commitment is Red.
- **Go with conditions** if Ambers exist with owners and dates before go-live.
- **Go** if all critical criteria are Green.

Critical criteria default: trained, access ready, support route known, leader
briefed.

## Change load (saturation)

Each initiative contributes load to a group per month equal to its impact score
for that group (0–4) in months where activity happens. Default capacity per
group per month: **6**. Above 6 = saturated (red); 4–6 = watch (amber).
`saturation-heatmap/scripts/heatmap.py` computes the grid.

## Individual change barrier (ADKAR-informed)

Rate each element 1 (absent) to 5 (strong) for a group, from evidence. The
first element in sequence rated 3 or below is the barrier point — act there
before later elements. Wording of questions is the plugin's own; do not copy
Prosci instruments.

## Change health check

Three areas — sponsorship, project management, change management — each rated
1–5 on four plugin-authored questions (see `change-health-check`). Any area
averaging below 3 is a material concern. Full verdict rules (Healthy / Some
concern / Material concern, insufficient-evidence handling, blocking findings)
are in `change-health-check/references/health-questions.md`.
