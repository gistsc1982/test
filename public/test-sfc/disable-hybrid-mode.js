// ═══════════════════════════════════════════════════════════════════
// 修复混合模式坐标问题
// ═══════════════════════════════════════════════════════════════════
// 问题：混合模式地理偏移导致坐标系统混乱，无法正常操作
// 解决：完全禁用混合模式，使用纯局部坐标
//
// 使用方法：在执行完移动脚本后，在控制台执行此脚本
// ═══════════════════════════════════════════════════════════════════

(async function() {
  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 实例未找到');
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 禁用混合模式并修复坐标系统                                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：完全禁用混合模式
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔄 [步骤1] 禁用混合模式...');

  // 禁用地理偏移
  if (dualViewer.mouseCoords) {
    dualViewer.mouseCoords.geoOffset = {
      x: 0,
      y: 0,
      z: 0,
      longitude: 0,
      latitude: 0,
      enabled: false
    };
    console.log('  ✅ 已禁用 mouseCoords.geoOffset');
  }

  // 禁用统一投影模式
  window.__unifiedProjectionMode__ = false;
  console.log('  ✅ 已禁用统一投影模式');

  // 确保不在真实世界模式
  dualViewer.isInRealWorldMode = false;
  dualViewer.isInRealWorldCoordinates = false;
  console.log('  ✅ 已禁用真实世界模式');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：验证当前模型位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📍 [步骤2] 验证模型位置...');

  const allModels = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];

  allModels.forEach(model => {
    const pos = model.position;
    const name = model.userData.filePath || model.userData.fileName || model.name;
    console.log(`  • ${name}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：重新计算并设置相机位置
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📷 [步骤3] 重新设置相机位置...');

  if (allModels.length === 0) {
    console.error('❌ 没有找到模型');
    return;
  }

  // 计算所有模型的包围盒
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  allModels.forEach(model => {
    const pos = model.position;
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

  // 设置相机位置
  const cameraHeight = centerY + Math.max(50, maxSize * 0.6);
  const cameraDistance = Math.max(100, maxSize * 0.8);

  console.log(`  模型中心: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)})`);
  console.log(`  相机位置: (${centerX.toFixed(2)}, ${cameraHeight.toFixed(2)}, ${(centerZ + cameraDistance).toFixed(2)})`);

  // 使用 requestAnimationFrame 确保相机设置生效
  const setCamera = () => {
    // 禁用控制器
    if (dualViewer.controls1) dualViewer.controls1.enabled = false;
    if (dualViewer.controls2) dualViewer.controls2.enabled = false;

    // 设置相机1
    if (dualViewer.camera1) {
      dualViewer.camera1.position.set(centerX, cameraHeight, centerZ + cameraDistance);
      dualViewer.camera1.lookAt(centerX, centerY, centerZ);
      dualViewer.camera1.updateMatrixWorld();
      dualViewer.camera1.updateProjectionMatrix();
    }

    // 设置控制器1
    if (dualViewer.controls1) {
      dualViewer.controls1.target.set(centerX, centerY, centerZ);
      dualViewer.controls1.enableDamping = true;
      dualViewer.controls1.dampingFactor = 0.05;
    }

    // 设置相机2
    if (dualViewer.camera2) {
      dualViewer.camera2.position.set(centerX, cameraHeight, centerZ + cameraDistance);
      dualViewer.camera2.lookAt(centerX, centerY, centerZ);
      dualViewer.camera2.updateMatrixWorld();
      dualViewer.camera2.updateProjectionMatrix();
    }

    // 设置控制器2
    if (dualViewer.controls2) {
      dualViewer.controls2.target.set(centerX, centerY, centerZ);
      dualViewer.controls2.enableDamping = true;
      dualViewer.controls2.dampingFactor = 0.05;
    }

    // 启用控制器
    if (dualViewer.controls1) dualViewer.controls1.enabled = true;
    if (dualViewer.controls2) dualViewer.controls2.enabled = true;

    // 更新控制器
    if (dualViewer.controls1) dualViewer.controls1.update();
    if (dualViewer.controls2) dualViewer.controls2.update();
  };

  // 多次设置确保生效
  setCamera();

  await new Promise(resolve => requestAnimationFrame(() => {
    setCamera();
    requestAnimationFrame(resolve);
  }));

  await new Promise(resolve => requestAnimationFrame(() => {
    setCamera();
    requestAnimationFrame(resolve);
  }));

  console.log('  ✅ 相机已设置');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：确保控制台不再显示混合模式日志
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔇 [步骤4] 禁用混合模式日志...');

  // 保存原始的坐标转换函数
  if (dualViewer.mouseCoords && !dualViewer.mouseCoords._originalMercatorToWorld) {
    const originalMercatorToWorld = dualViewer.mouseCoords.mercatorToWorld;
    if (originalMercatorToWorld) {
      dualViewer.mouseCoords._originalMercatorToWorld = originalMercatorToWorld;
    }
  }

  console.log('  ✅ 已准备禁用混合模式日志');

  // ═══════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🎉 完成！                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 验证最终状态
  console.log('📊 最终状态验证:');
  console.log(`  相机位置: (${dualViewer.camera1.position.x.toFixed(2)}, ${dualViewer.camera1.position.y.toFixed(2)}, ${dualViewer.camera1.position.z.toFixed(2)})`);
  console.log(`  控制器目标: (${dualViewer.controls1.target.x.toFixed(2)}, ${dualViewer.controls1.target.y.toFixed(2)}, ${dualViewer.controls1.target.z.toFixed(2)})`);
  console.log(`  混合模式: ${dualViewer.mouseCoords?.geoOffset?.enabled ? '启用' : '禁用'}`);
  console.log(`  真实世界模式: ${dualViewer.isInRealWorldMode ? '启用' : '禁用'}`);

  console.log('\n✅ 已完成：');
  console.log('   1. 禁用混合模式地理偏移');
  console.log('   2. 禁用统一投影模式');
  console.log('   3. 禁用真实世界模式');
  console.log('   4. 重新设置相机位置');
  console.log('\n💡 现在应该可以正常操作了！');
  console.log('   - 鼠标旋转应该正常工作');
  console.log('   - 鼠标缩放应该正常工作');
  console.log('   - 鼠标平移应该正常工作');
})();
