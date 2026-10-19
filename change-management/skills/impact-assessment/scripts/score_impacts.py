#!/usr/bin/env python3
"""Roll up an impact register CSV into group scores.

Usage: python3 score_impacts.py <impact-register.csv> [--json]

Input columns: group, headcount, dimension, today, future, score, evidence
Score is 0-4 (see references/rating-scales.md).

Per group:
  headline = highest dimension score
  breadth  = number of dimensions scored 3 or more
  priority = high if headline == 4 or breadth >= 2; medium if headline == 3
             or breadth == 1; low otherwise
Rows whose group starts with "Example" are ignored.
"""
from __future__ import annotations

import csv
import json
import sys
from collections import OrderedDict

REQUIRED = {"group", "headcount", "dimension", "score"}


def load(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"error: missing columns: {', '.join(sorted(missing))}")
        return [r for r in reader if not r["group"].strip().lower().startswith("example")]


def score(rows: list[dict]) -> list[dict]:
    groups: "OrderedDict[str, dict]" = OrderedDict()
    errors = []
    for i, row in enumerate(rows, start=2):
        name = row["group"].strip()
        try:
            s = int(row["score"])
            if not 0 <= s <= 4:
                raise ValueError
        except ValueError:
            errors.append(f"line {i}: score {row['score']!r} is not 0-4")
            continue
        g = groups.setdefault(name, {"group": name, "headcount": row["headcount"].strip(),
                                     "headline": 0, "breadth": 0, "dimensions": 0})
        g["headline"] = max(g["headline"], s)
        g["dimensions"] += 1
        if s >= 3:
            g["breadth"] += 1
    if errors:
        sys.exit("error:\n  " + "\n  ".join(errors))
    for g in groups.values():
        if g["headline"] == 4 or g["breadth"] >= 2:
            g["priority"] = "high"
        elif g["headline"] == 3 or g["breadth"] == 1:
            g["priority"] = "medium"
        else:
            g["priority"] = "low"
    order = {"high": 0, "medium": 1, "low": 2}
    return sorted(groups.values(), key=lambda g: (order[g["priority"]], -g["headline"], -g["breadth"]))


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    result = score(load(argv[0]))
    if "--json" in argv:
        print(json.dumps(result, indent=2))
        return 0
    if not result:
        print("No groups found (example rows are ignored).")
        return 0
    print("| Group | People | Headline | Dimensions at 3+ | Dimensions changed | Priority |")
    print("| --- | --- | --- | --- | --- | --- |")
    for g in result:
        print(f"| {g['group']} | {g['headcount']} | {g['headline']} | {g['breadth']} | {g['dimensions']} | {g['priority']} |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
