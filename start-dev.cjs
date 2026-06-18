/**
 * 快速启动脚本
 *
 * 自动检查依赖并启动开发服务器
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}[STEP]${colors.reset} ${msg}`)
};

const TEST_DIR = path.resolve(__dirname);
const NODE_MODULES = path.join(TEST_DIR, 'node_modules');

/**
 * 检查 node_modules 是否存在
 */
function checkDependencies() {
  log.step('检查依赖...');
  if (fs.existsSync(NODE_MODULES)) {
    log.success('依赖已安装');
    return true;
  }
  return false;
}

/**
 * 安装依赖
 */
function installDependencies() {
  log.step('安装依赖...');
  try {
    const startTime = Date.now();
    execSync('npm install', {
      cwd: TEST_DIR,
      stdio: 'inherit',
      shell: true
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`依赖安装完成 (耗时 ${duration}秒)`);
  } catch (error) {
    throw new Error('依赖安装失败: ' + error.message);
  }
}

/**
 * 启动开发服务器
 */
function startDevServer() {
  log.step('启动开发服务器...');
  console.log('');
  console.log(colors.green + '========================================');
  console.log('  🚀 开发服务器启动中...');
  console.log('========================================' + colors.reset);
  console.log('');
  console.log(colors.cyan + '可用页面:' + colors.reset);
  console.log(`  ${colors.green}•${colors.reset} 组件展示页面: ${colors.yellow}http://localhost:5173/components${colors.reset}`);
  console.log(`  ${colors.green}•${colors.reset} GIS iframe 模式: ${colors.yellow}http://localhost:5173/gis${colors.reset}`);
  console.log('');
  console.log(colors.cyan + '可用功能:' + colors.reset);
  console.log(`  ${colors.green}•${colors.reset} CesiumToolbarButton 组件展示`);
  console.log(`  ${colors.green}•${colors.reset} FunctionPanelUIBase 功能面板`);
  console.log(`  ${colors.green}•${colors.reset} 自定义面板示例`);
  console.log('');
  console.log(colors.blue + '提示: 按 Ctrl+C 停止服务器' + colors.reset);
  console.log('');

  try {
    execSync('npm run dev', {
      cwd: TEST_DIR,
      stdio: 'inherit',
      shell: true
    });
  } catch (error) {
    // 用户按 Ctrl+C 停止服务器
    log.info('开发服务器已停止');
    process.exit(0);
  }
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log(colors.blue + '========================================');
    console.log('  🚀 Test 项目快速启动');
    console.log('========================================' + colors.reset);
    console.log('');

    // 1. 检查依赖
    const depsInstalled = checkDependencies();

    // 2. 安装依赖（如果需要）
    if (!depsInstalled) {
      console.log('');
      await installDependencies();
      console.log('');
    }

    // 3. 启动开发服务器
    console.log('');
    startDevServer();

  } catch (error) {
    console.log('');
    log.error(error.message);
    process.exit(1);
  }
}

main().catch(error => {
  log.error('启动脚本运行失败: ' + error.message);
  process.exit(1);
});
