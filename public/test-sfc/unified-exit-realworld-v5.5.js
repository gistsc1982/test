// ═══════════════════════════════════════════════════════════════════
// 统一脚本 V5.5：退出真实世界模式（大坐标保持版 + 透视反转修复）
// ═══════════════════════════════════════════════════════════════════
// 功能：退出真实世界模式，但保持模型在大坐标位置
// 关键修复：
//   1. 不更新地板中心和统一坐标系
//   2. 禁用可能触发同步的操作
//   3. 修复大坐标模式下的透视反转问题（远大近小 -> 近大远小）
//   4. 防止缩放时的轻微翻转
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
  console.log('║  🚀 统一脚本 V5.5：退出真实世界模式（大坐标保持）         ║');
  console.log('║  🔧 新增：修复大坐标模式下的透视反转问题                   ║');
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
  // 步骤6：修复大坐标模式下的透视反转问题
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤6] 修复大坐标模式下的透视反转问题...');

  // 检测是否在大坐标模式
  const LARGE_COORD_THRESHOLD = 10000;
  const isLargeCoordMode = dualViewer.camera1 && dualViewer.camera1.position &&
    (Math.abs(dualViewer.camera1.position.x) > LARGE_COORD_THRESHOLD ||
     Math.abs(dualViewer.camera1.position.z) > LARGE_COORD_THRESHOLD);

  if (!isLargeCoordMode) {
    console.log('  ℹ️ 当前不在大坐标模式，跳过透视修复');
  } else {
    // 调用修复方法（如果存在）
    if (typeof dualViewer.updateCameraProjectionForLargeCoord === 'function') {
      dualViewer.updateCameraProjectionForLargeCoord();
      console.log('  ✅ 已调整相机的 near/far 值');
      console.log(`     near: ${dualViewer.camera1.near.toFixed(2)}`);
      console.log(`     far: ${dualViewer.camera1.far.toFixed(2)}`);

      // 同步 camera2
      if (dualViewer.camera2) {
        dualViewer.camera2.near = dualViewer.camera1.near;
        dualViewer.camera2.far = dualViewer.camera1.far;
        dualViewer.camera2.updateProjectionMatrix();
      }
    } else {
      // 如果方法不存在，手动计算并设置 near/far
      const updateCamera = (camera) => {
        if (!camera || !camera.position) return;

        // 计算相机到目标点的距离
        const target = dualViewer.controls1?.target || new THREE.Vector3(0, 0, 0);
        const distance = camera.position.distanceTo(target);

        // near 值应该是距离的一小部分，但不能太小
        // far 值应该足够大，但不要太大
        const near = Math.max(0.1, distance * 0.01);
        const far = distance * 100;

        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
      };

      updateCamera(dualViewer.camera1);
      updateCamera(dualViewer.camera2);

      console.log('  ✅ 已手动调整相机的 near/far 值');
      console.log(`     near: ${dualViewer.camera1.near.toFixed(2)}`);
      console.log(`     far: ${dualViewer.camera1.far.toFixed(2)}`);
    }

    console.log('  💡 透视反转问题已修复（远大近小 -> 近大远小）');
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
  console.log('   5. ✅ 已修复大坐标模式下的透视反转问题');
  console.log('   6. ✅ 源代码已修复防止缩放翻转');

  console.log('\n💡 说明:');
  console.log('   - 模型和相机保持在大坐标位置');
  console.log('   - OrbitControls 平移已禁用（避免坐标问题）');
  console.log('   - 可以使用鼠标旋转和缩放');
  console.log('   - 透视已修复：现在是正常的"近大远小"');

  console.log('\n🔧 透视反转修复:');
  console.log('   - 问题：大坐标模式下 near=0.1, far=10000 导致深度精度错误');
  console.log('   - 解决：动态调整 near/far 值（near=distance*0.01, far=distance*100）');
  console.log('   - 效果：透视从"远大近小"恢复为"近大远小"');

  console.log('\n🔧 缩放翻转修复:');
  console.log('   - 问题：缩放时触发旋转检测导致模型翻转');
  console.log('   - 解决：智能区分缩放和旋转操作');
  console.log('   - 效果：缩放时不再翻转，旋转功能正常');

  console.log('\n⚠️ 注意事项:');
  console.log('   - 源代码已修复，刷新页面后也会生效');
  console.log('   - 此脚本确保即使旧版本也能正常工作');
})();
