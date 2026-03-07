#!/bin/bash
# PreToolUse hook: Catch plain rm in compound commands
# Complements rm-to-trash-rewriter.sh (which only handles commands starting with rm).
# This warns about rm usage in pipes, subshells, and compound commands.
# Warning only (exit 0) — the command still runs, but Claude sees the warning.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

[ "$tool_name" != "Bash" ] && exit 0

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)
[ -z "$cmd" ] && exit 0

# Skip if command starts with rm (handled by rewriter)
echo "$cmd" | grep -qE '^\s*rm\s' && exit 0

# Skip ephemeral clone cleanup
echo "$cmd" | grep -qE '/tmp/claude-research-' && exit 0

# Check for rm appearing after ; or && or || in a compound command
if echo "$cmd" | grep -qE '(;|&&|\|\|)\s*rm\s'; then
  echo "[Hook] WARNING: 'rm' detected in compound command. Use 'trash' instead." >&2
  echo "[Hook] Rewrite to use 'trash' for safe deletion with recovery option." >&2
fi

exit 0
