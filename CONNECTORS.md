# Connectors

## How tool references work

Plugin files use `~~category` as a placeholder for whatever tool the user
connects in that category. For example, `~~chat` might mean Microsoft
Teams or Slack.

The plugin is **tool-agnostic** and **works with no connectors at all** — every
skill falls back to the user pasting or uploading material. Connectors save
re-typing; they are never required.

## Bundled defaults

The plugin bundles Microsoft's [Work IQ](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/overview) server. One endpoint covers Microsoft 365 and Teams. Microsoft's separate Teams server is per-tenant and kept for older setups, so it is not packaged.

| Category | Server | How it's provided | Notes |
| --- | --- | --- | --- |
| `~~office suite` | Microsoft 365 (Outlook, calendar, SharePoint, OneDrive) | `.mcp.json` → `https://workiq.svc.cloud.microsoft/mcp` (official, Microsoft-hosted) | Each user signs in with their work account. A tenant admin may need to allow Work IQ the first time. |
| `~~chat` | Microsoft Teams | The same server. Chats and channels are paths on it (`/me/chats`, `/teams/…`), not a second URL. | Posts, replies and new chats are ask-first. |

Write tools can send mail, post Teams chat and channel messages, start chats, change calendar events and write SharePoint files. The `draft_guard` hook treats this server as ask-first: searches, reads and Outlook drafts run; every other tool asks you before it runs.

If your organisation uses different tools (Google Workspace, Slack, monday.com or Jira), replace or remove the entry in `.mcp.json`. Every skill still works with nothing connected.

## Policy

| Rule | Why |
| --- | --- |
| **Read first.** Skills read from connectors freely. | Grounds output in the organisation's own data. |
| **Draft, never send.** Email, chat posts, intranet articles and calendar invites are saved as drafts in `docs/change/`. | Employee-facing messages need human sign-off. The `draft_guard` hook asks for confirmation if a send/post/publish tool is called. |
| **Writes need confirmation.** Creating tracker items, whiteboard boards or LMS records is shown first and done only on a yes. | Keeps the human as the decision-maker. |
| **HR and survey data is read-only and aggregated.** | People data is sensitive; report groups, not individuals. The `people_data_guard` hook asks before personal contact details are written to the record. |
| **Credentials stay in your connector setup.** | The plugin never asks for, stores or echoes keys. |

## Suggested additions

For the other categories. Availability checked in the October 2026 research; re-check before relying on it.

| Category | Placeholder | Examples (status at research date) |
| --- | --- | --- |
| Office suite, email, calendar, files | `~~office suite` | Microsoft 365 (bundled, Work IQ), Google Workspace |
| Chat | `~~chat` | Microsoft Teams (bundled, same Work IQ server); Slack (official server, `https://mcp.slack.com/mcp`, needs workspace-admin approval) |
| Project tracker / wiki | `~~project tracker` | Atlassian Jira and Confluence (`https://mcp.atlassian.com/v1/mcp/authv2`), monday.com, Asana, Smartsheet (official) |
| Cloud storage | `~~cloud storage` | SharePoint / OneDrive (via the bundled Microsoft 365 server), Google Drive |
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
| **change-impact-assessment** | `~~project tracker`, `~~cloud storage`, `~~hris` (headcounts) |
| **change-risk-assessment** | `~~project tracker` |
| **sponsor-assessment** | `~~survey` |
| **change-strategy** | None beyond the record |
| **measurement-plan** | `~~analytics`, `~~digital adoption`, `~~survey` |
| **sponsor-engagement** | `~~office suite` (calendar, read only) |
| **stakeholder-engagement** | `~~office suite`, `~~whiteboard` |
| **change-network** | `~~chat`, `~~survey` |
| **communications-plan** | `~~internal comms`, `~~office suite` |
| **comms-draft** | Drafts only — `~~office suite`, `~~chat`, `~~internal comms` |
| **training-needs-analysis** | `~~lms` |
| **business-readiness** | `~~survey`, `~~lms`, `~~project tracker` |
| **readiness-review** | None beyond the record |
| **resistance-management** | `~~chat`, `~~survey` |
| **golive-transition** | `~~itsm`, `~~project tracker` |
| **portfolio-saturation** | `~~project tracker`, `~~hris` |
| **adoption-measurement** | `~~digital adoption`, `~~analytics`, `~~survey`, `~~itsm`, `~~lms` |
| **reinforcement** | Drafts only — `~~internal comms`, `~~chat` |
| **bau-handover** | `~~project tracker` |
| **lessons-learned** | `~~chat`, `~~project tracker` |
| **meeting-prep** | `~~office suite` (calendar, read only), `~~project tracker` |
| **stakeholder-pulse** | `~~chat` (nominated channels), `~~survey` |
| **weekly-status** | `~~project tracker`; drafts to `~~office suite` |
