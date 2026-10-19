#!/usr/bin/env node
/*
PreToolUse hook: practice-profile write confirmation.

Usage: reads the hook payload (JSON) on stdin; called by hooks/hooks.json.

Only /change-practice:setup should change the practice profile at
~/.claude/plugins/config/digital-agency/change-practice/. Any Write, Edit or
MultiEdit to that folder returns permissionDecision "ask" so a human confirms
the change. Writes anywhere else pass through silently.
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
  tool_input?: { file_path?: string };
}

const PROFILE_DIR = "/.claude/plugins/config/digital-agency/change-practice/";

export function decide(payload: HookPayload | null): HookOutput | null {
  const path = String(payload?.tool_input?.file_path ?? "").replaceAll("\\", "/");
  if (!path.includes(PROFILE_DIR)) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        "change-practice profile guard: this changes your practice profile, " +
        "which every change-practice skill reads. Only /change-practice:setup " +
        "should write it, after showing you the change. Confirm only if you " +
        "have reviewed the proposed update.",
    },
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help")) {
    console.log("Usage: echo '<hook payload JSON>' | node profile_guard.ts");
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
