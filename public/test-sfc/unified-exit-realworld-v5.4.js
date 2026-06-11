// ═══════════════════════════════════════════════════════════════════
// 统一脚本 V5.4：退出真实世界模式（大坐标保持版 + 缩放翻转修复）
// ═══════════════════════════════════════════════════════════════════
// 功能：退出真实世界模式，但保持模型在大坐标位置
// 关键修复：
//   1. 不更新地板中心和统一坐标系
//   2. 禁用可能触发同步的操作
//   3. Hook syncToThreeJSFromUnified 方法，防止缩放时的轻微翻转
//
// 使用方法：在真实世界模式下，在浏览器控制台执行此脚本
// ═══════════════════════════════════════════════════════════════════

(async function() {
  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 实例未找到');
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 统一脚本 V5.4：退出真实世界模式（大坐标保持）         ║');
  console.log('║  🔧 新增：防止缩放时的轻微翻转                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：移动小模型到大坐标位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔄 [步骤1] 移动小模型到大坐标位置...');

  // 禁用同步
  const originalSyncCamera = dualViewer.syncCameraFromThreeToBim;
  dualViewer.syncCameraFromThreeToBim = function() { return; };

  const originalCallback = dualViewer.syncManager?.onFloorCenterUpdate;
  if (dualViewer.syncManager) {
    dualViewer.syncManager.onFloorCenterUpdate = null;
  }

  // 获取模型
  const allModels = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  if (allModels.length === 0) {
    console.error('❌ 没有找到模型');
    dualViewer.syncCameraFromThreeToBim = originalSyncCamera;
    return;
  }

  // 分类
  const largeCoordModels = [];
  const smallCoordModels = [];

  allModels.forEach(model => {
    const pos = model.position;
    const isLargeCoord = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000;
    if (isLargeCoord) {
      largeCoordModels.push({ model });
    } else {
      smallCoordModels.push({ model });
    }
  });

  if (largeCoordModels.length === 0) {
    console.error('❌ 没有找到大坐标模型');
    dualViewer.syncCameraFromThreeToBim = originalSyncCamera;
    return;
  }

  // 移动小模型
  const referenceModel = largeCoordModels[0].model;
  const referencePos = referenceModel.position;

  console.log(`  参考模型位置: (${referencePos.x.toFixed(2)}, ${referencePos.y.toFixed(2)}, ${referencePos.z.toFixed(2)})`);

  smallCoordModels.forEach(item => {
    const offsetDistance = 50;
    item.model.position.set(
      referencePos.x,
      item.model.position.y,
      referencePos.z + offsetDistance
    );
    item.model.updateMatrixWorld();
  });

  console.log(`  ✅ 已移动 ${smallCoordModels.length} 个小模型`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：计算目标相机位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📷 [步骤2] 计算目标相机位置...');

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  largeCoordModels.forEach(item => {
    const pos = item.model.position;
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
    minZ = Math.min(minZ, pos.z);
    maxZ = Math.max(maxZ, pos.z);
  });

  // 计算移动后的小模型位置
  smallCoordModels.forEach(item => {
    const pos = item.model.position;
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
    minZ = Math.min(minZ, pos.z);
    maxZ = Math.max(maxZ, pos.z);
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const targetCameraHeight = centerY + Math.max(100, maxSize * 0.6);
  const targetCameraDistance = Math.max(150, maxSize * 0.8);

  console.log(`  目标相机: (${centerX.toFixed(2)}, ${targetCameraHeight.toFixed(2)}, ${(centerZ + targetCameraDistance).toFixed(2)})`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：设置相机到大坐标位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📷 [步骤3] 设置相机位置...');

  const setCamera = () => {
    dualViewer.controls1.enabled = false;
    dualViewer.controls2.enabled = false;

    dualViewer.camera1.position.set(centerX, targetCameraHeight, centerZ + targetCameraDistance);
    dualViewer.camera1.lookAt(centerX, centerY, centerZ);
    dualViewer.camera1.updateMatrixWorld();

    dualViewer.controls1.target.set(centerX, centerY, centerZ);

    dualViewer.camera2.position.set(centerX, targetCameraHeight, centerZ + targetCameraDistance);
    dualViewer.camera2.lookAt(centerX, centerY, centerZ);
    dualViewer.camera2.updateMatrixWorld();

    dualViewer.controls2.target.set(centerX, centerY, centerZ);

    dualViewer.controls1.enabled = true;
    dualViewer.controls2.enabled = true;

    dualViewer.controls1.update();
    dualViewer.controls2.update();
  };

  setCamera();
  await new Promise(resolve => setTimeout(resolve, 50));
  setCamera();
  await new Promise(resolve => setTimeout(resolve, 50));
  setCamera();

  console.log('  ✅ 相机已设置');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：退出真实世界模式（保持大坐标）
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤4] 退出真实世界模式...');

  // 关键：保持 enablePan = false 以防止 Orbit 干扰大坐标
  // 但不修改地板中心和统一坐标系
  dualViewer.isInRealWorldMode = false;
  dualViewer.isInRealWorldCoordinates = false;

  // ⚠️ 关键：不设置 window.__unifiedProjectionMode__ = false
  // 因为模型仍在大坐标位置，仍需要统一坐标系模式
  // 保持 __unifiedProjectionMode__ = true 以防止缩放时模型翻转

  // ⚠️ 关键：保持 enablePan = false
  // 因为在大坐标位置，OrbitControls 的平移会导致问题
  // 用户可以通过 SyncManager 的平移功能来移动视角
  if (dualViewer.controls1) {
    dualViewer.controls1.enablePan = false;
  }
  if (dualViewer.controls2) {
    dualViewer.controls2.enablePan = false;
  }

  console.log('  ✅ 已退出真实世界模式');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4.5：同步 Cesium 相机到大坐标模型位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🌍 [步骤4.5] 同步 Cesium 相机到大坐标模型位置...');

  await new Promise(resolve => setTimeout(resolve, 100));

  const syncCesiumCamera = () => {
    const cesiumViewer = window.__cesiumViewer__;
    if (!cesiumViewer || !cesiumViewer.camera) {
      console.warn('  ⚠️ Cesium viewer 未找到，跳过 Cesium 相机同步');
      return false;
    }

    const Cesium = window.Cesium;
    if (!Cesium) {
      console.warn('  ⚠️ Cesium 库未找到，跳过 Cesium 相机同步');
      return false;
    }

    try {
      // 使用墨卡托投影管理器将 Three.js 坐标转换为经纬度
      const mercatorProj = dualViewer.mercatorProjectionManager;
      if (!mercatorProj) {
        console.warn('  ⚠️ 墨卡托投影管理器未找到，使用直接计算');
        // 直接计算经纬度（简化版本）
        const earthRadius = 6378137.0;
        const longitude = centerX / earthRadius;
        const latitude = Math.atan(Math.sinh(centerZ / earthRadius));
        const height = targetCameraHeight - centerY;

        const destination = Cesium.Cartesian3.fromRadians(longitude, latitude, Math.max(height, 500));
        cesiumViewer.camera.setView({
          destination: destination,
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_FOUR,
            roll: 0
          }
        });
      } else {
        // 使用墨卡托投影管理器进行精确转换
        const mercatorPos = mercatorProj.threeToMercator(centerX, targetCameraHeight, centerZ + targetCameraDistance);
        const mercatorTarget = mercatorProj.threeToMercator(centerX, centerY, centerZ);

        const earthRadius = 6378137.0;
        const longitude = mercatorPos.x / earthRadius;
        const latitude = Math.atan(Math.sinh(mercatorPos.y / earthRadius));
        const height = mercatorPos.z;

        const destination = Cesium.Cartesian3.fromRadians(longitude, latitude, Math.max(height, 500));
        cesiumViewer.camera.setView({
          destination: destination,
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_FOUR,
            roll: 0
          }
        });
      }

      console.log('  ✅ Cesium 相机已同步');
      return true;
    } catch (error) {
      console.warn('  ⚠️ Cesium 相机同步失败:', error.message);
      return false;
    }
  };

  syncCesiumCamera();

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：禁用可能导致问题的同步
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔒 [步骤5] 禁用可能导致问题的同步...');

  // 持续禁用同步
  window.__disableCameraSync__ = true;
  window.__preserveCameraPosition__ = true;
  dualViewer._preserveCameraPosition = true;
  dualViewer._disableSyncFromHelloWorld = true;

  // 替换同步方法
  dualViewer.syncCameraFromThreeToBim = function() {
    // 完全禁用同步
    return;
  };

  // 禁用 onFloorCenterUpdate
  if (dualViewer.syncManager) {
    dualViewer.syncManager.onFloorCenterUpdate = null;
  }

  console.log('  ✅ 已禁用相机同步');

  // 恢复原始同步函数（但保持禁用）
  dualViewer.syncCameraFromThreeToBim = originalSyncCamera;

  // ═══════════════════════════════════════════════════════════════════
  // 步骤6：防止缩放时的轻微翻转（智能版本）
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤6] 应用防止缩放翻转的智能修复...');

  // 获取 HelloWorld 实例
  const helloWorld = window.__helloWorldInstance__ ||
                     (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances[0]?.helloWorld);

  if (helloWorld && helloWorld.syncToThreeJSFromUnified) {
    const originalSyncToThreeJSFromUnified = helloWorld.syncToThreeJSFromUnified;

    helloWorld.syncToThreeJSFromUnified = function(threeState) {
      if (!window.__dualCanvasViewerInstances || window.__dualCanvasViewerInstances.length === 0) {
        return originalSyncToThreeJSFromUnified.call(this, threeState);
      }

      const dualViewer = window.__dualCanvasViewerInstances[0];
      if (!dualViewer.camera1) {
        return originalSyncToThreeJSFromUnified.call(this, threeState);
      }

      // ⚠️ 关键检测：区分缩放操作和旋转操作
      const LARGE_COORD_THRESHOLD = 10000;

      const isCurrentCameraLargeCoord =
        Math.abs(dualViewer.camera1.position.x) > LARGE_COORD_THRESHOLD ||
        Math.abs(dualViewer.camera1.position.z) > LARGE_COORD_THRESHOLD;

      const isInLargeCoordMode =
        dualViewer.isInRealWorldMode ||
        (dualViewer.mouseCoords && dualViewer.mouseCoords.geoOffset && dualViewer.mouseCoords.geoOffset.enabled) ||
        isCurrentCameraLargeCoord;

      if (isInLargeCoordMode) {
        // 检测是缩放操作还是旋转操作
        // 缩放：x、z 基本不变，只有 y 变化
        // 旋转：x、z 可能有明显变化

        const deltaX = Math.abs(threeState.position.x - dualViewer.camera1.position.x);
        const deltaZ = Math.abs(threeState.position.z - dualViewer.camera1.position.z);
        const deltaY = Math.abs(threeState.position.y - dualViewer.camera1.position.y);

        // 判断阈值：如果 x、z 变化小于 1m，且 y 变化大于 0.1m，认为是缩放操作
        const isZoomOperation = deltaX < 1.0 && deltaZ < 1.0 && deltaY > 0.1;

        if (isZoomOperation) {
          // ⚠️ 缩放操作：只更新高度（y值），不改变旋转
          const oldY = dualViewer.camera1.position.y;
          const oldTargetY = dualViewer.controls1 ? dualViewer.controls1.target.y : oldY;

          dualViewer.camera1.position.y = threeState.position.y;

          if (dualViewer.controls1) {
            dualViewer.controls1.target.y = threeState.target.y;
          }

          dualViewer.camera1.updateMatrixWorld(true);
          dualViewer.camera1.updateProjectionMatrix();

          if (dualViewer.controls1) {
            dualViewer.controls1.update();
          }

          if (dualViewer.camera2) {
            dualViewer.camera2.position.y = dualViewer.camera1.position.y;
            dualViewer.camera2.updateMatrixWorld();

            if (dualViewer.controls2) {
              dualViewer.controls2.target.y = dualViewer.controls1.target.y;
              dualViewer.controls2.update();
            }
          }

          console.log('[HelloWorld.syncToThreeJSFromUnified] 大坐标模式-缩放操作：只更新高度', {
            oldY: oldY.toFixed(2),
            newY: threeState.position.y.toFixed(2),
            deltaY: deltaY.toFixed(2)
          });

          return;
        }

        // ⚠️ 旋转操作：使用完整的同步逻辑（允许旋转）
        console.log('[HelloWorld.syncToThreeJSFromUnified] 大坐标模式-旋转操作：完整更新', {
          deltaX: deltaX.toFixed(2),
          deltaZ: deltaZ.toFixed(2),
          deltaY: deltaY.toFixed(2)
        });
      }

      // 非大坐标模式或旋转操作：使用原始的完整同步逻辑
      return originalSyncToThreeJSFromUnified.call(this, threeState);
    };

    console.log('  ✅ 已应用防止缩放翻转的智能修复');
    console.log('  📝 逻辑说明：');
    console.log('     - 缩放操作（x、z 变化 < 1m）：只更新高度 y');
    console.log('     - 旋转操作（x、z 变化 ≥ 1m）：完整更新位置和旋转');
    console.log('     - 这样既能防止缩放翻转，又不影响鼠标旋转功能');
  } else {
    console.warn('  ⚠️ HelloWorld.syncToThreeJSFromUnified 未找到，跳过此修复');
    console.log('  💡 如需此修复，请在 HelloWorld.vue 中添加：');
    console.log('     mounted() {');
    console.log('       window.__helloWorldInstance__ = this;');
    console.log('     }');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🎉 完成！                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('✅ 已完成操作:');
  console.log('   1. ✅ 小模型已移动到大坐标位置');
  console.log('   2. ✅ 退出真实世界模式');
  console.log('   3. ✅ 相机已设置到大坐标位置');
  console.log('   4. ✅ 已禁用可能导致问题的同步');
  console.log('   5. ✅ 已应用防止缩放翻转的智能修复');

  console.log('\n💡 说明:');
  console.log('   - 模型和相机保持在大坐标位置');
  console.log('   - OrbitControls 平移已禁用（避免坐标问题）');
  console.log('   - 可以使用鼠标旋转和缩放');

  console.log('\n🔧 防翻转智能修复逻辑:');
  console.log('   - 缩放操作（x、z 变化 < 1m）：只更新高度 y，不改变旋转');
  console.log('   - 旋转操作（x、z 变化 ≥ 1m）：完整更新位置和旋转');
  console.log('   - 这样既能防止缩放翻转，又不影响鼠标旋转功能');

  console.log('\n⚠️ 注意事项:');
  console.log('   - 如果缩放后模型消失，说明需要修复源代码中的同步逻辑');
  console.log('   - 重点关注 HelloWorld.syncToThreeJSFromUnified 方法');
  console.log('   - 此修复只在当前会话有效，刷新页面后需要重新执行');
  console.log('   - 永久修复需要修改 src/components/HelloWorld.vue 源代码');
})();
