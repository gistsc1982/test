/**
 * 直接执行：修复投影矩阵 [14,10] 元素
 * 使用方法：fetch('/apply-projection-fix.js').then(r=>r.text()).then(eval)
 */

(function() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          修复投影矩阵 [14,10] 元素                                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const viewer = window.__dualCanvasViewer ||
    (window.$vueApp && window.$vueApp.$refs && window.$vueApp.$refs.dualCanvasViewer);

  if (!viewer || !viewer.camera1 || !viewer.camera2) {
    console.error('❌ 相机未找到');
    return;
  }

  console.log('✅ 找到相机');
  console.log('');

  // 修复函数
  const fixProjectionMatrix = (camera) => {
    if (!camera || !camera.isPerspectiveCamera) return;

    const proj = camera.projectionMatrix;
    let fixed = false;
    const fixes = [];

    // 修复 [14,10] - 必须是正值
    if (proj.elements[14] <= 0) {
      const oldValue = proj.elements[14];
      proj.elements[14] = Math.abs(proj.elements[14]);
      fixes.push(`[14,10]: ${oldValue.toFixed(6)} → ${proj.elements[14].toFixed(6)}`);
      fixed = true;
    }

    // 修复 [10,10] - 必须是负值
    if (proj.elements[10] >= 0) {
      const oldValue = proj.elements[10];
      proj.elements[10] = -Math.abs(proj.elements[10]);
      fixes.push(`[10,10]: ${oldValue.toFixed(6)} → ${proj.elements[10].toFixed(6)}`);
      fixed = true;
    }

    // 修复 [11,11] - 必须是 -1
    if (proj.elements[11] !== -1) {
      const oldValue = proj.elements[11];
      proj.elements[11] = -1;
      fixes.push(`[11,11]: ${oldValue} → -1`);
      fixed = true;
    }

    // 修复 [15,15] - 必须是 0
    if (proj.elements[15] !== 0) {
      const oldValue = proj.elements[15];
      proj.elements[15] = 0;
      fixes.push(`[15,15]: ${oldValue} → 0`);
      fixed = true;
    }

    if (fixed) {
      camera.projectionMatrixInverse.copy(proj).invert();
      return fixes;
    }
    return [];
  };

  // 检查并修复
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 修复前状态');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const checkStatus = (camera, name) => {
    const proj = camera.projectionMatrix;
    console.log(`${name}:`);
    console.log(`   [10,10]=${proj.elements[10].toFixed(6)} ${proj.elements[10] < 0 ? '✅' : '❌'}`);
    console.log(`   [11,11]=${proj.elements[11].toFixed(6)} ${proj.elements[11] === -1 ? '✅' : '❌'}`);
    console.log(`   [14,10]=${proj.elements[14].toFixed(6)} ${proj.elements[14] > 0 ? '✅' : '❌'}`);
    console.log(`   [15,15]=${proj.elements[15].toFixed(6)} ${proj.elements[15] === 0 ? '✅' : '❌'}`);
    console.log('');
  };

  checkStatus(viewer.camera1, '🔷 层1相机');
  checkStatus(viewer.camera2, '🔶 层2相机');

  // 执行修复
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 执行修复');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const fixes1 = fixProjectionMatrix(viewer.camera1);
  const fixes2 = fixProjectionMatrix(viewer.camera2);

  if (fixes1.length > 0) {
    console.log('🔷 层1相机修复:');
    fixes1.forEach(f => console.log(`   ✅ ${f}`));
    console.log('');
  } else {
    console.log('🔷 层1相机: 无需修复 ✅');
    console.log('');
  }

  if (fixes2.length > 0) {
    console.log('🔶 层2相机修复:');
    fixes2.forEach(f => console.log(`   ✅ ${f}`));
    console.log('');
  } else {
    console.log('🔶 层2相机: 无需修复 ✅');
    console.log('');
  }

  // 修复后状态
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 修复后状态');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  checkStatus(viewer.camera1, '🔷 层1相机');
  checkStatus(viewer.camera2, '🔶 层2相机');

  // 锁定 updateProjectionMatrix 方法
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 锁定 updateProjectionMatrix 方法');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const lockCamera = (camera, name) => {
    const originalUpdate = camera.updateProjectionMatrix.bind(camera);

    camera.updateProjectionMatrix = function() {
      originalUpdate.call(this);
      fixProjectionMatrix(this);
    };

    console.log(`✅ ${name} updateProjectionMatrix 已锁定`);
  };

  lockCamera(viewer.camera1, '层1相机');
  lockCamera(viewer.camera2, '层2相机');

  console.log('');

  // 启动守护任务
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 启动守护任务');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // 清除旧的守护任务
  if (window._projFixGuards) {
    window._projFixGuards.forEach(g => clearInterval(g));
  }

  window._projFixGuards = [];

  // 守护：每100ms检查并修复投影矩阵
  window._projFixGuards.push(setInterval(() => {
    fixProjectionMatrix(viewer.camera1);
    fixProjectionMatrix(viewer.camera2);
  }, 100));

  console.log(`✅ 已启动守护任务（每100ms检查一次）`);

  // 创建停止函数
  window._stopProjFix = () => {
    if (window._projFixGuards) {
      window._projFixGuards.forEach(g => clearInterval(g));
      window._projFixGuards = [];
      console.log('✅ 守护任务已停止');
    }
  };

  // 创建检查函数
  window._checkProjFix = () => {
    console.log('========== 投影矩阵状态 ==========');
    checkStatus(viewer.camera1, '层1相机');
    checkStatus(viewer.camera2, '层2相机');
  };

  console.log('');
  console.log('💡 可用命令:');
  console.log('   - _checkProjFix()     检查投影矩阵状态');
  console.log('   - _stopProjFix()      停止守护任务');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 修复完成');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 请验证：');
  console.log('   1. 旋转相机，检查透视是否正常（近大远小）');
  console.log('   2. 缩放相机，检查是否出现翻转');
  console.log('   3. 使用 _checkProjFix() 检查状态');
  console.log('');

})();
