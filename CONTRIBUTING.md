# Contributing

1. Read [AGENTS.md](AGENTS.md) and
   [change-conventions.md](references/change-conventions.md).
2. Start from the model skill `skills/change-impact-assessment/`.
3. Build evals before polishing prose: trigger queries first (include IT change
   control and sibling-skill near-misses), then 2–3 `evals.json` cases.
4. Prefer real, anonymised practitioner corrections over general knowledge.
5. Edit shared references only in root `references/`, then run `npm run sync`.
6. Run `npm install` once (dev only), then `npm run check` (typecheck, validate, tests).
7. Do not bump the version or add a CHANGELOG entry in a feature PR. The
   release workflow is disabled. To cut a release by hand, run
   `node scripts/release.ts bump <patch|minor|major> --notes <file>`, which
   keeps every version file in step. Keep the shared identity fields (`name`,
   `version`, `description`, `license`, `keywords`, `skills`, `author.name`)
   the same in both manifests.
8. Pull requests run the policy scan (hook scope, undisclosed network calls,
   and whether the install description matches what the plugin does). A failing
   scan names the file and what a user would not have been told. Run
   `npm run check` locally before opening a PR.

## Third-party material

Do not paste text, templates or assessment instruments from Prosci, Kotter,
ACMP, CMI, McKinsey or William Bridges Associates. Write all material in the
plugin's own words. Do not name, link to or cite government bodies, public
sector publications or client organisations in any skill, reference, template
or user-facing document. Methods are named and credited as set out in
[ATTRIBUTION.md](ATTRIBUTION.md) and [TRADEMARKS.md](TRADEMARKS.md).
