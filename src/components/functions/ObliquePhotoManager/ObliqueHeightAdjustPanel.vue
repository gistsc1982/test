<template>
  <FunctionPanelUIBase
    :title="panelTitle"
    title-icon="🌏"
    :width="360"
    :max-height="'70vh'"
    :initial-x="initialX"
    :initial-y="initialY"
    :allow-minimize="true"
    close-event-name="obliqueHeightAdjustPanelClose"
    :auto-register="autoRegister !== undefined ? autoRegister : false"
    :registration-key="registrationKey || 'ObliqueHeightAdjustPanel'"
    :panel-instance-id="panelInstanceId"
    @close="handleClose"
    @minimize="handleMinimize"
    @expand="handleExpand"
  >
    <template v-if="selectedLayer">
      <!-- 推荐偏移值提示 -->
      <div
        v-if="selectedLayer.loaded && selectedLayer.recommendedOffset !== undefined && selectedLayer.recommendedOffset !== null"
        class="recommended-offset-banner"
      >
        <div class="banner-content">
          <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18h6M10 22h4M12 2v1M12 18v-2M12 14a4 4 0 100-8 4 4 0 000 8z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="banner-text">
            <div class="banner-main">检测到倾斜摄影地形高度较低</div>
            <div class="banner-suggestion">
              建议向上偏移 <span class="highlight">{{ selectedLayer.recommendedOffset.toFixed(1) }} 米</span> 以与大坐标模型底部对齐
            </div>
          </div>
          <button
            @click="applyRecommendedOffset"
            class="apply-recommended-btn"
            :disabled="Math.abs(selectedLayer.heightOffset - selectedLayer.recommendedOffset) < 0.1"
          >
            {{ Math.abs(selectedLayer.heightOffset - selectedLayer.recommendedOffset) < 0.1 ? '已应用' : '应用推荐值' }}
          </button>
        </div>
      </div>

      <!-- 当前高度偏移显示 -->
      <div class="current-height-card">
        <div class="card-header">
          <h4 class="card-title">当前高度偏移</h4>
          <span class="hint-icon" title="调整倾斜摄影的整体高度，正值向上，负值向下">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
            </svg>
          </span>
        </div>
        <div class="height-value">
          <span class="value">{{ (selectedLayer.heightOffset || 0).toFixed(2) }}</span>
          <span class="unit">米</span>
        </div>
      </div>

      <!-- 高度调整滑块 -->
      <div class="adjustment-section">
        <div class="section-label">
          <span>调整偏移</span>
          <span class="range-hint">{{ heightRange.min }}m ~ +{{ heightRange.max }}m</span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            :min="heightRange.min"
            :max="heightRange.max"
            :step="heightRange.step"
            :value="selectedLayer.heightOffset || 0"
            @input="onHeightSliderInput"
            @change="onHeightSliderChange"
            class="height-slider"
          />
          <div class="slider-track-fill"></div>
        </div>
        <div class="usage-hint">调整后使倾斜摄影与大坐标模型高度对齐</div>
      </div>

      <!-- 精确输入 -->
      <div class="precise-input-section">
        <label class="input-label">精确设置偏移（米）</label>
        <div class="input-group">
          <input
            type="number"
            :value="selectedLayer.heightOffset || 0"
            @change="onHeightInputChange"
            class="number-input"
            step="0.1"
          />
          <button @click="resetToZero" class="reset-btn" title="重置为0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1018 0M3 12h18M12 3v9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            重置
          </button>
        </div>
      </div>

      <!-- 快捷预设 -->
      <div v-if="uiConfig.showPresets !== false" class="preset-section">
        <div class="section-label">快捷预设</div>
        <div class="preset-grid">
          <button
            v-for="preset in presets"
            :key="preset.value"
            @click="applyPreset(preset.value)"
            class="preset-btn"
            :class="{ active: Math.abs((selectedLayer?.heightOffset || 0) - preset.value) < 0.1 }"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </template>

    <!-- 无选中图层提示 -->
    <div v-else class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-4M9 20v-6M9 20l6-6M9 20l6 6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="empty-text">请先在倾斜摄影面板中选择一个已加载的图层</div>
    </div>
  </FunctionPanelUIBase>
</template>

<script>
import FunctionPanelUIBase from '@componentsLib/FunctionPanelUIBase.mjs'
import '@componentsLib/FunctionPanelUIBase.mjs.css'
import SfcBase from '@/components/lib/SfcBase.mjs';
import '@/components/lib/SfcBase.mjs.css';
import { ConfigStrategyFactory } from './ConfigLoadStrategy.mjs';
import { validateConfigMetadata, formatValidationResult } from './TableNameValidator.mjs';

// ⭐ 导入面板配置元数据
import rawPanelConfig from './ObliqueHeightAdjustPanel.config.json';

// ⭐ 验证配置元数据
const validationResult = validateConfigMetadata(rawPanelConfig);
console.log(`[ObliqueHeightAdjustPanel] 📋 配置元数据验证结果:`);
console.log(formatValidationResult(validationResult));

// ⭐ 使用验证后的安全配置
const panelConfig = validationResult.safeConfig || rawPanelConfig;

/**
 * ObliqueHeightAdjustPanel - 倾斜摄影高度偏移调整面板
 *
 * 使用 FunctionPanelUIBase 作为容器，提供专业的高度偏移调整功能：
 * - 实时滑块调整
 * - 精确数值输入
 * - 快捷预设应用
 * - 推荐偏移值一键应用
 */
export default {
  name: 'ObliqueHeightAdjustPanel',
  components: {
    FunctionPanelUIBase
  },
  mixins: [SfcBase],
  props: {
    // ⭐ 接收多实例面板的属性
    registrationKey: {
      type: String,
      default: 'ObliqueHeightAdjustPanel'
    },
    panelInstanceId: {
      type: Number,
      default: null
    },
    autoRegister: {
      type: Boolean,
      default: false
    },
    // 初始位置配置
    initialX: {
      type: [Number, String],
      default: 'right'
    },
    initialY: {
      type: Number,
      default: 200
    },
    // 选中的倾斜摄影图层
    selectedLayer: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      componentName: 'ObliqueHeightAdjustPanel',
      // ⭐ 使用配置文件中的预设值（作为默认值）
      presets: panelConfig.presets || [
        { value: 0, label: '0m' },
        { value: 50, label: '50m' },
        { value: 100, label: '100m' },
        { value: 200, label: '200m' },
        { value: 500, label: '500m' },
        { value: 1000, label: '1km' }
      ],
      // ⭐ 使用配置文件中的高度范围（作为默认值）
      heightRange: panelConfig.heightRange || {
        min: -2000,
        max: 2000,
        step: 1
      },
      // ⭐ UI配置
      uiConfig: panelConfig.uiConfig || {
        showRecommendedOffset: true,
        showPreciseInput: true,
        showResetButton: true,
        showPresets: true
      },
      // ⭐ 配置加载策略实例
      _configStrategy: null
    };
  },
  computed: {
    panelTitle() {
      return this.selectedLayer ? `${this.selectedLayer.name} 高度调整` : '高度调整';
    }
  },
  created() {
    const dataSourceType = panelConfig.dataSource?.type || 'sqlite';
    this._configStrategy = ConfigStrategyFactory.createWithFallback(
      [dataSourceType, 'json'],
      { baseURL: 'http://localhost:8081' }
    );
    console.log(`[${this.componentName}] ✅ 配置加载策略已初始化: ${this._configStrategy.getName()}`);
    console.log(`[${this.componentName}] 📋 初始预设值（来自配置文件）:`, this.presets);
    this.loadPanelConfig();
  },
  methods: {
    async loadPanelConfig() {
      try {
        console.log(`[${this.componentName}] 📂 开始从数据库加载面板配置`);
        const rawData = await this._configStrategy.load(panelConfig);
        
        console.log(`[${this.componentName}] 📦 数据库返回数据:`, rawData);
        
        if (rawData && rawData.length > 0) {
          const savedConfig = rawData[0];
          console.log(`[${this.componentName}] 📋 找到已保存的配置:`, savedConfig);
          
          if (savedConfig.presets) {
            try {
              // 反序列化 JSON 字符串
              const loadedPresets = typeof savedConfig.presets === 'string' 
                ? JSON.parse(savedConfig.presets) 
                : savedConfig.presets;
              
              console.log(`[${this.componentName}] 🎯 加载到预设值:`, loadedPresets);
              
              // 验证预设值格式
              if (Array.isArray(loadedPresets) && loadedPresets.length > 0) {
                this.presets = loadedPresets;
                console.log(`[${this.componentName}] ✅ 预设配置已更新为数据库中的值`);
              } else {
                console.warn(`[${this.componentName}] ⚠️ 数据库中的预设值格式无效，使用默认值`);
              }
            } catch (parseError) {
              console.error(`[${this.componentName}] ❌ 解析预设配置失败:`, parseError);
            }
          } else {
            console.log(`[${this.componentName}] ℹ️ 数据库中没有预设配置，使用默认值`);
          }
          
          if (savedConfig.heightRange) {
            try {
              const loadedRange = typeof savedConfig.heightRange === 'string' 
                ? JSON.parse(savedConfig.heightRange) 
                : savedConfig.heightRange;
              if (typeof loadedRange === 'object') {
                this.heightRange = { ...this.heightRange, ...loadedRange };
                console.log(`[${this.componentName}] ✅ 高度范围配置已更新:`, this.heightRange);
              }
            } catch (parseError) {
              console.error(`[${this.componentName}] ❌ 解析高度范围配置失败:`, parseError);
            }
          }
          
          if (savedConfig.uiConfig) {
            try {
              const loadedUI = typeof savedConfig.uiConfig === 'string' 
                ? JSON.parse(savedConfig.uiConfig) 
                : savedConfig.uiConfig;
              if (typeof loadedUI === 'object') {
                this.uiConfig = { ...this.uiConfig, ...loadedUI };
                console.log(`[${this.componentName}] ✅ UI配置已更新:`, this.uiConfig);
              }
            } catch (parseError) {
              console.error(`[${this.componentName}] ❌ 解析UI配置失败:`, parseError);
            }
          }
        } else {
          console.log(`[${this.componentName}] ℹ️ 数据库中无配置记录，使用默认配置`);
          console.log(`[${this.componentName}] 💡 提示：可以调用 savePanelConfig() 将当前配置保存到数据库`);
        }
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 加载配置失败:`, error);
        console.log(`[${this.componentName}] ℹ️ 使用默认配置继续`);
      }
    },
    async savePanelConfig() {
      try {
        console.log(`[${this.componentName}] 📤 准备保存面板配置`);
        const configData = {
          id: panelConfig.panelId,
          presets: JSON.stringify(this.presets),
          heightRange: JSON.stringify(this.heightRange),
          uiConfig: JSON.stringify(this.uiConfig),
          updatedAt: new Date().toISOString()
        };
        const success = await this._configStrategy.save(panelConfig, [configData]);
        if (success) {
          console.log(`[${this.componentName}] ✅ 配置已保存`);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`[${this.componentName}] ❌ 保存失败:`, error);
        return false;
      }
    },
    handleClose() {
      console.log(`[${this.componentName}] 面板关闭`);
      this.$emit('close');
    },

    handleMinimize() {
      console.log(`[${this.componentName}] 面板已最小化`);
    },

    handleExpand() {
      console.log(`[${this.componentName}] 面板已展开`);
    },

    /**
     * 处理高度偏移滑块输入（实时更新显示，不触发Cesium更新）
     */
    onHeightSliderInput(event) {
      if (!this.selectedLayer) return;
      const newValue = parseFloat(event.target.value);
      // 只更新本地显示值，不触发 Cesium 更新，避免性能问题
      this.$emit('height-preview', { layer: this.selectedLayer, value: newValue });
    },

    /**
     * 处理高度偏移滑块变化（滑块释放时触发Cesium更新）
     */
    onHeightSliderChange(event) {
      if (!this.selectedLayer) return;
      const newValue = parseFloat(event.target.value);
      this.$emit('height-change', { layer: this.selectedLayer, value: newValue });
    },

    /**
     * 处理高度输入框变化
     */
    onHeightInputChange(event) {
      if (!this.selectedLayer) return;
      const newValue = parseFloat(event.target.value);
      if (isNaN(newValue)) return;
      this.$emit('height-change', { layer: this.selectedLayer, value: newValue });
    },

    /**
     * 应用推荐偏移值
     */
    applyRecommendedOffset() {
      if (!this.selectedLayer) return;
      if (this.selectedLayer.recommendedOffset === null || this.selectedLayer.recommendedOffset === undefined) {
        console.warn(`[${this.componentName}] 没有推荐偏移值`);
        return;
      }
      this.$emit('height-change', { layer: this.selectedLayer, value: this.selectedLayer.recommendedOffset });
    },

    /**
     * 应用预设值
     */
    applyPreset(value) {
      if (!this.selectedLayer) return;
      this.$emit('height-change', { layer: this.selectedLayer, value });
    },

    /**
     * 重置为0
     */
    resetToZero() {
      if (!this.selectedLayer) return;
      this.$emit('height-change', { layer: this.selectedLayer, value: 0 });
    }
  }
};
</script>

<style scoped>
/* 推荐偏移横幅 */
.recommended-offset-banner {
  margin-bottom: 16px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(76, 175, 80, 0.04) 100%);
  border: 1px solid rgba(76, 175, 80, 0.25);
  border-radius: 12px;
  animation: slideIn 0.3s ease-out;
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.banner-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #4CAF50;
  margin-top: 2px;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-main {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.banner-suggestion {
  font-size: 12px;
  color: #b0b0b0;
  line-height: 1.4;
}

.highlight {
  color: #FFC107;
  font-weight: 600;
}

.apply-recommended-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-recommended-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.apply-recommended-btn:active:not(:disabled) {
  transform: translateY(0);
}

.apply-recommended-btn:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: #666;
  cursor: not-allowed;
}

/* 当前高度卡片 */
.current-height-card {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(76, 175, 80, 0.08);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #b0b0b0;
}

.hint-icon {
  width: 18px;
  height: 18px;
  color: #808090;
  cursor: help;
  transition: color 0.2s;
}

.hint-icon:hover {
  color: #b0b0b0;
}

.height-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.height-value .value {
  font-size: 32px;
  font-weight: 700;
  color: #4CAF50;
  line-height: 1;
}

.height-value .unit {
  font-size: 14px;
  color: #808090;
}

/* 调整区域 */
.adjustment-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
}

.range-hint {
  font-size: 11px;
  color: #808090;
  font-weight: 400;
}

.slider-container {
  position: relative;
  margin-bottom: 8px;
}

.height-slider {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  z-index: 2;
}

.height-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
  transition: all 0.15s ease;
}

.height-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
}

.height-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #4CAF50;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
  transition: all 0.15s ease;
}

.height-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
}

.usage-hint {
  font-size: 11px;
  color: #808090;
  text-align: center;
}

/* 精确输入区域 */
.precise-input-section {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #b0b0b0;
}

.input-group {
  display: flex;
  gap: 8px;
}

.number-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  transition: all 0.2s;
}

.number-input:focus {
  outline: none;
  border-color: #4CAF50;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #b0b0b0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn svg {
  width: 16px;
  height: 16px;
}

.reset-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.3);
  color: #ff6b6b;
}

/* 预设区域 */
.preset-section {
  margin-bottom: 0;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
  color: #4CAF50;
}

.preset-btn.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #808090;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
  color: #808090;
  line-height: 1.5;
  max-width: 240px;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 480px) {
  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
