// 测试翻转投影矩阵的深度值

const viewer = window.__dualCanvasViewer;
if (!viewer.camera1) {
  console.error('❌ 相机未找到');
  throw new Error('相机未找到');
}

console.log('========== 测试翻转投影矩阵 ==========');

const cam = viewer.camera1;
console.log('当前 near:', cam.near, 'far:', cam.far);

// 方法1: 翻转投影矩阵的深度计算
console.log('');
console.log('🔍 测试1: 翻转投影矩阵深度值...');

const near = cam.near;
const far = cam.far;
const aspect = cam.aspect;
const fov = cam.fov * (Math.PI / 180);

const f = 1.0 / Math.tan(fov / 2);

// 标准投影矩阵
cam.projectionMatrix.set(
  f / aspect, 0, 0, 0,
  0, f, 0, 0,
  0, 0, (far + near) / (near - far), -1,
  0, 0, 2 * far * near / (near - far), 0
);

cam.updateProjectionMatrix();

console.log('已设置标准投影矩阵');
console.log('请观察5秒...');

setTimeout(() => {
  console.log('');
  console.log('🔍 测试2: 翻转深度值符号...');

  // 尝试翻转深度相关值的符号
  cam.projectionMatrix.elements[10] = -(far + near) / (near - far);
  cam.projectionMatrix.elements[14] = -(2 * far * near / (near - far));

  cam.updateProjectionMatrix();

  console.log('已翻转深度值符号');
  console.log('请观察5秒...');

  setTimeout(() => {
    console.log('');
    console.log('========== 测试完成 ==========');
    console.log('请告诉哪个测试让透视恢复正常？');
  }, 5000);
}, 5000);
