#!/usr/bin/env python3
"""PreToolUse hook: draft-never-send guard.

Reads the hook payload from stdin. If the tool is an MCP tool whose name
looks like it sends, posts, publishes or schedules something to other people
(email, chat, intranet, calendar), returns permissionDecision "ask" so a human
confirms. Draft-creating tools (names containing "draft") pass through.

Never blocks outright, never echoes tool input (which may contain message
bodies or credentials). Exits 0 with no output when the call is not a send.
"""
from __future__ import annotations

import json
import re
import sys

SEND_RE = re.compile(
    r"(^|_)(send|post|publish|reply|forward|schedule|broadcast|announce|invite|"
    r"create_event|update_event|respond_to_event|share)(_|$)",
    re.IGNORECASE,
)
DRAFT_RE = re.compile(r"draft", re.IGNORECASE)


def decide(tool_name: str) -> dict | None:
    if not tool_name.startswith("mcp__"):
        return None
    action = tool_name.split("__")[-1]
    if DRAFT_RE.search(action) or not SEND_RE.search(action):
        return None
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": (
                "change-management draft guard: this tool sends or publishes to "
                "other people. Change communications are drafts until a human "
                "approves them. Confirm only if you have reviewed the content "
                "and the approver in the comms plan has signed it off."
            ),
        }
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    result = decide(str(payload.get("tool_name", "")))
    if result:
        print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
