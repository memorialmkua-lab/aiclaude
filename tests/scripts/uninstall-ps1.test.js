/**
 * Tests for uninstall.ps1 wrapper delegation
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { resolvePowerShellCommand } = require('./powershell-test-utils');

const INSTALL_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
const SCRIPT = path.join(__dirname, '..', '..', 'uninstall.ps1');
const PACKAGE_JSON = path.join(__dirname, '..', '..', 'package.json');

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function run(powerShellCommand, args = [], options = {}) {
  const env = {
    ...process.env,
    HOME: options.homeDir || process.env.HOME,
    USERPROFILE: options.homeDir || process.env.USERPROFILE,
  };

  try {
    const stdout = execFileSync(powerShellCommand, ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT, ...args], {
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
  console.log('\n=== Testing uninstall.ps1 ===\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const powerShellCommand = resolvePowerShellCommand();

  if (test('publishes uninstall wrappers in the package file list', () => {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    assert.ok(packageJson.files.includes('uninstall.sh'));
    assert.ok(packageJson.files.includes('uninstall.ps1'));
    assert.ok(packageJson.files.includes('scripts/uninstall.js'));
  })) passed++; else failed++;

  if (!powerShellCommand) {
    console.log('  - skipped delegation test; PowerShell is not available in PATH');
    skipped++;
  } else if (test('delegates to the Node uninstaller and preserves dry-run output', () => {
    const homeDir = createTempDir('uninstall-ps1-home-');
    const projectDir = createTempDir('uninstall-ps1-project-');

    try {
      execFileSync('node', [INSTALL_SCRIPT, '--target', 'cursor', 'typescript'], {
        cwd: projectDir,
        env: {
          ...process.env,
          HOME: homeDir,
          USERPROFILE: homeDir,
        },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });

      const statePath = path.join(projectDir, '.cursor', 'ecc-install-state.json');
      assert.ok(fs.existsSync(statePath));

      const result = run(powerShellCommand, ['--target', 'cursor', '--dry-run', '--json'], {
        cwd: projectDir,
        homeDir,
      });

      assert.strictEqual(result.code, 0, result.stderr);
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.dryRun, true);
      assert.strictEqual(parsed.summary.plannedRemovalCount, 1);
      assert.ok(fs.existsSync(statePath));
    } finally {
      cleanup(homeDir);
      cleanup(projectDir);
    }
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
