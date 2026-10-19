# Getting started with Change Practice

Change Practice helps you plan and run the people side of a change — a new
system, process, structure or policy — and keeps everything you produce in one
place so the next piece of work builds on the last.

It works inside the AI app you already use (Claude or ChatGPT). You talk to it
in plain language. It asks questions, drafts documents for you to review, and
saves them to a folder you own.

Three things to know before you start:

- **Everything is a draft.** It never sends an email, posts a message or
  books a meeting. You review, you approve, you send.
- **It works from your facts, not its own.** When it doesn't know something
  it asks, or marks the gap `[ASSUMPTION — confirm with …]`. It will not
  invent names, numbers or quotes.
- **It records groups, not people.** Teams, roles and headcounts, not
  individuals' details.

## Before your first session (10 minutes)

**1. Install it.** Follow the steps for your app in the [README](../README.md).
There is nothing to install on your computer.

**2. Pick a working folder.** Everything for one initiative lives in one
folder, in a sub-folder called `docs/change/`. Use a new folder for each
initiative. In Claude, open that folder when you start the task.

**3. Run setup once.** In Claude type `/change-practice:setup`; in ChatGPT
accept the setup conversation after install, or say "Set up my change
practice." It takes about ten minutes and asks how your team works:

- which change method you use, if any (it's fine to say "none")
- whether your organisation holds a Prosci licence (if not, it uses plain
  labels)
- how often you report to sponsors, and in what format
- who signs off messages to staff
- whether one person does everything or the work is split across roles

Later sessions follow those answers. If you skip setup, sensible defaults are
used.

**4. Decide what to connect.** Microsoft 365 and Teams are optional. Connected,
it can read your documents, calendar and chat to save you re-typing. Not
connected, you paste or upload the material instead. Either way works.

## Your first hour

Describe the change in your own words. You don't need to know any command
names — "Help me get clear on what's changing with the new rostering system"
is enough. It will pick the right tool, or ask one or two questions first.

A good first session looks like this:

| Ask | What you get back | Saved as |
| --- | --- | --- |
| "Help me understand this change" (paste the business case or project brief) | A one-page definition: why, what's changing and what isn't, key dates, what success looks like | `docs/change/scope.md` |
| "Who's affected and how much do they matter?" | A register of groups and roles, with how much influence each has and how much the change affects them | `docs/change/stakeholder-register.md` |
| "What changes for each team?" | An impact register: for every group, what's different and how big a deal it is, rated 0–4 | `docs/change/impact-register.md` |

Each time, it shows you what it's about to save and waits for a yes.

Stop there if you like. Those three files are the foundation; everything else
reads from them.

## After that: what to ask, in order

You can jump in anywhere, but this is the order that makes each step easier
than the last. Say it in your own words — the examples are just the kind of
request that works.

**Prepare — understand and plan**

| What you're trying to do | Try saying |
| --- | --- |
| Spot what could stop this landing | "What could go wrong on the people side?" |
| Check whether sponsorship is strong enough | "How healthy is sponsorship on this?" |
| Find out if the organisation can take on another change right now | "Is the organisation ready to take this on? The last two changes went badly." |
| Set the overall approach | "Pull together the change approach for the steering committee" |
| Write the case for change for leaders | "Write the case for change for the exec team" |
| Decide how you'll know it worked | "How will we measure whether this has worked?" |

**Manage — run the change**

| What you're trying to do | Try saying |
| --- | --- |
| Plan who hears what, when and from whom | "How do we tell staff, and in what order?" |
| Write one specific message | "Write the manager briefing for team leaders" · "Draft the go-live email" · "Speaking notes for the COO's town hall" |
| Equip the sponsor and leaders | "What should the sponsor say at the next all-hands?" |
| Set up change champions | "Set up champions at each site" |
| Work out training | "What does each role need to learn?" then "Plan the sessions" |
| Check what people are saying | "Write the pulse survey questions" then paste the results |
| Deal with pushback | "The night shift keeps using the old spreadsheet" |
| Check readiness | "Are the teams ready for go-live?" |
| Make the go/no-go call | "Should we go live on the 1st?" |
| Plan go-live support | "Plan hypercare" then, each day, "Run today's check-in" |
| Write the weekly update | "Draft this week's change status" |
| Prepare for a meeting | "Prep me for steerco on Thursday" |

**Sustain — make it stick**

| What you're trying to do | Try saying |
| --- | --- |
| See whether people are really using it | "Are people actually using the new system, or just logging in?" |
| Stop the slide back to old habits | "Adoption is slipping in Sydney — what do we do?" |
| Hand over to business as usual | "Prepare the handover to the operations team" |
| Capture lessons | "Plan a retro for go-live" |

Not sure what's next? Ask "What should I do next on this change?" It looks at
what's already in your folder and suggests the next step.

## What it will not do

- **Send anything.** Messages are saved to `docs/change/comms/`. You send them.
- **IT change control.** Change requests, CAB approvals and release notes are
  out of scope. It will say so and stop.
- **HR or legal advice.** Anything touching roles, pay, hours, location or
  consultation is flagged for HR and legal review before it can be marked
  approved.
- **Make the decision.** Go/no-go, sponsor commitment and sign-off stay with
  named people. It gives you the evidence and a recommendation.

## Working with the files

- Everything is plain text (Markdown and CSV). Open the files in any editor,
  Word, or Excel. Edit them by hand if you prefer — the next session reads
  your edits.
- Each file starts with a short header: initiative, phase, status, owner and
  date. That's how later sessions know what's current. If a file is more than
  30 days old, it tells you before relying on it.
- Keep the folder somewhere your team can share it (SharePoint, a shared
  drive, a repository). The folder *is* the change record.

## Tips from early use

- **Paste generously.** The business case, a process document, last week's
  steering notes — the more of your material it has, the less generic the
  output.
- **Correct it in the moment.** "That's not how we'd say it" or "the Finance
  team is 30 people, not 50" and it redrafts.
- **Watch for `[ASSUMPTION …]` and `[TBC …]`.** Those are the gaps it couldn't
  fill. Clear them before anything goes to a sponsor or to staff.
- **Group names and rough headcounts are enough.** You don't need to give it
  anyone's name, email or phone number, and it will ask before saving those.
- **One initiative, one folder.** If you run several changes, use a folder
  each. "Are teams getting too much change at once?" works across folders.

## Getting help

- "What can you help me with on this change?" lists what's available.
- Something wrong, missing or odd? Note what you asked, what you got, and
  what you expected, and send it to the person who gave you the plugin.
