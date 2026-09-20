import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORTAL_PORT = 3000;
const SLIDEV_PORT = 3030;

function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[STARTUP] Terminated existing process on port ${port} (PID ${pid})`);
        } catch {}
      }
    } else {
      execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch {}
}

function checkHttp(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForHttp(url, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkHttp(url)) return true;
    await new Promise(r => setTimeout(r, 600));
  }
  return false;
}

async function main() {
  console.log('\n======================================================');
  console.log('   Starting Classroom TA & Slidev Presentation Engine  ');
  console.log('======================================================\n');

  // 1. Clean up stale ports
  console.log('[1/3] Ensuring ports 3000 and 3030 are free...');
  killProcessOnPort(PORTAL_PORT);
  killProcessOnPort(SLIDEV_PORT);

  // 2. Launch Vite dev server (which mounts API middleware and starts Slidev)
  console.log('[2/3] Launching application server on port 3000...');
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  
  const child = spawn(npmCmd, ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(PORTAL_PORT)], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const cleanup = () => {
    console.log('\n[SHUTDOWN] Stopping Classroom TA and Slidev...');
    killProcessOnPort(PORTAL_PORT);
    killProcessOnPort(SLIDEV_PORT);
    try { child.kill(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    try { child.kill(); } catch {}
  });

  // 3. Wait for readiness
  console.log('[3/3] Waiting for Portal and Slidev to initialize...');
  const portalReady = await waitForHttp(`http://localhost:${PORTAL_PORT}/`);
  const slidevReady = await waitForHttp(`http://localhost:${SLIDEV_PORT}/`);

  if (portalReady && slidevReady) {
    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                   CLASSROOM TEACHING ASSISTANT                    ║');
    console.log('║                      Application is READY!                        ║');
    console.log('╠═══════════════════════════════════════════════════════════════════╣');
    console.log(`║  ► Portal Application:    http://localhost:${PORTAL_PORT}                  ║`);
    console.log(`║  ► Slidev Engine:         http://localhost:${SLIDEV_PORT}                  ║`);
    console.log(`║  ► Presenter Mode:        http://localhost:${SLIDEV_PORT}/presenter        ║`);
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
    console.log('Press Ctrl+C at any time to gracefully stop all services.\n');
  } else {
    console.warn('\n[WARNING] One or more services took longer than expected to report ready.');
    console.log(`  Portal (port ${PORTAL_PORT}): ${portalReady ? 'READY' : 'STARTING...'}`);
    console.log(`  Slidev (port ${SLIDEV_PORT}): ${slidevReady ? 'READY' : 'STARTING...'}`);
  }
}

main().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
