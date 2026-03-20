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

- `feat`
- `fix`
- `test`
- `docs`

### Message Guidelines

- Average message length: ~65 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/add-new-language-rules.md)
```

*Commit message example*

```text
chore(deps-dev): bump flatted (#675)
```

*Commit message example*

```text
fix: auto-detect ECC root from plugin cache when CLAUDE_PLUGIN_ROOT is unset (#547) (#691)
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
feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md)
```

*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/database-migration.md)
```

*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md)
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

**Frequency**: ~28 times per month

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
Merge pull request #664 from ymdvsymd/fix/observer-sandbox-access-661
feat(skills): add agent-eval for head-to-head coding agent comparison (#540)
feat(skills): add codebase-onboarding skill (#553)
```

### Add Language Rules

Adds a new programming language's rules (style, hooks, patterns, security, testing) to the rules/ directory.

**Frequency**: ~2 times per month

**Steps**:
1. Create rules/<language>/coding-style.md
2. Create rules/<language>/hooks.md
3. Create rules/<language>/patterns.md
4. Create rules/<language>/security.md
5. Create rules/<language>/testing.md

**Files typically involved**:
- `rules/*/coding-style.md`
- `rules/*/hooks.md`
- `rules/*/patterns.md`
- `rules/*/security.md`
- `rules/*/testing.md`

**Example commit sequence**:
```
Create rules/<language>/coding-style.md
Create rules/<language>/hooks.md
Create rules/<language>/patterns.md
Create rules/<language>/security.md
Create rules/<language>/testing.md
```

### Add Skill

Adds a new skill to the system, including implementation, documentation, and supporting scripts.

**Frequency**: ~3 times per month

**Steps**:
1. Create skills/<skill-name>/SKILL.md
2. Optionally add scripts in skills/<skill-name>/scripts/
3. Update README.md and AGENTS.md to increment skill/command counts and document the new skill

**Files typically involved**:
- `skills/*/SKILL.md`
- `skills/*/scripts/*.sh`
- `README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Create skills/<skill-name>/SKILL.md
Optionally add scripts in skills/<skill-name>/scripts/
Update README.md and AGENTS.md to increment skill/command counts and document the new skill
```

### Add Command

Adds a new command to the commands/ directory, often with a corresponding skill.

**Frequency**: ~2 times per month

**Steps**:
1. Create commands/<command-name>.md
2. Optionally create a corresponding skill in skills/<command-name>/SKILL.md
3. Update README.md and AGENTS.md to increment command/skill counts

**Files typically involved**:
- `commands/*.md`
- `skills/*/SKILL.md`
- `README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Create commands/<command-name>.md
Optionally create a corresponding skill in skills/<command-name>/SKILL.md
Update README.md and AGENTS.md to increment command/skill counts
```

### Sync Catalog Counts

Synchronizes documented counts of agents, skills, and commands in README.md and AGENTS.md to match the actual filesystem state.

**Frequency**: ~2 times per month

**Steps**:
1. Count actual agents, skills, and commands in the filesystem
2. Update README.md and AGENTS.md with the correct numbers

**Files typically involved**:
- `README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Count actual agents, skills, and commands in the filesystem
Update README.md and AGENTS.md with the correct numbers
```

### Add Agent Support For Ide

Adds or removes a full set of agent, hook, skill, and steering files for IDE integration (e.g., Kiro IDE).

**Frequency**: ~1 times per month

**Steps**:
1. Add or remove .kiro/agents/*.json and .kiro/agents/*.md
2. Add or remove .kiro/hooks/*.kiro.hook
3. Add or remove .kiro/skills/*/SKILL.md
4. Add or remove .kiro/steering/*.md
5. Add or remove .kiro/scripts/*.sh
6. Add or remove .kiro/docs/*.md

**Files typically involved**:
- `.kiro/agents/*.json`
- `.kiro/agents/*.md`
- `.kiro/hooks/*.kiro.hook`
- `.kiro/skills/*/SKILL.md`
- `.kiro/steering/*.md`
- `.kiro/scripts/*.sh`
- `.kiro/docs/*.md`

**Example commit sequence**:
```
Add or remove .kiro/agents/*.json and .kiro/agents/*.md
Add or remove .kiro/hooks/*.kiro.hook
Add or remove .kiro/skills/*/SKILL.md
Add or remove .kiro/steering/*.md
Add or remove .kiro/scripts/*.sh
Add or remove .kiro/docs/*.md
```

### Add Or Update Ecc Bundle Docs

Adds or updates ECC bundle documentation and configuration files under .claude/, .codex/, or .agents/ directories.

**Frequency**: ~3 times per month

**Steps**:
1. Add or update markdown or JSON files in .claude/commands/, .claude/rules/, .claude/skills/, .claude/research/, .claude/team/, .claude/enterprise/
2. Add or update TOML files in .codex/agents/
3. Add or update SKILL.md or YAML files in .agents/skills/

**Files typically involved**:
- `.claude/commands/*.md`
- `.claude/rules/*.md`
- `.claude/skills/*/SKILL.md`
- `.claude/research/*.md`
- `.claude/team/*.json`
- `.claude/enterprise/*.md`
- `.codex/agents/*.toml`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/*.yaml`

**Example commit sequence**:
```
Add or update markdown or JSON files in .claude/commands/, .claude/rules/, .claude/skills/, .claude/research/, .claude/team/, .claude/enterprise/
Add or update TOML files in .codex/agents/
Add or update SKILL.md or YAML files in .agents/skills/
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
