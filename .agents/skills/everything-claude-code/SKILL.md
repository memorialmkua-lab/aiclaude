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
fix: auto-detect ECC root from plugin cache when CLAUDE_PLUGIN_ROOT is unset (#547)
```

*Commit message example*

```text
feat: implement --with/--without selective install flags (#679)
```

*Commit message example*

```text
chore: prepare v1.9.0 release (#666)
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
fix: resolve Windows CI failures and markdown lint (#667)
```

*Commit message example*

```text
feat(skills): add architecture-decision-records skill (#555)
```

*Commit message example*

```text
feat(commands): add /context-budget optimizer command (#554)
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

### Feature Development

Standard feature implementation workflow

**Frequency**: ~22 times per month

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
feat(skills): add documentation-lookup, bun-runtime, nextjs-turbopack; feat(agents): add rust-reviewer
docs(skills): align documentation-lookup with CONTRIBUTING template; add cross-harness (Codex/Cursor) skill copies
fix: address PR review — skill template (When to use, How it works, Examples), bun.lock, next build note, rust-reviewer CI note, doc-lookup privacy/uncertainty
```

### Add New Skill

Adds a new skill to the codebase, including documentation and harness support.

**Frequency**: ~6 times per month

**Steps**:
1. Create skills/<skill-name>/SKILL.md with full documentation and implementation details.
2. Optionally add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md for harness-specific copies.
3. If the skill requires agent or openai.yaml support, add those files under .agents/skills/<skill-name>/agents/openai.yaml.
4. Address PR review feedback by updating SKILL.md, triggers, and workflow steps.
5. Sync or remove .agents/ duplicate if required, keeping canonical in skills/.
6. Merge after review.

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`

**Example commit sequence**:
```
Create skills/<skill-name>/SKILL.md with full documentation and implementation details.
Optionally add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md for harness-specific copies.
If the skill requires agent or openai.yaml support, add those files under .agents/skills/<skill-name>/agents/openai.yaml.
Address PR review feedback by updating SKILL.md, triggers, and workflow steps.
Sync or remove .agents/ duplicate if required, keeping canonical in skills/.
Merge after review.
```

### Add New Agent

Adds a new agent to the system, including registration and documentation updates.

**Frequency**: ~3 times per month

**Steps**:
1. Create agents/<agent-name>.md with agent definition and instructions.
2. Update AGENTS.md to register the new agent and increment agent count.
3. If needed, update README.md and docs/COMMAND-AGENT-MAP.md to reflect new agent.
4. If the agent is language-specific, update rules/common/agents.md or similar files.
5. Address PR review feedback and sync documentation counts.
6. Merge after review.

**Files typically involved**:
- `agents/*.md`
- `AGENTS.md`
- `README.md`
- `docs/COMMAND-AGENT-MAP.md`
- `rules/common/agents.md`

**Example commit sequence**:
```
Create agents/<agent-name>.md with agent definition and instructions.
Update AGENTS.md to register the new agent and increment agent count.
If needed, update README.md and docs/COMMAND-AGENT-MAP.md to reflect new agent.
If the agent is language-specific, update rules/common/agents.md or similar files.
Address PR review feedback and sync documentation counts.
Merge after review.
```

### Add New Command

Adds a new slash command or user-facing command to the system.

**Frequency**: ~2 times per month

**Steps**:
1. Create commands/<command-name>.md with command documentation and usage instructions.
2. If the command is backed by a skill, create or update skills/<skill-name>/SKILL.md.
3. If the command is related to agents, ensure agents/<agent-name>.md and AGENTS.md are updated.
4. Update README.md or other documentation if needed.
5. Address PR review feedback and sync related files.
6. Merge after review.

**Files typically involved**:
- `commands/*.md`
- `skills/*/SKILL.md`
- `agents/*.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create commands/<command-name>.md with command documentation and usage instructions.
If the command is backed by a skill, create or update skills/<skill-name>/SKILL.md.
If the command is related to agents, ensure agents/<agent-name>.md and AGENTS.md are updated.
Update README.md or other documentation if needed.
Address PR review feedback and sync related files.
Merge after review.
```

### Add New Language Support

Adds support for a new programming language, including agents, rules, skills, and commands.

**Frequency**: ~1 times per month

**Steps**:
1. Create agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md.
2. Create rules/<language>/* (coding-style.md, hooks.md, patterns.md, security.md, testing.md).
3. Create skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md as needed.
4. Create commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md.
5. Update AGENTS.md and README.md with new agent and skill counts.
6. Address PR review feedback and sync all related files.
7. Merge after review.

**Files typically involved**:
- `agents/*-reviewer.md`
- `agents/*-build-resolver.md`
- `rules/*/*.md`
- `skills/*-patterns/SKILL.md`
- `skills/*-testing/SKILL.md`
- `commands/*-build.md`
- `commands/*-review.md`
- `commands/*-test.md`
- `AGENTS.md`
- `README.md`

**Example commit sequence**:
```
Create agents/<language>-reviewer.md and/or agents/<language>-build-resolver.md.
Create rules/<language>/* (coding-style.md, hooks.md, patterns.md, security.md, testing.md).
Create skills/<language>-patterns/SKILL.md and skills/<language>-testing/SKILL.md as needed.
Create commands/<language>-build.md, commands/<language>-review.md, commands/<language>-test.md.
Update AGENTS.md and README.md with new agent and skill counts.
Address PR review feedback and sync all related files.
Merge after review.
```

### Update Install Manifests

Updates install manifests to add new skills, agents, or modules to the installation process.

**Frequency**: ~1 times per month

**Steps**:
1. Edit manifests/install-components.json to add or update components.
2. Edit manifests/install-modules.json and/or manifests/install-profiles.json to reference new or reorganized modules.
3. Edit schemas/install-components.schema.json if new family prefixes or schema changes are needed.
4. Update scripts/lib/install-manifests.js for new logic or validation.
5. Add or update tests for selective install or manifest validation.
6. Run validation and ensure all tests pass.
7. Merge after review.

**Files typically involved**:
- `manifests/install-components.json`
- `manifests/install-modules.json`
- `manifests/install-profiles.json`
- `schemas/install-components.schema.json`
- `scripts/lib/install-manifests.js`
- `tests/lib/selective-install.test.js`

**Example commit sequence**:
```
Edit manifests/install-components.json to add or update components.
Edit manifests/install-modules.json and/or manifests/install-profiles.json to reference new or reorganized modules.
Edit schemas/install-components.schema.json if new family prefixes or schema changes are needed.
Update scripts/lib/install-manifests.js for new logic or validation.
Add or update tests for selective install or manifest validation.
Run validation and ensure all tests pass.
Merge after review.
```

### Sync Documentation Counts And Catalog

Synchronizes documentation counts (agents, skills, commands) with the actual catalog and updates summary tables.

**Frequency**: ~2 times per month

**Steps**:
1. Update agent and skill counts in README.md and AGENTS.md (quick-start, comparison tables, summaries).
2. Update command counts if needed.
3. Update any related summary tables or project structure sections.
4. Optionally update tests/lib/skill-dashboard.test.js or similar test files.
5. Merge after review.

**Files typically involved**:
- `README.md`
- `AGENTS.md`
- `tests/lib/skill-dashboard.test.js`

**Example commit sequence**:
```
Update agent and skill counts in README.md and AGENTS.md (quick-start, comparison tables, summaries).
Update command counts if needed.
Update any related summary tables or project structure sections.
Optionally update tests/lib/skill-dashboard.test.js or similar test files.
Merge after review.
```

### Fix Or Enhance Skill Or Agent After Review

Addresses review feedback for a skill or agent, often involving multiple incremental fixes to documentation, triggers, examples, or workflow steps.

**Frequency**: ~4 times per month

**Steps**:
1. Edit skills/<skill-name>/SKILL.md or agents/<agent-name>.md to address specific feedback (e.g., update triggers, add examples, clarify workflow).
2. Sync or update .agents/skills/<skill-name>/SKILL.md or openai.yaml copies if needed.
3. Remove or consolidate duplicate files as per repo convention.
4. Repeat as necessary until review is approved.
5. Merge after review.

**Files typically involved**:
- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `agents/*.md`

**Example commit sequence**:
```
Edit skills/<skill-name>/SKILL.md or agents/<agent-name>.md to address specific feedback (e.g., update triggers, add examples, clarify workflow).
Sync or update .agents/skills/<skill-name>/SKILL.md or openai.yaml copies if needed.
Remove or consolidate duplicate files as per repo convention.
Repeat as necessary until review is approved.
Merge after review.
```

### Add Or Update Tests For New Features Or Fixes

Adds or updates tests when implementing new features, commands, or bug fixes.

**Frequency**: ~2 times per month

**Steps**:
1. Create or update tests in tests/lib/, tests/hooks/, or tests/scripts/ as appropriate.
2. Ensure tests cover new CLI flags, commands, or edge cases introduced by the change.
3. Run the test suite and ensure all tests pass.
4. Merge after review.

**Files typically involved**:
- `tests/lib/*.test.js`
- `tests/hooks/*.test.js`
- `tests/scripts/*.test.js`

**Example commit sequence**:
```
Create or update tests in tests/lib/, tests/hooks/, or tests/scripts/ as appropriate.
Ensure tests cover new CLI flags, commands, or edge cases introduced by the change.
Run the test suite and ensure all tests pass.
Merge after review.
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
