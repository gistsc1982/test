/**
 * TurfSpatialFilter.js
 * Turf.js 空间分析工具模块
 *
 * 功能：
 * - 将绘图结果转为 Turf Feature
 * - 对点/线创建缓冲区
 * - 将 GeoJSON geometry 转为 GML 3.2 格式（用于 WFS Filter XML）
 */

// 动态加载 Turf.js（兼容 CDN 全局引入和 npm 包引入两种方式）
function getTurf() {
  if (typeof window.turf !== 'undefined') return window.turf;
  // 如果 @turf/turf 以 npm 包形式引入，需要在调用方动态 import
  return null;
}

const METERS_PER_DEGREE = 111320; // 赤道附近近似值

/**
 * 将 GeoJSON geometry 转为 GML 3.2 字符串（用于 WFS Filter XML）
 * @param {object} geoJsonGeom - GeoJSON geometry 对象
 * @returns {string} GML 3.2 XML 片段
 */
export function geometryToGml(geoJsonGeom) {
  if (!geoJsonGeom || !geoJsonGeom.type) return '';

  switch (geoJsonGeom.type) {
    case 'Point': {
      var coords = geoJsonGeom.coordinates;
      return '<gml:Point srsName="EPSG:4326">\n' +
        '  <gml:pos>' + formatCoord(coords[0]) + ' ' + formatCoord(coords[1]) + '</gml:pos>\n' +
        '</gml:Point>';
    }
    case 'LineString': {
      var posList = geoJsonGeom.coordinates.map(function (c) {
        return formatCoord(c[0]) + ' ' + formatCoord(c[1]);
      }).join(' ');
      return '<gml:LineString srsName="EPSG:4326">\n' +
        '  <gml:posList>' + posList + '</gml:posList>\n' +
        '</gml:LineString>';
    }
    case 'Polygon': {
      var rings = geoJsonGeom.coordinates.map(function (ring) {
        var ringPosList = ring.map(function (c) {
          return formatCoord(c[0]) + ' ' + formatCoord(c[1]);
        }).join(' ');
        return '<gml:LinearRing>\n' +
          '  <gml:posList>' + ringPosList + '</gml:posList>\n' +
          '</gml:LinearRing>';
      });
      var exterior = rings[0] || '';
      var interiors = rings.slice(1).map(function (r) {
        return '<gml:interior>\n' + r + '\n</gml:interior>';
      }).join('\n');
      return '<gml:Polygon srsName="EPSG:4326">\n' +
        '  <gml:exterior>\n' + exterior + '\n  </gml:exterior>\n' +
        interiors +
        '</gml:Polygon>';
    }
    case 'MultiPolygon': {
      var polyMembers = geoJsonGeom.coordinates.map(function (polygonRings) {
        var ringXmls = polygonRings.map(function (ring) {
          var rPosList = ring.map(function (c) {
            return formatCoord(c[0]) + ' ' + formatCoord(c[1]);
          }).join(' ');
          return '<gml:LinearRing>\n' +
            '    <gml:posList>' + rPosList + '</gml:posList>\n' +
            '  </gml:LinearRing>';
        });
        var ext = ringXmls[0] || '';
        var ints = ringXmls.slice(1).map(function (r) {
          return '  <gml:interior>\n' + r + '\n  </gml:interior>';
        }).join('\n');
        return '<gml:polygonMember>\n' +
          '  <gml:Polygon srsName="EPSG:4326">\n' +
          '    <gml:exterior>\n' + ext + '\n    </gml:exterior>\n' +
          ints +
          '  </gml:Polygon>\n' +
          '</gml:polygonMember>';
      });
      return '<gml:MultiSurface srsName="EPSG:4326">\n' +
        '  <gml:surfaceMembers>\n' +
        polyMembers.join('\n') + '\n' +
        '  </gml:surfaceMembers>\n' +
        '</gml:MultiSurface>';
    }
    default:
      console.warn('[TurfSpatialFilter] 不支持的 geometry 类型:', geoJsonGeom.type);
      return '';
  }
}

/**
 * 坐标值格式化（截断到指定位数小数，控制 XML 大小）
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
function formatCoord(val, decimals) {
  decimals = decimals || 6;
  return Number(val).toFixed(decimals);
}

/**
 * 使用 Turf.js 对几何图形创建缓冲区
 * 注意：此函数需要 @turf/buffer 可用。如果不可用，回退到简单的经纬度偏移近似。
 *
 * @param {object} turfFeature - Turf Feature（点或线）
 * @param {number} radiusMeters - 缓冲区半径（米）
 * @returns {object} Turf Feature（面）
 */
export function createBufferFromFeature(turfFeature, radiusMeters) {
  if (!radiusMeters || radiusMeters <= 0) return turfFeature;

  var turf = getTurf();

  if (turf && typeof turf.buffer === 'function') {
    // 使用 @turf/buffer（单位：公里）
    var radiusKm = radiusMeters / 1000;
    try {
      var buffered = turf.buffer(turfFeature, radiusKm, { units: 'kilometers', steps: 64 });
      return buffered;
    } catch (e) {
      console.warn('[TurfSpatialFilter] turf.buffer 失败，使用近似平面缓冲区:', e.message);
    }
  }

  // 回退：基于经纬度偏移的平面近似缓冲区
  return approximateBuffer(turfFeature, radiusMeters);
}

/**
 * 平面近似缓冲区（不依赖 Turf.js 的回退方案）
 * 仅适用于小范围（< 100km）的近似计算
 */
function approximateBuffer(turfFeature, radiusMeters) {
  var degRadius = radiusMeters / METERS_PER_DEGREE;

  if (turfFeature.geometry.type === 'Point') {
    var center = turfFeature.geometry.coordinates;
    var steps = 64;
    var ring = [];
    for (var i = 0; i <= steps; i++) {
      var angle = (i / steps) * 2 * Math.PI;
      var dLat = degRadius * Math.cos(angle);
      // 经度需根据纬度修正
      var lat = center[1] + dLat;
      var dLon = degRadius * Math.sin(angle) / Math.cos(lat * Math.PI / 180);
      ring.push([center[0] + dLon, lat]);
    }
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {}
    };
  }

  if (turfFeature.geometry.type === 'LineString') {
    // 对折线每个线段做垂直偏移，构建走廊多边形
    var coords = turfFeature.geometry.coordinates;
    if (coords.length < 2) return turfFeature;

    var leftSide = [];
    var rightSide = [];

    for (var i = 0; i < coords.length; i++) {
      var curr = coords[i];
      var latCos = Math.cos(curr[1] * Math.PI / 180);

      // 计算当前点处的方向向量（前后段平均方向）
      var dx = 0, dy = 0;
      if (i === 0) {
        // 起点：用第一段的方向
        dx = coords[1][0] - coords[0][0];
        dy = coords[1][1] - coords[0][1];
      } else if (i === coords.length - 1) {
        // 终点：用最后一段的方向
        dx = coords[i][0] - coords[i - 1][0];
        dy = coords[i][1] - coords[i - 1][1];
      } else {
        // 中间点：前后两段的平均方向
        dx = coords[i + 1][0] - coords[i - 1][0];
        dy = coords[i + 1][1] - coords[i - 1][1];
      }

      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-12) {
        // 重复点，跳过
        continue;
      }

      // 单位方向向量
      var ux = dx / len;
      var uy = dy / len;

      // 垂直向量（逆时针旋转 90 度为左侧）
      var perpX = -uy;
      var perpY = ux;

      // 左侧偏移（经度需纬度修正）
      var leftLon = curr[0] + perpX * degRadius / latCos;
      var leftLat = curr[1] + perpY * degRadius;
      leftSide.push([leftLon, leftLat]);

      // 右侧偏移
      var rightLon = curr[0] - perpX * degRadius / latCos;
      var rightLat = curr[1] - perpY * degRadius;
      rightSide.push([rightLon, rightLat]);
    }

    // 构建走廊多边形：左侧 + 反向右侧 = 闭合环
    var corridor = leftSide.concat(rightSide.reverse());
    // 闭合
    if (corridor.length > 0) {
      corridor.push(corridor[0].slice());
    }

    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [corridor] },
      properties: {}
    };
  }

  // 其他类型直接返回
  return turfFeature;
}

/**
 * 主入口：将绘图结果转为适用于 WFS Filter XML 的空间几何图形
 *
 * @param {string} drawingType - 绘图类型: point | line | circle | rectangle | polygon
 * @param {object} geoJsonGeom - 原始绘图 GeoJSON geometry
 * @param {number} bufferRadiusMeters - 缓冲区半径（米），仅对 point/line 有效
 * @returns {object} { gml: string, geoJson: object } — GML XML 片段 + 最终 GeoJSON geometry
 */
export function geometryForXmlFilter(drawingType, geoJsonGeom, bufferRadiusMeters) {
  if (!geoJsonGeom) return null;

  var finalGeom = geoJsonGeom;

  // 点和线需要缓冲
  if ((drawingType === 'point' || drawingType === 'line') && bufferRadiusMeters > 0) {
    var turf = getTurf();
    var feature;

    if (drawingType === 'point') {
      if (turf && typeof turf.point === 'function') {
        feature = turf.point(geoJsonGeom.coordinates);
      } else {
        feature = { type: 'Feature', geometry: geoJsonGeom, properties: {} };
      }
    } else {
      if (turf && typeof turf.lineString === 'function') {
        feature = turf.lineString(geoJsonGeom.coordinates);
      } else {
        feature = { type: 'Feature', geometry: geoJsonGeom, properties: {} };
      }
    }

    var buffered = createBufferFromFeature(feature, bufferRadiusMeters);
    finalGeom = buffered.geometry;
  }

  // 圆：用缓冲后的点作为多边形
  if (drawingType === 'circle') {
    var radius = geoJsonGeom.radius || bufferRadiusMeters || 0;
    var centerFeature;
    var turfC = getTurf();
    if (turfC && typeof turfC.point === 'function') {
      centerFeature = turfC.point(geoJsonGeom.coordinates);
    } else {
      centerFeature = { type: 'Feature', geometry: { type: 'Point', coordinates: geoJsonGeom.coordinates }, properties: {} };
    }
    var circleBuffered = createBufferFromFeature(centerFeature, radius);
    finalGeom = circleBuffered.geometry;
  }

  // 验证最终几何图形
  if (!finalGeom || !finalGeom.type) return null;
  if (finalGeom.type === 'Polygon' && (!finalGeom.coordinates || !finalGeom.coordinates[0] || finalGeom.coordinates[0].length < 4)) {
    console.warn('[TurfSpatialFilter] 退化多边形（顶点不足）');
    return null;
  }

  var gml = geometryToGml(finalGeom);

  return {
    gml: gml,
    geoJson: finalGeom
  };
}

// 同时导出格式化函数供 WfsQueryService 使用
export { formatCoord };
