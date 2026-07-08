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
      { key: 'showResults', label: '查询结果', defaultVisible: true }
    ]"
  >
    <!-- ========== 工具栏 ========== -->
    <template #toolbar-extra>
      <!-- WFS 图层选择器 -->
      <div class="toolbar-group">
        <select v-model="selectedLayerId" class="layer-select" @change="onLayerChange">
          <option value="">-- 选择WFS图层 --</option>
          <option v-for="layer in wfsLayers" :key="layer.id" :value="layer.id">
            {{ layer.name }}
          </option>
        </select>
      </div>

      <span class="toolbar-sep"></span>

      <!-- 绘图工具按钮组 -->
      <div class="toolbar-group">
        <CesiumToolbarButton icon="📍" label="点" tooltip="点缓冲区查询" :active="activeTool === 'point'" @click="activateTool('point')" :disabled="!selectedLayerId" />
        <CesiumToolbarButton icon="📏" label="线" tooltip="线缓冲区查询" :active="activeTool === 'line'" @click="activateTool('line')" :disabled="!selectedLayerId" />
        <CesiumToolbarButton icon="⭕" label="圆" tooltip="圆形查询" :active="activeTool === 'circle'" @click="activateTool('circle')" :disabled="!selectedLayerId" />
        <CesiumToolbarButton icon="🔲" label="矩形" tooltip="矩形查询" :active="activeTool === 'rectangle'" @click="activateTool('rectangle')" :disabled="!selectedLayerId" />
        <CesiumToolbarButton icon="⬢" label="多边形" tooltip="多边形查询" :active="activeTool === 'polygon'" @click="activateTool('polygon')" :disabled="!selectedLayerId" />
      </div>

      <span class="toolbar-sep"></span>

      <!-- 空间算子选择器 -->
      <div class="toolbar-group">
        <select v-model="spatialOperator" class="operator-select" :disabled="!selectedLayerId">
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
        @fly-to="flyToFeature"
        @retry="executeQuery"
        @clear-highlight="clearHighlights"
      />
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
import { geometryForXmlFilter } from './TurfSpatialFilter.js';
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

      // WFS 图层列表
      wfsLayers: [],
      selectedLayerId: '',

      // 字段
      availableFields: [],
      fieldsLoading: false,

      // 绘图
      _drawingManager: null,
      activeTool: null,
      drawnGeometry: null,

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
      return !!(this.selectedLayerId && this.drawnGeometry);
    },
    canQuery() {
      return this.selectedLayerId && !this.queryLoading && (this.drawnGeometry || (this.selectedField && this.fuzzyValue));
    },
    currentLayerName() {
      var layer = this.wfsLayers.find(function (l) { return l.id === this.selectedLayerId; }.bind(this));
      return layer ? layer.name : '';
    },
    currentLayerBaseUrl() {
      var layer = this.wfsLayers.find(function (l) { return l.id === this.selectedLayerId; }.bind(this));
      return layer ? layer.baseUrl : '';
    },
    currentLayerTypeName() {
      var layer = this.wfsLayers.find(function (l) { return l.id === this.selectedLayerId; }.bind(this));
      return layer ? layer.typeName : '';
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
  },
  beforeUnmount() {
    this.deactivateTool();
    this.clearHighlights();
    this._clearEntityMask();
    if (this._maskCamHandler) { this._maskCamHandler.destroy(); this._maskCamHandler = null; }
    if (this._drawingManager) {
      this._drawingManager.destroy();
      this._drawingManager = null;
    }
  },
  methods: {
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
            if (self.wfsLayers.length > 0) {
              console.log('[' + self.componentName + '] 从 PanelSingletonManager 发现 ' + self.wfsLayers.length + ' 个 WFS 图层');
              return;
            }
          }
        }
      } catch (e) {
        console.warn('[' + this.componentName + '] 从 PanelSingletonManager 获取图层失败:', e);
      }

      // 回退：从静态 JSON 文件加载
      this._loadWfsLayersFromJson();
    },

    _parseLayersFromConfig(nodes) {
      var self = this;
      self.wfsLayers = [];
      if (!nodes || !Array.isArray(nodes)) return;

      nodes.forEach(function (node) {
        if (!node || node.nodeType !== 'layer') return;
        if (!node.url) return;

        var isWfs = node.url.indexOf('SERVICE=WFS') >= 0 ||
                    node.url.indexOf('REQUEST=GetFeature') >= 0 ||
                    node.url.indexOf('/wfs') >= 0 ||
                    node.url.indexOf('/wfsserver') >= 0;

        if (!isWfs) return;

        var typeName = extractTypeName(node.url);
        var baseUrl = extractBaseUrl(node.url);

        // 避免重复
        if (self.wfsLayers.find(function (l) { return l.id === node.id; })) return;

        self.wfsLayers.push({
          id: node.id,
          name: node.name || node.id,
          url: node.url,
          baseUrl: baseUrl,
          typeName: typeName,
          fields: []
        });
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
          console.log('[' + self.componentName + '] 从 JSON 文件发现 ' + self.wfsLayers.length + ' 个 WFS 图层');
        }
      } catch (e) {
        console.warn('[' + self.componentName + '] 从 JSON 文件加载 WFS 图层失败:', e);
      }
    },

    // ==================== 字段发现 ====================
    async onLayerChange() {
      this.clearResults();
      this.availableFields = [];
      this.geometryPropertyName = 'geometry'; // 重置为默认值

      if (!this.selectedLayerId) return;

      var layer = this.wfsLayers.find(function (l) { return l.id === this.selectedLayerId; }.bind(this));
      if (!layer) return;

      // 已有缓存的字段
      if (layer.fields && layer.fields.length > 0) {
        this.availableFields = layer.fields.slice();
        this.geometryPropertyName = layer.geometryPropertyName || 'geometry';
        return;
      }

      this.fieldsLoading = true;
      try {
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

      // 先清理之前的
      this.deactivateTool();
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
      this.activeTool = null;

      // 遮罩暂不启用（_addEntityMask 逻辑保留）
      // this._addEntityMask(geometry);
      // this._hideCanvasOnCameraMove();

      // 绘图完成后自动执行查询（如果有图层选择）
      if (this.selectedLayerId) {
        this.$nextTick(function () {
          this.executeQuery();
        }.bind(this));
      }
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
      if (!this.canQuery) return;
      if (!this.selectedLayerId) return;

      var baseUrl = this.currentLayerBaseUrl;
      var typeName = this.currentLayerTypeName;

      if (!baseUrl || !typeName) {
        this.queryError = '无法解析 WFS 图层地址或类型名';
        return;
      }

      this.queryLoading = true;
      this.queryError = null;
      this.queryResults = [];
      this.clearHighlights();

      try {
        // 构建空间几何
        var gmlGeom = '';
        var drawingType = this._detectDrawingType();

        if (this.drawnGeometry) {
          var filterResult = geometryForXmlFilter(drawingType, this.drawnGeometry, this.bufferRadius);
          if (filterResult && filterResult.gml) {
            gmlGeom = filterResult.gml;
          } else if (this.drawnGeometry) {
            // 如果 filter 结果为空但有几何图形，使用回退（如仅属性查询）
            console.warn('[' + this.componentName + '] 无法构建空间几何，仅使用属性查询');
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

      var self = this;
      features.forEach(function (feature, idx) {
        if (!feature.geometry) return;
        try {
          var dataSource = Cesium.GeoJsonDataSource.load(feature, {
            stroke: Cesium.Color.fromCssColorString('#00FF00'),
            strokeWidth: 2,
            fill: Cesium.Color.fromCssColorString('#00FF00').withAlpha(0.3),
            markerColor: Cesium.Color.fromCssColorString('#00FF00'),
            markerSize: 18
          });
          dataSource.then(function (ds) {
            self._highlightEntities.push(ds);
            viewer.dataSources.add(ds);
          }).catch(function () {});
        } catch (e) {
          // 单个 feature 加载失败，继续处理下一个
        }
      });
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

    flyToFeature(feature) {
      var viewer = this.getViewer();
      var Cesium = this.getCesium();
      if (!viewer || !Cesium || !feature || !feature.geometry) return;

      try {
        var geom = feature.geometry;
        var coord;

        if (geom.type === 'Point') {
          coord = geom.coordinates;
        } else if (geom.type === 'LineString') {
          coord = geom.coordinates[0];
        } else if (geom.type === 'Polygon') {
          coord = geom.coordinates[0][0];
        } else {
          return;
        }

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], 5000),
          orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-60), roll: 0 },
          duration: 1.0
        });
      } catch (e) {
        console.warn('[' + this.componentName + '] flyToFeature 失败:', e);
      }
    },

    // ==================== 清理 ====================
    clearAll() {
      if (this._maskCamHandler) { this._maskCamHandler.destroy(); this._maskCamHandler = null; }
      this.deactivateTool();
      this.drawnGeometry = null;
      this.clearResults();
      this._clearEntityMask();
      if (this._drawingManager) {
        this._drawingManager.clearAllDrawings();
      }
    },

    clearResults() {
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
</style>
