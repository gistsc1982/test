//加载天地图在线地图

var tdtImagerLayerProvider = new Cesium.WebMapTileServiceImageryProvider({
  baseLayerPicker: false,
  timeline: false,
  homeButton: false,
  fullscreenButton: false,
  infoBox: false,
  sceneModePicker: false,
  navigationInstructionsInitiallyVisible: false,
  navigationHelpButton: false,
  geocoder: false,
  animation: false,
  // http://t0.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&TILEMATRIX=3&TILEROW=2&TILECOL=4&FORMAT=tiles&tk=dda338577652aefde985448d524c66f4
  url: "http://t0.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&FORMAT=tiles&tk=dda338577652aefde985448d524c66f4",
  // url: "http://t0.tianditu.com/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dda338577652aefde985448d524c66f4",

  // layer: "tdtBasicLayer",
  layer: "tdtvecbasiclayer",
  style: "default",
  // format: "image/jpeg",
  format: "tiles",
  tileMatrixSetID: "GoogleMapsCompatibleg",
  show: true,
  credit: new Cesium.Credit("天地图全球影像服务"),
  subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
  tilingScheme: new Cesium.GeographicTilingScheme(),//CSCG2000或WGS84
  // tilingScheme: new Cesium.WebMercatorTilingScheme(),
  tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
  maximumLevel: 18
});

//加载本地影像数据
/*
var imageryProvider = new Cesium.UrlTemplateImageryProvider({
  url: "http://localhost:8888/image_tiles/{z}/{x}/{y}.png",
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  fileExtension: 'png',
  minimumLevel: 0,
  maximumLevel: 20
});
*/
//跨域操作-Cesiumlab影像服务
/*
var imageryProvider = new Cesium.UrlTemplateImageryProvider({
  url: 'http://localhost:9002/api/wmts/gettile/931e1757c93743199219badb10a2e0df/{z}/{x}/{y}',
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  minimumLevel: 0,
  maximumLevel: 20,
  credit: 'http://www.bjxbsj.cn',
}, {
  show: true
});
*/

//加载本地地形数据

// var terrainLayer = new Cesium.CesiumTerrainProvider({
//   url: "http://localhost:8888/terrain_tiles",
//   // 请求照明
//   requestVertexNormals: true,
//   // 请求水波纹效果
//   requestWaterMask: true
// });
//查看器
var viewer = new Cesium.Viewer('cesiumContainer', {
  //需要进行可视化的数据源集合
  imageryProvider: tdtImagerLayerProvider,
  // terrainProvider: terrainLayer,
});

viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
  url: "http://t0.tianditu.com/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dda338577652aefde985448d524c66f4",
  layer: "tdtAnnoLayer",
  style: "default",
  format: "image/jpeg",
  tileMatrixSetID: "GoogleMapsCompatible",
  show: false
}));

var options = {
  camera: viewer.scene.camera,
  canvas: viewer.scene.canvas
};


//新增测试图层
// var layers = viewer.scene.imageryLayers;
// var showTest = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
//   url: "http://localhost:8888/image_tiles/{z}/{x}/{y}.png",
//   tilingScheme: new Cesium.WebMercatorTilingScheme(),
//   fileExtension: 'png',
//   minimumLevel: 0,
//   maximumLevel: 20
// }));

//设置边界矩形框
//设定矩形框左上及右下点的经纬度坐标\依次西、南、东、北，定位到海南
var rectangle = new Cesium.Rectangle(Cesium.Math.toRadians(109.77197811802674), Cesium.Math.toRadians(18.71889852769285),
  Cesium.Math.toRadians(111.18823330869694), Cesium.Math.toRadians(19.282354893873467));

//视图切换到指定区域
// viewer.scene.camera.flyTo({ destination: rectangle });

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(113.980758, 22.542848, 5000.0),
  orientation: {
    heading: Cesium.Math.toRadians(175.0),
    pitch: Cesium.Math.toRadians(-35.0),
    roll: 0.0
  }
})

// viewer.dataSources.add(Cesium.KmlDataSource.load('../../Apps/SampleData/kml/bikeRide.kml', options)).then(function (dataSource) {
//   viewer.clock.shouldAnimate = false;
//   var rider = dataSource.entities.getById('tour');
//   viewer.flyTo(rider).then(function () {
//     viewer.trackedEntity = rider;
//     viewer.selectedEntity = viewer.trackedEntity;
//     viewer.clock.multiplier = 30;
//     viewer.clock.shouldAnimate = true;
//   });
// });
