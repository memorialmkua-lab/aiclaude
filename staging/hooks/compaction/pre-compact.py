#!/usr/bin/env python3
"""
PreCompact Hook: Extract structured state from transcript before compaction.

Parses the session transcript JSONL, extracts key state (files modified,
skills loaded, task goal, decisions, current phase), and writes a structured
handoff document that can be recovered after compaction.

Uses the Factory-inspired structured format which scored highest in their
evaluation (3.70/5.0 vs Anthropic's 3.44).

Hook config (in ~/.claude/settings.json):
{
  "hooks": {
    "PreCompact": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/compaction/pre-compact.py",
        "timeout": 15000
      }]
    }]
  }
}
"""

import json
import sys
import os
import tempfile
from datetime import datetime


def parse_transcript(transcript_path):
    """Parse the JSONL transcript and extract structured state."""
    files_modified = set()
    skills_loaded = set()
    task_goal = ""
    user_messages = []
    recent_decisions = []
    current_phase = ""
    tool_calls_count = 0
    errors_encountered = []

    with open(transcript_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            msg_type = entry.get("type", "")

            # Extract user messages
            if msg_type == "user":
                message = entry.get("message", {})
                if isinstance(message, dict):
                    content = message.get("content", "")
                    if isinstance(content, str) and content.strip():
                        user_messages.append(content.strip()[:500])
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict):
                                if item.get("type") == "text":
                                    text = item.get("text", "").strip()
                                    if text:
                                        user_messages.append(text[:500])

            # Extract assistant messages
            elif msg_type == "assistant":
                message = entry.get("message", {})
                if isinstance(message, dict):
                    content = message.get("content", [])
                    if isinstance(content, list):
                        for item in content:
                            if not isinstance(item, dict):
                                continue

                            if item.get("type") == "text":
                                text = item.get("text", "")

                                # Check for SKILLS_LOADED indicators
                                # Format: "SKILLS_LOADED: [skill-1, skill-2] | Phase: N (Type)"
                                if "SKILLS_LOADED:" in text:
                                    for text_line in text.split("\n"):
                                        stripped = text_line.strip()
                                        # Only match lines that START with SKILLS_LOADED:
                                        # (not documentation about the format)
                                        if stripped.startswith("SKILLS_LOADED:"):
                                            value = stripped.split("SKILLS_LOADED:", 1)[1].strip()
                                            if value and value != "none":
                                                skills_loaded.add(value[:200])

                                # Check for phase indicators
                                if "Phase" in text and (
                                    "Complete" in text
                                    or "complete" in text
                                    or "Checkpoint" in text
                                ):
                                    for text_line in text.split("\n"):
                                        if "Phase" in text_line or "Checkpoint" in text_line:
                                            current_phase = text_line.strip()[
                                                :300
                                            ]

                                # Capture key decisions — find the line with the keyword
                                decision_keywords = [
                                    "decided",
                                    "decision:",
                                    "chose",
                                    "approach:",
                                    "choosing",
                                ]
                                lower = text.lower()
                                if any(w in lower for w in decision_keywords):
                                    for candidate in text[:1000].split("\n"):
                                        candidate_lower = candidate.lower().strip()
                                        if any(w in candidate_lower for w in decision_keywords):
                                            if len(candidate.strip()) > 20:
                                                recent_decisions.append(
                                                    candidate.strip()[:300]
                                                )
                                                break

                                # Capture errors/warnings — require keywords on same line
                                if "error" in lower:
                                    for candidate in text[:1000].split("\n"):
                                        cl = candidate.lower().strip()
                                        if "error" in cl and (
                                            "fix" in cl
                                            or "resolved" in cl
                                            or "fixed" in cl
                                        ):
                                            if len(candidate.strip()) > 15:
                                                errors_encountered.append(
                                                    candidate.strip()[:200]
                                                )
                                                break

                            elif item.get("type") == "tool_use":
                                tool_calls_count += 1
                                tool_name = item.get("name", "")
                                tool_input = item.get("input", {})

                                # Track file modifications
                                if tool_name in ("Edit", "Write"):
                                    fp = tool_input.get("file_path", "")
                                    if fp:
                                        files_modified.add(fp)

                                # Track skill loading
                                if tool_name == "Skill":
                                    skill_name = tool_input.get(
                                        "skill_name",
                                        tool_input.get("name", ""),
                                    )
                                    if skill_name:
                                        skills_loaded.add(skill_name)

    # Task goal = first substantive user message
    task_goal = user_messages[0] if user_messages else "Unknown"

    return {
        "task_goal": task_goal,
        "files_modified": sorted(files_modified),
        "skills_loaded": sorted(skills_loaded),
        "current_phase": current_phase,
        "user_messages": user_messages,
        "recent_decisions": recent_decisions[-7:],
        "errors_encountered": errors_encountered[-5:],
        "tool_calls_count": tool_calls_count,
    }


def build_handoff(state, trigger, session_id, cwd, custom_instructions):
    """Build a structured handoff document (Factory-inspired format)."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    sections = []
    sections.append(f"# Session Handoff")
    sections.append(f"**Generated:** {timestamp}")
    sections.append(f"**Trigger:** {trigger}")
    sections.append(f"**Session:** {session_id}")
    sections.append(f"**CWD:** {cwd}")

    # Task Goal (preserved verbatim — most important section)
    sections.append(f"\n## Task Goal\n{state['task_goal'][:1000]}")

    # Files Modified (the section Factory found was the key differentiator)
    sections.append("\n## Files Modified")
    if state["files_modified"]:
        for fp in state["files_modified"]:
            sections.append(f"- `{fp}`")
    else:
        sections.append("- None tracked")

    # Current Phase (for autonomous mode recovery)
    if state["current_phase"]:
        sections.append(f"\n## Current Phase\n{state['current_phase']}")

    # Skills Loaded (for skill router recovery)
    sections.append("\n## Skills Loaded")
    if state["skills_loaded"]:
        for skill in state["skills_loaded"]:
            sections.append(f"- {skill}")
    else:
        sections.append("- None")

    # What Was Done (recent user requests as proxy)
    sections.append("\n## Recent User Requests")
    for msg in state["user_messages"][-5:]:
        sections.append(f"- {msg[:200]}")

    # Key Decisions (extracted from Claude's text via keyword matching — UNVERIFIED)
    if state["recent_decisions"]:
        sections.append("\n## Key Decisions Made [source: claude_inference]")
        for dec in state["recent_decisions"]:
            sections.append(f"- {dec}")

    # Errors Resolved (extracted from Claude's text via keyword matching — UNVERIFIED)
    if state["errors_encountered"]:
        sections.append("\n## Errors Resolved [source: claude_inference]")
        for err in state["errors_encountered"]:
            sections.append(f"- {err}")

    # Session Stats
    sections.append("\n## Session Stats")
    sections.append(f"- Tool calls: {state['tool_calls_count']}")
    sections.append(f"- Files touched: {len(state['files_modified'])}")
    sections.append(f"- User messages: {len(state['user_messages'])}")

    # Provenance Notice
    sections.append("\n## Provenance")
    sections.append("- **Files Modified**: from Edit/Write tool_use events [verified]")
    sections.append("- **Skills Loaded**: from Skill tool_use events [verified]")
    sections.append("- **User Requests**: from user message entries [verified]")
    sections.append("- **Key Decisions**: from Claude's text via keyword matching [UNVERIFIED — treat as claims]")
    sections.append("- **Errors Resolved**: from Claude's text via keyword matching [UNVERIFIED]")

    # Custom Instructions (if manual /compact with text)
    if custom_instructions:
        sections.append(f"\n## Custom Instructions\n{custom_instructions}")

    return "\n".join(sections)


def main():
    # Read hook input from stdin
    try:
        raw = sys.stdin.read()
        hook_input = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        print("[PreCompact] Failed to parse stdin JSON", file=sys.stderr)
        return

    transcript_path = hook_input.get("transcript_path", "")
    trigger = hook_input.get("trigger", "unknown")
    session_id = hook_input.get("session_id", "unknown")
    cwd = hook_input.get("cwd", "")
    custom_instructions = hook_input.get("custom_instructions", "")

    if not transcript_path or not os.path.exists(transcript_path):
        print("[PreCompact] No transcript found", file=sys.stderr)
        return

    # Parse transcript
    try:
        state = parse_transcript(transcript_path)
    except Exception as e:
        print(f"[PreCompact] Error parsing transcript: {e}", file=sys.stderr)
        return

    # Build handoff document
    handoff = build_handoff(state, trigger, session_id, cwd, custom_instructions)

    # Write handoff
    handoff_dir = os.path.expanduser("~/.claude/compaction")
    os.makedirs(handoff_dir, exist_ok=True)

    handoff_path = os.path.join(handoff_dir, "handoff.md")

    # Atomic write: temp file + os.replace() prevents partial reads
    tmp_fd, tmp_path = tempfile.mkstemp(dir=handoff_dir, suffix=".md")
    try:
        with os.fdopen(tmp_fd, "w") as f:
            f.write(handoff)
        os.replace(tmp_path, handoff_path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

    # Keep a timestamped backup (limit to 10 most recent)
    backup_name = f"handoff-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
    backup_path = os.path.join(handoff_dir, backup_name)
    with open(backup_path, "w") as f:
        f.write(handoff)

    # Clean old backups (keep last 10)
    backups = sorted(
        [
            f
            for f in os.listdir(handoff_dir)
            if f.startswith("handoff-") and f.endswith(".md")
        ]
    )
    for old in backups[:-10]:
        try:
            os.remove(os.path.join(handoff_dir, old))
        except OSError:
            pass

    print(f"[PreCompact] Handoff saved: {len(state['files_modified'])} files, "
          f"{state['tool_calls_count']} tool calls, "
          f"{len(state['user_messages'])} messages captured",
          file=sys.stderr)


if __name__ == "__main__":
    main()
