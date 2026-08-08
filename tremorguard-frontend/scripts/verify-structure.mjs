#!/usr/bin/env node
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

function log(icon, message) {
  console.log(`  ${icon}  ${message}`);
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function checkDir(path) {
  try {
    return existsSync(path) && statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function checkFile(path) {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
}

let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

function check(condition, passMsg, failMsg) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    log('✅', passMsg);
  } else {
    allPassed = false;
    log('❌', failMsg);
  }
}

console.log('\n🏗️  TremorGuard Frontend - Scaffold Verification');
console.log('='.repeat(60));

section('1. Root Configuration');

const rootPkgPath = resolve(rootDir, 'package.json');
check(checkFile(rootPkgPath), 'package.json 存在', 'package.json 缺失');

if (checkFile(rootPkgPath)) {
  const rootPkg = readJson(rootPkgPath);
  check(
    rootPkg.private === true,
    '根 package.json 标记为 private',
    '根 package.json 应设置 private: true',
  );
  check(
    rootPkg.packageManager?.startsWith('pnpm@'),
    `packageManager: ${rootPkg.packageManager || '未设置'}`,
    'packageManager 字段缺失（pnpm@8.x）',
  );
  check(
    rootPkg.engines?.node && /^>=18/.test(rootPkg.engines.node),
    `engines.node: ${rootPkg.engines?.node}`,
    'engines.node 缺失或版本低于 18',
  );
  check(
    rootPkg.scripts?.['scaffold:verify'],
    'scaffold:verify 脚本存在',
    'scaffold:verify 脚本缺失',
  );
  check(
    rootPkg.devDependencies?.turbo,
    `turbo: ${rootPkg.devDependencies?.turbo}`,
    'turbo 依赖缺失',
  );
  check(
    rootPkg.devDependencies?.typescript,
    `typescript: ${rootPkg.devDependencies?.typescript}`,
    'typescript 依赖缺失',
  );
}

check(checkFile(resolve(rootDir, 'pnpm-workspace.yaml')), 'pnpm-workspace.yaml 存在', 'pnpm-workspace.yaml 缺失');
check(checkFile(resolve(rootDir, 'turbo.json')), 'turbo.json 存在', 'turbo.json 缺失');
check(checkFile(resolve(rootDir, 'tsconfig.base.json')), 'tsconfig.base.json 存在', 'tsconfig.base.json 缺失');
check(checkFile(resolve(rootDir, '.eslintrc.base.js')), '.eslintrc.base.js 存在', '.eslintrc.base.js 缺失');
check(checkFile(resolve(rootDir, '.prettierrc')), '.prettierrc 存在', '.prettierrc 缺失');
check(checkFile(resolve(rootDir, '.gitignore')), '.gitignore 存在', '.gitignore 缺失');
check(checkFile(resolve(rootDir, 'commitlint.config.js')), 'commitlint.config.js 存在', 'commitlint.config.js 缺失');

if (checkFile(resolve(rootDir, 'tsconfig.base.json'))) {
  const tsconfig = readJson(resolve(rootDir, 'tsconfig.base.json'));
  check(
    tsconfig.compilerOptions?.strict === true,
    'TypeScript 严格模式已开启',
    'TypeScript 应开启 strict 模式',
  );
  check(
    tsconfig.compilerOptions?.paths?.['@tremorguard/shared-types'],
    '路径别名配置: @tremorguard/*',
    '路径别名 @tremorguard/* 未配置',
  );
}

section('2. Apps (3 Applications)');

const appConfigs = {
  'patient-app': {
    name: '@tremorguard/patient-app',
    deps: ['react', 'react-native', 'react-native-ble-plx', 'zustand'],
    files: ['App.tsx', 'index.js', 'app.json', 'metro.config.js', 'babel.config.js'],
    dirs: ['ios', 'android'],
  },
  'doctor-dashboard': {
    name: '@tremorguard/doctor-dashboard',
    deps: ['react', 'react-dom', 'zustand'],
    files: ['index.html', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx', 'tsconfig.node.json'],
    dirs: ['src'],
  },
  'admin-console': {
    name: '@tremorguard/admin-console',
    deps: ['react', 'react-dom', 'zustand'],
    files: ['index.html', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx', 'tsconfig.node.json'],
    dirs: ['src'],
  },
};

for (const [appName, config] of Object.entries(appConfigs)) {
  const appDir = resolve(rootDir, 'apps', appName);
  const pkgPath = resolve(appDir, 'package.json');

  console.log(`\n  📱 ${appName}`);
  console.log('  ' + '-'.repeat(56));

  check(checkDir(appDir), `目录存在: apps/${appName}`, `目录缺失: apps/${appName}`);

  if (checkFile(pkgPath)) {
    const pkg = readJson(pkgPath);
    check(
      pkg.name === config.name,
      `package name: ${pkg.name}`,
      `package name 应为 ${config.name}, 实际为 ${pkg.name}`,
    );
    check(
      pkg.private === true,
      '标记为 private',
      '应设置 private: true',
    );

    for (const dep of config.deps) {
      check(
        pkg.dependencies?.[dep] || pkg.devDependencies?.[dep],
        `依赖: ${dep}`,
        `依赖缺失: ${dep}`,
      );
    }
  } else {
    log('❌', 'package.json 缺失');
    allPassed = false;
    totalChecks++;
  }

  for (const file of config.files) {
    const filePath = resolve(appDir, file);
    check(checkFile(filePath), `文件: ${file}`, `文件缺失: ${file}`);
  }

  for (const dir of config.dirs) {
    const dirPath = resolve(appDir, dir);
    check(checkDir(dirPath), `目录: ${dir}/`, `目录缺失: ${dir}/`);
  }
}

section('3. Packages (5 Shared Packages)');

const packageConfigs = {
  'shared-types': {
    name: '@tremorguard/shared-types',
    files: ['src/index.ts', 'src/patient.ts', 'src/tremor.ts', 'src/device.ts', 'src/medication.ts'],
    deps: [],
  },
  utils: {
    name: '@tremorguard/utils',
    files: ['src/index.ts', 'src/date.ts', 'src/id.ts', 'src/logger.ts'],
    deps: ['@tremorguard/shared-types'],
  },
  'ble-service': {
    name: '@tremorguard/ble-service',
    files: [
      'src/index.ts',
      'src/types.ts',
      'src/BleService.interface.ts',
      'src/BleService.mock.ts',
      'src/HeartbeatManager.ts',
    ],
    deps: ['@tremorguard/shared-types', '@tremorguard/utils'],
  },
  'local-db': {
    name: '@tremorguard/local-db',
    files: [
      'src/index.ts',
      'src/types.ts',
      'src/Database.interface.ts',
      'src/migrations/001_initial.ts',
      'src/repositories/TremorReadingRepository.ts',
      'src/repositories/MedicationRepository.ts',
      'src/repositories/PatientRepository.ts',
    ],
    deps: ['@tremorguard/shared-types', '@tremorguard/utils'],
  },
  'sync-engine': {
    name: '@tremorguard/sync-engine',
    files: [
      'src/index.ts',
      'src/types.ts',
      'src/SyncEngine.interface.ts',
      'src/SyncQueue.ts',
      'src/ConflictResolver.ts',
    ],
    deps: ['@tremorguard/shared-types', '@tremorguard/utils', '@tremorguard/local-db'],
  },
};

for (const [pkgName, config] of Object.entries(packageConfigs)) {
  const pkgDir = resolve(rootDir, 'packages', pkgName);
  const pkgPath = resolve(pkgDir, 'package.json');

  console.log(`\n  📦 ${pkgName}`);
  console.log('  ' + '-'.repeat(56));

  check(checkDir(pkgDir), `目录存在: packages/${pkgName}`, `目录缺失: packages/${pkgName}`);

  if (checkFile(pkgPath)) {
    const pkg = readJson(pkgPath);
    check(
      pkg.name === config.name,
      `package name: ${pkg.name}`,
      `package name 应为 ${config.name}, 实际为 ${pkg.name}`,
    );
    check(
      pkg.private === true,
      '标记为 private',
      '应设置 private: true',
    );
    check(
      pkg.main === 'src/index.ts',
      `main: ${pkg.main}`,
      `main 字段应为 src/index.ts`,
    );

    for (const dep of config.deps) {
      check(
        pkg.dependencies?.[dep],
        `依赖: ${dep}`,
        `依赖缺失: ${dep}`,
      );
    }
  } else {
    log('❌', 'package.json 缺失');
    allPassed = false;
    totalChecks++;
  }

  for (const file of config.files) {
    const filePath = resolve(pkgDir, file);
    check(checkFile(filePath), `文件: ${file}`, `文件缺失: ${file}`);
  }
}

section('4. Core Interface Definitions');

function checkInterface(filePath, interfaceName) {
  if (!checkFile(filePath)) {
    log('❌', `${interfaceName} 接口文件缺失`);
    allPassed = false;
    totalChecks++;
    return;
  }
  const content = readFileSync(filePath, 'utf-8');
  const hasInterface = new RegExp(`interface\\s+${interfaceName}`).test(content) ||
    new RegExp(`export\\s+(interface|type)\\s+${interfaceName}`).test(content);
  check(
    hasInterface,
    `${interfaceName} 接口定义存在`,
    `${interfaceName} 接口定义缺失`,
  );
}

checkInterface(
  resolve(rootDir, 'packages/ble-service/src/BleService.interface.ts'),
  'BleService',
);
checkInterface(
  resolve(rootDir, 'packages/local-db/src/Database.interface.ts'),
  'Database',
);
checkInterface(
  resolve(rootDir, 'packages/sync-engine/src/SyncEngine.interface.ts'),
  'SyncEngine',
);
checkInterface(
  resolve(rootDir, 'packages/sync-engine/src/SyncEngine.interface.ts'),
  'SyncAdapter',
);

section('5. Scripts');

check(checkFile(resolve(rootDir, 'scripts/check-versions.mjs')), 'scripts/check-versions.mjs', 'scripts/check-versions.mjs 缺失');
check(checkFile(resolve(rootDir, 'scripts/verify-structure.mjs')), 'scripts/verify-structure.mjs', 'scripts/verify-structure.mjs 缺失');

section('📊 Summary');

const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : '0';
console.log(`\n  总检查项: ${totalChecks}`);
console.log(`  通过: ${passedChecks}`);
console.log(`  失败: ${totalChecks - passedChecks}`);
console.log(`  通过率: ${passRate}%\n`);

if (allPassed) {
  console.log('✅ 脚手架结构验证全部通过！\n');
  console.log('项目结构:');
  console.log('  tremorguard-frontend/');
  console.log('  ├── apps/');
  console.log('  │   ├── patient-app/       (React Native 0.72)');
  console.log('  │   ├── doctor-dashboard/  (React 18 + Vite 5)');
  console.log('  │   └── admin-console/     (React 18 + Vite 5)');
  console.log('  ├── packages/');
  console.log('  │   ├── shared-types/      (领域实体类型)');
  console.log('  │   ├── utils/             (通用工具函数)');
  console.log('  │   ├── ble-service/       (BLE 通信抽象)');
  console.log('  │   ├── local-db/          (SQLite 本地数据库)');
  console.log('  │   └── sync-engine/       (离线同步引擎)');
  console.log('  ├── scripts/               (工程脚本)');
  console.log('  └── (根配置文件)\n');
  process.exit(0);
} else {
  console.log('❌ 部分检查未通过，请检查上方失败项\n');
  process.exit(1);
}
