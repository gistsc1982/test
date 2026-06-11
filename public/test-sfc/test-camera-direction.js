// 对比真实世界模式和当前模式的相机状态

console.log('========== 相机状态对比 ==========');

const viewer = window.__dualCanvasViewer;
if (!viewer || !viewer.camera1) {
  console.error('❌ 相机未找到');
  throw new Error('相机未找到');
}

const cam = viewer.camera1;

console.log('📊 当前相机状态:');
console.log('  位置:', cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2));
console.log('  near:', cam.near);
console.log('  far:', cam.far);
console.log('  FOV:', cam.fov);
console.log('  aspect:', cam.aspect.toFixed(4));
console.log('  up:', cam.up.x.toFixed(4), cam.up.y.toFixed(4), cam.up.z.toFixed(4));
console.log('  quaternion:', cam.quaternion.x.toFixed(4), cam.quaternion.y.toFixed(4), cam.quaternion.z.toFixed(4), cam.quaternion.w.toFixed(4));

console.log('');
console.log('📊 投影矩阵:');
const proj = cam.projectionMatrix;
console.log('  [0,0]=', proj.elements[0].toFixed(4));
console.log('  [5,5]=', proj.elements[5].toFixed(4));
console.log('  [10,10]=', proj.elements[10].toFixed(4));
console.log('  [11,11]=', proj.elements[11].toFixed(4));
console.log('  [14,10]=', proj.elements[14].toFixed(4));
console.log('  [15,15]=', proj.elements[15].toFixed(4));

console.log('');
console.log('🔍 测试1: 翻转相机的 up 向量...');
const originalUp = cam.up.clone();
cam.up.set(0, -1, 0);
cam.updateMatrixWorld();
console.log('  已翻转 up 向量为 (0, -1, 0)');
console.log('  请观察5秒...');

setTimeout(() => {
  cam.up.copy(originalUp);
  cam.updateMatrixWorld();
  console.log('  已恢复原始 up 向量');
  console.log('');
  console.log('🔍 测试2: 翻转相机的 lookAt 方向...');

  const target = viewer.controls1?.target || new THREE.Vector3(0, 0, 0);
  const oppositeTarget = new THREE.Vector3(
    cam.position.x * 2 - target.x,
    cam.position.y * 2 - target.y,
    cam.position.z * 2 - target.z
  );

  cam.lookAt(oppositeTarget);
  cam.updateMatrixWorld();
  console.log('  已看向相反方向');
  console.log('  请观察5秒...');

  setTimeout(() => {
    cam.lookAt(target);
    cam.updateMatrixWorld();
    console.log('');
    console.log('========== 测试完成 ==========');
    console.log('请告诉以上哪个测试让透视恢复正常？');
    console.log('- 翻转 up 向量？');
    console.log('- 翻转 lookAt 方向？');
    console.log('- 都没有？');
  }, 5000);
}, 5000);
