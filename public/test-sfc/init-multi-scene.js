// ═══════════════════════════════════════════════════════════════════
// 初始化多场景管理器 - 使用示例
// ═══════════════════════════════════════════════════════════════════
// 使用方法：
// 1. 首先加载 multi-scene-manager.js
// 2. 在浏览器控制台执行此脚本
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 初始化多场景管理器                                   ║');
  console.log('║  📊 分层 Near/Far 架构                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤1：检查 DualCanvasViewer 实例
  // ═══════════════════════════════════════════════════════════════════
  console.log('🔍 [步骤1] 检查 DualCanvasViewer 实例...');

  const dualViewer = window.__dualCanvasViewer;
  if (!dualViewer) {
    console.error('❌ DualCanvasViewer 实例未找到');
    console.error('   请确保页面已正确加载 DualCanvasViewer');
    return;
  }

  console.log('  ✅ DualCanvasViewer 实例已找到');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤2：检查多场景管理器是否已加载
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🔍 [步骤2] 检查多场景管理器...');

  if (typeof window.MultiSceneManager === 'undefined') {
    console.error('❌ 多场景管理器未加载');
    console.error('   请先加载 multi-scene-manager.js');
    console.error('\n   加载方法：');
    console.error('   1. 在 HTML 中添加：');
    console.error('      <script src="multi-scene-manager.js"></script>');
    console.error('   2. 或在控制台执行：');
    console.error('      const script = document.createElement("script");');
    console.error('      script.src = "multi-scene-manager.js";');
    console.error('      document.head.appendChild(script);');
    return;
  }

  console.log('  ✅ 多场景管理器已加载');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤3：显示当前状态
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n📊 [步骤3] 当前状态...');

  const models1 = dualViewer.modelGroup1?.children.filter(m => !m.userData.isBox3Helper) || [];
  const models2 = dualViewer.modelGroup2?.children.filter(m => !m.userData.isBox3Helper) || [];

  console.log(`  原始层模型数量: ${models1.length}`);
  console.log(`  BIM层模型数量: ${models2.length}`);

  // 显示模型坐标信息
  if (models1.length > 0) {
    console.log('\n  原始层模型坐标:');
    models1.slice(0, 3).forEach((model, i) => {
      const pos = model.position;
      const coordType = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000 ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${coordType} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  if (models2.length > 0) {
    console.log('\n  BIM层模型坐标:');
    models2.slice(0, 3).forEach((model, i) => {
      const pos = model.position;
      const coordType = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000 ? '🔴 大坐标' : '🟢 小坐标';
      console.log(`    模型 ${i + 1}: ${coordType} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 步骤4：创建并初始化多场景管理器
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🏗️ [步骤4] 创建多场景管理器...');

  const manager = new window.MultiSceneManager(dualViewer);

  console.log('  ✅ 多场景管理器已创建');

  // ═══════════════════════════════════════════════════════════════════
  // 步骤5：初始化多场景架构
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🚀 [步骤5] 初始化多场景架构...');

  try {
    const result = manager.initialize();

    if (result === false) {
      console.error('\n❌ 多场景管理器初始化失败');
      console.error('   请检查控制台中的错误信息以获取更多详情');
      return;
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ 多场景管理器初始化成功！                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // ═══════════════════════════════════════════════════════════════════
    // 步骤6：显示初始化结果
    // ═══════════════════════════════════════════════════════════════════
    console.log('📊 [步骤6] 初始化结果...');

    const debugInfo = manager.getDebugInfo();

    console.log('\n  场景模型数量:');
    console.log(`    原始层大坐标场景: ${debugInfo.scenes.layer1Large} 个模型`);
    console.log(`    原始层小坐标场景: ${debugInfo.scenes.layer1Small} 个模型`);
    console.log(`    BIM层大坐标场景: ${debugInfo.scenes.layer2Large} 个模型`);
    console.log(`    BIM层小坐标场景: ${debugInfo.scenes.layer2Small} 个模型`);

    console.log('\n  相机 Near/Far 配置:');
    console.log(`    原始层大坐标: near=${debugInfo.cameras.layer1Large.near}, far=${debugInfo.cameras.layer1Large.far}`);
    console.log(`    原始层小坐标: near=${debugInfo.cameras.layer1Small.near}, far=${debugInfo.cameras.layer1Small.far}`);
    console.log(`    BIM层大坐标: near=${debugInfo.cameras.layer2Large.near}, far=${debugInfo.cameras.layer2Large.far}`);
    console.log(`    BIM层小坐标: near=${debugInfo.cameras.layer2Small.near}, far=${debugInfo.cameras.layer2Small.far}`);

    if (debugInfo.referencePoints.layer1) {
      console.log('\n  参考点:');
      console.log(`    原始层: (${debugInfo.referencePoints.layer1.x.toFixed(2)}, ${debugInfo.referencePoints.layer1.y.toFixed(2)}, ${debugInfo.referencePoints.layer1.z.toFixed(2)})`);
    }
    if (debugInfo.referencePoints.layer2) {
      console.log(`    BIM层: (${debugInfo.referencePoints.layer2.x.toFixed(2)}, ${debugInfo.referencePoints.layer2.y.toFixed(2)}, ${debugInfo.referencePoints.layer2.z.toFixed(2)})`);
    }

    console.log('\n🎉 多场景架构已成功部署！');
    console.log('📌 管理器已保存到: window.__multiSceneManager');
    console.log('📌 可以使用以下命令查看调试信息:');
    console.log('   window.__multiSceneManager.getDebugInfo()');

    // 保存到全局
    window.__multiSceneManager = manager;

  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    console.error('   错误详情:', error.stack);
  }

})();
