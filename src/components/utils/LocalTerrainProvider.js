/**
 * LocalTerrainProvider — 从预生成的 heightmap-1.0 terrain tiles 加载地形
 *
 * 关键设计：requestTileGeometry 始终同步返回（HeightmapTerrainData 或 undefined）。
 * 瓦片按需异步 fetch 并缓存，后续请求直接命中缓存。
 * 不返回 Promise，避免 Cesium 异步 terrain 管道的不稳定性。
 *
 * 用法：
 *   var provider = new LocalTerrainProvider({
 *     baseUrl: '/data/dem/terrain/copernicus_glo30',
 *     bounds: { west: 103, east: 104, south: 30, north: 31 }
 *   });
 *   viewer.scene.terrainProvider = provider;
 */
(function () {
  if (typeof window === 'undefined' || !window.Cesium) {
    console.warn('[LocalTerrainProvider] Cesium 未加载，跳过注册');
    return;
  }

  var Cesium = window.Cesium;

  function LocalTerrainProvider(options) {
    options = options || {};

    this._baseUrl = options.baseUrl || '';
    this._bounds = options.bounds || { west: -180, east: 180, south: -90, north: 90 };
    this._minLevel = options.minLevel != null ? options.minLevel : 2;
    this._maxLevel = options.maxLevel != null ? options.maxLevel : 12;
    this._gridSize = 65;

    // 缓存：[level/x/y] → HeightmapTerrainData (同步)
    this._tileCache = {};
    // 正在加载中的 tile keys（防止重复 fetch）
    this._loadingTiles = {};
    this._cacheMaxSize = options.cacheMaxSize || 300;

    this._tilingScheme = new Cesium.GeographicTilingScheme();
    this.ready = true;
    this.readyPromise = Promise.resolve(true);
    this.hasWaterMask = false;
    this.hasVertexNormals = false;
    this.errorEvent = new Cesium.Event();

    var tileCount0 = this._tilingScheme.getNumberOfXTilesAtLevel(0);
    this._levelZeroMaximumGeometricError =
      (this._tilingScheme.ellipsoid.maximumRadius * 2 * Math.PI * 0.25) / (65 * tileCount0);

    this._tileRequestCount = 0;
    this._tileSuccessCount = 0;
    this._lastLogTime = Date.now();
    this._version = 0;  // 每次数据更新后递增，触发 Cesium 重新渲染
  }

  Object.defineProperties(LocalTerrainProvider.prototype, {
    tilingScheme: {
      get: function () { return this._tilingScheme; }
    }
  });

  /**
   * tile 的缓存 key
   */
  function cacheKey(x, y, level) {
    return level + '/' + x + '/' + y;
  }

  /**
   * 判断 tile 是否与 DEM 范围有交集
   */
  LocalTerrainProvider.prototype.getTileDataAvailable = function (x, y, level) {
    if (level > this._maxLevel) return false;

    var rect = this._tilingScheme.tileXYToRectangle(x, y, level);
    var west = Cesium.Math.toDegrees(rect.west);
    var east = Cesium.Math.toDegrees(rect.east);
    var south = Cesium.Math.toDegrees(rect.south);
    var north = Cesium.Math.toDegrees(rect.north);

    return west < this._bounds.east && east > this._bounds.west &&
           south < this._bounds.north && north > this._bounds.south;
  };

  /**
   * 创建 HeightmapTerrainData（与 GeoTiffTerrainProvider 相同模式）
   * heights 存储的是 raw meters（非 elevation*5）
   */
  function makeTerrainData(self, x, y, level, heights) {
    // childTileMask
    var childMask = 0;
    for (var childIdx = 0; childIdx < 4; childIdx++) {
      var childX = x * 2 + (childIdx % 2);
      var childY = y * 2 + (Math.floor(childIdx / 2));
      if (self.getTileDataAvailable(childX, childY, level + 1)) {
        childMask |= (1 << childIdx);
      }
    }

    return new Cesium.HeightmapTerrainData({
      buffer: heights,
      width: self._gridSize,
      height: self._gridSize,
      childTileMask: childMask,
      structure: {
        heightScale: 1.0,
        heightOffset: 0.0,
        elementsPerHeight: 1,
        stride: self._gridSize,
        elementMultiplier: 1,
        isBigEndian: false
      }
    });
  }

  /**
   * 构建占位 tile（全零 = 海平面，引导 Cesium 细化到下一级）
   */
  function makeStubTile(self, x, y, level) {
    var stub = new Int16Array(self._gridSize * self._gridSize);
    return makeTerrainData(self, x, y, level, stub);
  }

  /**
   * 将 heightmap-1.0 Int16LE 数组解码为 raw meters
   * 预生成瓦片编码: value = elevation * 5 → elevation = value / 5
   */
  function decodeHeights(rawBuffer, gridSize) {
    var raw = new Int16Array(rawBuffer, 0, gridSize * gridSize);
    var heights = new Int16Array(gridSize * gridSize);
    for (var i = 0; i < heights.length; i++) {
      var val = Math.round(raw[i] / 5);  // elevation = stored_value / 5
      heights[i] = val;
    }
    return heights;
  }

  /**
   * 异步预加载 tile（返回后存储到缓存，但不阻塞当前帧）
   */
  function prefetchTile(self, x, y, level) {
    var key = cacheKey(x, y, level);
    if (self._tileCache[key] || self._loadingTiles[key]) return;

    var url = self._baseUrl + '/' + level + '/' + x + '/' + y + '.terrain';
    self._loadingTiles[key] = true;
    self._tileRequestCount++;

    fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.arrayBuffer();
      })
      .then(function (buf) {
        if (buf.byteLength < self._gridSize * self._gridSize * 2) {
          console.warn('[LocalTerrainProvider] ⚠️ 数据不足: ' + key);
          return;
        }
        var heights = decodeHeights(buf, self._gridSize);
        var valid = 0;
        for (var i = 0; i < heights.length; i++) { if (heights[i] !== 0) valid++; }
        if (valid < heights.length * 0.02) return;

        self._tileCache[key] = makeTerrainData(self, x, y, level, heights);
        self._tileSuccessCount++;
        self._version++;

        // 缓存淘汰
        var keys = Object.keys(self._tileCache);
        while (keys.length > self._cacheMaxSize) {
          delete self._tileCache[keys[0]];
          keys.shift();
        }

        var now = Date.now();
        if (self._tileSuccessCount % 50 === 0 || (now - self._lastLogTime) > 5000) {
          console.log('[LocalTerrainProvider] 📊 cache=' + keys.length +
            ' level=' + level + ' valid=' + valid + '/' + heights.length);
          self._lastLogTime = now;
        }
      })
      .catch(function (e) {
        console.warn('[LocalTerrainProvider] ⚠️ fetch 失败: ' + key + ' - ' + e.message);
      })
      .finally(function () {
        delete self._loadingTiles[key];
      });
  }

  /**
   * 请求 tile — 始终保持同步返回！
   * 如果缓存命中 → 返回 HeightmapTerrainData
   * 如果缓存未命中 → 触发异步 prefetch + 返回 undefined（Cesium 本帧用椭球体补齐）
   */
  LocalTerrainProvider.prototype.requestTileGeometry = function (x, y, level, request) {
    if (request && request.cancelled) return undefined;
    if (!this.getTileDataAvailable(x, y, level)) return undefined;

    var key = cacheKey(x, y, level);

    // 缓存命中 → 同步返回
    if (this._tileCache[key]) {
      return this._tileCache[key];
    }

    // 粗级别 (< minLevel)：无 .terrain 文件，直接生成占位 tile
    if (level < this._minLevel) {
      var stub = makeStubTile(this, x, y, level);
      this._tileCache[key] = stub;
      return stub;
    }

    // 细级别但未缓存 → 触发异步加载，本帧返回 undefined
    prefetchTile(this, x, y, level);
    return undefined;
  };

  LocalTerrainProvider.prototype.getLevelMaximumGeometricError = function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

  window.LocalTerrainProvider = LocalTerrainProvider;
  console.log('[LocalTerrainProvider] ✅ 已注册');
})();
