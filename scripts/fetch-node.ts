#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, rmSync, copyFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const NODE_VERSION = 'v22.11.0';

interface Platform {
  nodeArch: string;
  tauriTarget: string;
  archiveSuffix: 'tar.gz' | 'tar.xz' | 'zip';
  osLabel: 'darwin' | 'win' | 'linux';
}

function detectPlatform(): Platform {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'darwin') {
    if (arch === 'arm64') return { nodeArch: 'arm64', tauriTarget: 'aarch64-apple-darwin', archiveSuffix: 'tar.gz', osLabel: 'darwin' };
    return { nodeArch: 'x64', tauriTarget: 'x86_64-apple-darwin', archiveSuffix: 'tar.gz', osLabel: 'darwin' };
  }
  if (platform === 'win32') {
    if (arch === 'arm64') return { nodeArch: 'arm64', tauriTarget: 'aarch64-pc-windows-msvc', archiveSuffix: 'zip', osLabel: 'win' };
    return { nodeArch: 'x64', tauriTarget: 'x86_64-pc-windows-msvc', archiveSuffix: 'zip', osLabel: 'win' };
  }
  if (platform === 'linux') {
    if (arch === 'arm64') return { nodeArch: 'arm64', tauriTarget: 'aarch64-unknown-linux-gnu', archiveSuffix: 'tar.xz', osLabel: 'linux' };
    return { nodeArch: 'x64', tauriTarget: 'x86_64-unknown-linux-gnu', archiveSuffix: 'tar.xz', osLabel: 'linux' };
  }
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

async function download(url: string, dest: string): Promise<void> {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  const ws = createWriteStream(dest);
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    ws.write(Buffer.from(value));
  }
  await new Promise<void>((r) => ws.end(r));
}

function extractArchive(archive: string, dir: string, suffix: string): void {
  let cmd: string;
  let args: string[];
  if (suffix === 'tar.gz') {
    cmd = 'tar';
    args = ['-xzf', archive, '-C', dir];
  } else if (suffix === 'tar.xz') {
    cmd = 'tar';
    args = ['-xJf', archive, '-C', dir];
  } else {
    if (process.platform === 'win32') {
      cmd = 'powershell';
      args = ['-NoProfile', '-Command', `Expand-Archive -Path "${archive}" -DestinationPath "${dir}" -Force`];
    } else {
      cmd = 'unzip';
      args = ['-o', archive, '-d', dir];
    }
  }
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Extraction failed (exit ${result.status}): ${cmd} ${args.join(' ')}`);
}

async function main() {
  const p = detectPlatform();
  const binariesDir = join(process.cwd(), 'src-tauri', 'binaries');
  mkdirSync(binariesDir, { recursive: true });

  const ext = process.platform === 'win32' ? '.exe' : '';
  const outName = `node-${p.tauriTarget}${ext}`;
  const outPath = join(binariesDir, outName);

  if (existsSync(outPath)) {
    console.log(`Already exists: ${outPath}`);
    return;
  }

  const archiveName = `node-${NODE_VERSION}-${p.osLabel}-${p.nodeArch}.${p.archiveSuffix}`;
  const url = `https://nodejs.org/dist/${NODE_VERSION}/${archiveName}`;
  const tmpArchive = join(tmpdir(), archiveName);
  await download(url, tmpArchive);

  const extractDir = join(tmpdir(), `node-extract-${Date.now()}`);
  mkdirSync(extractDir, { recursive: true });
  extractArchive(tmpArchive, extractDir, p.archiveSuffix);

  const topDir = `node-${NODE_VERSION}-${p.osLabel}-${p.nodeArch}`;
  const nodeBin = join(extractDir, topDir, 'bin', `node${ext}`);
  if (!existsSync(nodeBin)) throw new Error(`node binary not found at ${nodeBin}`);

  copyFileSync(nodeBin, outPath);
  chmodSync(outPath, 0o755);

  rmSync(tmpArchive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });
  console.log(`Installed: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
