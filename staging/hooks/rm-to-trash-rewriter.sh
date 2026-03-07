#!/bin/bash
# PreToolUse hook: Rewrite `rm` commands to `trash`
# Uses updatedInput to silently replace rm with trash before execution.
# Makes the safety rule "NEVER use rm — use trash" deterministic.
#
# Handles:
#   rm file.txt         → trash file.txt
#   rm -f file.txt      → trash file.txt
#   rm path/to/file     → trash path/to/file
#   rm -rf dir/          → BLOCKED (defense-in-depth with deny list)
#   rm -r dir/           → BLOCKED
#
# Exceptions:
#   rm -rf /tmp/claude-research-*  → allowed (ephemeral clone cleanup per safety.md)
#   rm in compound commands        → handled by plain-rm-catcher.sh

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

# Only process Bash tool calls
if [ "$tool_name" != "Bash" ]; then
  echo "$input"
  exit 0
fi

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)
if [ -z "$cmd" ]; then
  echo "$input"
  exit 0
fi

# Only rewrite commands that START with rm (skip compound commands)
if ! echo "$cmd" | grep -qE '^\s*rm\s'; then
  echo "$input"
  exit 0
fi

# Ephemeral clone cleanup exception (allowed per safety.md)
if echo "$cmd" | grep -qE '^\s*rm\s+(-[a-zA-Z]+\s+)*/tmp/claude-research-'; then
  echo "$input"
  exit 0
fi

# Recursive flags → block as defense-in-depth (deny list also catches these)
if echo "$cmd" | grep -qE '\brm\s+(-[a-zA-Z]*[rR]|--recursive)'; then
  echo "[Hook] BLOCKED: Recursive rm detected. Use 'trash' for directories." >&2
  exit 2
fi

# Rewrite: strip rm and its flags (-f, -i, -v, -I), replace with trash
rewritten=$(echo "$cmd" | sed -E 's/^\s*rm\s+(-[fivI]+\s+)*/trash /')

# Return rewritten command via updatedInput
jq -n --arg rewritten "$rewritten" '{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "rm rewritten to trash (safety rule enforcement)",
    "updatedInput": {
      "command": $rewritten
    }
  }
}'
