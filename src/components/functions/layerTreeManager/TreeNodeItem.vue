<template>
  <li class="tree-node-li">
    <div
      class="tree-node-row"
      :class="{ 'tree-node-selected': isSelected }"
      :style="{ paddingLeft: (depth * 24 + 8) + 'px' }"
      @click="onSelect"
    >
      <span
        class="tree-node-arrow"
        :class="{ 'tree-node-arrow-hidden': !hasChildren }"
        @click.stop="onToggle"
      >
        <span v-if="hasChildren" class="tree-arrow-icon">{{ isExpanded ? '▼' : '▶' }}</span>
        <span v-else class="tree-arrow-spacer"></span>
      </span>

      <!-- 图层勾选框（叶子节点且有 URL 时显示） -->
      <label
        v-if="isLeafWithUrl"
        class="tree-node-checkbox"
        :class="{ 'tree-node-checkbox-disabled': isLoading }"
        @click.stop
        :title="checkboxTitle"
      >
        <!-- 加载中旋转图标 -->
        <span v-if="isLoading" class="layer-loading-spinner" title="正在加载图层...">⏳</span>
        <template v-else>
          <input
            type="checkbox"
            :checked="isLayerLoaded"
            @change="onToggleLayer"
            :disabled="isLoading"
            class="layer-check-input"
          />
          <span class="layer-check-indicator" :class="{ checked: isLayerLoaded }"></span>
        </template>
      </label>
      <span v-else-if="!hasChildren" class="tree-node-no-check"></span>

      <span class="tree-node-icon">{{ nodeIcon }}</span>
      <span class="tree-node-name">{{ node.name }}</span>

      <span v-if="isLayerLoaded && !hasError" class="tree-node-status loaded" title="已加载到地图">✅</span>
      <span v-if="hasError" class="tree-node-status error-status" :title="errorMessage">{{ errorIcon }} {{ errorLabel }}</span>

      <span class="tree-node-type-tag" :class="isFolder ? 'tag-folder' : 'tag-layer'">
        {{ isFolder ? '目录' : '图层' }}
      </span>

      <span v-if="!nodeVisible" class="tree-node-hidden-tag" title="已隐藏">👁️‍🗨️</span>

      <span class="tree-node-actions">
        <button class="tree-action-btn" @click.stop="onEdit" title="编辑节点" type="button">✏️</button>
        <button class="tree-action-btn" @click.stop="onAddChild" title="添加子节点" type="button">📂</button>
        <button class="tree-action-btn tree-action-btn-danger" @click.stop="onDelete" title="删除节点" type="button">🗑️</button>
      </span>
    </div>

    <ul v-if="hasChildren && isExpanded" class="tree-children">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :all-flat-nodes="allFlatNodes"
        :expanded-ids="expandedIds"
        :selected-id="selectedId"
        :loaded-layer-ids="loadedLayerIds"
        :loading-layer-ids="loadingLayerIds"
        :layer-errors="layerErrors"
        @toggle-expand="(id) => $emit('toggle-expand', id)"
        @select-node="(id) => $emit('select-node', id)"
        @add-child="(n) => $emit('add-child', n)"
        @edit-node="(n) => $emit('edit-node', n)"
        @delete-node="(n) => $emit('delete-node', n)"
        @toggle-layer="(n) => $emit('toggle-layer', n)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'TreeNodeItem',
  props: {
    node: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    allFlatNodes: { type: Array, default: () => [] },
    expandedIds: { type: Set, default: () => new Set() },
    selectedId: { type: String, default: null },
    loadedLayerIds: { type: Object, default: () => ({}) },
    loadingLayerIds: { type: Object, default: () => ({}) },
    layerErrors: { type: Object, default: () => ({}) }
  },
  emits: ['toggle-expand', 'select-node', 'add-child', 'edit-node', 'delete-node', 'toggle-layer'],
  computed: {
    hasChildren() {
      return this.node.children && this.node.children.length > 0;
    },
    isExpanded() {
      return this.expandedIds.has(this.node.id);
    },
    isSelected() {
      return this.selectedId === this.node.id;
    },
    isFolder() {
      return this.node.nodeType === 'folder';
    },
    isLeafWithUrl() {
      return !this.isFolder && this.node.url && this.node.url.trim().length > 0;
    },
    isLayerLoaded() {
      return !!this.loadedLayerIds[this.node.id];
    },
    isLoading() {
      return !!this.loadingLayerIds[this.node.id];
    },
    hasError() {
      return !!this.layerErrors[this.node.id];
    },
    errorMessage() {
      const err = this.layerErrors[this.node.id];
      return err ? (err.message || '') : '';
    },
    errorLabel() {
      const err = this.layerErrors[this.node.id];
      return err ? (err.label || '加载失败') : '加载失败';
    },
    errorIcon() {
      const err = this.layerErrors[this.node.id];
      return err ? (err.icon || '❌') : '❌';
    },
    checkboxTitle() {
      if (this.isLoading) return '正在加载图层...';
      if (this.hasError) return `加载失败: ${this.errorMessage}\n点击重试`;
      if (this.isLayerLoaded) return '点击从地图移除';
      return '点击加载到地图';
    },
    nodeVisible() {
      return this.node.visible !== 0 && this.node.visible !== false;
    },
    nodeIcon() {
      if (this.node.icon) return this.node.icon;
      return this.isFolder ? '📁' : '📄';
    }
  },
  methods: {
    onToggle() {
      this.$emit('toggle-expand', this.node.id);
    },
    onSelect() {
      this.$emit('select-node', this.node.id);
    },
    onAddChild() {
      this.$emit('add-child', this.node);
    },
    onEdit() {
      this.$emit('edit-node', this.node);
    },
    onDelete() {
      this.$emit('delete-node', this.node);
    },
    onToggleLayer() {
      this.$emit('toggle-layer', this.node);
    }
  }
};
</script>

<style scoped>
/* ========== 图层勾选框 ========== */
.tree-node-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-right: 2px;
}

.layer-check-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.layer-check-indicator {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.04);
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.layer-check-indicator.checked {
  background: #4CAF50;
  border-color: #4CAF50;
}

.layer-check-indicator.checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.tree-node-checkbox:hover .layer-check-indicator {
  border-color: rgba(255, 255, 255, 0.45);
}

.tree-node-no-check {
  display: inline-block;
  width: 14px;
  margin-right: 2px;
  flex-shrink: 0;
}

.tree-node-status {
  font-size: 10px;
  flex-shrink: 0;
  margin-right: 2px;
}

.tree-node-status.loaded {
  color: #4CAF50;
}

.tree-node-status.error-status {
  color: #FF6B6B;
  cursor: help;
  font-size: 11px;
  font-weight: 500;
  margin-left: 2px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  white-space: nowrap;
  flex-shrink: 0;
}

.tree-node-status.error-status:hover {
  background: rgba(255, 107, 107, 0.18);
}

/* ========== 加载中动画 ========== */
.layer-loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 12px;
  animation: layer-spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes layer-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tree-node-checkbox-disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* ========== 树节点容器 ========== */
.tree-node-li {
  list-style: none;
}

.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ========== 节点行（对齐 ant-design a-tree 视觉） ========== */
.tree-node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  margin: 1px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  min-height: 30px;
  user-select: none;
}

.tree-node-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.tree-node-row:hover .tree-node-actions {
  opacity: 1;
}

.tree-node-selected,
.tree-node-selected:hover {
  background: rgba(76, 175, 80, 0.18);
}

/* 展开/折叠箭头 */
.tree-node-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.15s;
}

.tree-node-arrow:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tree-node-arrow-hidden {
  cursor: default;
  visibility: hidden;
}

.tree-arrow-icon {
  font-size: 10px;
  color: #808090;
}

.tree-arrow-spacer {
  width: 10px;
  display: inline-block;
}

/* 节点图标 */
.tree-node-icon {
  font-size: 15px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

/* 节点名称 */
.tree-node-name {
  font-size: 13px;
  color: #e0e0e0;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 节点类型标记 */
.tree-node-type-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
  line-height: 16px;
}

.tag-folder {
  background: rgba(33, 150, 243, 0.15);
  color: #64B5F6;
}

.tag-layer {
  background: rgba(156, 39, 176, 0.15);
  color: #CE93D8;
}

/* 不可见标记 */
.tree-node-hidden-tag {
  font-size: 12px;
  opacity: 0.5;
  flex-shrink: 0;
}

/* 操作按钮组（hover 时显示） */
.tree-node-actions {
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
  margin-left: 4px;
}

.tree-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
  line-height: 1;
  padding: 0;
}

.tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-action-btn-danger:hover {
  background: rgba(255, 59, 48, 0.2);
}
</style>
