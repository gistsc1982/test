// 验证深度函数状态

const viewer = window.__dualCanvasViewer;
if (!viewer.renderer1) {
  console.error('❌ Renderer1 不存在');
  throw new Error('Renderer1 不存在');
}

const renderer = viewer.renderer1;
const gl = renderer.getContext();

const currentFunc = gl.getParameter(gl.DEPTH_FUNC);

console.log('========== 当前深度函数状态 ==========');
console.log('Renderer1 深度函数:', currentFunc === gl.LESS ? 'LESS ✅' : currentFunc === gl.LEQUAL ? 'LEQUAL ❌' : currentFunc);
console.log('');

// 如果不是 LESS，再次修复
if (currentFunc !== gl.LESS) {
  console.log('⚠️  深度函数不是 LESS，正在修复...');
  gl.depthFunc(gl.LESS);
  console.log('✅ 已设置为 LESS');
  console.log('');
  console.log('请再次检查透视是否恢复正常');
} else {
  console.log('深度函数已经是 LESS');
  console.log('如果透视还是翻转，问题可能不在深度函数');
  console.log('');
  console.log('可能的其他原因:');
  console.log('1. 投影矩阵问题');
  console.log('2. 相机方向问题');
  console.log('3. 模型变换矩阵问题');
}

console.log('');
console.log('========== 其他检查 ==========');

// 检查相机
if (viewer.camera1) {
  const cam = viewer.camera1;
  console.log('相机位置:', cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2));
  console.log('near:', cam.near, 'far:', cam.far);

  // 计算方向
  const target = viewer.controls1?.target;
  if (target) {
    const direction = new THREE.Vector3().subVectors(target, cam.position).normalize();
    console.log('相机方向:', direction.x.toFixed(4), direction.y.toFixed(4), direction.z.toFixed(4));
  }
}

console.log('');
console.log('========== 检查完成 ==========');
