---
name: iterative-retrieval
description: Pattern for progressively refining context retrieval when exploring unfamiliar codebases. Auto-activates when spawning subagents, encountering missing context, or needing to understand code before modifying it.
user-invokable: false
---

# Iterative Retrieval Pattern

Solves the "context problem" where you don't know what files are relevant until you start looking.

## When This Activates

- Exploring an unfamiliar codebase or module
- Spawning subagents that need codebase context
- Encountering "missing context" or wrong assumptions about code structure
- Starting any non-trivial modification where the relevant files aren't obvious

## The Loop (Max 3 Cycles)

```
DISPATCH (broad search) → EVALUATE (score relevance) → REFINE (narrow terms) → LOOP
```

### Cycle 1: Cast a wide net

Use Glob to find structural candidates, then Grep for domain keywords:

```
Glob pattern="src/**/*.ts" — find all TypeScript files in the area
Grep pattern="authentication|session|token" — find files mentioning the domain
```

Read the top 3-5 most promising files. While reading, note:
- What terminology does this codebase actually use? (e.g., "throttle" not "rate limit")
- What related modules are imported?
- What types/interfaces define the domain?

### Cycle 2: Follow the thread

Use what you learned in Cycle 1 to search more precisely:

```
Grep pattern="RefreshTokenManager" — exact class/function names found in Cycle 1
Grep pattern="from.*session" glob="*.ts" — trace imports to find related files
Glob pattern="src/middleware/**" — explore directories discovered in imports
```

Read new files. Assess: do you have enough context to proceed?
- **Yes (3+ high-relevance files found)**: Stop. Proceed with the task.
- **No (critical gaps remain)**: One more cycle.

### Cycle 3: Fill specific gaps

Target the exact missing piece:

```
Grep pattern="interface.*Config" — find configuration types
Grep pattern="export.*from" path="src/index.ts" — check public API surface
Read the specific file that defines the type you need
```

**After 3 cycles, proceed with what you have.** Diminishing returns past this point.

## Practical Examples

### Bug Fix: "Authentication token expiry"

```
Cycle 1:
  Grep "token|auth|expiry" in src/** → auth.ts, tokens.ts, user.ts
  Read auth.ts → imports SessionManager, uses "refresh" concept
  Read tokens.ts → defines TokenPayload interface
  Read user.ts → low relevance (user profile, not auth)

Cycle 2:
  Grep "SessionManager|refresh" → session-manager.ts, jwt-utils.ts
  Read both → found the expiry logic in session-manager.ts:142
  Sufficient context. Proceed.

Result: auth.ts, tokens.ts, session-manager.ts, jwt-utils.ts
```

### Feature: "Add rate limiting to API endpoints"

```
Cycle 1:
  Grep "rate|limit" in routes/** → no matches
  Key learning: codebase uses "throttle" terminology

Cycle 2:
  Grep "throttle|middleware" → throttle.ts, middleware/index.ts
  Read both → middleware pattern established, need router setup

Cycle 3:
  Grep "router|app.use" → router-setup.ts
  Sufficient context. Proceed.

Result: throttle.ts, middleware/index.ts, router-setup.ts
```

## Rules

1. **Start broad, narrow progressively** — don't over-specify initial searches
2. **Learn the codebase's vocabulary** — Cycle 1 often reveals naming conventions
3. **Track what's missing** — explicitly note gaps to drive the next cycle
4. **Stop at "good enough"** — 3 high-relevance files beats 10 mediocre ones
5. **Exclude confidently** — files scored low in Cycle 1 won't become relevant later
