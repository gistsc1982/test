import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // ⭐ cesiumBase 别名 - 允许直接导入 cesiumBase 源码
      '@cesiumBase': path.resolve(__dirname, '../cesiumBase/src'),
      '@cesiumBaseComponents': path.resolve(__dirname, '../cesiumBase/src/components'),
      '@cesiumBaseComponentsFunctions': path.resolve(__dirname, '../cesiumBase/src/components/functions'),
      // ⭐ Cesium 别名 - 指向 public/gis/Cesium 目录
      'cesium': path.resolve(__dirname, './public/gis/Cesium'),
      // ⭐ 本地工具文件别名（位于 components 目录，与 cesiumBase 结构一致）
      '@componentsUtils': path.resolve(__dirname, './src/components/utils'),
      '@componentsFunctions': path.resolve(__dirname, './src/components/functions'),
      // ⭐ 打包后的组件别名
      '@componentsLib': path.resolve(__dirname, './src/components/lib'),
      '@componentsFunctionsLib': path.resolve(__dirname, './src/components/functions/lib')
    },
  },
  // ⭐ 配置服务器选项
  server: {
    fs: {
      // ⭐ 允许访问父级目录的文件
      allow: ['..']
    }
  },
  // ⭐ 配置全局变量以支持 Cesium 的 require 方式
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
