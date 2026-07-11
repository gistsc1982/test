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
 * heightmap-1.0 格式: 65×65 Int16 LE = 8450 字节
 */
function writeTerrainFile(filePath, heightmap) {
  const buf = Buffer.allocUnsafe(TILE_SIZE * TILE_SIZE * 2);
  for (let i = 0; i < heightmap.length; i++) {
    buf.writeInt16LE(heightmap[i], i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

async function main() {
  console.log('══════════════════════════════════════════════');
  console.log('  Copernicus GLO-30 → Cesium Terrain Tiles');
  console.log('══════════════════════════════════════════════\n');

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

  // 创建输出目录
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 按 zoom level 生成 tiles
  const availableRanges = [];
  let totalTiles = 0;

  for (let level = MIN_ZOOM; level <= MAX_ZOOM; level++) {
    const xStart = lonToTileX(bounds.west, level);
    const xEnd = lonToTileX(bounds.east, level);
    const yStart = latToTileY(bounds.north, level);
    const yEnd = latToTileY(bounds.south, level);

    const xCount = xEnd - xStart + 1;
    const yCount = yEnd - yStart + 1;
    const levelTotal = xCount * yCount;

    console.log(`\n🔨 Level ${level}: tiles x[${xStart}..${xEnd}] y[${yStart}..${yEnd}] (${xCount}×${yCount} = ${levelTotal} tiles)`);

    let levelGenerated = 0;
    for (let tx = xStart; tx <= xEnd; tx++) {
      for (let ty = yStart; ty <= yEnd; ty++) {
        const heightmap = generateHeightmap(band, width, height, bounds, tx, ty, level);
        if (heightmap) {
          const tileDir = path.join(OUTPUT_DIR, String(level), String(tx));
          fs.mkdirSync(tileDir, { recursive: true });
          writeTerrainFile(path.join(tileDir, `${ty}.terrain`), heightmap);
          levelGenerated++;
        }
      }
    }

    console.log(`   ✅ 生成 ${levelGenerated}/${levelTotal} tiles`);
    totalTiles += levelGenerated;

    if (levelGenerated > 0) {
      availableRanges.push([xStart, xEnd, yStart, yEnd, level, level]);
    }
  }

  // 从实际生成的瓦片推断 minzoom/maxzoom
  const actualMinZoom = availableRanges.length > 0 ? availableRanges[0][4] : MIN_ZOOM;
  const actualMaxZoom = availableRanges.length > 0 ? availableRanges[availableRanges.length - 1][5] : MAX_ZOOM;

  // 生成 layer.json（仅包含 CesiumTerrainProvider 标准字段）
  const layerJson = {
    tilejson: '2.1.0',
    name: 'Copernicus GLO-30 DEM (Cesium Terrain)',
    description: `Copernicus GLO-30 30m DEM, ${bounds.west.toFixed(4)}°~${bounds.east.toFixed(4)}°E, ${bounds.south.toFixed(4)}°~${bounds.north.toFixed(4)}°N`,
    version: '1.0.0',
    format: 'heightmap-1.0',
    tiles: ['{z}/{x}/{y}.terrain'],
    bounds: [bounds.west, bounds.south, bounds.east, bounds.north],
    minzoom: actualMinZoom,
    maxzoom: actualMaxZoom,
    available: availableRanges
  };

  const layerJsonPath = path.join(OUTPUT_DIR, 'layer.json');
  fs.writeFileSync(layerJsonPath, JSON.stringify(layerJson, null, 2));
  console.log(`\n📄 layer.json → ${layerJsonPath}`);

  // 摘要
  console.log('\n══════════════════════════════════════════════');
  console.log(`  ✅ 完成! 共生成 ${totalTiles} 个 terrain tiles`);
  console.log(`  📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`  🌍 范围: ${bounds.west.toFixed(4)}°~${bounds.east.toFixed(4)}°E, ${bounds.south.toFixed(4)}°~${bounds.north.toFixed(4)}°N`);
  console.log(`  🔢 Zoom: ${MIN_ZOOM}-${MAX_ZOOM}`);
  console.log('══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
