<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 显示导航栏和底部信息栏的路由（cesium-main 和 gis 不显示）
const showNavRoutes = ['/components', '/', '/performance']

const isComponentView = computed(() => {
  return showNavRoutes.includes(route.path)
})

const showNav = computed(() => {
  return showNavRoutes.includes(route.path)
})

// 🔧 只有 GIS iframe 模式才禁止滚动
const disableScroll = computed(() => {
  return route.path === '/gis'
})
</script>

<template>
  <div id="app" :class="{ 'disable-scroll': disableScroll, 'performance-mode': route.name === 'performance' }">
    <!-- 导航栏 -->
    <nav v-if="showNav" class="app-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>🌍 GIS Test 项目</h1>
          <span class="brand-subtitle">CesiumBase 组件集成测试</span>
        </div>
        <div class="nav-menu">
          <router-link to="/components" class="nav-link">
            📦 组件展示
          </router-link>
          <router-link to="/cesium-main" class="nav-link">
            🗺️ CesiumMain 功能
          </router-link>
          <router-link to="/performance" class="nav-link">
            🚀 性能监控
          </router-link>
          <router-link to="/gis" class="nav-link">
            🌐 GIS iframe 模式
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主内容 -->
    <div class="app-content" :class="{ 'app-content-full': !showNav, 'performance-page-mode': route.name === 'performance' }">
      <!-- 使用 keep-alive 保持 CesiumMain 存活，以便持续更新性能数据 -->
      <router-view v-slot="{ Component }">
        <keep-alive include="CesiumMain">
          <component :is="Component" :key="route.name" />
        </keep-alive>
      </router-view>
    </div>

    <!-- 底部信息栏 (仅在组件视图显示) -->
    <footer v-if="isComponentView" class="app-footer">
      <div class="footer-content">
        <p>✅ test 项目已集成 cesiumBase 源码组件</p>
        <p>🔧 Vite 别名配置: @cesiumBase → ../cesiumBase/src</p>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 🔧 性能页面特殊处理 - 完全禁用 flex 高度限制 */
#app.performance-mode {
  display: block;
  height: auto;
  min-height: auto;
}

#app.performance-mode .app-content {
  height: auto;
  min-height: 100vh;
  flex: none;
}

/* 🔧 只有在需要禁止滚动的页面才应用 overflow: hidden */
#app.disable-scroll {
  height: 100vh;
  overflow: hidden;
}

/* 当在非导航页面时，让 router-view 占满整个容器 */
#app:has(:not(.app-nav)) > :not(.app-nav):not(.app-footer) {
  flex: 1;
  height: 100%;
}

.app-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.nav-brand h1 {
  color: white;
  font-size: 24px;
  margin: 0;
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 5px;
  display: block;
}

.nav-menu {
  display: flex;
  gap: 15px;
}

.nav-link {
  padding: 10px 20px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 14px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.app-footer {
  background: #2d2d2d;
  color: white;
  padding: 20px 30px;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 5px 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 当在 GIS iframe 模式时，隐藏导航和页脚 */
.router-view-gis {
  height: 100vh;
}

/* 主内容区域 - 使用 flex 占据剩余空间 */
.app-content {
  flex: 1 1 auto;
  /* 🔧 允许内容滚动 */
  overflow-y: auto;
}

/* 全屏模式 - CesiumMain 等页面 */
.app-content-full {
  flex: 1 1 0%;
  height: 100%;
  min-height: 100vh;
}

/* 🔧 性能页面特殊处理 - 允许滚动 */
.app-content.performance-page-mode {
  overflow-y: auto !important;
  height: auto !important;
  min-height: 100vh;
  max-height: none !important;
}
</style>
