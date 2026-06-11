// ═══════════════════════════════════════════════════════════════════
// 快速透视测试 - 创建测试立方体
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔍 快速透视测试                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 未找到');
    return;
  }

  const camera = dualViewer.camera1;
  const scene = dualViewer._originalScene1 || dualViewer.scene1;

  if (!camera || !scene) {
    console.error('❌ 相机或场景未找到');
    return;
  }

  // 显示当前相机信息
  console.log('📊 相机信息:');
  console.log('  位置:', `(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
  console.log('  near:', camera.near);
  console.log('  far:', camera.far);
  console.log('  fov:', (camera.fov * 180 / Math.PI).toFixed(2), '度');

  // 计算相机方向
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  console.log('  方向:', `(${direction.x.toFixed(4)}, ${direction.y.toFixed(4)}, ${direction.z.toFixed(4)})`);

  // 创建测试立方体
  console.log('\n🎨 创建测试立方体...\n');

  const testGroup = new THREE.Group();

  const testCases = [
    { color: 0xff0000, distance: 100, size: 10, name: '红色 (100米 - 近)' },
    { color: 0x00ff00, distance: 200, size: 10, name: '绿色 (200米 - 中)' },
    { color: 0x0000ff, distance: 400, size: 10, name: '蓝色 (400米 - 远)' }
  ];

  testCases.forEach(({ color, distance, size, name }) => {
    try {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const cube = new THREE.Mesh(geometry, material);

      // 将立方体放在相机前方
      const offset = direction.clone().multiplyScalar(distance);
      cube.position.copy(camera.position).add(offset);

      cube.userData.name = name;
      cube.userData.isTestCube = true;
      cube.userData.distance = distance;
      testGroup.add(cube);

      console.log(`  ✅ ${name}: 位置 (${cube.position.x.toFixed(2)}, ${cube.position.y.toFixed(2)}, ${cube.position.z.toFixed(2)})`);
    } catch (e) {
      console.error(`  ❌ 创建${name}失败:`, e.message);
    }
  });

  scene.add(testGroup);
  dualViewer._testGroup = testGroup;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 测试场景已创建！                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('🔍 请观察屏幕上的立方体：\n');
  console.log('  🔴 红色立方体 (100米) - 应该看起来最大');
  console.log('  🟢 绿色立方体 (200米) - 应该看起来中等');
  console.log('  🔵 蓝色立方体 (400米) - 应该看起来最小\n');

  console.log('💡 如果你看到：');
  console.log('  - 蓝色比红色大 → 透视反转了（远大近小）');
  console.log('  - 红色比蓝色大 → 透视正常（近大远小）\n');

  console.log('📌 可用命令：');
  console.log('   清除测试场景: window.__clearTestScene()');
  console.log('   查看相机: console.log(window.__dualCanvasViewer.camera1)');

  // 提供清除函数
  window.__clearTestScene = function() {
    if (dualViewer._testGroup) {
      scene.remove(dualViewer._testGroup);
      dualViewer._testGroup = null;
      console.log('  ✅ 测试场景已清除');
    }
  };

})();
