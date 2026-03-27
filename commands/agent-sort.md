---
description: Evidence-based ECC installation using 6 parallel agents — automatically sorts 291 items into DAILY (matches your stack) vs LIBRARY (accessible on-demand)
---

# /agent-sort

Intelligent ECC installer that analyzes your codebase and installs only what you need.

## Purpose

Automatically install Everything Claude Code (ECC) items based on your actual project:
- **DAILY items** (matches your stack) → loaded every session
- **LIBRARY items** (doesn't match) → accessible via searchable router, zero tokens

Reduces token overhead by ~60% with zero manual decisions.

## Usage

```
/agent-sort
```

## What Happens

1. **Detects your stack** — Scans for languages, frameworks, dependencies
2. **Launches 6 parallel agents** — Each analyzes one ECC category:
   - Agents (28 items)
   - Skills (125 items)
   - Commands (60 items)
   - Rules (65 files)
   - Hooks (24 scripts)
   - Extras (contexts, configs, guides)
3. **Sorts by evidence** — Each agent greps your codebase for matches
4. **Installs DAILY items** — Copies matching items to `~/.claude/` or `.claude/`
5. **Creates LIBRARY** — Stores non-matching items in skill-library for on-demand access
6. **Builds router** — Creates searchable skill-library/SKILL.md

## Example Results

```
Before: 200+ skills loaded, ~12,000 tokens/message
After:  51 daily items, ~5,100 tokens/message
Library: 168 reference files, 0 tokens until triggered

Time: ~8 minutes (6 agents in parallel)
Missed: 0 items
Wrong: 0 items (every decision backed by grep evidence)
```

## Output

- **Installation summary** — Counts of DAILY vs LIBRARY items
- **Token savings** — Before/after comparison
- **Router location** — Path to skill-library for on-demand access

## See Also

- `configure-ecc` skill — Interactive manual installation wizard
- ECC repository: https://github.com/affaan-m/everything-claude-code
