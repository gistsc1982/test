/**
 * 全面诊断地图显示问题
 */

console.log('='.repeat(80));
console.log('🔍 全面诊断地图显示问题');
console.log('='.repeat(80));

// 1. 检查 DOM 元素
console.log('\n📍 步骤 1: 检查 DOM 元素');
console.log('-'.repeat(80));

const app = document.getElementById('app');
console.log('app 元素:', app ? '存在' : '不存在');

if (app) {
  console.log('app 子元素数量:', app.children.length);

  // 列出所有子元素
  Array.from(app.children).forEach((child, index) => {
    console.log(`  子元素 ${index + 1}:`);
    console.log(`    - tagName: ${child.tagName}`);
    console.log(`    - id: ${child.id || '(无)'}`);
    console.log(`    - class: ${child.className || '(无)'}`);

    const style = window.getComputedStyle(child);
    console.log(`    - display: ${style.display}`);
    console.log(`    - visibility: ${style.visibility}`);
    console.log(`    - opacity: ${style.opacity}`);
    console.log(`    - z-index: ${style.zIndex}`);
    console.log(`    - position: ${style.position}`);
  });
}

// 2. 检查所有 Canvas
console.log('\n📍 步骤 2: 检查所有 Canvas');
console.log('-'.repeat(80));

const allCanvases = document.querySelectorAll('canvas');
console.log(`总共找到 ${allCanvases.length} 个 canvas`);

allCanvases.forEach((canvas, index) => {
  const style = window.getComputedStyle(canvas);
  const rect = canvas.getBoundingClientRect();
  const parent = canvas.parentElement;

  console.log(`\n  Canvas ${index + 1}:`);
  console.log(`    - id: ${canvas.id || '(无)'}`);
  console.log(`    - 父元素: ${parent?.tagName || '(无)'} #${parent?.id || ''}`);
  console.log(`    - size: ${canvas.width}x${canvas.height}`);
  console.log(`    - display: ${style.display}`);
  console.log(`    - visibility: ${style.visibility}`);
  console.log(`    - opacity: ${style.opacity}`);
  console.log(`    - z-index: ${style.zIndex}`);
  console.log(`    - position: ${style.position}`);
  console.log(`    - 位置: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})`);
  console.log(`    - 可见区域: ${rect.width > 0 && rect.height > 0 ? '是' : '否'}`);
});

// 3. 检查 Cesium Viewer
console.log('\n📍 步骤 3: 检查 Cesium Viewer');
console.log('-'.repeat(80));

const cesiumViewer = window.__cesiumViewer__;
console.log('window.__cesiumViewer__:', cesiumViewer ? '存在' : '不存在');

if (cesiumViewer) {
  console.log('✅ Cesium Viewer 存在');

  const cesiumContainer = document.getElementById('cesiumContainer');
  console.log('cesiumContainer 元素:', cesiumContainer ? '存在' : '不存在');

  if (cesiumContainer) {
    const style = window.getComputedStyle(cesiumContainer);
    console.log('  cesiumContainer 样式:');
    console.log(`    - display: ${style.display}`);
    console.log(`    - visibility: ${style.visibility}`);
    console.log(`    - opacity: ${style.opacity}`);
    console.log(`    - z-index: ${style.zIndex}`);
    console.log(`    - position: ${style.position}`);
    console.log(`    - width: ${style.width}`);
    console.log(`    - height: ${style.height}`);
  }

  console.log('\n  Cesium Viewer 状态:');
  console.log(`    - canvas: ${cesiumViewer.canvas ? '存在' : '不存在'}`);
  console.log(`    - scene: ${cesiumViewer.scene ? '存在' : '不存在'}`);
  console.log(`    - camera: ${cesiumViewer.camera ? '存在' : '不存在'}`);

  if (cesiumViewer.scene) {
    console.log(`    - globe: ${cesiumViewer.scene.globe ? '存在' : '不存在'}`);
    console.log(`    - globe.show: ${cesiumViewer.scene.globe ? cesiumViewer.scene.globe.show : 'N/A'}`);
    console.log(`    - primitives: ${cesiumViewer.scene.primitives ? '存在' : '不存在'}`);
    console.log(`    - groundPrimitives: ${cesiumViewer.scene.groundPrimitives ? '存在' : '不存在'}`);
  }
}

// 4. 检查 DualCanvasViewer
console.log('\n📍 步骤 4: 检查 DualCanvasViewer');
console.log('-'.repeat(80));

const dualViewer = window.__dualCanvasViewerInstances &&
                  window.__dualCanvasViewerInstances.length > 0 &&
                  window.__dualCanvasViewerInstances[0];

console.log('window.__dualCanvasViewerInstances:', dualViewer ? '存在' : '不存在');

if (dualViewer) {
  console.log('  DualCanvasViewer 状态:');
  console.log(`    - showCesiumLayer: ${dualViewer.showCesiumLayer}`);
  console.log(`    - showThreeLayer: ${dualViewer.showThreeLayer}`);
  console.log(`    - showBimLayer: ${dualViewer.showBimLayer}`);
  console.log(`    - scene1: ${dualViewer.scene1 ? '存在' : '存在'}`);
  console.log(`    - scene2: ${dualViewer.scene2 ? '存在' : '存在'}`);
  console.log(`    - camera1: ${dualViewer.camera1 ? '存在' : '存在'}`);
  console.log(`    - camera2: ${dualViewer.camera2 ? '存在' : '存在'}`);
}

// 5. 尝试修复
console.log('\n📍 步骤 5: 尝试修复');
console.log('-'.repeat(80));

if (cesiumViewer && cesiumViewer.scene) {
  console.log('  正在修复...');

  // 确保 globe 显示
  if (cesiumViewer.scene.globe) {
    cesiumViewer.scene.globe.show = true;
    console.log('  ✅ 已启用 globe.show');
  }

  // 请求渲染
  cesiumViewer.scene.requestRender();
  console.log('  ✅ 已请求渲染');
}

// 6. 最终建议
console.log('\n' + '='.repeat(80));
console.log('📝 诊断结果');
console.log('='.repeat(80));

if (!cesiumViewer) {
  console.log('❌ Cesium Viewer 不存在');
  console.log('   建议：刷新页面重新初始化');
} else if (!cesiumViewer.scene) {
  console.log('❌ Cesium 场景不存在');
  console.log('   建议：刷新页面重新初始化');
} else if (!cesiumViewer.scene.globe) {
  console.log('❌ Cesium globe 不存在');
  console.log('   建议：刷新页面重新初始化');
} else {
  console.log('✅ Cesium 组件都存在');
  console.log('   问题可能是：');
  console.log('   1. Canvas 被其他元素覆盖');
  console.log('   2. Globe 未正确渲染');
  console.log('   3. 样式问题导致不可见');
  console.log('\n   建议：刷新页面');
}

console.log('\n');
