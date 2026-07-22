/**
 * GeoTiffTerrainProvider — 自定义 Cesium TerrainProvider
 *
 * 从内存中的 GeoTIFF 栅格数据直接提供地形高度，
 * 无需预生成 terrain tile 文件。
 *
 * 依赖：window.Cesium（Cesium 1.81+）
 *
 * 用法：
 *   var provider = new GeoTiffTerrainProvider({
 *     rasterData: band,       // Float32Array，GeoTIFF 第一个波段
 *     width: 3600,            // 栅格宽度（像素）
 *     height: 3600,           // 栅格高度（像素）
 *     bounds: { west: 103, east: 104, south: 30, north: 31 },
 *     minHeight: 396,
 *     maxHeight: 5195
 *   });
 *   viewer.scene.terrainProvider = provider;
 */
(function () {
  if (typeof window === 'undefined' || !window.Cesium) {
    console.warn('[GeoTiffTerrainProvider] Cesium 未加载，跳过注册');
    return;
  }

  var Cesium = window.Cesium;

  function GeoTiffTerrainProvider(options) {
    options = options || {};

    this._rasterData = options.rasterData;
    this._width = options.width || 3600;
    this._height = options.height || 3600;
    this._bounds = options.bounds || { west: -180, east: 180, south: -90, north: 90 };
    this._minHeight = options.minHeight != null ? options.minHeight : -9999;
    this._maxHeight = options.maxHeight != null ? options.maxHeight : 9999;
    this._minLevel = options.minLevel != null ? options.minLevel : 7; // ⭐ level 0-6 返回占位 tile，加快初始加载
    this._maxLevel = options.maxLevel != null ? options.maxLevel : 12; // ⭐ 限制最大细化级别

    this._tilingScheme = new Cesium.GeographicTilingScheme();
    this.ready = true;
    this.readyPromise = Promise.resolve(true);
    this.hasWaterMask = false;
    this.hasVertexNormals = false;
    this.errorEvent = new Cesium.Event();

    // 计算 level 0 几何误差（用于 LOD 切换）
    var tileCount0 = this._tilingScheme.getNumberOfXTilesAtLevel(0);
    this._levelZeroMaximumGeometricError =
      (this._tilingScheme.ellipsoid.maximumRadius * 2 * Math.PI * 0.25) / (65 * tileCount0);

    // 统计：记录 tile 请求
    this._tileRequestCount = 0;
    this._tileSuccessCount = 0;
    this._lastLogTime = Date.now();
  }

  Object.defineProperties(GeoTiffTerrainProvider.prototype, {
    tilingScheme: {
      get: function () { return this._tilingScheme; }
    }
  });

  /**
   * 判断 tile 是否与 DEM 范围有交集
   */
  GeoTiffTerrainProvider.prototype.getTileDataAvailable = function (x, y, level) {
    var rect = this._tilingScheme.tileXYToRectangle(x, y, level);
    var west = Cesium.Math.toDegrees(rect.west);
    var east = Cesium.Math.toDegrees(rect.east);
    var south = Cesium.Math.toDegrees(rect.south);
    var north = Cesium.Math.toDegrees(rect.north);

    // ⭐ 超过 maxLevel 停止细化
    if (level > this._maxLevel) return false;

    // 检查 tile 矩形与 DEM 范围是否有交集
    return west < this._bounds.east && east > this._bounds.west &&
           south < this._bounds.north && north > this._bounds.south;
  };

  /**
   * 请求 tile 的地形几何数据
   *
   * ⭐ 关键设计：对于 coarse tile（低级别），即使只有极少像素落在 DEM
   * 范围内，也必须返回有效的 HeightmapTerrainData（含 childTileMask），
   * 否则 Cesium 认为该区域无数据，永远不会细化到更高级别。
   */
  GeoTiffTerrainProvider.prototype.requestTileGeometry = function (x, y, level, request) {

    // 检查请求是否已取消
    if (request && request.cancelled) {
      return undefined;
    }

    if (!this.getTileDataAvailable(x, y, level)) {
      return undefined;
    }

    // ⭐ level < minLevel：返回占位 tile（零高度 + childTileMask），引导 Cesium 细化
    if (level < this._minLevel) {
      var stubHeights = new Int16Array(65 * 65);
      var stubChildMask = 0;
      for (var ci = 0; ci < 4; ci++) {
        var cx = x * 2 + (ci % 2);
        var cy = y * 2 + (Math.floor(ci / 2));
        if (this.getTileDataAvailable(cx, cy, level + 1)) {
          stubChildMask |= (1 << ci);
        }
      }
      var stubData = new Cesium.HeightmapTerrainData({
        buffer: stubHeights,
        width: 65, height: 65,
        childTileMask: stubChildMask,
        structure: { heightScale: 1.0, heightOffset: 0.0, elementsPerHeight: 1, stride: 65, elementMultiplier: 1, isBigEndian: false }
      });
      return Promise.resolve(stubData);
    }

    var self = this;
    var rect = this._tilingScheme.tileXYToRectangle(x, y, level);
    var west = Cesium.Math.toDegrees(rect.west);
    var east = Cesium.Math.toDegrees(rect.east);
    var south = Cesium.Math.toDegrees(rect.south);
    var north = Cesium.Math.toDegrees(rect.north);

    var gridSize = 65;
    var totalPixels = gridSize * gridSize;
    var heights = new Int16Array(totalPixels);
    var validCount = 0;

    for (var row = 0; row < gridSize; row++) {
      for (var col = 0; col < gridSize; col++) {
        // 计算该网格点的经纬度
        var lon = west + (col / (gridSize - 1)) * (east - west);
        var lat = south + (row / (gridSize - 1)) * (north - south);

        // 映射到 GeoTIFF 像素坐标
        var px = (lon - self._bounds.west) / (self._bounds.east - self._bounds.west) * (self._width - 1);
        var py = (self._bounds.north - lat) / (self._bounds.north - self._bounds.south) * (self._height - 1);

        // 双线性插值采样
        var h = self._sampleHeightBilinear(px, py);

        if (isFinite(h) && h > -9999) {
          validCount++;
          heights[row * gridSize + col] = Math.round(Math.max(-32768, Math.min(32767, h)));
        } else {
          // ⭐ NODATA 像素用 0（椭球面高度），不能用 _minHeight
          // 否则粗级别 tile 会把整个半球都抬高到 _minHeight，导致地形"飞到太空"
          heights[row * gridSize + col] = 0;
        }
      }
    }

    // ⭐ 计算 childTileMask — 必须在 validCount 判断之前！
    // 即使当前 tile 的有效像素极少，也必须通过 childTileMask 告诉
    // Cesium 哪些子 tile 有更多数据，否则细化链断裂，地形永远不出现。
    var childMask = 0;
    for (var childIdx = 0; childIdx < 4; childIdx++) {
      var childX = x * 2 + (childIdx % 2);
      var childY = y * 2 + (Math.floor(childIdx / 2));
      if (this.getTileDataAvailable(childX, childY, level + 1)) {
        childMask |= (1 << childIdx);
      }
    }

    // ⭐ Coarse tile 策略：即使有效像素占比极低，也要返回数据
    // 这样 Cesium 才能通过 childTileMask 继续细化到更高级别。
    // 没有可细化的子 tile 时（childMask === 0）才返回 undefined。
    if (validCount < totalPixels * 0.02 && childMask === 0) {
      // 当前 tile 几乎无数据 AND 没有任何子 tile 有数据 → 真正无数据区域
      return undefined;
    }

    try {
      var terrainData = new Cesium.HeightmapTerrainData({
        buffer: heights,
        width: gridSize,
        height: gridSize,
        childTileMask: childMask,
        structure: {
          heightScale: 1.0,
          heightOffset: 0.0,
          elementsPerHeight: 1,
          stride: gridSize,   // ⭐ 必须 = width(65)！Cesium 用 row*stride+col 索引
          elementMultiplier: 1,
          isBigEndian: false
        }
      });
      this._tileSuccessCount++;
      // 每 50 个 tile 或每 5 秒输出一次统计
      var now = Date.now();
      if (this._tileSuccessCount % 50 === 0 || (now - this._lastLogTime) > 5000) {
        console.log('[GeoTiffTerrainProvider] 📊 tile 统计: 成功=' + this._tileSuccessCount +
          ' level=' + level + ' childMask=' + childMask +
          ' (' + west.toFixed(4) + '°,' + south.toFixed(4) + '°)-(' +
          east.toFixed(4) + '°,' + north.toFixed(4) + '°) valid=' + validCount + '/' + totalPixels);
        this._lastLogTime = now;
      }
      return Promise.resolve(terrainData);
    } catch (e) {
      console.warn('[GeoTiffTerrainProvider] 创建 HeightmapTerrainData 失败:', e.message);
      return undefined;
    }
  };

  /**
   * 双线性插值：从 GeoTIFF 栅格采样高度
   *
   * ⭐ 边缘处理：当 px/py 落在栅格边界上时（如 px=width-1），
   * 钳制 x1/y1 到 width-1/height-1，使插值退化为单列/单行采样，
   * 避免错误地将有效边缘像素判为 NODATA。
   */
  GeoTiffTerrainProvider.prototype._sampleHeightBilinear = function (px, py) {
    var width = this._width;
    var height = this._height;
    var data = this._rasterData;

    // ⭐ 钳制浮点像素坐标到有效范围
    px = Math.max(0, Math.min(width - 1, px));
    py = Math.max(0, Math.min(height - 1, py));

    var x0 = Math.floor(px);
    var y0 = Math.floor(py);
    var x1 = Math.min(x0 + 1, width - 1);
    var y1 = Math.min(y0 + 1, height - 1);

    var fx = px - x0;
    var fy = py - y0;

    var v00 = data[y0 * width + x0];
    var v10 = data[y0 * width + x1];
    var v01 = data[y1 * width + x0];
    var v11 = data[y1 * width + x1];

    var NODATA = -9999;
    var valid00 = isFinite(v00) && v00 > NODATA;
    var valid10 = isFinite(v10) && v10 > NODATA;
    var valid01 = isFinite(v01) && v01 > NODATA;
    var valid11 = isFinite(v11) && v11 > NODATA;

    // 4 个角都无效 → 返回 NODATA
    if (!valid00 && !valid10 && !valid01 && !valid11) {
      return -99999;
    }

    // 用最近有效值填充无效角
    if (!valid00) v00 = valid10 ? v10 : (valid01 ? v01 : v11);
    if (!valid10) v10 = valid00 ? v00 : (valid11 ? v11 : v01);
    if (!valid01) v01 = valid00 ? v00 : (valid11 ? v11 : v10);
    if (!valid11) v11 = valid10 ? v10 : (valid01 ? v01 : v00);

    // 双线性插值
    var top = v00 * (1 - fx) + v10 * fx;
    var bottom = v01 * (1 - fx) + v11 * fx;
    return top * (1 - fy) + bottom * fy;
  };

  /**
   * 获取指定 level 的最大几何误差（LOD 切换阈值）
   * ⭐ 使用 Math.pow 替代 1<<level，避免 level≥31 时 32 位有符号整数溢出
   */
  GeoTiffTerrainProvider.prototype.getLevelMaximumGeometricError = function (level) {
    return this._levelZeroMaximumGeometricError / Math.pow(2, level);
  };

  // 注册到全局
  window.GeoTiffTerrainProvider = GeoTiffTerrainProvider;
  console.log('[GeoTiffTerrainProvider] ✅ 已注册 window.GeoTiffTerrainProvider');
})();
