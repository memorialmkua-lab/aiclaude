const { spawnSync } = require('child_process');

function getPowerShellCandidates(platform = process.platform) {
  return platform === 'win32'
    ? ['pwsh', 'pwsh.exe', 'powershell.exe']
    : ['pwsh'];
}

function resolvePowerShellCommand(platform = process.platform, spawn = spawnSync) {
  const candidates = getPowerShellCandidates(platform);

  for (const candidate of candidates) {
    const result = spawn(
      candidate,
      ['-NoLogo', '-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'],
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000,
      }
    );

    if (!result.error && result.status === 0) {
      return candidate;
    }
  }

  return null;
}

module.exports = {
  getPowerShellCandidates,
  resolvePowerShellCommand,
};
