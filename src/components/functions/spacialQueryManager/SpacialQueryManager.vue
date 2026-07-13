<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="520"
    :panel-max-height="'75vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="spacialQueryManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'SpacialQueryManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'SpacialQueryManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    :header-tools="[
      { key: 'showToolbar', label: '查询工具', defaultVisible: true },
      { key: 'showResults', label: '查询历史', defaultVisible: true }
    ]"
    @section-toggle="onHeaderToolToggle"
  >
    <!-- ========== 工具栏 ========== -->
    <template #toolbar-extra>
      <!-- 可查询图层选择器（WFS / GeoJSON 矢量图层） -->
      <div class="toolbar-group">
        <select v-model="selectedLayerId" class="layer-select" @change="onLayerChange" @mousedown="refreshVisibleLayers" @focus="refreshVisibleLayers">
          <option value="">-- 全部图层 --</option>
          <option value="" disabled>────────── 指定图层 ──────────</option>
          <option v-for="layer in visibleQueryableLayers" :key="layer.id" :value="layer.id">
            {{ layer.name }} [{{ layer.layerType.toUpperCase() }}]
          </option>
        </select>
      </div>

      <span class="toolbar-sep"></span>

      <!-- 绘图工具按钮组 -->
      <div class="toolbar-group">
        <CesiumToolbarButton icon="📍" label="点" tooltip="点缓冲区查询" :active="activeTool === 'point'" @click="activateTool('point')"  />
        <CesiumToolbarButton icon="📏" label="线" tooltip="线缓冲区查询" :active="activeTool === 'line'" @click="activateTool('line')"  />
        <CesiumToolbarButton icon="⭕" label="圆" tooltip="圆形查询" :active="activeTool === 'circle'" @click="activateTool('circle')"  />
        <CesiumToolbarButton icon="🔲" label="矩形" tooltip="矩形查询" :active="activeTool === 'rectangle'" @click="activateTool('rectangle')"  />
        <CesiumToolbarButton icon="⬢" label="多边形" tooltip="多边形查询" :active="activeTool === 'polygon'" @click="activateTool('polygon')"  />
      </div>

      <span class="toolbar-sep"></span>

      <!-- 空间算子选择器 -->
      <div class="toolbar-group">
        <select v-model="spatialOperator" class="operator-select" >
          <option value="Intersects">相交 (Intersects)</option>
          <option value="Within">包含于 (Within)</option>
          <option value="Contains">包含 (Contains)</option>
          <option value="BBOX">边界框 (BBOX)</option>
        </select>
      </div>

      <span class="toolbar-sep"></span>

      <!-- 查询按钮 -->
      <CesiumToolbarButton icon="🔍" label="查询" tooltip="执行空间属性组合查询" @click="executeQuery" :disabled="!canQuery" />
      <CesiumToolbarButton icon="🗑️" label="清除" tooltip="清除绘制图形和查询结果" @click="clearAll" />
    </template>

    <!-- ========== 列表前区域：查询条件 + 结果面板 ========== -->
    <template #before-list>
      <!-- 缓冲区半径（点/线模式） -->
      <div v-if="activeTool === 'point' || activeTool === 'line'" class="buffer-config">
        <label>缓冲区半径（米）:</label>
        <input v-model.number="bufferRadius" type="number" min="10" max="100000" step="100" class="buffer-input" />
      </div>

      <!-- 当前绘图提示 -->
      <div v-if="activeTool" class="drawing-hint">
        <span class="hint-icon">{{ toolLabels[activeTool] ? toolLabels[activeTool].split(' ')[0] : '📍' }}</span>
        <span>正在绘制{{ getToolName(activeTool) }}，在地图上操作...</span>
        <button class="cancel-draw-btn" @click="deactivateTool" type="button">取消</button>
      </div>

      <!-- 当前绘制图形信息 -->
      <div v-if="drawnGeometry && !activeTool" class="drawn-info">
        <span class="drawn-icon">✅</span>
        <span>{{ getGeometrySummary() }}</span>
      </div>

      <!-- 属性查询条件 -->
      <div class="attr-query-row" v-if="selectedLayerId">
        <div class="attr-col">
          <label class="attr-label">字段：</label>
          <select v-model="selectedField" class="field-select" :disabled="!selectedLayerId || availableFields.length === 0">
            <option value="">-- 选择字段 --</option>
            <option v-for="field in availableFields" :key="field" :value="field">{{ field }}</option>
          </select>
        </div>
        <div class="attr-col">
          <label class="attr-label">模糊值：</label>
          <input v-model="fuzzyValue" class="fuzzy-input" type="text" placeholder="如：黄河" :disabled="!selectedField" @keyup.enter="executeQuery" />
        </div>
        <CesiumToolbarButton v-if="selectedField && fuzzyValue" icon="🔍" label="" tooltip="按属性查询" @click="executeQuery" :disabled="!canAttrQuery" />
      </div>

      <!-- 字段发现状态 -->
      <div v-if="fieldsLoading" class="fields-status loading">正在获取字段列表...</div>
      <div v-else-if="selectedLayerId && availableFields.length === 0 && !fieldsLoading" class="fields-status">
        暂无字段信息（可尝试手动输入字段名，或直接进行空间查询）
      </div>

      <!-- 查询结果面板 -->
      <QueryResultPanel
        ref="resultPanel"
        :results="queryResults"
        :loading="queryLoading"
        :error="queryError"
        :layer-name="currentLayerName"
        :retryable="true"
        :highlighted-index="_blinkIndex"
        @fly-to="toggleHighlightFeature"
        @locate="flyToFeature"
        @retry="executeQuery"
        @clear-highlight="clearHighlights"
      />

      <!-- 查询历史列表 -->
      <div v-if="showHistorySection && queryHistory.length > 0" class="history-section">
        <div class="history-header">查询历史 ({{ queryHistory.length }})</div>
        <div v-for="(item, idx) in queryHistory" :key="item.id" class="history-item">
          <div class="history-info">
            <span class="history-type">{{ getTypeLabel(item.type) }}</span>
            <span class="history-layer">{{ item.layerName }}</span>
            <span class="history-time">{{ formatTime(item.time) }}</span>
          </div>
          <div class="history-actions">
            <button class="history-btn" @click="replayHistory(item)" title="重绘此区域并飞至历史视角">重绘</button>
            <button class="history-btn del" @click="removeHistory(idx)" title="删除">✕</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 列表项（隐藏内置列表） ========== -->
    <template #list-item>
      <span style="display:none"></span>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import CesiumToolbarButton from '@componentsLib/CesiumToolbarButton.mjs';
import QueryResultPanel from './QueryResultPanel.vue';
import { DrawingToolManager } from './DrawingToolManager.js';
import { commonGIS } from './jsDrawLib/commonGIS.js';
import { geometryForXmlFilter, getTurf } from './TurfSpatialFilter.js';

// ═══ 纯 JS 几何工具（Turf.js 不可用时的兜底） ═══
function _bboxOfGeometry(geom) {
  var coords = [];
  function _walk(g) {
    if (!g) return;
    if (g.type === 'Point') coords.push(g.coordinates);
    else if (g.type === 'MultiPoint' || g.type === 'LineString') coords = coords.concat(g.coordinates);
    else if (g.type === 'Polygon' || g.type === 'MultiLineString') g.coordinates.forEach(function (r) { coords = coords.concat(r); });
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(function (p) { p.forEach(function (r) { coords = coords.concat(r); }); });
  }
  _walk(geom);
  if (coords.length === 0) return null;
  var xs = coords.map(function (c) { return c[0]; });
  var ys = coords.map(function (c) { return c[1]; });
  return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
}

function _pointInPolygon(pt, ring) {
  var x = pt[0], y = pt[1], inside = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function _pointsInPoly(geom, ring) {
  if (!ring) return true; // 无精确多边形则全部通过
  var coords = [];
  function _collect(g) {
    if (!g) return;
    if (g.type === 'Point') coords.push(g.coordinates);
    else if (g.type === 'MultiPoint' || g.type === 'LineString') coords = coords.concat(g.coordinates);
    else if (g.type === 'Polygon') (g.coordinates[0] || []).forEach(function (c) { coords.push(c); });
    else if (g.type === 'MultiLineString' || g.type === 'MultiPolygon') {
      g.coordinates.forEach(function (r) { (Array.isArray(r[0]) ? r : [r]).forEach(function (c) { coords = coords.concat(c); }); });
    }
  }
  _collect(geom);
  for (var i = 0; i < coords.length; i++) {
    if (_pointInPolygon(coords[i], ring)) return true;
  }
  return false;
}

function _geometryIntersects(geom, ring, bbox, qBbox) {
  // BBOX 相交是前提
  if (bbox[0] > qBbox[2] || bbox[2] < qBbox[0] || bbox[1] > qBbox[3] || bbox[3] < qBbox[1]) return false;
  if (!ring) return true;
  // 点包含或线段交点
  if (geom.type === 'Point' || geom.type === 'MultiPoint') return _pointsInPoly(geom, ring);
  // 线/面：检查顶点是否在查询区域内，以及边是否穿过查询区域
  if (_pointsInPoly(geom, ring)) return true;
  // 简单检查：查询区域的顶点是否在要素内
  for (var i = 0; i < ring.length; i++) {
    if (_pointInPolygon(ring[i], _getOuterRing(geom))) return true;
  }
  return false;
}

function _getOuterRing(geom) {
  if (geom.type === 'Polygon') return geom.coordinates[0] || [];
  if (geom.type === 'MultiPolygon' && geom.coordinates[0]) return geom.coordinates[0][0] || [];
  return [];
}

/** Cesium Entity → GeoJSON geometry（Cartesian3 → lon/lat 转换） */
function _entityToGeoJson(entity) {
  var Cesium = window.Cesium;
  if (!Cesium) return null;

  function _toLonLat(p) {
    // Cesium Cartesian3 → [lon, lat]（度）
    if (p.longitude !== undefined && p.latitude !== undefined) return [p.longitude, p.latitude]; // 已是 Cartographic/角度
    var c = Cesium.Cartographic.fromCartesian(p);
    return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)];
  }

  // Polygon
  if (entity.polygon && entity.polygon.hierarchy) {
    var hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
    if (hierarchy) {
      var rings = [];
      function _extractRing(ring) { return ring.map(_toLonLat); }
      rings.push(_extractRing(hierarchy.positions));
      if (hierarchy.holes) {
        hierarchy.holes.forEach(function (hole) { rings.push(_extractRing(hole.positions)); });
      }
      return { type: 'Polygon', coordinates: rings };
    }
  }

  // LineString
  if (entity.polyline && entity.polyline.positions) {
    var pos = entity.polyline.positions.getValue(Cesium.JulianDate.now());
    if (pos) return { type: 'LineString', coordinates: pos.map(_toLonLat) };
  }

  // Point
  if (entity.position) {
    var pt = entity.position.getValue(Cesium.JulianDate.now());
    if (pt) return { type: 'Point', coordinates: _toLonLat(pt) };
  }

  return null;
}
import {
  executeQuery as wfsExecuteQuery,
  extractBaseUrl,
  extractTypeName,
  describeFeatureType,
  discoverFieldsViaSample,
  discoverGeometryPropertyName
} from './WfsQueryService.js';
import { configRegistry } from './ConfigLoadStrategy.mjs';
import rawPanelMetadata from './SpacialQueryManager.config.json';

var panelMetadata = rawPanelMetadata;

export default {
  name: 'SpacialQueryManager',
  components: { JsonConfigPanelBase, CesiumToolbarButton, QueryResultPanel },
  props: {
    initialX: { type: [Number, String], default: 'right' },
    initialY: { type: Number, default: 280 },
    panelName: { type: String, default: null },
    autoRegister: { type: Boolean, default: true },
    panelInstanceId: { type: Number, default: null },
    registrationKey: { type: String, default: null }
  },
  data() {
    return {
      componentName: 'SpacialQueryManager',
      panelMetadata: panelMetadata,

      // 可查询图层列表（WFS + GeoJSON 矢量图层）
      queryableLayers: [],
      visibleQueryableLayers: [],  // 仅显示已勾选的（下拉列表用）
      _loadedIds: [],              // 从 LayerTreeManager 事件获取的已加载图层 ID
      selectedLayerId: '',

      // 字段
      availableFields: [],
      fieldsLoading: false,

      // 绘图
      _drawingManager: null,
      activeTool: null,
      drawnGeometry: null,

      // 重绘画布（非交互式，用于相机移动后重绘空间查询区域）
      _redrawCanvas: null,
      _drawType: null,
      _cameraMoveStartCb: null,
      _cameraMoveEndCb: null,

      // ⭐ 存储绘图时的 Cartesian3（含地形高度），用于重绘时准确反投影
      _drawCartesians: null,

      // 缓冲区半径（米）
      bufferRadius: 500,

      // 查询条件
      selectedField: '',
      fuzzyValue: '',
      spatialOperator: 'Intersects',

      // 几何字段名（从 WFS 服务自动发现，默认 "geometry"）
      geometryPropertyName: 'geometry',

      // 查询状态
      queryResults: [],
      queryLoading: false,
      queryError: null,

      // 地图高亮 entity
      _highlightEntities: [],
      // 查询历史
      queryHistory: [],
      // header-tools 分区可见性
      showHistorySection: true,
      // 闪烁高亮
      _blinkIndex: -1,
      _blinkInterval: null,
      _blinkTimeout: null,
      _blinkDataSource: null,
      _blinkEntities: [],

      toolLabels: {
        point: '📍 点',
        line: '📏 线',
        circle: '⭕ 圆',
        rectangle: '▭ 矩形',
        polygon: '⬠ 多边形'
      }
    };
  },
  computed: {
    // 是否可以执行查询（至少需要图形或属性条件之一）
    canAttrQuery() {
      return !!(this.selectedLayerId && this.selectedField && this.fuzzyValue);
    },
    canSpatialQuery() {
      return !!(this.drawnGeometry);
    },
    canQuery() {
      return !this.queryLoading && (this.drawnGeometry || (this.selectedLayerId && this.selectedField && this.fuzzyValue));
    },
    _selectedLayer() {
      var self = this;
      return this.queryableLayers.find(function (l) { return l.id === self.selectedLayerId; }) || null;
    },
    currentLayerName() {
      var layer = this._selectedLayer;
      return layer ? layer.name : '';
    },
    currentLayerBaseUrl() {
      var layer = this._selectedLayer;
      return layer ? layer.baseUrl : '';
    },
    currentLayerTypeName() {
      var layer = this._selectedLayer;
      return layer ? layer.typeName : '';
    },
    currentLayerType() {
      var layer = this._selectedLayer;
      return layer ? layer.layerType : '';
    }
  },
  created() {
    // 注册 configId 到 DataManager（与其他 Manager 保持一致的模式）
    configRegistry.registerFromMetadata(this.panelMetadata);
  },
  mounted() {
    console.log('[' + this.componentName + '] SpacialQueryManager mounted');
    this._drawingManager = new DrawingToolManager();
    this.discoverWfsLayers();

    // 动态加载 Turf.js（用于精确空间运算，buffer / booleanIntersects 等）
    if (!window.turf) {
      var turfScript = document.createElement('script');
      turfScript.src = '/data/gis/spacialQueryManager/jsDrawLib/turf.min.js';
      turfScript.onload = function () { console.log('[SpacialQueryManager] ✅ Turf.js 已加载'); };
      document.head.appendChild(turfScript);
    }

    // 监听 LayerTreeManager 的图层加载/卸载事件
    var self = this;
    this._onLayerTreeChange = function (e) {
      self._loadedIds = e.detail && e.detail.loadedIds ? e.detail.loadedIds : [];
      self.refreshVisibleLayers();
    };
    window.addEventListener('layertree-loaded-change', this._onLayerTreeChange);
  },
  beforeUnmount() {
    window.removeEventListener('layertree-loaded-change', this._onLayerTreeChange);
    this._stopBlink();
    this._cleanupCameraRedrawListeners();
    this._removeRedrawCanvas();
    this.deactivateTool();
    this.clearHighlights();
    this._clearEntityMask();
    if (this._maskCamHandler) { this._maskCamHandler.destroy(); this._maskCamHandler = null; }
    if (this._historyCamHandler) { this._historyCamHandler.destroy(); this._historyCamHandler = null; }
    if (this._drawingManager) {
      this._drawingManager.destroy();
      this._drawingManager = null;
    }
  },
  methods: {
    // ==================== header-tools 分区切换 ====================
    onHeaderToolToggle(event) {
      if (event.key === 'showResults') {
        this.showHistorySection = event.visible;
      }
    },

    // ==================== 覆盖基类：跳过 JSON 配置加载 ====================
    // SpacialQueryManager 从 LayerTreeManager 状态中发现 WFS 图层，
    // 不需要 JsonConfigPanelBase 的 configList/loadConfig 机制
    onLazyLoad(event) {
      console.log('[' + this.componentName + '] ⚡ 延迟加载触发（跳过 JSON 配置加载）', event);
      this.configList = [];
      // 从缓存恢复（如果有）
      var state = window.__panelSingletonManager__ &&
        window.__panelSingletonManager__.getPanelState(this.effectiveRegistrationKey);
      if (state && state.configList && state.configList.length > 0) {
        this.configList = state.configList;
      }
    },

    // ==================== Viewer/Cesium 访问 ====================
    getViewer() { return window && window.__cesiumViewer__; },
    getCesium() { return window && window.Cesium; },

    // ==================== WFS 图层发现 ====================
    discoverWfsLayers() {
      var self = this;
      // 优先从 PanelSingletonManager 获取 LayerTreeManager 的状态
      try {
        var panelSingleton = window.__panelSingletonManager__;
        if (panelSingleton && typeof panelSingleton.getPanelState === 'function') {
          var state = panelSingleton.getPanelState('LayerTreeManager');
          if (state && state.configList && state.configList.length > 0) {
            self._parseLayersFromConfig(state.configList);
            // 主动请求 LayerTreeManager 当前已加载图层
            window.dispatchEvent(new CustomEvent('layertree-request-state'));
            self.refreshVisibleLayers();
            if (self.queryableLayers.length > 0) {
              console.log('[' + self.componentName + '] 从 PanelSingletonManager 发现 ' + self.queryableLayers.length + ' 个可查询图层');
              return;
            }
          }
        }
      } catch (e) {
        console.warn('[' + this.componentName + '] 从 PanelSingletonManager 获取图层失败:', e);
      }

      // 回退：从静态 JSON 文件加载
      this._loadWfsLayersFromJson().then(function () {
        // 主动请求 LayerTreeManager 当前已加载图层
        window.dispatchEvent(new CustomEvent('layertree-request-state'));
        self.refreshVisibleLayers();
      });
    },

    _parseLayersFromConfig(nodes) {
      var self = this;
      self.queryableLayers = [];
      if (!nodes || !Array.isArray(nodes)) return;

      nodes.forEach(function (node) {
        if (!node || node.nodeType !== 'layer') return;

        // 本地 GeoJSON 图层（GeoJsonLayerManager 动态加载）
        var isLocalGeoJson = node._dynamicSource === 'GeoJsonLayerManager';
        if (isLocalGeoJson) {
          if (self.queryableLayers.find(function (l) { return l.id === node.id; })) return;
          self.queryableLayers.push({
            id: node.id,
            name: (node.name || node.id) + '（本地）',
            url: '',  // 无外部 URL，通过 LayerTreeManager 加载时获取数据
            layerType: 'geojson',
            baseUrl: '',
            typeName: '',
            fields: []
          });
          return;
        }

        if (!node.url) return;

        // WFS 检测
        var isWfs = node.url.indexOf('SERVICE=WFS') >= 0 ||
                    node.url.indexOf('REQUEST=GetFeature') >= 0 ||
                    node.url.indexOf('/wfs') >= 0 ||
                    node.url.indexOf('/wfsserver') >= 0;

        // GeoJSON 检测（与 LayerTreeManager 一致）
        var isGeoJson = node.url.indexOf('geojson') >= 0 ||
                        node.url.endsWith('.json') ||
                        node.url.endsWith('.geojson');

        if (!isWfs && !isGeoJson) return;

        // 避免重复
        if (self.queryableLayers.find(function (l) { return l.id === node.id; })) return;

        var entry = {
          id: node.id,
          name: node.name || node.id,
          url: node.url,
          fields: []
        };

        if (isWfs) {
          entry.layerType = 'wfs';
          entry.baseUrl = extractBaseUrl(node.url);
          entry.typeName = extractTypeName(node.url);
        } else {
          entry.layerType = 'geojson';
          entry.baseUrl = '';
          entry.typeName = '';
        }

        self.queryableLayers.push(entry);
      });
    },

    async _loadWfsLayersFromJson() {
      var self = this;
      try {
        var resp = await fetch('/data/gis/layerTreeManager/LayerTreeManager.json');
        if (!resp.ok) return;
        var nodes = await resp.json();
        if (Array.isArray(nodes)) {
          self._parseLayersFromConfig(nodes);
          console.log('[' + self.componentName + '] 从 JSON 文件发现 ' + self.queryableLayers.length + ' 个可查询图层');
        }
      } catch (e) {
        console.warn('[' + self.componentName + '] 从 JSON 文件加载可查询图层失败:', e);
      }
    },

    // ==================== 字段发现 ====================
    async onLayerChange() {
      this.clearResults();
      this.availableFields = [];
      this.geometryPropertyName = 'geometry'; // 重置为默认值

      if (!this.selectedLayerId) return;

      var layer = this.queryableLayers.find(function (l) { return l.id === this.selectedLayerId; }.bind(this));
      if (!layer) return;

      // 已有缓存的字段
      if (layer.fields && layer.fields.length > 0) {
        this.availableFields = layer.fields.slice();
        this.geometryPropertyName = layer.geometryPropertyName || 'geometry';
        return;
      }

      this.fieldsLoading = true;
      try {
        // GeoJSON 图层：直接 fetch 样本数据提取字段
        if (layer.layerType === 'geojson') {
          if (!layer.url) { this.fieldsLoading = false; return; }  // 本地图层无 URL，跳过字段发现
          var resp = await fetch(layer.url, { signal: AbortSignal.timeout(15000) });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          var data = await resp.json();
          if (data && data.features && data.features.length > 0) {
            var sampleFields = Object.keys(data.features[0].properties || {});
            layer.fields = sampleFields;
            this.availableFields = sampleFields.slice();
            this.geometryPropertyName = 'geometry';
          }
          this.fieldsLoading = false;
          return;
        }

        // WFS 图层：先尝试 DescribeFeatureType
        // 先尝试 DescribeFeatureType
        var result = await describeFeatureType(layer.baseUrl, layer.typeName);
        var fields = result ? result.fields : [];
        var geomName = result ? result.geometryPropertyName : null;

        if (!fields || fields.length === 0) {
          // 回退：请求 1 个样本要素
          fields = await discoverFieldsViaSample(layer.baseUrl, layer.typeName);
        }

        layer.fields = fields || [];
        this.availableFields = layer.fields.slice();

        // 使用发现到的几何字段名，否则保持默认 "geometry"
        if (geomName) {
          layer.geometryPropertyName = geomName;
          this.geometryPropertyName = geomName;
          console.log('[' + this.componentName + '] 发现几何字段名:', geomName);
        }

        if (this.availableFields.length > 0) {
          console.log('[' + this.componentName + '] 发现 ' + this.availableFields.length + ' 个字段:', this.availableFields.join(', '));
        }
      } catch (e) {
        console.warn('[' + this.componentName + '] 字段发现失败:', e);
      } finally {
        this.fieldsLoading = false;
      }
    },

    // ==================== 绘图工具 ====================
    activateTool(type) {
      if (this.activeTool === type) {
        this.deactivateTool();
        return;
      }

      var viewer = this.getViewer();
      if (!viewer) {
        console.warn('[' + this.componentName + '] Cesium Viewer 不可用');
        return;
      }

      // 根据绘制类型自动切换空间算子
      // rectangle 改用 Intersects：BBOX 只比较要素外接矩形，会导致"框外图形"被误命中
      var opMap = { point: 'BBOX', line: 'BBOX', circle: 'Intersects', rectangle: 'Intersects', polygon: 'Intersects' };
      if (opMap[type]) this.spatialOperator = opMap[type];

      // 先清理之前的绘制（重绘画布、监听器、图形数据）
      this._cleanupCameraRedrawListeners();
      this._removeRedrawCanvas();
      if (this._historyCamClear) { this._historyCamClear.destroy(); this._historyCamClear = null; }
      if (this._historyCamHandler) { this._historyCamHandler.destroy(); this._historyCamHandler = null; }
      if (this._historyCanvas) { try { this._historyCanvas.parentNode.removeChild(this._historyCanvas); } catch (e) {} this._historyCanvas = null; }
      this.deactivateTool();
      this.drawnGeometry = null;
      this._drawType = null;
      this._drawCartesians = null;
      this.clearResults();

      var self = this;
      this.activeTool = type;

      try {
        this._drawingManager.createDrawer(viewer, type, {
          onComplete: function (geometry) {
            self.onDrawingComplete(geometry);
          },
          bufferRadius: (type === 'point' || type === 'line') ? self.bufferRadius : 0
        });
        console.log('[' + this.componentName + '] 激活绘图工具:', type);
      } catch (e) {
        console.error('[' + this.componentName + '] 创建绘图器失败:', e);
        this.activeTool = null;
      }
    },

    deactivateTool() {
      if (this._drawingManager) {
        this._drawingManager.deactivate();
      }
      this.activeTool = null;
    },

    onDrawingComplete(geometry) {
      console.log('[' + this.componentName + '] 绘图完成:', geometry);
      this.drawnGeometry = geometry;
      var drawType = this.activeTool; // 保存绘制类型
      this._drawType = drawType;
      this.activeTool = null;

      // ⭐ 捕获含地形高度的 Cartesian3，用于重绘时准确反投影（避免 terrain parallax）
      if (this._drawingManager && this._drawingManager._activeDrawer) {
        var drawer = this._drawingManager._activeDrawer;
        var rawCarts = drawer.getCartesians ? drawer.getCartesians() : null;
        if (rawCarts) {
          this._drawCartesians = rawCarts.filter(function(c) { return c && window.Cesium.defined(c); });
        }
      }

      // 启动相机变化处理——首次交互存入历史，moveEnd 后重绘空间查询区域
      this._setupPostDrawHandlers(geometry, drawType);

      // 绘图完成后自动执行查询
      console.log('[SM] 绘图完成，nextTick 执行查询...');
      this.$nextTick(function () {
        console.log('[SM] nextTick 回调，调用 executeQuery');
        this.executeQuery();
      }.bind(this));
    },

    _hideCanvasOnCameraMove() {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      var dm = this._drawingManager;
      if (!viewer || !Cesium || !dm || !dm._activeDrawer) return;
      var canvas = dm._activeDrawer.canvas;
      if (!canvas) return;

      var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      var hidden = false;
      function hide() {
        if (!hidden && canvas.parentNode) {
          hidden = true;
          canvas.parentNode.removeChild(canvas);
          handler.destroy();
        }
      }
      handler.setInputAction(hide, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(hide, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      handler.setInputAction(hide, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      handler.setInputAction(hide, Cesium.ScreenSpaceEventType.WHEEL);
      this._maskCamHandler = handler;
    },

    _addEntityMask(geometry) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !geometry) return;
      this._clearEntityMask();
      var flat = this._geomToFlatArray(geometry);
      if (!flat || flat.length < 6) return;

      // 优先使用 drawer 保存的完整 Cartesian3（含高度，确保投影可逆）
      var dm = this._drawingManager;
      var holePositions;
      if (dm && dm._activeDrawer && dm._activeDrawer.getCartesians) {
        var carts = dm._activeDrawer.getCartesians();
        var valid = carts.filter(function (c) { return Cesium.defined(c); });
        if (valid.length >= 3) {
          var closed = valid.slice();
          closed.push(valid[0]);
          holePositions = closed;
        }
      }
      if (!holePositions) {
        holePositions = Cesium.Cartesian3.fromDegreesArray(flat);
      }
      console.log('[Entity遮罩] holePositions:', holePositions.length, 'points');

      // 基于洞的包围盒计算外环（避开 antimeridian/极点问题）
      var minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (var i = 0; i < flat.length; i += 2) {
        if (flat[i] < minLon) minLon = flat[i];
        if (flat[i] > maxLon) maxLon = flat[i];
        if (flat[i + 1] < minLat) minLat = flat[i + 1];
        if (flat[i + 1] > maxLat) maxLat = flat[i + 1];
      }
      var margin = 90;
      var oMinLon = Math.max(-179, minLon - margin);
      var oMaxLon = Math.min(179, maxLon + margin);
      var oMinLat = Math.max(-89, minLat - margin);
      var oMaxLat = Math.min(89, maxLat + margin);
      var outerFlat = [oMinLon, oMinLat, oMaxLon, oMinLat, oMaxLon, oMaxLat, oMinLon, oMaxLat];
      var outerRing = Cesium.Cartesian3.fromDegreesArray(outerFlat);

      var maskEntity = new Cesium.Entity({
        id: 'myMaskPolygon',
        polygon: {
          hierarchy: {
            positions: outerRing,
            holes: [{ positions: holePositions }]
          },
          material: Cesium.Color.fromAlpha(Cesium.Color.fromBytes(15, 38, 84), 0.7)
        }
      });

      var holeClosed = flat.slice();
      holeClosed.push(flat[0], flat[1]);
      var lineEntity = new Cesium.Entity({
        id: 'myMaskPolyline',
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(holeClosed),
          width: 3,
          material: Cesium.Color.YELLOW
        }
      });

      viewer.entities.add(maskEntity);
      viewer.entities.add(lineEntity);
    },

    _geomToFlatArray(geometry) {
      var flat = [];
      var buf = 0.001;
      if (geometry.type === 'Point') {
        var lon = geometry.coordinates[0], lat = geometry.coordinates[1];
        var r = geometry.radius ? geometry.radius / 111320 : buf;
        for (var i = 0; i <= 32; i++) {
          var a = (i / 32) * Math.PI * 2;
          flat.push(lon + r * Math.cos(a), lat + r * Math.sin(a) * Math.cos(lat * Math.PI / 180));
        }
      } else if (geometry.type === 'LineString') {
        var pts = geometry.coordinates;
        for (var j = 0; j < pts.length; j++) flat.push(pts[j][0], pts[j][1]);
        for (var k = pts.length - 1; k >= 0; k--)
          flat.push(pts[k][0] + buf / Math.cos(pts[k][1] * Math.PI / 180), pts[k][1] + buf);
      } else if (geometry.type === 'Polygon') {
        var ring = geometry.coordinates[0];
        for (var m = 0; m < ring.length; m++) flat.push(ring[m][0], ring[m][1]);
      }
      return flat.length >= 6 ? flat : null;
    },

    _clearEntityMask() {
      var viewer = this.getViewer();
      if (!viewer) return;
      ['myMaskPolygon', 'myMaskPolyline'].forEach(function (id) {
        var e = viewer.entities.getById(id);
        if (e) viewer.entities.remove(e);
      });
    },

    _listenCameraMoveToHideCanvas() {
      var self = this;
      var viewer = this.getViewer();
      if (!viewer || !this._drawingManager || !this._drawingManager._activeDrawer) return;
      var drawer = this._drawingManager._activeDrawer;
      var canvas = drawer.canvas;
      if (!canvas) return;
      var handler = new (this.getCesium()).ScreenSpaceEventHandler(viewer.scene.canvas);
      var hidden = false;
      handler.setInputAction(function () {
        if (!hidden && canvas.parentNode) {
          hidden = true;
          canvas.parentNode.removeChild(canvas);
          handler.destroy();
        }
      }, (this.getCesium()).ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(function () {
        if (!hidden && canvas.parentNode) {
          hidden = true;
          canvas.parentNode.removeChild(canvas);
          handler.destroy();
        }
      }, (this.getCesium()).ScreenSpaceEventType.MIDDLE_DOWN);
      handler.setInputAction(function () {
        if (!hidden && canvas.parentNode) {
          hidden = true;
          canvas.parentNode.removeChild(canvas);
          handler.destroy();
        }
      }, (this.getCesium()).ScreenSpaceEventType.RIGHT_DOWN);
      // 滚轮缩放
      handler.setInputAction(function (delta) {
        if (!hidden && canvas.parentNode) {
          hidden = true;
          canvas.parentNode.removeChild(canvas);
          handler.destroy();
        }
      }, (this.getCesium()).ScreenSpaceEventType.WHEEL);
      this._maskCameraHandler = handler;
    },

    // ==================== 反遮罩（使用已验证的 commonGIS.addMaskPolygon） ====================
    addMaskPolygon(geometry) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !geometry) return;

      // 先清除旧遮罩

      // GeoJSON geometry → Cesium Cartesian3 数组
      var positions = this._geomToCartesian3Array(geometry, Cesium);
      if (!positions || positions.length < 3) return;

      // 使用参考项目已验证的遮罩函数
      commonGIS.addMaskPolygon(viewer, positions, false);

      // 记录遮罩 entity 以便后续清除
      this._maskEntities = [
        viewer.entities.getById('myMaskPolygon'),
        viewer.entities.getById('myMaskPolyline')
      ].filter(Boolean);
    },

    _geomToCartesian3Array(geometry, Cesium) {
      var flat = [];
      var buf = 0.001; // ~100m

      if (geometry.type === 'Point') {
        var lon = geometry.coordinates[0], lat = geometry.coordinates[1];
        var r = geometry.radius ? geometry.radius / 111320 : buf;
        var n = 32;
        for (var i = 0; i <= n; i++) {
          var a = (i / n) * Math.PI * 2;
          flat.push(lon + r * Math.cos(a), lat + r * Math.sin(a) * Math.cos(lat * Math.PI / 180));
        }
      } else if (geometry.type === 'LineString') {
        var pts = geometry.coordinates;
        for (var j = 0; j < pts.length; j++) flat.push(pts[j][0], pts[j][1]);
        for (var k = pts.length - 1; k >= 0; k--) {
          flat.push(pts[k][0] + buf / Math.cos(pts[k][1] * Math.PI / 180), pts[k][1] + buf);
        }
      } else if (geometry.type === 'Polygon') {
        var ring = geometry.coordinates[0];
        for (var m = 0; m < ring.length; m++) flat.push(ring[m][0], ring[m][1]);
      }

      if (flat.length < 6) return null;
      return Cesium.Cartesian3.fromDegreesArray(flat);
    },

    clearMask() {
      var viewer = this.getViewer();
      if (!viewer) return;
      var ids = ['myMaskPolygon', 'myMaskPolyline'];
      ids.forEach(function (id) {
        var e = viewer.entities.getById(id);
        if (e) viewer.entities.remove(e);
      });
      this._maskEntities = null;
    },

    getToolName(type) {
      var map = { point: '点', line: '折线', circle: '圆', rectangle: '矩形', polygon: '多边形' };
      return map[type] || type;
    },

    getGeometrySummary() {
      if (!this.drawnGeometry) return '无';
      var type = this.drawnGeometry.type;
      switch (type) {
        case 'Point': return '点 (' + this.drawnGeometry.coordinates[0].toFixed(6) + ', ' + this.drawnGeometry.coordinates[1].toFixed(6) + ')' + (this.drawnGeometry.radius ? ' 半径 ' + Math.round(this.drawnGeometry.radius) + 'm' : '');
        case 'LineString': return '折线 (' + this.drawnGeometry.coordinates.length + ' 点)';
        case 'Polygon': return '多边形 (' + this.drawnGeometry.coordinates[0].length + ' 顶点)';
        default: return type;
      }
    },

    // ==================== 查询 ====================
    async executeQuery() {
      console.log('[SM] executeQuery canQuery=' + this.canQuery + ' selId=' + (this.selectedLayerId || '(all)') + ' hasGeom=' + !!this.drawnGeometry);
      if (!this.canQuery) return;

      // 取消上一次全部图层查询（如果有）
      if (this._allQueryAbort) { try { this._allQueryAbort.abort(); } catch (e) {} }

      // 未选图层 → 查询全部可查询图层
      if (!this.selectedLayerId) {
        return this._executeAllLayersQuery();
      }

      var layer = this._selectedLayer;
      if (!layer) { this.queryError = '未找到选中图层'; return; }

      // GeoJSON 图层走客户端本地过滤
      if (layer.layerType === 'geojson') {
        return this._executeGeoJsonQuery(layer);
      }

      // WFS 图层走服务端 XML Filter
      var baseUrl = layer.baseUrl;
      var typeName = layer.typeName;

      if (!baseUrl || !typeName) {
        this.queryError = '无法解析 WFS 图层地址或类型名';
        return;
      }

      this.queryLoading = true;
      this.queryError = null;
      this.queryResults = [];
      this.clearHighlights();

      try {
        var gmlGeom = '';
        var drawingType = this._drawType || this._detectDrawingType();

        if (this.drawnGeometry) {
          var filterResult = geometryForXmlFilter(drawingType, this.drawnGeometry, this.bufferRadius);
          if (filterResult && filterResult.gml) {
            gmlGeom = filterResult.gml;
          }
        }

        var queryParams = {
          typeName: typeName,
          propertyName: this.selectedField || '',
          fuzzyValue: this.fuzzyValue || '',
          spatialOperator: gmlGeom ? this.spatialOperator : '',
          gmlGeometry: gmlGeom,
          geometryPropertyName: this.geometryPropertyName || 'geometry'
        };

        var result = await wfsExecuteQuery(baseUrl, queryParams, 15000);

        if (result.error) {
          this.queryError = result.error;
        } else {
          this.queryResults = result.features || [];
          if (this.queryResults.length > 0) {
            this.highlightFeaturesOnMap(this.queryResults);
          }
        }
      } catch (e) {
        this.queryError = '查询异常: ' + (e.message || e);
        console.error('[' + this.componentName + '] 查询异常:', e);
      } finally {
        this.queryLoading = false;
      }
    },

    /**
     * GeoJSON 图层查询：fetch 全量数据 → 客户端本地过滤
     */
    async _executeGeoJsonQuery(layer) {
      this.queryLoading = true;
      this.queryError = null;
      this.queryResults = [];
      this.clearHighlights();

      try {
        console.log('[SM] _executeGeoJsonQuery layer="' + layer.name + '" url=' + (layer.url || '(empty)'));
        // 本地图层无 URL → 从 Cesium entities 提取
        if (!layer.url) {
          console.log('[SM] 本地图层，从 Cesium entities 提取...');
          var localFeatures = this._queryLocalEntities(layer);
          console.log('[SM] 本地实体提取结果: ' + localFeatures.length + ' 个');
          this.queryResults = localFeatures;
          if (this.queryResults.length > 0) this.highlightFeaturesOnMap(this.queryResults);
          this.queryLoading = false;
          return;
        }

        var resp = await fetch(layer.url, { signal: AbortSignal.timeout(30000) });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var data = await resp.json();
        if (!data || !data.features) throw new Error('返回数据非 FeatureCollection');
        console.log('[SpacialQueryManager] GeoJSON 全量数据: ' + data.features.length + ' 个要素');

        var features = this._filterFeaturesLocally(data.features);

        this.queryResults = features;
        if (this.queryResults.length > 0) {
          this.highlightFeaturesOnMap(this.queryResults);
        }
      } catch (e) {
        this.queryError = 'GeoJSON 查询异常: ' + (e.message || e);
        console.error('[SpacialQueryManager] GeoJSON 查询异常:', e);
      } finally {
        this.queryLoading = false;
      }
    },

    /**
     * 查询全部图层：只查询 LayerTreeManager 中已勾选（visible=1）的图层
     */
    async _executeAllLayersQuery() {
      if (this._allQueryAbort) {
        try { this._allQueryAbort.abort(); } catch (e) {}
      }
      this._allQueryAbort = new AbortController();
      var abortSignal = this._allQueryAbort.signal;

      var MAX_TOTAL = 500;
      var MAX_HIGHLIGHT = 300;

      // 使用事件驱动的 _loadedIds（由 LayerTreeManager dispatch 更新）
      var visibleIds = this._loadedIds;

      // 过滤出已勾选的可查询图层
      var layers = this.queryableLayers;
      if (visibleIds.length > 0) {
        layers = layers.filter(function (l) { return visibleIds.indexOf(l.id) >= 0; });
      }

      console.log('[SpacialQueryManager] 🔍 查询开始：' + layers.length + ' 个可见图层（共 ' + this.queryableLayers.length + ' 个可查询）');

      if (layers.length === 0) {
        this.queryError = '没有勾选任何可查询图层（请在 LayerTreeManager 中勾选 WFS 或 GeoJSON 图层）';
        return;
      }

      this.queryLoading = true;
      this.queryError = null;
      this.queryResults = [];
      this.clearHighlights();

      var allResults = [];
      var errors = [];
      var PER_LAYER_TIMEOUT = 8000;

      for (var i = 0; i < layers.length; i++) {
        if (abortSignal.aborted) break;

        if (allResults.length >= MAX_TOTAL) {
          console.log('[SpacialQueryManager] ⏹ 已达总数上限 ' + MAX_TOTAL + '，跳过剩余图层');
          break;
        }

        var layer = layers[i];
        this.queryError = '查询中... (' + (i + 1) + '/' + layers.length + ') ' + layer.name;

        try {
          // 为每个图层创建独立超时
          var layerAbort = new AbortController();
          var timeoutId = setTimeout(function () { layerAbort.abort(); }, PER_LAYER_TIMEOUT);

          // 如果外部取消，联动取消当前图层
          var onAbort = function () { layerAbort.abort(); };
          abortSignal.addEventListener('abort', onAbort, { once: true });

          var features;
          if (layer.layerType === 'geojson') {
            features = await this._querySingleGeoJsonLayer(layer, layerAbort.signal);
          } else {
            features = await this._querySingleWfsLayer(layer, layerAbort.signal);
          }

          clearTimeout(timeoutId);
          abortSignal.removeEventListener('abort', onAbort);

          if (features && features.length > 0) {
            // 截断到总数上限
            var remaining = MAX_TOTAL - allResults.length;
            if (features.length > remaining) features = features.slice(0, remaining);

            features.forEach(function (f) {
              f._sourceLayer = layer.name;
              f._sourceLayerId = layer.id;
            });
            allResults = allResults.concat(features);
            this.queryResults = allResults.slice();
            console.log('[SpacialQueryManager] ' + layer.name + ': ' + features.length + ' 个结果（累计 ' + allResults.length + '）');
          }
        } catch (e) {
          clearTimeout(timeoutId);
          var errMsg = (e.name === 'AbortError') ? '超时或取消' : (e.message || '未知错误');
          errors.push(layer.name + ': ' + errMsg);
          continue;
        }
      }

      this.queryLoading = false;

      if (abortSignal.aborted) {
        this.queryError = null;
        return;
      }

      if (errors.length > 0) {
        console.warn('[SpacialQueryManager] 部分图层查询失败:', errors);
      }

      // 高亮：最多 MAX_HIGHLIGHT 个，防止 Cesium 卡死
      var highlightFeatures = allResults.length > MAX_HIGHLIGHT
        ? allResults.slice(0, MAX_HIGHLIGHT)
        : allResults;

      if (allResults.length === 0) {
        this.queryError = errors.length > 0
          ? '所有图层均无结果（' + errors.length + ' 个失败）'
          : '所有图层均无匹配结果';
      } else {
        this.queryError = null;  // 有结果时不显示错误，让结果列表展示
        var infoMsg = '找到 ' + allResults.length + ' 个结果';
        if (allResults.length > MAX_HIGHLIGHT) infoMsg += '（仅高亮前 ' + MAX_HIGHLIGHT + ' 个）';
        if (allResults.length >= MAX_TOTAL) infoMsg += '（已达上限）';
        if (errors.length > 0) infoMsg += '，' + errors.length + ' 个图层失败';
        console.log('[SpacialQueryManager] ✅ ' + infoMsg);
        this.highlightFeaturesOnMap(highlightFeatures);
      }
    },

    /** 查询单个 GeoJSON 图层 */
    async _querySingleGeoJsonLayer(layer, signal) {
      // 本地图层（无外部 URL）：从 Cesium entities 提取数据
      if (!layer.url) {
        return this._queryLocalEntities(layer);
      }
      var resp = await fetch(layer.url, { signal: signal || AbortSignal.timeout(30000) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();
      if (!data || !data.features) throw new Error('非 FeatureCollection');
      return this._filterFeaturesLocally(data.features);
    },

    /** 从 Cesium viewer 中提取已加载的本地图层实体，转为 GeoJSON features */
    _queryLocalEntities(layer) {
      var viewer = this.getViewer();
      if (!viewer) throw new Error('Cesium Viewer 不可用');

      // 从 layer.id 提取 geojsonId（格式：local-geojson-{geojsonId}）
      var geojsonId = layer.id.replace(/^local-geojson-/, '');
      var features = [];

      for (var i = 0; i < viewer.dataSources.length; i++) {
        var ds = viewer.dataSources.get(i);
        if (!ds || !ds.entities) continue;
        var dsName = ds.name || '';

        // 匹配：DataSource 名包含图层显示名 或 geojsonId
        var displayName = (layer.name || '').replace(/（Cesium实体）$/, '').replace(/（本地）$/, '');
        var match = dsName === displayName ||
                    dsName.indexOf(displayName) >= 0 ||
                    (geojsonId && dsName.indexOf(geojsonId) >= 0);

        if (match) {
          var ents = ds.entities.values;
          for (var j = 0; j < ents.length; j++) {
            var e = ents[j];
            if (!e.position && !e.polygon && !e.polyline && !e.point) continue;
            try {
              var geom = _entityToGeoJson(e);
              if (!geom) continue;
              var props = {};
              if (e.properties) {
                if (typeof e.properties.getValue === 'function') {
                  try { props = e.properties.getValue(viewer.clock.currentTime) || {}; } catch (ex) { props = e.properties; }
                } else {
                  props = e.properties;
                }
              }
              features.push({ type: 'Feature', geometry: geom, properties: props });
            } catch (ex) { /* skip malformed entity */ }
          }
          if (features.length > 0 && match) {
            console.log('[SpacialQueryManager] 从 Cesium entities 提取: ' + layer.name + ' → ' + features.length + ' 个要素');
            break;
          }
        }
      }
      // 兜底：名称匹配失败时，从全部 DataSource 提取实体
      if (features.length === 0) {
        console.log('[SM] 名称匹配失败，从全部 ' + viewer.dataSources.length + ' 个 DataSource 兜底提取...');
        for (var k = 0; k < viewer.dataSources.length; k++) {
          var ds2 = viewer.dataSources.get(k);
          if (!ds2 || !ds2.entities) continue;
          var ents2 = ds2.entities.values;
          for (var m = 0; m < ents2.length; m++) {
            var e2 = ents2[m];
            if (!e2.position && !e2.polygon && !e2.polyline && !e2.point) continue;
            try {
              var g2 = _entityToGeoJson(e2);
              if (!g2) continue;
              var p2 = {};
              if (e2.properties) {
                try { p2 = typeof e2.properties.getValue === 'function' ? (e2.properties.getValue(viewer.clock.currentTime) || {}) : e2.properties; } catch (ex) {}
              }
              features.push({ type: 'Feature', geometry: g2, properties: p2 });
            } catch (ex) {}
          }
        }
      }
      console.log('[SM] _queryLocalEntities 最终: ' + features.length + ' 个实体（空间过滤前）');
      var filtered = this._filterFeaturesLocally(features);
      console.log('[SM] _filterFeaturesLocally 后: ' + filtered.length + ' 个（空间过滤后）');
      return filtered;
    },

    /** 查询单个 WFS 图层（复用核心逻辑） */
    async _querySingleWfsLayer(layer, signal) {
      var gmlGeom = '';
      var drawingType = this._drawType || this._detectDrawingType();
      if (this.drawnGeometry) {
        var filterResult = geometryForXmlFilter(drawingType, this.drawnGeometry, this.bufferRadius);
        if (filterResult && filterResult.gml) gmlGeom = filterResult.gml;
      }

      // 几何字段名：尝试多种常见名称（不同 WFS 服务器命名不同）
      var geomNames = ['geometry', 'the_geom', 'SHAPE', 'wkb_geometry']
        .filter(function (v, i, a) { return a.indexOf(v) === i; });
      // 把当前选中的放在最前面（单图层模式已通过 DescribeFeatureType 发现）
      if (this.geometryPropertyName && geomNames.indexOf(this.geometryPropertyName) < 0) {
        geomNames.unshift(this.geometryPropertyName);
      }

      var result = null;
      // 1. 优先 POST XML Filter（尝试不同几何字段名）
      for (var gi = 0; gi < geomNames.length && !result; gi++) {
        try {
          var r = await wfsExecuteQuery(layer.baseUrl, {
            typeName: layer.typeName,
            propertyName: this.selectedField || '',
            fuzzyValue: this.fuzzyValue || '',
            spatialOperator: gmlGeom ? this.spatialOperator : '',
            gmlGeometry: gmlGeom,
            geometryPropertyName: geomNames[gi]
          }, 8000);
          if (!r.error) { result = r; layer._geometryPropertyName = geomNames[gi]; }
        } catch (e) { /* 尝试下一个 */ }
      }

      if (result && result.features) return result.features;

      // 2. GET 回退：fetch 全量数据 → 客户端本地过滤
      console.log('[SpacialQueryManager] POST 失败，GET 回退: ' + layer.name);
      var getUrl = layer.baseUrl
        + '?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0'
        + '&TYPENAMES=' + encodeURIComponent(layer.typeName)
        + '&OUTPUTFORMAT=application%2Fjson&COUNT=500';

      var resp = await fetch(getUrl, { signal: signal || AbortSignal.timeout(15000) });
      if (!resp.ok) throw new Error('GET 回退失败 HTTP ' + resp.status);
      var data = await resp.json();
      if (!data || !data.features) throw new Error('GET 回退返回非 FeatureCollection');

      // 用本地过滤处理属性+空间条件
      return this._filterFeaturesLocally(data.features);
    },

    /** 本地过滤要素（属性 + 空间，纯 JS BBOX → Turf 精确过滤） */
    _filterFeaturesLocally(features) {
      if (this.selectedField && this.fuzzyValue) {
        var field = this.selectedField;
        var val = this.fuzzyValue.toLowerCase();
        features = features.filter(function (f) {
          var propVal = f.properties && f.properties[field];
          return propVal != null && String(propVal).toLowerCase().indexOf(val) >= 0;
        });
      }
      if (this.drawnGeometry && features.length > 0) {
        var drawingType = this._drawType || this._detectDrawingType();
        // 用 Turf 构建查询几何（buffer 处理等）
        var filterResult = geometryForXmlFilter(drawingType, this.drawnGeometry, this.bufferRadius);
        var queryBbox = null; // [minX, minY, maxX, maxY]
        var queryPolyCoords = null; // 精确多边形环 [[lng,lat],...]

        if (filterResult && filterResult.geoJson) {
          var turf = getTurf();
          if (turf) {
            try { queryBbox = turf.bbox(filterResult.geoJson); } catch (e) {}
          }
          // 提取多边形坐标用于纯 JS 点包含检测
          if (filterResult.geoJson.type === 'Polygon') {
            queryPolyCoords = filterResult.geoJson.coordinates[0]; // 外环
          }
        }

        // BBOX 从绘制的矩形直接计算（作为兜底）
        if (!queryBbox && this.drawnGeometry.type === 'Polygon') {
          var ring = this.drawnGeometry.coordinates[0];
          var xs = ring.map(function (c) { return c[0]; });
          var ys = ring.map(function (c) { return c[1]; });
          queryBbox = [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
          queryPolyCoords = ring;
        }

        if (!queryBbox) return features; // 无法确定查询范围，全部通过

        console.log('[SM] 查询 BBOX: ' + JSON.stringify(queryBbox) + ' polyRings=' + (queryPolyCoords ? queryPolyCoords.length : 0) + ' input=' + features.length);

        var op = this.spatialOperator;
        var qBbox = queryBbox;
        var qPoly = queryPolyCoords;

        var _firstLogged = false;
        features = features.filter(function (f) {
          if (!f.geometry || !f.geometry.coordinates) return false;
          try {
            // BBOX 粗筛（纯 JS）
            var fb = _bboxOfGeometry(f.geometry);
            if (!_firstLogged) { _firstLogged = true; console.log('[SM] 首实体 BBOX: ' + JSON.stringify(fb) + ' type=' + f.geometry.type); }
            if (!fb) return false;
            if (fb[0] > qBbox[2] || fb[2] < qBbox[0] || fb[1] > qBbox[3] || fb[3] < qBbox[1]) return false;

            // 精确过滤：优先 Turf.js，回退纯 JS
            if (op === 'BBOX') return true;
            var turf = getTurf();
            if (turf && filterResult && filterResult.geoJson) {
              try {
                if (op === 'Within') return turf.booleanWithin(f, filterResult.geoJson);
                return turf.booleanIntersects(f, filterResult.geoJson);
              } catch (e) {}
            }
            if (op === 'Within') return _pointsInPoly(f.geometry, qPoly);
            return _geometryIntersects(f.geometry, qPoly, fb, qBbox);
          } catch (e) { return false; }
        });
      }
      return features;
    },

    _detectDrawingType() {
      if (!this.drawnGeometry) return '';

      // 通过 geometry 类型和是否有 radius 属性推断
      if (this.drawnGeometry.radius) return 'circle';
      if (this.drawnGeometry.type === 'Point') return 'point';
      if (this.drawnGeometry.type === 'LineString') return 'line';

      if (this.drawnGeometry.type === 'Polygon') {
        var coords = this.drawnGeometry.coordinates[0];
        if (!coords) return 'polygon';
        // 矩形检查：4 个角 + 闭合 = 5 点，且是矩形形状
        if (coords.length === 5) {
          // 可能是矩形也可能是简单多边形
          // 通过检查是否为正交矩形来判断
          var lons = coords.map(function (c) { return c[0]; });
          var lats = coords.map(function (c) { return c[1]; });
          var uniqueLons = lons.filter(function (v, i, a) { return a.indexOf(v) === i; });
          var uniqueLats = lats.filter(function (v, i, a) { return a.indexOf(v) === i; });
          if (uniqueLons.length === 2 && uniqueLats.length === 2) return 'rectangle';
        }
        return 'polygon';
      }

      return '';
    },

    // ==================== 结果可视化 ====================
    highlightFeaturesOnMap(features) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !features || features.length === 0) return;

      this.clearHighlights();

      // 包装为 FeatureCollection 批量加载（效率更高，Cesium 兼容性更好）
      var collection = { type: 'FeatureCollection', features: features.filter(function (f) { return f && f.geometry; }) };
      if (collection.features.length === 0) return;

      var self = this;
      try {
        var promise = Cesium.GeoJsonDataSource.load(collection, {
          stroke: Cesium.Color.fromCssColorString('#00FF00'),
          strokeWidth: 2,
          fill: Cesium.Color.fromCssColorString('#00FF00').withAlpha(0.3),
          markerColor: Cesium.Color.fromCssColorString('#00FF00'),
          markerSize: 18
        });
        if (promise && promise.then) {
          promise.then(function (ds) {
            self._highlightEntities.push(ds);
            viewer.dataSources.add(ds);
          }).catch(function (e) {
            console.warn('[SpacialQueryManager] 高亮加载失败:', e);
          });
        }
      } catch (e) {
        console.warn('[SpacialQueryManager] 高亮异常:', e);
      }
    },

    clearHighlights() {
      var viewer = this.getViewer();
      if (viewer) {
        this._highlightEntities.forEach(function (ds) {
          try {
            if (ds && !ds.isDestroyed) viewer.dataSources.remove(ds, true);
          } catch (e) { /* ignore */ }
        });
      }
      this._highlightEntities = [];
    },

    /**
     * 切换要素的高亮闪烁状态
     * 点击同一要素 → 停止闪烁；点击不同要素 → 切换闪烁目标
     */
    toggleHighlightFeature(feature, index) {
      if (this._blinkIndex === index) {
        // 同一要素 — 取消闪烁
        this._stopBlink();
        return;
      }

      // 不同要素 — 停止当前闪烁，开启新的
      this._stopBlink();
      this._startBlink(feature, index);
    },

    /**
     * 开始闪烁高亮指定要素
     */
    /**
     * 启动闪烁 — 参照 GeoJsonLayerManager：用 GeoJsonDataSource.load() 加载要素几何
     * 然后对加载出的实体调用 FlashEntityByColor 循环闪烁
     */
    _startBlink(feature, index) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !feature || !feature.geometry) {
        console.warn('[' + this.componentName + '] _startBlink: viewer/Cesium/feature 不可用');
        return;
      }

      console.log('[' + this.componentName + '] _startBlink: index=' + index + ', geometry.type=' + feature.geometry.type);
      this._blinkIndex = index;

      // 剥离 Vue 响应式 Proxy，得到纯 GeoJSON Feature
      var plainFeature = JSON.parse(JSON.stringify(feature));

      var self = this;
      var loadPromise = Cesium.GeoJsonDataSource.load(plainFeature, {
        stroke: Cesium.Color.fromCssColorString('#9C27B0'),
        strokeWidth: 4,
        fill: Cesium.Color.fromCssColorString('#9C27B0').withAlpha(0.45),
        markerColor: Cesium.Color.fromCssColorString('#9C27B0'),
        markerSize: 20
      });

      // 使用 .then(onFulfilled, onRejected) 兼容 Cesium 的 thenable
      loadPromise.then(function (dataSource) {
        if (self._blinkIndex !== index) {
          return;
        }

        // ⭐ 隐藏绿色查询高亮
        for (var h = 0; h < self._highlightEntities.length; h++) {
          var hds = self._highlightEntities[h];
          if (hds && !hds.isDestroyed) hds.show = false;
        }

        viewer.dataSources.add(dataSource);
        self._blinkDataSource = dataSource;

        var entities = [];
        var values = dataSource.entities.values;
        for (var i = 0; i < values.length; i++) {
          entities.push(values[i]);
        }
        self._blinkEntities = entities;
        console.log('[' + self.componentName + '] _startBlink: GeoJsonDataSource 已加载, ' + entities.length + ' 个实体');

        viewer.scene.requestRender();

        // ⭐ 收集所有 entity，统一启动 setInterval + SDK 闪烁
        self._flashLoop(viewer);
      }, function (err) {
        console.warn('[' + self.componentName + '] GeoJsonDataSource.load 失败:', err);
        self._blinkIndex = -1;
      });
    },

    /**
     * 检测实体的几何类型（用于 FlashEntityByColor 的 geoType 参数）
     */
    _detectEntityGeoType(entity) {
      if (entity.point) return 'point';
      if (entity.polygon) return 'polygon';
      if (entity.polyline) return 'polyline';
      if (entity.billboard) return 'billboard';
      return 'point';
    },

    /**
     * setInterval + SDK FlashEntityByColor 实现持续闪烁
     * 每 900ms 对所有 blink 实体触发一次 FlashEntityByColor(0.6s)
     */
    _flashLoop(viewer) {
      var self = this;
      var Cesium = this.getCesium();

      if (typeof SGKJ_SDK === 'undefined' || !SGKJ_SDK.SceneEffect) {
        console.warn('[' + this.componentName + '] SDK 不可用');
        return;
      }

      var doFlash = function () {
        if (self._blinkIndex < 0) return;
        for (var i = 0; i < self._blinkEntities.length; i++) {
          var ent = self._blinkEntities[i];
          if (!ent || ent.isDestroyed) continue;
          var geoType = self._detectEntityGeoType(ent);
          try {
            var effect = new SGKJ_SDK.SceneEffect(viewer);
            effect.FlashEntityByColor(ent, geoType, {
              time: 0.6,
              step: 0.04,
              minValue: 0.1,
              maxValue: 1
            });
          } catch (e) { /* ignore */ }
        }
      };

      // 立即触发一次
      doFlash();

      // 每 900ms 循环
      this._blinkInterval = setInterval(function () {
        if (self._blinkIndex < 0) {
          clearInterval(self._blinkInterval);
          self._blinkInterval = null;
          return;
        }
        doFlash();
      }, 900);
    },

    /**
     * 停止闪烁并移除高亮 DataSource
     */
    _stopBlink() {
      var viewer = this.getViewer();

      // ⭐ 恢复绿色查询高亮
      for (var h = 0; h < this._highlightEntities.length; h++) {
        var hds = this._highlightEntities[h];
        if (hds && !hds.isDestroyed) hds.show = true;
      }

      if (this._blinkInterval) {
        clearInterval(this._blinkInterval);
        this._blinkInterval = null;
      }
      if (this._blinkTimeout) {
        clearTimeout(this._blinkTimeout);
        this._blinkTimeout = null;
      }

      if (viewer && this._blinkDataSource) {
        try {
          if (!this._blinkDataSource.isDestroyed) {
            viewer.dataSources.remove(this._blinkDataSource, true);
          }
        } catch (e) { /* ignore */ }
      }
      this._blinkDataSource = null;
      this._blinkEntities = [];
      this._blinkIndex = -1;
    },

    flyToFeature(feature) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !feature || !feature.geometry) return;

      try {
        // 计算几何的经纬度范围
        var extent = this._calcGeometryExtent(feature.geometry);
        if (!extent) {
          // 无法计算范围时回退到单点定位
          var coord = this._extractFirstCoordinate(feature.geometry);
          if (!coord) return;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 5000),
            orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-60), roll: 0 },
            duration: 1.0
          });
          return;
        }

        var dLon = extent.maxLon - extent.minLon;
        var dLat = extent.maxLat - extent.minLat;
        if (dLon < 0.0001) dLon = 0.0001;
        if (dLat < 0.0001) dLat = 0.0001;

        // 10% margin
        var marginLon = dLon * 0.10;
        var marginLat = dLat * 0.10;

        // ⭐ 使用 Rectangle，Cesium 自动处理相机高度和视角
        var rectangle = Cesium.Rectangle.fromDegrees(
          extent.minLon - marginLon,
          extent.minLat - marginLat,
          extent.maxLon + marginLon,
          extent.maxLat + marginLat
        );

        console.log('[' + this.componentName + '] flyToFeature: rectangle=(' +
          rectangle.west.toFixed(6) + ',' + rectangle.south.toFixed(6) + ',' +
          rectangle.east.toFixed(6) + ',' + rectangle.north.toFixed(6) + ')');

        viewer.camera.flyTo({
          destination: rectangle,
          duration: 1.0
        });
      } catch (e) {
        console.warn('[' + this.componentName + '] flyToFeature 失败:', e);
      }
    },

    /**
     * 计算 GeoJSON 几何的经纬度范围
     */
    _calcGeometryExtent(geom) {
      if (!geom || !geom.type) return null;
      var result = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
      this._collectCoords(geom, result);
      if (result.minLon === Infinity) return null;
      return result;
    },

    /**
     * 收集所有坐标点，更新范围
     */
    _collectCoords(geom, result) {
      if (!geom || !geom.type) return;

      var addCoord = function (lon, lat) {
        if (lon < result.minLon) result.minLon = lon;
        if (lon > result.maxLon) result.maxLon = lon;
        if (lat < result.minLat) result.minLat = lat;
        if (lat > result.maxLat) result.maxLat = lat;
      };

      switch (geom.type) {
        case 'Point':
          addCoord(geom.coordinates[0], geom.coordinates[1]);
          break;
        case 'MultiPoint':
        case 'LineString':
          for (var i = 0; i < geom.coordinates.length; i++) {
            addCoord(geom.coordinates[i][0], geom.coordinates[i][1]);
          }
          break;
        case 'MultiLineString':
        case 'Polygon':
          for (var j = 0; j < geom.coordinates.length; j++) {
            for (var k = 0; k < geom.coordinates[j].length; k++) {
              addCoord(geom.coordinates[j][k][0], geom.coordinates[j][k][1]);
            }
          }
          break;
        case 'MultiPolygon':
          for (var p = 0; p < geom.coordinates.length; p++) {
            for (var q = 0; q < geom.coordinates[p].length; q++) {
              for (var r = 0; r < geom.coordinates[p][q].length; r++) {
                addCoord(geom.coordinates[p][q][r][0], geom.coordinates[p][q][r][1]);
              }
            }
          }
          break;
      }
    },

    /**
     * 从 GeoJSON 几何对象中提取第一个坐标 [lon, lat]
     * 支持所有常见 Geometry 类型，包括 Multi* 变体
     */
    _extractFirstCoordinate(geom) {
      if (!geom || !geom.type) return null;

      switch (geom.type) {
        case 'Point':
          return geom.coordinates;
        case 'MultiPoint':
          return geom.coordinates && geom.coordinates[0];
        case 'LineString':
          return geom.coordinates && geom.coordinates[0];
        case 'MultiLineString':
          return geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0];
        case 'Polygon':
          return geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0];
        case 'MultiPolygon':
          return geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0] && geom.coordinates[0][0][0];
        case 'GeometryCollection':
          if (geom.geometries && geom.geometries.length > 0) {
            return this._extractFirstCoordinate(geom.geometries[0]);
          }
          return null;
        default:
          console.warn('[' + this.componentName + '] _extractFirstCoordinate: 未知几何类型 ' + geom.type);
          return null;
      }
    },

    // ==================== 历史记录 & 相机移动重绘 ====================

    /**
     * 绘制完成后的处理器：
     * 1. 首次相机交互时保存到查询历史
     * 2. 移除交互式绘图 canvas（屏幕坐标已失效）
     * 3. 注册 camera.moveStart / moveEnd 监听，相机停止后重绘空间查询区域
     */
    _setupPostDrawHandlers(geometry, drawType) {
      var self = this;
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium) return;

      // 先清理旧的监听器，避免重复注册
      this._cleanupCameraRedrawListeners();

      // 保存当前相机快照（用于历史记录回放）
      var camera = viewer.camera;
      var camState = {
        position: camera.position.clone(),
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll
      };

      // ---- 一次性：首次相机交互时存入查询历史 ----
      var startHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      var saved = false;

      function onFirstInteraction() {
        if (saved) return;
        saved = true;
        startHandler.destroy();
        self._historyCamHandler = null;

        // 从 drawer 获取经纬度坐标
        var screenPts = null;
        if (self._drawingManager && self._drawingManager._activeDrawer && self._drawingManager._activeDrawer.getLonLats) {
          screenPts = self._drawingManager._activeDrawer.getLonLats();
        }

        var item = {
          id: Date.now(),
          type: drawType || 'unknown',
          geometry: JSON.parse(JSON.stringify(geometry || self.drawnGeometry)),
          screenPts: screenPts ? JSON.parse(JSON.stringify(screenPts)) : null,
          camera: {
            position: { x: camState.position.x, y: camState.position.y, z: camState.position.z },
            heading: camState.heading,
            pitch: camState.pitch,
            roll: camState.roll
          },
          layerName: self.currentLayerName || '',
          resultCount: self.queryResults ? self.queryResults.length : 0,
          bufferRadius: self.bufferRadius,
          time: new Date().toISOString()
        };
        self.queryHistory.unshift(item);

        // 移除交互式绘图 canvas（后续用 display canvas 重绘）
        if (self._drawingManager) self._drawingManager.deactivate();
      }

      startHandler.setInputAction(onFirstInteraction, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      startHandler.setInputAction(onFirstInteraction, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      startHandler.setInputAction(onFirstInteraction, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      startHandler.setInputAction(onFirstInteraction, Cesium.ScreenSpaceEventType.WHEEL);
      this._historyCamHandler = startHandler;

      // ---- 持久：相机移动时移除所有 canvas，移动结束后重新绘制 ----
      this._cameraMoveStartCb = function () {
        // 移除重绘画布
        self._removeRedrawCanvas();
        // ⭐ 同时移除 DrawingToolManager 的原始绘图 canvas（首次未交互就触发的 camera 移动，如 flyTo）
        if (self._drawingManager) self._drawingManager.deactivate();
      };
      this._cameraMoveEndCb = function () {
        self._redrawGeometryOnCanvas();
      };
      viewer.camera.moveStart.addEventListener(this._cameraMoveStartCb);
      viewer.camera.moveEnd.addEventListener(this._cameraMoveEndCb);
    },

    /**
     * 在相机移动结束后，将空间查询几何图形重新投影到屏幕并绘制在 overlay canvas 上
     * 该 canvas 是非交互式的（pointer-events: none），仅在视觉上标记空间查询区域
     *
     * ⭐ 坐标系统说明：
     *   - Cesium canvas: width/height = 物理像素 (CSS像素 × DPR)
     *   - wgs84ToWindowCoordinates: 返回物理像素坐标，原点为 Cesium canvas 左上角
     *   - overlay canvas 定位在 container 的 top:0;left:0，尺寸 = cesiumCanvas.clientWidth/Height (CSS像素)
     *   - 转换公式: canvasX = (sc.x - rect.left * dpr) / dpr = sc.x/dpr - rect.left
     *     但历史代码使用 sc.x - rect.left（混合单位），与 _redrawHistoryGeometry 保持一致
     */
    _redrawGeometryOnCanvas() {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !this.drawnGeometry) return;

      this._removeRedrawCanvas();

      var geom = this.drawnGeometry;
      var drawType = this._drawType;
      var container = viewer.container;
      var cesiumCanvas = viewer.scene.canvas;
      if (!container || !cesiumCanvas) return;

      var cw = cesiumCanvas.clientWidth || cesiumCanvas.width || 1024;
      var ch = cesiumCanvas.clientHeight || cesiumCanvas.height || 768;

      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:' + cw + 'px;height:' + ch + 'px;z-index:999;pointer-events:none;';
      container.appendChild(canvas);
      this._redrawCanvas = canvas;

      var ctx = canvas.getContext('2d');
      var cesiumRect = cesiumCanvas.getBoundingClientRect();
      var self = this;

      // ⭐ 根据经纬度匹配含地形高度的 Cartesian3（避免 terrain parallax 偏差）
      function findCartesian3(lon, lat) {
        if (!self._drawCartesians || self._drawCartesians.length === 0) return null;
        for (var k = 0; k < self._drawCartesians.length; k++) {
          var cart = self._drawCartesians[k];
          if (!cart) continue;
          var cg = Cesium.Cartographic.fromCartesian(cart);
          var cLon = Cesium.Math.toDegrees(cg.longitude);
          var cLat = Cesium.Math.toDegrees(cg.latitude);
          if (Math.abs(cLon - lon) < 0.000001 && Math.abs(cLat - lat) < 0.000001) {
            return cart;
          }
        }
        return null;
      }

      // ⭐ 矩形中间角点：用已知角点的平均地形高度估算
      function getInterpolatedCartesian3(lon, lat) {
        if (!self._drawCartesians || self._drawCartesians.length < 2) return null;
        var totalH = 0, count = 0;
        for (var k = 0; k < self._drawCartesians.length; k++) {
          var cart = self._drawCartesians[k];
          if (!cart) continue;
          var cg = Cesium.Cartographic.fromCartesian(cart);
          totalH += cg.height;
          count++;
        }
        if (count === 0) return null;
        return Cesium.Cartesian3.fromDegrees(lon, lat, totalH / count);
      }

      // 经纬度 → 屏幕坐标，优先使用地形高度 Cartesian3
      function projectLonLat(lon, lat) {
        var cart = findCartesian3(lon, lat) || getInterpolatedCartesian3(lon, lat) || Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        var sc = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cart);
        if (!Cesium.defined(sc)) return null;
        return { x: sc.x - cesiumRect.left, y: sc.y - cesiumRect.top };
      }

      // 计算缓冲区像素半径
      function calcPixelRadius(lonLat, radiusM) {
        if (!radiusM || radiusM <= 0 || !lonLat) return 0;
        var latRad = lonLat[1] * Math.PI / 180;
        var dLonDeg = radiusM / (111320 * Math.cos(latRad));
        var c0 = Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], 0);
        var c1 = Cesium.Cartesian3.fromDegrees(lonLat[0] + dLonDeg, lonLat[1], 0);
        var s0 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, c0);
        var s1 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, c1);
        if (Cesium.defined(s0) && Cesium.defined(s1)) return Math.abs(s1.x - s0.x);
        return 0;
      }

      ctx.lineWidth = 2;

      if (geom.type === 'Point') {
        var pt = projectLonLat(geom.coordinates[0], geom.coordinates[1]);
        if (!pt) { this._removeRedrawCanvas(); return; }

        var radiusM = geom.radius || ((drawType === 'point') ? this.bufferRadius : 0);
        if (radiusM > 0) {
          var pr = calcPixelRadius(geom.coordinates, radiusM);
          if (pr > 0) {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
            ctx.beginPath(); ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(255, 200, 0, 0.85)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      } else if (geom.type === 'LineString') {
        var pts = geom.coordinates;
        if (pts.length < 2) { this._removeRedrawCanvas(); return; }

        if (drawType === 'line' && this.bufferRadius > 0) {
          var midPt = pts[Math.floor(pts.length / 2)];
          var lw = calcPixelRadius(midPt, this.bufferRadius) * 2;
          if (lw > 0) {
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.lineWidth = lw;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          } else {
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
          }
        } else {
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
        }

        ctx.beginPath();
        var firstPt = projectLonLat(pts[0][0], pts[0][1]);
        if (!firstPt) { this._removeRedrawCanvas(); return; }
        ctx.moveTo(firstPt.x, firstPt.y);
        for (var i = 1; i < pts.length; i++) {
          var np = projectLonLat(pts[i][0], pts[i][1]);
          if (np) ctx.lineTo(np.x, np.y);
        }
        ctx.stroke();

      } else if (geom.type === 'Polygon') {
        var ring = geom.coordinates[0];
        if (!ring || ring.length < 3) { this._removeRedrawCanvas(); return; }

        ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
        ctx.beginPath();
        var f = projectLonLat(ring[0][0], ring[0][1]);
        if (!f) { this._removeRedrawCanvas(); return; }
        ctx.moveTo(f.x, f.y);
        for (var j = 1; j < ring.length; j++) {
          var np2 = projectLonLat(ring[j][0], ring[j][1]);
          if (np2) ctx.lineTo(np2.x, np2.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    },

    /** 移除重绘的 display canvas */
    _removeRedrawCanvas() {
      if (this._redrawCanvas && this._redrawCanvas.parentNode) {
        this._redrawCanvas.parentNode.removeChild(this._redrawCanvas);
      }
      this._redrawCanvas = null;
    },

    /** 清理 camera.moveStart / moveEnd 监听器 */
    _cleanupCameraRedrawListeners() {
      var viewer = this.getViewer();
      if (viewer) {
        if (this._cameraMoveStartCb) {
          viewer.camera.moveStart.removeEventListener(this._cameraMoveStartCb);
          this._cameraMoveStartCb = null;
        }
        if (this._cameraMoveEndCb) {
          viewer.camera.moveEnd.removeEventListener(this._cameraMoveEndCb);
          this._cameraMoveEndCb = null;
        }
      }
    },

    replayHistory(item) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !item) return;

      // 停止当前绘图的相机重绘监听（避免 flyTo 途中触发 _redrawGeometryOnCanvas 冲突）
      this._cleanupCameraRedrawListeners();
      this._removeRedrawCanvas();

      // 先清除当前绘制
      if (this._drawingManager) this._drawingManager.deactivate();

      // 飞到历史相机位置
      var pos = item.camera.position;
      var self = this;
      viewer.camera.flyTo({
        destination: new Cesium.Cartesian3(pos.x, pos.y, pos.z),
        orientation: {
          heading: item.camera.heading,
          pitch: item.camera.pitch,
          roll: item.camera.roll
        },
        duration: 1.0,
        complete: function () {
          // 飞行完成后在 canvas 上重绘几何图形
          self._redrawHistoryGeometry(item);
        }
      });

      this.bufferRadius = item.bufferRadius || 500;
      this.drawnGeometry = item.geometry;
      this.queryResults = [];
      this.queryError = null;

      // 自动重新查询
      setTimeout(function () {
        self.executeQuery();
      }, 1200);
    },

    _redrawHistoryGeometry(item) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !item.geometry) return;
      var geom = item.geometry;

      // 清除旧历史 canvas
      if (this._historyCanvas) {
        try { this._historyCanvas.parentNode.removeChild(this._historyCanvas); } catch (e) {}
        this._historyCanvas = null;
      }
      if (this._historyCamClear) { this._historyCamClear.destroy(); this._historyCamClear = null; }

      // 创建 canvas
      var container = viewer.container;
      var canvas = document.createElement('canvas');
      var cw = container.clientWidth || 1024;
      var ch = container.clientHeight || 768;
      canvas.width = cw; canvas.height = ch;
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:' + cw + 'px;height:' + ch + 'px;z-index:999;pointer-events:none;';
      container.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.lineWidth = 1;

      // 从经纬度投影到屏幕
      function projectLonLat(lon, lat) {
        var c = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        var s = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, c);
        if (!Cesium.defined(s)) return null;
        var r = viewer.scene.canvas.getBoundingClientRect();
        return { x: s.x - r.left, y: s.y - r.top };
      }

      if (geom.type === 'Point') {
        var pt = projectLonLat(geom.coordinates[0], geom.coordinates[1]);
        if (!pt) { container.removeChild(canvas); return; }
        // 用圆的实际半径或点缓冲区半径计算像素半径
        var radiusM = geom.radius || item.bufferRadius || 500;
        var latRad = geom.coordinates[1] * Math.PI / 180;
        var degOff = radiusM / (111320 * Math.cos(latRad));
        var c0 = Cesium.Cartesian3.fromDegrees(geom.coordinates[0], geom.coordinates[1], 0);
        var c1 = Cesium.Cartesian3.fromDegrees(geom.coordinates[0] + degOff, geom.coordinates[1], 0);
        var s0 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, c0);
        var s1 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, c1);
        var pr = 8;
        if (Cesium.defined(s0) && Cesium.defined(s1)) pr = Math.abs(s1.x - s0.x);
        // 缓冲区圆
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 中心点
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (geom.type === 'LineString') {
        var pts = geom.coordinates;
        if (pts.length < 2) { container.removeChild(canvas); return; }
        ctx.beginPath();
        var first = projectLonLat(pts[0][0], pts[0][1]);
        if (!first) { container.removeChild(canvas); return; }
        ctx.moveTo(first.x, first.y);
        for (var i = 1; i < pts.length; i++) {
          var np = projectLonLat(pts[i][0], pts[i][1]);
          if (np) ctx.lineTo(np.x, np.y);
        }
        ctx.stroke();
      } else if (geom.type === 'Polygon') {
        var ring = geom.coordinates[0];
        if (ring.length < 3) { container.removeChild(canvas); return; }
        ctx.beginPath();
        var f = projectLonLat(ring[0][0], ring[0][1]);
        if (!f) { container.removeChild(canvas); return; }
        ctx.moveTo(f.x, f.y);
        for (var j = 1; j < ring.length; j++) {
          var np2 = projectLonLat(ring[j][0], ring[j][1]);
          if (np2) ctx.lineTo(np2.x, np2.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        container.removeChild(canvas);
        return;
      }

      this._historyCanvas = canvas;

      // 相机变化时清除历史画布（不重复记录）
      var self = this;
      var h = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      var cleared = false;
      function clearCanvas() {
        if (cleared) return;
        cleared = true;
        h.destroy();
        if (self._historyCanvas && self._historyCanvas.parentNode) {
          self._historyCanvas.parentNode.removeChild(self._historyCanvas);
        }
        self._historyCanvas = null;
        self._historyCamClear = null;
      }
      h.setInputAction(clearCanvas, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      h.setInputAction(clearCanvas, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      h.setInputAction(clearCanvas, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      h.setInputAction(clearCanvas, Cesium.ScreenSpaceEventType.WHEEL);
      this._historyCamClear = h;
    },

    removeHistory(idx) {
      this.queryHistory.splice(idx, 1);
    },

    getTypeLabel(type) {
      var map = { point: '📍点', line: '📏线', circle: '⭕圆', rectangle: '🔲矩形', polygon: '⬢多边形' };
      return map[type] || type;
    },

    formatTime(iso) {
      if (!iso) return '';
      var d = new Date(iso);
      return d.getHours().toString().padStart(2,'0') + ':' +
             d.getMinutes().toString().padStart(2,'0') + ':' +
             d.getSeconds().toString().padStart(2,'0');
    },

    // ==================== 清理 ====================
    clearAll() {
      this._stopBlink();
      this._cleanupCameraRedrawListeners();
      this._removeRedrawCanvas();
      if (this._historyCamHandler) { this._historyCamHandler.destroy(); this._historyCamHandler = null; }
      if (this._maskCamHandler) { this._maskCamHandler.destroy(); this._maskCamHandler = null; }
      if (this._historyCamClear) { this._historyCamClear.destroy(); this._historyCamClear = null; }
      if (this._historyCanvas) { try { this._historyCanvas.parentNode.removeChild(this._historyCanvas); } catch (e) {} this._historyCanvas = null; }
      this.deactivateTool();
      this.drawnGeometry = null;
      this._drawType = null;
      this._drawCartesians = null;
      this.clearResults();
      this._clearEntityMask();
      if (this._drawingManager) {
        this._drawingManager.clearAllDrawings();
      }
    },

    // 下拉框展开时刷新，同步 LayerTreeManager 勾选状态
    refreshVisibleLayers() {
      var self = this;
      // 补录动态注入的本地图层（不在静态 JSON 中）
      this._loadedIds.forEach(function (id) {
        if (!self.queryableLayers.find(function (l) { return l.id === id; })) {
          // 查找显示名称：面板状态 > Cesium dataSources > ID 回退
          var name = id;
          try {
            var ps = window.__panelSingletonManager__;
            if (ps) {
              var state = ps.getPanelState('LayerTreeManager');
              if (state && state.configList) {
                var node = state.configList.find(function (n) { return n.id === id; });
                if (node && node.name) name = node.name;
              }
            }
          } catch (e) {}
          if (name === id) {
            try {
              var viewer = self.getViewer();
              if (viewer) {
                for (var i = 0; i < viewer.dataSources.length; i++) {
                  var ds = viewer.dataSources.get(i);
                  if (ds && ds.name && ds.name.indexOf(id) >= 0) { name = ds.name; break; }
                }
              }
            } catch (e2) {}
          }
          self.queryableLayers.push({
            id: id, name: name, url: '',
            layerType: 'geojson', baseUrl: '', typeName: '',
            fields: [], _dynamic: true
          });
        }
      });

      this.visibleQueryableLayers = this._loadedIds.length > 0
        ? this.queryableLayers.filter(function (l) { return self._loadedIds.indexOf(l.id) >= 0; })
        : this.queryableLayers.slice();
    },

    clearResults() {
      // 取消正在进行的全部图层查询
      if (this._allQueryAbort) { try { this._allQueryAbort.abort(); } catch (e) {} this._allQueryAbort = null; }
      // ⭐ 闪烁激活时不停止——由 toggleHighlightFeature 控制生命周期
      if (this._blinkIndex < 0) {
        this._stopBlink();
      }
      this.queryResults = [];
      this.queryError = null;
      this.queryLoading = false;
      this.clearHighlights();
    }
  }
};
</script>

<style scoped>
/* ====== 工具栏 ====== */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-sep {
  display: inline-block;
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.12);
  margin: 0 4px;
  vertical-align: middle;
}

.layer-select, .operator-select, .field-select {
  padding: 4px 8px;
  background: rgba(255,255,255,0.06);
  color: #ddd;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  font-size: 12px;
  max-width: 180px;
  cursor: pointer;
}
.layer-select:focus, .operator-select:focus, .field-select:focus {
  outline: none;
  border-color: rgba(33,150,243,0.5);
}
.layer-select option, .operator-select option, .field-select option {
  background: #1a1a2e;
  color: #ddd;
}

/* ====== 缓冲区配置 ====== */
.buffer-config {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255,167,38,0.08);
  border-bottom: 1px solid rgba(255,167,38,0.15);
}
.buffer-config label {
  color: #FFA726;
  font-size: 12px;
  white-space: nowrap;
}
.buffer-input {
  width: 100px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.06);
  color: #ddd;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  font-size: 12px;
}
.buffer-input:focus {
  outline: none;
  border-color: rgba(255,167,38,0.5);
}

/* ====== 绘图提示 ====== */
.drawing-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(33,150,243,0.1);
  border-bottom: 1px solid rgba(33,150,243,0.2);
  color: #64B5F6;
  font-size: 12px;
}
.hint-icon { font-size: 14px; }
.cancel-draw-btn {
  margin-left: auto;
  padding: 2px 10px;
  background: rgba(239,83,80,0.2);
  color: #EF5350;
  border: 1px solid rgba(239,83,80,0.3);
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
}
.cancel-draw-btn:hover { background: rgba(239,83,80,0.3); }

/* ====== 已绘制图形信息 ====== */
.drawn-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(76,175,80,0.08);
  border-bottom: 1px solid rgba(76,175,80,0.15);
  color: #81C784;
  font-size: 12px;
}
.drawn-icon { font-size: 14px; }

/* ====== 属性查询行 ====== */
.attr-query-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-wrap: wrap;
}
.attr-col {
  display: flex;
  align-items: center;
  gap: 4px;
}
.attr-label {
  color: #888;
  font-size: 11px;
  white-space: nowrap;
}
.fuzzy-input {
  width: 120px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.06);
  color: #ddd;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  font-size: 12px;
}
.fuzzy-input:focus {
  outline: none;
  border-color: rgba(33,150,243,0.5);
}
.fuzzy-input::placeholder { color: #555; }

/* ====== 字段状态 ====== */
.fields-status {
  padding: 6px 12px;
  color: #666;
  font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.fields-status.loading {
  color: #FFA726;
}

/* ====== 查询历史 ====== */
.history-section {
  border-top: 1px solid rgba(255,255,255,0.1);
}
.history-header {
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  color: #aaa;
  font-size: 12px;
  font-weight: bold;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.2s;
}
.history-item:hover { background: rgba(255,255,255,0.04); }
.history-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.history-type { color: #FFD600; }
.history-layer { color: #64B5F6; }
.history-time { color: #666; font-size: 11px; }
.history-actions { display: flex; gap: 4px; }
.history-btn {
  padding: 2px 8px;
  background: rgba(33,150,243,0.15);
  border: 1px solid rgba(33,150,243,0.3);
  color: #64B5F6;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}
.history-btn:hover { background: rgba(33,150,243,0.25); }
.history-btn.del {
  background: rgba(239,83,80,0.1);
  border-color: rgba(239,83,80,0.3);
  color: #EF5350;
}
.history-btn.del:hover { background: rgba(239,83,80,0.2); }
</style>
