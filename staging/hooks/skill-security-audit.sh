#!/bin/bash
# SessionStart hook: Lightweight security audit of installed skills
# Checks SKILL.md files for prompt injection, data exfiltration,
# obfuscated commands, and unexpected hooks. Fast (<100ms), no network.

SKILLS_DIR="${HOME}/.claude/skills"
WARNINGS=""

[ -d "$SKILLS_DIR" ] || exit 0

while IFS= read -r skill_file; do
  skill_name=$(basename "$(dirname "$skill_file")")
  content=$(cat "$skill_file" 2>/dev/null)

  # Prompt injection patterns
  if echo "$content" | grep -qiE '(ignore previous|ignore all|disregard|forget your|override your|you are now|new instructions|system prompt)'; then
    WARNINGS="${WARNINGS}[SkillAudit] WARNING: Prompt injection pattern in ${skill_name}/SKILL.md\n"
  fi

  # Data exfiltration (network calls + sensitive data references)
  if echo "$content" | grep -qiE '(curl\s|wget\s|fetch\(|http://|https://)' && \
     echo "$content" | grep -qiE '(env\b|secret|token|key|password|credential)'; then
    WARNINGS="${WARNINGS}[SkillAudit] WARNING: Potential data exfiltration pattern in ${skill_name}/SKILL.md\n"
  fi

  # Obfuscated commands
  if echo "$content" | grep -qE '(base64\s+(--decode|-d)|\\x[0-9a-fA-F]{2}|eval\s*\()'; then
    WARNINGS="${WARNINGS}[SkillAudit] WARNING: Obfuscated command in ${skill_name}/SKILL.md\n"
  fi

  # Unexpected hooks in frontmatter (known exceptions: continuous-learning-v2, strategic-compact)
  if echo "$content" | head -20 | grep -qiE '^hooks:'; then
    case "$skill_name" in
      continuous-learning-v2|strategic-compact) ;;
      *) WARNINGS="${WARNINGS}[SkillAudit] WARNING: Unexpected hooks in ${skill_name}/SKILL.md frontmatter\n" ;;
    esac
  fi

done < <(find "$SKILLS_DIR" -name "SKILL.md" -type f 2>/dev/null)

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" >&2
fi

exit 0
