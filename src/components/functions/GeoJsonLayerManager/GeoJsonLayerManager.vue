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
  />
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import rawPanelMetadata from './GeoJsonLayerManager.config.json';
import EntitySelectionManager from '../../../utils/EntitySelectionManager.js';
import EntityInfoPopup from '../../common/EntityInfoPopup.vue';

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
      _labelStates: {},
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

          // 输出标记类型日志
          const markerDesc = needsCustomIcon
            ? `emoji canvas 共享 ("${markerIcon}")`
            : (isSingleAscii ? `PinBuilder.fromText("${markerIcon}")` : 'PinBuilder.fromColor() 渐变圆点');
          console.log(`[${this.componentName}] 🎯 标记策略: ${markerDesc}, 实体数: ${entities.length}`);

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
        // ⭐ 注销实体拾取
        if (this._selectionManager) {
          this._selectionManager.unregisterLayer(layer.id);
        }
        viewer.dataSources.remove(dataSource);
        this._cesiumLayers.delete(layer.id);
        this._labelStates = { ...this._labelStates, [layer.id]: false };
        this.updateItemState(layer.id, { loaded: false, loading: false });
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

      const dataSource = this._cesiumLayers.get(item.id);
      if (!dataSource) return;

      const labelField = item.labelField || 'name';
      const isShown = this._isLabelsShown(item.id);
      const entities = dataSource.entities.values;

      if (isShown) {
        // 隐藏：仅设置 show = false，保留 label 对象避免下次重建
        let count = 0;
        entities.forEach(entity => {
          if (entity.label) {
            entity.label.show = false;
            count++;
          }
        });
        this._labelStates = { ...this._labelStates, [item.id]: false };
        console.log(`[${this.componentName}] 🏷️ 文本标注已隐藏: "${item.name}" (${count} 个)`);
      } else {
        const fontSize = item.labelFontSize || 28;
        const labelScale = item.labelScale || 1.2;
        const labelColor = item.labelColor || '#a6fd1c';
        const visMin = item.labelVisibleMin ?? 0;
        const visMax = item.labelVisibleMax ?? 50000;

        // 检查是否已有 label（之前创建过，只需 show = true）
        const firstEntity = entities.length > 0 ? entities[0] : null;
        const labelsExist = firstEntity && firstEntity.label;

        if (labelsExist) {
          // 快速路径：已有 label，仅恢复 show = true
          let count = 0;
          entities.forEach(entity => {
            if (entity.label) {
              entity.label.show = true;
              count++;
            }
          });
          console.log(`[${this.componentName}] 🏷️ 文本标注已恢复: "${item.name}" (${count} 个，复用已有 label)`);
        } else {
          // 首次创建路径：逐实体构建 label 对象
          let count = 0;
          entities.forEach((entity, idx) => {
            const props = entity.properties?.getValue?.();
            const text = props ? props[labelField] : null;
            if (text == null) {
              console.warn(`[${this.componentName}] ⚠️ entity[${idx}] 缺少字段 "${labelField}"`);
              return;
            }
            // 计算标注位置：点用自身坐标；线/面取几何中心
            let position = entity.position?.getValue?.();
            if (!position) {
              if (entity.polyline) {
                const positions = entity.polyline.positions?.getValue?.();
                if (positions?.length >= 2) {
                  position = Cesium.Cartesian3.lerp(positions[0], positions[1], 0.5, new Cesium.Cartesian3());
                }
              } else if (entity.polygon) {
                const hierarchy = entity.polygon.hierarchy?.getValue?.();
                if (hierarchy?.positions?.length) {
                  const center = Cesium.BoundingSphere.fromPoints(hierarchy.positions).center;
                  position = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(center);
                }
              }
            }

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
            count++;
          });
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
          if (this._selectionManager) {
            this._selectionManager.unregisterLayer(id);
          }
          viewer.dataSources.remove(dataSource);
        });
      }
      this._cesiumLayers.clear();
      this._labelStates = {};
      this.dismissEntityPopup();
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

      // 启用 postRender 位置跟踪（实体移动 / 相机移动时跟随）
      this._startPopupTracking(payload.entity);

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