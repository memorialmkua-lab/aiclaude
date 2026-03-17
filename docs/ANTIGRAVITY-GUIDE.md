# Antigravity Setup and Usage Guide

Google's [Antigravity](https://antigravity.dev) is an AI coding IDE that uses a `.agent/` directory convention for configuration. ECC provides first-class support for Antigravity through its selective install system.

## Quick Start

```bash
# Install ECC with Antigravity target
./install.sh --target antigravity typescript

# Or with multiple language modules
./install.sh --target antigravity typescript python go
```

This installs ECC components into your project's `.agent/` directory, ready for Antigravity to pick up.

## How the Install Mapping Works

ECC remaps its component structure to match Antigravity's expected layout:

| ECC Source | Antigravity Destination | What It Contains |
|------------|------------------------|------------------|
| `rules/` | `.agent/rules/` | Language rules and coding standards (flattened) |
| `commands/` | `.agent/workflows/` | Slash commands become Antigravity workflows |
| `agents/` | `.agent/skills/` | Agent definitions become Antigravity skills |

> **Note on `.agents/` vs `.agent/`**: The ECC repo uses `.agents/` (with an 's') as its source directory for skill definitions and `openai.yaml` configs. The Antigravity runtime uses `.agent/` (without an 's') as its project config root. The installer copies from `.agents/` → `.agent/` during install. The `skills/` source path is not directly mapped by the installer — skill files in `.agents/skills/` must be manually mirrored to `.agent/skills/` if you want them in the Antigravity runtime.

### Key Differences from Claude Code

- **Rules are flattened**: Claude Code nests rules under subdirectories (`rules/common/`, `rules/typescript/`). Antigravity expects a flat `rules/` directory — the installer handles this automatically.
- **Commands become workflows**: ECC's `/command` files land in `.agent/workflows/`, which is Antigravity's equivalent of slash commands.
- **Agents become skills**: ECC agent definitions map to `.agent/skills/`, where Antigravity looks for skill configurations.

## Directory Structure After Install

```
your-project/
├── .agent/
│   ├── rules/
│   │   ├── coding-standards.md
│   │   ├── testing.md
│   │   ├── security.md
│   │   └── typescript.md          # language-specific rules
│   ├── workflows/
│   │   ├── plan.md
│   │   ├── code-review.md
│   │   ├── tdd.md
│   │   └── ...
│   ├── skills/
│   │   ├── planner.md
│   │   ├── code-reviewer.md
│   │   ├── tdd-guide.md
│   │   └── ...
│   └── ecc-install-state.json     # tracks what ECC installed
```

## The `openai.yaml` Agent Config

Each skill directory under `.agents/skills/` contains an `agents/openai.yaml` file at the path `.agents/skills/<skill-name>/agents/openai.yaml` that configures the skill for Antigravity:

```yaml
interface:
  display_name: "API Design"
  short_description: "REST API design patterns and best practices"
  brand_color: "#F97316"
  default_prompt: "Design REST API: resources, status codes, pagination"
policy:
  allow_implicit_invocation: true
```

| Field | Purpose |
|-------|---------|
| `display_name` | Human-readable name shown in Antigravity's UI |
| `short_description` | Brief description of what the skill does |
| `brand_color` | Hex color for the skill's visual badge |
| `default_prompt` | Suggested prompt when the skill is invoked manually |
| `allow_implicit_invocation` | When `true`, Antigravity can activate the skill automatically based on context |

## Managing Your Installation

### Check What's Installed

```bash
node scripts/list-installed.js --target antigravity
```

### Repair a Broken Install

```bash
# First, diagnose what's wrong
node scripts/doctor.js --target antigravity

# Then, restore missing or drifted files
node scripts/repair.js --target antigravity
```

### Uninstall

```bash
node scripts/ecc.js uninstall --target antigravity
```

### Install State

The installer writes `.agent/ecc-install-state.json` to track which files ECC owns. This enables safe uninstall and repair — ECC will never touch files it didn't create.

## Adding Custom Skills for Antigravity

If you're contributing a new skill and want it available on Antigravity:

1. Create the skill under `skills/your-skill-name/SKILL.md` as usual
2. Add the Antigravity agent config at `.agents/skills/your-skill-name/agents/openai.yaml` — the installer auto-deploys the `agents/` directory into `.agent/skills/` at runtime
3. Manually mirror the `SKILL.md` content to `.agents/skills/your-skill-name/SKILL.md` — this is needed because the installer maps `agents/` → `.agent/skills/` but does not auto-transform `skills/`
4. Mention in your PR that you added Antigravity support

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full contribution guide.

## Comparison with Other Targets

| Feature | Claude Code | Cursor | Codex | Antigravity |
|---------|-------------|--------|-------|-------------|
| Install target | `claude-home` | `cursor-project` | `codex-home` | `antigravity` |
| Config root | `~/.claude/` | `.cursor/` | `~/.codex/` | `.agent/` |
| Scope | User-level | Project-level | User-level | Project-level |
| Rules format | Nested dirs | Flat | Flat | Flat |
| Commands | `commands/` | N/A | N/A | `workflows/` |
| Agents/Skills | `agents/` | N/A | N/A | `skills/` |
| Install state | `ecc-install-state.json` | `ecc-install-state.json` | `ecc-install-state.json` | `ecc-install-state.json` |

## Troubleshooting

### Skills not loading in Antigravity

- Verify the `.agent/` directory exists in your project root (not home directory)
- Check that `ecc-install-state.json` was created — if missing, re-run the installer
- Ensure files have `.md` extension and valid frontmatter

### Rules not applying

- Rules must be in `.agent/rules/`, not nested in subdirectories
- Run `node scripts/doctor.js --target antigravity` to verify the install

### Workflows not available

- Antigravity looks for workflows in `.agent/workflows/`, not `commands/`
- If you manually copied ECC commands, rename the directory

## Related Resources

- [Selective Install Architecture](./SELECTIVE-INSTALL-ARCHITECTURE.md) — how the install system works under the hood
- [Selective Install Design](./SELECTIVE-INSTALL-DESIGN.md) — design decisions and target adapter contracts
- [CONTRIBUTING.md](../CONTRIBUTING.md) — how to contribute skills, agents, and commands
