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
      <div class="chart-item-info">
        <span class="chart-name">{{ item.name || '未命名' }}</span>
        <span class="chart-type">{{ getChartTypeName(item.chartType) }}</span>
        <span class="chart-position">📍 {{ item.longitude?.toFixed(4) || '0' }}, {{ item.latitude?.toFixed(4) || '0' }}</span>
      </div>
    </template>

    <template #item-actions="{ item }">
      <button
        @click="locateChart(item)"
        class="action-btn locate-btn"
        type="button"
        title="定位到图表位置"
      >
        📍
      </button>
      <button
        @click="showChartOnMap(item)"
        class="action-btn show-btn"
        type="button"
        title="在地图上显示图表"
      >
        🗺️
      </button>
      <button
        @click="hideChart(item)"
        class="action-btn hide-btn"
        type="button"
        title="删除图表显示"
      >
        🗑️
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
      console.log(`[${this.componentName}] 🚀 开始加载 ECharts 模块`);
      
      if (typeof window !== 'undefined' && window.SGKJ_SDK && window.SGKJ_SDK.EChartModule) {
        try {
          const echartModule = await new window.SGKJ_SDK.EChartModule();
          this._echartsModule = echartModule;
          console.log(`[${this.componentName}] ✅ 使用 SGKJ_SDK.EChartModule 成功`);
          console.log(`[${this.componentName}] ✅ 主题已由 SGKJ_SDK 自动注册`);
          return;
        } catch (error) {
          console.error(`[${this.componentName}] ❌ SGKJ_SDK.EChartModule 初始化失败:`, error);
        }
      }
      
      if (typeof window !== 'undefined' && window.echarts && typeof window.echarts.init === 'function') {
        this._echartsModule = window.echarts;
        console.log(`[${this.componentName}] ✅ 使用 window.echarts 成功，版本:`, window.echarts.version);
        this.registerThemes();
        console.log(`[${this.componentName}] ✅ 主题注册完成`);
        return;
      }
      
      try {
        const module = await import(/* webpackChunkName: "echarts" */ 'echarts');
        this._echartsModule = module.default || module;
        
        if (!this._echartsModule || typeof this._echartsModule.init !== 'function') {
          throw new Error('ECharts 模块导出格式不正确');
        }
        console.log(`[${this.componentName}] ✅ ECharts 模块加载成功`);
        this.registerThemes();
        console.log(`[${this.componentName}] ✅ 主题注册完成`);
      } catch (error) {
        console.error(`[${this.componentName}] ❌ ECharts 模块加载失败:`, error);
      }
    },

    registerThemes() {
      if (!this._echartsModule) return;

      this._echartsModule.registerTheme('shine', {
        color: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
        backgroundColor: '#ffffff',
        textStyle: { color: '#333' },
        title: { textStyle: { color: '#333' } },
        legend: { textStyle: { color: '#333' } },
        tooltip: { textStyle: { color: '#333' } },
        categoryAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' }
        },
        valueAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' },
          splitLine: { lineStyle: { color: '#eee' } }
        }
      });

      this._echartsModule.registerTheme('dark', {
        color: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc'],
        backgroundColor: '#ffffff',
        textStyle: { color: '#333' },
        title: { textStyle: { color: '#333' } },
        legend: { textStyle: { color: '#333' } },
        tooltip: { textStyle: { color: '#333' } },
        categoryAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' }
        },
        valueAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' },
          splitLine: { lineStyle: { color: '#eee' } }
        }
      });

      this._echartsModule.registerTheme('essos', {
        color: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
        backgroundColor: '#ffffff',
        textStyle: { color: '#333' },
        title: { textStyle: { color: '#893448' } },
        legend: { textStyle: { color: '#333' } },
        tooltip: { textStyle: { color: '#333' } },
        categoryAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' }
        },
        valueAxis: {
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#333' },
          splitLine: { lineStyle: { color: '#eee' } }
        }
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

    locateChart(chart) {
      console.log(`[${this.componentName}] 📍 定位到图表位置:`, chart.name);
      
      const viewer = this.getCesiumViewer();
      if (!viewer) {
        console.error(`[${this.componentName}] ❌ 未找到 Cesium Viewer`);
        return;
      }
      
      const Cesium = this.getCesium();
      if (!Cesium) {
        console.error(`[${this.componentName}] ❌ Cesium 库未加载`);
        return;
      }
      
      const longitude = parseFloat(chart.longitude) || 0;
      const latitude = parseFloat(chart.latitude) || 0;
      const chartHeight = parseFloat(chart.height) || 100;
      
      const cameraHeight = chartHeight + 5000;
      
      console.log(`[${this.componentName}] 🔍 目标位置: ${longitude}, ${latitude}, 图表高度: ${chartHeight}m, 相机高度: ${cameraHeight}m`);
      
      const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, cameraHeight);
      console.log(`[${this.componentName}] 🔍 笛卡尔坐标:`, position);
      
      viewer.camera.flyTo({
        destination: position,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        },
        duration: 1.0
      });
      
      console.log(`[${this.componentName}] ✅ 定位命令已发送，相机高度: ${cameraHeight}m，垂直向下视角`);
    },

    hideChart(chart) {
      console.log(`[${this.componentName}] 🗑️ 删除图表显示:`, chart.name);
      
      const viewer = this.getCesiumViewer();
      if (!viewer) {
        console.error(`[${this.componentName}] ❌ 未找到 Cesium Viewer`);
        return;
      }
      
      const chartInfo = this._cesiumCharts.get(chart.id);
      if (chartInfo) {
        if (chartInfo.entity) {
          viewer.entities.remove(chartInfo.entity);
          console.log(`[${this.componentName}] ✅ Entity 已移除`);
        }
        if (chartInfo.chartInstance) {
          chartInfo.chartInstance.dispose();
          console.log(`[${this.componentName}] ✅ 图表实例已销毁`);
        }
        this._cesiumCharts.delete(chart.id);
        console.log(`[${this.componentName}] ✅ 图表 "${chart.name}" 已从地图移除`);
      } else {
        console.log(`[${this.componentName}] ℹ️ 图表 "${chart.name}" 未在地图上显示`);
      }
    },

    async showChartOnMap(chart) {
      console.log(`[${this.componentName}] 📊 开始显示图表:`, chart);
      
      if (!this._echartsModule || !chart) {
        console.error(`[${this.componentName}] ❌ ECharts模块或图表数据为空`);
        return;
      }

      const viewer = this.getCesiumViewer();
      if (!viewer) {
        console.error(`[${this.componentName}] ❌ 未找到 Cesium Viewer`);
        return;
      }
      console.log(`[${this.componentName}] ✅ Cesium Viewer 已获取`);

      const Cesium = this.getCesium();
      if (!Cesium) {
        console.error(`[${this.componentName}] ❌ Cesium 库未加载`);
        return;
      }
      console.log(`[${this.componentName}] ✅ Cesium 库已获取`);

      this.destroyChart(chart.id);

      try {
        const width = parseFloat(chart.width) || 300;
        const height = parseFloat(chart.heightPx) || 200;
        console.log(`[${this.componentName}] 📏 图表尺寸: ${width} x ${height}`);

        const container = document.createElement('div');
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.position = 'fixed';
        container.style.top = '-1000px';
        container.style.left = '-1000px';
        container.style.zIndex = '-1';
        document.body.appendChild(container);
        console.log(`[${this.componentName}] ✅ 临时容器已添加到 DOM`);

        console.log(`[${this.componentName}] 🔍 ECharts 模块:`, this._echartsModule);
        
        const chartInstance = this._echartsModule.init(container, chart.theme);
        console.log(`[${this.componentName}] ✅ ECharts 实例创建成功，主题: ${chart.theme}`);

        let option;
        try {
          option = typeof chart.option === 'string' ? JSON.parse(chart.option) : chart.option;
          console.log(`[${this.componentName}] ✅ 图表配置解析成功`);
        } catch (parseError) {
          console.error(`[${this.componentName}] ❌ 图表配置解析失败:`, parseError);
          document.body.removeChild(container);
          return;
        }

        chartInstance.setOption(option);
        console.log(`[${this.componentName}] ✅ setOption 执行完成`);

        setTimeout(() => {
          try {
            let dataUrl;
            if (typeof chartInstance.getDataURL === 'function') {
              dataUrl = chartInstance.getDataURL({
                type: 'png',
                pixelRatio: 1,
                backgroundColor: '#ffffff'
              });
              console.log(`[${this.componentName}] ✅ 使用 ECharts getDataURL 方法`);
            } else {
              const canvas = container.querySelector('canvas');
              dataUrl = canvas ? canvas.toDataURL('image/png') : null;
              console.log(`[${this.componentName}] ✅ 使用 canvas toDataURL 方法`);
            }
            
            console.log(`[${this.componentName}] 🔍 dataUrl 长度: ${dataUrl ? dataUrl.length : 0}`);

            if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
              console.error(`[${this.componentName}] ❌ 无效的 dataUrl`);
              document.body.removeChild(container);
              chartInstance.dispose();
              return;
            }

            const longitude = parseFloat(chart.longitude) || 0;
            const latitude = parseFloat(chart.latitude) || 0;
            const altHeight = parseFloat(chart.height) || 0;

            const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altHeight);

            const entity = viewer.entities.add({
              id: `echart-${chart.id}`,
              name: chart.name,
              position: position,
              billboard: {
                image: dataUrl,
                width: width,
                height: height,
                scale: 1,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                show: true
              }
            });

            this._cesiumCharts.set(chart.id, { entity, chartInstance, container });

            const cameraDistance = Math.max(width, height) * 2;
            
            viewer.flyTo(entity, {
              offset: new Cesium.HeadingPitchRange(
                0, 
                -Cesium.Math.PI_OVER_4, 
                cameraDistance
              ),
              duration: 1.0
            });

            document.body.removeChild(container);
            console.log(`[${this.componentName}] ✅ 临时容器已从 DOM 移除`);
            console.log(`[${this.componentName}] 🎉 图表 "${chart.name}" 已成功显示在地图上，位置: ${longitude}, ${latitude}`);
          } catch (timeoutError) {
            console.error(`[${this.componentName}] ❌ 显示图表超时错误:`, timeoutError);
            document.body.removeChild(container);
            chartInstance.dispose();
          }
        }, 300);
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

.locate-btn {
  background: #67c23a;
  color: white;
}

.locate-btn:hover {
  background: #5eb838;
}

.hide-btn {
  background: #f56c6c;
  color: white;
}

.hide-btn:hover {
  background: #ee5a5a;
}
</style>