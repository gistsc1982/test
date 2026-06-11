// ═══════════════════════════════════════════════════════════════════
// 多场景透视修复脚本
// ═══════════════════════════════════════════════════════════════════
// 功能：
//   1. 在多场景架构下，为层1和层2分别计算 near/far
//   2. 动态调整每层的深度范围
//   3. 解决"远大近小"透视反转问题
//
// 使用方法：
//   fetch('/multi-scene-perspective-fix.js').then(r=>r.text()).then(eval);
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 多场景透视修复 V1.0                                   ║');
  console.log('║  📊 分别计算每层的 near/far 并修复透视反转                ║');
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
  // 步骤2：获取所有场景和相机
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤2] 获取场景和相机...');

  const scenes = {
    layer1Large: manager.scenes.layer1Large,
    layer1Small: manager.scenes.layer1Small,
    layer2Large: manager.scenes.layer2Large,
    layer2Small: manager.scenes.layer2Small
  };

  const cameras = {
    layer1Large: manager.cameras.layer1Large,
    layer1Small: manager.cameras.layer1Small,
    layer2Large: manager.cameras.layer2Large,
    layer2Small: manager.cameras.layer2Small
  };

  const referencePoints = manager.referencePoints;

  console.log('  ✅ 场景和相机已获取');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：计算场景的边界框
  // ═══════════════════════════════════════════════════════════════════
  function calculateSceneBounds(scene, referencePoint) {
    const Box3 = scene.children.length > 0 ?
                 scene.children[0].constructor.name === 'Object3D' ?
                 require('three').Box3 : null : null;

    if (!Box3) {
      // 手动计算边界
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      scene.traverse(obj => {
        if (obj.position) {
          const pos = obj.position;
          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          minZ = Math.min(minZ, pos.z);
          maxX = Math.max(maxX, pos.x);
          maxY = Math.max(maxY, pos.y);
          maxZ = Math.max(maxZ, pos.z);
        }
      });

      return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        center: {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          z: (minZ + maxZ) / 2
        }
      };
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：计算相机到场景的距离
  // ═══════════════════════════════════════════════════════════════════
  function calculateCameraToSceneDistance(camera, scene, referencePoint, isSmallScene) {
    if (scene.children.length === 0) return null;

    const cameraPos = camera.position;
    let minDistance = Infinity;
    let maxDistance = -Infinity;

    scene.traverse(obj => {
      if (obj.position && obj.parent === scene) {
        const objPos = obj.position;
        let distance;

        if (isSmallScene && referencePoint) {
          // 小坐标场景：需要加上参考点
          const worldPos = {
            x: objPos.x + referencePoint.x,
            y: objPos.y + referencePoint.y,
            z: objPos.z + referencePoint.z
          };
          distance = Math.sqrt(
            Math.pow(cameraPos.x - worldPos.x, 2) +
            Math.pow(cameraPos.y - worldPos.y, 2) +
            Math.pow(cameraPos.z - worldPos.z, 2)
          );
        } else {
          // 大坐标场景：直接计算
          distance = Math.sqrt(
            Math.pow(cameraPos.x - objPos.x, 2) +
            Math.pow(cameraPos.y - objPos.y, 2) +
            Math.pow(cameraPos.z - objPos.z, 2)
          );
        }

        minDistance = Math.min(minDistance, distance);
        maxDistance = Math.max(maxDistance, distance);
      }
    });

    return { min: minDistance, max: maxDistance };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：动态计算 near/far 值
  // ═══════════════════════════════════════════════════════════════════
  function calculateNearFar(distance) {
    if (!distance || distance.min === Infinity) {
      return { near: 0.1, far: 10000 };
    }

    // 使用黄金比例来确保深度精度
    // near = distance * 0.01
    // far = distance * 100
    // 这样可以保持 10000:1 的深度精度比

    const near = Math.max(distance.min * 0.02, 1);  // 至少为1
    const far = distance.max * 2;

    // 确保远裁剪面足够大
    const adjustedFar = Math.max(far, near * 100);

    return { near, far: adjustedFar };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：更新单层的 near/far
  // ═══════════════════════════════════════════════════════════════════
  function updateLayerNearFar(layerName, scene, camera, referencePoint, isSmallScene) {
    const distance = calculateCameraToSceneDistance(camera, scene, referencePoint, isSmallScene);

    if (!distance || distance.min === Infinity) {
      console.log(`    ${layerName}: 无模型，使用默认值`);
      return;
    }

    const { near, far } = calculateNearFar(distance);

    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    console.log(`    ${layerName}:`);
    console.log(`      距离范围: ${distance.min.toFixed(2)} - ${distance.max.toFixed(2)}`);
    console.log(`      near=${near.toFixed(2)}, far=${far.toFixed(2)}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤7：更新所有层的 near/far
  // ═══════════════════════════════════════════════════════════════════
  function updateAllLayersNearFar() {
    const baseCamera = manager.dualViewer.camera1;

    console.log('\n📊 [实时] 更新所有层的 near/far...');
    console.log(`  基准相机位置: (${baseCamera.position.x.toFixed(2)}, ${baseCamera.position.y.toFixed(2)}, ${baseCamera.position.z.toFixed(2)})`);

    // 更新原始层
    updateLayerNearFar(
      '原始层大坐标',
      scenes.layer1Large,
      cameras.layer1Large,
      referencePoints.layer1,
      false
    );

    updateLayerNearFar(
      '原始层小坐标',
      scenes.layer1Small,
      cameras.layer1Small,
      referencePoints.layer1,
      true
    );

    // 更新BIM层
    updateLayerNearFar(
      'BIM层大坐标',
      scenes.layer2Large,
      cameras.layer2Large,
      referencePoints.layer2,
      false
    );

    updateLayerNearFar(
      'BIM层小坐标',
      scenes.layer2Small,
      cameras.layer2Small,
      referencePoints.layer2,
      true
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤8：替换相机同步方法
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤3] 替换相机同步方法...');

  const originalSyncCamera = manager.syncCamera.bind(manager);

  manager.syncCamera = function(baseCamera, targetCamera, referencePoint, isLargeScene) {
    // 先执行原始同步
    originalSyncCamera(baseCamera, targetCamera, referencePoint, isLargeScene);

    // 同步后更新 near/far
    updateAllLayersNearFar();
  };

  console.log('  ✅ 相机同步方法已替换');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤9：添加控制器变化监听
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔗 [步骤4] 添加控制器变化监听...');

  const controls1 = manager.dualViewer.controls1;
  const controls2 = manager.dualViewer.controls2;

  let updateScheduled = false;

  function scheduleUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateAllLayersNearFar();
      updateScheduled = false;
    });
  }

  if (controls1) {
    controls1.addEventListener('change', scheduleUpdate);
    console.log('  ✅ 层1控制器监听已添加');
  }

  if (controls2) {
    controls2.addEventListener('change', scheduleUpdate);
    console.log('  ✅ 层2控制器监听已添加');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤10：立即执行一次更新
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🚀 [步骤5] 执行初始 near/far 计算...');
  updateAllLayersNearFar();

  // ═══════════════════════════════════════════════════════════════════
  // 步骤11：保存到全局以便手动调用
  // ═══════════════════════════════════════════════════════════════════
  window.__multiScenePerspectiveFix = {
    manager: manager,
    updateNearFar: updateAllLayersNearFar,
    calculateNearFar: calculateNearFar,
    calculateDistance: calculateCameraToSceneDistance
  };

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 多场景透视修复已安装！                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📌 功能已启用:');
  console.log('   - 自动计算每层的 near/far 值');
  console.log('   - 动态调整深度范围以修复透视反转');
  console.log('   - 相机移动时自动更新');
  console.log('   - 控制器变化时自动更新');
  console.log('\n📌 手动调用:');
  console.log('   window.__multiScenePerspectiveFix.updateNearFar()');
  console.log('');

})();
