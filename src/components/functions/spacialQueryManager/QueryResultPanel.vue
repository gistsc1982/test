<template>
  <div class="query-result-panel">
    <!-- 加载中 -->
    <div v-if="loading" class="result-status loading">
      <span class="spinner"></span>
      <span>正在查询...</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="result-status error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
      <button v-if="retryable" class="retry-btn" @click="$emit('retry')" type="button">重试</button>
    </div>

    <!-- 空状态（无结果） -->
    <div v-else-if="emptyResult" class="result-status empty">
      <span class="empty-icon">📭</span>
      <span>未找到符合条件的要素</span>
      <span v-if="layerName" class="layer-hint">（图层：{{ layerName }}）</span>
    </div>

    <!-- 结果列表 -->
    <div v-else-if="results.length > 0" class="result-list-container">
      <div class="result-header">
        <span class="result-count">共 {{ results.length }} 条结果</span>
        <button class="export-btn" @click="exportGeoJSON" type="button" title="导出 GeoJSON">📥 导出</button>
        <button class="clear-highlight-btn" @click="$emit('clear-highlight')" type="button" title="清除地图高亮">🗑️</button>
      </div>
      <div class="result-list">
        <div
          v-for="(feature, index) in results"
          :key="'f-' + index"
          class="result-item"
          :class="{ 'highlighted': index === highlightedIndex }"
          @click="$emit('fly-to', feature, index)"
          :title="index === highlightedIndex ? '点击取消高亮闪烁' : '点击高亮闪烁该要素'"
        >
          <span class="result-index">{{ index + 1 }}</span>
          <div class="result-props">
            <div v-for="(value, key) in getDisplayProps(feature)" :key="key" class="prop-row">
              <span class="prop-key">{{ key }}:</span>
              <span class="prop-value">{{ formatValue(value) }}</span>
            </div>
          </div>
          <button
            v-if="index === highlightedIndex"
            class="locate-btn"
            @click.stop="$emit('locate', feature)"
            title="定位到该要素"
            type="button"
          >🎯 定位</button>
          <span v-else class="fly-icon">📍</span>
        </div>
      </div>
    </div>

    <!-- 初始状态（无查询） -->
    <div v-else class="result-status initial">
      <span>选择 WFS 图层，绘制空间范围后点击查询</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QueryResultPanel',
  props: {
    results: { type: Array, default: function () { return []; } },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    layerName: { type: String, default: '' },
    retryable: { type: Boolean, default: true },
    highlightedIndex: { type: Number, default: -1 }
  },
  emits: ['fly-to', 'locate', 'retry', 'clear-highlight', 'export'],
  computed: {
    emptyResult() {
      return !this.loading && !this.error && this.results !== null && this.results.length === 0 && this.layerName !== '';
    }
  },
  methods: {
    /**
     * 获取用于展示的属性（最多显示 5 个字段）
     */
    getDisplayProps(feature) {
      if (!feature || !feature.properties) return {};
      var keys = Object.keys(feature.properties);
      if (keys.length === 0) return { '(无属性)': '' };

      // 最多展示 5 个字段
      var displayKeys = keys.slice(0, 5);
      var result = {};
      var self = this;
      displayKeys.forEach(function (k) {
        result[k] = feature.properties[k];
      });

      if (keys.length > 5) {
        result['...'] = '(共 ' + keys.length + ' 个字段)';
      }
      return result;
    },

    /**
     * 格式化属性值
     */
    formatValue(value) {
      if (value === null || value === undefined) return '<空>';
      if (typeof value === 'object') return JSON.stringify(value).substring(0, 100);
      var str = String(value);
      if (str.length > 80) return str.substring(0, 77) + '...';
      return str;
    },

    /**
     * 导出 GeoJSON 文件
     */
    exportGeoJSON() {
      var geojson = {
        type: 'FeatureCollection',
        features: this.results
      };
      var blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'spacial_query_result_' + new Date().toISOString().replace(/[:.]/g, '-') + '.geojson';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.query-result-panel {
  padding: 8px 12px;
  color: #ccc;
  font-size: 13px;
  min-height: 60px;
}

/* ====== 状态提示 ====== */
.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 6px;
  flex-wrap: wrap;
}
.result-status.loading { color: #FFA726; }
.result-status.error {
  color: #EF5350;
  background: rgba(239, 83, 80, 0.08);
  border: 1px solid rgba(239, 83, 80, 0.2);
}
.result-status.empty { color: #999; }
.result-status.initial { color: #666; }

.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,167,38,0.3);
  border-top-color: #FFA726;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-icon { font-size: 16px; }
.error-text { flex: 1; min-width: 150px; word-break: break-all; }
.retry-btn {
  padding: 4px 12px;
  background: rgba(239,83,80,0.2);
  color: #EF5350;
  border: 1px solid rgba(239,83,80,0.4);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.retry-btn:hover { background: rgba(239,83,80,0.3); }

.empty-icon { font-size: 16px; }
.layer-hint { color: #555; font-size: 12px; }

/* ====== 结果列表 ====== */
.result-list-container {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  overflow: hidden;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.result-count {
  flex: 1;
  font-weight: bold;
  color: #4CAF50;
  font-size: 13px;
}
.export-btn, .clear-highlight-btn {
  padding: 3px 10px;
  background: rgba(255,255,255,0.06);
  color: #aaa;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.export-btn:hover, .clear-highlight-btn:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}

.result-list {
  max-height: 320px;
  overflow-y: auto;
}
.result-list::-webkit-scrollbar { width: 4px; }
.result-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background 0.15s;
}
.result-item:hover {
  background: rgba(33,150,243,0.1);
}
.result-item.highlighted {
  background: rgba(255,214,0,0.12);
  border-left: 3px solid #FFD600;
}
.result-item:last-child { border-bottom: none; }

.result-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  background: rgba(33,150,243,0.3);
  color: #64B5F6;
  border-radius: 50%;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
}

.result-props {
  flex: 1;
  min-width: 0;
}
.prop-row {
  display: flex;
  gap: 6px;
  line-height: 1.6;
  font-size: 12px;
}
.prop-key {
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}
.prop-key::after { content: ''; }
.prop-value {
  color: #ddd;
  word-break: break-all;
}

.fly-icon {
  flex-shrink: 0;
  opacity: 0;
  font-size: 14px;
  transition: opacity 0.15s;
}
.result-item:hover .fly-icon { opacity: 1; }

.locate-btn {
  flex-shrink: 0;
  padding: 3px 10px;
  background: rgba(156, 39, 176, 0.2);
  color: #CE93D8;
  border: 1px solid rgba(156, 39, 176, 0.4);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.15s;
}
.locate-btn:hover {
  background: rgba(156, 39, 176, 0.35);
}
</style>
