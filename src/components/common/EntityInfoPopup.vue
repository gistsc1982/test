<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="visible"
        class="entity-info-popup"
        :style="popupStyle"
        @click.stop
        ref="popupRef"
      >
        <!-- 头部 -->
        <div class="popup-header">
          <span class="popup-title">{{ displayTitle }}</span>
          <div class="popup-header-actions">
            <button
              v-if="canFlyTo"
              class="popup-action-btn fly-btn"
              @click="onFlyTo"
              title="飞行定位"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
            </button>
            <button
              class="popup-action-btn close-btn"
              @click="onClose"
              title="关闭"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="2" y1="2" x2="12" y2="12"/>
                <line x1="12" y1="2" x2="2" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 属性表格 -->
        <div class="popup-body">
          <table v-if="properties && properties.length > 0" class="popup-table">
            <tbody>
              <tr v-for="(prop, idx) in properties" :key="idx">
                <td class="prop-name">{{ prop.name }}</td>
                <td class="prop-value" :title="prop.value">{{ prop.value }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="popup-empty">无属性信息</div>
        </div>

        <!-- 底部操作 -->
        <div v-if="geoType" class="popup-footer">
          <span class="popup-geo-tag" :class="'tag-' + geoType">
            {{ geoTypeLabel }}
          </span>
          <span v-if="layerName" class="popup-layer-tag">{{ layerName }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
/**
 * EntityInfoPopup — 通用实体属性弹出面板
 *
 * Props:
 *   visible      - 是否显示
 *   title        - 弹窗标题（可选，默认从 properties 提取）
 *   properties   - 属性列表 [{ name, value }, ...]
 *   screenX      - 屏幕 X 坐标 (px)
 *   screenY      - 屏幕 Y 坐标 (px)
 *   geoType      - 几何类型 (point/polygon/polyline/model/3dtiles/billboard/unknown)
 *   layerName    - 图层名称（可选）
 *   canFlyTo     - 是否显示"飞行定位"按钮
 *   offsetX      - 水平偏移，默认 20
 *   offsetY      - 垂直偏移，默认 -40
 *
 * Events:
 *   close        - 关闭弹窗
 *   fly-to       - 飞行定位到实体
 */

// geoType 标签映射
var GEO_LABELS = {
  point: '点',
  polygon: '面',
  polyline: '线',
  model: '3D 模型',
  billboard: '图标',
  label: '标签',
  '3dtiles': '3D Tiles',
  unknown: '实体'
};

export default {
  name: 'EntityInfoPopup',

  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    properties: { type: Array, default: function () { return []; } },
    screenX: { type: Number, default: 0 },
    screenY: { type: Number, default: 0 },
    geoType: { type: String, default: '' },
    layerName: { type: String, default: '' },
    canFlyTo: { type: Boolean, default: true },
    offsetX: { type: Number, default: 20 },
    offsetY: { type: Number, default: -40 }
  },

  emits: ['close', 'fly-to'],

  data: function () {
    return {
      // 内部跟踪位置（用于 postRender 更新）
      _trackX: 0,
      _trackY: 0
    };
  },

  computed: {
    displayTitle: function () {
      if (this.title) return this.title;
      if (this.properties && this.properties.length > 0) {
        var firstName = this.properties.find(function (p) {
          return p.name === '名称';
        });
        if (firstName) return firstName.value;
        return this.properties[0].value || '实体属性';
      }
      return '实体属性';
    },

    geoTypeLabel: function () {
      return GEO_LABELS[this.geoType] || this.geoType || '';
    },

    popupStyle: function () {
      var x = this._trackX || this.screenX;
      var y = this._trackY || this.screenY;

      // 边界保护：确保弹窗不超出屏幕
      var maxX = (typeof window !== 'undefined' ? window.innerWidth : 1920) - 260;
      var maxY = (typeof window !== 'undefined' ? window.innerHeight : 1080) - 100;

      x = Math.max(10, Math.min(x + this.offsetX, maxX));
      y = Math.max(10, Math.min(y + this.offsetY, maxY));

      return {
        left: Math.round(x) + 'px',
        top: Math.round(y) + 'px'
      };
    }
  },

  watch: {
    screenX: function (val) { this._trackX = val; },
    screenY: function (val) { this._trackY = val; }
  },

  created: function () {
    this._trackX = this.screenX;
    this._trackY = this.screenY;

    var self = this;
    this._onKeydown = function (e) {
      if (e.key === 'Escape' && self.visible) {
        self.onClose();
      }
    };
  },

  mounted: function () {
    document.addEventListener('keydown', this._onKeydown);
  },

  beforeUnmount: function () {
    document.removeEventListener('keydown', this._onKeydown);
    this._removeOutsideClick();
  },

  methods: {
    /**
     * 更新屏幕位置（由外部 postRender 回调调用）
     */
    updatePosition: function (x, y) {
      this._trackX = x;
      this._trackY = y;
    },

    onClose: function () {
      this.$emit('close');
    },

    onFlyTo: function () {
      this.$emit('fly-to');
    },

    _removeOutsideClick: function () {
      if (this._outsideHandler) {
        document.removeEventListener('click', this._outsideHandler);
        this._outsideHandler = null;
      }
    }
  }
};
</script>

<style scoped>
/* ========== 弹出面板容器 ========== */
.entity-info-popup {
  position: fixed;
  z-index: 200000;
  min-width: 220px;
  max-width: 320px;
  max-height: 60vh;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(255, 107, 53, 0.5);
  border-radius: 10px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(255, 107, 53, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e0e0e0;
  font-size: 13px;
  user-select: none;
}

/* ========== 头部 ========== */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.popup-title {
  font-size: 14px;
  font-weight: 600;
  color: #FF6B35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}

.popup-header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.popup-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: #b0b0b0;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.popup-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.fly-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.close-btn:hover {
  border-color: #FF6B6B;
  color: #FF6B6B;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

/* ========== 属性表格 ========== */
.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
  max-height: 40vh;
}

.popup-body::-webkit-scrollbar {
  width: 4px;
}

.popup-body::-webkit-scrollbar-track {
  background: transparent;
}

.popup-body::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 53, 0.3);
  border-radius: 2px;
}

.popup-table {
  width: 100%;
  border-collapse: collapse;
}

.popup-table tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.popup-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.prop-name {
  padding: 6px 12px;
  color: #909090;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  width: 35%;
  vertical-align: top;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.prop-value {
  padding: 6px 12px;
  color: #d0d0d0;
  font-size: 12px;
  word-break: break-all;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 空状态 ========== */
.popup-empty {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

/* ========== 底部标签 ========== */
.popup-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.popup-geo-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.tag-point {
  background: rgba(33, 150, 243, 0.2);
  color: #64B5F6;
}

.tag-polygon {
  background: rgba(156, 39, 176, 0.2);
  color: #CE93D8;
}

.tag-polyline {
  background: rgba(255, 152, 0, 0.2);
  color: #FFB74D;
}

.tag-model {
  background: rgba(76, 175, 80, 0.2);
  color: #81C784;
}

.tag-billboard {
  background: rgba(255, 193, 7, 0.2);
  color: #FFD54F;
}

.tag-3dtiles {
  background: rgba(233, 30, 99, 0.2);
  color: #F06292;
}

.tag-unknown {
  background: rgba(255, 255, 255, 0.1);
  color: #999;
}

.popup-layer-tag {
  font-size: 10px;
  color: #666;
  margin-left: auto;
}

/* ========== 过渡动画 ========== */
.popup-fade-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-fade-leave-active {
  transition: all 0.15s ease-in;
}

.popup-fade-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

.popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
  .entity-info-popup {
    min-width: 180px;
    max-width: 260px;
    font-size: 12px;
  }
}
</style>
