#!/bin/bash
# PreToolUse hook: Block unreviewed third-party skill installation
# 36% of community skills contain prompt injection (Snyk ToxicSkills, Feb 2026).
# Skills have filesystem access, env vars, API keys — compromised skill = RCE.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

if [ "$tool_name" != "Bash" ]; then
  echo "$input"
  exit 0
fi

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)
[ -z "$cmd" ] && { echo "$input"; exit 0; }

# Block skill installation commands
if echo "$cmd" | grep -qE '(npx\s+skills\s+add|skills\s+install|claude\s+skills\s+add)'; then
  echo "[Hook] BLOCKED: Third-party skill installation detected." >&2
  echo "[Hook] Before installing skills from external sources:" >&2
  echo "[Hook] 1. Clone the repo and READ the SKILL.md for prompt injection" >&2
  echo "[Hook] 2. Check for hooks: in the YAML frontmatter" >&2
  echo "[Hook] 3. Run: uvx snyk-agent-scan@latest --skills <path-to-skill>" >&2
  echo "[Hook] 4. Get explicit user approval before proceeding" >&2
  exit 2
fi

# Warn about manual skill file operations
if echo "$cmd" | grep -qE "(cp|mv|ln)\s.*\.claude/skills/"; then
  echo "[Hook] WARNING: Manual file operation in skills directory detected." >&2
  echo "[Hook] Verify this skill has been security reviewed." >&2
fi

echo "$input"
