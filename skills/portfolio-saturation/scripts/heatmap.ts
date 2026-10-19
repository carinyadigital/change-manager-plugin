#!/usr/bin/env node
/*
Build a group x month change-load heatmap from a portfolio CSV.

Usage: node heatmap.ts <portfolio.csv> [--capacity N] [--json]

Input columns: initiative, group, month (YYYY-MM), load (0-4)

Per group and month, total = sum of load across initiatives.
Status:
  red   (saturated) if total > capacity (default 6)
  amber (watch)     if 4 <= total <= capacity
  green             if total < 4
Cells with no rows are shown as blank (no data), not as zero.
Rows whose first column starts with "Example" are ignored.
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

function cmpNum(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0;
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

type CellStatus = "red" | "amber" | "green";

interface Cell {
  group: string;
  month: string;
  total: number;
  initiatives: string[];
  status: CellStatus;
}

interface Heatmap {
  capacity: bigint;
  groups: string[];
  months: string[];
  /** Keyed by cellKey(group, month), in first-seen order. */
  cells: Map<string, Cell>;
}

const MONTH = /^\p{Nd}{4}-(0[1-9]|1[0-2])$/u;
const SYMBOL: Record<CellStatus, string> = { red: "R", amber: "A", green: "G" };

function cellKey(group: string, month: string): string {
  return JSON.stringify([group, month]);
}

function load(path: string): CsvRow[] {
  const table = dictReader(readText(path));
  const missing = missingColumns(table.fieldnames, ["initiative", "group", "month", "load"]);
  if (missing.length) die(`error: missing columns: ${missing.join(", ")}`);
  const first = table.fieldnames?.[0] ?? "";
  return table.rows.filter((r) => !isExample(r.get(first)));
}

function status(total: number, capacity: bigint): CellStatus {
  if (BigInt(total) > capacity) return "red";
  if (total >= 4) return "amber";
  return "green";
}

function build(rows: CsvRow[], capacity: bigint): Heatmap {
  const cells = new Map<string, Cell>();
  const groups = new Set<string>();
  const months = new Set<string>();
  const errors: string[] = [];
  rows.forEach((r, idx) => {
    const i = idx + 2;
    const g = strip(get(r, "group"));
    const m = strip(get(r, "month"));
    const ini = strip(get(r, "initiative"));
    if (!MONTH.test(m)) {
      errors.push(`line ${i}: month ${repr(m)} is not YYYY-MM`);
      return;
    }
    let v: number;
    try {
      const n = pyInt(get(r, "load"));
      if (!(n >= 0n && n <= 4n)) throw new ValueErr();
      v = Number(n);
    } catch (e) {
      if (!(e instanceof ValueErr)) throw e;
      errors.push(`line ${i}: load ${repr(get(r, "load"))} is not 0-4`);
      return;
    }
    groups.add(g);
    months.add(m);
    const key = cellKey(g, m);
    let c = cells.get(key);
    if (c === undefined) {
      c = { group: g, month: m, total: 0, initiatives: [], status: "green" };
      cells.set(key, c);
    }
    c.total += v;
    if (v) c.initiatives.push(`${ini} (${v})`);
  });
  if (errors.length) die("error:\n  " + errors.join("\n  "));
  for (const c of cells.values()) {
    c.status = status(c.total, capacity);
    c.initiatives.sort(cmpStr);
  }
  return { capacity, groups: [...groups], months: [...months].sort(cmpStr), cells };
}

function main(argv: string[]): number {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") {
    print(USAGE);
    return 0;
  }
  let capacity = 6n;
  if (argv.includes("--capacity")) {
    const value = argv[argv.indexOf("--capacity") + 1];
    try {
      if (value === undefined) throw new ValueErr();
      capacity = pyInt(value);
    } catch (e) {
      if (!(e instanceof ValueErr)) throw e;
      die("error: --capacity needs a whole number");
    }
  }
  const res = build(load(argv[0] ?? ""), capacity);
  if (!res.groups.length) {
    print("No rows found (example rows are ignored).");
    return 0;
  }
  const cellList = [...res.cells.values()];
  if (argv.includes("--json")) {
    const sorted = [...cellList].sort((a, b) => cmpStr(a.group, b.group) || cmpStr(a.month, b.month));
    const out: JsonValue = {
      capacity: res.capacity,
      groups: res.groups,
      months: res.months,
      cells: sorted.map((c) => ({ group: c.group, month: c.month, total: c.total, initiatives: c.initiatives, status: c.status })),
    };
    print(dumps(out));
    return 0;
  }

  const months = res.months;
  print(`Capacity per group per month: ${capacity}. Cell = total load (R saturated, A watch, G ok; blank = no data).\n`);
  print("| Group | " + months.join(" | ") + " |");
  print("| --- |" + " --- |".repeat(months.length));
  for (const g of res.groups) {
    const row = months.map((m) => {
      const c = res.cells.get(cellKey(g, m));
      return c === undefined ? "" : `${c.total} ${SYMBOL[c.status]}`;
    });
    print(`| ${g} | ` + row.join(" | ") + " |");
  }

  const rank = (c: Cell): number => (c.status === "red" ? 0 : 1);
  const flagged = cellList.filter((c) => c.status !== "green");
  flagged.sort(
    (a, b) => cmpNum(rank(a), rank(b)) || cmpNum(-a.total, -b.total) || cmpStr(a.group, b.group) || cmpStr(a.month, b.month),
  );
  const red = flagged.filter((c) => c.status === "red").length;
  const amber = flagged.length - red;
  const verdict = red ? "Saturated" : amber ? "Watch" : "Within capacity";
  print(`\nVerdict: ${verdict} (${red} saturated, ${amber} watch)`);
  if (flagged.length) {
    print("\n| Group | Month | Load | Status | Contributing initiatives |");
    print("| --- | --- | --- | --- | --- |");
    for (const c of flagged) {
      const label = c.status === "red" ? "saturated" : "watch";
      print(`| ${c.group} | ${c.month} | ${c.total} | ${label} | ${c.initiatives.join("; ")} |`);
    }
  }
  return 0;
}

run(main);
