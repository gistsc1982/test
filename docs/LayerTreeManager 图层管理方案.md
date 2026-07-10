 LayerTreeManager 图层管理方案
  
 Context

 当前 _maxActiveLayers = 2 导致同一时间只能显示 2
 个图层，严重限制使用。需要升级为分级管理方案，在保证系统性能的前提下支持更多图层，同时兼容差网络环境。

 核心设计：二级管理

 活跃层 (show=true, 在 imageryLayers 中渲染)
   ├─ 达到类型上限 → 自动休眠（隐藏但保留在 Cesium 中）
   └─ 达到总量硬上限 → 真正卸载（释放 GPU 资源）

 休眠层 (show=false, 仍在 _cesiumLayers，GPU 资源保留)
   ├─ 用户重新勾选 → 瞬间唤醒（无网络请求）
   ├─ 休眠池超出上限 → 卸载最旧的
   └─ 全局总量超限 → 优先淘汰休眠层

 卸载层 (已从 _cesiumLayers 移除)
   └─ 用户再次勾选 → 重新从服务器加载

 关键原则：优先休眠而非卸载。Cesium 的 show=false 不消耗渲染资源，但保留 GPU 纹理可瞬间恢复。

 具体修改

 文件 1: LayerTreeManager.vue

 1. 配置替换 (beforeCreate() ~1362 行)

 将 this._maxActiveLayers = 2 替换为：

 // 分级图层上限
 this._layerTypeLimits = {
   wcs: 3, '3dtiles': 3, mvt: 4,        // 重型
   geojson: 8, wfs: 6,                    // 中等
   wms: 10, xyz: 15, wmts: 15,           // 轻型
   geocoding: 5,                          // 轻型
 };
 this._totalMaxLayers = 20;               // 全局硬上限
 this._maxHibernated = 8;                 // 休眠池上限
 this._hibernatedOrder = [];              // 休眠顺序（FIFO）

 2. 辅助方法 (~2948 行，detectLayerType 附近)

 _getTypeLimit(type) { return this._layerTypeLimits[type] || 8; },
 _getActiveCount(type) {
   let c = 0;
   this._cesiumLayers.forEach(e => {
     if (e.type === type && e.object && e.object.show !== false) c++;
   });
   return c;
 },

 3. 分级驱逐逻辑 (~3087 行，替换现有 LRU 块)

 const typeLimit = this._getTypeLimit(layerType);
 const activeCount = this._getActiveCount(layerType);

 // A) 同类型超限 → 休眠最旧的活跃图层
 if (activeCount >= typeLimit) {
   const oldestId = this._layerLoadOrder.find(id => {
     const e = this._cesiumLayers.get(id);
     return e && e.type === layerType && e.object && e.object.show !== false && id !== node.id;
   });
   if (oldestId) {
     const oldNode = this.flatNodeList.find(n => n.id === oldestId);
     if (oldNode) this._hibernateLayer(oldNode);
   }
 }

 // B) 休眠池超限 → 真正卸载最旧的
 while (this._hibernatedOrder.length > this._maxHibernated) {
   const hid = this._hibernatedOrder[0];
   const hn = this.flatNodeList.find(n => n.id === hid);
   if (hn) this.unloadCesiumLayer(hn); else this._hibernatedOrder.shift();
 }

 // C) 全局总量超限 → 优先卸载休眠层，无休眠层则卸载最旧活跃层
 if (this._cesiumLayers.size >= this._totalMaxLayers) {
   if (this._hibernatedOrder.length > 0) {
     const hid = this._hibernatedOrder[0];
     const hn = this.flatNodeList.find(n => n.id === hid);
     if (hn) this.unloadCesiumLayer(hn);
   } else {
     const oldestId = this._layerLoadOrder.find(id => id !== node.id && this._cesiumLayers.has(id));
     const hn = this.flatNodeList.find(n => n.id === oldestId);
     if (hn) this.unloadCesiumLayer(hn);
   }
 }

 4. 休眠/唤醒方法 (~4418 行附近)

 _hibernateLayer(node) {
   const entry = this._cesiumLayers.get(node.id);
   if (!entry?.object || entry.object.show === false) return;
   entry.object.show = false;
   if (entry.object.alpha !== undefined) entry.object.alpha = 0.0;
   this.loadedLayerIds[node.id] = false;
   this._removeFromLoadOrder(node.id);
   this._removeFromHibernatedOrder(node.id);
   this._hibernatedOrder.push(node.id);
   const v = this.getViewer();
   if (v && !this._isWebGLLost) v.scene.requestRender();
 },

 _awakenLayer(node) {
   const entry = this._cesiumLayers.get(node.id);
   if (!entry?.object) return;
   entry.object.show = true;
   if (entry.object.alpha !== undefined) entry.object.alpha = 1.0;
   this.loadedLayerIds[node.id] = true;
   this._removeFromHibernatedOrder(node.id);
   this._addToLoadOrder(node.id);
   const v = this.getViewer();
   if (v && !this._isWebGLLost) v.scene.requestRender();
 },

 _removeFromHibernatedOrder(nodeId) {
   const i = this._hibernatedOrder.indexOf(nodeId);
   if (i !== -1) this._hibernatedOrder.splice(i, 1);
 },

 5. toggleLayerLoad 适配 (~3003 行)

 在已有 visibility toggle 逻辑中，手动隐藏时也加入休眠池：

 // 在 entry.object.show = newShow; 之后，已有 loadedLayerIds 设置之后
 if (newShow) {
   this._removeFromHibernatedOrder(node.id);
   this._addToLoadOrder(node.id);
   delete this.layerErrors[node.id];
 } else {
   this._removeFromLoadOrder(node.id);
   this._removeFromHibernatedOrder(node.id);
   this._hibernatedOrder.push(node.id);
 }

 6. 手动重新加载 (~3038 行后新增)

 async reloadLayerNode(node) {
   // 防重复、WebGL 检查...
   const oldEntry = this._cesiumLayers.get(node.id);
   if (!oldEntry) { this.loadCesiumLayer(node); return; }

   const wasVisible = oldEntry.object?.show !== false;
   this.loadingLayerIds[node.id] = true;

   try {
     // 移除旧图层（不销毁 GPU）
     const viewer = this.getViewer();
     if (viewer && oldEntry.object) {
       if (oldEntry.type === 'geojson' || oldEntry.type === 'geocoding') {
         viewer.dataSources.remove(oldEntry.object, false);
       } else if (oldEntry.type === '3dtiles') {
         viewer.scene.primitives.remove(oldEntry.object);
       } else {
         viewer.imageryLayers.remove(oldEntry.object, false);
       }
     }
     this._cesiumLayers.delete(node.id);
     this._removeFromLoadOrder(node.id);
     this._removeFromHibernatedOrder(node.id);
     this.loadedLayerIds[node.id] = false;

     // 重新加载
     await this.loadCesiumLayer(node);

     // 成功 → 清理旧 blob URL
     if (oldEntry._imageUrl?.startsWith('blob:')) {
       try { URL.revokeObjectURL(oldEntry._imageUrl); } catch(e) {}
     }
   } catch (err) {
     // 失败 → 恢复旧图层
     const v = this.getViewer();
     if (v && oldEntry?.object) {
       if (oldEntry.type === 'geojson' || oldEntry.type === 'geocoding') {
         v.dataSources.add(oldEntry.object);
       } else if (oldEntry.type === '3dtiles') {
         v.scene.primitives.add(oldEntry.object);
         oldEntry.object.show = wasVisible;
       } else {
         v.imageryLayers.add(oldEntry.object);
         oldEntry.object.show = wasVisible;
       }
       this._cesiumLayers.set(node.id, oldEntry);
       this.loadedLayerIds[node.id] = wasVisible;
       if (wasVisible) this._addToLoadOrder(node.id);
       else this._hibernatedOrder.push(node.id);
       if (!this._isWebGLLost) v.scene.requestRender();
     }
     this.layerErrors[node.id] = {
       message: `重新加载失败，已保留旧图层: ${err.message}`,
       ...classifyLayerError(err.message)
     };
   } finally {
     this.loadingLayerIds[node.id] = false;
   }
 },

 7. 生命周期清理

 在三个方法中补充 _removeFromHibernatedOrder:
 - unloadCesiumLayer (~4490 行)
 - cleanupPartialLayer (~4314 行)
 - destroyAllCesiumLayers (~4707 行)：加 this._hibernatedOrder = []

 文件 2: TreeNodeItem.vue

 1. 重载按钮 (~56 行，在 🗑️  按钮后)

 <button
   v-if="isLayerLoaded || hasError"
   class="tree-action-btn tree-action-btn-reload"
   @click.stop="$emit('reload-layer', node)"
   title="重新加载图层"
   type="button"
 >🔄</button>

 2. emit 声明 (~96 行)

 在 emits 数组加 'reload-layer'

 3. CSS (~423 行 .tree-action-btn-danger 样式后)

 .tree-action-btn-reload:hover {
   background: rgba(255, 193, 7, 0.2);
   color: #FFC107;
 }

 文件 3: LayerTreeManager.vue 模板

 在 TreeNodeItem 绑定处 (~122 行) 加：
 @reload-layer="reloadLayerNode"

 各类型上限设计理由

 ┌────────────┬──────┬─────────────────────────────────────────────┐
 │    类型    │ 上限 │                    原因                     │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ XYZ / WMTS │ 15   │ 瓦片缓存、按需加载，GPU 开销极小            │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ WMS        │ 10   │ 服务端渲染，无客户端缓存                    │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ GeoJSON    │ 8    │ 中等：Entity 创建开销                       │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ MVT        │ 4    │ 矢量瓦片解析 + Canvas 纹理                  │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ WCS        │ 3    │ 完整 coverage 下载 + TIFF 解码 + SingleTile │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ 3DTiles    │ 3    │ 流式几何，最大 1GB VRAM/个                  │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ 休眠池     │ 8    │ 休眠层保留 GPU 纹理，需节制                 │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ 全局总量   │ 20   │ 硬上限，超出后卸载最旧图层                  │
 └────────────┴──────┴─────────────────────────────────────────────┘

 │ 3DTiles    │ 3    │ 流式几何，最大 1GB VRAM/个                  │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ 休眠池     │ 8    │ 休眠层保留 GPU 纹理，需节制                 │
 ├────────────┼──────┼─────────────────────────────────────────────┤
 │ 全局总量   │ 20   │ 硬上限，超出后卸载最旧图层                  │
 └────────────┴──────┴─────────────────────────────────────────────┘

 验证清单

 1. ✅ 同时加载 8+ 个 XYZ 图层 — 全部正常，不触发驱逐
 2. ✅ 加载 3 个 WCS → 第 3 个触发最旧 WCS 休眠（隐藏但保留）→ 重新勾选唤醒（瞬间）
 3. ✅ 加载 20+ 图层 → 休眠池满后卸载 → 卸载的图层重新勾选时从网络重新加载
 4. ✅ 点击 🔄 → 旧图层保留到新加载成功 → 失败时恢复旧图层
 5. ✅ 网络差时 toggle 可见性 — 瞬间切换，无网络请求
 6. ✅ 组件卸载时 _hibernatedOrder 被清理