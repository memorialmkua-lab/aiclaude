/**
 * Tests for scripts PowerShell resolution helpers
 */

const assert = require('assert');

const {
  getPowerShellCandidates,
  resolvePowerShellCommand,
} = require('./powershell-test-utils');

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
  console.log('\n=== Testing powershell-test-utils.js ===\n');

  let passed = 0;
  let failed = 0;

  if (test('prefers pwsh before Windows PowerShell on Windows', () => {
    assert.deepStrictEqual(getPowerShellCandidates('win32'), ['pwsh', 'pwsh.exe', 'powershell.exe']);
  })) passed++; else failed++;

  if (test('only probes pwsh on non-Windows platforms', () => {
    assert.deepStrictEqual(getPowerShellCandidates('linux'), ['pwsh']);
  })) passed++; else failed++;

  if (test('returns the first available PowerShell candidate', () => {
    const seen = [];
    const fakeSpawn = candidate => {
      seen.push(candidate);
      return {
        error: candidate === 'pwsh' ? new Error('not found') : null,
        status: candidate === 'pwsh.exe' ? 0 : 1,
      };
    };

    const resolved = resolvePowerShellCommand('win32', fakeSpawn);

    assert.strictEqual(resolved, 'pwsh.exe');
    assert.deepStrictEqual(seen, ['pwsh', 'pwsh.exe']);
  })) passed++; else failed++;

  if (test('returns null when no candidate succeeds', () => {
    const fakeSpawn = () => ({ error: new Error('not found'), status: 1 });
    assert.strictEqual(resolvePowerShellCommand('win32', fakeSpawn), null);
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
