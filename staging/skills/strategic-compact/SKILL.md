---
name: strategic-compact
description: Prevents auto-compaction from interrupting work by reading real-time context window percentage and issuing tiered warnings/blocks.
origin: ECC
---

# Context Pressure System

Prevents auto-compaction from interrupting mid-operation by monitoring actual context window usage and intervening before it's too late.

## How It Works

The `context-pressure.sh` hook runs on PreToolUse (Edit, Write, Agent, TaskCreate) and reads the real context window percentage from `/tmp/claude-context-pct` (written by the StatusLine `context-monitor.sh` after every assistant message).

### Tiered Responses

| Context % | Edit/Write | Agent/TaskCreate |
|-----------|-----------|-----------------|
| <70% | Silent | Silent |
| 70-84% | Advisory: "consider compacting at next break" | Same |
| 85-91% | Strong warning: "do NOT start new multi-step work, save plan and /compact" | Same |
| 92%+ | **BLOCKED** (exit 2) — prevents mid-write auto-compaction | Critical warning (not blocked) |

### Why Block at 92%?

Auto-compaction can interrupt a Write mid-operation, producing a truncated file. Blocking the Write gives Claude the chance to save state and `/compact` cleanly before continuing. Agent/TaskCreate aren't blocked because they're less likely to produce corrupt output.

### Fallback

When the bridge file is missing or stale (>10 min old), falls back to counting tool calls per session. Suggests at 50 calls, then every 25 calls after.

## Architecture

Three components work together:

1. **`context-monitor.sh`** (StatusLine hook) — Reads `context_window.used_percentage` from Claude Code after every message, writes integer to `/tmp/claude-context-pct`
2. **`context-pressure.sh`** (PreToolUse hook) — Reads the bridge file, issues tiered responses
3. **`pre-compact.py`** (PreCompact hook) — When compaction happens, saves structured handoff to `~/.claude/compaction/handoff.md`
4. **`compact-recovery.sh`** (SessionStart hook) — Injects handoff context after compaction

## Hook Config

Already wired in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == \"Edit\" || tool == \"Write\" || tool == \"Agent\" || tool == \"TaskCreate\"",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/strategic-compact/context-pressure.sh",
        "timeout": 5000
      }]
    }]
  },
  "statusLine": {
    "type": "command",
    "command": "~/.claude/hooks/compaction/context-monitor.sh"
  }
}
```

## When a Block Fires

If your Edit/Write gets blocked at 92%+:

1. Save your current plan/state to a file (e.g., `/tmp/claude-plan.md`)
2. Run `/compact` with a summary of what you were doing
3. After compaction, re-read the plan file and resume

## Compaction Decision Guide

| Phase Transition | Compact? | Why |
|-----------------|----------|-----|
| Research → Planning | Yes | Research context is bulky; plan is the distilled output |
| Planning → Implementation | Yes | Plan is in TodoWrite or a file; free up context for code |
| Implementation → Testing | Maybe | Keep if tests reference recent code; compact if switching focus |
| Debugging → Next feature | Yes | Debug traces pollute context for unrelated work |
| Mid-implementation | No | Losing variable names, file paths, and partial state is costly |
| After a failed approach | Yes | Clear the dead-end reasoning before trying a new approach |

## What Survives Compaction

| Persists | Lost |
|----------|------|
| CLAUDE.md instructions | Intermediate reasoning and analysis |
| TodoWrite task list | File contents you previously read |
| Memory files (`~/.claude/memory/`) | Multi-step conversation context |
| Git state (commits, branches) | Tool call history and counts |
| Files on disk | Nuanced user preferences stated verbally |
