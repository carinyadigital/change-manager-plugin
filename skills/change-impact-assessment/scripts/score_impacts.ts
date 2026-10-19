#!/usr/bin/env node
/*
Roll up an impact register CSV into group scores.

Usage: node score_impacts.ts <impact-register.csv> [--json]
       node score_impacts.ts <impact-register.csv> --portfolio <initiative>

Input columns: group, headcount, dimension, today, future, score, evidence
Optional columns: starts, ends (YYYY-MM) — the months the group is actively
asked to do something for this change.
Score is 0-4 (see references/rating-scales.md).

--portfolio prints portfolio.csv rows (initiative,group,month,load) for the
portfolio-saturation skill: each group's headline score in every month from
its earliest start to its latest end. Groups without dates are listed on
stderr and skipped.

Per group:
  headline = highest dimension score
  breadth  = number of dimensions scored 3 or more
  priority = high if headline == 4 or breadth >= 2; medium if headline == 3
             or breadth == 1; low otherwise
Rows whose group starts with "Example" are ignored.
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Row = Record<string, string>;
type Priority = "high" | "medium" | "low";

interface GroupScore {
  group: string;
  headcount: string;
  headline: number;
  breadth: number;
  dimensions: number;
  priority?: Priority;
  starts?: string;
  ends?: string;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Months from start to end inclusive, as YYYY-MM. */
export function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

interface Csv {
  header: string[];
  records: Row[];
}

const USAGE: string = readFileSync(fileURLToPath(import.meta.url), "utf8").split("/*")[1].split("*/")[0].trim();
const REQUIRED: readonly string[] = ["group", "headcount", "dimension", "score"];

export function parseCsv(input: string): Csv {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  const header = nonEmpty.shift() ?? [];
  const records = nonEmpty.map((r): Row => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ""])));
  return { header, records };
}

function die(msg: string): never {
  process.stderr.write(msg + "\n");
  process.exit(1);
}

function load(path: string): Row[] {
  const { header, records } = parseCsv(readFileSync(path, "utf8"));
  const missing = REQUIRED.filter((c) => !header.includes(c)).sort();
  if (missing.length) die(`error: missing columns: ${missing.join(", ")}`);
  return records.filter((r) => !r.group.trim().toLowerCase().startsWith("example"));
}

export function score(rows: Row[]): GroupScore[] {
  const groups = new Map<string, GroupScore>();
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const name = row.group.trim();
    const raw = row.score.trim();
    const s = /^[+-]?\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (!(s >= 0 && s <= 4)) {
      errors.push(`line ${idx + 2}: score '${row.score}' is not 0-4`);
      return;
    }
    let g = groups.get(name);
    if (!g) {
      g = { group: name, headcount: row.headcount.trim(), headline: 0, breadth: 0, dimensions: 0 };
      groups.set(name, g);
    }
    const st = (row.starts ?? "").trim();
    const en = (row.ends ?? "").trim() || st;
    if (st) {
      if (!MONTH_RE.test(st) || !MONTH_RE.test(en) || en < st) {
        errors.push(`line ${idx + 2}: starts/ends '${st}'/'${en}' must be YYYY-MM with ends on or after starts`);
        return;
      }
      if (!g.starts || st < g.starts) g.starts = st;
      if (!g.ends || en > g.ends) g.ends = en;
    }
    g.headline = Math.max(g.headline, s);
    g.dimensions += 1;
    if (s >= 3) g.breadth += 1;
  });
  if (errors.length) die("error:\n  " + errors.join("\n  "));
  for (const g of groups.values()) {
    if (g.headline === 4 || g.breadth >= 2) g.priority = "high";
    else if (g.headline === 3 || g.breadth === 1) g.priority = "medium";
    else g.priority = "low";
  }
  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  return [...groups.values()].sort((a, b) =>
    order[a.priority ?? "low"] - order[b.priority ?? "low"] || b.headline - a.headline || b.breadth - a.breadth);
}

function main(argv: string[]): void {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") {
    console.log(USAGE);
    return;
  }
  const result = score(load(argv[0]));
  const pi = argv.indexOf("--portfolio");
  if (pi !== -1) {
    const initiative = argv[pi + 1];
    if (!initiative) die("error: --portfolio needs an initiative name");
    const undated = result.filter((g) => !g.starts).map((g) => g.group);
    if (undated.length) process.stderr.write(`no starts/ends for: ${undated.join(", ")}\n`);
    console.log("initiative,group,month,load");
    const q = (v: string): string => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
    for (const g of result) {
      if (!g.starts || !g.ends) continue;
      for (const month of monthsBetween(g.starts, g.ends)) console.log(`${q(initiative)},${q(g.group)},${month},${g.headline}`);
    }
    return;
  }
  if (argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (!result.length) {
    console.log("No groups found (example rows are ignored).");
    return;
  }
  console.log("| Group | People | Headline | Dimensions at 3+ | Dimensions changed | Priority | Active months |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  for (const g of result) {
    const active = g.starts ? (g.starts === g.ends ? g.starts : `${g.starts} to ${g.ends}`) : "not dated";
    console.log(`| ${g.group} | ${g.headcount} | ${g.headline} | ${g.breadth} | ${g.dimensions} | ${g.priority} | ${active} |`);
  }
}

main(process.argv.slice(2));
