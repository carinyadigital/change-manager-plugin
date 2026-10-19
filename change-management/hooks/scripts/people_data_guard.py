#!/usr/bin/env python3
"""PreToolUse hook: personal-data guard for the change record.

When Write/Edit/MultiEdit targets a file under a docs/change/ folder, scans
the new content for personal contact details (email addresses, phone
numbers). If found, returns permissionDecision "ask" with a count by type,
reminding that the change record holds groups and roles, not personal
details. Does not print the matched values.
"""
from __future__ import annotations

import json
import re
import sys

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?<![\w.])(?:\+?\d[\d ()-]{7,}\d)(?!\w)")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def new_text(tool_input: dict) -> str:
    parts = [tool_input.get("content", ""), tool_input.get("new_string", "")]
    for edit in tool_input.get("edits", []) or []:
        if isinstance(edit, dict):
            parts.append(edit.get("new_string", ""))
    return "\n".join(p for p in parts if isinstance(p, str))


def count_phones(text: str) -> int:
    n = 0
    for m in PHONE_RE.finditer(text):
        token = m.group(0).strip()
        digits = re.sub(r"\D", "", token)
        if DATE_RE.match(token) or len(digits) < 8 or len(digits) > 15:
            continue
        n += 1
    return n


def decide(payload: dict) -> dict | None:
    tool_input = payload.get("tool_input") or {}
    path = str(tool_input.get("file_path", "")).replace("\\", "/")
    if "docs/change/" not in path:
        return None
    text = new_text(tool_input)
    emails = len(EMAIL_RE.findall(text))
    phones = count_phones(text)
    if not emails and not phones:
        return None
    found = ", ".join(
        f"{n} {label}" for n, label in ((emails, "email address(es)"), (phones, "phone number(s)")) if n
    )
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": (
                f"change-management people-data guard: this write to the change "
                f"record contains {found}. The record should hold groups and "
                f"roles, not personal contact details. Confirm only if these are "
                f"generic team mailboxes or support lines."
            ),
        }
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    result = decide(payload)
    if result:
        print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
