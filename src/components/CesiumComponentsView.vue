<template>
  <div class="cesium-components-container">
    <!-- 头部导航 -->
    <header class="components-header">
      <h1>CesiumBase 组件展示</h1>
      <p class="subtitle">直接使用 cesiumBase 源码组件</p>
      <nav class="component-nav">
        <button
          v-for="section in componentSections"
          :key="section.id"
          @click="activeSection = section.id"
          :class="{ active: activeSection === section.id }"
          class="nav-btn"
        >
          {{ section.name }}
        </button>
      </nav>
    </header>

    <!-- 工具栏按钮示例 -->
    <section v-show="activeSection === 'toolbar'" class="component-section">
      <h2>CesiumToolbarButton 示例</h2>
      <div class="demo-area">
        <div class="toolbar-container">
          <CesiumToolbarButton
            icon="🖥️"
            label="多实例"
            tooltip="创建 DualCanvasViewer 实例"
            :active="false"
            @click="handleButtonClick('多实例')"
          />
          <CesiumToolbarButton
            icon="🗺️"
            label="地图"
            tooltip="显示地图"
            :active="true"
            @click="handleButtonClick('地图')"
          />
          <CesiumToolbarButton
            icon="⚙️"
            label="设置"
            tooltip="打开设置面板"
            :disabled="false"
            @click="handleButtonClick('设置')"
          />
          <CesiumToolbarButton
            icon="🔧"
            label="工具"
            tooltip="工具箱"
            :disabled="true"
            @click="handleButtonClick('工具')"
          />
        </div>
      </div>
      <div class="code-example">
        <h3>使用示例：</h3>
        <pre><code>&lt;CesiumToolbarButton
  icon="🖥️"
  label="多实例"
  tooltip="创建 DualCanvasViewer 实例"
  :active="false"
  @click="handleClick"
/&gt;</code></pre>
      </div>
    </section>

    <!-- 功能面板示例 -->
    <section v-show="activeSection === 'panel'" class="component-section">
      <h2>FunctionPanelUIBase 示例</h2>
      <div class="demo-area">
        <button @click="showPanel = !showPanel" class="toggle-btn">
          {{ showPanel ? '关闭面板' : '打开面板' }}
        </button>

        <FunctionPanelUIBase
          v-if="showPanel"
          title="功能面板示例"
          :initial-position="{ x: 400, y: 200 }"
          :allow-minimize="true"
          :close-on-escape="true"
          @close="showPanel = false"
        >
          <template #default="{ isClosed }">
            <div class="panel-content">
              <h3>面板内容</h3>
              <p>这是一个使用 FunctionPanelUIBase 组件创建的功能面板。</p>
              <div class="form-group">
                <label>输入框示例：</label>
                <input type="text" placeholder="请输入内容..." />
              </div>
              <div class="form-group">
                <label>复选框示例：</label>
                <label class="checkbox-item">
                  <input type="checkbox" />
                  <span>选项 1</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" />
                  <span>选项 2</span>
                </label>
              </div>
              <div class="form-group">
                <button class="action-btn">确定</button>
                <button class="action-btn secondary">取消</button>
              </div>
            </div>
          </template>
        </FunctionPanelUIBase>
      </div>
      <div class="code-example">
        <h3>使用示例：</h3>
        <pre><code>&lt;FunctionPanelUIBase
  title="功能面板示例"
  :initial-position="{ x: 400, y: 200 }"
  :allow-minimize="true"
  @close="handleClose"
&gt;
  &lt;template #default&gt;
    &lt;div&gt;面板内容&lt;/div&gt;
  &lt;/template&gt;
&lt;/FunctionPanelUIBase&gt;</code></pre>
      </div>
    </section>

    <!-- 自定义面板示例 -->
    <section v-show="activeSection === 'custom'" class="component-section">
      <h2>自定义功能面板示例</h2>
      <div class="demo-area">
        <button @click="showCustomPanel = !showCustomPanel" class="toggle-btn">
          {{ showCustomPanel ? '关闭自定义面板' : '打开自定义面板' }}
        </button>

        <FunctionPanelUIBase
          v-if="showCustomPanel"
          title="⚙️ 数据管理面板"
          title-icon="📊"
          :initial-position="{ x: 500, y: 150 }"
          :allow-minimize="true"
          :enable-blur="true"
          @close="showCustomPanel = false"
        >
          <template #default>
            <div class="custom-panel-content">
              <div class="panel-section">
                <h4>📈 数据统计</h4>
                <div class="stat-grid">
                  <div class="stat-item">
                    <span class="stat-label">总数据量</span>
                    <span class="stat-value">1,234</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">已加载</span>
                    <span class="stat-value">987</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">待处理</span>
                    <span class="stat-value">247</span>
                  </div>
                </div>
              </div>

              <div class="panel-section">
                <h4>🎯 操作选项</h4>
                <div class="action-list">
                  <button class="action-item">🔄 刷新数据</button>
                  <button class="action-item">📤 导出报告</button>
                  <button class="action-item">⚙️ 配置设置</button>
                  <button class="action-item">🗑️ 清空缓存</button>
                </div>
              </div>
            </div>
          </template>
        </FunctionPanelUIBase>
      </div>
    </section>

    <!-- 配置说明 -->
    <section v-show="activeSection === 'docs'" class="component-section">
      <h2>配置说明</h2>
      <div class="docs-content">
        <h3>1. 别名配置</h3>
        <p>在 <code>vite.config.js</code> 中已配置以下别名：</p>
        <ul>
          <li><code>@cesiumBase</code> → <code>../cesiumBase/src</code></li>
          <li><code>@cesiumBaseComponents</code> → <code>../cesiumBase/src/components</code></li>
        </ul>

        <h3>2. 组件导入</h3>
        <pre><code>import CesiumToolbarButton from '@cesiumBaseComponents/CesiumToolbarButton.vue'
import FunctionPanelUIBase from '@cesiumBaseComponents/FunctionPanelUIBase.vue'</code></pre>

        <h3>3. 可用组件列表</h3>
        <ul>
          <li><code>CesiumToolbarButton.vue</code> - 工具栏按钮</li>
          <li><code>CesiumToolbar.vue</code> - 工具栏容器</li>
          <li><code>FunctionPanelUIBase.vue</code> - 功能面板基础组件</li>
          <li><code>JsonConfigPanelBase.vue</code> - JSON 配置面板</li>
          <li><code>SfcBase.vue</code> - SFC 基础组件</li>
          <li><code>TestSfc.vue</code> - 测试 SFC 组件</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// ⭐ 从 cesiumBase 直接导入组件
import CesiumToolbarButton from '@cesiumBaseComponents/CesiumToolbarButton.vue'
import FunctionPanelUIBase from '@cesiumBaseComponents/FunctionPanelUIBase.vue'

const activeSection = ref('toolbar')
const showPanel = ref(false)
const showCustomPanel = ref(false)

const componentSections = [
  { id: 'toolbar', name: '工具栏按钮' },
  { id: 'panel', name: '功能面板' },
  { id: 'custom', name: '自定义面板' },
  { id: 'docs', name: '配置说明' }
]

const handleButtonClick = (buttonName) => {
  console.log('按钮点击:', buttonName)
  // 这里可以添加按钮点击逻辑
}
</script>

<style scoped>
.cesium-components-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.components-header {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.components-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 32px;
}

.subtitle {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 16px;
}

.component-nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.nav-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.component-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.component-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.demo-area {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
}

.toolbar-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.toggle-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.toggle-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.code-example {
  background: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
}

.code-example h3 {
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 16px;
}

.code-example pre {
  margin: 0;
}

.code-example code {
  color: #f8f8f2;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.panel-content {
  padding: 15px;
}

.panel-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.checkbox-item input {
  cursor: pointer;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  background: #667eea;
  color: white;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #5568d3;
}

.action-btn.secondary {
  background: #6c757d;
}

.action-btn.secondary:hover {
  background: #5a6268;
}

.custom-panel-content {
  padding: 10px;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.stat-item {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  padding: 10px 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.action-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.docs-content {
  line-height: 1.8;
}

.docs-content h3 {
  margin: 25px 0 15px 0;
  color: #333;
  font-size: 18px;
}

.docs-content h3:first-child {
  margin-top: 0;
}

.docs-content p {
  margin-bottom: 10px;
  color: #666;
}

.docs-content code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #e83e8c;
}

.docs-content ul {
  margin-bottom: 15px;
  padding-left: 20px;
}

.docs-content li {
  margin-bottom: 8px;
  color: #666;
}

.docs-content pre {
  background: #2d2d2d;
  border-radius: 6px;
  padding: 15px;
  overflow-x: auto;
  margin-bottom: 15px;
}

.docs-content pre code {
  color: #f8f8f2;
  padding: 0;
  background: transparent;
}
</style>
