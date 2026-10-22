# Privacy notice

Change Practice is a plugin by Carinya Digital for drafting organisational
change documents. This notice describes what the plugin itself does with
information. The app you use it in — Claude or ChatGPT — handles the
conversation under that product's own terms.

Last updated: 22 October 2026.

## What stays in your workspace

Skills write drafts into `docs/change/` in the working folder you choose, and
only after you confirm. Setup can write a practice profile to
`~/change-practice/CLAUDE.md` on your machine. Those files are yours. Carinya
Digital does not receive them, and the plugin has no account, analytics, or
telemetry of its own.

On Claude, three local hooks can pause a tool call and ask you first: before
a connected tool sends or publishes, before an email address or phone number
is written into the change record, and before the practice profile is
changed. The hooks do not send the text anywhere. ChatGPT Work on the web
does not run those hooks.

## Microsoft 365 and Teams

The plugin can connect to Microsoft's Work IQ server at
`https://workiq.svc.cloud.microsoft/mcp`. That connection is optional. If you
skip it, every skill still works from material you paste or upload.

If you connect it, you sign in with your work account and requests go to
Microsoft under your organisation's tenant. Microsoft's privacy statement
applies to that service: <https://privacy.microsoft.com/privacystatement>.
The plugin does not ask for, store, or forward an API key. Searches, reads,
and Outlook drafts can run; other actions on that server ask you first when
the Claude hooks are running.

You can remove the connector by deleting the `microsoft-365` entry in
`.mcp.json`.

## People data

The change record is meant to name groups and roles, not individuals.
Sentiment is reported only for a group at or above the minimum size in your
practice profile (five people, unless you set another number).

## Contact

Questions about this notice: open an issue on
<https://github.com/carinyadigital/change-practice>.
