#!/usr/bin/env node
/*
PreToolUse hook: practice-profile write confirmation.

Usage: reads the hook payload (JSON) on stdin; called by hooks/hooks.json.

Only /change-practice:setup should change the practice profile at
~/change-practice/ (outside any one app's config folder, so the same path
works in Claude Cowork and ChatGPT Work). Any Write, Edit or MultiEdit to that
folder returns permissionDecision "ask" so a human confirms
the change. Writes anywhere else pass through silently.
*/

import { homedir } from "node:os";

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

const PROFILE_DIR = `${homedir().replaceAll("\\", "/")}/change-practice/`;

export function decide(payload: HookPayload | null): HookOutput | null {
  const path = String(payload?.tool_input?.file_path ?? "").replaceAll("\\", "/");
  if (!path.startsWith(PROFILE_DIR) && !path.startsWith("~/change-practice/")) return null;
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
