import { createElementBlock as e, createElementVNode as t, normalizeClass as n, openBlock as r, toDisplayString as i } from "vue";
//#region \0plugin-vue:export-helper
var a = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, o = {
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
}, s = [
	"disabled",
	"aria-label",
	"aria-pressed"
], c = {
	class: "button-icon",
	"aria-hidden": "true"
}, l = { class: "button-label" }, u = {
	class: "button-tooltip",
	role: "tooltip",
	"aria-hidden": "true"
};
function d(a, o, d, f, p, m) {
	return r(), e("button", {
		class: n(["toolbar-button", m.buttonClasses]),
		disabled: d.disabled,
		"aria-label": d.ariaLabel,
		"aria-pressed": d.active ? "true" : "false",
		onClick: o[0] ||= (...e) => m.handleClick && m.handleClick(...e)
	}, [
		t("span", c, i(d.icon), 1),
		t("span", l, i(d.label), 1),
		t("span", u, i(m.computedTooltip), 1)
	], 10, s);
}
var f = /*#__PURE__*/ a(o, [["render", d], ["__scopeId", "data-v-4bd42dcf"]]);
//#endregion
export { f as default };
