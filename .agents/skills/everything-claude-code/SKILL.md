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

- `fix`
- `test`
- `feat`
- `docs`
- `chore`

### Message Guidelines

- Average message length: ~65 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
fix: resolve 8 test failures on main (install pipeline, orchestrator, repair) (#564)
```

*Commit message example*

```text
feat(agents): add java-build-resolver for Maven/Gradle (#538)
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
fix: sync documentation counts with catalog (25 agents, 108 skills, 57 commands)
```

*Commit message example*

```text
feat: add C++ language support and hook tests (#539)
```

*Commit message example*

```text
fix: refresh orchestration follow-up after #414 (#430)
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
Merge pull request #309 from cookiee339/feat/kotlin-ecosystem
docs: address Korean translation review feedback
Merge pull request #403 from swarnika-cmd/main
```

### Add New Skill Or Agent

Adds a new skill or agent to the system, including documentation, registration, and sometimes test coverage.

**Frequency**: ~4 times per month

**Steps**:
1. Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
2. Register the agent/skill in AGENTS.md or rules/common/agents.md
3. If applicable, add OpenAI/Codex YAML config in .agents/skills/<skill>/agents/openai.yaml
4. If applicable, add command documentation in commands/<command>.md
5. If applicable, add test files in tests/hooks/ or tests/lib/

**Files typically involved**:
- `skills/*/SKILL.md`
- `agents/*.md`
- `AGENTS.md`
- `rules/common/agents.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `commands/*.md`
- `tests/hooks/*.test.js`
- `tests/lib/*.test.js`

**Example commit sequence**:
```
Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
Register the agent/skill in AGENTS.md or rules/common/agents.md
If applicable, add OpenAI/Codex YAML config in .agents/skills/<skill>/agents/openai.yaml
If applicable, add command documentation in commands/<command>.md
If applicable, add test files in tests/hooks/ or tests/lib/
```

### Add Or Update Language Support

Adds or expands support for a programming language, including agents, commands, rules, and tests.

**Frequency**: ~2 times per month

**Steps**:
1. Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
2. Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
3. Add or update rules/<language>/*.md (coding-style, hooks, patterns, security, testing)
4. Add or update skills/<language>-patterns/SKILL.md, skills/<language>-testing/SKILL.md, etc.
5. Register agents in AGENTS.md
6. Add or update test files in tests/hooks/ or tests/lib/

**Files typically involved**:
- `agents/*-reviewer.md`
- `agents/*-build-resolver.md`
- `commands/*-build.md`
- `commands/*-review.md`
- `commands/*-test.md`
- `rules/*/*.md`
- `skills/*-patterns/SKILL.md`
- `skills/*-testing/SKILL.md`
- `AGENTS.md`
- `tests/hooks/*.test.js`
- `tests/lib/*.test.js`

**Example commit sequence**:
```
Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
Add or update rules/<language>/*.md (coding-style, hooks, patterns, security, testing)
Add or update skills/<language>-patterns/SKILL.md, skills/<language>-testing/SKILL.md, etc.
Register agents in AGENTS.md
Add or update test files in tests/hooks/ or tests/lib/
```

### Add Or Update Install Manifests

Updates install manifests to include new skills, modules, or components, ensuring full coverage and validation.

**Frequency**: ~2 times per month

**Steps**:
1. Edit manifests/install-components.json, install-modules.json, and/or install-profiles.json
2. Update or create schemas/install-*.schema.json as needed
3. Run or update validation scripts/tests (scripts/ci/validate-install-manifests.js, tests/ci/validators.test.js)

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`
- `schemas/install-components.schema.json`
- `schemas/install-modules.schema.json`
- `schemas/install-profiles.schema.json`
- `scripts/ci/validate-install-manifests.js`
- `tests/ci/validators.test.js`

**Example commit sequence**:
```
Edit manifests/install-components.json, install-modules.json, and/or install-profiles.json
Update or create schemas/install-*.schema.json as needed
Run or update validation scripts/tests (scripts/ci/validate-install-manifests.js, tests/ci/validators.test.js)
```

### Add Or Update Cross Harness Skill Copies

Synchronizes or adds skill documentation across multiple harness directories (.agents/skills, .cursor/skills, skills/).

**Frequency**: ~2 times per month

**Steps**:
1. Add or update SKILL.md in skills/<skill>/, .agents/skills/<skill>/, and .cursor/skills/<skill>/
2. If applicable, update agents/openai.yaml in .agents/skills/<skill>/agents/
3. Align documentation with CONTRIBUTING template

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`

**Example commit sequence**:
```
Add or update SKILL.md in skills/<skill>/, .agents/skills/<skill>/, and .cursor/skills/<skill>/
If applicable, update agents/openai.yaml in .agents/skills/<skill>/agents/
Align documentation with CONTRIBUTING template
```

### Add Or Update Command

Adds a new user command or updates an existing one, including documentation and sometimes agent/skill linkage.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update commands/<command>.md
2. If applicable, add or update agents/<agent>.md or skills/<skill>/SKILL.md
3. If applicable, update AGENTS.md or rules/common/agents.md
4. If applicable, add or update test files in tests/scripts/

**Files typically involved**:
- `commands/*.md`
- `agents/*.md`
- `skills/*/SKILL.md`
- `AGENTS.md`
- `rules/common/agents.md`
- `tests/scripts/*.test.js`

**Example commit sequence**:
```
Create or update commands/<command>.md
If applicable, add or update agents/<agent>.md or skills/<skill>/SKILL.md
If applicable, update AGENTS.md or rules/common/agents.md
If applicable, add or update test files in tests/scripts/
```

### Add Or Update Observer Orchestration Hooks

Adds or hardens observer/orchestration shell scripts and their associated tests for workflow automation and reliability.

**Frequency**: ~2 times per month

**Steps**:
1. Edit skills/continuous-learning-v2/hooks/observe.sh or agents/observer-loop.sh
2. Edit or add supporting JS orchestrator logic (scripts/lib/tmux-worktree-orchestrator.js, etc)
3. Add or update tests in tests/hooks/ or tests/lib/
4. If applicable, update documentation in skills/continuous-learning-v2/SKILL.md

**Files typically involved**:
- `skills/continuous-learning-v2/hooks/observe.sh`
- `skills/continuous-learning-v2/agents/observer-loop.sh`
- `scripts/lib/tmux-worktree-orchestrator.js`
- `tests/hooks/*.test.js`
- `tests/lib/*.test.js`
- `skills/continuous-learning-v2/SKILL.md`

**Example commit sequence**:
```
Edit skills/continuous-learning-v2/hooks/observe.sh or agents/observer-loop.sh
Edit or add supporting JS orchestrator logic (scripts/lib/tmux-worktree-orchestrator.js, etc)
Add or update tests in tests/hooks/ or tests/lib/
If applicable, update documentation in skills/continuous-learning-v2/SKILL.md
```

### Add Or Update Multilingual Documentation

Adds or updates documentation in multiple languages (e.g., zh-CN, ko-KR, ja-JP) to keep translations in sync with upstream changes.

**Frequency**: ~2 times per month

**Steps**:
1. Edit or add docs/<lang>/* files (README.md, AGENTS.md, commands, rules, skills, etc)
2. Sync changes with latest upstream English docs
3. Address translation review feedback

**Files typically involved**:
- `docs/zh-CN/*`
- `docs/ko-KR/*`
- `docs/ja-JP/*`
- `docs/zh-TW/*`

**Example commit sequence**:
```
Edit or add docs/<lang>/* files (README.md, AGENTS.md, commands, rules, skills, etc)
Sync changes with latest upstream English docs
Address translation review feedback
```

### Feature Development With Tests And Docs

Implements a new feature or major improvement, accompanied by tests and documentation updates.

**Frequency**: ~2 times per month

**Steps**:
1. Implement feature in scripts/lib/, scripts/, or core logic files
2. Add or update related test files in tests/lib/, tests/scripts/, or tests/hooks/
3. Update or add documentation in README.md or relevant docs/
4. If applicable, update or create supporting schemas/

**Files typically involved**:
- `scripts/lib/**/*.js`
- `scripts/**/*.js`
- `tests/lib/**/*.test.js`
- `tests/scripts/**/*.test.js`
- `tests/hooks/**/*.test.js`
- `README.md`
- `docs/**/*.md`
- `schemas/*.json`

**Example commit sequence**:
```
Implement feature in scripts/lib/, scripts/, or core logic files
Add or update related test files in tests/lib/, tests/scripts/, or tests/hooks/
Update or add documentation in README.md or relevant docs/
If applicable, update or create supporting schemas/
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
