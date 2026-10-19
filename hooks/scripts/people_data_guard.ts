#!/usr/bin/env node
/*
PreToolUse hook: personal-data guard for the change record.

Usage: reads the hook payload (JSON) on stdin; called by hooks/hooks.json.

When Write/Edit/MultiEdit targets a file under a docs/change/ folder, scans
the new content for personal contact details (email addresses, phone
numbers). If found, returns permissionDecision "ask" with a count by type,
reminding that the change record holds groups and roles, not personal
details. Does not print the matched values.
*/

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: "ask";
    permissionDecisionReason: string;
  };
}

interface ToolInput {
  file_path?: string;
  content?: string;
  new_string?: string;
  edits?: Array<{ new_string?: string } | null>;
}

interface HookPayload {
  tool_name?: string;
  tool_input?: ToolInput;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?<![\w.])(?:\+?\d[\d ()-]{7,}\d)(?!\w)/g;
// Dates, date-times, ISO weeks, year-months and clock times are common in
// the change record (go-live plans, hypercare check-ins, weekly status) and
// must not read as phone numbers. They are blanked before phone matching.
const DATE_LIKE_RE = /\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\b|\b\d{4}-W\d{2}\b|\b\d{4}-\d{2}\b|\b\d{2}:\d{2}\b/g;

function newText(toolInput: ToolInput): string {
  const parts: Array<string | undefined> = [toolInput.content, toolInput.new_string];
  for (const edit of toolInput.edits ?? []) {
    if (edit) parts.push(edit.new_string);
  }
  return parts.filter((p): p is string => typeof p === "string" && p !== "").join("\n");
}

function countPhones(text: string): number {
  let n = 0;
  for (const m of text.replace(DATE_LIKE_RE, " ").matchAll(PHONE_RE)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    n += 1;
  }
  return n;
}

export function decide(payload: HookPayload | null): HookOutput | null {
  const toolInput = payload?.tool_input ?? {};
  const path = String(toolInput.file_path ?? "").replaceAll("\\", "/");
  if (!path.includes("docs/change/")) return null;
  const text = newText(toolInput);
  const emails = (text.match(EMAIL_RE) ?? []).length;
  const phones = countPhones(text);
  if (!emails && !phones) return null;
  const counts: Array<[number, string]> = [
    [emails, "email address(es)"],
    [phones, "phone number(s)"],
  ];
  const found = counts
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}`)
    .join(", ");
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        `change-practice people-data guard: this write to the change ` +
        `record contains ${found}. The record should hold groups and ` +
        `roles, not personal contact details. Confirm only if these are ` +
        `generic team mailboxes or support lines.`,
    },
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help")) {
    console.log("Usage: echo '<hook payload JSON>' | node people_data_guard.ts");
    return;
  }
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let payload: HookPayload | null;
  try {
    payload = JSON.parse(input) as HookPayload | null;
  } catch {
    return;
  }
  const result = decide(payload);
  if (result) console.log(JSON.stringify(result));
}

void main();
