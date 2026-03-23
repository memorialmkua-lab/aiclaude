#!/usr/bin/env node
/**
 * Skill Usage Tracker Hook
 *
 * Fires on PreToolUse for the Skill tool.
 * Appends a record to ~/.claude/metrics/skill-usage.jsonl with:
 *   - timestamp, session_id, skill name, args, cwd
 *
 * View your skill usage log:
 *   cat ~/.claude/metrics/skill-usage.jsonl | jq .
 *   cat ~/.claude/metrics/skill-usage.jsonl | jq -r '.skill' | sort | uniq -c | sort -rn
 */

'use strict';

const path = require('path');
const { ensureDir, appendFile, getClaudeDir } = require('../lib/utils');

const MAX_STDIN = 1024 * 1024;
let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    raw += chunk.substring(0, MAX_STDIN - raw.length);
  }
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const toolInput = input.tool_input || input.input || input;

    const skill = String(toolInput.skill || '');
    const args = String(toolInput.args || '');

    if (skill) {
      const metricsDir = path.join(getClaudeDir(), 'metrics');
      ensureDir(metricsDir);

      const row = {
        timestamp: new Date().toISOString(),
        session_id: String(process.env.CLAUDE_SESSION_ID || 'unknown'),
        cwd: String(process.env.CLAUDE_CWD || process.cwd()),
        skill,
        args: args || undefined,
      };

      appendFile(
        path.join(metricsDir, 'skill-usage.jsonl'),
        `${JSON.stringify(row)}\n`,
      );
    }
  } catch {
    // Non-blocking — never fail the hook.
  }

  process.stdout.write(raw);
});
