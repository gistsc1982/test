// ═══════════════════════════════════════════════════════════════════
// 强力修复脚本 - 直接修复所有问题
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 强力修复脚本 - 直接修复所有问题                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 未找到');
    return;
  }

  const cesiumViewer = window.__cesiumViewer__;
  const Cesium = window.Cesium;
  const THREE = window.THREE || dualViewer.THREE;

  // ═══════════════════════════════════════════════════════════════════
  // 1. 修复骨骼动画
  // ═══════════════════════════════════════════════════════════════════
  console.log('🎬 [1/5] 修复骨骼动画...');

  let skinnedMeshCount = 0;
  let mixerCount = 0;

  const processAnimation = (obj) => {
    if (obj.isSkinnedMesh && obj.skeleton) {
      obj.skeleton.bones.forEach(bone => {
        bone.matrixAutoUpdate = true;
        bone.updateMatrixWorld(true);
      });
      if (!obj.bindMatrix) obj.bindMatrix = obj.matrixWorld.clone();
      if (!obj.bindMatrixInverse) {
        obj.bindMatrixInverse = new THREE.Matrix4().getInverse(obj.bindMatrix);
      }
      skinnedMeshCount++;
    }

    if (obj.userData && obj.userData.animationMixer) {
      const mixer = obj.userData.animationMixer;
      if (mixer.timeScale === 0) mixer.timeScale = 1;
      if (obj.userData.actions && obj.userData.actions.length > 0) {
        obj.userData.actions.forEach(action => {
          if (!action.isRunning && action.enabled) {
            action.play();
          }
        });
      }
      mixerCount++;
    }
  };

  if (dualViewer.modelGroup1) dualViewer.modelGroup1.traverse(processAnimation);
  if (dualViewer.modelGroup2) dualViewer.modelGroup2.traverse(processAnimation);

  console.log(`  ✅ 骨骼动画: ${skinnedMeshCount} 个`);
  console.log(`  ✅ 动画混合器: ${mixerCount} 个`);

  // ═══════════════════════════════════════════════════════════════════
  // 2. 设置渲染顺序
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎨 [2/5] 设置渲染顺序...');

  const modelTypes = {
    animation: { order: 10, keywords: ['catwalk', 'anim', 'walk'] },
    bim: { order: 5, keywords: ['.xkt', '.bim', 'ground_floor', '19_rue'] },
    glb: { order: 2, keywords: ['.glb', '.gltf'] },
    other: { order: 1, keywords: [] }
  };

  const classifyAndSetOrder = (model) => {
    if (model.userData.isBox3Helper) return;

    const name = (
      model.userData.fileName ||
      model.userData.filePath ||
      model.userData.name ||
      model.name ||
      ''
    ).toLowerCase();

    let order = 1;
    for (const [type, data] of Object.entries(modelTypes)) {
      if (data.keywords.some(keyword => name.includes(keyword))) {
        order = data.order;
        break;
      }
    }

    model.renderOrder = order;
    model.traverse(child => {
      if (child.isMesh) {
        child.renderOrder = order;
        // 确保深度测试开启
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              m.depthTest = true;
              m.depthWrite = true;
            });
          } else {
            child.material.depthTest = true;
            child.material.depthWrite = true;
          }
        }
      }
    });
  };

  if (dualViewer.modelGroup1) dualViewer.modelGroup1.children.forEach(classifyAndSetOrder);
  if (dualViewer.modelGroup2) dualViewer.modelGroup2.children.forEach(classifyAndSetOrder);

  console.log(`  ✅ 渲染顺序已设置`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. 强力修复透视 - 使用源代码方法
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [3/5] 修复透视反转...');

  if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
    // 调用多次确保生效
    dualViewer.updateCameraProjectionForLargeCoord();
    await new Promise(resolve => setTimeout(resolve, 50));
    dualViewer.updateCameraProjectionForLargeCoord();
    await new Promise(resolve => setTimeout(resolve, 50));
    dualViewer.updateCameraProjectionForLargeCoord();

    console.log(`  ✅ 已调用 updateCameraProjectionForLargeCoord`);
    console.log(`     near: ${dualViewer.camera1.near.toFixed(2)}`);
    console.log(`     far: ${dualViewer.camera1.far.toFixed(2)}`);
    console.log(`     ratio: ${(dualViewer.camera1.far / dualViewer.camera1.near).toFixed(0)}`);
  } else {
    console.warn('  ⚠️ updateCameraProjectionForLargeCoord 方法未找到');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. 强力覆盖定位函数
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎯 [4/5] 覆盖定位函数...');

  // 保存原始函数
  const originalFocusOnSingleModel = dualViewer.focusOnSingleModel;

  // 创建新的定位函数
  dualViewer.focusOnSingleModel = function(modelId, modelName) {
    console.log(`\n🎯 [强力定位] ${modelName || modelId}`);

    // 直接调用原始函数，但确保后续修复
    const result = originalFocusOnSingleModel.call(this, modelId, modelName);

    // 延迟修复透视
    setTimeout(() => {
      if (typeof this.updateCameraProjectionForLargeCoord === 'function') {
        this.updateCameraProjectionForLargeCoord();
        console.log('  ✅ 透视已修复');
      }
    }, 100);

    return result;
  };

  // 同时设置到全局
  window.__safeFocusOnModel = function(modelIdentifier) {
    console.log(`\n🎯 [全局定位] ${modelIdentifier}`);

    // 查找模型
    let targetModel = null;

    [dualViewer.modelGroup1, dualViewer.modelGroup2].forEach((group, index) => {
      if (!group || targetModel) return;

      const model = group.children.find(m =>
        !m.userData.isBox3Helper &&
        (m.userData?.fileName?.toLowerCase().includes(modelIdentifier.toLowerCase()) ||
         m.userData?.filePath?.toLowerCase().includes(modelIdentifier.toLowerCase()) ||
         m.userData?.name?.toLowerCase().includes(modelIdentifier.toLowerCase()) ||
         m.name?.toLowerCase().includes(modelIdentifier.toLowerCase()))
      );

      if (model) targetModel = model;
    });

    if (!targetModel) {
      console.error(`❌ 未找到模型: ${modelIdentifier}`);
      return false;
    }

    console.log(`  ✅ 找到模型: ${targetModel.userData?.fileName || targetModel.name}`);

    // 获取包围盒
    let boundingBox = targetModel.userData?.boundingBox;
    if (!boundingBox || boundingBox.isEmpty()) {
      targetModel.updateMatrixWorld();
      boundingBox = new THREE.Box3().setFromObject(targetModel);
      targetModel.userData.boundingBox = boundingBox;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    console.log(`  中心: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);

    // 计算相机位置
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(maxDim * 2, 50);
    const cameraHeight = distance * 0.7;
    const cameraPos = new THREE.Vector3(center.x, center.y + cameraHeight, center.z + distance);

    // 设置相机
    dualViewer.controls1.enabled = false;
    dualViewer.controls2.enabled = false;

    dualViewer.camera1.position.copy(cameraPos);
    dualViewer.camera1.lookAt(center);
    dualViewer.camera1.updateMatrixWorld();
    dualViewer.controls1.target.copy(center);

    dualViewer.camera2.position.copy(cameraPos);
    dualViewer.camera2.lookAt(center);
    dualViewer.camera2.updateMatrixWorld();
    dualViewer.controls2.target.copy(center);

    dualViewer.controls1.enabled = true;
    dualViewer.controls2.enabled = true;

    dualViewer.controls1.update();
    dualViewer.controls2.update();

    // 修复透视
    if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
      dualViewer.updateCameraProjectionForLargeCoord();
    }

    console.log('  ✅ 定位完成');
    return true;
  };

  console.log('  ✅ 定位函数已覆盖');

  // ═══════════════════════════════════════════════════════════════════
  // 5. 设置自动透视修复
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [5/5] 设置自动透视修复...');

  if (dualViewer.controls1) {
    dualViewer.controls1.addEventListener('change', () => {
      if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
        dualViewer.updateCameraProjectionForLargeCoord();
      }
    });
    console.log('  ✅ 已在 controls1 上添加自动修复');
  }

  if (dualViewer.controls2) {
    dualViewer.controls2.addEventListener('change', () => {
      if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
        dualViewer.updateCameraProjectionForLargeCoord();
      }
    });
    console.log('  ✅ 已在 controls2 上添加自动修复');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 辅助函数
  // ═══════════════════════════════════════════════════════════════════
  window.__fixPerspectiveNow = function() {
    if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
      dualViewer.updateCameraProjectionForLargeCoord();
      console.log('✅ 透视已修复');
      console.log(`  near: ${dualViewer.camera1.near.toFixed(2)}`);
      console.log(`  far: ${dualViewer.camera1.far.toFixed(2)}`);
      console.log(`  ratio: ${(dualViewer.camera1.far / dualViewer.camera1.near).toFixed(0)}`);
    }
  };

  // Cesium 安全高度
  window.__fixCesiumHeight = function() {
    if (!cesiumViewer || !Cesium) return;
    const camera = cesiumViewer.camera;
    const pos = camera.positionCartographic;

    if (pos.height < 500) {
      camera.position = Cesium.Cartesian3.fromRadians(
        pos.longitude,
        pos.latitude,
        500
      );
      if (camera.pitch > 0) {
        camera.pitch = -Cesium.Math.PI_OVER_FOUR;
      }
      console.log('✅ Cesium 高度已修复');
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 全部完成！                                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📊 修复摘要:');
  console.log(`  ✅ 骨骼动画: ${skinnedMeshCount} 个`);
  console.log(`  ✅ 动画混合器: ${mixerCount} 个`);
  console.log(`  ✅ 渲染顺序: 已设置`);
  console.log(`  ✅ 透视修复: 已启用（自动）`);
  console.log(`  ✅ 定位功能: 已覆盖\n`);

  console.log('💡 使用方法:');
  console.log('  dualViewer.focusOnSingleModel(modelId, modelName)  // 使用原始定位 + 自动修复');
  console.log('  window.__safeFocusOnModel("Catwalk")            // 使用全局定位');
  console.log('  window.__fixPerspectiveNow()                    // 手动修复透视');
  console.log('  window.__fixCesiumHeight()                      // 修复 Cesium 高度\n');

  console.log('🎉 测试:');
  console.log('  1. 定位 BIM 模型');
  console.log('  2. 定位 CatWalk04');
  console.log('  3. 验证透视是否正常（近大远小）\n');

  // 初始修复
  window.__fixCesiumHeight();

})();
