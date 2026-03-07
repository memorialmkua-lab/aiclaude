#!/bin/bash
# PreToolUse hook: Context-aware operation gating
# Reads context percentage from /tmp/claude-context-pct (written by StatusLine)
# and warns before expensive operations (Agent, Task) when context is high.
#
# Does NOT block — only warns via stderr so Claude can make an informed decision.
# The warning tells Claude to save its plan and compact before launching big work.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

# Only gate expensive operations
case "$tool_name" in
  Agent|TaskCreate) ;;
  *) exit 0 ;;
esac

# Read context percentage from StatusLine bridge file
PCT_FILE="/tmp/claude-context-pct"
if [ ! -f "$PCT_FILE" ]; then
  exit 0
fi

PCT=$(cat "$PCT_FILE" 2>/dev/null | tr -d '[:space:]')
if [ -z "$PCT" ] || ! [[ "$PCT" =~ ^[0-9]+$ ]]; then
  exit 0
fi

if [ "$PCT" -ge 80 ]; then
  echo "[ContextGate] WARNING: Context at ${PCT}%. You are about to launch an expensive operation (${tool_name})." >&2
  echo "[ContextGate] This will likely trigger auto-compaction mid-operation, losing context about what agents are doing." >&2
  echo "[ContextGate] RECOMMENDED: Save your current plan to a temporary file (e.g. /tmp/claude-plan-$(date +%s).md), then run /compact. Resume after compaction." >&2
elif [ "$PCT" -ge 70 ]; then
  echo "[ContextGate] Context at ${PCT}%. Consider compacting at the next logical break before launching parallel work." >&2
fi

exit 0
