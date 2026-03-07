#!/bin/bash
# StatusLine: Context Usage Monitor
#
# Displays current context window usage in Claude's status line.
# Warns at thresholds to prompt strategic compaction.
#
# The StatusLine hook is the ONLY hook that receives live context_window
# metrics from Claude Code. It fires after every assistant message.
#
# Config (in ~/.claude/settings.json):
# {
#   "statusLine": {
#     "type": "command",
#     "command": "~/.claude/hooks/compaction/context-monitor.sh"
#   }
# }

input=$(cat)

used=$(echo "$input" | jq -r '.context_window.used_percentage // empty' 2>/dev/null)

if [ -z "$used" ] || [ "$used" = "null" ]; then
  exit 0
fi

# Integer comparison
used_int=${used%.*}

# Bridge: write percentage to file so PreToolUse hooks can read it
echo -n "$used_int" > /tmp/claude-context-pct 2>/dev/null

if [ "$used_int" -ge 85 ]; then
  echo "ctx ${used_int}% [COMPACT NOW - quality degraded]"
elif [ "$used_int" -ge 70 ]; then
  echo "ctx ${used_int}% [quality degrading]"
elif [ "$used_int" -ge 60 ]; then
  echo "ctx ${used_int}% [approaching threshold]"
else
  echo "ctx ${used_int}%"
fi
