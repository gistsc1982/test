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

// ⭐ 将 THREE 设置为全局属性
// THREE 通过 load-three-globals.js 加载，挂载到 window.THREE
if (typeof window !== 'undefined' && window.THREE) {
  app.config.globalProperties.THREE = window.THREE
  console.log('[main] ✅ THREE 已设置为全局属性', {
    hasTHREE: !!window.THREE,
    hasBox3: !!window.THREE.Box3
  })
} else {
  console.warn('[main] ⚠️ THREE 尚未加载（load-three-globals.js 可能还在加载中），将在组件中动态检查')
  // 监听 THREE 加载完成事件
  window.addEventListener('ThreeJSGlobalLoaded', () => {
    app.config.globalProperties.THREE = window.THREE
    console.log('[main] ✅ THREE 已设置为全局属性（通过事件监听）', {
      hasTHREE: !!window.THREE,
      hasBox3: !!window.THREE.Box3
    })
  })
}

app.mount('#app')
