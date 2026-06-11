/**
 * 更新 GIS 静态资源脚本
 *
 * 功能：
 * 1. 进入 cesiumBase 目录执行 npm run build
 * 2. 将编译产物从 cesiumBase/dist 复制到 test/public/gis
 * 3. 将 cesiumBase/public/cdn 复制到 test/public/gis/cdn
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// 路径配置
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_CESIUM_DIR = path.join(ROOT_DIR, 'cesiumBase');
const TEST_PUBLIC_DIR = path.join(ROOT_DIR, 'test', 'public');
const GIS_TARGET_DIR = path.join(TEST_PUBLIC_DIR, 'gis');

// 源目录
const DIST_SOURCE = path.join(BASE_CESIUM_DIR, 'dist');
const CDN_SOURCE = path.join(BASE_CESIUM_DIR, 'public', 'cdn');

// 目标目录
const DIST_TARGET = GIS_TARGET_DIR;
const CDN_TARGET = path.join(GIS_TARGET_DIR, 'cdn');

/**
 * 检查目录是否存在
 */
function checkDirectories() {
  log.info('检查目录...');

  if (!fs.existsSync(BASE_CESIUM_DIR)) {
    throw new Error(`cesiumBase 目录不存在: ${BASE_CESIUM_DIR}`);
  }

  if (!fs.existsSync(DIST_SOURCE)) {
    log.warn(`dist 目录不存在，将先执行编译: ${DIST_SOURCE}`);
  }

  // 确保 test/public 目录存在
  if (!fs.existsSync(TEST_PUBLIC_DIR)) {
    fs.mkdirSync(TEST_PUBLIC_DIR, { recursive: true });
    log.info(`创建目录: ${TEST_PUBLIC_DIR}`);
  }
}

/**
 * 清空目标目录
 */
function cleanTargetDir() {
  log.info('清空旧的 GIS 资源...');

  if (fs.existsSync(GIS_TARGET_DIR)) {
    fs.rmSync(GIS_TARGET_DIR, { recursive: true, force: true });
    log.success('已清空: ' + GIS_TARGET_DIR);
  }

  fs.mkdirSync(GIS_TARGET_DIR, { recursive: true });
  log.info('创建目录: ' + GIS_TARGET_DIR);
}

/**
 * 编译 cesiumBase
 */
function buildBaseCesium() {
  log.info('开始编译 cesiumBase...');
  log.info('执行: npm run build');

  try {
    const startTime = Date.now();
    execSync('npm run build', {
      cwd: BASE_CESIUM_DIR,
      stdio: 'inherit',
      shell: true
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`编译完成 (耗时 ${duration}秒)`);
  } catch (error) {
    throw new Error('编译失败: ' + error.message);
  }
}

/**
 * 递归复制目录
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`源目录不存在: ${source}`);
  }

  log.info(`复制: ${source} -> ${target}`);

  // 使用跨平台的复制方式
  const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
  const copyCmd = process.platform === 'win32'
    ? `xcopy "${source}\\*" "${target}\\" /E /I /Y /Q`
    : `cp -r "${source}/"* "${target}/"`;

  try {
    execSync(copyCmd, { stdio: 'inherit', shell });
    log.success('复制完成');
  } catch (error) {
    // 如果 shell 命令失败，使用 Node.js 方式
    log.warn('Shell 复制失败，使用 Node.js 方式...');
    copyDirectoryRecursive(source, target);
  }
}

/**
 * 使用 Node.js 递归复制
 */
function copyDirectoryRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const tgtPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, tgtPath);
    } else {
      fs.copyFileSync(srcPath, tgtPath);
    }
  }

  log.success('复制完成 (Node.js 方式)');
}

/**
 * 复制资源
 */
function copyAssets() {
  log.info('开始复制编译产物...');

  // 复制 dist 目录
  if (!fs.existsSync(DIST_SOURCE)) {
    throw new Error(`编译后的 dist 目录不存在: ${DIST_SOURCE}`);
  }
  copyDirectory(DIST_SOURCE, DIST_TARGET);

  // 复制 cdn 目录
  if (fs.existsSync(CDN_SOURCE)) {
    log.info('复制 CDN 资源...');
    copyDirectory(CDN_SOURCE, CDN_TARGET);
  } else {
    log.warn(`CDN 目录不存在，跳过: ${CDN_SOURCE}`);
  }
}

/**
 * 显示统计信息
 */
function showStats() {
  log.info('资源统计:');

  let fileCount = 0;
  let totalSize = 0;

  function countFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        countFiles(fullPath);
      } else {
        fileCount++;
        try {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        } catch (e) {
          // 忽略无法读取的文件
        }
      }
    }
  }

  countFiles(GIS_TARGET_DIR);

  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log(`  文件数: ${fileCount}`);
  console.log(`  总大小: ${sizeMB} MB`);
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log(colors.blue + '========================================');
    console.log('  GIS 静态资源更新工具');
    console.log('========================================' + colors.reset);
    console.log('');

    log.info(`cesiumBase: ${BASE_CESIUM_DIR}`);
    log.info(`目标目录: ${GIS_TARGET_DIR}`);
    console.log('');

    // 1. 检查目录
    checkDirectories();
    console.log('');

    // 2. 清空目标目录
    cleanTargetDir();
    console.log('');

    // 3. 编译 cesiumBase
    buildBaseCesium();
    console.log('');

    // 4. 复制资源
    copyAssets();
    console.log('');

    // 5. 显示统计
    showStats();
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`更新完成! 总耗时: ${duration}秒`);
    console.log('');
    log.info('现在可以启动 test 项目查看更新:');
    console.log(`  cd ${path.join('..', 'test')}`);
    console.log('  npm run dev');

  } catch (error) {
    console.log('');
    log.error(error.message);
    process.exit(1);
  }
}

// 运行
main();
