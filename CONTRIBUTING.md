# Contributing

1. Read [AGENTS.md](AGENTS.md) and
   [change-conventions.md](change-management/references/change-conventions.md).
2. Start from the model skill `change-management/skills/impact-assessment/`.
3. Build evals before polishing prose: trigger queries first (include IT change
   control and sibling-skill near-misses), then 2–3 `evals.json` cases.
4. Prefer real, anonymised practitioner corrections over general knowledge.
5. Run `python3 scripts/validate.py` and `python3 -m unittest discover tests`.
6. Bump the plugin version in both `plugin.json` files and add a CHANGELOG entry.

## Third-party material

Do not paste text, templates or assessment instruments from Prosci, Kotter,
ACMP, CMI, McKinsey, William Bridges Associates or UC Berkeley. Open-licence
government material (CC BY, OGL) may be adapted only after its licence is
confirmed, with a file header and an entry in
[ATTRIBUTION.md](change-management/ATTRIBUTION.md).
