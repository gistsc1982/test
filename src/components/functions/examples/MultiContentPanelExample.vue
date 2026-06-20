<template>
  <TestPanelModule
    ref="panel"
    :title="title"
    :auto-register="autoRegister !== undefined ? autoRegister : true"
    :registration-key="registrationKey || 'MultiContentPanel'"
    :panel-instance-id="panelInstanceId"
    :initial-x="initialX"
    :initial-y="initialY"
    v-bind="$attrs"
    @vue:mounted="onTestPanelMounted"
    @vue:updated="onTestPanelUpdated"
  >
    <template #content="slotProps">
      <!-- 工具栏按钮区域 -->
      <div class="panel-toolbar">
        <slot name="toolbar">
          <button class="toolbar-btn" @click="switchToHeightPanel">高度调整</button>
          <button class="toolbar-btn" @click="switchToPhotoPanel">倾斜摄影</button>
        </slot>
      </div>
      
      <!-- 动态内容区域 -->
      <div v-if="dynamicContent.component" class="dynamic-content">
        <component
          :is="dynamicContent.component"
          v-bind="{ ...dynamicContent.props, isClosed: slotProps.isClosed, panelInstanceId: slotProps.panelInstanceId }"
          v-on="dynamicContent.events"
        />
      </div>
      
      <!-- 默认内容插槽 -->
      <slot v-else name="default" :is-closed="slotProps.isClosed" :panel-instance-id="slotProps.panelInstanceId"></slot>
    </template>
  </TestPanelModule>
</template>

<script>
import TestPanelModule from '@cesiumBaseComponentsFunctions/TestPanelModule.vue';
import ObliqueHeightAdjustPanel from '../lib/ObliqueHeightAdjustPanel.mjs';
import ObliquePhotographyPanel from '../lib/ObliquePhotographyPanel.mjs';
import { markRaw } from 'vue';

export default {
  name: 'MultiContentPanel',
  components: {
    TestPanelModule
  },
  props: {
    title: {
      type: String,
      default: '多内容面板'
    },
    registrationKey: {
      type: String,
      default: 'MultiContentPanel'
    },
    panelInstanceId: {
      type: Number,
      default: null
    },
    autoRegister: {
      type: Boolean,
      default: true
    },
    initialX: {
      type: [Number, String],
      default: 'center'
    },
    initialY: {
      type: Number,
      default: 280
    }
  },
  data() {
    return {
      selectedLayer: null,
      dynamicContent: {
        component: null,
        props: {},
        events: {},
        title: null,
        titleIcon: null
      }
    };
  },
  methods: {
    onTestPanelMounted() {
      console.log('[MultiContentPanel] 🎯 TestPanelModule mounted');
    },
    onTestPanelUpdated() {
      console.log('[MultiContentPanel] 🎯 TestPanelModule updated');
    },
    switchToHeightPanel() {
      this.dynamicContent.component = markRaw(ObliqueHeightAdjustPanel);
      this.dynamicContent.props = {
        'selected-layer': this.selectedLayer
      };
      this.dynamicContent.events = {
        'height-change': this.handleHeightChange
      };
      // 同时更新面板标题
      if (this.$refs.panel) {
        this.$refs.panel.setContent(ObliqueHeightAdjustPanel, {
          props: { 'selected-layer': this.selectedLayer },
          events: { 'height-change': this.handleHeightChange },
          title: '高度调整',
          titleIcon: '🌏'
        });
      }
    },
    switchToPhotoPanel() {
      this.dynamicContent.component = markRaw(ObliquePhotographyPanel);
      this.dynamicContent.props = {
        'initial-x': 'center',
        'initial-y': 120
      };
      this.dynamicContent.events = {
        'layer-loaded': this.handleLayerLoaded
      };
      // 同时更新面板标题
      if (this.$refs.panel) {
        this.$refs.panel.setContent(ObliquePhotographyPanel, {
          props: { 'initial-x': 'center', 'initial-y': 120 },
          events: { 'layer-loaded': this.handleLayerLoaded },
          title: '倾斜摄影',
          titleIcon: '📷'
        });
      }
    },
    handleHeightChange(data) {
      console.log('高度变化:', data);
    },
    handleLayerLoaded(data) {
      console.log('图层加载:', data);
    },
    /**
     * 设置面板内容（暴露给父组件使用）
     */
    setContent(component, options = {}) {
      if (this.$refs.panel) {
        this.$refs.panel.setContent(component, options);
      }
    }
  }
};
</script>

<style scoped>
.panel-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.toolbar-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: rgba(76, 175, 80, 0.25);
  border-color: rgba(76, 175, 80, 0.5);
  transform: translateY(-1px);
}

.toolbar-btn:active {
  transform: translateY(0);
}

.dynamic-content {
  flex: 1;
  overflow: auto;
}
</style>
