/**
 * 全局性能数据存储
 * 用于在 CesiumMainView 和 PerformancePage 之间共享性能数据
 * 支持 localStorage 持久化，即使页面刷新也能保留数据
 */

if (typeof window !== 'undefined') {
  // 从 localStorage 加载保存的数据
  const STORAGE_KEY = 'performance_data_store';
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // 检查数据是否过期（超过1小时）
        if (data.lastUpdateTime && Date.now() - data.lastUpdateTime < 3600000) {
          console.log('[PerformanceDataStore] 📦 从 localStorage 加载保存的性能数据');
          return data;
        }
      }
    } catch (error) {
      console.warn('[PerformanceDataStore] ⚠️ 从 localStorage 加载数据失败:', error);
    }
    return null;
  };

  // 保存到 localStorage
  const saveToStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[PerformanceDataStore] ⚠️ 保存数据到 localStorage 失败:', error);
    }
  };

  // 加载保存的数据
  const savedData = loadFromStorage();

  window.__performanceDataStore__ = {
    // 实时性能指标
    realtimeMetrics: savedData?.realtimeMetrics || {
      FPS: 'N/A',
      '内存使用': 'N/A',
      'Cesium 图元': 'N/A',
      '面板数量': 'N/A'
    },

    // 性能评分
    performanceScore: savedData?.performanceScore || 0,
    scoreGrade: savedData?.scoreGrade || 'N/A',

    // 初始化耗时
    appInitTime: savedData?.appInitTime || 0,
    cesiumInitTime: savedData?.cesiumInitTime || 0,
    panelsLoadTime: savedData?.panelsLoadTime || 0,

    // 内存使用情况
    memoryUsage: savedData?.memoryUsage || null,
    memoryUsagePercent: savedData?.memoryUsagePercent || 0,

    // 性能历史记录
    performanceHistory: savedData?.performanceHistory || [],

    // Cesium 场景统计
    sceneStats: savedData?.sceneStats || {
      totalPrimitives: 0,
      groundPrimitives: 0
    },

    // 面板加载详情
    panelsLoadDetails: savedData?.panelsLoadDetails || null,

    // 性能建议
    suggestions: savedData?.suggestions || [],

    // 监控状态
    isMonitoring: false, // 总是从 false 开始，需要重新启动监控

    // 最后更新时间
    lastUpdateTime: savedData?.lastUpdateTime || null,

    /**
     * 更新实时指标
     */
    updateRealtimeMetrics(metrics) {
      this.realtimeMetrics = { ...this.realtimeMetrics, ...metrics };
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新性能评分
     */
    updatePerformanceScore(score, grade) {
      this.performanceScore = score;
      this.scoreGrade = grade;
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新初始化耗时
     */
    updateInitTimings(appInit, cesiumInit, panelsLoad) {
      this.appInitTime = appInit;
      this.cesiumInitTime = cesiumInit;
      this.panelsLoadTime = panelsLoad;
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新内存使用情况
     */
    updateMemoryUsage(memoryUsage, percent) {
      this.memoryUsage = memoryUsage;
      this.memoryUsagePercent = percent;
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新场景统计
     */
    updateSceneStats(stats) {
      this.sceneStats = { ...this.sceneStats, ...stats };
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新面板加载详情
     */
    updatePanelsLoadDetails(details) {
      this.panelsLoadDetails = details;
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 更新性能建议
     */
    updateSuggestions(suggestions) {
      this.suggestions = suggestions;
      this.lastUpdateTime = Date.now();
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 添加到历史记录
     */
    addToHistory(entry) {
      this.performanceHistory.unshift(entry);
      // 只保留最近20条记录
      if (this.performanceHistory.length > 20) {
        this.performanceHistory = this.performanceHistory.slice(0, 20);
      }
      this.saveData();
      this.notifyListeners();
    },

    /**
     * 设置监控状态
     */
    setMonitoringStatus(status) {
      this.isMonitoring = status;
      this.notifyListeners();
    },

    /**
     * 保存数据到 localStorage
     */
    saveData() {
      saveToStorage({
        realtimeMetrics: this.realtimeMetrics,
        performanceScore: this.performanceScore,
        scoreGrade: this.scoreGrade,
        appInitTime: this.appInitTime,
        cesiumInitTime: this.cesiumInitTime,
        panelsLoadTime: this.panelsLoadTime,
        memoryUsage: this.memoryUsage,
        memoryUsagePercent: this.memoryUsagePercent,
        performanceHistory: this.performanceHistory,
        sceneStats: this.sceneStats,
        panelsLoadDetails: this.panelsLoadDetails,
        suggestions: this.suggestions,
        lastUpdateTime: this.lastUpdateTime
      });
    },

    /**
     * 监听器列表
     */
    listeners: [],

    /**
     * 添加监听器
     */
    addListener(callback) {
      this.listeners.push(callback);
    },

    /**
     * 移除监听器
     */
    removeListener(callback) {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    },

    /**
     * 通知所有监听器
     */
    notifyListeners() {
      this.listeners.forEach(callback => {
        try {
          callback(this);
        } catch (error) {
          console.error('[PerformanceDataStore] 监听器执行失败:', error);
        }
      });
    },

    /**
     * 清空所有数据
     */
    clear() {
      this.realtimeMetrics = {
        FPS: 'N/A',
        '内存使用': 'N/A',
        'Cesium 图元': 'N/A',
        '面板数量': 'N/A'
      };
      this.performanceScore = 0;
      this.scoreGrade = 'N/A';
      this.appInitTime = 0;
      this.cesiumInitTime = 0;
      this.panelsLoadTime = 0;
      this.memoryUsage = null;
      this.memoryUsagePercent = 0;
      this.sceneStats = {
        totalPrimitives: 0,
        groundPrimitives: 0
      };
      this.panelsLoadDetails = null;
      this.suggestions = [];
      this.performanceHistory = [];
      this.lastUpdateTime = Date.now();
      this.isMonitoring = false;
      this.saveData();
      this.notifyListeners();
    }
  };

  console.log('[PerformanceDataStore] ✅ 全局性能数据存储已初始化');
  if (savedData) {
    console.log('[PerformanceDataStore] 📦 已从 localStorage 加载保存的性能数据');
  }
  console.log('[PerformanceDataStore] 💡 可通过 window.__performanceDataStore__ 访问性能数据');
}

export default window.__performanceDataStore__;
