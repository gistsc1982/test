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
  // 指向 public/gis 的 index.html
  // 包含 base-cesium-vue/dist 和 public/cdn 的所有资源
  // 运行 npm run update-gis 来生成这些文件
  gisUrl.value = '/gis/index.html'
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
