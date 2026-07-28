"""
convert-heightmap-to-quantized-mesh.py

将现有 heightmap-1.0 地形瓦片原地转换为 quantized-mesh-1.0 格式。

使用全量 65×65 规则网格 + quantized-mesh-encoder 编码，确保 Cesium 兼容。

依赖:
  pip install quantized-mesh-encoder numpy

用法:
  python scripts/convert-heightmap-to-quantized-mesh.py              # 转换所有 tiles
  python scripts/convert-heightmap-to-quantized-mesh.py --dry-run    # 仅预览
  python scripts/convert-heightmap-to-quantized-mesh.py --single 7/209/44  # 单瓦片
"""

import struct
import os
import sys
import json
import time
import argparse
import numpy as np
from quantized_mesh_encoder import encode, VertexNormalsExtension

TILE_SIZE = 65  # heightmap 网格: 65×65


def tile_bounds(x, y, z):
    """
    GeographicTilingScheme: z 级 X 方向 2^(z+1) 个 tiles, Y 方向 2^z 个 tiles.
    返回 (west, south, east, north).
    """
    xtiles = 2 ** (z + 1)
    ytiles = 2 ** z
    west = x / xtiles * 360 - 180
    east = (x + 1) / xtiles * 360 - 180
    south = 90 - (y + 1) / ytiles * 180
    north = 90 - y / ytiles * 180
    return (west, south, east, north)


def convert_tile(filepath, bounds, z):
    """
    读取 heightmap-1.0 .terrain → 写入 quantized-mesh-1.0 格式.
    使用全量 65×65 规则网格，确保边界顶点完整。
    """
    # 1. 读取 heightmap: 65×65 Int16 LE
    data_len = TILE_SIZE * TILE_SIZE * 2
    with open(filepath, "rb") as f:
        raw = f.read(data_len)
    if len(raw) < data_len:
        raise ValueError(f"文件太小: {len(raw)} bytes, 需要 {data_len}")

    hm = np.array(
        struct.unpack(f"<{TILE_SIZE * TILE_SIZE}h", raw),
        dtype=np.float32,
    ).reshape(TILE_SIZE, TILE_SIZE)

    # 2. 解码高程: stored=(elevation+1000)*5 → elevation=stored/5-1000
    elevations = (hm / 5.0 - 1000.0).astype(np.float64)

    west, south, east, north = bounds
    lon_step = (east - west) / (TILE_SIZE - 1)
    lat_step = (north - south) / (TILE_SIZE - 1)

    # 3. 生成规则网格顶点 (top-down: row 0 = north)
    vertex_count = TILE_SIZE * TILE_SIZE
    positions = np.zeros((vertex_count, 3), dtype=np.float64)
    for row in range(TILE_SIZE):
        for col in range(TILE_SIZE):
            idx = row * TILE_SIZE + col
            positions[idx, 0] = west + col * lon_step    # longitude
            positions[idx, 1] = north - row * lat_step   # latitude (top-down)
            positions[idx, 2] = elevations[row, col]     # elevation

    # 4. 生成三角形索引（逆时针绕序，从上往下看）
    #      a──b     a = top-left,  b = top-right
    #      │╱ │     c = bottom-left, d = bottom-right
    #      c──d
    indices = []
    for row in range(TILE_SIZE - 1):
        for col in range(TILE_SIZE - 1):
            a = row * TILE_SIZE + col
            b = a + 1
            c = a + TILE_SIZE
            d = c + 1
            indices.extend([a, d, b, a, c, d])  # CCW from above
    indices = np.array(indices, dtype=np.uint32)

    # 5. 计算顶点法线（全量网格避免 segfault 用较小步长）
    vertex_normals = VertexNormalsExtension(positions=positions, indices=indices)

    # 6. quantized-mesh 编码写入
    # 注: geometric_error 由 encoder 内部从 positions 高程范围计算
    with open(filepath, "wb") as f:
        encode(f, positions, indices, extensions=(vertex_normals,))

    return len(positions), len(indices) // 3


def main():
    parser = argparse.ArgumentParser(
        description="heightmap-1.0 → quantized-mesh-1.0 原地转换 (全量网格)"
    )
    parser.add_argument("--input-dir", default=None, help="瓦片根目录")
    parser.add_argument("--dry-run", action="store_true", help="仅预览")
    parser.add_argument("--max-level", type=int, default=None, help="限制 zoom level")
    parser.add_argument("--single", type=str, default=None, help="单瓦片: z/x/y")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    input_dir = args.input_dir or os.path.join(
        project_dir, "public", "data", "dem", "terrain", "jian_glo30"
    )

    if not os.path.isdir(input_dir):
        print(f"ERROR: input dir not found: {input_dir}")
        sys.exit(1)

    print("=" * 60)
    print("  heightmap-1.0 -> quantized-mesh-1.0 (full grid)")
    if args.dry_run:
        print("  DRY RUN")
    print(f"  {input_dir}")
    print("=" * 60)

    if args.single:
        parts = args.single.split("/")
        z, x, y = int(parts[0]), int(parts[1]), int(parts[2])
        fp = os.path.join(input_dir, str(z), str(x), f"{y}.terrain")
        if not os.path.isfile(fp):
            print(f"ERROR: file not found: {fp}")
            sys.exit(1)
        print(f"  Single tile: z={z} x={x} y={y}")
        if not args.dry_run:
            b = tile_bounds(x, y, z)
            nv, nt = convert_tile(fp, b, z)
            print(f"  OK: {nv} verts, {nt} tris")
        return

    converted = 0
    errors = 0
    start = time.time()

    levels = sorted(
        [d for d in os.listdir(input_dir)
         if os.path.isdir(os.path.join(input_dir, d)) and d.isdigit()],
        key=int,
    )

    for lv_name in levels:
        z = int(lv_name)
        if args.max_level is not None and z > args.max_level:
            continue

        lv_dir = os.path.join(input_dir, lv_name)
        for x_name in sorted(os.listdir(lv_dir)):
            x_dir = os.path.join(lv_dir, x_name)
            if not os.path.isdir(x_dir):
                continue
            x = int(x_name)
            for fn in sorted(os.listdir(x_dir)):
                if not fn.endswith(".terrain"):
                    continue
                y = int(fn.replace(".terrain", ""))
                fp = os.path.join(x_dir, fn)
                try:
                    if args.dry_run:
                        converted += 1
                        continue
                    b = tile_bounds(x, y, z)
                    nv, nt = convert_tile(fp, b, z)
                    converted += 1
                except Exception as e:
                    errors += 1
                    if errors <= 20:
                        print(f"  ERROR z={z} x={x} y={y}: {e}")

        print(f"  Level {z}: {converted} tiles, {time.time() - start:.1f}s")

    elapsed = time.time() - start

    if not args.dry_run:
        lj_path = os.path.join(input_dir, "layer.json")
        if os.path.exists(lj_path):
            with open(lj_path, "r", encoding="utf-8") as f:
                lj = json.load(f)
            lj["format"] = "quantized-mesh-1.0"
            lj["scheme"] = "slippyMap"
            lj.pop("tilingScheme", None)

            # Cesium 1.132 需要 available 数组来查询子瓦片存在性
            # jLe 函数会对 available Y 做 TMS 翻转: cesiumY = numYTiles - tmsY - 1
            # 目录结构使用 Y=0 在北，需转换为 TMS 约定 (Y=0 在南)
            # GeographicTilingScheme: numYTiles = 2^level
            available = []
            for z in range(lj.get("minzoom", 0), lj.get("maxzoom", 12) + 1):
                lv_dir = os.path.join(input_dir, str(z))
                num_y = 2 ** z  # GeographicTilingScheme
                if not os.path.isdir(lv_dir):
                    available.append([])
                    continue
                ranges = []
                for x_name in sorted(os.listdir(lv_dir), key=int):
                    xd = os.path.join(lv_dir, x_name)
                    if not os.path.isdir(xd):
                        continue
                    x = int(x_name)
                    ys = sorted(
                        int(f.replace(".terrain", ""))
                        for f in os.listdir(xd)
                        if f.endswith(".terrain")
                    )
                    if ys:
                        # 目录 Y → TMS Y: TMS_Y = numY - dirY - 1
                        # 范围翻转: TMS_startY = numY - dir_endY - 1
                        tms_start_y = num_y - ys[-1] - 1
                        tms_end_y = num_y - ys[0] - 1
                        ranges.append({
                            "startX": x, "endX": x,
                            "startY": tms_start_y, "endY": tms_end_y,
                        })
                available.append(ranges)
            lj["available"] = available

            with open(lj_path, "w", encoding="utf-8") as f:
                json.dump(lj, f, indent=2, ensure_ascii=False)
            print(f"layer.json -> quantized-mesh-1.0 (available: {sum(len(r) for r in available)} ranges)")

    print(f"\nDone: {converted} tiles, {elapsed:.1f}s, {errors} errors")


if __name__ == "__main__":
    main()
