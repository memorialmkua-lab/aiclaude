# Workstream C: CI-in-the-Loop — Implementation Plan

## Executive Summary

This workstream adds three capabilities that tighten the feedback loop between Claude's actions and quality signals:

1. **Async Background Test Runner** — PostToolUse hook runs tests after every file write without blocking Claude. Results arrive on the next conversation turn via `systemMessage`/`additionalContext`. Confirmed viable by official docs. **RECOMMEND: ADOPT for per-project configs, NOT global.**

2. **Agent-Based Stop Hooks** — `type: "prompt"` Stop hook evaluates completion before Claude stops. **RECOMMEND: ADOPT a lightweight `type: "prompt"` hook, NOT `type: "agent"`.** The agent variant is too expensive for the marginal benefit. The prompt variant costs one Haiku call per stop and is sufficient.

3. **Context Threshold Awareness** — Detecting when we approach the 60% quality degradation threshold. **RECOMMEND: INCREMENTAL IMPROVEMENT to existing infrastructure.** The StatusLine `context-monitor.sh` already receives live `context_window.used_percentage`. We cannot get this data in other hooks (confirmed feature gap — issue #24320 closed). Best path: improve the StatusLine monitor with threshold warnings and enhance the strategic-compact tool call counter.

---

## Item 1: Async Background Test Runner

### Current State

**Existing test infrastructure:**
- Testing rules mandate Vitest (`staging/rules/testing.md`)
- No existing hooks run tests automatically
- PostToolUse hooks currently run: Prettier formatting (sync), TypeScript type checking (sync, 30s timeout), console.log warnings (sync), session tracking (async), and continuous learning observer (async)
- The Prettier and tsc hooks fire on `.ts`/`.tsx`/`.js`/`.jsx` file edits only
- No Write-tool triggered hooks for testing exist

**Existing patterns to follow:**
- The tsc hook already demonstrates the pattern: extract `file_path` from JSON input, find project root by walking up to `package.json`, run a check, report results via stderr
- The inline hook scripts in settings.json work but are harder to maintain than external scripts

### Official Documentation Findings

**Async behavior (confirmed via [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks)):**

1. `"async": true` is ONLY available on `type: "command"` hooks (not prompt/agent/http)
2. When an async hook fires, Claude Code starts the process and **immediately continues** without waiting
3. The hook receives the same JSON input via stdin as sync hooks
4. After the background process exits, if it produces JSON with `systemMessage` or `additionalContext`, that content is **delivered to Claude on the next conversation turn**
5. If the session is idle, the response waits until the next user interaction
6. **Async hooks CANNOT block or control** — `decision`, `permissionDecision`, and `continue` fields have no effect
7. Each execution creates a separate background process — no deduplication across firings
8. Default timeout: 600 seconds (10 minutes). Configurable via `timeout` field

**PostToolUse JSON input format (confirmed):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

**Matcher syntax for Write and Edit (confirmed):**
- Use `"matcher": "Edit|Write"` — matcher is a regex, `|` is alternation
- The matcher runs against `tool_name` field

**Result delivery mechanism (confirmed):**
- JSON stdout with `systemMessage` field: shown as a system message to Claude
- JSON stdout with `additionalContext` field: added more discretely as context
- Plain text stdout: added as context (but only for UserPromptSubmit and SessionStart)
- For async PostToolUse hooks, must use JSON format with `systemMessage` or `additionalContext`

**Official example from docs (verbatim):**
```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.js ]]; then
  exit 0
fi

RESULT=$(npm test 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "{\"systemMessage\": \"Tests passed after editing $FILE_PATH\"}"
else
  echo "{\"systemMessage\": \"Tests failed after editing $FILE_PATH: $RESULT\"}"
fi
```

### Proposed Changes

**Decision: Per-project hook, NOT global.**

The user works on multiple projects. Some use Vitest, some may not have tests at all. Running `npx vitest run` in a project without Vitest would fail silently (best case) or produce confusing errors (worst case). This should be added per-project in `.claude/settings.json`, not globally in `~/.claude/settings.json`.

**However**, we can create a global hook script that is *project-aware* — it checks whether Vitest is available and finds relevant test files before running. This script lives globally but is referenced from per-project configs.

#### Hook Script: `~/.claude/hooks/ci/async-test-runner.sh`

```bash
#!/bin/bash
# Async Background Test Runner
# PostToolUse hook (async: true) — runs related tests after file writes.
# Results delivered via systemMessage on next conversation turn.
#
# Project-aware: detects test framework, finds related test files.
# Safe: exits silently for non-code files, projects without tests, or missing frameworks.
#
# Hook config (per-project .claude/settings.json):
# {
#   "hooks": {
#     "PostToolUse": [{
#       "matcher": "Edit|Write",
#       "hooks": [{
#         "type": "command",
#         "command": "~/.claude/hooks/ci/async-test-runner.sh",
#         "async": true,
#         "timeout": 120
#       }]
#     }]
#   }
# }

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

# --- Detect test framework ---
# Check for vitest in package.json (devDependencies or dependencies)
HAS_VITEST=$(jq -r '
  (.devDependencies.vitest // .dependencies.vitest // empty)
' "$PROJECT_ROOT/package.json" 2>/dev/null)

if [ -z "$HAS_VITEST" ]; then
  exit 0
fi

# --- Find related test files ---
# Strategy: look for <filename>.test.ts, <filename>.spec.ts, etc.
FILENAME=$(basename "$FILE_PATH")
STEM="${FILENAME%.*}"
EXT="${FILENAME##*.}"
FILE_DIR=$(dirname "$FILE_PATH")

# Relative path from project root (for display)
REL_PATH="${FILE_PATH#$PROJECT_ROOT/}"

# Search for test files matching the source file
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

# If no specific test file found, run the full suite (but only if project is small)
# Count test files to decide: if >50 test files, skip (too slow for async)
if [ -z "$TEST_FILE" ]; then
  TEST_COUNT=$(find "$PROJECT_ROOT" -name "*.test.*" -o -name "*.spec.*" | head -51 | wc -l | tr -d ' ')
  if [ "$TEST_COUNT" -gt 50 ]; then
    # Too many tests, no specific match — skip silently
    exit 0
  fi
  # Small project: run all tests
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

# --- Report results ---
# Truncate output to prevent oversized systemMessage
RESULT_TRUNCATED=$(echo "$RESULT" | tail -20)

# Escape for JSON
RESULT_JSON=$(echo "$RESULT_TRUNCATED" | jq -Rs '.')

if [ "$EXIT_CODE" -eq 0 ]; then
  printf '{"systemMessage": "[AsyncTest] PASS: %s (after editing %s)"}\n' "$SCOPE" "$REL_PATH"
else
  printf '{"systemMessage": "[AsyncTest] FAIL: %s (after editing %s)\\n%s"}\n' \
    "$SCOPE" "$REL_PATH" "$(echo "$RESULT_TRUNCATED" | jq -Rs '.' | sed 's/^"//;s/"$//')"
fi
```

#### Settings.json Entry (per-project)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/ci/async-test-runner.sh",
            "async": true,
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

#### Global Settings.json Entry (alternative — run everywhere)

If the user prefers a global approach, the script above is already project-aware (exits silently if no Vitest). The global entry would go in `~/.claude/settings.json` alongside existing hooks:

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "~/.claude/hooks/ci/async-test-runner.sh",
      "async": true,
      "timeout": 120
    }
  ]
}
```

This would be added to the existing `PostToolUse` array.

### Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No tests for changed file | If project has <50 test files: run all. If >50: skip silently. |
| Non-code files (markdown, config) | Filtered by extension guard. Only `.ts/.tsx/.js/.jsx` proceed. |
| Test file itself is edited | Skipped by the `*.test.*|*.spec.*` guard. Prevents test-triggers-test loops. |
| Large test output | Truncated to last 20 lines before JSON encoding. |
| Project without Vitest | Script checks `package.json` for vitest dependency. Exits silently if absent. |
| No package.json (not a Node project) | Walks up to `/`, fails to find, exits silently. |
| Multiple rapid edits (e.g., Edit 5 files in sequence) | Each fires a separate async process. No deduplication (per official docs). This is the main concern — 5 consecutive edits spawn 5 test runs. Mitigation: use a lockfile to skip if a run is already in progress. |
| Config files (tsconfig.json, etc.) | Filtered by basename guard. |
| Generated type files (*.d.ts) | Filtered by basename guard. |

**Deduplication concern:** The official docs confirm "each execution creates a separate background process — no deduplication." For rapid consecutive edits, we should add a lockfile mechanism:

```bash
LOCK_FILE="/tmp/claude-test-runner-${PROJECT_ROOT//\//_}.lock"
if [ -f "$LOCK_FILE" ]; then
  # Check if lock is stale (>120s old)
  LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK_FILE" 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 120 ]; then
    exit 0  # Another test run is in progress
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT
```

### Cost & Performance

| Metric | Impact |
|--------|--------|
| Latency to Claude | **Zero** — async hooks don't block |
| CPU/IO per invocation | One `npx vitest run` process (~2-30s depending on project) |
| Context tokens added | ~50-200 tokens per systemMessage delivery |
| Risk of noise | Low if tests are fast. High if tests are slow and multiple fire. |
| Deduplication | Not built-in. Must be handled by lockfile. |

### Verification

After implementation:
1. Edit a `.ts` file in a project with Vitest and test files
2. Verify Claude continues immediately (not blocked)
3. Wait for test results to appear on next conversation turn
4. Verify the systemMessage contains pass/fail status
5. Edit a non-code file — verify no test run fires
6. Edit in a project without Vitest — verify silent exit

---

## Item 2: Agent-Based Stop Hooks

### Current State

**How Claude currently decides to stop:**
- Claude stops responding when it believes the task is complete
- The existing Stop hooks (4 total) run side-effect tasks:
  1. Console.log checker — warns about uncommitted console.log in modified files
  2. Memory persistence — saves session file (`session-end.sh`)
  3. Skill audit — warns if code was written without loading any skills
  4. Session analyzer — detects error patterns, retry sequences, writes to `learned/`
- None of these *block* Claude from stopping — they all `exit 0`
- The skill audit hook already checks `stop_hook_active` to prevent infinite loops

**Existing verification infrastructure:**
- The `staging/rules/verification.md` has extensive checks ("Before Claiming Task Complete")
- These are *passive rules* — they depend on Claude following instructions, not enforcement
- The `staging/rules/hard-stops.md` lists commit blockers (no TODOs, no console.log, etc.)

### Official Documentation Findings

**Stop hook mechanics (confirmed via [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks)):**

1. **Stop input JSON includes:**
   - `stop_hook_active` (boolean) — `true` when Claude is already continuing as a result of a previous stop hook block
   - `last_assistant_message` (string) — text content of Claude's final response (no need to parse transcript)
   - Standard fields: `session_id`, `transcript_path`, `cwd`, `permission_mode`

2. **Stop decision control:**
   - `decision: "block"` prevents Claude from stopping
   - `reason` is REQUIRED when blocking — tells Claude why it should continue
   - Omit `decision` or exit 0 to allow stopping

3. **Infinite loop prevention:**
   - `stop_hook_active: true` means Claude was already forced to continue by a hook
   - Hooks MUST check this flag and exit 0 if true, otherwise Claude runs indefinitely
   - The existing `audit-skills.sh` already demonstrates this pattern correctly

4. **`type: "prompt"` handler:**
   - Sends hook input + your prompt to a **fast Claude model (Haiku by default)**
   - Model responds with `{"ok": true}` or `{"ok": false, "reason": "explanation"}`
   - `reason` is shown to Claude as its next instruction
   - Default timeout: 30 seconds
   - Use `$ARGUMENTS` placeholder in prompt to inject hook input JSON
   - Model can be overridden with `model` field

5. **`type: "agent"` handler:**
   - Spawns a subagent with Read, Grep, Glob, Bash tools
   - Up to 50 tool-use turns
   - Same `{"ok": true/false}` response format
   - Default timeout: 60 seconds
   - Uses a fast model by default (can override)

### Cost-Benefit Analysis

| Factor | `type: "prompt"` | `type: "agent"` |
|--------|-------------------|-------------------|
| Cost per invocation | 1 Haiku call (~$0.001) | Up to 50 tool calls + LLM turns (~$0.05-0.50) |
| Latency | ~2-5 seconds | ~15-120 seconds |
| Accuracy | Moderate — can only evaluate the `last_assistant_message` and hook input | High — can read files, run tests, grep codebase |
| False positive risk | Moderate — Haiku may misjudge completion | Lower — can verify empirically |
| Context cost | ~500 tokens for the prompt evaluation | 0 direct (runs in subagent), but blocks main session |
| Fires every time Claude stops | Yes — including mid-task pauses, follow-up questions | Yes |

**Is this solving a real problem?**

Premature stopping is a real issue, but its frequency depends on the task:
- Simple tasks: Claude stops correctly ~95% of the time
- Complex multi-step tasks: Claude sometimes stops after completing part of the work, missing later steps
- The `/autonomous` workflow already has phase checkpoints that mitigate this
- The biggest risk is false positives — blocking Claude from stopping when it legitimately should

**Recommendation: Use `type: "prompt"` — the cheaper option.**

The agent variant is 50-500x more expensive per invocation and adds 15-120s latency on every stop. The prompt variant can evaluate `last_assistant_message` for obvious incompletion signals ("I'll do that next", "TODO", partial lists) at negligible cost.

### Proposed Changes

#### Settings.json Entry

Add to the `Stop` hooks array in `~/.claude/settings.json`:

```json
{
  "hooks": [
    {
      "type": "prompt",
      "prompt": "You are evaluating whether Claude Code should stop working. The following is Claude's last message and session context.\n\nContext: $ARGUMENTS\n\nCheck these conditions:\n1. Did Claude explicitly say it completed the user's request, or did it stop mid-task?\n2. Does the last message contain incomplete lists, TODOs, or 'I will do X next' language?\n3. Are there obvious unfinished items mentioned but not addressed?\n\nIMPORTANT: If stop_hook_active is true in the context, respond {\"ok\": true} immediately — do not block.\nIMPORTANT: If Claude asked the user a question or is waiting for input, respond {\"ok\": true}.\nIMPORTANT: Bias toward allowing stops. Only block if there is CLEAR evidence of incomplete work.\n\nRespond with JSON: {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"Brief description of what remains\"} to continue.",
      "timeout": 15
    }
  ]
}
```

**Key design decisions:**

1. **No `stop_hook_active` check in the prompt itself** — The official docs show `stop_hook_active` is in the JSON input that gets injected via `$ARGUMENTS`. The prompt instructs the model to check this field and allow stopping if true. This is critical for infinite loop prevention.

2. **Bias toward allowing stops** — False positives (blocking legitimate stops) are worse than false negatives (missing an incomplete task). The user can always tell Claude to continue.

3. **Short timeout (15s)** — Haiku should respond in <5s. The 15s timeout is generous enough to handle cold starts.

4. **No agent type** — The prompt hook cannot read files or run commands, but it CAN evaluate the `last_assistant_message` which contains Claude's final response text. For most incompletion cases, this text contains the signal ("I'll implement the remaining..." or a partial list).

**What it catches:**
- Claude saying "I'll do X, Y, Z next" but then stopping
- Partial implementations where Claude lists what it did and what remains
- Claude stopping after exploration without making the requested changes

**What it does NOT catch:**
- Silent omissions (Claude thinks it's done but missed something)
- Failing tests (the async test runner handles this separately)
- Uncommitted changes (the existing console.log checker partially covers this)

#### Alternative: Command-based Stop Hook (simpler, no LLM cost)

If the LLM cost is a concern (even at ~$0.001/invocation), a simpler bash-based check:

```bash
#!/bin/bash
INPUT=$(cat)

# Prevent infinite loops
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""')

# Check for obvious incompletion signals
if echo "$LAST_MSG" | grep -qiE '(I will (do|implement|add|fix|update|create|write).*(next|later|after)|TODO:|FIXME:|remaining (steps|tasks|items)|not yet (implemented|done|completed))'; then
  echo '{"decision": "block", "reason": "Your last message indicates unfinished work. Please complete the remaining items before stopping."}'
  exit 0
fi

exit 0
```

This is free, fast (~10ms), and catches the most obvious cases. But it misses subtle signals that a prompt hook would catch.

**Recommendation: Start with the command-based approach. Upgrade to prompt-based if false negatives are a real problem in practice.**

### Verification

After implementation:
1. Give Claude a multi-step task, observe if it stops prematurely
2. Verify that `stop_hook_active` check prevents infinite loops
3. Verify that questions to the user are NOT blocked
4. Verify that legitimate task completion is NOT blocked
5. Check latency impact — the stop should not feel sluggish

---

## Item 3: Context Threshold Awareness

### Current State

**Existing context management infrastructure:**

1. **StatusLine monitor** (`staging/hooks/compaction/context-monitor.sh`):
   - Already receives `context_window.used_percentage` from Claude Code
   - Displays `ctx XX%` in the status bar
   - Shows `[compact soon]` at 85%+
   - This is the ONLY hook that receives live context metrics

2. **Strategic compact suggester** (`staging/hooks/strategic-compact/suggest-compact.sh`):
   - Counts tool calls per session (using counter file in `/tmp/`)
   - Suggests `/compact` at 50 tool calls, then every 25 calls thereafter
   - Fires on PreToolUse for Edit/Write only
   - Uses tool call count as a *proxy* for context growth

3. **PreCompact hook** (`staging/hooks/compaction/pre-compact.py`):
   - Fires when compaction actually happens (manual or auto)
   - Extracts structured state from transcript
   - Writes handoff document to `~/.claude/compaction/handoff.md`

4. **Compact recovery** (`staging/hooks/compaction/compact-recovery.sh`):
   - SessionStart hook with `compact` matcher
   - Reads handoff file and injects into post-compaction context

5. **RESEARCH.md Quality Degradation Map:**
   ```
   | Context % | Quality       | Recommendation            |
   |-----------|---------------|---------------------------|
   | 0-40%     | Excellent     | Optimal zone              |
   | 40-60%    | Good          | Still effective            |
   | 60-80%    | Degrading     | Start being selective      |
   | 80-95%    | Poor          | Manual compaction needed   |
   | 95-100%   | Critical      | "The last 20% is poison"  |
   ```

### Feature Gap Analysis

**What IS possible:**
- StatusLine receives `context_window.used_percentage` — confirmed in the existing `context-monitor.sh` script
- StatusLine fires after every assistant message — frequent enough for monitoring
- PreCompact fires at auto-compaction threshold (~83.5% per recent data) — this is a signal that we hit the danger zone

**What is NOT possible (confirmed feature gap):**
- No other hook type receives context window metrics — not PreToolUse, not PostToolUse, not UserPromptSubmit
- GitHub issue #24320 ("[FEATURE] Context threshold hooks to auto-trigger skills at 70%") was filed Feb 9, 2026 and is now closed — the feature was NOT implemented as requested
- GitHub issue #28962 ("Feature: Context window usage indicator with threshold alerts") exists as another request
- Issue #23711 ("Configurable context compaction threshold") also requests this
- There is no way to programmatically trigger compaction from a hook — `/compact` is a user command
- Hooks cannot inject instructions that say "run /compact now" — they can only add context that Claude might act on

**Key constraint:** The StatusLine hook runs `~/.claude/hooks/compaction/context-monitor.sh` and CAN see context percentage, but StatusLine output goes to the **status bar display only** — it is NOT injected into Claude's context. StatusLine is purely visual.

**What this means:** We cannot automatically trigger any action based on context percentage. We can only:
1. Warn the user visually (StatusLine — already done)
2. Use proxy signals (tool call count — already done via strategic-compact)
3. Add instructions to CLAUDE.md saying "compact proactively" (passive, already done)
4. Use PreCompact as a reactive signal (fires after the threshold is hit, not before)

### Proposed Workarounds

#### Workaround 1: Enhanced StatusLine Monitor (improve existing)

The current monitor shows `ctx 72%` but doesn't differentiate between OK and degrading zones. Improvement:

```bash
#!/bin/bash
input=$(cat)
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty' 2>/dev/null)

if [ -z "$used" ] || [ "$used" = "null" ]; then
  exit 0
fi

used_int=${used%.*}

if [ "$used_int" -ge 85 ]; then
  echo "CTX ${used_int}% COMPACT NOW"
elif [ "$used_int" -ge 70 ]; then
  echo "ctx ${used_int}% [quality degrading]"
elif [ "$used_int" -ge 60 ]; then
  echo "ctx ${used_int}% [approaching threshold]"
else
  echo "ctx ${used_int}%"
fi
```

**Value: Minimal.** This just changes display text. The user already sees the percentage.

#### Workaround 2: Tool-Call-Based Phase Detection (improve existing)

The strategic-compact suggester currently uses a fixed threshold (50 calls). We can make it smarter by correlating tool call count with typical context consumption:

- Average tokens per tool call: ~500-2000 (depending on tool)
- 200K context window × 60% threshold = 120K tokens
- ~120K / ~1000 avg = ~120 tool calls to reach the danger zone
- Current threshold of 50 is conservative (which is good)

**No change needed.** The existing 50-call threshold with 25-call repeats is already well-calibrated. It fires its warning via stderr which Claude can see.

#### Workaround 3: PreCompact as Quality Gate

The PreCompact hook fires when compaction happens. We could enhance it to write a more aggressive "quality is degraded" warning:

**Problem:** PreCompact fires AFTER the decision to compact is made. By definition, we're already at 83.5%+ when it fires. The handoff is the correct response at this point, and the existing `pre-compact.py` already handles this well.

**No change needed.** The existing implementation is solid.

#### Workaround 4: CLAUDE.md Passive Instruction

Add to CLAUDE.md:

```
## Context Management

Monitor the context percentage in the status bar. When context exceeds 60%:
- Be more selective about what you read (use targeted Grep over full Read)
- Prefer on-demand skills over loading large reference documents
- Consider suggesting /compact at logical phase boundaries
- Do NOT load full files when you only need specific sections
```

**This is already effectively covered** by:
- The strategic-compact skill's compaction decision guide
- The compact instructions in CLAUDE.md
- The skills-based on-demand loading architecture (validated by the 60% threshold research)

#### Workaround 5: StatusLine Context Percentage to File Bridge

Write the StatusLine percentage to a file, then read it from other hooks:

```bash
# In context-monitor.sh (StatusLine):
echo "$used_int" > /tmp/claude-context-pct-${SESSION_ID}

# In any PreToolUse hook:
PCT=$(cat /tmp/claude-context-pct-* 2>/dev/null | sort -n | tail -1)
if [ "${PCT:-0}" -ge 70 ]; then
  echo "[ContextWarning] Context at ${PCT}% — quality degrades above 60%. Consider /compact." >&2
fi
```

**Problem:** The StatusLine hook does not receive `session_id` in its input — it only gets `context_window` metrics. We would need to use a global file or guess the session. Also, PreToolUse stderr warnings add noise to every tool call.

**Verdict: Fragile, not recommended.** The file-based bridge between StatusLine and other hooks is an unreliable coupling.

### Recommended Approach

**Do nothing dramatic. The existing infrastructure is already well-positioned:**

1. The StatusLine monitor shows context percentage visually
2. The strategic-compact hook suggests compaction at tool-call thresholds
3. The PreCompact hook captures state before compaction
4. The compact-recovery hook restores state after compaction
5. The skills architecture prevents unnecessary context loading
6. The CLAUDE.md compact instructions guide behavior

**One small improvement worth making:** Update the StatusLine monitor to show more actionable text at the 60-70% zone:

```bash
if [ "$used_int" -ge 85 ]; then
  echo "ctx ${used_int}% [COMPACT NOW - quality degraded]"
elif [ "$used_int" -ge 70 ]; then
  echo "ctx ${used_int}% [quality degrading - compact at next phase boundary]"
elif [ "$used_int" -ge 60 ]; then
  echo "ctx ${used_int}% [approaching 60% threshold]"
else
  echo "ctx ${used_int}%"
fi
```

**One rule addition:** Add to `staging/rules/verification.md` or a new context management rule:

```markdown
## Context Window Hygiene

- Watch the status bar context percentage
- Above 60%: stop loading full files, use targeted Grep, prefer skill summaries over raw docs
- Above 70%: compact at the next logical phase boundary (never mid-implementation)
- Above 85%: compact immediately unless in the middle of a critical operation
```

### Verification

After implementation:
1. Confirm StatusLine displays updated threshold messages
2. Monitor a long session and verify the 60% warning appears at the right time
3. Verify the strategic-compact hook still fires at 50 tool calls
4. Verify that no hook attempts to programmatically trigger compaction (it cannot)

---

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Async test runner fires 5x for rapid consecutive edits | 5 parallel vitest processes consume CPU | Add lockfile-based deduplication |
| Stop hook false positives block Claude from stopping | User frustration, wasted tokens | Bias prompt toward allowing stops. Always check `stop_hook_active`. |
| Stop hook adds latency to every stop | 2-5s delay on every completion | Use command-based (10ms) initially, upgrade to prompt-based only if needed |
| Test runner output too large for systemMessage | Truncated or garbled JSON | Tail to last 20 lines, JSON-escape properly |
| Context threshold hooks never shipped | No automated quality gates at 60% | Accept as feature gap, rely on existing proxy mechanisms |
| Vitest not installed in some projects | Script errors or hangs | Check package.json for vitest before attempting to run |

## Implementation Order

1. **Item 1 (Async Test Runner)** — Highest value, lowest risk. Write the script, test in one project, then make available globally. ~1 hour.

2. **Item 2 (Stop Hook — command-based)** — Moderate value, low risk. Start with the simple regex-based command hook. Upgrade to prompt-based later if needed. ~30 minutes.

3. **Item 3 (Context Threshold)** — Lowest marginal value (infrastructure already covers 80% of the need). Update StatusLine text and add one rule. ~15 minutes.

## Estimated Scope

| Item | New Files | Modified Files | Complexity |
|------|-----------|---------------|------------|
| Async Test Runner | 1 script (`~/.claude/hooks/ci/async-test-runner.sh`) | Per-project `.claude/settings.json` | Medium — needs testing across projects |
| Stop Hook (command) | 1 script (`~/.claude/hooks/ci/stop-completeness-check.sh`) | `staging/settings.json` (add to Stop array) | Low |
| Stop Hook (prompt, if upgrading) | 0 scripts | `staging/settings.json` (add to Stop array) | Low |
| Context Threshold | 0 new files | `staging/hooks/compaction/context-monitor.sh`, `staging/rules/verification.md` | Low |

**Total: 2 new scripts, 2-3 modified files, ~2 hours of implementation + testing.**

---

## Sources Consulted

- [Claude Code Hooks Reference (official)](https://code.claude.com/docs/en/hooks) — Primary source for all hook mechanics
- [Claude Code Hooks Guide (official)](https://code.claude.com/docs/en/hooks-guide) — Setup walkthrough
- [Async Hooks Blog Post](https://blog.devgenius.io/claude-code-async-hooks-what-they-are-and-when-to-use-them-61b21cd71aad) — Practical async patterns
- [Claude Code Stop Hook: Force Task Completion](https://claudefa.st/blog/tools/hooks/stop-hook-task-enforcement) — Stop hook patterns
- [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) — Reference implementations
- [blader/taskmaster](https://github.com/blader/taskmaster) — Stop hook for task completion enforcement
- [GitHub Issue #24320](https://github.com/anthropics/claude-code/issues/24320) — Context threshold hooks feature request (closed)
- [GitHub Issue #28962](https://github.com/anthropics/claude-code/issues/28962) — Context window usage indicator request
- [Context Buffer Management](https://claudefa.st/blog/guide/mechanics/context-buffer-management) — Auto-compaction thresholds
- [StatusLine Documentation](https://code.claude.com/docs/en/statusline) — StatusLine configuration
- [Claude Code Production Patterns](https://www.marc0.dev/en/blog/claude-code-hooks-production-patterns-async-setup-guide-1770480024093) — Async hook patterns
