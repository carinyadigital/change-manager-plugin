# Initiative health (PCT-style) — cheat-sheet

The Prosci Change Triangle (PCT) is Prosci, Inc.'s model of initiative health.
This page describes the general idea in our own words; it does not reproduce
the PCT Assessment or its scoring. Further reading: https://www.prosci.com

## The idea

A change is healthy when three things are strong at once, all anchored on a
clear definition of success:

| Area | Ask | Weakness looks like |
| --- | --- | --- |
| **Sponsorship / leadership** | Is a sponsor visibly, actively leading it and building a coalition below them? | Delegated sponsorship, mixed messages from leaders, no time given |
| **Project management** | Is the technical side planned, resourced and governed? | Slipping scope and dates, unclear decisions |
| **Change management** | Is the people side planned and resourced? | No impact assessment, comms as an afterthought, training as the plan |

Visible, active sponsorship has been the top contributor to success in every
edition of Prosci's *Best Practices in Change Management* study — which is why
the plugin checks sponsorship early.

## How the plugin uses it

- `sponsor-assessment` — a read-only health check across the three areas using
  the plugin's own 12 questions
  (`skills/sponsor-assessment/references/health-questions.md`), rated 1–5 from
  evidence. Output: `docs/change/pct-assessment.md`.
- Verdict rules: [rating-scales.md](rating-scales.md) → "Change health check".

## Labelling rule

The output is titled "Change health check (sponsorship / project management /
change management)". Call it a "PCT assessment" only if the practice profile
records a Prosci licence.
