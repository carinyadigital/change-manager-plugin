#!/usr/bin/env python3
"""Apply the default people-readiness go/no-go rule.

Usage: python3 checklist_gate.py <readiness.csv> <impact-register.csv>
                                 [--critical "trained,access ready,..."]
                                 [--threshold 3]

Readiness columns: group, criterion, rag, evidence, critical (y/n)
Impact columns:    group, headcount, dimension, today, future, score, evidence

Impact headline per group = highest dimension score (0-4).

Rule (references/rating-scales.md defaults):
  NO-GO              if any critical criterion is Red for a group whose
                     headline is >= threshold (default 3), or for a group
                     with no impact score (treated as high).
  GO WITH CONDITIONS if no such Red exists but any Amber or any other Red
                     exists.
  GO                 if every criterion is Green.

A criterion is critical if its critical column is y/yes, or (when --critical
is given) its name matches one of the listed criteria (case-insensitive).
RAG values accepted: red/amber/green or r/a/g. Blank RAG counts as Amber.
A Green with blank evidence is downgraded to Amber (no evidence, no Green).
Rows whose first column starts with "Example" are ignored.

This covers readiness data only. Sponsor commitment, risks and stale inputs
are judged separately in the skill.
"""
from __future__ import annotations

import csv
import sys
from collections import OrderedDict

RAG = {"red": "Red", "r": "Red", "amber": "Amber", "a": "Amber",
       "green": "Green", "g": "Green", "": "Amber"}


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


def headlines(rows: list[dict]) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, r in enumerate(rows, start=2):
        try:
            s = int(r["score"])
            if not 0 <= s <= 4:
                raise ValueError
        except ValueError:
            sys.exit(f"error: impact line {i}: score {r['score']!r} is not 0-4")
        g = r["group"].strip()
        out[g] = max(out.get(g, 0), s)
    return out


def parse_args(argv: list[str]):
    pos, critical, threshold = [], None, 3
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--critical":
            critical = {c.strip().lower() for c in argv[i + 1].split(",") if c.strip()}
            i += 2
        elif a == "--threshold":
            threshold = int(argv[i + 1])
            i += 2
        else:
            pos.append(a)
            i += 1
    if len(pos) != 2:
        sys.exit("error: need <readiness.csv> <impact-register.csv> (see --help)")
    return pos[0], pos[1], critical, threshold


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    rpath, ipath, critical, threshold = parse_args(argv)
    ready = read_rows(rpath, {"group", "criterion", "rag", "evidence", "critical"})
    heads = headlines(read_rows(ipath, {"group", "score"}))

    groups: "OrderedDict[str, dict]" = OrderedDict()
    reasons_block, reasons_cond, notes = [], [], []
    for i, r in enumerate(ready, start=2):
        g = r["group"].strip()
        crit_name = r["criterion"].strip()
        raw = r["rag"].strip().lower()
        if raw not in RAG:
            sys.exit(f"error: readiness line {i}: rag {r['rag']!r} is not red/amber/green")
        rag = RAG[raw]
        if raw == "":
            notes.append(f"{g} / {crit_name}: blank RAG treated as Amber")
        if rag == "Green" and not r["evidence"].strip():
            rag = "Amber"
            notes.append(f"{g} / {crit_name}: Green without evidence downgraded to Amber")
        is_crit = r["critical"].strip().lower() in {"y", "yes"}
        if critical is not None and crit_name.lower() in critical:
            is_crit = True
        rec = groups.setdefault(g, {"Red": 0, "Amber": 0, "Green": 0, "crit_red": 0})
        rec[rag] += 1
        head = heads.get(g)
        if rag == "Red" and is_crit:
            rec["crit_red"] += 1
            if head is None or head >= threshold:
                label = "no impact score (treated as high)" if head is None else f"impact headline {head}"
                reasons_block.append(f"{g}: critical criterion '{crit_name}' is Red ({label})")
            else:
                reasons_cond.append(f"{g}: critical criterion '{crit_name}' is Red (impact headline {head}, below {threshold})")
        elif rag == "Red":
            reasons_cond.append(f"{g}: '{crit_name}' is Red (not critical)")
        elif rag == "Amber":
            reasons_cond.append(f"{g}: '{crit_name}' is Amber{' (critical)' if is_crit else ''}")

    if not groups:
        print("No readiness rows found (example rows are ignored).")
        print("\nVerdict: NO-GO — no readiness evidence.")
        return 0

    for g in groups:
        if g not in heads:
            notes.append(f"{g}: has readiness rows but no impact score (treated as high)")
    for g in heads:
        if g not in groups:
            notes.append(f"{g}: in impact register but has no readiness rows")

    if reasons_block:
        verdict = "NO-GO"
    elif reasons_cond:
        verdict = "GO WITH CONDITIONS"
    else:
        verdict = "GO"

    print(f"Verdict (readiness rule only): {verdict}\n")
    print("| Group | Impact headline | Critical Reds | Reds | Ambers | Greens |")
    print("| --- | --- | --- | --- | --- | --- |")
    for g, rec in groups.items():
        head = heads.get(g)
        print(f"| {g} | {'-' if head is None else head} | {rec['crit_red']} | {rec['Red']} | {rec['Amber']} | {rec['Green']} |")
    if reasons_block:
        print("\nBlocking:")
        for x in reasons_block:
            print(f"- {x}")
    if reasons_cond:
        print("\nNeeds a condition (owner and date before go-live):")
        for x in reasons_cond:
            print(f"- {x}")
    if notes:
        print("\nNotes:")
        for x in notes:
            print(f"- {x}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
