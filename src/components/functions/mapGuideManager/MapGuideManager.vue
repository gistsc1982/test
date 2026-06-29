<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="520"
    :panel-max-height="'80vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="mapGuideManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'MapGuideManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'MapGuideManager'"
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
    <!-- 列表项：checkbox + 路线名称和起终点信息 -->
    <template #list-item="{ item }">
      <label class="guide-checkbox-label" @click.stop>
        <input
          type="checkbox"
          :checked="_isChecked(item)"
          @change="_toggleCheck(item, $event)"
          class="checkbox-input"
        />
        <span class="check-indicator"></span>
        <div class="guide-item-info">
          <span class="guide-name">{{ item.name || '未命名路线' }}</span>
          <div class="guide-coords">
            <span class="coord-tag start">起: {{ formatCoord(item.startLng) }}, {{ formatCoord(item.startLat) }}</span>
            <span class="coord-arrow">→</span>
            <span class="coord-tag end">终: {{ formatCoord(item.endLng) }}, {{ formatCoord(item.endLat) }}</span>
          </div>
          <span v-if="item._activeRoute" class="route-badge">
            🟢 {{ item._routeDistance ? (item._routeDistance / 1000).toFixed(1) + 'km' : '' }}
            {{ item._routeDuration ? formatDuration(item._routeDuration) : '' }}
          </span>
          <span v-if="_isChecked(item)" class="checked-badge">✓ 已选中</span>
        </div>
      </label>
    </template>

    <!-- 操作按钮 -->
    <template #item-actions="{ item }">
      <button
        @click="showRouteOnMap(item)"
        class="action-btn show-btn"
        type="button"
        :title="item._activeRoute ? '刷新路线' : '显示路线'"
      >
        {{ item._activeRoute ? '🔄' : '🗺️' }}
      </button>
      <button
        v-if="item._activeRoute"
        @click="toggleAnimation(item)"
        class="action-btn play-btn"
        type="button"
        :title="item._animPaused ? '恢复动画' : (item._animating ? '暂停动画' : '路书动画')"
      >
        {{ item._animPaused ? '▶️' : (item._animating ? '⏸️' : '▶️') }}
      </button>
      <button
        @click="locateRoute(item)"
        class="action-btn locate-btn"
        type="button"
        title="定位到路线"
      >
        📍
      </button>
      <button
        @click="drawOnCesium(item)"
        class="action-btn cesium-btn"
        type="button"
        title="在Cesium三维地图上绘制"
      >
        🌍
      </button>
      <button
        @click="hideRoute(item)"
        class="action-btn hide-btn"
        type="button"
        title="清除路线"
      >
        🗑️
      </button>
    </template>

    <!-- 底部：百度地图容器 -->
    <template #dialogs>
      <div v-if="activeGuide" class="baidu-map-section">
        <div class="map-toolbar">
          <span class="map-title">🚗 {{ activeGuide.name || '路线详情' }}</span>
          <div class="map-toolbar-actions">
            <span class="route-info">
              <span v-if="activeGuide._routeDistance">📏 {{ (activeGuide._routeDistance / 1000).toFixed(2) }} km</span>
              <span v-if="activeGuide._routeDuration">⏱️ {{ formatDuration(activeGuide._routeDuration) }}</span>
            </span>
            <button @click="switchRoute(activeGuide, -1)" class="map-btn" title="切换方案">◀</button>
            <span class="route-plan-label">
              方案 {{ (activeGuide._currentPlan || 0) + 1 }}/{{ activeGuide._totalPlans || 1 }}
            </span>
            <button @click="switchRoute(activeGuide, 1)" class="map-btn" title="切换方案">▶</button>
            <button @click="toggleAnimation(activeGuide)" class="map-btn play-btn"
              :title="activeGuide._animPaused ? '恢复动画' : (activeGuide._animating ? '暂停动画' : '路书动画')">
              {{ activeGuide._animPaused ? '▶️' : (activeGuide._animating ? '⏸️' : '▶️') }}
            </button>
            <button @click="hideRoute(activeGuide)" class="map-btn close-btn" title="关闭">✕</button>
          </div>
        </div>
        <div ref="baiduMapContainer" class="baidu-map-container"></div>
      </div>

      <!-- 右键更新确认对话框 -->
      <div v-if="_showUpdateDialog" class="update-dialog-overlay" @click.self="_cancelUpdate">
        <div class="update-dialog">
          <div class="dialog-header">
            <span>📝 确认更新路线数据</span>
            <button @click="_cancelUpdate" class="dialog-close-btn">✕</button>
          </div>
          <div class="dialog-body">
            <p class="dialog-hint">
              右键菜单已设置新的起点和终点坐标，确认后将更新选中行
              <strong>"{{ _pendingUpdateItem?.name || '未命名' }}"</strong> 的数据：
            </p>
            <table class="update-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>当前值</th>
                  <th>→</th>
                  <th>新值</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>起点经度</td>
                  <td>{{ formatCoord(_pendingUpdateItem?.startLng) }}</td>
                  <td>→</td>
                  <td class="new-value">{{ formatCoord(_pendingNewValues?.startLng) }}</td>
                </tr>
                <tr>
                  <td>起点纬度</td>
                  <td>{{ formatCoord(_pendingUpdateItem?.startLat) }}</td>
                  <td>→</td>
                  <td class="new-value">{{ formatCoord(_pendingNewValues?.startLat) }}</td>
                </tr>
                <tr>
                  <td>终点经度</td>
                  <td>{{ formatCoord(_pendingUpdateItem?.endLng) }}</td>
                  <td>→</td>
                  <td class="new-value">{{ formatCoord(_pendingNewValues?.endLng) }}</td>
                </tr>
                <tr>
                  <td>终点纬度</td>
                  <td>{{ formatCoord(_pendingUpdateItem?.endLat) }}</td>
                  <td>→</td>
                  <td class="new-value">{{ formatCoord(_pendingNewValues?.endLat) }}</td>
                </tr>
                <tr v-if="_pendingNewValues?.startAddr || _pendingNewValues?.endAddr">
                  <td>起点/终点地址</td>
                  <td>{{ _pendingUpdateItem?.startAddr || '--' }} / {{ _pendingUpdateItem?.endAddr || '--' }}</td>
                  <td>→</td>
                  <td class="new-value">{{ _pendingNewValues?.startAddr || '--' }} / {{ _pendingNewValues?.endAddr || '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="dialog-footer">
            <button @click="_confirmUpdate" class="dialog-btn confirm-btn">✅ 确认更新</button>
            <button @click="_cancelUpdate" class="dialog-btn cancel-btn">取消</button>
          </div>
        </div>
      </div>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import rawPanelMetadata from './MapGuideManager.config.json';

const panelMetadata = rawPanelMetadata;

// 路线颜色方案
const ROUTE_COLORS = ['#e74c3c', '#3498db', '#2ecc71'];

export default {
  name: 'MapGuideManager',

  components: { JsonConfigPanelBase },

  props: {
    initialX:    { type: [Number, String], default: 'right' },
    initialY:    { type: Number, default: 120 },
    panelName:   { type: String, default: null },
    autoRegister: { type: Boolean, default: true },
    panelInstanceId: { type: Number, default: null },
    registrationKey: { type: String, default: null }
  },

  data() {
    return {
      componentName: 'MapGuideManager',
      panelMetadata,
      activeGuide: null,
      _checkedItems: {},
      _showUpdateDialog: false,
      _pendingUpdateItem: null,
      _pendingNewValues: null,
      _baiduMap: null,
      _bmapLoaded: false,
      _bmapLoading: false,
      _mapReadyCallbacks: [],
      _cesiumRouteEntities: [],
      _cesiumCarEntity: null,
      _cesiumAnimFrame: null,
      _cesiumAnimPath: null,
      _cesiumPausedFraction: 0
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

  beforeUnmount() {
    this._stopCesiumCarAnimation();
    this._disposeBaiduMap();
    this._clearCesiumRoutes();
  },

  methods: {
    // ===================== 初始化 =====================

    initConfigStrategy() {
      const dataSourceType = this.panelMetadata.dataSource?.type || 'json';
      const featureFolder = this.panelMetadata.featureFolder || 'mapGuideManager';
      const fileName = this.panelMetadata.dataSource?.fileName || 'MapGuideManager';
      const tableName = this.panelMetadata.dataSource?.tableName || 'map_guide_configs';

      this._configStrategy = ConfigStrategyFactory.createWithFallback(
        [dataSourceType, 'json'],
        featureFolder, fileName, tableName
      );
      console.log(`[${this.componentName}] ✅ 配置加载策略: ${this._configStrategy.getName()}`);
    },

    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 路线配置加载完成: ${this.configList.length} 条`);
    },

    // ===================== 百度地图加载 =====================

    async _ensureBaiduMap() {
      if (this._baiduMap) return this._baiduMap;

      await this._loadBMapAPI();

      const container = this.$refs.baiduMapContainer;
      if (!container) {
        console.error(`[${this.componentName}] ❌ 地图容器未找到`);
        return null;
      }

      const point = new BMap.Point(114.02, 22.62);
      const map = new BMap.Map(container, {
        enableMapClick: true
      });
      map.centerAndZoom(point, 14);
      map.enableScrollWheelZoom(true);
      map.addControl(new BMap.NavigationControl());
      map.addControl(new BMap.ScaleControl());

      this._baiduMap = map;
      console.log(`[${this.componentName}] ✅ 百度地图初始化成功`);
      return map;
    },

    /**
     * 动态加载百度地图 API v2.0
     *
     * BMap v2.0 在动态插入 script 时会因为内部 document.write 静默失败，导致
     * BMap 永不挂载。解决方案：临时拦截 document.write，捕获 v2.0 生成的
     * 子脚本 URL，再以动态 script 方式逐个加载。
     */
    async _loadBMapAPI() {
      if (typeof BMap !== 'undefined' && typeof BMap.Map === 'function') {
        this._bmapLoaded = true;
        return;
      }
      if (this._bmapLoading) {
        return new Promise(resolve => this._mapReadyCallbacks.push(resolve));
      }

      this._bmapLoading = true;

      // 检查页面中是否已有 BMap API 脚本标签
      const existing = document.querySelector('script[src*="api.map.baidu.com/api"]');
      if (existing) {
        console.log(`[${this.componentName}] 🔍 检测到已有 BMap 脚本，等待就绪...`);
        try {
          await this._pollForGlobal('BMap', 10000);
          this._bmapLoaded = true;
          this._bmapLoading = false;
          await this._loadLuShuIfNeeded();
          return;
        } catch (e) {
          this._bmapLoading = false;
          throw new Error('BMap API 加载超时（已有script标签但BMap未就绪）');
        }
      }

      // 动态加载，使用 document.write 拦截
      console.log(`[${this.componentName}] 📡 动态加载百度地图 API v2.0（document.write 拦截模式）...`);
      try {
        await this._loadBMapWithWriteIntercept();
        this._bmapLoaded = true;
        this._bmapLoading = false;
        await this._loadLuShuIfNeeded();
        this._mapReadyCallbacks.forEach(cb => cb());
        this._mapReadyCallbacks = [];
      } catch (e) {
        this._bmapLoading = false;
        throw e;
      }
    },

    /**
     * 使用 document.write 拦截方式加载 BMap v2.0
     * 原理：临时重写 document.write 捕获 BMap v2.0 内部分发的子脚本，
     * 将其转为动态 script 标签加载，避免 document.write 在页面加载后失效的问题。
     */
    async _loadBMapWithWriteIntercept() {
      const capturedScripts = [];
      const originalWrite = document.write;

      // 拦截 document.write，捕获 <script> 标签
      document.write = function(html) {
        const match = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (match) {
          capturedScripts.push(match[1]);
        } else {
          // 非脚本内容追加到隐藏容器，避免干扰页面
          const div = document.createElement('div');
          div.style.display = 'none';
          div.innerHTML = html;
          document.body.appendChild(div);
        }
      };

      try {
        // 加载 BMap v2.0 主脚本
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = 'https://api.map.baidu.com/api?v=2.0&ak=BzReTZGRopdkZPTOTZqNoxTuPQuSRmtH';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('BMap API 主脚本加载失败'));
          document.head.appendChild(script);
        });

        // 恢复 document.write
        document.write = originalWrite;

        // 逐个加载捕获的子脚本（BMap 核心模块）
        if (capturedScripts.length > 0) {
          console.log(`[${this.componentName}] 📦 加载 ${capturedScripts.length} 个 BMap 子模块...`);
          await Promise.all(capturedScripts.map(src => {
            return new Promise((resolve) => {
              const s = document.createElement('script');
              s.src = src;
              s.onload = () => resolve();
              s.onerror = () => {
                console.warn(`[${this.componentName}] ⚠️ 子模块加载失败: ${src}`);
                resolve(); // 不阻塞
              };
              document.head.appendChild(s);
            });
          }));
        }

        // 等待 BMap 就绪
        console.log(`[${this.componentName}] ⏳ BMap 子模块加载完成，等待 BMap 就绪...`);
        await this._pollForGlobal('BMap', 10000);
        console.log(`[${this.componentName}] ✅ BMap API 就绪`);
      } catch (e) {
        document.write = originalWrite; // 恢复
        throw e;
      }
    },

    /**
     * 轮询等待全局变量就绪
     * @param {string} globalName - 全局变量名（如 'BMap', 'BMapLib'）
     * @param {number} timeoutMs - 超时毫秒
     */
    _pollForGlobal(globalName, timeoutMs = 10000) {
      const start = Date.now();
      return new Promise((resolve, reject) => {
        const check = () => {
          const parts = globalName.split('.');
          let obj = window;
          for (const p of parts) {
            if (obj == null) break;
            obj = obj[p];
          }
          // BMap 需要 .Map 方法，BMapLib 需要 .LuShu 构造函数
          const isValid = globalName === 'BMap'
            ? (typeof obj !== 'undefined' && typeof obj.Map === 'function')
            : (typeof obj !== 'undefined');
          if (isValid) {
            resolve();
            return;
          }
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`${globalName} 加载超时`));
            return;
          }
          setTimeout(check, 100);
        };
        check();
      });
    },

    /**
     * 加载 LuShu 路书库（依赖 BMap 已就绪）
     */
    async _loadLuShuIfNeeded() {
      if (typeof BMapLib !== 'undefined' && typeof BMapLib.LuShu === 'function') {
        return;
      }

      const existing = document.querySelector('script[src*="LuShu"]');
      if (existing) {
        console.log(`[${this.componentName}] 🔍 LuShu 脚本已存在，等待就绪...`);
        try {
          await this._pollForGlobal('BMapLib.LuShu', 5000);
        } catch (e) {
          console.warn(`[${this.componentName}] ⚠️ LuShu 就绪超时，动画不可用`);
        }
        return;
      }

      console.log(`[${this.componentName}] 📡 加载 LuShu 路书库...`);
      try {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://api.map.baidu.com/library/LuShu/1.2/src/LuShu_min.js';
          script.onload = () => resolve();
          script.onerror = () => {
            console.warn(`[${this.componentName}] ⚠️ LuShu 库加载失败，动画功能不可用`);
            resolve();
          };
          document.head.appendChild(script);
        });
        console.log(`[${this.componentName}] ✅ LuShu 库加载完成`);
      } catch (e) {
        console.warn(`[${this.componentName}] ⚠️ LuShu 库加载异常:`, e.message);
      }
    },

    _disposeBaiduMap() {
      this._safeStopLuShu();
      if (this._baiduMap) {
        this._baiduMap.clearOverlays();
        this._baiduMap = null;
      }
      this.activeGuide = null;
    },

    // ===================== 路线显示 =====================

    async showRouteOnMap(guide) {
      console.log(`[${this.componentName}] 🗺️ 显示路线:`, guide.name);

      if (this.activeGuide && this.activeGuide !== guide) {
        this._resetGuide(this.activeGuide);
      }

      this.activeGuide = guide;

      await this.$nextTick();
      const map = await this._ensureBaiduMap();
      if (!map) return;

      map.clearOverlays();

      const startLng = parseFloat(guide.startLng);
      const startLat = parseFloat(guide.startLat);
      const endLng   = parseFloat(guide.endLng);
      const endLat   = parseFloat(guide.endLat);
      const startCity = guide.startCity || '深圳';
      const endCity   = guide.endCity || '深圳';

      // 起点标记
      const startPt = new BMap.Point(startLng, startLat);
      const startMarker = new BMap.Marker(startPt);
      startMarker.setLabel(new BMap.Label('起', { offset: new BMap.Size(-10, -10) }));
      map.addOverlay(startMarker);

      // 终点标记
      const endPt = new BMap.Point(endLng, endLat);
      const endMarker = new BMap.Marker(endPt);
      endMarker.setLabel(new BMap.Label('终', { offset: new BMap.Size(-10, -10) }));
      map.addOverlay(endMarker);

      // 设置右键菜单（设置起点/终点）
      this._setupContextMenu(map, guide);

      // 计算驾车路线
      const driving = new BMap.DrivingRoute(map, {
        renderOptions: { map: map, autoViewport: true },
        onSearchComplete: (res) => {
          if (driving.getStatus() !== BMAP_STATUS_SUCCESS) {
            console.error(`[${this.componentName}] ❌ 路线计算失败`);
            return;
          }

          this._routePlans = [];

          // BMap v2.0 兼容：getNumPlans 可能是方法或属性
          const planCount = typeof res.getNumPlans === 'function'
            ? res.getNumPlans()
            : (res.getNumPlans || 1);

          for (let i = 0; i < planCount && i < 3; i++) {
            const plan = res.getPlan(i);
            if (!plan) continue;

            // plan.getDistance / plan.getDuration 防御性调用
            const planDist = this._safeGet(plan, 'getDistance', false, 0);
            const planDur  = this._safeGet(plan, 'getDuration', false, 0);

            // BMap v2.0 兼容：getNumRoutes 可能是方法或属性
            const routeCount = typeof plan.getNumRoutes === 'function'
              ? plan.getNumRoutes()
              : (plan.getNumRoutes || 1);

            const routes = [];
            for (let j = 0; j < routeCount; j++) {
              const route = plan.getRoute(j);
              if (!route) continue;
              const path = route.getPath();
              if (!path) continue;

              const plainPath = [];
              for (let k = 0; k < path.length; k++) {
                plainPath.push({ lng: path[k].lng, lat: path[k].lat });
              }
              routes.push({
                path: plainPath,
                distance: this._safeGet(route, 'getDistance', false, 0),
                duration: this._safeGet(route, 'getDuration', false, 0)
              });
            }

            this._routePlans.push({
              index: i,
              routes: routes,
              totalDistance: planDist,
              totalDuration: planDur
            });
          }

          guide._totalPlans = this._routePlans.length;
          guide._currentPlan = 0;
          guide._animating = false;
          guide._activeRoute = true;
          guide._routeDistance = this._routePlans[0]?.totalDistance || 0;
          guide._routeDuration = this._routePlans[0]?.totalDuration || 0;

          this._displayCurrentPlan(guide, map);
          console.log(`[${this.componentName}] ✅ 路线计算完成: ${planCount} 个方案`);
        }
      });

      driving.search(startPt, endPt);
    },

    /**
     * 安全调用 BMap API 方法，兼容不同版本的方法/属性差异
     */
    _safeGet(obj, methodName, format, defaultValue) {
      try {
        if (typeof obj[methodName] === 'function') {
          return obj[methodName](format);
        }
        // 某些版本可能是直接属性
        if (obj[methodName] !== undefined) {
          return obj[methodName];
        }
        return defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },

    /**
     * 为百度地图设置右键菜单（设置起终点）
     */
    _setupContextMenu(map, guide) {
      // 避免重复添加
      if (map._contextMenuSet) return;
      map._contextMenuSet = true;

      const menu = new BMap.ContextMenu();

      menu.addItem(new BMap.MenuItem('📍 设为起点', () => {
        const pt = map.getContextMenuPoint?.() || menu._lastPoint;
        if (!pt) return;
        guide.startLng = pt.lng;
        guide.startLat = pt.lat;
        this._addOrUpdateMarker(map, pt, '起', '#e74c3c');
        console.log(`[${this.componentName}] 📍 起点已设置: ${pt.lng.toFixed(6)}, ${pt.lat.toFixed(6)}`);
      }));

      menu.addItem(new BMap.MenuItem('🏁 设为终点', () => {
        const pt = map.getContextMenuPoint?.() || menu._lastPoint;
        if (!pt) return;
        guide.endLng = pt.lng;
        guide.endLat = pt.lat;
        this._addOrUpdateMarker(map, pt, '终', '#3498db');
        console.log(`[${this.componentName}] 🏁 终点已设置: ${pt.lng.toFixed(6)}, ${pt.lat.toFixed(6)}`);
      }));

      menu.addItem(new BMap.MenuItem('🚗 路径分析', () => {
        // 如果已有勾选行且起终点已设置 → 弹出确认更新对话框
        if (this._tryUpdateCheckedRow()) return;
        // 否则直接执行路线分析显示
        this.showRouteOnMap(guide);
      }));

      menu.addItem(new BMap.MenuItem('💾 更新并分析', () => {
        // 强制执行更新选中行 + 路径分析
        if (this._tryUpdateCheckedRow()) {
          // 更新成功后自动显示路线
          this.$nextTick(() => this.showRouteOnMap(this._pendingUpdateItem || guide));
        } else {
          this.showRouteOnMap(guide);
        }
      }));

      menu.addItem(new BMap.MenuItem('📋 获取坐标', () => {
        const pt = map.getContextMenuPoint?.() || menu._lastPoint;
        if (pt) {
          const text = `lng: ${pt.lng.toFixed(6)}, lat: ${pt.lat.toFixed(6)}`;
          // 尝试用 alert，也复制到剪贴板
          if (navigator.clipboard) {
            navigator.clipboard.writeText(JSON.stringify({ lng: pt.lng, lat: pt.lat }));
          }
          alert(text);
        }
      }));

      map.addContextMenu(menu);

      // BMap 右键获取点需要监听 rightclick 事件来记录位置
      map.addEventListener('rightclick', (e) => {
        menu._lastPoint = e.point;
      });
    },

    _addOrUpdateMarker(map, point, labelText, color) {
      // 移除同标签的旧标记
      const overlays = map.getOverlays();
      for (let i = overlays.length - 1; i >= 0; i--) {
        const o = overlays[i];
        if (o instanceof BMap.Marker && o._labelText === labelText) {
          map.removeOverlay(o);
        }
      }

      const marker = new BMap.Marker(point);
      marker._labelText = labelText;
      marker.setLabel(new BMap.Label(labelText, {
        offset: new BMap.Size(-12, -12),
        style: { color: color, fontSize: '14px', fontWeight: 'bold' }
      }));
      map.addOverlay(marker);

      // 保存到 guide 引用
      if (labelText === '起') {
        this._startCustomMarker = marker;
      } else {
        this._endCustomMarker = marker;
      }
    },

    _displayCurrentPlan(guide, map) {
      if (!map) map = this._baiduMap;
      if (!map || !guide) return;

      // 清除旧的多段线（保留起终点标记）
      const overlays = map.getOverlays();
      for (let i = overlays.length - 1; i >= 0; i--) {
        if (overlays[i] instanceof BMap.Polyline) {
          map.removeOverlay(overlays[i]);
        }
      }

      const planIdx = guide._currentPlan || 0;
      const plan = this._routePlans?.[planIdx];
      if (!plan) return;

      guide._routeDistance = plan.totalDistance;
      guide._routeDuration = plan.totalDuration;

      plan.routes.forEach((route, idx) => {
        const points = route.path.map(p => new BMap.Point(p.lng, p.lat));
        const polyline = new BMap.Polyline(points, {
          strokeColor: ROUTE_COLORS[idx % ROUTE_COLORS.length],
          strokeWeight: 6,
          strokeOpacity: 0.7
        });
        map.addOverlay(polyline);
        route._polyline = polyline;
      });

      map.setViewport(plan.routes.flatMap(r => r.path.map(p => new BMap.Point(p.lng, p.lat))));
    },

    switchRoute(guide, delta) {
      if (!guide || !this._routePlans?.length) return;
      const total = this._routePlans.length;
      guide._currentPlan = ((guide._currentPlan || 0) + delta + total) % total;
      this._displayCurrentPlan(guide);
    },

    // ===================== 路书动画 =====================

    toggleAnimation(guide) {
      if (!guide || !guide._activeRoute) return;

      if (guide._animating && !guide._animPaused) {
        // 正在播放 → 暂停
        this._pauseAnimation(guide);
        return;
      }

      if (guide._animPaused && this._lushuInstance) {
        // 已暂停 → 恢复播放
        this._resumeAnimation(guide);
        return;
      }

      // 未在播放 → 新建动画
      this._startAnimation(guide);
    },

    _pauseAnimation(guide) {
      // LuShu 暂停
      if (this._lushuInstance && typeof this._lushuInstance.pause === 'function') {
        try { this._lushuInstance.pause(); } catch (e) { /* ignore */ }
      }
      guide._animating = false;
      guide._animPaused = true;

      // Cesium 暂停：保存当前进度
      if (this._cesiumAnimFrame) {
        cancelAnimationFrame(this._cesiumAnimFrame);
        this._cesiumAnimFrame = null;
      }
      // 从 entity 当前位置反算 fraction
      if (this._cesiumCarEntity && this._cesiumAnimPath) {
        const pos = this._cesiumCarEntity.position?.getValue?.();
        if (pos) this._cesiumPausedFraction = this._computePositionFraction(pos);
      }
      console.log(`[${this.componentName}] ⏸️ 动画已暂停`);
    },

    _resumeAnimation(guide) {
      guide._animating = true;
      guide._animPaused = false;

      // LuShu 恢复
      if (this._lushuInstance && typeof this._lushuInstance.start === 'function') {
        try { this._lushuInstance.start(); } catch (e) { /* ignore */ }
      }

      // Cesium 恢复：从保存的 fraction 继续
      if (this._cesiumAnimPath && this._cesiumCarEntity) {
        this._resumeCesiumFromFraction(this._cesiumPausedFraction || 0);
      }
      console.log(`[${this.componentName}] ▶️ 动画已恢复`);
    },

    /**
     * 根据 entity 当前位置反算在路径上的 fraction
     */
    _computePositionFraction(cartesian) {
      if (!this._cesiumAnimPath) return 0;
      const { wgsPath, segments, totalDist } = this._cesiumAnimPath;
      if (!wgsPath?.length) return 0;

      const Cesium = this.getCesium();
      if (!Cesium) return 0;

      // 找最近路段并计算 fraction
      let bestSegIdx = 0;
      let bestSegT = 0;
      let bestDist = Infinity;
      for (let i = 0; i < wgsPath.length - 1; i++) {
        const segDist = Cesium.Cartesian3.distance(wgsPath[i], wgsPath[i + 1]);
        if (segDist < 0.001) continue;
        // 投影到线段
        const toPoint = Cesium.Cartesian3.subtract(cartesian, wgsPath[i], new Cesium.Cartesian3());
        const segVec = Cesium.Cartesian3.subtract(wgsPath[i + 1], wgsPath[i], new Cesium.Cartesian3());
        let t = Cesium.Cartesian3.dot(toPoint, segVec) / (segDist * segDist);
        t = Math.max(0, Math.min(1, t));
        const proj = Cesium.Cartesian3.lerp(wgsPath[i], wgsPath[i + 1], t, new Cesium.Cartesian3());
        const d = Cesium.Cartesian3.distance(cartesian, proj);
        if (d < bestDist) { bestDist = d; bestSegIdx = i; bestSegT = t; }
      }

      const seg = segments[bestSegIdx];
      if (!seg || totalDist <= 0) return 0;
      return (seg.accumBefore + bestSegT * seg.distance) / totalDist;
    },

    /**
     * 从指定 fraction 恢复 Cesium 动画
     */
    _resumeCesiumFromFraction(startFraction) {
      const Cesium = this.getCesium();
      if (!Cesium || !this._cesiumAnimPath) return;

      const { wgsPath, segments, totalDist, duration } = this._cesiumAnimPath;
      const remainingFraction = 1 - startFraction;
      const remainingDuration = duration * remainingFraction;
      const startTime = performance.now();

      const animStep = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(elapsed / remainingDuration, 1.0);
        const fraction = startFraction + progress * remainingFraction;
        if (fraction >= 1.0) {
          this._stopCesiumCarAnimation();
          return;
        }

        const targetDist = fraction * totalDist;
        let segIdx = 0;
        for (let i = segments.length - 1; i >= 0; i--) {
          if (segments[i].accumBefore <= targetDist) { segIdx = i; break; }
        }
        const seg = segments[segIdx];
        const segFraction = seg.distance > 0 ? (targetDist - seg.accumBefore) / seg.distance : 0;
        const t = Math.max(0, Math.min(1, segFraction));
        const pos = Cesium.Cartesian3.lerp(wgsPath[seg.startIdx], wgsPath[seg.startIdx + 1], t, new Cesium.Cartesian3());
        if (this._cesiumCarEntity) this._cesiumCarEntity.position = pos;

        this._cesiumAnimFrame = requestAnimationFrame(animStep);
      };
      this._cesiumAnimFrame = requestAnimationFrame(animStep);
    },

    _startAnimation(guide) {
      if (typeof BMapLib === 'undefined' || typeof BMapLib.LuShu === 'undefined') {
        console.warn(`[${this.componentName}] ⚠️ LuShu 库未加载，无法播放动画`);
        return;
      }

      // 先彻底停止并清理旧实例（包括旧小车图标）
      this._safeStopLuShu();
      this._clearAllLuShuMarkers();

      const planIdx = guide._currentPlan || 0;
      const plan = this._routePlans?.[planIdx];
      if (!plan || !plan.routes?.length) {
        console.warn(`[${this.componentName}] ⚠️ 无路线数据，无法启动动画`);
        return;
      }

      // 构建路径（参考 lushu.html:50-58）
      const arrPois = [];
      plan.routes.forEach(route => {
        if (route.path && route.path.length) {
          route.path.forEach(p => arrPois.push(new BMap.Point(p.lng, p.lat)));
        }
      });

      if (arrPois.length < 2) {
        console.warn(`[${this.componentName}] ⚠️ 路径点数不足 (${arrPois.length})，无法启动动画`);
        return;
      }

      // 统一时长(ms)：Baidi LuShu 和 Cesium 使用相同的动画总时长
      const totalDurationMs = parseInt(guide.animationSpeed) || 2000;
      try {
        const iconSrc = this._resolveIconUrl(guide.iconUrl);
        const icon = new BMap.Icon(iconSrc, new BMap.Size(52, 26), { anchor: new BMap.Size(27, 13) });

        console.log(`[${this.componentName}] 🚗 创建动画，路径点: ${arrPois.length}, 总时长: ${totalDurationMs}ms`);

        this._lushuInstance = new BMapLib.LuShu(this._baiduMap, arrPois, {
          defaultContent: '',
          autoView: true,
          icon: icon,
          speed: totalDurationMs,
          enableRotation: true
        });

        this._lushuInstance.start();
        guide._animating = true;
        guide._animPaused = false;
        this._cesiumPausedFraction = 0;

        // Cesium 使用相同的 totalDurationMs，保证两者同时到达终点
        this._startCesiumCarAnimation(arrPois, guide, totalDurationMs);

        console.log(`[${this.componentName}] ▶️ 路书动画已启动（百度 + Cesium）`);
      } catch (e) {
        console.error(`[${this.componentName}] ❌ 路书动画启动失败:`, e);
        this._lushuInstance = null;
        guide._animating = false;
      }
    },

    /**
     * 清除百度地图上所有 LuShu 遗留的小车标记
     */
    _clearAllLuShuMarkers() {
      if (!this._baiduMap) return;
      const overlays = this._baiduMap.getOverlays();
      for (let i = overlays.length - 1; i >= 0; i--) {
        const o = overlays[i];
        // LuShu 小车标记的特征：是 Marker 且有自定义图标
        if (o instanceof BMap.Marker && o.getIcon && o._lushuMarker !== false) {
          // 检查图标的 imageUrl 是否包含 car.png 或 data:image（emoji 小车）
          try {
            const ico = o.getIcon();
            if (ico && ico.imageUrl) {
              const url = ico.imageUrl;
              if (url.includes('car.png') || url.startsWith('data:image')) {
                this._baiduMap.removeOverlay(o);
              }
            }
          } catch (e) { /* skip */ }
        }
      }
    },

    _stopAnimation(guide) {
      this._safeStopLuShu();
      if (guide) guide._animating = false;
      console.log(`[${this.componentName}] ⏸️ 路书动画已停止`);
    },

    /**
     * 安全停止 LuShu 实例（防御内部状态异常）
     */
    _safeStopLuShu() {
      if (this._lushuInstance) {
        try {
          // 先设 null 再 stop，防止 stop 内部回调用到已销毁的引用
          const inst = this._lushuInstance;
          this._lushuInstance = null;
          if (typeof inst.stop === 'function') {
            inst.stop();
          }
          // 清理 LuShu 内部残留的 setInterval（防御 stop 失败的情况）
          if (inst._intervalId) {
            clearInterval(inst._intervalId);
          }
        } catch (e) {
          console.warn(`[${this.componentName}] ⚠️ LuShu stop() 异常:`, e.message);
        }
      }
      // 同步停止 Cesium 动画
      this._stopCesiumCarAnimation();
    },

    /**
     * 解析图标：emoji/文本 → canvas → data URL；纯 URL → 原样返回
     * 参考 GeoJsonLayerManager 的 "markerIcon": "📍" 模式
     */
    _resolveIconUrl(raw) {
      if (!raw) raw = '🚗';
      // 已经是 URL → 直接返回
      if (/^https?:\/\//i.test(raw)) return raw;
      // emoji/文本 → canvas 转 data URL
      const size = 52;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.font = `${size * 0.7}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(raw, size / 2, size / 2);
      return canvas.toDataURL('image/png');
    },

    // ===================== Cesium 同步动画 =====================

    _startCesiumCarAnimation(arrPois, guide, totalDurationMs) {
      const Cesium = this.getCesium();
      const viewer = this.getCesiumViewer();
      if (!Cesium || !viewer) return;

      this._stopCesiumCarAnimation();

      // BD-09 → WGS84 转换所有路径点
      const wgsPath = arrPois.map(p => {
        const wgs = this._bd09ToWgs84(p.lng, p.lat);
        return Cesium.Cartesian3.fromDegrees(wgs[0], wgs[1], 30);
      });

      if (wgsPath.length < 2) return;

      // 计算每段的距离和累计距离
      const segments = [];
      let totalDistMeters = 0;
      for (let i = 0; i < wgsPath.length - 1; i++) {
        const d = Cesium.Cartesian3.distance(wgsPath[i], wgsPath[i + 1]);
        segments.push({ startIdx: i, distance: d, accumBefore: totalDistMeters });
        totalDistMeters += d;
      }
      if (totalDistMeters <= 0) return;

      // LuShu 的 speed 并非毫秒，而是内部速度单位。Cesium 使用路线距离
      // 除以基准速度（30km/h）计算基础时长，再按 animationSpeed 反向缩放：
      //   1000(快速) → 基础时长 × 0.5, 2000(正常) → ×1.0, 4000(慢速) → ×2.0
      const baseMs = parseInt(guide.animationSpeed) || 2000;
      const speedFactor = 2000 / baseMs; // 1000→2x快, 2000→1x, 4000→0.5x慢
      const BASE_SPEED_KMH = 3000; // 对齐百度LuShu动画速度
      const baseDuration = (totalDistMeters / 1000) / BASE_SPEED_KMH * 3600; // 基础秒数
      const duration = baseDuration / speedFactor; // factor>1 则更快(秒数更少)
      console.log(`[${this.componentName}] 🌍 Cesium: ${(totalDistMeters/1000).toFixed(1)}km, 基础${BASE_SPEED_KMH}km/h→${baseDuration.toFixed(0)}s, factor:${speedFactor.toFixed(2)}→实际${duration.toFixed(1)}s`);

      const iconSrc = this._resolveIconUrl(guide.iconUrl);

      // 创建小车 billboard entity
      const entity = viewer.entities.add({
        id: 'mapGuide-car-animation',
        position: wgsPath[0].clone(),
        billboard: {
          image: iconSrc,
          width: 52,
          height: 26,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.8,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      this._cesiumCarEntity = entity;

      // 动画循环
      const startTime = performance.now();
      const animStep = () => {
        const elapsed = (performance.now() - startTime) / 1000; // 秒
        const fraction = Math.min(elapsed / duration, 1.0);
        const targetDist = fraction * totalDistMeters;

        // 二分查找当前所在的段
        let segIdx = 0;
        for (let i = segments.length - 1; i >= 0; i--) {
          if (segments[i].accumBefore <= targetDist) {
            segIdx = i;
            break;
          }
        }

        const seg = segments[segIdx];
        const segFraction = seg.distance > 0 ? (targetDist - seg.accumBefore) / seg.distance : 0;
        const clampedSegFraction = Math.max(0, Math.min(1, segFraction));

        // 线性插值位置
        const pos = Cesium.Cartesian3.lerp(
          wgsPath[seg.startIdx],
          wgsPath[seg.startIdx + 1],
          clampedSegFraction,
          new Cesium.Cartesian3()
        );
        entity.position = pos;

        if (fraction < 1.0) {
          this._cesiumAnimFrame = requestAnimationFrame(animStep);
        } else {
          // 动画结束，移除小车
          this._stopCesiumCarAnimation();
        }
      };

      this._cesiumAnimPath = { wgsPath, segments, totalDist: totalDistMeters, duration };
      this._cesiumAnimFrame = requestAnimationFrame(animStep);
    },

    _stopCesiumCarAnimation() {
      if (this._cesiumAnimFrame) {
        cancelAnimationFrame(this._cesiumAnimFrame);
        this._cesiumAnimFrame = null;
      }
      if (this._cesiumCarEntity) {
        const viewer = this.getCesiumViewer();
        if (viewer) viewer.entities.remove(this._cesiumCarEntity);
        this._cesiumCarEntity = null;
      }
      this._cesiumAnimPath = null;
    },

    // ===================== Cesium 绘制 =====================

    drawOnCesium(guide) {
      const Cesium = this.getCesium();
      const viewer = this.getCesiumViewer();
      if (!Cesium || !viewer) {
        console.error(`[${this.componentName}] ❌ Cesium 未就绪`);
        return;
      }

      const planIdx = guide._currentPlan || 0;
      const plan = this._routePlans?.[planIdx];
      if (!plan || !plan.routes?.length) return;

      this._clearCesiumRoutes();

      plan.routes.forEach((route, idx) => {
        const positions = route.path.map(p => {
          // 百度坐标转WGS84
          const wgs = this._bd09ToWgs84(p.lng, p.lat);
          return Cesium.Cartesian3.fromDegrees(wgs[0], wgs[1], 20);
        });

        const entity = viewer.entities.add({
          id: `mapGuide-${guide.id || 'route'}-${idx}`,
          polyline: {
            positions: positions,
            width: 6,
            material: Cesium.Color.fromCssColorString(ROUTE_COLORS[idx % ROUTE_COLORS.length]).withAlpha(0.7),
            clampToGround: true
          }
        });
        this._cesiumRouteEntities.push(entity);
      });

      // 飞到路线起点
      const startWgs = this._bd09ToWgs84(
        parseFloat(guide.startLng),
        parseFloat(guide.startLat)
      );
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(startWgs[0], startWgs[1], 8000),
        duration: 1.5
      });

      console.log(`[${this.componentName}] 🌍 路线已绘制到Cesium: ${plan.routes.length} 条`);
    },

    _clearCesiumRoutes() {
      const viewer = this.getCesiumViewer();
      if (!viewer) return;
      this._cesiumRouteEntities.forEach(e => viewer.entities.remove(e));
      this._cesiumRouteEntities = [];
    },

    /**
     * 百度坐标(BD-09)转WGS84
     */
    _bd09ToWgs84(lng, lat) {
      const X_PI = Math.PI * 3000.0 / 180.0;
      // BD-09 → GCJ-02
      const x = lng - 0.0065;
      const y = lat - 0.006;
      const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
      const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
      const gcjLng = z * Math.cos(theta);
      const gcjLat = z * Math.sin(theta);

      // GCJ-02 → WGS84
      const a = 6378245.0;
      const ee = 0.00669342162296594323;
      const dLat = this._transformLat(gcjLng - 105.0, gcjLat - 35.0);
      const dLng = this._transformLng(gcjLng - 105.0, gcjLat - 35.0);
      const radLat = gcjLat / 180.0 * Math.PI;
      let magic = Math.sin(radLat);
      magic = 1 - ee * magic * magic;
      const sqrtMagic = Math.sqrt(magic);
      const dLatFinal = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
      const dLngFinal = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

      return [gcjLng * 2 - (gcjLng + dLngFinal), gcjLat * 2 - (gcjLat + dLatFinal)];
    },

    _transformLat(lng, lat) {
      let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
      return ret;
    },

    _transformLng(lng, lat) {
      let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
      return ret;
    },

    // ===================== 辅助操作 =====================

    locateRoute(guide) {
      const Cesium = this.getCesium();
      const viewer  = this.getCesiumViewer();
      if (Cesium && viewer) {
        const wgs = this._bd09ToWgs84(
          parseFloat(guide.startLng || 114),
          parseFloat(guide.startLat || 22.6)
        );
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(wgs[0], wgs[1], 5000),
          duration: 1.0
        });
        return;
      }

      // 回退到百度地图定位
      if (this._baiduMap) {
        this._baiduMap.centerAndZoom(
          new BMap.Point(parseFloat(guide.startLng), parseFloat(guide.startLat)), 16
        );
      }
    },

    hideRoute(guide) {
      this._safeStopLuShu();
      if (guide) guide._animating = false;
      this._resetGuide(guide);
      this._clearCesiumRoutes();
      if (this._baiduMap) {
        this._baiduMap.clearOverlays();
      }
      this.activeGuide = null;
      this._routePlans = null;
      console.log(`[${this.componentName}] 🗑️ 路线已清除`);
    },

    _resetGuide(guide) {
      if (!guide) return;
      guide._activeRoute = false;
      guide._animating = false;
      guide._animPaused = false;
      guide._currentPlan = 0;
      guide._totalPlans = 0;
      guide._routeDistance = 0;
      guide._routeDuration = 0;
    },

    // ===================== 行选择管理 =====================

    _toggleCheck(item, event) {
      const checked = event?.target?.checked ?? !this._isChecked(item);
      const key = item.id || item._uid;
      if (checked) {
        this._checkedItems = { ...this._checkedItems, [key]: true };
      } else {
        const copy = { ...this._checkedItems };
        delete copy[key];
        this._checkedItems = copy;
      }
    },

    _isChecked(item) {
      const key = item.id || item._uid;
      return !!this._checkedItems[key];
    },

    _getCheckedItems() {
      return this.configList.filter(item => this._isChecked(item));
    },

    // ===================== 右键 → 更新选中行 =====================

    _promptUpdateSelected() {
      const checked = this._getCheckedItems();
      if (checked.length !== 1) {
        alert(checked.length === 0
          ? '请先在列表中勾选一行路线，再进行路径分析更新。'
          : '请只勾选一行路线进行更新，当前勾选了多行。');
        return false;
      }
      if (!this._checkStartEndReady()) return false;

      const item = checked[0];
      this._pendingUpdateItem = item;
      this._pendingNewValues = {
        startLng: this.activeGuide?.startLng,
        startLat: this.activeGuide?.startLat,
        endLng:   this.activeGuide?.endLng,
        endLat:   this.activeGuide?.endLat,
        startAddr: this.activeGuide?.startAddr || '',
        endAddr:   this.activeGuide?.endAddr || ''
      };
      this._showUpdateDialog = true;
      return true;
    },

    _checkStartEndReady() {
      const g = this.activeGuide;
      if (!g) return false;
      const hasStart = g.startLng != null && g.startLat != null && !isNaN(parseFloat(g.startLng));
      const hasEnd   = g.endLng != null && g.endLat != null && !isNaN(parseFloat(g.endLng));
      if (!hasStart || !hasEnd) {
        alert('请先在百度地图上右键"设为起点"和"设为终点"，再进行路径分析更新。');
        return false;
      }
      return true;
    },

    /**
     * 尝试用地图上设置的起终点更新勾选行
     * @returns {boolean} 是否成功弹出更新确认框
     */
    _tryUpdateCheckedRow() {
      const checked = this._getCheckedItems();
      // 没有勾选行 → 不走更新流程
      if (checked.length === 0) return false;
      // 起终点没设全 → 不走更新流程
      const g = this.activeGuide;
      if (!g) return false;
      const hasStart = g.startLng != null && g.startLat != null && !isNaN(parseFloat(g.startLng));
      const hasEnd   = g.endLng != null && g.endLat != null && !isNaN(parseFloat(g.endLng));
      if (!hasStart || !hasEnd) return false;

      // 起终点已设、行已勾选 → 弹出确认对话框
      return this._promptUpdateSelected();
    },

    _confirmUpdate() {
      const item = this._pendingUpdateItem;
      const vals = this._pendingNewValues;
      if (!item || !vals) return;

      item.startLng = vals.startLng;
      item.startLat = vals.startLat;
      item.endLng   = vals.endLng;
      item.endLat   = vals.endLat;
      if (vals.startAddr) item.startAddr = vals.startAddr;
      if (vals.endAddr)   item.endAddr   = vals.endAddr;

      console.log(`[${this.componentName}] ✅ 已更新路线 "${item.name}" 的起终点数据`);
      this._showUpdateDialog = false;
      this._pendingUpdateItem = null;
      this._pendingNewValues = null;

      // 通知用户保存（数据已更新，需手动或自动持久化）
      this.$nextTick(() => {
        // 尝试触发 basePanel 的数据变更通知
        if (this.$refs.basePanel?.notifyDataChanged) {
          this.$refs.basePanel.notifyDataChanged();
        }
      });
    },

    _cancelUpdate() {
      this._showUpdateDialog = false;
      this._pendingUpdateItem = null;
      this._pendingNewValues = null;
    },

    // ===================== 格式化工具 =====================

    formatCoord(val) {
      const num = parseFloat(val);
      return isNaN(num) ? '--' : num.toFixed(4);
    },

    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return h > 0 ? `${h}时${m}分` : `${m}分钟`;
    },

    // ===================== 外部地图访问 =====================

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

.guide-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-name {
  font-weight: bold;
  color: #fff;
  font-size: 14px;
}

.guide-coords {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #aaa;
}

.coord-tag.start { color: #e74c3c; }
.coord-tag.end   { color: #3498db; }
.coord-arrow      { color: #888; }

.route-badge {
  font-size: 12px;
  color: #2ecc71;
  margin-top: 2px;
}

/* 操作按钮 */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 3px;
  font-size: 15px;
  transition: background 0.2s;
}

.show-btn   { background: #3498db; color: white; }
.show-btn:hover   { background: #2980b9; }
.play-btn   { background: #2ecc71; color: white; }
.play-btn:hover   { background: #27ae60; }
.locate-btn { background: #f39c12; color: white; }
.locate-btn:hover { background: #e67e22; }
.cesium-btn { background: #9b59b6; color: white; }
.cesium-btn:hover { background: #8e44ad; }
.hide-btn   { background: #e74c3c; color: white; }
.hide-btn:hover   { background: #c0392b; }

/* 百度地图区域 */
.baidu-map-section {
  margin-top: 12px;
  border-top: 2px solid rgba(6, 211, 255, 0.3);
  padding-top: 8px;
}

.map-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  flex-wrap: wrap;
  gap: 6px;
}

.map-title {
  font-weight: bold;
  color: #04e8fd;
  font-size: 14px;
}

.map-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #ccc;
}

.route-plan-label {
  font-size: 12px;
  color: #04e8fd;
  min-width: 70px;
  text-align: center;
}

.map-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.map-btn:hover        { background: rgba(255, 255, 255, 0.25); }
.map-btn.play-btn     { background: rgba(46, 204, 113, 0.3); border-color: #2ecc71; }
.map-btn.play-btn:hover { background: rgba(46, 204, 113, 0.5); }
.map-btn.close-btn    { background: rgba(231, 76, 60, 0.3); border-color: #e74c3c; }
.map-btn.close-btn:hover { background: rgba(231, 76, 60, 0.5); }

.baidu-map-container {
  width: 100%;
  height: 360px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* ===================== Checkbox 行选择 ===================== */
.guide-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  width: 100%;
}

.checkbox-input {
  display: none;
}

.check-indicator {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  margin-top: 3px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-input:checked + .check-indicator {
  background: #3498db;
  border-color: #3498db;
}

.checkbox-input:checked + .check-indicator::after {
  content: '✓';
  position: absolute;
  top: -1px;
  left: 2px;
  color: #fff;
  font-size: 13px;
  font-weight: bold;
}

.checked-badge {
  font-size: 11px;
  color: #3498db;
  margin-top: 2px;
}

/* ===================== 更新确认对话框 ===================== */
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.update-dialog {
  background: #1a2a3a;
  border: 1px solid rgba(6, 211, 255, 0.3);
  border-radius: 10px;
  width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: bold;
  color: #04e8fd;
}

.dialog-close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.dialog-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.dialog-body {
  padding: 20px;
}

.dialog-hint {
  font-size: 13px;
  color: #ccc;
  margin-bottom: 16px;
  line-height: 1.5;
}

.update-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.update-table th {
  text-align: left;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #aaa;
  font-weight: normal;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.update-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.update-table .new-value {
  color: #2ecc71;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn { background: #3498db; color: white; }
.confirm-btn:hover { background: #2980b9; }

.cancel-btn { background: rgba(255, 255, 255, 0.1); color: #ccc; }
.cancel-btn:hover { background: rgba(255, 255, 255, 0.2); }
</style>