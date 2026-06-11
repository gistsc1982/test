# Test Project

Vue 3 测试项目，集成 cesiumBase GIS 页面。

## 功能

- 集成 cesiumBase 的 Cesium GIS 页面
- 通过 iframe 展示 3D 地理信息内容
- 支持倾斜摄影模型加载

## 目录结构

```
test/
├── public/
│   └── gis/           # GIS 静态资源（运行 npm run update-gis 生成）
├── src/
│   ├── views/
│   │   └── GisView.vue    # GIS 页面组件
│   ├── router/
│   │   └── index.js       # 路由配置
│   └── App.vue
├── update-gis-assets.cjs  # GIS 资源更新脚本
└── package.json
```

## 开发

### 首次运行

1. **安装依赖**
```bash
npm install
```

2. **更新 GIS 资源**
```bash
npm run update-gis
```
此命令会：
- 进入 `../cesiumBase` 目录执行编译
- 将编译产物复制到 `public/gis/` 目录
- 复制 CDN 资源到 `public/gis/cdn/` 目录

3. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:5173/` 查看页面。

### 更新 GIS 内容

当 cesiumBase 代码更新后，运行：
```bash
npm run update-gis
```

## 生产构建

```bash
npm run build
```

## 注意事项

- `public/gis/` 目录已被添加到 `.gitignore`，不应提交到 git
- 每次部署前需要运行 `npm run update-gis` 更新静态资源
- 确保 `../cesiumBase` 项目存在且可正常编译
