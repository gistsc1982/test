import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// ⭐ 引入 Bootstrap 样式（cesiumBase 组件依赖）
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// ⭐ 参考 cesiumBase 方式：将 Cesium 设置为全局属性
// Cesium 通过 index.html 中的 script 标签加载，挂载到 window.Cesium
if (typeof window !== 'undefined' && window.Cesium) {
  app.config.globalProperties.cesium = window.Cesium
  app.config.globalProperties.Cesium = window.Cesium
  console.log('[main] ✅ Cesium 已设置为全局属性', {
    hasCesium: !!window.Cesium,
    hasViewer: !!window.Cesium.Viewer
  })
} else {
  console.warn('[main] ⚠️ Cesium 未加载，将在组件中动态检查')
}

app.mount('#app')
