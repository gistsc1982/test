import { Fragment as e, Teleport as t, Transition as n, createBlock as r, createCommentVNode as i, createElementBlock as a, createElementVNode as o, createTextVNode as s, createVNode as c, normalizeClass as l, normalizeStyle as u, openBlock as d, renderList as f, renderSlot as p, resolveComponent as ee, toDisplayString as m, vModelDynamic as h, vModelSelect as g, vModelText as te, vShow as _, withCtx as v, withDirectives as y, withKeys as b, withModifiers as x } from "vue";
var S = new class {
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
}();
typeof window < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	S.init();
}) : S.init(), window.__cesiumEventManager__ = S);
//#endregion
//#region \0plugin-vue:export-helper
var C = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, w = {
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
			}, t)), this.cesiumUnsubscribe = S.onReady((t, r) => {
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
}, T = {
	class: "sfc-base",
	style: { display: "none" }
};
function E(e, t, n, r, i, o) {
	return d(), a("div", T);
}
var D = /*#__PURE__*/ C(w, [["render", E]]), O = new class {
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
		}), typeof window < "u" && (window.__panelSingletonManager__ || (window.__panelSingletonManager__ = this));
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
		if (n) {
			if (n.visible = t, n._visibilityExplicitlySet = !0, t ? n.isClosed = !1 : n.isClosed = !0, console.log(`[PanelSingletonManager] 🔄 更新面板可见性: ${e} = ${t}, isClosed = ${n.isClosed}`), n.component && typeof n.component == "object") {
				let t = n.component.isClosed;
				n.component.isClosed = n.isClosed, console.log(`[PanelSingletonManager] 🔧 直接更新组件 isClosed: ${t} -> ${n.component.isClosed}`), n.component.$forceUpdate && typeof n.component.$forceUpdate == "function" && (n.component.$forceUpdate(), console.log(`[PanelSingletonManager] ✅ 强制重新渲染面板组件: ${e}`));
			}
			this.emitEvent(e, {
				type: "visibleChange",
				panelName: e,
				visible: t,
				isClosed: n.isClosed
			});
		} else console.warn(`[PanelSingletonManager] ⚠️ 面板 ${e} 未注册，无法更新可见性`);
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
}(), k = {
	name: "FunctionPanelUIBase",
	mixins: [D],
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
			if (O.hasPanel(e)) {
				let t = O.getPanel(e);
				if (t) {
					let n = this.isClosed;
					this.isClosed = t.isClosed, console.log(`[FunctionPanelUIBase] 🔓 从 PanelSingletonManager 同步面板状态: ${e}, isClosed: ${n} -> ${this.isClosed}`);
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
		}, O.addEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener)), !this.isClosed && this.lazyLoad && !this._contentLoaded && (console.log(`[FunctionPanelUIBase] 🔍 面板初始状态为打开，触发延迟加载: ${this.effectiveRegistrationKey}`), this._contentLoaded = !0, this.$nextTick(() => {
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
		this.autoRegister && this.effectiveRegistrationKey && this.unregisterFromParent(), this.boundMouseMove && (document.removeEventListener("mousemove", this.boundMouseMove), document.removeEventListener("mouseup", this.boundHandleMouseUp)), this.boundHandleKeydown && document.removeEventListener("keydown", this.boundHandleKeydown), this.panelInstanceId === null && this._panelStateChangeListener && O.removeEventListener(this.effectiveRegistrationKey, this._panelStateChangeListener), this.cleanup();
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
				}, n = !1, r = window.panelSingletonManager || window.__panelSingletonManager__;
				if (r) {
					let t = r.getPanel(this.effectiveRegistrationKey);
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
		initPosition() {
			let e = this.$refs.panelRef, t = !!e, n = this.isClosed;
			if (console.log(`[FunctionPanelUIBase] 🔧 初始化面板位置: ${this.effectiveRegistrationKey} #${this.panelInstanceId || "singleton"}`, {
				initialX: this.initialX,
				initialY: this.initialY,
				currentX: this.x,
				currentY: this.y,
				panelRef: t,
				panelRefElement: e ? e.tagName : "N/A",
				isClosed: n,
				windowInnerWidth: window.innerWidth,
				windowInnerHeight: window.innerHeight,
				panelWidth: this.width
			}), n) {
				console.log("[FunctionPanelUIBase] ⏸️ 面板已关闭，跳过位置初始化，等待面板打开");
				return;
			}
			if (!t) {
				console.warn("[FunctionPanelUIBase] ⚠️ panelRef 还不存在，延迟初始化位置"), this.$nextTick(() => {
					this.initPosition();
				});
				return;
			}
			let r = this.initialX;
			if (r === "center") {
				let e = this.$refs.panelRef, t = e ? e.offsetWidth : this.width;
				r = Math.round((window.innerWidth - t) / 2), console.log("[FunctionPanelUIBase] 📍 居中计算:", {
					panelWidth: t,
					calculatedX: r
				});
			} else if (r === "right") {
				let e = this.$refs.panelRef, t = e ? e.offsetWidth : this.width, n = Math.max(20, t / 2);
				r = Math.round(window.innerWidth - t - n), console.log("[FunctionPanelUIBase] 📍 右侧对齐计算:", {
					panelWidth: t,
					windowInnerWidth: window.innerWidth,
					rightMargin: n,
					calculatedX: r
				});
			} else typeof r != "number" && (r = 20, console.log("[FunctionPanelUIBase] 📍 使用默认 x 值: 20"));
			let i = window.innerWidth - this.width - 20;
			r = Math.max(20, Math.min(r, i)), this.x = r, this.y = Math.max(20, Math.min(this.initialY, window.innerHeight - 100)), console.log(`[FunctionPanelUIBase] ✅ 面板位置已设置: ${this.effectiveRegistrationKey} #${this.panelInstanceId || "singleton"}`, {
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
				if (console.log(`[FunctionPanelUIBase] 🔄 面板假关闭（单例模式）: ${this.effectiveRegistrationKey}`), this.isClosed = !0, this.cleanup && typeof this.cleanup == "function" && this.cleanup(), O.updatePanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已通过 PanelSingletonManager 更新面板 ${this.effectiveRegistrationKey} 可见性为 false`), this.setPanelVisible && typeof this.setPanelVisible == "function") this.setPanelVisible(this.effectiveRegistrationKey, !1), console.log(`[FunctionPanelUIBase] ✅ 已设置面板 ${this.effectiveRegistrationKey} 可见性为 false`);
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
}, A = { class: "header-left" }, j = { class: "panel-title" }, M = { class: "header-controls" }, N = ["aria-label"], P = {
	width: "14",
	height: "14",
	viewBox: "0 0 14 14",
	fill: "none"
}, F = {
	key: 0,
	d: "M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, I = {
	key: 1,
	d: "M7 2V12M2 7H12",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
}, L = ["aria-label"], R = ["title"], z = { class: "fab-icon" }, B = { class: "fab-text" };
function V(e, s, f, ee, h, g) {
	return d(), r(t, { to: "body" }, [c(n, { name: "panel-fade" }, {
		default: v(() => [h.isClosed ? i("", !0) : (d(), a("div", {
			key: 0,
			class: l(["function-panel", {
				"is-dragging": h.isDragging,
				"is-minimized": h.isMinimized,
				"blur-enabled": f.enableBackdropFilter && f.enableBlur
			}]),
			style: u(g.panelStyles),
			ref: "panelRef",
			onMousedown: s[3] ||= (...e) => g.onPanelMouseDown && g.onPanelMouseDown(...e)
		}, [o("div", {
			class: "panel-header",
			onMousedown: s[2] ||= (...e) => g.onHeaderMouseDown && g.onHeaderMouseDown(...e)
		}, [o("div", A, [s[5] ||= o("div", { class: "drag-indicator" }, [
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" }),
			o("span", { class: "grip-dot" })
		], -1), p(e.$slots, "header", {}, () => [o("h3", j, m(f.title), 1)], !0)]), o("div", M, [f.allowMinimize ? (d(), a("button", {
			key: 0,
			onClick: s[0] ||= x((...e) => g.toggleMinimize && g.toggleMinimize(...e), ["stop"]),
			class: "icon-btn minimize-btn",
			type: "button",
			"aria-label": h.isMinimized ? "展开" : "最小化"
		}, [(d(), a("svg", P, [h.isMinimized ? (d(), a("path", I)) : (d(), a("path", F))]))], 8, N)) : i("", !0), o("button", {
			onClick: s[1] ||= x((...e) => g.close && g.close(...e), ["stop"]),
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
		})], -1)]], 8, L)])], 32), c(n, { name: "content-slide" }, {
			default: v(() => [y(o("div", {
				class: "panel-body",
				style: u(g.bodyStyles)
			}, [p(e.$slots, "default", {
				isClosed: h.isClosed,
				panelInstanceId: f.panelInstanceId,
				isSingleton: g.isSingletonByConfig
			}, void 0, !0)], 4), [[_, !h.isMinimized]])]),
			_: 3
		})], 38))]),
		_: 3
	}), c(n, { name: "fab-fade" }, {
		default: v(() => [!h.isClosed && h.isMinimized ? (d(), a("button", {
			key: 0,
			class: "panel-fab",
			type: "button",
			style: u(g.fabStyles),
			onClick: s[4] ||= (...e) => g.toggleMinimize && g.toggleMinimize(...e),
			title: f.title
		}, [o("span", z, m(f.titleIcon || "⚙️"), 1), o("span", B, m(f.title), 1)], 12, R)) : i("", !0)]),
		_: 1
	})]);
}
var H = /*#__PURE__*/ C(k, [["render", V], ["__scopeId", "data-v-fa8a4c38"]]), U = new class {
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
}(), W = {
	name: "JsonConfigPanelBase",
	components: { FunctionPanelUIBase: H },
	mixins: [D],
	inject: {},
	props: {
		initialX: {
			type: [Number, String],
			default: "center"
		},
		initialY: {
			type: Number,
			default: 120
		},
		panelTitle: {
			type: String,
			default: "配置管理"
		},
		panelIcon: {
			type: String,
			default: "⚙️"
		},
		panelWidth: {
			type: [Number, String],
			default: 420
		},
		panelMaxHeight: {
			type: String,
			default: "70vh"
		},
		closeEventName: {
			type: String,
			default: "jsonConfigPanelClose"
		},
		configId: {
			type: String,
			required: !0
		},
		panelName: {
			type: String,
			default: "JsonConfigPanel"
		},
		autoRegister: {
			type: Boolean,
			default: !0
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		fieldDefinitions: {
			type: Array,
			default: () => [
				{
					key: "id",
					label: "ID",
					type: "text",
					required: !0
				},
				{
					key: "name",
					label: "名称",
					type: "text",
					required: !0
				},
				{
					key: "url",
					label: "URL",
					type: "url",
					required: !0
				}
			]
		},
		defaultFormValues: {
			type: Object,
			default: () => ({})
		},
		itemKeyField: {
			type: String,
			default: "id"
		},
		toolbarButtons: {
			type: Object,
			default: () => ({
				add: !0,
				import: !0,
				export: !0,
				refresh: !0
			})
		},
		lazyLoad: {
			type: Boolean,
			default: !1
		}
	},
	data() {
		return {
			configList: [],
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
			formData: {},
			editingItem: null,
			deleteTarget: null,
			serverBaseURL: "",
			apiServerURL: "",
			componentName: "JsonConfigPanel"
		};
	},
	created() {
		this.serverBaseURL = process.env.VUE_APP_SERVER_BASE_URL || "http://192.168.31.146:8080";
		let e = process.env.VUE_APP_API_PORT || "8081", t = new URL(this.serverBaseURL);
		t.port = e, this.apiServerURL = t.toString().replace(/\/$/, ""), console.log(`[${this.panelName}] 🔧 服务器配置:`, {
			frontend: this.serverBaseURL,
			api: this.apiServerURL
		});
	},
	mounted() {
		let e = O.getPanelState(this.effectivePanelName);
		e && e.cesiumObjects && (console.log(`[${this.effectivePanelName}] 📦 恢复保存的 Cesium 对象`), this.restoreCesiumObjects(e.cesiumObjects));
		let t = this.getPanelConfig(), n = this.lazyLoad || t && t.lazyLoad === !0;
		n ? (console.log(`[${this.effectivePanelName}] ⏸️ 延迟加载已启用，等待面板首次打开时加载配置`), console.log(`[${this.effectivePanelName}] 📝 延迟加载事件将通过 @lazy-load 监听`)) : console.log(`[${this.effectivePanelName}] ⏭️ 延迟加载未启用，将立即加载配置`);
		let r = this.panelInstanceId !== null, i = null;
		r ? typeof window < "u" && window.__multiInstancePanelConfigManager__ && typeof window.__multiInstancePanelConfigManager__.getPanelInstanceCache == "function" && (i = window.__multiInstancePanelConfigManager__.getPanelInstanceCache(this.instanceId || 1, this.effectiveRegistrationKey, this.panelInstanceId)) : i = O.getPanelState(this.effectiveRegistrationKey);
		let a = !1;
		i && i.configList && i.configList.length > 0 && (Date.now() - (i.timestamp || 0) < 300 * 1e3 ? (console.log(`[${this.effectivePanelName}] 📦 从缓存恢复配置列表 (${i.configList.length} 条) ${r ? "(多实例)" : "(单例)"}`), this.configList = i.configList, a = !0) : console.log(`[${this.effectivePanelName}] ⏭️ 缓存已过期，将重新加载`)), this.initCesium(() => {
			n ? console.log(`[${this.effectivePanelName}] Cesium 已就绪，等待延迟加载触发`) : a ? (console.log(`[${this.effectivePanelName}] ✅ 配置已从缓存恢复，跳过重新加载`), this.onConfigLoaded()) : (console.log(`[${this.effectivePanelName}] Cesium 已就绪，开始加载配置`), this.loadConfig());
		});
	},
	beforeUnmount() {
		let e = this.getCesiumObjects();
		e && (this.panelInstanceId === null ? (O.savePanelState(this.effectiveRegistrationKey, {
			cesiumObjects: e,
			configList: this.configList.map((e) => ({
				id: e.id,
				name: e.name,
				url: e.url,
				loaded: !1,
				loading: !1
			})),
			timestamp: Date.now()
		}), console.log(`[${this.effectivePanelName}] 💾 单例缓存已保存 (configList: ${this.configList.length} 条)`)) : typeof window < "u" && window.__multiInstancePanelConfigManager__ && typeof window.__multiInstancePanelConfigManager__.savePanelInstanceCache == "function" && (window.__multiInstancePanelConfigManager__.savePanelInstanceCache(this.instanceId || 1, this.effectiveRegistrationKey, this.panelInstanceId, {
			cesiumObjects: e,
			configList: this.configList.map((e) => ({
				id: e.id,
				name: e.name,
				url: e.url,
				loaded: !1,
				loading: !1
			})),
			timestamp: Date.now()
		}), console.log(`[${this.effectivePanelName}] 💾 多实例缓存已保存 (#${this.panelInstanceId})`)));
	},
	computed: {
		effectivePanelName() {
			return this.panelInstanceId === null ? this.panelName : `${this.panelName}_${this.panelInstanceId}`;
		},
		effectiveRegistrationKey() {
			return this.panelInstanceId === null ? this.registrationKey || this.panelName : `${this.registrationKey || this.panelName}_${this.panelInstanceId}`;
		},
		currentDirectoryFiles() {
			return this.currentServerDirectory ? this.serverFiles.filter((e) => {
				let t = e.filePath || e.path;
				if (!t) return !1;
				let n = t.includes("/") ? t.substring(0, t.lastIndexOf("/")) : "";
				if (n === this.currentServerDirectory) return !0;
				if (this.currentServerDirectory === "") {
					if (!t.includes("/")) return !0;
					let e = t.indexOf("/");
					if (t.indexOf("/", e + 1) === -1) return !1;
				}
				return n.startsWith(this.currentServerDirectory + "/") ? n.indexOf("/", this.currentServerDirectory.length + 1) === -1 : !1;
			}) : this.serverFiles;
		},
		currentSubdirectories() {
			let e = /* @__PURE__ */ new Set(), t = this.currentServerDirectory;
			return this.serverFiles.forEach((n) => {
				let r = n.filePath || n.path;
				if (!r) return;
				let i = r.includes("/") ? r.substring(0, r.lastIndexOf("/")) : "";
				if (i !== t) {
					if (t === "") {
						let t = r.indexOf("/");
						if (t !== -1) {
							let n = r.indexOf("/", t + 1), i = n === -1 ? r.substring(t + 1) : r.substring(t + 1, n);
							e.add(i);
						}
					} else if (i.startsWith(t + "/")) {
						let n = i.substring(t.length + 1), r = n.indexOf("/");
						r === -1 ? e.add(n) : e.add(n.substring(0, r));
					}
				}
			}), Array.from(e).sort();
		},
		currentDirectoryDisplay() {
			return this.currentServerDirectory ? this.currentServerDirectory : "根目录";
		},
		canGoBack() {
			return this.currentServerDirectory !== "";
		}
	},
	methods: {
		getPanelConfig() {
			return typeof window < "u" && window.__functionPanelsConfig__ ? window.__functionPanelsConfig__.panels.find((e) => e.name === this.effectivePanelName) : null;
		},
		getConfigLazyLoad() {
			if (typeof window < "u" && window.__functionPanelsConfig__) {
				let e = window.__functionPanelsConfig__.panels.find((e) => e.name === this.effectiveRegistrationKey);
				return e ? e.lazyLoad === !0 : !1;
			}
			return !1;
		},
		onLazyLoad(e) {
			console.log(`[${this.panelName}] ⚡ 延迟加载触发，首次打开面板`, e), console.log(`[${this.panelName}] 🔍 当前 configList 状态:`, {
				length: this.configList.length,
				isEmpty: this.configList.length === 0
			});
			let t = this.panelInstanceId !== null, n = null;
			t ? typeof window < "u" && window.__multiInstancePanelConfigManager__ && typeof window.__multiInstancePanelConfigManager__.getPanelInstanceCache == "function" && (n = window.__multiInstancePanelConfigManager__.getPanelInstanceCache(this.instanceId || 1, this.effectiveRegistrationKey, this.panelInstanceId)) : n = O.getPanelState(this.effectiveRegistrationKey), console.log(`[${this.panelName}] 🔍 缓存状态:`, {
				hasCache: !!n,
				hasConfigList: !!(n && n.configList),
				configListLength: n?.configList?.length || 0,
				timestamp: n?.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "N/A",
				age: n?.timestamp ? `${Math.round((Date.now() - n.timestamp) / 1e3)}秒` : "N/A"
			}), this.initCesium(() => {
				let e = O.getPanelState(this.effectiveRegistrationKey);
				if (e && e.cesiumObjects && (console.log(`[${this.effectivePanelName}] 📦 恢复保存的 Cesium 对象（延迟加载）`), this.restoreCesiumObjects(e.cesiumObjects)), n && n.configList && n.configList.length > 0) {
					let e = Date.now() - (n.timestamp || 0);
					if (e < 300 * 1e3) {
						console.log(`[${this.panelName}] 📦 从缓存恢复配置列表 (${n.configList.length} 条) ${t ? "(多实例)" : "(单例)"}`), this.configList = n.configList, console.log(`[${this.panelName}] ✅ 配置已从缓存恢复，跳过重新加载`), console.log(`[${this.panelName}] ✅ 恢复后的 configList 长度:`, this.configList.length), this.onConfigLoaded();
						return;
					} else console.log(`[${this.panelName}] ⏭️ 缓存已过期 (${Math.round(e / 1e3)}秒)，将重新加载`);
				} else console.log(`[${this.panelName}] ⏭️ 没有有效缓存，将重新加载`);
				console.log(`[${this.panelName}] Cesium 已就绪，开始延迟加载配置`), this.loadConfig();
			});
		},
		initCesium(e) {
			console.warn(`[${this.panelName}] initCesium 未被子类实现`), e && e();
		},
		getCesiumObjects() {
			return null;
		},
		restoreCesiumObjects(e) {
			console.warn(`[${this.panelName}] restoreCesiumObjects 未被子类实现`);
		},
		onConfigLoaded() {
			console.log(`[${this.panelName}] ✅ 配置加载完成，共 ${this.configList.length} 条`);
		},
		onConfigSaved() {
			console.log(`[${this.panelName}] ✅ 配置保存完成`);
		},
		onConfigDeleted() {
			console.log(`[${this.panelName}] ✅ 配置删除完成`);
		},
		cleanup() {
			console.log(`[${this.panelName}] 🧹 清理组件状态（对话框等）`), this.showAddDialog = !1, this.showEditDialog = !1, this.showDeleteDialog = !1, this.showImportDialog = !1, this.resetForm(), this.editingItem = null, this.deleteTarget = null, this.selectedServerFile = null;
		},
		getItemClass(e) {
			return {};
		},
		getItemDisplayName(e) {
			return e.name || e.id || "未命名";
		},
		getItemDetailText(e) {
			if (e.url) return e.url;
			let t = Object.keys(e).filter((e) => ![
				"id",
				"name",
				"url"
			].includes(e));
			return t.length > 0 ? e[t[0]] : "";
		},
		async loadConfig() {
			try {
				console.log(`[${this.panelName}] 📂 开始加载配置: ${this.configId}`);
				let e = null;
				try {
					e = await U.loadFromServer(this.configId), console.log(`[${this.panelName}] ✅ 从 API 加载成功`);
				} catch (t) {
					console.warn(`[${this.panelName}] ⚠️ API 加载失败:`, t.message);
					let n = U.getConfigDefinition(this.configId);
					if (n) {
						let t = await fetch(U.getDataURL(n.relativePath), { cache: "no-cache" });
						t.ok && (e = await t.json(), console.log(`[${this.panelName}] ✅ 从静态文件加载成功`));
					}
				}
				if (!e) {
					console.warn(`[${this.panelName}] ⚠️ 无法加载配置`), this.configList = [];
					return;
				}
				let t = U.validateConfig(this.configId, e);
				if (!t.valid) {
					console.error(`[${this.panelName}] ❌ 数据验证失败:`, t.errors), this.configList = [];
					return;
				}
				this.configList = this.processLoadedData(e), console.log(`[${this.panelName}] 📦 共加载 ${this.configList.length} 条`), this.onConfigLoaded();
			} catch (e) {
				console.error(`[${this.panelName}] ❌ 加载失败:`, e), this.configList = [];
			}
		},
		processLoadedData(e) {
			return e.map((e) => ({ ...e }));
		},
		async refreshConfig(e = !0) {
			e ? (console.log(`[${this.panelName}] 🔄 强制刷新配置 (绕过缓存)`), this.configList = [], this.panelInstanceId === null ? (O.savePanelState(this.effectiveRegistrationKey, {
				cesiumObjects: {
					cesiumTilesets: /* @__PURE__ */ new Map(),
					cesiumTransforms: /* @__PURE__ */ new Map(),
					cesiumHeightOffsets: /* @__PURE__ */ new Map()
				},
				configList: [],
				timestamp: 0
			}), console.log(`[${this.panelName}] 🗑️ 单例缓存已清除`)) : typeof window < "u" && window.__multiInstancePanelConfigManager__ && typeof window.__multiInstancePanelConfigManager__.clearPanelInstanceCache == "function" && (window.__multiInstancePanelConfigManager__.clearPanelInstanceCache(this.instanceId || 1, this.effectiveRegistrationKey, this.panelInstanceId), console.log(`[${this.panelName}] 🗑️ 多实例缓存已清除 (#${this.panelInstanceId})`))) : console.log(`[${this.panelName}] 🔄 正常刷新配置`), await this.loadConfig();
		},
		async saveConfig() {
			try {
				let e = this.configList.map((e) => this.extractSaveData(e)), t = U.validateConfig(this.configId, e);
				if (!t.valid) return console.error(`[${this.panelName}] ❌ 数据验证失败:`, t.errors), alert(`数据验证失败:\n${t.errors.join("\n")}`), !1;
				let n = await U.uploadToServer(this.configId, e);
				return n.success ? (console.log(`[${this.panelName}] ✅ 配置已保存`), this.onConfigSaved(), !0) : (console.error(`[${this.panelName}] ❌ 保存失败:`, n.error), alert(`保存失败！\n错误：${n.error}`), !1);
			} catch (e) {
				return console.error(`[${this.panelName}] ❌ 保存错误:`, e), alert(`保存失败！\n错误：${e.message}`), !1;
			}
		},
		extractSaveData(e) {
			let t = {};
			return this.fieldDefinitions.forEach((n) => {
				e[n.key] !== void 0 && (t[n.key] = e[n.key]);
			}), t;
		},
		openAddDialog() {
			this.showAddDialog = !0, this.resetForm();
		},
		openEditDialog(e) {
			this.showEditDialog = !0, this.editingItem = e, this.fieldDefinitions.forEach((t) => {
				this.formData[t.key] = e[t.key];
			});
		},
		closeDialog() {
			this.showAddDialog = !1, this.showEditDialog = !1, this.resetForm(), this.editingItem = null;
		},
		resetForm() {
			this.formData = { ...this.defaultFormValues }, this.fieldDefinitions.forEach((e) => {
				e.key && !this.formData[e.key] && (this.formData[e.key] = "");
			});
		},
		validateForm() {
			for (let e of this.fieldDefinitions) if (e.required && !this.formData[e.key]) return alert(`请填写${e.label}`), !1;
			if (this.showEditDialog && this.editingItem) {
				if (this.configList.find((e) => e[this.itemKeyField] === this.formData[this.itemKeyField] && e[this.itemKeyField] !== this.editingItem[this.itemKeyField])) return alert(`${this.itemKeyField} 已存在`), !1;
			} else if (this.showAddDialog && this.configList.find((e) => e[this.itemKeyField] === this.formData[this.itemKeyField])) return alert(`${this.itemKeyField} 已存在`), !1;
			return !0;
		},
		async submitForm() {
			if (this.validateForm()) if (this.showEditDialog && this.editingItem) {
				let e = this.configList.findIndex((e) => e[this.itemKeyField] === this.editingItem[this.itemKeyField]);
				if (e !== -1) {
					let t = { ...this.configList[e] };
					this.fieldDefinitions.forEach((e) => {
						t[e.key] = this.formData[e.key];
					});
					let n = this.beforeUpdateItem(t);
					this.configList.splice(e, 1, n), await this.saveConfig() && this.closeDialog();
				}
			} else {
				let e = {};
				this.fieldDefinitions.forEach((t) => {
					e[t.key] = this.formData[t.key];
				});
				let t = this.beforeAddItem(e);
				this.configList.push(t), await this.saveConfig() && this.closeDialog();
			}
		},
		beforeAddItem(e) {
			return e;
		},
		beforeUpdateItem(e) {
			return e;
		},
		confirmDelete(e) {
			this.deleteTarget = e, this.showDeleteDialog = !0;
		},
		async executeDelete() {
			if (!this.deleteTarget) return;
			let e = this.configList.findIndex((e) => e[this.itemKeyField] === this.deleteTarget[this.itemKeyField]);
			if (e !== -1) {
				let t = this.configList[e];
				this.beforeDeleteItem(t), this.configList.splice(e, 1), await this.saveConfig() && this.onConfigDeleted();
			}
			this.showDeleteDialog = !1, this.deleteTarget = null;
		},
		beforeDeleteItem(e) {},
		async openImportDialog() {
			console.log(`[${this.panelName}] 📂 打开导入对话框`), this.showImportDialog = !0, await this.loadServerFiles();
		},
		closeImportDialog() {
			this.showImportDialog = !1, this.selectedServerFile = null;
		},
		async importConfig() {
			if (!this.selectedServerFile) {
				alert("请选择要导入的文件");
				return;
			}
			let e = this.selectedServerFile, t = e.fileName || e.name, n = e.filePath || e.path, r = `确认要从服务器导入配置？\n\n文件：${t}\n\n注意：这将替换当前所有配置！`;
			if (confirm(r)) try {
				let e = await U.loadFromServerByPath(n);
				if (!e) {
					alert("加载文件失败！");
					return;
				}
				let t = U.validateConfig(this.configId, e);
				if (!t.valid) {
					alert(`数据验证失败:\n${t.errors.join("\n")}`);
					return;
				}
				this.configList = this.processLoadedData(e), console.log(`[${this.panelName}] ✅ 导入成功，共 ${this.configList.length} 条`), this.closeImportDialog(), alert(`配置已成功导入！\n共导入 ${this.configList.length} 条配置。`);
			} catch (e) {
				console.error(`[${this.panelName}] ❌ 导入失败:`, e), alert(`导入失败！\n错误：${e.message}`);
			}
		},
		async exportConfig() {
			console.log(`[${this.panelName}] 📤 准备导出配置`);
			let e = this.configList.map((e) => this.extractSaveData(e)), t = U.validateConfig(this.configId, e);
			if (!t.valid) return console.error(`[${this.panelName}] ❌ 数据验证失败:`, t.errors), alert(`数据验证失败:\n${t.errors.join("\n")}`), !1;
			let n = await U.uploadToServer(this.configId, e);
			return n.success ? (console.log(`[${this.panelName}] ✅ 配置已导出`), alert("配置已成功导出到服务器！")) : (console.error(`[${this.panelName}] ❌ 导出失败:`, n.error), alert(`导出失败！\n错误：${n.error}`)), n.success;
		},
		async loadServerFiles() {
			try {
				this.loadingServerFiles = !0, console.log(`[${this.panelName}] 📂 加载服务器文件列表`);
				let e = await U.listServerFiles();
				this.serverFiles = e, this.allFilesMap.clear(), e.forEach((e) => {
					this.allFilesMap.set(e.filePath, e);
				}), console.log(`[${this.panelName}] ✅ 加载了 ${e.length} 个文件`);
			} catch (e) {
				console.error(`[${this.panelName}] ❌ 加载文件失败:`, e), alert(`加载服务器文件失败！\n错误：${e.message}`);
			} finally {
				this.loadingServerFiles = !1;
			}
		},
		navigateToDirectory(e) {
			let t = this.currentServerDirectory ? `${this.currentServerDirectory}/${e}` : e;
			this.currentServerDirectory = t, console.log(`[${this.panelName}] 📂 进入目录: ${this.currentDirectoryDisplay}`);
		},
		navigateToParentDirectory() {
			if (!this.currentServerDirectory) return;
			let e = this.currentServerDirectory.lastIndexOf("/");
			e === -1 ? this.currentServerDirectory = "" : this.currentServerDirectory = this.currentServerDirectory.substring(0, e), console.log(`[${this.panelName}] 📂 返回上级: ${this.currentDirectoryDisplay}`);
		},
		navigateToRoot() {
			this.currentServerDirectory = "", console.log(`[${this.panelName}] 📂 返回根目录`);
		},
		selectFile(e) {
			this.selectedServerFile = e, console.log(`[${this.panelName}] 📄 选择文件:`, e.fileName);
		},
		formatDate(e) {
			if (!e) return "未知";
			let t = new Date(e);
			return isNaN(t.getTime()) ? "无效日期" : t.toLocaleString("zh-CN", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			});
		},
		formatFileSize(e) {
			if (!e || e === 0) return "0 B";
			let t = 1024, n = [
				"B",
				"KB",
				"MB",
				"GB"
			], r = Math.floor(Math.log(e) / Math.log(t));
			return parseFloat((e / t ** r).toFixed(2)) + " " + n[r];
		},
		getConfigStats() {
			return U.getConfigDefinition(this.configId) ? U.getConfigStats(this.configId, this.configList) : null;
		},
		handleClose() {
			console.log(`[${this.panelName}] 面板关闭`);
			let e = this.panelInstanceId !== null;
			if (console.log(`[${this.panelName}] 🔍 面板模式检查:`, {
				isMultiInstance: e,
				panelInstanceId: this.panelInstanceId,
				effectiveRegistrationKey: this.effectiveRegistrationKey,
				currentConfigListLength: this.configList.length
			}), e) console.log(`[${this.panelName}] ℹ️ 多实例模式，跳过单例缓存保存`);
			else {
				let e = this.getCesiumObjects();
				if (console.log(`[${this.panelName}] 🔍 Cesium 对象检查:`, { hasCesiumObjects: !!e }), e) {
					O.savePanelState(this.effectiveRegistrationKey, {
						cesiumObjects: e,
						configList: this.configList.map((e) => ({
							id: e.id,
							name: e.name,
							url: e.url,
							loaded: !1,
							loading: !1
						})),
						timestamp: Date.now()
					}), console.log(`[${this.panelName}] 💾 单例缓存已保存（关闭时）(configList: ${this.configList.length} 条, key: ${this.effectiveRegistrationKey})`);
					let t = O.getPanelState(this.effectiveRegistrationKey);
					console.log(`[${this.panelName}] 🔍 缓存验证:`, {
						hasState: !!t,
						hasConfigList: !!(t && t.configList),
						configListLength: t?.configList?.length || 0,
						timestamp: t?.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "N/A"
					});
				} else console.warn(`[${this.panelName}] ⚠️ 没有 Cesium 对象，跳过缓存保存`);
				if (this.$refs.basePanel && this.$refs.basePanel._contentLoaded !== void 0) {
					let e = this.$refs.basePanel._contentLoaded;
					this.$refs.basePanel._contentLoaded = !1, console.log(`[${this.panelName}] 🔄 重置 _contentLoaded 标志: ${e} -> false`);
				}
			}
			if (this.cleanup(), typeof window < "u") {
				let e = new CustomEvent(this.closeEventName, { detail: { panelName: this.panelName } });
				window.dispatchEvent(e);
			}
		},
		handleMinimize() {
			console.log(`[${this.panelName}] 面板最小化`);
		},
		handleExpand() {
			console.log(`[${this.panelName}] 面板展开`);
		}
	}
}, G = { class: "toolbar" }, K = { class: "config-list" }, q = { class: "item-main" }, J = { class: "item-info" }, Y = { class: "item-name" }, X = { class: "item-detail" }, Z = { class: "item-actions" }, Q = ["onClick", "aria-label"], ne = ["onClick", "aria-label"], re = { class: "dialog-header" }, ie = { class: "dialog-body" }, ae = { class: "form-fields" }, oe = [
	"onUpdate:modelValue",
	"type",
	"placeholder"
], se = ["onUpdate:modelValue", "placeholder"], ce = ["onUpdate:modelValue"], le = ["value"], ue = { class: "dialog-footer" }, de = { class: "dialog-header" }, fe = { class: "dialog-body" }, pe = { class: "delete-warning" }, me = { class: "warning-text" }, he = { class: "dialog-footer" }, ge = { class: "dialog-header" }, _e = { class: "dialog-body" }, ve = { class: "file-browser" }, ye = { class: "directory-nav" }, be = ["disabled"], xe = ["disabled"], Se = { class: "current-dir" }, Ce = {
	key: 0,
	class: "subdirectories"
}, we = ["onClick"], Te = { class: "file-name" }, Ee = { class: "files" }, De = { class: "section-title" }, $ = {
	key: 0,
	class: "loading-text"
}, Oe = ["onClick"], ke = { class: "file-name" }, Ae = { class: "file-size" }, je = {
	key: 0,
	class: "empty-message"
}, Me = { class: "dialog-footer" }, Ne = ["disabled"];
function Pe(u, _, S, C, w, T) {
	let E = ee("FunctionPanelUIBase");
	return d(), r(E, {
		ref: "basePanel",
		title: S.panelTitle,
		"title-icon": S.panelIcon,
		width: S.panelWidth,
		"max-height": S.panelMaxHeight,
		"initial-x": S.initialX,
		"initial-y": S.initialY,
		"allow-minimize": !0,
		"close-event-name": S.closeEventName,
		"auto-register": S.autoRegister !== !1,
		"registration-key": T.effectiveRegistrationKey,
		"panel-instance-id": S.panelInstanceId,
		"lazy-load": S.lazyLoad || T.getConfigLazyLoad(),
		onClose: T.handleClose,
		onMinimize: T.handleMinimize,
		onExpand: T.handleExpand,
		onLazyLoad: T.onLazyLoad
	}, {
		default: v(() => [
			o("div", G, [
				S.toolbarButtons.add ? (d(), a("button", {
					key: 0,
					onClick: _[0] ||= (...e) => T.openAddDialog && T.openAddDialog(...e),
					class: "tool-btn add-btn",
					title: "添加配置项"
				}, [..._[22] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M12 5v14M5 12h14",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 添加 ", -1)]])) : i("", !0),
				S.toolbarButtons.export ? (d(), a("button", {
					key: 1,
					onClick: _[1] ||= (...e) => T.exportConfig && T.exportConfig(...e),
					class: "tool-btn export-btn",
					title: "导出配置到服务器"
				}, [..._[23] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 导出 ", -1)]])) : i("", !0),
				S.toolbarButtons.import ? (d(), a("button", {
					key: 2,
					onClick: _[2] ||= (...e) => T.openImportDialog && T.openImportDialog(...e),
					class: "tool-btn import-btn",
					title: "从服务器导入配置"
				}, [..._[24] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1), s(" 导入 ", -1)]])) : i("", !0),
				S.toolbarButtons.refresh ? (d(), a("button", {
					key: 3,
					onClick: _[3] ||= (...e) => T.refreshConfig && T.refreshConfig(...e),
					class: "tool-btn refresh-btn",
					title: "刷新配置数据"
				}, [..._[25] ||= [o("svg", {
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
				})], -1), s(" 刷新 ", -1)]])) : i("", !0),
				p(u.$slots, "toolbar-extra", {}, void 0, !0)
			]),
			p(u.$slots, "before-list", {}, void 0, !0),
			o("div", K, [(d(!0), a(e, null, f(w.configList, (e) => (d(), a("div", {
				key: e[S.itemKeyField],
				class: l(["config-item", T.getItemClass(e)])
			}, [o("div", q, [p(u.$slots, "list-item", { item: e }, () => [o("div", J, [o("span", Y, m(T.getItemDisplayName(e)), 1), o("span", X, m(T.getItemDetailText(e)), 1)])], !0)]), o("div", Z, [
				p(u.$slots, "item-actions", { item: e }, void 0, !0),
				o("button", {
					onClick: (t) => T.openEditDialog(e),
					class: "action-btn edit-btn",
					type: "button",
					"aria-label": `编辑 ${T.getItemDisplayName(e)}`,
					title: "编辑"
				}, [..._[26] ||= [o("svg", {
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
				})], -1)]], 8, Q),
				o("button", {
					onClick: (t) => T.confirmDelete(e),
					class: "action-btn delete-btn",
					type: "button",
					"aria-label": `删除 ${T.getItemDisplayName(e)}`,
					title: "删除"
				}, [..._[27] ||= [o("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [o("path", {
					d: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)]], 8, ne)
			])], 2))), 128))]),
			p(u.$slots, "after-list", {}, void 0, !0),
			(d(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: v(() => [w.showAddDialog || w.showEditDialog ? (d(), a("div", {
					key: 0,
					class: "dialog-overlay",
					onClick: _[9] ||= (...e) => T.closeDialog && T.closeDialog(...e)
				}, [o("div", {
					class: "dialog",
					onClick: _[8] ||= x(() => {}, ["stop"])
				}, [
					o("div", re, [o("h3", null, m(w.showEditDialog ? "编辑配置" : "添加配置"), 1), o("button", {
						onClick: _[4] ||= (...e) => T.closeDialog && T.closeDialog(...e),
						class: "close-btn"
					}, "×")]),
					o("div", ie, [p(u.$slots, "form-extra", { item: w.editingItem }, void 0, !0), o("div", ae, [(d(!0), a(e, null, f(S.fieldDefinitions, (t) => (d(), a("div", {
						key: t.key,
						class: "form-field"
					}, [o("label", { class: l({ required: t.required }) }, m(t.label), 3), t.type === "text" || t.type === "url" ? y((d(), a("input", {
						key: 0,
						"onUpdate:modelValue": (e) => w.formData[t.key] = e,
						type: t.type === "url" ? "url" : "text",
						placeholder: t.placeholder || `请输入${t.label}`,
						onKeydown: _[5] ||= b((...e) => T.submitForm && T.submitForm(...e), ["enter"])
					}, null, 40, oe)), [[h, w.formData[t.key]]]) : t.type === "textarea" ? y((d(), a("textarea", {
						key: 1,
						"onUpdate:modelValue": (e) => w.formData[t.key] = e,
						placeholder: t.placeholder || `请输入${t.label}`,
						rows: "3"
					}, null, 8, se)), [[te, w.formData[t.key]]]) : t.type === "select" ? y((d(), a("select", {
						key: 2,
						"onUpdate:modelValue": (e) => w.formData[t.key] = e
					}, [_[28] ||= o("option", { value: "" }, "请选择", -1), (d(!0), a(e, null, f(t.options, (e) => (d(), a("option", {
						key: e.value,
						value: e.value
					}, m(e.label), 9, le))), 128))], 8, ce)), [[g, w.formData[t.key]]]) : i("", !0)]))), 128))])]),
					o("div", ue, [o("button", {
						onClick: _[6] ||= (...e) => T.closeDialog && T.closeDialog(...e),
						class: "btn cancel-btn"
					}, "取消"), o("button", {
						onClick: _[7] ||= (...e) => T.submitForm && T.submitForm(...e),
						class: "btn confirm-btn"
					}, "确定")])
				])])) : i("", !0)]),
				_: 3
			})])),
			(d(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: v(() => [w.showDeleteDialog ? (d(), a("div", {
					key: 0,
					class: "dialog-overlay",
					onClick: _[14] ||= (e) => w.showDeleteDialog = !1
				}, [o("div", {
					class: "dialog dialog-small",
					onClick: _[13] ||= x(() => {}, ["stop"])
				}, [
					o("div", de, [_[29] ||= o("h3", null, "确认删除", -1), o("button", {
						onClick: _[10] ||= (e) => w.showDeleteDialog = !1,
						class: "close-btn"
					}, "×")]),
					o("div", fe, [o("div", pe, [_[30] ||= o("svg", {
						class: "warning-icon",
						viewBox: "0 0 24 24",
						fill: "currentColor"
					}, [o("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" })], -1), o("span", me, [s(" 确定要删除 \"" + m(w.deleteTarget ? T.getItemDisplayName(w.deleteTarget) : "") + "\" 吗？ ", 1), p(u.$slots, "delete-warning-extra", { item: w.deleteTarget }, void 0, !0)])])]),
					o("div", he, [o("button", {
						onClick: _[11] ||= (e) => w.showDeleteDialog = !1,
						class: "btn cancel-btn"
					}, "取消"), o("button", {
						onClick: _[12] ||= (...e) => T.executeDelete && T.executeDelete(...e),
						class: "btn danger-btn"
					}, "删除")])
				])])) : i("", !0)]),
				_: 3
			})])),
			(d(), r(t, { to: "body" }, [c(n, { name: "dialog-fade" }, {
				default: v(() => [w.showImportDialog ? (d(), a("div", {
					key: 0,
					class: "dialog-overlay dialog-large",
					onClick: _[21] ||= (...e) => T.closeImportDialog && T.closeImportDialog(...e)
				}, [o("div", {
					class: "dialog dialog-large",
					onClick: _[20] ||= x(() => {}, ["stop"])
				}, [
					o("div", ge, [_[31] ||= o("h3", null, "从服务器导入配置", -1), o("button", {
						onClick: _[15] ||= (...e) => T.closeImportDialog && T.closeImportDialog(...e),
						class: "close-btn"
					}, "×")]),
					o("div", _e, [o("div", ve, [
						o("div", ye, [
							o("button", {
								onClick: _[16] ||= (...e) => T.navigateToRoot && T.navigateToRoot(...e),
								class: "nav-btn",
								disabled: w.loadingServerFiles
							}, [..._[32] ||= [o("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2"
							}, [o("path", {
								d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							})], -1), s(" 根目录 ", -1)]], 8, be),
							o("button", {
								onClick: _[17] ||= (...e) => T.navigateToParentDirectory && T.navigateToParentDirectory(...e),
								class: "nav-btn",
								disabled: !T.canGoBack || w.loadingServerFiles
							}, [..._[33] ||= [o("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2"
							}, [o("path", {
								d: "M19 12H5M12 19l-7-7 7-7",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							})], -1), s(" 返回上级 ", -1)]], 8, xe),
							o("span", Se, "当前：" + m(T.currentDirectoryDisplay), 1)
						]),
						T.currentSubdirectories.length > 0 ? (d(), a("div", Ce, [_[36] ||= o("div", { class: "section-title" }, "子目录", -1), (d(!0), a(e, null, f(T.currentSubdirectories, (e) => (d(), a("div", {
							key: e,
							onClick: (t) => T.navigateToDirectory(e),
							class: "file-item directory-item"
						}, [
							_[34] ||= o("svg", {
								class: "file-icon",
								viewBox: "0 0 24 24",
								fill: "currentColor"
							}, [o("path", { d: "M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" })], -1),
							o("span", Te, m(e), 1),
							_[35] ||= o("svg", {
								class: "arrow-icon",
								viewBox: "0 0 24 24",
								fill: "currentColor"
							}, [o("path", { d: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" })], -1)
						], 8, we))), 128))])) : i("", !0),
						o("div", Ee, [
							o("div", De, [_[37] ||= s(" 配置文件 ", -1), w.loadingServerFiles ? (d(), a("span", $, "加载中...")) : i("", !0)]),
							(d(!0), a(e, null, f(T.currentDirectoryFiles, (e) => (d(), a("div", {
								key: e.filePath,
								onClick: (t) => T.selectFile(e),
								class: l(["file-item", { selected: w.selectedServerFile === e }])
							}, [
								_[38] ||= o("svg", {
									class: "file-icon",
									viewBox: "0 0 24 24",
									fill: "currentColor"
								}, [o("path", { d: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" })], -1),
								o("span", ke, m(e.fileName), 1),
								o("span", Ae, m(T.formatFileSize(e.fileSize)), 1)
							], 10, Oe))), 128)),
							T.currentDirectoryFiles.length === 0 && !w.loadingServerFiles ? (d(), a("div", je, " 此目录下没有配置文件 ")) : i("", !0)
						])
					])]),
					o("div", Me, [o("button", {
						onClick: _[18] ||= (...e) => T.closeImportDialog && T.closeImportDialog(...e),
						class: "btn cancel-btn"
					}, "取消"), o("button", {
						onClick: _[19] ||= (...e) => T.importConfig && T.importConfig(...e),
						class: "btn confirm-btn",
						disabled: !w.selectedServerFile
					}, " 导入 ", 8, Ne)])
				])])) : i("", !0)]),
				_: 1
			})])),
			p(u.$slots, "dialogs", {}, void 0, !0)
		]),
		_: 3
	}, 8, [
		"title",
		"title-icon",
		"width",
		"max-height",
		"initial-x",
		"initial-y",
		"close-event-name",
		"auto-register",
		"registration-key",
		"panel-instance-id",
		"lazy-load",
		"onClose",
		"onMinimize",
		"onExpand",
		"onLazyLoad"
	]);
}
var Fe = /*#__PURE__*/ C(W, [["render", Pe], ["__scopeId", "data-v-2c60153e"]]);
//#endregion
export { Fe as default };
