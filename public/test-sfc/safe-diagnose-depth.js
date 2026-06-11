/**
 * 安全诊断 - 检查原始的 WebGL 设置
 * 不修改任何设置，只观察
 */

console.log('🔍 安全诊断模式 - 不修改任何设置\n');

// 保存原始设置
const originalStates = new Map();

const canvases = document.querySelectorAll('canvas');
console.log(`找到 ${canvases.length} 个 canvas\n`);

canvases.forEach((canvas, index) => {
    try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Canvas #${index + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            // 基本信息
            console.log(`\n📍 基本信息:`);
            console.log(`  width: ${canvas.width}, height: ${canvas.height}`);
            console.log(`  class: "${canvas.className}"`);
            console.log(`  id: "${canvas.id || ''}"`);

            // WebGL 信息
            console.log(`\n🎨 WebGL 信息:`);
            console.log(`  version: ${gl.getParameter(gl.VERSION)}`);
            console.log(`  vendor: ${gl.getParameter(gl.VENDOR)}`);
            console.log(`  renderer: ${gl.getParameter(gl.RENDERER)}`);

            // 深度设置（不修改）
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
            const depthRange = gl.getParameter(gl.DEPTH_RANGE);

            const depthFuncNames = {
                512: 'NEVER', 513: 'LESS', 514: 'LEQUAL',
                515: 'GREATER', 516: 'GEQUAL', 517: 'EQUAL',
                518: 'NOTEQUAL', 519: 'ALWAYS'
            };

            console.log(`\n🔧 深度设置:`);
            console.log(`  depthFunc: ${depthFunc} (${depthFuncNames[depthFunc]})`);
            console.log(`  depthTest: ${depthTest}`);
            console.log(`  depthMask: ${depthMask}`);
            console.log(`  depthRange: [${depthRange[0].toFixed(4)}, ${depthRange[1].toFixed(4)}]`);

            // 保存原始状态
            originalStates.set(index, {
                canvas,
                gl,
                depthFunc,
                depthTest,
                depthMask
            });

            // 检查是否是 Three.js 渲染器
            console.log(`\n🔍 检测:`);
            if (canvas.__renderer__) {
                console.log(`  Three.js Renderer: ✅`);
                const renderer = canvas.__renderer__;
                console.log(`    - logarithmicDepthBuffer: ${renderer.capabilities.isLogarithmicDepthBuffer}`);
                console.log(`    - pixelRatio: ${renderer.getPixelRatio()}`);
            } else {
                console.log(`  Three.js Renderer: ❌`);
            }

            // 检查视口
            const viewport = gl.getParameter(gl.VIEWPORT);
            console.log(`\n📐 视口:`);
            console.log(`  [${viewport[0]}, ${viewport[1]}, ${viewport[2]}, ${viewport[3]}]`);

            // 检查清除颜色
            const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
            console.log(`\n🎨 清除颜色:`);
            console.log(`  [${clearColor.map(v => v.toFixed(2)).join(', ')}]`);

            // 检查混合设置
            const blend = gl.getParameter(gl.BLEND);
            const blendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
            const blendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
            console.log(`\n🔀 混合设置:`);
            console.log(`  blend: ${blend}`);
            console.log(`  blendSrcAlpha: ${blendSrcAlpha}`);
            console.log(`  blendDstAlpha: ${blendDstAlpha}`);

        }
    } catch (error) {
        console.error(`Canvas #${index + 1} 错误:`, error.message);
    }
});

// 检查 rendererManager
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`rendererManager 状态`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (window.rendererManager) {
    console.log('✅ 找到 rendererManager');

    const debugInfo = window.rendererManager.getDebugInfo();
    console.log('调试信息:', JSON.stringify(debugInfo, null, 2));

    const scenes = window.rendererManager.getScenes();
    console.log(`\n场景数量: ${scenes.length}`);

    scenes.forEach((sceneInfo, index) => {
        console.log(`\n场景 #${index + 1}:`);
        console.log(`  hasScene: ${!!sceneInfo.scene}`);
        console.log(`  hasCamera: ${!!sceneInfo.camera}`);
        console.log(`  opacity: ${sceneInfo.opacity ?? 1.0}`);

        if (sceneInfo.camera) {
            console.log(`  camera.position: [${sceneInfo.camera.position.x.toFixed(2)}, ${sceneInfo.camera.position.y.toFixed(2)}, ${sceneInfo.camera.position.z.toFixed(2)}]`);
            console.log(`  camera.near: ${sceneInfo.camera.near.toFixed(2)}`);
            console.log(`  camera.far: ${sceneInfo.camera.far.toFixed(2)}`);
        }

        if (sceneInfo.scene) {
            let meshCount = 0;
            let visibleMeshCount = 0;
            sceneInfo.scene.traverse((obj) => {
                if (obj.isMesh) {
                    meshCount++;
                    if (obj.visible) visibleMeshCount++;
                }
            });
            console.log(`  meshes: ${visibleMeshCount}/${meshCount} 可见`);
        }
    });
} else {
    console.log('❌ 未找到 rendererManager');
}

// 分析和建议
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`分析和建议`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

let hasGREATER = false;
let hasLEQUAL = false;
let hasLESS = false;

originalStates.forEach((state, index) => {
    if (state.depthFunc === 515) hasGREATER = true;
    if (state.depthFunc === 514) hasLEQUAL = true;
    if (state.depthFunc === 513) hasLESS = true;
});

console.log(`发现的 depthFunc 设置:`);
console.log(`  GREATER (515): ${hasGREATER ? '✅' : '❌'}`);
console.log(`  LEQUAL (514): ${hasLEQUAL ? '✅' : '❌'}`);
console.log(`  LESS (513): ${hasLESS ? '✅' : '❌'}`);

if (hasGREATER && !hasLEQUAL) {
    console.log(`\n💡 分析: 系统使用 GREATER (515)`);
    console.log(`   这可能是由于坐标系转换或深度反转造成的`);
    console.log(`   强制改为 LEQUAL 可能导致渲染错误`);
    console.log(`\n🎯 建议: 保持原始的 GREATER 设置，或检查投影矩阵`);
} else if (hasLEQUAL && !hasGREATER) {
    console.log(`\n💡 分析: 系统使用 LEQUAL (514)`);
    console.log(`   这是标准的 WebGL 深度函数`);
    console.log(`   如果模型不可见，可能是其他原因`);
} else {
    console.log(`\n💡 分析: 混合使用不同的深度函数`);
    console.log(`   不同场景可能有不同的深度需求`);
}

console.log(`\n═══════════════════════════════════════════════════════════════\n`);

// 暴露保存的状态
window.__originalWebGLStates = originalStates;

console.log('✅ 诊断完成');
console.log('💡 原始状态已保存到 window.__originalWebGLStates');
