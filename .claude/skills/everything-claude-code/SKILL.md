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

- Average message length: ~66 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
feat: add everything-claude-code ECC bundle (.claude/commands/add-new-skill.md)
```

*Commit message example*

```text
chore: prepare v1.9.0 release
```

*Commit message example*

```text
fix(clv2): use -e instead of -d for .git check in detect-project.sh
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
feat: add everything-claude-code ECC bundle (.claude/commands/add-new-agent.md)
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

### Export Style: Mixed Style


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

**Frequency**: ~29 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `**/*.test.*`

**Example commit sequence**:
```
fix(clv2): add --allowedTools to observer Haiku invocation (#661)
fix(clv2): use -e instead of -d for .git check in detect-project.sh
Merge pull request #665 from ymdvsymd/fix/worktree-project-id-mismatch
```

### Add Command Documentation

Adds a new command documentation file for everything-claude-code ECC bundle.

**Frequency**: ~3 times per month

**Steps**:
1. Create or update a markdown file in .claude/commands/ with the command name.
2. Commit the new or updated command documentation file.

**Files typically involved**:
- `.claude/commands/add-new-skill.md`
- `.claude/commands/add-new-agent.md`
- `.claude/commands/feature-development.md`

**Example commit sequence**:
```
Create or update a markdown file in .claude/commands/ with the command name.
Commit the new or updated command documentation file.
```

### Add Skill Documentation

Adds or updates documentation for a skill in both .agents/skills and .claude/skills directories.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update SKILL.md in .agents/skills/everything-claude-code/
2. Create or update SKILL.md in .claude/skills/everything-claude-code/
3. Commit both files together.

**Files typically involved**:
- `.agents/skills/everything-claude-code/SKILL.md`
- `.claude/skills/everything-claude-code/SKILL.md`

**Example commit sequence**:
```
Create or update SKILL.md in .agents/skills/everything-claude-code/
Create or update SKILL.md in .claude/skills/everything-claude-code/
Commit both files together.
```

### Add Agent Configuration

Adds or updates agent configuration files in .codex/agents and/or .agents/skills directories.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update a TOML file in .codex/agents/ (e.g., docs-researcher.toml, reviewer.toml, explorer.toml).
2. Optionally, create or update a YAML file in .agents/skills/everything-claude-code/agents/ (e.g., openai.yaml).
3. Commit the new or updated configuration files.

**Files typically involved**:
- `.codex/agents/docs-researcher.toml`
- `.codex/agents/reviewer.toml`
- `.codex/agents/explorer.toml`
- `.agents/skills/everything-claude-code/agents/openai.yaml`

**Example commit sequence**:
```
Create or update a TOML file in .codex/agents/ (e.g., docs-researcher.toml, reviewer.toml, explorer.toml).
Optionally, create or update a YAML file in .agents/skills/everything-claude-code/agents/ (e.g., openai.yaml).
Commit the new or updated configuration files.
```

### Update Meta And Team Config

Updates project-level configuration and metadata files such as identity, team config, tools, and guardrails.

**Frequency**: ~2 times per month

**Steps**:
1. Edit .claude/identity.json as needed.
2. Edit .claude/team/everything-claude-code-team-config.json as needed.
3. Edit .claude/ecc-tools.json as needed.
4. Edit .claude/rules/everything-claude-code-guardrails.md as needed.
5. Commit the updated files.

**Files typically involved**:
- `.claude/identity.json`
- `.claude/team/everything-claude-code-team-config.json`
- `.claude/ecc-tools.json`
- `.claude/rules/everything-claude-code-guardrails.md`

**Example commit sequence**:
```
Edit .claude/identity.json as needed.
Edit .claude/team/everything-claude-code-team-config.json as needed.
Edit .claude/ecc-tools.json as needed.
Edit .claude/rules/everything-claude-code-guardrails.md as needed.
Commit the updated files.
```

### Release Version Bump

Prepares a new release by bumping version numbers, updating changelogs, and refreshing documentation.

**Frequency**: ~1 times per month

**Steps**:
1. Update version numbers in package.json, package-lock.json, and .opencode/package.json.
2. Add or update CHANGELOG.md with release notes.
3. Update README.md and docs/zh-CN/README.md with new release information.
4. Update AGENTS.md and other documentation as needed.
5. Commit all related files together.

**Files typically involved**:
- `package.json`
- `package-lock.json`
- `.opencode/package.json`
- `CHANGELOG.md`
- `README.md`
- `docs/zh-CN/README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Update version numbers in package.json, package-lock.json, and .opencode/package.json.
Add or update CHANGELOG.md with release notes.
Update README.md and docs/zh-CN/README.md with new release information.
Update AGENTS.md and other documentation as needed.
Commit all related files together.
```

### Bugfix With Test Update

Fixes a bug in a script or agent and updates/creates a corresponding test file.

**Frequency**: ~2 times per month

**Steps**:
1. Edit the script or agent file to fix the bug.
2. Edit or add the corresponding test file in tests/hooks/.
3. Commit both the fix and the test together.

**Files typically involved**:
- `skills/continuous-learning-v2/scripts/detect-project.sh`
- `skills/continuous-learning-v2/agents/observer-loop.sh`
- `tests/hooks/detect-project-worktree.test.js`
- `tests/hooks/observer-memory.test.js`

**Example commit sequence**:
```
Edit the script or agent file to fix the bug.
Edit or add the corresponding test file in tests/hooks/.
Commit both the fix and the test together.
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
