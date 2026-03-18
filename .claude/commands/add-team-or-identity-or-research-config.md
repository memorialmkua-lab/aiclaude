---
name: add-team-or-identity-or-research-config
description: Workflow command scaffold for add-team-or-identity-or-research-config in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-team-or-identity-or-research-config

Use this workflow when working on **add-team-or-identity-or-research-config** in `everything-claude-code`.

## Goal

Adds or updates core configuration files for team, identity, or research playbook in the ECC bundle.

## Common Files

- `.claude/team/everything-claude-code-team-config.json`
- `.claude/identity.json`
- `.claude/research/everything-claude-code-research-playbook.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update the relevant JSON or markdown file in .claude/team/, .claude/identity.json, or .claude/research/.
- Commit the file with a message referencing the ECC bundle.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.