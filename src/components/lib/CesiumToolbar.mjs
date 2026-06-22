import { Fragment as e, createBlock as t, createCommentVNode as n, createElementBlock as r, createElementVNode as i, normalizeClass as a, openBlock as o, renderList as s, resolveComponent as c, toDisplayString as l } from "vue";
//#region \0plugin-vue:export-helper
var u = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, d = {
	name: "CesiumToolbarButton",
	props: {
		icon: {
			type: String,
			required: !0
		},
		label: {
			type: String,
			default: ""
		},
		tooltip: {
			type: String,
			default: ""
		},
		active: {
			type: Boolean,
			default: !1
		},
		disabled: {
			type: Boolean,
			default: !1
		},
		lazyLoad: {
			type: Boolean,
			default: !1
		},
		ariaLabel: {
			type: String,
			default: ""
		}
	},
	emits: ["click"],
	computed: {
		buttonClasses() {
			return ["toolbar-button", {
				"toolbar-button--active": this.active,
				"toolbar-button--disabled": this.disabled && !this.lazyLoad,
				"toolbar-button--lazy": this.lazyLoad
			}];
		},
		computedAriaLabel() {
			return this.ariaLabel ? this.ariaLabel : this.label || this.tooltip || "工具按钮";
		},
		computedTooltip() {
			return this.tooltip;
		}
	},
	methods: { handleClick(e) {
		if (this.lazyLoad) {
			console.log(`[CesiumToolbarButton] 懒加载按钮被点击: ${this.label}`), this.$emit("click", e);
			return;
		}
		if (this.disabled) {
			e.preventDefault();
			return;
		}
		this.$emit("click", e);
	} }
}, f = [
	"disabled",
	"aria-label",
	"aria-pressed"
], p = {
	class: "button-icon",
	"aria-hidden": "true"
}, m = { class: "button-label" }, h = {
	class: "button-tooltip",
	role: "tooltip",
	"aria-hidden": "true"
};
function g(e, t, n, s, c, u) {
	return o(), r("button", {
		class: a(["toolbar-button", u.buttonClasses]),
		disabled: n.disabled,
		"aria-label": n.ariaLabel,
		"aria-pressed": n.active ? "true" : "false",
		onClick: t[0] ||= (...e) => u.handleClick && u.handleClick(...e)
	}, [
		i("span", p, l(n.icon), 1),
		i("span", m, l(n.label), 1),
		i("span", h, l(u.computedTooltip), 1)
	], 10, f);
}
//#endregion
//#region ../../GISBIM/cesiumBase/src/components/CesiumToolbar.vue
var _ = {
	name: "CesiumToolbar",
	components: { CesiumToolbarButton: /* @__PURE__ */ u(d, [["render", g], ["__scopeId", "data-v-4bd42dcf"]]) },
	props: {
		toolbarLabel: {
			type: String,
			default: "Cesium 工具栏"
		},
		collapsible: {
			type: Boolean,
			default: !1
		},
		initiallyCollapsed: {
			type: Boolean,
			default: !1
		},
		customButtons: {
			type: Array,
			default: () => []
		},
		panelConfigs: {
			type: Array,
			default: () => []
		}
	},
	emits: [
		"button-click",
		"panel-toggle",
		"panel-registered",
		"panel-unregistered"
	],
	data() {
		return {
			isCollapsed: this.initiallyCollapsed,
			registeredPanels: /* @__PURE__ */ new Map(),
			defaultButtons: [
				{
					id: "multi-instance",
					icon: "🖥️",
					label: "多实例",
					tooltip: "创建 DualCanvasViewer 实例",
					disabled: !1,
					ariaLabel: "多实例",
					action: "multi-instance"
				},
				{
					id: "oblique-photo",
					icon: "📷",
					label: "倾斜摄影",
					tooltip: "倾斜摄影面板（单例模式）",
					disabled: !1,
					ariaLabel: "倾斜摄影面板",
					action: "toggle-panel",
					panelId: "ObliquePhotographyPanel",
					singleton: !0
				},
				{
					id: "oblique-photo-example",
					icon: "🧪",
					label: "测试面板",
					tooltip: "测试 JsonConfigPanelBase（单例模式）",
					disabled: !1,
					ariaLabel: "测试面板",
					action: "toggle-panel",
					panelId: "ObliquePhotographyPanelExample",
					singleton: !0
				},
				{
					id: "multi-instance-panel",
					icon: "🧬",
					label: "多实例",
					tooltip: "测试 JsonConfigPanelBase 多实例模式",
					disabled: !1,
					ariaLabel: "多实例测试面板",
					action: "toggle-panel",
					panelId: "ObliquePhotographyPanelExample",
					singleton: !1
				},
				{
					id: "testsfc-modal",
					icon: "🧪",
					label: "TestSfc",
					tooltip: "TestSfc 经纬度定位组件",
					disabled: !1,
					ariaLabel: "TestSfc测试",
					action: "modal-toggle",
					modalId: "testSfc"
				},
				{
					id: "sfc-test",
					icon: "🌐",
					label: "SFC",
					tooltip: "SfcDualCanvasViewer 双画布组件",
					disabled: !1,
					ariaLabel: "SFC测试",
					action: "sfc-toggle"
				},
				{
					id: "loading-mode",
					icon: "IIFE",
					label: "模式",
					tooltip: "切换加载模式",
					disabled: !1,
					ariaLabel: "加载模式",
					action: "loading-mode-toggle"
				}
			]
		};
	},
	computed: {
		managedButtons() {
			let e = [];
			return this.panelConfigs && this.panelConfigs.length > 0 ? (e = this.panelConfigs.filter((e) => e.enabled !== !1).map((e) => {
				let t = e.file && e.file.endsWith(".mjs"), n = e.lazyLoad === !0 && t;
				return {
					id: e.name,
					icon: e.icon || "📄",
					label: e.title || e.name,
					tooltip: e.description || e.title,
					disabled: n,
					ariaLabel: e.title || e.name,
					action: "toggle-panel",
					panelId: e.name,
					singleton: e.singleton !== !1,
					lazyLoad: n
				};
			}), console.log("[CesiumToolbar] 📋 从配置生成按钮:", e.map((e) => ({
				id: e.id,
				singleton: e.singleton
			})))) : e = [...this.defaultButtons, ...this.customButtons], e.map((e) => {
				if (e.action === "toggle-panel" && e.panelId) {
					let t = this.registeredPanels.get(e.panelId);
					return {
						...e,
						active: t?.visible || !1
					};
				}
				return e;
			});
		},
		toolbarClasses() {
			return ["cesium-toolbar", { "cesium-toolbar--collapsed": this.isCollapsed }];
		},
		visiblePanels() {
			let e = [];
			return this.registeredPanels.forEach((t, n) => {
				t.visible && e.push({
					key: n,
					...t
				});
			}), e;
		}
	},
	methods: {
		handleButtonClick(e) {
			if (!e.disabled) switch (console.log(`[CesiumToolbar] 按钮被点击: ${e.id}`), e.action) {
				case "toggle-panel":
					this.handlePanelToggle(e);
					break;
				case "modal-toggle":
					this.$emit("button-click", e);
					break;
				default: this.$emit("button-click", e);
			}
		},
		handlePanelToggle(e) {
			let t = e.panelId, n = this.registeredPanels.get(t);
			if (n) {
				let r = !n.visible;
				e.singleton ? (n.visible = r, this.registeredPanels.set(t, n), console.log(`[CesiumToolbar] 🔄 ${t} 可见性: ${r ? "显示" : "隐藏"}（单例模式）`), this.$emit("panel-toggle", {
					panelId: t,
					visible: r,
					singleton: !0
				})) : this.$emit("panel-toggle", {
					panelId: t,
					visible: r,
					singleton: !1
				});
			} else console.log(`[CesiumToolbar] 📦 首次加载面板: ${t}`), this.$emit("panel-toggle", {
				panelId: t,
				visible: !0,
				singleton: e.singleton || !1,
				action: "load"
			});
		},
		registerPanel(e, t) {
			console.log(`[CesiumToolbar] 注册面板: ${e}`, t), this.registeredPanels.set(e, {
				...t,
				visible: !1
			}), this.$emit("panel-registered", {
				panelId: e,
				config: t
			});
		},
		unregisterPanel(e) {
			console.log(`[CesiumToolbar] 注销面板: ${e}`), this.registeredPanels.delete(e), this.$emit("panel-unregistered", { panelId: e });
		},
		updatePanelVisibility(e, t) {
			let n = this.registeredPanels.get(e);
			n && (n.visible = t, this.registeredPanels.set(e, n));
		},
		getPanel(e) {
			return this.registeredPanels.get(e) || null;
		},
		getAllPanels() {
			let e = [];
			return this.registeredPanels.forEach((t, n) => {
				e.push({
					id: n,
					...t
				});
			}), e;
		},
		toggleCollapse() {
			this.isCollapsed = !this.isCollapsed, this.$emit("toggle-collapse", this.isCollapsed);
		},
		updatePanelButtonState(e, t) {
			console.log(`[CesiumToolbar] 🔧 更新按钮状态: ${e}`, t);
			let n = this.defaultButtons.find((t) => t.panelId === e);
			n ? (t.disabled !== void 0 && (n.disabled = t.disabled), t.loaded !== void 0 && (n.loaded = t.loaded), t.active !== void 0 && (n.active = t.active), console.log(`[CesiumToolbar] ✅ 按钮状态已更新: ${e}`, {
				disabled: n.disabled,
				loaded: n.loaded,
				active: n.active
			})) : console.warn(`[CesiumToolbar] ⚠️ 未找到面板按钮: ${e}`);
		}
	}
}, v = ["aria-label"], y = {
	class: "toolbar-buttons",
	role: "group",
	"aria-label": "工具按钮"
}, b = ["aria-label"], x = {
	width: "20",
	height: "20",
	viewBox: "0 0 20 20",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2"
}, S = {
	key: 0,
	d: "M4 6h16M4 12h16M4 18h16",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
}, C = {
	key: 1,
	d: "M15 3h6v6M9 21h6M12 3v18M3 9h6m6 0h6M9 15h6",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
function w(l, u, d, f, p, m) {
	let h = c("CesiumToolbarButton");
	return o(), r("nav", {
		class: a(["cesium-toolbar", { "cesium-toolbar--collapsed": p.isCollapsed }]),
		role: "navigation",
		"aria-label": d.toolbarLabel
	}, [
		u[1] ||= i("div", {
			class: "toolbar-indicator",
			"aria-hidden": "true"
		}, null, -1),
		i("div", y, [(o(!0), r(e, null, s(m.managedButtons, (e) => (o(), t(h, {
			key: e.id,
			icon: e.icon,
			label: e.label,
			tooltip: e.tooltip,
			active: e.active,
			disabled: e.disabled,
			"lazy-load": e.lazyLoad,
			"aria-label": e.ariaLabel || e.label,
			onClick: (t) => m.handleButtonClick(e)
		}, null, 8, [
			"icon",
			"label",
			"tooltip",
			"active",
			"disabled",
			"lazy-load",
			"aria-label",
			"onClick"
		]))), 128))]),
		d.collapsible ? (o(), r("button", {
			key: 0,
			class: "toolbar-toggle",
			"aria-label": p.isCollapsed ? "展开工具条" : "折叠工具条",
			onClick: u[0] ||= (...e) => m.toggleCollapse && m.toggleCollapse(...e),
			"aria-expanded": "!isCollapsed"
		}, [(o(), r("svg", x, [p.isCollapsed ? (o(), r("path", C)) : (o(), r("path", S))]))], 8, b)) : n("", !0)
	], 10, v);
}
var T = /*#__PURE__*/ u(_, [["render", w], ["__scopeId", "data-v-c1e719d7"]]);
//#endregion
export { T as default };
