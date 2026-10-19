# Change Manager Plugin for Agents

A reference collection of agents, skills and connector guidance for
organisational change managers, packaged as a Claude plugin marketplace. Works
in Claude Code, Claude (Cowork) and Cursor.

| Plugin | What it is | Status |
| --- | --- | --- |
| [`change-management`](change-management/README.md) | The full change practice: 25 skills across Prepare → Manage → Sustain, 4 scheduled agents, 2 guard hooks, one shared change record in `docs/change/` | v0.1.0 — scaffold, not yet field-tested |

## Install

```text
/plugin marketplace add carinyadigital/change-manager-plugin
/plugin install change-management@change-manager-plugins
/change-management:setup
```

## Why this exists

Existing AI tools for change managers are closed SaaS products or generic chat
assistants. This is an open, tool-agnostic, file-based practice the
practitioner owns: artefacts are plain markdown and CSV in their own folder,
version-controlled, and grounded in their organisation's data rather than
generic best practice.

## Design principles

1. **One record, many skills.** Every skill reads and writes the same
   `docs/change/` record, so impacts flow into risks, training, readiness and
   saturation without re-entry.
2. **Draft, never send.** Employee-facing material is always a draft. A hook
   asks for confirmation if a connected tool tries to send.
3. **Grounded, not confident.** No invented people, numbers or quotes;
   unknowns are asked or marked as assumptions.
4. **Gates are read-only.** Health check, go/no-go, saturation and adoption
   reviews give a verdict and name who fixes what. People decide.
5. **Method-neutral and IP-clean.** Uses the organisation's method; describes
   proprietary frameworks in our own words with attribution.
6. **Works without connectors.** Every skill degrades to paste/upload.

## Repo layout

```
.claude-plugin/marketplace.json      # marketplace (Cursor copy in .cursor-plugin/)
change-management/                   # the practice plugin
  .claude-plugin/plugin.json
  CLAUDE.md                          # practice profile template (setup fills a personal copy)
  CONNECTORS.md                      # ~~category map and connector policy
  agents/                            # scheduled agents
  hooks/                             # draft guard + people-data guard
  references/                        # conventions, methods, rating scales
  skills/<skill>/                    # SKILL.md, assets/, references/, scripts/, evals/
  ATTRIBUTION.md · TRADEMARKS.md     # third-party sources and marks
docs/ROADMAP.md                      # build phases, open items, release gates
scripts/validate.py                  # structural validator
tests/                               # script and hook tests
```

## Develop

```bash
python3 scripts/validate.py          # manifests, frontmatter, headings, links, evals, coverage
python3 -m unittest discover tests   # bundled scripts and hooks
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

## Licence

MIT — see [LICENSE](LICENSE). Third-party frameworks are referenced, not
reproduced; see [ATTRIBUTION.md](change-management/ATTRIBUTION.md) and
[TRADEMARKS.md](change-management/TRADEMARKS.md).
