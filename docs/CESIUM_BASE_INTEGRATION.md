# CesiumBase 组件集成指南

## 📋 概述

test 项目现已支持通过 Vue 路由直接访问 cesiumBase 项目的源码组件，不再需要依赖打包后的 iframe 模式。

## ✨ 新增功能

1. **直接导入 cesiumBase 组件** - 使用 Vite 别名直接导入 cesiumBase 源码
2. **组件展示页面** - 访问 `/components` 路由查看所有可用组件
3. **FunctionPanelUIBase 面板** - 可拖拽、可最小化的功能面板
4. **CesiumToolbarButton 按钮** - 工具栏按钮组件

## 🔧 配置说明

### 1. Vite 别名配置

在 `vite.config.js` 中已配置以下别名：

```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    // ⭐ cesiumBase 别名 - 允许直接导入 cesiumBase 源码
    '@cesiumBase': path.resolve(__dirname, '../cesiumBase/src'),
    '@cesiumBaseComponents': path.resolve(__dirname, '../cesiumBase/src/components'),
    // ⭐ Cesium 别名 - 指向 public/gis/Cesium 目录
    'cesium': path.resolve(__dirname, './public/gis/Cesium'),
    // ⭐ 本地工具文件别名（位于 views 目录）
    '@viewsUtils': path.resolve(__dirname, './src/views/utils'),
    '@viewsFunctions': path.resolve(__dirname, './src/views/functions')
  }
}
```

**别名说明**：
- `@cesiumBase` - 指向 cesiumBase 项目的 src 目录
- `@cesiumBaseComponents` - 指向 cesiumBase 的 components 目录（Vue 组件）
- `cesium` - 指向 test 项目的 Cesium 静态资源目录
- `@viewsUtils` - 指向 test 项目 views/utils 目录（工具函数）
- `@viewsFunctions` - 指向 test 项目 views/functions 目录（功能面板配置）

### 2. 依赖配置

新增的 npm 依赖：

```json
{
  "dependencies": {
    "@popperjs/core": "^2.11.0",
    "axios": "^1.16.1",
    "bootstrap": "^5.1.3",
    "bootstrap-icons": "^1.7.2",
    "echarts": "^5.2.2",
    "three": "^0.183.2"
  }
}
```

## 🚀 安装步骤

### 1. 安装依赖

```bash
cd D:\GISBIM\test
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问页面

- **组件展示页面**: http://localhost:5173/components
- **CesiumMain 功能页面**: http://localhost:5173/cesium-main
- **GIS iframe 模式**: http://localhost:5173/gis

## 📦 可用组件

### CesiumToolbarButton

工具栏按钮组件，支持图标、标签、状态指示和提示信息。

**Props:**
- `icon` (String, required) - 按钮图标（emoji 或 SVG）
- `label` (String) - 按钮标签
- `tooltip` (String) - Tooltip 提示文本
- `active` (Boolean) - 是否激活状态
- `disabled` (Boolean) - 是否禁用

**示例:**

```vue
<CesiumToolbarButton
  icon="🖥️"
  label="多实例"
  tooltip="创建 DualCanvasViewer 实例"
  :active="false"
  @click="handleClick"
/>
```

### FunctionPanelUIBase

功能面板基础组件，支持拖拽、最小化、关闭等功能。

**Props:**
- `title` (String) - 面板标题
- `title-icon` (String) - 标题图标
- `initial-position` (Object) - 初始位置 `{x, y}`
- `allow-minimize` (Boolean) - 是否允许最小化
- `enable-blur` (Boolean) - 是否启用模糊效果
- `close-on-escape` (Boolean) - 是否按 ESC 关闭

**Events:**
- `close` - 面板关闭时触发

**Slots:**
- `header` - 自定义头部
- `default` - 面板内容

**示例:**

```vue
<FunctionPanelUIBase
  title="功能面板"
  :initial-position="{ x: 400, y: 200 }"
  :allow-minimize="true"
  @close="handleClose"
>
  <template #default>
    <div>面板内容</div>
  </template>
</FunctionPanelUIBase>
```

### 其他可用组件

- `CesiumMain.vue` - Cesium 主组件（完整功能）
- `CesiumToolbar.vue` - 工具栏容器组件
- `JsonConfigPanelBase.vue` - JSON 配置面板
- `SfcBase.vue` - SFC 基础组件
- `TestSfc.vue` - 测试 SFC 组件

### CesiumMainView 功能页面

完整的 Cesium 功能页面，包含：

- **Cesium 3D 地图** - 完整的 Cesium Viewer 配置
- **坐标显示面板** - 实时显示鼠标位置和相机坐标
- **工具栏系统** - 可配置的工具栏按钮
- **功能面板系统** - 动态加载的功能面板
- **高度控制** - 地板高度和圆柱体高度调整
- **相机同步** - Cesium 和 Three.js 相机同步
- **快捷键支持** - 键盘快捷键操作

**访问方式**: `http://localhost:5173/cesium-main`

## 🎯 使用场景

### 场景 1: 添加新的工具栏按钮

```vue
<template>
  <div class="my-toolbar">
    <CesiumToolbarButton
      v-for="button in buttons"
      :key="button.id"
      :icon="button.icon"
      :label="button.label"
      :tooltip="button.tooltip"
      :active="button.active"
      @click="button.onClick"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CesiumToolbarButton from '@cesiumBaseComponents/CesiumToolbarButton.vue'

const buttons = ref([
  { id: 1, icon: '🔄', label: '刷新', tooltip: '刷新数据', active: false, onClick: () => {} },
  { id: 2, icon: '⚙️', label: '设置', tooltip: '打开设置', active: false, onClick: () => {} }
])
</script>
```

### 场景 2: 创建功能面板

```vue
<template>
  <button @click="showPanel = true">打开面板</button>

  <FunctionPanelUIBase
    v-if="showPanel"
    title="⚙️ 数据管理"
    :initial-position="{ x: 500, y: 150 }"
    @close="showPanel = false"
  >
    <template #default>
      <div class="panel-content">
        <!-- 面板内容 -->
      </div>
    </template>
  </FunctionPanelUIBase>
</template>

<script setup>
import { ref } from 'vue'
import FunctionPanelUIBase from '@cesiumBaseComponents/FunctionPanelUIBase.vue'

const showPanel = ref(false)
</script>
```

### 场景 3: 使用 CesiumMain 完整功能

```vue
<template>
  <router-view />
</template>

<script setup>
// 路由会自动加载 CesiumMainView
</script>
```

或直接访问 `http://localhost:5173/cesium-main` 查看完整的 Cesium 功能。

**CesiumMain 包含的功能**：
- Cesium 3D 地图查看器
- 实时坐标显示
- 工具栏按钮系统
- 动态功能面板
- 高度和相机控制
- 快捷键支持

## 🔍 项目结构

```
D:\GISBIM\
├── cesiumBase/              # CesiumBase 源码项目
│   └── src/
│       ├── components/      # Vue 组件
│       │   ├── CesiumToolbarButton.vue
│       │   ├── FunctionPanelUIBase.vue
│       │   ├── CesiumToolbar.vue
│       │   ├── CesiumMain.vue
│       │   ├── functions/   # 功能面板
│       │   └── utils/       # 工具函数
│       └── Source/          # Cesium 核心代码
│
└── test/                    # Test 项目（Vue 3 + Vite）
    ├── public/
    │   └── gis/
    │       └── Cesium/      # Cesium 静态资源（来自 cesiumBase 打包）
    │           ├── Cesium.js
    │           ├── Widgets/
    │           ├── Workers/
    │           └── Assets/
    ├── src/
    │   ├── views/
    │   │   ├── CesiumComponentsView.vue  # 组件展示页面
    │   │   ├── CesiumMainView.vue         # CesiumMain 功能（已迁移）
    │   │   ├── GisView.vue                # GIS iframe 模式
    │   │   ├── functions/                 # 功能面板配置（已迁移）
    │   │   │   ├── functionPanels.config.json
    │   │   │   ├── FunctionPanelsConfigManager.js
    │   │   │   ├── PanelConfigManager.js
    │   │   │   └── examples/
    │   │   └── utils/                      # 工具函数（已迁移）
    │   │       ├── MultiInstancePanelConfigManager.js
    │   │       └── PanelSingletonManager.js
    │   ├── router/
    │   │   └── index.js                    # 路由配置（含 /cesium-main 路由）
    │   ├── main.js                         # Vue 应用入口（Cesium 全局配置）
    │   └── App.vue                         # 应用入口（导航菜单）
    ├── vite.config.js                      # Vite 配置（含别名）
    └── package.json                        # 项目依赖
```

## 📝 注意事项

1. **cesiumBase 项目必须存在** - 确保在 `D:\GISBIM\cesiumBase` 目录下有 cesiumBase 项目
2. **依赖版本** - cesiumBase 使用 Vue 3.5.34，test 项目使用 Vue 3.5.32，版本兼容
3. **Cesium 静态资源** - Cesium 核心库位于 `public/gis/Cesium/`，通过 `update-gis` 脚本更新
4. **工具文件位置** - 功能面板配置和工具函数已迁移到 `src/views/` 目录
5. **全局属性访问** - Cesium 通过 `this.cesium` 或 `this.Cesium` 访问（在 Vue 组件中）

## 🐛 常见问题

### Q1: 找不到模块 '@cesiumBaseComponents/...'

**解决方案:**
1. 检查 `vite.config.js` 中的别名配置是否正确
2. 确认 cesiumBase 项目存在于 `../cesiumBase` 目录
3. 重启 Vite 开发服务器

### Q2: 组件样式丢失

**解决方案:**
1. 确保已安装 Bootstrap 依赖
2. 在 `main.js` 中引入 Bootstrap 样式：
   ```javascript
   import 'bootstrap/dist/css/bootstrap.min.css'
   import 'bootstrap-icons/font/bootstrap-icons.css'
   ```

### Q3: Vite 无法访问父级目录

**解决方案:**
检查 `vite.config.js` 中的 `server.fs.allow` 配置：
```javascript
server: {
  fs: {
    allow: ['..']
  }
}
```

## 🎨 自定义样式

组件样式继承自 cesiumBase 项目。如需自定义：

1. 在 test 项目中创建全局样式覆盖
2. 使用 CSS Modules 或 Scoped Styles
3. 通过 props 传递自定义样式类

## 📚 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Cesium 官方文档](https://cesium.com/docs/)

---

**最后更新**: 2025-06-18
**维护者**: GIS Team
**文档版本**: 2.0
**更新内容**:
- ✅ 添加 CesiumMain 功能页面
- ✅ 更新 Vite 别名配置（Cesium、本地工具文件）
- ✅ 添加 Cesium 全局属性配置
- ✅ 迁移功能面板配置和工具函数到 test 项目
- ✅ 更新项目结构说明
