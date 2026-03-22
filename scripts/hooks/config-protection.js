#!/usr/bin/env node
/**
 * Config Protection Hook
 *
 * Blocks modifications to linter/formatter config files.
 * Agents frequently modify these to make checks pass instead of fixing
 * the actual code. This hook steers the agent back to fixing the source.
 *
 * Exit codes:
 *   0 = allow (not a config file)
 *   2 = block (config file modification attempted)
 */

'use strict';

const path = require('path');

const MAX_STDIN = 1024 * 1024;
let raw = '';

const PROTECTED_FILES = new Set([
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'biome.json',
  'biome.jsonc',
  '.ruff.toml',
  'ruff.toml',
  'pyproject.toml',
  '.shellcheckrc',
  '.stylelintrc',
  '.stylelintrc.json',
  '.stylelintrc.yml',
  '.markdownlint.json',
  '.markdownlint.yaml',
  '.markdownlintrc',
]);

// Patterns for files where only certain sections are config-like
// (e.g. pyproject.toml has [tool.ruff] but also [project])
const PARTIAL_CONFIG_FILES = new Set(['pyproject.toml']);

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    const remaining = MAX_STDIN - raw.length;
    raw += chunk.substring(0, remaining);
  }
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const filePath = input.tool_input?.file_path || input.tool_input?.file || '';

    if (!filePath) {
      process.stdout.write(raw);
      process.exit(0);
    }

    const basename = path.basename(filePath);

    if (PROTECTED_FILES.has(basename) && !PARTIAL_CONFIG_FILES.has(basename)) {
      process.stderr.write(
        `BLOCKED: Modifying ${basename} is not allowed. ` +
        `Fix the source code to satisfy linter/formatter rules instead of ` +
        `weakening the config. If this is a legitimate config change, ` +
        `disable the config-protection hook temporarily.\n`
      );
      process.exit(2);
    }
  } catch {
    // Keep hook non-blocking on parse errors.
  }

  process.stdout.write(raw);
});
