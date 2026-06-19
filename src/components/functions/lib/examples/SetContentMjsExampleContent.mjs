import { createElementBlock as e, createElementVNode as t, openBlock as n, vShow as r, withDirectives as i } from "vue";
//#region \0plugin-vue:export-helper
var a = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, o = {
	name: "SetContentMjsExampleContent",
	props: {
		isClosed: {
			type: Boolean,
			default: !0
		},
		panelInstanceId: {
			type: Number,
			default: null
		},
		isSingleton: {
			type: Boolean,
			default: !0
		}
	},
	data() {
		return {
			vueApp: null,
			isMounted: !1,
			hasInitializedOnce: !1,
			mjsComponent: null
		};
	},
	computed: {
		containerId() {
			let e = "set-content-mjs-dual-canvas-container";
			return !this.isSingleton && this.panelInstanceId !== null ? `${e}-${this.panelInstanceId}` : e;
		},
		closeBtnId() {
			return `${this.containerId}-close`;
		},
		isMultiInstance() {
			return !this.isSingleton;
		}
	},
	created() {
		console.log("[SetContentMjsExampleContent] ✅ 组件已创建, isClosed:", this.isClosed, "panelInstanceId:", this.panelInstanceId);
	},
	mounted() {
		console.log("[SetContentMjsExampleContent] ✅ 组件已挂载, isClosed:", this.isClosed);
	},
	watch: { isClosed: {
		immediate: !0,
		handler(e, t) {
			console.log("[SetContentMjsExampleContent] isClosed 状态变化:", {
				oldVal: t,
				newVal: e,
				hasInitializedOnce: this.hasInitializedOnce,
				panelInstanceId: this.panelInstanceId,
				isSingleton: this.isSingleton,
				isMultiInstance: this.isMultiInstance
			}), !e && (this.isMultiInstance || !this.hasInitializedOnce) ? (console.log("[SetContentMjsExampleContent] 条件满足：准备初始化", {
				mode: this.isMultiInstance ? "多实例" : "单例",
				source: "functionPanels.config.json",
				panelInstanceId: this.panelInstanceId
			}), this.$nextTick(() => {
				console.log("[SetContentMjsExampleContent] $nextTick 回调执行，开始初始化 dualCanvasViewer (MJS)"), this.initDualCanvasViewer();
			})) : console.log("[SetContentMjsExampleContent] 条件不满足：", {
				isClosed: e,
				hasInitializedOnce: this.hasInitializedOnce,
				panelInstanceId: this.panelInstanceId,
				isSingleton: this.isSingleton,
				isMultiInstance: this.isMultiInstance,
				reason: e ? "面板关闭" : "已初始化（单例模式）"
			}), e && this.hasInitializedOnce && (console.log("[SetContentMjsExampleContent] 面板已关闭，清理 dualCanvasViewer (MJS)"), this.disposeDualCanvasViewer());
		}
	} },
	beforeUnmount() {
		this.disposeDualCanvasViewer();
	},
	methods: {
		async initDualCanvasViewer() {
			if (console.log("[SetContentMjsExampleContent] initDualCanvasViewer() 被调用 (MJS模式)"), this.isMounted) {
				console.log("[SetContentMjsExampleContent] 已经挂载，跳过重复初始化");
				return;
			}
			try {
				if (typeof window > "u" || !window["vue3-sfc-loader"]) {
					console.error("[SetContentMjsExampleContent] vue3-sfc-loader 不可用");
					return;
				}
				let { loadModule: e } = window["vue3-sfc-loader"], t = await import("vue");
				console.log("[SetContentMjsExampleContent] 开始加载 DualCanvasViewer MJS 组件...");
				let n = async (e) => {
					let t = [
						`./test-sfc/sfcLib/dist/dual-canvas-viewer-sfc/${e}`,
						`./public/test-sfc/sfcLib/dist/dual-canvas-viewer-sfc/${e}`,
						`../test-sfc/sfcLib/dist/dual-canvas-viewer-sfc/${e}`,
						`../../public/test-sfc/sfcLib/dist/dual-canvas-viewer-sfc/${e}`
					];
					for (let e of t) try {
						let t = e.startsWith("http") ? e : `${window.location.origin}/${e.replace(/^\.\//, "").replace(/^\.\.\//, "")}`;
						if ((await fetch(t)).ok) return console.log(`[SetContentMjsExampleContent] 资源路径解析成功: ${e}`), e;
					} catch {
						continue;
					}
					return console.warn("[SetContentMjsExampleContent] 所有路径模式失败，使用默认路径"), `./test-sfc/sfcLib/dist/dual-canvas-viewer-sfc/${e}`;
				}, r = await n("lib/dual-canvas-viewer.css"), i = await n("lib/dual-canvas-viewer.mjs");
				console.log("[SetContentMjsExampleContent] 资源路径:", {
					css: r,
					component: i
				}), await ((e) => new Promise((t, n) => {
					if (document.querySelector(`link[href="${e}"]`)) {
						t();
						return;
					}
					let r = document.createElement("link");
					r.rel = "stylesheet", r.href = e, r.onload = t, r.onerror = n, document.head.appendChild(r);
				}))(r), console.log("[SetContentMjsExampleContent] CSS 已加载");
				let a = {
					moduleCache: { vue: t },
					getFile: async (e) => {
						console.log("[SetContentMjsExampleContent] 获取文件:", e);
						try {
							let t = await fetch(e, {
								cache: "no-cache",
								headers: {
									"Cache-Control": "no-cache",
									Pragma: "no-cache"
								}
							});
							if (console.log("[SetContentMjsExampleContent] fetch 响应状态:", t.status, t.statusText), !t.ok) throw Error("无法加载文件: " + e + " (" + t.status + " " + t.statusText + ")");
							let n = await t.text();
							return console.log("[SetContentMjsExampleContent] ✅ 文件内容获取成功，长度:", n.length), n;
						} catch (e) {
							throw console.error("[SetContentMjsExampleContent] ❌ getFile 错误:", e), e;
						}
					},
					addStyle: (e) => {
						let t = document.createElement("style");
						t.textContent = e, document.head.appendChild(t);
					}
				}, o = i;
				console.log("[SetContentMjsExampleContent] 加载 MJS 组件:", o);
				try {
					let n = await e(o, a);
					console.log("[SetContentMjsExampleContent] ✅ loadModule 成功:", n);
					let r = document.getElementById(this.containerId);
					if (r) console.log("[SetContentMjsExampleContent] 容器已存在:", this.containerId);
					else {
						r = document.createElement("div"), r.id = this.containerId, r.className = "dual-canvas-wrapper dual-canvas-overlay-single";
						let e = !this.isSingleton && this.panelInstanceId !== null ? 1e5 + this.panelInstanceId * 100 : 1e5;
						r.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: ${e}; background: transparent; pointer-events: auto;`, document.body.appendChild(r), console.log("[SetContentMjsExampleContent] 容器已添加到 body:", this.containerId, "zIndex:", e);
					}
					let i = document.getElementById(this.closeBtnId);
					if (i) console.log("[SetContentMjsExampleContent] 关闭按钮已存在:", this.closeBtnId);
					else {
						i = document.createElement("button"), i.id = this.closeBtnId, i.textContent = "× 关闭", i.className = "dual-canvas-instance-close";
						let e = !this.isSingleton && this.panelInstanceId !== null ? 101500 + this.panelInstanceId * 100 : 101500;
						i.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: ${e};
              padding: 8px 16px;
              background: rgba(244, 67, 54, 0.9);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              pointer-events: auto;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `, i.onclick = () => this.handleExitFullscreen(), document.body.appendChild(i), console.log("[SetContentMjsExampleContent] 关闭按钮已添加到 body:", this.closeBtnId, "zIndex:", e);
					}
					let s = this.$refs.panelContent;
					s ? (console.log("[SetContentMjsExampleContent] 开始更新面板内容..."), console.log("[SetContentMjsExampleContent] panelContent 原始内容:", s.innerHTML), s.innerHTML = "<div class=\"fullscreen-hint\">DualCanvasViewer 已全屏显示</div>", console.log("[SetContentMjsExampleContent] panelContent 更新后内容:", s.innerHTML), console.log("[SetContentMjsExampleContent] 面板内容已清空，显示提示信息")) : console.warn("[SetContentMjsExampleContent] panelContent 引用未找到"), console.log("[SetContentMjsExampleContent] 容器已创建，等待 DOM 布局完成..."), console.log("[SetContentMjsExampleContent] 容器初始尺寸:", r.offsetWidth, "x", r.offsetHeight), await new Promise((e) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(e)))), console.log("[SetContentMjsExampleContent] DOM 布局完成，容器尺寸:", r.offsetWidth, "x", r.offsetHeight), console.log("[SetContentMjsExampleContent] 开始挂载组件...");
					let c = t.createApp(n.default), l = c.mount(r);
					this.vueApp = c, this.mjsComponent = l, this.isMounted = !0, this.hasInitializedOnce = !0, console.log("[SetContentMjsExampleContent] ✅ DualCanvasViewer 已挂载 (MJS):", this.containerId), this.$emit("initialized");
				} catch (e) {
					console.error("[SetContentMjsExampleContent] ❌ loadModule 失败:", e), console.error("[SetContentMjsExampleContent] 错误堆栈:", e.stack), console.error("[SetContentMjsExampleContent] 错误详情:", e.message);
				}
			} catch (e) {
				console.error("[SetContentMjsExampleContent] MJS 加载失败:", e), console.error("[SetContentMjsExampleContent] 错误详情:", e.stack);
			}
		},
		handleExitFullscreen() {
			console.log("[SetContentMjsExampleContent] 退出全屏模式"), this.disposeDualCanvasViewer(), this.hasInitializedOnce = !1, this.$emit("close");
		},
		disposeDualCanvasViewer() {
			if (!this.isMounted) {
				console.log("[SetContentMjsExampleContent] 未挂载，无需清理");
				return;
			}
			try {
				let e = document.getElementById(this.containerId);
				if (e && this.vueApp) {
					this.vueApp.unmount(), this.vueApp = null, this.mjsComponent = null, e.parentNode && e.parentNode.removeChild(e);
					let t = document.getElementById(this.closeBtnId);
					t && t.parentNode && (t.parentNode.removeChild(t), console.log("[SetContentMjsExampleContent] ✅ 关闭按钮已清理:", this.closeBtnId)), this.isMounted = !1, console.log("[SetContentMjsExampleContent] ✅ DualCanvasViewer 已卸载 (MJS)，容器已清理:", this.containerId), this.$emit("disposed");
				}
			} catch (e) {
				console.error("[SetContentMjsExampleContent] 清理失败:", e);
			}
		}
	}
}, s = {
	ref: "panelContent",
	class: "set-content-mjs-example-content"
};
function c(a, o, c, l, u, d) {
	return i((n(), e("div", s, [...o[0] ||= [t("div", { class: "loading-message" }, "正在初始化双画布查看器（MJS模式）...", -1)]], 512)), [[r, !c.isClosed]]);
}
var l = /*#__PURE__*/ a(o, [["render", c], ["__scopeId", "data-v-dcb4a3c3"]]);
//#endregion
export { l as default };
