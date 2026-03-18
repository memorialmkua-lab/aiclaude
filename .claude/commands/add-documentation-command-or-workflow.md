---
name: add-documentation-command-or-workflow
description: Workflow command scaffold for add-documentation-command-or-workflow in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-documentation-command-or-workflow

Use this workflow when working on **add-documentation-command-or-workflow** in `everything-claude-code`.

## Goal

Adds documentation for a new command or workflow to the system.

## Common Files

- `.claude/commands/add-documentation-command-or-workflow.md`
- `.claude/commands/add-command-or-workflow-doc.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create a new markdown file in .claude/commands/ named add-documentation-command-or-workflow.md or similar.
- Commit the new documentation file.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.