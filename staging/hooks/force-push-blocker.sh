#!/bin/bash
# PreToolUse hook: Block git push --force deterministically
# The ask list catches this in default mode, but this hook also works
# in autonomous/dontAsk mode where ask permissions are bypassed.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

if [ "$tool_name" != "Bash" ]; then
  echo "$input"
  exit 0
fi

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)
if [ -z "$cmd" ]; then
  echo "$input"
  exit 0
fi

# Check for force push patterns (--force, -f, --force-with-lease)
if echo "$cmd" | grep -qE '\bgit\s+push\s.*(-f\b|--force\b|--force-with-lease\b)'; then
  # Force push to main/master → always deny
  if echo "$cmd" | grep -qE '\b(main|master)\b'; then
    jq -n '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "Force push to main/master is NEVER allowed. This destroys shared history. Push to a feature branch instead."
      }
    }'
  else
    # Force push to other branches → escalate to user
    jq -n '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "ask",
        "permissionDecisionReason": "Force push detected to a non-main branch. This rewrites remote history. Confirm with the user before proceeding."
      }
    }'
  fi
  exit 0
fi

# Not a force push — pass through
echo "$input"
