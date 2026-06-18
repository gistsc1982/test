# CesiumMain 依赖文件迁移总结

## ✅ 已完成迁移

### 📁 目录结构

已创建以下目录结构：
```
D:\GISBIM\test\src\lib\cesium\
├── functions/           # 功能面板相关
│   ├── functionPanels.config.json
│   ├── FunctionPanelsConfigManager.js
│   └── PanelConfigManager.js
└── utils/               # 工具函数
    ├── MultiInstancePanelConfigManager.js
    └── PanelSingletonManager.js
```

### 📋 复制的文件列表

| 源文件 | 目标文件 | 文件大小 | 用途 |
|--------|----------|----------|------|
| `cesiumBase/src/components/functions/functionPanels.config.json` | `test/src/lib/cesium/functions/functionPanels.config.json` | 9.8KB | 功能面板配置 |
| `cesiumBase/src/components/functions/FunctionPanelsConfigManager.js` | `test/src/lib/cesium/functions/FunctionPanelsConfigManager.js` | 6.4KB | 面板配置管理器 |
| `cesiumBase/src/components/functions/PanelConfigManager.js` | `test/src/lib/cesium/functions/PanelConfigManager.js` | 10.7KB | 面板配置工具 |
| `cesiumBase/src/components/utils/MultiInstancePanelConfigManager.js` | `test/src/lib/cesium/utils/MultiInstancePanelConfigManager.js` | 20.6KB | 多实例面板管理 |
| `cesiumBase/src/components/utils/PanelSingletonManager.js` | `test/src/lib/cesium/utils/PanelSingletonManager.js` | 21.7KB | 面板单例管理 |

### 🔧 配置更新

#### 1. Vite 别名配置 (vite.config.js)

添加了本地依赖别名：

```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@cesiumBase': path.resolve(__dirname, '../cesiumBase/src'),
    '@cesiumBaseComponents': path.resolve(__dirname, '../cesiumBase/src/components'),
    'cesium': path.resolve(__dirname, '../cesiumBase/src/Source'),
    // ⭐ 本地 cesium 依赖别名
    '@cesiumLib': path.resolve(__dirname, './src/lib/cesium'),
    '@cesiumUtils': path.resolve(__dirname, './src/lib/cesium/utils'),
    '@cesiumFunctions': path.resolve(__dirname, './src/lib/cesium/functions')
  }
}
```

#### 2. CesiumMainView 导入路径更新

**更新前**（使用 cesiumBase 别名）：
```javascript
import functionPanelsConfig from '@cesiumBaseComponents/functions/functionPanels.config.json';
import '@cesiumBaseComponents/functions/FunctionPanelsConfigManager.js';
import { multiInstancePanelConfigManager } from '@cesiumBaseComponents/utils/MultiInstancePanelConfigManager.js';
import { panelSingletonManager } from '@cesiumBaseComponents/utils/PanelSingletonManager.js';

const FUNCTION_PANELS_DIR = '@cesiumBaseComponents/functions/';
```

**更新后**（使用本地别名）：
```javascript
import functionPanelsConfig from '@cesiumFunctions/functionPanels.config.json';
import '@cesiumFunctions/FunctionPanelsConfigManager.js';
import { multiInstancePanelConfigManager } from '@cesiumUtils/MultiInstancePanelConfigManager.js';
import { panelSingletonManager } from '@cesiumUtils/PanelSingletonManager.js';

const FUNCTION_PANELS_DIR = '@cesiumFunctions/';
```

### 📦 依赖关系

```
CesiumMainView.vue
├── @cesiumBaseComponents/CesiumToolbar.vue (cesiumBase 组件)
├── @cesiumFunctions/functionPanels.config.json (本地)
├── @cesiumFunctions/FunctionPanelsConfigManager.js (本地)
├── @cesiumUtils/MultiInstancePanelConfigManager.js (本地)
└── @cesiumUtils/PanelSingletonManager.js (本地)
```

### 🎯 功能说明

#### 1. functionPanels.config.json
功能面板配置文件，定义了可用的功能面板：
- TestPanel（测试面板）
- ObliquePhotographyPanel（倾斜摄影面板）
- ObliquePhotographyPanelExample（测试面板示例）

#### 2. FunctionPanelsConfigManager.js
功能面板配置管理器，提供：
- 读取面板配置
- 添加/删除面板
- 启用/禁用面板
- 显示/隐藏面板

#### 3. PanelConfigManager.js
面板配置工具，辅助配置管理。

#### 4. MultiInstancePanelConfigManager.js
多实例面板配置管理器，支持：
- 创建多个面板实例
- 管理实例状态
- 实例间通信

#### 5. PanelSingletonManager.js
面板单例管理器，确保：
- 面板只创建一个实例
- 统一的面板访问接口
- 防止重复创建

### ✅ 验证清单

- [x] 创建目录结构 `src/lib/cesium/functions` 和 `src/lib/cesium/utils`
- [x] 复制 JS 工具文件和配置文件
- [x] 添加 Vite 别名配置
- [x] 更新 CesiumMainView 导入路径
- [x] 验证文件依赖关系

### 🚀 使用方式

现在 CesiumMainView 可以：

1. **使用本地配置**：
   ```javascript
   import functionPanelsConfig from '@cesiumFunctions/functionPanels.config.json'
   ```

2. **使用本地工具**：
   ```javascript
   import { multiInstancePanelConfigManager } from '@cesiumUtils/MultiInstancePanelConfigManager.js'
   ```

3. **动态加载面板**：
   ```javascript
   const FUNCTION_PANELS_DIR = '@cesiumFunctions/'
   ```

### 📝 注意事项

1. **Vue 组件**：继续使用 `@cesiumBaseComponents` 别名引用 cesiumBase 的 Vue 组件
2. **JS 工具和配置**：使用本地的 `@cesiumLib/*` 系列别名
3. **相对路径**：JS 文件内部的相对路径导入不受影响

### 🔄 下一步

可以考虑迁移：
1. Cesium 核心配置文件
2. 其他工具函数
3. 样式文件
4. 静态资源

---

**迁移完成时间**: 2025-06-18
**迁移状态**: ✅ 完成
**复制文件数**: 5 个 JS/JSON 文件
**别名配置**: 新增 3 个本地别名
