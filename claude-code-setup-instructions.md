# Claude Code Environment Replication — Work Computer Setup

> **Purpose:** Hand this entire document to Claude Code on your work computer. It will replicate your personal development environment setup.
> **Generated:** 2026-03-12 from Lee's personal Mac
> **Estimated time:** 30-45 minutes (mostly unattended)

---

## Instructions for Claude Code

You are setting up Lee's Claude Code development environment on a new/work computer. Follow each section in order. Ask before proceeding if anything fails or is ambiguous. Skip sections Lee marks as N/A.

**Important context:**
- Lee uses macOS with Apple Silicon (arm64)
- Shell: zsh with oh-my-zsh + Powerlevel10k
- Primary editor: Cursor (VS Code fork)
- Time zone: America/Denver
- This is a WORK computer — skip business-specific repos and client data. Install the tooling and skills infrastructure only.

---

## Phase 1: Prerequisites (Homebrew + Language Runtimes)

### 1.1 Homebrew Core Tools

```bash
# Data processing tools (used heavily by Claude Code via CLAUDE.md)
brew install jq duckdb miller gron jless

# Dev essentials
brew install gh git git-lfs lazygit tmux neovim pandoc

# Language runtimes
brew install go rustup node bun

# Google Workspace CLI
brew install gws

# Python (via brew, for system-level)
brew install python@3.12 python@3.13
```

### 1.2 Rust Toolchain

```bash
rustup-init -y
rustup default stable
# Nightly needed for some projects (edition 2024)
rustup toolchain install nightly
```

### 1.3 Python Tool Isolation (pipx)

```bash
brew install pipx
pipx ensurepath

# Key tools
pipx install llm
pipx install openai
pipx install glances
pipx install duckduckgo-search
```

### 1.4 Node.js Global Packages

```bash
npm install -g typescript ts-node md-to-pdf
npm install -g @google/gemini-cli
npm install -g @openai/codex
npm install -g netlify-cli wrangler
```

### 1.5 Fabric (AI Pattern Library)

```bash
# Requires Go installed
go install github.com/danielmiessler/fabric@latest
# Binary lands at ~/go/bin/fabric
```

---

## Phase 2: CASS (Coding Agent Session Search)

CASS indexes all AI coding sessions (Claude, Codex, Gemini, Cursor) into a searchable database.

### 2.1 Install CASS

```bash
# Method A: Homebrew (easiest)
brew install dicklesworthstone/tap/cass

# Method B: From release script
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/coding_agent_session_search/main/install.sh?$(date +%s)" \
  | bash -s -- --easy-mode --verify
```

### 2.2 Set Up Launchd Daemons

Create the continuous indexing watcher:

```bash
cat > ~/Library/LaunchAgents/com.cass.index-watch.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cass.index-watch</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/REPLACE_USERNAME/.local/bin/cass</string>
        <string>index</string>
        <string>--watch</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/REPLACE_USERNAME/Library/Logs/cass-index.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/REPLACE_USERNAME/Library/Logs/cass-index.log</string>
</dict>
</plist>
PLIST
```

Create the nightly semantic reindex:

```bash
cat > ~/Library/LaunchAgents/com.cass.semantic-reindex.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cass.semantic-reindex</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>launchctl bootout gui/$(id -u)/com.cass.index-watch 2>/dev/null; /Users/REPLACE_USERNAME/.local/bin/cass index --semantic; launchctl bootstrap gui/$(id -u) /Users/REPLACE_USERNAME/Library/LaunchAgents/com.cass.index-watch.plist</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/REPLACE_USERNAME/Library/Logs/cass-semantic-reindex.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/REPLACE_USERNAME/Library/Logs/cass-semantic-reindex.log</string>
</dict>
</plist>
PLIST
```

**IMPORTANT:** Replace `REPLACE_USERNAME` with the actual username on the work computer, then:

```bash
# Fix username in plists
sed -i '' "s/REPLACE_USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.cass.index-watch.plist
sed -i '' "s/REPLACE_USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.cass.semantic-reindex.plist

# Load daemons
launchctl load ~/Library/LaunchAgents/com.cass.index-watch.plist
launchctl load ~/Library/LaunchAgents/com.cass.semantic-reindex.plist
```

---

## Phase 3: Claude-Guardrails

Safety guardrails that run as a PreToolUse hook — blocks dangerous commands, detects secrets, audits all operations.

### 3.1 Install Guardrails

```bash
# From GitHub release
curl -sSL https://raw.githubusercontent.com/leegonzales/claude-guardrails/main/install.sh | bash
```

Or from source:
```bash
cd ~/Projects
git clone https://github.com/leegonzales/claude-guardrails
cd claude-guardrails
cargo build --release
./install.sh
```

### 3.2 Configuration

The install script creates `~/.claude/guardrails/`. Verify/create the config:

**`~/.claude/guardrails/config.toml`:**
```toml
[general]
safety_level = "high"
audit_log = true
audit_path = "~/.claude/guardrails/audit.jsonl"

[overrides]
allowlist_file = "~/.claude/guardrails/allow.toml"

[bash]
block_variable_commands = true
block_pipe_to_shell = true
```

### 3.3 Pattern Files

Create `~/.claude/guardrails/patterns/` with three files:

**`block.txt`** — Dangerous command patterns:
```
# Recursive deletes of critical paths
rm\s+-rf\s+/\s*$
rm\s+-rf\s+~/?\s*$
rm\s+-rf\s+\$HOME\s*$

# SQL destructive operations
DROP\s+TABLE
DROP\s+DATABASE
TRUNCATE\s+TABLE

# Force push to protected branches
git\s+push\s+(-f|--force)\s+.*\b(main|master)\b
git\s+push\s+.*\b(main|master)\b\s+(-f|--force)

# Dangerous git operations
git\s+reset\s+--hard
git\s+clean\s+-[a-zA-Z]*[dD]

# Dangerous permissions
chmod\s+777

# Device/filesystem destruction
mkfs\s+
dd\s+.*of=/dev/

# Fork bombs
:\(\)\{.*\}
```

**`secrets.txt`** — Credential detection patterns:
```
# OpenAI API keys
sk-[a-zA-Z0-9]{20,}

# AWS Access Key IDs
AKIA[0-9A-Z]{16}

# GitHub tokens
ghp_[a-zA-Z0-9]{36}
gho_[a-zA-Z0-9]{36}

# npm tokens
npm_[a-zA-Z0-9]{36}

# Private keys
-----BEGIN.*PRIVATE KEY

# Slack tokens
xox[baprs]-[a-zA-Z0-9-]+

# Anthropic API keys
sk-ant-[a-zA-Z0-9-]+
```

**`allow.txt`** — User allowlist (start empty):
```
# Add regex patterns here to bypass checks
# Example: rm\s+-rf\s+\./node_modules
```

---

## Phase 4: AISkills Repository

This is the core skills library — 45+ skills symlinked into `~/.claude/skills/`.

### 4.1 Clone the Repo

```bash
mkdir -p ~/Projects/leegonzales
cd ~/Projects/leegonzales
git clone https://github.com/leegonzales/AISkills
```

### 4.2 Symlink Skills to Claude Code

```bash
mkdir -p ~/.claude/skills

# General-purpose skills (not business-specific)
cd ~/Projects/leegonzales/AISkills

# Development & Code Review
ln -sf "$(pwd)/MCPBuilder/mcp-builder" ~/.claude/skills/mcp-builder
ln -sf "$(pwd)/PlaywrightSkill/playwright" ~/.claude/skills/playwright
ln -sf "$(pwd)/CodexPeerReview/codex-peer-review" ~/.claude/skills/codex-peer-review
ln -sf "$(pwd)/GeminiPeerReview" ~/.claude/skills/gemini-peer-review
ln -sf "$(pwd)/PRReviewLoop/pr-review-loop" ~/.claude/skills/pr-review-loop
ln -sf "$(pwd)/CodebaseNavigator/codebase-navigator" ~/.claude/skills/codebase-navigator
ln -sf "$(pwd)/RequestingCodeReview/requesting-code-review" ~/.claude/skills/requesting-code-review
ln -sf "$(pwd)/UnixReview/unix-review" ~/.claude/skills/unix-review

# Writing & Content
ln -sf "$(pwd)/ProsePolish" ~/.claude/skills/prose-polish
ln -sf "$(pwd)/ProsePolishRedline/prose-polish-redline" ~/.claude/skills/prose-polish-redline
ln -sf "$(pwd)/ResearchToEssay/research-to-essay" ~/.claude/skills/research-to-essay
ln -sf "$(pwd)/EssayToSpeech/essay-to-speech" ~/.claude/skills/essay-to-speech
ln -sf "$(pwd)/WritingPartner/writing-partner" ~/.claude/skills/writing-partner
ln -sf "$(pwd)/Claimify/claimify" ~/.claude/skills/claimify
ln -sf "$(pwd)/PresentationPartner/presentation-partner" ~/.claude/skills/presentation-partner
ln -sf "$(pwd)/SlideBuilder/slide-builder" ~/.claude/skills/slide-builder

# Analysis & Reasoning
ln -sf "$(pwd)/ConceptForge" ~/.claude/skills/concept-forge
ln -sf "$(pwd)/ProcessMapper/process-mapper" ~/.claude/skills/process-mapper
ln -sf "$(pwd)/ExcelAuditor/excel-auditor" ~/.claude/skills/excel-auditor
ln -sf "$(pwd)/CSVDataSummarizer/csv-data-summarizer" ~/.claude/skills/csv-data-summarizer
ln -sf "$(pwd)/InevitabilityEngine/inevitability-engine" ~/.claude/skills/inevitability-engine

# AI & Automation
ln -sf "$(pwd)/NotebookLMSkill/notebooklm" ~/.claude/skills/notebooklm
ln -sf "$(pwd)/ClaudeSpeak/claude-speak" ~/.claude/skills/claude-speak
ln -sf "$(pwd)/NanoBananaSkill" ~/.claude/skills/nano-banana
ln -sf "$(pwd)/Veo3Prompter/veo3-prompter" ~/.claude/skills/veo3-prompter
ln -sf "$(pwd)/FabricPatterns/fabric-patterns" ~/.claude/skills/fabric-patterns
ln -sf "$(pwd)/SecondBrain" ~/.claude/skills/second-brain
ln -sf "$(pwd)/ReadAloud/read-aloud" ~/.claude/skills/read-aloud

# Context & Continuity
ln -sf "$(pwd)/ContextContinuity" ~/.claude/skills/context-continuity
ln -sf "$(pwd)/ContextContinuityCode" ~/.claude/skills/context-continuity-code
ln -sf "$(pwd)/ClaudeProjectDocs/claude-project-docs" ~/.claude/skills/claude-project-docs

# Personas
ln -sf "$(pwd)/SiliconDoppelganger/silicon-doppelganger" ~/.claude/skills/silicon-doppelganger

# Multi-agent review (local directory skill, copy it)
cp -r "$(pwd)/MultiagentReview/multiagent-review" ~/.claude/skills/multiagent-review 2>/dev/null || true
```

### 4.3 Skills That Need External Dependencies

After symlinking, some skills need their dependencies installed:

| Skill | Dependency | Install |
|-------|-----------|---------|
| codex-peer-review | Codex CLI | `npm install -g @openai/codex` (done in Phase 1) |
| gemini-peer-review | Gemini CLI | `npm install -g @google/gemini-cli` (done in Phase 1) |
| fabric-patterns | fabric CLI | `go install github.com/danielmiessler/fabric@latest` (done in Phase 1) |
| codebase-navigator | osgrep | `pip install osgrep` |
| claude-speak | MLX + Kokoro TTS | See claude-speak SKILL.md for Apple Silicon setup |
| playwright | Playwright | `npx playwright install` |
| notebooklm | Browser automation | Needs Chrome + Playwright |
| second-brain | Obsidian vault | Configure VAULT_PATH in .zshrc |

---

## Phase 5: Claude Code Plugins

### 5.1 Add Plugin Marketplaces

Run these in Claude Code (via `/` commands or settings):

```
# In Claude Code, run:
/plugins marketplace add steveyegge/beads
/plugins marketplace add anthropics/claude-code
/plugins marketplace add anthropics/claude-plugins-official
/plugins marketplace add obra/superpowers-marketplace
/plugins marketplace add danshapiro/please-hold
```

### 5.2 Install Plugins

```
/plugins install beads@beads-marketplace
/plugins install frontend-design@claude-code-plugins
/plugins install pyright-lsp@claude-plugins-official
/plugins install superpowers@superpowers-marketplace
/plugins install please-hold@please-hold-marketplace
/plugins install rust-analyzer-lsp@claude-plugins-official
```

---

## Phase 6: Beads Issue Tracker

```bash
brew tap steveyegge/beads https://github.com/steveyegge/homebrew-beads
brew install bd
```

Verify: `bd --version` should show 0.46.0+

---

## Phase 7: Claude Code Settings

### 7.1 Main Settings (`~/.claude/settings.json`)

Write this file (merge with any existing settings):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "allow": [
      "Bash(bd *)",
      "Bash(brew *)",
      "Bash(claude *)",
      "Bash(codex *)",
      "Bash(cursor *)",
      "Bash(docker *)",
      "Bash(du *)",
      "Bash(ffmpeg *)",
      "Bash(ffprobe *)",
      "Bash(gemini *)",
      "Bash(gh *)",
      "Bash(git *)",
      "Bash(go *)",
      "Bash(jq *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(node *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(open *)",
      "Bash(pip *)",
      "Bash(pip3 *)",
      "Bash(pipx *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pytest *)",
      "Bash(pwd)",
      "Bash(ruff *)",
      "Bash(tree *)",
      "Bash(tsc *)",
      "Bash(uv *)",
      "Bash(which *)",
      "Edit(*)",
      "Read(*)",
      "Skill(*)",
      "WebFetch(*)",
      "WebSearch",
      "Write(*)",
      "mcp__chrome-devtools__*",
      "mcp__google-workspace__*",
      "mcp__maps-grounding-lite__*",
      "mcp__nanobanana-mcp__*",
      "mcp__veo-mcp__*"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/guardrails/claude-guardrails",
            "timeout": 5000
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  },
  "enabledPlugins": {
    "beads@beads-marketplace": true,
    "frontend-design@claude-code-plugins": true,
    "pyright-lsp@claude-plugins-official": true,
    "superpowers@superpowers-marketplace": true,
    "please-hold@please-hold-marketplace": true,
    "rust-analyzer-lsp@claude-plugins-official": true
  },
  "alwaysThinkingEnabled": true,
  "autoUpdatesChannel": "stable",
  "skipDangerousModePermissionPrompt": true
}
```

### 7.2 Local Settings (`~/.claude/settings.local.json`)

```json
{
  "permissions": {
    "allow": [
      "Bash(~/.claude/skills/pr-review-loop/scripts/commit-and-push.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/reply-to-comment.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/trigger-review.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/get-review-comments.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/summarize-reviews.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/claude-review.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/check-gemini-quota.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/watch-pr.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/resolve-comment.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/post-line-comment.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/get-agent-comments.sh *)",
      "Bash(~/.claude/skills/pr-review-loop/scripts/reopen-comment.sh *)",
      "Bash(mdls *)",
      "Bash(duti *)",
      "Bash(python3:*)"
    ],
    "deny": [],
    "ask": []
  },
  "prefersReducedMotion": true
}
```

### 7.3 Status Line Script (`~/.claude/statusline-command.sh`)

```bash
#!/bin/bash

# Read the JSON input from stdin
input=$(cat)

# Extract data from JSON
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')
model_name=$(echo "$input" | jq -r '.model.display_name')
output_style=$(echo "$input" | jq -r '.output_style.name')

# Get git info if in a git repo (skip optional locks for performance)
git_info=""
if git -C "$current_dir" rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git -C "$current_dir" branch --show-current 2>/dev/null || echo "detached")

    # Check for changes (skip optional locks)
    if [[ -n $(git -C "$current_dir" -c core.useBuiltinFSMonitor=false status --porcelain 2>/dev/null) ]]; then
        status="✗"
    else
        status="✓"
    fi

    git_info=" $(printf '\033[38;5;220m') ${branch} ${status}$(printf '\033[0m')"
fi

# Get shortened directory (replace home with ~)
short_dir="${current_dir/#$HOME/~}"

# Get username and hostname
user=$(whoami)
host=$(hostname -s)

# Detect Python virtual environment
python_env=""
if [[ -n "$VIRTUAL_ENV" ]]; then
    venv_name=$(basename "$VIRTUAL_ENV")
    python_env=" $(printf '\033[38;5;148m') ${venv_name}$(printf '\033[0m')"
elif [[ -n "$CONDA_DEFAULT_ENV" ]] && [[ "$CONDA_DEFAULT_ENV" != "base" ]]; then
    python_env=" $(printf '\033[38;5;148m') ${CONDA_DEFAULT_ENV}$(printf '\033[0m')"
fi

# Get current time (24h format, matching P10k)
current_time=$(date +%H:%M:%S)

# Build status line with colors matching P10k rainbow theme
printf "$(printf '\033[38;5;51m')${short_dir}$(printf '\033[0m')${git_info}${python_env} $(printf '\033[38;5;244m')${user}@${host}$(printf '\033[0m') $(printf '\033[38;5;238m')${current_time}$(printf '\033[0m')"
```

```bash
chmod +x ~/.claude/statusline-command.sh
```

---

## Phase 8: Global CLAUDE.md

Write `~/.claude/CLAUDE.md` — this is the global instruction file that shapes every Claude Code session.

**NOTE:** Adapt the Projects folder structure to match the work computer's layout. The core rules, coding style, voice system, and workflow patterns should transfer as-is.

```markdown
# CLAUDE.md — Global Defaults
*Location: ~/.claude/CLAUDE.md*

> **Scope** – User-level defaults for every Claude Code session.
> Any `CLAUDE.md` inside a repo **overrides** these rules.

---

## 0 · Personal Identity
- **Preferred name:** Lee
- **Primary time-zone:** America/Denver
- **Preferred editor:** open -a Cursor /path/to/file/or/directory
- **Shell:** zsh (`~/.zshrc` aliases apply)

### Cross-Repo Ecosystem Map
**`~/.claude/ecosystem-map.md`** — canonical map of how Lee's repos connect.

---

## 0.25 · ALWAYS USE LATEST & MOST ADVANCED MODELS

**Non-negotiable: Always use the latest AND most advanced models. No exceptions.**

- **Web search for current model IDs** before hardcoding — they change frequently
- Never default to older/weaker models (Sonnet, Haiku, etc.)
- For judging/evaluation tasks, always use the most advanced model available

---

## 0.5 · Training Data Staleness

**Training data is 6-12+ months old.** When encountering unfamiliar info, assume it may be newer than your data. Web search first for versioned software.

---

## 1 · Core Tooling
| Intent    | Command                                        |
|-----------|------------------------------------------------|
| Open file | `cursor {path}:{line}`                         |
| Run tests | `pytest -q`                                    |
| Commit    | `git add <files> && git commit -m "{msg}"`     |
| Push      | `git push -u origin HEAD`                      |
| Create PR | `gh pr create --fill --web`                    |
| Search history | `cass search "<query>"`                   |

### cass — Coding Agent Session Search
- `cass search "<query>"` — lexical search (fastest)
- `cass search "<query>" --mode semantic` — meaning-based search
- `cass search "<query>" --mode hybrid` — fuses lexical + semantic
- `cass tui` — interactive TUI
- `cass context <file>` — find sessions related to a source file

### Structured Data Tools
| Tool | Use when | Example |
|------|----------|---------|
| **jq** | Surgical JSON filter/transform | `jq '.items[] \| select(.status=="active")' data.json` |
| **duckdb** | SQL analytics over files | `duckdb -c "SELECT * FROM 'data/*.csv' WHERE x>10"` |
| **mlr** | Streaming record transforms | `mlr --ijson --ocsv cat data.json` |
| **gron** | Find paths in unknown JSON | `gron data.json \| grep email` |
| **jless** | Interactive TUI JSON browser | `jless response.json` |

---

## 2 · Coding Style
- **Indent:** 4 sp Python · 2 sp JS/TS · 2 sp Ruby · tabs Go
- **Max line:** 88 chars (all languages)
- **Python:** `black` + `ruff --strict` · type-hints mandatory
- **JS/TS:** `eslint` (airbnb) + `prettier`
- **Commits:** Conventional (`feat:`, `fix:`, `chore:` …)
- **Branches:** `type/issue-id-slug`

---

## 3 · System Voice & Meta-Banner

```text
[@strategist+@builder] [inner: brief thought]
```
* **Default blend:** `@strategist + @builder`
* Switch with `/voice:@<tag>` or `/voice:blend(@a,@b)`
* Step-by-step reasoning **only when asked**

### Operational Principles
* **Engagement Stance:** Not a yes-machine. Reflect, resist, and refine.
* **Core Frameworks:** OODA, Wardley Maps, Cynefin, Systems Thinking
* **Directives:** Steelman opposing views · Structure > Surface · Track Tradeoffs · Compound, Don't Consume

### Reasoner Roster
Available voices: `@strategist`, `@builder`, `@cartographer`, `@ethicist`, `@rebel_econ`, `@steward`, `@explorer`, `@dissident_poet`, `@inner_monk`, `@jester`, `@dreamsmith`, `@chronist`, `@pragmatist`, `@theorist`, `@chaoist_magician`

---

## 4 · Allowed Tools & Permissions

Claude **may always**: Edit files · Run pytest/ruff · Run data tools (jq, duckdb, mlr, gron, jless) · Execute git · Call gh

Claude **must ask first** before: Deleting files/dirs · Running commands outside repo · Writing to databases

---

## 5 · Workflow Patterns

1. **MAP** — draft Wardley map before coding
2. **TDD Loop** — Red → Green → Refactor
3. **OODA Spike** — rapid Observe-Orient-Decide-Act prototype
4. **MAV-C Claimify** — pass output through factual-claim checker
5. **Double-Loop Retrospect** — plan → execute → reflect → revise
6. **Safe YOLO** — sandbox branch with `--dangerously-skip-permissions`
7. **Design Doc Sprint** — outline → refine → sign-off → implement
8. **Flywheel Iteration** — capture compounding knowledge; queue next improvement

---

## 6 · Security & Repository Hygiene

* **Never** echo secrets in chat or diffs. Redact in logs.
* NEVER commit API keys or credentials.
* **GitHub repos:** Always create as **private** unless told otherwise.

---

## 7 · Parallel Subagent Orchestration

- Use `git worktree` for isolation — one worktree per agent
- Use `.worktrees/` inside project (add to `.gitignore`)
- Wave-based execution: merge wave N before launching wave N+1
- Always `git add` specific files (never `-A`)

---

## 8 · Maintenance

* Review settings quarterly — prune stale permissions, skills, and MCP servers.
* Keep this file under 200 lines.
```

---

## Phase 9: Shell Configuration (.zshrc additions)

Add these to `~/.zshrc` on the work computer:

```bash
# === AI Tools ===
alias python=python3
alias fabric="$HOME/go/bin/fabric"

# Google Workspace CLI (multi-org)
alias gws-difflab='GWS_CONFIG_DIR=~/.config/gws-difflab gws'
alias gws-catalyst='GWS_CONFIG_DIR=~/.config/gws-catalyst gws'
alias gws-personal='GWS_CONFIG_DIR=~/.config/gws-personal gws'

# Create GWS config dirs
mkdir -p ~/.config/gws-difflab ~/.config/gws-catalyst ~/.config/gws-personal

# === PATH additions ===
export GOROOT=/opt/homebrew/opt/go/libexec
export GOPATH=$HOME/go
export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
export PATH=$HOME/.local/bin:$PATH
export PATH=$HOME/.bun/bin:$PATH

# === API Keys (set these manually) ===
# export GEMINI_API_KEY=your-key-here
# export GOOGLE_API_KEY=your-key-here
# export ANTHROPIC_API_KEY=your-key-here
# export OPENAI_API_KEY=your-key-here
```

---

## Phase 10: MCP Servers (Cloud-Hosted via Claude.ai)

These MCP servers are **Anthropic cloud-hosted** — they appear automatically when you authenticate via Claude.ai OAuth. They are NOT local installations:

| MCP Server | Purpose | Setup |
|-----------|---------|-------|
| `google-workspace` | Gmail, Calendar, Drive, Docs, Sheets, Slides | OAuth via Claude.ai settings |
| `chrome-devtools` | Browser automation, screenshots, Lighthouse | Auto-available |
| `maps-grounding-lite` | Places search, routes, weather | Auto-available |
| `nanobanana-mcp` | Gemini image generation/editing | Auto-available |
| `veo-mcp` | Video generation (Veo 3.1) | Auto-available |
| `playwright` | Browser automation (alternative) | Auto-available |
| `brave-search` | Web search via Brave API | Auto-available |
| `obsidian` | Obsidian vault access | Auto-available |

**Action:** Enable these in Claude Code settings or Claude.ai connected apps. Most activate automatically.

---

## Phase 11: Verification Checklist

Run these to verify everything is working:

```bash
# Core tools
claude --version
cass --version && cass health
bd --version
gh --version
gemini --version
codex --version
fabric --version

# Data tools
jq --version
duckdb --version
mlr --version
gron --version

# Guardrails
~/.claude/guardrails/claude-guardrails --version

# Skills
ls ~/.claude/skills/ | wc -l  # Should be 30+

# Daemons
launchctl list | grep com.cass

# Plugins
ls ~/.claude/plugins/marketplaces/  # Should show 5 marketplaces
```

---

## What's Intentionally Excluded

These are business/client-specific — do NOT replicate:

| Item | Reason |
|------|--------|
| `~/Projects/Difflab/` repos | Company-specific (DiffLab) |
| `~/Projects/catalyst/` repos | Client work (Catalyst consulting) |
| `~/.claude/ecosystem-map.md` | Maps personal project relationships |
| `silicon-doppelganger-actual` skill | Personal proxy agent |
| `produce-show` skill | Show production pipeline (personal) |
| `project-cos` skill | Project cost calculation (business) |
| Team configs in `~/.claude/teams/` | Session-specific |
| Session history / debug logs | Machine-specific |
| `~/.claude/projects/` | Project-specific context (auto-generated) |

---

## Post-Setup: Manual Steps for Lee

1. **Authenticate GWS orgs** (interactive):
   ```bash
   gws-difflab auth login
   gws-catalyst auth login
   gws-personal auth login
   ```

2. **Set API keys** in `~/.zshrc`:
   - `GEMINI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`

3. **Configure Obsidian vault path** if using Second Brain:
   ```bash
   export VAULT_PATH="/path/to/your/obsidian/vault"
   ```

4. **Run `cass index`** once to build initial database

5. **Install Playwright browsers** if using browser automation skills:
   ```bash
   npx playwright install
   ```
