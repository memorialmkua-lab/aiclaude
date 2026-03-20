---
name: add-new-agent
description: Workflow command scaffold for add-new-agent in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-agent

Use this workflow when working on **add-new-agent** in `everything-claude-code`.

## Goal

Adds a new agent to the codebase, registers it in documentation and mapping files.

## Common Files

- `agents/*.md`
- `AGENTS.md`
- `README.md`
- `docs/COMMAND-AGENT-MAP.md`
- `rules/common/agents.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create agents/<agent-name>.md with agent definition
- Update AGENTS.md to register the new agent
- Update README.md and docs/COMMAND-AGENT-MAP.md to reflect the new agent
- Optionally update rules/common/agents.md if agent is language-specific

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.