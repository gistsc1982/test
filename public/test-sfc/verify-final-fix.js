/**
 * 最终验证脚本 - 验证 WebGL 修复
 * 重新构建后在浏览器控制台运行
 */

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║           ✅ 最终验证 - WebGL 修复                             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// 检查所有 canvas
const canvases = document.querySelectorAll('canvas');
console.log(`找到 ${canvases.length} 个 canvas\n`);

canvases.forEach((canvas, index) => {
    try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
            const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
            const depthRange = gl.getParameter(gl.DEPTH_RANGE);

            const depthFuncNames = {
                512: 'NEVER', 513: 'LESS', 514: 'LEQUAL',
                515: 'GREATER', 516: 'GEQUAL', 517: 'EQUAL',
                518: 'NOTEQUAL', 519: 'ALWAYS'
            };

            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Canvas #${index + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            console.log(`\n📍 基本信息:`);
            console.log(`  width: ${canvas.width}, height: ${canvas.height}`);
            console.log(`  class: "${canvas.className}"`);
            console.log(`  id: "${canvas.id || ''}"`);

            console.log(`\n🎨 WebGL 状态:`);
            console.log(`  depthFunc: ${depthFunc} (${depthFuncNames[depthFunc]})`);

            // Canvas #1 很可能是 Cesium，使用 GREATER 是正常的
            if (index === 0 && depthFunc === 515) {
                console.log(`    ✅ GREATER 是 Cesium 的正常设置`);
            } else if (depthFunc === 514) {
                console.log(`    ✅ LEQUAL 是 Three.js 的正确设置`);
            } else {
                console.log(`    ⚠️ 异常的 depthFunc`);
            }

            console.log(`  depthTest: ${depthTest} ${depthTest ? '✅' : '❌ 必须启用'}`);
            console.log(`  depthMask: ${depthMask} ${depthMask ? '✅' : '❌ 必须启用'}`);
            console.log(`  depthRange: [${depthRange[0].toFixed(4)}, ${depthRange[1].toFixed(4)}]`);

            console.log(`\n🎨 清除颜色:`);
            console.log(`  clearColor: [${clearColor.map(v => v.toFixed(2)).join(', ')}]`);

            // 检查 alpha 值
            const alpha = clearColor[3];
            if (alpha === 0) {
                console.log(`    ✅ 透明背景 (alpha=0)`);
            } else if (alpha === 1) {
                console.log(`    ❌ 不透明背景 (alpha=1) - 这会覆盖下面的内容！`);
            } else {
                console.log(`    ⚠️ 半透明背景 (alpha=${alpha.toFixed(2)})`);
            }

            // 诊断问题
            console.log(`\n🔍 诊断:`);
            const hasIssues = !depthTest || !depthMask || alpha === 1;

            if (hasIssues) {
                console.log(`  ❌ 发现问题:`);

                if (!depthTest) {
                    console.log(`    - depthTest 被禁用`);
                }
                if (!depthMask) {
                    console.log(`    - depthMask 被禁用`);
                }
                if (alpha === 1) {
                    console.log(`    - clearColor 不透明 (alpha=1)`);
                }

                // 提供修复
                console.log(`\n  🔧 自动修复...`);
                gl.enable(gl.DEPTH_TEST);
                gl.depthMask(true);
                gl.clearColor(0, 0, 0, 0); // 透明

                console.log(`  ✅ 已修复`);
            } else {
                console.log(`  ✅ 设置正确！`);
            }

        }
    } catch (error) {
        console.error(`Canvas #${index + 1} 错误:`, error.message);
    }
});

// 检查 rendererManager
console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`rendererManager 状态`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (window.rendererManager) {
    console.log('✅ 找到 rendererManager');

    const scenes = window.rendererManager.getScenes();
    console.log(`场景数量: ${scenes.length}`);

    if (scenes.length > 0) {
        console.log(`\n场景信息:`);
        scenes.forEach((sceneInfo, index) => {
            console.log(`\n场景 #${index + 1}:`);
            console.log(`  有场景对象: ${!!sceneInfo.scene}`);
            console.log(`  有相机: ${!!sceneInfo.camera}`);
            console.log(`  不透明度: ${sceneInfo.opacity ?? 1.0}`);

            if (sceneInfo.scene) {
                let meshCount = 0;
                let visibleMeshCount = 0;
                sceneInfo.scene.traverse((obj) => {
                    if (obj.isMesh) {
                        meshCount++;
                        if (obj.visible) visibleMeshCount++;
                    }
                });
                console.log(`  网格: ${visibleMeshCount}/${meshCount} 可见`);
            }
        });
    }
} else {
    console.log('❌ 未找到 rendererManager');
}

// 检查 Cesium
console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Cesium 状态`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (window.viewer) {
    console.log('✅ 找到 Cesium Viewer');

    try {
        const cesiumCanvas = window.viewer.canvas;
        const cesiumGL = cesiumCanvas.getContext('webgl2') || cesiumCanvas.getContext('webgl');

        if (cesiumGL) {
            const depthFunc = cesiumGL.getParameter(cesiumGL.DEPTH_FUNC);
            const depthTest = cesiumGL.getParameter(cesiumGL.DEPTH_TEST);
            const clearColor = cesiumGL.getParameter(cesiumGL.COLOR_CLEAR_VALUE);

            console.log(`Cesium WebGL 状态:`);
            console.log(`  depthFunc: ${depthFunc} ${depthFunc === 515 ? '(GREATER - 正常)' : ''}`);
            console.log(`  depthTest: ${depthTest} ${depthTest ? '✅' : '❌'}`);
            console.log(`  clearColor: [${clearColor.map(v => v.toFixed(2)).join(', ')}]`);

            if (clearColor[3] === 0) {
                console.log(`  ✅ Cesium 背景透明`);
            } else {
                console.log(`  ❌ Cesium 背景不透明 (alpha=${clearColor[3].toFixed(2)})`);
            }
        }
    } catch (error) {
        console.log(`⚠️ 无法检查 Cesium WebGL 状态:`, error.message);
    }
} else {
    console.log('❌ 未找到 Cesium Viewer');
}

// 总结
console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`总结`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

let allCorrect = true;
canvases.forEach((canvas) => {
    try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
            const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);

            if (!depthTest || !depthMask || clearColor[3] === 1) {
                allCorrect = false;
            }
        }
    } catch (error) {
        // 忽略
    }
});

if (allCorrect) {
    console.log('✅ 所有 WebGL 设置正确！');
    console.log('💡 模型应该可以正常显示了');
    console.log('💡 如果仍然看不到模型，请检查：');
    console.log('   1. 模型是否已加载（检查控制台日志）');
    console.log('   2. 相机位置是否正确');
    console.log('   3. 模型的 visible 属性是否为 true');
} else {
    console.log('⚠️ 部分 WebGL 设置不正确，已尝试自动修复');
    console.log('💡 如果问题仍然存在，请刷新页面重试');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
