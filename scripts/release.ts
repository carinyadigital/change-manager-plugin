#!/usr/bin/env node
/*
Version and changelog tooling for a change-practice release.

Usage:
  node scripts/release.ts current
      Print the current version. Fails if the version files disagree.
  node scripts/release.ts bump <patch|minor|major> --notes <file> [--date YYYY-MM-DD]
      Write the next version to every version file and add a CHANGELOG
      section from the notes file (Markdown bullets). Prints the new version.
  node scripts/release.ts notes <version>
      Print the CHANGELOG section for <version> (the GitHub release body).

Version files: .claude-plugin/plugin.json, .codex-plugin/plugin.json,
package.json and package-lock.json. They must stay in step.

Used by .github/workflows/release.yml and runnable locally.
Node 22.18+ (runs TypeScript directly), standard library only.
*/
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(process.env.RELEASE_ROOT ?? join(dirname(SELF), ".."));
const MANIFESTS = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "package.json"];
const LOCK = "package-lock.json";
const CHANGELOG = "CHANGELOG.md";
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const BUMPS = ["patch", "minor", "major"] as const;
type Bump = (typeof BUMPS)[number];
type Json = Record<string, unknown>;

class ReleaseError extends Error {}

const path = (f: string): string => join(ROOT, f);

function readJson(file: string): { data: Json; text: string } {
  const text = readFileSync(path(file), "utf8");
  const data = JSON.parse(text) as Json;
  // Rewriting must not reformat the file. npm and our manifests use 2-space JSON.
  if (JSON.stringify(data, null, 2) + "\n" !== text) {
    throw new ReleaseError(`${file}: not in 2-space JSON format with a trailing newline; reformat it before releasing`);
  }
  return { data, text };
}

const writeJson = (file: string, data: Json): void => writeFileSync(path(file), JSON.stringify(data, null, 2) + "\n");

function versionFiles(): string[] {
  return [...MANIFESTS, LOCK].filter((f) => existsSync(path(f)));
}

export function currentVersion(): string {
  const seen = new Map<string, string>();
  for (const f of versionFiles()) {
    const { data } = readJson(f);
    seen.set(f, String(data.version));
    if (f === LOCK) {
      const root = (data.packages as Record<string, Json> | undefined)?.[""];
      if (root) seen.set(`${f} (packages[""])`, String(root.version));
    }
  }
  const versions = new Set(seen.values());
  if (versions.size !== 1) {
    const detail = [...seen].map(([f, v]) => `${f}=${v}`).join(", ");
    throw new ReleaseError(`version files disagree: ${detail}`);
  }
  const [version] = versions;
  if (!SEMVER.test(version)) throw new ReleaseError(`version "${version}" is not MAJOR.MINOR.PATCH`);
  return version;
}

export function nextVersion(version: string, bump: Bump): string {
  const m = SEMVER.exec(version);
  if (!m) throw new ReleaseError(`version "${version}" is not MAJOR.MINOR.PATCH`);
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const sectionHeading = (version: string): RegExp =>
  new RegExp(`^## ${version.replace(/\./g, "\\.")}(\\s|$)`, "m");

export function changelogSection(version: string): string {
  const text = readFileSync(path(CHANGELOG), "utf8");
  const start = text.search(sectionHeading(version));
  if (start === -1) throw new ReleaseError(`${CHANGELOG}: no "## ${version}" section`);
  const afterHeading = text.indexOf("\n", start) + 1;
  const next = text.slice(afterHeading).search(/^## /m);
  const body = next === -1 ? text.slice(afterHeading) : text.slice(afterHeading, afterHeading + next);
  return body.trim();
}

function addChangelogSection(version: string, notes: string, date: string): void {
  const text = readFileSync(path(CHANGELOG), "utf8");
  if (sectionHeading(version).test(text)) throw new ReleaseError(`${CHANGELOG}: "## ${version}" already exists`);
  const lines = notes.trim().split("\n");
  if (!lines.length || !lines[0].startsWith("- ")) throw new ReleaseError("notes must be Markdown bullets starting with \"- \"");
  const first = text.search(/^## /m);
  const section = `## ${version} — ${date}\n\n${lines.join("\n")}\n\n`;
  const updated = first === -1 ? `${text.trimEnd()}\n\n${section}` : text.slice(0, first) + section + text.slice(first);
  writeFileSync(path(CHANGELOG), updated);
}

export function bump(kind: Bump, notes: string, date: string): string {
  const version = nextVersion(currentVersion(), kind);
  addChangelogSection(version, notes, date);
  for (const f of versionFiles()) {
    const { data } = readJson(f);
    data.version = version;
    if (f === LOCK) {
      const root = (data.packages as Record<string, Json> | undefined)?.[""];
      if (root) root.version = version;
    }
    writeJson(f, data);
  }
  return version;
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

function main(argv: string[]): number {
  const [cmd, arg] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(readFileSync(SELF, "utf8").split("/*")[1].split("*/")[0].trim());
    return cmd ? 0 : 2;
  }
  try {
    if (cmd === "current") {
      console.log(currentVersion());
    } else if (cmd === "notes") {
      if (!arg) throw new ReleaseError("usage: notes <version>");
      console.log(changelogSection(arg));
    } else if (cmd === "bump") {
      if (!BUMPS.includes(arg as Bump)) throw new ReleaseError("usage: bump <patch|minor|major> --notes <file>");
      const notesFile = flag(argv, "--notes");
      if (!notesFile) throw new ReleaseError("--notes <file> is required");
      const date = flag(argv, "--date") ?? new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ReleaseError("--date must be YYYY-MM-DD");
      console.log(bump(arg as Bump, readFileSync(notesFile, "utf8"), date));
    } else {
      throw new ReleaseError(`unknown command "${cmd}" — try --help`);
    }
    return 0;
  } catch (e) {
    console.error(`release: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) process.exitCode = main(process.argv.slice(2));
