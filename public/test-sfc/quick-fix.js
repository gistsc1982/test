/**
 * 快速修复：禁用频繁日志 + 修复深度问题
 * 运行: fetch('/quick-fix.js').then(r=>r.text()).then(eval)
 */

(function() {
    console.log('🔧 开始快速修复...');

    // ========================================
    // 1. 禁用频繁日志
    // ========================================
    const originalLog = console.log;
    const filterPatterns = [
        '[DualCanvasViewer] 双层模式',
        '[DualCanvasViewer] 使用 TransformControls',
        '[DualCanvasViewer] 真实世界模式',
        '[DualCanvasViewer] xeokit viewer',
        '[DualCanvasViewer] Three.js 相机已同步',
        '[DualCanvasViewer] syncCameraFromThreeToBim',
        '[DualCanvasViewer] 更新 near/far',
        '[SyncManager]',
        '[HelloWorld.syncToThreeJSFromUnified]'
    ];

    console.log = function(...args) {
        const msg = String(args[0]);
        if (!filterPatterns.some(p => msg.includes(p))) {
            originalLog.apply(console, args);
        }
    };

    console.log('✅ 频繁日志已禁用');

    // ========================================
    // 2. 修复深度问题
    // ========================================

    // 尝试多种方式获取 viewer
    let viewer = null;

    // 方式1: 从 Vue 实例
    if (window.vueApp && window.vueApp.$refs && window.vueApp.$refs.dualCanvasViewer) {
        viewer = window.vueApp.$refs.dualCanvasViewer;
        console.log('✅ 找到 viewer (方式1: vueApp.$refs)');
    }
    // 方式2: 从全局实例列表
    else if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
        viewer = window.__dualCanvasViewerInstances[0];
        console.log('✅ 找到 viewer (方式2: 全局实例)');
    }
    // 方式3: 从 Vue 根实例
    else if (window.vueApp && window.vueApp.$children) {
        for (let child of window.vueApp.$children) {
            if (child.$options.name === 'DualCanvasViewer' || child.$refs.dualCanvasViewer) {
                viewer = child.$refs.dualCanvasViewer || child;
                console.log('✅ 找到 viewer (方式3: 子组件)');
                break;
            }
        }
    }

    if (!viewer) {
        console.warn('⚠️  未找到 DualCanvasViewer，请检查页面是否加载完成');
        console.log('提示: 可以尝试在页面加载完成后再运行此脚本');
        return;
    }

    console.log('📊 开始修复深度问题...');

    // 修复 WebGL 深度函数
    const gl = viewer.renderer1?.getContext();
    if (gl) {
        const currentDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
        if (currentDepthFunc !== 514) {  // LEQUAL
            gl.depthFunc(514);
            console.log('✅ WebGL深度函数已修复为 LEQUAL');
        } else {
            console.log('✅ WebGL深度函数正确 (LEQUAL)');
        }
    }

    // 优化 near/far 值
    const camera = viewer.camera1;
    if (camera) {
        const oldNear = camera.near;
        const oldFar = camera.far;

        // 根据相机距离计算合理的 near/far
        const distance = camera.position.distanceTo(viewer.controls1?.target || new THREE.Vector3(0,0,0));

        let newNear, newFar;
        if (distance < 100) {
            newNear = 1;
            newFar = Math.min(distance * 50, 5000);
        } else if (distance < 500) {
            newNear = 5;
            newFar = Math.min(distance * 20, 10000);
        } else {
            newNear = 10;
            newFar = Math.min(distance * 10, 20000);
        }

        // 限制比例
        const maxRatio = 5000;
        if (newFar / newNear > maxRatio) {
            newFar = newNear * maxRatio;
        }

        camera.near = newNear;
        camera.far = newFar;
        camera.updateProjectionMatrix();

        if (viewer.camera2) {
            viewer.camera2.near = newNear;
            viewer.camera2.far = newFar;
            viewer.camera2.updateProjectionMatrix();
        }

        console.log('✅ near/far 已优化:', {
            near: `${oldNear.toFixed(2)} → ${newNear.toFixed(2)}`,
            far: `${oldFar.toFixed(2)} → ${newFar.toFixed(2)}`,
            ratio: `${(oldFar/oldNear).toFixed(0)} → ${(newFar/newNear).toFixed(0)}`
        });
    }

    // 修复材质深度函数
    let fixedCount = 0;

    // 获取 THREE 对象
    const THREE = window.THREE || viewer.THREE || viewer.renderer1?.THREE;
    if (!THREE) {
        console.log('⚠️  THREE 对象未找到，跳过材质修复');
    } else {
        function fixMaterials(obj) {
            if (obj.material) {
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                materials.forEach(mat => {
                    if (mat.depthFunc !== THREE.LessEqualDepth) {
                        mat.depthFunc = THREE.LessEqualDepth;
                        mat.depthTest = true;
                        mat.depthWrite = true;
                        fixedCount++;
                    }
                });
            }
            if (obj.children) {
                obj.children.forEach(fixMaterials);
            }
        }

        if (viewer.modelGroup1) {
            viewer.modelGroup1.children.forEach(fixMaterials);
        }
        if (viewer.modelGroup2) {
            viewer.modelGroup2.children.forEach(fixMaterials);
        }

        if (fixedCount > 0) {
            console.log(`✅ 修复了 ${fixedCount} 个材质的深度函数`);
        }
    }

    console.log('\n✅ 修复完成！');
    console.log('\n📋 已执行的操作:');
    console.log('  1. ✅ 禁用频繁日志');
    console.log('  2. ✅ 修复 WebGL 深度函数');
    console.log('  3. ✅ 优化 near/far 值');
    console.log('  4. ✅ 修复材质深度函数');

    console.log('\n💡 提示: 如果问题依旧，请重新编译项目:');
    console.log('   npm run build');
    console.log('   然后刷新页面');

    return {
        viewer: !!viewer,
        near: camera?.near,
        far: camera?.far
    };
})();
