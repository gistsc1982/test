# 本地 DEM 高程数据目录

## 数据获取

### 国内渠道

| 来源 | 地址 | 可用数据 |
|------|------|----------|
| **地理空间数据云** | [gscloud.cn](http://www.gscloud.cn) | SRTM 30M、ASTER GDEM 30M |

1. 注册 → 登录 → 数据资源 → DEM 数字高程数据
2. 选择数据集，框选目标区域，下载
3. 解压得到 `.tif` 文件

### 国外渠道

| 数据集 | 分辨率 | 精度 | 覆盖 | 下载地址 |
|--------|:---:|:---:|------|----------|
| **SRTM GL1 v3** | 30m | ~9m | 60°N–56°S | [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov/) |
| **ASTER GDEM v3** | 30m | ~17m | 83°N–83°S | [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov/) 或 gscloud.cn |
| **ALOS AW3D30** | 30m | ~5m | 全球 | [eorc.jaxa.jp/ALOS](https://www.eorc.jaxa.jp/ALOS/en/aw3d30/) |
| **Copernicus GLO-30** | 30m | ~4m | 全球 | [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) |
| **NASADEM** | 30m | ~9m | 60°N–56°S | [lpdaac.usgs.gov](https://lpdaac.usgs.gov/products/nasadem_hgtv001/) |

> 精度排名：Copernicus GLO-30 ≥ AW3D30 > NASADEM > SRTM > ASTER GDEM

## 放入文件

下载解压后将 `.tif` 文件放到此目录，文件名与图层配置对应：

| 图层名称 | 文件名 | 数据集 |
|----------|--------|--------|
| SRTM 30M DEM | `srtm_30m.tif` | SRTM GL1 v3 |
| ASTER GDEM 30M | `aster_gdem_30m.tif` | ASTER GDEM v3 |
| ALOS AW3D30 DEM | `alos_aw3d30.tif` | ALOS World 3D 30m |
| Copernicus GLO-30 DEM | `copernicus_glo30.tif` | Copernicus GLO-30 |

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| demRenderMode | 3d | 2d=叠加 / 3d=网格 |
| demElevationScale | 1.0 | 高程夸张倍数（山区 1~2，平原 5~20） |
| demColorRamp | true | 是否应用色带渲染 |

## 性能建议

- 单文件建议不超过 200MB（约 1°×1° 范围）
- 高分辨率 DEM 建议先用 GDAL 降采样
- 3D 网格顶点数 = ~180×90 ≈ 16K 顶点
