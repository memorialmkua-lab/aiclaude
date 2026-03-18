---
name: add-command-or-workflow-doc
description: Workflow command scaffold for add-command-or-workflow-doc in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-command-or-workflow-doc

Use this workflow when working on **add-command-or-workflow-doc** in `everything-claude-code`.

## Goal

Adds documentation for a new command or workflow to the system.

## Common Files

- `.claude/commands/add-command-or-workflow-doc.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a markdown file under .claude/commands/ with the command or workflow documentation.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.