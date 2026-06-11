/**
 * 快速修复层1深度配置（控制台版本）
 * 复制此脚本到浏览器控制台执行
 */

(function() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          快速修复：层1深度配置                                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // 获取 viewer
  const viewer = window.__dualCanvasViewer ||
    (window.$vueApp && window.$vueApp.$refs && window.$vueApp.$refs.dualCanvasViewer);

  if (!viewer) {
    console.error('❌ 无法找到 DualCanvasViewer 实例');
    return;
  }

  console.log('✅ 找到 DualCanvasViewer');
  console.log('');

  const r1 = viewer.renderer1;
  const r2 = viewer.renderer2;

  if (!r1 || !r2) {
    console.error('❌ 渲染器未找到');
    return;
  }

  let fixedCount = 0;

  // 修复深度函数
  const fixDepthFunc = (gl, name) => {
    const current = gl.getParameter(gl.DEPTH_FUNC);
    if (current !== gl.LESS) {
      gl.depthFunc(gl.LESS);
      console.log(`✅ ${name}: 深度函数已修复为 LESS`);
      fixedCount++;
    } else {
      console.log(`✓ ${name}: 深度函数正确 (LESS)`);
    }
  };

  // 启用深度测试
  const enableDepthTest = (gl, name) => {
    const enabled = gl.getParameter(gl.DEPTH_TEST);
    if (!enabled) {
      gl.enable(gl.DEPTH_TEST);
      console.log(`✅ ${name}: 深度测试已启用`);
      fixedCount++;
    } else {
      console.log(`✓ ${name}: 深度测试已启用`);
    }
  };

  console.log('🔧 修复层1（原始层）...');
  const gl1 = r1.getContext();
  fixDepthFunc(gl1, '层1');
  enableDepthTest(gl1, '层1');
  console.log('');

  console.log('🔧 修复层2（BIM层）...');
  const gl2 = r2.getContext();
  fixDepthFunc(gl2, '层2');
  enableDepthTest(gl2, '层2');
  console.log('');

  // 检查投影矩阵
  console.log('🔧 检查投影矩阵...');
  const checkProj = (cam, name) => {
    if (!cam || !cam.isPerspectiveCamera) return;
    const p = cam.projectionMatrix;
    const valid = p.elements[10] < 0 && p.elements[11] === -1 && p.elements[14] > 0 && p.elements[15] === 0;
    if (valid) {
      console.log(`✓ ${name}: 投影矩阵正确`);
    } else {
      console.log(`⚠️  ${name}: 投影矩阵可能有问题`);
      cam.updateProjectionMatrix();
    }
  };
  checkProj(viewer.camera1, '层1相机');
  checkProj(viewer.camera2, '层2相机');
  console.log('');

  // 创建守护任务
  if (window._quickDepthFixGuard) {
    clearInterval(window._quickDepthFixGuard);
  }

  window._quickDepthFixGuard = setInterval(() => {
    const gl1 = r1.getContext();
    const gl2 = r2.getContext();

    if (gl1.getParameter(gl1.DEPTH_FUNC) !== gl1.LESS) {
      gl1.depthFunc(gl1.LESS);
    }
    if (gl2.getParameter(gl2.DEPTH_FUNC) !== gl2.LESS) {
      gl2.depthFunc(gl2.LESS);
    }
    if (!gl1.getParameter(gl1.DEPTH_TEST)) {
      gl1.enable(gl1.DEPTH_TEST);
    }
    if (!gl2.getParameter(gl2.DEPTH_TEST)) {
      gl2.enable(gl2.DEPTH_TEST);
    }
  }, 500);

  // 创建停止函数
  window._stopQuickFix = () => {
    if (window._quickDepthFixGuard) {
      clearInterval(window._quickDepthFixGuard);
      delete window._quickDepthFixGuard;
      console.log('✅ 守护任务已停止');
    }
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 修复完成！共修复 ${fixedCount} 项`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 已启动守护任务（每500ms检查一次）');
  console.log('   使用 _stopQuickFix() 停止守护任务');
  console.log('');
})();
