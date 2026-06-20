import { createRouter, createWebHistory } from 'vue-router'
import GisView from '@/components/GisView.vue'
import CesiumComponentsView from '@/components/CesiumComponentsView.vue'
import CesiumMainView from '@/components/CesiumMainView.vue'
import PerformanceDashboard from '@/components/utils/PerformanceDashboard.vue'
import PerformancePage from '@/components/PerformancePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/gis',
      name: 'gis',
      component: GisView
    },
    // ⭐ 新增：CesiumBase 组件展示路由
    {
      path: '/components',
      name: 'components',
      component: CesiumComponentsView
    },
    // ⭐ 新增：CesiumMain 完整功能路由
    {
      path: '/cesium-main',
      name: 'cesium-main',
      component: CesiumMainView
    },
    // ⭐ 新增：性能监控页面路由（独立全页面）
    {
      path: '/performance',
      name: 'performance',
      component: PerformancePage
    },
    // 主页重定向到组件展示
    {
      path: '/',
      name: 'home',
      redirect: '/components'
    }
  ],
})

export default router
