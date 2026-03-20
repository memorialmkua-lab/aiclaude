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
feat: add typescript patterns skill
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
feat: add MCP health-check hook (#711)
```

*Commit message example*

```text
feat(rules): add C# language support (#704)
```

*Commit message example*

```text
feat: add nuxt 4 patterns skill (#702)
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
Address review: register rust-reviewer in AGENTS.md and rules, add openai.yaml for Codex skills
merge: PR #529 — feat(skills): add documentation-lookup, bun-runtime, nextjs-turbopack; feat(agents): add rust-reviewer
fix: refresh orchestration follow-up after #414 (#430)
```

### Add New Skill

Adds a new skill to the repository, including documentation and (sometimes) Antigravity/Codex harness support.

**Frequency**: ~4 times per month

**Steps**:
1. Create skills/<skill-name>/SKILL.md with full canonical content.
2. Optionally, add .agents/skills/<skill-name>/SKILL.md and/or agents/<skill-name>.md for harness compatibility.
3. Update AGENTS.md and/or README.md to increment skill count and document the new skill.
4. If needed, add supporting scripts or openai.yaml for agent harness.
5. Address review feedback by updating SKILL.md, adding examples, or clarifying sections.

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create skills/<skill-name>/SKILL.md with full canonical content.
Optionally, add .agents/skills/<skill-name>/SKILL.md and/or agents/<skill-name>.md for harness compatibility.
Update AGENTS.md and/or README.md to increment skill count and document the new skill.
If needed, add supporting scripts or openai.yaml for agent harness.
Address review feedback by updating SKILL.md, adding examples, or clarifying sections.
```

### Add New Agent

Adds a new agent to the repository, with documentation and registration in agent tables.

**Frequency**: ~2 times per month

**Steps**:
1. Create agents/<agent-name>.md with agent definition and documentation.
2. Update AGENTS.md and README.md to increment agent count and document the new agent.
3. Optionally, add docs/COMMAND-AGENT-MAP.md or similar mapping files.
4. If needed, add .agents/skills/<agent-name>/SKILL.md and agents/<agent-name>/openai.yaml for harness support.

**Files typically involved**:
- `agents/*.md`
- `AGENTS.md`
- `README.md`
- `docs/COMMAND-AGENT-MAP.md`

**Example commit sequence**:
```
Create agents/<agent-name>.md with agent definition and documentation.
Update AGENTS.md and README.md to increment agent count and document the new agent.
Optionally, add docs/COMMAND-AGENT-MAP.md or similar mapping files.
If needed, add .agents/skills/<agent-name>/SKILL.md and agents/<agent-name>/openai.yaml for harness support.
```

### Add Language Rules

Adds a new language's ruleset (coding style, hooks, patterns, security, testing) to the repository.

**Frequency**: ~2 times per month

**Steps**:
1. Create rules/<language>/(coding-style.md|hooks.md|patterns.md|security.md|testing.md) files.
2. Optionally, reference or link to corresponding skills or agents.
3. Update documentation or rules/common/agents.md as needed.

**Files typically involved**:
- `rules/*/coding-style.md`
- `rules/*/hooks.md`
- `rules/*/patterns.md`
- `rules/*/security.md`
- `rules/*/testing.md`

**Example commit sequence**:
```
Create rules/<language>/(coding-style.md|hooks.md|patterns.md|security.md|testing.md) files.
Optionally, reference or link to corresponding skills or agents.
Update documentation or rules/common/agents.md as needed.
```

### Add Or Update Hook

Adds or updates a hook script, registers it, and adds/updates corresponding tests.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update scripts/hooks/<hook-name>.js.
2. Register or update the hook in hooks/hooks.json (and/or .cursor/hooks.json).
3. Add or update tests in tests/hooks/<hook-name>.test.js and/or tests/integration/hooks.test.js.
4. Optionally, update related documentation.

**Files typically involved**:
- `scripts/hooks/*.js`
- `hooks/hooks.json`
- `.cursor/hooks.json`
- `tests/hooks/*.test.js`
- `tests/integration/hooks.test.js`

**Example commit sequence**:
```
Add or update scripts/hooks/<hook-name>.js.
Register or update the hook in hooks/hooks.json (and/or .cursor/hooks.json).
Add or update tests in tests/hooks/<hook-name>.test.js and/or tests/integration/hooks.test.js.
Optionally, update related documentation.
```

### Sync Catalog Counts

Synchronizes documented counts of agents, skills, and commands with the actual repository state.

**Frequency**: ~2 times per month

**Steps**:
1. Update AGENTS.md and README.md to reflect the correct counts in summary tables and quick-start sections.
2. Optionally, update other documentation files (e.g., CHANGELOG.md, docs/zh-CN/README.md).
3. Commit with a message indicating catalog or documentation count sync.

**Files typically involved**:
- `AGENTS.md`
- `README.md`
- `CHANGELOG.md`
- `docs/zh-CN/README.md`

**Example commit sequence**:
```
Update AGENTS.md and README.md to reflect the correct counts in summary tables and quick-start sections.
Optionally, update other documentation files (e.g., CHANGELOG.md, docs/zh-CN/README.md).
Commit with a message indicating catalog or documentation count sync.
```

### Add New Command

Adds a new command to the system, typically with a backing skill and documentation.

**Frequency**: ~2 times per month

**Steps**:
1. Create commands/<command-name>.md with usage, workflow, and documentation.
2. Optionally, create or update a backing skill in skills/<skill-name>/SKILL.md.
3. Update AGENTS.md and/or README.md to increment command count and document the new command.

**Files typically involved**:
- `commands/*.md`
- `skills/*/SKILL.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create commands/<command-name>.md with usage, workflow, and documentation.
Optionally, create or update a backing skill in skills/<skill-name>/SKILL.md.
Update AGENTS.md and/or README.md to increment command count and document the new command.
```

### Fix Windows Or Ci Test Compatibility

Fixes or stabilizes tests and scripts to work on Windows or in CI environments.

**Frequency**: ~2 times per month

**Steps**:
1. Update tests/hooks/*.test.js, tests/ci/*.test.js, or related test files to skip or adapt for Windows/CI.
2. Update scripts or utilities to normalize paths, handle CRLF, or resolve environment variables.
3. Optionally, update documentation to note platform-specific behavior.

**Files typically involved**:
- `tests/hooks/*.test.js`
- `tests/ci/*.test.js`
- `tests/lib/*.test.js`
- `scripts/hooks/*.js`
- `scripts/lib/*.js`

**Example commit sequence**:
```
Update tests/hooks/*.test.js, tests/ci/*.test.js, or related test files to skip or adapt for Windows/CI.
Update scripts or utilities to normalize paths, handle CRLF, or resolve environment variables.
Optionally, update documentation to note platform-specific behavior.
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
