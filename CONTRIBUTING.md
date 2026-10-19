# Contributing

1. Read [AGENTS.md](AGENTS.md) and
   [change-conventions.md](references/change-conventions.md).
2. Start from the model skill `skills/change-impact-assessment/`.
3. Build evals before polishing prose: trigger queries first (include IT change
   control and sibling-skill near-misses), then 2–3 `evals.json` cases.
4. Prefer real, anonymised practitioner corrections over general knowledge.
5. Edit shared references only in root `references/`, then run `npm run sync`.
6. Run `npm install` once (dev only), then `npm run check` (typecheck, validate, tests).
7. Bump the version in `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`
   and `package.json`, and add a CHANGELOG entry. Keep the shared identity
   fields (`name`, `version`, `description`, `license`, `keywords`, `skills`,
   `author.name`) the same in both manifests.

## Third-party material

Do not paste text, templates or assessment instruments from Prosci, Kotter,
ACMP, CMI, McKinsey, William Bridges Associates or UC Berkeley. Open-licence
government material (CC BY, OGL) may be adapted only after its licence is
confirmed, with a file header and an entry in
[ATTRIBUTION.md](ATTRIBUTION.md).
