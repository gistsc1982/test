// 完整诊断脚本 - 检查所有可能的问题

console.log('========== 完整诊断 ==========');

const viewer = window.__dualCanvasViewer;
if (!viewer) {
  console.error('❌ DualCanvasViewer 未找到');
  throw new Error('DualCanvasViewer 未找到');
}

// 1. 检查投影矩阵
console.log('📊 [1] 投影矩阵检查:');
if (viewer.camera1) {
  const proj = viewer.camera1.projectionMatrix;
  console.log(`  [10,10]=${proj.elements[10].toFixed(4)} (应该为负)`);
  console.log(`  [11,11]=${proj.elements[11].toFixed(4)} (应该为-1)`);
  console.log(`  [14,10]=${proj.elements[14].toFixed(4)} (应该为正)`);
  console.log(`  [15,15]=${proj.elements[15].toFixed(4)} (应该为0)`);

  const projOk = proj.elements[10] < 0 && proj.elements[11] === -1 && proj.elements[14] > 0 && proj.elements[15] === 0;
  console.log(`  ${projOk ? '✅' : '❌'} 投影矩阵: ${projOk ? '正确' : '不正确'}`);
}

// 2. 检查两层场景的相机
console.log('');
console.log('📊 [2] 两层场景相机检查:');

if (viewer.originalLayer) {
  const ol = viewer.originalLayer;
  console.log('  原始层:');
  console.log(`    scene: ${ol.scene ? '✅' : '❌'}`);
  console.log(`    camera: ${ol.camera ? '✅' : '❌'}`);
  console.log(`    renderer: ${ol.renderer ? '✅' : '❌'}`);

  if (ol.camera) {
    console.log(`    near=${ol.camera.near.toFixed(2)}, far=${ol.camera.far.toFixed(2)}`);
  }
}

if (viewer.bimLayer) {
  const bl = viewer.bimLayer;
  console.log('  BIM层:');
  console.log(`    scene: ${bl.scene ? '✅' : '❌'}`);
  console.log(`    camera: ${bl.camera ? '✅' : '❌'}`);
  console.log(`    renderer: ${bl.renderer ? '✅' : '❌'}`);

  if (bl.camera) {
    console.log(`    near=${bl.camera.near.toFixed(2)}, far=${bl.camera.far.toFixed(2)}`);
  }
}

// 3. 检查模型分布
console.log('');
console.log('📊 [3] 模型分布检查:');

const countModelsInScene = (scene, name) => {
  if (!scene) {
    console.log(`  ${name}: 场景未找到`);
    return;
  }

  let meshCount = 0;
  let largeCoordCount = 0;

  scene.traverse((obj) => {
    if (obj.isMesh) {
      meshCount++;
      const pos = obj.position;
      if (Math.abs(pos.x) > 10000 || Math.abs(pos.z) > 10000) {
        largeCoordCount++;
      }
    }
  });

  console.log(`  ${name}:`);
  console.log(`    总Mesh: ${meshCount}`);
  console.log(`    大坐标: ${largeCoordCount}`);
};

countModelsInScene(viewer.originalLayer?.scene, '原始层');
countModelsInScene(viewer.bimLayer?.scene, 'BIM层');

// 4. 检查材质深度设置
console.log('');
console.log('📊 [4] 材质深度设置检查:');

let noDepthTest = 0;
let noDepthWrite = 0;

const checkMaterials = (scene) => {
  if (!scene) return;
  scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach(mat => {
        if (!mat.depthTest) noDepthTest++;
        if (!mat.depthWrite) noDepthWrite++;
      });
    }
  });
};

checkMaterials(viewer.originalLayer?.scene);
checkMaterials(viewer.bimLayer?.scene);

console.log(`  禁用depthTest: ${noDepthTest}`);
console.log(`  禁用depthWrite: ${noDepthWrite}`);

if (noDepthTest > 0) {
  console.log('  ⚠️  有模型禁用了深度测试！');
}

// 5. 检查渲染器配置
console.log('');
console.log('📊 [5] 渲染器配置:');

if (viewer.originalLayer?.renderer) {
  const caps = viewer.originalLayer.renderer.capabilities;
  console.log(`  logarithmicDepthBuffer: ${caps.isLogarithmicDepthBuffer ? '✅' : '❌'}`);
}

// 6. 查找是否有模型的坐标被错误设置
console.log('');
console.log('📊 [6] 模型坐标异常检查:');

const findAbnormalModels = (scene, name) => {
  if (!scene) return;

  let abnormalCount = 0;

  scene.traverse((obj) => {
    if (obj.isMesh && abnormalCount < 3) {
      const pos = obj.position;

      // 检查是否有NaN或Inf
      if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) {
        console.log(`  ${name} 发现异常坐标: (${pos.x}, ${pos.y}, ${pos.z})`);
        abnormalCount++;
      }
    }
  });

  if (abnormalCount === 0) {
    console.log(`  ${name}: 未发现异常坐标`);
  }
};

findAbnormalModels(viewer.originalLayer?.scene, '原始层');
findAbnormalModels(viewer.bimLayer?.scene, 'BIM层');

console.log('');
console.log('========== 诊断完成 ==========');
console.log('');
console.log('💡 如果问题依旧，请提供以下信息:');
console.log('   1. 哪些模型显示"远大近小"？（大坐标GLB还是相对坐标模型？）');
console.log('   2. 透视翻转是在整个场景中都存在，还是只发生在某些模型？');
console.log('   3. 是否有模型完全不可见？');
