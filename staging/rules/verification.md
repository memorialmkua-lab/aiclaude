# Verification Mindset

**Your confidence is NOT evidence. The more certain you feel, the MORE you must verify.**

## Before Claiming Task Complete

1. **Re-read what you wrote** - Don't assume it's correct because you just wrote it
2. **Challenge your approach** - Is this the BEST solution or just the first one that worked?
3. **Simulate failure** - What breaks if input is null, empty, malformed, or malicious?
4. **Grep for proof** - Actually run verification commands, don't assume they'll pass
5. **Ask "What did I miss?"** - Assume you missed something. Find it.

## Anti-Patterns to Catch

| You Think | You Must |
|-----------|----------|
| "This should work" | VERIFY IT WORKS |
| "I'm pretty sure..." | CONFIRM WITH EVIDENCE |
| "It compiled, so..." | COMPILING ≠ WORKING |
| "I already checked..." | CHECK AGAIN |

## Before ANY File Creation

- `git ls-files | grep <filename>` - verify it doesn't already exist
- Read the module's index.ts to see existing exports
- Explore the landscape before touching it

## Failure Patterns to Prevent

| Pattern | Prevention |
|---------|------------|
| Changed signature, didn't update callers | After ANY signature change → grep callers |
| Used `!` to skip null handling | After `!` or `as` → explain edge case in comment |
| Deleted files, left orphaned refs | After deleting → grep all references |
| Assumed it works because it compiles | Compiling ≠ working. Actually verify. |
| Added features not requested | If not in brief, don't build it |

## Workaround Escalation Rule

- If you're on your THIRD workaround for the same problem, STOP
- The approach is wrong — step back and rethink the architecture
- Ask the user before continuing down a chain of workarounds
- Each workaround adds complexity and risk (e.g. credential leaks, shadow infrastructure)

## Agent Delegation Verification

NEVER trust agent success reports at face value:
```
Agent reports success → Check VCS diff → Verify changes actually exist → Report actual state
```

## Regression Test Red-Green Verification

A regression test MUST prove it catches the bug:
```
Write test → Run (PASS) → Revert fix → Run (MUST FAIL) → Restore fix → Run (PASS)
```
A test that only passes proves nothing. It must fail without the fix.

## Before Committing

- ALWAYS read the full `git diff` (not just `--stat`) before committing — review your own changes like a human reviewer would
- Check for: unintended changes, debug code, console.log, leftover TODOs, files you didn't mean to touch
- If the diff touches more than one logical concern, split into separate commits
- Clean up any research workspaces (`/tmp/claude-research-*`) before session ends

## When You Find Issues

If you discover critical bugs, security vulnerabilities, or significant errors during any task — even if unrelated to the current work:
- Do NOT just report them and move on
- Investigate the root cause
- Create a concrete plan to fix them
- Ask the user: "I found these issues. Want me to fix them now or after the current task?"
- NEVER treat "not my fault" or "pre-existing" as a reason to ignore problems

## Core Principles

1. **Verify, don't assume** - The more confident you feel, the MORE you must verify
2. **Minimal code** - Prefer stdlib, avoid dependencies, don't invent features
3. **Production ready** - No placeholders, no TODOs, no dead code
4. **Explain assertions** - Every `!` or `as` needs a comment explaining why
5. **Regression tests** - After fixing bugs, add tests to prevent recurrence
