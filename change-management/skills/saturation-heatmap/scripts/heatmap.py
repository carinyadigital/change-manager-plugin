#!/usr/bin/env python3
"""Build a group x month change-load heatmap from a portfolio CSV.

Usage: python3 heatmap.py <portfolio.csv> [--capacity N] [--json]

Input columns: initiative, group, month (YYYY-MM), load (0-4)

Per group and month, total = sum of load across initiatives.
Status:
  red   (saturated) if total > capacity (default 6)
  amber (watch)     if 4 <= total <= capacity
  green             if total < 4
Cells with no rows are shown as blank (no data), not as zero.
Rows whose first column starts with "Example" are ignored.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import OrderedDict

MONTH = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
SYMBOL = {"red": "R", "amber": "A", "green": "G"}


def load(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames or []
        missing = {"initiative", "group", "month", "load"} - set(fields)
        if missing:
            sys.exit(f"error: missing columns: {', '.join(sorted(missing))}")
        first = fields[0]
        return [r for r in reader
                if not (r.get(first) or "").strip().lower().startswith("example")]


def status(total: int, capacity: int) -> str:
    if total > capacity:
        return "red"
    if total >= 4:
        return "amber"
    return "green"


def build(rows: list[dict], capacity: int) -> dict:
    cells: dict[tuple[str, str], dict] = {}
    groups: "OrderedDict[str, None]" = OrderedDict()
    months: set[str] = set()
    errors = []
    for i, r in enumerate(rows, start=2):
        g, m, ini = r["group"].strip(), r["month"].strip(), r["initiative"].strip()
        if not MONTH.match(m):
            errors.append(f"line {i}: month {m!r} is not YYYY-MM")
            continue
        try:
            v = int(r["load"])
            if not 0 <= v <= 4:
                raise ValueError
        except ValueError:
            errors.append(f"line {i}: load {r['load']!r} is not 0-4")
            continue
        groups[g] = None
        months.add(m)
        c = cells.setdefault((g, m), {"total": 0, "initiatives": []})
        c["total"] += v
        if v:
            c["initiatives"].append(f"{ini} ({v})")
    if errors:
        sys.exit("error:\n  " + "\n  ".join(errors))
    for c in cells.values():
        c["status"] = status(c["total"], capacity)
        c["initiatives"].sort()
    return {"capacity": capacity, "groups": list(groups), "months": sorted(months), "cells": cells}


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    capacity = 6
    if "--capacity" in argv:
        try:
            capacity = int(argv[argv.index("--capacity") + 1])
        except (IndexError, ValueError):
            sys.exit("error: --capacity needs a whole number")
    res = build(load(argv[0]), capacity)
    if not res["groups"]:
        print("No rows found (example rows are ignored).")
        return 0
    if "--json" in argv:
        out = dict(res)
        out["cells"] = [{"group": g, "month": m, **c} for (g, m), c in sorted(res["cells"].items())]
        print(json.dumps(out, indent=2))
        return 0

    months = res["months"]
    print(f"Capacity per group per month: {capacity}. Cell = total load (R saturated, A watch, G ok; blank = no data).\n")
    print("| Group | " + " | ".join(months) + " |")
    print("| --- |" + " --- |" * len(months))
    for g in res["groups"]:
        row = []
        for m in months:
            c = res["cells"].get((g, m))
            row.append("" if c is None else f"{c['total']} {SYMBOL[c['status']]}")
        print(f"| {g} | " + " | ".join(row) + " |")

    flagged = [((g, m), c) for (g, m), c in res["cells"].items() if c["status"] != "green"]
    flagged.sort(key=lambda x: (0 if x[1]["status"] == "red" else 1, -x[1]["total"], x[0][0], x[0][1]))
    red = sum(1 for _, c in flagged if c["status"] == "red")
    amber = len(flagged) - red
    verdict = "Saturated" if red else ("Watch" if amber else "Within capacity")
    print(f"\nVerdict: {verdict} ({red} saturated, {amber} watch)")
    if flagged:
        print("\n| Group | Month | Load | Status | Contributing initiatives |")
        print("| --- | --- | --- | --- | --- |")
        for (g, m), c in flagged:
            label = "saturated" if c["status"] == "red" else "watch"
            print(f"| {g} | {m} | {c['total']} | {label} | {'; '.join(c['initiatives'])} |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
