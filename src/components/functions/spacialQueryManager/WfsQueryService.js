/**
 * WfsQueryService.js
 * WFS 空间查询服务 — 构建 OGC Filter 2.0 XML 并通过 HTTP POST 发送请求
 *
 * 功能：
 * - 从 WFS URL 中提取 service base URL 和 typeName
 * - 构建 OGC Filter 2.0 XML（属性模糊查询 + 空间算子组合）
 * - POST 请求发送 XML 并解析返回的 GeoJSON
 */

import { geometryForXmlFilter } from './TurfSpatialFilter.js';

/**
 * XML 转义
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 从完整 WFS GetFeature URL 中提取服务根 URL
 * 例如：https://gisserver.tianditu.gov.cn/TDTService/wfs?SERVICE=WFS&...
 *    → https://gisserver.tianditu.gov.cn/TDTService/wfs
 */
export function extractBaseUrl(url) {
  if (!url) return '';

  // 去掉查询参数
  var qIdx = url.indexOf('?');
  if (qIdx >= 0) return url.substring(0, qIdx);

  return url;
}

/**
 * 从 WFS URL 中提取 TYPENAMES 参数值
 * 例如：...TYPENAMES=TDTService%3AHYDA... → TDTService:HYDA
 */
export function extractTypeName(url) {
  if (!url) return '';

  // 匹配 TYPENAMES=xxx& 或 TYPENAME=xxx&
  var match = url.match(/TYPENAMES?=([^&]+)/i);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  // 尝试从 URL 路径中提取（某些服务格式）
  // 例如：/wfs/typename
  var pathMatch = url.match(/\/wfs\/([^/?]+)/i);
  if (pathMatch) return pathMatch[1];

  return '';
}

/**
 * 构建 <fes:PropertyIsLike> 元素
 */
function buildPropertyIsLike(propertyName, fuzzyValue) {
  if (!propertyName || !fuzzyValue) return '';
  return '      <fes:PropertyIsLike wildCard="*" singleChar="." escapeChar="!" matchCase="false">\n' +
    '        <fes:ValueReference>' + escapeXml(propertyName) + '</fes:ValueReference>\n' +
    '        <fes:Literal>*' + escapeXml(fuzzyValue) + '*</fes:Literal>\n' +
    '      </fes:PropertyIsLike>';
}

/**
 * 构建空间过滤元素
 * @param {string} operator - Intersects | Within | BBOX
 * @param {string} gmlGeometry - GML 3.2 几何 XML 片段
 */
function buildSpatialFilter(operator, gmlGeometry, geometryPropertyName) {
  if (!operator || !gmlGeometry) return '';
  var geomProp = geometryPropertyName || 'geometry';
  var validOps = ['Intersects', 'Within', 'BBOX', 'Equals', 'Disjoint', 'Touches', 'Crosses', 'Contains', 'Overlaps', 'DWithin', 'Beyond'];
  if (validOps.indexOf(operator) < 0) {
    console.warn('[WfsQueryService] 未知空间算子 "' + operator + '"，使用 Intersects');
    operator = 'Intersects';
  }

  if (operator === 'BBOX') {
    // BBOX 需要 <gml:Envelope>（不能直接用 Polygon）
    // 从 GML Polygon posList 提取 min/max 坐标
    var posMatch = gmlGeometry.match(/<gml:posList[^>]*>([\s\S]*?)<\/gml:posList>/);
    if (posMatch) {
      var nums = posMatch[1].trim().split(/\s+/);
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < nums.length - 1; i += 2) {
        var x = parseFloat(nums[i]), y = parseFloat(nums[i + 1]);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      return '      <fes:BBOX>\n' +
        '        <fes:ValueReference>' + escapeXml(geomProp) + '</fes:ValueReference>\n' +
        '        <gml:Envelope srsName="EPSG:4326">\n' +
        '          <gml:lowerCorner>' + minX.toFixed(6) + ' ' + minY.toFixed(6) + '</gml:lowerCorner>\n' +
        '          <gml:upperCorner>' + maxX.toFixed(6) + ' ' + maxY.toFixed(6) + '</gml:upperCorner>\n' +
        '        </gml:Envelope>\n' +
        '      </fes:BBOX>';
    }
    console.warn('[WfsQueryService] BBOX 无法解析坐标，回退到 Intersects');
    operator = 'Intersects';
    // fall through to Intersects below
  }

  return '      <fes:' + operator + '>\n' +
    '        <fes:ValueReference>' + escapeXml(geomProp) + '</fes:ValueReference>\n' +
    '        ' + gmlGeometry + '\n' +
    '      </fes:' + operator + '>';
}

/**
 * 构建完整的 OGC Filter 2.0 XML 请求体
 *
 * @param {object} params
 * @param {string} params.typeName - WFS 图层类型名（如 TDTService:HYDA）
 * @param {string} [params.propertyName] - 属性字段名
 * @param {string} [params.fuzzyValue] - 模糊匹配值
 * @param {string} [params.spatialOperator] - 空间算子（Intersects/Within/BBOX）
 * @param {string} [params.gmlGeometry] - GML 3.2 几何 XML 片段
 * @param {number} [params.maxFeatures=500] - 最大返回要素数
 * @returns {string} 完整 XML 字符串
 */
export function buildQueryXml(params) {
  params = params || {};
  var typeName = params.typeName || '';
  var propertyName = params.propertyName || '';
  var fuzzyValue = params.fuzzyValue || '';
  var spatialOperator = params.spatialOperator || '';
  var gmlGeometry = params.gmlGeometry || '';
  var geometryPropertyName = params.geometryPropertyName || 'geometry';
  var maxFeatures = params.maxFeatures || 500;

  var hasAttr = !!(propertyName && fuzzyValue);
  var hasSpatial = !!(spatialOperator && gmlGeometry);

  var filterContent = '';

  if (hasAttr && hasSpatial) {
    filterContent = '      <fes:And>\n' +
      buildPropertyIsLike(propertyName, fuzzyValue) + '\n' +
      buildSpatialFilter(spatialOperator, gmlGeometry, geometryPropertyName) + '\n' +
      '      </fes:And>';
  } else if (hasAttr) {
    filterContent = buildPropertyIsLike(propertyName, fuzzyValue);
  } else if (hasSpatial) {
    filterContent = buildSpatialFilter(spatialOperator, gmlGeometry, geometryPropertyName);
  } else {
    // 无任何过滤条件，返回空（不应出现）
    return '';
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<GetFeature xmlns="http://www.opengis.net/wfs/2.0"\n' +
    '            xmlns:fes="http://www.opengis.net/fes/2.0"\n' +
    '            xmlns:gml="http://www.opengis.net/gml/3.2"\n' +
    '            service="WFS"\n' +
    '            version="2.0.0"\n' +
    '            outputFormat="application/json"\n' +
    '            count="' + maxFeatures + '">\n' +
    '  <Query typeNames="' + escapeXml(typeName) + '">\n' +
    '    <fes:Filter>\n' +
    filterContent + '\n' +
    '    </fes:Filter>\n' +
    '  </Query>\n' +
    '</GetFeature>';
}

/**
 * 执行 WFS 查询
 *
 * @param {string} wfsBaseUrl - WFS 服务根 URL
 * @param {object} queryParams - 同 buildQueryXml 的参数
 * @param {number} [timeout=15000] - 超时时间（毫秒）
 * @returns {Promise<object>} { features: Array, totalCount: number, error: string|null }
 */
export async function executeQuery(wfsBaseUrl, queryParams, timeout) {
  timeout = timeout || 15000;

  if (!wfsBaseUrl) {
    return { features: [], totalCount: 0, error: 'WFS 服务地址为空' };
  }

  var xmlBody = buildQueryXml(queryParams);
  if (!xmlBody) {
    return { features: [], totalCount: 0, error: '请至少设置属性查询条件或绘制空间查询区域' };
  }

  // 调试日志
  console.log('[WfsQueryService] POST URL:', wfsBaseUrl);
  console.log('[WfsQueryService] Request XML:\n', xmlBody);

  try {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, timeout);

    var response = await fetch(wfsBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json, application/geo+json, */*'
      },
      body: xmlBody,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      var errorText = '';
      try {
        errorText = await response.text();
      } catch (e) { /* ignore */ }
      console.error('[WfsQueryService] HTTP ' + response.status + ':', errorText.substring(0, 500));
      return { features: [], totalCount: 0, error: 'HTTP ' + response.status + ': ' + (errorText.substring(0, 200) || response.statusText) };
    }

    var contentType = response.headers.get('content-type') || '';

    if (contentType.indexOf('application/json') >= 0 || contentType.indexOf('geo+json') >= 0) {
      // GeoJSON 响应
      var geojson = await response.json();

      if (geojson && geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
        console.log('[WfsQueryService] 查询成功，返回 ' + geojson.features.length + ' 条要素');
        return { features: geojson.features, totalCount: geojson.features.length, error: null, rawResponse: geojson };
      }

      // WFS 有时返回空的特性集合
      if (geojson && geojson.features && geojson.features.length === 0) {
        return { features: [], totalCount: 0, error: null };
      }

      console.warn('[WfsQueryService] 响应格式异常:', geojson);
      return { features: [], totalCount: 0, error: 'WFS 响应格式异常' };
    }

    // XML 响应 — 可能是 ServiceExceptionReport 或其他
    var xmlText = await response.text();
    console.log('[WfsQueryService] XML 响应:', xmlText.substring(0, 500));

    // 检查是否为 ServiceExceptionReport
    if (xmlText.indexOf('ServiceExceptionReport') >= 0 || xmlText.indexOf('ExceptionReport') >= 0) {
      var exMatch = xmlText.match(/ExceptionText="([^"]+)"/) || xmlText.match(/<ExceptionText>([^<]+)<\/ExceptionText>/);
      var exMsg = exMatch ? exMatch[1] : 'WFS 服务异常';
      return { features: [], totalCount: 0, error: exMsg };
    }

    // 尝试从 XML 中提取 GeoJSON（某些服务会内嵌）
    var jsonMatch = xmlText.match(/\{[\s\S]*"type"\s*:\s*"FeatureCollection"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        var embeddedJson = JSON.parse(jsonMatch[0]);
        if (embeddedJson && embeddedJson.features) {
          return { features: embeddedJson.features, totalCount: embeddedJson.features.length, error: null };
        }
      } catch (e) { /* ignore */ }
    }

    return { features: [], totalCount: 0, error: 'WFS 服务返回了非预期格式的响应' };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[WfsQueryService] 请求超时');
      return { features: [], totalCount: 0, error: '请求超时（' + (timeout / 1000) + '秒）' };
    }
    console.error('[WfsQueryService] 请求失败:', err.message || err);
    return { features: [], totalCount: 0, error: '请求失败: ' + (err.message || '网络错误') };
  }
}

/**
 * 从 GeoJSON Feature 中提取属性字段名列表
 * @param {Array} features - GeoJSON Feature 数组
 * @returns {string[]} 字段名数组
 */
export function extractFieldNames(features) {
  if (!features || features.length === 0) return [];
  var first = features[0];
  if (first && first.properties) {
    return Object.keys(first.properties);
  }
  return [];
}

/**
 * 通过 WFS DescribeFeatureType 请求获取字段列表
 * @param {string} wfsBaseUrl - WFS 服务根 URL
 * @param {string} typeName - 图层类型名
 * @returns {Promise<string[]>} 字段名数组
 */
export async function describeFeatureType(wfsBaseUrl, typeName) {
  if (!wfsBaseUrl || !typeName) return { fields: [], geometryPropertyName: null };

  var url = wfsBaseUrl + '?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=2.0.0&TYPENAME=' + encodeURIComponent(typeName);

  try {
    var response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    var xmlText = await response.text();

    // 解析 XSD XML，提取 element name 作为字段名
    var fields = [];
    var geometryPropertyName = null;
    var nameRegex = /name="([^"]+)"/g;
    var match;

    // 用于检测几何类型字段的正则（匹配 type 属性中的 gml 几何类型）
    var geomTypeRegex = /name="([^"]+)"\s+type="([^"]+)"/g;
    var geomMatch;

    // 常见的几何类型名称
    var geomTypes = ['gml:PointPropertyType', 'gml:MultiPointPropertyType',
      'gml:LineStringPropertyType', 'gml:MultiLineStringPropertyType',
      'gml:PolygonPropertyType', 'gml:MultiPolygonPropertyType',
      'gml:MultiSurfacePropertyType', 'gml:MultiGeometryPropertyType',
      'gml:GeometryPropertyType', 'gml:SurfacePropertyType',
      'gml:CurvePropertyType', 'gml:MultiCurvePropertyType'];

    // 先尝试检测几何字段
    while ((geomMatch = geomTypeRegex.exec(xmlText)) !== null) {
      var fieldName = geomMatch[1];
      var fieldType = geomMatch[2];
      // 检查类型是否为几何类型
      for (var g = 0; g < geomTypes.length; g++) {
        if (fieldType.indexOf(geomTypes[g].replace('gml:', '')) >= 0 ||
            fieldType === geomTypes[g]) {
          geometryPropertyName = fieldName;
          break;
        }
      }
      if (geometryPropertyName) break;
    }

    // 如果没找到明确的几何类型，尝试按命名惯例检测
    if (!geometryPropertyName) {
      var commonGeomNames = ['the_geom', 'geom', 'shape', 'wkb_geometry', 'geo', 'location', 'coordinates'];
      while ((match = nameRegex.exec(xmlText)) !== null) {
        var name = match[1];
        if (name.indexOf(':') >= 0) {
          name = name.split(':').pop();
        }
        for (var c = 0; c < commonGeomNames.length; c++) {
          if (name.toLowerCase() === commonGeomNames[c]) {
            geometryPropertyName = name;
            break;
          }
        }
        if (geometryPropertyName) break;
      }
      // 重置 regex 的 lastIndex
      nameRegex.lastIndex = 0;
    }

    // 提取属性字段
    while ((match = nameRegex.exec(xmlText)) !== null) {
      var name = match[1];
      if (name.indexOf(':') >= 0) {
        name = name.split(':').pop();
      }
      // 排除常见系统字段和几何字段
      if (name && name !== typeName &&
          name !== geometryPropertyName &&
          name !== 'geometry' && name !== 'the_geom' &&
          name.toLowerCase().indexOf('type') < 0) {
        if (fields.indexOf(name) < 0) fields.push(name);
      }
    }

    if (geometryPropertyName) {
      console.log('[WfsQueryService] 发现几何字段名: ' + geometryPropertyName);
    }

    return { fields: fields, geometryPropertyName: geometryPropertyName };
  } catch (e) {
    console.warn('[WfsQueryService] DescribeFeatureType 失败:', e.message);
    return { fields: [], geometryPropertyName: null };
  }
}

/**
 * 通过请求少量要素来获取字段列表（回退方案）
 * @param {string} wfsBaseUrl - WFS 服务根 URL
 * @param {string} typeName - 图层类型名
 * @returns {Promise<string[]>} 字段名数组
 */
export async function discoverFieldsViaSample(wfsBaseUrl, typeName) {
  var xmlBody = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<GetFeature xmlns="http://www.opengis.net/wfs/2.0"\n' +
    '            service="WFS" version="2.0.0"\n' +
    '            outputFormat="application/json" count="1">\n' +
    '  <Query typeNames="' + escapeXml(typeName) + '"/>\n' +
    '</GetFeature>';

  try {
    var response = await fetch(wfsBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlBody,
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) {
      var json = await response.json();
      if (json && json.features && json.features.length > 0) {
        return extractFieldNames(json.features);
      }
    }
  } catch (e) {
    console.warn('[WfsQueryService] discoverFieldsViaSample 失败:', e.message);
  }
  return [];
}

/**
 * 从 GeoJSON Feature 中推测几何属性名
 * GeoJSON Feature 的 geometry 字段没有直接的属性名映射，
 * 所以通过 DescribeFeatureType 来获取。
 * 这个函数是对 describeFeatureType 的便捷包装，仅返回几何属性名。
 *
 * @param {string} wfsBaseUrl - WFS 服务根 URL
 * @param {string} typeName - 图层类型名
 * @returns {Promise<string|null>} 几何属性名，获取失败返回 null
 */
export async function discoverGeometryPropertyName(wfsBaseUrl, typeName) {
  try {
    var result = await describeFeatureType(wfsBaseUrl, typeName);
    return result.geometryPropertyName || null;
  } catch (e) {
    console.warn('[WfsQueryService] discoverGeometryPropertyName 失败:', e.message);
    return null;
  }
}
