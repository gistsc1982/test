import { Teleport as e, Transition as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createVNode as o, markRaw as s, mergeProps as c, normalizeClass as l, normalizeStyle as u, openBlock as d, renderSlot as f, resolveComponent as p, resolveDynamicComponent as m, toDisplayString as h, toHandlers as g, vShow as _, withCtx as v, withDirectives as y, withModifiers as b } from "vue";
//#region ../../GISBIM/cesiumBase/src/utils/CesiumEventManager.js
var x = class {
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
}, S = typeof window < "u" && window.__cesiumEventManager__, C = S || new x();
!S && typeof window < "u" && (window.__cesiumEventManager__ = C, document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	C.init();
}) : C.init());
//#endregion
//#region \0plugin-vue:export-helper
var w = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, T = {
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
			}, t)), this.cesiumUnsubscribe = C.onReady((t, r) => {
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
}, E = {
	class: "sfc-base",
	style: { display: "none" }
};
function D(e, t, n, r, a, o) {
	return d(), i("div", E);
}
var O = /*#__PURE__*/ w(T, [["render", D]]), k = class {
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
}, A = typeof window < "u" && (window.__panelSingletonManager__ || window.panelSingletonManager), j = A || new k();
!A && typeof window < "u" && (window.__panelSingletonManager__ = j, window.panelSingletonManager = j);
//#endregion
//#region ../../GISBIM/cesiumBase/src/components/FunctionPanelUIBase.vue
var M = typeof window < "u" && window.__panelSingletonManager__ || j, N = {
	name: "FunctionPanelUIBase",
	mixins: [O],
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
			if (M.hasPanel(e)) {
				let t = M.getPanel(e);
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
		}, M.addEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener)), !this.isClosed && this.lazyLoad && !this._contentLoaded && (console.log(`[FunctionPanelUIBase] 🔍 面板初始状态为打开，触发延迟加载: ${this.effectiveRegistrationKey}`), this._contentLoaded = !0, this.$nextTick(() => {
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
		this.autoRegister && this.effectiveRegistrationKey && this.unregisterFromParent(), this.boundMouseMove && (document.removeEventListener("mousemove", this.boundMouseMove), document.removeEventListener("mouseup", this.boundHandleMouseUp)), this.boundHandleKeydown && document.removeEventListener("keydown", this.boundHandleKeydown), this.panelInstanceId === null && this._panelStateChangeListener && M.removeEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener), this.cleanup();
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
				if (M) {
					let t = M.getPanel(this.effectiveRegistrationKey);
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
				if (console.log(`[FunctionPanelUIBase] 🔄 面板假关闭（单例模式）: ${this.effectiveRegistrationKey}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup(), M.updatePanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已通过 PanelSingletonManager 更新面板 ${this.effectiveRegistrationKey} 可见性为 false`), this.setPanelVisible && typeof this.setPanelVisible == "function") this.setPanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已设置面板 ${this.effectiveRegistrationKey} 可见性为 false`);
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
}, P = { class: "header-left" }, F = { class: "panel-title" }, I = { class: "header-controls" }, L = ["aria-label"], R = {
	width: "14",
	height: "14",
	viewBox: "0 0 14 14",
	fill: "none"
}, z = {
	key: 0,
	d: "M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, B = {
	key: 1,
	d: "M7 2V12M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, V = ["aria-label"], H = ["title"], U = { class: "fab-icon" }, W = { class: "fab-text" };
function G(s, c, p, m, g, x) {
	return d(), n(e, { to: "body" }, [o(t, { name: "panel-fade" }, {
		default: v(() => [g.isClosed ? r("", !0) : (d(), i("div", {
			key: 0,
			class: l(["function-panel", {
				"is-dragging": g.isDragging,
				"is-minimized": g.isMinimized,
				"blur-enabled": p.enableBackdropFilter && p.enableBlur
			}]),
			style: u(x.panelStyles),
			ref: "panelRef",
			onMousedown: c[3] ||= (...e) => x.onPanelMouseDown && x.onPanelMouseDown(...e)
		}, [a("div", {
			class: "panel-header",
			onMousedown: c[2] ||= (...e) => x.onHeaderMouseDown && x.onHeaderMouseDown(...e)
		}, [a("div", P, [c[5] ||= a("div", { class: "drag-indicator" }, [
			a("span", { class: "grip-dot" }),
			a("span", { class: "grip-dot" }),
			a("span", { class: "grip-dot" })
		], -1), f(s.$slots, "header", {}, () => [a("h3", F, h(p.title), 1)], !0)]), a("div", I, [p.allowMinimize ? (d(), i("button", {
			key: 0,
			onClick: c[0] ||= b((...e) => x.toggleMinimize && x.toggleMinimize(...e), ["stop"]),
			class: "icon-btn minimize-btn",
			type: "button",
			"aria-label": g.isMinimized ? "展开" : "最小化"
		}, [(d(), i("svg", R, [g.isMinimized ? (d(), i("path", B)) : (d(), i("path", z))]))], 8, L)) : r("", !0), a("button", {
			onClick: c[1] ||= b((...e) => x.close && x.close(...e), ["stop"]),
			class: "icon-btn close-btn",
			type: "button",
			"aria-label": p.closeTooltip
		}, [...c[6] ||= [a("svg", {
			width: "14",
			height: "14",
			viewBox: "0 0 14 14",
			fill: "none"
		}, [a("path", {
			d: "M2 2L12 12M12 2L2 12",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round"
		})], -1)]], 8, V)])], 32), o(t, { name: "content-slide" }, {
			default: v(() => [y(a("div", {
				class: "panel-body",
				style: u(x.bodyStyles)
			}, [f(s.$slots, "default", {
				isClosed: g.isClosed,
				panelInstanceId: p.panelInstanceId,
				isSingleton: x.isSingletonByConfig
			}, void 0, !0)], 4), [[_, !g.isMinimized]])]),
			_: 3
		})], 38))]),
		_: 3
	}), o(t, { name: "fab-fade" }, {
		default: v(() => [!g.isClosed && g.isMinimized ? (d(), i("button", {
			key: 0,
			class: "panel-fab",
			type: "button",
			style: u(x.fabStyles),
			onClick: c[4] ||= (...e) => x.toggleMinimize && x.toggleMinimize(...e),
			title: p.title
		}, [a("span", U, h(p.titleIcon || "⚙️"), 1), a("span", W, h(p.title), 1)], 12, H)) : r("", !0)]),
		_: 1
	})]);
}
//#endregion
//#region ../../GISBIM/cesiumBase/src/components/functions/TestPanelModule.vue
var K = {
	name: "TestPanelModule",
	components: { FunctionPanelUIBase: /* @__PURE__ */ w(N, [["render", G], ["__scopeId", "data-v-2ca14fbb"]]) },
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
				this.dynamicContent.component = s(e.default || e), this.dynamicContent.props = n, this.dynamicContent.events = r, this.dynamicContent.title = i, this.dynamicContent.titleIcon = a;
			}).catch((t) => {
				console.error("[TestPanelModule] 组件加载失败:", e, t);
			}) : (this.dynamicContent.component = s(e), this.dynamicContent.props = n, this.dynamicContent.events = r, this.dynamicContent.title = i, this.dynamicContent.titleIcon = a);
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
}, q = { class: "test-panel-content" }, J = { class: "demo-section" }, Y = { class: "status-info" }, X = { class: "status-item" }, Z = { class: "value" };
function Q(e, t, r, i, o, s) {
	let l = p("FunctionPanelUIBase");
	return d(), n(l, c(s.filteredAttrs, {
		title: s.effectiveTitle,
		"title-icon": s.effectiveTitleIcon,
		width: r.width,
		"max-height": r.maxHeight,
		"initial-x": r.initialX,
		"initial-y": r.initialY,
		"allow-minimize": r.allowMinimize,
		"close-event-name": r.closeEventName,
		"auto-register": r.autoRegister === !0,
		"registration-key": r.registrationKey || "TestPanelModule",
		"panel-instance-id": r.panelInstanceId,
		onClose: s.handleClose,
		onMinimize: s.handleMinimize,
		onExpand: s.handleExpand
	}), {
		default: v((r) => [o.dynamicContent.component ? (d(), n(m(o.dynamicContent.component), c({ key: 0 }, {
			...o.dynamicContent.props,
			isClosed: r.isClosed,
			panelInstanceId: r.panelInstanceId
		}, g(o.dynamicContent.events)), null, 16)) : f(e.$slots, "content", {
			key: 1,
			isClosed: r.isClosed,
			panelInstanceId: r.panelInstanceId,
			isSingleton: r.isSingleton
		}, () => [a("div", q, [
			t[6] ||= a("div", { class: "section-title" }, "🎉 自动加载测试", -1),
			t[7] ||= a("p", { class: "hint-text" }, " 这个面板是通过以下方式自动加载的： ", -1),
			t[8] ||= a("ul", { class: "feature-list" }, [
				a("li", null, "✅ 放置在 functions 目录下"),
				a("li", null, "✅ 启用 auto-register=\"true\""),
				a("li", null, "✅ 设置 registration-key=\"TestPanelModule\""),
				a("li", null, "✅ CesiumMain 自动导入并渲染")
			], -1),
			a("div", J, [
				t[2] ||= a("div", { class: "section-label" }, "演示功能", -1),
				a("button", {
					onClick: t[0] ||= (...e) => s.showAlert && s.showAlert(...e),
					class: "demo-btn"
				}, " 🔔 测试事件 "),
				a("button", {
					onClick: t[1] ||= (...e) => s.increment && s.increment(...e),
					class: "demo-btn"
				}, " 📊 计数器: " + h(o.count), 1)
			]),
			a("div", Y, [
				a("div", X, [t[3] ||= a("span", { class: "label" }, "组件名称:", -1), a("span", Z, h(o.componentName), 1)]),
				t[4] ||= a("div", { class: "status-item" }, [a("span", { class: "label" }, "注册状态:"), a("span", { class: "value success" }, "已注册 ✓")], -1),
				t[5] ||= a("div", { class: "status-item" }, [a("span", { class: "label" }, "渲染方式:"), a("span", { class: "value" }, "动态组件")], -1)
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
//#endregion
//#region ../../GISBIM/cesiumBase/src/components/functions/examples/SlotExample.vue
var $ = {
	name: "SlotExample",
	components: { TestPanelModule: /* @__PURE__ */ w(K, [["render", Q], ["__scopeId", "data-v-9092d2be"]]) },
	methods: { handleClick() {
		console.log("自定义按钮点击"), alert("自定义内容工作正常！");
	} }
}, ee = { class: "custom-content" };
function te(e, t, r, i, o, s) {
	let c = p("TestPanelModule");
	return d(), n(c, {
		ref: "panel",
		title: "自定义面板示例",
		"title-icon": "🚀",
		width: 400,
		"registration-key": "SlotExample"
	}, {
		content: v(() => [a("div", ee, [
			t[1] ||= a("h3", null, "自定义内容区域", -1),
			t[2] ||= a("p", null, "这是通过插槽替换的内容", -1),
			a("button", { onClick: t[0] ||= (...e) => s.handleClick && s.handleClick(...e) }, "点击测试")
		])]),
		_: 1
	}, 512);
}
var ne = /*#__PURE__*/ w($, [["render", te], ["__scopeId", "data-v-7ec5df66"]]);
//#endregion
export { ne as default };
