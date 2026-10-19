# Connectors

## How tool references work

Plugin files use `~~category` as a placeholder for whatever tool the user
connects in that category. For example, `~~chat` might mean Slack or Microsoft
Teams.

The plugin is **tool-agnostic** and **works with no connectors at all** — every
skill falls back to the user pasting or uploading material. Connectors save
re-typing; they are never required.

## In `.mcp.json`

None shipped. Add servers for the tools your organisation actually uses (see
below). Most change teams start with their office suite, chat and project
tracker.

## Policy

| Rule | Why |
| --- | --- |
| **Read first.** Skills read from connectors freely. | Grounds output in the organisation's own data. |
| **Draft, never send.** Email, chat posts, intranet articles and calendar invites are saved as drafts in `docs/change/`. | Employee-facing messages need human sign-off. The `draft-guard` hook asks for confirmation if a send/post/publish tool is called. |
| **Writes need confirmation.** Creating tracker items, whiteboard boards or LMS records is shown first and done only on a yes. | Keeps the human as the decision-maker. |
| **HR and survey data is read-only and aggregated.** | People data is sensitive; report groups, not individuals. |
| **Credentials stay in your connector setup.** | The plugin never asks for, stores or echoes keys. |

## Suggested additions

Availability checked in the October 2026 research; re-check before relying on it.

| Category | Placeholder | Examples (status at research date) |
| --- | --- | --- |
| Office suite, email, calendar, files | `~~office suite` | Microsoft 365 (official Claude connector), Google Workspace |
| Chat | `~~chat` | Slack (official server, `https://mcp.slack.com/mcp`, needs workspace-admin approval); Microsoft Teams via Microsoft 365 |
| Project tracker / wiki | `~~project tracker` | Atlassian Jira and Confluence (official), monday.com, Asana, Smartsheet (official) |
| Cloud storage | `~~cloud storage` | SharePoint / OneDrive (via Microsoft 365), Google Drive |
| IT service management | `~~itsm` | ServiceNow (official, Zurich release) |
| Survey / pulse | `~~survey` | Culture Amp (official, limited scope); Qualtrics (API — treat as manual); Microsoft Forms / Viva Glint (no server — paste exports) |
| HR information system | `~~hris` | Workday, SAP SuccessFactors (third-party servers only, e.g. StackOne, CData — read-only, least privilege) |
| Learning management | `~~lms` | Cornerstone, Docebo, Workday Learning (API — usually paste exports) |
| Digital adoption | `~~digital adoption` | Pendo (server available); WalkMe, Whatfix (API) |
| Analytics / BI | `~~analytics` | Power BI (official, preview), Tableau (official) |
| Internal comms | `~~internal comms` | Staffbase, Poppulo, Simpplr (no servers — draft here, publish manually) |
| Whiteboard | `~~whiteboard` | Miro (official); Mural (community) |

## Used by skill

| Skill | Connectors (all optional) |
| --- | --- |
| **setup** | Whatever is declared in `.mcp.json` (`--check-integrations`) |
| **skills-index** | None |
| **understand-change** | `~~cloud storage`, `~~project tracker`, `~~office suite` |
| **stakeholder-analysis** | `~~hris`, `~~office suite` |
| **impact-assessment** | `~~project tracker`, `~~cloud storage`, `~~hris` (headcounts) |
| **change-risk-assessment** | `~~project tracker` |
| **change-health-check** | `~~survey` |
| **change-strategy** | None beyond the record |
| **measurement-plan** | `~~analytics`, `~~digital adoption`, `~~survey` |
| **sponsor-engagement** | `~~office suite` (calendar, read only) |
| **stakeholder-engagement** | `~~office suite`, `~~whiteboard` |
| **change-network** | `~~chat`, `~~survey` |
| **communications-plan** | `~~internal comms`, `~~office suite` |
| **comms-draft** | Drafts only — `~~office suite`, `~~chat`, `~~internal comms` |
| **training-needs-analysis** | `~~lms` |
| **readiness-assessment** | `~~survey`, `~~lms`, `~~project tracker` |
| **go-no-go** | None beyond the record |
| **resistance-management** | `~~chat`, `~~survey` |
| **go-live-support** | `~~itsm`, `~~project tracker` |
| **saturation-heatmap** | `~~project tracker`, `~~hris` |
| **adoption-review** | `~~digital adoption`, `~~analytics`, `~~survey`, `~~itsm`, `~~lms` |
| **reinforcement** | Drafts only — `~~internal comms`, `~~chat` |
| **bau-handover** | `~~project tracker` |
| **lessons-learned** | `~~chat`, `~~project tracker` |
| **status-report** | `~~project tracker`; drafts to `~~office suite` |
