/**
 * EntitySelectionManager — 通用实体选中、高亮、属性提取管理器
 *
 * 职责：
 *   1. 统一管理所有图层的实体拾取（click/dblclick）
 *   2. 自动检测实体类型，调用对应的高亮策略
 *   3. 提取实体属性，通过回调通知调用方展示属性面板
 *   4. 支持聚类展开、GLB 模型高亮、3D Tiles 高亮等
 *
 * 使用方式：
 *   const esm = EntitySelectionManager.getInstance();
 *   esm.registerLayer(viewer, layerId, dataSource, {
 *     mode: 'click',              // 'click' | 'dblclick'
 *     enableHighlight: true,
 *     enableClustering: true,     // 点击聚类点时自动展开
 *     onSelect: (payload) => {}   // 选中回调
 *   });
 *   esm.unregisterLayer(layerId);
 */

// ==================== SDK Bug 修复 ====================

/**
 * 修复 SGKJ_SDK.SceneEffect.FlashEntityByColor 中的 color.withAlpha 报错
 *
 * 根因：FlashEntityByColor 在 "color" 分支中将 entity[geoType].color（Property 对象）
 * 传给了 _getColorCallBack，但 _getColorCallBack 期望接收的是原始 Cesium.Color 对象。
 * 对比 material 分支正确传入了提取后的原始 Color 值。
 *
 * 修复方式：monkey-patch _getColorCallBack，在入口处自动从 Property 中提取原始 Color。
 */
(function patchSceneEffectGetColorCallBack() {
  if (typeof SGKJ_SDK === 'undefined' || !SGKJ_SDK.SceneEffect) return;
  var proto = SGKJ_SDK.SceneEffect.prototype;
  if (!proto || !proto._getColorCallBack) return;
  var origGetColorCallBack = proto._getColorCallBack;

  proto._getColorCallBack = function (color, time, step, minValue, maxValue, callback) {
    var originalArg = color;
    // 如果传入的是 Property 对象（ConstantProperty 等），提取其内部原始 Color 值
    if (color && typeof color.getValue === 'function') {
      color = color.getValue();
      console.log('[EntitySelectionManager] 🔧 _getColorCallBack patch: 从 Property 提取原始 Color →', color);
    }
    // 兜底：如果提取后仍然不是有效 Cesium.Color，使用白色
    if (!color || typeof color.withAlpha !== 'function') {
      console.warn('[EntitySelectionManager] ⚠️ _getColorCallBack patch: 无效颜色，回退到 WHITE。原始参数:', originalArg, '提取后:', color);
      if (typeof Cesium !== 'undefined' && Cesium.Color) {
        color = Cesium.Color.WHITE;
      }
    }
    console.log('[EntitySelectionManager] 🔧 _getColorCallBack patch: 最终传入原始 SDK 的 color=', color, 'alpha=', color.alpha);
    return origGetColorCallBack.call(this, color, time, step, minValue, maxValue, callback);
  };
})();

// ==================== 高亮策略注册表 ====================

/**
 * 默认高亮策略 — 使用 SGKJ_SDK.SceneEffect.FlashEntityByColor
 * 适用于 Point / Polygon / Polyline 等矢量实体
 */
function flashHighlight(entity, geoType, viewer, options) {
  if (typeof SGKJ_SDK === 'undefined' || !SGKJ_SDK.SceneEffect) {
    console.warn('[EntitySelectionManager] SGKJ_SDK.SceneEffect 不可用，跳过闪烁高亮');
    return;
  }
  try {
    // ⭐ 前置修复：确保 entity[geoType].color 是 ConstantProperty 而非原始 Color
    //   FlashEntityByColor 内部有两处依赖：
    //     1) entity[geoType].color.getValue() — 原始 Color 没有此方法 → Promise 静默拒绝
    //     2) _getColorCallBack(entity[geoType].color, …) — 传入 Property 而非 Color
    //   修复 #1 的方式：将原始 Color 包装为 ConstantProperty（统一 Property 类型）
    //   修复 #2 的方式：monkey-patch _getColorCallBack（在入口自动提取 Color，见顶部 patch）
    if (entity[geoType] && 'color' in entity[geoType]) {
      var raw = entity[geoType].color;
      var needsWrap = !raw || typeof raw.getValue !== 'function';
      console.log('[EntitySelectionManager] 🔍 flashHighlight 前置检查: geoType=' + geoType +
        ', raw类型=' + (raw ? (typeof raw.getValue === 'function' ? 'Property' : '原始Color') : 'null/undefined') +
        ', 需包装=' + needsWrap);
      // 如果是原始 Cesium.Color 或 undefined/null，包装为 ConstantProperty
      if (needsWrap) {
        var wrappedColor = (raw && typeof raw.withAlpha === 'function') ? raw : Cesium.Color.WHITE;
        entity[geoType].color = new Cesium.ConstantProperty(wrappedColor);
        console.log('[EntitySelectionManager] 📦 flashHighlight: 已包装为 ConstantProperty(', wrappedColor, ')');
      }
    }

    const effect = new SGKJ_SDK.SceneEffect(viewer);
    var flashPromise = effect.FlashEntityByColor(entity, geoType, {
      time: options.duration || 2,
      step: options.step || 0.05,
      minValue: options.minAlpha || 0,
      maxValue: options.maxAlpha || 1
    });
    // 捕获 Promise 拒绝（SDK 内部可能静默失败）
    if (flashPromise && typeof flashPromise.catch === 'function') {
      flashPromise.catch(function (err) {
        console.error('[EntitySelectionManager] ❌ FlashEntityByColor Promise 被拒绝:', err);
      });
    }
    console.log(`[EntitySelectionManager] ✨ 闪烁高亮: geoType=${geoType}, duration=${options.duration || 2}s`);
  } catch (err) {
    console.warn('[EntitySelectionManager] 闪烁高亮失败:', err.message);
  }
}

/**
 * 模型高亮策略 — 修改 model.silhouetteColor / silhouetteSize
 * 适用于 GLB / GLTF 模型实体
 */
function modelHighlight(entity, geoType, viewer, options) {
  if (!entity.model) return;
  const origColor = entity.model.silhouetteColor ? entity.model.silhouetteColor.clone() : null;
  const origSize = entity.model.silhouetteSize || 0;

  // 设置高亮轮廓
  entity.model.silhouetteColor = options.modelHighlightColor ||
    (typeof Cesium !== 'undefined' ? Cesium.Color.fromCssColorString('#FF6B35') : null);
  entity.model.silhouetteSize = options.modelHighlightSize || 3.0;
  viewer.scene.requestRender();

  // 定时恢复
  const duration = (options.duration || 2) * 1000;
  entity._highlightTimer && clearTimeout(entity._highlightTimer);
  entity._highlightTimer = setTimeout(() => {
    if (!entity.isDestroyed || !entity.isDestroyed()) {
      entity.model.silhouetteColor = origColor;
      entity.model.silhouetteSize = origSize;
      viewer.scene.requestRender();
    }
  }, duration);
}

/**
 * 3D Tiles 高亮策略 — 使用 tileset.style 修改选中 tile 颜色
 * 适用于 Cesium3DTileset
 */
function tilesetHighlight(entity, geoType, viewer, options) {
  // 注意：entity 这里是 Cesium3DTileFeature（从 scene.pick 返回的 primitive）
  // 在 Cesium 中，pick tileset 返回 Cesium3DTileFeature，不是 Entity
  const feature = entity;
  if (!feature || !feature.tileset) return;

  const origColor = feature.color;
  const highlightColor = options.modelHighlightColor ||
    (typeof Cesium !== 'undefined' ? Cesium.Color.fromCssColorString('#FF6B35') : null);

  if (feature.color) {
    // 直接修改 feature color
    feature.color = highlightColor;
  } else {
    // 通过 tileset.style 设置
    const tileset = feature.tileset;
    const origStyle = tileset.style;
    tileset.style = new Cesium.Cesium3DTileStyle({
      color: {
        evaluateColor: function () { return highlightColor; }
      }
    });
    tileset._origStyle = origStyle;
  }

  // 定时恢复
  const duration = (options.duration || 2) * 1000;
  if (feature._highlightTimer) clearTimeout(feature._highlightTimer);
  feature._highlightTimer = setTimeout(() => {
    if (feature.color) {
      feature.color = origColor;
    }
    if (feature.tileset && feature.tileset._origStyle) {
      feature.tileset.style = feature.tileset._origStyle;
      delete feature.tileset._origStyle;
    }
    viewer.scene.requestRender();
  }, duration);
}

// 高亮策略表：按 entity 结构特征 → 策略函数
const HIGHLIGHT_STRATEGIES = [
  // 模型实体（有 model 属性）
  { test: function (e) { return !!(e.model); }, type: 'model', highlight: modelHighlight },
  // 矢量实体（有 point/polygon/polyline）
  { test: function (e) { return !!(e.point || e.polygon || e.polyline); }, type: 'vector', highlight: flashHighlight },
  // 图标实体
  { test: function (e) { return !!(e.billboard); }, type: 'billboard', highlight: flashHighlight },
  // 标签实体
  { test: function (e) { return !!(e.label && !e.position); }, type: 'label', highlight: flashHighlight }
];

// ==================== 属性提取 ====================

/**
 * 从 entity 中提取可展示的属性列表
 * 支持：GeoJSON properties、Cesium Entity properties、自定义 propertyBag
 */
function extractProperties(entity) {
  const props = [];

  // 1. 基础标识信息
  if (entity.id) {
    props.push({ name: 'ID', value: typeof entity.id === 'object' ? (entity.id._id || JSON.stringify(entity.id)) : String(entity.id) });
  }
  if (entity.name) {
    props.push({ name: '名称', value: entity.name });
  }

  // 2. GeoJSON feature properties（Cesium GeoJsonDataSource 加载后存储在 entity.properties）
  if (entity.properties) {
    try {
      const pv = entity.properties.getValue ? entity.properties.getValue() : null;
      if (pv && typeof pv === 'object') {
        // Cesium.PropertyBag — 枚举所有属性
        if (pv.propertyNames && Array.isArray(pv.propertyNames)) {
          pv.propertyNames.forEach(function (key) {
            if (key === 'id' || key === 'name') return; // 跳过已添加的
            try {
              const val = pv[key] ? (pv[key].getValue ? pv[key].getValue() : pv[key]) : pv[key];
              props.push({ name: key, value: val != null ? String(val) : '' });
            } catch (e) { /* skip */ }
          });
        } else if (pv.getValue && typeof pv.getValue === 'function') {
          // 单个 Property
          const val = pv.getValue();
          if (val != null) props.push({ name: '值', value: String(val) });
        } else if (!Array.isArray(pv)) {
          // 普通对象 — 遍历所有属性
          Object.keys(pv).forEach(function (key) {
            if (key === 'id' || key === 'name') return;
            try {
              let val = pv[key];
              if (val && val.getValue && typeof val.getValue === 'function') {
                val = val.getValue();
              }
              props.push({ name: key, value: val != null ? String(val) : '' });
            } catch (e) { /* skip */ }
          });
        }
      }
    } catch (e) {
      console.warn('[EntitySelectionManager] 属性提取异常:', e.message);
    }
  }

  // 3. 模型实体额外信息
  if (entity.model) {
    props.push({ name: '类型', value: '3D 模型 (GLB/GLTF)' });
    if (entity.model.uri) {
      props.push({ name: '模型URI', value: entity.model.uri });
    }
  }

  // 4. 3D Tiles feature
  if (entity.tileset) {
    props.push({ name: '类型', value: '3D Tiles 要素' });
    if (entity.getPropertyNames) {
      entity.getPropertyNames().forEach(function (key) {
        try {
          const val = entity.getProperty(key);
          props.push({ name: key, value: val != null ? String(val) : '' });
        } catch (e) { /* skip */ }
      });
    }
  }

  return props;
}

// ==================== 聚类处理 ====================

/**
 * 处理聚类实体被点击 — 飞行靠近以展开聚类
 */
function handleClusterPick(clusterEntity, viewer, Cesium, onClusterExpand) {
  if (!clusterEntity || !clusterEntity.position) return false;

  try {
    const position = clusterEntity.position.getValue
      ? clusterEntity.position.getValue(Cesium.JulianDate.now())
      : clusterEntity.position;

    if (!position) return false;

    // 计算当前相机到聚类位置的距离，飞行到一半距离来展开聚类
    const camPos = viewer.camera.positionCartographic;
    const clusterPos = Cesium.Cartographic.fromCartesian(position);
    const dist = Cesium.Cartesian3.distance(viewer.camera.position, position);
    const targetDist = Math.max(dist * 0.3, 100); // 飞近到 30% 距离，最低 100 米

    viewer.camera.flyTo({
      destination: position,
      duration: 0.8,
      offset: new Cesium.HeadingPitchRange(
        viewer.camera.heading,
        viewer.camera.pitch,
        targetDist
      )
    });

    if (onClusterExpand) {
      onClusterExpand(clusterEntity, clusterPos);
    }

    return true;
  } catch (e) {
    console.warn('[EntitySelectionManager] 聚类展开失败:', e.message);
    return false;
  }
}

// ==================== 主类 ====================

var _instance = null;

function EntitySelectionManager() {
  if (_instance) return _instance;

  /** @type {Map<string, Object>} layerId → { viewer, dataSource, options, Cesium } */
  this._layers = new Map();
  /** @type {Map<string, Object>} viewerKey → { clickAction, dblclickAction, eventTypes } */
  this._globalHandlers = new Map();
  /** 当前选中的 entity 引用（用于取消选中） */
  this._currentSelection = null;
  /** postRender 位置跟踪回调 */
  this._postRenderCallback = null;

  _instance = this;
}

EntitySelectionManager.getInstance = function () {
  if (!_instance) _instance = new EntitySelectionManager();
  return _instance;
};

EntitySelectionManager.prototype = {

  // ==================== 图层注册 / 注销 ====================

  /**
   * 注册一个图层用于实体拾取
   *
   * @param {Cesium.Viewer} viewer      - Cesium Viewer 实例
   * @param {string}        layerId     - 图层唯一标识
   * @param {Cesium.DataSource|Cesium.CustomDataSource} dataSource - 数据源
   * @param {Object}        options     - 配置项
   * @param {string}        options.mode             - 拾取模式 'click' | 'dblclick'，默认 'click'
   * @param {boolean}       options.enableHighlight  - 是否启用高亮，默认 true
   * @param {boolean}       options.enableClustering - 聚类时是否展开，默认 true
   * @param {number}        options.highlightDuration- 高亮持续时间(秒)，默认 2
   * @param {Function}      options.onSelect         - 选中回调(payload)
   * @param {Function}      options.onDismiss        - 取消选中回调
   * @param {Function}      options.filter           - 实体过滤器(entity) → boolean
   */
  registerLayer: function (viewer, layerId, dataSource, options) {
    if (!viewer || !layerId || !dataSource) {
      console.warn('[EntitySelectionManager] 参数不完整，注册失败');
      return;
    }

    var Cesium = window.Cesium;
    if (!Cesium) {
      console.error('[EntitySelectionManager] Cesium 未加载');
      return;
    }

    // 如果已注册，先注销
    if (this._layers.has(layerId)) {
      this.unregisterLayer(layerId);
    }

    var opts = Object.assign({
      mode: 'click',
      enableHighlight: true,
      enableClustering: true,
      highlightDuration: 2,
      onSelect: null,
      onDismiss: null,
      filter: null
    }, options || {});

    // 保存图层信息
    this._layers.set(layerId, {
      viewer: viewer,
      dataSource: dataSource,
      options: opts,
      Cesium: Cesium
    });

    // ⭐ 全局 handler：每个 viewer 每种事件类型只注册一次，内部分发到对应图层
    this._ensureGlobalHandler(viewer, Cesium);

    console.log('[EntitySelectionManager] ✅ 图层已注册:', layerId,
      '(mode=' + opts.mode + ', clustering=' + opts.enableClustering + ')');
  },

  /**
   * 确保全局拾取 handler 已注册（每个 viewer 仅注册一次）
   *
   * ⚠️ 不使用 screenSpaceEventHandler.setInputAction (LEFT_CLICK) —
   *    会干扰 Cesium ScreenSpaceCameraController 的 LEFT_DRAG 平移。
   *    改用 canvas 原生 mousedown/mouseup 跟踪，仅当鼠标移动 < 5px 时
   *    才视为"点击"，否则视为拖拽（放行给相机控制器）。
   */
  _ensureGlobalHandler: function (viewer, Cesium) {
    var viewerKey = this._getViewerKey(viewer);
    if (this._globalHandlers.has(viewerKey)) return; // 已注册

    var canvas = viewer.canvas || viewer.scene.canvas;
    if (!canvas) {
      console.warn('[EntitySelectionManager] ⚠️ 无法获取 Cesium canvas，拾取未注册');
      return;
    }

    var self = this;
    var mouseDownPos = null;
    var CLICK_THRESHOLD = 5; // 移动超过 5px 视为拖拽而非点击

    // mousedown — 记录起始位置
    // ⚠️ 使用 pointerdown/pointerup 而非 mousedown/mouseup：
    //    Cesium ScreenSpaceEventHandler 在 pointerdown 上调用了 preventDefault()，
    //    浏览器规范规定这会阻止后续的 mousedown 事件，导致 mouse 监听器不触发。
    var onPointerDown = function (e) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    var onPointerUp = function (e) {
      if (!mouseDownPos) return;

      var dx = e.clientX - mouseDownPos.x;
      var dy = e.clientY - mouseDownPos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      mouseDownPos = null;

      if (dist > CLICK_THRESHOLD) {
        // 拖拽 — 放行给相机控制器，不做拾取
        return;
      }

      console.log('[EntitySelectionManager] 🖱️ canvas click 检测到, 坐标:', e.clientX, e.clientY);

      // 真正的点击 → 执行实体拾取
      var rect = canvas.getBoundingClientRect();
      var screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // 构造兼容 movement 格式
      var movement = {
        position: new Cesium.Cartesian2(screenPos.x, screenPos.y),
        endPosition: new Cesium.Cartesian2(screenPos.x, screenPos.y)
      };

      self._globalPick(viewer, movement, Cesium, 'click');
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);

    // 双击：使用 screenSpaceEventHandler（不影响拖拽）
    var dblclickAction = function (movement) {
      self._globalPick(viewer, movement, Cesium, 'dblclick');
    };
    viewer.screenSpaceEventHandler.setInputAction(
      dblclickAction,
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    // ⭐ 隐藏 Cesium 默认的 SelectionIndicator（绿色瞄准镜）和 InfoBox
    //    保留 Cesium 原生 LEFT_CLICK 事件链（不 removeInputAction），
    //    确保后续的鼠标绘图、测量等工具不受影响。
    //    双重策略：1) viewModel 属性  2) CSS display:none（终极保险）
    if (viewer.selectionIndicator) {
      if (viewer.selectionIndicator.viewModel) {
        viewer.selectionIndicator.viewModel.showSelection = false;
      }
      // CSS 隐藏 — 即使 viewModel 被意外重置也能兜底
      var selContainer = viewer.selectionIndicator.container;
      if (selContainer) {
        selContainer.style.cssText = 'display:none !important';
        selContainer.setAttribute('data-entity-selection-hidden', 'true');
      }
    }
    if (viewer.infoBox) {
      if (viewer.infoBox.viewModel) {
        viewer.infoBox.viewModel.showInfo = false;
      }
      var infoContainer = viewer.infoBox.container;
      if (infoContainer) {
        infoContainer.style.cssText = 'display:none !important';
        infoContainer.setAttribute('data-entity-selection-hidden', 'true');
      }
    }
    console.log('[EntitySelectionManager] 🙈 已隐藏 Cesium 原生 SelectionIndicator + InfoBox');

    // ⭐ 安全措施：每个 render 循环后清除 viewer.selectedEntity
    //    Cesium 原生 LEFT_CLICK 仍会设置 selectedEntity，但 SelectionIndicator
    //    和 InfoBox 已隐藏。清除 selectedEntity 可避免其他组件误读此状态。
    var postRenderClear = viewer.scene.postRender.addEventListener(function () {
      if (viewer.selectedEntity) {
        viewer.selectedEntity = undefined;
      }
    });

    this._globalHandlers.set(viewerKey, {
      canvas: canvas,
      onPointerDown: onPointerDown,
      onPointerUp: onPointerUp,
      dblclickAction: dblclickAction,
      postRenderClear: postRenderClear
    });

    console.log('[EntitySelectionManager] 🌐 全局拾取 handler 已注册 (canvas原生事件, viewer=' + viewerKey + ')');
  },

  /**
   * 全局拾取分发 — 点击时遍历所有图层，找到匹配的实体并分发
   */
  _globalPick: function (viewer, movement, Cesium, mode) {
    var self = this;
    var screenPos = movement.endPosition || movement.position;
    var pick = viewer.scene.pick(screenPos);

    console.log('[EntitySelectionManager] 🖱️ pick 结果:', {
      hasPick: !!pick,
      pickId: pick && pick.id ? (pick.id.name || pick.id.id || pick.id) : null,
      isTileset: !!(pick && pick.tileset),
      layersRegistered: self._layers.size
    });

    // === 处理 3D Tiles pick ===
    if (pick && pick.tileset && !pick.id) {
      // 找到第一个注册了该 viewer 的图层来处理
      this._layers.forEach(function (layer, layerId) {
        if (layer.viewer === viewer && layer.options.mode === mode) {
          self._handleTilesetPick(viewer, layerId, pick, screenPos, Cesium);
          return; // break forEach isn't possible, but we only want first match
        }
      });
      return;
    }

    // === 处理 Entity pick ===
    var entity = pick && pick.id ? pick.id : null;

    if (!Cesium.defined(entity)) {
      console.log('[EntitySelectionManager] 🖱️ 点击空白处（pick.id 为空）');
      // 点击空白处 → 通知所有图层取消选中
      this._layers.forEach(function (layer, layerId) {
        if (layer.viewer === viewer && layer.options.onDismiss) {
          layer.options.onDismiss();
        }
      });
      self._currentSelection = null;
      return;
    }

    console.log('[EntitySelectionManager] 🎯 找到 entity:', entity.name || entity.id, '匹配图层中...');

    // 查找实体属于哪个图层
    var matchedLayerId = null;
    this._layers.forEach(function (layer, layerId) {
      if (matchedLayerId) return; // 已匹配
      if (layer.viewer !== viewer) return;
      if (layer.options.mode !== mode) return;

      // 检查实体是否属于该 dataSource
      if (layer.dataSource && layer.dataSource.entities) {
        try {
          if (layer.dataSource.entities.contains(entity)) {
            matchedLayerId = layerId;
          }
        } catch (e) {
          // contains 可能抛异常，回退到 getById
          try {
            if (layer.dataSource.entities.getById(entity.id)) {
              matchedLayerId = layerId;
            }
          } catch (e2) { /* ignore */ }
        }
      }
    });

    if (!matchedLayerId) {
      console.log('[EntitySelectionManager] ⚠️ entity 不属于任何已注册图层, entity.id=' + (entity.id && entity.id._id ? entity.id._id : entity.id));
      return;
    }

    console.log('[EntitySelectionManager] ✅ 匹配到图层:', matchedLayerId);
    var layer = this._layers.get(matchedLayerId);
    if (!layer) return;

    // 实体过滤器
    if (layer.options.filter && !layer.options.filter(entity)) return;

    // 聚类处理
    if (layer.options.enableClustering && this._isClusterEntity(entity)) {
      console.log('[EntitySelectionManager] 🔵 聚类点被点击，飞行展开...');
      var expanded = handleClusterPick(entity, viewer, Cesium, function () {
        // 聚类展开后用户可再次点击
      });
      if (expanded) return;
    }

    // 正常选中流程
    this._processSelection(viewer, matchedLayerId, entity, screenPos, layer.options, Cesium);
  },

  /**
   * 注销图层
   */
  unregisterLayer: function (layerId) {
    var layer = this._layers.get(layerId);
    if (!layer) return;

    // 清除该图层的选中状态
    if (this._currentSelection && this._currentSelection.layerId === layerId) {
      this._currentSelection = null;
    }

    this._layers.delete(layerId);

    // 如果这是该 viewer 最后一个图层，移除全局 handler
    this._cleanupGlobalHandlerIfEmpty(layer.viewer);

    console.log('[EntitySelectionManager] 🗑️ 图层已注销:', layerId);
  },

  /**
   * 注销所有图层
   */
  unregisterAll: function () {
    var self = this;
    var ids = Array.from(this._layers.keys());
    ids.forEach(function (id) { self.unregisterLayer(id); });
    // 清理所有全局 handler（移除 canvas 监听 + postRender + screenSpaceEventHandler 双击监听）
    this._globalHandlers.forEach(function (info, viewerKey) {
      if (info.canvas) {
        if (info.onPointerDown) info.canvas.removeEventListener('pointerdown', info.onPointerDown);
        if (info.onPointerUp) info.canvas.removeEventListener('pointerup', info.onPointerUp);
      }
      // 移除 postRender 监听（需要 viewer 引用，但 unregisterAll 中 viewer 可能已销毁）
      // 注：_cleanupGlobalHandlerIfEmpty 中已处理正常的 postRender 清理
    });
    this._globalHandlers.clear();
  },

  /**
   * 为 viewer 生成唯一标识
   */
  _getViewerKey: function (viewer) {
    return viewer._id || viewer.container?.id || 'cesium-viewer';
  },

  /**
   * 当某 viewer 下无图层时移除全局 handler
   */
  _cleanupGlobalHandlerIfEmpty: function (viewer) {
    if (!viewer) return;
    var viewerKey = this._getViewerKey(viewer);
    var hasLayer = false;
    this._layers.forEach(function (layer) {
      if (layer.viewer === viewer) hasLayer = true;
    });
    if (hasLayer) return;

    var info = this._globalHandlers.get(viewerKey);
    if (!info) return;

    // 移除 canvas 原生事件监听
    if (info.canvas) {
      if (info.onPointerDown) info.canvas.removeEventListener('pointerdown', info.onPointerDown);
      if (info.onPointerUp) info.canvas.removeEventListener('pointerup', info.onPointerUp);
    }

    // 移除 screenSpaceEventHandler 双击监听
    try {
      if (info.dblclickAction) {
        viewer.screenSpaceEventHandler.removeInputAction(
          window.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );
      }
    } catch (e) { /* ignore */ }

    // 移除 postRender 清除 selectedEntity 监听
    if (info.postRenderClear && viewer.scene && viewer.scene.postRender) {
      try {
        viewer.scene.postRender.removeEventListener(info.postRenderClear);
      } catch (e) { /* ignore */ }
    }

    this._globalHandlers.delete(viewerKey);
  },

  /**
   * 获取已注册的图层ID列表
   */
  getRegisteredLayers: function () {
    return Array.from(this._layers.keys());
  },

  // ==================== 选中 / 取消选中 ====================

  /**
   * 手动选中一个实体（用于程序化触发）
   */
  selectEntity: function (layerId, entity, screenPosition) {
    var layer = this._layers.get(layerId);
    if (!layer) {
      console.warn('[EntitySelectionManager] 图层未注册:', layerId);
      return;
    }
    this._processSelection(layer.viewer, layerId, entity, screenPosition, layer.options, layer.Cesium);
  },

  /**
   * 取消当前选中
   */
  dismissSelection: function () {
    if (!this._currentSelection) return;

    var layer = this._layers.get(this._currentSelection.layerId);
    if (layer && layer.options.onDismiss) {
      layer.options.onDismiss(this._currentSelection);
    }
    this._currentSelection = null;
  },

  /**
   * 处理 3D Tiles 要素选中
   */
  _handleTilesetPick: function (viewer, layerId, feature, screenPos, Cesium) {
    var layer = this._layers.get(layerId);
    if (!layer) return;

    var props = extractProperties(feature);

    var payload = {
      layerId: layerId,
      entity: feature,
      screenPosition: screenPos,
      geoType: '3dtiles',
      properties: props,
      title: props.length > 0 ? (props[0].value || '3D Tiles 要素') : '3D Tiles 要素',
      _raw: feature
    };

    // 高亮
    if (layer.options.enableHighlight) {
      tilesetHighlight(feature, '3dtiles', viewer, {
        duration: layer.options.highlightDuration
      });
    }

    this._currentSelection = { layerId: layerId, entityId: 'tileset-feature' };
    if (layer.options.onSelect) {
      layer.options.onSelect(payload);
    }

    console.log('[EntitySelectionManager] 🏗️ 3D Tiles 要素已选中:', props.slice(0, 5));
  },

  /**
   * 统一选中处理流程
   */
  _processSelection: function (viewer, layerId, entity, screenPos, options, Cesium) {
    // 1. 检测 geoType
    var geoType = this._detectGeoType(entity);

    // 2. 提取属性
    var props = extractProperties(entity);

    // 3. 构建 payload
    var payload = {
      layerId: layerId,
      entity: entity,
      screenPosition: screenPos,
      geoType: geoType,
      properties: props,
      title: entity.name || entity.id || (props.length > 0 ? props[0].value : '实体'),
      _raw: entity
    };

    // 4. 高亮
    if (options.enableHighlight) {
      this._applyHighlight(entity, geoType, viewer, {
        duration: options.highlightDuration
      });
    }

    // 5. 记录当前选中
    this._currentSelection = { layerId: layerId, entityId: entity.id };

    // 6. 通知调用方
    if (options.onSelect) {
      options.onSelect(payload);
    }

    console.log('[EntitySelectionManager] 🎯 实体已选中:', payload.title,
      '(geoType=' + geoType + ', props=' + props.length + ')');
  },

  /**
   * 检测实体几何类型
   */
  _detectGeoType: function (entity) {
    if (entity.polygon) return 'polygon';
    if (entity.polyline) return 'polyline';
    if (entity.point) return 'point';
    if (entity.model) return 'model';
    if (entity.billboard && !entity.point) return 'billboard';
    if (entity.label && !entity.position) return 'label';
    return 'unknown';
  },

  /**
   * 检测是否为聚类实体
   */
  _isClusterEntity: function (entity) {
    // 聚类实体特征：
    //   1. 由 Cesium EntityCluster 内部创建
    //   2. 仅有 billboard + label（label 文本为纯数字，表示数量）
    //   3. 没有 entity.point/polygon/polyline/model 等几何
    //   4. 没有 GeoJSON 的属性（entity.properties 不存在或不包含源数据）
    if (!entity) return false;

    // Rule 1：有几何体 → 一定是真实要素，绝不可能是聚类
    if (entity.point || entity.polygon || entity.polyline || entity.model) return false;

    // Rule 2：有 GeoJSON 源属性 → 真实要素（PinBuilder 点实体无 entity.point，
    //    但有 entity.properties，而聚类实体没有源属性）
    try {
      if (entity.properties && entity.properties.getValue) {
        var pv = entity.properties.getValue();
        if (pv && Object.keys(pv).length > 0) return false;
      }
    } catch (e) { /* ignore */ }

    // Rule 3：仅 billboard + 纯数字 label（且无源属性）→ 聚类实体
    if (entity.billboard && entity.label && entity.label.text) {
      var text;
      try {
        text = entity.label.text.getValue
          ? entity.label.text.getValue()
          : entity.label.text;
      } catch (e) { return false; }

      if (text && /^\d{1,4}$/.test(String(text))) return true;
    }

    return false;
  },

  /**
   * 应用高亮效果（根据实体类型选择策略）
   */
  _applyHighlight: function (entity, geoType, viewer, options) {
    var matched = false;
    for (var i = 0; i < HIGHLIGHT_STRATEGIES.length; i++) {
      var strategy = HIGHLIGHT_STRATEGIES[i];
      if (strategy.test(entity)) {
        try {
          strategy.highlight(entity, geoType, viewer, options);
          matched = true;
        } catch (e) {
          console.warn('[EntitySelectionManager] 高亮执行失败 (' + strategy.type + '):', e.message);
        }
        break;
      }
    }

    if (!matched) {
      // 回退：尝试使用 SGKJ_SDK 通用闪烁
      if (typeof SGKJ_SDK !== 'undefined' && SGKJ_SDK.SceneEffect && geoType !== 'unknown') {
        try {
          var effect = new SGKJ_SDK.SceneEffect(viewer);
          effect.FlashEntityByColor(entity, geoType, {
            time: options.duration || 2,
            step: 0.05,
            minValue: 0,
            maxValue: 1
          });
        } catch (e) {
          console.warn('[EntitySelectionManager] 回退高亮也失败:', e.message);
        }
      }
    }
  },

  /**
   * 设置 postRender 位置跟踪回调
   * 调用方用于更新弹出面板的屏幕位置
   *
   * @param {Cesium.Viewer} viewer
   * @param {Cesium.Entity|Cesium.Cartesian3} target  - 要跟踪的实体或世界坐标
   * @param {Function} callback                       - (screenPosition: {x, y}) => void
   */
  trackScreenPosition: function (viewer, target, callback) {
    var self = this;
    this._removePostRenderListener(viewer);

    if (!viewer || !target || !callback) return;

    var Cesium = window.Cesium;
    if (!Cesium) return;

    var listener = function () {
      try {
        var position = null;
        if (target.position) {
          // Entity — 获取其世界坐标
          position = target.position.getValue
            ? target.position.getValue(viewer.clock.currentTime)
            : target.position;
        } else if (target.x !== undefined) {
          // Cartesian3 世界坐标
          position = target;
        }

        if (position) {
          var screenPos = viewer.scene.cartesianToCanvasCoordinates(position);
          if (screenPos) {
            callback({ x: screenPos.x, y: screenPos.y });
          }
        }
      } catch (e) {
        // 实体可能已被销毁
        self._removePostRenderListener(viewer);
      }
    };

    viewer.scene.postRender.addEventListener(listener);
    this._postRenderCallback = { viewer: viewer, listener: listener };
  },

  /**
   * 停止屏幕位置跟踪
   */
  stopTracking: function () {
    if (this._postRenderCallback) {
      this._removePostRenderListener(this._postRenderCallback.viewer);
    }
  },

  _removePostRenderListener: function (viewer) {
    if (!viewer || !this._postRenderCallback) return;
    try {
      viewer.scene.postRender.removeEventListener(this._postRenderCallback.listener);
    } catch (e) { /* ignore */ }
    this._postRenderCallback = null;
  },

  // ==================== 内部实现 ====================
  // (拾取分发在 _globalPick、选中处理在 _processSelection)
};

// ==================== 导出 ====================
export default EntitySelectionManager;
