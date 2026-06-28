import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);
const isWindows = process.platform === 'win32';
const forwardedArgs = process.argv.slice(2);
const requireFromHere = createRequire(import.meta.url);

function packageFile(packageName, filename) {
  return path.join(path.dirname(requireFromHere.resolve(`${packageName}/package.json`)), filename);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 60_000) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      if (response.ok || response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for ${BASE_URL}. Last error: ${String(lastError)}`);
}

function spawnManaged(command, args, env = process.env) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    detached: !isWindows,
  });
}

async function stopProcessTree(child) {
  if (!child.pid || child.exitCode !== null) return;

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn('C:\\Windows\\System32\\taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
      });
      killer.once('exit', () => resolve());
      killer.once('error', () => resolve());
    });
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // Process already exited.
    }
  }
}

async function main() {
  const nextBin = packageFile('next', path.join('dist', 'bin', 'next'));
  const playwrightCli = packageFile('playwright', 'cli.js');
  const server = spawnManaged(process.execPath, [nextBin, isCI ? 'start' : 'dev', '--port', String(PORT)]);

  const shutdown = async (exitCode) => {
    await stopProcessTree(server);
    process.exit(exitCode);
  };

  process.once('SIGINT', () => {
    void shutdown(130);
  });
  process.once('SIGTERM', () => {
    void shutdown(143);
  });

  let exitCode = 0;
  try {
    await waitForServer();
    const result = spawnSync(process.execPath, [playwrightCli, 'test', ...forwardedArgs], {
      cwd: process.cwd(),
      env: { ...process.env, PLAYWRIGHT_SKIP_WEB_SERVER: '1' },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    exitCode = result.status ?? (result.signal ? 1 : 0);
  } finally {
    await stopProcessTree(server);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
