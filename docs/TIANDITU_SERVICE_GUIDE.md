# 天地图服务添加完成

## 🗺️ 服务信息

基于ja-yjjg-dp项目的分析，已成功在test项目中添加天地图WMTS服务。

### 📊 ja-yjjg-dp项目使用的默认地图服务

**服务提供商**: 天地图 (国家地理信息公共服务平台)  
**服务类型**: WMTS (Web Map Tile Service)  
**默认影像**: `img_w` (天地图影像)  
**默认注记**: `cia_w` (天地图注记)  
**服务地址**: `https://t0.tianditu.gov.cn/{layerKey}/wmts?tk={key}`

### 🔧 ja-yjjg-dp项目中的实现代码

```typescript
// 从 ViewerCore.ts 第25行
const baseProvider = createTdtProvider({ type: "img", name: "天地图影像" });

// 天地图注记层 (第69行)
createTdtProvider({ type: "cia", name: "天地图注记" })
```

**createTdtProvider 函数实现** (layers.ts):
```typescript
export function createTdtProvider(options: TdtLayerOptions) {
  const key = options.key || pickTdtKey();
  const layerKey = TDT_URL_MAP[options.type];

  return new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/${layerKey}/wmts?tk=${key}`,
    layer: options.type,
    style: "default",
    format: options.type === "vec" ? "tiles" : "image/jpeg",
    tileMatrixSetID: "w",
    maximumLevel: 18,
    minimumLevel: 1,
    credit: new Cesium.Credit(options.name || "天地图"),
  });
}
```

## ✅ 在test项目中的添加结果

### 📝 已添加的天地图图层

在 `test/public/data/gis/layertreemanager_layertreemanager.json` 中添加了：

1. **天地图服务文件夹** (`folder-tianditu`)
2. **天地图影像** (`wmts-tianditu-img`)
   - 图层: `img`
   - 格式: `image/jpeg`
   - 描述: 卫星影像服务

3. **天地图矢量** (`wmts-tianditu-vec`)  
   - 图层: `vec`
   - 格式: `tiles`
   - 描述: 道路、地名、行政区划等矢量要素

4. **天地图注记** (`wmts-tianditu-cia`)
   - 图层: `cia`
   - 格式: `tiles`
   - 描述: 地名注记服务，配合底图使用

### 🌐 服务地址详情

| 服务类型 | URL模板 | 用途 |
|----------|---------|------|
| 影像 | `https://t0.tianditu.gov.cn/img_w/wmts` | 卫星影像底图 |
| 矢量 | `https://t0.tianditu.gov.cn/vec_w/wmts` | 矢量地图底图 |
| 注记 | `https://t0.tianditu.gov.cn/cia_w/wmts` | 文字标注层 |

## 🚀 使用方法

### 1. 在图层管理器中使用

1. 打开test项目
2. 打开图层管理器
3. 找到新添加的 "天地图服务" 文件夹
4. 勾选所需的图层：
   - **天地图影像**: 显示卫星影像底图
   - **天地图矢量**: 显示矢量地图底图
   - **天地图注记**: 显示文字标注（建议配合影像或矢量使用）

### 2. API Key配置

**重要**: 天地图服务需要API Key才能正常使用。

#### 获取天地图API Key：
1. 访问 [天地图官网](https://lbs.tianditu.gov.cn/home.html)
2. 注册账号并登录
3. 进入控制台，申请API Key
4. 选择合适的服务类型（地图服务API）

#### 配置API Key：
在URL中添加 `tk` 参数：
```
https://t0.tianditu.gov.cn/img_w/wmts?tk=你的API密钥
```

### 3. 技术参数

**WMTS参数配置**:
- `layer`: 图层名称 (img/vec/cia)
- `style`: 样式 (default)
- `format`: 格式 (image/jpeg/tiles)
- `tileMatrixSet`: 瓦片矩阵集 (w - WGS84)
- `service`: 服务类型 (WMTS)
- `version`: 版本 (1.0.0)

### 4. 推荐组合

**最佳显示效果组合**：
1. **天地图影像** + **天地图注记**
   - 显示卫星影像 + 地名标注
   - 适合地形分析和地理定位

2. **天地图矢量** + **天地图注记**  
   - 显示矢量地图 + 地名标注
   - 适合城市规划和路线分析

## 📋 对比分析

### ja-yjjg-dp vs test 项目地图服务对比

| 项目 | 默认服务 | 服务类型 | 实现方式 | 覆盖范围 |
|------|----------|----------|----------|----------|
| ja-yjjg-dp | 天地图影像 | WMTS | 代码中配置 | 中国区域优化 |
| test (旧) | 多种国际服务 | WMS/XYZ | 配置文件 | 全球覆盖 |
| test (新) | 天地图 + 国际服务 | WMTS/WMS/XYZ | 配置文件 | 全球+中国优化 |

### 天地图优势

1. **国内访问速度快**: 服务器位于国内
2. **中国区域精度高**: 针对中国区域优化
3. **官方权威数据**: 国家基础地理信息中心提供
4. **服务稳定**: 官方维护，可靠性高
5. **免费使用**: 个人开发免费（需注册）

## 🔍 验证方法

### 1. 检查图层是否添加成功
```bash
# 查看配置文件
cat test/public/data/gis/layertreemanager_layertreemanager.json | grep tianditu
```

### 2. 在应用中测试
1. 启动test项目
2. 打开图层管理器
3. 查看 "天地图服务" 文件夹是否显示
4. 尝试加载各个图层
5. 检查地图显示效果

### 3. 预期效果
- 图层树中显示 "天地图服务" 文件夹
- 包含3个子图层：影像、矢量、注记
- 加载后显示中国区域地图数据
- 如未配置API Key，可能显示错误提示

## 🎯 后续优化建议

1. **API Key配置**: 考虑在环境变量中配置API Key
2. **性能优化**: 添加本地缓存机制
3. **错误处理**: 完善API Key失效的处理逻辑
4. **样式定制**: 支持自定义地图样式
5. **备用方案**: 添加其他国内地图服务作为备选

## 📞 技术支持

- **天地图官网**: https://lbs.tianditu.gov.cn/
- **天地图API文档**: https://lbs.tianditu.gov.cn/server/MapService.html
- **WMTS标准**: http://www.opengeospatial.org/standards/wmts

---

**添加完成时间**: 2026年8月27日  
**参考项目**: ja-yjjg-dp  
**服务类型**: WMTS (天地图)  
**状态**: ✅ 已完成配置