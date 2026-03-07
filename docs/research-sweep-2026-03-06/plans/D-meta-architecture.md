# Workstream D: Meta & Architecture -- Implementation Plan

## Executive Summary

This workstream evaluates three experimental approaches to improving the Claude Code configuration system itself. After thorough research:

- **Item 1 (Arize Prompt Learning)**: ADOPT with a phased approach. The only empirically-validated method for CLAUDE.md optimization. Arize open-sourced the full pipeline including Claude Code support. Cost is significant (~$50-150 per optimization loop) but the 5-10% accuracy improvements are measurable and compound. Start with a minimum viable version using a small custom eval set before committing to full SWE-bench runs.

- **Item 2 (Self-Referential Architecture Mapping)**: ADOPT as a reusable skill/command. The pattern is sound and well-documented by Nick Tune. However, it makes no sense for THIS staging repo -- it's designed for complex multi-repo production codebases. Build a `/map-architecture` command that works across any project, with staleness mitigation via regeneration triggers.

- **Item 3 (Brownian Ratchet / multiclaude)**: PARK. We already have 80% of the useful primitives (worktrees, parallel agents, /orchestrate). The remaining 20% -- autonomous chaos with CI ratchet -- demands a cost tolerance ($100+/hr) and team-scale codebase that doesn't match a solo developer workflow. Extract the CI-ratchet idea as a concept, but don't adopt the tool.

---

## Item 1: Arize Prompt Learning (Automated Rule Optimization)

### Current State (Our Rules, Our Eval Capabilities)

**Our ruleset consists of:**
- `staging/CLAUDE.md`: ~200 lines of global instructions covering workflow commands, communication style, core instincts, parallelization rules, self-correction, worktree isolation, compact instructions
- `staging/rules/hard-stops.md`: 32 lines -- commit blockers, pre-commit verification
- `staging/rules/testing.md`: 53 lines -- Vitest, TDD, test quality
- `staging/rules/skill-usage.md`: 14 lines -- forced skill checking
- `staging/rules/safety.md`: 125 lines -- destructive operation prevention, cloud/docker/git safety
- `staging/rules/verification.md`: 74 lines -- verification mindset, anti-patterns, regression testing

**Total active rules**: ~500 lines across 6 files.

**Current eval capabilities**: None. We have no automated way to measure whether our rules improve Claude's actual task performance. Changes to rules are based on intuition and manual observation. The learned/instincts system captures patterns from errors, but there's no feedback loop that measures whether incorporating those patterns actually helps.

### How Arize Works (Verified Methodology)

Arize's `prompt-learning` repo (github.com/Arize-ai/prompt-learning) contains a complete, open-source Claude Code optimization pipeline at `coding_agent_rules_optimization/claude_code/`.

**The optimization loop:**

1. **Dataset**: SWE-bench Lite -- 300 issue/PR pairs from 12 Python repos. Split 50/50 into train (150) and test (150). Two split strategies available:
   - **Multi-repo**: Train on Django/Pytest/Sphinx/Astropy/Requests/Pylint, test on Sympy/Matplotlib/Scikit-learn/Xarray/Seaborn/Flask
   - **Single-repo temporal**: Filter by repo, split chronologically (60% early issues train, 40% recent test)

2. **Execution**: `run_claude.py` runs Claude Code CLI in parallel (default 50 workers) against train set tasks, each with a 600-second timeout. The current ruleset is injected via `--append-system-prompt`.

3. **Evaluation**: `evals.py` uses GPT-4 to compare Claude's output against ground-truth patches. Key innovation: the evaluator produces **rich English explanations of failures**, not just pass/fail scores. These explanations become the optimization signal.

4. **Optimization**: `metaprompt.txt` feeds current ruleset + failure explanations to a meta-optimizer that generates improved rules. The metaprompt instructs the optimizer to identify patterns in failures and produce specific, actionable rules.

5. **Iteration**: Default 5 loops (`LOOPS = 5`). Each loop: run tasks -> evaluate -> optimize rules -> save ruleset. Rulesets stored as `ruleset_{loop}.txt` and `{repo}_ruleset_{loop}.txt`.

6. **Tracking**: All experiments logged to Arize Phoenix for comparison across iterations.

**Results verified:**
- Claude Sonnet 4.5: +6% on train, +0.67% on test (general), +10.87% on Django-specific
- The optimized rules are generic software engineering principles (serialization safety, regex handling, test scope) that emerged from failure analysis -- not hand-crafted

**What optimized rules look like (from `ruleset_2.txt`):**
- 12 rules covering: API design, equality/hashing, serialization, code generation, attribute validation, operation ordering, parameter propagation, expression transformation, output deduplication, exception logging, input validation, object safety
- Format is prose paragraphs, not bullet-point instructions
- Rules are highly specific to the failure modes observed (e.g., "Objects with non-serializable values should normalize to safe types before deep copying")

### Feasibility Assessment (Cost, Complexity, Prerequisites)

**Prerequisites (all available/free):**
- Claude Code CLI: Installed
- Docker (8GB+ RAM): For SWE-bench task evaluation -- runs repo environments in containers
- Python packages: `swebench`, `pandas`, `phoenix-client`, `arize-phoenix`, `wrapt`
- API keys: `ANTHROPIC_API_KEY` (Claude for task execution), `OPENAI_API_KEY` (GPT-4 for evaluation)
- Phoenix account: Free tier available for experiment tracking
- SWE-bench Lite: Free on HuggingFace (`datasets` library)

**Cost per optimization loop (estimated):**
- Each loop runs ~150 train tasks through Claude Code
- At ~600s timeout, 50 parallel workers: ~30 min wall-clock per run phase
- Claude API cost per task: ~$0.50-2.00 (varies by task complexity, Sonnet pricing)
- 150 tasks x $1.00 avg = ~$150 per train run
- GPT-4 evaluation: ~$0.10/task x 150 = ~$15
- Meta-optimization call: ~$1
- **Total per loop: ~$165**
- **5 loops: ~$825**
- **Test set validation (1 run): ~$165**
- **Grand total for full optimization: ~$1,000**

**Complexity:**
- Setup: Medium. Install dependencies, configure API keys, ensure Docker works with SWE-bench
- Execution: Low. Single command: `python optimize_claude_code.py`
- Integration: Medium. Translate optimized SWE-bench rules into our existing rule format
- Ongoing: High-ish. Should re-run after significant rule changes

**Key constraint**: The Arize pipeline optimizes rules for SWE-bench Python tasks specifically. Our rules are general-purpose (TypeScript-first, multi-project). The optimized rules may be overly Python/Django-focused and not directly transferable.

### Proposed Approach (What We'd Actually Do)

**Phase 1: Validate with Arize's pipeline as-is ($200-300)**

1. Clone the `prompt-learning` repo
2. Set up dependencies and API keys
3. Run a single optimization loop on a small subset (50 tasks instead of 150) using our current `staging/CLAUDE.md` + rules as the initial ruleset
4. Compare: Do we get measurable improvement? Are the generated rules sensible?
5. Examine the optimized rules -- are they complementary to ours or redundant?

**Phase 2: Custom eval set (if Phase 1 shows promise)**

Build a small eval set from our own projects instead of SWE-bench:
- Select 20-30 real tasks from our project history (git issues, bug fixes, feature implementations)
- For each: the issue description + the known-good diff/patch
- Write a simple evaluator (does Claude's output match the expected changes?)
- Run the optimization loop against this custom dataset

This addresses the Python/Django bias problem. Our rules should be optimized for TypeScript/Next.js/full-stack work, not Python library maintenance.

**Phase 3: Continuous optimization (ongoing)**

- After any significant rule change, re-run optimization to validate
- Quarterly: full optimization cycle with accumulated learned patterns
- Track improvement over time via Phoenix experiments

### Minimum Viable Version

Skip Arize entirely. Build the feedback loop manually:

1. Pick 10 recent tasks where Claude underperformed (from `~/.claude/learned/`)
2. For each, capture: the task prompt, what Claude did wrong, what the correct approach was
3. Write a structured failure analysis: "Rule X was present but Claude still did Y because Z"
4. Feed these analyses to Claude in a meta-session: "Given these failure patterns, propose specific rule improvements to staging/CLAUDE.md"
5. Apply the proposed improvements
6. Re-test on the same 10 tasks (or similar ones)

**Cost: ~$5-10 in API calls. Time: 2-3 hours.**

This captures the core insight (failure explanations drive rule improvement) without the SWE-bench infrastructure. It's the manual version of what Arize automated.

### Verification

- Phase 1 success criteria: At least one generated rule is novel (not already in our ruleset) and addresses a real failure mode we've observed
- Phase 2 success criteria: Measurable improvement on our custom eval set (any positive delta)
- MVV success criteria: At least 3 of the 10 re-tested tasks show improvement with updated rules
- Anti-success: If optimized rules are all Python-specific or conflict with our existing rules, Phase 1 is a failure and we skip to the MVV approach

---

## Item 2: Self-Referential Architecture Mapping

### Current State (Any Existing Architecture Docs)

**In this staging repo**: No architecture documentation exists. The repo is a config testbed, not a software system. Architecture mapping makes no sense here.

**Existing visualization capabilities**: We have the `visual-explainer` skill which already generates Mermaid diagrams, architecture HTML pages, and other visual artifacts. It writes to `~/.agent/diagrams/` and supports `flowchart LR` swimlane format -- exactly the format Nick Tune advocates.

**Existing architecture agents**: We have an `architect.md` agent in staging that could be extended to generate architecture docs, but it currently focuses on design decisions during orchestration workflows, not standalone architecture mapping.

**Cross-project applicability**: The user works on multiple codebases (e.g., `prompt-studio` visible in the environment). Architecture mapping would be most valuable for larger, multi-service projects.

### The Pattern (Verified from Original Source)

Nick Tune's O'Reilly Radar article describes a specific, tested methodology:

**Process:**
1. Create a lightweight requirements document explaining the mapping objective
2. Establish domain concept files describing system relationships between repositories
3. Grant Claude Code read access across multiple local repositories (via `.claude/settings.local.json`)
4. Work interactively on the first flow (~2 hours) to establish format preferences
5. Subsequent flows execute semi-independently (~15 minutes each)
6. Requirements document grows with corrections/lessons learned (reached ~449 lines)

**Artifacts produced:**
```
docs/architecture/flows/[flow-name]/
  README.md          # Overview, boundaries, endpoints, events, DB ops, related flows
  diagram.mermaid    # Pure Mermaid syntax, flowchart LR, swimlane per repository
```

**Mermaid format specifications:**
- Pure `.mermaid` files (no markdown wrappers)
- `flowchart LR` with `subgraph` containers per repository
- Valid step types: HTTP endpoints, aggregate methods, DB operations, event publications, workflow triggers, lambda invocations, UI actions
- Full endpoint paths in step names (e.g., `"POST /blah/{blahId}/subblah"`)

**How Claude uses them later:**
- When investigating support tickets, Claude immediately identifies affected flows without full codebase analysis
- Structures investigations around expected behaviors from flow documentation
- Suggests specific queries to compare actual vs. expected system behavior
- Significantly reduces context window usage for cross-repo investigations

**Corrections needed during development:**
- Initial diagrams were too detailed (individual method calls) -- refined to significant operations only
- Sequence diagrams looked good but were hard to read -- horizontal swimlanes proved superior
- Event tracing required explicit rules about reading entire workflow definition files
- Event consumer discovery needed emphasis on GitHub-wide searches

### Applicability Assessment (Does This Fit Our Workflow?)

**For this staging repo**: NO. It's a config repo with no software architecture to map.

**For the user's production projects**: YES, potentially high value. The user works on multiple codebases and would benefit from Claude having pre-generated architecture context, especially for:
- Cross-repo debugging (tracing a request through multiple services)
- Onboarding to unfamiliar parts of their own codebase
- Reducing context window usage on complex investigations

**Key question**: Is this a one-time effort per project, or does it need to be re-runnable? Tune acknowledges staleness is the main risk and proposes quarterly regeneration.

### Proposed Implementation (Skill? Command? Process?)

**Implement as a COMMAND (`/map-architecture`) backed by a SKILL.**

The command is the user-facing trigger. The skill provides the methodology, format specifications, and quality checks.

**Command: `/map-architecture`**

```markdown
# Map Architecture Command

Generate architecture flow documentation for the current project.

## Usage
`/map-architecture [scope]`

## Scopes
- `full` - Map all discoverable flows from entry points
- `flow <name>` - Map a single end-to-end flow
- `refresh` - Regenerate all existing flow docs
- `verify` - Check existing flows against current codebase

## Process

### First Run (interactive)
1. Scan for entry points: API routes, event handlers, UI pages, CLI commands
2. Identify repositories/services involved (check settings.local.json for cross-repo access)
3. Present discovered entry points and ask user to prioritize
4. Generate first flow interactively, seeking feedback on detail level and format
5. Save format preferences to docs/architecture/.config.md

### Subsequent Runs
1. Read format preferences from .config.md
2. Generate flow docs following established template
3. Write to docs/architecture/flows/[flow-name]/
4. Validate Mermaid syntax
5. Open diagram in browser (via visual-explainer)

## Output Structure
docs/architecture/
  .config.md              # Format preferences, detail level, repos list
  overview.mermaid        # High-level service topology
  flows/
    [flow-name]/
      README.md           # Comprehensive flow documentation
      diagram.mermaid     # Mermaid swimlane diagram
```

**Skill: `architecture-mapping`**

Contains:
- Mermaid format specifications (from Tune's rules)
- Flow documentation template
- Information source checklist (OpenAPI specs, event definitions, workflow files, entity definitions)
- Common mistake patterns to avoid
- Validation checklist

### Staleness Mitigation

This is the critical problem. Tune's research and the Codified Context paper both identify stale specs as the #1 failure mode.

**Proposed mitigations (in order of practicality):**

1. **Manual regeneration trigger**: `/map-architecture refresh` when user knows significant changes happened. Low overhead, relies on human judgment.

2. **Git diff detection**: A hook that checks `git diff --name-only` against files referenced in flow docs. If >30% of referenced files changed since last generation, suggest regeneration. Lightweight, deterministic.

3. **Freshness header**: Each flow doc includes a `Generated: YYYY-MM-DD` and `Source files hash: <sha>` header. The `/map-architecture verify` subcommand compares hashes against current state and flags stale flows.

4. **Quarterly regeneration cadence**: Calendar reminder, not automated. Run `/map-architecture refresh` quarterly. Tune suggests this approach.

**What we WILL NOT do:**
- Automated CI-triggered regeneration (too expensive, too noisy)
- Real-time updates (impossible to maintain at reasonable cost)
- Trust stale docs as authoritative (always re-verify against code when investigating)

### Verification

- Build the `/map-architecture` command and skill in staging
- Test on one of the user's real projects (not this staging repo)
- Success criteria: Claude in a subsequent session can use the generated flows to answer an architecture question faster than without them
- Measure: context window tokens saved by having pre-generated architecture docs vs. full codebase exploration
- Staleness test: modify a key file in a flow, run `verify` subcommand, confirm it flags the stale flow

---

## Item 3: Brownian Ratchet / multiclaude

### Current State (Our Multi-Agent Capabilities)

We already have substantial multi-agent infrastructure:

| Capability | What We Have | Where |
|---|---|---|
| **Git worktrees** | Full support, documented | CLAUDE.md Worktree Isolation section |
| **Parallel agents** | Task tool with `isolation: "worktree"` | Agent frontmatter, 6 agents configured |
| **Sequential orchestration** | `/orchestrate` with handoff documents | `commands/orchestrate.md` |
| **Parallel review** | `/review` spawns 3 parallel reviewers | `commands/review.md` |
| **File ownership** | Conflict avoidance rules | `skills/parallel-feature-development/` |
| **Finding deduplication** | Cross-reviewer merge rules | `skills/multi-reviewer-patterns/` |
| **Agent roles** | 10 specialized agents | `agents/` directory |
| **Background execution** | `claude --worktree --tmux` | CLAUDE.md CLI usage |

### How multiclaude Works (Verified Architecture)

**Core components (Go binary):**
- `multiclaude start` launches a daemon
- `multiclaude repo init <url>` sets up a repo for multi-agent work
- `multiclaude worker create "Task description"` spawns a worker agent

**Agent roles:**

| Role | Function |
|---|---|
| Supervisor | Monitors system state, unblocks stuck agents |
| Merge Queue | Auto-merges PRs when CI passes (single-player mode) |
| PR Shepherd | Manages human reviewer coordination (multiplayer/fork mode) |
| Workspace | Personal Claude instance for manual oversight |
| Worker | One task, one branch, one PR per worker |
| Reviewer | Autonomous code review with inline comments |

**Communication**: File-based JSON messages. The daemon detects new messages and types them into the recipient's tmux window. Each agent runs in its own tmux window with its own git worktree.

**CI ratchet**: "Every PR that passes tests gets merged. Progress is permanent. We never go backward." Tests must pass before merge. Failed work is discarded, not debugged.

**Project status**: Active development (227 commits, 495 stars, 47 forks, 5 contributors including Claude itself). Self-building -- multiclaude wrote its own code.

**Cost**: N agents x API cost per agent. At Anthropic's Max plan rates with multiple parallel Sonnet sessions, easily $50-100+/hr depending on concurrency. The $100/hr figure from the Brownian Ratchet article refers to GasTown (Yegge's similar project), not multiclaude specifically, but the economics are the same.

### Comparison with Current Setup

| Feature | Our Setup | multiclaude | Gap |
|---|---|---|---|
| Process isolation | Worktrees via Task tool | Worktrees via Go daemon | Equivalent |
| Code isolation | Git branches per agent | Git branches per agent | Equivalent |
| Agent communication | Handoff documents | JSON files + tmux typing | multiclaude is more dynamic |
| Orchestration model | Sequential pipelines with parallel phases | Autonomous chaos with CI filter | Fundamentally different philosophy |
| CI integration | Manual (`/verify`, `/ship`) | Automatic merge-on-pass | multiclaude automates this |
| Agent lifecycle | Spawned per task, terminate on completion | Long-running daemon, workers come and go | multiclaude persists |
| Human role | Active director (choosing commands, reviewing) | Passive observer (watch agents work, review PRs) | Different paradigm |
| Failure handling | Agent reports success, we verify | CI ratchet catches failures, work discarded | multiclaude is more resilient |
| Setup complexity | Already configured | Install Go binary, configure repos | multiclaude adds overhead |

**What multiclaude adds that we don't have:**
1. Autonomous agent spawning and lifecycle management (daemon)
2. Automatic CI-gated merging (the actual "ratchet")
3. Persistent workspace that survives session restarts
4. Dynamic agent-to-agent communication via JSON messages
5. Multiplayer mode (multiple humans + multiple agents)

**What multiclaude has that we DON'T NEED (as a solo developer):**
1. Multiplayer/fork mode (designed for teams)
2. PR Shepherd (human reviewer coordination)
3. MMORPG metaphor (fun, but not operationally meaningful for solo work)
4. 20-30 simultaneous agents (GasTown scale)

### Feasibility & Cost Assessment

**Direct adoption of multiclaude:**
- Install: `go install github.com/dlorenc/multiclaude/cmd/multiclaude@latest`
- Dependencies: Go 1.21+, tmux, git, gh CLI -- all likely available
- Learning curve: New mental model (chaos instead of orchestration)
- Cost: $50-100+/hr for meaningful parallelism (5-10 workers)
- Risk: Early-stage project ("weeks old and explicitly experimental" per the Brownian Ratchet post)

**The core question**: Is the chaos philosophy actually better than careful orchestration for a solo developer?

**Analysis:**
- Chaos works when you have a robust CI ratchet and can tolerate wasted work
- Solo developers have limited budget for wasted API calls
- Our current `/orchestrate` command provides structured workflows where each agent's output feeds the next -- this is MORE efficient (less redundant work) but LESS resilient (if one agent fails, the chain breaks)
- multiclaude's strength is that agents don't block each other -- but we already handle this with parallel phases in `/orchestrate`
- The biggest practical difference is the **auto-merge on CI pass** -- and we could adopt this concept without multiclaude

**Adopting the CI ratchet concept without multiclaude:**
- Add a `/chaos` mode to `/orchestrate` that spawns N parallel workers on sub-tasks
- Each worker creates a branch + PR
- A supervisor agent runs `npm test` / `npx tsc` / `npm run lint` on each PR
- Passing PRs get recommended for merge; failing PRs get discarded
- This gives us the ratchet without the daemon, Go dependency, or $100/hr burn rate

**Is this worth the complexity?** For a solo developer, probably not today. The value of multiclaude scales with:
- Team size (more humans = more need for autonomous coordination)
- Codebase size (larger codebases = more parallelizable work)
- Task volume (many independent tasks = more opportunity for chaos)
- Cost tolerance (willing to burn $100+/hr on API calls)

### Recommendation: PARK

multiclaude is a genuinely novel architectural contribution, but it solves a problem we don't have yet. Our current setup (structured orchestration with parallel phases and worktree isolation) covers 80% of the useful patterns at a fraction of the cost.

### Conditions for Revisiting

Re-evaluate multiclaude when ANY of these conditions become true:

1. **API costs drop 5x+**: At $10-20/hr for 10 parallel agents, the cost-waste tradeoff changes fundamentally
2. **Working on a team project**: Multiplayer mode becomes relevant when multiple humans + agents collaborate
3. **Codebase grows to 50K+ lines with strong CI**: The ratchet pattern only works with comprehensive test coverage
4. **Anthropic ships native multi-session coordination**: If Claude Code gets built-in daemon/supervisor capabilities, multiclaude's Go wrapper becomes unnecessary
5. **Our orchestrate command hits limits**: If structured orchestration proves too brittle for real-world complex tasks

**What to extract NOW (zero cost):**
- The CI-ratchet concept: add a "validate and auto-approve" step to `/ship` that runs the full test suite and only approves if everything passes
- The "discard failed work" philosophy: when a parallel agent's output fails verification, don't try to fix it -- discard and retry with a fresh agent
- The "log off, agents keep working" pattern: we already support this with `claude --worktree --tmux`

---

## Dependencies & Risks

### Item 1 (Arize Prompt Learning)

| Risk | Severity | Mitigation |
|---|---|---|
| SWE-bench results don't transfer to our TypeScript work | HIGH | Phase 2 custom eval set; MVV approach as fallback |
| API costs exceed estimates | MEDIUM | Start with small subsets (50 tasks), monitor costs per loop |
| Optimized rules conflict with existing rules | MEDIUM | Review generated rules manually before merging |
| Docker setup for SWE-bench is complex | LOW | Well-documented, standard tooling |
| Phoenix dependency lock-in | LOW | Phoenix is for tracking only; optimization works without it |

### Item 2 (Architecture Mapping)

| Risk | Severity | Mitigation |
|---|---|---|
| Stale architecture docs mislead future Claude sessions | HIGH | Freshness headers, verify subcommand, quarterly regeneration |
| Initial setup time per project is significant (~2 hrs) | MEDIUM | Template accumulates; subsequent projects faster |
| Format preferences don't generalize across projects | LOW | Per-project `.config.md` allows customization |
| Generated diagrams contain hallucinated flows | MEDIUM | Verify against OpenAPI specs, event catalogs, actual code |

### Item 3 (multiclaude/Brownian Ratchet)

| Risk | Severity | Mitigation |
|---|---|---|
| N/A -- parked | -- | Extract CI-ratchet concept without tool adoption |

### Cross-Item Dependencies

- Item 1 and Item 2 are independent -- can proceed in parallel
- Item 1's MVV (manual failure analysis) requires no new tooling and can start immediately
- Item 2 requires a real project to test against (not this staging repo)
- Neither Item 1 nor Item 2 depends on Item 3

## Implementation Order

1. **Item 1 MVV (Week 1)**: Manual failure analysis approach. Zero setup cost, immediate feedback on whether rule optimization works at all. 2-3 hours of effort.

2. **Item 2 Command/Skill (Week 2-3)**: Build `/map-architecture` command and `architecture-mapping` skill in staging. Test on a real project. 4-6 hours total.

3. **Item 1 Phase 1 (Week 4)**: If MVV showed promise, clone Arize's repo and run a single optimization loop with 50 SWE-bench tasks. ~$50-75 in API costs. 2-3 hours setup + overnight run.

4. **Item 1 Phase 2 (Week 6+)**: If Phase 1 showed transferable results, build custom eval set from our project history. This is the real payoff but requires the most investment.

5. **Item 3 (Parked)**: Re-evaluate when conditions listed above change.

## Estimated Scope

| Item | Effort | Cost | Files Changed |
|---|---|---|---|
| Item 1 MVV | 3 hours | ~$10 | `staging/rules/*.md`, `staging/CLAUDE.md` (rule improvements) |
| Item 2 Command + Skill | 5 hours | $0 | New: `staging/commands/map-architecture.md`, `staging/skills/architecture-mapping/SKILL.md` |
| Item 1 Phase 1 | 3 hours + overnight run | ~$75 | Analysis document; possibly rule updates |
| Item 1 Phase 2 | 6 hours | ~$150-300 | Custom eval harness; validated rule updates |
| Item 3 concept extraction | 1 hour | $0 | Minor updates to `staging/commands/ship.md` or `staging/commands/orchestrate.md` |
