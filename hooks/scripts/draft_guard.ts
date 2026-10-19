#!/usr/bin/env node
/*
PreToolUse hook: draft-never-send guard.

Usage: reads the hook payload (JSON) on stdin; called by hooks/hooks.json.

Designed first for Microsoft 365 (Outlook, Teams, SharePoint, OneDrive),
whose write tools can send mail, post Teams chat and channel messages, start
chats, create or change calendar events and write files. Their exact tool
names are not published, so for any server that looks like Microsoft 365 the
guard is deny-by-default: reads (search, get, list, read, find…) and draft
handling pass; every other tool asks a human first.

For every other MCP server, tools whose names send, post, publish, reply,
forward, invite, share or change calendar events ask first.

Names are split into words whether they use snake_case, kebab-case or
camelCase, so `send_mail`, `sendMail` and `SendMail` are treated alike.

Never blocks outright, never echoes tool input (which may contain message
bodies or credentials). Exits 0 with no output when the call may proceed.
*/

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: "ask";
    permissionDecisionReason: string;
  };
}

interface HookPayload {
  tool_name?: string;
}

const M365_SERVER_RE = /microsoft|m365|workiq|office|outlook|teams|sharepoint|onedrive|graph/i;

const SEND_VERBS = new Set([
  "send", "post", "publish", "reply", "replyall", "forward", "broadcast",
  "announce", "invite", "share", "schedule", "respond", "accept", "decline",
]);
const CHANGE_VERBS = new Set([
  "create", "add", "new", "start", "update", "edit", "modify", "patch", "set",
  "delete", "remove", "cancel", "move", "upload",
]);
const SHARED_OBJECTS = new Set(["event", "events", "meeting", "meetings", "calendar", "chat", "chats", "channel"]);
const READ_VERBS = new Set([
  "search", "get", "list", "read", "find", "fetch", "query", "lookup", "view",
  "describe", "download", "summarize", "summarise", "check",
  // Work IQ (Microsoft 365) question-and-answer and retrieval tools are reads.
  "ask", "retrieve",
]);

export function words(action: string): string[] {
  return action
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function ask(reason: string): HookOutput {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  };
}

const SEND_REASON =
  "change-practice draft guard: this tool sends or publishes to other " +
  "people. Change communications are drafts until a human approves them. " +
  "Confirm only if you have reviewed the content and the approver in the " +
  "comms plan has signed it off.";

const M365_REASON =
  "change-practice draft guard: this Microsoft 365 tool is not a read or a " +
  "draft, so it may send mail, post in Teams, change a calendar or write a " +
  "file other people can see. Confirm only if you have reviewed exactly what " +
  "it will do and the comms plan's approver has signed it off.";

export function decide(toolName: string): HookOutput | null {
  if (!toolName.startsWith("mcp__")) return null;
  const parts = toolName.split("__");
  const server = parts.length > 2 ? parts.slice(1, -1).join("__") : "";
  const w = words(parts[parts.length - 1] ?? "");
  const sends = w.some((x) => SEND_VERBS.has(x));
  const changesShared = w.some((x) => CHANGE_VERBS.has(x)) && w.some((x) => SHARED_OBJECTS.has(x));
  const isDraft = w.includes("draft") || w.includes("drafts");

  if (sends || changesShared) {
    // Saving a draft is the intended path; sending one is not.
    // `create_draft`, `slack_send_message_draft` -> a draft; `send_draft` -> a send.
    const last = w[w.length - 1] ?? "";
    const beforeLast = w[w.length - 2] ?? "";
    const draftOnly = isDraft && (
      !w.some((x) => SEND_VERBS.has(x)) ||
      ((last === "draft" || last === "drafts") && !SEND_VERBS.has(beforeLast))
    );
    if (!draftOnly) return ask(M365_SERVER_RE.test(server) ? M365_REASON : SEND_REASON);
    return null;
  }

  if (M365_SERVER_RE.test(server)) {
    if (isDraft) return null;
    if (w.length && READ_VERBS.has(w[0]!)) return null;
    if (w.some((x) => READ_VERBS.has(x)) && !w.some((x) => CHANGE_VERBS.has(x))) return null;
    return ask(M365_REASON);
  }
  return null;
}

async function main(): Promise<void> {
  if (process.argv.includes("--help")) {
    console.log("Usage: echo '<hook payload JSON>' | node draft_guard.ts");
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
  const result = decide(String(payload?.tool_name ?? ""));
  if (result) console.log(JSON.stringify(result));
}

void main();
