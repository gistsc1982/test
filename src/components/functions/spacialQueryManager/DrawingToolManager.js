/**
 * DrawingToolManager.js
 * Canvas 叠加层 + DrawingTools.js 绘图 + Cesium 坐标转换
 *
 * 支持的绘图类型: point | line | circle | rectangle | polygon
 * 操作方式: 左键绘制 / 右键结束（线、多边形）
 */

// 直接 import，确保 DrawingTools 挂到 window
import './jsDrawLib/DrawingTools.js';
import './jsDrawLib/PlotUtils.js';

// ==================== 工具函数 ====================

function screenToCartesian(viewer, screenPos) {
  var C = window.Cesium;
  var c = viewer.scene.pickPosition(screenPos);
  if (C.defined(c)) return c;
  return viewer.camera.pickEllipsoid(screenPos, viewer.scene.globe.ellipsoid);
}

function cartesianToLonLat(c) {
  var C = window.Cesium;
  var cg = C.Cartographic.fromCartesian(c);
  return [C.Math.toDegrees(cg.longitude), C.Math.toDegrees(cg.latitude)];
}

// ==================== Canvas 绘图器 ====================

function createCanvasDrawer(viewer, type, onComplete, bufferRadius) {
  var Cesium = window.Cesium;
  var DT = window.DrawingTools;
  if (!Cesium || !viewer || !DT) return null;
  bufferRadius = bufferRadius || 0;

  var container = viewer.container;
  if (!container) return null;

  // 创建叠加 canvas
  var canvas = document.createElement('canvas');
  var cw = container.clientWidth  || container.offsetWidth  || 1024;
  var ch = container.clientHeight || container.offsetHeight || 768;
  canvas.width  = cw;
  canvas.height = ch;
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:' + cw + 'px;height:' + ch + 'px;z-index:99999;cursor:crosshair;pointer-events:auto;display:block;';
  container.appendChild(canvas);

  var ctxMenu = function (e) { e.preventDefault(); };
  canvas.addEventListener('contextmenu', ctxMenu);

  // ---- 初始化 DrawingTools ----
  if (typeof DT.init !== 'function') {
    console.error('[DrawingToolManager] DrawingTools.init 不是函数, DT=', DT);
    container.removeChild(canvas);
    return null;
  }
  // 直接传 canvas 元素，绕过 getElementById（兼容 shadow DOM）
  DT.init({ canvas: canvas });

  var clickLonLats = [];    // 地理坐标
  var clickScreenPts = [];  // 屏幕坐标（与 DrawingTools 同源，避免 Cesium 转换偏差）
  var isCancelled = false;
  var isFinalized = false;

  function captureLonLat(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var c = screenToCartesian(viewer, new Cesium.Cartesian2(x, y));
    return Cesium.defined(c) ? cartesianToLonLat(c) : null;
  }

  function captureScreenPt(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // point 模式：mousedown 即记录坐标（防止 mouseOut 中断导致丢失）
  function onMouseDown(e) {
    if (isCancelled || isFinalized) return;
    if (type === 'point' && e.button === 0) {
      var ll = captureLonLat(e);
      if (ll) {
        clickLonLats.push(ll);
        clickScreenPts.push(captureScreenPt(e));
      }
    }
  }
  canvas.addEventListener('mousedown', onMouseDown);

  function onMouseUp(e) {
    if (isCancelled || isFinalized) return;
    console.log('[Drawer] mouseup button=' + e.button + ' type=' + type + ' lons=' + clickLonLats.length);
    if (e.button === 0) {
      var ll = captureLonLat(e);
      if (ll) {
        clickLonLats.push(ll);
        clickScreenPts.push(captureScreenPt(e));
      }
      setTimeout(checkComplete, 150);
    } else if (e.button === 2) {
      if (type === 'line' || type === 'polygon' || type === 'rectangle') {
        DT.hand();
        setTimeout(finalize, 80);
      } else if (type === 'circle') {
        cancel();
      } else {
        cancel();
      }
    }
  }
  canvas.addEventListener('mouseup', onMouseUp);

  // 缓冲区预览：基于已确认的顶点绘制缓冲区（不跟光标）
  var lastPixelRadius = 0;
  function calcPixelRadius(lonLat) {
    if (bufferRadius <= 0 || !lonLat) return 0;
    var centerCart = Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], 0);
    var latRad = lonLat[1] * Math.PI / 180;
    var dLonDeg = bufferRadius / (111320 * Math.cos(latRad));
    var offsetCart = Cesium.Cartesian3.fromDegrees(lonLat[0] + dLonDeg, lonLat[1], 0);
    var c0 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, centerCart);
    var c1 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, offsetCart);
    if (Cesium.defined(c0) && Cesium.defined(c1)) return Math.abs(c1.x - c0.x);
    return 0;
  }
  function drawBufferOnCanvas() {
    if (bufferRadius <= 0) return;
    if (clickScreenPts.length === 0) return;
    if (type !== 'point' && type !== 'line') return;
    // 用最后一个确认点的地理坐标计算像素半径
    var pr = calcPixelRadius(clickLonLats[clickLonLats.length - 1]);
    if (pr <= 0) return;
    lastPixelRadius = pr;
    var ctx = canvas.getContext('2d');
    ctx.save();
    if (type === 'point') {
      for (var i = 0; i < clickScreenPts.length; i++) {
        var sc = clickScreenPts[i];
        ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (type === 'line' && clickScreenPts.length >= 2) {
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.25)';
      ctx.lineWidth = pr * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var j = 0; j < clickScreenPts.length; j++) {
        var pt = clickScreenPts[j];
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  // 每次鼠标事件后重绘缓冲区（在 DrawingTools 绘制之后）
  canvas.addEventListener('mousemove', function () {
    if (!isCancelled && !isFinalized) requestAnimationFrame(drawBufferOnCanvas);
  });
  canvas.addEventListener('mouseup', function () {
    if (!isCancelled && !isFinalized) requestAnimationFrame(drawBufferOnCanvas);
  });

  function checkComplete() {
    if (isCancelled || isFinalized) return;
    var cur = canvas.style.cursor;
    console.log('[Drawer] checkComplete cursor=' + cur + ' type=' + type + ' lons=' + clickLonLats.length);
    if (cur === 'pointer' || cur === '' || cur === 'default' || cur === 'auto') {
      finalize();
    }
  }

  function finalize() {
    if (isFinalized || isCancelled) return;
    isFinalized = true;
    var geom = null;

    if (type === 'point') {
      if (clickLonLats.length > 0) {
        geom = { type: 'Point', coordinates: clickLonLats[clickLonLats.length - 1] };
      }
    } else if (type === 'line') {
      if (clickLonLats.length >= 2) {
        geom = { type: 'LineString', coordinates: clickLonLats.slice() };
      }
    } else if (type === 'polygon') {
      if (clickLonLats.length >= 3) {
        var ring = clickLonLats.slice();
        ring.push(ring[0].slice());
        geom = { type: 'Polygon', coordinates: [ring] };
      }
    } else if (type === 'circle') {
      if (clickLonLats.length >= 2) {
        var ctr = clickLonLats[0], edge = clickLonLats[1];
        var dLon = (edge[0] - ctr[0]) * 111320 * Math.cos(ctr[1] * Math.PI / 180);
        var dLat = (edge[1] - ctr[1]) * 111320;
        var r = Math.sqrt(dLon * dLon + dLat * dLat);
        geom = { type: 'Point', coordinates: ctr, radius: r };
      }
    } else if (type === 'rectangle') {
      if (clickLonLats.length >= 2) {
        var a = clickLonLats[0], b = clickLonLats[clickLonLats.length - 1];
        geom = { type: 'Polygon', coordinates: [[[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]]] };
      }
    }

    cleanup();
    if (geom && onComplete) onComplete(geom);
  }

  function cancel() {
    if (isCancelled) return;
    isCancelled = true;
    DT.hand();
    DT.clear();
    cleanup();
  }

  function cleanup() {
    canvas.removeEventListener('contextmenu', ctxMenu);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);
    try { DT.hand(); DT.clear(); } catch (e) { /* ignore */ }
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  // 开始绘图
  var kindMap = { point: 'pen', line: 'line', circle: 'circle', rect: 'rect', rectangle: 'rect', polygon: 'poly' };
  DT.begin(kindMap[type] || 'pen');

  return { deactivate: cancel, canvas: canvas };
}

// ==================== DrawingToolManager ====================

class DrawingToolManager {
  constructor() {
    this._activeDrawer = null;
  }

  createDrawer(viewer, type, options) {
    this.deactivate();
    if (!viewer || !type) return null;

    var bufR = (options && options.bufferRadius) || 0;
    var self = this;
    var drawer = createCanvasDrawer(viewer, type, function (geom) {
      self._activeDrawer = null;
      if (options && options.onComplete) options.onComplete(geom);
    }, bufR);

    if (drawer) {
      this._activeDrawer = drawer;
      return drawer;
    }
    return null;
  }

  deactivate() {
    if (this._activeDrawer) {
      try { this._activeDrawer.deactivate(); } catch (e) { /* ignore */ }
      this._activeDrawer = null;
    }
  }

  clearAllDrawings() {}

  get isActive() { return this._activeDrawer !== null; }

  destroy() { this.deactivate(); }
}

export { DrawingToolManager };
