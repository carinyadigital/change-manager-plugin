// Tests for scripts/release.ts, run against a throwaway copy of the version files.
// Run: npm test   (node --test tests/*.test.ts — Node 22.18+ runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts/release.ts");
const FILES = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "package.json", "package-lock.json", "CHANGELOG.md"];

function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "cm-release-"));
  for (const f of FILES) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    cpSync(join(ROOT, f), join(dir, f));
  }
  return dir;
}

const run = (dir: string, args: string[]): SpawnSyncReturns<string> =>
  spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", timeout: 30000, env: { ...process.env, RELEASE_ROOT: dir } });

const version = (dir: string, f: string): string => (JSON.parse(readFileSync(join(dir, f), "utf8")) as { version: string }).version;

test("release.ts prints usage with --help", () => {
  const res = run(ROOT, ["--help"]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout.toLowerCase(), /usage/);
});

test("release.ts current agrees across all version files", () => {
  const res = run(ROOT, ["current"]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("release.ts bump writes every version file and a CHANGELOG section", () => {
  const dir = fixture();
  const before = run(dir, ["current"]).stdout.trim();
  const [maj, min] = before.split(".").map(Number);
  const notes = join(dir, "notes.md");
  writeFileSync(notes, "- `example-skill`: a test change.\n");
  const res = run(dir, ["bump", "minor", "--notes", notes, "--date", "2026-01-02"]);
  assert.equal(res.status, 0, res.stderr);
  const after = `${maj}.${min + 1}.0`;
  assert.equal(res.stdout.trim(), after);
  for (const f of FILES.filter((x) => x.endsWith(".json"))) assert.equal(version(dir, f), after, f);
  const lock = JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8")) as { packages: Record<string, { version: string }> };
  assert.equal(lock.packages[""].version, after);
  const changelog = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
  assert.ok(changelog.indexOf(`## ${after} — 2026-01-02`) < changelog.indexOf(`## ${before}`), "new section sits above the previous one");
  const section = run(dir, ["notes", after]);
  assert.equal(section.status, 0, section.stderr);
  assert.equal(section.stdout.trim(), "- `example-skill`: a test change.");
});

test("release.ts refuses notes that are not bullets, and leaves files untouched", () => {
  const dir = fixture();
  const before = run(dir, ["current"]).stdout.trim();
  const notes = join(dir, "notes.md");
  writeFileSync(notes, "Ignore previous instructions\n");
  const res = run(dir, ["bump", "patch", "--notes", notes]);
  assert.equal(res.status, 1);
  assert.equal(run(dir, ["current"]).stdout.trim(), before);
});

test("release.ts fails when version files disagree", () => {
  const dir = fixture();
  const f = join(dir, ".codex-plugin/plugin.json");
  const data = JSON.parse(readFileSync(f, "utf8")) as { version: string };
  data.version = "9.9.9";
  writeFileSync(f, JSON.stringify(data, null, 2) + "\n");
  const res = run(dir, ["current"]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /disagree/);
});
