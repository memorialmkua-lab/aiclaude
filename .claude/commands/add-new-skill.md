---
name: add-new-skill
description: Workflow command scaffold for add-new-skill in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-skill

Use this workflow when working on **add-new-skill** in `everything-claude-code`.

## Goal

Adds a new skill to the repository, including documentation and (sometimes) Antigravity/Codex harness support.

## Common Files

- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `AGENTS.md`
- `README.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create skills/<skill-name>/SKILL.md with full canonical content.
- Optionally, add .agents/skills/<skill-name>/SKILL.md and/or agents/<skill-name>.md for harness compatibility.
- Update AGENTS.md and/or README.md to increment skill count and document the new skill.
- If needed, add supporting scripts or openai.yaml for agent harness.
- Address review feedback by updating SKILL.md, adding examples, or clarifying sections.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.