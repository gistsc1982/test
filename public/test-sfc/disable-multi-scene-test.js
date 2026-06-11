// ═══════════════════════════════════════════════════════════════════
// 禁用多场景架构 - 测试单一场景模式
// ═══════════════════════════════════════════════════════════════════
// 目的：禁用多场景架构，恢复到单一场景模式，测试是否是多场景导致的问题

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 禁用多场景架构 - 测试单一场景模式                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 未找到');
    return;
  }

  const manager = dualViewer.multiSceneManager;
  if (!manager) {
    console.error('❌ 多场景管理器未找到');
    return;
  }

  console.log('✅ 找到多场景管理器\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：保存当前状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('💾 [步骤1/4] 保存当前状态...\n');

  // 保存原始渲染函数
  if (!dualViewer._originalRenderLayer1) {
    dualViewer._originalRenderLayer1 = manager.renderLayer1;
  }
  if (!dualViewer._originalRenderLayer2) {
    dualViewer._originalRenderLayer2 = manager.renderLayer2;
  }

  console.log('  ✅ 原始状态已保存');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：将所有模型移回原始场景
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤2/4] 将所有模型移回原始场景...\n');

  // 创建原始场景（如果不存在）
  if (!dualViewer._originalScene1) {
    dualViewer._originalScene1 = dualViewer.scene1 || new THREE.Scene();
  }

  // 统计移动的模型数量
  let movedCount = 0;

  // 将大坐标场景的模型移回
  if (manager.scenes.layer1Large && manager.scenes.layer1Large.children.length > 0) {
    const models = [...manager.scenes.layer1Large.children];
    models.forEach(model => {
      // 恢复原始位置（如果有保存）
      if (model.userData.originalPosition && model.userData.isRelativeCoordinate) {
        model.position.copy(model.userData.originalPosition);
        delete model.userData.isRelativeCoordinate;
      }
      dualViewer._originalScene1.add(model);
      movedCount++;
    });
  }

  // 将小坐标场景的模型移回
  if (manager.scenes.layer1Small && manager.scenes.layer1Small.children.length > 0) {
    const models = [...manager.scenes.layer1Small.children];
    models.forEach(model => {
      // 恢复原始位置
      if (model.userData.originalPosition && model.userData.isRelativeCoordinate) {
        model.position.copy(model.userData.originalPosition);
        delete model.userData.isRelativeCoordinate;
      }
      dualViewer._originalScene1.add(model);
      movedCount++;
    });
  }

  console.log(`  ✅ 已移动 ${movedCount} 个模型回原始场景`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：恢复原始渲染循环
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤3/4] 恢复原始渲染循环...\n');

  // 停止当前的渲染循环
  if (dualViewer.animationFrame1) {
    cancelAnimationFrame(dualViewer.animationFrame1);
  }

  // 创建简单的渲染函数（单一场景模式）
  const simpleRender = () => {
    dualViewer.animationFrame1 = requestAnimationFrame(simpleRender);

    // 更新控制器
    if (dualViewer.controls1) {
      dualViewer.controls1.update();
    }

    // 渲染单一场景
    const renderer = dualViewer.renderer1;
    if (renderer && dualViewer._originalScene1) {
      renderer.clear(true, true, false);
      renderer.render(dualViewer._originalScene1, dualViewer.camera1);
    }
  };

  // 启动简单渲染循环
  simpleRender();

  console.log('  ✅ 原始渲染循环已恢复');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：设置合理的相机参数
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤4/4] 设置相机参数...\n');

  const camera = dualViewer.camera1;

  // 根据相机位置设置合理的 near/far
  const isLargeCoord = Math.abs(camera.position.x) > 10000 || Math.abs(camera.position.z) > 10000;

  if (isLargeCoord) {
    // 大坐标模式
    camera.near = 1;
    camera.far = 50000000;
    console.log('  ✅ 大坐标模式: near=1, far=50000000');
  } else {
    // 小坐标模式
    camera.near = 0.1;
    camera.far = 10000;
    console.log('  ✅ 小坐标模式: near=0.1, far=10000');
  }

  camera.updateProjectionMatrix();

  // 更新控制器
  if (dualViewer.controls1) {
    dualViewer.controls1.update();
  }

  console.log('  ✅ 相机参数已设置');

  // ═══════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 已切换到单一场景模式                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📊 当前状态:');
  console.log('  ✅ 多场景架构已禁用');
  console.log('  ✅ 使用单一场景渲染');
  console.log('  ✅ 所有模型在原始场景中\n');

  console.log('🔍 测试透视:');
  console.log('  1. 近距离观察模型 - 应该看起来较大');
  console.log('  2. 远距离观察模型 - 应该看起来较小');
  console.log('  3. 如果透视仍然反转，则问题不在多场景架构\n');

  console.log('📌 可用命令:');
  console.log('   恢复多场景: window.__restoreMultiScene()');
  console.log('   查看相机: console.log(window.__dualCanvasViewer.camera1)');

  // ═══════════════════════════════════════════════════════════════════
  // 提供恢复函数
  // ═══════════════════════════════════════════════════════════════════
  window.__restoreMultiScene = function() {
    console.log('\n🔄 恢复多场景架构...\n');

    // 停止简单渲染循环
    if (dualViewer.animationFrame1) {
      cancelAnimationFrame(dualViewer.animationFrame1);
    }

    // 恢复原始渲染函数
    manager.renderLayer1 = dualViewer._originalRenderLayer1;
    manager.renderLayer2 = dualViewer._originalRenderLayer2;

    // 重新启动多场景渲染循环
    const animate1 = () => {
      dualViewer.animationFrame1 = requestAnimationFrame(animate1);
      if (dualViewer.controls1) {
        dualViewer.controls1.update();
      }
      manager.syncCameras();
      manager.renderLayer1();
    };

    const animate2 = () => {
      dualViewer.animationFrame2 = requestAnimationFrame(animate2);
      if (dualViewer.controls2) {
        dualViewer.controls2.update();
      }
      manager.renderLayer2();
    };

    animate1();
    animate2();

    console.log('  ✅ 多场景架构已恢复\n');
  };

  console.log('💡 提示: 如果单一场景模式下透视仍然反转，');
  console.log('   则问题可能与以下因素有关：');
  console.log('   1. 模型本身的坐标系');
  console.log('   2. 相机的投影矩阵设置');
  console.log('   3. 渲染器的深度缓冲区配置\n');

})();
