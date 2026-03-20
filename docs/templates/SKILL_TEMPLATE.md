---
name: skill-name-here
description: >
  One-line description optimized for trigger accuracy. Must answer: "When should
  an AI tool load this skill?" Be specific — vague descriptions cause false triggers.
  Example: "Generate Frappe DocType JSON definitions from feature specifications"
  NOT: "Help with Frappe stuff"
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
  category: product | builder | design | domain
  triggers:
    - "exact phrase that should activate this skill"
    - "another trigger phrase"
  anti-triggers:
    - "phrase that looks similar but should NOT activate this skill"
---

# Skill Name

One paragraph: what this skill does, what it produces, and who uses it. Keep it to 2-3 sentences.

## When to Use

### Must Use (auto-trigger)
- [Exact scenarios where this skill MUST be loaded]
- [Be specific — "when the user asks to create a new Frappe DocType" not "when the user needs help"]

### Recommended (manual trigger)
- [Scenarios where this skill adds value but is not mandatory]
- [e.g., "when reviewing an existing DocType for improvements"]

### Skip (anti-trigger)
- [Scenarios that look similar but should NOT use this skill]
- [e.g., "when the user asks to fix a bug in an existing DocType — use frappe-engineer instead"]

## Protocol

### Step 1: [Gather Context]
[What to read, what to ask, what to check before starting work]
- Read CLAUDE.md for project context
- Check existing files/DocTypes for conflicts
- Clarify ambiguous requirements with the user

### Step 2: [Execute]
[The core work — what to do, in what order, with what tools]
- [Specific actions with specific tools]
- [Reference file paths and command syntax]

### Step 3: [Validate]
[How to verify the output is correct before completing]
- Run relevant tests
- Check output against the "Output Format" section below
- Verify no safety rules are violated

### Step 4: [Hand Off]
[What to produce and where to leave it for the next step in the chain]
- Commit changes to feature branch
- Update CLAUDE.md with session log
- Tell the user what to do next (e.g., "ask your developer to review the PR")

## Key Rules
- [Non-negotiable rule 1 — the "never do X" list]
- [Non-negotiable rule 2]
- [Safety: Never push to main, never commit secrets, always use feature branches]
- [Scope: What this skill must NOT attempt — defer to other skills]

## Output Format
[What the skill produces — file type, structure, where to save it]

Example:
```
Output: A DocType JSON file saved to {app}/doctype/{name}/{name}.json
Structure: Standard Frappe DocType JSON with fields, permissions, and naming
Location: {app}/{module}/doctype/{doctype_name}/
```

## Examples

### Example 1: [Descriptive Name]

**Input:** [The user prompt or scenario]

**Output:** [What the skill produces — show the actual artifact, not a description of it]

### Example 2: [Edge Case or Variant]

**Input:** [A different scenario that tests the skill's boundaries]

**Output:** [The expected output for this case]

## Common Pitfalls
- [What agents get wrong when following this skill]
- [e.g., "Agents often forget to check for existing Custom Fields before creating new ones"]
- [e.g., "Agents sometimes modify core app files instead of using the client app"]

## Cross-References
- **Upstream:** [Skills that produce inputs for this skill — e.g., feature-spec]
- **Downstream:** [Skills that consume this skill's output — e.g., frappe-engineer]
- **Related:** [Skills that handle adjacent tasks — e.g., qa-tester for testing the output]

## Changelog
- **1.0.0** (YYYY-MM-DD): Initial version
