# 性能监控系统集成指南

## 快速集成步骤

### 1. 在 CesiumMainView.vue 中导入性能监控工具

```vue
<script>
import { performanceMonitor } from '@/utils/PerformanceMonitor';

export default {
  // ... 其他代码
}
</script>
```

### 2. 添加性能仪表板组件到应用

在 `src/main.js` 中添加：

```javascript
import PerformanceDashboard from '@/components/utils/PerformanceDashboard.vue';

// 创建并挂载仪表板
const dashboard = Vue.createApp(PerformanceDashboard);
const dashboardContainer = document.createElement('div');
document.body.appendChild(dashboardContainer);
dashboard.mount(dashboardContainer);
```

### 3. 在 Vue Router 中添加快捷访问

在需要的页面中显示性能仪表板：

```javascript
// 在任何组件的 mounted 钩子中
mounted() {
  // 显示性能仪表板
  if (window.__showPerformanceDashboard__) {
    window.__showPerformanceDashboard__();
  }
}
```

## 使用方法

### 控制台命令

打开浏览器控制台，可以使用以下命令：

```javascript
// 显示性能仪表板
__showPerformanceDashboard__()

// 运行性能测试
await __runPerformanceTests__()

// 访问性能监控实例
window.__performanceMonitor__
```

### 自动性能报告

应用启动后会自动生成性能报告，包括：

- 应用初始化总耗时
- Cesium 引擎性能
- 面板加载性能
- 内存使用情况
- 性能评分和建议

## 自定义集成

### 在自定义组件中使用

```vue
<template>
  <div>
    <!-- 你的组件内容 -->
  </div>
</template>

<script>
import { performanceMonitor } from '@/utils/PerformanceMonitor';

export default {
  name: 'MyComponent',

  async mounted() {
    // 监控组件初始化
    performanceMonitor.start(`${this.$options.name}-初始化`);

    // 你的初始化代码
    await this.loadData();
    this.setupComponent();

    performanceMonitor.end(`${this.$options.name}-初始化`, 'component');
  },

  methods: {
    async loadData() {
      // 监控数据加载
      await performanceMonitor.measureAsync('数据加载', async () => {
        const response = await fetch('/api/data');
        this.data = await response.json();
      });
    },

    handleUserAction() {
      // 监控用户操作
      performanceMonitor.startTimer('用户点击处理');

      // 处理用户操作
      this.processClick();

      const duration = performanceMonitor.getTimer('用户点击处理');
      console.log(`用户点击处理耗时: ${duration}ms`);
    }
  }
}
</script>
```

## API 路由监控集成

### Axios 拦截器集成

```javascript
import axios from 'axios';
import { performanceMonitor } from '@/utils/PerformanceMonitor';

// 请求拦截器
axios.interceptors.request.use((config) => {
  performanceMonitor.start(`API-${config.url}`);
  return config;
});

// 响应拦截器
axios.interceptors.response.use((response) => {
  performanceMonitor.end(`API-${response.config.url}`, 'api-request');
  return response;
}, (error) => {
  if (error.config) {
    performanceMonitor.end(`API-${error.config.url}`, 'api-request');
  }
  return Promise.reject(error);
});
```

## 环境配置

### 开发环境配置

```javascript
// vite.config.js
export default defineConfig({
  define: {
    '__PERFORMANCE_MONITOR_ENABLED__': JSON.stringify(true),
    '__PERFORMANCE_MONITOR_AUTO_START__': JSON.stringify(true)
  }
});
```

### 生产环境配置

```javascript
// vite.config.js (生产)
export default defineConfig({
  define: {
    '__PERFORMANCE_MONITOR_ENABLED__': JSON.stringify(false),
    '__PERFORMANCE_MONITOR_AUTO_START__': JSON.stringify(false)
  }
});
```

## 性能基准设定

### 目标性能指标

在你的应用中设定性能目标：

```javascript
// 在应用配置中
export const PERFORMANCE_TARGETS = {
  appInitialization: 3000,    // 应用初始化: 3秒
  cesiumEngine: 1000,         // Cesium 引擎: 1秒
  panelLoading: 2000,         // 面板加载: 2秒
  apiResponse: 500,           // API 响应: 500ms
  pageTransition: 300         // 页面切换: 300ms
};

// 使用性能目标验证
function validatePerformance(name, duration, target) {
  const percentage = (duration / target) * 100;
  if (percentage <= 50) return 'excellent';
  if (percentage <= 100) return 'good';
  if (percentage <= 150) return 'fair';
  return 'poor';
}
```

## 持续监控

### 定期性能报告

```javascript
// 设置定期性能报告
setInterval(() => {
  if (window.__performanceMonitor__) {
    window.__performanceMonitor__.logReport();
  }
}, 60000); // 每分钟一次
```

### 性能趋势记录

```javascript
// 记录性能趋势
class PerformanceTracker {
  constructor() {
    this.history = [];
    this.maxHistorySize = 100;
  }

  recordSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.getEntriesByType('measure')
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  analyzeTrends() {
    // 分析性能趋势
    const recentMemory = this.history.slice(-10);
    const memoryTrend = recentMemory.map(h => h.memory?.used || 0);

    return {
      memoryIncreasing: this.isIncreasing(memoryTrend),
      averageMemory: this.average(memoryTrend),
      peakMemory: Math.max(...memoryTrend)
    };
  }

  isIncreasing(arr) {
    if (arr.length < 2) return false;
    let increases = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > arr[i - 1]) increases++;
    }
    return increases > arr.length / 2;
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

// 创建全局性能追踪器
const performanceTracker = new PerformanceTracker();

if (typeof window !== 'undefined') {
  window.__performanceTracker__ = performanceTracker;

  // 每30秒记录一次快照
  setInterval(() => {
    performanceTracker.recordSnapshot();
  }, 30000);
}
```

## 故障排查

### 性能监控不工作

1. 检查是否正确导入性能监控工具
2. 确认浏览器支持 Performance API
3. 检查控制台是否有错误信息

### 性能数据不准确

1. 在同一网络条件下测试
2. 关闭其他浏览器标签页
3. 清除浏览器缓存
4. 禁用浏览器扩展

## 最佳实践

1. **开发阶段**: 启用详细性能监控
2. **测试阶段**: 使用性能基准验证
3. **生产阶段**: 保留关键性能指标
4. **定期审查**: 每月审查性能报告
5. **持续优化**: 基于数据进行优化决策

## 支持和反馈

如有问题或建议，请联系开发团队或在项目中提交 issue。
