#!/bin/bash
# Context Pressure Hook
#
# Unified PreToolUse hook that prevents auto-compaction from interrupting work.
# Reads actual context window percentage from the StatusLine bridge file
# (/tmp/claude-context-pct, written by context-monitor.sh after every message).
#
# Tiered responses:
#   <70%  — silent (no output)
#   70-84% — stderr warning (Claude sees it, can act on it)
#   85-91% — stdout instruction (injected into Claude's context, tells it to compact)
#   92%+   — EXIT 2 on Write/Edit (blocks the call to prevent mid-write auto-compaction)
#            Agent/TaskCreate still allowed but with strong warning
#
# Why block Write/Edit at 92%?
# Auto-compaction can interrupt a Write mid-operation, producing a truncated file.
# That's the exact scenario this hook exists to prevent. Blocking gives Claude the
# chance to save state and /compact cleanly before continuing.
#
# Secondary signal: tool call count (for when bridge file is missing/stale)
#
# Hook config (in ~/.claude/settings.json):
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "tool == \"Edit\" || tool == \"Write\" || tool == \"Agent\" || tool == \"TaskCreate\"",
#       "hooks": [{
#         "type": "command",
#         "command": "~/.claude/hooks/strategic-compact/context-pressure.sh",
#         "timeout": 5000
#       }]
#     }]
#   }
# }

# ─────────────────────────────────────────────
# Read stdin (hook input JSON)
# ─────────────────────────────────────────────
input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

# ─────────────────────────────────────────────
# Primary signal: context window percentage
# Written by StatusLine hook (context-monitor.sh) after every assistant message
# ─────────────────────────────────────────────
PCT_FILE="/tmp/claude-context-pct"
PCT=""
PCT_STALE=false

if [ -f "$PCT_FILE" ]; then
  PCT=$(cat "$PCT_FILE" 2>/dev/null | tr -d '[:space:]')

  # Validate it's a number
  if ! [[ "$PCT" =~ ^[0-9]+$ ]]; then
    PCT=""
  fi

  # Check staleness — if file is older than 10 minutes, data may be from another session
  if [ -n "$PCT" ]; then
    file_age=$(( $(date +%s) - $(stat -f %m "$PCT_FILE" 2>/dev/null || stat -c %Y "$PCT_FILE" 2>/dev/null || echo 0) ))
    if [ "$file_age" -gt 600 ]; then
      PCT_STALE=true
    fi
  fi
fi

# ─────────────────────────────────────────────
# Secondary signal: tool call count
# Tracks Edit/Write/Agent/TaskCreate calls per session
# ─────────────────────────────────────────────
session_id=$(echo "$input" | jq -r '.session_id // ""' 2>/dev/null)
if [ -z "$session_id" ] || [ "$session_id" = "null" ]; then
  session_id="fallback-$(date +%Y%m%d)"
fi

COUNTER_DIR="/tmp/claude-compact-counters"
mkdir -p "$COUNTER_DIR"

# Clean up counter files older than 1 day
find "$COUNTER_DIR" -type f -mtime +1 -delete 2>/dev/null

COUNTER_FILE="${COUNTER_DIR}/${session_id}"

if [ -f "$COUNTER_FILE" ]; then
  count=$(cat "$COUNTER_FILE" 2>/dev/null)
  if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    count=0
  fi
  count=$((count + 1))
else
  count=1
fi
echo "$count" > "$COUNTER_FILE"

# ─────────────────────────────────────────────
# Decision logic
# ─────────────────────────────────────────────

# If we have a valid, fresh context percentage, use it as primary signal
if [ -n "$PCT" ] && [ "$PCT_STALE" = false ]; then

  if [ "$PCT" -ge 92 ]; then
    # CRITICAL: Block Write/Edit to prevent mid-operation auto-compaction
    case "$tool_name" in
      Edit|Write)
        echo "[ContextPressure] BLOCKED: Context window at ${PCT}%. Writing now risks auto-compaction interrupting mid-operation." >&2
        echo "[ContextPressure] Save your current plan/state to a file, then run /compact to free context." >&2
        echo "[ContextPressure] After compaction, re-read the plan file and resume." >&2
        exit 2
        ;;
      Agent|TaskCreate)
        echo "[ContextPressure] CRITICAL: Context at ${PCT}%. Launching agents will almost certainly trigger auto-compaction." >&2
        echo "[ContextPressure] Save your plan to a file and /compact FIRST." >&2
        ;;
    esac

  elif [ "$PCT" -ge 85 ]; then
    # HIGH: Strong instruction to compact — output to stderr so Claude sees it
    echo "[ContextPressure] WARNING: Context at ${PCT}%. Auto-compaction is imminent." >&2
    echo "[ContextPressure] You are about to run out of context. Do NOT start new multi-step work." >&2
    echo "[ContextPressure] ACTION REQUIRED: Save your current plan/progress to a file (e.g., /tmp/claude-plan.md), then /compact." >&2

  elif [ "$PCT" -ge 70 ]; then
    # MODERATE: Advisory warning
    echo "[ContextPressure] Context at ${PCT}%. Consider compacting at the next logical break." >&2
  fi

  # Always exit 0 unless we explicitly blocked above
  exit 0
fi

# ─────────────────────────────────────────────
# Fallback: tool call count (when bridge file is missing or stale)
# ─────────────────────────────────────────────
THRESHOLD=${COMPACT_THRESHOLD:-50}

if [ "$count" -ge "$THRESHOLD" ] && [ "$count" -lt "$((THRESHOLD + 2))" ]; then
  echo "[ContextPressure] ${count} tool calls this session (context % unavailable). Consider /compact if transitioning phases." >&2
fi

if [ "$count" -gt "$THRESHOLD" ] && [ $((count % 25)) -eq 0 ]; then
  echo "[ContextPressure] ${count} tool calls. Consider /compact if context is getting stale." >&2
fi

exit 0
