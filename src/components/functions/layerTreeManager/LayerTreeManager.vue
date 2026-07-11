<template>
  <JsonConfigPanelBase
    ref="basePanel"
    :panel-title="panelMetadata.panelName"
    :panel-icon="panelMetadata.panelIcon"
    :panel-width="480"
    :panel-max-height="'75vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    close-event-name="layerTreeManagerClose"
    :config-id="panelMetadata.configId"
    :panel-name="panelName || 'LayerTreeManager'"
    :auto-register="autoRegister !== false"
    :panel-instance-id="panelInstanceId"
    :registration-key="registrationKey || 'LayerTreeManager'"
    :field-definitions="panelMetadata.fieldDefinitions"
    :default-form-values="panelMetadata.defaultFormValues"
    :toolbar-buttons="panelMetadata.toolbarButtons"
    :lazy-load="true"
    @config-loaded="onConfigLoadedHandler"
  >
    <!-- ===== Header：标题 + 工具按钮（手动渲染，调用基类 toggleSection） ===== -->
    <template #header>
      <h3 class="panel-title">{{ panelMetadata.panelName }}</h3>
      <button
        @click.stop="toggleSection('showToolbar')"
        class="header-tool-btn"
        :class="{ 'sec-btn-on': sectionVisible.showToolbar }"
        title="显示/隐藏面板工具栏"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1.5" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="2.5" y1="6.5" x2="11.5" y2="6.5" stroke="currentColor" stroke-width="1.2"/>
          <line x1="2.5" y1="9" x2="8.5" y2="9" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        工具
      </button>
    </template>

    <!-- ===== 分区切换按钮（toolbar-extra 插槽） ===== -->
    <template #toolbar-extra>
      <span class="toolbar-sep"></span>
      <button
        @click="toggleSection('tree')"
        class="sec-btn"
        :class="{ 'sec-btn-on': sectionVisible.tree }"
        title="显示/隐藏树形区域"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="3" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <line x1="5.5" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="3" cy="9" r="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <line x1="5.5" y1="9" x2="12" y2="9" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        树形
      </button>
      <button
        @click="toggleSection('list')"
        class="sec-btn"
        :class="{ 'sec-btn-on': sectionVisible.list }"
        title="显示/隐藏列表区域"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1.5" width="12" height="4" rx="0.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <line x1="2.5" y1="7.5" x2="11.5" y2="7.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        列表
      </button>
      <span class="toolbar-sep"></span>
      <button
        @click="forceReloadGeoJsonConfig"
        :disabled="refreshLoading"
        class="sec-btn"
        :title="refreshLoading ? '刷新中...' : '从 JSON 文件强制刷新 GeoJSON 图层配置（忽略缓存）'"
        type="button"
      >
        {{ refreshLoading ? '⏳' : '🔄' }}
      </button>
    </template>

    <!-- ===== 树形图层展示区域（before-list 插槽） ===== -->
    <template #before-list>
      <div class="tree-manager-container" ref="treeContainer">
        <!-- 工具栏：添加根节点 -->
        <div class="tree-toolbar" :class="{ 'section-hidden': !sectionVisible.tree }">
          <button class="tree-btn tree-btn-primary" @click="addRootNode" type="button">
            <span class="tree-btn-icon">+</span>
            <span>添加根节点</span>
          </button>
          <button class="tree-btn tree-btn-outline" @click="expandAll" type="button">
            <span class="tree-btn-icon">▼</span>
            <span>全部展开</span>
          </button>
          <button class="tree-btn tree-btn-outline" @click="collapseAll" type="button">
            <span class="tree-btn-icon">▶</span>
            <span>全部折叠</span>
          </button>
        </div>

        <!-- 树形渲染区域 -->
        <div class="tree-wrapper" :class="{ 'section-hidden': !sectionVisible.tree }" v-if="treeData.length > 0">
          <ul class="tree-root">
            <TreeNodeItem
              v-for="node in treeData"
              :key="node.id"
              :node="node"
              :depth="0"
              :all-flat-nodes="configList"
              :expanded-ids="expandedIds"
              :selected-id="selectedNodeId"
              :loaded-layer-ids="loadedLayerIds"
              :loading-layer-ids="loadingLayerIds"
              :layer-errors="layerErrors"
              @toggle-expand="toggleExpand"
              @select-node="selectNode"
              @add-child="openAddChildDialog"
              @edit-node="openEditNodeDialog"
              @delete-node="confirmDeleteNode"
              @toggle-layer="toggleLayerLoad"
              @reload-layer="reloadLayerNode"
            />
          </ul>
        </div>

        <!-- 空状态 -->
        <div v-else class="tree-empty">
          <div class="tree-empty-icon">🌳</div>
          <div class="tree-empty-text">暂无图层树节点</div>
          <div class="tree-empty-hint">点击上方 "添加根节点" 按钮开始构建图层树</div>
        </div>
      </div>
    </template>

    <!-- ===== 列表项插槽（隐藏默认列表） ===== -->
    <template #list-item>
      <span style="display:none"></span>
    </template>

    <!-- ===== 自定义删除确认对话框 ===== -->
    <template #delete-warning-extra="{ item }">
      <div class="tree-delete-warning">
        <div class="tree-delete-warning-icon">⚠️</div>
        <div class="tree-delete-warning-text">
          将<strong>级联删除</strong>该节点及其所有子节点
        </div>
        <div v-if="getDescendantCount(item.id) > 0" class="tree-delete-count">
          共 <strong>{{ getDescendantCount(item.id) }}</strong> 个子节点将被一并删除
        </div>
      </div>
    </template>

    <!-- ===== 自定义对话框扩展 ===== -->
    <template #dialogs>
      <!-- 添加子节点对话框（为树节点添加子级） -->
      <Teleport to="body">
        <Transition name="tree-dialog-fade">
          <div v-if="showAddChildDialog" class="tree-dialog-overlay" @click.self="closeAddChildDialog">
            <div class="tree-dialog-panel">
              <div class="tree-dialog-header">
                <h3 class="tree-dialog-title">
                  📂 添加子节点 — 父节点: {{ parentNodeForAdd?.name || '未知' }}
                </h3>
                <button class="tree-dialog-close" @click="closeAddChildDialog" type="button">✕</button>
              </div>
              <div class="tree-dialog-body">
                <div class="tree-form-group">
                  <label class="tree-form-label">节点ID <span class="required">*</span></label>
                  <input v-model="addChildForm.id" class="tree-form-input" placeholder="唯一标识符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点名称 <span class="required">*</span></label>
                  <input v-model="addChildForm.name" class="tree-form-input" placeholder="图层或目录名称" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点类型</label>
                  <select v-model="addChildForm.nodeType" class="tree-form-select">
                    <option value="folder">📁 目录节点</option>
                    <option value="layer">📄 图层节点</option>
                  </select>
                </div>
                <div class="tree-form-group" v-if="addChildForm.nodeType === 'layer'">
                  <label class="tree-form-label">资源URL</label>
                  <input v-model="addChildForm.url" class="tree-form-input" placeholder="图层资源的URL地址" />
                </div>
                <div class="tree-form-group" v-if="addChildForm.nodeType === 'layer'">
                  <label class="tree-form-label">WMS图层名 <span style="font-weight:normal;color:#888;font-size:11px;">(WMS服务留空自动检测)</span></label>
                  <input v-model="addChildForm.wmsLayerName" class="tree-form-input" placeholder="如: gebco_latest_2024" />
                </div>
                <div class="tree-form-group" v-if="addChildForm.nodeType === 'layer'">
                  <label class="tree-form-label">MVT源图层 <span style="font-weight:normal;color:#888;font-size:11px;">(逗号分隔，留空自动检测)</span></label>
                  <input v-model="addChildForm.mvtSourceLayers" class="tree-form-input" placeholder="如: water,transportation,building" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">图标</label>
                  <input v-model="addChildForm.icon" class="tree-form-input" placeholder="emoji或字符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">排序序号</label>
                  <input v-model.number="addChildForm.sortOrder" class="tree-form-input" type="number" placeholder="0" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">描述信息</label>
                  <input v-model="addChildForm.description" class="tree-form-input" placeholder="节点描述" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-checkbox">
                    <input type="checkbox" v-model="addChildForm.visible" />
                    <span>可见</span>
                  </label>
                </div>
              </div>
              <div class="tree-dialog-footer">
                <button class="tree-btn tree-btn-outline" @click="closeAddChildDialog" type="button">取消</button>
                <button class="tree-btn tree-btn-primary" @click="confirmAddChild" type="button">确认添加</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 编辑节点对话框 -->
      <Teleport to="body">
        <Transition name="tree-dialog-fade">
          <div v-if="showEditDialog" class="tree-dialog-overlay" @click.self="closeEditDialog">
            <div class="tree-dialog-panel">
              <div class="tree-dialog-header">
                <h3 class="tree-dialog-title">✏️ 编辑节点</h3>
                <button class="tree-dialog-close" @click="closeEditDialog" type="button">✕</button>
              </div>
              <div class="tree-dialog-body">
                <div class="tree-form-group">
                  <label class="tree-form-label">节点ID <span class="readonly-hint">(只读)</span></label>
                  <input :value="editForm.id" class="tree-form-input" disabled />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点名称 <span class="required">*</span></label>
                  <input v-model="editForm.name" class="tree-form-input" placeholder="图层或目录名称" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">节点类型</label>
                  <select v-model="editForm.nodeType" class="tree-form-select">
                    <option value="folder">📁 目录节点</option>
                    <option value="layer">📄 图层节点</option>
                  </select>
                </div>
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <label class="tree-form-label">资源URL</label>
                  <input v-model="editForm.url" class="tree-form-input" placeholder="图层资源的URL地址" />
                </div>
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <label class="tree-form-label">WMS图层名 <span style="font-weight:normal;color:#888;font-size:11px;">(WMS服务留空自动检测)</span></label>
                  <input v-model="editForm.wmsLayerName" class="tree-form-input" placeholder="如: gebco_latest_2024" />
                </div>
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <label class="tree-form-label">MVT源图层 <span style="font-weight:normal;color:#888;font-size:11px;">(逗号分隔，留空自动检测)</span></label>
                  <input v-model="editForm.mvtSourceLayers" class="tree-form-input" placeholder="如: water,transportation,building" />
                </div>
                <!-- ⭐ 地理编码专属字段 -->
                <div class="tree-form-group" v-if="editForm._showGeocoding">
                  <label class="tree-form-label">🔍 地理编码 — 查询地址 <span class="required">*</span></label>
                  <input v-model="editForm.geocodingAddress" class="tree-form-input" placeholder="如: 北京市天安门" />
                </div>
                <div class="tree-form-group" v-if="editForm._showGeocoding">
                  <label class="tree-form-label">🔍 地理编码 — API Key (tk) <span class="required">*</span></label>
                  <input v-model="editForm.geocodingKey" class="tree-form-input" placeholder="天地图 Key" />
                </div>
                <!-- ⭐ WCS 专属字段 -->
                <div class="tree-form-group" v-if="editForm._showWcs">
                  <label class="tree-form-label">🏔️ WCS — Coverage 名称 <span class="required">*</span></label>
                  <input v-model="editForm.wcsCoverageName" class="tree-form-input" placeholder="如: WorldDEMNeoDSM" />
                </div>
                <div class="tree-form-group" v-if="editForm._showWcs">
                  <div style="display:flex;gap:6px;">
                    <div style="flex:1;">
                      <label class="tree-form-label">WCS 格式</label>
                      <input v-model="editForm.wcsFormat" class="tree-form-input" placeholder="image/tiff" />
                    </div>
                    <div style="flex:1;">
                      <label class="tree-form-label">WCS 版本</label>
                      <input v-model="editForm.wcsVersion" class="tree-form-input" placeholder="2.0.1" />
                    </div>
                    <div style="flex:0 0 70px;">
                      <label class="tree-form-label">透明度</label>
                      <input v-model.number="editForm.wcsAlpha" class="tree-form-input" type="number" min="0" max="1" step="0.1" placeholder="0.7" />
                    </div>
                    <div style="flex:0 0 auto;display:flex;align-items:flex-end;padding-bottom:2px;">
                      <label class="tree-form-checkbox" style="margin:0;white-space:nowrap;">
                        <input type="checkbox" v-model="editForm.wcsColorRamp" />
                        <span style="font-size:11px;">色带</span>
                      </label>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;margin-top:6px;">
                    <div style="flex:1;">
                      <label class="tree-form-label">时间轴名 <span style="font-weight:normal;color:#888;font-size:10px;">(3D覆盖需切片)</span></label>
                      <input v-model="editForm.wcsTimeAxis" class="tree-form-input" placeholder="如: ansi" />
                    </div>
                    <div style="flex:2;">
                      <label class="tree-form-label">时间切片值 <span style="font-weight:normal;color:#888;font-size:10px;">(默认时刻)</span></label>
                      <input v-model="editForm.wcsTimeSlice" class="tree-form-input" placeholder="如: 2000-02-01T00:00:00Z" />
                    </div>
                  </div>
                </div>
                <div class="tree-form-group" v-if="editForm._showWcs">
                  <div style="display:flex;gap:6px;">
                    <div style="flex:1;">
                      <label class="tree-form-label">渲染模式 <span style="font-weight:normal;color:#888;font-size:10px;">(2d叠加/3d网格)</span></label>
                      <select v-model="editForm.wcsRenderMode" class="tree-form-input" style="padding:5px 8px;">
                        <option value="2d">2D — 单瓦片叠加在球面上</option>
                        <option value="3d">3D — GeoTIFF 高程生成网格</option>
                      </select>
                    </div>
                    <div style="flex:1;" v-if="editForm.wcsRenderMode === '3d'">
                      <label class="tree-form-label">高程夸张 <span style="font-weight:normal;color:#888;font-size:10px;">(倍数)</span></label>
                      <input v-model.number="editForm.wcsElevationScale" class="tree-form-input" type="number" min="0.1" max="100" step="0.1" placeholder="1.0" />
                    </div>
                  </div>
                </div>
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <label class="tree-form-label">定位坐标 <span style="font-weight:normal;color:#888;font-size:11px;">(选填，用于地图自动定位)</span></label>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <input v-model.number="editForm.centerLon" class="tree-form-input" style="flex:1;min-width:80px;" type="number" placeholder="经度 (如 114.2)" step="any" />
                    <input v-model.number="editForm.centerLat" class="tree-form-input" style="flex:1;min-width:80px;" type="number" placeholder="纬度 (如 22.6)" step="any" />
                    <input v-model.number="editForm.centerHeight" class="tree-form-input" style="flex:1;min-width:80px;" type="number" placeholder="高度 (米)" step="any" />
                  </div>
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">图标</label>
                  <input v-model="editForm.icon" class="tree-form-input" placeholder="emoji或字符" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">排序序号</label>
                  <input v-model.number="editForm.sortOrder" class="tree-form-input" type="number" placeholder="0" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-label">描述信息</label>
                  <input v-model="editForm.description" class="tree-form-input" placeholder="节点描述" />
                </div>
                <div class="tree-form-group">
                  <label class="tree-form-checkbox">
                    <input type="checkbox" v-model="editForm.visible" />
                    <span>可见</span>
                  </label>
                </div>
                <!-- ⭐ geoJsonStyle 编辑区（仅图层节点） -->
                <div class="tree-form-group" v-if="editForm.nodeType === 'layer'">
                  <div class="tree-style-header" @click="editStyleExpanded = !editStyleExpanded">
                    <label class="tree-form-label" style="cursor:pointer;margin:0;">
                      🎨 样式编辑 (geoJsonStyle)
                      <span v-if="editForm.geoJsonStyle" class="style-indicator-set">已设</span>
                      <span v-else class="style-indicator-empty">未设</span>
                    </label>
                    <span class="tree-style-toggle">{{ editStyleExpanded ? '▼' : '▶' }}</span>
                  </div>
                  <div v-if="editStyleExpanded" class="tree-style-body">
                    <textarea
                      v-model="editForm.geoJsonStyle"
                      class="tree-style-textarea"
                      rows="8"
                      placeholder='{
  "fill": "#FF6600",
  "fillOpacity": 0.5,
  "stroke": "#FF0000",
  "strokeWidth": 2,
  "markerColor": "#FF4400",
  "markerSize": 48,
  "markerIcon": "📍"
}'
                      spellcheck="false"
                    ></textarea>
                    <div class="tree-style-actions">
                      <button @click="formatGeoJsonStyle" class="tree-btn tree-btn-outline" type="button" style="font-size:11px;padding:3px 8px;">📐 格式化</button>
                      <button @click="convertGeoJsonManagerStyle" class="tree-btn tree-btn-outline" type="button" style="font-size:11px;padding:3px 8px;color:#ffa726;border-color:#ffa726;">🔄 转换</button>
                      <button @click="fetchServiceStyle" class="tree-btn tree-btn-outline" type="button" style="font-size:11px;padding:3px 8px;color:#2196F3;border-color:#2196F3;" :disabled="styleFetching">{{ styleFetching ? '⏳ 获取中...' : '📡 服务样式' }}</button>
                      <button @click="clearGeoJsonStyle" class="tree-btn tree-btn-outline" type="button" style="font-size:11px;padding:3px 8px;">🗑️ 清除</button>
                      <span class="tree-style-hint">面: fill/stroke/strokeWidth/fillOpacity &nbsp; 线: stroke/strokeWidth &nbsp; 点: markerColor/markerSize/markerIcon</span>
                    </div>
                  </div>
                </div>

                <div class="tree-form-group">
                  <label class="tree-form-label">父节点ID</label>
                  <select v-model="editForm.parentId" class="tree-form-select">
                    <option :value="null">无（根节点）</option>
                    <option v-for="n in getAvailableParents(editForm.id)" :key="n.id" :value="n.id">
                      {{ '　'.repeat(n._depth || 0) }}{{ n.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="tree-dialog-footer">
                <button class="tree-btn tree-btn-outline" @click="closeEditDialog" type="button">取消</button>
                <button class="tree-btn tree-btn-primary" @click="confirmEdit" type="button">保存修改</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </JsonConfigPanelBase>

  <!-- ⭐ 通用实体属性弹窗 -->
  <EntityInfoPopup
    :visible="showEntityPopup"
    :title="popupTitle"
    :properties="popupProperties"
    :screenX="popupScreenX"
    :screenY="popupScreenY"
    :geoType="popupGeoType"
    :layerName="popupLayerName"
    :canFlyTo="true"
    @close="dismissEntityPopup"
    @fly-to="flyToSelectedEntity"
    @row-click="onPopupRowClick"
  />
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import { validateConfigMetadata, formatValidationResult } from './TableNameValidator.mjs';
import TreeNodeItem from './TreeNodeItem.vue';
import rawPanelMetadata from './LayerTreeManager.config.json';
import { MVTImageryProvider } from '@componentsLib/MVTImageryProvider/MVTImageryProvider.mjs';
import EntitySelectionManager from '../../../utils/EntitySelectionManager.js';
import EntityInfoPopup from '../../common/EntityInfoPopup.vue';

const validationResult = validateConfigMetadata(rawPanelMetadata);
console.log(`[LayerTreeManager] 📋 配置元数据验证结果:`);
console.log(formatValidationResult(validationResult));

const panelMetadata = validationResult.safeConfig || rawPanelMetadata;

// ========================
// 环境检测 — 动态获取 API 服务器地址
// ========================

/**
 * 返回 API 服务器的 base URL（协议 + 主机 + 端口）
 * 逻辑与 DataManager.detectServerURL 保持一致：
 *   - localhost/127.0.0.1 → 固定指向 192.168.31.146
 *   - 其他 → 使用当前页面 hostname
 * API 端口优先使用 DataManager 的配置，默认 8081
 */
function getApiBaseUrl() {
  var host = '192.168.31.146';
  var port = '8081';
  if (typeof window !== 'undefined' && window.location) {
    var loc = window.location;
    if (loc.hostname !== 'localhost' && loc.hostname !== '127.0.0.1') {
      host = loc.hostname;
    }
    // 优先使用 DataManager 的端口配置
    if (window.__dataManager__ && window.__dataManager__.serverConfig) {
      port = String(window.__dataManager__.serverConfig.apiPort || 8081);
    } else if (loc.port) {
      // 当前页面的端口 + 1（常见：前端 8080 → API 8081）
      port = String(parseInt(loc.port, 10) + 1);
    }
  }
  return 'http://' + host + ':' + port;
}

// ========================
// MVT PBF 解析工具 — 用于自动检测瓦片中的源图层
// ========================

/**
 * 读取 PBF varint（变长整数）
 * 返回 [value, bytesRead]
 */
function readVarint(buffer, offset) {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;
  while (offset + bytesRead < buffer.length) {
    const byte = buffer[offset + bytesRead];
    bytesRead++;
    value |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) break;
    shift += 7;
    if (shift > 35) break; // 防止无限循环
  }
  return [value, bytesRead];
}

/**
 * 从 MVT PBF 数据中解析出所有图层名称
 * MVT v2.1 结构: Tile { repeated Layer layers = 3; }
 *               Layer { required string name = 1; ... }
 *
 * 备用方法：也尝试将整个 buffer 作为单个 Layer 消息来解析
 */
function parseMvtLayerNames(arrayBuffer) {
  const buffer = new Uint8Array(arrayBuffer);
  const layerNames = [];

  console.log(`[PBF解析] 📦 总字节数: ${buffer.length}, 前20字节: [${Array.from(buffer.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);

  // 方法1: 按 Tile message 结构解析 (layers = field 3)
  const tileLayers = parseTileMessage(buffer);
  if (tileLayers.length > 0) {
    console.log(`[PBF解析] ✅ Tile message 模式下检测到 ${tileLayers.length} 个图层`);
    return tileLayers;
  }

  // 方法2: 尝试直接解析为 Layer 消息（某些服务可能只返回单个 Layer）
  const directLayers = parseLayerMessage(buffer, 0, buffer.length);
  if (directLayers.length > 0) {
    console.log(`[PBF解析] ✅ 直接 Layer message 模式下检测到 ${directLayers.length} 个图层`);
    return directLayers;
  }

  console.warn(`[PBF解析] ⚠️ 无法从 PBF 数据中解析出图层名称`);
  return layerNames;
}

/**
 * 解析 Tile message — 提取 field 3 (layers)
 * Tile = { repeated Layer layers = 3; }
 */
function parseTileMessage(buffer) {
  const layerNames = [];
  let pos = 0;

  while (pos < buffer.length) {
    const [tag, tagBytes] = readVarint(buffer, pos);
    if (tagBytes === 0) break;
    pos += tagBytes;

    const fieldNumber = tag >> 3;
    const wireType = tag & 0x07;

    if (wireType === 2) {
      const [length, lenBytes] = readVarint(buffer, pos);
      if (lenBytes === 0) break;
      pos += lenBytes;

      if (fieldNumber === 3) {
        // field 3 = layers — 这是序列化的 Layer 消息
        const names = parseLayerMessage(buffer, pos, pos + length);
        layerNames.push(...names);
      }
      pos += length;
    } else if (wireType === 0) {
      // varint — 跳过
      const [, vBytes] = readVarint(buffer, pos);
      pos += vBytes;
    } else if (wireType === 1 || wireType === 5) {
      pos += wireType === 1 ? 8 : 4;
    } else {
      break; // 未知 wire type
    }
  }

  return layerNames;
}

/**
 * 解析 Layer message — 提取 field 1 (name) 和 field 15 (version)
 * Layer = { required string name = 1; required uint32 version = 15 [default = 1]; ... }
 */
function parseLayerMessage(buffer, start, end) {
  const names = [];
  let pos = start;

  while (pos < end) {
    if (pos >= buffer.length) break;

    const [tag, tagBytes] = readVarint(buffer, pos);
    if (tagBytes === 0 || pos + tagBytes > end) break;
    pos += tagBytes;

    const fieldNumber = tag >> 3;
    const wireType = tag & 0x07;

    if (wireType === 2) {
      const [length, lenBytes] = readVarint(buffer, pos);
      if (lenBytes === 0 || pos + lenBytes + length > end + 10) break;
      pos += lenBytes;

      if (fieldNumber === 1) {
        // field 1 = name (string)
        // ⚠️ PBF string 编码：field_length 就是字符串的字节长度
        // field value 中不包含额外的 varint 长度前缀，直接就是 UTF-8 字节
        if (length > 0 && length < 256 && pos + length <= end + 10) {
          const decoder = new TextDecoder('utf-8');
          const name = decoder.decode(buffer.slice(pos, pos + length));
          if (name && name.length > 0 && /^[\x20-\x7E一-鿿㐀-䶿_-]+/.test(name)) {
            names.push(name);
            console.log(`[PBF解析]   发现图层: "${name}" (${length} 字节)`);
          }
        }
        pos += length;
      } else {
        pos += length;
      }
    } else if (wireType === 0) {
      const [, vBytes] = readVarint(buffer, pos);
      pos += vBytes;
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 5) {
      pos += 4;
    } else {
      break;
    }
  }

  return names;
}

/**
 * 从 WMS GetCapabilities XML 中解析时间维度范围
 * 支持 WMS 1.1.1 的 <Extent name="time"> 和 WMS 1.3.0 的 <Dimension name="time">
 *
 * ⚠️ 优先查找目标图层自己的时间维度；如果找不到，回退到根图层
 *
 * @param {string} xmlText - GetCapabilities 返回的 XML 文本
 * @param {string} [targetLayerName] - 可选：要匹配的图层名，优先提取该图层的 Dimension
 * @returns {string|null} 时间范围字符串
 */
function parseWmsTimeDimension(xmlText, targetLayerName) {
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) throw new Error('XML parse error');

      // 如果指定了目标图层，先找到它的 <Layer> 元素
      let searchRoot = doc;
      if (targetLayerName) {
        const allLayers = doc.querySelectorAll('Layer');
        for (const layerEl of allLayers) {
          const nameEl = Array.from(layerEl.children).find(c => c.tagName === 'Name');
          if (nameEl && nameEl.textContent.trim() === targetLayerName) {
            searchRoot = layerEl;
            break;
          }
        }
      }

      // 在目标范围内查找 <Dimension name="time"> 或 <Extent name="time">
      const timeEl = searchRoot.querySelector('Dimension[name="time"], Extent[name="time"]');
      if (timeEl && timeEl.textContent.trim()) {
        const value = timeEl.textContent.trim();
        console.log(`[WMS检测] ⏱️ 时间维度${targetLayerName ? ` (layer="${targetLayerName}")` : ''}: ${value.slice(0, 100)}`);
        return value;
      }
    } catch (e) {
      // DOM 解析失败，回退到正则
    }
  }

  // 正则 fallback: 匹配第一个时间维度
  const timeRegex = /<(?:Dimension|Extent)\s[^>]*name\s*=\s*["']time["'][^>]*>([^<]+)<\/(?:Dimension|Extent)>/i;
  const match = xmlText.match(timeRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * 从 WMS 时间范围字符串中提取最晚的有效时间
 * 支持格式:
 *   - "2026-06-19T22:09:54Z/2026-06-21T20:10:19Z/PT30M" (datetime 区间)
 *   - "2024-06-01/2026-04-01/P1M" (date-only 区间)
 *   - "time1/end1/period1,time2/end2/period2,..." (逗号分隔区间列表)
 *
 * @param {string} timeExtent - 时间范围字符串
 * @returns {string|null} 最新时间值（保持与 GetCapabilities 一致的格式）
 */
function getLatestTimeFromExtent(timeExtent) {
  if (!timeExtent) return null;

  // 通用区间格式: (start)/(end) 其中时间部分可选
  // 匹配 datetime: 2026-06-19T22:09:54Z/2026-06-21T20:10:19Z
  // 匹配 date-only: 2024-06-01/2026-04-01
  // period 后缀 (/PT30M, /P1M 等) 会被忽略
  const intervalRegex = /(\d{4}-\d{2}-\d{2}(?:T[\d:]+Z)?)\/(\d{4}-\d{2}-\d{2}(?:T[\d:]+Z)?)/g;
  let lastEnd = null;
  let match;
  while ((match = intervalRegex.exec(timeExtent)) !== null) {
    // match[1] = start, match[2] = end — 取最后一个区间的 end 时间
    lastEnd = match[2];
  }
  if (lastEnd) {
    console.log(`[WMS时间] 📅 提取到最新时间: ${lastEnd}`);
    return lastEnd;
  }

  console.warn(`[WMS时间] ⚠️ 无法从时间范围提取有效时间: ${timeExtent.slice(0, 100)}`);
  return null;
}

/**
 * 从 WMS GetCapabilities XML 中解析可用的图层名称
 * 支持 WMS 1.1.1 和 1.3.0 两种版本的 XML 格式
 * ⚠️ 通用 fallback：如果 XML 解析失败，尝试用正则提取
 *
 * @param {string} xmlText - GetCapabilities 返回的 XML 文本
 * @returns {string[]} 图层名称数组（按嵌套顺序）
 */
function parseWmsLayerNames(xmlText) {
  const layerNames = [];

  // 方法1: 使用 DOMParser（浏览器环境）
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');

      // 检查解析错误
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        console.warn('[WMS检测] XML 解析错误，回退到正则提取');
      } else {
        // 遍历所有 <Layer> 元素，提取直接子元素 <Name>
        const allLayerEls = doc.querySelectorAll('Layer');
        for (const layerEl of allLayerEls) {
          // 只取该 Layer 的直接子 <Name>（跳过嵌套 Layer 的 Name）
          for (const child of layerEl.children) {
            if (child.tagName === 'Name' && child.textContent.trim()) {
              layerNames.push(child.textContent.trim());
              break; // 每个 Layer 只取第一个 Name
            }
          }
        }
        if (layerNames.length > 0) {
          console.log(`[WMS检测] ✅ XML 解析成功，发现 ${layerNames.length} 个图层`);
          return layerNames;
        }
      }
    } catch (e) {
      console.warn('[WMS检测] DOMParser 异常，回退到正则提取:', e.message);
    }
  }

  // 方法2: 正则 fallback — 提取 <Name> 标签内容
  // 注意：会同时提取 Layer/Name 和父级 Capability 的 Name，需要过滤
  const nameRegex = /<Name>([^<]+)<\/Name>/gi;
  let match;
  while ((match = nameRegex.exec(xmlText)) !== null) {
    const name = match[1].trim();
    // 排除常见的非图层名称（服务级名称通常很短或包含特殊字符）
    if (name && name.length > 1 && !name.includes(' ') && !layerNames.includes(name)) {
      layerNames.push(name);
    }
  }
  console.log(`[WMS检测] ✅ 正则提取成功，发现 ${layerNames.length} 个候选图层`);
  return layerNames;
}

/**
 * 获取 WMS 服务完整能力信息（图层名 + 时间维度 + 版本）
 * 通过获取 GetCapabilities XML 并解析
 * ⚠️ 整体超时 5 秒
 *
 * @param {string} wmsUrl - WMS 服务基础 URL（不含参数）
 * @param {string} [preferredVersion] - 优先尝试的 WMS 版本
 * @returns {Promise<Object|null>} { layerName, timeExtent, latestTime, version, allLayers } 或 null
 */
/**
 * 从 GetCapabilities XML 中提取所有图层的 Dimension time 的最新结束时间
 * 用于 best 复合图层：父层时间维度是过期的聚合值，子层才有准确的近实时时间
 */
function parseLatestTimeFromAllLayers(xmlText) {
  let latestDate = null;
  if (typeof DOMParser === 'undefined') return null;
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    const allLayers = doc.querySelectorAll('Layer');
    for (const layerEl of allLayers) {
      const timeEl = layerEl.querySelector('Dimension[name="time"], Extent[name="time"]');
      if (!timeEl || !timeEl.textContent.trim()) continue;
      const endTime = getLatestTimeFromExtent(timeEl.textContent.trim());
      if (!endTime) continue;
      const d = new Date(endTime);
      if (!isNaN(d.getTime()) && (!latestDate || d > latestDate)) {
        latestDate = d;
      }
    }
  } catch (e) { /* ignore */ }
  if (latestDate) {
    // 返回 ISO 格式（带 Z），保留秒精度（去掉毫秒）
    const iso = latestDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
    console.log(`[WMS检测] 📅 从 ${latestDate.toISOString().slice(0, 10)} 子层中提取到最新时间: ${iso}`);
    return iso;
  }
  return null;
}

/**
 * 对 best 复合图层做一次试探 GetMap 请求，从服务器返回的
 * InvalidDimensionValue 错误中解析出精确的有效时间范围，
 * 提取最后时刻作为可靠 TIME 参数。
 *
 * @param {string} baseUrl - WMS 服务基础 URL
 * @param {string} layers - 图层名
 * @param {string} version - WMS 版本
 * @returns {Promise<string|null>} 有效时间字符串，如 "2026-06-21T22:10:19Z"
 */
async function probeBestLayerValidTime(baseUrl, layers, version) {
  const PROBE_TIMEOUT = 5000;
  const bbox = '-180,-90,180,90'; // CRS:84 和 EPSG:4326 均为 lon,lat 序
  const crsParam = version === '1.3.0'
    ? 'crs=CRS:84'
    : 'srs=EPSG:4326';

  const probeUrl = baseUrl.includes('?')
    ? `${baseUrl}&SERVICE=WMS&REQUEST=GetMap&VERSION=${version}&LAYERS=${encodeURIComponent(layers)}&STYLES=&${crsParam}&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true`
    : `${baseUrl}?SERVICE=WMS&REQUEST=GetMap&VERSION=${version}&LAYERS=${encodeURIComponent(layers)}&STYLES=&${crsParam}&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true`;

  console.log(`[TIME探测] 🔍 发起探测 GetMap: ${probeUrl.slice(0, 200)}...`);

  try {
    const resp = await fetch(probeUrl, {
      mode: 'cors',
      signal: createTimeoutSignal(PROBE_TIMEOUT)
    });

    const text = await resp.text();

    // 搜索时间范围：从报错中提取所有时间区间
    // 格式: "2026-06-20T00:30:10Z/2026-06-20T00:30:10Z/PT39M49S,2026-06-20T01:10:18Z/..."
    const timeListRegex = /(\d{4}-\d{2}-\d{2}T[\d:]+Z)\/(\d{4}-\d{2}-\d{2}T[\d:]+Z)/g;
    const matches = [];
    let m;
    while ((m = timeListRegex.exec(text)) !== null) {
      // m[2] 是每个区间的结束时间
      if (m[2]) matches.push(m[2]);
    }

    if (matches.length > 0) {
      // 取最后一个（最新）时刻
      const latest = matches[matches.length - 1];
      console.log(`[TIME探测] ✅ 找到 ${matches.length} 个有效时刻，最新: ${latest}`);
      return latest;
    }

    // 没找到时间范围 → 可能返回了正常图片（服务器有可用默认值）
    if (resp.ok && resp.headers.get('content-type')?.includes('image')) {
      console.log(`[TIME探测] ℹ️ 服务器返回了图片（默认时间可用），不需要 TIME 参数`);
      return null;
    }

    console.warn(`[TIME探测] ⚠️ 无法从响应中解析时间范围，响应前 300 字符:`, text.slice(0, 300));
    return null;
  } catch (err) {
    console.warn(`[TIME探测] ⚠️ 探测请求失败:`, err.message);
    return null;
  }
}

async function fetchWmsCapabilitiesInfo(wmsUrl, preferredVersion) {
  const WMS_DETECT_TIMEOUT = 5000;

  // WMS 版本兼容回退链：优先 1.1.1（MapServer 最兼容），其次 1.3.0
  const versionsToTry = preferredVersion
    ? [preferredVersion, '1.1.1', '1.3.0'].filter((v, i, a) => a.indexOf(v) === i)
    : ['1.1.1', '1.3.0'];

  for (const version of versionsToTry) {
    try {
      const url = wmsUrl.includes('?')
        ? `${wmsUrl}&SERVICE=WMS&REQUEST=GetCapabilities&VERSION=${version}`
        : `${wmsUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=${version}`;

      console.log(`[WMS检测] 🔍 获取 GetCapabilities: version=${version}`);

      const response = await fetch(url, {
        mode: 'cors',
        signal: createTimeoutSignal(WMS_DETECT_TIMEOUT)
      });

      if (!response.ok) {
        console.warn(`[WMS检测] ⚠️ version=${version} 返回 HTTP ${response.status}`);
        continue;
      }

      const xmlText = await response.text();
      if (!xmlText || xmlText.length < 50) continue;

      // 检查是否是错误响应
      if (xmlText.includes('ServiceExceptionReport') || xmlText.includes('ServiceException')) {
        console.warn(`[WMS检测] ⚠️ version=${version} 返回异常:`, xmlText.slice(0, 200));
        continue;
      }

      const layerNames = parseWmsLayerNames(xmlText);
      if (layerNames.length === 0) {
        console.warn(`[WMS检测] ⚠️ version=${version} 未提取到图层名称`);
        continue;
      }

      // 解析时间维度 — 优先匹配目标子图层自己的 Dimension
      // ArcGIS Server WMS：图层 0 是空容器层，数据从 1 开始。如有多个图层且首层为 "0"，跳过它
      let targetLayer = layerNames[0];
      if (targetLayer === '0' && layerNames.length > 1) {
        targetLayer = layerNames[1];
        console.log(`[WMS检测] 🔄 ArcGIS Server：跳过空容器层 "0"，使用 "${targetLayer}"`);
      }
      let timeExtent = parseWmsTimeDimension(xmlText, targetLayer)
                       || parseWmsTimeDimension(xmlText); // 回退到根图层
      let latestTime = timeExtent ? getLatestTimeFromExtent(timeExtent) : null;

      // best 复合图层：父层时间维度通常是过期聚合值（如 /2026-04-01/P1M），
      // 子层才有准确的近实时时间。从所有子层中找最新时间作为回退
      const allLayersLatest = parseLatestTimeFromAllLayers(xmlText);
      if (allLayersLatest) {
        const targetDate = latestTime ? new Date(latestTime) : null;
        const allDate = new Date(allLayersLatest);
        if (!targetDate || allDate > targetDate) {
          console.log(`[WMS检测] 🔄 子层时间 (${allLayersLatest}) > 目标层时间 (${latestTime || '无'})，采用子层时间`);
          latestTime = allLayersLatest;
          timeExtent = allLayersLatest;
        }
      }

      const result = {
        layerName: targetLayer,
        allLayers: layerNames,
        version: version,
        timeExtent: timeExtent,
        latestTime: latestTime
      };

      console.log(`[WMS检测] ✅ 检测结果: layer="${result.layerName}" version=${version}` +
        (latestTime ? ` time=${latestTime}` : ' (无时间维度)'));

      if (layerNames.length > 0) {
        console.log(`[WMS检测] 📋 可用图层 (前10):`, layerNames.slice(0, 10));
      }

      return result;
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        console.warn(`[WMS检测] ⏱️ version=${version} 请求超时`);
      } else {
        console.warn(`[WMS检测] ⚠️ version=${version} 请求失败:`, err.message);
      }
    }
  }

  console.warn('[WMS检测] ❌ 所有 WMS 版本均无法获取图层信息');
  return null;
}

/**
 * 检测 MVT 瓦片中的源图层名称
 * 尝试多个 zoom 级别的瓦片，优先使用覆盖范围最广的
 * ⚠️ 整体超时 8 秒，防止长时间阻塞 UI
 * @param {string} urlTemplate - URL 模板，包含 {z}/{x}/{y}
 * @returns {Promise<{layerNames: string[], detectedZoom: number}>} 图层名称数组和检测到的 zoom 级别
 */
/**
 * 创建带超时的 AbortSignal（兼容旧浏览器）
 */
function createTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  // 回退：手动创建 AbortController + setTimeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function detectMvtSourceLayers(urlTemplate) {
  const DETECT_TOTAL_TIMEOUT = 8000;  // 总超时 8 秒
  const PER_TILE_TIMEOUT = 2000;      // 每个瓦片 2 秒

  // 优先尝试高 zoom（城市级 mbtiles 通常从 zoom 10+ 开始有数据）
  // 再回退到中低 zoom（全球/国家级数据集）
  const tileCoords = [
    // 优先：高 zoom — 城市/区域级 mbtiles
    { z: 12, x: 3343, y: 1784 },  // 深圳/珠三角
    { z: 12, x: 3342, y: 1783 },
    // 回退：中 zoom — 国家/大陆级
    { z: 10, x: 835, y: 467 },
    { z: 8, x: 206, y: 98 },      // 中国/东亚
    { z: 6, x: 51, y: 24 },       // 欧亚大陆
    // 最后尝试：低 zoom
    { z: 2, x: 1, y: 1 },
  ];

  const startTime = Date.now();

  for (const coord of tileCoords) {
    // 检查总超时
    const elapsed = Date.now() - startTime;
    if (elapsed >= DETECT_TOTAL_TIMEOUT) {
      console.warn('[MVT检测] ⏱️ 检测总超时，停止继续尝试');
      break;
    }

    try {
      const url = urlTemplate
        .replace('{z}', coord.z)
        .replace('{x}', coord.x)
        .replace('{y}', coord.y);

      // 剩余时间不能超过单次超时
      const remaining = DETECT_TOTAL_TIMEOUT - elapsed;
      const timeout = Math.min(PER_TILE_TIMEOUT, remaining);

      console.log(`[MVT检测] 🔍 尝试获取瓦片: z=${coord.z} x=${coord.x} y=${coord.y} (超时:${timeout}ms)`);

      const response = await fetch(url, {
        mode: 'cors',
        signal: createTimeoutSignal(timeout)
      });

      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) continue;

      const layerNames = parseMvtLayerNames(arrayBuffer);
      console.log(`[MVT检测] ✅ 检测到 ${layerNames.length} 个图层:`, layerNames);
      // 返回图层名、检测到的 zoom 级别、以及瓦片坐标（用于后续定位飞行）
      return { layerNames, detectedZoom: coord.z, detectedX: coord.x, detectedY: coord.y };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        console.warn(`[MVT检测] ⏱️ 瓦片 z=${coord.z} 请求超时`);
      } else {
        console.warn(`[MVT检测] ⚠️ 瓦片 z=${coord.z} 获取失败:`, err.message);
      }
      continue;
    }
  }

  console.warn('[MVT检测] ⚠️ 所有瓦片坐标均无法获取或已超时');
  return { layerNames: [], detectedZoom: 0 };
}

/**
 * 根据图层名称启发式生成 Mapbox Style 图层
 * 支持 Shortbread、OpenMapTiles 及自定义 schema
 */
function buildMvtStyleFromLayers(nodeId, nodeName, tileUrl, layerNames) {
  const style = {
    version: 8,
    name: nodeName,
    sources: {
      [nodeId]: {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 0,
        maxzoom: 18
      }
    },
    layers: [
      {
        id: `${nodeId}-background`,
        type: 'background',
        paint: { 'background-color': '#FFFDE7' }  // 淡黄色背景，方便确认瓦片在渲染
      }
    ]
  };

  // 启发式图层匹配规则：[匹配关键词, 图层类型(可数组), 默认paint]
  const heuristics = [
    // 水体
    { match: ['water', 'ocean', 'sea', 'lake', 'river'], type: 'fill', paint: { 'fill-color': '#a9daf8', 'fill-opacity': 0.8 } },
    // 陆地/地表覆盖
    { match: ['land', 'landcover', 'landuse', 'park', 'forest', 'wood', 'grass', 'sand', 'glacier'], type: 'fill', paint: { 'fill-color': '#e8e8e0' } },
    // 建筑
    { match: ['building', 'buildings', 'structure'], type: 'fill', paint: { 'fill-color': '#d4d4d4', 'fill-outline-color': '#999999' } },
    // 道路/交通
    { match: ['road', 'roads', 'transportation', 'highway', 'motorway', 'path', 'track', 'railway', 'transit'], type: 'line', paint: { 'line-color': '#bbbbbb', 'line-width': 1.5 } },
    // 边界 — 同时生成 fill+line，兼容面状和线状数据
    { match: ['boundary', 'border', 'admin', 'country', 'gis_link'], type: ['fill', 'line'], paint: [
      { 'fill-color': '#FF6B35', 'fill-opacity': 0.35, 'fill-outline-color': '#CC3300' },
      { 'line-color': '#FF3300', 'line-width': 2.5, 'line-opacity': 0.9 }
    ]},
    // 地名/标注
    { match: ['place', 'places', 'label', 'poi', 'city', 'town', 'country_label'], type: 'symbol', paint: {} },
    // 轮廓线
    { match: ['contour', 'elevation'], type: 'line', paint: { 'line-color': '#cc9966', 'line-opacity': 0.5 } },
  ];

  const usedLayers = new Set();

  for (const layerName of layerNames) {
    const lower = layerName.toLowerCase();

    for (const rule of heuristics) {
      if (usedLayers.has(layerName)) break;

      for (const keyword of rule.match) {
        if (lower.includes(keyword) || lower === keyword) {
          usedLayers.add(layerName);

          // 支持单类型和多类型规则
          const types = Array.isArray(rule.type) ? rule.type : [rule.type];
          const paints = Array.isArray(rule.paint) ? rule.paint : [rule.paint];

          types.forEach((type, idx) => {
            const paint = paints[idx] || paints[0] || {};
            const styleLayer = {
              id: `${nodeId}-${layerName}-${type}`,
              type: type,
              source: nodeId,
              'source-layer': layerName,
              paint: { ...paint }
            };

            if (type === 'line' && !styleLayer.paint['line-width']) {
              styleLayer.paint['line-width'] = 1;
            }
            if (type === 'circle' && !styleLayer.paint['circle-radius']) {
              styleLayer.paint['circle-radius'] = 4;
            }

            style.layers.push(styleLayer);
          });

          break;
        }
      }
    }

    // 未匹配的图层：同时用 fill + line 确保可见性
    // ⚠️ 限制：最多为前 10 个未匹配图层生成样式（每个 3 层），
    //   防止源图层过多导致 GPU shader 编译爆炸、浏览器卡死
    if (!usedLayers.has(layerName)) {
      // 计算已生成的未匹配图层数量
      const unmatchedCount = Array.from(usedLayers).filter(
        name => !heuristics.some(rule =>
          rule.match.some(kw => name.toLowerCase().includes(kw) || name.toLowerCase() === kw)
        )
      ).length;
      if (unmatchedCount >= 10) {
        console.warn(`[MVT样式] ⚠️ 未匹配图层已达上限(10)，跳过 "${layerName}"（共 ${layerNames.length} 个源图层）`);
        usedLayers.add(layerName); // 标记已处理，避免重复警告
        continue;
      }
      usedLayers.add(layerName);
      // 面填充 — 半透明亮色
      style.layers.push({
        id: `${nodeId}-${layerName}-fill`,
        type: 'fill',
        source: nodeId,
        'source-layer': layerName,
        paint: { 'fill-color': '#FF6B35', 'fill-opacity': 0.6, 'fill-outline-color': '#CC3300' }
      });
      // 线条 — 确保线数据也可见
      style.layers.push({
        id: `${nodeId}-${layerName}-line`,
        type: 'line',
        source: nodeId,
        'source-layer': layerName,
        paint: { 'line-color': '#FF6B35', 'line-width': 3, 'line-opacity': 0.9 }
      });
      // 点 — 圆形，覆盖点数据
      style.layers.push({
        id: `${nodeId}-${layerName}-circle`,
        type: 'circle',
        source: nodeId,
        'source-layer': layerName,
        paint: { 'circle-color': '#FF0000', 'circle-radius': 5, 'circle-opacity': 0.9 }
      });
    }
  }

  console.log(`[MVT样式] 🎨 为节点 "${nodeName}" 生成了 ${style.layers.length} 个样式图层`);
  return style;
}

// ========================
// 图层加载错误分类
// ========================

/**
 * 根据错误消息分类，返回 { category, label, icon }
 * 用于在树节点上展示失败原因的简短分类文本
 */
function classifyLayerError(errorMsg) {
  const msg = (errorMsg || '').toLowerCase();

  if (msg.includes('webgl') || msg.includes('上下文') || msg.includes('context')) {
    return { category: 'webgl_lost', label: 'WebGL丢失需刷新', icon: '🔴' };
  }
  if (msg.includes('超时') || msg.includes('timeout') || msg.includes('timed out')) {
    return { category: 'timeout', label: '加载超时', icon: '⏱️' };
  }
  if (msg.includes('cesium') || msg.includes('未就绪')) {
    return { category: 'system', label: '系统未就绪', icon: '🔧' };
  }
  if (msg.includes('url') && (msg.includes('为空') || msg.includes('无效') || msg.includes('空'))) {
    return { category: 'invalid_config', label: 'URL未配置', icon: '🔗' };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('cors') || msg.includes('跨域') || msg.includes('网络') || msg.includes('拦截') || msg.includes('failed to fetch')) {
    return { category: 'network', label: '网络/CORS错误', icon: '🌐' };
  }
  if (msg.includes('404') || msg.includes('not found') || msg.includes('不存在') || msg.includes('unknown_service')) {
    return { category: 'not_found', label: '服务不可达', icon: '🚫' };
  }
  if (msg.includes('parse') || msg.includes('解析') || msg.includes('pbf') || msg.includes('protobuf')) {
    return { category: 'parse', label: '数据解析失败', icon: '📦' };
  }
  if (msg.includes('自动检测')) {
    return { category: 'warning', label: '部分可用', icon: '⚠️' };
  }
  if (msg.includes('为空') || msg.includes('无内容') || msg.includes('空白') || msg.includes('无渲染')) {
    return { category: 'empty_tiles', label: '瓦片无内容', icon: '👻' };
  }
  if (msg.includes('xml') || msg.includes('capabilities') || msg.includes('wmts') || msg.includes('wms')) {
    return { category: 'service_error', label: '服务响应异常', icon: '📡' };
  }
  if (msg.includes('大量失败') || msg.includes('失败') && msg.includes('成功')) {
    return { category: 'high_failure', label: '瓦片大量失败', icon: '📉' };
  }

  return { category: 'unknown', label: '加载失败', icon: '❌' };
}

// ========================
// LayerTreeManager — 主面板组件
// ========================
export default {
  name: 'LayerTreeManager',

  components: {
    JsonConfigPanelBase,
    TreeNodeItem,
    EntityInfoPopup
  },

  props: {
    initialX: {
      type: [Number, String],
      default: 'left'
    },
    initialY: {
      type: Number,
      default: 120
    },
    panelName: {
      type: String,
      default: null
    },
    autoRegister: {
      type: Boolean,
      default: true
    },
    panelInstanceId: {
      type: Number,
      default: null
    },
    registrationKey: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      panelMetadata,

      // ⭐ 本地响应式数据 — 树形节点的扁平数组（内置示例数据确保始终有内容）
      flatNodeList: [
        { "id": "root-ogc",      "name": "OGC标准服务",       "parentId": null,     "nodeType": "folder", "sortOrder": 1, "visible": 1, "description": "OGC标准协议图层（WMS/WFS/WMTS）", "icon": "📁" },
        { "id": "folder-wms",    "name": "WMS 地图服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 1, "visible": 1, "description": "Web Map Service", "icon": "🗺️" },
        { "id": "wms-nasa",      "name": "NASA GIBS 全球影像(WMS)", "parentId": "folder-wms","nodeType": "layer","url":"https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi","sortOrder":1,"visible":1,"description":"NASA官方WMS服务，无需API Key","icon":"🛰️","centerLon":0,"centerLat":20,"centerHeight":15000000},
        { "id": "wms-usgs",      "name": "USGS 国家地形图(WMS)", "parentId": "folder-wms","nodeType": "layer","url":"https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer","sortOrder":2,"visible":1,"description":"USGS官方WMS","icon":"🗺️","centerLon":-98.5,"centerLat":39.8,"centerHeight":5000000},
        { "id": "folder-wfs",    "name": "WFS 要素服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 2, "visible": 1, "description": "OGC WFS 矢量要素服务（GetFeature + GeoJSON输出）", "icon": "📊" },
        { "id": "wfs-geoserver","name":"GeoServer 示例要素(WFS 2.0)","parentId":"folder-wfs","nodeType":"layer","url":"https://demo.geo-solutions.it/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=topp%3Astates&OUTPUTFORMAT=application%2Fjson&MAXFEATURES=500","sortOrder":1,"visible":1,"description":"GeoServer官方Demo WFS 2.0，返回美国各州边界GeoJSON。意大利托管，中国大陆可访问","icon":"🌍","centerLon":-98,"centerLat":39,"centerHeight":5000000},
        { "id": "wfs-emsc-quake","name":"EMSC 全球地震事件(WFS)","parentId":"folder-wfs","nodeType":"layer","url":"https://www.seismicportal.eu/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=event&OUTPUTFORMAT=application%2Fjson&MAXFEATURES=500","sortOrder":2,"visible":1,"description":"EMSC欧洲地中海地震中心，全球实时地震数据WFS。法国托管，中国大陆可访问","icon":"🌋","centerLon":15,"centerLat":42,"centerHeight":15000000},
        { "id": "wfs-ingv-quake","name":"INGV 意大利地震(WFS)","parentId":"folder-wfs","nodeType":"layer","url":"https://emidius.mi.ingv.it/geoserver/wfs?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=event&OUTPUTFORMAT=application%2Fjson&MAXFEATURES=500","sortOrder":3,"visible":1,"description":"INGV意大利国家地球物理研究所，地中海区域地震数据WFS。意大利托管，中国大陆可访问","icon":"🇮🇹","centerLon":12.5,"centerLat":42,"centerHeight":5000000},
        { "id": "root-xyz",      "name": "XYZ/TMS 瓦片底图",  "parentId": null,     "nodeType": "folder", "sortOrder": 2, "visible": 1, "description": "互联网标准瓦片底图服务", "icon": "📁" },
        { "id": "xyz-osm",       "name": "OpenStreetMap 标准底图","parentId":"root-xyz","nodeType":"layer","url":"https://tile.openstreetmap.org/{z}/{x}/{y}.png","sortOrder":1,"visible":1,"description":"OSM全球众源地图","icon":"🗺️","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "xyz-esri-img",  "name": "ESRI 全球卫星影像",   "parentId":"root-xyz","nodeType":"layer","url":"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}","sortOrder":2,"visible":1,"description":"ESRI卫星影像底图","icon":"🛰️","centerLon":116.4,"centerLat":39.9,"centerHeight":8000},
        { "id": "root-mvt",      "name": "矢量瓦片(MVT)",      "parentId": null,     "nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "Mapbox Vector Tile矢量瓦片", "icon": "📁" },
        { "id": "mvt-versatiles","name": "VersaTiles 全球矢量瓦片(Shortbread)","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}","sortOrder":1,"visible":1,"description":"免费全球OSM矢量瓦片，无需API Key","icon":"🌍","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "mvt-bkg",       "name": "BKG 德国官方矢量底图","parentId":"root-mvt","nodeType":"layer","url":"https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/tiles/v2/bm_web_de_3857/{z}/{x}/{y}.pbf","sortOrder":2,"visible":1,"description":"德国政府官方MVT，无需API Key，覆盖德国全境","icon":"🇩🇪","centerLon":10.45,"centerLat":51.16,"centerHeight":500000},
        { "id": "mvt-openmaptiles","name":"OpenMapTiles 全球矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://free-0.tilehosting.com/data/v3/{z}/{x}/{y}.pbf?key=your-free-api-key","sortOrder":3,"visible":1,"description":"OpenMapTiles schema，需免费注册获取Key","icon":"🧩","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "mvt-geofabrik","name":"Geofabrik Shortbread 矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.shortbread.geofabrik.de/tiles/shortbread_v1/{z}/{x}/{y}.mvt","sortOrder":4,"visible":1,"description":"德国Geofabrik免费MVT","icon":"🧩","centerLon":8.68,"centerLat":50.11,"centerHeight":500000},
        { "id": "mvt-maptiler-cn","name":"MapTiler 矢量瓦片(全球CDN)","parentId":"root-mvt","nodeType":"layer","url":"https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get-free-key","sortOrder":5,"visible":1,"description":"MapTiler全球CDN矢量瓦片，OpenMapTiles schema，需免费注册Key替换URL，国内可访问","icon":"🎯","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "mvt-planet",    "name":"OpenFreeMap 全球矢量瓦片","parentId":"root-mvt","nodeType":"layer","url":"https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf","sortOrder":6,"visible":1,"description":"OpenFreeMap免费全球MVT，无需API Key","icon":"🌏","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "xyz-versatiles-raster","name":"VersaTiles 浅色栅格底图(XYZ)","parentId":"root-xyz","nodeType":"layer","url":"https://tiles.versatiles.org/tiles/versatiles-light/{z}/{x}/{y}.png","sortOrder":9,"visible":1,"description":"VersaTiles免费浅色栅格瓦片，XYZ格式，全球覆盖，直接可用","icon":"🎨","centerLon":116.4,"centerLat":39.9,"centerHeight":50000},
        { "id": "root-geocode",  "name": "地理编码服务",      "parentId": null,     "nodeType": "folder", "sortOrder": 4, "visible": 1, "description": "正向/反向地理编码，名称↔坐标互查", "icon": "📁" },
        { "id": "geocode-tianditu","name":"天地图 地址→坐标(地理编码)","parentId":"root-geocode","nodeType":"layer","url":"https://api.tianditu.gov.cn/search","sortOrder":1,"visible":1,"description":"天地图POI搜索/地理编码API。需替换URL中的tk参数为你的天地图Key。查询结果自动构建为GeoJSON点图层。","icon":"🔍","centerLon":116.4,"centerLat":39.9,"centerHeight":50000,"geocodingAddress":"北京市天安门","geocodingKey":"你的天地图Key"},
        { "id": "folder-wcs",     "name": "WCS 栅格服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "OGC WCS 栅格覆盖服务（GetCoverage）", "icon": "📁" },
        { "id": "wcs-rasdaman-dem","name":"rasdaman 巴伐利亚 DSM (WCS 2.0)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":1,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务，Coverage=Bavaria_50_DSM。德国巴伐利亚州50m分辨率数字地表模型（海拔色带渲染）。","icon":"🏔️","centerLon":11.5,"centerLat":48.5,"centerHeight":80000,"wcsCoverageName":"Bavaria_50_DSM","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsRenderMode":"2d"},
        { "id": "wcs-rasdaman-s2","name":"rasdaman 德国 DTM (WCS 2.0)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":2,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务，Coverage=Germany_DTM。德国全境数字地形模型（色带渲染）。","icon":"🇩🇪","centerLon":10,"centerLat":51,"centerHeight":500000,"wcsCoverageName":"Germany_DTM","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsRenderMode":"2d"},
	        { "id": "wcs-rasdaman-avgtemp","name":"rasdaman 全球地表温度(WCS 3D-Timeline)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":3,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务。Coverage=AvgLandTemp，185个时间切片(2000-2015)，支持Timeline时间轴动画。","icon":"🌡️","centerLon":0,"centerLat":20,"centerHeight":15000000,"wcsCoverageName":"AvgLandTemp","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsAlpha":0.4,"wcsTimeAxis":"ansi","wcsTimeSlice":"2000-02-01T00:00:00Z","wcsColorRamp":true,"wcsRenderMode":"3d","wcsElevationScale":50.0},
	        { "id": "folder-local-dem","name": "本地 DEM 高程数据","parentId": null,"nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "本地 GeoTIFF 格式数字高程模型，无需网络请求，直接从本地文件加载 3D 渲染", "icon": "📁" },
	        { "id": "local-dem-srtm30","name": "SRTM 30M DEM（下载后放入文件）","parentId": "folder-local-dem","nodeType": "layer","url": "/data/dem/srtm_30m.tif","sortOrder":1,"visible":1,"description": "SRTM 30m 分辨率全球 DEM。从地理空间数据云 (gscloud.cn) 下载 → 解压 → 将 .tif 重命名为 srtm_30m.tif 放入 public/data/dem/","icon":"🏔️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-aster30","name":"ASTER GDEM 30M（下载后放入文件）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/aster_gdem_30m.tif","sortOrder":2,"visible":1,"description":"ASTER GDEM v3 30m 全球 DEM，覆盖 83°N-83°S。下载：www.gscloud.cn → DEM 数字高程数据 → ASTER GDEM 30M，或 earthexplorer.usgs.gov","icon":"⛰️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-aw3d30","name":"ALOS AW3D30 DEM（下载后放入文件）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/alos_aw3d30.tif","sortOrder":3,"visible":1,"description":"JAXA ALOS AW3D30 全球 30m DEM，精度~5m。下载：www.eorc.jaxa.jp/ALOS → AW3D30 → 注册后下载","icon":"🗻","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-cop30","name":"本地cop30高程（Copernicus GLO-30 DEM原始geotiff数据）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/copernicus_glo30.tif","sortOrder":4,"visible":1,"description":"ESA Copernicus GLO-30 全球 30m DEM，精度~4m。下载：dataspace.copernicus.eu 或 portal.opentopography.org","icon":"🏔️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
        { "id": "local-terrain-cop30","name":"本地cop30高程（动态Geotiff转Cesium Terrain）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/copernicus_glo30.tif","sortOrder":5,"visible":1,"description":"将 Copernicus GLO-30 转为 Cesium Terrain，影像图层可贴合地形起伏。使用自定义 GeoTiffTerrainProvider 从 GeoTIFF 直接提供高程数据","icon":"⛰️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"terrain","demElevationScale":1.0},
        { "id": "local-terrain-cop30-tiles","name":"本地DEM高程数据(Cesium Terrain)","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/terrain/copernicus_glo30","sortOrder":6,"visible":1,"description":"Copernicus GLO-30 预生成 Cesium Terrain 瓦片，通过 layer.json 加载，影像图层可贴合地形起伏","icon":"⛰️","centerLon":103.5,"centerLat":30.5,"centerHeight":100000}
      ],

      // Cesium 图层加载状态 — 记录已加载的图层 ID → Cesium 对象
      loadedLayerIds: {},

      // 图层加载中状态（防止重复点击和并发加载）
      loadingLayerIds: {},

      // GeoJSON 配置刷新中标记
      refreshLoading: false,

      // 图层加载错误信息（非阻塞式错误提示）
      layerErrors: {},

      // 树交互状态
      expandedIds: new Set(),
      selectedNodeId: null,

      // 添加子节点对话框
      showAddChildDialog: false,
      parentNodeForAdd: null,
      addChildForm: this.createDefaultForm(),

      // 编辑节点对话框
      showEditDialog: false,
      editStyleExpanded: false, // ⭐ geoJsonStyle 编辑区折叠状态
      styleFetching: false,      // ⭐ 服务样式获取中标记
      editingNode: null,
      editForm: this.createDefaultForm(),

      // 配置加载策略
      _configStrategy: null,

      // 分区可见性（本地管理）
      sectionVisible: {
        tree: true,
        list: false,
        showToolbar: true
      },

      // ⭐ 实体选中 & 属性弹窗
      _selectionManager: null,
      showEntityPopup: false,
      popupTitle: '',
      popupProperties: [],
      popupScreenX: 0,
      popupScreenY: 0,
      popupGeoType: '',
      popupLayerName: '',
      _popupSelectedEntity: null,
      _popupSelectedLayerId: null,

      componentName: 'LayerTreeManager'
    };
  },

  computed: {
    /**
     * 将本地 flatNodeList 转换为嵌套树形结构用于 TreeView 渲染
     */
    treeData() {
      return this.buildTree(this.flatNodeList);
    },

    /**
     * 兼容 basePanel 的 configList（工具栏导入导出/刷新等操作需要）
     */
    configList() {
      return this.flatNodeList;
    },

  },

  beforeCreate() {
    // 非响应式 Cesium 图层对象存储（避免 Vue 响应式序列化 Cesium 对象）
    this._cesiumLayers = new Map();
    // 非响应式加载中 Promise 存储（防止并发加载同一图层）
    this._loadLayerPromise = new Map();
    // 代数计数器：防止超时后 IIFE 过期结果覆盖错误状态
    this._loadGeneration = new Map();
    // 图层加载顺序记录（用于超出上限时自动淘汰最旧图层）
    this._layerLoadOrder = [];
    // ⭐ 分级图层上限（按类型分别限制，避免重型图层耗尽资源）
    this._layerTypeLimits = {
      wcs: 3, '3dtiles': 3, mvt: 4,        // 重型：完整下载/流式几何/矢量解析
      geojson: 8, wfs: 6,                    // 中等：实体创建开销
      wms: 10, xyz: 15, wmts: 15,           // 轻型：瓦片缓存
      geocoding: 5,                          // 轻型：API 调用
    };
    this._totalMaxLayers = 20;                // 全局硬上限（超出后真正卸载）
    this._maxHibernated = 8;                 // 休眠池上限（超出后卸载最旧休眠层）
    this._hibernatedOrder = [];              // 休眠顺序 FIFO（show=false 但仍占用 GPU）
    // ⭐ 本地 GeoJsonLayerManager 图层元数据缓存
    //   { rawGeoJson: string, config: {...} } — rawGeoJson 保持字符串，仅在使用时解析
    this._localGeoJsonMeta = new Map();
    // Cesium 事件监听器引用（用于组件销毁时移除）
    this._cesiumEventHandlers = [];
    // WebGL 上下文状态标记
    this._isWebGLLost = false;
    this._wasDefaultRenderLoop = false;
    // Cesium 事件处理器标记
    this._renderErrorHandlerSet = false;
    this._webglListenerSet = false;
    this._cameraMoveHandlerSet = false;
    this._renderErrorListener = null;
    this._origShowErrorPanel = null;
    this._cameraMoveCleanup = null;
  },

  created() {
    configRegistry.registerFromMetadata(this.panelMetadata);

    // ⚠️ JSON 优先：确保手动编辑 JSON 文件后能立即生效
    // 浏览器端 SQLite/IndexedDB 作为离线回退
    this._configStrategy = ConfigStrategyFactory.createWithFallback(
      ['json', 'sqlite'],
      { baseURL: getApiBaseUrl() }
    );
    // 保留 SQLite 策略引用用于显式保存（JSON 策略的 save 是空操作）
    this._sqliteStrategy = ConfigStrategyFactory.create('sqlite');
    console.log(`[${this.componentName}] ✅ 树形配置加载策略已初始化: ${this._configStrategy.getName()}`);
    console.log(`[${this.componentName}] 🌳 表名: ${this.panelMetadata.dataSource?.tableName}`);
    console.log(`[${this.componentName}] 🔗 自关联字段: parentId → id`);
  },

  mounted() {
    this.$nextTick(() => {
      console.log(`[${this.componentName}] 🚀 主动触发树形数据加载（当前内置数据: ${this.flatNodeList.length} 条）`);
      this._selectionManager = EntitySelectionManager.getInstance();
      this.loadConfig();

      // ⚠️ Cesium 资源保护：延迟设置（等待 viewer 就绪）
      this._setupCesiumProtections();

      // 应用初始分区可见性（列表默认隐藏）
      var self = this;
      this.$nextTick(function() {
        self.$nextTick(function() {
          var treeEl = self.$refs.treeContainer;
          if (!treeEl) return;
          var panel = treeEl.closest('.function-panel');
          if (!panel) return;
          // ⭐ 禁用浏览器 scroll anchoring：防止 checkbox 状态变化触发 DOM 更新时
          //    浏览器自动滚动面板，导致 header/toolbar 滚出可视区
          panel.style.overflowAnchor = 'none';
          var tw = panel.querySelector('.tree-wrapper');
          if (tw) { tw.style.overflowAnchor = 'none'; }
          var configList = panel.querySelector('.config-list');
          if (configList) {
            configList.style.display = self.sectionVisible.list ? '' : 'none';
            configList.style.overflowAnchor = 'none';
          }
        });
      });
    });
  },

  beforeDestroy() {
    if (this._selectionManager) {
      this._selectionManager.unregisterAll();
      this._selectionManager.stopTracking();
    }
    this._teardownCesiumProtections();
    this.destroyAllCesiumLayers();
  },

  methods: {
    // ==================== 配置加载（覆盖基类） ====================

    /**
     * 覆盖 JsonConfigPanelBase 的 loadConfig()，
     * 使用 ConfigLoadStrategy 从 SQLite/JSON 加载树形数据
     */
    async loadConfig() {
      try {
        console.log(`[${this.componentName}] 📂 开始加载树形配置: ${this.panelMetadata.panelId}`);
        console.log(`[${this.componentName}] 🎯 使用策略: ${this._configStrategy.getName()}`);

        const rawData = await this._configStrategy.load(this.panelMetadata);

        console.log(`[${this.componentName}] 📦 加载到原始数据: ${rawData ? rawData.length : 0} 条`);

        if (rawData && rawData.length > 0) {
          // 后端有数据 → 使用后端数据
          this.flatNodeList = rawData.map(item => ({
            ...item,
            visible: item.visible !== undefined ? item.visible : 1,
            sortOrder: item.sortOrder || 0
          }));

          // ⭐ 合并新增的内置节点（用户删除了也能重新出现）
          this._mergeBuiltinNodes();

          // 同步到 basePanel.configList（工具栏导入导出等需要）
          if (this.$refs.basePanel) {
            this.$refs.basePanel.configList = [...this.flatNodeList];
          }
          console.log(`[${this.componentName}] ✅ 树形配置加载完成，共 ${this.flatNodeList.length} 条`);
        } else {
          // 后端无数据 → 保留内置数据，并尝试将内置数据初始化到后端
          console.warn(`[${this.componentName}] ⚠️ 后端无数据，保留内置示例数据（${this.flatNodeList.length} 条）`);
          if (this.flatNodeList.length > 0) {
            // 将内置数据自动保存到后端（首次初始化）
            this.saveConfig().then(() => {
              console.log(`[${this.componentName}] 💾 内置示例数据已初始化到后端`);
            });
          }
        }

        this.onConfigLoadedHandler();
        // ⭐ 动态加载本地 GeoJsonLayerManager 图层（异步，不阻塞主流程）
        this._loadLocalGeoJsonLayers();
      } catch (error) {
        // 加载失败时保留现有数据（内置示例或用户已添加的数据）
        console.error(`[${this.componentName}] ❌ 配置加载失败:`, error);
        console.warn(`[${this.componentName}] ⚠️ 保留现有数据（${this.flatNodeList.length} 条），不清空`);
        // 不执行 this.flatNodeList = [] — 保留现有数据
        // 配置加载失败时也尝试加载本地图层（不影响已有数据）
        this._loadLocalGeoJsonLayers();
      }
    },

    /**
     * ⭐ 合并内置节点：确保新版代码中新增的默认节点自动注入到已有数据库
     */
    _mergeBuiltinNodes() {
      // 必须是已存在的节点才不注入（以 id 为唯一键）
      var existingIds = {};
      for (var i = 0; i < this.flatNodeList.length; i++) {
        existingIds[this.flatNodeList[i].id] = true;
      }

      // 内置根文件夹 + 子节点的默认定义（与 data() 中 flatNodeList 保持同步）
      var builtinNodes = [
        { "id": "root-geocode", "name": "地理编码服务", "parentId": null, "nodeType": "folder", "sortOrder": 4, "visible": 1, "description": "正向/反向地理编码，名称↔坐标互查", "icon": "📁" },
        { "id": "geocode-tianditu","name":"天地图 地址→坐标(地理编码)","parentId":"root-geocode","nodeType":"layer","url":"https://api.tianditu.gov.cn/search","sortOrder":1,"visible":1,"description":"天地图POI搜索/地理编码API。需替换URL中的tk参数为你的天地图Key。查询结果自动构建为GeoJSON点图层。","icon":"🔍","centerLon":116.4,"centerLat":39.9,"centerHeight":50000,"geocodingAddress":"北京市天安门","geocodingKey":"你的天地图Key"},
        { "id": "folder-wcs", "name": "WCS 栅格服务", "parentId": "root-ogc", "nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "OGC WCS 栅格覆盖服务（GetCoverage）", "icon": "📁" },
        { "id": "wcs-rasdaman-dem","name":"rasdaman 巴伐利亚 DSM (WCS 2.0)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":1,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务，Coverage=Bavaria_50_DSM。德国巴伐利亚州50m分辨率数字地表模型（海拔色带渲染）。","icon":"🏔️","centerLon":11.5,"centerLat":48.5,"centerHeight":80000,"wcsCoverageName":"Bavaria_50_DSM","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsRenderMode":"2d"},
        { "id": "wcs-rasdaman-s2","name":"rasdaman 德国 DTM (WCS 2.0)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":2,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务，Coverage=Germany_DTM。德国全境数字地形模型（色带渲染）。","icon":"🇩🇪","centerLon":10,"centerLat":51,"centerHeight":500000,"wcsCoverageName":"Germany_DTM","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsRenderMode":"2d"},
	        { "id": "wcs-rasdaman-avgtemp","name":"rasdaman 全球地表温度(WCS 3D-Timeline)","parentId":"folder-wcs","nodeType":"layer","url":"https://ows.rasdaman.org/rasdaman/ows","sortOrder":3,"visible":1,"description":"rasdaman 公共 WCS 2.0.1 服务。Coverage=AvgLandTemp，185个时间切片(2000-2015)，支持Timeline时间轴动画。","icon":"🌡️","centerLon":0,"centerLat":20,"centerHeight":15000000,"wcsCoverageName":"AvgLandTemp","wcsFormat":"image/tiff","wcsVersion":"2.0.1","wcsAlpha":0.4,"wcsTimeAxis":"ansi","wcsTimeSlice":"2000-02-01T00:00:00Z","wcsColorRamp":true,"wcsRenderMode":"3d","wcsElevationScale":50.0},
	        { "id": "folder-local-dem","name": "本地 DEM 高程数据","parentId": null,"nodeType": "folder", "sortOrder": 3, "visible": 1, "description": "本地 GeoTIFF 格式数字高程模型，无需网络请求，直接从本地文件加载 3D 渲染", "icon": "📁" },
	        { "id": "local-dem-srtm30","name": "SRTM 30M DEM（下载后放入文件）","parentId": "folder-local-dem","nodeType": "layer","url": "/data/dem/srtm_30m.tif","sortOrder":1,"visible":1,"description": "SRTM 30m 分辨率全球 DEM。从地理空间数据云 (gscloud.cn) 下载 → 解压 → 将 .tif 重命名为 srtm_30m.tif 放入 public/data/dem/","icon":"🏔️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-aster30","name":"ASTER GDEM 30M（下载后放入文件）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/aster_gdem_30m.tif","sortOrder":2,"visible":1,"description":"ASTER GDEM v3 30m 全球 DEM，覆盖 83°N-83°S。下载：www.gscloud.cn → DEM 数字高程数据 → ASTER GDEM 30M，或 earthexplorer.usgs.gov","icon":"⛰️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-aw3d30","name":"ALOS AW3D30 DEM（下载后放入文件）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/alos_aw3d30.tif","sortOrder":3,"visible":1,"description":"JAXA ALOS AW3D30 全球 30m DEM，精度~5m。下载：www.eorc.jaxa.jp/ALOS → AW3D30 → 注册后下载","icon":"🗻","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
	        { "id": "local-dem-cop30","name":"本地cop30高程（Copernicus GLO-30 DEM原始geotiff数据）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/copernicus_glo30.tif","sortOrder":4,"visible":1,"description":"ESA Copernicus GLO-30 全球 30m DEM，精度~4m。下载：dataspace.copernicus.eu 或 portal.opentopography.org","icon":"🏔️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"3d","demElevationScale":1.0,"demColorRamp":true},
		        { "id": "local-terrain-cop30","name":"本地cop30高程（动态Geotiff转Cesium Terrain）","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/copernicus_glo30.tif","sortOrder":5,"visible":1,"description":"将 Copernicus GLO-30 转为 Cesium Terrain，影像图层可贴合地形起伏。使用自定义 GeoTiffTerrainProvider 从 GeoTIFF 直接提供高程数据","icon":"⛰️","centerLon":116,"centerLat":40,"centerHeight":500000,"demRenderMode":"terrain","demElevationScale":1.0},
        { "id": "local-terrain-cop30-tiles","name":"本地DEM高程数据(Cesium Terrain)","parentId":"folder-local-dem","nodeType":"layer","url":"/data/dem/terrain/copernicus_glo30","sortOrder":6,"visible":1,"description":"Copernicus GLO-30 预生成 Cesium Terrain 瓦片，通过 layer.json 加载，影像图层可贴合地形起伏","icon":"⛰️","centerLon":103.5,"centerLat":30.5,"centerHeight":100000}
      ];

      var added = [];
      for (var b = 0; b < builtinNodes.length; b++) {
        var node = builtinNodes[b];
        if (!existingIds[node.id]) {
          this.flatNodeList.push(node);
          existingIds[node.id] = true;
          added.push(node.id);
        }
      }

      if (added.length > 0) {
        // 触发响应式更新
        this.flatNodeList = [...this.flatNodeList];
        console.log('[LayerTreeManager] 📥 已注入 ' + added.length + ' 个新增内置节点:', added.join(', '));
        // 持久化到数据库
        this.saveConfig().then(function () {
          console.log('[LayerTreeManager] 💾 新增内置节点已持久化');
        }).catch(function () {});
      }
    },

    /**
     * 覆盖保存配置方法，将树数据扁平化后保存
     */
    async saveConfig() {
      try {
        console.log(`[${this.componentName}] 📤 准备保存树形配置`);

        // 移除 children 字段 + 过滤动态节点（_dynamicSource 标记的节点不应持久化）
        const saveData = this.flatNodeList
          .filter(item => !item._dynamicSource)
          .map(item => {
            const { children, loaded, loading, _dynamicSource, _dynamicLayerId, _dynamicGeojsonId, ...cleanItem } = item;
            return cleanItem;
          });

        // 使用 SQLite/IndexedDB 策略保存（JSON 策略的 save 是空操作）
        const saveStrategy = this._sqliteStrategy || this._configStrategy;
        const success = await saveStrategy.save(this.panelMetadata, saveData);

        if (success) {
          console.log(`[${this.componentName}] ✅ 树形配置已保存`);
          return true;
        } else {
          console.error(`[${this.componentName}] ❌ 保存失败`);
          alert('保存失败！');
          return false;
        }
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 保存失败:`, error);
        alert(`保存失败！\n错误：${error.message}`);
        return false;
      }
    },

    // ==================== 树构建/展平 ====================

    /**
     * 扁平数组 → 嵌套树（用于渲染）
     */
    buildTree(flatList) {
      if (!flatList || flatList.length === 0) return [];

      const map = new Map();
      const roots = [];

      flatList.forEach(item => {
        map.set(item.id, { ...item, children: [] });
      });

      flatList.forEach(item => {
        const node = map.get(item.id);
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId).children.push(node);
        } else {
          roots.push(node);
        }
      });

      // 递归排序
      const sortChildren = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          node.children.forEach(sortChildren);
        }
      };
      roots.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      roots.forEach(sortChildren);

      return roots;
    },

    /**
     * 嵌套树 → 扁平数组（用于保存）
     */
    flattenTree(treeNodes) {
      const result = [];
      const walk = (nodes) => {
        nodes.forEach(node => {
          const { children, ...flatNode } = node;
          result.push(flatNode);
          if (children && children.length > 0) {
            walk(children);
          }
        });
      };
      walk(treeNodes);
      return result;
    },

    // ==================== 树交互 ====================

    toggleExpand(nodeId) {
      if (this.expandedIds.has(nodeId)) {
        this.expandedIds.delete(nodeId);
      } else {
        this.expandedIds.add(nodeId);
      }
      // 触发 Set 响应式更新
      this.expandedIds = new Set(this.expandedIds);
    },

    expandAll() {
      const allIds = new Set();
      const collectIds = (nodes) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id);
            collectIds(node.children);
          }
        });
      };
      collectIds(this.treeData);
      this.expandedIds = allIds;
    },

    collapseAll() {
      this.expandedIds = new Set();
    },

    toggleSection(section) {
      if (section in this.sectionVisible) {
        this.sectionVisible[section] = !this.sectionVisible[section];
        this.$nextTick(function() {
          var treeEl = this.$refs.treeContainer;
          if (!treeEl) return;
          var panel = treeEl.closest('.function-panel');
          if (!panel) return;
          var sv = this.sectionVisible;
          // 工具栏
          var toolbar = panel.querySelector('.toolbar');
          if (toolbar) toolbar.style.display = sv.showToolbar !== false ? '' : 'none';
          // 列表
          var configList = panel.querySelector('.config-list');
          if (configList) {
            configList.style.display = sv.list ? '' : 'none';
            configList.style.overflowAnchor = 'none';
            configList.scrollTop = 0;
          }
          // ⚠️ 显隐切换可能导致浏览器调整 .function-panel 的 scrollTop，须重置
          panel.scrollTop = 0;
          panel.style.overflowAnchor = 'none';
        }.bind(this));
      }
    },

    selectNode(nodeId) {
      this.selectedNodeId = nodeId;
      // 选中已加载的图层时自动飞至图层位置
      const node = this.flatNodeList.find(n => n.id === nodeId);
      if (node && this._cesiumLayers.has(nodeId)) {
        this.flyToLayerNode(node);
      }
    },

    // ==================== CRUD 操作 ====================

    /**
     * 创建默认表单对象
     */
    createDefaultForm() {
      return {
        id: '',
        name: '',
        parentId: null,
        nodeType: 'layer',
        url: '',
        mvtSourceLayers: '',
        wmsLayerName: '',
        wmsVersion: '',
        sortOrder: 0,
        visible: true,
        description: '',
        icon: '📄'
      };
    },

    /**
     * 生成唯一 ID
     */
    generateId() {
      return 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    },

    // --- 添加根节点 ---
    addRootNode() {
      this.addChildForm = this.createDefaultForm();
      this.addChildForm.id = this.generateId();
      this.parentNodeForAdd = null;
      this.showAddChildDialog = true;
    },

    // --- 添加子节点 ---
    openAddChildDialog(parentNode) {
      this.addChildForm = {
        ...this.createDefaultForm(),
        id: this.generateId(),
        parentId: parentNode.id
      };
      this.parentNodeForAdd = parentNode;
      this.showAddChildDialog = true;
    },

    closeAddChildDialog() {
      this.showAddChildDialog = false;
      this.parentNodeForAdd = null;
    },

    confirmAddChild() {
      if (!this.addChildForm.name.trim()) {
        alert('节点名称不能为空');
        return;
      }
      if (!this.addChildForm.id.trim()) {
        alert('节点ID不能为空');
        return;
      }

      // 检查 ID 重复
      if (this.flatNodeList.find(n => n.id === this.addChildForm.id)) {
        alert('节点ID已存在，请更换');
        return;
      }

      const newNode = {
        ...this.addChildForm,
        visible: this.addChildForm.visible ? 1 : 0
      };

      // ⭐ 写入本地响应式数据（触发 treeData 更新）
      this.flatNodeList.push(newNode);
      // 强制触发 Vue 响应式更新（数组 push 在 Vue 2 中需要显式替换）
      this.flatNodeList = [...this.flatNodeList];

      // 自动展开父节点
      if (this.addChildForm.parentId) {
        const expanded = new Set(this.expandedIds);
        expanded.add(this.addChildForm.parentId);
        this.expandedIds = expanded;
      }

      console.log(`[${this.componentName}] ✅ 已添加节点: ${newNode.name} (parentId: ${newNode.parentId || '根节点'})`);

      // 立即持久化保存，确保新增节点不丢失
      this.saveConfig().then(() => {
        console.log(`[${this.componentName}] 💾 新增节点已持久化: ${newNode.name}`);
      });

      this.closeAddChildDialog();
    },

    // --- 编辑节点 ---
    openEditNodeDialog(node) {
      this.editingNode = node;
      this.editStyleExpanded = !!(node.geoJsonStyle || node.wfsStyle); // 有样式则默认展开
      this.editForm = {
        id: node.id,
        name: node.name || '',
        parentId: node.parentId || null,
        nodeType: node.nodeType || 'layer',
        url: node.url || '',
        sortOrder: node.sortOrder || 0,
        visible: node.visible !== undefined ? (node.visible === 1 || node.visible === true) : true,
        description: node.description || '',
        icon: node.icon || '📄',
        mvtSourceLayers: node.mvtSourceLayers || '',
        wmsLayerName: node.wmsLayerName || '',
        wmsVersion: node.wmsVersion || '',
        centerLon: node.centerLon != null ? Number(node.centerLon) : null,
        centerLat: node.centerLat != null ? Number(node.centerLat) : null,
        centerHeight: node.centerHeight != null ? Number(node.centerHeight) : null,
        // ⭐ geoJsonStyle：对象 → JSON 字符串供 textarea 编辑
        geoJsonStyle: node.geoJsonStyle ? JSON.stringify(node.geoJsonStyle, null, 2) : (node.wfsStyle ? JSON.stringify(node.wfsStyle, null, 2) : ''),
        wfsProxyUrl: node.wfsProxyUrl || '',
        // ⭐ 地理编码专属
        geocodingAddress: node.geocodingAddress || '',
        geocodingKey: node.geocodingKey || '',
        _showGeocoding: !!(node.geocodingAddress || node.geocodingKey || this._findAncestorFolder(node.id, ['root-geocode', '地理编码'])),
        // ⭐ WCS 专属
        wcsCoverageName: node.wcsCoverageName || '',
        wcsFormat: node.wcsFormat || 'image/tiff',
        wcsVersion: node.wcsVersion || '2.0.1',
        wcsAlpha: node.wcsAlpha != null ? node.wcsAlpha : 0.7,
        wcsTimeAxis: node.wcsTimeAxis || '',
        wcsTimeSlice: node.wcsTimeSlice || '',
        wcsColorRamp: node.wcsColorRamp !== false, // 默认 true（启用色带）
        wcsRenderMode: node.wcsRenderMode || '2d',   // 默认 2D 叠加
        wcsElevationScale: node.wcsElevationScale != null ? node.wcsElevationScale : 1.0,
        _showWcs: !!(node.wcsCoverageName || node.wcsFormat || this._findAncestorFolder(node.id, ['folder-wcs', 'WCS'])),
        // ⭐ 本地 DEM 专属
        demRenderMode: node.demRenderMode || '3d',
        demElevationScale: node.demElevationScale != null ? node.demElevationScale : 1.0,
        demColorRamp: node.demColorRamp !== false,
        _showDem: !!(node.url && (node.url.endsWith('.tif') || node.url.endsWith('.tiff')) || this._findAncestorFolder(node.id, ['folder-local-dem', 'local-dem', 'DEM']))
      };
      this.showEditDialog = true;
    },

    closeEditDialog() {
      this.showEditDialog = false;
      this.editingNode = null;
    },

    confirmEdit() {
      if (!this.editForm.name.trim()) {
        alert('节点名称不能为空');
        return;
      }

      const index = this.flatNodeList.findIndex(n => n.id === this.editForm.id);
      if (index === -1) return;

      // ⭐ 解析 geoJsonStyle JSON 字符串 → 对象
      let parsedStyle = undefined;
      if (this.editForm.geoJsonStyle && this.editForm.geoJsonStyle.trim()) {
        try {
          parsedStyle = JSON.parse(this.editForm.geoJsonStyle);
        } catch (e) {
          alert('geoJsonStyle JSON 格式无效，请检查：' + e.message);
          return;
        }
      }

      // 合并更新（保留原始节点中额外字段）
      this.flatNodeList[index] = {
        ...this.flatNodeList[index],
        name: this.editForm.name,
        parentId: this.editForm.parentId,
        nodeType: this.editForm.nodeType,
        url: this.editForm.url,
        sortOrder: this.editForm.sortOrder,
        visible: this.editForm.visible ? 1 : 0,
        description: this.editForm.description,
        icon: this.editForm.icon,
        mvtSourceLayers: this.editForm.mvtSourceLayers || '',
        wmsLayerName: this.editForm.wmsLayerName || '',
        wmsVersion: this.editForm.wmsVersion || '',
        centerLon: this.editForm.centerLon != null ? Number(this.editForm.centerLon) : undefined,
        centerLat: this.editForm.centerLat != null ? Number(this.editForm.centerLat) : undefined,
        centerHeight: this.editForm.centerHeight != null ? Number(this.editForm.centerHeight) : undefined,
        geoJsonStyle: parsedStyle,           // ⭐ 保存解析后的样式对象
        wfsStyle: parsedStyle || undefined,  // ⭐ 同步到 wfsStyle（兼容旧 WFS 节点）
        wfsProxyUrl: this.editForm.wfsProxyUrl || undefined,
        // ⭐ 地理编码专属
        geocodingAddress: this.editForm.geocodingAddress || undefined,
        geocodingKey: this.editForm.geocodingKey || undefined,
        // ⭐ WCS 专属
        wcsCoverageName: this.editForm.wcsCoverageName || undefined,
        wcsFormat: this.editForm.wcsFormat || undefined,
        wcsVersion: this.editForm.wcsVersion || undefined,
        wcsAlpha: this.editForm.wcsAlpha != null ? this.editForm.wcsAlpha : undefined,
        wcsTimeAxis: this.editForm.wcsTimeAxis || undefined,
        wcsTimeSlice: this.editForm.wcsTimeSlice || undefined,
        wcsColorRamp: this.editForm.wcsColorRamp !== undefined ? this.editForm.wcsColorRamp : undefined,
        wcsRenderMode: this.editForm.wcsRenderMode || undefined,
        wcsElevationScale: this.editForm.wcsElevationScale != null ? this.editForm.wcsElevationScale : undefined,
        // ⭐ 本地 DEM
        demRenderMode: this.editForm.demRenderMode || undefined,
        demElevationScale: this.editForm.demElevationScale != null ? this.editForm.demElevationScale : undefined,
        demColorRamp: this.editForm.demColorRamp !== undefined ? this.editForm.demColorRamp : undefined
      };
      // 强制触发响应式更新
      this.flatNodeList = [...this.flatNodeList];

      console.log(`[${this.componentName}] ✅ 已更新节点: ${this.editForm.name}`);

      // 立即持久化保存
      this.saveConfig().then(() => {
        console.log(`[${this.componentName}] 💾 节点修改已持久化: ${this.editForm.name}`);
      });

      this.closeEditDialog();
    },

    // ═══════════ geoJsonStyle 编辑器辅助方法 ═══════════

    /**
     * 检查节点是否属于指定文件夹（递归向上查找 parentId）
     */
    _findAncestorFolder(nodeId, folderIdsOrNames) {
      var current = this.flatNodeList.find(function (n) { return n.id === nodeId; });
      var maxDepth = 10;
      while (current && maxDepth-- > 0) {
        if (!current.parentId) return false;
        var parent = this.flatNodeList.find(function (n) { return n.id === current.parentId; });
        if (!parent) return false;
        for (var k = 0; k < folderIdsOrNames.length; k++) {
          if (parent.id === folderIdsOrNames[k] || (parent.name || '').indexOf(folderIdsOrNames[k]) >= 0) return true;
        }
        current = parent;
      }
      return false;
    },

    /**
     * 格式化 textarea 中的 geoJsonStyle JSON
     */
    formatGeoJsonStyle() {
      if (!this.editForm.geoJsonStyle || !this.editForm.geoJsonStyle.trim()) return;
      try {
        const obj = JSON.parse(this.editForm.geoJsonStyle);
        this.editForm.geoJsonStyle = JSON.stringify(obj, null, 2);
      } catch (e) {
        alert('JSON 格式无效，无法格式化：' + e.message);
      }
    },

    /**
     * 清除 geoJsonStyle
     */
    clearGeoJsonStyle() {
      this.editForm.geoJsonStyle = '';
    },

    /**
     * 📡 从 OGC 服务的 GetStyles 接口获取 SLD 样式并转为 geoJsonStyle
     *
     * 尝试顺序：
     *   1. WFS GetStyles (WFS 1.1.0)
     *   2. WMS GetStyles (WMS 1.3.0)
     *
     * SLD 解析支持：
     *   PolygonSymbolizer → fill / fillOpacity / stroke / strokeWidth
     *   LineSymbolizer   → stroke / strokeWidth / strokeOpacity
     *   PointSymbolizer  → markerColor / markerSize
     *   TextSymbolizer   → labelField (提示)
     */
    async fetchServiceStyle() {
      var nodeUrl = this.editForm.url;
      if (!nodeUrl) {
        alert('请先填写资源URL');
        return;
      }

      this.styleFetching = true;
      var self = this;

      try {
        // 提取服务基地址（去掉已有查询参数）
        var baseUrl = nodeUrl.split('?')[0];

        // ═══ 尝试 1：WFS GetStyles (1.1.0) ═══
        var wfsStylesUrl = baseUrl + '?SERVICE=WFS&REQUEST=GetStyles&VERSION=1.1.0&TYPENAMES=' + encodeURIComponent(this.editForm.wmsLayerName || '');
        var sldText = null;

        try {
          console.log('[SLD检测] 🔍 尝试 WFS GetStyles:', wfsStylesUrl.slice(0, 120));
          var resp = await fetch(wfsStylesUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
          if (resp.ok) {
            sldText = await resp.text();
            if (sldText && sldText.indexOf('StyledLayerDescriptor') >= 0) {
              console.log('[SLD检测] ✅ WFS GetStyles 返回 SLD');
            }
          }
        } catch (e) {
          console.log('[SLD检测] ⚠️ WFS GetStyles 失败:', e.message);
        }

        // ═══ 尝试 2：WMS GetStyles (1.3.0) ═══
        if (!sldText || sldText.indexOf('StyledLayerDescriptor') < 0) {
          try {
            var wmsStylesUrl = baseUrl.replace(/\/wfs/i, '/wms') + '?SERVICE=WMS&REQUEST=GetStyles&VERSION=1.3.0&LAYERS=' + encodeURIComponent(this.editForm.wmsLayerName || '');
            console.log('[SLD检测] 🔍 尝试 WMS GetStyles:', wmsStylesUrl.slice(0, 120));
            var resp2 = await fetch(wmsStylesUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
            if (resp2.ok) {
              sldText = await resp2.text();
              if (sldText && sldText.indexOf('StyledLayerDescriptor') >= 0) {
                console.log('[SLD检测] ✅ WMS GetStyles 返回 SLD');
              }
            }
          } catch (e) {
            console.log('[SLD检测] ⚠️ WMS GetStyles 失败:', e.message);
          }
        }

        // ═══ 解析 SLD → geoJsonStyle ═══
        if (!sldText || sldText.indexOf('StyledLayerDescriptor') < 0) {
          alert('该服务不支持 GetStyles 或未返回 SLD 样式描述。\n\n天地图 WFS 2.0 通常不提供 GetStyles 接口。\n建议：手动配置 geoJsonStyle 或从 GeoJsonLayerManager 转换样式。');
          this.styleFetching = false;
          return;
        }

        var styleJson = parseSldToGeoJsonStyle(sldText);
        if (styleJson) {
          this.editForm.geoJsonStyle = JSON.stringify(styleJson, null, 2);
          this.editStyleExpanded = true;
          console.log('[SLD检测] 🎨 SLD → geoJsonStyle 转换完成:', JSON.stringify(styleJson));
        } else {
          alert('SLD 解析成功但未提取到样式规则。');
        }
      } catch (err) {
        console.error('[SLD检测] ❌ 获取样式失败:', err);
        alert('获取服务样式失败：' + (err.message || '网络错误'));
      } finally {
        this.styleFetching = false;
      }

      // ═══════ 内嵌 SLD 解析函数 ═══════

      function parseSldToGeoJsonStyle(xmlText) {
        if (typeof DOMParser === 'undefined') return null;

        var doc;
        try {
          doc = new DOMParser().parseFromString(xmlText, 'text/xml');
          if (doc.querySelector('parsererror')) return null;
        } catch (e) { return null; }

        // 找到第一个 Rule
        var rule = doc.querySelector('Rule');
        if (!rule) return null;

        var style = {};

        // ── PolygonSymbolizer ──
        var polySym = rule.querySelector('PolygonSymbolizer');
        if (polySym) {
          var fillEl = polySym.querySelector('CssParameter[name="fill"]');
          if (fillEl) style.fill = fillEl.textContent.trim();
          var fillOpEl = polySym.querySelector('CssParameter[name="fill-opacity"]');
          if (fillOpEl) style.fillOpacity = parseFloat(fillOpEl.textContent.trim());
          var strokeEl = polySym.querySelector('CssParameter[name="stroke"]');
          if (strokeEl) {
            style.stroke = strokeEl.textContent.trim();
            style.outlineColor = strokeEl.textContent.trim();
          }
          var strokeWEl = polySym.querySelector('CssParameter[name="stroke-width"]');
          if (strokeWEl) {
            style.strokeWidth = parseFloat(strokeWEl.textContent.trim());
            style.outlineWidth = parseFloat(strokeWEl.textContent.trim());
          }
        }

        // ── LineSymbolizer ──
        var lineSym = rule.querySelector('LineSymbolizer');
        if (lineSym) {
          var lStrokeEl = lineSym.querySelector('CssParameter[name="stroke"]');
          if (lStrokeEl && !style.stroke) style.stroke = lStrokeEl.textContent.trim();
          var lStrokeWEl = lineSym.querySelector('CssParameter[name="stroke-width"]');
          if (lStrokeWEl && !style.strokeWidth) style.strokeWidth = parseFloat(lStrokeWEl.textContent.trim());
        }

        // ── PointSymbolizer → Marker ──
        var ptSym = rule.querySelector('PointSymbolizer');
        if (ptSym) {
          var mark = ptSym.querySelector('Mark');
          if (mark) {
            var mFill = mark.querySelector('CssParameter[name="fill"], CssParameter[name="fill"]');
            if (mFill) style.markerColor = mFill.textContent.trim();
            var mStroke = mark.querySelector('CssParameter[name="stroke"]');
            if (mStroke) style.markerColor = style.markerColor || mStroke.textContent.trim();
          }
          var sizeEl = ptSym.querySelector('Size');
          if (sizeEl) style.markerSize = parseFloat(sizeEl.textContent.trim());
        }

        // ── TextSymbolizer → label 提示 ──
        var txtSym = rule.querySelector('TextSymbolizer');
        if (txtSym) {
          var labelEl = txtSym.querySelector('Label > PropertyName, Label > ogc\\:PropertyName');
          if (!labelEl) labelEl = txtSym.querySelector('Label');
          if (labelEl) {
            // 提取字段名作为提示
            var labelText = labelEl.textContent.trim();
            if (labelText) {
              style._sldLabelField = labelText;
            }
          }
        }

        return Object.keys(style).length > 0 ? style : null;
      }
    },

    /**
     * 🔄 转换 GeoJsonLayerManager 样式 → geoJsonStyle 格式
     *
     * 核心规则：
     *   fillColor  → fill  (rgba() 自动拆分为 #rrggbb + fillOpacity)
     *   strokeColor → stroke
     *   其余所有字段 → 透传（包括未来 GeoJsonLayerManager 新增的任何样式字段）
     *
     * 跳过内部字段：id, name, description, geoType, geoJson, loaded, loading
     *
     * 用法：从 GeoJsonLayerManager 编辑表单复制样式 JSON → 粘贴到 textarea → 点"🔄 转换"
     */
    convertGeoJsonManagerStyle() {
      if (!this.editForm.geoJsonStyle || !this.editForm.geoJsonStyle.trim()) return;
      try {
        const src = JSON.parse(this.editForm.geoJsonStyle);
        const dst = {};

        // 内部字段白名单（这些是图层配置元数据，不是样式，跳过）
        var metaKeys = { id:1, name:1, description:1, geoType:1, geoJson:1, loaded:1, loading:1 };

        // 需要重命名的字段（GeoJsonLayerManager → geoJsonStyle）
        var renameMap = {
          fillColor: 'fill',
          strokeColor: 'stroke'
        };

        for (var key in src) {
          if (!src.hasOwnProperty(key)) continue;
          if (metaKeys[key]) continue; // 跳过元数据字段
          var val = src[key];
          if (val === null || val === undefined) continue;

          // fillColor：拆分 rgba() 为 #rrggbb + fillOpacity
          if (key === 'fillColor') {
            var rgba = typeof val === 'string' ? val.match(
              /rgba?\(\s*(\d+\.?\d*)\s*,?\s*(\d+\.?\d*)\s*,?\s*(\d+\.?\d*)\s*(?:[,/]\s*([\d.]+)\s*)?\)/
            ) : null;
            if (rgba) {
              var r = Math.round(parseFloat(rgba[1]));
              var g = Math.round(parseFloat(rgba[2]));
              var b = Math.round(parseFloat(rgba[3]));
              dst.fill = '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
              if (rgba[4] !== undefined) dst.fillOpacity = parseFloat(rgba[4]);
            } else {
              dst.fill = val;
            }
            continue;
          }

          // 已知重命名
          if (renameMap[key]) {
            dst[renameMap[key]] = val;
            continue;
          }

          // ⭐ 其余所有字段透传（未来新增的样式字段自动生效）
          dst[key] = val;
        }

        this.editForm.geoJsonStyle = JSON.stringify(dst, null, 2);
      } catch (e) {
        alert('JSON 格式无效：' + e.message);
      }
    },

    // --- 删除节点（级联） ---
    confirmDeleteNode(node) {
      const descendantCount = this.getDescendantCount(node.id);
      let msg = `确定删除节点 "${node.name}" 吗？`;
      if (descendantCount > 0) {
        msg += `\n\n⚠️ 将级联删除其下 ${descendantCount} 个子节点！`;
      }
      if (!confirm(msg)) return;

      this.deleteNodeRecursive(node.id);
    },

    /**
     * 递归删除节点及其所有子孙节点
     */
    deleteNodeRecursive(nodeId) {
      // 找到所有子孙节点
      const descendantIds = this.collectDescendantIds(nodeId);
      const allIdsToRemove = new Set([nodeId, ...descendantIds]);

      this.flatNodeList = this.flatNodeList.filter(n => !allIdsToRemove.has(n.id));

      // 清除展开/选中状态
      const expanded = new Set(this.expandedIds);
      expanded.delete(nodeId);
      descendantIds.forEach(id => expanded.delete(id));
      this.expandedIds = expanded;

      if (this.selectedNodeId && allIdsToRemove.has(this.selectedNodeId)) {
        this.selectedNodeId = null;
      }

      console.log(`[${this.componentName}] 🗑️ 已删除节点及其 ${allIdsToRemove.size - 1} 个子节点`);

      // 立即持久化保存
      this.saveConfig().then(() => {
        console.log(`[${this.componentName}] 💾 节点删除已持久化`);
      });
    },

    // ==================== 工具方法 ====================

    /**
     * 递归查找节点
     */
    findNodeById(nodeId, treeNodes) {
      for (const node of treeNodes) {
        if (node.id === nodeId) return node;
        if (node.children && node.children.length > 0) {
          const found = this.findNodeById(nodeId, node.children);
          if (found) return found;
        }
      }
      return null;
    },

    /**
     * 获取节点的子孙节点数量
     */
    getDescendantCount(nodeId) {
      return this.collectDescendantIds(nodeId).length;
    },

    /**
     * 收集所有子孙节点 ID
     */
    collectDescendantIds(nodeId) {
      const ids = [];
      const stack = [nodeId];

      while (stack.length > 0) {
        const currentId = stack.pop();
        this.flatNodeList.forEach(n => {
          if (n.parentId === currentId) {
            ids.push(n.id);
            stack.push(n.id);
          }
        });
      }

      return ids;
    },

    /**
     * 获取 edit 时可选的父节点（排除自身及子孙节点防止循环引用）
     */
    getAvailableParents(excludeId) {
      const excludeSet = new Set([excludeId, ...this.collectDescendantIds(excludeId)]);

      const available = this.flatNodeList
        .filter(n => !excludeSet.has(n.id))
        .map(n => ({ ...n, _depth: 0 }));

      // 计算缩进深度
      const idToNode = new Map(available.map(n => [n.id, n]));
      available.forEach(n => {
        let depth = 0;
        let pId = n.parentId;
        while (pId && idToNode.has(pId)) {
          depth++;
          pId = idToNode.get(pId)?.parentId;
        }
        n._depth = depth;
      });

      return available.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },

    // ==================== 基类钩子和数据管理 ====================

    onConfigLoadedHandler() {
      console.log(`[${this.componentName}] ✅ 树形配置加载完成`);
      const list = this.flatNodeList;
      console.log(`[${this.componentName}] 🌳 共加载 ${list.length} 个节点`);

      // 统计层级信息
      const rootCount = list.filter(n => !n.parentId).length;
      const folderCount = list.filter(n => n.nodeType === 'folder').length;
      const layerCount = list.filter(n => n.nodeType === 'layer').length;
      console.log(`[${this.componentName}]   ├─ 根节点: ${rootCount} 个`);
      console.log(`[${this.componentName}]   ├─ 目录节点: ${folderCount} 个`);
      console.log(`[${this.componentName}]   └─ 图层节点: ${layerCount} 个`);

      // 自动展开根节点
      const roots = list.filter(n => !n.parentId);
      if (roots.length > 0) {
        const expanded = new Set(this.expandedIds);
        roots.forEach(r => expanded.add(r.id));
        this.expandedIds = expanded;
      }
    },

    // ==================== 动态加载本地 GeoJsonLayerManager 图层 ====================

    /**
     * 从 API 服务器获取 GeoJsonLayerManager 管理的图层目录，
     * 动态生成树节点并追加到 flatNodeList 的 GeoJSON 分区下。
     *
     * 设计要点：
     *   1. 读取 GeoJsonLayerManager.config.json 了解图层结构定义
     *   2. 原始 GeoJSON 字符串存入 _localGeoJsonMeta，按需解析后立即释放（低内存）
     *   3. 动态节点的 _dynamicSource 标记为 'GeoJsonLayerManager'，保存时自动排除
     *   4. 节点 ID 统一为 'local-geojson-' 前缀，与后端持久化节点隔离
     *   5. 如果本地服务不可达，静默降级（不影响已加载的树数据）
     */
    async _loadLocalGeoJsonLayers() {
      var API_URL = getApiBaseUrl() + '/data/gis/GeoJsonLayerManager/GeoJsonLayerManager.json';
      var PARENT_ID = 'folder-geojson';

      try {
        console.log(`[${this.componentName}] 📡 正在获取本地 GeoJSON 图层目录...`);
        const resp = await fetch(API_URL, { signal: createTimeoutSignal(5000) });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const layers = await resp.json();
        if (!layers || !layers.length) {
          console.log(`[${this.componentName}] ℹ️ 本地 GeoJSON 图层目录为空，跳过`);
          return;
        }

        // 过滤已存在的动态节点（避免重复添加）
        const existingIds = new Set(this.flatNodeList.map(n => n.id));
        let addedCount = 0;

        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          const nodeId = 'local-geojson-' + layer.id;

          // ⭐ 始终更新 _localGeoJsonMeta（即使节点已存在也要刷新样式配置）
          this._localGeoJsonMeta.set(nodeId, {
            rawGeoJson: layer.geoJson,
            config: layer
          });

          if (existingIds.has(nodeId)) continue;

          // 解析并缓存 GeoJSON 数据
          let geoJsonData;
          try {
            geoJsonData = typeof layer.geoJson === 'string'
              ? JSON.parse(layer.geoJson)
              : layer.geoJson;
          } catch (e) {
            console.warn(`[${this.componentName}] ⚠️ 图层 "${layer.name}" GeoJSON 解析失败:`, e.message);
            continue;
          }
          // ⭐ 只缓存元数据 + 原始 geojson 字符串（不预解析，按需 JSON.parse 后立即释放）
          this._localGeoJsonMeta.set(nodeId, {
            rawGeoJson: layer.geoJson,          // 保持字符串（~KB 级），不解析成对象树（~MB 级）
            config: layer                        // 样式/聚类等元数据
          });

          // ⭐ 映射 GeoJsonLayerManager 样式字段 → LayerTreeManager geoJsonStyle
          const geoJsonStyle = {
            fill: layer.fillColor || '#FFFF00',
            fillOpacity: layer.fillOpacity != null ? layer.fillOpacity : 0.5,
            stroke: layer.strokeColor || '#FF0000',
            strokeWidth: layer.strokeWidth != null ? layer.strokeWidth : 2,
            outlineColor: layer.strokeColor || '#FF0000',
            outlineWidth: layer.strokeWidth != null ? layer.strokeWidth : 2,
            markerColor: layer.markerColor || '#4169E1',
            markerSize: layer.markerSize != null ? layer.markerSize : 48,
            markerIcon: layer.markerIcon || ''
          };

          // 轻量中心坐标（只 scan 前 20 个特征，不完整解析）
          const center = this._computeGeoJsonCenterLazy(layer.geoJson);

          // 要素统计（正则提取，不 JSON.parse）
          const featureSummary = this._summaryGeoJsonLazy(layer.geoJson, layer.geoType);

          // 构建树节点
          this.flatNodeList.push({
            id: nodeId,
            name: '📍本地 · ' + layer.name,
            parentId: PARENT_ID,
            nodeType: 'layer',
            url: 'local://GeoJsonLayerManager/' + layer.id,
            _dynamicSource: 'GeoJsonLayerManager',
            _dynamicLayerId: layer.id,
            _dynamicGeojsonId: nodeId,
            sortOrder: 10 + i,
            visible: 1,
            description: [
              '来源：本地 GeoJsonLayerManager',
              '服务类型：GeoJSON ' + (layer.geoType || 'Unknown'),
              layer.description || '',
              featureSummary,
              '本地服务直连，零网络请求。'
            ].filter(Boolean).join(' | '),
            icon: this._geoTypeIcon(layer.geoType, layer.markerIcon || ''),
            centerLon: center.lon,
            centerLat: center.lat,
            centerHeight: center.height,
            // ⭐ 样式 & 聚类配置
            geoJsonStyle: geoJsonStyle,
            clusterEnabled: layer.clusterEnabled || false,
            clusterPixelRange: layer.clusterPixelRange || 50,
            clusterMinSize: layer.clusterMinSize || 3
          });

          existingIds.add(nodeId);
          addedCount++;
        }

        if (addedCount > 0) {
          // 触发 Vue 响应式更新
          this.flatNodeList = [...this.flatNodeList];
          console.log(`[${this.componentName}] 📍 已动态加载 ${addedCount} 个本地 GeoJSON 图层（共 ${layers.length} 个目录项）`);
        }
      } catch (err) {
        console.warn(`[${this.componentName}] ⚠️ 无法加载本地 GeoJSON 图层目录:`, err.message,
          '(本地 API 可能未启动，已加载的内置/持久化节点不受影响)');
      }
    },

    /**
     * 🔄 强制从 JSON 刷新全部配置（忽略缓存）
     *    1) 直接读 LayerTreeManager.json → 更新本面板节点树
     *    2) 直接读 GeoJsonLayerManager.json → 更新图层样式缓存（pinField/sizeField 等）
     */
    async forceReloadGeoJsonConfig() {
      const log = (...args) => console.log(`[${this.componentName}] 🔄`, ...args);
      this.refreshLoading = true;

      try {
        // ── 1. 刷新本面板配置：直接读 LayerTreeManager.json（绕过 SQLite） ──
        log('1/2 直接加载 LayerTreeManager.json 更新节点树...');
        const fetchURL = '/data/gis/layerTreeManager/LayerTreeManager.json';
        const resp = await fetch(fetchURL, { cache: 'no-cache' });
        if (resp.ok) {
          const jsonData = await resp.json();
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            if (this.$refs.basePanel) {
              this.$refs.basePanel.configList = jsonData.map(item => ({ ...item, loaded: false, loading: false }));
            }
            log(`✅ LayerTreeManager.json 加载成功，${jsonData.length} 条节点`);
          }
        } else {
          log(`⚠️ LayerTreeManager.json HTTP ${resp.status}`);
        }

        // ── 2. 刷新图层样式配置：直接读 GeoJsonLayerManager.json ──
        log('2/2 重新加载 GeoJsonLayerManager.json 样式缓存...');
        this._localGeoJsonMeta.clear();
        await this._loadLocalGeoJsonLayers();
        log('✅ 全部配置已从 JSON 强制刷新');
      } catch (e) {
        console.warn(`[${this.componentName}] ⚠️ 强制刷新失败:`, e.message);
      } finally {
        this.refreshLoading = false;
      }
    },

    /**
     * 从 GeoJSON 字符串/对象计算中心坐标（轻量：解析后立即释放）
     */
    _computeGeoJsonCenterLazy(geoJsonRaw) {
      var geoJson;
      try {
        geoJson = typeof geoJsonRaw === 'string' ? JSON.parse(geoJsonRaw) : geoJsonRaw;
      } catch (e) { return { lon: 116.4, lat: 39.9, height: 8000 }; }
      return this._computeGeoJsonCenter(geoJson);
    },

    /**
     * 从 GeoJSON 字符串/对象生成要素摘要（正则 + 最小解析）
     */
    _summaryGeoJsonLazy(geoJsonRaw, geoType) {
      var raw = typeof geoJsonRaw === 'string' ? geoJsonRaw : JSON.stringify(geoJsonRaw);
      // 正则快速计数（无需完整解析）
      var featureMatches = raw.match(/"type"\s*:\s*"Feature"/g);
      var count = featureMatches ? featureMatches.length : 0;
      if (count === 0) return '';
      return count + ' 个' + (geoType || '未知') + '要素';
    },

    /**
     * 从 GeoJSON FeatureCollection 计算中心坐标
     * @returns {{ lon: number, lat: number, height: number }}
     */
    _computeGeoJsonCenter(geoJson) {
      const coords = [];
      if (!geoJson || !geoJson.features) return { lon: 116.4, lat: 39.9, height: 8000 };

      geoJson.features.forEach(f => {
        const c = f.geometry && f.geometry.coordinates;
        if (!c) return;
        const type = f.geometry.type;
        if (type === 'Point') coords.push(c);
        else if (type === 'LineString' || type === 'MultiPoint') c.forEach(p => coords.push(p));
        else if (type === 'Polygon') c[0].forEach(p => coords.push(p));
        else if (type === 'MultiPolygon') c.forEach(ring => ring[0].forEach(p => coords.push(p)));
      });

      if (coords.length === 0) return { lon: 116.4, lat: 39.9, height: 8000 };

      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const centerLng = lngs.reduce((s, v) => s + v, 0) / coords.length;
      const centerLat = lats.reduce((s, v) => s + v, 0) / coords.length;
      const minLon = Math.min(...lngs), maxLon = Math.max(...lngs);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);

      // ⭐ 基于边界范围和相机FOV计算合适的飞行高度
      let dLon = maxLon - minLon, dLat = maxLat - minLat;
      if (dLon < 0.001) dLon = 0.001;
      if (dLat < 0.001) dLat = 0.001;
      const margin = Math.max(dLon, dLat) * 0.4;
      const cosLat = Math.cos(centerLat * Math.PI / 180);
      const diagM = Math.sqrt(
        Math.pow((dLon + margin * 2) * 111320 * cosLat, 2) +
        Math.pow((dLat + margin * 2) * 111320, 2)
      );
      // 默认FOV 30°, safetyFactor 1.3, 最低500m
      const fovY = 30 * Math.PI / 180;
      const height = Math.max(diagM / (2 * Math.tan(fovY / 2)) * 1.3, 500);

      return {
        lon: parseFloat(centerLng.toFixed(6)),
        lat: parseFloat(centerLat.toFixed(6)),
        height: Math.round(height)
      };
    },

    /**
     * 根据几何类型和自定义图标返回合适的图标符
     */
    _geoTypeIcon(geoType, markerIcon) {
      if (markerIcon && markerIcon.length <= 2) return markerIcon;
      const icons = { Point: '📍', LineString: '📏', Polygon: '🗺️', MultiPolygon: '🗺️' };
      return icons[geoType] || '📄';
    },

    /**
     * 生成 GeoJSON 数据摘要（特征数、类型等）
     */
    _summaryGeoJson(geoJson) {
      if (!geoJson || !geoJson.features) return '';
      const count = geoJson.features.length;
      const types = new Set(geoJson.features.map(f => f.geometry && f.geometry.type).filter(Boolean));
      const typeStr = Array.from(types).join('/');
      return `${count} 个${typeStr}要素`;
    },

    /**
     * 保存前将树数据展平
     */
    // ==================== Cesium 图层集成 ====================
    // ==================== 实体选中 & 属性弹窗 ====================

    _registerEntityPicking(node, dataSource) {
      if (!this._selectionManager) {
        this._selectionManager = EntitySelectionManager.getInstance();
      }
      const viewer = this.getViewer();
      if (!viewer) return;
      const self = this;
      this._selectionManager.registerLayer(viewer, node.id, dataSource, {
        mode: 'click',
        enableHighlight: true,
        enableClustering: node.clusterEnabled !== false,
        highlightDuration: 2,
        onSelect: function (payload) { self._onEntitySelected(node, payload); },
        onDismiss: function () { self.dismissEntityPopup(); }
      });
    },

    _onEntitySelected(node, payload) {
      this.popupTitle = payload.title || node.name || '实体属性';
      this.popupProperties = payload.properties || [];
      this.popupGeoType = payload.geoType || '';
      this.popupLayerName = node.name || '';
      this._popupSelectedEntity = payload.entity;
      this._popupSelectedLayerId = node.id;
      if (payload.screenPosition) {
        this.popupScreenX = payload.screenPosition.x;
        this.popupScreenY = payload.screenPosition.y;
      }
      // ⭐ 聚类实体不需要位置跟踪（dummy entity 的 position 是 billboard 锚点）
      if (!payload._isCluster) {
        this._startPopupTracking(payload.entity);
      } else {
        if (this._selectionManager) this._selectionManager.stopTracking();
      }
      this.showEntityPopup = true;
    },

    _startPopupTracking(entity) {
      if (!this._selectionManager) return;
      const viewer = this.getViewer();
      if (!viewer) return;
      const self = this;
      this._selectionManager.stopTracking();
      this._selectionManager.trackScreenPosition(viewer, entity, function (pos) {
        if (self.showEntityPopup && pos) {
          self.popupScreenX = pos.x;
          self.popupScreenY = pos.y;
        }
      });
    },

    flyToSelectedEntity() {
      const entity = this._popupSelectedEntity;
      if (!entity || !entity.position) return;
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;
      try {
        const pos = entity.position.getValue
          ? entity.position.getValue(viewer.clock.currentTime)
          : entity.position;
        if (!pos) return;
        viewer.camera.flyTo({
          destination: pos,
          duration: 1.5,
          offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500)
        });
      } catch (e) { /* ignore */ }
    },

    dismissEntityPopup() {
      this.showEntityPopup = false;
      this._popupSelectedEntity = null;
      this._popupSelectedLayerId = null;
      if (this._selectionManager) this._selectionManager.stopTracking();
    },

    onPopupRowClick({ prop }) {
      if (!prop._worldPos) return;
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;

      var worldPos = prop._worldPos;
      var layerId = this._popupSelectedLayerId;

      var cg = Cesium.Cartographic.fromCartesian(worldPos);
      var currentHeight = viewer.camera.positionCartographic.height;
      var dest = Cesium.Cartesian3.fromDegrees(
        Cesium.Math.toDegrees(cg.longitude),
        Cesium.Math.toDegrees(cg.latitude),
        currentHeight
      );
      viewer.camera.flyTo({
        destination: dest,
        duration: 0.6,
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: 0
        }
      });

      this.dismissEntityPopup();

      setTimeout(() => {
        try {
          var sp = viewer.scene.cartesianToCanvasCoordinates(worldPos);
          if (!sp) return;
          var dpResults = viewer.scene.drillPick(new Cesium.Cartesian2(sp.x, sp.y), 5);
          for (var i = 0; i < dpResults.length; i++) {
            var entity = dpResults[i].id || (dpResults[i].primitive && dpResults[i].primitive.id);
            if (entity && !entity._isClusterPrimitive && this._selectionManager && layerId) {
              this._selectionManager.selectEntity(layerId, entity, { x: sp.x, y: sp.y });
              return;
            }
          }
        } catch (e) { /* ignore */ }
      }, 900);
    },

    /**
     * 获取 Cesium Viewer 实例
     */
    getViewer() {
      return typeof window !== 'undefined' ? window.__cesiumViewer__ : null;
    },

    /**
     * 获取全局 Cesium 对象
     */
    getCesium() {
      return typeof window !== 'undefined' ? window.Cesium : null;
    },

    // ==================== Cesium 资源保护 ====================

    /**
     * 设置 Cesium 资源保护：限制并发请求、拦截渲染崩溃、监听 WebGL 丢失
     * ⚠️ 使用轮询检查 viewer 是否就绪（Cesium 可能在组件之后初始化）
     */
    _setupCesiumProtections() {
      let attempts = 0;
      const MAX_ATTEMPTS = 30; // 最多等待 30 秒
      const trySetup = () => {
        const viewer = this.getViewer();
        const Cesium = this.getCesium();
        if (!viewer || !Cesium || !viewer.scene) {
          if (++attempts < MAX_ATTEMPTS) {
            setTimeout(trySetup, 1000);
          }
          return;
        }

        // 1. 限制 Cesium 并发请求数（防止 ERR_INSUFFICIENT_RESOURCES）
        if (Cesium.RequestScheduler) {
          Cesium.RequestScheduler.maximumRequests = 8;         // 总共最多 8 个并发
          Cesium.RequestScheduler.maximumRequestsPerServer = 4; // 每个服务最多 4 个
          console.log(`[${this.componentName}] 🛡️ 请求调度器已配置: maxRequests=8, perServer=4`);
        }

        // 2. 拦截渲染崩溃 — 阻止 Cesium 默认的全屏阻塞错误面板
        if (viewer.scene && !this._renderErrorHandlerSet) {
          this._renderErrorHandlerSet = true;

          // 方法1: 重写 showErrorPanel 为空操作（最可靠）
          if (typeof viewer.showErrorPanel === 'function') {
            const origShowErrorPanel = viewer.showErrorPanel.bind(viewer);
            viewer.showErrorPanel = (error) => {
              // 标记 WebGL 不可用
              this._isWebGLLost = true;
              console.error(`[${this.componentName}] 🔴 Cesium 渲染崩溃已拦截:`, error?.message || error);
              console.warn(`[${this.componentName}] ⚠️ 请刷新页面恢复`);
              // 不调用原始方法 → 阻止全屏阻塞面板
              // 不调用 requestRender → WebGL 上下文可能已损坏
            };
            this._origShowErrorPanel = origShowErrorPanel;
          }

          // 方法2: 监听 renderError 事件
          if (viewer.scene.renderError && typeof viewer.scene.renderError.addEventListener === 'function') {
            const onRenderError = (error) => {
              // 检查是否是真正的 RenderError（而非 Scene 对象被误传）
              const isRealError = error instanceof Cesium.RuntimeError;
              if (!isRealError) return; // 忽略非错误事件

              this._isWebGLLost = true;
              // 清除错误标记，防止后续 showErrorPanel 调用
              if (viewer._renderError) viewer._renderError = undefined;
              if (viewer.scene._renderError) viewer.scene._renderError = undefined;

              console.error(`[${this.componentName}] 🔴 渲染错误:`, error?.message || error);
              // 不要 requestRender — 让 Cesium 自然停止渲染循环
              // 避免在损坏的 WebGL 上下文中反复尝试编译 shader
            };
            viewer.scene.renderError.addEventListener(onRenderError);
            this._renderErrorListener = onRenderError;
          }

          console.log(`[${this.componentName}] 🛡️ 渲染错误拦截已启用`);
        }

        // 3. WebGL 上下文丢失监听
        const canvas = viewer.canvas || viewer.scene?.canvas;
        if (canvas && !this._webglListenerSet) {
          this._webglListenerSet = true;

          const onContextLost = (event) => {
            event?.preventDefault?.();
            this._isWebGLLost = true;

            console.warn(`[${this.componentName}] 🔴 WebGL 上下文丢失，清理所有 GPU 资源...`);

            // 彻底清理：移除所有图层和 primitive
            this.destroyAllCesiumLayers();
            this.loadedLayerIds = {};
            if (viewer.scene && !viewer.scene.isDestroyed()) {
              viewer.scene.primitives.removeAll();
            }

            // ⚠️ 关键：停止 Cesium 渲染循环，防止在无上下文时编译 shader
            if (viewer.useDefaultRenderLoop !== false) {
              viewer.useDefaultRenderLoop = false;
              this._wasDefaultRenderLoop = true;
            }

            console.warn(`[${this.componentName}] ⚠️ 渲染循环已停止，请刷新页面恢复 WebGL 上下文`);
          };

          const onContextRestored = () => {
            this._isWebGLLost = false;
            console.log(`[${this.componentName}] ✅ WebGL 上下文已恢复，重新启用渲染`);
            if (this._wasDefaultRenderLoop) {
              viewer.useDefaultRenderLoop = true;
            }
          };

          canvas.addEventListener('webglcontextlost', onContextLost);
          canvas.addEventListener('webglcontextrestored', onContextRestored);

          this._cesiumEventHandlers.push(
            { target: canvas, event: 'webglcontextlost', handler: onContextLost },
            { target: canvas, event: 'webglcontextrestored', handler: onContextRestored }
          );

          console.log(`[${this.componentName}] 🛡️ WebGL 上下文监听已启用`);
        }

        // 4. 地图移动节流 — 移动中暂停新瓦片加载，移动结束后恢复
        if (viewer.camera && !this._cameraMoveHandlerSet) {
          this._cameraMoveHandlerSet = true;
          let moveTimeout = null;
          let wasThrottled = false;

          viewer.camera.moveStart.addEventListener(() => {
            // 移动开始：提高请求优先级阈值，暂停低优先级请求
            if (Cesium.RequestScheduler) {
              Cesium.RequestScheduler.maximumRequests = 2;         // 移动中降到 2 个
              Cesium.RequestScheduler.maximumRequestsPerServer = 1; // 每服务 1 个
              wasThrottled = true;
            }
          });

          viewer.camera.moveEnd.addEventListener(() => {
            // 移动结束：延迟 500ms 后恢复请求限制（防止连续移动时频繁切换）
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
              if (Cesium.RequestScheduler) {
                Cesium.RequestScheduler.maximumRequests = 8;
                Cesium.RequestScheduler.maximumRequestsPerServer = 4;
              }
              wasThrottled = false;
            }, 500);
          });

          this._cameraMoveCleanup = () => {
            clearTimeout(moveTimeout);
            // Note: Cesium Event removeEventListener 语法不同
          };

          console.log(`[${this.componentName}] 🛡️ 相机移动节流已启用`);
        }

        console.log(`[${this.componentName}] 🛡️ Cesium 资源保护全部就绪`);
      };

      // 延迟 500ms 首试（给 Cesium 初始化时间）
      setTimeout(trySetup, 500);
    },

    /**
     * 移除 Cesium 事件监听器
     */
    _teardownCesiumProtections() {
      // 清理 WebGL 事件监听
      this._cesiumEventHandlers.forEach(({ target, event, handler }) => {
        try {
          if (event === 'removeEventListener') {
            target.removeEventListener(handler);
          } else {
            target.removeEventListener(event, handler);
          }
        } catch (e) { /* ignore */ }
      });
      this._cesiumEventHandlers = [];

      // 恢复 showErrorPanel
      const viewer = this.getViewer();
      if (viewer && this._origShowErrorPanel) {
        viewer.showErrorPanel = this._origShowErrorPanel;
        this._origShowErrorPanel = null;
      }

      // 清理 renderError 监听器
      if (viewer && viewer.scene && viewer.scene.renderError && this._renderErrorListener) {
        try {
          viewer.scene.renderError.removeEventListener(this._renderErrorListener);
        } catch (e) { /* ignore */ }
        this._renderErrorListener = null;
      }

      // 清理相机移动节流 + 恢复请求调度器默认值
      if (this._cameraMoveCleanup) {
        try { this._cameraMoveCleanup(); } catch (e) { /* ignore */ }
        this._cameraMoveCleanup = null;
      }
      const Cesium = this.getCesium();
      if (Cesium && Cesium.RequestScheduler) {
        Cesium.RequestScheduler.maximumRequests = 12;         // 恢复 Cesium 默认值
        Cesium.RequestScheduler.maximumRequestsPerServer = 6;
      }
      // 恢复渲染循环
      if (viewer && this._wasDefaultRenderLoop) {
        viewer.useDefaultRenderLoop = true;
      }

      this._renderErrorHandlerSet = false;
      this._webglListenerSet = false;
      this._cameraMoveHandlerSet = false;

      console.log(`[${this.componentName}] 🧹 Cesium 事件监听已清理`);
    },

    /**
     * 记录图层加载顺序（最新的在末尾）
     */
    _addToLoadOrder(nodeId) {
      this._removeFromLoadOrder(nodeId);
      this._layerLoadOrder.push(nodeId);
      // 防止无限增长
      if (this._layerLoadOrder.length > 100) {
        this._layerLoadOrder = this._layerLoadOrder.slice(-50);
      }
    },

    /**
     * 从加载顺序中移除
     */
    _removeFromLoadOrder(nodeId) {
      const idx = this._layerLoadOrder.indexOf(nodeId);
      if (idx !== -1) {
        this._layerLoadOrder.splice(idx, 1);
      }
    },

    /**
     * 检测图层类型（基于 URL 模式 + 父节点层级）
     */
    detectLayerType(node) {
      // ⭐ 动态来源检测（优先级最高）
      if (node._dynamicSource === 'GeoJsonLayerManager') return 'geojson';

      const url = (node.url || '').toLowerCase();
      // 从父级/祖先判断类型
      const ancestors = this.getAncestorChain(node.id);
      const ancestorNames = ancestors.map(a => a.name.toLowerCase()).join(' ');

      // ⚠️ MVT 必须优先于 XYZ 检测：.pbf/.mvt 文件也包含 {z}/{x}/{y} 模式
      if (url.includes('.pbf') || url.includes('.mvt') || ancestorNames.includes('mvt')) return 'mvt';
      if (url.includes('wmts') || url.includes('wmtscapabilities') || ancestorNames.includes('wmts')) return 'wmts';
      if (url.includes('wms') && url.includes('service=wms')) return 'wms';
      // WFS 检测：适配多种 WFS URL 模式
      // 1. 标准 OGC WFS: ?service=wfs
      // 2. ArcGIS REST WFS: /WFSServer
      // 3. 路径型 WFS: /wfs/ 或 /wfs?
      // 4. 父目录标记为 WFS
      if (url.includes('wfs') && url.includes('service=wfs')) return 'wfs';
      if (url.includes('/wfsserver') || url.includes('/wfs/') || url.includes('/wfs?') || ancestorNames.includes('wfs')) return 'wfs';
      if (url.includes('tileset.json') || ancestorNames.includes('3d tiles')) return '3dtiles';
      if (url.includes('{z}/{x}/{y}') || url.includes('{z}/{y}/{x}')) return 'xyz';
      if (url.includes('geojson') || url.endsWith('.json')) return 'geojson';
      // ⭐ 地理编码：天地图API 或 父目录标识
      if (url.includes('api.tianditu.gov.cn/search') || url.includes('api.tianditu.gov.cn/geocoding') || ancestorNames.includes('geocode') || ancestorNames.includes('地理编码')) return 'geocoding';
      // ⭐ WCS：URL含 wcs 或 父目录标识
      // ⭐ 本地 Cesium Terrain tiles（通过 layer.json 目录加载，非 .tif 文件）
      if (url.includes('/terrain/') && !url.endsWith('.tif') && !url.endsWith('.tiff')) return 'local-terrain-tiles';
      // ⭐ 本地 DEM GeoTIFF 文件 terrain 模式（必须在 .tif 检测之前）
      if ((url.endsWith('.tif') || url.endsWith('.tiff')) && node.demRenderMode === 'terrain') return 'local-terrain';
      // ⭐ 本地 DEM GeoTIFF 文件：.tif/.tiff 后缀 或 父目录为 local-dem
      if (url.endsWith('.tif') || url.endsWith('.tiff') || ancestorNames.includes('local-dem') || ancestorNames.includes('dem')) return 'local-dem';
      if (url.includes('wcs') || ancestorNames.includes('wcs')) return 'wcs';
      // 防止将非 OGC 服务 URL（HTML页面、图片等）误判为 WMS
      // 只有当 URL 包含明显的 OGC 服务特征时才继承祖先类型
      const looksLikeOgc = (
        url.includes('service=') ||
        url.includes('request=') ||
        url.includes('getcapabilities') ||
        url.includes('wmsserver') ||
        url.includes('wfs') ||
        url.includes('wmts')
      );
      // 默认根据祖先判断
      if (ancestorNames.includes('xyz') || ancestorNames.includes('tms')) return 'xyz';
      if (ancestorNames.includes('wms') && !url.endsWith('.html') && !url.endsWith('.htm') && looksLikeOgc) return 'wms';
      if (ancestorNames.includes('wms') && (url.endsWith('.html') || url.endsWith('.htm') || !looksLikeOgc)) {
        console.warn(`[detectLayerType] ⚠️ URL "${node.url}" 不像是 OGC 服务，无法按 WMS 处理，回退为 XYZ`);
      }
      return 'xyz'; // 默认按 XYZ 瓦片处理
    },

    /**
     * 获取指定类型的图层数量上限
     */
    _getTypeLimit(layerType) {
      return this._layerTypeLimits[layerType] || 8;
    },

    /**
     * 获取指定类型的活跃图层数（show !== false）
     */
    _getActiveCount(layerType) {
      let count = 0;
      this._cesiumLayers.forEach((entry) => {
        if (entry.type === layerType && entry.object && entry.object.show !== false) {
          count++;
        }
      });
      return count;
    },

    /**
     * 获取节点的祖先链
     */
    getAncestorChain(nodeId) {
      const chain = [];
      let currentId = nodeId;
      const visited = new Set();
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const node = this.flatNodeList.find(n => n.id === currentId);
        if (node && node.parentId) {
          const parent = this.flatNodeList.find(n => n.id === node.parentId);
          if (parent) {
            chain.push(parent);
            currentId = parent.id;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      return chain;
    },

    /**
     * 切换图层加载状态（勾选/取消勾选）
     * @param {Object} node — 树节点数据
     */
    toggleLayerLoad(node) {
      console.log(
        `[${this.componentName}] 🔄 toggleLayerLoad: "${node.name}"` +
        ` (inMap=${this._cesiumLayers.has(node.id)}, loaded=${!!this.loadedLayerIds[node.id]}, loading=${!!this.loadingLayerIds[node.id]})`
      );

      // WebGL 上下文已丢失，拒绝所有加载操作
      if (this._isWebGLLost) {
        console.warn(`[${this.componentName}] ⚠️ WebGL 上下文已丢失，无法加载图层。请刷新页面。`);
        this.layerErrors[node.id] = {
          message: 'WebGL 上下文已丢失，请刷新页面',
          ...classifyLayerError('WebGL 上下文丢失')
        };
        return;
      }

      // 防抖：正在加载中则忽略点击
      if (this.loadingLayerIds[node.id]) {
        console.warn(`[${this.componentName}] ⏳ 图层 "${node.name}" 正在加载中，忽略重复操作`);
        return;
      }

      // ⭐ 已加载图层：仅切换可见性（show/hide），不删除/重建
      //    避免 WCS 等重型图层每次 toggle 都从服务器重新下载整个 coverage
      if (this._cesiumLayers.has(node.id)) {
        const entry = this._cesiumLayers.get(node.id);
        if (entry && entry.object) {
          const newShow = !entry.object.show;
          entry.object.show = newShow;
          this.loadedLayerIds[node.id] = newShow;
          // ⭐ 手动隐藏/显示时同步休眠队列 + 恢复 alpha
          if (newShow) {
            // 恢复休眠前保存的原始 alpha（WCS 图层通常 0.7，其他 1.0）
            if (entry.object.alpha !== undefined && entry._preHibernateAlpha != null) {
              entry.object.alpha = entry._preHibernateAlpha;
              delete entry._preHibernateAlpha;
            }
            this._removeFromHibernatedOrder(node.id);
            this._addToLoadOrder(node.id);
            delete this.layerErrors[node.id];
          } else {
            this._removeFromLoadOrder(node.id);
            this._removeFromHibernatedOrder(node.id);
            this._hibernatedOrder.push(node.id);
          }
          // 触发渲染刷新
          const viewer = this.getViewer();
          if (viewer && !this._isWebGLLost) {
            viewer.scene.requestRender();
          }
          console.log(
            `[${this.componentName}] 👁️ 图层可见性切换: "${node.name}" → ${newShow ? '显示' : '隐藏'}` +
            ` (type=${entry.type}, 休眠池=${this._hibernatedOrder.length})`
          );
        } else {
          console.warn(`[${this.componentName}] ⚠️ 图层 "${node.name}" 在 _cesiumLayers 中但 object 无效，重新加载`);
          this._cesiumLayers.delete(node.id);
          delete this.layerErrors[node.id];
          this.loadCesiumLayer(node);
        }
      } else {
        // 首次加载：清除错误并加载
        delete this.layerErrors[node.id];
        this.loadCesiumLayer(node);
      }
    },

    /**
     * 🔄 手动重新加载图层
     * - 移除旧图层 → 重新从服务器加载
     * - 失败时恢复旧图层（网络容错）
     * - 加载中忽略重复点击
     */
    async reloadLayerNode(node) {
      console.log(`[${this.componentName}] 🔄 手动重新加载: "${node.name}"`);

      if (this._isWebGLLost) {
        this.layerErrors[node.id] = {
          message: 'WebGL 上下文已丢失，请刷新页面',
          ...classifyLayerError('WebGL 上下文丢失')
        };
        return;
      }

      if (this.loadingLayerIds[node.id]) {
        console.warn(`[${this.componentName}] ⏳ 图层 "${node.name}" 正在加载中，忽略重复操作`);
        return;
      }

      const oldEntry = this._cesiumLayers.get(node.id);
      if (!oldEntry) {
        // 图层不在缓存中，直接加载
        delete this.layerErrors[node.id];
        this.loadCesiumLayer(node);
        return;
      }

      const wasVisible = oldEntry.object && oldEntry.object.show !== false;
      this.loadingLayerIds[node.id] = true;

      try {
        // 步骤1: 移除旧图层（不销毁 GPU 资源）
        const viewer = this.getViewer();
        if (viewer && oldEntry.object) {
          if (oldEntry.type === 'geojson' || oldEntry.type === 'geocoding') {
            if (oldEntry.object.clustering && oldEntry.object.clustering.enabled) {
              try { oldEntry.object.clustering.enabled = false; } catch (e) { /* ignore */ }
            }
            viewer.dataSources.remove(oldEntry.object, false);
          } else if (oldEntry.type === '3dtiles') {
            oldEntry.object.show = false;
            viewer.scene.primitives.remove(oldEntry.object);
          } else {
            // imagery layers: xyz, wms, wmts, mvt, wcs
            oldEntry.object.show = false;
            oldEntry.object.alpha = 0.0;
            viewer.imageryLayers.remove(oldEntry.object, false);
          }
          if (!this._isWebGLLost) viewer.scene.requestRender();
        }

        // 步骤2: 从缓存清除
        this._cesiumLayers.delete(node.id);
        this._removeFromLoadOrder(node.id);
        this._removeFromHibernatedOrder(node.id);
        this.loadedLayerIds[node.id] = false;
        delete this.layerErrors[node.id];

        // 步骤3: 重新加载
        await this.loadCesiumLayer(node);

        // 成功 → 释放旧 blob URL
        if (oldEntry._imageUrl && oldEntry._imageUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(oldEntry._imageUrl); } catch (e) { /* ignore */ }
        }
        console.log(`[${this.componentName}] ✅ 图层重新加载成功: "${node.name}"`);
      } catch (err) {
        // 失败 → 恢复旧图层
        console.warn(`[${this.componentName}] 🔄 重新加载失败，恢复旧图层: "${node.name}"`, err.message);
        const v = this.getViewer();
        if (v && oldEntry && oldEntry.object) {
          try {
            if (oldEntry.type === 'geojson' || oldEntry.type === 'geocoding') {
              v.dataSources.add(oldEntry.object);
            } else if (oldEntry.type === '3dtiles') {
              v.scene.primitives.add(oldEntry.object);
              oldEntry.object.show = wasVisible;
            } else {
              v.imageryLayers.add(oldEntry.object);
              oldEntry.object.show = wasVisible;
              if (oldEntry.object.alpha !== undefined && wasVisible) {
                // 恢复原始 alpha（WCS 图层通常 0.7，从 _preHibernateAlpha 或默认 1.0 恢复）
                oldEntry.object.alpha = (oldEntry._preHibernateAlpha != null) ? oldEntry._preHibernateAlpha : 1.0;
                delete oldEntry._preHibernateAlpha;
              }
            }
            this._cesiumLayers.set(node.id, oldEntry);
            this.loadedLayerIds[node.id] = wasVisible;
            if (wasVisible) {
              this._addToLoadOrder(node.id);
            } else {
              this._hibernatedOrder.push(node.id);
            }
            if (!this._isWebGLLost) v.scene.requestRender();
          } catch (restoreErr) {
            console.error(`[${this.componentName}] ❌ 恢复旧图层也失败了:`, restoreErr);
          }
        }
        this.layerErrors[node.id] = {
          message: `重新加载失败，已保留旧图层: ${err.message || String(err)}`,
          ...classifyLayerError(err.message || String(err))
        };
      } finally {
        this.loadingLayerIds[node.id] = false;
      }
    },

    /**
     * 将图层添加到 Cesium
     * ⚠️ 整体超时保护：15 秒内未完成则自动取消，防止控件卡死
     */
    async loadCesiumLayer(node) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();

      // 前置检查：Cesium 未就绪
      if (!viewer || !Cesium) {
        console.warn(`[${this.componentName}] ⚠️ Cesium 未就绪，无法加载图层`);
        this.layerErrors[node.id] = {
          message: 'Cesium 未就绪，请刷新页面后重试',
          ...classifyLayerError('Cesium 未就绪，请刷新页面后重试')
        };
        return;
      }

      // 前置检查：URL 为空
      if (!node.url) {
        console.warn(`[${this.componentName}] ⚠️ 图层 "${node.name}" URL 为空，跳过加载`);
        this.layerErrors[node.id] = {
          message: '图层 URL 为空',
          ...classifyLayerError('图层 URL 为空')
        };
        return;
      }

      // 前置检查：WebGL 上下文是否可用
      if (this._isWebGLLost) {
        console.warn(`[${this.componentName}] ⚠️ WebGL 已丢失，拒绝加载 "${node.name}"`);
        this.layerErrors[node.id] = {
          message: 'WebGL 上下文已丢失，请刷新页面',
          ...classifyLayerError('WebGL 上下文丢失')
        };
        return;
      }

      // 设置加载中状态
      this.loadingLayerIds[node.id] = true;

      // ⚠️ 加载中状态触发 Vue 重渲染（spinner 插入 DOM），
      // 可能导致浏览器在 reflow 时调整 .function-panel 的 scrollTop，
      // 使 header/toolbar 滚出可视区域。在 nextTick 后立即重置。
      this.$nextTick(function() {
        var el = this.$refs.treeContainer;
        if (el) {
          var panel = el.closest('.function-panel');
          if (panel) {
            panel.scrollTop = 0;
            panel.style.overflowAnchor = 'none';
            var tw = panel.querySelector('.tree-wrapper');
            if (tw) { tw.scrollTop = 0; tw.style.overflowAnchor = 'none'; }
          }
        }
      }.bind(this));

      // ⭐ 图层类型检测（分级驱逐逻辑需要先知道类型）
      const layerType = this.detectLayerType(node);

      // ═══════════════════════════════════════════════════════════
      // 分级图层上限检查：先休眠后卸载，优先淘汰同类型旧图层
      // ═══════════════════════════════════════════════════════════
      const typeLimit = this._getTypeLimit(layerType);
      const activeCount = this._getActiveCount(layerType);

      // A) 同类型超限 → 休眠最旧的活跃图层（隐藏但保留 GPU 资源）
      if (activeCount >= typeLimit) {
        const oldestId = this._layerLoadOrder.find(id => {
          const e = this._cesiumLayers.get(id);
          return e && e.type === layerType && e.object && e.object.show !== false && id !== node.id;
        });
        if (oldestId) {
          const oldNode = this.flatNodeList.find(n => n.id === oldestId);
          if (oldNode) {
            console.warn(`[${this.componentName}] 💤 ${layerType} 已达上限(${typeLimit})，休眠最旧图层: "${oldNode.name}"`);
            this._hibernateLayer(oldNode);
          }
        }
      }

      // B) 休眠池超限 → 真正卸载最旧的休眠图层
      while (this._hibernatedOrder.length > this._maxHibernated) {
        const hid = this._hibernatedOrder[0];
        const hn = this.flatNodeList.find(n => n.id === hid);
        if (hn) {
          console.warn(`[${this.componentName}] 🗑️ 休眠池已满(${this._maxHibernated})，卸载最旧休眠图层: "${hn.name}"`);
          this.unloadCesiumLayer(hn);
        } else {
          this._hibernatedOrder.shift();
        }
      }

      // C) 全局总量超限 → 优先卸载休眠层，无休眠则卸载最旧活跃层
      if (this._cesiumLayers.size >= this._totalMaxLayers) {
        if (this._hibernatedOrder.length > 0) {
          const hid = this._hibernatedOrder[0];
          const hn = this.flatNodeList.find(n => n.id === hid);
          if (hn) {
            console.warn(`[${this.componentName}] 🗑️ 全局图层数已达上限(${this._totalMaxLayers})，卸载休眠图层: "${hn.name}"`);
            this.unloadCesiumLayer(hn);
          }
        } else {
          const oldestId = this._layerLoadOrder.find(id => id !== node.id && this._cesiumLayers.has(id));
          const hn = this.flatNodeList.find(n => n.id === oldestId);
          if (hn) {
            console.warn(`[${this.componentName}] 🗑️ 全局上限(${this._totalMaxLayers})且无休眠层，卸载最旧活跃图层: "${hn.name}"`);
            this.unloadCesiumLayer(hn);
          }
        }
      }

      // 代数计数器：防止超时后 IIFE 仍成功而覆盖错误状态
      const gen = this._loadGeneration.get(node.id) || 0;
      this._loadGeneration.set(node.id, gen);

      console.log(`[${this.componentName}] 🌐 加载图层: ${node.name} (类型: ${layerType})`);

      // 整体超时：可被扩展的 deadline（WCS TIFF 解码等长操作可延长）
      var deadline = Date.now() + 15000;

      // ⭐ WCS 需要更长的初始超时（顺序策略重试 + 每次 30s fetch + TIFF 解码）
      if (layerType === 'wcs') {
        deadline = Math.max(deadline, Date.now() + 90000);
      }

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setInterval(() => {
          if (Date.now() > deadline) {
            clearInterval(timeoutId);
            this._loadGeneration.set(node.id, gen + 1);
            reject(new Error('图层加载超时'));
          }
        }, 2000);
      });

      const actualLoad = (async () => {
        let providerReadyError = false;  // MVT readyPromise 超时标记（需在 switch 外声明以被公共代码访问）
        switch (layerType) {
          case 'xyz': {
            const provider = new Cesium.UrlTemplateImageryProvider({
              url: node.url,
              maximumLevel: 18
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'xyz', object: layer, provider });
            break;
          }
          case 'wms': {
            // 从 URL 中提取 base WMS URL（去除查询参数）
            const baseUrl = node.url.replace(/\?.*$/, '');

            // 从 URL 或配置中确定 WMS 版本
            const urlVersionMatch = node.url.match(/[Vv][Ee][Rr][Ss][Ii][Oo][Nn]=([\d.]+)/);
            const preferredVersion = node.wmsVersion || (urlVersionMatch ? urlVersionMatch[1] : null);

            // ArcGIS Server WMS：WMS 1.3.0 + EPSG:4326 存在 bbox 轴序颠倒问题
            // （规范要求 lat,lon，Cesium 发送 lon,lat），导致返回空图。
            // 强制使用 1.1.1（SRS=EPSG:4326，bbox 为 lon,lat 顺序）
            const isArcgisWms = /\/arcgis\/.*\/MapServer\/WMSServer/i.test(node.url);

            // 获取图层名称：优先使用用户配置，否则自动检测
            let layers = node.wmsLayerName || '';
            let detectedVersion = preferredVersion || '1.1.1';
            let latestTime = node.wmsTime || null; // 用户手动指定的时间优先
            let capInfo = null;

            if (!layers) {
              // 无预设图层名 → 完整检测（图层 + 时间维度）
              console.log(`[${this.componentName}] 🔍 自动检测 WMS 图层: ${node.name}`);
              capInfo = await fetchWmsCapabilitiesInfo(baseUrl, preferredVersion);
              if (capInfo) {
                layers = capInfo.layerName;
                detectedVersion = capInfo.version;
                if (!latestTime) latestTime = capInfo.latestTime;
                console.log(`[${this.componentName}] ✅ 自动检测: layer="${layers}" version=${detectedVersion}` +
                  (latestTime ? ` time=${latestTime}` : ''));
              } else {
                // GetCapabilities 失败时的智能回退
                // 许多 WMS 服务器不开启 CORS，导致 fetch GetCapabilities 被拦截，
                // 但瓦片本身（通过 <img> 标签加载）不受 CORS 限制，可正常渲染。
                // 以下按服务器类型逐级回退确定图层名：

                // 1. ArcGIS Server WMS：图层 0 是空容器层，数据从 1 开始
                const arcgisMatch = baseUrl.match(/\/arcgis\/.*\/MapServer\/WMSServer/i);
                if (arcgisMatch) {
                  layers = '1';
                  console.log(`[${this.componentName}] 🔄 ArcGIS Server 检测到，回退使用图层名 "1"（图层 0 为空容器）`);
                }

                // 2. MapServer WMS（含 /wms/map、/cgi-bin/mapserv 等路径）：
                //    默认图层名通常为 "0"
                if (!layers && /\/wms\/map|\/cgi-bin\/mapserv|mapserv/i.test(baseUrl)) {
                  layers = '0';
                  console.log(`[${this.componentName}] 🔄 MapServer WMS 检测到，回退使用默认图层名 "0"`);
                }

                // 3. 从原始 URL 的 LAYERS 参数提取
                if (!layers) {
                  const urlLayersMatch = node.url.match(/[?&]layers=([^&]+)/i);
                  if (urlLayersMatch) {
                    layers = decodeURIComponent(urlLayersMatch[1]);
                    console.log(`[${this.componentName}] 🔄 从 URL 参数提取图层名: "${layers}"`);
                  }
                }

                // 4. 所有回退均失败
                if (!layers) {
                  throw new Error(
                    'WMS 图层名未知，无法自动检测。请在节点配置中设置 wmsLayerName 字段。\n' +
                    '提示: 直接在浏览器中访问以下 URL 查看可用图层列表：\n' +
                    `  ${baseUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`
                  );
                }
              }
            } else if (!latestTime) {
              // 有图层名但无时间 → 仅检测时间维度（GetCapabilities 可能被 CORS 拦截，降级为警告）
              console.log(`[${this.componentName}] 🔍 已指定图层 "${layers}"，检测时间维度...`);
              try {
                capInfo = await fetchWmsCapabilitiesInfo(baseUrl, preferredVersion);
                if (capInfo && capInfo.latestTime) {
                  latestTime = capInfo.latestTime;
                  if (capInfo.version) detectedVersion = capInfo.version;
                  console.log(`[${this.componentName}] ⏱️ 检测到时间维度: ${latestTime}`);
                }
              } catch (e) {
                console.warn(`[${this.componentName}] ⚠️ 时间维度检测失败（非阻塞）:`, e.message);
              }
            }

            // 构建 WMS 请求参数（参考 forestry-cesium-vue 成功模式）
            const wmsParams = {
              version: detectedVersion,
              transparent: true,
              format: 'image/png'
            };

            // ⚠️ 显式指定 SRS/CRS，统一 bbox 轴序为 lon,lat（与 Cesium 一致）：
            //   - WMS 1.3.0 + EPSG:4326 → bbox 必须是 lat,lon（WMS 规范）→ 轴序颠倒
            //   - WMS 1.3.0 + CRS:84      → bbox 是 lon,lat（与 Cesium 一致）✅
            //   - WMS 1.1.1 + EPSG:4326   → bbox 是 lon,lat（与 Cesium 一致）✅
            if (detectedVersion === '1.3.0') {
              wmsParams.crs = 'CRS:84';
            } else {
              wmsParams.srs = 'EPSG:4326';
            }

            // ⚠️ 时间维度处理
            const isBestComposite = /\/best\//i.test(node.url) || /_best$/i.test(layers);
            if (!isBestComposite && latestTime) {
              // 普通 WMS 层：使用 GetCapabilities 检测到的时间
              wmsParams.TIME = latestTime;
              console.log(`[${this.componentName}] ⏱️ WMS 时间维度: ${latestTime}`);
            } else if (isBestComposite && node.wmsTime) {
              // best 层 + 用户手动指定 → 直接信任
              wmsParams.TIME = node.wmsTime;
              latestTime = node.wmsTime;
              console.log(`[${this.componentName}] ⏱️ best 复合图层：使用用户指定的 TIME=${latestTime}`);
            } else if (isBestComposite) {
              // best 层：GetCapabilities 时间不可靠（理论覆盖 vs 实际瓦片不符），
              // 主动发试探 GetMap 从报错中解析精确有效时间
              console.log(`[${this.componentName}] 🔍 best 复合图层：主动探测有效时间...`);
              try {
                const probeTime = await probeBestLayerValidTime(baseUrl, layers, detectedVersion);
                if (probeTime) {
                  latestTime = probeTime;
                  wmsParams.TIME = latestTime;
                  console.log(`[${this.componentName}] ✅ 探测到有效 TIME: ${latestTime}`);
                } else {
                  console.log(`[${this.componentName}] ⏭️ 探测未获取有效时间，不传 TIME`);
                }
              } catch (e) {
                console.warn(`[${this.componentName}] ⚠️ 时间探测失败:`, e.message);
              }
            }

            // 构建地理范围（参考 forestry-cesium-vue 的 rectangle 参数）
            let rectangle;
            if (node.centerLon != null && node.centerLat != null && node.centerHeight) {
              const halfDeg = (node.centerHeight / 111000) * 0.5;
              rectangle = Cesium.Rectangle.fromDegrees(
                node.centerLon - halfDeg,
                node.centerLat - halfDeg,
                node.centerLon + halfDeg,
                node.centerLat + halfDeg
              );
            }

            // 构建 Cesium WMS Provider（参考 forestry-cesium-vue 成功模式）
            const providerOpts = {
              url: baseUrl,
              layers: layers,
              parameters: wmsParams,
              enablePickFeatures: false // WMS 图层默认不可选（避免每像素拾取请求）
            };
            if (rectangle) {
              providerOpts.rectangle = rectangle;
            }
            const provider = new Cesium.WebMapServiceImageryProvider(providerOpts);
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, {
              type: 'wms',
              object: layer,
              provider,
              _detectedLayer: layers,
              _wmsVersion: detectedVersion,
              _wmsTime: latestTime
            });
            console.log(`[${this.componentName}] ✅ WMS 图层加载成功: ${node.name} (layer="${layers}", version=${detectedVersion})`);
            break;
          }
          case 'wmts': {
            // WMTS — 参考 forestry-cesium-vue 成功模式
            const wmtsUrl = node.url;

            // KVP GetCapabilities URL 的处理：
            // Cesium WebMapTileServiceImageryProvider 会保留原始 query params
            // 并追加瓦片参数，导致 URL 中同时出现 request=GetTile 和
            // REQUEST=GetCapabilities（双重参数冲突）。
            // 因此：自动检测使用完整 URL，传给 Cesium 时只去掉 GetCapabilities
            // 专属参数（保留 tk、token、key 等业务参数）
            const isKvpCaps = /[?&]request=getcapabilities/i.test(wmtsUrl);
            let wmtsResourceUrl = wmtsUrl;
            if (isKvpCaps) {
              const qIdx = wmtsUrl.indexOf('?');
              const base = qIdx >= 0 ? wmtsUrl.slice(0, qIdx) : wmtsUrl;
              const params = (qIdx >= 0 ? wmtsUrl.slice(qIdx + 1) : '')
                .split('&')
                .filter(p => {
                  const k = p.split('=')[0].toLowerCase();
                  return k !== 'service' && k !== 'request' && k !== 'version';
                });
              wmtsResourceUrl = params.length > 0
                ? `${base}?${params.join('&')}`
                : base;
            }

            // 检测投影：根据 tileMatrixSetID 决定 tilingScheme
            const tmSetId = node.wmtsTileMatrixSet || 'EPSG:4326';
            const isGeographic = /4326|CRS:84|WGS84/i.test(tmSetId);
            const tilingScheme = isGeographic
              ? new Cesium.GeographicTilingScheme()
              : new Cesium.WebMercatorTilingScheme();

            // 确定图层名：优先使用用户配置，否则尝试自动检测
            let wmtsLayer = node.wmtsLayerName || node.wmsLayerName || '';
            if (!wmtsLayer) {
              console.log(`[${this.componentName}] 🔍 自动检测 WMTS 图层: ${node.name}`);

              // 1. 从 URL query 参数提取（如 ?layer=xxx）
              const qLayerMatch = wmtsUrl.match(/[?&]layer=([^&]+)/i);
              if (qLayerMatch) {
                wmtsLayer = decodeURIComponent(qLayerMatch[1]);
                console.log(`[${this.componentName}] 🔄 从 URL 参数提取 WMTS 图层名: "${wmtsLayer}"`);
              }

              // 2. 从 GetCapabilities XML 提取 <Identifier>
              if (!wmtsLayer) {
                try {
                  const capXml = await fetch(wmtsUrl, {
                    mode: 'cors',
                    signal: createTimeoutSignal(5000)
                  }).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)));
                  // WMTS 使用 <ows:Identifier> 作为图层机器标识符
                  const idMatch = capXml.match(/<ows:Identifier[^>]*>([^<]+)<\/ows:Identifier>/i)
                               || capXml.match(/<Identifier[^>]*>([^<]+)<\/Identifier>/i);
                  if (idMatch) {
                    wmtsLayer = idMatch[1].trim();
                    console.log(`[${this.componentName}] ✅ 从 GetCapabilities 检测到 WMTS 图层: "${wmtsLayer}"`);
                  }
                } catch (e) {
                  console.warn(`[${this.componentName}] ⚠️ WMTS GetCapabilities 检测失败（非阻塞）:`, e.message);
                }
              }

              // 3. 回退：从 URL 路径中提取（排除版本号、服务名等非图层段）
              if (!wmtsLayer) {
                const nonLayerPattern = /^(v?\d+([._-]\d+)*|wmts?|gwc|services?|best|default|tiles?|maps?server|features?server|epsg\d+|crs\d+|wgs\d+|arcgis|rest)$/i;
                const pathParts = wmtsUrl.replace(/\?.*$/, '')
                  .split('/')
                  .filter(p => p && !/\.(xml|php|cgi|html?)$/i.test(p) && !nonLayerPattern.test(p));
                wmtsLayer = pathParts[pathParts.length - 1] || '';
                if (wmtsLayer && wmtsLayer.length < 50) {
                  console.log(`[${this.componentName}] 🔄 从 URL 路径回退 WMTS 图层名: "${wmtsLayer}"`);
                }
              }
              // 4. 最终回退：如果实在无法确定图层名，对 Capabilities XML 类型的 URL
              //    传空字符串让 Cesium 自动从 Capabilities 解析
              if (!wmtsLayer && /wmtscapabilities|getcapabilities|request=getcapabilities/i.test(wmtsUrl)) {
                console.log(`[${this.componentName}] 🔄 WMTS Capabilities URL 检测到，留空图层名交由 Cesium 自动解析`);
                // wmtsLayer 保持空字符串，Cesium 将自动从 Capabilities XML 发现图层
              }
            }

            const provider = new Cesium.WebMapTileServiceImageryProvider({
              url: wmtsResourceUrl,
              layer: wmtsLayer,
              style: node.wmtsStyle || '',
              format: node.wmtsFormat || 'image/png',
              tileMatrixSetID: tmSetId,
              tilingScheme: tilingScheme
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, {
              type: 'wmts',
              object: layer,
              provider,
              _wmtsLayer: wmtsLayer,
              _wmtsTileMatrixSet: tmSetId,
              _wmtsTilingScheme: isGeographic ? 'geographic' : 'webmercator'
            });
            console.log(`[${this.componentName}] ✅ WMTS 图层加载成功: ${node.name} (layer="${wmtsLayer}", tileMatrixSet=${tmSetId})`);
            break;
          }
          case 'wfs':
          case 'geojson': {
            // ⏱️ 性能诊断：记录各阶段耗时
            const _tStart = performance.now();
            const _timings = {};  // { step: ms }

            // ⚠️ WFS/GeoJSON 加载重构：WFS 服务器通常不配置 CORS 响应头，
            // Cesium.GeoJsonDataSource.load(url) 内部用 fetch 强制 CORS 模式，
            // 导致浏览器拦截返回 RequestErrorEvent{statusCode:undefined}。
            // 解决：手动预取数据（带 CORS 代理回退），传入 GeoJSON 对象而非 URL。
            const WFS_FETCH_TIMEOUT = 15000;       // 直接请求超时增至 15s
            const PROXY_FETCH_TIMEOUT = 30000;     // 代理请求超时增至 30s（大文件需要更久）

            /**
             * 尝试从 URL 获取 JSON 数据，失败时通过 CORS 代理重试
             * @param {string} directUrl - 原始 URL
             * @returns {Promise<Object>} 解析后的 JSON 对象
             */
            const fetchJsonWithCorsFallback = async (directUrl) => {
              // 第一步：直接 fetch（部分 WFS 服务器支持 CORS，且浏览器环境可能已有代理）
              const _tfDirect = performance.now();
              try {
                console.log(`[${this.componentName}] 🔍 直接请求 GeoJSON: ${directUrl.slice(0, 120)}...`);
                const resp = await fetch(directUrl, {
                  signal: createTimeoutSignal(WFS_FETCH_TIMEOUT)
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                console.log(`[${this.componentName}] ✅ 直接请求成功 (${(performance.now() - _tfDirect).toFixed(0)}ms)`);
                return data;
              } catch (directErr) {
                const errMsg = directErr.message || String(directErr);
                console.warn(`[${this.componentName}] ⚠️ 直接请求失败 (${(performance.now() - _tfDirect).toFixed(0)}ms): ${errMsg}，尝试 CORS 代理...`);
              }

              // 第二步：通过代理依次重试（按优先级：本地后端 → 自建代理 → 公网代理）
              //   本地后端 — 同机/同网段，无 CORS 限制，速度最快
              //   自建代理 — 用户在节点配置中设置 wfsProxyUrl
              //   corsproxy.io / allorigins.win / codecoolware — 公网 CORS 代理（最后手段）
              const corsProxies = [];

              // ⭐ 本地后端代理（最高优先级，比公网代理快 10-100 倍）
              const localProxyBase = `http://${window.location.hostname}:${new URL(window.location.href).port || '8081'}`;
              corsProxies.push({
                name: '本地后端',
                url: `${localProxyBase}/api/proxy/wfs?url=${encodeURIComponent(directUrl)}`
              });

              // 自建代理（用户配置的 wfsProxyUrl）
              if (node.wfsProxyUrl) {
                corsProxies.push({
                  name: '自建代理',
                  url: node.wfsProxyUrl + encodeURIComponent(directUrl)
                });
              }

              // 公网 CORS 代理（最后手段，速度慢、不稳定）
              corsProxies.push(
                { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(directUrl)}` },
                { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}` },
                { name: 'codecoolware', url: `https://api.codecoolware.com/cors?url=${encodeURIComponent(directUrl)}` }
              );

              for (const proxy of corsProxies) {
                const _tfProxy = performance.now();
                try {
                  console.log(`[${this.componentName}] 🔄 通过 ${proxy.name} 代理请求: ${proxy.url.slice(0, 120)}...`);
                  const resp = await fetch(proxy.url, {
                    signal: createTimeoutSignal(PROXY_FETCH_TIMEOUT)
                  });
                  if (!resp.ok) throw new Error(`${proxy.name} 返回 HTTP ${resp.status}`);
                  const raw = await resp.json();
                  // 本地后端代理返回 {success, data} 包装，公网代理直接返回 GeoJSON
                  const isWrapped = raw && raw.success === true && raw.data;
                  const data = isWrapped ? raw.data : raw;
                  console.log(`[${this.componentName}] ✅ ${proxy.name} 代理请求成功 (${(performance.now() - _tfProxy).toFixed(0)}ms, ${isWrapped ? '已解包' : '直传'})`);
                  return data;
                } catch (proxyErr) {
                  const errMsg = proxyErr.message || String(proxyErr);
                  console.warn(`[${this.componentName}] ⚠️ ${proxy.name} 代理失败 (${(performance.now() - _tfProxy).toFixed(0)}ms):`, errMsg);
                }
              }

              throw new Error(
                'WFS/GeoJSON 服务无法访问：直接请求被 CORS 拦截，所有 CORS 代理也失败。\n' +
                '建议：1) 检查网络连接 2) 在节点配置中设置 wfsProxyUrl 使用自建代理\n' +
                `目标 URL: ${directUrl.slice(0, 100)}`
              );
            };

            // ⭐ 动态本地图层：按需解析 GeoJSON（不常驻缓存，解析后立即释放）
            let geojsonData;
            let dynamicLayerConfig = null;  // 保存完整 layer config，供 pinField/sizeField 使用
            if (node._dynamicSource === 'GeoJsonLayerManager') {
              const cacheKey = node._dynamicGeojsonId || node.id;
              const meta = this._localGeoJsonMeta.get(cacheKey);
              dynamicLayerConfig = meta ? meta.config : null;  // 保存完整配置供后续 pinField 使用
              if (!meta || !meta.rawGeoJson) {
                throw new Error(`本地 GeoJSON 缓存未命中: ${cacheKey}。请刷新面板重新加载。`);
              }
              // ⚠️ 按需解析 — 仅在加载图层时 JSON.parse，用完不保留引用（允许 GC）
              try {
                geojsonData = JSON.parse(meta.rawGeoJson);
              } catch (e) {
                throw new Error(`本地 GeoJSON 数据解析失败: ${e.message}`);
              }
              // 回填样式（如果节点上没有 geoJsonStyle，从缓存元数据补充）
              if (meta.config && !node.geoJsonStyle) {
                node.geoJsonStyle = {
                  fill: meta.config.fillColor || '#FFFF00',
                  fillOpacity: meta.config.fillOpacity != null ? meta.config.fillOpacity : 0.5,
                  stroke: meta.config.strokeColor || '#FF0000',
                  strokeWidth: meta.config.strokeWidth != null ? meta.config.strokeWidth : 2,
                  outlineColor: meta.config.strokeColor || '#FF0000',
                  outlineWidth: meta.config.strokeWidth != null ? meta.config.strokeWidth : 2,
                  markerColor: meta.config.markerColor || '#4169E1',
                  markerSize: meta.config.markerSize != null ? meta.config.markerSize : 48,
                  markerIcon: meta.config.markerIcon || ''
                };
              }
              console.log(`[${this.componentName}] 📦 按需解析本地 GeoJSON: "${node.name}"`);
            } else {
              // 获取 GeoJSON 数据（手动 fetch + CORS 代理回退，绕过 Cesium 内部 fetch 的 CORS 限制）
              const _tFetch = performance.now();
              geojsonData = await fetchJsonWithCorsFallback(node.url);
              _timings['获取数据(网络)'] = (performance.now() - _tFetch).toFixed(0) + 'ms';
            }

            _timings['总计(含fetch)'] = (performance.now() - _tStart).toFixed(0) + 'ms';

            // 基本格式校验
            if (!geojsonData || (geojsonData.type !== 'FeatureCollection' && !geojsonData.type)) {
              throw new Error(layerType === 'wfs'
                ? `WFS 返回数据无效：${geojsonData ? 'type=' + geojsonData.type : '空响应'}（非 GeoJSON FeatureCollection）`
                : 'GeoJSON 数据为空或格式无效');
            }
            const rawFeatureCount = geojsonData.features ? geojsonData.features.length : 0;
            if (rawFeatureCount === 0) {
              throw new Error(layerType === 'wfs'
                ? 'WFS 服务返回 0 个要素（可能 TYPENAMES 不存在或无数据）'
                : 'GeoJSON 文件包含 0 个要素');
            }
            console.log(`[${this.componentName}] 📦 获取到 ${rawFeatureCount} 个要素，传入 Cesium...`);

            // ⚠️ 关键：传入 GeoJSON 对象（非 URL），绕过 Cesium 内部 fetch 的 CORS 限制
            // 样式优先级: 动态 geoJsonStyle > 旧 wfsStyle（兼容） > 默认值
            const s = node.geoJsonStyle || node.wfsStyle || {};
            const stroke   = Cesium.Color.fromCssColorString(s.stroke   || '#FF6600');
            const fill     = Cesium.Color.fromCssColorString(s.fill     || '#FF6600').withAlpha(s.fillOpacity ?? 0.5);
            const outlineC = Cesium.Color.fromCssColorString(s.outlineColor || '#FF3300');
            const markerC  = Cesium.Color.fromCssColorString(s.markerColor  || '#FF4400');

            // ⭐ markerSymbol 策略（与 GeoJsonLayerManager 保持一致）
            //   空/未设置 → fromColor() 渐变圆点（性能最优）
            //   单 ASCII 字符 → fromText() PinBuilder 原生文字标记
            //   emoji/SVG → 传入 markerSymbol 由 Cesium 处理
            const markerIcon = s.markerIcon || '';
            const isSingleAscii = markerIcon.length === 1;
            const markerSymbol = isSingleAscii ? markerIcon : undefined;

            const _tCesiumLoad = performance.now();
            const dataSource = await Cesium.GeoJsonDataSource.load(geojsonData, {
              stroke: stroke,
              strokeWidth: s.strokeWidth ?? 3,
              fill: fill,
              markerColor: markerC,
              markerSize: s.markerSize ?? 48,
              markerSymbol: markerSymbol
            });
            _timings['Cesium实体创建'] = (performance.now() - _tCesiumLoad).toFixed(0) + 'ms';

            // 后处理：分面/线设置样式和 clampToGround
            const ents = dataSource.entities.values;
            for (let i = 0; i < ents.length; i++) {
              const e = ents[i];
              if (e.polygon) {
                // 面要素：不使用 clampToGround（会变成 GroundPrimitive，outline 无效）
                e.polygon.material = fill;
                e.polygon.outline = new Cesium.ConstantProperty(true);
                e.polygon.outlineColor = new Cesium.ConstantProperty(outlineC);
                e.polygon.outlineWidth = new Cesium.ConstantProperty(s.outlineWidth ?? 2);
              }
              if (e.polyline && !e.polygon) {
                // 线要素：直接赋值 Color（不用 ConstantProperty，
                //         GroundPolylinePrimitive 不兼容 ConstantProperty<Color>）
                e.polyline.material = stroke;
                e.polyline.width = s.strokeWidth ?? 3;
              }
            }
            console.log(`[${this.componentName}] 🎨 后处理样式完成: ${ents.length} 个实体`);
            _timings['后处理样式'] = (performance.now() - _tCesiumLoad - parseFloat(_timings['Cesium实体创建'])).toFixed(0) + 'ms';

            // ⭐ emoji/SVG 图标后处理（与 GeoJsonLayerManager 逻辑一致）
            //   单 ASCII 已通过 markerSymbol 传递给 Cesium，emoji 需要 canvas 绘制到 billboard
            if (markerIcon && markerIcon.length > 1) {
              var cSize = 64;
              var sharedPinCanvas = document.createElement('canvas');
              sharedPinCanvas.width = cSize;
              sharedPinCanvas.height = cSize;
              var ctx = sharedPinCanvas.getContext('2d');
              ctx.font = (cSize * 0.6) + 'px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(markerIcon, cSize / 2, cSize / 2 + 2);
              var bScale = ((s.markerSize || 48) / 64) * 1.2;
              for (var ei = 0; ei < ents.length; ei++) {
                var ent = ents[ei];
                if (ent.billboard) {
                  ent.billboard.image = sharedPinCanvas;
                  ent.billboard.scale = bScale;
                  ent.billboard.color = Cesium.Color.WHITE;
                  ent.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                }
              }
              console.log(`[${this.componentName}] 🎨 emoji 图标已应用: "${markerIcon}" → ${ents.length} 个实体`);
            }

            const entityCount = dataSource.entities.values.length;
            if (entityCount === 0) {
              throw new Error(layerType === 'wfs'
                ? `WFS 要素解析失败：${rawFeatureCount} 个要素无法加载到 Cesium（可能几何类型不兼容）`
                : `GeoJSON 解析失败：${rawFeatureCount} 个要素无法加载到 Cesium`);
            }
            viewer.dataSources.add(dataSource);
            dataSource.name = node.name;

            // ⭐ pinField：在气泡上叠加 Cesium Label 显示字段值
            const layerCfg = dynamicLayerConfig || {};
            const _tPinField = performance.now();
            if (layerCfg.pinField && ents.length > 0) {
              const pinField = layerCfg.pinField;
              const pinFontSize = layerCfg.pinFontSize || 18;
              const pinTextColor = layerCfg.pinTextColor || '#FFFFFF';

              // 预创建一个测量 canvas（所有实体复用）
              const measureCanvas = document.createElement('canvas');
              const measureCtx = measureCanvas.getContext('2d');

              for (let pi = 0; pi < ents.length; pi++) {
                try {
                  const ent = ents[pi];
                  const props = ent.properties ? (ent.properties.getValue ? ent.properties.getValue() : ent.properties) : null;
                  const pinText = props ? String(props[pinField] || '') : '';
                  if (!pinText) continue;

                  // canvas 实测文字宽度，精确计算气泡所需大小
                  if (ent.billboard && ent.billboard.image) {
                    const bImg = ent.billboard.image;
                    const bw = bImg.width || 64;
                    measureCtx.font = 'bold ' + pinFontSize + 'px sans-serif';
                    const actualTextW = measureCtx.measureText(pinText).width;
                    const minBubbleW = actualTextW + pinFontSize; // 文字宽 + 1 字间距
                    if (minBubbleW > bw) {
                      ent.billboard.scale = Math.min(minBubbleW / bw, 5.0);
                    }
                  }

                  ent.label = new Cesium.LabelGraphics({
                    text: pinText,
                    font: 'bold ' + pinFontSize + 'px sans-serif',
                    fillColor: Cesium.Color.fromCssColorString(pinTextColor),
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    pixelOffset: new Cesium.Cartesian2(0, (layerCfg.pinPixelOffsetY != null ? layerCfg.pinPixelOffsetY : 30)),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scale: 1.0,
                    eyeOffset: new Cesium.Cartesian3(0, 0, -50)
                  });
                } catch (e) { /* skip */ }
              }
              viewer.scene.requestRender();
              console.log(`[${this.componentName}] 📌 pinField="${pinField}": ${ents.length} 个实体已添加 Label`);
            }
            _timings['pinField标签'] = (performance.now() - _tPinField).toFixed(0) + 'ms';

            // ⭐ 点聚类支持（复用 GeoJsonLayerManager 逻辑）
            const _tCluster = performance.now();
            if (node.clusterEnabled && entityCount > 0) {
              var cluster = dataSource.clustering;
              cluster.pixelRange = node.clusterPixelRange || 80;
              cluster.minimumClusterSize = node.clusterMinSize || 2;
              if (cluster.clusterEvent && cluster.clusterEvent.addEventListener) {
                cluster.clusterEvent.addEventListener(function (clusteredEntities, clusterEntity) {
                  var count = clusteredEntities.length;
                  var size = count < 10 ? 44 : count < 100 ? 52 : 60;
                  var canvas = document.createElement('canvas');
                  canvas.width = size; canvas.height = size;
                  var ctx = canvas.getContext('2d');
                  var cx = size / 2, cy = size / 2, r = size / 2 - 2;
                  var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                  grad.addColorStop(0, '#FF6B35');
                  grad.addColorStop(1, '#CC3300');
                  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                  ctx.fillStyle = grad; ctx.fill();
                  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                  ctx.beginPath(); ctx.moveTo(cx - 6, cy + r - 4);
                  ctx.lineTo(cx, cy + r + 6); ctx.lineTo(cx + 6, cy + r - 4);
                  ctx.fillStyle = '#CC3300'; ctx.fill();
                  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                  ctx.fillStyle = '#fff'; ctx.font = 'bold ' + (size * 0.4) + 'px sans-serif';
                  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                  ctx.fillText(count.toString(), cx, cy - 2);
                  clusterEntity.billboard.show = true;
                  clusterEntity.billboard.image = canvas;
                  clusterEntity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                  clusterEntity.label.show = false;
                });
              }
              cluster.enabled = true;
              ents.forEach(function (e) { e.clusterShow = true; });
              console.log(`[${this.componentName}] 🔵 点聚类已启用: pixelRange=${cluster.pixelRange}, minSize=${cluster.minimumClusterSize}`);
            }
            _timings['点聚类'] = (performance.now() - _tCluster).toFixed(0) + 'ms';

            this._cesiumLayers.set(node.id, { type: 'geojson', object: dataSource });
            // ⭐ 注册实体拾取（选中高亮 + 属性弹窗）
            this._registerEntityPicking(node, dataSource);

            // ⏱️ 性能诊断总览
            _timings['总计(全部)'] = (performance.now() - _tStart).toFixed(0) + 'ms';
            const timingSummary = Object.entries(_timings)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ');
            console.log(
              `[${this.componentName}] ⏱️ [性能] "${node.name}" (${layerType}, ${entityCount}要素) → ${timingSummary}`
            );

            console.log(`[${this.componentName}] ✅ ${layerType.toUpperCase()} 加载成功: ${entityCount} 个要素`);
            break;
          }
          case '3dtiles': {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(node.url, {
              maximumScreenSpaceError: 16,
              maximumMemoryUsage: 1024
            });
            viewer.scene.primitives.add(tileset);
            await tileset.readyPromise;
            this._cesiumLayers.set(node.id, { type: '3dtiles', object: tileset });
            break;
          }
          case 'mvt': {
            console.log(`[${this.componentName}] 📦 开始加载 MVT 矢量瓦片: ${node.name}`);
            console.log(`[${this.componentName}] 🔗 瓦片URL模板: ${node.url}`);
            console.log(`[${this.componentName}] 🏷️  节点ID: ${node.id}`);

            // 1. 确定要渲染的源图层（带 8 秒总超时）
            let sourceLayers = [];
            let detectedDataZoom = 0;  // 实际检测到数据的 zoom 级别
            let detectedTileX = null;  // 检测到的瓦片坐标（用于定位飞行）
            let detectedTileY = null;
            const userSpecified = node.mvtSourceLayers || '';
            if (userSpecified.trim()) {
              sourceLayers = userSpecified.split(',').map(s => s.trim()).filter(Boolean);
              console.log(`[${this.componentName}] 📋 使用用户指定的源图层:`, sourceLayers);
            } else {
              console.log(`[${this.componentName}] 🔍 自动检测 MVT 源图层...`);
              const detectResult = await detectMvtSourceLayers(node.url);
              sourceLayers = detectResult.layerNames || [];
              detectedDataZoom = detectResult.detectedZoom || 0;
              // 保存检测到的瓦片坐标（用于后续 flyTo 定位到数据区域）
              detectedTileX = detectResult.detectedX;
              detectedTileY = detectResult.detectedY;
              console.log(`[${this.componentName}] 📊 检测结果: ${sourceLayers.length} 个图层 (z=${detectedDataZoom} tile=${detectedTileX}/${detectedTileY}) →`, sourceLayers);
              if (sourceLayers.length === 0) {
                console.warn(`[${this.componentName}] ⚠️ 自动检测失败，将使用内置通用样式（不会阻塞 UI）`);
                this.layerErrors[node.id] = {
                  message: '自动检测 MVT 图层失败，已使用默认样式',
                  ...classifyLayerError('自动检测 MVT 图层失败，已使用默认样式')
                };
              }
            }

            // 2. 基于图层名称动态生成 Mapbox Style
            const mvtStyle = buildMvtStyleFromLayers(
              node.id,
              node.name,
              node.url,
              sourceLayers
            );

            console.log(`[${this.componentName}] 🎨 MVT 样式已生成，包含 ${mvtStyle.layers.length} 个图层`);

            // 根据检测结果调整 zoom 范围
            // ⚠️ 关键修复：不能将 minzoom/maxzoom 都设为检测级别
            // minzoom 应为 0（允许从低级别开始请求），maxzoom 设为检测级别 + 6（允许 overzoom）
            // Cesium 的 minimumLevel/maximumLevel 仅在 provider 层面限制请求范围
            // mapbox-gl source 的 minzoom/maxzoom 控制数据源自身的 zoom 范围
            const detectedMinZoom = 0;
            const detectedMaxZoom = detectedDataZoom > 0 ? Math.min(detectedDataZoom + 6, 18) : 18;
            mvtStyle.sources[node.id].minzoom = detectedMinZoom;
            mvtStyle.sources[node.id].maxzoom = detectedMaxZoom;
            console.log(`[${this.componentName}] 🔧 zoom 范围: minzoom=${detectedMinZoom} maxzoom=${detectedMaxZoom} (检测到数据在 z=${detectedDataZoom})`);

            const provider = await MVTImageryProvider.create({
              style: mvtStyle,
              cesiumViewer: viewer,
              tileSize: 512,
              maximumLevel: detectedMaxZoom,
              minimumLevel: detectedMinZoom,
              credit: node.name,
              maxWorkers: 2  // ⚠️ 限制 Worker 数量，防止密集矢量数据解析导致浏览器卡死
            });

            // 🔬 瓦片健康检测：监控前 N 秒内的瓦片，检测是否有实际渲染内容
            // ⚠️ 重要：不拦截全局 fetch/XHR（之前这里 monkey-patch 了 window.fetch 和 window.XMLHttpRequest，
            //   导致 XMLHttpRequest.DONE 等静态常量丢失，使 Cesium 内部请求逻辑异常，是浏览器卡死的根因）
            const origRequestImage = provider.requestImage.bind(provider);
            let reqCount = 0;
            let succCount = 0;
            let emptyCount = 0;
            let failCount = 0;
            const nodeId = node.id;
            const nodeName = node.name;
            const compName = this.componentName;  // ⚠️ 从 this 获取，不依赖已删除的 monkey-patch 代码块

            provider.requestImage = function(x, y, zoom, releaseTile) {
              reqCount++;
              const reqNum = reqCount;
              if (reqNum <= 3) {
                console.log(`[${compName}] 🔬 瓦片请求 #${reqNum}: x=${x} y=${y} zoom=${zoom}`);
              }
              return origRequestImage(x, y, zoom, releaseTile).then(
                (canvas) => {
                  succCount++;
                  // 检测瓦片是否有可见内容
                  let hasContent = false;
                  try {
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    const w = Math.min(canvas.width, 10);
                    const h = Math.min(canvas.height, 10);
                    const imgData = ctx.getImageData(0, 0, w, h);
                    for (let i = 3; i < imgData.data.length; i += 4) {
                      if (imgData.data[i] > 0) { hasContent = true; break; }
                    }
                  } catch (e) { /* ignore */ }
                  if (!hasContent) emptyCount++;
                  if (succCount <= 2) {
                    console.log(`[${compName}] 🔬 瓦片 #${reqNum}: 有内容=${hasContent} (空:${emptyCount}/${succCount})`);
                  }
                  return canvas;
                },
                (err) => {
                  failCount++;
                  if (reqNum <= 5) {
                    console.warn(`[${compName}] 🔬 瓦片 #${reqNum} 失败:`, err?.message || err);
                  }
                  throw err;
                }
              );
            };

            // ⏱️ 延迟健康检查：10 秒后评估瓦片内容质量
            // ⚠️ 重要：MVT 数据通常只覆盖特定区域（如深圳），相机在数据区外时
            //   瓦片为空是正常现象，不应标记为错误。只有瓦片请求明确失败才算异常。
            const TILE_HEALTH_DELAY = 10000;
            setTimeout(() => {
              // 图层已被卸载或组件已销毁，跳过检查
              if (!this._cesiumLayers || !this._cesiumLayers.has(nodeId)) return;

              const totalFinished = succCount + failCount;
              if (totalFinished === 0) {
                // 没有任何瓦片完成 — 可能相机在数据区外，或服务极慢
                console.warn(`[${compName}] 🔬 健康检查: "${nodeName}" ${TILE_HEALTH_DELAY/1000}秒内无任何瓦片完成 (已请求${reqCount}个)` +
                  ` — 可能相机不在数据覆盖区，或瓦片服务响应极慢`);
                return; // 不报错，空瓦片是合法的（数据区外）
              }
              if (failCount > 0 && failCount >= succCount) {
                // ⚠️ 只有失败数 ≥ 成功数时才报错（明确的服务异常）
                console.warn(`[${compName}] 🔬 健康检查: "${nodeName}" 失败${failCount} ≥ 成功${succCount}，服务可能不可达`);
                const errorInfo = classifyLayerError('瓦片请求大量失败，服务不可达');
                this.layerErrors[nodeId] = {
                  message: `瓦片请求大量失败 (失败:${failCount}, 成功:${succCount})`,
                  ...errorInfo
                };
              } else if (succCount > 0 && emptyCount === succCount && failCount === 0) {
                // 瓦片成功但全部为空 — 相机可能在数据区外，仅警告不报错
                console.log(`[${compName}] 🔬 健康检查: "${nodeName}" ${succCount} 个瓦片均无内容` +
                  ` — 相机可能在数据覆盖区外，属正常现象`);
                // ⚠️ 不清除已加载状态，不设置错误
              } else {
                console.log(`[${compName}] 🔬 健康检查: "${nodeName}" 正常 (成功:${succCount}, 有内容:${succCount - emptyCount}, 失败:${failCount})`);
              }
            }, TILE_HEALTH_DELAY);

            // ⚠️ 等待 provider 就绪（带独立超时保护，防止 mapbox-gl style 加载无限挂起）
            const PROVIDER_READY_TIMEOUT = 10000;  // 10 秒，比外层 15 秒短
            const readyTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Provider 就绪超时 (10秒)')), PROVIDER_READY_TIMEOUT);
            });
            try {
              await Promise.race([provider.readyPromise, readyTimeoutPromise]);
              console.log(`[${this.componentName}] ✅ MVT provider 就绪: ${node.name}`);
            } catch (readyErr) {
              // readyPromise 超时或失败不阻塞加载 — 图层仍然添加到 Cesium，
              // 瓦片在实际请求时会由 mapbox-gl 按需加载
              providerReadyError = true;
              console.warn(`[${this.componentName}] ⚠️ MVT provider 未完全就绪，继续加载: ${node.name} —`, readyErr.message);
              this.layerErrors[node.id] = {
                message: `MVT 样式加载超时，瓦片将按需加载`,
                ...classifyLayerError('超时')
              };
            }

            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, {
              type: 'mvt',
              object: layer,
              provider,
              // 保存检测到的瓦片坐标（用于 flyTo 定位到数据区域）
              _detectedDataZoom: detectedDataZoom,
              _detectedTileX: detectedTileX,
              _detectedTileY: detectedTileY
            });
            console.log(`[${this.componentName}] ✅ MVT 矢量瓦片 "${node.name}" 已添加到 Cesium`);
            break;
          }
          case 'geocoding': {
            // ⭐ 地理编码：调用天地图/高德等 API → 解析坐标 → 构建 GeoJSON 点图层
            var geoAddr = node.geocodingAddress || '';
            var geoKey = node.geocodingKey || '';
            if (!geoAddr) throw new Error('地理编码地址不能为空，请在编辑对话框中填写"查询地址"');
            if (!geoKey || geoKey === '你的天地图Key') throw new Error('请先在编辑对话框中填写有效的天地图 Key (tk)');

            // 构建天地图 POI 搜索 URL
            var postStr = JSON.stringify({ keyword: geoAddr, queryType: 1, count: 50 });
            var geoUrl = node.url + '?postStr=' + encodeURIComponent(postStr) + '&type=query&tk=' + encodeURIComponent(geoKey);
            console.log(`[${this.componentName}] 🔍 地理编码请求: keyword="${geoAddr}"`);

            var geoResp = await fetch(geoUrl, { signal: createTimeoutSignal(10000) });
            if (!geoResp.ok) throw new Error('天地图 API 返回 HTTP ' + geoResp.status);
            var geoData = await geoResp.json();
            if (!geoData || geoData.status !== '0') throw new Error('天地图 API 错误: ' + (geoData && geoData.msg || '未知错误'));

            // 解析 POI 结果 → GeoJSON FeatureCollection
            var pois = (geoData.pois || []).concat(geoData.areaResult || []);
            if (pois.length === 0) throw new Error('未找到匹配的地理位置: "' + geoAddr + '"');
            var features = [];
            for (var pi = 0; pi < pois.length; pi++) {
              var poi = pois[pi];
              if (!poi.lonlat) continue;
              var ll = poi.lonlat.split(/\s+/);
              var lon = parseFloat(ll[0]), lat = parseFloat(ll[1]);
              if (isNaN(lon) || isNaN(lat)) continue;
              features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lon, lat] },
                properties: {
                  name: poi.name || geoAddr,
                  address: poi.address || '',
                  phone: poi.phone || '',
                  type: poi.typeName || poi.type || ''
                }
              });
            }
            if (features.length === 0) throw new Error('天地图返回结果无有效坐标');

            var geoCollection = { type: 'FeatureCollection', features: features };
            console.log(`[${this.componentName}] 📍 地理编码: ${features.length} 个POI → GeoJSON 点图层`);

            // 加载为 GeoJSON 点图层
            var dataSource = await Cesium.GeoJsonDataSource.load(geoCollection, {
              markerColor: Cesium.Color.fromCssColorString('#FF4444'),
              markerSize: 36,
              markerSymbol: '📍'
            });
            viewer.dataSources.add(dataSource);
            dataSource.name = node.name;
            this._cesiumLayers.set(node.id, { type: 'geocoding', object: dataSource, _geojson: geoCollection });

            // 定位到搜索结果中心
            var allLons = features.map(function(f) { return f.geometry.coordinates[0]; });
            var allLats = features.map(function(f) { return f.geometry.coordinates[1]; });
            var cLon = (Math.min.apply(null, allLons) + Math.max.apply(null, allLons)) / 2;
            var cLat = (Math.min.apply(null, allLats) + Math.max.apply(null, allLats)) / 2;
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(cLon, cLat, Math.max(50000, Math.abs(allLons[0] - allLons[allLons.length-1]) * 200000)),
              duration: 1.0
            });
            console.log(`[${this.componentName}] ✅ 地理编码图层加载成功: "${node.name}" → ${features.length} 个点位`);
            break;
          }
          case 'local-terrain': {
            // ⭐ 本地 DEM → Cesium Terrain：使用自定义 TerrainProvider 从 GeoTIFF 提供高程
            var terrainUrl = node.url;
            console.log(`[${this.componentName}] ⛰️ 加载本地 DEM 地形: ${terrainUrl}`);

            deadline = Math.max(deadline, Date.now() + 60000);
            await this._ensureGeoTiff();
            await this._ensureGeoTiffTerrainProvider();

            // 步骤1：fetch 本地 GeoTIFF 文件
            var terrainResp = await fetch(terrainUrl, { signal: createTimeoutSignal(30000) });
            if (!terrainResp.ok) throw new Error(`本地 DEM 文件加载失败 (HTTP ${terrainResp.status}): ${terrainUrl}`);
            var terrainBlob = await terrainResp.blob();
            console.log(`[${this.componentName}] 📦 本地 DEM 地形文件: ${(terrainBlob.size/1024/1024).toFixed(1)}MB`);

            if (typeof window.GeoTIFF === 'undefined') {
              throw new Error('geotiff.js 未加载，无法解析本地 DEM 文件');
            }

            // 步骤2：geotiff.js 解码
            var terrainTiff = await window.GeoTIFF.fromArrayBuffer(await terrainBlob.arrayBuffer());
            var terrainImg = await terrainTiff.getImage();
            var terrainRaster = await terrainImg.readRasters();
            var terrainBand = terrainRaster[0];
            var terrainTw = terrainImg.getWidth(), terrainTh = terrainImg.getHeight();

            var terrainMin = Infinity, terrainMax = -Infinity, terrainV = 0;
            for (var tri = 0; tri < terrainBand.length; tri++) {
              var tv = terrainBand[tri];
              if (isFinite(tv) && tv > -9999) { if (tv < terrainMin) terrainMin = tv; if (tv > terrainMax) terrainMax = tv; terrainV++; }
            }
            console.log('[LayerTreeManager] 📊 Terrain DEM: ' + terrainMin.toFixed(1) + '~' + terrainMax.toFixed(1) + 'm 有效=' + terrainV + ' 尺寸=' + terrainTw + '×' + terrainTh);

            // 步骤3：提取地理范围
            var terrainWest, terrainEast, terrainSouth, terrainNorth;
            try {
              var tOrigin = terrainImg.getOrigin();
              var tRes = terrainImg.getResolution();
              if (tOrigin && tRes && tOrigin.length >= 2 && tRes.length >= 2 &&
                  isFinite(tOrigin[0]) && isFinite(tOrigin[1]) &&
                  isFinite(tRes[0]) && isFinite(tRes[1])) {
                terrainWest = tOrigin[0];
                terrainNorth = tOrigin[1];
                terrainEast = tOrigin[0] + terrainTw * Math.abs(tRes[0]);
                terrainSouth = tOrigin[1] - terrainTh * Math.abs(tRes[1]);
              } else {
                throw new Error('GeoTIFF 地理元数据无效');
              }
            } catch (e) {
              terrainWest = node.centerLon != null ? node.centerLon - 10 : -180;
              terrainEast = node.centerLon != null ? node.centerLon + 10 : 180;
              terrainSouth = node.centerLat != null ? node.centerLat - 5 : -90;
              terrainNorth = node.centerLat != null ? node.centerLat + 5 : 90;
            }
            console.log('[LayerTreeManager] 🌍 Terrain 地理范围: ' +
              terrainWest.toFixed(4) + '°~' + terrainEast.toFixed(4) + '°E, ' +
              terrainSouth.toFixed(4) + '°~' + terrainNorth.toFixed(4) + '°N');

            // 步骤4：创建 GeoTiffTerrainProvider
            if (typeof window.GeoTiffTerrainProvider === 'undefined') {
              throw new Error('GeoTiffTerrainProvider 未加载');
            }
            var terrainProvider = new window.GeoTiffTerrainProvider({
              rasterData: terrainBand,
              width: terrainTw,
              height: terrainTh,
              bounds: { west: terrainWest, east: terrainEast, south: terrainSouth, north: terrainNorth },
              minHeight: terrainMin,
              maxHeight: terrainMax
            });

            // 步骤5：保存当前 terrainProvider 用于卸载时恢复
            this._previousTerrainProvider = viewer.scene.terrainProvider;

            // 步骤6：设置到 globe
            viewer.scene.terrainProvider = terrainProvider;
            viewer.scene.globe.depthTestAgainstTerrain = true;

            // 步骤7：存储到 _cesiumLayers
            this._cesiumLayers.set(node.id, {
              type: 'local-terrain',
              provider: terrainProvider,
              _bounds: { west: terrainWest, east: terrainEast, south: terrainSouth, north: terrainNorth }
            });
            console.log('[LayerTreeManager] ⛰️ Terrain Provider 已激活: ' +
              terrainTw + '×' + terrainTh + ' 高程=' + terrainMin.toFixed(0) + '~' + terrainMax.toFixed(0) + 'm');
            console.log(`[${this.componentName}] ✅ 本地 DEM 地形加载成功: "${node.name}"`);
            break;
          }
          case 'local-terrain-tiles': {
            // ⭐ 本地 DEM Terrain（复用 GeoTiffTerrainProvider，已验证可用）
            // 与 local-terrain-cop30 使用相同的加载方式，通过 GeoTIFF 提供地形数据
            var terrainTilesUrl = node.url;
            console.log(`[${this.componentName}] ⛰️ 加载本地 Terrain: ${terrainTilesUrl}`);

            deadline = Math.max(deadline, Date.now() + 60000);
            await this._ensureGeoTiff();
            await this._ensureGeoTiffTerrainProvider();

            if (typeof window.GeoTiffTerrainProvider === 'undefined') {
              throw new Error('GeoTiffTerrainProvider 未加载');
            }

            // 使用 copernicus_glo30.tif 文件
            var tifUrl = '/data/dem/copernicus_glo30.tif';
            var terrainResp = await fetch(tifUrl, { signal: createTimeoutSignal(30000) });
            if (!terrainResp.ok) throw new Error('DEM 文件加载失败 (HTTP ' + terrainResp.status + ')');
            var terrainBlob = await terrainResp.blob();

            var terrainTiff = await window.GeoTIFF.fromArrayBuffer(await terrainBlob.arrayBuffer());
            var terrainImg = await terrainTiff.getImage();
            var terrainRaster = await terrainImg.readRasters();
            var terrainBand = terrainRaster[0];
            var tW = terrainImg.getWidth(), tH = terrainImg.getHeight();

            var tMin = Infinity, tMax = -Infinity;
            for (var ti = 0; ti < terrainBand.length; ti++) {
              var tv = terrainBand[ti];
              if (isFinite(tv) && tv > -9999) { if (tv < tMin) tMin = tv; if (tv > tMax) tMax = tv; }
            }

            var tWest, tEast, tSouth, tNorth;
            try {
              var tOrg = terrainImg.getOrigin(), tRes = terrainImg.getResolution();
              tWest = tOrg[0]; tNorth = tOrg[1];
              tEast = tOrg[0] + tW * Math.abs(tRes[0]);
              tSouth = tOrg[1] - tH * Math.abs(tRes[1]);
            } catch(e) {
              tWest = 103; tEast = 104; tSouth = 30; tNorth = 31;
            }

            // 保存当前 terrainProvider
            this._previousTerrainProvider = viewer.scene.terrainProvider;

            // 使用已验证的 GeoTiffTerrainProvider
            var terrainProvider = new window.GeoTiffTerrainProvider({
              rasterData: terrainBand,
              width: tW, height: tH,
              bounds: { west: tWest, east: tEast, south: tSouth, north: tNorth },
              minHeight: tMin, maxHeight: tMax
            });

            viewer.scene.terrainProvider = terrainProvider;
            viewer.scene.globe.depthTestAgainstTerrain = true;

            this._cesiumLayers.set(node.id, {
              type: 'local-terrain-tiles',
              provider: terrainProvider,
              _bounds: { west: tWest, east: tEast, south: tSouth, north: tNorth }
            });
            console.log('[LayerTreeManager] ⛰️ Terrain Provider 已激活: ' + tW + '×' + tH + ' 高程=' + tMin.toFixed(0) + '~' + tMax.toFixed(0) + 'm');
            console.log(`[${this.componentName}] ✅ 本地 Terrain 加载成功: "${node.name}"`);
            break;
          }
          case 'local-dem': {
            // ⭐ 本地 DEM GeoTIFF 文件加载：无需网络请求，直接 fetch 本地文件
            var localDemUrl = node.url;
            console.log(`[${this.componentName}] 🏔️ 加载本地 DEM: ${localDemUrl}`);

            deadline = Math.max(deadline, Date.now() + 60000);
            await this._ensureGeoTiff();

            // 步骤1：fetch 本地 GeoTIFF 文件
            var demResp = await fetch(localDemUrl, { signal: createTimeoutSignal(30000) });
            if (!demResp.ok) throw new Error(`本地 DEM 文件加载失败 (HTTP ${demResp.status}): ${localDemUrl}`);
            var demBlob = await demResp.blob();
            console.log(`[${this.componentName}] 📦 本地 DEM 文件: ${(demBlob.size/1024/1024).toFixed(1)}MB`);

            if (typeof window.GeoTIFF === 'undefined') {
              throw new Error('geotiff.js 未加载，无法解析本地 DEM 文件');
            }

            // 步骤2：geotiff.js 解码
            var tiff = await window.GeoTIFF.fromArrayBuffer(await demBlob.arrayBuffer());
            var tifImg = await tiff.getImage();
            var tifRaster = await tifImg.readRasters();
            var band = tifRaster[0];
            var tw = tifImg.getWidth(), th = tifImg.getHeight();

            var tMin = Infinity, tMax = -Infinity, tv = 0;
            for (var ri = 0; ri < band.length; ri++) {
              var v = band[ri];
              if (isFinite(v) && v > -9999) { if (v < tMin) tMin = v; if (v > tMax) tMax = v; tv++; }
            }
            console.log('[LayerTreeManager] 📊 本地 DEM: ' + tMin.toFixed(1) + '~' + tMax.toFixed(1) + 'm 有效=' + tv + ' 尺寸=' + tw + '×' + th);

            // 步骤2.5：从 GeoTIFF 元数据提取实际地理范围
            var demWest, demEast, demSouth, demNorth;
            try {
              var tifOrigin = tifImg.getOrigin();
              var tifResolution = tifImg.getResolution();
              if (tifOrigin && tifResolution && tifOrigin.length >= 2 && tifResolution.length >= 2 &&
                  isFinite(tifOrigin[0]) && isFinite(tifOrigin[1]) &&
                  isFinite(tifResolution[0]) && isFinite(tifResolution[1])) {
                demWest = tifOrigin[0];
                demNorth = tifOrigin[1];
                demEast = tifOrigin[0] + tw * Math.abs(tifResolution[0]);
                demSouth = tifOrigin[1] - th * Math.abs(tifResolution[1]);
                console.log('[LayerTreeManager] 🌍 从 GeoTIFF 读取实际地理范围: ' +
                  demWest.toFixed(4) + '°~' + demEast.toFixed(4) + '°E, ' +
                  demSouth.toFixed(4) + '°~' + demNorth.toFixed(4) + '°N');
              } else {
                throw new Error('GeoTIFF 地理元数据无效');
              }
            } catch (e) {
              // 回退：使用 centerLon/centerLat 中心推断
              demWest = node.centerLon != null ? node.centerLon - 10 : -180;
              demEast = node.centerLon != null ? node.centerLon + 10 : 180;
              demSouth = node.centerLat != null ? node.centerLat - 5 : -90;
              demNorth = node.centerLat != null ? node.centerLat + 5 : 90;
              console.log('[LayerTreeManager] ⚠️ GeoTIFF 地理元数据不可用，使用 center-based 推断范围: ' +
                demWest.toFixed(2) + '°~' + demEast.toFixed(2) + '°E, ' +
                demSouth.toFixed(2) + '°~' + demNorth.toFixed(2) + '°N (错误: ' + e.message + ')');
            }

            // 步骤3：色带渲染
            var tCvs = document.createElement('canvas'); tCvs.width = tw; tCvs.height = th;
            var tCtx = tCvs.getContext('2d');
            var tImg = tCtx.createImageData(tw, th);
            var tSt = (tMax > tMin) ? 1 / (tMax - tMin) : 1;
            for (var ri = 0; ri < band.length; ri++) {
              var val = band[ri], pi = ri * 4;
              if (!isFinite(val) || val <= -9999) { tImg.data[pi+3] = 0; continue; }
              var nt = Math.max(0, Math.min(1, (val - tMin) * tSt));
              var tr, tg, tb;
              // 自然地形色带：绿(低) → 棕/土黄(中) → 灰(高) → 白(雪山顶)
              if (nt < 0.25)      { var s = nt / 0.25;          tr = Math.round(34 + s * 100);  tg = Math.round(139 - s * 50);  tb = Math.round(34 - s * 30); }      // 深绿→浅绿
              else if (nt < 0.6)  { var s = (nt - 0.25) / 0.35; tr = Math.round(134 + s * 86);  tg = Math.round(89 + s * 25);   tb = Math.round(4 + s * 50); }        // 浅绿→棕色/土黄
              else if (nt < 0.85) { var s = (nt - 0.6) / 0.25;  tr = Math.round(220 + s * 20);  tg = Math.round(114 - s * 24);  tb = Math.round(54 + s * 96); }        // 棕色→灰色
              else                { var s = (nt - 0.85) / 0.15; tr = Math.round(240 + s * 15);  tg = Math.round(90 + s * 165);  tb = Math.round(150 + s * 105); }      // 灰色→白色
              tImg.data[pi]=tr; tImg.data[pi+1]=tg; tImg.data[pi+2]=tb; tImg.data[pi+3]=255;
            }
            tCtx.putImageData(tImg, 0, 0);

            // 步骤4：3D 网格渲染（复用 WCS 3D 逻辑）
            var is3d = node.demRenderMode !== '2d';
            if (is3d) {
              var scale3d = node.demElevationScale != null ? node.demElevationScale : 1.0;
              // 根据瓦片尺寸动态计算网格分辨率（目标每边 50~200 顶点）
              var targetVerticesPerSide = Math.min(200, Math.max(50, Math.floor((tw + th) / 36)));
              var stepX3d = Math.max(1, Math.floor(tw / targetVerticesPerSide));
              var stepY3d = Math.max(1, Math.floor(th / targetVerticesPerSide));
              var cols3d = Math.floor((tw - 1) / stepX3d) + 1;
              var rows3d = Math.floor((th - 1) / stepY3d) + 1;

              var vertices3d = [], texCoords3d = [], indices3d = [], vertexColors = [];
              for (var row = 0; row < rows3d; row++) {
                for (var col = 0; col < cols3d; col++) {
                  var si = Math.min(row * stepY3d, th - 1);
                  var sj = Math.min(col * stepX3d, tw - 1);
                  var pixIdx = si * tw + sj;
                  var v = band[pixIdx];
                  if (!isFinite(v) || v <= -9999) v = tMin;
                  // 使用实际高程值（米），scale3d 作为垂直夸张系数
                  var ht3d = v * scale3d;
                  var lon3d = demWest + col * (demEast - demWest) / (cols3d - 1);
                  var lat3d = demNorth - row * (demNorth - demSouth) / (rows3d - 1);
                  var cart3d = Cesium.Cartesian3.fromDegrees(lon3d, lat3d, ht3d);
                  vertices3d.push(cart3d.x, cart3d.y, cart3d.z);
                  texCoords3d.push(col / (cols3d - 1), 1 - row / (rows3d - 1));
                  var pi = pixIdx * 4;
                  vertexColors.push(tImg.data[pi], tImg.data[pi+1], tImg.data[pi+2], 255);
                }
              }
              for (var row = 0; row < rows3d - 1; row++) {
                for (var col = 0; col < cols3d - 1; col++) {
                  var a = row * cols3d + col, b = a + 1, c = a + cols3d, d = c + 1;
                  indices3d.push(a, b, d); indices3d.push(a, d, c);
                }
              }
              var geometry3d = new Cesium.Geometry({
                attributes: new Cesium.GeometryAttributes({
                  position: new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: vertices3d }),
                  st: new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.FLOAT, componentsPerAttribute: 2, values: texCoords3d }),
                  color: new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE, componentsPerAttribute: 4, values: new Uint8Array(vertexColors), normalize: true })
                }),
                indices: indices3d,
                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                boundingSphere: Cesium.BoundingSphere.fromVertices(vertices3d)
              });
              var mesh3d = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({ geometry: geometry3d }),
                appearance: new Cesium.PerInstanceColorAppearance({ flat: false, translucent: true }),
                asynchronous: false
              });
              viewer.scene.primitives.add(mesh3d);
              this._cesiumLayers.set(node.id, { type: 'local-dem', object: mesh3d, _is3d: true, _imageUrl: tCvs.toDataURL('image/png'), _bounds: { west: demWest, east: demEast, south: demSouth, north: demNorth } });
              console.log('[LayerTreeManager] 🏔️ 本地 DEM 3D 网格: ' + cols3d + '×' + rows3d +
                ' 顶点=' + (vertices3d.length/3).toFixed(0) + ' 三角形=' + (indices3d.length/3).toFixed(0) +
                ' 高程×' + scale3d.toFixed(1));
            } else {
              // 2D 模式：SingleTileImageryProvider
              var imageUrl = tCvs.toDataURL('image/png');
              var provider2d = new Cesium.SingleTileImageryProvider({ url: imageUrl });
              var layer2d = viewer.imageryLayers.addImageryProvider(provider2d);
              layer2d.alpha = 0.7;
              this._cesiumLayers.set(node.id, { type: 'local-dem', object: layer2d, provider: provider2d, _imageUrl: imageUrl });
            }
            console.log(`[${this.componentName}] ✅ 本地 DEM 加载成功: "${node.name}"`);
            break;
          }
          case 'wcs': {
            // ⭐ WCS：GetCapabilities 发现 Coverage → GetCoverage 获取栅格 → 叠加为影像图层
            var covName = node.wcsCoverageName || '';
            var covFormat = node.wcsFormat || 'image/png'; // 默认 PNG（无需 geotiff.js）
            var covVersion = node.wcsVersion || '2.0.1';
            var baseUrl = node.url;

            // ── 步骤 1：GetCapabilities 发现可用 Coverage ──
            var capsSep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
            var capsUrl = baseUrl + capsSep + 'SERVICE=WCS&REQUEST=GetCapabilities&VERSION=' + encodeURIComponent(covVersion);
            console.log(`[${this.componentName}] 🔍 WCS GetCapabilities...`);

            var availableCoverages = [];
            try {
              var capsResp = await fetch(capsUrl, { signal: createTimeoutSignal(15000) });
              if (capsResp.ok) {
                var capsText = await capsResp.text();
                // 从 XML 中提取 CoverageId
                var cidRegex = /<wcs:CoverageId[^>]*>([^<]+)<\/wcs:CoverageId>|<CoverageId[^>]*>([^<]+)<\/CoverageId>/gi;
                var m;
                while ((m = cidRegex.exec(capsText)) !== null) {
                  var cid = m[1] || m[2];
                  if (cid && cid.trim()) availableCoverages.push(cid.trim());
                }
                console.log(`[${this.componentName}] 📋 可用 Coverage (${availableCoverages.length}):`, availableCoverages.slice(0, 10));
              }
            } catch (e) {
              console.warn(`[${this.componentName}] ⚠️ GetCapabilities 失败:`, e.message);
            }

            // GetCapabilities 不可用时，若未指定 coverage 则用预置名
            if (!covName && availableCoverages.length === 0) {
              covName = 'BlueMarbleCov'; // 2D 全球卫星影像，无需时间切片
              console.log(`[${this.componentName}] 🔄 GetCapabilities 不可用，回退: "${covName}"`);
            }

            // ⭐ 指定的 coverage 未在服务中找到 → 自动选择可用 coverage
            if (covName && availableCoverages.length > 0 && !availableCoverages.includes(covName)) {
              console.warn(`[${this.componentName}] ⚠️ 指定 Coverage "${covName}" 在服务中未找到（可用: ${availableCoverages.join(', ')}），自动选择...`);
              covName = ''; // 清空以触发下方的自动选择逻辑
            }

            // 如果用户未指定 coverage（或已清空），优先选 2D 数据层（跳过预渲染样式 Color/Scaled + 3D 时序 Temp/Land）
            if (!covName && availableCoverages.length > 0) {
              for (var ci = 0; ci < availableCoverages.length; ci++) {
                var cn = availableCoverages[ci];
                if (!/color|scaled|temp|land/i.test(cn)) { covName = cn; break; }
              }
              // 回退：选第一个不含 Color/Scaled 的（即使可能是 3D）
              if (!covName) {
                for (var cj = 0; cj < availableCoverages.length; cj++) {
                  var cn2 = availableCoverages[cj];
                  if (!/color|scaled/i.test(cn2)) { covName = cn2; break; }
                }
              }
              if (!covName) covName = availableCoverages[0];
              console.log(`[${this.componentName}] 🎯 自动选择 Coverage: "${covName}"`);
            }
            if (!covName) {
              var hint = availableCoverages.length > 0
                ? '可用 Coverage: ' + availableCoverages.slice(0, 5).join(', ')
                : '无法获取 Coverage 列表，请手动填写 Coverage 名称';
              throw new Error('WCS Coverage 名称不能为空。' + hint);
            }

            // ── 步骤 2：DescribeCoverage 获取维度名称 ──
            var descSep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
            var descUrl = baseUrl + descSep + 'SERVICE=WCS&REQUEST=DescribeCoverage&VERSION=' + encodeURIComponent(covVersion);
            descUrl += '&COVERAGEID=' + encodeURIComponent(covName);
            var axisNames = ['Long', 'Lat']; // 默认空间轴
            var extraAxes = []; // 额外轴（时间等），需切片
            var covBbox = null; // { west, south, east, north }
            try {
              var descResp = await fetch(descUrl, { signal: createTimeoutSignal(10000) });
              if (descResp.ok) {
                var descText = await descResp.text();
                var axisRegex = /<gml:axisAbbrev[^>]*>([^<]+)<\/gml:axisAbbrev>|<AxisAbbrev[^>]*>([^<]+)<\/AxisAbbrev>/gi;
                var found = [];
                var am;
                while ((am = axisRegex.exec(descText)) !== null) {
                  var abbr = (am[1] || am[2] || '').trim();
                  if (abbr) found.push(abbr);
                }
                if (found.length >= 2) {
                  // ⭐ 分离空间轴和时间轴：时间/日期轴不用于 SUBSET 空间范围
                  var timeAxisPattern = /^(ansi|time|t|date|datetime|timestamp|unix|elevation)$/i;
                  var spatialAxes = [], timeAxes = [];
                  for (var fi = 0; fi < found.length; fi++) {
                    if (timeAxisPattern.test(found[fi])) {
                      timeAxes.push(found[fi]);
                    } else {
                      spatialAxes.push(found[fi]);
                    }
                  }
                  // 空间轴取前 2 个，其余归入额外轴
                  axisNames = spatialAxes.slice(0, 2);
                  extraAxes = timeAxes.concat(spatialAxes.slice(2));
                  if (axisNames.length < 2) {
                    axisNames = found.slice(0, 2); // 回退：无法识别空间轴时保持原逻辑
                    extraAxes = found.slice(2);
                  }
                }
                // 提取空间边界框（WGS84 经纬度）
                var bboxRegex = /<gml:lowerCorner[^>]*>([^<]+)<\/gml:lowerCorner>\s*<gml:upperCorner[^>]*>([^<]+)<\/gml:upperCorner>/;
                var bm = descText.match(bboxRegex);
                if (bm) {
                  var lo = bm[1].trim().split(/\s+/);
                  var hi = bm[2].trim().split(/\s+/);
                  // ⭐ 多轴 coverage（含时间维度）：bbox 值偏移 extraAxes.length
                  //    例如 axisLabels="ansi Lat Lon" → lo=[time, lat, lon] → 偏移 1
                  var spOff = extraAxes.length;
                  var lo0 = parseFloat(lo[spOff]), lo1 = parseFloat(lo[spOff + 1]);
                  var hi0 = parseFloat(hi[spOff]), hi1 = parseFloat(hi[spOff + 1]);
                  // 验证值的合理性（纬度 -90~90，经度 -180~180）
                  if (isFinite(lo0) && isFinite(lo1) && isFinite(hi0) && isFinite(hi1) &&
                      Math.abs(lo0) <= 180 && Math.abs(hi0) <= 180 &&
                      Math.abs(lo1) <= 180 && Math.abs(hi1) <= 180) {
                    covBbox = { west: lo1, south: lo0, east: hi1, north: hi0 };
                  } else {
                    console.warn(`[${this.componentName}] ⚠️ bbox 解析值异常 (spOff=${spOff}): lo=[${lo0},${lo1}] hi=[${hi0},${hi1}]，回退全局范围`);
                  }
                }
                console.log(`[${this.componentName}] 📐 DescribeCoverage 轴: 空间=${axisNames.join(',')} 额外=${extraAxes.join(',') || '无'} bbox=`, covBbox);
              }
            } catch (e) { /* 使用默认轴名 */ }

            // 为额外轴构建切片参数
            var extraSlices = '';
            // 优先使用节点配置的时间切片（wcsTimeAxis + wcsTimeSlice）
            if (node.wcsTimeAxis && node.wcsTimeSlice) {
              extraSlices = '&SUBSET=' + encodeURIComponent(node.wcsTimeAxis) + '("' + encodeURIComponent(node.wcsTimeSlice) + '")';
              console.log(`[${this.componentName}] 🔪 配置时间切片: ${node.wcsTimeAxis}="${node.wcsTimeSlice}"`);
            } else if (extraAxes.length > 0) {
              // DescribeCoverage 自动发现的额外轴
              try {
                var lowerRegex = /<gml:lowerCorner[^>]*>([^<]+)<\/gml:lowerCorner>/;
                var lm = descText.match(lowerRegex);
                if (lm) {
                  var lowerVals = lm[1].trim().split(/\s+/);
                  for (var ei = 0; ei < extraAxes.length; ei++) {
                    var valIdx = 2 + ei;
                    var sliceVal = (lowerVals[valIdx] !== undefined) ? lowerVals[valIdx] : '0';
                    extraSlices += '&SUBSET=' + encodeURIComponent(extraAxes[ei]) + '("' + sliceVal + '")';
                    console.log(`[${this.componentName}] 🔪 自动切片 ${extraAxes[ei]}="${sliceVal}"`);
                  }
                }
              } catch (e) { /* skip */ }
            }

            // ── 步骤 3：GetCoverage（多策略重试：无 SUBSET → 有 SUBSET，png → tiff）─
            var covSep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
            var covBlob = null;
            var finalFormat = covFormat;

            // ⭐ 使用 DescribeCoverage 的真实边界框，避免硬编码 (-180,180)/(-90,90) 超出 coverage 范围
            var subsetLon = covBbox ? (covBbox.west + ',' + covBbox.east) : '-180,180';
            var subsetLat = covBbox ? (covBbox.south + ',' + covBbox.north) : '-90,90';
            // ⭐ 匹配空间轴名到子集范围（轴序可能为 Lat,Lon 或 Lon,Lat）
            var axLon = axisNames.find(function(a) { return /^(lon|long|longitude|x|easting)$/i.test(a); }) || axisNames[0];
            var axLat = axisNames.find(function(a) { return /^(lat|latitude|y|northing)$/i.test(a); }) || axisNames[1];
            if (covBbox) {
              console.log(`[${this.componentName}] 🎯 使用 DescribeCoverage 边界: ${axLon}(${subsetLon}) ${axLat}(${subsetLat})`);
            }

            // 策略列表（仅 DescribeCoverage 明确发现的额外轴才加切片）
            var strategies = [
              { suffix: '&COVERAGEID=' + encodeURIComponent(covName) + '&FORMAT=' + encodeURIComponent(covFormat) + extraSlices, desc: '无SUBSET ' + covFormat + (extraSlices ? ' +切片' : '') },
              { suffix: '&COVERAGEID=' + encodeURIComponent(covName) + '&FORMAT=image%2Ftiff' + extraSlices, desc: '无SUBSET image/tiff' + (extraSlices ? ' +切片' : ''), ifFormatFail: true },
              { suffix: '&COVERAGEID=' + encodeURIComponent(covName) + '&FORMAT=' + encodeURIComponent(covFormat) + '&SUBSET=' + encodeURIComponent(axLon) + '(' + subsetLon + ')&SUBSET=' + encodeURIComponent(axLat) + '(' + subsetLat + ')' + extraSlices, desc: 'SUBSET ' + axLon + ',' + axLat + ' ' + covFormat + (extraSlices ? ' +切片' : '') },
              { suffix: '&COVERAGEID=' + encodeURIComponent(covName) + '&FORMAT=image%2Ftiff' + '&SUBSET=' + encodeURIComponent(axLon) + '(' + subsetLon + ')&SUBSET=' + encodeURIComponent(axLat) + '(' + subsetLat + ')' + extraSlices, desc: 'SUBSET ' + axLon + ',' + axLat + ' image/tiff' + (extraSlices ? ' +切片' : ''), ifFormatFail: true },
            ];

            for (var si = 0; si < strategies.length && !covBlob; si++) {
              var strat = strategies[si];
              // 仅当上一策略因格式失败时才尝试 tiff 回退
              if (strat.ifFormatFail && covFormat.indexOf('png') < 0) continue;

              var wcsUrl = baseUrl + covSep + 'SERVICE=WCS&REQUEST=GetCoverage&VERSION=' + encodeURIComponent(covVersion) + strat.suffix;
              console.log(`[${this.componentName}] 🏔️ WCS 尝试 ${si+1}/${strategies.length}: ${strat.desc}`);
              try {
                var covResp = await fetch(wcsUrl, { signal: createTimeoutSignal(30000) });
                if (covResp.ok) {
                  covBlob = await covResp.blob();
                  // 若此策略用了 tiff，更新最终格式
                  if (strat.suffix.indexOf('image%2Ftiff') >= 0) finalFormat = 'image/tiff';
                  console.log(`[${this.componentName}] ✅ GetCoverage 成功 (${(covBlob.size/1024).toFixed(0)}KB, ${finalFormat})`);
                  break;
                }
                var errBody = '';
                try { errBody = await covResp.text(); } catch (e2) {}
                // 提取 OWS Exception 文本
                var errMatch = errBody.match(/<ows:ExceptionText[^>]*>([\s\S]*?)<\/ows:ExceptionText>/);
                var errMsg = errMatch ? errMatch[1].trim() : errBody.slice(0, 500);
                console.warn(`[${this.componentName}] ⚠️ ${strat.desc} → HTTP ${covResp.status}:`, errMsg);
              } catch (e) {
                console.warn(`[${this.componentName}] ⚠️ ${strat.desc} 失败:`, e.message);
              }
            }

            if (!covBlob) {
              throw new Error('WCS GetCoverage 失败：所有轴名组合均未成功。Coverage="' + covName +
                '" 可用列表: ' + availableCoverages.slice(0, 5).join(', '));
            }

            // ── 步骤 4：栅格 → Cesium 影像层 ──
            var imageUrl;
            if (finalFormat.indexOf('tiff') >= 0) {
              // GeoTIFF：延长超时（解码 120 万像素需 ~15 秒）
              deadline = Math.max(deadline, Date.now() + 30000);
              await this._ensureGeoTiff();
              if (typeof window.GeoTIFF !== 'undefined') {
                var tiff = await window.GeoTIFF.fromArrayBuffer(await covBlob.arrayBuffer());
                var tifImg = await tiff.getImage();
                var tifRaster = await tifImg.readRasters();
                var band = tifRaster[0];
                var tw = tifImg.getWidth(), th = tifImg.getHeight();

                var tMin = Infinity, tMax = -Infinity, tv = 0;
                for (var ri = 0; ri < band.length; ri++) {
                  var v = band[ri];
                  if (isFinite(v) && v > -9999) { if (v < tMin) tMin = v; if (v > tMax) tMax = v; tv++; }
                }
                console.log('[LayerTreeManager] 📊 TIFF: ' + tMin.toFixed(1) + '~' + tMax.toFixed(1) + ' 有效:' + tv);

                var tCvs = document.createElement('canvas'); tCvs.width = tw; tCvs.height = th;
                var tCtx = tCvs.getContext('2d');
                var tImg = tCtx.createImageData(tw, th);
                var tSt = (tMax > tMin) ? 1 / (tMax - tMin) : 1;
                for (var ri = 0; ri < band.length; ri++) {
                  var val = band[ri], pi = ri * 4;
                  if (!isFinite(val) || val <= -9999) { tImg.data[pi+3] = 0; continue; }
                  var nt = Math.max(0, Math.min(1, (val - tMin) * tSt));
                  var tr, tg, tb;
                  if (nt < 0.25)      { var s = nt / 0.25;          tr = Math.round(s * 255); tg = 255; tb = Math.round((1 - s) * 128); }
                  else if (nt < 0.5)  { var s = (nt - 0.25) / 0.25; tr = 255; tg = Math.round(255 - s * 100); tb = 0; }
                  else if (nt < 0.75) { var s = (nt - 0.5) / 0.25;  tr = 255; tg = Math.round(155 - s * 155); tb = Math.round(s * 100); }
                  else                { var s = (nt - 0.75) / 0.25; tr = 255; tg = Math.round(s * 255); tb = Math.round(100 + s * 155); }
                  tImg.data[pi]=tr; tImg.data[pi+1]=tg; tImg.data[pi+2]=tb; tImg.data[pi+3]=255;
                }
                tCtx.putImageData(tImg, 0, 0);
                imageUrl = tCvs.toDataURL('image/png');
                console.log('[LayerTreeManager] 🖼️ GeoTIFF+色带 → ' + tw + '×' + th);

                // ═══════════════════════════════════════════════════════
                // 🏔️ 3D 渲染模式：高程数据 → 3D 网格
                // ═══════════════════════════════════════════════════════
                if (node.wcsRenderMode === '3d') {
                  var scale3d = node.wcsElevationScale != null ? node.wcsElevationScale : 1.0;

                  // 降采样步长（目标 ~180×90 网格 = 16K 顶点，平衡性能和细节）
                  var stepX3d = Math.max(1, Math.floor(tw / 180));
                  var stepY3d = Math.max(1, Math.floor(th / 90));
                  var cols3d = Math.floor((tw - 1) / stepX3d) + 1;
                  var rows3d = Math.floor((th - 1) / stepY3d) + 1;

                  var heightRange = tMax - tMin;
                  if (heightRange <= 0) heightRange = 1;
                  var baseHeight = 0; // 基准海拔（海平面以上）

                  // 构建顶点和纹理坐标
                  var vertices3d = [];
                  var texCoords3d = [];
                  var indices3d = [];
                  var vertexColors = [];

                  for (var row = 0; row < rows3d; row++) {
                    for (var col = 0; col < cols3d; col++) {
                      var si = Math.min(row * stepY3d, th - 1);
                      var sj = Math.min(col * stepX3d, tw - 1);
                      var pixIdx = si * tw + sj;
                      var v = band[pixIdx];
                      if (!isFinite(v) || v <= -9999) v = tMin;

                      var nt3d = (v - tMin) / heightRange;
                      var ht3d = nt3d * scale3d * 200000; // 最大高程 ~200km @ scale=1

                      var lon3d = -180 + col * 360 / (cols3d - 1);
                      var lat3d = 90 - row * 180 / (rows3d - 1);

                      var cart3d = Cesium.Cartesian3.fromDegrees(lon3d, lat3d, baseHeight + ht3d);
                      vertices3d.push(cart3d.x, cart3d.y, cart3d.z);

                      // 纹理坐标（用于颜色贴图）
                      texCoords3d.push(col / (cols3d - 1), 1 - row / (rows3d - 1));

                      // 顶点颜色（从色带中取对应像素）
                      var pi = pixIdx * 4;
                      vertexColors.push(tImg.data[pi], tImg.data[pi+1], tImg.data[pi+2], 255);
                    }
                  }

                  // 构建三角形索引
                  for (var row = 0; row < rows3d - 1; row++) {
                    for (var col = 0; col < cols3d - 1; col++) {
                      var a = row * cols3d + col;
                      var b = a + 1;
                      var c = a + cols3d;
                      var d = c + 1;
                      indices3d.push(a, b, d);
                      indices3d.push(a, d, c);
                    }
                  }

                  var geometry3d = new Cesium.Geometry({
                    attributes: new Cesium.GeometryAttributes({
                      position: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                        componentsPerAttribute: 3,
                        values: vertices3d
                      }),
                      st: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 2,
                        values: texCoords3d
                      }),
                      color: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
                        componentsPerAttribute: 4,
                        values: new Uint8Array(vertexColors),
                        normalize: true
                      })
                    }),
                    indices: indices3d,
                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices3d)
                  });

                  var mesh3d = new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                      geometry: geometry3d
                    }),
                    appearance: new Cesium.PerInstanceColorAppearance({
                      flat: false,
                      translucent: true
                    }),
                    asynchronous: false
                  });

                  viewer.scene.primitives.add(mesh3d);
                  mesh3d.show = true;

                  this._cesiumLayers.set(node.id, {
                    type: 'wcs',
                    object: mesh3d,
                    _is3d: true,
                    _wcsBbox: covBbox,
                    _imageUrl: imageUrl
                  });

                  console.log('[LayerTreeManager] 🏔️ 3D 网格已创建: ' + cols3d + '×' + rows3d +
                    ' 顶点=' + (vertices3d.length/3).toFixed(0) + ' 三角形=' + (indices3d.length/3).toFixed(0) +
                    ' 高程×' + scale3d.toFixed(1));
                  break; // 跳过 2D provider 创建
                }
              } else {
                imageUrl = URL.createObjectURL(covBlob);
              }
            } else if (finalFormat.indexOf('png') >= 0 || finalFormat.indexOf('jpeg') >= 0 || finalFormat.indexOf('jpg') >= 0) {
              if (node.wcsColorRamp !== false) {
                imageUrl = await this._applyColorRamp(covBlob, covName);
              } else {
                imageUrl = URL.createObjectURL(covBlob);
              }
            } else {
              imageUrl = URL.createObjectURL(covBlob);
            }

            // ⭐ 使用 DescribeCoverage 获取的真实边界框定位栅格
            var providerOpts = { url: imageUrl };
            if (covBbox && covBbox.west < covBbox.east && covBbox.south < covBbox.north) {
              providerOpts.rectangle = Cesium.Rectangle.fromDegrees(covBbox.west, covBbox.south, covBbox.east, covBbox.north);
              console.log(`[${this.componentName}] 🗺️ WCS 边界框(度): [${covBbox.west}, ${covBbox.south}, ${covBbox.east}, ${covBbox.north}]`);
              console.log(`[${this.componentName}] 🗺️ providerOpts.rectangle(弧度):`, {
                west: providerOpts.rectangle.west,
                south: providerOpts.rectangle.south,
                east: providerOpts.rectangle.east,
                north: providerOpts.rectangle.north
              });
            }
            var imageryProvider = new Cesium.SingleTileImageryProvider(providerOpts);
            console.log(`[${this.componentName}] 🗺️ imageryProvider.rectangle:`, {
              west: imageryProvider.rectangle.west,
              south: imageryProvider.rectangle.south,
              east: imageryProvider.rectangle.east,
              north: imageryProvider.rectangle.north
            });
            var imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
            imageryLayer.alpha = node.wcsAlpha != null ? node.wcsAlpha : 0.7; // 可配置透明度
            // 存储 bbox 用于 flyToLayerNode 精确定位
            var entryMeta = { type: 'wcs', object: imageryLayer, provider: imageryProvider, _imageUrl: imageUrl };
            if (covBbox && covBbox.west < covBbox.east && covBbox.south < covBbox.north) {
              entryMeta._wcsBbox = covBbox;
            }
            this._cesiumLayers.set(node.id, entryMeta);

            // ⚠️ 等待 SingleTileImageryProvider 就绪（大图 blob URL 需异步解码）
            if (!imageryProvider.ready) {
              console.log(`[${this.componentName}] ⏳ 等待 imageryProvider 就绪...`);
              var _tReady = performance.now();
              await new Promise(function(resolve) {
                var maxWait = 5000, interval = 100, elapsed = 0;
                var timer = setInterval(function() {
                  elapsed += interval;
                  if (imageryProvider.ready || elapsed >= maxWait) {
                    clearInterval(timer);
                    resolve();
                  }
                }, interval);
              });
              console.log(`[${this.componentName}] ✅ imageryProvider.ready = ${imageryProvider.ready} (${(performance.now() - _tReady).toFixed(0)}ms)`);
            }

            // 🔍 诊断日志：验证图层状态
            console.log(`[${this.componentName}] 🔍 WCS 图层状态:`, {
              show: imageryLayer.show,
              alpha: imageryLayer.alpha,
              rectangle: imageryLayer.rectangle,
              imageryLayerCount: viewer.imageryLayers.length,
              isDestroyed: imageryLayer.isDestroyed ? imageryLayer.isDestroyed() : 'N/A',
              providerReady: imageryProvider.ready,
              imageUrlType: imageUrl ? imageUrl.slice(0, 30) + '...' : 'null'
            });

            // 定位由 flyToLayerNode 统一处理，避免双重 flyTo 冲突
            console.log(`[${this.componentName}] ✅ WCS 图层加载成功: "${node.name}" → ${covName}`);
            break;
          }
          default: {
            // 默认当 XYZ 处理
            const provider = new Cesium.UrlTemplateImageryProvider({
              url: node.url,
              maximumLevel: 18
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'xyz', object: layer, provider });
          }
        }

        // 标记已加载（检查代数，防止超时后过期结果覆盖错误状态）
        if (this._loadGeneration.get(node.id) !== gen) {
          console.warn(`[${this.componentName}] ⚠️ 图层 "${node.name}" 加载结果已过期（已超时），丢弃`);
          this.cleanupPartialLayer(node.id);
          return;
        }

        this.loadedLayerIds[node.id] = true;
        // ⭐ 图层加载后强制重置布局：显示工具栏 + 滚动到顶
        this.$nextTick(function() {
          this.$nextTick(function() {
            var treeEl = this.$refs.treeContainer;
            if (!treeEl) return;
            var panel = treeEl.closest('.function-panel');
            if (!panel) return;
            var toolbar = panel.querySelector('.toolbar');
            var pb = panel.querySelector('.panel-body');
            var tw = panel.querySelector('.tree-wrapper');
            // 强制显示工具栏
            if (toolbar) toolbar.style.display = 'flex';
            // 重置所有滚动容器：panel-body、tree-wrapper、function-panel
            if (pb) { pb.scrollTop = 0; pb.scrollTo(0, 0); }
            if (tw) { tw.scrollTop = 0; tw.scrollTo(0, 0); }
            // 切换再恢复以触发重绘，防止浏览器保留旧的滚动位置
            if (toolbar) { toolbar.style.display = 'none'; toolbar.offsetHeight; toolbar.style.display = 'flex'; }
            // ⚠️ 关键修复：toolbar 显隐切换会导致浏览器调整 .function-panel 的 scrollTop，
            // 将 header/toolbar 滚出可视区域。必须重置 panel 自身的滚动位置。
            if (panel) { panel.scrollTop = 0; panel.style.overflowAnchor = 'none'; }
          }.bind(this));
        }.bind(this));

        // 清除错误状态（MVT 类型除外：readyPromise 超时错误需保留）
        // ⚠️ MVT readyPromise 超时后仍会添加图层（非阻塞），此时错误提示应保留
        if (layerType !== 'mvt' || !providerReadyError) {
          delete this.layerErrors[node.id];
        }
        // 记录加载顺序（用于超出上限时淘汰最旧图层）
        this._addToLoadOrder(node.id);
        console.log(`[${this.componentName}] ✅ 图层已加载: ${node.name} (当前共 ${this._cesiumLayers.size} 个)`);

        // 加载后飞至图层位置
        this.flyToLayerNode(node);
      })();

      try {
        await Promise.race([actualLoad, timeoutPromise]);
      } catch (error) {
        // 清理可能已部分创建的 Cesium 对象
        this.cleanupPartialLayer(node.id);

        // 增强错误信息提取（兼容 Cesium RequestErrorEvent 等非标准 Error）
        let errorMsg = error.message || '';
        if (!errorMsg) {
          // RequestErrorEvent / 网络错误：尝试提取有用信息
          if (error.statusCode) {
            errorMsg = `HTTP ${error.statusCode}`;
          } else if (error.name === 'RequestErrorEvent') {
            errorMsg = `CORS 跨域或网络请求失败 (${node.url})`;
          } else if (typeof error === 'object') {
            errorMsg = `未知错误 (${error.constructor?.name || Object.prototype.toString.call(error)})`;
          } else {
            errorMsg = String(error);
          }
        }
        // 如果错误消息中包含 url 信息但缺少 CORS/网络关键词，补充提示
        if (errorMsg && !/cors|跨域|网络|network|fetch|timeout|超时/i.test(errorMsg)) {
          // 检查是否来自 Cesium 的 RequestError（通常意味着 CORS 或网络问题）
          if (error.name === 'RequestErrorEvent' || error.constructor?.name === 'RequestErrorEvent') {
            errorMsg = `CORS 跨域或网络请求失败: ${errorMsg}`;
          }
        }
        console.error(`[${this.componentName}] ❌ 加载图层失败: ${node.name}`, error);
        // ⚠️ 关键修复：使用非阻塞式错误记录代替 alert()
        // 错误信息分类后存储在 layerErrors 对象中，由 TreeNodeItem 展示
        this.layerErrors[node.id] = {
          message: errorMsg,
          ...classifyLayerError(errorMsg)
        };
        // 确保 loadedLayerIds 状态正确
        this.loadedLayerIds[node.id] = false;
      } finally {
        clearInterval(timeoutId);
        this.loadingLayerIds[node.id] = false;
        this._loadLayerPromise.delete(node.id);
      }
    },

    /**
     * 清理部分创建的图层（加载失败时的回滚操作）
     */
    cleanupPartialLayer(nodeId) {
      const entry = this._cesiumLayers.get(nodeId);
      if (!entry) return;

      this._removeFromLoadOrder(nodeId);
      this._removeFromHibernatedOrder(nodeId);

      try {
        const viewer = this.getViewer();
        if (!viewer) return;

        if (entry.type === 'xyz' || entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'mvt' || entry.type === 'wcs' || entry.type === 'local-dem') {
          // 双重保险 + 不销毁
          entry.object.show = false;
          entry.object.alpha = 0.0;
          viewer.imageryLayers.remove(entry.object, false);
          if (!this._isWebGLLost) viewer.scene.requestRender();
        } else if (entry.type === 'geojson') {
          if (entry.object.clustering && entry.object.clustering.enabled) {
            try { entry.object.clustering.enabled = false; } catch (e) { /* ignore */ }
          }
          viewer.dataSources.remove(entry.object, false);
          viewer.scene.requestRender();
        } else if (entry.type === '3dtiles' || entry._is3d) {
          entry.object.show = false;
          viewer.scene.primitives.remove(entry.object);
        }
      } catch (e) {
        console.warn(`[${this.componentName}] ⚠️ 部分图层清理失败:`, e);
      }

      this._cesiumLayers.delete(nodeId);
    },

    /**
     * 安全销毁影像图层及其 Provider（仅用于组件卸载/WebGL上下文丢失场景）
     *
     * ⚠️ 设计决策：unloadCesiumLayer / cleanupPartialLayer 中不调用此方法
     *   运行时卸载图层仅做 hide + remove，不 destroy GPU 资源。
     *   原因：ImageryLayer.destroy() 会释放 GPU 纹理，但 Cesium 内部纹理缓存/
     *   图集可能仍持有引用，后续 map 交互（平移/缩放）触发 UniformArrayFloatVec4.set
     *   访问已销毁纹理导致 "Cannot read properties of undefined (reading 'red')" 崩溃。
     *   所有 GPU 资源在组件卸载时由 destroyAllCesiumLayers 统一清理。
     *
     * @param {ImageryLayer} imageryLayer - Cesium 影像图层
     * @param {ImageryProvider} [provider] - 可选 Provider（MVT 需要单独销毁）
     */
    _safeDestroyImageryLayer(imageryLayer, provider) {
      const viewer = this.getViewer();
      if (!viewer || !viewer.scene || viewer.scene.isDestroyed()) {
        // 场景已销毁，直接尝试清理
        try { imageryLayer.destroy(); } catch (e) { /* ignore */ }
        if (provider && typeof provider.destroy === 'function') {
          try { provider.destroy(); } catch (e) { /* ignore */ }
        }
        return;
      }

      const doDestroy = () => {
        try {
          if (imageryLayer && !imageryLayer.isDestroyed()) {
            imageryLayer.destroy();
          }
          if (provider && typeof provider.destroy === 'function') {
            try { provider.destroy(); } catch (e) { /* ignore */ }
          }
        } catch (e) {
          // 静默处理销毁异常
        }
      };

      // WebGL 上下文丢失：直接销毁（不需要等待渲染）
      if (this._isWebGLLost) {
        doDestroy();
        return;
      }

      // 策略1: 使用 scene.postRender 等待一帧渲染完成后再销毁
      let destroyed = false;
      const postRenderCleanup = () => {
        if (destroyed) return;
        destroyed = true;
        viewer.scene.postRender.removeEventListener(postRenderCleanup);
        doDestroy();
      };
      viewer.scene.postRender.addEventListener(postRenderCleanup);

      // 策略2: 超时回退（2秒后如果 postRender 还未触发，强制销毁）
      setTimeout(() => {
        if (!destroyed) {
          destroyed = true;
          viewer.scene.postRender.removeEventListener(postRenderCleanup);
          console.warn(`[${this.componentName}] ⚠️ postRender 超时，强制销毁图层`);
          // 使用双重 rAF 作为最后的回退
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              doDestroy();
            });
          });
        }
      }, 2000);

      // 请求新一帧渲染（确保 postRender 事件会触发）
      viewer.scene.requestRender();
    },

    /**
     * 💤 休眠图层：隐藏但保留在 Cesium 中（GPU 资源不释放）
     * 优先于活跃图层被卸载；用户重新勾选时瞬间唤醒（无网络请求）
     */
    _hibernateLayer(node) {
      const entry = this._cesiumLayers.get(node.id);
      if (!entry || !entry.object || entry.object.show === false) return;

      // 保存原始 alpha 值，唤醒时恢复（WCS 图层 alpha 通常为 0.7）
      if (entry.object.alpha !== undefined) {
        entry._preHibernateAlpha = entry.object.alpha;
        entry.object.alpha = 0.0;
      }
      entry.object.show = false;
      this.loadedLayerIds[node.id] = false;
      this._removeFromLoadOrder(node.id);
      this._removeFromHibernatedOrder(node.id);
      this._hibernatedOrder.push(node.id);

      const viewer = this.getViewer();
      if (viewer && !this._isWebGLLost) viewer.scene.requestRender();
      console.log(`[${this.componentName}] 💤 图层已休眠: "${node.name}" (type=${entry.type}, 休眠池=${this._hibernatedOrder.length})`);
    },

    /**
     * 🔔 唤醒休眠图层（恢复可见性，不重新加载）
     */
    _awakenLayer(node) {
      const entry = this._cesiumLayers.get(node.id);
      if (!entry || !entry.object) return;

      entry.object.show = true;
      // 恢复休眠前保存的原始 alpha（WCS 图层通常 0.7，其他 1.0）
      if (entry.object.alpha !== undefined) {
        entry.object.alpha = (entry._preHibernateAlpha != null) ? entry._preHibernateAlpha : 1.0;
        delete entry._preHibernateAlpha;
      }
      this.loadedLayerIds[node.id] = true;
      this._removeFromHibernatedOrder(node.id);
      this._addToLoadOrder(node.id);
      delete this.layerErrors[node.id];

      const viewer = this.getViewer();
      if (viewer && !this._isWebGLLost) viewer.scene.requestRender();
      console.log(`[${this.componentName}] 🔔 图层已唤醒: "${node.name}" (type=${entry.type})`);
    },

    /**
     * 从休眠队列中移出
     */
    _removeFromHibernatedOrder(nodeId) {
      const idx = this._hibernatedOrder.indexOf(nodeId);
      if (idx !== -1) this._hibernatedOrder.splice(idx, 1);
    },

    /**
     * 从 Cesium 移除图层
     */
    unloadCesiumLayer(node) {
      const viewer = this.getViewer();
      const entry = this._cesiumLayers.get(node.id);
      if (!entry) {
        console.warn(`[${this.componentName}] ⚠️ _cesiumLayers 中未找到 "${node.name}"，跳过卸载`);
        return;
      }

      try {
        switch (entry.type) {
          case 'xyz':
          case 'wms':
          case 'wmts':
          case 'mvt': {
            const beforeCount = viewer.imageryLayers.length;
            // 双重保险：show=false + alpha=0 确保图层不可见
            entry.object.show = false;
            entry.object.alpha = 0.0;
            const removed = viewer.imageryLayers.remove(entry.object, false);
            const afterCount = viewer.imageryLayers.length;
            console.log(
              `[${this.componentName}] 🗑️ 图层已移除: ${node.name}` +
              ` (集合: ${beforeCount}→${afterCount}, remove=${removed}, show=${entry.object.show}, alpha=${entry.object.alpha})`
            );
            if (!removed) {
              console.warn(`[${this.componentName}] ⚠️ remove 返回 false！图层 "${node.name}" 不在 imageryLayers 中`);
            }
            if (!this._isWebGLLost) {
              viewer.scene.requestRender();
            }
            break;
          }
          case 'geojson':
          case 'geocoding': {
            if (entry.object.clustering && entry.object.clustering.enabled) {
              try { entry.object.clustering.enabled = false; } catch (e) { /* ignore */ }
            }
            viewer.dataSources.remove(entry.object, true);
            viewer.scene.requestRender();
            break;
          }
          case 'local-terrain': {
            // 恢复之前的 terrainProvider
            viewer.scene.terrainProvider = this._previousTerrainProvider
              || new Cesium.EllipsoidTerrainProvider();
            this._previousTerrainProvider = null;
            console.log('[LayerTreeManager] ⛰️ Terrain Provider 已恢复为默认');
            break;
          }
          case 'local-terrain-tiles': {
            // 恢复为默认地形或之前的地形
            viewer.scene.terrainProvider = this._previousTerrainProvider
              || new Cesium.EllipsoidTerrainProvider();
            viewer.scene.globe.depthTestAgainstTerrain = false;
            this._previousTerrainProvider = null;
            console.log('[LayerTreeManager] 🌐 Terrain tiles Provider 已恢复为默认');
            break;
          }
          case 'wcs':
          case 'local-dem': {
            if (entry._is3d) {
              // 3D 网格：remove from scene.primitives
              entry.object.show = false;
              viewer.scene.primitives.remove(entry.object);
            } else {
              // 2D 叠加：remove from imageryLayers
              entry.object.show = false;
              entry.object.alpha = 0.0;
              viewer.imageryLayers.remove(entry.object, false);
            }
            if (entry._imageUrl && entry._imageUrl.startsWith('blob:')) {
              try { URL.revokeObjectURL(entry._imageUrl); } catch (e) { /* ignore */ }
            }
            if (!this._isWebGLLost) {
              viewer.scene.requestRender();
            }
            break;
          }
          case '3dtiles': {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
            if (!this._isWebGLLost) viewer.scene.requestRender();
            break;
          }
        }

        // ⭐ 注销实体拾取 + 关闭弹窗
        if (this._selectionManager) {
          this._selectionManager.unregisterLayer(node.id);
        }
        if (this._popupSelectedLayerId === node.id) {
          this.dismissEntityPopup();
        }
        this._cesiumLayers.delete(node.id);
        this._removeFromLoadOrder(node.id);
        this._removeFromHibernatedOrder(node.id);
        this.loadedLayerIds[node.id] = false;
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 移除图层失败:`, error);
      }
    },

    /**
     * 飞行至图层位置
     * 优先使用节点自定义坐标，其次根据图层类型推断位置
     */
    flyToLayerNode(node) {
      const viewer = this.getViewer();
      const Cesium = this.getCesium();
      if (!viewer || !Cesium) return;

      try {
        // ⭐ WCS 图层：优先用 DescribeCoverage 获取的真实边界框定位
        const wcsEntry = this._cesiumLayers.get(node.id);
        if (wcsEntry && wcsEntry._wcsBbox) {
          const bb = wcsEntry._wcsBbox;
          const flyLon = (bb.west + bb.east) / 2;
          const flyLat = (bb.south + bb.north) / 2;
          // ⭐ 使用 Cesium.Rectangle 作为目标，Cesium 自动计算最佳视角高度
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(bb.west, bb.south, bb.east, bb.north),
            duration: 2
          });
          console.log(`[${this.componentName}] 🎯 飞行至 WCS 边界框: ${node.name} (${flyLon.toFixed(4)}, ${flyLat.toFixed(4)})`);
          return;
        }

        // 1. 本地 DEM / WCS 3D / Terrain — 飞行至数据地理边界
        const entry = this._cesiumLayers.get(node.id);
        if (entry && entry._bounds) {
          const b = entry._bounds;
          const flyLon = (b.west + b.east) / 2;
          const flyLat = (b.south + b.north) / 2;
          viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(b.west, b.south, b.east, b.north),
            duration: 2
          });
          console.log(`[${this.componentName}] 🎯 飞行至数据实际范围: ${node.name} (${flyLon.toFixed(4)}, ${flyLat.toFixed(4)})`);
          return;
        }

        // 2. 回退：使用节点自定义中心坐标
        if (node.centerLon != null && node.centerLat != null) {
          const height = node.centerHeight || 50000;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              Number(node.centerLon),
              Number(node.centerLat),
              Number(height)
            ),
            duration: 2
          });
          console.log(`[${this.componentName}] 🎯 飞行至自定义坐标: ${node.name} (${node.centerLon}, ${node.centerLat})`);
          return;
        }

        // 3. GeoJSON / 3DTiles / WFS — 从已有 Cesium 对象获取范围
        const entry2 = entry || this._cesiumLayers.get(node.id);
        if (!entry2) return;

        if (entry2.type === 'geojson' && entry2.object) {
          viewer.flyTo(entry2.object).catch(() => {});
        } else if (entry2.type === '3dtiles' && entry2.object) {
          viewer.flyTo(entry2.object).catch(() => {});
        } else if ((entry2.type === 'wms' || entry2.type === 'wmts' || entry2.type === 'xyz') && entry2.provider) {
          // 影像图层尝试从 provider 获取范围
          // WebMapServiceImageryProvider 有 `rectangle` 属性
          const rect = entry2.provider.rectangle;
          if (rect) {
            viewer.camera.flyTo({
              destination: rect,
              duration: 2
            });
          } else {
            // 无范围信息的影像图层，飞至默认全球视角
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
              duration: 2
            });
          }
        } else if (entry.type === 'mvt' && entry.provider) {
          // MVT 图层的 rectangle 是 WebMercator 全球范围，飞到全球视图没有意义。
          // 尝试使用检测 MVT 源图层时获取的瓦片坐标来定位到数据区域
          const dz = entry._detectedDataZoom;
          const dx = entry._detectedTileX;
          const dy = entry._detectedTileY;
          if (dz != null && dx != null && dy != null) {
            // 将瓦片坐标 (x, y, z) 转换为经纬度（WebMercator 投影）
            const n = Math.PI - (2 * Math.PI * dy) / Math.pow(2, dz);
            const lon = (dx / Math.pow(2, dz)) * 360 - 180;
            const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
            const height = Math.max(5000, 20000000 / Math.pow(2, dz)); // 根据 zoom 级别估算合理高度
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
              duration: 2
            });
            console.log(`[${this.componentName}] 🎯 飞行至 MVT 数据位置: "${node.name}" (z=${dz} tile=${dx}/${dy} → ${lon.toFixed(4)}, ${lat.toFixed(4)}, h=${Math.round(height)})`);
          } else {
            // 无检测坐标，飞到深圳默认位置（常见 MVT 数据区域）
            console.log(`[${this.componentName}] 🎯 MVT 图层 "${node.name}" 无检测坐标，使用默认视角`);
          }
        }
      } catch (e) {
        // 飞行失败不阻塞主流程
        console.warn(`[${this.componentName}] ⚠️ 飞行至图层失败: ${node.name}`, e);
      }
    },

    /**
     * 动态加载 geotiff.js CDN（仅在首次 TIFF 请求时加载）
     */
    _ensureGeoTiff() {
      if (typeof window.GeoTIFF !== 'undefined') return Promise.resolve();
      if (this._geoTiffLoading) return this._geoTiffLoading;
      var self = this;
      this._geoTiffLoading = new Promise(function (resolve) {
        var script = document.createElement('script');
        script.src = '../../../src/components/utils/geotiff.bundle.min.js';
        script.onload = function () { console.log('[LayerTreeManager] 📦 geotiff.js 加载完成'); resolve(); };
        script.onerror = function () { console.warn('[LayerTreeManager] ⚠️ geotiff.js CDN 加载失败'); resolve(); };
        document.head.appendChild(script);
      });
      return this._geoTiffLoading;
    },

    _ensureGeoTiffTerrainProvider() {
      if (typeof window.GeoTiffTerrainProvider !== 'undefined') return Promise.resolve();
      if (this._terrainProviderLoading) return this._terrainProviderLoading;
      var self = this;
      this._terrainProviderLoading = new Promise(function (resolve) {
        var script = document.createElement('script');
        script.src = '../../../src/components/utils/GeoTiffTerrainProvider.js';
        script.onload = function () { console.log('[LayerTreeManager] ⛰️ GeoTiffTerrainProvider 加载完成'); resolve(); };
        script.onerror = function () { console.warn('[LayerTreeManager] ⚠️ GeoTiffTerrainProvider 加载失败'); resolve(); };
        document.head.appendChild(script);
      });
      return this._terrainProviderLoading;
    },

    _ensureLocalTerrainProvider() {
      if (typeof window.LocalTerrainProvider !== 'undefined') return Promise.resolve();
      if (this._localTerrainLoading) return this._localTerrainLoading;
      var self = this;
      this._localTerrainLoading = new Promise(function (resolve) {
        var script = document.createElement('script');
        script.src = '../../../src/components/utils/LocalTerrainProvider.js';
        script.onload = function () { console.log('[LayerTreeManager] 🌐 LocalTerrainProvider 加载完成'); resolve(); };
        script.onerror = function () { console.warn('[LayerTreeManager] ⚠️ LocalTerrainProvider 加载失败'); resolve(); };
        document.head.appendChild(script);
      });
      return this._localTerrainLoading;
    },

    /**
     * 🎨 对 WCS 栅格 PNG 应用色带映射，使灰度 DEM 数据肉眼可见
     * @param {Blob} blob - WCS 返回的 PNG blob
     * @param {string} covName - Coverage 名称（用于日志）
     * @returns {Promise<string>} Canvas data URL
     */
    _applyColorRamp(blob, covName) {
      var self = this;
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var blobUrl = URL.createObjectURL(blob);
        img.onload = function () {
          var w = img.width, h = img.height;
          if (w === 0 || h === 0) { resolve(blobUrl); return; }

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          var imgData = ctx.getImageData(0, 0, w, h);
          var data = imgData.data;

          // ── 第 1 遍：找到实际灰度范围，排除纯黑/纯白（nodata） ──
          var minGray = 255, maxGray = 0, validCount = 0;
          for (var pi = 0; pi < data.length; pi += 4) {
            var gr = (data[pi] + data[pi+1] + data[pi+2]) / 3;
            if (gr > 0.5 && gr < 254.5) { // 排除纯黑(0)和纯白(255)的nodata
              if (gr < minGray) minGray = gr;
              if (gr > maxGray) maxGray = gr;
              validCount++;
            }
          }
          console.log('[LayerTreeManager] 📊 灰度: ' + minGray.toFixed(2) + '~' + maxGray.toFixed(2) + ' 有效:' + validCount + '/' + (data.length/4));
          if (validCount < 50 || maxGray - minGray < 0.5) {
            // 色带无意义 → 返回原图（可能是已渲染的可视化图像）
            console.log('[LayerTreeManager] 🖼️ 栅格无需色带，直接显示原图');
            resolve(blobUrl);
            return;
          }
          var stretch = 255 / (maxGray - minGray);

          // ── 第 2 遍：拉伸 → 色带映射 ──
          for (var i = 0; i < data.length; i += 4) {
            var gray = (data[i] + data[i+1] + data[i+2]) / 3;
            if (gray <= 0.5 || gray >= 254.5) { data[i+3] = 0; continue; }

            // 对比度拉伸
            var t = Math.max(0, Math.min(1, (gray - minGray) * stretch));
            var r, g, b;

            if (t < 0.25)      { var s = t / 0.25;          r = Math.round(s * 255); g = 255; b = Math.round((1 - s) * 128); }
            else if (t < 0.5)  { var s = (t - 0.25) / 0.25; r = 255; g = Math.round(255 - s * 100); b = 0; }
            else if (t < 0.75) { var s = (t - 0.5) / 0.25;  r = 255; g = Math.round(155 - s * 155); b = Math.round(s * 100); }
            else               { var s = (t - 0.75) / 0.25; r = 255; g = Math.round(s * 255); b = Math.round(100 + s * 155); }

            data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
          }

          ctx.putImageData(imgData, 0, 0);
          var dataUrl = canvas.toDataURL('image/png');
          console.log('[LayerTreeManager] 🎨 色带已应用: w=' + w + ' h=' + h + ' → ' + covName);
          resolve(dataUrl);
        };
        img.onerror = function () {
          URL.revokeObjectURL(blobUrl);
          resolve(blobUrl); // 失败则直接使用原始图片
        };
        img.src = blobUrl;
      });
    },

    /**
     * 销毁所有 Cesium 图层（组件卸载时调用）
     * ⚠️ WebGL 上下文丢失时，跳过 rAF 和 .destroy()（需要有效上下文），仅移除引用让 GC 回收
     */
    destroyAllCesiumLayers() {
      const viewer = this.getViewer();
      if (!viewer) return;

      // ⭐ 注销所有已注册的实体拾取
      if (this._selectionManager) {
        this._selectionManager.unregisterAll();
      }
      this.dismissEntityPopup();

      this._cesiumLayers.forEach((entry, nodeId) => {
        try {
          if (entry.type === 'xyz' || entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'mvt') {
            entry.object.show = false;
            viewer.imageryLayers.remove(entry.object, false);
            // 组件卸载时安全销毁所有 GPU 资源
            this._safeDestroyImageryLayer(entry.object, entry.provider);
          } else if (entry.type === 'geojson' || entry.type === 'geocoding') {
            // GeoJSON 图层 + 地理编码图层：DataSource 类型
            if (entry.object.clustering && entry.object.clustering.enabled) {
              try { entry.object.clustering.enabled = false; } catch (e) { /* ignore */ }
            }
            viewer.dataSources.remove(entry.object, false);
            viewer.scene.requestRender();
          } else if (entry.type === 'wcs') {
            // WCS 栅格图层：ImageryLayer 类型
            entry.object.show = false;
            viewer.imageryLayers.remove(entry.object, false);
            this._safeDestroyImageryLayer(entry.object, entry.provider);
            // 释放 Blob URL
            if (entry._imageUrl && entry._imageUrl.startsWith('blob:')) {
              try { URL.revokeObjectURL(entry._imageUrl); } catch (e) { /* ignore */ }
            }
          } else if (entry.type === '3dtiles' || entry._is3d) {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
          }
        } catch (e) { /* ignore */ }
      });
      this._cesiumLayers.clear();
      this._layerLoadOrder = [];
      this._hibernatedOrder = [];
    },

    beforeSaveConfig() {
      // 确保数据是扁平结构（移除 children 字段）
      this.flatNodeList = this.flatNodeList.map(n => {
        const { children, ...flatNode } = n;
        return flatNode;
      });
      // 同步到 basePanel
      if (this.$refs.basePanel) {
        this.$refs.basePanel.configList = [...this.flatNodeList];
      }
    }
  }
};
</script>

<style scoped>
/* ========== 分区隐藏（本地 scoped，不依赖 FunctionPanelUIBase） ========== */
.section-hidden {
  display: none !important;
}

/* ========== 树形管理容器（流式布局，跟随 toolbar 之后） ========== */
.tree-manager-container {
  padding: 12px 8px;
}

/* ========== 树形工具栏 ========== */
.tree-toolbar {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  padding: 0 4px 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}

/* ========== 树形列表（max-height 限制 + 独立滚动） ========== */
.tree-wrapper {
  max-height: calc(75vh - 180px);
  min-height: 120px;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* ⭐ 禁用浏览器 scroll anchoring：checkbox 状态变化触发 DOM 更新时，
    浏览器不会自动调整滚动位置，防止 header/toolbar 被滚出可视区 */
  overflow-anchor: none;
}

/* ⭐ 树节点内禁止成为 scroll anchor 候选 */
.tree-wrapper * {
  overflow-anchor: none;
}

.tree-wrapper::-webkit-scrollbar {
  width: 6px;
}
.tree-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.tree-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(76,175,80,0.6), rgba(76,175,80,0.3));
  border-radius: 3px;
  border: 1px solid rgba(76,175,80,0.2);
}
.tree-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(76,175,80,0.8), rgba(76,175,80,0.5));
}

/* 空状态也是 flex 子元素，居中 */
.tree-empty {
  flex: 1 1 0%;
  min-height: 0;
}

.tree-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tree-btn-primary {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.tree-btn-primary:hover {
  background: #45a049;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.tree-btn-outline {
  background: rgba(255, 255, 255, 0.05);
  color: #b0b0b0;
  border-color: rgba(255, 255, 255, 0.12);
}

.tree-btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.2);
}

.tree-btn-icon {
  font-size: 14px;
}

/* ===== 分区切换按钮（toolbar 内） ===== */
.sec-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #b0b0b0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.sec-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.28);
}
.sec-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.toolbar-sep {
  display: inline-block;
  width: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
  align-self: stretch;
}

/* ===== Header 中的"工具"按钮 ===== */
.header-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #b0b0b0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: auto;
}
.header-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.25);
}
.header-tool-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ===== 分区切换按钮 active 状态 ===== */
.sec-btn-on {
  color: #4CAF50 !important;
  border-color: rgba(76, 175, 80, 0.5) !important;
  background: rgba(76, 175, 80, 0.15) !important;
}

/* ========== 树容器 ========== */
.tree-wrapper {
  margin-top: 4px;
}

ul.tree-root {
  list-style: none;
  margin: 0;
  padding: 0;
}

ul.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ========== 树节点（对齐 ant-design a-tree 视觉） ========== */
.tree-node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  margin: 1px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  min-height: 32px;
}

.tree-node-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.tree-node-row:hover .tree-node-actions {
  opacity: 1;
}

.tree-node-selected,
.tree-node-selected:hover {
  background: rgba(76, 175, 80, 0.15);
}

/* 展开/折叠箭头 */
.tree-node-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 3px;
  transition: transform 0.2s ease, background 0.15s;
}

.tree-node-arrow:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tree-arrow-icon {
  font-size: 10px;
  color: #808090;
  transition: transform 0.2s ease;
}

.tree-arrow-spacer {
  width: 10px;
  display: inline-block;
}

.tree-node-arrow-hidden {
  cursor: default;
}

/* 节点图标 */
.tree-node-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

/* 节点名称 */
.tree-node-name {
  font-size: 14px;
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
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
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

/* 操作按钮组 */
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
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
  line-height: 1;
}

.tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-action-btn-danger:hover {
  background: rgba(255, 59, 48, 0.2);
}

/* ========== 空状态 ========== */
.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.tree-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.tree-empty-text {
  font-size: 16px;
  color: #808090;
  margin-bottom: 8px;
}

.tree-empty-hint {
  font-size: 13px;
  color: #666;
}

/* ========== 删除警告 ========== */
.tree-delete-warning {
  margin-top: 8px;
  padding: 10px 14px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.25);
  border-radius: 8px;
  font-size: 13px;
  color: #ff6b6b;
}

.tree-delete-warning-icon {
  font-size: 20px;
  margin-bottom: 6px;
}

.tree-delete-warning-text {
  margin-bottom: 4px;
}

.tree-delete-count strong {
  color: #FFC107;
}

/* ========== 对话框 ========== */
.tree-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
}

.tree-dialog-panel {
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.tree-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tree-dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.tree-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #808090;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.tree-dialog-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e0e0e0;
}

.tree-dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.tree-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* 表单 */
.tree-form-group {
  margin-bottom: 14px;
}

.tree-form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #b0b0b0;
  margin-bottom: 6px;
}

.tree-form-label .required {
  color: #ff6b6b;
}

.tree-form-label .readonly-hint {
  color: #808090;
  font-weight: 400;
  font-size: 11px;
}

.tree-form-input {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.tree-form-input:focus {
  border-color: #4CAF50;
  background: rgba(255, 255, 255, 0.08);
}

.tree-form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-form-select {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}

.tree-form-select:focus {
  border-color: #4CAF50;
}

.tree-form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #b0b0b0;
}

.tree-form-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4CAF50;
  cursor: pointer;
}

/* ========== 对话框动画 ========== */
.tree-dialog-fade-enter-active,
.tree-dialog-fade-leave-active {
  transition: all 0.2s ease;
}

.tree-dialog-fade-enter-from,
.tree-dialog-fade-leave-to {
  opacity: 0;
}

.tree-dialog-fade-enter-from .tree-dialog-panel,
.tree-dialog-fade-leave-to .tree-dialog-panel {
  transform: scale(0.95);
}

/* ========== geoJsonStyle 编辑器 ========== */
.tree-style-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.tree-style-header:hover {
  background: rgba(255, 255, 255, 0.08);
}
.tree-style-toggle {
  font-size: 10px;
  color: #888;
  margin-left: 8px;
  flex-shrink: 0;
}
.style-indicator-set {
  font-size: 10px;
  background: #4CAF50;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 8px;
}
.style-indicator-empty {
  font-size: 10px;
  color: #666;
  margin-left: 8px;
}
.tree-style-body {
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  overflow: hidden;
}
.tree-style-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  background: #1a1a2e;
  color: #c0c0c0;
  border: none;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  outline: none;
}
.tree-style-textarea:focus {
  background: #1e1e36;
  color: #e0e0e0;
}
.tree-style-textarea::placeholder {
  color: #555;
}
.tree-style-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}
.tree-style-hint {
  font-size: 10px;
  color: #666;
  margin-left: auto;
}
/* ⭐ 列表区域（JsonConfigPanelBase 的默认渲染）：禁用 scroll anchoring */
::v-deep .config-list {
  overflow-anchor: none;
}
::v-deep .config-list * {
  overflow-anchor: none;
}
</style>
