#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

function log(icon, message) {
  console.log(`  ${icon}  ${message}`);
}

function section(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(50)}`);
}

function getVersion(command, args = []) {
  try {
    const result = execSync(`${command} ${args.join(' ')} --version`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return result;
  } catch {
    return null;
  }
}

function parseVersion(versionStr) {
  if (!versionStr) return null;
  const match = versionStr.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function meetsMinimum(actual, min) {
  if (!actual) return false;
  if (actual.major > min.major) return true;
  if (actual.major < min.major) return false;
  if (actual.minor > min.minor) return true;
  if (actual.minor < min.minor) return false;
  return actual.patch >= min.patch;
}

let allPassed = true;

console.log('\n🔍 TremorGuard Frontend - Version Check');
console.log('='.repeat(50));

section('Runtime Requirements');

const nodeVersion = process.version;
const nodeParsed = parseVersion(nodeVersion);
const nodeMin = { major: 18, minor: 0, patch: 0 };
if (meetsMinimum(nodeParsed, nodeMin)) {
  log('✅', `Node.js: ${nodeVersion} (>= 18.0.0)`);
} else {
  log('❌', `Node.js: ${nodeVersion} - 需要 >= 18.0.0`);
  allPassed = false;
}

const pnpmVersion = getVersion('pnpm');
const pnpmParsed = parseVersion(pnpmVersion);
const pnpmMin = { major: 8, minor: 0, patch: 0 };
if (meetsMinimum(pnpmParsed, pnpmMin)) {
  log('✅', `pnpm: ${pnpmVersion} (>= 8.0.0)`);
} else {
  log('❌', `pnpm: ${pnpmVersion || '未安装'} - 需要 >= 8.0.0`);
  allPassed = false;
}

section('React Native Dependencies (Patient App)');

const watchmanVersion = getVersion('watchman');
if (watchmanVersion) {
  log('✅', `Watchman: ${watchmanVersion}`);
} else {
  log('⚠️', 'Watchman: 未检测到 (macOS推荐安装)');
}

const javaVersion = getVersion('java', ['-version']);
if (javaVersion) {
  log('✅', `Java: ${javaVersion.split('\n')[0]}`);
} else {
  log('⚠️', 'Java: 未检测到 (Android开发需要)');
}

if (process.platform === 'darwin') {
  try {
    execSync('xcode-select -p', { stdio: 'ignore' });
    log('✅', 'Xcode Command Line Tools: 已安装');
  } catch {
    log('⚠️', 'Xcode: 未检测到 (iOS开发需要)');
  }
}

section('Project Structure');

const requiredRootFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'tsconfig.base.json',
  '.eslintrc.base.js',
  '.prettierrc',
  '.gitignore',
];

for (const file of requiredRootFiles) {
  const path = resolve(rootDir, file);
  if (existsSync(path)) {
    log('✅', file);
  } else {
    log('❌', `${file} - 缺失`);
    allPassed = false;
  }
}

const apps = ['patient-app', 'doctor-dashboard', 'admin-console'];
for (const app of apps) {
  const pkgPath = resolve(rootDir, 'apps', app, 'package.json');
  if (existsSync(pkgPath)) {
    log('✅', `apps/${app}`);
  } else {
    log('❌', `apps/${app} - 缺失`);
    allPassed = false;
  }
}

const packages = [
  'shared-types',
  'utils',
  'ble-service',
  'local-db',
  'sync-engine',
];
for (const pkg of packages) {
  const pkgPath = resolve(rootDir, 'packages', pkg, 'package.json');
  if (existsSync(pkgPath)) {
    log('✅', `packages/${pkg}`);
  } else {
    log('❌', `packages/${pkg} - 缺失`);
    allPassed = false;
  }
}

section('Summary');

if (allPassed) {
  console.log('\n✅ 所有版本检查通过！\n');
  console.log('下一步:');
  console.log('  1. 运行 pnpm install 安装依赖');
  console.log('  2. 运行 pnpm run scaffold:verify 验证脚手架');
  console.log('  3. 运行 pnpm run typecheck 类型检查\n');
  process.exit(0);
} else {
  console.log('\n❌ 部分检查未通过，请修复后重试\n');
  process.exit(1);
}
