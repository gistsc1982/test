# XKT 模型资源

## XKT 格式说明
XKT 是 xeokit 的专有高性能 3D 模型格式，通常从 IFC/BIM 文件转换而来。

## 可用模型

### 当前目录中的模型

| 文件名 | 大小 | 来源 | 说明 |
|--------|------|------|------|
| OTCConferenceCenter.ifc.xkt | 5.4MB | xeokit SDK | 会议中心建筑 (XKT v8) |

## 获取更多 XKT 模型

### 方法一：从 xeokit SDK 仓库下载

xeokit SDK 在 GitHub 上提供了大量示例 XKT 模型，按版本号组织：

#### 示例下载命令
```bash
cd datatool/xkt

# OTC Conference Center (XKT v8, IFC)
curl -L -o OTCConferenceCenter.ifc.xkt \
  "https://raw.githubusercontent.com/xeokit/xeokit-sdk/master/assets/models/xkt/v8/ifc/OTCConferenceCenter.ifc.xkt"

# Schependomlaan (XKT v8, IFC)
curl -L -o Schependomlaan.ifc.xkt \
  "https://raw.githubusercontent.com/xeokit/xeokit-sdk/master/assets/models/xkt/v8/ifc/Schependomlaan.ifc.xkt"

# Duplex (XKT v8, IFC)
curl -L -o Duplex.ifc.xkt \
  "https://raw.githubusercontent.com/xeokit/xeokit-sdk/master/assets/models/xkt/v8/ifc/Duplex.ifc.xkt"

# Holter Tower (XKT v8, IFC, 10MB)
curl -L -o HolterTower.ifc.xkt \
  "https://raw.githubusercontent.com/xeokit/xeokit-sdk/master/assets/models/xkt/v8/ifc/HolterTower.ifc.xkt"
```

#### 可用模型列表

**XKT v8 / IFC 模型:**
- `OTCConferenceCenter.ifc.xkt` (5.6MB) - 会议中心
- `Schependomlaan.ifc.xkt` (1.6MB) - 住宅建筑
- `Duplex.ifc.xkt` (119KB) - 简单双层建筑
- `HolterTower.ifc.xkt` (10.5MB) - 高层建筑
- `IfcOpenHouse2x3.ifc.xkt` (13KB) - 开放房屋示例
- `IfcOpenHouse4.ifc.xkt` (13KB) - 开放房屋示例

### 方法二：从 IFC 转换（推荐用于自定义模型）

#### 使用 xeokit convert2xkt 工具
```bash
# 安装转换工具
npm install -g @xeokit/xeokit-convert

# 转换 IFC 到 XKT
convert2xkt input.ifc -o output.xkt
```

#### 使用 WebIFCLoaderPlugin（直接加载 IFC）
如果你不想转换，也可以直接在代码中使用 `WebIFCLoaderPlugin` 加载 IFC 文件。

### 3. 免费 IFC 模型资源

| 资源 | 地址 | 说明 |
|------|------|------|
| BuildingSmart | https://www.buildingsmart-tech.org/ifc/resources/ | IFC 官方案例 |
| IFC Wiki | https://www.ifcwiki.org/ | 示例文件 |
| NIST BIM | https://www.nist.gov/services-resources/software/industry-foundations-classes-ifc-sample-files | 测试文件 |

## 使用方法

### 在 DualCanvasViewer 中加载
```javascript
// 加载 xkt 模型
this.loadXKTModel('/datatool/xkt/OTCConferenceCenter.ifc.xkt');
```

## XKT 版本说明

xeokit SDK 支持以下 XKT 版本：1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

推荐使用 **XKT v8** 或更高版本以获得最佳性能和功能支持。
