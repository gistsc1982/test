import * as h from "three";
import { OrbitControls as Ue } from "three/addons/controls/OrbitControls.js";
import { PLYLoader as vt } from "three/addons/loaders/PLYLoader.js";
import { GLTFLoader as He } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader as ze } from "three/addons/loaders/DRACOLoader.js";
import { TransformControls as Oe } from "three/addons/controls/TransformControls.js";
import { Fragment as Ft, createCommentVNode as oe, createElementBlock as q, createElementVNode as z, createVNode as Qe, normalizeClass as ue, normalizeStyle as Dt, openBlock as Z, renderList as Vt, resolveComponent as et, toDisplayString as I, vModelSelect as zt, vShow as be, withDirectives as Fe } from "vue";
var tt = Object.defineProperty, re = (e, t) => () => (e && (t = e(e = 0)), t), bt = (e, t) => {
  let o = {};
  for (var i in e)
    tt(o, i, {
      get: e[i],
      enumerable: !0
    });
  return t || tt(o, Symbol.toStringTag, { value: "Module" }), o;
}, ie, J, ne = [], ve, Ve;
function Le() {
  if (typeof window < "u" && window.localStorage) {
    const e = localStorage.getItem("devMode");
    if (e === "true") return !0;
    if (e === "false") return !1;
  }
  if (typeof window < "u" && window.location) {
    const e = window.location.hostname;
    return e === "localhost" || e === "127.0.0.1" || !e.includes(".");
  }
  return !1;
}
function ce() {
  if (ve = requestAnimationFrame(ce), !J || !ie) return;
  const e = window.devicePixelRatio, t = Math.round(ie.clientWidth * e), o = Math.round(ie.clientHeight * e);
  (ie.width !== t || ie.height !== o) && J.setSize(t, o, !1);
  const i = ie.getBoundingClientRect();
  if (ne.length > 1 && ne.some((n, r) => {
    if (!n.element) return !1;
    for (let a = r + 1; a < ne.length; a++) {
      if (!ne[a].element) continue;
      const s = n.element.getBoundingClientRect(), c = ne[a].element.getBoundingClientRect();
      if (!(s.right < c.left || s.left > c.right || s.bottom < c.top || s.top > c.bottom)) return !0;
    }
    return !1;
  }), J.setScissorTest(!1), J.clear(!0, !1, !1), typeof window < "u" && window.__dualCanvasViewer) {
    const n = window.__dualCanvasViewer;
    n && typeof n.protectLargeCoordCameraPosition == "function" && n.protectLargeCoordCameraPosition();
  }
  ce.frameCount || (ce.frameCount = 0), ce.frameCount++, Le() && ce.frameCount % 6e3 === 0 && console.log("[rendererManager] 渲染循环调试信息:", {
    frameCount: ce.frameCount,
    sceneCount: ne.length,
    scenes: ne.map((n, r) => {
      let a = null;
      if (n.element) {
        const s = n.element.getBoundingClientRect(), c = window.getComputedStyle(n.element);
        a = {
          rect: `top:${s.top.toFixed(0)} left:${s.left.toFixed(0)} w:${s.width.toFixed(0)} h:${s.height.toFixed(0)}`,
          display: c.display,
          visibility: c.visibility,
          opacity: c.opacity,
          zIndex: c.zIndex,
          pointerEvents: c.pointerEvents,
          inViewport: s.bottom > 0 && s.top < window.innerHeight && s.right > 0 && s.left < window.innerWidth
        };
      }
      return {
        index: r,
        opacity: n.opacity ?? 1,
        isTransparent: (n.opacity ?? 1) < 1,
        hasScene: !!n.scene,
        objectCount: n.scene ? n.scene.children.length : 0,
        cameraNear: n.camera ? n.camera.near : null,
        cameraFar: n.camera ? n.camera.far : null,
        cameraPos: n.camera ? `(${n.camera.position.x.toFixed(0)}, ${n.camera.position.y.toFixed(0)}, ${n.camera.position.z.toFixed(0)})` : null,
        visibleMeshes: n.scene ? n.scene.children.filter((s) => s.visible && s.type === "Mesh").length : 0,
        element: a
      };
    })
  }), [...ne].sort((n, r) => {
    const a = n.opacity ?? 1;
    return (r.opacity ?? 1) - a;
  }).forEach((n, r) => {
    const { element: a, scene: s, camera: c, controls: l, animationUpdate: g, opacity: u } = n;
    if (!a) return;
    g && g();
    const d = a.getBoundingClientRect();
    if (!(d.bottom > 0 && d.top < window.innerHeight && d.right > 0 && d.left < window.innerWidth)) return;
    const m = {
      left: Math.max(d.left, i.left),
      right: Math.min(d.right, i.right),
      top: Math.max(d.top, i.top),
      bottom: Math.min(d.bottom, i.bottom)
    }, p = m.right - m.left, x = m.bottom - m.top;
    if (p <= 0 || x <= 0) return;
    Le() && ce.frameCount % 6e3 === 0 && console.log(`[rendererManager] 场景 ${r} 渲染信息:`, {
      elementClass: a.className,
      elementRect: `top:${d.top.toFixed(0)} left:${d.left.toFixed(0)} w:${d.width.toFixed(0)} h:${d.height.toFixed(0)}`,
      viewport: `x:${f.toFixed(0)} y:${C.toFixed(0)} w:${M.toFixed(0)} h:${y.toFixed(0)}`,
      sceneName: s.name || "unnamed",
      sceneChildren: s.children.length,
      modelGroupChildren: s.children.filter((T) => T.type === "Group" && T.name && T.name.includes("modelGroup")).map((T) => ({
        name: T.name,
        children: T.children.length
      })),
      opacity: w,
      isTransparent: V
    });
    const f = (m.left - i.left) * e, C = (i.bottom - m.bottom) * e, M = p * e, y = x * e;
    J.setViewport(f, C, M, y), c.aspect = p / x, c.updateProjectionMatrix(), l && l.update();
    const w = u ?? 1, V = w < 1;
    V || J.clearDepth(), s.traverse((T) => {
      T.isMesh && T.material && (Array.isArray(T.material) ? T.material : [T.material]).forEach((v) => {
        v.userData._hasOriginalStateSaved || (v.userData.originalTransparent = v.transparent, v.userData.originalOpacity = v.opacity, v.userData._hasOriginalStateSaved = !0), V ? (v.transparent = !0, v.opacity = w, v.depthWrite = !1, v.depthTest = !0) : (v.userData.hasOwnProperty("originalTransparent") && (v.transparent = v.userData.originalTransparent), v.userData.hasOwnProperty("originalOpacity") && (v.opacity = v.userData.originalOpacity), v.depthWrite = !0, v.depthTest = !0), v.needsUpdate = !0;
      });
    });
    const S = Math.abs(c.position.x) > 1e4 || Math.abs(c.position.z) > 1e4;
    if (S) {
      (!isFinite(c.position.x) || !isFinite(c.position.y) || !isFinite(c.position.z)) && (console.warn("[rendererManager] ⚠️ 相机位置溢出，重置为安全位置"), c.position.set(0, 0, 100));
      const T = c.projectionMatrix;
      if (T && T.elements) {
        let v = !1;
        for (let D = 0; D < T.elements.length; D++) if (!isFinite(T.elements[D]) || Math.abs(T.elements[D]) > 1e10) {
          v = !0;
          break;
        }
        v && (console.warn("[rendererManager] ⚠️ 投影矩阵溢出，重新计算"), c.near = 0.1, c.far = 1e4, c.updateProjectionMatrix());
      }
    }
    if (Le() && S && r === 0 && ce.frameCount % 6e3 === 0 && (ce._lastDebugFrame = ce.frameCount, console.log(`[rendererManager] 🔍 大坐标场景模型可见性检查 (帧${ce.frameCount}, 场景${r}):`), s.traverse((T) => {
      if (T.isMesh && T.visible) {
        const v = new h.Box3().setFromObject(T).getCenter(new h.Vector3()), D = c.position.distanceTo(v), _ = v.clone().project(c), b = D >= c.near && D <= c.far, E = _.x >= -1 && _.x <= 1 && _.y >= -1 && _.y <= 1 && _.z >= -1 && _.z <= 1;
        console.log(`[rendererManager]  - ${T.name || T.parent?.userData?.fileName || "unnamed"}:`, {
          中心位置: `(${v.x.toFixed(0)}, ${v.y.toFixed(0)}, ${v.z.toFixed(0)})`,
          距离: D.toFixed(2) + "m",
          near: c.near.toFixed(2),
          far: c.far.toFixed(2),
          在范围内: b ? "✅" : "❌",
          NDC: `(${_.x.toFixed(3)}, ${_.y.toFixed(3)}, ${_.z.toFixed(3)})`,
          在视锥体内: E ? "✅" : "❌",
          材质: T.material?.type,
          可见: T.visible
        }), (!b || !E) && console.warn("[rendererManager] ⚠️ 模型不可见:", {
          原因: b ? "NDC 超出视锥体" : "距离超出 near/far 范围",
          距离: D.toFixed(2),
          near: c.near.toFixed(2),
          far: c.far.toFixed(2),
          NDC: `(${_.x.toFixed(3)}, ${_.y.toFixed(3)}, ${_.z.toFixed(3)})`
        });
      }
    })), J.render(s, c), ce.frameCount <= 10) {
      const T = s.children.length, v = s.children.filter((D) => D.type === "Mesh" || D.type === "Group").length;
      console.log(`[rendererManager] 帧 ${ce.frameCount}: 渲染场景 ${r}`, {
        opacity: w,
        isTransparent: V,
        objectCount: T,
        meshCount: v,
        cameraPos: c.position.toArray().map((D) => D.toFixed(2)),
        viewport: {
          vpLeft: f,
          vpBottom: C,
          vpWidth: M,
          vpHeight: y
        }
      });
    }
  }), J.setScissorTest(!1);
}
var fe = {
  init(e) {
    if (J) return;
    ie = e, ie.style.position = "fixed", ie.style.top = "0", ie.style.left = "0", ie.style.width = "100vw", ie.style.height = "100vh", ie.style.zIndex = "1", ie.style.pointerEvents = "none", J = new h.WebGLRenderer({
      canvas: ie,
      alpha: !0,
      antialias: !0,
      powerPreference: "high-performance",
      logarithmicDepthBuffer: !0,
      preserveDrawingBuffer: !0
    }), J.setPixelRatio(window.devicePixelRatio), J.setClearColor(0, 0);
    const t = J.render.bind(J);
    J.render = function(n, r) {
      const a = this.getContext();
      return a && (n && n.traverse((c) => {
        if (c.isMesh || c.isGroup) {
          const l = c.position;
          Math.abs(l.x) > 1e4 || Math.abs(l.z) > 1e4;
        }
      }), a.depthFunc(515)), t(n, r);
    };
    const o = J.getContext();
    if (o) {
      o.enable(o.DEPTH_TEST), o.depthMask(!0), o.depthRange(0, 1);
      const n = 515;
      o.depthFunc.bind(o);
      const r = {
        512: "NEVER",
        513: "LESS",
        514: "LEQUAL",
        515: "GREATER",
        516: "GEQUAL",
        517: "EQUAL",
        518: "NOTEQUAL",
        519: "ALWAYS"
      };
      o.depthFunc(n), console.log("[rendererManager] ✅ 深度函数已强制设置为 GREATER（与 Cesium 兼容）");
      const a = o.disable.bind(o);
      o.disable = function(u) {
        if (u === o.DEPTH_TEST) {
          console.warn("[rendererManager] ⚠️ 拦截到禁用深度测试的尝试，已阻止");
          return;
        }
        return a.call(this, u);
      };
      const s = o.getParameter(o.DEPTH_FUNC), c = o.getParameter(o.DEPTH_TEST), l = o.getParameter(o.DEPTH_WRITEMASK);
      console.log("[rendererManager] WebGL状态:", {
        depthFunc: `${s} (${r[s]})`,
        depthTest: c,
        depthMask: l
      }), (s === 514 || s === 515) && c && l ? console.log("[rendererManager] ✅ 深度设置正确（depthTest启用）") : console.warn("[rendererManager] ⚠️ 深度设置异常，将在渲染循环中持续修复");
      const g = () => {
        const u = o.getParameter(o.DEPTH_FUNC), d = o.getParameter(o.DEPTH_TEST), m = o.getParameter(o.DEPTH_WRITEMASK), p = u === 514 || u === 515;
        return !p || !d || !m ? (o.enable(o.DEPTH_TEST), p || o.depthFunc(515), o.depthMask(!0), !0) : !1;
      };
      g() && console.warn("[rendererManager] ⚠️ 初始化后检测到深度设置异常，已修复"), typeof window < "u" && (window.__ensureWebGLDepthSettings = g);
    }
    const i = o && o.getParameter && o.getParameter(o.UNMASKED_RENDERER_WEBGL) ? !!o.getExtension("EXT_frag_depth") : !1;
    if (console.log("[rendererManager] WebGLRenderer 已创建:", {
      logarithmicDepthBuffer: "❌ 已禁用（设置项: false）",
      hasEXT_frag_depth: i,
      rendererInfo: J ? "✅ 已创建" : "❌ 未创建"
    }), console.log("[rendererManager] ⚠️ 对数深度缓冲区已禁用（创建参数: logarithmicDepthBuffer: false）"), ie.addEventListener("webglcontextlost", (n) => {
      console.error("WebGL context lost:", n), n.preventDefault();
    }), ie.addEventListener("webglcontextrestored", (n) => {
      console.log("WebGL context restored:", n);
    }), o && o.getParameter) {
      const n = () => {
        try {
          const r = o.getExtension("WEBGL_debug_renderer_info");
          if (r) {
            const g = o.getParameter(r.UNMASKED_VENDOR_WEBGL), u = o.getParameter(r.UNMASKED_RENDERER_WEBGL);
            console.log("WebGL Renderer Info:", {
              vendor: g,
              renderer: u
            });
          }
          const a = o.getParameter(o.MAX_TEXTURE_IMAGE_UNITS), s = o.getParameter(o.ACTIVE_TEXTURE);
          console.log("Texture Units:", {
            max: a,
            activeTexture: s
          });
          const c = o.getParameter(o.ARRAY_BUFFER_BINDING), l = o.getParameter(o.ELEMENT_ARRAY_BUFFER_BINDING);
          console.log("Buffer Bindings:", {
            arrayBuffer: c,
            elementArrayBuffer: l
          });
        } catch (r) {
          console.warn("Error checking WebGL resource usage:", r);
        }
      };
      Ve = setInterval(n, 12e4), setTimeout(n, 1e3);
    }
    ve && cancelAnimationFrame(ve), ce(), this.pendingScenes && this.pendingScenes.length > 0 && (console.log(`Adding ${this.pendingScenes.length} pending scenes...`), this.pendingScenes.forEach((n) => {
      ne.find((r) => r.scene === n.scene) || ne.push(n);
    }), this.pendingScenes = []);
  },
  addScene(e) {
    if (console.log("[rendererManager] addScene called, renderer:", !!J, "canvas:", !!ie), !J || !ie) {
      console.warn("rendererManager not initialized yet. Scene will be added after init."), this.pendingScenes || (this.pendingScenes = []), this.pendingScenes.push(e);
      return;
    }
    e.opacity === void 0 && (e.opacity = 1), e.scene && e.scene.traverse((t) => {
      t.isMesh && t.material && (Array.isArray(t.material) ? t.material : [t.material]).forEach((o) => {
        o.userData._hasOriginalStateSaved || (o.userData.originalTransparent = o.transparent, o.userData.originalOpacity = o.opacity, o.userData._hasOriginalStateSaved = !0);
      });
    }), ne.find((t) => t.scene === e.scene) || (ne.push(e), console.log("[rendererManager] Scene added, total scenes:", ne.length));
  },
  setSceneOpacity(e, t) {
    const o = ne.find((i) => i.scene === e);
    o ? (o.opacity = Math.max(0, Math.min(1, t)), console.log(`[rendererManager] Scene opacity set to: ${o.opacity}`)) : console.warn("[rendererManager] Scene not found:", e);
  },
  getSceneOpacity(e) {
    const t = ne.find((o) => o.scene === e);
    return t ? t.opacity : 1;
  },
  removeScene(e) {
    ne = ne.filter((t) => t.scene !== e);
  },
  getDebugInfo() {
    return {
      hasRenderer: !!J,
      hasCanvas: !!ie,
      sceneCount: ne.length,
      scenes: ne.map((e, t) => ({
        index: t,
        hasScene: !!e.scene,
        hasCamera: !!e.camera,
        hasControls: !!e.controls,
        sceneChildren: e.scene ? e.scene.children.length : 0,
        cameraPosition: e.camera ? e.camera.position.toArray() : null,
        controlsTarget: e.controls ? e.controls.target.toArray() : null,
        visible: e.scene ? e.scene.children.filter((o) => o.visible && o.type === "Mesh").length : 0
      })),
      rendererInfo: J ? {
        logarithmicDepthBuffer: J.capabilities.isLogarithmicDepthBuffer,
        pixelRatio: J.getPixelRatio(),
        size: J.getSize(new h.Vector2()).toArray()
      } : null
    };
  },
  getScenes() {
    return ne;
  },
  getRenderer() {
    return J;
  },
  dispose() {
    ve && cancelAnimationFrame(ve), Ve && (clearInterval(Ve), Ve = null), J && (J.dispose(), J = null), ne = [], ie = null;
  }
}, St = class {
  constructor() {
    this.width = 0, this.height = 0, this.left = 0, this.top = 0, this.worldScale = 1, this._containers = [], this._dirty = !0;
  }
  registerContainer(e) {
    if (!e) {
      console.warn("[VirtualViewport] 尝试注册空容器");
      return;
    }
    this._containers.includes(e) || (this._containers.push(e), this._dirty = !0, console.log("[VirtualViewport] 注册容器:", e.className || e.tagName));
  }
  unregisterContainer(e) {
    const t = this._containers.indexOf(e);
    t !== -1 && (this._containers.splice(t, 1), this._dirty = !0, console.log("[VirtualViewport] 注销容器:", e.className || e.tagName));
  }
  update() {
    if (!this._dirty && this.width > 0 && this.height > 0) return;
    if (this._containers.length === 0) {
      console.warn("[VirtualViewport] 没有注册的容器，使用窗口尺寸"), this.width = window.innerWidth, this.height = window.innerHeight, this.left = 0, this.top = 0;
      return;
    }
    let e = 0, t = 0, o = 1 / 0, i = 1 / 0;
    for (const a of this._containers) {
      const s = a.getBoundingClientRect();
      e = Math.max(e, s.width), t = Math.max(t, s.height), o = Math.min(o, s.left), i = Math.min(i, s.top);
    }
    const n = this.width, r = this.height;
    this.width = e, this.height = t, this.left = o, this.top = i, this._dirty = !1, (n !== this.width || r !== this.height) && console.log("[VirtualViewport] 更新尺寸:", {
      width: this.width,
      height: this.height,
      left: this.left,
      top: this.top,
      containers: this._containers.length
    });
  }
  markDirty() {
    this._dirty = !0;
  }
  getBounds() {
    return this.update(), {
      left: this.left,
      top: this.top,
      width: this.width,
      height: this.height
    };
  }
  getCenter() {
    return this.update(), {
      x: this.left + this.width / 2,
      y: this.top + this.height / 2
    };
  }
  contains(e, t) {
    return this.update(), e >= this.left && e <= this.left + this.width && t >= this.top && t <= this.top + this.height;
  }
}, Tt = class {
  constructor(e) {
    this.virtualViewport = e, this.EPSG3857 = {
      radius: 6378137,
      maxLatitude: 85.0511287798,
      originShift: 2 * Math.PI * 6378137 / 2
    }, this.worldScaleFactor = 1 / 1e3;
  }
  setWorldScaleFactor(e) {
    this.worldScaleFactor = e, this.virtualViewport.worldScale = 1 / e, console.log("[CoordinateConverter] 设置世界缩放因子:", e);
  }
  setCesiumSyncManager(e) {
    this._cesiumSyncManager = e, console.log("[CoordinateConverter] Cesium SyncManager 已设置"), e && e.scale !== void 0 && (this.setWorldScaleFactor(1 / e.scale), console.log("[CoordinateConverter] 使用 SyncManager 的缩放比例:", e.scale));
  }
  getCesiumSyncManager() {
    return this._cesiumSyncManager ? this._cesiumSyncManager : typeof window < "u" && window.__syncManager__ ? window.__syncManager__ : null;
  }
  setENUManager(e) {
    this._enuManager = e, console.log("[CoordinateConverter] ENU 坐标管理器已设置"), e && e.scale !== void 0 && (this.setWorldScaleFactor(1 / e.scale), console.log("[CoordinateConverter] 使用 ENU 坐标系的缩放比例:", e.scale));
  }
  getENUManager() {
    return this._enuManager ? this._enuManager : typeof window < "u" && window.__enuCoordinateManager__ ? window.__enuCoordinateManager__ : null;
  }
  isUsingENU() {
    const e = this.getENUManager();
    return e && e.isInitialized && e.isInitialized();
  }
  screenToViewportNDC(e, t) {
    let o = this.virtualViewport.getBounds();
    (o.width === 0 || o.height === 0) && (console.warn("[CoordinateConverter] 虚拟视口尺寸无效，强制重新计算"), this.virtualViewport.markDirty(), o = this.virtualViewport.getBounds()), (o.width === 0 || o.height === 0) && (console.warn("[CoordinateConverter] 虚拟视口仍然无效，使用窗口尺寸作为降级方案"), o.width = window.innerWidth, o.height = window.innerHeight, o.left = 0, o.top = 0);
    const i = e - o.left, n = t - o.top, r = i / o.width * 2 - 1, a = -(n / o.height) * 2 + 1;
    return !isFinite(r) || !isFinite(a) ? (console.error("[CoordinateConverter] 坐标转换结果无效:", {
      screenX: e,
      screenY: t,
      bounds: o,
      ndcX: r,
      ndcY: a
    }), {
      x: 0,
      y: 0
    }) : {
      x: r,
      y: a
    };
  }
  viewportNDCToScreen(e, t) {
    const o = this.virtualViewport.getBounds(), i = (e + 1) / 2 * o.width, n = (-t + 1) / 2 * o.height;
    return {
      x: i + o.left,
      y: n + o.top
    };
  }
  viewportNDCToWorld(e, t, o = 0.5, i) {
    if (!i)
      return console.warn("[CoordinateConverter] camera 参数为空，返回原点"), new h.Vector3(0, 0, 0);
    i.updateMatrixWorld(!0), i.updateProjectionMatrix();
    const n = new h.Vector3(e, t, o);
    if (n.unproject(i), typeof window < "u" && window.__viewportNDCToWorldDebug__) {
      const r = {
        timestamp: Date.now(),
        ndc: {
          x: e,
          y: t,
          z: o
        },
        world: {
          x: n.x,
          y: n.y,
          z: n.z
        },
        cameraPosition: {
          x: i.position.x,
          y: i.position.y,
          z: i.position.z
        }
      };
      window.__viewportNDCToWorldDebug__.push(r), window.__viewportNDCToWorldDebug__.length > 100 && window.__viewportNDCToWorldDebug__.shift();
    }
    return n;
  }
  worldToViewportNDC(e, t) {
    if (!t)
      return console.warn("[CoordinateConverter] camera 参数为空，返回中心 NDC"), {
        x: 0,
        y: 0
      };
    t.updateMatrixWorld(!0), t.updateProjectionMatrix();
    const o = e.clone();
    return o.project(t), {
      x: o.x,
      y: o.y
    };
  }
  worldToScreen(e, t) {
    const o = this.worldToViewportNDC(e, t);
    return this.viewportNDCToScreen(o.x, o.y);
  }
  lonLatToWebMercator(e, t) {
    const { radius: o, maxLatitude: i, originShift: n } = this.EPSG3857, r = Math.max(Math.min(t, i), -i), a = e * Math.PI / 180, s = r * Math.PI / 180, c = a * o, l = Math.log(Math.tan(Math.PI / 4 + s / 2)) * o;
    return {
      x: c + n,
      y: l + n
    };
  }
  webMercatorToLonLat(e, t) {
    const { radius: o, originShift: i } = this.EPSG3857, n = e - i, r = t - i, a = n / o, s = 2 * (Math.atan(Math.exp(r / o)) - Math.PI / 4);
    return {
      longitude: a * 180 / Math.PI,
      latitude: s * 180 / Math.PI
    };
  }
  webMercatorToWorld(e, t, o = 0) {
    const i = this.getCesiumSyncManager();
    if (i && i.floorCenterMercator && i.mercatorToThree) {
      const { originShift: s } = this.EPSG3857, c = e - s, l = t - s, g = i.mercatorToThree(c, l, o);
      return new h.Vector3(g.x, g.y, g.z);
    }
    const { originShift: n } = this.EPSG3857, r = e - n, a = t - n;
    return new h.Vector3(r * this.worldScaleFactor, o * this.worldScaleFactor, -a * this.worldScaleFactor);
  }
  worldToWebMercator(e) {
    const t = this.getCesiumSyncManager();
    if (t && t.floorCenterMercator && t.threeToMercator) {
      const a = t.threeToMercator(e.x, e.y, e.z), { originShift: s } = this.EPSG3857;
      return {
        x: a.x + s,
        y: a.y + s,
        altitude: a.z
      };
    }
    const { originShift: o } = this.EPSG3857, i = e.x / this.worldScaleFactor, n = -e.z / this.worldScaleFactor, r = e.y / this.worldScaleFactor;
    return {
      x: i + o,
      y: n + o,
      altitude: r
    };
  }
  lonLatToWorld(e, t, o = 0) {
    const i = this.lonLatToWebMercator(e, t);
    return this.webMercatorToWorld(i.x, i.y, o);
  }
  worldToLonLat(e) {
    const t = this.worldToWebMercator(e);
    return this.webMercatorToLonLat(t.x, t.y);
  }
  screenDistance(e, t, o) {
    const i = this.worldToScreen(e, o), n = this.worldToScreen(t, o), r = n.x - i.x, a = n.y - i.y;
    return Math.sqrt(r * r + a * a);
  }
  getDebugInfo() {
    return {
      virtualViewport: {
        width: this.virtualViewport.width,
        height: this.virtualViewport.height,
        left: this.virtualViewport.left,
        top: this.virtualViewport.top
      },
      worldScaleFactor: this.worldScaleFactor,
      EPSG3857: this.EPSG3857
    };
  }
}, _t = class {
  constructor(e, t) {
    this.id = e, this.camera = t.camera || null, this.scene = t.scene || null, this.container = t.container || null, this.raycaster = t.raycaster || null, this.mouseVector = t.mouseVector || new h.Vector2(), this.controls = t.controls || null, this.modelGroup = t.modelGroup || null, this.selectedModel = null, this.transformControls = null;
  }
  update(e) {
    e.camera !== void 0 && (this.camera = e.camera), e.scene !== void 0 && (this.scene = e.scene), e.container !== void 0 && (this.container = e.container), e.raycaster !== void 0 && (this.raycaster = e.raycaster), e.mouseVector !== void 0 && (this.mouseVector = e.mouseVector), e.controls !== void 0 && (this.controls = e.controls), e.modelGroup !== void 0 && (this.modelGroup = e.modelGroup), e.selectedModel !== void 0 && (this.selectedModel = e.selectedModel), e.transformControls !== void 0 && (this.transformControls = e.transformControls);
  }
  isReady() {
    return !!(this.camera && this.scene && this.container);
  }
  getModels() {
    return this.modelGroup ? this.modelGroup.children || [] : [];
  }
}, Et = class {
  constructor() {
    this.virtualViewport = new St(), this.converter = new Tt(this.virtualViewport), this.layers = /* @__PURE__ */ new Map(), this._windowResizeHandler = null, this._setupWindowResizeListener();
  }
  _setupWindowResizeListener() {
    this._windowResizeHandler = () => {
      this.virtualViewport.markDirty(), console.log("[UnifiedViewportManager] 窗口大小变化，标记虚拟视口为脏");
    }, window.addEventListener("resize", this._windowResizeHandler);
  }
  registerLayer(e, t) {
    if (!e)
      return console.error("[UnifiedViewportManager] 层 ID 不能为空"), !1;
    if (!t)
      return console.error("[UnifiedViewportManager] 层配置不能为空"), !1;
    let o = this.layers.get(e);
    return o ? (o.update(t), console.log("[UnifiedViewportManager] 更新层:", e)) : (o = new _t(e, t), this.layers.set(e, o), console.log("[UnifiedViewportManager] 注册新层:", e)), t.container && this.virtualViewport.registerContainer(t.container), this.virtualViewport.update(), !0;
  }
  unregisterLayer(e) {
    const t = this.layers.get(e);
    return t ? (t.container && this.virtualViewport.unregisterContainer(t.container), this.layers.delete(e), console.log("[UnifiedViewportManager] 注销层:", e), !0) : (console.warn("[UnifiedViewportManager] 层不存在:", e), !1);
  }
  getLayer(e) {
    return this.layers.get(e) || null;
  }
  hasLayer(e) {
    return this.layers.has(e);
  }
  getLayerIds() {
    return Array.from(this.layers.keys());
  }
  updateViewportSize() {
    this.virtualViewport.markDirty(), this.virtualViewport.update();
  }
  screenToViewportNDC(e, t) {
    return this.converter.screenToViewportNDC(e, t);
  }
  updateLayerMouse(e, t, o) {
    const i = this.getLayer(e);
    if (!i || !i.mouseVector)
      return console.warn("[UnifiedViewportManager] 层不存在或没有鼠标向量:", e), !1;
    const n = this.screenToViewportNDC(t, o);
    return i.mouseVector.x = n.x, i.mouseVector.y = n.y, !0;
  }
  raycast(e, t, o, i = {}) {
    const { filterHelpers: n = !0, updateMatrix: r = !0 } = i, a = this.getLayer(e);
    if (!a)
      return console.warn("[UnifiedViewportManager] 层不存在:", e), [];
    if (!a.isReady())
      return console.warn("[UnifiedViewportManager] 层未准备好:", e), [];
    if (!a.raycaster)
      return console.warn("[UnifiedViewportManager] 层没有射线检测器:", e), [];
    const s = a.getModels();
    if (s.length === 0)
      return console.log("[UnifiedViewportManager] 层没有模型:", e), [];
    r && a.modelGroup && a.modelGroup.updateMatrixWorld(!0);
    const c = this.screenToViewportNDC(t, o);
    a.raycaster.setFromCamera(c, a.camera), a.raycaster.params.Line.threshold = 1, a.raycaster.params.Points.threshold = 1;
    let l = a.raycaster.intersectObjects(s, !0);
    return n && (l = l.filter((g) => {
      const u = g.object;
      return !(u.type === "TransformControls" || u.type === "TransformControlsPlane" || u.name && u.name.includes("TransformControls") || u.isHelper || u.isLine);
    })), console.log("[UnifiedViewportManager] 射线检测:", e, "结果:", l.length), l;
  }
  raycastMultiple(e, t, o, i = {}) {
    for (const n of e) {
      const r = this.raycast(n, t, o, i);
      if (r.length > 0) return {
        layerId: n,
        intersects: r
      };
    }
    return {
      layerId: null,
      intersects: []
    };
  }
  syncCameras(e, t, o = {}) {
    const { syncPosition: i = !0, syncRotation: n = !0, syncZoom: r = !0, syncProjection: a = !1 } = o, s = this.getLayer(e);
    if (!s || !s.camera) {
      console.warn("[UnifiedViewportManager] 源层不存在或没有相机:", e);
      return;
    }
    const c = s.camera;
    for (const l of t) {
      const g = this.getLayer(l);
      if (!g || !g.camera) continue;
      const u = g.camera;
      i && u.position.copy(c.position), n && (u.rotation.copy(c.rotation), u.quaternion.copy(c.quaternion)), r && u.zoom !== void 0 && (u.zoom = c.zoom), a && u.projectionMatrix.copy(c.projectionMatrix), u.updateMatrixWorld(!0), g.controls && g.controls.update();
    }
    console.log("[UnifiedViewportManager] 同步相机:", e, "→", t);
  }
  placeModelAtLocation(e, t, o, i = 0) {
    const n = this.converter.lonLatToWorld(t, o, i);
    e.position.copy(n), console.log("[UnifiedViewportManager] 放置模型到地理位置:", {
      longitude: t,
      latitude: o,
      altitude: i
    }, "→", n);
  }
  getModelLocation(e) {
    return this.converter.worldToLonLat(e.position);
  }
  setCesiumSyncManager(e, t = null) {
    if (!e) {
      console.warn("[UnifiedViewportManager] SyncManager 为空，无法设置");
      return;
    }
    this.converter.setCesiumSyncManager(e), t && e.setFloorCenter(t), console.log("[UnifiedViewportManager] Cesium SyncManager 已集成到统一视口管理器");
  }
  getCesiumSyncManager() {
    return this.converter.getCesiumSyncManager();
  }
  hasCesiumIntegration() {
    const e = this.getCesiumSyncManager();
    return !!(e && e.floorCenterMercator);
  }
  setENUManager(e) {
    this.converter.setENUManager(e), console.log("[UnifiedViewportManager] ENU 坐标管理器已注册到虚拟视口");
  }
  getENUManager() {
    return this.converter.getENUManager();
  }
  isUsingENU() {
    return this.converter.isUsingENU();
  }
  getDebugInfo() {
    const e = this.getENUManager();
    return {
      virtualViewport: {
        width: this.virtualViewport.width,
        height: this.virtualViewport.height,
        left: this.virtualViewport.left,
        top: this.virtualViewport.top,
        containers: this.virtualViewport._containers.length
      },
      layers: Array.from(this.layers.keys()),
      converter: this.converter.getDebugInfo(),
      enu: {
        enabled: this.isUsingENU(),
        hasManager: !!e,
        originInfo: e && e.getOriginInfo ? e.getOriginInfo() : null
      }
    };
  }
  dispose() {
    this._windowResizeHandler && (window.removeEventListener("resize", this._windowResizeHandler), this._windowResizeHandler = null), this.layers.clear(), console.log("[UnifiedViewportManager] 已销毁");
  }
}, ot = new Et();
typeof window < "u" && (window.__viewportNDCToWorldDebug__ = window.__viewportNDCToWorldDebug__ || []);
var Ce = {
  UNIFIED_EUS: "UNIFIED_EUS",
  MERCATOR_ENU: "MERCATOR_ENU",
  ECEF: "ECEF",
  THREEJS: "THREEJS"
}, lt = {
  [Ce.UNIFIED_EUS]: {
    name: "统一坐标系（State坐标系）",
    shortName: "State/EUS",
    axes: {
      x: "东（East）",
      y: "天（Up/Sky）",
      z: "南（South）"
    },
    description: "用于 unifiedCameraState.direction，方向向量的标准坐标系",
    handedness: "right-handed"
  },
  [Ce.MERCATOR_ENU]: {
    name: "墨卡托坐标系（ENU）",
    shortName: "Mercator/ENU",
    axes: {
      x: "东（East）",
      y: "北（North）",
      z: "天（Up）"
    },
    description: "标准的墨卡托投影坐标系，与地理坐标系对应",
    handedness: "right-handed"
  },
  [Ce.ECEF]: {
    name: "地心地固坐标系",
    shortName: "ECEF",
    axes: {
      x: "穿过本初子午线",
      y: "穿过东经90度",
      z: "穿过北极"
    },
    description: "Cesium 使用的3D笛卡尔坐标系",
    handedness: "right-handed"
  },
  [Ce.THREEJS]: {
    name: "Three.js 默认坐标系",
    shortName: "Three.js",
    axes: {
      x: "右",
      y: "上",
      z: "观察方向"
    },
    description: "Three.js 场景的标准坐标系",
    handedness: "right-handed"
  }
}, $e = class {
  static unifiedEUSToMercatorENU(e) {
    return e ? !isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z) ? (console.error("[DirectionConverter] unifiedEUSToMercatorENU: 输入包含无效值", e), {
      x: 0,
      y: -1,
      z: 0
    }) : {
      x: e.x,
      y: -e.z,
      z: e.y
    } : (console.error("[DirectionConverter] unifiedEUSToMercatorENU: 输入为空"), {
      x: 0,
      y: -1,
      z: 0
    });
  }
  static mercatorENUToUnifiedEUS(e) {
    return e ? !isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z) ? (console.error("[DirectionConverter] mercatorENUToUnifiedEUS: 输入包含无效值", e), {
      x: 0,
      y: -0.866,
      z: -0.5
    }) : {
      x: e.x,
      y: e.z,
      z: -e.y
    } : (console.error("[DirectionConverter] mercatorENUToUnifiedEUS: 输入为空"), {
      x: 0,
      y: -0.866,
      z: -0.5
    });
  }
  static isValidDirection(e) {
    if (!e || typeof e.x != "number" || typeof e.y != "number" || typeof e.z != "number" || !isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z)) return !1;
    const t = Math.sqrt(e.x ** 2 + e.y ** 2 + e.z ** 2);
    return t < 1e-4 ? (console.warn(`[DirectionConverter] 方向向量长度接近零: ${t}`), !1) : !0;
  }
  static formatForDebug(e, t) {
    if (!e) return "null";
    const o = lt[t];
    return `(${o ? o.shortName : t}) [${e.x.toFixed(3)}, ${e.y.toFixed(3)}, ${e.z.toFixed(3)}]`;
  }
};
function Pt(e) {
  if (!e) {
    console.error("[enhanceUnifiedStateWithCoordinateSystem] unifiedState 为空");
    return;
  }
  e._directionCoordinateSystem = Ce.UNIFIED_EUS, e.directionToMercatorENU = function() {
    return this._directionCoordinateSystem !== Ce.UNIFIED_EUS && console.warn(`[unifiedState.directionToMercatorENU] 当前坐标系不是 UNIFIED_EUS，而是: ${this._directionCoordinateSystem}`), $e.unifiedEUSToMercatorENU(this.direction);
  }, e.directionFromMercatorENU = function(t) {
    return this._directionCoordinateSystem !== Ce.UNIFIED_EUS && console.warn(`[unifiedState.directionFromMercatorENU] 当前坐标系不是 UNIFIED_EUS，而是: ${this._directionCoordinateSystem}`), $e.mercatorENUToUnifiedEUS(t);
  }, e.validateDirection = function() {
    return $e.isValidDirection(this.direction);
  }, e.getCoordinateSystemInfo = function() {
    return lt[this._directionCoordinateSystem] || null;
  }, console.log("[enhanceUnifiedStateWithCoordinateSystem] unifiedCameraState 已增强方向向量坐标系功能:", {
    coordinateSystem: e._directionCoordinateSystem,
    info: e.getCoordinateSystemInfo()?.name
  });
}
var le = 6378137, it = 20037508, Ae = -5e3, Re = 1e5, nt = class {
  static normalize(e) {
    if (!e || typeof e.x != "number" || typeof e.y != "number" || typeof e.z != "number") return {
      x: 0,
      y: 1,
      z: 0
    };
    if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z)) return {
      x: 0,
      y: 1,
      z: 0
    };
    const t = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    return t < 1e-4 ? {
      x: 0,
      y: 1,
      z: 0
    } : {
      x: e.x / t,
      y: e.y / t,
      z: e.z / t
    };
  }
  static cross(e, t) {
    return {
      x: e.y * t.z - e.z * t.y,
      y: e.z * t.x - e.x * t.z,
      z: e.x * t.y - e.y * t.x
    };
  }
  static dot(e, t) {
    return e.x * t.x + e.y * t.y + e.z * t.z;
  }
  static rotateAroundAxis(e, t, o) {
    const i = Math.cos(o), n = Math.sin(o), r = this.cross(t, e), a = this.dot(t, e);
    return {
      x: e.x * i + r.x * n + t.x * a * (1 - i),
      y: e.y * i + r.y * n + t.y * a * (1 - i),
      z: e.z * i + r.z * n + t.z * a * (1 - i)
    };
  }
}, Lt = class {
  isUnderground(e) {
    return !e || typeof e.y != "number" ? !1 : e.y < -50;
  }
  isSurface(e) {
    return !this.isUnderground(e);
  }
  getSurfaceMode(e) {
    return this.isUnderground(e) ? "underground" : "surface";
  }
}, $t = class {
  constructor() {
    this.floorCenterMercator = null, this.originalFloorHeight = 0, this.scale = 1, this.modeDetector = new Lt(), this.Cesium = null, this.useLocalCoordinateSystem = !1, this.modelAbsoluteMercator = null, this.virtualFloorCenter = null, this.dualFloorHeight = 76, this.modelAbsoluteAltitude = 0, this.actualTerrainHeight = 0, this.useMeterLevelSync = !0, this.coordScaleFactor = 0.38;
  }
  setCesium(e) {
    this.Cesium = e;
  }
  getCesium() {
    return this.Cesium ? this.Cesium : typeof window < "u" && window.Cesium ? window.Cesium : null;
  }
  setFloorCenter(e, t = null) {
    if (this.useLocalCoordinateSystem, this.useLocalCoordinateSystem) {
      if (t !== null && (this.modelAbsoluteAltitude = t), this.originalFloorHeight = e.z || 0, this.modelAbsoluteMercator = {
        x: e.x,
        y: e.y,
        z: t !== null ? t : e.z
      }, this.floorCenterMercator = {
        x: 0,
        y: 0,
        z: 0
      }, console.log("[MercatorProjectionManager] ✅ 局部坐标系模式：floorCenterMercator 设置为 (0, 0, 0)", {
        originalFloorHeight: this.originalFloorHeight,
        modelAbsoluteAltitude: this.modelAbsoluteAltitude,
        modelAbsoluteMercator: this.modelAbsoluteMercator,
        说明: "局部坐标系模式下，地板中心始终为原点，所有坐标都是相对坐标。modelAbsoluteMercator 保存模型的绝对地理位置，modelAbsoluteAltitude 保存模型的绝对海拔"
      }), typeof window < "u" && window.__syncManager__) {
        const o = window.__syncManager__;
        o && o.reinitUnifiedState && (console.log("[MercatorProjectionManager] 触发 SyncManager 重新初始化 unifiedCameraState"), o.reinitUnifiedState());
      }
      return;
    }
    this.originalFloorHeight = e.z || 0, this.floorCenterMercator = {
      x: e.x,
      y: e.y,
      z: 0
    }, console.log("[MercatorProjectionManager] 设置地板中心:", {
      floorCenterMercator: this.floorCenterMercator,
      originalFloorHeight: this.originalFloorHeight,
      说明: "floorCenterMercator.z 始终为0（地面高度）"
    });
  }
  getFloorCenter() {
    return this.floorCenterMercator;
  }
  getOriginalFloorHeight() {
    return this.originalFloorHeight;
  }
  getModelAbsoluteAltitude() {
    return this.modelAbsoluteAltitude;
  }
  setModelAbsoluteAltitude(e) {
    this.modelAbsoluteAltitude = e, console.log("[MercatorProjectionManager] ✅ 已设置模型绝对海拔:", {
      altitude: e.toFixed(2) + "米",
      说明: "此值用于计算 anchorContainer 的 Y 位置偏移"
    });
  }
  setUseLocalCoordinateSystem(e) {
    if (e === !0) {
      let t = !1;
      if (typeof window < "u" && (window.__syncManager__ && typeof window.__syncManager__.isCesiumReady == "function" ? t = window.__syncManager__.isCesiumReady() : window.__cesiumViewer__ && (t = !0)), !t) {
        console.error("[MercatorProjectionManager] ❌ Cesium 未就绪，禁止启用局部坐标系模式！", {
          请求设置: e,
          当前状态: this.useLocalCoordinateSystem,
          原因: "局部坐标系模式需要 Cesium 已就绪才能正常工作",
          影响: "保持当前模式不变"
        });
        return;
      }
      console.log("[MercatorProjectionManager] ✅ Cesium 已就绪，允许启用局部坐标系模式");
    }
    this.useLocalCoordinateSystem = e, console.log("[MercatorProjectionManager] 设置局部坐标系模式:", {
      useLocalCoordinateSystem: e,
      说明: e ? "使用局部墨卡托坐标系（模型在原点附近）" : "使用绝对墨卡托坐标系（模型在绝对位置）"
    });
  }
  setDualFloorHeight(e) {
    const t = this.dualFloorHeight;
    this.dualFloorHeight = Math.max(-2e3, Math.min(1e4, e)), console.log("[MercatorProjectionManager] ⭐ 设置Dual地板偏移高度:", {
      旧偏移: t.toFixed(2) + "米",
      新偏移: this.dualFloorHeight.toFixed(2) + "米",
      说明: this.dualFloorHeight >= 0 ? "Dual地板将放置在Cesium地面之上" + this.dualFloorHeight + "米处" : "Dual地板将放置在Cesium地面之下" + Math.abs(this.dualFloorHeight) + "米处"
    });
  }
  getDualFloorHeight() {
    return this.dualFloorHeight;
  }
  setDualFloorHeightToTerrain(e) {
    const t = this.dualFloorHeight;
    e === 0 || isNaN(e) ? (this.dualFloorHeight = 0, this.actualTerrainHeight = 0, console.warn("[MercatorProjectionManager] ⚠️ 地形采样失败，Dual地板对齐到椭球体表面:", {
      输入高度: isNaN(e) ? "NaN (采样失败)" : e.toFixed(2) + "米",
      使用高度: "0 米（椭球体表面）",
      原因: "地形采样返回无效值，使用椭球体表面作为默认地面"
    })) : e < -500 || e > 9e3 ? (this.dualFloorHeight = 0, this.actualTerrainHeight = 0, console.warn("[MercatorProjectionManager] ⚠️ 地形高度超出合理范围，使用椭球体表面:", {
      输入高度: e.toFixed(2) + "米",
      使用高度: "0 米（椭球体表面）",
      原因: "超出合理范围 [-500, 9000]"
    })) : (this.dualFloorHeight = e, this.actualTerrainHeight = e), console.log("[MercatorProjectionManager] ⭐ 设置Dual地板高度到实际地形:", {
      旧高度: t.toFixed(2) + "米",
      新地形高度: this.dualFloorHeight.toFixed(2) + "米",
      实际地形高度: this.actualTerrainHeight.toFixed(2) + "米",
      说明: this.dualFloorHeight === 0 ? "Dual地板已对齐到椭球体表面（地形采样失败时默认行为）" : "Dual地板将放置在实际地形高度，actualTerrainHeight 已保存"
    }), console.log("[MercatorProjectionManager] ⭐ modelAbsoluteMercator.z 保持不变:", {
      modelAbsoluteMercator_z: this.modelAbsoluteMercator?.z?.toFixed(2) + "米 (模型海拔)",
      dualFloorHeight: this.dualFloorHeight.toFixed(2) + "米 (地形高度)",
      说明: "模型海拔和地形高度是两个独立的值"
    });
  }
  getCurrentFloorHeight() {
    return this.dualFloorHeight;
  }
  isUsingLocalCoordinateSystem() {
    return this.useLocalCoordinateSystem;
  }
  setUseMeterLevelSync(e) {
    this.useMeterLevelSync = e, console.log("[MercatorProjectionManager] 设置米级同步模式:", {
      useMeterLevelSync: e,
      实际缩放因子: e ? "1.0 (真正米级)" : this.coordScaleFactor + " (视觉校准)"
    });
  }
  getActualScaleFactor() {
    return this.useMeterLevelSync ? 1 : this.coordScaleFactor;
  }
  isUsingMeterLevelSync() {
    return this.useMeterLevelSync;
  }
  getENUBasisVectorsAtPosition(e, t) {
    const o = this.getCesium();
    if (!o || !e || !t) return null;
    try {
      const i = (t?.scene?.globe?.ellipsoid || o.Ellipsoid.WGS84).cartesianToCartographic(e, new o.Cartographic());
      if (!i) return null;
      const n = i.longitude, r = i.latitude, a = o.Transforms.eastNorthUpToFixedFrame(e, void 0, new o.Matrix4()), s = new o.Cartesian3(), c = new o.Cartesian3(), l = new o.Cartesian3();
      return s.x = a[0], s.y = a[1], s.z = a[2], c.x = a[4], c.y = a[5], c.z = a[6], l.x = a[8], l.y = a[9], l.z = a[10], o.Cartesian3.normalize(s, s), o.Cartesian3.normalize(c, c), o.Cartesian3.normalize(l, l), {
        east: s,
        north: c,
        up: l,
        longitude: n,
        latitude: r
      };
    } catch (i) {
      return console.warn("[MercatorProjectionManager.getENUBasisVectorsAtPosition] 计算失败:", i), null;
    }
  }
  lonLatToMercator(e, t) {
    return {
      x: e * le,
      y: Math.log(Math.tan(Math.PI / 4 + t / 2)) * le
    };
  }
  mercatorToLonLat(e, t) {
    const o = Math.max(-20037508, Math.min(it, t));
    try {
      return {
        longitude: e / le,
        latitude: 2 * Math.atan(Math.exp(o / le)) - Math.PI / 2
      };
    } catch (i) {
      return console.error("[MercatorProjectionManager] 墨卡托转经纬度失败:", i), {
        longitude: 0,
        latitude: 0
      };
    }
  }
  latitudeToMercatorY(e) {
    return Math.log(Math.tan(Math.PI / 4 + e / 2)) * le;
  }
  mercatorYToLatitude(e) {
    const t = Math.max(-20037508, Math.min(it, e));
    try {
      return 2 * Math.atan(Math.exp(t / le)) - Math.PI / 2;
    } catch {
      return 0;
    }
  }
  mercatorToThree(e, t, o) {
    if (!this.floorCenterMercator) return {
      x: e,
      y: o,
      z: -t
    };
    const i = !isNaN(e) && !isNaN(t) && !isNaN(o) && isFinite(e) && isFinite(t) && isFinite(o);
    let n = this.floorCenterMercator;
    if (this.useLocalCoordinateSystem && this.modelAbsoluteMercator && (n = this.modelAbsoluteMercator), !i)
      return console.error("[MercatorProjectionManager] mercatorToThree 输入无效:", {
        x: e,
        y: t,
        z: o
      }), {
        x: 0,
        y: 0,
        z: 0
      };
    const r = {
      x: (e - n.x) / this.scale,
      y: o / this.scale,
      z: -(t - n.y) / this.scale
    };
    return !isNaN(r.x) && !isNaN(r.y) && !isNaN(r.z) && isFinite(r.x) && isFinite(r.y) && isFinite(r.z) ? r : (console.error("[MercatorProjectionManager] mercatorToThree 转换产生无效结果:", r), {
      x: 0,
      y: 0,
      z: 0
    });
  }
  threeToMercator(e, t, o) {
    if (!this.floorCenterMercator) return {
      x: e,
      y: -o,
      z: t
    };
    const i = !isNaN(e) && !isNaN(t) && !isNaN(o) && isFinite(e) && isFinite(t) && isFinite(o);
    let n = this.floorCenterMercator;
    if (this.useLocalCoordinateSystem && this.modelAbsoluteMercator && (n = this.modelAbsoluteMercator), !i)
      return console.error("[MercatorProjectionManager] threeToMercator 输入无效:", {
        x: e,
        y: t,
        z: o
      }), {
        x: n.x,
        y: n.y,
        z: 500
      };
    const r = 1e5;
    if (Math.abs(e) > r || Math.abs(o) > r) {
      const s = t * this.scale;
      return console.warn("[MercatorProjectionManager] 检测到大坐标模型:", {
        输入: {
          x: e.toFixed(2),
          y: t.toFixed(2),
          z: o.toFixed(2)
        },
        输出: {
          x: n.x,
          y: n.y,
          z: s.toFixed(2)
        },
        说明: "平面坐标使用地板中心，高度保持原值"
      }), {
        x: n.x,
        y: n.y,
        z: s
      };
    }
    const a = {
      x: e * this.scale + n.x,
      y: -o * this.scale + n.y,
      z: t * this.scale
    };
    return !isNaN(a.x) && !isNaN(a.y) && !isNaN(a.z) && isFinite(a.x) && isFinite(a.y) && isFinite(a.z) ? a : (console.error("[MercatorProjectionManager] threeToMercator 输出无效:", a), {
      x: this.floorCenterMercator.x,
      y: this.floorCenterMercator.y,
      z: 500
    });
  }
  initFromCesium(e, t) {
    const o = this.getCesium();
    if (!o || !e || !this.floorCenterMercator)
      return console.error("[MercatorProjectionManager] initFromCesium 缺少必要参数"), null;
    try {
      const i = t?.globe?.ellipsoid || o.Ellipsoid.WGS84, n = i.cartesianToCartographic(e.position), r = {
        x: n.longitude * le,
        y: this.latitudeToMercatorY(n.latitude),
        z: n.height
      };
      (r.z < Ae || r.z > Re) && (console.error("[MercatorProjectionManager] 检测到异常相机高度，正在修正:", {
        originalHeight: r.z,
        clampedHeight: Math.max(Ae, Math.min(Re, r.z))
      }), r.z = Math.max(Ae, Math.min(Re, r.z)));
      let a;
      try {
        const g = new o.Ray(e.position, e.direction), u = o.IntersectionTests.rayEllipsoid(g, i);
        o.defined(u) ? a = i.cartesianToCartographic(u) : a = o.Cartographic.fromRadians(n.longitude, n.latitude, 0);
      } catch {
        a = o.Cartographic.fromRadians(n.longitude, n.latitude, 0);
      }
      const s = {
        x: a.longitude * le,
        y: this.latitudeToMercatorY(a.latitude),
        z: 0
      }, c = {
        position: {
          x: r.x - this.floorCenterMercator.x,
          y: r.z,
          z: -(r.y - this.floorCenterMercator.y)
        },
        target: {
          x: s.x - this.floorCenterMercator.x,
          y: s.z - this.floorCenterMercator.z,
          z: -(s.y - this.floorCenterMercator.y)
        },
        direction: {
          x: 0,
          y: -1,
          z: 0
        },
        up: {
          x: 0,
          y: 1,
          z: 0
        },
        right: {
          x: 1,
          y: 0,
          z: 0
        },
        height: 500
      }, l = {
        x: c.target.x - c.position.x,
        y: c.target.y - c.position.y,
        z: c.target.z - c.position.z
      };
      return c.direction = nt.normalize(l), c.height = Math.sqrt(Math.pow(c.position.x - c.target.x, 2) + Math.pow(c.position.y - c.target.y, 2) + Math.pow(c.position.z - c.target.z, 2)), c.height = Math.max(10, Math.min(5e4, c.height)), this._rebuildOrthonormalBasis(c), this.originalFloorHeight = 0, console.log("[MercatorProjectionManager] 从 Cesium 初始化完成:", {
        position: c.position,
        target: c.target,
        height: c.height,
        mode: this.modeDetector.getSurfaceMode(c.position)
      }), c;
    } catch (i) {
      return console.error("[MercatorProjectionManager] initFromCesium 失败:", i), null;
    }
  }
  syncToCesium(e, t, o) {
    const i = this.getCesium();
    if (!i || !this.floorCenterMercator || !t || !e)
      return console.error("[MercatorProjectionManager] syncToCesium 缺少必要参数"), !1;
    try {
      let n = this.floorCenterMercator;
      this.useLocalCoordinateSystem && this.modelAbsoluteMercator && (n = this.modelAbsoluteMercator);
      const r = e.position.y + (this.useLocalCoordinateSystem && this.originalFloorHeight || 0), a = e.target.y + this.originalFloorHeight, s = {
        x: e.position.x + n.x,
        y: -e.position.z + n.y,
        z: r
      }, c = {
        x: e.target.x + n.x,
        y: -e.target.z + n.y,
        z: a
      }, l = s.x / le, g = this.mercatorYToLatitude(s.y), u = c.x / le, d = this.mercatorYToLatitude(c.y), m = i.Cartesian3.fromRadians(l, g, s.z), p = i.Cartesian3.fromRadians(u, d, c.z), x = i.Cartesian3.subtract(p, m, new i.Cartesian3()), f = i.Cartesian3.magnitude(x);
      return f < 1e-4 ? (console.warn("[MercatorProjectionManager] 方向向量接近零，跳过同步", {
        相机位置: m,
        目标位置: p,
        方向向量长度: f
      }), !1) : (i.Cartesian3.normalize(x, x), t.position = m, t.direction = x, t.up = (o?.globe?.ellipsoid || i.Ellipsoid.WGS84).geodeticSurfaceNormal(m, new i.Cartesian3()), t.right = i.Cartesian3.cross(t.direction, t.up, new i.Cartesian3()), i.Cartesian3.normalize(t.right, t.right), console.log("[MercatorProjectionManager] syncToCesium 完成（ENS→ECEF）:", {
        State坐标_东南天: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`,
        ECEF方向: `(${t.direction.x.toFixed(3)}, ${t.direction.y.toFixed(3)}, ${t.direction.z.toFixed(3)})`
      }), t.update && t.update(o?.clock?.currentTime || i.JulianDate.now()), !0);
    } catch (n) {
      return console.error("[MercatorProjectionManager] syncToCesium 失败:", n), !1;
    }
  }
  syncDirectionToCesium(e, t, o) {
    const i = this.getCesium();
    if (!i || !this.floorCenterMercator || !t || !e)
      return console.error("[MercatorProjectionManager] syncDirectionToCesium 缺少必要参数"), !1;
    if (!e.direction || typeof e.direction.x != "number" || typeof e.direction.y != "number" || typeof e.direction.z != "number" || !isFinite(e.direction.x) || !isFinite(e.direction.y) || !isFinite(e.direction.z))
      return console.error("[MercatorProjectionManager] syncDirectionToCesium state.direction 无效:", {
        direction: e.direction,
        x: e.direction?.x,
        y: e.direction?.y,
        z: e.direction?.z
      }), !1;
    if (!e.position || typeof e.position.x != "number" || typeof e.position.y != "number" || typeof e.position.z != "number" || !isFinite(e.position.x) || !isFinite(e.position.y) || !isFinite(e.position.z))
      return console.error("[MercatorProjectionManager] syncDirectionToCesium state.position 无效:", {
        position: e.position,
        x: e.position?.x,
        y: e.position?.y,
        z: e.position?.z
      }), !1;
    try {
      let n = this.floorCenterMercator;
      const r = this.useLocalCoordinateSystem;
      if (r && this.modelAbsoluteMercator)
        n = this.modelAbsoluteMercator, console.log("[MercatorProjectionManager] syncDirectionToCesium 使用局部坐标系参考点:", {
          modelAbsoluteMercator: `(${this.modelAbsoluteMercator.x.toFixed(2)}, ${this.modelAbsoluteMercator.y.toFixed(2)})`,
          说明: "使用模型的绝对地理位置作为参考点"
        });
      else if (r && !this.modelAbsoluteMercator)
        return console.error("[MercatorProjectionManager] ⚠️ 局部坐标系模式但 modelAbsoluteMercator 未设置！", {
          useLocalCoordinateSystem: this.useLocalCoordinateSystem,
          modelAbsoluteMercator: this.modelAbsoluteMercator,
          floorCenterMercator: this.floorCenterMercator
        }), !1;
      let a;
      r && this.modelAbsoluteMercator ? (a = this.modelAbsoluteMercator.z + e.position.y, console.log("[MercatorProjectionManager] 局部坐标系模式：高度转换", {
        Dual相机相对高度: e.position.y.toFixed(2) + "米",
        Dual地板配置高度: this.modelAbsoluteMercator.z.toFixed(2) + "米",
        Cesium相机绝对高度: a.toFixed(2) + "米",
        说明: "Cesium高度 = Dual地板高度 + Dual相机相对高度"
      })) : a = e.position.y, Math.abs(a) > 1e7 && console.error("[MercatorProjectionManager] ⚠️ 绝对相机高度超出合理范围:", {
        absoluteCameraHeight: a,
        statePositionY: e.position.y,
        stateHeight: e.height,
        modelAbsoluteMercatorZ: this.modelAbsoluteMercator?.z
      });
      const s = this.getActualScaleFactor(), c = {
        x: e.position.x * s + n.x,
        y: -e.position.z * s + n.y,
        z: a
      }, l = c.x / le, g = this.mercatorYToLatitude(c.y), u = i.Cartesian3.fromRadians(l, g, c.z), d = 100, m = {
        x: e.position.x + e.direction.x * d + n.x,
        y: -e.position.z + -e.direction.z * d + n.y,
        z: e.position.y + e.direction.y * d
      }, p = m.x / le, x = this.mercatorYToLatitude(m.y);
      i.Cartesian3.fromRadians(p, x, m.z), t.position = u;
      const f = {
        x: e.direction.x,
        y: -e.direction.z,
        z: e.direction.y
      }, C = new i.Cartesian3(f.x, f.y, f.z);
      if (console.log("[MercatorProjectionManager] 坐标系转换:", {
        state_direction_EUS: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`,
        mercator_direction_ENU: `(${f.x.toFixed(3)}, ${f.y.toFixed(3)}, ${f.z.toFixed(3)})`,
        说明: "统一坐标系(EUS) → 墨卡托坐标系(ENU)"
      }), !isFinite(C.x) || !isFinite(C.y) || !isFinite(C.z))
        return console.error("[MercatorProjectionManager] mercatorDirection 包含无效值:", {
          stateDirection: e.direction,
          mercatorDirection: C
        }), !1;
      const M = o?.globe?.ellipsoid || i.Ellipsoid.WGS84;
      let y = M.geodeticSurfaceNormal(u, new i.Cartesian3());
      i.Cartesian3.normalize(y, y);
      const w = i.Cartesian3.magnitude(y);
      Math.abs(w - 1) > 0.01 && (console.warn("[MercatorProjectionManager] ⚠️ 天向量长度异常，重新归一化:", {
        原始长度: w,
        修正前: `(${y.x.toFixed(3)}, ${y.y.toFixed(3)}, ${y.z.toFixed(3)})`
      }), i.Cartesian3.normalize(y, y));
      let V, S = u, T = i.Cartographic.fromRadians(l, g, e.position.y);
      if (r && this.modelAbsoluteMercator) {
        const $ = this.modelAbsoluteMercator.x / le, N = this.mercatorYToLatitude(this.modelAbsoluteMercator.y), Y = this.modelAbsoluteMercator.z || 0;
        T = i.Cartographic.fromRadians($, N, Y), S = M.cartographicToCartesian(T), console.log("[MercatorProjectionManager] 局部坐标系模式：使用模型位置计算ENU基向量", {
          模型经纬度: `(${($ * 180 / Math.PI).toFixed(6)}°, ${(N * 180 / Math.PI).toFixed(6)}°)`,
          相机经纬度: `(${(l * 180 / Math.PI).toFixed(6)}°, ${(g * 180 / Math.PI).toFixed(6)}°)`,
          说明: "ENU基向量基于模型位置，确保与局部坐标系对齐"
        });
      }
      V = i.Transforms.eastNorthUpToFixedFrame(S);
      let v = new i.Cartesian3(), D = new i.Cartesian3(), _ = new i.Cartesian3();
      v.x = V[0], v.y = V[1], v.z = V[2], D.x = V[4], D.y = V[5], D.z = V[6], _.x = V[8], _.y = V[9], _.z = V[10], i.Cartesian3.normalize(v, v), i.Cartesian3.normalize(D, D), i.Cartesian3.normalize(_, _);
      const b = i.Cartesian3.dot(y, _);
      if (Math.abs(b - 1) > 0.01 ? (console.warn("[MercatorProjectionManager] ⚠️ 矩阵天向量与地球法线不一致，使用地球法线:", {
        点积: b,
        地球法线: `(${y.x.toFixed(3)}, ${y.y.toFixed(3)}, ${y.z.toFixed(3)})`,
        矩阵天向量: `(${_.x.toFixed(3)}, ${_.y.toFixed(3)}, ${_.z.toFixed(3)})`
      }), y = M.geodeticSurfaceNormal(u, new i.Cartesian3()), i.Cartesian3.normalize(y, y)) : y = _, !isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z) || !isFinite(D.x) || !isFinite(D.y) || !isFinite(D.z) || !isFinite(y.x) || !isFinite(y.y) || !isFinite(y.z))
        return console.error("[MercatorProjectionManager] ENU 基向量包含无效值:", {
          east: v,
          north: D,
          up: y,
          cameraCartesian: u
        }), !1;
      const E = new i.Cartesian3(0, 0, 0), F = new i.Cartesian3();
      i.Cartesian3.multiplyByScalar(v, C.x, F), i.Cartesian3.add(E, F, E);
      const P = new i.Cartesian3();
      i.Cartesian3.multiplyByScalar(D, C.y, P), i.Cartesian3.add(E, P, E);
      const R = new i.Cartesian3();
      i.Cartesian3.multiplyByScalar(y, C.z, R), i.Cartesian3.add(E, R, E);
      const L = i.Cartesian3.dot(v, y), A = i.Cartesian3.dot(D, y), U = i.Cartesian3.dot(v, D);
      if (Math.abs(L) > 0.01 || Math.abs(A) > 0.01 || Math.abs(U) > 0.01) {
        console.warn("[MercatorProjectionManager] ⚠️ ENU基向量不正交，重新计算:", {
          eastDotUp: L.toFixed(4),
          northDotUp: A.toFixed(4),
          eastDotNorth: U.toFixed(4),
          说明: "理想情况下这些值应该接近0"
        });
        const $ = new i.Cartesian3();
        i.Cartesian3.cross(y, v, $), i.Cartesian3.normalize($, $);
        const N = i.Cartesian3.dot(v, $), Y = i.Cartesian3.dot($, y);
        Math.abs(N) < 1e-3 && Math.abs(Y) < 1e-3 ? (console.log("[MercatorProjectionManager] ✅ 重新计算后的北向量正交性验证通过"), D = $) : console.error("[MercatorProjectionManager] ❌ 无法修正基向量正交性");
      }
      const H = i.Cartesian3.magnitude(E);
      if (!isFinite(E.x) || !isFinite(E.y) || !isFinite(E.z) || H < 1e-4)
        return console.error("[MercatorProjectionManager] ecefDirection 无效或长度接近零:", {
          ecefDirection: E,
          directionLength: H,
          mercatorDirection: C,
          east: v,
          north: D,
          up: y
        }), !1;
      i.Cartesian3.normalize(E, E);
      const ee = i.Cartesian3.dot(new i.Cartesian3(e.direction.x, e.direction.y, e.direction.z), new i.Cartesian3(0, 1, 0)), O = Math.abs(ee) < 0.2;
      if (O) {
        console.warn("[MercatorProjectionManager] ⚠️ 相机接近地平线，启用特殊处理:", {
          cameraDotUp: ee.toFixed(3),
          说明: "可能需要额外的姿态修正"
        });
        const $ = M.geodeticSurfaceNormal(u, new i.Cartesian3());
        i.Cartesian3.normalize($, $);
        const N = new i.Cartesian3();
        N.x = -Math.sin(l), N.y = Math.cos(l), N.z = 0, i.Cartesian3.normalize(N, N);
        const Y = new i.Cartesian3();
        i.Cartesian3.cross($, N, Y), i.Cartesian3.normalize(Y, Y);
        const he = i.Cartesian3.dot(N, $), ge = i.Cartesian3.dot(Y, $), te = i.Cartesian3.dot(N, Y);
        console.log("[MercatorProjectionManager] ✅ 地平线模式：稳定的基向量:", {
          正交性检查: {
            eastDotUp: he.toFixed(4),
            northDotUp: ge.toFixed(4),
            eastDotNorth: te.toFixed(4)
          },
          天向量: `(${$.x.toFixed(3)}, ${$.y.toFixed(3)}, ${$.z.toFixed(3)})`,
          说明: "天向量应该完全垂直于地面"
        }), v = N, D = Y, y = $, E.x = 0, E.y = 0, E.z = 0, i.Cartesian3.multiplyByScalar(v, C.x, F), i.Cartesian3.add(E, F, E), i.Cartesian3.multiplyByScalar(D, C.y, P), i.Cartesian3.add(E, P, E), i.Cartesian3.multiplyByScalar(y, C.z, R), i.Cartesian3.add(E, R, E);
      }
      console.log("[MercatorProjectionManager] ENU/局部墨卡托 基向量检查:", {
        东向量: `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`,
        北向量: `(${D.x.toFixed(3)}, ${D.y.toFixed(3)}, ${D.z.toFixed(3)})`,
        天向量: `(${y.x.toFixed(3)}, ${y.y.toFixed(3)}, ${y.z.toFixed(3)})`,
        墨卡托方向: `(${C.x.toFixed(3)}, ${C.y.toFixed(3)}, ${C.z.toFixed(3)})`,
        东分量: `(${F.x.toFixed(3)}, ${F.y.toFixed(3)}, ${F.z.toFixed(3)})`,
        北分量: `(${P.x.toFixed(3)}, ${P.y.toFixed(3)}, ${P.z.toFixed(3)})`,
        天分量: `(${R.x.toFixed(3)}, ${R.y.toFixed(3)}, ${R.z.toFixed(3)})`,
        ECEF方向_归一化前: `(${E.x.toFixed(3)}, ${E.y.toFixed(3)}, ${E.z.toFixed(3)})`,
        接近地平线: O ? "是" : "否"
      });
      const B = M.geodeticSurfaceNormal(u, new i.Cartesian3()), k = i.Cartesian3.dot(y, B);
      k < 0.99 && console.warn("[MercatorProjectionManager] ⚠️ 天向量与地球表面法线不一致:", {
        实际天向量: `(${y.x.toFixed(3)}, ${y.y.toFixed(3)}, ${y.z.toFixed(3)})`,
        期望天向量: `(${B.x.toFixed(3)}, ${B.y.toFixed(3)}, ${B.z.toFixed(3)})`,
        点积: k.toFixed(4),
        说明: "天向量应该与地球表面法线一致",
        isUsingLocalCoord: r
      }), i.Cartesian3.normalize(E, E), t.direction = E, t.up = y, t.right = i.Cartesian3.cross(t.direction, t.up, new i.Cartesian3()), i.Cartesian3.normalize(t.right, t.right), t.update && t.update(o?.clock?.currentTime || i.JulianDate.now());
      const Q = M.cartesianToCartographic(t.position, new i.Cartographic()), X = (Q.longitude * 180 / Math.PI).toFixed(6), j = (Q.latitude * 180 / Math.PI).toFixed(6), G = Q.height.toFixed(2);
      let W = "N/A", K = "N/A";
      if (this.modelAbsoluteMercator) {
        const $ = this.modelAbsoluteMercator.x / le, N = this.mercatorYToLatitude(this.modelAbsoluteMercator.y);
        W = ($ * 180 / Math.PI).toFixed(6), K = (N * 180 / Math.PI).toFixed(6);
      }
      return console.log("[MercatorProjectionManager] syncDirectionToCesium 完成（局部墨卡托 → ENU基向量 → ECEF）:", {
        State_东南天: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`,
        墨卡托_东北天: `(${C.x.toFixed(3)}, ${C.y.toFixed(3)}, ${C.z.toFixed(3)})`,
        ECEF方向: `(${t.direction.x.toFixed(3)}, ${t.direction.y.toFixed(3)}, ${t.direction.z.toFixed(3)})`
      }), console.log("[MercatorProjectionManager] ⭐ 锚定验证:", {
        Cesium相机位置: {
          经度: X + "°",
          纬度: j + "°",
          高度: G + "m"
        },
        大模型锚定点: {
          经度: W + "°",
          纬度: K + "°"
        },
        相机相对锚定点: {
          经度差: ((parseFloat(X) - parseFloat(W)) * 111320).toFixed(2) + "m (东)",
          纬度差: ((parseFloat(j) - parseFloat(K)) * 110540).toFixed(2) + "m (北)"
        },
        锚定状态: Math.abs(parseFloat(X) - parseFloat(W)) < 1e-3 && Math.abs(parseFloat(j) - parseFloat(K)) < 1e-3 ? "❌ 相机在锚定点上方（视角中心）" : "✅ 锚定点在相机视野内"
      }), !0;
    } catch (n) {
      return console.error("[MercatorProjectionManager] syncDirectionToCesium 失败:", n), !1;
    }
  }
  isUnderground(e) {
    return this.modeDetector.isUnderground(e);
  }
  isSurface(e) {
    return this.modeDetector.isSurface(e);
  }
  getSurfaceMode(e) {
    return this.modeDetector.getSurfaceMode(e);
  }
  _rebuildOrthonormalBasis(e) {
    if (!e || !e.direction) return;
    e.direction = nt.normalize(e.direction), e.up = {
      x: 0,
      y: 1,
      z: 0
    };
    const t = Math.sqrt(e.direction.x ** 2 + e.direction.y ** 2 + e.direction.z ** 2);
    if (t > 1e-3) {
      let o = {
        x: e.direction.z / t,
        y: 0,
        z: -e.direction.x / t
      };
      const i = Math.sqrt(o.x ** 2 + o.z ** 2);
      i < 1e-3 ? o = {
        x: 1,
        y: 0,
        z: 0
      } : (o.x /= i, o.z /= i), e.right = o;
    } else e.right = {
      x: 1,
      y: 0,
      z: 0
    };
    console.log("[MercatorProjectionManager._rebuildOrthonormalBasis] 重建正交基:", {
      direction: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`,
      up: `(${e.up.x.toFixed(3)}, ${e.up.y.toFixed(3)}, ${e.up.z.toFixed(3)})`,
      right: `(${e.right.x.toFixed(3)}, ${e.right.y.toFixed(3)}, ${e.right.z.toFixed(3)})`,
      rightDotX: e.right.x.toFixed(3)
    });
  }
  getVirtualFloorCenter() {
    return this.useLocalCoordinateSystem && this.modelAbsoluteMercator ? {
      x: this.modelAbsoluteMercator.x,
      y: this.modelAbsoluteMercator.y,
      z: this.actualTerrainHeight || 0
    } : this.floorCenterMercator;
  }
  isVirtualFloorCenterAlignedWithENU() {
    return this.useLocalCoordinateSystem ? this.modelAbsoluteMercator ? this.floorCenterMercator.x === 0 && this.floorCenterMercator.y === 0 && this.floorCenterMercator.z === 0 : !1 : !0;
  }
}, de = new $t();
console.log("[MercatorProjectionManager] 单例实例已创建:", {
  mercatorProjectionManager: de,
  类型: typeof de,
  constructorName: de?.constructor?.name,
  方法: Object.getOwnPropertyNames(Object.getPrototypeOf(de)).filter((e) => e !== "constructor")
});
var At = class {
  constructor() {
    this.origin = null, this.basis = {
      east: new h.Vector3(),
      north: new h.Vector3(),
      up: new h.Vector3()
    }, this.originECEF = new h.Vector3(), this.Cesium = null, this.cesiumViewer = null, this.scale = 1, this._isFlyingToOrigin = !1, this._flyPromise = null, console.log("[ENUCoordinateManager] 已创建");
  }
  setCesium(e, t) {
    this.Cesium = e, this.cesiumViewer = t, console.log("[ENUCoordinateManager] Cesium 已设置");
  }
  getCesium() {
    return this.Cesium ? this.Cesium : typeof window < "u" && window.Cesium ? window.Cesium : null;
  }
  initializeAtPosition(e, t, o = 0) {
    const i = this.getCesium();
    if (!i)
      return console.error("[ENUCoordinateManager] Cesium 不可用"), !1;
    try {
      this.origin = {
        longitude: e,
        latitude: t,
        height: o
      };
      const n = i.Cartesian3.fromRadians(e, t, o);
      return this.originECEF.set(n.x, n.y, n.z), this._computeENUBasis(e, t), console.log("[ENUCoordinateManager] ENU坐标系已初始化:", {
        原点经度: (e * 180 / Math.PI).toFixed(6) + "°",
        原点纬度: (t * 180 / Math.PI).toFixed(6) + "°",
        原点高度: o.toFixed(2) + "m",
        East: `(${this.basis.east.x.toFixed(4)}, ${this.basis.east.y.toFixed(4)}, ${this.basis.east.z.toFixed(4)})`,
        North: `(${this.basis.north.x.toFixed(4)}, ${this.basis.north.y.toFixed(4)}, ${this.basis.north.z.toFixed(4)})`,
        Up: `(${this.basis.up.x.toFixed(4)}, ${this.basis.up.y.toFixed(4)}, ${this.basis.up.z.toFixed(4)})`
      }), !0;
    } catch (n) {
      return console.error("[ENUCoordinateManager] 初始化失败:", n), !1;
    }
  }
  initializeFromCartographic(e) {
    return this.initializeAtPosition(e.longitude, e.latitude, e.height || 0);
  }
  initializeFromECEF(e) {
    const t = this.getCesium();
    if (!t || !this.cesiumViewer)
      return console.error("[ENUCoordinateManager] Cesium 不可用"), !1;
    try {
      const o = new t.Cartesian3(e.x, e.y, e.z), i = (this.cesiumViewer.scene.globe.ellipsoid || t.Ellipsoid.WGS84).cartesianToCartographic(o);
      return i ? this.initializeFromCartographic({
        longitude: i.longitude,
        latitude: i.latitude,
        height: i.height
      }) : (console.error("[ENUCoordinateManager] ECEF到经纬度转换失败"), !1);
    } catch (o) {
      return console.error("[ENUCoordinateManager] 从ECEF初始化失败:", o), !1;
    }
  }
  _computeENUBasis(e, t) {
    const o = Math.cos(e), i = Math.sin(e), n = Math.cos(t), r = Math.sin(t);
    this.basis.up.set(n * o, n * i, r), this.basis.east.set(-i, o, 0), this.basis.north.crossVectors(this.basis.up, this.basis.east), console.log("[ENUCoordinateManager._computeENUBasis] 基向量已计算:", {
      East长度: this.basis.east.length().toFixed(6),
      North长度: this.basis.north.length().toFixed(6),
      Up长度: this.basis.up.length().toFixed(6),
      East_perp_North: Math.abs(this.basis.east.dot(this.basis.north)).toFixed(6),
      East_perp_Up: Math.abs(this.basis.east.dot(this.basis.up)).toFixed(6),
      North_perp_Up: Math.abs(this.basis.north.dot(this.basis.up)).toFixed(6)
    });
  }
  ecefToENU(e) {
    if (!this.origin)
      return console.error("[ENUCoordinateManager] ENU坐标系未初始化"), new h.Vector3();
    const t = new h.Vector3(e.x - this.originECEF.x, e.y - this.originECEF.y, e.z - this.originECEF.z);
    return new h.Vector3(t.dot(this.basis.east), t.dot(this.basis.north), t.dot(this.basis.up));
  }
  enuToECEF(e) {
    if (!this.origin)
      return console.error("[ENUCoordinateManager] ENU坐标系未初始化"), new h.Vector3();
    const t = new h.Vector3();
    return t.addScaledVector(this.basis.east, e.x), t.addScaledVector(this.basis.north, e.y), t.addScaledVector(this.basis.up, e.z), new h.Vector3(this.originECEF.x + t.x, this.originECEF.y + t.y, this.originECEF.z + t.z);
  }
  enuToThreeJS(e) {
    return new h.Vector3(e.x * this.scale, e.z * this.scale, -e.y * this.scale);
  }
  threeJSToENU(e) {
    return new h.Vector3(e.x / this.scale, -e.z / this.scale, e.y / this.scale);
  }
  ecefToThreeJS(e) {
    const t = this.ecefToENU(e);
    return this.enuToThreeJS(t);
  }
  threeJSToECEF(e) {
    const t = this.threeJSToENU(e);
    return this.enuToECEF(t);
  }
  ecefVectorToENU(e, t = null) {
    return this.origin ? new h.Vector3(e.dot(this.basis.east), e.dot(this.basis.north), e.dot(this.basis.up)) : (console.error("[ENUCoordinateManager] ENU坐标系未初始化"), new h.Vector3());
  }
  enuVectorToECEF(e) {
    if (!this.origin)
      return console.error("[ENUCoordinateManager] ENU坐标系未初始化"), new h.Vector3();
    const t = new h.Vector3();
    return t.addScaledVector(this.basis.east, e.x), t.addScaledVector(this.basis.north, e.y), t.addScaledVector(this.basis.up, e.z), t;
  }
  setCesiumCameraToOrigin(e = 500) {
    const t = this.getCesium();
    if (!t || !this.cesiumViewer || !this.origin)
      return console.error("[ENUCoordinateManager] Cesium或ENU原点未设置"), !1;
    try {
      console.log("[ENUCoordinateManager] 定位Cesium相机到ENU原点（setView）:", {
        经度: (this.origin.longitude * 180 / Math.PI).toFixed(6) + "°",
        纬度: (this.origin.latitude * 180 / Math.PI).toFixed(6) + "°",
        高度: (this.origin.height + e).toFixed(2) + "m"
      });
      const o = t.Cartesian3.fromRadians(this.origin.longitude, this.origin.latitude, this.origin.height + e);
      this.cesiumViewer.camera.setView({
        destination: o,
        orientation: {
          heading: 0,
          pitch: -Math.PI / 4,
          roll: 0
        }
      });
      const i = this.cesiumViewer.camera.position, n = t.Cartographic.fromCartesian(i);
      return console.log("[ENUCoordinateManager] 📍 相机位置验证:", {
        设置经度: (this.origin.longitude * 180 / Math.PI).toFixed(6) + "°",
        实际经度: (n.longitude * 180 / Math.PI).toFixed(6) + "°",
        设置纬度: (this.origin.latitude * 180 / Math.PI).toFixed(6) + "°",
        实际纬度: (n.latitude * 180 / Math.PI).toFixed(6) + "°",
        设置高度: (this.origin.height + e).toFixed(2) + "m",
        实际高度: n.height.toFixed(2) + "m"
      }), this.cesiumViewer.scene.requestRender(), console.log("[ENUCoordinateManager] ✅ Cesium相机已定位到ENU原点并触发渲染"), !0;
    } catch (o) {
      return console.error("[ENUCoordinateManager] Cesium相机定位失败:", o), !1;
    }
  }
  async setCesiumCameraToOriginAsync(e = 500, t = 10, o = 100) {
    const i = this.getCesium();
    if (!i || !this.cesiumViewer || !this.origin)
      return console.error("[ENUCoordinateManager] Cesium或ENU原点未设置"), !1;
    for (let n = 0; n < t; n++) {
      if (this.cesiumViewer.scene && this.cesiumViewer.camera) try {
        console.log("[ENUCoordinateManager] 异步定位Cesium相机到ENU原点（setView）:", {
          经度: (this.origin.longitude * 180 / Math.PI).toFixed(6) + "°",
          纬度: (this.origin.latitude * 180 / Math.PI).toFixed(6) + "°",
          高度: (this.origin.height + e).toFixed(2) + "m",
          尝试次数: n + 1
        });
        const r = i.Cartesian3.fromRadians(this.origin.longitude, this.origin.latitude, this.origin.height + e);
        this.cesiumViewer.camera.setView({
          destination: r,
          orientation: {
            heading: 0,
            pitch: -Math.PI / 4,
            roll: 0
          }
        });
        const a = this.cesiumViewer.camera.position, s = i.Cartographic.fromCartesian(a);
        return console.log("[ENUCoordinateManager] 📍 相机位置验证（异步）:", {
          设置经度: (this.origin.longitude * 180 / Math.PI).toFixed(6) + "°",
          实际经度: (s.longitude * 180 / Math.PI).toFixed(6) + "°",
          设置纬度: (this.origin.latitude * 180 / Math.PI).toFixed(6) + "°",
          实际纬度: (s.latitude * 180 / Math.PI).toFixed(6) + "°",
          设置高度: (this.origin.height + e).toFixed(2) + "m",
          实际高度: s.height.toFixed(2) + "m"
        }), this.cesiumViewer.scene.requestRender(), console.log("[ENUCoordinateManager] ✅ Cesium相机已定位到ENU原点并触发渲染（异步）"), !0;
      } catch (r) {
        return console.error("[ENUCoordinateManager] Cesium相机定位失败（异步）:", r), !1;
      }
      console.log(`[ENUCoordinateManager] ⏳ Cesium Viewer 未就绪，等待 ${o}ms 后重试 (${n + 1}/${t})`), await new Promise((r) => setTimeout(r, o));
    }
    return console.error("[ENUCoordinateManager] ⚠️ Cesium Viewer 在最大重试次数后仍未就绪"), !1;
  }
  getOriginInfo() {
    return this.origin ? {
      longitude: this.origin.longitude * 180 / Math.PI,
      latitude: this.origin.latitude * 180 / Math.PI,
      height: this.origin.height,
      ecef: {
        x: this.originECEF.x,
        y: this.originECEF.y,
        z: this.originECEF.z
      }
    } : null;
  }
  isInitialized() {
    return this.origin !== null;
  }
  reset() {
    this.origin = null, this.originECEF.set(0, 0, 0), this.basis.east.set(0, 0, 0), this.basis.north.set(0, 0, 0), this.basis.up.set(0, 0, 0), console.log("[ENUCoordinateManager] 已重置");
  }
  alignOriginWithVirtualFloorCenter(e) {
    if (!e)
      return console.warn("[ENUCoordinateManager] 虚拟地板中心为空，无法对齐"), !1;
    if (!this.getCesium()) return !1;
    try {
      const t = e.x / 6378137, o = this.mercatorYToLatitude(e.y), i = e.z || 0, n = this.initializeAtPosition(t, o, i);
      return n && console.log("[ENUCoordinateManager] ✅ ENU原点已与虚拟地板中心对齐:", {
        虚拟地板中心: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,
        ENU原点: `(${(t * 180 / Math.PI).toFixed(6)}°, ${(o * 180 / Math.PI).toFixed(6)}°)`
      }), n;
    } catch (t) {
      return console.error("[ENUCoordinateManager] 对齐ENU原点失败:", t), !1;
    }
  }
  mercatorYToLatitude(e) {
    const i = Math.max(-20037508, Math.min(20037508, e));
    try {
      return 2 * Math.atan(Math.exp(i / 6378137)) - Math.PI / 2;
    } catch {
      return 0;
    }
  }
  getOriginInfo() {
    return this.origin ? {
      longitude: this.origin.longitude * 180 / Math.PI,
      latitude: this.origin.latitude * 180 / Math.PI,
      height: this.origin.height
    } : null;
  }
}, se = new At(), Se, Be, Ge = re((() => {
  Se = class {
    constructor() {
      this.UNDERGROUND_THRESHOLD = -50;
    }
    isUnderground(e) {
      return !e || typeof e.y != "number" ? (console.warn("[SurfaceModeDetector] 无效的位置对象"), !1) : e.y < this.UNDERGROUND_THRESHOLD;
    }
    isSurface(e) {
      return !this.isUnderground(e);
    }
    getSurfaceMode(e) {
      return !e || typeof e.y != "number" ? "unknown" : this.isUnderground(e) ? "underground" : "surface";
    }
    detectFromCesiumCamera(e, t) {
      if (!e || !e.position) return "unknown";
      try {
        const o = t(e.position);
        return o ? o.height < 0 ? "underground" : "surface" : "unknown";
      } catch (o) {
        return console.warn("[SurfaceModeDetector] 从 Cesium 相机检测模式失败:", o), "unknown";
      }
    }
    getThreshold() {
      return this.UNDERGROUND_THRESHOLD;
    }
    setThreshold(e) {
      typeof e == "number" && isFinite(e) ? (this.UNDERGROUND_THRESHOLD = e, console.log(`[SurfaceModeDetector] 地下模式阈值已更新为: ${e}`)) : console.warn("[SurfaceModeDetector] 无效的阈值:", e);
    }
  }, Be = new Se();
})), De, ct = re((() => {
  De = class {
    static LARGE_COORD_THRESHOLD = 1e5;
    static isLargeCoordinateModel(e) {
      if (!e) return !1;
      const t = new THREE.Box3().setFromObject(e).getCenter(new THREE.Vector3()), o = Math.abs(t.x) > this.LARGE_COORD_THRESHOLD || Math.abs(t.y) > this.LARGE_COORD_THRESHOLD || Math.abs(t.z) > this.LARGE_COORD_THRESHOLD;
      return console.log("[LargeCoordinateGuard] 模型坐标检测:", {
        name: e.name || e.userData?.filePath || "unnamed",
        center: `(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`,
        maxCoord: Math.max(Math.abs(t.x), Math.abs(t.y), Math.abs(t.z)),
        isLarge: o ? "是 ✅" : "否 ❌",
        threshold: this.LARGE_COORD_THRESHOLD
      }), o;
    }
    static hasLargeCoordinateModels(e) {
      if (!e || e.children.length === 0) return !1;
      let t = !1, o = [];
      for (const i of e.children) this.isLargeCoordinateModel(i) && (t = !0, o.push({
        name: i.name || i.userData?.filePath || "unnamed",
        position: i.position
      }));
      return o.length > 0 && console.log("[LargeCoordinateGuard] 发现大坐标模型:", o), t;
    }
    static checkOperationAllowed(e, t, o) {
      if (!this.hasLargeCoordinateModels(t)) return {
        allowed: !1,
        reason: "当前是小坐标状态，请先加载大坐标模型或切换到大坐标模式"
      };
      if (e.mercatorProjectionManager) {
        const i = e.mercatorProjectionManager.getFloorCenter();
        if (!i || i.x === 0 && i.y === 0 && i.z === 0) return {
          allowed: !1,
          reason: "地板中心未正确初始化，请等待 Cesium 初始化完成或手动设置 floorCenter"
        };
      }
      return { allowed: !0 };
    }
    static showBlockedMessage(e, t) {
      const o = {
        rotate: "翻转",
        pan: "平移"
      };
      if (console.warn(`[LargeCoordinateGuard] ⛔ ${o[e] || e}操作被阻止`), console.warn(`[LargeCoordinateGuard] 原因: ${t}`), console.warn("[LargeCoordinateGuard] 建议: 请先加载大坐标模型或切换到大坐标模式"), typeof document < "u") {
        const i = new CustomEvent("ShowNotification", { detail: {
          type: "warning",
          title: `${o[e] || e}操作被限制`,
          message: t,
          duration: 3e3
        } });
        document.dispatchEvent(i);
      }
    }
    static validateCoordinateConversion(e, t) {
      if (!e || !t) return;
      const o = t.position, i = e.threeToMercator(o.x, o.y, o.z), n = e.mercatorToThree(i.x, i.y, i.z), r = {
        x: Math.abs(o.x - n.x),
        y: Math.abs(o.y - n.y),
        z: Math.abs(o.z - n.z)
      }, a = r.x < 1e-3 && r.y < 1e-3 && r.z < 1e-3;
      return console.log("[LargeCoordinateGuard] 坐标转换验证:", {
        original: `(${o.x.toFixed(2)}, ${o.y.toFixed(2)}, ${o.z.toFixed(2)})`,
        mercator: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
        back: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`,
        loss: `(${r.x.toFixed(6)}, ${r.y.toFixed(6)}, ${r.z.toFixed(6)})`,
        valid: a ? "✅" : "❌"
      }), a;
    }
  };
})), xe, ye = re((() => {
  Ge(), ct(), xe = class {
    constructor(e) {
      this.syncManager = e, this.detector = Be, this.operationType = null, this.mode = null, this._largeCoordCheckCache = {
        timestamp: 0,
        result: null
      };
    }
    getOperationLock() {
      return typeof window < "u" && window.cesiumDualSync ? window.cesiumDualSync.getOperationLock?.() || {
        locked: !1,
        operationType: null,
        mode: null,
        lockStartTime: 0,
        lockTimeout: 3e3
      } : {
        locked: !1,
        operationType: null,
        mode: null,
        lockStartTime: 0,
        lockTimeout: 3e3
      };
    }
    setOperationLock(e, t) {
      console.log(`[BaseOperationHandler.setOperationLock] 被调用，operationType: ${e}, mode: ${t}, this.operationType (设置前): ${this.operationType}`), typeof window < "u" && window.cesiumDualSync && window.cesiumDualSync.setOperationLock?.(e, t), this.operationType = e, this.mode = t, console.log(`[BaseOperationHandler.setOperationLock] 设置完成，this.operationType (设置后): ${this.operationType}`);
    }
    releaseOperationLock(e, t) {
      typeof window < "u" && window.cesiumDualSync && window.cesiumDualSync.releaseOperationLock?.(e, t), this.mode = null;
    }
    isLocked() {
      return this.getOperationLock().locked;
    }
    canExecute(e, t) {
      const o = this.getOperationLock();
      return o.locked ? Date.now() - o.lockStartTime > o.lockTimeout ? (this.releaseOperationLock(o.operationType, o.mode), !0) : o.operationType === e && o.mode === t : !0;
    }
    getCameraPosition() {
      return this.syncManager.unifiedCameraState.position;
    }
    getCurrentMode() {
      const e = this.getCameraPosition();
      return this.detector.getSurfaceMode(e);
    }
    beforeOperation(e) {
      !e && this.operationType && (e = this.operationType);
      const t = this.getCurrentMode();
      if (!this.canExecute(e, t))
        return console.warn(`[BaseOperationHandler] 操作被锁定: ${e} / ${t}`), null;
      if (e === "rotate" || e === "pan") {
        const o = this._checkLargeCoordinateState(e);
        if (!o.allowed)
          return De.showBlockedMessage(e, o.reason), null;
      }
      return this.setOperationLock(e, t), {
        operationType: e,
        mode: t,
        timestamp: Date.now()
      };
    }
    _checkLargeCoordinateState(e) {
      const t = Date.now();
      if (this._largeCoordCheckCache.result && t - this._largeCoordCheckCache.timestamp < 1e3) return this._largeCoordCheckCache.result;
      const o = this._getModelGroup();
      if (!o) {
        const n = {
          allowed: !0,
          reason: null
        };
        return this._largeCoordCheckCache = {
          timestamp: t,
          result: n
        }, n;
      }
      const i = De.checkOperationAllowed({ mercatorProjectionManager: this.syncManager?.mercatorProjection }, o, e);
      return this._largeCoordCheckCache = {
        timestamp: t,
        result: i
      }, i;
    }
    _getModelGroup() {
      return typeof window < "u" && window.DualCanvasViewer ? window.DualCanvasViewer.modelGroup1 || null : typeof window < "u" && window.__dualCanvasViewer__ && window.__dualCanvasViewer__.modelGroup1 || null;
    }
    afterOperation(e) {
      e && this.releaseOperationLock(e.operationType, e.mode);
    }
    validateInput(e, t) {
      return typeof e != "number" || !isFinite(e) || isNaN(e) ? (console.warn(`[BaseOperationHandler] 无效的参数 ${t}:`, e), !1) : !0;
    }
    validatePosition(e) {
      return !e || typeof e.x != "number" || typeof e.y != "number" || typeof e.z != "number" ? (console.warn("[BaseOperationHandler] 无效的位置对象:", e), !1) : !isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z) ? (console.warn("[BaseOperationHandler] 位置坐标包含无效值:", e), !1) : !0;
    }
    vectorLength(e) {
      return Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    }
    normalize(e) {
      const t = this.vectorLength(e);
      return t < 1e-4 ? {
        x: 0,
        y: 1,
        z: 0
      } : {
        x: e.x / t,
        y: e.y / t,
        z: e.z / t
      };
    }
    dot(e, t) {
      return e.x * t.x + e.y * t.y + e.z * t.z;
    }
    cross(e, t) {
      return {
        x: e.y * t.z - e.z * t.y,
        y: e.z * t.x - e.x * t.z,
        z: e.x * t.y - e.y * t.x
      };
    }
    rotateAroundAxis(e, t, o) {
      const i = Math.cos(o), n = Math.sin(o), r = this.cross(t, e), a = this.dot(t, e);
      return {
        x: e.x * i + r.x * n + t.x * a * (1 - i),
        y: e.y * i + r.y * n + t.y * a * (1 - i),
        z: e.z * i + r.z * n + t.z * a * (1 - i)
      };
    }
    execute(...e) {
      throw new Error("子类必须实现 execute 方法");
    }
  };
})), Te, je = re((() => {
  ye(), Te = class extends xe {
    constructor(e) {
      super(e), this.threeCamera = null, this.threeControls = null;
    }
    setThreeObjects(e, t) {
      this.threeCamera = e, this.threeControls = t;
    }
    getThreeCamera() {
      return this.threeCamera;
    }
    getThreeControls() {
      return this.threeControls;
    }
    performThreeJSOperation(...e) {
      throw new Error("子类必须实现 performThreeJSOperation 方法");
    }
    execute(...e) {
      if (!this.threeCamera || !this.threeControls)
        return console.error("[ThreeJSOperationHandler] Three.js 对象未设置"), !1;
      const t = this.beforeOperation(this.operationType);
      if (!t) return !1;
      try {
        return this.performThreeJSOperation(...e);
      } catch (o) {
        return console.error(`[${this.constructor.name}] 操作失败:`, o), !1;
      } finally {
        this.afterOperation(t);
      }
    }
    getCameraDirection() {
      if (!this.threeCamera) return new h.Vector3(0, 0, -1);
      const e = new h.Vector3();
      return this.threeCamera.getWorldDirection(e), e;
    }
    getCameraRight() {
      if (!this.threeCamera) return new h.Vector3(1, 0, 0);
      const e = new h.Vector3();
      return this.threeCamera.getWorldDirection(e), e.cross(this.threeCamera.up).normalize(), e;
    }
    getDistanceToTarget() {
      return !this.threeCamera || !this.threeControls ? 0 : this.threeCamera.position.distanceTo(this.threeControls.target);
    }
    isReady() {
      return this.threeCamera !== null && this.threeControls !== null;
    }
  };
})), dt, Rt = re((() => {
  je(), dt = class extends Te {
    constructor(e) {
      super(e), this.operationType = "pan";
    }
    performThreeJSOperation(e, t, o) {
      const i = this.getThreeCamera(), n = this.getThreeControls();
      if (!i || !n) return !1;
      const r = this.syncManager.mouseOperationParams.panSpeed || 1, a = e * o * r, s = t * o * r;
      if (Math.abs(a) > 1e-3) {
        const c = new h.Vector3();
        i.getWorldDirection(c), c.cross(i.up).normalize();
        const l = c.clone().multiplyScalar(a);
        i.position.add(l), n.target.add(l);
      }
      if (Math.abs(s) > 1e-3) {
        const c = new h.Vector3();
        i.getWorldDirection(c);
        const l = new h.Vector3(c.x, 0, c.z);
        l.length() > 1e-3 ? l.normalize() : l.set(0, 0, -1);
        const g = -s, u = l.clone().multiplyScalar(g);
        i.position.x += u.x, i.position.z += u.z, n.target.x += u.x, n.target.z += u.z;
      }
      return !0;
    }
  };
})), ht, kt = re((() => {
  je(), ht = class extends Te {
    constructor(e) {
      super(e), this.operationType = "zoom";
    }
    performThreeJSOperation(e) {
      const t = this.getThreeCamera(), o = this.getThreeControls();
      if (!t || !o) return !1;
      const i = 1 + e * (this.syncManager.mouseOperationParams.zoomSpeed || 0.1), n = new h.Vector3();
      t.getWorldDirection(n);
      const r = t.position.distanceTo(o.target), a = r / i, s = r - Math.max(10, Math.min(5e4, a)), c = n.clone().multiplyScalar(s);
      return t.position.add(c), !0;
    }
  };
})), _e, Xe = re((() => {
  ye(), ct(), _e = class extends xe {
    constructor(e) {
      super(e), this.operationType = "rotate", this._largeCoordCheckCache = {
        timestamp: 0,
        result: null
      };
    }
    execute(e, t) {
      if (!this.validateInput(e, "deltaX") || !this.validateInput(t, "deltaY")) return !1;
      const o = this._checkLargeCoordinateState();
      if (!o.allowed)
        return De.showBlockedMessage("rotate", o.reason), !1;
      const i = this.beforeOperation(this.operationType);
      if (!i) return !1;
      try {
        return this.performRotation(e, t), !0;
      } catch (n) {
        return console.error("[UnifiedRotationHandler] 翻转操作失败:", n), !1;
      } finally {
        this.afterOperation(i);
      }
    }
    _checkLargeCoordinateState() {
      const e = Date.now();
      if (this._largeCoordCheckCache.result && e - this._largeCoordCheckCache.timestamp < 1e3) return this._largeCoordCheckCache.result;
      const t = this._getModelGroup();
      if (!t) {
        const i = {
          allowed: !0,
          reason: null
        };
        return this._largeCoordCheckCache = {
          timestamp: e,
          result: i
        }, i;
      }
      const o = De.checkOperationAllowed({ mercatorProjectionManager: this.syncManager?.mercatorProjection }, t, "rotate");
      return this._largeCoordCheckCache = {
        timestamp: e,
        result: o
      }, o;
    }
    _getModelGroup() {
      return typeof window < "u" && window.DualCanvasViewer ? window.DualCanvasViewer.modelGroup1 || null : typeof window < "u" && window.__dualCanvasViewer__ && window.__dualCanvasViewer__.modelGroup1 || null;
    }
    performRotation(e, t) {
      throw new Error("子类必须实现 performRotation 方法");
    }
    getRotateSpeed() {
      return this.syncManager.mouseOperationParams.rotateSpeed || 1e-3;
    }
    calculatePitchAngle(e) {
      return e * this.getRotateSpeed();
    }
    calculateYawAngle(e) {
      return e * this.getRotateSpeed();
    }
    isVerticalView(e) {
      const t = this.dot(e, {
        x: 0,
        y: 1,
        z: 0
      });
      return Math.abs(t) > 0.999;
    }
    isLookingDown(e) {
      return e.y < 0;
    }
    isNearlyVerticalDown(e) {
      const t = this.dot(e, {
        x: 0,
        y: 1,
        z: 0
      });
      return this.isLookingDown(e) && Math.abs(t) > 0.9;
    }
    pitch(e, t, o) {
      return this.isVerticalView(e) ? this.rotateAroundAxis(e, {
        x: 1,
        y: 0,
        z: 0
      }, -t) : this.rotateAroundAxis(e, o, -t);
    }
    yaw(e, t, o, i) {
      return this.isVerticalView(e) ? this.rotateAroundAxis(e, {
        x: 0,
        y: 0,
        z: 1
      }, -t) : this.isNearlyVerticalDown(e) ? this.rotateAroundAxis(e, i, -t) : this.rotateAroundAxis(e, o, -t);
    }
    rebuildOrthonormalBasis(e) {
      e.direction = this.normalize(e.direction);
      let t = this.cross(e.direction, e.up);
      this.vectorLength(t) < 1e-3 ? (t = this.cross(e.direction, {
        x: 1,
        y: 0,
        z: 0
      }), this.vectorLength(t) < 1e-3 && (t = this.cross(e.direction, {
        x: 0,
        y: 0,
        z: 1
      })), e.right = this.normalize(t)) : e.right = this.normalize(t), e.up = this.normalize(this.cross(e.right, e.direction));
    }
    updateCameraPosition(e) {
      const t = e.height;
      e.position = {
        x: e.target.x + e.direction.x * t,
        y: e.target.y + e.direction.y * t,
        z: e.target.z + e.direction.z * t
      };
    }
    fixTargetY(e, t) {
      t || (e.target.y = 0);
    }
  };
})), ut, Nt = re((() => {
  Xe(), ut = class extends _e {
    constructor(e) {
      super(e), this.mode = "surface";
    }
    performRotation(e, t) {
      const o = this.syncManager.unifiedCameraState;
      if (!o)
        return console.error("[SurfaceRotateHandler] 统一坐标系状态不可用"), !1;
      const i = o.position;
      if (this.detector.isUnderground(i))
        return console.warn("[SurfaceRotateHandler] 当前处于地下模式，不应使用地上翻转处理器"), !1;
      const n = { ...o.target };
      ({ ...o.direction });
      const r = this.calculatePitchAngle(t), a = this.calculateYawAngle(e), s = this.pitch(o.direction, r, o.right), c = this.yaw(s, a, o.up, o.right);
      o.direction = this.normalize(c), this.rebuildOrthonormalBasis(o);
      const l = {
        x: o.target.x + o.direction.x * o.height,
        y: o.target.y + o.direction.y * o.height,
        z: o.target.z + o.direction.z * o.height
      }, g = -30;
      return l.y < g ? (console.warn(`⚠️ [SurfaceRotateHandler] 翻转会导致位置过低 (${l.y.toFixed(1)} < ${g})，调整目标点`), o.target.y = g - o.direction.y * o.height) : o.target.y = n.y, this.updateCameraPosition(o), o.position.y < g && (console.error(`❌ [SurfaceRotateHandler] 位置修正失败！当前位置 ${o.position.y.toFixed(1)} 仍然低于阈值 ${g}`), o.position.y = g), !0;
    }
    canExecute() {
      const e = this.syncManager.unifiedCameraState;
      return !e || !e.position ? !1 : this.detector.isSurface(e.position);
    }
    getDescription() {
      return "地上翻转 - 使用统一坐标系和笛卡尔坐标计算";
    }
  };
})), gt, It = re((() => {
  Xe(), gt = class extends _e {
    constructor(e) {
      super(e), this.mode = "underground";
    }
    performRotation(e, t) {
      const o = this.syncManager.unifiedCameraState;
      if (!o)
        return console.error("[UndergroundRotateHandler] 统一坐标系状态不可用"), !1;
      const i = o.position;
      if (!this.detector.isUnderground(i))
        return console.warn("[UndergroundRotateHandler] 当前处于地上模式，不应使用地下翻转处理器"), !1;
      const n = { ...o.target };
      o.position.y;
      const r = this.calculatePitchAngle(t), a = this.calculateYawAngle(e);
      return o.direction = this.pitch(o.direction, r, o.right), o.direction = this.yaw(o.direction, a, o.up, o.right), o.direction = this.normalize(o.direction), this.rebuildOrthonormalBasis(o), o.target.y = n.y, this.updateCameraPosition(o), o.position.y > 0 && (console.warn("⚠️ [UndergroundRotateHandler] 翻转后位置变为正值，强制修正"), o.position.y = -Math.abs(o.position.y)), !0;
    }
    canExecute() {
      const e = this.syncManager.unifiedCameraState;
      return !e || !e.position ? !1 : this.detector.isUnderground(e.position);
    }
    getDescription() {
      return "地下翻转 - 使用统一坐标系和笛卡尔坐标计算";
    }
  };
})), We, mt = re((() => {
  ye(), We = class extends xe {
    constructor(e) {
      super(e), this.operationType = "rotate", this.mode = "camera-flip", this._spherical = {
        radius: 0,
        phi: 0,
        theta: 0
      }, this._sphericalDelta = {
        radius: 0,
        phi: 0,
        theta: 0
      }, this._cameraUp = new h.Vector3(0, 1, 0), this._quat = null, this._quatInverse = null, this._target = new h.Vector3(0, 0, 0), console.log("[CameraFlipRotationHandler] 历史版本相机翻转处理器已初始化");
    }
    shouldUseCameraFlip() {
      const e = this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() ?? this.syncManager?.mercatorProjectionManager?.isUsingLocalCoordinateSystem?.() ?? !1, t = typeof window < "u" && window.__cesiumViewer__ && window.__cesiumViewer__.scene?.globe, o = this._checkModelHasECEFData(), i = e || !t || !o;
      return console.log("[CameraFlipRotationHandler] 模式检测:", {
        isUsingLocalCoord: e,
        hasCesiumGlobe: t,
        hasECEFData: o,
        shouldUseCameraFlip: i
      }), i;
    }
    _checkModelHasECEFData() {
      const e = this._getSelectedModel();
      if (!e) return !1;
      const t = e.userData || {};
      return !!(t.ecefPosition || t.longitude !== void 0 || t.latitude !== void 0 || t.cartographic);
    }
    _getSelectedModel() {
      if (typeof window < "u") {
        if (window.DualCanvasViewer) return window.DualCanvasViewer.selectedModel1 || window.DualCanvasViewer.selectedModel2;
        if (window.__dualCanvasViewer__) return window.__dualCanvasViewer__.selectedModel1 || window.__dualCanvasViewer__.selectedModel2;
      }
      return null;
    }
    _initializeFromCameraState() {
      const e = this.syncManager.unifiedCameraState;
      if (!e)
        return console.error("[CameraFlipRotationHandler] 统一坐标系状态不可用"), !1;
      this._cameraUp.set(e.up.x, e.up.y, e.up.z), this._quat = new h.Quaternion().setFromUnitVectors(this._cameraUp, new h.Vector3(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._target.set(e.target.x, e.target.y, e.target.z);
      const t = new h.Vector3(e.position.x - e.target.x, e.position.y - e.target.y, e.position.z - e.target.z);
      return t.applyQuaternion(this._quat), this._spherical.radius = t.length(), this._spherical.phi = Math.acos(Math.max(-1, Math.min(1, t.y / this._spherical.radius))), this._spherical.theta = Math.atan2(t.x, t.z), console.log("[CameraFlipRotationHandler] 初始化完成:", {
        radius: this._spherical.radius.toFixed(2),
        phi: (this._spherical.phi * 180 / Math.PI).toFixed(1) + "°",
        theta: (this._spherical.theta * 180 / Math.PI).toFixed(1) + "°",
        cameraUp: `(${this._cameraUp.x.toFixed(3)}, ${this._cameraUp.y.toFixed(3)}, ${this._cameraUp.z.toFixed(3)})`
      }), !0;
    }
    execute(e, t) {
      if (!this.validateInput(e, "deltaX") || !this.validateInput(t, "deltaY")) return !1;
      if (!this.shouldUseCameraFlip())
        return console.warn("[CameraFlipRotationHandler] 当前不支持相机翻转模式，请使用统一坐标系旋转"), !1;
      const o = this.beforeOperation(this.operationType);
      if (!o) return !1;
      try {
        return this._initializeFromCameraState() ? (this.performRotation(e, t), this._applyRotationToCamera(), !0) : !1;
      } catch (i) {
        return console.error("[CameraFlipRotationHandler] 翻转操作失败:", i), !1;
      } finally {
        this.afterOperation(o);
      }
    }
    performRotation(e, t) {
      const o = this.getRotateSpeed(), i = -e * o, n = -t * o;
      this._sphericalDelta.theta += i, this._sphericalDelta.phi += n, this._applyRotationLimits(), this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi, this._spherical.phi = Math.max(1e-3, Math.min(Math.PI - 1e-3, this._spherical.phi)), console.log("[CameraFlipRotationHandler] 旋转增量:", {
        thetaDelta: (i * 180 / Math.PI).toFixed(2) + "°",
        phiDelta: (n * 180 / Math.PI).toFixed(2) + "°",
        newTheta: (this._spherical.theta * 180 / Math.PI).toFixed(1) + "°",
        newPhi: (this._spherical.phi * 180 / Math.PI).toFixed(1) + "°"
      });
    }
    _applyRotationLimits() {
      const e = this.syncManager.unifiedCameraState;
      if (!e) return;
      const t = e.position;
      if (this.detector.isUnderground(t)) this._sphericalDelta.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._sphericalDelta.phi));
      else {
        const o = Math.PI / 2 - 0.01;
        this._spherical.phi + this._sphericalDelta.phi > o && (this._sphericalDelta.phi = Math.max(0, o - this._spherical.phi));
      }
    }
    _applyRotationToCamera() {
      const e = this.syncManager.unifiedCameraState;
      if (!e) {
        console.error("[CameraFlipRotationHandler] 无法应用旋转：统一坐标系状态不可用");
        return;
      }
      const t = new h.Vector3().setFromSpherical(this._spherical.radius, this._spherical.phi, this._spherical.theta);
      t.applyQuaternion(this._quatInverse), e.position = {
        x: this._target.x + t.x,
        y: this._target.y + t.y,
        z: this._target.z + t.z
      }, e.direction = this.normalize({
        x: -t.x,
        y: -t.y,
        z: -t.z
      }), this.rebuildOrthonormalBasis(e), console.log("[CameraFlipRotationHandler] 旋转已应用到相机:", {
        position: `(${e.position.x.toFixed(1)}, ${e.position.y.toFixed(1)}, ${e.position.z.toFixed(1)})`,
        direction: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`
      });
    }
    getRotateSpeed() {
      return this.syncManager.mouseOperationParams.rotateSpeed || 1e-3;
    }
    getDescription() {
      return "历史版本相机翻转 - 基于相机up向量的本地坐标系旋转";
    }
    normalize(e) {
      if (!e || typeof e.x != "number") return {
        x: 0,
        y: 1,
        z: 0
      };
      const t = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
      return t < 1e-4 ? {
        x: 0,
        y: 1,
        z: 0
      } : {
        x: e.x / t,
        y: e.y / t,
        z: e.z / t
      };
    }
    rebuildOrthonormalBasis(e) {
      e.direction = this.normalize(e.direction);
      let t = this.cross(e.direction, e.up);
      this.vectorLength(t) < 1e-3 ? (t = this.cross(e.direction, {
        x: 1,
        y: 0,
        z: 0
      }), this.vectorLength(t) < 1e-3 && (t = this.cross(e.direction, {
        x: 0,
        y: 0,
        z: 1
      })), e.right = this.normalize(t)) : e.right = this.normalize(t), e.up = this.normalize(this.cross(e.right, e.direction));
    }
    cross(e, t) {
      return {
        x: e.y * t.z - e.z * t.y,
        y: e.z * t.x - e.x * t.z,
        z: e.x * t.y - e.y * t.x
      };
    }
    vectorLength(e) {
      return Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    }
    validateInput(e, t) {
      return typeof e != "number" || !isFinite(e) ? (console.warn(`[CameraFlipRotationHandler] 无效的${t}:`, e), !1) : !0;
    }
    beforeOperation(e) {
      const t = this.getCurrentMode();
      return this.canExecute(e, t) ? (this.setOperationLock(e, t), {
        operationType: e,
        mode: t,
        startTime: Date.now()
      }) : (console.warn(`[CameraFlipRotationHandler] 操作被锁定: ${e} / ${t}`), null);
    }
    afterOperation(e) {
      e && this.releaseOperationLock(e.operationType, e.mode);
    }
  };
})), pe, Me = re((() => {
  ye(), pe = class extends xe {
    constructor(e) {
      super(e), this.cesiumViewer = null, this.cesiumCamera = null, this.prerotationState = null, this.handlerOperationType = this.operationType;
    }
    setCesiumObjects(e, t) {
      this.cesiumViewer = e, this.cesiumCamera = t, this.handlerOperationType = this.operationType;
    }
    getCesiumViewer() {
      return this.cesiumViewer || (this.cesiumViewer = this.syncManager.cesiumViewer), this.cesiumViewer;
    }
    getCesiumCamera() {
      return !this.cesiumCamera && this.cesiumViewer && (this.cesiumCamera = this.cesiumViewer.camera), this.cesiumCamera;
    }
    getCesium() {
      return this.syncManager.getCesium();
    }
    savePrerotationState() {
      const e = this.getCesiumCamera();
      return e ? (this.prerotationState = {
        position: {
          x: e.position.x,
          y: e.position.y,
          z: e.position.z
        },
        direction: {
          x: e.direction.x,
          y: e.direction.y,
          z: e.direction.z
        },
        up: {
          x: e.up.x,
          y: e.up.y,
          z: e.up.z
        },
        right: {
          x: e.right.x,
          y: e.right.y,
          z: e.right.z
        }
      }, !0) : (console.error("[CesiumBasedOperationHandler] Cesium Camera 不可用"), !1);
    }
    restorePrerotationState() {
      const e = this.getCesiumCamera();
      return !e || !this.prerotationState ? !1 : (e.position.x = this.prerotationState.position.x, e.position.y = this.prerotationState.position.y, e.position.z = this.prerotationState.position.z, e.direction.x = this.prerotationState.direction.x, e.direction.y = this.prerotationState.direction.y, e.direction.z = this.prerotationState.direction.z, e.up.x = this.prerotationState.up.x, e.up.y = this.prerotationState.up.y, e.up.z = this.prerotationState.up.z, e.right.x = this.prerotationState.right.x, e.right.y = this.prerotationState.right.y, e.right.z = this.prerotationState.right.z, !0);
    }
    syncToUnifiedState() {
      const e = this.getCesiumCamera();
      if (!e) return !1;
      if (typeof this.syncManager._syncCesiumToUnified == "function") {
        const t = this.getCesiumViewer()?.scene;
        return this.syncManager._syncCesiumToUnified(e, t, !1), !0;
      }
      return !1;
    }
    syncToDualComponent() {
      return !0;
    }
    performCesiumOperation(...e) {
      throw new Error("子类必须实现 performCesiumOperation 方法");
    }
    execute(...e) {
      if (!this.getCesiumCamera())
        return console.error("[CesiumBasedOperationHandler] Cesium Camera 不可用"), !1;
      const t = this.handlerOperationType || this.operationType;
      console.log(`[CesiumBasedOperationHandler.execute] 开始执行，操作类型: ${t}, this.operationType: ${this.operationType}, handlerOperationType: ${this.handlerOperationType}, 类名: ${this.constructor.name}`), console.log("[CesiumBasedOperationHandler.execute] 调用 beforeOperation 之前");
      const o = this.beforeOperation(this.operationType);
      if (console.log(`[CesiumBasedOperationHandler.execute] beforeOperation 返回后，this.operationType: ${this.operationType}`), !o) return !1;
      let i = !1;
      try {
        return this.savePrerotationState(), i = this.performCesiumOperation(...e), console.log(`[CesiumBasedOperationHandler.execute] 操作结果: ${i}`), i && (console.log(`[CesiumBasedOperationHandler] 操作类型: ${t}`), console.log("[CesiumBasedOperationHandler] 调用 syncToUnifiedState"), this.syncToUnifiedState(), this.syncToDualComponent()), i;
      } catch (n) {
        return console.error(`[${this.constructor.name}] 操作失败:`, n), this.restorePrerotationState(), !1;
      } finally {
        if (console.log("[CesiumBasedOperationHandler.execute] finally 块，准备调用 afterOperation"), this.afterOperation(o), console.log(`[CesiumBasedOperationHandler.execute] afterOperation 返回后，this.operationType: ${this.operationType}`), i && typeof window < "u" && window.cesiumDualSync) {
          const n = Date.now() + 100;
          window.cesiumDualSync.setBlockSyncUntil(n), console.log("[CesiumBasedOperationHandler.execute] 已设置同步阻止时间: 100ms");
        }
      }
    }
    getCameraHeight() {
      const e = this.getCesiumCamera();
      if (!e) return 0;
      const t = this.getCesium();
      if (!t) return 0;
      try {
        return (this.getCesiumViewer()?.scene?.globe?.ellipsoid || t.Ellipsoid.WGS84).cartesianToCartographic(e.position).height;
      } catch (o) {
        return console.warn("[CesiumBasedOperationHandler] 获取相机高度失败:", o), 0;
      }
    }
    isCameraUnderground() {
      return this.getCameraHeight() < 0;
    }
    validateCameraPosition() {
      const e = this.getCesiumCamera();
      if (!e) return !1;
      const t = e.position;
      return t ? !isFinite(t.x) || !isFinite(t.y) || !isFinite(t.z) ? (console.warn("[CesiumBasedOperationHandler] 相机位置包含无效值:", {
        x: t.x,
        y: t.y,
        z: t.z
      }), !1) : !0 : (console.warn("[CesiumBasedOperationHandler] 相机位置不存在"), !1);
    }
    validateOperationArgs(e) {
      return e.every((t) => typeof t == "number" && isFinite(t) && !isNaN(t));
    }
    cleanup() {
      this.prerotationState = null;
    }
  };
})), Ye, ft = re((() => {
  Me(), Ye = class extends pe {
    constructor(e) {
      super(e), this.operationType = "zoom", this.mode = "surface", this.handlerOperationType = "zoom", console.log("[SurfaceZoomHandler] 构造函数调用，operationType:", this.operationType, "handlerOperationType:", this.handlerOperationType);
    }
    performCesiumOperation(e) {
      const t = this.getCesiumCamera();
      if (!t)
        return console.error("[SurfaceZoomHandler] Cesium Camera 不可用"), !1;
      if (!this.validateCameraPosition())
        return console.warn("[SurfaceZoomHandler] 相机位置无效，跳过缩放操作"), !1;
      if (this.isCameraUnderground())
        return console.warn("[SurfaceZoomHandler] 当前处于地下模式，不应使用地上缩放处理器"), !1;
      if (!this.validateInput(e, "deltaZoom")) return !1;
      const o = this.getCesium();
      if (!o)
        return console.error("[SurfaceZoomHandler] Cesium 不可用"), !1;
      try {
        const i = (this.syncManager.mouseOperationParams.zoomSpeed || 0.1) * 2e3, n = Math.abs(e) * i, r = {
          x: t.position.x,
          y: t.position.y,
          z: t.position.z
        }, a = o.Cartesian3.clone(t.direction), s = o.Cartesian3.clone(t.up), c = o.Cartesian3.clone(t.right), l = t.direction;
        if (e < 0) {
          const g = new o.Cartesian3();
          o.Cartesian3.add(t.position, o.Cartesian3.multiplyByScalar(l, n, new o.Cartesian3()), g), t.position = g;
        } else {
          const g = new o.Cartesian3();
          o.Cartesian3.add(t.position, o.Cartesian3.multiplyByScalar(l, -n, new o.Cartesian3()), g), t.position = g;
        }
        return t.direction = a, t.up = s, t.right = c, console.log("[SurfaceZoomHandler] 缩放操作:", {
          deltaZoom: e,
          zoomSpeed: i,
          amount: n,
          before: r,
          after: {
            x: t.position.x,
            y: t.position.y,
            z: t.position.z
          }
        }), !0;
      } catch (i) {
        return console.error("[SurfaceZoomHandler] 缩放操作失败:", i), !1;
      }
    }
    canExecute() {
      return this.getCesiumCamera() ? !this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地上缩放 - 使用 Cesium 原生 camera.zoom API";
    }
  };
})), Ke, Ct = re((() => {
  Me(), Ke = class extends pe {
    constructor(e) {
      super(e), this.operationType = "zoom", this.mode = "underground", this.handlerOperationType = "zoom", console.log("[UndergroundZoomHandler] 构造函数调用，operationType:", this.operationType, "handlerOperationType:", this.handlerOperationType);
    }
    performCesiumOperation(e) {
      const t = this.getCesiumCamera();
      if (!t)
        return console.error("[UndergroundZoomHandler] Cesium Camera 不可用"), !1;
      if (!this.validateCameraPosition())
        return console.warn("[UndergroundZoomHandler] 相机位置无效，跳过缩放操作"), !1;
      if (!this.isCameraUnderground())
        return console.warn("[UndergroundZoomHandler] 当前处于地上模式，不应使用地下缩放处理器"), !1;
      if (!this.validateInput(e, "deltaZoom")) return !1;
      const o = this.getCesium();
      if (!o)
        return console.error("[UndergroundZoomHandler] Cesium 不可用"), !1;
      try {
        const i = (this.syncManager.mouseOperationParams.zoomSpeed || 0.1) * 2e3, n = Math.abs(e) * i, r = {
          x: t.position.x,
          y: t.position.y,
          z: t.position.z
        }, a = o.Cartesian3.clone(t.direction), s = o.Cartesian3.clone(t.up), c = o.Cartesian3.clone(t.right), l = t.direction;
        if (e < 0) {
          const g = new o.Cartesian3();
          o.Cartesian3.add(t.position, o.Cartesian3.multiplyByScalar(l, n, new o.Cartesian3()), g), t.position = g;
        } else {
          const g = new o.Cartesian3();
          o.Cartesian3.add(t.position, o.Cartesian3.multiplyByScalar(l, -n, new o.Cartesian3()), g), t.position = g;
        }
        return t.direction = a, t.up = s, t.right = c, console.log("[UndergroundZoomHandler] 缩放操作:", {
          deltaZoom: e,
          zoomSpeed: i,
          amount: n,
          before: r,
          after: {
            x: t.position.x,
            y: t.position.y,
            z: t.position.z
          }
        }), !0;
      } catch (i) {
        return console.error("[UndergroundZoomHandler] 缩放操作失败:", i), !1;
      }
    }
    canExecute() {
      return this.getCesiumCamera() ? this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地下缩放 - 使用 Cesium 原生 camera.zoom API";
    }
  };
})), qe, xt = re((() => {
  Me(), qe = class extends pe {
    constructor(e) {
      super(e), this.operationType = "pan", this.mode = "surface";
    }
    performCesiumOperation(e, t, o) {
      const i = this.getCesiumCamera();
      if (!i)
        return console.error("[SurfacePanHandler] Cesium Camera 不可用"), !1;
      if (!this.validateCameraPosition())
        return console.warn("[SurfacePanHandler] 相机位置无效，跳过平移操作"), !1;
      if (this.isCameraUnderground())
        return console.warn("[SurfacePanHandler] 当前处于地下模式，不应使用地上平移处理器"), !1;
      if (!this.validateInput(e, "deltaX") || !this.validateInput(t, "deltaY") || !this.validateInput(o, "metersPerPixel")) return !1;
      const n = this.getCesium();
      if (!n)
        return console.error("[SurfacePanHandler] Cesium 不可用"), !1;
      try {
        const r = this.syncManager.mouseOperationParams.panSpeed || 1, a = e * o * r, s = t * o * r, c = n.Cartesian3.clone(i.direction), l = n.Cartesian3.clone(i.up), g = n.Cartesian3.clone(i.right), u = this.getCesiumViewer()?.scene?.globe?.ellipsoid || n.Ellipsoid.WGS84, d = u.cartesianToCartographic(i.position).height, m = u.geodeticSurfaceNormal(i.position, new n.Cartesian3()), p = n.Cartesian3.dot(i.right, m), x = new n.Cartesian3();
        n.Cartesian3.multiplyByScalar(m, p, x), n.Cartesian3.subtract(i.right, x, x), n.Cartesian3.normalize(x, x);
        const f = new n.Cartesian3();
        n.Cartesian3.normalize(i.direction, f);
        const C = n.Cartesian3.dot(f, m), M = new n.Cartesian3();
        n.Cartesian3.multiplyByScalar(m, C, M), n.Cartesian3.subtract(f, M, M), n.Cartesian3.normalize(M, M), console.log("[SurfacePanHandler] 平移向量:", {
          deltaX: e.toFixed(2),
          deltaY: t.toFixed(2),
          distanceX: a.toFixed(2),
          distanceY: s.toFixed(2),
          cameraRight: {
            x: i.right.x.toFixed(4),
            y: i.right.y.toFixed(4),
            z: i.right.z.toFixed(4)
          },
          horizontalRight: {
            x: x.x.toFixed(4),
            y: x.y.toFixed(4),
            z: x.z.toFixed(4)
          },
          cameraUp: {
            x: i.up.x.toFixed(4),
            y: i.up.y.toFixed(4),
            z: i.up.z.toFixed(4)
          },
          earthUp: {
            x: m.x.toFixed(4),
            y: m.y.toFixed(4),
            z: m.z.toFixed(4)
          }
        });
        const y = new n.Cartesian3(), w = new n.Cartesian3();
        a !== 0 && (n.Cartesian3.multiplyByScalar(x, a, w), n.Cartesian3.add(i.position, w, y), i.position = y), s !== 0 && (n.Cartesian3.multiplyByScalar(M, -s, w), n.Cartesian3.add(i.position, w, y), i.position = y);
        const V = u.cartesianToCartographic(i.position), S = new n.Cartographic(V.longitude, V.latitude, d);
        i.position = u.cartographicToCartesian(S);
        const T = u.cartesianToCartographic(i.position);
        return console.log("[SurfacePanHandler] 平移高度:", {
          保存: d.toFixed(3),
          恢复后: T.height.toFixed(3),
          差异: (T.height - d).toFixed(6)
        }), i.direction = c, i.up = l, i.right = g, !0;
      } catch (r) {
        return console.error("[SurfacePanHandler] 平移操作失败:", r), !1;
      }
    }
    canExecute() {
      return this.getCesiumCamera() ? !this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地上平移 - 使用 Cesium 原生 camera.move* API，上下平移沿水平面";
    }
  };
})), Ze, pt = re((() => {
  Me(), Ze = class extends pe {
    constructor(e) {
      super(e), this.operationType = "pan", this.mode = "underground";
    }
    performCesiumOperation(e, t, o) {
      const i = this.getCesiumCamera();
      if (!i)
        return console.error("[UndergroundPanHandler] Cesium Camera 不可用"), !1;
      if (!this.validateCameraPosition())
        return console.warn("[UndergroundPanHandler] 相机位置无效，跳过平移操作"), !1;
      if (!this.isCameraUnderground())
        return console.warn("[UndergroundPanHandler] 当前处于地上模式，不应使用地下平移处理器"), !1;
      if (!this.validateInput(e, "deltaX") || !this.validateInput(t, "deltaY") || !this.validateInput(o, "metersPerPixel")) return !1;
      const n = this.getCesium();
      if (!n)
        return console.error("[UndergroundPanHandler] Cesium 不可用"), !1;
      try {
        const r = this.syncManager.mouseOperationParams.panSpeed || 1, a = e * o * r, s = t * o * r, c = n.Cartesian3.clone(i.direction), l = n.Cartesian3.clone(i.up), g = n.Cartesian3.clone(i.right), u = this.getCesiumViewer()?.scene?.globe?.ellipsoid || n.Ellipsoid.WGS84, d = u.cartesianToCartographic(i.position).height, m = u.geodeticSurfaceNormal(i.position, new n.Cartesian3()), p = n.Cartesian3.dot(i.right, m), x = new n.Cartesian3();
        if (n.Cartesian3.multiplyByScalar(m, p, x), n.Cartesian3.subtract(i.right, x, x), n.Cartesian3.normalize(x, x), a !== 0 && (n.Cartesian3.add(i.position, n.Cartesian3.multiplyByScalar(x, a, new n.Cartesian3()), newPosition), i.position = newPosition), s !== 0) {
          const M = new n.Cartesian3();
          n.Cartesian3.normalize(i.direction, M);
          const y = n.Cartesian3.dot(M, m), w = new n.Cartesian3();
          n.Cartesian3.multiplyByScalar(m, y, w), n.Cartesian3.subtract(M, w, w), n.Cartesian3.normalize(w, w), n.Cartesian3.add(i.position, n.Cartesian3.multiplyByScalar(w, -s, new n.Cartesian3()), newPosition), i.position = newPosition;
        }
        const f = u.cartesianToCartographic(i.position), C = new n.Cartographic(f.longitude, f.latitude, d);
        return i.position = u.cartographicToCartesian(C), i.direction = c, i.up = l, i.right = g, !0;
      } catch (r) {
        return console.error("[UndergroundPanHandler] 平移操作失败:", r), !1;
      }
    }
    canExecute() {
      return this.getCesiumCamera() ? this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地下平移 - 使用 Cesium 原生 camera.move* API，上下平移沿水平面";
    }
  };
})), ke, wt, yt, Ut = re((() => {
  Me(), ke = class extends pe {
    constructor(e) {
      super(e), this.operationType = "rotate", this.handlerOperationType = "rotate";
    }
    performCesiumOperation(e, t) {
      const o = this.getCesiumCamera();
      if (!o)
        return console.error("[CesiumRotateHandler] Cesium Camera 不可用"), !1;
      const i = this.getCesium();
      if (!i)
        return console.error("[CesiumRotateHandler] Cesium 不可用"), !1;
      if (!this.validateCameraPosition())
        return console.warn("[CesiumRotateHandler] 相机位置无效，跳过旋转操作"), !1;
      if (!this.validateInput(e, "deltaX") || !this.validateInput(t, "deltaY")) return !1;
      try {
        const n = this.syncManager.mouseOperationParams.rotateSpeed || 1e-3, r = e * n, a = t * n, s = this.getCesiumViewer()?.scene?.globe?.ellipsoid || i.Ellipsoid.WGS84;
        if (!this.validateCartesian3(o.direction) || !this.validateCartesian3(o.right))
          return console.warn("[CesiumRotateHandler] 相机方向向量无效，重置相机方向"), this.resetCameraOrientation(o), !1;
        let c;
        try {
          const l = new i.Ray(o.position, o.direction), g = i.IntersectionTests.rayEllipsoid(l, s);
          if (i.defined(g) && this.validateCartesian3(g)) c = g;
          else {
            const u = s.cartesianToCartographic(o.position);
            if (!u || !isFinite(u.longitude) || !isFinite(u.latitude))
              return console.warn("[CesiumRotateHandler] 无法计算地理坐标，跳过旋转"), !1;
            c = s.cartographicToCartesian(new i.Cartographic(u.longitude, u.latitude, 0));
          }
        } catch (l) {
          return console.warn("[CesiumRotateHandler] 计算目标点失败:", l), !1;
        }
        if (this.validateCartesian3(c) || (console.warn("[CesiumRotateHandler] 目标点无效，使用相机位置作为旋转中心"), c = i.Cartesian3.clone(o.position, new i.Cartesian3())), Math.abs(a) > 1e-4 && (this.validateCartesian3(o.right) ? this.rotateAroundPoint(o, c, o.right, a) : console.warn("[CesiumRotateHandler] 右向量无效，跳过俯仰旋转")), Math.abs(r) > 1e-4) {
          let l;
          try {
            l = s.geodeticSurfaceNormal(o.position, new i.Cartesian3());
          } catch (g) {
            console.warn("[CesiumRotateHandler] 计算地表面法线失败:", g), l = new i.Cartesian3(0, 1, 0);
          }
          this.validateCartesian3(l) || (console.warn("[CesiumRotateHandler] 世界上向量无效，使用默认值"), l = new i.Cartesian3(0, 1, 0)), this.rotateAroundPoint(o, c, l, r);
        }
        return !0;
      } catch (n) {
        return console.error("[CesiumRotateHandler] 旋转操作失败:", n), !1;
      }
    }
    rotateAroundPoint(e, t, o, i) {
      const n = this.getCesium();
      if (!this.validateCartesian3(t) || !this.validateCartesian3(o))
        return console.warn("[CesiumRotateHandler] 旋转参数无效，跳过旋转"), !1;
      const r = new n.Cartesian3();
      n.Cartesian3.subtract(e.position, t, r);
      const a = new n.Matrix3();
      if (typeof n.Matrix3.fromAxisAngle == "function") n.Matrix3.fromAxisAngle(o, i, a);
      else {
        const d = n.Quaternion.fromAxisAngle(o, i);
        n.Matrix3.fromQuaternion(d, a);
      }
      const s = new n.Cartesian3();
      n.Matrix3.multiplyByVector(a, r, s);
      const c = new n.Cartesian3();
      if (n.Cartesian3.add(t, s, c), !this.isFiniteCartesian3(c))
        return console.warn("[CesiumRotateHandler] 旋转后位置无效，跳过此次旋转"), !1;
      e.position = c;
      const l = new n.Cartesian3();
      n.Matrix3.multiplyByVector(a, e.direction, l), n.Cartesian3.normalize(l, l), e.direction = l;
      const g = new n.Cartesian3();
      n.Matrix3.multiplyByVector(a, e.up, g), n.Cartesian3.normalize(g, g), e.up = g;
      const u = new n.Cartesian3();
      return n.Cartesian3.cross(e.direction, e.up, u), n.Cartesian3.magnitude(u) < 1e-4 ? (console.warn("[CesiumRotateHandler] 方向和上向量平行，重新构建正交坐标系"), this.reorthogonalizeCamera(e)) : (n.Cartesian3.normalize(u, u), e.right = u), !0;
    }
    validateCartesian3(e) {
      return !e || typeof e.x != "number" || typeof e.y != "number" || typeof e.z != "number" ? !1 : isFinite(e.x) && isFinite(e.y) && isFinite(e.z);
    }
    isFiniteCartesian3(e) {
      return e ? isFinite(e.x) && isFinite(e.y) && isFinite(e.z) : !1;
    }
    reorthogonalizeCamera(e) {
      const t = this.getCesium(), o = new t.Cartesian3();
      t.Cartesian3.clone(e.direction, o);
      const i = new t.Cartesian3();
      Math.abs(o.x) < 0.9 ? (i.x = 1, i.y = 0, i.z = 0) : (i.x = 0, i.y = 1, i.z = 0);
      const n = new t.Cartesian3();
      t.Cartesian3.cross(o, i, n), t.Cartesian3.normalize(n, n), e.right = n;
      const r = new t.Cartesian3();
      t.Cartesian3.cross(n, o, r), t.Cartesian3.normalize(r, r), e.up = r;
    }
    resetCameraOrientation(e) {
      const t = this.getCesium(), o = new t.Cartesian3();
      t.Cartesian3.negate(e.position, o), t.Cartesian3.normalize(o, o), e.direction = o, e.up = new t.Cartesian3(0, 1, 0);
      const i = new t.Cartesian3();
      t.Cartesian3.cross(e.direction, e.up, i), t.Cartesian3.normalize(i, i), e.right = i, console.warn("[CesiumRotateHandler] 相机方向已重置为默认值");
    }
    canExecute() {
      return !!this.getCesiumCamera();
    }
    getDescription() {
      return "Cesium 原生旋转 - 直接操作 Cesium 相机";
    }
  }, wt = class extends ke {
    constructor(e) {
      super(e), this.mode = "surface";
    }
    canExecute() {
      return this.getCesiumCamera() ? !this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地上旋转 - Cesium 原生 API";
    }
  }, yt = class extends ke {
    constructor(e) {
      super(e), this.mode = "underground";
    }
    canExecute() {
      return this.getCesiumCamera() ? this.isCameraUnderground() : !1;
    }
    getDescription() {
      return "地下旋转 - Cesium 原生 API";
    }
  };
})), Mt, Ht = re((() => {
  Ge(), ye(), Ut(), ft(), Ct(), xt(), pt(), mt(), Mt = class {
    constructor(e) {
      this.syncManager = e, this.detector = new Se(), console.log("[OperationRouter] 构造函数调用，开始创建处理器实例"), this.handlers = {
        surfaceRotate: new wt(e),
        undergroundRotate: new yt(e),
        cameraFlipRotate: new We(e),
        surfaceZoom: new Ye(e),
        undergroundZoom: new Ke(e),
        surfacePan: new qe(e),
        undergroundPan: new Ze(e)
      }, console.log("[OperationRouter] 处理器实例已创建，检查 surfaceZoom.operationType:", this.handlers.surfaceZoom.operationType);
    }
    updateCesiumObjects() {
      const e = this.syncManager.cesiumViewer, t = e?.camera;
      return !e || !t ? (console.warn("[OperationRouter] Cesium Viewer 或 Camera 不可用，跳过更新"), !1) : (Object.values(this.handlers).forEach((o) => {
        typeof o.setCesiumObjects == "function" && o.setCesiumObjects(e, t);
      }), console.log("[OperationRouter] 所有处理器的 Cesium 对象已更新"), !0);
    }
    getCurrentMode() {
      const e = this.syncManager.unifiedCameraState?.position;
      return e ? this.detector.getSurfaceMode(e) : "surface";
    }
    routeRotate(e, t, o = !1) {
      const i = this.handlers.cameraFlipRotate;
      return o || i && i.shouldUseCameraFlip() ? (console.log("[OperationRouter] 使用历史版本相机翻转模式"), i.execute(e, t)) : this.getCurrentMode() === "underground" ? this.handlers.undergroundRotate.execute(e, t) : this.handlers.surfaceRotate.execute(e, t);
    }
    shouldUseCameraFlipRotation() {
      const e = this.handlers.cameraFlipRotate;
      return e && e.shouldUseCameraFlip();
    }
    routeZoom(e) {
      return this.syncManager.mercatorProjection.isUsingLocalCoordinateSystem && this.syncManager.mercatorProjection.isUsingLocalCoordinateSystem() ? (console.log("[OperationRouter] 局部坐标系模式：使用 SyncManager 专用缩放逻辑"), this.syncManager.handleZoomInUnified(e)) : this.getCurrentMode() === "underground" ? this.handlers.undergroundZoom.execute(e) : this.handlers.surfaceZoom.execute(e);
    }
    routePan(e, t, o) {
      return this.getCurrentMode() === "underground" ? this.handlers.undergroundPan.execute(e, t, o) : this.handlers.surfacePan.execute(e, t, o);
    }
    registerHandler(e, t) {
      return t instanceof xe ? (this.handlers[e] = t, console.log(`[OperationRouter] 处理器已注册: ${e}`), !0) : (console.error("[OperationRouter] 处理器必须继承自 BaseOperationHandler"), !1);
    }
    getHandler(e) {
      return this.handlers[e] || null;
    }
    getAllHandlers() {
      return { ...this.handlers };
    }
    isHandlerAvailable(e) {
      return this.handlers[e] !== null && this.handlers[e] !== void 0;
    }
    getAvailableOperations() {
      const e = [];
      return this.isHandlerAvailable("surfaceRotate") && this.isHandlerAvailable("undergroundRotate") && e.push("rotate"), this.isHandlerAvailable("surfaceZoom") && this.isHandlerAvailable("undergroundZoom") && e.push("zoom"), this.isHandlerAvailable("surfacePan") && this.isHandlerAvailable("undergroundPan") && e.push("pan"), e;
    }
    getState() {
      return {
        currentMode: this.getCurrentMode(),
        availableOperations: this.getAvailableOperations(),
        registeredHandlers: Object.keys(this.handlers).filter((e) => this.isHandlerAvailable(e))
      };
    }
  };
})), Ot = /* @__PURE__ */ bt({
  BaseOperationHandler: () => xe,
  CameraFlipRotationHandler: () => We,
  CesiumBasedOperationHandler: () => pe,
  OperationRouter: () => Mt,
  SurfaceModeDetector: () => Se,
  SurfacePanHandler: () => qe,
  SurfaceRotateHandler: () => ut,
  SurfaceZoomHandler: () => Ye,
  ThreeJSOperationHandler: () => Te,
  ThreeJSPanHandler: () => dt,
  ThreeJSZoomHandler: () => ht,
  UndergroundPanHandler: () => Ze,
  UndergroundRotateHandler: () => gt,
  UndergroundZoomHandler: () => Ke,
  UnifiedRotationHandler: () => _e,
  surfaceModeDetector: () => Be
}), Bt = re((() => {
  Ge(), ye(), je(), Rt(), kt(), Xe(), Nt(), It(), mt(), Me(), ft(), Ct(), xt(), pt(), Ht();
}));
console.log("[SyncManager] 导入的 mercatorProjectionManager:", {
  mercatorProjectionManager: de,
  类型: typeof de,
  constructorName: de?.constructor?.name,
  原型方法: Object.getOwnPropertyNames(Object.getPrototypeOf(de || {})),
  有setDualFloorHeight: typeof de?.setDualFloorHeight == "function",
  有getCurrentFloorHeight: typeof de?.getCurrentFloorHeight == "function"
});
var Ne = null;
async function Gt() {
  if (!Ne) try {
    Ne = (await Promise.resolve().then(() => (Bt(), Ot))).OperationRouter;
  } catch (e) {
    console.warn("[SyncManager] OperationRouter not available:", e.message);
  }
  return Ne;
}
var me = class {
  static normalize(e) {
    if (!e || typeof e.x != "number" || typeof e.y != "number" || typeof e.z != "number") return {
      x: 0,
      y: 1,
      z: 0
    };
    if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z)) return {
      x: 0,
      y: 1,
      z: 0
    };
    const t = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    return t < 1e-4 ? {
      x: 0,
      y: 1,
      z: 0
    } : {
      x: e.x / t,
      y: e.y / t,
      z: e.z / t
    };
  }
  static cross(e, t) {
    return {
      x: e.y * t.z - e.z * t.y,
      y: e.z * t.x - e.x * t.z,
      z: e.x * t.y - e.y * t.x
    };
  }
  static dot(e, t) {
    return e.x * t.x + e.y * t.y + e.z * t.z;
  }
  static rotateAroundAxis(e, t, o) {
    const i = Math.cos(o), n = Math.sin(o), r = this.cross(t, e), a = this.dot(t, e);
    return {
      x: e.x * i + r.x * n + t.x * a * (1 - i),
      y: e.y * i + r.y * n + t.y * a * (1 - i),
      z: e.z * i + r.z * n + t.z * a * (1 - i)
    };
  }
}, jt = class {
  constructor(e) {
    this.syncManager = e, this.earthRadius = 6378137;
  }
  isUnderground(e) {
    const t = this.syncManager.getCesium();
    if (!t || !e) return !1;
    try {
      return (this.syncManager.cesiumViewer?.scene?.globe?.ellipsoid || t.Ellipsoid.WGS84).cartesianToCartographic(e.position).height < 0;
    } catch {
      return !1;
    }
  }
  isLookingDown(e) {
    return !e || !e.direction ? !1 : e.direction.y < 0;
  }
  mercatorToLatitude(e) {
    return 2 * Math.atan(Math.exp(Math.max(-20037508, Math.min(20037508, e)) / this.earthRadius)) - Math.PI / 2;
  }
  latitudeToMercator(e) {
    return Math.log(Math.tan(Math.PI / 4 + e / 2)) * this.earthRadius;
  }
}, Xt = class {
  constructor() {
    this.syncDepth = 0, this.throttleTimer = null, this.throttleDelay = 50, this.terrainNormalCache = {
      normal: null,
      position: null,
      lastUpdateTime: 0,
      updateInterval: 5e3,
      isValid: !1
    }, this.scale = 1, this.mercatorProjection = de, console.log("[ViewerSyncManager] mercatorProjection 已设置:", {
      mercatorProjection: this.mercatorProjection,
      类型: typeof this.mercatorProjection,
      constructorName: this.mercatorProjection?.constructor?.name,
      是函数: typeof this.mercatorProjection == "function",
      有SetDualFloorHeight: typeof this.mercatorProjection?.setDualFloorHeight == "function"
    }), this.Cesium = null, this.onCesiumToThreeSync = null, this.onThreeToCesiumSync = null, this.cesiumMouseMercator = {
      x: null,
      y: null,
      z: null
    }, this.unifiedCameraState = {
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      direction: {
        x: 0,
        y: -0.866,
        z: -0.5
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      right: {
        x: 1,
        y: 0,
        z: 0
      },
      height: 500,
      target: {
        x: 0,
        y: 0,
        z: 0
      }
    }, Pt(this.unifiedCameraState), this.mouseOperationParams = {
      rotateSpeed: 1e-3,
      panSpeed: 5,
      zoomSpeed: 0.1,
      minPanDistance: 0.01,
      maxPanDistance: 1e4
    }, this.operationState = {
      isDragging: !1,
      operationType: null,
      lastMousePos: {
        x: 0,
        y: 0
      },
      operationStartTime: 0
    }, this.disableThreeToCesiumSync = !1, this.surfaceHandler = new jt(this), this.cesiumViewer = null, this.operationRouter = null, this._initOperationRouter(), this.useNewArchitecture = !1, this.heightTracker = {
      history: [],
      maxHistorySize: 10,
      lastValidHeight: null,
      anomalyThreshold: 0.2,
      consecutiveAnomalies: 0,
      maxAnomalies: 3,
      lastSyncTime: 0,
      minSyncInterval: 100
    }, this._isSyncingFromDual = !1, this._syncCooldownTimer = null, this.onFloorCenterUpdate = null, this.floorCenterMercator = {
      x: 0,
      y: 0,
      z: 0
    }, this.mercatorProjection.setFloorCenter(this.floorCenterMercator), this.leftFlipProtection = {
      enabled: !1,
      until: 0
    };
  }
  async _initOperationRouter() {
    const e = await Gt();
    e && (this.operationRouter = new e(this));
  }
  setCesium(e) {
    this.Cesium = e, this.mercatorProjection.setCesium(e);
  }
  getCesium() {
    return this.Cesium ? this.Cesium : typeof window < "u" && window.Cesium ? window.Cesium : null;
  }
  isCesiumReady() {
    return this.getCesium() !== null;
  }
  setCesiumViewer(e) {
    this.cesiumViewer = e, this._setupCesiumMouseEvents();
  }
  _setupCesiumMouseEvents() {
    if (!this.cesiumViewer || !this.useNewArchitecture) {
      console.log("[SyncManager] 跳过设置 Cesium 鼠标事件（viewer 未就绪或新架构未启用）");
      return;
    }
    if (this._cesiumEventsSetup) {
      console.log("[SyncManager] Cesium 鼠标事件已设置");
      return;
    }
    const e = this.cesiumViewer.canvas;
    if (!e) {
      console.warn("[SyncManager] 无法设置 Cesium 鼠标事件：canvas 不可用");
      return;
    }
    console.log("[SyncManager] ✅ 设置 Cesium 鼠标事件监听器（操作路由器模式）"), this.operationRouter && typeof this.operationRouter.updateCesiumObjects == "function" ? (this.operationRouter.updateCesiumObjects(), console.log("[SyncManager] ✅ 已更新操作路由器的 Cesium 对象引用（同步）")) : (console.log("[SyncManager] ⏳ 操作路由器未就绪，等待初始化完成后更新..."), this._initOperationRouter().then(() => {
      this.operationRouter && typeof this.operationRouter.updateCesiumObjects == "function" ? (this.operationRouter.updateCesiumObjects(), console.log("[SyncManager] ✅ 已更新操作路由器的 Cesium 对象引用（异步）")) : console.warn("[SyncManager] ⚠️ 操作路由器初始化后仍不可用");
    }).catch((c) => {
      console.error("[SyncManager] ❌ 操作路由器初始化失败:", c);
    }));
    let t = !1, o = -1, i = {
      x: 0,
      y: 0
    };
    const n = (c) => {
      t = !0, o = c.button, i = {
        x: c.clientX,
        y: c.clientY
      }, console.log("[SyncManager] 鼠标按下:", { button: c.button });
    }, r = (c) => {
      if (!t) return;
      const l = c.clientX - i.x, g = c.clientY - i.y;
      if (o === 0 && (Math.abs(l) > 0.5 || Math.abs(g) > 0.5))
        console.log("[SyncManager] 检测到旋转操作:", {
          deltaX: l,
          deltaY: g
        }), this.handleRotate(l, g);
      else if ((o === 2 || o === 1) && (Math.abs(l) > 0.5 || Math.abs(g) > 0.5)) {
        const u = (this.unifiedCameraState.height || 500) / 1e3;
        console.log("[SyncManager] 检测到平移操作:", {
          deltaX: l,
          deltaY: g,
          metersPerPixel: u
        }), this.handlePan(l, g, u);
      }
      i = {
        x: c.clientX,
        y: c.clientY
      };
    }, a = () => {
      t = !1, o = -1;
    }, s = (c) => {
      c.preventDefault();
    };
    e.addEventListener("mousedown", n), e.addEventListener("mousemove", r), window.addEventListener("mouseup", a), e.addEventListener("contextmenu", s), this._cesiumMouseHandlers = {
      onMouseDown: n,
      onMouseMove: r,
      onMouseUp: a,
      onContextMenu: s
    }, this._cesiumEventsSetup = !0, console.log("[SyncManager] ✅ Cesium 鼠标事件监听器已设置完成");
  }
  setFloorCenter(e, t = null) {
    const o = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    if (o && (e.x !== 0 || e.y !== 0 || e.z !== 0)) {
      console.log("[SyncManager.setFloorCenter] ⚠️ 局部坐标系模式：拒绝设置非零地板中心", {
        尝试设置: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
        当前地板中心: "(0, 0, 0)",
        模型海拔: t !== null ? t.toFixed(2) + "米" : "未提供",
        原因: "局部坐标系模式下地板中心必须保持为原点，但需要保存模型海拔"
      }), this.mercatorProjection.setFloorCenter({
        x: 0,
        y: 0,
        z: 0
      }, t);
      return;
    }
    if (this.mercatorProjection.setFloorCenter(e, t), this.floorCenterMercator = this.mercatorProjection.getFloorCenter(), this.setOriginalFloorHeight(e.z || 0), o && this.mercatorProjection.modelAbsoluteMercator) {
      const i = this.mercatorProjection.isVirtualFloorCenterAlignedWithENU();
      console.log("[SyncManager.setFloorCenter] 虚拟地板中心对齐状态:", {
        dual地板中心: "(0, 0, 0)",
        ENU切点: `(${this.mercatorProjection.modelAbsoluteMercator.x.toFixed(2)}, ${this.mercatorProjection.modelAbsoluteMercator.y.toFixed(2)})`,
        对齐状态: i ? "✅ 已对齐" : "⚠️ 未对齐"
      });
    }
    this.onFloorCenterUpdate && typeof this.onFloorCenterUpdate == "function" && this.onFloorCenterUpdate(this.floorCenterMercator);
  }
  getFloorCenter() {
    return this.mercatorProjection.getFloorCenter();
  }
  hasValidFloorCenter() {
    return this.floorCenterMercator ? this.floorCenterMercator.x !== 0 || this.floorCenterMercator.y !== 0 || this.floorCenterMercator.z !== 0 : !1;
  }
  verifyVirtualFloorCenterAlignment() {
    if (!(this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem())) return !0;
    const e = this.mercatorProjection.isVirtualFloorCenterAlignedWithENU();
    return e || console.warn("[SyncManager] ⚠️ 虚拟地板中心与ENU切点对齐失效，可能影响同步精度"), e;
  }
  get originalFloorHeight() {
    return this.mercatorProjection.getOriginalFloorHeight();
  }
  setOriginalFloorHeight(e) {
    this.mercatorProjection.originalFloorHeight = e;
  }
  setPanSpeed(e) {
    this.mouseOperationParams.panSpeed = e;
  }
  setSyncCallbacks(e, t) {
    this.onCesiumToThreeSync = e, this.onThreeToCesiumSync = t;
  }
  async initENUForLocalCoordMode(e, t, o = 0) {
    if (console.log("[SyncManager] 🔄 轻量级 ENU 初始化（局部坐标系兼容模式）"), !this.isCesiumReady())
      return console.warn("[SyncManager] ⚠️ Cesium 未准备好，跳过 ENU/局部坐标系初始化"), !1;
    try {
      typeof window < "u" && window.Cesium && window.viewer && se.setCesium(window.Cesium, window.viewer);
      const i = e * Math.PI / 180, n = t * Math.PI / 180;
      if (!se.initializeAtPosition(i, n, o))
        return console.error("[SyncManager] ENU坐标系初始化失败"), !1;
      if (this.enuBasis = {
        east: { ...se.basis.east },
        north: { ...se.basis.north },
        up: { ...se.basis.up }
      }, this.enuOrigin = {
        longitude: e,
        latitude: t,
        height: o
      }, typeof window < "u" && window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
        const r = window.__dualCanvasViewerInstances[0];
        r && typeof r.rotateSceneContainersToAlignTerrain == "function" && (r.rotateSceneContainersToAlignTerrain(this.enuBasis), console.log("[SyncManager] ✅ 已通知 DualCanvasViewer 旋转场景容器"));
      }
      return console.log("[SyncManager] ✅ 轻量级 ENU 初始化完成", {
        ENU原点: `经度${e.toFixed(6)}°, 纬度${t.toFixed(6)}°, 高度${o.toFixed(2)}m`,
        天向量: `(${this.enuBasis.up.x.toFixed(4)}, ${this.enuBasis.up.y.toFixed(4)}, ${this.enuBasis.up.z.toFixed(4)})`,
        说明: "模型位置保持不变，只旋转场景容器和方向同步"
      }), !0;
    } catch (i) {
      return console.error("[SyncManager] 轻量级 ENU 初始化失败:", i), !1;
    }
  }
  getENUBasis() {
    return this.enuBasis || null;
  }
  getENUOrigin() {
    return this.enuOrigin || null;
  }
  hasENUInitialized() {
    return this.enuBasis !== null && this.enuOrigin !== null;
  }
  getCesiumScreenCenterMercator() {
    console.log("[SyncManager.getCesiumScreenCenterMercator] 开始获取屏幕中心墨卡托坐标");
    const e = this.getCesium();
    if (console.log("[SyncManager.getCesiumScreenCenterMercator] Cesium 可用:", !!e), !e)
      return console.warn("[SyncManager.getCesiumScreenCenterMercator] Cesium 不可用"), null;
    if (!this.cesiumViewer)
      return console.warn("[SyncManager.getCesiumScreenCenterMercator] cesiumViewer 为 null"), console.log("[SyncManager.getCesiumScreenCenterMercator] 当前 this:", {
        hasCesiumViewer: !!this.cesiumViewer,
        hasWindowCesiumViewer: !!(typeof window < "u" && window.__cesiumViewer__)
      }), null;
    if (!this.cesiumViewer.camera)
      return console.warn("[SyncManager.getCesiumScreenCenterMercator] cesiumViewer.camera 为 null"), null;
    console.log("[SyncManager.getCesiumScreenCenterMercator] 所有检查通过，开始计算");
    try {
      const t = this.cesiumViewer.camera;
      console.log("[SyncManager.getCesiumScreenCenterMercator] camera.position:", {
        x: t.position.x.toFixed(2),
        y: t.position.y.toFixed(2),
        z: t.position.z.toFixed(2)
      });
      const o = this.cesiumViewer.scene?.globe?.ellipsoid || e.Ellipsoid.WGS84, i = 6378137, n = o.cartesianToCartographic(t.position);
      if (!n)
        return console.warn("[SyncManager.getCesiumScreenCenterMercator] cameraCartographic 转换失败"), null;
      console.log("[SyncManager.getCesiumScreenCenterMercator] cameraCartographic:", {
        longitude: n.longitude.toFixed(8),
        latitude: n.latitude.toFixed(8),
        height: n.height.toFixed(2)
      });
      const r = {
        x: n.longitude * i,
        y: this.surfaceHandler.latitudeToMercator(n.latitude),
        z: 0
      };
      return console.log("[SyncManager.getCesiumScreenCenterMercator] 计算完成:", {
        x: r.x.toFixed(2),
        y: r.y.toFixed(2),
        z: r.z.toFixed(2)
      }), r;
    } catch (t) {
      return console.error("[SyncManager.getCesiumScreenCenterMercator] 异常:", t), console.error("[SyncManager.getCesiumScreenCenterMercator] 错误堆栈:", t.stack), null;
    }
  }
  mercatorToThree(e, t, o) {
    return this.mercatorProjection.mercatorToThree(e, t, o);
  }
  threeToMercator(e, t, o) {
    const i = this.mercatorProjection.threeToMercator(e, t, o);
    if (this.floorCenterMercator) {
      const n = t, r = i.z, a = Math.abs(r - n);
      a > 10 && console.warn("[SyncManager] threeToMercator 高度转换异常:", {
        输入高度: t.toFixed(2),
        输出高度: r.toFixed(2),
        差异: a.toFixed(2),
        floorCenterZ: this.floorCenterMercator.z,
        说明: "差异超过10米阈值，可能是大坐标模型或坐标转换问题"
      }), a > 1e3 && console.error("[SyncManager] threeToMercator 高度转换严重异常:", {
        输入高度: t.toFixed(2),
        输出高度: r.toFixed(2),
        差异: a.toFixed(2),
        建议检查: "坐标系统配置、地板中心设置、模型加载状态"
      });
    }
    return i;
  }
  mercatorVectorToThree(e, t, o) {
    return {
      x: e,
      y: o,
      z: -t
    };
  }
  lonLatToMercator(e, t) {
    return this.mercatorProjection.lonLatToMercator(e, t);
  }
  mercatorToLonLat(e, t) {
    return this.mercatorProjection.mercatorToLonLat(e, t);
  }
  latitudeToMercator(e) {
    return this.mercatorProjection.latitudeToMercatorY(e);
  }
  mercatorToLatitude(e) {
    return this.mercatorProjection.mercatorYToLatitude(e);
  }
  syncCesiumToThree(e, t) {
    const o = this.getCesium();
    if (!o || this.syncDepth > 0 || this.throttleTimer) return;
    const i = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    if (i) {
      console.log("[SyncManager.syncCesiumToThree] 局部坐标系模式：跳过 Cesium 到 Three.js 的同步", { 说明: "局部坐标系模式下不需要从 Cesium 同步位置" });
      return;
    }
    const n = 1e3;
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0 && !i) {
      const a = window.__dualCanvasViewerInstances[0];
      if (a && a.camera1 && a.camera1.position && (Math.abs(a.camera1.position.x) > n || Math.abs(a.camera1.position.z) > n)) {
        console.log("[SyncManager.syncCesiumToThree] 大坐标模式：跳过同步，保持 Three.js 相机位置");
        return;
      }
    }
    if (this._isSyncingFromDual) {
      console.log("[SyncManager] 跳过Cesium同步（正在从Dual同步）");
      return;
    }
    const r = typeof window < "u" && window.__enuCoordinateManager__;
    if (r && r.isInitialized()) {
      console.log("[SyncManager.syncCesiumToThree] ENU坐标系模式：跳过Cesium到Three.js的同步", { 说明: "ENU是本地坐标系，不需要从Cesium同步位置" });
      return;
    }
    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
    }, this.throttleDelay), this.syncDepth++;
    try {
      const a = e.position;
      if (!this.isValidCameraPosition(o, a)) return;
      const s = t?.globe?.ellipsoid || o.Ellipsoid.WGS84, c = s.maximumRadius || 6378137;
      let l;
      try {
        l = s.cartesianToCartographic(a);
      } catch (f) {
        console.warn("[SyncManager] 坐标转换失败:", f.message);
        return;
      }
      if (!l) return;
      const g = {
        x: l.longitude * c,
        y: this.surfaceHandler.latitudeToMercator(l.latitude),
        z: l.height
      };
      let u = null;
      try {
        const f = e.direction, C = e.position, M = Math.sqrt(f.x * f.x + f.y * f.y + f.z * f.z), y = f && o.defined(f) && isFinite(f.x) && isFinite(f.y) && isFinite(f.z) && !isNaN(f.x) && !isNaN(f.y) && !isNaN(f.z) && M > 1e-3 && M < 1e3, w = C && o.defined(C) && isFinite(C.x) && isFinite(C.y) && isFinite(C.z) && !isNaN(C.x) && !isNaN(C.y) && !isNaN(C.z), V = Math.abs(f.z) > 0.999;
        if (y && w && !V) {
          const S = new o.Ray(e.position, e.direction), T = o.IntersectionTests.rayEllipsoid(S, s);
          o.defined(T) && isFinite(T.x) && isFinite(T.y) && isFinite(T.z) && (u = s.cartesianToCartographic(T));
        }
      } catch {
      }
      if (!u) {
        if (isNaN(l.longitude) || isNaN(l.latitude)) return;
        u = o.Cartographic.fromRadians(l.longitude, l.latitude, 0);
      }
      if (isNaN(u.longitude) || isNaN(u.latitude)) return;
      const d = {
        x: u.longitude * c,
        y: this.surfaceHandler.latitudeToMercator(u.latitude),
        z: 0
      }, m = this.mercatorToThree(g.x, g.y, g.z), p = this.mercatorToThree(d.x, d.y, d.z);
      let x = !1;
      try {
        const f = e.position;
        if (f && this.floorCenterMercator) {
          if (!this._initialFloorCenterNormal) {
            const C = o.Cartographic.fromRadians(this.floorCenterMercator.x / c, this.surfaceHandler.mercatorToLatitude(this.floorCenterMercator.y), 0), M = s.cartographicToCartesian(C);
            M && (this._initialFloorCenterNormal = o.Cartesian3.normalize(M, new o.Cartesian3()));
          }
          if (this._initialFloorCenterNormal) {
            const C = o.Cartesian3.normalize(f, new o.Cartesian3());
            x = o.Cartesian3.dot(C, this._initialFloorCenterNormal) < 0;
          }
        }
      } catch {
      }
      this.onCesiumToThreeSync && this.onCesiumToThreeSync(m, p, u, x);
    } finally {
      this.syncDepth--;
    }
  }
  syncThreeToCesium(e, t) {
    if (!this.disableThreeToCesiumSync) {
      if (this.leftFlipProtection.enabled && Date.now() < this.leftFlipProtection.until) {
        console.log("[SyncManager] 左键翻转保护生效，跳过 Three.js → Cesium 同步");
        return;
      }
      if (typeof window < "u" && window.cesiumDualSyncV2) {
        const o = window.cesiumDualSyncV2.getState();
        if (o && o.isUserDragging || o && o.blockDualToCesiumSyncUntil && Date.now() < o.blockDualToCesiumSyncUntil) return;
      }
      if (!(this.syncDepth > 0) && !this.throttleTimer) {
        this._syncCooldownTimer && (clearTimeout(this._syncCooldownTimer), this._syncCooldownTimer = null), this.throttleTimer = setTimeout(() => {
          this.throttleTimer = null;
        }, this.throttleDelay), this._isSyncingFromDual = !0, this.syncDepth++;
        try {
          const o = typeof window < "u" && window.__enuCoordinateManager__;
          if (o && o.isInitialized()) {
            console.log("[SyncManager.syncThreeToCesium] ENU坐标系模式：跳过同步（ENU是本地坐标系）", {
              threePosition: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
              threeTarget: `(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`,
              说明: "ENU是本地坐标系，Three.js相机移动不同步到Cesium"
            });
            return;
          }
          const i = 1e3;
          if (Math.abs(e.x) > i || Math.abs(e.z) > i) {
            console.log("[SyncManager.syncThreeToCesium] 大坐标场景：跳过同步", {
              inputPosition: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
              inputTarget: `(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`
            });
            return;
          }
          const n = this.threeToMercator(e.x, e.y, e.z), r = this.threeToMercator(t.x, t.y, t.z);
          console.log("[SyncManager.syncThreeToCesium] 小坐标场景：执行同步", {
            threePosition: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
            threeTarget: `(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`,
            mercatorPosition: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`,
            mercatorTarget: `(${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)})`
          }), this.onThreeToCesiumSync && this.onThreeToCesiumSync(n, r);
        } catch (o) {
          this.syncDepth--, console.error("[SyncManager] Three.js → Cesium 同步错误:", o);
        } finally {
          this._syncCooldownTimer = setTimeout(() => {
            this._isSyncingFromDual = !1, this._syncCooldownTimer = null;
          }, 150);
        }
      }
    }
  }
  syncInitialDirectionFromCesium(e) {
    const t = this.getCesium();
    if (!t || !e) {
      console.warn("[SyncManager] syncInitialDirectionFromCesium: 缺少必要参数");
      return;
    }
    try {
      const o = e.direction, i = (this.cesiumViewer?.scene?.globe?.ellipsoid || t.Ellipsoid.WGS84).cartesianToCartographic(e.position), n = i.longitude, r = i.latitude, a = Math.cos(n), s = Math.sin(n), c = Math.cos(r), l = Math.sin(r), g = new t.Cartesian3(-s, a, 0), u = new t.Cartesian3(c * a, c * s, l), d = new t.Cartesian3();
      t.Cartesian3.cross(u, g, d);
      const m = t.Cartesian3.dot(o, g), p = t.Cartesian3.dot(o, d), x = t.Cartesian3.dot(o, u), f = {
        x: m,
        y: x,
        z: -p
      }, C = Math.sqrt(f.x ** 2 + f.y ** 2 + f.z ** 2);
      if (C > 1e-4 && (f.x /= C, f.y /= C, f.z /= C), this.unifiedCameraState.direction = f, this._rebuildOrthonormalBasis(), console.log("[SyncManager] ✅ 已从 Cesium 同步初始方向:", {
        Cesium方向_ECEF: `(${o.x.toFixed(3)}, ${o.y.toFixed(3)}, ${o.z.toFixed(3)})`,
        ENU方向: `(${m.toFixed(3)}, ${p.toFixed(3)}, ${x.toFixed(3)})`,
        State方向_EUS: `(${f.x.toFixed(3)}, ${f.y.toFixed(3)}, ${f.z.toFixed(3)})`
      }), typeof window < "u" && window.__dualCanvasViewerInstances) {
        const M = window.__dualCanvasViewerInstances[0];
        if (M && M.camera1 && M.camera1.isCamera) {
          M.camera1.position.set(this.unifiedCameraState.position.x, this.unifiedCameraState.position.y, this.unifiedCameraState.position.z);
          const y = new h.Vector3(this.unifiedCameraState.position.x + f.x * this.unifiedCameraState.height, this.unifiedCameraState.position.y + f.y * this.unifiedCameraState.height, this.unifiedCameraState.position.z + f.z * this.unifiedCameraState.height);
          M.camera1.lookAt(y), console.log("[SyncManager] ✅ 已同步方向到 dual 相机");
        }
      }
    } catch (o) {
      console.error("[SyncManager] syncInitialDirectionFromCesium 失败:", o);
    }
  }
  isValidCameraPosition(e, t) {
    return t ? typeof e.Cartesian3.isValid == "function" ? e.Cartesian3.isValid(t) : typeof t.x == "number" && typeof t.y == "number" && typeof t.z == "number" && isFinite(t.x) && isFinite(t.y) && isFinite(t.z) && (t.x !== 0 || t.y !== 0 || t.z !== 0) : !1;
  }
  handleRotateInUnified(e, t) {
    const o = this.mouseOperationParams, i = this.unifiedCameraState;
    (!i.direction || typeof i.direction.x != "number" || typeof i.direction.y != "number" || typeof i.direction.z != "number" || !isFinite(i.direction.x) || !isFinite(i.direction.y) || !isFinite(i.direction.z)) && (console.error("[SyncManager] handleRotateInUnified state.direction 无效，使用安全默认值:", {
      direction: i.direction,
      x: i.direction?.x,
      y: i.direction?.y,
      z: i.direction?.z
    }), i.direction = {
      x: 0,
      y: -0.866,
      z: -0.5
    }), (!i.right || typeof i.right.x != "number" || typeof i.right.y != "number" || typeof i.right.z != "number" || !isFinite(i.right.x) || !isFinite(i.right.y) || !isFinite(i.right.z)) && (console.error("[SyncManager] handleRotateInUnified state.right 无效，使用安全默认值:", { right: i.right }), i.right = {
      x: 1,
      y: 0,
      z: 0
    }), (!i.up || typeof i.up.x != "number" || typeof i.up.y != "number" || typeof i.up.z != "number" || !isFinite(i.up.x) || !isFinite(i.up.y) || !isFinite(i.up.z)) && (console.error("[SyncManager] handleRotateInUnified state.up 无效，使用安全默认值:", { up: i.up }), i.up = {
      x: 0,
      y: 1,
      z: 0
    }), (!i.position || typeof i.position.x != "number" || typeof i.position.y != "number" || typeof i.position.z != "number" || !isFinite(i.position.x) || !isFinite(i.position.y) || !isFinite(i.position.z)) && (console.error("[SyncManager] handleRotateInUnified state.position 无效，使用安全默认值:", { position: i.position }), i.position = {
      x: 0,
      y: 100,
      z: 0
    }), (!i.target || typeof i.target.x != "number" || typeof i.target.y != "number" || typeof i.target.z != "number" || !isFinite(i.target.x) || !isFinite(i.target.y) || !isFinite(i.target.z)) && (console.error("[SyncManager] handleRotateInUnified state.target 无效，使用安全默认值:", { target: i.target }), i.target = {
      x: 0,
      y: 0,
      z: 0
    });
    const n = { ...i.direction };
    let r = { ...i.target };
    const a = { ...i.position }, s = i.height, c = me.dot(n, {
      x: 0,
      y: 1,
      z: 0
    }), l = Math.abs(c) > 0.999;
    let g = t * o.rotateSpeed, u = e * o.rotateSpeed;
    const d = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    if (d) {
      const V = Math.max(0, -n.y), S = Math.min(1, s / 500), T = 1 - Math.pow(V, 2) * 0.4 - Math.pow(S, 2) * 0.2, v = Math.max(0.4, Math.min(1, T));
      g *= v, u *= v;
    }
    const m = d ? null : this.getCesiumScreenCenterMercator();
    let p = null;
    if (d && typeof window < "u") {
      const V = window.__dualCanvasViewerInstances?.[0];
      V && V.modelGroup1 && V.modelGroup1.children.length > 0 && (p = [], V.modelGroup1.children.forEach((S, T) => {
        const v = S.userData?.originalLocation;
        if (v && (v.cartographic || v.ecef)) {
          const D = new h.Vector3();
          S.getWorldPosition(D), p.push({
            index: T,
            name: S.name,
            localPosition: {
              x: S.position.x,
              y: S.position.y,
              z: S.position.z
            },
            worldPosition: {
              x: D.x,
              y: D.y,
              z: D.z
            },
            ecef: v.ecef ? {
              x: v.ecef.x,
              y: v.ecef.y,
              z: v.ecef.z
            } : null,
            cartographic: v.cartographic ? {
              longitude: v.cartographic.longitude,
              latitude: v.cartographic.latitude,
              height: v.cartographic.height
            } : null
          });
        }
      }), p.length > 0 && console.log("%c[SyncManager] ⭐ 翻转前 - 大坐标模型位置监控:", "color: #ff6b6b; font-weight: bold", {
        模型数量: p.length,
        模型详情: p.map((S) => ({
          名称: S.name,
          局部坐标: `(${S.localPosition.x.toFixed(2)}, ${S.localPosition.y.toFixed(2)}, ${S.localPosition.z.toFixed(2)})`,
          世界坐标: `(${S.worldPosition.x.toFixed(2)}, ${S.worldPosition.y.toFixed(2)}, ${S.worldPosition.z.toFixed(2)})`,
          ECEF坐标: S.ecef ? `(${S.ecef.x.toFixed(2)}, ${S.ecef.y.toFixed(2)}, ${S.ecef.z.toFixed(2)})` : "无",
          经纬度: S.cartographic ? `(${(S.cartographic.longitude * 180 / Math.PI).toFixed(6)}°, ${(S.cartographic.latitude * 180 / Math.PI).toFixed(6)}°)` : "无",
          海拔: S.cartographic ? `${S.cartographic.height.toFixed(2)}米` : "无"
        }))
      }));
    }
    console.log("[SyncManager] handleRotateInUnified 调用:", {
      originalPosition: `(${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)})`,
      originalTarget: `(${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)})`,
      directionY: n.y.toFixed(3),
      pitchAngle: g.toFixed(4),
      yawAngle: u.toFixed(4),
      hasFloorCenter: !!this.floorCenterMercator,
      hasScreenCenter: !!m,
      isUsingLocalCoord: d,
      speedAdjusted: d,
      screenCenter: m ? `(${m.x.toFixed(2)}, ${m.y.toFixed(2)})` : "null"
    });
    const x = a.y >= -10, f = n.y < 0;
    console.log("[SyncManager] 翻转前状态:", {
      wasAboveGround: x,
      wasLookingDown: f,
      originalPositionY: a.y.toFixed(2)
    });
    let C = { ...n };
    if (f && g > 0) {
      const V = n.y - Math.cos(Math.asin(Math.abs(n.y))) * g, S = -0.1;
      if (V > S) {
        const T = Math.asin(Math.abs(n.y)) - Math.asin(Math.abs(S));
        g = Math.min(g, T), console.log("[SyncManager] 限制俯仰角以避免翻转:", {
          originalY: n.y.toFixed(3),
          estimatedY: V.toFixed(3),
          maxY: S,
          originalPitch: (g * 180 / Math.PI).toFixed(2) + "°",
          limitedPitch: (g * 180 / Math.PI).toFixed(2) + "°"
        });
      }
    }
    l ? C = me.rotateAroundAxis(C, {
      x: 1,
      y: 0,
      z: 0
    }, -g) : C = me.rotateAroundAxis(C, i.right, -g);
    const M = n.y < 0 && Math.abs(c) > 0.9;
    l ? C = me.rotateAroundAxis(C, {
      x: 0,
      y: 0,
      z: 1
    }, -u) : M ? C = me.rotateAroundAxis(C, i.right, -u) : C = me.rotateAroundAxis(C, i.up, -u), C = me.normalize(C);
    const y = Math.PI * 0.944, w = Math.cos(y);
    if (f && C.y < w) {
      console.log("[SyncManager] 旋转后极点翻转保护：强制修正方向向量", {
        before: n.y.toFixed(3),
        after: C.y.toFixed(3),
        polarAngle: `${(Math.acos(C.y) * 180 / Math.PI).toFixed(1)}°`,
        limit: `≤ ${y * 180 / Math.PI}°`
      });
      const V = Math.sqrt(C.x * C.x + C.z * C.z);
      if (V > 1e-3) {
        const S = C.x / V, T = C.z / V, v = w + 0.01, D = Math.sqrt(1 - v * v);
        C.x = S * D, C.y = v, C.z = T * D;
        const _ = Math.sqrt(C.x ** 2 + C.y ** 2 + C.z ** 2);
        _ > 1e-4 && (C.x /= _, C.y /= _, C.z /= _), console.log("[SyncManager] 方向向量已修正到安全范围:", {
          newPolarAngle: `${(Math.acos(C.y) * 180 / Math.PI).toFixed(1)}°`,
          newDirectionY: C.y.toFixed(3)
        });
      }
    }
    if (x && f) {
      const V = {
        x: r.x - C.x * s,
        y: r.y - C.y * s,
        z: r.z - C.z * s
      }, S = V.y < -10, T = C.y > 0.2;
      if ((S || T) && (console.log("[SyncManager] 地上模式翻转限制：强制修正", {
        wasAboveGround: x,
        wasLookingDown: f,
        predictedY: V.y.toFixed(2),
        newDirectionY: C.y.toFixed(3),
        wouldGoUnderground: S,
        wouldFlipOver: T,
        pitchAngle: g.toFixed(4)
      }), C.y > -0.1)) {
        const v = Math.sqrt(C.x * C.x + C.z * C.z);
        if (v > 1e-3) {
          const _ = C.x / v, b = C.z / v, E = -0.05;
          if (C.y > E) {
            const F = Math.min(C.y, E), P = Math.sqrt(1 - F * F);
            C.x = _ * P, C.y = F, C.z = b * P;
          }
        } else C = {
          x: 0,
          y: -1,
          z: 0
        };
        const D = Math.sqrt(C.x ** 2 + C.y ** 2 + C.z ** 2);
        D > 1e-4 && (C.x /= D, C.y /= D, C.z /= D), console.log("[SyncManager] 方向向量已修正:", {
          before: `(${n.y.toFixed(3)})`,
          after: `(${C.y.toFixed(3)})`
        });
      }
    }
    if (i.direction = C, d) {
      const V = this.mercatorProjection.dualFloorHeight ?? 0;
      i.target = {
        x: 0,
        y: V,
        z: 0
      }, i.position = {
        x: i.target.x - C.x * s,
        y: i.target.y - C.y * s,
        z: i.target.z - C.z * s
      }, console.log("[SyncManager.handleRotateInUnified] 局部坐标系模式：更新相机位置以支持旋转", {
        target: `(${i.target.x.toFixed(2)}, ${i.target.y.toFixed(2)}, ${i.target.z.toFixed(2)})`,
        position: `(${i.position.x.toFixed(2)}, ${i.position.y.toFixed(2)}, ${i.position.z.toFixed(2)})`,
        direction: `(${C.x.toFixed(3)}, ${C.y.toFixed(3)}, ${C.z.toFixed(3)})`,
        dualFloorHeight: V.toFixed(2) + "m",
        说明: "target.y 使用 dualFloorHeight 以正确对齐模型位置"
      });
    } else
      i.target = { ...r }, i.position = {
        x: i.target.x - i.direction.x * s,
        y: i.target.y - i.direction.y * s,
        z: i.target.z - i.direction.z * s
      };
    if (this._rebuildOrthonormalBasis(), d || this._applyFloorTransformAfterRotate(m, n, i.direction), !d && m && this.floorCenterMercator && this.floorCenterMercator.x !== 0) {
      const V = Math.abs(m.x - this.floorCenterMercator.x), S = Math.abs(m.y - this.floorCenterMercator.y);
      (V > 1 || S > 1) && (console.log("[SyncManager.handleRotateInUnified] 更新地板中心（翻转后）:", {
        oldFloorCenter: `(${this.floorCenterMercator.x.toFixed(2)}, ${this.floorCenterMercator.y.toFixed(2)})`,
        newFloorCenter: `(${m.x.toFixed(2)}, ${m.y.toFixed(2)})`
      }), this.setFloorCenter(m));
    }
    if (d) {
      const V = window.__dualCanvasViewerInstances?.[0];
      if (V && V.controls1 && V.controls1.target) {
        const S = {
          x: V.camera1.position.x,
          y: V.camera1.position.y,
          z: V.camera1.position.z
        };
        V.controls1.target.set(i.target.x, i.target.y, i.target.z), V.camera1.position.set(S.x, S.y, S.z), console.log("[SyncManager.handleRotateInUnified] 🔄 已同步 target 并保持相机位置不变:", {
          target: `(${i.target.x.toFixed(2)}, ${i.target.y.toFixed(2)}, ${i.target.z.toFixed(2)})`,
          相机位置: `(${S.x.toFixed(2)}, ${S.y.toFixed(2)}, ${S.z.toFixed(2)})`
        });
      }
    }
    if (d) {
      const V = this.cesiumViewer, S = V?.camera, T = V?.scene;
      if (S && T && this.mercatorProjection && (console.log("[SyncManager.handleRotateInUnified] 局部坐标模式：翻转后立即同步到 Cesium"), this.mercatorProjection.syncDirectionToCesium(this.unifiedCameraState, S, T) || console.error("[SyncManager.handleRotateInUnified] 同步到 Cesium 失败"), T.requestRender ? T.requestRender() : S.update(T.clock.currentTime), this._skipNextCesiumSync = !0), p && typeof window < "u") {
        const v = window.__dualCanvasViewerInstances?.[0];
        if (v && v.modelGroup1 && v.modelGroup1.children.length > 0) {
          const D = [];
          v.modelGroup1.children.forEach((b, E) => {
            const F = b.userData?.originalLocation;
            if (F && (F.cartographic || F.ecef)) {
              const P = new h.Vector3();
              b.getWorldPosition(P), D.push({
                index: E,
                name: b.name,
                localPosition: {
                  x: b.position.x,
                  y: b.position.y,
                  z: b.position.z
                },
                worldPosition: {
                  x: P.x,
                  y: P.y,
                  z: P.z
                },
                ecef: F.ecef ? {
                  x: F.ecef.x,
                  y: F.ecef.y,
                  z: F.ecef.z
                } : null,
                cartographic: F.cartographic ? {
                  longitude: F.cartographic.longitude,
                  latitude: F.cartographic.latitude,
                  height: F.cartographic.height
                } : null
              });
            }
          });
          const _ = [];
          p.forEach((b, E) => {
            const F = D.find((P) => P.index === b.index);
            if (F) {
              const P = {
                x: F.localPosition.x - b.localPosition.x,
                y: F.localPosition.y - b.localPosition.y,
                z: F.localPosition.z - b.localPosition.z
              }, R = {
                x: F.worldPosition.x - b.worldPosition.x,
                y: F.worldPosition.y - b.worldPosition.y,
                z: F.worldPosition.z - b.worldPosition.z
              }, L = F.cartographic && b.cartographic ? F.cartographic.height - b.cartographic.height : 0;
              (Math.abs(P.x) > 0.01 || Math.abs(P.y) > 0.01 || Math.abs(P.z) > 0.01 || Math.abs(R.x) > 0.01 || Math.abs(R.y) > 0.01 || Math.abs(R.z) > 0.01 || Math.abs(L) > 0.01) && _.push({
                index: b.index,
                name: b.name,
                局部坐标变化: `Δ(${P.x.toFixed(4)}, ${P.y.toFixed(4)}, ${P.z.toFixed(4)})`,
                世界坐标变化: `Δ(${R.x.toFixed(4)}, ${R.y.toFixed(4)}, ${R.z.toFixed(4)})`,
                海拔变化: L !== 0 ? `${L.toFixed(4)}米` : "无",
                ECEF坐标: b.ecef ? "相同" : "无"
              });
            }
          }), console.log("%c[SyncManager] ⭐ 翻转后 - 大坐标模型位置监控:", "color: #4ade80; font-weight: bold", {
            模型数量: D.length,
            变化检测: _.length > 0 ? "❌ 检测到变化" : "✅ 无变化",
            变化详情: _.length > 0 ? _ : "无显著变化",
            模型详情: D.map((b) => ({
              名称: b.name,
              局部坐标: `(${b.localPosition.x.toFixed(2)}, ${b.localPosition.y.toFixed(2)}, ${b.localPosition.z.toFixed(2)})`,
              世界坐标: `(${b.worldPosition.x.toFixed(2)}, ${b.worldPosition.y.toFixed(2)}, ${b.worldPosition.z.toFixed(2)})`,
              ECEF坐标: b.ecef ? `(${b.ecef.x.toFixed(2)}, ${b.ecef.y.toFixed(2)}, ${b.ecef.z.toFixed(2)})` : "无",
              经纬度: b.cartographic ? `(${(b.cartographic.longitude * 180 / Math.PI).toFixed(6)}°, ${(b.cartographic.latitude * 180 / Math.PI).toFixed(6)}°)` : "无",
              海拔: b.cartographic ? `${b.cartographic.height.toFixed(2)}米` : "无"
            }))
          }), _.length > 0 && console.error("%c[SyncManager] ⚠️ 警告：翻转后大坐标模型位置发生变化！", "color: #ff6b6b; font-weight: bold", _);
        }
      }
    }
  }
  _applyFloorTransformAfterRotate(e, t, o) {
    if (!e || !this.floorCenterMercator) {
      console.log("[SyncManager._applyFloorTransformAfterRotate] 跳过地板变换（缺少必要参数）");
      return;
    }
    console.log("[SyncManager._applyFloorTransformAfterRotate] 开始应用地板变换:", {
      screenCenter: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,
      floorCenter: `(${this.floorCenterMercator.x.toFixed(2)}, ${this.floorCenterMercator.y.toFixed(2)})`
    });
    try {
      e.x - this.floorCenterMercator.x, e.y - this.floorCenterMercator.y;
      const i = this._calculateHorizontalRotationAngle(t, o);
      if (console.log("[SyncManager._applyFloorTransformAfterRotate] 水平旋转角度:", {
        angleInRadians: i.toFixed(4),
        angleInDegrees: (i * 180 / Math.PI).toFixed(2) + "°",
        originalDirection: `(${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)})`,
        newDirection: `(${o.x.toFixed(3)}, ${o.y.toFixed(3)}, ${o.z.toFixed(3)})`
      }), Math.abs(i) > 1e-3 && this.onFloorCenterUpdate) {
        const n = this._rotatePointAroundCenter(e, this.floorCenterMercator, i), r = {
          x: e.x - n.x,
          y: e.y - n.y,
          z: 0
        };
        console.log("[SyncManager._applyFloorTransformAfterRotate] 模型偏移计算:", {
          原始屏幕中心: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)})`,
          旋转后屏幕中心: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)})`,
          模型偏移: `(${r.x.toFixed(2)}, ${r.y.toFixed(2)})`,
          旋转角度: (i * 180 / Math.PI).toFixed(2) + "°"
        });
        const a = {
          x: r.x,
          y: r.z,
          z: -r.y
        };
        this.onFloorCenterUpdate({
          ...this.floorCenterMercator,
          _modelOffset: a,
          _rotationAngle: i,
          _isRotateOperation: !0
        }), console.log("[SyncManager._applyFloorTransformAfterRotate] 已触发地板变换回调（翻转模式）");
      } else console.log("[SyncManager._applyFloorTransformAfterRotate] 跳过地板变换（角度太小或无回调）");
    } catch (i) {
      console.error("[SyncManager._applyFloorTransformAfterRotate] 地板变换失败:", i);
    }
  }
  _calculateHorizontalRotationAngle(e, t) {
    if (!e || !t) return 0;
    const o = {
      x: e.x,
      z: e.z
    }, i = {
      x: t.x,
      z: t.z
    }, n = Math.sqrt(o.x * o.x + o.z * o.z), r = Math.sqrt(i.x * i.x + i.z * i.z);
    if (n < 1e-4 || r < 1e-4) return 0;
    const a = {
      x: o.x / n,
      z: o.z / n
    }, s = {
      x: i.x / r,
      z: i.z / r
    }, c = a.x * s.x + a.z * s.z, l = a.x * s.z - a.z * s.x;
    let g = Math.acos(Math.max(-1, Math.min(1, c)));
    return l < 0 && (g = -g), g;
  }
  _calculateAngleBetweenDirections(e, t) {
    if (!e || !t) return 0;
    const o = e.x * t.x + e.y * t.y + e.z * t.z, i = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z), n = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z);
    if (i < 1e-4 || n < 1e-4) return 0;
    const r = Math.max(-1, Math.min(1, o / (i * n)));
    return Math.acos(r);
  }
  _rotatePointAroundCenter(e, t, o) {
    const i = e.x - t.x, n = e.y - t.y, r = Math.cos(o), a = Math.sin(o), s = i * r - n * a, c = i * a + n * r;
    return {
      x: t.x + s,
      y: t.y + c,
      z: e.z || 0
    };
  }
  _adjustTargetToAlignWithGround(e) {
    const t = this.getCesium();
    if (!t || !this.cesiumViewer || !this.cesiumViewer.camera) {
      console.warn("[SyncManager._adjustTargetToAlignWithGround] Cesium 不可用");
      return;
    }
    try {
      const o = this.cesiumViewer.camera, i = this.cesiumViewer.scene?.globe?.ellipsoid || t.Ellipsoid.WGS84, n = o.position, r = i.cartesianToCartographic(n);
      if (!r) {
        console.warn("[SyncManager._adjustTargetToAlignWithGround] 无法获取相机经纬度");
        return;
      }
      const a = Date.now();
      (!this.terrainNormalCache.position || t.Cartesian3.distance(n, this.terrainNormalCache.position) > 100 || a - this.terrainNormalCache.lastUpdateTime > this.terrainNormalCache.updateInterval) && this._updateTerrainNormalCache(n), this.terrainNormalCache.isValid && this.terrainNormalCache.normal ? this._adjustTargetWithTerrainNormal(e, n, r) : this._adjustTargetWithEllipsoidNormal(e, n, r, i);
    } catch (o) {
      console.error("[SyncManager._adjustTargetToAlignWithGround] 调整失败:", o), this._adjustTargetWithEllipsoidNormal(e, camera.position, ellipsoid.cartesianToCartographic(camera.position), ellipsoid);
    }
  }
  async _updateTerrainNormalCache(e) {
    if (this.getCesium())
      try {
        console.log("[SyncManager._updateTerrainNormalCache] 正在采样地形法线...");
        const t = await this._getTerrainNormal(e);
        t ? (this.terrainNormalCache.normal = t, this.terrainNormalCache.position = e, this.terrainNormalCache.lastUpdateTime = Date.now(), this.terrainNormalCache.isValid = !0, console.log("[SyncManager._updateTerrainNormalCache] ✅ 地形法线已更新:", { normal: `(${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)})` })) : (console.warn("[SyncManager._updateTerrainNormalCache] ⚠️ 地形法线采样失败，使用椭球体法线"), this.terrainNormalCache.isValid = !1);
      } catch (t) {
        console.error("[SyncManager._updateTerrainNormalCache] 更新失败:", t), this.terrainNormalCache.isValid = !1;
      }
  }
  _adjustTargetWithTerrainNormal(e, t, o) {
    const i = this.getCesium(), n = this.terrainNormalCache.normal, r = this.cesiumViewer.camera, a = n, s = o.longitude, c = Math.sin(s), l = Math.cos(s), g = new i.Cartesian3(-c, l, 0), u = i.Cartesian3.multiplyByScalar(a, i.Cartesian3.dot(g, a), new i.Cartesian3()), d = i.Cartesian3.subtract(g, u, new i.Cartesian3());
    i.Cartesian3.normalize(d, d);
    const m = i.Cartesian3.cross(a, d, new i.Cartesian3());
    i.Cartesian3.normalize(m, m), console.log("[SyncManager._adjustTargetWithTerrainNormal] 地形对齐基向量:", {
      经纬度: {
        经度: (s * 180 / Math.PI).toFixed(6) + "°",
        纬度: (o.latitude * 180 / Math.PI).toFixed(6) + "°"
      },
      东: `(${d.x.toFixed(3)}, ${d.y.toFixed(3)}, ${d.z.toFixed(3)})`,
      北: `(${m.x.toFixed(3)}, ${m.y.toFixed(3)}, ${m.z.toFixed(3)})`,
      天: `(${a.x.toFixed(3)}, ${a.y.toFixed(3)}, ${a.z.toFixed(3)})`,
      来源: "实际地形采样"
    });
    const p = r.direction, x = e.height || 100, f = new i.Cartesian3(t.x + p.x * x, t.y + p.y * x, t.z + p.z * x), C = i.Cartesian3.subtract(f, t, new i.Cartesian3()), M = {
      east: i.Cartesian3.dot(C, d),
      north: i.Cartesian3.dot(C, m),
      up: i.Cartesian3.dot(C, a)
    };
    console.log("[SyncManager._adjustTargetWithTerrainNormal] Target 偏移（地形对齐）:", {
      east: M.east.toFixed(2) + "m",
      north: M.north.toFixed(2) + "m",
      up: M.up.toFixed(2) + "m"
    });
    const y = {
      x: M.east,
      y: M.up,
      z: -M.north
    };
    console.log("[SyncManager._adjustTargetWithTerrainNormal] 调整后 Target (Three.js):", {
      x: y.x.toFixed(2),
      y: y.y.toFixed(2),
      z: y.z.toFixed(2)
    }), e.target = y, console.log("[SyncManager._adjustTargetWithTerrainNormal] ✅ Target 已调整，地板平行于实际地形");
  }
  _adjustTargetWithEllipsoidNormal(e, t, o, i) {
    const n = this.getCesium(), r = this.cesiumViewer.camera, a = this.mercatorProjection?.isUsingLocalCoordinateSystem(), s = o.longitude, c = o.latitude, l = Math.sin(s), g = Math.cos(s), u = Math.sin(c), d = Math.cos(c), m = {
      x: -l,
      y: g,
      z: 0
    }, p = {
      x: -u * g,
      y: -u * l,
      z: d
    }, x = {
      x: d * g,
      y: d * l,
      z: u
    };
    console.log("[SyncManager._adjustTargetWithEllipsoidNormal] 屏幕中心 ENU 基向量:", {
      经纬度: {
        经度: (s * 180 / Math.PI).toFixed(6) + "°",
        纬度: (c * 180 / Math.PI).toFixed(6) + "°"
      },
      东: `(${m.x.toFixed(3)}, ${m.y.toFixed(3)}, ${m.z.toFixed(3)})`,
      北: `(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`,
      天: `(${x.x.toFixed(3)}, ${x.y.toFixed(3)}, ${x.z.toFixed(3)})`,
      来源: "椭球体法线（回退模式）",
      坐标模式: a ? "局部坐标系（直接计算）" : "真实世界坐标（ECEF转换）"
    });
    const f = e.height || 100;
    if (a) {
      console.log("[SyncManager._adjustTargetWithEllipsoidNormal] 局部坐标模式：直接计算 target（避免 ECEF 转换误差）");
      const C = {
        east: e.direction.x,
        north: -e.direction.z,
        up: e.direction.y
      }, M = {
        east: C.east * f,
        north: C.north * f,
        up: C.up * f
      }, y = {
        east: M.east,
        north: M.north,
        up: 0
      }, w = {
        x: y.east,
        y: y.up,
        z: -y.north
      };
      console.log("[SyncManager._adjustTargetWithEllipsoidNormal] 局部坐标模式 Target 调整:", {
        原始方向ENU: `(${C.east.toFixed(3)}, ${C.north.toFixed(3)}, ${C.up.toFixed(3)})`,
        原始目标ENU: `(${M.east.toFixed(2)}m, ${M.north.toFixed(2)}m, ${M.up.toFixed(2)}m)`,
        投影后ENU: `(${y.east.toFixed(2)}m, ${y.north.toFixed(2)}m, 0.00m)`,
        最终ThreeJS: `(${w.x.toFixed(2)}, ${w.y.toFixed(2)}, ${w.z.toFixed(2)})`
      }), e.target = w;
    } else {
      console.log("[SyncManager._adjustTargetWithEllipsoidNormal] 真实世界坐标模式：使用 ECEF 转换");
      const C = r.direction, M = {
        x: t.x + C.x * f,
        y: t.y + C.y * f,
        z: t.z + C.z * f
      }, y = i.cartographicToCartesian(new n.Cartographic(s, c, 0)), w = {
        x: M.x - y.x,
        y: M.y - y.y,
        z: M.z - y.z
      }, V = {
        east: w.x * m.x + w.y * m.y + w.z * m.z,
        north: w.x * p.x + w.y * p.y + w.z * p.z,
        up: w.x * x.x + w.y * x.y + w.z * x.z
      };
      console.log("[SyncManager._adjustTargetWithEllipsoidNormal] Target 偏移（ENU）:", {
        east: V.east.toFixed(2) + "m",
        north: V.north.toFixed(2) + "m",
        up: V.up.toFixed(2) + "m"
      });
      const S = {
        x: V.east,
        y: V.up,
        z: -V.north
      };
      console.log("[SyncManager._adjustTargetWithEllipsoidNormal] 调整后 Target (Three.js):", {
        x: S.x.toFixed(2),
        y: S.y.toFixed(2),
        z: S.z.toFixed(2)
      }), e.target = S;
    }
    console.log("[SyncManager._adjustTargetWithEllipsoidNormal] Target 已调整，保持地板平行于椭球体");
  }
  async _getTerrainNormal(e) {
    const t = this.getCesium();
    if (!t || !this.cesiumViewer || !this.cesiumViewer.scene)
      return console.warn("[SyncManager._getTerrainNormal] Cesium 或 scene 不可用"), null;
    try {
      const o = this.cesiumViewer.scene, i = o?.globe?.ellipsoid || t.Ellipsoid.WGS84, n = i.cartesianToCartographic(e), r = 10, a = [
        {
          lon: r,
          lat: 0
        },
        {
          lon: -10,
          lat: 0
        },
        {
          lon: 0,
          lat: r
        },
        {
          lon: 0,
          lat: -10
        }
      ], s = n.latitude, c = 111412.84 * Math.cos(s) - 93.5 * Math.cos(3 * s), l = 111132.95 - 559.82 * Math.cos(2 * s) + 1.175 * Math.cos(4 * s), g = [];
      for (const T of a) {
        const v = T.lon / c, D = T.lat / l, _ = new t.Cartographic(n.longitude + v, n.latitude + D, 0);
        try {
          const b = await t.sampleHeightMostDetailed(o, _);
          g.push({
            longitude: _.longitude,
            latitude: _.latitude,
            height: b
          });
        } catch {
          g.push({
            longitude: _.longitude,
            latitude: _.latitude,
            height: 0
          });
        }
      }
      const u = await t.sampleHeightMostDetailed(o, n);
      g.push({
        longitude: n.longitude,
        latitude: n.latitude,
        height: u
      });
      const d = g.map((T) => i.cartographicToCartesian(new t.Cartographic(T.longitude, T.latitude, T.height))), m = d[4];
      let p = 0, x = 0, f = 0, C = 0, M = 0, y = 0;
      for (let T = 0; T < 4; T++) {
        const v = d[T].x - m.x, D = d[T].y - m.y, _ = d[T].z - m.z;
        p += v * v, x += D * D, f += _ * _, C += v * D, M += v * _, y += D * _;
      }
      const w = [
        [
          p,
          C,
          M
        ],
        [
          C,
          x,
          y
        ],
        [
          M,
          y,
          f
        ]
      ], V = this._computeSmallestEigenvector(w), S = t.Cartesian3.normalize(m, new t.Cartesian3());
      return t.Cartesian3.dot(V, S) < 0 && t.Cartesian3.negate(V, V), V;
    } catch (o) {
      return console.error("[SyncManager._getTerrainNormal] 获取地形法线失败:", o), null;
    }
  }
  _computeSmallestEigenvector(e) {
    const t = this.getCesium(), o = 100, i = 1e-6;
    let n = new t.Cartesian3(1, 1, 1);
    t.Cartesian3.normalize(n, n);
    for (let r = 0; r < o; r++) {
      const a = this._solveLinearSystem(e, n);
      if (t.Cartesian3.magnitude(a) < i) break;
      t.Cartesian3.normalize(a, a);
      const s = t.Cartesian3.dot(n, a);
      if (Math.abs(s - 1) < i) {
        n = a;
        break;
      }
      n = a;
    }
    return n;
  }
  _solveLinearSystem(e, t) {
    const o = this.getCesium(), i = e.map((s) => [...s]), n = {
      x: t.x,
      y: t.y,
      z: t.z
    };
    for (let s = 0; s < 3; s++) {
      let c = s;
      for (let g = s + 1; g < 3; g++) Math.abs(i[g][s]) > Math.abs(i[c][s]) && (c = g);
      [i[s], i[c]] = [i[c], i[s]];
      const l = s === 0 ? n.x : s === 1 ? n.y : n.z;
      s === 0 ? n.x = c === 0 ? n.x : c === 1 ? n.y : n.z : s === 1 ? n.y = c === 0 ? n.x : c === 1 ? n.y : n.z : n.z = c === 0 ? n.x : c === 1 ? n.y : n.z, c === 0 ? (n.x, n.x = l) : c === 1 ? (n.y, n.y = l) : (n.z, n.z = l);
      for (let g = s + 1; g < 3; g++) {
        const u = i[g][s] / i[s][s];
        for (let d = s; d < 3; d++) i[g][d] -= u * i[s][d];
        g === 0 ? n.x -= u * (s === 0 ? n.x : s === 1 ? n.y : n.z) : g === 1 ? n.y -= u * (s === 0 ? n.x : s === 1 ? n.y : n.z) : n.z -= u * (s === 0 ? n.x : s === 1 ? n.y : n.z);
      }
    }
    const r = {
      x: 0,
      y: 0,
      z: 0
    }, a = [
      n.x,
      n.y,
      n.z
    ];
    return r.z = a[2] / i[2][2], r.y = (a[1] - i[1][2] * r.z) / i[1][1], r.x = (a[0] - i[0][1] * r.y - i[0][2] * r.z) / i[0][0], new o.Cartesian3(r.x, r.y, r.z);
  }
  _getTerrainHeightAtPosition(e, t) {
    const o = this.getCesium();
    if (!o || !this.cesiumViewer)
      return console.warn("[SyncManager._getTerrainHeightAtPosition] Cesium 不可用，使用模型海拔作为降级"), this.mercatorProjection.modelAbsoluteMercator?.z || 0;
    try {
      o.Cartographic.fromRadians(e, t, 0);
      let i = null;
      const n = this.mercatorProjection.modelAbsoluteMercator?.z || 0, r = `${e.toFixed(6)}_${t.toFixed(6)}`;
      if (this._terrainHeightCache && this._terrainHeightCache[r]) {
        const a = this._terrainHeightCache[r];
        if (Date.now() - a.timestamp < 5e3) return a.height;
      }
      try {
        const a = this.cesiumViewer.scene;
        if (a && a.globe) {
          const s = o.Cartographic.fromRadians(e, t, 0), c = a.globe.getHeight(s);
          c != null && !isNaN(c) && (i = c, (i < -500 || i > 9e3) && (console.warn("[SyncManager._getTerrainHeightAtPosition] 地形高度超出合理范围，使用模型海拔:", {
            地形高度: i.toFixed(2) + "m",
            模型海拔: n.toFixed(2) + "m"
          }), i = n));
        }
      } catch {
      }
      return i == null && (i = n), this._terrainHeightCache || (this._terrainHeightCache = {}), this._terrainHeightCache[r] = {
        height: i,
        timestamp: Date.now()
      }, i;
    } catch (i) {
      return console.warn("[SyncManager._getTerrainHeightAtPosition] 采样失败，使用模型海拔:", i.message), this.mercatorProjection.modelAbsoluteMercator?.z || 0;
    }
  }
  _getTargetTerrainHeight() {
    return 0;
  }
  handlePanInUnified(e, t, o) {
    const i = this.mouseOperationParams, n = this.unifiedCameraState, r = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem(), a = this.cesiumViewer?.camera, s = this.getCesium();
    let c = null, l = null;
    r && a && s && (c = s.Cartesian3.clone(a.position), l = {
      x: n.position.x,
      y: n.position.y,
      z: n.position.z
    }, this._pendingPanCalibration = {
      initialCesiumPosition: c,
      initialDualState: l,
      timestamp: Date.now()
    });
    let g = o;
    if (r) {
      const M = this._calculateMetersPerPixelOnENUPlane(o, e, t);
      M !== null ? g = M : g = o * 1, (!this._lastLoggedMetersPerPixel || Math.abs(g - this._lastLoggedMetersPerPixel) > 1e-3) && (console.log("[SyncManager.handlePanInUnified] 局部坐标系模式平移计算:", {
        metersPerPixel: g.toFixed(4),
        方法: "按角度分档校准（不应用几何校正）",
        说明: "metersPerPixel用于计算基础距离，校准倍数在后续应用"
      }), this._lastLoggedMetersPerPixel = g);
    }
    const u = this._getCalibratedPanSpeed(), d = e * g * u, m = t * g * u, p = -d, x = m;
    (Math.abs(e) > 1 || Math.abs(t) > 1) && console.log("[SyncManager.handlePanInUnified] 平移输入:", {
      deltaX: e.toFixed(2),
      deltaY: t.toFixed(2),
      metersPerPixel: o.toFixed(4),
      校准倍数: u.toFixed(3),
      说明: `减慢Dual移动以匹配Cesium速度 (×${u.toFixed(3)})`,
      isUsingLocalCoord: r,
      原始panSpeed: i.panSpeed.toFixed(2),
      panX: p.toFixed(2),
      panY: x.toFixed(2),
      direction: {
        x: n.direction.x.toFixed(3),
        y: n.direction.y.toFixed(3),
        z: n.direction.z.toFixed(3)
      },
      right: {
        x: n.right.x.toFixed(3),
        y: n.right.y.toFixed(3),
        z: n.right.z.toFixed(3)
      },
      up: {
        x: n.up.x.toFixed(3),
        y: n.up.y.toFixed(3),
        z: n.up.z.toFixed(3)
      },
      isUnderground: n.position.y < -50,
      isInMercator: Math.abs(n.up.y - 1) < 1e-3
    });
    const f = n.position.y;
    if (n.target.y, Math.abs(n.up.y - 1) < 1e-3 && Math.abs(n.up.x) < 1e-3 && Math.abs(n.up.z) < 1e-3) {
      const M = Math.atan2(n.right.z, n.right.x) * 180 / Math.PI;
      if (Math.abs(M) > 10 && console.warn("[SyncManager.handlePanInUnified] ⚠️ right向量与X轴有明显夹角:", {
        right: `(${n.right.x.toFixed(3)}, ${n.right.y.toFixed(3)}, ${n.right.z.toFixed(3)})`,
        与X轴夹角: M.toFixed(2) + "°",
        panX: p.toFixed(2),
        说明: "这会导致左右平移方向与鼠标移动方向不一致",
        预期平移: "X方向",
        实际平移: `与X轴夹角${M.toFixed(2)}°方向`
      }), n.position.x += n.right.x * p, n.position.y += n.right.y * p, n.position.z += n.right.z * p, n.target.x += n.right.x * p, n.target.y += n.right.y * p, n.target.z += n.right.z * p, Math.abs(p) > 1) {
        const S = Math.abs(n.right.x * p);
        console.log("[SyncManager.handlePanInUnified] 校准倍数应用验证（X方向）:", {
          输入像素: Math.abs(e),
          metersPerPixel: g.toFixed(4),
          校准倍数: u.toFixed(3),
          计算的distanceX: Math.abs(d).toFixed(2) + " m",
          panX: p.toFixed(2) + " m",
          right向量: {
            x: n.right.x.toFixed(3),
            y: n.right.y.toFixed(3),
            z: n.right.z.toFixed(3)
          },
          X方向实际移动: S.toFixed(2) + " m",
          说明: S > 0 ? "校准倍数已应用" : "校准倍数未应用"
        });
      }
      const y = x * (r ? 1 : Math.max(1, n.height / 200)), w = {
        x: n.direction.x,
        y: 0,
        z: n.direction.z
      }, V = Math.sqrt(w.x * w.x + w.z * w.z);
      V > 1e-3 ? (w.x /= V, w.z /= V) : (w.x = 0, w.z = 1, console.log("[SyncManager.handlePanInUnified] 方向向量XZ投影太小，使用默认前进方向:", w)), n.position.x += w.x * y, n.position.y += w.y * y, n.position.z += w.z * y, n.target.x += w.x * y, n.target.y += w.y * y, n.target.z += w.z * y;
    } else if (n.position.x -= n.right.x * p, n.position.y -= n.right.y * p, n.position.z -= n.right.z * p, n.target.x -= n.right.x * p, n.target.y -= n.right.y * p, n.target.z -= n.right.z * p, n.position.y < -50) {
      const M = {
        x: n.direction.x,
        y: 0,
        z: n.direction.z
      }, y = Math.sqrt(M.x * M.x + M.z * M.z);
      y > 1e-3 ? (M.x /= y, M.z /= y) : (M.x = 0, M.z = -1), n.position.x -= M.x * x, n.position.z -= M.z * x, n.target.x -= M.x * x, n.target.z -= M.z * x;
    } else
      n.position.x -= n.up.x * x, n.position.y -= n.up.y * x, n.position.z -= n.up.z * x, n.target.x -= n.up.x * x, n.target.y -= n.up.y * x, n.target.z -= n.up.z * x;
    const C = Math.abs(n.position.y - f);
    if (C > 100 && console.warn("⚠️ [SyncManager] 平移导致 Y 坐标大幅变化:", {
      originalY: f.toFixed(2),
      newY: n.position.y.toFixed(2),
      yDelta: C.toFixed(2),
      deltaY: t.toFixed(2),
      upVector: {
        x: n.up.x.toFixed(3),
        y: n.up.y.toFixed(3),
        z: n.up.z.toFixed(3)
      }
    }), !r && this.floorCenterMercator && this.floorCenterMercator.x !== 0) {
      const M = {
        x: -p,
        y: -x,
        z: 0
      }, y = {
        x: this.floorCenterMercator.x + M.x,
        y: this.floorCenterMercator.y + M.y,
        z: this.floorCenterMercator.z + M.z
      };
      this.setFloorCenter(y), (Math.abs(p) > 1 || Math.abs(x) > 1) && console.log("[SyncManager.handlePanInUnified] 更新地板中心:", {
        delta: {
          x: p.toFixed(2),
          y: x.toFixed(2)
        },
        newFloorCenter: {
          x: y.x.toFixed(2),
          y: y.y.toFixed(2),
          z: y.z.toFixed(2)
        }
      });
    }
    if (r) {
      const M = this._getTargetTerrainHeight(), y = n.target.y;
      n.target.y = M;
      const w = M - y;
      Math.abs(w) > 0.1 && console.log("[SyncManager.handlePanInUnified] 局部坐标系模式：平移后更新target贴地", {
        旧targetY: y.toFixed(2) + "m",
        新targetY: M.toFixed(2) + "m",
        高度差: w.toFixed(2) + "m",
        说明: "target.y已更新到地形高度，确保地板贴地"
      });
    }
  }
  _calibratePanSpeed(e) {
    return this._getCalibratedPanSpeed();
  }
  _initPanSpeedCalibration() {
    this._panSpeedCalibration || (this._panSpeedCalibration = {
      enabled: !1,
      steep: {
        currentFactor: 0.37,
        measurements: []
      },
      medium: {
        currentFactor: 0.35,
        measurements: []
      },
      flat: {
        currentFactor: 0.3,
        measurements: []
      },
      minSamples: 5,
      maxSamples: 20,
      maxStdDev: 0.2,
      lastCalibrationTime: 0,
      calibrationInterval: 100
    }, console.log("[SyncManager._initPanSpeedCalibration] ⭐ 按角度分档平移速度校准系统已初始化:", {
      陡角档位: "0-30°, 固定倍数: 0.37",
      中角档位: "30-60°, 固定倍数: 0.35",
      平角档位: "60-90°, 固定倍数: 0.30",
      说明: "基于透视投影几何原理设置递减倍数（0.37→0.35→0.30），平角档位基于2026年实测数据优化（降低约12%以匹配速度）"
    }));
  }
  _calculateMetersPerPixelOnENUPlane(e, t = 0, o = 0) {
    const i = this.cesiumViewer?.camera, n = this.getCesium();
    if (!i || !n || !e) return null;
    try {
      const r = i.direction;
      if (!r) return null;
      const a = this.mercatorProjection.getENUBasisVectorsAtPosition(i.position, this.cesiumViewer);
      if (!a) return null;
      const { east: s, north: c } = a, l = n.Cartesian3.dot(r, s), g = n.Cartesian3.dot(r, c), u = Math.sqrt(l * l + g * g), d = n.Cartesian3.magnitude(r);
      return d > 1e-3 && u / d, e * 1;
    } catch (r) {
      return console.warn("[SyncManager._calculateMetersPerPixelOnENUPlane] 计算失败:", r), null;
    }
  }
  _getPitchRange() {
    const e = this.cesiumViewer?.camera;
    if (!e) return "medium";
    const t = e.pitch, o = Math.abs(t * 180 / Math.PI);
    return o < 30 ? "steep" : o < 60 ? "medium" : "flat";
  }
  _getCalibratedPanSpeed() {
    this._initPanSpeedCalibration();
    const e = this._getPitchRange(), t = this._panSpeedCalibration[e];
    return console.log("[SyncManager._getCalibratedPanSpeed] 当前校准倍数（按角度分档）:", {
      档位: e === "steep" ? "陡角(0-30°)" : e === "medium" ? "中角(30-60°)" : "平角(60-90°)",
      校准倍数: t.currentFactor.toFixed(3),
      测量样本数: t.measurements.length,
      说明: t.measurements.length >= 5 ? "基于该档位实际平移测量" : "使用递减初始值（陡0.37/中0.35/平0.34），等待更多测量数据验证"
    }), t.currentFactor;
  }
  _recordPanMeasurement(e, t) {
    if (this._initPanSpeedCalibration(), !this._panSpeedCalibration.enabled || Math.abs(e) < 0.01 || Math.abs(t) < 0.01) return;
    const o = this._getPitchRange(), i = this._panSpeedCalibration[o], n = e / t, r = Math.max(0.5, Math.min(2, n)), a = this.cesiumViewer?.camera, s = a ? Math.abs(a.pitch * 180 / Math.PI) : 0;
    Math.abs(n - 1) > 0.05 && console.log("[SyncManager._recordPanMeasurement] 测量到平移偏差（按角度分档）:", {
      档位: o === "steep" ? "陡角(0-30°)" : o === "medium" ? "中角(30-60°)" : "平角(60-90°)",
      当前角度: s.toFixed(1) + "°",
      dualDelta: t.toFixed(4) + " m",
      cesiumDelta: e.toFixed(4) + " m",
      测量因子: n.toFixed(3),
      限制后因子: r.toFixed(3),
      调整方向: n < 1 ? "减慢 Dual" : "加快 Dual"
    });
    const c = 0.3, l = i.currentFactor, g = l * (1 - c) + r * c, u = Math.max(1e-3, 0.05 / (i.measurements.length + 1));
    (Math.abs(g - l) > u || i.measurements.length < 5) && (i.currentFactor = g), i.measurements.push({
      factor: r,
      timestamp: Date.now(),
      cesiumDelta: e,
      dualDelta: t,
      pitchDegrees: s
    }), i.measurements.length > this._panSpeedCalibration.maxSamples && i.measurements.shift(), Math.abs(g - l) > u && console.log("[SyncManager._recordPanMeasurement] 校准倍数已更新（按角度分档）:", {
      档位: o === "steep" ? "陡角(0-30°)" : o === "medium" ? "中角(30-60°)" : "平角(60-90°)",
      当前角度: s.toFixed(1) + "°",
      旧倍数: l.toFixed(3),
      新倍数: g.toFixed(3),
      样本数: i.measurements.length
    });
  }
  _recordPanMeasurementAfterSync() {
    if (!this._pendingPanCalibration) return;
    const { initialCesiumPosition: e, initialDualState: t, timestamp: o, deltaX: i, deltaY: n, direction: r } = this._pendingPanCalibration;
    if (Date.now() - o > 1e3) {
      this._pendingPanCalibration = null;
      return;
    }
    const a = this.cesiumViewer?.camera, s = this.getCesium(), c = this.unifiedCameraState;
    if (!a || !s || !c || !e || !t) return;
    const l = a.position, g = s.Cartesian3.distance(e, l), u = Math.sqrt(Math.pow(c.position.x - t.x, 2) + Math.pow(c.position.z - t.z, 2)), d = Math.sqrt(Math.pow(c.position.x - t.x, 2) + Math.pow(c.position.y - t.y, 2) + Math.pow(c.position.z - t.z, 2));
    let m = 1;
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const f = window.__dualCanvasViewerInstances[0];
      if (f.modelGroup && f.modelGroup.children.length > 0) {
        const C = f.modelGroup.children[0];
        C && C.scale && (m = (C.scale.x + C.scale.y + C.scale.z) / 3, console.log("[SyncManager._recordPanMeasurementAfterSync] ⚠️ 检测到模型缩放:", {
          scaleX: C.scale.x.toFixed(3),
          scaleY: C.scale.y.toFixed(3),
          scaleZ: C.scale.z.toFixed(3),
          平均缩放: m.toFixed(3),
          说明: "模型缩放会影响视觉移动距离：dualDelta * modelScale = 视觉移动距离"
        }));
      }
    }
    const p = d * m, x = u * m;
    if (g > 0.01 || d > 0.01) {
      const f = g / p, C = g / x;
      let M = "";
      if (f > 1 ? M = "Cesium 更快，需要减小 dual 移动" : f < 1 ? M = "Dual 更快，需要减小 Cesium 移动" : M = "视觉速度一致", console.log("[SyncManager._recordPanMeasurementAfterSync] ⭐ 平移测量（含视觉校正）:", {
        "Cesium 实际移动": g.toFixed(4) + " m",
        "Dual 状态变化（3D）": d.toFixed(4) + " m",
        "Dual 状态变化（水平）": u.toFixed(4) + " m",
        模型缩放因子: m.toFixed(3),
        "Dual 视觉移动（3D）": p.toFixed(4) + " m",
        "Dual 视觉移动（水平）": x.toFixed(4) + " m",
        "视觉比率（3D）": f.toFixed(3),
        "视觉比率（水平）": C.toFixed(3),
        说明: M,
        使用测量方法: Math.abs(C - 1) < Math.abs(f - 1) ? "水平距离" : "3D距离"
      }), Math.abs(C - 1) > 0.1) {
        let y = "", w = "";
        C > 1 ? (y = "Dual 移动得更快", w = "Dual 移动太慢，增大校准倍数") : (y = "Cesium 移动得更快", w = "Dual 移动太快，减小校准倍数"), console.warn("[SyncManager._recordPanMeasurementAfterSync] ⚠️ 视觉移动速度不匹配!", {
          用户观察: y,
          数据分析: `Cesium ${g.toFixed(2)}m vs Dual 视觉（水平） ${x.toFixed(2)}m`,
          建议: w,
          当前校准倍数: (() => {
            const V = this._getPitchRange();
            return this._panSpeedCalibration?.[V]?.currentFactor?.toFixed(3) || "N/A";
          })()
        });
      }
    }
    g > 0.1 && u > 0.1 && this._recordPanMeasurement(g, x), this._pendingPanCalibration = null;
  }
  handleZoomInUnified(e) {
    let o = !1, i = "";
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const w = window.__dualCanvasViewerInstances[0], V = this.mercatorProjection?.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
      w.isInRealWorldMode && !V ? (o = !0, i = "真实世界模式") : !V && w.camera1 && w.camera1.position && (Math.abs(w.camera1.position.x) > 1e3 || Math.abs(w.camera1.position.z) > 1e3) && (o = !0, i = "大坐标位置"), V && console.log("[SyncManager.handleZoomInUnified] 局部坐标系模式：使用标准缩放逻辑", {
        isUsingLocalCoord: !0,
        说明: "即使相机坐标较大，也使用局部坐标系的标准缩放"
      });
    }
    const n = this.mouseOperationParams, r = this.unifiedCameraState, a = 1 + e * n.zoomSpeed, s = r.height;
    if (o) {
      const w = this.cesiumViewer?.camera;
      w && this._lastCesiumHeightForSync === void 0 && (this._lastCesiumHeightForSync = w.positionCartographic.height, console.log(`[SyncManager.handleZoomInUnified] ${i}：初始化 Cesium 高度基准`, { Cesium高度: this._lastCesiumHeightForSync.toFixed(2) })), r.height *= a, r.height = Math.max(10, Math.min(5e4, r.height)), console.log(`[SyncManager.handleZoomInUnified] ${i}：只更新高度（${s.toFixed(2)} → ${r.height.toFixed(2)}），不更新位置`);
      return;
    }
    const c = {
      x: r.position.x,
      y: r.position.y,
      z: r.position.z
    }, l = {
      x: r.target.x,
      y: r.target.y,
      z: r.target.z
    }, g = {
      position: { ...r.position },
      direction: { ...r.direction },
      up: { ...r.up },
      right: { ...r.right },
      target: { ...r.target },
      height: r.height
    }, u = r.position.y < -50;
    r.target.y;
    const d = this.mercatorProjection?.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    d ? Math.abs(r.target.y) > 0.5 && (console.warn("⚠️ [SyncManager] 缩放前修正target.y（局部坐标系模式）:", {
      原始targetY: r.target.y.toFixed(2) + "米",
      修正为: "0米（地形高度）",
      说明: "局部坐标系下target应使用地形高度，而非模型海拔"
    }), r.target.y = 0) : Math.abs(r.target.y) > 5 && !u ? (console.warn("⚠️ [SyncManager] 缩放前修正目标点 Y（真实世界模式）:", {
      原始targetY: r.target.y.toFixed(2) + "米",
      修正为: "0米",
      说明: "避免使用偏离地面的target导致缩放跳跃"
    }), r.target.y = 0) : Math.abs(r.target.y) > 0.01 && Math.abs(r.target.y) <= 5 && console.log("[SyncManager] 目标点 Y 在允许范围内，不修正:", { currentTargetY: r.target.y.toFixed(2) + "米" }), r.height /= a, r.height = Math.max(10, Math.min(5e4, r.height));
    const m = r.height / s;
    r.direction.x = g.direction.x, r.direction.y = g.direction.y, r.direction.z = g.direction.z, r.up.x = g.up.x, r.up.y = g.up.y, r.up.z = g.up.z, r.right.x = g.right.x, r.right.y = g.right.y, r.right.z = g.right.z;
    const p = {
      x: c.x - l.x,
      y: c.y - l.y,
      z: c.z - l.z
    }, x = me.normalize(p);
    r.position.x = r.target.x + x.x * r.height, r.position.y = r.target.y + x.y * r.height, r.position.z = r.target.z + x.z * r.height, r.direction.x = -x.x, r.direction.y = -x.y, r.direction.z = -x.z;
    const f = c.y < 0, C = r.position.y < 0;
    f !== C && console.error("🚨 [SyncManager] 缩放导致地上地下跳转!", {
      wasUnderground: f,
      isUnderground: C,
      oldY: c.y.toFixed(2),
      newY: r.position.y.toFixed(2),
      oldHeight: s.toFixed(2),
      newHeight: r.height.toFixed(2),
      beforeDirection: {
        x: g.direction.x.toFixed(6),
        y: g.direction.y.toFixed(6),
        z: g.direction.z.toFixed(6)
      },
      afterDirection: {
        x: r.direction.x.toFixed(6),
        y: r.direction.y.toFixed(6),
        z: r.direction.z.toFixed(6)
      },
      targetY: r.target.y.toFixed(2),
      formula: `position.y = ${r.target.y.toFixed(2)} - (${r.direction.y.toFixed(6)} * ${r.height.toFixed(2)}) = ${r.position.y.toFixed(2)}`
    });
    const M = Math.abs(r.position.y - c.y);
    M > 5e3 && console.warn("⚠️ [SyncManager] 缩放导致 Y 坐标异常跳跃:", {
      zoomFactor: a,
      scale: m,
      oldHeight: s.toFixed(2),
      newHeight: r.height.toFixed(2),
      oldY: c.y.toFixed(2),
      newY: r.position.y.toFixed(2),
      yDelta: M.toFixed(2),
      targetY: r.target.y.toFixed(2),
      isUnderground: r.position.y < 0
    });
    let y = !1;
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const w = window.__dualCanvasViewerInstances[0];
      if (w.camera1) {
        const V = w.camera1.position.x, S = w.camera1.position.z;
        y = Math.abs(V) > 1e3 || Math.abs(S) > 1e3;
      }
    }
    if (!d && !y && this.floorCenterMercator && this.floorCenterMercator.x !== 0) {
      const w = this.getCesiumScreenCenterMercator();
      if (w) {
        const V = Math.abs(w.x - this.floorCenterMercator.x), S = Math.abs(w.y - this.floorCenterMercator.y);
        (V > 1 || S > 1) && (console.log("[SyncManager.handleZoomInUnified] 更新地板中心（缩放后）:", {
          oldFloorCenter: `(${this.floorCenterMercator.x.toFixed(2)}, ${this.floorCenterMercator.y.toFixed(2)})`,
          newFloorCenter: `(${w.x.toFixed(2)}, ${w.y.toFixed(2)})`
        }), this.setFloorCenter(w));
      }
    } else y ? console.log("[SyncManager.handleZoomInUnified] 检测到大坐标相机，跳过地板中心更新") : d && console.log("[SyncManager.handleZoomInUnified] 检测到局部坐标系，跳过地板中心更新");
  }
  handleRotate(e, t) {
    return this.useNewArchitecture ? this.handleRotateWithRouter(e, t) : this.handleRotateInUnified(e, t);
  }
  handleZoom(e) {
    const t = this.mercatorProjection?.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem(), o = this.cesiumViewer?.camera && !this.cesiumViewer.isDestroyed();
    if (t && o) {
      const i = this.cesiumViewer.camera, n = e * this.mouseOperationParams.zoomSpeed, r = i.heading, a = i.pitch, s = i.roll;
      return e > 0 ? i.zoomIn(n) : i.zoomOut(-n), i.heading = r, i.pitch = a, i.roll = s, console.log("[SyncManager.handleZoom] 局部坐标系模式：由Cesium执行缩放", {
        缩放量: n.toFixed(3),
        方向: e > 0 ? "放大" : "缩小"
      }), !0;
    }
    return this.useNewArchitecture ? this.handleZoomWithRouter(e) : this.handleZoomInUnified(e);
  }
  handlePan(e, t, o) {
    return this.useNewArchitecture ? this.handlePanWithRouter(e, t, o) : this.handlePanInUnified(e, t, o);
  }
  handleRotateWithRouter(e, t) {
    if (!this.operationRouter)
      return console.warn("[SyncManager] 操作路由器未初始化，使用降级方案"), this.handleRotateInUnified(e, t);
    try {
      return this.operationRouter.routeRotate(e, t);
    } catch (o) {
      return console.error("[SyncManager] 操作路由器翻转失败，使用降级方案:", o), this.handleRotateInUnified(e, t);
    }
  }
  handleZoomWithRouter(e) {
    if (!this.operationRouter)
      return console.warn("[SyncManager] 操作路由器未初始化，使用降级方案"), this.handleZoomInUnified(e);
    try {
      return this.operationRouter.routeZoom(e);
    } catch (t) {
      return console.error("[SyncManager] 操作路由器缩放失败，使用降级方案:", t), this.handleZoomInUnified(e);
    }
  }
  handlePanWithRouter(e, t, o) {
    if (!this.operationRouter) {
      console.warn("[SyncManager] 操作路由器未初始化，使用降级方案");
      const i = this.handlePanInUnified(e, t, o);
      return i && this._updateFloorCenterAfterPan(), i;
    }
    try {
      const i = this.operationRouter.routePan(e, t, o);
      return i && this._updateFloorCenterAfterPan(), i;
    } catch (i) {
      console.error("[SyncManager] 操作路由器平移失败，使用降级方案:", i);
      const n = this.handlePanInUnified(e, t, o);
      return n && this._updateFloorCenterAfterPan(), n;
    }
  }
  getOperationRouter() {
    return this.operationRouter;
  }
  setUseNewArchitecture(e) {
    this.useNewArchitecture = e, console.log(`[SyncManager] ${e ? "启用" : "禁用"}新架构`), e && this.cesiumViewer && (this._cesiumEventsSetup = !1, this._setupCesiumMouseEvents());
  }
  cleanupCesiumMouseEvents() {
    if (!this._cesiumMouseHandlers || !this.cesiumViewer) return;
    const e = this.cesiumViewer.canvas;
    e && (console.log("[SyncManager] 清理 Cesium 鼠标事件监听器"), e.removeEventListener("mousedown", this._cesiumMouseHandlers.onMouseDown), e.removeEventListener("mousemove", this._cesiumMouseHandlers.onMouseMove), window.removeEventListener("mouseup", this._cesiumMouseHandlers.onMouseUp), e.removeEventListener("contextmenu", this._cesiumMouseHandlers.onContextMenu), this._cesiumMouseHandlers = null, this._cesiumEventsSetup = !1, console.log("[SyncManager] ✅ Cesium 鼠标事件监听器已清理"));
  }
  handleRotate(e, t) {
    return this.useNewArchitecture ? (console.log("[SyncManager] 使用新架构处理旋转（操作路由器）"), this.handleRotateWithRouter(e, t)) : this.handleRotateInUnified(e, t);
  }
  handleZoom(e) {
    return this.useNewArchitecture ? (console.log("[SyncManager] 使用新架构处理缩放（操作路由器）"), this.handleZoomWithRouter(e)) : this.handleZoomInUnified(e);
  }
  handlePan(e, t, o) {
    return this.useNewArchitecture ? (console.log("[SyncManager] 使用新架构处理平移（操作路由器）"), this.handlePanWithRouter(e, t, o)) : this.handlePanInUnified(e, t, o);
  }
  _rebuildOrthonormalBasis() {
    const e = this.unifiedCameraState;
    e.direction = me.normalize(e.direction), e.up = {
      x: 0,
      y: 1,
      z: 0
    };
    const t = Math.sqrt(e.direction.x ** 2 + e.direction.y ** 2 + e.direction.z ** 2);
    if (t > 1e-3) {
      let o = {
        x: e.direction.z / t,
        y: 0,
        z: -e.direction.x / t
      };
      const i = Math.sqrt(o.x ** 2 + o.z ** 2);
      i < 1e-3 ? o = {
        x: 1,
        y: 0,
        z: 0
      } : (o.x /= i, o.z /= i), o.x < 0 && (o.x = -o.x, o.y = -o.y, o.z = -o.z), e.right = o;
      const n = Math.atan2(o.z, o.x) * 180 / Math.PI;
      console.log("[SyncManager._rebuildOrthonormalBasis] 重建正交基:", {
        direction: `(${e.direction.x.toFixed(3)}, ${e.direction.y.toFixed(3)}, ${e.direction.z.toFixed(3)})`,
        up: `(${e.up.x.toFixed(3)}, ${e.up.y.toFixed(3)}, ${e.up.z.toFixed(3)})`,
        right: `(${e.right.x.toFixed(3)}, ${e.right.y.toFixed(3)}, ${e.right.z.toFixed(3)})`,
        rightDotX: e.right.x.toFixed(3),
        与X轴夹角: n.toFixed(2) + "°",
        说明: Math.abs(n) < 10 ? "✅ right向量与X轴对齐良好" : "⚠️ right向量与X轴有明显夹角，可能导致平移方向偏差"
      });
    }
  }
  _updateFloorCenterAfterPan() {
    if (!this.getCesium() || !this.cesiumViewer?.camera) {
      console.warn("[SyncManager] 无法记录相机位置：缺少必要参数");
      return;
    }
    try {
      const e = this.cesiumViewer.camera, t = this.cesiumViewer.scene.globe.ellipsoid.cartesianToCartographic(e.position);
      if (!t) {
        console.warn("[SyncManager] 无法获取相机位置的地理坐标");
        return;
      }
      const o = {
        x: t.longitude * 6378137,
        y: this.surfaceHandler.latitudeToMercator(t.latitude),
        z: t.height
      }, i = {
        x: o.x - this.floorCenterMercator.x,
        y: o.z,
        z: -(o.y - this.floorCenterMercator.y)
      };
      console.log("[SyncManager] 平移后相机位置（地板中心固定）:", {
        地板中心: `(${this.floorCenterMercator.x.toFixed(2)}, ${this.floorCenterMercator.y.toFixed(2)})`,
        相机墨卡托位置: `(${o.x.toFixed(2)}, ${o.y.toFixed(2)}, ${o.z.toFixed(2)})`,
        相对位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
        相机地理坐标: {
          经度: (t.longitude * 180 / Math.PI).toFixed(6),
          纬度: (t.latitude * 180 / Math.PI).toFixed(6),
          高度: t.height.toFixed(2)
        }
      });
    } catch (e) {
      console.error("[SyncManager] 记录平移后相机位置失败:", e);
    }
  }
  syncUnifiedToCesium(e, t) {
    if (this._skipNextCesiumSync)
      return console.log("[SyncManager.syncUnifiedToCesium] 跳过同步：已在 handleRotateInUnified 中同步"), this._skipNextCesiumSync = !1, !0;
    if (this._syncOperationCount && this._syncOperationCount > 0)
      return console.log("[SyncManager.syncUnifiedToCesium] 跳过同步：相机操作正在进行，计数器:", this._syncOperationCount), !1;
    if (!this.getCesium() || !e)
      return console.error("[SyncManager] syncUnifiedToCesium 缺少必要参数"), !1;
    const o = 1e3;
    let i = !1, n = "";
    const r = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    if (r && (i = !0, n = "局部坐标系模式"), !i && window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const s = window.__dualCanvasViewerInstances[0];
      s && s.isInRealWorldMode ? (i = !0, n = "真实世界模式") : s && s.camera1 && s.camera1.position && (Math.abs(s.camera1.position.x) > o || Math.abs(s.camera1.position.z) > o) && (i = !0, n = "大坐标位置");
    }
    if (i) if (r) {
      console.log(`[SyncManager.syncUnifiedToCesium] ${n}：使用 syncDirectionToCesium 保持旋转一致性`);
      const s = this.mercatorProjection.syncDirectionToCesium(this.unifiedCameraState, e, t);
      return s || console.error("[SyncManager] 局部坐标系模式下同步方向到 Cesium 失败"), s;
    } else {
      const s = this.unifiedCameraState;
      this._lastStateHeight || (this._lastStateHeight = s.height);
      const c = s.height / this._lastStateHeight;
      if (this._lastStateHeight = s.height, Math.abs(c - 1) > 1e-3) {
        const l = e.heading, g = e.pitch, u = e.roll, d = e.positionCartographic.height, m = Math.abs(d * (c - 1)), p = Math.max(1, Math.min(1e7, m));
        c > 1 ? e.zoomIn(p) : e.zoomOut(p), e.setView({ orientation: {
          heading: l,
          pitch: g,
          roll: u
        } }), console.log(`[SyncManager.syncUnifiedToCesium] ${n}：执行 Cesium 缩放并恢复方向`, {
          heightRatio: c.toFixed(4),
          currentHeight: d.toFixed(2),
          zoomAmount: p.toFixed(2),
          direction: c > 1 ? "zoomIn" : "zoomOut",
          headingPreserved: (e.heading - l).toExponential(4),
          pitchPreserved: (e.pitch - g).toExponential(4),
          rollPreserved: (e.roll - u).toExponential(4)
        });
      }
      return !0;
    }
    const a = this.mercatorProjection.syncToCesium(this.unifiedCameraState, e, t);
    return a || console.error("[SyncManager] 同步到 Cesium 失败"), a;
  }
  syncUnifiedToThree() {
    if (this._syncOperationCount && this._syncOperationCount > 0) {
      console.log("[SyncManager.syncUnifiedToThree] 跳过同步：相机操作正在进行，计数器:", this._syncOperationCount);
      return;
    }
    const e = window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0 && window.__dualCanvasViewerInstances[0];
    let t = !1, o = "";
    if (e && e.isInRealWorldMode && (t = !0, o = "真实世界模式"), t) {
      console.log(`[SyncManager.syncUnifiedToThree] ${o}：使用大坐标模式同步逻辑`);
      const v = this.cesiumViewer?.camera, D = this.unifiedCameraState, _ = {
        x: D.direction.x,
        y: D.direction.y,
        z: D.direction.z
      }, b = {
        x: D.up.x,
        y: D.up.y,
        z: D.up.z
      };
      if (e && e.camera1 && e.camera1.position && e.controls1) {
        const E = e.camera1.position.clone(), F = e.controls1.target.clone();
        !this._lastCesiumHeightForSync && v && (this._lastCesiumHeightForSync = v.positionCartographic.height, this._lastThreeHeightForSync = E.y, this._lastThreeTargetYForSync = F.y);
        const P = e.syncDepth || 0;
        e.syncDepth = P + 1, v && (this._lastCesiumHeightForSync ? (this._lastCesiumHeightForSync = v.positionCartographic.height, this._lastThreeHeightForSync = E.y, this._lastThreeTargetYForSync = F.y) : (this._lastCesiumHeightForSync = v.positionCartographic.height, this._lastThreeHeightForSync = E.y, this._lastThreeTargetYForSync = F.y)), e.syncDepth = P;
        const R = D.target || {
          x: 0,
          y: 0,
          z: 0
        }, L = {
          x: D.position.x,
          y: D.position.y,
          z: D.position.z
        }, A = {
          x: R.x,
          y: R.y,
          z: R.z
        };
        return console.log(`[SyncManager.syncUnifiedToThree] ${o}：使用 unifiedCameraState 方向计算相机位置`, {
          height: D.height.toFixed(2),
          direction: `(${_.x.toFixed(3)}, ${_.y.toFixed(3)}, ${_.z.toFixed(3)})`,
          up: `(${b.x.toFixed(3)}, ${b.y.toFixed(3)}, ${b.z.toFixed(3)})`,
          position: `(${L.x.toFixed(2)}, ${L.y.toFixed(2)}, ${L.z.toFixed(2)})`,
          target: `(${A.x.toFixed(2)}, ${A.y.toFixed(2)}, ${A.z.toFixed(2)})`
        }), {
          position: L,
          target: A,
          direction: _,
          up: b,
          right: {
            x: b.y * _.z - b.z * _.y,
            y: b.z * _.x - b.x * _.z,
            z: b.x * _.y - b.y * _.x
          },
          _isLargeCoordMode: !0
        };
      } else
        return console.warn("[SyncManager.syncUnifiedToThree] 大坐标模式下 dualViewer 未就绪", {
          hasDualViewer: !!e,
          hasCamera1: !!e?.camera1,
          hasPosition: !!e?.camera1?.position,
          hasControls1: !!e?.controls1
        }), null;
    }
    const i = this.unifiedCameraState;
    let n = this.floorCenterMercator;
    const r = this.mercatorProjection.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    r && this.mercatorProjection.modelAbsoluteMercator && (n = this.mercatorProjection.modelAbsoluteMercator);
    const a = i.position.x + n.x, s = -i.position.z + n.y, c = i.position.y, l = i.target.x + n.x, g = -i.target.z + n.y, u = i.target.y, d = i.position.x, m = i.position.z, p = this.mercatorToThree(a, s, c), x = this.mercatorToThree(l, g, u);
    if (r && (Math.abs(d) > 1 || Math.abs(m) > 1)) {
      const v = d, D = m, _ = p.x, b = p.z, E = _ / v, F = b / D;
      console.log("[SyncManager.syncUnifiedToThree] 坐标转换缩放检测:", {
        期望X: v.toFixed(2),
        实际X: _.toFixed(2),
        X缩放: E.toFixed(3),
        期望Z: D.toFixed(2),
        实际Z: b.toFixed(2),
        Z缩放: F.toFixed(3),
        说明: E !== 1 || F !== 1 ? "⚠️ 存在额外缩放" : "✓ 无额外缩放"
      });
    }
    const f = {
      x: x.x - p.x,
      y: x.y - p.y,
      z: x.z - p.z
    }, C = Math.sqrt(f.x ** 2 + f.y ** 2 + f.z ** 2);
    C > 1e-4 && (f.x /= C, f.y /= C, f.z /= C);
    const M = this.mercatorVectorToThree(i.up.x, i.up.y, i.up.z), y = f.x * M.x + f.y * M.y + f.z * M.z, w = {
      x: M.x - f.x * y,
      y: M.y - f.y * y,
      z: M.z - f.z * y
    }, V = Math.sqrt(w.x ** 2 + w.y ** 2 + w.z ** 2);
    V > 1e-4 ? (w.x /= V, w.y /= V, w.z /= V) : (w.x = 0, w.y = 1, w.z = 0);
    const S = {
      x: w.y * f.z - w.z * f.y,
      y: w.z * f.x - w.x * f.z,
      z: w.x * f.y - w.y * f.x
    }, T = Math.sqrt(S.x ** 2 + S.y ** 2 + S.z ** 2);
    return T > 1e-4 && (S.x /= T, S.y /= T, S.z /= T), {
      position: p,
      target: x,
      direction: f,
      up: w,
      right: S
    };
  }
  initFromCesium(e, t) {
    if (!this.getCesium() || !e) {
      console.error("[SyncManager] initFromCesium 缺少必要参数");
      return;
    }
    const o = 1e3, i = this.mercatorProjection?.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem();
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0 && !i) {
      const r = window.__dualCanvasViewerInstances[0];
      if (r && r.camera1 && r.camera1.position && (Math.abs(r.camera1.position.x) > o || Math.abs(r.camera1.position.z) > o)) {
        console.log("[SyncManager.initFromCesium] 大坐标模式：跳过从 Cesium 初始化，保持现有状态");
        return;
      }
    }
    const n = this.mercatorProjection.initFromCesium(e, t);
    n ? (this.unifiedCameraState = n, console.log("[SyncManager] 从 Cesium 初始化完成")) : console.error("[SyncManager] 从 Cesium 初始化失败");
  }
  reinitUnifiedState() {
    if (console.log("[SyncManager] 重新初始化 unifiedCameraState"), !window.__dualCanvasViewerInstances || window.__dualCanvasViewerInstances.length === 0) {
      console.warn("[SyncManager.reinitUnifiedState] DualCanvasViewer 实例不存在");
      return;
    }
    const e = window.__dualCanvasViewerInstances[0];
    if (!e || !e.camera1) {
      console.warn("[SyncManager.reinitUnifiedState] camera1 不存在");
      return;
    }
    const t = e.camera1, o = e.controls1, i = new h.Vector3();
    t.getWorldDirection(i);
    let n;
    if (o && o.target) {
      const g = new h.Vector3().copy(o.target), u = Math.sqrt(Math.pow(g.x - t.position.x, 2) + Math.pow(g.z - t.position.z, 2));
      if (u > 500) {
        console.log("[SyncManager.reinitUnifiedState] ⚠️⚠️⚠️ target 距离相机太远，使用相机方向重新计算!", {
          原始target: `(${g.x.toFixed(2)}, ${g.y.toFixed(2)}, ${g.z.toFixed(2)})`,
          相机位置: `(${t.position.x.toFixed(2)}, ${t.position.y.toFixed(2)}, ${t.position.z.toFixed(2)})`,
          水平距离: u.toFixed(2) + " 米",
          说明: "在局部坐标模式下，target 应该在相机附近，不应该这么远"
        });
        const d = this.mercatorProjection?.isUsingLocalCoordinateSystem?.() || !1, m = Math.max(50, Math.min(400, t.position.y * 0.6)), p = new h.Vector3();
        t.getWorldDirection(p), d ? (n = new h.Vector3(0, 0, 0), console.log("[SyncManager.reinitUnifiedState] ⭐ 局部坐标系模式：强制target到地面", {
          target: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`,
          相机Y: t.position.y.toFixed(2) + "米",
          说明: "保持target在原点(0,0,0)，确保地板贴地"
        })) : n = new h.Vector3(t.position.x + p.x * m, t.position.y + p.y * m, t.position.z + p.z * m), o.target.copy(n), console.log("[SyncManager.reinitUnifiedState] ✅✅✅ 已更新 controls1.target 到合理位置:", `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`);
      } else
        n = g, console.log("[SyncManager.reinitUnifiedState] ✅ target 距离合理，使用 controls1.target:", {
          target: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`,
          水平距离: u.toFixed(2) + " 米"
        });
    } else
      n = new h.Vector3(t.position.x + i.x * 500, t.position.y + i.y * 500, t.position.z + i.z * 500);
    const r = t.position.distanceTo(n), a = new h.Vector3().subVectors(n, t.position).normalize(), s = {
      position: {
        x: t.position.x,
        y: t.position.y,
        z: t.position.z
      },
      target: {
        x: n.x,
        y: n.y,
        z: n.z
      },
      direction: {
        x: a.x,
        y: a.y,
        z: a.z
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      right: {
        x: 1,
        y: 0,
        z: 0
      },
      height: r
    };
    s.height = Math.max(10, Math.min(5e4, s.height));
    const c = Math.PI * 0.944, l = Math.cos(c);
    if (s.direction.y < l) {
      console.warn("[SyncManager.reinitUnifiedState] ⚠️ 初始相机角度接近极点翻转区域，进行调整:", {
        原始direction: `(${s.direction.x.toFixed(3)}, ${s.direction.y.toFixed(3)}, ${s.direction.z.toFixed(3)})`,
        原始polarAngle: `${(Math.acos(s.direction.y) * 180 / Math.PI).toFixed(1)}°`,
        限制: `≤ ${c * 180 / Math.PI}°`
      });
      const g = Math.sqrt(s.direction.x ** 2 + s.direction.z ** 2);
      let u, d, m;
      if (g < 0.01) {
        const p = l + 0.01, x = Math.sqrt(1 - p * p);
        d = new h.Vector3(0, p, -x), u = new h.Vector3(t.position.x + d.x * s.height, t.position.y + d.y * s.height, t.position.z + d.z * s.height), m = s.height, console.log("[SyncManager.reinitUnifiedState] 完全垂直向下，创建新的方向和目标");
      } else {
        const p = l + 0.01, x = Math.sqrt(1 - p * p), f = Math.sqrt(s.direction.x ** 2 + s.direction.z ** 2);
        d = new h.Vector3(s.direction.x / f * x, p, s.direction.z / f * x), d.normalize(), new h.Vector3(s.target.x - t.position.x, s.target.y - t.position.y, s.target.z - t.position.z).length() < 10 ? (u = new h.Vector3(t.position.x + d.x * s.height, t.position.y + d.y * s.height, t.position.z + d.z * s.height), m = s.height) : (u = new h.Vector3(s.target.x, s.target.y, s.target.z), m = t.position.distanceTo(u), d.subVectors(u, t.position).normalize()), console.log("[SyncManager.reinitUnifiedState] 调整现有方向到安全范围");
      }
      s.direction = {
        x: d.x,
        y: d.y,
        z: d.z
      }, s.target = {
        x: u.x,
        y: u.y,
        z: u.z
      }, s.height = m, o && o.target.copy(u), console.log("[SyncManager.reinitUnifiedState] ✅ 已调整相机到安全范围:", {
        新direction: `(${s.direction.x.toFixed(3)}, ${s.direction.y.toFixed(3)}, ${s.direction.z.toFixed(3)})`,
        新polarAngle: `${(Math.acos(s.direction.y) * 180 / Math.PI).toFixed(1)}°`,
        新height: m.toFixed(2),
        新target: `(${u.x.toFixed(2)}, ${u.y.toFixed(2)}, ${u.z.toFixed(2)})`
      }), console.log("[SyncManager.reinitUnifiedState] ✅ 已同步更新 controls1.target 和 height");
    }
    this._rebuildOrthonormalBasis(s), this.unifiedCameraState = s, console.log("[SyncManager] unifiedCameraState 重新初始化完成:", {
      cameraPosition: `(${t.position.x.toFixed(2)}, ${t.position.y.toFixed(2)}, ${t.position.z.toFixed(2)})`,
      controlsTarget: o ? `(${o.target.x.toFixed(2)}, ${o.target.y.toFixed(2)}, ${o.target.z.toFixed(2)})` : "null",
      position: `(${s.position.x.toFixed(2)}, ${s.position.y.toFixed(2)}, ${s.position.z.toFixed(2)})`,
      target: `(${s.target.x.toFixed(2)}, ${s.target.y.toFixed(2)}, ${s.target.z.toFixed(2)})`,
      height: s.height.toFixed(2),
      direction: `(${s.direction.x.toFixed(3)}, ${s.direction.y.toFixed(3)}, ${s.direction.z.toFixed(3)})`
    });
  }
  normalizeVector(e) {
    const t = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    return t > 1e-4 ? {
      x: e.x / t,
      y: e.y / t,
      z: e.z / t
    } : {
      x: 0,
      y: 0,
      z: 0
    };
  }
  _syncCesiumToUnified(e, t, o = !1) {
    const i = this.getCesium();
    if (!i || !e || !this.floorCenterMercator) {
      console.warn("[SyncManager._syncCesiumToUnified] 跳过同步，缺少必要参数:", {
        hasCesium: !!i,
        hasCamera: !!e,
        hasFloorCenter: !!this.floorCenterMercator
      });
      return;
    }
    const n = t?.globe?.ellipsoid || i.Ellipsoid.WGS84, r = 6378137;
    if (this.mercatorProjection?.isUsingLocalCoordinateSystem && this.mercatorProjection.isUsingLocalCoordinateSystem()) {
      const l = n.cartesianToCartographic(e.position), g = this.unifiedCameraState, u = l.height, d = this.mercatorProjection.modelAbsoluteAltitude || 0, m = u - d;
      g.position.y = m, g.height = Math.abs(m), (!g.target || g.target.y !== 0) && (g.target = {
        x: g.position.x || 0,
        y: 0,
        z: g.position.z || 0
      }, console.log("[SyncManager._syncCesiumToUnified] 局部坐标系：已更新target到地面")), console.log("[SyncManager._syncCesiumToUnified] 局部坐标系：同步Cesium高度到dual", {
        Cesium高度: u.toFixed(2) + "米",
        模型海拔: d.toFixed(2) + "米",
        dual相对高度: m.toFixed(2) + "米",
        说明: "Cesium主导缩放后的高度已同步到dual组件",
        target: `(${g.target.x.toFixed(2)}, ${g.target.y.toFixed(2)}, ${g.target.z.toFixed(2)})`
      }), this.mercatorProjection.syncDirectionToCesium?.(this.unifiedCameraState, e, t);
      return;
    }
    let a = !1;
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const l = window.__dualCanvasViewerInstances[0];
      l && l.isInRealWorldMode && (a = !0);
    }
    if (a) {
      console.log("[SyncManager._syncCesiumToUnified] 大坐标模式：使用简化的状态更新（不使用射线求交）");
      const l = n.cartesianToCartographic(e.position), g = {
        x: l.longitude * r,
        y: this.surfaceHandler.latitudeToMercator(l.latitude),
        z: l.height
      }, u = this.unifiedCameraState;
      u.position.x = g.x - this.floorCenterMercator.x, u.position.z = -(g.y - this.floorCenterMercator.y), u.position.y = g.z;
      const d = this.getCesium(), m = e.direction, p = e.up, x = l.longitude, f = l.latitude, C = Math.sin(x), M = Math.cos(x), y = Math.sin(f), w = Math.cos(f), V = {
        x: -C * m.x + M * m.y,
        y: -y * M * m.x - y * C * m.y + w * m.z,
        z: w * M * m.x + w * C * m.y + y * m.z
      };
      u.direction = {
        x: V.x,
        y: V.z,
        z: -V.y
      };
      const S = Math.sqrt(u.direction.x ** 2 + u.direction.y ** 2 + u.direction.z ** 2);
      S > 1e-4 && (u.direction.x /= S, u.direction.y /= S, u.direction.z /= S);
      const T = {
        x: -C * p.x + M * p.y,
        y: -y * M * p.x - y * C * p.y + w * p.z,
        z: w * M * p.x + w * C * p.y + y * p.z
      };
      u.up = {
        x: T.x,
        y: T.z,
        z: -T.y
      };
      const v = Math.sqrt(u.up.x ** 2 + u.up.y ** 2 + u.up.z ** 2);
      v > 1e-4 && (u.up.x /= v, u.up.y /= v, u.up.z /= v), this._rebuildOrthonormalBasis();
      let D;
      try {
        D = d.Cartographic.fromRadians(l.longitude, l.latitude, 0);
      } catch (E) {
        console.warn("[SyncManager._syncCesiumToUnified] 计算目标点失败:", E), D = l;
      }
      const _ = {
        x: D.longitude * r,
        y: this.surfaceHandler.latitudeToMercator(D.latitude),
        z: 0
      };
      u.target = {
        x: _.x - this.floorCenterMercator.x,
        y: 0,
        z: -(_.y - this.floorCenterMercator.y)
      };
      const b = this.floorCenterMercator?.originalFloorHeight || 0;
      u.height = Math.max(1, l.height - b), console.log("[SyncManager._syncCesiumToUnified] 大坐标模式：已更新统一坐标系状态", {
        cameraHeight: l.height.toFixed(2),
        modelHeight: b.toFixed(2),
        stateHeight: u.height.toFixed(2),
        statePosition: `(${u.position.x.toFixed(2)}, ${u.position.y.toFixed(2)}, ${u.position.z.toFixed(2)})`,
        stateDirection: `(${u.direction.x.toFixed(3)}, ${u.direction.y.toFixed(3)}, ${u.direction.z.toFixed(3)})`,
        stateUp: `(${u.up.x.toFixed(3)}, ${u.up.y.toFixed(3)}, ${u.up.z.toFixed(3)})`,
        stateTarget: `(${u.target.x.toFixed(2)}, ${u.target.y.toFixed(2)}, ${u.target.z.toFixed(2)})`,
        stateRight: `(${u.right.x.toFixed(3)}, ${u.right.y.toFixed(3)}, ${u.right.z.toFixed(3)})`
      });
      return;
    }
    let s = !1;
    if (window.__dualCanvasViewerInstances && window.__dualCanvasViewerInstances.length > 0) {
      const l = window.__dualCanvasViewerInstances[0];
      l && l.usingENU && (s = !0, console.log("[SyncManager._syncCesiumToUnified] ENU 模式：检测到 ENU 坐标系统，跳过射线求交"));
    }
    const c = this.unifiedCameraState;
    try {
      const l = n.cartesianToCartographic(e.position);
      if (!l || typeof l.longitude > "u" || typeof l.latitude > "u") return;
      const g = {
        x: l.longitude * r,
        y: this.surfaceHandler.latitudeToMercator(l.latitude),
        z: l.height
      };
      if (c.position.x = g.x - this.floorCenterMercator.x, c.position.z = -(g.y - this.floorCenterMercator.y), c.position.y = g.z, console.log("[SyncManager._syncCesiumToUnified] 更新统一坐标系位置:", {
        cameraHeight: l.height.toFixed(2),
        mercatorPositionZ: g.z.toFixed(2),
        statePositionY: c.position.y.toFixed(2),
        floorCenterMercator: this.floorCenterMercator,
        keepTarget: o
      }), !o) {
        let d;
        try {
          let x, f = !1;
          try {
            if (x = e.direction, f = i.defined(x) && isFinite(x.x) && isFinite(x.y) && isFinite(x.z) && !isNaN(x.x) && !isNaN(x.y) && !isNaN(x.z), f) {
              const C = Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z);
              f = C > 1e-3 && C < 1e3;
            }
          } catch {
            f = !1;
          }
          if (!f)
            console.warn("[SyncManager._syncCesiumToUnified] 相机方向向量无效，使用正下方地面点作为目标:", {
              direction: x,
              cameraPosition: e.position
            }), d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0);
          else if (s)
            console.log("[SyncManager._syncCesiumToUnified] ENU 模式：跳过射线求交，使用正下方地面点"), d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0);
          else {
            const C = l.height < 0, M = e.direction.y < 0, y = i.Cartesian3.dot(i.Cartesian3.normalize(e.position, new i.Cartesian3()), e.direction);
            if (C ? M : y < 0) try {
              const w = new i.Ray(e.position, e.direction), V = i.IntersectionTests.rayEllipsoid(w, n);
              i.defined(V) && isFinite(V.x) && isFinite(V.y) && isFinite(V.z) ? (d = n.cartesianToCartographic(V), console.log("[SyncManager._syncCesiumToUnified] 射线求交成功:", { targetHeight: d.height.toFixed(2) })) : (console.warn("[SyncManager._syncCesiumToUnified] 射线求交返回无效结果，使用正下方地面点"), d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0));
            } catch (w) {
              console.error("[SyncManager._syncCesiumToUnified] 射线求交异常:", w), d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0);
            }
            else
              console.log("[SyncManager._syncCesiumToUnified] 射线不指向地球，使用正下方地面点"), d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0);
          }
        } catch {
          if (isFinite(l.longitude) && isFinite(l.latitude) && !isNaN(l.longitude) && !isNaN(l.latitude)) d = i.Cartographic.fromRadians(l.longitude, l.latitude, 0);
          else return;
        }
        const m = (x) => typeof x == "number" && isFinite(x) && !isNaN(x);
        if (!d || !m(d.longitude) || !m(d.latitude) || !m(d.height)) return;
        const p = {
          x: d.longitude * r,
          y: this.surfaceHandler.latitudeToMercator(d.latitude),
          z: 0
        };
        c.target.x = p.x - this.floorCenterMercator.x, c.target.z = -(p.y - this.floorCenterMercator.y), c.target.y = 0;
      }
      const u = i.Cartesian3.fromRadians(l.longitude, l.latitude, 0);
      c.height = i.Cartesian3.distance(e.position, u);
    } catch (l) {
      console.error("[SyncManager] _syncCesiumToUnified 失败:", l);
    }
  }
  setCesiumMouseMercator(e) {
    this.cesiumMouseMercator = e;
  }
  getCesiumMouseMercator() {
    return this.cesiumMouseMercator;
  }
  calculateSurfaceNormal(e, t) {
    const o = this.getCesium();
    if (!o || !e || !t) return {
      x: 0,
      y: 1,
      z: 0
    };
    try {
      const i = t.cartographicToCartesian(e), n = o.Cartesian3.normalize(i, new o.Cartesian3());
      return {
        x: n.x,
        y: n.z,
        z: -n.y
      };
    } catch (i) {
      return console.error("[SyncManager] calculateSurfaceNormal 失败:", i), {
        x: 0,
        y: 1,
        z: 0
      };
    }
  }
  calculateFloorQuaternion(e) {
    const t = new h.Vector3(0, 1, 0), o = new h.Vector3(e.x, e.y, e.z).normalize(), i = new h.Quaternion();
    return t.dot(o) < -0.9999 ? i.setFromAxisAngle(new h.Vector3(0, 0, 1), Math.PI) : i.setFromUnitVectors(t, o), {
      x: i.x,
      y: i.y,
      z: i.z,
      w: i.w
    };
  }
  validateAndFixUnifiedState() {
    const e = this.unifiedCameraState;
    let t = !1;
    const o = Date.now(), i = o - this.heightTracker.lastSyncTime;
    if ((e.height < 10 || e.height > 5e4 || !isFinite(e.height)) && (console.warn("⚠️ [SyncManager] 验证检测到异常高度，正在修正:", { originalHeight: e.height }), e.height = Math.max(10, Math.min(5e4, e.height || 500)), t = !0), this.heightTracker.lastValidHeight !== null && i > this.heightTracker.minSyncInterval) {
      const r = Math.abs(e.height - this.heightTracker.lastValidHeight), a = r / this.heightTracker.lastValidHeight;
      a > this.heightTracker.anomalyThreshold ? (this.heightTracker.consecutiveAnomalies++, console.warn("⚠️ [SyncManager] 检测到高度异常变化（可能的累积误差）:", {
        当前高度: e.height.toFixed(2),
        上次有效高度: this.heightTracker.lastValidHeight.toFixed(2),
        变化量: r.toFixed(2),
        变化率: (a * 100).toFixed(2) + "%",
        连续异常次数: this.heightTracker.consecutiveAnomalies
      }), this.heightTracker.consecutiveAnomalies >= this.heightTracker.maxAnomalies && (console.error("🚨 [SyncManager] 连续异常次数超过阈值，强制修正高度:", {
        原始高度: e.height.toFixed(2),
        修正为: this.heightTracker.lastValidHeight.toFixed(2)
      }), e.height = this.heightTracker.lastValidHeight, this.heightTracker.consecutiveAnomalies = 0, t = !0)) : this.heightTracker.consecutiveAnomalies = 0;
    }
    if (this.heightTracker.history.push({
      height: e.height,
      timestamp: o
    }), this.heightTracker.history.length > this.heightTracker.maxHistorySize && this.heightTracker.history.shift(), isFinite(e.height) && e.height >= 10 && e.height <= 5e4 && (this.heightTracker.lastValidHeight = e.height), this.heightTracker.lastSyncTime = o, !isFinite(e.position.y) || Math.abs(e.position.y) > 5e4) {
      console.warn("⚠️ [SyncManager] 验证检测到异常 position.y，正在修正:", { originalY: e.position.y });
      const r = e.position.y < 0;
      e.position.y = r ? -500 : 500, t = !0;
    }
    (!isFinite(e.target.y) || Math.abs(e.target.y) > 1e3) && (console.warn("⚠️ [SyncManager] 验证检测到异常 target.y，正在修正:", { originalTargetY: e.target.y }), e.target.y = 0, t = !0);
    const n = Math.sqrt(e.direction.x ** 2 + e.direction.y ** 2 + e.direction.z ** 2);
    return (!isFinite(n) || n < 1e-3) && (console.warn("⚠️ [SyncManager] 验证检测到异常方向向量，正在重置"), e.direction = {
      x: 0,
      y: -1,
      z: 0
    }, e.up = {
      x: 0,
      y: 1,
      z: 0
    }, e.right = {
      x: 1,
      y: 0,
      z: 0
    }, t = !0), t && (console.info("✅ [SyncManager] 统一状态已修正"), this._rebuildOrthonormalBasis()), t;
  }
  reset() {
    this.syncDepth = 0, this.throttleTimer = null;
  }
};
function Wt(e) {
  try {
    return window.__syncManager__ ? e ? (window.__syncManager__.setCesium(e), console.log("[safeSetCesium] ✓ Cesium 实例已成功设置到 SyncManager"), !0) : (console.error("[safeSetCesium] Cesium 参数为空"), !1) : (console.warn("[safeSetCesium] SyncManager 未初始化，请确保 DualCanvasViewer 已加载"), !1);
  } catch (t) {
    return console.error("[safeSetCesium] 设置 Cesium 实例时出错:", t), !1;
  }
}
function Yt(e, t = 1e4) {
  return new Promise((o, i) => {
    const n = Date.now();
    function r() {
      if (window.__dualCanvasViewerReady__ && window.__syncManager__) {
        try {
          e(), o(!0);
        } catch (a) {
          console.error("[waitForDualCanvasViewer] 回调执行失败:", a), i(a);
        }
        return;
      }
      if (Date.now() - n > t) {
        console.error("[waitForDualCanvasViewer] 等待 DualCanvasViewer 初始化超时"), o(!1);
        return;
      }
      setTimeout(r, 100);
    }
    r();
  });
}
typeof window < "u" && (window.safeSetCesium = Wt, window.waitForDualCanvasViewer = Yt);
var Kt = class {
  constructor() {
    this.terrainHeight = 0, this.obliqueOffset = 0, this.modelAltitude = 0, this.dualFloorHeight = 0, this.alignmentMode = "terrain", this.obliqueLoaded = !1, this.dualModelLoaded = !1, console.log("[HeightAlignmentManager] ✅ 初始化完成");
  }
  setTerrainHeight(e) {
    this.terrainHeight = e, console.log("[HeightAlignmentManager] 🌍 地形高度已更新:", e.toFixed(2) + "米");
  }
  setObliqueOffset(e) {
    this.obliqueOffset = e, console.log("[HeightAlignmentManager] 📷 倾斜摄影偏移已更新:", e.toFixed(2) + "米");
  }
  setModelAltitude(e) {
    this.modelAltitude = e, console.log("[HeightAlignmentManager] 🏗️ 模型海拔已更新:", e.toFixed(2) + "米");
  }
  setDualFloorHeight(e) {
    this.dualFloorHeight = e, console.log("[HeightAlignmentManager] 📊 Dual地板高度已更新:", e.toFixed(2) + "米");
  }
  setAlignmentMode(e) {
    this.alignmentMode = e, console.log("[HeightAlignmentManager] 🎯 对齐模式已切换:", e);
  }
  setObliqueLoaded(e) {
    this.obliqueLoaded = e, console.log("[HeightAlignmentManager] 📷 倾斜摄影状态:", e ? "已加载" : "未加载");
  }
  setDualModelLoaded(e) {
    this.dualModelLoaded = e, console.log("[HeightAlignmentManager] 🏗️ Dual模型状态:", e ? "已加载" : "未加载");
  }
  calculateAlignmentHeight() {
    switch (this.alignmentMode) {
      case "terrain":
        return this.terrainHeight + this.obliqueOffset;
      case "model":
        return this.modelAltitude;
      case "smart":
        const e = this.terrainHeight + this.obliqueOffset, t = this.modelAltitude;
        return Math.max(e, t);
      default:
        return this.terrainHeight + this.obliqueOffset;
    }
  }
  calculateAnchorContainerHeight() {
    return this.calculateAlignmentHeight();
  }
  getAlignmentInfo() {
    const e = this.calculateAlignmentHeight();
    return {
      地形高度: this.terrainHeight.toFixed(2) + "米",
      倾斜摄影偏移: this.obliqueOffset.toFixed(2) + "米",
      模型海拔: this.modelAltitude.toFixed(2) + "米",
      Dual地板高度: this.dualFloorHeight.toFixed(2) + "米",
      对齐模式: this.alignmentMode,
      统一对齐高度: e.toFixed(2) + "米",
      anchorContainer高度: this.calculateAnchorContainerHeight().toFixed(2) + "米",
      倾斜摄影状态: this.obliqueLoaded ? "已加载" : "未加载",
      Dual模型状态: this.dualModelLoaded ? "已加载" : "未加载",
      计算公式: this.getCalculationFormula()
    };
  }
  getCalculationFormula() {
    switch (this.alignmentMode) {
      case "terrain":
        return `统一对齐高度 = ${this.terrainHeight.toFixed(2)} + ${this.obliqueOffset.toFixed(2)} = ${(this.terrainHeight + this.obliqueOffset).toFixed(2)}`;
      case "model":
        return `统一对齐高度 = 模型海拔 = ${this.modelAltitude.toFixed(2)}`;
      case "smart":
        const e = this.terrainHeight + this.obliqueOffset;
        return `统一对齐高度 = max(${e.toFixed(2)}, ${this.modelAltitude.toFixed(2)}) = ${Math.max(e, this.modelAltitude).toFixed(2)}`;
      default:
        return "未知计算公式";
    }
  }
  reset() {
    this.terrainHeight = 0, this.obliqueOffset = 0, this.modelAltitude = 0, this.dualFloorHeight = 0, this.alignmentMode = "terrain", this.obliqueLoaded = !1, this.dualModelLoaded = !1, console.log("[HeightAlignmentManager] 🔄 已重置所有参数");
  }
}, rt = class {
  constructor(e, t) {
    this.cesiumViewer = e, this.mercatorProjection = t, this.Cesium = this.getCesium(), this.EARTH_RADIUS = 6378137, this.precision = {
      flightDuration: 2,
      cameraHeightOffset: 500,
      autoPositionCamera: !0
    };
  }
  getCesium() {
    return typeof window < "u" && window.Cesium ? window.Cesium : null;
  }
  ecefToCartographic(e) {
    if (!this.Cesium || !this.cesiumViewer)
      return console.error("[PrecisionModelLoader] Cesium 未初始化"), null;
    try {
      const t = new this.Cesium.Cartesian3(e.x, e.y, e.z), o = this.cesiumViewer.scene.globe.ellipsoid.cartesianToCartographic(t);
      return o ? {
        longitude: o.longitude,
        latitude: o.latitude,
        height: o.height
      } : (console.error("[PrecisionModelLoader] ECEF 到经纬度转换失败"), null);
    } catch (t) {
      return console.error("[PrecisionModelLoader] ECEF 到经纬度转换出错:", t), null;
    }
  }
  lonLatToMercator(e, t, o = 0) {
    return {
      x: e * this.EARTH_RADIUS,
      y: Math.log(Math.tan(Math.PI / 4 + t / 2)) * this.EARTH_RADIUS,
      z: o
    };
  }
  mercatorToThreeJS(e, t = null) {
    t || (t = this.mercatorProjection?.getFloorCenter() || {
      x: 0,
      y: 0,
      z: 0
    });
    const o = e.x - t.x, i = e.y - t.y, n = e.z - t.z;
    return new h.Vector3(o, n, -i);
  }
  convertECEFToThreeJS(e) {
    console.log("[PrecisionModelLoader] 🔄 开始精确坐标转换:", { ecef: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})` });
    const t = this.ecefToCartographic(e);
    if (!t) return null;
    console.log("[PrecisionModelLoader] 步骤 1: ECEF → 经纬度", {
      longitude: this.toDegrees(t.longitude).toFixed(8) + "°",
      latitude: this.toDegrees(t.latitude).toFixed(8) + "°",
      height: t.height.toFixed(2) + "m"
    });
    const o = this.lonLatToMercator(t.longitude, t.latitude, t.height);
    console.log("[PrecisionModelLoader] 步骤 2: 经纬度 → 墨卡托", {
      x: o.x.toFixed(2) + "m",
      y: o.y.toFixed(2) + "m",
      z: o.z.toFixed(2) + "m"
    });
    const i = this.mercatorToThreeJS(o);
    return console.log("[PrecisionModelLoader] 步骤 3: 墨卡托 → Three.js", { position: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})` }), {
      threeJSPosition: i,
      cartographic: t,
      mercator: o
    };
  }
  async positionCesiumCamera(e, t = null) {
    if (!this.Cesium || !this.cesiumViewer) {
      console.warn("[PrecisionModelLoader] Cesium 未初始化，跳过相机定位");
      return;
    }
    if (!this.precision.autoPositionCamera) {
      console.log("[PrecisionModelLoader] 自动定位已禁用，跳过相机定位");
      return;
    }
    const o = t !== null ? t : this.precision.cameraHeightOffset;
    console.log("[PrecisionModelLoader] 📍 定位 Cesium 相机到模型位置:", {
      longitude: this.toDegrees(e.longitude).toFixed(8) + "°",
      latitude: this.toDegrees(e.latitude).toFixed(8) + "°",
      height: (e.height + o).toFixed(2) + "m"
    });
    try {
      await this.cesiumViewer.camera.flyTo({
        destination: this.Cesium.Cartesian3.fromRadians(e.longitude, e.latitude, e.height + o),
        orientation: {
          heading: 0,
          pitch: -Math.PI / 4,
          roll: 0
        },
        duration: this.precision.flightDuration
      }), console.log("[PrecisionModelLoader] ✅ Cesium 相机定位完成");
    } catch (i) {
      console.error("[PrecisionModelLoader] Cesium 相机定位失败:", i);
    }
  }
  async loadModelPrecisely(e, t, o = {}) {
    console.log("[PrecisionModelLoader] 🚀 开始精确加载模型");
    const i = {
      ...this.precision,
      ...o
    }, n = this.convertECEFToThreeJS(t);
    return n ? (e.position.copy(n.threeJSPosition), e.updateMatrixWorld(!0), console.log("[PrecisionModelLoader] ✅ 模型位置已设置:", { position: `(${e.position.x.toFixed(2)}, ${e.position.y.toFixed(2)}, ${e.position.z.toFixed(2)})` }), i.autoPositionCamera && await this.positionCesiumCamera(n.cartographic, i.cameraHeightOffset), e.userData.precisionLoaded = !0, e.userData.ecefPosition = t.clone(), e.userData.cartographic = n.cartographic, e.userData.mercator = n.mercator, e.userData.threeJSPosition = n.threeJSPosition.clone(), this.mercatorProjection?.isUsingLocalCoordinateSystem() && this.addGroundMarker(n.cartographic), n) : (console.error("[PrecisionModelLoader] 坐标转换失败"), null);
  }
  addGroundMarker(e) {
    if (!this.Cesium || !this.cesiumViewer) {
      console.warn("[PrecisionModelLoader] Cesium 未初始化，跳过地面标记");
      return;
    }
    try {
      const t = this.Cesium.Cartesian3.fromRadians(e.longitude, e.latitude, 0), o = this.cesiumViewer.entities.add({
        id: `ground-marker-${Date.now()}`,
        position: t,
        point: {
          pixelSize: 15,
          color: this.Cesium.Color.YELLOW,
          outlineColor: this.Cesium.Color.RED,
          outlineWidth: 2,
          heightReference: this.Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: "📍 地面点",
          font: "14px sans-serif",
          fillColor: this.Cesium.Color.YELLOW,
          outlineColor: this.Cesium.Color.BLACK,
          outlineWidth: 2,
          style: this.Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: this.Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new this.Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      console.log("[PrecisionModelLoader] ✅ 局部坐标系模式：已添加地面黄色标记点", {
        经度: this.toDegrees(e.longitude).toFixed(8) + "°",
        纬度: this.toDegrees(e.latitude).toFixed(8) + "°",
        标记ID: o.id
      });
    } catch (t) {
      console.error("[PrecisionModelLoader] 添加地面标记失败:", t);
    }
  }
  async loadModelsPrecisely(e, t, o = {}) {
    if (e.length !== t.length)
      return console.error("[PrecisionModelLoader] 模型和位置数量不匹配"), null;
    console.log(`[PrecisionModelLoader] 🚀 批量精确加载 ${e.length} 个模型`);
    const i = [];
    for (let n = 0; n < e.length; n++) {
      const r = await this.loadModelPrecisely(e[n], t[n], o);
      r && i.push(r);
    }
    return i.length > 0 && o.autoPositionCamera !== !1 && await this.positionCesiumCamera(i[0].cartographic, o.cameraHeightOffset), console.log(`[PrecisionModelLoader] ✅ 批量加载完成，成功加载 ${i.length} 个模型`), i;
  }
  toDegrees(e) {
    return e * 180 / Math.PI;
  }
  toRadians(e) {
    return e * Math.PI / 180;
  }
  setPrecisionConfig(e) {
    this.precision = {
      ...this.precision,
      ...e
    };
  }
  getPrecisionConfig() {
    return { ...this.precision };
  }
}, at = class {
  static getPolarAngleLimits(e, t, o, i = !1, n = !1) {
    if (t)
      return console.log("[ControlsRestrictionManager] 真实世界模式：允许 360 度翻转"), {
        minPolarAngle: 0,
        maxPolarAngle: Math.PI
      };
    if (n)
      return console.log("[ControlsRestrictionManager] 地图模式（未切换）：允许翻转（与参考项目保持一致）"), {
        minPolarAngle: 0,
        maxPolarAngle: Math.PI
      };
    if (e)
      return console.log("[ControlsRestrictionManager] 大坐标模型（未切换）：允许翻转（与参考项目保持一致）"), {
        minPolarAngle: 0,
        maxPolarAngle: Math.PI
      };
    const r = o === 0 ? "未加载模型" : "小模型模式";
    return i ? (console.log(`[ControlsRestrictionManager] ${r}（限制模式）：限制翻转`), {
      minPolarAngle: 0,
      maxPolarAngle: Math.PI / 2 - 0.01
    }) : (console.log(`[ControlsRestrictionManager] ${r}：允许翻转`), {
      minPolarAngle: 0,
      maxPolarAngle: Math.PI
    });
  }
  static getPanEnabled(e, t, o, i = !1, n = !1) {
    return t ? !0 : !(n || e || i);
  }
  static applyRestrictions(e, t, o, i, n = {}, r = {}) {
    if (!e) return;
    let a = !1, s = !1, c = !1, l = !1;
    typeof n == "boolean" ? (a = n, c = r.update || !1, l = r.verbose || !1, s = r.isInRealWorldCoordinates || !1) : typeof n == "object" && (c = n.update || !1, l = n.verbose || !1, a = n.restrictSmallCoordMode || !1, s = n.isInRealWorldCoordinates || !1);
    const g = this.getPolarAngleLimits(t, o, i, a, s), u = this.getPanEnabled(t, o, i, a, s), d = e.minPolarAngle, m = e.maxPolarAngle, p = e.enablePan;
    if (e.minPolarAngle = g.minPolarAngle, e.maxPolarAngle = g.maxPolarAngle, e.enablePan = u, c && e.update(), l) {
      let x, f;
      o ? (x = "真实世界模式", f = "允许 360 度翻转和平移") : s ? (x = "地图模式（未切换）", f = "允许 360 度翻转（与参考项目一致）") : t ? (x = "大坐标模型（未切换）", f = "允许 360 度翻转（与参考项目一致）") : a ? (x = i === 0 ? "未加载模型（限制模式）" : "小模型模式（限制模式）", f = "限制在上半球，禁用平移") : (x = i === 0 ? "未加载模型" : "小模型模式", f = "允许 360 度翻转和平移"), (d !== g.minPolarAngle || m !== g.maxPolarAngle || p !== u) && console.log(`[ControlsRestrictionManager] 应用限制 (${x}):`, {
        minPolarAngle: `${d.toFixed(4)} → ${g.minPolarAngle.toFixed(4)}`,
        maxPolarAngle: `${m.toFixed(4)} → ${g.maxPolarAngle.toFixed(4)}`,
        enablePan: `${p} → ${u}`,
        描述: f
      });
    }
  }
  static applyRestrictionsToMultiple(e, t, o, i, n = {}) {
    Array.isArray(e) && e.forEach((r) => {
      this.applyRestrictions(r, t, o, i, n);
    });
  }
  static isLargeCoordinateMode(e) {
    return e ? e.maxPolarAngle >= Math.PI - 0.01 : !1;
  }
  static getModeDescription(e, t, o, i = !1, n = !1) {
    return t ? {
      name: "真实世界模式",
      description: "允许 360 度翻转和平移",
      polarAngle: "0 ~ π (180°)",
      pan: "启用"
    } : n ? {
      name: "地图模式（未切换）",
      description: "允许 360 度翻转（与参考项目一致）",
      polarAngle: "0 ~ π (180°)",
      pan: "启用"
    } : e ? {
      name: "大坐标模型（未切换）",
      description: "允许 360 度翻转（与参考项目一致）",
      polarAngle: "0 ~ π (180°)",
      pan: "启用"
    } : i ? {
      name: o === 0 ? "未加载模型（限制模式）" : "小模型模式（限制模式）",
      description: "限制在上半球，禁用平移",
      polarAngle: "0 ~ π/2 - 0.01 (90°)",
      pan: "禁用"
    } : {
      name: o === 0 ? "未加载模型" : "小模型模式",
      description: "允许 360 度翻转和平移",
      polarAngle: "0 ~ π (180°)",
      pan: "启用"
    };
  }
}, Je = (e, t) => {
  const o = e.__vccOpts || e;
  for (const [i, n] of t) o[i] = n;
  return o;
}, qt = {
  name: "DualCanvasControlPanel",
  props: {
    activeLayer: {
      type: String,
      default: "both",
      validator: (e) => [
        "three",
        "bim",
        "both"
      ].includes(e)
    },
    showThreeLayer: {
      type: Boolean,
      default: !0
    },
    showBimLayer: {
      type: Boolean,
      default: !0
    },
    bimOpacity: {
      type: Number,
      default: 50
    },
    cameraSyncEnabled: {
      type: Boolean,
      default: !0
    },
    transformMode: {
      type: String,
      default: "translate",
      validator: (e) => [
        "translate",
        "rotate",
        "scale"
      ].includes(e)
    },
    threeObjectCount: {
      type: Number,
      default: 0
    },
    bimObjectCount: {
      type: Number,
      default: 0
    },
    hasLargeCoordModelSelected: {
      type: Boolean,
      default: !1
    },
    loadedModelsList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return { selectedModelId: "" };
  },
  emits: [
    "setActiveLayer",
    "updateBimOpacity",
    "toggleCameraSync",
    "setTransformMode",
    "loadThreeModel",
    "loadBimModel",
    "convertLargeCoordModel",
    "exitRealWorldMode",
    "focusOnModel"
  ],
  methods: {
    handleModelChange(e) {
      const t = e.target.value;
      this.selectedModelId = t, t && this.$emit("focusOnModel", t);
    },
    getLayerDisplayName(e) {
      return e === "three" ? "原始模型" : "BIM模型";
    }
  }
}, Zt = {
  class: "control-panel",
  "data-panel": "control"
}, Jt = { class: "layer-tabs" }, Qt = ["aria-pressed"], eo = ["aria-pressed"], to = ["aria-pressed"], oo = { class: "opacity-control" }, io = { for: "opacity-slider" }, no = ["value"], ro = { class: "sync-control" }, ao = { class: "toggle-label" }, so = ["checked"], lo = { class: "transform-controls" }, co = { class: "transform-buttons" }, ho = { class: "model-controls" }, uo = { class: "control-group" }, go = { class: "control-group" }, mo = {
  key: 0,
  class: "model-location-control"
}, fo = { class: "control-group" }, Co = ["value"], xo = { class: "large-coord-controls" }, po = ["disabled"], wo = {
  key: 0,
  class: "hint-text success"
}, yo = {
  key: 1,
  class: "hint-text info"
}, Mo = { class: "info-panel" }, vo = { class: "info-item" }, Fo = { class: "info-value" }, Do = { class: "info-item" }, Vo = { class: "info-value" };
function zo(e, t, o, i, n, r) {
  return Z(), q("div", Zt, [
    t[25] || (t[25] = z("div", { class: "panel-header" }, [z("h3", null, "双画布查看器")], -1)),
    z("div", Jt, [
      z("button", {
        class: ue(["tab-button", { active: o.activeLayer === "three" }]),
        onClick: t[0] || (t[0] = (a) => e.$emit("setActiveLayer", "three")),
        "aria-pressed": o.activeLayer === "three"
      }, " 原始模型 ", 10, Qt),
      z("button", {
        class: ue(["tab-button", { active: o.activeLayer === "bim" }]),
        onClick: t[1] || (t[1] = (a) => e.$emit("setActiveLayer", "bim")),
        "aria-pressed": o.activeLayer === "bim"
      }, " BIM 模型 ", 10, eo),
      z("button", {
        class: ue(["tab-button", { active: o.activeLayer === "both" }]),
        onClick: t[2] || (t[2] = (a) => e.$emit("setActiveLayer", "both")),
        "aria-pressed": o.activeLayer === "both"
      }, " 双层显示 ", 10, to)
    ]),
    Fe(z("div", oo, [z("label", io, "BIM 图层透明度: " + I(o.bimOpacity) + "%", 1), z("input", {
      id: "opacity-slider",
      type: "range",
      min: "0",
      max: "100",
      value: o.bimOpacity,
      onInput: t[3] || (t[3] = (a) => e.$emit("updateBimOpacity", a.target.value)),
      class: "slider"
    }, null, 40, no)], 512), [[be, o.showBimLayer]]),
    z("div", ro, [z("label", ao, [z("input", {
      type: "checkbox",
      checked: o.cameraSyncEnabled,
      onChange: t[4] || (t[4] = (a) => e.$emit("toggleCameraSync", a.target.checked)),
      class: "toggle-checkbox"
    }, null, 40, so), t[14] || (t[14] = z("span", null, "相机同步", -1))])]),
    Fe(z("div", lo, [t[15] || (t[15] = z("h4", null, "变换工具", -1)), z("div", co, [
      z("button", {
        class: ue(["transform-btn", { active: o.transformMode === "translate" }]),
        onClick: t[5] || (t[5] = (a) => e.$emit("setTransformMode", "translate")),
        title: "移动 (W)"
      }, " 移动 ", 2),
      z("button", {
        class: ue(["transform-btn", { active: o.transformMode === "rotate" }]),
        onClick: t[6] || (t[6] = (a) => e.$emit("setTransformMode", "rotate")),
        title: "旋转 (E)"
      }, " 旋转 ", 2),
      z("button", {
        class: ue(["transform-btn", { active: o.transformMode === "scale" }]),
        onClick: t[7] || (t[7] = (a) => e.$emit("setTransformMode", "scale")),
        title: "缩放 (R)"
      }, " 缩放 ", 2)
    ])], 512), [[be, o.activeLayer !== "both" || !0]]),
    z("div", ho, [
      t[18] || (t[18] = z("h4", null, "加载模型", -1)),
      z("div", uo, [t[16] || (t[16] = z("label", null, "原始模型 (Three.js):", -1)), z("input", {
        type: "file",
        ref: "threeFileInput",
        onChange: t[8] || (t[8] = (a) => e.$emit("loadThreeModel", a)),
        accept: ".glb,.gltf",
        multiple: "",
        class: "file-input"
      }, null, 544)]),
      z("div", go, [t[17] || (t[17] = z("label", null, "BIM 模型 (.glb/.gltf/.xkt/.ifc):", -1)), z("input", {
        type: "file",
        ref: "bimFileInput",
        onChange: t[9] || (t[9] = (a) => e.$emit("loadBimModel", a)),
        accept: ".glb,.gltf,.xkt,.ifc",
        multiple: "",
        class: "file-input"
      }, null, 544)])
    ]),
    o.loadedModelsList.length > 0 ? (Z(), q("div", mo, [t[21] || (t[21] = z("h4", null, "定位或变换", -1)), z("div", fo, [t[20] || (t[20] = z("label", { for: "model-selector" }, "选择模型:", -1)), Fe(z("select", {
      id: "model-selector",
      "onUpdate:modelValue": t[10] || (t[10] = (a) => n.selectedModelId = a),
      onChange: t[11] || (t[11] = (...a) => r.handleModelChange && r.handleModelChange(...a)),
      class: "model-selector"
    }, [t[19] || (t[19] = z("option", { value: "" }, "-- 请选择模型 --", -1)), (Z(!0), q(Ft, null, Vt(o.loadedModelsList, (a) => (Z(), q("option", {
      key: a.id,
      value: a.id
    }, I(a.name) + " (" + I(r.getLayerDisplayName(a.layer)) + ") ", 9, Co))), 128))], 544), [[zt, n.selectedModelId]])])])) : oe("", !0),
    z("div", xo, [
      t[22] || (t[22] = z("h4", null, "大坐标模型", -1)),
      z("button", {
        class: ue([
          "action-btn",
          "convert-btn",
          { disabled: !o.hasLargeCoordModelSelected }
        ]),
        onClick: t[12] || (t[12] = (a) => e.$emit("convertLargeCoordModel")),
        disabled: !o.hasLargeCoordModelSelected,
        title: "将大坐标模型转换为真实世界坐标"
      }, " 🌍 大坐标模型→真实世界 ", 10, po),
      z("button", {
        class: ue(["action-btn", "exit-btn"]),
        onClick: t[13] || (t[13] = (a) => e.$emit("exitRealWorldMode")),
        title: "退出真实世界模式，切换回混合模式"
      }, " 🔄 退出真实世界→混合模式 "),
      o.hasLargeCoordModelSelected ? (Z(), q("div", wo, " ✓ 已选中大坐标模型 ")) : (Z(), q("div", yo, " ℹ 请先选中一个大坐标模型 "))
    ]),
    z("div", Mo, [z("div", vo, [t[23] || (t[23] = z("span", { class: "info-label" }, "原始模型对象:", -1)), z("span", Fo, I(o.threeObjectCount), 1)]), z("div", Do, [t[24] || (t[24] = z("span", { class: "info-label" }, "BIM 模型对象:", -1)), z("span", Vo, I(o.bimObjectCount), 1)])])
  ]);
}
var bo = /* @__PURE__ */ Je(qt, [["render", zo]]), So = {
  name: "CoordinateInfoPanel",
  props: {
    showDetails: {
      type: Boolean,
      default: !1
    },
    showGeoCoords: {
      type: Boolean,
      default: !1
    },
    activeLayer: {
      type: String,
      default: "both",
      validator: (e) => [
        "three",
        "bim",
        "both"
      ].includes(e)
    },
    coords: {
      type: Object,
      required: !0,
      validator: (e) => e.screen !== void 0 && e.ndc !== void 0 && e.world1 !== void 0 && e.world2 !== void 0 && e.worldXeokit !== void 0 && e.mercator1 !== void 0 && e.mercator2 !== void 0 && e.geo !== void 0 && e.viewport !== void 0 && e.enu1 !== void 0 && e.enuOrigin !== void 0
    },
    viewportStatus: {
      type: Object,
      default: () => ({
        width: 0,
        height: 0,
        left: 0,
        top: 0
      })
    },
    viewportManager: {
      type: Object,
      default: null
    },
    usingUnifiedViewport: {
      type: Boolean,
      default: !1
    },
    hasXeokitModels: {
      type: Boolean,
      default: !1
    },
    formatRealWorldCoordsFn: {
      type: Function,
      default: null
    },
    formatWorldCoordsFn: {
      type: Function,
      default: null
    },
    usingENU: {
      type: Boolean,
      default: !1
    }
  },
  emits: ["toggleDetails"],
  methods: {
    formatWorldCoords(e) {
      return !e || e.x === null || e.y === null || e.z === null ? "N/A" : this.formatWorldCoordsFn && typeof this.formatWorldCoordsFn == "function" ? this.formatWorldCoordsFn(e) : `(${e.x.toFixed(1)}, ${e.y.toFixed(1)}, ${e.z.toFixed(1)})`;
    },
    formatMercatorCoords(e) {
      return !e || e.x === null || e.y === null || e.z === null ? "N/A" : `(${e.x.toFixed(1)}, ${e.y.toFixed(1)}, ${e.z.toFixed(1)}) m`;
    },
    formatRealWorldCoords(e, t = null) {
      return e ? this.formatRealWorldCoordsFn && typeof this.formatRealWorldCoordsFn == "function" ? this.formatRealWorldCoordsFn(e, t) : this.formatWorldCoords(e) : "N/A";
    },
    formatENUCoords(e) {
      return e ? `(${e.east !== null ? e.east.toFixed(1) : "N/A"}, ${e.north !== null ? e.north.toFixed(1) : "N/A"}, ${e.up !== null ? e.up.toFixed(1) : "N/A"}) m` : "N/A";
    },
    formatENUOrigin(e) {
      return !e || e.longitude === null || e.latitude === null ? "N/A" : `(${e.longitude.toFixed(4)}°, ${e.latitude.toFixed(4)}°)`;
    }
  }
}, To = {
  class: "coordinate-panel",
  "data-panel": "coordinate"
}, _o = { class: "coordinate-header" }, Eo = ["aria-expanded"], Po = { class: "coordinate-summary" }, Lo = { class: "coord-item" }, $o = { class: "coord-value" }, Ao = { class: "coord-item" }, Ro = { class: "coord-value" }, ko = {
  key: 0,
  class: "coord-item"
}, No = { class: "coord-value" }, Io = {
  key: 1,
  class: "coord-item"
}, Uo = { class: "coord-value" }, Ho = {
  key: 2,
  class: "coord-item"
}, Oo = { class: "coord-value" }, Bo = {
  key: 3,
  class: "coord-item"
}, Go = { class: "coord-value" }, jo = {
  key: 4,
  class: "coord-item"
}, Xo = { class: "coord-value" }, Wo = {
  key: 5,
  class: "coord-item"
}, Yo = { class: "coord-value" }, Ko = {
  key: 6,
  class: "coord-item"
}, qo = { class: "coord-value" }, Zo = {
  key: 7,
  class: "coord-item"
}, Jo = { class: "coord-value" }, Qo = {
  key: 8,
  class: "coord-item"
}, ei = { class: "coord-value" }, ti = {
  key: 9,
  class: "coord-item"
}, oi = { class: "coord-value" }, ii = {
  key: 10,
  class: "coord-item",
  title: "ENU坐标系原点"
}, ni = { class: "coord-value" }, ri = { class: "coordinate-details" }, ai = { class: "coord-section" }, si = { class: "coord-row" }, li = { class: "coord-value" }, ci = { class: "coord-row" }, di = { class: "coord-value" }, hi = { class: "coord-section" }, ui = { class: "coord-row" }, gi = { class: "coord-value" }, mi = { class: "coord-row" }, fi = { class: "coord-value" }, Ci = {
  key: 0,
  class: "coord-section"
}, xi = { class: "coord-row" }, pi = { class: "coord-value" }, wi = { class: "coord-row" }, yi = { class: "coord-value" }, Mi = { class: "coord-section" }, vi = { class: "coord-row" }, Fi = { class: "coord-value" }, Di = { class: "coord-row" }, Vi = { class: "coord-value" }, zi = {
  key: 1,
  class: "coord-section"
}, bi = { class: "coord-row" }, Si = { class: "coord-value" }, Ti = { class: "coord-row" }, _i = { class: "coord-value" }, Ei = { class: "coord-row" }, Pi = { class: "coord-value" }, Li = {
  key: 2,
  class: "coord-section"
}, $i = { class: "coord-row" }, Ai = { class: "coord-value" }, Ri = { class: "coord-row" }, ki = { class: "coord-value" }, Ni = { class: "coord-row" }, Ii = { class: "coord-value" }, Ui = {
  key: 3,
  class: "coord-section"
}, Hi = { class: "coord-row" }, Oi = { class: "coord-value" }, Bi = { class: "coord-row" }, Gi = { class: "coord-value" }, ji = { class: "coord-row" }, Xi = { class: "coord-value" }, Wi = {
  key: 4,
  class: "coord-section"
}, Yi = { class: "coord-row" }, Ki = { class: "coord-value" }, qi = { class: "coord-row" }, Zi = { class: "coord-value" }, Ji = { class: "coord-row" }, Qi = { class: "coord-value" }, en = {
  key: 5,
  class: "coord-section"
}, tn = { class: "coord-row" }, on = { class: "coord-value" }, nn = { class: "coord-row" }, rn = { class: "coord-value" }, an = { class: "coord-row" }, sn = { class: "coord-value" }, ln = {
  key: 6,
  class: "coord-section"
}, cn = { class: "coord-row" }, dn = { class: "coord-value" }, hn = { class: "coord-row" }, un = { class: "coord-value" }, gn = { class: "coord-row" }, mn = { class: "coord-value" }, fn = {
  key: 7,
  class: "coord-section"
}, Cn = { class: "coord-row" }, xn = { class: "coord-value" }, pn = { class: "coord-row" }, wn = { class: "coord-value" }, yn = { class: "coord-row" }, Mn = { class: "coord-value" }, vn = {
  key: 8,
  class: "coord-section"
}, Fn = { class: "coord-row" }, Dn = { class: "coord-value" }, Vn = { class: "coord-row" }, zn = { class: "coord-value" }, bn = { class: "coord-row" }, Sn = { class: "coord-value" }, Tn = { class: "coord-system-status" }, _n = ["title"];
function En(e, t, o, i, n, r) {
  return Z(), q("div", To, [
    z("div", _o, [t[1] || (t[1] = z("h3", null, "双层坐标信息", -1)), z("button", {
      onClick: t[0] || (t[0] = (a) => e.$emit("toggleDetails")),
      class: ue(["toggle-btn", { expanded: o.showDetails }]),
      "aria-expanded": o.showDetails,
      "aria-label": "切换坐标详情",
      title: "展开/折叠详细信息"
    }, I(o.showDetails ? "▼" : "▶"), 11, Eo)]),
    Fe(z("div", Po, [
      z("div", Lo, [t[2] || (t[2] = z("span", { class: "coord-label" }, "屏幕", -1)), z("span", $o, I(o.coords.screen.x.toFixed(0)) + ", " + I(o.coords.screen.y.toFixed(0)), 1)]),
      z("div", Ao, [t[3] || (t[3] = z("span", { class: "coord-label" }, "NDC", -1)), z("span", Ro, I(o.coords.ndc.x.toFixed(2)) + ", " + I(o.coords.ndc.y.toFixed(2)), 1)]),
      o.activeLayer === "three" || o.activeLayer === "both" ? (Z(), q("div", ko, [t[4] || (t[4] = z("span", { class: "coord-label" }, "世界(层1)", -1)), z("span", No, I(r.formatWorldCoords(o.coords.world1)), 1)])) : oe("", !0),
      o.activeLayer === "three" ? (Z(), q("div", Io, [t[5] || (t[5] = z("span", {
        class: "coord-label",
        title: "相对于真实世界原点的坐标（米）"
      }, "真实世界", -1)), z("span", Uo, I(r.formatRealWorldCoords(o.coords.world1, "layer1")), 1)])) : oe("", !0),
      o.activeLayer === "bim" || o.activeLayer === "both" ? (Z(), q("div", Ho, [t[6] || (t[6] = z("span", { class: "coord-label" }, "世界(层2)", -1)), z("span", Oo, I(r.formatWorldCoords(o.coords.world2)), 1)])) : oe("", !0),
      o.activeLayer === "bim" ? (Z(), q("div", Bo, [t[7] || (t[7] = z("span", {
        class: "coord-label",
        title: "相对于真实世界原点的坐标（米）"
      }, "真实世界", -1)), z("span", Go, I(r.formatRealWorldCoords(o.coords.world2, "layer2")), 1)])) : oe("", !0),
      o.activeLayer === "both" ? (Z(), q("div", jo, [t[8] || (t[8] = z("span", {
        class: "coord-label",
        title: "相对于真实世界原点的坐标（米）"
      }, "真实世界(层1)", -1)), z("span", Xo, I(r.formatRealWorldCoords(o.coords.world1, "layer1")), 1)])) : oe("", !0),
      o.activeLayer === "both" ? (Z(), q("div", Wo, [t[9] || (t[9] = z("span", {
        class: "coord-label",
        title: "相对于真实世界原点的坐标（米）"
      }, "真实世界(层2)", -1)), z("span", Yo, I(r.formatRealWorldCoords(o.coords.world2, "layer2")), 1)])) : oe("", !0),
      o.hasXeokitModels ? (Z(), q("div", Ko, [t[10] || (t[10] = z("span", { class: "coord-label" }, "世界(XKT)", -1)), z("span", qo, I(r.formatWorldCoords(o.coords.worldXeokit)), 1)])) : oe("", !0),
      o.activeLayer === "three" || o.activeLayer === "both" ? (Z(), q("div", Zo, [t[11] || (t[11] = z("span", {
        class: "coord-label",
        title: "墨卡托投影坐标（米）"
      }, "墨卡托(层1)", -1)), z("span", Jo, I(r.formatMercatorCoords(o.coords.mercator1)), 1)])) : oe("", !0),
      o.activeLayer === "bim" || o.activeLayer === "both" ? (Z(), q("div", Qo, [t[12] || (t[12] = z("span", {
        class: "coord-label",
        title: "墨卡托投影坐标（米）"
      }, "墨卡托(层2)", -1)), z("span", ei, I(r.formatMercatorCoords(o.coords.mercator2)), 1)])) : oe("", !0),
      o.usingENU && (o.activeLayer === "three" || o.activeLayer === "both") ? (Z(), q("div", ti, [t[13] || (t[13] = z("span", {
        class: "coord-label",
        title: "ENU坐标（东、北、天，米）",
        style: { color: "#667eea" }
      }, "ENU(层1)", -1)), z("span", oi, I(r.formatENUCoords(o.coords.enu1)), 1)])) : oe("", !0),
      o.usingENU ? (Z(), q("div", ii, [t[14] || (t[14] = z("span", {
        class: "coord-label",
        style: { color: "#667eea" }
      }, "ENU原点", -1)), z("span", ni, I(r.formatENUOrigin(o.coords.enuOrigin)), 1)])) : oe("", !0)
    ], 512), [[be, !o.showDetails]]),
    Fe(z("div", ri, [
      z("div", ai, [
        t[17] || (t[17] = z("h5", null, "屏幕中心", -1)),
        z("div", si, [t[15] || (t[15] = z("span", { class: "coord-label" }, "X", -1)), z("span", li, I(o.coords.screenCenter.x.toFixed(0)) + " px", 1)]),
        z("div", ci, [t[16] || (t[16] = z("span", { class: "coord-label" }, "Y", -1)), z("span", di, I(o.coords.screenCenter.y.toFixed(0)) + " px", 1)])
      ]),
      z("div", hi, [
        t[20] || (t[20] = z("h5", null, "屏幕坐标", -1)),
        z("div", ui, [t[18] || (t[18] = z("span", { class: "coord-label" }, "X", -1)), z("span", gi, I(o.coords.screen.x.toFixed(2)) + " px", 1)]),
        z("div", mi, [t[19] || (t[19] = z("span", { class: "coord-label" }, "Y", -1)), z("span", fi, I(o.coords.screen.y.toFixed(2)) + " px", 1)])
      ]),
      o.viewportManager ? (Z(), q("div", Ci, [
        t[23] || (t[23] = z("h5", null, "虚拟视口", -1)),
        z("div", xi, [t[21] || (t[21] = z("span", { class: "coord-label" }, "尺寸", -1)), z("span", pi, I(o.viewportStatus.width) + " × " + I(o.viewportStatus.height), 1)]),
        z("div", wi, [t[22] || (t[22] = z("span", { class: "coord-label" }, "相对", -1)), z("span", yi, I(o.coords.viewport.x.toFixed(2)) + ", " + I(o.coords.viewport.y.toFixed(2)), 1)])
      ])) : oe("", !0),
      z("div", Mi, [
        t[26] || (t[26] = z("h5", null, "NDC 坐标", -1)),
        z("div", vi, [t[24] || (t[24] = z("span", { class: "coord-label" }, "X", -1)), z("span", Fi, I(o.coords.ndc.x.toFixed(3)), 1)]),
        z("div", Di, [t[25] || (t[25] = z("span", { class: "coord-label" }, "Y", -1)), z("span", Vi, I(o.coords.ndc.y.toFixed(3)), 1)])
      ]),
      o.activeLayer === "three" || o.activeLayer === "both" ? (Z(), q("div", zi, [
        t[30] || (t[30] = z("h5", null, "世界坐标 (层1)", -1)),
        z("div", bi, [t[27] || (t[27] = z("span", { class: "coord-label" }, "X", -1)), z("span", Si, I(o.coords.world1.x !== null ? o.coords.world1.x.toFixed(3) : "N/A"), 1)]),
        z("div", Ti, [t[28] || (t[28] = z("span", { class: "coord-label" }, "Y", -1)), z("span", _i, I(o.coords.world1.y !== null ? o.coords.world1.y.toFixed(3) : "N/A"), 1)]),
        z("div", Ei, [t[29] || (t[29] = z("span", { class: "coord-label" }, "Z", -1)), z("span", Pi, I(o.coords.world1.z !== null ? o.coords.world1.z.toFixed(3) : "N/A"), 1)])
      ])) : oe("", !0),
      o.activeLayer === "bim" || o.activeLayer === "both" ? (Z(), q("div", Li, [
        t[34] || (t[34] = z("h5", null, "世界坐标 (层2)", -1)),
        z("div", $i, [t[31] || (t[31] = z("span", { class: "coord-label" }, "X", -1)), z("span", Ai, I(o.coords.world2.x !== null ? o.coords.world2.x.toFixed(3) : "N/A"), 1)]),
        z("div", Ri, [t[32] || (t[32] = z("span", { class: "coord-label" }, "Y", -1)), z("span", ki, I(o.coords.world2.y !== null ? o.coords.world2.y.toFixed(3) : "N/A"), 1)]),
        z("div", Ni, [t[33] || (t[33] = z("span", { class: "coord-label" }, "Z", -1)), z("span", Ii, I(o.coords.world2.z !== null ? o.coords.world2.z.toFixed(3) : "N/A"), 1)])
      ])) : oe("", !0),
      o.hasXeokitModels ? (Z(), q("div", Ui, [
        t[38] || (t[38] = z("h5", null, "世界坐标 (XKT)", -1)),
        z("div", Hi, [t[35] || (t[35] = z("span", { class: "coord-label" }, "X", -1)), z("span", Oi, I(o.coords.worldXeokit.x !== null ? o.coords.worldXeokit.x.toFixed(3) : "N/A"), 1)]),
        z("div", Bi, [t[36] || (t[36] = z("span", { class: "coord-label" }, "Y", -1)), z("span", Gi, I(o.coords.worldXeokit.y !== null ? o.coords.worldXeokit.y.toFixed(3) : "N/A"), 1)]),
        z("div", ji, [t[37] || (t[37] = z("span", { class: "coord-label" }, "Z", -1)), z("span", Xi, I(o.coords.worldXeokit.z !== null ? o.coords.worldXeokit.z.toFixed(3) : "N/A"), 1)])
      ])) : oe("", !0),
      o.activeLayer === "three" || o.activeLayer === "both" ? (Z(), q("div", Wi, [
        t[42] || (t[42] = z("h5", null, "墨卡托坐标 (层1)", -1)),
        z("div", Yi, [t[39] || (t[39] = z("span", { class: "coord-label" }, "X", -1)), z("span", Ki, I(o.coords.mercator1.x !== null ? o.coords.mercator1.x.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", qi, [t[40] || (t[40] = z("span", { class: "coord-label" }, "Y", -1)), z("span", Zi, I(o.coords.mercator1.y !== null ? o.coords.mercator1.y.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", Ji, [t[41] || (t[41] = z("span", { class: "coord-label" }, "Z", -1)), z("span", Qi, I(o.coords.mercator1.z !== null ? o.coords.mercator1.z.toFixed(2) + " m" : "N/A"), 1)])
      ])) : oe("", !0),
      o.activeLayer === "bim" || o.activeLayer === "both" ? (Z(), q("div", en, [
        t[46] || (t[46] = z("h5", null, "墨卡托坐标 (层2)", -1)),
        z("div", tn, [t[43] || (t[43] = z("span", { class: "coord-label" }, "X", -1)), z("span", on, I(o.coords.mercator2.x !== null ? o.coords.mercator2.x.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", nn, [t[44] || (t[44] = z("span", { class: "coord-label" }, "Y", -1)), z("span", rn, I(o.coords.mercator2.y !== null ? o.coords.mercator2.y.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", an, [t[45] || (t[45] = z("span", { class: "coord-label" }, "Z", -1)), z("span", sn, I(o.coords.mercator2.z !== null ? o.coords.mercator2.z.toFixed(2) + " m" : "N/A"), 1)])
      ])) : oe("", !0),
      o.usingENU && (o.activeLayer === "three" || o.activeLayer === "both") ? (Z(), q("div", ln, [
        t[50] || (t[50] = z("h5", { style: { color: "#667eea" } }, "ENU 坐标 (层1)", -1)),
        z("div", cn, [t[47] || (t[47] = z("span", { class: "coord-label" }, "E (东)", -1)), z("span", dn, I(o.coords.enu1.east !== null ? o.coords.enu1.east.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", hn, [t[48] || (t[48] = z("span", { class: "coord-label" }, "N (北)", -1)), z("span", un, I(o.coords.enu1.north !== null ? o.coords.enu1.north.toFixed(2) + " m" : "N/A"), 1)]),
        z("div", gn, [t[49] || (t[49] = z("span", { class: "coord-label" }, "U (天)", -1)), z("span", mn, I(o.coords.enu1.up !== null ? o.coords.enu1.up.toFixed(2) + " m" : "N/A"), 1)])
      ])) : oe("", !0),
      o.usingENU && o.coords.enuOrigin ? (Z(), q("div", fn, [
        t[54] || (t[54] = z("h5", { style: { color: "#667eea" } }, "ENU 原点", -1)),
        z("div", Cn, [t[51] || (t[51] = z("span", { class: "coord-label" }, "经度", -1)), z("span", xn, I(o.coords.enuOrigin.longitude !== null ? o.coords.enuOrigin.longitude.toFixed(6) + "°" : "N/A"), 1)]),
        z("div", pn, [t[52] || (t[52] = z("span", { class: "coord-label" }, "纬度", -1)), z("span", wn, I(o.coords.enuOrigin.latitude !== null ? o.coords.enuOrigin.latitude.toFixed(6) + "°" : "N/A"), 1)]),
        z("div", yn, [t[53] || (t[53] = z("span", { class: "coord-label" }, "高度", -1)), z("span", Mn, I(o.coords.enuOrigin.height !== null ? o.coords.enuOrigin.height.toFixed(2) + " m" : "N/A"), 1)])
      ])) : oe("", !0),
      o.showGeoCoords ? (Z(), q("div", vn, [
        t[58] || (t[58] = z("h5", null, "地理坐标", -1)),
        z("div", Fn, [t[55] || (t[55] = z("span", { class: "coord-label" }, "经度", -1)), z("span", Dn, I(o.coords.geo.longitude !== null ? o.coords.geo.longitude.toFixed(6) + "°" : "N/A"), 1)]),
        z("div", Vn, [t[56] || (t[56] = z("span", { class: "coord-label" }, "纬度", -1)), z("span", zn, I(o.coords.geo.latitude !== null ? o.coords.geo.latitude.toFixed(6) + "°" : "N/A"), 1)]),
        z("div", bn, [t[57] || (t[57] = z("span", { class: "coord-label" }, "高程", -1)), z("span", Sn, I(o.coords.geo.altitude !== null ? o.coords.geo.altitude.toFixed(2) + " m" : "N/A"), 1)])
      ])) : oe("", !0)
    ], 512), [[be, o.showDetails]]),
    z("div", Tn, [z("span", {
      class: ue(["status-indicator", { active: o.usingUnifiedViewport }]),
      title: o.usingUnifiedViewport ? "使用统一视口坐标系统" : "使用传统坐标系统"
    }, I(o.usingUnifiedViewport ? "✓ 统一" : "⚠ 传统"), 11, _n)])
  ]);
}
var Pn = /* @__PURE__ */ Je(So, [["render", En]]), Ie = -50, Ln = class {
  constructor() {
    this.Cesium = null, this.cesiumViewer = null, this.floorCenterMercator = null, this.floorCenterCartographic = null, this.initialENUState = {
      east: new h.Vector3(1, 0, 0),
      north: new h.Vector3(0, 0, -1),
      up: new h.Vector3(0, 1, 0)
    }, this.currentRotation = {
      quaternion: new h.Quaternion(0, 0, 0, 1),
      pitch: 0,
      roll: 0,
      mode: "surface",
      isOnBackSide: !1
    }, this.targetRotation = {
      quaternion: new h.Quaternion(0, 0, 0, 1),
      mode: "surface"
    }, this.lastPosition = {
      x: 0,
      y: 0,
      z: 0
    }, this.smoothingFactor = 0.15, this.enableSmoothing = !0, this._initialFloorCenterNormal = null, this.sceneContainer = null, this._modeTransitionProtection = {
      enabled: !0,
      until: 0,
      lastMode: "surface"
    }, console.log("[SceneRotationManager] 已创建（支持地上地下模式）");
  }
  setCesium(e, t) {
    this.Cesium = e, this.cesiumViewer = t, console.log("[SceneRotationManager] Cesium 已设置");
  }
  getCesium() {
    return this.Cesium ? this.Cesium : typeof window < "u" && window.Cesium ? window.Cesium : null;
  }
  setSceneContainer(e) {
    if (!e) {
      console.warn("[SceneRotationManager] 场景容器为空");
      return;
    }
    this.sceneContainer = e, console.log("[SceneRotationManager] 场景容器已设置:", e.name || "unnamed");
  }
  initialize(e, t, o = null) {
    if (!this.getCesium()) {
      console.warn("[SceneRotationManager] ⚠️ Cesium 未准备好，跳过旋转系统初始化");
      return;
    }
    this.floorCenterMercator = e, this.floorCenterCartographic = t, o && (this.initialENUState = {
      east: new h.Vector3().copy(o.east),
      north: new h.Vector3().copy(o.north),
      up: new h.Vector3().copy(o.up)
    }), this._initializeBackSideDetection(t);
    const i = this._detectModeFromCartographic(t);
    this.currentRotation.mode = i, this.targetRotation.mode = i, this._modeTransitionProtection.lastMode = i, console.log("[SceneRotationManager] 旋转系统已初始化:", {
      floorCenterMercator: e,
      floorCenterCartographic: {
        longitude: (t.longitude * 180 / Math.PI).toFixed(6) + "°",
        latitude: (t.latitude * 180 / Math.PI).toFixed(6) + "°",
        height: t.height.toFixed(2) + "m"
      },
      initialMode: i
    });
  }
  _detectModeFromCartographic(e) {
    return e && e.height < Ie ? "underground" : "surface";
  }
  detectModeFromPosition(e) {
    return !e || typeof e.y != "number" ? this.currentRotation.mode : e.y < Ie ? "underground" : "surface";
  }
  enableModeTransitionProtection(e = 1e3) {
    this._modeTransitionProtection.enabled = !0, this._modeTransitionProtection.until = Date.now() + e, console.log("[SceneRotationManager] 模式切换保护已启用，时长:", e, "ms");
  }
  disableModeTransitionProtection() {
    this._modeTransitionProtection.enabled = !1, this._modeTransitionProtection.until = 0, console.log("[SceneRotationManager] 模式切换保护已禁用");
  }
  _isInProtectionPeriod() {
    return this._modeTransitionProtection.enabled && Date.now() < this._modeTransitionProtection.until;
  }
  calculateLocalCoordinateSystem(e, t) {
    const o = this.getCesium();
    if (!o || !e || !t)
      return console.warn("[SceneRotationManager] calculateLocalCoordinateSystem: 缺少必要参数"), null;
    try {
      t.cartographicToCartesian(e);
      const i = e.longitude, n = e.latitude, r = Math.cos(i), a = Math.sin(i), s = Math.cos(n), c = Math.sin(n), l = new o.Cartesian3(-a, r, 0), g = new o.Cartesian3(s * r, s * a, c), u = new o.Cartesian3();
      o.Cartesian3.cross(g, l, u);
      const d = {
        east: new h.Vector3(l.x, l.z, -l.y),
        north: new h.Vector3(u.x, u.z, -u.y),
        up: new h.Vector3(g.x, g.z, -g.y)
      };
      return d.east.normalize(), d.north.normalize(), d.up.normalize(), d;
    } catch (i) {
      return console.error("[SceneRotationManager] calculateLocalCoordinateSystem 失败:", i), null;
    }
  }
  calculateRotationQuaternion(e) {
    if (!e) return new h.Quaternion(0, 0, 0, 1);
    const t = new h.Matrix4(), o = e.east.clone(), i = e.up.clone(), n = e.north.clone().negate();
    t.makeBasis(o, i, n);
    const r = new h.Quaternion();
    return r.setFromRotationMatrix(t), r;
  }
  _initializeBackSideDetection(e) {
    const t = this.getCesium();
    if (!(!t || !e))
      try {
        const o = t.Ellipsoid.WGS84.cartographicToCartesian(e);
        o && (this._initialFloorCenterNormal = t.Cartesian3.normalize(o, new t.Cartesian3()));
      } catch (o) {
        console.warn("[SceneRotationManager] 背面检测初始化失败:", o);
      }
  }
  detectBackSide(e) {
    const t = this.getCesium();
    if (!t || !e || !this._initialFloorCenterNormal) return !1;
    try {
      const o = t.Cartesian3.normalize(e.position, new t.Cartesian3()), i = t.Cartesian3.dot(o, this._initialFloorCenterNormal) < 0;
      return this.currentRotation.isOnBackSide = i, i;
    } catch {
      return !1;
    }
  }
  calculateEarthCenterRotation(e, t, o) {
    const i = this.getCesium();
    if (!i || !e || !t)
      return console.warn("[SceneRotationManager] calculateEarthCenterRotation: 缺少必要参数"), null;
    try {
      const n = this._getENUOriginECEF();
      if (!n)
        return console.warn("[SceneRotationManager] calculateEarthCenterRotation: ENU原点ECEF不可用"), null;
      const r = t.cartographicToCartesian(e);
      if (!r)
        return console.warn("[SceneRotationManager] calculateEarthCenterRotation: 目标点ECEF转换失败"), null;
      const a = i.Cartesian3.normalize(n, new i.Cartesian3()), s = i.Cartesian3.normalize(r, new i.Cartesian3()), c = i.Cartesian3.cross(a, s, new i.Cartesian3());
      if (i.Cartesian3.magnitude(c) < 1e-4) {
        if (i.Cartesian3.dot(a, s) > 0)
          return console.log("[SceneRotationManager] calculateEarthCenterRotation: 法向量同向，无需旋转"), new h.Quaternion(0, 0, 0, 1);
        {
          console.log("[SceneRotationManager] calculateEarthCenterRotation: 法向量反向，旋转180度");
          const m = new i.Cartesian3(1, 0, 0), p = i.Cartesian3.cross(a, m, new i.Cartesian3()), x = i.Cartesian3.normalize(p, new i.Cartesian3()), f = this._ecefVectorToENU(x), C = new h.Quaternion();
          return C.setFromAxisAngle(new h.Vector3(f.x, f.y, f.z), Math.PI), C;
        }
      }
      i.Cartesian3.normalize(c, c);
      const l = i.Cartesian3.dot(a, s), g = Math.acos(Math.max(-1, Math.min(1, l))), u = this._ecefVectorToENU(c), d = new h.Quaternion();
      return d.setFromAxisAngle(new h.Vector3(u.x, u.y, u.z), g), console.log("[SceneRotationManager] calculateEarthCenterRotation: 旋转计算完成", {
        旋转角度: (g * 180 / Math.PI).toFixed(2) + "°",
        旋转轴ENU: `(${u.x.toFixed(4)}, ${u.y.toFixed(4)}, ${u.z.toFixed(4)})`
      }), d;
    } catch (n) {
      return console.error("[SceneRotationManager] calculateEarthCenterRotation 失败:", n), null;
    }
  }
  _getENUOriginECEF() {
    const e = this.getCesium();
    if (!e || !this.floorCenterCartographic) return null;
    try {
      return (this.cesiumViewer?.scene?.globe?.ellipsoid || e.Ellipsoid.WGS84).cartographicToCartesian(this.floorCenterCartographic);
    } catch (t) {
      return console.error("[SceneRotationManager] _getENUOriginECEF 失败:", t), null;
    }
  }
  _ecefVectorToENU(e) {
    const t = this.getCesium();
    if (!t || !this.floorCenterCartographic)
      return console.warn("[SceneRotationManager] _ecefVectorToENU: 缺少必要参数"), new h.Vector3(0, 0, 0);
    try {
      const o = this.floorCenterCartographic.longitude, i = this.floorCenterCartographic.latitude, n = Math.cos(o), r = Math.sin(o), a = Math.cos(i), s = Math.sin(i), c = new t.Cartesian3(-r, n, 0), l = new t.Cartesian3(a * n, a * r, s), g = new t.Cartesian3();
      t.Cartesian3.cross(l, c, g);
      const u = t.Cartesian3.dot(e, c), d = t.Cartesian3.dot(e, g), m = t.Cartesian3.dot(e, l);
      return new h.Vector3(u, m, -d);
    } catch (o) {
      return console.error("[SceneRotationManager] _ecefVectorToENU 失败:", o), new h.Vector3(0, 0, 0);
    }
  }
  updateSceneRotation(e, t = !1) {
    const o = this.getCesium();
    if (!(!o || !this.cesiumViewer || !this.sceneContainer))
      try {
        const i = this.cesiumViewer.scene.globe.ellipsoid;
        let n;
        try {
          const s = new o.Ray(e.position, e.direction), c = o.IntersectionTests.rayEllipsoid(s, i);
          if (o.defined(c)) n = i.cartesianToCartographic(c);
          else {
            const l = i.cartesianToCartographic(e.position);
            n = o.Cartographic.fromRadians(l.longitude, l.latitude, 0);
          }
        } catch {
          const c = i.cartesianToCartographic(e.position);
          n = o.Cartographic.fromRadians(c.longitude, c.latitude, 0);
        }
        this.detectBackSide(e);
        const r = this._detectModeFromCartographic(n);
        this._isInProtectionPeriod() ? this.targetRotation.mode = this._modeTransitionProtection.lastMode : (this.targetRotation.mode !== r && (console.log("[SceneRotationManager] 模式切换:", this.targetRotation.mode, "→", r), this._modeTransitionProtection.lastMode = r), this.targetRotation.mode = r);
        const a = this._calculateModeAwareRotation(n, i, e);
        if (!a) return;
        this.enableSmoothing && !t ? this.currentRotation.quaternion.slerp(a, this.smoothingFactor) : this.currentRotation.quaternion.copy(a), this.currentRotation.mode = this.targetRotation.mode, this.sceneContainer.quaternion.copy(this.currentRotation.quaternion), this.sceneContainer.updateMatrixWorld(!0), this._updateEulerAngles();
      } catch (i) {
        console.error("[SceneRotationManager] updateSceneRotation 失败:", i);
      }
  }
  _calculateModeAwareRotation(e, t, o) {
    const i = this.calculateLocalCoordinateSystem(e, t);
    if (!i) return null;
    let n = this.calculateRotationQuaternion(i);
    const r = t.cartesianToCartographic(o.position).height;
    return this.targetRotation.mode === "surface" ? this._adjustForSurfaceMode(n, r) : this._adjustForUndergroundMode(n, r);
  }
  _adjustForSurfaceMode(e, t) {
    if (t < 70) {
      console.warn("[SceneRotationManager] 地上模式：相机高度过低，限制旋转");
      const o = new h.Euler().setFromQuaternion(e, "YXZ"), i = -Math.PI / 2 + 0.1;
      o.x < i && (o.x = i, e.setFromEuler(o));
    }
    return e;
  }
  _adjustForUndergroundMode(e, t) {
    if (t > Ie - 100) {
      console.warn("[SceneRotationManager] 地下模式：相机高度过高，限制旋转");
      const o = new h.Euler().setFromQuaternion(e, "YXZ"), i = Math.PI / 2 - 0.1;
      o.x > i && (o.x = i, e.setFromEuler(o));
    }
    return e;
  }
  _updateEulerAngles() {
    const e = new h.Euler().setFromQuaternion(this.currentRotation.quaternion, "YXZ");
    this.currentRotation.pitch = e.x, this.currentRotation.roll = e.z;
  }
  setSmoothingFactor(e) {
    this.smoothingFactor = Math.max(0.01, Math.min(1, e));
  }
  setSmoothingEnabled(e) {
    this.enableSmoothing = e;
  }
  getRotationState() {
    return {
      quaternion: {
        x: this.currentRotation.quaternion.x,
        y: this.currentRotation.quaternion.y,
        z: this.currentRotation.quaternion.z,
        w: this.currentRotation.quaternion.w
      },
      pitch: this.currentRotation.pitch,
      roll: this.currentRotation.roll,
      mode: this.currentRotation.mode,
      isOnBackSide: this.currentRotation.isOnBackSide,
      hasSceneContainer: !!this.sceneContainer,
      isInitialized: !!this.floorCenterMercator,
      isInProtectionPeriod: this._isInProtectionPeriod()
    };
  }
  reset() {
    this.currentRotation = {
      quaternion: new h.Quaternion(0, 0, 0, 1),
      pitch: 0,
      roll: 0,
      mode: "surface",
      isOnBackSide: !1
    }, this.targetRotation = {
      quaternion: new h.Quaternion(0, 0, 0, 1),
      mode: "surface"
    }, this.sceneContainer && (this.sceneContainer.quaternion.set(0, 0, 0, 1), this.sceneContainer.updateMatrixWorld(!0)), this._modeTransitionProtection = {
      enabled: !0,
      until: 0,
      lastMode: "surface"
    }, console.log("[SceneRotationManager] 旋转系统已重置");
  }
}, ae = new Ln(), $n = class {
  constructor() {
    this.initialized = !1, this.sceneContainers = {
      layer1: null,
      layer2: null
    }, this.lastUpdateTime = 0, this.updateThrottle = 16, this.modeState = {
      currentMode: "surface",
      lastMode: "surface",
      modeChangeCount: 0,
      protectionEnabled: !0
    }, console.log("[SceneRotationIntegration] 已创建");
  }
  initialize(e) {
    const { floorCenterMercator: t, floorCenterCartographic: o, layer1Container: i, layer2Container: n, Cesium: r, cesiumViewer: a } = e;
    if (ae.setCesium(r, a), i && (this.sceneContainers.layer1 = i, ae.setSceneContainer(i)), n && (this.sceneContainers.layer2 = n), !r || !a)
      return console.warn("[SceneRotationIntegration] ⚠️ Cesium 未准备好，跳过场景旋转初始化"), !1;
    ae.initialize(t, o, null);
    const s = this._detectModeFromCartographic(o);
    return this.modeState.currentMode = s, this.modeState.lastMode = s, this.initialized = !0, console.log("[SceneRotationIntegration] 初始化完成:", {
      hasLayer1Container: !!this.sceneContainers.layer1,
      hasLayer2Container: !!this.sceneContainers.layer2,
      initialMode: s
    }), !0;
  }
  _detectModeFromCartographic(e) {
    return e && e.height < -50 ? "underground" : "surface";
  }
  detectModeFromCamera(e, t) {
    if (!e || !t) return this.modeState.currentMode;
    try {
      const o = t.cartesianToCartographic(e.position), i = this._detectModeFromCartographic(o);
      return i !== this.modeState.currentMode && (this.modeState.modeChangeCount++, this.modeState.lastMode = this.modeState.currentMode, this.modeState.currentMode = i, console.log("[SceneRotationIntegration] 模式切换:", {
        from: this.modeState.lastMode,
        to: i,
        changeCount: this.modeState.modeChangeCount,
        cameraHeight: o.height.toFixed(2) + "m"
      }), this.modeState.protectionEnabled && ae.enableModeTransitionProtection(1e3)), i;
    } catch (o) {
      return console.error("[SceneRotationIntegration] 检测模式失败:", o), this.modeState.currentMode;
    }
  }
  _isUsingLocalCoordinateMode() {
    try {
      if (typeof window < "u" && window.__syncManager__) {
        const e = window.__syncManager__;
        if (e && e.mercatorProjection) return e.mercatorProjection.isUsingLocalCoordinateSystem?.() === !0;
      }
      return !1;
    } catch (e) {
      return console.warn("[SceneRotationIntegration] 检查局部坐标模式失败:", e), !1;
    }
  }
  updateSceneRotation(e, t = !1) {
    if (!this.initialized) return;
    const o = Date.now();
    if (!t && o - this.lastUpdateTime < this.updateThrottle) return;
    this.lastUpdateTime = o;
    const i = this._isUsingLocalCoordinateMode();
    t && console.log("[SceneRotationIntegration] 🔄 场景旋转更新（强制）:", {
      局部坐标模式: i,
      相机位置: e ? {
        x: e.position.x.toFixed(2),
        y: e.position.y.toFixed(2),
        z: e.position.z.toFixed(2)
      } : "N/A",
      当前四元数: this.sceneContainers.layer1 ? {
        x: this.sceneContainers.layer1.quaternion.x.toFixed(4),
        y: this.sceneContainers.layer1.quaternion.y.toFixed(4),
        z: this.sceneContainers.layer1.quaternion.z.toFixed(4),
        w: this.sceneContainers.layer1.quaternion.w.toFixed(4)
      } : "N/A"
    });
    try {
      ae.updateSceneRotation(e, t), this.sceneContainers.layer1 && this.sceneContainers.layer2 && (this.sceneContainers.layer2.quaternion.copy(this.sceneContainers.layer1.quaternion), this.sceneContainers.layer2.updateMatrixWorld(!0));
    } catch (n) {
      console.error("[SceneRotationIntegration] 更新场景旋转失败:", n);
    }
  }
  onRotateComplete(e, t) {
    console.log("[SceneRotationIntegration] 翻转完成:", {
      mode: e,
      position: t.position,
      direction: t.direction
    }), this.initialized && t && requestAnimationFrame(() => {
      this.updateSceneRotation(this.sceneRotationManager?.cesiumViewer?.camera, !0);
    });
  }
  onPanComplete() {
    if (this.initialized) {
      if (this._isUsingLocalCoordinateMode()) {
        console.log("[SceneRotationIntegration] 局部坐标模式：平移操作跳过场景旋转更新");
        return;
      }
      requestAnimationFrame(() => {
        this.updateSceneRotation(this.sceneRotationManager?.cesiumViewer?.camera, !1);
      });
    }
  }
  onZoomComplete() {
    if (this.initialized) {
      if (this._isUsingLocalCoordinateMode()) {
        console.log("[SceneRotationIntegration] 局部坐标模式：缩放操作跳过场景旋转更新");
        return;
      }
      requestAnimationFrame(() => {
        this.updateSceneRotation(this.sceneRotationManager?.cesiumViewer?.camera, !1);
      });
    }
  }
  enableModeProtection(e = 1e3) {
    this.modeState.protectionEnabled = !0, ae.enableModeTransitionProtection(e);
  }
  disableModeProtection() {
    this.modeState.protectionEnabled = !1, ae.disableModeTransitionProtection();
  }
  getState() {
    return {
      initialized: this.initialized,
      modeState: { ...this.modeState },
      rotationState: ae.getRotationState(),
      hasContainers: {
        layer1: !!this.sceneContainers.layer1,
        layer2: !!this.sceneContainers.layer2
      }
    };
  }
  getSceneRotationManager() {
    return ae;
  }
  dispose() {
    this.sceneContainers = {
      layer1: null,
      layer2: null
    }, ae.reset(), this.initialized = !1, console.log("[SceneRotationIntegration] 已清理");
  }
}, st = new $n(), An = {
  name: "ThreeViewer",
  props: {
    filePaths: {
      type: Array,
      default: () => []
    },
    formatConfig: {
      type: Object,
      default: () => ({
        drc: !0,
        ply: !0,
        glb: !0,
        gltf: !0
      })
    },
    autoScale: {
      type: Boolean,
      default: !1
    },
    targetFps: {
      type: Number,
      default: null
    }
  },
  beforeCreate() {
    this.scene = new h.Scene(), this.camera = new h.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e5), this.controls = null, this.modelGroup = new h.Group(), this.gltfLoader = new He();
    const e = new ze();
    e.setDecoderPath("/cdn/jsm/libs/draco/"), e.preload(), this.gltfLoader.setDRACOLoader(e), this.dracoLoader = new ze(), this.dracoLoader.setDecoderPath("/cdn/jsm/libs/draco/"), this.dracoLoader.preload(), this.plyLoader = new vt(), this.plyLoader.setPath(this.plyLoader.path || ""), this.plyLoader.resourcePath, this.raycaster = new h.Raycaster(), this.mouse = new h.Vector2(), this.selectedModel = null, this.transformControls = null, this.animationMixers = [], this.clock = new h.Clock(), this.allCollisionHelpers = [];
  },
  mounted() {
    console.log("[ThreeViewer] mounted - name:", this.$options.name, "isMapViewer:", this.isMapViewer), this.initThree(), this.initModelInteraction(), window.__threeViewerInstances || (window.__threeViewerInstances = [], window.showCollisionHelpers = () => {
      console.log("[Global Debug] Showing collision helpers for all instances"), window.__threeViewerInstances.forEach((e) => {
        e.toggleCollisionHelpers(!0);
      });
    }, window.hideCollisionHelpers = () => {
      console.log("[Global Debug] Hiding collision helpers for all instances"), window.__threeViewerInstances.forEach((e) => {
        e.toggleCollisionHelpers(!1);
      });
    }, window.debugCollisionHelpers = () => {
      console.log("[Global Debug] Debugging collision helpers for all instances"), window.__threeViewerInstances.forEach((e) => {
        e.debugCollisionHelpers();
      });
    }, window.checkCollisionHelpers = () => {
      console.log("[Global Debug] Checking collision helpers status for all instances"), window.__threeViewerInstances.forEach((e, t) => {
        const o = e.$options.name || "ThreeViewer";
        console.log(`[Instance ${t} - ${o}]`), console.log("  modelGroup children:", e.modelGroup?.children?.length || 0), console.log("  allCollisionHelpers:", e.allCollisionHelpers?.length || 0), console.log("  animationMixers:", e.animationMixers?.length || 0), e.allCollisionHelpers && e.allCollisionHelpers.length > 0 && e.allCollisionHelpers.forEach((i, n) => {
          console.log(`  Helper ${n}:`, {
            position: i.position,
            visible: i.material.visible,
            wireframe: i.material.wireframe,
            parent: i.parent?.type,
            hasSourceMesh: !!i.userData.sourceSkinnedMesh,
            sourceMeshName: i.userData.sourceSkinnedMesh?.name
          });
        }), e.modelGroup && e.modelGroup.children.forEach((i, n) => {
          console.log(`  Model ${n}:`, {
            filePath: i.userData.filePath,
            isSkinnedModel: i.userData.isSkinnedModel,
            collisionHelpersCount: i.userData.collisionHelpers?.length || 0
          });
        });
      });
    }, window.testCollisionUpdate = () => {
      console.log("[Global Debug] Testing collision helper update..."), window.__threeViewerInstances.forEach((e, t) => {
        const o = e.$options.name || "ThreeViewer";
        console.log(`
[Instance ${t} - ${o}]`), e.modelGroup && e.modelGroup.children.forEach((i) => {
          console.log(`
  Model Transform Analysis:`), console.log("    Model position:", `(${i.position.x.toFixed(3)}, ${i.position.y.toFixed(3)}, ${i.position.z.toFixed(3)})`), console.log("    Model scale:", `(${i.scale.x.toFixed(3)}, ${i.scale.y.toFixed(3)}, ${i.scale.z.toFixed(3)})`), console.log("    Model rotation:", `(${i.rotation.x.toFixed(3)}, ${i.rotation.y.toFixed(3)}, ${i.rotation.z.toFixed(3)})`), i.traverse((n) => {
            if (n.isSkinnedMesh) {
              const r = new h.Vector3();
              n.getWorldPosition(r), console.log(`    SkinnedMesh "${n.name}" world position:`, `(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)})`), console.log(`    SkinnedMesh "${n.name}" local position:`, `(${n.position.x.toFixed(3)}, ${n.position.y.toFixed(3)}, ${n.position.z.toFixed(3)})`);
            }
          }), i.userData && i.userData.isSkinnedModel && i.userData.collisionHelpers && i.userData.collisionHelpers.forEach((n, r) => {
            if (n.userData.sourceSkinnedMesh) {
              const a = n.userData.sourceSkinnedMesh, s = e.computeSkinnedMeshBoundingBox(a), c = s.getCenter(new h.Vector3());
              console.log(`
  Helper ${r} (${a.name || "unnamed"}):`), console.log("    Current helper position:", `(${n.position.x.toFixed(3)}, ${n.position.y.toFixed(3)}, ${n.position.z.toFixed(3)})`), console.log("    Calculated center (from computeSkinnedMeshBoundingBox):", `(${c.x.toFixed(3)}, ${c.y.toFixed(3)}, ${c.z.toFixed(3)})`), console.log("    Difference:", `(${(c.x - n.position.x).toFixed(3)}, ${(c.y - n.position.y).toFixed(3)}, ${(c.z - n.position.z).toFixed(3)})`), console.log("    Bounding box:", {
                min: `(${s.min.x.toFixed(3)}, ${s.min.y.toFixed(3)}, ${s.min.z.toFixed(3)})`,
                max: `(${s.max.x.toFixed(3)}, ${s.max.y.toFixed(3)}, ${s.max.z.toFixed(3)})`,
                size: `(${s.max.x - s.min.x}, ${s.max.y - s.min.y}, ${s.max.z - s.min.z})`
              });
            }
          });
        });
      });
    }), window.__threeViewerInstances.push(this), console.log("[ThreeViewer] Registered to global debug system. Total instances:", window.__threeViewerInstances.length), console.log("[ThreeViewer] Debug commands available: showCollisionHelpers(), hideCollisionHelpers(), debugCollisionHelpers(), checkCollisionHelpers()"), this.$options.name !== "MapViewer" && this.filePaths && this.filePaths.length > 0 && (console.log("[ThreeViewer] Loading models from filePaths:", this.filePaths.length), this.loadMultipleModels(this.filePaths)), window.addEventListener("resize", this.onWindowResize), console.log("[ThreeViewer] Debug commands available: showCollisionHelpers(), hideCollisionHelpers(), debugCollisionHelpers()");
  },
  beforeUnmount() {
    if (window.__threeViewerInstances) {
      const e = window.__threeViewerInstances.indexOf(this);
      e > -1 && (window.__threeViewerInstances.splice(e, 1), console.log("[ThreeViewer] Removed from global debug system. Remaining instances:", window.__threeViewerInstances.length));
    }
    if (window.removeEventListener("resize", this.onWindowResize), this.$refs.container && this.$refs.container.removeEventListener("pointerdown", this.onPointerDown), this.clearScene(), this.scene && fe.removeScene(this.scene), this.controls) try {
      (this.controls.domElement || this.controls.object) && this.controls.dispose();
    } catch (e) {
      console.warn("[ThreeViewer] OrbitControls dispose error (safe to ignore):", e.message);
    }
    if (this.transformControls) try {
      (this.transformControls.domElement || this.transformControls.object) && this.transformControls.dispose();
    } catch (e) {
      console.warn("[ThreeViewer] TransformControls dispose error (safe to ignore):", e.message);
    }
    this.animationMixers && (this.animationMixers.forEach((e) => e.stopAllAction()), this.animationMixers = []);
  },
  methods: {
    initThree() {
      this.controls && this.controls.dispose(), this.scene.background = new h.Color(15267304), this.camera.position.set(0, 10, 0), this.camera.lookAt(0, 0, 0), this.controls = new Ue(this.camera, this.$refs.container), this.controls.enableDamping = !1, this.controls.target.set(0, 0, 0);
      const e = new h.AmbientLight(16777215, 0.8);
      this.scene.add(e);
      const t = new h.DirectionalLight(16777215, 0.8);
      t.position.set(0, 1, 1).normalize(), this.scene.add(t), this.scene.add(this.modelGroup);
      const o = {
        element: this.$refs.container,
        scene: this.scene,
        camera: this.camera,
        controls: this.controls,
        animationUpdate: this.getAnimationUpdateCallback()
      };
      fe.addScene(o);
    },
    initModelInteraction() {
      this.transformControls = new Oe(this.camera, this.$refs.container), this.transformControls.setSize(0.8), this.transformControls.setSpace("world"), this.transformControls.addEventListener("change", () => {
        if (this.selectedModel && this.selectedModel.userData._transformAnchor) {
          const e = this.selectedModel.userData._transformAnchor, t = this.selectedModel.userData._transformBottomOffset;
          this.selectedModel.position.set(e.position.x - t.x, e.position.y - t.y, e.position.z - t.z);
        }
      }), this.transformControls.addEventListener("dragging-changed", (e) => {
        this.controls.enabled = !e.value;
      }), typeof this.transformControls.getHelper == "function" ? this.scene.add(this.transformControls.getHelper()) : this.scene.add(this.transformControls), this.$refs.container.addEventListener("pointerdown", this.onPointerDown);
    },
    onPointerDown(e) {
      if (this.transformControls.dragging) return;
      const t = this.$refs.container.getBoundingClientRect();
      this.mouse.x = (e.clientX - t.left) / t.width * 2 - 1, this.mouse.y = -((e.clientY - t.top) / t.height) * 2 + 1, this.raycaster.setFromCamera(this.mouse, this.camera), this.raycaster.params.Line.threshold = 0.5, this.raycaster.params.Points.threshold = 0.5;
      const o = this.raycaster.intersectObjects(this.modelGroup.children, !0), i = this.raycaster.intersectObjects(this.allCollisionHelpers, !1), n = [...o, ...i];
      if (n.sort((r, a) => r.distance - a.distance), console.log("[ThreeViewer] Raycast intersects:", n.length, "(models:", o.length, ", helpers:", i.length, ")"), n.length > 0) {
        let r = n[0].object;
        console.log("[ThreeViewer] Clicked object:", r.name || r.type, "isCollisionHelper:", r.userData.isCollisionHelper, "distance:", n[0].distance);
        let a = r;
        if (r.userData.isCollisionHelper && r.userData.targetModel)
          a = r.userData.targetModel, console.log("[ThreeViewer] Found target model via collision helper:", a.userData.filePath);
        else for (; a.parent && a.parent !== this.modelGroup; ) a = a.parent;
        if (console.log("[ThreeViewer] Target model:", a.name || a.type, "userData:", a.userData), this.selectedModel === a) return;
        this.selectModel(a);
      } else
        console.log("[ThreeViewer] No intersection, deselecting model"), this.deselectModel();
    },
    selectModel(e) {
      this.deselectModel(), console.log("[ThreeViewer] selectModel called with:", e.name || e.type, "isSkinnedModel:", e.userData.isSkinnedModel);
      const t = new h.Box3().setFromObject(e), o = new h.Vector3();
      o.x = (t.min.x + t.max.x) / 2, o.y = t.min.y, o.z = (t.min.z + t.max.z) / 2;
      const i = new h.Object3D();
      i.position.copy(o), this.scene.add(i), e.userData._transformAnchor = i, e.userData._transformBottomOffset = new h.Vector3(o.x - e.position.x, o.y - e.position.y, o.z - e.position.z), this.selectedModel = e, this.transformControls.attach(i), console.log("[ThreeViewer] TransformControls attached to anchor at model bottom:", o), this.highlightModel(e, !0);
    },
    highlightModel(e, t) {
      t ? (e.userData._highlightOriginalScale || (e.userData._highlightOriginalScale = e.scale.clone()), e.scale.set(e.userData._highlightOriginalScale.x * 1.05, e.userData._highlightOriginalScale.y * 1.05, e.userData._highlightOriginalScale.z * 1.05)) : e.userData._highlightOriginalScale && (e.scale.copy(e.userData._highlightOriginalScale), delete e.userData._highlightOriginalScale);
    },
    deselectModel() {
      this.selectedModel && (this.highlightModel(this.selectedModel, !1), this.selectedModel.userData._transformAnchor && (this.scene.remove(this.selectedModel.userData._transformAnchor), delete this.selectedModel.userData._transformAnchor), delete this.selectedModel.userData._transformBottomOffset, this.transformControls.detach(), this.selectedModel = null);
    },
    render() {
    },
    toggleCollisionHelpers(e) {
      let t = 0;
      this.allCollisionHelpers.forEach((o) => {
        if (o && o.parent)
          if (t++, e) {
            o.material.visible = !0, o.material.wireframe = !0, o.material.color = new h.Color(65280);
            const i = new h.Vector3();
            o.getWorldPosition(i), console.log(`[ThreeViewer] Collision helper #${t}:`, {
              localPosition: o.position,
              worldPosition: i,
              scale: o.scale,
              geometry: o.geometry.parameters,
              isModelHelper: o.userData.isModelHelper,
              hasSourceMesh: !!o.userData.sourceSkinnedMesh,
              parent: o.parent?.name || o.parent?.type
            });
          } else
            o.material.visible = !1, o.material.wireframe = !1;
      }), console.log(`[ThreeViewer] Toggled ${t} collision helpers, visible: ${e}`), e && this.modelGroup.children.forEach((o, i) => {
        const n = new h.Box3().setFromObject(o), r = n.getSize(new h.Vector3()), a = n.getCenter(new h.Vector3());
        console.log(`[ThreeViewer] Model #${i}:`, {
          name: o.name || o.type,
          worldPosition: o.position,
          worldSize: r,
          worldCenter: a,
          hasCollisionHelpers: !!o.userData.collisionHelpers,
          collisionHelpersCount: o.userData.collisionHelpers?.length || 0
        }), console.log(`[ThreeViewer] Model #${i} direct children:`, o.children.map((s) => ({
          type: s.type,
          name: s.name,
          isCollisionHelper: s.userData.isCollisionHelper,
          position: s.position
        }))), console.log(`[ThreeViewer] Model #${i} meshes:`), o.traverse((s) => {
          if (s.isMesh || s.isPoints || s.isSkinnedMesh) {
            const c = new h.Vector3();
            s.getWorldPosition(c), console.log(`  - ${s.type}:`, {
              name: s.name,
              localPosition: s.position,
              worldPosition: c
            });
          }
        });
      });
    },
    updateCollisionHelpers() {
      if (!this.modelGroup || (this._frameCounter || (this._frameCounter = 0), this._frameCounter++, this._frameCounter % 3 !== 0)) return;
      let e = 0;
      const t = this.$options.name || "ThreeViewer";
      this.modelGroup.children.forEach((o) => {
        if (o.userData && o.userData.isSkinnedModel && o.userData.collisionHelpers && o.userData.collisionHelpers.forEach((i) => {
          if (i.userData.sourceSkinnedMesh) try {
            const n = i.userData.sourceSkinnedMesh, r = this.computeSkinnedMeshBoundingBox(n), a = r.getCenter(new h.Vector3()), s = r.getSize(new h.Vector3()), c = 1.3, l = {
              x: s.x * c,
              y: s.y * c,
              z: s.z * c
            };
            i.position.copy(a), i.scale.set(l.x / i.userData.initialSize.x, l.y / i.userData.initialSize.y, l.z / i.userData.initialSize.z), e++;
          } catch (n) {
            console.error(`[${t}] Error updating collision helper:`, n);
          }
        }), o.userData._transformAnchor && o.userData.isSkinnedModel) try {
          let i = null;
          if (o.traverse((n) => {
            n.isSkinnedMesh && !i && (i = n);
          }), i) {
            const n = this.computeSkinnedMeshBoundingBox(i), r = new h.Vector3();
            r.x = (n.min.x + n.max.x) / 2, r.y = n.min.y, r.z = (n.min.z + n.max.z) / 2, o.userData._transformAnchor.position.copy(r), o.userData._transformBottomOffset.set(r.x - o.position.x, r.y - o.position.y, r.z - o.position.z);
          }
        } catch {
        }
      }), this._frameCounter % 60 === 0 && console.log(`[${t}] updateCollisionHelpers called - models: ${this.modelGroup.children.length}, updated: ${e}`);
    },
    computeSkinnedMeshBoundingBox(e) {
      const t = new h.Box3();
      if (!e || !e.geometry)
        return console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: Invalid skinnedMesh"), t;
      const o = e.geometry.attributes.position;
      if (!o) return t.setFromObject(e);
      const i = o.count;
      if (i === 0)
        return console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: Empty geometry, mesh:", e.name), t.setFromObject(e);
      let n = !1;
      for (let d = 0; d < Math.min(10, i); d++) {
        const m = o.getX(d), p = o.getY(d), x = o.getZ(d);
        if (!isFinite(m) || !isFinite(p) || !isFinite(x)) {
          n = !0;
          break;
        }
      }
      if (n)
        return console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: Geometry has NaN values, mesh:", e.name), t.setFromObject(e);
      const r = new h.Vector3(), a = e.geometry.attributes.skinIndex, s = e.geometry.attributes.skinWeight;
      if (!e.skeleton || !e.skeleton.bones) return t.setFromObject(e);
      const c = e.skeleton.bones;
      let l = !1;
      for (let d = 0; d < Math.min(5, c.length); d++) {
        const m = c[d];
        if (m && m.matrixWorld) {
          for (let p = 0; p < 16; p++) if (!isFinite(m.matrixWorld.elements[p])) {
            l = !0;
            break;
          }
        }
        if (l) break;
      }
      if (l)
        return console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: Skeleton has invalid bone matrices, mesh:", e.name), t.setFromObject(e);
      const g = e.skeleton.boneInverses, u = Math.max(1, Math.floor(i / 500));
      for (let d = 0; d < i; d += u)
        if (r.set(o.getX(d), o.getY(d), o.getZ(d)), !(!isFinite(r.x) || !isFinite(r.y) || !isFinite(r.z))) {
          if (a && s) {
            const m = r.x, p = r.y, x = r.z, f = a.getX(d), C = a.getY(d), M = a.getZ(d), y = a.getW(d), w = s.getX(d), V = s.getY(d), S = s.getZ(d), T = s.getW(d);
            if (r.set(0, 0, 0), c[f]) {
              const v = c[f].matrixWorld, D = g[f], _ = w;
              if (v && isFinite(v.elements[0])) {
                const b = new h.Vector3(m, p, x);
                D && isFinite(D.elements[0]) && b.applyMatrix4(D), b.applyMatrix4(v), b.multiplyScalar(_), isFinite(b.x) && isFinite(b.y) && isFinite(b.z) && r.add(b);
              }
            }
            if (c[C]) {
              const v = c[C].matrixWorld, D = g[C], _ = V;
              if (v && isFinite(v.elements[0])) {
                const b = new h.Vector3(m, p, x);
                D && isFinite(D.elements[0]) && b.applyMatrix4(D), b.applyMatrix4(v), b.multiplyScalar(_), isFinite(b.x) && isFinite(b.y) && isFinite(b.z) && r.add(b);
              }
            }
            if (c[M]) {
              const v = c[M].matrixWorld, D = g[M], _ = S;
              if (v && isFinite(v.elements[0])) {
                const b = new h.Vector3(m, p, x);
                D && isFinite(D.elements[0]) && b.applyMatrix4(D), b.applyMatrix4(v), b.multiplyScalar(_), isFinite(b.x) && isFinite(b.y) && isFinite(b.z) && r.add(b);
              }
            }
            if (c[y]) {
              const v = c[y].matrixWorld, D = g[y], _ = T;
              if (v && isFinite(v.elements[0])) {
                const b = new h.Vector3(m, p, x);
                D && isFinite(D.elements[0]) && b.applyMatrix4(D), b.applyMatrix4(v), b.multiplyScalar(_), isFinite(b.x) && isFinite(b.y) && isFinite(b.z) && r.add(b);
              }
            }
          }
          isFinite(r.x) && isFinite(r.y) && isFinite(r.z) && t.expandByPoint(r);
        }
      if (t.min.x === 1 / 0 || t.max.x === -1 / 0) {
        console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: Box still invalid after computation, trying setFromObject");
        try {
          if (t.setFromObject(e), !isFinite(t.min.x) || !isFinite(t.min.y) || !isFinite(t.min.z) || !isFinite(t.max.x) || !isFinite(t.max.y) || !isFinite(t.max.z))
            return console.warn("[ThreeViewer] computeSkinnedMeshBoundingBox: setFromObject also returned invalid values, using default box"), new h.Box3(new h.Vector3(-0.5, -0.5, -0.5), new h.Vector3(0.5, 0.5, 0.5));
        } catch (d) {
          return console.error("[ThreeViewer] computeSkinnedMeshBoundingBox: setFromObject failed:", d), new h.Box3(new h.Vector3(-0.5, -0.5, -0.5), new h.Vector3(0.5, 0.5, 0.5));
        }
      }
      return t;
    },
    createCollisionHelper(e, t) {
      try {
        const o = this.computeSkinnedMeshBoundingBox(e), i = o.getSize(new h.Vector3()), n = o.getCenter(new h.Vector3()), r = isFinite(i.x) && isFinite(i.y) && isFinite(i.z) && i.x > 1e-3 && i.y > 1e-3 && i.z > 1e-3, a = isFinite(n.x) && isFinite(n.y) && isFinite(n.z);
        if (!r || !a) {
          console.warn("[ThreeViewer] Invalid bounding box for SkinnedMesh, skipping collision helper:", {
            size: i,
            center: n,
            meshName: e.name,
            isValidSize: r,
            isValidCenter: a
          });
          return;
        }
        console.log("[ThreeViewer] Creating collision helper for SkinnedMesh - world size:", i, "world center:", n);
        const s = 1.3, c = {
          x: i.x * s,
          y: i.y * s,
          z: i.z * s
        };
        if (!isFinite(c.x) || !isFinite(c.y) || !isFinite(c.z)) {
          console.warn("[ThreeViewer] Expanded size is invalid, skipping collision helper:", c);
          return;
        }
        const l = new h.BoxGeometry(c.x, c.y, c.z), g = new h.MeshBasicMaterial({
          visible: !1,
          wireframe: !1,
          color: 65280
        }), u = new h.Mesh(l, g);
        u.position.copy(n), u.renderOrder = -1, u.userData = {
          isCollisionHelper: !0,
          sourceSkinnedMesh: e,
          targetModel: t,
          initialPosition: n.clone(),
          initialSize: c
        }, this.scene.add(u), this.allCollisionHelpers.push(u), t.userData.collisionHelpers || (t.userData.collisionHelpers = []), t.userData.collisionHelpers.push(u), console.log("[ThreeViewer] SkinnedMesh collision helper created - expanded size:", c, "world position:", n);
      } catch (o) {
        console.error("[ThreeViewer] Error creating collision helper for SkinnedMesh:", o, {
          meshName: e.name,
          geometry: e.geometry
        });
      }
    },
    createCollisionHelperForModel(e) {
      console.warn("[ThreeViewer] createCollisionHelperForModel called, but should use createCollisionHelperForMesh instead");
    },
    createCollisionHelperForMesh(e, t) {
      const o = e.geometry;
      (!o || !o.boundingBox) && o.computeBoundingBox();
      const i = o.boundingBox.clone(), n = new h.Vector3();
      if (i.getSize(n), n.x === 0 && n.y === 0 && n.z === 0) {
        console.log("[ThreeViewer] Skipping collision helper for empty mesh geometry:", e.name);
        return;
      }
      const r = new h.Vector3();
      i.getCenter(r), console.log("[ThreeViewer] Creating collision helper for mesh - geometry size:", n, "geometry center:", r, "mesh:", e.name);
      const a = Math.max(n.x, n.y, n.z);
      let s = 2;
      a < 0.1 && (s = 10), a > 10 && (s = 1.2);
      const c = {
        x: n.x * s,
        y: n.y * s,
        z: n.z * s
      }, l = new h.BoxGeometry(c.x, c.y, c.z), g = new h.MeshBasicMaterial({
        visible: !1,
        wireframe: !1,
        color: 65280
      }), u = new h.Mesh(l, g);
      u.position.copy(r), u.renderOrder = -1, u.userData = {
        isCollisionHelper: !0,
        sourceMesh: e,
        isMeshHelper: !0
      }, e.add(u), this.allCollisionHelpers.push(u), t.userData.collisionHelpers || (t.userData.collisionHelpers = []), t.userData.collisionHelpers.push(u), console.log("[ThreeViewer] Mesh collision helper created - expanded size:", c, "position:", r, "added as child of mesh");
    },
    createSimpleCollisionHelper(e) {
      const t = new h.Box3().setFromObject(e), o = t.getSize(new h.Vector3()), i = t.getCenter(new h.Vector3());
      if (o.x === 0 && o.y === 0 && o.z === 0) {
        console.log("[ThreeViewer] Skipping collision helper for empty model:", e.userData.filePath);
        return;
      }
      console.log("[ThreeViewer] Creating simple collision helper for model - size:", o, "center:", i), Math.max(o.x, o.y, o.z);
      const n = 3, r = {
        x: o.x * n,
        y: o.y * n,
        z: o.z * n
      }, a = new h.BoxGeometry(r.x, r.y, r.z), s = new h.MeshBasicMaterial({
        visible: !1,
        wireframe: !1,
        color: 65280
      }), c = new h.Mesh(a, s), l = e.worldToLocal(i.clone());
      c.position.copy(l), c.renderOrder = -1, c.userData = {
        isCollisionHelper: !0,
        isModelHelper: !0
      }, e.add(c), this.allCollisionHelpers.push(c), e.userData.collisionHelpers.push(c), console.log("[ThreeViewer] Simple collision helper created - expanded size:", r, "local position:", l);
    },
    debugCollisionHelpers() {
      this.modelGroup && (console.log(`
=== 碰撞辅助体调试信息 ===`), console.log("模型数量:", this.modelGroup.children.length), this.modelGroup.children.forEach((e, t) => {
        console.log(`
模型 ${t}: ${e.userData.filePath || "(unnamed)"}`), console.log("  模型位置:", e.position.x, e.position.y, e.position.z), console.log("  模型缩放:", e.scale.x, e.scale.y, e.scale.z), console.log("  碰撞辅助体数量:", e.userData.collisionHelpers?.length || 0), e.userData.collisionHelpers && e.userData.collisionHelpers.forEach((i, n) => {
          if (console.log(`    辅助体 ${n}:`), console.log("      局部位置:", i.position.x, i.position.y, i.position.z), console.log("      父元素类型:", i.parent?.type), console.log("      父元素是模型:", i.parent === e), console.log("      父元素是网格:", i.parent?.isMesh || i.parent?.isSkinnedMesh), i.parent && (i.parent.isMesh || i.parent.isSkinnedMesh)) {
            const r = i.parent, a = {
              x: 0,
              y: 0,
              z: 0
            };
            try {
              const s = new h.Vector3();
              r.getWorldPosition(s), a.x = s.x, a.y = s.y, a.z = s.z;
            } catch {
            }
            console.log("      网格世界位置:", a.x, a.y, a.z);
          }
        });
        let o = 0;
        e.traverse((i) => {
          (i.isMesh || i.isSkinnedMesh) && (o++, console.log(`    网格 ${o} (${i.type}):`), console.log("      名称:", i.name || "(unnamed)"), console.log("      局部位置:", i.position.x, i.position.y, i.position.z));
        });
      }), console.log(`
=== 调试信息结束 ===
`));
    },
    clearScene() {
      if (this.deselectModel(), this.allCollisionHelpers.forEach((e) => {
        e && e.parent && (e.parent.remove(e), e.geometry.dispose(), e.material.dispose());
      }), this.allCollisionHelpers = [], this.modelGroup) for (; this.modelGroup.children.length > 0; ) {
        const e = this.modelGroup.children[0];
        this.modelGroup.remove(e);
      }
      this._frameCounter = 0;
    },
    animate() {
      const e = this.clock.getDelta();
      this.updateAnimations(e);
    },
    getAnimationUpdateCallback() {
      return () => {
        const e = this.clock.getDelta();
        this.updateAnimations(e), this.updateCollisionHelpers();
      };
    },
    onWindowResize() {
      this.camera && this.$refs.container && (this.camera.aspect = this.$refs.container.clientWidth / this.$refs.container.clientHeight, this.camera.updateProjectionMatrix());
    },
    async loadMultipleModels(e) {
      const t = this.$options.name === "MapViewer";
      if (t ? console.log(t ? "%c[MapViewer-ThreeViewer]" : "[ThreeViewer]", "loadMultipleModels called with", e?.length || 0, "paths", "color: #ff6600; font-weight: bold") : console.log("[ThreeViewer] loadMultipleModels called with", e?.length || 0, "paths"), console.log("[ThreeViewer] Paths:", e), this.modelGroup || (this.modelGroup = new h.Group()), this.scene.children.includes(this.modelGroup) || this.scene.add(this.modelGroup), !e || e.length === 0) {
        console.log("[ThreeViewer] No paths provided, clearing scene"), this.clearScene();
        return;
      }
      this.$emit("load-state-change", { state: "loading" }), this.clearScene(), t && console.log("%c[MapViewer-ThreeViewer] Before creating promises", "color: #ff6600"), console.log("[DEBUG] Starting paths.map(), paths.length:", e.length);
      const i = [];
      let n = 0;
      const r = e.length, a = e.map((c, l) => (console.log(`[DEBUG] Mapping path ${l}:`, c), t && console.log(`%c[MapViewer-ThreeViewer] Loading model ${l}:`, c, "color: #00ff00"), this.loadSingleModel(c).then((g) => (n++, t && console.log(`%c[MapViewer-ThreeViewer] Model ${l} loaded (${n}/${r})`, "color: #00ff00; font-weight: bold"), g)).catch((g) => (n++, t && console.error(`%c[MapViewer-ThreeViewer] Model ${l} failed (${n}/${r})`, "color: #ff0000; font-weight: bold", g), null))));
      console.log("[DEBUG] paths.map() completed, modelPromises.length:", a.length), console.log("[DEBUG] Waiting for all promises...");
      const s = await Promise.all(a);
      console.log("[DEBUG] Promise.all completed! results:", s.length), s.forEach((c) => {
        c !== null && i.push(c);
      }), console.log("[DEBUG] Loaded models:", i.length, "out of", r), console.log("[ThreeViewer] loadMultipleModels - loadedModels:", i.length, "out of", e.length), console.log("[ThreeViewer] Is this MapViewer?", this.$options.name === "MapViewer"), console.log("[ThreeViewer] isMapViewer flag:", this.isMapViewer), console.log("[ThreeViewer] _skipDefaultFocus:", this._skipDefaultFocus), console.log("[ThreeViewer] focusOnModels function name:", this.focusOnModels?.name || "anonymous"), i.length > 0 ? (i.forEach((c) => this.modelGroup.add(c)), console.log("[ThreeViewer] Models added to modelGroup. Children count:", this.modelGroup.children.length), console.log("[ThreeViewer] About to call focusOnModels..."), console.log("[ThreeViewer] focusOnModels is:", typeof this.focusOnModels), this._skipDefaultFocus ? console.log("[ThreeViewer] Skipping default focusOnModels, MapViewer will handle it") : (console.log("[ThreeViewer] Calling default focusOnModels..."), this.focusOnModels(), console.log("[ThreeViewer] focusOnModels called"))) : console.warn("[ThreeViewer] No models loaded!"), this.$emit("load-state-change", {
        state: "success",
        count: i.length
      }), this.transformControls && !this.selectedModel && this.transformControls.detach(), console.log("[ThreeViewer] loadMultipleModels method finished, returning");
    },
    async loadSingleModel(e) {
      const t = e.toLowerCase().split(".").pop(), o = t === "glb" ? "glb" : t === "gltf" ? "gltf" : t;
      if (console.log(`[ThreeViewer] loadSingleModel - format: ${t}, formatKey: ${o}, formatConfig:`, this.formatConfig), !this.formatConfig[o])
        return console.log(`[ThreeViewer] Skipping ${t} format (disabled in config): ${e}`), null;
      console.log(`[ThreeViewer] Loading ${t} model: ${e}`);
      let i;
      try {
        if (t === "drc") i = await this.loadDrcModel(e);
        else if (t === "ply") i = await this.loadWithLoader(e, this.plyLoader, (n) => {
          const r = n, a = r.attributes.position.count, s = r.index !== null, c = r.hasAttribute("color");
          if (console.log(`[ThreeViewer] PLY loaded: ${a} vertices, hasIndex: ${s}, hasColor: ${c}`), r.hasAttribute("scale") && r.hasAttribute("rotation") && r.hasAttribute("opacity") && r.hasAttribute("featureDc")) {
            console.log("[ThreeViewer] PLY has Gaussian attributes, using Gaussian splat rendering");
            const g = this.createGaussianSplatMaterial(), u = new h.Points(r, g), d = new h.Group();
            return d.add(u), d.userData.format = "ply", d.userData.isGaussianSplat = !0, d;
          }
          if (!s) {
            console.log("[ThreeViewer] PLY is point cloud, adding default Gaussian attributes");
            const g = r.attributes.position.array;
            let u = 1 / 0, d = -1 / 0, m = 1 / 0, p = -1 / 0, x = 1 / 0, f = -1 / 0;
            for (let E = 0; E < a; E++)
              u = Math.min(u, g[E * 3]), d = Math.max(d, g[E * 3]), m = Math.min(m, g[E * 3 + 1]), p = Math.max(p, g[E * 3 + 1]), x = Math.min(x, g[E * 3 + 2]), f = Math.max(f, g[E * 3 + 2]);
            const C = d - u, M = p - m, y = f - x, w = (C + M + y) / 3 / 2500, V = new Float32Array(a * 3);
            for (let E = 0; E < a * 3; E++) V[E] = w;
            r.setAttribute("scale", new h.BufferAttribute(V, 3));
            const S = new Float32Array(a * 4);
            for (let E = 0; E < a; E++)
              S[E * 4] = 0, S[E * 4 + 1] = 0, S[E * 4 + 2] = 0, S[E * 4 + 3] = 1;
            r.setAttribute("rotation", new h.BufferAttribute(S, 4));
            const T = new Float32Array(a);
            for (let E = 0; E < a; E++) T[E] = 0.9;
            r.setAttribute("opacity", new h.BufferAttribute(T, 1));
            const v = new Float32Array(a * 3);
            if (c) {
              const E = r.attributes.color.array;
              for (let F = 0; F < a; F++) {
                const P = E[F * 3], R = E[F * 3 + 1], L = E[F * 3 + 2];
                v[F * 3] = (P - 0.5) / 0.282095, v[F * 3 + 1] = (R - 0.5) / 0.282095, v[F * 3 + 2] = (L - 0.5) / 0.282095;
              }
              console.log("[ThreeViewer] Using original PLY colors for Gaussian rendering");
            } else {
              for (let E = 0; E < a * 3; E++) v[E] = 0;
              console.log("[ThreeViewer] No color in PLY, using gray");
            }
            r.setAttribute("featureDc", new h.BufferAttribute(v, 3));
            const D = this.createGaussianSplatMaterial(), _ = new h.Points(r, D), b = new h.Group();
            return b.add(_), b.userData.format = "ply", b.userData.isGaussianSplat = !0, console.log("[ThreeViewer] PLY point cloud converted to Gaussian splat with original colors"), b;
          }
          console.log("[ThreeViewer] PLY has faces, using standard mesh rendering"), r.computeVertexNormals();
          const l = new h.MeshStandardMaterial({
            color: 8421504,
            vertexColors: r.hasAttribute("color"),
            side: h.DoubleSide
          });
          return new h.Mesh(r, l);
        });
        else if (t === "glb" || t === "gltf") {
          if (t === "gltf") {
            const n = e.substring(0, e.lastIndexOf("/") + 1);
            this.gltfLoader.setResourcePath(n);
          }
          i = await this.loadWithLoader(e, this.gltfLoader, (n) => {
            const r = n.scene;
            return n.animations && n.animations.length > 0 && (r.userData.animations = n.animations, console.log(`[ThreeViewer] Model ${e} has ${n.animations.length} animation(s):`, n.animations.map((a) => a.name))), r;
          });
        } else throw new Error(`Unsupported file type: ${t}`);
        if (i) {
          i.userData.filePath = e;
          let n = 0;
          if (i.traverse((s) => {
            s.isMesh && n++;
          }), console.log(`[ThreeViewer] Model ${e} - children: ${i.children.length}, meshes: ${n}`), this.autoScale) {
            const s = new h.Box3().setFromObject(i).getSize(new h.Vector3()), c = Math.max(s.x, s.y, s.z);
            console.log(`[ThreeViewer] Model ${e} - bbox size:`, s, "maxDim:", c);
            const l = 1, g = i.userData.format === "drc" ? l / 100 : l / 10, u = i.userData.format === "drc" ? l * 100 : l * 10;
            if (console.log(`[ThreeViewer] Model ${e} - thresholds: MIN=${g}, MAX=${u}, maxDim=${c}`), c > 0 && c < g) {
              const d = l / c;
              i.scale.set(d, d, d), i.userData.autoScaled = !0, i.userData.originalScale = d, console.log(`[ThreeViewer] Model ${e} - scaled up by ${d}`);
            } else if (c > u) {
              const d = l / c;
              i.scale.set(d, d, d), i.userData.autoScaled = !0, i.userData.originalScale = d, console.log(`[ThreeViewer] Model ${e} - scaled down by ${d}`);
            } else console.log(`[ThreeViewer] Model ${e} - no scaling needed`);
          } else console.log(`[ThreeViewer] Model ${e} - autoScale disabled, skipping auto scaling`);
          i.traverse((s) => {
            if (s.isMesh && (s.castShadow = !1, s.receiveShadow = !1, s.material.needsUpdate = !1, s.material)) {
              const c = s.material.uuid;
              console.log(`[ThreeViewer] Material check - mesh: ${s.name || "unnamed"}, material.uuid: ${c}, file: ${e}`, {
                type: s.material.type,
                color: s.material.color?.getHexString(),
                emissive: s.material.emissive?.getHexString(),
                side: s.material.side
              }), s.material.visible = !0;
              const l = s.material.map || s.material.emissiveMap, g = s.material.color && s.material.color.getHex() === 16777215, u = s.material.emissive && s.material.emissive.getHex() === 0;
              console.log(`[ThreeViewer] ${t.toUpperCase()} material check - color: ${s.material.color?.getHexString()}, hasTexture: ${l}, isWhiteColor: ${g}`), s.material.side === h.FrontSide && (s.material = s.material.clone(), s.material.side = h.DoubleSide, console.log(`[ThreeViewer] Cloned material ${c} and set to DoubleSide, new uuid: ${s.material.uuid}`)), t === "glb" && !l && g && u && (s.material = s.material.clone(), console.log(`[ThreeViewer] Cloned material ${c} and set color to 0x808080, new uuid: ${s.material.uuid}`), s.material.color.setHex(8421504), s.material.emissive.setHex(0), s.material.emissiveIntensity = 1, s.material.needsUpdate = !0);
            }
          });
          let r = !1, a = [];
          if (i.traverse((s) => {
            s.isSkinnedMesh && (r = !0, a.push(s), console.log(`[ThreeViewer] Found SkinnedMesh in model: ${e}, name: ${s.name}`), s.frustumCulled = !1);
          }), i.userData.isSkinnedModel = r, i.userData.collisionHelpers || (i.userData.collisionHelpers = []), !r) this.createSimpleCollisionHelper(i);
          else {
            let s = null, c = 0;
            if (a.forEach((l) => {
              const g = l.geometry?.attributes?.position?.count || 0;
              l.name && (l.name.toLowerCase().includes("surface") || l.name.toLowerCase().includes("body") || l.name.toLowerCase().includes("mesh")) ? s = l : g > c && (c = g, s = l);
            }), !s && a.length > 0 && (s = a[0]), s) {
              console.log(`[ThreeViewer] Creating collision helper for main SkinnedMesh: ${s.name}, vertices: ${c}`);
              try {
                this.createCollisionHelper(s, i);
              } catch (l) {
                console.error("[ThreeViewer] Error creating collision helper for SkinnedMesh:", l, {
                  meshName: s.name,
                  vertexCount: c
                });
              }
            }
          }
          return i.userData.animations && i.userData.animations.length > 0 && this.setupModelAnimation(i, e), i;
        } else
          throw console.error(`模型加载成功但内容为空: ${e}`), new Error(`模型加载成功但内容为空: ${e}`);
      } catch (n) {
        throw console.error(`加载模型失败: ${e}`, n), n;
      }
    },
    loadWithLoader(e, t, o) {
      return new Promise((i, n) => {
        t.load(e, (r) => {
          console.log(`[ThreeViewer] Successfully loaded: ${e}`, r);
          const a = o(r);
          a ? i(a) : (console.error(`[ThreeViewer] Process result returned null for: ${e}`), n(/* @__PURE__ */ new Error(`Process result returned null for: ${e}`)));
        }, (r) => {
          if (r.total > 0) {
            const a = Math.round(r.loaded / r.total * 100);
            console.log(`[ThreeViewer] Loading ${e}: ${a}%`);
          }
        }, (r) => {
          console.error(`[ThreeViewer] Loader error for ${e}:`, r), n(r);
        });
      });
    },
    setupModelAnimation(e, t) {
      const o = new h.AnimationMixer(e);
      this.animationMixers.push(o);
      const i = e.userData.animations[0], n = o.clipAction(i);
      n.play(), console.log(`[ThreeViewer] Animation setup for ${t}: playing "${i.name || "unnamed"}"`), e.userData.animationMixer = o, e.userData.currentAction = n;
    },
    updateAnimations(e) {
      for (const t of this.animationMixers) t.update(e);
    },
    clearScene() {
      if (this.modelGroup) for (; this.modelGroup.children.length > 0; ) {
        const e = this.modelGroup.children[0];
        this.modelGroup.remove(e);
      }
    },
    focusOnModels() {
      if (console.log("[ThreeViewer] focusOnModels called - modelGroup children:", this.modelGroup?.children?.length || 0), !this.camera || !this.modelGroup || this.modelGroup.children.length === 0) {
        console.log("[ThreeViewer] focusOnModels skipped - no camera, modelGroup or children");
        return;
      }
      const e = new h.Box3().setFromObject(this.modelGroup);
      if (e.isEmpty()) {
        console.log("[ThreeViewer] focusOnModels - bounding box is empty");
        return;
      }
      const t = e.getCenter(new h.Vector3()), o = e.getSize(new h.Vector3()), i = Math.max(o.x, o.y, o.z);
      if (console.log("[ThreeViewer] focusOnModels - center:", t, "size:", o, "maxDim:", i), i === 0 || !isFinite(i)) {
        console.log("[ThreeViewer] focusOnModels - invalid maxDim");
        return;
      }
      const n = this.camera.fov * (Math.PI / 180), r = Math.abs(i / 2 / Math.tan(n / 2)) * 1.5, a = new h.Vector3(0.5, 0.5, 1).normalize();
      this.camera.position.copy(t).add(a.multiplyScalar(r)), this.controls && (this.controls.target.copy(t), this.controls.update()), console.log("[ThreeViewer] focusOnModels - camera position:", this.camera.position, "target:", this.controls.target);
    },
    handleLargeCoordinateModel(e) {
      if (!e || e.userData.hasLargeCoordinates !== void 0 || e.userData.hasLargeSize !== void 0) return;
      const t = e.userData.filePath || "unknown";
      console.log("[ThreeViewer] 🔍 检测大坐标模型:", t);
      const o = e.scale.clone(), i = e.position.clone();
      e.scale.set(1, 1, 1), e.position.set(0, 0, 0), e.rotation.set(0, 0, 0), e.updateMatrixWorld(!0);
      const n = new h.Box3().setFromObject(e);
      if (n.isEmpty()) {
        console.warn("[ThreeViewer] 无法计算模型边界框:", t), e.scale.copy(o), e.position.copy(i), e.updateMatrixWorld(!0);
        return;
      }
      const r = n.getSize(new h.Vector3()), a = n.getCenter(new h.Vector3()), s = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z), c = Math.max(r.x, r.y, r.z), l = 500, g = 200, u = 1e3, d = Math.abs(a.x) > g || Math.abs(a.y) > g || Math.abs(a.z) > g, m = s > l || d, p = c > u;
      if (e.userData.originalCenter = a.clone(), e.userData.hasLargeCoordinates = m, e.userData.hasLargeSize = p, e.userData.maxDim = c, e.userData.boundingBox = n.clone(), e.userData.boundingBoxCenter = a.clone(), e.userData.boundingBoxSize = r.clone(), m || p) {
        const x = m ? `距离原点 ${s.toFixed(2)} 单位` : `尺寸过大 (${c.toFixed(2)} 单位)`;
        console.warn(`[ThreeViewer] ⚠️ 检测到大模型: ${t}, 原因: ${x}`);
      }
      e.scale.copy(o), e.position.copy(i), e.updateMatrixWorld(!0);
    },
    unifyMaterials() {
      if (!this.modelGroup) return;
      const e = [];
      this.modelGroup.traverse((t) => {
        if (t.isMesh) {
          const o = (i) => {
            i && i.isMeshStandardMaterial && (!i.emissive || i.emissive.getHex() === 0) && i.color && e.push(i);
          };
          Array.isArray(t.material) ? t.material.forEach(o) : o(t.material);
        }
      }), [...new Set(e)].forEach((t) => {
        t.emissive = t.color.clone(), t.needsUpdate = !0;
      });
    },
    applyBrightnessCompensation(e, t) {
      this.modelGroup && this.modelGroup.traverse((o) => {
        o.userData.filePath === e && o.traverse((i) => {
          i.isMesh && i.material && (Array.isArray(i.material) ? i.material : [i.material]).forEach((n) => {
            n.isMeshStandardMaterial && (n.emissiveIntensity = t, n.needsUpdate = !0);
          });
        });
      });
    },
    async loadDrcModel(e) {
      console.log(`[ThreeViewer] Loading DRC model with native decoder: ${e}`);
      let t = 0;
      for (; typeof window.DracoDecoderModule > "u" && t < 50; )
        await new Promise((s) => setTimeout(s, 100)), t++;
      if (typeof window.DracoDecoderModule > "u") throw new Error("DracoDecoderModule not available");
      let o = null, i = null, n = null, r = null, a = null;
      try {
        a = await window.DracoDecoderModule({ locateFile: function(x) {
          return console.log("[ThreeViewer] Draco locating file:", x, "-> /draco3d/draco3d/" + x), "/draco3d/draco3d/" + x;
        } }), console.log("[ThreeViewer] Draco module initialized, methods:", Object.keys(a).slice(0, 20));
        const s = await fetch(e);
        if (!s.ok) throw new Error(`Failed to fetch DRC file: ${s.status}`);
        const c = await s.arrayBuffer(), l = new Uint8Array(c);
        console.log("[ThreeViewer] DRC file loaded, size:", l.byteLength), o = new a.Decoder(), i = new a.DecoderBuffer(), i.Init(l, l.byteLength), console.log("[ThreeViewer] DecoderBuffer initialized");
        const g = o.GetEncodedGeometryType(i);
        if (console.log("[ThreeViewer] Encoded geometry type:", g, "(TRIANGULAR_MESH=", a.TRIANGULAR_MESH, ", POINT_CLOUD=", a.POINT_CLOUD, ")"), g === a.POINT_CLOUD || g === a.INVALID_GEOMETRY_TYPE) {
          console.log("[ThreeViewer] Decoding as PointCloud for Gaussian attributes support"), r = new a.PointCloud();
          const x = o.DecodeBufferToPointCloud(i, r);
          if (console.log("[ThreeViewer] PointCloud decode status:", x.ok(), "error_msg:", x.error_msg()), !x.ok()) throw new Error("Failed to decode DRC file: " + x.error_msg());
          const f = r.num_points();
          if (console.log("[ThreeViewer] PointCloud decoded:", f, "points"), f === 0) throw new Error("Decoded point cloud is empty");
          const C = this.createMeshFromPointCloud(a, o, r, e);
          return r && a.destroy && a.destroy(r), i && a.destroy && a.destroy(i), o && a.destroy && a.destroy(o), C;
        }
        console.log("[ThreeViewer] Decoding as Mesh"), n = new a.Mesh();
        const u = o.DecodeBufferToMesh(i, n);
        if (console.log("[ThreeViewer] Decode status:", u.ok(), "error_msg:", u.error_msg()), !u.ok()) throw new Error("Failed to decode DRC file: " + u.error_msg());
        const d = n.num_faces(), m = n.num_points();
        if (console.log("[ThreeViewer] Mesh decoded: faces =", d, "points =", m), d === 0 && m === 0) throw new Error("Decoded mesh is empty");
        const p = this.createMeshFromDracoMesh(a, o, n, e);
        return n && a.destroy && a.destroy(n), i && a.destroy && a.destroy(i), o && a.destroy && a.destroy(o), p;
      } catch (s) {
        if (console.error(`[ThreeViewer] Failed to load DRC model: ${e}`, s), n && a && a.destroy) try {
          a.destroy(n);
        } catch {
        }
        if (r && a && a.destroy) try {
          a.destroy(r);
        } catch {
        }
        if (i && a && a.destroy) try {
          a.destroy(i);
        } catch {
        }
        if (o && a && a.destroy) try {
          a.destroy(o);
        } catch {
        }
        throw s;
      }
    },
    createMeshFromDracoMesh(e, t, o, i) {
      const n = o.num_faces(), r = o.num_points(), a = n * 3;
      if (console.log(`[ThreeViewer] DRC mesh: ${r} points, ${n} faces`), n === 0 && (console.log("[ThreeViewer] No faces - checking for Gaussian attributes..."), this.checkGaussianAttributes(e, t, o))) {
        console.log("[ThreeViewer] Gaussian attributes found, using Gaussian splat rendering");
        const w = t.GetAttributeId(o, e.POSITION), V = t.GetAttribute(o, w), S = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, V, S);
        const T = new Float32Array(r * 3);
        for (let F = 0; F < r * 3; F++) T[F] = S.GetValue(F);
        const v = new h.BufferGeometry();
        v.setAttribute("position", new h.BufferAttribute(T, 3)), this.extractGaussianAttributes(e, t, o, v, r), console.log("[ThreeViewer] Geometry attributes before creating material:", Object.keys(v.attributes)), console.log("[ThreeViewer] Total position count:", v.attributes.position.count), console.log("[ThreeViewer] Sample position values:", Array.from(v.attributes.position.array.slice(0, 15))), v.computeBoundingBox();
        const D = v.boundingBox;
        if (console.log("[ThreeViewer] Bounding box:", {
          min: [
            D.min.x,
            D.min.y,
            D.min.z
          ],
          max: [
            D.max.x,
            D.max.y,
            D.max.z
          ],
          center: [
            (D.min.x + D.max.x) / 2,
            (D.min.y + D.max.y) / 2,
            (D.min.z + D.max.z) / 2
          ]
        }), v.attributes.scale) {
          const F = v.attributes.scale.array;
          let P = 1 / 0, R = -1 / 0;
          for (let L = 0; L < F.length; L++)
            P = Math.min(P, F[L]), R = Math.max(R, F[L]);
          console.log("[ThreeViewer] Scale range:", P, "to", R);
        }
        const _ = this.createGaussianSplatMaterial(), b = new h.Points(v, _);
        b.name = i;
        const E = new h.Group();
        return E.add(b), E.userData.format = "drc", E.userData.filePath = i, E.userData.isGaussianSplat = !0, console.log(`[ThreeViewer] DRC Gaussian splat loaded successfully: ${i}`), E;
      }
      const s = t.GetAttributeId(o, e.POSITION), c = t.GetAttribute(o, s), l = new e.DracoFloat32Array();
      t.GetAttributeFloatForAllPoints(o, c, l);
      const g = new Float32Array(r * 3);
      for (let w = 0; w < r * 3; w++) g[w] = l.GetValue(w);
      const u = new Uint16Array(a), d = new e.DracoUInt16Array();
      if (t.GetTrianglesUInt16Array(o, d)) for (let w = 0; w < a; w++) u[w] = d.GetValue(w);
      else {
        const w = new e.DracoUInt32Array();
        t.GetTrianglesUInt32Array(o, w);
        const V = new Uint32Array(a);
        for (let S = 0; S < a; S++) V[S] = w.GetValue(S);
        for (let S = 0; S < a; S++) u[S] = V[S];
      }
      const m = new h.BufferGeometry();
      m.setAttribute("position", new h.BufferAttribute(g, 3)), m.setIndex(new h.BufferAttribute(u, 1));
      const p = t.GetAttributeId(o, e.NORMAL);
      if (p >= 0) {
        const w = t.GetAttribute(o, p), V = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, w, V);
        const S = new Float32Array(r * 3);
        for (let T = 0; T < r * 3; T++) S[T] = V.GetValue(T);
        m.setAttribute("normal", new h.BufferAttribute(S, 3));
      } else m.computeVertexNormals();
      const x = t.GetAttributeId(o, e.COLOR);
      let f = !1;
      if (x >= 0) {
        const w = t.GetAttribute(o, x), V = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, w, V);
        const S = new Float32Array(r * 3);
        for (let T = 0; T < r * 3; T++) S[T] = V.GetValue(T);
        m.setAttribute("color", new h.BufferAttribute(S, 3)), f = !0;
      }
      const C = new h.MeshStandardMaterial({
        color: f ? 16777215 : 8421504,
        vertexColors: f,
        side: h.DoubleSide
      }), M = new h.Mesh(m, C);
      M.name = i;
      const y = new h.Group();
      return y.add(M), y.userData.format = "drc", y.userData.filePath = i, console.log(`[ThreeViewer] DRC model loaded successfully: ${i}`), y;
    },
    createMeshFromPointCloud(e, t, o, i) {
      const n = o.num_points();
      console.log(`[ThreeViewer] DRC point cloud: ${n} points`);
      const r = t.GetAttributeId(o, e.POSITION), a = t.GetAttribute(o, r), s = new e.DracoFloat32Array();
      t.GetAttributeFloatForAllPoints(o, a, s);
      const c = new Float32Array(n * 3);
      for (let x = 0; x < n * 3; x++) c[x] = s.GetValue(x);
      const l = new h.BufferGeometry();
      l.setAttribute("position", new h.BufferAttribute(c, 3));
      const g = this.checkGaussianAttributes(e, t, o);
      if (console.log(`[ThreeViewer] Has Gaussian attributes: ${g}`), g) {
        this.extractGaussianAttributes(e, t, o, l, n);
        const x = this.createGaussianSplatMaterial(), f = new h.Points(l, x);
        f.name = i;
        const C = new h.Group();
        return C.add(f), C.userData.format = "drc", C.userData.filePath = i, C.userData.isGaussianSplat = !0, console.log(`[ThreeViewer] DRC Gaussian splat loaded successfully: ${i}`), C;
      }
      const u = t.GetAttributeId(o, e.COLOR);
      if (u >= 0) {
        const x = t.GetAttribute(o, u), f = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, x, f);
        const C = new Float32Array(n * 3);
        for (let M = 0; M < n * 3; M++) C[M] = f.GetValue(M);
        l.setAttribute("color", new h.BufferAttribute(C, 3));
      }
      const d = new h.PointsMaterial({
        color: 8421504,
        size: 0.05,
        vertexColors: u >= 0
      }), m = new h.Points(l, d);
      m.name = i;
      const p = new h.Group();
      return p.add(m), p.userData.format = "drc", p.userData.filePath = i, console.log(`[ThreeViewer] DRC point cloud loaded successfully: ${i}`), p;
    },
    checkGaussianAttributes(e, t, o) {
      const i = [
        "SCALE_3DGS",
        "ROTATION_3DGS",
        "OPACITY_3DGS",
        "FEATURE_DC_3DGS",
        "FEATURE_REST_3DGS"
      ];
      i.forEach((s) => {
        e[s] !== void 0 && console.log(`[ThreeViewer] module.${s} =`, e[s]);
      });
      const n = {}, r = [
        ...i,
        "POSITION",
        "COLOR",
        "NORMAL"
      ];
      for (const s of r) if (e[s] !== void 0) {
        const c = t.GetAttributeId(o, e[s]);
        c >= 0 && (n[s] = c, console.log(`[ThreeViewer] Found ${s} attribute, id=${c}`));
      }
      const a = n.SCALE_3DGS !== void 0 && n.ROTATION_3DGS !== void 0 && n.OPACITY_3DGS !== void 0 && n.FEATURE_DC_3DGS !== void 0;
      return console.log("[ThreeViewer] Found attributes:", Object.keys(n)), console.log(`[ThreeViewer] hasGaussian: ${a}`), e._foundAttributeTypes = n, a;
    },
    extractGaussianAttributes(e, t, o, i, n) {
      const r = e._foundAttributeTypes || {};
      if (console.log("[ThreeViewer] Extracting attributes using found types:", r), r.SCALE_3DGS !== void 0) {
        const a = t.GetAttribute(o, r.SCALE_3DGS), s = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, a, s);
        const c = new Float32Array(n * 3);
        for (let l = 0; l < n * 3; l++) c[l] = s.GetValue(l);
        i.setAttribute("scale", new h.BufferAttribute(c, 3)), console.log(`[ThreeViewer] Extracted SCALE_3DGS: ${n} points, sample values: [${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)}]`);
      }
      if (r.ROTATION_3DGS !== void 0) {
        const a = t.GetAttribute(o, r.ROTATION_3DGS), s = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, a, s);
        const c = new Float32Array(n * 4);
        for (let l = 0; l < n * 4; l++) c[l] = s.GetValue(l);
        i.setAttribute("rotation", new h.BufferAttribute(c, 4)), console.log(`[ThreeViewer] Extracted ROTATION_3DGS: ${n} points, sample values: [${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)}, ${c[3].toFixed(4)}]`);
      }
      if (r.OPACITY_3DGS !== void 0) {
        const a = t.GetAttribute(o, r.OPACITY_3DGS), s = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, a, s);
        const c = new Float32Array(n);
        for (let l = 0; l < n; l++) c[l] = s.GetValue(l);
        i.setAttribute("opacity", new h.BufferAttribute(c, 1)), console.log(`[ThreeViewer] Extracted OPACITY_3DGS: ${n} points, sample values: [${c[0].toFixed(4)}, ${c[1].toFixed(4)}]`);
      }
      if (r.FEATURE_DC_3DGS !== void 0) {
        const a = t.GetAttribute(o, r.FEATURE_DC_3DGS), s = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, a, s);
        const c = new Float32Array(n * 3);
        for (let l = 0; l < n * 3; l++) c[l] = s.GetValue(l);
        i.setAttribute("featureDc", new h.BufferAttribute(c, 3)), console.log(`[ThreeViewer] Extracted FEATURE_DC_3DGS: ${n} points`);
        for (let l = 0; l < Math.min(5, n); l++) {
          const g = l * 3, u = c[g], d = c[g + 1], m = c[g + 2], p = 0.5 + 0.282095 * u, x = 0.5 + 0.282095 * d, f = 0.5 + 0.282095 * m;
          console.log(`  Point ${l}: featureDc=[${u.toFixed(4)}, ${d.toFixed(4)}, ${m.toFixed(4)}] -> color=[${p.toFixed(4)}, ${x.toFixed(4)}, ${f.toFixed(4)}]`);
        }
      }
      if (r.FEATURE_REST_3DGS !== void 0) {
        const a = t.GetAttribute(o, r.FEATURE_REST_3DGS), s = new e.DracoFloat32Array();
        t.GetAttributeFloatForAllPoints(o, a, s);
        const c = new Float32Array(n * 45);
        for (let l = 0; l < n * 45; l++) c[l] = s.GetValue(l);
        i.setAttribute("featureRest", new h.BufferAttribute(c, 45)), console.log(`[ThreeViewer] Extracted FEATURE_REST_3DGS: ${n} points`);
      }
      console.log("[ThreeViewer] Final geometry attributes:", Object.keys(i.attributes));
    },
    createGaussianSplatMaterial() {
      const e = new h.ShaderMaterial({
        vertexShader: `
            attribute vec3 scale;
            attribute vec4 rotation;
            attribute float opacity;
            attribute vec3 featureDc;

            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                // 使用SH DC系数解码颜色
                vec3 shColor = vec3(0.5) + 0.282095 * featureDc;
                vColor = clamp(shColor, 0.0, 1.0);

                // Sigmoid透明度
                vAlpha = clamp(1.0 / (1.0 + exp(-opacity)), 0.0, 1.0);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                // 极小的点大小 - 调小5倍
                float s = max(abs(scale.x), max(abs(scale.y), abs(scale.z)));
                gl_PointSize = clamp(s * 40.0, 0.1, 1.0);

                // 深度相关调整
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize *= (100.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);

                if (dist > 0.5) {
                    discard;
                }

                // 锐利边缘
                float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

                gl_FragColor = vec4(vColor, vAlpha * alpha);
            }
        `,
        transparent: !0,
        depthWrite: !1,
        blending: h.NormalBlending,
        side: h.DoubleSide
      });
      return console.log("[ThreeViewer] Created Gaussian splat material (sub-pixel size)"), e;
    }
  }
};
window.__ENU_COMPENSATION_ENABLED__ = !0;
console.log("[DualCanvasViewer] ENU补偿状态:", window.__ENU_COMPENSATION_ENABLED__ ? "启用" : "禁用（默认）");
var Rn = {
  name: "DualCanvasViewer",
  components: {
    DualCanvasControlPanel: bo,
    CoordinateInfoPanel: Pn
  },
  extends: An,
  beforeCreate() {
    const e = h;
    let t = null;
    const o = () => {
      if (!t) {
        if (typeof window < "u" && window.__syncManager__)
          return console.log("[DualCanvasViewer] 使用已存在的全局 SyncManager 实例"), t = window.__syncManager__, t;
        console.log("[DualCanvasViewer] 创建插件内部 ViewerSyncManager 实例"), t = new Xt(), typeof window < "u" && (window.__syncManager__ = t);
      }
      return t;
    };
    this.syncManager = o(), this.syncManager && typeof this.syncManager.setUseNewArchitecture == "function" && (this.syncManager.setUseNewArchitecture(!0), console.log("[DualCanvasViewer] ✅ 已启用 SyncManager 新架构（操作路由器、统一投影模式）")), this.viewportManager = ot, this.precisionModelLoader = null;
    const i = () => (this.precisionModelLoader || (console.log("[DualCanvasViewer] 创建精确模型加载器实例"), this.precisionModelLoader = new rt(null, de)), this.precisionModelLoader);
    this.getPrecisionModelLoader = i, this.scene1 = null, this.camera1 = null, this.controls1 = null, this.renderer1 = null, this.modelGroup1 = null, this.gltfLoader1 = null, this.dracoLoader1 = null, this.containerElement1 = null, this.animationMixers1 = [], this.clock1 = new h.Clock(), this.raycaster1 = new h.Raycaster(), this.mouse1 = new h.Vector2(), this.selectedModel1 = null, this.transformControls1 = null, this.scene2 = null, this.camera2 = null, this.controls2 = null, this.renderer2 = null, this.modelGroup2 = null, this.gltfLoader2 = null, this.dracoLoader2 = null, this.containerElement2 = null, this.animationMixers2 = [], this.clock2 = new h.Clock(), this.raycaster2 = new h.Raycaster(), this.mouse2 = new h.Vector2(), this.selectedModel2 = null, this.transformControls2 = null, this.layersConfig = [{
      id: "three",
      index: 1,
      name: "原始模型",
      containerRef: "threeContainer",
      scene: () => this.scene1,
      camera: () => this.camera1,
      controls: () => this.controls1,
      transformControls: () => this.transformControls1,
      modelGroup: () => this.modelGroup1,
      selectedModel: () => this.selectedModel1,
      eventTarget: () => this.eventTarget1,
      mouse: () => this.mouse1,
      raycaster: () => this.raycaster1,
      setSelectedModel: (n) => {
        this.selectedModel1 = n;
      },
      getAnimationMixers: () => this.animationMixers1,
      getClock: () => this.clock1
    }, {
      id: "bim",
      index: 2,
      name: "BIM 模型",
      containerRef: "bimContainer",
      scene: () => this.scene2,
      camera: () => this.camera2,
      controls: () => this.controls2,
      transformControls: () => this.transformControls2,
      modelGroup: () => this.modelGroup2,
      selectedModel: () => this.selectedModel2,
      eventTarget: () => this.eventTarget2,
      mouse: () => this.mouse2,
      raycaster: () => this.raycaster2,
      setSelectedModel: (n) => {
        this.selectedModel2 = n;
      },
      getAnimationMixers: () => this.animationMixers2,
      getClock: () => this.clock2
    }], this.syncingCamera = !1, this.syncTimeout = null, this.isSyncingCamera = !1, this.syncDepth = 0, this.animationFrame1 = null, this.animationFrame2 = null, this.handleKeydown = null, this.sceneContainer1 = null, this.sceneContainer2 = null, this.anchorContainer1 = null, this.anchorContainer2 = null, this.groundPointPosition = null, this.sceneRotation = ae, this.sceneRotationIntegration = st, this.modelMercatorMetadata = null;
    try {
      typeof modelMercatorMetadataManager < "u" && (this.modelMercatorMetadata = modelMercatorMetadataManager);
    } catch {
      console.warn("[DualCanvasViewer] modelMercatorMetadataManager 导入不可用");
    }
    this.modelMercatorMetadata || (console.log("[DualCanvasViewer] 创建备用 ModelMercatorMetadataManager 实例"), this.modelMercatorMetadata = {
      metadataMap: /* @__PURE__ */ new Map(),
      enuOrigin: {
        mercator: null,
        cartographic: null
      },
      Cesium: null,
      setCesium(n) {
        this.Cesium = n;
      },
      getCesium() {
        return this.Cesium || window.Cesium;
      },
      setENUOrigin(n, r) {
        this.enuOrigin = {
          mercator: n,
          cartographic: r
        }, this.markAllDirty();
      },
      registerModel(n, r = {}) {
        if (!n) return null;
        let a = this.metadataMap.get(n.uuid);
        return a || (a = {
          model: n,
          uuid: n.uuid,
          name: n.name || `Model_${n.uuid.substring(0, 8)}`,
          enuPosition: r.enuPosition || new e.Vector3(),
          mercatorPosition: null,
          isDirty: !0
        }, this.metadataMap.set(n.uuid, a)), a;
      },
      registerModelGroup(n) {
        let r = 0;
        return n && n.traverse((a) => {
          if (a.isMesh || a.isGroup) {
            const s = new e.Vector3();
            a.getWorldPosition(s), this.registerModel(a, { enuPosition: s }), r++;
          }
        }), r;
      },
      calculateMercatorFromENU(n) {
        return this.enuOrigin.mercator ? {
          x: this.enuOrigin.mercator.x + n.x,
          y: this.enuOrigin.mercator.y - n.y,
          z: this.enuOrigin.mercator.z + n.z
        } : null;
      },
      updateModelMercatorCoords(n) {
        const r = this.metadataMap.get(n);
        if (!r || !r.isDirty) return !0;
        const a = this.calculateMercatorFromENU(r.enuPosition);
        return a ? (r.mercatorPosition = a, r.isDirty = !1, !0) : !1;
      },
      updateAllMercatorCoords() {
        let n = 0;
        for (const [r, a] of this.metadataMap.entries()) a.isDirty && this.updateModelMercatorCoords(r) && n++;
        return n;
      },
      markAllDirty() {
        for (const n of this.metadataMap.values()) n.isDirty = !0;
      },
      getModelMetadata(n) {
        return n ? this.metadataMap.get(n.uuid) : null;
      },
      getModelMercatorCoords(n) {
        return this.getModelMetadata(n)?.mercatorPosition || null;
      },
      getStats() {
        return {
          总模型数: this.metadataMap.size,
          已计算墨卡托坐标: Array.from(this.metadataMap.values()).filter((n) => n.mercatorPosition).length,
          需要重新计算: Array.from(this.metadataMap.values()).filter((n) => n.isDirty).length,
          ENU原点已设置: !!this.enuOrigin.mercator
        };
      },
      verifyModelPositions() {
        console.group("[ModelMercatorMetadataManager] 验证模型位置一致性");
        let n = 0, r = 0;
        for (const [a, s] of this.metadataMap.entries()) {
          if (!s.mercatorPosition) {
            console.log(`  ⏭️  ${s.name}: 无墨卡托坐标`), r++;
            continue;
          }
          const c = this.calculateMercatorFromENU(s.enuPosition), l = {
            x: Math.abs(c.x - s.mercatorPosition.x),
            y: Math.abs(c.y - s.mercatorPosition.y),
            z: Math.abs(c.z - s.mercatorPosition.z)
          };
          Math.max(l.x, l.y, l.z) < 0.01 ? (console.log(`  ✅ ${s.name}: 有效`), n++) : (console.log(`  ⚠️  ${s.name}: 可能无效`), r++);
        }
        return console.log(`验证结果: ${n} 有效, ${r} 可能无效`), console.groupEnd(), {
          validCount: n,
          invalidCount: r
        };
      },
      printDebugInfo() {
        if (console.group("[ModelMercatorMetadataManager] 模型元数据调试信息"), console.log("统计:", this.getStats()), this.metadataMap.size > 0) {
          console.log("模型列表:");
          for (const n of this.metadataMap.values())
            console.log(`  - ${n.name}`), console.log(`    ENU 位置: (${n.enuPosition.x.toFixed(2)}, ${n.enuPosition.y.toFixed(2)}, ${n.enuPosition.z.toFixed(2)})`), n.mercatorPosition ? console.log(`    墨卡托: (${n.mercatorPosition.x.toFixed(2)}, ${n.mercatorPosition.y.toFixed(2)}, ${n.mercatorPosition.z.toFixed(2)})`) : console.log("    墨卡托: 未计算");
        }
        console.groupEnd();
      },
      clear() {
        const n = this.metadataMap.size;
        this.metadataMap.clear(), console.log("[ModelMercatorMetadataManager] 已清空所有元数据:", n, "条");
      }
    }), this.sceneRotationInitialized = !1, this.sceneRotationEnabled = !1, typeof window < "u" && (window.__sceneRotationManager__ = ae, window.__sceneRotationIntegration__ = st, window.__modelMercatorMetadataManager__ = this.modelMercatorMetadata, window.__dualCanvasViewerSceneRotation__ = {
      enabled: !1,
      initialized: !1,
      getEnabled: () => this.sceneRotationEnabled,
      setEnabled: (n) => {
        this.sceneRotationEnabled = n;
      },
      getInitialized: () => this.sceneRotationInitialized
    });
  },
  data() {
    return {
      viewportManager: null,
      activeLayer: "both",
      showThreeLayer: !0,
      showBimLayer: !0,
      bimOpacity: 50,
      cameraSyncEnabled: !0,
      showGridHelper: !0,
      threeObjectCount: 0,
      bimObjectCount: 0,
      transformMode: "translate",
      interactionLayer: "three",
      eventLayerListenerAdded: !1,
      pointerDown: !1,
      pointerDownButton: -1,
      lastPointerPos: {
        x: 0,
        y: 0
      },
      pointerDownStartTime: 0,
      lastPointerDownEvent: null,
      showCoordinateDetails: !1,
      showGeoCoords: !1,
      mouseCoords: {
        screen: {
          x: 0,
          y: 0
        },
        screenCenter: {
          x: 0,
          y: 0
        },
        viewport: {
          x: 0,
          y: 0
        },
        ndc: {
          x: 0,
          y: 0
        },
        world1: {
          x: 0,
          y: 0,
          z: 0
        },
        world2: {
          x: 0,
          y: 0,
          z: 0
        },
        worldXeokit: {
          x: 0,
          y: 0,
          z: 0
        },
        mercator1: {
          x: 0,
          y: 0,
          z: 0
        },
        mercator2: {
          x: 0,
          y: 0,
          z: 0
        },
        geo: {
          longitude: 0,
          latitude: 0,
          altitude: 0
        },
        enu1: {
          east: null,
          north: null,
          up: null
        },
        enuOrigin: {
          longitude: null,
          latitude: null,
          height: null
        },
        mercator: {
          x: 0,
          y: 0,
          z: 0,
          floorCenter: {
            x: 0,
            y: 0,
            z: 0
          }
        }
      },
      viewportStatus: {
        width: 0,
        height: 0,
        left: 0,
        top: 0
      },
      usingUnifiedViewport: !1,
      usingENU: !1,
      xeokitViewers: [],
      xktBoundingBoxHelpers: [],
      hasLargeCoordModelSelected: !1,
      isInRealWorldMode: !1,
      restrictSmallCoordMode: !1,
      largeCoordModelCenter: null,
      referenceModelPosition: null,
      selectedXeokitEntity: null,
      selectedXeokitViewer: null,
      xeokitHighlightEffect: null,
      isDraggingXeokit: !1,
      xeokitDragStartPos: null,
      xeokitDragStartMouse: null,
      loadedModelsList: [],
      xktTransformInfo: null,
      isInRealWorldCoordinates: !1,
      modelLayoutSnapshot: null,
      debugMode: !1,
      heightAlignmentManager: null,
      alignmentMode: "terrain"
    };
  },
  mounted() {
    console.log("[DualCanvasViewer] 已挂载"), console.log("[DualCanvasViewer] threeContainer ref:", this.$refs.threeContainer), console.log("[DualCanvasViewer] bimContainer ref:", this.$refs.bimContainer), this.heightAlignmentManager = new Kt(), console.log("[DualCanvasViewer] ✅ HeightAlignmentManager 已初始化"), window.__dualCanvasViewerInstances || (window.__dualCanvasViewerInstances = []), window.__dualCanvasViewerInstances.push(this), window.__dualCanvasViewer = this, console.log("[DualCanvasViewer] Registered to global debug system. Total instances:", window.__dualCanvasViewerInstances.length), window.exitRealWorldMode = () => {
      this.exitRealWorldMode();
    }, window.saveModelLayoutSnapshot = () => {
      this.saveModelLayoutSnapshot();
    }, window.restoreModelLayoutFromSnapshot = () => {
      this.restoreModelLayoutFromSnapshot();
    }, window.enableDebugLog = () => {
      this.debugMode = !0, console.log("✅ [DualCanvasViewer] 调试模式已启用 - 详细日志将输出");
    }, window.disableDebugLog = () => {
      this.debugMode = !1, console.log("❌ [DualCanvasViewer] 调试模式已禁用 - 仅输出关键日志");
    }, console.log("[DualCanvasViewer] 已注册全局函数:"), console.log("  - window.exitRealWorldMode()      退出真实世界模式"), console.log("  - window.saveModelLayoutSnapshot()    保存模型布局快照"), console.log("  - window.restoreModelLayoutFromSnapshot() 从快照恢复模型布局"), console.log("  - window.enableDebugLog()         启用调试日志（详细输出）"), console.log("  - window.disableDebugLog()        禁用调试日志（仅关键日志）"), this.syncManager && (window.__syncManager__ = this.syncManager, console.log("[DualCanvasViewer] SyncManager 已注册到全局，可通过 window.__syncManager__ 访问")), window.__dualCanvasViewerReady__ = !0, console.log("[DualCanvasViewer] 已设置全局初始化完成标志 window.__dualCanvasViewerReady__ = true");
    const e = this.$refs.eventContainer || this.threeContainer;
    e && (this.mouseCoords.screenCenter.x = e.clientWidth / 2, this.mouseCoords.screenCenter.y = e.clientHeight / 2, console.log("[DualCanvasViewer] 屏幕中心坐标已初始化:", {
      X: this.mouseCoords.screenCenter.x.toFixed(0) + " px",
      Y: this.mouseCoords.screenCenter.y.toFixed(0) + " px"
    }), this._updateScreenCenterHandler = () => {
      this.mouseCoords.screenCenter.x = e.clientWidth / 2, this.mouseCoords.screenCenter.y = e.clientHeight / 2;
    }, window.addEventListener("resize", this._updateScreenCenterHandler)), document.dispatchEvent(new CustomEvent("DualCanvasViewerMounted", { detail: {
      viewer: this,
      syncManager: this.syncManager
    } })), console.log("[DualCanvasViewer] 已触发 DualCanvasViewerMounted 事件"), this.$nextTick(() => {
      const t = this.$refs.controlPanel, o = this.$refs.coordinatePanel;
      console.log("[DualCanvasViewer] 子组件状态检查:"), console.log("  - DualCanvasControlPanel:", t ? "✓ 已加载" : "✗ 未加载"), console.log("  - CoordinateInfoPanel:", o ? "✓ 已加载" : "✗ 未加载");
    }), console.log("[DualCanvasViewer] 初始化统一视口管理器..."), this.viewportManager = ot, this.initThreeLayer(), this.initBimLayer(), setTimeout(() => {
      if (console.log("[DualCanvasViewer] 准备初始化交互..."), console.log("[DualCanvasViewer] threeContainer ref after timeout:", this.$refs.threeContainer), console.log("[DualCanvasViewer] bimContainer ref after timeout:", this.$refs.bimContainer), this.$refs.threeContainer) {
        const t = this.$refs.threeContainer.getBoundingClientRect();
        console.log("[DualCanvasViewer] threeContainer 尺寸:", t.width, "x", t.height);
      }
      if (this.$refs.bimContainer) {
        const t = this.$refs.bimContainer.getBoundingClientRect();
        console.log("[DualCanvasViewer] bimContainer 尺寸:", t.width, "x", t.height);
      }
      this.initModelInteraction1(), this.initModelInteraction2(), this.applyControlsRestrictions(), this.updateBimOpacity(), this.registerLayersToViewport();
    }, 200), this.setupCameraSync(), this.initPrecisionModelLoader(), this.setupKeyboardShortcuts(), this.updatePointerEvents(), this.loadDefaultModels(), window.addEventListener("resize", this.handleWindowResize), this.setupCoordinateTracking(), this.$nextTick(() => {
      this._createSceneContainers(), this._initializeSceneRotationSystem();
    });
  },
  beforeUnmount() {
    if (window.__dualCanvasViewerInstances) {
      const e = window.__dualCanvasViewerInstances.indexOf(this);
      e > -1 && (window.__dualCanvasViewerInstances.splice(e, 1), console.log("[DualCanvasViewer] Removed from global debug system. Remaining instances:", window.__dualCanvasViewerInstances.length)), window.__dualCanvasViewer === this && delete window.__dualCanvasViewer;
    }
    this.cleanup(), this.removeKeyboardShortcuts(), window.removeEventListener("resize", this.handleWindowResize), window.removeEventListener("resize", this._updateScreenCenterHandler), this.removeCoordinateTracking(), this.sceneRotationIntegration && this.sceneRotationIntegration.dispose(), this.sceneContainer1 && (this.scene1.remove(this.sceneContainer1), this.sceneContainer1 = null), this.sceneContainer2 && (this.scene2.remove(this.sceneContainer2), this.sceneContainer2 = null), this.anchorContainer1 && (this.scene1.remove(this.anchorContainer1), this.anchorContainer1 = null), this.anchorContainer2 && (this.scene2.remove(this.anchorContainer2), this.anchorContainer2 = null), console.log("[DualCanvasViewer] 场景旋转系统已清理");
  },
  methods: {
    calculateAnchorContainerY() {
      if (!(this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() ?? this.mercatorProjectionManager?.isUsingLocalCoordinateSystem?.() ?? !1)) {
        if (this.heightAlignmentManager && window.__heightAlignmentManager__) {
          const r = this.heightAlignmentManager.calculateAnchorContainerHeight();
          return console.log("[DualCanvasViewer] 🎯 使用HeightAlignmentManager计算对齐高度（非局部坐标系）:", r.toFixed(2) + "米"), r;
        }
        return 0;
      }
      let e = 0;
      const t = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
      t?.actualTerrainHeight !== void 0 && t.actualTerrainHeight !== 0 ? (e = t.actualTerrainHeight, console.log("[DualCanvasViewer] 🌍 使用实际采样的地形高度:", e.toFixed(2) + "米")) : t?.dualFloorHeight !== void 0 && t.dualFloorHeight !== 0 ? (e = t.dualFloorHeight, console.log("[DualCanvasViewer] 📊 使用 dualFloorHeight 作为地形高度:", e.toFixed(2) + "米")) : console.warn("[DualCanvasViewer] ⚠️ 地形高度未采样，使用默认值 0（椭球体表面）");
      let o = 0;
      this.heightAlignmentManager ? o = this.heightAlignmentManager.obliqueOffset || 0 : window.__heightAlignmentManager__ && (o = window.__heightAlignmentManager__.obliqueOffset || 0);
      let i = 0;
      t?.modelAbsoluteAltitude !== void 0 && t.modelAbsoluteAltitude !== 0 ? (i = t.modelAbsoluteAltitude, console.log("[DualCanvasViewer] 🏔️ 使用模型海拔高度:", i.toFixed(2) + "米")) : t?.modelAbsoluteMercator?.z !== void 0 && t.modelAbsoluteMercator.z !== 0 ? (i = t.modelAbsoluteMercator.z, console.log("[DualCanvasViewer] 🏔️ 使用 modelAbsoluteMercator.z 作为模型海拔:", i.toFixed(2) + "米")) : console.warn("[DualCanvasViewer] ⚠️ 模型海拔未获取，使用默认值 0");
      const n = -i + e + o;
      return console.log("[DualCanvasViewer] 🔄 改进的高度对齐计算（参考真实世界模式）:", {
        坐标模式: "局部坐标系",
        "--- 海拔/地形信息 ---": "---",
        模型海拔: i.toFixed(2) + "米",
        实际地形高度: e.toFixed(2) + "米",
        海拔与地形差: (i - e).toFixed(2) + "米",
        用户偏移: o.toFixed(2) + "米",
        "--- 计算结果 ---": "---",
        anchorContainerY: n.toFixed(2) + "米",
        计算公式: `anchorY = -${i.toFixed(2)} + ${e.toFixed(2)} + ${o.toFixed(2)}`,
        "--- 对齐效果 ---": "---",
        红球位置: "anchorContainer (0, 0, 0) → Y = " + n.toFixed(2) + "米",
        说明: `红球对齐到：海拔${i.toFixed(2)}米 = 地形${e.toFixed(2)}米 + 偏移${(i - e).toFixed(2)}米`
      }), n;
    },
    updateAnchorContainerPosition() {
      if (!this.anchorContainer1) {
        console.warn("[DualCanvasViewer] ⚠️ anchorContainer1 不存在，跳过更新");
        return;
      }
      const e = this.calculateAnchorContainerY();
      this.anchorContainer1.position.set(0, e, 0), this.anchorContainer1.updateMatrixWorld(), this.anchorContainer2 && (this.anchorContainer2.position.set(0, e, 0), this.anchorContainer2.updateMatrixWorld());
      const t = this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() ?? this.mercatorProjectionManager?.isUsingLocalCoordinateSystem?.() ?? !1;
      if (t && this.modelGroup1) {
        const o = this.sceneContainer1;
        if (o && (Math.abs(o.rotation.x) > 0.01 || Math.abs(o.rotation.y) > 0.01 || Math.abs(o.rotation.z) > 0.01)) {
          console.log("[DualCanvasViewer] 🔍 检测到场景容器有旋转，应用倒置修复（参考 fixModel 逻辑）");
          const i = new h.Quaternion();
          i.setFromEuler(new h.Euler(o.rotation.x, o.rotation.y, o.rotation.z, "XYZ")), this.modelGroup1.children.forEach((n) => {
            if (!n.userData?.isLargeCoordModel) {
              const r = n.userData?.fileName || n.name || "", a = i.clone().invert();
              n.quaternion.multiply(a), n.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ 已应用场景容器反向旋转到模型:", {
                模型: r,
                场景容器旋转: `x=${(o.rotation.x * 180 / Math.PI).toFixed(1)}°, y=${(o.rotation.y * 180 / Math.PI).toFixed(1)}°, z=${(o.rotation.z * 180 / Math.PI).toFixed(1)}°`
              });
            }
          });
        }
      }
      if (console.log("[DualCanvasViewer] ✅ anchorContainer 位置已更新（含倒置修复）:", {
        anchorContainer1: `Y = ${this.anchorContainer1.position.y.toFixed(2)} 米`,
        anchorContainer2: this.anchorContainer2 ? `Y = ${this.anchorContainer2.position.y.toFixed(2)} 米` : "不存在"
      }), this.modelGroup1 || this.modelGroup2) {
        let o = 0;
        if (t) o = this.syncManager?.mercatorProjection?.getDualFloorHeight?.() ?? this.mercatorProjectionManager?.getDualFloorHeight?.() ?? 0;
        else {
          const i = this.syncManager?.mercatorProjection?.modelAbsoluteMercator?.z ?? this.mercatorProjectionManager?.modelAbsoluteMercator?.z ?? 0;
          o = (this.mercatorProjectionManager?.floorCenterMercator?.z ?? 0) - i;
        }
        if (console.log("[DualCanvasViewer] 🔄 调整 modelGroup 位置（地板高度偏移）:", {
          地板高度偏移: o.toFixed(2) + "米",
          说明: "modelGroup1 和 modelGroup2 将在 Y 方向上移动此偏移量"
        }), this.modelGroup1) {
          const i = this.modelGroup1.position.y;
          this.modelGroup1.position.y = o, this.modelGroup1.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ modelGroup1 位置已更新:", {
            旧Y: i.toFixed(2) + "米",
            新Y: this.modelGroup1.position.y.toFixed(2) + "米",
            变化: (this.modelGroup1.position.y - i).toFixed(2) + "米"
          });
        }
        if (this.modelGroup2) {
          const i = this.modelGroup2.position.y;
          this.modelGroup2.position.y = o, this.modelGroup2.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ modelGroup2 位置已更新:", {
            旧Y: i.toFixed(2) + "米",
            新Y: this.modelGroup2.position.y.toFixed(2) + "米",
            变化: (this.modelGroup2.position.y - i).toFixed(2) + "米"
          });
        }
      }
    },
    projectLargeCoordinate(e, t) {
      if (!(Math.abs(e.x) > 1e4 || Math.abs(e.y) > 1e4 || Math.abs(e.z) > 1e4)) return e.clone().project(t);
      const o = t.position.clone(), i = e.clone().sub(o), n = t.position.clone();
      t.position.set(0, 0, 0), t.updateMatrixWorld();
      const r = i.clone().project(t);
      return t.position.copy(n), t.updateMatrixWorld(), r;
    },
    async flyCesiumToModelLocation(e) {
      const t = this.syncManager?.getCesium(), o = window.__cesiumViewer__;
      if (!t || !o) {
        console.log("[DualCanvasViewer] ⚠️ Cesium 不可用，跳过相机定位");
        return;
      }
      const i = e.userData.originalLocation;
      if (!i || !i.cartographic) {
        console.log("[DualCanvasViewer] ⚠️ 模型缺少地理位置信息，跳过 Cesium 相机定位");
        return;
      }
      if (this._hasFlownCesiumToModel) {
        console.log("[DualCanvasViewer] ⚠️ 已执行过 Cesium 相机定位，跳过重复调用");
        return;
      }
      const n = i.cartographic, r = n.longitude * 180 / Math.PI, a = n.latitude * 180 / Math.PI, s = n.height || 0;
      console.log("[DualCanvasViewer] 🚀 检测到大坐标模型，定位 Cesium 相机到模型位置:", {
        模型: e.userData.fileName || e.name,
        经度: r.toFixed(6) + "°",
        纬度: a.toFixed(6) + "°",
        高度: s.toFixed(2) + "米"
      });
      const c = new h.Box3().setFromObject(e), l = new h.Vector3();
      c.getSize(l);
      const g = Math.max(l.x, l.y, l.z), u = Math.max(500, g * 5);
      try {
        o.camera.setView({
          destination: t.Cartesian3.fromDegrees(r, a, s + u),
          orientation: {
            heading: 0,
            pitch: -t.Math.PI_OVER_FOUR,
            roll: 0
          }
        }), o.scene.requestRender(), console.log("[DualCanvasViewer] ✅ Cesium 相机已定位到大坐标模型位置:", {
          相机高度: (s + u).toFixed(2) + "米",
          模型最大尺寸: g.toFixed(2) + "米"
        }), this._hasFlownCesiumToModel = !0, console.log("[DualCanvasViewer] 🎯 初始化ENU坐标系，使模型平行于Cesium地面"), this.initENUCoordinateSystem(r, a, s, u).then((m) => {
          m ? (console.log("[DualCanvasViewer] ✅ ENU坐标系初始化成功，等待所有模型加载完成后重新定位"), this.waitForAllModelsAndRepositionENU()) : console.warn("[DualCanvasViewer] ⚠️ ENU坐标系初始化失败，继续使用墨卡托投影");
        });
        const d = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
        if (d && i.cartographic) {
          const p = n.longitude, x = n.latitude, f = await this._getTerrainHeightAtPosition(r, a, window.Cesium, window.viewer);
          console.log("[DualCanvasViewer] ⭐ 地形高度采样结果:", {
            位置: `(${r.toFixed(6)}°, ${a.toFixed(6)}°)`,
            模型高度: s.toFixed(2) + "米",
            实际地形高度: f.toFixed(2) + "米",
            高度差: (f - s).toFixed(2) + "米",
            说明: f !== s ? "将使用实际地形高度作为Dual地板高度" : "模型高度与地形高度一致"
          }), d.setDualFloorHeightToTerrain(f);
          const C = p * 6378137, M = Math.log(Math.tan(Math.PI / 4 + x / 2)) * 6378137, y = {
            x: C,
            y: M,
            z: f
          };
          d.setFloorCenter(y, s), console.log("[DualCanvasViewer] ✅ 地板中心已设置（模型海拔）:", {
            经纬度: `(${r.toFixed(6)}°, ${a.toFixed(6)}°)`,
            墨卡托坐标: `(${C.toFixed(2)}, ${M.toFixed(2)})`,
            模型海拔: s.toFixed(2) + "米",
            地形高度: f.toFixed(2) + "米",
            说明: "modelAbsoluteAltitude 保存模型海拔，dualFloorHeight 保存地形高度"
          }), console.log("[DualCanvasViewer] 📌 Three.js 相机将由 focusOnModels 统一定位");
        }
      } catch (d) {
        console.error("[DualCanvasViewer] Cesium 相机定位失败:", d);
      }
    },
    async waitForAllModelsAndRepositionENU() {
      const i = Date.now();
      console.log("[DualCanvasViewer] ⏳ 开始等待大坐标模型加载完成...");
      let n = 0, r = null;
      const a = setInterval(() => {
        const s = this.modelGroup1?.children || [], c = s.length;
        if (c === 0) {
          console.log("[DualCanvasViewer] ⚠️ 场景中没有模型，继续等待..."), n = 0, r = null;
          return;
        }
        let l = 0, g = 0;
        for (const d of s) d.userData.originalLocation && (g++, d.userData.originalLocation.cartographic && l++);
        const u = Date.now() - i;
        if (console.log("[DualCanvasViewer] 📊 模型加载进度:", {
          总模型数: c,
          大坐标模型: g,
          有地理位置: l,
          等待时间: (u / 1e3).toFixed(2) + "秒"
        }), c === n) {
          if (r === null) r = Date.now();
          else if (Date.now() - r >= 2e3) {
            clearInterval(a), l > 0 ? console.log("[DualCanvasViewer] ✅ 模型数量稳定，有" + l + "个大坐标模型，开始ENU坐标转换") : console.log("[DualCanvasViewer] ⚠️ 没有检测到大坐标模型，跳过ENU坐标转换"), this.repositionModelsWithENU();
            return;
          }
        } else
          n = c, r = null;
        if (u > 1e4) {
          clearInterval(a), l > 0 ? console.warn("[DualCanvasViewer] ⚠️ 等待超时，但有" + l + "个大坐标模型，继续ENU转换") : console.warn("[DualCanvasViewer] ⚠️ 等待超时，没有大坐标模型，跳过ENU转换"), this.repositionModelsWithENU();
          return;
        }
      }, 500);
    },
    async repositionModelsWithENU() {
      console.log("[DualCanvasViewer] 🔄 使用ENU坐标重新定位模型...");
      const e = this.viewportManager?.getENUManager();
      if (!e || !e.isInitialized()) {
        console.warn("[DualCanvasViewer] ENU管理器未初始化，无法重新定位模型");
        return;
      }
      const t = e.getOriginInfo();
      console.log("[DualCanvasViewer] ENU原点信息:", t);
      const o = e.basis.up, i = e.basis.north, n = e.basis.east;
      console.log("[DualCanvasViewer] ENU基向量（ECEF坐标系）:", {
        East: `(${n.x.toFixed(4)}, ${n.y.toFixed(4)}, ${n.z.toFixed(4)})`,
        North: `(${i.x.toFixed(4)}, ${i.y.toFixed(4)}, ${i.z.toFixed(4)})`,
        Up: `(${o.x.toFixed(4)}, ${o.y.toFixed(4)}, ${o.z.toFixed(4)})`
      });
      const r = n.dot(i), a = n.dot(o), s = i.dot(o), c = n.length(), l = i.length(), g = o.length(), u = new h.Vector3().crossVectors(n, i).dot(o);
      console.log("[DualCanvasViewer] 🔍 ENU基向量验证:", {
        "East·North": r.toFixed(6),
        "East·Up": a.toFixed(6),
        "North·Up": s.toFixed(6),
        East长度: c.toFixed(6),
        North长度: l.toFixed(6),
        Up长度: g.toFixed(6),
        "(East×North)·Up": u.toFixed(6),
        右手系: Math.abs(u - 1) < 0.01 ? "✅ 是" : "❌ 否",
        正交: Math.abs(r) < 0.01 && Math.abs(a) < 0.01 && Math.abs(s) < 0.01 ? "✅ 是" : "❌ 否"
      });
      const d = this.modelGroup1?.children || [];
      if (console.log("[DualCanvasViewer] 需要重新定位的模型数量:", d.length), d.length === 0) {
        console.warn("[DualCanvasViewer] 没有模型需要重新定位");
        return;
      }
      const m = d[0].position.clone();
      console.log("[DualCanvasViewer] 参考模型墨卡托位置:", m);
      let p = 0, x = 0;
      const f = /* @__PURE__ */ new Map();
      for (const F of d) f.set(F.uuid, F.position.clone());
      let C = null;
      for (const F of d) {
        const P = F.name || F.userData.fileName || "未知", R = F.userData.originalLocation;
        if (R && R.cartographic) {
          const L = R.cartographic;
          console.log("[DualCanvasViewer] 📍 大坐标模型地理位置:", {
            模型: P,
            经度: Cesium.Math.toDegrees(L.longitude).toFixed(6) + "°",
            纬度: Cesium.Math.toDegrees(L.latitude).toFixed(6) + "°",
            高度: L.height.toFixed(2) + "米"
          });
          const A = Cesium.Cartesian3.fromRadians(L.longitude, L.latitude, L.height), U = new h.Vector3(A.x, A.y, A.z), H = e.ecefToThreeJS(U);
          console.log("[DualCanvasViewer] 🔄 大坐标模型坐标转换:", {
            模型: P,
            ECEF: `(${U.x.toFixed(2)}, ${U.y.toFixed(2)}, ${U.z.toFixed(2)})`,
            ENU: `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`
          }), C = H.clone(), F.position.copy(H);
          const ee = F.userData._enuCompensationApplied === !0;
          if (F.userData.enuCompensation && F.userData.enuCompensation.compensationMatrix && !ee) {
            const B = F.userData.enuCompensation.compensationMatrix, k = B.ecefToENU, Q = B.useOnlyHorizontal === !0;
            if (k && Array.isArray(k) && k.length === 3) {
              console.log("[DualCanvasViewer] 🌍 应用 ENU 旋转补偿:", {
                模型: P,
                水平面补偿: Q ? "是（只补偿贴地旋转方向）" : "否（全方向补偿）",
                说明: Q ? "只使用 East 和 North 向量进行水平面旋转，UP 方向保持不变" : "应用完整 ECEF→ENU 变换矩阵"
              });
              const X = new h.Matrix4();
              if (Q) {
                const j = k[0], G = k[1], W = k[2];
                new h.Vector3(j[0], j[1], j[2]).normalize(), new h.Vector3(G[0], G[1], G[2]).normalize(), new h.Vector3(W[0], W[1], W[2]).normalize();
                const K = new h.Vector3(j[0], j[1], 0).normalize(), $ = Math.atan2(K.y, K.x), N = Math.cos($), Y = Math.sin($);
                X.set(N, 0, Y, 0, 0, 1, 0, 0, -Y, 0, N, 0, 0, 0, 0, 1), console.log("[DualCanvasViewer] 📐 ENU水平面补偿:", {
                  ENU_East向量: `(${j[0].toFixed(4)}, ${j[1].toFixed(4)}, ${j[2].toFixed(4)})`,
                  ENU_North向量: `(${G[0].toFixed(4)}, ${G[1].toFixed(4)}, ${G[2].toFixed(4)})`,
                  水平旋转角度: ($ * 180 / Math.PI).toFixed(2) + "°"
                });
              } else X.set(k[0][0], k[0][1], k[0][2], 0, k[1][0], k[1][1], k[1][2], 0, k[2][0], k[2][1], k[2][2], 0, 0, 0, 0, 1);
              typeof window < "u" && window.__ENU_COMPENSATION_ENABLED__ ? (F.quaternion.setFromRotationMatrix(X), F.userData._enuCompensationApplied = !0, F.updateMatrixWorld(), console.log("[DualCanvasViewer] ✅ ENU 补偿已应用")) : (console.log("[DualCanvasViewer] ⚠️ ENU 补偿已禁用（测试模式）"), console.log("[DualCanvasViewer] 💡 启用方法: window.__ENU_COMPENSATION_ENABLED__ = true"));
            }
          } else F.userData.enuCompensation && F.userData.enuCompensation.compensationMatrix ? console.log("[DualCanvasViewer] ⏭️ 模型ENU补偿已在加载时应用，跳过重复应用:", { 模型: P }) : console.warn("[DualCanvasViewer] ⚠️ 模型缺少 ENU 旋转补偿信息:", {
            模型: P,
            原因: F.userData.enuCompensation ? "有 enuCompensation 但缺少 compensationMatrix" : "没有 enuCompensation",
            建议: "请使用最新版本的 convert-b3dm-batch.js 转换 GLB 文件"
          });
          if (F.userData._zupYupConversionDone) console.log("[DualCanvasViewer] ⏭️ 模型 Z-up/Y-up 转换已在加载时完成，跳过重复旋转:", { 模型: P });
          else if (console.log("[DualCanvasViewer] 🔧 开始 Z-up/Y-up 转换（ENU坐标系重新定位）:", {
            模型: P,
            说明: "模型加载时未进行 Z-up/Y-up 转换，现在执行"
          }), P.includes("ECEF_to_ThreeJS"))
            console.log("[DualCanvasViewer] ⏭️ 检测到取反轴版本模型，跳过 Z-up/Y-up 旋转检测:", {
              模型: P,
              说明: "模型在转换时已处理为 Y-up 贴地坐标"
            }), (!F.userData.enuCompensation || !F.userData.enuCompensation.compensationMatrix) && F.quaternion.set(0, 0, 0, 1), F.updateMatrixWorld();
          else {
            let B = new h.Box3().setFromObject(F);
            const k = new h.Vector3();
            B.getSize(k);
            const Q = k.z > k.y && k.z > k.x;
            if (console.log("[DualCanvasViewer] 🔍 模型坐标系检测:", {
              模型: P,
              边界框尺寸: `X=${k.x.toFixed(2)}m, Y=${k.y.toFixed(2)}m, Z=${k.z.toFixed(2)}m`,
              最大尺寸: Math.max(k.x, k.y, k.z).toFixed(2) + "m",
              坐标系类型: Q ? "Z-up（需要旋转）" : "Y-up（标准）"
            }), Q) {
              const X = new h.Matrix4();
              X.makeRotationX(-Math.PI / 2);
              const j = new h.Quaternion();
              if (j.setFromRotationMatrix(X), F.userData.enuCompensation && F.userData.enuCompensation.compensationMatrix) {
                const Y = F.quaternion.clone();
                F.quaternion.multiplyQuaternions(j, Y), console.log("[DualCanvasViewer] 🔄 组合旋转: ENU补偿 × Z-up→Y-up");
              } else F.quaternion.copy(j);
              F.updateMatrixWorld();
              const G = new h.Box3().setFromObject(F), W = new h.Vector3();
              G.getSize(W);
              const K = new h.Vector3(0, 1, 0).applyQuaternion(F.quaternion), $ = K.dot(new h.Vector3(0, 1, 0)), N = Math.acos(Math.max(-1, Math.min(1, $))) * 180 / Math.PI;
              console.log("[DualCanvasViewer] ✅ Z-up 模型已旋转到 Y-up:", {
                模型: P,
                旋转方式: "绕X轴-90°",
                新边界框: `X=${W.x.toFixed(2)}m, Y=${W.y.toFixed(2)}m, Z=${W.z.toFixed(2)}m`,
                新高度: W.y.toFixed(2) + "m",
                模型Up向量: `(${K.x.toFixed(4)}, ${K.y.toFixed(4)}, ${K.z.toFixed(4)})`,
                与Y轴对齐度: $.toFixed(4),
                偏离角度: N.toFixed(2) + "°"
              });
            } else
              (!F.userData.enuCompensation || !F.userData.enuCompensation.compensationMatrix) && F.quaternion.set(0, 0, 0, 1), F.updateMatrixWorld(), console.log("[DualCanvasViewer] ✅ Y-up 模型无需旋转:", {
                模型: P,
                说明: "模型已使用标准 Y-up 坐标系"
              });
            F.userData._zupYupConversionDone = !0;
          }
          p++;
          const O = new h.Box3().setFromObject(F).min.y;
          (O > 0.1 || O < -0.1) && (console.log("[DualCanvasViewer] 🔧 调整模型底部到地面:", {
            模型: P,
            原底部Y: O.toFixed(2) + "m",
            调整量: (-O).toFixed(2) + "m"
          }), F.position.y -= O, F.updateMatrixWorld()), console.log("[DualCanvasViewer] ✅ 大坐标模型位置已更新:", {
            模型: P,
            ENU位置: `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`,
            实际位置: `(${F.position.x.toFixed(2)}, ${F.position.y.toFixed(2)}, ${F.position.z.toFixed(2)})`
          });
        }
      }
      if (C) for (const F of d) {
        const P = F.userData.originalLocation;
        if (P && P.cartographic) continue;
        const R = F.name || F.userData.fileName || "未知", L = f.get(F.uuid);
        if (!L) {
          console.warn("[DualCanvasViewer] ⚠️ 找不到模型的原始位置:", R);
          continue;
        }
        const A = f.get(d[0].uuid);
        if (!A) {
          console.warn("[DualCanvasViewer] ⚠️ 找不到参考模型的原始位置");
          continue;
        }
        const U = new h.Vector3().subVectors(L, A);
        console.log("[DualCanvasViewer] 🔍 小模型相对位置计算:", {
          模型: R,
          原始位置: `(${L.x.toFixed(2)}, ${L.y.toFixed(2)}, ${L.z.toFixed(2)})`,
          参考模型原始位置: `(${A.x.toFixed(2)}, ${A.y.toFixed(2)}, ${A.z.toFixed(2)})`,
          相对偏移: `(${U.x.toFixed(2)}, ${U.y.toFixed(2)}, ${U.z.toFixed(2)})`
        });
        const H = new h.Vector3().addVectors(C, U);
        F.position.copy(H);
        const ee = new h.Box3().setFromObject(F), O = new h.Vector3();
        if (ee.getSize(O), O.z > O.y && O.z > O.x) {
          const B = new h.Matrix4();
          B.makeRotationX(-Math.PI / 2);
          const k = new h.Quaternion();
          k.setFromRotationMatrix(B), F.quaternion.copy(k), F.updateMatrixWorld(), console.log("[DualCanvasViewer] 📐 小模型已旋转（Z-up → Y-up）:", {
            模型: R,
            旋转方式: "绕X轴-90°"
          });
        } else
          F.quaternion.set(0, 0, 0, 1), F.updateMatrixWorld(), console.log("[DualCanvasViewer] 📐 小模型无需旋转（Y-up）:", { 模型: R });
        x++, console.log("[DualCanvasViewer] ✅ 小模型位置已更新 [相对位置]:", {
          模型: R,
          相对偏移: `(${U.x.toFixed(2)}, ${U.y.toFixed(2)}, ${U.z.toFixed(2)})`,
          ENU位置: `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`
        });
      }
      console.log("[DualCanvasViewer] 🔍 模型详细信息（ENU转换后）:"), d.forEach((F, P) => {
        const R = new h.Box3().setFromObject(F), L = new h.Vector3();
        R.getSize(L), console.log(`[DualCanvasViewer]   模型 ${P + 1}:`, {
          名称: F.userData.filePath || F.name,
          缩放: {
            x: F.scale.x,
            y: F.scale.y,
            z: F.scale.z
          },
          位置: {
            x: F.position.x.toFixed(2),
            y: F.position.y.toFixed(2),
            z: F.position.z.toFixed(2)
          },
          尺寸: {
            x: L.x.toFixed(2) + "m",
            y: L.y.toFixed(2) + "m",
            z: L.z.toFixed(2) + "m"
          },
          大坐标模型: !!F.userData.isLargeCoordModel
        }), console.log(`[DualCanvasViewer]     > ${F.userData.filePath || F.name} | 缩放:${F.scale.x.toFixed(4)} | 尺寸:${L.x.toFixed(1)}m x ${L.y.toFixed(1)}m x ${L.z.toFixed(1)}m | 大坐标:${F.userData.isLargeCoordModel ? "是" : "否"}`);
      });
      const M = d.find((F) => F.userData.isLargeCoordModel);
      if (M) {
        console.log("[DualCanvasViewer] 🔍 大坐标模型与倾斜摄影尺寸对比分析");
        const F = new h.Box3().setFromObject(M), P = new h.Vector3();
        F.getSize(P), console.log("[DualCanvasViewer] 📐 大坐标模型当前尺寸:", {
          文件名: M.userData.filePath || M.name,
          模型缩放: M.scale.x.toFixed(4),
          实际尺寸: {
            长度: P.x.toFixed(2) + "m",
            宽度: P.z.toFixed(2) + "m",
            高度: P.y.toFixed(2) + "m"
          }
        });
        const R = window.__cesiumViewer__;
        if (R && R.scene && R.scene.primitives) {
          console.log("[DualCanvasViewer] 🔍 分析倾斜摄影数据...");
          const L = R.scene.primitives, A = L.length;
          console.log("[DualCanvasViewer] 📊 场景中的 primitives 数量:", A);
          try {
            const U = R.scene.canvas, H = U.clientWidth / 2, ee = U.clientHeight / 2, O = window.Cesium || R.Cesium;
            if (O) {
              const B = R.camera.getPickRay(new O.Cartesian2(H, ee)), k = R.scene.drillPick(B, new O.Cartesian2(H, ee));
              if (k && k.length > 0) {
                console.log("[DualCanvasViewer] 🎯 屏幕中心拾取到", k.length, "个物体");
                for (let Q = 0; Q < k.length; Q++) {
                  const X = k[Q];
                  if (console.log("[DualCanvasViewer] 物体", Q + 1, ":", {
                    type: X.constructor.name,
                    hasPrimitive: !!X.primitive,
                    primitiveType: X.primitive?.constructor?.name
                  }), X.primitive && X.primitive.tileset) {
                    const j = X.primitive.tileset, G = X.primitive.tile;
                    if (console.log("[DualCanvasViewer] ✅ 找到3D Tileset:", {
                      url: j.url,
                      tile: G ? {
                        level: G.level,
                        x: G.x,
                        y: G.y,
                        hasContent: G.hasContent,
                        hasContentAvailable: G.hasContentAvailable
                      } : "N/A"
                    }), G && G.content && G.content.boundingSphere) {
                      const W = G.content.boundingSphere.radius;
                      console.log("[DualCanvasViewer] 📊 当前B3DM块边界球:", {
                        半径: W ? W.toFixed(2) + "m" : "unknown",
                        直径: W ? (W * 2).toFixed(2) + "m" : "unknown"
                      });
                      const K = Math.max(P.x || 0, P.z || 0), $ = W * 2;
                      if (isFinite(K) && isFinite($) && K > 0 && $ > 0) if (K < $ * 0.5) {
                        const N = ($ / K).toFixed(2);
                        console.warn("[DualCanvasViewer] ⚠️ 模型与当前B3DM块尺寸对比:", {
                          模型最大尺寸: K.toFixed(2) + "m",
                          B3DM块直径: $.toFixed(2) + "m",
                          建议缩放倍数: N + "x",
                          应用命令: `const m=window.__dualCanvasViewer.modelGroup1.children.find(m=>m.userData.isLargeCoordModel);if(m){m.scale.set(${N},${N},${N});m.updateMatrixWorld(true);console.log('模型已缩放至${N}倍');}`
                        });
                      } else console.log("[DualCanvasViewer] ✅ 模型尺寸与当前B3DM块基本匹配");
                    }
                    break;
                  }
                }
              } else console.log("[DualCanvasViewer] ⚠️ 屏幕中心没有拾取到3D Tiles，使用整体边界球作为参考");
            }
          } catch (U) {
            console.warn("[DualCanvasViewer] 拾取屏幕中心失败:", U.message);
          }
          console.log("[DualCanvasViewer] 使用整体边界球计算缩放比例...");
          for (let U = 0; U < A; U++) try {
            const H = L.get(U);
            if (H && (H._tileset || H.ready || H.constructor.name === "Cesium3DTileset")) {
              const ee = (H._tileset || H).boundingSphere;
              if (ee && ee.radius && ee.center) {
                const O = ee.radius, B = ee.center;
                console.log("[DualCanvasViewer] 📊 倾斜摄影整体边界球:", {
                  半径: O && typeof O.toFixed == "function" ? O.toFixed(2) + "m" : O + "m",
                  直径: O * 2 && typeof (O * 2).toFixed == "function" ? (O * 2).toFixed(2) + "m" : O * 2 + "m",
                  中心: {
                    x: B.x && typeof B.x.toFixed == "function" ? B.x.toFixed(2) : B.x,
                    y: B.y && typeof B.y.toFixed == "function" ? B.y.toFixed(2) : B.y,
                    z: B.z && typeof B.z.toFixed == "function" ? B.z.toFixed(2) : B.z
                  }
                });
                const k = Math.max(P.x || 0, P.z || 0), Q = O * 2;
                if (isFinite(k) && isFinite(Q) && k > 0 && Q > 0) if (k < Q * 0.5) {
                  const X = (Q / k).toFixed(2);
                  console.warn("[DualCanvasViewer] ⚠️ 模型尺寸分析结果（整体区域）:", {
                    模型最大尺寸: k.toFixed(2) + "m",
                    倾斜摄影直径: Q.toFixed(2) + "m",
                    当前问题: "模型明显小于倾斜摄影覆盖区域",
                    建议缩放倍数: X + "x",
                    应用命令: `const m=window.__dualCanvasViewer.modelGroup1.children.find(m=>m.userData.isLargeCoordModel);if(m){m.scale.set(${X},${X},${X});m.updateMatrixWorld(true);}`
                  });
                } else console.log("[DualCanvasViewer] ✅ 模型尺寸与倾斜摄影区域基本匹配");
                else console.warn("[DualCanvasViewer] ⚠️ 无法计算缩放比例 - 数值无效:", {
                  modelMaxDim: k,
                  obliqueDiameter: Q
                });
                break;
              }
            }
          } catch (H) {
            console.warn("[DualCanvasViewer] 跳过 primitive", U, ":", H.message);
          }
        }
        if (M.userData.originalLocation) {
          const L = M.userData.originalLocation;
          console.log("[DualCanvasViewer] 📍 模型地理位置信息:", {
            经度: (L.longitude * 180 / Math.PI).toFixed && typeof (L.longitude * 180 / Math.PI).toFixed == "function" ? (L.longitude * 180 / Math.PI).toFixed(6) + "°" : L.longitude,
            纬度: (L.latitude * 180 / Math.PI).toFixed && typeof (L.latitude * 180 / Math.PI).toFixed == "function" ? (L.latitude * 180 / Math.PI).toFixed(6) + "°" : L.latitude,
            高度: L.height && typeof L.height.toFixed == "function" ? L.height.toFixed(2) + "m" : L.height || "unknown"
          });
        }
      }
      console.log("[DualCanvasViewer] ✅ ENU坐标转换完成:", {
        大坐标模型已重新定位: p,
        小模型保持相对位置: x,
        总计: p + x
      });
      const y = new h.Box3();
      for (const F of d) y.expandByObject(F);
      const w = new h.Vector3();
      y.getCenter(w);
      const V = new h.Vector3();
      y.getSize(V), console.log("[DualCanvasViewer] 场景包围盒:", {
        中心: `(${w.x.toFixed(2)}, ${w.y.toFixed(2)}, ${w.z.toFixed(2)})`,
        大小: `(${V.x.toFixed(2)}, ${V.y.toFixed(2)}, ${V.z.toFixed(2)})`
      });
      const S = Math.max(V.x, V.y, V.z), T = this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() || !1, v = this.syncManager?.mercatorProjection?.getDualFloorHeight?.() || 76;
      let D, _;
      T ? (D = Math.max(100, S * 1.5), _ = Math.max(150, S * 2), console.log("[DualCanvasViewer] ⭐ 局部坐标系模式：使用合理的初始相机高度", {
        配置的Cesium地板高度: v.toFixed(2) + "米",
        Dual相机相对高度: D.toFixed(2) + "米",
        预期Cesium相机高度: (v + D).toFixed(2) + "米",
        场景最大尺寸: S.toFixed(2) + "米",
        说明: "Dual相机高度是相对值，同步时会加上地板高度"
      })) : (D = Math.max(500, S * 2), _ = Math.max(800, S * 3)), this.camera1 && this.controls1 && (this.camera1.up.set(o.x, o.y, o.z), this.camera1.position.set(w.x, w.y + D, w.z + _), this.controls1.target.copy(w), this.camera1.lookAt(w), this.controls1.update(), console.log("[DualCanvasViewer] 相机1已设置:", {
        位置: `(${this.camera1.position.x.toFixed(2)}, ${this.camera1.position.y.toFixed(2)}, ${this.camera1.position.z.toFixed(2)})`,
        目标: `(${w.x.toFixed(2)}, ${w.y.toFixed(2)}, ${w.z.toFixed(2)})`,
        up向量: `(${o.x.toFixed(4)}, ${o.y.toFixed(4)}, ${o.z.toFixed(4)})`
      })), this.camera2 && this.controls2 && (this.camera2.up.set(o.x, o.y, o.z), this.camera2.position.set(w.x, w.y + D, w.z + _), this.controls2.target.copy(w), this.camera2.lookAt(w), typeof this.camera2.update == "function" && this.camera2.update());
      let b = y.min.y;
      if (console.log("[DualCanvasViewer] 🔍 GridHelper位置计算:", {
        isUsingLocalCoord: T,
        场景底部: y.min.y.toFixed(2) + "米",
        初始GridHelperY: b.toFixed(2) + "米"
      }), T) {
        console.log("[DualCanvasViewer] ✅ 检测到局部坐标系模式，GridHelper保持在场景底部");
        const F = d.find((P) => P.userData.originalLocation?.cartographic);
        if (console.log("[DualCanvasViewer] 🔍 查找大坐标模型:", {
          找到: !!F,
          模型总数: d.length
        }), F) {
          const P = F.userData.originalLocation.cartographic.height || 0;
          console.log("[DualCanvasViewer] ✅ 局部坐标系模式：GridHelper与模型底部对齐", {
            场景底部: y.min.y.toFixed(2) + "米",
            模型海拔: P.toFixed(2) + "米（由 MercatorProjectionManager 管理）",
            GridHelperY: b.toFixed(2) + "米",
            说明: "GridHelper 在场景底部，与模型底部对齐"
          });
        } else console.warn("[DualCanvasViewer] ⚠️ 局部坐标系模式但未找到大坐标模型！");
      } else console.log("[DualCanvasViewer] ℹ️ 非局部坐标系模式，GridHelper在场景底部");
      this.gridHelper1 && (this.gridHelper1.position.copy(w), this.gridHelper1.position.y = b, this.gridHelper1.userData.initialRotationSet || (this.gridHelper1.quaternion.set(0, 0, 0, 1), this.gridHelper1.userData.initialRotationSet = !0, console.log("[DualCanvasViewer] GridHelper1保持水平（禁用ENU旋转）", { 说明: "GridHelper保持水平，不跟随ENU切平面旋转，避免视觉倾斜" }))), this.gridHelper2 && (this.gridHelper2.position.copy(w), this.gridHelper2.position.y = b, this.gridHelper2.userData.initialRotationSet || (this.gridHelper2.quaternion.set(0, 0, 0, 1), this.gridHelper2.userData.initialRotationSet = !0), console.log("[DualCanvasViewer] GridHelper2保持水平（禁用ENU旋转）")), this.syncManager && (this.syncManager.usingENU = !0, this.syncManager.enuOrigin = {
        longitude: t.longitude,
        latitude: t.latitude,
        height: t.height
      }, console.log("[DualCanvasViewer] SyncManager已更新为使用ENU坐标系")), this.usingENU = !0, this.mouseCoords.enuOrigin = {
        longitude: t.longitude,
        latitude: t.latitude,
        height: t.height
      }, console.log("[DualCanvasViewer] ✅ ENU坐标系已启用，坐标信息面板将显示ENU坐标"), this.applyControlsRestrictions(), console.log("[DualCanvasViewer] ✅ ENU模式下控制器限制已更新：允许翻转");
      const E = window.__cesiumViewer__ || this.syncManager?.cesiumViewer;
      if (E && this.camera1 && e) try {
        console.log("[DualCanvasViewer] 开始同步Cesium相机到ENU位置...");
        const F = this.camera1.position.clone();
        console.log("[DualCanvasViewer] Three.js相机ENU位置:", {
          x: F.x.toFixed(2),
          y: F.y.toFixed(2),
          z: F.z.toFixed(2)
        });
        const P = e.enuToECEF(F);
        console.log("[DualCanvasViewer] Three.js相机ECEF位置:", {
          x: P.x.toFixed(2),
          y: P.y.toFixed(2),
          z: P.z.toFixed(2)
        });
        const R = new Cesium.Cartesian3(P.x, P.y, P.z), L = (E.scene.globe.ellipsoid || Cesium.Ellipsoid.WGS84).cartesianToCartographic(R);
        if (L) {
          const A = Cesium.Cartesian3.fromRadians(L.longitude, L.latitude, L.height);
          console.log("[DualCanvasViewer] 准备设置Cesium相机位置:", {
            destination: {
              x: A.x.toFixed(2),
              y: A.y.toFixed(2),
              z: A.z.toFixed(2)
            },
            经度: Cesium.Math.toDegrees(L.longitude).toFixed(6) + "°",
            纬度: Cesium.Math.toDegrees(L.latitude).toFixed(6) + "°",
            高度: L.height.toFixed(2) + "m"
          }), E.camera.setView({
            destination: A,
            orientation: {
              heading: 0,
              pitch: -Cesium.Math.PI_OVER_FOUR,
              roll: 0
            }
          });
          const U = E.camera.positionCartographic;
          console.log("[DualCanvasViewer] ✅ Cesium相机setView完成，当前位置:", {
            经度: Cesium.Math.toDegrees(U.longitude).toFixed(6) + "°",
            纬度: Cesium.Math.toDegrees(U.latitude).toFixed(6) + "°",
            高度: U.height.toFixed(2) + "m"
          }), setTimeout(() => {
            const H = E.camera.positionCartographic;
            console.log("[DualCanvasViewer] ⏰ 1秒后Cesium相机位置:", {
              经度: Cesium.Math.toDegrees(H.longitude).toFixed(6) + "°",
              纬度: Cesium.Math.toDegrees(H.latitude).toFixed(6) + "°",
              高度: H.height.toFixed(2) + "m"
            });
          }, 1e3), console.log("[DualCanvasViewer] ✅ Cesium相机setView已调用");
        }
      } catch (F) {
        console.warn("[DualCanvasViewer] Cesium相机同步失败:", F);
      }
      else console.warn("[DualCanvasViewer] 无法同步Cesium相机:", {
        有CesiumViewer: !!E,
        有camera1: !!this.camera1,
        有enuManager: !!e
      });
      console.log("[DualCanvasViewer] ✅ 模型重新定位完成（ENU坐标系模式）"), console.log("[DualCanvasViewer] 💡 关键：每个模型已根据其地理位置（经纬度、高度）正确放置在ENU坐标系中");
    },
    initPrecisionModelLoader(e = 0) {
      try {
        const t = window.__cesiumViewer__ || this.syncManager?.cesiumViewer;
        if (!t) {
          e < 10 ? (console.warn(`[DualCanvasViewer] Cesium Viewer 未就绪，稍后初始化精确模型加载器 (${e + 1}/10)`), setTimeout(() => {
            this.initPrecisionModelLoader(e + 1);
          }, 1e3)) : (console.warn("[DualCanvasViewer] ⚠️ Cesium Viewer 未就绪，已达到最大重试次数，跳过精确模型加载器初始化"), console.warn("[DualCanvasViewer] 💡 模型加载仍可正常工作，只是无法使用精确地理位置定位功能"));
          return;
        }
        this.precisionModelLoader = new rt(t, de), console.log("[DualCanvasViewer] ✅ 精确模型加载器已初始化", {
          cesiumViewer: t?._element?.id || "unknown",
          mercatorProjection: !!de
        }), typeof window < "u" && (window.__precisionModelLoader__ = this.precisionModelLoader);
      } catch (t) {
        console.error("[DualCanvasViewer] 初始化精确模型加载器失败:", t);
      }
    },
    async loadModelWithPrecision(e, t, o = {}) {
      return this.precisionModelLoader ? await this.precisionModelLoader.loadModelPrecisely(e, t, o) : (console.error("[DualCanvasViewer] 精确模型加载器未初始化"), null);
    },
    addGroundMarkerForLocalCoord(e, t, o = 0) {
      if (typeof window > "u" || !window.Cesium) {
        console.warn("[DualCanvasViewer] Cesium 未初始化，跳过地面标记");
        return;
      }
      const i = window.__cesiumViewer__;
      if (!i) {
        console.warn("[DualCanvasViewer] Cesium Viewer 未找到，跳过地面标记");
        return;
      }
      try {
        const n = window.Cesium.Cartesian3.fromDegrees(e, t, o), r = i.entities.add({
          id: `ground-marker-${Date.now()}`,
          position: n,
          point: {
            pixelSize: 20,
            color: window.Cesium.Color.YELLOW,
            outlineColor: window.Cesium.Color.RED,
            outlineWidth: 3,
            heightReference: window.Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: "📍 地面点",
            font: "16px sans-serif",
            fillColor: window.Cesium.Color.YELLOW,
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 2,
            style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new window.Cesium.Cartesian2(0, -25),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        console.log("[DualCanvasViewer] ✅ 局部坐标系模式：已在 Cesium 地面添加黄色标记点", {
          经度: e.toFixed(8) + "°",
          纬度: t.toFixed(8) + "°",
          高度: o.toFixed(2) + "m",
          标记ID: r.id
        });
      } catch (n) {
        console.error("[DualCanvasViewer] 添加 Cesium 地面标记失败:", n);
      }
    },
    registerLayersToViewport() {
      console.log("[DualCanvasViewer] 注册层到统一视口管理器..."), this.$refs.threeContainer && (this.viewportManager.registerLayer("layer1", {
        camera: this.camera1,
        scene: this.scene1,
        container: this.$refs.threeContainer,
        raycaster: this.raycaster1,
        mouseVector: this.mouse1,
        controls: this.controls1,
        modelGroup: this.modelGroup1,
        selectedModel: this.selectedModel1,
        transformControls: this.transformControls1
      }), console.log("[DualCanvasViewer] 层 1 已注册")), this.$refs.bimContainer && (this.viewportManager.registerLayer("layer2", {
        camera: this.camera2,
        scene: this.scene2,
        container: this.$refs.bimContainer,
        raycaster: this.raycaster2,
        mouseVector: this.mouse2,
        controls: this.controls2,
        modelGroup: this.modelGroup2,
        selectedModel: this.selectedModel2,
        transformControls: this.transformControls2
      }), console.log("[DualCanvasViewer] 层 2 已注册"));
      const e = this.viewportManager.getDebugInfo();
      console.log("[DualCanvasViewer] 统一视口管理器调试信息:", e), this.viewportManager.updateViewportSize();
      const t = this.viewportManager.getDebugInfo();
      console.log("[DualCanvasViewer] 更新后的虚拟视口尺寸:", t.virtualViewport), this.verifyCoordinateSystem();
    },
    verifyCoordinateSystem() {
      if (!this.viewportManager) {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，跳过验证");
        return;
      }
      console.log("[DualCanvasViewer] 开始验证坐标系统..."), [
        {
          x: 100,
          y: 100,
          desc: "左上角附近"
        },
        {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          desc: "屏幕中心"
        },
        {
          x: window.innerWidth - 100,
          y: window.innerHeight - 100,
          desc: "右下角附近"
        }
      ].forEach((e) => {
        const t = this.viewportManager.screenToViewportNDC(e.x, e.y);
        console.log(`[DualCanvasViewer] 坐标转换测试 - ${e.desc}:`, {
          screen: {
            x: e.x,
            y: e.y
          },
          ndc: {
            x: t.x.toFixed(3),
            y: t.y.toFixed(3)
          }
        });
      }), console.log("[DualCanvasViewer] 坐标系统验证完成");
    },
    async initENUCoordinateSystem(e, t, o = 0, i = 500) {
      if (console.log("[DualCanvasViewer] 初始化ENU坐标系:", {
        经度: e.toFixed(6) + "°",
        纬度: t.toFixed(6) + "°",
        高度: o.toFixed(2) + "m",
        相机偏移: i.toFixed(2) + "m"
      }), !(this.syncManager?.getCesium() || window.Cesium) || !window.viewer)
        return console.warn("[DualCanvasViewer] ⚠️ Cesium 未准备好，跳过 ENU/局部坐标系初始化"), !1;
      try {
        typeof window < "u" && window.Cesium && window.viewer && se.setCesium(window.Cesium, window.viewer);
        const n = e * Math.PI / 180, r = t * Math.PI / 180, a = await this._getTerrainHeightAtPosition(e, t, window.Cesium, window.viewer);
        let s = o;
        const c = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
        if (c && c.modelAbsoluteMercator ? (s = c.modelAbsoluteMercator.z || o, console.log("[DualCanvasViewer] 从 modelAbsoluteMercator 获取模型海拔:", s.toFixed(2) + "m")) : c && c.originalFloorHeight !== void 0 && (s = c.originalFloorHeight, console.log("[DualCanvasViewer] 从 originalFloorHeight 获取模型海拔:", s.toFixed(2) + "m")), console.log("[DualCanvasViewer] 高度分析:", {
          输入高度: o.toFixed(2) + "m",
          实际地形高度: a.toFixed(2) + "m",
          模型海拔高度: s.toFixed(2) + "m",
          地形与模型高度差: (s - a).toFixed(2) + "m",
          说明: "⭐ ENU 原点将设置在地形表面高度（actualTerrainHeight），与 ENU 坐标系定义一致"
        }), !se.initializeAtPosition(n, r, a))
          return console.error("[DualCanvasViewer] ENU坐标系初始化失败"), !1;
        if (se.setCesiumCameraToOrigin(i), typeof window < "u" && (window.__enuCoordinateManager__ = se, console.log("[DualCanvasViewer] ✅ ENU 管理器已设置到全局变量 window.__enuCoordinateManager__")), await this._initializeSceneRotationForENU(n, r, a), this.viewportManager ? (this.viewportManager.setENUManager(se), console.log("[DualCanvasViewer] ✅ ENU坐标系已注册到虚拟视口")) : console.warn("[DualCanvasViewer] 虚拟视口管理器不可用，ENU已初始化但未注册"), typeof window < "u" && window.__helloWorldInstance__) {
          const g = window.__helloWorldInstance__;
          typeof g.registerENUToViewport == "function" && g.registerENUToViewport(se);
        }
        const l = this.viewportManager ? this.viewportManager.getDebugInfo() : null;
        if (console.log("[DualCanvasViewer] ENU坐标系初始化完成:", {
          origin: se.getOriginInfo(),
          viewportENU: l ? l.enu : null
        }), console.warn("[DualCanvasViewer] 🌍 ENU坐标系诊断信息:", {
          ENU原点经度: (n * 180 / Math.PI).toFixed(6) + "°",
          ENU原点纬度: (r * 180 / Math.PI).toFixed(6) + "°",
          ENU原点海拔: a.toFixed(2) + "米 (地形表面)",
          模型海拔: s.toFixed(2) + "米",
          高度差: (s - a).toFixed(2) + "米",
          ThreeSceneOrigin: "(0, 0, 0)",
          anchorContainer位置: "(0, 0, 0)",
          说明: "⭐ ENU原点在地形表面，红球在模型海拔，水平方向对齐"
        }), this.scene1 && this.syncManager && (console.warn("[DualCanvasViewer] 🎯 Three.js场景原点诊断:", {
          scene1位置: `(${this.scene1.position.x.toFixed(2)}, ${this.scene1.position.y.toFixed(2)}, ${this.scene1.position.z.toFixed(2)})`,
          scene1旋转: `(${this.scene1.rotation.x.toFixed(4)}, ${this.scene1.rotation.y.toFixed(4)}, ${this.scene1.rotation.z.toFixed(4)})`,
          说明: "scene1是根场景，其位置应该始终为(0,0,0)"
        }), this.syncManager.mercatorProjection)) {
          const g = this.syncManager.mercatorProjection.floorCenterMercator || {
            x: 0,
            y: 0,
            z: 0
          };
          console.warn("[DualCanvasViewer] 🗺️ 墨卡托投影中心:", {
            floorCenterMercator: `(${g.x.toFixed(2)}, ${g.y.toFixed(2)}, ${g.z.toFixed(2)})`,
            说明: "这个偏移会影响世界坐标的地理位置映射"
          });
        }
        if (this.verifyAndFixSceneContainerPosition(), this.anchorContainer1) {
          const g = this.calculateAnchorContainerY();
          this.anchorContainer1.position.set(0, g, 0), this.anchorContainer1.updateMatrixWorld(), console.log("[DualCanvasViewer] ✅ anchorContainer1 已设置到 (0,", g, ", 0)");
        }
        return this.verifyOriginAlignment(), !0;
      } catch (n) {
        return console.error("[DualCanvasViewer] 导入或初始化ENUCoordinateManager失败:", n), !1;
      }
    },
    async _getTerrainHeightAtPosition(e, t, o, i) {
      if (!o || !i)
        return console.warn("[DualCanvasViewer] Cesium 不可用，使用默认高度 0"), 0;
      try {
        console.warn("[DualCanvasViewer] 🔍 _getTerrainHeightAtPosition 输入验证:", {
          输入经度: e,
          输入纬度: t,
          经度绝对值: Math.abs(e),
          纬度绝对值: Math.abs(t)
        });
        let n = e, r = t;
        (Math.abs(e) > 1e3 || Math.abs(t) > 1e3) && (console.warn("[DualCanvasViewer] ⚠️ 检测到异常经纬度值，可能已被错误转换，尝试恢复:", {
          原始经度: e,
          原始纬度: t,
          尝试除以转换因子: {
            经度: e / (180 / Math.PI),
            纬度: t / (180 / Math.PI)
          }
        }), n = e / (180 / Math.PI), r = t / (180 / Math.PI));
        const a = n * Math.PI / 180, s = r * Math.PI / 180;
        (Math.abs(a) > Math.PI || Math.abs(s) > Math.PI / 2) && console.error("[DualCanvasViewer] ❌ 转换后的弧度值超出合理范围!", {
          原始经度: e,
          原始纬度: t,
          工作经度: n,
          工作纬度: r,
          弧度经度: a,
          弧度纬度: s
        });
        const c = o.Cartographic.fromRadians(a, s, 0), l = await i.scene.sampleHeightMostDetailed([c]);
        if (l && l[0] !== void 0 && !isNaN(l[0])) {
          const g = l[0];
          return g < -500 || g > 9e3 ? (console.warn("[DualCanvasViewer] ⚠️ 地形采样返回异常高度值，使用椭球体表面 (height=0):", {
            位置: `(${e.toFixed(6)}°, ${t.toFixed(6)}°)`,
            异常高度: g.toFixed(2) + "m",
            原因: "超出合理范围 [-500, 9000]"
          }), 0) : (console.log("[DualCanvasViewer] ✅ 地形采样成功:", {
            位置: `(${e.toFixed(6)}°, ${t.toFixed(6)}°)`,
            地形高度: g.toFixed(2) + "m"
          }), g);
        } else
          return console.warn("[DualCanvasViewer] ⚠️ 地形采样返回无效值，使用椭球体表面 (height=0)"), 0;
      } catch (n) {
        return console.warn("[DualCanvasViewer] ⚠️ 地形采样失败，使用椭球体表面 (height=0):", n.message), 0;
      }
    },
    verifyAndFixSceneContainerPosition() {
      if (console.log("[DualCanvasViewer] 🔍 验证 sceneContainer1 位置..."), !this.sceneContainer1)
        return console.warn("[DualCanvasViewer] ⚠️ sceneContainer1 不存在，跳过验证"), !1;
      const e = this.sceneContainer1.position.clone();
      return console.log("[DualCanvasViewer] sceneContainer1 当前位置:", {
        x: e.x.toFixed(4),
        y: e.y.toFixed(4),
        z: e.z.toFixed(4)
      }), Math.abs(e.x) > 0.01 || Math.abs(e.y) > 0.01 || Math.abs(e.z) > 0.01 ? (console.warn("[DualCanvasViewer] ⚠️ 检测到 sceneContainer1 位置偏移，重置为原点"), this.sceneContainer1.position.set(0, 0, 0), this.sceneContainer1.updateMatrixWorld(), console.log("[DualCanvasViewer] ✅ sceneContainer1 已重置到原点"), !0) : (console.log("[DualCanvasViewer] ✅ sceneContainer1 位置正确，无需修复"), !1);
    },
    verifyOriginAlignment() {
      console.log("[DualCanvasViewer] ".repeat(30)), console.log("[DualCanvasViewer] 🔍 三坐标系原点统一验证"), console.log("[DualCanvasViewer] ".repeat(30));
      const e = window.__enuCoordinateManager__?.getOriginInfo();
      console.log("[DualCanvasViewer] 📍 ENU 原点:", {
        经度: e?.longitude?.toFixed(6) + "°" || "N/A",
        纬度: e?.latitude?.toFixed(6) + "°" || "N/A",
        高度: e?.height?.toFixed(2) + "m" || "N/A"
      });
      const t = (this.syncManager?.mercatorProjection || this.mercatorProjectionManager)?.modelAbsoluteMercator;
      if (!t)
        return console.warn("[DualCanvasViewer] ⚠️ modelAbsoluteMercator 未设置，无法验证 Three.js 原点"), console.log("[DualCanvasViewer] ".repeat(30)), !1;
      const o = 6378137, i = t.x / o, n = 2 * Math.atan(Math.exp(t.y / o)) - Math.PI / 2, r = t.z || 0;
      if (console.log("[DualCanvasViewer] 🎯 Three.js 原点对应的地理位置:", {
        经度: (i * 180 / Math.PI).toFixed(6) + "°",
        纬度: (n * 180 / Math.PI).toFixed(6) + "°",
        高度: r.toFixed(2) + "m",
        来源: "modelAbsoluteMercator"
      }), !e)
        return console.warn("[DualCanvasViewer] ⚠️ ENU 原点信息不可用，无法验证对齐"), console.log("[DualCanvasViewer] ".repeat(30)), !1;
      const a = Math.abs(e.longitude - i), s = Math.abs(e.latitude - n), c = Math.abs(e.height - r), l = a < 1e-6 && s < 1e-6;
      return console.log("[DualCanvasViewer] ✅ 原点对齐验证:", {
        水平对齐状态: l ? "✅ 已对齐" : "❌ 未对齐",
        经度差: (a * 180 / Math.PI).toFixed(6) + "°",
        纬度差: (s * 180 / Math.PI).toFixed(6) + "°",
        ENU原点高度: e.height.toFixed(2) + "m (地形表面)",
        Three原点高度: r.toFixed(2) + "m (模型海拔)",
        高度差: c.toFixed(2) + "m (正常)",
        说明: "⭐ ENU原点和Three原点在水平方向对齐，高度差是正常的（模型海拔 - 地形高度）"
      }), console.log("[DualCanvasViewer] ".repeat(30)), l;
    },
    async _initializeSceneRotationForENU(e, t, o) {
      try {
        const i = window.Cesium, n = window.viewer;
        if (!i || !n)
          return console.warn("[DualCanvasViewer] Cesium 不可用，SceneRotationManager 初始化跳过"), !1;
        ae.setCesium(i, n), this.sceneContainer1 ? (ae.setSceneContainer(this.sceneContainer1), console.log("[DualCanvasViewer] ✅ SceneRotationManager 场景容器已设置")) : console.warn("[DualCanvasViewer] ⚠️ sceneContainer1 不可用，SceneRotationManager 场景容器未设置");
        const r = {
          longitude: e,
          latitude: t,
          height: o
        };
        return ae.initialize(null, r), typeof window < "u" && (window.__sceneRotationManager__ = ae, console.log("[DualCanvasViewer] ✅ SceneRotationManager 已设置到全局")), console.log("[DualCanvasViewer] ✅ SceneRotationManager 初始化完成:", {
          floorCenterCartographic: {
            longitude: (e * 180 / Math.PI).toFixed(6) + "°",
            latitude: (t * 180 / Math.PI).toFixed(6) + "°",
            height: o.toFixed(2) + "m"
          },
          hasSceneContainer: !!this.sceneContainer1
        }), this._initialENUOrigin = {
          longitude: e,
          latitude: t,
          height: o
        }, this._initialRedBallPosition = {
          x: 0,
          y: this.anchorContainer1?.position.y || 0,
          z: 0
        }, console.warn("[DualCanvasViewer] 🔒 ENU 原点和红球初始位置已保存:", {
          初始ENU原点: {
            经度: (e * 180 / Math.PI).toFixed(6) + "°",
            纬度: (t * 180 / Math.PI).toFixed(6) + "°",
            海拔: o.toFixed(2) + "m"
          },
          初始红球世界位置: {
            x: "0",
            y: (this.anchorContainer1?.position.y || 0).toFixed(2) + "m",
            z: "0"
          },
          说明: "这些值将在鼠标操作过程中保持不变，可通过 checkENUOriginAndRedBallConsistency() 验证"
        }), !0;
      } catch (i) {
        return console.error("[DualCanvasViewer] SceneRotationManager 初始化失败:", i), !1;
      }
    },
    checkENUOriginAndRedBallConsistency() {
      const e = window.__enuCoordinateManager__?.getOriginInfo(), t = this.anchorContainer1?.position.y || 0, o = e ? {
        longitude: e.longitude,
        latitude: e.latitude,
        height: e.height
      } : null, i = o && this._initialENUOrigin && Math.abs(o.longitude - this._initialENUOrigin.longitude) < 1e-6 && Math.abs(o.latitude - this._initialENUOrigin.latitude) < 1e-6, n = this._initialRedBallPosition && Math.abs(t - this._initialRedBallPosition.y) < 0.01;
      return console.warn("%c📍 ENU 原点和红球经纬度一致性检查", "color: #ff6b6b; font-weight: bold; font-size: 14px;"), console.log({
        ENU原点经纬度: e ? `(${(e.longitude * 180 / Math.PI).toFixed(6)}°, ${(e.latitude * 180 / Math.PI).toFixed(6)}°)` : "N/A",
        ENU原点海拔: e ? `${e.height.toFixed(2)} 米` : "N/A",
        红球世界Y位置: `${t.toFixed(2)} 米`,
        初始ENU原点: this._initialENUOrigin ? `(${(this._initialENUOrigin.longitude * 180 / Math.PI).toFixed(6)}°, ${(this._initialENUOrigin.latitude * 180 / Math.PI).toFixed(6)}°)` : "N/A",
        初始红球Y: this._initialRedBallPosition ? `${this._initialRedBallPosition.y.toFixed(2)} 米` : "N/A",
        ENU原点是否一致: i ? "✅ 是" : "❌ 否",
        红球位置是否一致: n ? "✅ 是" : "❌ 否",
        总体状态: i && n ? "✅ 完全一致" : "⚠️ 存在偏差"
      }), {
        isENUOriginConsistent: i,
        isRedBallPositionConsistent: n,
        isFullyConsistent: i && n,
        currentENUOrigin: o,
        currentRedBallY: t,
        initialENUOrigin: this._initialENUOrigin,
        initialRedBallPosition: this._initialRedBallPosition
      };
    },
    handleWindowResize() {
      console.log("[DualCanvasViewer] 窗口大小变化，更新虚拟视口..."), this.viewportManager.updateViewportSize();
      const e = this.viewportManager.getDebugInfo();
      console.log("[DualCanvasViewer] 虚拟视口尺寸:", e.virtualViewport), this.updateViewportStatus(), this.syncXeokitCanvasSize();
    },
    syncXeokitCanvasSize() {
      if (!this.xeokitViewers || this.xeokitViewers.length === 0) {
        console.log("[DualCanvasViewer] syncXeokitCanvasSize: 没有 xeokit viewers");
        return;
      }
      const e = this.$refs.bimContainer;
      if (!e) {
        console.log("[DualCanvasViewer] syncXeokitCanvasSize: bimContainer 不存在");
        return;
      }
      const t = this.viewportManager.getDebugInfo().virtualViewport, o = t && t.width > 0 ? t.width : e.clientWidth, i = t && t.height > 0 ? t.height : e.clientHeight;
      console.log("[DualCanvasViewer] 同步 xeokit canvas 尺寸:", {
        容器尺寸: `${e.clientWidth} x ${e.clientHeight}`,
        虚拟视口尺寸: t ? `${t.width} x ${t.height}` : "不可用",
        目标尺寸: `${o} x ${i}`
      });
      let n = 0;
      this.xeokitViewers.forEach((r, a) => {
        if (!r) {
          console.warn(`[DualCanvasViewer] xeokitViewer[${a}] 不存在`);
          return;
        }
        const s = r.canvas;
        if (s) {
          if (s.width = o, s.height = i, r.viewer && r.viewer.camera) try {
            r.viewer.glRenderer && r.viewer.glRenderer.canvas && (r.viewer.glRenderer.canvas.width = o, r.viewer.glRenderer.canvas.height = i), r.viewer.glRenderer && r.viewer.glRenderer.gl && r.viewer.glRenderer.gl.viewport(0, 0, o, i), n++;
          } catch (c) {
            console.error("[DualCanvasViewer] 更新 xeokit viewer 视口失败:", c);
          }
        } else console.warn(`[DualCanvasViewer] xeokitViewer[${a}] 没有 canvas`);
      }), console.log(`[DualCanvasViewer] xeokit canvas 尺寸同步完成，更新了 ${n} 个 viewer`);
    },
    setupCoordinateTracking() {
      console.log("[DualCanvasViewer] 设置坐标跟踪监听器..."), this.coordinateTracker = this.handleCoordinateUpdate.bind(this), this.$refs.eventContainer?.addEventListener("pointermove", this.coordinateTracker), this.updateViewportStatus();
    },
    removeCoordinateTracking() {
      console.log("[DualCanvasViewer] 移除坐标跟踪监听器..."), this.coordinateTracker && this.$refs.eventContainer && (this.$refs.eventContainer.removeEventListener("pointermove", this.coordinateTracker), this.coordinateTracker = null);
    },
    handleCoordinateUpdate(e) {
      this._coordUpdateThrottle || (this._coordUpdateThrottle = !0, requestAnimationFrame(() => {
        this.updateMouseCoordinates(e), this._coordUpdateThrottle = !1;
      }));
    },
    updateMouseCoordinates(e) {
      this.mouseCoords.screen.x = e.clientX, this.mouseCoords.screen.y = e.clientY;
      const t = this.$refs.eventContainer || this.threeContainer;
      if (t && (this.mouseCoords.screenCenter.x = t.clientWidth / 2, this.mouseCoords.screenCenter.y = t.clientHeight / 2), this.viewportManager) {
        this.usingUnifiedViewport = !0;
        const o = this.viewportManager.virtualViewport.getBounds();
        this.mouseCoords.viewport.x = e.clientX - o.left, this.mouseCoords.viewport.y = e.clientY - o.top;
        const i = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        this.mouseCoords.ndc.x = i.x, this.mouseCoords.ndc.y = i.y;
        const n = this.getRaycastWorldPosition(i);
        if (this.camera1) if (n.layer1)
          this.mouseCoords.world1.x = n.layer1.x, this.mouseCoords.world1.y = n.layer1.y, this.mouseCoords.world1.z = n.layer1.z;
        else {
          const l = this.viewportManager.converter.viewportNDCToWorld(i.x, i.y, 0.5, this.camera1);
          this.mouseCoords.world1.x = l.x, this.mouseCoords.world1.y = l.y, this.mouseCoords.world1.z = l.z;
        }
        const r = this.xeokitViewers && this.xeokitViewers.length > 0, a = r && this.xeokitViewers[0]?.viewer?.camera, s = typeof window < "u" && window.__syncManager__, c = s && s.mercatorProjection && s.mercatorProjection.isUsingLocalCoordinateSystem && s.mercatorProjection.isUsingLocalCoordinateSystem();
        if (this.camera2) if (n.layer2)
          this.mouseCoords.world2.x = n.layer2.x, this.mouseCoords.world2.y = n.layer2.y, this.mouseCoords.world2.z = n.layer2.z;
        else {
          let l;
          c ? l = this.camera1 : a ? l = this.createXeokitCameraAdapter(this.xeokitViewers[0].viewer) : l = this.camera2;
          const g = this.viewportManager.converter.viewportNDCToWorld(i.x, i.y, 0.5, l);
          this.mouseCoords.world2.x = g.x, this.mouseCoords.world2.y = g.y, this.mouseCoords.world2.z = g.z;
        }
        if (r) if (n.layer2)
          this.mouseCoords.worldXeokit.x = n.layer2.x, this.mouseCoords.worldXeokit.y = n.layer2.y, this.mouseCoords.worldXeokit.z = n.layer2.z;
        else {
          let l;
          c ? l = this.camera1 : l = this.createXeokitCameraAdapter(this.xeokitViewers[0].viewer);
          const g = this.viewportManager.converter.viewportNDCToWorld(i.x, i.y, 0.5, l);
          this.mouseCoords.worldXeokit.x = g.x, this.mouseCoords.worldXeokit.y = g.y, this.mouseCoords.worldXeokit.z = g.z;
        }
        else
          this.mouseCoords.worldXeokit.x = this.mouseCoords.world2.x, this.mouseCoords.worldXeokit.y = this.mouseCoords.world2.y, this.mouseCoords.worldXeokit.z = this.mouseCoords.world2.z;
        if (this.showGeoCoords && this.camera1) {
          const l = this.viewportManager.converter.worldToLonLat(new h.Vector3(this.mouseCoords.world1.x, this.mouseCoords.world1.y, this.mouseCoords.world1.z));
          this.mouseCoords.geo.longitude = l.longitude, this.mouseCoords.geo.latitude = l.latitude, this.mouseCoords.geo.altitude = l.altitude;
        }
        if (this.usingENU && this.viewportManager) {
          const l = this.viewportManager.getENUManager();
          if (l && l.isInitialized()) {
            const g = new h.Vector3(this.mouseCoords.world1.x, this.mouseCoords.world1.y, this.mouseCoords.world1.z), u = l.threeJSToENU(g);
            this.mouseCoords.enu1.east = u.x, this.mouseCoords.enu1.north = -u.z, this.mouseCoords.enu1.up = u.y;
            const d = l.getOriginInfo();
            d && (this.mouseCoords.enuOrigin.longitude = d.longitude, this.mouseCoords.enuOrigin.latitude = d.latitude, this.mouseCoords.enuOrigin.height = d.height);
          } else
            this.mouseCoords.enu1.east = null, this.mouseCoords.enu1.north = null, this.mouseCoords.enu1.up = null;
        } else
          this.mouseCoords.enu1.east = null, this.mouseCoords.enu1.north = null, this.mouseCoords.enu1.up = null, this.mouseCoords.enuOrigin.longitude = null, this.mouseCoords.enuOrigin.latitude = null, this.mouseCoords.enuOrigin.height = null;
      } else {
        this.usingUnifiedViewport = !1;
        const o = this.$refs.eventContainer;
        if (o) {
          const i = o.getBoundingClientRect();
          this.mouseCoords.viewport.x = e.clientX - i.left, this.mouseCoords.viewport.y = e.clientY - i.top, this.mouseCoords.ndc.x = this.mouseCoords.viewport.x / i.width * 2 - 1, this.mouseCoords.ndc.y = -(this.mouseCoords.viewport.y / i.height) * 2 + 1;
        }
      }
    },
    createXeokitCameraAdapter(e) {
      if (!e || !e.camera)
        return console.warn("[DualCanvasViewer] 无法创建xeokit相机适配器：viewer或camera不存在"), this.camera2;
      const t = e.camera, o = new h.PerspectiveCamera();
      o.position.set(t.eye[0], t.eye[1], t.eye[2]);
      const i = new h.Vector3(t.look[0], t.look[1], t.look[2]), n = new h.Vector3(t.up[0], t.up[1], t.up[2]);
      return o.up.copy(n), o.lookAt(i), o.updateMatrixWorld(!0), o;
    },
    getRaycastWorldPosition(e) {
      const t = {
        layer1: null,
        layer2: null
      };
      if (this.camera1 && this.modelGroup1 && this.modelGroup1.children.length > 0) {
        this.raycaster1.setFromCamera({
          x: e.x,
          y: e.y
        }, this.camera1), this.raycaster1.params.Mesh.threshold = 2;
        const o = this.raycaster1.intersectObjects(this.modelGroup1.children, !0);
        if (o.length > 0) {
          const i = o.find((n) => {
            const r = n.object;
            return !r.isHelper && !r.isLine && r.type !== "TransformControls" && r.type !== "TransformControlsPlane";
          });
          i && (t.layer1 = i.point);
        }
      }
      if (this.camera2 && this.modelGroup2 && this.modelGroup2.children.length > 0) {
        if (this.modelGroup2.children.some((o) => o.userData.isXKTModel) && this.xeokitViewers && this.xeokitViewers.length > 0) try {
          const o = this.xeokitViewers[0];
          if (o && o.viewer) {
            const i = o.viewer, n = o.canvas.getBoundingClientRect(), r = this.$refs.eventContainer;
            if (r) {
              const a = r.getBoundingClientRect(), s = this.mouseCoords.screen.x - a.left, c = this.mouseCoords.screen.y - a.top, l = s - (n.left - a.left), g = c - (n.top - a.top), u = i.scene.pick({ canvasPos: [l, g] });
              if (u && u.entity) {
                if (u.worldPos && Array.isArray(u.worldPos)) t.layer2 = new h.Vector3(u.worldPos[0], u.worldPos[1], u.worldPos[2]);
                else if (u.entity.worldPos && Array.isArray(u.entity.worldPos)) t.layer2 = new h.Vector3(u.entity.worldPos[0], u.entity.worldPos[1], u.entity.worldPos[2]);
                else {
                  const d = i.scene.models, m = Object.keys(d);
                  if (m.length > 0) {
                    const p = d[m[0]];
                    p.position && Array.isArray(p.position) && (t.layer2 = new h.Vector3(p.position[0], p.position[1], p.position[2]));
                  }
                }
                t.layer2 || (t.layer2 = this.getXKTModelPlaneIntersection(e));
              } else t.layer2 = this.getXKTModelPlaneIntersection(e);
            }
          }
        } catch (o) {
          console.warn("[DualCanvasViewer] xeokit拾取失败，使用回退方案:", o);
        }
        if (!t.layer2) {
          this.raycaster2.setFromCamera({
            x: e.x,
            y: e.y
          }, this.camera2), this.raycaster2.params.Mesh.threshold = 2;
          const o = this.raycaster2.intersectObjects(this.modelGroup2.children, !0);
          if (o.length > 0) {
            const i = o.find((n) => {
              const r = n.object;
              return !r.isHelper && !r.isLine && r.type !== "TransformControls" && r.type !== "TransformControlsPlane";
            });
            i && (t.layer2 = i.point);
          }
        }
      }
      return t;
    },
    getXKTModelPlaneIntersection(e) {
      let t = null, o = null;
      for (const l of this.modelGroup2.children) if (l.userData.isXKTModel && l.userData.boundingBox) {
        t = l.userData.boundingBox, o = l.position;
        break;
      }
      if (!t || !this.camera2) return null;
      this.raycaster2.setFromCamera({
        x: e.x,
        y: e.y
      }, this.camera2);
      const i = this.raycaster2.ray, n = new h.Vector3(), r = new h.Vector3();
      t.getCenter(n), t.getSize(r), o && n.add(o);
      const a = new h.Vector3().subVectors(this.camera2.position, n).normalize(), s = new h.Plane().setFromNormalAndCoplanarPoint(a, n), c = new h.Vector3();
      return i.intersectPlane(s, c), c;
    },
    updateViewportStatus() {
      if (this.viewportManager) {
        const e = this.viewportManager.virtualViewport.getBounds();
        this.viewportStatus.width = Math.round(e.width), this.viewportStatus.height = Math.round(e.height), this.viewportStatus.left = Math.round(e.left), this.viewportStatus.top = Math.round(e.top);
      }
    },
    toggleCoordinateDetails() {
      this.showCoordinateDetails = !this.showCoordinateDetails, console.log("[DualCanvasViewer] 切换坐标详情:", this.showCoordinateDetails);
    },
    formatWorldCoords(e) {
      return e ? `(${e.x.toFixed(1)}, ${e.y.toFixed(1)}, ${e.z.toFixed(1)})` : "N/A";
    },
    formatRealWorldCoords(e, t = null) {
      if (!e) return "N/A";
      let o = !1;
      if (t === "layer2" ? o = this.modelGroup2 && this.modelGroup2.children.some((s) => s.userData.isXKTModel) : t === "layer1" ? o = !1 : t || (o = this.modelGroup2 && this.modelGroup2.children.some((s) => s.userData.isXKTModel)), o) return `${e.x.toFixed(1)}m, ${e.y.toFixed(1)}m, ${e.z.toFixed(1)}m`;
      let i = {
        x: 0,
        y: 0,
        z: 0
      };
      if (this.modelGroup1 && this.modelGroup1.children.length > 0) {
        for (const s of this.modelGroup1.children) if (s.userData.originalCenter && !s.userData.isXKTModel) {
          s.userData.isLargeCoordModel && (i = s.userData.originalCenter);
          break;
        }
      }
      if (i.x === 0 && i.y === 0 && i.z === 0 && this.modelGroup2 && this.modelGroup2.children.length > 0) {
        for (const s of this.modelGroup2.children) if (s.userData.originalCenter && !s.userData.isXKTModel) {
          s.userData.isLargeCoordModel && (i = s.userData.originalCenter);
          break;
        }
      }
      const n = e.x + i.x, r = e.y + i.y, a = e.z + i.z;
      return `${n.toFixed(1)}m, ${r.toFixed(1)}m, ${a.toFixed(1)}m`;
    },
    hasXeokitModels() {
      return this.xeokitViewers && this.xeokitViewers.length > 0;
    },
    initModelInteraction() {
      console.log("[DualCanvasViewer] initModelInteraction 被调用，但 DualCanvasViewer 使用 initModelInteraction1 和 initModelInteraction2");
    },
    initThreeLayer() {
      console.log("[DualCanvasViewer] 正在初始化 Three.js 层 (原始模型)...");
      const e = this.$refs.threeContainer;
      if (!e) {
        console.error("[DualCanvasViewer] Three.js 容器未找到");
        return;
      }
      this.containerElement1 = e, this.scene1 = new h.Scene();
      const t = e.clientWidth || window.innerWidth, o = e.clientHeight || window.innerHeight;
      this.camera1 = new h.PerspectiveCamera(75, t / o, 0.1, 1e6), this.camera1.position.set(5, 5, 5), this.controls1 = new Ue(this.camera1, e), this.controls1.enableDamping = !1, this.controls1.dampingFactor = 0.05, this.modelGroup1 = new h.Group(), this.scene1.add(this.modelGroup1);
      const i = new h.AmbientLight(16777215, 0.6);
      this.scene1.add(i);
      const n = new h.DirectionalLight(16777215, 0.8);
      n.position.set(10, 10, 10), this.scene1.add(n);
      const r = new h.GridHelper(10, 10, 5163440, 3355494);
      if (this.gridHelper1 = r, this.scene1.add(r), this.gltfLoader1 = new He(), this.dracoLoader1 = new ze(), this.dracoLoader1.setDecoderPath("/cdn/jsm/libs/draco/"), this.dracoLoader1.preload(), this.gltfLoader1.setDRACOLoader(this.dracoLoader1), fe && fe.scenes && Array.isArray(fe.scenes))
        fe.addScene({
          element: e,
          scene: this.scene1,
          camera: this.camera1,
          controls: this.controls1
        }), this.usesRendererManager1 = !0;
      else {
        this.threeCanvas1 = document.createElement("canvas"), this.threeCanvas1.style.width = "100%", this.threeCanvas1.style.height = "100%", this.threeCanvas1.style.display = "block", e.appendChild(this.threeCanvas1), this.renderer1 = new h.WebGLRenderer({
          canvas: this.threeCanvas1,
          alpha: !0,
          antialias: !0,
          powerPreference: "high-performance"
        }), this.renderer1.setPixelRatio(window.devicePixelRatio), this.renderer1.setSize(e.clientWidth, e.clientHeight);
        try {
          const a = this.renderer1.getContext();
          a && (a.enable(a.DEPTH_TEST), a.depthFunc(a.GREATER), a.clearDepth(0), a.depthMask(!0), console.log("[DualCanvasViewer] ✅ renderer1 深度函数已设置为 GREATER（与 Cesium 兼容），清除深度=0.0"));
        } catch (a) {
          console.warn("[DualCanvasViewer] ⚠️ renderer1 深度函数设置失败:", a);
        }
        this.startAnimationLoop1(), this.usesRendererManager1 = !1;
      }
      this.controls1.addEventListener("change", () => {
        this._enforceSafeCameraPosition(), this.cameraSyncEnabled && this.syncDepth === 0 && (this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokit(), this.syncCameraFromThreeToBim());
      }), console.log("[DualCanvasViewer] Three.js 层 (原始模型) 初始化完成");
    },
    initBimLayer() {
      console.log("[DualCanvasViewer] 正在初始化 Three.js 层 (BIM 模型)...");
      const e = this.$refs.bimContainer;
      if (!e) {
        console.error("[DualCanvasViewer] BIM 容器未找到");
        return;
      }
      this.containerElement2 = e, this.scene2 = new h.Scene();
      const t = e.clientWidth || window.innerWidth, o = e.clientHeight || window.innerHeight;
      this.camera2 = new h.PerspectiveCamera(75, t / o, 0.1, 1e6), this.camera2.position.set(5, 5, 5), this.controls2 = new Ue(this.camera2, e), this.controls2.enableDamping = !1, this.controls2.dampingFactor = 0.05, this.modelGroup2 = new h.Group(), this.scene2.add(this.modelGroup2);
      const i = new h.AmbientLight(16777215, 0.6);
      this.scene2.add(i);
      const n = new h.DirectionalLight(16777215, 0.8);
      n.position.set(10, 10, 10), this.scene2.add(n);
      const r = new h.GridHelper(10, 10, 16739179, 3355494);
      this.gridHelper2 = r, this.scene2.add(r), this.gltfLoader2 = new He(), this.dracoLoader2 = new ze(), this.dracoLoader2.setDecoderPath("/cdn/jsm/libs/draco/"), this.dracoLoader2.preload(), this.gltfLoader2.setDRACOLoader(this.dracoLoader2), this.bimCanvas = document.createElement("canvas"), this.bimCanvas.style.width = "100%", this.bimCanvas.style.height = "100%", this.bimCanvas.style.display = "block", this.bimCanvas.style.zIndex = "1", e.appendChild(this.bimCanvas), this.renderer2 = new h.WebGLRenderer({
        canvas: this.bimCanvas,
        alpha: !0,
        antialias: !0,
        powerPreference: "high-performance"
      }), this.renderer2.setPixelRatio(window.devicePixelRatio), this.renderer2.setSize(e.clientWidth, e.clientHeight);
      try {
        const a = this.renderer2.getContext();
        a && (a.enable(a.DEPTH_TEST), a.depthFunc(a.GREATER), a.clearDepth(0), a.depthMask(!0), console.log("[DualCanvasViewer] ✅ renderer2 深度函数已设置为 GREATER（与 Cesium 兼容），清除深度=0.0"));
      } catch (a) {
        console.warn("[DualCanvasViewer] ⚠️ renderer2 深度函数设置失败:", a);
      }
      this.renderer2.setClearColor(0, 0), this.startAnimationLoop2(), this.controls2.addEventListener("change", () => {
        this.cameraSyncEnabled && this.syncDepth === 0 && (this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokit(), this.syncCameraFromBimToThree());
      }), console.log("[DualCanvasViewer] Three.js 层 (BIM 模型) 初始化完成");
    },
    initModelInteraction1() {
      if (console.log("[DualCanvasViewer] initModelInteraction1 开始执行"), console.log("[DualCanvasViewer] this.$refs.threeContainer:", this.$refs.threeContainer), console.log("[DualCanvasViewer] this.scene1:", this.scene1), console.log("[DualCanvasViewer] this.camera1:", this.camera1), console.log("[DualCanvasViewer] this.controls1:", this.controls1), console.log("[DualCanvasViewer] this.usesRendererManager1:", this.usesRendererManager1), !this.$refs.threeContainer) {
        console.warn("[DualCanvasViewer] 层 1 容器未找到，跳过交互初始化");
        return;
      }
      console.log("[DualCanvasViewer] 初始化层 1 模型交互...");
      let e = this.$refs.threeContainer;
      if (this.usesRendererManager1) {
        const t = this.$refs.threeContainer.querySelector("canvas");
        console.log("[DualCanvasViewer] 层 1 rendererManager 模式，找到 canvas:", t), t ? (e = t, console.log("[DualCanvasViewer] 层 1 使用 rendererManager 创建的 canvas 作为事件目标")) : console.warn("[DualCanvasViewer] 层 1 未找到 rendererManager 创建的 canvas，将使用容器作为事件目标");
      }
      this.eventTarget1 = e, console.log("[DualCanvasViewer] 层 1 事件目标:", e), console.log("[DualCanvasViewer] 层 1 创建 TransformControls..."), this.transformControls1 = new Oe(this.camera1, e), this.transformControls1.setSize(0.8), this.transformControls1.setSpace("world"), console.log("[DualCanvasViewer] 层 1 TransformControls 创建完成"), this.transformControls1.addEventListener("change", () => {
        const t = this.selectedModel1 && this.selectedModel1.userData.isSkinnedModel, o = this.transformControls1.dragging;
        if ((!t || o) && this.selectedModel1 && this.selectedModel1.userData._transformAnchor) {
          const i = this.selectedModel1.userData._transformAnchor, n = this.selectedModel1.userData._transformBottomOffset;
          this.selectedModel1.position.set(i.position.x - n.x, i.position.y - n.y, i.position.z - n.z);
        }
      }), this.transformControls1.addEventListener("dragging-changed", (t) => {
        this.controls1.enabled = !t.value;
      }), this.transformControls1.raycast = () => null, this.transformControls1.getHelper && (this.transformControls1.getHelper().raycast = () => null), typeof this.transformControls1.getHelper == "function" ? this.scene1.add(this.transformControls1.getHelper()) : this.scene1.add(this.transformControls1), console.log("[DualCanvasViewer] 层 1 添加事件监听器到:", e), e.addEventListener("pointerdown", this.onPointerDown1), e.addEventListener("click", this.onClick1), console.log("[DualCanvasViewer] 层 1 模型交互初始化完成，事件目标:", e.className || e.tagName);
    },
    initModelInteraction2() {
      if (!this.$refs.bimContainer) {
        console.warn("[DualCanvasViewer] 层 2 容器未找到，跳过交互初始化");
        return;
      }
      console.log("[DualCanvasViewer] 初始化层 2 模型交互...");
      let e = this.bimCanvas || this.$refs.bimContainer;
      if (!e || e === this.$refs.bimContainer) {
        const t = this.$refs.bimContainer.querySelector("canvas");
        t && (e = t, console.log("[DualCanvasViewer] 层 2 使用 canvas 作为事件目标"));
      }
      this.eventTarget2 = e, this.transformControls2 = new Oe(this.camera2, e), this.transformControls2.setSize(0.8), this.transformControls2.setSpace("world"), this.transformControls2.addEventListener("change", () => {
        const t = this.selectedModel2 && this.selectedModel2.userData.isSkinnedModel, o = this.transformControls2.dragging;
        if ((!t || o) && this.selectedModel2 && this.selectedModel2.userData._transformAnchor) {
          const i = this.selectedModel2.userData._transformAnchor, n = this.selectedModel2.userData._transformBottomOffset;
          this.selectedModel2.position.set(i.position.x - n.x, i.position.y - n.y, i.position.z - n.z);
        }
      }), this.transformControls2.addEventListener("dragging-changed", (t) => {
        this.controls2.enabled = !t.value;
      }), this.transformControls2.raycast = () => null, this.transformControls2.getHelper && (this.transformControls2.getHelper().raycast = () => null), typeof this.transformControls2.getHelper == "function" ? this.scene2.add(this.transformControls2.getHelper()) : this.scene2.add(this.transformControls2), e.addEventListener("pointerdown", this.onPointerDown2), e.addEventListener("click", this.onClick2), console.log("[DualCanvasViewer] 层 2 模型交互初始化完成，事件目标:", e.className || e.tagName);
    },
    initXeokitInteraction() {
      console.log("[DualCanvasViewer] 初始化 xeokit 交互..."), this.xeokitViewers && this.xeokitViewers.length > 0 ? this.xeokitViewers.forEach((e, t) => {
        const o = e.canvas, i = e.viewer;
        if (!o || !i) {
          console.warn("[DualCanvasViewer] xeokit viewer", t, "缺少 canvas 或 viewer");
          return;
        }
        o.removeEventListener("pointerdown", e._onPointerDown), o.removeEventListener("pointermove", e._onPointerMove), o.removeEventListener("pointerup", e._onPointerUp), e._onPointerDown = (n) => this.onXeokitPointerDown(n, e), e._onPointerMove = (n) => this.onXeokitPointerMove(n, e), e._onPointerUp = (n) => this.onXeokitPointerUp(n, e), o.addEventListener("pointerdown", e._onPointerDown), o.addEventListener("pointermove", e._onPointerMove), o.addEventListener("pointerup", e._onPointerUp), console.log("[DualCanvasViewer] xeokit viewer", t, "交互已初始化");
      }) : console.log("[DualCanvasViewer] 没有 xeokit viewers，跳过交互初始化");
    },
    onXeokitPointerDown(e, t) {
      if (this.isDraggingXeokit) return;
      const o = t.viewer, i = t.canvas.getBoundingClientRect(), n = e.clientX - i.left, r = e.clientY - i.top;
      console.log("[DualCanvasViewer] xeokit pointerDown at:", n, r);
      const a = o.scene.pick({ canvasPos: [n, r] });
      a && a.entity ? (console.log("[DualCanvasViewer] xeokit 选中实体:", a.entity.id), this.selectXeokitEntity(a.entity, t), this.isDraggingXeokit = !0, this.xeokitDragStartMouse = {
        x: e.clientX,
        y: e.clientY
      }, this.xeokitDragStartPos = {
        x: o.scene.position[0],
        y: o.scene.position[1],
        z: o.scene.position[2]
      }, t.viewer.cameraControl && (t.viewer.cameraControl.enabled = !1)) : (console.log("[DualCanvasViewer] xeokit 未选中任何实体"), this.deselectXeokitEntity());
    },
    onXeokitPointerMove(e, t) {
      if (!this.isDraggingXeokit || !this.selectedXeokitEntity) return;
      const o = t.viewer, i = e.clientX - this.xeokitDragStartMouse.x, n = e.clientY - this.xeokitDragStartMouse.y;
      if (Math.abs(i) < 3 && Math.abs(n) < 3) return;
      console.log("[DualCanvasViewer] xeokit 拖拽移动:", i, n);
      const r = o.camera, a = r.eye, s = r.look, c = r.up, l = [
        s[0] - a[0],
        s[1] - a[1],
        s[2] - a[2]
      ], g = Math.sqrt(l[0] ** 2 + l[1] ** 2 + l[2] ** 2);
      l[0] /= g, l[1] /= g, l[2] /= g;
      const u = [
        l[1] * c[2] - l[2] * c[1],
        l[2] * c[0] - l[0] * c[2],
        l[0] * c[1] - l[1] * c[0]
      ], d = 0.2, m = (i * u[0] - n * l[0]) * d, p = (i * u[2] - n * l[2]) * d, x = o.scene.models, f = Object.keys(x);
      if (f.length > 0) {
        const C = x[f[0]], M = C.position || [
          0,
          0,
          0
        ];
        console.group("🔍 [XKT拖拽调试] 鼠标移动 vs 模型移动"), console.log("📏 鼠标屏幕移动增量 (像素):"), console.log(`   deltaX: ${i.toFixed(2)} px`), console.log(`   deltaY: ${n.toFixed(2)} px`), console.log(`   鼠标总移动距离: ${Math.sqrt(i ** 2 + n ** 2).toFixed(2)} px`), console.log(""), console.log("🎮 计算参数:"), console.log(`   moveSpeed: ${d}`), console.log(`   forward: [${l.map((y) => y.toFixed(3)).join(", ")}]`), console.log(`   right: [${u.map((y) => y.toFixed(3)).join(", ")}]`), console.log(""), console.log("📐 计算的世界坐标移动量:"), console.log(`   moveX: ${m.toFixed(4)} (鼠标deltaX=${i.toFixed(2)} * right[0]=${u[0].toFixed(3)} * ${d})`), console.log(`   moveZ: ${p.toFixed(4)} (鼠标delta计算 * right[2]=${u[2].toFixed(3)} * ${d})`), console.log(""), console.log("📍 模型位置变化:"), console.log(`   当前位置: [${M.map((y) => y.toFixed(3)).join(", ")}]`), console.log(`   新位置:   [${(M[0] + m).toFixed(3)}, ${M[1].toFixed(3)}, ${(M[2] + p).toFixed(3)}]`), console.log(`   实际移动: moveX=${m.toFixed(4)}, moveZ=${p.toFixed(4)}`), console.log(`   移动比例: 鼠标${Math.sqrt(i ** 2 + n ** 2).toFixed(1)}px → 模型${Math.sqrt(m ** 2 + p ** 2).toFixed(4)}单位`), console.log(`   比例因子: 1px鼠标 ≈ ${(Math.sqrt(m ** 2 + p ** 2) / Math.sqrt(i ** 2 + n ** 2)).toFixed(4)} 单位`), console.groupEnd(), C.position = [
          M[0] + m,
          M[1],
          M[2] + p
        ], console.log("[DualCanvasViewer] xeokit 模型位置已更新:", C.position);
      }
    },
    onXeokitPointerUp(e, t) {
      this.isDraggingXeokit && (console.log("[DualCanvasViewer] xeokit 拖拽结束"), t.viewer.cameraControl && (t.viewer.cameraControl.enabled = !0), this.isDraggingXeokit = !1, this.xeokitDragStartMouse = null, this.xeokitDragStartPos = null);
    },
    selectXeokitEntity(e, t) {
      this.selectedXeokitEntity && this.deselectXeokitEntity(), console.log("[DualCanvasViewer] 选中 xeokit 实体:", e.id), this.selectedXeokitEntity = e, this.selectedXeokitViewer = t.viewer;
      const o = t.viewer;
      o.scene.highlighted && o.scene.setObjectsHighlighted([e.id], !0), o.scene.selected && o.scene.setObjectsSelected([e.id], !0);
    },
    deselectXeokitEntity() {
      this.selectedXeokitEntity && this.selectedXeokitViewer && (console.log("[DualCanvasViewer] 取消选中 xeokit 实体:", this.selectedXeokitEntity.id), this.selectedXeokitViewer.scene.highlighted && this.selectedXeokitViewer.scene.setObjectsHighlighted([this.selectedXeokitEntity.id], !1), this.selectedXeokitViewer.scene.selected && this.selectedXeokitViewer.scene.setObjectsSelected([this.selectedXeokitEntity.id], !1)), this.selectedXeokitEntity = null, this.selectedXeokitViewer = null;
    },
    syncXKTModelPositionToThree(e, t) {
      if (!this.modelGroup2) {
        console.warn("[DualCanvasViewer] modelGroup2 不存在，无法同步位置");
        return;
      }
      console.log("[DualCanvasViewer] 尝试同步位置，modelGroup2.children 数量:", this.modelGroup2.children.length), console.log("[DualCanvasViewer] xeokitViewer 信息:", {
        hasViewer: !!e,
        viewerId: e?.id,
        sceneId: e?.scene?.id
      });
      for (const o of this.modelGroup2.children) {
        if (!o.userData.isXKTModel) continue;
        const i = o.userData.xeokitViewer;
        if (console.log("[DualCanvasViewer] 检查模型:", {
          filePath: o.userData.filePath,
          hasXeokitViewer: !!i,
          storedViewerId: i?.id,
          storedSceneId: i?.scene?.id,
          viewerMatch: i === e,
          sceneMatch: i?.scene === e?.scene
        }), i === e || i?.scene === e?.scene || this.modelGroup2.children.filter((n) => n.userData.isXKTModel).length === 1) {
          o.position.set(t[0], t[1], t[2]), console.log("[DualCanvasViewer] ✅ 已同步 XKT 模型位置到 Three.js:", {
            fileName: o.userData.filePath,
            position: o.position
          });
          return;
        }
      }
      console.warn("[DualCanvasViewer] ❌ 未找到对应的 threeModel 进行位置同步", {
        xeokitViewersCount: this.xeokitViewers?.length,
        modelGroup2ChildrenCount: this.modelGroup2.children.length,
        xktModelCount: this.modelGroup2.children.filter((o) => o.userData.isXKTModel).length
      });
    },
    onPointerDown1(e) {
      if (console.log("[DualCanvasViewer] onPointerDown1 触发, activeLayer:", this.activeLayer, "button:", e.button), e.button !== 0) {
        console.log("[DualCanvasViewer] 非左键点击，跳过层1模型选择, button:", e.button);
        return;
      }
      try {
        if (this.transformControls1 && this.transformControls1.dragging) {
          console.log("[DualCanvasViewer] TransformControls1 正在拖拽");
          return;
        }
      } catch (i) {
        console.warn("[DualCanvasViewer] 检查 dragging 状态时出错:", i);
      }
      if (this.activeLayer === "both") {
        this.handleDualLayerSelection(e);
        return;
      }
      if (!this.modelGroup1 || !this.modelGroup1.children || this.modelGroup1.children.length === 0) {
        console.log("[DualCanvasViewer] 层 1 没有模型");
        return;
      }
      if (!this.camera1) {
        console.log("[DualCanvasViewer] 层 1 相机不存在");
        return;
      }
      if (this.viewportManager) {
        const i = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        this.mouse1.x = i.x, this.mouse1.y = i.y;
      } else {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，使用旧方法");
        const i = this.eventTarget1 || this.$refs.threeContainer;
        if (!i) {
          console.log("[DualCanvasViewer] 层 1 事件目标不存在");
          return;
        }
        const n = i.getBoundingClientRect();
        if (n.width === 0 || n.height === 0) {
          console.log("[DualCanvasViewer] 层 1 事件目标尺寸无效");
          return;
        }
        this.mouse1.x = (e.clientX - n.left) / n.width * 2 - 1, this.mouse1.y = -((e.clientY - n.top) / n.height) * 2 + 1;
      }
      console.log("[DualCanvasViewer] 层 1 鼠标坐标:", `(${this.mouse1.x.toFixed(2)}, ${this.mouse1.y.toFixed(2)})`);
      const t = this.getModelsByScreenDistance1();
      if (t.length > 0) {
        const i = t[0];
        console.log("[DualCanvasViewer] 层 1 屏幕空间检测命中:", i.object.userData.filePath, "屏幕距离:", i.screenDist), this.selectedModel1 !== i.object && this.selectModel1(i.object);
        return;
      }
      this.raycaster1.setFromCamera(this.mouse1, this.camera1), this.raycaster1.params.Line.threshold = 1, this.raycaster1.params.Points.threshold = 1, this.raycaster1.params.Mesh.threshold = 2;
      let o = this.raycaster1.intersectObjects(this.modelGroup1.children, !0);
      if (console.log("[DualCanvasViewer] 层 1 射线检测原始结果:", o.length, "个交点"), o = o.filter((i) => {
        const n = i.object;
        return !(n.type === "TransformControls" || n.type === "TransformControlsPlane" || n.name && n.name.includes("TransformControls") || n.isHelper || n.isLine);
      }), console.log("[DualCanvasViewer] 层 1 射线检测过滤后:", o.length, "个交点"), o.length > 0) {
        let i = o[0].object;
        for (; i.parent && i.parent !== this.modelGroup1; ) i = i.parent;
        this.selectedModel1 !== i && this.selectModel1(i);
      } else this.deselectModel1();
    },
    onPointerDown2(e) {
      if (console.log("[DualCanvasViewer] onPointerDown2 触发, activeLayer:", this.activeLayer, "button:", e.button), e.button !== 0) {
        console.log("[DualCanvasViewer] 非左键点击，跳过层2模型选择, button:", e.button);
        return;
      }
      try {
        if (this.transformControls2 && this.transformControls2.dragging) {
          console.log("[DualCanvasViewer] TransformControls2 正在拖拽，跳过");
          return;
        }
      } catch (i) {
        console.warn("[DualCanvasViewer] 检查 dragging 状态时出错:", i);
      }
      if (this.activeLayer === "both") {
        this.handleDualLayerSelection(e);
        return;
      }
      if (!this.modelGroup2 || !this.modelGroup2.children || this.modelGroup2.children.length === 0) {
        console.log("[DualCanvasViewer] 层 2 没有模型，跳过射线检测");
        return;
      }
      if (!this.camera2) {
        console.log("[DualCanvasViewer] 层 2 相机不存在，跳过射线检测");
        return;
      }
      if (this.modelGroup2.updateMatrixWorld(!0), this.viewportManager) {
        const i = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        this.mouse2.x = i.x, this.mouse2.y = i.y;
      } else {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，使用旧方法");
        const i = (this.eventTarget2 || this.$refs.bimContainer).getBoundingClientRect();
        if (i.width === 0 || i.height === 0) {
          console.log("[DualCanvasViewer] 层 2 容器尺寸无效，跳过射线检测");
          return;
        }
        this.mouse2.x = (e.clientX - i.left) / i.width * 2 - 1, this.mouse2.y = -((e.clientY - i.top) / i.height) * 2 + 1;
      }
      console.log("[DualCanvasViewer] 层 2 鼠标坐标:", `(${this.mouse2.x.toFixed(2)}, ${this.mouse2.y.toFixed(2)})`);
      const t = this.getModelsByScreenDistance2();
      if (t.length > 0) {
        const i = t[0];
        console.log("[DualCanvasViewer] 层 2 屏幕空间检测命中:", i.object.userData.filePath, "屏幕距离:", i.screenDist), this.selectedModel2 !== i.object && this.selectModel2(i.object);
        return;
      }
      this.raycaster2.setFromCamera(this.mouse2, this.camera2), this.raycaster2.params.Line.threshold = 1, this.raycaster2.params.Points.threshold = 1, this.raycaster2.params.Mesh.threshold = 2;
      let o = this.raycaster2.intersectObjects(this.modelGroup2.children, !0);
      if (console.log("[DualCanvasViewer] 层 2 射线检测原始结果:", o.length, "个交点"), o = o.filter((i) => {
        const n = i.object;
        return !(n.type === "TransformControls" || n.type === "TransformControlsPlane" || n.name && n.name.includes("TransformControls") || n.isHelper || n.isLine);
      }), console.log("[DualCanvasViewer] 层 2 射线检测过滤后:", o.length, "个交点"), o.length > 0) {
        let i = o[0].object;
        for (; i.parent && i.parent !== this.modelGroup2; ) i = i.parent;
        console.log("[DualCanvasViewer] 层 2 选中模型:", i.userData.filePath, "距离:", o[0].distance), this.selectedModel2 !== i && this.selectModel2(i);
      } else this.deselectModel2();
    },
    handleDualLayerSelection(e) {
      if (console.log("[DualCanvasViewer] handleDualLayerSelection - 双层模式选择"), e.button !== 0) {
        console.log("[DualCanvasViewer] 非左键点击，跳过模型选择, button:", e.button);
        return;
      }
      try {
        if (this.transformControls2 && this.transformControls2.dragging || this.transformControls1 && this.transformControls1.dragging) {
          console.log("[DualCanvasViewer] TransformControls 正在拖拽，跳过");
          return;
        }
      } catch (s) {
        console.warn("[DualCanvasViewer] 检查 dragging 状态时出错:", s);
      }
      this.modelGroup2 && this.modelGroup2.updateMatrixWorld(!0), this.modelGroup1 && this.modelGroup1.updateMatrixWorld(!0);
      let t, o;
      if (this.viewportManager) {
        const s = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        t = s.x, o = s.y;
      } else {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，使用旧方法");
        const s = this.$refs.eventContainer;
        if (!s) {
          console.warn("[DualCanvasViewer] 双层模式 - 事件层容器未找到");
          return;
        }
        const c = s.getBoundingClientRect();
        if (c.width === 0 || c.height === 0) {
          console.log("[DualCanvasViewer] 双层模式 - 事件层容器尺寸无效");
          return;
        }
        t = (e.clientX - c.left) / c.width * 2 - 1, o = -((e.clientY - c.top) / c.height) * 2 + 1;
      }
      console.log("[DualCanvasViewer] 双层模式 - 统一鼠标坐标:", `(${t.toFixed(2)}, ${o.toFixed(2)})`);
      let i = null, n = 1 / 0;
      if (this.modelGroup2 && this.modelGroup2.children && this.modelGroup2.children.length > 0 && this.camera2) {
        this.mouse2.x = t, this.mouse2.y = o;
        const s = this.getModelsByScreenDistance2();
        s.length > 0 ? (i = s[0].object, n = s[0].screenDist, console.log("[DualCanvasViewer] 双层模式 - 层 2 命中:", i.userData.filePath, "屏幕距离:", n)) : console.log("[DualCanvasViewer] 双层模式 - 层 2 未命中");
      }
      if (i) {
        console.log("[DualCanvasViewer] 双层模式 - BIM 层命中，当前选中:", this.selectedModel2?.userData.filePath), this.selectedModel2 !== i ? (console.log("[DualCanvasViewer] 双层模式 - 调用 selectModel2"), this.selectModel2(i)) : console.log("[DualCanvasViewer] 双层模式 - 模型已选中，跳过"), this.selectedModel1 && this.deselectModel1();
        return;
      }
      let r = null, a = 1 / 0;
      if (this.modelGroup1 && this.modelGroup1.children && this.modelGroup1.children.length > 0 && this.camera1) {
        this.mouse1.x = t, this.mouse1.y = o, console.log("[DualCanvasViewer] 双层模式 - 层 1 使用统一鼠标坐标:", `(${this.mouse1.x.toFixed(2)}, ${this.mouse1.y.toFixed(2)})`);
        const s = this.getModelsByScreenDistance1();
        s.length > 0 ? (r = s[0].object, a = s[0].screenDist, console.log("[DualCanvasViewer] 双层模式 - 层 1 命中:", r.userData.filePath, "屏幕距离:", a)) : console.log("[DualCanvasViewer] 双层模式 - 层 1 未命中");
      }
      if (r) {
        this.selectedModel1 !== r && this.selectModel1(r), this.selectedModel2 && this.deselectModel2();
        return;
      }
      console.log("[DualCanvasViewer] 双层模式 - 两层都未命中，取消选择"), this.selectedModel1 && this.deselectModel1(), this.selectedModel2 && this.deselectModel2();
    },
    trySelectModel1(e) {
      if (console.log("[DualCanvasViewer] trySelectModel1 - 开始尝试选择层 1 的模型"), !this.modelGroup1 || !this.modelGroup1.children || this.modelGroup1.children.length === 0) {
        console.log("[DualCanvasViewer] 层 1 没有模型");
        return;
      }
      if (!this.camera1) {
        console.log("[DualCanvasViewer] 层 1 相机不存在");
        return;
      }
      if (this.viewportManager) {
        const i = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        this.mouse1.x = i.x, this.mouse1.y = i.y;
      } else {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，使用旧方法");
        let i = this.$refs.threeContainer;
        if (this.usesRendererManager1) {
          const r = this.$refs.threeContainer.querySelector("canvas");
          r && (i = r);
        } else this.threeCanvas1 && (i = this.threeCanvas1);
        if (!i) {
          console.log("[DualCanvasViewer] 层 1 事件目标未找到");
          return;
        }
        const n = i.getBoundingClientRect();
        if (n.width === 0 || n.height === 0) {
          console.log("[DualCanvasViewer] 层 1 事件目标尺寸无效");
          return;
        }
        this.mouse1.x = (e.clientX - n.left) / n.width * 2 - 1, this.mouse1.y = -((e.clientY - n.top) / n.height) * 2 + 1, console.log("[DualCanvasViewer] trySelectModel1 - eventTarget:", i.tagName || i.className);
      }
      console.log("[DualCanvasViewer] trySelectModel1 - 层 1 鼠标坐标:", `(${this.mouse1.x.toFixed(2)}, ${this.mouse1.y.toFixed(2)})`);
      const t = this.getModelsByScreenDistance1();
      if (t.length > 0) {
        const i = t[0];
        console.log("[DualCanvasViewer] 层 1 屏幕空间检测命中:", i.object.userData.filePath, "屏幕距离:", i.screenDist), this.selectedModel1 !== i.object && this.selectModel1(i.object);
        return;
      }
      console.log("[DualCanvasViewer] 层 1 屏幕空间检测未命中"), this.raycaster1.setFromCamera(this.mouse1, this.camera1), this.raycaster1.params.Line.threshold = 1, this.raycaster1.params.Points.threshold = 1, this.raycaster1.params.Mesh.threshold = 2;
      let o = this.raycaster1.intersectObjects(this.modelGroup1.children, !0);
      if (o = o.filter((i) => {
        const n = i.object;
        return !(n.type === "TransformControls" || n.type === "TransformControlsPlane" || n.name && n.name.includes("TransformControls") || n.isHelper || n.isLine);
      }), console.log("[DualCanvasViewer] 层 1 射线检测结果:", o.length, "个交点"), o.length > 0) {
        let i = o[0].object;
        for (; i.parent && i.parent !== this.modelGroup1; ) i = i.parent;
        console.log("[DualCanvasViewer] 层 1 选中模型:", i.userData.filePath), this.selectedModel1 !== i && this.selectModel1(i);
      } else console.log("[DualCanvasViewer] 层 1 没有检测到任何模型");
    },
    selectModel1(e) {
      const t = this.getLayerConfig("three");
      t && this.selectModelGeneric(e, t);
    },
    selectModel2(e) {
      const t = this.getLayerConfig("bim");
      t && (this.selectModelGeneric(e, t), this.activeLayer === "both" && this.updatePointerEvents());
    },
    deselectModel1() {
      const e = this.getLayerConfig("three");
      e && this.deselectModelGeneric(e);
    },
    deselectModel2() {
      const e = this.getLayerConfig("bim");
      e && this.deselectModelGeneric(e);
    },
    onClick1(e) {
      try {
        if (this.transformControls1 && this.transformControls1.dragging) return;
      } catch (n) {
        console.warn("[DualCanvasViewer] 检查 dragging 状态时出错:", n);
      }
      const t = (this.eventTarget1 || this.$refs.threeContainer).getBoundingClientRect();
      this.mouse1.x = (e.clientX - t.left) / t.width * 2 - 1, this.mouse1.y = -((e.clientY - t.top) / t.height) * 2 + 1;
      const o = this.getModelsByScreenDistance1();
      let i = [];
      this.activeLayer === "both" && (i = this.getModelsByScreenDistance2()), o.length === 0 && i.length === 0 && (this.deselectModel1(), this.activeLayer === "both" && this.deselectModel2());
    },
    onClick2(e) {
      try {
        if (this.transformControls2 && this.transformControls2.dragging) return;
      } catch (n) {
        console.warn("[DualCanvasViewer] 检查 dragging 状态时出错:", n);
      }
      const t = (this.eventTarget2 || this.$refs.bimContainer).getBoundingClientRect();
      this.mouse2.x = (e.clientX - t.left) / t.width * 2 - 1, this.mouse2.y = -((e.clientY - t.top) / t.height) * 2 + 1;
      const o = this.getModelsByScreenDistance2();
      let i = [];
      this.activeLayer === "both" && (i = this.getModelsByScreenDistance1()), o.length === 0 && i.length === 0 && (this.deselectModel2(), this.activeLayer === "both" && this.deselectModel1());
    },
    highlightModel1(e, t) {
      this.highlightModelGeneric(e, t);
    },
    highlightModel2(e, t) {
      this.highlightModelGeneric(e, t);
    },
    getModelsByScreenDistance1() {
      const e = [], t = this.modelGroup1.children.filter((o) => o.visible);
      return console.log("[DualCanvasViewer] getModelsByScreenDistance1 - 总模型数:", this.modelGroup1.children.length, "可见模型数:", t.length), console.log("[DualCanvasViewer] getModelsByScreenDistance1 - 鼠标坐标:", `(${this.mouse1.x.toFixed(3)}, ${this.mouse1.y.toFixed(3)})`), console.log("[DualCanvasViewer] getModelsByScreenDistance1 - 相机位置:", this.camera1.position), this.modelGroup1.children.forEach((o, i) => {
        console.log(`[DualCanvasViewer] 模型${i}:`, {
          name: o.userData?.filePath || o.name || "unnamed",
          visible: o.visible,
          position: o.position,
          scale: o.scale,
          children: o.children.length
        });
        const n = new h.Box3().setFromObject(o);
        console.log(`[DualCanvasViewer] 模型${i} 边界框:`, {
          min: `(${n.min.x.toFixed(2)}, ${n.min.y.toFixed(2)}, ${n.min.z.toFixed(2)})`,
          max: `(${n.max.x.toFixed(2)}, ${n.max.y.toFixed(2)}, ${n.max.z.toFixed(2)})`,
          center: `(${n.getCenter(new h.Vector3()).x.toFixed(2)}, ${n.getCenter(new h.Vector3()).y.toFixed(2)}, ${n.getCenter(new h.Vector3()).z.toFixed(2)})`
        });
      }), this.modelGroup1.children.forEach((o) => {
        if (!o.visible) return;
        o.userData.isSkinnedModel && o.traverse((n) => {
          n.isSkinnedMesh && n.skeleton && n.skeleton.bones.forEach((r) => r.updateMatrixWorld());
        }), this.raycaster1.setFromCamera(this.mouse1, this.camera1), this.raycaster1.params.Line.threshold = 2, this.raycaster1.params.Points.threshold = 2, this.raycaster1.params.Mesh.threshold = 2;
        let i = this.raycaster1.intersectObject(o, !0);
        if (i = i.filter((n) => {
          const r = n.object;
          return !(r.type === "TransformControls" || r.type === "TransformControlsPlane" || r.name && r.name.includes("TransformControls") || r.isHelper || r.isLine);
        }), i.length > 0) {
          i.sort((c, l) => c.distance - l.distance);
          const n = i[0], r = n.distance, a = this.projectLargeCoordinate(n.point, this.camera1), s = Math.sqrt(Math.pow(a.x - this.mouse1.x, 2) + Math.pow(a.y - this.mouse1.y, 2));
          console.log("[DualCanvasViewer] 层 1 射线检测命中:", o.userData.filePath, "距离:", n.distance.toFixed(2), "交点数:", i.length), e.push({
            object: o,
            point: n.point,
            distance: r,
            screenDist: s
          });
        } else if (console.log("[DualCanvasViewer] 层 1 射线检测未命中:", o.userData.filePath), o.userData.isSkinnedModel || o.userData.isLargeCoordModel) {
          const n = o.userData.isLargeCoordModel ? "大坐标模型" : "骨骼模型";
          console.log(`[DualCanvasViewer] 层 1 使用包围盒备选方案检测${n}`);
          const r = new h.Box3();
          if (r.setFromObject(o), !r.isEmpty()) {
            const a = [
              new h.Vector3(r.min.x, r.min.y, r.min.z),
              new h.Vector3(r.min.x, r.min.y, r.max.z),
              new h.Vector3(r.min.x, r.max.y, r.min.z),
              new h.Vector3(r.min.x, r.max.y, r.max.z),
              new h.Vector3(r.max.x, r.min.y, r.min.z),
              new h.Vector3(r.max.x, r.min.y, r.max.z),
              new h.Vector3(r.max.x, r.max.y, r.min.z),
              new h.Vector3(r.max.x, r.max.y, r.max.z)
            ];
            let s = 1 / 0, c = -1 / 0, l = 1 / 0, g = -1 / 0, u = 0;
            if (a.forEach((d) => {
              const m = this.projectLargeCoordinate(d, this.camera1);
              m.z < 1 && (s = Math.min(s, m.x), c = Math.max(c, m.x), l = Math.min(l, m.y), g = Math.max(g, m.y), u++);
            }), u > 0) {
              const m = this.mouse1.x >= s - 0.4 && this.mouse1.x <= c + 0.4 && this.mouse1.y >= l - 0.4 && this.mouse1.y <= g + 0.4;
              if (console.log("[DualCanvasViewer] 层 1 包围盒检测:", m ? "命中" : "未命中", {
                boxRange: `x:[${s.toFixed(2)}, ${c.toFixed(2)}], y:[${l.toFixed(2)}, ${g.toFixed(2)}]`,
                mouse: `(${this.mouse1.x.toFixed(2)}, ${this.mouse1.y.toFixed(2)})`,
                padding: 0.4
              }), m) {
                const p = new h.Vector3();
                r.getCenter(p);
                const x = p.distanceTo(this.camera1.position), f = this.projectLargeCoordinate(p, this.camera1), C = Math.sqrt(Math.pow(f.x - this.mouse1.x, 2) + Math.pow(f.y - this.mouse1.y, 2));
                e.push({
                  object: o,
                  point: p,
                  distance: x,
                  screenDist: C
                });
              }
            }
          }
        }
      }), e.sort((o, i) => o.screenDist - i.screenDist), e;
    },
    getModelsByScreenDistance2() {
      const e = [], t = this.modelGroup2.children.filter((o) => o.visible);
      return console.log("[DualCanvasViewer] getModelsByScreenDistance2 - 总模型数:", this.modelGroup2.children.length, "可见模型数:", t.length), console.log("[DualCanvasViewer] getModelsByScreenDistance2 - 鼠标坐标:", `(${this.mouse2.x.toFixed(3)}, ${this.mouse2.y.toFixed(3)})`), console.log("[DualCanvasViewer] getModelsByScreenDistance2 - 相机位置:", this.camera2.position), this.modelGroup2.children.forEach((o) => {
        if (!o.visible) return;
        o.userData.isSkinnedModel && o.traverse((n) => {
          n.isSkinnedMesh && n.skeleton && n.skeleton.bones.forEach((r) => r.updateMatrixWorld());
        }), this.raycaster2.setFromCamera(this.mouse2, this.camera2), this.raycaster2.params.Line.threshold = 2, this.raycaster2.params.Points.threshold = 2, this.raycaster2.params.Mesh.threshold = 2;
        let i = this.raycaster2.intersectObject(o, !0);
        if (i = i.filter((n) => {
          const r = n.object;
          return !(r.type === "TransformControls" || r.type === "TransformControlsPlane" || r.name && r.name.includes("TransformControls") || r.isHelper || r.isLine);
        }), i.length > 0) {
          i.sort((c, l) => c.distance - l.distance);
          const n = i[0], r = n.distance, a = this.projectLargeCoordinate(n.point, this.camera2), s = Math.sqrt(Math.pow(a.x - this.mouse2.x, 2) + Math.pow(a.y - this.mouse2.y, 2));
          console.log("[DualCanvasViewer] 层 2 射线检测命中:", o.userData.filePath, "距离:", n.distance.toFixed(2), "交点数:", i.length), e.push({
            object: o,
            point: n.point,
            distance: r,
            screenDist: s
          });
        } else if (console.log("[DualCanvasViewer] 层 2 射线检测未命中:", o.userData.filePath), o.userData.isSkinnedModel) {
          console.log("[DualCanvasViewer] 层 2 使用包围盒备选方案检测骨骼模型");
          const n = new h.Box3();
          if (n.setFromObject(o), !n.isEmpty()) {
            const r = [
              new h.Vector3(n.min.x, n.min.y, n.min.z),
              new h.Vector3(n.min.x, n.min.y, n.max.z),
              new h.Vector3(n.min.x, n.max.y, n.min.z),
              new h.Vector3(n.min.x, n.max.y, n.max.z),
              new h.Vector3(n.max.x, n.min.y, n.min.z),
              new h.Vector3(n.max.x, n.min.y, n.max.z),
              new h.Vector3(n.max.x, n.max.y, n.min.z),
              new h.Vector3(n.max.x, n.max.y, n.max.z)
            ];
            let a = 1 / 0, s = -1 / 0, c = 1 / 0, l = -1 / 0, g = 0;
            if (r.forEach((u) => {
              const d = this.projectLargeCoordinate(u, this.camera2);
              d.z < 1 && (a = Math.min(a, d.x), s = Math.max(s, d.x), c = Math.min(c, d.y), l = Math.max(l, d.y), g++);
            }), g > 0) {
              const d = this.mouse2.x >= a - 0.15 && this.mouse2.x <= s + 0.15 && this.mouse2.y >= c - 0.15 && this.mouse2.y <= l + 0.15;
              if (console.log("[DualCanvasViewer] 层 2 包围盒检测:", d ? "命中" : "未命中", {
                boxRange: `x:[${a.toFixed(2)}, ${s.toFixed(2)}], y:[${c.toFixed(2)}, ${l.toFixed(2)}]`,
                mouse: `(${this.mouse2.x.toFixed(2)}, ${this.mouse2.y.toFixed(2)})`,
                padding: 0.15
              }), d) {
                const m = new h.Vector3();
                n.getCenter(m);
                const p = m.distanceTo(this.camera2.position), x = this.projectLargeCoordinate(m, this.camera2), f = Math.sqrt(Math.pow(x.x - this.mouse2.x, 2) + Math.pow(x.y - this.mouse2.y, 2));
                e.push({
                  object: o,
                  point: m,
                  distance: p,
                  screenDist: f
                });
              }
            }
          }
        }
      }), e.sort((o, i) => o.screenDist - i.screenDist), e;
    },
    updateClickableCenter1() {
      const e = this.getLayerConfig("three");
      e && this.updateSkinnedModelClickableCenterGeneric(e);
    },
    updateClickableCenter2() {
      const e = this.getLayerConfig("bim");
      e && this.updateSkinnedModelClickableCenterGeneric(e);
    },
    setupCameraSync() {
      console.log("[DualCanvasViewer] 正在设置相机同步..."), setTimeout(() => {
        this.syncCameraFromThreeToBim();
      }, 100);
    },
    startAnimationLoop1() {
      const e = () => {
        if (!this.renderer1 || !this.scene1 || !this.camera1) return;
        this.animationFrame1 = requestAnimationFrame(e), this.controls1 && this.controls1.update();
        const t = this.clock1.getDelta();
        this.updateAnimations1(t);
        const o = typeof window < "u" && window.__syncManager__, i = o && o.mercatorProjection && o.mercatorProjection.isUsingLocalCoordinateSystem && o.mercatorProjection.isUsingLocalCoordinateSystem(), n = o && o.mercatorProjection && o.mercatorProjection.getDualFloorHeight ? o.mercatorProjection.getDualFloorHeight() : 0, r = !i || n <= 0.01;
        this.sceneRotationEnabled && this.sceneRotationInitialized && this.cesiumViewer && r && (this.sceneRotation.updateSceneRotation(this.cesiumViewer.camera), this.sceneContainer2 && this.sceneContainer1 && (this.sceneContainer2.quaternion.copy(this.sceneContainer1.quaternion), this.sceneContainer2.updateMatrixWorld(!0)), this.anchorContainer1 && (this.anchorContainer1.quaternion.set(0, 0, 0, 1), this.anchorContainer1.updateMatrixWorld(!0)), this.anchorContainer2 && (this.anchorContainer2.quaternion.set(0, 0, 0, 1), this.anchorContainer2.updateMatrixWorld(!0)));
        const a = this.$refs.threeContainer;
        if (a) {
          const s = a.clientWidth, c = a.clientHeight;
          (this.renderer1.domElement.width !== s || this.renderer1.domElement.height !== c) && (this.renderer1.setSize(s, c, !1), this.camera1.aspect = s / c, this.camera1.updateProjectionMatrix());
        }
        this.renderer1.render(this.scene1, this.camera1);
      };
      e();
    },
    startAnimationLoop2() {
      const e = () => {
        if (!this.renderer2 || !this.scene2 || !this.camera2) return;
        this.animationFrame2 = requestAnimationFrame(e), this.controls2 && this.controls2.update();
        const t = this.clock2.getDelta();
        this.updateAnimations2(t);
        const o = this.$refs.bimContainer;
        if (o) {
          const i = o.clientWidth, n = o.clientHeight;
          (this.renderer2.domElement.width !== i || this.renderer2.domElement.height !== n) && (this.renderer2.setSize(i, n, !1), this.camera2.aspect = i / n, this.camera2.updateProjectionMatrix());
        }
        this.renderer2.render(this.scene2, this.camera2);
      };
      e();
    },
    updateAnimations1(e) {
      for (const t of this.animationMixers1) t.update(e);
      this.updateSkinnedModelAnchor1(), this.updateClickableCenter1();
    },
    updateAnimations2(e) {
      for (const t of this.animationMixers2) t.update(e);
      this.updateSkinnedModelAnchor2(), this.updateClickableCenter2();
    },
    updateXeokitBoundingBox() {
      !this.xktBoundingBoxHelpers || this.xktBoundingBoxHelpers.length === 0 || this.xktBoundingBoxHelpers.forEach((e) => {
        if (!e.helper || !e.box) return;
        const t = this.xeokitViewers && this.xeokitViewers.find((n) => n.viewer && e.xeokitLayerId && n.viewer.scene.models[e.xeokitLayerId]);
        if (!t || !t.viewer) return;
        const o = t.viewer.scene.models, i = Object.keys(o);
        if (i.length > 0) {
          const n = o[i[0]];
          if (n && n.aabb) {
            const r = n.aabb, a = {
              x: r[0],
              y: r[1],
              z: r[2]
            }, s = {
              x: r[3],
              y: r[4],
              z: r[5]
            }, c = {
              x: a.x,
              y: a.y,
              z: -a.z
            }, l = {
              x: s.x,
              y: s.y,
              z: -s.z
            }, g = new h.Vector3(Math.min(c.x, l.x), Math.min(c.y, l.y), Math.min(c.z, l.z)), u = new h.Vector3(Math.max(c.x, l.x), Math.max(c.y, l.y), Math.max(c.z, l.z));
            e.box.set(g, u);
            const d = e.helper;
            d.parent && d.parent.remove(d);
            const m = new h.Box3Helper(e.box, 65280);
            m.name = d.name, m.userData = { ...d.userData }, m.renderOrder = d.renderOrder, e.helper = m, e.model && e.model.parent ? e.model.parent.add(m) : this.modelGroup2 && this.modelGroup2.add(m);
          }
        }
      });
    },
    updateSkinnedModelAnchor1() {
      const e = this.getLayerConfig("three");
      e && this.updateSkinnedModelAnchorGeneric(e);
    },
    updateSkinnedModelAnchor2() {
      const e = this.getLayerConfig("bim");
      e && this.updateSkinnedModelAnchorGeneric(e);
    },
    _enforceSafeCameraPosition() {
      if (!this.camera1 || !this.controls1 || this._isEnforcingSafePosition) return;
      const e = 10, t = -100, o = 500;
      let i = !1;
      try {
        this._isEnforcingSafePosition = !0, this.camera1.position.y < e && (console.warn("[DualCanvasViewer._enforceSafeCameraPosition] ⚠️ 相机Y坐标过低，强制修正:", {
          原始相机Y: this.camera1.position.y.toFixed(2),
          修正后相机Y: e.toFixed(2),
          相机位置: `(${this.camera1.position.x.toFixed(2)}, ${this.camera1.position.y.toFixed(2)}, ${this.camera1.position.z.toFixed(2)})`
        }), this.camera1.position.y = e, i = !0), this.controls1.target && (this.controls1.target.y < t && (console.warn("[DualCanvasViewer._enforceSafeCameraPosition] ⚠️ target Y坐标过低，强制修正:", {
          原始targetY: this.controls1.target.y.toFixed(2),
          修正后targetY: t.toFixed(2),
          target位置: `(${this.controls1.target.x.toFixed(2)}, ${this.controls1.target.y.toFixed(2)}, ${this.controls1.target.z.toFixed(2)})`
        }), this.controls1.target.y = t, i = !0), this.controls1.target.y > o && (console.warn("[DualCanvasViewer._enforceSafeCameraPosition] ⚠️ target Y坐标过高，强制修正:", {
          原始targetY: this.controls1.target.y.toFixed(2),
          修正后targetY: o.toFixed(2),
          target位置: `(${this.controls1.target.x.toFixed(2)}, ${this.controls1.target.y.toFixed(2)}, ${this.controls1.target.z.toFixed(2)})`
        }), this.controls1.target.y = o, i = !0)), i && console.log("[DualCanvasViewer._enforceSafeCameraPosition] ✅ 已修正相机位置:", {
          相机位置: `(${this.camera1.position.x.toFixed(2)}, ${this.camera1.position.y.toFixed(2)}, ${this.camera1.position.z.toFixed(2)})`,
          target: this.controls1.target ? `(${this.controls1.target.x.toFixed(2)}, ${this.controls1.target.y.toFixed(2)}, ${this.controls1.target.z.toFixed(2)})` : "null"
        });
      } finally {
        this._isEnforcingSafePosition = !1;
      }
    },
    syncCameraFromThreeToBim() {
      if (this.syncDepth > 0 || !this.camera2 || !this.camera1) return;
      const e = typeof window < "u" && window.__syncManager__;
      if (e && e.mercatorProjection && e.mercatorProjection.isUsingLocalCoordinateSystem && e.mercatorProjection.isUsingLocalCoordinateSystem()) {
        console.log("[DualCanvasViewer] 局部坐标系模式：跳过层1→层2的相机同步，由 SyncManager 统一管理");
        return;
      }
      this.syncDepth++;
      try {
        const t = this.controls2 ? this.controls2.enabled : !1;
        this.controls2 && (this.controls2.enabled = !1), this.camera2.position.copy(this.camera1.position), this.camera2.rotation.copy(this.camera1.rotation), this.camera2.quaternion.copy(this.camera1.quaternion), this.camera2.zoom = this.camera1.zoom, this.camera2.fov = this.camera1.fov, this.camera2.near = this.camera1.near, this.camera2.far = this.camera1.far, this.camera2.aspect = this.camera1.aspect, this.camera2.updateProjectionMatrix(), this.controls2 && this.controls1 && this.controls2.target.copy(this.controls1.target), this.camera2.updateMatrixWorld(), this.controls2 && (this.controls2.enabled = t), this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokitInternal(), console.log("[DualCanvasViewer] 相机同步 层1→层2:", {
          position: this.camera2.position,
          rotation: this.camera2.rotation,
          zoom: this.camera2.zoom,
          fov: this.camera2.fov
        });
      } finally {
        requestAnimationFrame(() => {
          this.syncDepth--;
        });
      }
    },
    syncCameraFromBimToThree() {
      if (this.syncDepth > 0 || !this.camera1 || !this.camera2) return;
      const e = typeof window < "u" && window.__syncManager__;
      if (e && e.mercatorProjection && e.mercatorProjection.isUsingLocalCoordinateSystem && e.mercatorProjection.isUsingLocalCoordinateSystem()) {
        console.log("[DualCanvasViewer] 局部坐标系模式：跳过层2→层1的相机同步，保持层1为主导");
        return;
      }
      this.syncDepth++;
      try {
        const t = this.controls1 ? this.controls1.enabled : !1;
        this.controls1 && (this.controls1.enabled = !1), this.camera1.position.copy(this.camera2.position), this.camera1.rotation.copy(this.camera2.rotation), this.camera1.quaternion.copy(this.camera2.quaternion), this.camera1.zoom = this.camera2.zoom, this.camera1.fov = this.camera2.fov, this.camera1.near = this.camera2.near, this.camera1.far = this.camera2.far, this.camera1.aspect = this.camera2.aspect, this.camera1.updateProjectionMatrix(), this.controls1 && this.controls2 && this.controls1.target.copy(this.controls2.target), this.camera1.updateMatrixWorld(), this.controls1 && (this.controls1.enabled = t), console.log("[DualCanvasViewer] 相机同步 层2→层1:", {
          position: this.camera1.position,
          rotation: this.camera1.rotation,
          zoom: this.camera1.zoom,
          fov: this.camera1.fov
        });
      } finally {
        this.syncDepth--;
      }
    },
    syncXeokitCameraToThreeInternal() {
      if (!this.xeokitViewers || this.xeokitViewers.length === 0) return;
      const e = typeof window < "u" && window.__syncManager__;
      if (e && e.mercatorProjection && e.mercatorProjection.isUsingLocalCoordinateSystem && e.mercatorProjection.isUsingLocalCoordinateSystem()) {
        console.log("[DualCanvasViewer] 局部坐标系模式：跳过 xeokit 相机同步，保持 camera2 与 camera1 一致"), this.camera1 && this.camera2 && (this.camera2.position.copy(this.camera1.position), this.camera2.quaternion.copy(this.camera1.quaternion), this.controls2 && this.controls1 && this.controls2.target.copy(this.controls1.target));
        return;
      }
      const t = this.xeokitViewers[0];
      if (!t || !t.viewer || !t.viewer.camera) return;
      const o = t.viewer.camera;
      this.camera2.position.set(o.eye[0], o.eye[1], o.eye[2]), new h.Vector3(o.eye[0], o.eye[1], o.eye[2]);
      const i = new h.Vector3(o.look[0], o.look[1], o.look[2]), n = new h.Vector3(o.up[0], o.up[1], o.up[2]);
      this.camera2.up.copy(n), this.camera2.lookAt(i), this.controls2 && this.controls2.target.copy(i), console.log("[DualCanvasViewer] xeokit 相机已同步到 Three.js (内部)");
    },
    syncXeokitCameraToThree() {
      this.isSyncingCamera || this.syncXeokitCameraToThreeInternal();
    },
    syncCameraToXeokitInternal() {
      if (!this.xeokitViewers || this.xeokitViewers.length === 0) return;
      let e, t;
      if (this.activeLayer === "three" ? (e = this.camera1, t = this.controls1) : (e = this.camera2, t = this.controls2), !e) return;
      const o = e.position;
      let i;
      if (t && t.target) i = t.target;
      else {
        const r = new h.Vector3();
        e.getWorldDirection(r), i = o.clone().add(r);
      }
      const n = e.up;
      this.xeokitViewers.forEach((r, a) => {
        if (!r || !r.viewer || !r.viewer.camera || !r.viewer.scene || r.viewer.scene.destroyed) return;
        const s = r.viewer.camera;
        try {
          s.eye = [
            o.x,
            o.y,
            o.z
          ], s.look = [
            i.x,
            i.y,
            i.z
          ], s.up = [
            n.x,
            n.y,
            n.z
          ], console.log(`[DualCanvasViewer] xeokit viewer #${a} 相机坐标:`, {
            eye: `(${s.eye[0].toFixed(2)}, ${s.eye[1].toFixed(2)}, ${s.eye[2].toFixed(2)})`,
            look: `(${s.look[0].toFixed(2)}, ${s.look[1].toFixed(2)}, ${s.look[2].toFixed(2)})`,
            threeJSEye: `(${o.x.toFixed(2)}, ${o.y.toFixed(2)}, ${o.z.toFixed(2)})`,
            threeJSLook: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`
          }), e.fov && s.projection && (s.projection = "ortho", s.projection = "perspective", s.fov = e.fov), console.log(`[DualCanvasViewer] Three.js 相机已同步到 xeokit viewer #${a} (内部)`);
        } catch (c) {
          console.warn(`[DualCanvasViewer] 同步到 xeokit viewer #${a} 失败:`, c.message);
        }
      }), console.log(`[DualCanvasViewer] Three.js 相机已同步到所有 ${this.xeokitViewers.length} 个 xeokit viewers（含 FOV）(内部)`);
    },
    syncCameraToXeokit() {
      this.isSyncingCamera || this.syncCameraToXeokitInternal();
    },
    adjustCameraFarForLargeCoords() {
      const e = [
        ...this.modelGroup1?.children || [],
        ...this.modelGroup2?.children || [],
        ...this.xeokitViewers || []
      ];
      if (e.length === 0) return;
      const t = new h.Box3();
      let o = !1;
      for (const a of e) {
        let s;
        if (a.viewer && a.viewer.scene) {
          const c = a.viewer, l = this.xeokitViewers.find((g) => g.viewer === c);
          l && l.threeModel && l.threeModel.userData.boundingBox && (s = l.threeModel.userData.boundingBox.clone(), o = !0);
        } else a.userData && a.userData.boundingBox && (s = a.userData.boundingBox.clone(), o = !0);
        s && !s.isEmpty() && t.union(s);
      }
      if (!o || t.isEmpty()) {
        console.log("[DualCanvasViewer] 无法计算模型边界框，跳过 far 调整");
        return;
      }
      const i = new h.Vector3();
      t.getSize(i);
      const n = Math.max(i.x, i.y, i.z), r = Math.max(5e4, n * 100);
      console.log("[DualCanvasViewer] 调整相机far值以支持大坐标模型:", {
        maxDim: n.toFixed(2),
        oldFar1: this.camera1?.far,
        oldFar2: this.camera2?.far,
        newFar: r
      }), this.camera1 && (this.camera1.far = r, this.camera1.updateProjectionMatrix(), console.log("[DualCanvasViewer] Three.js相机1 far已调整为:", r)), this.camera2 && (this.camera2.far = r, this.camera2.updateProjectionMatrix(), console.log("[DualCanvasViewer] Three.js相机2 far已调整为:", r));
    },
    selectModelGeneric(e, t) {
      const o = t.id, i = t.index, n = t.scene(), r = t.transformControls();
      this.deselectModelGeneric(t), console.log(`[DualCanvasViewer] selectModel (层${i}) called with:`, e.userData.filePath, "isSkinnedModel:", e.userData.isSkinnedModel);
      const a = this.computeModelBoundingBox(e);
      if (!a) {
        console.warn("[DualCanvasViewer] 无法计算模型边界框");
        return;
      }
      console.log(`[DualCanvasViewer] selectModel (层${i}) box:`, {
        min: `(${a.min.x.toFixed(4)}, ${a.min.y.toFixed(4)}, ${a.min.z.toFixed(4)})`,
        max: `(${a.max.x.toFixed(4)}, ${a.max.y.toFixed(4)}, ${a.max.z.toFixed(4)})`,
        isEmpty: a.isEmpty()
      });
      const s = this.computeModelBottom(a);
      console.log(`[DualCanvasViewer] selectModel (层${i}) bottom:`, `(${s.x.toFixed(4)}, ${s.y.toFixed(4)}, ${s.z.toFixed(4)})`);
      const c = new h.Object3D();
      c.position.copy(s), n.add(c), e.userData._transformAnchor = c, e.userData._transformBottomOffset = new h.Vector3(s.x - e.position.x, s.y - e.position.y, s.z - e.position.z), t.setSelectedModel(e), r.attach(c), console.log(`[DualCanvasViewer] TransformControls attached to anchor at model bottom (层${i}):`, s);
      const l = typeof window < "u" && window.__syncManager__ && window.__syncManager__.mercatorProjection && window.__syncManager__.mercatorProjection.isUsingLocalCoordinateSystem && window.__syncManager__.mercatorProjection.isUsingLocalCoordinateSystem(), g = o === "three" ? this.controls1 : this.controls2;
      if (g) if (l) {
        const u = new h.Vector3();
        g.object.getWorldDirection(u);
        const d = g.object.position.distanceTo(s), m = g.object.position.y, p = Math.min(d, m * 0.9), x = new h.Vector3(g.object.position.x + u.x * p, g.object.position.y + u.y * p, g.object.position.z + u.z * p);
        g.target.copy(x), console.log("[DualCanvasViewer] 局部坐标模式：使用相机方向推算 target", {
          新target: `(${x.x.toFixed(2)}, ${x.y.toFixed(2)}, ${x.z.toFixed(2)})`,
          距离: p.toFixed(2),
          说明: "保持相机当前俯仰角度"
        });
      } else
        g.target.copy(s), console.log(`[DualCanvasViewer] 非局部坐标模式：更新 controls${i}.target 到模型底部:`, `(${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`);
      l && g && (console.log("[DualCanvasViewer] 局部坐标模式：选中模型后立即同步 unifiedCameraState.target"), window.__syncManager__ && typeof window.__syncManager__.syncTargetFromControls == "function" ? window.__syncManager__.syncTargetFromControls(g) : window.__syncManager__ && typeof window.__syncManager__.reinitUnifiedState == "function" && window.__syncManager__.reinitUnifiedState()), this.highlightModelGeneric(e, !0), this.updateLargeCoordModelSelectedState();
    },
    deselectModelGeneric(e) {
      const t = e.selectedModel(), o = e.scene(), i = e.transformControls(), n = e.id;
      t && (this.highlightModelGeneric(t, !1), t.userData._transformAnchor && (o.remove(t.userData._transformAnchor), delete t.userData._transformAnchor), delete t.userData._transformBottomOffset, i.detach(), e.setSelectedModel(null), console.log(`[DualCanvasViewer] 层 ${n} 已取消选择`), n === "bim" && this.activeLayer === "both" && this.updatePointerEvents()), this.updateLargeCoordModelSelectedState();
    },
    highlightModelGeneric(e, t) {
      if (e.userData.isLargeCoordModel) {
        console.log("[DualCanvasViewer] 跳过已转换大坐标模型的高亮缩放:", e.userData.filePath);
        return;
      }
      t ? (e.userData._highlightOriginalScale || (e.userData._highlightOriginalScale = e.scale.clone()), e.scale.set(e.userData._highlightOriginalScale.x * 1.05, e.userData._highlightOriginalScale.y * 1.05, e.userData._highlightOriginalScale.z * 1.05)) : e.userData._highlightOriginalScale && (e.scale.copy(e.userData._highlightOriginalScale), delete e.userData._highlightOriginalScale);
    },
    computeModelBoundingBox(e) {
      if (e.userData.isSkinnedModel) {
        let t = null;
        if (e.traverse((o) => {
          o.isSkinnedMesh && !t && (t = o);
        }), t) return this.computeSkinnedMeshBoundingBox(t);
      }
      return new h.Box3().setFromObject(e);
    },
    computeModelBottom(e) {
      const t = new h.Vector3();
      return t.x = (e.min.x + e.max.x) / 2, t.y = e.min.y, t.z = (e.min.z + e.max.z) / 2, t;
    },
    updateSkinnedModelAnchorGeneric(e) {
      const t = e.modelGroup();
      t && t.children.forEach((o) => {
        if (o.userData._transformAnchor && o.userData.isSkinnedModel) try {
          let i = null;
          if (o.traverse((n) => {
            n.isSkinnedMesh && !i && (i = n);
          }), i) {
            const n = this.computeSkinnedMeshBoundingBox(i), r = this.computeModelBottom(n);
            o.userData._transformAnchor.position.copy(r), o.userData._transformBottomOffset.set(r.x - o.position.x, r.y - o.position.y, r.z - o.position.z);
          }
        } catch {
        }
      });
    },
    updateClickableCenterGeneric(e) {
      const t = e.modelGroup();
      if (!t) return;
      const o = e.camera();
      t.children.forEach((i) => {
        if (i.visible && i.userData.isSkinnedModel) try {
          let n = null;
          if (i.traverse((r) => {
            r.isSkinnedMesh && !n && (n = r);
          }), n && o) {
            const r = this.computeSkinnedMeshBoundingBox(n), a = new h.Vector3();
            a.x = (r.min.x + r.max.x) / 2, a.y = (r.min.y + r.max.y) / 2, a.z = (r.min.z + r.max.z) / 2, a.project(o), i.userData.clickableCenter = a;
            const s = new h.Vector3();
            r.getSize(s), i.userData.boundingRadius = Math.max(s.x, s.y, s.z) / 2;
          }
        } catch {
        }
      });
    },
    getLayerConfig(e) {
      return this.layersConfig.find((t) => t.id === e) || null;
    },
    getLayerConfigByIndex(e) {
      return this.layersConfig.find((t) => t.index === e) || null;
    },
    updateSkinnedModelClickableCenterGeneric(e) {
      const t = e.modelGroup(), o = e.getAnimationMixers();
      t && t.children.forEach((i) => {
        if (i.userData.isSkinnedModel) try {
          let n = null;
          if (o.some((r) => r.getRoot() === i ? (n = i, !0) : !1), n) {
            let r = null;
            if (i.traverse((a) => {
              a.isBone && !r && a.name && /hip|root|pelvis/i.test(a.name) && (r = a);
            }), r || i.traverse((a) => {
              a.isBone && !r && (r = a);
            }), r) {
              const a = new h.Vector3();
              r.getWorldPosition(a), n.userData.clickableCenter ? n.userData.clickableCenter.copy(a) : n.userData.clickableCenter = a.clone();
            }
          }
        } catch {
        }
      });
    },
    setActiveLayer(e) {
      switch (console.log("[DualCanvasViewer] 设置活动图层:", e), e !== "both" && e !== this.activeLayer && (e === "three" ? this.deselectModel2() : e === "bim" && this.deselectModel1()), this.activeLayer = e, e === "three" ? this.interactionLayer = "three" : e === "bim" && (this.interactionLayer = "bim"), e) {
        case "three":
          this.showThreeLayer = !0, this.showBimLayer = !1;
          break;
        case "bim":
          this.showThreeLayer = !1, this.showBimLayer = !0;
          break;
        case "both":
          this.showThreeLayer = !0, this.showBimLayer = !0, this.interactionLayer === "three" || !this.interactionLayer ? this.$nextTick(() => {
            this.syncCameraFromThreeToBim(), console.log("[DualCanvasViewer] both模式: 同步相机 层1→层2");
          }) : this.interactionLayer === "bim" && this.$nextTick(() => {
            this.syncCameraFromBimToThree(), console.log("[DualCanvasViewer] both模式: 同步相机 层2→层1");
          });
          break;
      }
      this.updatePointerEvents(), console.log("[DualCanvasViewer] 活动图层已设置为:", e, "显示状态:", {
        showThreeLayer: this.showThreeLayer,
        showBimLayer: this.showBimLayer
      });
    },
    setInteractionLayer(e) {
      const t = this.interactionLayer;
      this.interactionLayer = e, this.updatePointerEvents(), console.log("[DualCanvasViewer] 切换交互层:", t, "→", e, `(${e === "three" ? "原始模型" : "BIM 模型"})`);
    },
    updateBimOpacity() {
      this.renderer2 && (this.renderer2.setClearColor(0, 0), this.scene2 && this.camera2 && this.renderer2.render(this.scene2, this.camera2), console.log("[DualCanvasViewer] BIM 图层透明度已更新:", this.bimOpacity + "%"));
    },
    getActiveLayerInfo() {
      if (this.activeLayer === "both") for (const t of this.layersConfig) {
        const o = t.selectedModel();
        if (o) return {
          layerNum: t.index,
          name: t.id,
          id: t.id,
          controls: t.controls(),
          eventTarget: t.eventTarget(),
          modelGroup: t.modelGroup(),
          camera: t.camera(),
          transformControls: t.transformControls(),
          selectedModel: o
        };
      }
      const e = this.layersConfig.find((t) => this.activeLayer === t.id || this.activeLayer === "both" && this.interactionLayer === t.id ? !0 : this.activeLayer === "both" && !this.interactionLayer && t.id === "three");
      return e ? {
        layerNum: e.index,
        name: e.id,
        id: e.id,
        controls: e.controls(),
        eventTarget: e.eventTarget(),
        modelGroup: e.modelGroup(),
        camera: e.camera(),
        transformControls: e.transformControls(),
        selectedModel: e.selectedModel()
      } : null;
    },
    getEventTarget(e) {
      if (!e) return null;
      if (e.transformControls && e.selectedModel) try {
        if (typeof e.transformControls.getHelper == "function") {
          const t = e.transformControls.getHelper();
          if (t && t.domElement) {
            if (t.domElement.style) {
              const o = t.domElement.style.pointerEvents;
              t.domElement.style.pointerEvents = "auto", this._tempPointerEventsRestore = {
                element: t.domElement,
                original: o
              };
            }
            return t.domElement;
          }
        }
        if (e.transformControls.domElement) {
          if (e.transformControls.domElement.style) {
            const t = e.transformControls.domElement.style.pointerEvents;
            e.transformControls.domElement.style.pointerEvents = "auto", this._tempPointerEventsRestore = {
              element: e.transformControls.domElement,
              original: t
            };
          }
          return e.transformControls.domElement;
        }
      } catch (t) {
        console.warn("[DualCanvasViewer] 获取 TransformControls domElement 失败:", t);
      }
      if (e.eventTarget) {
        if (e.eventTarget.style) {
          const t = e.eventTarget.style.pointerEvents;
          e.eventTarget.style.pointerEvents = "auto", this._tempPointerEventsRestore = {
            element: e.eventTarget,
            original: t
          };
        }
        return console.log("[DualCanvasViewer] 使用 eventTarget:", e.eventTarget.className || e.eventTarget.tagName), e.eventTarget;
      }
      if (e.controls && e.controls.domElement) {
        const t = e.controls.domElement;
        if (t && t.style) {
          const o = t.style.pointerEvents;
          t.style.pointerEvents = "auto", this._tempPointerEventsRestore = {
            element: t,
            original: o
          };
        }
        return console.log("[DualCanvasViewer] 使用 controls.domElement 作为降级方案"), e.controls.domElement;
      }
      return null;
    },
    restorePointerEvents() {
      if (this._tempPointerEventsRestore) {
        const { element: e, original: t } = this._tempPointerEventsRestore;
        e.style.pointerEvents = t, this._tempPointerEventsRestore = null, console.log("[DualCanvasViewer] 恢复 canvas pointer-events");
      }
    },
    getActiveControls() {
      const e = this.getActiveLayerInfo();
      return e ? e.controls : null;
    },
    onEventLayerPointerDown(e) {
      if (console.log("[DualCanvasViewer] 事件层 pointerdown, activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer), this.interactionLayer === "bim" && this.xeokitViewers && this.xeokitViewers.length > 0) {
        if (console.log("[DualCanvasViewer] BIM 交互层 + xeokit 场景"), this.pointerDown = !0, this.pointerDownButton = e.button, this.lastPointerPos = {
          x: e.clientX,
          y: e.clientY
        }, this.isDragging = !1, this.pointerDownStartTime = Date.now(), this.lastPointerDownEvent = e, e.button === 0) {
          let n = !1;
          for (const r of this.xeokitViewers) {
            const a = r.canvas, s = r.viewer;
            if (!a || !s) continue;
            const c = a.getBoundingClientRect(), l = e.clientX - c.left, g = e.clientY - c.top;
            console.log("[DualCanvasViewer] 尝试从 xeokit viewer 拾取，canvas 坐标:", l, g);
            const u = s.scene.pick({ canvasPos: [l, g] });
            if (u && u.entity) {
              console.log("[DualCanvasViewer] xeokit 拾取成功，实体:", u.entity.id), n = !0, this.selectXeokitEntity(u.entity, r), this.isDraggingXeokit = !0, this.xeokitDragStartMouse = {
                x: e.clientX,
                y: e.clientY
              };
              const d = s.scene.models, m = Object.keys(d);
              if (m.length > 0) {
                const p = d[m[0]];
                this.xeokitDragStartPos = {
                  x: p.position[0],
                  y: p.position[1],
                  z: p.position[2]
                };
              }
              break;
            }
          }
          n || (console.log("[DualCanvasViewer] xeokit 未拾取到任何实体"), this.deselectXeokitEntity());
        }
        if (this.controls2 && this.controls2.domElement) {
          const n = new PointerEvent("pointerdown", {
            pointerId: e.pointerId,
            button: e.button,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: !0,
            cancelable: !0
          });
          this.controls2.domElement.dispatchEvent(n), console.log("[DualCanvasViewer] 转发 pointerdown 到 BIM controls.domElement 用于视角控制");
        }
        return;
      }
      this.pointerDown = !0, this.pointerDownButton = e.button, this.lastPointerPos = {
        x: e.clientX,
        y: e.clientY
      }, this.isDragging = !1, this.pointerDownStartTime = Date.now(), this.lastPointerDownEvent = e;
      const t = this.getActiveLayerInfo();
      if (!t) {
        console.warn("[DualCanvasViewer] 没有激活的层");
        return;
      }
      const o = this.getEventTarget(t);
      if (!o) {
        console.warn("[DualCanvasViewer] 没有找到有效的事件目标元素");
        return;
      }
      const i = new PointerEvent("pointerdown", {
        pointerId: e.pointerId,
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: !0,
        cancelable: !0
      });
      o.dispatchEvent(i), console.log("[DualCanvasViewer] 转发 pointerdown 到:", o.className || o.tagName);
    },
    onEventLayerPointerMove(e) {
      if (!this.pointerDown) return;
      if (this.interactionLayer === "bim" && this.xeokitViewers && this.xeokitViewers.length > 0) {
        const a = e.clientX - this.lastPointerPos.x, s = e.clientY - this.lastPointerPos.y;
        if (Math.sqrt(a * a + s * s) > 5 && (this.isDragging = !0), this.lastPointerPos = {
          x: e.clientX,
          y: e.clientY
        }, this.isDraggingXeokit && this.selectedXeokitViewer) {
          const c = this.selectedXeokitViewer, l = e.clientX - this.xeokitDragStartMouse.x, g = e.clientY - this.xeokitDragStartMouse.y;
          if (Math.abs(l) < 3 && Math.abs(g) < 3) return;
          console.group("🔍 [XKT拖拽调试] 鼠标移动 vs 模型移动"), console.log("📏 鼠标屏幕移动增量 (像素):"), console.log(`   dragDeltaX: ${l.toFixed(2)} px`), console.log(`   dragDeltaY: ${g.toFixed(2)} px`), console.log(`   鼠标总移动距离: ${Math.sqrt(l ** 2 + g ** 2).toFixed(2)} px`), console.log("");
          const u = c.camera, d = u.eye, m = u.look, p = u.up, x = [
            m[0] - d[0],
            m[1] - d[1],
            m[2] - d[2]
          ], f = Math.sqrt(x[0] ** 2 + x[1] ** 2 + x[2] ** 2);
          x[0] /= f, x[1] /= f, x[2] /= f;
          const C = [
            x[1] * p[2] - x[2] * p[1],
            x[2] * p[0] - x[0] * p[2],
            x[0] * p[1] - x[1] * p[0]
          ], M = 0.2;
          console.log("🎮 计算参数:"), console.log(`   moveSpeed: ${M}`), console.log(`   forward: [${x.map((T) => T.toFixed(3)).join(", ")}]`), console.log(`   right: [${C.map((T) => T.toFixed(3)).join(", ")}]`), console.log("");
          const y = (l * C[0] - g * x[0]) * M, w = (l * C[2] - g * x[2]) * M;
          console.log("📐 计算的世界坐标移动量:"), console.log(`   moveX: ${y.toFixed(4)} (鼠标dragDeltaX=${l.toFixed(2)} * right[0]=${C[0].toFixed(3)} * ${M})`), console.log(`   moveZ: ${w.toFixed(4)} (鼠标dragDeltaY=${g.toFixed(2)} * right[2]=${C[2].toFixed(3)} * ${M})`), console.log("");
          const V = c.scene.models, S = Object.keys(V);
          if (S.length > 0) {
            const T = V[S[0]].position || [
              0,
              0,
              0
            ];
            console.log("📍 模型位置变化:"), console.log(`   当前位置: [${T.map((v) => v.toFixed(3)).join(", ")}]`), console.log(`   新位置:   [${(T[0] + y).toFixed(3)}, ${T[1].toFixed(3)}, ${(T[2] + w).toFixed(3)}]`), console.log(`   实际移动: moveX=${y.toFixed(4)}, moveZ=${w.toFixed(4)}`), console.log(`   移动比例: 鼠标${Math.sqrt(l ** 2 + g ** 2).toFixed(1)}px → 模型${Math.sqrt(y ** 2 + w ** 2).toFixed(4)}单位`), console.log(`   比例因子: 1px鼠标 ≈ ${(Math.sqrt(y ** 2 + w ** 2) / Math.sqrt(l ** 2 + g ** 2)).toFixed(4)} 单位`);
          }
          if (console.groupEnd(), S.length > 0) {
            const T = V[S[0]], v = T.position || [
              0,
              0,
              0
            ];
            T.position = [
              v[0] + y,
              v[1],
              v[2] + w
            ], console.log("[DualCanvasViewer] xeokit 模型位置已更新:", T.position), this.syncXKTModelPositionToThree(c, T.position);
          }
          return;
        }
        if (this.isDragging && this.controls2 && this.controls2.domElement) {
          const c = new PointerEvent("pointermove", {
            pointerId: e.pointerId,
            button: e.button,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: !0,
            cancelable: !0
          });
          this.controls2.domElement.dispatchEvent(c);
        }
        return;
      }
      const t = e.clientX - this.lastPointerPos.x, o = e.clientY - this.lastPointerPos.y;
      Math.sqrt(t * t + o * o) > 5 && (this.isDragging = !0), this.lastPointerPos = {
        x: e.clientX,
        y: e.clientY
      };
      const i = this.getActiveLayerInfo();
      if (!i) return;
      const n = this.getEventTarget(i);
      if (!n) return;
      const r = new PointerEvent("pointermove", {
        pointerId: e.pointerId,
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: !0,
        cancelable: !0
      });
      n.dispatchEvent(r);
    },
    onEventLayerPointerUp(e) {
      if (console.log("[DualCanvasViewer] 事件层 pointerup, activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer), this.interactionLayer === "bim" && this.xeokitViewers && this.xeokitViewers.length > 0) {
        if (this.pointerDown = !1, this.pointerDownButton = -1, this.isDraggingXeokit && (console.log("[DualCanvasViewer] 结束 xeokit 拖拽"), this.isDraggingXeokit = !1, this.xeokitDragStartMouse = null, this.xeokitDragStartPos = null), this.isDragging && this.controls2 && this.controls2.domElement) {
          const r = new PointerEvent("pointerup", {
            pointerId: e.pointerId,
            button: e.button,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: !0,
            cancelable: !0
          });
          this.controls2.domElement.dispatchEvent(r);
        }
        const n = Date.now() - this.pointerDownStartTime;
        !this.isDragging && !this.isDraggingXeokit && n < 300 && this.handleModelSelectionByEventLayer(this.lastPointerDownEvent || e), this.isDragging = !1, this.lastPointerDownEvent = null, this.restorePointerEvents();
        return;
      }
      this.pointerDown = !1, this.pointerDownButton = -1;
      const t = this.getActiveLayerInfo();
      if (!t) {
        console.warn("[DualCanvasViewer] 没有激活的层");
        const n = Date.now() - this.pointerDownStartTime;
        if (!this.isDragging && n < 300) {
          const r = this.lastPointerDownEvent || e;
          this.handleModelSelectionByEventLayer(r);
        }
        this.isDragging = !1, this.lastPointerDownEvent = null, this.restorePointerEvents();
        return;
      }
      const o = this.getEventTarget(t);
      if (o) {
        const n = new PointerEvent("pointerup", {
          pointerId: e.pointerId,
          button: e.button,
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: !0,
          cancelable: !0
        });
        o.dispatchEvent(n);
      }
      const i = Date.now() - this.pointerDownStartTime;
      if (!this.isDragging && i < 300) {
        console.log("[DualCanvasViewer] 检测到点击，处理模型选择");
        const n = this.lastPointerDownEvent || e;
        this.handleModelSelectionByEventLayer(n);
      }
      this.isDragging = !1, this.lastPointerDownEvent = null, this.restorePointerEvents();
    },
    onEventLayerWheel(e) {
      const t = this.getActiveLayerInfo();
      if (!(!t || !t.controls) && t.controls.domElement) {
        const o = new WheelEvent("wheel", {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          bubbles: !0,
          cancelable: !0
        });
        t.controls.domElement.dispatchEvent(o);
      }
    },
    handleModelSelectionByEventLayer(e) {
      const t = this.getActiveLayerInfo();
      if (!t) {
        console.warn("[DualCanvasViewer] handleModelSelectionByEventLayer: 没有激活的层");
        return;
      }
      console.log("[DualCanvasViewer] handleModelSelectionByEventLayer: 层", t.name);
      let o, i;
      if (this.viewportManager) {
        const n = this.viewportManager.screenToViewportNDC(e.clientX, e.clientY);
        o = n.x, i = n.y;
      } else {
        console.warn("[DualCanvasViewer] 统一视口管理器未初始化，使用旧方法");
        const n = this.$refs.eventContainer;
        if (!n) return;
        const r = n.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
          console.warn("[DualCanvasViewer] 事件层容器尺寸无效");
          return;
        }
        o = (e.clientX - r.left) / r.width * 2 - 1, i = -((e.clientY - r.top) / r.height) * 2 + 1;
      }
      if (console.log("[DualCanvasViewer] 事件层鼠标坐标:", `(${o.toFixed(2)}, ${i.toFixed(2)})`), this.activeLayer === "both") {
        this.handleDualLayerSelection(e);
        return;
      }
      if (t.layerNum === 1) {
        this.mouse1.x = o, this.mouse1.y = i;
        const n = this.getModelsByScreenDistance1();
        if (n.length > 0) {
          const r = n[0];
          this.selectedModel1 !== r.object && this.selectModel1(r.object);
        } else this.selectedModel1 && this.deselectModel1();
      } else if (t.layerNum === 2) {
        this.mouse2.x = o, this.mouse2.y = i;
        const n = this.getModelsByScreenDistance2();
        if (n.length > 0) {
          const r = n[0];
          this.selectedModel2 !== r.object && this.selectModel2(r.object);
        } else this.selectedModel2 && this.deselectModel2();
      }
    },
    hasXeokitModelsInScene(e) {
      if (!e) return !1;
      let t = !1;
      return e.traverse((o) => {
        o.userData && o.userData.isXKTModel && o.userData.renderedByXeokit && (t = !0);
      }), t;
    },
    updatePointerEvents() {
      const e = this.$refs.eventContainer;
      if (!e) {
        console.warn("[DualCanvasViewer] updatePointerEvents - 事件层容器未找到");
        return;
      }
      console.log("[DualCanvasViewer] updatePointerEvents - activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer);
      let t = null;
      if (this.layersConfig.forEach((o) => {
        const i = this.$refs[o.containerRef];
        if (!i) {
          console.warn(`[DualCanvasViewer] 层 ${o.name} 容器未找到`);
          return;
        }
        let n = i;
        const r = i.querySelector("canvas");
        r && (n = r), o.eventTarget = () => n, this.activeLayer === "both" ? (i.style.pointerEvents = "none", n !== i && (this.interactionLayer === o.id || o.selectedModel() ? n.style.pointerEvents = "auto" : n.style.pointerEvents = "none", o.id === "bim" && this.xeokitViewers && this.xeokitViewers.length > 0 && this.xeokitViewers.forEach((a) => {
          a.canvas && (a.canvas.style.pointerEvents = "auto", console.log("[DualCanvasViewer] 设置 xeokit canvas pointer-events: auto"));
        }))) : this.activeLayer === o.id ? (i.style.pointerEvents = "auto", n !== i && (n.style.pointerEvents = "auto")) : (i.style.pointerEvents = "none", n !== i && (n.style.pointerEvents = "none")), this.activeLayer === o.id ? t = {
          layerNum: o.index,
          name: o.id,
          id: o.id,
          controls: o.controls(),
          eventTarget: n,
          modelGroup: o.modelGroup(),
          camera: o.camera(),
          transformControls: o.transformControls(),
          selectedModel: o.selectedModel()
        } : this.activeLayer === "both" && this.interactionLayer === o.id && (t = {
          layerNum: o.index,
          name: o.id,
          id: o.id,
          controls: o.controls(),
          eventTarget: n,
          modelGroup: o.modelGroup(),
          camera: o.camera(),
          transformControls: o.transformControls(),
          selectedModel: o.selectedModel()
        });
      }), this.activeLayer === "both") {
        const o = this.xeokitViewers && this.xeokitViewers.length > 0, i = this.hasXeokitModelsInScene(this.modelGroup2);
        this.interactionLayer === "bim" && o || i ? (e.style.pointerEvents = "auto", console.log("[DualCanvasViewer] 双层模式+BIM交互层+xeokit: 事件层保持激活以转发事件")) : e.style.pointerEvents = "auto";
      } else
        e.style.pointerEvents = "auto", console.log("[DualCanvasViewer] 单层模式: 事件层保持激活以接收事件");
      t && (t.controls && t.controls.domElement !== t.eventTarget && (t.controls.domElement = t.eventTarget, t.controls.update()), console.log("[DualCanvasViewer] 激活 controls，activeLayer:", this.activeLayer, "activeLayerInfo.controls:", t.controls === this.controls1 ? "controls1" : "controls2"), this.layersConfig.forEach((o) => {
        const i = o.controls();
        if (i) if (this.activeLayer === "both")
          i.enabled = !0, console.log("[DualCanvasViewer] 双层模式：启用", o.id, "controls");
        else {
          const r = t.controls === i;
          i.enabled = r, console.log("[DualCanvasViewer] 单层模式：", o.id, "controls enabled:", r);
        }
        const n = o.transformControls();
        n && (this.activeLayer === "both" ? n.enabled = !0 : n.enabled = t.layerNum === o.index);
      }), console.log("[DualCanvasViewer] 激活层:", t.name, "controls domElement:", t.controls?.domElement?.tagName || "none")), this.eventLayerListenerAdded || (e.addEventListener("pointerdown", this.onEventLayerPointerDown), e.addEventListener("pointermove", this.onEventLayerPointerMove), e.addEventListener("pointerup", this.onEventLayerPointerUp), e.addEventListener("wheel", this.onEventLayerWheel, { passive: !1 }), this.eventLayerListenerAdded = !0, console.log("[DualCanvasViewer] 已绑定事件转发监听器到事件层")), this.activeLayer === "both" && this.$nextTick(() => {
        this.interactionLayer === "three" || !this.interactionLayer ? (this.syncCameraFromThreeToBim(), this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokit()) : this.interactionLayer === "bim" && (this.syncCameraFromBimToThree(), this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokit());
      }), this.xeokitViewers && this.xeokitViewers.length > 0 && (console.log("[DualCanvasViewer] 更新 xeokit canvas pointer-events, activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer), this.xeokitViewers.forEach((o) => {
        const i = o.canvas;
        if (i && i._updatePointerEvents) i._updatePointerEvents();
        else if (i) {
          const n = this.showBimLayer && (this.activeLayer === "bim" || this.activeLayer === "both" && this.interactionLayer === "bim");
          i.style.pointerEvents = n ? "auto" : "none", console.log("[DualCanvasViewer] xeokit canvas pointer-events:", i.style.pointerEvents, "showBimLayer:", this.showBimLayer, "activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer);
        }
      })), console.log("[DualCanvasViewer] Pointer events updated - activeLayer:", this.activeLayer, "interactionLayer:", this.interactionLayer);
    },
    async loadGLTFWithResources(e, t, o) {
      const i = e.name.split(".").pop().toLowerCase();
      if (i === "glb") {
        const n = URL.createObjectURL(e);
        try {
          return await o.loadAsync(n);
        } finally {
          URL.revokeObjectURL(n);
        }
      }
      if (i === "gltf") {
        console.log("[DualCanvasViewer] 处理 GLTF 文件:", e.name), console.log("[DualCanvasViewer] 用户选择的文件:", t.map((u) => u.name));
        const n = await e.text(), r = JSON.parse(n), a = /* @__PURE__ */ new Map();
        t.forEach((u) => {
          a.set(u.name.toLowerCase(), u), console.log("[DualCanvasViewer] 文件映射:", u.name.toLowerCase(), "->", u.name);
        });
        const s = [];
        if (r.buffers) {
          console.log("[DualCanvasViewer] 发现", r.buffers.length, "个 buffer(s)");
          for (let u = 0; u < r.buffers.length; u++) {
            const d = r.buffers[u];
            if (d.uri && !d.uri.startsWith("data:")) {
              const m = this._extractFileNameFromUri(d.uri).toLowerCase();
              if (console.log("[DualCanvasViewer] 查找 buffer 文件:", d.uri, "-> 提取文件名:", m), a.has(m)) {
                const p = a.get(m), x = URL.createObjectURL(p);
                s.push(x), d.uri = x, console.log("[DualCanvasViewer] ✓ 找到并替换 buffer URI:", d.uri, "->", x);
              } else
                console.warn("[DualCanvasViewer] ✗ 缺少外部 buffer 文件:", m), console.warn("[DualCanvasViewer] 可用文件:", Array.from(a.keys()));
            }
          }
        }
        if (r.images) {
          console.log("[DualCanvasViewer] 发现", r.images.length, "个 image(s)");
          for (let u = 0; u < r.images.length; u++) {
            const d = r.images[u];
            if (d.uri && !d.uri.startsWith("data:")) {
              const m = this._extractFileNameFromUri(d.uri).toLowerCase();
              if (console.log("[DualCanvasViewer] 查找纹理文件:", d.uri, "-> 提取文件名:", m), a.has(m)) {
                const p = a.get(m), x = URL.createObjectURL(p);
                s.push(x), d.uri = x, console.log("[DualCanvasViewer] ✓ 找到并替换 image URI:", d.uri, "->", x);
              } else
                console.warn("[DualCanvasViewer] ✗ 缺少外部纹理文件:", m), console.warn("[DualCanvasViewer] 可用文件:", Array.from(a.keys()));
            }
          }
        }
        const c = JSON.stringify(r, null, 2), l = new Blob([c], { type: "application/json" }), g = URL.createObjectURL(l);
        s.push(g), console.log("[DualCanvasViewer] 修改后的 GLTF URL:", g), console.log("[DualCanvasViewer] 总外部资源数:", s.length - 1);
        try {
          const u = await o.loadAsync(g);
          return console.log("[DualCanvasViewer] GLTF 模型加载成功"), u;
        } finally {
          for (const u of s) URL.revokeObjectURL(u);
        }
      }
      throw new Error(`不支持的文件类型: ${i}`);
    },
    _extractFileNameFromUri(e) {
      let t = e;
      return t = t.split("/").pop().split("\\").pop(), (t.startsWith("./") || t.startsWith(".\\")) && (t = t.substring(2)), t.split("?")[0];
    },
    extractGeolocationFromGLTFAsset(e, t) {
      if (!e || !e.extras) return null;
      let o = null;
      const i = e.extras._b3dm;
      if (i && i.rtcCenter && Array.isArray(i.rtcCenter)) {
        let r = i.geolocation?.longitude, a = i.geolocation?.latitude, s = i.geolocation?.altitude;
        if (r === void 0 || a === void 0) {
          const c = this.syncManager?.getCesium();
          if (c && c.Cartesian3 && c.Cartographic) {
            const l = new c.Cartesian3(...i.rtcCenter), g = c.Cartographic.fromCartesian(l);
            r = c.Math.toDegrees(g.longitude), a = c.Math.toDegrees(g.latitude), s = g.height, console.log("[DualCanvasViewer] 🔄 从 ECEF 坐标反算经纬度（通过 SyncManager 委托 Cesium）:", {
              ECEF: `[${i.rtcCenter.map((u) => u.toFixed(2)).join(", ")}]`,
              反算经度: r.toFixed(6) + "°",
              反算纬度: a.toFixed(6) + "°",
              反算高度: s.toFixed(2) + "米",
              Cesium来源: c === window.Cesium ? "window.Cesium" : "SyncManager缓存"
            });
          } else {
            const [l, g, u] = i.rtcCenter, d = 6378137, m = 6356752314245e-6, p = 0.00669437999014, x = 0.00673949674233;
            r = Math.atan2(g, l) * 180 / Math.PI;
            const f = Math.sqrt(l * l + g * g), C = Math.atan2(u * d, f * m);
            a = Math.atan2(u + x * m * Math.pow(Math.sin(C), 3), f - p * d * Math.pow(Math.cos(C), 3)) * 180 / Math.PI;
            const M = Math.sin(a * Math.PI / 180), y = Math.cos(a * Math.PI / 180), w = d / Math.sqrt(1 - p * M * M);
            s = f / y - w, console.log("[DualCanvasViewer] 🔄 从 ECEF 坐标反算经纬度（原生 JS 回退方案）:", {
              ECEF: `[${i.rtcCenter.map((V) => V.toFixed(2)).join(", ")}]`,
              反算经度: r.toFixed(6) + "°",
              反算纬度: a.toFixed(6) + "°",
              反算高度: s.toFixed(2) + "米",
              说明: "Cesium 不可用，使用原生 JS 计算"
            });
          }
        }
        console.log("[DualCanvasViewer] 📍 从 GLTF 资产中提取到 B3DM 元数据:", {
          文件名: t,
          RTC_CENTER: `[${i.rtcCenter.map((c) => c.toFixed(2)).join(", ")}]`,
          经度: r?.toFixed(6) + "°",
          纬度: a?.toFixed(6) + "°",
          高度: s?.toFixed(2) + "米",
          来源: r === i.geolocation?.longitude ? "B3DM_RTC_CENTER_原始" : "B3DM_RTC_CENTER_反算"
        }), o = {
          rtcCenter: new h.Vector3(...i.rtcCenter),
          longitude: r,
          latitude: a,
          altitude: s,
          source: "B3DM_RTC_CENTER",
          _hasMercator: !1,
          _hasThree: !1
        };
      } else {
        const r = e.extras._geolocation;
        r && (console.log("[DualCanvasViewer] 📍 从 GLTF 资产中提取到地理位置信息:", {
          文件名: t,
          经度: r.longitude?.toFixed(6) + "°",
          纬度: r.latitude?.toFixed(6) + "°",
          高度: r.altitude?.toFixed(2) + "米",
          来源: r.source || "GLTF_asset_extras"
        }), o = {
          rtcCenter: null,
          longitude: r.longitude,
          latitude: r.latitude,
          altitude: r.altitude,
          source: r.source || "GLTF_asset_extras",
          _hasMercator: !1,
          _hasThree: !1
        });
      }
      let n = null;
      return e.extras && e.extras._enuRotationCompensation && (n = e.extras._enuRotationCompensation, console.log("[DualCanvasViewer] 📋 检测到 ENU 旋转补偿信息:", {
        文件名: t,
        ECEF位置: n.ecefPosition,
        ENU原点: n.enuOrigin,
        说明: "补偿信息已提取，可在需要时应用"
      })), n && o && (o.enuCompensation = n), o;
    },
    recordModelOriginalLocation(e, t, o, i = null, n = null) {
      if (i && i.longitude !== void 0) {
        console.log("[DualCanvasViewer] 📍 使用 GLTF 资产中的地理位置信息..."), this.saveLocationToModel(e, t, i, o), n && (e.userData.enuCompensation = n, console.log("[DualCanvasViewer] 📋 已保存 ENU 补偿信息到模型 userData"));
        return;
      }
      if (console.log("[DualCanvasViewer] 📍 通过顶点坐标计算地理位置..."), !this.mercatorProjectionManager) {
        console.warn("[DualCanvasViewer] mercatorProjectionManager 不可用，无法记录地理位置");
        return;
      }
      const r = this.syncManager;
      if (!r) {
        console.warn("[DualCanvasViewer] syncManager 不可用，无法记录地理位置");
        return;
      }
      if (!r.getCesium()) {
        console.warn("[DualCanvasViewer] Cesium 不可用，无法记录地理位置");
        return;
      }
      try {
        const a = this.mercatorProjectionManager.scale || 1, s = this.mercatorProjectionManager.floorCenterMercator || {
          x: 0,
          y: 0,
          z: 0
        }, c = {
          x: o.x * a + s.x,
          y: -o.z * a + s.y,
          z: o.y * a
        };
        console.log("[DualCanvasViewer] 原始坐标转换（直接计算）:", {
          文件名: t,
          Three坐标: `(${o.x.toFixed(2)}, ${o.y.toFixed(2)}, ${o.z.toFixed(2)})`,
          地板中心: `(${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`,
          墨卡托: `(${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)})`
        });
        const l = r.earthRadius || 6378137, g = c.x / l * 180 / Math.PI, u = r.surfaceHandler.mercatorToLatitude(c.y) * 180 / Math.PI, d = c.z;
        console.log("[DualCanvasViewer] 📍 原始地理位置:", {
          文件名: t,
          经度: g.toFixed(6) + "°",
          纬度: u.toFixed(6) + "°",
          高度: d.toFixed(2) + "米"
        });
        const m = {
          longitude: g,
          latitude: u,
          altitude: d,
          mercator: c,
          source: "vertex_calculation"
        };
        this.saveLocationToModel(e, t, m, o);
      } catch (a) {
        console.warn("[DualCanvasViewer] 记录原始地理位置失败:", a);
      }
    },
    saveLocationToModel(e, t, o, i) {
      const n = this.syncManager, r = n ? n.getCesium() : null;
      if (!r) {
        console.warn("[DualCanvasViewer] Cesium 不可用");
        return;
      }
      let a = o.mercator;
      if (!a && o.longitude !== void 0) {
        const c = n.earthRadius || 6378137, l = o.longitude * Math.PI / 180, g = o.latitude * Math.PI / 180, u = Math.log(Math.tan(Math.PI / 4 + g / 2)) * c;
        a = {
          x: l * c,
          y: u,
          z: o.altitude || 0
        };
      }
      const s = new r.Cartographic.fromDegrees(o.longitude, o.latitude, o.altitude || 0);
      e.userData.originalLocation = {
        cartographic: s,
        longitude: o.longitude,
        latitude: o.latitude,
        altitude: o.altitude || 0,
        mercator: a,
        three: i ? {
          x: i.x,
          y: i.y,
          z: i.z
        } : o.three || {
          x: 0,
          y: 0,
          z: 0
        },
        source: o.source || "unknown",
        fileName: t
      }, console.warn("[DualCanvasViewer] 🏗️ 模型海拔信息已记录:", {
        文件名: t,
        模型海拔: s.height.toFixed(2) + "米",
        经度: (s.longitude * 180 / Math.PI).toFixed(6) + "°",
        纬度: (s.latitude * 180 / Math.PI).toFixed(6) + "°",
        说明: "此海拔将用于计算红色球体位置"
      }), i && (e.userData.originalCenter = i.clone()), e.userData.isReferenceLargeCoordModel = !0, console.log("[DualCanvasViewer] ✅ 已保存原始地理位置信息到 model.userData.originalLocation"), console.log("[DualCanvasViewer] 📍 Cesium.Cartographic 格式:", {
        longitude: r.Math.toDegrees(s.longitude).toFixed(6) + "°",
        latitude: r.Math.toDegrees(s.latitude).toFixed(6) + "°",
        height: s.height.toFixed(2) + "米",
        source: o.source || "unknown"
      });
    },
    findReferenceLargeCoordModel() {
      if (!this.modelGroup1 || !this.modelGroup1.children) return null;
      for (const e of this.modelGroup1.children) if (e.userData.isReferenceLargeCoordModel && e.userData.originalLocation) return e;
      return null;
    },
    getLargeCoordModelLocation() {
      const e = this.findReferenceLargeCoordModel();
      if (!e || !e.userData.originalLocation) return null;
      const t = e.userData.originalLocation;
      return {
        fileName: t.fileName,
        longitude: t.longitude,
        latitude: t.latitude,
        altitude: t.altitude,
        mercator: t.mercator,
        cartographic: t.cartographic
      };
    },
    recordRelativePositionToLargeCoordModel(e, t) {
      if (!e || !t || !t.userData.originalLocation) {
        console.warn("[DualCanvasViewer] recordRelativePositionToLargeCoordModel: 缺少必要参数");
        return;
      }
      const o = new h.Box3().setFromObject(e), i = new h.Vector3();
      o.getCenter(i);
      const n = t.position.clone(), r = new h.Box3().setFromObject(t), a = new h.Vector3();
      r.getCenter(a);
      const s = {
        x: i.x - a.x,
        y: i.y - a.y,
        z: i.z - a.z
      };
      e.userData.relativeToLargeCoordModel = {
        referenceModelName: t.userData.originalLocation.fileName || t.userData.fileName || t.name,
        referenceModelUuid: t.uuid,
        relativeOffset: s,
        recordedAt: {
          three: i.clone(),
          mercator: this.mercatorProjectionManager ? this.mercatorProjectionManager.threeToMercator(i.x, i.y, i.z) : null
        },
        referenceLocation: {
          three: n.clone(),
          mercator: t.userData.originalLocation.mercator,
          cartographic: t.userData.originalLocation.cartographic
        }
      }, console.log("[DualCanvasViewer] 📐 已记录模型与大坐标模型的相对位置:", {
        模型: e.userData.filePath || e.name,
        参考大坐标模型: t.userData.originalLocation.fileName || t.userData.fileName || t.name,
        相对偏移: `(${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})`,
        模型位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
        大坐标模型中心: `(${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)})`,
        大坐标模型位置: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`
      });
    },
    async handleLargeCoordModelCoexistence(e) {
      console.log("[DualCanvasViewer] 🔄 统一处理大坐标模型与小模型的共存问题...");
      const t = (this.modelGroup1?.children || []).filter((r) => r.userData.isLargeCoordModel || r.userData.hasLargeCoordinates), o = e.filter((r) => !r.userData.isLargeCoordModel && !r.userData.hasLargeCoordinates);
      if (console.log("[DualCanvasViewer] 模型分类:", {
        大坐标模型数量: t.length,
        小模型数量: o.length,
        总模型数量: e.length
      }), t.length === 0) {
        console.log("[DualCanvasViewer] 无需处理共存问题（缺少大坐标模型）");
        return;
      }
      const i = t[0];
      if (console.log("[DualCanvasViewer] 🎯 设置地板中心（用于 ENU 坐标系初始化）"), console.log("[DualCanvasViewer] 🔍 调试信息:", {
        模型有originalLocation: !!i.userData.originalLocation,
        模型有cartographic: !!i.userData.originalLocation?.cartographic,
        有syncManager: !!this.syncManager,
        有mercatorProjection: !!this.syncManager?.mercatorProjection
      }), i.userData.originalLocation) {
        i.position.clone();
        const r = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
        if (console.log("[DualCanvasViewer] 🔍 mercatorProj 调试信息:", {
          mercatorProj存在: !!r,
          cartographic存在: !!i.userData.originalLocation.cartographic
        }), r && i.userData.originalLocation.cartographic) {
          const a = i.userData.originalLocation.cartographic, s = this.syncManager?.getCesium() || window.Cesium;
          console.log("[DualCanvasViewer] 🔍 cartographic 调试信息:", {
            longitude: a.longitude,
            latitude: a.latitude,
            height: a.height,
            经度度: (a.longitude * 180 / Math.PI).toFixed(6) + "°",
            纬度度: (a.latitude * 180 / Math.PI).toFixed(6) + "°"
          });
          let c = 0;
          try {
            const l = a.longitude * 180 / Math.PI, g = a.latitude * 180 / Math.PI;
            s && window.__cesiumViewer__ && (c = await this._getTerrainHeightAtPosition(l, g, s, window.__cesiumViewer__), console.log("[DualCanvasViewer] ⭐ 地形高度采样（共存模型处理）:", {
              位置: `(${l.toFixed(6)}°, ${g.toFixed(6)}°)`,
              模型海拔: a.height.toFixed(2) + "米",
              地形高度: c.toFixed(2) + "米"
            }));
          } catch (l) {
            console.warn("[DualCanvasViewer] 地形高度采样失败，使用默认值 0:", l.message);
          }
          if (s && s.Ellipsoid) {
            const l = s.Ellipsoid.WGS84.maximumRadius || 6378137, g = {
              x: a.longitude * l,
              y: Math.log(Math.tan(Math.PI / 4 + a.latitude / 2)) * l,
              z: c
            };
            console.log("[DualCanvasViewer] 🔍 调用 setFloorCenter 前的墨卡托坐标:", g), r.setFloorCenter(g, a.height), r.setDualFloorHeightToTerrain(c), console.log("[DualCanvasViewer] ✅ 地板中心已设置（用于 ENU 初始化，含地形高度）:", {
              经度: (a.longitude * 180 / Math.PI).toFixed(6) + "°",
              纬度: (a.latitude * 180 / Math.PI).toFixed(6) + "°",
              墨卡托坐标: g,
              地形高度: c.toFixed(2) + "米",
              ENU原点高度: c.toFixed(2) + "米（地形表面）"
            });
          } else {
            console.warn("[DualCanvasViewer] ⚠️ Cesium 不可用，使用回退方案");
            const l = {
              x: i.userData.originalCenter.x,
              y: i.userData.originalCenter.y,
              z: 0
            };
            r.setFloorCenter(l, a.height);
          }
        } else console.log("[DualCanvasViewer] ⚠️ mercatorProjection 或 cartographic 不存在，跳过地板中心设置");
      } else console.warn("[DualCanvasViewer] ⚠️ 模型缺少 originalLocation，无法设置地板中心");
      if (o.length === 0) {
        console.log("[DualCanvasViewer] 无小模型需要处理");
        return;
      }
      let n = 0;
      if (o.forEach((r, a) => {
        console.log("[DualCanvasViewer] 处理小模型:", r.userData.filePath || r.name);
        const s = new h.Box3().setFromObject(i), c = new h.Vector3();
        s.getSize(c);
        const l = (a + 1) * 12, g = i.position.clone();
        if (g.x += l, r.userData._originalPositionBeforeMove || (r.userData._originalPositionBeforeMove = r.position.clone()), r.position.copy(g), r.updateMatrixWorld(!0), !r.userData.isLargeCoordModel) {
          r.scale.set(1, 1, 1), r.updateMatrixWorld(!0);
          const u = new h.Box3().setFromObject(r), d = new h.Vector3();
          u.getSize(d);
          const m = Math.max(d.x, d.y, d.z), p = 100;
          if (m > 0 && isFinite(m)) {
            const x = p / m;
            r.scale.set(x, x, x), r.updateMatrixWorld(!0), console.log("[DualCanvasViewer] 🔄 小模型已缩放以避免闪烁:", {
              小模型: r.userData.filePath || r.name,
              原始尺寸: m.toFixed(2),
              目标尺寸: p,
              缩放因子: x.toFixed(2)
            });
          }
        }
        r.userData._movedNearLargeCoordModel = !0, console.log("[DualCanvasViewer] 📍 小模型已移动到大坐标模型附近:", {
          小模型: r.userData.filePath || r.name,
          索引: a,
          偏移: l,
          目标位置: `(${g.x.toFixed(2)}, ${g.y.toFixed(2)}, ${g.z.toFixed(2)})`
        }), n++;
      }), console.log(`[DualCanvasViewer] ✅ 已处理 ${n} 个小模型的位置`), i.userData.originalLocation) {
        const r = i.position.clone();
        this.mouseCoords && this.mouseCoords.mercator && (this.mouseCoords.mercator.floorCenter = {
          x: i.userData.originalCenter.x,
          y: i.userData.originalCenter.y,
          z: 0
        });
        const a = i.userData.originalLocation?.cartographic?.height || 0, s = {
          x: r.x,
          y: 0,
          z: r.z
        };
        this.moveGridHelpersTo(s), console.log("[DualCanvasViewer] ✅ GridHelper 已移动到地面位置（局部坐标系模式）:", {
          位置: s,
          模型海拔: a.toFixed(2) + "米（由 MercatorProjectionManager 管理）",
          GridHelperY: s.y.toFixed(2) + "米",
          说明: "GridHelper 在 Y=0，与模型底部对齐"
        }), this.referenceModelPosition = r, console.log("[DualCanvasViewer] ✅ 已设置参考位置用于网格排列:", {
          originalCenter: i.userData.originalCenter,
          modelPosition: r,
          说明: "使用模型在场景中的实际位置作为参考"
        });
      }
      this.anchorContainer1 && (console.log("[DualCanvasViewer] 🎯 自动执行高度对齐（大坐标模型加载完成）"), this.updateAnchorContainerPosition(), console.log("[DualCanvasViewer] ✅ anchorContainer 已自动对齐到地形表面"));
    },
    moveGridHelpersTo(e) {
      if (!e) {
        console.warn("[DualCanvasViewer] moveGridHelpersTo: 缺少地板中心坐标");
        return;
      }
      const t = (this.precisionModelLoader?.mercatorProjection || this.mercatorProjection)?.isUsingLocalCoordinateSystem?.() || !1, o = e.y || 0;
      if (console.log("[DualCanvasViewer] 🔍 GridHelper 位置计算:", {
        isLocalCoordMode: t,
        原始floorCenterY: e.y,
        adjustedY: o,
        说明: "已取消117米偏移，直接使用传入值"
      }), this.gridHelper1) {
        this.gridHelper1.position.set(e.x, o, e.z), this.gridHelper1.updateMatrixWorld();
        const i = new h.Vector3();
        this.gridHelper1.getWorldPosition(i), console.log("[DualCanvasViewer] ✅ 层1 GridHelper 已移动到:", {
          目标位置: e,
          实际世界位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
          父对象: this.gridHelper1.parent?.name || this.gridHelper1.parent?.type || "none"
        });
      }
      if (this.gridHelper2) {
        this.gridHelper2.position.set(e.x, o, e.z), this.gridHelper2.updateMatrixWorld();
        const i = new h.Vector3();
        this.gridHelper2.getWorldPosition(i), console.log("[DualCanvasViewer] ✅ 层2 GridHelper 已移动到:", {
          目标位置: e,
          实际世界位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
          父对象: this.gridHelper2.parent?.name || this.gridHelper2.parent?.type || "none"
        });
      }
    },
    rotateSceneContainersToAlignTerrain(e) {
      if (!e || !e.east || !e.north || !e.up) {
        console.warn("[DualCanvasViewer] rotateSceneContainersToAlignTerrain: 缺少 ENU 基向量");
        return;
      }
      if ((this.precisionModelLoader?.mercatorProjection || this.mercatorProjection)?.isUsingLocalCoordinateSystem?.()) {
        console.log("[DualCanvasViewer] ⭐ 局部坐标系模式：跳过场景容器旋转，保持 GridHelper 水平"), this.sceneContainer1 && !this.sceneContainer1.quaternion.equals(new h.Quaternion(0, 0, 0, 1)) && (this.sceneContainer1.quaternion.set(0, 0, 0, 1), this.sceneContainer1.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ sceneContainer1 已重置为 identity 旋转")), this.sceneContainer2 && !this.sceneContainer2.quaternion.equals(new h.Quaternion(0, 0, 0, 1)) && (this.sceneContainer2.quaternion.set(0, 0, 0, 1), this.sceneContainer2.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ sceneContainer2 已重置为 identity 旋转"));
        return;
      }
      console.log("[DualCanvasViewer] 🔄 旋转场景容器以对齐地形（包括模型和 GridHelper）");
      const t = new h.Vector3(e.east.x, e.east.y, e.east.z), o = new h.Vector3(e.north.x, e.north.y, e.north.z), i = new h.Vector3(e.up.x, e.up.y, e.up.z), n = new h.Matrix4();
      n.set(t.x, i.x, -o.x, 0, t.y, i.y, -o.y, 0, t.z, i.z, -o.z, 0, 0, 0, 0, 1);
      const r = new h.Quaternion();
      if (r.setFromRotationMatrix(n), this.sceneContainer1) {
        this.sceneContainer1.quaternion.copy(r), this.sceneContainer1.updateMatrixWorld(!0);
        const a = this.sceneContainer1.quaternion;
        console.log("[DualCanvasViewer] ✅ 场景容器1已旋转对齐地形", {
          法向量: `(${i.x.toFixed(4)}, ${i.y.toFixed(4)}, ${i.z.toFixed(4)})`,
          包含对象: this.sceneContainer1.children.length + " 个",
          四元数: `(${a.x.toFixed(4)}, ${a.y.toFixed(4)}, ${a.z.toFixed(4)}, ${a.w.toFixed(4)})`
        }), this.anchorContainer1 && (this.anchorContainer1.quaternion.set(0, 0, 0, 1), this.anchorContainer1.updateMatrixWorld(!0), console.log("[DualCanvasViewer] 📍 锚点容器1已重置为不旋转状态"));
      } else this.scene1 && (console.warn("[DualCanvasViewer] ⚠️ 场景容器1不存在，直接旋转场景对象"), this.scene1.traverse((a) => {
        a !== this.camera1 && a !== this.controls1 && a.type === "Object3D" && a.quaternion.premultiply(r);
      }));
      if (this.sceneContainer2) {
        this.sceneContainer2.quaternion.copy(r), this.sceneContainer2.updateMatrixWorld(!0);
        const a = this.sceneContainer2.quaternion;
        console.log("[DualCanvasViewer] ✅ 场景容器2已旋转对齐地形", {
          法向量: `(${i.x.toFixed(4)}, ${i.y.toFixed(4)}, ${i.z.toFixed(4)})`,
          包含对象: this.sceneContainer2.children.length + " 个",
          四元数: `(${a.x.toFixed(4)}, ${a.y.toFixed(4)}, ${a.z.toFixed(4)}, ${a.w.toFixed(4)})`
        });
      } else this.scene2 && (console.warn("[DualCanvasViewer] ⚠️ 场景容器2不存在，直接旋转场景对象"), this.scene2.traverse((a) => {
        a !== this.camera2 && a.type === "Object3D" && a.quaternion.premultiply(r);
      }));
      this.gridHelper1 && (this.gridHelper1.userData.initialRotationSet = !0), this.gridHelper2 && (this.gridHelper2.userData.initialRotationSet = !0), console.log("[DualCanvasViewer] ✅ 场景容器旋转完成，地板现在与地形平行");
    },
    moveSmallModelNearLargeCoordModel(e, t) {
      if (!e || !t) {
        console.warn("[DualCanvasViewer] moveSmallModelNearLargeCoordModel: 缺少必要参数");
        return;
      }
      const o = t.position.clone(), i = new h.Box3().setFromObject(t), n = new h.Vector3();
      i.getSize(n);
      const r = Math.max(n.x, n.y, n.z) * 0.1 + 10, a = o.clone();
      a.x += r, e.userData._originalPositionBeforeMove || (e.userData._originalPositionBeforeMove = e.position.clone()), e.position.copy(a), e.updateMatrixWorld(!0), e.userData._movedNearLargeCoordModel = !0, console.log("[DualCanvasViewer] 📍 小模型已移动到大坐标模型附近:", {
        小模型: e.userData.filePath || e.name,
        原始位置: `(${e.userData._originalPositionBeforeMove.x.toFixed(2)}, ${e.userData._originalPositionBeforeMove.y.toFixed(2)}, ${e.userData._originalPositionBeforeMove.z.toFixed(2)})`,
        新位置: `(${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)})`,
        大坐标模型位置: `(${o.x.toFixed(2)}, ${o.y.toFixed(2)}, ${o.z.toFixed(2)})`,
        偏移距离: r.toFixed(2)
      });
    },
    convertECEFToThreeJS(e, t, o, i = 0) {
      if (t === void 0 || o === void 0)
        return console.warn("[DualCanvasViewer] ⚠️ 缺少经纬度信息，使用简单轴重排（可能导致模型倾斜）"), new h.Vector3(e.x, e.z, -e.y);
      const n = 6378137, r = t * Math.PI / 180, a = o * Math.PI / 180, s = r * n, c = Math.log(Math.tan(Math.PI / 4 + a / 2)) * n, l = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
      let g = {
        x: 0,
        y: 0,
        z: 0
      };
      l && l.floorCenterMercator && (g = l.floorCenterMercator);
      const u = s - g.x, d = i, m = -(c - g.y), p = new h.Vector3(u, d, m);
      return console.log("[DualCanvasViewer] 🔄 ECEF到Three.js完整转换（局部墨卡托坐标系）:", {
        ECEF: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
        经纬度: `(${t.toFixed(6)}°, ${o.toFixed(6)}°)`,
        墨卡托绝对: `(${s.toFixed(2)}, ${c.toFixed(2)})`,
        地板中心: `(${g.x.toFixed(2)}, ${g.y.toFixed(2)})`,
        墨卡托相对: `(${u.toFixed(2)}, ${m.toFixed(2)})`,
        高度: i.toFixed(2) + "米",
        Three相对坐标: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`
      }), p;
    },
    async loadThreeModel(e) {
      const t = Array.from(e.target.files);
      if (t.length === 0) return;
      if (!this.gltfLoader1) {
        if (console.warn("[DualCanvasViewer] gltfLoader1 未初始化，正在初始化..."), this.initThreeLayer(), await new Promise((i) => requestAnimationFrame(i)), !this.gltfLoader1) {
          console.error("[DualCanvasViewer] gltfLoader1 初始化失败");
          return;
        }
        this.transformControls1 || (console.log("[DualCanvasViewer] 在 loadThreeModel 中初始化层 1 交互..."), this.initModelInteraction1());
      }
      console.log("[DualCanvasViewer] 自动切换到原始模型层"), this.activeLayer === "both" ? (this.interactionLayer = "three", this.updatePointerEvents()) : this.activeLayer === "bim" && (this.activeLayer = "both", this.interactionLayer = "three", this.updatePointerEvents()), console.log("[DualCanvasViewer] 正在加载", t.length, "个原始模型");
      const o = [];
      for (const i of t) {
        const n = i.name.split(".").pop().toLowerCase();
        if (n !== "glb" && n !== "gltf") {
          console.log("[DualCanvasViewer] 跳过非 GLTF 格式文件:", i.name);
          continue;
        }
        console.log("[DualCanvasViewer] 正在加载原始模型:", i.name);
        try {
          const r = await this.loadGLTFWithResources(i, t, this.gltfLoader1), a = r.scene;
          a.traverse((l) => {
            l.isMesh && (l.castShadow = !0, l.receiveShadow = !0);
          });
          let s = !1;
          a.traverse((l) => {
            l.isSkinnedMesh && (s = !0);
          }), a.userData.isSkinnedModel = s, a.userData.filePath = i.name, a.userData.animations = r.animations;
          const c = this.extractGeolocationFromGLTFAsset(r.asset, i.name);
          if (a.traverse((l) => {
            l.matrixAutoUpdate = !0;
          }), a.traverse((l) => {
            l.isMesh && l.material && (Array.isArray(l.material) ? l.material : [l.material]).forEach((g) => {
              g.userData._hasOriginalStateSaved || (g.userData.originalTransparent = g.transparent, g.userData.originalOpacity = g.opacity, g.userData._hasOriginalStateSaved = !0), g.side = h.DoubleSide, g.depthTest = !0, g.depthWrite = !0, g.needsUpdate = !0;
            });
          }), a.updateMatrixWorld(!0), c)
            if (a.userData.geoLocationFromAsset = c, c.enuCompensation && (a.userData.enuCompensation = c.enuCompensation, console.log("[DualCanvasViewer] 📋 已保存ENU补偿信息到模型userData:", {
              文件名: i.name,
              有补偿矩阵: !!c.enuCompensation.compensationMatrix
            })), c.rtcCenter) {
              const l = new h.Box3().setFromObject(a).getCenter(new h.Vector3());
              if (l.length() > 1e4) {
                console.log("[DualCanvasViewer] 🎯 RTC_CENTER 模型：顶点已包含绝对坐标，保持模型在原点:", {
                  文件名: i.name,
                  RTC_CENTER: c.rtcCenter,
                  边界框中心: l,
                  说明: "顶点数据已包含大坐标，无需设置模型位置（避免双重偏移）"
                }), a.position.set(0, 0, 0), a.updateMatrixWorld(!0);
                const u = new h.Box3().setFromObject(a).min.y;
                Math.abs(u) > 0.01 && (a.position.y -= u, a.updateMatrixWorld(!0), console.log("[DualCanvasViewer] 📐 绝对坐标模型底部对齐到地面:", {
                  文件名: i.name,
                  原底部高度: u.toFixed(2) + "米",
                  向下移动: (-u).toFixed(2) + "米",
                  新Y坐标: a.position.y.toFixed(2) + "米"
                })), a.userData.hasLargeCoordinates = !0, a.userData.isLargeCoordModel = !0, a.userData.isReferenceLargeCoordModel = !0, a.userData.rtcCenter = c.rtcCenter.clone(), a.userData.fromB3DM = !0, a.userData.detectedByRTC = !0, a.userData.verticesContainAbsoluteCoords = !0, a.userData.originalCenter = l.clone();
              } else {
                console.log("[DualCanvasViewer] 🎯 RTC_CENTER 模型：顶点是相对坐标，设置到局部墨卡托坐标系的原点:", {
                  文件名: i.name,
                  RTC_CENTER: c.rtcCenter,
                  边界框中心: l,
                  说明: "模型顶点是相对坐标，将模型放置在局部墨卡托坐标系原点"
                });
                const u = this.syncManager?.mercatorProjection || this.mercatorProjectionManager;
                let d = {
                  x: 0,
                  y: 0,
                  z: 0
                };
                if (u) {
                  if (u.setUseLocalCoordinateSystem) {
                    let F = !1;
                    typeof window < "u" && (window.__syncManager__ && typeof window.__syncManager__.isCesiumReady == "function" ? F = window.__syncManager__.isCesiumReady() : window.__cesiumViewer__ && (F = !0)), F ? u.setUseLocalCoordinateSystem(!0) : console.warn("[DualCanvasViewer] ⚠️ Cesium 未就绪，跳过局部坐标系设置，模型将以绝对坐标模式加载");
                  }
                  c.rtcCenter;
                  const y = c.longitude, w = c.latitude, V = c.altitude || 0, S = 6378137, T = y * Math.PI / 180, v = w * Math.PI / 180, D = T * S, _ = Math.log(Math.tan(Math.PI / 4 + v / 2)) * S;
                  let b = 0;
                  try {
                    const F = this.syncManager?.getCesium() || window.Cesium, P = window.__cesiumViewer__;
                    F && P && (b = await this._getTerrainHeightAtPosition(y, w, F, P), console.log("[DualCanvasViewer] ⭐ 地形高度采样（局部坐标系初始化）:", {
                      位置: `(${y.toFixed(6)}°, ${w.toFixed(6)}°)`,
                      模型海拔: V.toFixed(2) + "米",
                      地形高度: b.toFixed(2) + "米",
                      高度差: (V - b).toFixed(2) + "米"
                    }));
                  } catch (F) {
                    console.warn("[DualCanvasViewer] 地形高度采样失败，使用默认值 0:", F.message);
                  }
                  d = {
                    x: D,
                    y: _,
                    z: b
                  }, u.setFloorCenter && (u.setFloorCenter(d, V), u.setDualFloorHeightToTerrain(b));
                  const E = u.useLocalCoordinateSystem;
                  console.log(`[DualCanvasViewer] ✅ ${E ? "局部坐标系模式" : "非局部坐标系模式"}：地板中心已设置（含地形高度）:`, {
                    经纬度: `(${y.toFixed(6)}°, ${w.toFixed(6)}°)`,
                    墨卡托坐标: `(${D.toFixed(2)}, ${_.toFixed(2)})`,
                    模型海拔: V.toFixed(2) + "米",
                    地形高度: b.toFixed(2) + "米",
                    ENU原点高度: b.toFixed(2) + "米（地形表面）",
                    说明: "ENU原点在地形表面，红球在模型海拔"
                  });
                }
                a.position.set(0, 0, 0), a.updateMatrixWorld(!0);
                const m = new h.Box3().setFromObject(a), p = m.min.y, x = m.getCenter(new h.Vector3());
                a.position.y -= p, a.updateMatrixWorld(!0), c.altitude;
                const f = new h.Box3().setFromObject(a);
                if (console.warn("[DualCanvasViewer] 🔍 模型位置诊断（已对齐到地面）:", {
                  海拔高度: (c.altitude || 0).toFixed(2) + "米（由 MercatorProjectionManager 管理）",
                  模型局部位置Y: a.position.y.toFixed(2) + "米",
                  "--- 移动后的边界框 ---": "---",
                  模型底部局部Y: f.min.y.toFixed(2) + "米",
                  模型顶部局部Y: f.max.y.toFixed(2) + "米",
                  模型总高度: (f.max.y - f.min.y).toFixed(2) + "米",
                  "--- 关键分析 ---": "---",
                  说明1: "如果模型高度是400-500米，说明模型本身是竖直圆柱",
                  说明2: "模型底部应该在地面（海拔0米），圆柱顶部在400-500米高空",
                  说明3: "这是正常的！ENU原点在地面，模型底部也在地面"
                }), this.sceneContainer1) {
                  const y = new h.Vector3();
                  this.sceneContainer1.getWorldPosition(y), console.warn("[DualCanvasViewer] 🔍 sceneContainer1位置诊断:", {
                    局部位置: `(${this.sceneContainer1.position.x.toFixed(2)}, ${this.sceneContainer1.position.y.toFixed(2)}, ${this.sceneContainer1.position.z.toFixed(2)})`,
                    世界位置: `(${y.x.toFixed(2)}, ${y.y.toFixed(2)}, ${y.z.toFixed(2)})`,
                    说明: "sceneContainer位置非零会导致模型在高空"
                  });
                }
                const C = new h.Vector3();
                a.getWorldPosition(C), console.warn("[DualCanvasViewer] 🔍 完整层级结构诊断:", {
                  "--- 根场景 scene1 ---": "---",
                  scene1位置: "(0, 0, 0)",
                  "--- 场景容器 sceneContainer1 ---": "---",
                  sceneContainer1位置: this.sceneContainer1 ? `(${this.sceneContainer1.position.x.toFixed(2)}, ${this.sceneContainer1.position.y.toFixed(2)}, ${this.sceneContainer1.position.z.toFixed(2)})` : "不存在",
                  "--- 模型组 modelGroup1 ---": "---",
                  modelGroup1位置: this.modelGroup1 ? `(${this.modelGroup1.position.x.toFixed(2)}, ${this.modelGroup1.position.y.toFixed(2)}, ${this.modelGroup1.position.z.toFixed(2)})` : "不存在",
                  modelGroup1父对象: this.modelGroup1?.parent?.name || "none",
                  "--- 锚点容器 anchorContainer1 ---": "---",
                  anchorContainer1位置: this.anchorContainer1 ? `(${this.anchorContainer1.position.x.toFixed(2)}, ${this.anchorContainer1.position.y.toFixed(2)}, ${this.anchorContainer1.position.z.toFixed(2)})` : "不存在",
                  anchorContainer1父对象: this.anchorContainer1?.parent?.name || "none",
                  "--- 模型 ---": "---",
                  模型局部位置: `(${a.position.x.toFixed(2)}, ${a.position.y.toFixed(2)}, ${a.position.z.toFixed(2)})`,
                  模型世界位置: `(${C.x.toFixed(2)}, ${C.y.toFixed(2)}, ${C.z.toFixed(2)})`,
                  模型父对象: a.parent?.name || "none",
                  模型底部: m.min.y.toFixed(2) + "米",
                  模型顶部: m.max.y.toFixed(2) + "米",
                  模型高度: (m.max.y - m.min.y).toFixed(2) + "米"
                }), console.log("[DualCanvasViewer] 📐 模型已放置在局部墨卡托坐标系原点并对齐到地面:", {
                  文件名: i.name,
                  地板中心墨卡托: `(${d.x.toFixed(2)}, ${d.y.toFixed(2)})`,
                  原边界框: {
                    min: `(${m.min.x.toFixed(2)}, ${m.min.y.toFixed(2)}, ${m.min.z.toFixed(2)})`,
                    max: `(${m.max.x.toFixed(2)}, ${m.max.y.toFixed(2)}, ${m.max.z.toFixed(2)})`,
                    center: `(${x.x.toFixed(2)}, ${x.y.toFixed(2)}, ${x.z.toFixed(2)})`
                  },
                  原底部高度: p.toFixed(2) + "米",
                  向上移动: (-p).toFixed(2) + "米",
                  新位置: `(${a.position.x.toFixed(2)}, ${a.position.y.toFixed(2)}, ${a.position.z.toFixed(2)})`
                });
                const M = new h.Box3().setFromObject(a);
                a.userData.originalBoundingBox = M.clone(), a.userData.hasLargeCoordinates = !0, a.userData.isLargeCoordModel = !0, a.userData.isReferenceLargeCoordModel = !0, a.userData.rtcCenter = c.rtcCenter.clone(), a.userData.fromB3DM = !0, a.userData.detectedByRTC = !0, a.userData.verticesContainAbsoluteCoords = !1, a.userData.originalCenter = c.rtcCenter.clone();
              }
              const g = c?.enuCompensation || null;
              if (this.recordModelOriginalLocation(a, i.name, a.userData.originalCenter, c, g), a.userData.enuCompensation && a.userData.enuCompensation.compensationMatrix) {
                const u = a.userData.enuCompensation.compensationMatrix, d = u.ecefToENU, m = u.useOnlyHorizontal === !0;
                if (d && Array.isArray(d) && d.length === 3) {
                  console.log("[DualCanvasViewer] 🌍 应用 ENU 旋转补偿（局部坐标系模式）:", {
                    模型: i.name,
                    水平面补偿: m ? "是（只补偿贴地旋转方向）" : "否（全方向补偿）",
                    说明: m ? "直接使用 East 和 North 向量进行水平面旋转，UP 方向保持不变" : "直接使用ECEF→ENU矩阵对齐模型到ENU坐标系（不转置）",
                    补偿方式: m ? "水平面补偿" : "ECEF→ENU（行主序）",
                    "ECEF→ENU矩阵": d,
                    "East向量（行0）": d[0],
                    "North向量（行1）": d[1],
                    "Up向量（行2）": d[2]
                  });
                  const p = new h.Matrix4();
                  if (m) {
                    d[0];
                    const x = d[1];
                    d[2], console.log("[DualCanvasViewer] 🔍 North水平投影计算验证:", {
                      North原始: `(${x[0].toFixed(4)}, ${x[1].toFixed(4)}, ${x[2].toFixed(4)})`,
                      说明: "直接使用north数组元素创建水平投影"
                    }), console.log("[DualCanvasViewer] 🔍 将ENU East向量的X分量取反后转换到Three.js坐标系:", {
                      North原始: `(${x[0].toFixed(4)}, ${x[1].toFixed(4)}, ${x[2].toFixed(4)})`,
                      "ecefToENU[0] (ENU East原始)": `(${d[0][0].toFixed(4)}, ${d[0][1].toFixed(4)}, ${d[0][2].toFixed(4)})`,
                      说明: "ENU East X取反 → Three.js → 水平旋转角度（-155° → -25°）"
                    });
                    const f = d[0][0], C = d[0][1], M = d[0][2], y = -f, w = C, V = -M, S = Math.atan2(w, y), T = Math.cos(S), v = Math.sin(S), D = new h.Vector3(T, 0, v), _ = new h.Vector3(0, 1, 0), b = new h.Vector3(-v, 0, T);
                    p.set(D.x, D.y, D.z, 0, _.x, _.y, _.z, 0, b.x, b.y, b.z, 0, 0, 0, 0, 1);
                    const E = S * 180 / Math.PI;
                    console.log("[DualCanvasViewer] 📐 ENU水平面补偿（局部坐标系）:", {
                      ENU_North_原始: `(${x[0].toFixed(4)}, ${x[1].toFixed(4)}, ${x[2].toFixed(4)})`,
                      ENU_East_ECEF_原始: `(${f.toFixed(4)}, ${C.toFixed(4)}, ${M.toFixed(4)})`,
                      ENU_East_X取反后_Three: `(${y.toFixed(4)}, ${w.toFixed(4)}, ${V.toFixed(4)})`,
                      水平旋转角度: E.toFixed(2) + "°",
                      说明: "ENU East X取反 → Three.js → 计算水平旋转角度（期望: -25°）"
                    });
                  } else p.set(d[0][0], d[0][1], d[0][2], 0, d[1][0], d[1][1], d[1][2], 0, d[2][0], d[2][1], d[2][2], 0, 0, 0, 0, 1);
                  typeof window < "u" && window.__ENU_COMPENSATION_ENABLED__ ? (a.quaternion.setFromRotationMatrix(p), a.userData._enuCompensationApplied = !0, a.updateMatrixWorld(), console.log("[DualCanvasViewer] ✅ ENU 补偿已应用（局部坐标系模式）")) : console.log("[DualCanvasViewer] ⚠️ ENU 补偿已禁用（测试模式）"), a.userData._zupYupConversionPending = !0;
                } else console.warn("[DualCanvasViewer] ⚠️ ENU补偿矩阵格式不正确:", {
                  有ecefToENU: !!d,
                  是数组: Array.isArray(d),
                  长度: d?.length
                });
              } else console.log("[DualCanvasViewer] ℹ️ 局部坐标系模式：模型无ENU补偿信息或补偿矩阵，跳过旋转补偿");
              if (i.name.includes("ECEF_to_ThreeJS"))
                a.userData.enuCompensation && a.userData.enuCompensation.compensationMatrix && window.__ENU_COMPENSATION_ENABLED__ ? console.log("[DualCanvasViewer] ⏭️ 检测到取反轴版本模型，已保留ENU补偿，跳过重置quaternion") : (console.log("[DualCanvasViewer] ⏭️ 检测到取反轴版本模型（局部坐标系模式），跳过旋转"), a.quaternion.set(0, 0, 0, 1), a.updateMatrixWorld()), a.userData._zupYupConversionDone = !0, console.log("[DualCanvasViewer] ✅ 已标记 ECEF_to_ThreeJS 模型的 Z-up/Y-up 转换完成");
              else {
                let u = new h.Box3().setFromObject(a);
                const d = new h.Vector3();
                u.getSize(d);
                const m = d.z > d.y && d.z > d.x;
                if (console.log("[DualCanvasViewer] 🔍 模型坐标系检测（局部坐标系模式）:", {
                  模型: i.name,
                  边界框尺寸: `X=${d.x.toFixed(2)}m, Y=${d.y.toFixed(2)}m, Z=${d.z.toFixed(2)}m`,
                  最大尺寸: Math.max(d.x, d.y, d.z).toFixed(2) + "m",
                  坐标系类型: m ? "Z-up（需要旋转）" : "Y-up（标准）"
                }), m) {
                  const p = new h.Matrix4();
                  p.makeRotationX(-Math.PI / 2);
                  const x = new h.Quaternion();
                  if (x.setFromRotationMatrix(p), a.userData.enuCompensation && a.userData.enuCompensation.compensationMatrix) {
                    const M = a.quaternion.clone();
                    a.quaternion.multiplyQuaternions(x, M), console.log("[DualCanvasViewer] 🔄 组合旋转: ENU补偿 × Z-up→Y-up");
                  } else a.quaternion.copy(x);
                  a.updateMatrixWorld();
                  let f = new h.Box3().setFromObject(a);
                  const C = new h.Vector3();
                  f.getSize(C), console.log("[DualCanvasViewer] ✅ Z-up 模型已旋转到 Y-up:", {
                    旋转前: `Z=${d.z.toFixed(2)}m（最大）`,
                    旋转后: `Y=${C.y.toFixed(2)}m（最大）`,
                    说明: "Z轴已旋转到Y轴位置"
                  }), a.userData._zupYupConversionDone = !0;
                } else
                  console.log("[DualCanvasViewer] ✅ Y-up 模型无需旋转:", { 说明: "模型已使用标准 Y-up 坐标系" }), a.userData._zupYupConversionDone = !0;
              }
              a.userData.originalLocation ? console.log("[DualCanvasViewer] ✅ recordModelOriginalLocation 成功，originalLocation 已设置") : (console.warn("[DualCanvasViewer] ⚠️ recordModelOriginalLocation 失败，使用回退方案设置 basic location"), a.userData.originalLocation = {
                three: {
                  x: a.userData.originalCenter.x,
                  y: a.userData.originalCenter.y,
                  z: a.userData.originalCenter.z
                },
                longitude: 0,
                latitude: 0,
                altitude: 0,
                mercator: {
                  x: a.userData.originalCenter.x,
                  y: a.userData.originalCenter.y,
                  z: a.userData.originalCenter.z
                },
                cartographic: null,
                source: "RTC_CENTER_fallback",
                fileName: i.name
              }, console.warn("[DualCanvasViewer] ✅ 已设置回退 originalLocation")), console.log("[DualCanvasViewer] ⏭️ 跳过基于顶点的大坐标检测（使用 RTC_CENTER）");
            } else console.log("[DualCanvasViewer] ⚠️ 没有 RTC_CENTER，将使用 handleLargeCoordinateModel 进行检测");
          if (this.modelGroup1.add(a), this.updateAnchorContainerPosition(), this.handleLargeCoordinateModel(a), this.referenceModelPosition && !a.userData.originalCenter && this.moveModelToReferencePoint(a), o.push(a), this.threeObjectCount++, this.addModelToList(a, i.name, "three"), r.animations && r.animations.length > 0 && this.setupModelAnimation(a, r.animations, 1), console.log("[DualCanvasViewer] 原始模型加载成功:", i.name, "动画数:", r.animations?.length || 0), this.sceneRotationInitialized && this.modelMercatorMetadata) {
            const l = (g) => {
              if (!g) return;
              const u = new h.Vector3();
              g.getWorldPosition(u), this.modelMercatorMetadata.registerModel(g, { enuPosition: u }), g.children && g.children.length > 0 && g.children.forEach((d) => l(d));
            };
            l(a), this.modelMercatorMetadata.updateAllMercatorCoords(), console.log("[DualCanvasViewer] ✅ 已注册模型墨卡托元数据");
          }
          (a.userData.hasLargeCoordinates || a.userData.hasLargeSize) && (console.log("[DualCanvasViewer] 大坐标模型信息:", {
            originalCenter: a.userData.originalCenter,
            hasLargeCoordinates: a.userData.hasLargeCoordinates,
            hasLargeSize: a.userData.hasLargeSize
          }), a.userData.originalLocation && a.userData.originalLocation.cartographic && await this.flyCesiumToModelLocation(a));
        } catch (r) {
          console.error("[DualCanvasViewer] 加载原始模型失败:", i.name, r);
        }
      }
      if (e.target.value = "", o.length > 0 && await this.handleLargeCoordModelCoexistence(o), o.length > 0 && (this.referenceModelPosition ? (console.log("[DualCanvasViewer] 存在参考位置，跳过网格排列，模型已在参考位置附近"), console.log("[DualCanvasViewer] 🔍 聚焦相机到模型位置（大坐标模型模式）"), this.focusOnModels(this.modelGroup1, this.camera1, this.controls1)) : o.length > 1 ? (console.log("[DualCanvasViewer] 正在排列", o.length, "个模型"), this.arrangeModelsInGrid(o, this.modelGroup1), this.focusOnModels(this.modelGroup1, this.camera1, this.controls1)) : (console.log("[DualCanvasViewer] 单个模型，进行缩放处理"), this.scaleModel(o[0], 10), this.focusOnModels(this.modelGroup1, this.camera1, this.controls1)), this.syncCameraFromThreeToBim(), this.applyControlsRestrictions()), typeof document < "u" && o.length > 0) {
        let i = null;
        for (const r of o) {
          const a = r.userData.originalLocation;
          if (a && a.longitude && a.latitude) {
            i = {
              longitude: a.longitude,
              latitude: a.latitude,
              height: a.altitude || 0
            };
            break;
          }
        }
        const n = new CustomEvent("DualCanvasModelsLoaded", { detail: {
          modelCount: o.length,
          layer: "three",
          useLocalCoordinateSystem: this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() || !1,
          modelLocation: i
        } });
        if (document.dispatchEvent(n), console.log("[DualCanvasViewer] ✅ 已触发 DualCanvasModelsLoaded 事件", {
          modelCount: o.length,
          useLocalCoordinateSystem: this.syncManager?.mercatorProjection?.isUsingLocalCoordinateSystem?.() || !1,
          modelLocation: i ? `(${i.longitude.toFixed(6)}°, ${i.latitude.toFixed(6)}°)` : "null"
        }), i && this.syncManager) if (this.syncManager.mercatorProjection?.isUsingLocalCoordinateSystem?.()) {
          console.log("[DualCanvasViewer] 🎯 局部坐标系模式：启用轻量级 ENU 坐标系（用于虚拟地板中心对齐）");
          let r = window.__enuCoordinateManager__;
          if (!r) {
            console.log("[DualCanvasViewer] ENU 管理器尚未初始化，正在初始化...");
            try {
              const f = this.syncManager?.getCesium() || window.Cesium;
              f && window.viewer && se.setCesium(f, window.viewer), window.__enuCoordinateManager__ = se, r = se, console.log("[DualCanvasViewer] ✅ ENU 管理器已初始化并设置到全局变量");
            } catch (f) {
              console.error("[DualCanvasViewer] ❌ ENU 管理器初始化失败:", f), r = null;
            }
          }
          if (r && this.syncManager) {
            const f = this.syncManager.mercatorProjection;
            if (console.log("[DualCanvasViewer] 🔍 ENU 初始化调试信息:", {
              mercatorProj存在: !!f,
              getVirtualFloorCenter存在: !!f?.getVirtualFloorCenter,
              useLocalCoordinateSystem: f?.isUsingLocalCoordinateSystem?.() || !1,
              modelAbsoluteMercator: f?.modelAbsoluteMercator ? {
                x: f.modelAbsoluteMercator.x.toFixed(2),
                y: f.modelAbsoluteMercator.y.toFixed(2),
                z: f.modelAbsoluteMercator.z?.toFixed(2) || "0"
              } : "undefined",
              floorCenterMercator: f?.floorCenterMercator ? {
                x: f.floorCenterMercator.x.toFixed(2),
                y: f.floorCenterMercator.y.toFixed(2),
                z: f.floorCenterMercator.z.toFixed(2)
              } : "undefined"
            }), f && f.getVirtualFloorCenter) {
              const C = f.getVirtualFloorCenter();
              console.log("[DualCanvasViewer] 📍 虚拟地板中心:", {
                x: C?.x?.toFixed(2) || "undefined",
                y: C?.y?.toFixed(2) || "undefined",
                z: C?.z?.toFixed(2) || "undefined"
              }), C && r.alignOriginWithVirtualFloorCenter ? (console.log("[DualCanvasViewer] 🎯 ENU 坐标系初始化（使用地形表面高度）:", {
                "virtualFloorCenter.x": C.x.toFixed(2),
                "virtualFloorCenter.y": C.y.toFixed(2),
                "virtualFloorCenter.z (ENU原点高度)": C.z.toFixed(2) + "米 (地形表面)",
                "modelAltitude (红球高度)": (i?.height || 0).toFixed(2) + "米 (模型海拔)",
                说明: "ENU原点在地形表面，红球在模型海拔，两者在水平方向对齐"
              }), r.alignOriginWithVirtualFloorCenter(C) ? (console.log("[DualCanvasViewer] ✅ ENU原点已与虚拟地板中心对齐"), this.syncManager.usingENU = !0, this.syncManager.enuOrigin = r.getOriginInfo(), this.usingENU = !0, this.mouseCoords.enuOrigin = r.getOriginInfo(), console.log("[DualCanvasViewer] ✅ ENU坐标系已启用（局部坐标系模式）", { ENU原点: r.getOriginInfo() })) : console.warn("[DualCanvasViewer] ⚠️ ENU原点对齐失败")) : console.warn("[DualCanvasViewer] ⚠️ virtualFloorCenter 或 alignOriginWithVirtualFloorCenter 不存在");
            } else console.warn("[DualCanvasViewer] ⚠️ mercatorProj 或 getVirtualFloorCenter 不存在");
          } else console.warn("[DualCanvasViewer] ⚠️ ENU 管理器不可用，跳过虚拟地板中心对齐");
          let a = i.height || 0;
          if (a === 0 && this.modelGroup1) {
            const f = this.modelGroup1.children.find((C) => C.userData.originalLocation?.cartographic?.height);
            f && (a = f.userData.originalLocation.cartographic.height, console.log("[DualCanvasViewer] 📍 从已加载模型获取海拔高度:", {
              模型: f.name,
              海拔: a.toFixed(2) + "米"
            }));
          }
          let s = a;
          try {
            const f = this.syncManager?.getCesium(), C = window.__cesiumViewer__;
            if (f && C && i.longitude && i.latitude) {
              console.warn("[DualCanvasViewer] 🔍 地形采样前的经纬度验证:", {
                原始经度: i.longitude,
                原始纬度: i.latitude,
                经度绝对值: Math.abs(i.longitude),
                纬度绝对值: Math.abs(i.latitude),
                经度是否超限: Math.abs(i.longitude) > 180,
                纬度是否超限: Math.abs(i.latitude) > 90
              });
              let M = i.longitude, y = i.latitude;
              Math.abs(M) > 180 || Math.abs(y) > 90 || Math.abs(M) > 1e3 || Math.abs(y) > 1e3 ? (console.warn("[DualCanvasViewer] ⚠️ 检测到异常经纬度值，进行弧度到度数转换:", {
                原始经度: M,
                原始纬度: y,
                转换后经度: M * 180 / Math.PI,
                转换后纬度: y * 180 / Math.PI
              }), M = M * 180 / Math.PI, y = y * 180 / Math.PI) : console.log("[DualCanvasViewer] ✅ 经纬度值在有效范围内，无需转换"), (Math.abs(M) > 180 || Math.abs(y) > 90) && console.error("[DualCanvasViewer] ❌ 经纬度值仍然超出有效范围，可能存在重复转换问题!", {
                经度: M,
                纬度: y
              });
              const w = await this._getTerrainHeightAtPosition(M, y, f, C);
              s = a - w, console.warn("[DualCanvasViewer] ⭐ 关键诊断信息（地形采样结果）:", {
                位置: `(${M.toFixed(6)}°, ${y.toFixed(6)}°)`,
                模型绝对海拔: a.toFixed(2) + "米",
                实际地形高度: w.toFixed(2) + "米",
                模型相对地面高度: s.toFixed(2) + "米",
                说明: w > 0 ? "地形已加载，使用地形高度计算相对高度" : "地形未加载，假设海平面高度为0米",
                ENU原点海拔: w.toFixed(2) + "米 (地形表面)",
                红球世界Y: `anchorY = ${a.toFixed(2)}米 (模型海拔)`,
                三坐标系统一: "ENU原点(地形)、红球(模型海拔)、Three.js原点 在水平方向对齐"
              });
              try {
                C.entities.add({
                  id: `enu-origin-marker-${Date.now()}`,
                  position: f.Cartesian3.fromDegrees(M, y, w),
                  point: {
                    pixelSize: 30,
                    color: f.Color.ORANGE,
                    outlineColor: f.Color.WHITE,
                    outlineWidth: 4,
                    heightReference: f.HeightReference.NONE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                  },
                  label: {
                    text: `ENU原点（地形，海拔${w.toFixed(0)}米）`,
                    font: "20px sans-serif",
                    fillColor: f.Color.ORANGE,
                    outlineColor: f.Color.WHITE,
                    outlineWidth: 2,
                    style: f.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: f.VerticalOrigin.BOTTOM,
                    pixelOffset: new f.Cartesian2(0, -40),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                  }
                }), console.warn("[DualCanvasViewer] 🟠 已在Cesium中添加ENU原点标记（橙色）", {
                  经纬度: `(${M.toFixed(6)}°, ${y.toFixed(6)}°)`,
                  ENU原点海拔: w.toFixed(2) + "米 (地形表面)",
                  红球海拔: a.toFixed(2) + "米 (模型海拔)",
                  高度差: (a - w).toFixed(2) + "米",
                  说明: "⭐ ENU原点在地形表面，红球在模型海拔，两者在水平方向对齐"
                });
              } catch (V) {
                console.error("[DualCanvasViewer] 添加ENU原点标记失败:", V.message);
              }
            }
          } catch (f) {
            console.warn("[DualCanvasViewer] ⚠️ 地形高度采样失败，使用模型海拔作为相对高度:", f.message);
          }
          const c = new h.Mesh(new h.SphereGeometry(10, 32, 32), new h.MeshPhongMaterial({
            color: 16711680,
            emissive: 16711680,
            emissiveIntensity: 0.5,
            shininess: 100,
            specular: 16777215,
            transparent: !0,
            opacity: 0.9
          })), l = 0;
          c.position.set(0, l, 0), c.name = "GroundMarker_Theoretical", console.warn("[DualCanvasViewer] 🔴 红色球体创建（添加到scene1前）:", {
            红球局部Y: l.toFixed(2),
            模型相对地面高度: s.toFixed(2) + "米",
            模型绝对海拔: a.toFixed(2) + "米",
            地形高度: "0米（采样失败）",
            说明: "红球在anchorContainer1中，应位于地形表面"
          }), this.anchorContainer1 ? (this.anchorContainer1.add(c), console.log("[DualCanvasViewer] ✅ 红色球体已直接添加到 anchorContainer1")) : (console.warn("[DualCanvasViewer] ⚠️ anchorContainer1 不存在，将红色球体添加到 scene1"), this.scene1.add(c));
          const g = new h.Vector3();
          c.getWorldPosition(g), console.warn("[DualCanvasViewer] 🔴 红色球体世界坐标（添加到scene1后）:", {
            世界X: g.x.toFixed(2),
            世界Y: g.y.toFixed(2),
            世界Z: g.z.toFixed(2),
            局部X: c.position.x.toFixed(2),
            局部Y: c.position.y.toFixed(2),
            局部Z: c.position.z.toFixed(2),
            父对象: c.parent.name || c.parent.type
          });
          const u = new h.Mesh(new h.SphereGeometry(12, 16, 16), new h.MeshBasicMaterial({
            color: 16711680,
            wireframe: !0,
            transparent: !0,
            opacity: 0.5
          }));
          u.position.copy(c.position), this.anchorContainer1 ? this.anchorContainer1.add(u) : this.scene1.add(u);
          const d = new h.Mesh(new h.SphereGeometry(15, 32, 32), new h.MeshPhongMaterial({
            color: 65280,
            emissive: 65280,
            emissiveIntensity: 1,
            shininess: 100,
            specular: 16777215,
            transparent: !0,
            opacity: 1
          }));
          d.position.set(0, 0, 0), d.name = "GroundMarker_ModelBottom", this.anchorContainer1 ? (this.anchorContainer1.add(d), console.log("[DualCanvasViewer] ✅ 绿色球体已添加到 anchorContainer1")) : (this.scene1.add(d), console.warn("[DualCanvasViewer] ⚠️ anchorContainer1 不存在，绿色球体添加到 scene1"));
          const m = new h.Mesh(new h.SphereGeometry(12, 16, 16), new h.MeshBasicMaterial({
            color: 65280,
            wireframe: !0,
            transparent: !0,
            opacity: 0.5
          }));
          m.position.copy(d.position), this.anchorContainer1 ? this.anchorContainer1.add(m) : this.scene1.add(m);
          const p = this.modelGroup1.children.find((f) => f.userData.hasLargeCoordinates || f.userData.isLargeCoordModel);
          if (p) {
            const f = new h.Box3().setFromObject(p).min.y, C = new h.Mesh(new h.SphereGeometry(10, 32, 32), new h.MeshPhongMaterial({
              color: 255,
              emissive: 255,
              emissiveIntensity: 0.5,
              shininess: 100,
              specular: 16777215,
              transparent: !0,
              opacity: 0.9
            }));
            C.position.set(0, f, 0), C.name = "GroundMarker_ActualModelBottom", this.scene1.add(C);
            const M = new h.Mesh(new h.SphereGeometry(12, 16, 16), new h.MeshBasicMaterial({
              color: 255,
              wireframe: !0,
              transparent: !0,
              opacity: 0.5
            }));
            M.position.copy(C.position), this.scene1.add(M);
            const y = new h.PointLight(16777215, 1, 500);
            y.position.set(50, 100, 50), this.scene1.add(y), console.log("[DualCanvasViewer] 🔍 调试标记球体已添加（增强版）:", {
              红色球体_理论地面: `y = ${(-s).toFixed(2)} (地形表面)`,
              绿色球体_Y原点: "y = 0.00",
              蓝色球体_模型实际底部: `y = ${f.toFixed(2)}`,
              模型海拔: a.toFixed(2) + "米",
              理论地面与模型底部距离: a.toFixed(2) + "米",
              说明: "红色=理论地面(海拔0米)，绿色=Y原点，蓝色=模型实际底部"
            }), console.warn("[DualCanvasViewer] 🔍 准备调用 _moveAnchorObjectsToAnchorContainer():", {
              anchorContainer1存在: !!this.anchorContainer1,
              gridHelper1存在: !!this.gridHelper1,
              scene1存在: !!this.scene1,
              scene1子对象数: this.scene1?.children.length || 0,
              anchorContainer1父对象: this.anchorContainer1?.parent?.type || "none"
            }), this._moveAnchorObjectsToAnchorContainer();
            const w = this.scene1.children.find((V) => V.name === "GroundMarker_Theoretical");
            if (w) {
              const V = new h.Vector3();
              w.getWorldPosition(V), console.warn("[DualCanvasViewer] 🔴 红色球体世界坐标（移动到anchorContainer后）:", {
                世界X: V.x.toFixed(2),
                世界Y: V.y.toFixed(2),
                世界Z: V.z.toFixed(2),
                新父对象: w.parent ? w.parent.name : "none",
                anchorContainer1位置: this.anchorContainer1 ? `(${this.anchorContainer1.position.x.toFixed(2)}, ${this.anchorContainer1.position.y.toFixed(2)}, ${this.anchorContainer1.position.z.toFixed(2)})` : "不存在"
              });
            }
            if (this.scene2) {
              const V = c.clone();
              this.scene2.add(V);
              const S = u.clone();
              this.scene2.add(S);
              const T = d.clone();
              this.scene2.add(T);
              const v = m.clone();
              if (this.scene2.add(v), typeof C < "u") {
                const _ = C.clone();
                this.scene2.add(_);
                const b = M.clone();
                this.scene2.add(b);
              }
              const D = new h.PointLight(16777215, 1, 500);
              D.position.set(50, 100, 50), this.scene2.add(D), console.log("[DualCanvasViewer] ✅ 调试标记球体已添加到 scene2 (BIM层)");
            }
          }
          typeof window < "u" && (window.__debugGridHelperOffset__ = 0, window.__adjustGridHelper__ = (f) => {
            window.__debugGridHelperOffset__ = f;
            const C = this.calculateAnchorContainerY(), M = C + f;
            this.anchorContainer1 && (this.anchorContainer1.position.set(0, M, 0), this.anchorContainer1.updateMatrixWorld(), this.anchorContainer2 && (this.anchorContainer2.position.set(0, M, 0), this.anchorContainer2.updateMatrixWorld()), console.log(`[调试] anchorContainer 位置已调整: 基准Y=${C.toFixed(2)}, 偏移=${f.toFixed(2)}, 最终Y=${M.toFixed(2)}`));
            const y = 0 + f;
            this.gridHelper1 && this.gridHelper1.parent === this.sceneContainer1 && (this.gridHelper1.position.y = y, this.gridHelper1.updateMatrixWorld(), console.log(`[调试] GridHelper1位置已调整: Y=${y.toFixed(2)} (偏移: ${f.toFixed(2)}米)`)), this.gridHelper2 && this.gridHelper2.parent === this.sceneContainer2 && (this.gridHelper2.position.y = y, this.gridHelper2.updateMatrixWorld(), console.log(`[调试] GridHelper2位置已调整: Y=${y.toFixed(2)} (偏移: ${f.toFixed(2)}米)`)), console.log(`[调试] 地板高度已调整: ${y.toFixed(2)} (偏移: ${f.toFixed(2)}米)`);
          }, console.log("[DualCanvasViewer] 🔧 调试功能已启用:", {
            说明: "使用 window.__adjustGridHelper__(offset) 调整地板高度",
            用法: "window.__adjustGridHelper__(10) = 向上移动 10 米",
            用法2: "window.__adjustGridHelper__(-5) = 向下移动 5 米",
            当前偏移: "0 米",
            基础Y: "0 米（地面）",
            调整对象: "GridHelper (地板)"
          }));
          const x = 0;
          if (this.gridHelper1) {
            const f = this.gridHelper1.parent, C = f?.name || "unnamed", M = f?.type || "none", y = f === this.anchorContainer1, w = f === this.sceneContainer1;
            if (console.log("[DualCanvasViewer] 🔍 GridHelper1 层级结构:", {
              父对象类型: M,
              父对象名称: C,
              在anchorContainer中: y,
              在sceneContainer中: w,
              GridHelper当前位置: `(${this.gridHelper1.position.x.toFixed(2)}, ${this.gridHelper1.position.y.toFixed(2)}, ${this.gridHelper1.position.z.toFixed(2)})`
            }), y)
              this.gridHelper1.position.set(0, 0, 0), console.log("[DualCanvasViewer] ✅ GridHelper1在anchorContainer中，位置设为(0, 0, 0)");
            else if (w) {
              const S = this.gridHelper1.position.x, T = this.gridHelper1.position.z;
              this.gridHelper1.position.set(S, x, T), console.log("[DualCanvasViewer] ✅ GridHelper1在sceneContainer中，位置设为地面Y:", x.toFixed(2) + "米");
            } else {
              const S = this.gridHelper1.position.x, T = this.gridHelper1.position.z;
              this.gridHelper1.position.set(S, x, T), console.log("[DualCanvasViewer] ⚠️ GridHelper1在未知父对象中，直接设置位置");
            }
            this.gridHelper1.updateMatrixWorld();
            const V = new h.Vector3();
            this.gridHelper1.getWorldPosition(V), console.warn("[DualCanvasViewer] ✅ GridHelper1位置已调整（局部坐标系模式）:", {
              目标世界Y: x.toFixed(2) + "米（地面）",
              实际世界Y: V.y.toFixed(2) + "米",
              模型海拔: a.toFixed(2) + "米",
              说明: y ? "GridHelper在anchorContainer中" : "GridHelper在sceneContainer中"
            });
          }
          if (this.gridHelper2) {
            const f = this.gridHelper2.parent, C = f?.name || "unnamed", M = f === this.anchorContainer2, y = f === this.sceneContainer2;
            if (console.log("[DualCanvasViewer] 🔍 GridHelper2 层级结构:", {
              父对象类型: f?.type || "none",
              父对象名称: C,
              在anchorContainer中: M,
              在sceneContainer中: y,
              GridHelper当前位置: `(${this.gridHelper2.position.x.toFixed(2)}, ${this.gridHelper2.position.y.toFixed(2)}, ${this.gridHelper2.position.z.toFixed(2)})`
            }), M)
              this.gridHelper2.position.set(0, 0, 0), console.log("[DualCanvasViewer] ✅ GridHelper2在anchorContainer中，位置设为(0, 0, 0)");
            else if (y) {
              const V = this.gridHelper2.position.x, S = this.gridHelper2.position.z;
              this.gridHelper2.position.set(V, x, S), console.log("[DualCanvasViewer] ✅ GridHelper2在sceneContainer中，位置设为地面Y:", x.toFixed(2) + "米");
            } else {
              const V = this.gridHelper2.position.x, S = this.gridHelper2.position.z;
              this.gridHelper2.position.set(V, x, S), console.log("[DualCanvasViewer] ⚠️ GridHelper2在未知父对象中，直接设置位置");
            }
            this.gridHelper2.updateMatrixWorld();
            const w = new h.Vector3();
            this.gridHelper2.getWorldPosition(w), console.log("[DualCanvasViewer] ✅ GridHelper2位置已调整（局部坐标系模式）:", {
              目标世界Y: x.toFixed(2) + "米（地面）",
              实际世界Y: w.y.toFixed(2) + "米",
              模型海拔: a.toFixed(2) + "米",
              说明: M ? "GridHelper在anchorContainer中" : "GridHelper在sceneContainer中"
            });
          }
          if (console.log("[DualCanvasViewer] 🎯 模型加载完成：检查并修复小模型倒置问题"), this.modelGroup1 && this.sceneContainer1) {
            const f = this.sceneContainer1;
            if (Math.abs(f.rotation.x) > 0.01 || Math.abs(f.rotation.y) > 0.01 || Math.abs(f.rotation.z) > 0.01) {
              console.log("[DualCanvasViewer] 🔍 检测到场景容器有旋转，应用倒置修复");
              const C = new h.Quaternion();
              C.setFromEuler(new h.Euler(f.rotation.x, f.rotation.y, f.rotation.z, "XYZ")), this.modelGroup1.children.forEach((M) => {
                if (!M.userData?.isLargeCoordModel) {
                  const y = M.userData?.fileName || M.name || "", w = C.clone().invert();
                  M.quaternion.multiply(w), M.updateMatrixWorld(!0), console.log("[DualCanvasViewer] ✅ 已应用场景容器反向旋转到模型:", {
                    模型: y,
                    场景容器旋转: `x=${(f.rotation.x * 180 / Math.PI).toFixed(1)}°, y=${(f.rotation.y * 180 / Math.PI).toFixed(1)}°, z=${(f.rotation.z * 180 / Math.PI).toFixed(1)}°`
                  });
                }
              }), console.log("[DualCanvasViewer] ✅ 模型加载完成时的倒置修复已完成");
            } else console.log("[DualCanvasViewer] ℹ️ 场景容器无旋转，无需修复");
          }
        } else
          console.log("[DualCanvasViewer] 🌍 全球墨卡托坐标模式：执行 ENU 初始化"), this.syncManager.initENUForLocalCoordMode(i.longitude, i.latitude, i.height).then((r) => {
            if (r) {
              console.log("[DualCanvasViewer] ✅ ENU 初始化成功");
              const a = this.syncManager.enuBasis;
              a && a.east && a.north && a.up && (console.log("[DualCanvasViewer] 🔄 旋转场景容器以对齐地形"), this.rotateSceneContainersToAlignTerrain(a), console.log("[DualCanvasViewer] ✅ 场景容器旋转完成"));
            } else console.warn("[DualCanvasViewer] ⚠️ ENU 初始化失败");
          });
      }
    },
    async loadBimModel(e) {
      const t = Array.from(e.target.files);
      if (t.length === 0) return;
      if (!this.gltfLoader2) {
        if (console.warn("[DualCanvasViewer] gltfLoader2 未初始化，正在初始化..."), this.initBimLayer(), await new Promise((i) => requestAnimationFrame(i)), !this.gltfLoader2) {
          console.error("[DualCanvasViewer] gltfLoader2 初始化失败");
          return;
        }
        this.transformControls2 || (console.log("[DualCanvasViewer] 在 loadBimModel 中初始化层 2 交互..."), this.initModelInteraction2());
      }
      console.log("[DualCanvasViewer] 自动切换到 BIM 模型层"), this.activeLayer === "both" ? (this.interactionLayer = "bim", this.updatePointerEvents()) : this.activeLayer === "three" && (this.activeLayer = "both", this.interactionLayer = "bim", this.updatePointerEvents()), console.log("[DualCanvasViewer] 正在加载", t.length, "个 BIM 模型");
      const o = [];
      for (const i of t) {
        console.log("[DualCanvasViewer] 正在加载 BIM 模型:", i.name);
        const n = i.name.split(".").pop().toLowerCase();
        try {
          if (n === "xkt") {
            console.log("[DualCanvasViewer] 使用 xeokit 加载 xkt 模型");
            const r = URL.createObjectURL(i);
            {
              const a = await this.loadXKTModel(r, i.name, i);
              a && (o.push(a), this.addModelToList(a, i.name, "bim"), this.referenceModelPosition && a.userData.isXKTModel && a.userData.xeokitViewer && (console.log("[DualCanvasViewer] 检测到参考位置，自动移动 XKT 模型到参考点附近"), await this.moveXKTModelToReferencePoint(a.userData.xeokitViewer, 0)));
            }
          } else if (n === "ifc") {
            console.log("[DualCanvasViewer] 使用 xeokit 加载 ifc 模型");
            const r = URL.createObjectURL(i);
            {
              const a = await this.loadIFCModel(r, i.name, i);
              a && (o.push(a), this.addModelToList(a, i.name, "bim"), this.referenceModelPosition && a.userData.isXKTModel && a.userData.xeokitViewer && (console.log("[DualCanvasViewer] 检测到参考位置，自动移动 IFC 模型到参考点附近"), await this.moveXKTModelToReferencePoint(a.userData.xeokitViewer, 0)));
            }
          } else if (n === "glb" || n === "gltf") {
            const r = await this.loadGLTFWithResources(i, t, this.gltfLoader2), a = r.scene;
            a.traverse((c) => {
              c.isMesh && (c.castShadow = !0, c.receiveShadow = !0);
            });
            let s = !1;
            if (a.traverse((c) => {
              c.isSkinnedMesh && (s = !0);
            }), a.userData.isSkinnedModel = s, a.userData.filePath = i.name, a.userData.animations = r.animations, this.modelGroup2.add(a), this.handleLargeCoordinateModel(a), this.referenceModelPosition && !a.userData.originalCenter && this.moveModelToReferencePoint(a), o.push(a), this.bimObjectCount++, this.addModelToList(a, i.name, "bim"), r.animations && r.animations.length > 0 && this.setupModelAnimation(a, r.animations, 2), console.log("[DualCanvasViewer] BIM 模型加载成功:", i.name, "动画数:", r.animations?.length || 0), this.sceneRotationInitialized && this.modelMercatorMetadata) {
              const c = (l) => {
                if (!l) return;
                const g = new h.Vector3();
                l.getWorldPosition(g), this.modelMercatorMetadata.registerModel(l, { enuPosition: g }), l.children && l.children.length > 0 && l.children.forEach((u) => c(u));
              };
              c(a), this.modelMercatorMetadata.updateAllMercatorCoords(), console.log("[DualCanvasViewer] ✅ 已注册 BIM 模型墨卡托元数据");
            }
            (a.userData.hasLargeCoordinates || a.userData.hasLargeSize) && console.log("[DualCanvasViewer] 大坐标模型信息:", {
              originalCenter: a.userData.originalCenter,
              hasLargeCoordinates: a.userData.hasLargeCoordinates,
              hasLargeSize: a.userData.hasLargeSize
            });
          }
        } catch (r) {
          console.error("[DualCanvasViewer] 加载 BIM 模型失败:", i.name, r);
        }
      }
      if (e.target.value = "", o.length > 0) {
        if (this.referenceModelPosition)
          console.log("[DualCanvasViewer] 存在参考位置，跳过网格排列，模型已在参考位置附近"), this.focusOnModels(this.modelGroup2, this.camera2, this.controls2);
        else if (o.length > 1)
          console.log("[DualCanvasViewer] 正在排列", o.length, "个 BIM 模型"), this.arrangeModelsInGrid(o, this.modelGroup2), this.focusOnModels(this.modelGroup2, this.camera2, this.controls2);
        else {
          const i = o[0];
          if (i && i.userData.isXKTModel) {
            console.log("[DualCanvasViewer] 单个 XKT 模型，检查是否为大坐标模型");
            const n = this.isLargeCoordinateModel(i);
            if (console.log("[DualCanvasViewer] XKT 模型大坐标检查:", n), n) {
              console.log("[DualCanvasViewer] 检测到大坐标 XKT 模型，跳过相机同步以保持 xeokit 相机在正确位置"), this.adjustCameraFarForLargeCoords();
              return;
            } else {
              console.log("[DualCanvasViewer] 单个 XKT 模型（非大坐标），使用反向相机同步（Three.js → xeokit）"), this.syncCameraToXeokit();
              return;
            }
          } else
            console.log("[DualCanvasViewer] 单个 BIM 模型，进行缩放处理"), this.scaleModel(i, 10), this.focusOnModels(this.modelGroup2, this.camera2, this.controls2);
        }
        this.syncCameraFromBimToThree();
      }
    },
    async loadXKTModel(e, t, o = null, i = null, n = !1) {
      return console.log("[DualCanvasViewer] 开始加载 XKT 模型:", t), i && console.log("[DualCanvasViewer] 初始位置:", i), n && console.log("[DualCanvasViewer] 重新加载模式 - 跳过大坐标处理"), new Promise((r, a) => {
        try {
          if (!window.xeokitSDK) {
            a(/* @__PURE__ */ new Error("xeokit SDK 未加载。请将 XKT 文件转换为 GLB 格式后加载。")), this.showIFCTransferHint(t);
            return;
          }
          const s = this.$refs.bimContainer;
          if (!s) {
            a(/* @__PURE__ */ new Error("BIM 容器未找到"));
            return;
          }
          const c = s.querySelectorAll('canvas[id^="tempXKTCanvas_"]');
          if (c.length > 0) {
            const m = /* @__PURE__ */ new Set();
            this.xeokitViewers.forEach((p) => {
              p.canvas && p.canvas.parentNode && m.add(p.canvas);
            }), c.forEach((p) => {
              if (!m.has(p)) {
                console.log("[DualCanvasViewer] 清理加载前发现的失效canvas:", p.id);
                try {
                  p.parentNode.removeChild(p);
                } catch {
                }
              }
            });
          }
          const l = document.createElement("canvas");
          l.id = "tempXKTCanvas_" + Date.now(), l.style.position = "absolute", l.style.top = "0", l.style.left = "0", l.style.pointerEvents = "auto", s.appendChild(l);
          const g = s.getBoundingClientRect();
          l.style.width = g.width + "px", l.style.height = g.height + "px", l.width = g.width, l.height = g.height;
          const u = document.createElement("div");
          u.style.position = "absolute", u.style.width = "1px", u.style.height = "1px", u.style.overflow = "hidden", u.style.zIndex = "-1", u.style.display = "none", document.body.appendChild(u);
          const d = new window.xeokitSDK.Viewer({
            canvasId: l.id,
            transparent: !0,
            logarithmicDepthBuffer: !0,
            skybox: !1,
            gammaFactor: 1
          });
          d.scene && (d.scene.up = [
            0,
            1,
            0
          ], console.log("[DualCanvasViewer] 已设置 xeokit scene 坐标系为 Y-up")), fetch(e).then((m) => {
            if (!m.ok) throw new Error("Failed to fetch file: " + m.statusText);
            return m.arrayBuffer();
          }).then((m) => {
            console.log("[DualCanvasViewer] XKT 文件已读取为 ArrayBuffer，大小:", m.byteLength);
            const p = new window.xeokitSDK.XKTLoaderPlugin(d, { dataSource: { getXKT: (M, y, w) => {
              console.log("[DualCanvasViewer] 使用 ArrayBuffer 加载 XKT 模型"), y(m);
            } } });
            let x = !1;
            const f = setTimeout(() => {
              if (!x) {
                try {
                  d.destroy();
                } catch {
                }
                u.remove(), a(/* @__PURE__ */ new Error("XKT 模型加载超时（30秒）。请确保文件格式正确。"));
              }
            }, 3e4), C = p.load({
              id: t,
              src: e,
              edges: !0
            });
            C.on("loaded", () => {
              x = !0, clearTimeout(f), console.log("[DualCanvasViewer] XKT 模型加载成功:", t), !d.canvas && l && (d.canvas = l, console.log("[DualCanvasViewer] 手动设置 viewer.canvas:", l.id));
              const M = d.scene.models, y = Object.keys(M);
              if (y.length > 0) {
                const w = M[y[0]], V = this.$refs.bimContainer;
                l.style.zIndex = "2";
                const S = () => {
                  this.interactionLayer === "bim" ? (l.style.pointerEvents = "auto", l.style.zIndex = "10", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "none")) : (l.style.pointerEvents = "none", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "auto"));
                };
                S(), l._updatePointerEvents = S;
                const T = V.getBoundingClientRect();
                l.width = T.width, l.height = T.height, d.glRenderer && d.glRenderer.canvas && (d.glRenderer.canvas.width = T.width, d.glRenderer.canvas.height = T.height, d.glRenderer.gl && d.glRenderer.gl.viewport(0, 0, T.width, T.height)), console.log("[DualCanvasViewer] 已同步 xeokit canvas 尺寸:", T.width, "x", T.height), this.xeokitViewers.push({
                  viewer: d,
                  canvas: l,
                  model: w,
                  container: u,
                  fileName: t,
                  fileUrl: e,
                  fileType: "xkt"
                });
                const v = new h.Group();
                v.userData.filePath = t, v.userData.fileName = t, v.userData.fileUrl = e, v.userData.originalFile = o, v.userData.isXKTModel = !0, v.userData.renderedByXeokit = !0, v.userData.xeokitViewer = d, this.modelGroup2.add(v), this.bimObjectCount++;
                const D = w.aabb;
                let _, b, E, F = !1;
                if (D) {
                  _ = {
                    x: (D[0] + D[3]) / 2,
                    y: (D[1] + D[4]) / 2,
                    z: (D[2] + D[5]) / 2
                  }, b = {
                    x: D[3] - D[0],
                    y: D[4] - D[1],
                    z: D[5] - D[2]
                  }, E = Math.sqrt(_.x * _.x + _.y * _.y + _.z * _.z), F = E > 1e4;
                  const L = F;
                  n && F && (console.log("[DualCanvasViewer] 重新加载模式：将大坐标模型重置为从原点开始"), F = !1), v.userData.hasLargeCoordinates = L, v.userData.originallyHadLargeCoordinates = L, console.log("[DualCanvasViewer] XKT 模型坐标分析:", {
                    xeokitCenter: _,
                    xeokitSize: b,
                    centerLength: E.toFixed(2),
                    hasLargeCoordinates: F,
                    isReloading: n
                  });
                  let A = [
                    _.x,
                    _.y,
                    _.z
                  ], U = { ..._ };
                  if (L && !n) {
                    const $ = {
                      x: _.x,
                      y: _.y,
                      z: _.z
                    };
                    v.userData.originalXeokitCenter = $;
                    let N = null;
                    const Y = (this.modelGroup1?.children || []).find((te) => te.userData.isLargeCoordModel || te.userData.hasLargeCoordinates);
                    if (Y) {
                      const te = Y.position.clone(), Ee = new h.Box3().setFromObject(Y), we = new h.Vector3();
                      Ee.getSize(we);
                      const Pe = Math.max(we.x, we.y, we.z) * 0.1 + 10;
                      N = te.clone(), N.x += Pe, console.log("[DualCanvasViewer] 检测到层1大坐标模型，将XKT模型移动到附近:", {
                        layer1Model: Y.userData?.filePath || Y.name,
                        largeModelPosition: `(${te.x.toFixed(2)}, ${te.y.toFixed(2)}, ${te.z.toFixed(2)})`,
                        targetPosition: `(${N.x.toFixed(2)}, ${N.y.toFixed(2)}, ${N.z.toFixed(2)})`
                      });
                    } else
                      console.log("[DualCanvasViewer] 未检测到层1大坐标模型，将XKT模型移动到原点"), N = new h.Vector3(0, 0, 0);
                    const he = d.scene.models, ge = Object.keys(he);
                    if (ge.length > 0) {
                      const te = he[ge[0]];
                      te.position = [
                        N.x - $.x,
                        N.y - $.y,
                        N.z - $.z
                      ], console.log("[DualCanvasViewer] 大坐标 XKT 模型已移动:", {
                        fileName: t,
                        originalPosition: `(${$.x.toFixed(2)}, ${$.y.toFixed(2)}, ${$.z.toFixed(2)})`,
                        targetPosition: `(${N.x.toFixed(2)}, ${N.y.toFixed(2)}, ${N.z.toFixed(2)})`,
                        newPosition: `(${te.position[0].toFixed(2)}, ${te.position[1].toFixed(2)}, ${te.position[2].toFixed(2)})`
                      });
                    } else console.warn("[DualCanvasViewer] 警告：xeokit scene.models 为空，无法移动模型");
                    A = [
                      N.x,
                      N.y,
                      N.z
                    ], U = {
                      x: N.x,
                      y: N.y,
                      z: N.z
                    }, v.position.copy(N), v.userData.positionOffset = {
                      x: N.x,
                      y: N.y,
                      z: N.z
                    }, console.log("[DualCanvasViewer] 大坐标 XKT 模型 - 初次加载，移动完成", {
                      originalCenter: $,
                      targetPosition: `(${N.x.toFixed(2)}, ${N.y.toFixed(2)}, ${N.z.toFixed(2)})`,
                      logarithmicDepthBuffer: "始终启用"
                    });
                  } else if (L && n) {
                    const $ = {
                      x: _.x,
                      y: _.y,
                      z: _.z
                    };
                    v.userData.originalXeokitCenter = $;
                    const N = d.scene.models, Y = Object.keys(N);
                    if (Y.length > 0) {
                      const he = N[Y[0]];
                      he.position = [
                        0,
                        0,
                        0
                      ], console.log("[DualCanvasViewer] 重新加载大坐标模型：设置 model.position = [0, 0, 0]", {
                        fileName: t,
                        modelPosition: he.position
                      });
                    }
                    i && this.isInRealWorldCoordinates ? (A = [
                      i.x,
                      i.y,
                      i.z
                    ], U = {
                      x: i.x,
                      y: i.y,
                      z: i.z
                    }, console.log("[DualCanvasViewer] 重新加载大坐标模型 - 真实世界坐标系统，使用目标位置", {
                      originalCenter: $,
                      targetPosition: i,
                      cameraLookTarget: A
                    })) : (A = [
                      _.x,
                      _.y,
                      _.z
                    ], U = {
                      x: _.x,
                      y: _.y,
                      z: _.z
                    }, console.log("[DualCanvasViewer] 重新加载大坐标模型 - 虚拟坐标系，使用大坐标位置", {
                      originalCenter: $,
                      logarithmicDepthBuffer: "始终启用",
                      cameraLookTarget: A
                    }));
                  }
                  const H = Math.max(b.x, b.y, b.z) * 2;
                  if (d.camera.eye = [
                    A[0] + H,
                    A[1] + H * 0.5,
                    A[2] + H
                  ], d.camera.look = A, d.camera.up = [
                    0,
                    1,
                    0
                  ], F || L) if (n && L) {
                    const $ = Math.max(b.x, b.y, b.z), N = H || $ * 2, Y = $ / 100, he = N / 100;
                    d.camera.project.near = Math.max(0.1, Math.min(Y, he)), d.camera.project.far = N * 100, console.log("[DualCanvasViewer] 重新加载大坐标模型：根据模型尺寸动态调整 near/far", {
                      modelSize: $.toFixed(2),
                      distToModel: N.toFixed(2),
                      near: d.camera.project.near,
                      far: d.camera.project.far,
                      ratio: (d.camera.project.far / d.camera.project.near).toFixed(2)
                    });
                  } else {
                    const $ = Math.max(b.x, b.y, b.z);
                    d.camera.project.near = Math.max(0.1, Math.min($ / 100, 100)), d.camera.project.far = 1e8, console.log("[DualCanvasViewer] 大坐标模型（初次加载）：根据模型尺寸动态设置 near 值", {
                      modelSize: $.toFixed(2),
                      near: d.camera.project.near,
                      far: d.camera.project.far
                    });
                  }
                  console.log("[DualCanvasViewer] xeokit camera 设置:", {
                    eye: d.camera.eye,
                    look: d.camera.look,
                    up: d.camera.up,
                    aabb: D,
                    hasLargeCoordinates: F,
                    actualCenter: U
                  });
                  const ee = {
                    get eye() {
                      return d.camera.eye;
                    },
                    set eye($) {
                      d.camera.eye = $;
                    },
                    get look() {
                      return d.camera.look;
                    },
                    set look($) {
                      d.camera.look = $;
                    },
                    get up() {
                      return d.camera.up;
                    },
                    set up($) {
                      d.camera.up = $;
                    },
                    toThreeCamera: () => {
                      const $ = new h.PerspectiveCamera();
                      $.position.set(d.camera.eye[0], d.camera.eye[1], d.camera.eye[2]);
                      const N = new h.Vector3(d.camera.look[0], d.camera.look[1], d.camera.look[2]), Y = new h.Vector3(d.camera.up[0], d.camera.up[1], d.camera.up[2]);
                      return $.up.copy(Y), $.lookAt(N), $;
                    }
                  }, O = "xeokit_" + t;
                  this.viewportManager.registerLayer(O, {
                    camera: ee,
                    scene: this.scene2,
                    container: V,
                    raycaster: null,
                    mouseVector: new h.Vector2(),
                    controls: null,
                    modelGroup: this.modelGroup2,
                    selectedModel: null,
                    transformControls: null,
                    isXeokitLayer: !0,
                    xeokitViewer: d,
                    xeokitCamera: ee
                  }), console.log("[DualCanvasViewer] 已将 xeokit viewer 注册到统一视口管理器:", O), v.userData.xeokitLayerId = O, console.log("[DualCanvasViewer] ===== 坐标系调试信息 ====="), console.log("[DualCanvasViewer] scene2 变换:", {
                    position: `(${this.scene2.position.x.toFixed(2)}, ${this.scene2.position.y.toFixed(2)}, ${this.scene2.position.z.toFixed(2)})`,
                    rotation: `(${this.scene2.rotation.x.toFixed(2)}, ${this.scene2.rotation.y.toFixed(2)}, ${this.scene2.rotation.z.toFixed(2)})`,
                    scale: `(${this.scene2.scale.x.toFixed(2)}, ${this.scene2.scale.y.toFixed(2)}, ${this.scene2.scale.z.toFixed(2)})`
                  }), console.log("[DualCanvasViewer] modelGroup2 变换:", {
                    position: `(${this.modelGroup2.position.x.toFixed(2)}, ${this.modelGroup2.position.y.toFixed(2)}, ${this.modelGroup2.position.z.toFixed(2)})`,
                    rotation: `(${this.modelGroup2.rotation.x.toFixed(2)}, ${this.modelGroup2.rotation.y.toFixed(2)}, ${this.modelGroup2.rotation.z.toFixed(2)})`,
                    scale: `(${this.modelGroup2.scale.x.toFixed(2)}, ${this.modelGroup2.scale.y.toFixed(2)}, ${this.modelGroup2.scale.z.toFixed(2)})`
                  }), console.log("[DualCanvasViewer] threeModel (占位符) 变换:", { position: `(${v.position.x.toFixed(2)}, ${v.position.y.toFixed(2)}, ${v.position.z.toFixed(2)})` }), console.log("[DualCanvasViewer] ===== XKT 模型 AABB 调试信息 ====="), console.log("[DualCanvasViewer] xeokit 原始 AABB (xeokit 坐标系):", { aabb: `[${D[0].toFixed(2)}, ${D[1].toFixed(2)}, ${D[2].toFixed(2)}, ${D[3].toFixed(2)}, ${D[4].toFixed(2)}, ${D[5].toFixed(2)}]` });
                  const B = {
                    x: Math.abs(D[3] - D[0]),
                    y: Math.abs(D[4] - D[1]),
                    z: Math.abs(D[5] - D[2])
                  };
                  let k, Q, X, j, G;
                  if (n && E > 1e4)
                    console.log("[DualCanvasViewer] 重新加载大坐标模型 - 使用虚拟AABB（原点）"), j = new h.Vector3(B.x, B.y, B.z), X = new h.Vector3(0, 0, 0), k = new h.Vector3(-j.x / 2, -j.y / 2, -j.z / 2), Q = new h.Vector3(j.x / 2, j.y / 2, j.z / 2), G = new h.Box3(k, Q);
                  else {
                    const $ = {
                      x: (D[0] + D[3]) / 2,
                      y: (D[1] + D[4]) / 2,
                      z: (D[2] + D[5]) / 2
                    };
                    console.log("[DualCanvasViewer] 原始 AABB 尺寸:", `(${B.x.toFixed(2)}, ${B.y.toFixed(2)}, ${B.z.toFixed(2)})`), console.log("[DualCanvasViewer] 原始 AABB 中心:", `(${$.x.toFixed(2)}, ${$.y.toFixed(2)}, ${$.z.toFixed(2)})`);
                    const N = (Ee, we, Pe) => ({
                      x: Ee,
                      y: we,
                      z: -Pe
                    }), Y = {
                      x: D[0],
                      y: D[1],
                      z: D[2]
                    }, he = {
                      x: D[3],
                      y: D[4],
                      z: D[5]
                    }, ge = N(Y.x, Y.y, Y.z), te = N(he.x, he.y, he.z);
                    k = new h.Vector3(Math.min(ge.x, te.x), Math.min(ge.y, te.y), Math.min(ge.z, te.z)), Q = new h.Vector3(Math.max(ge.x, te.x), Math.max(ge.y, te.y), Math.max(ge.z, te.z)), G = new h.Box3(k, Q), X = G.getCenter(new h.Vector3()), j = G.getSize(new h.Vector3());
                  }
                  let W = X.clone(), K = G.clone();
                  if (F && v.userData.positionOffset && !n) {
                    const $ = v.position;
                    W.set(X.x + $.x, X.y + $.y, X.z + $.z), K.min.set(G.min.x + $.x, G.min.y + $.y, G.min.z + $.z), K.max.set(G.max.x + $.x, G.max.y + $.y, G.max.z + $.z), console.log("[DualCanvasViewer] 大坐标模型 - 包围盒已调整到移动后的位置:", {
                      originalCenter: `(${X.x.toFixed(2)}, ${X.y.toFixed(2)}, ${X.z.toFixed(2)})`,
                      originalBox: {
                        min: `(${G.min.x.toFixed(2)}, ${G.min.y.toFixed(2)}, ${G.min.z.toFixed(2)})`,
                        max: `(${G.max.x.toFixed(2)}, ${G.max.y.toFixed(2)}, ${G.max.z.toFixed(2)})`
                      },
                      modelPosition: `(${$.x.toFixed(2)}, ${$.y.toFixed(2)}, ${$.z.toFixed(2)})`,
                      adjustedCenter: `(${W.x.toFixed(2)}, ${W.y.toFixed(2)}, ${W.z.toFixed(2)})`,
                      adjustedBox: {
                        min: `(${K.min.x.toFixed(2)}, ${K.min.y.toFixed(2)}, ${K.min.z.toFixed(2)})`,
                        max: `(${K.max.x.toFixed(2)}, ${K.max.y.toFixed(2)}, ${K.max.z.toFixed(2)})`
                      },
                      positionOffset: v.userData.positionOffset
                    });
                  }
                  console.log("[DualCanvasViewer] XKT 模型包围盒信息 (Three.js 坐标系):", {
                    fileName: t,
                    layerId: O,
                    center: `(${W.x.toFixed(2)}, ${W.y.toFixed(2)}, ${W.z.toFixed(2)})`,
                    size: `(${j.x.toFixed(2)}, ${j.y.toFixed(2)}, ${j.z.toFixed(2)})`,
                    maxSize: Math.max(j.x, j.y, j.z).toFixed(2) + " 米",
                    hasLargeCoordinates: F,
                    注意: F ? "大坐标模型已移动到原点" : "正常坐标模型"
                  }), console.log("[DualCanvasViewer] XKT 模型包围盒数据已保存（不创建可视化）"), v.userData.boundingBox = K, v.userData.boundingBoxCenter = W, v.userData.boundingBoxSize = j, F ? (v.userData.originalWorldPosition || (v.userData.originalWorldPosition = X.clone(), console.log("[DualCanvasViewer] 保存原始大坐标到 originalWorldPosition:", X)), v.userData.originalCenter = n ? W.clone() : X.clone()) : v.userData.originalCenter = W.clone(), console.log("[DualCanvasViewer] 已将包围盒数据存储到 model.userData:", {
                    boundingBoxCenter: `(${W.x.toFixed(2)}, ${W.y.toFixed(2)}, ${W.z.toFixed(2)})`,
                    size: `(${j.x.toFixed(2)}, ${j.y.toFixed(2)}, ${j.z.toFixed(2)})`,
                    originalCenter: `(${v.userData.originalCenter.x.toFixed(2)}, ${v.userData.originalCenter.y.toFixed(2)}, ${v.userData.originalCenter.z.toFixed(2)})`,
                    hasLargeCoordinates: F
                  });
                }
                u.remove(), this.initXeokitInteraction();
                const P = typeof window < "u" && window.__syncManager__, R = P && P.mercatorProjection && P.mercatorProjection.isUsingLocalCoordinateSystem && P.mercatorProjection.isUsingLocalCoordinateSystem();
                if (console.log("[DualCanvasViewer] XKT模型加载完成 - 坐标系检测:", {
                  hasSyncManager: !!P,
                  hasMercatorProjection: !!(P && P.mercatorProjection),
                  hasIsUsingLocalCoordinateSystem: !!(P && P.mercatorProjection && P.mercatorProjection.isUsingLocalCoordinateSystem),
                  isUsingLocalCoord: R,
                  floorCenterMercator: P && P.floorCenterMercator ? `(${P.floorCenterMercator.x.toFixed(2)}, ${P.floorCenterMercator.y.toFixed(2)})` : "null"
                }), this.camera2 && d.camera) if (R)
                  console.log("[DualCanvasViewer] 局部坐标系模式：camera2 与 camera1 保持同步（XKT模型加载完成后）"), this.camera1 && (this.camera2.position.copy(this.camera1.position), this.camera2.quaternion.copy(this.camera1.quaternion), this.camera2.up.copy(this.camera1.up), this.controls2 && this.controls1 && this.controls2.target.copy(this.controls1.target), this.camera2.updateMatrixWorld(!0));
                else {
                  console.log("[DualCanvasViewer] 真实世界模式：同步 camera2 到 xeokit 相机（XKT模型加载完成后）"), this.camera2.position.set(d.camera.eye[0], d.camera.eye[1], d.camera.eye[2]);
                  const L = new h.Vector3(d.camera.look[0], d.camera.look[1], d.camera.look[2]), A = new h.Vector3(d.camera.up[0], d.camera.up[1], d.camera.up[2]);
                  this.camera2.up.copy(A), this.camera2.lookAt(L), this.camera2.updateMatrixWorld(!0), this.controls2 && this.controls2.target.copy(L), console.log("[DualCanvasViewer] camera2 已同步到 xeokit 相机:", {
                    camera2Position: `(${this.camera2.position.x.toFixed(2)}, ${this.camera2.position.y.toFixed(2)}, ${this.camera2.position.z.toFixed(2)})`,
                    xeokitEye: `(${d.camera.eye[0].toFixed(2)}, ${d.camera.eye[1].toFixed(2)}, ${d.camera.eye[2].toFixed(2)})`
                  });
                }
                if (i) {
                  console.log("[DualCanvasViewer] 应用初始位置到 XKT 模型:", i);
                  const L = {
                    x: i.x,
                    y: i.y,
                    z: i.z
                  };
                  if (w.position !== void 0) {
                    let A = [
                      0,
                      0,
                      0
                    ];
                    D ? (A = [
                      (D[0] + D[3]) / 2,
                      (D[1] + D[4]) / 2,
                      (D[2] + D[5]) / 2
                    ], console.log("[DualCanvasViewer] 使用真实 AABB 中心:", {
                      modelCenter: A,
                      aabb: ` [${D[0].toFixed(2)}, ${D[1].toFixed(2)}, ${D[2].toFixed(2)}, ${D[3].toFixed(2)}, ${D[4].toFixed(2)}, ${D[5].toFixed(2)}] `
                    })) : A = [
                      (D[0] + D[3]) / 2,
                      (D[1] + D[4]) / 2,
                      (D[2] + D[5]) / 2
                    ];
                    let U;
                    v.userData.originallyHadLargeCoordinates && !n ? U = [
                      L.x,
                      L.y,
                      L.z
                    ] : v.userData.originallyHadLargeCoordinates && n ? (U = [
                      L.x - A[0],
                      L.y - A[1],
                      L.z - A[2]
                    ], console.log("[DualCanvasViewer] 重新加载大坐标模型：计算从大坐标到目标位置的偏移", {
                      modelCenter: A,
                      targetPosition: L,
                      positionOffset: U,
                      positionOffsetType: "平移偏移（从大坐标到小坐标）"
                    })) : U = [
                      L.x - A[0],
                      L.y - A[1],
                      L.z - A[2]
                    ], w.position = U, console.log("[DualCanvasViewer] xeokit 模型变换已设置（位置）:", {
                      initialPosition: i,
                      targetPositionXeokit: L,
                      modelCenter: A,
                      positionOffset: U,
                      newPosition: w.position
                    });
                  }
                  if (v.position.set(i.x, i.y, i.z), v.updateMatrixWorld(), v.userData.boundingBoxSize) {
                    const A = v.userData.boundingBoxSize, U = new h.Box3(new h.Vector3(i.x - A.x / 2, i.y - A.y / 2, i.z - A.z / 2), new h.Vector3(i.x + A.x / 2, i.y + A.y / 2, i.z + A.z / 2)), H = U.getCenter(new h.Vector3());
                    v.userData.boundingBox = U, v.userData.boundingBoxCenter = H, console.log("[DualCanvasViewer] Three.js 占位符包围盒已更新:", {
                      position: v.position,
                      boundingBoxCenter: H,
                      boundingBoxSize: A
                    });
                  }
                  if (v.userData.boundingBoxSize) {
                    const A = v.userData.boundingBoxSize, U = Math.max(A.x, A.y, A.z) * 2;
                    if (d.camera.eye = [
                      i.x + U,
                      i.y + U * 0.5,
                      i.z + U
                    ], d.camera.look = [
                      i.x,
                      i.y,
                      i.z
                    ], d.camera.up = [
                      0,
                      1,
                      0
                    ], this.camera2) {
                      this.camera2.position.set(d.camera.eye[0], d.camera.eye[1], d.camera.eye[2]);
                      const H = new h.Vector3(d.camera.look[0], d.camera.look[1], d.camera.look[2]);
                      this.camera2.lookAt(H), this.camera2.updateMatrixWorld(!0), this.controls2 && this.controls2.target.copy(H), console.log("[DualCanvasViewer] 相机已聚焦到初始位置:", {
                        eye: d.camera.eye,
                        look: d.camera.look
                      });
                    }
                  }
                }
                r(v);
              } else {
                try {
                  d.destroy();
                } catch {
                }
                u.remove(), a(/* @__PURE__ */ new Error("未找到模型数据"));
              }
            }), C.on("error", (M) => {
              x = !0, clearTimeout(f);
              try {
                d.destroy();
              } catch {
              }
              u.remove(), console.error("[DualCanvasViewer] XKT 模型加载失败:", M), this.showIFCTransferHint(t, M.message || "未知错误"), a(M);
            });
          }).catch((m) => {
            try {
              d.destroy();
            } catch {
            }
            u.remove(), console.error("[DualCanvasViewer] 读取 XKT 文件失败:", m), this.showIFCTransferHint(t, m.message || "读取文件失败"), a(m);
          });
        } catch (s) {
          console.error("[DualCanvasViewer] XKT 模型加载失败:", s), this.showIFCTransferHint(t, s.message), a(s);
        }
      });
    },
    async reloadXKTModelToPosition(e, t) {
      if (!e || !e.userData.isXKTModel)
        return console.error("[DualCanvasViewer] 无效的 XKT 模型"), null;
      console.log("[DualCanvasViewer] 开始重新加载 XKT 模型到目标位置:", {
        fileName: e.userData.filePath,
        targetPosition: t
      });
      const o = e.userData.fileName || e.userData.filePath, i = e.userData.originalFile;
      if (!i)
        return console.error("[DualCanvasViewer] 无法获取原始文件对象"), this.$message?.error("无法重新加载模型：缺少原始文件"), null;
      const n = URL.createObjectURL(i);
      console.log("[DualCanvasViewer] 创建新的 blob URL:", n);
      const r = e.userData.xeokitViewer, a = this.xeokitViewers.find((l) => l.viewer === r)?.canvas;
      console.log("[DualCanvasViewer] 找到的旧 canvas:", a?.id);
      const s = this.$refs.bimContainer;
      if (s) {
        const l = s.querySelectorAll('canvas[id^="tempXKTCanvas_"]');
        console.log("[DualCanvasViewer] 发现", l.length, "个tempXKTCanvas元素");
        const g = /* @__PURE__ */ new Set();
        this.xeokitViewers.forEach((u) => {
          u.canvas && u.canvas.parentNode && g.add(u.canvas);
        }), l.forEach((u) => {
          if (!g.has(u)) {
            console.log("[DualCanvasViewer] 清理失效的canvas:", u.id);
            try {
              u.parentNode.removeChild(u);
            } catch (d) {
              console.warn("[DualCanvasViewer] 移除失效canvas失败:", d.message);
            }
          }
        });
      }
      if (a && a.parentNode) try {
        a.parentNode.removeChild(a), console.log("[DualCanvasViewer] 已移除旧 canvas:", a.id);
      } catch (l) {
        console.warn("[DualCanvasViewer] 移除 canvas 失败:", l.message);
      }
      else console.warn("[DualCanvasViewer] 旧 canvas 无效或不在 DOM 中");
      if (r) try {
        console.log("[DualCanvasViewer] 销毁旧的 xeokit viewer"), r.destroy();
      } catch (l) {
        console.warn("[DualCanvasViewer] 销毁 viewer 失败:", l.message);
      }
      this.modelGroup2.children.includes(e) && (this.modelGroup2.remove(e), this.bimObjectCount--, console.log("[DualCanvasViewer] 已移除旧的 Three.js 占位符"));
      const c = this.xeokitViewers.length;
      this.xeokitViewers = this.xeokitViewers.filter((l) => l.fileName !== o), console.log("[DualCanvasViewer] 已从 xeokitViewers 移除旧记录，数量:", c, "->", this.xeokitViewers.length);
      try {
        console.log("[DualCanvasViewer] 重新加载 XKT 模型:", o);
        const l = await this.loadXKTModel(n, o, i, t, !0);
        if (l) {
          console.log("[DualCanvasViewer] XKT 模型重新加载成功:", {
            fileName: o,
            newPosition: l.position,
            boundingBoxCenter: l.userData.boundingBoxCenter
          }), this.selectedModel2 === e && (this.selectedModel2 = l);
          const g = this.loadedModelsList.find((u) => u.model === e);
          g && (g.model = l, g.boundingBox = l.userData.boundingBox, console.log("[DualCanvasViewer] 已更新 loadedModelsList 中的模型引用:", {
            fileName: o,
            newBoundingBoxCenter: l.userData.boundingBoxCenter
          })), this.$message?.success("XKT 模型已重新加载到目标位置");
        }
        return l;
      } catch (l) {
        return console.error("[DualCanvasViewer] 重新加载 XKT 模型失败:", l), this.$message?.error("重新加载模型失败: " + l.message), null;
      }
    },
    async loadIFCModel(e, t, o = null) {
      return console.log("[DualCanvasViewer] 开始加载 IFC 模型:", t), new Promise(async (i, n) => {
        try {
          if (!window.xeokitSDK) {
            n(/* @__PURE__ */ new Error("xeokit SDK 未加载。请将 IFC 文件转换为 GLB 格式后加载。")), this.showIFCTransferHint(t);
            return;
          }
          const r = this.$refs.bimContainer;
          if (!r) {
            n(/* @__PURE__ */ new Error("BIM 容器未找到"));
            return;
          }
          const a = document.createElement("canvas");
          a.id = "tempIFCCanvas_" + Date.now(), a.style.position = "absolute", a.style.top = "0", a.style.left = "0", a.style.pointerEvents = "auto", r.appendChild(a);
          const s = r.getBoundingClientRect();
          a.style.width = s.width + "px", a.style.height = s.height + "px", a.width = s.width, a.height = s.height;
          const c = document.createElement("div");
          c.style.position = "absolute", c.style.width = "1px", c.style.height = "1px", c.style.overflow = "hidden", c.style.zIndex = "-1", c.style.display = "none", document.body.appendChild(c);
          const l = new window.xeokitSDK.Viewer({
            canvasId: a.id,
            transparent: !0,
            logarithmicDepthBuffer: !0
          });
          await new Promise((d) => requestAnimationFrame(d));
          let g = !1;
          const u = setTimeout(() => {
            if (!g) {
              try {
                l.destroy();
              } catch {
              }
              c.remove(), n(/* @__PURE__ */ new Error("IFC 模型加载超时（60秒）。请尝试将文件转换为 GLB 格式。"));
            }
          }, 6e4);
          if (t.split(".").pop().toLowerCase() === "ifc") {
            console.log("[DualCanvasViewer] 开始加载 IFC 文件:", t);
            try {
              const d = await (await fetch(e)).arrayBuffer();
              console.log("[DualCanvasViewer] IFC 文件已读取，大小:", d.byteLength, "字节");
              const m = new window.WebIFC.IfcAPI();
              m.SetWasmPath("/jsm/libs/webifc/"), await m.Init(), console.log("[DualCanvasViewer] WebIFC 初始化成功");
              const p = new window.xeokitSDK.WebIFCLoaderPlugin(l, {
                WebIFC: window.WebIFC,
                IfcAPI: m,
                dataSource: { getIFC: (f, C, M) => {
                  console.log("[DualCanvasViewer] 使用 ArrayBuffer 加载 IFC 模型");
                  try {
                    C(d);
                  } catch (y) {
                    console.error("[DualCanvasViewer] getIFC 错误:", y), M(y);
                  }
                } }
              }).load({
                id: t.replace(".ifc", ""),
                src: t,
                loadMetadata: !0,
                excludeTypes: ["IfcSpace"],
                edges: !0
              });
              let x = !1;
              p.on("loaded", () => {
                if (x) return;
                x = !0, console.log("[DualCanvasViewer] IFC 模型加载成功:", t), g = !0, clearTimeout(u);
                const f = p, C = this.$refs.bimContainer;
                if (!C) {
                  console.error("[DualCanvasViewer] BIM 容器未找到"), n(/* @__PURE__ */ new Error("BIM 容器未找到"));
                  return;
                }
                a.style.zIndex = "2";
                const M = () => {
                  this.interactionLayer === "bim" ? (a.style.pointerEvents = "auto", a.style.zIndex = "10", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "none")) : (a.style.pointerEvents = "none", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "auto"));
                };
                M(), a._updatePointerEvents = M, l.glRenderer && (l.glRenderer.canvas = a, l.glRenderer.resize()), l.scene.canvas.canvas = a, l.scene.canvas.offsetLeft = 0, l.scene.canvas.offsetTop = 0, l.scene.canvas.clientWidth = s.width, l.scene.canvas.clientHeight = s.height, console.log("[DualCanvasViewer] xeokit canvas 尺寸已设置:", {
                  width: s.width,
                  height: s.height,
                  canvasSize: {
                    width: a.width,
                    height: a.height
                  }
                }), requestAnimationFrame(() => {
                  this.updatePointerEvents(), this.xeokitViewers || (this.xeokitViewers = []), this.xeokitViewers.push({
                    viewer: l,
                    canvas: a,
                    model: f,
                    container: c,
                    fileName: t,
                    fileUrl: e,
                    fileType: "ifc"
                  });
                  const y = new h.Group();
                  y.userData.filePath = t, y.userData.fileName = t, y.userData.fileUrl = e, y.userData.originalFile = o, y.userData.isXKTModel = !0, y.userData.renderedByXeokit = !0, y.userData.xeokitViewer = l, this.modelGroup2.add(y), this.bimObjectCount++;
                  const w = f.aabb;
                  if (w) {
                    const V = {
                      x: (w[0] + w[3]) / 2,
                      y: (w[1] + w[4]) / 2,
                      z: (w[2] + w[5]) / 2
                    }, S = {
                      x: w[3] - w[0],
                      y: w[4] - w[1],
                      z: w[5] - w[2]
                    }, T = Math.sqrt(V.x * V.x + V.y * V.y + V.z * V.z), v = T > 1e4;
                    if (console.log("[DualCanvasViewer] IFC 模型坐标分析:", {
                      xeokitCenter: V,
                      xeokitSize: S,
                      centerLength: T.toFixed(2),
                      hasLargeCoordinates: v
                    }), v) {
                      const O = {
                        x: V.x,
                        y: V.y,
                        z: V.z
                      };
                      if (y.userData.originalXeokitCenter = O, p.position !== void 0) {
                        const k = {
                          x: -V.x,
                          y: -V.y,
                          z: -V.z
                        };
                        p.position = [
                          k.x,
                          k.y,
                          k.z
                        ], y.userData.positionOffset = k, console.log("[DualCanvasViewer] 大坐标模型 - 已应用位置偏移到原点", {
                          originalCenter: O,
                          positionOffset: k,
                          newPosition: p.position
                        });
                      } else {
                        console.warn("[DualCanvasViewer] 警告：sceneModel.position 不可用，无法平移模型"), console.warn("[DualCanvasViewer] 使用相机跟随模式作为备选方案");
                        const k = Math.max(S.x, S.y, S.z) * 2;
                        l.camera.eye = [
                          V.x + k,
                          V.y + k * 0.5,
                          V.z + k
                        ], l.camera.look = [
                          V.x,
                          V.y,
                          V.z
                        ], l.camera.up = [
                          0,
                          1,
                          0
                        ];
                      }
                      const B = Math.max(S.x, S.y, S.z) * 2;
                      l.camera.eye = [
                        B,
                        S.y * 0.5,
                        B * 0.75
                      ], l.camera.look = [
                        0,
                        S.y * 0.5,
                        0
                      ], l.camera.up = [
                        0,
                        1,
                        0
                      ], console.log("[DualCanvasViewer] 大坐标模型（已平移）- 相机设置在原点附近", {
                        eye: l.camera.eye,
                        look: l.camera.look
                      }), new h.Vector3(0, S.y * 0.5, 0), new h.Vector3(S.x, S.y, S.z);
                    } else
                      l.camera.eye = [
                        w[3] + 10,
                        w[4] + 10,
                        w[5] + 10
                      ], l.camera.look = [
                        (w[0] + w[3]) / 2,
                        (w[1] + w[4]) / 2,
                        (w[2] + w[5]) / 2
                      ], l.camera.up = [
                        0,
                        1,
                        0
                      ], new h.Vector3(V.x, V.y, -V.z), new h.Vector3(S.x, S.y, S.z);
                    const D = {
                      get eye() {
                        return l.camera.eye;
                      },
                      set eye(O) {
                        l.camera.eye = O;
                      },
                      get look() {
                        return l.camera.look;
                      },
                      set look(O) {
                        l.camera.look = O;
                      },
                      get up() {
                        return l.camera.up;
                      },
                      set up(O) {
                        l.camera.up = O;
                      },
                      toThreeCamera: () => {
                        const O = new h.PerspectiveCamera();
                        O.position.set(l.camera.eye[0], l.camera.eye[1], l.camera.eye[2]);
                        const B = new h.Vector3(l.camera.look[0], l.camera.look[1], l.camera.look[2]), k = new h.Vector3(l.camera.up[0], l.camera.up[1], l.camera.up[2]);
                        return O.up.copy(k), O.lookAt(B), O;
                      }
                    }, _ = "xeokit_" + t;
                    this.viewportManager.registerLayer(_, {
                      camera: D,
                      scene: this.scene2,
                      container: C,
                      raycaster: null,
                      mouseVector: new h.Vector2(),
                      controls: null,
                      modelGroup: this.modelGroup2,
                      selectedModel: null,
                      transformControls: null,
                      isXeokitLayer: !0,
                      xeokitViewer: l,
                      xeokitCamera: D
                    }), console.log("[DualCanvasViewer] 已将 IFC xeokit viewer 注册到统一视口管理器:", _), y.userData.xeokitLayerId = _, console.log("[DualCanvasViewer] ===== IFC 坐标系调试信息 ====="), console.log("[DualCanvasViewer] IFC xeokit 原始 AABB (xeokit 坐标系):", { aabb: `[${w[0].toFixed(2)}, ${w[1].toFixed(2)}, ${w[2].toFixed(2)}, ${w[3].toFixed(2)}, ${w[4].toFixed(2)}, ${w[5].toFixed(2)}]` });
                    const b = (O, B, k) => ({
                      x: O,
                      y: B,
                      z: -k
                    }), E = {
                      x: w[0],
                      y: w[1],
                      z: w[2]
                    }, F = {
                      x: w[3],
                      y: w[4],
                      z: w[5]
                    }, P = b(E.x, E.y, E.z), R = b(F.x, F.y, F.z), L = new h.Vector3(Math.min(P.x, R.x), Math.min(P.y, R.y), Math.min(P.z, R.z)), A = new h.Vector3(Math.max(P.x, R.x), Math.max(P.y, R.y), Math.max(P.z, R.z));
                    console.log("[DualCanvasViewer] IFC 转换后 AABB (Three.js 坐标系):", {
                      boxMin: `(${L.x.toFixed(2)}, ${L.y.toFixed(2)}, ${L.z.toFixed(2)})`,
                      boxMax: `(${A.x.toFixed(2)}, ${A.y.toFixed(2)}, ${A.z.toFixed(2)})`
                    });
                    const U = new h.Box3(L, A), H = U.getCenter(new h.Vector3()), ee = U.getSize(new h.Vector3());
                    console.log("[DualCanvasViewer] IFC 模型包围盒信息 (Three.js 坐标系):", {
                      fileName: t,
                      layerId: _,
                      center: `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`,
                      size: `(${ee.x.toFixed(2)}, ${ee.y.toFixed(2)}, ${ee.z.toFixed(2)})`
                    }), y.userData.boundingBox = U, y.userData.boundingBoxCenter = H, y.userData.boundingBoxSize = ee, y.userData.hasLargeCoordinates = v, y.userData.originalCenter = H.clone(), console.log("[DualCanvasViewer] 已将 IFC 包围盒数据存储到 model.userData:", {
                      center: `(${H.x.toFixed(2)}, ${H.y.toFixed(2)}, ${H.z.toFixed(2)})`,
                      size: `(${ee.x.toFixed(2)}, ${ee.y.toFixed(2)}, ${ee.z.toFixed(2)})`,
                      hasLargeCoordinates: v,
                      originalCenter: "已设置 - IFC模型真实世界坐标中心"
                    });
                  }
                  c.remove(), this.initXeokitInteraction(), i(y);
                });
              }), p.on("error", (f) => {
                console.error("[DualCanvasViewer] IFC 模型加载失败:", f), g = !0, clearTimeout(u);
                try {
                  l.destroy();
                } catch {
                }
                c.remove(), this.showIFCTransferHint(t, f.message || "未知错误"), n(f);
              });
            } catch (d) {
              g = !0, clearTimeout(u);
              try {
                l.destroy();
              } catch {
              }
              c.remove(), console.error("[DualCanvasViewer] WebIFCLoaderPlugin 创建失败:", d), this.showIFCTransferHint(t, `IFC 加载器创建失败: ${d.message}

建议将 IFC 文件转换为 XKT 或 GLB 格式后加载。`), n(d);
            }
          } else
            console.log("[DualCanvasViewer] 开始加载 XKT 模型:", t), fetch(e).then((d) => {
              if (!d.ok) throw new Error("Failed to fetch file: " + d.statusText);
              return d.arrayBuffer();
            }).then((d) => {
              console.log("[DualCanvasViewer] XKT 文件已读取为 ArrayBuffer，大小:", d.byteLength);
              const m = new window.xeokitSDK.XKTLoaderPlugin(l, { dataSource: { getXKT: (p, x, f) => {
                console.log("[DualCanvasViewer] 使用 ArrayBuffer 加载 XKT 模型"), x(d);
              } } }).load({
                id: t,
                src: e,
                edges: !0
              });
              m.on("loaded", () => {
                g = !0, clearTimeout(u), console.log("[DualCanvasViewer] XKT 模型加载成功:", t);
                const p = l.scene.models, x = Object.keys(p);
                if (x.length > 0) {
                  const f = p[x[0]];
                  this.$refs.bimContainer, a.style.position = "absolute", a.style.top = "0", a.style.left = "0", a.style.width = "100%", a.style.height = "100%", a.style.pointerEvents = "auto", a.style.zIndex = "2";
                  const C = () => {
                    this.interactionLayer === "bim" ? (a.style.pointerEvents = "auto", a.style.zIndex = "10", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "none")) : (a.style.pointerEvents = "none", this.bimCanvas && (this.bimCanvas.style.pointerEvents = "auto"));
                  };
                  C(), a._updatePointerEvents = C, this.xeokitViewers || (this.xeokitViewers = []), this.xeokitViewers.push({
                    viewer: l,
                    canvas: a,
                    model: f,
                    container: c,
                    fileName: t,
                    fileUrl: e,
                    fileType: "ifc"
                  });
                  const M = new h.Group();
                  M.userData.filePath = t, M.userData.isXKTModel = !0, M.userData.renderedByXeokit = !0, M.userData.xeokitViewer = l, this.modelGroup2.add(M), this.bimObjectCount++;
                  const y = f.aabb;
                  y && (l.camera.eye = [
                    y[3] + 10,
                    y[4] + 10,
                    y[5] + 10
                  ], l.camera.look = [
                    (y[0] + y[3]) / 2,
                    (y[1] + y[4]) / 2,
                    (y[2] + y[5]) / 2
                  ], l.camera.up = [
                    0,
                    1,
                    0
                  ]), c.remove(), i(M);
                } else {
                  try {
                    l.destroy();
                  } catch {
                  }
                  c.remove(), n(/* @__PURE__ */ new Error("未找到模型数据"));
                }
              }), m.on("error", (p) => {
                g = !0, clearTimeout(u);
                try {
                  l.destroy();
                } catch {
                }
                c.remove(), console.error("[DualCanvasViewer] XKT 模型加载失败:", p), this.showIFCTransferHint(t, p.message || "未知错误"), n(p);
              });
            }).catch((d) => {
              g = !0, clearTimeout(u);
              try {
                l.destroy();
              } catch {
              }
              c.remove(), console.error("[DualCanvasViewer] 读取 XKT 文件失败:", d), this.showIFCTransferHint(t, d.message || "读取文件失败"), n(d);
            });
        } catch (r) {
          console.error("[DualCanvasViewer] IFC 模型加载失败:", r), this.showIFCTransferHint(t, r.message), n(r);
        }
      });
    },
    showIFCTransferHint(e, t) {
      const o = `
无法直接加载 XKT/IFC 文件: ${e}

${t || "未知错误"}

建议方案：
1. 使用 xeokit-metadata 工具将 IFC 转换为 GLB：
   npm install -g xeokit-metadata
   xeokit-metadata convert ${e} ${e}.glb

2. 或使用在线转换工具：https://xeokit.github.io/xeokit-metadata/
      `;
      alert(o), console.warn("[DualCanvasViewer]", o);
    },
    convertXKTToTHREE(e, t) {
      console.log("[DualCanvasViewer] 转换 xeokit 模型到 THREE.Object3D");
      const o = new h.Group();
      o.userData.filePath = t, o.userData.isXKTModel = !0, o.userData.xeokitModel = e;
      const i = e.aabb;
      if (i) {
        const n = new h.BoxGeometry(i[3] - i[0], i[4] - i[1], i[5] - i[2]), r = new h.MeshBasicMaterial({
          color: 65280,
          wireframe: !0,
          transparent: !0,
          opacity: 0.3
        }), a = new h.Mesh(n, r);
        a.position.set((i[0] + i[3]) / 2, (i[1] + i[4]) / 2, (i[2] + i[5]) / 2), o.add(a);
      }
      return console.log("[DualCanvasViewer] xeokit 模型转换完成:", t), o;
    },
    scaleModel(e, t) {
      if (!e) return;
      if (e.userData.isLargeCoordModel) {
        console.log("[DualCanvasViewer] 跳过已转换的大坐标模型的缩放处理:", e.userData.filePath || "unknown");
        return;
      }
      e.scale.set(1, 1, 1), e.position.set(0, 0, 0), e.rotation.set(0, 0, 0), e.updateMatrixWorld(!0);
      let o;
      const i = e.userData.fileName || e.userData.filePath || "unknown";
      if (e.userData.isXKTModel && e.userData.boundingBox ? (console.log("[DualCanvasViewer] 使用 XKT 模型的预存包围盒进行缩放:", i), o = e.userData.boundingBox.clone()) : o = new h.Box3().setFromObject(e), o.isEmpty()) {
        console.warn("[DualCanvasViewer] 无法计算模型边界框:", i);
        return;
      }
      const n = o.getSize(new h.Vector3()), r = o.getCenter(new h.Vector3()), a = Math.max(n.x, n.y, n.z);
      console.log(`[DualCanvasViewer] 单个模型缩放: ${i}, 尺寸=(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)}), 中心=(${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)})`);
      const s = t;
      if (a > 0 && isFinite(a)) {
        const g = s / a;
        e.scale.set(g, g, g), console.log(`[DualCanvasViewer] 缩放因子=${g.toFixed(3)}`);
      }
      e.updateMatrixWorld(!0);
      let c, l;
      if (e.userData.isXKTModel && e.userData.boundingBoxCenter && e.userData.boundingBox) {
        const g = e.scale.x;
        c = e.userData.boundingBoxCenter.clone().multiplyScalar(g), l = e.userData.boundingBox.min.clone().multiplyScalar(g), console.log("[DualCanvasViewer] 使用预存包围盒数据计算缩放后的位置");
      } else {
        const g = new h.Box3().setFromObject(e);
        c = g.getCenter(new h.Vector3()), l = g.min;
      }
      e.position.set(-c.x, -l.y, -c.z), e.updateMatrixWorld(!0), console.log(`[DualCanvasViewer] 模型位置已调整到: (${e.position.x.toFixed(2)}, ${e.position.y.toFixed(2)}, ${e.position.z.toFixed(2)})`);
    },
    setupModelAnimation(e, t, o) {
      if (!t || t.length === 0) return;
      const i = new h.AnimationMixer(e);
      o === 1 ? this.animationMixers1.push(i) : this.animationMixers2.push(i);
      const n = t[0], r = i.clipAction(n);
      r.play(), console.log(`[DualCanvasViewer] 动画已设置 (层 ${o}): 正在播放 "${n.name || "unnamed"}"`), e.userData.animationMixer = i, e.userData.currentAction = r, e.userData.animations = t;
    },
    arrangeModelsInGrid(e, t) {
      if (!e || e.length === 0) return;
      const o = 10, i = o * 1.2;
      console.log("[DualCanvasViewer] 开始排列模型，目标尺寸:", o, "网格间距:", i);
      const n = /* @__PURE__ */ new Map();
      e.forEach((u) => {
        n.set(u.uuid, u.position.clone());
      }), e.forEach((u) => {
        if (u.userData.isXKTModel) {
          console.log("[DualCanvasViewer] 跳过 XKT 模型的缩放和排列:", u.userData.fileName || u.userData.filePath);
          return;
        }
        if (u.userData.isLargeCoordModel) {
          console.log("[DualCanvasViewer] 跳过已转换的大坐标模型的缩放和排列:", u.userData.filePath || "unknown");
          return;
        }
        if (u.userData._movedNearLargeCoordModel) {
          console.log("[DualCanvasViewer] 跳过已移动到大坐标模型附近的小模型（避免闪烁）:", u.userData.filePath || "unknown");
          return;
        }
        u.scale.set(1, 1, 1);
        const d = u.position.clone();
        u.position.set(0, 0, 0);
        const m = new h.Box3().setFromObject(u);
        if (m.isEmpty()) {
          console.warn("[DualCanvasViewer] 无法计算模型边界框:", u.userData.filePath), u.position.copy(d);
          return;
        }
        const p = m.getSize(new h.Vector3()), x = Math.max(p.x, p.y, p.z);
        if (console.log(`[DualCanvasViewer] 模型 (${u.userData.filePath}): 边界框尺寸=(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}), 最大维度=${x.toFixed(2)}`), u.position.copy(d), x > 0 && isFinite(x)) {
          const f = o / x;
          u.scale.set(f, f, f);
        }
      }), t.updateMatrixWorld(!0);
      const r = e.length, a = Math.ceil(Math.sqrt(r)), s = Math.ceil(r / a);
      console.log("[DualCanvasViewer] 网格布局:", a, "列 x", s, "行");
      const c = !!this.referenceModelPosition, l = c ? this.referenceModelPosition.x : 0, g = c ? this.referenceModelPosition.z : 0;
      c && console.log("[DualCanvasViewer] 围绕参考位置进行网格排列:", this.referenceModelPosition), e.forEach((u, d) => {
        if (u.userData.isXKTModel) {
          console.log("[DualCanvasViewer] 跳过 XKT 模型的网格排列:", u.userData.fileName || u.userData.filePath);
          return;
        }
        if (u.userData.isLargeCoordModel) {
          console.log("[DualCanvasViewer] 跳过已转换的大坐标模型的网格排列:", u.userData.filePath || "unknown");
          return;
        }
        const m = d % a, p = Math.floor(d / a), x = (a - 1) * i, f = (s - 1) * i, C = m * i - x / 2, M = p * i - f / 2, y = new h.Box3().setFromObject(u), w = y.getCenter(new h.Vector3()), V = y.min.y, S = l + C - w.x, T = c ? this.referenceModelPosition.y : -V, v = g + M - w.z;
        u.position.set(S, T, v);
      }), t.updateMatrixWorld(!0), console.log("[DualCanvasViewer] 模型排列完成");
    },
    computeModelBoundingBox(e) {
      if (e.userData.isXKTModel && e.userData.boundingBox) {
        const t = e.userData.fileName || e.userData.filePath || "unknown", o = e.userData.boundingBox.clone();
        return console.log("[DualCanvasViewer] 使用 XKT 模型的预存包围盒:", {
          fileName: t,
          hasLargeCoordinates: e.userData.hasLargeCoordinates,
          boundingBoxCenter: e.userData.boundingBoxCenter,
          min: `(${o.min.x.toFixed(2)}, ${o.min.y.toFixed(2)}, ${o.min.z.toFixed(2)})`,
          max: `(${o.max.x.toFixed(2)}, ${o.max.y.toFixed(2)}, ${o.max.z.toFixed(2)})`
        }), o;
      }
      if (e.userData.isSkinnedModel) {
        let t = null;
        if (e.traverse((o) => {
          o.isSkinnedMesh && !t && (t = o);
        }), t) return this.computeSkinnedMeshBoundingBox(t);
      }
      return new h.Box3().setFromObject(e);
    },
    addModelToList(e, t, o) {
      const i = `${o}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, n = this.computeModelBoundingBox(e);
      this.loadedModelsList.push({
        id: i,
        name: t,
        layer: o,
        model: e,
        boundingBox: n
      }), console.log("[DualCanvasViewer] 模型已添加到列表:", {
        id: i,
        name: t,
        layer: o,
        modelsCount: this.loadedModelsList.length
      });
    },
    focusOnModels(e, t, o) {
      if (console.log("[DualCanvasViewer] focusOnModels 调用, modelGroup:", e === this.modelGroup1 ? "layer1" : "layer2", "children:", e?.children?.length), !e || e.children.length === 0) {
        console.log("[DualCanvasViewer] 没有模型可以聚焦");
        return;
      }
      const i = new h.Box3();
      let n = !1;
      if (e.children.forEach((u) => {
        if (u.userData.isXKTBoundingBox || u.isBox3Helper) return;
        const d = u.userData.fileName || u.userData.filePath || "unknown";
        console.log("[DualCanvasViewer] 处理模型:", d);
        const m = this.computeModelBoundingBox(u);
        console.log("[DualCanvasViewer] 模型边界框:", {
          fileName: d,
          min: `(${m.min.x.toFixed(2)}, ${m.min.y.toFixed(2)}, ${m.min.z.toFixed(2)})`,
          max: `(${m.max.x.toFixed(2)}, ${m.max.y.toFixed(2)}, ${m.max.z.toFixed(2)})`,
          isEmpty: m.isEmpty()
        }), m.isEmpty() || (i.union(m), n = !0);
      }), (!n || i.isEmpty()) && (console.log("[DualCanvasViewer] 边界框为空，使用标准方法"), i.setFromObject(e)), i.isEmpty()) {
        console.log("[DualCanvasViewer] 边界框仍为空");
        return;
      }
      const r = i.getCenter(new h.Vector3()), a = i.getSize(new h.Vector3()), s = Math.max(a.x, a.y, a.z);
      if (s === 0 || !isFinite(s)) {
        console.log("[DualCanvasViewer] 无效的尺寸");
        return;
      }
      const c = t.fov * (Math.PI / 180);
      let l = Math.abs(s / 2 / Math.tan(c / 2));
      l *= 2.5, this.syncDepth++;
      const g = o ? o.enabled : !1;
      try {
        o && (o.enabled = !1), t.position.set(r.x, r.y + l, r.z), t.lookAt(r.x, r.y, r.z), o.target.copy(r), t.updateMatrixWorld(), o && (o.minPolarAngle = 0, o.maxPolarAngle = Math.PI, o.update()), console.log("[DualCanvasViewer] 相机已聚焦到模型组，尺寸:", a, "中心:", r, "新相机位置:", t.position), r.length() > 1e3 && (console.log("[DualCanvasViewer] 检测到大坐标模型，调整相机 far 值"), this.adjustCameraFarForLargeCoords()), this.cameraSyncEnabled && !this.usingENU ? t === this.camera1 ? this.syncCameraFromThreeToBim() : t === this.camera2 && this.syncCameraFromBimToThree() : this.usingENU && console.log("[DualCanvasViewer] ENU 模式：跳过相机同步到 Cesium（避免坐标系统冲突）");
      } finally {
        if (o && (o.enabled = g), requestAnimationFrame(() => {
          this.syncDepth--;
        }), t === this.camera1 && this.syncManager) {
          const u = this.syncManager.mercatorProjection;
          if (u && u.isUsingLocalCoordinateSystem && u.isUsingLocalCoordinateSystem() && (console.log("[DualCanvasViewer] 局部坐标系模式：更新 unifiedCameraState"), this.syncManager.reinitUnifiedState && this.syncManager.reinitUnifiedState(), u.getVirtualFloorCenter && window.__enuCoordinateManager__)) {
            const d = u.getVirtualFloorCenter();
            window.__enuCoordinateManager__.alignOriginWithVirtualFloorCenter(d) ? console.log("[DualCanvasViewer] ✅ 虚拟地板中心与ENU切点已对齐") : console.warn("[DualCanvasViewer] ⚠️ 虚拟地板中心与ENU切点对齐失败");
          }
        }
      }
      if (console.log("[DualCanvasViewer] 🔍 检查初始方向同步条件:", {
        有syncManager: !!this.syncManager,
        camera是camera1: t === this.camera1,
        camera类型: t === this.camera1 ? "camera1" : t === this.camera2 ? "camera2" : "other"
      }), this.syncManager && t === this.camera1) {
        const u = window.__cesiumViewer__ || this.syncManager?.cesiumViewer, d = u && u.camera, m = e?.children?.some((p) => p.userData.originalLocation?.cartographic);
        console.log("[DualCanvasViewer] 🔍 初始方向同步条件检查:", {
          有Cesium: d,
          有大坐标模型: m,
          模型数量: e?.children?.length
        }), d && m ? (this.syncManager.mercatorProjection && (this.syncManager.mercatorProjection.setUseMeterLevelSync(!0), console.log("[DualCanvasViewer] ✅ 已启用米级同步模式（大坐标模型场景）")), u && u.camera && (this.syncManager.syncInitialDirectionFromCesium(u.camera), console.log("[DualCanvasViewer] ✅ 已从 Cesium 同步初始方向到 Dual 相机"))) : console.log("[DualCanvasViewer] ℹ️ 跳过 Cesium 同步:", {
          有Cesium: d,
          有大坐标模型: m,
          模式: d && m ? "大坐标+Cesium同步" : d ? "Cesium但无大坐标模型" : "纯Dual模式（无Cesium）"
        });
      }
    },
    getAlignmentStatus() {
      const e = this.syncManager?.mercatorProjection;
      if (!e?.isUsingLocalCoordinateSystem?.()) return {
        status: "N/A",
        message: "非局部坐标系模式"
      };
      const t = e?.getVirtualFloorCenter?.(), o = window.__enuCoordinateManager__?.getOriginInfo?.(), i = e?.isVirtualFloorCenterAlignedWithENU?.();
      return {
        status: i ? "aligned" : "misaligned",
        dual地板中心: "(0, 0, 0)",
        ENU切点: o ? `(${o.longitude.toFixed(6)}°, ${o.latitude.toFixed(6)}°)` : "N/A",
        虚拟地板中心: t ? `(${t.x.toFixed(2)}, ${t.y.toFixed(2)})` : "N/A",
        对齐状态: i ? "✅ 已对齐" : "⚠️ 未对齐"
      };
    },
    focusOnSingleModel(e) {
      console.log("[DualCanvasViewer] focusOnSingleModel 调用, modelId:", e);
      const t = this.loadedModelsList.find((M) => M.id === e);
      if (!t) {
        console.warn("[DualCanvasViewer] 未找到模型:", e);
        return;
      }
      const { model: o, layer: i, name: n } = t;
      let r = o;
      if (o && o.userData && o.userData.isXKTModel) {
        const M = o.userData.fileName || o.userData.filePath;
        if (r = this.modelGroup2.children.find((y) => y.userData.fileName === M), !r) {
          console.warn("[DualCanvasViewer] 未找到最新的 XKT 模型:", M);
          return;
        }
        console.log("[DualCanvasViewer] 使用最新的 XKT 模型引用:", M);
      }
      let a, s, c, l;
      if (i === "three")
        a = this.camera1, s = this.controls1, c = this.camera2, l = this.controls2;
      else if (i === "bim")
        a = this.camera2, s = this.controls2, c = this.camera1, l = this.controls1;
      else {
        console.warn("[DualCanvasViewer] 无效的图层:", i);
        return;
      }
      const g = this.computeModelBoundingBox(r);
      if (g.isEmpty()) {
        console.warn("[DualCanvasViewer] 模型边界框为空:", n);
        return;
      }
      let u = g.getCenter(new h.Vector3());
      const d = g.getSize(new h.Vector3()), m = Math.max(d.x, d.y, d.z);
      if (m === 0 || !isFinite(m)) {
        console.warn("[DualCanvasViewer] 无效的模型尺寸:", n);
        return;
      }
      if (console.log("[DualCanvasViewer] 当前坐标系统状态:", {
        isInRealWorldCoordinates: this.isInRealWorldCoordinates,
        modelName: n,
        modelPosition: r.position,
        boundingBoxCenter: u
      }), r.userData.isXKTModel && r.userData.originallyHadLargeCoordinates && !this.isInRealWorldCoordinates) {
        console.log("[DualCanvasViewer] 检测到大坐标XKT模型，需要变换到选中GLB底图位置");
        let M = null;
        if (this.activeLayer === "three" || this.activeLayer === "both" ? M = this.selectedModel1 : this.modelGroup1 && this.modelGroup1.children.length > 0 && (M = this.modelGroup1.children.find((E) => E.userData.hasLargeCoordinates && !E.userData.isXKTModel && E.userData.filePath?.toLowerCase().endsWith(".glb"))), !M || !M.userData.hasLargeCoordinates) {
          console.warn("[DualCanvasViewer] 未找到选中的大坐标GLB底图模型"), this.$message?.warning("无法定位XKT模型，请先选中底图GLB大坐标模型");
          return;
        }
        const y = M.userData.boundingBoxCenter;
        if (!y) {
          console.warn("[DualCanvasViewer] GLB底图模型缺少包围盒中心数据"), this.$message?.error("GLB底图模型数据不完整");
          return;
        }
        console.log("[DualCanvasViewer] 找到GLB底图模型，几何中心:", y);
        const w = r.userData.fileName || r.userData.filePath, V = this.xeokitViewers.find((E) => E.fileName === w), S = V ? V.viewer : r.userData.xeokitViewer;
        if (!S || !S.scene) {
          console.warn("[DualCanvasViewer] xeokit viewer无效");
          return;
        }
        const T = S.scene.models;
        if (!T) {
          console.warn("[DualCanvasViewer] xeokitViewer.scene.models为空");
          return;
        }
        const v = Object.keys(T);
        if (v.length === 0) {
          console.warn("[DualCanvasViewer] xeokit场景中没有模型");
          return;
        }
        const D = T[v[0]], _ = r.userData.originalWorldPosition || r.userData.originalCenter;
        if (!_) {
          console.warn("[DualCanvasViewer] XKT模型缺少原始中心点数据");
          return;
        }
        console.log("[DualCanvasViewer] 使用原始大坐标进行坐标变换:", {
          originalWorldPosition: r.userData.originalWorldPosition,
          originalCenter: _,
          glbCenter: y
        });
        const b = {
          x: y.x,
          y: y.y,
          z: y.z
        };
        if (console.log("[DualCanvasViewer] 坐标变换：原点 → GLB底图中心", {
          originalCenter: _,
          glbCenter: b,
          targetPosition: b
        }), D.position !== void 0) {
          let E;
          const F = D.aabb;
          if (F) {
            const R = [
              (F[0] + F[3]) / 2,
              (F[1] + F[4]) / 2,
              (F[2] + F[5]) / 2
            ];
            Math.sqrt(R[0] * R[0] + R[1] * R[1] + R[2] * R[2]) > 1e4 ? (E = [
              b.x - R[0],
              b.y - R[1],
              b.z - R[2]
            ], console.log("[DualCanvasViewer] 大坐标XKT模型：计算从大坐标到小坐标的平移偏移", {
              modelCenter: R,
              targetPosition: b,
              positionOffset: E,
              说明: "平移变换：从大坐标位置移动到小坐标位置，不涉及缩放"
            })) : E = [
              b.x,
              b.y,
              b.z
            ];
          } else E = [
            b.x,
            b.y,
            b.z
          ];
          D.position = E, r.position.set(b.x, b.y, b.z), r.rotation.set(0, 0, 0), r.scale.set(1, 1, 1), r.updateMatrixWorld();
          const P = r.userData.boundingBoxSize;
          if (P) {
            const R = new h.Box3(new h.Vector3(b.x - P.x / 2, b.y - P.y / 2, b.z - P.z / 2), new h.Vector3(b.x + P.x / 2, b.y + P.y / 2, b.z + P.z / 2));
            r.userData.boundingBox = R;
            const L = R.getCenter(new h.Vector3());
            r.userData.boundingBoxCenter = L;
          }
          u.set(b.x, b.y, b.z), console.log("[DualCanvasViewer] XKT模型已变换到GLB底图位置（包含完整变换）:", {
            position: `(${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)})`,
            rotation: "[0, 0, 0, 1] (单位四元数)",
            scale: "[1, 1, 1] (原始大小)",
            transformType: "平移+旋转重置+缩放重置"
          }), this.xktTransformInfo = {
            xktFileName: r.userData.fileName || r.userData.filePath,
            xktOriginalPosition: _.clone(),
            xktTransformedPosition: b,
            glbFileName: M.userData.fileName || M.userData.filePath,
            glbCenter: y.clone(),
            glbOriginalCenter: M.userData.originalWorldPosition || M.userData.originalCenter,
            timestamp: Date.now()
          }, console.log("[DualCanvasViewer] 已存储变换信息:", this.xktTransformInfo);
        } else console.warn("[DualCanvasViewer] xeokitModel.position不可用，无法移动模型");
      }
      const p = a.fov * (Math.PI / 180);
      let x = Math.abs(m / 2 / Math.tan(p / 2));
      x *= 2, this.syncDepth += 2;
      const f = s ? s.enabled : !1, C = l ? l.enabled : !1;
      try {
        s && (s.enabled = !1), l && (l.enabled = !1), a.position.set(u.x + x * 0.7, u.y + x * 0.5, u.z + x), s.target.copy(u), a.updateMatrixWorld();
        const M = a.position.distanceTo(u);
        if (M > 1e4 || Math.abs(u.x) > 1e4 || Math.abs(u.y) > 1e4 || Math.abs(u.z) > 1e4) {
          const w = Math.max(10, M / 1e3), V = M * 100;
          a.near = w, a.far = V, a.updateProjectionMatrix(), console.log("[DualCanvasViewer] 大坐标场景 - 优化near/far值:", {
            distToModel: M.toFixed(2),
            near: w.toFixed(2),
            far: V.toFixed(2),
            ratio: (V / w).toFixed(2)
          }), c && (c.near = w, c.far = V, c.updateProjectionMatrix()), this.xeokitViewers && this.xeokitViewers.length > 0 && this.xeokitViewers.forEach((S) => {
            const T = S.viewer;
            T && T.camera && T.camera.project && (T.camera.project.near = w, T.camera.project.far = V, console.log("[DualCanvasViewer] xeokit near/far已调整:", {
              near: w.toFixed(2),
              far: V.toFixed(2)
            }));
          });
        }
        this.cameraSyncEnabled && c && l && (c.position.copy(a.position), c.rotation.copy(a.rotation), l.target.copy(s.target), c.updateMatrixWorld(), this.xeokitViewers && this.xeokitViewers.length > 0 && this.syncCameraToXeokitInternal());
        const y = r.userData.isXKTModel;
        if (y && r.userData.originallyHadLargeCoordinates && !this.isInRealWorldCoordinates) {
          console.log("[DualCanvasViewer] 检测到大坐标XKT模型，需要变换到选中GLB底图位置");
          let w = null;
          if (this.activeLayer === "three" || this.activeLayer === "both" ? w = this.selectedModel1 : this.modelGroup1 && this.modelGroup1.children.length > 0 && (w = this.modelGroup1.children.find((P) => P.userData.hasLargeCoordinates && !P.userData.isXKTModel && P.userData.filePath?.toLowerCase().endsWith(".glb"))), !w || !w.userData.hasLargeCoordinates) {
            console.warn("[DualCanvasViewer] 未找到选中的大坐标GLB底图模型"), this.$message?.warning("无法定位XKT模型，请先选中底图GLB大坐标模型");
            return;
          }
          const V = w.userData.boundingBoxCenter;
          if (!V) {
            console.warn("[DualCanvasViewer] GLB底图模型缺少包围盒中心数据"), this.$message?.error("GLB底图模型数据不完整");
            return;
          }
          console.log("[DualCanvasViewer] 找到GLB底图模型，几何中心:", V);
          const S = r.userData.fileName || r.userData.filePath, T = this.xeokitViewers.find((P) => P.fileName === S), v = T ? T.viewer : r.userData.xeokitViewer;
          if (!v || !v.scene) {
            console.warn("[DualCanvasViewer] xeokit viewer无效");
            return;
          }
          const D = v.scene.models;
          if (!D) {
            console.warn("[DualCanvasViewer] xeokitViewer.scene.models为空");
            return;
          }
          const _ = Object.keys(D);
          if (_.length === 0) {
            console.warn("[DualCanvasViewer] xeokit场景中没有模型");
            return;
          }
          const b = D[_[0]], E = r.userData.originalCenter;
          if (!E) {
            console.warn("[DualCanvasViewer] XKT模型缺少原始中心点数据");
            return;
          }
          const F = {
            x: V.x,
            y: V.y,
            z: V.z
          };
          if (console.log("[DualCanvasViewer] 坐标变换：原点 → GLB底图中心", {
            originalCenter: E,
            glbCenter: F,
            targetPosition: F
          }), b.position !== void 0) {
            let P;
            const R = b.aabb;
            if (R) {
              const A = [
                (R[0] + R[3]) / 2,
                (R[1] + R[4]) / 2,
                (R[2] + R[5]) / 2
              ];
              Math.sqrt(A[0] * A[0] + A[1] * A[1] + A[2] * A[2]) > 1e4 ? (P = [
                F.x - A[0],
                F.y - A[1],
                F.z - A[2]
              ], console.log("[DualCanvasViewer] 大坐标XKT模型：计算从大坐标到小坐标的平移偏移", {
                modelCenter: A,
                targetPosition: F,
                positionOffset: P,
                说明: "平移变换：从大坐标位置移动到小坐标位置，不涉及缩放"
              })) : P = [
                F.x,
                F.y,
                F.z
              ];
            } else P = [
              F.x,
              F.y,
              F.z
            ];
            b.position = P, r.position.set(F.x, F.y, F.z), r.rotation.set(0, 0, 0), r.scale.set(1, 1, 1), r.updateMatrixWorld();
            const L = r.userData.boundingBoxSize;
            if (L) {
              const A = new h.Box3(new h.Vector3(F.x - L.x / 2, F.y - L.y / 2, F.z - L.z / 2), new h.Vector3(F.x + L.x / 2, F.y + L.y / 2, F.z + L.z / 2));
              r.userData.boundingBox = A;
              const U = A.getCenter(new h.Vector3());
              r.userData.boundingBoxCenter = U;
            }
            u.set(F.x, F.y, F.z), console.log("[DualCanvasViewer] XKT模型已变换到GLB底图位置（包含完整变换）:", {
              position: `(${F.x.toFixed(2)}, ${F.y.toFixed(2)}, ${F.z.toFixed(2)})`,
              rotation: "[0, 0, 0, 1] (单位四元数)",
              scale: "[1, 1, 1] (原始大小)",
              transformType: "平移+旋转重置+缩放重置"
            });
          } else console.warn("[DualCanvasViewer] xeokitModel.position不可用，无法移动模型");
        } else y && r.userData.originallyHadLargeCoordinates && this.isInRealWorldCoordinates && (console.log("[DualCanvasViewer] 真实世界坐标系统下的XKT模型定位，直接使用当前位置"), console.log("[DualCanvasViewer] 真实世界坐标系统 - XKT模型定位完成:", {
          name: n,
          position: `(${u.x.toFixed(2)}, ${u.y.toFixed(2)}, ${u.z.toFixed(2)})`,
          isXKTModel: !0
        }));
        console.log("[DualCanvasViewer] 相机已聚焦到模型:", {
          name: n,
          isXKTModel: y,
          center: `(${u.x.toFixed(2)}, ${u.y.toFixed(2)}, ${u.z.toFixed(2)})`,
          size: `(${d.x.toFixed(2)}, ${d.y.toFixed(2)}, ${d.z.toFixed(2)})`,
          cameraPos: `(${a.position.x.toFixed(2)}, ${a.position.y.toFixed(2)}, ${a.position.z.toFixed(2)})`
        });
      } finally {
        s && (s.enabled = f), l && (l.enabled = C), requestAnimationFrame(() => {
          this.syncDepth -= 2;
        }), this.syncManager && this.syncManager.syncThreeToCesium && (console.log("[DualCanvasViewer] focusOnSingleModel: 同步相机到 Cesium..."), requestAnimationFrame(() => {
          const M = this.camera1, y = this.controls1 ? this.controls1.target : new h.Vector3();
          this.syncManager.syncThreeToCesium(M.position.clone(), y.clone()), this.syncManager.cesiumViewer && this.syncManager.cesiumViewer.scene && (this.syncManager.cesiumViewer.scene.requestRender(), console.log("[DualCanvasViewer] focusOnSingleModel: Cesium 渲染已刷新"));
        }));
      }
    },
    async loadDefaultModels() {
      console.log("[DualCanvasViewer] 正在加载默认模型...");
    },
    setTransformMode(e) {
      this.transformMode = e, this.activeLayer === "three" ? this.transformControls1 && this.transformControls1.setMode(e) : this.activeLayer === "bim" ? this.transformControls2 && this.transformControls2.setMode(e) : this.activeLayer === "both" && (this.transformControls1 && this.transformControls1.setMode(e), this.transformControls2 && this.transformControls2.setMode(e)), console.log("[DualCanvasViewer] 变换模式已设置为:", e, "当前层:", this.activeLayer);
    },
    setupKeyboardShortcuts() {
      this.handleKeydown = (e) => {
        if (e.target.tagName !== "INPUT")
          switch (e.key.toLowerCase()) {
            case "w":
              this.setTransformMode("translate");
              break;
            case "e":
              this.setTransformMode("rotate");
              break;
            case "r":
              this.setTransformMode("scale");
              break;
            case "escape":
              (this.activeLayer === "three" || this.activeLayer === "both") && this.deselectModel1(), (this.activeLayer === "bim" || this.activeLayer === "both") && this.deselectModel2();
              break;
          }
      }, window.addEventListener("keydown", this.handleKeydown), console.log("[DualCanvasViewer] 键盘快捷键已设置: W=移动, E=旋转, R=缩放, ESC=取消选择");
    },
    removeKeyboardShortcuts() {
      this.handleKeydown && (window.removeEventListener("keydown", this.handleKeydown), this.handleKeydown = null);
    },
    showErrorMessage(e) {
      console.error("[DualCanvasViewer]", e), alert(e);
    },
    cleanup() {
      console.log("[DualCanvasViewer] 正在清理..."), this.containerElement1 && this.scene1 && !this.usesRendererManager1 && this.animationFrame1 && cancelAnimationFrame(this.animationFrame1), this.containerElement1 && this.scene1 && this.usesRendererManager1 && fe.removeScene(this.scene1), this.animationMixers1 && (this.animationMixers1.forEach((e) => {
        e.stopAllAction(), e = null;
      }), this.animationMixers1 = []), this.transformControls1 && (this.transformControls1.detach(), typeof this.transformControls1.getHelper == "function" ? this.scene1?.remove(this.transformControls1.getHelper()) : this.scene1?.remove(this.transformControls1), this.transformControls1.dispose(), this.transformControls1 = null), this.$refs.threeContainer && (this.$refs.threeContainer.removeEventListener("pointerdown", this.onPointerDown1), this.$refs.threeContainer.removeEventListener("click", this.onClick1)), this.modelGroup1 && this.modelGroup1.traverse((e) => {
        e.isMesh && (e.geometry?.dispose(), Array.isArray(e.material) ? e.material.forEach((t) => t.dispose()) : e.material?.dispose());
      }), this.controls1 && this.controls1.dispose(), this.dracoLoader1 && this.dracoLoader1.dispose(), this.renderer1 && this.renderer1.dispose(), this.animationFrame2 && cancelAnimationFrame(this.animationFrame2), this.animationMixers2 && (this.animationMixers2.forEach((e) => {
        e.stopAllAction(), e = null;
      }), this.animationMixers2 = []), this.transformControls2 && (this.transformControls2.detach(), typeof this.transformControls2.getHelper == "function" ? this.scene2?.remove(this.transformControls2.getHelper()) : this.scene2?.remove(this.transformControls2), this.transformControls2.dispose(), this.transformControls2 = null), this.$refs.bimContainer && (this.$refs.bimContainer.removeEventListener("pointerdown", this.onPointerDown2), this.$refs.bimContainer.removeEventListener("click", this.onClick2)), this.modelGroup2 && this.modelGroup2.traverse((e) => {
        e.isMesh && (e.geometry?.dispose(), Array.isArray(e.material) ? e.material.forEach((t) => t.dispose()) : e.material?.dispose());
      }), this.controls2 && this.controls2.dispose(), this.dracoLoader2 && this.dracoLoader2.dispose(), this.renderer2 && this.renderer2.dispose(), this.syncTimeout && clearTimeout(this.syncTimeout), this.xktBoundingBoxHelpers && (this.xktBoundingBoxHelpers.forEach((e) => {
        if (e.helper) {
          if (e.addedTo === "xeokitScene") try {
            e.helper.destroy ? e.helper.destroy() : e.helper.scene && e.helper.scene.remove(e.helper);
          } catch (t) {
            console.error("[DualCanvasViewer] 清理 xeokit 包围盒失败:", t);
          }
          else e.addedTo === "modelGroup2" && this.modelGroup2 ? this.modelGroup2.remove(e.helper) : e.addedTo === "scene2" && this.scene2 ? this.scene2.remove(e.helper) : e.model && e.model.remove(e.helper);
          e.box && (e.box = null);
        }
        e.xeokitLayerId && this.viewportManager && (this.viewportManager.unregisterLayer(e.xeokitLayerId), console.log("[DualCanvasViewer] 已从统一视口管理器注销 xeokit 层:", e.xeokitLayerId));
      }), this.xktBoundingBoxHelpers.splice(0, this.xktBoundingBoxHelpers.length)), this.xeokitViewers && this.xeokitViewers.length > 0 && (this.xeokitViewers.forEach((e) => {
        try {
          e.viewer && e.viewer.destroy(), e.canvas && e.canvas.parentNode && e.canvas.parentNode.removeChild(e.canvas);
        } catch (t) {
          console.error("[DualCanvasViewer] 清理 xeokit viewer 失败:", t);
        }
      }), this.xeokitViewers.splice(0, this.xeokitViewers.length)), console.log("[DualCanvasViewer] 清理完成");
    },
    handleUpdateBimOpacity(e) {
      this.bimOpacity = Number(e), this.updateBimOpacity();
    },
    handleToggleCameraSync(e) {
      this.cameraSyncEnabled = e;
    },
    isLargeCoordinateModel(e) {
      if (!e || !e.position)
        return console.log("[DualCanvasViewer] isLargeCoordinateModel: 模型不存在或没有位置信息"), !1;
      if (console.log("[DualCanvasViewer] isLargeCoordinateModel 检查模型:", e.userData.filePath), console.log("[DualCanvasViewer] 模型位置:", e.position), console.log("[DualCanvasViewer] originalCenter:", e.userData.originalCenter), console.log("[DualCanvasViewer] hasLargeCoordinates:", e.userData.hasLargeCoordinates), console.log("[DualCanvasViewer] hasLargeSize:", e.userData.hasLargeSize), console.log("[DualCanvasViewer] isXKTModel:", e.userData.isXKTModel), e.userData.isXKTModel) return e.userData.hasLargeCoordinates ? (console.log("[DualCanvasViewer] 检测到大坐标XKT模型，返回 true"), !0) : (console.log("[DualCanvasViewer] 检测到正常坐标XKT模型，返回 false"), !1);
      if (e.userData.hasLargeCoordinates || e.userData.hasLargeSize)
        return console.log("[DualCanvasViewer] 检测到大坐标/大尺寸标志，返回 true"), !0;
      if (e.userData.originalCenter && e.userData.isLargeCoordModel)
        return console.log("[DualCanvasViewer] 检测到已转换的大坐标模型，返回 true"), !0;
      if (e.userData.originalCenter)
        return Math.abs(e.userData.originalCenter.x) > 1e4 || Math.abs(e.userData.originalCenter.z) > 1e4 ? (console.log("[DualCanvasViewer] 检测到原始坐标较大（水平坐标超过10公里），视为大坐标地理模型，返回 true"), console.log("[DualCanvasViewer] 原始坐标:", {
          x: e.userData.originalCenter.x.toFixed(2),
          y: e.userData.originalCenter.y.toFixed(2) + " (高度，忽略)",
          z: e.userData.originalCenter.z.toFixed(2),
          threshold: 1e4
        }), !0) : (console.log("[DualCanvasViewer] 原始坐标在正常范围内（水平坐标小于10公里），视为普通建筑模型，返回 false"), !1);
      const t = e.userData.filePath || e.userData.fileName || "";
      if ([
        "ECEF",
        "L16_",
        "Mercator",
        "Geodetic",
        "EPSG"
      ].some((n) => t.toUpperCase().includes(n.toUpperCase())))
        return console.log("[DualCanvasViewer] 检测到文件名包含大坐标关键词，视为大坐标模型:", t), !0;
      const o = 1e3, i = Math.abs(e.position.x) > o || Math.abs(e.position.y) > o || Math.abs(e.position.z) > o;
      return console.log("[DualCanvasViewer] 坐标检查结果:", i), i;
    },
    updateLargeCoordModelSelectedState() {
      console.log("[DualCanvasViewer] updateLargeCoordModelSelectedState - 开始检查"), console.log("[DualCanvasViewer] 当前活动图层:", this.activeLayer), console.log("[DualCanvasViewer] selectedModel1:", this.selectedModel1 ? this.selectedModel1.userData.filePath : "null"), console.log("[DualCanvasViewer] selectedModel2:", this.selectedModel2 ? this.selectedModel2.userData.filePath : "null");
      let e = null;
      this.activeLayer === "three" || this.activeLayer === "both" ? e = this.selectedModel1 : this.activeLayer === "bim" && (e = this.selectedModel2), this.activeLayer === "both" && (this.selectedModel2 ? e = this.selectedModel2 : this.selectedModel1 && (e = this.selectedModel1)), console.log("[DualCanvasViewer] 最终选中的模型:", e ? e.userData.filePath : "null"), e && (console.log("[DualCanvasViewer] 选中模型位置:", e.position), console.log("[DualCanvasViewer] 选中模型 originalCenter:", e.userData.originalCenter), console.log("[DualCanvasViewer] isLargeCoordinateModel 结果:", this.isLargeCoordinateModel(e)));
      const t = this.hasLargeCoordModelSelected;
      this.hasLargeCoordModelSelected = e && this.isLargeCoordinateModel(e), console.log("[DualCanvasViewer] 大坐标模型选中状态更新:", this.hasLargeCoordModelSelected), typeof window < "u" && window.__syncManager__ && window.__syncManager__.mercatorProjection && window.__syncManager__.mercatorProjection.isUsingLocalCoordinateSystem && window.__syncManager__.mercatorProjection.isUsingLocalCoordinateSystem() && t !== this.hasLargeCoordModelSelected && (console.log("[DualCanvasViewer] 局部坐标模式：模型选择状态变化，重新初始化 unifiedCameraState"), window.__syncManager__ && typeof window.__syncManager__.reinitUnifiedState == "function" && window.__syncManager__.reinitUnifiedState()), this.applyControlsRestrictions();
    },
    applyControlsRestrictions() {
      const e = this.modelGroup1 ? this.modelGroup1.children.length : 0, t = this.usingENU || !1, o = !1, i = this.isInRealWorldCoordinates && !t;
      console.log("[DualCanvasViewer] 应用控制器限制:", {
        hasLargeCoordModelSelected: this.hasLargeCoordModelSelected,
        totalModelCount: e,
        usingENU: t,
        isInRealWorldMode: o,
        isInRealWorldCoordinates: i,
        说明: t ? "ENU模式：允许翻转（类似小模型模式）" : "常规模式"
      }), this.controls1 && at.applyRestrictions(this.controls1, this.hasLargeCoordModelSelected, o, e, {
        isInRealWorldCoordinates: i,
        verbose: !0
      }), this.controls2 && at.applyRestrictions(this.controls2, this.hasLargeCoordModelSelected, o, e, {
        isInRealWorldCoordinates: i,
        verbose: !0
      });
    },
    async convertLargeCoordModel() {
      console.log("[DualCanvasViewer] 开始转换大坐标模型到真实世界坐标系统");
      let e = null, t = null;
      if (this.activeLayer === "three" || this.activeLayer === "both" ? this.selectedModel2 ? (e = this.selectedModel2, t = this.getLayerConfig("bim")) : this.selectedModel1 && (e = this.selectedModel1, t = this.getLayerConfig("three")) : this.activeLayer === "bim" ? (e = this.selectedModel2, t = this.getLayerConfig("bim")) : (e = this.selectedModel1, t = this.getLayerConfig("three")), !e || !this.isLargeCoordinateModel(e)) {
        console.warn("[DualCanvasViewer] 没有选中有效的大坐标模型"), this.$message?.warning("请先选中一个大坐标模型");
        return;
      }
      if (console.log("[DualCanvasViewer] 选中的大坐标模型:", e.userData.filePath), console.log("[DualCanvasViewer] 当前位置:", e.position), console.log("[DualCanvasViewer] originalCenter:", e.userData.originalCenter), console.log("[DualCanvasViewer] isLargeCoordModel:", e.userData.isLargeCoordModel), console.log("[DualCanvasViewer] isXKTModel:", e.userData.isXKTModel), e.userData.isXKTModel && e.userData.xeokitViewer) {
        if (console.log("[DualCanvasViewer] 检测到XKT模型"), this.xktTransformInfo) {
          const c = e.userData.fileName || e.userData.filePath;
          if (console.log("[DualCanvasViewer] 检测到存储的变换信息，尝试直接应用变换"), this.xktTransformInfo.xktFileName === c) {
            console.log("[DualCanvasViewer] 变换信息匹配，使用直接变换方式:", this.xktTransformInfo);
            try {
              const l = {
                x: this.xktTransformInfo.glbOriginalCenter.x,
                y: this.xktTransformInfo.glbOriginalCenter.y,
                z: this.xktTransformInfo.glbOriginalCenter.z
              };
              console.log("[DualCanvasViewer] 计算真实世界目标位置:", {
                glbSmallCenter: this.xktTransformInfo.glbCenter,
                glbOriginalCenter: this.xktTransformInfo.glbOriginalCenter,
                targetPositionRealWorld: l
              });
              const g = e.userData.xeokitViewer, u = g.scene.models, d = Object.keys(u);
              if (d.length > 0) {
                const m = u[d[0]];
                m.position = [
                  l.x,
                  l.y,
                  l.z
                ], e.position.set(l.x, l.y, l.z), e.updateMatrixWorld();
                const p = e.userData.boundingBoxSize;
                if (p) {
                  const f = new h.Box3(new h.Vector3(l.x - p.x / 2, l.y - p.y / 2, l.z - p.z / 2), new h.Vector3(l.x + p.x / 2, l.y + p.y / 2, l.z + p.z / 2));
                  e.userData.boundingBox = f;
                  const C = f.getCenter(new h.Vector3());
                  e.userData.boundingBoxCenter = C;
                }
                const x = e.userData.boundingBoxSize;
                if (x) {
                  const f = Math.max(x.x, x.y, x.z) * 2.5;
                  g.camera.eye = [
                    l.x + f * 0.7,
                    l.y + f * 0.5,
                    l.z + f
                  ], g.camera.look = [
                    l.x,
                    l.y,
                    l.z
                  ], g.camera.up = [
                    0,
                    1,
                    0
                  ];
                }
                if (this.referenceModelPosition = new h.Vector3(l.x, l.y, l.z), this.largeCoordModelCenter = this.referenceModelPosition.clone(), e.userData.isLargeCoordModel = !0, console.log("[DualCanvasViewer] XKT模型已直接变换到真实世界坐标位置:", { position: `(${l.x.toFixed(2)}, ${l.y.toFixed(2)}, ${l.z.toFixed(2)})` }), x) {
                  const f = Math.max(x.x, x.y, x.z), C = Math.max(1e3, f * 10);
                  this.camera1 && (this.camera1.far = C, this.camera1.updateProjectionMatrix()), this.camera2 && (this.camera2.far = C, this.camera2.updateProjectionMatrix());
                }
                this.updateLargeCoordModelSelectedState(), this.activeLayer === "both" && (this.interactionLayer = "bim", this.updatePointerEvents()), await this.moveExistingModelsToReference(), console.log("[DualCanvasViewer] XKT模型直接变换完成（使用存储的变换信息）"), this.$message?.success("XKT模型已转换到真实世界坐标（使用变换信息）"), this.xktTransformInfo = null;
                return;
              }
            } catch (l) {
              console.warn("[DualCanvasViewer] 直接变换失败，将使用销毁重加载方式:", l);
            }
          } else console.log("[DualCanvasViewer] 变换信息不匹配，将使用销毁重加载方式");
        } else console.log("[DualCanvasViewer] 无存储的变换信息，使用销毁重加载方式");
        console.log("[DualCanvasViewer] 使用销毁重加载逻辑");
        const s = e.userData.originalWorldPosition || e.userData.boundingBoxCenter;
        if (!s) {
          console.error("[DualCanvasViewer] XKT模型缺少 originalWorldPosition 数据"), this.$message?.error("XKT模型缺少原始世界坐标数据");
          return;
        }
        console.log("[DualCanvasViewer] XKT模型原始大坐标（米）:", s), this.referenceModelPosition = s.clone(), this.largeCoordModelCenter = s.clone(), e.userData.originalCenter = s.clone(), e.userData.isLargeCoordModel = !0, console.log("[DualCanvasViewer] 设置参考位置（XKT模型真实世界坐标）:", this.referenceModelPosition), console.log("[DualCanvasViewer] 开始重新加载 XKT 模型到真实世界坐标位置");
        try {
          const c = await this.reloadXKTModelToPosition(e, s);
          if (!c) {
            console.error("[DualCanvasViewer] 重新加载 XKT 模型失败"), this.$message?.error("重新加载模型失败");
            return;
          }
          console.log("[DualCanvasViewer] XKT 模型已重新加载到真实世界坐标位置");
          const l = c.userData.boundingBoxSize;
          if (l) {
            const g = Math.max(l.x, l.y, l.z), u = Math.max(1e3, g * 10);
            this.camera1 && (this.camera1.far = u, this.camera1.updateProjectionMatrix(), console.log("[DualCanvasViewer] Three.js相机1 far已调整为:", u)), this.camera2 && (this.camera2.far = u, this.camera2.updateProjectionMatrix(), console.log("[DualCanvasViewer] Three.js相机2 far已调整为:", u));
          }
          this.updateLargeCoordModelSelectedState(), this.activeLayer === "both" && (this.interactionLayer = "bim", this.updatePointerEvents(), console.log("[DualCanvasViewer] XKT模型转换后，设置交互层为 bim")), console.log("[DualCanvasViewer] 移动其他已有模型到XKT参考位置附近"), await this.moveExistingModelsToReference(), console.log("[DualCanvasViewer] XKT模型转换完成"), this.$message?.success("XKT模型已转换到真实世界坐标并重新加载，所有模型已定位");
          return;
        } catch (c) {
          console.error("[DualCanvasViewer] XKT模型重新加载失败:", c), this.$message?.error("XKT模型重新加载失败: " + c.message);
          return;
        }
      }
      if (e.userData.isLargeCoordModel) {
        console.log("[DualCanvasViewer] 该模型已经转换过，originalCenter:", e.userData.originalCenter), console.log("[DualCanvasViewer] 当前参考位置:", this.referenceModelPosition), this.referenceModelPosition ? console.log("[DualCanvasViewer] 已有参考位置:", this.referenceModelPosition) : (this.referenceModelPosition = e.userData.originalCenter.clone(), this.largeCoordModelCenter = e.userData.originalCenter.clone(), console.log("[DualCanvasViewer] 设置参考位置:", this.referenceModelPosition)), console.log("[DualCanvasViewer] 移动已有模型到参考位置附近"), await this.moveExistingModelsToReference(), this.adjustCameraForAllModels(), this.$message?.success("已将模型移动到参考位置附近");
        return;
      }
      const o = e.userData.originalCenter;
      if (!o) {
        console.error("[DualCanvasViewer] 错误：模型没有 originalCenter，无法转换"), this.$message?.error("无法转换模型：缺少原始中心点信息");
        return;
      }
      console.log("[DualCanvasViewer] 使用检测时保存的中心点（真实世界坐标）:", o), console.log("[DualCanvasViewer] 模型当前位置:", e.position), e.userData.isLargeCoordModel = !0, this.referenceModelPosition = o.clone(), this.largeCoordModelCenter = o.clone(), console.log("[DualCanvasViewer] 设置参考位置（真实世界坐标）:", this.referenceModelPosition), console.log("[DualCanvasViewer] 将大坐标模型移动到真实世界位置并还原变换");
      const i = e.position.clone(), n = e.scale.clone();
      e.rotation.clone(), e.scale.set(1, 1, 1), e.rotation.set(0, 0, 0), e.updateMatrixWorld();
      const r = new h.Box3().setFromObject(e).getCenter(new h.Vector3());
      console.log("[DualCanvasViewer] 调试信息:", {
        originalPosition: i,
        originalScale: n,
        currentBoxCenter: r,
        originalCenter: o
      }), e.position.set(0, 0, 0), e.updateMatrixWorld();
      const a = new h.Box3().setFromObject(e).getCenter(new h.Vector3());
      console.log("[DualCanvasViewer] 验证边界框中心（应为原始真实世界坐标）:", a), e.userData.geometricOffset = a.clone(), console.log("[DualCanvasViewer] 大坐标模型已移动到真实世界位置，变换已重置:", {
        position: e.position,
        geometricOffset: a,
        scale: e.scale,
        rotation: e.rotation
      }), await this.moveExistingModelsToReference(), this.adjustCameraForAllModels(), this.updateLargeCoordModelSelectedState(), this.activeLayer === "both" && (t.id === "three" ? (console.log("[DualCanvasViewer] 大坐标模型在原始模型层，设置交互层为 three"), this.interactionLayer = "three", this.updatePointerEvents()) : t.id === "bim" && (console.log("[DualCanvasViewer] 大坐标模型在BIM模型层，设置交互层为 bim"), this.interactionLayer = "bim", this.updatePointerEvents()), console.log("[DualCanvasViewer] 转换后交互层:", this.interactionLayer)), this.isInRealWorldCoordinates = !0, console.log("[DualCanvasViewer] 已设置 isInRealWorldCoordinates = true"), console.log("[DualCanvasViewer] 大坐标模型转换完成"), this.$message?.success("大坐标模型已设置为参考点，已加载的模型已移动到附近");
    },
    moveAllModelsToReferencePoint(e) {
      console.log("[DualCanvasViewer] 开始移动所有模型，偏移量:", e), this.modelGroup1 && this.modelGroup1.children.length > 0 && this.modelGroup1.children.forEach((t) => {
        t.userData.originalCenter && !t.userData.isLargeCoordModel ? (t.position.add(e), t.updateMatrixWorld(), console.log("[DualCanvasViewer] 移动层1模型:", t.userData.filePath, "新位置:", t.position)) : t.userData.originalCenter || (t.position.add(e), t.updateMatrixWorld(), console.log("[DualCanvasViewer] 移动层1小坐标模型:", t.userData.filePath, "新位置:", t.position));
      }), this.modelGroup2 && this.modelGroup2.children.length > 0 && this.modelGroup2.children.forEach((t) => {
        t.userData.originalCenter && !t.userData.isLargeCoordModel ? (t.position.add(e), t.updateMatrixWorld(), console.log("[DualCanvasViewer] 移动层2模型:", t.userData.filePath, "新位置:", t.position)) : t.userData.originalCenter || (t.position.add(e), t.updateMatrixWorld(), console.log("[DualCanvasViewer] 移动层2小坐标模型:", t.userData.filePath, "新位置:", t.position));
      }), console.log("[DualCanvasViewer] 所有模型移动完成");
    },
    adjustCameraForAllModels() {
      console.log("[DualCanvasViewer] 开始调整相机far");
      const e = [];
      if (this.modelGroup1 && e.push(...this.modelGroup1.children), this.modelGroup2 && e.push(...this.modelGroup2.children), e.length === 0) {
        console.warn("[DualCanvasViewer] 没有模型，无法调整相机");
        return;
      }
      const t = new h.Box3();
      e.forEach((l) => {
        const g = new h.Box3().setFromObject(l);
        t.union(g);
      }), console.log("[DualCanvasViewer] 所有模型的包围盒:", t);
      const o = new h.Vector3();
      t.getSize(o);
      const i = Math.max(o.x, o.y, o.z);
      console.log("[DualCanvasViewer] 最大尺寸:", i);
      const n = Math.max(1e3, i * 10);
      this.camera1 && (this.camera1.far = n, this.camera1.updateProjectionMatrix(), console.log("[DualCanvasViewer] 相机1 far已调整为:", n)), this.camera2 && (this.camera2.far = n, this.camera2.updateProjectionMatrix(), console.log("[DualCanvasViewer] 相机2 far已调整为:", n));
      const r = new h.Vector3();
      t.getCenter(r), console.log("[DualCanvasViewer] 所有模型的中心点:", r);
      const a = i * 2;
      console.log("[DualCanvasViewer] 计算的相机距离:", a), this.syncDepth++;
      const s = this.controls1 ? this.controls1.enabled : !1, c = this.controls2 ? this.controls2.enabled : !1;
      try {
        this.controls1 && (this.controls1.enabled = !1), this.controls2 && (this.controls2.enabled = !1), this.camera1 && this.controls1 && (this.camera1.position.set(r.x + a, r.y + a * 0.5, r.z + a), this.controls1.target.copy(r), console.log("[DualCanvasViewer] 相机1位置已更新:", this.camera1.position), console.log("[DualCanvasViewer] 相机1目标已更新:", this.controls1.target)), this.camera2 && this.controls2 && (this.camera2.position.set(r.x + a, r.y + a * 0.5, r.z + a), this.controls2.target.copy(r), console.log("[DualCanvasViewer] 相机2位置已更新:", this.camera2.position), console.log("[DualCanvasViewer] 相机2目标已更新:", this.controls2.target)), this.xeokitModelOffsets && this.xeokitModelOffsets.length > 0 && (console.log("[DualCanvasViewer] 设置 XKT 模型的相机位置"), this.xeokitModelOffsets.forEach((l) => {
          if (l && l.xeokitViewer) try {
            const g = l.xeokitViewer.viewer || l.xeokitViewer, u = l.x, d = -l.z, m = l.y, p = 100;
            g.camera.eye = [
              u + p,
              d + p * 0.5,
              m + p
            ], g.camera.look = [
              u,
              d,
              m
            ], g.camera.up = [
              0,
              1,
              0
            ], console.log("[DualCanvasViewer] XKT 模型相机已设置:", {
              target: {
                x: u,
                y: d,
                z: m
              },
              eye: g.camera.eye
            });
          } catch (g) {
            console.error("[DualCanvasViewer] 设置 XKT 模型相机失败:", g);
          }
        })), this.syncCameraToXeokitInternal(), console.log("[DualCanvasViewer] 相机far调整完成");
      } finally {
        this.controls1 && (this.controls1.enabled = s), this.controls2 && (this.controls2.enabled = c), requestAnimationFrame(() => {
          this.syncDepth--;
        });
      }
    },
    async moveExistingModelsToReference() {
      if (!this.referenceModelPosition) {
        console.log("[DualCanvasViewer] 没有参考位置，跳过模型移动");
        return;
      }
      console.log("[DualCanvasViewer] 开始移动已有模型到参考位置附近");
      let e = 0, t = 0;
      if (this.modelGroup1 && this.modelGroup1.children.length > 0 && this.modelGroup1.children.forEach((o) => {
        o.userData.isLargeCoordModel ? console.log("[DualCanvasViewer] 跳过被转换的大坐标模型（层1）:", o.userData.filePath) : (o.userData.hasLargeCoordinates || o.userData.hasLargeSize ? (console.log("[DualCanvasViewer] 转换大坐标 GLB 模型到原点附近（层1）:", o.userData.filePath), this.convertLargeCoordGLBModel(o, e)) : (console.log("[DualCanvasViewer] 找到小坐标模型（层1）:", o.userData.filePath), this.moveModelToReferencePointWithIndex(o, e)), e++, t++);
      }), this.modelGroup2 && this.modelGroup2.children.length > 0) {
        const o = /* @__PURE__ */ new Set(), i = [];
        for (const n of this.modelGroup2.children)
          if (console.log("[DualCanvasViewer] 检查模型（层2）:", {
            filePath: n.userData.filePath,
            isXKTModel: n.userData.isXKTModel,
            hasXeokitViewer: !!n.userData.xeokitViewer,
            hasLargeCoordinates: n.userData.hasLargeCoordinates,
            isLargeCoordModel: n.userData.isLargeCoordModel,
            fileName: n.userData.fileName
          }), n.userData.isXKTModel && n.userData.xeokitViewer) {
            const r = n.userData.fileName || n.userData.filePath;
            r && !o.has(r) ? (console.log("[DualCanvasViewer] 检测到 XKT 模型:", n.userData.filePath, "hasLargeCoordinates:", n.userData.hasLargeCoordinates), i.push({
              model: n,
              fileName: r,
              index: e
            }), o.add(r), e++) : r && o.has(r) ? console.log("[DualCanvasViewer] 跳过已处理的 XKT 模型:", n.userData.filePath) : console.log("[DualCanvasViewer] XKT 模型无效，跳过:", n.userData.filePath);
          } else n.userData.isLargeCoordModel ? console.log("[DualCanvasViewer] 跳过被转换的大坐标模型（层2）:", n.userData.filePath) : n.userData.hasLargeCoordinates || n.userData.hasLargeSize ? (console.log("[DualCanvasViewer] 转换大坐标 GLB 模型到原点附近（层2）:", n.userData.filePath), this.convertLargeCoordGLBModel(n, e), e++, t++) : (console.log("[DualCanvasViewer] 找到小坐标模型（层2）:", n.userData.filePath), this.moveModelToReferencePointWithIndex(n, e), e++, t++);
        console.log("[DualCanvasViewer] 开始处理", i.length, "个XKT模型");
        for (const { model: n, fileName: r, index: a } of i) {
          console.log("[DualCanvasViewer] 处理 XKT 模型:", r, "索引:", a), console.log("[DualCanvasViewer] 使用 xeokit 定位逻辑移动 XKT 模型");
          const s = this.modelGroup2.children.find((l) => l.userData.fileName === r);
          if (!s) {
            console.warn("[DualCanvasViewer] 未找到模型:", r);
            continue;
          }
          const c = await this.moveXKTModelToReferencePoint(s.userData.xeokitViewer, a);
          if (c && c !== s) {
            console.log("[DualCanvasViewer] 检测到大坐标XKT模型重新加载，更新 loadedModelsList 引用:", r);
            const l = this.loadedModelsList.find((g) => g.model === s);
            l && (l.model = c, l.boundingBox = c.userData.boundingBox, console.log("[DualCanvasViewer] 已在 moveExistingModelsToReference 中更新 loadedModelsList:", {
              fileName: r,
              newBoundingBoxCenter: c.userData.boundingBoxCenter
            }));
          }
          t++;
        }
      }
      console.log("[DualCanvasViewer] 已有模型移动完成，共移动", t, "个模型");
    },
    convertLargeCoordGLBModel(e, t) {
      if (!e || !e.userData.originalCenter) {
        console.warn("[DualCanvasViewer] 模型没有 originalCenter，无法转换:", e.userData.filePath);
        return;
      }
      const o = e.userData.originalCenter;
      console.log("[DualCanvasViewer] 转换大坐标 GLB 模型:", e.userData.filePath, "原始中心:", o);
      const i = 20, n = 5, r = t % n * i, a = Math.floor(t / n) * i, s = new h.Vector3(this.referenceModelPosition.x + r, this.referenceModelPosition.y, this.referenceModelPosition.z + a), c = new h.Vector3().subVectors(s, o);
      e.position.add(c), e.updateMatrixWorld(), e.userData.isLargeCoordModel = !0, e.userData.convertedPosition = s.clone(), console.log("[DualCanvasViewer] 大坐标 GLB 模型已转换:", {
        name: e.userData.filePath,
        originalCenter: o,
        targetPosition: s,
        positionOffset: c,
        newPosition: e.position
      });
    },
    async moveXKTModelToReferencePoint(e, t) {
      if (!this.referenceModelPosition || !e) {
        console.log("[DualCanvasViewer] 没有参考位置或 xeokit viewer，跳过 XKT 模型移动");
        return;
      }
      let o, i;
      if (e.viewer && e.viewer.scene)
        o = e.viewer, i = this.modelGroup2.children.find((d) => d.userData.isXKTModel && d.userData.xeokitViewer === o);
      else if (e.scene)
        o = e, i = this.modelGroup2.children.find((d) => d.userData.isXKTModel && d.userData.xeokitViewer === o);
      else {
        console.warn("[DualCanvasViewer] 无效的 xeokit viewer 参数:", e);
        return;
      }
      if (!i) {
        console.warn("[DualCanvasViewer] 未找到对应的 Three.js 模型");
        return;
      }
      if (console.log("[DualCanvasViewer] 移动 XKT 模型到参考位置:", {
        fileName: i.userData.fileName,
        hasLargeCoordinates: i.userData.hasLargeCoordinates,
        isInRealWorldCoordinates: this.isInRealWorldCoordinates
      }), this.isInRealWorldCoordinates && i.userData.hasLargeCoordinates) {
        console.log("[DualCanvasViewer] 真实世界坐标系统：将大坐标XKT模型移动到原点附近（类似GLB底图）");
        const d = new h.Vector3(a * 0.5, 0, s * 0.5);
        console.log("[DualCanvasViewer] XKT 模型移动到（真实世界坐标系统）:", {
          fileName: i.userData.fileName,
          targetPosition: d,
          offset: {
            x: a * 0.5,
            z: s * 0.5
          }
        });
        try {
          const m = await this.reloadXKTModelToPosition(i, d);
          if (m)
            return console.log("[DualCanvasViewer] 大坐标XKT模型重新加载成功（真实世界坐标）:", i.userData.fileName), m;
        } catch (m) {
          console.error("[DualCanvasViewer] 大坐标XKT模型重新加载失败:", m);
        }
        return;
      }
      const n = 20, r = 5, a = t % r * n, s = Math.floor(t / r) * n, c = new h.Vector3(this.referenceModelPosition.x + a, this.referenceModelPosition.y, this.referenceModelPosition.z + s);
      if (console.log("[DualCanvasViewer] XKT 模型移动到:", {
        fileName: i.userData.fileName,
        targetPosition: c,
        offset: {
          x: a,
          z: s
        }
      }), i.userData.hasLargeCoordinates) {
        console.log("[DualCanvasViewer] 大坐标XKT模型使用重新加载方式");
        try {
          const d = await this.reloadXKTModelToPosition(i, c);
          if (d)
            return console.log("[DualCanvasViewer] 大坐标XKT模型重新加载成功:", i.userData.fileName), d;
        } catch (d) {
          console.error("[DualCanvasViewer] 大坐标XKT模型重新加载失败:", d);
        }
        return;
      }
      const l = o.scene.models;
      if (!l) {
        console.warn("[DualCanvasViewer] xeokit viewer.scene.models 为空");
        return;
      }
      const g = Object.keys(l);
      if (g.length === 0) {
        console.warn("[DualCanvasViewer] xeokit 场景中没有模型");
        return;
      }
      const u = l[g[0]];
      if (!u) {
        console.warn("[DualCanvasViewer] 未找到 xeokit 模型");
        return;
      }
      if (u.position !== void 0 && (u.position = [
        c.x,
        c.y,
        c.z
      ], console.log("[DualCanvasViewer] xeokit 模型位置已设置:", {
        fileName: i.userData.fileName,
        position: u.position
      })), i.position.copy(c), i.updateMatrixWorld(), i.userData.boundingBoxSize) {
        const d = i.userData.boundingBoxSize, m = new h.Box3(new h.Vector3(c.x - d.x / 2, c.y - d.y / 2, c.z - d.z / 2), new h.Vector3(c.x + d.x / 2, c.y + d.y / 2, c.z + d.z / 2)), p = m.getCenter(new h.Vector3());
        i.userData.boundingBox = m, i.userData.boundingBoxCenter = p, console.log("[DualCanvasViewer] XKT 模型 Three.js 占位符已更新:", {
          fileName: i.userData.fileName,
          position: i.position,
          boundingBoxCenter: p
        });
      }
      console.log("[DualCanvasViewer] XKT 模型移动完成:", i.userData.fileName);
    },
    moveModelToReferencePointWithIndex(e, t) {
      if (!this.referenceModelPosition) {
        console.log("[DualCanvasViewer] 没有参考位置，跳过模型移动");
        return;
      }
      if (e.userData._movedNearLargeCoordModel) {
        console.log("[DualCanvasViewer] 跳过已移动到大坐标模型附近的小模型:", e.userData.filePath);
        return;
      }
      console.log("[DualCanvasViewer] 移动模型到参考点附近:", e.userData.filePath, "索引:", t), console.log("[DualCanvasViewer] 模型原始位置:", e.position);
      const o = new h.Box3().setFromObject(e), i = new h.Vector3();
      o.getCenter(i);
      const n = o.min;
      console.log("[DualCanvasViewer] 模型包围盒 - 局部空间中心:", i, "底部:", n);
      const r = 12, a = 5, s = t % a * r, c = Math.floor(t / a) * r, l = new h.Vector3(this.referenceModelPosition.x + s, this.referenceModelPosition.y, this.referenceModelPosition.z + c);
      console.log("[DualCanvasViewer] 目标位置:", l), e.position.copy(l), e.updateMatrixWorld();
      const g = new h.Box3().setFromObject(e), u = g.getCenter(new h.Vector3()), d = g.min, m = g.max;
      console.log("[DualCanvasViewer] 模型移动后的位置:", e.position), console.log("[DualCanvasViewer] 移动后包围盒 - 中心:", u, "底部:", d, "顶部:", m);
    },
    moveModelToReferencePoint(e) {
      if (!this.referenceModelPosition) {
        console.log("[DualCanvasViewer] 没有参考位置，跳过模型移动");
        return;
      }
      console.log("[DualCanvasViewer] 移动模型到参考点附近:", e.userData.filePath), console.log("[DualCanvasViewer] 模型当前位置:", e.position), console.log("[DualCanvasViewer] 参考位置:", this.referenceModelPosition);
      const t = new h.Box3().setFromObject(e), o = new h.Vector3();
      t.getCenter(o);
      const i = t.min;
      console.log("[DualCanvasViewer] 模型包围盒 - 局部空间中心:", o, "底部:", i);
      const n = new h.Vector3(this.referenceModelPosition.x + 0 - o.x, this.referenceModelPosition.y, this.referenceModelPosition.z + 0 - o.z);
      e.position.copy(n), e.updateMatrixWorld();
      const r = new h.Box3().setFromObject(e), a = r.getCenter(new h.Vector3()), s = r.min, c = r.max;
      console.log("[DualCanvasViewer] 模型移动后的位置:", e.position), console.log("[DualCanvasViewer] 移动后包围盒 - 中心:", a, "底部:", s, "顶部:", c), console.log("[DualCanvasViewer] 偏移量: 已禁用，所有模型对齐到参考位置");
    },
    saveModelLayoutSnapshot() {
      if (!this.mercatorProjectionManager && !this.syncManager) {
        console.warn("[DualCanvasViewer] 无法保存模型布局快照：缺少必要的坐标管理器");
        return;
      }
      const e = this.mouseCoords?.mercator?.floorCenter || {
        x: 0,
        y: 0,
        z: 0
      };
      if (!e) {
        console.warn("[DualCanvasViewer] 无法保存模型布局快照：地板中心未初始化");
        return;
      }
      console.log("[DualCanvasViewer] 开始保存模型布局快照，地板中心:", {
        x: e.x.toFixed(2),
        y: e.y.toFixed(2),
        z: e.z.toFixed(2)
      });
      const t = [];
      this.modelGroup1 && this.modelGroup1.children.forEach((o) => {
        if (o.userData.isBox3Helper) return;
        let i, n = !1;
        n = Math.abs(o.position.x) < 1e-3 && Math.abs(o.position.y) < 1e-3 && Math.abs(o.position.z) < 1e-3, n && o.userData.originalCenter ? i = {
          x: 0,
          y: 0,
          z: 0
        } : i = {
          x: o.position.x - e.x,
          y: o.position.y - e.y,
          z: o.position.z - e.z
        }, t.push({
          name: o.userData.filePath || o.userData.fileName || o.name,
          layer: "three",
          originalPosition: {
            x: o.position.x,
            y: o.position.y,
            z: o.position.z
          },
          relativePosition: i,
          scale: {
            x: o.scale.x,
            y: o.scale.y,
            z: o.scale.z
          },
          rotation: {
            x: o.rotation.x,
            y: o.rotation.y,
            z: o.rotation.z
          },
          isLargeCoordModel: o.userData.isLargeCoordModel || !1,
          hasLargeCoordinates: o.userData.hasLargeCoordinates || !1,
          hasLargeSize: o.userData.hasLargeSize || !1,
          originalCenter: o.userData.originalCenter ? {
            x: o.userData.originalCenter.x,
            y: o.userData.originalCenter.y,
            z: o.userData.originalCenter.z
          } : null
        }), console.log("[DualCanvasViewer] 保存层1模型:", {
          name: o.userData.filePath || o.userData.fileName || o.name,
          原始位置: `(${o.position.x.toFixed(2)}, ${o.position.y.toFixed(2)}, ${o.position.z.toFixed(2)})`,
          相对位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
          说明: n ? "参考模型（在原点）" : "已移动到参考点附近"
        });
      }), this.modelGroup2 && this.modelGroup2.children.forEach((o) => {
        if (o.userData.isBox3Helper) return;
        let i = o.position.clone();
        if (o.userData.isXKTModel && o.userData.xeokitViewer) {
          const r = o.userData.xeokitViewer.scene.models, a = Object.keys(r);
          if (a.length > 0) {
            const s = r[a[0]];
            i.set(s.position[0], s.position[1], s.position[2]);
          }
        }
        const n = {
          x: i.x - e.x,
          y: i.y - e.y,
          z: i.z - e.z
        };
        t.push({
          name: o.userData.filePath || o.userData.fileName || o.name,
          layer: "bim",
          originalPosition: {
            x: i.x,
            y: i.y,
            z: i.z
          },
          relativePosition: n,
          scale: {
            x: o.scale.x,
            y: o.scale.y,
            z: o.scale.z
          },
          rotation: {
            x: o.rotation.x,
            y: o.rotation.y,
            z: o.rotation.z
          },
          isLargeCoordModel: o.userData.isLargeCoordModel || !1,
          hasLargeCoordinates: o.userData.hasLargeCoordinates || !1,
          hasLargeSize: o.userData.hasLargeSize || !1,
          isXKTModel: o.userData.isXKTModel || !1,
          originalCenter: o.userData.originalCenter ? {
            x: o.userData.originalCenter.x,
            y: o.userData.originalCenter.y,
            z: o.userData.originalCenter.z
          } : null
        }), console.log("[DualCanvasViewer] 保存层2模型:", {
          name: o.userData.filePath || o.userData.fileName || o.name,
          原始位置: `(${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)})`,
          相对位置: `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`
        });
      }), this.modelLayoutSnapshot = {
        timestamp: Date.now(),
        floorCenterMercator: {
          x: e.x,
          y: e.y,
          z: e.z
        },
        models: t
      }, console.log("[DualCanvasViewer] 模型布局快照已保存:", {
        时间戳: new Date(this.modelLayoutSnapshot.timestamp).toLocaleString(),
        地板中心: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
        模型数量: t.length,
        模型列表: t.map((o) => `${o.layer}:${o.name}`)
      });
    },
    restoreModelLayoutFromSnapshot() {
      if (!this.modelLayoutSnapshot) {
        console.warn("[DualCanvasViewer] 没有可用的模型布局快照");
        return;
      }
      console.log("[DualCanvasViewer] 开始从快照恢复模型布局:", {
        快照时间: new Date(this.modelLayoutSnapshot.timestamp).toLocaleString(),
        快照地板中心: `(${this.modelLayoutSnapshot.floorCenterMercator.x.toFixed(2)}, ${this.modelLayoutSnapshot.floorCenterMercator.y.toFixed(2)}, ${this.modelLayoutSnapshot.floorCenterMercator.z.toFixed(2)})`,
        模型数量: this.modelLayoutSnapshot.models.length
      });
      const e = this.mouseCoords?.mercator?.floorCenter || {
        x: 0,
        y: 0,
        z: 0
      };
      if (!e) {
        console.warn("[DualCanvasViewer] 当前地板中心未初始化，无法恢复模型布局");
        return;
      }
      console.log("[DualCanvasViewer] 当前地板中心:", {
        x: e.x.toFixed(2),
        y: e.y.toFixed(2),
        z: e.z.toFixed(2)
      });
      let t = 0;
      this.modelLayoutSnapshot.models.forEach((o) => {
        let i = null;
        if (o.layer === "three" ? (i = this.modelGroup1?.children.find((r) => (r.userData.filePath === o.name || r.userData.fileName === o.name || r.name === o.name) && !r.userData.isBox3Helper), this.getLayerConfig("three")) : o.layer === "bim" && (i = this.modelGroup2?.children.find((r) => (r.userData.filePath === o.name || r.userData.fileName === o.name || r.name === o.name) && !r.userData.isBox3Helper), this.getLayerConfig("bim")), !i) {
          console.warn("[DualCanvasViewer] 未找到模型:", o.name, "层:", o.layer);
          return;
        }
        const n = {
          x: e.x + o.relativePosition.x,
          y: e.y + o.relativePosition.y,
          z: e.z + o.relativePosition.z
        };
        if (o.isXKTModel && i.userData.xeokitViewer) {
          const r = i.userData.xeokitViewer.scene.models, a = Object.keys(r);
          if (a.length > 0) {
            const s = r[a[0]];
            s.position = [
              n.x,
              n.y,
              n.z
            ], console.log("[DualCanvasViewer] XKT模型位置已更新");
          }
        } else i.position.set(n.x, n.y, n.z);
        i.scale.set(o.scale.x, o.scale.y, o.scale.z), i.rotation.set(o.rotation.x, o.rotation.y, o.rotation.z), i.updateMatrixWorld(), t++;
      }), console.log("[DualCanvasViewer] 模型布局恢复完成，共恢复", t, "个模型"), this.adjustCameraForAllModels();
    },
    async exitRealWorldMode() {
      if (console.log("[DualCanvasViewer] 开始退出真实世界模式，切换回小坐标模式"), !this.isInRealWorldMode && !this.isInRealWorldCoordinates) {
        console.warn("[DualCanvasViewer] 当前不在真实世界模式，无需退出");
        return;
      }
      const e = this.mouseCoords?.mercator?.floorCenter || this.mercatorProjectionManager?.getFloorCenter(), t = e && (e.x !== 0 || e.y !== 0);
      if (console.log("[DualCanvasViewer] 当前地板中心:", t ? {
        x: e.x.toFixed(2),
        y: e.y.toFixed(2),
        z: e.z.toFixed(2)
      } : "无效或未设置"), t && this.syncManager && window.__cesiumViewer__) {
        const i = this.syncManager.getCesium();
        if (i) {
          const n = this.syncManager.earthRadius || 6378137, r = e.x / n * 180 / Math.PI, a = this.syncManager.surfaceHandler.mercatorToLatitude(e.y) * 180 / Math.PI, s = e.z || 500;
          console.log("[DualCanvasViewer] 将Cesium相机飞到地板中心对应的地理位置:", {
            经度: r.toFixed(6),
            纬度: a.toFixed(6),
            高度: s.toFixed(2)
          });
          try {
            window.__cesiumViewer__.camera.setView({
              destination: i.Cartesian3.fromDegrees(r, a, s),
              orientation: {
                heading: 0,
                pitch: -i.Math.PI_OVER_FOUR,
                roll: 0
              }
            }), console.log("[DualCanvasViewer] ✅ Cesium相机已设置到目标位置（setView）");
          } catch (c) {
            console.warn("[DualCanvasViewer] Cesium相机设置失败:", c);
          }
        }
      }
      this.modelLayoutSnapshot ? this.restoreModelLayoutFromSnapshot() : console.warn("[DualCanvasViewer] 没有模型布局快照，模型位置可能不正确"), this.isInRealWorldMode = !1, this.isInRealWorldCoordinates = !1, console.log("[DualCanvasViewer] 已重置真实世界模式标志"), this.controls1 && (this.controls1.enablePan = !0, console.log("[DualCanvasViewer] 小坐标模式：已启用 controls1 内置平移")), this.controls2 && (this.controls2.enablePan = !0, console.log("[DualCanvasViewer] 小坐标模式：已启用 controls2 内置平移")), this.controls1 && (this.controls1.minPolarAngle = 0, this.controls1.maxPolarAngle = Math.PI / 2, console.log("[DualCanvasViewer] 小坐标模式：已恢复 controls1 角度限制")), this.controls2 && (this.controls2.minPolarAngle = 0, this.controls2.maxPolarAngle = Math.PI / 2, console.log("[DualCanvasViewer] 小坐标模式：已恢复 controls2 角度限制"));
      const o = this.getLargeCoordModelLocation();
      o ? (this.enableMixedModeWithModelLocation(o), console.log("[DualCanvasViewer] 退出真实世界模式后已启用混合模式（使用大坐标模型经纬度）")) : t && (this.enableMixedMode(e), console.log("[DualCanvasViewer] 退出真实世界模式后已启用混合模式（使用地板中心）")), this.controls1 && this.controls1.update(), this.controls2 && this.controls2.update(), console.log("[DualCanvasViewer] 已退出真实世界模式，切换回小坐标模式"), this.$message?.success("已切换回小坐标模式，模型布局已恢复");
    },
    enableMixedMode(e) {
      if (!e || !this.syncManager)
        return console.warn("[DualCanvasViewer] 无法启用混合模式：缺少必要参数"), !1;
      console.log("[DualCanvasViewer] 启用混合模式，保存地理偏移:", {
        x: e.x.toFixed(2),
        y: e.y.toFixed(2),
        z: e.z.toFixed(2)
      });
      const t = this.syncManager.earthRadius || 6378137, o = e.x / t * 180 / Math.PI, i = this.syncManager.surfaceHandler.mercatorToLatitude(e.y) * 180 / Math.PI;
      return this.mouseCoords ? (this.mouseCoords.geoOffset = {
        x: e.x,
        y: e.y,
        z: e.z,
        longitude: o,
        latitude: i,
        enabled: !0
      }, console.log("[DualCanvasViewer] 混合模式已启用，地理偏移:", {
        墨卡托: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
        经度: o.toFixed(6) + "°",
        纬度: i.toFixed(6) + "°"
      }), !0) : !1;
    },
    disableMixedMode() {
      console.log("[DualCanvasViewer] disableMixedMode: 空函数（混合模式检查已移除）");
    },
    _createSceneContainers() {
      if (console.log("[DualCanvasViewer] 创建场景容器..."), this._createAnchorContainers(), this.scene1) {
        this.sceneContainer1 = new h.Group(), this.sceneContainer1.name = "Layer1_SceneContainer";
        const e = [];
        this.scene1.traverse((t) => {
          const o = t.parent === this.anchorContainer1 || t === this.anchorContainer1 || this.anchorContainer1 && t.parent?.parent === this.anchorContainer1;
          t !== this.camera1 && t !== this.controls1 && t.parent === this.scene1 && !o && e.push(t);
        }), console.log("[DualCanvasViewer] 🔍 对象筛选:", {
          找到的对象数: e.length,
          排除的锚点容器对象: "已排除"
        }), e.forEach((t) => {
          this.sceneContainer1.attach(t);
        }), this.scene1.add(this.sceneContainer1), console.log("[DualCanvasViewer] ✅ 层1场景容器已创建，包含对象数:", e.length);
      } else console.warn("[DualCanvasViewer] ⚠️ scene1 未就绪，跳过层1场景容器创建");
      if (this.scene2) {
        this.sceneContainer2 = new h.Group(), this.sceneContainer2.name = "Layer2_SceneContainer";
        const e = [];
        this.scene2.traverse((t) => {
          const o = t.parent === this.anchorContainer2 || t === this.anchorContainer2 || this.anchorContainer2 && t.parent?.parent === this.anchorContainer2;
          t !== this.camera2 && t !== this.controls2 && t.parent === this.scene2 && !o && e.push(t);
        }), e.forEach((t) => {
          this.sceneContainer2.attach(t);
        }), this.scene2.add(this.sceneContainer2), console.log("[DualCanvasViewer] ✅ 层2场景容器已创建，包含对象数:", e.length);
      } else console.warn("[DualCanvasViewer] ⚠️ scene2 未就绪，跳过层2场景容器创建");
      this.verifyAndFixSceneContainerPosition();
    },
    _createAnchorContainers() {
      if (console.warn("[DualCanvasViewer] 📍 创建独立锚点容器..."), this.scene1) {
        this.anchorContainer1 = new h.Group(), this.anchorContainer1.name = "Layer1_AnchorContainer", this.anchorContainer1.position.set(0, 0, 0), this.scene1.add(this.anchorContainer1);
        const e = new h.Vector3();
        if (this.anchorContainer1.getWorldPosition(e), console.warn("[DualCanvasViewer] ✅ 层1锚点容器已创建:", {
          局部位置: `(${this.anchorContainer1.position.x.toFixed(2)}, ${this.anchorContainer1.position.y.toFixed(2)}, ${this.anchorContainer1.position.z.toFixed(2)})`,
          世界位置: `(${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})`,
          父对象: this.anchorContainer1.parent.type,
          场景子对象数量: this.scene1.children.length
        }), this.sceneContainer1) {
          const t = new h.Vector3();
          this.sceneContainer1.getWorldPosition(t);
          const o = new h.Quaternion();
          this.sceneContainer1.getWorldQuaternion(o), console.warn("[DualCanvasViewer] 🔄 场景容器变换:", {
            sceneContainer1位置: `(${this.sceneContainer1.position.x.toFixed(2)}, ${this.sceneContainer1.position.y.toFixed(2)}, ${this.sceneContainer1.position.z.toFixed(2)})`,
            sceneContainer1世界位置: `(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`,
            sceneContainer1四元数: `(${o.x.toFixed(4)}, ${o.y.toFixed(4)}, ${o.z.toFixed(4)}, ${o.w.toFixed(4)})`,
            说明: "如果场景容器有旋转或位移，会影响anchorContainer的世界坐标"
          });
        }
      }
      this.scene2 && (this.anchorContainer2 = new h.Group(), this.anchorContainer2.name = "Layer2_AnchorContainer", this.anchorContainer2.position.set(0, 0, 0), this.scene2.add(this.anchorContainer2), console.log("[DualCanvasViewer] ✅ 层2锚点容器已创建"));
    },
    _moveAnchorObjectsToAnchorContainer() {
      if (console.log("[DualCanvasViewer] 🔄 将红色球体移到锚点容器（GridHelper 保持在 sceneContainer 中跟随场景旋转）..."), console.warn("[DualCanvasViewer] 🔍 _moveAnchorObjectsToAnchorContainer 初始状态:", {
        anchorContainer1: !!this.anchorContainer1,
        gridHelper1: !!this.gridHelper1,
        gridHelper1父对象: this.gridHelper1?.parent?.name || this.gridHelper1?.parent?.type || "none",
        anchorContainer2: !!this.anchorContainer2,
        gridHelper2: !!this.gridHelper2,
        gridHelper2父对象: this.gridHelper2?.parent?.name || this.gridHelper2?.parent?.type || "none",
        sceneContainer1存在: !!this.sceneContainer1,
        sceneContainer2存在: !!this.sceneContainer2
      }), this.anchorContainer1) {
        console.log("[DualCanvasViewer] ✅ 层1 anchorContainer1 存在，处理红色球体移动");
        const e = this.sceneContainer1?.children.find((t) => t.name === "GroundMarker_Theoretical");
        if (console.warn("[DualCanvasViewer] 🔍 查找红色球体:", {
          sceneContainer1子对象数: this.sceneContainer1?.children.length || 0,
          找到: !!e,
          名称: e?.name,
          父对象: e?.parent?.name || e?.parent?.type || "none"
        }), e && e.parent !== this.anchorContainer1) {
          console.log("[DualCanvasViewer] 🔄 正在将红色球体移到 anchorContainer1...");
          try {
            this.anchorContainer1.attach(e), console.log("[DualCanvasViewer] ✅ attach() 调用成功");
            const t = this.sceneContainer1?.children.filter((o) => o.type === "Mesh" && o.material?.wireframe === !0) || [];
            console.log("[DualCanvasViewer] 🔍 找到线框数量:", t.length), t.forEach((o) => {
              o.parent !== this.anchorContainer1 && this.anchorContainer1.attach(o);
            }), console.log("[DualCanvasViewer] ✅ 红色球体已移到层1锚点容器");
          } catch (t) {
            console.error("[DualCanvasViewer] ❌ 移动红色球体失败:", t);
          }
        } else console.warn("[DualCanvasViewer] ⚠️ 红色球体移动条件不满足:", {
          红色球体存在: !!e,
          父对象是anchorContainer1: e?.parent === this.anchorContainer1
        });
      } else console.warn("[DualCanvasViewer] ⚠️ 层1条件不满足:", { anchorContainer1存在: !!this.anchorContainer1 });
      if (this.anchorContainer2) {
        const e = this.sceneContainer2?.children.find((t) => t.name === "GroundMarker_Theoretical");
        e && e.parent !== this.anchorContainer2 && (this.anchorContainer2.attach(e), (this.sceneContainer2?.children.filter((t) => t.type === "Mesh" && t.material?.wireframe === !0) || []).forEach((t) => {
          t.parent !== this.anchorContainer2 && this.anchorContainer2.attach(t);
        }), console.log("[DualCanvasViewer] ✅ 红色球体已移到层2锚点容器"));
      }
      console.log("[DualCanvasViewer] ✅ _moveAnchorObjectsToAnchorContainer 完成（GridHelper 保持在 sceneContainer 中）");
    },
    async _initializeSceneRotationSystem() {
      console.log("[DualCanvasViewer] 初始化场景旋转系统...");
      const e = this.Cesium || window.Cesium;
      if (!e) {
        console.warn("[DualCanvasViewer] ⚠️ Cesium 不可用，跳过场景旋转初始化");
        return;
      }
      const t = window.__syncManager__;
      if (!t) {
        console.warn("[DualCanvasViewer] ⚠️ SyncManager 不可用，跳过场景旋转初始化");
        return;
      }
      try {
        this.sceneRotation.setCesium(e, this.cesiumViewer), this.modelMercatorMetadata.setCesium(e);
        const o = t.mercatorProjection.getFloorCenter();
        if (!o) {
          console.warn("[DualCanvasViewer] ⚠️ 地板中心未设置，跳过场景旋转初始化");
          return;
        }
        const i = {
          longitude: o.x / 6378137,
          latitude: this._mercatorYToLatitude(o.y),
          height: o.z || 0
        };
        this.sceneRotation.initialize(o, i, null), this.sceneRotationIntegration.initialize({
          floorCenterMercator: o,
          floorCenterCartographic: i,
          layer1Container: this.sceneContainer1,
          layer2Container: this.sceneContainer2,
          Cesium: e,
          cesiumViewer: this.cesiumViewer
        }), this.modelMercatorMetadata.setENUOrigin(o, i), this._registerLoadedModelsMetadata(), this.sceneRotationInitialized = !0, console.log("[DualCanvasViewer] ✅ 场景旋转系统初始化完成"), typeof window < "u" && window.__dualCanvasViewerSceneRotation__ && (window.__dualCanvasViewerSceneRotation__.initialized = !0);
      } catch (o) {
        console.error("[DualCanvasViewer] ❌ 场景旋转系统初始化失败:", o);
      }
    },
    _registerLoadedModelsMetadata() {
      console.log("[DualCanvasViewer] 注册已加载模型的墨卡托元数据...");
      let e = 0;
      this.modelGroup1 && this.modelGroup1.traverse((t) => {
        if (t.isMesh || t.isGroup) {
          const o = new h.Vector3();
          t.getWorldPosition(o), this.modelMercatorMetadata.registerModel(t, { enuPosition: o }), e++;
        }
      }), this.modelGroup2 && this.modelGroup2.traverse((t) => {
        if (t.isMesh || t.isGroup) {
          const o = new h.Vector3();
          t.getWorldPosition(o), this.modelMercatorMetadata.registerModel(t, { enuPosition: o }), e++;
        }
      }), console.log("[DualCanvasViewer] ✅ 已注册模型数量:", e), this.modelMercatorMetadata.updateAllMercatorCoords();
    },
    _mercatorYToLatitude(e) {
      return 2 * Math.atan(Math.exp(e / 6378137)) - Math.PI / 2;
    },
    _latitudeToMercatorY(e) {
      return Math.log(Math.tan(Math.PI / 4 + e / 2)) * 6378137;
    },
    enableSceneRotation() {
      this.sceneRotationEnabled = !0, console.log("[DualCanvasViewer] ✅ 场景旋转已启用"), typeof window < "u" && window.__dualCanvasViewerSceneRotation__ && (window.__dualCanvasViewerSceneRotation__.enabled = !0), this.sceneRotationInitialized && this.cesiumViewer && this.sceneRotation.updateSceneRotation(this.cesiumViewer.camera, !0);
    },
    disableSceneRotation() {
      this.sceneRotationEnabled = !1, console.log("[DualCanvasViewer] ⚠️ 场景旋转已禁用"), typeof window < "u" && window.__dualCanvasViewerSceneRotation__ && (window.__dualCanvasViewerSceneRotation__.enabled = !1), this.sceneContainer1 && (this.sceneContainer1.quaternion.set(0, 0, 0, 1), this.sceneContainer1.updateMatrixWorld(!0)), this.sceneContainer2 && (this.sceneContainer2.quaternion.set(0, 0, 0, 1), this.sceneContainer2.updateMatrixWorld(!0));
    },
    getSceneRotationState() {
      return {
        enabled: this.sceneRotationEnabled,
        initialized: this.sceneRotationInitialized,
        rotation: this.sceneRotation.getRotationState(),
        integration: this.sceneRotationIntegration.getState(),
        metadata: this.modelMercatorMetadata.getStats()
      };
    },
    getLargeCoordModelLocation() {
      if (this.modelGroup1) {
        for (const o of this.modelGroup1.children) if (o.userData.isReferenceLargeCoordModel && o.userData.originalLocation) {
          const i = o.userData.originalLocation;
          return console.log("[DualCanvasViewer] 📍 找到大坐标模型的地理位置信息（originalLocation）:", {
            文件名: i.fileName,
            经度: i.longitude.toFixed(6) + "°",
            纬度: i.latitude.toFixed(6) + "°",
            高度: i.altitude.toFixed(2) + "米"
          }), {
            fileName: i.fileName,
            longitude: i.longitude,
            latitude: i.latitude,
            altitude: i.altitude,
            mercator: i.mercator,
            cartographic: i.cartographic
          };
        }
      }
      const e = [], t = (o, i) => {
        o.traverse((n) => {
          n.isMesh && n.userData.hasLargeCoordinates && n.userData.geoLocation && e.push({
            name: n.name || n.userData.filePath || `${i}中的模型`,
            geoLocation: n.userData.geoLocation,
            position: n.position.clone(),
            userData: n.userData
          });
        });
      };
      if (this.scene1 && t(this.scene1, "scene1"), this.scene2 && t(this.scene2, "scene2"), e.length > 0) {
        console.log("[DualCanvasViewer] 找到", e.length, "个记录了经纬度的大坐标模型（geoLocation - 旧逻辑）:", e);
        const o = e[0].geoLocation;
        return {
          fileName: e[0].name,
          longitude: o.longitude,
          latitude: o.latitude,
          altitude: o.altitude || 0,
          mercator: o.mercator,
          cartographic: o.cartographic
        };
      }
      return console.log("[DualCanvasViewer] ⚠️ 未找到大坐标模型的地理位置信息"), null;
    },
    enableMixedModeWithModelLocation(e) {
      if (!e || !this.syncManager) {
        console.warn("[DualCanvasViewer] 无法启用混合模式：缺少必要参数");
        return;
      }
      const { longitude: t, latitude: o, height: i } = e, n = this.syncManager.earthRadius || 6378137, r = t * Math.PI / 180 * n, a = this.syncManager.surfaceHandler.latitudeToMercator(o * Math.PI / 180), s = i || 0, c = {
        x: r,
        y: a,
        z: s
      };
      if (console.log("[DualCanvasViewer] 使用大坐标模型经纬度启用混合模式:", {
        经度: t.toFixed(6) + "°",
        纬度: o.toFixed(6) + "°",
        高度: i,
        墨卡托: `(${r.toFixed(2)}, ${a.toFixed(2)}, ${s.toFixed(2)})`
      }), window.__cesiumViewer__) {
        const l = this.syncManager?.getCesium();
        if (l) {
          const g = i || 500, u = t * Math.PI / 180, d = o * Math.PI / 180;
          console.log("[DualCanvasViewer] 🛩️ 将 Cesium 相机飞到大坐标模型位置:", {
            经度: t.toFixed(6) + "°",
            纬度: o.toFixed(6) + "°",
            高度: g.toFixed(2) + "米"
          });
          try {
            window.__cesiumViewer__.camera.setView({
              destination: l.Cartesian3.fromRadians(u, d, g),
              orientation: {
                heading: 0,
                pitch: -l.Math.PI_OVER_FOUR,
                roll: 0
              }
            }), console.log("[DualCanvasViewer] ✅ Cesium 相机已设置到大坐标模型位置（setView）");
          } catch (m) {
            console.warn("[DualCanvasViewer] Cesium 相机设置失败:", m);
          }
        }
      } else console.warn("[DualCanvasViewer] 无法飞到模型位置：__cesiumViewer__ 不可用");
      this.enableMixedMode(c);
    },
    setAlignmentMode(e) {
      if (!this.heightAlignmentManager) {
        console.warn("[DualCanvasViewer] ⚠️ HeightAlignmentManager 未初始化");
        return;
      }
      this.alignmentMode = e, this.heightAlignmentManager.setAlignmentMode(e), console.log("[DualCanvasViewer] 🎯 对齐模式已设置为:", e);
    },
    updateHeightAlignmentManager(e) {
      if (!this.heightAlignmentManager) {
        console.warn("[DualCanvasViewer] ⚠️ HeightAlignmentManager 未初始化");
        return;
      }
      e.terrainHeight !== void 0 && this.heightAlignmentManager.setTerrainHeight(e.terrainHeight), e.obliqueOffset !== void 0 && this.heightAlignmentManager.setObliqueOffset(e.obliqueOffset), e.modelAltitude !== void 0 && this.heightAlignmentManager.setModelAltitude(e.modelAltitude), e.dualFloorHeight !== void 0 && this.heightAlignmentManager.setDualFloorHeight(e.dualFloorHeight), this.updateAnchorContainerPosition();
    }
  }
}, kn = { class: "dual-canvas-viewer" }, Nn = {
  ref: "eventContainer",
  class: "layer-container event-layer"
};
function In(e, t, o, i, n, r) {
  const a = et("DualCanvasControlPanel"), s = et("CoordinateInfoPanel");
  return Z(), q("div", kn, [
    t[0] || (t[0] = z("div", { class: "map-test-layer" }, null, -1)),
    z("div", {
      ref: "threeContainer",
      class: ue(["layer-container three-layer", { "layer-hidden": !n.showThreeLayer }])
    }, null, 2),
    z("div", {
      ref: "bimContainer",
      class: ue(["layer-container bim-layer", { "layer-hidden": !n.showBimLayer }]),
      style: Dt({ opacity: n.bimOpacity / 100 })
    }, null, 6),
    z("div", Nn, null, 512),
    Qe(a, {
      ref: "controlPanel",
      "active-layer": n.activeLayer,
      "show-three-layer": n.showThreeLayer,
      "show-bim-layer": n.showBimLayer,
      "bim-opacity": n.bimOpacity,
      "camera-sync-enabled": n.cameraSyncEnabled,
      "transform-mode": n.transformMode,
      "three-object-count": n.threeObjectCount,
      "bim-object-count": n.bimObjectCount,
      "has-large-coord-model-selected": n.hasLargeCoordModelSelected,
      "loaded-models-list": n.loadedModelsList,
      onSetActiveLayer: r.setActiveLayer,
      onUpdateBimOpacity: r.handleUpdateBimOpacity,
      onToggleCameraSync: r.handleToggleCameraSync,
      onSetTransformMode: r.setTransformMode,
      onLoadThreeModel: r.loadThreeModel,
      onLoadBimModel: r.loadBimModel,
      onConvertLargeCoordModel: r.convertLargeCoordModel,
      onExitRealWorldMode: r.exitRealWorldMode,
      onFocusOnModel: r.focusOnSingleModel
    }, null, 8, [
      "active-layer",
      "show-three-layer",
      "show-bim-layer",
      "bim-opacity",
      "camera-sync-enabled",
      "transform-mode",
      "three-object-count",
      "bim-object-count",
      "has-large-coord-model-selected",
      "loaded-models-list",
      "onSetActiveLayer",
      "onUpdateBimOpacity",
      "onToggleCameraSync",
      "onSetTransformMode",
      "onLoadThreeModel",
      "onLoadBimModel",
      "onConvertLargeCoordModel",
      "onExitRealWorldMode",
      "onFocusOnModel"
    ]),
    Qe(s, {
      ref: "coordinatePanel",
      "show-details": n.showCoordinateDetails,
      "show-geo-coords": n.showGeoCoords,
      "active-layer": n.activeLayer,
      coords: n.mouseCoords,
      "viewport-status": n.viewportStatus,
      "viewport-manager": n.viewportManager,
      "using-unified-viewport": n.usingUnifiedViewport,
      "using-ENU": n.usingENU,
      "has-xeokit-models": r.hasXeokitModels(),
      "format-real-world-coords-fn": r.formatRealWorldCoords,
      onToggleDetails: r.toggleCoordinateDetails
    }, null, 8, [
      "show-details",
      "show-geo-coords",
      "active-layer",
      "coords",
      "viewport-status",
      "viewport-manager",
      "using-unified-viewport",
      "using-ENU",
      "has-xeokit-models",
      "format-real-world-coords-fn",
      "onToggleDetails"
    ])
  ]);
}
var Xn = /* @__PURE__ */ Je(Rn, [["render", In], ["__scopeId", "data-v-5a2f9b3e"]]);
export {
  Xn as default
};
