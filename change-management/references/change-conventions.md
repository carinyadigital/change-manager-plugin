# Change management conventions

The rules every `change-management` skill follows. Read this before writing or
reading any part of the change record.

## 1. What "change" means here

This plugin covers **organisational (people) change**: helping groups of people
move from how they work today to how they need to work after a project, system,
process, policy or structure change lands.

It does **not** cover IT or ITIL change control — change requests (RFCs),
Change Advisory Boards (CAB), release approvals, deployment change windows, or
database change runbooks. When a request is about those, say so in one line and
stop; do not produce a people-change artefact.

## 2. The change record

All skills read and write one connected record for one initiative, so context
flows between skills without re-entry.

**Artefact root:** `docs/change/` in the working folder, unless the practice
profile sets `artefact_root` to something else. One working folder = one
initiative. Portfolio views (`saturation-heatmap`) are the only skill that reads
across initiatives.

| Artefact | Path (under artefact root) | Written by | Read by |
| --- | --- | --- | --- |
| Change definition | `scope.md` | understand-change | everything |
| Stakeholder register | `stakeholder-register.md` | stakeholder-analysis | engagement, sponsor, network, comms, resistance |
| Impact register | `impact-register.md` (+ `impact-register.csv`) | impact-assessment | risk, strategy, TNA, readiness, saturation |
| Change risk register | `risk-register.md` | change-risk-assessment | strategy, health-check, status-report |
| Health check | `health-check.md` | change-health-check | strategy, sponsor-engagement |
| Change strategy and plan | `strategy.md` | change-strategy | every Manage-phase skill |
| Measurement plan | `measurement-plan.md` | measurement-plan | readiness, go-no-go, adoption-review |
| Sponsor roadmap | `sponsor-plan.md` | sponsor-engagement | comms, status-report |
| Engagement plan | `engagement-plan.md` | stakeholder-engagement | comms, status-report |
| Change network | `change-network.md` (+ `network-feedback.csv`; `champions.csv` working file for the coverage script) | change-network | resistance, readiness |
| Communications plan | `comms-plan.md` | communications-plan | comms-draft |
| Communication drafts | `comms/<YYYY-MM-DD>-<slug>.md` | comms-draft | status-report |
| Training needs analysis | `tna.md` (+ `tna.csv`), job aids in `job-aids/` | training-needs-analysis | readiness, go-no-go |
| Readiness assessment | `readiness/<YYYY-MM-DD>.md` (+ `readiness/readiness-<YYYY-MM-DD>.csv`) | readiness-assessment | go-no-go, status-report |
| Go/no-go verdict | `go-no-go.md` | go-no-go | go-live-support |
| Resistance log | `resistance-log.md` | resistance-management | status-report, reinforcement |
| Go-live support plan | `go-live-plan.md` | go-live-support | adoption-review |
| Portfolio heatmap | `portfolio/heatmap.md` (+ `portfolio/portfolio.csv`) | saturation-heatmap | change-risk-assessment |
| Adoption review | `adoption/<YYYY-MM-DD>.md` | adoption-review | reinforcement, bau-handover |
| Reinforcement plan | `reinforcement-plan.md` | reinforcement | bau-handover |
| BAU handover pack | `handover-pack.md` | bau-handover | — |
| Lessons learned log | `lessons-learned.md` | lessons-learned | bau-handover, status-report |
| Status reports | `status/<YYYY-MM-DD>.md` | status-report | — |

Templates for every artefact live in the owning skill's `assets/` folder.

## 3. Front block

Every artefact starts with this YAML block so other skills can traverse the
record and tell how fresh it is:

```yaml
---
artefact: impact-register          # matches the table above
initiative: <short initiative name from scope.md>
phase: prepare | manage | sustain | throughout
focus: [awareness, desire]         # individual-change elements this artefact mainly serves; optional
status: draft | reviewed | approved
owner: <role or name of the human accountable>
last_updated: YYYY-MM-DD
sources: [interviews, ~~project tracker, pasted business case]
---
```

`artefact` is the file's slug — the path's file name without date or
extension (`scope`, `stakeholder-register`, `risk-register`, `comms-plan`,
`comms-draft`, `tna`, `job-aid`, `readiness-assessment`, `go-no-go`, …). Skills
may add extra keys their template needs (for example `audience`, `sender`,
`approver` on comms drafts); other skills ignore keys they don't know.

A skill that reads an artefact older than the profile's `stale_after_days`
(default 30) says so before relying on it.

## 4. Writing rules

1. **Propose, then write.** Before creating or changing any file in the record,
   show the user what will be written (a summary for new files, the exact
   changed lines for existing ones) and wait for a yes. Never write to the
   practice profile from any skill except `setup`.
2. **Ground in the organisation's own data.** Use the change record, connected
   tools and what the user gives you. When something is unknown, ask once or
   mark it `[ASSUMPTION — confirm with <who>]`. Never invent names, numbers,
   survey results, dates or quotes. Confident-sounding specifics without data
   are the main way change tools mislead.
3. **Draft, never send.** Anything aimed at employees, leaders or customers is a
   draft saved to the record. Sending, posting, publishing and calendar invites
   are human steps. The plugin's hook asks for confirmation if a send-type tool
   is called anyway.
4. **Plain English, answer first.** Lead with the conclusion or decision, then
   the support. No consulting jargon on employee-facing material. Do not
   overstate benefits.
5. **People data is sensitive.** Record groups and roles, not named individuals,
   unless the user explicitly needs named stakeholders (sponsors, leaders,
   champions). Never record personal contact details, health, performance or
   disciplinary information. Report sentiment in aggregate (minimum group size
   from the profile, default 5).
6. **Read-only gates stay read-only.** `change-health-check`, `go-no-go`,
   `saturation-heatmap` and `adoption-review` write only their own verdict file.
   They never edit the artefacts they assess — they name the fixing skill.

## 5. Phase order and hand-offs

Prepare → Manage → Sustain. Recommended order, not a hard lock:

1. `understand-change` → `stakeholder-analysis` → `impact-assessment`
2. `change-risk-assessment`, `change-health-check`, `saturation-heatmap` (if other changes hit the same groups)
3. `change-strategy` → `measurement-plan`
4. Plans: `sponsor-engagement`, `stakeholder-engagement`, `change-network`, `communications-plan`, `training-needs-analysis`
5. Run: `comms-draft`, `resistance-management`, `readiness-assessment` (on cadence), `status-report` (weekly)
6. Gate: `go-no-go` → `go-live-support`
7. Sustain: `adoption-review` → `reinforcement` → `bau-handover`
8. Throughout: `lessons-learned`

When a skill needs an upstream artefact that does not exist, it offers the
upstream skill or asks for the minimum facts inline. It does not refuse.

## 6. Methods and naming

Use the method the organisation already uses (from the practice profile). If
none, default to a method-neutral approach and name concepts in plain words.
See [methods.md](methods.md) for how each framework is described and cited, and
[rating-scales.md](rating-scales.md) for default scales.

Do not label any output "Prosci", "ADKAR assessment" or "PCT assessment" unless
the profile records that the organisation holds a Prosci licence. Default
labels: "individual change barrier diagnostic (ADKAR-informed)" and "change
health check (sponsorship / project management / change management)".

## 7. Connectors

Skills name tools by category (`~~chat`, `~~survey`) — see
[CONNECTORS.md](../CONNECTORS.md). Every skill works with no connectors: the
user pastes or uploads the material instead. Connectors are read-first; writes
are drafts or need confirmation.

## 8. Standard footer

Every artefact ends with:

> Draft prepared with the change-management plugin for review by <owner>. It
> supports, and does not replace, the judgement of the people accountable for
> this change.
