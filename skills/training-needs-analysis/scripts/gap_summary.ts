#!/usr/bin/env node
/*
Summarise a training needs analysis CSV into proficiency gaps by role.

Usage: node gap_summary.ts <tna.csv> [--json]

Input columns (required): role, headcount, task, current, required, method
Optional column: hours_per_learner (learning time per person for that task)

Proficiency is 0-3:
  0 = no knowledge, 1 = aware (knows it exists, needs help),
  2 = can do with a guide or support, 3 = can do unaided and help others.

Per task:  gap = max(required - current, 0)
Per role:
  tasks          = number of task rows
  total_gap      = sum of task gaps
  max_gap        = largest task gap
  tasks_gap_2    = number of tasks with gap 2 or more
  learner_hours  = sum(hours_per_learner * headcount) where hours are given
Roles are sorted by max gap, then total gap (largest first).
Rows whose role starts with "Example" are ignored.
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

// ---------------------------------------------------------------- gap summary

interface RoleSummary {
  [key: string]: Json;
  role: string;
  headcount: bigint | null;
  tasks: number;
  total_gap: number;
  max_gap: number;
  tasks_gap_2: number;
  learner_hours: PyFloat | null;
  hours_missing: number;
}

interface BigGap {
  [key: string]: Json;
  role: string;
  task: string;
  current: number;
  required: number;
  gap: number;
  method: string;
}

interface Summary {
  [key: string]: Json;
  roles: RoleSummary[];
  gaps_2_or_more: BigGap[];
  has_hours: boolean;
}

const REQUIRED = ["role", "headcount", "task", "current", "required", "method"];
const FIVE = BigInt(5);
const TEN = BigInt(10);
const TWO = BigInt(2);

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

/** Python f"{x:.1f}": exact value, ties to even. */
function fmt1f(x: number): string {
  if (Number.isNaN(x)) return "nan";
  if (!Number.isFinite(x)) return x > 0 ? "inf" : "-inf";
  const neg = x < 0 || Object.is(x, -0);
  const a = Math.abs(x);
  let s: string;
  if (a >= 1e21) {
    s = BigInt(a).toString() + ".0";
  } else if (Number.isInteger(a * 4) && (a * 4) % 2 === 1) {
    // a = m/4 with m odd: exactly halfway between two tenths.
    const lo = (FIVE * BigInt(a * 4) - BigInt(1)) / TWO;
    const n = lo % TWO === BigInt(0) ? lo : lo + BigInt(1);
    s = `${n / TEN}.${n % TEN}`;
  } else {
    s = a.toFixed(1);
  }
  return (neg ? "-" : "") + s;
}

function load(path: string): [CsvRow[], boolean] {
  const { fieldnames, rows } = readDicts(path);
  const fields = new Set(fieldnames);
  const missing = REQUIRED.filter((k) => !fields.has(k)).sort(cmpStr);
  if (missing.length) die(`error: missing columns: ${missing.join(", ")}`);
  const kept = rows.filter((r) => !strip(get(r, "role") ?? "").toLowerCase().startsWith("example"));
  return [kept, fields.has("hours_per_learner")];
}

function asLevel(value: string | null, field: string, line: number, errors: string[]): number | null {
  const n = value === null ? undefined : pyInt(value);
  if (n === undefined || n < BigInt(0) || n > BigInt(3)) {
    errors.push(`line ${line}: ${field} ${pyRepr(value)} is not 0-3`);
    return null;
  }
  return Number(n);
}

function summarise(rows: CsvRow[], hasHours: boolean): Summary {
  const roles = new Map<string, RoleSummary>();
  const bigGaps: BigGap[] = [];
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const i = idx + 2;
    const cur = asLevel(get(row, "current"), "current", i, errors);
    const req = asLevel(get(row, "required"), "required", i, errors);
    if (cur === null || req === null) return;
    const role = strip(get(row, "role"));
    const headRaw = strip(get(row, "headcount") ?? "");
    let head: bigint | null = null;
    if (headRaw) {
      const n = pyInt(headRaw);
      if (n === undefined) {
        errors.push(`line ${i}: headcount ${pyRepr(headRaw)} is not a whole number`);
        return;
      }
      head = n;
    }
    const gap = Math.max(req - cur, 0);
    let r = roles.get(role);
    if (!r) {
      r = { role, headcount: head, tasks: 0, total_gap: 0, max_gap: 0, tasks_gap_2: 0, learner_hours: null, hours_missing: 0 };
      roles.set(role, r);
    }
    if (r.headcount === null && head !== null) r.headcount = head;
    r.tasks += 1;
    r.total_gap += gap;
    r.max_gap = Math.max(r.max_gap, gap);
    if (gap >= 2) {
      r.tasks_gap_2 += 1;
      const task = strip(get(row, "task"));
      const method = strip(get(row, "method"));
      bigGaps.push({ role, task, current: cur, required: req, gap, method });
    }
    if (hasHours && gap > 0) {
      const hrsRaw = strip(get(row, "hours_per_learner") ?? "");
      if (!hrsRaw || head === null) {
        r.hours_missing += 1;
      } else {
        const hrs = pyFloat(hrsRaw);
        if (hrs === undefined) {
          errors.push(`line ${i}: hours_per_learner ${pyRepr(hrsRaw)} is not a number`);
          return;
        }
        const people = Number(head);
        if (!Number.isFinite(people)) throw new Error("int too large to convert to float");
        const prev = r.learner_hours === null || r.learner_hours.value === 0 ? 0 : r.learner_hours.value;
        r.learner_hours = new PyFloat(prev + hrs * people);
      }
    }
  });
  if (errors.length) die("error:\n  " + errors.join("\n  "));
  const ordered = sortBy([...roles.values()], (r) => [-r.max_gap, -r.total_gap, r.role]);
  const gaps = sortBy(bigGaps, (g) => [-g.gap, g.role, g.task]);
  return { roles: ordered, gaps_2_or_more: gaps, has_hours: hasHours };
}

function fmtHours(r: RoleSummary): string {
  if (r.learner_hours === null) return "not given";
  let text = fmt1f(r.learner_hours.value);
  if (r.hours_missing) text += ` (+${r.hours_missing} task(s) without hours)`;
  return text;
}

function main(argv: string[]): string {
  if (!argv.length || argv[0] === "-h" || argv[0] === "--help") return usage() + "\n";
  const [rows, hasHours] = load(argv[0]);
  const result = summarise(rows, hasHours);
  if (argv.includes("--json")) return dumps(result) + "\n";
  if (!result.roles.length) return "No roles found (example rows are ignored).\n";
  const p: string[] = [];
  p.push("## Gap totals by role\n");
  let header = "| Role | People | Tasks | Total gap | Largest gap | Tasks with gap 2+ |";
  let sep = "| --- | --- | --- | --- | --- | --- |";
  if (hasHours) {
    header += " Learner-hours |";
    sep += " --- |";
  }
  p.push(header);
  p.push(sep);
  for (const r of result.roles) {
    const people = r.headcount !== null ? String(r.headcount) : "unknown";
    let line = `| ${r.role} | ${people} | ${r.tasks} | ${r.total_gap} | ${r.max_gap} | ${r.tasks_gap_2} |`;
    if (hasHours) line += ` ${fmtHours(r)} |`;
    p.push(line);
  }
  p.push("\n## Tasks with a gap of 2 or more\n");
  if (!result.gaps_2_or_more.length) {
    p.push("None.");
    return p.join("\n") + "\n";
  }
  p.push("| Role | Task | Current | Required | Gap | Method |");
  p.push("| --- | --- | --- | --- | --- | --- |");
  for (const g of result.gaps_2_or_more) {
    p.push(`| ${g.role} | ${g.task} | ${g.current} | ${g.required} | ${g.gap} | ${g.method} |`);
  }
  return p.join("\n") + "\n";
}

run(main);
