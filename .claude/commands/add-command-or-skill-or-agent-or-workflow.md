---
name: add-command-or-skill-or-agent-or-workflow
description: Workflow command scaffold for add-command-or-skill-or-agent-or-workflow in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-command-or-skill-or-agent-or-workflow

Use this workflow when working on **add-command-or-skill-or-agent-or-workflow** in `everything-claude-code`.

## Goal

Adds a new documentation command, skill, agent, or workflow to the ECC bundle.

## Common Files

- `.claude/commands/add-documentation-command-or-skill-or-agent-or-workflow.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a markdown file in .claude/commands/ with a descriptive name.
- Commit the new or updated file with a 'feat: add everything-claude-code ECC bundle' message.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.