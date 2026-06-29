import { getMapbox } from './mapbox-gl-wrapper.mjs';
import { getMaplibre } from './maplibre-gl-wrapper.mjs';

export class MVTImageryProvider {
  constructor(options, rendererLib) {
    this.rendererLib = rendererLib;
    this.mapboxRenderer = new rendererLib.BasicRenderer({ style: options.style });
    this.ready = false;
    this.readyPromise = this.mapboxRenderer._style.loadedPromise.then(
      () => {
        this.ready = true;
        console.log(`[MVTImageryProvider] ✅ style 加载完成, sources:`, Object.keys(this.mapboxRenderer._style.sourceCaches || {}));
      }
    ).catch(err => {
      console.error(`[MVTImageryProvider] ❌ style 加载失败:`, err);
    });

    const Cesium = this._getCesium();
    this.tilingScheme = new Cesium.WebMercatorTilingScheme();
    this.rectangle = this.tilingScheme.rectangle;
    this.tileSize = this.tileWidth = this.tileHeight = options.tileSize || 512;
    this.maximumLevel = options.maximumLevel || Number.MAX_SAFE_INTEGER;
    this.minimumLevel = options.minimumLevel || 0;
    this.tileDiscardPolicy = undefined;
    this.errorEvent = new Cesium.Event();
    this.credit = new Cesium.Credit(options.credit || "", false);
    this.proxy = new Cesium.DefaultProxy("");
    this.hasAlphaChannel =
      options.hasAlphaChannel !== undefined ? options.hasAlphaChannel : true;
    this.cesiumviewer = options.cesiumViewer;
    this.sourceFilter = options.sourceFilter;
  }

  static async create(options) {
    // library: 'mapbox' (默认) 或 'maplibre'
    // mapbox-gl.js 有 BasicRenderer，用于 Cesium 瓦片渲染
    // maplibre-gl.js 作为备选，与 mbview-master 瓦片服务端保持一致
    const lib = options.library || 'mapbox';
    let rendererLib;

    if (lib === 'maplibre') {
      // 尝试 maplibre-gl.js（可能没有 BasicRenderer，回退到 mapbox-gl.js）
      try {
        rendererLib = await getMaplibre();
        if (!rendererLib.BasicRenderer) {
          console.warn('[MVTImageryProvider] maplibre-gl.js 不含 BasicRenderer API，回退使用 mapbox-gl.js');
          rendererLib = await getMapbox();
        }
      } catch (err) {
        console.warn('[MVTImageryProvider] maplibre-gl.js 加载失败，回退使用 mapbox-gl.js:', err.message);
        rendererLib = await getMapbox();
      }
    } else {
      rendererLib = await getMapbox();
    }

    // ⚠️ 限制 Worker 数量，防止密集矢量瓦片数据（如深圳城市数据）导致浏览器卡死
    // 默认 mapbox-gl 使用 navigator.hardwareConcurrency - 1 个 Worker，
    // 对于大尺寸 PBF 瓦片，多个 Worker 同时解析会耗尽 CPU 和内存
    const maxWorkers = options.maxWorkers || 2;
    if (typeof rendererLib.workerCount !== 'undefined') {
      const originalCount = rendererLib.workerCount;
      rendererLib.workerCount = Math.min(rendererLib.workerCount || 4, maxWorkers);
      console.log(`[MVTImageryProvider] 🔧 Worker 数量: ${originalCount} → ${rendererLib.workerCount}`);
    }

    return new MVTImageryProvider(options, rendererLib);
  }

  _getCesium() {
    return typeof window !== 'undefined' ? window.Cesium : null;
  }

  getTileCredits(x, y, level) {
    return [];
  }

  createTile() {
    let canv = document.createElement("canvas");
    canv.width = this.tileSize;
    canv.height = this.tileSize;
    canv.style.imageRendering = "pixelated";
    canv.getContext("2d").globalCompositeOperation = "copy";
    return canv;
  }

  requestImage(x, y, zoom, releaseTile = true) {
    if (zoom > this.maximumLevel || zoom < this.minimumLevel)
      return Promise.reject(undefined);

    this.mapboxRenderer.filterForZoom(zoom);
    const tilesSpec = [];
    const visibleSources = this.mapboxRenderer.getVisibleSources();

    // 🔍 首次请求时打印调试信息
    if (!this._debugLogged) {
      this._debugLogged = true;
      console.log(`[MVTImageryProvider] 🔍 首次瓦片请求: zoom=${zoom} x=${x} y=${y}`);
      console.log(`[MVTImageryProvider] 🔍 可见 sources:`, visibleSources);
      // 检查 dispatcher / worker 状态
      const dispatcher = this.mapboxRenderer._style?.dispatcher;
      if (dispatcher) {
        console.log(`[MVTImageryProvider] 🔍 dispatcher:`, {
          numActors: (dispatcher.actors || []).length,
          actorsReady: (dispatcher.actors || []).map(a => !!a.ready),
          currentActor: dispatcher.currentActor,
          id: dispatcher.id,
          workerPoolActive: Object.keys(dispatcher.workerPool?.active || {}).length
        });
      } else {
        console.warn(`[MVTImageryProvider] ⚠️ 无 dispatcher！瓦片加载需要 worker 线程`);
      }
      const sourceCaches = this.mapboxRenderer._style?.sourceCaches || {};
      Object.entries(sourceCaches).forEach(([id, cache]) => {
        const src = cache._source || {};
        const tileIds = Object.keys(cache._tiles || {});
        const loadedTiles = tileIds.filter(tid => cache._tiles[tid]?.state === 'loaded');
        const loadingTiles = tileIds.filter(tid => cache._tiles[tid]?.state === 'loading');
        console.log(`[MVTImageryProvider] 🔍 sourceCache["${id}"]:`, {
          type: src.type,
          tiles: src.tiles,
          scheme: src.scheme,
          tileBounds: src.tileBounds,
          minzoom: src.minzoom,
          maxzoom: src.maxzoom,
          sourceLoaded: src.loaded?.() ?? src._loaded,
          sourceErrored: src._sourceErrored,
          cacheTileCount: tileIds.length,
          loadedCount: loadedTiles.length,
          loadingCount: loadingTiles.length,
          paused: cache._paused,
          isRenderable: cache._isIdRenderable
        });
      });
    }

    visibleSources.forEach((s) => {
      tilesSpec.push({
        source: s,
        z: zoom,
        x: x,
        y: y,
        left: 0,
        top: 0,
        size: this.tileSize,
      });
    });

    // 无可见 source 时直接失败
    if (tilesSpec.length === 0) {
      console.warn(`[MVTImageryProvider] ⚠️ 无可渲染 source (z=${zoom})，已 filterForZoom 过滤`);
      return Promise.reject(new Error('no visible sources'));
    }

    return new Promise((resolve, reject) => {
      let canv = this.createTile();
      const renderRef = this.mapboxRenderer.renderTiles(
        canv.getContext("2d"),
        {
          srcLeft: 0,
          srcTop: 0,
          width: this.tileSize,
          height: this.tileSize,
          destLeft: 0,
          destTop: 0,
        },
        tilesSpec,
        (err) => {
          if (!!err) {
            console.warn(`[MVTImageryProvider] 瓦片渲染错误 z=${zoom} x=${x} y=${y}:`, err);
            reject(err);
          } else {
            if (releaseTile) {
              renderRef.consumer.ctx = undefined;
              resolve(canv);
              this.mapboxRenderer.releaseRender(renderRef);
            } else {
              resolve(renderRef);
            }
          }
        }
      );
    });
  }

  pickFeatures(x, y, zoom, longitude, latitude) {
    return this.requestImage(x, y, zoom, false).then((renderRef) => {
      let targetSources = this.mapboxRenderer.getVisibleSources();
      targetSources = this.sourceFilter
        ? this.sourceFilter(targetSources)
        : targetSources;

      const queryResult = [];
      const Cesium = this._getCesium();

      longitude = Cesium.Math.toDegrees(longitude);
      latitude = Cesium.Math.toDegrees(latitude);

      targetSources.forEach((s) => {
        queryResult.push({
          data: this.mapboxRenderer.queryRenderedFeatures({
            source: s,
            renderedZoom: zoom,
            lng: longitude,
            lat: latitude,
            tileZ: zoom,
          }),
        });
      });

      renderRef.consumer.ctx = undefined;
      this.mapboxRenderer.releaseRender(renderRef);
      return queryResult;
    });
  }

  destroy() {
    this._destroyed = true;
    if (this.mapboxRenderer) {
      if (typeof this.mapboxRenderer.destroy === 'function') {
        this.mapboxRenderer.destroy();
      }
      this.mapboxRenderer = null;
    }
    this.ready = false;
    this.errorEvent = null;
    this.tilingScheme = null;
    this.rectangle = null;
  }

  isDestroyed() {
    return this._destroyed === true;
  }
}

export default MVTImageryProvider;
