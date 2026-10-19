#!/usr/bin/env python3
"""Place stakeholders on the influence x impact grid and list commitment gaps.

Usage: python3 grid.py <stakeholder-register.csv> [--high-from N] [--json]

Input columns: stakeholder, type, influence, impact, current, needed, owner
  influence, impact: 1 (low) to 3 (high)  -- see references/rating-scales.md
  current, needed:   unaware | aware | understands | supports | committed
                     ("advocates" and "committed / advocates" count as committed)

Options:
  --high-from N  score at or above which influence/impact counts as high
                 (default 3; use 2 to treat medium as high)
  --json         print JSON instead of markdown

Grid quadrants:
  high influence / high impact = partner closely
  high influence / low impact  = keep satisfied
  low influence  / high impact = keep informed and supported
  low influence  / low impact  = monitor

Commitment gap = steps from current to needed. A gap of two or more steps on a
high-influence stakeholder is flagged as a priority action.
Rows whose stakeholder starts with "Example" are ignored.
"""
from __future__ import annotations

import csv
import json
import sys

REQUIRED = {"stakeholder", "type", "influence", "impact", "current", "needed", "owner"}
LEVELS = ["unaware", "aware", "understands", "supports", "committed"]
ALIASES = {
    "advocate": "committed",
    "advocates": "committed",
    "committed / advocates": "committed",
    "committed/advocates": "committed",
    "understand": "understands",
    "support": "supports",
}
QUADRANT_ORDER = ["partner closely", "keep satisfied", "keep informed and supported", "monitor"]


def level(value: str) -> int:
    v = " ".join(value.strip().lower().split())
    v = ALIASES.get(v, v)
    if v not in LEVELS:
        raise ValueError(value)
    return LEVELS.index(v)


def load(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"error: missing columns: {', '.join(sorted(missing))}")
        return [r for r in reader
                if r["stakeholder"].strip() and not r["stakeholder"].strip().lower().startswith("example")]


def analyse(rows: list[dict], high_from: int) -> list[dict]:
    out, errors = [], []
    for i, row in enumerate(rows, start=2):
        try:
            inf, imp = int(row["influence"]), int(row["impact"])
            if not (1 <= inf <= 3 and 1 <= imp <= 3):
                raise ValueError
        except ValueError:
            errors.append(f"line {i}: influence/impact must be 1-3")
            continue
        try:
            cur, need = level(row["current"]), level(row["needed"])
        except ValueError as exc:
            errors.append(f"line {i}: unknown commitment level {exc.args[0]!r}")
            continue
        hi_inf, hi_imp = inf >= high_from, imp >= high_from
        if hi_inf and hi_imp:
            quad = "partner closely"
        elif hi_inf:
            quad = "keep satisfied"
        elif hi_imp:
            quad = "keep informed and supported"
        else:
            quad = "monitor"
        gap = need - cur
        out.append({
            "stakeholder": row["stakeholder"].strip(),
            "type": row["type"].strip(),
            "influence": inf,
            "impact": imp,
            "quadrant": quad,
            "current": LEVELS[cur],
            "needed": LEVELS[need],
            "gap": gap,
            "priority": hi_inf and gap >= 2,
            "owner": row["owner"].strip(),
        })
    if errors:
        sys.exit("error:\n  " + "\n  ".join(errors))
    out.sort(key=lambda r: (QUADRANT_ORDER.index(r["quadrant"]), -r["influence"], -r["impact"], r["stakeholder"]))
    return out


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    high_from = 3
    if "--high-from" in argv:
        try:
            high_from = int(argv[argv.index("--high-from") + 1])
        except (IndexError, ValueError):
            sys.exit("error: --high-from needs a number 1-3")
    result = analyse(load(argv[0]), high_from)
    if "--json" in argv:
        print(json.dumps(result, indent=2))
        return 0
    if not result:
        print("No stakeholders found (example rows are ignored).")
        return 0
    print(f"## Influence x impact grid (high = {high_from} or more)\n")
    print("| Quadrant | Stakeholder | Type | Influence | Impact | Owner |")
    print("| --- | --- | --- | --- | --- | --- |")
    for r in result:
        print(f"| {r['quadrant']} | {r['stakeholder']} | {r['type']} | {r['influence']} | {r['impact']} | {r['owner']} |")
    print("\n## Commitment gaps\n")
    print("| Stakeholder | Influence | Current | Needed | Gap (steps) | Priority action |")
    print("| --- | --- | --- | --- | --- | --- |")
    gaps = sorted((r for r in result if r["gap"] > 0),
                  key=lambda r: (not r["priority"], -r["gap"], -r["influence"], r["stakeholder"]))
    for r in gaps:
        print(f"| {r['stakeholder']} | {r['influence']} | {r['current']} | {r['needed']} | {r['gap']} | {'yes' if r['priority'] else 'no'} |")
    if not gaps:
        print("| none | | | | | |")
    over = [r for r in result if r["gap"] < 0]
    priority = sum(1 for r in result if r["priority"])
    print(f"\nPriority actions (gap of 2+ steps on high influence): {priority}")
    if over:
        print("Current commitment above needed (check the 'needed' level): "
              + ", ".join(r["stakeholder"] for r in over))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
