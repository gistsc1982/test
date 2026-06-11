// ═══════════════════════════════════════════════════════════════════
// 一键修复透视反转 - 确保4个场景都实现"近大远小"
// ═══════════════════════════════════════════════════════════════════
// 使用方法：在浏览器控制台直接复制粘贴此脚本执行
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 一键修复透视反转 - 确保"近大远小"                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 检查多场景管理器
  const manager = window.__multiSceneManager;
  if (!manager) {
    console.error('❌ 多场景管理器未初始化');
    console.error('   请先执行多场景管理器初始化脚本');
    return;
  }

  console.log('✅ 多场景管理器已找到\n');

  // ═══════════════════════════════════════════════════════════════════
  // 关键修复1：改变渲染顺序（先小后大 = 先近后远）
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔧 [修复1/4] 改变渲染顺序...');

  // 保存原始渲染函数引用
  const originalRender1 = manager.renderLayer1.bind(manager);
  const originalRender2 = manager.renderLayer2.bind(manager);

  // 重写渲染函数
  manager.renderLayer1 = function() {
    const renderer = this.dualViewer.renderer1;
    if (!renderer) return;

    // 清除颜色和深度缓冲区
    renderer.clear(true, true, false);

    // ✅ 关键：先渲染小坐标场景（近处物体）
    if (this.scenes.layer1Small.children.length > 0) {
      renderer.render(this.scenes.layer1Small, this.cameras.layer1Small);
    }

    // ✅ 再渲染大坐标场景（远处物体）
    if (this.scenes.layer1Large.children.length > 0) {
      renderer.clearDepth();
      renderer.render(this.scenes.layer1Large, this.cameras.layer1Large);
    }
  };

  manager.renderLayer2 = function() {
    const renderer = this.dualViewer.renderer2;
    if (!renderer) return;

    renderer.clear(true, true, false);

    // ✅ 先渲染小坐标场景（近处物体）
    if (this.scenes.layer2Small.children.length > 0) {
      renderer.render(this.scenes.layer2Small, this.cameras.layer2Small);
    }

    // ✅ 再渲染大坐标场景（远处物体）
    if (this.scenes.layer2Large.children.length > 0) {
      renderer.clearDepth();
      renderer.render(this.scenes.layer2Large, this.cameras.layer2Large);
    }
  };

  console.log('  ✅ 渲染顺序已修复');
  console.log('     原始层: 先小坐标(近) → 后大坐标(远)');
  console.log('     BIM层: 先小坐标(近) → 后大坐标(远)');

  // ═══════════════════════════════════════════════════════════════════
  // 关键修复2：增强相机同步，确保投影矩阵正确更新
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [修复2/4] 增强相机同步...');

  const originalSyncCamera = manager.syncCamera.bind(manager);

  manager.syncCamera = function(baseCamera, targetCamera, referencePoint, isLargeScene) {
    // 同步位置
    if (isLargeScene || !referencePoint) {
      targetCamera.position.copy(baseCamera.position);
    } else {
      // 小坐标场景使用相对位置
      const relativePos = baseCamera.position.clone().sub(referencePoint);
      targetCamera.position.copy(relativePos);
    }

    // 同步旋转
    targetCamera.quaternion.copy(baseCamera.quaternion);

    // 同步其他属性
    targetCamera.zoom = baseCamera.zoom;
    targetCamera.aspect = baseCamera.aspect;

    // ✅ 关键：强制更新投影矩阵
    targetCamera.updateProjectionMatrix();

    // ✅ 关键：更新世界矩阵
    targetCamera.updateMatrixWorld();
  };

  console.log('  ✅ 相机同步已增强');
  console.log('     - 添加投影矩阵强制更新');
  console.log('     - 添加世界矩阵更新');

  // 立即同步一次相机
  manager.syncCameras();
  console.log('  ✅ 相机已同步');

  // ═══════════════════════════════════════════════════════════════════
  // 关键修复3：动态调整 near/far 以适应缩放
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [修复3/4] 添加动态 near/far 调整...');

  manager.adjustCameraNearFar = function() {
    const baseCamera = this.dualViewer.camera1;
    if (!baseCamera) return;

    // 计算相机到所有模型的距离
    const distances = [];

    // 遍历所有场景
    ['layer1Large', 'layer1Small', 'layer2Large', 'layer2Small'].forEach(sceneKey => {
      const scene = this.scenes[sceneKey];

      // 确定参考点
      let refPoint = null;
      if (sceneKey === 'layer1Small') refPoint = this.referencePoints.layer1;
      else if (sceneKey === 'layer2Small') refPoint = this.referencePoints.layer2;

      scene.traverse(obj => {
        if (obj.isMesh) {
          // 计算世界坐标位置
          let worldPos = obj.position.clone();
          if (refPoint) {
            worldPos.add(refPoint);
          }
          const dist = baseCamera.position.distanceTo(worldPos);
          distances.push(dist);
        }
      });
    });

    if (distances.length === 0) return;

    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    // 计算合适的 near 和 far
    // near 应该小于最小距离的 10%
    // far 应该大于最大距离的 150%
    const newNear = Math.max(1, minDist * 0.1);
    const newFar = Math.max(newNear * 2, maxDist * 1.5, 1802);
    const clampedFar = Math.min(newFar, 10000); // 限制最大值

    // 更新所有小坐标场景的相机
    this.cameras.layer1Small.near = newNear;
    this.cameras.layer1Small.far = clampedFar;
    this.cameras.layer1Small.updateProjectionMatrix();

    this.cameras.layer2Small.near = newNear;
    this.cameras.layer2Small.far = clampedFar;
    this.cameras.layer2Small.updateProjectionMatrix();
  };

  console.log('  ✅ 动态 near/far 调整已添加');

  // 立即调整一次
  manager.adjustCameraNearFar();
  console.log('  ✅ near/far 已调整');

  // ═══════════════════════════════════════════════════════════════════
  // 关键修复4：启用自动调整
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [修复4/4] 启用自动调整...');

  let adjustTimer = null;

  const onCameraChange = () => {
    if (adjustTimer) return;

    adjustTimer = setTimeout(() => {
      manager.adjustCameraNearFar();
      adjustTimer = null;
    }, 100); // 节流：100ms 内只调整一次
  };

  // 监听控制器变化
  if (manager.dualViewer.controls1) {
    manager.dualViewer.controls1.addEventListener('change', onCameraChange);
    console.log('  ✅ 原始层控制器监听已添加');
  }

  if (manager.dualViewer.controls2) {
    manager.dualViewer.controls2.addEventListener('change', onCameraChange);
    console.log('  ✅ BIM层控制器监听已添加');
  }

  console.log('  ✅ 自动调整已启用');

  // ═══════════════════════════════════════════════════════════════════
  // 修复完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 修复完成！                                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📊 修复摘要:');
  console.log('  ✅ 渲染顺序已修复（先近后远）');
  console.log('  ✅ 相机同步已增强（投影矩阵更新）');
  console.log('  ✅ 动态 near/far 调整已添加');
  console.log('  ✅ 自动调整已启用\n');

  // 显示当前状态
  const info = manager.getDebugInfo();
  console.log('📊 当前状态:');

  console.log('\n  场景模型数量:');
  console.log(`    原始层-大坐标: ${info.scenes.layer1Large} 个`);
  console.log(`    原始层-小坐标: ${info.scenes.layer1Small} 个`);
  console.log(`    BIM层-大坐标: ${info.scenes.layer2Large} 个`);
  console.log(`    BIM层-小坐标: ${info.scenes.layer2Small} 个`);

  console.log('\n  相机 Near/Far:');
  console.log(`    原始层-大: ${info.cameras.layer1Large.near} ~ ${info.cameras.layer1Large.far.toLocaleString()}`);
  console.log(`    原始层-小: ${info.cameras.layer1Small.near} ~ ${info.cameras.layer1Small.far}`);
  console.log(`    BIM层-大: ${info.cameras.layer2Large.near} ~ ${info.cameras.layer2Large.far.toLocaleString()}`);
  console.log(`    BIM层-小: ${info.cameras.layer2Small.near} ~ ${info.cameras.layer2Small.far}`);

  console.log('\n📌 可用命令:');
  console.log('   window.__multiSceneManager.syncCameras()              - 手动同步相机');
  console.log('   window.__multiSceneManager.adjustCameraNearFar()      - 手动调整 near/far');
  console.log('   window.__multiSceneManager.getDebugInfo()            - 查看调试信息\n');

  console.log('🎉 现在应该能看到正确的"近大远小"效果了！');
  console.log('💡 尝试缩放和旋转相机，效果应该始终保持正确。\n');

})();
