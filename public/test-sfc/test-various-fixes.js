// 测试各种透视翻转修复方案

console.log('========== 测试透视翻转修复方案 ==========');

const viewer = window.__dualCanvasViewer;
if (!viewer.camera1 || !viewer.renderer1) {
  console.error('❌ 必要的组件未找到');
  throw new Error('必要的组件未找到');
}

const cam = viewer.camera1;
const renderer = viewer.renderer1;

console.log('当前状态:');
console.log('  near:', cam.near.toFixed(2));
console.log('  far:', cam.far.toFixed(2));
console.log('  FOV:', cam.fov);
console.log('  位置:', cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2));

// 测试方案
const tests = [
  {
    name: '测试1: 极小的 near/far (1/100)',
    fn: () => {
      cam.near = 1;
      cam.far = 100;
      cam.updateProjectionMatrix();
    }
  },
  {
    name: '测试2: 翻转投影矩阵 [10,10] 元素',
    fn: () => {
      const near = cam.near;
      const far = cam.far;
      cam.projectionMatrix.elements[10] = -cam.projectionMatrix.elements[10];
      cam.updateProjectionMatrix();
    }
  },
  {
    name: '测试3: 翻转相机的 up 向量',
    fn: () => {
      cam.up.y = -cam.up.y;
      cam.updateMatrixWorld();
    }
  },
  {
    name: '测试4: 交换 near 和 far',
    fn: () => {
      const temp = cam.near;
      cam.near = cam.far;
      cam.far = temp;
      cam.updateProjectionMatrix();
    }
  }
];

let currentTest = 0;

const runTest = () => {
  if (currentTest >= tests.length) {
    console.log('');
    console.log('========== 所有测试完成 ==========');
    console.log('请告诉哪个测试（如果有）让透视恢复正常？');
    return;
  }

  const test = tests[currentTest];
  console.log('');
  console.log(`========== ${test.name} ==========`);

  // 先重置状态
  cam.near = 0.1;
  cam.far = 10000;
  cam.up.set(0, 1, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();

  // 执行测试
  test.fn();

  // 显示新状态
  console.log('应用后:');
  console.log('  near:', cam.near.toFixed(2));
  console.log('  far:', cam.far.toFixed(2));
  console.log('  up:', cam.up.x.toFixed(4), cam.up.y.toFixed(4), cam.up.z.toFixed(4));

  console.log('');
  console.log('请观察8秒...');
  console.log('如果透视正常，按 Y；如果还是翻转，按其他键继续下一个测试');

  // 等待用户输入
  const waitForKey = () => {
    const handler = (e) => {
      if (e.key === 'y' || e.key === 'Y') {
        document.removeEventListener('keydown', handler);
        console.log('');
        console.log(`✅ ${test.name} 修复成功！`);
        console.log('保持此设置并创建永久修复脚本');
        createPermanentFix(test);
      } else {
        document.removeEventListener('keydown', handler);
        currentTest++;
        if (currentTest < tests.length) {
          setTimeout(runTest, 100);
        } else {
          console.log('');
          console.log('========== 所有测试完成 ==========');
          console.log('没有找到有效的修复方案');
          console.log('问题可能需要其他方法解决');
        }
      }
    };
    document.addEventListener('keydown', handler);
  };

  setTimeout(waitForKey, 1000);
};

const createPermanentFix = (successfulTest) => {
  console.log('');
  console.log('========== 创建永久修复脚本 ==========');
  console.log(`基于成功的测试: ${successfulTest.name}`);
  // 这里可以根据成功的测试创建永久修复脚本
};

console.log('');
console.log('开始测试系列修复方案...');
console.log('每个测试持续8秒');
console.log('如果某个测试让透视正常，按 Y 键');
console.log('否则按其他键继续下一个测试');
console.log('');
console.log('3秒后开始...');

setTimeout(runTest, 3000);
