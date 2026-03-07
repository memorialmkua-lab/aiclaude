# Auto-Loop Proposals

When you start a background process or long-running operation with observable output, **propose a CronCreate loop** to monitor it. Do NOT auto-create — ask for a yes/no confirmation first.

## When to Propose

| Trigger | Proposed Loop | Interval |
|---------|--------------|----------|
| `npm run dev` / `next dev` / dev server started | Check for build errors, confirm port ready | `*/2 * * * *` |
| Deploy to VPS via SSH | Health check the endpoint | `*/3 * * * *` |
| Background agent task (TaskCreate) | Poll TaskOutput for completion | `*/2 * * * *` |
| `docker compose up` started | Check container health (`docker ps`) | `*/2 * * * *` |
| Test suite running in background | Poll for completion/failures | `*/1 * * * *` |
| `git push` triggering CI pipeline | `gh run view` for status | `*/3 * * * *` |
| Tailing logs for a specific error | Grep for the pattern | `*/2 * * * *` |
| Database migration running | Check migration status | `*/1 * * * *` |

## How to Propose

Keep it brief — one line:

> "Want me to set up a 2-minute health check loop for that deploy?"

If yes → `CronCreate` with appropriate cron and prompt.
If no → move on, don't ask again for the same operation.

## Loop Prompt Guidelines

- Make the loop prompt self-contained — it runs without conversation context
- Include the specific command to check (not "check on things")
- Include success/failure criteria so the loop can report clearly
- Use `CronDelete` when the operation completes or the user says to stop

## Cleanup

- When the monitored operation completes, delete the loop and tell the user
- When switching tasks entirely, remind about any active loops
- NEVER leave orphaned loops running — always clean up
