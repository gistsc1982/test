import { createRouter, createWebHistory } from 'vue-router'
import GisView from '@/views/GisView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/gis',
      name: 'gis',
      component: GisView
    },
    {
      path: '/',
      name: 'home',
      redirect: '/gis'
    }
  ],
})

export default router
