/**
 * CesiumEventManager - Cesium 事件管理器
 *
 * 提供 Cesium 就绪状态的事件驱动机制
 * 替代轮询检查，提升性能
 */

class CesiumEventManager {
  constructor() {
    this.isReady = false;
    this.listeners = new Set();
    this.cesiumInstance = null;
    this.viewerInstance = null;
    this.checkInterval = null;
    this.checkAttempts = 0;
    this.maxAttempts = 50;
  }

  init() {
    if (typeof window === 'undefined') return;

    if (this.checkCesiumReady()) {
      this.setReady();
      return;
    }

    this.setupGlobalListener();
    this.startPolling();
  }

  checkCesiumReady() {
    if (typeof window === 'undefined') return false;
    const cesiumReady = typeof window.Cesium !== 'undefined';
    const viewerReady = typeof window.__cesiumViewer__ !== 'undefined';
    return cesiumReady && viewerReady;
  }

  setupGlobalListener() {
    window.addEventListener('cesium-ready', this.handleCesiumReady);
    window.addEventListener('cesium-viewer-ready', this.handleViewerReady);
  }

  removeGlobalListener() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('cesium-ready', this.handleCesiumReady);
    window.removeEventListener('cesium-viewer-ready', this.handleViewerReady);
  }

  handleCesiumReady = () => {
    console.log('[CesiumEventManager] 📡 收到 cesium-ready 事件');
    this.cesiumInstance = window.Cesium;
    if (window.__cesiumViewer__) {
      this.setReady();
    }
  };

  handleViewerReady = () => {
    console.log('[CesiumEventManager] 📡 收到 cesium-viewer-ready 事件');
    this.viewerInstance = window.__cesiumViewer__;
    if (window.Cesium) {
      this.setReady();
    }
  };

  startPolling() {
    if (this.checkInterval) return;

    this.checkAttempts = 0;
    this.checkInterval = setInterval(() => {
      this.checkAttempts++;

      if (this.checkCesiumReady()) {
        this.setReady();
        this.stopPolling();
      } else if (this.checkAttempts >= this.maxAttempts) {
        console.warn('[CesiumEventManager] ⏰ Cesium 初始化检查超时');
        this.stopPolling();
      }
    }, 100);
  }

  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  setReady() {
    if (this.isReady) return;

    this.isReady = true;
    this.cesiumInstance = window.Cesium;
    this.viewerInstance = window.__cesiumViewer__;

    console.log('[CesiumEventManager] ✅ Cesium 已就绪');

    this.stopPolling();
    this.notifyListeners();
    this.dispatchGlobalEvent();
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.cesiumInstance, this.viewerInstance);
      } catch (error) {
        console.error('[CesiumEventManager] ❌ 监听器执行失败:', error);
      }
    });
  }

  dispatchGlobalEvent() {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('cesium-all-ready', {
      detail: {
        cesium: this.cesiumInstance,
        viewer: this.viewerInstance
      }
    });
    window.dispatchEvent(event);
  }

  onReady(listener) {
    if (typeof listener !== 'function') {
      console.warn('[CesiumEventManager] ⚠️ 监听器必须是函数');
      return () => {};
    }

    if (this.isReady) {
      try {
        listener(this.cesiumInstance, this.viewerInstance);
      } catch (error) {
        console.error('[CesiumEventManager] ❌ 监听器执行失败:', error);
      }
    } else {
      this.listeners.add(listener);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  async ready() {
    return new Promise((resolve) => {
      const unsubscribe = this.onReady((cesium, viewer) => {
        unsubscribe();
        resolve({ cesium, viewer });
      });
    });
  }

  getCesium() {
    return this.cesiumInstance;
  }

  getViewer() {
    return this.viewerInstance;
  }

  reset() {
    this.isReady = false;
    this.cesiumInstance = null;
    this.viewerInstance = null;
    this.listeners.clear();
    this.stopPolling();
  }

  destroy() {
    this.stopPolling();
    this.removeGlobalListener();
    this.listeners.clear();
    this.isReady = false;
    this.cesiumInstance = null;
    this.viewerInstance = null;
  }
}

// 创建全局单例（优先使用已存在的全局实例，确保只有一个实例）
const existingManager = typeof window !== 'undefined' && window.__cesiumEventManager__;
const eventManager = existingManager || new CesiumEventManager();

// 如果是新创建的实例，注册到全局并初始化
if (!existingManager && typeof window !== 'undefined') {
  window.__cesiumEventManager__ = eventManager;

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      eventManager.init();
    });
  } else {
    eventManager.init();
  }
}

export default eventManager;