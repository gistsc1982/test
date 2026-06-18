/**
 * CesiumBase 集成验证脚本
 *
 * 用于验证 test 项目是否正确配置了 cesiumBase 源码集成
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`)
};

// 路径配置
const TEST_DIR = path.resolve(__dirname);
const CESiumBASE_DIR = path.join(path.dirname(TEST_DIR), 'cesiumBase');
const VITE_CONFIG = path.join(TEST_DIR, 'vite.config.js');
const PACKAGE_JSON = path.join(TEST_DIR, 'package.json');
const MAIN_JS = path.join(TEST_DIR, 'src', 'main.js');
const ROUTER_INDEX = path.join(TEST_DIR, 'src', 'router', 'index.js');

// 检查项
const checks = [
  {
    name: 'cesiumBase 目录存在',
    check: () => fs.existsSync(CESiumBASE_DIR),
    critical: true
  },
  {
    name: 'cesiumBase src 目录存在',
    check: () => fs.existsSync(path.join(CESiumBASE_DIR, 'src')),
    critical: true
  },
  {
    name: 'cesiumBase components 目录存在',
    check: () => fs.existsSync(path.join(CESiumBASE_DIR, 'src', 'components')),
    critical: true
  },
  {
    name: 'FunctionPanelUIBase.vue 存在',
    check: () => fs.existsSync(path.join(CESiumBASE_DIR, 'src', 'components', 'FunctionPanelUIBase.vue')),
    critical: true
  },
  {
    name: 'CesiumToolbarButton.vue 存在',
    check: () => fs.existsSync(path.join(CESiumBASE_DIR, 'src', 'components', 'CesiumToolbarButton.vue')),
    critical: true
  },
  {
    name: 'vite.config.js 存在',
    check: () => fs.existsSync(VITE_CONFIG),
    critical: true
  },
  {
    name: 'vite.config.js 包含别名配置',
    check: () => {
      const content = fs.readFileSync(VITE_CONFIG, 'utf-8');
      return content.includes('@cesiumBase') && content.includes('@cesiumBaseComponents');
    },
    critical: true
  },
  {
    name: 'package.json 包含必要依赖',
    check: () => {
      const content = fs.readFileSync(PACKAGE_JSON, 'utf-8');
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return deps.bootstrap && deps['bootstrap-icons'] && deps.echarts;
    },
    critical: true
  },
  {
    name: 'main.js 引入 Bootstrap',
    check: () => {
      const content = fs.readFileSync(MAIN_JS, 'utf-8');
      return content.includes('bootstrap');
    },
    critical: false
  },
  {
    name: '路由配置包含 /components',
    check: () => {
      const content = fs.readFileSync(ROUTER_INDEX, 'utf-8');
      return content.includes('/components');
    },
    critical: true
  }
];

async function main() {
  console.log(colors.blue + '========================================');
  console.log('  CesiumBase 集成验证');
  console.log('========================================' + colors.reset);
  console.log('');

  log.info(`test 目录: ${TEST_DIR}`);
  log.info(`cesiumBase 目录: ${CESiumBASE_DIR}`);
  console.log('');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const check of checks) {
    try {
      const result = check.check();
      if (result) {
        log.success(`✓ ${check.name}`);
        passed++;
      } else {
        if (check.critical) {
          log.error(`✗ ${check.name}`);
          failed++;
        } else {
          log.warn(`⚠ ${check.name}`);
          warnings++;
        }
      }
    } catch (error) {
      log.error(`✗ ${check.name} - ${error.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(colors.blue + '========================================' + colors.reset);
  console.log('验证结果:');
  console.log(`  ${colors.green}✓ 通过: ${passed}${colors.reset}`);
  if (warnings > 0) {
    console.log(`  ${colors.yellow}⚠ 警告: ${warnings}${colors.reset}`);
  }
  if (failed > 0) {
    console.log(`  ${colors.red}✗ 失败: ${failed}${colors.reset}`);
  }
  console.log(colors.blue + '========================================' + colors.reset);
  console.log('');

  if (failed === 0) {
    log.success('🎉 所有关键检查通过！可以开始使用 cesiumBase 组件了。');
    console.log('');
    console.log('下一步操作：');
    console.log('  1. 安装依赖: npm install');
    console.log('  2. 启动开发服务器: npm run dev');
    console.log('  3. 访问组件展示页面: http://localhost:5173/components');
    process.exit(0);
  } else {
    log.error('❌ 有 ' + failed + ' 个关键检查失败，请修复后再试。');
    console.log('');
    console.log('常见问题：');
    console.log('  • 确保 cesiumBase 项目存在于 D:\\GISBIM\\cesiumBase');
    console.log('  • 检查 vite.config.js 中的别名配置');
    console.log('  • 运行 npm install 安装必要依赖');
    process.exit(1);
  }
}

main().catch(error => {
  log.error('验证脚本运行失败: ' + error.message);
  process.exit(1);
});
