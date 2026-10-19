# Change Manager Plugin — agent guide

Marketplace repo for the `change-management` practice plugin (organisational
change management for Claude Code, Claude/Cowork and Cursor).

## Layout

- `change-management/` owns every skill, agent, hook and reference. Edit skills
  in `change-management/skills/<name>/` only.
- `change-management/references/change-conventions.md` is the contract every
  skill follows (artefact paths under `docs/change/`, front block, writing
  rules, phase order). Change it first if a convention changes, then update
  the skills.
- Root `.claude-plugin/` and `.cursor-plugin/` marketplace manifests must stay
  identical; each plugin's two `plugin.json` files must stay identical.

## Skill rules

- Frontmatter: `name` = folder, `description` ≤ 1024 chars with "Use when…",
  trigger phrases and "Do NOT use for…" naming siblings; `allowed-tools`;
  `metadata.version`, `owner`, `review_cadence`, `work_shape`, `output_class`.
- Required headings: When to use · What this skill does not do · Preconditions
  · Trust spine · Workflow · Outputs.
- Every skill has `evals/trigger-queries.json` (≥5 positive, ≥5 near-miss
  negative). Skills with scripts declare `Bash(python3:*)`.
- Original content only. Describe proprietary methods in our own words; see
  `change-management/references/methods.md`.
- New skill → add it to `CONNECTORS.md` "Used by skill", the `skills-index`
  routing table, the plugin README, and `change-conventions.md` if it writes
  an artefact.

## Before opening a PR

```bash
python3 scripts/validate.py
python3 -m unittest discover tests
```
