/**
 * 性能监控使用示例
 *
 * 这个文件展示了如何在应用中使用性能监控工具
 */

import { performanceMonitor } from './PerformanceMonitor.js';

// ==================== 基础使用示例 ====================

// 示例1: 测量同步代码性能
function exampleSyncCode() {
  performanceMonitor.start('数据处理');

  // 模拟数据处理
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += i;
  }

  performanceMonitor.end('数据处理', 'data-processing');
  return result;
}

// 示例2: 测量异步代码性能
async function exampleAsyncCode() {
  await performanceMonitor.measureAsync('API请求', async () => {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
}

// 示例3: 使用定时器测量代码块性能
function exampleWithTimer() {
  performanceMonitor.startTimer('算法执行');

  // 模拟算法执行
  for (let i = 0; i < 100000; i++) {
    Math.sqrt(i);
  }

  performanceMonitor.getTimer('算法执行');
}

// 示例4: 生成和输出性能报告
function generateReport() {
  // 执行各种操作...
  exampleSyncCode();
  exampleAsyncCode();
  exampleWithTimer();

  // 生成报告
  performanceMonitor.logReport();
}

// ==================== Vue组件中使用示例 ====================

/*
// 在Vue组件中使用：

export default {
  name: 'MyComponent',

  async mounted() {
    // 监控组件初始化
    performanceMonitor.start(`${this.$options.name}-初始化`);

    // 初始化操作
    await this.loadData();
    this.setupEventListeners();

    performanceMonitor.end(`${this.$options.name}-初始化`, 'component-init');
  },

  methods: {
    async loadData() {
      await performanceMonitor.measureAsync('数据加载', async () => {
        const response = await fetch('/api/data');
        return await response.json();
      });
    },

    handleUserClick() {
      performanceMonitor.startTimer('点击处理');

      // 处理用户点击
      this.processClick();

      performanceMonitor.getTimer('点击处理');
    }
  },

  beforeUnmount() {
    // 组件卸载时生成报告
    performanceMonitor.logReport();
  }
};
*/

// ==================== API请求监控示例 ====================

/*
// 创建一个监控的API请求包装器
export async function monitoredFetch(url, options = {}) {
  return await performanceMonitor.measureAsync(`API-${url}`, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  });
}

// 使用示例
const data = await monitoredFetch('/api/users');
*/

// ==================== 性能优化的最佳实践 ====================

/*
1. 关键路径监控：监控用户关键操作路径的性能
2. 分类管理：使用category参数对性能数据进行分类
3. 定期报告：在适当的时候生成和查看性能报告
4. 生产环境控制：在生产环境中可以通过setEnabled控制监控开关
5. 异步操作：使用measureAsync监控异步操作的完整性能
*/

// ==================== 导出示例函数 ====================

export {
  exampleSyncCode,
  exampleAsyncCode,
  exampleWithTimer,
  generateReport
};
