# Everything Claude Code - Project Review Report

**Date:** 2026-03-15
**Review Team:** 5 parallel AI agents (Architecture, Code Quality, Security, Documentation, Content Quality)
**Overall Rating: 8/10** — A well-structured, production-quality plugin with solid fundamentals. Key areas for improvement are consistency, discoverability, and a missing dependency.

---

## Executive Summary

| Dimension | Rating | Key Finding |
|-----------|--------|-------------|
| Architecture | 8.5/10 | Clean separation of concerns; 17 commands missing YAML frontmatter |
| Code Quality & Tests | 7.5/10 | 91.5% test pass rate; `ajv` dependency missing causes 55 failures |
| Security | 8/10 | Good practices overall; shell injection risks in tmux hooks |
| Documentation | 7/10 | Core docs solid; 10+ directories undocumented in CLAUDE.md |
| Content Quality | 8.2/10 | Excellent prompt engineering; 65 commands & 130 skills lack discoverability |

---

## CRITICAL Issues (Fix First)

### 1. Missing `ajv` Dependency — 55 Test Failures
- **Impact:** `tests/ci/validators.test.js` (55 fail), `tests/lib/install-state.test.js` (9 fail), `tests/lib/install-manifests.test.js` (10 fail)
- **Root Cause:** `ajv` is required in `scripts/ci/validate-hooks.js` (line 9) and `scripts/lib/install-state.js` (line 3) but not listed in `package.json`
- **Fix:** `npm install ajv --save`

### 2. 17 Commands Missing YAML Frontmatter
- **Impact:** Commands won't be recognized by Claude Code's command parser
- **Files:** `build-fix.md`, `checkpoint.md`, `code-review.md`, `eval.md`, `harness-audit.md`, `learn.md`, `loop-start.md`, `loop-status.md`, `model-route.md`, `orchestrate.md`, `quality-gate.md`, `refactor-clean.md`, `sessions.md`, `test-coverage.md`, `update-codemaps.md`, `update-docs.md`, `verify.md`
- **Expected format:**
  ```yaml
  ---
  description: What this command does
  ---
  ```

### 3. Shell Command Injection in `auto-tmux-dev.js`
- **File:** `scripts/hooks/auto-tmux-dev.js` (lines 63, 75)
- **Issue:** `sessionName` appears unquoted in echo/tmux commands; Windows `cmd /k` escaping only handles `"` but not `^`, `%`, `!`, `&`, `|`, `<`, `>`
- **Fix:** Quote all variable expansions; use proper Windows escaping

---

## HIGH Issues

### 4. Agent Responsibility Overlap
- `code-reviewer.md` includes security checklists (lines 32-44) that overlap with `security-reviewer.md`
- Language-specific reviewers (`go-reviewer`, `python-reviewer`, `kotlin-reviewer`) also overlap
- **Recommendation:** Add a "Review Orchestration" section to CLAUDE.md clarifying invocation order

### 5. CLAUDE.md Missing 10+ Directories
- Undocumented: `contexts/`, `manifests/`, `schemas/`, `plugins/`, `examples/`, `docs/`, `assets/`, `.agents/`, `.codex/`, `.cursor/`, `.opencode/`
- Component counts outdated: says "16 agents" (actual: 18), doesn't mention 48 commands or 108 skills

### 6. MCP Config Placeholder Credentials
- **File:** `mcp-configs/mcp-servers.json` (lines 7, 15, 21, 73, 106, 114, 122, 135-137)
- Contains `YOUR_*_HERE` placeholders that could be accidentally committed with real credentials
- **Recommendation:** Add validation script to reject placeholder values; document env var approach

### 7. Environment Variable Leakage in Hooks
- **Files:** `scripts/hooks/insaits-security-wrapper.js` (line 48), `scripts/hooks/run-with-flags.js` (line 106)
- Full `process.env` passed to child processes, exposing all secrets to hook scripts
- **Fix:** Allowlist safe env vars: `{ PATH, HOME, NODE_ENV, ... }`

---

## MEDIUM Issues

### 8. Agent Frontmatter Issues
- `agents/harness-optimizer.md` and `agents/loop-operator.md`: minimal documentation, vague trigger conditions
- Both also have optional `color` field that may cause parsing issues in some harnesses

### 9. Skill Organization — No Index or Categories
- 108 skills with no master index or category grouping
- Business domain skills (`energy-procurement`, `customs-trade-compliance`) mixed with technical skills
- 5 skills missing "When to Activate" section: `enterprise-agent-ops`, `ai-first-engineering`, `search-first`, `skill-stocktake`, `e2e-testing`
- Inconsistent section naming: "When to Activate" vs "When to Use"

### 10. Untested Scripts
- `scripts/orchestrate-worktrees.js` — no test file exists
- `scripts/lib/orchestration-session.js` — no test coverage found

### 11. Silent Error Handling in Utils
- **File:** `scripts/lib/utils.js`
- `readFile()` (line 284-288) returns `null` on any error — can't distinguish "file missing" from "permission denied"
- `findFiles()` (line 188-190) silently ignores permission errors

### 12. Duplicate Path Resolution Logic
- Three modules independently walk filesystem for project root:
  - `scripts/lib/resolve-formatter.js` (`findProjectRoot`)
  - `scripts/lib/project-detect.js` (`fileExists`)
  - `scripts/lib/install-lifecycle.js`

### 13. File Write Permissions Not Set
- **File:** `scripts/lib/utils.js` (lines 283-305)
- `writeFile()` and `appendFile()` don't set explicit file modes — uses default umask
- Audit logs and session transcripts could be world-readable

### 14. Transcript Path Not Validated
- **File:** `scripts/hooks/session-end.js` (line 130+)
- `transcript_path` from stdin used directly without path validation

### 15. Hook Runtime Controls Missing from CLAUDE.md
- `ECC_HOOK_PROFILE=minimal|standard|strict`, `ECC_DISABLED_HOOKS` — documented in `hooks/README.md` but not in main CLAUDE.md

---

## LOW Issues

### 16. Inconsistent Logging
- Library code uses `log()` → stderr in some places, `console.log()` in others (`scripts/repair.js`, `scripts/claw.js`)

### 17. Cross-Platform Test Gap
- No Windows CI testing; `where` vs `which` handled but untested
- `shell-split.js` untested on PowerShell

### 18. Missing Documentation
- No `QUICK_START.md` for new users
- No `GLOSSARY.md` for internal terminology (harness, eval, loop, skill vs agent vs command)
- No examples directory README
- No schemas directory documentation
- No contexts directory documentation
- Validation scripts in `scripts/ci/` undocumented

### 19. Rules Gaps
- Language-specific rules incomplete (Python, PHP, Perl, Swift need more content)
- Rules don't reference enforcement mechanisms (pre-commit hooks, CI checks)
- No "Common Exceptions" sections for absolute rules

### 20. Version Confusion
- `continuous-learning/` (v1) and `continuous-learning-v2/` coexist without clear deprecation

---

## Positive Findings

The project demonstrates strong engineering practices in many areas:

- **Security-conscious design:** Command allowlists, regex validation, stdin size limits (1MB), timeout enforcement on all child processes, zero use of `eval()`/`Function()`
- **Comprehensive test suite:** 1035 passing tests across 37 test files (91.5% pass rate)
- **Well-crafted prompts:** Agents have clear roles, good examples (e.g., planner's Stripe Subscriptions example), proactive activation language
- **Clean architecture:** Clear separation of agents/skills/commands/hooks/rules with layered rule system (common + language-specific)
- **Cross-platform support:** Platform detection, Windows shim handling, Node.js-based scripts (no bash dependency)
- **Sophisticated project detection:** 78 language rules + framework rules in `project-detect.js`

---

## Recommended Action Plan

### Immediate (This Sprint)
1. Add `ajv` to `package.json` dependencies → fixes 55 test failures
2. Add YAML frontmatter to 17 commands
3. Fix shell injection in `auto-tmux-dev.js`
4. Sanitize `process.env` in hook subprocess calls

### Short Term (1-2 Weeks)
5. Update CLAUDE.md with complete directory listing and accurate component counts
6. Create `skills/INDEX.md` organizing skills by category
7. Add "Review Orchestration" guide for reviewer agent relationships
8. Add "When to Activate" to 5 skills missing it
9. Create tests for `orchestrate-worktrees.js` and `orchestration-session.js`

### Medium Term (2-4 Weeks)
10. Create `QUICK_START.md` and `GLOSSARY.md`
11. Standardize skill section naming ("When to Activate" everywhere)
12. Complete language-specific rules (Python, PHP, Perl, Swift)
13. Add explicit file permissions to sensitive file operations
14. Consolidate duplicate path-finding logic into shared utility
15. Document schemas, examples, contexts directories

---

*Report generated by 5-agent parallel review team on 2026-03-15*
