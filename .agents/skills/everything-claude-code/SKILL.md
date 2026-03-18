---
name: everything-claude-code-conventions
description: Development conventions and patterns for everything-claude-code. JavaScript project with conventional commits.
---

# Everything Claude Code Conventions

> Generated from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) on 2026-03-18

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
- `docs`

### Message Guidelines

- Average message length: ~73 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/add-new-agent-command.md)
```

*Commit message example*

```text
fix: resolve 8 test failures on main (install pipeline, orchestrator, repair) (#564)
```

*Commit message example*

```text
merge: PR #529 — feat(skills): add documentation-lookup, bun-runtime, nextjs-turbopack; feat(agents): add rust-reviewer
```

*Commit message example*

```text
docs(skills): align documentation-lookup with CONTRIBUTING template; add cross-harness (Codex/Cursor) skill copies
```

*Commit message example*

```text
chore(config): governance and config foundation (#292)
```

*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/add-new-skill-command.md)
```

*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md)
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

### Import Style: Mixed Style

### Export Style: Named Exports


*Preferred export style*

```typescript
// Use named exports
export function calculateTotal() { ... }
export const TAX_RATE = 0.1
export interface Order { ... }
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

### Feature Development

Standard feature implementation workflow

**Frequency**: ~30 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Example commit sequence**:
```
feat: add everything-claude-code ECC bundle (.claude/team/everything-claude-code-team-config.json)
feat: add everything-claude-code ECC bundle (.claude/enterprise/controls.md)
feat: add everything-claude-code ECC bundle (.claude/commands/feature-development.md)
```

### Add New Agent Command

Adds a new agent command to the ECC bundle, documenting how to add new agents.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/commands/add-new-agent-command.md' with instructions or definitions for the new agent command.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/commands/add-new-agent-command.md`

**Example commit sequence**:
```
Create or update '.claude/commands/add-new-agent-command.md' with instructions or definitions for the new agent command.
Commit the change with a descriptive message.
```

### Add New Skill Command

Adds a new skill command to the ECC bundle, documenting how to add new skills.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/commands/add-new-skill-command.md' with instructions or definitions for the new skill command.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/commands/add-new-skill-command.md`

**Example commit sequence**:
```
Create or update '.claude/commands/add-new-skill-command.md' with instructions or definitions for the new skill command.
Commit the change with a descriptive message.
```

### Feature Development Command

Adds or updates the feature development workflow documentation in the ECC bundle.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/commands/feature-development.md' with feature development workflow details.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/commands/feature-development.md`

**Example commit sequence**:
```
Create or update '.claude/commands/feature-development.md' with feature development workflow details.
Commit the change with a descriptive message.
```

### Update Team Config

Updates the team configuration for the everything-claude-code project.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/team/everything-claude-code-team-config.json' with new team settings.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/team/everything-claude-code-team-config.json`

**Example commit sequence**:
```
Create or update '.claude/team/everything-claude-code-team-config.json' with new team settings.
Commit the change with a descriptive message.
```

### Add Or Update Skill Md

Adds or updates SKILL.md documentation for a skill in both the agents and claude skills directories.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.agents/skills/everything-claude-code/SKILL.md' with skill documentation.
2. Create or update '.claude/skills/everything-claude-code/SKILL.md' with corresponding documentation.
3. Commit the changes with a descriptive message.

**Files typically involved**:
- `.agents/skills/everything-claude-code/SKILL.md`
- `.claude/skills/everything-claude-code/SKILL.md`

**Example commit sequence**:
```
Create or update '.agents/skills/everything-claude-code/SKILL.md' with skill documentation.
Create or update '.claude/skills/everything-claude-code/SKILL.md' with corresponding documentation.
Commit the changes with a descriptive message.
```

### Update Identity Json

Updates the identity configuration for the ECC system.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/identity.json' with new identity information.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/identity.json`

**Example commit sequence**:
```
Create or update '.claude/identity.json' with new identity information.
Commit the change with a descriptive message.
```

### Update Ecc Tools Json

Adds or updates the ECC tools configuration.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/ecc-tools.json' with tool definitions.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/ecc-tools.json`

**Example commit sequence**:
```
Create or update '.claude/ecc-tools.json' with tool definitions.
Commit the change with a descriptive message.
```

### Update Guardrails Md

Adds or updates guardrails documentation for the ECC system.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update '.claude/rules/everything-claude-code-guardrails.md' with guardrail rules.
2. Commit the change with a descriptive message.

**Files typically involved**:
- `.claude/rules/everything-claude-code-guardrails.md`

**Example commit sequence**:
```
Create or update '.claude/rules/everything-claude-code-guardrails.md' with guardrail rules.
Commit the change with a descriptive message.
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Follow *.test.js naming pattern
- Use camelCase for file names
- Prefer named exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
