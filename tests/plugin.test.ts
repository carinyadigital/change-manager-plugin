// Tests for bundled skill scripts, hooks and the validator.
// Run: npm test   (node --test tests/*.test.ts — Node 22.18+ runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOOKS = join(ROOT, "hooks/scripts");

const SCRIPTS: string[] = readdirSync(join(ROOT, "skills"))
  .flatMap((s) => {
    const dir = join(ROOT, "skills", s, "scripts");
    return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => join(dir, f)) : [];
  });

const run = (args: string[], input?: string): SpawnSyncReturns<string> =>
  spawnSync(process.execPath, args, { input, encoding: "utf8", timeout: 30000 });

function tmpCsv(text: string): string {
  const p = join(mkdtempSync(join(tmpdir(), "cm-")), "data.csv");
  writeFileSync(p, text);
  return p;
}

test("seven bundled scripts exist", () => {
  assert.ok(SCRIPTS.length >= 7, `found ${SCRIPTS.length}`);
});

test("every script prints usage with --help", () => {
  for (const s of SCRIPTS) {
    const res = run([s, "--help"]);
    assert.equal(res.status, 0, `${s}: ${res.stderr}`);
    assert.match(res.stdout.toLowerCase(), /usage/, s);
  }
});

const SCORE = join(ROOT, "skills/change-impact-assessment/scripts/score_impacts.ts");

test("score_impacts applies priority rules", () => {
  const p = tmpCsv("group,headcount,dimension,today,future,score,evidence\n" +
    "Agents,120,process,a,b,3,x\nAgents,120,systems,a,b,3,x\n" +
    "Leaders,14,roles,a,b,4,x\n\"Finance, North\",30,data,a,b,2,x\n");
  const res = run([SCORE, p, "--json"]);
  assert.equal(res.status, 0, res.stderr);
  interface Scored { group: string; priority: string }
  const by: Record<string, Scored> = Object.fromEntries((JSON.parse(res.stdout) as Scored[]).map((g) => [g.group, g]));
  assert.equal(by.Agents.priority, "high");
  assert.equal(by.Leaders.priority, "high");
  assert.equal(by["Finance, North"].priority, "low");
});

test("score_impacts rejects scores outside 0-4", () => {
  const res = run([SCORE, tmpCsv("group,headcount,dimension,score\nA,1,process,7\n")]);
  assert.notEqual(res.status, 0);
});

test("score_impacts ignores example rows", () => {
  const res = run([SCORE, tmpCsv("group,headcount,dimension,score\nExample — A,1,process,3\n")]);
  assert.match(res.stdout, /No groups/);
});

test("score_impacts --portfolio expands active months into portfolio rows", () => {
  const p = tmpCsv("group,headcount,dimension,score,starts,ends\n" +
    "Agents,120,process,3,2026-11,2027-01\nAgents,120,systems,2,2026-12,2027-01\nLeaders,14,roles,2,,\n");
  const res = run([SCORE, p, "--portfolio", "CRM"]);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim(), "initiative,group,month,load\nCRM,Agents,2026-11,3\nCRM,Agents,2026-12,3\nCRM,Agents,2027-01,3");
  assert.match(res.stderr, /Leaders/);
});

test("score_impacts rejects malformed months", () => {
  const res = run([SCORE, tmpCsv("group,headcount,dimension,score,starts,ends\nA,1,process,3,2027-05,2027-02\n")]);
  assert.notEqual(res.status, 0);
});

const GATE = join(ROOT, "skills/readiness-review/scripts/checklist_gate.ts");

test("checklist_gate blocks on a high-impact group that was never assessed", () => {
  const ready = tmpCsv("group,criterion,rag,evidence,critical\nAgents,trained,Green,done,y\n");
  const impact = tmpCsv("group,headcount,dimension,score\nAgents,120,process,3\nFinance,30,roles,4\n");
  const res = run([GATE, ready, impact]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Verdict \(readiness rule only\): NO-GO/);
  assert.match(res.stdout, /Finance: in impact register \(headline 4\) but never assessed/);
});

test("checklist_gate treats a critical criterion missing for one group as Amber", () => {
  const ready = tmpCsv("group,criterion,rag,evidence,critical\n" +
    "Agents,trained,Green,done,y\nAgents,access ready,Green,done,y\nLeaders,trained,Green,done,y\n");
  const impact = tmpCsv("group,headcount,dimension,score\nAgents,120,process,3\nLeaders,14,roles,2\n");
  const res = run([GATE, ready, impact]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /GO WITH CONDITIONS/);
  assert.match(res.stdout, /Leaders: critical criterion 'access ready' not assessed \(treated as Amber\)/);
  assert.match(res.stdout, /\| Leaders \| 2 \| 0 \| 0 \| 1 \| 1 \|/);
});

function hookDecision(script: string, payload: unknown): string {
  const res = run([join(HOOKS, script)], typeof payload === "string" ? payload : JSON.stringify(payload));
  assert.equal(res.status, 0);
  return res.stdout;
}

test("draft guard asks before send-type MCP tools", () => {
  for (const tool of ["mcp__Gmail__send_message", "mcp__Slack__slack_send_message",
    "mcp__Google_Calendar__create_event", "mcp__Gmail__reply", "mcp__x__publish_post",
    // camelCase and PascalCase names
    "mcp__x__sendMail", "mcp__x__postMessage", "mcp__x__chat_postMessage", "mcp__x__replyAll",
    "mcp__x__createEvent", "mcp__x__SendEmail", "mcp__x__send_draft",
    // Microsoft 365 and Teams: anything not a read or a draft asks
    "mcp__claude_ai_Microsoft_365__send_email", "mcp__claude_ai_Microsoft_365__sendMail",
    "mcp__claude_ai_Microsoft_365__teams_send_chat_message", "mcp__claude_ai_Microsoft_365__post_channel_message",
    "mcp__claude_ai_Microsoft_365__reply_to_channel_message", "mcp__claude_ai_Microsoft_365__create_chat",
    "mcp__claude_ai_Microsoft_365__outlook_create_event", "mcp__claude_ai_Microsoft_365__delete_calendar_event",
    "mcp__claude_ai_Microsoft_365__sharepoint_upload_file", "mcp__claude_ai_Microsoft_365__set_automatic_replies",
    "mcp__claude_ai_Microsoft_365__create_inbox_rule", "mcp__claude_ai_Microsoft_365__send_draft",
    // Work IQ (the bundled Microsoft 365 and Teams server): generic write tools ask
    "mcp__microsoft-365__do_action", "mcp__microsoft-365__create_entity",
    "mcp__workiq__update_entity", "mcp__workiq__delete_entity"]) {
    const out = hookDecision("draft_guard.ts", { tool_name: tool, tool_input: { body: "secret" } });
    assert.equal((JSON.parse(out) as { hookSpecificOutput: { permissionDecision: string } }).hookSpecificOutput.permissionDecision, "ask", tool);
    assert.ok(!out.includes("secret"));
  }
});

test("draft guard lets drafts and reads through", () => {
  for (const tool of ["mcp__Gmail__create_draft", "mcp__Slack__slack_send_message_draft",
    "mcp__Linear__list_issues", "Write", "mcp__Gmail__search_threads",
    // Microsoft 365 reads and drafts
    "mcp__claude_ai_Microsoft_365__outlook_email_search", "mcp__claude_ai_Microsoft_365__chat_message_search",
    "mcp__claude_ai_Microsoft_365__find_meeting_availability", "mcp__claude_ai_Microsoft_365__read_resource",
    "mcp__claude_ai_Microsoft_365__sharepoint_search", "mcp__claude_ai_Microsoft_365__outlook_calendar_search",
    "mcp__claude_ai_Microsoft_365__create_draft", "mcp__claude_ai_Microsoft_365__updateDraft",
    "mcp__microsoft-365__fetch", "mcp__microsoft-365__fetch_blob", "mcp__microsoft-365__ask",
    "mcp__microsoft-365__retrieve", "mcp__microsoft-365__list_agents",
    "mcp__workiq__get_schema", "mcp__workiq__search_paths"]) {
    assert.equal(hookDecision("draft_guard.ts", { tool_name: tool }), "", tool);
  }
  assert.equal(hookDecision("draft_guard.ts", "not json"), "");
});

test("people-data guard flags contact details in the change record", () => {
  const out = hookDecision("people_data_guard.ts", { tool_name: "Write",
    tool_input: { file_path: "/w/docs/change/stakeholder-register.md", content: "Jane: jane@acme.com, 0412 345 678." } });
  assert.match(out, /"ask"/);
  assert.match(out, /1 email address\(es\), 1 phone number\(s\)/);
  assert.ok(!out.includes("jane@acme.com"));
});

test("people-data guard ignores dates, counts and files outside the record", () => {
  assert.equal(hookDecision("people_data_guard.ts", { tool_input: { file_path: "/w/docs/change/scope.md",
    content: "Updated 2026-10-19. 120 people. $1,500,000." } }), "");
  // Date-times, ISO weeks, year-months and shift times appear in go-live
  // plans, hypercare check-ins and weekly status; none is a phone number.
  for (const text of ["Go-live 2026-11-02 08:00 cutover", "Week 42 2026-10-19 report", "2026-10-19 to 2026-11-02",
    "status/2026-W42.md written 2026-10-19T09:30", "active 2026-11 to 2027-01", "08:00 - 17:00 shifts"]) {
    assert.equal(hookDecision("people_data_guard.ts", { tool_input: { file_path: "/w/docs/change/golive-plan.md", content: text } }), "", text);
  }
  for (const text of ["call 0412 345 678", "(02) 9999 9999", "+61 2 9999 9999"]) {
    assert.match(hookDecision("people_data_guard.ts", { tool_input: { file_path: "/w/docs/change/golive-plan.md", content: text } }), /1 phone number/, text);
  }
  assert.equal(hookDecision("people_data_guard.ts", { tool_input: { file_path: "/w/notes.md", content: "jane@acme.com" } }), "");
});

test("profile guard asks before writing the practice profile", () => {
  const out = hookDecision("profile_guard.ts", { tool_name: "Write",
    tool_input: { file_path: join(homedir(), "change-practice/CLAUDE.md"), content: "x" } });
  assert.match(out, /"ask"/);
  assert.equal(hookDecision("profile_guard.ts", { tool_name: "Write",
    tool_input: { file_path: "/w/docs/change/scope.md", content: "x" } }), "");
  assert.equal(hookDecision("profile_guard.ts", { tool_name: "Write",
    tool_input: { file_path: "/w/skills/change-practice/notes.md", content: "x" } }), "");
});

test("repository passes the structural validator", () => {
  const res = run([join(ROOT, "scripts/validate.ts")]);
  assert.equal(res.status, 0, res.stdout);
});
