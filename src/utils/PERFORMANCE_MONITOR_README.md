# 性能监控系统使用指南

## 概述

本项目已集成了完整的性能监控系统，可以实时监控应用性能，包括：

- 应用初始化性能
- Cesium 引擎性能
- 面板加载性能
- 内存使用情况
- 帧率监控
- 自定义性能监控

## 快速开始

### 1. 自动性能监控

应用启动后会自动监控以下关键指标：

```javascript
// 应用启动后会在控制台输出性能报告
[性能监控] 🚀 应用初始化性能监控启动
[性能监控] 🌐 Cesium引擎初始化开始
[性能监控] 📊 Cesium引擎性能报告: {...}
[性能监控] 🔄 SyncManager初始化开始
[性能监控] 📦 面板预加载开始
```

### 2. 查看性能报告

性能报告会在应用启动完成后自动输出（约3秒后）：

```javascript
[性能监控] 📊 ==================== 完整性能报告 ====================
[性能监控] 🎯 应用初始化总耗时: { 总耗时: "2456.78ms", 评级: "良好" }
[性能监控] 🌐 Cesium 引擎性能: { 总初始化耗时: "1234.56ms", 评级: "优秀" }
[性能监控] 📦 面板加载性能: { 总加载耗时: "890.12ms", 评级: "优秀" }
[性能监控] ⭐ 总体性能评分: { 分数: 85, 等级: "A", 总耗时: "2456.78ms" }
```

## 自定义性能监控

### 使用 PerformanceMonitor 工具类

```javascript
import { performanceMonitor } from '@/utils/PerformanceMonitor';

// 监控同步代码
performanceMonitor.start('数据处理');
// ... 你的代码
performanceMonitor.end('数据处理', 'category-name');

// 监控异步代码
const result = await performanceMonitor.measureAsync('API请求', async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// 生成自定义报告
performanceMonitor.logReport();
```

### 在 Vue 组件中使用

```javascript
export default {
  name: 'MyComponent',

  async mounted() {
    // 监控组件初始化
    performanceMonitor.start(`${this.$options.name}-初始化`);

    await this.initComponent();

    performanceMonitor.end(`${this.$options.name}-初始化`, 'component-init');
  },

  methods: {
    async initComponent() {
      // 监控异步方法
      await performanceMonitor.measureAsync('加载数据', async () => {
        const data = await this.fetchData();
        this.data = data;
      });
    }
  }
};
```

## 性能指标说明

### 性能评级标准

| 耗时 | 评级 | 说明 |
|------|------|------|
| < 目标值×0.5 | 优秀 | 性能非常好 |
| < 目标值 | 良好 | 性能符合预期 |
| < 目标值×1.5 | 一般 | 需要关注 |
| ≥ 目标值×1.5 | 需要优化 | 建议优化 |

### 各模块目标耗时

- **应用初始化总耗时**: < 3000ms
- **Cesium 引擎初始化**: < 1000ms
- **面板加载**: < 2000ms
- **SyncManager 初始化**: < 500ms

### 性能评分等级

| 分数 | 等级 | 说明 |
|------|------|------|
| 90-100 | A+ | 优秀 |
| 80-89 | A | 良好 |
| 70-79 | B | 中等 |
| 60-69 | C | 及格 |
| < 60 | D | 需要优化 |

## 实时监控功能

### Cesium 引擎实时监控

系统会自动监控 Cesium 引擎的实时状态：

```javascript
// 每5秒输出一次Cesium状态
[性能监控] 🌐 Cesium实时状态: {
  场景统计: { 总图元数: 125, 地面图元数: 0 },
  相机信息: { 位置: "...", 高度: "500.00m" },
  内存使用: { 纹理内存: "8MB" }
}
```

### 内存使用监控

系统会自动监控内存使用情况（浏览器支持时）：

```javascript
// 每10秒输出一次内存状态
[性能监控] 💾 内存使用情况: {
  已使用JS堆大小: "45.67MB",
  JS堆总大小: "50.00MB",
  JS堆限制: "1024.00MB",
  内存使用率: "4.46%"
}
```

## 性能优化建议

### 基于 CesiumMainView 的优化

1. **减少面板数量**
   - 只启用必需的面板
   - 使用懒加载策略

2. **优化 Cesium 配置**
   - 减少初始化时的图元数量
   - 使用合适的影像瓦片大小

3. **异步加载**
   - 使用 `requestIdleCallback` 延迟非关键操作
   - 分批加载大型资源

### 通用优化建议

1. **代码分割**
   - 使用动态导入减少初始加载时间
   - 按路由分割代码

2. **资源优化**
   - 压缩图片资源
   - 使用 WebP 格式
   - 启用资源缓存

3. **减少重渲染**
   - 使用 Vue 的计算属性缓存
   - 避免不必要的响应式数据

## 生产环境配置

### 启用/禁用监控

```javascript
// 在生产环境中可以禁用部分监控
if (process.env.NODE_ENV === 'production') {
  performanceMonitor.setEnabled(false);
}
```

### 环境变量配置

```javascript
// vite.config.js
export default defineConfig({
  define: {
    '__PERFORMANCE_MONITOR_ENABLED__': JSON.stringify(
      process.env.NODE_ENV === 'development'
    )
  }
});
```

## 故障排除

### 性能报告不显示

1. 检查浏览器控制台是否被清空
2. 确认监控未在生产环境中被禁用
3. 查看是否有 JavaScript 错误

### 性能数据异常

1. 清除浏览器缓存后重新测试
2. 关闭其他浏览器标签页
3. 检查是否有其他扩展程序干扰

### 内存泄漏检测

使用浏览器开发者工具：

```javascript
// 在控制台中运行
performanceMonitor.logReport();
window.__performanceMonitor__.clear();
```

## API 参考

### PerformanceMonitor 类

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `start(name)` | 开始性能标记 | void |
| `end(name, category)` | 结束性能标记 | number (耗时ms) |
| `measureAsync(name, fn)` | 测量异步函数 | Promise |
| `startTimer(name)` | 启动定时器 | void |
| `getTimer(name)` | 获取定时器耗时 | number |
| `generateReport()` | 生成性能报告 | Object |
| `logReport()` | 输出性能报告 | void |
| `clear()` | 清理所有数据 | void |
| `setEnabled(bool)` | 启用/禁用监控 | void |

## 贡献指南

如果你想扩展性能监控系统：

1. 在 `src/utils/PerformanceMonitor.js` 中添加新功能
2. 更新本文档
3. 添加使用示例到 `PerformanceMonitor.example.js`

## 许可证

MIT License
