#!/usr/bin/env node
/*
Structural validation for the change-practice plugin.

Usage: node scripts/validate.ts [--warn-only]

Checks:
  1. All JSON files parse
  2. Plugin manifests (Claude <-> Codex identity, Codex listing fields, root files,
     Claude marketplace catalogue pointing at this repo)
  3. .mcp.json shape
  4. hooks/hooks.json shape; referenced scripts exist
  5. SKILL.md frontmatter, budgets, metadata enums, required headings,
     ${CLAUDE_PLUGIN_ROOT} references resolve, scripts declare a Bash grant
     for that script only (never Bash(node:*))
  6. Persona agents (agents/*.md) frontmatter contracts
  7. Agent Skills self-containment: SKILL.md and skill files link only inside
     their own skill folder; synced shared references match the canonical
     copies in references/; no deprecated commands/ directory
  8. Artefact templates (skills/<skill>/assets/<name>.template.md) carry the front block
  9. Markdown relative links resolve
 10. evals/evals.json and evals/trigger-queries.json schema
 11. Coverage: every skill appears in CONNECTORS.md, the skills-index routing
     table, README.md, and is owned by exactly one persona agent
 12. TypeScript-only: no Python or plain JavaScript ships in the plugin

Node 22.18+ (runs TypeScript directly), standard library only.
Exits 0 on success, 1 on any failure.
*/
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Scalar = string | number | boolean;
type YamlValue = Scalar | Scalar[] | Record<string, Scalar>;
type Frontmatter = Record<string, YamlValue>;

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), "..");
const PLUGIN_NAME = "change-practice";
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX = 64;
const DESC_MAX = 1024;
const BODY_MAX_LINES = 500;
const WORK_SHAPES = new Set(["implement-and-ship", "review-and-gate", "generate-draft", "orchestrate-delivery", "monitor-and-report"]);
const OUTPUT_CLASSES = new Set(["draft-for-review", "decision-support", "structured-data", "tracking-update", "applied-change"]);
const META_FIELDS = ["version", "owner", "review_cadence", "work_shape", "output_class"] as const;
const HEADINGS = ["## When to use", "## What this skill does not do", "## Preconditions", "## Trust spine", "## Workflow", "## Outputs"] as const;
const MODEL_TIERS = new Set(["fast", "standard"]);
const SKIP_DIRS = new Set([".git", "node_modules"]);

const failures: string[] = [];
let passes = 0;
const fail = (msg: string): void => { failures.push(msg); };
const ok = (): void => { passes += 1; };
const rel = (p: string): string => relative(ROOT, p);
const read = (p: string): string => readFileSync(p, "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const FILES: string[] = walk(ROOT);
const matching = (re: RegExp): string[] => FILES.filter((f) => re.test(rel(f))).sort();
const skillFiles = (): string[] => matching(/^skills\/[^/]+\/SKILL\.md$/);
const skillNames = (): string[] => skillFiles().map((f) => basename(dirname(f)));

// ---------------------------------------------------------------- frontmatter
function splitFrontmatter(text: string): [string, string] | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return [text.slice(4, end), text.slice(end + 4).replace(/^\n+/, "")];
}

function scalar(raw: string): Scalar {
  const v = raw.trim();
  if ((v.startsWith("'") || v.startsWith('"')) && v.endsWith(v[0]) && v.length >= 2) return v.slice(1, -1);
  if (v === "true" || v === "false") return v === "true";
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function inlineList(raw: string): Scalar[] | null {
  const v = raw.trim();
  if (!(v.startsWith("[") && v.endsWith("]"))) return null;
  return v.slice(1, -1).split(",").filter((x) => x.trim()).map(scalar);
}

/** Enough YAML for this repo's frontmatter: scalars, folded/literal blocks, lists, one nested map. */
export function parseYaml(src: string): Frontmatter {
  const out: Frontmatter = {};
  const lines = src.split("\n");
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    i += 1;
    if (!m) continue;
    const key = m[1];
    const val = m[2];
    const block: string[] = [];
    while (i < lines.length && (lines[i].startsWith(" ") || !lines[i].trim())) block.push(lines[i++]);
    const items = block.filter((b) => b.trim());
    if ([">", "|", ">-", "|-"].includes(val)) {
      out[key] = items.map((b) => b.trim()).join(" ");
    } else if (val === "" && items.length && items[0].trim().startsWith("- ")) {
      out[key] = items.filter((b) => b.trim().startsWith("- ")).map((b) => scalar(b.trim().slice(2)));
    } else if (val === "" && items.length) {
      const map: Record<string, Scalar> = {};
      for (const b of items) {
        const mm = b.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
        if (mm) map[mm[1]] = scalar(mm[2]);
      }
      out[key] = map;
    } else {
      out[key] = inlineList(val) ?? scalar(val);
    }
  }
  return out;
}

const asList = (v: YamlValue | undefined): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.replaceAll(",", " ").split(/\s+/).filter(Boolean);
  return [];
};

/** Bash grants, kept intact so a rule with spaces is one entry. */
function bashRules(raw: string): string[] {
  return [...raw.matchAll(/Bash\([^)]*\)/g)].map((m) => m[0]);
}

/** `Bash(node:*)`, `Bash(node *)`, and `Bash(node*)` pre-approve every node command. */
const BROAD_NODE = /^Bash\(node(?::\*|\*|\s+\*)\)$/;
const asMap = (v: YamlValue | undefined): Record<string, Scalar> =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};

function loadJson(p: string): unknown {
  try {
    return JSON.parse(read(p)) as unknown;
  } catch (e) {
    fail(`${rel(p)}: invalid JSON (${e instanceof Error ? e.message : String(e)})`);
    return undefined;
  }
}

function frontmatterOf(p: string): [Frontmatter, string] | null {
  const parts = splitFrontmatter(read(p));
  if (!parts) {
    fail(`${rel(p)}: missing frontmatter`);
    return null;
  }
  return [parseYaml(parts[0]), parts[1]];
}

function pluginRefs(text: string): string[] {
  return [...text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"')]+)/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------- checks
function checkJsonFiles(): void {
  for (const p of FILES.filter((f) => f.endsWith(".json"))) if (loadJson(p) !== undefined) ok();
}

function authorName(manifest: Record<string, unknown>): string {
  const author = manifest.author;
  if (!author || typeof author !== "object" || Array.isArray(author)) return "";
  const name = (author as Record<string, unknown>).name;
  return typeof name === "string" ? name : "";
}

/** Codex compatibility paths are plugin-root relative and must exist. */
function codexPath(value: unknown, label: string): void {
  if (typeof value !== "string" || !value.startsWith("./") || value.includes("..")) {
    fail(`.codex-plugin/plugin.json ${label} must be a ./ path inside the plugin`);
    return;
  }
  if (!existsSync(join(ROOT, value.slice(2)))) fail(`.codex-plugin/plugin.json ${label} missing: ${value}`);
}

function checkManifest(): void {
  if (existsSync(join(ROOT, ".cursor-plugin"))) fail(".cursor-plugin is retired; use .codex-plugin/plugin.json");
  const claudePath = join(ROOT, ".claude-plugin/plugin.json");
  const codexFile = join(ROOT, ".codex-plugin/plugin.json");
  if (!existsSync(claudePath)) return fail(".claude-plugin/plugin.json missing");
  const a = loadJson(claudePath) as Record<string, unknown> | undefined;
  if (!a) return;
  if (!existsSync(codexFile)) fail(".codex-plugin/plugin.json missing");
  const b = existsSync(codexFile) ? loadJson(codexFile) as Record<string, unknown> | undefined : undefined;
  for (const field of ["name", "version", "description", "author", "license"]) if (!a[field]) fail(`.claude-plugin/plugin.json missing ${field}`);
  if (a.name !== PLUGIN_NAME) fail(`plugin name must be '${PLUGIN_NAME}'`);
  if (b) {
    if ("$schema" in b) fail(".codex-plugin/plugin.json omits $schema; that field belongs on a portable root plugin.json");
    for (const field of ["name", "version", "description", "license", "skills", "keywords"]) {
      if (JSON.stringify(a[field]) !== JSON.stringify(b[field])) fail(`plugin.json ${field} differs between .claude-plugin and .codex-plugin`);
    }
    if (authorName(a) !== authorName(b)) fail("plugin.json author.name differs between .claude-plugin and .codex-plugin");
    const face = b.interface;
    const iface = face && typeof face === "object" && !Array.isArray(face) ? face as Record<string, unknown> : undefined;
    if (!iface) fail(".codex-plugin/plugin.json missing interface");
    else {
      const limit = (key: string, max: number): void => {
        const value = iface[key];
        if (typeof value !== "string" || !value.trim()) fail(`.codex-plugin/plugin.json interface.${key} missing`);
        else if (value.length > max) fail(`.codex-plugin/plugin.json interface.${key} is ${value.length} chars (max ${max})`);
      };
      limit("displayName", 30);
      limit("shortDescription", 30);
      limit("longDescription", 4000);
      limit("developerName", 80);
      if (iface.displayName !== a.displayName) fail("interface.displayName must match .claude-plugin displayName");
      if (iface.developerName !== authorName(b)) fail("interface.developerName must match author.name");
      if (typeof iface.category !== "string" || !iface.category.trim()) fail(".codex-plugin/plugin.json interface.category missing");
      const caps = iface.capabilities;
      if (!Array.isArray(caps) || caps.length < 1 || caps.length > 20) fail(".codex-plugin/plugin.json interface.capabilities must list 1–20 labels");
      else for (const cap of caps) if (typeof cap !== "string" || !cap.trim() || cap.length > 120) fail(".codex-plugin/plugin.json capability labels must be 1–120 characters");
      const prompts = iface.defaultPrompt;
      if (!Array.isArray(prompts) || prompts.length < 1 || prompts.length > 3) fail(".codex-plugin/plugin.json interface.defaultPrompt must list 1–3 prompts");
      else for (const prompt of prompts) {
        if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 128) fail(".codex-plugin/plugin.json default prompts must be 1–128 characters");
        else if (prompt.includes("@")) fail(".codex-plugin/plugin.json default prompts omit @mentions");
      }
      for (const key of ["composerIcon", "logo"]) codexPath(iface[key], `interface.${key}`);
    }
    if (b.mcpServers !== "./.mcp.json") fail('.codex-plugin/plugin.json mcpServers must be "./.mcp.json"');
    if (b.hooks !== "./hooks/hooks.json") fail('.codex-plugin/plugin.json hooks must be "./hooks/hooks.json"');
    codexPath(b.skills, "skills");
    codexPath(b.mcpServers, "mcpServers");
    codexPath(b.hooks, "hooks");
    const ext = b.extensions;
    const openai = ext && typeof ext === "object" && !Array.isArray(ext) ? (ext as Record<string, unknown>)["com.openai"] : undefined;
    const onboarding = openai && typeof openai === "object" && !Array.isArray(openai) ? (openai as Record<string, unknown>).onboardingSkill : undefined;
    if (onboarding !== "./skills/setup/SKILL.md") fail('.codex-plugin/plugin.json onboarding skill must be "./skills/setup/SKILL.md"');
    codexPath(onboarding, "onboardingSkill");
  }
  for (const f of ["README.md", "CONNECTORS.md", "CLAUDE.md", ".mcp.json", "LICENSE"]) if (!existsSync(join(ROOT, f))) fail(`missing ${f}`);
  if (existsSync(join(ROOT, ".codex-plugin/marketplace.json"))) fail("ChatGPT has no marketplace catalogue; .codex-plugin/marketplace.json should not exist");
  checkClaudeMarketplace(a);
  const pkg = existsSync(join(ROOT, "package.json")) ? (loadJson(join(ROOT, "package.json")) as Record<string, unknown> | undefined) : undefined;
  if (pkg && pkg.version !== a.version) fail("package.json version differs from plugin.json");
  ok();
}

/** This repo is the plugin. Claude still needs a marketplace catalogue to add the repository. */
function checkClaudeMarketplace(plugin: Record<string, unknown>): void {
  const path = ".claude-plugin/marketplace.json";
  const file = join(ROOT, path);
  if (!existsSync(file)) return fail(`${path} missing`);
  const data = loadJson(file) as Record<string, unknown> | undefined;
  if (!data) return;
  if (data.name !== PLUGIN_NAME) fail(`${path} name must be '${PLUGIN_NAME}'`);
  const owner = data.owner;
  const ownerName = owner && typeof owner === "object" && !Array.isArray(owner) ? (owner as Record<string, unknown>).name : "";
  if (ownerName !== authorName(plugin)) fail(`${path} owner.name must match plugin author.name`);
  const plugins = data.plugins;
  if (!Array.isArray(plugins) || plugins.length !== 1) return fail(`${path} must list exactly one plugin`);
  const entry = plugins[0] as Record<string, unknown>;
  if (entry.name !== plugin.name) fail(`${path} plugin name must match plugin.json`);
  if (entry.source !== "./") fail(`${path} plugin source must be "./" — this repository is the plugin`);
  if (entry.description !== plugin.description) fail(`${path} description differs from plugin.json`);
  if (authorName(entry) !== authorName(plugin)) fail(`${path} plugin author.name differs from plugin.json`);
  if (entry.license !== plugin.license) fail(`${path} license differs from plugin.json`);
  if (entry.repository !== plugin.repository) fail(`${path} repository differs from plugin.json`);
  if (JSON.stringify(entry.keywords) !== JSON.stringify(plugin.keywords)) fail(`${path} keywords differ from plugin.json`);
  if (entry.version !== undefined && entry.version !== plugin.version) fail(`${path} version differs from plugin.json`);
  if (typeof entry.category !== "string" || !entry.category.trim()) fail(`${path} plugin category missing`);
}

function checkMcp(): void {
  const p = join(ROOT, ".mcp.json");
  if (!existsSync(p)) return;
  const data = loadJson(p) as { mcpServers?: Record<string, { type?: string; url?: string; command?: string }> } | undefined;
  if (!data) return;
  if (!data.mcpServers || typeof data.mcpServers !== "object") return fail(".mcp.json: mcpServers must be an object");
  for (const [name, server] of Object.entries(data.mcpServers)) {
    if (!server.url && !server.command) fail(`.mcp.json: server '${name}' needs url or command`);
    if (server.url && !/^https:\/\//.test(server.url)) fail(`.mcp.json: server '${name}' url must be https`);
  }
  ok();
}

function checkHooks(): void {
  const hj = join(ROOT, "hooks/hooks.json");
  if (!existsSync(hj)) return;
  const data = loadJson(hj) as { hooks?: Record<string, Array<{ hooks?: Array<{ command?: string }> }>> } | undefined;
  if (!data) return;
  if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) return fail("hooks/hooks.json: 'hooks' must be an object");
  for (const [event, groups] of Object.entries(data.hooks)) {
    for (const g of groups) for (const h of g.hooks ?? []) {
      for (const ref of pluginRefs(h.command ?? "")) {
        if (!existsSync(join(ROOT, ref))) fail(`hooks/hooks.json: ${event} references missing ${ref}`);
      }
    }
  }
  ok();
}

function checkSkills(): void {
  for (const sk of skillFiles()) {
    const r = rel(sk);
    const dir = dirname(sk);
    const parsed = frontmatterOf(sk);
    if (!parsed) continue;
    const [fm, body] = parsed;
    const name = String(fm.name ?? "");
    if (name !== basename(dir)) fail(`${r}: name '${name}' must match folder '${basename(dir)}'`);
    if (!NAME_RE.test(name) || name.length > NAME_MAX) fail(`${r}: invalid name '${name}'`);
    const desc = String(fm.description ?? "").trim();
    if (!desc) fail(`${r}: missing description`);
    else if (desc.length > DESC_MAX) fail(`${r}: description ${desc.length} chars (max ${DESC_MAX})`);
    const tools = asList(fm["allowed-tools"]);
    if (!tools.length) fail(`${r}: missing allowed-tools`);
    if (tools.some((t) => t.trim() === "Bash")) fail(`${r}: unscoped Bash in allowed-tools`);
    const meta = asMap(fm.metadata);
    for (const f of META_FIELDS) if (!meta[f]) fail(`${r}: missing metadata.${f}`);
    if (meta.work_shape && !WORK_SHAPES.has(String(meta.work_shape))) fail(`${r}: invalid work_shape '${meta.work_shape}'`);
    if (meta.output_class && !OUTPUT_CLASSES.has(String(meta.output_class))) fail(`${r}: invalid output_class '${meta.output_class}'`);
    for (const [k, v] of Object.entries(meta)) if (typeof v !== "string") fail(`${r}: metadata.${k} must be a string (Agent Skills spec)`);
    if (typeof fm["allowed-tools"] !== "string") fail(`${r}: allowed-tools must be a space-separated string (Agent Skills spec)`);
    if (meta.owner && meta.owner !== PLUGIN_NAME) fail(`${r}: metadata.owner must be '${PLUGIN_NAME}'`);
    const heads = (body.match(/^## .+$/gm) ?? []).map((h) => h.trim());
    for (const h of HEADINGS) if (!heads.includes(h)) fail(`${r}: missing heading '${h}'`);
    if (body.split("\n").length > BODY_MAX_LINES) fail(`${r}: body over ${BODY_MAX_LINES} lines`);
    const rawTools = String(fm["allowed-tools"] ?? "");
    for (const rule of bashRules(rawTools)) {
      if (BROAD_NODE.test(rule)) fail(`${r}: ${rule} pre-approves any node command; name the script`);
    }
    if (existsSync(join(dir, "scripts"))) {
      for (const file of readdirSync(join(dir, "scripts")).filter((f) => f.endsWith(".ts"))) {
        const pluginRule = `Bash(node \${CLAUDE_PLUGIN_ROOT}/skills/${name}/scripts/${file} *)`;
        const skillRule = `Bash(node \${CLAUDE_SKILL_DIR}/scripts/${file} *)`;
        if (!rawTools.includes(pluginRule) && !rawTools.includes(skillRule)) {
          fail(`${r}: scripts/${file} needs allowed-tools ${pluginRule}`);
        }
      }
    }
    for (const ref of pluginRefs(body)) if (!existsSync(join(ROOT, ref))) fail(`${r}: references missing ${ref}`);
    if (/python3?\s|\.py\b|\.mjs\b/i.test(body)) fail(`${r}: mentions Python or .mjs — scripts are TypeScript`);
    ok();
  }
}

function checkAgents(): void {
  const skills = new Set(skillNames());
  const owners = new Map<string, string[]>();
  for (const ag of matching(/^agents\/[^/]+\.md$/)) {
    const r = rel(ag);
    const parsed = frontmatterOf(ag);
    if (!parsed) continue;
    const [fm, body] = parsed;
    if (fm.name !== basename(ag, ".md")) fail(`${r}: name must match filename`);
    if (!fm.description) fail(`${r}: missing description`);
    if (fm.model !== "inherit") fail(`${r}: model must be 'inherit'`);
    const tools = asList(fm.tools);
    if (!tools.length) fail(`${r}: tools list empty`);
    if (tools.some((t) => t.trim() === "Bash")) fail(`${r}: unscoped Bash`);
    const meta = asMap(fm.metadata);
    if (!MODEL_TIERS.has(String(meta.model_tier))) fail(`${r}: metadata.model_tier must be fast|standard`);
    if (!Number.isInteger(meta.budget) || Number(meta.budget) < 1) fail(`${r}: metadata.budget must be a positive integer`);
    const owned = asList(fm.skills);
    if (!owned.length) fail(`${r}: persona agent must list the skills it owns in 'skills'`);
    for (const s of owned) {
      if (!skills.has(s)) fail(`${r}: lists unknown skill '${s}'`);
      owners.set(s, [...(owners.get(s) ?? []), basename(ag, ".md")]);
    }
    if (!body.includes("## Scope")) fail(`${r}: missing '## Scope' section (least-privilege tool scope)`);
    ok();
  }
  for (const s of skills) {
    if (s === "setup" || s === "skills-index") continue;
    const o = owners.get(s) ?? [];
    if (o.length !== 1) fail(`skill ${s} must be owned by exactly one persona agent (found ${o.length ? o.join(", ") : "none"})`);
  }
}

function checkSelfContained(): void {
  if (existsSync(join(ROOT, "commands"))) fail("commands/ is deprecated — use skills/ instead");
  const canonDir = join(ROOT, "references");
  for (const f of FILES.filter((p) => /^skills\/[^/]+\/.+\.md$/.test(rel(p)))) {
    const text = read(f).replace(/```[\s\S]*?```/g, "");
    const skillDir = join(ROOT, "skills", rel(f).split("/")[1]);
    for (const m of text.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = m[1].split("#")[0];
      if (!target || /^[a-z]+:/.test(m[1])) continue;
      const abs = resolve(dirname(f), target);
      if (!abs.startsWith(skillDir + "/")) fail(`${rel(f)}: links outside its skill folder (${m[1]}) — sync a copy into references/`);
    }
  }
  for (const copy of matching(/^skills\/[^/]+\/references\/[^/]+\.md$/)) {
    const canon = join(canonDir, basename(copy));
    if (existsSync(canon) && read(canon) !== read(copy)) fail(`${rel(copy)}: differs from references/${basename(copy)} — run npm run sync`);
  }
  ok();
}

function checkTemplates(): void {
  for (const t of matching(/^skills\/[^/]+\/assets\/[^/]+\.template\.md$/)) {
    const parsed = frontmatterOf(t);
    if (!parsed) continue;
    const [fm] = parsed;
    for (const f of ["artefact", "initiative", "phase", "status", "owner", "last_updated"]) if (!(f in fm)) fail(`${rel(t)}: front block missing '${f}'`);
    ok();
  }
}

function checkLinks(): void {
  for (const md of FILES.filter((f) => f.endsWith(".md"))) {
    const text = read(md).replace(/```[\s\S]*?```/g, "");
    for (const m of text.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (/^[a-z]+:/.test(target) || target.startsWith("#")) continue;
      const path = target.split("#")[0];
      if (path && !existsSync(resolve(dirname(md), path))) fail(`${rel(md)}: broken link ${target}`);
    }
    ok();
  }
}

interface TriggerQuery { query?: unknown; should_trigger?: unknown }
interface EvalCase { id?: unknown; prompt?: unknown; expected_output?: unknown; assertions?: unknown }

function checkEvals(): void {
  for (const sk of skillFiles()) {
    const dir = dirname(sk);
    const name = basename(dir);
    const tq = join(dir, "evals/trigger-queries.json");
    if (name !== "setup" && !existsSync(tq)) fail(`${rel(dir)}: missing evals/trigger-queries.json`);
    if (existsSync(tq)) {
      const data = loadJson(tq);
      if (!Array.isArray(data) || !data.length) fail(`${rel(tq)}: must be a non-empty list`);
      else {
        const qs = data as TriggerQuery[];
        const pos = qs.filter((q) => q.should_trigger === true).length;
        const neg = qs.filter((q) => q.should_trigger === false).length;
        if (qs.some((q) => typeof q.query !== "string" || typeof q.should_trigger !== "boolean")) fail(`${rel(tq)}: entries need query (string) and should_trigger (boolean)`);
        if (qs.length < 10 || qs.length > 20) fail(`${rel(tq)}: design calls for 10-20 trigger queries (found ${qs.length})`);
        if (pos < 5 || neg < 5) fail(`${rel(tq)}: want at least 5 positive and 5 negative queries (${pos}/${neg})`);
      }
    }
    const ej = join(dir, "evals/evals.json");
    if (existsSync(ej)) {
      const data = loadJson(ej) as { skill_name?: unknown; evals?: EvalCase[] } | undefined;
      if (!data || data.skill_name !== name) fail(`${rel(ej)}: skill_name must be '${name}'`);
      else for (const c of data.evals ?? []) {
        for (const f of ["id", "prompt", "expected_output", "assertions"] as const) if (!(f in c)) fail(`${rel(ej)}: eval ${String(c.id)} missing ${f}`);
      }
    }
    ok();
  }
}

function checkCoverage(): void {
  const conn = existsSync(join(ROOT, "CONNECTORS.md")) ? read(join(ROOT, "CONNECTORS.md")) : "";
  const idxPath = join(ROOT, "skills/skills-index/SKILL.md");
  const idx = existsSync(idxPath) ? read(idxPath) : "";
  const readme = existsSync(join(ROOT, "README.md")) ? read(join(ROOT, "README.md")) : "";
  for (const s of skillNames()) {
    if (!conn.includes(`**${s}**`)) fail(`CONNECTORS.md: skill ${s} missing from 'Used by skill'`);
    if (s !== "skills-index" && !idx.includes(`\`${s}\``)) fail(`skills-index: skill ${s} missing from routing table`);
    if (!readme.includes(`\`${s}\``) && !readme.includes(`**${s}**`)) fail(`README.md: skill ${s} not documented`);
  }
  ok();
}

function checkLanguage(): void {
  for (const f of FILES.filter((p) => /\.(py|js|mjs|cjs)$/.test(p))) fail(`${rel(f)}: scripts must be TypeScript (.ts)`);
  ok();
}

function main(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(read(SELF).split("/*")[1].split("*/")[0].trim());
    return 0;
  }
  const checks: Array<() => void> = [checkJsonFiles, checkManifest, checkMcp, checkHooks, checkSkills, checkAgents,
    checkSelfContained, checkTemplates, checkLinks, checkEvals, checkCoverage, checkLanguage];
  for (const check of checks) check();
  if (failures.length) {
    console.log(`FAIL — ${failures.length} problem(s), ${passes} checks passed\n`);
    for (const f of failures) console.log(`  ✗ ${f}`);
    return argv.includes("--warn-only") ? 0 : 1;
  }
  console.log(`PASS — ${passes} checks passed`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
