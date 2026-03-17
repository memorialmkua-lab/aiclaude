'use strict';

const path = require('path');
const fs = require('fs');

const MARKER = path.join('scripts', 'lib', 'session-manager.js');

function resolvePluginRoot() {
  const home = require('os').homedir();

  // 1. Env var (always wins)
  if (process.env.CLAUDE_PLUGIN_ROOT && process.env.CLAUDE_PLUGIN_ROOT.trim()) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }

  // 2. Relative to this file (works for direct clones and local installs)
  const relativeRoot = path.resolve(__dirname, '..', '..');
  if (fs.existsSync(path.join(relativeRoot, MARKER))) {
    return relativeRoot;
  }

  // 3. Known plugin marketplace paths
  const candidates = [
    path.join(home, '.claude', 'plugins', 'everything-claude-code'),
    path.join(home, '.claude', 'plugins', 'everything-claude-code@everything-claude-code'),
    path.join(home, '.claude', 'plugins', 'marketplace', 'everything-claude-code'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, MARKER))) {
      return c;
    }
  }

  // 4. Search plugin cache (versioned directories like ~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.8.0)
  const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'everything-claude-code');
  if (fs.existsSync(cacheDir)) {
    try {
      for (const entry of fs.readdirSync(cacheDir)) {
        const nested = path.join(cacheDir, entry);
        if (!fs.statSync(nested).isDirectory()) continue;
        if (fs.existsSync(path.join(nested, MARKER))) return nested;
        // One level deeper (e.g. cache/everything-claude-code/everything-claude-code/1.8.0)
        try {
          for (const inner of fs.readdirSync(nested)) {
            const deep = path.join(nested, inner);
            if (fs.statSync(deep).isDirectory() && fs.existsSync(path.join(deep, MARKER))) {
              return deep;
            }
          }
        } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
  }

  // 5. Broad search in plugins directories
  const pluginDirs = [
    path.join(home, '.claude', 'plugins'),
    path.join(home, '.claude', 'plugins', 'marketplace'),
  ];
  for (const dir of pluginDirs) {
    try {
      for (const entry of fs.readdirSync(dir)) {
        const candidate = path.join(dir, entry);
        if (fs.statSync(candidate).isDirectory() && fs.existsSync(path.join(candidate, MARKER))) {
          return candidate;
        }
      }
    } catch (_) { /* ignore */ }
  }

  // 6. Fallback to ~/.claude (original behavior)
  return path.join(home, '.claude');
}

module.exports = { resolvePluginRoot };
