let distanceLine;
let distanceLineNum=0;
function T_Distance() {
    try{
        viewer.entities.removeById('distanceLine');
    }catch (e) {
    }
    let ClickNum=[];
    let handlerT = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handlerT.setInputAction(function(movement) {
        distanceLineNum++;
        if(distanceLineNum === 1){
            ClickNum.push(A,B,MouseHeight);
            distanceLine = viewer.entities.add({
                id: 'distanceLine',
                polyline: {
                    positions: new Cesium.CallbackProperty(function () {
                        return Cesium.Cartesian3.fromDegreesArrayHeights([ClickNum[0], ClickNum[1], ClickNum[2], A, B, MouseHeight]);
                    }, false),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED
                    })
                },
                position:new Cesium.CallbackProperty(function() {
                    return Cesium.Cartesian3.fromDegrees((parseFloat(ClickNum[0])+parseFloat(A))/2,(parseFloat(ClickNum[1])+parseFloat(B))/2,(parseFloat(ClickNum[2])+parseFloat(MouseHeight))/2);
                }, false),
                label : {
                    text: new Cesium.CallbackProperty(function() {
                        return "水平距离：" + (Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(ClickNum[0],ClickNum[1]),Cesium.Cartesian3.fromDegrees(A,B))).toFixed(2) + "米";
                    }, false),
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance : 1000000000,
                    scale:0.5,
                    pixelOffset:new Cesium.Cartesian2(0, -10),
                    backgroundColor:new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding:new Cesium.Cartesian2(10, 10),
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM
                }
            });
        }else {
            distanceLineNum=0;
            ClickNum.push(A,B,MouseHeight);
            handlerT.destroy();
            viewer.entities.removeById('distanceLine');
            distanceLine = viewer.entities.add({
                id: 'distanceLine',
                position: Cesium.Cartesian3.fromDegrees((parseFloat(ClickNum[0])+parseFloat(ClickNum[3]))/2,(parseFloat(ClickNum[1])+parseFloat(ClickNum[4]))/2,(parseFloat(ClickNum[2])+parseFloat(ClickNum[5]))/2),
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights(ClickNum),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED
                    })
                },
                label:{
                    show : true,
                    text: "水平距离：" + (Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(ClickNum[0],ClickNum[1]),Cesium.Cartesian3.fromDegrees(ClickNum[3],ClickNum[4]))).toFixed(2) + "米",
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance : 1000000000,
                    scale:0.5,
                    pixelOffset:new Cesium.Cartesian2(0, -10),
                    backgroundColor:new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding:new Cesium.Cartesian2(10, 10),
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM
                }
            });
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function T_Triangle() {
    try{
        viewer.entities.removeById('triangleLine');
        viewer.entities.removeById('lineX');
        viewer.entities.removeById('lineY');
        viewer.entities.removeById('lineZ');
    }catch (e) {
    }
    let trianArr=[];
    let distanceLineNum=0;
    let handlerT = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    let XLine;
    let X,Y,H;
    handlerT.setInputAction(function(movement) {
        distanceLineNum++;
        if(distanceLineNum === 1) {
            trianArr.push(A, B, MouseHeight);
            XLine = viewer.entities.add({
                id:'triangleLine',
                polyline: {
                    //由回调函数进行懒惰评估
                    positions: new Cesium.CallbackProperty(function () {
                        //返回给定一组经度，纬度和高度值的Cartesian3位置数组，其中经度和纬度以度为单位给出。/Cartesian3返回笛卡尔坐标
                        return Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0], trianArr[1], trianArr[2], A, B, trianArr[2], A, B, MouseHeight, trianArr[0], trianArr[1], trianArr[2]]);
                        //true当回调函数每次返回相同的值时，如果值发生变化，则为false
                    }, false),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED
                    })
                }
            });
        }else{
            distanceLineNum=0;
            trianArr.push(A,B,MouseHeight);
            handlerT.destroy();
            viewer.entities.removeById('triangleLine');
            XLine = viewer.entities.add({
                id:'triangleLine',
                polyline:{
                    positions:new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0], trianArr[1], trianArr[2], trianArr[3], trianArr[4], trianArr[5],trianArr[3], trianArr[4], trianArr[2], trianArr[0], trianArr[1], trianArr[2]]),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED
                    })
                }
            });

            // 空间
            let lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(trianArr[0],trianArr[1]),Cesium.Cartesian3.fromDegrees(trianArr[3],trianArr[4])).toFixed(2);
            //高度
            let height = Math.abs(trianArr[2]-trianArr[5]).toFixed(2);
            //直线距离
            let strLine =  (Math.sqrt(Math.pow(lineDistance,2) + Math.pow(height,2))).toFixed(2);
            X = viewer.entities.add({
                id:'lineX',
                position:Cesium.Cartesian3.fromDegrees((trianArr[0]+trianArr[3])/2,(trianArr[1]+trianArr[4])/2, Math.max(trianArr[2],trianArr[5])),
                label:{
                    text: '空间距离:'+lineDistance+'米',
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance : 1000000000,
                    scale:0.5,
                    pixelOffset:new Cesium.Cartesian2(0, -10),
                    backgroundColor:new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding:new Cesium.Cartesian2(10, 10),
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM
                }
            });
            H = viewer.entities.add({
                id:'lineZ',
                position:Cesium.Cartesian3.fromDegrees(trianArr[3],trianArr[4],(trianArr[2]+trianArr[5])/2),
                label:{
                    text: '高度差:'+height+'米',
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance : 1000000000,
                    scale:0.5,
                    pixelOffset:new Cesium.Cartesian2(0, -10),
                    backgroundColor:new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding:new Cesium.Cartesian2(10, 10),
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM
                }
            });
            Y = viewer.entities.add({
                id:'lineY',
                position:Cesium.Cartesian3.fromDegrees((trianArr[0]+trianArr[3])/2,(trianArr[1]+trianArr[4])/2,(trianArr[2]+trianArr[5])/2),
                label:{
                    text: '直线距离:'+strLine+'米',
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style:Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance : 1000000000,
                    scale:0.5,
                    pixelOffset:new Cesium.Cartesian2(0, -10),
                    backgroundColor:new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding:new Cesium.Cartesian2(10, 10),
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM
                }
            });
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function clear3D() {
    try {
        viewer.entities.removeById('triangleLine');
        viewer.entities.removeById('lineX');
        viewer.entities.removeById('lineY');
        viewer.entities.removeById('lineZ');
    }catch (e) {}
    try {
        viewer.entities.removeById('distanceLine');
    }catch (e) {}
    try {
        viewer.entities.removeById('overLine');
        viewer.entities.removeById('overLabel');
    }catch (e) {}
}