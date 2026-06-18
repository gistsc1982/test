# CesiumMain 迁移到 Test 项目

## 📋 迁移概述

已成功将 `cesiumBase/src/components/CesiumMain.vue` 迁移到 `test/src/components/CesiumMainView.vue`，并将所有组件导入改为使用 `@cesiumBaseComponents` 别名。

## ✅ 完成的修改

### 1. 文件迁移
- **源文件**: `D:\GISBIM\cesiumBase\src\components\CesiumMain.vue`
- **目标文件**: `D:\GISBIM\test\src\components\CesiumMainView.vue`

### 2. 目录结构统一 (2025-06-18 更新)

为保持两个项目目录结构完全一致，已将 `test/src/views` 重命名为 `test/src/components`：

**迁移前：**
```
test/
└── src/
    └── views/          ❌ 不一致
        ├── CesiumMainView.vue
        ├── functions/
        └── utils/

cesiumBase/
└── src/
    └── components/     ✅ 标准
        ├── CesiumMain.vue
        ├── functions/
        └── utils/
```

**迁移后：**
```
test/
└── src/
    └── components/    ✅ 统一结构
        ├── CesiumMainView.vue
        ├── functions/
        └── utils/

cesiumBase/
└── src/
    └── components/    ✅ 标准结构
        ├── CesiumMain.vue
        ├── functions/
        └── utils/
```

### 3. 别名配置更新

所有别名已更新以反映新的目录结构和更清晰的命名：

| 旧别名 | 新别名 | 用途 |
|--------|--------|------|
| `@viewsUtils` | `@componentsUtils` | 本地工具类 |
| `@viewsFunctions` | `@componentsFunctions` | 本地功能面板配置 |
| `@cesiumBaseFunctions` | `@cesiumBaseComponentsFunctions` | cesiumBase 功能面板 |

**vite.config.js 别名配置：**
```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    // cesiumBase 别名
    '@cesiumBase': path.resolve(__dirname, '../cesiumBase/src'),
    '@cesiumBaseComponents': path.resolve(__dirname, '../cesiumBase/src/components'),
    '@cesiumBaseComponentsFunctions': path.resolve(__dirname, '../cesiumBase/src/components/functions'),
    // Cesium 别名
    'cesium': path.resolve(__dirname, './public/gis/Cesium'),
    // 本地工具文件别名
    '@componentsUtils': path.resolve(__dirname, './src/components/utils'),
    '@componentsFunctions': path.resolve(__dirname, './src/components/functions')
  },
}
```

### 4. 导入路径修改

**CesiumMainView.vue 中的导入：**

| 原路径 | 新路径 |
|--------|--------|
| `@viewsUtils/MultiInstancePanelConfigManager.js` | `@componentsUtils/MultiInstancePanelConfigManager.js` |
| `@viewsUtils/PanelSingletonManager.js` | `@componentsUtils/PanelSingletonManager.js` |
| `@viewsFunctions/FunctionPanelsConfigManager.js` | `@componentsFunctions/FunctionPanelsConfigManager.js` |
| `@viewsFunctions/functionPanels.config.json` | `@componentsFunctions/functionPanels.config.json` |

**路径解析优先级：**
- `.vue` 文件：使用 `@cesiumBaseComponentsFunctions/...` （从 cesiumBase 加载）
- 配置文件：使用 `@componentsFunctions/...` （从本地加载）
- 静态资源：使用 `/test-sfc/...` （从 public 加载）

### 5. 动态加载配置

```javascript
// 动态加载器配置
const FUNCTION_PANELS_DIR = '@componentsFunctions/';

// 导入逻辑：支持完整路径和别名
const importPath = panelConfig.file.startsWith('/') || panelConfig.file.startsWith('@')
  ? panelConfig.file
  : `${FUNCTION_PANELS_DIR}${panelConfig.file}`;
```

### 6. 路由配置更新

在 `test/src/router/index.js` 中更新了导入路径：

```javascript
// 修改前
import CesiumMainView from '@/views/CesiumMainView.vue'

// 修改后
import CesiumMainView from '@/components/CesiumMainView.vue'
```

### 7. 配置文件更新

`functionPanels.config.json` 中所有 `.vue` 文件路径已更新为使用 `@cesiumBaseComponentsFunctions` 别名：

```json
{
  "file": "@cesiumBaseComponentsFunctions/ObliqueHeightAdjustPanel.vue"
}
```

## 🚀 访问方式

### 方式 1: 通过导航菜单

启动项目后，点击导航栏中的 "🗺️ CesiumMain 功能" 链接。

### 方式 2: 直接访问 URL

```
http://localhost:5173/cesium-main
```

## 📦 包含的功能

CesiumMainView 包含以下完整功能：

1. **Cesium 3D 地图展示**
   - Cesium 容器
   - 地图比例显示
   - 坐标显示面板（Cesium + Three.js）
   - 屏幕中心点坐标

2. **双画布查看器**
   - dual-canvas-viewer 覆盖层容器
   - 鼠标事件处理
   - 相机同步

3. **工具栏系统**
   - CesiumToolbar 组件
   - 工具栏按钮管理
   - 面板配置管理

4. **功能面板系统**
   - 动态加载功能面板
   - 面板单例管理
   - 多实例面板支持

5. **高度控制**
   - 地板高度控制面板
   - 高度对齐模式选择
   - 圆柱体高度控制
   - 模型诊断和修复

6. **快捷键支持**
   - ↑ / ↓ : 调整高度（±1米）
   - Shift + ↑ / ↓ : 调整高度（±10米）
   - H : 切换面板显示

## 🔧 依赖说明

CesiumMainView 依赖以下 cesiumBase 组件：

- `CesiumToolbar.vue` - 工具栏组件
- `functionPanels.config.json` - 功能面板配置
- `FunctionPanelsConfigManager.js` - 面板配置管理器
- `MultiInstancePanelConfigManager.js` - 多实例面板配置管理器
- `PanelSingletonManager.js` - 面板单例管理器
- 功能面板组件（动态加载）

## 📝 使用示例

### 基本使用

```vue
<template>
  <router-view />
</template>

<script setup>
// 路由会自动加载 CesiumMainView
</script>
```

### 直接使用组件

```vue
<template>
  <CesiumMainView />
</template>

<script setup>
import CesiumMainView from '@/components/CesiumMainView.vue'
</script>
```

## ⚠️ 注意事项

### 1. Cesium 初始化

CesiumMainView 会自动初始化 Cesium，无需额外配置。确保：

- cesiumBase 项目存在于 `D:\GISBIM\cesiumBase`
- 已安装必要依赖（three, echarts, bootstrap 等）

### 2. 全局依赖

CesiumMainView 依赖全局对象：
- `window.THREE` - 由 load-three-globals.js 加载
- `window.cesium` - Cesium 核心库

### 3. 面板配置

功能面板的配置位于：
```
D:\GISBIM\test\src\components\functions\functionPanels.config.json
```

修改此文件可以启用/禁用功能面板。

### 4. 动态加载

功能面板使用动态导入，确保 Vite 配置允许访问父级目录：

```javascript
// vite.config.js
export default defineConfig({
  server: {
    fs: {
      allow: ['..']
    }
  }
})
```

### 5. 路径解析规则

- **Vue 组件**: 优先从 `@cesiumBaseComponentsFunctions` 加载（外部项目）
- **配置文件**: 从 `@componentsFunctions` 加载（本地项目）
- **静态资源**: 使用 `/test-sfc/...` 从 public 目录加载

## 🐛 故障排除

### 问题 1: 模块找不到

**症状**: `Cannot find module '@cesiumBaseComponentsFunctions/...'`

**解决方案**:
1. 确认 vite.config.js 包含正确的别名配置
2. 检查文件是否存在于 `D:\GISBIM\cesiumBase\src\components\functions\`
3. 重启开发服务器

### 问题 2: 本地模块找不到

**症状**: `Cannot find module '@componentsFunctions/...'`

**解决方案**:
1. 确认文件存在于 `D:\GISBIM\test\src\components\functions\`
2. 检查目录是否已从 `views` 重命名为 `components`
3. 清除缓存并重启

### 问题 3: 面板无法加载

**症状**: 功能面板显示 "面板组件未在配置中"

**解决方案**:
1. 检查 `functionPanels.config.json` 配置
2. 确认面板组件文件存在
3. 检查控制台错误信息

### 问题 4: Cesium 不显示

**症状**: 页面加载但 Cesium 地图不显示

**解决方案**:
1. 检查浏览器控制台错误
2. 确认 Cesium 资源已正确加载
3. 检查 WebGL 支持

## 📊 项目结构对比

### 迁移前

```
cesiumBase/
└── src/
    └── components/
        ├── CesiumMain.vue (使用相对路径)
        ├── CesiumToolbar.vue
        ├── functions/
        └── utils/

test/
└── src/
    └── views/              ❌ 结构不一致
        └── CesiumMainView.vue
```

### 迁移后

```
test/
└── src/
    └── components/         ✅ 统一结构
        ├── CesiumMainView.vue (使用别名引用 cesiumBase)
        ├── CesiumComponentsView.vue
        ├── GisView.vue
        ├── functions/          ✅ 与 cesiumBase 一致
        │   ├── functionPanels.config.json
        │   └── ...
        └── utils/              ✅ 与 cesiumBase 一致
            └── ...

cesiumBase/
└── src/
    └── components/          ✅ 标准结构
        ├── CesiumMain.vue
        ├── CesiumToolbar.vue
        ├── functions/
        └── utils/
```

## 🎯 下一步计划

1. ✅ 完成 CesiumMain 迁移
2. ✅ 统一项目目录结构 (views → components)
3. ✅ 更新别名配置为更清晰的命名
4. ⏳ 添加更多 Cesium 组件到 test 项目
5. ⏳ 优化组件加载性能
6. ⏳ 添加单元测试
7. ⏳ 完善文档和示例

---

**迁移完成时间**: 2025-06-18
**目录结构统一时间**: 2025-06-18
**迁移状态**: ✅ 完成
**文件大小**: 427.9KB
**导入组件数**: 5+
**功能面板数**: 动态加载
