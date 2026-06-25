let mapboxModule = null;
let loadingPromise = null;

export async function getMapbox() {
  if (mapboxModule) return mapboxModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const response = await fetch(new URL('./mapbox-gl.js', import.meta.url));
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
      
      mapboxModule = wrapperFn(
        moduleObj,
        moduleExports,
        () => { throw new Error('require not implemented'); },
        window,
        window,
        document
      );
      
      if (!mapboxModule || Object.keys(mapboxModule).length === 0) {
        mapboxModule = moduleObj.exports;
      }
      
      return mapboxModule;
    } catch (error) {
      console.error('[mapbox-gl-wrapper] 加载 mapbox-gl.js 失败:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

export default getMapbox;
