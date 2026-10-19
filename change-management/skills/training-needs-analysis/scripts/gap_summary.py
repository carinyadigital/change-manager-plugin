#!/usr/bin/env python3
"""Summarise a training needs analysis CSV into proficiency gaps by role.

Usage: python3 gap_summary.py <tna.csv> [--json]

Input columns (required): role, headcount, task, current, required, method
Optional column: hours_per_learner (learning time per person for that task)

Proficiency is 0-3:
  0 = no knowledge, 1 = aware (knows it exists, needs help),
  2 = can do with a guide or support, 3 = can do unaided and help others.

Per task:  gap = max(required - current, 0)
Per role:
  tasks          = number of task rows
  total_gap      = sum of task gaps
  max_gap        = largest task gap
  tasks_gap_2    = number of tasks with gap 2 or more
  learner_hours  = sum(hours_per_learner * headcount) where hours are given
Roles are sorted by max gap, then total gap (largest first).
Rows whose role starts with "Example" are ignored.
"""
from __future__ import annotations

import csv
import json
import sys
from collections import OrderedDict

REQUIRED = {"role", "headcount", "task", "current", "required", "method"}


def load(path: str) -> tuple[list[dict], bool]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = set(reader.fieldnames or [])
        missing = REQUIRED - fields
        if missing:
            sys.exit(f"error: missing columns: {', '.join(sorted(missing))}")
        rows = [r for r in reader if not (r["role"] or "").strip().lower().startswith("example")]
        return rows, "hours_per_learner" in fields


def as_level(value: str, field: str, line: int, errors: list[str]) -> int | None:
    try:
        n = int(str(value).strip())
        if not 0 <= n <= 3:
            raise ValueError
        return n
    except ValueError:
        errors.append(f"line {line}: {field} {value!r} is not 0-3")
        return None


def summarise(rows: list[dict], has_hours: bool) -> dict:
    roles: "OrderedDict[str, dict]" = OrderedDict()
    big_gaps = []
    errors: list[str] = []
    for i, row in enumerate(rows, start=2):
        cur = as_level(row["current"], "current", i, errors)
        req = as_level(row["required"], "required", i, errors)
        if cur is None or req is None:
            continue
        role = row["role"].strip()
        head_raw = (row["headcount"] or "").strip()
        try:
            head = int(head_raw) if head_raw else None
        except ValueError:
            errors.append(f"line {i}: headcount {head_raw!r} is not a whole number")
            continue
        gap = max(req - cur, 0)
        r = roles.setdefault(role, {"role": role, "headcount": head, "tasks": 0, "total_gap": 0,
                                    "max_gap": 0, "tasks_gap_2": 0, "learner_hours": None,
                                    "hours_missing": 0})
        if r["headcount"] is None and head is not None:
            r["headcount"] = head
        r["tasks"] += 1
        r["total_gap"] += gap
        r["max_gap"] = max(r["max_gap"], gap)
        if gap >= 2:
            r["tasks_gap_2"] += 1
            big_gaps.append({"role": role, "task": row["task"].strip(), "current": cur,
                             "required": req, "gap": gap, "method": row["method"].strip()})
        if has_hours and gap > 0:
            hrs_raw = (row.get("hours_per_learner") or "").strip()
            if not hrs_raw or head is None:
                r["hours_missing"] += 1
            else:
                try:
                    hrs = float(hrs_raw)
                except ValueError:
                    errors.append(f"line {i}: hours_per_learner {hrs_raw!r} is not a number")
                    continue
                r["learner_hours"] = (r["learner_hours"] or 0.0) + hrs * head
    if errors:
        sys.exit("error:\n  " + "\n  ".join(errors))
    ordered = sorted(roles.values(), key=lambda r: (-r["max_gap"], -r["total_gap"], r["role"]))
    big_gaps.sort(key=lambda g: (-g["gap"], g["role"], g["task"]))
    return {"roles": ordered, "gaps_2_or_more": big_gaps, "has_hours": has_hours}


def fmt_hours(r: dict) -> str:
    if r["learner_hours"] is None:
        return "not given"
    text = f"{r['learner_hours']:.1f}"
    if r["hours_missing"]:
        text += f" (+{r['hours_missing']} task(s) without hours)"
    return text


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    rows, has_hours = load(argv[0])
    result = summarise(rows, has_hours)
    if "--json" in argv:
        print(json.dumps(result, indent=2))
        return 0
    if not result["roles"]:
        print("No roles found (example rows are ignored).")
        return 0
    print("## Gap totals by role\n")
    header = "| Role | People | Tasks | Total gap | Largest gap | Tasks with gap 2+ |"
    sep = "| --- | --- | --- | --- | --- | --- |"
    if has_hours:
        header += " Learner-hours |"
        sep += " --- |"
    print(header)
    print(sep)
    for r in result["roles"]:
        people = r["headcount"] if r["headcount"] is not None else "unknown"
        line = f"| {r['role']} | {people} | {r['tasks']} | {r['total_gap']} | {r['max_gap']} | {r['tasks_gap_2']} |"
        if has_hours:
            line += f" {fmt_hours(r)} |"
        print(line)
    print("\n## Tasks with a gap of 2 or more\n")
    if not result["gaps_2_or_more"]:
        print("None.")
        return 0
    print("| Role | Task | Current | Required | Gap | Method |")
    print("| --- | --- | --- | --- | --- | --- |")
    for g in result["gaps_2_or_more"]:
        print(f"| {g['role']} | {g['task']} | {g['current']} | {g['required']} | {g['gap']} | {g['method']} |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
