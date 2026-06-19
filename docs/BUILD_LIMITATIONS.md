# 组件打包构建限制说明

## 已知限制和注意事项

### 1. 动态导入限制

**问题描述：**
`TestPanelModule` 组件的 `setContent` 方法支持字符串路径的动态导入功能：

```javascript
// 在原始源代码中
this.$refs.panel.setContent('ObliqueHeightAdjustPanel', options);
```

这个功能在打包后的 mjs 文件中**不可用**，因为：
- 动态导入路径 `../${component}` 在打包后无法正确解析
- 路径是相对于源代码位置，而非打包后的文件位置

**解决方案：**
在打包后的组件中，请使用组件对象而非字符串路径：

```javascript
// ✅ 正确用法（推荐）
import ObliqueHeightAdjustPanel from '@componentsFunctionsLib/ObliqueHeightAdjustPanel.mjs';
this.$refs.panel.setContent(ObliqueHeightAdjustPanel, options);

// ❌ 不支持（会报错）
this.$refs.panel.setContent('ObliqueHeightAdjustPanel', options);
```

### 2. 警告信息

构建过程中可能会看到以下警告：

```
[vite] warning: invalid import "../${e}". A file extension must be included in the static part of the import.
```

这个警告可以安全地忽略，因为：
1. 该功能在当前使用场景中没有被使用
2. 组件对象导入方式完全正常工作
3. 该功能仅为向后兼容而保留

### 3. 组件依赖

所有打包的组件都依赖于外部模块，不会被打包进组件文件：
- `vue` - Vue 3 框架
- `cesium` - Cesium GIS 库（如使用）
- `three` - Three.js 3D 库（如使用）
- 其他外部依赖

确保你的项目中已经安装了这些依赖。

### 4. 路径解析

打包后的组件使用 `@componentsFunctionsLib` 别名：

```javascript
// 根目录组件
import TestPanelModule from '@componentsFunctionsLib/TestPanelModule.mjs';

// examples 子目录组件
import MultiContentExample from '@componentsFunctionsLib/examples/MultiContentExample.mjs';
```

确保 `vite.config.js` 中已正确配置别名：

```javascript
'@componentsFunctionsLib': path.resolve(__dirname, './src/components/functions/lib')
```

### 5. 重新构建

修改 `cesiumBase` 项目中的组件后，需要重新构建：

```bash
# 构建所有组件
npm run build:all-panels

# 或单独构建
npm run build:base-components    # 基础组件
npm run build:root-components    # functions 根目录组件
npm run build:function-panels     # functions examples 组件
```

## 测试验证

打包后的组件已验证以下功能正常：
- ✅ 组件导入和使用
- ✅ Props 传递
- ✅ 事件监听
- ✅ 插槽内容
- ✅ 动态内容切换（使用组件对象方式）
- ✅ 样式加载

## 兼容性说明

- **Vue 版本**: 需要 Vue 3.x
- **Vite 版本**: 测试于 Vite 8.x
- **Node 版本**: 需要 Node.js 20.x 或更高

如有其他问题，请参考主文档 `BUILD_SYSTEM.md`。
