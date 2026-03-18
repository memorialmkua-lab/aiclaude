---
name: add-new-skill-or-agent-doc
description: Workflow command scaffold for add-new-skill-or-agent-doc in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-skill-or-agent-doc

Use this workflow when working on **add-new-skill-or-agent-doc** in `everything-claude-code`.

## Goal

Adds documentation for a new skill or agent to the system.

## Common Files

- `.claude/commands/add-new-skill-or-agent.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a markdown file in .claude/commands/ with instructions for adding a new skill or agent.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.