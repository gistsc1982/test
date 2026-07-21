/**
 * 去掉 copernicus_glo30 .terrain 文件的 Cesium 标准头。
 * LocalTerrainProvider 不需要 4 字节头（直接读 Int16LE 原始数据）。
 * 还原: 8454 字节 → 8450 字节
 */
const fs = require('fs');
const path = require('path');

const TERRAIN_DIR = path.resolve(__dirname, '../public/data/dem/terrain/copernicus_glo30');
const HEADER_SIZE = 4;
const WITH_HEADER_SIZE = 8454;
const RAW_SIZE = 8450;

let reverted = 0;
let skipped = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.terrain')) {
      const stat = fs.statSync(fullPath);
      if (stat.size === WITH_HEADER_SIZE) {
        const buf = fs.readFileSync(fullPath);
        const raw = buf.slice(HEADER_SIZE);
        fs.writeFileSync(fullPath, raw);
        reverted++;
      } else if (stat.size === RAW_SIZE) {
        skipped++;
      } else {
        console.warn(`⚠ 异常大小: ${fullPath} (${stat.size} bytes)`);
      }
    }
  }
}

console.log('🔧 去掉 copernicus_glo30 terrain 文件的 Cesium 标准头...');
walkDir(TERRAIN_DIR);
console.log(`✅ 完成: ${reverted} 个已去掉头, ${skipped} 个无需处理`);
