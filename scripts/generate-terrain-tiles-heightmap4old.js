/**
 * generate-terrain-tiles.js
 *
 * 将 Copernicus GLO-30 DEM GeoTIFF 转换为 Cesium heightmap-1.0 terrain tiles。
 *
 * 输入: public/data/dem/copernicus_glo30.tif (3600×3600, 1°×1°)
 * 输出: public/data/dem/terrain/copernicus_glo30/
 *       ├── layer.json
 *       └── {z}/{x}/{y}.terrain  (65×65 Int16 heightmap)
 *
 * 运行: node scripts/generate-terrain-tiles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Browser shims for geotiff bundle ──────────────────────────────
// geotiff.bundle.min.js 是浏览器 UMD bundle，部分初始化代码
// 需要 window/document 等浏览器全局对象。在 Node.js 中提供最小 shim。
global.self = global;
global.window = global;
global.document = {
  createElement: () => ({ getContext: () => null, style: {} }),
  createElementNS: () => ({}),
  body: { appendChild: () => {}, removeChild: () => {} }
};
// navigator 在 Node 21+ 已是只读 getter，不覆盖
// location 同理
try { global.location = { href: 'http://localhost' }; } catch (e) { /* 只读属性，跳过 */ }
global.Blob = class Blob { constructor() { this.size = 0; this.type = ''; } };
global.FileReader = class FileReader {
  readAsArrayBuffer() { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }); }
  readAsDataURL() {}
};
global.Image = class Image { constructor() { this.onload = null; this.onerror = null; this.src = ''; } };
global.XMLHttpRequest = class XMLHttpRequest {
  open() {} send() { if (this.onerror) this.onerror(); }
  get responseType() { return this._rt; } set responseType(v) { this._rt = v; }
  get response() { return null; }
};
global.Worker = undefined;
global.OffscreenCanvas = undefined;
global.createImageBitmap = undefined;
global.fetch = undefined;
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.addEventListener = () => {};
global.removeEventListener = () => {};
// ──────────────────────────────────────────────────────────────────

// geotiff.bundle.min.cjs 是 .js 的副本（.cjs 强制 CJS 加载）
const GeoTIFF = require('./geotiff.bundle.min.cjs');

const TILE_SIZE = 65;           // Cesium heightmap tile: 65×65 采样点
const MIN_ZOOM = 0;   // 从 level 0 开始，确保所有相机高度都能看到地形
const MAX_ZOOM = 12;

const INPUT_TIF = path.resolve(__dirname, '../public/data/dem/copernicus_glo30.tif');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data/dem/terrain/copernicus_glo30');

/**
 * 获取 GeoTIFF 的地理范围
 */
function getGeoBounds(image) {
  const origin = image.getOrigin();
  const resolution = image.getResolution();
  const w = image.getWidth();
  const h = image.getHeight();

  if (origin && resolution && origin.length >= 2 && resolution.length >= 2 &&
      isFinite(origin[0]) && isFinite(origin[1]) &&
      isFinite(resolution[0]) && isFinite(resolution[1])) {
    return {
      west: origin[0],
      east: origin[0] + w * Math.abs(resolution[0]),
      south: origin[1] - h * Math.abs(resolution[1]),
      north: origin[1]
    };
  }
  // 回退到已知范围（四川 103-104°E, 30-31°N）
  console.warn('⚠️ 无法从 GeoTIFF 读取地理元数据，使用默认范围');
  return { west: 103, east: 104, south: 30, north: 31 };
}

/**
 * TMS GeographicTilingScheme (EPSG:4326) tile 坐标计算
 *
 * level 0: 2 个 tile 横跨 360° (x: 0-1)
 * level N: 2^(N+1) 个 tile 横跨 360° (x), 2^N 个 tile 横跨 180° (y)
 */
function lonToTileX(lon, level) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, level + 1));
}

function latToTileY(lat, level) {
  return Math.floor((90 - lat) / 180 * Math.pow(2, level));
}

function tileXToLon(x, level) {
  return x / Math.pow(2, level + 1) * 360 - 180;
}

function tileYToLat(y, level) {
  return 90 - (y + 1) / Math.pow(2, level) * 180;
}

// ══════════════════════════════════════════════════════════════════
// Tiling Scheme 定义 — 支持多种瓦片坐标方案
// ══════════════════════════════════════════════════════════════════

const TILING_SCHEMES = {
  geographic: {
    name: 'GeographicTilingScheme (EPSG:4326)',
    description: 'Cesium 默认地理瓦片方案 — X 方向 2^(N+1) 个瓦片覆盖 360°',
    xtilesAtLevel: (level) => Math.pow(2, level + 1),
    ytilesAtLevel: (level) => Math.pow(2, level),
    lonToX: (lon, level) => Math.floor((lon + 180) / 360 * Math.pow(2, level + 1)),
    latToY: (lat, level) => Math.floor((90 - lat) / 180 * Math.pow(2, level)),
    xToLon: (x, level) => x / Math.pow(2, level + 1) * 360 - 180,
    yToLat: (y, level) => 90 - (y + 1) / Math.pow(2, level) * 180,
  },
  'web-mercator': {
    name: 'WebMercatorTilingScheme 风格的经纬度网格',
    description: 'X/Y 方向均 2^N 个瓦片（与 Cesium GeographicTilingScheme 不兼容！）',
    xtilesAtLevel: (level) => Math.pow(2, level),
    ytilesAtLevel: (level) => Math.pow(2, level),
    lonToX: (lon, level) => Math.floor((lon + 180) / 360 * Math.pow(2, level)),
    latToY: (lat, level) => Math.floor((90 - lat) / 180 * Math.pow(2, level)),
    xToLon: (x, level) => x / Math.pow(2, level) * 360 - 180,
    yToLat: (y, level) => 90 - (y + 1) / Math.pow(2, level) * 180,
  }
};

/**
 * 解析 CLI 参数
 * @returns {object} { validate, diagnose, tilingScheme, noCheck, help }
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    validate: false,
    diagnose: false,
    tilingScheme: 'geographic',
    noCheck: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--validate':
        opts.validate = true;
        break;
      case '--diagnose':
        opts.diagnose = true;
        break;
      case '--tiling-scheme':
        if (args[i + 1] && TILING_SCHEMES[args[i + 1]]) {
          opts.tilingScheme = args[i + 1];
          i++;
        } else {
          console.error(`❌ 未知的 tiling scheme: ${args[i + 1] || '(未指定)'}`);
          console.error(`   可用选项: ${Object.keys(TILING_SCHEMES).join(', ')}`);
          process.exit(1);
        }
        break;
      case '--no-check':
        opts.noCheck = true;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        console.error(`❌ 未知参数: ${args[i]}`);
        opts.help = true;
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
用法: node generate-terrain-tiles-heightmap4old.js [选项]

选项:
  --validate              仅验证现有 terrain 数据，不重新生成
  --diagnose              打印瓦片坐标诊断报告后退出
  --tiling-scheme <name>  指定 tiling scheme，默认 geographic
                          可用: ${Object.keys(TILING_SCHEMES).join(', ')}
  --no-check              跳过生成后的自动验证
  --help, -h              显示此帮助信息

示例:
  node generate-terrain-tiles-heightmap4old.js
  node generate-terrain-tiles-heightmap4old.js --diagnose
  node generate-terrain-tiles-heightmap4old.js --validate
  node generate-terrain-tiles-heightmap4old.js --tiling-scheme web-mercator
`);
}

// ══════════════════════════════════════════════════════════════════
// 验证与诊断函数
// ══════════════════════════════════════════════════════════════════

/**
 * 检测磁盘上 terrain 数据使用的是哪种 tiling scheme
 *
 * 原理：读取某个 level 的 X 目录名，用两种 scheme 的 xToLon 反算经度，
 * 比对 bounds 看哪个匹配。
 *
 * @param {object} bounds - {west, east, south, north}
 * @param {string} outputDir - terrain tiles 根目录
 * @returns {object} { detected, confidence, evidence }
 */
function detectTilingScheme(bounds, outputDir) {
  if (!fs.existsSync(outputDir)) {
    return { detected: null, confidence: 0, evidence: '输出目录不存在' };
  }

  const schemes = Object.keys(TILING_SCHEMES);
  const scores = {};

  for (const key of schemes) {
    scores[key] = { matches: 0, mismatches: 0, details: [] };
  }

  // 选取一个中间 level 来检测（level 太小编号太小区分度不够，level 太大文件太多）
  const testLevels = [];
  for (let level = 4; level <= Math.min(10, MAX_ZOOM); level++) {
    const levelDir = path.join(outputDir, String(level));
    if (fs.existsSync(levelDir)) {
      testLevels.push(level);
      if (testLevels.length >= 3) break;
    }
  }

  if (testLevels.length === 0) {
    return { detected: null, confidence: 0, evidence: '未找到任何 level 目录' };
  }

  for (const level of testLevels) {
    const levelDir = path.join(outputDir, String(level));
    const entries = fs.readdirSync(levelDir, { withFileTypes: true });
    const xDirs = entries.filter(e => e.isDirectory()).map(e => parseInt(e.name)).filter(n => !isNaN(n));

    if (xDirs.length === 0) continue;

    // 取最小和最大 X 来检测
    const sampleX = [xDirs[0], xDirs[xDirs.length - 1]];

    for (const x of sampleX) {
      for (const key of schemes) {
        const scheme = TILING_SCHEMES[key];
        // 检查瓦片覆盖范围是否与 DEM bounds 重叠（而非仅检查左边缘）
        const tileWest = scheme.xToLon(x, level);
        const tileEast = scheme.xToLon(x + 1, level);
        const overlaps = tileWest < bounds.east && tileEast > bounds.west;
        if (overlaps) {
          scores[key].matches++;
          scores[key].details.push(`level ${level} X=${x} 覆盖 [${tileWest.toFixed(2)}°, ${tileEast.toFixed(2)}°] ⊃ bounds ✓`);
        } else {
          scores[key].mismatches++;
          scores[key].details.push(`level ${level} X=${x} 覆盖 [${tileWest.toFixed(2)}°, ${tileEast.toFixed(2)}°] ⊅ bounds ✗`);
        }
      }
    }
  }

  // 判定：选择匹配数最多、不匹配数最少的 scheme
  let best = null;
  let bestScore = -Infinity;
  for (const key of schemes) {
    const s = scores[key];
    const score = s.matches - s.mismatches * 2; // 不匹配扣分更重
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  const evidence = [];
  for (const key of schemes) {
    evidence.push(`  ${TILING_SCHEMES[key].name}: ${scores[key].matches} 匹配, ${scores[key].mismatches} 不匹配`);
    for (const detail of scores[key].details.slice(0, 3)) {
      evidence.push(`    ${detail}`);
    }
  }

  const confidence = bestScore > 0 ? Math.min(1, bestScore / (testLevels.length * 2)) : 0;

  return {
    detected: confidence > 0.5 ? best : null,
    confidence,
    evidence: evidence.join('\n'),
    scores
  };
}

/**
 * 验证瓦片四叉树的自洽性
 * 检查 level N 的 tile 在 level N-1 是否有父 tile
 *
 * @param {string} outputDir
 * @param {number} minZoom
 * @param {number} maxZoom
 * @returns {object} { valid, issues }
 */
function validateSelfConsistency(outputDir, minZoom, maxZoom) {
  const issues = [];

  for (let level = minZoom + 1; level <= maxZoom; level++) {
    const parentDir = path.join(outputDir, String(level - 1));
    const childDir = path.join(outputDir, String(level));

    if (!fs.existsSync(parentDir) || !fs.existsSync(childDir)) continue;

    const childXDirs = fs.readdirSync(childDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => parseInt(e.name))
      .filter(n => !isNaN(n));

    for (const cx of childXDirs) {
      const px = Math.floor(cx / 2);
      const parentXDir = path.join(parentDir, String(px));

      if (!fs.existsSync(parentXDir)) {
        issues.push(`level ${level} X=${cx}: 父 tile level ${level - 1} X=${px} 目录不存在`);
        continue;
      }

      // 抽查 Y 文件
      const childYFiles = fs.readdirSync(path.join(childDir, String(cx)))
        .filter(f => f.endsWith('.terrain'))
        .map(f => parseInt(f.replace('.terrain', '')))
        .filter(n => !isNaN(n));

      if (childYFiles.length > 0) {
        const sampleY = childYFiles[0];
        const py = Math.floor(sampleY / 2);
        const parentFile = path.join(parentXDir, `${py}.terrain`);
        if (!fs.existsSync(parentFile)) {
          issues.push(`level ${level} tile (${cx},${sampleY}): 父 tile (${px},${py}) 文件不存在`);
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * 验证生成的瓦片与 Cesium GeographicTilingScheme 的兼容性
 * 模拟 Cesium 会请求的坐标，检查对应文件是否存在
 *
 * @param {string} outputDir
 * @param {object} bounds
 * @param {string} schemeKey — TILING_SCHEMES 的 key
 * @returns {object} { valid, report, mismatchScheme }
 */
function validateCesiumCompatibility(outputDir, bounds, schemeKey) {
  const scheme = TILING_SCHEMES[schemeKey];
  const report = [];
  let totalChecked = 0;
  let foundCount = 0;

  // 采样点：bounds 的四角 + 中心
  const samplePoints = [
    { name: '西北角', lon: bounds.west, lat: bounds.north },
    { name: '东北角', lon: bounds.east, lat: bounds.north },
    { name: '西南角', lon: bounds.west, lat: bounds.south },
    { name: '东南角', lon: bounds.east, lat: bounds.south },
    { name: '中心点', lon: (bounds.west + bounds.east) / 2, lat: (bounds.south + bounds.north) / 2 },
  ];

  // 在几个关键 level 上检查
  const checkLevels = [8, 9, 10, 11, 12].filter(l => l <= MAX_ZOOM && l >= MIN_ZOOM);

  report.push(`\n🔍 Cesium 兼容性验证 (${scheme.name})`);
  report.push(`${'─'.repeat(70)}`);
  report.push(`  采样点: bounds 四角 + 中心`);
  report.push(`  检查级别: ${checkLevels.join(', ')}`);
  report.push('');

  for (const level of checkLevels) {
    const levelDir = path.join(outputDir, String(level));
    if (!fs.existsSync(levelDir)) {
      report.push(`  Level ${level}: ⚠ 目录不存在，跳过`);
      continue;
    }

    const levelResults = [];
    for (const pt of samplePoints) {
      const x = scheme.lonToX(pt.lon, level);
      const y = scheme.latToY(pt.lat, level);
      const filePath = path.join(outputDir, String(level), String(x), `${y}.terrain`);
      const exists = fs.existsSync(filePath);
      totalChecked++;
      if (exists) foundCount++;
      levelResults.push({ pt, x, y, exists });
    }

    report.push(`  Level ${level}:`);
    for (const r of levelResults) {
      const status = r.exists ? '✅' : '❌';
      report.push(`    ${status} (${r.pt.name}) tile(${r.x},${r.y}) → lon=${r.pt.lon.toFixed(2)}° lat=${r.pt.lat.toFixed(2)}°`);
    }
  }

  const allFound = foundCount === totalChecked;
  report.push(`\n  结果: ${foundCount}/${totalChecked} 文件存在`);

  // 如果不匹配，检测是否是另一种 scheme
  let mismatchScheme = null;
  if (!allFound) {
    const otherKey = schemeKey === 'geographic' ? 'web-mercator' : 'geographic';
    const otherScheme = TILING_SCHEMES[otherKey];
    let altFound = 0;
    let altChecked = 0;

    report.push(`\n  ⚠ 检测到坐标不匹配！尝试用 ${otherScheme.name} 反查...`);

    for (const level of checkLevels) {
      for (const pt of samplePoints) {
        const x = otherScheme.lonToX(pt.lon, level);
        const y = otherScheme.latToY(pt.lat, level);
        const filePath = path.join(outputDir, String(level), String(x), `${y}.terrain`);
        altChecked++;
        if (fs.existsSync(filePath)) altFound++;
      }
    }

    report.push(`  用 ${otherScheme.name} 坐标查找: ${altFound}/${altChecked} 文件存在`);

    if (altFound > foundCount) {
      mismatchScheme = otherKey;
      report.push(`\n  ❌ 根因确认：磁盘瓦片使用 ${otherScheme.name} 坐标，`);
      report.push(`     但 Cesium 使用 ${scheme.name} 坐标！`);
      report.push(`     解决方案：`);
      report.push(`     1. 删除 ${outputDir} 目录`);
      report.push(`     2. 重新运行: node scripts/generate-terrain-tiles-heightmap4old.js --tiling-scheme ${schemeKey}`);
    }
  }

  return {
    valid: allFound,
    report: report.join('\n'),
    mismatchScheme,
    stats: { totalChecked, foundCount }
  };
}

/**
 * 打印瓦片坐标诊断报告
 * 显示两种 scheme 在不同 level 的坐标对比
 *
 * @param {object} bounds
 * @param {string} outputDir — 如果存在，对比实际文件
 * @param {string} activeScheme
 */
function printDiagnosticReport(bounds, outputDir, activeScheme) {
  const centerLon = (bounds.west + bounds.east) / 2;
  const centerLat = (bounds.south + bounds.north) / 2;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           瓦片坐标诊断报告 (Tile Coordinate Diagnostic)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`🌍 DEM 范围: ${bounds.west}° ~ ${bounds.east}°E, ${bounds.south}° ~ ${bounds.north}°N`);
  console.log(`📍 中心点: lon=${centerLon.toFixed(4)}° lat=${centerLat.toFixed(4)}°`);
  console.log(`🎯 当前 tiling scheme: ${TILING_SCHEMES[activeScheme].name}\n`);

  // 坐标对比表
  const levels = [0, 4, 8, 9, 10, 11, 12];
  const schemes = Object.keys(TILING_SCHEMES);

  console.log('📊 中心点在不同 scheme 下的坐标对比:');
  console.log('┌───────┬──────────────────────────────┬──────────────────────────────┐');
  console.log('│ Level │ GeographicTilingScheme (Cesium) │  WebMercator-style (错误方案) │');
  console.log('│       │ X 范围: 0~2^(N+1)-1          │ X 范围: 0~2^N-1              │');
  console.log('├───────┼──────────────────────────────┼──────────────────────────────┤');

  for (const level of levels) {
    const gx = TILING_SCHEMES.geographic.lonToX(centerLon, level);
    const gy = TILING_SCHEMES.geographic.latToY(centerLat, level);
    const gxMax = TILING_SCHEMES.geographic.xtilesAtLevel(level) - 1;

    const wx = TILING_SCHEMES['web-mercator'].lonToX(centerLon, level);
    const wy = TILING_SCHEMES['web-mercator'].latToY(centerLat, level);
    const wxMax = TILING_SCHEMES['web-mercator'].xtilesAtLevel(level) - 1;

    // 标记哪个坐标在有效范围内
    const gOk = gx <= gxMax ? '✓' : '✗';
    const wOk = wx <= wxMax ? '✓' : '✗';

    console.log(`│  ${String(level).padEnd(4)} │ X=${String(gx).padEnd(4)} Y=${String(gy).padEnd(3)} (maxX=${gxMax}) ${gOk} │ X=${String(wx).padEnd(4)} Y=${String(wy).padEnd(3)} (maxX=${wxMax}) ${wOk} │`);
  }
  console.log('└───────┴──────────────────────────────┴──────────────────────────────┘');

  // 如果输出目录存在，对比实际文件
  if (outputDir && fs.existsSync(outputDir)) {
    console.log('\n📁 磁盘实际数据检测:');

    const detection = detectTilingScheme(bounds, outputDir);
    if (detection.detected) {
      const matchExpected = detection.detected === activeScheme;
      const icon = matchExpected ? '✅' : '❌';
      console.log(`   ${icon} 检测到的 scheme: ${TILING_SCHEMES[detection.detected].name}`);
      console.log(`   置信度: ${(detection.confidence * 100).toFixed(0)}%`);
      if (!matchExpected) {
        console.log(`   ⚠ 与预期 scheme (${TILING_SCHEMES[activeScheme].name}) 不一致！`);
        console.log(`   💡 修复: 删除输出目录后重新生成，或使用 --tiling-scheme ${detection.detected}`);
      }
    } else {
      console.log('   ⚠ 无法确定使用的 tiling scheme');
    }
    console.log(`\n${detection.evidence}`);
  }

  console.log('\n💡 提示:');
  console.log('   Cesium 的 GeographicTilingScheme 在 level N 有 2^(N+1) 个 X 瓦片');
  console.log('   如果地形数据用 2^N 个 X 瓦片生成，Cesium 请求的坐标将找不到文件');
  console.log('   两者的 X 坐标正好相差 2 倍（在高 level 更明显）');
  console.log('');
}

/**
 * 双线性插值采样 DEM 数据
 * @param {Float32Array|TypedArray} band - DEM 高程数据 (row-major, top-down)
 * @param {number} width - DEM 宽度 (像素)
 * @param {number} height - DEM 高度 (像素)
 * @param {object} bounds - {west, east, south, north}
 * @param {number} lon - 采样经度
 * @param {number} lat - 采样纬度
 * @returns {number} 高程值 (米), 或 DEM 范围外的 -9999
 */
function sampleDem(band, width, height, bounds, lon, lat) {
  // 超出 DEM 范围
  if (lon < bounds.west || lon > bounds.east || lat < bounds.south || lat > bounds.north) {
    return -9999;
  }

  // 像素坐标 (浮点)
  const px = (lon - bounds.west) / (bounds.east - bounds.west) * width;
  const py = (bounds.north - lat) / (bounds.north - bounds.south) * height;

  // 四个最近像素的整数坐标
  const x0 = Math.floor(px);
  const x1 = Math.min(x0 + 1, width - 1);
  const y0 = Math.floor(py);
  const y1 = Math.min(y0 + 1, height - 1);

  // 边界裁剪
  if (x0 < 0 || x1 >= width || y0 < 0 || y1 >= height) {
    return -9999;
  }

  // 双线性插值权重
  const fx = px - x0;
  const fy = py - y0;

  // 四个角的值 (row-major: index = y * width + x)
  const v00 = band[y0 * width + x0];
  const v10 = band[y0 * width + x1];
  const v01 = band[y1 * width + x0];
  const v11 = band[y1 * width + x1];

  // 处理 nodata 值
  const valid = [];
  if (isFinite(v00) && v00 > -9999) valid.push(v00);
  if (isFinite(v10) && v10 > -9999) valid.push(v10);
  if (isFinite(v01) && v01 > -9999) valid.push(v01);
  if (isFinite(v11) && v11 > -9999) valid.push(v11);

  if (valid.length === 0) return -9999;

  // 双线性插值 (用有效值替代无效值)
  const w00 = isFinite(v00) && v00 > -9999 ? (1 - fx) * (1 - fy) : 0;
  const w10 = isFinite(v10) && v10 > -9999 ? fx * (1 - fy) : 0;
  const w01 = isFinite(v01) && v01 > -9999 ? (1 - fx) * fy : 0;
  const w11 = isFinite(v11) && v11 > -9999 ? fx * fy : 0;
  const totalWeight = w00 + w10 + w01 + w11;

  if (totalWeight < 0.0001) {
    // 如果权重太小，用最近邻
    return valid[0];
  }

  return (v00 * w00 + v10 * w10 + v01 * w01 + v11 * w11) / totalWeight;
}

/**
 * 为指定 tile 生成 heightmap 数据 (Int16 数组, 65×65)
 * 编码: heightValue = Math.round(elevation * 5.0), 精度 0.2m
 */
function generateHeightmap(band, width, height, bounds, tileX, tileY, level) {
  const tileLonWest = tileXToLon(tileX, level);
  const tileLonEast = tileXToLon(tileX + 1, level);
  // tileYToLat(y) 返回 tile 行 y 的南边界
  // 北边界 = 90 - y / 2^level * 180
  const tileLatNorth = 90 - tileY / Math.pow(2, level) * 180;
  const tileLatSouth = tileYToLat(tileY, level);

  const lonStep = (tileLonEast - tileLonWest) / (TILE_SIZE - 1);
  const latStep = (tileLatNorth - tileLatSouth) / (TILE_SIZE - 1);

  const heightmap = new Int16Array(TILE_SIZE * TILE_SIZE);
  let hasValid = false;

  for (let row = 0; row < TILE_SIZE; row++) {
    for (let col = 0; col < TILE_SIZE; col++) {
      const lon = tileLonWest + col * lonStep;
      const lat = tileLatNorth - row * latStep;  // top-down
      const elevation = sampleDem(band, width, height, bounds, lon, lat);

      let encoded;
      if (isFinite(elevation) && elevation > -9999) {
        // Cesium heightmap-1.0: storedValue = elevation * 5 (精度 0.2m)
        encoded = Math.round(elevation * 5.0);
        // 限制在 Int16 范围
        encoded = Math.max(-32768, Math.min(32767, encoded));
        hasValid = true;
      } else {
        // 无数据区域: 使用海平面 (0m → encoded = 0)
        encoded = 0;
      }

      heightmap[row * TILE_SIZE + col] = encoded;
    }
  }

  return hasValid ? heightmap : null;
}

/**
 * 将 Int16Array 写入二进制 .terrain 文件
 * heightmap-1.0 格式: 65×65 Int16 LE + 1 字节 child mask = 8451 字节
 * child mask 告诉 Cesium 哪些子瓦片存在，防止 Cesium 不细化
 */
function writeTerrainFile(filePath, heightmap, level) {
  const dataLen = TILE_SIZE * TILE_SIZE * 2;
  const buf = Buffer.allocUnsafe(dataLen + 1);
  for (let i = 0; i < heightmap.length; i++) {
    buf.writeInt16LE(heightmap[i], i * 2);
  }
  // childMask: level < MAX_ZOOM 时设为 15（4 个子瓦片都存在），MAX_ZOOM 时设为 0
  buf[dataLen] = level < MAX_ZOOM ? 15 : 0;
  fs.writeFileSync(filePath, buf);
}

async function main() {
  // ── 解析 CLI 参数 ─────────────────────────────────────────
  const opts = parseArgs();

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const scheme = TILING_SCHEMES[opts.tilingScheme];
  console.log('══════════════════════════════════════════════');
  console.log('  Copernicus GLO-30 → Cesium Terrain Tiles');
  console.log('══════════════════════════════════════════════\n');

  console.log(`🎯 Tiling Scheme: ${scheme.name}`);
  console.log(`   ${scheme.description}\n`);

  // ── --diagnose: 仅打印诊断报告 ──────────────────────────
  if (opts.diagnose) {
    // 尝试从 GeoTIFF 或 layer.json 读取 bounds
    let bounds;
    if (fs.existsSync(INPUT_TIF)) {
      const tifBuffer = fs.readFileSync(INPUT_TIF);
      const arrayBuffer = tifBuffer.buffer.slice(
        tifBuffer.byteOffset,
        tifBuffer.byteOffset + tifBuffer.byteLength
      );
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      bounds = getGeoBounds(image);
    } else if (fs.existsSync(path.join(OUTPUT_DIR, 'layer.json'))) {
      const meta = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'layer.json'), 'utf-8'));
      bounds = { west: meta.bounds[0], east: meta.bounds[2], south: meta.bounds[1], north: meta.bounds[3] };
    } else {
      bounds = { west: 103, east: 104, south: 30, north: 31 };
      console.warn('⚠️ 无法获取地理范围，使用默认值');
    }
    printDiagnosticReport(bounds, OUTPUT_DIR, opts.tilingScheme);
    process.exit(0);
  }

  // ── --validate: 仅验证现有数据 ───────────────────────────
  if (opts.validate) {
    console.log('🔍 验证模式：检查现有 terrain 数据...\n');

    if (!fs.existsSync(OUTPUT_DIR)) {
      console.error(`❌ 输出目录不存在: ${OUTPUT_DIR}`);
      process.exit(1);
    }

    // 从 layer.json 读取 bounds
    const layerJsonPath = path.join(OUTPUT_DIR, 'layer.json');
    let bounds;
    if (fs.existsSync(layerJsonPath)) {
      const meta = JSON.parse(fs.readFileSync(layerJsonPath, 'utf-8'));
      bounds = { west: meta.bounds[0], east: meta.bounds[2], south: meta.bounds[1], north: meta.bounds[3] };
      console.log(`📄 从 layer.json 读取范围: ${bounds.west}°~${bounds.east}°E, ${bounds.south}°~${bounds.north}°N`);
    } else {
      // 尝试从 GeoTIFF 获取
      if (fs.existsSync(INPUT_TIF)) {
        const tifBuffer = fs.readFileSync(INPUT_TIF);
        const arrayBuffer = tifBuffer.buffer.slice(
          tifBuffer.byteOffset,
          tifBuffer.byteOffset + tifBuffer.byteLength
        );
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        bounds = getGeoBounds(image);
      } else {
        console.error('❌ 无法确定地理范围（layer.json 和 GeoTIFF 均不存在）');
        process.exit(1);
      }
    }

    // 1. 检测 tiling scheme
    console.log('\n📋 步骤 1/3: 检测 tiling scheme...');
    const detection = detectTilingScheme(bounds, OUTPUT_DIR);
    if (detection.detected) {
      const matchIcon = detection.detected === opts.tilingScheme ? '✅' : '❌';
      console.log(`  ${matchIcon} 检测到: ${TILING_SCHEMES[detection.detected].name} (置信度: ${(detection.confidence * 100).toFixed(0)}%)`);
      if (detection.detected !== opts.tilingScheme) {
        console.log(`  ⚠ 与预期 scheme (${scheme.name}) 不一致！`);
      }
    } else {
      console.log('  ⚠ 无法确定 tiling scheme');
    }

    // 2. 自洽性验证
    console.log('\n📋 步骤 2/3: 四叉树自洽性验证...');
    const consistency = validateSelfConsistency(OUTPUT_DIR, MIN_ZOOM, MAX_ZOOM);
    if (consistency.valid) {
      console.log('  ✅ 所有瓦片父子关系正确');
    } else {
      console.log(`  ❌ 发现 ${consistency.issues.length} 个问题:`);
      for (const issue of consistency.issues.slice(0, 10)) {
        console.log(`    - ${issue}`);
      }
      if (consistency.issues.length > 10) {
        console.log(`    ... 还有 ${consistency.issues.length - 10} 个问题`);
      }
    }

    // 3. Cesium 兼容性
    console.log('\n📋 步骤 3/3: Cesium 兼容性验证...');
    const compat = validateCesiumCompatibility(OUTPUT_DIR, bounds, opts.tilingScheme);
    console.log(compat.report);

    // 打印诊断报告
    printDiagnosticReport(bounds, OUTPUT_DIR, opts.tilingScheme);

    // 整体结论（以 Cesium 兼容性为主要判断依据）
    const allPassed = consistency.valid && compat.valid;
    console.log('\n══════════════════════════════════════════════');
    if (allPassed) {
      console.log('  ✅ 验证通过：terrain 数据与 Cesium 兼容');
    } else {
      console.log('  ❌ 验证失败：存在需要修复的问题');
      if (!consistency.valid) {
        console.log(`  💡 四叉树问题: ${consistency.issues.length} 个`);
      }
      if (compat.mismatchScheme) {
        console.log(`  💡 tiling scheme 不匹配，建议删除 ${OUTPUT_DIR} 后重新生成`);
      }
    }
    console.log('══════════════════════════════════════════════');
    process.exit(allPassed ? 0 : 1);
  }

  // ── 正常生成流程 ─────────────────────────────────────────
  // 检查输入文件
  if (!fs.existsSync(INPUT_TIF)) {
    console.error(`❌ 输入文件不存在: ${INPUT_TIF}`);
    process.exit(1);
  }

  const stat = fs.statSync(INPUT_TIF);
  console.log(`📂 输入文件: ${INPUT_TIF} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);

  // 读取 GeoTIFF（使用 fromArrayBuffer，因为浏览器 bundle 的 fromFile 依赖 File API）
  console.log('📖 读取 GeoTIFF...');
  const tifBuffer = fs.readFileSync(INPUT_TIF);
  const arrayBuffer = tifBuffer.buffer.slice(
    tifBuffer.byteOffset,
    tifBuffer.byteOffset + tifBuffer.byteLength
  );
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const raster = await image.readRasters();
  const band = raster[0];

  const width = image.getWidth();
  const height = image.getHeight();
  console.log(`   栅格尺寸: ${width} × ${height}`);

  // 统计高程范围
  let minH = Infinity, maxH = -Infinity, validCount = 0;
  for (let i = 0; i < band.length; i++) {
    const v = band[i];
    if (isFinite(v) && v > -9999) {
      if (v < minH) minH = v;
      if (v > maxH) maxH = v;
      validCount++;
    }
  }
  console.log(`   高程范围: ${minH.toFixed(1)} ~ ${maxH.toFixed(1)} m (有效像素: ${validCount.toLocaleString()})`);

  // 地理范围
  const bounds = getGeoBounds(image);
  console.log(`   地理范围: ${bounds.west.toFixed(4)}° ~ ${bounds.east.toFixed(4)}°E, ${bounds.south.toFixed(4)}° ~ ${bounds.north.toFixed(4)}°N`);

  // ── 生成前检测已有数据 ──────────────────────────────────
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log('\n⚠️ 输出目录已存在，检测已有数据...');
    const detection = detectTilingScheme(bounds, OUTPUT_DIR);
    if (detection.detected && detection.detected !== opts.tilingScheme) {
      console.log(`❌ 警告：已有数据使用 ${TILING_SCHEMES[detection.detected].name}，`);
      console.log(`   但将使用 ${scheme.name} 生成！`);
      console.log(`   旧数据将被删除并重新生成。`);
    }
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── 按 zoom level 生成 tiles ────────────────────────────
  // 使用指定 scheme 的坐标函数
  const lonToX = (lon, lvl) => scheme.lonToX(lon, lvl);
  const latToY = (lat, lvl) => scheme.latToY(lat, lvl);

  let totalTiles = 0;

  for (let level = MIN_ZOOM; level <= MAX_ZOOM; level++) {
    const xStart = lonToX(bounds.west, level);
    const xEnd = lonToX(bounds.east, level);
    const yStart = latToY(bounds.north, level);
    const yEnd = latToY(bounds.south, level);

    const xCount = xEnd - xStart + 1;
    const yCount = yEnd - yStart + 1;
    const levelTotal = xCount * yCount;

    // 检查 X 坐标是否超出当前 level 的有效范围
    const maxX = scheme.xtilesAtLevel(level) - 1;
    const maxY = scheme.ytilesAtLevel(level) - 1;
    if (xStart > maxX || xEnd > maxX || yStart > maxY || yEnd > maxY) {
      console.log(`\n⚠️ Level ${level}: 坐标超出范围 (maxX=${maxX}, maxY=${maxY})，跳过`);
      console.log(`   这可能表示 tiling scheme 不匹配！`);
      console.log(`   请求: x[${xStart}..${xEnd}] y[${yStart}..${yEnd}]`);
      continue;
    }

    console.log(`\n🔨 Level ${level}: tiles x[${xStart}..${xEnd}] y[${yStart}..${yEnd}] (${xCount}×${yCount} = ${levelTotal} tiles)`);

    let levelGenerated = 0;
    let levelPlaceholders = 0;
    // 空 heightmap 占位瓦片（65×65 Int16 全零 = 椭球面高度）
    const placeholderHeightmap = new Int16Array(TILE_SIZE * TILE_SIZE);

    for (let tx = xStart; tx <= xEnd; tx++) {
      for (let ty = yStart; ty <= yEnd; ty++) {
        const heightmap = generateHeightmap(band, width, height, bounds, tx, ty, level);
        const tileDir = path.join(OUTPUT_DIR, String(level), String(tx));
        fs.mkdirSync(tileDir, { recursive: true });
        if (heightmap) {
          writeTerrainFile(path.join(tileDir, `${ty}.terrain`), heightmap, level);
          levelGenerated++;
        } else {
          // ⭐ 粗级别瓦片即使没有有效 DEM 像素，也要生成占位瓦片
          // 否则 Cesium TerrainProvider 无法从 level 0 逐级细化到有数据的级别
          writeTerrainFile(path.join(tileDir, `${ty}.terrain`), placeholderHeightmap, level);
          levelPlaceholders++;
        }
      }
    }

    const label = levelPlaceholders > 0
      ? `生成 ${levelGenerated} 有效 + ${levelPlaceholders} 占位 / ${levelTotal} tiles`
      : `生成 ${levelGenerated}/${levelTotal} tiles`;
    console.log(`   ✅ ${label}`);
    totalTiles += levelGenerated + levelPlaceholders;
  }

  // ── 生成后验证 ──────────────────────────────────────────
  let validationPassed = true;
  if (!opts.noCheck) {
    console.log('\n──────────────────────────────────────────');
    console.log('🔍 生成后自动验证...');

    // 1. 自洽性
    const consistency = validateSelfConsistency(OUTPUT_DIR, MIN_ZOOM, MAX_ZOOM);
    if (consistency.valid) {
      console.log('  ✅ 四叉树自洽性: 通过');
    } else {
      console.log(`  ❌ 四叉树自洽性: ${consistency.issues.length} 个问题`);
      validationPassed = false;
    }

    // 2. Cesium 兼容性
    const compat = validateCesiumCompatibility(OUTPUT_DIR, bounds, opts.tilingScheme);
    console.log(compat.report);
    if (!compat.valid) {
      validationPassed = false;
    }
  }

  // ── 生成 layer.json ─────────────────────────────────────
  const layerJson = {
    tilejson: '2.1.0',
    name: 'Copernicus GLO-30 DEM (Cesium Terrain)',
    description: `Copernicus GLO-30 30m DEM, ${bounds.west.toFixed(4)}°~${bounds.east.toFixed(4)}°E, ${bounds.south.toFixed(4)}°~${bounds.north.toFixed(4)}°N`,
    version: '1.0.0',
    format: 'heightmap-1.0',
    tiles: ['{z}/{x}/{y}.terrain'],
    bounds: [bounds.west, bounds.south, bounds.east, bounds.north],
    minzoom: MIN_ZOOM,
    maxzoom: MAX_ZOOM,
    tilingScheme: opts.tilingScheme === 'geographic' ? 'geodetic' : opts.tilingScheme  // ⭐ Cesium 只认 geodetic/mercator
  };

  const layerJsonPath = path.join(OUTPUT_DIR, 'layer.json');
  fs.writeFileSync(layerJsonPath, JSON.stringify(layerJson, null, 2));
  console.log(`\n📄 layer.json → ${layerJsonPath}`);

  // ── 摘要 ────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`  ✅ 完成! 共生成 ${totalTiles} 个 terrain tiles`);
  console.log(`  📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`  🌍 范围: ${bounds.west.toFixed(4)}°~${bounds.east.toFixed(4)}°E, ${bounds.south.toFixed(4)}°~${bounds.north.toFixed(4)}°N`);
  console.log(`  🔢 Zoom: ${MIN_ZOOM}-${MAX_ZOOM}`);
  console.log(`  🎯 Tiling Scheme: ${scheme.name}`);
  if (!validationPassed) {
    console.log(`\n  ⚠ 自动验证未通过，请检查上述报告`);
  }
  console.log('══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
