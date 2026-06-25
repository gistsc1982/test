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
    <!-- ===== 树形图层展示区域（before-list 插槽） ===== -->
    <template #before-list>
      <div class="tree-manager-container">
        <!-- 工具栏：添加根节点 -->
        <div class="tree-toolbar">
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
        <div class="tree-wrapper" v-if="treeData.length > 0">
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
</template>

<script>
import JsonConfigPanelBase from '@componentsLib/JsonConfigPanelBase.mjs';
import '@componentsLib/JsonConfigPanelBase.mjs.css';
import { ConfigStrategyFactory, configRegistry } from './ConfigLoadStrategy.mjs';
import { validateConfigMetadata, formatValidationResult } from './TableNameValidator.mjs';
import TreeNodeItem from './TreeNodeItem.vue';
import rawPanelMetadata from './LayerTreeManager.config.json';
import { MVTImageryProvider } from '@componentsLib/MVTImageryProvider/MVTImageryProvider.mjs';

const validationResult = validateConfigMetadata(rawPanelMetadata);
console.log(`[LayerTreeManager] 📋 配置元数据验证结果:`);
console.log(formatValidationResult(validationResult));

const panelMetadata = validationResult.safeConfig || rawPanelMetadata;

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
      signal: AbortSignal.timeout(PROBE_TIMEOUT)
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
        signal: AbortSignal.timeout(WMS_DETECT_TIMEOUT)
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
 * @returns {Promise<string[]>} 图层名称数组
 */
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
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) continue;

      const layerNames = parseMvtLayerNames(arrayBuffer);
      console.log(`[MVT检测] ✅ 检测到 ${layerNames.length} 个图层:`, layerNames);
      return layerNames;
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
  return [];
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
    if (!usedLayers.has(layerName)) {
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
    TreeNodeItem
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
        { "id": "folder-wfs",    "name": "WFS 要素服务",      "parentId": "root-ogc","nodeType": "folder", "sortOrder": 2, "visible": 1, "description": "Web Feature Service", "icon": "📊" },
        { "id": "wfs-usgs",      "name": "USGS 建筑物要素(WFS)", "parentId": "folder-wfs","nodeType": "layer","url":"https://carto.nationalmap.gov/arcgis/rest/services/structures/MapServer/WFSServer","sortOrder":1,"visible":1,"description":"USGS官方WFS","icon":"🏗️"},
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
        { "id": "xyz-versatiles-raster","name":"VersaTiles 浅色栅格底图(XYZ)","parentId":"root-xyz","nodeType":"layer","url":"https://tiles.versatiles.org/tiles/versatiles-light/{z}/{x}/{y}.png","sortOrder":9,"visible":1,"description":"VersaTiles免费浅色栅格瓦片，XYZ格式，全球覆盖，直接可用","icon":"🎨","centerLon":116.4,"centerLat":39.9,"centerHeight":50000}
      ],

      // Cesium 图层加载状态 — 记录已加载的图层 ID → Cesium 对象
      loadedLayerIds: {},

      // 图层加载中状态（防止重复点击和并发加载）
      loadingLayerIds: {},

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
      editingNode: null,
      editForm: this.createDefaultForm(),

      // 配置加载策略
      _configStrategy: null,

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
    }
  },

  beforeCreate() {
    // 非响应式 Cesium 图层对象存储（避免 Vue 响应式序列化 Cesium 对象）
    this._cesiumLayers = new Map();
    // 非响应式加载中 Promise 存储（防止并发加载同一图层）
    this._loadLayerPromise = new Map();
    // 代数计数器：防止超时后 IIFE 过期结果覆盖错误状态
    this._loadGeneration = new Map();
    // 图层加载顺序记录（用于超出上限时自动卸载最旧图层）
    this._layerLoadOrder = [];
    // 最大同时加载图层数（防止浏览器资源耗尽，MVT 图层尤其消耗 GPU 内存）
    this._maxActiveLayers = 2;
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
      { baseURL: 'http://localhost:8081' }
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
      this.loadConfig();

      // ⚠️ Cesium 资源保护：延迟设置（等待 viewer 就绪）
      this._setupCesiumProtections();
    });
  },

  beforeDestroy() {
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
      } catch (error) {
        // 加载失败时保留现有数据（内置示例或用户已添加的数据）
        console.error(`[${this.componentName}] ❌ 配置加载失败:`, error);
        console.warn(`[${this.componentName}] ⚠️ 保留现有数据（${this.flatNodeList.length} 条），不清空`);
        // 不执行 this.flatNodeList = [] — 保留现有数据
      }
    },

    /**
     * 覆盖保存配置方法，将树数据扁平化后保存
     */
    async saveConfig() {
      try {
        console.log(`[${this.componentName}] 📤 准备保存树形配置`);

        // 移除 children 字段（如果存在），确保保存的是扁平数据
        const saveData = this.flatNodeList.map(item => {
          const { children, loaded, loading, ...cleanItem } = item;
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
        centerHeight: node.centerHeight != null ? Number(node.centerHeight) : null
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
        centerHeight: this.editForm.centerHeight != null ? Number(this.editForm.centerHeight) : undefined
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

    /**
     * 保存前将树数据展平
     */
    // ==================== Cesium 图层集成 ====================

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

      if (this._cesiumLayers.has(node.id)) {
        this.unloadCesiumLayer(node);
      } else {
        // 清除上一次的错误状态
        delete this.layerErrors[node.id];
        this.loadCesiumLayer(node);
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

      // ⚠️ 图层数量上限检查：超出上限时自动卸载最旧的图层，防止浏览器资源耗尽
      if (this._cesiumLayers.size >= this._maxActiveLayers) {
        const oldestNodeId = this._layerLoadOrder[0];
        if (oldestNodeId && this._cesiumLayers.has(oldestNodeId)) {
          const oldestNode = this.flatNodeList.find(n => n.id === oldestNodeId);
          if (oldestNode) {
            console.warn(`[${this.componentName}] 🗑️ 图层数已达上限 (${this._maxActiveLayers})，自动卸载最旧图层: "${oldestNode.name}"`);
            this.unloadCesiumLayer(oldestNode);
          }
        } else {
          // 顺序记录不一致，重建
          this._layerLoadOrder = Array.from(this._cesiumLayers.keys());
        }
      }

      // 代数计数器：防止超时后 IIFE 仍成功而覆盖错误状态
      const gen = this._loadGeneration.get(node.id) || 0;
      this._loadGeneration.set(node.id, gen);

      const layerType = this.detectLayerType(node);
      console.log(`[${this.componentName}] 🌐 加载图层: ${node.name} (类型: ${layerType})`);

      // 整体超时 Promise（15 秒）
      const LAYER_LOAD_TIMEOUT = 15000;
      let timeoutId;

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          // 递增代数，使 IIFE 的后续成功操作失效
          this._loadGeneration.set(node.id, gen + 1);
          reject(new Error(`图层加载超时 (${LAYER_LOAD_TIMEOUT / 1000}秒)`));
        }, LAYER_LOAD_TIMEOUT);
      });

      const actualLoad = (async () => {
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
            let wmtsLayer = node.wmtsLayerName || '';
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
                    signal: AbortSignal.timeout(5000)
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
            const dataSource = await Cesium.GeoJsonDataSource.load(node.url, {
              clampToGround: true
            });
            // 验证数据源是否包含实际要素（防止 CORS/网络错误导致空数据源被标记为成功）
            const entityCount = dataSource.entities.values.length;
            if (entityCount === 0) {
              // 空数据源：未添加到 viewer，直接抛出明确错误
              const errMsg = layerType === 'wfs'
                ? 'WFS 服务未返回任何要素（可能被 CORS 拦截或服务无数据）'
                : 'GeoJSON 数据为空（可能被 CORS 拦截或 URL 不正确）';
              throw new Error(errMsg);
            }
            viewer.dataSources.add(dataSource);
            dataSource.name = node.name;
            this._cesiumLayers.set(node.id, { type: 'geojson', object: dataSource });
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
            const userSpecified = node.mvtSourceLayers || '';
            if (userSpecified.trim()) {
              sourceLayers = userSpecified.split(',').map(s => s.trim()).filter(Boolean);
              console.log(`[${this.componentName}] 📋 使用用户指定的源图层:`, sourceLayers);
            } else {
              console.log(`[${this.componentName}] 🔍 自动检测 MVT 源图层...`);
              sourceLayers = await detectMvtSourceLayers(node.url);
              console.log(`[${this.componentName}] 📊 检测结果: ${sourceLayers.length} 个图层 →`, sourceLayers);
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

            // 根据检测结果调整 zoom 范围（区域数据通常没有低级别瓦片）
            const detectedZoom = sourceLayers.length > 0 ? 10 : 0;
            mvtStyle.sources[node.id].minzoom = detectedZoom;
            console.log(`[${this.componentName}] 🔧 minzoom 调整为: ${detectedZoom}`);

            const provider = await MVTImageryProvider.create({
              style: mvtStyle,
              cesiumViewer: viewer,
              tileSize: 512,
              maximumLevel: 18,
              minimumLevel: 0,
              credit: node.name
            });

            // 🔬 瓦片健康检测：监控前 N 秒内的瓦片，检测是否有实际渲染内容
            const compName = this.componentName;
            const origRequestImage = provider.requestImage.bind(provider);
            let reqCount = 0;
            let succCount = 0;
            let emptyCount = 0;
            let failCount = 0;
            const nodeId = node.id;
            const nodeName = node.name;

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
                    const ctx = canvas.getContext('2d');
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

            // ⏱️ 延迟健康检查：5 秒后评估瓦片内容质量
            const TILE_HEALTH_DELAY = 5000;
            setTimeout(() => {
              // 图层已被卸载或组件已销毁，跳过检查
              if (!this._cesiumLayers || !this._cesiumLayers.has(nodeId)) return;

              const totalFinished = succCount + failCount;
              if (totalFinished === 0) {
                // 没有任何瓦片完成 — 可能加载极慢或服务无响应
                console.warn(`[${compName}] 🔬 健康检查: "${nodeName}" 5秒内无任何瓦片完成 (已请求${reqCount}个)`);
                return; // 不立即报错，可能还在加载中
              }
              if (succCount > 0 && emptyCount === succCount && failCount === 0) {
                // 所有成功瓦片都是空白的 — 服务返回了数据但无可渲染内容
                console.warn(`[${compName}] 🔬 健康检查: "${nodeName}" 全部 ${succCount} 个瓦片无内容`);
                const errorInfo = classifyLayerError('瓦片无渲染内容，可能 URL 不正确或服务数据为空');
                this.layerErrors[nodeId] = {
                  message: `瓦片全部为空 (${succCount}个)，URL可能不正确或服务无数据`,
                  ...errorInfo
                };
              } else if (failCount > succCount) {
                // 失败数超过成功数
                console.warn(`[${compName}] 🔬 健康检查: "${nodeName}" 失败${failCount} > 成功${succCount}`);
                const errorInfo = classifyLayerError('瓦片请求大量失败，服务不可达');
                this.layerErrors[nodeId] = {
                  message: `瓦片请求大量失败 (失败:${failCount}, 成功:${succCount})`,
                  ...errorInfo
                };
              } else {
                console.log(`[${compName}] 🔬 健康检查: "${nodeName}" 正常 (成功:${succCount}, 有内容:${succCount - emptyCount}, 失败:${failCount})`);
              }
            }, TILE_HEALTH_DELAY);

            await provider.readyPromise;
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            this._cesiumLayers.set(node.id, { type: 'mvt', object: layer, provider });
            console.log(`[${this.componentName}] ✅ MVT 矢量瓦片 "${node.name}" 加载成功`);
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
        // 清除错误状态（如果之前有）
        delete this.layerErrors[node.id];
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
        clearTimeout(timeoutId);
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

      try {
        const viewer = this.getViewer();
        if (!viewer) return;

        if (entry.type === 'xyz' || entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'mvt') {
          // 双重保险 + 不销毁
          entry.object.show = false;
          entry.object.alpha = 0.0;
          viewer.imageryLayers.remove(entry.object, false);
          if (!this._isWebGLLost) viewer.scene.requestRender();
        } else if (entry.type === 'geojson') {
          viewer.dataSources.remove(entry.object, false);
        } else if (entry.type === '3dtiles') {
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
              // 强制同步渲染，立即刷新 GPU 画面（跳过 rAF 队列等待）
              try { viewer.scene.render(viewer.clock.currentTime); } catch (e) { /* ignore */ }
            }
            break;
          }
          case 'geojson': {
            viewer.dataSources.remove(entry.object, true);
            break;
          }
          case '3dtiles': {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
            if (!this._isWebGLLost) viewer.scene.requestRender();
            break;
          }
        }

        this._cesiumLayers.delete(node.id);
        this._removeFromLoadOrder(node.id);
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
        // 1. 优先使用节点自定义中心坐标
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

        // 2. GeoJSON / 3DTiles / WFS — 从已有 Cesium 对象获取范围
        const entry = this._cesiumLayers.get(node.id);
        if (!entry) return;

        if (entry.type === 'geojson' && entry.object) {
          viewer.flyTo(entry.object).catch(() => {});
        } else if (entry.type === '3dtiles' && entry.object) {
          viewer.flyTo(entry.object).catch(() => {});
        } else if ((entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'xyz') && entry.provider) {
          // 影像图层尝试从 provider 获取范围
          // WebMapServiceImageryProvider 有 `rectangle` 属性
          const rect = entry.provider.rectangle;
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
          // 只在节点配置了 centerLon/centerLat 时才飞行（已在前面处理）。
          // 这里不做任何飞行，用户可手动缩放到数据区域。
          console.log(`[${this.componentName}] 🎯 MVT 图层 "${node.name}" 无自定义中心坐标，跳过飞行`);
        }
      } catch (e) {
        // 飞行失败不阻塞主流程
        console.warn(`[${this.componentName}] ⚠️ 飞行至图层失败: ${node.name}`, e);
      }
    },

    /**
     * 销毁所有 Cesium 图层（组件卸载时调用）
     * ⚠️ WebGL 上下文丢失时，跳过 rAF 和 .destroy()（需要有效上下文），仅移除引用让 GC 回收
     */
    destroyAllCesiumLayers() {
      const viewer = this.getViewer();
      if (!viewer) return;

      this._cesiumLayers.forEach((entry, nodeId) => {
        try {
          if (entry.type === 'xyz' || entry.type === 'wms' || entry.type === 'wmts' || entry.type === 'mvt') {
            entry.object.show = false;
            viewer.imageryLayers.remove(entry.object, false);
            // 组件卸载时安全销毁所有 GPU 资源
            this._safeDestroyImageryLayer(entry.object, entry.provider);
          } else if (entry.type === 'geojson') {
            viewer.dataSources.remove(entry.object, false);
          } else if (entry.type === '3dtiles') {
            entry.object.show = false;
            viewer.scene.primitives.remove(entry.object);
          }
        } catch (e) { /* ignore */ }
      });
      this._cesiumLayers.clear();
      this._layerLoadOrder = [];
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
/* ========== 树形管理容器 ========== */
.tree-manager-container {
  padding: 12px 8px;
  min-height: 200px;
}

/* ========== 工具栏 ========== */
.tree-toolbar {
  display: flex;
  gap: 8px;
  padding: 0 4px 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
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
</style>
