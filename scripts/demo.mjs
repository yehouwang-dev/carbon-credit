import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const contractsDir = path.join(root, 'hardhat-project');
const frontendDir = path.join(root, 'fronted');
const rpcPort = Number(process.env.DEMO_RPC_PORT || 8545);
const webPort = Number(process.env.DEMO_WEB_PORT || 8080);
for (const port of [rpcPort, webPort]) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid demo port.');
}
if (rpcPort === webPort) throw new Error('The chain and frontend need different ports.');
const rpcUrl = `http://127.0.0.1:${rpcPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const manifestPath = path.join(frontendDir, 'src/contracts/deployment.json');
const ownedProcesses = [];
let stopping = false;
let heartbeat;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearInterval(heartbeat);
  for (const child of ownedProcesses) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function launch(command, args, cwd, env = {}, service = false) {
  const child = spawn(command, args, {
    cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  ownedProcesses.push(child);
  // Hardhat prints public development keys; keep them out of the demo output.
  for (const stream of [child.stdout, child.stderr]) {
    const lines = createInterface({ input: stream });
    lines.on('line', (line) => {
      if (!/Private Key:/i.test(line)) console.log(line);
    });
  }
  child.on('error', (error) => {
    console.error(error.message);
    if (service) stop(1);
  });
  if (service) child.on('exit', (code) => {
    if (!stopping) {
      console.error(`Demo service stopped (${code}).`);
      stop(1);
    }
  });
  return child;
}

async function run(command, args, cwd, env = {}) {
  const child = launch(command, args, cwd, env);
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Command failed (${code}).`)));
  });
}

async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(2000) });
}

async function rpc(method, params = []) {
  const response = await request(rpcUrl, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || 'RPC request failed.');
  return data.result;
}

async function isOnline(url) {
  try { await request(url); return true; } catch { return false; }
}

async function waitUntil(check, label, timeout = 90000) {
  const deadline = Date.now() + timeout;
  while (!stopping && Date.now() < deadline) {
    try { if (await check()) return; } catch { /* startup not ready */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${label} did not start. Check the port and dependency output above.`);
}

async function deploymentExists() {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.chainId !== 31337 || manifest.network !== 'localhost') return false;
    const addresses = Object.values(manifest.contracts);
    if (addresses.length !== 6) return false;
    const code = await Promise.all(addresses.map((address) => rpc('eth_getCode', [address, 'latest'])));
    return code.every((value) => value && value !== '0x');
  } catch { return false; }
}

async function main() {
  console.log('Starting the Carbon Credit local demo…');
  for (const [dir, dependency] of [[contractsDir, 'hardhat'], [frontendDir, 'vite']]) {
    if (!existsSync(path.join(dir, 'node_modules', dependency, 'package.json'))) {
      console.log(`Installing dependencies in ${path.basename(dir)}…`);
      await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci'], dir);
    }
  }
  const localEnv = { LOCAL_RPC_URL: rpcUrl, VITE_LOCAL_RPC_URL: rpcUrl, VITE_NETWORK: 'local' };
  if (await isOnline(rpcUrl)) {
    const chain = await rpc('eth_chainId');
    const client = await rpc('web3_clientVersion');
    if (Number(chain) !== 31337 || !/hardhat/i.test(client)) {
      throw new Error(`${rpcUrl} is occupied by another service. Choose a different DEMO_RPC_PORT.`);
    }
    console.log('Using the existing local Hardhat node; its data is preserved.');
  } else {
    launch(process.execPath, ['node_modules/hardhat/internal/cli/cli.js', 'node', '--hostname', '127.0.0.1', '--port', String(rpcPort)], contractsDir, localEnv, true);
    await waitUntil(async () => Number(await rpc('eth_chainId')) === 31337, 'Hardhat');
  }
  if (stopping) return;
  if (!(await deploymentExists())) {
    console.log('Deploying contracts and creating the sample project…');
    await run(process.execPath, ['node_modules/hardhat/internal/cli/cli.js', 'run', 'scripts/deploy.js', '--network', 'localhost'], contractsDir, localEnv);
  } else {
    console.log('Using the existing contracts and demo records.');
  }
  if (stopping) return;
  if (await isOnline(webUrl)) {
    const source = await request(`${webUrl}/src/contracts/contracts.js`).then((res) => res.text());
    if (!source.includes('CONTRACT_ABIS') || !source.includes('localDeployment')) {
      throw new Error(`${webUrl} is occupied by another website. Choose a different DEMO_WEB_PORT.`);
    }
    // Existing Vite servers may have been configured for a different network/RPC.
    const envMatch = source.match(/import\.meta\.env\s*=\s*({[^;]+})/);
    const env = envMatch ? JSON.parse(envMatch[1]) : {};
    if ((env.VITE_NETWORK && env.VITE_NETWORK !== 'local') ||
        (env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545') !== rpcUrl) {
      throw new Error('The existing frontend uses another network/RPC. Stop it or choose another DEMO_WEB_PORT.');
    }
    console.log('Using the existing frontend.');
  } else {
    launch(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], frontendDir, localEnv, true);
    await waitUntil(() => isOnline(webUrl), 'Frontend');
  }
  console.log(`\nDemo ready: ${webUrl}\nClick “进入本地演示 / Enter local demo”.\nWalkthrough: docs/DEMO.md\nKeep this terminal open. Press Ctrl+C to stop services started by this command.`);
  if (process.env.DEMO_NO_OPEN !== '1') {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
    const opener = spawn(command, [webUrl], { stdio: 'ignore' });
    opener.on('error', () => console.log(`Open ${webUrl} in your browser.`));
  }
  heartbeat = setInterval(() => {}, 1000);
}

main().catch((error) => { console.error(`Demo startup failed: ${error.message}`); stop(1); });
