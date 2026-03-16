/**
 * Tests for install.ps1 wrapper delegation
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { resolvePowerShellCommand } = require('./powershell-test-utils');

const SCRIPT = path.join(__dirname, '..', '..', 'install.ps1');
const PACKAGE_JSON = path.join(__dirname, '..', '..', 'package.json');

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function resolveExecutablePath(command) {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const output = execFileSync(locator, [command], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5000,
  });

  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);
}

function run(powerShellCommand, args = [], options = {}) {
  const env = {
    ...process.env,
    HOME: options.homeDir || process.env.HOME,
    USERPROFILE: options.homeDir || process.env.USERPROFILE,
    ...options.env,
  };

  const scriptPath = options.scriptPath || SCRIPT;

  try {
    const stdout = execFileSync(powerShellCommand, ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], {
      cwd: options.cwd,
      env,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });

    return { code: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      code: error.status || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
    };
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (error) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing install.ps1 ===\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const powerShellCommand = resolvePowerShellCommand();

  if (test('publishes ecc-install through the Node installer runtime for cross-platform npm usage', () => {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    assert.strictEqual(packageJson.bin['ecc-install'], 'scripts/install-apply.js');
  })) passed++; else failed++;

  if (!powerShellCommand) {
    console.log('  - skipped delegation test; PowerShell is not available in PATH');
    skipped++;
  } else if (test('delegates to the Node installer and preserves dry-run output', () => {
    const homeDir = createTempDir('install-ps1-home-');
    const projectDir = createTempDir('install-ps1-project-');

    try {
      const result = run(powerShellCommand, ['--target', 'cursor', '--dry-run', 'typescript'], {
        cwd: projectDir,
        homeDir,
      });

      assert.strictEqual(result.code, 0, result.stderr);
      assert.ok(result.stdout.includes('Dry-run install plan'));
      assert.ok(!fs.existsSync(path.join(projectDir, '.cursor', 'hooks.json')));
    } finally {
      cleanup(homeDir);
      cleanup(projectDir);
    }
  })) passed++; else failed++;

  if (!powerShellCommand) {
    console.log('  - skipped missing-node preflight test; PowerShell is not available in PATH');
    skipped++;
  } else if (test('surfaces a friendly error when Node.js is not available in PATH', () => {
    const powerShellPath = resolveExecutablePath(powerShellCommand);
    const emptyPathDir = createTempDir('install-ps1-path-');
    const homeDir = createTempDir('install-ps1-home-');
    const projectDir = createTempDir('install-ps1-project-');

    try {
      const result = run(powerShellPath, ['--dry-run', 'typescript'], {
        cwd: projectDir,
        homeDir,
        env: {
          PATH: emptyPathDir,
        },
      });

      assert.strictEqual(result.code, 1);
      assert.ok(result.stderr.includes('Node.js was not found in PATH. Please install Node.js and try again.'));
    } finally {
      cleanup(emptyPathDir);
      cleanup(homeDir);
      cleanup(projectDir);
    }
  })) passed++; else failed++;

  if (!powerShellCommand) {
    console.log('  - skipped missing-script preflight test; PowerShell is not available in PATH');
    skipped++;
  } else if (test('surfaces a friendly error when the installer runtime script is missing', () => {
    const wrapperDir = createTempDir('install-ps1-wrapper-');
    const homeDir = createTempDir('install-ps1-home-');
    const projectDir = createTempDir('install-ps1-project-');
    const wrapperScript = path.join(wrapperDir, 'install.ps1');

    try {
      fs.copyFileSync(SCRIPT, wrapperScript);

      const result = run(powerShellCommand, ['--dry-run', 'typescript'], {
        cwd: projectDir,
        homeDir,
        scriptPath: wrapperScript,
      });

      assert.strictEqual(result.code, 1);
      assert.ok(result.stderr.includes(`Installer script not found: ${path.join(wrapperDir, 'scripts', 'install-apply.js')}`));
    } finally {
      cleanup(wrapperDir);
      cleanup(homeDir);
      cleanup(projectDir);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
