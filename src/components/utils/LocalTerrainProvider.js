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
        heightScale: 1.0 / 5.0,
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
  function rawHeightsFromBuffer(rawBuffer, gridSize) {
    return new Int16Array(rawBuffer, 0, gridSize * gridSize);
  }

  /**
   * 异步加载 tile 文件，返回 Promise<HeightmapTerrainData>
   * 加载后缓存，后续请求命中缓存直接同步返回
   */
  function loadTileAsync(self, x, y, level, key) {
    // 如果已有正在进行的加载，共享同一个 Promise
    if (self._loadingTiles[key]) {
      return self._loadingTiles[key];
    }

    var url = self._baseUrl + '/' + level + '/' + x + '/' + y + '.terrain';
    self._tileRequestCount++;

    var promise = fetch(url)
      .then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.arrayBuffer();
      })
      .then(function (buf) {
        if (buf.byteLength < self._gridSize * self._gridSize * 2) {
          console.warn('[LocalTerrainProvider] ⚠️ 数据不足: ' + key);
          return undefined;
        }
        var heights = rawHeightsFromBuffer(buf, self._gridSize);

        // 🔍 诊断：计算实际高程范围（解码后 ÷5）
        var hMin = Infinity, hMax = -Infinity, hNonZero = 0;
        for (var hi = 0; hi < heights.length; hi++) {
          var hv = heights[hi];
          if (hv !== 0) { hNonZero++; if (hv < hMin) hMin = hv; if (hv > hMax) hMax = hv; }
        }

        var td = makeTerrainData(self, x, y, level, heights);
        self._tileCache[key] = td;
        self._tileSuccessCount++;
        self._version++;

        if (hNonZero > 0 && (self._tileSuccessCount <= 3 || self._tileSuccessCount % 20 === 0)) {
          console.log('[LocalTerrainProvider] 🔍 tile ' + key +
            ' 非零=' + hNonZero + '/' + heights.length +
            ' 高程=' + (hMin/5).toFixed(0) + '~' + (hMax/5).toFixed(0) + 'm');
        }

        // 缓存淘汰
        var keys = Object.keys(self._tileCache);
        while (keys.length > self._cacheMaxSize) {
          delete self._tileCache[keys[0]];
          keys.shift();
        }

        var now = Date.now();
        if (self._tileSuccessCount % 50 === 0 || (now - self._lastLogTime) > 5000) {
          console.log('[LocalTerrainProvider] 📊 cache=' + keys.length +
            ' level=' + level);
          self._lastLogTime = now;
        }

        return td;
      })
      .catch(function (e) {
        console.warn('[LocalTerrainProvider] ⚠️ fetch 失败: ' + key + ' - ' + e.message);
        return undefined;
      })
      .finally(function () {
        delete self._loadingTiles[key];
      });

    self._loadingTiles[key] = promise;
    return promise;
  }

  // 挂载到原型
  LocalTerrainProvider.prototype._loadTileAsync = function (x, y, level, key) {
    return loadTileAsync(this, x, y, level, key);
  };

  // 保留旧 prefetchTile 供外部需要时使用（内部已改用 Promise）

  /**
   * 请求 tile — 返回 HeightmapTerrainData、Promise 或 undefined
   * 缓存命中 → 同步返回 HeightmapTerrainData
   * 未命中 → 返回 Promise，Cesium 等待异步加载完成后渲染
   */
  LocalTerrainProvider.prototype.requestTileGeometry = function (x, y, level, request) {
    if (request && request.cancelled) return undefined;
    if (!this.getTileDataAvailable(x, y, level)) return undefined;

    var key = cacheKey(x, y, level);

    // 缓存命中 → Promise 返回（与 GeoTiffTerrainProvider 一致，避免 Cesium 1.97 四叉树 bug）
    if (this._tileCache[key]) {
      return Promise.resolve(this._tileCache[key]);
    }

    // 粗级别 (< minLevel)：无 .terrain 文件，直接生成占位 tile
    if (level < this._minLevel) {
      var stub = makeStubTile(this, x, y, level);
      this._tileCache[key] = stub;
      return Promise.resolve(stub);
    }

    // 细级别但未缓存 → 异步 fetch，返回 Promise
    // ⭐ Cesium 通过 Promise 机制获知瓦片就绪，无需手动 retry
    var self = this;
    return this._loadTileAsync(x, y, level, key);
  };

  LocalTerrainProvider.prototype.getLevelMaximumGeometricError = function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

  window.LocalTerrainProvider = LocalTerrainProvider;
  console.log('[LocalTerrainProvider] ✅ 已注册');
})();
