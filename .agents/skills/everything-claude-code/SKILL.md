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
- `test`
- `feat`
- `docs`

### Message Guidelines

- Average message length: ~65 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


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
feat(skills): add pytorch-patterns skill (#550)
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
Merge pull request #664 from ymdvsymd/fix/observer-sandbox-access-661
```

*Commit message example*

```text
Merge pull request #665 from ymdvsymd/fix/worktree-project-id-mismatch
```

*Commit message example*

```text
fix(clv2): add --allowedTools to observer Haiku invocation (#661)
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

**Frequency**: ~22 times per month

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
feat: expand session adapter registry with structured targets
feat: self-improving skills loop — observe, inspect, amend, evaluate
fix: harden observer hooks and test discovery (#513)
```

### Add New Agent

Adds a new agent to the system, registers it in documentation and agent lists.

**Frequency**: ~4 times per month

**Steps**:
1. Create new agent markdown file in agents/ (e.g. agents/java-reviewer.md)
2. Add agent to AGENTS.md table and summary
3. Update README.md agent counts and agent tree if needed
4. Add to docs/COMMAND-AGENT-MAP.md if relevant

**Files typically involved**:
- `agents/*.md`
- `AGENTS.md`
- `README.md`
- `docs/COMMAND-AGENT-MAP.md`

**Example commit sequence**:
```
Create new agent markdown file in agents/ (e.g. agents/java-reviewer.md)
Add agent to AGENTS.md table and summary
Update README.md agent counts and agent tree if needed
Add to docs/COMMAND-AGENT-MAP.md if relevant
```

### Add New Skill

Adds a new skill to the catalog, following the SKILL.md template and updating counts.

**Frequency**: ~4 times per month

**Steps**:
1. Create new SKILL.md in skills/<skill-name>/SKILL.md
2. Optionally add cross-harness copies in .agents/skills/ and .cursor/skills/
3. Update skill counts in README.md and AGENTS.md if needed

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Create new SKILL.md in skills/<skill-name>/SKILL.md
Optionally add cross-harness copies in .agents/skills/ and .cursor/skills/
Update skill counts in README.md and AGENTS.md if needed
```

### Add Language Support

Adds support for a new programming language, including agents, skills, rules, and commands.

**Frequency**: ~2 times per month

**Steps**:
1. Add one or more agents in agents/ (e.g. build-resolver, reviewer)
2. Add one or more skills in skills/<language>-*/SKILL.md
3. Add rules in rules/<language>/ (coding-style.md, hooks.md, patterns.md, security.md, testing.md)
4. Add commands in commands/<language>-*.md
5. Update AGENTS.md and README.md with new language and counts

**Files typically involved**:
- `agents/*-build-resolver.md`
- `agents/*-reviewer.md`
- `skills/*-patterns/SKILL.md`
- `skills/*-testing/SKILL.md`
- `rules/*/*.md`
- `commands/*-build.md`
- `commands/*-review.md`
- `commands/*-test.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Add one or more agents in agents/ (e.g. build-resolver, reviewer)
Add one or more skills in skills/<language>-*/SKILL.md
Add rules in rules/<language>/ (coding-style.md, hooks.md, patterns.md, security.md, testing.md)
Add commands in commands/<language>-*.md
Update AGENTS.md and README.md with new language and counts
```

### Add Or Update Catalog Counts

Synchronizes the documented counts of agents, skills, and commands across documentation files.

**Frequency**: ~3 times per month

**Steps**:
1. Update agent/skill/command counts in README.md
2. Update counts in AGENTS.md
3. Update counts in other documentation as needed (e.g. docs/zh-CN/README.md)

**Files typically involved**:
- `README.md`
- `AGENTS.md`
- `docs/zh-CN/README.md`

**Example commit sequence**:
```
Update agent/skill/command counts in README.md
Update counts in AGENTS.md
Update counts in other documentation as needed (e.g. docs/zh-CN/README.md)
```

### Add New Rule Set For Language

Adds a new set of rules (coding-style, hooks, patterns, security, testing) for a supported language.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update rules/<language>/coding-style.md
2. Create or update rules/<language>/hooks.md
3. Create or update rules/<language>/patterns.md
4. Create or update rules/<language>/security.md
5. Create or update rules/<language>/testing.md

**Files typically involved**:
- `rules/*/coding-style.md`
- `rules/*/hooks.md`
- `rules/*/patterns.md`
- `rules/*/security.md`
- `rules/*/testing.md`

**Example commit sequence**:
```
Create or update rules/<language>/coding-style.md
Create or update rules/<language>/hooks.md
Create or update rules/<language>/patterns.md
Create or update rules/<language>/security.md
Create or update rules/<language>/testing.md
```

### Bugfix With Targeted Test

Fixes a bug in a script or agent and adds/updates a targeted test to verify the fix.

**Frequency**: ~3 times per month

**Steps**:
1. Update/fix script or agent file
2. Add or update a corresponding test file in tests/
3. Commit both together

**Files typically involved**:
- `skills/*/agents/*.sh`
- `skills/*/hooks/*.sh`
- `scripts/**/*.js`
- `tests/**/*.test.js`

**Example commit sequence**:
```
Update/fix script or agent file
Add or update a corresponding test file in tests/
Commit both together
```

### Add Or Update Install Manifests

Adds new skills to install manifests or updates install profiles/components.

**Frequency**: ~1 times per month

**Steps**:
1. Update manifests/install-components.json
2. Update manifests/install-modules.json
3. Update manifests/install-profiles.json

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`

**Example commit sequence**:
```
Update manifests/install-components.json
Update manifests/install-modules.json
Update manifests/install-profiles.json
```

### Release Version Bump

Prepares a new release by bumping version numbers, updating changelogs, and synchronizing documentation.

**Frequency**: ~1 times per month

**Steps**:
1. Bump version in package.json, package-lock.json, .opencode/package.json
2. Add/update CHANGELOG.md with release notes
3. Update README.md and AGENTS.md with new counts and features
4. Update version references in localized docs (e.g. docs/zh-CN/README.md)

**Files typically involved**:
- `package.json`
- `package-lock.json`
- `.opencode/package.json`
- `CHANGELOG.md`
- `README.md`
- `AGENTS.md`
- `docs/zh-CN/README.md`

**Example commit sequence**:
```
Bump version in package.json, package-lock.json, .opencode/package.json
Add/update CHANGELOG.md with release notes
Update README.md and AGENTS.md with new counts and features
Update version references in localized docs (e.g. docs/zh-CN/README.md)
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
