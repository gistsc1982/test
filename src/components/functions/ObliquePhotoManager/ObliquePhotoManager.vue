<template>
  <!-- 使用 JsonConfigPanelBase 作为基类 -->
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="450"
    :panel-max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="obliquePhotoManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'ObliquePhotoManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'ObliquePhotoManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    @config-loaded="onConfigLoadedHandler"
  >
    <!-- 列表项内容（添加复选框和状态显示） -->
    <template #list-item="{ item }">
      <label class="oblique-checkbox">
        <input
          type="checkbox"
          :checked="item.loaded || false"
          @change="toggleItem(item)"
          :disabled="item.loading || false"
          class="checkbox-input"
        />
        <span class="check-indicator"></span>
        <div class="item-info">
          <span class="item-name">{{ item.name || '未知' }}</span>
          <span v-if="item.loading" class="loading-text">加载中...</span>
          <span v-else-if="item.loaded" class="status-text loaded">✓ 已加载</span>
          <span v-else class="status-text unloaded">未加载</span>
        </div>
      </label>
    </template>

    <!-- 列表项额外操作按钮 -->
    <template #item-actions="{ item }">
      <span style="color: blue; font-size: 10px; margin-right: 4px;"></span>
      
      <!-- 定位按钮 -->
      <button
        @click="locateToItem(item)"
        class="action-btn locate-btn"
        type="button"
        title="定位到倾斜摄影位置"
        style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 4px;"
      >
        📍
      </button>

      <!-- 高度调整按钮 -->
      <button
        @click="adjustHeight(item)"
        class="action-btn height-btn"
        type="button"
        title="调整高度偏移"
        style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;"
      >
        ⬆️
      </button>
    </template>

    <!-- 删除警告额外内容 -->
    <template #delete-warning-extra="{ item }">
      <div v-if="item.loaded" class="delete-warning-detail">
        ⚠️ 该图层当前已加载，删除前将自动卸载
      </div>
    </template>

    <!-- 高度调整面板 -->
    <template #dialogs>
      <div v-if="showHeightPanel && selectedLayer" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999;">
        <ObliqueHeightAdjustPanel
          :initial-x="100"
          :initial-y="100"
          :selected-layer="selectedLayer"
          :auto-register="false"
          :panel-instance-id="1"
          @height-preview="onHeightPreview"
          @height-change="onHeightChange"
          @close="showHeightPanel = false"
        />
      </div>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import ObliqueHeightAdjustPanel from './ObliqueHeightAdjustPanel.vue';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import { validateConfigMetadata, formatValidationResult } from './TableNameValidator.mjs';

// ⭐ 导入面板配置元数据
import rawPanelMetadata from './ObliquePhotoManager.config.json';

// ⭐ 验证配置元数据
const validationResult = validateConfigMetadata(rawPanelMetadata);
console.log(`[ObliquePhotoManager] 📋 配置元数据验证结果:`);
console.log(formatValidationResult(validationResult));

// ⭐ 使用验证后的安全配置
const panelMetadata = validationResult.safeConfig || rawPanelMetadata;

export default {
  name: 'ObliquePhotoManager',

  components: {
    JsonConfigPanelBase,
    ObliqueHeightAdjustPanel
  },

  props: {
    initialX: {
      type: [Number, String],
      default: 'center'
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
      // ⭐ 使用配置元数据
      panelMetadata,

      // Cesium 对象（非响应式）
      _cesiumTilesets: null,
      _cesiumTransforms: null,
      _cesiumHeightOffsets: null,

      // 高度调整面板
      showHeightPanel: false,
      selectedLayer: null,

      componentName: 'ObliquePhotoManager',

      // ⭐ 配置加载策略实例
      _configStrategy: null
    };
  },

  computed: {
    computedHeightPanelX() {
      if (typeof this.initialX === 'number') {
        return this.initialX + 450;
      }
      return 'right';
    },

    // 获取基类的 configList
    configList() {
      return this.$refs.basePanel?.configList || [];
    }
  },

  beforeCreate() {
    // 初始化非响应式 Cesium 对象
    this._cesiumTilesets = new Map();
    this._cesiumTransforms = new Map();
    this._cesiumHeightOffsets = new Map();
  },

  created() {
    // ⭐ 注册配置定义到 DataManager
    configRegistry.registerFromMetadata(this.panelMetadata);
    
    // ⭐ 初始化配置加载策略
    // 根据配置元数据创建策略，支持带回退机制
    const dataSourceType = this.panelMetadata.dataSource?.type || 'sqlite';
    this._configStrategy = ConfigStrategyFactory.createWithFallback(
      [dataSourceType, 'json'],
      { baseURL: 'http://localhost:8081' }
    );
    console.log(`[${this.componentName}] ✅ 配置加载策略已初始化: ${this._configStrategy.getName()}`);
    
    // ⭐ 对 Manager 组件进行配置结构验证
    this.validateManagerStructure();
  },

  methods: {
    /**
     * 验证 Manager 组件的配置结构
     */
    async validateManagerStructure() {
      console.log(`[${this.componentName}] 🔍 开始验证配置结构`);
      
      const strategies = this._configStrategy._strategies || [this._configStrategy];
      
      for (const strategy of strategies) {
        if (typeof strategy.validateManagerStructure === 'function') {
          const result = await strategy.validateManagerStructure(this.panelMetadata);
          console.log(`[${this.componentName}] 📋 结构验证结果:`, result);
          
          if (result.isManager && !result.folderExists) {
            console.warn(`[${this.componentName}] ⚠️ 配置文件夹不存在: /data/gis/${result.folderName}/`);
            console.warn(`[${this.componentName}] 💡 建议创建: public/data/gis/${result.folderName}/`);
          }
        }
      }
    },

    // ==================== 基类钩子方法覆盖 ====================

    initCesium(callback) {
      if (typeof window !== 'undefined' && window.__cesiumViewer__) {
        this.cesiumViewer = window.__cesiumViewer__;
        this.Cesium = window.Cesium;
        if (callback) callback();
      } else {
        const checkCesium = setInterval(() => {
          if (typeof window !== 'undefined' && window.__cesiumViewer__) {
            clearInterval(checkCesium);
            this.cesiumViewer = window.__cesiumViewer__;
            this.Cesium = window.Cesium;
            if (callback) callback();
          }
        }, 100);
      }
    },

    // ⭐ 使用策略模式加载配置
    async loadConfig() {
      try {
        console.log(`[${this.componentName}] 📂 开始加载配置: ${this.panelMetadata.panelId}`);
        console.log(`[${this.componentName}] 🎯 使用策略: ${this._configStrategy.getName()}`);

        // 使用策略加载配置
        const rawData = await this._configStrategy.load(this.panelMetadata);
        
        console.log(`[${this.componentName}] � 加载到数据:`, rawData);

        // 处理加载的数据
        this.configList = this.processLoadedData(rawData);
        this.onConfigLoaded();
        
        console.log(`[${this.componentName}] ✅ 配置加载完成，共 ${this.configList.length} 条`);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 配置加载失败:`, error);
        this.configList = [];
      }
    },

    // ⭐ 使用策略模式保存配置
    async saveConfig() {
      try {
        console.log(`[${this.componentName}] 📤 准备保存配置`);

        // 准备保存数据（移除运行时状态）
        const saveData = this.configList.map(item => {
          const cleanItem = { ...item };
          delete cleanItem.loaded;
          delete cleanItem.loading;
          return cleanItem;
        });

        // 使用策略保存配置
        const success = await this._configStrategy.save(this.panelMetadata, saveData);
        
        if (success) {
          console.log(`[${this.componentName}] ✅ 配置已保存`);
          this.onConfigSaved();
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

    getCesiumObjects() {
      return {
        cesiumTilesets: this._cesiumTilesets,
        cesiumTransforms: this._cesiumTransforms,
        cesiumHeightOffsets: this._cesiumHeightOffsets
      };
    },

    restoreCesiumObjects(cesiumObjects) {
      if (!cesiumObjects) return;

      this._cesiumTilesets = cesiumObjects.cesiumTilesets || new Map();
      this._cesiumTransforms = cesiumObjects.cesiumTransforms || new Map();
      this._cesiumHeightOffsets = cesiumObjects.cesiumHeightOffsets || new Map();

      const viewer = this.getCesiumViewer();
      if (viewer) {
        this._cesiumTilesets.forEach((tileset, id) => {
          if (tileset && !tileset.isDestroyed() && !viewer.scene.primitives.contains(tileset)) {
            viewer.scene.primitives.add(tileset);
          }
        });
      }
    },

    processLoadedData(data) {
      return data.map(item => ({
        ...item,
        loaded: this._cesiumTilesets.has(item.id),
        loading: false,
        heightOffset: this._cesiumHeightOffsets.get(item.id) || 0.0
      }));
    },

    beforeAddItem(item) {
      return {
        ...item,
        loaded: false,
        loading: false
      };
    },

    beforeDeleteItem(item) {
      if (item.loaded) {
        this.unloadItem(item);
      }
    },

    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 配置加载完成`);
      console.log(`[${this.componentName}] 📊 配置总数: ${this.configList.length} 条`);
      
      // ⭐ 打印详细配置内容
      if (this.configList.length > 0) {
        console.log(`[${this.componentName}] 📋 配置详情:`);
        this.configList.forEach((item, index) => {
          console.log(`[${this.componentName}]   ├─ [${index + 1}] ${item.name || item.id || '未命名'}`);
          console.log(`[${this.componentName}]   │   ├── id: ${item.id}`);
          console.log(`[${this.componentName}]   │   ├── name: ${item.name}`);
          console.log(`[${this.componentName}]   │   ├── url: ${item.url || '未设置'}`);
          console.log(`[${this.componentName}]   │   ├── loaded: ${item.loaded || false}`);
          console.log(`[${this.componentName}]   │   └── loading: ${item.loading || false}`);
          
          // 打印其他可能存在的字段
          if (item.heightOffset !== undefined) {
            console.log(`[${this.componentName}]   │   └── heightOffset: ${item.heightOffset}`);
          }
          if (item.tileset) {
            console.log(`[${this.componentName}]   │   └── tileset: ${typeof item.tileset === 'object' ? 'Cesium3DTileset' : item.tileset}`);
          }
        });
      } else {
        console.log(`[${this.componentName}] ⚠️ 配置列表为空`);
      }
      
      // 初始化 loaded 和 loading 状态
      this.configList.forEach(item => {
        if (item.loaded === undefined) item.loaded = false;
        if (item.loading === undefined) item.loading = false;
      });
    },

    // ==================== 业务方法 ====================

    getCesiumViewer() {
      return this.cesiumViewer || (typeof window !== 'undefined' ? window.__cesiumViewer__ : null);
    },

    getCesium() {
      return this.Cesium || (typeof window !== 'undefined' ? window.Cesium : null);
    },

    updateItemState(itemId, newState) {
      const index = this.configList.findIndex(i => i.id === itemId);
      if (index !== -1) {
        this.configList[index] = { ...this.configList[index], ...newState };
        // 触发响应式更新
        if (this.$refs.basePanel) {
          this.$refs.basePanel.configList = [...this.configList];
        }
      }
    },

    async toggleItem(item) {
      if (item.loaded) {
        await this.unloadItem(item);
      } else {
        await this.loadItem(item);
      }
    },

    async loadItem(item) {
      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();

      if (!viewer || !Cesium) {
        console.error(`[${this.componentName}] Cesium 未就绪`);
        return;
      }

      // ⭐ 确保 Map 已初始化
      if (!this._cesiumTilesets) {
        this._cesiumTilesets = new Map();
        this._cesiumTransforms = new Map();
        this._cesiumHeightOffsets = new Map();
      }

      console.log(`[${this.componentName}] 📷 加载倾斜摄影: ${item.name}`);

      try {
        this.updateItemState(item.id, { loading: true });

        // 使用构造函数方式创建 tileset
        const tileset = new Cesium.Cesium3DTileset({
          url: item.url,
          show: true,
          maximumScreenSpaceError: 16,
          skipLevelOfDetail: true,
          baseScreenSpaceError: 1024,
          skipScreenSpaceErrorFactor: 16,
          skipLevels: 1,
          immediatelyLoadDesiredLevelOfDetail: false,
          loadSiblings: false,
          dynamicScreenSpaceError: true,
          dynamicScreenSpaceErrorDensity: 0.00278,
          dynamicScreenSpaceErrorFactor: 4.0,
          dynamicScreenSpaceErrorHeightFalloff: 0.25,
          debugShowBoundingVolume: false,
          debugShowContentBoundingVolume: false,
          debugShowViewerRequestVolume: false
        });

        this._cesiumTilesets.set(item.id, tileset);
        viewer.scene.primitives.add(tileset);

        // 等待 tileset 准备就绪 - 使用兼容方式
        if (tileset.ready) {
          // already ready, proceed
          console.log(`[${this.componentName}] ✅ 加载完成: ${item.name}`);
          this.updateItemState(item.id, { loading: false, loaded: true });

          if (tileset.root && tileset.root.transform) {
            this._cesiumTransforms.set(item.id, Cesium.Matrix4.clone(tileset.root.transform));
          }

          if (tileset.boundingSphere) {
            viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
              duration: 2,
              offset: new Cesium.HeadingPitchRange(0, -45, tileset.boundingSphere.radius * 2.0)
            });
          }
        } else if (tileset.readyPromise) {
          // 使用兼容方式处理 readyPromise
          const onReady = () => {
            console.log(`[${this.componentName}] ✅ 加载完成: ${item.name}`);
            this.updateItemState(item.id, { loading: false, loaded: true });

            if (tileset.root && tileset.root.transform) {
              this._cesiumTransforms.set(item.id, Cesium.Matrix4.clone(tileset.root.transform));
            }

            if (tileset.boundingSphere) {
              viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
                duration: 2,
                offset: new Cesium.HeadingPitchRange(0, -45, tileset.boundingSphere.radius * 2.0)
              });
            }
          };

          const onError = (error) => {
            console.error(`[${this.componentName}] ❌ 加载失败: ${item.name}`, error);
            this.updateItemState(item.id, { loading: false, loaded: false });
          };

          // 兼容标准 Promise 和 Cesium 自定义 Promise
          if (tileset.readyPromise instanceof Promise) {
            tileset.readyPromise.then(onReady).catch(onError);
          } else if (typeof tileset.readyPromise.then === 'function') {
            tileset.readyPromise.then(onReady);
            if (typeof tileset.readyPromise.otherwise === 'function') {
              tileset.readyPromise.otherwise(onError);
            }
          }
        } else {
          // 无法确定 ready 状态，视为失败
          throw new Error('tileset.readyPromise not available');
        }

      } catch (error) {
        console.error(`[${this.componentName}] ❌ 加载失败: ${item.name}`, error);
        this.updateItemState(item.id, { loading: false, loaded: false });
      }
    },

    unloadItem(item) {
      const tileset = this._cesiumTilesets.get(item.id);
      if (tileset) {
        const viewer = this.getCesiumViewer();
        if (viewer && viewer.scene.primitives.contains(tileset)) {
          viewer.scene.primitives.remove(tileset);
        }
        tileset.destroy();
        this._cesiumTilesets.delete(item.id);
        this._cesiumTransforms.delete(item.id);
        this._cesiumHeightOffsets.delete(item.id);
      }

      this.updateItemState(item.id, { loaded: false, loading: false });
      console.log(`[${this.componentName}] ✅ 卸载成功: ${item.name}`);
    },

    locateToItem(item) {
      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();
      const tileset = this._cesiumTilesets.get(item.id);

      if (!viewer || !Cesium || !tileset || !item.loaded) {
        console.warn(`[${this.componentName}] 无法定位: ${item.name}`);
        return;
      }

      try {
        if (tileset.boundingSphere) {
          viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
            duration: 2,
            offset: new Cesium.HeadingPitchRange(0, -45, tileset.boundingSphere.radius * 2.0)
          });
          console.log(`[${this.componentName}] 🎯 已定位到: ${item.name}`);
        }
      } catch (error) {
        console.error(`[${this.componentName}] 定位失败: ${item.name}`, error);
      }
    },

    adjustHeight(item) {
      console.log(`[${this.componentName}] 调整高度按钮点击:`, item.name);
      this.selectedLayer = {
        id: item.id,
        name: item.name,
        tileset: this._cesiumTilesets.get(item.id),
        heightOffset: this._cesiumHeightOffsets.get(item.id) || 0
      };
      console.log(`[${this.componentName}] selectedLayer:`, this.selectedLayer);
      this.showHeightPanel = true;
      console.log(`[${this.componentName}] showHeightPanel:`, this.showHeightPanel);
    },

    onHeightPreview({ layer, value }) {
      if (!layer) return;
      this._cesiumHeightOffsets.set(layer.id, value);
    },

    onHeightChange({ layer, value }) {
      if (!layer) return;

      this._cesiumHeightOffsets.set(layer.id, value);
      console.log(`[${this.componentName}] ${layer.name} 高度偏移: ${value.toFixed(1)} 米`);

      this.applyHeightOffset(layer);
    },

    applyHeightOffset(item) {
      const viewer = this.getCesiumViewer();
      const Cesium = this.getCesium();
      const tileset = this._cesiumTilesets.get(item.id);
      const initialTransform = this._cesiumTransforms.get(item.id);

      if (!viewer || !Cesium || !tileset || !initialTransform) {
        console.warn(`[${this.componentName}] ⚠️ 无法应用高度偏移: 缺少必要参数`, {
          viewer: !!viewer,
          Cesium: !!Cesium,
          tileset: !!tileset,
          initialTransform: !!initialTransform
        });
        return;
      }

      try {
        if (tileset.root) {
          const transform = Cesium.Matrix4.clone(initialTransform);
          const heightOffset = this._cesiumHeightOffsets.get(item.id) || 0;
          const offset = new Cesium.Cartesian3(0, 0, heightOffset);
          const translation = Cesium.Matrix4.fromTranslation(offset);
          Cesium.Matrix4.multiply(transform, translation, transform);
          tileset.root.transform = transform;

          console.log(`[${this.componentName}] ✅ ${item.name} 高度偏移已应用: ${heightOffset.toFixed(1)}米`);
        }
      } catch (error) {
        console.error(`[${this.componentName}] 应用高度偏移失败: ${item.name}`, error);
      }
    }
  }
};
</script>

<style scoped>
/* 复选框样式 */
.oblique-checkbox {
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

.oblique-checkbox:hover .check-indicator {
  border-color: rgba(255, 255, 255, 0.5);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  color: #e0e0e0;
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
.action-btn.locate-btn:hover {
  background: rgba(33, 150, 243, 0.2);
  border-color: rgba(33, 150, 243, 0.4);
  color: #2196F3;
}

.action-btn.height-btn:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.4);
  color: #4CAF50;
}

/* 高度调整面板 */
.height-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10000;
}

.height-panel-overlay > * {
  pointer-events: auto;
}

.height-panel-fade-enter-active,
.height-panel-fade-leave-active {
  transition: all 0.3s ease;
}

.height-panel-fade-enter-from,
.height-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 删除警告 */
.delete-warning-detail {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 4px;
  font-size: 13px;
  color: #ff6b6b;
}
</style>