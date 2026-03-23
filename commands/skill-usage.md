---
description: Show skill usage stats from ~/.claude/metrics/skill-usage.jsonl. Filter by session or show all.
---

# Skill Usage Command

Show which skills Claude invoked and how often.

## Usage

```bash
/skill-usage              # Current session (default)
/skill-usage all          # All sessions, ranked by frequency
/skill-usage <session-id> # Specific session ID (partial match)
```

## Current Session

Show skills used in this session, ordered by invocation time.

**Script:**
```bash
node -e "
const fs = require('fs');
const os = require('os');
const path = require('path');

const logFile = path.join(os.homedir(), '.claude', 'metrics', 'skill-usage.jsonl');
const args = (process.argv[1] || '').trim();

if (!fs.existsSync(logFile)) {
  console.log('No skill usage data found.');
  console.log('Skills are logged automatically when Claude invokes a skill.');
  process.exit(0);
}

const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
const rows = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

if (rows.length === 0) {
  console.log('No skill usage recorded yet.');
  process.exit(0);
}

const currentSession = process.env.CLAUDE_SESSION_ID || '';
const showAll = args === 'all';
const sessionFilter = (!args || args === 'all') ? null : args;

let filtered;
if (showAll) {
  filtered = rows;
} else if (sessionFilter) {
  filtered = rows.filter(r => r.session_id && r.session_id.includes(sessionFilter));
} else {
  // Default: current session
  filtered = currentSession ? rows.filter(r => r.session_id === currentSession) : rows;
}

if (filtered.length === 0) {
  const label = sessionFilter || (currentSession ? currentSession.slice(0, 8) : 'current');
  console.log('No skill usage found for session: ' + label);
  console.log('');
  console.log('Try: /skill-usage all');
  process.exit(0);
}

// Build frequency map
const freq = {};
const lastSeen = {};
for (const r of filtered) {
  freq[r.skill] = (freq[r.skill] || 0) + 1;
  if (!lastSeen[r.skill] || r.timestamp > lastSeen[r.skill]) {
    lastSeen[r.skill] = r.timestamp;
  }
}

const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
const total = filtered.length;

const label = showAll ? 'All Sessions' : sessionFilter ? 'Session: ' + sessionFilter : 'Current Session (' + (currentSession ? currentSession.slice(0, 8) : 'unknown') + ')';

console.log('Skill Usage — ' + label);
console.log('Total invocations: ' + total);
console.log('');
console.log('Count  Skill');
console.log('─────────────────────────────────────────────────────');
for (const [skill, count] of sorted) {
  const bar = '█'.repeat(Math.min(count, 20));
  console.log(String(count).padStart(4) + '   ' + skill);
}

if (showAll) {
  // Break down by session
  console.log('');
  console.log('By Session:');
  console.log('─────────────────────────────────────────────────────');
  const bySess = {};
  for (const r of filtered) {
    const sid = (r.session_id || 'unknown').slice(0, 8);
    if (!bySess[sid]) bySess[sid] = { count: 0, date: r.timestamp.slice(0, 10) };
    bySess[sid].count++;
  }
  const sessEntries = Object.entries(bySess).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  for (const [sid, info] of sessEntries) {
    console.log(String(info.count).padStart(4) + '   ' + sid + '  (' + info.date + ')');
  }
}
" "$ARGUMENTS"
```

## Arguments

`$ARGUMENTS`:
- _(empty)_ — current session
- `all` — all sessions, ranked by frequency + breakdown by session
- `<session-id>` — partial session ID match (first 4-8 chars work)

## Examples

```bash
# What skills did Claude use this session?
/skill-usage

# All-time most used skills
/skill-usage all

# Skills used in a specific session
/skill-usage a1b2c3d4
```

## Notes

- Data is stored in `~/.claude/metrics/skill-usage.jsonl`
- Logging requires the `skill-tracker.js` PreToolUse hook to be active
- Only explicit Skill tool invocations are tracked (not always-on rules/agents)
