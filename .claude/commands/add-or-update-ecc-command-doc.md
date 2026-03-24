---
name: add-or-update-ecc-command-doc
description: Workflow command scaffold for add-or-update-ecc-command-doc in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-ecc-command-doc

Use this workflow when working on **add-or-update-ecc-command-doc** in `everything-claude-code`.

## Goal

Adds or updates documentation for an ECC command, typically as a Markdown file under .claude/commands.

## Common Files

- `.claude/commands/*.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a Markdown file in .claude/commands/ describing the command.
- Optionally, update related documentation elsewhere.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.