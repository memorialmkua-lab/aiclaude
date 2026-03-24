#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts. Loads the most recent session
 * summary into Claude's context via stdout, and reports available
 * sessions and learned skills.
 *
 * SessionStart hooks require stdout in hookSpecificOutput format:
 * {"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}
 */

const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  readFile,
  stripAnsi,
  log,
} = require('../lib/utils');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');
const { listAliases } = require('../lib/session-aliases');
const { detectProjectType } = require('../lib/project-detect');

/**
 * Emit hookSpecificOutput for SessionStart hooks.
 * Uses process.stdout.write with a flush callback to avoid the race
 * condition where process.exit() fires before stdout is fully flushed.
 */
function emitSessionStartOutput(context, callback) {
  const payload = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  });
  // Guard against double invocation: 'error' event can fire alongside
  // the write callback, so use a settled flag to ensure single execution.
  let settled = false;
  const done = (err) => {
    if (settled) return;
    settled = true;
    if (err) log(`[SessionStart] stdout write error: ${err.message}`);
    callback();
  };
  process.stdout.once('error', done);
  process.stdout.write(payload + '\n', done);
}

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  const contextParts = [];

  // Check for recent session files (last 7 days)
  const recentSessions = findFiles(sessionsDir, '*-session.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);

    // Read and inject the latest session content into Claude's context
    const content = stripAnsi(readFile(latest.path));
    if (content && !content.includes('[Session context goes here]')) {
      // Only inject if the session has actual content (not the blank template)
      contextParts.push(`Previous session summary:\n${content}`);
    }
  }

  // Check for learned skills
  const learnedSkills = findFiles(learnedDir, '*.md');

  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // Check for available session aliases
  const aliases = listAliases({ limit: 5 });

  if (aliases.length > 0) {
    const aliasNames = aliases.map(a => a.name).join(', ');
    log(`[SessionStart] ${aliases.length} session alias(es) available: ${aliasNames}`);
    log(`[SessionStart] Use /sessions load <alias> to continue a previous session`);
  }

  // Detect and report package manager
  const pm = getPackageManager();
  log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

  // If no explicit package manager config was found, show selection prompt
  if (pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  // Detect project type and frameworks (#293)
  const projectInfo = detectProjectType();
  if (projectInfo.languages.length > 0 || projectInfo.frameworks.length > 0) {
    const parts = [];
    if (projectInfo.languages.length > 0) {
      parts.push(`languages: ${projectInfo.languages.join(', ')}`);
    }
    if (projectInfo.frameworks.length > 0) {
      parts.push(`frameworks: ${projectInfo.frameworks.join(', ')}`);
    }
    log(`[SessionStart] Project detected — ${parts.join('; ')}`);
    contextParts.push(`Project type: ${JSON.stringify(projectInfo)}`);
  } else {
    log('[SessionStart] No specific project type detected');
  }

  // Always emit hookSpecificOutput (even if empty) to satisfy the contract,
  // then exit only after stdout is flushed
  const context = contextParts.length > 0 ? contextParts.join('\n\n') : '';
  emitSessionStartOutput(context, () => {
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // Don't block on errors
});
