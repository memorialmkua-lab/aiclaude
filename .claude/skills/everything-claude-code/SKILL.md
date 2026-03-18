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
- **Test Framework**: unknown

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 8 analyzed commits.

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

### Test Framework: unknown

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
feat: orchestration harness, selective install, observer improvements
merge: dmux worktree (selective install, orchestration, observer fixes)
feat: expand session adapter registry with structured targets
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
Merge pull request #309 from cookiee339/feat/kotlin-ecosystem
docs: address Korean translation review feedback
Merge pull request #403 from swarnika-cmd/main
```

### Add New Skill Or Agent

Adds a new skill or agent to the system, including documentation and registration.

**Frequency**: ~6 times per month

**Steps**:
1. Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
2. Add or update agent/skill documentation in AGENTS.md or rules/common/agents.md
3. Optionally, add openai.yaml for agent harness integration
4. Register new skill/agent in install manifests or documentation counts

**Files typically involved**:
- `skills/*/SKILL.md`
- `agents/*.md`
- `AGENTS.md`
- `rules/common/agents.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`

**Example commit sequence**:
```
Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
Add or update agent/skill documentation in AGENTS.md or rules/common/agents.md
Optionally, add openai.yaml for agent harness integration
Register new skill/agent in install manifests or documentation counts
```

### Add New Command

Adds a new slash command for the CLI or agent system, with documentation and sometimes tests.

**Frequency**: ~3 times per month

**Steps**:
1. Create commands/<command-name>.md
2. Optionally, add .opencode/commands/<command-name>.md mirror
3. Optionally, add tests for the command in tests/scripts/
4. Update README.md or AGENTS.md if command count is tracked

**Files typically involved**:
- `commands/*.md`
- `.opencode/commands/*.md`
- `tests/scripts/*.test.js`
- `README.md`
- `AGENTS.md`

**Example commit sequence**:
```
Create commands/<command-name>.md
Optionally, add .opencode/commands/<command-name>.md mirror
Optionally, add tests for the command in tests/scripts/
Update README.md or AGENTS.md if command count is tracked
```

### Language Support Expansion

Adds support for a new programming language (agent, commands, rules, tests, documentation).

**Frequency**: ~2 times per month

**Steps**:
1. Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
2. Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
3. Add rules/<language>/*.md (coding-style, hooks, patterns, security, testing)
4. Add skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md
5. Add or update tests/hooks/ and tests/scripts/ for new language
6. Register new agents/skills in AGENTS.md and install manifests

**Files typically involved**:
- `agents/*-reviewer.md`
- `agents/*-build-resolver.md`
- `commands/*-build.md`
- `commands/*-review.md`
- `commands/*-test.md`
- `rules/*/*.md`
- `skills/*-patterns/SKILL.md`
- `skills/*-testing/SKILL.md`
- `tests/hooks/*.test.js`
- `tests/scripts/*.test.js`
- `AGENTS.md`
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`

**Example commit sequence**:
```
Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
Add rules/<language>/*.md (coding-style, hooks, patterns, security, testing)
Add skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md
Add or update tests/hooks/ and tests/scripts/ for new language
Register new agents/skills in AGENTS.md and install manifests
```

### Cross Harness Skill Sync

Synchronizes or mirrors skill documentation across different agent harnesses (Codex, Cursor, etc).

**Frequency**: ~2 times per month

**Steps**:
1. Copy or update SKILL.md in .agents/skills/<skill>/, .cursor/skills/<skill>/, and skills/<skill>/
2. Optionally, update openai.yaml in .agents/skills/<skill>/agents/
3. Align documentation with CONTRIBUTING template

**Files typically involved**:
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`

**Example commit sequence**:
```
Copy or update SKILL.md in .agents/skills/<skill>/, .cursor/skills/<skill>/, and skills/<skill>/
Optionally, update openai.yaml in .agents/skills/<skill>/agents/
Align documentation with CONTRIBUTING template
```

### Install Manifest Update

Updates install manifests to add or sync skills, modules, or components.

**Frequency**: ~2 times per month

**Steps**:
1. Edit manifests/install-components.json, install-modules.json, install-profiles.json
2. Optionally, add new modules or update existing ones with new skills
3. Run or update validation scripts/tests for manifests

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`
- `scripts/ci/validate-install-manifests.js`
- `tests/lib/install-manifests.test.js`

**Example commit sequence**:
```
Edit manifests/install-components.json, install-modules.json, install-profiles.json
Optionally, add new modules or update existing ones with new skills
Run or update validation scripts/tests for manifests
```

### Localization Or Translation Sync

Synchronizes or updates documentation and skill files for new or updated translations (e.g., zh-CN, ko-KR, ja-JP).

**Frequency**: ~2 times per month

**Steps**:
1. Add or update docs/<lang>/* files (README.md, commands, agents, skills, rules, examples, etc.)
2. Sync translated files with latest upstream changes
3. Address review feedback for translation accuracy

**Files typically involved**:
- `docs/zh-CN/**/*`
- `docs/ko-KR/**/*`
- `docs/ja-JP/**/*`
- `docs/zh-TW/**/*`

**Example commit sequence**:
```
Add or update docs/<lang>/* files (README.md, commands, agents, skills, rules, examples, etc.)
Sync translated files with latest upstream changes
Address review feedback for translation accuracy
```

### Fix Or Enhance Observer Hooks

Improves, hardens, or fixes the observer/observe.sh logic and related tests.

**Frequency**: ~2 times per month

**Steps**:
1. Edit skills/continuous-learning-v2/hooks/observe.sh (or agents/observer-loop.sh)
2. Update or add related test files in tests/hooks/hooks.test.js
3. Optionally, update documentation or config for observer logic

**Files typically involved**:
- `skills/continuous-learning-v2/hooks/observe.sh`
- `skills/continuous-learning-v2/agents/observer-loop.sh`
- `tests/hooks/hooks.test.js`

**Example commit sequence**:
```
Edit skills/continuous-learning-v2/hooks/observe.sh (or agents/observer-loop.sh)
Update or add related test files in tests/hooks/hooks.test.js
Optionally, update documentation or config for observer logic
```

### Ci Catalog Or Count Sync

Synchronizes catalog counts or enforces integrity between documentation and code (agents, skills, commands).

**Frequency**: ~2 times per month

**Steps**:
1. Update AGENTS.md, README.md with new counts
2. Edit or add scripts/ci/catalog.js or similar validation scripts
3. Update or add tests/ci/validators.test.js
4. Edit .github/workflows/ci.yml if CI logic changes

**Files typically involved**:
- `AGENTS.md`
- `README.md`
- `scripts/ci/catalog.js`
- `tests/ci/validators.test.js`
- `.github/workflows/ci.yml`

**Example commit sequence**:
```
Update AGENTS.md, README.md with new counts
Edit or add scripts/ci/catalog.js or similar validation scripts
Update or add tests/ci/validators.test.js
Edit .github/workflows/ci.yml if CI logic changes
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Write tests using unknown
- Follow *.test.js naming pattern
- Use camelCase for file names
- Prefer named exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
