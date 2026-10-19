---
name: setup
description: >
  Setup interview for the change practice — method, Prosci licence,
  people-data jurisdiction, scales and thresholds, cadence, comms approval
  chain, house style and connector status — written to the practice profile at
  ~/change-practice/CLAUDE.md. Run on first install or to redo defaults
  (--redo, --check-integrations). Do NOT use to scope an initiative
  (understand-change) or for IT change control.
license: MIT
argument-hint: "[--quick|--full] [--redo] [--resume] [--check-integrations]"
allowed-tools: Read Write Glob Grep
disable-model-invocation: true
metadata:
  author: Carinya Digital
  version: "0.1.0"
  owner: change-practice
  review_cadence: quarterly
  work_shape: orchestrate-delivery
  output_class: structured-data
  phase: setup
  persona: all
---

# /change-practice:setup

## When to use

First run after install; re-run when the organisation's method, thresholds,
cadence, approval chain or connectors change. Explicit invocation only — every
other skill reads the profile this writes, and falls back to defaults if it is
missing.

## What this skill does not do

- **Does not scope an initiative** — that is `understand-change`.
- **Does not install connectors or plugins** — it reports status and points to
  the plugin's `CONNECTORS.md`.
- **Does not write without an explicit yes** after showing the summary.

## Preconditions

Read before proceeding:

- [change-conventions.md](references/change-conventions.md)
- [rating-scales.md](references/rating-scales.md)
- [methods.md](references/methods.md)
- The profile template at `${CLAUDE_PLUGIN_ROOT}/CLAUDE.md`

Honour flags: `--quick`, `--full`, `--redo`, `--resume`, `--check-integrations`.

| Input | If missing |
| --- | --- |
| Existing profile at `~/change-practice/CLAUDE.md` | Start a new interview |

## Trust spine

- **Accountability.** The user decides every value; the skill proposes defaults
  from `rating-scales.md` and labels them as defaults.
- **Scope.** Writes one file only — the practice profile at the personal config
  path — plus a resume file if paused. Never writes into the plugin directory
  or the change record.
- **Integration honesty.** Reports a connector as connected only after a
  successful read call; otherwise "configured, not verified" or "not found".
- **Licensing.** If the user says they have no Prosci licence, the profile
  records that and all skills use plain-English labels.

## Workflow

### Step 0 — Detect existing state

1. Read the existing profile unless `--redo`. If complete, summarise it and
   offer refresh, `--redo` or `--check-integrations`. Stop unless chosen.
2. If a resume file exists, summarise progress and offer to continue.

### Step 1 — Mode

Offer quick (persona preference, method, licence, jurisdiction, status cadence
and audience, comms approver — accept all other defaults) or full. Tell the user: "Say **pause**
any time and I'll save progress for `--resume`."

### Step 2 — Integrations

For each category in `CONNECTORS.md`, check whether a matching tool is
available and record ✓ / ⚪ / ✗ with the manual fallback. With
`--check-integrations` alone, stop here.

### Step 3 — Interview (2–3 questions per turn)

1. **Who's using this** — personas in play, and the persona preference:
   **distinct** (work routed to the five persona agents — change-lead,
   stakeholder-sponsor-coach, comms-specialist, training-designer,
   readiness-adoption-analyst) or **merged** (one Change Lead does everything).
   Organisation, sector, rough headcount, typical change types.
2. **Method** — which method the organisation already uses; whether it holds a
   Prosci licence; any in-house templates to follow (paths).
3. **People data** — jurisdiction; minimum group size for reporting sentiment
   (default 5).
4. **Scales and thresholds** — accept defaults or change impact scale,
   readiness critical criteria, go/no-go rule, change capacity per group per
   month.
5. **Cadence and audiences** — status cadence, format and audience; readiness
   check cadence; comms approval chain; house style guide.
6. **Record** — artefact root (default `docs/change/`), stale-after days.

### Step 4 — Summarise before write

Show the filled profile in plain language, list deliberate skips, and ask:
**"Write the practice profile? (yes/no)"**

### Step 5 — Write

Write `~/change-practice/CLAUDE.md`
from the template with answers filled and `Status: complete`. Delete the resume
file if present.

### Step 6 — Next steps

1. `/change-practice:understand-change` — define the first initiative
2. `/change-practice:stakeholder-analysis` and `/change-practice:change-impact-assessment`
3. `/change-practice:skills-index` — any time you're not sure where to start

## Pause and resume

On pause, write
`~/change-practice/setup-resume.json`:

```json
{
  "plugin": "change-practice",
  "skill": "setup",
  "mode": "quick|full",
  "startedAt": "ISO-8601",
  "answers": {},
  "remainingSteps": [],
  "lastStepCompleted": ""
}
```

## Outputs

| Artefact | Path |
| --- | --- |
| Practice profile | `~/change-practice/CLAUDE.md` |
| Resume file (only if paused) | `~/change-practice/setup-resume.json` |
