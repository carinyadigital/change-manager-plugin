#!/usr/bin/env node
/*
Place stakeholders on the influence x impact grid and list commitment gaps.

Usage: node grid.ts <stakeholder-register.csv> [--high-from N] [--json]

Input columns: stakeholder, type, influence, impact, current, needed, owner
  influence, impact: 1 (low) to 3 (high)  -- see references/rating-scales.md
  current, needed:   unaware | aware | understands | supports | committed
                     ("advocates" and "committed / advocates" count as committed)

Options:
  --high-from N  score at or above which influence/impact counts as high
                 (default 3; use 2 to treat medium as high)
  --json         print JSON instead of markdown

Grid quadrants:
  high influence / high impact = partner closely
  high influence / low impact  = keep satisfied
  low influence  / high impact = keep informed and supported
  low influence  / low impact  = monitor

Commitment gap = steps from current to needed. A gap of two or more steps on a
high-influence stakeholder is flagged as a priority action.
Rows whose stakeholder starts with "Example" are ignored.
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
const SPLIT_RE = new RegExp(`[${WS}]+`);
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

// ---------------------------------------------------------------- grid

interface Placed {
  [key: string]: Json;
  stakeholder: string;
  type: string;
  influence: number;
  impact: number;
  quadrant: string;
  current: string;
  needed: string;
  gap: number;
  priority: boolean;
  owner: string;
}

const REQUIRED = ["stakeholder", "type", "influence", "impact", "current", "needed", "owner"];
const LEVELS = ["unaware", "aware", "understands", "supports", "committed"];
const ALIASES = new Map<string, string>([
  ["advocate", "committed"],
  ["advocates", "committed"],
  ["committed / advocates", "committed"],
  ["committed/advocates", "committed"],
  ["understand", "understands"],
  ["support", "supports"],
]);
const QUADRANT_ORDER = ["partner closely", "keep satisfied", "keep informed and supported", "monitor"];
const ONE = BigInt(1);
const THREE = BigInt(3);

class LevelError extends Error {
  value: string | null;
  constructor(value: string | null) {
    super("unknown commitment level");
    this.value = value;
  }
}

function level(value: string | null): number {
  let v = strip(value).toLowerCase().split(SPLIT_RE).filter(Boolean).join(" ");
  v = ALIASES.get(v) ?? v;
  if (!LEVELS.includes(v)) throw new LevelError(value);
  return LEVELS.indexOf(v);
}

function load(path: string): CsvRow[] {
  const { fieldnames, rows } = readDicts(path);
  const have = new Set(fieldnames);
  const missing = REQUIRED.filter((k) => !have.has(k)).sort(cmpStr);
  if (missing.length) die(`error: missing columns: ${missing.join(", ")}`);
  return rows.filter((r) => {
    const s = strip(get(r, "stakeholder"));
    return s !== "" && !s.toLowerCase().startsWith("example");
  });
}

function analyse(rows: CsvRow[], highFrom: bigint): Placed[] {
  const out: Placed[] = [];
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const i = idx + 2;
    const infB = pyInt(get(row, "influence"));
    const impB = infB === undefined ? undefined : pyInt(get(row, "impact"));
    if (infB === undefined || impB === undefined || !(infB >= ONE && infB <= THREE && impB >= ONE && impB <= THREE)) {
      errors.push(`line ${i}: influence/impact must be 1-3`);
      return;
    }
    let cur: number;
    let need: number;
    try {
      cur = level(get(row, "current"));
      need = level(get(row, "needed"));
    } catch (e) {
      if (!(e instanceof LevelError)) throw e;
      errors.push(`line ${i}: unknown commitment level ${pyRepr(e.value)}`);
      return;
    }
    const hiInf = infB >= highFrom;
    const hiImp = impB >= highFrom;
    const quadrant = hiInf && hiImp ? "partner closely" : hiInf ? "keep satisfied" : hiImp ? "keep informed and supported" : "monitor";
    const gap = need - cur;
    out.push({
      stakeholder: strip(get(row, "stakeholder")),
      type: strip(get(row, "type")),
      influence: Number(infB),
      impact: Number(impB),
      quadrant,
      current: LEVELS[cur],
      needed: LEVELS[need],
      gap,
      priority: hiInf && gap >= 2,
      owner: strip(get(row, "owner")),
    });
  });
  if (errors.length) die("error:\n  " + errors.join("\n  "));
  return sortBy(out, (r) => [QUADRANT_ORDER.indexOf(r.quadrant), -r.influence, -r.impact, r.stakeholder]);
}

function main(argv: string[]): string {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") return usage() + "\n";
  let highFrom = THREE;
  const at = argv.indexOf("--high-from");
  if (at !== -1) {
    const n = at + 1 < argv.length ? pyInt(argv[at + 1]) : undefined;
    if (n === undefined) die("error: --high-from needs a number 1-3");
    highFrom = n;
  }
  const result = analyse(load(argv[0]), highFrom);
  if (argv.includes("--json")) return dumps(result) + "\n";
  if (!result.length) return "No stakeholders found (example rows are ignored).\n";
  const p: string[] = [];
  p.push(`## Influence x impact grid (high = ${highFrom} or more)\n`);
  p.push("| Quadrant | Stakeholder | Type | Influence | Impact | Owner |");
  p.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of result) {
    p.push(`| ${r.quadrant} | ${r.stakeholder} | ${r.type} | ${r.influence} | ${r.impact} | ${r.owner} |`);
  }
  p.push("\n## Commitment gaps\n");
  p.push("| Stakeholder | Influence | Current | Needed | Gap (steps) | Priority action |");
  p.push("| --- | --- | --- | --- | --- | --- |");
  const gaps = sortBy(
    result.filter((r) => r.gap > 0),
    (r) => [!r.priority, -r.gap, -r.influence, r.stakeholder],
  );
  for (const r of gaps) {
    p.push(`| ${r.stakeholder} | ${r.influence} | ${r.current} | ${r.needed} | ${r.gap} | ${r.priority ? "yes" : "no"} |`);
  }
  if (!gaps.length) p.push("| none | | | | | |");
  const over = result.filter((r) => r.gap < 0);
  const priority = result.filter((r) => r.priority).length;
  p.push(`\nPriority actions (gap of 2+ steps on high influence): ${priority}`);
  if (over.length) {
    p.push("Current commitment above needed (check the 'needed' level): " + over.map((r) => r.stakeholder).join(", "));
  }
  return p.join("\n") + "\n";
}

run(main);
