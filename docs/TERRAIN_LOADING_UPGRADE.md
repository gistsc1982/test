# test 项目 DEM 地形加载改造说明

## 改造背景

test 项目原本使用 `terrain_copernicus_glo30_layer.json` 加载地形，但存在问题。参考 ja-yjjg-dp 子项目的成功实现，我们对 test 项目进行了全面改造。

## 主要改造内容

### 1. 创建地形切换组合函数

**新建文件**: `src/composables/useTerrainSwitcher.js`

- 基于 ja-yjjg-dp 项目的成功实现
- 支持三种地形模式：
  - `local` — 吉安本地预生成瓦片（默认）
  - `ion` — Cesium World Terrain (Ion 全球地形)
  - `none` — 无地形
- 提供 `switchTerrain()` 方法进行地形切换
- 包含加载遮罩、label 隐藏等用户体验优化

### 2. 更新地形加载方法

**修改文件**: `src/components/functions/layerTreeManager/LayerTreeManager.vue`

#### 核心改造：
```javascript
// ❌ 旧方法 (test 项目原有)
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: terrainUrl,
  requestVertexNormals: true,
  requestWaterMask: false,
});

// ✅ 新方法 (参考 ja-yjjg-dp)
var terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
  tilesBaseUrl,
  {
    requestVertexNormals: true,
    requestWaterMask: false,
    heightmapTerrainQuality: 1.0
  }
);
```

### 3. 添加新的地形选项

在图层管理器中添加了两个地形选项：
- `local-terrain-cop30-tiles` — Copernicus 地形（原有）
- `local-terrain-jian-glo30-tiles` — 吉安地形（新增）

## 关键差异对比

| 项目 | 加载方法 | 配置文件 | 成功因素 |
|------|----------|----------|----------|
| ja-yjjg-dp | `CesiumTerrainProvider.fromUrl()` | `terrain_jian_glo30_layer.json` | ✅ 使用官方API，URL处理自动规范化 |
| test (旧) | `new CesiumTerrainProvider()` | `terrain_copernicus_glo30_layer.json` | ❌ 构造函数方式，URL处理问题 |
| test (新) | `CesiumTerrainProvider.fromUrl()` | `terrain_jian_glo30_layer.json` | ✅ 采用ja-yjjg-dp成功方案 |

## 使用方法

### 1. 在 Vue 组件中使用地形切换

```javascript
import { useTerrainSwitcher } from '@/composables/useTerrainSwitcher';

export default {
  setup() {
    const { currentMode, currentLabel, switchTerrain, modes } = useTerrainSwitcher();
    
    // 切换到本地地形
    await switchTerrain('local');
    
    return {
      currentMode,
      currentLabel,
      switchTerrain,
      modes
    };
  }
}
```

### 2. 在图层管理器中选择地形

在图层树中展开 "本地 DEM 高程数据" 文件夹，勾选：
- "本地DEM高程数据(Cesium Terrain - 吉安)" 加载吉安地区地形

## 地形数据说明

### 吉安地形数据
- **文件**: `public/data/dem/terrain_jian_glo30_layer.json`
- **范围**: 114°~115°E, 26°~28°N
- **格式**: quantized-mesh-1.0
- **分辨率**: 30m (GLO-30)
- **最大缩放级别**: 12

### 地形数据结构
```
public/data/dem/terrain/
├── jian_glo30/           # 吉安地形瓦片
│   ├── layer.json        # 地形配置
│   └── {z}/{x}/{y}.terrain  # 瓦片文件
└── copernicus_glo30/     # Copernicus 地形瓦片
    ├── layer.json
    └── {z}/{x}/{y}.terrain
```

## 技术优势

### fromUrl() 方法的优势：

1. **自动URL规范化**: 内部处理尾部斜杠等问题
2. **Promise支持**: 返回Promise，便于异步处理
3. **错误处理**: 更完善的错误处理机制
4. **官方推荐**: Cesium 官方推荐的使用方式
5. **兼容性好**: 与不同版本Cesium兼容性更好

### 地形切换优化：

1. **用户体验**: 加载遮罩显示进度
2. **渲染优化**: 隐藏label避免位置错误
3. **性能优化**: 缓存地形Provider实例
4. **范围提示**: 显示地形覆盖范围矩形
5. **相机适配**: 自动飞入地形范围

## 验证方法

1. 启动test项目
2. 打开图层管理器
3. 展开 "本地 DEM 高程数据" 文件夹
4. 勾选 "本地DEM高程数据(Cesium Terrain - 吉安)"
5. 观察控制台日志，应该显示：
   ```
   [LayerTreeManager] 🌐 CesiumTerrainProvider 已激活 (使用 fromUrl 方法)
   [LayerTreeManager] ✅ 本地 Terrain Tiles 加载成功
   ```
6. 检查地形是否正确显示，相机位置是否在吉安地区

## 故障排除

### 问题1: 地形加载失败
- 检查 `public/data/dem/terrain/jian_glo30/layer.json` 是否存在
- 检查瓦片文件是否完整
- 查看控制台错误信息

### 问题2: 地形显示黑屏
- 确认使用的是 `fromUrl()` 方法
- 检查URL路径是否正确
- 验证地形数据格式是否为 quantized-mesh-1.0

### 问题3: 相机位置不对
- 使用 `flyToLocalBounds()` 方法自动调整
- 手动设置相机到吉安地区 (114.5°E, 27°N)

## 后续优化建议

1. 添加更多地形覆盖区域
2. 实现地形预加载机制
3. 添加地形质量设置选项
4. 支持自定义地形样式
5. 添加地形导出功能

---

**改造完成日期**: 2026年8月27日  
**参考项目**: ja-yjjg-dp  
**改造人员**: Claude Code