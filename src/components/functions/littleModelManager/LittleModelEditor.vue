<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="480"
    :panel-max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="littleModelEditorClose"
    :config-id="panelMetadata.configId"
    :panel-name="'LittleModelEditor'"
    :auto-register="false"
    :registration-key="registrationKey || 'LittleModelEditor'"
    :panel-instance-id="panelInstanceId"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="{ add: false, import: false, export: false, refresh: false }"
    :lazy-load="true"
    @close="$emit('close')"
    @lazy-load="onLazyLoad"
    @config-loaded="onConfigLoaded"
  >
    <template #header>
      <h3 class="lme-title">✏️ {{ editorData.layerName || '请选择图层' }}</h3>
      <button @click.stop="showToolbar = !showToolbar" class="header-tool-btn" type="button" title="显示/隐藏工具栏">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1.5" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="2.5" y1="6.5" x2="11.5" y2="6.5" stroke="currentColor" stroke-width="1.2"/><line x1="2.5" y1="9" x2="8.5" y2="9" stroke="currentColor" stroke-width="1.2"/></svg>
        工具
      </button>
    </template>

    <template #toolbar-extra>
      <div v-if="showToolbar" class="lme-toolbar-outer">
        <span class="lme-tb-layer">✏️ {{ editorData.layerName || '请选择图层' }}</span>
        <span class="lme-tb-sep">|</span>
        <div class="lme-toolbar">
        <button @click="managerAction('loadAll')" class="lme-tb-btn" type="button" title="加载全部图层">📥</button>
        <button @click="managerAction('destroyAll')" class="lme-tb-btn" type="button" title="清空全部图层">🗑️</button>
        <button @click="managerAction('wireframe')" class="lme-tb-btn" type="button" title="切换线框">🔍</button>
        <span class="lme-tb-sep">|</span>
        <label class="lme-tb-label">缩放
          <input v-model.number="editScale" type="range" min="0.1" max="50" step="0.5" class="lme-tb-range" />
          <span class="lme-tb-val">{{ editScale }}x</span>
        </label>
        <label class="lme-tb-label">标注
          <select v-model="editLabelField" class="lme-tb-select">
            <option value="">无</option><option value="name">名称</option>
          </select>
        </label>
        <button @click="startPickModel" class="lme-tb-btn pick" :disabled="_picking" type="button">
          {{ _picking ? '点击地图放置...' : '+添加点位' }}</button>
        <button @click="applyChanges" class="lme-tb-btn apply" type="button">✅ 应用</button>
      </div>
      </div>
    </template>

    <!-- 列表项：每个模型行 -->
    <template #list-item="{ item }">
      <div class="lme-row">
        <span class="lme-name" :title="item.lon+','+item.lat">{{ item.name }}</span>
        <span class="lme-pos">{{ (item.lon||0).toFixed(6) }}, {{ (item.lat||0).toFixed(6) }}</span>
        <button @click.stop="flyToModel(item._idx)" class="lme-rbtn" title="飞至" type="button">📍</button>
        <button @click.stop="repositionModel(item._idx)" class="lme-rbtn" title="移动" type="button">🎯</button>
        <button @click.stop="removeModel(item._idx)" class="lme-rbtn del" title="删除" type="button">✕</button>
      </div>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import SfcBase from '@/components/lib/SfcBase.mjs';
import '@/components/lib/SfcBase.mjs.css';
import rawPanelMetadata from './LittleModelEditor.config.json';

const panelMetadata = rawPanelMetadata;

export default {
  name: 'LittleModelEditor',
  components: { JsonConfigPanelBase },
  mixins: [SfcBase],
  props: {
    initialX: { type: [Number, String], default: 400 },
    initialY: { type: Number, default: 200 },
    autoRegister: { type: Boolean, default: false },
    panelInstanceId: { type: Number, default: null },
    registrationKey: { type: String, default: null },
    // ⭐ 与 ObliqueHeightAdjustPanel 一致的 props 模式
    editorData: { type: Object, default: () => ({ layerId: null, layerName: '', scale: 5, labelField: '', models: [] }) },
    layerEntities: { type: Array, default: () => [] }  // 已加载图层的 entities，用于包围球查询
  },
  emits: ['apply', 'close', 'manager-action'],
  data() {
    return {
      componentName: 'LittleModelEditor',
      panelMetadata,
      editScale: this.editorData.scale || 5,
      editLabelField: this.editorData.labelField || '',
      editModels: JSON.parse(JSON.stringify(this.editorData.models || [])),
      _picking: false,
      _pickHandler: null,
      _pickTarget: -1,
      showToolbar: true
    };
  },
  watch: {
    editorData: {
      deep: true,
      handler(val) {
        if (val && val.layerId) {
          this.editScale = val.scale || 5;
          this.editLabelField = val.labelField || '';
          this.editModels = JSON.parse(JSON.stringify(val.models || []));
          this.$nextTick(() => this._forceSync());
        }
      }
    }
  },
  mounted() {
    var self = this;
    this.$nextTick(function () {
      self._forceSync();
      setTimeout(function () { self._forceSync(); }, 500);
    });
  },
  methods: {
    _forceSync() {
      var bp = this.$refs.basePanel;
      if (!bp) return;
      bp.configList = this.editModels.map(function (m, i) {
        return { id: 'm_' + i, _idx: i, name: m.name, lon: m.lon, lat: m.lat, alt: m.alt, loaded: false, loading: false };
      });
      bp._configLoaded = true;
      if (bp.sectionVisible && bp.sectionVisible.showToolbar === false) {
        bp.sectionVisible.showToolbar = true;
      }
    },
    onLazyLoad() {},
    onConfigLoaded() { this._forceSync(); },

    flyToModel(index) {
      var viewer = window.__cesiumViewer__, Cesium = window.Cesium;
      if (!viewer || !Cesium) return;
      var m = this.editModels[index]; if (!m) return;
      var targetHeight = 500;
      var ents = this.layerEntities;
      if (ents && index < ents.length) {
        var p = ents[index]._modelPrimitive;
        if (p && p.ready && p.boundingSphere) {
          var fovY = viewer.camera.frustum.fov || (30 * Math.PI / 180);
          targetHeight = (p.boundingSphere.radius / Math.tan(fovY / 2)) * 1.5;
        }
      }
      targetHeight = Math.max(150, Math.min(targetHeight, 50000));
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(m.lon, m.lat, targetHeight), duration: 0.6,
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
      });
    },

    repositionModel(index) {
      var viewer = window.__cesiumViewer__, Cesium = window.Cesium;
      if (!viewer || !Cesium) return;
      this._stopPick();
      this._pickTarget = index; this._picking = true;
      if (typeof SGKJ_SDK !== 'undefined' && SGKJ_SDK.PointDrawer) {
        var drawer = new SGKJ_SDK.PointDrawer(viewer, { isTemp: true });
        drawer.complete = (pos) => {
          var cg = Cesium.Cartographic.fromCartesian(pos);
          this.editModels[index].lon = Cesium.Math.toDegrees(cg.longitude);
          this.editModels[index].lat = Cesium.Math.toDegrees(cg.latitude);
          this.editModels[index].alt = cg.height;
          this._stopPick(); this._forceSync(); viewer.scene.requestRender();
        };
        this._pickHandler = drawer; return;
      }
      var h = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      h.setInputAction((click) => {
        var c = viewer.scene.pickPosition(click.position);
        if (c) { var cg = Cesium.Cartographic.fromCartesian(c);
          this.editModels[index].lon = Cesium.Math.toDegrees(cg.longitude);
          this.editModels[index].lat = Cesium.Math.toDegrees(cg.latitude);
          this.editModels[index].alt = cg.height; }
        this._stopPick(); this._forceSync();
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this._pickHandler = h;
    },

    removeModel(index) { this.editModels.splice(index, 1); this._forceSync(); },

    startPickModel() {
      var viewer = window.__cesiumViewer__, Cesium = window.Cesium;
      if (!viewer || !Cesium) return;
      this._stopPick(); this._pickTarget = -1; this._picking = true;
      if (typeof SGKJ_SDK !== 'undefined' && SGKJ_SDK.PointDrawer) {
        var drawer = new SGKJ_SDK.PointDrawer(viewer, { isTemp: true });
        drawer.complete = (pos) => {
          var cg = Cesium.Cartographic.fromCartesian(pos);
          this.editModels.push({ name: 'm#' + (this.editModels.length + 1),
            lon: Cesium.Math.toDegrees(cg.longitude), lat: Cesium.Math.toDegrees(cg.latitude), alt: cg.height });
          this._stopPick(); this._forceSync(); viewer.scene.requestRender();
        };
        this._pickHandler = drawer; return;
      }
      var h = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      h.setInputAction((click) => {
        var c = viewer.scene.pickPosition(click.position);
        if (c) { var cg = Cesium.Cartographic.fromCartesian(c);
          this.editModels.push({ name: 'm#' + (this.editModels.length + 1),
            lon: Cesium.Math.toDegrees(cg.longitude), lat: Cesium.Math.toDegrees(cg.latitude), alt: cg.height }); }
        this._stopPick(); this._forceSync();
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this._pickHandler = h;
    },

    _stopPick() {
      this._picking = false;
      if (this._pickHandler) {
        try { if (this._pickHandler.enableDraw !== undefined) this._pickHandler.enableDraw = false;
              else if (this._pickHandler.destroy) this._pickHandler.destroy(); } catch (e) {}
        this._pickHandler = null;
      }
    },

    managerAction(action) {
      this.$emit('manager-action', action);
    },

    applyChanges() {
      this.$emit('apply', {
        layerId: this.editorData.layerId,
        layerName: this.editorData.layerName,
        scale: this.editScale,
        labelField: this.editLabelField,
        models: JSON.parse(JSON.stringify(this.editModels))
      });
      this._stopPick();
    }
  }
};
</script>

<style scoped>
.lme-title { margin: 0; color: #ff9800; font-size: 14px; flex: 1; }
.lme-tb-layer { color: #ff9800; font-weight: bold; font-size: 12px; white-space: nowrap; }
.lme-toolbar-outer { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.lme-toolbar { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.header-tool-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px; color: #b0b0b0; font-size: 12px; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0;
}
.header-tool-btn:hover { background: rgba(255, 255, 255, 0.12); color: #e0e0e0; border-color: rgba(255, 255, 255, 0.25); }
.header-tool-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.lme-tb-label { display: flex; align-items: center; gap: 4px; color: #bbb; font-size: 11px; white-space: nowrap; }
.lme-tb-range { width: 60px; }
.lme-tb-val { color: #ff9800; font-weight: bold; font-size: 11px; }
.lme-tb-select { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 2px 6px; font-size: 11px; }
.lme-tb-btn { padding: 3px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap; }
.lme-tb-btn.pick { background: #2196f3; color: #fff; }
.lme-tb-btn.pick:disabled { background: #ff9800; opacity: 0.8; cursor: crosshair; }
.lme-tb-btn.apply { background: #4CAF50; color: #fff; }
.lme-tb-sep { color: rgba(255,255,255,0.15); margin: 0 2px; }
.lme-row { display: flex; align-items: center; gap: 4px; }
.lme-name { flex: 1; color: #ddd; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lme-pos { color: #0098d9; font-family: monospace; font-size: 10px; margin-right: 4px; }
.lme-rbtn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #bbb; border-radius: 3px; cursor: pointer; padding: 1px 4px; font-size: 11px; }
.lme-rbtn:hover { background: rgba(255,255,255,0.15); color: #fff; }
.lme-rbtn.del:hover { background: rgba(244,67,54,0.3); border-color: #f44336; color: #f44336; }
</style>
