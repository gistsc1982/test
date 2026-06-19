# 组件打包构建系统说明

## 概述

本项目使用了一个组件打包构建系统，将 `cesiumBase` 项目中的 Vue 组件打包成 mjs 格式，以便在 `test` 项目中使用。

## 目录结构

```
src/components/
├── lib/                          # 基础组件打包输出目录
│   ├── SfcBase.mjs
│   ├── FunctionPanelUIBase.mjs
│   ├── JsonConfigPanelBase.mjs
│   ├── CesiumToolbarButton.mjs
│   ├── CesiumToolbar.mjs
│   └── TestSfc.mjs
└── functions/
    ├── lib/                      # 函数面板组件打包输出目录
    │   ├── TestPanelModule.mjs   # 根目录组件（直接在 lib/）
    │   ├── TestPanel.mjs
    │   ├── ObliqueHeightAdjustPanel.mjs
    │   ├── ObliquePhotographyPanel.mjs
    │   ├── ObliquePhotographyPanelExample.mjs
    │   ├── examples/             # examples 子目录组件
    │   │   ├── MultiContentExample.mjs
    │   │   ├── SetContentExample.mjs
    │   │   ├── SetContentIifeExampleContent.mjs
    │   │   ├── SetContentMjsExampleContent.mjs
    │   │   └── SlotExample.mjs
    │   ├── components.json      # 组件列表元数据
    │   ├── usage-examples.md    # 使用示例文档
    │   └── cesiumBase.css      # 共享样式文件
    └── examples/                 # 本地示例文件（使用 mjs 导入）
        ├── MultiContentExample.vue
        ├── SlotExample.vue
        └── SetContentExample.vue
```

## 构建脚本

### 1. 基础组件构建

```bash
npm run build:base-components
```

构建 `cesiumBase/src/components` 目录下的基础组件：
- SfcBase
- FunctionPanelUIBase
- JsonConfigPanelBase
- CesiumToolbarButton
- CesiumToolbar
- TestSfc

### 2. 函数面板组件构建

```bash
npm run build:function-panels
```

构建 `cesiumBase/src/components/functions` 目录下的组件（包括子目录）：
- examples/* 子目录组件

### 3. 根目录组件构建

```bash
npm run build:root-components
```

构建 `cesiumBase/src/components/functions` 根目录下的组件：
- TestPanelModule
- TestPanel
- ObliqueHeightAdjustPanel
- ObliquePhotographyPanel
- ObliquePhotographyPanelExample

### 4. 全量构建

```bash
npm run build:all-panels
```

依次执行上述所有构建过程。

## 导入方式

### 基础组件

```javascript
import FunctionPanelUIBase from '@componentsLib/FunctionPanelUIBase.mjs';
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import CesiumToolbar from '@componentsLib/CesiumToolbar.mjs';
```

### 函数面板组件

```javascript
// 根目录组件（直接在 lib 目录）
import TestPanelModule from '@componentsFunctionsLib/TestPanelModule.mjs';
import ObliqueHeightAdjustPanel from '@componentsFunctionsLib/ObliqueHeightAdjustPanel.mjs';

// examples 子目录组件
import MultiContentExample from '@componentsFunctionsLib/examples/MultiContentExample.mjs';
import SlotExample from '@componentsFunctionsLib/examples/SlotExample.mjs';
```

## 别名配置

在 `vite.config.js` 中配置的别名：

```javascript
'@componentsLib': path.resolve(__dirname, './src/components/lib'),
'@componentsFunctionsLib': path.resolve(__dirname, './src/components/functions/lib')
```

这些别名指向打包后的组件目录：
- `@componentsLib` → `src/components/lib/`
- `@componentsFunctionsLib` → `src/components/functions/lib/`

## 使用示例

### 在 Vue 组件中使用

```vue
<template>
  <TestPanelModule title="示例面板">
    <!-- 内容 -->
  </TestPanelModule>
</template>

<script>
import TestPanelModule from '@componentsFunctionsLib/TestPanelModule.mjs';

export default {
  components: {
    TestPanelModule
  }
}
</script>
```

### 动态导入

```javascript
// 在需要时动态导入
const TestPanelModule = () => import('@componentsFunctionsLib/TestPanelModule.mjs');
```

## 优势

1. **模块化**：每个组件都是独立的 mjs 模块
2. **类型支持**：保留完整的 Vue 组件功能
3. **依赖管理**：自动处理组件间的依赖关系
4. **按需加载**：支持动态导入和代码分割
5. **开发便利**：不需要复制源文件，直接使用打包后的组件

## 注意事项

1. **重新构建**：修改 `cesiumBase` 中的组件后，需要重新运行构建脚本
2. **依赖顺序**：基础组件必须在函数面板组件之前构建
3. **路径别名**：确保 `vite.config.js` 中的别名配置正确
4. **外部依赖**：构建时将 vue、cesium、three 等标记为外部依赖，不会打包进组件

## 维护

当需要添加新组件到构建系统时：

1. 对于基础组件：在 `scripts/build-base-components.cjs` 的 `BASE_COMPONENTS` 数组中添加
2. 对于函数面板根目录组件：在 `scripts/build-root-components.cjs` 的 `ROOT_COMPONENTS` 数组中添加
3. 对于 examples 子目录组件：自动发现，无需手动配置

然后运行相应的构建脚本即可。
