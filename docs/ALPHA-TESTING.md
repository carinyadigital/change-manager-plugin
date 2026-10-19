# Alpha testing guide

Thank you for testing Change Practice. This guide explains what we are
asking, how to run a test, and how to tell us what you found. It takes about
four sessions of an hour each, spread over a week or two.

## What we want to learn

1. **Is the output something you would use?** Would you hand it to a sponsor

   or a team leader after your normal review, or would you rewrite it?
2. **Does it pick the right skill?** When you ask in your own words, does the

   right skill start, and does it stay out of things it shouldn't do?
3. **Does it stay honest?** Does it ask when it doesn't know, mark

   assumptions, and avoid inventing names, numbers or quotes?
4. **What's missing?** Artefacts, questions or steps you expected and didn't

   get.

## Before you start

- **Use a real change, made safe.** A recent or current initiative you know
well works best. Remove names, replace the organisation's name, and leave
out anything confidential (restructure details before consultation, pay,
individual performance). Group names and rough headcounts are fine.
- **Use a fresh working folder** for the test. Everything the plugin writes
goes into `docs/change/` in that folder.
- **Run setup first** (`/change-practice:setup` in Claude Cowork, or "Set up
my change practice" in ChatGPT Work). Answer as your real team would.
- **Nothing is sent.** Every message is a draft. In Claude Cowork, the plugin
asks before anything is sent or posted. ChatGPT Work on the web does not run
that check, so do not connect email or chat tools for the test there.

## Suggested test journey

Ask in your own words — don't copy the skill names. The examples show the
kind of request we mean.

### Session 1 — Understand the change (Prepare)

| Try | Example request | Skill you'd expect |
| --- | --- | --- |
| Define the change | "Help me get clear on what's changing with the rostering system" | understand-change |
| Who is affected | "Who are the stakeholders and how much do they matter?" | stakeholder-analysis |
| Impacts | "What's changing for each team, and how big is it?" | change-impact-assessment |
| Organisation's readiness | "Is the organisation ready to take this on? The last two changes went badly." | business-readiness |

### Session 2 — Plan the approach (Prepare)

| Try | Example request | Skill you'd expect |
| --- | --- | --- |
| Risks | "What could stop this landing?" | change-risk-assessment |
| Sponsor health | "How healthy is sponsorship and project management on this?" | sponsor-assessment |
| Strategy | "Pull together the change approach for steering committee" | change-strategy |
| Case for change | "Write the case for change for the exec team" | change-strategy |
| Measures | "How will we know it's worked?" | measurement-plan |

### Session 3 — Run the change (Manage)

| Try | Example request | Skill you'd expect |
| --- | --- | --- |
| Change story and comms plan | "How do we tell staff, and in what order?" | communications-plan |
| A real draft | "Write the manager briefing for team leaders" or "speaking notes for the COO's town hall" | comms-draft |
| Champions | "Set up champions at each site and draft the note to managers" | change-network |
| Training | "What does each role need to learn?", then "plan the sessions" | training-needs-analysis |
| Pulse | "Write the pulse survey questions", then paste some made-up aggregate results (use 20+ responses per group, or it will rightly report "no clear change") | stakeholder-pulse |
| Resistance | "The night shift keeps using the old spreadsheet" | resistance-management |

### Session 4 — Go live and make it stick (Manage → Sustain)

| Try | Example request | Skill you'd expect |
| --- | --- | --- |
| Readiness | "Are the teams ready for go-live?" | business-readiness |
| Go/no-go | "Should we go live on the 1st?" | readiness-review |
| Hypercare | "Plan go-live support", then "run today's check-in" with a few issues | golive-transition |
| Make it stick | "Adoption is slipping in Sydney — what do we do?" | reinforcement |
| Lessons | "Plan a retro for go-live" | lessons-learned |

Also try two or three things the plugin should **not** do — for example "raise
a change request for CAB", "write the release notes", or "log this against
Sam". It should say it doesn't cover them.

## What to look for

| Look for | Good sign | Warning sign |
| --- | --- | --- |
| Asking before writing | Shows you a summary and waits for yes | Writes files without asking |
| Honesty | Marks gaps as `[ASSUMPTION — confirm with …]` | Confident numbers, names or quotes you never gave it |
| People data | Groups and roles, not individuals | Named individuals in a register or log |
| Plain English | You could forward it with light edits | Consulting jargon on staff-facing material |
| Method labels | "ADKAR-informed" with the trademark notice | "ADKAR assessment" or "Prosci" without your licence |
| Joined up | Later skills use what earlier ones wrote | Asking you for the same facts again |

## How to give feedback

For each thing you try, note it in the table below (or copy it into a
spreadsheet). Short notes are fine.

| # | What you asked (your words) | Skill that ran | Right skill? (Y/N) | Would you use the output? (as is / with edits / no) | What was wrong or missing | Anything invented? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |

At the end, please answer:

1. Which three artefacts were most useful, and why?
2. Which artefact would you least trust, and why?
3. What do you produce in your own practice that the plugin doesn't?
4. Would you use it on your next initiative? What would need to change first?

Send the table, your answers and — if you're comfortable — the `docs/change/`
folder from the test to  by . Remove anything you would not
want shared first.

## Known limits in this alpha

- No skill has yet been run against a real initiative by anyone other than
the build team. Expect rough edges.
- Templates are markdown and CSV. Word, Excel and PowerPoint exports are not
included yet.
- In ChatGPT Work on the web, the safety hooks (ask before sending, people
data, profile changes) do not run.
