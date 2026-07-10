# functionPanels.config.json 配置指导

## 文件位置

`src/components/functions/functionPanels.config.json`

## 核心字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 面板唯一标识，`Multi` 后缀表示多实例版本 |
| `enabled` | boolean | `true`=注册并显示工具栏按钮；`false`=不注册（按钮不可见） |
| `visible` | boolean | 加载后是否默认打开面板 |
| `singleton` | boolean | `true`=单例模式；`false`=多实例模式（可打开多个副本） |
| `singletonContainerId` | string | DOM 容器 ID，单例和多实例共享同一个容器 |
| `lazyLoad` | boolean | `true`=首次点击时才加载组件；`false`=启动时预加载 |

## 四种配置模式

### 模式 1：只用单例（隐藏所有多实例）

```json
{
  "name": "LayerTreeManager",        → "enabled": true,  "singleton": true
  "name": "LayerTreeManagerMulti",   → "enabled": false, "singleton": false
}
```

工具栏只显示 `:1` 个按钮，每次打开都是同一个面板。

### 模式 2：只用多实例（隐藏单例）

```json
{
  "name": "LayerTreeManager",        → "enabled": false, "singleton": true
  "name": "LayerTreeManagerMulti",   → "enabled": true,  "singleton": false
}
```

工具栏只显示 `:1` 个按钮，每次点击打开一个新面板实例。

### 模式 3：同时启用（两个按钮）

```json
{
  "name": "LayerTreeManager",        → "enabled": true,  "singleton": true
  "name": "LayerTreeManagerMulti",   → "enabled": true,  "singleton": false
}
```

工具栏显示 `:2` 个按钮 —— 一个打开固定面板，一个打开新实例。

### 模式 4：全部隐藏

```json
{
  "name": "LayerTreeManager",        → "enabled": false, "singleton": true
  "name": "LayerTreeManagerMulti",   → "enabled": false, "singleton": false
}
```

工具栏不显示该面板的任何按钮。

## 当前面板列表及配置

| 面板名称 | 单例 (name) | 多实例 (nameMulti) | 当前状态 |
|----------|-------------|-------------------|---------|
| 图层树管理 | `LayerTreeManager` | `LayerTreeManagerMulti` | 单例启用，多实例隐藏 |
| GeoJSON图层管理 | `GeoJsonLayerManager` | `GeoJsonLayerManagerMulti` | 单例启用，多实例隐藏 |
| 倾斜摄影图层管理 | `ObliquePhotoManager` | `ObliquePhotoManagerMulti` | 单例启用，多实例隐藏 |
| EChart图表管理 | `EChartManager` | `EChartManagerMulti` | 单例启用，多实例隐藏 |
| 百度路书路径引导 | `MapGuideManager` | `MapGuideManagerMulti` | 单例启用，多实例隐藏 |
| 小模型点位管理 | `LittleModelManager` | `LittleModelManagerMulti` | 单例启用，多实例隐藏 |
| 模型图层编辑 | `LittleModelEditor` | 无多实例版本 | 单例启用 |
| 空间查询 | `SpacialQueryManager` | `SpacialQueryManagerMulti` | 单例启用，多实例隐藏 |
| 双画布查看器 | `DualCanvasViewer` | `DualCanvasViewerMulti` | 单例启用，多实例隐藏 |

## 快速切换模板

### 场景 A：全部隐藏多实例，只保留单例（当前状态）

```bash
# 所有 *Multi 的 enabled 改为 false
# 所有非 Multi 单例的 enabled 改为 true
```

当前已应用，工具栏只显示单例按钮（🌳 图层树管理、🗾 GeoJSON图层管理 等）。

### 场景 B：全部切换为多实例模式

逐个将 `"name": "LayerTreeManager"`（singleton=true）的 `enabled` 改为 `false`，
将 `"name": "LayerTreeManagerMulti"`（singleton=false）的 `enabled` 改为 `true`。

### 场景 C：全部隐藏（最简工具栏）

将所有面板的 `enabled` 改为 `false`，工具栏完全不显示功能按钮。

## 注意事项

1. **单例和多实例共享 `singletonContainerId`**：两个模式使用同一个 DOM 容器，同时启用时多实例面板会复用单例的容器
2. **面板预加载数量由 `enabled` 决定**：`enabled: true` 的面板不管 `visible` 如何，都会被预加载组件（工具栏可见）
3. **修改后刷新页面生效**：配置文件在应用启动时读取，修改后需刷新浏览器
