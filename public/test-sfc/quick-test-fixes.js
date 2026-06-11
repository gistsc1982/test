// 直接尝试所有可能的透视修复方案

console.log('========== 尝试所有透视修复方案 ==========');

const viewer = window.__dualCanvasViewer;
if (!viewer.camera1 || !viewer.renderer1) {
  console.error('❌ 必要的组件未找到');
  throw new Error('必要的组件未找到');
}

const cam = viewer.camera1;
const renderer = viewer.renderer1;

console.log('当前状态:');
console.log('  near:', cam.near.toFixed(2));
console.log('  far:', cam.far.toFixed(2));
console.log('  深度函数:', renderer.getContext().getParameter(renderer.getContext().DEPTH_FUNC));

console.log('');
console.log('🔧 尝试方案1: 极小的 near/far...');

// 保存原始值
const originalNear = cam.near;
const originalFar = cam.far;
const originalUp = cam.up.clone();
const originalProj = cam.projectionMatrix.clone();

cam.near = 1;
cam.far = 100;
cam.updateProjectionMatrix();

console.log('已设置 near=1, far=100，请观察5秒...');

setTimeout(() => {
  console.log('');
  console.log('🔧 尝试方案2: 翻转投影矩阵 [10,10] 元素...');

  cam.near = 0.1;
  cam.far = 10000;
  cam.updateProjectionMatrix();

  cam.projectionMatrix.elements[10] *= -1;
  cam.updateProjectionMatrix();

  console.log('已翻转 [10,10]，请观察5秒...');

  setTimeout(() => {
    console.log('');
    console.log('🔧 尝试方案3: 翻转 up 向量...');

    cam.projectionMatrix.copy(originalProj);
    cam.updateProjectionMatrix();

    cam.up.y = -1;
    cam.updateMatrixWorld();

    console.log('已翻转 up 向量，请观察5秒...');

    setTimeout(() => {
      console.log('');
      console.log('========== 测试完成 ==========');
      console.log('请告诉哪个方案（如果有）让透视恢复正常？');
      console.log('方案1: near=1, far=100');
      console.log('方案2: 翻转 [10,10] 元素');
      console.log('方案3: 翻转 up 向量');
      console.log('如果没有，我会尝试更多方案');

      // 恢复原始值
      cam.near = originalNear;
      cam.far = originalFar;
      cam.up.copy(originalUp);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
    }, 5000);
  }, 5000);
}, 5000);
