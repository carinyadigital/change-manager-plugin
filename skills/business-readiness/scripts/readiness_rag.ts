#!/usr/bin/env node
/*
Roll up a people-readiness CSV into group and overall RAG.

Usage: node readiness_rag.ts <readiness.csv> [--previous <earlier.csv>] [--json]

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
*/
import * as fs from "node:fs";
import process from "node:process";

/** The usage text is the comment block above. */
const USAGE: string = (fs.readFileSync(new URL(import.meta.url), "utf8").match(/\/\*\n([\s\S]*?)\n\*\//)?.[1] ?? "Usage: see the comment at the top of this file.").trim();

// ---- helpers (Node standard library only) ----

/** One CSV data row keyed by header name; null where the row was short. */
type CsvRow = Map<string, string | null>;

interface CsvTable {
  fieldnames: string[] | null;
  rows: CsvRow[];
}

type JsonValue = null | boolean | number | bigint | string | JsonValue[] | Map<string, JsonValue> | { [key: string]: JsonValue };

const OUT: string[] = [];

function print(s: string = ""): void {
  OUT.push(s + "\n");
}

function flush(): void {
  if (OUT.length) {
    fs.writeSync(1, OUT.join(""));
    OUT.length = 0;
  }
}

/** Equivalent of Python's sys.exit("message"): message to stderr, exit 1. */
function die(msg: string): never {
  flush();
  fs.writeSync(2, msg + "\n");
  process.exit(1);
}

/** An unexpected failure where the Python would raise and print a traceback. */
class Crash extends Error {}

function crash(line: string): never {
  throw new Crash(line);
}


function run(main: (argv: string[]) => number): void {
  let code: number;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof Crash) {
      flush();
      fs.writeSync(2, "Traceback (most recent call last):\n" + e.message + "\n");
      process.exit(1);
    }
    throw e;
  }
  flush();
  process.exit(code);
}

// Python str.strip() whitespace set.
const WS = "\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const STRIP_RE = new RegExp(`^[${WS}]+|[${WS}]+$`, "g");

function strip(s: string | null | undefined): string {
  if (s === null || s === undefined) crash("AttributeError: 'NoneType' object has no attribute 'strip'");
  return s.replace(STRIP_RE, "");
}

function lower(s: string): string {
  return s.toLowerCase();
}

function hasKey<T extends object>(obj: T, key: string): key is Extract<keyof T, string> {
  return Object.hasOwn(obj, key);
}

/** Python repr() of a str (or None). */
const NONPRINT = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u;

function repr(s: string | null | undefined): string {
  if (s === null || s === undefined) return "None";
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = q;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === q) out += "\\" + q;
    else if (ch === "\t") out += "\\t";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch !== " " && NONPRINT.test(ch)) {
      if (cp < 0x100) out += "\\x" + cp.toString(16).padStart(2, "0");
      else if (cp < 0x10000) out += "\\u" + cp.toString(16).padStart(4, "0");
      else out += "\\U" + cp.toString(16).padStart(8, "0");
    } else out += ch;
  }
  return out + q;
}


/** Compare strings by code point, as Python does. */
function cmpStr(a: string, b: string): number {
  const ia = a[Symbol.iterator]();
  const ib = b[Symbol.iterator]();
  for (;;) {
    const x = ia.next();
    const y = ib.next();
    if (x.done || y.done) return x.done && y.done ? 0 : x.done ? -1 : 1;
    const d = (x.value.codePointAt(0) ?? 0) - (y.value.codePointAt(0) ?? 0);
    if (d) return d < 0 ? -1 : 1;
  }
}


/** Python json.dumps(value, indent=2) with ensure_ascii. Maps keep insertion order. */
function dumps(v: JsonValue, level: number = 0): string {
  const pad = "  ".repeat(level + 1);
  const end = "  ".repeat(level);
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (typeof v === "string") {
    return JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  }
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return "[\n" + v.map((x) => pad + dumps(x, level + 1)).join(",\n") + "\n" + end + "]";
  }
  const entries: [string, JsonValue][] = v instanceof Map ? [...v.entries()] : Object.entries(v);
  if (!entries.length) return "{}";
  return "{\n" + entries.map(([k, x]) => pad + dumps(k) + ": " + dumps(x, level + 1)).join(",\n") + "\n" + end + "}";
}

function readText(path: string): string {
  let buf: Buffer;
  try {
    buf = fs.readFileSync(path);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code ?? "";
    const known: Record<string, [string, number, string]> = {
      ENOENT: ["FileNotFoundError", 2, "No such file or directory"],
      EISDIR: ["IsADirectoryError", 21, "Is a directory"],
      EACCES: ["PermissionError", 13, "Permission denied"],
    };
    const [name, errno, text] = known[code] ?? ["OSError", 0, String(e)];
    crash(`${name}: [Errno ${errno}] ${text}: ${repr(path)}`);
  }
  try {
    // TextDecoder strips a leading UTF-8 byte order mark.
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    crash("UnicodeDecodeError: 'utf-8' codec can't decode bytes in file " + repr(path));
  }
}

type CsvState = "START_RECORD" | "START_FIELD" | "IN_FIELD" | "IN_QUOTED_FIELD" | "QUOTE_IN_QUOTED_FIELD" | "EAT_CRNL";

/**
 * RFC 4180 CSV parser matching Python's csv.reader (excel dialect, non-strict).
 * Blank lines yield []; quoted fields may hold commas, doubled quotes and newlines.
 */
function parseCsv(text: string): string[][] {
  const lines = text.match(/[^\r\n]*(\r\n|\r|\n)|[^\r\n]+$/g) ?? [];
  const records: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let state = "START_RECORD" as CsvState; // assertion: mutated inside proc()
  const save = (): void => {
    fields.push(field);
    field = "";
  };
  const isNl = (c: string | null): boolean => c === "\n" || c === "\r" || c === null;
  // c === null marks the end of a physical line.
  const proc = (c: string | null): void => {
    if (state === "START_RECORD") {
      if (c === null) return;
      if (c === "\n" || c === "\r") {
        state = "EAT_CRNL";
        return;
      }
      state = "START_FIELD";
    }
    switch (state) {
      case "START_FIELD":
        if (isNl(c)) {
          save();
          state = c === null ? "START_RECORD" : "EAT_CRNL";
        } else if (c === '"') state = "IN_QUOTED_FIELD";
        else if (c === ",") save();
        else {
          field += c;
          state = "IN_FIELD";
        }
        return;
      case "IN_FIELD":
        if (isNl(c)) {
          save();
          state = c === null ? "START_RECORD" : "EAT_CRNL";
        } else if (c === ",") {
          save();
          state = "START_FIELD";
        } else field += c;
        return;
      case "IN_QUOTED_FIELD":
        if (c === null) return;
        if (c === '"') state = "QUOTE_IN_QUOTED_FIELD";
        else field += c;
        return;
      case "QUOTE_IN_QUOTED_FIELD":
        if (c === '"') {
          field += c;
          state = "IN_QUOTED_FIELD";
        } else if (c === ",") {
          save();
          state = "START_FIELD";
        } else if (isNl(c)) {
          save();
          state = c === null ? "START_RECORD" : "EAT_CRNL";
        } else {
          field += c;
          state = "IN_FIELD";
        }
        return;
      case "EAT_CRNL":
        if (c === null) state = "START_RECORD";
        return;
    }
  };
  for (const line of lines) {
    for (const c of line) proc(c);
    proc(null);
    if (state === "START_RECORD") {
      records.push(fields);
      fields = [];
    }
  }
  if (field.length || state === "IN_QUOTED_FIELD") {
    save();
    records.push(fields);
  }
  return records;
}

/** csv.DictReader: the header row gives keys; short rows are padded with null; blank lines are skipped. */
function dictReader(text: string): CsvTable {
  const records = parseCsv(text);
  const header = records[0];
  if (header === undefined) return { fieldnames: null, rows: [] };
  const rows: CsvRow[] = [];
  for (const rec of records.slice(1)) {
    if (!rec.length) continue;
    const d: CsvRow = new Map();
    const n = Math.min(header.length, rec.length);
    for (let i = 0; i < n; i++) d.set(header[i] ?? "", rec[i] ?? "");
    for (const k of header.slice(rec.length)) d.set(k, null);
    rows.push(d);
  }
  return { fieldnames: header, rows };
}

/** Python row["key"]: a missing key is a KeyError. */
function get(row: CsvRow, key: string): string | null {
  const v = row.get(key);
  if (v === undefined) crash(`KeyError: ${repr(key)}`);
  return v;
}

function isExample(value: string | null | undefined): boolean {
  return lower(strip(value ?? "")).startsWith("example");
}

function missingColumns(fieldnames: string[] | null, required: string[]): string[] {
  const have = new Set(fieldnames ?? []);
  return required.filter((c) => !have.has(c)).sort(cmpStr);
}
// ---- end helpers ----

type Rag = "Green" | "Amber" | "Red";

interface ReadinessRow {
  group: string;
  criterion: string;
  rag: Rag;
  evidence: string;
  critical: boolean;
}

interface GroupResult {
  group: string;
  Green: number;
  Amber: number;
  Red: number;
  status: Rag;
  criteria: Map<string, Rag>;
  not_assessed: string[];
}

interface GroupCriterion {
  group: string;
  criterion: string;
}

interface BlockingItem extends GroupCriterion {
  evidence: string;
}

interface Gap {
  group: string;
  criteria: string[];
}

interface TrendItem {
  group: string;
  previous: string;
  now: string;
  trend: string;
}

interface Assessment {
  groups: GroupResult[];
  blocking: BlockingItem[];
  downgraded: GroupCriterion[];
  not_assessed: Gap[];
  overall: Rag;
  reason: string;
  trend?: TrendItem[];
}

const REQUIRED = ["group", "criterion", "rag", "evidence", "critical"];
const RAG_MAP: Record<string, Rag> = { g: "Green", green: "Green", a: "Amber", amber: "Amber", r: "Red", red: "Red" };
const RANK: Record<Rag, number> = { Green: 0, Amber: 1, Red: 2 };

function load(path: string): ReadinessRow[] {
  const table = dictReader(readText(path));
  const missing = missingColumns(table.fieldnames, REQUIRED);
  if (missing.length) die(`error: ${path}: missing columns: ${missing.join(", ")}`);
  const rows = table.rows.filter((r) => !isExample(get(r, "group")));
  const errors: string[] = [];
  const out: ReadinessRow[] = [];
  rows.forEach((r, idx) => {
    const i = idx + 2;
    const rawRag = get(r, "rag");
    const ragKey = lower(strip(rawRag ?? ""));
    const rag = hasKey(RAG_MAP, ragKey) ? RAG_MAP[ragKey] : undefined;
    if (rag === undefined) errors.push(`line ${i}: rag ${repr(rawRag)} is not Green/Amber/Red`);
    const rawCrit = get(r, "critical");
    const crit = lower(strip(rawCrit ?? ""));
    if (!["y", "n", "yes", "no"].includes(crit)) errors.push(`line ${i}: critical ${repr(rawCrit)} is not y/n`);
    const row = {
      critical: crit === "y" || crit === "yes",
      group: strip(get(r, "group")),
      criterion: strip(get(r, "criterion")),
      evidence: strip(get(r, "evidence") ?? ""),
    };
    if (rag !== undefined) out.push({ ...row, rag });
  });
  if (errors.length) die(`error: ${path}:\n  ` + errors.join("\n  "));
  return out;
}

function assess(rows: ReadinessRow[]): Assessment {
  const groups = new Map<string, GroupResult>();
  const allCriteria = new Set<string>();
  const downgraded: GroupCriterion[] = [];
  const blocking: BlockingItem[] = [];
  for (const r of rows) {
    let rag = r.rag;
    if (rag === "Green" && !r.evidence) {
      rag = "Amber";
      downgraded.push({ group: r.group, criterion: r.criterion });
    }
    allCriteria.add(r.criterion);
    let g = groups.get(r.group);
    if (g === undefined) {
      g = { group: r.group, Green: 0, Amber: 0, Red: 0, status: "Green", criteria: new Map(), not_assessed: [] };
      groups.set(r.group, g);
    }
    g[rag] += 1;
    g.criteria.set(r.criterion, rag);
    if (RANK[rag] > RANK[g.status]) g.status = rag;
    if (rag === "Red" && r.critical) {
      blocking.push({ group: r.group, criterion: r.criterion, evidence: r.evidence || "none recorded" });
    }
  }
  const gaps: Gap[] = [];
  const gs = [...groups.values()];
  for (const g of gs) {
    const missing = [...allCriteria].filter((c) => !g.criteria.has(c));
    g.not_assessed = missing;
    if (missing.length) {
      gaps.push({ group: g.group, criteria: missing });
      if (g.status === "Green") g.status = "Amber";
    }
  }
  let overall: Rag;
  let reason: string;
  if (blocking.length) {
    overall = "Red";
    reason = `${blocking.length} blocking Red(s) on critical criteria`;
  } else if (gs.some((g) => g.status !== "Green")) {
    const reds = gs.reduce((n, g) => n + g.Red, 0);
    const ambers = gs.reduce((n, g) => n + g.Amber, 0);
    overall = "Amber";
    reason = `${reds} non-critical Red(s), ${ambers} Amber(s), ${gaps.length} group(s) with criteria not assessed`;
  } else {
    overall = "Green";
    reason = "all criteria Green with evidence";
  }
  return { groups: gs, blocking, downgraded, not_assessed: gaps, overall, reason };
}

function trend(now: Assessment, before: Assessment): TrendItem[] {
  const prev = new Map<string, Rag>(before.groups.map((g) => [g.group, g.status]));
  const out: TrendItem[] = [];
  for (const g of now.groups) {
    const p = prev.get(g.group);
    let t: string;
    if (p === undefined) t = "new";
    else if (RANK[g.status] < RANK[p]) t = "better";
    else if (RANK[g.status] > RANK[p]) t = "worse";
    else t = "same";
    out.push({ group: g.group, previous: p ?? "-", now: g.status, trend: t });
  }
  const names = new Set(now.groups.map((g) => g.group));
  for (const [name, p] of prev) {
    if (!names.has(name)) out.push({ group: name, previous: p, now: "-", trend: "not assessed this time" });
  }
  return out;
}

function toJson(a: Assessment): JsonValue {
  const out: { [key: string]: JsonValue } = {
    groups: a.groups.map((g) => ({
      group: g.group,
      Green: g.Green,
      Amber: g.Amber,
      Red: g.Red,
      status: g.status,
      criteria: new Map<string, JsonValue>(g.criteria),
      not_assessed: g.not_assessed,
    })),
    blocking: a.blocking.map((b) => ({ ...b })),
    downgraded: a.downgraded.map((d) => ({ ...d })),
    not_assessed: a.not_assessed.map((n) => ({ ...n })),
    overall: a.overall,
    reason: a.reason,
  };
  if (a.trend) out.trend = a.trend.map((t) => ({ ...t }));
  return out;
}

function main(argv: string[]): number {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") {
    print(USAGE);
    return 0;
  }
  const result = assess(load(argv[0] ?? ""));
  if (argv.includes("--previous")) {
    const idx = argv.indexOf("--previous");
    const prevPath = argv[idx + 1];
    if (prevPath === undefined) die("error: --previous needs a file path");
    result.trend = trend(result, assess(load(prevPath)));
  }
  if (argv.includes("--json")) {
    print(dumps(toJson(result)));
    return 0;
  }
  if (!result.groups.length) {
    print("No groups found (example rows are ignored).");
    return 0;
  }
  print(`**Overall: ${result.overall}** — ${result.reason}\n`);
  print("## By group\n");
  print("| Group | Status | Green | Amber | Red | Not assessed |");
  print("| --- | --- | --- | --- | --- | --- |");
  const sorted = [...result.groups].sort((a, b) => RANK[b.status] - RANK[a.status] || cmpStr(a.group, b.group));
  for (const g of sorted) {
    print(`| ${g.group} | ${g.status} | ${g.Green} | ${g.Amber} | ${g.Red} | ${g.not_assessed.length} |`);
  }
  print("\n## Blocking: Red on critical criteria\n");
  if (result.blocking.length) {
    print("| Group | Criterion | Evidence |");
    print("| --- | --- | --- |");
    for (const b of result.blocking) print(`| ${b.group} | ${b.criterion} | ${b.evidence} |`);
  } else print("None.");
  print("\n## Green without evidence (downgraded to Amber)\n");
  if (result.downgraded.length) {
    for (const d of result.downgraded) print(`- ${d.group}: ${d.criterion}`);
  } else print("None.");
  print("\n## Criteria not assessed\n");
  if (result.not_assessed.length) {
    for (const n of result.not_assessed) print(`- ${n.group}: ${n.criteria.join(", ")}`);
  } else print("None.");
  if (result.trend) {
    print("\n## Trend vs previous assessment\n");
    print("| Group | Previous | Now | Trend |");
    print("| --- | --- | --- | --- |");
    for (const t of result.trend) print(`| ${t.group} | ${t.previous} | ${t.now} | ${t.trend} |`);
  }
  return 0;
}

run(main);
