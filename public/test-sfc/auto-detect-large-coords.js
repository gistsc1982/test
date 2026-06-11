/**
 * 自动检测大坐标模型并调整相机位置
 *
 * 功能：
 * 1. 检测当前加载的模型是否包含大坐标模型
 * 2. 如果有大坐标模型，自动切换到真实世界模式并调整相机
 * 3. 如果全是小坐标模型，保持现有小坐标逻辑
 *
 * 使用方法：
 * 1. 在浏览器控制台运行此脚本
 * 2. 或者在 DualCanvasViewer.vue 中作为方法集成
 */

(function() {
  'use strict';

  console.log('[AutoDetectLargeCoords] 开始检测大坐标模型...');

  // 获取 DualCanvasViewer 实例
  function getViewerInstance() {
    // 尝试从 Vue 应用获取
    const app = document.querySelector('#app')?.__vue__;
    if (!app) {
      console.error('[AutoDetectLargeCoords] 未找到 Vue 应用实例');
      return null;
    }

    // 尝试获取 DualCanvasViewer 实例
    let viewer = app.$refs.dualCanvasViewer;

    // 如果没有直接引用，尝试从 $children 中查找
    if (!viewer) {
      viewer = findViewerInChildren(app);
    }

    return viewer;
  }

  // 递归查找 DualCanvasViewer 实例
  function findViewerInChildren(component) {
    if (!component || !component.$children) return null;

    for (const child of component.$children) {
      if (child.$options.name === 'DualCanvasViewer' ||
          child.modelGroup1 && child.camera1 && child.controls1) {
        return child;
      }

      const found = findViewerInChildren(child);
      if (found) return found;
    }

    return null;
  }

  // 检测模型是否为大坐标模型
  function isLargeCoordModel(model) {
    if (!model) return false;

    // 检查 userData 标志
    if (model.userData.hasLargeCoordinates ||
        model.userData.isLargeCoordModel ||
        model.userData.hasLargeSize) {
      return true;
    }

    // 检查模型位置
    if (model.position) {
      const LARGE_COORD_THRESHOLD = 10000;
      if (Math.abs(model.position.x) > LARGE_COORD_THRESHOLD ||
          Math.abs(model.position.y) > LARGE_COORD_THRESHOLD ||
          Math.abs(model.position.z) > LARGE_COORD_THRESHOLD) {
        return true;
      }
    }

    // 检查边界框中心
    if (model.userData.originalCenter) {
      const center = model.userData.originalCenter;
      if (Math.abs(center.x) > 10000 || Math.abs(center.z) > 10000) {
        return true;
      }
    }

    return false;
  }

  // 检测场景中是否有大坐标模型
  function detectLargeCoordModels(viewer) {
    const LARGE_COORD_THRESHOLD = 10000;
    let hasLargeCoordModels = false;
    let largeCoordModels = [];
    let smallCoordModels = [];

    // 检查 Layer 1 模型
    if (viewer.modelGroup1 && viewer.modelGroup1.children) {
      viewer.modelGroup1.children.forEach(model => {
        if (isLargeCoordModel(model)) {
          hasLargeCoordModels = true;
          largeCoordModels.push({
            name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
            position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
            type: 'Layer1'
          });
        } else {
          smallCoordModels.push({
            name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
            position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
            type: 'Layer1'
          });
        }
      });
    }

    // 检查 Layer 2 模型
    if (viewer.modelGroup2 && viewer.modelGroup2.children) {
      viewer.modelGroup2.children.forEach(model => {
        if (isLargeCoordModel(model)) {
          hasLargeCoordModels = true;
          largeCoordModels.push({
            name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
            position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
            type: 'Layer2'
          });
        } else {
          smallCoordModels.push({
            name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
            position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
            type: 'Layer2'
          });
        }
      });
    }

    return {
      hasLargeCoordModels,
      largeCoordModels,
      smallCoordModels,
      totalModels: largeCoordModels.length + smallCoordModels.length
    };
  }

  // 自动调整相机到大坐标位置
  function autoAdjustCamera(viewer) {
    console.log('[AutoDetectLargeCoords] 开始自动调整相机...');

    // 检测大坐标模型
    const detection = detectLargeCoordModels(viewer);

    console.log('[AutoDetectLargeCoords] 检测结果:', {
      总模型数: detection.totalModels,
      大坐标模型数: detection.largeCoordModels.length,
      小坐标模型数: detection.smallCoordModels.length,
      有大坐标: detection.hasLargeCoordModels
    });

    if (detection.largeCoordModels.length > 0) {
      console.log('[AutoDetectLargeCoords] 大坐标模型列表:', detection.largeCoordModels);
    }

    if (detection.smallCoordModels.length > 0) {
      console.log('[AutoDetectLargeCoords] 小坐标模型列表:', detection.smallCoordModels);
    }

    // 检查相机当前位置
    const cameraPos = viewer.camera1 ? viewer.camera1.position : null;
    console.log('[AutoDetectLargeCoords] 当前相机位置:', cameraPos ?
      `(${cameraPos.x.toFixed(0)}, ${cameraPos.y.toFixed(0)}, ${cameraPos.z.toFixed(0)})` : 'N/A');

    // 判断相机是否在大坐标位置
    const cameraAtLargeCoord = cameraPos &&
      (Math.abs(cameraPos.x) > 10000 || Math.abs(cameraPos.z) > 10000);

    console.log('[AutoDetectLargeCoords] 相机在大坐标位置:', cameraAtLargeCoord);

    // 策略决策
    if (!detection.hasLargeCoordModels) {
      // 全部是小坐标模型 - 不需要调整
      console.log('[AutoDetectLargeCoords] ✅ 全部是小坐标模型，保持现有小坐标逻辑');
      return {
        action: 'none',
        reason: '全部是小坐标模型',
        success: true
      };
    }

    // 有大坐标模型
    if (cameraAtLargeCoord && viewer.isInRealWorldMode) {
      // 相机已在大坐标位置，且已在真实世界模式
      console.log('[AutoDetectLargeCoords] ✅ 相机已在大坐标位置，无需调整');
      return {
        action: 'none',
        reason: '相机已在大坐标位置',
        success: true
      };
    }

    // 需要调整相机
    console.log('[AutoDetectLargeCoords] ⚠️ 检测到大坐标模型，但相机未在大坐标位置');
    console.log('[AutoDetectLargeCoords] 正在自动调整相机位置...');

    try {
      // 1. 设置真实世界模式标志
      viewer.isInRealWorldMode = true;
      console.log('[AutoDetectLargeCoords] ✅ 已设置 isInRealWorldMode = true');

      // 2. 调用相机调整函数
      if (typeof viewer.adjustCameraForAllModels === 'function') {
        viewer.adjustCameraForAllModels();
        console.log('[AutoDetectLargeCoords] ✅ 已调用 adjustCameraForAllModels()');
      } else {
        console.warn('[AutoDetectLargeCoords] ⚠️ adjustCameraForAllModels 方法不存在，尝试手动调整...');

        // 手动调整相机
        if (viewer.camera1 && viewer.controls1 && detection.largeCoordModels.length > 0) {
          const firstLargeModel = detection.largeCoordModels[0];

          // 从模型组中找到第一个大坐标模型
          let targetModel = null;
          if (viewer.modelGroup1) {
            targetModel = viewer.modelGroup1.children.find(m =>
              m.userData.fileName === firstLargeModel.name ||
              isLargeCoordModel(m)
            );
          }

          if (targetModel) {
            const center = targetModel.userData.originalCenter || targetModel.position;
            const distance = 1000; // 默认距离

            // 设置相机位置
            viewer.controls1.target.copy(center);
            viewer.camera1.position.set(center.x, center.y + distance, center.z);
            viewer.camera1.lookAt(center);
            viewer.camera1.updateMatrixWorld();

            console.log('[AutoDetectLargeCoords] ✅ 已手动调整相机位置到:', center);
          }
        }
      }

      // 3. 验证调整结果
      setTimeout(() => {
        const newCameraPos = viewer.camera1 ? viewer.camera1.position : null;
        const newCameraAtLargeCoord = newCameraPos &&
          (Math.abs(newCameraPos.x) > 10000 || Math.abs(newCameraPos.z) > 10000);

        console.log('[AutoDetectLargeCoords] 调整后相机位置:', newCameraPos ?
          `(${newCameraPos.x.toFixed(0)}, ${newCameraPos.y.toFixed(0)}, ${newCameraPos.z.toFixed(0)})` : 'N/A');
        console.log('[AutoDetectLargeCoords] 相机现在在大坐标位置:', newCameraAtLargeCoord);

        if (!newCameraAtLargeCoord && detection.hasLargeCoordModels) {
          console.warn('[AutoDetectLargeCoords] ⚠️ 相机仍未移动到大坐标位置，可能需要手动调整');
        } else {
          console.log('[AutoDetectLargeCoords] ✅ 相机调整成功！');
        }
      }, 500);

      return {
        action: 'adjusted',
        reason: '检测到大坐标模型，已自动调整相机',
        success: true
      };

    } catch (error) {
      console.error('[AutoDetectLargeCoords] ❌ 调整相机时出错:', error);
      return {
        action: 'error',
        reason: error.message,
        success: false
      };
    }
  }

  // 主函数
  function main() {
    const viewer = getViewerInstance();

    if (!viewer) {
      console.error('[AutoDetectLargeCoords] ❌ 无法获取 DualCanvasViewer 实例');
      console.log('[AutoDetectLargeCoords] 提示: 请确保页面已完全加载');
      return;
    }

    console.log('[AutoDetectLargeCoords] ✅ 已获取 DualCanvasViewer 实例');

    // 执行自动调整
    const result = autoAdjustCamera(viewer);

    console.log('[AutoDetectLargeCoords] 最终结果:', result);

    return result;
  }

  // 导出函数供外部使用
  window.autoDetectAndAdjustCamera = main;

  // 立即执行
  console.log('[AutoDetectLargeCoords] 脚本已加载，调用 autoDetectAndAdjustCamera() 执行检测');
  const result = main();

  return result;

})();
