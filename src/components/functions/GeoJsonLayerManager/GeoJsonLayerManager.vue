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
    :header-tools="[{ key: 'showToolbar', label: '工具', defaultVisible: true }]"
    @config-loaded="onConfigLoadedHandler"
  >
    <template #header>
      <h3 class="panel-title">{{ panelMetadata.panelName }}</h3>
      <button @click.stop="$refs.basePanel.toggleSection('showToolbar')" class="header-tool-btn" title="显示/隐藏工具栏" type="button">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1.5" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="2.5" y1="6.5" x2="11.5" y2="6.5" stroke="currentColor" stroke-width="1.2"/><line x1="2.5" y1="9" x2="8.5" y2="9" stroke="currentColor" stroke-width="1.2"/></svg>
        工具
      </button>
    </template>
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

    <!-- 工具栏额外按钮：JSON 强制刷新 -->
    <template #toolbar-extra>
      <button
        @click="forceReloadFromJSON"
        :disabled="refreshLoading"
        class="geojson-toolbar-refresh-btn"
        type="button"
        :title="refreshLoading ? '刷新中...' : '从 JSON 文件强制刷新（忽略缓存）'"
      >
        {{ refreshLoading ? '⏳' : '🔄' }}
      </button>
    </template>

    <template #dialogs></template>
  </JsonConfigPanelBase>

  <!-- ⭐ 通用实体属性弹窗 -->
  <EntityInfoPopup
    :visible="showEntityPopup"
    :title="popupTitle"
    :properties="popupProperties"
    :screenX="popupScreenX"
    :screenY="popupScreenY"
    :geoType="popupGeoType"
    :layerName="popupLayerName"
    :canFlyTo="true"
    @close="dismissEntityPopup"
    @fly-to="flyToSelectedEntity"
    @row-click="onPopupRowClick"
  />
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import rawPanelMetadata from './GeoJsonLayerManager.config.json';
import EntitySelectionManager from '../../../utils/EntitySelectionManager.js';
import EntityInfoPopup from '../../common/EntityInfoPopup.vue';
import HeatmapRenderer from '../../../utils/HeatmapRenderer.js';

const panelMetadata = rawPanelMetadata;

export default {
  name: 'GeoJsonLayerManager',
  components: { JsonConfigPanelBase, EntityInfoPopup },
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
      _heatmapLayers: new Map(),
      _heatmapMeta: new Map(),
      _labelStates: {},
      _toggleLabelManagedLayerIds: new Set(), // ⭐ 记录由 toggleLabels 创建过 label 的图层 ID
      refreshLoading: false,
      // ⭐ 实体选中 & 属性弹窗
      _selectionManager: null,
      showEntityPopup: false,
      popupTitle: '',
      popupProperties: [],
      popupScreenX: 0,
      popupScreenY: 0,
      popupGeoType: '',
      popupLayerName: '',
      _popupSelectedEntity: null,
      _popupSelectedLayerId: null
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
  mounted() {
    console.log(`[${this.componentName}] 🚀 GeoJsonLayerManager 已挂载`);
    this._selectionManager = EntitySelectionManager.getInstance();
  },
  beforeUnmount() {
    if (this._selectionManager) {
      this._selectionManager.unregisterAll();
      this._selectionManager.stopTracking();
    }
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

    // ---- JSON 刷新（按钮在 toolbar-extra 插槽中） ----

    /**
     * 🔄 从 JSON 文件强制刷新配置（绕过 IndexedDB/SQLite 缓存）
     *
     * 使用场景：手动编辑了 public/data/gis/GeoJsonLayerManager/GeoJsonLayerManager.json
     * 后，IndexedDB 中仍有旧缓存。调用此方法直接从 JSON 文件加载并更新缓存。
     *
     * 流程：
     *   1. 直接从 JSON 文件加载数据（跳过 SQLite/IndexedDB）
     *   2. 卸载全部已加载图层（避免旧样式残留）
     *   3. 更新 basePanel.configList（UI 刷新，全部标记未加载）
     *   4. 将 JSON 数据写回 SQLite/IndexedDB（更新缓存）
     */
    async forceReloadFromJSON() {
      const log = (...args) => console.log(`[${this.componentName}] 🔄`, ...args);
      log('开始从 JSON 文件强制刷新...');
      this.refreshLoading = true;

      try {
        // 1. 创建纯 JSON 策略，跳过 SQLite
        const factory = new ConfigStrategyFactory();
        const jsonStrategy = factory.createJSONFileStrategy(this.panelMetadata.featureFolder);

        log(`加载 JSON: /data/gis/${this.panelMetadata.featureFolder}/${this.panelMetadata.featureFolder}.json`);
        const jsonData = await jsonStrategy.load();

        if (!jsonData || jsonData.length === 0) {
          console.warn(`[${this.componentName}] ⚠️ JSON 文件无数据或加载失败`);
          this.refreshLoading = false;
          return;
        }

        log(`✅ JSON 加载成功，共 ${jsonData.length} 条`);

        // 2. 卸载所有已加载图层（配置已变，旧数据源需清除）
        const hadLoadedLayers = this._cesiumLayers.size > 0;
        if (hadLoadedLayers) {
          log(`🗑️ 卸载 ${this._cesiumLayers.size} 个已加载图层...`);
          this.destroyAllLayers();
        }

        // 3. 更新 basePanel 的 configList（触发 UI 刷新）
        if (this.$refs.basePanel) {
          this.$refs.basePanel.configList = jsonData.map(item => ({
            ...item,
            loaded: false,
            loading: false
          }));
        }

        // 4. 将 JSON 数据写回 SQLite/IndexedDB（失败不影响刷新结果）
        if (this._configStrategy && typeof this._configStrategy.save === 'function') {
          try {
            const saved = await this._configStrategy.save(this.panelMetadata, jsonData);
            if (saved) {
              log('💾 JSON 数据已写回缓存');
            } else {
              console.warn(`[${this.componentName}] ⚠️ 缓存写入失败 — 下次加载将回退到 JSON 文件`);
            }
          } catch (saveErr) {
            console.warn(`[${this.componentName}] ⚠️ 缓存写入异常 (${saveErr.message}) — 可尝试手动清除 IndexedDB: indexedDB.deleteDatabase('configDB')`);
          }
        }

        // 5. 触发 onConfigLoadedHandler 初始化 loaded/loading 状态
        this.onConfigLoadedHandler();

        log(`🎉 强制刷新完成！请查看图层列表是否已更新`);
      } catch (err) {
        console.error(`[${this.componentName}] ❌ JSON 强制刷新失败:`, err);
      } finally {
        this.refreshLoading = false;
      }
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
        // ⭐ markerSymbol 策略（参考 SGKJ_SDK PinBuilder）：
        //    - 空/未设置 → fromColor() 渐变圆点（性能最优，外观最佳）
        //    - 单 ASCII 字符 → fromText() PinBuilder 原生文字标记（缓存复用）
        //    - emoji/SVG → 加载后预生成 canvas 一次，全图层复用同一引用
        const markerIcon = layer.markerIcon || '';
        const isSingleAscii = markerIcon.length === 1;
        const markerSymbol = isSingleAscii ? markerIcon : undefined;

        const options = {
          clampToGround: clampToGround,
          fill: fillColor,
          markerColor: Cesium.Color.fromCssColorString(layer.markerColor || '#4169E1'),
          markerSize: layer.markerSize || 48,
          stroke: Cesium.Color.fromCssColorString(layer.strokeColor || '#FF0000'),
          strokeWidth: effectiveStrokeWidth,
          markerSymbol: markerSymbol  // undefined → PinBuilder.fromColor() 渐变圆点
        };
        Promise.resolve(Cesium.GeoJsonDataSource.load(geoJsonData, options)).then(dataSource => {
          const entities = dataSource.entities.values;
          console.log(`[${this.componentName}] ✅ 图层 "${layer.name}" 加载成功，实体数: ${entities.length}`);

          // ⭐ 点聚类（EntityCluster）：必须在 add 之前配置
          console.log(`[${this.componentName}] 🔍 聚类检查: clusterEnabled=${layer.clusterEnabled}, entities=${entities.length}, dataSource.clustering=${!!dataSource.clustering}`);
          if (layer.clusterEnabled && entities.length > 0) {
            var cluster = dataSource.clustering;
            cluster.pixelRange = layer.clusterPixelRange || 80;
            cluster.minimumClusterSize = layer.clusterMinSize || 2;
            // 1. 先配置 entity 参与聚类
            entities.forEach(function(e) {
              e.clusterShow = true;
            });
            // 2. 配置集群事件 — canvas 背景 + 数字
            if (cluster.clusterEvent && cluster.clusterEvent.addEventListener) {
              cluster.clusterEvent.addEventListener(function(clusteredEntities, clusterEntity) {
                var count = clusteredEntities.length;
                var size = count < 10 ? 44 : count < 100 ? 52 : 60;
                var canvas = document.createElement('canvas');
                canvas.width = size; canvas.height = size;
                var ctx = canvas.getContext('2d');
                var cx = size / 2, cy = size / 2, r = size / 2 - 2;
                // SVG 风格渐变背景
                var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#FF6B35');
                grad.addColorStop(1, '#CC3300');
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = grad; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                // 底部阴影小三角（地图 pin 风格）
                ctx.beginPath(); ctx.moveTo(cx - 6, cy + r - 4);
                ctx.lineTo(cx, cy + r + 6); ctx.lineTo(cx + 6, cy + r - 4);
                ctx.fillStyle = '#CC3300'; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                // 数字
                ctx.fillStyle = '#fff'; ctx.font = 'bold ' + (size * 0.4) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(count.toString(), cx, cy - 2);
                clusterEntity.billboard.show = true;
                clusterEntity.billboard.image = canvas;
                clusterEntity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                clusterEntity.label.show = false;
              });
            }
            // 3. 最后开启聚类
            cluster.enabled = true;
            console.log(`[${this.componentName}] 🔵 点聚类已开启: pixelRange=${cluster.pixelRange}, minSize=${cluster.minimumClusterSize}, hasEvent=${!!cluster.clusterEvent}`);
            console.log(`[${this.componentName}] 🔵 点聚类已开启: enabled=${dataSource.clustering.enabled}, pixelRange=${dataSource.clustering.pixelRange}, minSize=${dataSource.clustering.minimumClusterSize}`);
          }

          viewer.dataSources.add(dataSource);
          this._cesiumLayers.set(layer.id, dataSource);
          this.updateItemState(layer.id, { loading: false, loaded: true });

          // ⭐ 注册实体拾取（选中高亮 + 属性弹窗）
          this._registerEntityPicking(layer, dataSource);

          // ⭐ 后处理：仅处理 options 无法覆盖的场景
          //   - clampToGround：Cesium GeoJsonDataSource options 已应用，但 polyline/polygon
          //     在某些版本中不会自动继承，此处做兜底强制
          //   - emoji/SVG 图标：预生成 canvas 一次，全图层 entity 共享同一引用（非逐实体创建）
          const geoType = layer.geoType;
          const needsClampForce = (geoType === 'LineString' || geoType === 'Polygon');

          // 判断是否需要自定义 emoji/SVG 图标（非单 ASCII，因为单 ASCII 已通过 markerSymbol 处理）
          const needsCustomIcon = (geoType === 'Point' && markerIcon.length > 1);

          let sharedPinCanvas = null;
          if (needsCustomIcon) {
            // ⭐ 预生成 canvas 仅一次，全图层 entity 复用同一引用
            const cSize = 64;
            sharedPinCanvas = document.createElement('canvas');
            sharedPinCanvas.width = cSize;
            sharedPinCanvas.height = cSize;
            const ctx = sharedPinCanvas.getContext('2d');
            ctx.font = `${cSize * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(markerIcon, cSize / 2, cSize / 2 + 2);
            console.log(`[${this.componentName}] 🎨 预生成共享 emoji canvas: "${markerIcon}" (${cSize}×${cSize})`);
          }

          entities.forEach((entity, idx) => {
            if (needsCustomIcon) {
              // emoji/SVG 路径：仅设置同一個 canvas 引用（极快，无 canvas 创建开销）
              if (entity.billboard) {
                entity.billboard.image = sharedPinCanvas;
                entity.billboard.scale = (layer.markerSize || 48) / 64 * 1.2;
                entity.billboard.color = Cesium.Color.WHITE;
                entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
              } else {
                entity.billboard = new Cesium.BillboardGraphics({
                  image: sharedPinCanvas,
                  scale: (layer.markerSize || 48) / 64 * 1.2
                });
              }
            } else if (needsClampForce) {
              // clampToGround 兜底：确保 polyline/polygon 贴地属性生效
              if (geoType === 'LineString' && entity.polyline) {
                entity.polyline.clampToGround = new Cesium.ConstantProperty(clampToGround);
              } else if (geoType === 'Polygon' && entity.polygon) {
                entity.polygon.clampToGround = new Cesium.ConstantProperty(clampToGround);
              }
            }
            // 默认渐变圆点 / 单字符标记 → 无需后处理，PinBuilder 已经在 load() 时完成
          });

          // ⭐ sizeField：根据属性字段动态调整点大小（径向渐变圆）
          if (geoType === 'Point' && layer.sizeField) {
            var sizeField = layer.sizeField;
            var sizeMin = layer.sizeFieldMin || 10;
            var sizeMax = layer.sizeFieldMax || 64;
            var sizeColor = Cesium.Color.fromCssColorString(layer.markerColor || '#FF4500');
            var fieldValues = [];

            entities.forEach(function (ent) {
              try {
                var props = ent.properties ? (ent.properties.getValue ? ent.properties.getValue() : ent.properties) : null;
                var val = props ? (props[sizeField] || 0) : 0;
                fieldValues.push(Number(val) || 0);
              } catch (e) { fieldValues.push(0); }
            });

            var fMin = Math.min.apply(null, fieldValues);
            var fMax = Math.max.apply(null, fieldValues);
            var fRange = fMax - fMin || 1;
            console.log('[' + this.componentName + '] 📊 sizeField="' + sizeField + '": 范围=[' + fMin + ', ' + fMax + '], 像素=[' + sizeMin + ', ' + sizeMax + ']');

            // 按 4px 档位预生成径向渐变 Canvas 并缓存复用
            var canvasCache = {};
            function getGradientCanvas(pixelSize) {
              var tier = Math.round(pixelSize / 4) * 4; // 4px 档位
              if (tier < 8) tier = 8;
              var key = String(tier);
              if (canvasCache[key]) return canvasCache[key];

              var c = document.createElement('canvas');
              c.width = tier; c.height = tier;
              var ctx = c.getContext('2d');
              var cx = tier / 2, cy = tier / 2, r = tier / 2 - 1;

              // 径向渐变：中心亮 → 边缘暗
              var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
              grad.addColorStop(0, 'rgba(' + Math.min(255, sizeColor.red * 255 + 60).toFixed(0) + ',' +
                                       Math.min(255, sizeColor.green * 255 + 60).toFixed(0) + ',' +
                                       Math.min(255, sizeColor.blue * 255 + 60).toFixed(0) + ',1)');
              grad.addColorStop(0.4, 'rgba(' + (sizeColor.red * 255).toFixed(0) + ',' +
                                          (sizeColor.green * 255).toFixed(0) + ',' +
                                          (sizeColor.blue * 255).toFixed(0) + ',0.85)');
              grad.addColorStop(0.8, 'rgba(' + (sizeColor.red * 255 * 0.6).toFixed(0) + ',' +
                                          (sizeColor.green * 255 * 0.6).toFixed(0) + ',' +
                                          (sizeColor.blue * 255 * 0.6).toFixed(0) + ',0.5)');
              grad.addColorStop(1, 'rgba(' + (sizeColor.red * 255 * 0.3).toFixed(0) + ',' +
                                        (sizeColor.green * 255 * 0.3).toFixed(0) + ',' +
                                        (sizeColor.blue * 255 * 0.3).toFixed(0) + ',0)');

              ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.fillStyle = grad; ctx.fill();

              // 左上角高光
              ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.2, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();

              canvasCache[key] = c;
              return c;
            }

            entities.forEach(function (ent, ei) {
              var val = fieldValues[ei];
              var pixelSize = sizeMin + (val - fMin) / fRange * (sizeMax - sizeMin);
              var canvas = getGradientCanvas(pixelSize);
              var scale = pixelSize / canvas.width;

              if (ent.billboard) {
                ent.billboard.image = canvas;
                ent.billboard.scale = scale;
                ent.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
              }
            });

            console.log('[' + this.componentName + '] 🎨 径向渐变圆已应用，Canvas 缓存档位数=' + Object.keys(canvasCache).length);
          }

          // ⭐ pinField：在气泡上叠加 Cesium Label 显示字段值
          if (geoType === 'Point' && layer.pinField && entities.length > 0) {
            var pinField = layer.pinField;
            var pinFontSize = layer.pinFontSize || 18;
            var pinTextColor = layer.pinTextColor || '#FFFFFF';
            var measureCanvas = document.createElement('canvas');
            var measureCtx = measureCanvas.getContext('2d');

            entities.forEach(function (ent) {
              try {
                var props = ent.properties ? (ent.properties.getValue ? ent.properties.getValue() : ent.properties) : null;
                var pinText = props ? String(props[pinField] || '') : '';
                if (!pinText) return;

                // canvas 实测文字宽度，精确计算气泡所需大小
                if (ent.billboard && ent.billboard.image) {
                  var bImg = ent.billboard.image;
                  var bw = bImg.width || 64;
                  measureCtx.font = 'bold ' + pinFontSize + 'px sans-serif';
                  var actualTextW = measureCtx.measureText(pinText).width;
                  var minBubbleW = actualTextW + pinFontSize;
                  if (minBubbleW > bw) {
                    ent.billboard.scale = Math.min(minBubbleW / bw, 5.0);
                  }
                }

                ent.label = new Cesium.LabelGraphics({
                  text: pinText,
                  font: 'bold ' + pinFontSize + 'px sans-serif',
                  fillColor: Cesium.Color.fromCssColorString(pinTextColor),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 3,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  pixelOffset: new Cesium.Cartesian2(0, (layer.pinPixelOffsetY != null ? layer.pinPixelOffsetY : 30)),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  scale: 1.0,
                  eyeOffset: new Cesium.Cartesian3(0, 0, -50)
                });
              } catch (e) { /* skip */ }
            });
            console.log('[' + this.componentName + '] 📌 pinField="' + pinField + '": ' + entities.length + ' 个实体已添加 Label');
          }

          // ⭐ 热力图叠加：点图层 + heatmapEnabled → 渲染 Canvas 叠加到 Cesium 地形上
          if (geoType === 'Point' && layer.heatmapEnabled && entities.length > 0) {
            this._createHeatmapOverlay(layer, geoJsonData, viewer, Cesium);
          }

          // 输出标记类型日志
          const markerDesc = needsCustomIcon
            ? `emoji canvas 共享 ("${markerIcon}")`
            : (isSingleAscii ? `PinBuilder.fromText("${markerIcon}")` : 'PinBuilder.fromColor() 渐变圆点');
          console.log(`[${this.componentName}] 🎯 标记策略: ${markerDesc}, 实体数: ${entities.length}`);

          viewer.scene.requestRender();

          // ⭐ 定位：从 GeoJSON 坐标计算边界范围，动态飞行高度
          try {
            let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
            geoJsonData.features.forEach(f => {
              const c = f.geometry.coordinates;
              if (!c) return;
              const extractCoords = (coords) => {
                if (typeof coords[0] === 'number') {
                  const lon = coords[0], lat = coords[1];
                  if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
                  if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
                } else {
                  coords.forEach(extractCoords);
                }
              };
              extractCoords(c);
            });
            if (minLon <= maxLon && minLat <= maxLat) {
              const centerLng = (minLon + maxLon) / 2;
              const centerLat = (minLat + maxLat) / 2;
              let dLon = maxLon - minLon, dLat = maxLat - minLat;
              if (dLon < 0.001) dLon = 0.001;
              if (dLat < 0.001) dLat = 0.001;
              const margin = Math.max(dLon, dLat) * 0.4;
              const cosLat = Math.cos(centerLat * Math.PI / 180);
              const diagM = Math.sqrt(
                Math.pow((dLon + margin * 2) * 111320 * cosLat, 2) +
                Math.pow((dLat + margin * 2) * 111320, 2)
              );
              const fovY = (viewer.camera.frustum && viewer.camera.frustum.fov) || (30 * Math.PI / 180);
              const targetHeight = Math.max(diagM / (2 * Math.tan(fovY / 2)) * 1.3, 500);
              console.log(`[${this.componentName}] 🎯 定位: [${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}]，范围=${diagM.toFixed(0)}m，高度=${targetHeight.toFixed(0)}m`);
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, targetHeight),
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
        // ⭐ 先关闭聚类（SGKJ_SDK 聚类 billboard 可能不会随 dataSource 自动清理）
        if (dataSource.clustering && dataSource.clustering.enabled) {
          try {
            dataSource.clustering.enabled = false;
          } catch (e) { /* ignore */ }
        }
        // ⭐ 注销实体拾取
        if (this._selectionManager) {
          this._selectionManager.unregisterLayer(layer.id);
        }
        viewer.dataSources.remove(dataSource);
        this._cesiumLayers.delete(layer.id);
        // ⭐ 移除关联的热力图叠加层
        this._removeHeatmapOverlay(layer.id, viewer);
        this._labelStates = { ...this._labelStates, [layer.id]: false };
        this._toggleLabelManagedLayerIds.delete(layer.id); // ⭐ 清理 toggleLabels 管理标记
        this.updateItemState(layer.id, { loaded: false, loading: false });
        // ⭐ 强制刷新渲染（SGKJ_SDK 移除 dataSource 后不会自动重绘）
        viewer.scene.requestRender();
        // 如果当前弹窗显示的是被移除的图层，关闭弹窗
        if (this._popupSelectedLayerId === layer.id) {
          this.dismissEntityPopup();
        }
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
      // ⭐ 从 GeoJSON 坐标计算边界范围，动态飞行高度
      try {
        const geoJsonData = typeof item.geoJson === 'string' ? JSON.parse(item.geoJson) : item.geoJson;
        let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
        if (geoJsonData && geoJsonData.features) {
          geoJsonData.features.forEach(f => {
            const c = f.geometry.coordinates;
            if (!c) return;
            const extractCoords = (coords) => {
              if (typeof coords[0] === 'number') {
                const lon = coords[0], lat = coords[1];
                if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
                if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
              } else { coords.forEach(extractCoords); }
            };
            extractCoords(c);
          });
          if (minLon <= maxLon && minLat <= maxLat) {
            const centerLng = (minLon + maxLon) / 2;
            const centerLat = (minLat + maxLat) / 2;
            let dLon = maxLon - minLon, dLat = maxLat - minLat;
            if (dLon < 0.001) dLon = 0.001;
            if (dLat < 0.001) dLat = 0.001;
            const margin = Math.max(dLon, dLat) * 0.4;
            const cosLat = Math.cos(centerLat * Math.PI / 180);
            const diagM = Math.sqrt(
              Math.pow((dLon + margin * 2) * 111320 * cosLat, 2) +
              Math.pow((dLat + margin * 2) * 111320, 2)
            );
            const fovY = (viewer.camera.frustum && viewer.camera.frustum.fov) || (30 * Math.PI / 180);
            const targetHeight = Math.max(diagM / (2 * Math.tan(fovY / 2)) * 1.3, 500);
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, targetHeight),
              duration: 1.5,
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-90), roll: 0 }
            });
            console.log(`[${this.componentName}] 🎯 已定位到: ${item.name} [${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}] 高度=${targetHeight.toFixed(0)}m`);
          }
        } else {
          console.warn(`[${this.componentName}] ⚠️ 无有效坐标，无法定位: ${item.name}`);
        }
      } catch (err) {
        console.error(`[${this.componentName}] ❌ 定位失败:`, err);
      }
    },
    /**
     * 文本标注显示/隐藏
     *
     * 性能策略：
     *   - 首次显示：逐实体创建 label 对象（仅一次，遍历开销为纯 JS 赋值）
     *   - 后续切换：仅设置 entity.label.show = true/false（O(n) 但零对象创建）
     *   - label 对象常驻，不销毁，避免重复构建 Cesium LabelPrimitive
     */
    toggleLabels(item) {
      const Cesium = this.getCesium();
      if (!Cesium) return;

      const viewer = this.getCesiumViewer();
      const dataSource = this._cesiumLayers.get(item.id);
      if (!dataSource) return;

      const labelField = item.labelField || 'name';
      const isShown = this._isLabelsShown(item.id);
      const entities = dataSource.entities.values;
      const len = entities.length;

      if (isShown) {
        // 隐藏：仅翻转 show 标记
        let count = 0;
        for (let i = 0; i < len; i++) {
          const entity = entities[i];
          if (entity && entity.label) {
            entity.label.show = false;
            count++;
          }
        }
        this._labelStates = { ...this._labelStates, [item.id]: false };
        if (viewer) viewer.scene.requestRender();
        console.log(`[${this.componentName}] 🏷️ 文本标注已隐藏: "${item.name}" (${count} 个)`);
      } else {
        const fontSize = item.labelFontSize || 18;
        const labelColor = item.labelColor || '#a6fd1c';
        const visMin = item.labelVisibleMin ?? 0;
        const visMax = item.labelVisibleMax ?? 50000;

        // ⭐ 关键判断：现有 label 是否由 toggleLabels 管理？
        //   pinField 在 loadLayer 时创建的 label 不算（它们显示 pinField 字段而非 labelField 字段），
        //   此时必须走「创建」分支，用 labelField 覆盖原有 label
        const labelsManagedByUs = this._toggleLabelManagedLayerIds.has(item.id);
        const labelsExist = len > 0 && entities[0] && entities[0].label;

        if (labelsExist && labelsManagedByUs) {
          // ✅ 由 toggleLabels 创建过的 label → 仅翻转 show 即可（字段一致，零对象创建）
          let count = 0;
          for (let i = 0; i < len; i++) {
            const entity = entities[i];
            if (entity && entity.label) { entity.label.show = true; count++; }
          }
          if (viewer) viewer.scene.requestRender();
          console.log(`[${this.componentName}] 🏷️ 文本标注已恢复: "${item.name}" (${count} 个)`);
        } else {
          // ⭐ 首次创建（或 pinField 遗留 label）→ 全部重建为 labelField 字段的文本
          if (labelsExist) {
            console.log(`[${this.componentName}] 🔄 检测到 pinField 遗留 label，重建为 labelField="${labelField}" 的文本标注`);
          }

          const sharedEyeOffset = new Cesium.Cartesian3(0, 0, -50);
          const sharedDistCond = new Cesium.DistanceDisplayCondition(visMin, visMax);
          const sharedFillColor = Cesium.Color.fromCssColorString(labelColor);
          const sharedOutlineColor = Cesium.Color.BLACK;
          const fontStr = 'bold ' + fontSize + 'px sans-serif';

          let count = 0;
          for (let i = 0; i < len; i++) {
            const entity = entities[i];
            if (!entity) continue;

            const props = entity.properties ? (entity.properties.getValue ? entity.properties.getValue() : entity.properties) : null;
            const text = props ? props[labelField] : null;
            if (text == null) continue;

            let position = entity.position ? (entity.position.getValue ? entity.position.getValue() : entity.position) : null;
            if (!position) {
              if (entity.polyline) {
                const positions = entity.polyline.positions ? (entity.polyline.positions.getValue ? entity.polyline.positions.getValue() : entity.polyline.positions) : null;
                if (positions && positions.length >= 2) {
                  position = Cesium.Cartesian3.lerp(positions[0], positions[1], 0.5, new Cesium.Cartesian3());
                }
              } else if (entity.polygon) {
                const hierarchy = entity.polygon.hierarchy ? (entity.polygon.hierarchy.getValue ? entity.polygon.hierarchy.getValue() : entity.polygon.hierarchy) : null;
                if (hierarchy && hierarchy.positions && hierarchy.positions.length) {
                  const center = Cesium.BoundingSphere.fromPoints(hierarchy.positions).center;
                  position = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(center);
                }
              }
            }
            if (position && !entity.position) {
              entity.position = position;
            }

            entity.label = new Cesium.LabelGraphics({
              text: String(text),
              font: fontStr,
              fillColor: sharedFillColor,
              outlineColor: sharedOutlineColor,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              eyeOffset: sharedEyeOffset,
              distanceDisplayCondition: sharedDistCond,
              scale: 1.0
            });
            count++;
          }

          // ⭐ 标记此图层由 toggleLabels 管理
          this._toggleLabelManagedLayerIds.add(item.id);

          if (viewer) viewer.scene.requestRender();
          console.log(`[${this.componentName}] 🏷️ 文本标注已创建: "${item.name}", 字段: "${labelField}", 实体数: ${count}`);
        }
        this._labelStates = { ...this._labelStates, [item.id]: true };
      }
    },

    _isLabelsShown(layerId) {
      return !!this._labelStates[layerId];
    },

    destroyAllLayers() {
      const viewer = this.getCesiumViewer();
      if (viewer) {
        this._cesiumLayers.forEach((dataSource, id) => {
          // 先关闭聚类避免 billboard 残留
          if (dataSource.clustering && dataSource.clustering.enabled) {
            try { dataSource.clustering.enabled = false; } catch (e) { /* ignore */ }
          }
          if (this._selectionManager) {
            this._selectionManager.unregisterLayer(id);
          }
          viewer.dataSources.remove(dataSource);
          // ⭐ 移除热力图叠加层
          this._removeHeatmapOverlay(id, viewer);
        });
      }
      // 清理热力图相机监听
      if (viewer) {
        this._heatmapMeta.forEach(function (meta) {
          if (meta.cameraHandler) {
            viewer.camera.changed.removeEventListener(meta.cameraHandler);
          }
        });
      }
      this._cesiumLayers.clear();
      this._heatmapLayers.clear();
      this._heatmapMeta.clear();
      this._labelStates = {};
      this._toggleLabelManagedLayerIds.clear(); // ⭐ 清理 toggleLabels 管理标记
      this.dismissEntityPopup();
      // ⭐ 强制刷新渲染
      if (viewer) viewer.scene.requestRender();
    },
    // ==================== 热力图叠加 ====================

    /**
     * 为点图层创建热力图叠加层
     *
     * 流程：
     *   1. HeatmapRenderer 根据 GeoJSON features 渲染热力图 Canvas
     *   2. 将 Canvas 包装为 Cesium SingleTileImageryProvider
     *   3. 以 imageryLayer 形式添加到 viewer.imageryLayers（覆盖在地形上）
     *
     * @param {Object} layer - 图层配置
     * @param {Object} geoJsonData - 已解析的 GeoJSON 数据
     * @param {Object} viewer - Cesium Viewer
     * @param {Object} Cesium - Cesium 全局对象
     */
    _createHeatmapOverlay(layer, geoJsonData, viewer, Cesium) {
      try {
        const features = geoJsonData.features;
        if (!features || features.length === 0) {
          console.warn(`[${this.componentName}] 🔥 热力图跳过: 无 feature 数据`);
          return;
        }

        // 1. 配置 HeatmapRenderer
        const valueField = layer.heatmapValueField || 'value';
        const blurSize = layer.heatmapBlur !== undefined ? layer.heatmapBlur : 30;
        const pointSize = layer.heatmapRadius !== undefined ? layer.heatmapRadius : 20;
        const opacity = layer.heatmapOpacity !== undefined ? layer.heatmapOpacity : 0.8;

        let gradient = undefined;
        if (layer.heatmapGradient) {
          try {
            gradient = typeof layer.heatmapGradient === 'string'
              ? JSON.parse(layer.heatmapGradient)
              : layer.heatmapGradient;
          } catch (e) {
            console.warn(`[${this.componentName}] 🔥 热力图渐变解析失败，使用默认配色:`, e);
          }
        }

        const renderer = new HeatmapRenderer({
          pointSize: pointSize,
          blurSize: blurSize,
          minOpacity: 0,
          maxOpacity: 1,
          gradient: gradient
        });

        // 计算全量数据的固定值域（用于缩放时保持颜色一致性）
        var allPops = features.map(f => (f.properties && f.properties[valueField]) || 0);
        var fixedValueRange = {
          min: Math.min.apply(null, allPops),
          max: Math.max.apply(null, allPops)
        };
        console.log(`[${this.componentName}] 🔥 全量值域: [${fixedValueRange.min}, ${fixedValueRange.max}]`);

        // 全量数据的经纬度边界（用于判断"所有点都在视口内"）
        var allLngs = features.map(f => (f.geometry && f.geometry.coordinates) ? f.geometry.coordinates[0] : 0);
        var allLats = features.map(f => (f.geometry && f.geometry.coordinates) ? f.geometry.coordinates[1] : 0);
        var fullExtent = {
          minLon: Math.min.apply(null, allLngs),
          maxLon: Math.max.apply(null, allLngs),
          minLat: Math.min.apply(null, allLats),
          maxLat: Math.max.apply(null, allLats)
        };

        // 存储热力图元数据
        const meta = {
          allFeatures: features,
          valueField: valueField,
          fixedValueRange: fixedValueRange,
          fullExtent: fullExtent,
          renderer: renderer,
          config: {
            blurSize: blurSize,
            pointSize: pointSize,
            opacity: opacity,
            gradient: gradient,
            layerName: layer.name
          },
          cameraHandler: null,
          currentBounds: null,  // 当前热力图图像的地理边界
          lastFeatureCount: features.length
        };
        this._heatmapMeta.set(layer.id, meta);

        // 渲染函数（初始渲染 + 视口变化时重渲染共用）
        const self = this;
        function renderHeatmap(feats) {
          if (!feats || feats.length === 0) return;

          const canvasSize = Math.min(1024, Math.max(512, Math.ceil(Math.sqrt(feats.length) * 48)));
          const result = renderer.renderFromGeoFeatures(feats, valueField, canvasSize, canvasSize, 0.15, fixedValueRange);

          console.log(`[${self.componentName}] 🔥 热力图渲染: canvas=${canvasSize}×${canvasSize}, features=${feats.length}/${meta.allFeatures.length}`);

          const canvas = result.canvas;
          const bounds = result.bounds;
          const imageUrl = canvas.toDataURL('image/png');

          const imageryProvider = new Cesium.SingleTileImageryProvider({
            url: imageUrl,
            rectangle: Cesium.Rectangle.fromDegrees(
              bounds.minLon, bounds.minLat,
              bounds.maxLon, bounds.maxLat
            )
          });

          const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
          imageryLayer.alpha = opacity;

          // 移除旧图层
          const oldLayer = self._heatmapLayers.get(layer.id);
          if (oldLayer) {
            viewer.imageryLayers.remove(oldLayer);
          }
          self._heatmapLayers.set(layer.id, imageryLayer);
          meta.currentBounds = bounds;  // 记录当前图像地理边界

          viewer.scene.requestRender();
          return imageryLayer;
        }

        // 初始渲染（全量 features）
        renderHeatmap(features);
        console.log(`[${this.componentName}] 🔥 热力图叠加层已添加: "${layer.name}", alpha=${opacity}`);

        // 注册相机变化监听：缩放/平移时根据可视范围重新渲染
        if (!meta.cameraHandler) {
          // 防抖：避免飞行动画期间频繁重渲染
          var debounceTimer = null;
          meta.cameraHandler = function () {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
              self._updateHeatmapViewport(layer.id, viewer, Cesium);
            }, 300); // 300ms 防抖
          };
          viewer.camera.changed.addEventListener(meta.cameraHandler);
        }

      } catch (err) {
        console.error(`[${this.componentName}] ❌ 热力图创建失败:`, err);
      }
    },

    /**
     * 根据当前相机视口过滤可见点位，重新渲染热力图
     */
    _updateHeatmapViewport(layerId, viewer, Cesium) {
      var meta = this._heatmapMeta.get(layerId);
      if (!meta || !meta.currentBounds) return;

      try {
        var rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
        if (!rect) return;

        var vpW = Cesium.Math.toDegrees(rect.west);
        var vpS = Cesium.Math.toDegrees(rect.south);
        var vpE = Cesium.Math.toDegrees(rect.east);
        var vpN = Cesium.Math.toDegrees(rect.north);

        // === 所有点都在视口内 → 跳过 ===
        var fe = meta.fullExtent;
        if (vpW <= fe.minLon && vpE >= fe.maxLon &&
            vpS <= fe.minLat && vpN >= fe.maxLat) {
          return;
        }

        // === 视口面积 / 热力图图像面积 ===
        // ratio < 0.7: 视口远小于图像(放大地图) → 图像被拉伸 → 需重渲染
        var ib = meta.currentBounds;
        var imgArea = (ib.maxLon - ib.minLon) * (ib.maxLat - ib.minLat);
        var vpArea = (vpE - vpW) * (vpN - vpS);
        var ratio = vpArea > 0 ? vpArea / imgArea : 1;
        var needRender = ratio < 0.7;

        if (!needRender) {
          var crossed = vpW > vpE;
          var visibleCount = 0;
          for (var i = 0; i < meta.allFeatures.length; i++) {
            var c = meta.allFeatures[i].geometry && meta.allFeatures[i].geometry.coordinates;
            if (!c || c.length < 2) continue;
            var ok = crossed ? (c[0] >= vpW || c[0] <= vpE) : (c[0] >= vpW && c[0] <= vpE);
            if (ok && c[1] >= vpS && c[1] <= vpN) visibleCount++;
          }
          if (visibleCount === meta.lastFeatureCount) return;
          meta.lastFeatureCount = visibleCount;
        }

        var crossed2 = vpW > vpE;
        var visibleFeatures = meta.allFeatures.filter(function (f) {
          var coords = f.geometry && f.geometry.coordinates;
          if (!coords || coords.length < 2) return false;
          var ok = crossed2 ? (coords[0] >= vpW || coords[0] <= vpE) : (coords[0] >= vpW && coords[0] <= vpE);
          return ok && coords[1] >= vpS && coords[1] <= vpN;
        });

        if (visibleFeatures.length === 0) {
          this._removeHeatmapOverlay(layerId, viewer);
          return;
        }

        console.log('[' + this.componentName + '] 🔄 重渲染: ' + visibleFeatures.length + '/' + meta.allFeatures.length +
                    ' 点位, 视口/图像=' + (ratio * 100).toFixed(0) + '%');

        var renderer = meta.renderer;
        var canvasSize = Math.min(1024, Math.max(512, Math.ceil(Math.sqrt(visibleFeatures.length) * 48)));
        var result = renderer.renderFromGeoFeatures(visibleFeatures, meta.valueField, canvasSize, canvasSize, 0.15, meta.fixedValueRange);

        var imageUrl = result.canvas.toDataURL('image/png');
        var imageryProvider = new Cesium.SingleTileImageryProvider({
          url: imageUrl,
          rectangle: Cesium.Rectangle.fromDegrees(
            result.bounds.minLon, result.bounds.minLat,
            result.bounds.maxLon, result.bounds.maxLat
          )
        });

        var imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
        imageryLayer.alpha = meta.config.opacity;

        var oldLayer = this._heatmapLayers.get(layerId);
        if (oldLayer) viewer.imageryLayers.remove(oldLayer);
        this._heatmapLayers.set(layerId, imageryLayer);
        meta.currentBounds = result.bounds;

        viewer.scene.requestRender();

      } catch (err) {
        console.warn('[' + this.componentName + '] ⚠️ 热力图视口更新失败:', err);
      }
    },

    /**
     * 移除热力图叠加层
     * @param {string} layerId - 图层 ID
     * @param {Object} viewer - Cesium Viewer
     */
    _removeHeatmapOverlay(layerId, viewer) {
      const imageryLayer = this._heatmapLayers.get(layerId);
      if (imageryLayer) {
        try {
          viewer.imageryLayers.remove(imageryLayer);
        } catch (e) {
          console.warn(`[${this.componentName}] ⚠️ 移除热力图叠加层异常:`, e);
        }
        this._heatmapLayers.delete(layerId);
      }
      // 清理热力图元数据和相机监听
      const meta = this._heatmapMeta.get(layerId);
      if (meta) {
        if (meta.cameraHandler && viewer) {
          viewer.camera.changed.removeEventListener(meta.cameraHandler);
        }
        this._heatmapMeta.delete(layerId);
      }
      console.log(`[${this.componentName}] 🔥 热力图叠加层已移除: id=${layerId}`);
    },

    // ==================== 实体选中 & 属性弹窗 ====================

    /**
     * 为已加载的数据源注册实体拾取
     */
    _registerEntityPicking(layer, dataSource) {
      if (!this._selectionManager) {
        this._selectionManager = EntitySelectionManager.getInstance();
      }
      const viewer = this.getCesiumViewer();
      if (!viewer) return;

      const self = this;
      this._selectionManager.registerLayer(viewer, layer.id, dataSource, {
        mode: 'click',
        enableHighlight: true,
        enableClustering: layer.clusterEnabled !== false,
        highlightDuration: 2,
        continuous: true,
        onSelect: function (payload) {
          self._onEntitySelected(layer, payload);
        },
        onDismiss: function () {
          self.dismissEntityPopup();
        }
      });
      console.log(`[${this.componentName}] 🎯 实体拾取已注册: "${layer.name}" (聚类=${layer.clusterEnabled !== false})`);
    },

    /**
     * 实体被选中回调 → 展示属性弹窗 + 启用位置跟踪
     */
    _onEntitySelected(layer, payload) {
      this.popupTitle = payload.title || layer.name || '实体属性';
      this.popupProperties = payload.properties || [];
      this.popupGeoType = payload.geoType || '';
      this.popupLayerName = layer.name || '';
      this._popupSelectedEntity = payload.entity;
      this._popupSelectedLayerId = layer.id;

      // 设置初始屏幕位置
      if (payload.screenPosition) {
        this.popupScreenX = payload.screenPosition.x;
        this.popupScreenY = payload.screenPosition.y;
      }

      // ⭐ 聚类实体不需要位置跟踪（dummy entity 的 position 是 billboard 锚点，
      //    与点击位置有偏移），弹窗保持在点击屏幕位置即可
      if (!payload._isCluster) {
        this._startPopupTracking(payload.entity);
      } else {
        if (this._selectionManager) this._selectionManager.stopTracking();
      }

      // 显示弹窗
      this.showEntityPopup = true;
      console.log(`[${this.componentName}] 📋 属性弹窗已打开: "${this.popupTitle}" (${this.popupProperties.length} 项属性)`);
    },

    /**
     * 位置跟踪：通过 postRender 实时更新弹窗屏幕坐标
     */
    _startPopupTracking(entity) {
      if (!this._selectionManager) return;

      const viewer = this.getCesiumViewer();
      if (!viewer) return;

      const self = this;
      this._selectionManager.stopTracking(); // 停止之前的跟踪

      this._selectionManager.trackScreenPosition(viewer, entity, function (screenPos) {
        if (self.showEntityPopup && screenPos) {
          self.popupScreenX = screenPos.x;
          self.popupScreenY = screenPos.y;
        }
      });
    },

    /**
     * 飞行定位到当前选中的实体
     */
    flyToSelectedEntity() {
      const entity = this._popupSelectedEntity;
      if (!entity) return;

      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium || !entity.position) {
        console.warn(`[${this.componentName}] ⚠️ 无法定位 — 实体无 position`);
        return;
      }

      try {
        const position = entity.position.getValue
          ? entity.position.getValue(viewer.clock.currentTime)
          : entity.position;

        if (!position) return;

        viewer.camera.flyTo({
          destination: position,
          duration: 1.5,
          offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500)
        });
        console.log(`[${this.componentName}] 🎯 已飞至实体: "${this.popupTitle}"`);
      } catch (e) {
        console.warn(`[${this.componentName}] ⚠️ 飞行定位失败:`, e.message);
      }
    },

    /**
     * 弹窗中可点击行被点击 → 飞行定位到该实体 + 关闭弹窗 + 闪烁
     */
    onPopupRowClick({ prop }) {
      if (!prop._worldPos) return;
      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;

      var worldPos = prop._worldPos;
      var layerId = this._popupSelectedLayerId;

      // 1. 飞行定位：保持当前相机高度，仅平移到目标经纬度（不缩放）
      var cg = Cesium.Cartographic.fromCartesian(worldPos);
      var currentHeight = viewer.camera.positionCartographic.height;
      var dest = Cesium.Cartesian3.fromDegrees(
        Cesium.Math.toDegrees(cg.longitude),
        Cesium.Math.toDegrees(cg.latitude),
        currentHeight
      );
      viewer.camera.flyTo({
        destination: dest,
        duration: 0.6,
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: 0
        }
      });

      // 2. 关闭弹窗
      this.dismissEntityPopup();

      // 3. 飞行到位后尝试 drillPick 找实体并闪烁
      setTimeout(() => {
        try {
          var sp = viewer.scene.cartesianToCanvasCoordinates(worldPos);
          if (!sp) return;
          var dpResults = viewer.scene.drillPick(new Cesium.Cartesian2(sp.x, sp.y), 5);
          for (var i = 0; i < dpResults.length; i++) {
            var entity = dpResults[i].id || (dpResults[i].primitive && dpResults[i].primitive.id);
            if (entity && !entity._isClusterPrimitive && this._selectionManager && layerId) {
              this._selectionManager.selectEntity(layerId, entity, { x: sp.x, y: sp.y });
              return;
            }
          }
        } catch (e) { /* ignore */ }
      }, 900);
    },

    /**
     * 关闭属性弹窗 + 清除位置跟踪
     */
    dismissEntityPopup() {
      this.showEntityPopup = false;
      this._popupSelectedEntity = null;
      this._popupSelectedLayerId = null;

      if (this._selectionManager) {
        this._selectionManager.stopTracking();
      }
      console.log(`[${this.componentName}] 🔒 属性弹窗已关闭`);
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
/* Header "工具"按钮 */
.header-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #b0b0b0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: auto;
}
.header-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.25);
}
.header-tool-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

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

/* toolbar-extra 中的 JSON 刷新按钮 */
.geojson-toolbar-refresh-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; min-width: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 165, 0, 0.15);
  color: #ffa726;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.geojson-toolbar-refresh-btn:hover:not(:disabled) {
  background: rgba(255, 165, 0, 0.3);
  border-color: #ffa726;
}
.geojson-toolbar-refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>