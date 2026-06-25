/**
 * 路径解析工具 - 用于动态导入中的路径别名解析
 *
 * Vite 的路径别名（resolve.alias）在静态导入中有效，但在动态 import() 中无效
 * 该工具提供运行时路径别名解析功能，确保动态导入能正确解析路径
 */

// ⭐ 路径别名映射 - 与 vite.config.js 中的 resolve.alias 配置保持一致
// 注意：这些相对路径是相对于 src/components/ 目录的
const PATH_ALIASES = {
  // CesiumBase 相关别名
  '@cesiumBase': '../../../cesiumBase/src',
  '@cesiumBaseComponents': '../../../cesiumBase/src/components',
  '@cesiumBaseComponentsFunctions': '../../../cesiumBase/src/components/functions',

  // 本地项目别名（相对于 src/components/ 目录）
  '@componentsUtils': './utils',
  '@componentsFunctions': './functions',
  // 打包后的组件别名（使用绝对路径格式）
  '@componentsLib': '/src/components/lib',
  '@componentsFunctionsLib': '/src/components/functions/lib',
  // 完整路径别名（从 src/ 目录开始）
  '@srcFunctions': '../functions'
};

/**
 * 解析路径别名 - 将别名转换为实际相对路径
 *
 * @param {string} importPath - 原始导入路径（可能包含别名）
 * @param {string} [basePath=''] - 基础路径（可选，默认为当前文件的相对路径）
 * @returns {string} 解析后的相对路径
 *
 * @example
 * // 在 src/components/CesiumMainView.vue 中使用：
 * resolvePathAlias('@cesiumBaseComponentsFunctions/TestPanel.vue')
 * // 返回: '../../../cesiumBase/src/components/functions/TestPanel.vue'
 *
 * // 在 src/components/functions/ 目录中使用：
 * resolvePathAlias('@componentsFunctions/TestPanel.vue', './functions/')
 * // 返回: './functions/TestPanel.vue'
 */
export function resolvePathAlias(importPath, basePath = '') {
  // 如果路径不以 @ 开头，直接返回
  if (!importPath.startsWith('@')) {
    return importPath;
  }

  // ⭐ 按别名长度降序排列，确保长别名（如 @componentsFunctionsLib）先于短别名（如 @componentsFunctions）匹配
  const sortedAliases = Object.entries(PATH_ALIASES).sort((a, b) => b[0].length - a[0].length);

  // 检查路径是否以别名开头
  for (const [alias, realPath] of sortedAliases) {
    if (importPath.startsWith(alias)) {
      // 替换别名为实际路径
      let resolvedPath = importPath.replace(alias, realPath);

      // 对于本地项目路径，使用绝对路径（从项目根目录 /src/ 开始）
      // Vite 的动态 import() 需要绝对路径或特殊格式的路径
      if (alias === '@componentsFunctions' || alias === '@componentsUtils') {
        // 这些是相对路径（./functions），需要转换为绝对路径
        // ./functions/test.vue -> /src/components/functions/test.vue
        resolvedPath = '/src/components/' + resolvedPath.replace(/^\.\//, '');
        return resolvedPath;
      }
      if (alias === '@componentsLib' || alias === '@componentsFunctionsLib') {
        // 这些已经是绝对路径格式，直接返回
        return resolvedPath;
      }

      return resolvedPath;
    }
  }

  // 如果没有匹配的别名，返回原始路径
  console.warn(`[PathResolver] 未知的路径别名: ${importPath}`);
  return importPath;
}

/**
 * 批量解析路径别名
 * @param {string[]} importPaths - 原始导入路径数组
 * @returns {string[]} 解析后的路径数组
 */
export function resolvePathAliases(importPaths) {
  return importPaths.map(path => resolvePathAlias(path));
}

/**
 * 注册新的路径别名（用于动态扩展别名映射）
 * @param {string} alias - 别名（必须以 @ 开头）
 * @param {string} realPath - 实际路径
 */
export function registerPathAlias(alias, realPath) {
  if (!alias.startsWith('@')) {
    console.warn('[PathResolver] 别名必须以 @ 开头');
    return;
  }

  PATH_ALIASES[alias] = realPath;
  console.log(`[PathResolver] 注册路径别名: ${alias} -> ${realPath}`);
}

/**
 * 获取所有已注册的路径别名
 * @returns {Object} 路径别名映射对象
 */
export function getPathAliases() {
  return { ...PATH_ALIASES };
}

export default {
  resolvePathAlias,
  resolvePathAliases,
  registerPathAlias,
  getPathAliases
};
