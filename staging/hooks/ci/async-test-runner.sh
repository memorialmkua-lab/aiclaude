#!/bin/bash
# Async Background Test Runner
# PostToolUse hook (async: true) — runs related tests after file writes.
# Results delivered via systemMessage on next conversation turn.
#
# Project-aware: detects Vitest in package.json, finds related test files.
# Safe: exits silently for non-code files, projects without Vitest, or no tests.
#
# Deduplication: uses a lockfile so rapid consecutive edits don't spawn
# multiple parallel test runs.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# --- Guard: only run for code files ---
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# --- Guard: skip test files themselves (prevent recursion) ---
case "$FILE_PATH" in
  *.test.*|*.spec.*|*__tests__*|*__mocks__*) exit 0 ;;
esac

# --- Guard: skip config/generated files ---
BASENAME=$(basename "$FILE_PATH")
case "$BASENAME" in
  *.config.*|*.d.ts|next-env.d.ts|package.json|tsconfig.json) exit 0 ;;
esac

# --- Find project root ---
DIR=$(dirname "$FILE_PATH")
PROJECT_ROOT="$DIR"
while [ "$PROJECT_ROOT" != "/" ] && [ ! -f "$PROJECT_ROOT/package.json" ]; do
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  exit 0
fi

# --- Detect Vitest ---
HAS_VITEST=$(jq -r '
  (.devDependencies.vitest // .dependencies.vitest // empty)
' "$PROJECT_ROOT/package.json" 2>/dev/null)

if [ -z "$HAS_VITEST" ]; then
  exit 0
fi

# --- Deduplication: lockfile prevents parallel runs ---
LOCK_FILE="/tmp/claude-test-runner-$(echo "$PROJECT_ROOT" | tr '/' '_').lock"
if [ -f "$LOCK_FILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK_FILE" 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 120 ]; then
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# --- Find related test files ---
FILENAME=$(basename "$FILE_PATH")
STEM="${FILENAME%.*}"
EXT="${FILENAME##*.}"
FILE_DIR=$(dirname "$FILE_PATH")
REL_PATH="${FILE_PATH#$PROJECT_ROOT/}"

TEST_FILE=""
for pattern in \
  "$FILE_DIR/${STEM}.test.${EXT}" \
  "$FILE_DIR/${STEM}.spec.${EXT}" \
  "$FILE_DIR/${STEM}.test.tsx" \
  "$FILE_DIR/${STEM}.spec.tsx" \
  "$FILE_DIR/__tests__/${STEM}.test.${EXT}" \
  "$FILE_DIR/__tests__/${STEM}.spec.${EXT}"; do
  if [ -f "$pattern" ]; then
    TEST_FILE="$pattern"
    break
  fi
done

# If no specific test file, run full suite only for small projects
if [ -z "$TEST_FILE" ]; then
  TEST_COUNT=$(find "$PROJECT_ROOT" \( -name "*.test.*" -o -name "*.spec.*" \) | head -51 | wc -l | tr -d ' ')
  if [ "$TEST_COUNT" -gt 50 ] || [ "$TEST_COUNT" -eq 0 ]; then
    exit 0
  fi
  RUN_ALL=true
else
  RUN_ALL=false
fi

# --- Run tests ---
cd "$PROJECT_ROOT"

if [ "$RUN_ALL" = true ]; then
  RESULT=$(npx vitest run --reporter=verbose 2>&1 | tail -30)
  EXIT_CODE=${PIPESTATUS[0]}
  SCOPE="all tests"
else
  REL_TEST="${TEST_FILE#$PROJECT_ROOT/}"
  RESULT=$(npx vitest run "$REL_TEST" --reporter=verbose 2>&1 | tail -30)
  EXIT_CODE=${PIPESTATUS[0]}
  SCOPE="$REL_TEST"
fi

# --- Report results via systemMessage ---
RESULT_TRUNCATED=$(echo "$RESULT" | tail -20)

if [ "$EXIT_CODE" -eq 0 ]; then
  printf '{"systemMessage": "[AsyncTest] PASS: %s (after editing %s)"}\n' "$SCOPE" "$REL_PATH"
else
  RESULT_ESCAPED=$(echo "$RESULT_TRUNCATED" | jq -Rs '.' | sed 's/^"//;s/"$//')
  printf '{"systemMessage": "[AsyncTest] FAIL: %s (after editing %s)\\n%s"}\n' \
    "$SCOPE" "$REL_PATH" "$RESULT_ESCAPED"
fi
