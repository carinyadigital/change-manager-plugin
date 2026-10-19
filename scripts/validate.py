#!/usr/bin/env python3
"""Structural validation for the change-manager plugin repo.

Checks:
  1. Marketplace manifests (Claude <-> Cursor parity, plugin sync)
  2. Plugin manifests (Claude <-> Cursor parity, required fields)
  3. All JSON files parse
  4. hooks/hooks.json shape and referenced scripts exist
  5. SKILL.md frontmatter, budgets, metadata enums, required headings
  6. Agent frontmatter contracts
  7. Markdown relative links resolve
  8. evals/evals.json and evals/trigger-queries.json schema
  9. Coverage: every skill appears in CONNECTORS.md and the skills-index routing table

Usage: python3 scripts/validate.py [--warn-only]
Exits 0 on success, 1 on any failure. Python 3.9+, standard library only
(uses PyYAML if installed, otherwise a minimal frontmatter parser).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
NAME_MAX, DESC_MAX, BODY_MAX_LINES = 64, 1024, 500
WORK_SHAPES = {"implement-and-ship", "review-and-gate", "generate-draft", "orchestrate-delivery", "monitor-and-report"}
OUTPUT_CLASSES = {"draft-for-review", "decision-support", "structured-data", "tracking-update", "applied-change"}
META_FIELDS = ("version", "owner", "review_cadence", "work_shape", "output_class")
HEADINGS = ("## When to use", "## What this skill does not do", "## Preconditions",
            "## Trust spine", "## Workflow", "## Outputs")
MODEL_TIERS = {"fast", "standard"}
LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)\)")

failures: list[str] = []
passes = 0


def fail(msg: str) -> None:
    failures.append(msg)


def ok() -> None:
    global passes
    passes += 1


# ---------------------------------------------------------------- frontmatter
def split_frontmatter(text: str) -> tuple[str, str] | None:
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end == -1:
        return None
    return text[4:end], text[end + 4:].lstrip("\n")


def parse_yaml(src: str) -> dict:
    try:
        import yaml  # type: ignore
        data = yaml.safe_load(src)
        return data if isinstance(data, dict) else {}
    except ImportError:
        return _mini_yaml(src)


def _scalar(v: str):
    v = v.strip()
    if v.startswith(("'", '"')) and v.endswith(v[0]) and len(v) >= 2:
        return v[1:-1]
    if v.startswith("[") and v.endswith("]"):
        return [_scalar(x) for x in v[1:-1].split(",") if x.strip()]
    if v in ("true", "false"):
        return v == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def _mini_yaml(src: str) -> dict:
    """Enough YAML for this repo's frontmatter: scalars, folded >, lists, one nested map."""
    out: dict = {}
    lines = src.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not m:
            i += 1
            continue
        key, val = m.group(1), m.group(2)
        i += 1
        block = []
        while i < len(lines) and (lines[i].startswith(" ") or not lines[i].strip()):
            block.append(lines[i])
            i += 1
        if val in (">", "|", ">-", "|-"):
            out[key] = " ".join(b.strip() for b in block if b.strip())
        elif val == "" and block and block[0].strip().startswith("- "):
            out[key] = [_scalar(b.strip()[2:]) for b in block if b.strip().startswith("- ")]
        elif val == "" and block:
            out[key] = {}
            for b in block:
                mm = re.match(r"^\s+([A-Za-z0-9_-]+):\s*(.*)$", b)
                if mm:
                    out[key][mm.group(1)] = _scalar(mm.group(2))
        else:
            out[key] = _scalar(val)
    return out


# ---------------------------------------------------------------- checks
def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        fail(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
        return None


def check_json_files() -> None:
    for p in ROOT.rglob("*.json"):
        if ".git" in p.parts:
            continue
        if load_json(p) is not None:
            ok()


def plugin_dirs() -> list[Path]:
    return sorted(p.parent.parent for p in ROOT.glob("*/.claude-plugin/plugin.json"))


def check_manifests() -> None:
    cm = load_json(ROOT / ".claude-plugin/marketplace.json")
    cu = load_json(ROOT / ".cursor-plugin/marketplace.json")
    if cm is None or cu is None:
        return
    if cm != cu:
        fail("marketplace.json differs between .claude-plugin and .cursor-plugin")
    for entry in cm.get("plugins", []):
        src = ROOT / entry.get("source", "")
        pj = load_json(src / ".claude-plugin/plugin.json") if (src / ".claude-plugin/plugin.json").exists() else None
        if pj is None:
            fail(f"marketplace entry {entry.get('name')}: no plugin.json at {entry.get('source')}")
            continue
        for field in ("name", "description"):
            if entry.get(field) != pj.get(field):
                fail(f"marketplace entry {entry.get('name')}: {field} out of sync with plugin.json")
        ok()
    for d in plugin_dirs():
        a = load_json(d / ".claude-plugin/plugin.json")
        b = load_json(d / ".cursor-plugin/plugin.json") if (d / ".cursor-plugin/plugin.json").exists() else None
        if b is None:
            fail(f"{d.name}: missing .cursor-plugin/plugin.json")
        elif a != b:
            fail(f"{d.name}: plugin.json differs between Claude and Cursor")
        for field in ("name", "version", "description", "author", "license"):
            if not (a or {}).get(field):
                fail(f"{d.name}/.claude-plugin/plugin.json missing {field}")
        for f in ("README.md", "CONNECTORS.md", "CLAUDE.md", ".mcp.json", "LICENSE"):
            if not (d / f).exists():
                fail(f"{d.name}: missing {f}")
        ok()


def check_hooks() -> None:
    for hj in ROOT.glob("*/hooks/hooks.json"):
        data = load_json(hj)
        if data is None:
            continue
        hooks = data.get("hooks")
        if not isinstance(hooks, dict):
            fail(f"{hj.relative_to(ROOT)}: 'hooks' must be an object")
            continue
        plugin = hj.parent.parent
        for event, groups in hooks.items():
            for g in groups:
                for h in g.get("hooks", []):
                    cmd = h.get("command", "")
                    for ref in re.findall(r"\$\{CLAUDE_PLUGIN_ROOT\}/([^\"'\s]+)", cmd):
                        if not (plugin / ref).exists():
                            fail(f"{hj.relative_to(ROOT)}: {event} references missing {ref}")
        ok()


def skill_files() -> list[Path]:
    return sorted(ROOT.glob("*/skills/*/SKILL.md"))


def check_skills() -> None:
    for sk in skill_files():
        rel = sk.relative_to(ROOT)
        parts = split_frontmatter(sk.read_text(encoding="utf-8"))
        if not parts:
            fail(f"{rel}: missing frontmatter")
            continue
        fm, body = parse_yaml(parts[0]), parts[1]
        name = fm.get("name", "")
        if name != sk.parent.name:
            fail(f"{rel}: name {name!r} must match folder {sk.parent.name!r}")
        if not NAME_RE.match(str(name)) or len(str(name)) > NAME_MAX:
            fail(f"{rel}: invalid name {name!r}")
        desc = str(fm.get("description", "")).strip()
        if not desc:
            fail(f"{rel}: missing description")
        elif len(desc) > DESC_MAX:
            fail(f"{rel}: description {len(desc)} chars (max {DESC_MAX})")
        if not fm.get("allowed-tools"):
            fail(f"{rel}: missing allowed-tools")
        tools = fm.get("allowed-tools") or []
        if isinstance(tools, str):
            tools = tools.replace(",", " ").split()
        if any(t.strip() == "Bash" for t in tools):
            fail(f"{rel}: unscoped Bash in allowed-tools")
        meta = fm.get("metadata") if isinstance(fm.get("metadata"), dict) else {}
        for f in META_FIELDS:
            if not meta.get(f):
                fail(f"{rel}: missing metadata.{f}")
        if meta.get("work_shape") and meta["work_shape"] not in WORK_SHAPES:
            fail(f"{rel}: invalid work_shape {meta['work_shape']!r}")
        if meta.get("output_class") and meta["output_class"] not in OUTPUT_CLASSES:
            fail(f"{rel}: invalid output_class {meta['output_class']!r}")
        heads = re.findall(r"^## .+$", body, re.M)
        heads = [h.strip() for h in heads]
        for h in HEADINGS:
            if h not in heads:
                fail(f"{rel}: missing heading {h!r}")
        if len(body.splitlines()) > BODY_MAX_LINES:
            fail(f"{rel}: body over {BODY_MAX_LINES} lines")
        if (sk.parent / "scripts").exists() and not any("Bash(python3" in str(t) for t in tools):
            fail(f"{rel}: ships scripts/ but allowed-tools lacks Bash(python3:*)")
        ok()


def check_agents() -> None:
    for ag in ROOT.glob("*/agents/*.md"):
        rel = ag.relative_to(ROOT)
        parts = split_frontmatter(ag.read_text(encoding="utf-8"))
        if not parts:
            fail(f"{rel}: missing frontmatter")
            continue
        fm = parse_yaml(parts[0])
        if fm.get("name") != ag.stem:
            fail(f"{rel}: name must match filename")
        if not fm.get("description"):
            fail(f"{rel}: missing description")
        if fm.get("model") != "inherit":
            fail(f"{rel}: model must be 'inherit'")
        tools = fm.get("tools") or []
        if not tools:
            fail(f"{rel}: tools list empty")
        if any(str(t).strip() == "Bash" for t in tools):
            fail(f"{rel}: unscoped Bash")
        meta = fm.get("metadata") if isinstance(fm.get("metadata"), dict) else {}
        if meta.get("model_tier") not in MODEL_TIERS:
            fail(f"{rel}: metadata.model_tier must be fast|standard")
        if not isinstance(meta.get("budget"), int) or meta.get("budget", 0) < 1:
            fail(f"{rel}: metadata.budget must be a positive integer")
        ok()


def check_links() -> None:
    for md in ROOT.rglob("*.md"):
        if ".git" in md.parts:
            continue
        text = md.read_text(encoding="utf-8")
        text = re.sub(r"```.*?```", "", text, flags=re.S)
        for target in LINK_RE.findall(text):
            if re.match(r"^[a-z]+:", target) or target.startswith("#"):
                continue
            path = target.split("#")[0]
            if not path:
                continue
            if not (md.parent / path).resolve().exists():
                fail(f"{md.relative_to(ROOT)}: broken link {target}")
        ok()


def check_evals() -> None:
    for sk in skill_files():
        ev = sk.parent / "evals"
        name = sk.parent.name
        tq = ev / "trigger-queries.json"
        if name != "setup" and not tq.exists():
            fail(f"{sk.parent.relative_to(ROOT)}: missing evals/trigger-queries.json")
        if tq.exists():
            data = load_json(tq)
            if not isinstance(data, list) or not data:
                fail(f"{tq.relative_to(ROOT)}: must be a non-empty list")
            else:
                pos = sum(1 for q in data if q.get("should_trigger") is True)
                neg = sum(1 for q in data if q.get("should_trigger") is False)
                bad = [q for q in data if not isinstance(q.get("query"), str) or not isinstance(q.get("should_trigger"), bool)]
                if bad:
                    fail(f"{tq.relative_to(ROOT)}: entries need query (str) and should_trigger (bool)")
                if pos < 5 or neg < 5:
                    fail(f"{tq.relative_to(ROOT)}: want at least 5 positive and 5 negative queries ({pos}/{neg})")
        ej = ev / "evals.json"
        if ej.exists():
            data = load_json(ej)
            if not isinstance(data, dict) or data.get("skill_name") != name:
                fail(f"{ej.relative_to(ROOT)}: skill_name must be {name!r}")
            else:
                for case in data.get("evals", []):
                    for f in ("id", "prompt", "expected_output", "assertions"):
                        if f not in case:
                            fail(f"{ej.relative_to(ROOT)}: eval {case.get('id')} missing {f}")
        ok()


def check_coverage() -> None:
    for d in plugin_dirs():
        skills = sorted(p.parent.name for p in d.glob("skills/*/SKILL.md"))
        conn = (d / "CONNECTORS.md").read_text(encoding="utf-8") if (d / "CONNECTORS.md").exists() else ""
        index = d / "skills/skills-index/SKILL.md"
        idx = index.read_text(encoding="utf-8") if index.exists() else ""
        readme = (d / "README.md").read_text(encoding="utf-8") if (d / "README.md").exists() else ""
        for s in skills:
            if f"**{s}**" not in conn:
                fail(f"{d.name}/CONNECTORS.md: skill {s} missing from 'Used by skill'")
            if s != "skills-index" and f"`{s}`" not in idx:
                fail(f"{d.name}/skills/skills-index: skill {s} missing from routing table")
            if f"`{s}`" not in readme and f"**{s}**" not in readme:
                fail(f"{d.name}/README.md: skill {s} not documented")
        ok()


def main(argv: list[str]) -> int:
    if "--help" in argv or "-h" in argv:
        print(__doc__.strip())
        return 0
    for fn in (check_json_files, check_manifests, check_hooks, check_skills, check_agents,
               check_links, check_evals, check_coverage):
        fn()
    if failures:
        print(f"FAIL — {len(failures)} problem(s), {passes} checks passed\n")
        for f in failures:
            print(f"  ✗ {f}")
        return 0 if "--warn-only" in argv else 1
    print(f"PASS — {passes} checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
