// ═══════════════════════════════════════════════════════════════════
// 一键测试多场景管理器
// ═══════════════════════════════════════════════════════════════════
// 使用方法：在浏览器控制台直接复制粘贴此脚本执行
// ═══════════════════════════════════════════════════════════════════

(async function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 多场景管理器 - 一键测试脚本                          ║');
  console.log('║  📊 分层 Near/Far 架构                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 工具函数：加载脚本
  // ═══════════════════════════════════════════════════════════════════
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查 DualCanvasViewer
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1/5] 检查 DualCanvasViewer 实例...');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 实例未找到');
    console.error('   请确保页面已正确加载 DualCanvasViewer');
    return;
  }
  console.log('  ✅ DualCanvasViewer 实例已找到');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：显示当前状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤2/5] 当前场景状态...');

  const models1 = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  const models2 = dualViewer.modelGroup2?.children.filter(m => !m.userData.isBox3Helper) || [];

  console.log(`  原始层模型: ${models1.length} 个`);
  console.log(`  BIM层模型: ${models2.length} 个`);

  // 显示前几个模型的坐标
  if (models1.length > 0) {
    console.log('\n  原始层模型坐标示例:');
    models1.slice(0, Math.min(3, models1.length)).forEach((model, i) => {
      const pos = model.position;
      const type = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000 ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${type} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  if (models2.length > 0) {
    console.log('\n  BIM层模型坐标示例:');
    models2.slice(0, Math.min(3, models2.length)).forEach((model, i) => {
      const pos = model.position;
      const type = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000 ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${type} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：加载多场景管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📦 [步骤3/5] 加载多场景管理器...');

  try {
    // 尝试从 public 目录加载
    await loadScript('multi-scene-manager.js');
    console.log('  ✅ 多场景管理器已加载');
  } catch (error) {
    console.error('❌ 无法加载 multi-scene-manager.js');
    console.error('   请确保文件在正确的位置');
    console.error('   或手动复制代码到控制台');
    return;
  }

  // 等待一小段时间确保脚本初始化
  await new Promise(resolve => setTimeout(resolve, 100));

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：初始化多场景架构
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🏗️ [步骤4/5] 初始化多场景架构...');

  let manager;
  try {
    manager = new window.MultiSceneManager(dualViewer);
    manager.initialize();
    console.log('  ✅ 多场景架构初始化成功');
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('   错误详情:', error.stack);
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：显示结果
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤5/5] 多场景架构结果...');

  const debugInfo = manager.getDebugInfo();

  console.log('\n  🎬 场景模型分布:');
  console.log(`    原始层-大坐标场景: ${debugInfo.scenes.layer1Large} 个模型`);
  console.log(`    原始层-小坐标场景: ${debugInfo.scenes.layer1Small} 个模型`);
  console.log(`    BIM层-大坐标场景: ${debugInfo.scenes.layer2Large} 个模型`);
  console.log(`    BIM层-小坐标场景: ${debugInfo.scenes.layer2Small} 个模型`);

  console.log('\n  📷 相机 Near/Far 配置:');
  console.log(`    原始层-大坐标: near=${debugInfo.cameras.layer1Large.near}, far=${debugInfo.cameras.layer1Large.far.toLocaleString()}`);
  console.log(`    原始层-小坐标: near=${debugInfo.cameras.layer1Small.near}, far=${debugInfo.cameras.layer1Small.far}`);
  console.log(`    BIM层-大坐标: near=${debugInfo.cameras.layer2Large.near}, far=${debugInfo.cameras.layer2Large.far.toLocaleString()}`);
  console.log(`    BIM层-小坐标: near=${debugInfo.cameras.layer2Small.near}, far=${debugInfo.cameras.layer2Small.far}`);

  if (debugInfo.referencePoints.layer1) {
    console.log('\n  📍 坐标参考点:');
    console.log(`    原始层: (${debugInfo.referencePoints.layer1.x.toFixed(2)}, ${debugInfo.referencePoints.layer1.y.toFixed(2)}, ${debugInfo.referencePoints.layer1.z.toFixed(2)})`);
  }
  if (debugInfo.referencePoints.layer2) {
    console.log(`    BIM层: (${debugInfo.referencePoints.layer2.x.toFixed(2)}, ${debugInfo.referencePoints.layer2.y.toFixed(2)}, ${debugInfo.referencePoints.layer2.z.toFixed(2)})`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ 多场景架构部署完成！                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 保存到全局
  window.__multiSceneManager = manager;

  console.log('📌 管理器已保存到: window.__multiSceneManager');
  console.log('📌 可用命令:');
  console.log('   window.__multiSceneManager.getDebugInfo()  - 查看调试信息');
  console.log('   window.__multiSceneManager.syncCameras()    - 手动同步相机');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // 加载调试工具
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔧 正在加载调试工具...');

  try {
    await loadScript('multi-scene-debug.js');
    console.log('  ✅ 调试工具已加载');
    console.log('\n📌 调试命令:');
    console.log('   showMultiSceneDebug()     - 显示调试面板');
    console.log('   hideMultiSceneDebug()     - 隐藏调试面板');
    console.log('   printMultiSceneDebug()    - 打印调试信息');
    console.log('');

    // 自动显示调试面板
    setTimeout(() => {
      if (typeof window.showMultiSceneDebug === 'function') {
        console.log('🎯 自动显示调试面板...');
        window.showMultiSceneDebug();
      }
    }, 500);

  } catch (error) {
    console.warn('⚠️ 调试工具加载失败（不影响核心功能）');
  }

})();
