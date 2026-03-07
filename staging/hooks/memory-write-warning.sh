#!/bin/bash
# PreToolUse hook for Write tool — warns when writing to MEMORY.md
# without provenance tags. Prevents the confabulation feedback loop
# documented in GitHub issue #27430.
# Warning only (exit 0) — never blocks MEMORY.md writes.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

[ "$tool_name" != "Write" ] && exit 0

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Check if writing to a MEMORY.md or learned/ file
if echo "$file_path" | grep -qiE '(MEMORY\.md$|/learned/)'; then
  content=$(echo "$input" | jq -r '.tool_input.content // ""' 2>/dev/null)

  # Check if content contains provenance tags
  if ! echo "$content" | grep -qE '\[source:'; then
    echo "[Hook] WARNING: Writing to persistent memory without provenance tags." >&2
    echo "[Hook] Tag facts with [source: tool_output] or [source: file:<path>]" >&2
    echo "[Hook] Tag reasoning with [source: claude_inference]" >&2
    echo "[Hook] Untagged claims create confabulation feedback loops across sessions." >&2
  fi
fi

exit 0
