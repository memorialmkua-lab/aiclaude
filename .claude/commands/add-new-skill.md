---
name: add-new-skill
description: Workflow command scaffold for add-new-skill in everything-claude-code.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-skill

Use this workflow when working on **add-new-skill** in `everything-claude-code`.

## Goal

Adds a new skill to the codebase, including documentation and review fixes.

## Common Files

- `skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.cursor/skills/*/SKILL.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create a new SKILL.md file under skills/<skill-name>/
- Optionally add cross-harness copies under .agents/skills/ and/or .cursor/skills/
- Address PR review feedback by updating SKILL.md (sections: When to Use, How It Works, Examples, etc.)
- Sync or remove duplicate copies as needed
- Merge after review

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.