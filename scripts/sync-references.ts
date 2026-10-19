#!/usr/bin/env node
/*
Copy the plugin's canonical shared references into each skill.

Usage: node scripts/sync-references.ts [--check]

Agent Skills are self-contained: a SKILL.md links only to files inside its own
folder. The shared conventions, scales and method cheat-sheets are maintained
once in the plugin's root references/ folder; this script copies every
canonical file a skill links to (from SKILL.md or its own references/*.md,
following links between canonical files) into skills/<skill>/references/.
Copies a skill no longer links to are removed. Skill-specific reference files
are never touched.

--check  Report drift without writing; exits 1 if any copy is missing, stale
         or no longer needed.
*/
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), "..");
const CANON_DIR = join(ROOT, "references");
const SKILLS_DIR = join(ROOT, "skills");
const LINK_RE = /\]\(((?:references\/)?[a-z0-9-]+\.md)(?:#[^)]*)?\)/g;

const canonical = new Set(readdirSync(CANON_DIR).filter((f) => f.endsWith(".md")));
const read = (p: string): string => readFileSync(p, "utf8");

function linkedCanon(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(LINK_RE)) {
    const name = m[1].replace(/^references\//, "");
    if (canonical.has(name)) out.push(name);
  }
  return out;
}

function needed(skillDir: string): Set<string> {
  const want = new Set<string>(linkedCanon(read(join(skillDir, "SKILL.md"))));
  const localRefs = join(skillDir, "references");
  if (existsSync(localRefs)) {
    for (const f of readdirSync(localRefs)) {
      if (f.endsWith(".md") && !canonical.has(f)) for (const n of linkedCanon(read(join(localRefs, f)))) want.add(n);
    }
  }
  const queue = [...want];
  while (queue.length) {
    const name = queue.pop() as string;
    for (const n of linkedCanon(read(join(CANON_DIR, name)))) {
      if (!want.has(n)) { want.add(n); queue.push(n); }
    }
  }
  return want;
}

function main(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(read(SELF).split("/*")[1].split("*/")[0].trim());
    return 0;
  }
  const check = argv.includes("--check");
  const problems: string[] = [];
  let copied = 0;
  let removed = 0;
  for (const skill of readdirSync(SKILLS_DIR).sort()) {
    const dir = join(SKILLS_DIR, skill);
    if (!existsSync(join(dir, "SKILL.md"))) continue;
    const want = needed(dir);
    const refDir = join(dir, "references");
    for (const name of want) {
      const src = read(join(CANON_DIR, name));
      const dest = join(refDir, name);
      if (existsSync(dest) && read(dest) === src) continue;
      if (check) problems.push(`skills/${skill}/references/${name} ${existsSync(dest) ? "is stale" : "is missing"}`);
      else { mkdirSync(refDir, { recursive: true }); writeFileSync(dest, src); copied += 1; }
    }
    if (existsSync(refDir)) {
      for (const f of readdirSync(refDir)) {
        if (canonical.has(f) && !want.has(f)) {
          if (check) problems.push(`skills/${skill}/references/${f} is no longer linked`);
          else { rmSync(join(refDir, f)); removed += 1; }
        }
      }
    }
  }
  if (check) {
    if (problems.length) {
      console.log(`Reference drift — run: npm run sync\n${problems.map((p) => `  ✗ ${p}`).join("\n")}`);
      return 1;
    }
    console.log("References in sync.");
    return 0;
  }
  console.log(`Synced references: ${copied} copied, ${removed} removed.`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
