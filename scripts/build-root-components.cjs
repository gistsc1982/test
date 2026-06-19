/**
 * 构建根目录 function panels 组件脚本
 *
 * 功能：
 * - 专门构建 cesiumBase/src/components/functions 根目录下的 Vue 组件
 * - 输出到 test 项目的 src/components/functions/lib 目录
 *
 * 使用方式：
 * node scripts/build-root-components.cjs
 */

const { build } = require('vite');
const vue = require('@vitejs/plugin-vue');
const path = require('path');
const fs = require('fs');

// ==================== 配置 ====================

const CONFIG = {
  // cesiumBase 项目根目录
  cesiumBaseRoot: path.resolve(__dirname, '../../cesiumBase'),
  // test 项目根目录
  testRoot: path.resolve(__dirname, '..'),
  // 源目录 (相对于 cesiumBase)
  srcDir: 'src/components/functions',
  // 输出目录 (相对于 test 项目)
  outDir: 'src/components/functions/lib'
};

// ==================== 颜色输出 ====================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ==================== 需要构建的组件 ====================

// 根目录组件列表
const ROOT_COMPONENTS = [
  'TestPanelModule',
  'TestPanel',
  'ObliqueHeightAdjustPanel',
  'ObliquePhotographyPanel',
  'ObliquePhotographyPanelExample'
];

// ==================== 构建函数 ====================

/**
 * 构建单个 Vue 组件
 * @param {string} componentName - 组件名称
 * @returns {Promise<Object>} 构建结果
 */
async function buildComponent(componentName) {
  log(`\n📦 构建 ${componentName}...`, 'blue');

  const startTime = Date.now();

  try {
    // 确保输出目录存在
    const outDir = path.resolve(CONFIG.testRoot, CONFIG.outDir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    await build({
      plugins: [vue()],
      root: CONFIG.cesiumBaseRoot,
      build: {
        outDir: path.resolve(CONFIG.testRoot, CONFIG.outDir),
        emptyOutDir: false, // 不清空输出目录
        lib: {
          entry: path.resolve(CONFIG.cesiumBaseRoot, CONFIG.srcDir, `${componentName}.vue`),
          name: componentName,
          fileName: 'index.js', // 使用固定文件名，输出到组件目录
          formats: ['es'] // 只生成 ES 模块
        },
        rollupOptions: {
          external: ['vue', 'cesium', 'three',
                    'three/examples/jsm/controls/OrbitControls',
                    'three/examples/jsm/loaders/GLTFLoader',
                    'three/examples/jsm/loaders/DRACOLoader',
                    '@popperjs/core'],
          output: {
            // 输出到组件目录
            entryFileNames: `${componentName}.mjs`
          }
        },
        copyPublicDir: false,
        sourcemap: false
      },
      resolve: {
        alias: {
          'vue': path.resolve(CONFIG.cesiumBaseRoot, 'node_modules/vue'),
          '@cesiumBaseComponents': path.resolve(CONFIG.cesiumBaseRoot, 'src/components'),
          '@cesiumBaseComponentsFunctions': path.resolve(CONFIG.cesiumBaseRoot, 'src/components/functions')
        }
      },
      minify: false
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`   ✅ ${componentName} 构建成功 (${duration}s)`, 'green');
    return { success: true, component: componentName, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`   ❌ ${componentName} 构建失败: ${error.message}`, 'red');
    console.error(error);
    return { success: false, component: componentName, error: error.message };
  }
}

/**
 * 批量构建所有组件
 * @returns {Promise<Object>} 构建结果统计
 */
async function buildAllComponents() {
  log('\n=== 根目录 Function Panels 组件批量构建 ===\n', 'blue');
  log(`待构建组件: ${ROOT_COMPONENTS.join(', ')}`, 'cyan');

  const results = {
    total: ROOT_COMPONENTS.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (const componentName of ROOT_COMPONENTS) {
    const result = await buildComponent(componentName);
    results.details.push(result);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  return results;
}

// ==================== 主函数 ====================

async function main() {
  log('🚀 开始构建根目录 Function Panels 组件...\n', 'blue');

  // 执行构建
  const results = await buildAllComponents();

  // 输出结果统计
  log('\n=== 构建结果统计 ===', 'blue');
  log(`总计: ${results.total}`, 'cyan');
  log(`成功: ${results.success}`, 'green');
  if (results.failed > 0) {
    log(`失败: ${results.failed}`, 'red');
    log('\n失败的组件:', 'red');
    results.details
      .filter(r => !r.success)
      .forEach(r => log(`   - ${r.component}: ${r.error}`, 'red'));
  }

  // 输出文件位置
  if (results.success > 0) {
    log(`\n📁 输出目录: ${path.resolve(CONFIG.testRoot, CONFIG.outDir)}`, 'blue');
    log('\n✅ 组件已成功构建，可以通过以下方式导入：', 'green');
    ROOT_COMPONENTS.forEach(name => {
      log(`   import ${name} from '@componentsFunctionsLib/root/${name}.mjs';`, 'cyan');
    });
  }

  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 错误处理
main().catch(error => {
  log(`\n❌ 构建过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
