/**
 * 立即禁用频繁日志脚本
 * 运行: fetch('/disable-freq-logs.js').then(r=>r.text()).then(eval)
 */

(function() {
    'use strict';

    console.log('🔇 禁用频繁日志...');

    // 保存原始 console.log
    const originalLog = console.log;
    const originalWarn = console.warn;

    // 需要过滤的日志模式
    const filterPatterns = [
        '[DualCanvasViewer] 双层模式',
        '[DualCanvasViewer] 使用 TransformControls',
        '[DualCanvasViewer] 真实世界模式',
        '[DualCanvasViewer] xeokit viewer',
        '[DualCanvasViewer] Three.js 相机已同步',
        '[DualCanvasViewer] syncCameraFromThreeToBim',
        '[DualCanvasViewer] 更新 near/far 值',
        '[SyncManager]',
        '[HelloWorld.syncToThreeJSFromUnified]',
        '[HelloWorld] 大坐标模式'
    ];

    // 检查是否需要过滤
    function shouldFilter(args) {
        if (args.length === 0) return false;
        const msg = String(args[0]);
        return filterPatterns.some(pattern => msg.includes(pattern));
    }

    // 重写 console.log
    console.log = function(...args) {
        if (!shouldFilter(args)) {
            originalLog.apply(console, args);
        }
    };

    // 重写 console.warn（部分警告日志）
    console.warn = function(...args) {
        if (!shouldFilter(args)) {
            originalWarn.apply(console, args);
        }
    };

    console.log('✅ 频繁日志已禁用');
    console.log('📊 以下日志类型将被过滤:', filterPatterns);

    // 返回恢复函数
    return {
        restore: () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.log('✅ 日志已恢复');
        }
    };
})();
