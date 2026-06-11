// ═══════════════════════════════════════════════════════════════════
// 修复版：支持 rendererManager 的多场景架构
// ═══════════════════════════════════════════════════════════════════
// 使用方法：在浏览器控制台直接复制粘贴此脚本执行
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 修复版：支持 rendererManager 的多场景架构            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const CONFIG = {
    LARGE_COORD_THRESHOLD: 10000,
    LARGE_SCENE_NEAR: 0.1,
    LARGE_SCENE_FAR: 15000000,
    SMALL_SCENE_NEAR: 36,
    SMALL_SCENE_FAR: 1802
  };

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查 DualCanvasViewer
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1/7] 检查 DualCanvasViewer...');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 未找到');
    return;
  }

  console.log('  ✅ DualCanvasViewer 已找到');

  // 检测渲染器类型
  const hasRenderer1 = !!dualViewer.renderer1;
  const hasRenderer2 = !!dualViewer.renderer2;
  const hasRendererManager = !!dualViewer.rendererManager;

  console.log(`  📊 渲染器配置:`);
  console.log(`    renderer1: ${hasRenderer1 ? '✅' : '❌'}`);
  console.log(`    renderer2: ${hasRenderer2 ? '✅' : '❌'}`);
  console.log(`    rendererManager: ${hasRendererManager ? '✅ (使用)' : '❌'}`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：停止所有现有渲染循环
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🛑 [步骤2/7] 停止现有渲染循环...');

  if (dualViewer.animationFrame1) {
    cancelAnimationFrame(dualViewer.animationFrame1);
    console.log('  ✅ 已停止 animationFrame1');
  }
  if (dualViewer.animationFrame2) {
    cancelAnimationFrame(dualViewer.animationFrame2);
    console.log('  ✅ 已停止 animationFrame2');
  }

  // 尝试停止 rendererManager 的渲染
  if (dualViewer.rendererManager && dualViewer.rendererManager.rendering) {
    dualViewer.rendererManager.rendering = false;
    console.log('  ✅ 已停止 rendererManager 渲染');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：显示当前状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤3/7] 当前场景状态...');

  const models1 = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  const models2 = dualViewer.modelGroup2?.children.filter(m => !m.userData.isBox3Helper) || [];

  console.log(`  原始层模型: ${models1.length} 个`);
  console.log(`  BIM层模型: ${models2.length} 个`);

  if (models1.length > 0) {
    console.log('\n  原始层模型坐标:');
    models1.slice(0, 3).forEach((model, i) => {
      const pos = model.position;
      const type = Math.abs(pos.x) > CONFIG.LARGE_COORD_THRESHOLD || Math.abs(pos.z) > CONFIG.LARGE_COORD_THRESHOLD ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${type} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：创建多场景架构
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🏗️ [步骤4/7] 创建多场景架构...');

  const originalScene1 = dualViewer.scene1;
  const originalScene2 = dualViewer.scene2;
  const originalCamera1 = dualViewer.camera1;

  // 创建4个新场景
  const scenes = {
    layer1Large: new THREE.Scene(),
    layer1Small: new THREE.Scene(),
    layer2Large: new THREE.Scene(),
    layer2Small: new THREE.Scene()
  };

  // 复制场景属性
  if (originalScene1.background) {
    scenes.layer1Large.background = originalScene1.background;
    scenes.layer1Small.background = originalScene1.background;
  }
  if (originalScene2.background) {
    scenes.layer2Large.background = originalScene2.background;
    scenes.layer2Small.background = originalScene2.background;
  }

  // 创建4个新相机
  const fov = originalCamera1.fov * (180 / Math.PI);
  const aspect = originalCamera1.aspect;

  const cameras = {
    layer1Large: new THREE.PerspectiveCamera(fov, aspect, CONFIG.LARGE_SCENE_NEAR, CONFIG.LARGE_SCENE_FAR),
    layer1Small: new THREE.PerspectiveCamera(fov, aspect, CONFIG.SMALL_SCENE_NEAR, CONFIG.SMALL_SCENE_FAR),
    layer2Large: new THREE.PerspectiveCamera(fov, aspect, CONFIG.LARGE_SCENE_NEAR, CONFIG.LARGE_SCENE_FAR),
    layer2Small: new THREE.PerspectiveCamera(fov, aspect, CONFIG.SMALL_SCENE_NEAR, CONFIG.SMALL_SCENE_FAR)
  };

  console.log('  ✅ 4个场景和4个相机已创建');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：分类并移动模型
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤5/7] 分类并移动模型...');

  const referencePoints = { layer1: null, layer2: null };

  // 处理原始层模型
  const layer1LargeModels = [];
  const layer1SmallModels = [];

  models1.forEach(model => {
    const pos = model.position;
    const isLarge = Math.abs(pos.x) > CONFIG.LARGE_COORD_THRESHOLD ||
                   Math.abs(pos.z) > CONFIG.LARGE_COORD_THRESHOLD;
    if (isLarge) {
      layer1LargeModels.push(model);
    } else {
      layer1SmallModels.push(model);
    }
  });

  if (layer1LargeModels.length > 0) {
    referencePoints.layer1 = layer1LargeModels[0].position.clone();
    console.log(`  📍 原始层参考点: (${referencePoints.layer1.x.toFixed(2)}, ${referencePoints.layer1.y.toFixed(2)}, ${referencePoints.layer1.z.toFixed(2)})`);

    layer1LargeModels.forEach(model => {
      scenes.layer1Large.add(model);
    });

    layer1SmallModels.forEach(model => {
      const relativePos = model.position.clone().sub(referencePoints.layer1);
      model.position.copy(relativePos);
      scenes.layer1Small.add(model);
    });
  } else {
    layer1SmallModels.forEach(model => {
      scenes.layer1Small.add(model);
    });
  }

  // 处理BIM层模型
  const layer2LargeModels = [];
  const layer2SmallModels = [];

  models2.forEach(model => {
    const pos = model.position;
    const isLarge = Math.abs(pos.x) > CONFIG.LARGE_COORD_THRESHOLD ||
                   Math.abs(pos.z) > CONFIG.LARGE_COORD_THRESHOLD;
    if (isLarge) {
      layer2LargeModels.push(model);
    } else {
      layer2SmallModels.push(model);
    }
  });

  if (layer2LargeModels.length > 0) {
    referencePoints.layer2 = layer2LargeModels[0].position.clone();
    console.log(`  📍 BIM层参考点: (${referencePoints.layer2.x.toFixed(2)}, ${referencePoints.layer2.y.toFixed(2)}, ${referencePoints.layer2.z.toFixed(2)})`);

    layer2LargeModels.forEach(model => {
      scenes.layer2Large.add(model);
    });

    layer2SmallModels.forEach(model => {
      const relativePos = model.position.clone().sub(referencePoints.layer2);
      model.position.copy(relativePos);
      scenes.layer2Small.add(model);
    });
  } else {
    layer2SmallModels.forEach(model => {
      scenes.layer2Small.add(model);
    });
  }

  // 清空原始模型组
  if (dualViewer.modelGroup1) dualViewer.modelGroup1.clear();
  if (dualViewer.modelGroup2) dualViewer.modelGroup2.clear();

  console.log(`  ✅ 模型已分类并移动`);
  console.log(`    原始层-大: ${layer1LargeModels.length} 个`);
  console.log(`    原始层-小: ${layer1SmallModels.length} 个`);
  console.log(`    BIM层-大: ${layer2LargeModels.length} 个`);
  console.log(`    BIM层-小: ${layer2SmallModels.length} 个`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：创建管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎨 [步骤6/7] 创建管理器和渲染逻辑...');

  const manager = {
    dualViewer: dualViewer,
    scenes: scenes,
    cameras: cameras,
    referencePoints: referencePoints,
    isRendering: false,

    // 渲染原始层
    renderLayer1: function() {
      // 如果使用 rendererManager，让它处理
      if (this.dualViewer.rendererManager) {
        // rendererManager 会自动渲染，我们只需要确保场景正确
        return;
      }

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
    },

    // 渲染BIM层
    renderLayer2: function() {
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
    },

    // 同步相机
    syncCameras: function() {
      const baseCamera = this.dualViewer.camera1 || this.cameras.layer1Large;

      this.syncCamera(baseCamera, this.cameras.layer1Large, this.referencePoints.layer1, true);
      this.syncCamera(baseCamera, this.cameras.layer1Small, this.referencePoints.layer1, false);
      this.syncCamera(baseCamera, this.cameras.layer2Large, this.referencePoints.layer2, true);
      this.syncCamera(baseCamera, this.cameras.layer2Small, this.referencePoints.layer2, false);
    },

    // 同步单个相机
    syncCamera: function(baseCamera, targetCamera, referencePoint, isLargeScene) {
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
    },

    // 动态调整 near/far
    adjustCameraNearFar: function() {
      const baseCamera = this.dualViewer.camera1;
      if (!baseCamera) return;

      const distances = [];

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

      const newNear = Math.max(1, minDist * 0.1);
      const newFar = Math.max(newNear * 2, maxDist * 1.5, 1802);
      const clampedFar = Math.min(newFar, 10000);

      this.cameras.layer1Small.near = newNear;
      this.cameras.layer1Small.far = clampedFar;
      this.cameras.layer1Small.updateProjectionMatrix();

      this.cameras.layer2Small.near = newNear;
      this.cameras.layer2Small.far = clampedFar;
      this.cameras.layer2Small.updateProjectionMatrix();
    },

    // 获取调试信息
    getDebugInfo: function() {
      return {
        scenes: {
          layer1Large: this.scenes.layer1Large.children.length,
          layer1Small: this.scenes.layer1Small.children.length,
          layer2Large: this.scenes.layer2Large.children.length,
          layer2Small: this.scenes.layer2Small.children.length
        },
        cameras: {
          layer1Large: { near: this.cameras.layer1Large.near, far: this.cameras.layer1Large.far },
          layer1Small: { near: this.cameras.layer1Small.near, far: this.cameras.layer1Small.far },
          layer2Large: { near: this.cameras.layer2Large.near, far: this.cameras.layer2Large.far },
          layer2Small: { near: this.cameras.layer2Small.near, far: this.cameras.layer2Small.far }
        },
        referencePoints: this.referencePoints
      };
    }
  };

  console.log('  ✅ 管理器已创建');

  // 设置渲染器
  if (dualViewer.renderer1) {
    dualViewer.renderer1.autoClear = false;
  }
  if (dualViewer.renderer2) {
    dualViewer.renderer2.autoClear = false;
  }

  // 同步相机
  manager.syncCameras();
  manager.adjustCameraNearFar();

  // 启用自动调整
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
  }
  if (dualViewer.controls2) {
    dualViewer.controls2.addEventListener('change', onCameraChange);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤7：处理 rendererManager
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎮 [步骤7/7] 处理 rendererManager...');

  if (dualViewer.rendererManager) {
    console.log('  ⚠️ 检测到 rendererManager');
    console.log('  📝 rendererManager 使用共享渲染器');
    console.log('  💡 对于 rendererManager，我们需要特殊处理...');

    // rendererManager 场景下，我们需要修改主场景
    // 将大坐标模型放回主场景，但使用相对坐标

    console.log('\n  🔧 使用简化的相对坐标方案...');

    // 将所有大坐标模型转换为相对坐标并放回原场景
    const refPoint = referencePoints.layer1;
    if (refPoint) {
      console.log(`    参考点: (${refPoint.x.toFixed(2)}, ${refPoint.y.toFixed(2)}, ${refPoint.z.toFixed(2)})`);

      // 移动相机到相对坐标
      const cameraOffset = dualViewer.camera1.position.clone().sub(refPoint);
      const targetOffset = dualViewer.controls1.target.clone().sub(refPoint);

      dualViewer.camera1.position.copy(cameraOffset);
      dualViewer.controls1.target.copy(targetOffset);
      dualViewer.camera1.updateMatrixWorld();

      // 将模型移回原场景（相对坐标）
      scenes.layer1Large.children.forEach(model => {
        const relativePos = model.position.clone().sub(refPoint);
        model.position.copy(relativePos);
        originalScene1.add(model);
      });

      scenes.layer1Small.children.forEach(model => {
        originalScene1.add(model);
      });

      if (scenes.layer2Large.children.length > 0) {
        scenes.layer2Large.children.forEach(model => {
          const relativePos = model.position.clone().sub(referencePoints.layer2);
          model.position.copy(relativePos);
          originalScene2.add(model);
        });
      }

      scenes.layer2Small.children.forEach(model => {
        originalScene2.add(model);
      });

      console.log('    ✅ 模型已转换为相对坐标');
      console.log('    ✅ 相机已移动到相对坐标系');
      console.log('    ✅ rendererManager 将正常渲染');
    }
  } else {
    // 不使用 rendererManager，启动新的渲染循环
    console.log('  ✅ 启动新的渲染循环...');

    const animate1 = () => {
      dualViewer.animationFrame1 = requestAnimationFrame(animate1);
      if (dualViewer.controls1) dualViewer.controls1.update();
      manager.syncCameras();
      manager.renderLayer1();
    };

    const animate2 = () => {
      dualViewer.animationFrame2 = requestAnimationFrame(animate2);
      if (dualViewer.controls2) dualViewer.controls2.update();
      manager.renderLayer2();
    };

    animate1();
    animate2();
  }

  // 保存到全局
  window.__multiSceneManager = manager;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 全部完成！                                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const debugInfo = manager.getDebugInfo();

  console.log('📊 完成摘要:');
  console.log('  ✅ 多场景架构已创建');
  console.log('  ✅ 模型已分类并处理');
  console.log('  ✅ 相机已同步');
  console.log('  ✅ rendererManager 已处理\n');

  console.log('📊 当前状态:');
  console.log(`  原始层-大坐标: ${debugInfo.scenes.layer1Large} 个模型`);
  console.log(`  原始层-小坐标: ${debugInfo.scenes.layer1Small} 个模型`);
  console.log(`  BIM层-大坐标: ${debugInfo.scenes.layer2Large} 个模型`);
  console.log(`  BIM层-小坐标: ${debugInfo.scenes.layer2Small} 个模型\n`);

  console.log('🎉 应该能看到正确的渲染效果！');
  console.log('💡 如果仍然有透视问题，尝试缩放或旋转相机。\n');

})();
