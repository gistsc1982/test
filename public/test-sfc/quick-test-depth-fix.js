/**
 * 快速测试深度修复
 * 在浏览器控制台运行此脚本来测试 WebGL 深度设置
 */

console.log('🔍 快速测试 WebGL 深度修复\n');

// 1. 测试 rendererManager 的修复函数
if (window.__ensureWebGLDepthSettings) {
    console.log('✅ 找到 __ensureWebGLDepthSettings 函数');
    const result = window.__ensureWebGLDepthSettings();
    console.log(`修复结果: ${result ? '进行了修复' : '无需修复'}`);
} else {
    console.log('❌ 未找到 __ensureWebGLDepthSettings 函数');
    console.log('💡 rendererManager 可能未正确初始化');
}

// 2. 检查所有 canvas 的 WebGL 状态
console.log('\n📊 检查所有 canvas 的 WebGL 状态:');
const canvases = document.querySelectorAll('canvas');
canvases.forEach((canvas, index) => {
    try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

            const depthFuncNames = {
                512: 'NEVER', 513: 'LESS', 514: 'LEQUAL',
                515: 'GREATER', 516: 'GEQUAL', 517: 'EQUAL',
                518: 'NOTEQUAL', 519: 'ALWAYS'
            };

            const isCorrect = depthFunc === 514 && depthTest && depthMask;
            const status = isCorrect ? '✅' : '❌';

            console.log(`${status} Canvas #${index + 1}:`);
            console.log(`    depthFunc: ${depthFunc} (${depthFuncNames[depthFunc]}) ${depthFunc === 514 ? '✅' : '❌ 应为 514'}`);
            console.log(`    depthTest: ${depthTest} ${depthTest ? '✅' : '❌ 应为 true'}`);
            console.log(`    depthMask: ${depthMask} ${depthMask ? '✅' : '❌ 应为 true'}`);
        }
    } catch (error) {
        console.log(`⚠️ Canvas #${index + 1}: 无法获取 WebGL 上下文`);
    }
});

// 3. 检查 rendererManager
console.log('\n🔧 检查 rendererManager:');
if (window.rendererManager) {
    console.log('✅ 找到全局 rendererManager');
    const debugInfo = window.rendererManager.getDebugInfo();
    console.log('调试信息:', debugInfo);

    const renderer = window.rendererManager.getRenderer();
    if (renderer) {
        console.log('✅ 找到 renderer');
        const gl = renderer.getContext();
        if (gl) {
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

            const depthFuncNames = {
                512: 'NEVER', 513: 'LESS', 514: 'LEQUAL',
                515: 'GREATER', 516: 'GEQUAL', 517: 'EQUAL',
                518: 'NOTEQUAL', 519: 'ALWAYS'
            };

            console.log('WebGL 状态:');
            console.log(`  depthFunc: ${depthFunc} (${depthFuncNames[depthFunc]}) ${depthFunc === 514 ? '✅' : '❌'}`);
            console.log(`  depthTest: ${depthTest} ${depthTest ? '✅' : '❌'}`);
            console.log(`  depthMask: ${depthMask} ${depthMask ? '✅' : '❌'}`);
        }
    }
} else {
    console.log('❌ 未找到全局 rendererManager');
}

// 4. 总结
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 总结:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let allCorrect = true;
canvases.forEach((canvas, index) => {
    try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthTest = gl.getParameter(gl.DEPTH_TEST);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
            if (depthFunc !== 514 || !depthTest || !depthMask) {
                allCorrect = false;
            }
        }
    } catch (error) {
        // 忽略
    }
});

if (allCorrect) {
    console.log('✅ 所有 WebGL 设置都正确！');
    console.log('💡 Layer 1 模型应该可以正常显示了');
} else {
    console.log('❌ 部分 WebGL 设置不正确');
    console.log('💡 请尝试以下操作:');
    console.log('   1. 刷新页面');
    console.log('   2. 检查是否有其他代码在覆盖 WebGL 设置');
    console.log('   3. 运行 force-fix-webgl-depth.js 进行强制修复');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
