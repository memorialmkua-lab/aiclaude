---
name: requesting-code-review
description: Use after completing a task, feature, or bugfix to dispatch the code-reviewer agent before merging or proceeding
---

# Requesting Code Review

Dispatch the code-reviewer agent to catch issues before they cascade.

**Core principle:** Review early, review often. The code-reviewer agent (`~/.claude/agents/code-reviewer.md`) handles the actual review. This skill covers **when and how to request it**.

## When to Request Review

**Mandatory:**
- After completing each task in executing-plans (Subagent mode)
- After completing a major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective from a reviewer subagent)
- Before refactoring (baseline quality check)
- After fixing a complex bug

## How to Request

**1. Identify the git range to review:**

```bash
BASE_SHA=$(git merge-base HEAD origin/main)
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch the code-reviewer agent via Task tool:**

Provide these fields in the Task tool prompt:
- **What was implemented** -- summary of the work
- **Requirements** -- plan file path or spec to compare against
- **Base SHA** -- starting commit
- **Head SHA** -- ending commit

Example Task tool dispatch:

```
Review the code changes between commits a7981ec and 3df7661.

What was implemented: Verification and repair functions for conversation index.
Requirements: Task 2 from docs/plans/deployment-plan.md
Base SHA: a7981ec
Head SHA: 3df7661

Run git diff --stat and git diff on this range. Review for security,
code quality, architecture, testing, and requirements compliance.
Use the review checklist from your agent instructions.
```

**3. Act on feedback:**

| Severity | Action |
|----------|--------|
| Critical | Fix immediately, re-review |
| Important | Fix before proceeding to next task |
| Minor | Note for later or fix if quick |

Push back on incorrect feedback with technical reasoning and evidence.

## Integration with Workflows

**executing-plans (Subagent mode):**
- Review after EACH task via the spec-reviewer and code-quality-reviewer prompts built into that workflow
- The executing-plans skill handles dispatch automatically

**executing-plans (Manual mode):**
- Review after each batch (default: 3 tasks)
- Apply feedback, then continue

**Ad-hoc development:**
- Review before merge
- Review when stuck or after complex changes

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback without evidence
