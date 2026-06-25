<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="480"
    :panel-max-height="'75vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="layerTreeManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'LayerTreeManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'LayerTreeManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    @config-loaded="onConfigLoadedHandler"
  >
    <!-- ===== 树形图层展示区域（before-list 插槽） ===== -->
    <template #before-list>
      <div class="tree-manager-container">
        <!-- 工具栏：添加根节点 -->
        <div class="tree-toolbar">
          <button class="tree-btn tree-btn-primary" @click="addRootNode" type="button">
            <span class="tree-btn-icon">+</span>
            <span>添加根节点</span>
          </button>
          <button class="tree-btn tree-btn-outline" @click="expandAll" type="button">
            <span class="tree-btn-icon">▼</span>
            <span>全部展开</span>
          </button>
          <button class="tree-btn tree-btn-outline" @click="collapseAll" type="button">
            <span class="tree-btn-icon">▶</span>
            <span>全部折叠</span>
          </button>
        </div>

        <!-- 树形渲染区域 -->
        <div class="tree-wrapper" v-if="treeData.length > 0">
          <ul class="tree-root">
            <TreeNodeItem
              v-for="node in treeData"
              :key="node.id"
              :node="node"
              :depth="0"
              :all-flat-nodes="configList"
              :expanded-ids="expandedIds"
              :selected-id="selectedNodeId"
              :loaded-layer-ids="loadedLayerIds"
              @toggle-expand="toggleExpand"
              @select-node="selectNode"
              @add-child="openAddChildDialog"
              @edit-node="openEditNodeDialog"
              @delete-node="confirmDeleteNode"
              @toggle-layer="toggleLayerLoad"
            />
          </ul>
        </div>

        <!-- 空状态 -->
        <div v-else class="tree-empty">
          <div class="tree-empty-icon">🌳</div>
          <div class="tree-empty-text">暂无图层树节点</div>
          <div class="tree-empty-hint">点击上方 "添加根节点" 按钮开始构建图层树</div>
        </div>
      </div>
    </template>

    <!-- ===== 列表项插槽（隐藏默认列表） ===== -->
    <template #list-item>
      <span style="display:none"></span>
    </template>

    <!-- ===== 自定义删除确认对话框 ===== -->
    <template #delete-warning-extra="{ item }">
      <div class="tree-delete-warning">
        <div class="tree-delete-warning-icon">⚠️</div>
        <div class="tree-delete-warning-text">
          将<strong>级联删除</strong>该节点及其所有子节点
        </div>
        <div v-if="getDescendantCount(item.id) > 0" class="tree-delete-count">
          共 <strong>{{ getDescendantCount(item.id) }}</strong> 个子节点将被一并删除
        </div>
      </div>
    </template>

    <!-- ===== 自定义对话框扩展 ===== -->
    <template #dialogs>
      <!-- 添加子节点对话框（为树节点添加子级） -->
      <Teleport to="body">
        <Transition name="tree-dialog-fade">
          <div v-if="showAddChildDialog" class="tree-dialog-overlay" @click.self="closeAddChildDialog">
            <div class="tree-dialog-panel">
              <div class="tree-dialog-header">
                <h3 class="tree-dialog-title">
                  📂 添加子节点 — 父节点: {{ parentNodeForAdd?.name || '未知' }}
                </h3>
                <button class="tree-dialog-close" @click="closeAddChildDialog" type="button">✕</button>
              </div>
              <div class="tree-dialog-body">
                <div class="tree-form-group">
                  <label class="tree-form-label">节点ID <span class="required">*</span></label>
                  <input v-model="addChildForm.id" class="tree-form-input" placeholder="唯一标识符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点名称 <span class="required">*</span></label>
                  <input v-model="addChildForm.name" class="tree-form-input" placeholder="图层或目录名称" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点类型</label>
                  <select v-model="addChildForm.nodeType" class="tree-form-select">
                    <option value="folder">📁 目录节点</option>
                    <option value="layer">📄 图层节点</option>
                  </select>
                </div>
                <div class="tree-form-group" v-if="addChildForm.nodeType === 'layer'">
                  <label class="tree-form-label">资源URL</label>
                  <input v-model="addChildForm.url" class="tree-form-input" placeholder="图层资源的URL地址" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">图标</label>
                  <input v-model="addChildForm.icon" class="tree-form-input" placeholder="emoji或字符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">排序序号</label>
                  <input v-model.number="addChildForm.sortOrder" class="tree-form-input" type="number" placeholder="0" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">描述信息</label>
                  <input v-model="addChildForm.description" class="tree-form-input" placeholder="节点描述" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-checkbox">
                    <input type="checkbox" v-model="addChildForm.visible" />
                    <span>可见</span>
                  </label>
                </div>
              </div>
              <div class="tree-dialog-footer">
                <button class="tree-btn tree-btn-outline" @click="closeAddChildDialog" type="button">取消</button>
                <button class="tree-btn tree-btn-primary" @click="confirmAddChild" type="button">确认添加</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 编辑节点对话框 -->
      <Teleport to="body">
        <Transition name="tree-dialog-fade">
          <div v-if="showEditDialog" class="tree-dialog-overlay" @click.self="closeEditDialog">
            <div class="tree-dialog-panel">
              <div class="tree-dialog-header">
                <h3 class="tree-dialog-title">✏️ 编辑节点</h3>
                <button class="tree-dialog-close" @click="closeEditDialog" type="button">✕</button>
              </div>
              <div class="tree-dialog-body">
                <div class="tree-form-group">
                  <label class="tree-form-label">节点ID <span class="readonly-hint">(只读)</span></label>
                  <input :value="editForm.id" class="tree-form-input" disabled />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点名称 <span class="required">*</span></label>
                  <input v-model="editForm.name" class="tree-form-input" placeholder="图层或目录名称" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点类型</label>
                  <select v-model="editForm.nodeType" class="tree-form-select">
                    <option value="folder">📁 目录节点</option>
                    <option value="layer">📄 图层节点</option>
                  </select>
                </div>
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <label class="tree-form-label">资源URL</label>
                  <input v-model="editForm.url" class="tree-form-input" placeholder="图层资源的URL地址" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">图标</label>
                  <input v-model="editForm.icon" class="tree-form-input" placeholder="emoji或字符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">排序序号</label>
                  <input v-model.number="editForm.sortOrder" class="tree-form-input" type="number" placeholder="0" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">描述信息</label>
                  <input v-model="editForm.description" class="tree-form-input" placeholder="节点描述" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-checkbox">
                    <input type="checkbox" v-model="editForm.visible" />
                    <span>可见</span>
                  </label>
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">父节点ID</label>
                  <select v-model="editForm.parentId" class="tree-form-select">
                    <option :value="null">无（根节点）</option>
                    <option v-for="n in getAvailableParents(editForm.id)" :key="n.id" :value="n.id">
                      {{ '　'.repeat(n._depth || 0) }}{{ n.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="tree-dialog-footer">
                <button class="tree-btn tree-btn-outline" @click="closeEditDialog" type="button">取消</button>
                <button class="tree-btn tree-btn-primary" @click="confirmEdit" type="button">保存修改</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import { validateConfigMetadata, formatValidationResult } from './TableNameValidator.mjs';
import TreeNodeItem from './TreeNodeItem.vue';
import rawPanelMetadata from './LayerTreeManager.config.json';
import { MVTImageryProvider } from '@componentsLib/MVTImageryProvider/MVTImageryProvider.mjs';

const validationResult = validateConfigMetadata(rawPanelMetadata);
console.log(`[LayerTreeManager] 📋 配置元数据验证结果:`);
console.log(formatValidationResult(validationResult));

const panelMetadata = validationResult.safeConfig || rawPanelMetadata;

// ========================
// LayerTreeManager — 主面板组件
// ========================
export default {
  name: 'LayerTreeManager',

  components: {
    JsonConfigPanelBase,
    TreeNodeItem
  },

  props: {
    initialX: {
      type: [Number, String],
      default: 'left'
    },
    initialY: {
      type: Number,
      default: 120
    },
    panelName: {
      type: String,
      default: null
    },
    autoRegister: {
      type: Boolean,
      default: true
    },
    panelInstanceId: {
      type: Number,
      default: null
    },
    registrationKey: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      panelMetadata,

      // ⭐ 本地响应式数据 — 树形节点的扁平数组（内置示例数据确保始终有内容）
      flatNodeList: [
        { "id": "root-ogc",      "name": "OGC标准服务",       "parentId": null,     "nodeType": "folder", "sortOrder": 1, "visible": 1, "description": "OGC标准协议图层（WMS/WFS/WMTS）", "icon": "📁" },
        { "id": "folder-wms",    "name": "WMS 地图服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 1, "visible": 1, "description": "Web Map Service", "icon": "🗺️" },
        { "id": "wms-nasa",      "name": "NASA GIBS 全球影像(WMS)", "parentId": "folder-wms","nodeType": "layer","url":"https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi","sortOrder":1,"visible":1,"description":"NASA官方WMS服务，无需API Key","icon":"🛰️","centerLon":0,"centerLat":20,"centerHeight":15000000},
        { "id": "wms-usgs",      "name": "USGS 国家地形图(WMS)", "parentId": "folder-wms","nodeType": "layer","url":"https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer","sortOrder":2,"visible":1,"description":"USGS官方WMS","icon":"🗺️","centerLon":-98.5,"centerLat":39.8,"centerHeight":5000000},
        { "id": "folder-wfs",    "name": "WFS 要素服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 2, "visible": 1, "description": "Web Feature Service", "icon": "📊" },
        { "id": "wfs-usgs",      "name": "USGS 建筑物要素(WFS)", "parentId": "folder-wfs","nodeType": "layer","url":"https://carto.nationalmap.gov/arcgis/rest/services/structures/MapServer/WFSServer","sortOrder":1,"visible":1,"description":"USGS官方WFS","icon":"🏗️"},
        { "id": "root-xyz",      "name": "XYZ/TMS 瓦片底图",  "parentId": null,     "nodeType": "folder", "sortOrder": 2, "visible": 1, "description": "互联网标准瓦片底图服务", "icon": "📁" },
        { "id": "xyz-osm",       "name": "OpenStreetMap 标准底图","parentId":"root-xyz","nodeType":"layer","url":"https://tile.openstreetmap.org/{z}/{x}/{y}.png","sortOrder":1,"visible":1,"description":"OSM全球众源地图","icon":"🗺️","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "xyz-esri-img",  "name": "ESRI 全球卫星影像",   "parentId":"root-xyz","nodeType":"layer","url":"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}","sortOrder":2,"visible":1,"description":"ESRI卫星影像底图","icon":"🛰️","centerLon":116.4,"centerLat":39.9,"centerHeight":8000},
        { "id": "root-mvt",      "name": "矢量瓦片(MVT)",      "parentId": null,     "nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "Mapbox Vector Tile矢量瓦片", "icon": "📁" },
        { "id": "mvt-versatiles","name": "VersaTiles 全球矢量瓦片(Shortbread)","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}","sortOrder":1,"visible":1,"description":"免费全球OSM矢量瓦片，无需API Key","icon":"🌍","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "mvt-bkg",       "name": "BKG 德国官方矢量底图","parentId":"root-mvt","nodeType":"layer","url":"https://sgx.geodatenzentrum.de/wmts_basemapde_web_vektor/tile/v1/{z}/{x}/{y}.pbf","sortOrder":2,"visible":1,"description":"德国政府官方MVT，无需API Key，覆盖德国全境","icon":"🇩🇪","centerLon":10.45,"centerLat":51.16,"centerHeight":500000},
        { "id": "mvt-openmaptiles","name":"OpenMapTiles 全球矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://free-0.tilehosting.com/data/v3/{z}/{x}/{y}.pbf?key=your-free-api-key","sortOrder":3,"visible":1,"description":"OpenMapTiles schema，需免费注册获取Key","icon":"🧩"},
        { "id": "mvt-geofabrik","name":"Geofabrik Shortbread 矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.shortbread.geofabrik.de/tiles/shortbread_v1/{z}/{x}/{y}.mvt","sortOrder":4,"visible":1,"description":"德国Geofabrik免费MVT","icon":"🧩","centerLon":8.68,"centerLat":50.11,"centerHeight":500000},
        { "id": "mvt-maptiler-cn","name":"MapTiler 矢量瓦片(全球CDN)","parentId":"root-mvt","nodeType":"layer","url":"https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get-free-key","sortOrder":5,"visible":1,"description":"MapTiler全球CDN矢量瓦片，OpenMapTiles schema，需免费注册Key替换URL，国内可访问","icon":"🎯"},
        { "id": "mvt-planet",    "name":"OpenFreeMap 全球矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf","sortOrder":6,"visible":1,"description":"OpenFreeMap免费全球MVT，无需API Key","icon":"🌏"},
        { "id": "xyz-versatiles-raster","name":"VersaTiles 浅色栅格底图(XYZ)","parentId":"root-xyz","nodeType":"layer","url":"https://tiles.versatiles.org/tiles/versatiles-light/{z}/{x}/{y}.png","sortOrder":9,"visible":1,"description":"VersaTiles免费浅色栅格瓦片，XYZ格式，全球覆盖，直接可用","icon":"🎨","centerLon":116.4,"centerLat":39.9,"centerHeight":50000}
      ],

      // Cesium 图层加载状态 — 记录已加载的图层 ID → Cesium 对象
      loadedLayerIds: {},

      // 树交互状态
      expandedIds: new Set(),
      selectedNodeId: null,

      // 添加子节点对话框
      showAddChildDialog: false,
      parentNodeForAdd: null,
      addChildForm: this.createDefaultForm(),

      // 编辑节点对话框
      showEditDialog: false,
      editingNode: null,
      editForm: this.createDefaultForm(),

      // 配置加载策略
      _configStrategy: null,

      componentName: 'LayerTreeManager'
    };
  },

  computed: {
    /**
     * 将本地 flatNodeList 转换为嵌套树形结构用于 TreeView 渲染
     */
    treeData() {
      return this.buildTree(this.flatNodeList);
    },

    /**
     * 兼容 basePanel 的 configList（工具栏导入导出/刷新等操作需要）
     */
    configList() {
      return this.flatNodeList;
    }
  },

  beforeCreate() {
    // 非响应式 Cesium 图层对象存储（避免 Vue 响应式序列化 Cesium 对象）
    this._cesiumLayers = new Map();
  },

  created() {
    configRegistry.registerFromMetadata(this.panelMetadata);

    const dataSourceType = this.panelMetadata.dataSource?.type || 'sqlite';
    this._configStrategy = ConfigStrategyFactory.createWithFallback(
      [dataSourceType, 'json'],
      { baseURL: 'http://localhost:8081' }
    );
    console.log(`[${this.componentName}] ✅ 树形配置加载策略已初始化: ${this._configStrategy.getName()}`);
    console.log(`[${this.componentName}] 🌳 表名: ${this.panelMetadata.dataSource?.tableName}`);
    console.log(`[${this.componentName}] 🔗 自关联字段: parentId → id`);
  },

  mounted() {
    // 延迟加载由 FunctionPanelUIBase 的 lazy-load 事件触发
    // 当面板首次打开时，基类 onLazyLoad 内部会调用 this.loadConfig()
    // 由于当前组件与 JsonConfigPanelBase 是组合关系（非继承），
    // 基类内部的 this.loadConfig() 调用的是基类自身版本，不会触发这里的覆盖。
    // 因此使用 $nextTick 确保 refs 就绪后主动加载数据。
    this.$nextTick(() => {
      // 如果基类已加载过数据则跳过（缓存的 configList 非空）
      if (!this.flatNodeList || this.flatNodeList.length === 0) {
        console.log(`[${this.componentName}] 🚀 主动触发树形数据加载`);
        this.loadConfig();
      } else {
        console.log(`[${this.componentName}] ✅ 已有 ${this.flatNodeList.length} 条数据，跳过重复加载`);
      }
    });
  },

  beforeDestroy() {
    this.destroyAllCesiumLayers();
  },

  methods: {
    // ==================== 配置加载（覆盖基类） ====================

    /**
     * 覆盖 JsonConfigPanelBase 的 loadConfig()，
     * 使用 ConfigLoadStrategy 从 SQLite/JSON 加载树形数据
     */
    async loadConfig() {
      try {
        console.log(`[${this.componentName}] 📂 开始加载树形配置: ${this.panelMetadata.panelId}`);
        console.log(`[${this.componentName}] 🎯 使用策略: ${this._configStrategy.getName()}`);

        const rawData = await this._configStrategy.load(this.panelMetadata);

        console.log(`[${this.componentName}] 📦 加载到原始数据: ${rawData ? rawData.length : 0} 条`);

        if (rawData && rawData.length > 0) {
          // ⭐ 写入本地响应式数据（驱动 treeData 更新）
          this.flatNodeList = rawData.map(item => ({
            ...item,
            visible: item.visible !== undefined ? item.visible : 1,
            sortOrder: item.sortOrder || 0
          }));

          // 同步到 basePanel.configList（工具栏导入导出等需要）
          if (this.$refs.basePanel) {
            this.$refs.basePanel.configList = [...this.flatNodeList];
          }
          console.log(`[${this.componentName}] ✅ 树形配置加载完成，共 ${this.flatNodeList.length} 条`);
        } else {
          console.warn(`[${this.componentName}] ⚠️ 未加载到数据，初始化空列表`);
          this.flatNodeList = [];
        }

        this.onConfigLoadedHandler();
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 配置加载失败:`, error);
        this.flatNodeList = [];
      }
    },

    /**
     * 覆盖保存配置方法，将树数据扁平化后保存
     */
    async saveConfig() {
      try {
        console.log(`[${this.componentName}] 📤 准备保存树形配置`);

        // 移除 children 字段（如果存在），确保保存的是扁平数据
        const saveData = this.flatNodeList.map(item => {
          const { children, loaded, loading, ...cleanItem } = item;
          return cleanItem;
        });

        const success = await this._configStrategy.save(this.panelMetadata, saveData);

        if (success) {
          console.log(`[${this.componentName}] ✅ 树形配置已保存`);
          return true;
        } else {
          console.error(`[${this.componentName}] ❌ 保存失败`);
          alert('保存失败！');
          return false;
        }
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 保存失败:`, error);
        alert(`保存失败！\n错误：${error.message}`);
        return false;
      }
    },

    // ==================== 树构建/展平 ====================

    /**
     * 扁平数组 → 嵌套树（用于渲染）
     */
    buildTree(flatList) {
      if (!flatList || flatList.length === 0) return [];

      const map = new Map();
      const roots = [];

      flatList.forEach(item => {
        map.set(item.id, { ...item, children: [] });
      });

      flatList.forEach(item => {
        const node = map.get(item.id);
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId).children.push(node);
        } else {
          roots.push(node);
        }
      });

      // 递归排序
      const sortChildren = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          node.children.forEach(sortChildren);
        }
      };
      roots.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      roots.forEach(sortChildren);

      return roots;
    },

    /**
     * 嵌套树 → 扁平数组（用于保存）
     */
    flattenTree(treeNodes) {
      const result = [];
      const walk = (nodes) => {
        nodes.forEach(node => {
          const { children, ...flatNode } = node;
          result.push(flatNode);
          if (children && children.length > 0) {
            walk(children);
          }
        });
      };
      walk(treeNodes);
      return result;
    },

    // ==================== 树交互 ====================

    toggleExpand(nodeId) {
      if (this.expandedIds.has(nodeId)) {
        this.expandedIds.delete(nodeId);
      } else {
        this.expandedIds.add(nodeId);
      }
      // 触发 Set 响应式更新
      this.expandedIds = new Set(this.expandedIds);
    },

    expandAll() {
      const allIds = new Set();
      const collectIds = (nodes) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id);
            collectIds(node.children);
          }
        });
      };
      collectIds(this.treeData);
      this.expandedIds = allIds;
    },

    collapseAll() {
      this.expandedIds = new Set();
    },

    selectNode(nodeId) {
      this.selectedNodeId = nodeId;
      // 选中已加载的图层时自动飞至图层位置
      const node = this.flatNodeList.find(n => n.id === nodeId);
      if (node && this._cesiumLayers.has(nodeId)) {
        this.flyToLayerNode(node);
      }
    },

    // ==================== CRUD 操作 ====================

    /**
     * 创建默认表单对象
     */
    createDefaultForm() {
      return {
        id: '',
        name: '',
        parentId: null,
        nodeType: 'layer',
        url: '',
        sortOrder: 0,
        visible: true,
        description: '',
        icon: '📄'
      };
    },

    /**
     * 生成唯一 ID
     */
    generateId() {
      return 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    },

    // --- 添加根节点 ---
    addRootNode() {
      this.addChildForm = this.createDefaultForm();
      this.addChildForm.id = this.generateId();
      this.parentNodeForAdd = null;
      this.showAddChildDialog = true;
    },

    // --- 添加子节点 ---
    openAddChildDialog(parentNode) {
      this.addChildForm = {
        ...this.createDefaultForm(),
        id: this.generateId(),
        parentId: parentNode.id
      };
      this.parentNodeForAdd = parentNode;
      this.showAddChildDialog = true;
    },

    closeAddChildDialog() {
      this.showAddChildDialog = false;
      this.parentNodeForAdd = null;
    },

    confirmAddChild() {
      if (!this.addChildForm.name.trim()) {
        alert('节点名称不能为空');
        return;
      }
      if (!this.addChildForm.id.trim()) {
        alert('节点ID不能为空');
        return;
      }

      // 检查 ID 重复
      if (this.flatNodeList.find(n => n.id === this.addChildForm.id)) {
        alert('节点ID已存在，请更换');
        return;
      }

      const newNode = {
        ...this.addChildForm,
        visible: this.addChildForm.visible ? 1 : 0
      };

      // ⭐ 写入本地响应式数据（触发 treeData 更新）
      this.flatNodeList.push(newNode);
      // 强制触发 Vue 响应式更新（数组 push 在 Vue 2 中需要显式替换）
      this.flatNodeList = [...this.flatNodeList];

      // 自动展开父节点
      if (this.addChildForm.parentId) {
        const expanded = new Set(this.expandedIds);
        expanded.add(this.addChildForm.parentId);
        this.expandedIds = expanded;
      }

      console.log(`[${this.componentName}] ✅ 已添加节点: ${newNode.name} (parentId: ${newNode.parentId || '根节点'})`);
      this.closeAddChildDialog();
    },

    // --- 编辑节点 ---
    openEditNodeDialog(node) {
      this.editingNode = node;
      this.editForm = {
        id: node.id,
        name: node.name || '',
        parentId: node.parentId || null,
        nodeType: node.nodeType || 'layer',
        url: node.url || '',
        sortOrder: node.sortOrder || 0,
        visible: node.visible !== undefined ? (node.visible === 1 || node.visible === true) : true,
        description: node.description || '',
        icon: node.icon || '📄'
      };
      this.showEditDialog = true;
    },

    closeEditDialog() {
      this.showEditDialog = false;
      this.editingNode = null;
    },

    confirmEdit() {
      if (!this.editForm.name.trim()) {
        alert('节点名称不能为空');
        return;
      }

      const index = this.flatNodeList.findIndex(n => n.id === this.editForm.id);
      if (index === -1) return;

      // 合并更新（保留原始节点中额外字段）
      this.flatNodeList[index] = {
        ...this.flatNodeList[index],
        name: this.editForm.name,
        parentId: this.editForm.parentId,
        nodeType: this.editForm.nodeType,
        url: this.editForm.url,
        sortOrder: this.editForm.sortOrder,
        visible: this.editForm.visible ? 1 : 0,
        description: this.editForm.description,
        icon: this.editForm.icon
      };
      // 强制触发响应式更新
      this.flatNodeList = [...this.flatNodeList];

      console.log(`[${this.componentName}] ✅ 已更新节点: ${updated.name}`);
      this.closeEditDialog();
    },

    // --- 删除节点（级联） ---
    confirmDeleteNode(node) {
      const descendantCount = this.getDescendantCount(node.id);
      let msg = `确定删除节点 "${node.name}" 吗？`;
      if (descendantCount > 0) {
        msg += `\n\n⚠️ 将级联删除其下 ${descendantCount} 个子节点！`;
      }
      if (!confirm(msg)) return;

      this.deleteNodeRecursive(node.id);
    },

    /**
     * 递归删除节点及其所有子孙节点
     */
    deleteNodeRecursive(nodeId) {
      // 找到所有子孙节点
      const descendantIds = this.collectDescendantIds(nodeId);
      const allIdsToRemove = new Set([nodeId, ...descendantIds]);

      this.flatNodeList = this.flatNodeList.filter(n => !allIdsToRemove.has(n.id));

      // 清除展开/选中状态
      const expanded = new Set(this.expandedIds);
      expanded.delete(nodeId);
      descendantIds.forEach(id => expanded.delete(id));
      this.expandedIds = expanded;

      if (this.selectedNodeId && allIdsToRemove.has(this.selectedNodeId)) {
        this.selectedNodeId = null;
      }

      console.log(`[${this.componentName}] 🗑️ 已删除节点及其 ${allIdsToRemove.size - 1} 个子节点`);
    },

    // ==================== 工具方法 ====================

    /**
     * 递归查找节点
     */
    findNodeById(nodeId, treeNodes) {
      for (const node of treeNodes) {
        if (node.id === nodeId) return node;
        if (node.children && node.children.length > 0) {
          const found = this.findNodeById(nodeId, node.children);
          if (found) return found;
        }
      }
      return null;
    },

    /**
     * 获取节点的子孙节点数量
     */
    getDescendantCount(nodeId) {
      return this.collectDescendantIds(nodeId).length;
    },

    /**
     * 收集所有子孙节点 ID
     */
    collectDescendantIds(nodeId) {
      const ids = [];
      const stack = [nodeId];

      while (stack.length > 0) {
        const currentId = stack.pop();
        this.flatNodeList.forEach(n => {
          if (n.parentId === currentId) {
            ids.push(n.id);
            stack.push(n.id);
          }
        });
      }

      return ids;
    },

    /**
     * 获取 edit 时可选的父节点（排除自身及子孙节点防止循环引用）
     */
    getAvailableParents(excludeId) {
      const excludeSet = new Set([excludeId, ...this.collectDescendantIds(excludeId)]);

      const available = this.flatNodeList
        .filter(n => !excludeSet.has(n.id))
        .map(n => ({ ...n, _depth: 0 }));

      // 计算缩进深度
      const idToNode = new Map(available.map(n => [n.id, n]));
      available.forEach(n => {
        let depth = 0;
        let pId = n.parentId;
        while (pId && idToNode.has(pId)) {
          depth++;
          pId = idToNode.get(pId)?.parentId;
        }
        n._depth = depth;
      });

      return available.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },

    // ==================== 基类钩子和数据管理 ====================

    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 树形配置加载完成`);
      const list = this.flatNodeList;
      console.log(`[${this.componentName}] 🌳 共加载 ${list.length} 个节点`);

      // 统计层级信息
      const rootCount = list.filter(n => !n.parentId).length;
      const folderCount = list.filter(n => n.nodeType === 'folder').length;
      const layerCount = list.filter(n => n.nodeType === 'layer').length;
      console.log(`[${this.componentName}]   ├─ 根节点: ${rootCount} 个`);
      console.log(`[${this.componentName}]   ├─ 目录节点: ${folderCount} 个`);
      console.log(`[${this.componentName}]   └─ 图层节点: ${layerCount} 个`);

      // 自动展开根节点
      const roots = list.filter(n => !n.parentId);
      if (roots.length > 0) {
        const expanded = new Set(this.expandedIds);
        roots.forEach(r => expanded.add(r.id));
        this.expandedIds = expanded;
      }
    },

    /**
     * 保存前将树数据展平
     */
    // ==================== Cesium 图层集成 ====================

    /**
     * 获取 Cesium Viewer 实例
     */
    getViewer() {
      return typeof window !== 'undefined' ? window.__cesiumViewer__ : null;
    },

    /**
     * 获取全局 Cesium 对象
     */
    getCesium() {
      return typeof window !== 'undefined' ? window.Cesium : null;
    },

    /**
     * 检测图层类型（基于 URL 模式 + 父节点层级）
     */
    detectLayerType(node) {
      const url = (node.url || '').toLowerCase();
      // 从父级/祖先判断类型
      const ancestors = this.getAncestorChain(node.id);
      const ancestorNames = ancestors.map(a => a.name.toLowerCase()).join(' ');

      // ⚠️ MVT 必须优先于 XYZ 检测：.pbf/.mvt 文件也包含 {z}/{x}/{y} 模式
      if (url.includes('.pbf') || url.includes('.mvt') || ancestorNames.includes('mvt')) return 'mvt';
      if (url.includes('wmts') || url.includes('wmtscapabilities') || ancestorNames.includes('wmts')) return 'wmts';
      if (url.includes('wms') && url.includes('service=wms')) return 'wms';
      if (url.includes('wfs') && url.includes('service=wfs')) return 'wfs';
      if (url.includes('tileset.json') || ancestorNames.includes('3d tiles')) return '3dtiles';
      if (url.includes('{z}/{x}/{y}') || url.includes('{z}/{y}/{x}')) return 'xyz';
      if (url.includes('geojson') || url.endsWith('.json')) return 'geojson';
      // 默认根据祖先判断
      if (ancestorNames.includes('xyz') || ancestorNames.includes('tms')) return 'xyz';
      if (ancestorNames.includes('wms')) return 'wms';
      return 'xyz'; // 默认按 XYZ 瓦片处理
    },

    /**
     * 获取节点的祖先链
     */
    getAncestorChain(nodeId) {
      const chain = [];
      let currentId = nodeId;
      const visited = new Set();
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const node = this.flatNodeList.find(n => n.id === currentId);
        if (node && node.parentId) {
          const parent = this.flatNodeList.find(n => n.id === node.parentId);
          if (parent) {
            chain.push(parent);
            currentId = parent.id;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return chain;
    },

    /**
     * 切换图层加载状态（勾选/取消勾选）
     * @param {Object} node — 树节点数据
     */
    toggleLayerLoad(node) {
      if (this._cesiumLayers.has(node.id)) {
        this.unloadCesiumLayer(node);
      } else {
        this.loadCesiumLayer(node);
      }
    },

    /**
     * 将图层添加到 Cesium
     */
    async loadCesiumLayer(node) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) {
        console.warn(`[${this.componentName}] ⚠️ Cesium 未就绪，无法加载图层`);
        return;
      }

      const layerType = this.detectLayerType(node);
      console.log(`[${this.componentName}] 🌐 加载图层: ${node.name} (类型: ${layerType})`);

      try {
        switch (layerType) {
          case 'xyz': {
            const provider = new Cesium.UrlTemplateImageryProvider({
              url: node.url,
              maximumLevel: 18
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'xyz', object: layer, provider });
            break;
          }
          case 'wms': {
            // 从 URL 中提取 base WMS URL
            const wmsUrl = node.url.replace(/\?.*$/, '');
            const provider = new Cesium.WebMapServiceImageryProvider({
              url: wmsUrl,
              layers: node.wmsLayerName || '0',
              parameters: {
                transparent: true,
                format: 'image/png'
              }
            });
            // WMS 图层默认不可选（避免每像素拾取请求）
            provider.enablePickFeatures = false;
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'wms', object: layer, provider });
            break;
          }
          case 'wmts': {
            // WMTS — 尝试从 GetCapabilities XML URL 构建
            const wmtsUrl = node.url.replace(/\?.*$/, '');
            const provider = new Cesium.WebMapTileServiceImageryProvider({
              url: wmtsUrl,
              layer: node.wmtsLayerName || '',
              style: 'default',
              format: 'image/png',
              tileMatrixSetID: 'EPSG:4326'
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'wmts', object: layer, provider });
            break;
          }
          case 'wfs':
          case 'geojson': {
            const dataSource = await Cesium.GeoJsonDataSource.load(node.url, {
              clampToGround: true
            });
            viewer.dataSources.add(dataSource);
            dataSource.name = node.name;
            this._cesiumLayers.set(node.id, { type: 'geojson', object: dataSource });
            break;
          }
          case '3dtiles': {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(node.url, {
              maximumScreenSpaceError: 16,
              maximumMemoryUsage: 1024
            });
            viewer.scene.primitives.add(tileset);
            await tileset.readyPromise;
            this._cesiumLayers.set(node.id, { type: '3dtiles', object: tileset });
            break;
          }
          case 'mvt': {
            console.log(`[${this.componentName}] 📦 开始加载 MVT 矢量瓦片: ${node.name}`);
            try {
              const mvtStyle = {
                version: 8,
                name: node.name,
                sources: {
                  [node.id]: {
                    type: 'vector',
                    tiles: [node.url],
                    minzoom: 0,
                    maxzoom: 18
                  }
                },
                layers: [
                  {
                    id: `${node.id}-background`,
                    type: 'background',
                    paint: {
                      'background-color': '#f8f8f8'
                    }
                  },
                  {
                    id: `${node.id}-water`,
                    type: 'fill',
                    source: node.id,
                    'source-layer': 'water',
                    paint: {
                      'fill-color': '#a9daf8'
                    }
                  },
                  {
                    id: `${node.id}-land`,
                    type: 'fill',
                    source: node.id,
                    'source-layer': 'land',
                    paint: {
                      'fill-color': '#f0f0f0'
                    }
                  },
                  {
                    id: `${node.id}-roads`,
                    type: 'line',
                    source: node.id,
                    'source-layer': 'roads',
                    paint: {
                      'line-color': '#888888',
                      'line-width': {
                        base: 1.5,
                        stops: [
                          [12, 1],
                          [22, 10]
                        ]
                      }
                    }
                  },
                  {
                    id: `${node.id}-buildings`,
                    type: 'fill',
                    source: node.id,
                    'source-layer': 'buildings',
                    paint: {
                      'fill-color': '#d4d4d4',
                      'fill-outline-color': '#999999'
                    }
                  }
                ]
              };

              const provider = await MVTImageryProvider.create({
                style: mvtStyle,
                cesiumViewer: viewer,
                tileSize: 512,
                maximumLevel: 18,
                credit: node.name
              });

              await provider.readyPromise;
              const layer = viewer.imageryLayers.addImageryProvider(provider);
              this._cesiumLayers.set(node.id, { type: 'mvt', object: layer, provider });
              console.log(`[${this.componentName}] ✅ MVT 矢量瓦片 "${node.name}" 加载成功`);
            } catch (mvtError) {
              console.error(`[${this.componentName}] ❌ MVT 矢量瓦片加载失败:`, mvtError);
              alert(`MVT 矢量瓦片加载失败: ${node.name}\n\n错误信息: ${mvtError.message || mvtError}\n\n可能原因：\n1. 瓦片服务不可达\n2. 瓦片格式不兼容\n3. 需要正确的 Mapbox Style 配置`);
              return;
            }
            break;
          }
          default: {
            // 默认当 XYZ 处理
            const provider = new Cesium.UrlTemplateImageryProvider({
              url: node.url,
              maximumLevel: 18
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'xyz', object: layer, provider });
          }
        }

        // 标记已加载
        this.loadedLayerIds[node.id] = true;
        console.log(`[${this.componentName}] ✅ 图层已加载: ${node.name}`);

        // 加载后飞至图层位置
        this.flyToLayerNode(node);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 加载图层失败: ${node.name}`, error);
        alert(`加载图层失败: ${node.name}\n${error.message || error}`);
      }
    },

    /**
     * 从 Cesium 移除图层
     */
    unloadCesiumLayer(node) {
      const viewer = this.getViewer();
      const entry = this._cesiumLayers.get(node.id);
      if (!entry) return;

      try {
        switch (entry.type) {
          case 'xyz':
          case 'wms':
          case 'wmts': {
            // ⚠️ 策略：先隐藏 → 立即从集合移除(不销毁) → 下一帧安全销毁
            entry.object.show = false;
            viewer.imageryLayers.remove(entry.object, false);
            viewer.scene.requestRender();
            // rAF 确保 Cesium 完成当前帧渲染后再销毁 GPU 纹理
            const imageryLayer = entry.object;
            requestAnimationFrame(() => {
              if (imageryLayer && !imageryLayer.isDestroyed()) {
                imageryLayer.destroy();
              }
            });
            break;
          }
          case 'geojson': {
            viewer.dataSources.remove(entry.object, true);
            break;
          }
          case '3dtiles': {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
            viewer.scene.requestRender();
            break;
          }
          case 'mvt': {
            entry.object.show = false;
            viewer.imageryLayers.remove(entry.object, false);
            viewer.scene.requestRender();
            const imageryLayer = entry.object;
            const provider = entry.provider;
            
            let frameCount = 0;
            const waitAndDestroy = () => {
              frameCount++;
              if (frameCount < 5) {
                viewer.scene.requestRender();
                requestAnimationFrame(waitAndDestroy);
              } else {
                try {
                  if (imageryLayer && !imageryLayer.isDestroyed()) {
                    imageryLayer.destroy();
                  }
                  if (provider && typeof provider.destroy === 'function') {
                    provider.destroy();
                  }
                } catch (e) {
                  console.warn(`[${this.componentName}] ⚠️ MVT 图层销毁警告:`, e);
                }
              }
            };
            requestAnimationFrame(waitAndDestroy);
            break;
          }
        }

        this._cesiumLayers.delete(node.id);
        this.loadedLayerIds[node.id] = false;
        console.log(`[${this.componentName}] 🗑️ 图层已移除: ${node.name}`);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 移除图层失败:`, error);
      }
    },

    /**
     * 飞行至图层位置
     * 优先使用节点自定义坐标，其次根据图层类型推断位置
     */
    flyToLayerNode(node) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;

      try {
        // 1. 优先使用节点自定义中心坐标
        if (node.centerLon != null && node.centerLat != null) {
          const height = node.centerHeight || 50000;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              Number(node.centerLon),
              Number(node.centerLat),
              Number(height)
            ),
            duration: 2
          });
          console.log(`[${this.componentName}] 🎯 飞行至自定义坐标: ${node.name} (${node.centerLon}, ${node.centerLat})`);
          return;
        }

        // 2. GeoJSON / 3DTiles / WFS — 从已有 Cesium 对象获取范围
        const entry = this._cesiumLayers.get(node.id);
        if (!entry) return;

        if (entry.type === 'geojson' && entry.object) {
          viewer.flyTo(entry.object).catch(() => {});
        } else if (entry.type === '3dtiles' && entry.object) {
          viewer.flyTo(entry.object).catch(() => {});
        } else if ((entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'xyz') && entry.provider) {
          // 影像图层尝试从 provider 获取范围
          // WebMapServiceImageryProvider 有 `rectangle` 属性
          const rect = entry.provider.rectangle;
          if (rect) {
            viewer.camera.flyTo({
              destination: rect,
              duration: 2
            });
          } else {
            // 无范围信息的影像图层，飞至默认全球视角
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
              duration: 2
            });
          }
        }
      } catch (e) {
        // 飞行失败不阻塞主流程
        console.warn(`[${this.componentName}] ⚠️ 飞行至图层失败: ${node.name}`, e);
      }
    },

    /**
     * 销毁所有 Cesium 图层（组件卸载时调用）
     */
    destroyAllCesiumLayers() {
      const viewer = this.getViewer();
      if (!viewer) return;
      this._cesiumLayers.forEach((entry) => {
        try {
          if (entry.type === 'xyz' || entry.type === 'wms' || entry.type === 'wmts') {
            viewer.imageryLayers.remove(entry.object, false);
          } else if (entry.type === 'geojson') {
            viewer.dataSources.remove(entry.object, false);
          } else if (entry.type === '3dtiles') {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
          }
        } catch (e) { /* ignore */ }
      });
      this._cesiumLayers.clear();
    },

    beforeSaveConfig() {
      // 确保数据是扁平结构（移除 children 字段）
      this.flatNodeList = this.flatNodeList.map(n => {
        const { children, ...flatNode } = n;
        return flatNode;
      });
      // 同步到 basePanel
      if (this.$refs.basePanel) {
        this.$refs.basePanel.configList = [...this.flatNodeList];
      }
    }
  }
};
</script>

<style scoped>
/* ========== 树形管理容器 ========== */
.tree-manager-container {
  padding: 12px 8px;
  min-height: 200px;
}

/* ========== 工具栏 ========== */
.tree-toolbar {
  display: flex;
  gap: 8px;
  padding: 0 4px 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}

.tree-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tree-btn-primary {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.tree-btn-primary:hover {
  background: #45a049;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.tree-btn-outline {
  background: rgba(255, 255, 255, 0.05);
  color: #b0b0b0;
  border-color: rgba(255, 255, 255, 0.12);
}

.tree-btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.2);
}

.tree-btn-icon {
  font-size: 14px;
}

/* ========== 树容器 ========== */
.tree-wrapper {
  margin-top: 4px;
}

ul.tree-root {
  list-style: none;
  margin: 0;
  padding: 0;
}

ul.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ========== 树节点（对齐 ant-design a-tree 视觉） ========== */
.tree-node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  margin: 1px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  min-height: 32px;
}

.tree-node-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.tree-node-row:hover .tree-node-actions {
  opacity: 1;
}

.tree-node-selected,
.tree-node-selected:hover {
  background: rgba(76, 175, 80, 0.15);
}

/* 展开/折叠箭头 */
.tree-node-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 3px;
  transition: transform 0.2s ease, background 0.15s;
}

.tree-node-arrow:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tree-arrow-icon {
  font-size: 10px;
  color: #808090;
  transition: transform 0.2s ease;
}

.tree-arrow-spacer {
  width: 10px;
  display: inline-block;
}

.tree-node-arrow-hidden {
  cursor: default;
}

/* 节点图标 */
.tree-node-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

/* 节点名称 */
.tree-node-name {
  font-size: 14px;
  color: #e0e0e0;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 节点类型标记 */
.tree-node-type-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
}

.tag-folder {
  background: rgba(33, 150, 243, 0.15);
  color: #64B5F6;
}

.tag-layer {
  background: rgba(156, 39, 176, 0.15);
  color: #CE93D8;
}

/* 不可见标记 */
.tree-node-hidden-tag {
  font-size: 12px;
  opacity: 0.5;
  flex-shrink: 0;
}

/* 操作按钮组 */
.tree-node-actions {
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-left: 4px;
}

.tree-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
  line-height: 1;
}

.tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-action-btn-danger:hover {
  background: rgba(255, 59, 48, 0.2);
}

/* ========== 空状态 ========== */
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.tree-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.tree-empty-text {
  font-size: 16px;
  color: #808090;
  margin-bottom: 8px;
}

.tree-empty-hint {
  font-size: 13px;
  color: #666;
}

/* ========== 删除警告 ========== */
.tree-delete-warning {
  margin-top: 8px;
  padding: 10px 14px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.25);
  border-radius: 8px;
  font-size: 13px;
  color: #ff6b6b;
}

.tree-delete-warning-icon {
  font-size: 20px;
  margin-bottom: 6px;
}

.tree-delete-warning-text {
  margin-bottom: 4px;
}

.tree-delete-count strong {
  color: #FFC107;
}

/* ========== 对话框 ========== */
.tree-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
}

.tree-dialog-panel {
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.tree-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tree-dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.tree-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #808090;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.tree-dialog-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e0e0e0;
}

.tree-dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.tree-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* 表单 */
.tree-form-group {
  margin-bottom: 14px;
}

.tree-form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #b0b0b0;
  margin-bottom: 6px;
}

.tree-form-label .required {
  color: #ff6b6b;
}

.tree-form-label .readonly-hint {
  color: #808090;
  font-weight: 400;
  font-size: 11px;
}

.tree-form-input {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.tree-form-input:focus {
  border-color: #4CAF50;
  background: rgba(255, 255, 255, 0.08);
}

.tree-form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-form-select {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}

.tree-form-select:focus {
  border-color: #4CAF50;
}

.tree-form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #b0b0b0;
}

.tree-form-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4CAF50;
  cursor: pointer;
}

/* ========== 对话框动画 ========== */
.tree-dialog-fade-enter-active,
.tree-dialog-fade-leave-active {
  transition: all 0.2s ease;
}

.tree-dialog-fade-enter-from,
.tree-dialog-fade-leave-to {
  opacity: 0;
}

.tree-dialog-fade-enter-from .tree-dialog-panel,
.tree-dialog-fade-leave-to .tree-dialog-panel {
  transform: scale(0.95);
}
</style>
