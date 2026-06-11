// ═══════════════════════════════════════════════════════════════════
// 完整流程：初始化多场景管理器 + 修复透视反转
// ═══════════════════════════════════════════════════════════════════
// 使用方法：在浏览器控制台直接复制粘贴此脚本执行
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 完整流程：初始化 + 修复透视反转                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查 DualCanvasViewer
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1/7] 检查 DualCanvasViewer...');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 未找到');
    console.error('   请确保页面已加载 DualCanvasViewer');
    console.error('   检查 window.__dualCanvasViewer 是否存在');
    return;
  }

  console.log('  ✅ DualCanvasViewer 已找到');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：显示当前状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤2/7] 当前场景状态...');

  const models1 = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  const models2 = dualViewer.modelGroup2?.children.filter(m => !m.userData.isBox3Helper) || [];

  console.log(`  原始层模型: ${models1.length} 个`);
  console.log(`  BIM层模型: ${models2.length} 个`);

  // 显示模型坐标
  if (models1.length > 0) {
    console.log('\n  原始层模型坐标:');
    models1.slice(0, 3).forEach((model, i) => {
      const pos = model.position;
      const type = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000 ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${type} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：加载多场景管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📦 [步骤3/7] 加载多场景管理器...');

  // 检查是否已加载
  if (typeof window.MultiSceneManager === 'undefined') {
    // 尝试从文件加载
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/multi-scene-manager.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      console.log('  ✅ 多场景管理器已加载');
    } catch (error) {
      console.error('  ❌ 无法从文件加载，尝试内联初始化...');
      // 如果文件加载失败，使用内联版本
      console.log('  ⚠️ 请确保 multi-scene-manager.js 文件在 public 目录下');
      return;
    }
  } else {
    console.log('  ✅ 多场景管理器已存在');
  }

  // 等待一小段时间确保脚本初始化
  await new Promise(resolve => setTimeout(resolve, 500));

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：初始化多场景管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🏗️ [步骤4/7] 初始化多场景架构...');

  let manager;
  try {
    // 检查是否已经初始化过
    if (window.__multiSceneManager) {
      console.log('  ⚠️ 多场景管理器已存在，重新初始化...');
      manager = window.__multiSceneManager;
    } else {
      manager = new window.MultiSceneManager(dualViewer);
    }

    manager.initialize();
    console.log('  ✅ 多场景架构初始化成功');

    // 保存到全局
    window.__multiSceneManager = manager;

  } catch (error) {
    console.error('  ❌ 初始化失败:', error.message);
    console.error('     详情:', error.stack);
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：显示初始化结果
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤5/7] 多场景架构结果...');

  const debugInfo = manager.getDebugInfo();

  console.log('\n  🎬 场景模型分布:');
  console.log(`    原始层-大坐标: ${debugInfo.scenes.layer1Large} 个模型`);
  console.log(`    原始层-小坐标: ${debugInfo.scenes.layer1Small} 个模型`);
  console.log(`    BIM层-大坐标: ${debugInfo.scenes.layer2Large} 个模型`);
  console.log(`    BIM层-小坐标: ${debugInfo.scenes.layer2Small} 个模型`);

  console.log('\n  📷 相机 Near/Far 配置:');
  console.log(`    原始层-大: near=${debugInfo.cameras.layer1Large.near}, far=${debugInfo.cameras.layer1Large.far.toLocaleString()}`);
  console.log(`    原始层-小: near=${debugInfo.cameras.layer1Small.near}, far=${debugInfo.cameras.layer1Small.far}`);
  console.log(`    BIM层-大: near=${debugInfo.cameras.layer2Large.near}, far=${debugInfo.cameras.layer2Large.far.toLocaleString()}`);
  console.log(`    BIM层-小: near=${debugInfo.cameras.layer2Small.near}, far=${debugInfo.cameras.layer2Small.far}`);

  if (debugInfo.referencePoints.layer1) {
    console.log('\n  📍 坐标参考点:');
    console.log(`    原始层: (${debugInfo.referencePoints.layer1.x.toFixed(2)}, ${debugInfo.referencePoints.layer1.y.toFixed(2)}, ${debugInfo.referencePoints.layer1.z.toFixed(2)})`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：修复透视反转
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤6/7] 修复透视反转...');

  // 修复1：改变渲染顺序（最关键！）
  console.log('\n  修复1: 改变渲染顺序...');

  manager.renderLayer1 = function() {
    const renderer = this.dualViewer.renderer1;
    if (!renderer) return;

    renderer.clear(true, true, false);

    // ✅ 先渲染小坐标（近）
    if (this.scenes.layer1Small.children.length > 0) {
      renderer.render(this.scenes.layer1Small, this.cameras.layer1Small);
    }

    // ✅ 再渲染大坐标（远）
    if (this.scenes.layer1Large.children.length > 0) {
      renderer.clearDepth();
      renderer.render(this.scenes.layer1Large, this.cameras.layer1Large);
    }
  };

  manager.renderLayer2 = function() {
    const renderer = this.dualViewer.renderer2;
    if (!renderer) return;

    renderer.clear(true, true, false);

    // ✅ 先渲染小坐标（近）
    if (this.scenes.layer2Small.children.length > 0) {
      renderer.render(this.scenes.layer2Small, this.cameras.layer2Small);
    }

    // ✅ 再渲染大坐标（远）
    if (this.scenes.layer2Large.children.length > 0) {
      renderer.clearDepth();
      renderer.render(this.scenes.layer2Large, this.cameras.layer2Large);
    }
  };

  console.log('    ✅ 渲染顺序已修复: 先小(近) → 后大(远)');

  // 修复2：增强相机同步
  console.log('\n  修复2: 增强相机同步...');

  const originalSync = manager.syncCamera.bind(manager);
  manager.syncCamera = function(baseCamera, targetCamera, referencePoint, isLargeScene) {
    if (isLargeScene || !referencePoint) {
      targetCamera.position.copy(baseCamera.position);
    } else {
      const relativePos = baseCamera.position.clone().sub(referencePoint);
      targetCamera.position.copy(relativePos);
    }

    targetCamera.quaternion.copy(baseCamera.quaternion);
    targetCamera.zoom = baseCamera.zoom;
    targetCamera.aspect = baseCamera.aspect;

    // ✅ 强制更新投影矩阵
    targetCamera.updateProjectionMatrix();
    targetCamera.updateMatrixWorld();
  };

  manager.syncCameras();
  console.log('    ✅ 相机同步已增强');

  // 修复3：添加动态 near/far 调整
  console.log('\n  修复3: 添加动态 near/far 调整...');

  manager.adjustCameraNearFar = function() {
    const baseCamera = this.dualViewer.camera1;
    if (!baseCamera) return;

    const distances = [];

    // 收集所有模型的距离
    ['layer1Large', 'layer1Small', 'layer2Large', 'layer2Small'].forEach(sceneKey => {
      const scene = this.scenes[sceneKey];
      let refPoint = null;
      if (sceneKey === 'layer1Small') refPoint = this.referencePoints.layer1;
      else if (sceneKey === 'layer2Small') refPoint = this.referencePoints.layer2;

      scene.traverse(obj => {
        if (obj.isMesh) {
          let worldPos = obj.position.clone();
          if (refPoint) worldPos.add(refPoint);
          const dist = baseCamera.position.distanceTo(worldPos);
          distances.push(dist);
        }
      });
    });

    if (distances.length === 0) return;

    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    // 动态调整
    const newNear = Math.max(1, minDist * 0.1);
    const newFar = Math.max(newNear * 2, maxDist * 1.5, 1802);
    const clampedFar = Math.min(newFar, 10000);

    this.cameras.layer1Small.near = newNear;
    this.cameras.layer1Small.far = clampedFar;
    this.cameras.layer1Small.updateProjectionMatrix();

    this.cameras.layer2Small.near = newNear;
    this.cameras.layer2Small.far = clampedFar;
    this.cameras.layer2Small.updateProjectionMatrix();
  };

  manager.adjustCameraNearFar();
  console.log('    ✅ 动态 near/far 已调整');

  // 修复4：启用自动调整
  console.log('\n  修复4: 启用自动调整...');

  let adjustTimer = null;
  const onCameraChange = () => {
    if (adjustTimer) return;
    adjustTimer = setTimeout(() => {
      manager.adjustCameraNearFar();
      adjustTimer = null;
    }, 100);
  };

  if (dualViewer.controls1) {
    dualViewer.controls1.addEventListener('change', onCameraChange);
    console.log('    ✅ 原始层自动调整已启用');
  }

  if (dualViewer.controls2) {
    dualViewer.controls2.addEventListener('change', onCameraChange);
    console.log('    ✅ BIM层自动调整已启用');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤7：完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 全部完成！                                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📊 完成摘要:');
  console.log('  ✅ 多场景架构已初始化');
  console.log('  ✅ 渲染顺序已修复（先近后远）');
  console.log('  ✅ 相机同步已增强');
  console.log('  ✅ 动态 near/far 已启用');
  console.log('  ✅ 自动调整已启用\n');

  console.log('📌 可用命令:');
  console.log('   window.__multiSceneManager.getDebugInfo()         - 查看状态');
  console.log('   window.__multiSceneManager.syncCameras()          - 同步相机');
  console.log('   window.__multiSceneManager.adjustCameraNearFar()  - 调整 near/far\n');

  console.log('🎉 现在应该能看到正确的"近大远小"效果！');
  console.log('💡 尝试缩放和旋转相机，效果应该始终保持正确。\n');

})();
