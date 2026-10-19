#!/usr/bin/env node
/*
PreToolUse hook: draft-never-send guard.

Usage: reads the hook payload (JSON) on stdin; called by hooks/hooks.json.

If the tool is an MCP tool whose name looks like it sends, posts, publishes
or schedules something to other people (email, chat, intranet, calendar),
returns permissionDecision "ask" so a human confirms. Draft-creating tools
(names containing "draft") pass through.

Never blocks outright, never echoes tool input (which may contain message
bodies or credentials). Exits 0 with no output when the call is not a send.
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

const SEND_RE = /(^|_)(send|post|publish|reply|forward|schedule|broadcast|announce|invite|create_event|update_event|respond_to_event|share)(_|$)/i;
const DRAFT_RE = /draft/i;

export function decide(toolName: string): HookOutput | null {
  if (!toolName.startsWith("mcp__")) return null;
  const action = toolName.split("__").pop() ?? "";
  if (DRAFT_RE.test(action) || !SEND_RE.test(action)) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        "change-practice draft guard: this tool sends or publishes to " +
        "other people. Change communications are drafts until a human " +
        "approves them. Confirm only if you have reviewed the content " +
        "and the approver in the comms plan has signed it off.",
    },
  };
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
