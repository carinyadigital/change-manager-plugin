"""Tests for bundled skill scripts and hooks. Run: python3 -m unittest discover tests"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "change-management"
SCRIPTS = sorted(PLUGIN.glob("skills/*/scripts/*.py"))
HOOKS = PLUGIN / "hooks" / "scripts"


def run(args: list[str], stdin: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, *args], input=stdin, capture_output=True, text=True, timeout=30)


class TestScriptsHelp(unittest.TestCase):
    def test_scripts_exist(self):
        self.assertGreaterEqual(len(SCRIPTS), 7)

    def test_every_script_has_help(self):
        for script in SCRIPTS:
            with self.subTest(script=script.name):
                res = run([str(script), "--help"])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertIn("usage", res.stdout.lower())


class TestScoreImpacts(unittest.TestCase):
    SCRIPT = PLUGIN / "skills/impact-assessment/scripts/score_impacts.py"

    def _run(self, csv_text: str, *extra: str) -> subprocess.CompletedProcess:
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as fh:
            fh.write(csv_text)
        return run([str(self.SCRIPT), fh.name, *extra])

    def test_priority_rules(self):
        res = self._run(
            "group,headcount,dimension,today,future,score,evidence\n"
            "Agents,120,process,a,b,3,x\nAgents,120,systems,a,b,3,x\n"
            "Leaders,14,roles,a,b,4,x\nFinance,30,data,a,b,2,x\n",
            "--json",
        )
        self.assertEqual(res.returncode, 0, res.stderr)
        by = {g["group"]: g for g in json.loads(res.stdout)}
        self.assertEqual(by["Agents"]["priority"], "high")
        self.assertEqual(by["Leaders"]["priority"], "high")
        self.assertEqual(by["Finance"]["priority"], "low")

    def test_rejects_bad_score(self):
        res = self._run("group,headcount,dimension,score\nA,1,process,7\n")
        self.assertNotEqual(res.returncode, 0)

    def test_example_rows_ignored(self):
        res = self._run("group,headcount,dimension,score\nExample — A,1,process,3\n")
        self.assertIn("No groups", res.stdout)


class TestDraftGuard(unittest.TestCase):
    SCRIPT = HOOKS / "draft_guard.py"

    def decision(self, tool: str) -> str | None:
        res = run([str(self.SCRIPT)], json.dumps({"tool_name": tool, "tool_input": {"body": "secret"}}))
        self.assertEqual(res.returncode, 0)
        self.assertNotIn("secret", res.stdout)
        return json.loads(res.stdout)["hookSpecificOutput"]["permissionDecision"] if res.stdout.strip() else None

    def test_send_tools_ask(self):
        for tool in ("mcp__Gmail__send_message", "mcp__Slack__slack_send_message",
                     "mcp__Google_Calendar__create_event", "mcp__Gmail__reply", "mcp__x__publish_post"):
            with self.subTest(tool=tool):
                self.assertEqual(self.decision(tool), "ask")

    def test_drafts_and_reads_pass(self):
        for tool in ("mcp__Gmail__create_draft", "mcp__Slack__slack_send_message_draft",
                     "mcp__Linear__list_issues", "Write", "mcp__Gmail__search_threads"):
            with self.subTest(tool=tool):
                self.assertIsNone(self.decision(tool))

    def test_bad_input_is_silent(self):
        res = run([str(self.SCRIPT)], "not json")
        self.assertEqual((res.returncode, res.stdout), (0, ""))


class TestPeopleDataGuard(unittest.TestCase):
    SCRIPT = HOOKS / "people_data_guard.py"

    def decision(self, path: str, content: str) -> str:
        res = run([str(self.SCRIPT)], json.dumps({"tool_name": "Write",
                                                   "tool_input": {"file_path": path, "content": content}}))
        self.assertEqual(res.returncode, 0)
        return res.stdout

    def test_flags_contact_details_in_record(self):
        out = self.decision("/w/docs/change/stakeholder-register.md", "Jane: jane@acme.com, 0412 345 678.")
        self.assertIn('"ask"', out)
        self.assertNotIn("jane@acme.com", out)

    def test_ignores_dates_and_counts(self):
        self.assertEqual(self.decision("/w/docs/change/scope.md", "Updated 2026-10-19. 120 people. $1,500,000."), "")

    def test_ignores_files_outside_record(self):
        self.assertEqual(self.decision("/w/notes.md", "jane@acme.com"), "")


class TestValidator(unittest.TestCase):
    def test_repo_validates(self):
        res = run([str(ROOT / "scripts/validate.py")])
        self.assertEqual(res.returncode, 0, res.stdout)


if __name__ == "__main__":
    unittest.main()
