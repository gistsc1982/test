# WCS 3D-Timeline + GeoTIFF 3D 加载方案

## 1. 测试数据集

### 新增图层：全球地表温度（时间序列）

```json
{
  "id": "wcs-rasdaman-avgtemp",
  "name": "rasdaman 全球地表温度(WCS 3D-Timeline)",
  "parentId": "folder-wcs",
  "nodeType": "layer",
  "url": "https://ows.rasdaman.org/rasdaman/ows",
  "sortOrder": 3,
  "visible": 1,
  "description": "rasdaman 公共 WCS 2.0.1 服务。Coverage=AvgLandTemp，185个时间切片(2000-2015)，全球地表温度数据。支持Timeline时间轴动画。",
  "icon": "🌡️",
  "centerLon": 0,
  "centerLat": 20,
  "centerHeight": 15000000,
  "wcsCoverageName": "AvgLandTemp",
  "wcsFormat": "image/tiff",
  "wcsVersion": "2.0.1",
  "wcsAlpha": 0.4,
  "wcsTimeAxis": "ansi",
  "wcsTimeSlice": "2000-02-01T00:00:00Z",
  "wcsColorRamp": true
}
```

**DescribeCoverage 关键信息：**
- 轴：`ansi`(时间), `Lat`, `Lon`
- 时间范围：2000-02-01 ~ 2015-06-01
- 空间范围：全球 (-180~180, -90~90)
- 网格：185 × 1800 × 3600

## 2. 实现计划

### 阶段 A：Timeline 时间轴支持（WCS 时间维）

| 任务 | 说明 |
|------|------|
| A1. 时间切片轮询 | 在 `loadCesiumLayer` 中检测 `wcsTimeAxis` 配置，自动提取可用时间切片列表 |
| A2. Timeline UI | 在图层节点上显示时间轴控件（播放/暂停/滑块），绑定 Cesium Clock |
| A3. 动态重载 | Timeline 时间变化时，自动重新请求对应时间切片的 GetCoverage |
| A4. 缓存策略 | 预加载相邻时间切片，避免拖动卡顿 |

### 阶段 B：GeoTIFF 3D 加载（高度图 → 3D 网格）

| 任务 | 说明 |
|------|------|
| B1. TIFF → 高度数组 | 复用现有 GeoTIFF 解码，提取单波段高程值 |
| B2. 3D 网格生成 | 根据分辨率创建 `Cesium.GeometryInstance` 网格，顶点 Z = 高度值 |
| B3. 色带纹理 | 将现有色带 Canvas 作为纹理贴到 3D 网格上 |
| B4. 3D 模式判断 | `wcsRenderMode: '2d' | '3d'` 配置字段，选择单瓦片叠加 vs 3D 网格 |

## 3. 建议实施顺序

### 第一步：添加 AvgLandTemp 测试图层 + Timeline UI（先 2D 验证）

1. 在 `LayerTreeManager.vue` 的预设数据中添加上述 JSON 配置
2. 扩展 WCS 加载代码：
   - 识别 `wcsTimeAxis` 配置
   - 从 DescribeCoverage 提取时间维度范围和可用切片
   - 提供时间滑块 UI 切换切片
3. 时间变化时重新调用 GetCoverage 更新影像层

### 第二步：GeoTIFF 3D 渲染（巴伐利亚 DSM 高程数据）

1. 在 `LayerTreeManager.vue` 添加 `_render3dGeoTiff(tiffData, bbox)` 方法
2. 生成 3D 网格：
   ```
   - 根据 TIFF 分辨率降采样（平衡性能）
   - 创建矩形顶点数组，Z = 高程值 × 高程缩放因子
   - 创建 Cesium GroundPrimitive 或 Primitive
   ```
3. 应用色带纹理：
   ```
   - 将 Canvas 色带图像裁剪/缩放到网格比例
   - 作为材质纹理应用到 3D 网格
   ```

### 第三步：合并 3D + Timeline（AvgLandTemp → 3D 温度球）

1. 时间轴切换 → 重新获取 TIFF → 重建 3D 网格
2. 添加高度缩放因子参数，控制 3D 视觉夸张度

---

## 4. 需要修改的文件

| 文件 | 修改内容 |
|------|----------|
| `LayerTreeManager.vue` | 新增预设节点、Timeline UI、3D 网格渲染、配置字段 `wcsRenderMode`/`wcsElevationScale` |
| `LayerTreeManager 配置` (SQLite) | 通过编辑表单新增 `wcsRenderMode` 和 `wcsElevationScale` 字段 |

---

## 5. 建议先做哪个？

如果优先验证 Timeline 功能 → 第一步（2D 时间序列）
如果优先验证 3D 高程渲染 → 第二步（巴伐利亚 DSM → 3D 网格）
