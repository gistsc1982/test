/**
 * HeatmapRenderer — 基于 ECharts HeatmapLayer 算法的独立热力图渲染器
 *
 * 核心算法来源：node_modules/echarts/lib/chart/heatmap/HeatmapLayer.js
 *   Apache 2.0 License, Copyright Apache Software Foundation
 *
 * 渲染流程：
 *   1. 预生成"画刷"Canvas：一个带高斯模糊（shadowBlur）的黑色圆形
 *   2. 逐点将画刷以 globalAlpha 绘制到主 Canvas（alpha = normalize(value)）
 *   3. 读取主 Canvas 的 imageData，按 alpha 查找渐变颜色表，逐像素着色
 *   4. 返回着色后的 Canvas → 可直接用作 Cesium SingleTileImageryProvider 的纹理
 *
 * 与 ECharts 原版的差异：
 *   - 独立模块，零外部依赖（不需要 zrender）
 *   - 新增 fromGeoFeatures() 工厂方法，直接接受 GeoJSON features 数组
 *   - 渐变使用 { stop: 'color' } 对象而非 ECharts 的 visualMap 配置
 */

/**
 * @typedef {Object} HeatmapPoint
 * @property {number} x - 画布 X 坐标（像素）
 * @property {number} y - 画布 Y 坐标（像素）
 * @property {number} value - 权重值（会被归一化到 0-1）
 */

/**
 * @typedef {Object} HeatmapBounds
 * @property {number} minLon - 最小经度
 * @property {number} maxLon - 最大经度
 * @property {number} minLat - 最小纬度
 * @property {number} maxLat - 最大纬度
 */

const GRADIENT_LEVELS = 256;

class HeatmapRenderer {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.pointSize=20] - 单点半径（像素）
   * @param {number} [opts.blurSize=30] - 高斯模糊半径（像素）
   * @param {number} [opts.minOpacity=0] - 最小不透明度（0-1）
   * @param {number} [opts.maxOpacity=1] - 最大不透明度（0-1）
   * @param {Object<string,string>} [opts.gradient] - 颜色渐变 { stop: 'color' }
   *   例: { '0.0': 'rgba(0,0,255,0)', '0.3': 'blue', '0.6': 'lime', '1.0': 'red' }
   *   默认: 透明蓝 → 蓝 → 青 → 绿 → 黄 → 红（经典热力图配色）
   */
  constructor(opts = {}) {
    this.pointSize = opts.pointSize || 20;
    this.blurSize = opts.blurSize || 30;
    this.minOpacity = opts.minOpacity != null ? opts.minOpacity : 0;
    this.maxOpacity = opts.maxOpacity != null ? opts.maxOpacity : 1;

    // 默认渐变配色 — 高亮度暖色系，确保所有密度层次都明亮可见
    //   亮度均 >100，消除"黑色等高线"
    this._gradientStops = opts.gradient || {
      '0.00': 'rgba(255,250,150,0)',     // 完全透明
      '0.06': 'rgba(255,245,120,0.4)',   // 淡金
      '0.12': 'rgba(255,235,90,0.55)',   // 金黄
      '0.20': 'rgba(255,220,50,0.7)',    // 亮金黄
      '0.28': 'rgba(255,200,20,0.8)',    // 黄橙
      '0.36': 'rgba(255,175,0,0.88)',    // 金橙
      '0.44': 'rgba(255,145,0,0.93)',    // 橙
      '0.52': 'rgba(255,110,0,0.96)',    // 深橙
      '0.60': 'rgba(255,75,5,0.98)',     // 红橙
      '0.68': 'rgba(250,50,10,0.99)',    // 亮红橙
      '0.76': 'rgba(245,30,15,1)',       // 亮红
      '0.84': 'rgba(235,15,20,1)',       // 红
      '0.92': 'rgba(220,8,25,1)',        // 深红
      '1.00': 'rgba(200,5,30,1)'         // 暗红(峰值)
    };

    // 缓存
    this._brushCanvas = null;
    this._gradientPixels = null;
    this.canvas = null;
  }

  // ==================== 公开 API ====================

  /**
   * 从 GeoJSON features 数组构建热力图 Canvas
   *
   * @param {Array} features - GeoJSON Feature 数组，每个 feature 需包含
   *   geometry.coordinates [lng, lat] 和 properties[valueField]
   * @param {string} valueField - 用作权重的 properties 字段名
   * @param {number} canvasWidth - 输出画布宽度（像素）
   * @param {number} canvasHeight - 输出画布高度（像素）
   * @param {number} [marginFrac=0.1] - 地理边界的扩展比例（0-1）
   * @param {{ min: number, max: number }} [fixedValueRange] - 固定值域（用于视口缩放时保持颜色一致）
   * @returns {{ canvas: HTMLCanvasElement, bounds: HeatmapBounds, valueRange: {min:number,max:number} }}
   */
  renderFromGeoFeatures(features, valueField, canvasWidth, canvasHeight, marginFrac = 0.1, fixedValueRange) {
    // 1. 计算地理边界 & 收集值
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    const values = [];

    for (const f of features) {
      const coords = f.geometry && f.geometry.coordinates;
      if (!coords || coords.length < 2) continue;
      const lon = coords[0], lat = coords[1];
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      const val = (f.properties && f.properties[valueField]) || 0;
      values.push(Number(val) || 0);
    }

    if (minLon > maxLon || minLat > maxLat) {
      throw new Error('[HeatmapRenderer] 无法从 features 中提取有效坐标');
    }

    // 扩展边界（避免边缘裁剪）
    const dLon = (maxLon - minLon) || 0.01;
    const dLat = (maxLat - minLat) || 0.01;
    const marginLon = dLon * marginFrac;
    const marginLat = dLat * marginFrac;
    const bounds = {
      minLon: minLon - marginLon,
      maxLon: maxLon + marginLon,
      minLat: minLat - marginLat,
      maxLat: maxLat + marginLat
    };

    // 2. 计算归一化函数（优先使用固定值域，保证缩放时颜色一致）
    const vMin = fixedValueRange ? fixedValueRange.min : Math.min(...values);
    const vMax = fixedValueRange ? fixedValueRange.max : Math.max(...values);
    const vRange = vMax - vMin || 1;
    const normalize = (v) => Math.min(1, Math.max(0, (v - vMin) / vRange));

    // 3. 将地理坐标映射到画布像素坐标
    const lonRange = bounds.maxLon - bounds.minLon;
    const latRange = bounds.maxLat - bounds.minLat;
    const points = [];
    let idx = 0;
    for (const f of features) {
      const coords = f.geometry && f.geometry.coordinates;
      if (!coords || coords.length < 2) { idx++; continue; }
      const lon = coords[0], lat = coords[1];
      const x = ((lon - bounds.minLon) / lonRange) * canvasWidth;
      // Y 轴翻转：地理纬度递增 = 画布 Y 递减
      const y = ((bounds.maxLat - lat) / latRange) * canvasHeight;
      points.push({ x, y, value: values[idx] });
      idx++;
    }

    // 4. 渲染
    const canvas = this.render(points, canvasWidth, canvasHeight, normalize);

    return { canvas, bounds, valueRange: { min: vMin, max: vMax } };
  }

  /**
   * 渲染热力图到 Canvas
   *
   * 完全遵循 ECharts HeatmapLayer.js 原始算法，无任何改动：
   *   1. Canvas source-over 累积画刷 alpha
   *   2. getImageData 读取 alpha
   *   3. 逐像素查渐变表着色：pixel = gradient[alpha] * alpha * 256
   *
   * @param {HeatmapPoint[]} data - 点数据数组
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @param {Function} normalize - 归一化函数 (value) => alpha(0-1)
   * @returns {HTMLCanvasElement}
   */
  render(data, width, height, normalize) {
    var brush = this._getBrush();
    var gradientPixels = this._getGradient();
    var r = this.pointSize + this.blurSize;

    // 创建或复用作图画布
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    var canvas = this.canvas;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // === Phase 1: 逐点绘制画刷（原始 heatmap.js） ===
    for (var i = 0; i < data.length; ++i) {
      var p = data[i];
      ctx.globalAlpha = normalize(p.value);
      ctx.drawImage(brush, p.x - r, p.y - r);
    }
    ctx.globalAlpha = 1;

    if (!canvas.width || !canvas.height) {
      return canvas;
    }

    // === Phase 2: 渐变着色（原始 heatmap.js 公式） ===
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imageData.data;
    var offset = 0;

    while (offset < pixels.length) {
      var alpha = pixels[offset + 3] / 256;
      var gradientOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1)) * 4;

      if (alpha > 0) {
        alpha = alpha * (this.maxOpacity - this.minOpacity) + this.minOpacity;
        pixels[offset++] = gradientPixels[gradientOffset];
        pixels[offset++] = gradientPixels[gradientOffset + 1];
        pixels[offset++] = gradientPixels[gradientOffset + 2];
        pixels[offset++] = gradientPixels[gradientOffset + 3] * alpha * 256;
      } else {
        offset += 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // 后处理 1：轻微模糊消除离散 alpha 阶梯
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    var tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCtx.filter = 'blur(2px)';
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.filter = 'none';

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);

    // 后处理 2：清除模糊黑色伪影 + 仅回填暗色空洞（保护自然透明区）
    var w = width;
    var h = height;
    var totalPx = w * h;

    // 记录 Step A 之前哪些像素原本有颜色（alpha > 0）
    var preData = ctx.getImageData(0, 0, w, h);
    var wasVisible = new Uint8Array(totalPx); // 1=原本有色, 0=原本透明
    for (var pi = 0; pi < preData.data.length; pi += 4) {
      if (preData.data[pi + 3] > 0) wasVisible[pi / 4] = 1;
    }

    // Step A: 暗色像素 → 透明
    for (var pi = 0; pi < preData.data.length; pi += 4) {
      if (preData.data[pi + 3] > 0) {
        var bright = (preData.data[pi] + preData.data[pi + 1] + preData.data[pi + 2]) / 3;
        if (bright < 60) {
          preData.data[pi] = preData.data[pi + 1] = preData.data[pi + 2] = preData.data[pi + 3] = 0;
        }
      }
    }
    ctx.putImageData(preData, 0, 0);

    // Step B: 仅回填"原本有色、Step A 变透明"的暗色空洞
    //         （原本就透明的像素不受影响）
    for (var pass = 0; pass < 8; pass++) {
      var fillData = ctx.getImageData(0, 0, w, h);
      var fillPixels = fillData.data;
      var filledCount = 0;

      for (var pi = 0; pi < fillPixels.length; pi += 4) {
        var pxIdx = pi / 4;
        // ⭐ 关键：只处理原本有色、现在透明的像素
        if (!wasVisible[pxIdx] || fillPixels[pi + 3] > 0) continue;

        var x = pxIdx % w;
        var y = Math.floor(pxIdx / w);
        var sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0;

        for (var dy = -5; dy <= 5; dy++) {
          for (var dx = -5; dx <= 5; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            var ni = (ny * w + nx) * 4;
            if (fillPixels[ni + 3] === 0) continue;
            sumR += fillPixels[ni];
            sumG += fillPixels[ni + 1];
            sumB += fillPixels[ni + 2];
            sumA += fillPixels[ni + 3];
            count++;
          }
        }

        if (count > 0) {
          fillPixels[pi]     = Math.round(sumR / count);
          fillPixels[pi + 1] = Math.round(sumG / count);
          fillPixels[pi + 2] = Math.round(sumB / count);
          fillPixels[pi + 3] = Math.round(sumA / count);
          filledCount++;
        }
      }

      ctx.putImageData(fillData, 0, 0);
      if (filledCount === 0) break;
    }

    return canvas;
  }

  /**
   * 设置渐变配色
   * @param {Object<string,string>} stops - { '0.0': 'blue', '0.5': 'yellow', '1.0': 'red' }
   */
  setGradient(stops) {
    this._gradientStops = stops;
    this._gradientPixels = null; // 使缓存失效
  }

  /**
   * 销毁资源
   */
  dispose() {
    this._brushCanvas = null;
    this._gradientPixels = null;
    this.canvas = null;
  }

  // ==================== 内部方法 ====================

  /**
   * 获取画刷 Canvas：带高斯模糊的黑色圆形
   * 利用 shadowBlur + shadowOffsetX 技巧将阴影绘制到画布中央
   */
  _getBrush() {
    if (this._brushCanvas) return this._brushCanvas;

    const r = this.pointSize + this.blurSize;
    const d = r * 2;

    const brushCanvas = document.createElement('canvas');
    brushCanvas.width = d;
    brushCanvas.height = d;

    const ctx = brushCanvas.getContext('2d');
    ctx.clearRect(0, 0, d, d);

    // 技巧：在画布左侧外绘制实心圆，用 shadowOffsetX 将模糊阴影投射到画布中央 (r, r)
    ctx.shadowOffsetX = d;
    ctx.shadowBlur = this.blurSize;
    ctx.shadowColor = '#000';

    ctx.beginPath();
    ctx.arc(-r, r, this.pointSize, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    this._brushCanvas = brushCanvas;
    return brushCanvas;
  }

  /**
   * 获取渐变颜色查找表：256 级 RGBA 的 Uint8ClampedArray
   * 索引方式：gradientPixels[alpha * 255 * 4 + channel]
   */
  _getGradient() {
    if (this._gradientPixels) return this._gradientPixels;

    const pixels = new Uint8ClampedArray(GRADIENT_LEVELS * 4);
    const stops = this._gradientStops;

    // 解析渐变停止点
    const sortedStops = Object.keys(stops)
      .map(Number)
      .sort((a, b) => a - b);

    /**
     * 在渐变停止点之间线性插值
     * @param {number} t - 0-1 之间的位置
     * @returns {[number,number,number,number]} [r, g, b, a]
     */
    const interpolate = (t) => {
      // 边界外推
      if (t <= sortedStops[0]) {
        return parseColor(stops[sortedStops[0].toString()]);
      }
      if (t >= sortedStops[sortedStops.length - 1]) {
        return parseColor(stops[sortedStops[sortedStops.length - 1].toString()]);
      }

      // 找到 t 所在的区间
      let lower = sortedStops[0];
      let upper = sortedStops[sortedStops.length - 1];
      for (let i = 0; i < sortedStops.length - 1; i++) {
        if (t >= sortedStops[i] && t <= sortedStops[i + 1]) {
          lower = sortedStops[i];
          upper = sortedStops[i + 1];
          break;
        }
      }

      const frac = (t - lower) / (upper - lower);
      const c1 = parseColor(stops[lower.toString()]);
      const c2 = parseColor(stops[upper.toString()]);

      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * frac),
        Math.round(c1[1] + (c2[1] - c1[1]) * frac),
        Math.round(c1[2] + (c2[2] - c1[2]) * frac),
        c1[3] + (c2[3] - c1[3]) * frac
      ];
    };

    /**
     * 解析颜色字符串为 [r, g, b, a]
     * 支持: '#rrggbb', 'rgba(r,g,b,a)', 'rgb(r,g,b)', 命名字符串
     */
    const parseColor = (str) => {
      if (!str || typeof str !== 'string') return [0, 0, 0, 1];

      // rgba(r, g, b, a)
      const rgbaMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
      if (rgbaMatch) {
        return [
          parseInt(rgbaMatch[1], 10),
          parseInt(rgbaMatch[2], 10),
          parseInt(rgbaMatch[3], 10),
          rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) * 255 : 255
        ];
      }

      // #rrggbb
      const hexMatch = str.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
      if (hexMatch) {
        return [
          parseInt(hexMatch[1], 16),
          parseInt(hexMatch[2], 16),
          parseInt(hexMatch[3], 16),
          255
        ];
      }

      // 命名字符串（仅支持常见颜色）
      const namedColors = {
        red: [255, 0, 0, 255],
        green: [0, 128, 0, 255],
        blue: [0, 0, 255, 255],
        lime: [0, 255, 0, 255],
        yellow: [255, 255, 0, 255],
        cyan: [0, 255, 255, 255],
        orange: [255, 165, 0, 255],
        white: [255, 255, 255, 255],
        black: [0, 0, 0, 255],
        transparent: [0, 0, 0, 0]
      };
      const c = namedColors[str.toLowerCase()];
      return c ? [...c] : [0, 0, 0, 255];
    };

    // 生成 256 级渐变查找表
    for (let i = 0; i < GRADIENT_LEVELS; i++) {
      const t = i / (GRADIENT_LEVELS - 1);
      const [r, g, b, a] = interpolate(t);
      const off = i * 4;
      pixels[off]     = r;
      pixels[off + 1] = g;
      pixels[off + 2] = b;
      pixels[off + 3] = a;
    }

    this._gradientPixels = pixels;
    return pixels;
  }
}

export default HeatmapRenderer;
