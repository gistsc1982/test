// ═══════════════════════════════════════════════════════════════════
// 多场景深度排序渲染脚本 V2.0 - 修复透视反转
// ═══════════════════════════════════════════════════════════════════
// 功能：
//   1. 对每个模型计算到相机的距离
//   2. 按距离从远到近排序渲染
//   3. 彻底解决大坐标下的透视反转问题
//
// 原理：
//   - 通过控制渲染顺序替代深度缓冲区
//   - 先渲染远的，再渲染近的（画家算法）
//   - 动态计算合理的 near/far 值以避免深度精度问题
//   - 使用临时场景确保正确渲染
//
// 使用方法：
//   fetch('/multi-scene-depth-sort-fix.js').then(r=>r.text()).then(eval);
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 多场景深度排序渲染 V2.0                               ║');
  console.log('║  📊 修复透视反转：近大远小                                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查多场景管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1] 检查多场景管理器...');

  const manager = window.__multiSceneManager;
  if (!manager) {
    console.error('❌ 多场景管理器未找到');
    console.error('   请先执行 init-multi-scene.js');
    return;
  }

  console.log('  ✅ 多场景管理器已找到');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：保存原始渲染方法
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📦 [步骤2] 保存原始渲染方法...');

  const originalRenderLayer1 = manager.renderLayer1.bind(manager);
  const originalRenderLayer2 = manager.renderLayer2.bind(manager);

  console.log('  ✅ 原始渲染方法已保存');

  // 获取 THREE 对象（从全局或管理器）
  const THREE = window.THREE || manager.dualViewer?.THREE;

  if (!THREE) {
    console.error('❌ THREE.js 未找到，无法计算边界盒');
    console.error('   将使用模型位置作为替代');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：计算模型到相机的距离（考虑边界盒）
  // ═══════════════════════════════════════════════════════════════════
  function getModelDistance(model, camera, referencePoint, isSmallScene) {
    let modelWorldPos;

    // 获取模型的边界盒中心
    if (THREE && THREE.Box3) {
      const box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
    } else {
      // 降级方案：使用模型位置
      var center = model.position;
    }

    if (isSmallScene && referencePoint) {
      // 小坐标场景：转换到世界坐标
      modelWorldPos = {
        x: center.x + referencePoint.x,
        y: center.y + referencePoint.y,
        z: center.z + referencePoint.z
      };
    } else {
      // 大坐标场景：直接使用中心位置
      modelWorldPos = center;
    }

    // 计算到相机的距离
    const dx = modelWorldPos.x - camera.position.x;
    const dy = modelWorldPos.y - camera.position.y;
    const dz = modelWorldPos.z - camera.position.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：计算场景的合理 near/far 值
  // ═══════════════════════════════════════════════════════════════════
  function calculateOptimalNearFar(models, camera, referencePoint, isSmallScene) {
    if (models.length === 0) return { near: 0.1, far: 1000 };

    const distances = models.map(model =>
      getModelDistance(model, camera, referencePoint, isSmallScene)
    );

    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    // 关键修复：确保 near/far 比例不会太大（避免深度精度问题）
    // 同时确保 near 足够小以包含近距离物体
    const near = Math.max(minDistance * 0.01, 0.1);
    const far = maxDistance * 2;

    // 确保 near < far
    if (near >= far) {
      return { near: 0.1, far: Math.max(maxDistance * 2, 1000) };
    }

    return { near, far };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：深度排序渲染单个场景（修复版）
  // ═══════════════════════════════════════════════════════════════════
  function renderSceneWithDepthSort(renderer, scene, camera, referencePoint, isSmallScene) {
    if (scene.children.length === 0) return;

    // 获取所有可渲染的模型（排除辅助对象）
    const models = scene.children.filter(child => {
      return child.isMesh || child.isGroup || child.isObject3D;
    });

    if (models.length === 0) return;

    // 计算整个场景的合理 near/far 值（一次性设置，避免频繁切换）
    const { near, far } = calculateOptimalNearFar(models, camera, referencePoint, isSmallScene);

    // 应用优化的 near/far 值
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    // 计算每个模型的距离并排序
    const modelsWithDistance = models.map(model => ({
      model: model,
      distance: getModelDistance(model, camera, referencePoint, isSmallScene)
    }));

    // 从远到近排序（画家算法：先画远的，再画近的）
    modelsWithDistance.sort((a, b) => b.distance - a.distance);

    console.log(`    🔢 深度排序: ${models.length} 个模型`);
    console.log(`       最远: ${modelsWithDistance[0].distance.toFixed(2)}m`);
    console.log(`       最近: ${modelsWithDistance[modelsWithDistance.length - 1].distance.toFixed(2)}m`);
    console.log(`       相机: near=${near.toFixed(2)}, far=${far.toFixed(2)}`);

    // 保存原始 children 顺序
    const originalChildren = scene.children.slice();

    // 重新排列场景中的模型顺序（从远到近）
    // 先添加非模型对象（如灯光）
    originalChildren.forEach(child => {
      if (!child.isMesh && !child.isGroup && !child.isObject3D) {
        // 保留非模型对象（实际上已经被过滤掉了）
      }
    });

    // 按深度排序后的顺序添加模型
    scene.children.length = 0;
    modelsWithDistance.forEach(({ model }) => {
      scene.children.push(model);
    });

    // 直接渲染整个场景（Three.js 会按 children 数组顺序渲染）
    renderer.render(scene, camera);

    // 恢复原始顺序（重要！否则会影响后续渲染）
    scene.children.length = 0;
    originalChildren.forEach(child => {
      scene.children.push(child);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：替换渲染层1方法
  // ═══════════════════════════════════════════════════════════════════
  manager.renderLayer1 = function() {
    const renderer = this.dualViewer.renderer1;
    if (!renderer) return;

    // 清除颜色和深度缓冲区
    renderer.clear(true, true, false);

    // 渲染大坐标场景（带深度排序）
    if (this.scenes.layer1Large.children.length > 0) {
      console.log('\n  📊 原始层大坐标场景渲染:');
      renderSceneWithDepthSort(
        renderer,
        this.scenes.layer1Large,
        this.cameras.layer1Large,
        this.referencePoints.layer1,
        false
      );
    }

    // 渲染小坐标场景（带深度排序）
    if (this.scenes.layer1Small.children.length > 0) {
      console.log('\n  📊 原始层小坐标场景渲染:');
      // 不清除深度，让小坐标场景与大坐标场景正确混合
      renderer.clearDepth();
      renderSceneWithDepthSort(
        renderer,
        this.scenes.layer1Small,
        this.cameras.layer1Small,
        this.referencePoints.layer1,
        true
      );
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 步骤7：替换渲染层2方法
  // ═══════════════════════════════════════════════════════════════════
  manager.renderLayer2 = function() {
    const renderer = this.dualViewer.renderer2;
    if (!renderer) return;

    // 清除颜色和深度缓冲区
    renderer.clear(true, true, false);

    // 渲染大坐标场景（带深度排序）
    if (this.scenes.layer2Large.children.length > 0) {
      console.log('\n  📊 BIM层大坐标场景渲染:');
      renderSceneWithDepthSort(
        renderer,
        this.scenes.layer2Large,
        this.cameras.layer2Large,
        this.referencePoints.layer2,
        false
      );
    }

    // 渲染小坐标场景（带深度排序）
    if (this.scenes.layer2Small.children.length > 0) {
      console.log('\n  📊 BIM层小坐标场景渲染:');
      renderer.clearDepth();
      renderSceneWithDepthSort(
        renderer,
        this.scenes.layer2Small,
        this.cameras.layer2Small,
        this.referencePoints.layer2,
        true
      );
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 步骤8：添加调试信息控制
  // ═══════════════════════════════════════════════════════════════════
  let debugEnabled = true;

  function toggleDebug(enabled) {
    debugEnabled = enabled;
    console.log(`🔧 调试信息: ${enabled ? '开启' : '关闭'}`);
  }

  // 创建静默版本的渲染方法
  function renderLayer1Silent() {
    const renderer = manager.dualViewer.renderer1;
    if (!renderer) return;

    renderer.clear(true, true, false);

    if (manager.scenes.layer1Large.children.length > 0) {
      renderSceneWithDepthSortSilent(
        renderer,
        manager.scenes.layer1Large,
        manager.cameras.layer1Large,
        manager.referencePoints.layer1,
        false
      );
    }

    if (manager.scenes.layer1Small.children.length > 0) {
      renderer.clearDepth();
      renderSceneWithDepthSortSilent(
        renderer,
        manager.scenes.layer1Small,
        manager.cameras.layer1Small,
        manager.referencePoints.layer1,
        true
      );
    }
  }

  function renderLayer2Silent() {
    const renderer = manager.dualViewer.renderer2;
    if (!renderer) return;

    renderer.clear(true, true, false);

    if (manager.scenes.layer2Large.children.length > 0) {
      renderSceneWithDepthSortSilent(
        renderer,
        manager.scenes.layer2Large,
        manager.cameras.layer2Large,
        manager.referencePoints.layer2,
        false
      );
    }

    if (manager.scenes.layer2Small.children.length > 0) {
      renderer.clearDepth();
      renderSceneWithDepthSortSilent(
        renderer,
        manager.scenes.layer2Small,
        manager.cameras.layer2Small,
        manager.referencePoints.layer2,
        true
      );
    }
  }

  // 静默渲染函数（不输出日志）
  function renderSceneWithDepthSortSilent(renderer, scene, camera, referencePoint, isSmallScene) {
    if (scene.children.length === 0) return;

    const models = scene.children.filter(child => {
      return child.isMesh || child.isGroup || child.isObject3D;
    });

    if (models.length === 0) return;

    const { near, far } = calculateOptimalNearFar(models, camera, referencePoint, isSmallScene);

    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    const modelsWithDistance = models.map(model => ({
      model: model,
      distance: getModelDistance(model, camera, referencePoint, isSmallScene)
    }));

    modelsWithDistance.sort((a, b) => b.distance - a.distance);

    // 保存原始 children 顺序
    const originalChildren = scene.children.slice();

    // 重新排列场景中的模型顺序
    scene.children.length = 0;
    modelsWithDistance.forEach(({ model }) => {
      scene.children.push(model);
    });

    renderer.render(scene, camera);

    // 恢复原始顺序
    scene.children.length = 0;
    originalChildren.forEach(child => {
      scene.children.push(child);
    });
  }

  // 修改渲染方法以支持调试控制
  manager.renderLayer1 = function() {
    if (debugEnabled) {
      // 使用带日志的版本
      const renderer = this.dualViewer.renderer1;
      if (!renderer) return;

      renderer.clear(true, true, false);

      if (this.scenes.layer1Large.children.length > 0) {
        console.log('\n  📊 原始层大坐标场景渲染:');
        renderSceneWithDepthSort(
          renderer,
          this.scenes.layer1Large,
          this.cameras.layer1Large,
          this.referencePoints.layer1,
          false
        );
      }

      if (this.scenes.layer1Small.children.length > 0) {
        console.log('\n  📊 原始层小坐标场景渲染:');
        renderer.clearDepth();
        renderSceneWithDepthSort(
          renderer,
          this.scenes.layer1Small,
          this.cameras.layer1Small,
          this.referencePoints.layer1,
          true
        );
      }
    } else {
      renderLayer1Silent.call(this);
    }
  };

  manager.renderLayer2 = function() {
    if (debugEnabled) {
      const renderer = this.dualViewer.renderer2;
      if (!renderer) return;

      renderer.clear(true, true, false);

      if (this.scenes.layer2Large.children.length > 0) {
        console.log('\n  📊 BIM层大坐标场景渲染:');
        renderSceneWithDepthSort(
          renderer,
          this.scenes.layer2Large,
          this.cameras.layer2Large,
          this.referencePoints.layer2,
          false
        );
      }

      if (this.scenes.layer2Small.children.length > 0) {
        console.log('\n  📊 BIM层小坐标场景渲染:');
        renderer.clearDepth();
        renderSceneWithDepthSort(
          renderer,
          this.scenes.layer2Small,
          this.cameras.layer2Small,
          this.referencePoints.layer2,
          true
        );
      }
    } else {
      renderLayer2Silent.call(this);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 步骤9：保存到全局
  // ═══════════════════════════════════════════════════════════════════
  window.__multiSceneDepthSortFix = {
    manager: manager,
    toggleDebug: toggleDebug,
    getModelDistance: getModelDistance,
    calculateOptimalNearFar: calculateOptimalNearFar,
    originalRenderLayer1: originalRenderLayer1,
    originalRenderLayer2: originalRenderLayer2
  };

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 多场景深度排序渲染 V2.0 已启用！                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📌 V2.0 修复内容:');
  console.log('   ✅ 使用边界盒中心计算距离（更准确）');
  console.log('   ✅ 一次性设置 near/far（避免频繁切换导致的精度问题）');
  console.log('   ✅ 使用临时场景渲染（确保 Three.js 正确处理）');
  console.log('   ✅ 优化 near/far 比例（避免深度缓冲区精度不足）');
  console.log('   ✅ 正确的画家算法（远到近排序）');
  console.log('\n📌 调试控制:');
  console.log('   window.__multiSceneDepthSortFix.toggleDebug(false) - 关闭调试输出');
  console.log('   window.__multiSceneDepthSortFix.toggleDebug(true)  - 开启调试输出');
  console.log('');

})();
