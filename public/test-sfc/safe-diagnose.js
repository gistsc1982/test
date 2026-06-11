/**
 * 安全诊断 - 只检查，不修改
 */

console.log('='.repeat(80));
console.log('🔍 安全诊断 - 检查深度设置');
console.log('='.repeat(80));

const dualViewer = window.__dualCanvasViewerInstances &&
                  window.__dualCanvasViewerInstances.length > 0 &&
                  window.__dualCanvasViewerInstances[0];

if (!dualViewer) {
  console.error('❌ 无法找到 DualCanvasViewer 实例');
} else {
  console.log('✅ 找到 DualCanvasViewer 实例\n');

  const DEPTH_FUNCS = {
    0: 'NeverDepth',
    1: 'AlwaysDepth',
    2: 'LessDepth',
    3: 'EqualDepth',
    4: 'LessEqualDepth',
    5: 'GreaterDepth',
    6: 'NotEqualDepth',
    7: 'GreaterEqualDepth'
  };

  // 检查层1
  console.log('📍 层1（场景1）材质统计:');
  if (dualViewer.scene1) {
    const stats1 = {};
    dualViewer.scene1.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material && material.depthFunc !== undefined) {
            stats1[material.depthFunc] = (stats1[material.depthFunc] || 0) + 1;
          }
        });
      }
    });

    Object.entries(stats1).forEach(([func, count]) => {
      console.log(`   ${DEPTH_FUNCS[func]} (${func}): ${count} 个材质`);
    });
  }

  // 检查层2
  console.log('\n📍 层2（场景2）材质统计:');
  if (dualViewer.scene2) {
    const stats2 = {};
    dualViewer.scene2.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material && material.depthFunc !== undefined) {
            stats2[material.depthFunc] = (stats2[material.depthFunc] || 0) + 1;
          }
        });
      }
    });

    Object.entries(stats2).forEach(([func, count]) => {
      console.log(`   ${DEPTH_FUNCS[func]} (${func}): ${count} 个材质`);
    });
  }

  // 检查渲染器
  console.log('\n📍 渲染器状态:');
  let renderer = null;
  if (dualViewer.usesRendererManager2 && window.rendererManager) {
    renderer = window.rendererManager.getRenderer();
  } else if (dualViewer.renderer2) {
    renderer = dualViewer.renderer2;
  }

  if (renderer) {
    const gl = renderer.getContext();
    const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
    const depthTest = gl.getParameter(gl.DEPTH_TEST);
    const depthWrite = gl.getParameter(gl.DEPTH_WRITEMASK);

    console.log(`   WebGL 深度函数: ${depthFunc} (${{
      512: 'LESS',
      514: 'LEQUAL',
      515: 'GREATER'
    }[depthFunc] || depthFunc})`);
    console.log(`   深度测试: ${depthTest ? '启用' : '禁用'}`);
    console.log(`   深度写入: ${depthWrite ? '启用' : '禁用'}`);
    console.log(`   对数深度缓冲: ${renderer.capabilities.isLogarithmicDepthBuffer ? '是' : '否'}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 分析结果:');
  console.log('='.repeat(80));

  // 分析是否有问题
  let hasProblem = false;

  if (dualViewer.scene2) {
    dualViewer.scene2.traverse((object) => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material && material.depthFunc === 5) { // GreaterDepth
            hasProblem = true;
          }
        });
      }
    });

    if (hasProblem) {
      console.log('⚠️  发现问题：层2有材质使用 GreaterDepth（会导致透视反转）');
    } else {
      console.log('✅ 层2材质深度设置正常');
    }
  }

  console.log('\n💡 建议：');
  console.log('   1. 如果地图背景消失，请刷新页面');
  console.log('   2. 层2的缩放问题可能不是深度函数导致的');
  console.log('   3. 真正的问题可能在相机缩放同步逻辑\n');
}

console.log('\n');
