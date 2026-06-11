/**
 * 集成到 DualCanvasViewer.vue 的方法
 *
 * 将此代码添加到 DualCanvasViewer.vue 的 methods 部分
 */

/**
 * 自动检测大坐标模型并调整相机位置（集成版本）
 * 在模型加载完成后自动调用此方法
 *
 * @returns {Object} 检测和调整结果
 */
autoDetectAndAdjustForLargeCoords() {
  console.log('[DualCanvasViewer] autoDetectAndAdjustForLargeCoords: 开始检测大坐标模型...');

  const LARGE_COORD_THRESHOLD = 10000;
  let hasLargeCoordModels = false;
  let largeCoordModels = [];
  let smallCoordModels = [];

  // 检查 Layer 1 模型
  if (this.modelGroup1 && this.modelGroup1.children) {
    this.modelGroup1.children.forEach(model => {
      const isLargeCoord = this.isModelLargeCoord(model);

      if (isLargeCoord) {
        hasLargeCoordModels = true;
        largeCoordModels.push({
          name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
          position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
          type: 'Layer1',
          center: model.userData.originalCenter
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
  if (this.modelGroup2 && this.modelGroup2.children) {
    this.modelGroup2.children.forEach(model => {
      const isLargeCoord = this.isModelLargeCoord(model);

      if (isLargeCoord) {
        hasLargeCoordModels = true;
        largeCoordModels.push({
          name: model.userData.fileName || model.userData.filePath || model.name || 'unnamed',
          position: `(${model.position.x.toFixed(0)}, ${model.position.y.toFixed(0)}, ${model.position.z.toFixed(0)})`,
          type: 'Layer2',
          center: model.userData.originalCenter
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

  const totalModels = largeCoordModels.length + smallCoordModels.length;

  console.log('[DualCanvasViewer] autoDetectAndAdjustForLargeCoords: 检测结果:', {
    总模型数: totalModels,
    大坐标模型数: largeCoordModels.length,
    小坐标模型数: smallCoordModels.length,
    有大坐标: hasLargeCoordModels
  });

  if (largeCoordModels.length > 0) {
    console.log('[DualCanvasViewer] 大坐标模型列表:', largeCoordModels);
  }

  // 检查相机当前位置
  const cameraPos = this.camera1 ? this.camera1.position : null;
  console.log('[DualCanvasViewer] 当前相机位置:', cameraPos ?
    `(${cameraPos.x.toFixed(0)}, ${cameraPos.y.toFixed(0)}, ${cameraPos.z.toFixed(0)})` : 'N/A');

  // 判断相机是否在大坐标位置
  const cameraAtLargeCoord = cameraPos &&
    (Math.abs(cameraPos.x) > LARGE_COORD_THRESHOLD || Math.abs(cameraPos.z) > LARGE_COORD_THRESHOLD);

  console.log('[DualCanvasViewer] 相机在大坐标位置:', cameraAtLargeCoord);
  console.log('[DualCanvasViewer] 当前 isInRealWorldMode:', this.isInRealWorldMode);

  // 策略决策
  if (!hasLargeCoordModels) {
    // 全部是小坐标模型 - 不需要调整
    console.log('[DualCanvasViewer] ✅ autoDetectAndAdjustForLargeCoords: 全部是小坐标模型，保持现有小坐标逻辑');

    // 确保在非真实世界模式
    if (this.isInRealWorldMode) {
      console.log('[DualCanvasViewer] ⚠️ 检测到全是小坐标模型，但 isInRealWorldMode 为 true，保持不变（用户可能手动切换）');
    }

    return {
      action: 'none',
      reason: '全部是小坐标模型',
      hasLargeCoordModels: false,
      success: true
    };
  }

  // 有大坐标模型
  if (cameraAtLargeCoord && this.isInRealWorldMode) {
    // 相机已在大坐标位置，且已在真实世界模式
    console.log('[DualCanvasViewer] ✅ autoDetectAndAdjustForLargeCoords: 相机已在大坐标位置，无需调整');
    return {
      action: 'none',
      reason: '相机已在大坐标位置',
      hasLargeCoordModels: true,
      success: true
    };
  }

  // 需要调整相机
  console.log('[DualCanvasViewer] ⚠️ autoDetectAndAdjustForLargeCoords: 检测到大坐标模型，但相机未在大坐标位置');
  console.log('[DualCanvasViewer] 正在自动调整相机位置...');

  try {
    // 1. 设置真实世界模式标志
    this.isInRealWorldMode = true;
    console.log('[DualCanvasViewer] ✅ 已设置 isInRealWorldMode = true');

    // 2. 调用相机调整函数
    this.adjustCameraForAllModels();
    console.log('[DualCanvasViewer] ✅ 已调用 adjustCameraForAllModels()');

    // 3. 验证调整结果（延迟一帧后检查）
    this.$nextTick(() => {
      const newCameraPos = this.camera1 ? this.camera1.position : null;
      const newCameraAtLargeCoord = newCameraPos &&
        (Math.abs(newCameraPos.x) > LARGE_COORD_THRESHOLD || Math.abs(newCameraPos.z) > LARGE_COORD_THRESHOLD);

      console.log('[DualCanvasViewer] 调整后相机位置:', newCameraPos ?
        `(${newCameraPos.x.toFixed(0)}, ${newCameraPos.y.toFixed(0)}, ${newCameraPos.z.toFixed(0)})` : 'N/A');
      console.log('[DualCanvasViewer] 相机现在在大坐标位置:', newCameraAtLargeCoord);

      if (!newCameraAtLargeCoord) {
        console.warn('[DualCanvasViewer] ⚠️ 相机仍未移动到大坐标位置，可能需要手动检查');
      } else {
        console.log('[DualCanvasViewer] ✅ 相机调整成功！');
      }
    });

    return {
      action: 'adjusted',
      reason: '检测到大坐标模型，已自动调整相机',
      hasLargeCoordModels: true,
      success: true
    };

  } catch (error) {
    console.error('[DualCanvasViewer] ❌ autoDetectAndAdjustForLargeCoords: 调整相机时出错:', error);
    return {
      action: 'error',
      reason: error.message,
      hasLargeCoordModels: true,
      success: false
    };
  }
},

/**
 * 检查单个模型是否为大坐标模型
 * 辅助方法，用于 autoDetectAndAdjustForLargeCoords
 *
 * @param {THREE.Object3D} model - 要检查的模型
 * @returns {boolean} 是否为大坐标模型
 */
isModelLargeCoord(model) {
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

  // 检查边界框
  if (model.userData.boundingBox) {
    const center = model.userData.boundingBox.getCenter(new THREE.Vector3());
    if (Math.abs(center.x) > 10000 || Math.abs(center.z) > 10000) {
      return true;
    }
  }

  return false;
},

/**
 * 使用说明
 *
 * ============================================
 * 方法 1: 在浏览器控制台运行独立脚本
 * ============================================
 *
 * 在 public/demo-bundle.html 页面的控制台中运行：
 *
 *   <script src="auto-detect-large-coords.js"></script>
 *
 * 或者直接在控制台粘贴脚本内容。
 *
 * ============================================
 * 方法 2: 集成到 DualCanvasViewer.vue
 * ============================================
 *
 * 1. 将上面的两个方法添加到 DualCanvasViewer.vue 的 methods 部分：
 *    - autoDetectAndAdjustForLargeCoords()
 *    - isModelLargeCoord(model)
 *
 * 2. 在模型加载完成后调用，例如在 loadThreeModel 方法的末尾：
 *
 *    // 在 loadThreeModel 方法中，加载完模型后添加：
 *    this.autoDetectAndAdjustForLargeCoords();
 *
 * 3. 或者在 loadBimModel 方法中添加：
 *
 *    // 在 loadBimModel 方法中，加载完模型后添加：
 *    this.autoDetectAndAdjustForLargeCoords();
 *
 * ============================================
 * 方法 3: 作为组件方法暴露
 * ============================================
 *
 * 在 DualCanvasViewer.vue 中添加后，可以在控制台调用：
 *
 *   const viewer = document.querySelector('#app').__vue__.$refs.dualCanvasViewer;
 *   viewer.autoDetectAndAdjustForLargeCoords();
 *
 * ============================================
 * 逻辑说明
 * ============================================
 *
 * 此方法会自动检测场景中的模型：
 *
 * 1. 如果所有模型都是小坐标模型（位置 < 10000）
 *    → 保持现有小坐标逻辑，不调整相机
 *
 * 2. 如果有任何模型是大坐标模型（位置 >= 10000）
 *    → 自动设置 isInRealWorldMode = true
 *    → 调用 adjustCameraForAllModels() 移动相机到大坐标位置
 *
 * 3. 如果相机已在大坐标位置且 isInRealWorldMode = true
 *    → 不做任何操作，避免重复调整
 *
 */
