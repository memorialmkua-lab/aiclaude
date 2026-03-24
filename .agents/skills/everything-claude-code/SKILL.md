---
name: everything-claude-code-conventions
description: Development conventions and patterns for everything-claude-code. JavaScript project with conventional commits.
---

# Everything Claude Code Conventions

> Generated from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) on 2026-03-24

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
- `docs`
- `test`

### Message Guidelines

- Average message length: ~61 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat(ecc2): implement agent status panel with Table widget (#773)
```

*Commit message example*

```text
test: align antigravity manifest expectations
```

*Commit message example*

```text
fix(ecc2): sync catalog counts for scaffold CI
```

*Commit message example*

```text
docs: add ECC 2.0 reference architecture from competitor research
```

*Commit message example*

```text
perf(hooks): move post-edit-format and post-edit-typecheck to strict-only (#757)
```

*Commit message example*

```text
feat: scaffold ECC 2.0 Rust TUI — agentic IDE control plane
```

*Commit message example*

```text
Add Kiro steering files, hooks, and scripts (#812)
```

*Commit message example*

```text
Add Kiro skills (18 SKILL.md files) (#811)
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
- `migrations/*`

**Example commit sequence**:
```
Add Turkish (tr) docs and update README (#744)
docs(zh-CN): translate code block(plain text) (#753)
fix(install): add rust, cpp, csharp to legacy language alias map (#747)
```

### Feature Development

Standard feature implementation workflow

**Frequency**: ~17 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `manifests/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```
docs: add security guide header image to README
docs: update guide screenshots with current engagement stats
docs(zh-CN): sync Chinese docs with latest upstream changes
```

### Add New Skill

Adds a new skill to the project, including documentation, fixtures, prompts, scripts, and tests.

**Frequency**: ~2 times per month

**Steps**:
1. Create a new directory under skills/ with the skill name
2. Add SKILL.md documentation file
3. Add supporting files: fixtures, prompts, scripts, tests as needed
4. Update AGENTS.md and/or README.md to reflect the new skill count or catalog
5. Commit all new files

**Files typically involved**:
- `skills/*/SKILL.md`
- `skills/*/fixtures/*`
- `skills/*/prompts/*`
- `skills/*/scripts/*`
- `skills/*/tests/*`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create a new directory under skills/ with the skill name
Add SKILL.md documentation file
Add supporting files: fixtures, prompts, scripts, tests as needed
Update AGENTS.md and/or README.md to reflect the new skill count or catalog
Commit all new files
```

### Add Or Update Localization

Adds or updates documentation and guides in a new or existing language (e.g., zh-CN, pt-BR, tr).

**Frequency**: ~2 times per month

**Steps**:
1. Add or update files under docs/<lang>/ (agents, commands, skills, rules, examples, guides)
2. Update README.md to add or increment language support count and links
3. Commit all new/updated localization files

**Files typically involved**:
- `docs/zh-CN/**/*`
- `docs/pt-BR/**/*`
- `docs/tr/**/*`
- `README.md`

**Example commit sequence**:
```
Add or update files under docs/<lang>/ (agents, commands, skills, rules, examples, guides)
Update README.md to add or increment language support count and links
Commit all new/updated localization files
```

### Add Or Update Agent

Adds a new agent definition or updates existing agent metadata and documentation.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update .json and .md files under .kiro/agents/ or docs/<lang>/agents/
2. Commit both the JSON (definition/config) and MD (documentation) files together

**Files typically involved**:
- `.kiro/agents/*.json`
- `.kiro/agents/*.md`
- `docs/zh-CN/agents/*.md`
- `docs/pt-BR/agents/*.md`
- `docs/tr/agents/*.md`

**Example commit sequence**:
```
Create or update .json and .md files under .kiro/agents/ or docs/<lang>/agents/
Commit both the JSON (definition/config) and MD (documentation) files together
```

### Add Or Update Hook Or Script

Adds or modifies project hooks or scripts for formatting, quality gates, or config protection.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update files in hooks/ or .kiro/hooks/ or scripts/hooks/
2. Update hooks.json or related config files
3. Commit all changes

**Files typically involved**:
- `hooks/hooks.json`
- `scripts/hooks/*`
- `.kiro/hooks/*`

**Example commit sequence**:
```
Add or update files in hooks/ or .kiro/hooks/ or scripts/hooks/
Update hooks.json or related config files
Commit all changes
```

### Add Or Update Core Documentation

Adds or updates core project documentation, guides, or reference architecture.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update markdown files in docs/ or the root directory
2. Add or update images/assets if needed
3. Update README.md to link to new guides or reflect changes

**Files typically involved**:
- `docs/*.md`
- `docs/*/*.md`
- `assets/images/**/*`
- `README.md`

**Example commit sequence**:
```
Add or update markdown files in docs/ or the root directory
Add or update images/assets if needed
Update README.md to link to new guides or reflect changes
```

### Add Or Update Installation Manifests

Adds or updates installation manifest files and supporting scripts/tests for module/component resolution.

**Frequency**: ~2 times per month

**Steps**:
1. Edit manifests/install-components.json or manifests/install-modules.json
2. Update scripts/lib/install-manifests.js or related logic
3. Add or update tests in tests/lib/install-manifests.test.js
4. Commit all related files

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `scripts/lib/install-manifests.js`
- `tests/lib/install-manifests.test.js`

**Example commit sequence**:
```
Edit manifests/install-components.json or manifests/install-modules.json
Update scripts/lib/install-manifests.js or related logic
Add or update tests in tests/lib/install-manifests.test.js
Commit all related files
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
