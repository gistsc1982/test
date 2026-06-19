# 性能监控系统 - 快速开始指南

## 🚀 30秒快速开始

### 1. 查看性能报告

应用启动后，打开浏览器控制台，等待3秒钟，你将看到完整的性能报告：

```
[性能监控] 📊 ==================== 完整性能报告 ====================
[性能监控] 🎯 应用初始化总耗时: { 总耗时: "2456.78ms", 评级: "良好" }
[性能监控] 🌐 Cesium 引擎性能: { 总初始化耗时: "1234.56ms", 评级: "优秀" }
[性能监控] ⭐ 总体性能评分: { 分数: 85, 等级: "A" }
```

### 2. 显示性能仪表板

在控制台中输入：

```javascript
__showPerformanceDashboard__()
```

### 3. 运行性能测试

在控制台中输入：

```javascript
await __runPerformanceTests__()
```

## 📊 了解性能指标

### 性能评分等级

- **A+ (90-100分)**: 优秀，性能表现很好
- **A (80-89分)**: 良好，符合预期
- **B (70-79分)**: 中等，需要关注
- **C (60-69分)**: 及格，建议优化
- **D (<60分)**: 需要优化，优先处理

### 关键性能指标

- **应用初始化**: < 3000ms
- **Cesium 引擎**: < 1000ms
- **面板加载**: < 2000ms
- **内存使用**: < 80%

## 🛠️ 在你的代码中使用

### 监控函数性能

```javascript
import { performanceMonitor } from '@/utils/PerformanceMonitor';

// 监控同步函数
performanceMonitor.start('我的操作');
// ... 你的代码
performanceMonitor.end('我的操作');

// 监控异步函数
const result = await performanceMonitor.measureAsync('异步操作', async () => {
  const data = await fetchData();
  return processData(data);
});
```

### 监控 Vue 组件

```javascript
export default {
  async mounted() {
    // 监控组件初始化
    performanceMonitor.start(`${this.$options.name}-初始化`);
    await this.init();
    performanceMonitor.end(`${this.$options.name}-初始化`, 'component');
  }
}
```

## 🔍 常见问题

**Q: 性能报告不显示怎么办？**
A: 确保等待3秒钟让应用初始化完成，然后查看控制台。

**Q: 如何在生产环境中使用？**
A: 性能监控会在生产环境中自动禁用，如需启用请参考集成指南。

**Q: 性能评分是什么意思？**
A: 基于应用初始化总耗时计算的分数，满分100分，低于60分需要优化。

## 📖 更多资源

- [完整文档](./PERFORMANCE_MONITOR_README.md)
- [集成指南](./INTEGRATION_GUIDE.md)
- [使用示例](./PerformanceMonitor.example.js)
- [测试脚本](./PerformanceMonitor.test.js)

## 💡 提示

性能监控系统已完全集成到应用中，无需额外配置即可使用。所有性能数据都会在控制台中输出，你可以随时查看应用的健康状况。
