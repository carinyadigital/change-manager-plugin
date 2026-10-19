#!/usr/bin/env python3
"""Check champion coverage against impacted groups.

Usage: python3 coverage.py <impact-register.csv> <champions.csv> [--per N] [--json]

impact-register.csv columns used: group, headcount
  (the impact-assessment CSV; several rows per group are fine — the largest
  headcount given for a group is used)
champions.csv columns used: champion_role, group
  (one row per champion; other columns are ignored)

Per group:
  required = max(1, ceil(headcount / N))   N defaults to 25 people per champion
  status   = "no champion" if 0 champions, "gap" if fewer than required,
             "ok" otherwise; "headcount unknown" if headcount is not a number
             (required is then 1)
Champion groups not found in the impact register are listed separately.
Rows whose first column starts with "Example" are ignored.
"""
from __future__ import annotations

import csv
import json
import math
import sys
from collections import OrderedDict


def read_rows(path: str, required: set[str]) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames or []
        missing = required - set(fields)
        if missing:
            sys.exit(f"error: {path}: missing columns: {', '.join(sorted(missing))}")
        first = fields[0]
        return [r for r in reader
                if not (r.get(first) or "").strip().lower().startswith("example")]


def parse_args(argv: list[str]) -> tuple[str, str, int, bool]:
    per = 25
    as_json = False
    paths = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--per":
            if i + 1 >= len(argv):
                sys.exit("error: --per needs a number")
            try:
                per = int(argv[i + 1])
            except ValueError:
                sys.exit(f"error: --per {argv[i + 1]!r} is not a whole number")
            if per < 1:
                sys.exit("error: --per must be 1 or more")
            i += 2
            continue
        if a == "--json":
            as_json = True
        else:
            paths.append(a)
        i += 1
    if len(paths) != 2:
        sys.exit("error: give the impact register CSV and the champions CSV (see --help)")
    return paths[0], paths[1], per, as_json


def coverage(impacts: list[dict], champions: list[dict], per: int) -> tuple[list[dict], list[dict]]:
    groups: "OrderedDict[str, dict]" = OrderedDict()
    for row in impacts:
        name = row["group"].strip()
        if not name:
            continue
        g = groups.setdefault(name, {"group": name, "headcount": None, "champions": 0})
        raw = (row.get("headcount") or "").strip().replace(",", "")
        try:
            h = int(float(raw))
        except ValueError:
            continue
        g["headcount"] = h if g["headcount"] is None else max(g["headcount"], h)

    lookup = {k.lower(): k for k in groups}
    orphans: "OrderedDict[str, int]" = OrderedDict()
    for row in champions:
        name = row["group"].strip()
        key = lookup.get(name.lower())
        if key:
            groups[key]["champions"] += 1
        elif name:
            orphans[name] = orphans.get(name, 0) + 1

    result = []
    for g in groups.values():
        h = g["headcount"]
        required = 1 if h is None else max(1, math.ceil(h / per))
        c = g["champions"]
        if c == 0:
            status = "no champion"
        elif c < required:
            status = "gap"
        elif h is None:
            status = "headcount unknown"
        else:
            status = "ok"
        ratio = f"1:{math.ceil(h / c)}" if (h is not None and c) else "-"
        result.append({"group": g["group"], "headcount": h, "champions": c,
                       "required": required, "shortfall": max(0, required - c),
                       "ratio": ratio, "status": status})
    order = {"no champion": 0, "gap": 1, "headcount unknown": 2, "ok": 3}
    result.sort(key=lambda r: (order[r["status"]], -r["shortfall"], r["group"].lower()))
    return result, [{"group": k, "champions": v} for k, v in orphans.items()]


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    impact_path, champ_path, per, as_json = parse_args(argv)
    impacts = read_rows(impact_path, {"group", "headcount"})
    champions = read_rows(champ_path, {"champion_role", "group"})
    result, orphans = coverage(impacts, champions, per)
    if as_json:
        print(json.dumps({"per": per, "groups": result, "unmatched": orphans}, indent=2))
        return 0
    if not result:
        print("No impacted groups found (example rows are ignored).")
        return 0
    print(f"Target: 1 champion per {per} people (minimum 1 per group).")
    print()
    print("| Group | People | Champions | Required | Shortfall | Ratio | Status |")
    print("| --- | --- | --- | --- | --- | --- | --- |")
    for r in result:
        people = "unknown" if r["headcount"] is None else r["headcount"]
        print(f"| {r['group']} | {people} | {r['champions']} | {r['required']} | "
              f"{r['shortfall']} | {r['ratio']} | {r['status']} |")
    gaps = [r for r in result if r["status"] in {"no champion", "gap"}]
    total_short = sum(r["shortfall"] for r in gaps)
    print()
    print(f"Groups below target: {len(gaps)} of {len(result)}; champions still needed: {total_short}.")
    if orphans:
        print()
        print("Champion groups not in the impact register (check spelling or add the group):")
        for o in orphans:
            print(f"- {o['group']} ({o['champions']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
