// ═══════════════════════════════════════════════════════════════════
// 完整组合修复 V2.0：骨骼动画 + 深度排序 + 安全定位 + 透视修复
// 防止：相机到地下 + Cesium 蓝屏 + 俯仰角异常 + BIM 大坐标问题 + 透视反转
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 完整组合修复 V2.0                                      ║');
  console.log('║  ✨ 骨骼动画 + 深度排序 + 安全定位 + 透视修复               ║');
  console.log('║  🛡️ 防止相机到地下、Cesium 蓝屏、俯仰角异常、透视反转        ║');
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
  // 检测当前坐标模式
  // ═══════════════════════════════════════════════════════════════════
  const camera1 = dualViewer.camera1;
  const isLargeCoordMode = camera1 &&
    (Math.abs(camera1.position.x) > 10000 || Math.abs(camera1.position.z) > 10000);

  console.log('📍 [步骤1/6] 检测坐标模式...');
  console.log(`  相机位置: (${camera1.position.x.toFixed(2)}, ${camera1.position.y.toFixed(2)}, ${camera1.position.z.toFixed(2)})`);
  console.log(`  坐标模式: ${isLargeCoordMode ? '🌍 大坐标模式' : '📐 相对坐标模式'}`);

  // ═══════════════════════════════════════════════════════════════════
  // Cesium 安全高度管理器
  // ═══════════════════════════════════════════════════════════════════
  const CesiumHeightManager = {
    MIN_SAFE_HEIGHT: 500,
    RECOMMENDED_HEIGHT: 1000,

    ensureSafeHeight: function() {
      if (!cesiumViewer || !Cesium) return;
      const camera = cesiumViewer.camera;
      const pos = camera.positionCartographic;

      if (pos.height < this.MIN_SAFE_HEIGHT) {
        console.log(`[Cesium] 高度不足 (${pos.height.toFixed(2)}m -> ${this.MIN_SAFE_HEIGHT}m)`);
        camera.position = Cesium.Cartesian3.fromRadians(
          pos.longitude,
          pos.latitude,
          this.MIN_SAFE_HEIGHT
        );
        if (camera.pitch > 0) {
          camera.pitch = -Cesium.Math.PI_OVER_FOUR;
        }
      }
    },

    getSafeCesiumHeight: function(modelCenterY) {
      if (modelCenterY < 0) return this.RECOMMENDED_HEIGHT;
      return Math.max(this.MIN_SAFE_HEIGHT, modelCenterY + 200);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 透视反转修复器 - 使用激进的 near/far 比例
  // ═══════════════════════════════════════════════════════════════════
  function fixPerspectiveInversion(camera, targetPoint) {
    const distance = camera.position.distanceTo(targetPoint);

    // ⚠️ 激进优化：使用极小的 far/near 比例（约 50:1）
    // 这确保深度精度正确，避免透视反转（远大近小 -> 近大远小）
    const near = Math.max(5.0, distance * 0.2);  // 距离的 20%，最小 5.0
    const far = distance * 10;                     // 距离的 10 倍

    // 只在值显著变化时才更新
    if (Math.abs(camera.near - near) > 0.1 || Math.abs(camera.far - far) > 1.0) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();

      console.log(`  🔧 透视修复: near=${near.toFixed(2)}, far=${far.toFixed(2)}, ratio=${(far/near).toFixed(0)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：修复骨骼动画
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎬 [步骤2/6] 修复骨骼动画...');

  let skinnedMeshCount = 0;
  let mixerCount = 0;

  const processAnimation = (obj) => {
    if (obj.isSkinnedMesh && obj.skeleton) {
      console.log(`  ✅ 骨骼动画: ${obj.name || obj.parent?.name || '(未命名)'}`);
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
      console.log(`  ✅ 动画混合器: ${obj.name || '(未命名)'}`);
      const mixer = obj.userData.animationMixer;
      if (mixer.timeScale === 0) mixer.timeScale = 1;
      if (obj.userData.actions && obj.userData.actions.length > 0) {
        obj.userData.actions.forEach(action => {
          if (!action.isRunning && action.enabled) {
            action.play();
            console.log(`    ▶️ 播放动画: ${action._clip.name}`);
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
  // 步骤3：设置渲染顺序
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎨 [步骤3/6] 设置渲染顺序...');

  let renderOrderSet = 0;
  const modelTypes = {
    animation: { models: [], order: 10, keywords: ['catwalk', 'anim', 'walk'] },
    bim: { models: [], order: 5, keywords: ['.xkt', '.bim', 'ground_floor', '19_rue'] },
    glb: { models: [], order: 2, keywords: ['.glb', '.gltf'] },
    other: { models: [], order: 1, keywords: [] }
  };

  const classifyModel = (model) => {
    if (model.userData.isBox3Helper) return;

    const name = (
      model.userData.fileName ||
      model.userData.filePath ||
      model.userData.name ||
      model.name ||
      ''
    ).toLowerCase();

    let type = 'other';

    for (const [typeKey, data] of Object.entries(modelTypes)) {
      if (typeKey === 'other') continue;
      if (data.keywords.some(keyword => name.includes(keyword))) {
        type = typeKey;
        break;
      }
    }

    modelTypes[type].models.push({
      model,
      name: model.userData.fileName || model.userData.name || model.name || '(未命名)'
    });
  };

  if (dualViewer.modelGroup1) dualViewer.modelGroup1.children.forEach(classifyModel);
  if (dualViewer.modelGroup2) dualViewer.modelGroup2.children.forEach(classifyModel);

  Object.entries(modelTypes).forEach(([type, data]) => {
    if (data.models.length === 0) return;
    const typeLabels = { animation: '动画', bim: 'BIM', glb: 'GLB', other: '其他' };
    data.models.forEach(({ model, name }) => {
      model.renderOrder = data.order;
      model.traverse(child => {
        if (child.isMesh) child.renderOrder = data.order;
      });
      renderOrderSet++;
    });
  });

  console.log(`  ✅ 已设置 ${renderOrderSet} 个模型的渲染顺序`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：增强的安全定位函数
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🎯 [步骤4/6] 创建安全定位功能...');

  function safeFocusOnModel(modelIdentifier) {
    console.log(`\n🎯 [安全定位] ${modelIdentifier}`);
    console.log(`   当前模式: ${isLargeCoordMode ? '大坐标' : '相对坐标'}`);

    // 查找模型
    let targetModel = null;
    let foundIn = '';

    const searchInGroup = (group, groupName) => {
      if (!group) return false;

      for (const model of group.children) {
        if (model.userData.isBox3Helper) continue;

        const fileName = (model.userData?.fileName || '').toLowerCase();
        const filePath = (model.userData?.filePath || '').toLowerCase();
        const userDataName = (model.userData?.name || '').toLowerCase();
        const modelName = (model.name || '').toLowerCase();
        const id = model.userData?.id || '';

        const searchLower = modelIdentifier.toLowerCase();

        const matches =
          fileName.includes(searchLower) ||
          filePath.includes(searchLower) ||
          userDataName === searchLower ||
          modelName.includes(searchLower) ||
          id === modelIdentifier;

        if (matches) {
          targetModel = model;
          foundIn = groupName;
          console.log(`  ✅ 在 ${groupName} 找到: ${model.userData?.fileName || model.name}`);
          return true;
        }
      }
      return false;
    };

    searchInGroup(dualViewer.modelGroup1, '原始层') ||
    searchInGroup(dualViewer.modelGroup2, 'BIM层');

    if (!targetModel) {
      console.error(`❌ 未找到模型: ${modelIdentifier}`);
      console.log('   可用模型:');
      [dualViewer.modelGroup1, dualViewer.modelGroup2].forEach((group, idx) => {
        if (!group) return;
        const groupName = idx === 0 ? '原始层' : 'BIM层';
        group.children.forEach(m => {
          if (!m.userData.isBox3Helper) {
            console.log(`     [${groupName}] ${m.userData?.fileName || m.name || '(未命名)'}`);
          }
        });
      });
      return false;
    }

    // 获取包围盒 - 特别处理大坐标
    let boundingBox = null;
    let center = new THREE.Vector3();
    let size = new THREE.Vector3();

    // 尝试使用预计算的包围盒
    if (targetModel.userData?.boundingBox && !targetModel.userData.boundingBox.isEmpty()) {
      const box = targetModel.userData.boundingBox;
      box.getCenter(center);

      if (Math.abs(center.x) > 10000 || Math.abs(center.z) > 10000) {
        if (isLargeCoordMode) {
          console.log('  📦 使用预计算的大坐标包围盒');
          boundingBox = box;
        } else {
          console.log('  ⚠️ 包围盒是大坐标，但在相对坐标模式');
          console.log('     使用模型当前位置');
          center.copy(targetModel.position);
          boundingBox = new THREE.Box3();
          boundingBox.min.set(center.x - 10, center.y - 10, center.z - 10);
          boundingBox.max.set(center.x + 10, center.y + 10, center.z + 10);
        }
      } else {
        console.log('  📦 使用预计算的包围盒');
        boundingBox = box;
      }
    }

    // 如果没有有效包围盒，计算新的
    if (!boundingBox) {
      console.log('  📏 计算新的包围盒...');
      targetModel.updateMatrixWorld();

      try {
        const calcBox = new THREE.Box3().setFromObject(targetModel);
        calcBox.getCenter(center);

        if (Math.abs(center.x) > 10000 || Math.abs(center.z) > 10000) {
          if (isLargeCoordMode) {
            console.log('  ✅ 计算得到大坐标包围盒');
            boundingBox = calcBox;
          } else {
            console.log('  ⚠️ 计算得到大坐标，但当前是相对坐标模式');
            center.copy(targetModel.position);
            boundingBox = new THREE.Box3();
            boundingBox.min.set(center.x - 10, center.y - 10, center.z - 10);
            boundingBox.max.set(center.x + 10, center.y + 10, center.z + 10);
          }
        } else {
          console.log('  ✅ 计算得到相对坐标包围盒');
          boundingBox = calcBox;
        }
      } catch (e) {
        console.error('  ❌ 计算包围盒失败:', e.message);
        center.copy(targetModel.position);
        boundingBox = new THREE.Box3();
        boundingBox.min.set(center.x - 10, center.y - 10, center.z - 10);
        boundingBox.max.set(center.x + 10, center.y + 10, center.z + 10);
      }
    }

    targetModel.userData.boundingBox = boundingBox;
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    console.log(`  中心: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
    console.log(`  大小: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);

    // 计算相机位置
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(maxDim * 2, 50);

    let cameraHeight = distance * 0.7;
    let finalCameraY = center.y + cameraHeight;

    // 仅在相对坐标模式下确保最小高度
    if (!isLargeCoordMode) {
      finalCameraY = Math.max(finalCameraY, 50);
    }

    const cameraPos = new THREE.Vector3(
      center.x,
      finalCameraY,
      center.z + distance
    );

    console.log(`\n📷 相机位置:`);
    console.log(`  位置: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`);
    console.log(`  目标: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);

    // 禁用控制器
    dualViewer.controls1.enabled = false;
    dualViewer.controls2.enabled = false;

    // 设置 camera1
    dualViewer.camera1.position.copy(cameraPos);
    dualViewer.camera1.lookAt(center);
    dualViewer.camera1.updateMatrixWorld();
    dualViewer.controls1.target.copy(center);

    // 设置 camera2
    dualViewer.camera2.position.copy(cameraPos);
    dualViewer.camera2.lookAt(center);
    dualViewer.camera2.updateMatrixWorld();
    dualViewer.controls2.target.copy(center);

    // 重新启用
    dualViewer.controls1.enabled = true;
    dualViewer.controls2.enabled = true;

    dualViewer.controls1.update();
    dualViewer.controls2.update();

    // 🔧 应用透视反转修复
    console.log(`\n🔧 应用透视反转修复...`);

    // 优先使用源代码中的方法
    if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
      dualViewer.updateCameraProjectionForLargeCoord();
      console.log(`  ✅ 使用源代码方法修复透视`);
    } else {
      fixPerspectiveInversion(dualViewer.camera1, center);
      fixPerspectiveInversion(dualViewer.camera2, center);
      console.log(`  ✅ 使用内置方法修复透视`);
    }

    // Cesium 相机安全
    if (cesiumViewer && Cesium) {
      if (!isLargeCoordMode) {
        const safeHeight = CesiumHeightManager.getSafeCesiumHeight(center.y);
        const currentPos = cesiumViewer.camera.positionCartographic;

        if (currentPos.height < 500) {
          cesiumViewer.camera.position = Cesium.Cartesian3.fromRadians(
            currentPos.longitude,
            currentPos.latitude,
            safeHeight
          );

          if (cesiumViewer.camera.pitch > 0) {
            cesiumViewer.camera.pitch = -Cesium.Math.PI_OVER_FOUR;
          }

          console.log(`  ✅ Cesium 高度: ${safeHeight} 米`);
        }
      } else {
        console.log(`  ℹ️ 大坐标模式：保持 Cesium 当前位置`);
      }
    }

    console.log('\n✅ 定位完成');
    return true;
  }

  // 覆盖定位函数
  const originalFocusOnSingleModel = dualViewer.focusOnSingleModel;
  dualViewer.focusOnSingleModel = safeFocusOnModel;

  window.__safeFocusOnModel = safeFocusOnModel;
  window.__originalFocusOnSingleModel = originalFocusOnSingleModel;

  console.log('  ✅ 安全定位功能已创建');
  console.log('  ✅ 支持大坐标模式定位');
  console.log('  ✅ 已防止相机到地下');
  console.log('  ✅ 已防止 Cesium 蓝屏');
  console.log('  ✅ 已防止俯仰角异常');
  console.log('  ✅ 已防止透视反转');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：立即修复当前相机的透视
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤5/6] 修复当前相机透视...');

  // 优先使用源代码中的方法（如果存在）
  if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
    console.log('  🔧 使用源代码的 updateCameraProjectionForLargeCoord 方法');
    dualViewer.updateCameraProjectionForLargeCoord();
    console.log('  ✅ 当前相机透视已修复（源代码方法）');
  } else if (dualViewer.controls1 && dualViewer.controls1.target) {
    console.log('  🔧 使用内置的透视修复函数');
    fixPerspectiveInversion(dualViewer.camera1, dualViewer.controls1.target);
    fixPerspectiveInversion(dualViewer.camera2, dualViewer.controls2.target);
    console.log('  ✅ 当前相机透视已修复（内置方法）');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：更新场景
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤6/6] 更新场景...');

  if (dualViewer.modelGroup1) dualViewer.modelGroup1.traverse(obj => obj.updateMatrixWorld(true));
  if (dualViewer.modelGroup2) dualViewer.modelGroup2.traverse(obj => obj.updateMatrixWorld(true));

  console.log('  ✅ 场景已更新');

  // 辅助函数
  window.__fixCesiumBlueScreen = function() {
    CesiumHeightManager.ensureSafeHeight();
    console.log('✅ Cesium 高度已修复');
  };

  window.__fixCurrentPerspective = function() {
    // 优先使用源代码方法
    if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
      dualViewer.updateCameraProjectionForLargeCoord();
      console.log('✅ 当前相机透视已修复（源代码方法）');
    } else if (dualViewer.controls1 && dualViewer.controls1.target) {
      fixPerspectiveInversion(dualViewer.camera1, dualViewer.controls1.target);
      fixPerspectiveInversion(dualViewer.camera2, dualViewer.controls2.target);
      console.log('✅ 当前相机透视已修复（内置方法）');
    }
  };

  window.__getModelsInfo = function() {
    const info = [];
    [dualViewer.modelGroup1, dualViewer.modelGroup2].forEach((group, idx) => {
      if (!group) return;
      const groupName = idx === 0 ? '原始层' : 'BIM层';
      group.children.forEach(m => {
        if (!m.userData.isBox3Helper) {
          info.push({
            group: groupName,
            name: m.userData?.fileName || m.name || '(未命名)',
            position: m.position,
            hasBoundingBox: !!m.userData?.boundingBox
          });
        }
      });
    });
    return info;
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
  console.log(`  ✅ 渲染顺序: ${renderOrderSet} 个模型`);
  console.log(`  ✅ 安全定位: 已启用（支持大坐标模式）`);
  console.log(`  ✅ 透视修复: 已应用\n`);

  console.log('🛡️ 安全保障:');
  console.log(`  ✅ 防止相机到地下 (相对坐标模式 min Y: 50m)`);
  console.log(`  ✅ 防止 Cesium 蓝屏 (min height: 500m)`);
  console.log(`  ✅ 防止俯仰角异常 (pitch < 0)`);
  console.log(`  ✅ 防止透视反转 (动态 near/far)`);
  console.log(`  ✅ 处理 BIM 大坐标问题\n`);

  console.log('💡 使用方法:');
  console.log('  dualViewer.focusOnSingleModel("19_rue")   // 定位 BIM 模型');
  console.log('  dualViewer.focusOnSingleModel("Catwalk")  // 定位动画模型');
  console.log('  dualViewer.focusOnSingleModel("L16")      // 定位大坐标模型\n');

  console.log('🔧 调试/修复命令:');
  console.log('  window.__fixCurrentPerspective()         // 修复当前相机透视');
  console.log('  window.__fixCesiumBlueScreen()            // 修复 Cesium 蓝屏');
  console.log('  window.__getModelsInfo()                  // 查看所有模型信息\n');

  console.log('🎉 现在请测试:');
  console.log('  1. CatWalk04.glb 的动画是否播放');
  console.log('  2. 定位各种模型，检查相机是否安全');
  console.log('  3. 验证 Cesium 背景是否正常（不变蓝）');
  console.log('  4. 验证深度排序是否正确');
  console.log('  5. 验证透视是否正常（近大远小）\n');

  // 初始修复
  if (!isLargeCoordMode) {
    CesiumHeightManager.ensureSafeHeight();
  }

})();
