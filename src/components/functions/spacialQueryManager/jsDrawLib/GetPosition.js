let x,y,A, B;
let MouseHeight;
let handlers = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
handlers.setInputAction(function (event) {
    let ray,position1,cartographic1;
    let feature;
    //获取相机射线
    ray = viewer.scene.camera.getPickRay(event.endPosition);
    //根据射线和场景求出在球面中的笛卡尔坐标
    position1 = viewer.scene.globe.pick(ray,viewer.scene);
    //获取该浏览器坐标的顶部数据
    feature = viewer.scene.pick(event.endPosition);
    cartographic1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
    if (feature == undefined) {
        A = Cesium.Math.toDegrees(cartographic1.longitude);
        B = Cesium.Math.toDegrees(cartographic1.latitude);
        MouseHeight = 0;
    }else if(feature instanceof Cesium.Cesium3DTileFeature){
        A = Cesium.Math.toDegrees(cartographic1.longitude);
        B = Cesium.Math.toDegrees(cartographic1.latitude);
        MouseHeight = 0;
    }else{
        let cartesian = viewer.scene.pickPosition(event.endPosition);
        if (Cesium.defined(cartesian) ){
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let lng = Cesium.Math.toDegrees(cartographic.longitude);
            let lat = Cesium.Math.toDegrees(cartographic.latitude);
            let height = cartographic.height;//模型高度
            A = lng;
            B = lat;
            let H = ()=>{
                if(parseFloat(height.toFixed(2))<0){return 0}
                else{
                    return parseFloat(height.toFixed(2));
                }
            };
            MouseHeight = H();
        }
    }
} , Cesium.ScreenSpaceEventType.MOUSE_MOVE);
