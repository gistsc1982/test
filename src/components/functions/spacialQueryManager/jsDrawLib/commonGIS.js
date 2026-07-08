
// GIS常用函数
export const commonGIS = {

}

// 创建地图
commonGIS.createMap = function (div, blnTerrain) {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYzhlMjI3ZC0yOTU5LTQ4YjMtYTA4Ni03NWJjNzFmYjJmMjEiLCJpZCI6NzkzMDIsImlhdCI6MTY1ODcyMDMxOH0.QWrO_62LVYFOmlYdZnfG4XIFpi9yLNdOgIntrmdDkTA';
    let myTerrain = null;
    if (blnTerrain) {
        myTerrain = Cesium.createWorldTerrain({
            requestWaterMask: true,
            requestVertexNormals: true
        });
    } else myTerrain = new Cesium.EllipsoidTerrainProvider({});

    let config = {
        terrainProvider: myTerrain, // 地形高程
        imageryProvider: new SGKJ_SDK.TdtImageryProvider({
            style: "img",
        }), // 底图
        scene3DOnly: true,
        infoBox: false, // 信息弹出框
        geocoder: false, // 位置查找工具
        homeButton: false, // 视角返回初始位置
        sceneModePicker: false, // 选择视角的模式（球体、平铺、斜视平铺）
        baseLayerPicker: false, // 图层选择器（地形影像服务）
        navigationHelpButton: false, // 导航帮助(手势，鼠标)
        animation: false, // 左下角仪表盘（动画器件）
        timeline: false, // 底部时间线
        fullscreenButton: true, // 全屏
        vrButton: false, // VR
        fullscreenElement: div
    };

    let viewer = new Cesium.Viewer(div, config);
    // 隐藏版权
    viewer._cesiumWidget._creditContainer.style.display = "none";
    // 深度检测
    viewer.scene.globe.depthTestAgainstTerrain = true;
    // 启用抗锯齿
    viewer.scene.postProcessStages.fxaa.enabled = true;
    // 去除时间原因影响模型颜色
    // viewer.scene.light = new Cesium.DirectionalLight({
    //     direction: new Cesium.Cartesian3(
    //         0.35492591601301104,
    //         -0.8909182691839401,
    //         -0.2833588392420772
    //     ),
    // });

    return viewer;
}

// 从Cartesian3转为经纬度，支持单个坐标或者坐标数组
commonGIS.positionToDegree = function (map, position, positionArr) {
    let result;
    var ellipsoid = map.scene.globe.ellipsoid;
    if (position != null) {
        let cartographic = ellipsoid.cartesianToCartographic(position);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var alt = cartographic.height;
        result = {
            longitude: lng,
            latitude: lat,
            height: alt
        };
    }
    else if (positionArr.length > 0) {
        result = [];
        positionArr.forEach(element => {
            // 笛卡尔转换为弧度
            let cartographic = ellipsoid.cartesianToCartographic(element);
            // 使用经纬度和弧度的转换，将WGS84弧度坐标系转换到目标值，弧度转度
            let lng = Cesium.Math.toDegrees(cartographic.longitude);
            let lat = Cesium.Math.toDegrees(cartographic.latitude);
            let alt = cartographic.height;
            let temp = {
                longitude: lng,
                latitude: lat,
                height: alt
            };
            result.push(temp);
        });
    }
    return result;
}

// 从经纬度转为Cartesian3
commonGIS.positionToCartesian3 = function (map, longitude, latitude, height) {
    let ellipsoid = map.scene.globe.ellipsoid;
    let result = Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid);
    return result;
}

// 经纬度定位
commonGIS.locateDegreePosition = function (map, position, height) {
    if (height) {
        map.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(position.x, position.y, height)
        });
    }
    else map.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(position.x, position.y, position.z)
    });
}

// 添加集中区域的反遮罩，positionArr为坐标数组
commonGIS.addMaskPolygon = function (map, positionArr, blnFlyTo) {
    let myMaskPolygon = map.entities.getById("myMaskPolygon");
    if (myMaskPolygon) map.entities.remove(myMaskPolygon);
    let myMaskPolyline = map.entities.getById("myMaskPolyline");
    if (myMaskPolyline) map.entities.remove(myMaskPolyline);

    // 遮罩
    let polygonEntity = new Cesium.Entity({
        id: "myMaskPolygon",
        polygon: {
            hierarchy: {
                // 添加外部区域为1/4半圆，设置为180会报错
                positions: Cesium.Cartesian3.fromDegreesArray([0, 0, 0, 90, 179, 90, 179, 0]),
                // 中心挖空的“洞”
                holes: [{
                    positions: positionArr
                }]
            },
            material: new Cesium.Color(15 / 255.0, 38 / 255.0, 84 / 255.0, 0.7)
        }
    })

    // 再创建一个边框的polyline实体，便于flyTo
    if (positionArr.length > 1) positionArr.push(positionArr[0]);
    let lineEntity = new Cesium.Entity({
        id: "myMaskPolyline",
        polyline: {
            positions: positionArr,
            width: 5,
            material: Cesium.Color.YELLOW,
            clampToGround: true
        }
    })

    map.entities.add(polygonEntity);
    map.entities.add(lineEntity);
    if (blnFlyTo) map.flyTo(lineEntity);
}

// 分屏对比联动
commonGIS.mapUpdateHandle = function (mapChange, mapUpdate) {
    if (!mapChange || !mapUpdate) return;
    let viewUpdate = function () {
        var mapChangeCamera = mapChange.camera;
        mapUpdate.camera.setView({
            destination: mapChangeCamera.position,
            orientation: {
                heading: mapChangeCamera.heading,
                pitch: mapChangeCamera.pitch,
                roll: mapChangeCamera.roll
            }
        });
    }
    return viewUpdate;
}
commonGIS.mapSplitComplete = function (map, mapSplit) {
    map.camera.percentageChanged = 0.01;
    map.camera.changed.addEventListener(this.mapUpdateHandle(map, mapSplit));

    mapSplit.camera.percentageChanged = 0.01;
    mapSplit.camera.changed.addEventListener(this.mapUpdateHandle(mapSplit, map))
}

// 取消分屏联动
commonGIS.mapSplitQuit = function (map, mapSplit) {
    // var bln = map.camera.changed.removeEventListener(this.mapUpdateHandle(map, mapSplit)) // 暂时无法移除监听
    // console.log(bln);
    // bln = mapSplit.camera.changed.removeEventListener(this.mapUpdateHandle(mapSplit, map)) // 暂时无法移除监听
    // console.log(bln);

    // 移除监听
    let mapListens = map.camera.changed._listeners;
    for (let i = mapListens.length - 1; i >= 0; i--) {
        if (mapListens[i].name == "viewUpdate") {
            mapListens.splice(i, 1);
        }
    }
    let mapSplitListens = mapSplit.camera.changed._listeners;
    for (let i = mapSplitListens.length - 1; i >= 0; i--) {
        if (mapSplitListens[i].name == "viewUpdate") {
            mapSplitListens.splice(i, 1);
        }
    }
}

// 移除鼠标事件
commonGIS.removeScreenHandler = function (map, inputType) {
    switch (inputType) {
        case "leftClick":
            map.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            break;
        case "leftDoubleClick":
            map.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            break;
        case "rightClick":
            map.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            break;
        default:
            break;
    }
}






