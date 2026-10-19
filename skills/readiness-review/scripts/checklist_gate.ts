#!/usr/bin/env node
/*
Apply the default people-readiness go/no-go rule.

Usage: node checklist_gate.ts <readiness.csv> <impact-register.csv>
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

/** Thrown where the Python raises ValueError inside a try block. */
class ValueErr extends Error {}

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

/** Python int() of a str, as a BigInt. Throws ValueErr on bad text; crashes on None. */
function pyInt(s: string | null | undefined): bigint {
  if (s === null || s === undefined) {
    crash("TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'");
  }
  const t = strip(s);
  if (!/^[+-]?\p{Nd}+(_\p{Nd}+)*$/u.test(t)) throw new ValueErr();
  let digits = "";
  for (const ch of t) {
    if (ch === "+" || ch === "_") continue;
    if (ch === "-") {
      digits += "-";
      continue;
    }
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x30 && cp <= 0x39) {
      digits += ch;
      continue;
    }
    // Unicode decimal digits come in runs of ten; the value is the position in the run.
    let back = 0;
    while (back < 9 && /\p{Nd}/u.test(String.fromCodePoint(cp - back - 1))) back++;
    digits += String(back % 10);
  }
  return BigInt(digits);
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

interface GroupCounts {
  Red: number;
  Amber: number;
  Green: number;
  crit_red: number;
}

interface GateArgs {
  readinessPath: string;
  impactPath: string;
  critical: Set<string> | null;
  threshold: bigint;
}

const RAG: Record<string, Rag> = { red: "Red", r: "Red", amber: "Amber", a: "Amber", green: "Green", g: "Green", "": "Amber" };

function readRows(path: string, required: string[]): CsvRow[] {
  const table = dictReader(readText(path));
  const missing = missingColumns(table.fieldnames, required);
  if (missing.length) die(`error: ${path}: missing columns: ${missing.join(", ")}`);
  const first = table.fieldnames?.[0] ?? "";
  return table.rows.filter((r) => !isExample(r.get(first)));
}

/** Impact headline per group = highest dimension score. */
function headlines(rows: CsvRow[]): Map<string, number> {
  const out = new Map<string, number>();
  rows.forEach((r, idx) => {
    const i = idx + 2;
    let s = 0;
    try {
      const v = pyInt(get(r, "score"));
      if (!(v >= 0n && v <= 4n)) throw new ValueErr();
      s = Number(v);
    } catch (e) {
      if (!(e instanceof ValueErr)) throw e;
      die(`error: impact line ${i}: score ${repr(get(r, "score"))} is not 0-4`);
    }
    const g = strip(get(r, "group"));
    out.set(g, Math.max(out.get(g) ?? 0, s));
  });
  return out;
}

function optionValue(argv: string[], i: number): string {
  const v = argv[i + 1];
  if (v === undefined) crash("IndexError: list index out of range");
  return v;
}

function parseArgs(argv: string[]): GateArgs {
  const pos: string[] = [];
  let critical: Set<string> | null = null;
  let threshold = 3n;
  let i = 0;
  while (i < argv.length) {
    const a = argv[i] ?? "";
    if (a === "--critical") {
      const names = optionValue(argv, i).split(",").filter((c) => strip(c));
      critical = new Set(names.map((c) => lower(strip(c))));
      i += 2;
    } else if (a === "--threshold") {
      const v = optionValue(argv, i);
      try {
        threshold = pyInt(v);
      } catch (e) {
        if (!(e instanceof ValueErr)) throw e;
        crash(`ValueError: invalid literal for int() with base 10: ${repr(v)}`);
      }
      i += 2;
    } else {
      pos.push(a);
      i += 1;
    }
  }
  const [readinessPath, impactPath] = pos;
  if (pos.length !== 2 || readinessPath === undefined || impactPath === undefined) {
    die("error: need <readiness.csv> <impact-register.csv> (see --help)");
  }
  return { readinessPath, impactPath, critical, threshold };
}

function main(argv: string[]): number {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") {
    print(USAGE);
    return 0;
  }
  const { readinessPath, impactPath, critical, threshold } = parseArgs(argv);
  const ready = readRows(readinessPath, ["group", "criterion", "rag", "evidence", "critical"]);
  const heads = headlines(readRows(impactPath, ["group", "score"]));

  const groups = new Map<string, GroupCounts>();
  const reasonsBlock: string[] = [];
  const reasonsCond: string[] = [];
  const notes: string[] = [];
  ready.forEach((r, idx) => {
    const i = idx + 2;
    const g = strip(get(r, "group"));
    const critName = strip(get(r, "criterion"));
    const raw = lower(strip(get(r, "rag")));
    if (!hasKey(RAG, raw)) die(`error: readiness line ${i}: rag ${repr(get(r, "rag"))} is not red/amber/green`);
    let rag: Rag = RAG[raw];
    if (raw === "") notes.push(`${g} / ${critName}: blank RAG treated as Amber`);
    if (rag === "Green" && !strip(get(r, "evidence"))) {
      rag = "Amber";
      notes.push(`${g} / ${critName}: Green without evidence downgraded to Amber`);
    }
    let isCrit = ["y", "yes"].includes(lower(strip(get(r, "critical"))));
    if (critical !== null && critical.has(lower(critName))) isCrit = true;
    let rec = groups.get(g);
    if (rec === undefined) {
      rec = { Red: 0, Amber: 0, Green: 0, crit_red: 0 };
      groups.set(g, rec);
    }
    rec[rag] += 1;
    const head = heads.get(g);
    if (rag === "Red" && isCrit) {
      rec.crit_red += 1;
      if (head === undefined || BigInt(head) >= threshold) {
        const label = head === undefined ? "no impact score (treated as high)" : `impact headline ${head}`;
        reasonsBlock.push(`${g}: critical criterion '${critName}' is Red (${label})`);
      } else {
        reasonsCond.push(`${g}: critical criterion '${critName}' is Red (impact headline ${head}, below ${threshold})`);
      }
    } else if (rag === "Red") {
      reasonsCond.push(`${g}: '${critName}' is Red (not critical)`);
    } else if (rag === "Amber") {
      reasonsCond.push(`${g}: '${critName}' is Amber${isCrit ? " (critical)" : ""}`);
    }
  });

  if (!groups.size) {
    print("No readiness rows found (example rows are ignored).");
    print("\nVerdict: NO-GO — no readiness evidence.");
    return 0;
  }

  for (const g of groups.keys()) {
    if (!heads.has(g)) notes.push(`${g}: has readiness rows but no impact score (treated as high)`);
  }
  for (const g of heads.keys()) {
    if (!groups.has(g)) notes.push(`${g}: in impact register but has no readiness rows`);
  }

  const verdict = reasonsBlock.length ? "NO-GO" : reasonsCond.length ? "GO WITH CONDITIONS" : "GO";

  print(`Verdict (readiness rule only): ${verdict}\n`);
  print("| Group | Impact headline | Critical Reds | Reds | Ambers | Greens |");
  print("| --- | --- | --- | --- | --- | --- |");
  for (const [g, rec] of groups) {
    const head = heads.get(g) ?? "-";
    print(`| ${g} | ${head} | ${rec.crit_red} | ${rec.Red} | ${rec.Amber} | ${rec.Green} |`);
  }
  if (reasonsBlock.length) {
    print("\nBlocking:");
    for (const x of reasonsBlock) print(`- ${x}`);
  }
  if (reasonsCond.length) {
    print("\nNeeds a condition (owner and date before go-live):");
    for (const x of reasonsCond) print(`- ${x}`);
  }
  if (notes.length) {
    print("\nNotes:");
    for (const x of notes) print(`- ${x}`);
  }
  return 0;
}

run(main);
