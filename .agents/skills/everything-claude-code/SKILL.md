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

Adds a new skill or agent to the system, including documentation and registration.

**Frequency**: ~5 times per month

**Steps**:
1. Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
2. If cross-harness, also add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md
3. Register the agent/skill in AGENTS.md or rules/common/agents.md if needed
4. Add or update openai.yaml for agent harness compatibility (optional, for Codex/Cursor)
5. Update documentation (README.md, rules, commands) if needed

**Files typically involved**:
- `skills/*/SKILL.md`
- `agents/*.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `AGENTS.md`
- `rules/common/agents.md`
- `.agents/skills/*/agents/openai.yaml`

**Example commit sequence**:
```
Create or update SKILL.md in skills/<skill-name>/ or agents/<agent-name>.md
If cross-harness, also add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md
Register the agent/skill in AGENTS.md or rules/common/agents.md if needed
Add or update openai.yaml for agent harness compatibility (optional, for Codex/Cursor)
Update documentation (README.md, rules, commands) if needed
```

### Add New Command

Adds a new user-facing command to the system, including documentation.

**Frequency**: ~3 times per month

**Steps**:
1. Create commands/<command-name>.md with usage and documentation
2. If mirrored, also add .opencode/commands/<command-name>.md
3. Update README.md or AGENTS.md with command count or description
4. Add or update tests for the command if applicable

**Files typically involved**:
- `commands/*.md`
- `.opencode/commands/*.md`
- `README.md`
- `AGENTS.md`
- `tests/scripts/*.test.js`

**Example commit sequence**:
```
Create commands/<command-name>.md with usage and documentation
If mirrored, also add .opencode/commands/<command-name>.md
Update README.md or AGENTS.md with command count or description
Add or update tests for the command if applicable
```

### Add Language Support

Adds support for a new programming language, including agents, commands, rules, and tests.

**Frequency**: ~2 times per month

**Steps**:
1. Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
2. Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
3. Add rules/<language>/* (coding-style.md, hooks.md, patterns.md, security.md, testing.md)
4. Add skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md
5. Update AGENTS.md and rules/common/agents.md
6. Add or update tests/hooks and tests/scripts for new language features

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
- `rules/common/agents.md`
- `tests/hooks/*.test.js`
- `tests/scripts/*.test.js`

**Example commit sequence**:
```
Add agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md
Add commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md
Add rules/<language>/* (coding-style.md, hooks.md, patterns.md, security.md, testing.md)
Add skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md
Update AGENTS.md and rules/common/agents.md
Add or update tests/hooks and tests/scripts for new language features
```

### Add Or Update Install Manifests

Adds or updates install manifests to include new or missing skills/modules.

**Frequency**: ~2 times per month

**Steps**:
1. Edit manifests/install-components.json, install-modules.json, or install-profiles.json
2. Update or create schemas/install-*.schema.json if structure changes
3. Run or update validation scripts (scripts/ci/validate-install-manifests.js)
4. Update README.md or documentation if install instructions change

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`
- `schemas/install-components.schema.json`
- `schemas/install-modules.schema.json`
- `schemas/install-profiles.schema.json`
- `scripts/ci/validate-install-manifests.js`
- `README.md`

**Example commit sequence**:
```
Edit manifests/install-components.json, install-modules.json, or install-profiles.json
Update or create schemas/install-*.schema.json if structure changes
Run or update validation scripts (scripts/ci/validate-install-manifests.js)
Update README.md or documentation if install instructions change
```

### Cross Platform Install Support

Improves or fixes install scripts for cross-platform (Windows, Linux, macOS) compatibility.

**Frequency**: ~2 times per month

**Steps**:
1. Add or update install.ps1 for Windows support
2. Update install.sh and scripts/install-apply.js for cross-platform logic
3. Update package.json/package-lock.json to include new scripts or bin entries
4. Add or update tests/scripts/install-ps1.test.js and install-sh.test.js
5. Update README.md with new install instructions

**Files typically involved**:
- `install.ps1`
- `install.sh`
- `scripts/install-apply.js`
- `package.json`
- `package-lock.json`
- `tests/scripts/install-ps1.test.js`
- `tests/scripts/install-sh.test.js`
- `README.md`

**Example commit sequence**:
```
Add or update install.ps1 for Windows support
Update install.sh and scripts/install-apply.js for cross-platform logic
Update package.json/package-lock.json to include new scripts or bin entries
Add or update tests/scripts/install-ps1.test.js and install-sh.test.js
Update README.md with new install instructions
```

### Add Or Update Session Adapter

Adds or improves session adapter logic for session inspection, recording, or replay.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update scripts/lib/session-adapters/*.js
2. Update scripts/session-inspect.js to wire in new adapters
3. Add or update tests/lib/session-adapters.test.js and tests/scripts/session-inspect.test.js
4. Document new adapter contract in docs/SESSION-ADAPTER-CONTRACT.md

**Files typically involved**:
- `scripts/lib/session-adapters/*.js`
- `scripts/session-inspect.js`
- `tests/lib/session-adapters.test.js`
- `tests/scripts/session-inspect.test.js`
- `docs/SESSION-ADAPTER-CONTRACT.md`

**Example commit sequence**:
```
Create or update scripts/lib/session-adapters/*.js
Update scripts/session-inspect.js to wire in new adapters
Add or update tests/lib/session-adapters.test.js and tests/scripts/session-inspect.test.js
Document new adapter contract in docs/SESSION-ADAPTER-CONTRACT.md
```

### Multi Language Documentation Sync

Synchronizes documentation across multiple languages (e.g., English, Chinese, Korean, Japanese).

**Frequency**: ~2 times per month

**Steps**:
1. Update docs/<lang>/**/*.md files for all relevant topics (agents, commands, skills, rules, etc.)
2. Sync README.md and other root docs in each language
3. Address translation review feedback as needed

**Files typically involved**:
- `docs/zh-CN/**/*.md`
- `docs/ko-KR/**/*.md`
- `docs/ja-JP/**/*.md`
- `docs/zh-TW/**/*.md`
- `README.md`
- `README.zh-CN.md`

**Example commit sequence**:
```
Update docs/<lang>/**/*.md files for all relevant topics (agents, commands, skills, rules, etc.)
Sync README.md and other root docs in each language
Address translation review feedback as needed
```

### Observer Hook Improvement

Improves or fixes the observer/observe.sh logic for continuous learning and session monitoring.

**Frequency**: ~3 times per month

**Steps**:
1. Edit skills/continuous-learning-v2/hooks/observe.sh and related scripts
2. Update or add tests/hooks/hooks.test.js
3. If needed, update skills/continuous-learning-v2/agents/*.sh or scripts
4. Document changes if required

**Files typically involved**:
- `skills/continuous-learning-v2/hooks/observe.sh`
- `skills/continuous-learning-v2/agents/*.sh`
- `tests/hooks/hooks.test.js`

**Example commit sequence**:
```
Edit skills/continuous-learning-v2/hooks/observe.sh and related scripts
Update or add tests/hooks/hooks.test.js
If needed, update skills/continuous-learning-v2/agents/*.sh or scripts
Document changes if required
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
