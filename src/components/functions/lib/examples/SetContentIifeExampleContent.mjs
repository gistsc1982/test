import { createElementBlock as e, createElementVNode as t, openBlock as n, vShow as r, withDirectives as i } from "vue";
//#region \0plugin-vue:export-helper
var a = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, o = {
	name: "SetContentIifeExampleContent",
	props: { isClosed: {
		type: Boolean,
		default: !0
	} },
	data() {
		return {
			containerId: "set-content-dual-canvas-container",
			vueApp: null,
			isMounted: !1,
			hasInitializedOnce: !1,
			iifeComponent: null
		};
	},
	mounted() {
		console.log("[SetContentIifeExampleContent] mounted, isClosed:", this.isClosed);
	},
	watch: { isClosed: {
		immediate: !0,
		handler(e, t) {
			console.log("[SetContentIifeExampleContent] isClosed 状态变化:", {
				oldVal: t,
				newVal: e,
				hasInitializedOnce: this.hasInitializedOnce
			}), !e && !this.hasInitializedOnce ? (console.log("[SetContentIifeExampleContent] 条件满足：面板显示且未初始化，准备初始化"), this.$nextTick(() => {
				console.log("[SetContentIifeExampleContent] $nextTick 回调执行，开始初始化 dualCanvasViewer"), this.initDualCanvasViewer();
			})) : console.log("[SetContentIifeExampleContent] 条件不满足：", {
				isClosed: e,
				hasInitializedOnce: this.hasInitializedOnce,
				reason: e ? "面板关闭" : "已初始化"
			}), e && this.hasInitializedOnce && (console.log("[SetContentIifeExampleContent] 面板已关闭，清理 dualCanvasViewer"), this.disposeDualCanvasViewer());
		}
	} },
	beforeUnmount() {
		this.disposeDualCanvasViewer();
	},
	methods: {
		initDualCanvasViewer() {
			if (console.log("[SetContentIifeExampleContent] initDualCanvasViewer() 被调用"), this.isMounted) {
				console.log("[SetContentIifeExampleContent] 已经挂载，跳过重复初始化");
				return;
			}
			console.log("[SetContentIifeExampleContent] 检查 window.DualCanvasViewerPlugin..."), typeof window < "u" && window.DualCanvasViewerPlugin ? (console.log("[SetContentIifeExampleContent] DualCanvasViewerPlugin 已就绪，开始挂载..."), this.mountDualCanvasViewer()) : (console.warn("[SetContentIifeExampleContent] DualCanvasViewerPlugin 未就绪，等待加载..."), setTimeout(() => {
				console.log("[SetContentIifeExampleContent] 重新检查 DualCanvasViewerPlugin..."), this.initDualCanvasViewer();
			}, 500));
		},
		mountDualCanvasViewer() {
			if (!this.isMounted) try {
				if (console.log("[SetContentIifeExampleContent] 开始设置面板内容..."), this.isClosed) {
					console.warn("[SetContentIifeExampleContent] 面板已关闭，取消初始化");
					return;
				}
				let e = this.$refs.panelContent;
				if (!e) {
					console.error("[SetContentIifeExampleContent] panelContent 引用未找到");
					return;
				}
				let t = document.createElement("div");
				t.id = this.containerId, t.className = "dual-canvas-wrapper", e.innerHTML = "", e.appendChild(t), console.log("[SetContentIifeExampleContent] 容器已创建，开始挂载组件..."), this.createVueApp();
			} catch (e) {
				console.error("[SetContentIifeExampleContent] 挂载失败:", e);
			}
		},
		createVueApp() {
			if (!this.isMounted) try {
				if (this.isClosed) {
					console.warn("[SetContentIifeExampleContent] 面板已关闭，取消创建 Vue 应用");
					return;
				}
				console.log("[SetContentIifeExampleContent] 开始创建 Vue 应用...");
				let e = window.DualCanvasViewerPlugin;
				if (!e) {
					console.error("[SetContentIifeExampleContent] DualCanvasViewerPlugin 未找到");
					return;
				}
				if (e.__isInUse && (console.warn("[SetContentIifeExampleContent] DualCanvasViewerPlugin 已被其他实例使用，尝试重置状态"), delete e.__isInUse), e.__isInUse = !0, this.iifeComponent = e, !e) {
					console.error("[SetContentIifeExampleContent] DualCanvasViewerPlugin 未找到");
					return;
				}
				let t = document.getElementById(this.containerId);
				if (!t) {
					console.error("[SetContentIifeExampleContent] 容器未找到:", this.containerId);
					return;
				}
				console.log("[SetContentIifeExampleContent] 容器已找到，开始挂载组件..."), import("vue").then((n) => {
					let { createApp: r } = n, i = r({ data() {
						return { loaded: !0 };
					} }), a = "dual-canvas-viewer-plugin";
					i.component(a, e), console.log(`[SetContentIifeExampleContent] ✓ 已注册组件: ${a}`), t.innerHTML = `<${a}></${a}>`, i.mount(t), this.vueApp = i, this.isMounted = !0, this.hasInitializedOnce = !0, console.log(`[SetContentIifeExampleContent] ✅ DualCanvasViewer 已挂载: ${this.containerId}`), this.$emit("initialized");
				});
			} catch (e) {
				console.error("[SetContentIifeExampleContent] 创建 Vue 应用失败:", e);
			}
		},
		disposeDualCanvasViewer() {
			if (!this.isMounted) {
				console.log("[SetContentIifeExampleContent] 未挂载，无需清理");
				return;
			}
			try {
				let e = document.getElementById(this.containerId);
				e && this.vueApp && (this.vueApp.unmount(), this.vueApp = null, e.parentNode && e.parentNode.removeChild(e), this.iifeComponent && this.iifeComponent.__isInUse && (delete this.iifeComponent.__isInUse, console.log("[SetContentIifeExampleContent] ✅ 已清理全局状态")), this.iifeComponent = null, this.isMounted = !1, console.log("[SetContentIifeExampleContent] ✅ DualCanvasViewer 已卸载，容器已清理"), this.$emit("disposed"));
			} catch (e) {
				console.error("[SetContentIifeExampleContent] 清理失败:", e);
			}
		}
	}
}, s = {
	ref: "panelContent",
	class: "set-content-example-content"
};
function c(a, o, c, l, u, d) {
	return i((n(), e("div", s, [...o[0] ||= [t("div", { class: "loading-message" }, "正在初始化双画布查看器...", -1)]], 512)), [[r, !c.isClosed]]);
}
var l = /*#__PURE__*/ a(o, [["render", c], ["__scopeId", "data-v-3bd3d63d"]]);
//#endregion
export { l as default };
