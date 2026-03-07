# Workstream B: Skill Reliability -- Implementation Plan

## Executive Summary

We have 58 indexed skills (19 SKILL.md files on disk, plus additional symlinked/installed skills), an existing 3-layer skill router (index at SessionStart, route at UserPromptSubmit, audit at Stop), and a rules-based `skill-usage.md` directive. Despite this infrastructure, skills still activate unreliably because:

1. **The router recommends but does not force** -- it outputs "Consider loading these skills" which Claude can ignore
2. **Keyword matching misses intent** -- 2-word minimum with bag-of-words matching has high false-negative rate
3. **58 skills exceeds the research sweet spot** of 20-30, increasing false triggers and token overhead
4. **Path-scoped rules would reduce context bloat** but the feature has critical bugs in user-level rules

This plan covers three items: upgrading the skill activation hook to a forced-eval pattern (Item 1), curating the skill inventory and adding quality gates (Item 2), and evaluating path-scoped conditional rules (Item 3).

---

## Item 1: Forced-Eval Skill Activation Hook

### Current State

**Existing infrastructure (3 layers):**

| Layer | Hook | Script | What It Does |
|-------|------|--------|-------------|
| 0 | SessionStart | `index-skills.sh` | Scans all SKILL.md files, builds `skill-index.json` (58 skills) |
| 2 | UserPromptSubmit | `route-skills.sh` | Keyword-matches prompt against index, recommends top 3 skills |
| 4 | Stop | `audit-skills.sh` | Post-session check: warns if code was written without loading any skills |

**Existing rule** (`~/.claude/rules/skill-usage.md`):
```
ALWAYS check for matching skills before responding to any task.
Invoke the Skill tool BEFORE generating responses, including clarifying questions.
```

**Problem evidence:** The research report cites Vercel data showing skills activate in only ~44% of matching cases without hooks. Our current approach -- a simple recommendation ("Consider loading these skills") plus a passive rule -- falls into the "simple hook" category that achieves only ~20% improvement over baseline (so roughly 53% activation). The stop-hook audit is retrospective only; it catches misses after the fact but cannot fix them.

The `route-skills.sh` script outputs a recommendation like:
```
[Skill Router] Relevant skills detected for this task:
- **debugging** (3 keyword matches: bug error test) -- Use when encountering any bug...
Consider loading these skills with the Skill tool if not already loaded.
```

This is advisory. Claude can and does ignore it.

### Proposed Changes

**Replace the advisory recommendation with a forced-eval commitment pattern.** Based on the diet103 showcase, umputun gist, and claudefa.st recipe, the forced-eval pattern works by injecting a mandatory instruction that requires Claude to explicitly state YES/NO per skill before proceeding.

#### 1. New hook script: `~/.claude/hooks/skill-router/forced-eval.sh`

```bash
#!/bin/bash
# Forced-Eval Skill Activation Hook
# Hook: UserPromptSubmit
# Replaces advisory route-skills.sh with mandatory skill evaluation
#
# Strategy: Instead of "consider loading," require Claude to evaluate
# each recommended skill with YES/NO reasoning before proceeding.
# This achieves 84% activation (vs 44% baseline, 53% advisory).

INDEX_FILE="${HOME}/.claude/hooks/skill-router/skill-index.json"
LOG_FILE="${HOME}/.claude/hooks/skill-router/recommendations.jsonl"

input=$(cat)

# Extract user prompt
prompt=$(echo "$input" | jq -r '.tool_input.prompt // .tool_input.message // .user_prompt // ""' 2>/dev/null)
if [ -z "$prompt" ] || [ "$prompt" = "null" ]; then
  prompt=$(echo "$input" | jq -r '.content // ""' 2>/dev/null)
fi
if [ -z "$prompt" ] || [ "$prompt" = "null" ]; then
  exit 0
fi

# Check if index exists
if [ ! -f "$INDEX_FILE" ]; then
  "${HOME}/.claude/hooks/skill-router/index-skills.sh" < /dev/null 2>/dev/null
  if [ ! -f "$INDEX_FILE" ]; then
    exit 0
  fi
fi

# Lowercase prompt for matching
prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

# Extract significant words (same as current router)
prompt_words=$(echo "$prompt_lower" | tr -cs '[:alnum:]' '\n' | awk 'length >= 3' | sort -u | grep -vxE '(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|has|his|how|its|may|new|now|old|see|way|who|did|get|let|say|she|too|use|with|this|that|from|have|been|will|more|when|what|some|them|than|also|just|like|into|over|such|take|very|most|only|come|made|after|being|here|much|many|does|your|each|about|would|could|should|before|between|those|these|other|which|their|there|where|still|every|while|might|through|going|right)')

# Extract skill data
skill_data=$(jq -r '.skills[] | select(.background != true) | [.name, .dir, .description, .search] | @tsv' "$INDEX_FILE")

results=""
while IFS=$'\t' read -r skill_name skill_dir skill_desc search_text; do
  [ -z "$skill_name" ] && continue
  match_count=0
  matched_words=""
  while IFS= read -r word; do
    [ -z "$word" ] && continue
    if echo "$search_text" | grep -qi "\b${word}"; then
      match_count=$((match_count + 1))
      matched_words="${matched_words} ${word}"
    fi
  done <<< "$prompt_words"
  if [ "$match_count" -ge 2 ]; then
    results="${results}${match_count}|${skill_name}|${skill_dir}|${skill_desc}|${matched_words}"$'\n'
  fi
done <<< "$skill_data"

# Sort by match count, take top 5 candidates
if [ -n "$results" ]; then
  top_matches=$(echo "$results" | sort -t'|' -k1 -nr | head -5)

  # Build forced-eval output
  output="SKILL ACTIVATION CHECK (MANDATORY)

The following skills matched your prompt. You MUST evaluate each one:
"
  while IFS='|' read -r count name dir desc words; do
    [ -z "$count" ] && continue
    output="${output}
- ${name} (${count} matches:${words}): ${desc}"
  done <<< "$top_matches"

  output="${output}

REQUIRED ACTION:
1. For each skill above, state: YES (relevant) or NO (not relevant) with one-line reason
2. For each YES skill, call Skill tool to load it BEFORE implementing
3. Only then proceed with your response

Do NOT skip this evaluation. Do NOT proceed without loading YES skills."

  # Log
  prompt_trunc=$(echo "$prompt" | head -c 200)
  printf '{"ts":"%s","prompt":"%s","type":"forced-eval","candidates":%d}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$(echo "$prompt_trunc" | jq -Rs '.' | sed 's/^"//;s/"$//')" \
    "$(echo "$top_matches" | grep -c .)" >> "$LOG_FILE" 2>/dev/null

  echo "$output"
fi

# --- Instinct Surfacing (preserved from current router) ---
# [keep existing instinct surfacing code unchanged]

exit 0
```

#### 2. Update `settings.json` UserPromptSubmit hook

Replace the current `route-skills.sh` reference with `forced-eval.sh`:

```json
"UserPromptSubmit": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "~/.claude/hooks/skill-router/forced-eval.sh",
        "timeout": 5000
      }
    ]
  }
]
```

#### 3. Update `skill-usage.md` rule

The current rule is passive ("ALWAYS check for matching skills"). With the forced-eval hook injecting a mandatory evaluation prompt, the rule should reinforce the commitment pattern rather than duplicating the instruction:

```markdown
# Skill Usage

When the Skill Router injects a SKILL ACTIVATION CHECK, follow it exactly:
1. Evaluate each candidate: YES or NO with reason
2. Load every YES skill via the Skill tool
3. Only then proceed with implementation

If no router check appears (simple questions, clarifications), proceed normally.
Skills loaded earlier in the session do not need reloading.
```

This is shorter (5 lines vs 14), reduces token cost, and works in concert with the hook rather than competing with it.

### Token Cost Analysis

**Current cost per prompt:** `route-skills.sh` outputs ~80-150 tokens when skills match, ~0 tokens when no match.

**Proposed cost per prompt:** `forced-eval.sh` outputs ~150-250 tokens when skills match (candidates list + mandatory instructions), ~0 tokens when no match. The forced-eval template adds ~80 tokens of instruction overhead beyond what the current router outputs.

**Net impact:** +80 tokens per matching prompt. With an estimated 40-60% of prompts triggering a match, this is ~32-48 tokens per prompt on average. At Opus pricing ($15/1M input), this costs approximately $0.0005 per prompt -- negligible.

**Risk: oversaturation.** With 58 skills, the hook may recommend 5 candidates on many prompts, adding ~250 tokens of candidates. This is manageable. The real risk is Claude spending output tokens evaluating 5 skills with YES/NO reasoning (~100 output tokens at $75/1M = $0.0075). This is still cheap, but worth monitoring.

**Mitigation:** Cap candidates at 3 (not 5) for the initial deployment. Only show candidates with 3+ word matches instead of 2+, reducing false positives.

### Verification

1. **Before/after activation measurement:**
   - Create a test set of 20 prompts where specific skills should activate
   - Run each prompt with the current router, record how many times the Skill tool is actually called
   - Deploy the forced-eval hook, re-run the same 20 prompts
   - Target: >80% activation rate (up from estimated ~50%)

2. **Log analysis:**
   - The `recommendations.jsonl` file already logs recommendations
   - Add a `type: "forced-eval"` field to distinguish from the old advisory format
   - After 1 week, analyze: what % of forced-eval prompts resulted in Skill tool calls?
   - Cross-reference with `audit-skills.sh` output at session end

3. **False positive monitoring:**
   - Review logs for prompts that triggered 4+ candidate skills
   - If >30% of prompts trigger candidates, the match threshold is too low

---

## Item 2: Skill Quality & Curation

### Current State: Full Skill Inventory

The skill index contains **58 skills**. From reading the SKILL.md files on disk (19) and the full `skill-index.json`, here is the complete inventory with quality assessment:

#### Capability Uplift Skills (fill model knowledge gaps -- may have retirement dates)

| Skill | Quality | Notes |
|-------|---------|-------|
| better-auth-core | HIGH | Well-structured framework reference. Retirement: when model training includes Better Auth docs |
| two-factor-authentication-best-practices | HIGH | Companion to better-auth-core |
| organization-best-practices | HIGH | Companion to better-auth-core |
| ai-sdk | HIGH | Vercel AI SDK reference. Retirement: when model training includes AI SDK v6+ |
| next-best-practices | HIGH | Background skill (auto-loads). Retirement: when model covers Next.js 16+ |
| next-cache-components | HIGH | Next.js 16 cache specifics |
| next-upgrade | MEDIUM | Narrow scope, useful when needed |
| openrouter-typescript-sdk | MEDIUM | Specific SDK reference |
| streamdock | HIGH | Device-specific, excellent trigger description |
| xlsx | HIGH | Excellent trigger specificity -- clear inclusion/exclusion criteria |
| pdf | HIGH | Similar quality to xlsx |
| pptx | HIGH | Similar quality to xlsx |
| docx | HIGH | Similar quality to xlsx |

#### Workflow/Preference Skills (encode process -- more durable)

| Skill | Quality | Notes |
|-------|---------|-------|
| coding-standards | HIGH | TypeScript patterns, well-structured |
| debugging | HIGH | Strong process enforcement |
| search-first | HIGH | Research-before-code workflow |
| skill-creator | HIGH | Meta-skill for creating skills |
| skill-stocktake | HIGH | Meta-skill for auditing skills |
| visual-explainer | HIGH | Clear trigger, extensive guidance |
| strategic-compact | MEDIUM | Useful but may overlap with hooks |
| continuous-learning-v2 | MEDIUM | Complex system, hooks do most work |
| writing-plans | MEDIUM | Useful process skill |
| executing-plans | MEDIUM | Companion to writing-plans |
| brainstorming | MEDIUM | Broad trigger ("any creative work") -- could be overly aggressive |
| requesting-code-review | MEDIUM | Process skill |
| receiving-code-review | MEDIUM | Process skill |
| finishing-a-development-branch | MEDIUM | Process skill |
| dogfood | MEDIUM | Narrow but well-defined |
| webapp-testing | MEDIUM | Playwright-based testing toolkit |

#### Knowledge/Architecture Skills

| Skill | Quality | Notes |
|-------|---------|-------|
| agent-harness-construction | HIGH | Well-structured, unique value |
| agentic-engineering | HIGH | Complements agent-harness |
| cost-aware-llm-pipeline | HIGH | Practical patterns |
| rag-pipeline | HIGH | Comprehensive reference |
| nodejs-api-patterns | HIGH | Well-structured Express patterns |
| regex-vs-llm-structured-text | HIGH | Decision framework |
| security-scan | HIGH | AgentShield integration |
| iterative-retrieval | MEDIUM | Background skill, useful pattern |

#### Meta/Infrastructure Skills

| Skill | Quality | Notes |
|-------|---------|-------|
| dispatching-parallel-agents | MEDIUM | Process guidance |
| parallel-feature-development | MEDIUM | Overlaps with dispatching-parallel-agents |
| multi-reviewer-patterns | MEDIUM | Overlaps with requesting-code-review |
| using-git-worktrees | MEDIUM | Process guidance |

#### Community/Installed Skills (from skills.sh or external sources)

| Skill | Quality | Notes |
|-------|---------|-------|
| responsive-design | Unknown | Not read -- installed skill |
| vector-index-tuning | Unknown | Not read -- installed skill |
| postgresql-table-design | Unknown | Not read -- installed skill |
| javascript-testing-patterns | Unknown | Not read -- installed skill |
| react-state-management | Unknown | Not read -- installed skill |
| accessibility-compliance | Unknown | Not read -- installed skill |
| interaction-design | Unknown | Not read -- installed skill |
| tailwind-design-system | Unknown | Not read -- installed skill |
| database-migration | Unknown | Not read -- installed skill |
| github-actions-templates | Unknown | Not read -- installed skill |
| supabase-postgres-best-practices | Unknown | Not read -- installed skill |
| frontend-design | Unknown | Not read -- installed skill |
| mcp-builder | Unknown | Not read -- installed skill |
| agentation | Unknown | Not read -- installed skill |
| agentation-self-driving | Unknown | Not read -- installed skill |

#### Self-Generated Skills (from continuous-learning)

| Skill | Quality | Concern |
|-------|---------|---------|
| directory-enumeration-reliability | LOW | Narrow learned pattern. SkillsBench shows self-generated skills degrade performance by -1.3pp on average |

### Problem Analysis

1. **58 skills exceeds the 20-30 sweet spot.** The research (geeky-gadgets.com) says more skills = more metadata tokens, conflicting instructions, and false triggers. Our index already shows symptoms: `vercel-react-patterns` has a broken description field (just `">"`), meaning the indexer parsed its YAML frontmatter incorrectly.

2. **Overlapping skills create confusion:**
   - `dispatching-parallel-agents` vs `parallel-feature-development` -- similar domain
   - `multi-reviewer-patterns` vs `requesting-code-review` vs `receiving-code-review` -- could be one skill
   - `writing-plans` vs `executing-plans` -- could be merged
   - `strategic-compact` vs the existing compaction hooks -- the hooks do most of the work

3. **No quality gate for skill creation.** The `skill-creator` skill has an eval/benchmark loop, but there is no enforcement. Anyone can create a skill without testing it.

4. **Self-generated skills are risky.** SkillsBench data: curated +16.2pp, self-generated -1.3pp. Our only self-generated skill (`directory-enumeration-reliability`) is a narrow workaround that could potentially interfere with Glob usage patterns.

5. **Broken index entries.** `vercel-react-patterns` has `description: ">"` in the index because its YAML frontmatter uses `description: >` (YAML multi-line scalar), which the bash-based indexer parses as a literal `>` character instead of reading the continuation lines.

### Proposed Changes

#### 1. Immediate Curation (reduce from 58 to ~35)

**Merge candidates:**
- Merge `dispatching-parallel-agents` + `parallel-feature-development` into a single "parallel-work" skill
- Merge `multi-reviewer-patterns` + `requesting-code-review` + `receiving-code-review` into a single "code-review" skill
- Merge `writing-plans` + `executing-plans` into a single "plans" skill

**Retire candidates:**
- `directory-enumeration-reliability` -- self-generated, narrow, risk of negative interference. The workaround (use `ls -la` instead of Glob for symlinks) should be a one-line note in CLAUDE.md, not a full skill
- `strategic-compact` -- the hooks already handle this; having a separate skill adds token cost without clear uplift

**Investigate candidates** (need to read these before deciding):
- All 15 community/installed skills should be audited via `/skill-stocktake`
- `brainstorming` -- "You MUST use this before any creative work" is extremely broad and may trigger on most prompts

**Fix broken entries:**
- Fix `vercel-react-patterns` YAML frontmatter parsing (either fix the YAML to use quoted string, or fix the indexer to handle multi-line scalars)

#### 2. Quality Gate for Skill Creation

Add to the `skill-creator` SKILL.md and to a new `~/.claude/rules/skill-quality.md`:

```markdown
# Skill Quality Gate

Before deploying any new skill:

1. DESCRIPTION TEST: The description must be a single sentence under 200 chars
2. TRIGGER TEST: Run 5 prompts that SHOULD trigger the skill, 5 that SHOULD NOT
   - Target: >80% true positive, <10% false positive
3. OVERLAP TEST: Grep existing skill descriptions for keyword overlap
   - If >50% keyword overlap with an existing skill, merge instead of creating
4. SIZE TEST: SKILL.md should be under 300 lines
   - Larger skills should be split or have sections in separate files

Skills from `continuous-learning` auto-generation are QUARANTINED in `skills/learned/`
until manually reviewed and promoted. They are NOT indexed by the skill router.
```

#### 3. Quarantine Self-Generated Skills

Modify `index-skills.sh` to skip `skills/learned/` by default:

```bash
# Skip self-generated skills unless promoted
skill_files=$(find -L "$SKILLS_DIR" -name "SKILL.md" -type f -not -path "*/learned/*" 2>/dev/null)
```

This prevents the -1.3pp degradation from self-generated skills while still preserving them for manual review and promotion.

#### 4. Skill Inventory Cap

Add to `skill-usage.md` or CLAUDE.md:

```
SKILL INVENTORY CAP: 30 user-invokable skills maximum.
When approaching this limit, run /skill-stocktake before adding new skills.
```

This is a soft cap enforced by the stocktake process, not a hard technical limit.

### Verification

1. **Run `/skill-stocktake full`** after implementing merges and retirements
2. **Count skills in index** -- target 30-35 after curation
3. **Monitor false positive rate** in `recommendations.jsonl` for 1 week
4. **Track the broken `vercel-react-patterns` entry** -- verify fix in index after re-indexing

---

## Item 3: Path-Specific Conditional Rules

### Current State

**All 5 rules in both staging and production:**

| Rule | File | Lines | Scope |
|------|------|-------|-------|
| `hard-stops.md` | Pre-commit blockers, universal rules | 32 | Universal |
| `safety.md` | Destructive command prevention, file deletion policy, research workspace safety | 125 | Universal |
| `testing.md` | Vitest, TDD, test quality | 53 | Could scope to test files |
| `skill-usage.md` | Skill activation directive | 14 | Universal |
| `verification.md` | Verification mindset, anti-patterns, regression testing | 74 | Universal |

**Total: 298 lines loaded on every prompt.**

### Feature Stability Assessment

**Version:** Claude Code 2.1.70 is installed. The paths frontmatter feature was introduced in v2.0.64+.

**Known bugs (as of March 2026):**

| Issue | Status | Impact | Workaround |
|-------|--------|--------|------------|
| [#21858](https://github.com/anthropics/claude-code/issues/21858): paths: in `~/.claude/rules/` is ignored | **OPEN** | **CRITICAL for us** -- our rules are all user-level | Use CSV format: `paths: "**/*.ts,**/*.tsx"` |
| [#16299](https://github.com/anthropics/claude-code/issues/16299): Path-scoped rules load globally | Open | Rules load even when no matching files | Monitor only |
| [#17204](https://github.com/anthropics/claude-code/issues/17204): YAML array syntax broken, CSV works | Open | Documentation shows broken syntax | Use CSV format |
| [#23569](https://github.com/anthropics/claude-code/issues/23569): Paths ignored in git worktrees | Open | Worktrees are heavily used in our config | No workaround |
| [#13905](https://github.com/anthropics/claude-code/issues/13905): Invalid YAML syntax in paths | Open | Related to #17204 | Use CSV format |

**Root cause identified** (issue #21858, comment by Johntycour, Feb 19, 2026): The `paths:` field is processed through a CSV parser that expects a string. When YAML returns an Array, the parser iterates array elements instead of characters, producing invalid concatenated globs that match nothing. The workaround is to use CSV format (`paths: "**/*.ts,**/*.tsx"`) instead of YAML array syntax.

**Critical finding: paths: works in user-level rules ONLY with CSV format, and ONLY on certain versions.** The issue reporter confirmed:

| Location | Syntax | Result |
|----------|--------|--------|
| `~/.claude/rules/` | CSV format | Works (with caveats) |
| `~/.claude/rules/` | YAML array | Fails silently |
| `./.claude/rules/` | CSV format | Works |
| In git worktrees | Any format | May fail (#23569) |

### Analysis: Should We Scope Any Rules?

Let me evaluate each rule for scoping potential:

**`hard-stops.md` (32 lines) -- KEEP UNIVERSAL**
- Pre-commit blockers apply regardless of file type
- "NEVER blame pre-existing errors" is always relevant
- No benefit to scoping

**`safety.md` (125 lines) -- KEEP UNIVERSAL**
- Destructive command prevention must always be active
- Research workspace safety rules are needed when cloning repos (any context)
- Secret leakage prevention is always relevant
- No benefit to scoping -- removing this from context when not editing code files creates security gaps

**`testing.md` (53 lines) -- COULD SCOPE but risky**
- Could scope to `**/*.test.{ts,tsx,js,jsx}` and `**/*.spec.{ts,tsx,js,jsx}`
- However: "Write failing test first" (TDD) needs to be active BEFORE the test file exists
- Scoping to test files means the rule loads AFTER you open a test file, not when you're about to create one
- The rule should be active during implementation work too (to trigger TDD)
- **Verdict: Keep universal.** The 53-line cost is not worth the scoping risk.

**`skill-usage.md` (14 lines) -- KEEP UNIVERSAL**
- Must be active on every prompt
- Only 14 lines, minimal token cost

**`verification.md` (74 lines) -- KEEP UNIVERSAL**
- Verification mindset applies to all work
- "Before ANY File Creation" applies everywhere
- "Workaround Escalation Rule" is always relevant

### Proposed Changes

**Recommendation: DO NOT implement path-scoped rules at this time.**

Reasons:

1. **All our rules are user-level (`~/.claude/rules/`).** Issue #21858 shows this is broken with YAML arrays and unreliable with CSV format. The underlying code bug is open with no fix timeline.

2. **Git worktree interaction is broken** (#23569). We use worktrees extensively. Path-scoped rules would silently fail in worktree sessions, creating inconsistent behavior.

3. **All 5 rules are genuinely universal.** After evaluating each rule, none have a clear scoping benefit that outweighs the risk. The only candidate (`testing.md`) would need to be active during non-test-file work to enforce TDD, defeating the purpose of scoping.

4. **Total context cost is only 298 lines (~1,200 tokens).** This is well under the "keep Tier 1 ruthlessly minimal (~500 tokens)" guideline when you consider that rules are separate from CLAUDE.md. The actual CLAUDE.md is already under 200 lines. Rules add overhead but it is modest.

5. **The feature is not production-ready for our use case.** Three separate bugs affect user-level rules, worktrees, and syntax parsing. Deploying conditional rules would create silent failures that are hard to debug.

### Alternative: Context Compression

Instead of path-scoping, we can reduce the token cost of always-loaded rules by compressing verbose rules:

**`safety.md`: 125 lines -> potential 80 lines**
- The "Dangerous Operations" table, "Cloud Infrastructure Safety" list, "Docker Safety" list, and "Git History Protection" list have significant overlap with the `settings.json` deny list. Since these commands are already blocked by hooks, the safety rule is redundant documentation for many items.
- Consider: trim to only items NOT enforced by hooks (e.g., DROP TABLE, SSH keys via Read tool, protected processes).

**`verification.md`: 74 lines -> potential 50 lines**
- The "Failure Patterns to Prevent" table overlaps with hard-stops.md
- "Regression Test Red-Green Verification" could be moved to testing.md

This is out of scope for Workstream B but worth noting as a follow-up.

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Path-scoped rules silently fail | HIGH | Rules not loaded when needed | Do not implement until bugs are fixed |
| Worktree sessions get different rules | HIGH | Inconsistent behavior across sessions | Do not implement until #23569 is fixed |
| Rule compression removes important context | LOW | Claude misses safety/verification directives | Test compressed rules before deploying |

### Verification (if implemented later)

When the bugs are fixed (monitor issues #21858, #23569, #16299):

1. **Test with `/memory`** -- verify the correct rules appear/disappear based on file context
2. **Test in worktrees** -- verify path-scoped rules load correctly in worktree sessions
3. **Test with YAML array vs CSV** -- verify both formats work
4. **Regression test** -- run a session editing TypeScript, verify testing.md loads; run a session editing markdown, verify it does NOT load

---

## Dependencies & Risks

| Risk | Item | Likelihood | Mitigation |
|------|------|-----------|------------|
| Forced-eval adds latency to every prompt | 1 | LOW | Hook runs in <50ms (pure bash + jq), comparable to current router |
| Forced-eval causes Claude to spend tokens on YES/NO analysis instead of actual work | 1 | MEDIUM | Monitor output token usage; if >150 tokens on skill eval, reduce candidates to 2 |
| Skill curation removes a skill someone uses | 2 | MEDIUM | Run `/skill-stocktake full` before any deletions; keep retired skills in an archive |
| Quarantining self-generated skills breaks continuous-learning flow | 2 | LOW | Quarantine only affects indexing, not creation; manual promotion is lightweight |
| Path-scoped rules silently fail | 3 | HIGH | Not implementing at this time |

**Cross-item dependency:** Item 2 (reducing skill count) directly helps Item 1 (fewer candidates = fewer false positives in forced-eval). Recommend implementing Item 2 before Item 1 for best results.

## Implementation Order

1. **Item 2 first: Skill curation** (2-3 hours)
   - Run `/skill-stocktake full` to audit all 58 skills
   - Execute merges (3 merge operations)
   - Retire self-generated skills to quarantine
   - Fix broken index entries
   - Verify count is 30-35

2. **Item 1 second: Forced-eval hook** (1-2 hours)
   - Write `forced-eval.sh` script
   - Update `settings.json` to replace `route-skills.sh`
   - Update `skill-usage.md` rule
   - Create 20-prompt test set for activation measurement
   - Run before/after comparison

3. **Item 3: Defer** (0 hours now, revisit quarterly)
   - Monitor GitHub issues #21858, #23569, #16299 for fixes
   - When all three are resolved, re-evaluate path-scoping for `testing.md`
   - Consider rule compression as an alternative in the meantime

## Estimated Scope

| Item | Files Changed | New Files | Complexity |
|------|--------------|-----------|------------|
| Item 1 | 2 (settings.json, skill-usage.md) | 1 (forced-eval.sh) | Low-Medium |
| Item 2 | 5-8 (merged SKILL.md files, index-skills.sh) | 0 | Medium (manual review needed) |
| Item 3 | 0 | 0 | None (deferred) |

Total: 3-5 hours of implementation, with Item 2 requiring the most judgment.
