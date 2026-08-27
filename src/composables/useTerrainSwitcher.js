/**
 * useTerrainSwitcher — 地形切换组合函数
 *
 * 地形模式：
 *   'local' — CesiumTerrainProvider 加载吉安本地预生成瓦片（默认）
 *   'ion'   — Cesium World Terrain (Ion 全球地形)
 *   'none'  — 无地形 (EllipsoidTerrainProvider)
 *
 * 基于 ja-yjjg-dp 项目的成功实现改造
 */

import { ref, computed } from "vue";

export const TERRAIN_MODES = [
  { mode: "local", label: "吉安本地", icon: "⛰️" },
  { mode: "ion", label: "Ion 地形", icon: "🌐" },
  { mode: "none", label: "无地形", icon: "⬜" },
];

const LOCAL_TERRAIN_BOUNDS = { west: 114, east: 115, south: 26, north: 28 };

function getLocalTerrainUrl() {
  const base = import.meta.env?.BASE_URL || "/";
  return `${base}data/dem/terrain/jian_glo30`.replace(/\/+/g, "/");
}

// 注入地形加载遮罩样式（只执行一次）
let _styleInjected = false;
function injectOverlayStyle() {
  if (_styleInjected) return;
  _styleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .cesium-terrain-loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
    }
    @keyframes cesium-terrain-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export function useTerrainSwitcher() {
  const currentMode = ref("ion");

  const currentLabel = computed(() => {
    const opt = TERRAIN_MODES.find((m) => m.mode === currentMode.value);
    return opt ? `${opt.icon} ${opt.label}` : "未知";
  });

  let _boundsRect = null;
  let _switching = false;
  let _ionProvider = null;
  let _localProvider = null;

  function removeBoundsRect(viewer) {
    if (_boundsRect) {
      viewer.entities.remove(_boundsRect);
      _boundsRect = null;
    }
  }

  function showBoundsRect(viewer, Cesium) {
    removeBoundsRect(viewer);
    _boundsRect = viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(
          LOCAL_TERRAIN_BOUNDS.west, LOCAL_TERRAIN_BOUNDS.south,
          LOCAL_TERRAIN_BOUNDS.east, LOCAL_TERRAIN_BOUNDS.north
        ),
        fill: false,
        outline: true,
        outlineColor: Cesium.Color.LIME,
        outlineWidth: 3,
      },
    });
  }

  /** 如果相机在 DEM 范围外，自动飞入 */
  function flyToLocalBounds(viewer, Cesium) {
    try {
      const cart = viewer.camera.positionCartographic;
      if (!cart) return;
      const lon = Cesium.Math.toDegrees(cart.longitude);
      const lat = Cesium.Math.toDegrees(cart.latitude);
      const { west, east, south, north } = LOCAL_TERRAIN_BOUNDS;
      if (lon < west || lon > east || lat < south || lat > north) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees((west + east) / 2, (south + north) / 2, 5000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
          duration: 1.5,
        });
      }
    } catch (e) { /* ignore */ }
  }

  async function switchTerrain(mode) {
    if (_switching) return;
    if (currentMode.value === mode) return;

    const viewer = window.__cesiumViewer__;
    if (!viewer) return;

    const Cesium = window.Cesium;
    if (!Cesium) return;

    injectOverlayStyle();
    _switching = true;

    // 1. 先隐藏所有 label，防止旧位置被渲染。保存原始 show 以便恢复
    const hiddenLabels = [];
    for (let i = 0; i < viewer.dataSources.length; i++) {
      const ds = viewer.dataSources.get(i);
      for (const entity of ds.entities.values) {
        if (entity.label) {
          hiddenLabels.push({ entity, origShow: entity.label.show });
          entity.label.show = new Cesium.ConstantProperty(false);
        }
      }
    }
    console.log(`[TerrainSwitcher] 隐藏 ${hiddenLabels.length} 个 label`);

    // 2. 插入 loading 遮罩
    const container = viewer.container;
    const overlay = document.createElement("div");
    overlay.className = "cesium-terrain-loading-overlay";
    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;font-size:16px;letter-spacing:1px;user-select:none">' +
      '<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:#2b8cff;border-radius:50%;animation:cesium-terrain-spin 0.8s linear infinite"></div>' +
      "<span>地形加载中...</span></div>";
    container.appendChild(overlay);

    // 让出主线程确保浏览器渲染遮罩
    await new Promise((r) => setTimeout(r, 50));

    try {
      if (mode === "local") {
        showBoundsRect(viewer, Cesium);
        if (!_localProvider) {
          try {
            _localProvider = await Cesium.CesiumTerrainProvider.fromUrl(
              getLocalTerrainUrl(),
              { requestVertexNormals: true, requestWaterMask: false, heightmapTerrainQuality: 1.0 }
            );

            // quantized-mesh encoder 不写 childMask → 固定为 15，Cesium 通过 available 过滤
            const origRequest = _localProvider.requestTileGeometry.bind(_localProvider);
            _localProvider.requestTileGeometry = function (x, y, level, request) {
              const result = origRequest(x, y, level, request);
              const patch = (td) => {
                if (td) {
                  const oldMask = td._childTileMask;
                  if (level < 12) td._childTileMask = 15;
                  console.log(`[地形] L${level}(${x},${y}): childMask ${oldMask}→${td._childTileMask}, upsampled=${td.wasCreatedByUpsampling?.()}, canUpsample=${td.canUpsample}`);
                }
                return td;
              };
              return result && result.then ? result.then(patch) : (result ? patch(result) : undefined);
            };

            // 诊断: 记录 getLevelMaximumGeometricError
            const origGetLevelGE = _localProvider.getLevelMaximumGeometricError.bind(_localProvider);
            _localProvider.getLevelMaximumGeometricError = function (level) {
              const ge = origGetLevelGE(level);
              if (level <= 3) console.log(`[地形] getLevelMaximumGeometricError(L${level}) = ${ge}`);
              return ge;
            };

            // 诊断: 记录 getTileDataAvailable
            const origGetTileData = _localProvider.getTileDataAvailable.bind(_localProvider);
            _localProvider.getTileDataAvailable = function (x, y, level) {
              const result = origGetTileData(x, y, level);
              if (level <= 3) console.log(`[地形] getTileDataAvailable L${level}(${x},${y}) = ${result}`);
              return result;
            };
          } catch (e) {
            console.warn("[TerrainSwitcher] 本地地形加载失败:", e);
            _localProvider = null;
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            currentMode.value = mode;
            // 恢复 label
            for (const { entity, origShow } of hiddenLabels) {
              if (!entity.isDestroyed?.()) {
                entity.label.show = origShow;
              }
            }
            const el = container.querySelector(".cesium-terrain-loading-overlay");
            if (el) el.remove();
            return;
          }
        }
        viewer.terrainProvider = _localProvider;
      } else if (mode === "ion") {
        removeBoundsRect(viewer);
        if (!_ionProvider) {
          _ionProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
            requestVertexNormals: true,
            requestWaterMask: false,
          });
        }
        viewer.terrainProvider = _ionProvider;
      } else if (mode === "none") {
        removeBoundsRect(viewer);
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      }

      currentMode.value = mode;

      // 等待 Cesium 加载地形瓦片
      const delayMs = mode === "ion" ? 2500 : mode === "local" ? 1500 : 300;
      await new Promise((r) => setTimeout(r, delayMs));

      // 通知图层重新采样 entity 地形高度
      viewer.canvas.dispatchEvent(new CustomEvent("cesium-terrain-changed", { detail: { mode } }));
      await new Promise((r) => requestAnimationFrame(r));
    } catch (e) {
      console.warn("[TerrainSwitcher] 切换失败:", e);
    } finally {
      _switching = false;
      // 恢复 label 原始 show 状态
      for (const { entity, origShow } of hiddenLabels) {
        if (!entity.isDestroyed?.()) {
          entity.label.show = origShow;
        }
      }
      // 等一帧让 Cesium 用新地形渲染 label，再移除遮罩
      await new Promise((r) => requestAnimationFrame(r));
      const el = container.querySelector(".cesium-terrain-loading-overlay");
      if (el) el.remove();
    }
  }

  return {
    currentMode,
    currentLabel,
    switchTerrain,
    modes: TERRAIN_MODES,
  };
}
