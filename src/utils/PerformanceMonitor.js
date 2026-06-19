/**
 * 性能监控工具类
 * 用于监控应用中各个模块的性能
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
    this.timers = new Map();
    this.enabled = true;
  }

  /**
   * 开始性能标记
   * @param {string} name 标记名称
   */
  start(name) {
    if (!this.enabled) return;

    const markName = `perf-${name}-start`;
    performance.mark(markName);
    this.marks.set(name, { start: markName, startTime: performance.now() });

    console.log(`[性能监控] ⏱️ 开始: ${name}`);
  }

  /**
   * 结束性能标记并输出耗时
   * @param {string} name 标记名称
   * @param {string} category 分类（可选）
   */
  end(name, category = 'default') {
    if (!this.enabled) return;

    const markData = this.marks.get(name);
    if (!markData) {
      console.warn(`[性能监控] ⚠️ 未找到标记: ${name}`);
      return;
    }

    const endMarkName = `perf-${name}-end`;
    const measureName = `perf-${name}`;

    performance.mark(endMarkName);
    performance.measure(measureName, markData.start, endMarkName);

    const measure = performance.getEntriesByName(measureName)[0];
    const duration = measure ? measure.duration : performance.now() - markData.startTime;

    // 存储结果
    this.measures.set(name, {
      duration,
      category,
      timestamp: Date.now()
    });

    console.log(`[性能监控] ✅ 完成: ${name} - 耗时: ${duration.toFixed(2)}ms`);

    // 清理标记
    performance.clearMarks(markData.start);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);
    this.marks.delete(name);

    return duration;
  }

  /**
   * 测量异步函数的性能
   * @param {string} name 测量名称
   * @param {Function} asyncFn 异步函数
   */
  async measureAsync(name, asyncFn) {
    this.start(name);
    try {
      const result = await asyncFn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * 开始定时器
   * @param {string} name 定时器名称
   */
  startTimer(name) {
    this.timers.set(name, performance.now());
    console.log(`[性能监控] ⏰ 定时器启动: ${name}`);
  }

  /**
   * 获取定时器耗时
   * @param {string} name 定时器名称
   */
  getTimer(name) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`[性能监控] ⚠️ 未找到定时器: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    console.log(`[性能监控] ⏱️ 定时器 ${name}: ${duration.toFixed(2)}ms`);
    this.timers.delete(name);

    return duration;
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const report = {
      总耗时: 0,
      分类统计: {},
      详细数据: []
    };

    this.measures.forEach((data, name) => {
      report.总耗时 += data.duration;
      report.详细数据.push({ name, ...data });

      if (!report.分类统计[data.category]) {
        report.分类统计[data.category] = {
          总耗时: 0,
          计数: 0
        };
      }

      report.分类统计[data.category].总耗时 += data.duration;
      report.分类统计[data.category].计数 += 1;
    });

    return report;
  }

  /**
   * 输出性能报告
   */
  logReport() {
    const report = this.generateReport();

    console.log('[性能监控] 📊 ==================== 性能报告 ====================');
    console.log('[性能监控] 📊 报告摘要:', {
      总耗时: `${report.总耗时.toFixed(2)}ms`,
      分类统计: Object.entries(report.分类统计).map(([category, data]) => ({
        分类: category,
        总耗时: `${data.总耗时.toFixed(2)}ms`,
        平均耗时: `${(data.总耗时 / data.计数).toFixed(2)}ms`,
        操作数: data.计数
      }))
    });

    if (report.详细数据.length > 0) {
      console.log('[性能监控] 📋 详细数据:');
      report.详细数据
        .sort((a, b) => b.duration - a.duration)
        .forEach(({ name, duration }) => {
          console.log(`  - ${name}: ${duration.toFixed(2)}ms`);
        });
    }

    console.log('[性能监控] =========================================');
  }

  /**
   * 清理所有数据
   */
  clear() {
    this.marks.clear();
    this.measures.clear();
    this.timers.clear();
    performance.clearMarks();
    performance.clearMeasures();
    console.log('[性能监控] 🧹 已清理所有性能数据');
  }

  /**
   * 启用/禁用监控
   * @param {boolean} enabled 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[性能监控] 🔧 监控已${enabled ? '启用' : '禁用'}`);
  }
}

// 创建全局单例
export const performanceMonitor = new PerformanceMonitor();

// 导出到全局
if (typeof window !== 'undefined') {
  window.__performanceMonitor__ = performanceMonitor;
  console.log('[性能监控] ✅ 性能监控工具已加载到全局');
}

export default performanceMonitor;
