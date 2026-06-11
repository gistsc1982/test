// 简化版调试脚本 - 分步输出

console.log('========== 步骤1: 基本检查 ==========');

const viewer = window.__dualCanvasViewer;
console.log('DualCanvasViewer:', viewer ? '✅' : '❌');
console.log('camera1:', viewer.camera1 ? '✅' : '❌');
console.log('camera2:', viewer.camera2 ? '✅' : '❌');

if (viewer.camera1) {
  const cam = viewer.camera1;
  console.log('near:', cam.near);
  console.log('far:', cam.far);
  console.log('position:', cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2));
}

console.log('');
console.log('========== 步骤2: 测试交换 near/far ==========');

if (viewer.camera1) {
  const cam = viewer.camera1;
  const oldNear = cam.near;
  const oldFar = cam.far;

  console.log('原始值 - near:', oldNear, 'far:', oldFar);

  // 交换
  cam.near = oldFar;
  cam.far = oldNear;
  cam.updateProjectionMatrix();

  console.log('已交换 - near:', cam.near, 'far:', cam.far);
  console.log('请检查透视是否正常...');
  console.log('（将在10秒后恢复）');

  setTimeout(() => {
    cam.near = oldNear;
    cam.far = oldFar;
    cam.updateProjectionMatrix();
    console.log('');
    console.log('========== 已恢复原始值 ==========');
    console.log('near:', cam.near, 'far:', cam.far);
  }, 10000);
}

console.log('');
console.log('========== 请观察：交换后透视是否正常？ ==========');
