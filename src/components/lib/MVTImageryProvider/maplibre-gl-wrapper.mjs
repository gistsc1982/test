let maplibreModule = null;
let loadingPromise = null;

export async function getMaplibre() {
  if (maplibreModule) return maplibreModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const response = await fetch(new URL('./maplibre-gl.js', import.meta.url));
      const code = await response.text();

      const moduleExports = {};
      const moduleObj = { exports: moduleExports };

      const wrapperFn = new Function(
        'module',
        'exports',
        'require',
        'self',
        'window',
        'document',
        code + '\nreturn module.exports;'
      );

      maplibreModule = wrapperFn(
        moduleObj,
        moduleExports,
        () => { throw new Error('require not implemented'); },
        window,
        window,
        document
      );

      if (!maplibreModule || Object.keys(maplibreModule).length === 0) {
        maplibreModule = moduleObj.exports;
      }

      return maplibreModule;
    } catch (error) {
      console.error('[maplibre-gl-wrapper] 加载 maplibre-gl.js 失败:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

export default getMaplibre;
