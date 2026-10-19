#!/usr/bin/env python3
"""Roll up a people-readiness CSV into group and overall RAG.

Usage: python3 readiness_rag.py <readiness.csv> [--previous <earlier.csv>] [--json]

Input columns: group, criterion, rag, evidence, critical
  rag      Green | Amber | Red  (G / A / R accepted, any case)
  critical y | n  (y = criterion is critical for go-live)

Rules (see references/rating-scales.md):
  - Green with no evidence is downgraded to Amber and listed.
  - Group status: Red if any criterion Red; Amber if any Amber; else Green.
  - Blocking: any Red on a critical criterion.
  - Overall: Red if any blocking item; Amber if any Red or Amber remains;
    Green only if every criterion for every group is Green with evidence.
  - Criteria assessed for some groups but missing for a group are listed as
    gaps (not assessed is not ready).
  - --previous compares group status with an earlier assessment and reports
    trend (better / same / worse / new).
Rows whose group starts with "Example" are ignored.
This script reports status only; it does not make a go/no-go decision.
"""
from __future__ import annotations

import csv
import json
import sys
from collections import OrderedDict

REQUIRED = {"group", "criterion", "rag", "evidence", "critical"}
RAG_MAP = {"g": "Green", "green": "Green", "a": "Amber", "amber": "Amber", "r": "Red", "red": "Red"}
RANK = {"Green": 0, "Amber": 1, "Red": 2}


def load(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"error: {path}: missing columns: {', '.join(sorted(missing))}")
        rows = [r for r in reader if not (r["group"] or "").strip().lower().startswith("example")]
    errors = []
    for i, r in enumerate(rows, start=2):
        rag = RAG_MAP.get((r["rag"] or "").strip().lower())
        if rag is None:
            errors.append(f"line {i}: rag {r['rag']!r} is not Green/Amber/Red")
        r["rag"] = rag
        crit = (r["critical"] or "").strip().lower()
        if crit not in {"y", "n", "yes", "no"}:
            errors.append(f"line {i}: critical {r['critical']!r} is not y/n")
        r["critical"] = crit in {"y", "yes"}
        r["group"] = r["group"].strip()
        r["criterion"] = r["criterion"].strip()
        r["evidence"] = (r["evidence"] or "").strip()
    if errors:
        sys.exit(f"error: {path}:\n  " + "\n  ".join(errors))
    return rows


def assess(rows: list[dict]) -> dict:
    groups: "OrderedDict[str, dict]" = OrderedDict()
    all_criteria: "OrderedDict[str, None]" = OrderedDict()
    downgraded, blocking = [], []
    for r in rows:
        rag = r["rag"]
        if rag == "Green" and not r["evidence"]:
            rag = "Amber"
            downgraded.append({"group": r["group"], "criterion": r["criterion"]})
        all_criteria[r["criterion"]] = None
        g = groups.setdefault(r["group"], {"group": r["group"], "Green": 0, "Amber": 0, "Red": 0,
                                           "status": "Green", "criteria": OrderedDict()})
        g[rag] += 1
        g["criteria"][r["criterion"]] = rag
        if RANK[rag] > RANK[g["status"]]:
            g["status"] = rag
        if rag == "Red" and r["critical"]:
            blocking.append({"group": r["group"], "criterion": r["criterion"],
                             "evidence": r["evidence"] or "none recorded"})
    gaps = []
    for g in groups.values():
        missing = [c for c in all_criteria if c not in g["criteria"]]
        g["not_assessed"] = missing
        if missing:
            gaps.append({"group": g["group"], "criteria": missing})
            if g["status"] == "Green":
                g["status"] = "Amber"
    if blocking:
        overall, reason = "Red", f"{len(blocking)} blocking Red(s) on critical criteria"
    elif any(g["status"] != "Green" for g in groups.values()):
        reds = sum(g["Red"] for g in groups.values())
        ambers = sum(g["Amber"] for g in groups.values())
        overall = "Amber"
        reason = f"{reds} non-critical Red(s), {ambers} Amber(s), {len(gaps)} group(s) with criteria not assessed"
    else:
        overall, reason = "Green", "all criteria Green with evidence"
    for g in groups.values():
        g["criteria"] = dict(g["criteria"])
    return {"groups": list(groups.values()), "blocking": blocking, "downgraded": downgraded,
            "not_assessed": gaps, "overall": overall, "reason": reason}


def trend(now: dict, before: dict) -> list[dict]:
    prev = {g["group"]: g["status"] for g in before["groups"]}
    out = []
    for g in now["groups"]:
        p = prev.get(g["group"])
        if p is None:
            t = "new"
        elif RANK[g["status"]] < RANK[p]:
            t = "better"
        elif RANK[g["status"]] > RANK[p]:
            t = "worse"
        else:
            t = "same"
        out.append({"group": g["group"], "previous": p or "-", "now": g["status"], "trend": t})
    for name, p in prev.items():
        if name not in {g["group"] for g in now["groups"]}:
            out.append({"group": name, "previous": p, "now": "-", "trend": "not assessed this time"})
    return out


def main(argv: list[str]) -> int:
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__.strip())
        return 0
    result = assess(load(argv[0]))
    if "--previous" in argv:
        idx = argv.index("--previous")
        if idx + 1 >= len(argv):
            sys.exit("error: --previous needs a file path")
        result["trend"] = trend(result, assess(load(argv[idx + 1])))
    if "--json" in argv:
        print(json.dumps(result, indent=2))
        return 0
    if not result["groups"]:
        print("No groups found (example rows are ignored).")
        return 0
    print(f"**Overall: {result['overall']}** — {result['reason']}\n")
    print("## By group\n")
    print("| Group | Status | Green | Amber | Red | Not assessed |")
    print("| --- | --- | --- | --- | --- | --- |")
    for g in sorted(result["groups"], key=lambda g: (-RANK[g["status"]], g["group"])):
        print(f"| {g['group']} | {g['status']} | {g['Green']} | {g['Amber']} | {g['Red']} | {len(g['not_assessed'])} |")
    print("\n## Blocking: Red on critical criteria\n")
    if result["blocking"]:
        print("| Group | Criterion | Evidence |")
        print("| --- | --- | --- |")
        for b in result["blocking"]:
            print(f"| {b['group']} | {b['criterion']} | {b['evidence']} |")
    else:
        print("None.")
    print("\n## Green without evidence (downgraded to Amber)\n")
    if result["downgraded"]:
        for d in result["downgraded"]:
            print(f"- {d['group']}: {d['criterion']}")
    else:
        print("None.")
    print("\n## Criteria not assessed\n")
    if result["not_assessed"]:
        for n in result["not_assessed"]:
            print(f"- {n['group']}: {', '.join(n['criteria'])}")
    else:
        print("None.")
    if "trend" in result:
        print("\n## Trend vs previous assessment\n")
        print("| Group | Previous | Now | Trend |")
        print("| --- | --- | --- | --- |")
        for t in result["trend"]:
            print(f"| {t['group']} | {t['previous']} | {t['now']} | {t['trend']} |")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
