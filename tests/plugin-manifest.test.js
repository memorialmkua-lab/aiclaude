/**
 * Tests for plugin manifests:
 *   - .claude-plugin/plugin.json (Claude Code plugin)
 *   - .codex-plugin/plugin.json (Codex native plugin)
 *
 * Enforces rules documented in .claude-plugin/PLUGIN_SCHEMA_NOTES.md
 *
 * Run with: node tests/plugin-manifest.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    failed++;
  }
}

// ── Claude plugin manifest ────────────────────────────────────────────────────
console.log('\n=== .claude-plugin/plugin.json ===\n');

const claudePluginPath = path.join(repoRoot, '.claude-plugin', 'plugin.json');

test('claude plugin.json exists', () => {
  assert.ok(fs.existsSync(claudePluginPath), 'Expected .claude-plugin/plugin.json to exist');
});

const claudePlugin = JSON.parse(fs.readFileSync(claudePluginPath, 'utf8'));

test('claude plugin.json has version field', () => {
  assert.ok(claudePlugin.version, 'Expected version field');
});

test('claude plugin.json agents is an array', () => {
  assert.ok(Array.isArray(claudePlugin.agents), 'Expected agents to be an array (not a string/directory)');
});

test('claude plugin.json agents uses explicit file paths (not directories)', () => {
  for (const agentPath of claudePlugin.agents) {
    assert.ok(
      agentPath.endsWith('.md'),
      `Expected explicit .md file path, got: ${agentPath}`,
    );
    assert.ok(
      !agentPath.endsWith('/'),
      `Expected explicit file path, not directory, got: ${agentPath}`,
    );
  }
});

test('claude plugin.json all agent files exist', () => {
  for (const agentRelPath of claudePlugin.agents) {
    const absolute = path.join(repoRoot, agentRelPath.replace(/^\.\//, ''));
    assert.ok(
      fs.existsSync(absolute),
      `Agent file missing: ${agentRelPath}`,
    );
  }
});

test('claude plugin.json skills is an array', () => {
  assert.ok(Array.isArray(claudePlugin.skills), 'Expected skills to be an array');
});

test('claude plugin.json commands is an array', () => {
  assert.ok(Array.isArray(claudePlugin.commands), 'Expected commands to be an array');
});

test('claude plugin.json does NOT have explicit hooks declaration', () => {
  assert.ok(
    !('hooks' in claudePlugin),
    'hooks field must NOT be declared — Claude Code v2.1+ auto-loads hooks/hooks.json by convention',
  );
});

// ── Codex plugin manifest ─────────────────────────────────────────────────────
console.log('\n=== .codex-plugin/plugin.json ===\n');

const codexPluginPath = path.join(repoRoot, '.codex-plugin', 'plugin.json');

test('codex plugin.json exists', () => {
  assert.ok(fs.existsSync(codexPluginPath), 'Expected .codex-plugin/plugin.json to exist');
});

const codexPlugin = JSON.parse(fs.readFileSync(codexPluginPath, 'utf8'));

test('codex plugin.json has version field', () => {
  assert.ok(codexPlugin.version, 'Expected version field');
});

test('codex plugin.json has name field', () => {
  assert.ok(codexPlugin.name, 'Expected name field');
});

test('codex plugin.json skills is an array', () => {
  assert.ok(Array.isArray(codexPlugin.skills), 'Expected skills to be an array');
});

test('codex plugin.json mcpServers points to existing .mcp.json', () => {
  assert.ok(codexPlugin.mcpServers, 'Expected mcpServers field');
  const mcpPath = path.join(repoRoot, codexPlugin.mcpServers.replace(/^\.\//, ''));
  assert.ok(
    fs.existsSync(mcpPath),
    `mcpServers file missing: ${codexPlugin.mcpServers}`,
  );
});

// ── Codex .mcp.json ───────────────────────────────────────────────────────────
console.log('\n=== .codex-plugin/.mcp.json ===\n');

const mcpJsonPath = path.join(repoRoot, '.codex-plugin', '.mcp.json');

test('.mcp.json exists', () => {
  assert.ok(fs.existsSync(mcpJsonPath), 'Expected .codex-plugin/.mcp.json to exist');
});

const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));

test('.mcp.json has mcpServers object', () => {
  assert.ok(
    mcpConfig.mcpServers && typeof mcpConfig.mcpServers === 'object',
    'Expected mcpServers object',
  );
});

test('.mcp.json includes at least github, context7, and exa servers', () => {
  const servers = Object.keys(mcpConfig.mcpServers);
  assert.ok(servers.includes('github'), 'Expected github MCP server');
  assert.ok(servers.includes('context7'), 'Expected context7 MCP server');
  assert.ok(servers.includes('exa'), 'Expected exa MCP server');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
