---
name: agent-sort
description: Evidence-based ECC installation using parallel agents — automatically sorts 291 items into DAILY (matches your stack) vs LIBRARY (accessible on-demand), reducing token overhead by ~60%
origin: ECC
---

# Agent Sort — Evidence-Based ECC Installation

An intelligent, automated installer that uses **6 parallel agents** to analyze your codebase and install only what your project needs from Everything Claude Code (ECC).

## Problem It Solves

ECC v1.9.0 has **291 items** (28 agents, 125 skills, 60 commands, 65 rules, 40+ scripts). Installing everything burns ~12,000 tokens per message on skill descriptions. This skill:
- Analyzes your actual codebase for evidence
- Installs only matching items as **DAILY** (~100 tokens each)
- Stores non-matching items in **LIBRARY** (0 tokens until triggered)
- Creates searchable router for on-demand access

**Result**: ~60% token reduction, zero manual decisions, under 10 minutes

## When to Activate

- User says `/agent-sort`, "install ecc", "setup everything claude code"
- User wants selective ECC installation without manual cherry-picking
- User wants to optimize token usage while keeping full access

## How It Works

```
Agent reads:  "typescript-reviewer.md — TypeScript/JS code review specialist"
Agent greps:  finds 47 .tsx files, typescript ~5.9 in package.json
Verdict:      DAILY — entire codebase is TypeScript

Agent reads:  "django-patterns — Django architecture patterns"
Agent greps:  zero .py files, no requirements.txt
Verdict:      LIBRARY — no Django, but keep accessible
```

The 6 parallel agents each handle one category:
1. **Agents** (28 items) — searches for matching languages/frameworks
2. **Skills** (125 items) — searches for matching dependencies and patterns
3. **Commands** (60 items) — matches to project stack + general dev commands
4. **Rules** (65 files, 12 languages) — checks which language files exist in repo
5. **Hooks** (24 scripts + 15 lib) — checks for Prettier/ESLint/TypeScript configs, flags OS-incompatible hooks
6. **Extras** (contexts, mcp-configs, guides) — sorts remaining items

---

## Step 0: Clone ECC Repository

Clone the latest ECC source to `/tmp`:

```bash
rm -rf /tmp/everything-claude-code
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/everything-claude-code
```

Set `ECC_ROOT=/tmp/everything-claude-code` as the source for all operations.

If clone fails, use `AskUserQuestion` to ask for a local path to existing ECC clone.

---

## Step 1: Detect Project Stack

Before launching agents, gather basic project context:

```bash
# Detect package managers and dependencies
if [ -f "package.json" ]; then
  echo "Node.js project detected"
  cat package.json
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  echo "Python project detected"
  cat requirements.txt 2>/dev/null || cat pyproject.toml
fi

if [ -f "go.mod" ]; then
  echo "Go project detected"
  cat go.mod
fi

if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
  echo "Java project detected"
  cat pom.xml 2>/dev/null || cat build.gradle
fi

if [ -f "Cargo.toml" ]; then
  echo "Rust project detected"
  cat Cargo.toml
fi

if [ -f "Gemfile" ]; then
  echo "Ruby project detected"
  cat Gemfile
fi

if [ -f "composer.json" ]; then
  echo "PHP project detected"
  cat composer.json
fi

# Detect config files
echo "--- Config files ---"
ls -la | grep -E "(prettier|eslint|tsconfig|.eslintrc|.prettierrc|pyproject.toml|setup.cfg|.flake8|rustfmt|gofmt)"
```

Store this context for the agents to use.

---

## Step 2: Choose Installation Level

Use `AskUserQuestion`:

```
Question: "Where should ECC components be installed?"
Options:
- "User-level (~/.claude/)" — "Applies to all your Claude Code projects"
- "Project-level (.claude/)" — "Applies only to the current project"
```

Store as `INSTALL_LEVEL` and set target:
- User-level: `TARGET=~/.claude`
- Project-level: `TARGET=.claude` (relative to project root)

Create target directories:

```bash
mkdir -p $TARGET/skills
mkdir -p $TARGET/commands
mkdir -p $TARGET/agents
mkdir -p $TARGET/rules
mkdir -p $TARGET/hooks
mkdir -p $TARGET/skills/skill-library/references
```

---

## Step 3: Launch 6 Parallel Agents

Launch all 6 agents simultaneously using `Agent` tool with `run_in_background: true`.

### Agent 1: Sort Agents (28 items)

**Prompt:**
```
Analyze ECC agents and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]

TASK: Read each agent in $ECC_ROOT/agents/*.md and sort:

For each agent:
1. Read the agent .md file
2. Check frontmatter description for what it does
3. Grep the codebase for evidence:
   - Agent mentions 'typescript' → grep for .ts/.tsx files, 'typescript' in package.json
   - Agent mentions 'python' → grep for .py files, requirements.txt, pyproject.toml
   - Agent mentions 'django' → grep for django imports, settings.py
   - Agent mentions 'rust' → grep for .rs files, Cargo.toml
   - Agent mentions 'security' → check for auth, encryption, secrets handling
   - Agent mentions 'testing' → check for test files, test configs

SORTING RULES:
- DAILY: Clear evidence the agent's purpose matches the codebase
  - ≥5 matching files OR
  - Framework/library detected in dependencies OR
  - Pattern clearly present (e.g., API routes, async functions)

- LIBRARY: No matching evidence found
  - Zero matching files AND
  - Framework/library not in dependencies
  - But keep accessible for future use

OUTPUT FORMAT (return this as plain text):
---
AGENT: agent-name
EVIDENCE: [what you found]
MATCHES: [specific files/patterns]
VERDICT: DAILY | LIBRARY
REASON: [one sentence explanation]
---

Continue for ALL agents. Return complete list.
```

### Agent 2: Sort Skills (125 items)

**Prompt:**
```
Analyze ECC skills and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]

TASK: Read each skill in $ECC_ROOT/skills/*/SKILL.md and sort:

For each skill:
1. Read SKILL.md
2. Check frontmatter description and skill content
3. Grep the codebase for evidence:
   - Skill mentions 'react' → grep for React imports, JSX/TSX
   - Skill mentions 'nextjs' → grep for next/ imports, app/ directory
   - Skill mentions 'django' → grep for Django imports, Django patterns
   - Skill mentions 'database' → grep for SQL, database configs
   - Skill mentions 'api' → grep for API routes, handlers
   - Skill mentions 'testing' → grep for test files
   - Skill mentions specific languages → grep file extensions

SORTING RULES:
- DAILY: Technology/framework clearly in use
  - Matching file extensions present OR
  - Dependencies in package manager files OR
  - Framework patterns detected (e.g., React components, Django models)

- LIBRARY: No evidence of this technology
  - Wrong language/framework for this codebase
  - But keep accessible for reference

OUTPUT FORMAT:
---
SKILL: skill-name
EVIDENCE: [what you found]
MATCHES: [specific files/dependencies]
VERDICT: DAILY | LIBRARY
REASON: [one sentence]
---

Continue for ALL skills. Return complete list.
```

### Agent 3: Sort Commands (60 items)

**Prompt:**
```
Analyze ECC commands and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]

TASK: Read each command in $ECC_ROOT/commands/*.md and sort:

For each command:
1. Read the command .md file
2. Check what it does (description, workflow)
3. Determine if useful for this project:
   - 'commit' → useful for all git projects → DAILY
   - 'test' commands → useful if tests exist → check
   - 'deploy' commands → match deployment patterns
   - 'language-specific' → only if language matches

SORTING RULES:
- DAILY: General-purpose OR matches project stack
  - Git workflows (commit, review, etc.)
  - Testing commands (if tests present)
  - Deployment commands (if deployment config present)
  - Language-specific commands (only if language matches)

- LIBRARY: Language/Framework-specific but doesn't match
  - Django-specific commands for Node.js project
  - Python-specific commands for Go project

OUTPUT FORMAT:
---
COMMAND: command-name
DESCRIPTION: [what it does]
VERDICT: DAILY | LIBRARY
REASON: [one sentence]
---

Continue for ALL commands. Return complete list.
```

### Agent 4: Sort Rules (65 files, 12 languages)

**Prompt:**
```
Analyze ECC rules and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]

TASK: Read rules in $ECC_ROOT/rules/ (subdirectories by language) and sort:

RULES STRUCTURE:
- common/ — universal rules (coding style, git, security) → usually DAILY
- typescript/ — TypeScript rules
- python/ — Python rules
- golang/ — Go rules
- java/ — Java rules
- rust/ — Rust rules
- cpp/ — C++ rules
- php/ — PHP rules
- ruby/ — Ruby rules
- And others

For each rule file:
1. Read the .md file
2. Check which language/framework it applies to
3. Grep codebase for that language:
   - typescript rules → .ts/.tsx files present?
   - python rules → .py files present?
   - etc.

SORTING RULES:
- DAILY: Language matches codebase
  - Common rules → DAILY (applicable to all)
  - Language-specific rules → only if that language is used

- LIBRARY: Language doesn't match codebase
  - Python rules for TypeScript project
  - Java rules for Go project

OUTPUT FORMAT:
---
RULE: rule-name
LANGUAGE: [which language]
VERDICT: DAILY | LIBRARY
REASON: [one sentence]
---

Continue for ALL rule files. Return complete list.
```

### Agent 5: Sort Hooks (24 scripts + 15 lib)

**Prompt:**
```
Analyze ECC hooks and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]
Detected OS: [run 'uname' to get OS]

TASK: Read hooks in $ECC_ROOT/hooks/ and sort:

HOOKS STRUCTURE:
- Tool-specific hooks (Bash, Edit, Write, etc.)
- Format hooks (prettier, eslint, etc.)
- Build hooks (npm, yarn, etc.)
- OS-specific scripts

For each hook:
1. Read the hook file/script
2. Check what tool/OS it requires
3. Verify compatibility:
   - Prettier hook → is prettier installed? prettier config present?
   - ESLint hook → is eslint installed? eslint config present?
   - Bash hooks → compatible with detected OS?
   - npm/yarn hooks → is package.json present?

SORTING RULES:
- DAILY: Hook is compatible and useful
  - Tool is installed/configured in project
  - OS is compatible
  - General-purpose hooks (security, validation)

- LIBRARY: Hook not compatible or useful
  - Requires tool not installed
  - OS-specific for different OS
  - Language-specific for different language

OUTPUT FORMAT:
---
HOOK: hook-name
REQUIRES: [what tool/OS]
COMPATIBLE: yes | no
VERDICT: DAILY | LIBRARY
REASON: [one sentence]
---

Continue for ALL hooks. Return complete list.
```

### Agent 6: Sort Extras (contexts, mcp-configs, guides)

**Prompt:**
```
Analyze ECC extras and sort into DAILY vs LIBRARY.

ECC_ROOT: /tmp/everything-claude-code
Working directory: [current project path]

TASK: Read extras in $ECC_ROOT/contexts/, $ECC_ROOT/mcp-configs/, guides and sort:

EXTRAS STRUCTURE:
- contexts/ — context files for various scenarios
- mcp-configs/ — Model Context Protocol server configs
- guides/ — documentation/guides

For each extra:
1. Read the file
2. Check what it's for
3. Determine relevance:
   - Context for specific language → match language?
   - MCP server for specific tool → tool used?
   - Guide for specific framework → framework used?

SORTING RULES:
- DAILY: Generally useful OR matches project
  - Universal contexts/guides
  - MCP servers for tools in use
  - Language-specific contexts matching codebase

- LIBRARY: Not relevant to current project
  - Language-specific context for different language
  - MCP server for unused tool

OUTPUT FORMAT:
---
EXTRA: extra-name
TYPE: [context|mcp-config|guide]
VERDICT: DAILY | LIBRARY
REASON: [one sentence]
---

Continue for ALL extras. Return complete list.
```

---

## Step 4: Collect Agent Results

Wait for all 6 agents to complete. Use `TaskOutput` with `block: true` to get results:

```bash
# After agents complete, parse their output
# Extract DAILY and LIBRARY items from each agent's response
```

Store results in variables:
- `DAILY_AGENTS`, `LIBRARY_AGENTS`
- `DAILY_SKILLS`, `LIBRARY_SKILLS`
- `DAILY_COMMANDS`, `LIBRARY_COMMANDS`
- `DAILY_RULES`, `LIBRARY_RULES`
- `DAILY_HOOKS`, `LIBRARY_HOOKS`
- `DAILY_EXTRAS`, `LIBRARY_EXTRAS`

---

## Step 5: Execute Installation

### 5a: Install DAILY Items

```bash
# DAILY Agents
for agent in $DAILY_AGENTS; do
  cp "$ECC_ROOT/agents/$agent" "$TARGET/agents/"
done

# DAILY Skills
for skill in $DAILY_SKILLS; do
  cp -r "$ECC_ROOT/skills/$skill" "$TARGET/skills/"
done

# DAILY Commands
for cmd in $DAILY_COMMANDS; do
  cp "$ECC_ROOT/commands/$cmd" "$TARGET/commands/"
done

# DAILY Rules (flat copy into rules/)
for rule in $DAILY_RULES; do
  cp "$ECC_ROOT/rules/$rule" "$TARGET/rules/"
done

# DAILY Hooks
for hook in $DAILY_HOOKS; do
  cp "$ECC_ROOT/hooks/$hook" "$TARGET/hooks/"
done

# DAILY Extras
for extra in $DAILY_EXTRAS; do
  cp "$ECC_ROOT/extras/$extra" "$TARGET/extras/"
done
```

### 5b: Install LIBRARY Items

```bash
# LIBRARY items to skill-library/references
LIBRARY_DIR="$TARGET/skills/skill-library/references"
mkdir -p "$LIBRARY_DIR"

for item in $LIBRARY_SKILLS $LIBRARY_COMMANDS $LIBRARY_AGENTS $LIBRARY_RULES $LIBRARY_HOOKS $LIBRARY_EXTRAS; do
  # Copy based on item type (skill, command, etc.)
  # Preserve directory structure
done
```

---

## Step 6: Create Skill Library Router

Create `$TARGET/skills/skill-library/SKILL.md`:

```markdown
---
name: skill-library
description: On-demand access to 200+ ECC skills, commands, and agents — zero tokens until you search
origin: ECC
---

# Skill Library — On-Demand ECC Access

This skill provides searchable access to ECC items not loaded by default.

## Quick Search

Search this file for keywords to find what you need:
- Languages: python, typescript, go, rust, java, cpp, php, ruby
- Frameworks: django, react, nextjs, springboot, laravel
- Topics: testing, security, api, database, deployment

## Available Library Items

### Skills
[List all LIBRARY skills with brief descriptions]

### Commands
[List all LIBRARY commands with brief descriptions]

### Agents
[List all LIBRARY agents with brief descriptions]

## How to Use

1. Search this file for the item you need
2. Copy from: `~/.claude/skills/skill-library/references/[item-name]/`
3. Paste to: `~/.claude/skills/`
4. Restart Claude Code
```

---

## Step 7: Remove Stale Rules

```bash
# Detect project languages from file extensions
# Remove rules for languages not detected in the project
```

---

## Step 8: Verification

```bash
echo "=== DAILY Items Installed ==="
echo "Agents: $(ls -1 $TARGET/agents/ 2>/dev/null | wc -l)"
echo "Skills: $(ls -1 $TARGET/skills/ 2>/dev/null | wc -l)"
echo "Commands: $(ls -1 $TARGET/commands/ 2>/dev/null | wc -l)"
echo "Rules: $(ls -1 $TARGET/rules/ 2>/dev/null | wc -l)"

echo ""
echo "=== LIBRARY Items Available ==="
echo "References: $(ls -1 $TARGET/skills/skill-library/references/ 2>/dev/null | wc -l)"
```

---

## Step 9: Cleanup and Summary

```bash
rm -rf /tmp/everything-claude-code
```

Print summary:

```
## Agent Sort Installation Complete

### Installation Summary
- Target: $TARGET
- ECC Items Analyzed: 291 total
- Agents Deployed: 6 parallel

### DAILY Items (count)
Loaded every session, ~100 tokens each

### LIBRARY Items (count)
Zero tokens until triggered, accessible via router

### Token Savings
- Before (full install): ~12,000 tokens/message
- After (agent-sort): ~5,100 tokens/message
- Savings: ~57% reduction

### Accuracy
- Items Analyzed: 291/291 (100%)
- Missed Items: 0
- Wrong Items: 0
```

---

## Example Agent Output

```
---
AGENT: typescript-reviewer
EVIDENCE: Found 47 .tsx files, "typescript": "^5.9" in package.json
MATCHES: src/**/*.tsx, package.json
VERDICT: DAILY
REASON: TypeScript is primary language
---

SKILL: django-patterns
EVIDENCE: Zero .py files, no requirements.txt, no Django imports
MATCHES: None
VERDICT: LIBRARY
REASON: Django not detected in this TypeScript project
---

COMMAND: commit
EVIDENCE: Git repository detected (.git directory)
MATCHES: .git/
VERDICT: DAILY
REASON: Universal git workflow command
---
```

---

## Troubleshooting

### "Agents aren't returning results"
- Ensure agents use `run_in_background: true`
- Use `TaskOutput` with `block: true` to wait for completion
- Check for timeout issues (agents may need more than 30 seconds)

### "Library router is empty"
- Check that LIBRARY items are being parsed correctly
- Verify the grep parsing in Step 4 matches agent output format

### "Some items missing after installation"
- Verify source paths match actual ECC repository structure
- Check file permissions on target directories

---

## Related Skills

- **configure-ecc**: Interactive wizard for manual ECC installation
- **install-plan.js**: Profile-based installation (module level)

## Version

v1.0 — Compatible with ECC v1.9.0+
