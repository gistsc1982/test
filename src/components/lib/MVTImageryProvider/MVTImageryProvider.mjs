import { getMapbox } from './mapbox-gl-wrapper.mjs';

export class MVTImageryProvider {
  constructor(options, mapbox) {
    this.mapboxRenderer = new mapbox.BasicRenderer({ style: options.style });
    this.ready = false;
    this.readyPromise = this.mapboxRenderer._style.loadedPromise.then(
      () => (this.ready = true)
    );
    
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
    const mapbox = await getMapbox();
    return new MVTImageryProvider(options, mapbox);
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
    this.mapboxRenderer.getVisibleSources().forEach((s) => {
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
            switch (err) {
              case "canceled":
              case "fully-canceled":
                reject(undefined);
                break;
              default:
                reject(undefined);
            }
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
}

export default MVTImageryProvider;
