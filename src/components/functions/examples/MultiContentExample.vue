<template>
  <MultiContentPanel
    ref="panel"
    title="多内容面板"
    :auto-register="autoRegister !== undefined ? autoRegister : true"
    :registration-key="registrationKey || 'MultiContentExample'"
    :panel-instance-id="panelInstanceId"
    :initial-x="initialX"
    :initial-y="initialY"
    v-bind="$attrs"
    @vue:mounted="onTestPanelMounted"
    @vue:updated="onTestPanelUpdated"
  >
    <template #toolbar>
      <button class="toolbar-btn" @click="switchToHeightPanel">高度调整</button>
      <button class="toolbar-btn" @click="switchToPhotoPanel">倾斜摄影</button>
    </template>
  </MultiContentPanel>
</template>

<script>
import MultiContentPanel from './MultiContentPanelExample.vue';
import ObliqueHeightAdjustPanel from '../lib/ObliqueHeightAdjustPanel.mjs';
import '../lib/ObliqueHeightAdjustPanel.mjs.css';
import ObliquePhotographyPanel from '../lib/ObliquePhotographyPanel.mjs';
import '../lib/ObliquePhotographyPanel.mjs.css';

export default {
  name: 'MultiContentExample',
  components: {
    MultiContentPanel
  },
  props: {
    // ⭐ 接收多实例面板的属性
    registrationKey: {
      type: String,
      default: 'MultiContentExample'
    },
    panelInstanceId: {
      type: Number,
      default: null
    },
    autoRegister: {
      type: Boolean,
      default: true
    },
    initialX: {
      type: [Number, String],
      default: 'center'
    },
    initialY: {
      type: Number,
      default: 280
    }
  },
  data() {
    return {
      selectedLayer: null,
      _hasDetectedPanelOpen: false
    };
  },
  beforeCreate() {
    console.log('[MultiContentExample] 🔵 beforeCreate - 组件即将创建');
  },
  created() {
    console.log('[MultiContentExample] 🟢 created - 组件已创建', {
      registrationKey: this.registrationKey,
      panelInstanceId: this.panelInstanceId,
      autoRegister: this.autoRegister,
      $attrs: this.$attrs
    });
  },
  beforeMount() {
    console.log('[MultiContentExample] 🟡 beforeMount - 组件即将挂载');
    console.log('[MultiContentExample] 🟡 检查 $refs.panel:', this.$refs.panel);
  },
  mounted() {
    console.log('[MultiContentExample] 🔔 mounted - 组件已挂载！', {
      registrationKey: this.registrationKey,
      panelInstanceId: this.panelInstanceId,
      autoRegister: this.autoRegister,
      $el: this.$el,
      $elTagName: this.$el?.tagName,
      $elNodeType: this.$el?.nodeType
    });

    // 检查 TestPanelModule 子组件
    if (this.$refs.panel) {
      console.log('[MultiContentExample] 🔔 TestPanelModule 引用:', this.$refs.panel);
      console.log('[MultiContentExample] 🔔 TestPanelModule $el:', this.$refs.panel.$el);
      console.log('[MultiContentExample] 🔔 TestPanelModule isClosed:', this.$refs.panel.isClosed);
    } else {
      console.error('[MultiContentExample] ❌ $refs.panel 为空！');
    }

    console.log('[MultiContentExample] 🔔 立即检查 DOM 元素:', {
      panelElements: document.querySelectorAll('.function-panel').length,
      testPanelModule: document.querySelectorAll('[class*="test-panel"]').length,
      allElementsWithPanel: document.querySelectorAll('[class*="panel"]').length
    });

    // 智能等待面板元素出现（处理 Teleport 延迟）
    this.checkForPanelElement();

    // 同时监听面板状态变化
    this.waitForPanelOpen();
  },
  beforeUpdate() {
    console.log('[MultiContentExample] 🟠 beforeUpdate - 组件即将更新');
  },
  updated() {
    console.log('[MultiContentExample] 🟣 updated - 组件已更新');

    // 检测面板是否刚刚打开
    if (this.$refs.panel && this.$refs.panel.isClosed === false) {
      // 使用标志避免重复检测
      if (!this._hasDetectedPanelOpen) {
        this._hasDetectedPanelOpen = true;
        console.log('[MultiContentExample] ✅ 检测到面板已打开，开始检测面板元素');

        // 延迟检测，确保 Teleport 完成
        this.$nextTick(() => {
          setTimeout(() => {
            this.checkForPanelElement(5, 50);
          }, 150);
        });
      }
    } else if (this.$refs.panel && this.$refs.panel.isClosed === true) {
      // 面板关闭时重置标志
      this._hasDetectedPanelOpen = false;
    }
  },
  beforeUnmount() {
    console.log('[MultiContentExample] 🔴 beforeUnmount - 组件即将卸载');
  },
  unmounted() {
    console.log('[MultiContentExample] ⚫ unmounted - 组件已卸载');
  },
  methods: {
    // 检查面板元素是否存在
    checkForPanelElement(maxRetries = 5, retryDelay = 100) {
      let attempts = 0;

      const check = () => {
        attempts++;
        const panels = document.querySelectorAll('.function-panel');

        console.log(`[MultiContentExample] 🔔 检查面板元素 (尝试 ${attempts}/${maxRetries})`, {
          面板数量: panels.length,
          TestPanelModule引用: !!this.$refs.panel,
          isClosed状态: this.$refs.panel?.isClosed
        });

        if (panels.length > 0) {
          console.log('[MultiContentExample] ✅ 找到面板元素！');
          panels.forEach((p, i) => {
            const styles = window.getComputedStyle(p);
            const rect = p.getBoundingClientRect();
            const parent = p.parentElement;

            console.log(`[MultiContentExample] 🔔 面板 ${i}:`, {
              标签: p.tagName,
              类名: p.className,
              样式: {
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                zIndex: styles.zIndex,
                position: styles.position,
                transform: styles.transform,
                pointerEvents: styles.pointerEvents
              },
              位置信息: {
                位置: rect,
                在视口内: (
                  rect.top >= 0 &&
                  rect.left >= 0 &&
                  rect.bottom <= window.innerHeight &&
                  rect.right <= window.innerWidth
                ),
                屏幕中心可见: (
                  rect.left < window.innerWidth / 2 &&
                  rect.right > window.innerWidth / 2 &&
                  rect.top < window.innerHeight / 2 &&
                  rect.bottom > window.innerHeight / 2
                )
              },
              父元素: parent ? {
                标签: parent.tagName,
                id: parent.id || '(无)',
                类名: parent.className || '(无)'
              } : '(无父元素)',
              子元素数量: p.children.length,
              HTML内容: p.innerHTML.substring(0, 200) + (p.innerHTML.length > 200 ? '...' : '')
            });

            // 详细调试：检查面板是否被其他元素遮挡
            console.log(`[MultiContentExample] 🔍 面板 ${i} 详细调试:`, {
              面板矩形: rect,
              窗口尺寸: {
                width: window.innerWidth,
                height: window.innerHeight
              },
              面板是否在屏幕外: {
                上方: rect.bottom < 0,
                下方: rect.top > window.innerHeight,
                左侧: rect.right < 0,
                右侧: rect.left > window.innerWidth
              },
              动画状态: {
                有进入动画类: p.classList.contains('panel-fade-enter-active'),
                有进入起始类: p.classList.contains('panel-fade-enter-from'),
                有进入完成类: p.classList.contains('panel-fade-enter-to')
              }
            });

            // 延迟检查，看看动画是否完成
            setTimeout(() => {
              const stylesAfter = window.getComputedStyle(p);
              const rectAfter = p.getBoundingClientRect();
              const stillHasEnterClasses = p.classList.contains('panel-fade-enter-from') || p.classList.contains('panel-fade-enter-active');

              console.log(`[MultiContentExample] ⏰ 面板 ${i} 动画后状态 (500ms):`, {
                位置: rectAfter,
                样式: {
                  opacity: stylesAfter.opacity,
                  display: stylesAfter.display,
                  visibility: stylesAfter.visibility,
                  transform: stylesAfter.transform,
                  pointerEvents: stylesAfter.pointerEvents
                },
                可见性: (
                  stylesAfter.opacity !== '0' &&
                  stylesAfter.display !== 'none' &&
                  stylesAfter.visibility !== 'hidden'
                ),
                动画类: {
                  仍有进入动画类: stillHasEnterClasses,
                  当前类名: p.className,
                  panelFadeEnterFrom: p.classList.contains('panel-fade-enter-from'),
                  panelFadeEnterActive: p.classList.contains('panel-fade-enter-active'),
                  panelFadeEnterTo: p.classList.contains('panel-fade-enter-to')
                },
                是否在视口内: (
                  rectAfter.top >= -100 &&
                  rectAfter.left >= -100 &&
                  rectAfter.bottom <= window.innerHeight + 100 &&
                  rectAfter.right <= window.innerWidth + 100
                ),
                实际屏幕位置: {
                  top: rectAfter.top,
                  left: rectAfter.left,
                  right: rectAfter.right,
                  bottom: rectAfter.bottom,
                  width: rectAfter.width,
                  height: rectAfter.height
                }
              });

              // 如果动画卡住了，手动移除动画类
              if (stillHasEnterClasses) {
                console.warn('[MultiContentExample] ⚠️ 检测到动画卡住，手动移除动画类');
                p.classList.remove('panel-fade-enter-from', 'panel-fade-enter-active', 'panel-fade-enter-to');
                p.classList.add('panel-fade-enter-to');

                // 强制重排以触发重绘
                void p.offsetWidth;

                // 再检查一次
                setTimeout(() => {
                  const finalStyles = window.getComputedStyle(p);
                  const finalRect = p.getBoundingClientRect();
                  console.log('[MultiContentExample] 🔧 移除动画类后的最终状态:', {
                    位置: finalRect,
                    样式: {
                      opacity: finalStyles.opacity,
                      display: finalStyles.display,
                      visibility: finalStyles.visibility
                    },
                    可见性: (
                      finalStyles.opacity !== '0' &&
                      finalStyles.display !== 'none' &&
                      finalStyles.visibility !== 'hidden'
                    )
                  });
                }, 100);
              }
            }, 500);
          });
          return true;
        }

        if (attempts < maxRetries) {
          setTimeout(check, retryDelay);
        } else {
          console.warn('[MultiContentExample] ⚠️ 超时：未找到面板元素');
          console.log('[MultiContentExample] 💡 可能原因：面板仍处于关闭状态 (isClosed: true)');
          this.debugPanelState();
        }
        return false;
      };

      // 首次检查
      this.$nextTick(() => check());
    },

    // 等待面板打开
    waitForPanelOpen() {
      if (!this.$refs.panel) return;

      // 检查面板状态 - 处理 undefined, true, false 三种状态
      const isOpen = this.$refs.panel.isClosed === false;

      // 如果面板已经打开，立即检查
      if (isOpen) {
        console.log('[MultiContentExample] ✅ 面板已打开，执行面板元素检查');
        this.$nextTick(() => {
          setTimeout(() => {
            this.checkForPanelElement(5, 50);
          }, 100);
        });
        return;
      }

      console.log('[MultiContentExample] ⏸️ 面板当前状态:', {
        isClosed: this.$refs.panel.isClosed,
        说明: '面板未打开，等待用户操作或状态变化'
      });

      // 注意：我们不再使用轮询等待面板打开
      // 因为面板可能需要用户手动点击按钮才会打开
      // 我们使用 watch 来监听状态变化
    },

    // 调试面板状态
    debugPanelState() {
      console.log('[MultiContentExample] 🔍 面板状态调试:', {
        TestPanelModule: {
          存在: !!this.$refs.panel,
          isClosed: this.$refs.panel?.isClosed,
          $el: this.$refs.panel?.$el
        },
        DOM状态: {
          bodyChildren: document.body.children.length,
          functionPanelCount: document.querySelectorAll('.function-panel').length,
          testPanelElements: document.querySelectorAll('[class*="test-panel"]').length
        },
        配置信息: {
          registrationKey: this.registrationKey,
          panelInstanceId: this.panelInstanceId,
          autoRegister: this.autoRegister
        }
      });

      // 检查可能遮挡面板的高 z-index 元素
      this.checkOverlappingElements();
    },

    // 检查可能遮挡面板的元素
    checkOverlappingElements() {
      const panel = document.querySelector('.function-panel');
      if (!panel) {
        console.log('[MultiContentExample] 🔍 没有找到面板元素，跳过遮挡检查');
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const panelZIndex = parseInt(window.getComputedStyle(panel).zIndex) || 0;

      console.log('[MultiContentExample] 🔍 检查可能遮挡面板的元素:', {
        面板位置: panelRect,
        面板zIndex: panelZIndex
      });

      // 获取所有可能遮挡的元素
      const allElements = document.querySelectorAll('*');
      const overlappingElements = [];

      allElements.forEach(el => {
        if (el === panel || panel.contains(el)) return;

        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex);
        const display = styles.display;
        const visibility = styles.visibility;
        const opacity = styles.opacity;

        // 只检查可见的和 z-index 更高的元素
        if (display !== 'none' && visibility !== 'hidden' && opacity !== '0' && zIndex > panelZIndex) {
          const rect = el.getBoundingClientRect();

          // 检查是否重叠
          const isOverlapping = !(
            rect.right < panelRect.left ||
            rect.left > panelRect.right ||
            rect.bottom < panelRect.top ||
            rect.top > panelRect.bottom
          );

          if (isOverlapping) {
            overlappingElements.push({
              标签: el.tagName,
              id: el.id || '(无)',
              类名: el.className || '(无)',
              zIndex: zIndex,
              位置: rect,
              重叠区域: {
                left: Math.max(panelRect.left, rect.left),
                right: Math.min(panelRect.right, rect.right),
                top: Math.max(panelRect.top, rect.top),
                bottom: Math.min(panelRect.bottom, rect.bottom)
              }
            });
          }
        }
      });

      if (overlappingElements.length > 0) {
        console.warn('[MultiContentExample] ⚠️ 发现可能遮挡面板的元素:', overlappingElements);
      } else {
        console.log('[MultiContentExample] ✅ 没有发现明显遮挡面板的元素');
      }
    },

    onTestPanelMounted() {
      console.log('[MultiContentExample] 🎯 收到 TestPanelModule mounted 事件！');
      console.log('[MultiContentExample] 🎯 TestPanelModule isClosed:', this.$refs.panel?.isClosed);
      this.$nextTick(() => {
        console.log('[MultiContentExample] 🎯 TestPanelModule mounted 后的 DOM 检查:', {
          panelElements: document.querySelectorAll('.function-panel').length,
          testPanelRef: this.$refs.panel?.$el
        });
      });
    },
    onTestPanelUpdated() {
      console.log('[MultiContentExample] 🎯 收到 TestPanelModule updated 事件！');
    },
    switchToHeightPanel() {
      this.$refs.panel.setContent(ObliqueHeightAdjustPanel, {
        props: {
          'selected-layer': this.selectedLayer
        },
        events: {
          'height-change': this.handleHeightChange
        },
        title: '高度调整',
        titleIcon: '🌏'
      });
    },
    switchToPhotoPanel() {
      this.$refs.panel.setContent(ObliquePhotographyPanel, {
        props: {
          'initial-x': 'center',
          'initial-y': 120
        },
        events: {
          'layer-loaded': this.handleLayerLoaded
        },
        title: '倾斜摄影',
        titleIcon: '📷'
      });
    },
    handleHeightChange(data) {
      console.log('高度变化:', data);
    },
    handleLayerLoaded(data) {
      console.log('图层加载:', data);
    }
  }
};
</script>
