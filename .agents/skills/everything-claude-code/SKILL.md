---
name: everything-claude-code-conventions
description: Development conventions and patterns for everything-claude-code. JavaScript project with conventional commits.
---

# Everything Claude Code Conventions

> Generated from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) on 2026-03-20

## Overview

This skill teaches Claude the development patterns and conventions used in everything-claude-code.

## Tech Stack

- **Primary Language**: JavaScript
- **Architecture**: hybrid module organization
- **Test Location**: separate

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 500 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `fix`
- `feat`
- `test`
- `docs`

### Message Guidelines

- Average message length: ~64 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat: add MCP health-check hook
```

*Commit message example*

```text
fix: sanitize SessionStart session summaries (#710)
```

*Commit message example*

```text
chore(deps-dev): bump flatted (#675)
```

*Commit message example*

```text
docs: add Antigravity setup and usage guide (#552)
```

*Commit message example*

```text
merge: PR #529 — feat(skills): add documentation-lookup, bun-runtime, nextjs-turbopack; feat(agents): add rust-reviewer
```

*Commit message example*

```text
feat(rules): add C# language support (#704)
```

*Commit message example*

```text
feat: add nuxt 4 patterns skill (#702)
```

*Commit message example*

```text
feat: agent description compression with lazy loading (#696)
```

## Architecture

### Project Structure: Single Package

This project uses **hybrid** module organization.

### Configuration Files

- `.github/workflows/ci.yml`
- `.github/workflows/maintenance.yml`
- `.github/workflows/monthly-metrics.yml`
- `.github/workflows/release.yml`
- `.github/workflows/reusable-release.yml`
- `.github/workflows/reusable-test.yml`
- `.github/workflows/reusable-validate.yml`
- `.opencode/package.json`
- `.opencode/tsconfig.json`
- `.prettierrc`
- `eslint.config.js`
- `package.json`

### Guidelines

- This project uses a hybrid organization
- Follow existing patterns when adding new code

## Code Style

### Language: JavaScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | camelCase |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Mixed Style


*Preferred import style*

```typescript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

## Testing

### Test Framework

No specific test framework detected — use the repository's existing test patterns.

### File Pattern: `*.test.js`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test interactions between multiple components/services

### Coverage

This project has coverage reporting configured. Aim for 80%+ coverage.


## Error Handling

### Error Handling Style: Try-Catch Blocks


*Standard error handling pattern*

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Database Migration

Database schema changes with migration files

**Frequency**: ~2 times per month

**Steps**:
1. Create migration file
2. Update schema definitions
3. Generate/update types

**Files typically involved**:
- `**/schema.*`
- `migrations/*`

**Example commit sequence**:
```
feat: implement --with/--without selective install flags (#679)
fix: sync catalog counts with filesystem (27 agents, 113 skills, 58 commands) (#693)
feat(rules): add Rust language rules (rebased #660) (#686)
```

### Feature Development

Standard feature implementation workflow

**Frequency**: ~20 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `manifests/*`
- `schemas/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```
docs(skills): align documentation-lookup with CONTRIBUTING template; add cross-harness (Codex/Cursor) skill copies
fix: address PR review — skill template (When to use, How it works, Examples), bun.lock, next build note, rust-reviewer CI note, doc-lookup privacy/uncertainty
Address review: register rust-reviewer in AGENTS.md and rules, add openai.yaml for Codex skills
```

### Add New Skill

Adds a new skill to the system, often with supporting scripts and documentation. Frequently includes review/feedback fixes.

**Frequency**: ~4 times per month

**Steps**:
1. Create SKILL.md in skills/<skill-name>/SKILL.md
2. Optionally add scripts or supporting files in skills/<skill-name>/scripts/
3. If Antigravity/Codex/Cursor support: add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md
4. Update AGENTS.md and README.md skill/command counts if needed
5. Address PR review feedback with follow-up commits

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create SKILL.md in skills/<skill-name>/SKILL.md
Optionally add scripts or supporting files in skills/<skill-name>/scripts/
If Antigravity/Codex/Cursor support: add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md
Update AGENTS.md and README.md skill/command counts if needed
Address PR review feedback with follow-up commits
```

### Add New Agent

Adds a new agent to the system, with documentation and registration in catalog files.

**Frequency**: ~2 times per month

**Steps**:
1. Create agents/<agent-name>.md with agent definition
2. Update AGENTS.md and README.md to register the agent and increment agent count
3. If Antigravity/Codex/Cursor support: add .agents/skills/<skill-name>/agents/openai.yaml or similar
4. Optionally update docs/COMMAND-AGENT-MAP.md

**Files typically involved**:
- `agents/*.md`
- `AGENTS.md`
- `README.md`
- `.agents/skills/*/agents/openai.yaml`
- `docs/COMMAND-AGENT-MAP.md`

**Example commit sequence**:
```
Create agents/<agent-name>.md with agent definition
Update AGENTS.md and README.md to register the agent and increment agent count
If Antigravity/Codex/Cursor support: add .agents/skills/<skill-name>/agents/openai.yaml or similar
Optionally update docs/COMMAND-AGENT-MAP.md
```

### Add Language Rules

Adds a new language's rule set (coding style, hooks, patterns, security, testing).

**Frequency**: ~2 times per month

**Steps**:
1. Create rules/<language>/(coding-style.md|hooks.md|patterns.md|security.md|testing.md)
2. Optionally update .claude/commands/add-language-rules.md
3. Update AGENTS.md and README.md if agent/skill counts change

**Files typically involved**:
- `rules/*/coding-style.md`
- `rules/*/hooks.md`
- `rules/*/patterns.md`
- `rules/*/security.md`
- `rules/*/testing.md`
- `.claude/commands/add-language-rules.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create rules/<language>/(coding-style.md|hooks.md|patterns.md|security.md|testing.md)
Optionally update .claude/commands/add-language-rules.md
Update AGENTS.md and README.md if agent/skill counts change
```

### Add New Command

Adds a new command to the system, often with a corresponding skill and documentation.

**Frequency**: ~2 times per month

**Steps**:
1. Create commands/<command-name>.md with command documentation and logic
2. Optionally create skills/<skill-name>/SKILL.md if command is skill-backed
3. Update AGENTS.md and README.md command/skill counts
4. Address review feedback with follow-up fixes

**Files typically involved**:
- `commands/*.md`
- `skills/*/SKILL.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create commands/<command-name>.md with command documentation and logic
Optionally create skills/<skill-name>/SKILL.md if command is skill-backed
Update AGENTS.md and README.md command/skill counts
Address review feedback with follow-up fixes
```

### Add Or Update Hook

Adds a new hook or updates an existing one, with corresponding tests and hooks.json registration.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update hook script in scripts/hooks/<hook-name>.js
2. Register hook in hooks/hooks.json (and/or .cursor/hooks.json)
3. Add or update tests in tests/hooks/<hook-name>.test.js or tests/integration/hooks.test.js
4. Optionally update related documentation

**Files typically involved**:
- `scripts/hooks/*.js`
- `hooks/hooks.json`
- `.cursor/hooks.json`
- `tests/hooks/*.test.js`
- `tests/integration/hooks.test.js`

**Example commit sequence**:
```
Add or update hook script in scripts/hooks/<hook-name>.js
Register hook in hooks/hooks.json (and/or .cursor/hooks.json)
Add or update tests in tests/hooks/<hook-name>.test.js or tests/integration/hooks.test.js
Optionally update related documentation
```

### Sync Catalog Counts

Synchronizes the documented counts of agents, skills, and commands in AGENTS.md and README.md with the actual filesystem/catalog.

**Frequency**: ~4 times per month

**Steps**:
1. Update agent/skill/command counts in AGENTS.md and README.md
2. Optionally update related summary tables or project structure sections
3. Fix any discrepancies flagged by CI or reviewers

**Files typically involved**:
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Update agent/skill/command counts in AGENTS.md and README.md
Optionally update related summary tables or project structure sections
Fix any discrepancies flagged by CI or reviewers
```

### Fix Windows Or Ci Test Compatibility

Fixes test failures or path issues related to Windows compatibility or CI environments.

**Frequency**: ~4 times per month

**Steps**:
1. Update test files (tests/hooks/*.test.js, tests/ci/*.test.js, tests/lib/*.test.js, etc.) to handle Windows/CI edge cases
2. Normalize paths, skip or guard platform-specific tests, handle CRLF/BOM issues
3. Optionally update scripts/lib/ or test harnesses as needed

**Files typically involved**:
- `tests/hooks/*.test.js`
- `tests/ci/*.test.js`
- `tests/lib/*.test.js`
- `scripts/lib/*.js`

**Example commit sequence**:
```
Update test files (tests/hooks/*.test.js, tests/ci/*.test.js, tests/lib/*.test.js, etc.) to handle Windows/CI edge cases
Normalize paths, skip or guard platform-specific tests, handle CRLF/BOM issues
Optionally update scripts/lib/ or test harnesses as needed
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Follow *.test.js naming pattern
- Use camelCase for file names
- Prefer mixed exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
