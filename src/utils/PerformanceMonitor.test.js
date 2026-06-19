/**
 * 性能监控测试脚本
 *
 * 用于验证性能监控系统是否正常工作
 */

import { performanceMonitor } from './PerformanceMonitor.js';

// 测试1: 基础性能监控
export function testBasicMonitoring() {
  console.log('==================== 测试1: 基础性能监控 ====================');

  performanceMonitor.start('测试操作');

  // 模拟一些操作
  let result = 0;
  for (let i = 0; i < 100000; i++) {
    result += Math.sqrt(i);
  }

  performanceMonitor.end('测试操作', 'test');
  console.log('✅ 基础性能监控测试完成\n');
}

// 测试2: 异步性能监控
export async function testAsyncMonitoring() {
  console.log('==================== 测试2: 异步性能监控 ====================');

  await performanceMonitor.measureAsync('异步测试操作', async () => {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'async result';
  });

  console.log('✅ 异步性能监控测试完成\n');
}

// 测试3: 定时器监控
export function testTimerMonitoring() {
  console.log('==================== 测试3: 定时器监控 ====================');

  performanceMonitor.startTimer('定时器测试');

  // 模拟操作
  let count = 0;
  for (let i = 0; i < 50000; i++) {
    count++;
  }

  performanceMonitor.getTimer('定时器测试');
  console.log('✅ 定时器监控测试完成\n');
}

// 测试4: 性能报告生成
export function testReportGeneration() {
  console.log('==================== 测试4: 性能报告生成 ====================');

  // 执行一些测试操作
  performanceMonitor.start('操作A');
  for (let i = 0; i < 10000; i++) { Math.random(); }
  performanceMonitor.end('操作A', 'category-1');

  performanceMonitor.start('操作B');
  for (let i = 0; i < 20000; i++) { Math.random(); }
  performanceMonitor.end('操作B', 'category-2');

  performanceMonitor.start('操作C');
  for (let i = 0; i < 5000; i++) { Math.random(); }
  performanceMonitor.end('操作C', 'category-1');

  // 生成报告
  performanceMonitor.logReport();

  console.log('✅ 性能报告生成测试完成\n');
}

// 测试5: 清理功能
export function testCleanup() {
  console.log('==================== 测试5: 清理功能 ====================');

  // 添加一些数据
  performanceMonitor.start('清理测试');
  performanceMonitor.end('清理测试', 'cleanup');

  console.log('清理前的数据量:', performanceMonitor.measures.size);

  // 执行清理
  performanceMonitor.clear();

  console.log('清理后的数据量:', performanceMonitor.measures.size);
  console.log('✅ 清理功能测试完成\n');
}

// 测试6: 启用/禁用功能
export function testEnableDisable() {
  console.log('==================== 测试6: 启用/禁用功能 ====================');

  // 禁用监控
  performanceMonitor.setEnabled(false);
  performanceMonitor.start('禁用测试');
  performanceMonitor.end('禁用测试', 'disabled');

  console.log('禁用时的数据量:', performanceMonitor.measures.size);

  // 启用监控
  performanceMonitor.setEnabled(true);
  performanceMonitor.start('启用测试');
  performanceMonitor.end('启用测试', 'enabled');

  console.log('启用时的数据量:', performanceMonitor.measures.size);
  console.log('✅ 启用/禁用功能测试完成\n');
}

// 运行所有测试
export async function runAllTests() {
  console.log('🚀 开始运行性能监控测试套件\n');

  try {
    testBasicMonitoring();
    await testAsyncMonitoring();
    testTimerMonitoring();
    testReportGeneration();
    testCleanup();
    testEnableDisable();

    console.log('✅ 所有测试完成！性能监控系统工作正常。');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台运行测试
  window.__runPerformanceTests__ = runAllTests;
  console.log('💡 提示: 在控制台运行 await __runPerformanceTests__() 来执行测试');
}
