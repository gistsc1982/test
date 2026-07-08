/**
 * Created by WQ on 2019/11/4.
 */
function T_area() {
    let line;
    let xpLine;
    let overLine;
    let XXF;
    let clickNum=[];
    let handlerT = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    handlerT.setInputAction(function () {
        clickNum.push(A,B,MouseHeight);
        if (clickNum.length==6) {
            line = viewer.entities.add({
                id: 'line',
                polygon : {
                    hierarchy :
                        new Cesium.CallbackProperty(function() {
                            let callBackLineArr = [];
                            if (!(callBackLineArr.length == clickNum.length + 3)) {
                                callBackLineArr.push(...clickNum);
                            }
                            if (clickNum.length <= 3) {
                                callBackLineArr[3] = A;
                                callBackLineArr[4] = B;
                                callBackLineArr[5] = MouseHeight;
                            } else {
                                callBackLineArr[clickNum.length] = A;
                                callBackLineArr[clickNum.length + 1] = B;
                                callBackLineArr[clickNum.length + 2] = MouseHeight;
                            }
                            return new Cesium.PolygonHierarchy(new Cesium.Cartesian3.fromDegreesArrayHeights(callBackLineArr))
                        }, false),
                    outline : true,
                    perPositionHeight : true,
                    outlineColor : Cesium.Color.YELLOW,
                    material : Cesium.Color.DEEPSKYBLUE.withAlpha(0.5)
                },
            });
        }
        if (clickNum.length==3) {
            xpLine = viewer.entities.add({
                id: 'xpline',
                polyline: {
                    positions: new Cesium.CallbackProperty(function () {
                        return Cesium.Cartesian3.fromDegreesArrayHeights([clickNum[0], clickNum[1], clickNum[2], A, B, MouseHeight]);
                    }, false),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    })
                }
            });
        }
    } , Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handlerT.setInputAction(function () {
        handlerT.destroy();
        viewer.entities.removeById('line');
        viewer.entities.removeById('xpline');
        clickNum[clickNum.length-1]=clickNum[2];
        clickNum[clickNum.length-2]=clickNum[1];
        clickNum[clickNum.length-3]=clickNum[0];
        overLine = viewer.entities.add({
            id:'overLine',
            polygon : {
                hierarchy :new Cesium.PolygonHierarchy(new Cesium.Cartesian3.fromDegreesArrayHeights(clickNum)),
                outline : true,
                perPositionHeight : true,
                outlineColor : Cesium.Color.YELLOW,
                material : Cesium.Color.DEEPSKYBLUE.withAlpha(0.5),
                classificationType : Cesium.ClassificationType.BOTH
            }
        });

        let are=0;//面积
        let l = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(clickNum[0],clickNum[1]),Cesium.Cartesian3.fromDegrees(clickNum[3],clickNum[4]));
        let h = Math.abs(clickNum[5]-clickNum[2]);
        for (let a = 0 ; a < (clickNum.length/3) ; a++){
            let i = a*3;
            if(l > h){
                //顺时针
                if(i==0){
                    let length = Math.sqrt(Math.pow(Math.abs(clickNum[5]-clickNum[2]),2) + Math.pow(l,2));//第一条边长
                    are+=(length*(Math.abs(clickNum[8]-clickNum[5])))/2;//第一个三角形面积
                }
                else{
                    let height1 = Math.abs(clickNum[i + 5] - clickNum[i + 2]); //第二个h
                    let length2 = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(clickNum[i], clickNum[i + 1]), Cesium.Cartesian3.fromDegrees(clickNum[i + 3], clickNum[i + 4]));
                    let length3 = Math.sqrt(Math.pow(height1, 2) + Math.pow(length2, 2));//底边长
                    if(i*3-3 < clickNum.length){

                    }
                    else{
                        let height2 = Math.abs(clickNum[i + 5] - clickNum[2]);//左边高度
                        are += length3 * height2 / 2;//第二个三角形面积
                        break;
                    }
                }
            }else{
                //逆时针
                if (i==0){
                    let length = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(clickNum[3],clickNum[4]),Cesium.Cartesian3.fromDegrees(clickNum[6],clickNum[7]));//第一条边长
                    are+=(length*(Math.abs(clickNum[5]-clickNum[2])))/2;//第一个三角形面积
                }else{
                    let height1 =Math.abs(clickNum[8]-clickNum[11]); //第二个h
                    let length2 = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(clickNum[0],clickNum[1]),Cesium.Cartesian3.fromDegrees(clickNum[9],clickNum[10]));
                    are+=(height1*length2)/2;//第二个三角形面积
                }
            }
        }

        let z=0;
        let turfAre = [];
        for(let i = 0 ; i<(clickNum.length/3);i++){
            turfAre.push([clickNum[i*3],clickNum[i*3+1]]);
            z+=clickNum[i*3+2];
        }
        let polygon = turf.polygon([turfAre]);
        let area = turf.area(polygon);
        let features = turf.featureCollection([
            turf.points(turfAre)
        ]);
        let center = turf.center(features.features[0]);
        XXF = viewer.entities.add({
            id :'overLabel',
            position: Cesium.Cartesian3.fromDegrees(center.geometry.coordinates[0],center.geometry.coordinates[1],z/(clickNum.length/3)),
            label : {
                text: (area>are?area.toFixed(2):are.toFixed(2))+"平方米",
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

        //发光线条
        // let color = '#' + Math.random().toString(16).substr(-6);
        // lightLine.polyline.material = new Cesium.PolylineGlowMaterialProperty({
        //                 glowPower: 0.3,
        //                 color: Cesium.Color.fromCssColorString(color),
        //             })
        // let lightLine = viewer.entities.add({
        //     name : 'aGlowLine',
        //     polyline : {
        //         positions: Cesium.Cartesian3.fromDegreesArrayHeights(clickNum),
        //         width: 20,
        //         material:new Cesium.PolylineGlowMaterialProperty({
        //             glowPower: 0.3,
        //             color: Cesium.Color.YELLOW,
        //         })
        //     }
        // })
        //
        //
        // let color = '#' + Math.random().toString(16).substr(-6);
        // lightLine.polyline.material = Cesium.PolylineGlowMaterialProperty({
        //     glowPower: 0.3,
        //     color: Cesium.Color.fromCssColorString(color),
        // });

        //透视entity
        /*let defaults = {
            depthTest : {
                enabled : false
            }
        };
        let rs = Cesium.RenderState.fromCache(defaults);
        let polygon1 = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(new Cesium.Cartesian3.fromDegreesArrayHeights(clickNum)),
            outline : true,
            perPositionHeight : true,
            outlineColor : Cesium.Color.YELLOW,
            material : Cesium.Color.DEEPSKYBLUE.withAlpha(0.5)
        });
        let obj = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
                geometry: polygon1
            }),
            appearance: new Cesium.MaterialAppearance({
                color:Cesium.Color.DEEPSKYBLUE.withAlpha(0.5),
                renderState:rs
            })
        });
        viewer.scene.primitives.add(obj);*/
        // T_area();
    } , Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK );
}
