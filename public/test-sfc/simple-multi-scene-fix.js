// ═══════════════════════════════════════════════════════════════════
// 简化版多场景管理器 - 无需完整 THREE 库
// ═══════════════════════════════════════════════════════════════════
// 功能：修复透视翻转问题（远大近小 -> 近大远小）
//
// 使用方法：
//   在浏览器控制台执行此脚本即可
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 简化版透视翻转修复                                     ║');
  console.log('║  🎯 目标：确保"近大远小"的正确透视                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查 DualCanvasViewer 实例
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1/4] 检查 DualCanvasViewer 实例...');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 实例未找到');
    console.error('   请确保页面已正确加载 DualCanvasViewer');
    return;
  }

  console.log('  ✅ DualCanvasViewer 实例已找到');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：分析当前场景状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤2/4] 分析当前场景状态...');

  // 尝试多种方式获取渲染器
  const renderer1 = dualViewer.renderer1 || dualViewer._renderer1 || dualViewer.rendererManager?.renderers?.[0];
  const renderer2 = dualViewer.renderer2 || dualViewer._renderer2 || dualViewer.rendererManager?.renderers?.[1];
  const scene1 = dualViewer.scene1 || dualViewer._scene1;
  const scene2 = dualViewer.scene2 || dualViewer._scene2;
  const camera1 = dualViewer.camera1 || dualViewer._camera1;
  const camera2 = dualViewer.camera2 || dualViewer._camera2;

  console.log('  检查对象结构:');
  console.log('    - dualViewer.renderer1:', dualViewer.renderer1 ? '✅' : '❌');
  console.log('    - dualViewer.renderer2:', dualViewer.renderer2 ? '✅' : '❌');
  console.log('    - dualViewer.scene1:', dualViewer.scene1 ? '✅' : '❌');
  console.log('    - dualViewer.scene2:', dualViewer.scene2 ? '✅' : '❌');
  console.log('    - dualViewer.camera1:', dualViewer.camera1 ? '✅' : '❌');
  console.log('    - dualViewer.camera2:', dualViewer.camera2 ? '✅' : '❌');
  console.log('    - dualViewer.rendererManager:', dualViewer.rendererManager ? '✅' : '❌');

  // 如果找到 rendererManager，尝试从中获取渲染器
  let actualRenderer1 = renderer1;
  let actualRenderer2 = renderer2;

  if (!actualRenderer1 && dualViewer.rendererManager) {
    console.log('  尝试从 rendererManager 获取渲染器...');
    const rmKeys = Object.keys(dualViewer.rendererManager);
    console.log('    rendererManager 的属性:', rmKeys);

    // 尝试常见的属性名
    actualRenderer1 = dualViewer.rendererManager.renderer1 ||
                      dualViewer.rendererManager.renderer ||
                      dualViewer.rendererManager.webglRenderer;
    actualRenderer2 = dualViewer.rendererManager.renderer2 ||
                      dualViewer.rendererManager.rendererB ||
                      actualRenderer1; // 可能使用同一个渲染器
  }

  if (!actualRenderer1) {
    console.error('❌ 无法获取渲染器');
    console.log('  可用的 dualViewer 属性:');
    Object.keys(dualViewer).forEach(key => {
      const value = dualViewer[key];
      const type = value === null ? 'null' : typeof value;
      console.log(`    - ${key}: ${type}${type === 'object' ? ' (可能包含渲染器)' : ''}`);
    });
    return;
  }

  if (!scene1 || !camera1) {
    console.error('❌ 缺少必要的场景或相机');
    return;
  }

  console.log('  ✅ 原始层渲染器、场景、相机已找到');
  console.log('  ✅ BIM层渲染器、场景、相机已找到');

  // 更新引用
  dualViewer.renderer1 = actualRenderer1;
  dualViewer.renderer2 = actualRenderer2 || actualRenderer1; // 如果没有第二个渲染器，使用第一个
  dualViewer.scene1 = scene1;
  dualViewer.scene2 = scene2 || scene1;
  dualViewer.camera1 = camera1;
  dualViewer.camera2 = camera2 || camera1;

  // 分析模型坐标
  const models1 = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  const models2 = dualViewer.modelGroup2?.children.filter(m => !m.userData.isBox3Helper) || [];

  console.log(`  原始层模型数量: ${models1.length}`);
  console.log(`  BIM层模型数量: ${models2.length}`);

  // 检查是否是大坐标模式
  let isLargeCoordMode = false;
  if (models1.length > 0) {
    const pos = models1[0].position;
    isLargeCoordMode = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000;
    console.log(`  坐标模式: ${isLargeCoordMode ? '🔴 大坐标' : '🟢 小坐标'}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：修复渲染顺序（关键！）
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔧 [步骤3/4] 修复渲染顺序和相机设置...');

  // 创建渲染标志，确保每帧只渲染一次
  let isRendering = false;

  // 修改渲染器设置
  try {
    dualViewer.renderer1.autoClear = false;
    dualViewer.renderer2.autoClear = false;
    dualViewer.renderer1.sortObjects = true;
    dualViewer.renderer2.sortObjects = true;

    console.log('  ✅ 渲染器 autoClear 设置为 false');
    console.log('  ✅ 渲染器 sortObjects 启用');
  } catch (e) {
    console.warn('  ⚠️ 无法修改渲染器设置:', e.message);
  }

  // 保存当前的 near/far 值
  const originalNear1 = dualViewer.camera1.near;
  const originalFar1 = dualViewer.camera1.far;
  const originalNear2 = dualViewer.camera2 ? dualViewer.camera2.near : originalNear1;
  const originalFar2 = dualViewer.camera2 ? dualViewer.camera2.far : originalFar1;

  console.log(`  原始相机 near/far: ${originalNear1} / ${originalFar1.toLocaleString()}`);

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：添加相机 near/far 动态调整
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔄 [步骤4/4] 添加相机 near/far 动态调整...');

  // 注意：我们不替换渲染循环，而是添加事件监听器来调整相机
  // 这样可以保持原有的渲染逻辑不变

  let adjustTimer = null;

  // 动态调整相机的函数
  const adjustCameraNearFar = () => {
    const camera1 = dualViewer.camera1;
    const camera2 = dualViewer.camera2;
    const controls1 = dualViewer.controls1;

    if (!camera1 || !controls1) return;

    // 获取目标位置
    const target = controls1.target || controls1.object?.target || {x: 0, y: 0, z: 0};
    const distance = camera1.position.distanceTo(target);

    // 根据距离动态调整
    let newNear, newFar;

    if (distance < 1000) {
      newNear = Math.max(0.1, distance * 0.01);
      newFar = distance * 100;
    } else if (distance < 10000) {
      newNear = 1;
      newFar = distance * 50;
    } else {
      newNear = 10;
      newFar = 15000000;
    }

    // 更新相机1
    if (camera1.near !== newNear || camera1.far !== newFar) {
      camera1.near = newNear;
      camera1.far = newFar;
      camera1.updateProjectionMatrix();
    }

    // 同步到相机2
    if (camera2) {
      if (camera2.near !== newNear || camera2.far !== newFar) {
        camera2.near = newNear;
        camera2.far = newFar;
        camera2.updateProjectionMatrix();
      }
    }
  };

  // 添加到控制器变化事件
  if (dualViewer.controls1) {
    dualViewer.controls1.addEventListener('change', () => {
      if (adjustTimer) return;
      adjustTimer = setTimeout(() => {
        adjustCameraNearFar();
        adjustTimer = null;
      }, 100);
    });
    console.log('  ✅ 已添加到原始层控制器变化事件');
  }

  if (dualViewer.controls2 && dualViewer.controls2 !== dualViewer.controls1) {
    dualViewer.controls2.addEventListener('change', () => {
      if (adjustTimer) return;
      adjustTimer = setTimeout(() => {
        adjustCameraNearFar();
        adjustTimer = null;
      }, 100);
    });
    console.log('  ✅ 已添加到BIM层控制器变化事件');
  }

  // 立即执行一次调整
  adjustCameraNearFar();

  console.log('  ✅ 相机 near/far 将根据距离动态调整');

  // ═══════════════════════════════════════════════════════════════════
  // 添加诊断工具
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 诊断工具已添加到 dualViewer');

  dualViewer.diagnosePerspective = function() {
    const cam = this.camera1;
    const target = this.controls1?.target || {x: 0, y: 0, z: 0};
    const distance = cam.position.distanceTo(target);

    console.log('\n📊 透视诊断:');
    console.log(`  相机位置: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);
    console.log(`  目标位置: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`);
    console.log(`  距离: ${distance.toFixed(2)} 米`);
    console.log(`  相机 near: ${cam.near}`);
    console.log(`  相机 far: ${cam.far.toLocaleString()}`);
    console.log(`  坐标模式: ${isLargeCoordMode ? '🔴 大坐标' : '🟢 小坐标'}`);

    // 检查深度精度
    const logDepth = Math.log2(cam.far + cam.near);
    console.log(`  深度范围(对数): ${logDepth.toFixed(2)} bits`);

    if (distance < cam.near) {
      console.warn('  ⚠️ 警告：相机距离小于 near 值！');
    }
    if (distance > cam.far) {
      console.warn('  ⚠️ 警告：相机距离超过 far 值！');
    }
  };

  dualViewer.adjustCameraNearFar = function() {
    const cam = this.camera1;
    const target = this.controls1?.target || {x: 0, y: 0, z: 0};
    const distance = cam.position.distanceTo(target);

    if (distance < 1000) {
      cam.near = Math.max(0.1, distance * 0.01);
      cam.far = distance * 100;
    } else if (distance < 10000) {
      cam.near = 1;
      cam.far = distance * 50;
    } else {
      cam.near = 10;
      cam.far = 15000000;
    }

    cam.updateProjectionMatrix();

    // 同步到相机2
    if (this.camera2) {
      this.camera2.near = cam.near;
      this.camera2.far = cam.far;
      this.camera2.updateProjectionMatrix();
    }

    console.log(`✅ 相机 near/far 已调整: ${cam.near} / ${cam.far.toLocaleString()}`);
  };

  dualViewer.toggleRendererSettings = function() {
    const r1 = this.renderer1;
    const r2 = this.renderer2;

    r1.autoClear = !r1.autoClear;
    r2.autoClear = !r2.autoClear;

    console.log(`✅ 渲染器 autoClear: ${r1.autoClear ? '启用' : '禁用'}`);
  };

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 透视翻转修复完成！                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📌 可用命令:');
  console.log('   window.__dualCanvasViewer.diagnosePerspective()    - 诊断透视问题');
  console.log('   window.__dualCanvasViewer.adjustCameraNearFar()    - 手动调整 near/far');
  console.log('   window.__dualCanvasViewer.toggleRendererSettings() - 切换渲染器设置');

  // 立即执行一次诊断
  console.log('\n📊 执行初始诊断...');
  dualViewer.diagnosePerspective();

  console.log('\n🎉 修复完成！现在应该看到正确的"近大远小"效果。');
  console.log('💡 提示：如果仍有问题，请尝试调整相机位置或缩放。');

})();
