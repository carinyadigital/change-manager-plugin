# Changelog

## 0.1.0 — 2026-10-19

- `change-practice`: single, multi-persona practice plugin at the repo root,
  following the design's skill catalogue, persona agents, hooks and connector
  policy.
- 25 skills as self-contained Agent Skills; shared references synced into each
  skill.
- Five persona agents with skill ownership and least-privilege scopes.
- Draft-never-send, people-data and practice-profile guard hooks.
- Slack and Atlassian bundled in `.mcp.json`; Microsoft 365 via Claude connector.
- Seven scoring scripts, hooks, validator, reference sync and tests in
  TypeScript (Node 22.18+, no runtime dependencies).
