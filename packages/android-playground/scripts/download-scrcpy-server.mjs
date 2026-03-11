#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchVersion } from 'gh-release-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRCPY_VERSION = 'v3.1';

// 国内镜像源配置
const MIRROR_URLS = [
  // GitHub 原始地址（备用）
  `https://github.com/Genymobile/scrcpy/releases/download/${SCRCPY_VERSION}/scrcpy-server-${SCRCPY_VERSION.replace('v', '')}`,
  // 国内镜像源
  `https://ghproxy.com/https://github.com/Genymobile/scrcpy/releases/download/${SCRCPY_VERSION}/scrcpy-server-${SCRCPY_VERSION.replace('v', '')}`,
  `https://mirror.ghproxy.com/https://github.com/Genymobile/scrcpy/releases/download/${SCRCPY_VERSION}/scrcpy-server-${SCRCPY_VERSION.replace('v', '')}`
];

async function downloadFromMirror(url, destination) {
  console.log(`[scrcpy] Trying to download from: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(destination, buffer);
  console.log('[scrcpy] Download completed successfully');
}

async function main() {
  const args = process.argv.slice(2);
  const targetArgIndex = args.findIndex((arg) => arg.startsWith('--target='));

  let serverBinPath;
  let binDir;

  if (targetArgIndex !== -1) {
    const targetPath = args[targetArgIndex].split('=')[1];
    serverBinPath = path.resolve(process.cwd(), targetPath);
    binDir = path.dirname(serverBinPath);
  } else {
    binDir = path.resolve(__dirname, '../bin');
    serverBinPath = path.resolve(binDir, 'scrcpy-server');
  }

  try {
    await fs.access(serverBinPath);
    console.log('[scrcpy] Server already exists, skipping download');
    return;
  } catch {
    // file does not exist, continue downloading
  }

  console.log(
    `[scrcpy] Downloading scrcpy server ${SCRCPY_VERSION}...`,
  );

  await fs.mkdir(binDir, { recursive: true });

  // 尝试从各个镜像源下载
  for (const mirrorUrl of MIRROR_URLS) {
    try {
      await downloadFromMirror(mirrorUrl, serverBinPath);
      return; // 下载成功则退出
    } catch (error) {
      console.warn(`[scrcpy] Failed to download from ${mirrorUrl}:`, error.message);
      continue;
    }
  }

  // 如果所有镜像都失败，回退到原始的 gh-release-fetch 方法
  console.log('[scrcpy] Falling back to original download method...');
  await fetchVersion({
    repository: 'Genymobile/scrcpy',
    version: SCRCPY_VERSION,
    package: `scrcpy-server-${SCRCPY_VERSION}`,
    destination: binDir,
    extract: false,
  });

  const downloadedFile = path.join(binDir, `scrcpy-server-${SCRCPY_VERSION}`);
  await fs.rename(downloadedFile, serverBinPath);

  console.log('[scrcpy] Server downloaded successfully');
}

main().catch((error) => {
  console.error('[scrcpy] Failed to download server:', error.message);
  process.exit(1);
});