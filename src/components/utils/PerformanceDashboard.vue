<template>
  <div class="performance-dashboard" v-if="isVisible">
    <div class="dashboard-header">
      <h3>🚀 性能监控仪表板</h3>
      <div class="dashboard-controls">
        <button @click="refreshData" class="btn-refresh">刷新</button>
        <button @click="clearData" class="btn-clear">清理</button>
        <button @click="exportReport" class="btn-export">导出</button>
        <button @click="isVisible = false" class="btn-close">关闭</button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 实时性能指标 -->
      <div class="performance-section">
        <h4>📊 实时性能指标</h4>
        <div class="metric-grid">
          <div class="metric-card" v-for="(value, key) in realtimeMetrics" :key="key">
            <div class="metric-label">{{ key }}</div>
            <div class="metric-value" :class="getMetricClass(key, value)">
              {{ value }}
            </div>
          </div>
        </div>
      </div>

      <!-- 性能评分 -->
      <div class="performance-section">
        <h4>⭐ 性能评分</h4>
        <div class="score-display">
          <div class="score-circle" :class="scoreGrade.toLowerCase()">
            <div class="score-value">{{ performanceScore }}</div>
            <div class="score-grade">{{ scoreGrade }}</div>
          </div>
          <div class="score-details">
            <div class="score-item">
              <span>应用初始化:</span>
              <span>{{ appInitTime }}ms</span>
            </div>
            <div class="score-item">
              <span>Cesium 引擎:</span>
              <span>{{ cesiumInitTime }}ms</span>
            </div>
            <div class="score-item">
              <span>面板加载:</span>
              <span>{{ panelsLoadTime }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 内存使用情况 -->
      <div class="performance-section" v-if="memoryUsage">
        <h4>💾 内存使用情况</h4>
        <div class="memory-info">
          <div class="memory-bar-container">
            <div class="memory-bar">
              <div class="memory-used" :style="{ width: memoryUsagePercent + '%' }"></div>
            </div>
            <div class="memory-text">{{ memoryUsagePercent }}%</div>
          </div>
          <div class="memory-details">
            <div>已使用: {{ memoryUsage.used }}MB</div>
            <div>总计: {{ memoryUsage.total }}MB</div>
            <div>限制: {{ memoryUsage.limit }}MB</div>
          </div>
        </div>
      </div>

      <!-- 性能历史 -->
      <div class="performance-section">
        <h4>📈 性能历史</h4>
        <div class="history-list">
          <div v-for="(item, index) in performanceHistory" :key="index" class="history-item">
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            <div class="history-metrics">
              <span class="history-metric">初始化: {{ item.appInit }}ms</span>
              <span class="history-metric">Cesium: {{ item.cesium }}ms</span>
              <span class="history-metric">面板: {{ item.panels }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能建议 -->
      <div class="performance-section">
        <h4>💡 性能建议</h4>
        <div class="suggestions">
          <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item" :class="suggestion.type">
            <div class="suggestion-icon">{{ suggestion.icon }}</div>
            <div class="suggestion-text">{{ suggestion.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PerformanceDashboard',

  data() {
    return {
      isVisible: false,
      realtimeMetrics: {
        FPS: 'N/A',
        '内存使用': 'N/A',
        'Cesium 图元': 'N/A',
        '面板数量': 'N/A'
      },
      performanceScore: 0,
      scoreGrade: 'N/A',
      appInitTime: 0,
      cesiumInitTime: 0,
      panelsLoadTime: 0,
      memoryUsage: null,
      memoryUsagePercent: 0,
      performanceHistory: [],
      suggestions: [],
      updateInterval: null
    };
  },

  mounted() {
    // 暴露到全局，方便其他组件调用
    if (typeof window !== 'undefined') {
      window.__showPerformanceDashboard__ = () => {
        this.isVisible = true;
        this.startMonitoring();
      };
      console.log('[PerformanceDashboard] 💡 提示: 在控制台运行 __showPerformanceDashboard__() 来显示仪表板');
    }
  },

  beforeUnmount() {
    this.stopMonitoring();
  },

  methods: {
    startMonitoring() {
      this.refreshData();
      this.updateInterval = setInterval(() => {
        this.refreshData();
      }, 2000);
    },

    stopMonitoring() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    },

    refreshData() {
      this.updateRealtimeMetrics();
      this.updateMemoryUsage();
      this.calculateScore();
      this.generateSuggestions();
    },

    updateRealtimeMetrics() {
      // 从 PerformanceMonitor 获取数据
      if (window.__performanceMonitor__) {
        const report = window.__performanceMonitor__.generateReport();
        this.realtimeMetrics = {
          FPS: this.calculateFPS(),
          '内存使用': this.formatMemory(),
          'Cesium 图元': this.getCesiumPrimitiveCount(),
          '面板数量': this.getPanelCount()
        };
      }
    },

    updateMemoryUsage() {
      if (performance.memory) {
        this.memoryUsage = {
          used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
          total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
          limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
        };
        this.memoryUsagePercent = ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2);
      }
    },

    calculateScore() {
      // 从性能标记中计算分数
      const entries = performance.getEntriesByType('measure');

      entries.forEach(entry => {
        if (entry.name.includes('app-init')) {
          this.appInitTime = entry.duration.toFixed(0);
        } else if (entry.name.includes('cesium-init')) {
          this.cesiumInitTime = entry.duration.toFixed(0);
        } else if (entry.name.includes('panels-preload')) {
          this.panelsLoadTime = entry.duration.toFixed(0);
        }
      });

      // 计算总分
      const totalDuration = parseFloat(this.appInitTime) || 0;
      let score = 100;
      const excessSeconds = (totalDuration - 2000) / 1000;
      if (excessSeconds > 0) {
        score -= Math.min(excessSeconds * 10, 50);
      }
      this.performanceScore = Math.max(Math.round(score), 50);

      // 确定等级
      if (this.performanceScore >= 90) this.scoreGrade = 'A+';
      else if (this.performanceScore >= 80) this.scoreGrade = 'A';
      else if (this.performanceScore >= 70) this.scoreGrade = 'B';
      else if (this.performanceScore >= 60) this.scoreGrade = 'C';
      else this.scoreGrade = 'D';

      // 添加到历史记录
      this.addToHistory();
    },

    addToHistory() {
      this.performanceHistory.unshift({
        timestamp: Date.now(),
        appInit: this.appInitTime,
        cesium: this.cesiumInitTime,
        panels: this.panelsLoadTime
      });

      // 只保留最近10条记录
      if (this.performanceHistory.length > 10) {
        this.performanceHistory = this.performanceHistory.slice(0, 10);
      }
    },

    generateSuggestions() {
      this.suggestions = [];

      // 基于性能评分生成建议
      if (this.performanceScore < 70) {
        this.suggestions.push({
          type: 'warning',
          icon: '⚠️',
          text: '性能评分较低，建议优化应用启动流程'
        });
      }

      if (this.cesiumInitTime > 1500) {
        this.suggestions.push({
          type: 'warning',
          icon: '🌐',
          text: 'Cesium 初始化耗时较长，可以减少初始图元数量'
        });
      }

      if (this.panelsLoadTime > 2000) {
        this.suggestions.push({
          type: 'warning',
          icon: '📦',
          text: '面板加载较慢，建议启用懒加载或减少面板数量'
        });
      }

      if (this.memoryUsagePercent > 80) {
        this.suggestions.push({
          type: 'error',
          icon: '💾',
          text: '内存使用率过高，请注意内存泄漏'
        });
      }

      if (this.suggestions.length === 0) {
        this.suggestions.push({
          type: 'success',
          icon: '✅',
          text: '性能表现良好，继续保持！'
        });
      }
    },

    getMetricClass(key, value) {
      // 根据指标值返回对应的CSS类
      if (key === 'FPS') {
        const fps = parseInt(value);
        if (fps >= 55) return 'metric-good';
        if (fps >= 30) return 'metric-warning';
        return 'metric-poor';
      }
      return 'metric-normal';
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },

    calculateFPS() {
      // 简化的FPS计算
      return '60'; // 实际应该从 requestAnimationFrame 计算
    },

    formatMemory() {
      if (performance.memory) {
        return (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB';
      }
      return 'N/A';
    },

    getCesiumPrimitiveCount() {
      if (window.viewer && window.viewer.scene) {
        return window.viewer.scene.primitives.length;
      }
      return 'N/A';
    },

    getPanelCount() {
      if (window.__helloWorldInstance__ && window.__helloWorldInstance__.functionPanelComponents) {
        return Object.keys(window.__helloWorldInstance__.functionPanelComponents).length;
      }
      return 'N/A';
    },

    clearData() {
      this.performanceHistory = [];
      if (window.__performanceMonitor__) {
        window.__performanceMonitor__.clear();
      }
      performance.clearMarks();
      performance.clearMeasures();
      console.log('[PerformanceDashboard] 🧹 性能数据已清理');
    },

    exportReport() {
      const report = {
        timestamp: new Date().toISOString(),
        realtimeMetrics: this.realtimeMetrics,
        performanceScore: this.performanceScore,
        scoreGrade: this.scoreGrade,
        timing: {
          appInit: this.appInitTime,
          cesium: this.cesiumInitTime,
          panels: this.panelsLoadTime
        },
        memoryUsage: this.memoryUsage,
        performanceHistory: this.performanceHistory
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[PerformanceDashboard] 📥 性能报告已导出');
    }
  }
};
</script>

<style scoped>
.performance-dashboard {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.dashboard-header h3 {
  margin: 0;
  font-size: 16px;
}

.dashboard-controls {
  display: flex;
  gap: 8px;
}

.dashboard-controls button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.dashboard-controls button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  padding: 15px;
}

.performance-section {
  margin-bottom: 20px;
}

.performance-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 5px;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.metric-card {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.metric-good {
  color: #28a745;
}

.metric-warning {
  color: #ffc107;
}

.metric-poor {
  color: #dc3545;
}

.score-display {
  display: flex;
  gap: 20px;
  align-items: center;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.score-circle.a {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.score-circle.b {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
}

.score-circle.c,
.score-circle.d {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.score-value {
  font-size: 32px;
  font-weight: bold;
}

.score-grade {
  font-size: 16px;
  font-weight: bold;
}

.score-details {
  flex: 1;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.memory-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.memory-bar-container {
  margin-bottom: 10px;
}

.memory-bar {
  width: 100%;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.memory-used {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #ffc107 70%, #dc3545 100%);
  transition: width 0.3s;
}

.memory-text {
  text-align: center;
  margin-top: 5px;
  font-size: 14px;
  font-weight: bold;
}

.memory-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-time {
  font-size: 12px;
  color: #666;
  min-width: 80px;
}

.history-metrics {
  display: flex;
  gap: 15px;
  font-size: 12px;
}

.history-metric {
  color: #333;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #f8f9fa;
}

.suggestion-item.success {
  background: #d4edda;
  color: #155724;
}

.suggestion-item.warning {
  background: #fff3cd;
  color: #856404;
}

.suggestion-item.error {
  background: #f8d7da;
  color: #721c24;
}

.suggestion-icon {
  font-size: 20px;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
}
</style>
