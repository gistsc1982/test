<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="450"
    :panel-max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="echartManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'EChartManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'EChartManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    @config-loaded="onConfigLoadedHandler"
  >
    <template #list-item="{ item }">
      <div class="chart-item-info">
        <span class="chart-name">{{ item.name || '未命名' }}</span>
        <span class="chart-type">{{ getChartTypeName(item.chartType) }}</span>
        <span class="chart-position">📍 {{ item.longitude?.toFixed(4) || '0' }}, {{ item.latitude?.toFixed(4) || '0' }}</span>
      </div>
    </template>

    <template #item-actions="{ item }">
      <button
        @click="showChartOnMap(item)"
        class="action-btn show-btn"
        type="button"
        title="在地图上显示图表"
      >
        🗺️
      </button>
    </template>

    <template #dialogs>
    </template>
  </JsonConfigPanelBase>
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';

import rawPanelMetadata from './EChartManager.config.json';

const panelMetadata = rawPanelMetadata;

export default {
  name: 'EChartManager',

  components: {
    JsonConfigPanelBase
  },

  props: {
    initialX: {
      type: [Number, String],
      default: 'left'
    },
    initialY: {
      type: Number,
      default: 280
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
      componentName: 'EChartManager',
      panelMetadata,
      _cesiumCharts: new Map(),
      _echartsModule: null
    };
  },

  created() {
    // ⭐ 注册配置定义到 DataManager
    configRegistry.registerFromMetadata(this.panelMetadata);
    this.initConfigStrategy();
    this.initECharts();
  },

  beforeDestroy() {
    this.destroyCharts();
  },

  methods: {
    async initECharts() {
      try {
        const module = await import('echarts');
        this._echartsModule = module.default;
        this.registerThemes();
        console.log(`[${this.componentName}] ✅ ECharts 模块加载成功`);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ ECharts 模块加载失败:`, error);
      }
    },

    registerThemes() {
      if (!this._echartsModule) return;

      this._echartsModule.registerTheme('shine', {
        color: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: { color: '#fff' },
        title: { textStyle: { color: '#fff' } },
        legend: { textStyle: { color: '#fff' } },
        tooltip: { textStyle: { color: '#fff' } }
      });

      this._echartsModule.registerTheme('dark', {
        color: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc'],
        backgroundColor: 'rgba(51,51,51,0.9)',
        textStyle: { color: '#eee' },
        title: { textStyle: { color: '#eee' } },
        legend: { textStyle: { color: '#eee' } },
        tooltip: { textStyle: { color: '#eee' } }
      });

      this._echartsModule.registerTheme('essos', {
        color: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
        backgroundColor: 'rgba(242,234,191,0.2)',
        textStyle: { color: '#333' },
        title: { textStyle: { color: '#893448' } },
        legend: { textStyle: { color: '#333' } },
        tooltip: { textStyle: { color: '#333' } }
      });
    },

    initConfigStrategy() {
      const dataSourceType = this.panelMetadata.dataSource?.type || 'sqlite';
      this._configStrategy = ConfigStrategyFactory.createWithFallback(
        [dataSourceType, 'json'],
        { baseURL: 'http://localhost:8081' }
      );
      console.log(`[${this.componentName}] ✅ 配置加载策略已初始化: ${this._configStrategy.getName()}`);
    },

    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 图表配置加载完成`);
      console.log(`[${this.componentName}] 📊 图表总数: ${this.configList.length} 条`);
    },

    getChartTypeName(type) {
      const types = {
        bar: '柱状图',
        line: '折线图',
        pie: '饼图',
        scatter: '散点图',
        map: '地图',
        gauge: '仪表盘'
      };
      return types[type] || type;
    },

    async showChartOnMap(chart) {
      if (!this._echartsModule || !chart) return;

      const viewer = this.getCesiumViewer();
      if (!viewer) {
        console.warn(`[${this.componentName}] ⚠️ 未找到 Cesium Viewer`);
        return;
      }

      this.destroyChart(chart.id);

      try {
        const canvas = document.createElement('canvas');
        const width = parseFloat(chart.width) || 300;
        const height = parseFloat(chart.heightPx) || 200;
        canvas.width = width;
        canvas.height = height;

        const chartInstance = this._echartsModule.init(canvas, chart.theme);
        const option = typeof chart.option === 'string' ? JSON.parse(chart.option) : chart.option;
        chartInstance.setOption(option);

        const position = Cesium.Cartesian3.fromDegrees(
          parseFloat(chart.longitude) || 0,
          parseFloat(chart.latitude) || 0,
          parseFloat(chart.height) || 0
        );

        const entity = viewer.entities.add({
          position: position,
          billboard: {
            image: canvas,
            width: width,
            height: height,
            scale: 1,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
        });

        this._cesiumCharts.set(chart.id, { entity, chartInstance, canvas });

        viewer.zoomTo(entity);
        console.log(`[${this.componentName}] ✅ 图表 "${chart.name}" 已显示在地图上`);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 显示图表失败:`, error);
      }
    },

    destroyChart(chartId) {
      const chartInfo = this._cesiumCharts.get(chartId);
      if (chartInfo) {
        const viewer = this.getCesiumViewer();
        if (viewer && chartInfo.entity) {
          viewer.entities.remove(chartInfo.entity);
        }
        if (chartInfo.chartInstance) {
          chartInfo.chartInstance.dispose();
        }
        if (chartInfo.canvas) {
          chartInfo.canvas.remove();
        }
        this._cesiumCharts.delete(chartId);
      }
    },

    destroyCharts() {
      this._cesiumCharts.forEach((info, id) => {
        this.destroyChart(id);
      });
    },

    getCesiumViewer() {
      return typeof window !== 'undefined' ? window.__cesiumViewer__ : null;
    }
  }
};
</script>

<style scoped>
.chart-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-name {
  font-weight: bold;
  color: #fff;
  font-size: 14px;
}

.chart-type {
  font-size: 12px;
  color: #0098d9;
}

.chart-position {
  font-size: 11px;
  color: #888;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 4px;
  font-size: 16px;
}

.show-btn {
  background: #0098d9;
  color: white;
}

.show-btn:hover {
  background: #007bb5;
}
</style>