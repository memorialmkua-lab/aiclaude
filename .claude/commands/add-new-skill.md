---
name: add-new-skill
description: Workflow command scaffold for add-new-skill in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-skill

Use this workflow when working on **add-new-skill** in `everything-claude-code`.

## Goal

Adds a new skill to the codebase, including documentation and harness support.

## Common Files

- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create skills/<skill-name>/SKILL.md with full documentation and implementation details.
- Optionally add .agents/skills/<skill-name>/SKILL.md and/or .cursor/skills/<skill-name>/SKILL.md for harness-specific copies.
- If the skill requires agent or openai.yaml support, add those files under .agents/skills/<skill-name>/agents/openai.yaml.
- Address PR review feedback by updating SKILL.md, triggers, and workflow steps.
- Sync or remove .agents/ duplicate if required, keeping canonical in skills/.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.