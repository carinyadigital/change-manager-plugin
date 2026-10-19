#!/usr/bin/env node
/*
Roll up an impact register CSV into group scores.

Usage: node score_impacts.ts <impact-register.csv> [--json]

Input columns: group, headcount, dimension, today, future, score, evidence
Score is 0-4 (see references/rating-scales.md).

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
  if (argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (!result.length) {
    console.log("No groups found (example rows are ignored).");
    return;
  }
  console.log("| Group | People | Headline | Dimensions at 3+ | Dimensions changed | Priority |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const g of result) {
    console.log(`| ${g.group} | ${g.headcount} | ${g.headline} | ${g.breadth} | ${g.dimensions} | ${g.priority} |`);
  }
}

main(process.argv.slice(2));
