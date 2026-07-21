/**
 * 恢复 .terrain 文件的 Cesium 标准头（width:UInt16LE, height:UInt16LE）。
 *
 * CesiumTerrainProvider 需要此头部来解析 heightmap-1.0 格式。
 * 修复后: 8454 字节 = 4 header + 65×65×2
 */
const fs = require('fs');
const path = require('path');

const TERRAIN_DIR = path.resolve(__dirname, '../public/data/dem/terrain/jian_glo30');
const TILE_SIZE = 65;
const HEADER_SIZE = 4;
const RAW_SIZE = TILE_SIZE * TILE_SIZE * 2; // 8450
const WITH_HEADER_SIZE = HEADER_SIZE + RAW_SIZE; // 8454

let fixed = 0;
let skipped = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.terrain')) {
      const stat = fs.statSync(fullPath);
      if (stat.size === RAW_SIZE) {
        const raw = fs.readFileSync(fullPath);
        const buf = Buffer.allocUnsafe(WITH_HEADER_SIZE);
        buf.writeUInt16LE(TILE_SIZE, 0);
        buf.writeUInt16LE(TILE_SIZE, 2);
        raw.copy(buf, HEADER_SIZE);
        fs.writeFileSync(fullPath, buf);
        fixed++;
      } else if (stat.size === WITH_HEADER_SIZE) {
        skipped++;
      } else {
        console.warn(`⚠ 异常大小: ${fullPath} (${stat.size} bytes)`);
      }
    }
  }
}

console.log('🔧 恢复 terrain 文件 Cesium 标准头...');
walkDir(TERRAIN_DIR);
console.log(`✅ 完成: ${fixed} 个恢复, ${skipped} 个已有头`);
