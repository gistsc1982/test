╔══════════════════════════════════════════════════════════╗
║  🔧 禁用动态 near/far 更新修复脚本                        ║
║  🎯 防止源代码中的动态更新覆盖多场景的固定值               ║
╚══════════════════════════════════════════════════════════╝

🔍 [步骤1] 分析问题...
   ❌ 问题：updateCameraProjectionForLargeCoord() 在缩放时动态更新 near/far
   ❌ 结果：覆盖了 fix-multi-scene-simple.js 设置的固定值
   ✅ 解决方案：禁用此方法，保留多场景管理器的固定值

🔧 [步骤2] 获取 DualCanvasViewer 实例...
*/

const viewer = window.__dualCanvasViewer;
if (!viewer) {
  console.error('❌ DualCanvasViewer 实例未找到');
  throw new Error('DualCanvasViewer 实例未找到');
}

console.log('✅ DualCanvasViewer 实例已找到');

/*
🔧 [步骤3] 禁用 updateCameraProjectionForLargeCoord 方法...
   保存原始方法引用（如果需要）
   替换为空操作函数
*/

const originalMethod = viewer.updateCameraProjectionForLargeCoord;
if (typeof originalMethod !== 'function') {
  console.warn('⚠️  updateCameraProjectionForLargeCoord 方法不是函数');
} else {
  console.log('✅ 找到原始方法，已保存引用到 window._originalUpdateCameraProjection');
  window._originalUpdateCameraProjection = originalMethod;
}

// 替换为空操作函数
viewer.updateCameraProjectionForLargeCoord = function() {
  // 空操作 - 不再动态更新 near/far
  // 让多场景管理器保持固定值
};

console.log('✅ 已禁用 updateCameraProjectionForLargeCoord 方法');

/*
🔒 [步骤4] 设置守护任务，防止方法被恢复...
*/

window._disableDynamicNearFarGuard = setInterval(() => {
  if (window.__dualCanvasViewer &&
      window.__dualCanvasViewer.updateCameraProjectionForLargeCoord &&
      window.__dualCanvasViewer.updateCameraProjectionForLargeCoord.toString() !== 'function() {\n          // 空操作 - 不再动态更新 near/far\n          // 让多场景管理器保持固定值\n        }') {
    window.__dualCanvasViewer.updateCameraProjectionForLargeCoord = function() {
      // 空操作
    };
  }
}, 1000);

console.log('✅ 守护任务已启动');

/*
🔧 [步骤5] 验证多场景管理器的 near/far 值...
*/

if (window.__multiSceneManager) {
  const manager = window.__multiSceneManager;

  const checkCamera = (name, camera) => {
    if (!camera) return;
    const ratio = camera.far / camera.near;
    console.log(`   ${name}: near=${camera.near.toFixed(2)}, far=${camera.far.toFixed(2)}, ratio=${ratio.toFixed(0)}`);
  };

  console.log('📊 当前多场景管理器相机配置:');
  if (manager.originalLayer) {
    console.log('  原始层:');
    checkCamera('  大坐标场景', manager.originalLayer.largeCoordScene?.camera);
    checkCamera('  小坐标场景', manager.originalLayer.smallCoordScene?.camera);
  }
  if (manager.bimLayer) {
    console.log('  BIM层:');
    checkCamera('  大坐标场景', manager.bimLayer.largeCoordScene?.camera);
    checkCamera('  小坐标场景', manager.bimLayer.smallCoordScene?.camera);
  }
}

/*
╔══════════════════════════════════════════════════════════╗
║  ✅ 禁用动态 near/far 更新完成！                           ║
╚══════════════════════════════════════════════════════════╝

📌 修复内容:
   ✅ 已禁用 updateCameraProjectionForLargeCoord 方法
   ✅ 多场景管理器的固定 near/far 值将保持不变
   ✅ 守护任务已启动

💡 预期效果:
   - 缩放时 near/far 值不再变化
   - 透视保持正常（近大远小）
   - 深度测试正确

📌 可用命令:
   window._originalUpdateCameraProjection() - 调用原始方法（如果需要）
   clearInterval(window._disableDynamicNearFarGuard) - 停止守护
*/
