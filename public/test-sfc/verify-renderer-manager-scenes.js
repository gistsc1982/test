// ============================================================================
// 🔍 验证 rendererManager 场景是否正确
// ============================================================================

(function() {
    'use strict';

    console.log('================================================================================');
    console.log('🔍 验证 rendererManager 场景');
    console.log('================================================================================');

    const dualViewer = window.__dualCanvasViewer__ ||
                      (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances[0]);

    if (!dualViewer) {
        console.error('❌ 无法找到 DualCanvasViewer 实例');
        return;
    }

    // 1. 检查 scene1 和 scene2
    console.log('\n1️⃣ 检查原始场景:');

    function countMeshes(scene, sceneName) {
        if (!scene) {
            console.log(`   ${sceneName}: 场景不存在`);
            return 0;
        }

        let count = 0;
        let visibleCount = 0;

        scene.traverse((object) => {
            if (object.isMesh) {
                count++;
                if (object.visible) visibleCount++;
            }
        });

        console.log(`   ${sceneName}:`);
        console.log('     scene.children.length:', scene.children.length);
        console.log('     递归统计网格数:', count);
        console.log('     可见网格数:', visibleCount);

        return { total: count, visible: visibleCount };
    }

    const scene1Stats = countMeshes(dualViewer.scene1, 'scene1 (Layer 1)');
    const scene2Stats = countMeshes(dualViewer.scene2, 'scene2 (Layer 2)');

    // 2. 检查 rendererManager 中的场景
    console.log('\n2️⃣ 检查 rendererManager 中的场景:');

    if (window.rendererManager) {
        const debugInfo = window.rendererManager.getDebugInfo();
        console.log('   场景数量:', debugInfo.sceneCount);

        debugInfo.scenes.forEach((sceneInfo, i) => {
            console.log(`\n   Scene ${i}:`);
            console.log('     scene 对象地址:', sceneInfo.scene ? sceneInfo.scene.uuid : null);
            console.log('     scene1 对象地址:', dualViewer.scene1 ? dualViewer.scene1.uuid : null);
            console.log('     scene2 对象地址:', dualViewer.scene2 ? dualViewer.scene2.uuid : null);

            console.log('     是否是 scene1:', sceneInfo.scene === dualViewer.scene1);
            console.log('     是否是 scene2:', sceneInfo.scene === dualViewer.scene2);

            if (sceneInfo.scene) {
                // 统计这个场景的网格数
                let count = 0;
                let visibleCount = 0;
                sceneInfo.scene.traverse((object) => {
                    if (object.isMesh) {
                        count++;
                        if (object.visible) visibleCount++;
                    }
                });
                console.log('     递归统计网格数:', count);
                console.log('     可见网格数:', visibleCount);
            }

            console.log('     element:', sceneInfo.element);
            console.log('     element === threeContainer:', sceneInfo.element === dualViewer.$refs.threeContainer);
            console.log('     element === bimContainer:', sceneInfo.element === dualViewer.$refs.bimContainer);

            if (sceneInfo.element) {
                const rect = sceneInfo.element.getBoundingClientRect();
                console.log('     element 尺寸:', rect.width, 'x', rect.height);
                console.log('     element 位置:', rect.left, rect.top, rect.right, rect.bottom);
            }
        });
    }

    // 3. 检查渲染顺序
    console.log('\n3️⃣ 渲染顺序分析:');

    if (window.rendererManager && dualViewer.$refs.threeContainer && dualViewer.$refs.bimContainer) {
        const threeRect = dualViewer.$refs.threeContainer.getBoundingClientRect();
        const bimRect = dualViewer.$refs.bimContainer.getBoundingClientRect();

        console.log('   threeContainer 位置:', threeRect.left, threeRect.top, threeRect.right, threeRect.bottom);
        console.log('   bimContainer 位置:', bimRect.left, bimRect.top, bimRect.right, bimRect.bottom);

        const overlap = !(threeRect.right < bimRect.left ||
                          threeRect.left > bimRect.right ||
                          threeRect.bottom < bimRect.top ||
                          threeRect.top > bimRect.bottom);

        console.log('   容器重叠:', overlap);

        if (overlap) {
            console.log('   ⚠️  两个容器完全重叠！');
            console.log('   这可能导致渲染冲突。');
        }
    }

    // 4. 测试渲染
    console.log('\n4️⃣ 测试单独渲染:');

    if (dualViewer.scene1 && dualViewer.camera1) {
        console.log('   尝试单独渲染 scene1 到 rendererManager canvas...');

        const rmCanvas = document.getElementById('rendererManager-canvas');
        if (rmCanvas && window.rendererManager) {
            const renderer = window.rendererManager.getRenderer();
            if (renderer) {
                // 清除整个 canvas
                renderer.clear();
                // 渲染 scene1
                renderer.render(dualViewer.scene1, dualViewer.camera1);
                console.log('   ✅ 已渲染 scene1');
                console.log('   检查屏幕：如果看到模型，说明 scene1 本身可以渲染');
                console.log('   如果仍然看不到，可能是相机或模型位置问题');
            }
        }
    }

    // 5. 建议
    console.log('\n================================================================================');
    console.log('📊 建议');
    console.log('================================================================================');

    const issues = [];

    if (scene1Stats.total > 0 && scene1Stats.visible > 0) {
        console.log('✅ scene1 有模型且可见');
        console.log('\n如果 rendererManager 中 Scene 0 的统计数据不匹配，');
        console.log('可能是 rendererManager.addScene 没有正确添加 scene1。');
    } else {
        issues.push('❌ scene1 没有可见的模型');
    }

    if (issues.length > 0) {
        console.log('\n发现问题:');
        issues.forEach(issue => console.log('  ' + issue));
    }

    console.log('\n💡 如果两个容器重叠，考虑以下解决方案:');
    console.log('   1. 使用不重叠的容器（推荐）');
    console.log('   2. 使用单一容器，通过 scene 组织模型');
    console.log('   3. 确保 rendererManager 的 scissor test 正确处理重叠情况');
    console.log('================================================================================\n');

})();
