 新增「本地DEM高程数据」图层 — GeoTIFF 转 Cesium Terrain                                                 │
     │                                                                                                         │
     │ 问题背景                                                                                                │
     │                                                                                                         │
     │ 现有 Copernicus GLO-30 DEM 图层使用 Cesium mesh（Primitive）方式渲染为 3D                               │
     │ 网格，显示效果良好。但用户需要真正的 Cesium 地形：通过 CesiumTerrainProvider + layer.json               │
     │ 加载，使影像图层能够贴合地形起伏。                                                                      │
     │                                                                                                         │
     │ 核心设计                                                                                                │
     │                                                                                                         │
     │ 将 copernicus_glo30.tif（3600×3600, 1°×1°, 四川 103-104°E/30-31°N）转换为 Cesium heightmap-1.0 格式的   │
     │ terrain tiles，生成 layer.json，通过 CesiumTerrainProvider 加载。                                       │
     │                                                                                                         │
     │ 涉及文件                                                                                                │
     │                                                                                                         │
     │ ┌────────────────────────────────────────────────────────────────┬───────────────────────────────────── │
     │ ───┐                                                                                                    │
     │ │                              文件                              │                  操作                │
     │   │                                                                                                     │
     │ ├────────────────────────────────────────────────────────────────┼───────────────────────────────────── │
     │ ───┤                                                                                                    │
     │ │ scripts/generate-terrain-tiles.js                              │ 新建 — 处理 GeoTIFF 生成 terrain     │
     │ tiles │                                                                                                 │
     │ ├────────────────────────────────────────────────────────────────┼───────────────────────────────────── │
     │ ───┤                                                                                                    │
     │ │ src/components/functions/layerTreeManager/LayerTreeManager.vue │ 修改 — 新增 local-terrain 图层类型   │
     │   │                                                                                                     │
     │ └────────────────────────────────────────────────────────────────┴───────────────────────────────────── │
     │ ───┘                                                                                                    │
     │                                                                                                         │
     │ 实现方案                                                                                                │
     │                                                                                                         │
     │ 1. 地形瓦片生成脚本 (scripts/generate-terrain-tiles.js)                                                 │
     │                                                                                                         │
     │ 输入: public/data/dem/copernicus_glo30.tif                                                              │
     │ 输出: public/data/dem/terrain/copernicus_glo30/ 目录，包含 layer.json + 多个 {z}/{x}/{y}.terrain 文件   │
     │                                                                                                         │
     │ 处理流程:                                                                                               │
     │ 1. 使用 geotiff npm 包（项目已有，见 node_modules/geotiff）读取 GeoTIFF                                 │
     │ 2. 提取地理范围：103-104°E, 30-31°N                                                                     │
     │ 3. 提取高程数据：Float32Array, 3600×3600, 396~5195m                                                     │
     │ 4. 生成 zoom 10-12 的 heightmap tiles（TMS / EPSG:4326）                                                │
     │ 5. 每个 tile: 65×65 像素，Int16 高度值（米），编码为 binary .terrain 文件                               │
     │ 6. 生成 layer.json（tilejson "2.1.0", format "heightmap-1.0"）                                          │
     │                                                                                                         │
     │ heightmap 编码公式:                                                                                     │
     │ heightValue = elevation * 5  // 精度 0.2m, 存储在 Int16                                                 │
     │ 注：标准 Cesium heightmap 使用 (R*256*256 + G*256 + B) / 256 - 32768，但二进制 .terrain 文件直接存储    │
     │ Int16 高度值数组。                                                                                      │
     │                                                                                                         │
     │ tile 覆盖计算（TMS GeographicTilingScheme）:                                                            │
     │ - zoom N 下 tile (x, y) 的地理范围:                                                                     │
     │   - lon: [x / 2^(N+1) * 360 - 180, (x+1) / 2^(N+1) * 360 - 180]                                         │
     │   - lat: [90 - (y+1) / 2^N * 180, 90 - y / 2^N * 180]                                                   │
     │ - 仅生成与 DEM 范围 (103-104°E, 30-31°N) 有交集的 tile                                                  │
     │                                                                                                         │
     │ 运行方式: node scripts/generate-terrain-tiles.js                                                        │
     │                                                                                                         │
     │ 2. 新增图层配置 (LayerTreeManager.vue)                                                                  │
     │                                                                                                         │
     │ 在 folder-local-dem 下新增一层，与现有 Copernicus GLO-30 DEM 并列:                                      │
     │                                                                                                         │
     │ {                                                                                                       │
     │   "id": "local-terrain-cop30",                                                                          │
     │   "name": "本地DEM高程数据(Cesium Terrain)",                                                            │
     │   "parentId": "folder-local-dem",                                                                       │
     │   "nodeType": "layer",                                                                                  │
     │   "url": "/data/dem/terrain/copernicus_glo30",                                                          │
     │   "sortOrder": 5,                                                                                       │
     │   "visible": 1,                                                                                         │
     │   "description": "Copernicus GLO-30 转为 Cesium Terrain，影像图层可贴合地形起伏",                       │
     │   "icon": "⛰️ "                                                                                          │
     │ }                                                                                                       │
     │                                                                                                         │
     │ 3. 新增 local-terrain 加载逻辑 (LayerTreeManager.vue)                                                   │
     │                                                                                                         │
     │ 类型检测 (detectLayerType):                                                                             │
     │ - URL 路径包含 /terrain/ 或指向 layer.json 目录 → 'local-terrain'                                       │
     │                                                                                                         │
     │ 加载逻辑 (loadCesiumLayer 新增 case 'local-terrain'):                                                   │
     │ case 'local-terrain': {                                                                                 │
     │   // 1. 保存当前 terrainProvider 用于卸载时恢复                                                         │
     │   this._previousTerrainProvider = viewer.scene.terrainProvider;                                         │
     │                                                                                                         │
     │   // 2. 创建 CesiumTerrainProvider 指向 terrain tiles 目录                                              │
     │   var terrainProvider = new Cesium.CesiumTerrainProvider({                                              │
     │     url: node.url,  // /data/dem/terrain/copernicus_glo30                                               │
     │     requestVertexNormals: true,                                                                         │
     │     requestWaterMask: false                                                                             │
     │   });                                                                                                   │
     │                                                                                                         │
     │   // 3. 等待 terrainProvider 就绪                                                                       │
     │   await terrainProvider.readyPromise;                                                                   │
     │                                                                                                         │
     │   // 4. 设置到 globe                                                                                    │
     │   viewer.scene.terrainProvider = terrainProvider;                                                       │
     │   viewer.scene.globe.depthTestAgainstTerrain = true;                                                    │
     │                                                                                                         │
     │   // 5. 记录到 _cesiumLayers                                                                            │
     │   this._cesiumLayers.set(node.id, {                                                                     │
     │     type: 'local-terrain',                                                                              │
     │     provider: terrainProvider,                                                                          │
     │   });                                                                                                   │
     │                                                                                                         │
     │   break;                                                                                                │
     │ }                                                                                                       │
     │                                                                                                         │
     │ 卸载逻辑 (unloadCesiumLayer):                                                                           │
     │ if (entry.type === 'local-terrain') {                                                                   │
     │   // 恢复为默认地形或之前的地形                                                                         │
     │   viewer.scene.terrainProvider = this._previousTerrainProvider                                          │
     │     || new Cesium.EllipsoidTerrainProvider();                                                           │
     │   viewer.scene.globe.depthTestAgainstTerrain = false;                                                   │
     │ }                                                                                                       │
     │                                                                                                         │
     │ Fly-to 逻辑: 利用已有的 _bounds 存储（第 5191-5204 行），无需额外改动。                                 │
     │                                                                                                         │
     │ 验证方法                                                                                                │
     │                                                                                                         │
     │ 1. 运行 node scripts/generate-terrain-tiles.js 生成 terrain tiles                                       │
     │ 2. 确认 public/data/dem/terrain/copernicus_glo30/layer.json 和 tiles 已生成                             │
     │ 3. 启动 dev server，在图层树中启用「本地DEM高程数据(Cesium Terrain)」                                   │
     │ 4. 相机飞到四川区域 (103.5°E, 30.5°N)                                                                   │
     │ 5. 添加一个影像图层（如 OSM），确认影像贴合地形起伏                                                     │
     │ 6. 关闭 terrain 图层，确认恢复为平滑椭球体               