import { Fragment as e, Teleport as t, Transition as n, createBlock as r, createCommentVNode as i, createElementBlock as a, createElementVNode as o, createTextVNode as s, createVNode as c, markRaw as l, mergeProps as u, normalizeClass as d, normalizeStyle as f, openBlock as p, renderList as m, renderSlot as h, resolveComponent as g, resolveDynamicComponent as _, toDisplayString as v, toHandlers as y, vModelText as b, vShow as x, withCtx as S, withDirectives as C, withModifiers as w } from "vue";
//#region ../../GISBIM/cesiumBase/src/utils/CesiumEventManager.js
var T = class {
	constructor() {
		this.isReady = !1, this.listeners = /* @__PURE__ */ new Set(), this.cesiumInstance = null, this.viewerInstance = null, this.checkInterval = null, this.checkAttempts = 0, this.maxAttempts = 50;
	}
	init() {
		if (!(typeof window > "u")) {
			if (this.checkCesiumReady()) {
				this.setReady();
				return;
			}
			this.setupGlobalListener(), this.startPolling();
		}
	}
	checkCesiumReady() {
		if (typeof window > "u") return !1;
		let e = window.Cesium !== void 0, t = window.__cesiumViewer__ !== void 0;
		return e && t;
	}
	setupGlobalListener() {
		window.addEventListener("cesium-ready", this.handleCesiumReady), window.addEventListener("cesium-viewer-ready", this.handleViewerReady);
	}
	removeGlobalListener() {
		typeof window > "u" || (window.removeEventListener("cesium-ready", this.handleCesiumReady), window.removeEventListener("cesium-viewer-ready", this.handleViewerReady));
	}
	handleCesiumReady = () => {
		console.log("[CesiumEventManager] 📡 收到 cesium-ready 事件"), this.cesiumInstance = window.Cesium, window.__cesiumViewer__ && this.setReady();
	};
	handleViewerReady = () => {
		console.log("[CesiumEventManager] 📡 收到 cesium-viewer-ready 事件"), this.viewerInstance = window.__cesiumViewer__, window.Cesium && this.setReady();
	};
	startPolling() {
		this.checkInterval ||= (this.checkAttempts = 0, setInterval(() => {
			this.checkAttempts++, this.checkCesiumReady() ? (this.setReady(), this.stopPolling()) : this.checkAttempts >= this.maxAttempts && (console.warn("[CesiumEventManager] ⏰ Cesium 初始化检查超时"), this.stopPolling());
		}, 100));
	}
	stopPolling() {
		this.checkInterval &&= (clearInterval(this.checkInterval), null);
	}
	setReady() {
		this.isReady || (this.isReady = !0, this.cesiumInstance = window.Cesium, this.viewerInstance = window.__cesiumViewer__, console.log("[CesiumEventManager] ✅ Cesium 已就绪"), this.stopPolling(), this.notifyListeners(), this.dispatchGlobalEvent());
	}
	notifyListeners() {
		this.listeners.forEach((e) => {
			try {
				e(this.cesiumInstance, this.viewerInstance);
			} catch (e) {
				console.error("[CesiumEventManager] ❌ 监听器执行失败:", e);
			}
		});
	}
	dispatchGlobalEvent() {
		if (typeof window > "u") return;
		let e = new CustomEvent("cesium-all-ready", { detail: {
			cesium: this.cesiumInstance,
			viewer: this.viewerInstance
		} });
		window.dispatchEvent(e);
	}
	onReady(e) {
		if (typeof e != "function") return console.warn("[CesiumEventManager] ⚠️ 监听器必须是函数"), () => {};
		if (this.isReady) try {
			e(this.cesiumInstance, this.viewerInstance);
		} catch (e) {
			console.error("[CesiumEventManager] ❌ 监听器执行失败:", e);
		}
		else this.listeners.add(e);
		return () => {
			this.listeners.delete(e);
		};
	}
	async ready() {
		return new Promise((e) => {
			let t = this.onReady((n, r) => {
				t(), e({
					cesium: n,
					viewer: r
				});
			});
		});
	}
	getCesium() {
		return this.cesiumInstance;
	}
	getViewer() {
		return this.viewerInstance;
	}
	reset() {
		this.isReady = !1, this.cesiumInstance = null, this.viewerInstance = null, this.listeners.clear(), this.stopPolling();
	}
	destroy() {
		this.stopPolling(), this.removeGlobalListener(), this.listeners.clear(), this.isReady = !1, this.cesiumInstance = null, this.viewerInstance = null;
	}
}, E = typeof window < "u" && window.__cesiumEventManager__, D = E || new T();
!E && typeof window < "u" && (window.__cesiumEventManager__ = D, document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	D.init();
}) : D.init());
//#endregion
//#region \0plugin-vue:export-helper
var O = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, ee = {
	name: "SfcBase",
	props: {
		onClose: {
			type: Function,
			default: null
		},
		panelInstanceId: {
			type: Number,
			default: null
		}
	},
	inject: { instanceId: { default: 1 } },
	data() {
		return {
			cesiumReady: !1,
			componentName: "SfcBase",
			boundEventHandlers: {},
			cesiumUnsubscribe: null
		};
	},
	computed: {
		isSingleton() {
			return this.panelInstanceId === null || this.panelInstanceId === void 0;
		},
		isMultiInstance() {
			return !this.isSingleton;
		},
		panelInstanceKey() {
			return this.isSingleton ? this.effectiveRegistrationKey || this.componentName : `${this.effectiveRegistrationKey || this.componentName}_${this.panelInstanceId}`;
		}
	},
	methods: {
		checkCesiumReady() {
			return typeof window < "u" && window.Cesium !== void 0 && window.__cesiumViewer__ ? (this.cesiumReady = !0, this.$logger?.info?.("[SfcBase] Cesium 已就绪"), !0) : !1;
		},
		waitForCesium(e, t = 5e3) {
			if (this.cesiumUnsubscribe &&= (this.cesiumUnsubscribe(), null), this.checkCesiumReady()) {
				e && typeof e == "function" && e();
				return;
			}
			let n = null;
			t > 0 && (n = setTimeout(() => {
				this.cesiumUnsubscribe &&= (this.cesiumUnsubscribe(), null), this.$logger?.warn?.(`[${this.componentName}] Cesium 初始化超时 (${t}ms)`);
			}, t)), this.cesiumUnsubscribe = D.onReady((t, r) => {
				n &&= (clearTimeout(n), null), this.cesiumReady = !0, this.$logger?.info?.(`[${this.componentName}] Cesium 已就绪（事件驱动）`), e && typeof e == "function" && e(t, r);
			});
		},
		getCesiumViewer() {
			return this.checkCesiumReady() ? window.__cesiumViewer__ : (this.$logger?.warn?.(`[${this.componentName}] Cesium 未就绪，无法获取 Viewer`), null);
		},
		getCesium() {
			return typeof window < "u" && window.Cesium !== void 0 ? window.Cesium : (this.$logger?.warn?.(`[${this.componentName}] Cesium 全局对象不存在`), null);
		},
		isValidCoordinate(e, t, n) {
			return typeof e == "number" && !isNaN(e) && e >= t && e <= n;
		},
		validateLonLat(e, t, n = null) {
			return this.isValidCoordinate(e, -180, 180) ? this.isValidCoordinate(t, -90, 90) ? n !== null && !this.isValidCoordinate(n, -1e3, 1e5) ? {
				valid: !1,
				message: "高度必须在合理范围内"
			} : {
				valid: !0,
				message: "坐标有效"
			} : {
				valid: !1,
				message: "纬度必须在 -90 到 90 之间"
			} : {
				valid: !1,
				message: "经度必须在 -180 到 180 之间"
			};
		},
		showMessage(e, t = "info", n = 3e3) {
			this.$logger?.info?.(`[${this.componentName}] ${t.toUpperCase()}: ${e}`), this.messageContent !== void 0 && (this.messageContent = e), this.messageType !== void 0 && (this.messageType = t), n > 0 && typeof this.clearMessage == "function" && setTimeout(() => this.clearMessage(), n);
		},
		clearMessage() {
			this.messageContent !== void 0 && (this.messageContent = "");
		},
		handleClose() {
			if (typeof window < "u") {
				let e = new CustomEvent(this.closeEventName, { detail: {
					componentName: this.componentName,
					instanceId: this.instanceId
				} });
				window.dispatchEvent(e), this.onClose && typeof this.onClose == "function" && this.onClose(), this.$logger?.info?.(`[${this.componentName}] 关闭事件已触发`);
			}
		},
		bindEventHandler(e, t) {
			if (typeof t != "function") return this.$logger?.warn?.(`[${this.componentName}] 事件处理器必须是函数`), null;
			let n = t.bind(this);
			return this.boundEventHandlers[e] = n, n;
		},
		getBoundHandler(e) {
			return this.boundEventHandlers[e] || null;
		},
		clearBoundHandlers() {
			this.boundEventHandlers = {};
		},
		flyToPosition(e, t, n, r = {}, i = 2) {
			return new Promise((a, o) => {
				let s = this.getCesiumViewer();
				if (!s) {
					o(/* @__PURE__ */ Error("Cesium Viewer 不可用"));
					return;
				}
				let c = this.getCesium();
				if (!c) {
					o(/* @__PURE__ */ Error("Cesium 全局对象不可用"));
					return;
				}
				try {
					let l = c.Cartesian3.fromDegrees(e, t, n), u = {
						heading: c.Math.toRadians(0),
						pitch: c.Math.toRadians(-45),
						roll: 0
					};
					s.camera.flyTo({
						destination: l,
						orientation: {
							...u,
							...r
						},
						duration: i,
						complete: () => a(),
						cancel: () => o(/* @__PURE__ */ Error("飞行操作被取消"))
					});
				} catch (e) {
					o(e);
				}
			});
		},
		viewGround(e, t, n = 0) {
			return this.flyToPosition(e, t, n, {
				heading: 0,
				pitch: -90,
				roll: 0
			}, 1.5);
		},
		createLogger() {
			let e = `[${this.componentName}]`;
			return {
				info: (t) => console.log(`${e} ${t}`),
				warn: (t) => console.warn(`${e} ⚠️ ${t}`),
				error: (t) => console.error(`${e} ❌ ${t}`),
				debug: (t) => console.debug(`${e} 🔍 ${t}`)
			};
		},
		initCesium(e) {
			this.$logger = this.createLogger(), this.$logger?.info?.("组件初始化"), this.checkCesiumReady() ? (this.cesiumReady = !0, e && e()) : (this.$logger?.info?.("等待 Cesium 初始化（事件驱动）..."), this.waitForCesium((t, n) => {
				this.$logger?.info?.("Cesium 已就绪"), e && e(t, n);
			}));
		},
		cleanup() {
			this.cesiumUnsubscribe &&= (this.cesiumUnsubscribe(), null), this.clearBoundHandlers(), this.$logger?.info?.("资源已清理");
		}
	},
	mounted() {},
	beforeUnmount() {
		this.cleanup();
	}
}, te = {
	class: "sfc-base",
	style: { display: "none" }
};
function ne(e, t, n, r, i, o) {
	return p(), a("div", te);
}
var k = /*#__PURE__*/ O(ee, [["render", ne]]), A = class {
	constructor() {
		this.panelStates = /* @__PURE__ */ new Map(), this.cesiumObjects = /* @__PURE__ */ new Map(), this.panelVisibility = /* @__PURE__ */ new Map(), this.panelRegistry = /* @__PURE__ */ new Map(), this.eventListeners = /* @__PURE__ */ new Map(), this.mjsContainers = /* @__PURE__ */ new Map(), console.log("[PanelSingletonManager] 初始化完成");
	}
	savePanelState(e, t = {}) {
		let n = {};
		t.cesiumTilesets !== void 0 && (n.cesiumTilesets = new Map(t.cesiumTilesets)), t.cesiumTransforms !== void 0 && (n.cesiumTransforms = new Map(t.cesiumTransforms)), t.cesiumHeightOffsets !== void 0 && (n.cesiumHeightOffsets = new Map(t.cesiumHeightOffsets)), t.cesiumErrorHandlers !== void 0 && (n.cesiumErrorHandlers = new Map(t.cesiumErrorHandlers)), t.obliquePhotographyList !== void 0 && (n.obliquePhotographyList = t.obliquePhotographyList), t.configList !== void 0 && (n.configList = t.configList), t.cesiumObjects !== void 0 && (n.cesiumObjects = t.cesiumObjects), n.timestamp = t.timestamp === void 0 ? Date.now() : t.timestamp, this.panelStates.set(e, n), console.log(`[PanelSingletonManager] 💾 保存面板状态: ${e}`, {
			tilesets: n.cesiumTilesets?.size || 0,
			transforms: n.cesiumTransforms?.size || 0,
			items: n.obliquePhotographyList?.length || 0,
			configList: n.configList?.length || 0,
			cesiumObjects: n.cesiumObjects ? "存在" : "不存在",
			时间: new Date(n.timestamp).toLocaleTimeString()
		}), typeof window < "u" && (window.__panelSingletonManager__ || (window.__panelSingletonManager__ = this), window.panelSingletonManager || (window.panelSingletonManager = this));
	}
	getPanelState(e) {
		let t = this.panelStates.get(e);
		return t ? (console.log(`[PanelSingletonManager] 📦 获取面板状态: ${e}`, {
			tilesets: t.cesiumTilesets?.size || 0,
			transforms: t.cesiumTransforms?.size || 0,
			items: t.obliquePhotographyList?.length || 0,
			configList: t.configList?.length || 0,
			cesiumObjects: t.cesiumObjects ? "存在" : "不存在",
			时间: new Date(t.timestamp).toLocaleTimeString()
		}), t) : (console.log(`[PanelSingletonManager] ⚠️ 面板 ${e} 没有保存的状态`), null);
	}
	clearPanelState(e) {
		let t = this.panelStates.get(e);
		if (!t) {
			console.warn(`[PanelSingletonManager] ⚠️ 面板 ${e} 没有需要清除的状态`);
			return;
		}
		t.cesiumErrorHandlers && t.cesiumErrorHandlers.forEach((e, t) => {
			e && e.tileset && e.tileset.tileFailed && e.tileset.tileFailed.removeEventListener(e.errorHandler);
		}), this.panelStates.delete(e), console.log(`[PanelSingletonManager] 🗑️ 清除面板状态: ${e}`);
	}
	saveCesiumObject(e, t, n, r, i, a) {
		let o = this.cesiumObjects.get(e);
		o || (o = /* @__PURE__ */ new Map(), this.cesiumObjects.set(e, o)), o.set(t, {
			tileset: n,
			transform: r,
			heightOffset: i,
			errorHandler: a
		}), console.log(`[PanelSingletonManager] 📦 保存 Cesium 对象: ${e}/${t}`);
	}
	getCesiumObject(e, t) {
		let n = this.cesiumObjects.get(e);
		return n && n.get(t) || null;
	}
	setPanelVisible(e, t) {
		this.updatePanelVisible(e, t);
	}
	hasPanelState(e) {
		return this.panelStates.has(e);
	}
	getAllPanelNames() {
		return Array.from(this.panelStates.keys());
	}
	getStats() {
		return {
			面板数: this.panelStates.size,
			Cesium对象数: this.cesiumObjects.size,
			面板列表: this.getAllPanelNames()
		};
	}
	clearAll() {
		this.panelStates.forEach((e, t) => {
			e.cesiumErrorHandlers.forEach((e, t) => {
				e && e.tileset && e.tileset.tileFailed && e.tileset.tileFailed.removeEventListener(e.errorHandler);
			});
		}), this.panelStates.clear(), this.cesiumObjects.clear(), this.panelVisibility.clear(), console.log("[PanelSingletonManager] 🗑️ 清除所有面板状态");
	}
	registerPanel(e, t) {
		let n = this.panelRegistry.get(e), r = t.visible === !0, i = !r, a = !1;
		t.visible === !0 || t.visible === !1 ? (a = !0, console.log(`[PanelSingletonManager] 🎯 config.visible 是明确的布尔值: ${t.visible}，设置 _visibilityExplicitlySet = true`)) : n?._visibilityExplicitlySet && (a = !0, console.log("[PanelSingletonManager] 🔄 保留现有的 _visibilityExplicitlySet 标志")), this.panelRegistry.set(e, {
			component: t.component,
			props: t.props || {},
			visible: r,
			isClosed: i,
			_visibilityExplicitlySet: a
		}), console.log(`[PanelSingletonManager] ✅ 注册面板: ${e}`, {
			visible: r,
			isClosed: i,
			hasComponent: !!t.component,
			visibilityExplicitlySet: a
		});
	}
	unregisterPanel(e) {
		let t = this.panelRegistry.delete(e);
		return t ? console.log(`[PanelSingletonManager] 🗑️ 注销面板: ${e}`) : console.warn(`[PanelSingletonManager] ⚠️ 面板 ${e} 未注册`), t;
	}
	getPanel(e) {
		return this.panelRegistry.get(e) || null;
	}
	hasPanel(e) {
		return this.panelRegistry.has(e) || this.mjsContainers.has(e);
	}
	getAllPanels() {
		return Array.from(this.panelRegistry.entries()).map(([e, t]) => ({
			name: e,
			...t
		}));
	}
	updatePanelVisible(e, t) {
		if (this.isMjsContainer(e)) {
			this.updateMjsContainerVisible(e, t), this.emitEvent(e, {
				type: "visibleChange",
				panelName: e,
				visible: t,
				isClosed: !t
			});
			return;
		}
		let n = this.panelRegistry.get(e);
		n ? (n.visible = t, n._visibilityExplicitlySet = !0, t ? n.isClosed = !1 : n.isClosed = !0, console.log(`[PanelSingletonManager] 🔄 更新面板可见性: ${e} = ${t}, isClosed = ${n.isClosed}`), this.emitEvent(e, {
			type: "visibleChange",
			panelName: e,
			visible: t,
			isClosed: n.isClosed
		})) : console.warn(`[PanelSingletonManager] ⚠️ 面板 ${e} 未注册，无法更新可见性`);
	}
	getPanelVisible(e) {
		let t = this.panelRegistry.get(e);
		return t ? t.visible : null;
	}
	setPanelClosed(e, t) {
		let n = this.panelRegistry.get(e);
		n && (n.isClosed = t, t && (n.visible = !1), console.log(`[PanelSingletonManager] 🔒 设置面板关闭状态: ${e} = ${t}`));
	}
	getPanelClosed(e) {
		let t = this.panelRegistry.get(e);
		return t ? t.isClosed : null;
	}
	getRegistryStats() {
		return {
			已注册面板数: this.panelRegistry.size,
			可见面板数: Array.from(this.panelRegistry.values()).filter((e) => e.visible).length,
			关闭面板数: Array.from(this.panelRegistry.values()).filter((e) => e.isClosed).count
		};
	}
	clearRegistry() {
		this.panelRegistry.clear(), console.log("[PanelSingletonManager] 🗑️ 清空面板注册表");
	}
	getMjsContainerId(e) {
		return e === "DualCanvasViewer" ? "dualCanvasContainer" : `${e}Container`;
	}
	getIifeGlobalVarName(e) {
		return e === "DualCanvasViewer" ? "DualCanvasViewerPlugin" : e;
	}
	registerMjsContainer(e, t = {}) {
		let n = t.containerId || this.getMjsContainerId(e), r = t.iifeGlobalVar || this.getIifeGlobalVarName(e);
		this.mjsContainers.set(e, {
			containerId: n,
			iifeGlobalVar: r,
			visible: t.visible !== !1,
			isClosed: t.visible === !1
		}), console.log(`[PanelSingletonManager] ✅ 注册 mjs 容器: ${e}`, {
			containerId: n,
			iifeGlobalVar: r
		});
		let i = t.visible !== !1;
		this.updateMjsContainerVisible(e, i);
	}
	unregisterMjsContainer(e) {
		let t = this.mjsContainers.delete(e);
		return t ? console.log(`[PanelSingletonManager] 🗑️ 注销 mjs 容器: ${e}`) : console.warn(`[PanelSingletonManager] ⚠️ mjs 容器未注册: ${e}`), t;
	}
	updateMjsContainerVisible(e, t) {
		let n = this.mjsContainers.get(e);
		if (!n) {
			console.warn(`[PanelSingletonManager] ⚠️ mjs 容器未注册: ${e}`);
			return;
		}
		console.log(`[PanelSingletonManager] 🔍 查找容器: ${e}`, {
			containerId: n.containerId,
			iifeGlobalVar: n.iifeGlobalVar,
			当前可见性: n.visible
		});
		let r = document.getElementById(n.containerId);
		if (!r) {
			console.error(`[PanelSingletonManager] ❌ 容器未找到: ${n.containerId}`), console.log("[PanelSingletonManager] 🔍 当前页面所有包含 'dual' 的容器:", Array.from(document.querySelectorAll("[id*=\"dual\"], [class*=\"dual\"]")).map((e) => ({
				id: e.id,
				class: e.className,
				display: window.getComputedStyle(e).display
			})));
			return;
		}
		if (!r) {
			console.warn(`[PanelSingletonManager] ⚠️ mjs 容器 DOM 不存在: ${n.containerId}`);
			return;
		}
		let i = r.classList.contains("hidden");
		t ? r.classList.remove("hidden") : r.classList.add("hidden"), n.visible = t, n.isClosed = !t, console.log(`[PanelSingletonManager] 🔄 更新 mjs 容器可见性: ${e}, visible: ${t}, hidden: ${i} -> ${r.classList.contains("hidden")}, container:`, r), t && r.classList.contains("hidden") && console.error(`[PanelSingletonManager] ❌ 尝试显示容器但仍有 hidden 类: ${e}`);
	}
	getMjsContainer(e) {
		return this.mjsContainers.get(e) || null;
	}
	isMjsContainer(e) {
		return this.mjsContainers.has(e);
	}
	getAllMjsContainers() {
		return Array.from(this.mjsContainers.entries()).map(([e, t]) => ({
			name: e,
			...t
		}));
	}
	addEventListener(e, t) {
		this.eventListeners.has(e) || this.eventListeners.set(e, /* @__PURE__ */ new Set()), this.eventListeners.get(e).add(t), console.log(`[PanelSingletonManager] 📝 添加事件监听器: ${e}`);
	}
	removeEventListener(e, t) {
		this.eventListeners.has(e) && (this.eventListeners.get(e).delete(t), console.log(`[PanelSingletonManager] 🗑️ 移除事件监听器: ${e}`));
	}
	emitEvent(e, t) {
		this.eventListeners.has(e) && this.eventListeners.get(e).forEach((n) => {
			try {
				n(t);
			} catch (t) {
				console.error(`[PanelSingletonManager] ❌ 事件监听器执行错误: ${e}`, t);
			}
		});
	}
}, j = typeof window < "u" && (window.__panelSingletonManager__ || window.panelSingletonManager), M = j || new A();
!j && typeof window < "u" && (window.__panelSingletonManager__ = M, window.panelSingletonManager = M);
//#endregion
//#region ../../GISBIM/cesiumBase/src/components/FunctionPanelUIBase.vue
var N = typeof window < "u" && window.__panelSingletonManager__ || M, re = {
	name: "FunctionPanelUIBase",
	mixins: [k],
	emits: [
		"close",
		"minimize",
		"expand",
		"lazy-load",
		"register-panel",
		"unregister-panel"
	],
	inject: {
		registerPanelComponent: {
			type: Function,
			default: null
		},
		unregisterPanelComponent: {
			type: Function,
			default: null
		},
		getRegisteredPanels: {
			type: Function,
			default: null
		},
		setPanelVisible: {
			type: Function,
			default: null
		},
		getInstanceId: {
			type: Function,
			default: () => 1
		},
		multiInstanceManager: {
			type: Object,
			default: null
		},
		registerPanelInstance: {
			type: Function,
			default: null
		},
		unregisterPanelInstance: {
			type: Function,
			default: null
		},
		setPanelInstanceVisible: {
			type: Function,
			default: null
		}
	},
	props: {
		autoRegister: {
			type: Boolean,
			default: !1
		},
		registrationKey: {
			type: String,
			default: null
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		title: {
			type: String,
			default: "面板"
		},
		titleIcon: {
			type: String,
			default: "⚙️"
		},
		closeTooltip: {
			type: String,
			default: "关闭 (ESC)"
		},
		width: {
			type: Number,
			default: 360
		},
		height: {
			type: [Number, String],
			default: "auto"
		},
		maxHeight: {
			type: [Number, String],
			default: "70vh"
		},
		initialX: {
			type: [Number, String],
			default: "center"
		},
		initialY: {
			type: Number,
			default: 80
		},
		bodyPadding: {
			type: String,
			default: "20px"
		},
		allowMinimize: {
			type: Boolean,
			default: !0
		},
		closeEventName: {
			type: String,
			default: "functionPanelClose"
		},
		enableBlur: {
			type: Boolean,
			default: !1
		},
		blurAmount: {
			type: String,
			default: "8px"
		},
		enableBackdropFilter: {
			type: Boolean,
			default: !1
		},
		lazyLoad: {
			type: Boolean,
			default: !1
		}
	},
	data() {
		return {
			componentName: "FunctionPanelUIBase",
			_registryRegistered: !1,
			x: 0,
			y: 0,
			isDragging: !1,
			dragOffsetX: 0,
			dragOffsetY: 0,
			isMinimized: !1,
			isClosed: !0,
			_contentLoaded: !1,
			boundMouseMove: null,
			boundMouseUp: null,
			cachedPanelWidth: null,
			cachedPanelHeight: null
		};
	},
	computed: {
		effectiveRegistrationKey() {
			return this.registrationKey || this.componentName;
		},
		isSingletonByConfig() {
			if (typeof window < "u" && window.__functionPanelsConfig__) {
				let e = window.__functionPanelsConfig__.panels.find((e) => e.name === this.effectiveRegistrationKey);
				return e ? e.singleton !== !1 : !0;
			}
			return this.panelInstanceId === null || this.panelInstanceId === void 0;
		},
		panelStyles() {
			let e = {
				width: typeof this.width == "number" ? `${this.width}px` : this.width,
				height: typeof this.height == "number" ? `${this.height}px` : this.height,
				maxHeight: typeof this.maxHeight == "number" ? `${this.maxHeight}px` : this.maxHeight,
				transform: `translate(${this.x}px, ${this.y}px)`,
				transition: this.isDragging ? "none" : "transform 0.2s ease-out, opacity 0.3s ease"
			};
			return (this.panelInstanceId === 1 || this.panelInstanceId === 2) && console.log(`[FunctionPanelUIBase] 🎨 面板样式: ${this.effectiveRegistrationKey} #${this.panelInstanceId || "singleton"}`, {
				...e,
				isClosed: this.isClosed,
				x: this.x,
				y: this.y
			}), e;
		},
		bodyStyles() {
			return { padding: this.bodyPadding };
		},
		fabStyles() {
			return { transform: `translate(${this.x + this.width / 2 - 40}px, ${this.y}px)` };
		}
	},
	watch: { isClosed(e, t) {
		console.log(`[FunctionPanelUIBase] 🔄 isClosed 状态变化: ${this.effectiveRegistrationKey}`, {
			oldVal: t,
			newVal: e,
			panelRefExists: !!this.$refs.panelRef
		}), t === !0 && e === !1 && (console.log("[FunctionPanelUIBase] ✅ 面板从关闭变为打开，初始化位置"), this.$nextTick(() => {
			this.$nextTick(() => {
				this.initPosition();
			});
		}));
	} },
	mounted() {
		console.log("[FunctionPanelUIBase] 🔍 接收到的 props:", {
			panelName: this.componentName || this.effectiveRegistrationKey,
			所有Props: {
				autoRegister: this.autoRegister,
				registrationKey: this.registrationKey,
				panelInstanceId: this.panelInstanceId,
				componentName: this.componentName,
				title: this.title,
				initialX: this.initialX,
				initialY: this.initialY,
				registrationKey_value: this.registrationKey,
				effectiveRegistrationKey: this.effectiveRegistrationKey
			}
		}), this.autoRegister && this.effectiveRegistrationKey && !this._registryRegistered && this.registerToParent();
		let e = this.panelInstanceId != null;
		if (console.log("[FunctionPanelUIBase] 🔍 多实例面板检查:", {
			panelName: this.effectiveRegistrationKey,
			panelInstanceId: this.panelInstanceId,
			isMultiInstance: e,
			typeofPanelInstanceId: typeof this.panelInstanceId
		}), e) {
			let e = this.isClosed;
			this.isClosed = !1, console.log(`[FunctionPanelUIBase] ✅ 多实例面板默认显示: ${this.effectiveRegistrationKey} #${this.panelInstanceId}, isClosed: ${e} -> ${this.isClosed}`);
		} else {
			let e = this.effectiveRegistrationKey;
			if (N.hasPanel(e)) {
				let t = N.getPanel(e);
				if (t) {
					let n = this.isClosed;
					this.isClosed = t.isClosed, console.log(`[FunctionPanelUIBase] 🔓 从 PanelSingletonManager 同步面板状态: ${e}, isClosed: ${n} -> ${this.isClosed}`), t.visible && this.isClosed && (console.log(`[FunctionPanelUIBase] ⚠️ 发现状态不一致: visible=${t.visible} 但 isClosed=${this.isClosed}，强制修正`), this.isClosed = !1, console.log("[FunctionPanelUIBase] ✅ 强制修正 isClosed: true -> false"));
				}
			} else {
				let t = this.isClosed, n = this.getInstanceConfig(), r = n ? n.visible !== !1 : !0;
				this.isClosed = !r, console.log(`[FunctionPanelUIBase] 🆕 面板首次创建，根据配置设置 isClosed: ${e}, ${t} -> ${this.isClosed} (visible=${r})`);
			}
		}
		e || (this._panelStateChangeListener = (e) => {
			let t = this.effectiveRegistrationKey;
			if (e.panelName === t && (console.log(`[FunctionPanelUIBase] 🔔 监听到 PanelSingletonManager 事件: ${t}`, e), e.type === "visibleChange")) {
				let n = this.isClosed;
				this.isClosed = e.isClosed, console.log(`[FunctionPanelUIBase] 🔄 更新 isClosed 状态: ${n} -> ${this.isClosed}`), console.log(`[FunctionPanelUIBase] 🔍 延迟加载检查: oldIsClosed=${n}, !this.isClosed=${!this.isClosed}, this.lazyLoad=${this.lazyLoad}, !this._contentLoaded=${!this._contentLoaded}`), n && !this.isClosed ? (this.$forceUpdate(), console.log(`[FunctionPanelUIBase] ✅ 强制重新渲染面板: ${t}`), this.lazyLoad && !this._contentLoaded ? (console.log(`[FunctionPanelUIBase] ⚡ 触发延迟加载: ${t}`), this._contentLoaded = !0, this.$nextTick(() => {
					console.log("[FunctionPanelUIBase] 📤 发送 lazy-load 事件"), this.$emit("lazy-load", { firstOpen: !0 });
				})) : console.log(`[FunctionPanelUIBase] ⏭️ 跳过延迟加载: lazyLoad=${this.lazyLoad}, _contentLoaded=${this._contentLoaded}`)) : console.log("[FunctionPanelUIBase] ⏭️ 不触发延迟加载: 状态不是从关闭变为打开");
			}
		}, N.addEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener)), !this.isClosed && this.lazyLoad && !this._contentLoaded && (console.log(`[FunctionPanelUIBase] 🔍 面板初始状态为打开，触发延迟加载: ${this.effectiveRegistrationKey}`), this._contentLoaded = !0, this.$nextTick(() => {
			console.log("[FunctionPanelUIBase] 📤 发送 lazy-load 事件（初始状态）"), this.$emit("lazy-load", { firstOpen: !0 });
		})), this.initCesium(() => {
			this.$nextTick(() => {
				this.$nextTick(() => {
					this.initPosition();
				});
			});
		}), this.boundHandleKeydown = this.handleKeydown.bind(this), document.addEventListener("keydown", this.boundHandleKeydown);
	},
	beforeUnmount() {
		this.autoRegister && this.effectiveRegistrationKey && this.unregisterFromParent(), this.boundMouseMove && (document.removeEventListener("mousemove", this.boundMouseMove), document.removeEventListener("mouseup", this.boundHandleMouseUp)), this.boundHandleKeydown && document.removeEventListener("keydown", this.boundHandleKeydown), this.panelInstanceId === null && this._panelStateChangeListener && N.removeEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener), this.cleanup();
	},
	methods: {
		getInstanceConfig() {
			if (this.panelInstanceId !== null) {
				if (typeof window < "u" && window.__multiInstancePanelConfigManager__) return window.__multiInstancePanelConfigManager__.getPanelConfig(this.instanceId, this.registrationKey);
			} else if (typeof window < "u" && window.__functionPanelsConfigManager__) return window.__functionPanelsConfigManager__.getPanel(this.effectiveRegistrationKey);
			return null;
		},
		registerToParent() {
			if (!this.effectiveRegistrationKey) {
				console.warn("[FunctionPanelUIBase] 缺少 registrationKey 和 componentName，无法自动注册");
				return;
			}
			let e = this.panelInstanceId !== null;
			if (e && this.registerPanelInstance && typeof this.registerPanelInstance == "function") {
				if (typeof window < "u" && window.__multiInstancePanelConfigManager__) {
					let e = this.instanceId || 1;
					if (window.__multiInstancePanelConfigManager__.getPanelInstance(e, this.effectiveRegistrationKey, this.panelInstanceId)) {
						console.log(`[FunctionPanelUIBase #${e}] ${this.effectiveRegistrationKey} #${this.panelInstanceId} 实例已存在，跳过重复注册`), this._registryRegistered = !0;
						return;
					}
				}
				let e = this.getInstanceConfig(), t = {
					...this.$props,
					...e?.position || {}
				};
				this.registerPanelInstance(this.effectiveRegistrationKey, {
					component: this,
					props: t,
					visible: !0
				}, this.panelInstanceId), this._registryRegistered = !0, console.log(`[FunctionPanelUIBase #${this.instanceId}] ${this.effectiveRegistrationKey} 多实例注册完成`);
				return;
			}
			if (!e && this.registerPanelComponent && typeof this.registerPanelComponent == "function") {
				let e = this.getInstanceConfig(), t = {
					...this.$props,
					...e?.position || {}
				}, n = !1;
				if (N) {
					let t = N.getPanel(this.effectiveRegistrationKey);
					console.log(`[FunctionPanelUIBase] 🔍 检查面板 ${this.effectiveRegistrationKey}:`, {
						existingPanel: t ? {
							visible: t.visible,
							isClosed: t.isClosed,
							_visibilityExplicitlySet: t._visibilityExplicitlySet
						} : null,
						instanceConfig: e ? { visible: e.visible } : null
					}), t && t._visibilityExplicitlySet ? (n = t.visible, console.log(`[FunctionPanelUIBase] 🎯 使用管理器中的可见性状态: ${n} (用户已设置)`)) : t && t.visible === !0 ? (n = !0, console.log("[FunctionPanelUIBase] 🎯 保持现有的 visible: true")) : (n = e ? e.visible !== !1 : !1, console.log(`[FunctionPanelUIBase] 📋 使用实例配置可见性: ${n}`));
				} else n = e ? e.visible !== !1 : !1, console.log(`[FunctionPanelUIBase] ⚠️ 管理器不存在，使用实例配置: ${n}`);
				this.registerPanelComponent(this.effectiveRegistrationKey, {
					props: t,
					visible: n
				}), this._registryRegistered = !0, console.log(`[FunctionPanelUIBase #${this.instanceId}] ${this.effectiveRegistrationKey} 单例注册完成, visible: ${n}`);
				return;
			}
			let t = {
				key: this.effectiveRegistrationKey,
				props: this.$props
			};
			e && (t.component = this), this.$emit("register-panel", t), this._registryRegistered = !0, console.log(`[FunctionPanelUIBase #${this.instanceId}] ${this.registrationKey} 已通过事件${e ? "（多实例）" : ""}注册`);
		},
		unregisterFromParent() {
			if (this.effectiveRegistrationKey) {
				if (this.unregisterPanelComponent && typeof this.unregisterPanelComponent == "function") {
					this.unregisterPanelComponent(this.effectiveRegistrationKey), console.log(`[FunctionPanelUIBase] ${this.effectiveRegistrationKey} 已通过 inject 注销`);
					return;
				}
				this.$emit("unregister-panel", { key: this.effectiveRegistrationKey }), console.log(`[FunctionPanelUIBase] ${this.effectiveRegistrationKey} 已通过事件注销`);
			}
		},
		initPosition(e = 0) {
			let t = this.$refs.panelRef, n = !!t, r = this.isClosed;
			if (console.log(`[FunctionPanelUIBase] 🔧 初始化面板位置: ${this.effectiveRegistrationKey} #${this.panelInstanceId || "singleton"}`, {
				initialX: this.initialX,
				initialY: this.initialY,
				currentX: this.x,
				currentY: this.y,
				panelRef: n,
				panelRefElement: t ? t.tagName : "N/A",
				isClosed: r,
				windowInnerWidth: window.innerWidth,
				windowInnerHeight: window.innerHeight,
				panelWidth: this.width,
				retryCount: e
			}), r) {
				console.log("[FunctionPanelUIBase] ⏸️ 面板已关闭，跳过位置初始化，等待面板打开");
				return;
			}
			if (!n) {
				if (e >= 10) {
					console.error(`[FunctionPanelUIBase] ❌ panelRef 初始化超时，放弃初始化位置: ${this.effectiveRegistrationKey}`);
					return;
				}
				console.warn(`[FunctionPanelUIBase] ⚠️ panelRef 还不存在，延迟初始化位置（重试 ${e + 1}/10）`), setTimeout(() => {
					this.initPosition(e + 1);
				}, 100);
				return;
			}
			let i = this.initialX;
			if (i === "center") {
				let e = this.$refs.panelRef, t = e ? e.offsetWidth : this.width;
				i = Math.round((window.innerWidth - t) / 2), console.log("[FunctionPanelUIBase] 📍 居中计算:", {
					panelWidth: t,
					calculatedX: i
				});
			} else if (i === "right") {
				let e = this.$refs.panelRef, t = e ? e.offsetWidth : this.width, n = Math.max(20, t / 2);
				i = Math.round(window.innerWidth - t - n), console.log("[FunctionPanelUIBase] 📍 右侧对齐计算:", {
					panelWidth: t,
					windowInnerWidth: window.innerWidth,
					rightMargin: n,
					calculatedX: i
				});
			} else typeof i != "number" && (i = 20, console.log("[FunctionPanelUIBase] 📍 使用默认 x 值: 20"));
			let a = window.innerWidth - this.width - 20;
			i = Math.max(20, Math.min(i, a)), this.x = i, this.y = Math.max(20, Math.min(this.initialY, window.innerHeight - 100)), console.log(`[FunctionPanelUIBase] ✅ 面板位置已设置: ${this.effectiveRegistrationKey} #${this.panelInstanceId || "singleton"}`, {
				x: this.x,
				y: this.y,
				transform: `translate(${this.x}px, ${this.y}px)`
			});
		},
		onHeaderMouseDown(e) {
			e.button === 0 && (e.target.closest(".icon-btn") || (e.preventDefault(), this.startDrag(e)));
		},
		onPanelMouseDown(e) {},
		startDrag(e) {
			this.isDragging = !0;
			let t = this.$refs.panelRef.getBoundingClientRect();
			this.dragOffsetX = e.clientX - t.left, this.dragOffsetY = e.clientY - t.top, this.cachedPanelWidth = t.width, this.cachedPanelHeight = t.height, this.boundMouseMove = this.onMouseMove.bind(this), this.boundHandleMouseUp = this.onMouseUp.bind(this), document.addEventListener("mousemove", this.boundMouseMove), document.addEventListener("mouseup", this.boundHandleMouseUp), document.body.style.userSelect = "none", document.body.style.cursor = "grabbing";
		},
		onMouseMove(e) {
			if (!this.isDragging) return;
			let t = e.clientX - this.dragOffsetX, n = e.clientY - this.dragOffsetY, r = this.cachedPanelWidth || this.width;
			this.cachedPanelHeight;
			let i = -r + 40, a = window.innerWidth - 40;
			t = Math.max(i, Math.min(t, a));
			let o = window.innerHeight - 60;
			n = Math.max(0, Math.min(n, o)), this.x = Math.round(t), this.y = Math.round(n);
		},
		onMouseUp() {
			this.isDragging && (this.isDragging = !1, this.boundMouseMove && (document.removeEventListener("mousemove", this.boundMouseMove), document.removeEventListener("mouseup", this.boundHandleMouseUp), this.boundMouseMove = null, this.boundHandleMouseUp = null), document.body.style.userSelect = "", document.body.style.cursor = "", this.snapToEdge());
		},
		snapToEdge() {
			let e = this.$refs.panelRef;
			if (!e) return;
			let t = e.getBoundingClientRect(), n = !1;
			Math.abs(t.left) < 30 && t.left >= -20 ? (this.x = 0, n = !0) : Math.abs(t.right - window.innerWidth) < 30 && (this.x = window.innerWidth - (this.cachedPanelWidth || t.width), n = !0), t.top < 30 && t.top >= -20 && (this.y = 0, n = !0), n && setTimeout(() => {
				this.$refs.panelRef?.classList.add("snapped"), setTimeout(() => {
					this.$refs.panelRef?.classList.remove("snapped");
				}, 300);
			}, 0), this.cachedPanelWidth = null, this.cachedPanelHeight = null;
		},
		toggleMinimize() {
			this.isMinimized = !this.isMinimized, this.$emit(this.isMinimized ? "minimize" : "expand");
		},
		close() {
			let e = this.panelInstanceId || null, t = this.autoRegister && this.registrationKey && !e, n = !t && e !== null;
			if (t) {
				if (console.log(`[FunctionPanelUIBase] 🔄 面板假关闭（单例模式）: ${this.effectiveRegistrationKey}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup(), N.updatePanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已通过 PanelSingletonManager 更新面板 ${this.effectiveRegistrationKey} 可见性为 false`), this.setPanelVisible && typeof this.setPanelVisible == "function") this.setPanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已设置面板 ${this.effectiveRegistrationKey} 可见性为 false`);
				else if (this.getRegisteredPanels && typeof this.getRegisteredPanels == "function") {
					let e = this.getRegisteredPanels();
					e && e[this.effectiveRegistrationKey] && (e[this.effectiveRegistrationKey].visible = !1, console.log(`[FunctionPanelUIBase] ✅ 已设置面板 ${this.effectiveRegistrationKey} 可见性为 false（直接修改）`));
				}
				if (typeof window < "u") {
					let e = new CustomEvent(`${this.closeEventName}FakeClose`, { detail: {
						componentName: this.componentName,
						registrationKey: this.effectiveRegistrationKey,
						preserveData: !0
					} });
					window.dispatchEvent(e);
				}
				setTimeout(() => {
					if (this.$emit("close", { preserveData: !0 }), typeof window < "u") {
						let e = new CustomEvent(this.closeEventName, { detail: { componentName: this.componentName } });
						window.dispatchEvent(e);
					}
					this.onClose && typeof this.onClose == "function" && this.onClose();
				}, 300);
			} else if (n) {
				console.log(`[FunctionPanelUIBase] 🗑️ 多实例面板注销: ${this.effectiveRegistrationKey} #${e}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup();
				let t = `${this.effectiveRegistrationKey}_${e}`;
				if (console.log(`[FunctionPanelUIBase] 🎯 多实例面板关闭，panelKey: ${t}`), typeof window < "u" && window.__multiInstancePanelConfigManager__) {
					let t = this.instanceId || 1;
					window.__multiInstancePanelConfigManager__.unregisterPanelInstance(t, this.effectiveRegistrationKey, e), console.log(`[FunctionPanelUIBase] ✅ 面板已自己注销实例: ${this.effectiveRegistrationKey} #${e}`);
				}
				setTimeout(() => {
					if (this.$emit("close", {
						preserveData: !1,
						panelKey: t
					}), typeof window < "u") {
						let n = new CustomEvent(this.closeEventName, { detail: {
							componentName: this.componentName,
							panelInstanceId: e,
							panelKey: t
						} });
						window.dispatchEvent(n);
					}
					this.onClose && typeof this.onClose == "function" && this.onClose();
				}, 300);
			} else {
				console.log(`[FunctionPanelUIBase] ❌ 面板真关闭（多实例模式）: ${this.effectiveRegistrationKey}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup();
				let e = this.panelInstanceId, t = e === null ? this.effectiveRegistrationKey : `${this.effectiveRegistrationKey}_${e}`;
				console.log(`[FunctionPanelUIBase] 🎯 多实例面板关闭，panelKey: ${t}, panelInstanceId: ${e}`), setTimeout(() => {
					if (this.$emit("close", {
						preserveData: !1,
						panelKey: t
					}), typeof window < "u") {
						let n = new CustomEvent(this.closeEventName, { detail: {
							componentName: this.componentName,
							panelInstanceId: e,
							panelKey: t
						} });
						window.dispatchEvent(n);
					}
					this.onClose && typeof this.onClose == "function" && this.onClose(), this.autoRegister && this.registrationKey && this.unregisterFromParent();
				}, 300);
			}
		},
		handleKeydown(e) {
			e.key === "Escape" && this.close();
		}
	}
}, ie = { class: "header-left" }, ae = { class: "panel-title" }, P = { class: "header-controls" }, F = ["aria-label"], I = {
	width: "14",
	height: "14",
	viewBox: "0 0 14 14",
	fill: "none"
}, L = {
	key: 0,
	d: "M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, R = {
	key: 1,
	d: "M7 2V12M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, z = ["aria-label"], B = ["title"], V = { class: "fab-icon" }, H = { class: "fab-text" };
function U(e, s, l, u, m, g) {
	return p(), r(t, { to: "body" }, [c(n, { name: "panel-fade" }, {
		default: S(() => [m.isClosed ? i("", !0) : (p(), a("div", {
			key: 0,
			class: d(["function-panel", {
				"is-dragging": m.isDragging,
				"is-minimized": m.isMinimized,
				"blur-enabled": l.enableBackdropFilter && l.enableBlur
			}]),
			style: f(g.panelStyles),
			ref: "panelRef",
			onMousedown: s[3] ||= (...e) => g.onPanelMouseDown && g.onPanelMouseDown(...e)
		}, [o("div", {
			class: "panel-header",
			onMousedown: s[2] ||= (...e) => g.onHeaderMouseDown && g.onHeaderMouseDown(...e)
		}, [o("div", ie, [s[5] ||= o("div", { class: "drag-indicator" }, [
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" })
		], -1), h(e.$slots, "header", {}, () => [o("h3", ae, v(l.title), 1)], !0)]), o("div", P, [l.allowMinimize ? (p(), a("button", {
			key: 0,
			onClick: s[0] ||= w((...e) => g.toggleMinimize && g.toggleMinimize(...e), ["stop"]),
			class: "icon-btn minimize-btn",
			type: "button",
			"aria-label": m.isMinimized ? "展开" : "最小化"
		}, [(p(), a("svg", I, [m.isMinimized ? (p(), a("path", R)) : (p(), a("path", L))]))], 8, F)) : i("", !0), o("button", {
			onClick: s[1] ||= w((...e) => g.close && g.close(...e), ["stop"]),
			class: "icon-btn close-btn",
			type: "button",
			"aria-label": l.closeTooltip
		}, [...s[6] ||= [o("svg", {
			width: "14",
			height: "14",
			viewBox: "0 0 14 14",
			fill: "none"
		}, [o("path", {
			d: "M2 2L12 12M12 2L2 12",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round"
		})], -1)]], 8, z)])], 32), c(n, { name: "content-slide" }, {
			default: S(() => [C(o("div", {
				class: "panel-body",
				style: f(g.bodyStyles)
			}, [h(e.$slots, "default", {
				isClosed: m.isClosed,
				panelInstanceId: l.panelInstanceId,
				isSingleton: g.isSingletonByConfig
			}, void 0, !0)], 4), [[x, !m.isMinimized]])]),
			_: 3
		})], 38))]),
		_: 3
	}), c(n, { name: "fab-fade" }, {
		default: S(() => [!m.isClosed && m.isMinimized ? (p(), a("button", {
			key: 0,
			class: "panel-fab",
			type: "button",
			style: f(g.fabStyles),
			onClick: s[4] ||= (...e) => g.toggleMinimize && g.toggleMinimize(...e),
			title: l.title
		}, [o("span", V, v(l.titleIcon || "⚙️"), 1), o("span", H, v(l.title), 1)], 12, B)) : i("", !0)]),
		_: 1
	})]);
}
var W = /*#__PURE__*/ O(re, [["render", U], ["__scopeId", "data-v-2ca14fbb"]]), G = {
	name: "TestPanelModule",
	components: { FunctionPanelUIBase: W },
	inheritAttrs: !1,
	emits: [
		"close",
		"minimize",
		"expand"
	],
	props: {
		initialX: {
			type: [Number, String],
			default: "right"
		},
		initialY: {
			type: Number,
			default: 100
		},
		title: {
			type: String,
			default: "测试面板"
		},
		titleIcon: {
			type: String,
			default: "🧪"
		},
		width: {
			type: [Number, String],
			default: 320
		},
		maxHeight: {
			type: [Number, String],
			default: "60vh"
		},
		allowMinimize: {
			type: Boolean,
			default: !0
		},
		closeEventName: {
			type: String,
			default: "TestPanelModuleClose"
		},
		registrationKey: {
			type: String,
			default: null
		},
		autoRegister: {
			type: Boolean,
			default: !0
		},
		panelInstanceId: {
			type: Number,
			default: null
		}
	},
	data() {
		return {
			componentName: "TestPanelModule",
			count: 0,
			dynamicContent: {
				component: null,
				props: {},
				events: {},
				title: null,
				titleIcon: null
			}
		};
	},
	computed: {
		effectiveTitle() {
			return this.dynamicContent.title || this.title;
		},
		effectiveTitleIcon() {
			return this.dynamicContent.titleIcon || this.titleIcon;
		},
		filteredAttrs() {
			let { onClose: e, onMinimize: t, onExpand: n, ...r } = this.$attrs;
			return r;
		}
	},
	methods: {
		setContent(e, t = {}) {
			let { props: n = {}, events: r = {}, title: i = null, titleIcon: a = null } = t;
			typeof e == "string" ? import(
				/* webpackChunkName: "[request]" */
				`../${e}`
).then((e) => {
				this.dynamicContent.component = l(e.default || e), this.dynamicContent.props = n, this.dynamicContent.events = r, this.dynamicContent.title = i, this.dynamicContent.titleIcon = a;
			}).catch((t) => {
				console.error("[TestPanelModule] 组件加载失败:", e, t);
			}) : (this.dynamicContent.component = l(e), this.dynamicContent.props = n, this.dynamicContent.events = r, this.dynamicContent.title = i, this.dynamicContent.titleIcon = a);
		},
		clearContent() {
			this.dynamicContent = {
				component: null,
				props: {},
				events: {},
				title: null,
				titleIcon: null
			};
		},
		getContentConfig() {
			return { ...this.dynamicContent };
		},
		handleClose() {
			console.log(`[${this.$options.name}] 面板关闭`), this.$emit("close");
		},
		handleMinimize() {
			console.log(`[${this.$options.name}] 面板最小化`);
		},
		handleExpand() {
			console.log(`[${this.$options.name}] 面板展开`);
		},
		showAlert() {
			alert(`[${this.componentName}] 事件测试成功！`);
		},
		increment() {
			this.count++;
		}
	}
}, K = { class: "test-panel-content" }, q = { class: "demo-section" }, J = { class: "status-info" }, oe = { class: "status-item" }, se = { class: "value" };
function ce(e, t, n, i, a, s) {
	let c = g("FunctionPanelUIBase");
	return p(), r(c, u(s.filteredAttrs, {
		title: s.effectiveTitle,
		"title-icon": s.effectiveTitleIcon,
		width: n.width,
		"max-height": n.maxHeight,
		"initial-x": n.initialX,
		"initial-y": n.initialY,
		"allow-minimize": n.allowMinimize,
		"close-event-name": n.closeEventName,
		"auto-register": n.autoRegister === !0,
		"registration-key": n.registrationKey || "TestPanelModule",
		"panel-instance-id": n.panelInstanceId,
		onClose: s.handleClose,
		onMinimize: s.handleMinimize,
		onExpand: s.handleExpand
	}), {
		default: S((n) => [a.dynamicContent.component ? (p(), r(_(a.dynamicContent.component), u({ key: 0 }, {
			...a.dynamicContent.props,
			isClosed: n.isClosed,
			panelInstanceId: n.panelInstanceId
		}, y(a.dynamicContent.events)), null, 16)) : h(e.$slots, "content", {
			key: 1,
			isClosed: n.isClosed,
			panelInstanceId: n.panelInstanceId,
			isSingleton: n.isSingleton
		}, () => [o("div", K, [
			t[6] ||= o("div", { class: "section-title" }, "🎉 自动加载测试", -1),
			t[7] ||= o("p", { class: "hint-text" }, " 这个面板是通过以下方式自动加载的： ", -1),
			t[8] ||= o("ul", { class: "feature-list" }, [
				o("li", null, "✅ 放置在 functions 目录下"),
				o("li", null, "✅ 启用 auto-register=\"true\""),
				o("li", null, "✅ 设置 registration-key=\"TestPanelModule\""),
				o("li", null, "✅ CesiumMain 自动导入并渲染")
			], -1),
			o("div", q, [
				t[2] ||= o("div", { class: "section-label" }, "演示功能", -1),
				o("button", {
					onClick: t[0] ||= (...e) => s.showAlert && s.showAlert(...e),
					class: "demo-btn"
				}, " 🔔 测试事件 "),
				o("button", {
					onClick: t[1] ||= (...e) => s.increment && s.increment(...e),
					class: "demo-btn"
				}, " 📊 计数器: " + v(a.count), 1)
			]),
			o("div", J, [
				o("div", oe, [t[3] ||= o("span", { class: "label" }, "组件名称:", -1), o("span", se, v(a.componentName), 1)]),
				t[4] ||= o("div", { class: "status-item" }, [o("span", { class: "label" }, "注册状态:"), o("span", { class: "value success" }, "已注册 ✓")], -1),
				t[5] ||= o("div", { class: "status-item" }, [o("span", { class: "label" }, "渲染方式:"), o("span", { class: "value" }, "动态组件")], -1)
			])
		])], !0)]),
		_: 3
	}, 16, [
		"title",
		"title-icon",
		"width",
		"max-height",
		"initial-x",
		"initial-y",
		"allow-minimize",
		"close-event-name",
		"auto-register",
		"registration-key",
		"panel-instance-id",
		"onClose",
		"onMinimize",
		"onExpand"
	]);
}
var le = /*#__PURE__*/ O(G, [["render", ce], ["__scopeId", "data-v-9092d2be"]]), ue = {
	name: "ObliqueHeightAdjustPanel",
	components: { FunctionPanelUIBase: W },
	mixins: [k],
	props: {
		registrationKey: {
			type: String,
			default: "ObliqueHeightAdjustPanel"
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		autoRegister: {
			type: Boolean,
			default: !1
		},
		initialX: {
			type: [Number, String],
			default: "right"
		},
		initialY: {
			type: Number,
			default: 200
		},
		selectedLayer: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			componentName: "ObliqueHeightAdjustPanel",
			presets: [
				{
					value: 0,
					label: "0m"
				},
				{
					value: 50,
					label: "50m"
				},
				{
					value: 100,
					label: "100m"
				},
				{
					value: 200,
					label: "200m"
				},
				{
					value: 500,
					label: "500m"
				},
				{
					value: 1e3,
					label: "1km"
				}
			]
		};
	},
	computed: { panelTitle() {
		return this.selectedLayer ? `${this.selectedLayer.name} 高度调整` : "高度调整";
	} },
	methods: {
		handleClose() {
			console.log(`[${this.componentName}] 面板关闭`), this.$emit("close");
		},
		handleMinimize() {
			console.log(`[${this.componentName}] 面板已最小化`);
		},
		handleExpand() {
			console.log(`[${this.componentName}] 面板已展开`);
		},
		onHeightSliderInput(e) {
			if (!this.selectedLayer) return;
			let t = parseFloat(e.target.value);
			this.$emit("height-preview", {
				layer: this.selectedLayer,
				value: t
			});
		},
		onHeightSliderChange(e) {
			if (!this.selectedLayer) return;
			let t = parseFloat(e.target.value);
			this.$emit("height-change", {
				layer: this.selectedLayer,
				value: t
			});
		},
		onHeightInputChange(e) {
			if (!this.selectedLayer) return;
			let t = parseFloat(e.target.value);
			isNaN(t) || this.$emit("height-change", {
				layer: this.selectedLayer,
				value: t
			});
		},
		applyRecommendedOffset() {
			if (this.selectedLayer) {
				if (this.selectedLayer.recommendedOffset === null || this.selectedLayer.recommendedOffset === void 0) {
					console.warn(`[${this.componentName}] 没有推荐偏移值`);
					return;
				}
				this.$emit("height-change", {
					layer: this.selectedLayer,
					value: this.selectedLayer.recommendedOffset
				});
			}
		},
		applyPreset(e) {
			this.selectedLayer && this.$emit("height-change", {
				layer: this.selectedLayer,
				value: e
			});
		},
		resetToZero() {
			this.selectedLayer && this.$emit("height-change", {
				layer: this.selectedLayer,
				value: 0
			});
		}
	}
}, de = {
	key: 0,
	class: "recommended-offset-banner"
}, fe = { class: "banner-content" }, pe = { class: "banner-text" }, me = { class: "banner-suggestion" }, he = { class: "highlight" }, ge = ["disabled"], _e = { class: "current-height-card" }, ve = { class: "height-value" }, ye = { class: "value" }, be = { class: "adjustment-section" }, xe = { class: "slider-container" }, Se = ["value"], Ce = { class: "precise-input-section" }, we = { class: "input-group" }, Te = ["value"], Ee = { class: "preset-section" }, De = { class: "preset-grid" }, Oe = ["onClick"], ke = {
	key: 1,
	class: "empty-state"
};
function Ae(t, n, c, l, u, f) {
	let h = g("FunctionPanelUIBase");
	return p(), r(h, {
		title: f.panelTitle,
		"title-icon": "🌏",
		width: 360,
		"max-height": "70vh",
		"initial-x": c.initialX,
		"initial-y": c.initialY,
		"allow-minimize": !0,
		"close-event-name": "obliqueHeightAdjustPanelClose",
		"auto-register": c.autoRegister === void 0 ? !1 : c.autoRegister,
		"registration-key": c.registrationKey || "ObliqueHeightAdjustPanel",
		"panel-instance-id": c.panelInstanceId,
		onClose: f.handleClose,
		onMinimize: f.handleMinimize,
		onExpand: f.handleExpand
	}, {
		default: S(() => [c.selectedLayer ? (p(), a(e, { key: 0 }, [
			c.selectedLayer.loaded && c.selectedLayer.recommendedOffset !== void 0 && c.selectedLayer.recommendedOffset !== null ? (p(), a("div", de, [o("div", fe, [
				n[8] ||= o("svg", {
					class: "banner-icon",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M9 18h6M10 22h4M12 2v1M12 18v-2M12 14a4 4 0 100-8 4 4 0 000 8z",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1),
				o("div", pe, [n[7] ||= o("div", { class: "banner-main" }, "检测到倾斜摄影地形高度较低", -1), o("div", me, [
					n[5] ||= s(" 建议向上偏移 ", -1),
					o("span", he, v(c.selectedLayer.recommendedOffset.toFixed(1)) + " 米", 1),
					n[6] ||= s(" 以与大坐标模型底部对齐 ", -1)
				])]),
				o("button", {
					onClick: n[0] ||= (...e) => f.applyRecommendedOffset && f.applyRecommendedOffset(...e),
					class: "apply-recommended-btn",
					disabled: Math.abs(c.selectedLayer.heightOffset - c.selectedLayer.recommendedOffset) < .1
				}, v(Math.abs(c.selectedLayer.heightOffset - c.selectedLayer.recommendedOffset) < .1 ? "已应用" : "应用推荐值"), 9, ge)
			])])) : i("", !0),
			o("div", _e, [n[10] ||= o("div", { class: "card-header" }, [o("h4", { class: "card-title" }, "当前高度偏移"), o("span", {
				class: "hint-icon",
				title: "调整倾斜摄影的整体高度，正值向上，负值向下"
			}, [o("svg", {
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2"
			}, [o("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}), o("path", {
				d: "M12 16v-4M12 8h.01",
				"stroke-linecap": "round"
			})])])], -1), o("div", ve, [o("span", ye, v((c.selectedLayer.heightOffset || 0).toFixed(2)), 1), n[9] ||= o("span", { class: "unit" }, "米", -1)])]),
			o("div", be, [
				n[12] ||= o("div", { class: "section-label" }, [o("span", null, "调整偏移"), o("span", { class: "range-hint" }, "-2000m ~ +2000m")], -1),
				o("div", xe, [o("input", {
					type: "range",
					min: "-2000",
					max: "2000",
					step: "1",
					value: c.selectedLayer.heightOffset || 0,
					onInput: n[1] ||= (...e) => f.onHeightSliderInput && f.onHeightSliderInput(...e),
					onChange: n[2] ||= (...e) => f.onHeightSliderChange && f.onHeightSliderChange(...e),
					class: "height-slider"
				}, null, 40, Se), n[11] ||= o("div", { class: "slider-track-fill" }, null, -1)]),
				n[13] ||= o("div", { class: "usage-hint" }, "调整后使倾斜摄影与大坐标模型高度对齐", -1)
			]),
			o("div", Ce, [n[15] ||= o("label", { class: "input-label" }, "精确设置偏移（米）", -1), o("div", we, [o("input", {
				type: "number",
				value: c.selectedLayer.heightOffset || 0,
				onChange: n[3] ||= (...e) => f.onHeightInputChange && f.onHeightInputChange(...e),
				class: "number-input",
				step: "0.1"
			}, null, 40, Te), o("button", {
				onClick: n[4] ||= (...e) => f.resetToZero && f.resetToZero(...e),
				class: "reset-btn",
				title: "重置为0"
			}, [...n[14] ||= [o("svg", {
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2"
			}, [o("path", {
				d: "M3 12a9 9 0 1018 0M3 12h18M12 3v9",
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			})], -1), s(" 重置 ", -1)]])])]),
			o("div", Ee, [n[16] ||= o("div", { class: "section-label" }, "快捷预设", -1), o("div", De, [(p(!0), a(e, null, m(u.presets, (e) => (p(), a("button", {
				key: e.value,
				onClick: (t) => f.applyPreset(e.value),
				class: d(["preset-btn", { active: Math.abs(c.selectedLayer.heightOffset - e.value) < .1 }])
			}, v(e.label), 11, Oe))), 128))])])
		], 64)) : (p(), a("div", ke, [...n[17] ||= [o("svg", {
			class: "empty-icon",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": "2"
		}, [o("path", {
			d: "M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-4M9 20v-6M9 20l6-6M9 20l6 6",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		})], -1), o("div", { class: "empty-text" }, "请先在倾斜摄影面板中选择一个已加载的图层", -1)]]))]),
		_: 1
	}, 8, [
		"title",
		"initial-x",
		"initial-y",
		"auto-register",
		"registration-key",
		"panel-instance-id",
		"onClose",
		"onMinimize",
		"onExpand"
	]);
}
var Y = /*#__PURE__*/ O(ue, [["render", Ae], ["__scopeId", "data-v-80456ab5"]]), X = new class {
	constructor() {
		this.configDefinitions = new Map([["oblique-photography", {
			id: "oblique-photography",
			name: "倾斜摄影配置",
			fileName: "oblique_photography.json",
			relativePath: "gis/oblique_photography.json",
			description: "倾斜摄影模型加载配置",
			icon: "📷",
			category: "gis"
		}]]), this.serverConfig = {
			baseURL: this.detectServerURL(),
			apiPort: 8081,
			dataAPI: "api/data",
			syncAPI: "api/sync",
			timeout: 3e4
		}, console.log("[DataManager] 初始化完成"), console.log("[DataManager] 服务器配置:", this.serverConfig);
	}
	detectServerURL() {
		if (typeof window > "u") return "http://192.168.31.146:8080";
		let e = window.location.href, t = new URL(e);
		return t.hostname === "localhost" || t.hostname === "127.0.0.1" ? "http://192.168.31.146:8080" : `${t.protocol}//${t.hostname}:${t.port || 80}`;
	}
	setServerConfig(e) {
		this.serverConfig = {
			...this.serverConfig,
			...e
		}, console.log("[DataManager] 更新服务器配置:", this.serverConfig);
	}
	getAPIURL(e) {
		let t = new URL(this.serverConfig.baseURL);
		return t.port = this.serverConfig.apiPort.toString(), `${t.toString().replace(/\/$/, "")}/${e}`;
	}
	getDataURL(e) {
		return `${this.serverConfig.baseURL.replace(/\/$/, "")}/data/${e}`;
	}
	getAvailableConfigs() {
		return Array.from(this.configDefinitions.values()).map((e) => ({
			id: e.id,
			name: e.name,
			fileName: e.fileName,
			description: e.description,
			icon: e.icon,
			category: e.category
		}));
	}
	getConfigDefinition(e) {
		return this.configDefinitions.get(e) || null;
	}
	async loadFromServer(e) {
		let t = this.getConfigDefinition(e);
		if (!t) return console.error(`[DataManager] ❌ 未找到配置: ${e}`), null;
		try {
			let e = this.getAPIURL(`${this.serverConfig.dataAPI}/${t.relativePath}`);
			console.log(`[DataManager] 📡 从 API 服务器加载: ${e}`);
			let n = new AbortController(), r = setTimeout(() => n.abort(), this.serverConfig.timeout), i = await fetch(e, {
				method: "GET",
				mode: "cors",
				cache: "no-cache",
				signal: n.signal
			});
			if (clearTimeout(r), !i.ok) throw Error(`HTTP ${i.status}: ${i.statusText}`);
			let a = await i.json();
			if (a.success && a.data) return console.log(`[DataManager] ✅ 从 API 服务器加载成功，数据项: ${Array.isArray(a.data) ? a.data.length : Object.keys(a.data).length}`), console.log(`[DataManager] 数据来源: ${a.source}`), a.data;
			throw Error(a.error || "加载数据失败");
		} catch (e) {
			e.name === "AbortError" ? console.error("[DataManager] ❌ 加载超时") : console.error("[DataManager] ❌ 从 API 服务器加载失败:", e), console.log("[DataManager] 🔄 回退到静态文件加载");
			try {
				let e = this.getDataURL(t.relativePath), n = await fetch(e, { cache: "no-cache" });
				if (n.ok) {
					let e = await n.json();
					return console.log("[DataManager] ✅ 从静态文件加载成功"), e;
				}
			} catch (e) {
				console.error("[DataManager] ❌ 静态文件加载也失败:", e);
			}
			return null;
		}
	}
	async uploadToServer(e, t, n = {}) {
		let r = this.getConfigDefinition(e);
		if (!r) return console.error(`[DataManager] ❌ 未找到配置: ${e}`), {
			success: !1,
			error: "配置不存在"
		};
		try {
			console.log(`[DataManager] 📤 上传配置到服务器: ${r.name}`);
			let n = this.validateConfig(e, t);
			if (!n.valid) return console.error("[DataManager] ❌ 数据验证失败:", n.errors), {
				success: !1,
				error: "数据验证失败",
				errors: n.errors
			};
			let i = this.getAPIURL(`${this.serverConfig.dataAPI}/${r.relativePath}`);
			console.log(`[DataManager] 📡 上传URL: ${i}`);
			let a = new AbortController(), o = setTimeout(() => a.abort(), this.serverConfig.timeout), s = await fetch(i, {
				method: "POST",
				mode: "cors",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ data: t }),
				signal: a.signal
			});
			if (clearTimeout(o), !s.ok) throw Error(`HTTP ${s.status}: ${s.statusText}`);
			let c = await s.json();
			if (c.success) return console.log(`[DataManager] ✅ 上传成功: ${r.fileName}`), {
				success: !0,
				message: c.message || "上传成功",
				result: c
			};
			throw Error(c.error || "上传失败");
		} catch (e) {
			return console.error("[DataManager] ❌ 上传失败:", e), {
				success: !1,
				error: e.message,
				hint: "请检查服务器配置和网络连接"
			};
		}
	}
	async exportConfig(e, t, n = {}) {
		let r = this.getConfigDefinition(e);
		if (!r) return console.error(`[DataManager] ❌ 未找到配置: ${e}`), !1;
		try {
			console.log(`[DataManager] 📤 导出配置（本地）: ${r.name}`);
			let e = n.pretty !== !1, i = n.fileName || r.fileName, a = JSON.stringify(t, null, e ? 2 : 0), o = new Blob([a], { type: "application/json" }), s = URL.createObjectURL(o), c = document.createElement("a");
			return c.href = s, c.download = i, document.body.appendChild(c), c.click(), document.body.removeChild(c), URL.revokeObjectURL(s), console.log(`[DataManager] ✅ 导出成功: ${i}`), !0;
		} catch (e) {
			return console.error("[DataManager] ❌ 导出失败:", e), !1;
		}
	}
	async importConfig(e = {}) {
		try {
			console.log("[DataManager] 📥 准备导入配置（本地）");
			let t = document.createElement("input");
			t.type = "file", t.accept = e.accept || ".json,application/json", t.style.display = "none";
			let n = new Promise((e, n) => {
				t.onchange = (t) => {
					let r = t.target.files[0];
					r ? e(r) : n(/* @__PURE__ */ Error("未选择文件"));
				}, t.oncancel = () => {
					n(/* @__PURE__ */ Error("用户取消"));
				};
			});
			document.body.appendChild(t), t.click(), document.body.removeChild(t);
			let r = await n;
			console.log(`[DataManager] 📄 读取文件: ${r.name}`);
			let i = await this.readFile(r, e.onProgress), a = JSON.parse(i);
			return console.log(`[DataManager] ✅ 导入成功，数据项: ${Array.isArray(a) ? a.length : Object.keys(a).length}`), {
				data: a,
				fileName: r.name,
				fileSize: r.size,
				lastModified: new Date(r.lastModified)
			};
		} catch (e) {
			return console.error("[DataManager] ❌ 导入失败:", e), null;
		}
	}
	readFile(e, t) {
		return new Promise((n, r) => {
			let i = new FileReader();
			i.onload = (e) => n(e.target.result), i.onerror = () => r(/* @__PURE__ */ Error("文件读取失败")), i.onprogress = (e) => {
				e.lengthComputable && t && t(e.loaded / e.total * 100);
			}, i.readAsText(e);
		});
	}
	validateConfig(e, t) {
		let n = this.getConfigDefinition(e), r = [];
		if (!n) return r.push(`未找到配置定义: ${e}`), {
			valid: !1,
			errors: r
		};
		if (t == null) return r.push("数据不能为空"), {
			valid: !1,
			errors: r
		};
		switch (e) {
			case "oblique-photography":
				Array.isArray(t) ? t.forEach((e, t) => {
					e.id || r.push(`第 ${t + 1} 项缺少 id 字段`), e.name || r.push(`第 ${t + 1} 项缺少 name 字段`), e.url || r.push(`第 ${t + 1} 项缺少 url 字段`);
				}) : r.push("倾斜摄影配置必须是数组");
				break;
		}
		return {
			valid: r.length === 0,
			errors: r
		};
	}
	getConfigStats(e, t) {
		let n = {
			configId: e,
			configName: this.getConfigDefinition(e)?.name || "未知",
			itemCount: 0,
			dataSize: JSON.stringify(t).length,
			dataSizeKB: 0,
			lastModified: (/* @__PURE__ */ new Date()).toISOString()
		};
		return Array.isArray(t) ? n.itemCount = t.length : typeof t == "object" && t && (n.itemCount = Object.keys(t).length), n.dataSizeKB = (n.dataSize / 1024).toFixed(2), n;
	}
	async testConnection() {
		try {
			let e = `${this.serverConfig.baseURL}/`;
			console.log(`[DataManager] 🔌 测试服务器连接: ${e}`);
			let t = await fetch(e, {
				method: "HEAD",
				mode: "cors",
				cache: "no-cache"
			});
			return console.log(`[DataManager] ✅ 服务器连接成功: ${t.status}`), t.ok || t.status === 404;
		} catch (e) {
			return console.error("[DataManager] ❌ 服务器连接失败:", e), !1;
		}
	}
	async listServerFiles(e = "") {
		try {
			console.log(`[DataManager] 📂 获取服务器文件列表: ${e}`);
			let t = this.getAPIURL("api/configs"), n = new AbortController(), r = setTimeout(() => n.abort(), this.serverConfig.timeout), i = await fetch(t, {
				method: "GET",
				mode: "cors",
				cache: "no-cache",
				signal: n.signal
			});
			if (clearTimeout(r), !i.ok) throw Error(`HTTP ${i.status}: ${i.statusText}`);
			let a = await i.json();
			if (a.success) return console.log(`[DataManager] ✅ 获取文件列表成功，共 ${a.data.length} 个文件`), a.data;
			throw Error(a.error || "获取文件列表失败");
		} catch (e) {
			return console.error("[DataManager] ❌ 获取文件列表失败:", e), [];
		}
	}
	async getServerDirectoryStructure() {
		try {
			let e = await this.listServerFiles(), t = /* @__PURE__ */ new Map();
			e.forEach((e) => {
				let n = e.filePath.includes("/") ? e.filePath.substring(0, e.filePath.lastIndexOf("/")) : "";
				t.has(n) || t.set(n, []), t.get(n).push({
					name: e.fileName,
					path: e.filePath,
					size: e.fileSize,
					modified: e.modifiedTime
				});
			});
			let n = {};
			return t.forEach((e, t) => {
				n[t || "/"] = e;
			}), n;
		} catch (e) {
			return console.error("[DataManager] ❌ 获取目录结构失败:", e), {};
		}
	}
}(), Z = typeof window < "u" && window.__panelSingletonManager__ || M, je = "/data/gis/oblique_photography.json", Q = "oblique-photography", Me = {
	name: "ObliquePhotographyPanel",
	components: {
		FunctionPanelUIBase: W,
		ObliqueHeightAdjustPanel: Y
	},
	mixins: [k],
	props: {
		registrationKey: {
			type: String,
			default: "ObliquePhotographyPanel"
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		autoRegister: {
			type: Boolean,
			default: !0
		},
		initialX: {
			type: [Number, String],
			default: "center"
		},
		initialY: {
			type: Number,
			default: 120
		},
		lazyLoad: {
			type: Boolean,
			default: !1
		}
	},
	data() {
		return {
			componentName: "ObliquePhotographyPanel",
			obliquePhotographyList: [],
			cesiumViewer: null,
			Cesium: null,
			showAddDialog: !1,
			showEditDialog: !1,
			showDeleteDialog: !1,
			showImportDialog: !1,
			serverFiles: [],
			serverDirectories: {},
			selectedServerFile: null,
			loadingServerFiles: !1,
			currentServerDirectory: "",
			allFilesMap: /* @__PURE__ */ new Map(),
			serverBaseURL: "",
			apiServerURL: "",
			formData: {
				id: "",
				name: "",
				url: ""
			},
			editingItem: null,
			deleteTarget: null,
			showHeightPanel: !1,
			selectedLayer: null,
			selectedItemId: null
		};
	},
	beforeCreate() {
		this._cesiumTilesets = /* @__PURE__ */ new Map(), this._cesiumTransforms = /* @__PURE__ */ new Map(), this._cesiumHeightOffsets = /* @__PURE__ */ new Map(), this._cesiumErrorHandlers = /* @__PURE__ */ new Map();
	},
	created() {
		this.serverBaseURL = process.env.VUE_APP_SERVER_BASE_URL || "http://192.168.31.146:8080";
		let e = process.env.VUE_APP_API_PORT || "8081", t = new URL(this.serverBaseURL);
		t.port = e, this.apiServerURL = t.toString().replace(/\/$/, ""), console.log(`[${this.componentName}] 🔧 服务器配置:`, {
			frontend: this.serverBaseURL,
			api: this.apiServerURL
		});
	},
	computed: {
		computedHeightPanelX() {
			return typeof this.initialX == "number" ? this.initialX + 450 : this.initialX;
		},
		currentDirectoryFiles() {
			let e = this.currentServerDirectory || "";
			return this.serverFiles.filter((t) => {
				let n = t.filePath || t.path;
				return n ? (n.includes("/") ? n.substring(0, n.lastIndexOf("/")) : "") === e : !1;
			});
		},
		currentSubdirectories() {
			let e = this.currentServerDirectory || "", t = /* @__PURE__ */ new Set();
			return this.serverFiles.forEach((n) => {
				let r = n.filePath || n.path;
				if (!r) return;
				let i = r.includes("/") ? r.substring(0, r.lastIndexOf("/")) : "";
				if (i !== e) {
					if (e === "") {
						if (i) {
							let e = i.indexOf("/");
							e === -1 ? t.add(i) : t.add(i.substring(0, e));
						}
					} else if (i.startsWith(e + "/")) {
						let n = i.substring(e.length + 1), r = n.indexOf("/");
						r === -1 ? t.add(n) : t.add(n.substring(0, r));
					}
				}
			}), Array.from(t).sort();
		},
		currentDirectoryDisplay() {
			return "/data/" + (this.currentServerDirectory ? this.currentServerDirectory + "/" : "");
		},
		canGoBack() {
			return this.currentServerDirectory !== "";
		}
	},
	mounted() {
		this._panelStateChangeListener = (e) => {
			if (e.type === "visibleChange") {
				let t = this.$refs.basePanel || this.$children[0];
				if (t) {
					let n = t.isClosed;
					t.isClosed = e.isClosed, console.log(`[${this.componentName}] 🔔 监听到状态变化: isClosed ${n} -> ${t.isClosed}`), n && !t.isClosed && (t.$forceUpdate(), console.log(`[${this.componentName}] ✅ 强制重新渲染 FunctionPanelUIBase`));
				} else console.warn(`[${this.componentName}] ⚠️ 无法找到 FunctionPanelUIBase 实例`);
			}
		}, Z.addEventListener(this.componentName, this._panelStateChangeListener), console.log(`[${this.componentName}] 📝 已注册面板状态监听器`);
		let e = Z.getPanelState(this.componentName), t = e && e.cesiumTilesets && e.cesiumTilesets.size > 0;
		t && (console.log(`[${this.componentName}] 📦 恢复保存的 Cesium 对象（单例模式）`), this._cesiumTilesets = e.cesiumTilesets, this._cesiumTransforms = e.cesiumTransforms, this._cesiumHeightOffsets = e.cesiumHeightOffsets, this._cesiumErrorHandlers = e.cesiumErrorHandlers, this._cesiumErrorHandlers.forEach((e, t) => {
			e && e.tileset && e.tileset.tileFailed && e.tileset.tileFailed.addEventListener(e.errorHandler);
		}));
		let n = this.lazyLoad || this.getConfigLazyLoad();
		console.log(`[${this.componentName}] 🔍 延迟加载检查:`, {
			thisLazyLoad: this.lazyLoad,
			configLazyLoad: this.getConfigLazyLoad(),
			shouldLazyLoad: n,
			lazyLoadProp: this.$props?.lazyLoad,
			lazyLoadAttr: this.$attrs?.lazyLoad
		}), n ? (console.log(`[${this.componentName}] ⏸️ 延迟加载已启用，等待面板首次打开时加载配置`), console.log(`[${this.componentName}] 📝 延迟加载事件将通过 @lazy-load 监听`)) : console.log(`[${this.componentName}] ⏭️ 延迟加载未启用，将立即加载数据`), this.initCesium(() => {
			n ? console.log(`[${this.componentName}] Cesium 已就绪，等待延迟加载触发`) : (console.log(`[${this.componentName}] Cesium 已就绪，面板初始化完成`), console.log(`[${this.componentName}] 📂 从服务器加载最新配置数据`), this.loadFromJson().then(() => {
				t && (console.log(`[${this.componentName}] 🔄 恢复 Cesium 对象状态`), this.restoreCesiumObjects());
			}).catch((e) => {
				console.error(`[${this.componentName}] ❌ 初始加载失败:`, e), this.obliquePhotographyList = [];
			}));
		});
	},
	beforeUnmount() {
		console.log(`[${this.componentName}] 💾 保存 Cesium 对象到单例管理器`), Z.savePanelState(this.componentName, {
			cesiumTilesets: this._cesiumTilesets,
			cesiumTransforms: this._cesiumTransforms,
			cesiumHeightOffsets: this._cesiumHeightOffsets,
			cesiumErrorHandlers: this._cesiumErrorHandlers,
			obliquePhotographyList: []
		}), this._cesiumErrorHandlers && this._cesiumErrorHandlers.forEach((e, t) => {
			e && e.tileset && e.tileset.tileFailed && e.tileset.tileFailed.removeEventListener(e.errorHandler);
		});
	},
	methods: {
		getConfigLazyLoad() {
			if (typeof window < "u" && window.__functionPanelsConfig__) {
				let e = window.__functionPanelsConfig__.panels.find((e) => e.name === this.componentName);
				return e ? e.lazyLoad === !0 : !1;
			}
			return !1;
		},
		onLazyLoad(e) {
			console.log(`[${this.componentName}] ⚡ 延迟加载触发，首次打开面板`, e);
			let t = Z.getPanelState(this.componentName), n = t && t.cesiumTilesets && t.cesiumTilesets.size > 0;
			this.initCesium(() => {
				console.log(`[${this.componentName}] Cesium 已就绪，开始延迟加载配置`), this.loadFromJson().then(() => {
					n && (console.log(`[${this.componentName}] 🔄 恢复 Cesium 对象状态`), this.restoreCesiumObjects());
				}).catch((e) => {
					console.error(`[${this.componentName}] ❌ 延迟加载失败:`, e), (!this.obliquePhotographyList || this.obliquePhotographyList.length === 0) && (this.obliquePhotographyList = []);
				});
			});
		},
		handleClose() {
			if (console.log(`[${this.componentName}] 面板假关闭（单实例模式）`), typeof window < "u") {
				let e = new CustomEvent("obliquePhotographyPanelFakeClose", { detail: {
					componentName: this.componentName,
					preserveData: !0
				} });
				window.dispatchEvent(e);
			}
			this.$emit("close");
		},
		handleMinimize() {
			console.log(`[${this.componentName}] 面板已最小化`);
		},
		handleExpand() {
			console.log(`[${this.componentName}] 面板已展开`);
		},
		restoreCesiumObjects() {
			let e = this.getCesiumViewer();
			if (!e) {
				console.error(`[${this.componentName}] Cesium Viewer 未初始化，无法恢复 Cesium 对象`);
				return;
			}
			console.log(`[${this.componentName}] 🔄 恢复 Cesium 对象到场景`);
			let t = 0;
			this._cesiumTilesets.forEach((n, r) => {
				if (n && !n.isDestroyed()) {
					e.scene.primitives.contains(n) ? console.log(`[${this.componentName}] ℹ️ tileset 已在场景中: ${r}`) : (e.scene.primitives.add(n), t++, console.log(`[${this.componentName}] ✅ 恢复 tileset: ${r}`));
					let i = this._cesiumTransforms.get(r);
					i && (n.modelMatrix = i);
				}
			}), console.log(`[${this.componentName}] ✅ 恢复完成，共恢复 ${t} 个 tileset`);
		},
		async loadFromJson() {
			try {
				console.log(`[${this.componentName}] 📂 开始加载配置数据: ${Q}`), console.log(`[${this.componentName}] 🔍 当前列表长度: ${this.obliquePhotographyList?.length || 0}`);
				let e = null, t = "";
				try {
					e = await X.loadFromServer(Q), t = "API服务器（数据库）", console.log(`[${this.componentName}] ✅ 从 API 服务器加载数据成功`);
				} catch (n) {
					console.warn(`[${this.componentName}] ⚠️ API 服务器加载失败，尝试静态文件:`, n.message);
					let r = await fetch(je, { cache: "no-cache" });
					if (!r.ok) throw Error(`HTTP error! status: ${r.status}`);
					e = await r.json(), t = "静态文件", console.log(`[${this.componentName}] ✅ 从静态文件加载数据成功`);
				}
				if (console.log(`[${this.componentName}] 📦 数据来源: ${t}, 原始数据:`, e), !Array.isArray(e)) {
					console.error(`[${this.componentName}] ❌ JSON数据格式错误：期望数组，实际收到:`, typeof e), this.obliquePhotographyList = [];
					return;
				}
				if (e.length === 0) {
					console.warn(`[${this.componentName}] ⚠️ JSON数据为空数组`), this.obliquePhotographyList = [];
					return;
				}
				this.obliquePhotographyList = e.map((e) => {
					let t = this.obliquePhotographyList.find((t) => t.id === e.id);
					return {
						...e,
						loaded: t?.loaded || !1,
						heightOffset: this._cesiumHeightOffsets.get(e.id) || 0,
						loading: !1
					};
				}), console.log(`[${this.componentName}] ✅ 从JSON加载数据成功，共 ${this.obliquePhotographyList.length} 条:`, this.obliquePhotographyList);
			} catch (e) {
				console.error(`[${this.componentName}] ❌ 从JSON加载数据失败:`, e), console.error(`[${this.componentName}] 错误详情:`, {
					message: e.message,
					stack: e.stack,
					name: e.name
				}), this.obliquePhotographyList = [];
			}
		},
		async refreshFromJson() {
			await this.loadFromJson(), console.log(`[${this.componentName}] 数据已刷新`);
		},
		async exportConfig() {
			console.log(`[${this.componentName}] 📤 准备导出配置到服务器`);
			let e = this.obliquePhotographyList.map((e) => ({
				id: e.id,
				name: e.name,
				url: e.url
			})), t = X.validateConfig(Q, e);
			if (!t.valid) return console.error(`[${this.componentName}] ❌ 数据验证失败:`, t.errors), alert(`数据验证失败:\n${t.errors.join("\n")}`), !1;
			let n = await X.uploadToServer(Q, e);
			return n.success ? (console.log(`[${this.componentName}] ✅ 配置已导出到服务器`), alert("配置已成功导出到服务器！\n\n文件：oblique-photography.json\n数据将自动同步到 FTP 目录")) : (console.error(`[${this.componentName}] ❌ 导出失败:`, n.error), alert(`导出失败！\n\n错误：${n.error}\n\n请检查：\n1. API 服务器是否启动（端口 8081）\n2. 网络连接是否正常`)), n.success;
		},
		async saveToJson() {
			try {
				let e = this.obliquePhotographyList.map((e) => ({
					id: e.id,
					name: e.name,
					url: e.url
				})), t = X.validateConfig(Q, e);
				if (!t.valid) return console.error(`[${this.componentName}] ❌ 数据验证失败:`, t.errors), !1;
				let n = await X.uploadToServer(Q, e);
				return n.success ? console.log(`[${this.componentName}] ✅ 配置已自动保存到服务器`) : console.error(`[${this.componentName}] ❌ 自动保存失败:`, n.error), n.success;
			} catch (e) {
				return console.error(`[${this.componentName}] ❌ saveToJson 错误:`, e), !1;
			}
		},
		async openImportDialog() {
			console.log(`[${this.componentName}] 📂 打开服务器文件浏览`), this.showImportDialog = !0, await this.loadServerFiles();
		},
		async importConfig() {
			console.log(`[${this.componentName}] 📥 打开服务器文件导入对话框`), await this.openImportDialog();
		},
		async loadServerFiles(e = "") {
			this.loadingServerFiles = !0;
			try {
				let t = await X.listServerFiles(e), n = await X.getServerDirectoryStructure();
				this.serverFiles = t, this.serverDirectories = n, this.allFilesMap = /* @__PURE__ */ new Map(), t.forEach((e) => {
					let t = e.filePath || e.path;
					t && this.allFilesMap.set(t, e);
				}), console.log(`[${this.componentName}] ✅ 已加载 ${t.length} 个文件，${Object.keys(n).length} 个目录`);
			} catch (e) {
				console.error(`[${this.componentName}] ❌ 加载服务器文件失败:`, e), alert(`加载服务器文件失败！\n\n错误：${e.message}\n\n请检查：\n1. API 服务器是否启动（端口 8081）\n2. 网络连接是否正常`), this.serverFiles = [], this.serverDirectories = {}, this.allFilesMap = /* @__PURE__ */ new Map();
			} finally {
				this.loadingServerFiles = !1;
			}
		},
		navigateToDirectory(e) {
			let t = this.currentServerDirectory ? `${this.currentServerDirectory}/${e}` : e;
			console.log(`[${this.componentName}] 📂 进入目录: ${t}`), this.currentServerDirectory = t;
		},
		navigateToParentDirectory() {
			if (!this.currentServerDirectory) return;
			let e = this.currentServerDirectory.lastIndexOf("/"), t = e === -1 ? "" : this.currentServerDirectory.substring(0, e);
			console.log(`[${this.componentName}] 🔙 返回上级目录: ${t || "(根目录)"}`), this.currentServerDirectory = t;
		},
		async selectServerFile(e) {
			if (!e) {
				this.selectedServerFile = null;
				return;
			}
			let t = e.fileName || e.name, n = e.filePath || e.path;
			console.log(`[${this.componentName}] 📄 选择文件: ${t}`), console.log(`[${this.componentName}] 文件路径: ${n}`), this.selectedServerFile = e;
			let r = `确认导入文件：${t}\n\n这将覆盖当前配置。`;
			if (!confirm(r)) {
				console.log(`[${this.componentName}] ⚠️ 用户取消导入`);
				return;
			}
			let i = await X.loadFromServer(Q);
			if (!i) {
				alert("从服务器加载文件失败！\n\n请检查网络连接");
				return;
			}
			let a = X.validateConfig(Q, i);
			if (!a.valid) {
				alert(`服务器数据验证失败:\n${a.errors.join("\n")}`);
				return;
			}
			this.obliquePhotographyList = i.map((e) => ({
				...e,
				loaded: !1,
				heightOffset: 0,
				loading: !1
			})), console.log(`[${this.componentName}] ✅ 从服务器导入配置成功，共 ${this.obliquePhotographyList.length} 条`), this.closeImportDialog(), alert(`配置已成功从服务器导入！\n\n文件：${t}\n共导入 ${this.obliquePhotographyList.length} 条配置。`);
		},
		closeImportDialog() {
			this.showImportDialog = !1, this.selectedServerFile = null;
		},
		formatDate(e) {
			if (!e) return "未知";
			let t = new Date(e);
			return isNaN(t.getTime()) ? "无效日期" : `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
		},
		formatFileSize(e) {
			if (!e || e === 0) return "0 B";
			let t = 1024, n = [
				"B",
				"KB",
				"MB",
				"GB"
			], r = Math.floor(Math.log(e) / Math.log(t));
			return parseFloat((e / t ** r).toFixed(1)) + " " + n[r];
		},
		getConfigStats() {
			let e = this.obliquePhotographyList.map((e) => ({
				id: e.id,
				name: e.name,
				url: e.url
			}));
			return X.getConfigStats(Q, e);
		},
		closeDialog() {
			this.showAddDialog = !1, this.showEditDialog = !1, this.formData = {
				id: "",
				name: "",
				url: ""
			}, this.editingItem = null;
		},
		openEditDialog(e) {
			this.editingItem = e, this.formData = {
				id: e.id,
				name: e.name,
				url: e.url
			}, this.showEditDialog = !0;
		},
		async saveItem() {
			if (!this.formData.id || !this.formData.name || !this.formData.url) {
				alert("请填写所有必填字段");
				return;
			}
			if (this.showEditDialog && this.editingItem) {
				let e = this.obliquePhotographyList.findIndex((e) => e.id === this.editingItem.id);
				e !== -1 && (this.obliquePhotographyList[e] = {
					...this.obliquePhotographyList[e],
					name: this.formData.name,
					url: this.formData.url
				});
			} else {
				if (this.obliquePhotographyList.some((e) => e.id === this.formData.id)) {
					alert("ID已存在，请使用唯一的ID");
					return;
				}
				this.obliquePhotographyList.push({
					id: this.formData.id,
					name: this.formData.name,
					url: this.formData.url,
					loaded: !1,
					heightOffset: 0,
					loading: !1
				});
			}
			await this.saveToJson(), this.closeDialog();
		},
		confirmDelete(e) {
			if (e.loaded) {
				alert("请先卸载倾斜摄影再删除");
				return;
			}
			this.deleteTarget = e, this.showDeleteDialog = !0;
		},
		async executeDelete() {
			if (!this.deleteTarget) return;
			let e = this.obliquePhotographyList.findIndex((e) => e.id === this.deleteTarget.id);
			e !== -1 && (this.obliquePhotographyList.splice(e, 1), await this.saveToJson()), this.showDeleteDialog = !1, this.deleteTarget = null;
		},
		async toggleObliquePhotography(e) {
			if (!this.getCesiumViewer()) {
				console.error(`[${this.componentName}] Cesium Viewer 未初始化`);
				return;
			}
			e.loaded ? await this.unloadObliquePhotography(e) : await this.loadObliquePhotography(e);
		},
		async loadObliquePhotography(e) {
			let t = this.getCesiumViewer(), n = this.getCesium();
			if (!t || !n) {
				console.error(`[${this.componentName}] Cesium 未就绪`);
				return;
			}
			console.log(`[${this.componentName}] 加载倾斜摄影: ${e.name}`);
			let r = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
			r !== -1 && (this.obliquePhotographyList[r].loading = !0, this.obliquePhotographyList = [...this.obliquePhotographyList]);
			try {
				let r = new n.Cesium3DTileset({
					url: e.url,
					show: !0,
					maximumScreenSpaceError: 16,
					skipLevelOfDetail: !0,
					baseScreenSpaceError: 1024,
					skipScreenSpaceErrorFactor: 16,
					skipLevels: 1,
					immediatelyLoadDesiredLevelOfDetail: !1,
					loadSiblings: !1,
					dynamicScreenSpaceError: !0,
					dynamicScreenSpaceErrorDensity: .00278,
					dynamicScreenSpaceErrorFactor: 4,
					dynamicScreenSpaceErrorHeightFalloff: .25,
					debugShowBoundingVolume: !1,
					debugShowContentBoundingVolume: !1,
					debugShowViewerRequestVolume: !1
				});
				this._cesiumTilesets.set(e.id, r), t.scene.primitives.add(r);
				let i = () => {
					if (console.log(`[${this.componentName}] 倾斜摄影加载完成: ${e.name}`), r.boundingSphere) {
						let t = r.boundingSphere;
						console.log(`[${this.componentName}] ${e.name} 边界球:`, {
							中心X: t.center.x.toFixed(2),
							中心Y: t.center.y.toFixed(2),
							中心Z: t.center.z.toFixed(2),
							半径: t.radius.toFixed(2) + "米"
						});
					}
					let i = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
					if (i !== -1 && (this.obliquePhotographyList[i].loading = !1, this.obliquePhotographyList[i].loaded = !0, this.obliquePhotographyList = [...this.obliquePhotographyList]), r.root && r.root.transform) {
						let t = n.Matrix4.clone(r.root.transform);
						this._cesiumTransforms.set(e.id, t);
					}
					r.boundingSphere && (t.camera.flyToBoundingSphere(r.boundingSphere, {
						duration: 2,
						offset: new n.HeadingPitchRange(0, -45, r.boundingSphere.radius * 2)
					}), console.log(`[${this.componentName}] 🎯 已自动定位到 ${e.name}`));
				}, a = (t) => {
					console.error(`[${this.componentName}] 倾斜摄影加载失败: ${e.name}`, t);
					let n = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
					n !== -1 && (this.obliquePhotographyList[n].loading = !1, this.obliquePhotographyList[n].loaded = !1, this.obliquePhotographyList = [...this.obliquePhotographyList]);
				};
				if (r.readyPromise && (typeof Promise < "u" && r.readyPromise instanceof Promise ? r.readyPromise.then(i).catch(a) : typeof r.readyPromise.then == "function" && (r.readyPromise.then(i), typeof r.readyPromise.otherwise == "function" && r.readyPromise.otherwise(a))), this._cesiumErrorHandlers = this._cesiumErrorHandlers || /* @__PURE__ */ new Map(), r.tileFailed) {
					let t = a;
					r.tileFailed.addEventListener(t), this._cesiumErrorHandlers.set(e.id, {
						tileset: r,
						errorHandler: t
					});
				}
			} catch (t) {
				console.error(`[${this.componentName}] 倾斜摄影加载失败: ${e.name}`, t);
				let n = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
				n !== -1 && (this.obliquePhotographyList[n].loading = !1, this.obliquePhotographyList[n].loaded = !1, this.obliquePhotographyList = [...this.obliquePhotographyList]);
			}
		},
		unloadObliquePhotography(e) {
			let t = this.getCesiumViewer();
			if (!t) {
				console.error(`[${this.componentName}] Cesium Viewer 未初始化`);
				return;
			}
			console.log(`[${this.componentName}] 卸载倾斜摄影: ${e.name}`);
			let n = this._cesiumTilesets.get(e.id);
			if (n) try {
				t.scene.primitives.remove(n), this._cesiumTilesets.delete(e.id), this._cesiumTransforms.delete(e.id), this._cesiumHeightOffsets.delete(e.id);
				let r = this._cesiumErrorHandlers?.get(e.id);
				r && r.tileset.tileFailed && (r.tileset.tileFailed.removeEventListener(r.errorHandler), this._cesiumErrorHandlers.delete(e.id));
				let i = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
				i !== -1 && (this.obliquePhotographyList[i].loaded = !1, this.obliquePhotographyList = [...this.obliquePhotographyList]), console.log(`[${this.componentName}] 倾斜摄影已卸载: ${e.name}`);
			} catch (t) {
				console.error(`[${this.componentName}] 倾斜摄影卸载失败: ${e.name}`, t);
			}
		},
		locateToObliquePhotography(e) {
			let t = this.getCesiumViewer(), n = this.getCesium();
			if (!t || !n) {
				console.error(`[${this.componentName}] Cesium 未就绪`);
				return;
			}
			console.log(`[${this.componentName}] 定位到倾斜摄影: ${e.name}`);
			let r = this._cesiumTilesets.get(e.id);
			if (!r || !e.loaded) {
				console.warn(`[${this.componentName}] 倾斜摄影未加载，无法定位: ${e.name}`);
				return;
			}
			try {
				if (r.boundingSphere) {
					let i = r.boundingSphere;
					t.camera.flyToBoundingSphere(i, {
						duration: 2,
						offset: new n.HeadingPitchRange(0, -45, i.radius * 2)
					}), console.log(`[${this.componentName}] 相机已定位到倾斜摄影位置: ${e.name}`);
				}
			} catch (t) {
				console.error(`[${this.componentName}] 定位到倾斜摄影失败: ${e.name}`, t);
			}
		},
		openHeightAdjust(e) {
			this.selectedLayer = e, this.selectedItemId = e.id, this.showHeightPanel = !0;
		},
		onHeightPreview({ layer: e, value: t }) {
			if (!e) return;
			this._cesiumHeightOffsets.set(e.id, t);
			let n = this.obliquePhotographyList.findIndex((t) => t.id === e.id);
			n !== -1 && (this.obliquePhotographyList[n].heightOffset = t, this.obliquePhotographyList = [...this.obliquePhotographyList]);
		},
		onHeightChange({ layer: e, value: t }) {
			e && (this._cesiumHeightOffsets.set(e.id, t), console.log(`[${this.componentName}] ${e.name} 高度偏移调整为: ${t.toFixed(1)} 米`), this.applyObliqueHeightOffset(e));
		},
		applyObliqueHeightOffset(e) {
			let t = this.getCesiumViewer(), n = this.getCesium(), r = this._cesiumTilesets.get(e.id), i = this._cesiumTransforms.get(e.id);
			if (!t || !n || !r || !e.loaded) {
				console.warn(`[${this.componentName}] 倾斜摄影未加载，无法应用高度偏移: ${e.name}`);
				return;
			}
			if (!i) {
				console.warn(`[${this.componentName}] 未找到初始变换矩阵，无法应用相对偏移: ${e.name}`);
				return;
			}
			try {
				if (r.root) {
					let t = n.Matrix4.clone(i), a = this._cesiumHeightOffsets.get(e.id) || 0, o = new n.Cartesian3(0, 0, a), s = n.Matrix4.fromTranslation(o);
					n.Matrix4.multiply(t, s, t), r.root.transform = t, console.log(`[${this.componentName}] ${e.name} 高度偏移已应用`);
				}
			} catch (t) {
				console.error(`[${this.componentName}] 应用高度偏移失败: ${e.name}`, t);
			}
		}
	}
}, Ne = { class: "toolbar" }, Pe = { class: "oblique-list" }, Fe = { class: "item-main" }, Ie = { class: "oblique-checkbox" }, Le = [
	"checked",
	"onChange",
	"disabled"
], Re = { class: "item-info" }, ze = { class: "oblique-name" }, Be = {
	key: 0,
	class: "loading-text"
}, Ve = {
	key: 1,
	class: "status-text loaded"
}, He = {
	key: 2,
	class: "status-text unloaded"
}, Ue = { class: "item-actions" }, We = [
	"onClick",
	"disabled",
	"aria-label"
], Ge = ["onClick", "aria-label"], Ke = ["onClick", "aria-label"], qe = ["onClick", "aria-label"], Je = {
	key: 0,
	class: "empty-state"
}, Ye = { class: "dialog-header" }, Xe = { class: "dialog-title" }, Ze = { class: "dialog-body" }, Qe = { class: "form-group" }, $e = ["disabled"], et = { class: "form-group" }, tt = { class: "form-group" }, nt = { class: "dialog-footer" }, rt = { class: "dialog-body" }, it = { class: "delete-warning" }, at = { class: "warning-text" }, ot = { class: "dialog-footer" }, st = { class: "dialog-header" }, ct = { class: "dialog-body" }, lt = { class: "server-info" }, ut = { class: "server-url" }, dt = { class: "file-browser" }, ft = { class: "directory-nav" }, pt = { class: "nav-path" }, mt = {
	key: 0,
	class: "file-list"
}, ht = ["onClick"], gt = { class: "file-info" }, _t = { class: "file-name" }, vt = ["onClick"], yt = { class: "file-info" }, $ = { class: "file-name" }, bt = { class: "file-path" }, xt = { class: "file-meta" }, St = { class: "file-size" }, Ct = { class: "file-date" }, wt = {
	key: 1,
	class: "file-list loading"
}, Tt = {
	key: 2,
	class: "empty-state"
}, Et = { class: "dialog-footer" }, Dt = ["disabled"];
function Ot(l, u, f, h, _, y) {
	let x = g("FunctionPanelUIBase"), T = g("ObliqueHeightAdjustPanel");
	return p(), a(e, null, [c(x, {
		ref: "basePanel",
		title: "倾斜摄影加载",
		"title-icon": "📷",
		width: 420,
		"max-height": "70vh",
		"initial-x": f.initialX,
		"initial-y": f.initialY,
		"allow-minimize": !0,
		"registration-key": f.registrationKey || "ObliquePhotographyPanel",
		"panel-instance-id": f.panelInstanceId,
		"auto-register": f.autoRegister === void 0 ? !0 : f.autoRegister,
		"lazy-load": f.lazyLoad || y.getConfigLazyLoad(),
		"close-event-name": "obliquePhotographyPanelClose",
		onClose: y.handleClose,
		onMinimize: y.handleMinimize,
		onExpand: y.handleExpand,
		onLazyLoad: y.onLazyLoad
	}, {
		default: S(() => [
			o("div", Ne, [
				o("button", {
					onClick: u[0] ||= (e) => _.showAddDialog = !0,
					class: "tool-btn add-btn",
					title: "添加倾斜摄影数据"
				}, [...u[23] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M12 5v14M5 12h14",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 添加 ", -1)]]),
				o("button", {
					onClick: u[1] ||= (...e) => y.exportConfig && y.exportConfig(...e),
					class: "tool-btn export-btn",
					title: "导出配置到服务器 JSON 文件"
				}, [...u[24] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 导出 ", -1)]]),
				o("button", {
					onClick: u[2] ||= (...e) => y.importConfig && y.importConfig(...e),
					class: "tool-btn import-btn",
					title: "从服务器 JSON 文件导入配置"
				}, [...u[25] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 导入 ", -1)]]),
				o("button", {
					onClick: u[3] ||= (...e) => y.refreshFromJson && y.refreshFromJson(...e),
					class: "tool-btn refresh-btn",
					title: "从服务器刷新 JSON 数据"
				}, [...u[26] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M23 4v6h-6M1 20v-6h6",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}), o("path", {
					d: "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 刷新 ", -1)]])
			]),
			o("div", Pe, [(p(!0), a(e, null, m(_.obliquePhotographyList, (e) => (p(), a("div", {
				key: e.id,
				class: d(["oblique-item", {
					"is-loaded": e.loaded,
					"is-loading": e.loading,
					"is-selected": _.selectedItemId === e.id
				}])
			}, [o("div", Fe, [o("label", Ie, [
				o("input", {
					type: "checkbox",
					checked: e.loaded || !1,
					onChange: (t) => y.toggleObliquePhotography(e),
					disabled: e.loading || !1,
					class: "checkbox-input"
				}, null, 40, Le),
				u[27] ||= o("span", { class: "check-indicator" }, null, -1),
				o("div", Re, [o("span", ze, v(e.name || "未知"), 1), e.loading ? (p(), a("span", Be, "加载中...")) : e.loaded ? (p(), a("span", Ve, "已加载")) : (p(), a("span", He, "未加载"))])
			])]), o("div", Ue, [
				o("button", {
					onClick: (t) => y.locateToObliquePhotography(e),
					class: "action-btn locate-btn",
					type: "button",
					disabled: !e.loaded,
					"aria-label": `定位到 ${e.name}`,
					title: "定位到3D Tiles位置"
				}, [...u[28] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}), o("circle", {
					cx: "12",
					cy: "10",
					r: "3",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)]], 8, We),
				e.loaded ? (p(), a("button", {
					key: 0,
					onClick: (t) => y.openHeightAdjust(e),
					class: "action-btn height-btn",
					type: "button",
					"aria-label": `调整 ${e.name} 高度`,
					title: "高度调整"
				}, [...u[29] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M12 19V5M5 12l7-7 7 7",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)]], 8, Ge)) : i("", !0),
				o("button", {
					onClick: (t) => y.openEditDialog(e),
					class: "action-btn edit-btn",
					type: "button",
					"aria-label": `编辑 ${e.name}`,
					title: "编辑"
				}, [...u[30] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}), o("path", {
					d: "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)]], 8, Ke),
				o("button", {
					onClick: (t) => y.confirmDelete(e),
					class: "action-btn delete-btn",
					type: "button",
					"aria-label": `删除 ${e.name}`,
					title: "删除"
				}, [...u[31] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)]], 8, qe)
			])], 2))), 128))]),
			_.obliquePhotographyList.length === 0 ? (p(), a("div", Je, [...u[32] ||= [
				o("svg", {
					class: "empty-icon",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1),
				o("div", { class: "empty-title" }, "暂无倾斜摄影数据", -1),
				o("div", { class: "empty-hint" }, "点击\"添加\"按钮导入倾斜摄影配置", -1)
			]])) : i("", !0),
			(p(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: S(() => [_.showAddDialog || _.showEditDialog ? (p(), a("div", {
					key: 0,
					class: "dialog-overlay",
					onClick: u[11] ||= w((...e) => y.closeDialog && y.closeDialog(...e), ["self"])
				}, [o("div", {
					class: "dialog",
					onClick: u[10] ||= w(() => {}, ["stop"])
				}, [
					o("div", Ye, [o("h3", Xe, v(_.showEditDialog ? "编辑倾斜摄影" : "添加倾斜摄影"), 1), o("button", {
						onClick: u[4] ||= (...e) => y.closeDialog && y.closeDialog(...e),
						class: "dialog-close",
						"aria-label": "关闭对话框"
					}, [...u[33] ||= [o("svg", {
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2"
					}, [o("path", {
						d: "M18 6L6 18M6 6l12 12",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					})], -1)]])]),
					o("div", Ze, [
						o("div", Qe, [u[34] ||= o("label", { class: "form-label" }, [s("ID "), o("span", { class: "required" }, "*")], -1), C(o("input", {
							"onUpdate:modelValue": u[5] ||= (e) => _.formData.id = e,
							type: "text",
							class: "form-input",
							placeholder: "输入唯一标识符",
							disabled: _.showEditDialog
						}, null, 8, $e), [[b, _.formData.id]])]),
						o("div", et, [u[35] ||= o("label", { class: "form-label" }, [s("名称 "), o("span", { class: "required" }, "*")], -1), C(o("input", {
							"onUpdate:modelValue": u[6] ||= (e) => _.formData.name = e,
							type: "text",
							class: "form-input",
							placeholder: "输入显示名称"
						}, null, 512), [[b, _.formData.name]])]),
						o("div", tt, [u[36] ||= o("label", { class: "form-label" }, [s("URL "), o("span", { class: "required" }, "*")], -1), C(o("textarea", {
							"onUpdate:modelValue": u[7] ||= (e) => _.formData.url = e,
							class: "form-textarea",
							rows: "3",
							placeholder: "输入倾斜摄影数据URL"
						}, null, 512), [[b, _.formData.url]])])
					]),
					o("div", nt, [o("button", {
						onClick: u[8] ||= (...e) => y.closeDialog && y.closeDialog(...e),
						class: "dialog-btn cancel-btn"
					}, "取消"), o("button", {
						onClick: u[9] ||= (...e) => y.saveItem && y.saveItem(...e),
						class: "dialog-btn confirm-btn"
					}, "保存")])
				])])) : i("", !0)]),
				_: 1
			})])),
			(p(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: S(() => [_.showDeleteDialog ? (p(), a("div", {
					key: 0,
					class: "dialog-overlay",
					onClick: u[15] ||= w((e) => _.showDeleteDialog = !1, ["self"])
				}, [o("div", {
					class: "dialog dialog-small",
					onClick: u[14] ||= w(() => {}, ["stop"])
				}, [
					u[38] ||= o("div", { class: "dialog-header" }, [o("h3", { class: "dialog-title" }, "确认删除")], -1),
					o("div", rt, [o("div", it, [u[37] ||= o("svg", {
						class: "warning-icon",
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2"
					}, [o("path", {
						d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					})], -1), o("div", at, " 确定要删除 \"" + v(_.deleteTarget?.name) + "\" 吗？此操作无法撤销。 ", 1)])]),
					o("div", ot, [o("button", {
						onClick: u[12] ||= (e) => _.showDeleteDialog = !1,
						class: "dialog-btn cancel-btn"
					}, "取消"), o("button", {
						onClick: u[13] ||= (...e) => y.executeDelete && y.executeDelete(...e),
						class: "dialog-btn danger-btn"
					}, "删除")])
				])])) : i("", !0)]),
				_: 1
			})])),
			(p(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: S(() => [_.showImportDialog ? (p(), a("div", {
					key: 0,
					class: "dialog-overlay",
					onClick: u[21] ||= w((...e) => y.closeImportDialog && y.closeImportDialog(...e), ["self"])
				}, [o("div", {
					class: "dialog dialog-large",
					onClick: u[20] ||= w(() => {}, ["stop"])
				}, [
					o("div", st, [u[39] ||= o("h3", { class: "dialog-title" }, "📂 从服务器导入配置", -1), o("button", {
						onClick: u[16] ||= (...e) => y.closeImportDialog && y.closeImportDialog(...e),
						class: "close-btn",
						"aria-label": "关闭"
					}, "×")]),
					o("div", ct, [o("div", lt, [u[40] ||= o("span", { class: "server-label" }, "服务器：", -1), o("span", ut, v(_.apiServerURL), 1)]), o("div", dt, [
						o("div", ft, [
							y.canGoBack ? (p(), a("button", {
								key: 0,
								onClick: u[17] ||= (...e) => y.navigateToParentDirectory && y.navigateToParentDirectory(...e),
								class: "nav-btn back-btn",
								title: "返回上级目录"
							}, [...u[41] ||= [o("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2"
							}, [o("path", {
								d: "M19 12H5M12 19l-7-7 7-7",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							})], -1), s(" 返回 ", -1)]])) : i("", !0),
							u[42] ||= o("span", { class: "nav-label" }, "目录：", -1),
							o("span", pt, v(y.currentDirectoryDisplay), 1)
						]),
						_.loadingServerFiles ? (p(), a("div", wt, [...u[48] ||= [o("div", { class: "loading-spinner" }, null, -1), o("p", null, "正在加载服务器文件...", -1)]])) : (p(), a("div", mt, [(p(!0), a(e, null, m(y.currentSubdirectories, (e) => (p(), a("div", {
							key: "dir-" + e,
							class: "file-item directory-item",
							onClick: (t) => y.navigateToDirectory(e)
						}, [
							u[44] ||= o("div", { class: "file-icon" }, "📁", -1),
							o("div", gt, [o("div", _t, v(e), 1), u[43] ||= o("div", { class: "file-path" }, "目录", -1)]),
							u[45] ||= o("div", { class: "file-action" }, "📂", -1)
						], 8, ht))), 128)), (p(!0), a(e, null, m(y.currentDirectoryFiles, (e) => (p(), a("div", {
							key: e.path || e.filePath,
							class: d(["file-item", { "is-selected": _.selectedServerFile === e }]),
							onClick: (t) => y.selectServerFile(e)
						}, [
							u[46] ||= o("div", { class: "file-icon" }, "📄", -1),
							o("div", yt, [
								o("div", $, v(e.fileName || e.name), 1),
								o("div", bt, v(e.filePath || e.path), 1),
								o("div", xt, [o("span", St, v(y.formatFileSize(e.fileSize || e.size)), 1), o("span", Ct, v(y.formatDate(e.modifiedTime || e.modified)), 1)])
							]),
							u[47] ||= o("div", { class: "file-action" }, "📥", -1)
						], 10, vt))), 128))])),
						!_.loadingServerFiles && _.serverFiles.length === 0 ? (p(), a("div", Tt, [...u[49] ||= [
							o("div", { class: "empty-icon" }, "📁", -1),
							o("div", { class: "empty-title" }, "服务器上没有找到配置文件", -1),
							o("div", { class: "empty-hint" }, "请确保 API 服务器已启动", -1)
						]])) : i("", !0)
					])]),
					o("div", Et, [o("button", {
						onClick: u[18] ||= (...e) => y.closeImportDialog && y.closeImportDialog(...e),
						class: "dialog-btn cancel-btn"
					}, "取消"), o("button", {
						onClick: u[19] ||= (e) => y.loadServerFiles(),
						class: "dialog-btn secondary-btn",
						disabled: _.loadingServerFiles
					}, " 🔄 刷新 ", 8, Dt)])
				])])) : i("", !0)]),
				_: 1
			})]))
		]),
		_: 1
	}, 8, [
		"initial-x",
		"initial-y",
		"registration-key",
		"panel-instance-id",
		"auto-register",
		"lazy-load",
		"onClose",
		"onMinimize",
		"onExpand",
		"onLazyLoad"
	]), (p(), r(t, { to: "body" }, [c(n, { name: "height-panel-fade" }, {
		default: S(() => [_.showHeightPanel && _.selectedLayer ? (p(), r(T, {
			key: 0,
			"initial-x": y.computedHeightPanelX,
			"initial-y": f.initialY,
			"selected-layer": _.selectedLayer,
			onClose: u[22] ||= (e) => _.showHeightPanel = !1,
			onHeightPreview: y.onHeightPreview,
			onHeightChange: y.onHeightChange
		}, null, 8, [
			"initial-x",
			"initial-y",
			"selected-layer",
			"onHeightPreview",
			"onHeightChange"
		])) : i("", !0)]),
		_: 1
	})]))], 64);
}
var kt = /*#__PURE__*/ O(Me, [["render", Ot], ["__scopeId", "data-v-3d58609d"]]), At = {
	name: "MultiContentExample",
	components: { TestPanelModule: le },
	props: {
		registrationKey: {
			type: String,
			default: "MultiContentExample"
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		autoRegister: {
			type: Boolean,
			default: !0
		},
		initialX: {
			type: [Number, String],
			default: "center"
		},
		initialY: {
			type: Number,
			default: 280
		}
	},
	data() {
		return { selectedLayer: null };
	},
	methods: {
		switchToHeightPanel() {
			this.$refs.panel.setContent(Y, {
				props: { "selected-layer": this.selectedLayer },
				events: { "height-change": this.handleHeightChange },
				title: "高度调整",
				titleIcon: "🌏"
			});
		},
		switchToPhotoPanel() {
			this.$refs.panel.setContent(kt, {
				props: {
					"initial-x": "center",
					"initial-y": 120
				},
				events: { "layer-loaded": this.handleLayerLoaded },
				title: "倾斜摄影",
				titleIcon: "📷"
			});
		},
		handleHeightChange(e) {
			console.log("高度变化:", e);
		},
		handleLayerLoaded(e) {
			console.log("图层加载:", e);
		}
	}
};
function jt(e, t, n, i, a, s) {
	let c = g("TestPanelModule");
	return p(), r(c, u({
		ref: "panel",
		title: "多内容面板",
		"auto-register": n.autoRegister === void 0 ? !0 : n.autoRegister,
		"registration-key": n.registrationKey || "MultiContentExample",
		"panel-instance-id": n.panelInstanceId,
		"initial-x": n.initialX,
		"initial-y": n.initialY
	}, e.$attrs), {
		"toolbar-extra": S(() => [o("button", { onClick: t[0] ||= (...e) => s.switchToHeightPanel && s.switchToHeightPanel(...e) }, "高度调整"), o("button", { onClick: t[1] ||= (...e) => s.switchToPhotoPanel && s.switchToPhotoPanel(...e) }, "倾斜摄影")]),
		_: 1
	}, 16, [
		"auto-register",
		"registration-key",
		"panel-instance-id",
		"initial-x",
		"initial-y"
	]);
}
var Mt = /*#__PURE__*/ O(At, [["render", jt]]);
//#endregion
export { Mt as default };
