# Change Practice plugin — contributor guide

A single, multi-persona practice plugin — `change-practice` — for
organisational change management in Claude Code, Claude (Cowork) and Cursor.
The repo root is the plugin root; there is no marketplace manifest.

`CLAUDE.md` at the root is the practice-profile **template** shipped to users,
not contributor guidance. This file is the contributor guide.

## Layout

| Path | What it holds |
| --- | --- |
| `skills/<name>/` | Self-contained [Agent Skills](https://agentskills.io/specification): `SKILL.md`, `references/`, `assets/`, `scripts/`, `evals/` |
| `agents/` | Five persona agents; each lists the skills it owns and its least-privilege scope |
| `hooks/` | `hooks.json` and the TypeScript guards it runs |
| `references/` | Canonical shared references, copied into skills by `npm run sync` |
| `.mcp.json`, `CONNECTORS.md` | Bundled connectors and the `~~category` map |
| `scripts/`, `tests/` | Development tooling only |

There is no `commands/` directory — commands are deprecated; everything a user
invokes is a skill.

## Rules

- **Conventions first.** `references/change-conventions.md` is the contract for
  artefact paths under `docs/change/`, the front block, writing rules and phase
  order. Change it first, run `npm run sync`, then update skills.
- **Self-contained skills.** A skill links only to files inside its own folder.
  Shared references are edited only in root `references/` and copied in by
  `npm run sync`; the validator fails on drift or on links that leave the
  skill folder.
- **Frontmatter (Agent Skills spec).** `name` = folder name; `description`
  ≤ 1024 chars with "Use when…", trigger phrases, and "Do NOT use for…" naming
  sibling skills and IT change control; `allowed-tools` as a space-separated
  string; `metadata` values are strings (`version`, `owner: change-practice`,
  `review_cadence`, `work_shape`, `output_class`, `phase`, `persona`).
- **Body.** Required headings: When to use · What this skill does not do ·
  Preconditions · Trust spine · Workflow · Outputs. Under 500 lines.
- **Evals.** Every skill has `evals/trigger-queries.json` with 10–20 queries
  (≥5 should trigger, ≥5 near-miss should not). Core skills also have
  `evals/evals.json`.
- **Scripts and hooks** are TypeScript that Node 22.18+ runs directly:
  erasable syntax only (no enums, namespaces or parameter properties), `node:`
  standard library only, no runtime dependencies. Skills call
  `node ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/scripts/<file>.ts` and declare
  `Bash(node:*)`.
- **Ownership.** Every skill except `setup` and `skills-index` is owned by
  exactly one persona agent (its `skills` list).
- **Original content only.** Describe proprietary methods in our own words;
  see `references/methods.md`.
- **New skill** → add it to an agent's `skills` list, `CONNECTORS.md` "Used by
  skill", the `skills-index` routing table, `README.md`, and
  `change-conventions.md` if it writes an artefact.

## Before opening a PR

```bash
npm install     # once — TypeScript and Node types, dev only
npm run sync
npm run check   # typecheck + validate + tests
```
