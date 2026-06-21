import { Fragment as e, Teleport as t, Transition as n, createBlock as r, createCommentVNode as i, createElementBlock as a, createElementVNode as o, createTextVNode as s, createVNode as c, normalizeClass as l, normalizeStyle as u, openBlock as d, renderList as f, renderSlot as p, resolveComponent as ee, toDisplayString as m, vShow as h, withCtx as g, withDirectives as _, withModifiers as v } from "vue";
//#region ../cesiumBase/src/utils/CesiumEventManager.js
var y = class {
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
}, b = typeof window < "u" && window.__cesiumEventManager__, x = b || new y();
!b && typeof window < "u" && (window.__cesiumEventManager__ = x, document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	x.init();
}) : x.init());
//#endregion
//#region \0plugin-vue:export-helper
var S = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, C = {
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
			}, t)), this.cesiumUnsubscribe = x.onReady((t, r) => {
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
}, w = {
	class: "sfc-base",
	style: { display: "none" }
};
function T(e, t, n, r, i, o) {
	return d(), a("div", w);
}
var E = /*#__PURE__*/ S(C, [["render", T]]), D = class {
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
}, O = typeof window < "u" && (window.__panelSingletonManager__ || window.panelSingletonManager), k = O || new D();
!O && typeof window < "u" && (window.__panelSingletonManager__ = k, window.panelSingletonManager = k);
//#endregion
//#region ../cesiumBase/src/components/FunctionPanelUIBase.vue
var A = typeof window < "u" && window.__panelSingletonManager__ || k, j = {
	name: "FunctionPanelUIBase",
	mixins: [E],
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
			if (A.hasPanel(e)) {
				let t = A.getPanel(e);
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
		}, A.addEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener)), !this.isClosed && this.lazyLoad && !this._contentLoaded && (console.log(`[FunctionPanelUIBase] 🔍 面板初始状态为打开，触发延迟加载: ${this.effectiveRegistrationKey}`), this._contentLoaded = !0, this.$nextTick(() => {
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
		this.autoRegister && this.effectiveRegistrationKey && this.unregisterFromParent(), this.boundMouseMove && (document.removeEventListener("mousemove", this.boundMouseMove), document.removeEventListener("mouseup", this.boundHandleMouseUp)), this.boundHandleKeydown && document.removeEventListener("keydown", this.boundHandleKeydown), this.panelInstanceId === null && this._panelStateChangeListener && A.removeEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener), this.cleanup();
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
				if (A) {
					let t = A.getPanel(this.effectiveRegistrationKey);
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
				if (console.log(`[FunctionPanelUIBase] 🔄 面板假关闭（单例模式）: ${this.effectiveRegistrationKey}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup(), A.updatePanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已通过 PanelSingletonManager 更新面板 ${this.effectiveRegistrationKey} 可见性为 false`), this.setPanelVisible && typeof this.setPanelVisible == "function") this.setPanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已设置面板 ${this.effectiveRegistrationKey} 可见性为 false`);
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
}, M = { class: "header-left" }, N = { class: "panel-title" }, P = { class: "header-controls" }, F = ["aria-label"], I = {
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
function te(e, s, f, ee, y, b) {
	return d(), r(t, { to: "body" }, [c(n, { name: "panel-fade" }, {
		default: g(() => [y.isClosed ? i("", !0) : (d(), a("div", {
			key: 0,
			class: l(["function-panel", {
				"is-dragging": y.isDragging,
				"is-minimized": y.isMinimized,
				"blur-enabled": f.enableBackdropFilter && f.enableBlur
			}]),
			style: u(b.panelStyles),
			ref: "panelRef",
			onMousedown: s[3] ||= (...e) => b.onPanelMouseDown && b.onPanelMouseDown(...e)
		}, [o("div", {
			class: "panel-header",
			onMousedown: s[2] ||= (...e) => b.onHeaderMouseDown && b.onHeaderMouseDown(...e)
		}, [o("div", M, [s[5] ||= o("div", { class: "drag-indicator" }, [
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" })
		], -1), p(e.$slots, "header", {}, () => [o("h3", N, m(f.title), 1)], !0)]), o("div", P, [f.allowMinimize ? (d(), a("button", {
			key: 0,
			onClick: s[0] ||= v((...e) => b.toggleMinimize && b.toggleMinimize(...e), ["stop"]),
			class: "icon-btn minimize-btn",
			type: "button",
			"aria-label": y.isMinimized ? "展开" : "最小化"
		}, [(d(), a("svg", I, [y.isMinimized ? (d(), a("path", R)) : (d(), a("path", L))]))], 8, F)) : i("", !0), o("button", {
			onClick: s[1] ||= v((...e) => b.close && b.close(...e), ["stop"]),
			class: "icon-btn close-btn",
			type: "button",
			"aria-label": f.closeTooltip
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
			default: g(() => [_(o("div", {
				class: "panel-body",
				style: u(b.bodyStyles)
			}, [p(e.$slots, "default", {
				isClosed: y.isClosed,
				panelInstanceId: f.panelInstanceId,
				isSingleton: b.isSingletonByConfig
			}, void 0, !0)], 4), [[h, !y.isMinimized]])]),
			_: 3
		})], 38))]),
		_: 3
	}), c(n, { name: "fab-fade" }, {
		default: g(() => [!y.isClosed && y.isMinimized ? (d(), a("button", {
			key: 0,
			class: "panel-fab",
			type: "button",
			style: u(b.fabStyles),
			onClick: s[4] ||= (...e) => b.toggleMinimize && b.toggleMinimize(...e),
			title: f.title
		}, [o("span", V, m(f.titleIcon || "⚙️"), 1), o("span", H, m(f.title), 1)], 12, B)) : i("", !0)]),
		_: 1
	})]);
}
//#endregion
//#region ../cesiumBase/src/components/functions/ObliqueHeightAdjustPanel.vue
var U = {
	name: "ObliqueHeightAdjustPanel",
	components: { FunctionPanelUIBase: /* @__PURE__ */ S(j, [["render", te], ["__scopeId", "data-v-2ca14fbb"]]) },
	mixins: [E],
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
}, W = {
	key: 0,
	class: "recommended-offset-banner"
}, G = { class: "banner-content" }, K = { class: "banner-text" }, q = { class: "banner-suggestion" }, J = { class: "highlight" }, Y = ["disabled"], X = { class: "current-height-card" }, Z = { class: "height-value" }, Q = { class: "value" }, ne = { class: "adjustment-section" }, re = { class: "slider-container" }, ie = ["value"], ae = { class: "precise-input-section" }, oe = { class: "input-group" }, $ = ["value"], se = { class: "preset-section" }, ce = { class: "preset-grid" }, le = ["onClick"], ue = {
	key: 1,
	class: "empty-state"
};
function de(t, n, c, u, p, h) {
	let _ = ee("FunctionPanelUIBase");
	return d(), r(_, {
		title: h.panelTitle,
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
		onClose: h.handleClose,
		onMinimize: h.handleMinimize,
		onExpand: h.handleExpand
	}, {
		default: g(() => [c.selectedLayer ? (d(), a(e, { key: 0 }, [
			c.selectedLayer.loaded && c.selectedLayer.recommendedOffset !== void 0 && c.selectedLayer.recommendedOffset !== null ? (d(), a("div", W, [o("div", G, [
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
				o("div", K, [n[7] ||= o("div", { class: "banner-main" }, "检测到倾斜摄影地形高度较低", -1), o("div", q, [
					n[5] ||= s(" 建议向上偏移 ", -1),
					o("span", J, m(c.selectedLayer.recommendedOffset.toFixed(1)) + " 米", 1),
					n[6] ||= s(" 以与大坐标模型底部对齐 ", -1)
				])]),
				o("button", {
					onClick: n[0] ||= (...e) => h.applyRecommendedOffset && h.applyRecommendedOffset(...e),
					class: "apply-recommended-btn",
					disabled: Math.abs(c.selectedLayer.heightOffset - c.selectedLayer.recommendedOffset) < .1
				}, m(Math.abs(c.selectedLayer.heightOffset - c.selectedLayer.recommendedOffset) < .1 ? "已应用" : "应用推荐值"), 9, Y)
			])])) : i("", !0),
			o("div", X, [n[10] ||= o("div", { class: "card-header" }, [o("h4", { class: "card-title" }, "当前高度偏移"), o("span", {
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
			})])])], -1), o("div", Z, [o("span", Q, m((c.selectedLayer.heightOffset || 0).toFixed(2)), 1), n[9] ||= o("span", { class: "unit" }, "米", -1)])]),
			o("div", ne, [
				n[12] ||= o("div", { class: "section-label" }, [o("span", null, "调整偏移"), o("span", { class: "range-hint" }, "-2000m ~ +2000m")], -1),
				o("div", re, [o("input", {
					type: "range",
					min: "-2000",
					max: "2000",
					step: "1",
					value: c.selectedLayer.heightOffset || 0,
					onInput: n[1] ||= (...e) => h.onHeightSliderInput && h.onHeightSliderInput(...e),
					onChange: n[2] ||= (...e) => h.onHeightSliderChange && h.onHeightSliderChange(...e),
					class: "height-slider"
				}, null, 40, ie), n[11] ||= o("div", { class: "slider-track-fill" }, null, -1)]),
				n[13] ||= o("div", { class: "usage-hint" }, "调整后使倾斜摄影与大坐标模型高度对齐", -1)
			]),
			o("div", ae, [n[15] ||= o("label", { class: "input-label" }, "精确设置偏移（米）", -1), o("div", oe, [o("input", {
				type: "number",
				value: c.selectedLayer.heightOffset || 0,
				onChange: n[3] ||= (...e) => h.onHeightInputChange && h.onHeightInputChange(...e),
				class: "number-input",
				step: "0.1"
			}, null, 40, $), o("button", {
				onClick: n[4] ||= (...e) => h.resetToZero && h.resetToZero(...e),
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
			o("div", se, [n[16] ||= o("div", { class: "section-label" }, "快捷预设", -1), o("div", ce, [(d(!0), a(e, null, f(p.presets, (e) => (d(), a("button", {
				key: e.value,
				onClick: (t) => h.applyPreset(e.value),
				class: l(["preset-btn", { active: Math.abs(c.selectedLayer.heightOffset - e.value) < .1 }])
			}, m(e.label), 11, le))), 128))])])
		], 64)) : (d(), a("div", ue, [...n[17] ||= [o("svg", {
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
var fe = /*#__PURE__*/ S(U, [["render", de], ["__scopeId", "data-v-80456ab5"]]);
//#endregion
export { fe as default };
