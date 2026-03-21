#!/usr/bin/env bash
# protect-config-files.sh - Prevent agents from modifying linter/formatter configs
# Instead of changing configs to pass checks, agents should fix the actual code.
#
# Hook: PreToolUse (Write|Edit)
# Profile: standard, strict
set -euo pipefail

FILE_PATH=$(jq -r ".tool_input.file_path // .tool_input.file // empty")
[[ -z "$FILE_PATH" ]] && exit 0

BASENAME=$(basename "$FILE_PATH")

case "$BASENAME" in
  .eslintrc*|.prettierrc*|biome.json|.ruff.toml|ruff.toml|\
  .shellcheckrc|.stylelintrc*|.markdownlint*)
    echo "BLOCKED: Do not modify linter/formatter config to pass checks. Fix the code instead." >&2
    exit 2
    ;;
esac
exit 0