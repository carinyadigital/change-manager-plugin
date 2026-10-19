# Roadmap

## Where v0.1.0 stands

The plugin follows the design in "Change Practice Claude Plugin: Design and
Research Findings": one multi-persona practice plugin, `change-practice`, with
the design's skill catalogue (23 skills plus `meeting-prep` and
`stakeholder-pulse`), five persona agents, three guard hooks, bundled
connectors and one shared change record under `docs/change/`. Everything passes
`npm run check`. No skill has yet been run against a real initiative.

## Where the build differs from the design, and why

| Design | Build | Why |
| --- | --- | --- |
| `commands/` folder (thin wrappers; `meeting-prep`) | No `commands/`. `meeting-prep` and the daily pulse (`stakeholder-pulse`) are skills | Commands are deprecated; skills are the invocable unit and follow the Agent Skills standard |
| Root `templates/` folder | Templates live in each skill's `assets/` | Agent Skills keep a skill's templates inside the skill so it is self-contained |
| Root `references/` cheat-sheets | Kept as the canonical copy; `npm run sync` copies what each skill links into `skills/<skill>/references/` | Same reason — a skill only links inside its own folder; the validator blocks drift |
| `.mcp.json` bundles M365, Slack, Atlassian | Microsoft 365 and Teams via Work IQ in `.mcp.json` | Microsoft's current remote server is one endpoint. The separate Teams server needs a tenant id and is kept for older setups |
| Draft-never-send hook "blocks" sends | Hook asks for human confirmation | Matches the design's human-approval point without breaking a legitimate approved send |
| `pct-assessment.md` for the sponsor health check | Path kept; the document is titled "Change health check" unless the profile records a Prosci licence | Prosci IP caveat in the design |
| Validation via a `validate.py`-style script | `scripts/validate.ts`, plus `tsc` and a `node:test` suite | Scripts and hooks are TypeScript (Node runs it directly; Cowork runs Node natively) |

## Where v0.2.0 stands (alpha)

Fourteen skills carry uplifted, original artefacts: reference guides,
instruments (question banks, worksheets, measure library, risk prompts) and
extra templates (see `CHANGELOG.md`). Fourteen skills now have output-quality
`evals.json` cases. The plugin is ready for alpha testing with practising
change managers using [ALPHA-TESTING.md](ALPHA-TESTING.md). Still not done:
a worked example run end to end on one anonymised initiative, real-run trigger
evals, and `.xlsx` exports.

## Phase 1 — field-test the MVP (next)

`setup`, `skills-index`, `understand-change`, `stakeholder-analysis`,
`change-impact-assessment`, `comms-draft`.

- Run each on one real, anonymised initiative; fold corrections into the skill
  bodies and gotchas.
- Alpha testers follow [ALPHA-TESTING.md](ALPHA-TESTING.md); turn every
  "wrong skill" row into a trigger query and every "invented" or "wouldn't
  use" row into an `evals.json` assertion.
- Build one connected worked example (the contact-centre CRM rollout already
  seeded in the CSVs) as reference output for each skill.
- Run the trigger evals 3× per query; tune descriptions that over- or
  under-fire, especially the overlapping Prepare skills.
- Add 2–3 more `evals.json` cases per MVP skill from real outputs.
- **Advance when** skills trigger reliably on practitioner phrasing and write to
  stable paths.

## Phase 2 — Prepare/Manage core

`change-risk-assessment`, `change-strategy`, `communications-plan`,
`sponsor-engagement`, `training-needs-analysis`, `business-readiness`,
`resistance-management`, `weekly-status`, `meeting-prep`, `stakeholder-pulse`;
sign in to Microsoft 365 and Teams and test the read-first paths.
**Advance when** a full Prepare → Manage record is coherent end to end.

## Phase 3 — gap-fillers and Sustain

`sponsor-assessment`, `measurement-plan`, `change-network`, `readiness-review`,
`golive-transition`, `adoption-measurement`, `reinforcement`, `bau-handover`,
`lessons-learned`, `portfolio-saturation`; add read-only survey, analytics and
digital-adoption connectors.

## Later

- Managed-agent cookbooks for the persona agents (design recommendation 6).
- A thin `change-portfolio` plugin if portfolio features outgrow
  `portfolio-saturation`.
- A skills-qa review of every skill (trust surface, freshness, schema,
  conflicts) with a Ready / Some Concern / Material Concerns verdict.
- `.xlsx` exports of registers (own scripts — do not vendor Anthropic's
  source-available document skills).

## Release gates (before any public release)

1. Licences confirmed for anything adapted rather than linked: Queensland
   "Communicating for change" (CC BY 4.0 presumed), NHS Change Model and
   Sustainability guides (OGL presumed; check third-party diagrams), individual
   APS template files (framework PDF is CC BY 4.0).
2. Connector availability and the bundled `.mcp.json` URLs re-checked.
3. Cited figures carry a named source and edition (e.g. Prosci saturation 78%
   vs ~73% by edition).
4. `npm run check` passes.
5. Trademark notices current in `TRADEMARKS.md`.

## Open questions

- Install under the Carinya `agency-hub` / instance bootstrap (as the design
  suggests), or keep standalone? v0.1.0 reads `config/instance.json` if present
  and never writes it.
- Which marketplace lists it once field-tested?
- Non-code templates under CC BY 4.0 instead of MIT?
