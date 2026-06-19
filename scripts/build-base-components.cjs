/**
 * 构建 cesiumBase 基础组件脚本
 *
 * 功能：
 * - 将 cesiumBase/src/components 下的基础 Vue 组件打包成 mjs 格式
 * - 输出到 test 项目的 src/components/lib 目录
 * - 这些是其他面板组件依赖的基础组件
 *
 * 使用方式：
 * node scripts/build-base-components.cjs
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
  srcDir: 'src/components',
  // 输出目录 (相对于 test 项目)
  outDir: 'src/components/lib'
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

// 基础组件列表（按依赖顺序排列，基础组件在前）
const BASE_COMPONENTS = [
  'SfcBase',                      // 最基础的 SFC 组件
  'FunctionPanelUIBase',          // 面板 UI 基础组件（依赖 SfcBase）
  'JsonConfigPanelBase',          // JSON 配置面板基础组件（依赖 FunctionPanelUIBase）
  'CesiumToolbarButton',          // 工具栏按钮组件
  'CesiumToolbar',                // 工具栏组件（依赖 CesiumToolbarButton）
  'TestSfc'                       // 测试 SFC 组件
];

// 可选的大型组件（可能需要特殊处理）
const OPTIONAL_COMPONENTS = [
  'CesiumMain'                    // 主要的 Cesium 视图组件（很大，可能需要单独处理）
];

// ==================== 构建函数 ====================

/**
 * 构建单个 Vue 组件
 * @param {string} componentName - 组件名称
 * @param {string} outputPath - 输出文件名（可选）
 * @returns {Promise<Object>} 构建结果
 */
async function buildComponent(componentName, outputPath = null) {
  log(`\n📦 构建 ${componentName}...`, 'blue');

  const startTime = Date.now();

  try {
    // 确定输出文件名（将斜杠替换为下划线以避免目录问题）
    const outputFileName = outputPath || componentName.replace(/\//g, '/') + '.mjs';
    const outputSubDir = path.dirname(outputFileName);

    // 确保输出目录存在（包括子目录）
    const outDir = path.resolve(CONFIG.testRoot, CONFIG.outDir, outputSubDir);
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
          name: componentName.replace(/\//g, '_'), // 将斜杠替换为下划线作为全局变量名
          fileName: outputFileName,
          formats: ['es'] // 只生成 ES 模块
        },
        rollupOptions: {
          external: ['vue', 'cesium', 'three',
                    'three/examples/jsm/controls/OrbitControls',
                    'three/examples/jsm/loaders/GLTFLoader',
                    'three/examples/jsm/loaders/DRACOLoader',
                    'three/examples/jsm/loaders/PLYLoader',
                    '@popperjs/core',
                    'axios', 'bootstrap', 'bootstrap-icons'],
          output: {
            // 输出文件名
            entryFileNames: outputFileName
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
 * 拷贝 CSS 文件到 public/test-sfc 目录（已禁用）
 * CSS 文件现在和 .mjs 文件在同一目录，不需要单独拷贝
 * @returns {Object} 拷贝结果统计
 */
function copyCssFiles() {
  log('\n=== CSS 文件拷贝已禁用 ===\n', 'yellow');
  log('CSS 文件现在和 .mjs 文件在同一目录', 'cyan');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    details: [],
    skipped: true
  };

  return results;
}

/**
 * 批量构建所有组件
 * @returns {Promise<Object>} 构建结果统计
 */
async function buildAllComponents() {
  log('\n=== cesiumBase 基础组件批量构建 ===\n', 'blue');
  log(`待构建组件: ${BASE_COMPONENTS.join(', ')}`, 'cyan');

  const results = {
    total: BASE_COMPONENTS.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (const componentName of BASE_COMPONENTS) {
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
  log('🚀 开始构建 cesiumBase 基础组件...\n', 'blue');

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
    log('\n✅ 基础组件已成功构建，可以通过以下方式导入：', 'green');
    BASE_COMPONENTS.forEach(name => {
      if (results.details.find(r => r.component === name && r.success)) {
        log(`   import ${name} from '@componentsLib/${name}.mjs';`, 'cyan');
      }
    });
  }

  // 拷贝 CSS 文件到 public/test-sfc
  const cssResults = copyCssFiles();
  log(`\n📊 CSS 文件拷贝结果: 总计 ${cssResults.total}, 成功 ${cssResults.success}, 失败 ${cssResults.failed}`, 'cyan');

  // 返回退出码
  process.exit(results.failed > 0 || cssResults.failed > 0 ? 1 : 0);
}

// 错误处理
main().catch(error => {
  log(`\n❌ 构建过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
