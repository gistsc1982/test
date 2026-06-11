// ═══════════════════════════════════════════════════════════════════
// 验证 Cesium 相机位置是否正确
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🌍 Cesium 相机位置验证工具                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const cesiumViewer = window.__cesiumViewer__;
  const Cesium = window.Cesium;

  if (!cesiumViewer || !cesiumViewer.camera) {
    console.error('❌ Cesium viewer 未找到');
    return;
  }

  // 获取当前 Cesium 相机位置
  const cameraPosition = cesiumViewer.camera.positionCartographic;
  const longitude = Cesium.Math.toDegrees(cameraPosition.longitude);
  const latitude = Cesium.Math.toDegrees(cameraPosition.latitude);
  const height = cameraPosition.height;

  console.log('📷 当前 Cesium 相机位置:');
  console.log(`  经度: ${longitude.toFixed(6)}°`);
  console.log(`  纬度: ${latitude.toFixed(6)}°`);
  console.log(`  高度: ${height.toFixed(2)} 米\n`);

  // L16_10302 模型的真实地理位置（从 ECEF 转换而来）
  const modelLocation = {
    longitude: 114.920133,
    latitude: 27.298075,
    name: 'L16_10302_ECEF_to_ThreeJS.glb'
  };

  console.log(`📍 ${modelLocation.name} 的真实位置:`);
  console.log(`  经度: ${modelLocation.longitude}°`);
  console.log(`  纬度: ${modelLocation.latitude}°\n`);

  // 计算距离
  const distance = Math.sqrt(
    Math.pow(longitude - modelLocation.longitude, 2) +
    Math.pow(latitude - modelLocation.latitude, 2)
  ) * 111000; // 粗略转换为米（1度约111km）

  console.log('📊 距离分析:');
  console.log(`  经度差异: ${(longitude - modelLocation.longitude).toFixed(6)}°`);
  console.log(`  纬度差异: ${(latitude - modelLocation.latitude).toFixed(6)}°`);
  console.log(`  粗略距离: ${distance.toFixed(2)} 米\n`);

  // 判断是否匹配
  const threshold = 1000; // 1公里阈值
  if (distance < threshold) {
    console.log('✅ Cesium 相机位置与模型位置匹配！');
  } else {
    console.log(`❌ Cesium 相机位置与模型位置不匹配！`);
    console.log(`   差距: ${distance.toFixed(2)} 米\n`);

    console.log('💡 建议：将 Cesium 相机移动到模型位置');
    console.log(`\n执行以下代码修复：`);
    console.log(`\nconst Cesium = window.Cesium;`);
    console.log(`const viewer = window.__cesiumViewer__;`);
    console.log(`viewer.camera.setView({`);
    console.log(`  destination: Cesium.Cartesian3.fromDegrees(${modelLocation.longitude}, ${modelLocation.latitude}, 500)`);
    console.log(`});\n`);

    // 自动修复
    console.log('🔧 正在自动修复...\n');
    cesiumViewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        modelLocation.longitude,
        modelLocation.latitude,
        500 // 500米高度
      ),
      orientation: {
        heading: 0,
        pitch: -Cesium.Math.PI_OVER_FOUR,
        roll: 0
      }
    });

    console.log('✅ Cesium 相机已移动到模型位置\n');
  }

})();
