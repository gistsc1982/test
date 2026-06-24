<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="450"
    :panel-max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="geoJsonLayerManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'GeoJsonLayerManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'GeoJsonLayerManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    @config-loaded="onConfigLoadedHandler"
  >
    <template #list-item="{ item }">
      <label class="geojson-checkbox">
        <input
          type="checkbox"
          :checked="item.loaded || false"
          @change="toggleItem(item)"
          :disabled="item.loading || false"
          class="checkbox-input"
        />
        <span class="check-indicator"></span>
        <div class="item-info">
          <span class="item-name">{{ item.name || '未命名' }}</span>
          <span class="item-type">{{ getGeoTypeName(item.geoType) }}</span>
          <span v-if="item.loading" class="loading-text">加载中...</span>
          <span v-else-if="item.loaded" class="status-text loaded">✓ 已加载</span>
          <span v-else class="status-text unloaded">未加载</span>
        </div>
      </label>
    </template>

    <template #item-actions="{ item }">
      <button @click="loadLayer(item)" class="action-btn load-btn" type="button" title="加载图层">📥</button>
      <button @click="removeLayer(item)" class="action-btn remove-btn" type="button" title="移除图层">🗑️</button>
      <button @click="locateToItem(item)" class="action-btn locate-btn" type="button" title="定位图层">📍</button>
      <button
        v-if="item.loaded"
        @click="toggleLabels(item)"
        class="action-btn label-btn"
        type="button"
        :title="_isLabelsShown(item.id) ? '隐藏文本标注' : '显示文本标注'"
      >
        {{ _isLabelsShown(item.id) ? '🏷️' : '🔖' }}
      </button>
    </template>

    <template #dialogs></template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import rawPanelMetadata from './GeoJsonLayerManager.config.json';

const panelMetadata = rawPanelMetadata;

export default {
  name: 'GeoJsonLayerManager',
  components: { JsonConfigPanelBase },
  props: {
    initialX: { type: [Number, String], default: 'left' },
    initialY: { type: Number, default: 440 },
    panelName: { type: String, default: null },
    autoRegister: { type: Boolean, default: true },
    panelInstanceId: { type: Number, default: null },
    registrationKey: { type: String, default: null }
  },
  data() {
    return {
      componentName: 'GeoJsonLayerManager',
      panelMetadata,
      _cesiumLayers: new Map(),
      _labelStates: {}
    };
  },
  computed: {
    configList() {
      return this.$refs.basePanel?.configList || [];
    }
  },
  created() {
    configRegistry.registerFromMetadata(this.panelMetadata);
    this.initConfigStrategy();
  },
  beforeDestroy() {
    this.destroyAllLayers();
  },
  methods: {
    initConfigStrategy() {
      const factory = new ConfigStrategyFactory();
      this._configStrategy = factory.createFallbackStrategy([
        factory.createSQLiteStrategy(this.panelMetadata.dataSource.tableName),
        factory.createJSONFileStrategy(this.panelMetadata.featureFolder)
      ]);
      console.log(`[${this.componentName}] ✅ 配置加载策略已初始化: ${this._configStrategy.getName()}`);
    },
    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 图层配置加载完成`);
      // 初始化 loaded/loading 状态，并归一化 geoJson 为字符串
      let changed = false;
      this.configList.forEach(item => {
        if (item.loaded === undefined) item.loaded = false;
        if (item.loading === undefined) item.loading = false;
        // SQLite/IndexedDB 可能将 geoJson 存储为对象，归一化为字符串以支持编辑表单显示
        if (item.geoJson && typeof item.geoJson === 'object') {
          const normalized = JSON.stringify(item.geoJson, null, 2);
          item.geoJson = normalized;
          changed = true;
          console.log(`[${this.componentName}] 🔄 归一化 geoJson: "${item.name}" (${(normalized.length / 1024).toFixed(1)}KB)`);
        }
      });
      // 强制同步到 basePanel，并写回 IndexedDB 覆盖旧数据
      if (changed && this.$refs.basePanel) {
        const bp = this.$refs.basePanel;
        bp.configList = [...this.configList];
        // 立即保存到 IndexedDB 以覆盖旧的对象格式数据
        if (this._configStrategy && typeof this._configStrategy.save === 'function') {
          this._configStrategy.save(this.panelMetadata, this.configList).then(() => {
            console.log(`[${this.componentName}] 💾 geoJson 字符串格式已持久化到存储`);
          }).catch(() => {});
        }
      }
    },
    getGeoTypeName(type) {
      const types = { Point: '点', LineString: '线', Polygon: '面' };
      return types[type] || type;
    },
    loadLayer(layer) {
      console.log(`[${this.componentName}] 📥 加载图层:`, layer.name);
      const viewer = this.getCesiumViewer();
      if (!viewer) { console.error(`[${this.componentName}] ❌ 未找到 Cesium Viewer`); return; }
      const Cesium = this.getCesium();
      if (!Cesium) { console.error(`[${this.componentName}] ❌ Cesium 库未加载`); return; }
      if (this._cesiumLayers.has(layer.id)) { console.log(`[${this.componentName}] ℹ️ 图层 "${layer.name}" 已加载`); return; }
      try {
        this.updateItemState(layer.id, { loading: true });
        const geoJsonData = typeof layer.geoJson === 'string' ? JSON.parse(layer.geoJson) : layer.geoJson;
        // 调试：打印第一个 feature 的坐标用于排查坐标系问题
        if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
          const firstCoords = geoJsonData.features[0].geometry.coordinates;
          console.log(`[${this.componentName}] 🔍 首个实体坐标示例:`, JSON.stringify(firstCoords).substring(0, 200));
        }
        // ⭐ clampToGround 默认取配置值，否则 true：确保在地形上可见
        const clampToGround = layer.clampToGround !== undefined ? layer.clampToGround : true;
        // 只有贴地多边形不能有轮廓线（Cesium GroundPrimitive 限制），线和点正常使用配置值
        const effectiveStrokeWidth = (clampToGround && layer.geoType === 'Polygon')
          ? 0
          : (layer.strokeWidth !== undefined ? layer.strokeWidth : 2);
        // fillColor：直接解析配置值（支持 #hex、rgba() 等），不覆盖 alpha
        const fillColor = Cesium.Color.fromCssColorString(layer.fillColor || '#FFFF00');
        if (layer.fillOpacity !== undefined) {
          fillColor.alpha = layer.fillOpacity;
        }
        const options = {
          clampToGround: clampToGround,
          fill: fillColor,
          markerColor: Cesium.Color.fromCssColorString(layer.markerColor || '#4169E1'),
          markerSize: layer.markerSize || 48,
          stroke: Cesium.Color.fromCssColorString(layer.strokeColor || '#FF0000'),
          strokeWidth: effectiveStrokeWidth
        };
        Promise.resolve(Cesium.GeoJsonDataSource.load(geoJsonData, options)).then(dataSource => {
          viewer.dataSources.add(dataSource);
          this._cesiumLayers.set(layer.id, dataSource);
          this.updateItemState(layer.id, { loading: false, loaded: true });

          const entities = dataSource.entities.values;
          console.log(`[${this.componentName}] ✅ 图层 "${layer.name}" 加载成功，实体数: ${entities.length}`);

          // ⭐ 加载后用原生 point/polyline/polygon 替换 GeoJsonDataSource 生成的图形
          entities.forEach((entity, idx) => {
            const geoType = layer.geoType;
            if (geoType === 'Point') {
              const icon = layer.markerIcon || '📍';
              const markerColor = layer.markerColor || '#4169E1';
              const markerSize = layer.markerSize || 48;
              // 生成 emoji canvas
              const canvas = document.createElement('canvas');
              const cSize = 64;
              canvas.width = cSize;
              canvas.height = cSize;
              const ctx = canvas.getContext('2d');
              ctx.font = `${cSize * 0.6}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(icon, cSize / 2, cSize / 2 + 2);
              // 直接替换 GeoJsonDataSource 自动生成的 billboard 属性
              if (entity.billboard) {
                entity.billboard.image = canvas;
                entity.billboard.scale = markerSize / cSize * 1.2;
                entity.billboard.color = Cesium.Color.WHITE;
                entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
              } else {
                entity.billboard = new Cesium.BillboardGraphics({
                  image: canvas,
                  scale: markerSize / cSize * 1.2
                });
              }
              console.log(`[${this.componentName}]   [${idx}] point: icon="${icon}", size=${markerSize}`);
            } else if (geoType === 'LineString') {
              // 确保 polyline 属性正确
              if (entity.polyline) {
                entity.polyline.clampToGround = new Cesium.ConstantProperty(clampToGround);
              }
              console.log(`[${this.componentName}]   [${idx}] line: width=${entity.polyline?.width}, clampToGround=${clampToGround}`);
            } else if (geoType === 'Polygon') {
              if (entity.polygon) {
                entity.polygon.clampToGround = new Cesium.ConstantProperty(clampToGround);
              }
              console.log(`[${this.componentName}]   [${idx}] polygon: clampToGround=${clampToGround}`);
            }
          });

          viewer.scene.requestRender();

          // ⭐ 定位：从 GeoJSON 坐标计算中心点，直接飞过去
          try {
            const coords = [];
            geoJsonData.features.forEach(f => {
              const c = f.geometry.coordinates;
              if (f.geometry.type === 'Point') coords.push(c);
              else if (f.geometry.type === 'LineString') c.forEach(p => coords.push(p));
              else if (f.geometry.type === 'Polygon') c[0].forEach(p => coords.push(p));
            });
            if (coords.length > 0) {
              const lngSum = coords.reduce((s, c) => s + c[0], 0);
              const latSum = coords.reduce((s, c) => s + c[1], 0);
              const centerLng = lngSum / coords.length;
              const centerLat = latSum / coords.length;
              console.log(`[${this.componentName}] 🎯 计算定位中心: [${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}]，坐标点: ${coords.length}`);
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 8000),
                duration: 1.5,
                orientation: {
                  heading: Cesium.Math.toRadians(0),
                  pitch: Cesium.Math.toRadians(-90),
                  roll: 0
                }
              });
            }
          } catch (e) {
            console.warn(`[${this.componentName}] ⚠️ 定位计算失败:`, e);
          }
        }).catch(error => {
          this.updateItemState(layer.id, { loading: false, loaded: false });
          console.error(`[${this.componentName}] ❌ 图层加载失败:`, error);
        });
      } catch (error) {
        this.updateItemState(layer.id, { loading: false, loaded: false });
        console.error(`[${this.componentName}] ❌ GeoJSON解析失败:`, error);
      }
    },
    removeLayer(layer) {
      console.log(`[${this.componentName}] 🗑️ 移除图层:`, layer.name);
      const viewer = this.getCesiumViewer();
      if (!viewer) { console.error(`[${this.componentName}] ❌ 未找到 Cesium Viewer`); return; }
      const dataSource = this._cesiumLayers.get(layer.id);
      if (dataSource) {
        viewer.dataSources.remove(dataSource);
        this._cesiumLayers.delete(layer.id);
        this._labelStates = { ...this._labelStates, [layer.id]: false };
        this.updateItemState(layer.id, { loaded: false, loading: false });
        console.log(`[${this.componentName}] ✅ 图层 "${layer.name}" 已移除`);
      } else {
        this.updateItemState(layer.id, { loaded: false, loading: false });
        console.log(`[${this.componentName}] ℹ️ 图层 "${layer.name}" 未加载`);
      }
    },
    updateItemState(itemId, newState) {
      const index = this.configList.findIndex(i => i.id === itemId);
      if (index !== -1) {
        this.configList[index] = { ...this.configList[index], ...newState };
        if (this.$refs.basePanel) {
          this.$refs.basePanel.configList = [...this.configList];
        }
      }
    },
    toggleItem(item) {
      if (item.loaded) {
        this.removeLayer(item);
      } else {
        this.loadLayer(item);
      }
    },
    locateToItem(item) {
      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) {
        console.warn(`[${this.componentName}] ⚠️ Cesium 未就绪，无法定位`);
        return;
      }
      // ⭐ 从 GeoJSON 坐标计算中心点，直接飞行定位
      try {
        const geoJsonData = typeof item.geoJson === 'string' ? JSON.parse(item.geoJson) : item.geoJson;
        const coords = [];
        if (geoJsonData && geoJsonData.features) {
          geoJsonData.features.forEach(f => {
            const c = f.geometry.coordinates;
            if (!c) return;
            if (f.geometry.type === 'Point') coords.push(c);
            else if (f.geometry.type === 'LineString') c.forEach(p => coords.push(p));
            else if (f.geometry.type === 'Polygon') c[0].forEach(p => coords.push(p));
          });
        }
        if (coords.length > 0) {
          const lngSum = coords.reduce((s, c) => s + c[0], 0);
          const latSum = coords.reduce((s, c) => s + c[1], 0);
          const centerLng = lngSum / coords.length;
          const centerLat = latSum / coords.length;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 8000),
            duration: 1.5,
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-90),
              roll: 0
            }
          });
          console.log(`[${this.componentName}] 🎯 已定位到: ${item.name} [${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}]`);
        } else {
          console.warn(`[${this.componentName}] ⚠️ 无有效坐标，无法定位: ${item.name}`);
        }
      } catch (err) {
        console.error(`[${this.componentName}] ❌ 定位失败:`, err);
      }
    },
    /**
     * 参考 layerManagement.js addGeoJson 的文本标注实现
     * 根据配置的 labelField 从 feature.properties 读取文本，显示/隐藏标签
     */
    toggleLabels(item) {
      const Cesium = this.getCesium();
      if (!Cesium) return;

      const dataSource = this._cesiumLayers.get(item.id);
      if (!dataSource) return;

      const labelField = item.labelField || 'name';

      const isShown = this._isLabelsShown(item.id);

      if (isShown) {
        // 隐藏标签
        const entities = dataSource.entities.values;
        entities.forEach(entity => {
          entity.label = undefined;
        });
        this._labelStates = { ...this._labelStates, [item.id]: false };
        console.log(`[${this.componentName}] 🏷️ 文本标注已隐藏: "${item.name}"`);
      } else {
        // 显示标签 — 参考 layerManagement.js:327-343
        const entities = dataSource.entities.values;
        entities.forEach((entity, idx) => {
          const props = entity.properties?.getValue?.();
          const text = props ? props[labelField] : null;
          if (text == null && text === undefined) {
            console.warn(`[${this.componentName}] ⚠️ entity[${idx}] 缺少字段 "${labelField}"`);
            return;
          }
          // 计算标注位置：点用自身坐标；线/面取几何中心
          let position = entity.position?.getValue?.();
          if (!position) {
            if (entity.polyline) {
              const positions = entity.polyline.positions?.getValue?.();
              if (positions?.length >= 2) {
                const C = Cesium.Cartesian3;
                const mid = C.lerp(positions[0], positions[1], 0.5, new C());
                position = mid;
              }
            } else if (entity.polygon) {
              const hierarchy = entity.polygon.hierarchy?.getValue?.();
              if (hierarchy?.positions?.length) {
                const center = Cesium.BoundingSphere.fromPoints(hierarchy.positions).center;
                position = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(center);
              }
            }
          }

          const fontSize = item.labelFontSize || 28;
          const labelScale = item.labelScale || 1.2;
          const labelColor = item.labelColor || '#a6fd1c';
          const visMin = item.labelVisibleMin ?? 0;
          const visMax = item.labelVisibleMax ?? 50000;

          entity.label = {
            text: String(text),
            font: `normal ${fontSize}px AlibabaPuHuiTi`,
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
            fillColor: Cesium.Color.fromCssColorString(labelColor),
            scale: labelScale,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(visMin, visMax)
          };
          if (position && !entity.position) {
            entity.position = position;
          }
        });
        this._labelStates = { ...this._labelStates, [item.id]: true };
        console.log(`[${this.componentName}] 🏷️ 文本标注已显示: "${item.name}", 字段: "${labelField}", 实体数: ${entities.length}`);
      }
    },

    _isLabelsShown(layerId) {
      return !!this._labelStates[layerId];
    },

    destroyAllLayers() {
      const viewer = this.getCesiumViewer();
      if (viewer) {
        this._cesiumLayers.forEach((dataSource, id) => {
          viewer.dataSources.remove(dataSource);
        });
      }
      this._cesiumLayers.clear();
    },
    getCesiumViewer() {
      return typeof window !== 'undefined' ? window.__cesiumViewer__ : null;
    },
    getCesium() {
      return typeof window !== 'undefined' ? window.Cesium : null;
    }
  }
};
</script>

<style scoped>
/* 复选框样式 */
.geojson-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.check-indicator {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  transition: all 0.2s;
}

.checkbox-input:checked + .check-indicator {
  background: #4CAF50;
  border-color: #4CAF50;
}

.checkbox-input:checked + .check-indicator::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.geojson-checkbox:hover .check-indicator {
  border-color: rgba(255, 255, 255, 0.5);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-weight: bold;
  color: #fff;
  font-size: 14px;
}

.item-type {
  font-size: 12px;
  color: #0098d9;
}

.loading-text {
  font-size: 12px;
  color: #FFA726;
}

.status-text {
  font-size: 12px;
}

.status-text.loaded {
  color: #4CAF50;
}

.status-text.unloaded {
  color: #666;
}

/* 操作按钮样式 */
.action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: none; border-radius: 6px;
  cursor: pointer; margin-right: 4px; font-size: 16px;
}
.load-btn { background: #67c23a; color: white; }
.load-btn:hover { background: #5eb838; }
.remove-btn { background: #f56c6c; color: white; }
.remove-btn:hover { background: #ee5a5a; }
.locate-btn { background: #2196f3; color: white; }
.locate-btn:hover { background: #1976d2; }
.label-btn { background: #8bc34a; color: white; }
.label-btn:hover { background: #7cb342; }
</style>