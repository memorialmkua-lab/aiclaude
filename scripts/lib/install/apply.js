'use strict';

const fs = require('fs');
const path = require('path');

const { writeInstallState } = require('../install-state');

/**
 * Merge hooks from the installed hooks/hooks.json into settings.json for the
 * Claude target. Claude Code reads hooks only from settings.json, not from a
 * standalone hooks.json file in a subdirectory.
 */
function mergeHooksIntoSettings(plan) {
  if (!plan.adapter || plan.adapter.target !== 'claude') {
    return;
  }

  const hooksJsonPath = path.join(plan.targetRoot, 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) {
    return;
  }

  let hooksConfig;
  try {
    hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
  } catch {
    return;
  }

  if (!hooksConfig.hooks || typeof hooksConfig.hooks !== 'object') {
    return;
  }

  const settingsPath = path.join(plan.targetRoot, 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      settings = {};
    }
  }

  settings.hooks = hooksConfig.hooks;

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

function applyInstallPlan(plan) {
  for (const operation of plan.operations) {
    fs.mkdirSync(path.dirname(operation.destinationPath), { recursive: true });
    fs.copyFileSync(operation.sourcePath, operation.destinationPath);
  }

  mergeHooksIntoSettings(plan);

  writeInstallState(plan.installStatePath, plan.statePreview);

  return {
    ...plan,
    applied: true,
  };
}

module.exports = {
  applyInstallPlan,
};
