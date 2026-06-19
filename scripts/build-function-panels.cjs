/**
 * 构建 function panels 组件脚本
 *
 * 功能：
 * - 将 cesiumBase/src/components/functions 下的所有 Vue 组件打包成 mjs 格式
 * - 输出到 test 项目的 src/components/functions/lib 目录
 * - 支持在 test 项目中直接导入使用
 *
 * 使用方式：
 * node scripts/build-function-panels.js
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

// ==================== 扫描函数 ====================

/**
 * 递归扫描目录下所有 .vue 文件
 * @param {string} dir - 要扫描的目录
 * @param {Array} results - 收集结果的数组
 */
function scanDirectoryRecursively(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // 递归扫描子目录
      scanDirectoryRecursively(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 扫描 functions/examples 目录下所有 Vue 组件
 * @returns {Array} 发现的组件列表
 */
function discoverFunctionPanels() {
  const examplesDir = path.resolve(CONFIG.cesiumBaseRoot, CONFIG.srcDir, 'examples');

  if (!fs.existsSync(examplesDir)) {
    log(`⚠️ examples 目录不存在: ${examplesDir}`, 'yellow');
    return [];
  }

  log('🔍 扫描 functions/examples 目录...', 'yellow');

  // 递归扫描所有 .vue 文件
  const vueFiles = scanDirectoryRecursively(examplesDir);

  const discovered = [];

  for (const filePath of vueFiles) {
    // 计算相对于 src/components/functions/examples 的路径
    const relativePath = path.relative(path.resolve(CONFIG.cesiumBaseRoot, CONFIG.srcDir, 'examples'), filePath);
    const componentName = path.basename(filePath, '.vue');
    const subDir = path.dirname(relativePath).replace(/\\/g, '/'); // Windows 路径处理

    discovered.push({
      name: componentName,
      entry: `examples/${relativePath.replace(/\\/g, '/')}`, // 添加 examples/ 前缀
      subDir: subDir === '.' ? '' : subDir, // 如果是当前目录，使用空字符串
      relativePath: relativePath.replace(/\\/g, '/')
    });

    log(`   ✅ 发现 ${componentName} (${subDir || 'examples根目录'})`, 'green');
  }

  return discovered;
}

// ==================== 构建函数 ====================

/**
 * 构建单个 Vue 组件
 * @param {Object} component - 组件配置
 * @returns {Promise<void>}
 */
async function buildComponent(component) {
  log(`\n📦 构建 ${component.name}...`, 'blue');
  log(`   入口: ${component.entry}`, 'cyan');

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
        outDir: outDir,
        emptyOutDir: false, // 不清空输出目录
        lib: {
          entry: path.resolve(CONFIG.cesiumBaseRoot, CONFIG.srcDir, component.entry),
          name: component.name,
          fileName: (format) => {
            // examples 组件输出到 examples 子目录
            if (component.subDir) {
              return `examples/${component.subDir}/${component.name}.mjs`;
            }
            // examples 根目录组件输出到 examples 目录
            return `examples/${component.name}.mjs`;
          },
          formats: ['es'] // 只生成 ES 模块
        },
        rollupOptions: {
          external: ['vue', 'cesium', 'three',
                    'three/examples/jsm/controls/OrbitControls',
                    'three/examples/jsm/loaders/GLTFLoader',
                    'three/examples/jsm/loaders/DRACOLoader',
                    '@popperjs/core'],
          output: {
            // 配置入口文件名模式
            entryFileNames: (chunkInfo) => {
              // examples 组件输出到 examples 子目录
              if (component.subDir) {
                return `examples/${component.subDir}/${component.name}.mjs`;
              }
              // examples 根目录组件输出到 examples 目录
              return `examples/${component.name}.mjs`;
            },
            // 保持目录结构
            preserveModules: false,
            // 对于有子目录的组件，输出到对应子目录
            assetFileNames: '[name][extname]'
          }
        },
        // 排除不需要的资源
        copyPublicDir: false,
        // 不生成 source map（减少文件数量）
        sourcemap: false
      },
      resolve: {
        alias: {
          'vue': path.resolve(CONFIG.cesiumBaseRoot, 'node_modules/vue'),
          '@cesiumBaseComponents': path.resolve(CONFIG.cesiumBaseRoot, 'src/components'),
          '@cesiumBaseComponentsFunctions': path.resolve(CONFIG.cesiumBaseRoot, 'src/components/functions')
        }
      },
      // 禁用某些优化以提高构建速度
      minify: false
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`   ✅ ${component.name} 构建成功 (${duration}s)`, 'green');
    return { success: true, component: component.name, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`   ❌ ${component.name} 构建失败: ${error.message}`, 'red');
    console.error(error);
    return { success: false, component: component.name, error: error.message };
  }
}

/**
 * 批量构建所有组件
 * @param {Array} components - 要构建的组件列表
 * @returns {Promise<Object>} 构建结果统计
 */
async function buildAllComponents(components) {
  if (components.length === 0) {
    log('\n⚠️ 未发现任何 Vue 组件', 'yellow');
    return { total: 0, success: 0, failed: 0, details: [] };
  }

  log('\n=== Function Panels 组件批量构建 ===\n', 'blue');
  log(`待构建组件: ${components.map(c => c.name).join(', ')}`, 'cyan');

  const results = {
    total: components.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (const component of components) {
    const result = await buildComponent(component);
    results.details.push(result);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  return results;
}

/**
 * 生成组件列表文件
 * @param {Array} components - 组件列表
 */
function generateComponentsList(components) {
  if (components.length === 0) {
    log('\n⚠️ 没有组件可写入列表', 'yellow');
    return;
  }

  const listPath = path.resolve(CONFIG.testRoot, CONFIG.outDir, 'components.json');
  const listData = {
    generated: new Date().toISOString(),
    count: components.length,
    components: components.map(c => ({
      name: c.name,
      entry: c.entry,
      subDir: c.subDir,
      relativePath: c.relativePath,
      importPath: c.subDir
        ? `@componentsFunctionsLib/examples/${c.subDir}/${c.name}.mjs`
        : `@componentsFunctionsLib/examples/${c.name}.mjs`,
      file: c.subDir
        ? `examples/${c.subDir}/${c.name}.mjs`
        : `examples/${c.name}.mjs`
    }))
  };

  // 确保输出目录存在
  const outDir = path.resolve(CONFIG.testRoot, CONFIG.outDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(listPath, JSON.stringify(listData, null, 2), 'utf-8');
  log(`\n📝 组件列表已生成: ${listPath}`, 'cyan');
}

/**
 * 生成使用示例文件
 * @param {Array} components - 组件列表
 */
function generateUsageExamples(components) {
  if (components.length === 0) {
    log('\n⚠️ 没有组件可生成示例', 'yellow');
    return;
  }

  const examplesPath = path.resolve(CONFIG.testRoot, CONFIG.outDir, 'usage-examples.md');

  let content = '# Function Panels 组件使用示例\n\n';
  content += `生成时间: ${new Date().toISOString()}\n\n`;
  content += `## 组件列表\n\n`;
  content += `所有组件都可以通过 \`@componentsFunctionsLib\` 别名导入：\n\n`;
  content += `\`\`\`javascript\n`;
  content += `// 示例：导入根目录组件\n`;
  content += `import TestPanelModule from '@componentsFunctionsLib/TestPanelModule.mjs';\n\n`;
  content += `// 示例：导入 examples 目录下的组件\n`;
  content += `import MultiContentExample from '@componentsFunctionsLib/examples/MultiContentExample.mjs';\n`;
  content += `\`\`\`\n\n`;

  for (const component of components) {
    content += `### ${component.name}\n\n`;
    content += `**路径**: ${component.relativePath}\n\n`;
    content += `**导入**: \n`;
    content += `\`\`\`javascript\n`;
    const importPath = component.subDir
      ? `import ${component.name} from '@componentsFunctionsLib/examples/${component.subDir}/${component.name}.mjs';`
      : `import ${component.name} from '@componentsFunctionsLib/examples/${component.name}.mjs';`;
    content += `${importPath}\n`;
    content += `\`\`\`\n\n`;
    content += `---\n\n`;
  }

  fs.writeFileSync(examplesPath, content, 'utf-8');
  log(`📝 使用示例已生成: ${examplesPath}`, 'cyan');
}

// ==================== 主函数 ====================

async function main() {
  log('🚀 开始构建 Function Panels 组件...\n', 'blue');

  // 扫描 components
  const componentsToBuild = discoverFunctionPanels();

  if (componentsToBuild.length === 0) {
    log('\n⚠️ 未发现任何 Vue 组件', 'yellow');
    return;
  }

  log(`\n✅ 发现 ${componentsToBuild.length} 个组件:`, 'green');

  // 执行构建
  const results = await buildAllComponents(componentsToBuild);

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

  // 生成辅助文件
  if (results.success > 0) {
    const successfulComponents = results.details
      .filter(r => r.success)
      .map(r => componentsToBuild.find(c => c.name === r.component));

    generateComponentsList(successfulComponents);
    generateUsageExamples(successfulComponents);
  }

  // 输出文件位置
  log(`\n📁 输出目录: ${path.resolve(CONFIG.testRoot, CONFIG.outDir)}`, 'blue');

  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 错误处理
main().catch(error => {
  log(`\n❌ 构建过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
