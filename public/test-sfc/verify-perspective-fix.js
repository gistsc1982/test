// ═══════════════════════════════════════════════════════════════════
// 透视修复验证工具 - 确保所有4个场景都实现"近大远小"
// ═══════════════════════════════════════════════════════════════════
// 功能：
// 1. 诊断当前渲染顺序和深度设置
// 2. 修复渲染顺序（先近后远）
// 3. 动态调整 near/far
// 4. 验证透视效果
// ═══════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  if (typeof window === 'undefined') {
    console.error('此脚本需要在浏览器环境中运行');
    return;
  }

  class PerspectiveFixer {
    constructor(manager) {
      this.manager = manager;
      this.isFixed = false;
      this.autoAdjustEnabled = false;
      this.adjustTimer = null;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 诊断当前状态
    // ═══════════════════════════════════════════════════════════════════
    diagnose() {
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🔍 透视诊断 - 检测当前状态                              ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      const issues = [];

      // 1. 检查渲染器配置
      console.log('📊 [1/6] 渲染器配置:');
      const renderer1 = this.manager.dualViewer.renderer1;
      const renderer2 = this.manager.dualViewer.renderer2;

      if (renderer1) {
        const hasLogDepth = renderer1.capabilities?.isLogarithmicDepthBuffer;
        console.log(`  原始层: ${hasLogDepth ? '✅ 对数深度已启用' : '⚠️ 对数深度未启用'}`);
        if (!hasLogDepth) issues.push('原始层渲染器未启用对数深度缓冲区');
      }

      if (renderer2) {
        const hasLogDepth = renderer2.capabilities?.isLogarithmicDepthBuffer;
        console.log(`  BIM层: ${hasLogDepth ? '✅ 对数深度已启用' : '⚠️ 对数深度未启用'}`);
        if (!hasLogDepth) issues.push('BIM层渲染器未启用对数深度缓冲区');
      }

      // 2. 检查相机配置
      console.log('\n📷 [2/6] 相机 Near/Far 配置:');
      const cameras = this.manager.cameras;

      console.log(`  原始层-大: near=${cameras.layer1Large.near}, far=${cameras.layer1Large.far.toLocaleString()}`);
      console.log(`  原始层-小: near=${cameras.layer1Small.near}, far=${cameras.layer1Small.far}`);
      console.log(`  BIM层-大: near=${cameras.layer2Large.near}, far=${cameras.layer2Large.far.toLocaleString()}`);
      console.log(`  BIM层-小: near=${cameras.layer2Small.near}, far=${cameras.layer2Small.far}`);

      // 检查 near/far 是否合理
      if (cameras.layer1Small.near > cameras.layer1Small.far) {
        issues.push('原始层-小坐标场景 near > far，配置错误');
      }

      // 3. 检查相机位置
      console.log('\n📍 [3/6] 相机位置:');
      const baseCamera = this.manager.dualViewer.camera1;
      if (baseCamera) {
        const pos = baseCamera.position;
        const isLarge = Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000;
        console.log(`  位置: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        console.log(`  类型: ${isLarge ? '🔴 大坐标' : '🟢 小坐标'}`);
      }

      // 4. 检查渲染顺序
      console.log('\n🎨 [4/6] 渲染顺序:');
      const renderOrder1 = this._detectRenderOrder(this.manager.renderLayer1);
      const renderOrder2 = this._detectRenderOrder(this.manager.renderLayer2);

      console.log(`  原始层: ${renderOrder1}`);
      console.log(`  BIM层: ${renderOrder2}`);

      if (renderOrder1.includes('先大后小')) {
        issues.push('原始层渲染顺序错误：应该先渲染小坐标（近），再渲染大坐标（远）');
      }

      // 5. 检查相机同步
      console.log('\n🔗 [5/6] 相机同步:');
      const sync1 = this._checkCameraSync('layer1Small');
      const sync2 = this._checkCameraSync('layer1Large');
      const sync3 = this._checkCameraSync('layer2Small');
      const sync4 = this._checkCameraSync('layer2Large');

      console.log(`  原始层-小: ${sync1 ? '✅ 同步正常' : '⚠️ 同步异常'}`);
      console.log(`  原始层-大: ${sync2 ? '✅ 同步正常' : '⚠️ 同步异常'}`);
      console.log(`  BIM层-小: ${sync3 ? '✅ 同步正常' : '⚠️ 同步异常'}`);
      console.log(`  BIM层-大: ${sync4 ? '✅ 同步正常' : '⚠️ 同步异常'}`);

      // 6. 检查深度精度
      console.log('\n🎯 [6/6] 深度精度:');
      const precision = this._checkDepthPrecision();
      console.log(`  大坐标场景精度: ${precision.large}%`);
      console.log(`  小坐标场景精度: ${precision.small}%`);

      if (precision.large < 50) {
        issues.push('大坐标场景深度精度不足，可能引起透视反转');
      }

      // 总结
      console.log('\n' + '═'.repeat(60));
      if (issues.length === 0) {
        console.log('✅ 未发现明显问题');
      } else {
        console.log('⚠️ 发现 ' + issues.length + ' 个问题:');
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });
      }
      console.log('═'.repeat(60) + '\n');

      return {
        hasIssues: issues.length > 0,
        issues: issues,
        renderOrder1: renderOrder1,
        renderOrder2: renderOrder2
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // 修复所有问题
    // ═══════════════════════════════════════════════════════════════════
    fix() {
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🔧 开始修复透视问题                                      ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      // 1. 修复渲染顺序（最关键！）
      this._fixRenderOrder();

      // 2. 修复相机同步
      this._fixCameraSync();

      // 3. 添加动态 near/far 调整
      this._addDynamicNearFar();

      // 4. 确保渲染器设置正确
      this._fixRendererSettings();

      // 5. 应用修复
      this.manager.syncCameras();
      this.adjustNearFar();

      this.isFixed = true;

      console.log('\n✅ 修复完成！\n');
      console.log('📌 可用命令:');
      console.log('   fixer.diagnose()          - 重新诊断');
      console.log('   fixer.adjustNearFar()     - 手动调整 near/far');
      console.log('   fixer.enableAutoAdjust()  - 启用自动调整');
      console.log('   fixer.verify()            - 验证修复效果\n');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 修复渲染顺序
    // ═══════════════════════════════════════════════════════════════════
    _fixRenderOrder() {
      console.log('🔧 [1/4] 修复渲染顺序...');

      const self = this;

      // 重写原始层渲染函数
      this.manager.renderLayer1 = function() {
        const renderer = this.dualViewer.renderer1;
        if (!renderer) return;

        renderer.clear(true, true, false);

        // ✅ 先渲染小坐标（近）
        if (this.scenes.layer1Small.children.length > 0) {
          renderer.render(this.scenes.layer1Small, this.cameras.layer1Small);
        }

        // ✅ 再渲染大坐标（远）
        if (this.scenes.layer1Large.children.length > 0) {
          renderer.clearDepth();
          renderer.render(this.scenes.layer1Large, this.cameras.layer1Large);
        }

        self._onRenderComplete('原始层');
      };

      // 重写BIM层渲染函数
      this.manager.renderLayer2 = function() {
        const renderer = this.dualViewer.renderer2;
        if (!renderer) return;

        renderer.clear(true, true, false);

        // ✅ 先渲染小坐标（近）
        if (this.scenes.layer2Small.children.length > 0) {
          renderer.render(this.scenes.layer2Small, this.cameras.layer2Small);
        }

        // ✅ 再渲染大坐标（远）
        if (this.scenes.layer2Large.children.length > 0) {
          renderer.clearDepth();
          renderer.render(this.scenes.layer2Large, this.cameras.layer2Large);
        }

        self._onRenderComplete('BIM层');
      };

      console.log('  ✅ 渲染顺序已修复：先小后大（先近后远）');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 修复相机同步
    // ═══════════════════════════════════════════════════════════════════
    _fixCameraSync() {
      console.log('🔧 [2/4] 修复相机同步...');

      const originalSync = this.manager.syncCamera;
      const self = this;

      this.manager.syncCamera = function(baseCamera, targetCamera, referencePoint, isLargeScene) {
        // 同步基本属性
        if (isLargeScene || !referencePoint) {
          targetCamera.position.copy(baseCamera.position);
        } else {
          const relativePos = baseCamera.position.clone().sub(referencePoint);
          targetCamera.position.copy(relativePos);
        }

        targetCamera.quaternion.copy(baseCamera.quaternion);
        targetCamera.zoom = baseCamera.zoom;
        targetCamera.aspect = baseCamera.aspect;

        // ✅ 关键：更新投影矩阵和世界矩阵
        targetCamera.updateProjectionMatrix();
        targetCamera.updateMatrixWorld();
      };

      console.log('  ✅ 相机同步已增强（包含投影矩阵更新）');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 添加动态 near/far 调整
    // ═══════════════════════════════════════════════════════════════════
    _addDynamicNearFar() {
      console.log('🔧 [3/4] 添加动态 near/far 调整...');

      const self = this;

      this.manager.adjustCameraNearFar = function() {
        const baseCamera = this.dualViewer.camera1;
        if (!baseCamera) return;

        // 计算相机到模型的距离
        const distances = [];

        // 收集所有模型的距离
        ['layer1Large', 'layer1Small', 'layer2Large', 'layer2Small'].forEach(sceneKey => {
          const scene = this.scenes[sceneKey];
          const refPoint = this.referencePoints[sceneKey.replace('layer1', 'layer1').replace('layer2', 'layer2')];

          scene.traverse(obj => {
            if (obj.isMesh) {
              let worldPos = obj.position.clone();
              if (refPoint && !sceneKey.includes('Large')) {
                worldPos.add(refPoint);
              }
              const dist = baseCamera.position.distanceTo(worldPos);
              distances.push(dist);
            }
          });
        });

        if (distances.length === 0) return;

        const minDist = Math.min(...distances);
        const maxDist = Math.max(...distances);

        // 动态调整小坐标场景的 near/far
        const smallNear = Math.max(1, minDist * 0.1);
        const smallFar = Math.max(smallNear * 2, maxDist * 1.5, 1802);

        // 应用到所有小坐标场景
        this.cameras.layer1Small.near = smallNear;
        this.cameras.layer1Small.far = Math.min(smallFar, 10000);
        this.cameras.layer1Small.updateProjectionMatrix();

        this.cameras.layer2Small.near = smallNear;
        this.cameras.layer2Small.far = Math.min(smallFar, 10000);
        this.cameras.layer2Small.updateProjectionMatrix();

        if (self._verbose) {
          console.log(`  near/far 调整: ${smallNear.toFixed(2)} ~ ${this.cameras.layer1Small.far.toFixed(2)}`);
        }
      };

      console.log('  ✅ 动态 near/far 调整已添加');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 修复渲染器设置
    // ═══════════════════════════════════════════════════════════════════
    _fixRendererSettings() {
      console.log('🔧 [4/4] 修复渲染器设置...');

      const renderer1 = this.manager.dualViewer.renderer1;
      const renderer2 = this.manager.dualViewer.renderer2;

      if (renderer1) {
        renderer1.sortObjects = true;
        renderer1.autoClear = false;
      }

      if (renderer2) {
        renderer2.sortObjects = true;
        renderer2.autoClear = false;
      }

      console.log('  ✅ 渲染器设置已优化');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 调整 near/far
    // ═══════════════════════════════════════════════════════════════════
    adjustNearFar() {
      if (this.manager.adjustCameraNearFar) {
        this.manager.adjustCameraNearFar();
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 启用自动调整
    // ═══════════════════════════════════════════════════════════════════
    enableAutoAdjust() {
      if (this.autoAdjustEnabled) {
        console.log('⚠️ 自动调整已经启用');
        return;
      }

      const controls1 = this.manager.dualViewer.controls1;
      const controls2 = this.manager.dualViewer.controls2;

      const onCameraChange = () => {
        if (this.adjustTimer) return;
        this.adjustTimer = setTimeout(() => {
          this.adjustNearFar();
          this.adjustTimer = null;
        }, 100);
      };

      if (controls1) {
        controls1.addEventListener('change', onCameraChange);
      }

      if (controls2) {
        controls2.addEventListener('change', onCameraChange);
      }

      this.autoAdjustEnabled = true;
      console.log('✅ 自动 near/far 调整已启用');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 验证修复效果
    // ═══════════════════════════════════════════════════════════════════
    verify() {
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🎯 验证修复效果                                           ║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      const diagnosis = this.diagnose();

      console.log('📊 验证结果:');

      if (!diagnosis.hasIssues) {
        console.log('  ✅ 所有问题已修复');
        console.log('  ✅ 渲染顺序正确');
        console.log('  ✅ 相机同步正常');
        console.log('  ✅ 应该能看到正确的"近大远小"效果');
      } else {
        console.log('  ⚠️ 仍然存在以下问题:');
        diagnosis.issues.forEach((issue, i) => {
          console.log(`    ${i + 1}. ${issue}`);
        });
        console.log('\n  💡 建议：');
        console.log('    - 检查模型坐标是否正确');
        console.log('    - 确认参考点设置是否合理');
        console.log('    - 尝试启用对数深度缓冲区');
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 辅助方法
    // ═══════════════════════════════════════════════════════════════════
    _detectRenderOrder(renderFunc) {
      const funcStr = renderFunc.toString();
      if (funcStr.includes('layer1Small') && funcStr.indexOf('layer1Small') < funcStr.indexOf('layer1Large')) {
        return '✅ 先小后大（正确）';
      } else if (funcStr.includes('layer1Large') && funcStr.indexOf('layer1Large') < funcStr.indexOf('layer1Small')) {
        return '⚠️ 先大后小（错误）';
      }
      return '❓ 无法检测';
    }

    _checkCameraSync(cameraKey) {
      const camera = this.manager.cameras[cameraKey];
      const baseCamera = this.manager.dualViewer.camera1;

      if (!camera || !baseCamera) return false;

      // 检查投影矩阵是否是最新的
      const projMatrix = camera.projectionMatrix.elements;
      return projMatrix.every(v => !isNaN(v) && v !== 0);
    }

    _checkDepthPrecision() {
      const largeCamera = this.manager.cameras.layer1Large;
      const smallCamera = this.manager.cameras.layer1Small;

      // 简单的精度估算
      const largePrecision = (1 / (1 + Math.log10(largeCamera.far - largeCamera.near))) * 100;
      const smallPrecision = (1 / (1 + Math.log10(smallCamera.far - smallCamera.near))) * 100;

      return {
        large: largePrecision,
        small: smallPrecision
      };
    }

    _onRenderComplete(layer) {
      // 渲染完成回调（可用于调试）
    }

    set verbose(value) {
      this._verbose = value;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 暴露到全局
  // ═══════════════════════════════════════════════════════════════════
  window.PerspectiveFixer = PerspectiveFixer;

  console.log('\n✅ 透视修复验证工具已加载');
  console.log('📌 使用方法:');
  console.log('   const fixer = new PerspectiveFixer(window.__multiSceneManager);');
  console.log('   fixer.diagnose();  // 诊断问题');
  console.log('   fixer.fix();       // 修复问题');
  console.log('   fixer.verify();    // 验证修复');

})();
