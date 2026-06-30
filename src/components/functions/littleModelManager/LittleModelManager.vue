<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="480"
    :panel-max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="littleModelManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'LittleModelManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'LittleModelManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    :header-tools="[
      { key: 'showToolbar', label: '工具', defaultVisible: true },
      { key: 'showModels', label: '模型列表', defaultVisible: true }
    ]"
    @config-loaded="onConfigLoadedHandler"
  >
    <template #toolbar-extra>
      <CesiumToolbarButton icon="📥" label="加载全部" tooltip="加载所有模型图层" @click="loadAllLayers" />
      <CesiumToolbarButton icon="🗑️" label="清空全部" tooltip="移除所有模型图层" @click="destroyAllLayers" />
      <CesiumToolbarButton v-if="_activeLayerId && _isLayerLoaded(_activeLayerId)"
        icon="🔍" label="线框" tooltip="切换当前图层线框模式"
        :active="_wireframeStates[_activeLayerId]" @click="toggleWireframeActive" />
    </template>
    <template #list-item="{ item }">
      <label class="model-checkbox">
        <input type="checkbox" :checked="item.loaded || false" @change="toggleItem(item)"
          :disabled="item.loading || false" class="checkbox-input" />
        <span class="check-indicator"></span>
        <div class="item-info">
          <span class="item-name">{{ item.name || '未命名' }}</span>
          <span class="item-model">{{ getModelLabel(item.modelUrl) }}</span>
          <span v-if="item.loading" class="loading-text">加载中...</span>
          <span v-else-if="item.loaded" class="status-text loaded">已加载 ({{ getEntityCount(item.id) }})</span>
          <span v-else class="status-text unloaded">未加载</span>
        </div>
      </label>
    </template>
    <template #item-actions="{ item }">
      <button @click="loadLayer(item)" class="action-btn load-btn" type="button" title="加载模型图层">📥</button>
      <button @click="removeLayer(item)" class="action-btn remove-btn" type="button" title="移除模型图层">🗑️</button>
      <button @click="locateToItem(item)" class="action-btn locate-btn" type="button" title="定位图层">📍</button>
      <button @click="openEditPanel(item)" class="action-btn edit-btn" type="button" title="编辑图层模型">✏️</button>
    </template>
    <template #dialogs>
      <div v-if="_editorVisible" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;" @click.self="closeEditor">
        <LittleModelEditor ref="modelEditor" :initial-x="400" :initial-y="200" :auto-register="false" :panel-instance-id="1" @close="closeEditor" />
      </div>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import CesiumToolbarButton from '@componentsLib/CesiumToolbarButton.mjs';
import LittleModelEditor from './LittleModelEditor.vue';
import { ConfigStrategyFactory, configRegistry } from '../GeoJsonLayerManager/ConfigLoadStrategy.mjs';
import rawPanelMetadata from './LittleModelManager.config.json';

const panelMetadata = rawPanelMetadata;

export default {
  name: 'LittleModelManager',
  components: { JsonConfigPanelBase, CesiumToolbarButton, LittleModelEditor },
  props: {
    initialX: { type: [Number, String], default: 'left' },
    initialY: { type: Number, default: 120 },
    panelName: { type: String, default: null },
    autoRegister: { type: Boolean, default: true },
    panelInstanceId: { type: Number, default: null },
    registrationKey: { type: String, default: null }
  },
  data() {
    return {
      componentName: 'LittleModelManager',
      panelMetadata,
      _modelLayers: new Map(),
      _wireframeStates: {},
      _activeLayerId: null,
      _editorVisible: false
    };
  },
  computed: {
    configList() { return this.$refs.basePanel?.configList || []; }
  },
  created() {
    configRegistry.registerFromMetadata(this.panelMetadata);
    this.initConfigStrategy();
  },
  mounted() {
    console.log('[' + this.componentName + '] LittleModelManager mounted');
  },
  beforeUnmount() {
    this.destroyAllLayers();
  },
  methods: {
    initConfigStrategy() {
      const factory = new ConfigStrategyFactory();
      this._configStrategy = factory.createFallbackStrategy([
        factory.createSQLiteStrategy(this.panelMetadata.dataSource.tableName),
        factory.createJSONFileStrategy(this.panelMetadata.featureFolder)
      ]);
    },
    onConfigLoadedHandler() {
      this.configList.forEach(item => {
        if (item.loaded === undefined) item.loaded = false;
        if (item.loading === undefined) item.loading = false;
      });
    },
    getModelLabel(url) {
      if (!url) return '';
      const fileName = url.split('/').pop().replace('.glb', '').replace('.gltf', '');
      const icons = { tree: 'tree', house: 'house', car: 'car', truck: 'truck', streetlight: 'light', bench: 'bench', tower: 'tower' };
      return (icons[fileName] || 'model') + ' ' + fileName;
    },
    getEntityCount(layerId) {
      const d = this._modelLayers.get(layerId);
      return d ? d.entities.length : 0;
    },

    // ==================== layer load / remove ====================

    loadLayer(layer) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;
      if (this._modelLayers.has(layer.id)) return;

      try {
        this.updateItemState(layer.id, { loading: true });
        const geoJsonData = typeof layer.geoJson === 'string' ? JSON.parse(layer.geoJson) : layer.geoJson;
        if (!geoJsonData || !geoJsonData.features) throw new Error('Invalid GeoJSON');

        const modelUrl = layer.modelUrl || '';
        if (!modelUrl) throw new Error('No model URL');

        var fullUrl;
        if (modelUrl.startsWith('http://') || modelUrl.startsWith('https://')) {
          fullUrl = modelUrl;
        } else if (modelUrl.startsWith('/')) {
          fullUrl = window.location.origin + modelUrl;
        } else {
          fullUrl = modelUrl;
        }

        const modelScale = Number(layer.modelScale || 5);
        const heading = Cesium.Math.toRadians(Number(layer.modelHeading || 0));
        const pitch = Cesium.Math.toRadians(Number(layer.modelPitch || 0));
        const roll = Cesium.Math.toRadians(Number(layer.modelRoll || 0));
        const heightOffset = Number(layer.heightOffset || 0);

        const entities = [];
        geoJsonData.features.forEach((feature, idx) => {
          const c = feature.geometry.coordinates;
          const worldPos = Cesium.Cartesian3.fromDegrees(c[0], c[1], (c[2] || 0) + heightOffset);

          var hprLocal = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(worldPos, hprLocal, Cesium.Ellipsoid.WGS84);

          var entity = viewer.entities.add({
            name: feature.properties?.name || (layer.name + ' #' + (idx + 1)),
            position: worldPos,
            show: false
          });
          entities.push(entity);

          if (typeof Cesium.Model.fromGltf === 'function') {
            var modelPrimitive = Cesium.Model.fromGltf({
              url: fullUrl, modelMatrix: modelMatrix, scale: modelScale,
              minimumPixelSize: 1, maximumScale: 10000, show: true
            });
            viewer.scene.primitives.add(modelPrimitive);
            entity._modelPrimitive = modelPrimitive;

            var checkReady = function () {
              if (modelPrimitive && modelPrimitive.ready) viewer.scene.requestRender();
              else if (modelPrimitive && !modelPrimitive.isDestroyed) {
                viewer.scene.requestRender();
                setTimeout(checkReady, 500);
              }
            };
            setTimeout(checkReady, 500);
          }
        });

        this._modelLayers.set(layer.id, { entities, modelUrl: fullUrl });
        this._activeLayerId = layer.id;
        this._wireframeStates = { ...this._wireframeStates, [layer.id]: false };
        this.updateItemState(layer.id, { loading: false, loaded: true });

        this._flyToLayer(geoJsonData, viewer, Cesium);
        viewer.scene.requestRender();
      } catch (err) {
        this.updateItemState(layer.id, { loading: false, loaded: false });
        console.error('[' + this.componentName + '] load failed:', err.message || err);
      }
    },

    removeLayer(layer) {
      const viewer = this.getViewer();
      const layerData = this._modelLayers.get(layer.id);
      if (layerData && viewer) {
        layerData.entities.forEach(e => {
          if (e._modelPrimitive && !e._modelPrimitive.isDestroyed) {
            try { viewer.scene.primitives.remove(e._modelPrimitive); } catch (ex) {}
          }
          if (!e.isDestroyed) viewer.entities.remove(e);
        });
        this._modelLayers.delete(layer.id);
        this.updateItemState(layer.id, { loaded: false, loading: false });
        viewer.scene.requestRender();
      } else {
        this.updateItemState(layer.id, { loaded: false, loading: false });
      }
    },

    toggleItem(item) { item.loaded ? this.removeLayer(item) : this.loadLayer(item); },

    locateToItem(item) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;
      try {
        const geoJsonData = typeof item.geoJson === 'string' ? JSON.parse(item.geoJson) : item.geoJson;
        if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
          this._flyToLayer(geoJsonData, viewer, Cesium);
        }
      } catch (err) {}
    },

    _flyToLayer(geoJsonData, viewer, Cesium) {
      if (!geoJsonData?.features?.length) return;

      var fovY = viewer.camera.frustum?.fov || (30 * Math.PI / 180);

      // ⭐ 从实体的实际世界坐标计算中心（entity.position 是最可靠的）
      var positions = [];
      geoJsonData.features.forEach(function (f) {
        var c = f.geometry.coordinates;
        if (c) positions.push(Cesium.Cartesian3.fromDegrees(c[0], c[1], c[2] || 0));
      });
      if (positions.length === 0) return;

      // 计算所有位置的平均值作为中心
      var sumX = 0, sumY = 0, sumZ = 0;
      positions.forEach(function (p) { sumX += p.x; sumY += p.y; sumZ += p.z; });
      var avgCenter = new Cesium.Cartesian3(sumX / positions.length, sumY / positions.length, sumZ / positions.length);

      // 计算所有点到中心的距离，取最大作为"半径"
      var maxDist = 0;
      var allDists = [];
      positions.forEach(function (p) {
        var d = Cesium.Cartesian3.distance(avgCenter, p);
        allDists.push(d);
        if (d > maxDist) maxDist = d;
      });

      // 加上模型本身的包围球（如果已加载）
      this._modelLayers.forEach(function (layerData) {
        if (!layerData.entities) return;
        layerData.entities.forEach(function (entity) {
          var prim = entity._modelPrimitive;
          if (prim && prim.ready && prim.boundingSphere) {
            maxDist = Math.max(maxDist, prim.boundingSphere.radius * 2);
          }
        });
      });

      // 从 positions 提取经纬度范围构建 Rectangle
      var minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
      positions.forEach(function (p) {
        var pc = Cesium.Cartographic.fromCartesian(p);
        var lon = Cesium.Math.toDegrees(pc.longitude);
        var lat = Cesium.Math.toDegrees(pc.latitude);
        if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      });

      // 加上模型包围球扩展范围
      var extraDeg = 0;
      this._modelLayers.forEach(function (layerData) {
        if (!layerData.entities) return;
        layerData.entities.forEach(function (entity) {
          var prim = entity._modelPrimitive;
          if (prim && prim.ready && prim.boundingSphere) {
            var degFromRadius = prim.boundingSphere.radius / 111320;
            if (degFromRadius > extraDeg) extraDeg = degFromRadius;
          }
        });
      });

      var dLon = Math.max(maxLon - minLon, 0.001);
      var dLat = Math.max(maxLat - minLat, 0.001);
      var margin = Math.max(dLon, dLat) * 0.3 + extraDeg;
      var rect = Cesium.Rectangle.fromDegrees(
        minLon - margin, minLat - margin,
        maxLon + margin, maxLat + margin
      );

      console.log('[' + this.componentName + '] flyToLayer: rect=[' +
        (minLon - margin).toFixed(6) + ', ' + (minLat - margin).toFixed(6) + ', ' +
        (maxLon + margin).toFixed(6) + ', ' + (maxLat + margin).toFixed(6) + ']');

      viewer.camera.flyTo({
        destination: rect, duration: 1.2,
        orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-90), roll: 0 }
      });
    },

    updateItemState(itemId, newState) {
      const idx = this.configList.findIndex(i => i.id === itemId);
      if (idx !== -1 && this.$refs.basePanel) {
        this.configList[idx] = { ...this.configList[idx], ...newState };
        this.$refs.basePanel.configList = [...this.configList];
      }
    },

    closeEditor() {
      // 清理拾取模式
      var state = window.__littleModelEditorState__;
      if (state && state.pickHandler) {
        try { if (state.pickHandler.enableDraw !== undefined) state.pickHandler.enableDraw = false;
              else if (state.pickHandler.destroy) state.pickHandler.destroy(); } catch (e) {}
        state.pickHandler = null;
      }
      state.picking = false;
      this._editorVisible = false;
    },

    // ==================== model editor bridge ====================

    openEditPanel(item) {
      console.log('[LittleModelManager] openEditPanel called, item:', item.name, 'loaded:', !!this._modelLayers.get(item.id));
      var geoJsonData = typeof item.geoJson === 'string' ? JSON.parse(item.geoJson) : item.geoJson;
      var models = [];
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach(f => {
          var c = f.geometry.coordinates;
          models.push({ name: f.properties?.name || '', lon: c[0], lat: c[1], alt: c[2] || 0 });
        });
      }

      var state = window.__littleModelEditorState__;
      state.layerId = item.id;
      state.layerName = item.name || '';
      state.scale = Number(item.modelScale || 5);
      state.labelField = item.labelField || '';
      state.models = models;
      state.picking = false;
      state.pickHandler = null;
      state.pickTargetIndex = -1;

      var self = this;
      if (!window.__littleModelShared__) window.__littleModelShared__ = {};
      window.__littleModelShared__.getLayerData = function (layerId) {
        return self._modelLayers.get(layerId);
      };
      window.__littleModelShared__.managerAction = function (action) {
        if (action === 'loadAll') self.loadAllLayers();
        else if (action === 'destroyAll') self.destroyAllLayers();
        else if (action === 'wireframe') self.toggleWireframeActive();
      };
      window.__littleModelShared__.applyEdit = function (editState) {
        var layerId = editState.layerId;
        var layerData = self._modelLayers.get(layerId);
        var features = editState.models.map(function (m) {
          return { type: 'Feature', geometry: { type: 'Point', coordinates: [m.lon, m.lat, m.alt] }, properties: { name: m.name } };
        });
        var newGeoJson = JSON.stringify({ type: 'FeatureCollection', features: features });
        var cfgItem = self.configList.find(function (i) { return i.id === layerId; });
        if (cfgItem) {
          cfgItem.geoJson = newGeoJson;
          cfgItem.modelScale = editState.scale;
          if (editState.labelField !== undefined) cfgItem.labelField = editState.labelField;
          if (self.$refs.basePanel) self.$refs.basePanel.configList = [...self.configList];
        }
        if (layerData) {
          self.removeLayer({ id: layerId, name: editState.layerName });
          if (cfgItem) self.loadLayer(cfgItem);
        }
        self._editorVisible = false;
      };

      this._editorVisible = true;
    },

    // ==================== toolbar helpers ====================

    destroyAllLayers() {
      const viewer = this.getViewer();
      Array.from(this._modelLayers.keys()).forEach(id => this.removeLayer({ id, name: id }));
      if (viewer) viewer.scene.requestRender();
    },
    loadAllLayers() {
      this.configList.forEach(item => { if (!item.loaded) this.loadLayer(item); });
    },
    _isLayerLoaded(layerId) { return this._modelLayers.has(layerId); },
    toggleWireframeActive() {
      if (!this._activeLayerId) return;
      const Cesium = this.getCesium();
      if (!Cesium) return;
      const data = this._modelLayers.get(this._activeLayerId);
      if (!data) return;
      const isWireframe = !this._wireframeStates[this._activeLayerId];
      this._wireframeStates = { ...this._wireframeStates, [this._activeLayerId]: isWireframe };
      data.entities.forEach(entity => {
        if (entity.model && !entity.isDestroyed) {
          try {
            if (isWireframe) {
              entity.model.color = Cesium.Color.fromCssColorString('#00FF00').withAlpha(0.6);
              entity.model.silhouetteColor = Cesium.Color.LIME;
              entity.model.silhouetteSize = 2.0;
            } else {
              entity.model.color = undefined;
              entity.model.silhouetteColor = Cesium.Color.WHITE;
              entity.model.silhouetteSize = 0;
            }
          } catch (e) {}
        }
      });
    },

    getViewer() { return window?.__cesiumViewer__; },
    getCesium() { return window?.Cesium; }
  }
};
</script>

<style scoped>
.model-checkbox { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
.checkbox-input { position: absolute; opacity: 0; cursor: pointer; }
.check-indicator { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.05); position: relative; transition: all 0.2s; }
.checkbox-input:checked + .check-indicator { background: #4CAF50; border-color: #4CAF50; }
.checkbox-input:checked + .check-indicator::after { content: ''; position: absolute; left: 5px; top: 2px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.model-checkbox:hover .check-indicator { border-color: rgba(255,255,255,0.5); }
.item-info { display: flex; flex-direction: column; gap: 2px; }
.item-name { font-weight: bold; color: #fff; font-size: 14px; }
.item-model { font-size: 12px; color: #0098d9; }
.loading-text { font-size: 12px; color: #FFA726; }
.status-text { font-size: 12px; }
.status-text.loaded { color: #4CAF50; }
.status-text.unloaded { color: #666; }
.action-btn { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px; font-size: 16px; }
.load-btn { background: #67c23a; color: white; } .load-btn:hover { background: #5eb838; }
.remove-btn { background: #f56c6c; color: white; } .remove-btn:hover { background: #ee5a5a; }
.locate-btn { background: #2196f3; color: white; } .locate-btn:hover { background: #1976d2; }
.edit-btn { background: #ff9800; color: white; } .edit-btn:hover { background: #f57c00; }
</style>
