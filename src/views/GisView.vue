<template>
  <div class="gis-container">
    <iframe
      :src="gisUrl"
      class="gis-iframe"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const gisUrl = ref('')

onMounted(() => {
  // 指向 base-cesium-vue/dist 的 index.html
  // 通过 vite 静态资源服务访问
  gisUrl.value = '/base-cesium-vue/dist/index.html'
})
</script>

<style scoped>
.gis-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.gis-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
