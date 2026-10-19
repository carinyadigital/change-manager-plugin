# Roadmap

## Where v0.1.0 stands

All 25 skills, 4 scheduled agents, 2 hooks and 7 scripts exist and pass the
structural validator. None has yet been run against a real initiative. The
skills are built from the two research reports in the Change Management
project ("Design and Research Findings" and "Leading Artefacts, Sources and
Licensing"), reconciled as below.

## Decisions taken when reconciling the research

| Topic | Research said | v0.1.0 does | Why |
| --- | --- | --- | --- |
| Plugin name | `change-practice` (report 1); `change-` prefixed skills (report 2) | Plugin `change-management`; unprefixed skill names (`/change-management:impact-assessment`) | Matches the current Carinya family naming (`product-management`, `engineering`); the plugin namespace already disambiguates. Every description excludes IT change control to handle the naming collision report 2 flagged. |
| Granularity | ~24 skills (report 1) vs ~11 merged skills (report 2) | 25 skills, one per artefact | One artefact per skill keeps gates separate from authoring and gives clean trigger boundaries. Watch for over-triggering in evals; merge if needed. |
| Personas | Five persona agent files with tool scopes (report 1) | Personas are documented roles over one skill library; `agents/` holds scheduled agents | Current Carinya convention: "personas are not separate agent plugins". |
| Default `.mcp.json` | Bundle Microsoft 365, Slack, Atlassian (report 1) | Ships empty; suggestions in CONNECTORS.md | Matches current family convention; Microsoft 365 is a Claude connector rather than a URL to bundle; avoids shipping endpoints not verified for every host. |
| Bundled third-party text | Adapt APS / NHS / Qld under CC BY / OGL (report 2) | Linked as further reading only; all bundled content original | Several licences are presumed, not confirmed (see release gates). |
| Hooks | PII guard, draft-never-send guard, profile-write confirm | Draft guard and people-data guard as `ask` hooks; profile-write confirm is a skill rule (only `setup` writes the profile) | A hook can't reliably tell a profile write from other writes without false positives. |

## Phase 1 — field-test the MVP (next)

Skills: `setup`, `skills-index`, `understand-change`, `stakeholder-analysis`,
`impact-assessment`, `comms-draft`.

- Run each on one real (anonymised) initiative; capture corrections into the
  skill bodies and gotchas.
- Run the trigger evals (`evals/trigger-queries.json`) 3× per query with the
  description-optimisation loop; tune descriptions that over- or under-fire,
  especially the four Prepare skills that overlap most.
- Add 2–3 more `evals.json` cases per MVP skill from real outputs.
- **Advance when** skills trigger reliably on practitioner phrasing and write to
  the right paths.

## Phase 2 — Prepare/Manage core

`change-risk-assessment`, `change-strategy`, `communications-plan`,
`sponsor-engagement`, `training-needs-analysis`, `readiness-assessment`,
`resistance-management`, `status-report`; connect Microsoft 365, Slack and
Atlassian and test the read-first paths. **Advance when** a full Prepare →
Manage record is coherent end to end.

## Phase 3 — gap-fillers and Sustain

`change-health-check`, `measurement-plan`, `change-network`, `go-no-go`,
`go-live-support`, `saturation-heatmap`, `adoption-review`, `reinforcement`,
`bau-handover`, `lessons-learned`; read-only survey, analytics and digital
adoption connectors.

## Later

- `meeting-prep` skill (sponsor and steering meeting prep and follow-up).
- Optional `change-portfolio` plugin if portfolio features outgrow
  `saturation-heatmap`.
- `.xlsx` exports of registers (own scripts — do not vendor Anthropic's
  source-available document skills).
- Managed-agent cookbooks for the scheduled agents.

## Release gates (before any public release)

1. **Licences confirmed** for anything adapted rather than linked: Queensland
   "Communicating for change" PDF (CC BY 4.0 presumed), NHS Change Model Guide
   and Sustainability Guide PDFs (OGL presumed, check third-party diagrams),
   individual APS template files (framework PDF is CC BY 4.0).
2. **Connector availability re-checked** (Qualtrics, Workday/SuccessFactors,
   Power BI preview status move quickly).
3. **Cited figures** carry a named source and edition (e.g. Prosci saturation
   78% vs ~73% by edition).
4. `python3 scripts/validate.py` and `python3 -m unittest discover tests` pass.
5. Trademark notices current in `change-management/TRADEMARKS.md`.

## Open questions

- Should the plugin bootstrap the Carinya instance layer (`config/instance.json`)
  like sibling practices, or stay standalone? v0.1.0 reads it if present and
  never writes it.
- Should this plugin move into the main `carinyadigital/agent-plugins`
  marketplace once field-tested?
- Non-code templates under CC BY 4.0 instead of MIT (report 2's suggestion)?
