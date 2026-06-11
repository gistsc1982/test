/**
 * 简单模型可见性诊断
 */

(function() {
    console.log('='.repeat(60));
    console.log('模型可见性诊断');
    console.log('='.repeat(60));

    const viewer = window.__dualCanvasViewerInstances?.[0];
    if (!viewer) {
        console.error('未找到 DualCanvasViewer');
        return;
    }

    const camera = viewer.camera1;
    console.log('\n相机状态:');
    console.log('  位置:', camera.position);
    console.log('  near:', camera.near);
    console.log('  far:', camera.far);

    console.log('\n层1模型:');
    if (viewer.modelGroup1 && viewer.modelGroup1.children.length > 0) {
        viewer.modelGroup1.children.forEach((model, idx) => {
            console.log(`\n模型 ${idx}: ${model.name || '未命名'}`);
            console.log('  位置:', model.position);
            console.log('  可见:', model.visible);

            const distance = camera.position.distanceTo(model.position);
            console.log('  到相机距离:', distance.toFixed(2), 'm');

            if (distance < camera.near) {
                console.log('  ⚠️ 小于 near (' + camera.near + 'm)');
            } else if (distance > camera.far) {
                console.log('  ⚠️ 大于 far (' + camera.far + 'm)');
            } else {
                console.log('  ✅ 在 near/far 范围内');
            }
        });
    } else {
        console.log('  ⚠️ 没有模型');
    }

    console.log('\n' + '='.repeat(60));
})();
