<!--
 * @Description: 独立的性能监控页面
 * 用于显示 /cesium-main 页面的实时性能指标
-->
<template>
  <div class="performance-page-container">
    <div class="performance-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>🚀 性能监控仪表板</h1>
      <div class="header-info">
        <span class="status-indicator" :class="{ active: isMonitoring, 'has-data': hasData && !isMonitoring }">
          <span class="status-dot"></span>
          {{ isMonitoring ? '监控中' : (hasData ? '数据已获取' : '未连接') }}
        </span>
        <span class="last-update" v-if="lastUpdateTime">
          最后更新: {{ formatTime(lastUpdateTime) }}
        </span>
      </div>
    </div>

    <!-- 未连接提示 -->
    <div v-if="!isMonitoring && !hasData" class="no-data-message">
      <div class="no-data-icon">📡</div>
      <div class="no-data-text">未检测到性能监控数据</div>
      <div class="no-data-hint">
        请先访问 /cesium-main 页面启动性能监控
      </div>
      <div class="no-data-action">
        <router-link to="/cesium-main" class="btn btn-primary large-btn">
          🚀 前往 CesiumMain 页面启动监控
        </router-link>
      </div>
      <div class="no-data-explanation">
        <h3>ℹ️ 如何使用性能监控功能</h3>
        <ol>
          <li>点击上方按钮访问 CesiumMain 页面</li>
          <li>等待页面完全加载（约10-15秒）</li>
          <li>返回此页面查看实时性能数据</li>
        </ol>
        <p class="note">
          💡 提示：CesiumMain 页面会在后台持续运行，即使你导航到此页面也不会停止监控
        </p>
      </div>
    </div>

    <!-- 性能数据内容 -->
    <div v-else class="performance-content">
      <!-- 控制按钮 -->
      <div class="control-bar">
        <button @click="refreshData" class="btn btn-primary">
          🔄 刷新数据
        </button>
        <button @click="clearHistory" class="btn btn-secondary">
          🧹 清理历史
        </button>
        <button @click="exportReport" class="btn btn-secondary">
          📥 导出报告
        </button>
      </div>

      <!-- 实时性能指标 -->
      <div class="card">
        <div class="card-header">
          <h2>📊 实时性能指标</h2>
        </div>
        <div class="card-body">
          <div class="metric-grid">
            <div
              class="metric-card"
              v-for="(value, key) in realtimeMetrics"
              :key="key"
            >
              <div class="metric-label">{{ key }}</div>
              <div class="metric-value" :class="getMetricClass(key, value)">
                {{ value }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能评分 -->
      <div class="card">
        <div class="card-header">
          <h2>⭐ 性能评分</h2>
        </div>
        <div class="card-body">
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
      </div>

      <!-- 内存使用情况 -->
      <div class="card" v-if="memoryUsage">
        <div class="card-header">
          <h2>💾 内存使用情况</h2>
        </div>
        <div class="card-body">
          <div class="memory-info">
            <div class="memory-bar-container">
              <div class="memory-bar">
                <div
                  class="memory-used"
                  :style="{ width: memoryUsagePercent + '%' }"
                ></div>
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
      </div>

      <!-- Cesium 场景统计 -->
      <div class="card">
        <div class="card-header">
          <h2>🌐 Cesium 场景统计</h2>
        </div>
        <div class="card-body">
          <div class="scene-stats">
            <div class="stat-item">
              <span class="stat-label">总图元数:</span>
              <span class="stat-value">{{ sceneStats.totalPrimitives }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">地面图元数:</span>
              <span class="stat-value">{{ sceneStats.groundPrimitives }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 面板加载详情 -->
      <div class="card" v-if="panelsLoadDetails">
        <div class="card-header">
          <h2>📦 面板加载详情</h2>
        </div>
        <div class="card-body">
          <div class="panels-summary">
            <div class="panel-summary-item">
              <span>总面板数:</span>
              <span>{{ panelsLoadDetails.总面板数 || 'N/A' }}</span>
            </div>
            <div class="panel-summary-item">
              <span>成功加载:</span>
              <span class="success">{{ panelsLoadDetails.成功加载 || 0 }}</span>
            </div>
            <div class="panel-summary-item">
              <span>加载失败:</span>
              <span class="error">{{ panelsLoadDetails.失败 || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 性能历史 -->
      <div class="card">
        <div class="card-header">
          <h2>📈 性能历史</h2>
        </div>
        <div class="card-body">
          <div class="history-list" v-if="performanceHistory.length > 0">
            <div
              v-for="(item, index) in performanceHistory"
              :key="index"
              class="history-item"
            >
              <div class="history-time">{{ formatTime(item.timestamp) }}</div>
              <div class="history-metrics">
                <span class="history-metric">初始化: {{ item.appInit }}ms</span>
                <span class="history-metric">Cesium: {{ item.cesium }}ms</span>
                <span class="history-metric">面板: {{ item.panels }}ms</span>
              </div>
            </div>
          </div>
          <div v-else class="no-history">
            暂无历史记录
          </div>
        </div>
      </div>

      <!-- 性能建议 -->
      <div class="card" v-if="suggestions.length > 0">
        <div class="card-header">
          <h2>💡 性能建议</h2>
        </div>
        <div class="card-body">
          <div class="suggestions">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="suggestion-item"
              :class="suggestion.type"
            >
              <div class="suggestion-icon">{{ suggestion.icon }}</div>
              <div class="suggestion-text">{{ suggestion.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import '../utils/PerformanceDataStore.js';

export default {
  name: 'PerformancePage',

  data() {
    return {
      isMonitoring: false,
      hasData: false,
      lastUpdateTime: null,
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
      sceneStats: {
        totalPrimitives: 0,
        groundPrimitives: 0
      },
      panelsLoadDetails: null,
      performanceHistory: [],
      suggestions: []
    };
  },

  mounted() {
    console.log('[PerformancePage] 🔧 组件已挂载');
    console.log('[PerformancePage] 🔍 检查 window.__performanceDataStore__:', window.__performanceDataStore__);

    // 初始化性能数据存储监听
    this.initPerformanceStoreListener();

    // 立即加载一次数据
    this.loadFromStore();

    // 设置自动刷新
    this.refreshInterval = setInterval(() => {
      this.loadFromStore();
    }, 2000);
  },

  beforeUnmount() {
    // 移除监听器
    if (window.__performanceDataStore__) {
      window.__performanceDataStore__.removeListener(this.storeListener);
    }

    // 清除定时器
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },

  methods: {
    /**
     * 初始化性能数据存储监听器
     */
    initPerformanceStoreListener() {
      if (!window.__performanceDataStore__) {
        console.warn('[PerformancePage] ⚠️ 性能数据存储不可用');
        return;
      }

      // 创建监听器
      this.storeListener = (store) => {
        this.loadFromStore();
      };

      // 添加监听器
      window.__performanceDataStore__.addListener(this.storeListener);

      console.log('[PerformancePage] ✅ 已监听性能数据存储');
    },

    /**
     * 从性能数据存储加载数据
     */
    loadFromStore() {
      if (!window.__performanceDataStore__) return;

      const store = window.__performanceDataStore__;

      console.log('[PerformancePage] 🔄 正在从性能数据存储加载数据...');

      // 更新监控状态
      this.isMonitoring = store.isMonitoring;

      // 更新数据
      this.realtimeMetrics = { ...store.realtimeMetrics };
      this.performanceScore = store.performanceScore;
      this.scoreGrade = store.scoreGrade;
      this.appInitTime = store.appInitTime;
      this.cesiumInitTime = store.cesiumInitTime;
      this.panelsLoadTime = store.panelsLoadTime;
      this.memoryUsage = store.memoryUsage;
      this.memoryUsagePercent = store.memoryUsagePercent;
      this.sceneStats = { ...store.sceneStats };
      this.panelsLoadDetails = store.panelsLoadDetails;
      this.performanceHistory = [...store.performanceHistory];
      this.suggestions = [...store.suggestions];
      this.lastUpdateTime = store.lastUpdateTime;

      // 🔧 如果 store 中的时间为 0，尝试从 panelsLoadDetails 中提取
      if (this.panelsLoadTime === 0 && this.panelsLoadDetails) {
        const panelsTime = parseFloat(this.panelsLoadDetails.总加载耗时?.replace('ms', '') ?? 0);
        if (panelsTime > 0) {
          this.panelsLoadTime = panelsTime;
          console.log('[PerformancePage] 📦 从 panelsLoadDetails 提取面板加载时间:', this.panelsLoadTime);
        }
      }

      // 检查是否有数据
      this.hasData = store.performanceHistory.length > 0 ||
                     store.performanceScore > 0 ||
                     store.appInitTime > 0 ||
                     store.cesiumInitTime > 0 ||
                     store.panelsLoadTime > 0;

      console.log('[PerformancePage] ✅ 数据加载完成:', {
        isMonitoring: this.isMonitoring,
        hasData: this.hasData,
        appInitTime: this.appInitTime,
        cesiumInitTime: this.cesiumInitTime,
        panelsLoadTime: this.panelsLoadTime,
        performanceScore: this.performanceScore
      });

      // 强制 Vue 更新视图
      this.$forceUpdate();
    },

    /**
     * 刷新数据
     */
    refreshData() {
      this.loadFromStore();
      console.log('[PerformancePage] 🔄 数据已刷新');
    },

    /**
     * 清理历史记录
     */
    clearHistory() {
      if (window.__performanceDataStore__) {
        window.__performanceDataStore__.clear();
        this.performanceHistory = [];
        console.log('[PerformancePage] 🧹 历史记录已清理');
      }
    },

    /**
     * 导出报告
     */
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
        sceneStats: this.sceneStats,
        panelsLoadDetails: this.panelsLoadDetails,
        performanceHistory: this.performanceHistory,
        suggestions: this.suggestions
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('[PerformancePage] 📥 性能报告已导出');
    },

    /**
     * 获取指标样式类
     */
    getMetricClass(key, value) {
      if (key === 'FPS') {
        const fps = parseInt(value);
        if (fps >= 55) return 'metric-good';
        if (fps >= 30) return 'metric-warning';
        return 'metric-poor';
      }
      return 'metric-normal';
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.performance-page-container {
  /* 🔧 强制允许滚动 */
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.performance-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  /* 🔧 确保内容不会被裁剪 */
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-indicator.active {
  background: #d4edda;
  color: #155724;
}

.status-indicator.has-data {
  background: #fff3cd;
  color: #856404;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: pulse 2s infinite;
}

.status-indicator.active .status-dot {
  background: #28a745;
}

.status-indicator.has-data .status-dot {
  background: #ffc107;
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.last-update {
  color: #666;
  font-size: 14px;
}

/* 未连接提示 */
.no-data-message {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-data-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-data-text {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.no-data-hint {
  font-size: 16px;
  color: #666;
}

.link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* 大按钮样式 */
.large-btn {
  display: inline-block;
  padding: 15px 30px;
  font-size: 18px;
  margin-top: 20px;
  border-radius: 8px;
  text-decoration: none;
}

/* 说明文字样式 */
.no-data-explanation {
  margin-top: 30px;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.no-data-explanation h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.no-data-explanation ol {
  margin-bottom: 20px;
  padding-left: 20px;
}

.no-data-explanation li {
  margin-bottom: 10px;
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

.no-data-explanation .note {
  background: #f0f7ff;
  border-left: 4px solid #667eea;
  padding: 12px 15px;
  margin: 0;
  font-size: 14px;
  color: #555;
  border-radius: 4px;
}

/* 性能内容 */
.performance-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 控制按钮 */
.control-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
}

.btn-secondary:hover {
  background: #e9ecef;
}

/* 卡片样式 */
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.card-body {
  padding: 20px;
}

/* 指标网格 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.metric-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
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

/* 性能评分 */
.score-display {
  display: flex;
  gap: 30px;
  align-items: center;
  flex-wrap: wrap;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.score-circle.a {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
}

.score-circle.b {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3);
}

.score-circle.c,
.score-circle.d {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  box-shadow: 0 4px 20px rgba(220, 53, 69, 0.3);
}

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-grade {
  font-size: 18px;
  font-weight: bold;
  margin-top: 4px;
}

.score-details {
  flex: 1;
  min-width: 200px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.score-item:last-child {
  border-bottom: none;
}

/* 内存使用 */
.memory-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
}

.memory-bar-container {
  margin-bottom: 15px;
}

.memory-bar {
  width: 100%;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
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
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
}

.memory-details {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
  gap: 10px;
}

/* 场景统计 */
.scene-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

/* 面板加载详情 */
.panels-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.panel-summary-item {
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 6px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.panel-summary-item .success {
  color: #28a745;
  font-weight: bold;
}

.panel-summary-item .error {
  color: #dc3545;
  font-weight: bold;
}

/* 历史记录 */
.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  font-size: 14px;
  color: #666;
  min-width: 80px;
}

.history-metrics {
  display: flex;
  gap: 15px;
  font-size: 14px;
  flex-wrap: wrap;
}

.history-metric {
  color: #333;
}

.no-history {
  text-align: center;
  padding: 30px;
  color: #999;
}

/* 性能建议 */
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
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
  font-size: 24px;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .score-display {
    flex-direction: column;
    text-align: center;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
