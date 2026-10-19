#!/usr/bin/env node
/*
Check champion coverage against impacted groups.

Usage: node coverage.ts <impact-register.csv> <champions.csv> [--per N] [--json]

impact-register.csv columns used: group, headcount
  (the change-impact-assessment CSV; several rows per group are fine — the largest
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
*/
import { readFileSync } from "node:fs";
import process from "node:process";

// ---------------------------------------------------------------- shared helpers

/** A CSV row as csv.DictReader gives it: null where the row was short. */
type CsvRow = Map<string, string | null>;
type Json = null | boolean | number | bigint | string | PyFloat | Json[] | { [key: string]: Json };
type SortKey = Array<string | number | bigint | boolean>;

/** Exit with this message on stderr and status 1 (Python's sys.exit("...")). */
class Exit extends Error {}
function die(msg: string): never {
  throw new Exit(msg);
}

/** A float value, serialised to JSON the way Python's float repr does. */
class PyFloat {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

function usage(): string {
  const src = readFileSync(new URL(import.meta.url), "utf8");
  const m = /\/\*([\s\S]*?)\*\//.exec(src);
  return m ? m[1].trim() : "Usage: see the script header";
}

// Whitespace as Python's str.strip() and str.split() see it.
const WS = "\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const STRIP_RE = new RegExp(`^[${WS}]+|[${WS}]+$`, "g");
const NONPRINTABLE_RE = new RegExp("[\\p{Cc}\\p{Cf}\\p{Cs}\\p{Co}\\p{Cn}\\p{Zl}\\p{Zp}\\p{Zs}]", "u");

function strip(v: string | null | undefined): string {
  if (v === null || v === undefined) throw new Error("missing value in a short row");
  return v.replace(STRIP_RE, "");
}

/** Python int(): a BigInt, or undefined where Python raises ValueError. */
function pyInt(v: string | null | undefined): bigint | undefined {
  const t = strip(v);
  return /^[+-]?\d(_?\d)*$/.test(t) ? BigInt(t.replace(/_/g, "")) : undefined;
}

/** Python repr() of a str (or None). */
function pyRepr(v: string | null | undefined): string {
  if (v === null || v === undefined) return "None";
  const q = v.includes("'") && !v.includes('"') ? '"' : "'";
  let out = q;
  for (const ch of v) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === q) out += "\\" + q;
    else if (ch === "\t") out += "\\t";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch !== " " && NONPRINTABLE_RE.test(ch)) {
      const h = cp.toString(16);
      out += cp < 0x100 ? "\\x" + h.padStart(2, "0") : cp < 0x10000 ? "\\u" + h.padStart(4, "0") : "\\U" + h.padStart(8, "0");
    } else out += ch;
  }
  return out + q;
}

/** Python ordering: strings by code point, tuples element by element. */
function cmpStr(a: string, b: string): number {
  const A = [...a];
  const B = [...b];
  for (let i = 0; i < Math.min(A.length, B.length); i++) {
    const x = A[i].codePointAt(0) ?? 0;
    const y = B[i].codePointAt(0) ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return A.length === B.length ? 0 : A.length < B.length ? -1 : 1;
}
function cmpKey(ka: SortKey, kb: SortKey): number {
  for (let i = 0; i < ka.length; i++) {
    const a = ka[i];
    const b = kb[i];
    const c = typeof a === "string" && typeof b === "string" ? cmpStr(a, b) : a < b ? -1 : a > b ? 1 : 0;
    if (c) return c;
  }
  return 0;
}
function sortBy<T>(arr: T[], key: (v: T) => SortKey): T[] {
  return arr
    .map((v): [SortKey, T] => [key(v), v])
    .sort((x, y) => cmpKey(x[0], y[0]))
    .map((x) => x[1]);
}

/** RFC 4180 reader following Python's csv module (excel dialect) state machine. */
function parseCsv(text: string): string[][] {
  const lines: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n" || text[i] === "\r") {
      if (text[i] === "\r" && text[i + 1] === "\n") i++;
      lines.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < text.length) lines.push(text.slice(start));

  const SR = 0, SF = 1, IF = 2, IQ = 3, QQ = 4, EAT = 5;
  const records: string[][] = [];
  let state = SR;
  let field = "";
  let fields: string[] = [];
  const save = (): void => {
    fields.push(field);
    field = "";
  };
  // c === null marks the end of a physical line.
  const proc = (c: string | null): void => {
    const nl = c === "\n" || c === "\r";
    const eol = c === null;
    if (state === SR) {
      if (eol) return;
      if (nl) {
        state = EAT;
        return;
      }
      state = SF;
    }
    if (state === SF) {
      if (nl || eol) {
        save();
        state = eol ? SR : EAT;
      } else if (c === '"') state = IQ;
      else if (c === ",") save();
      else {
        field += c;
        state = IF;
      }
    } else if (state === IF) {
      if (nl || eol) {
        save();
        state = eol ? SR : EAT;
      } else if (c === ",") {
        save();
        state = SF;
      } else field += c;
    } else if (state === IQ) {
      if (eol) return;
      if (c === '"') state = QQ;
      else field += c;
    } else if (state === QQ) {
      if (c === '"') {
        field += c;
        state = IQ;
      } else if (c === ",") {
        save();
        state = SF;
      } else if (nl || eol) {
        save();
        state = eol ? SR : EAT;
      } else {
        field += c;
        state = IF;
      }
    } else if (state === EAT) {
      if (eol) state = SR;
    }
  };
  for (const line of lines) {
    for (const c of line) proc(c);
    proc(null);
    if (state === SR) {
      records.push(fields);
      fields = [];
    }
  }
  if (field.length || state === IQ) {
    save();
    records.push(fields);
  }
  return records;
}

/** csv.DictReader: header row gives keys; short rows get null; blank lines skipped. */
function readDicts(path: string): { fieldnames: string[]; rows: CsvRow[] } {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path)); // strips a BOM
  const records = parseCsv(text);
  const fieldnames = records.length ? records[0] : [];
  const rows: CsvRow[] = [];
  for (const rec of records.slice(1)) {
    if (rec.length === 0) continue;
    const d: CsvRow = new Map();
    fieldnames.forEach((k, i) => d.set(k, i < rec.length ? rec[i] : null));
    rows.push(d);
  }
  return { fieldnames, rows };
}
function get(row: CsvRow, key: string): string | null {
  return row.get(key) ?? null;
}

/** Python repr() of a float, as json.dumps writes it. */
function floatRepr(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "Infinity" : "-Infinity";
  if (x === 0) return Object.is(x, -0) ? "-0.0" : "0.0";
  const sign = x < 0 ? "-" : "";
  const [mant, expText] = Math.abs(x).toExponential().split("e");
  const digits = mant.replace(".", "");
  const exp = Number(expText);
  if (exp >= -4 && exp < 16) {
    if (exp < 0) return sign + "0." + "0".repeat(-exp - 1) + digits;
    const whole = digits.slice(0, exp + 1).padEnd(exp + 1, "0");
    return sign + whole + "." + (digits.slice(exp + 1) || "0");
  }
  const m = digits.length > 1 ? digits[0] + "." + digits.slice(1) : digits;
  return sign + m + "e" + (exp < 0 ? "-" : "+") + String(Math.abs(exp)).padStart(2, "0");
}

/** json.dumps(obj, indent=2) with ensure_ascii. */
function jsonStr(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const u = s.charCodeAt(i);
    if (u === 0x22) out += '\\"';
    else if (u === 0x5c) out += "\\\\";
    else if (u === 0x0a) out += "\\n";
    else if (u === 0x0d) out += "\\r";
    else if (u === 0x09) out += "\\t";
    else if (u === 0x08) out += "\\b";
    else if (u === 0x0c) out += "\\f";
    else if (u < 0x20 || u > 0x7e) out += "\\u" + u.toString(16).padStart(4, "0");
    else out += s[i];
  }
  return out + '"';
}
function dumps(v: Json, ind = ""): string {
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number" || typeof v === "bigint") return String(v);
  if (typeof v === "string") return jsonStr(v);
  if (v instanceof PyFloat) return floatRepr(v.value);
  const inner = ind + "  ";
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return "[\n" + v.map((x) => inner + dumps(x, inner)).join(",\n") + "\n" + ind + "]";
  }
  const entries = Object.entries(v);
  if (!entries.length) return "{}";
  return "{\n" + entries.map(([k, x]) => inner + jsonStr(k) + ": " + dumps(x, inner)).join(",\n") + "\n" + ind + "}";
}

function run(main: (argv: string[]) => string): void {
  try {
    process.stdout.write(main(process.argv.slice(2)));
  } catch (e) {
    const msg = e instanceof Exit ? e.message : `error: ${e instanceof Error ? e.message : String(e)}`;
    process.stderr.write(msg + "\n");
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- coverage

interface GroupCoverage {
  [key: string]: Json;
  group: string;
  headcount: bigint | null;
  champions: number;
  required: bigint;
  shortfall: bigint;
  ratio: string;
  status: string;
}

interface Unmatched {
  [key: string]: Json;
  group: string;
  champions: number;
}

interface Args {
  impactPath: string;
  champPath: string;
  per: bigint;
  asJson: boolean;
}

interface GroupTally {
  group: string;
  headcount: bigint | null;
  champions: number;
}

const ZERO = BigInt(0);
const ONE = BigInt(1);

/** Python float(): a number, or undefined where Python raises ValueError. */
function pyFloat(v: string): number | undefined {
  const t = strip(v);
  if (/^[+-]?(inf|infinity|nan)$/i.test(t)) {
    if (/nan/i.test(t)) return NaN;
    return t.startsWith("-") ? -Infinity : Infinity;
  }
  if (/^[+-]?(\d(_?\d)*(\.(\d(_?\d)*)?)?|\.\d(_?\d)*)([eE][+-]?\d(_?\d)*)?$/.test(t)) {
    return Number(t.replace(/_/g, ""));
  }
  return undefined;
}

const bigMax = (a: bigint, b: bigint): bigint => (a > b ? a : b);

function readRows(path: string, required: string[]): CsvRow[] {
  const { fieldnames, rows } = readDicts(path);
  const have = new Set(fieldnames);
  const missing = required.filter((k) => !have.has(k)).sort(cmpStr);
  if (missing.length) die(`error: ${path}: missing columns: ${missing.join(", ")}`);
  const first = fieldnames[0];
  return rows.filter((r) => !strip(get(r, first) ?? "").toLowerCase().startsWith("example"));
}

function parseArgs(argv: string[]): Args {
  let per = BigInt(25);
  let asJson = false;
  const paths: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--per") {
      if (i + 1 >= argv.length) die("error: --per needs a number");
      const n = pyInt(argv[i + 1]);
      if (n === undefined) die(`error: --per ${pyRepr(argv[i + 1])} is not a whole number`);
      if (n < ONE) die("error: --per must be 1 or more");
      per = n;
      i += 2;
      continue;
    }
    if (a === "--json") asJson = true;
    else paths.push(a);
    i += 1;
  }
  if (paths.length !== 2) die("error: give the impact register CSV and the champions CSV (see --help)");
  return { impactPath: paths[0], champPath: paths[1], per, asJson };
}

/** math.ceil(a / b) for whole numbers, as a Python int. */
function ceilDiv(a: bigint, b: bigint | number): bigint {
  return BigInt(Math.ceil(Number(a) / Number(b)));
}

function coverage(impacts: CsvRow[], champions: CsvRow[], per: bigint): [GroupCoverage[], Unmatched[]] {
  const groups = new Map<string, GroupTally>();
  for (const row of impacts) {
    const name = strip(get(row, "group"));
    if (!name) continue;
    let g = groups.get(name);
    if (!g) {
      g = { group: name, headcount: null, champions: 0 };
      groups.set(name, g);
    }
    const raw = strip(get(row, "headcount") ?? "").replace(/,/g, "");
    const f = pyFloat(raw);
    if (f === undefined || Number.isNaN(f)) continue;
    if (!Number.isFinite(f)) throw new Error("cannot convert float infinity to integer");
    const h = BigInt(Math.trunc(f));
    g.headcount = g.headcount === null ? h : bigMax(g.headcount, h);
  }

  const lookup = new Map<string, string>();
  for (const k of groups.keys()) lookup.set(k.toLowerCase(), k);
  const orphans = new Map<string, number>();
  for (const row of champions) {
    const name = strip(get(row, "group"));
    const key = lookup.get(name.toLowerCase());
    const g = key === undefined ? undefined : groups.get(key);
    if (g) g.champions += 1;
    else if (name) orphans.set(name, (orphans.get(name) ?? 0) + 1);
  }

  const result: GroupCoverage[] = [];
  for (const g of groups.values()) {
    const h = g.headcount;
    const required = h === null ? ONE : bigMax(ONE, ceilDiv(h, per));
    const c = g.champions;
    let status: string;
    if (c === 0) status = "no champion";
    else if (BigInt(c) < required) status = "gap";
    else if (h === null) status = "headcount unknown";
    else status = "ok";
    const ratio = h !== null && c ? `1:${ceilDiv(h, c)}` : "-";
    result.push({
      group: g.group,
      headcount: h,
      champions: c,
      required,
      shortfall: bigMax(ZERO, required - BigInt(c)),
      ratio,
      status,
    });
  }
  const order = new Map<string, number>([["no champion", 0], ["gap", 1], ["headcount unknown", 2], ["ok", 3]]);
  const sorted = sortBy(result, (r) => [order.get(r.status) ?? 0, -r.shortfall, r.group.toLowerCase()]);
  return [sorted, [...orphans].map(([group, n]): Unmatched => ({ group, champions: n }))];
}

function main(argv: string[]): string {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") return usage() + "\n";
  const { impactPath, champPath, per, asJson } = parseArgs(argv);
  const impacts = readRows(impactPath, ["group", "headcount"]);
  const champions = readRows(champPath, ["champion_role", "group"]);
  const [result, orphans] = coverage(impacts, champions, per);
  if (asJson) return dumps({ per, groups: result, unmatched: orphans }) + "\n";
  if (!result.length) return "No impacted groups found (example rows are ignored).\n";
  const p: string[] = [];
  p.push(`Target: 1 champion per ${per} people (minimum 1 per group).`);
  p.push("");
  p.push("| Group | People | Champions | Required | Shortfall | Ratio | Status |");
  p.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of result) {
    const people = r.headcount === null ? "unknown" : String(r.headcount);
    p.push(`| ${r.group} | ${people} | ${r.champions} | ${r.required} | ${r.shortfall} | ${r.ratio} | ${r.status} |`);
  }
  const gaps = result.filter((r) => r.status === "no champion" || r.status === "gap");
  const totalShort = gaps.reduce((sum, r) => sum + r.shortfall, ZERO);
  p.push("");
  p.push(`Groups below target: ${gaps.length} of ${result.length}; champions still needed: ${totalShort}.`);
  if (orphans.length) {
    p.push("");
    p.push("Champion groups not in the impact register (check spelling or add the group):");
    for (const o of orphans) p.push(`- ${o.group} (${o.champions})`);
  }
  return p.join("\n") + "\n";
}

run(main);
