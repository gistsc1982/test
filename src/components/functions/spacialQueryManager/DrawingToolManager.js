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

  // 先获取 Cesium canvas 引用，确保叠加 canvas 尺寸完全一致
  var cesiumCanvas = viewer.scene.canvas;

  // 创建叠加 canvas — 尺寸必须与 Cesium canvas 完全一致
  var canvas = document.createElement('canvas');
  var cw = cesiumCanvas.clientWidth  || cesiumCanvas.width  || 1024;
  var ch = cesiumCanvas.clientHeight || cesiumCanvas.height || 768;
  canvas.width  = cw;
  canvas.height = ch;
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:' + cw + 'px;height:' + ch + 'px;z-index:99999;cursor:crosshair;pointer-events:auto;display:block;';
  container.appendChild(canvas);
  console.log('[DrawingToolManager] canvas: ' + cw + 'x' + ch + ' (Cesium canvas: ' + cesiumCanvas.width + 'x' + cesiumCanvas.height + ')');

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

  var clickLonLats = [];    // 地理坐标 [lon, lat]
  var clickCartesians = []; // 完整 Cartesian3（含高度，确保 wgs84ToWindowCoordinates 可逆）
  var clickScreenPts = [];  // 屏幕坐标（视口绝对坐标）
  var isCancelled = false;
  var isFinalized = false;

  // 设备像素比（Cesium canvas 内部分辨率 = CSS尺寸 × DPR）
  var dpr = window.devicePixelRatio || 1;

  function captureLonLat(e) {
    var rect = cesiumCanvas.getBoundingClientRect();
    // pickPosition 使用 canvas 内部坐标（CSS像素 × DPR）
    var x = (e.clientX - rect.left) * dpr;
    var y = (e.clientY - rect.top) * dpr;
    var c = screenToCartesian(viewer, new Cesium.Cartesian2(x, y));
    return Cesium.defined(c) ? cartesianToLonLat(c) : null;
  }

  function captureScreenPt(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function viewportToCanvas(pt) {
    var rect = cesiumCanvas.getBoundingClientRect();
    return { x: (pt.x - rect.left) * dpr, y: (pt.y - rect.top) * dpr };
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
        var sc = viewportToCanvas(clickScreenPts[i]);
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
        var pt = viewportToCanvas(clickScreenPts[j]);
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

    // 用当前相机统一重新计算所有点的经纬度（消除绘制过程中相机移动导致的偏差）
    recalcLonLats();

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

    // 停用 DrawingTools，保留 canvas 供遮罩渲染
    DT.hand();
    canvas.style.cursor = '';
    canvas.style.pointerEvents = 'none';
    canvas.removeEventListener('contextmenu', ctxMenu);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mouseup', onMouseUp);

    // 遮罩暂不启用，保留计算逻辑供后续使用
    // logMaskCoords();
    // drawMaskOnce();
    if (geom && onComplete) onComplete(geom);
  }

  // 用当前相机统一重新计算所有点（高度统一归零到椭球面）
  function recalcLonLats() {
    for (var i = 0; i < clickScreenPts.length; i++) {
      var cp = viewportToCanvas(clickScreenPts[i]);
      var c = screenToCartesian(viewer, new Cesium.Cartesian2(cp.x, cp.y));
      if (Cesium.defined(c)) {
        var ll = cartesianToLonLat(c);
        clickLonLats[i] = ll;
        // 统一归零到椭球面（空间查询不涉及高度）
        clickCartesians[i] = Cesium.Cartesian3.fromDegrees(ll[0], ll[1], 0);
      }
    }
  }

  // 打印遮罩坐标对比日志
  function logMaskCoords() {
    var C = window.Cesium;
    // 将视口坐标转为当前 canvas 相对坐标
    var canvasPts = [];
    for (var k = 0; k < clickScreenPts.length; k++) {
      canvasPts.push(viewportToCanvas(clickScreenPts[k]));
    }
    console.log('===== 遮罩坐标对比 =====');
    console.log('[Canvas遮罩] 视口坐标:', JSON.parse(JSON.stringify(clickScreenPts)));
    console.log('[Canvas遮罩] →当前canvas坐标:', JSON.parse(JSON.stringify(canvasPts)));
    console.log('[Canvas遮罩] 经纬度:', JSON.parse(JSON.stringify(clickLonLats)));
    // 将经纬度用当前相机重投影到 canvas 坐标
    var projectedPts = [];
    var ccRect = cesiumCanvas.getBoundingClientRect();
    for (var i = 0; i < clickLonLats.length; i++) {
      var cart = clickCartesians[i] || C.Cartesian3.fromDegrees(clickLonLats[i][0], clickLonLats[i][1], 0);
      var sc = C.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cart);
      if (C.defined(sc)) {
        projectedPts.push({ x: (sc.x - ccRect.left) / dpr, y: (sc.y - ccRect.top) / dpr });
      }
    }
    console.log('[投影] canvas坐标(DPR=' + dpr + '):', JSON.parse(JSON.stringify(projectedPts)));
    console.log('[坐标参考] Cesium canvas rect:', {left: ccRect.left, top: ccRect.top, w: ccRect.width, h: ccRect.height});
    console.log('===== 对比结束 ====');
  }

  // 一次性 Canvas 遮罩（使用地理→屏幕投影，与 Entity 遮罩同源）
  function drawMaskOnce() {
    if (clickLonLats.length < 3) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    // 用 Cesium 投影转换（与 Entity 渲染一致）
    var screenPts = [];
    for (var i = 0; i < clickLonLats.length; i++) {
      var cart = clickCartesians[i] || Cesium.Cartesian3.fromDegrees(clickLonLats[i][0], clickLonLats[i][1], 0);
      var sc = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cart);
      if (Cesium.defined(sc)) {
        var rect = cesiumCanvas.getBoundingClientRect();
        // wgs84ToWindowCoordinates 返回的是 Cesium 内部坐标（含 DPR），转为 CSS 像素
        screenPts.push({ x: (sc.x - rect.left) / dpr, y: (sc.y - rect.top) / dpr });
      }
    }
    if (screenPts.length < 3) return;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 38, 84, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    for (var j = screenPts.length - 1; j >= 0; j--) {
      if (j === screenPts.length - 1) ctx.moveTo(screenPts[j].x, screenPts[j].y);
      else ctx.lineTo(screenPts[j].x, screenPts[j].y);
    }
    ctx.closePath();
    ctx.fill('evenodd');
    ctx.restore();
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

  // deactivate: 清除 canvas（无论是否已完成绘制）
  function removeCanvas() {
    DT.hand();
    DT.clear();
    cleanup();
  }
  return { deactivate: removeCanvas, canvas: canvas, getCartesians: function () { return clickCartesians; }, getLonLats: function () { return clickLonLats; } };
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
      // 不置 null — 保留引用以便清除按钮能移除 canvas
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
