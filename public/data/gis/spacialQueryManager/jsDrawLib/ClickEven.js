function clickEven() {
    let lastNum;
    let lastPoi;
    handlers.setInputAction(function (event) {
        if (lastPoi || lastPoi === 0) {
            polygonArr[lastPoi].polygon.material = Cesium.Color.fromCssColorString('rgba(0,0,0,0.1)');
        }
        feature = viewer.scene.pick(event.position);
        if (typeof (feature) != 'undefined') {
            let idIsNotNull = false;
            Object.keys(feature).forEach(function (key) {
                if (key == "id") idIsNull = true;
            })
            if (idIsNull) {
                if (feature.id) {
                    if (typeof (feature.id._id) != 'number') {
                        if (lastNum) {
                            pointArr[lastNum].point.color = Cesium.Color.BLUE;
                            pointArr[lastNum].point._pixelSize.setValue(12);
                        }
                        try {
                            /**
                             * feature.id._id.split('*')
                             * 0-图片名称
                             * 1-heading
                             * 2-qjtAtt所在下标
                             * */
                            let lon = qjtAtt[feature.id._id.split('*')[2]].lon;
                            let lat = qjtAtt[feature.id._id.split('*')[2]].lat;
                            let heading = qjtAtt[feature.id._id.split('*')[2]].heading;

                            let bouSph = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(lon, lat, 8.0), 35);

                            viewer.scene.camera.flyToBoundingSphere(bouSph, {
                                orientation: {
                                    heading: Cesium.Math.toRadians(heading),
                                    pitch: Cesium.Math.toRadians(-30.0)
                                    // roll : 0.0
                                }
                            });

                            document.getElementById('cesiumContainer').style.width = "50%";
                            document.getElementById('Area_2D').style.display = 'block';
                            document.getElementById('switchQj').style.display = 'block';

                            let material = mesh.material;
                            material.map.needsUpdate = true;
                            let url = './CesiumViewer/map/panorama1/' + feature.id._id.split('*')[0] + '.jpg';
                            material.map = loader.load(url);

                            // pointArr[2106].point
                            pointArr[feature.id._id.split('*')[2]].point.color = Cesium.Color.fromCssColorString('rgba(78,255,136,0.7)');
                            pointArr[feature.id._id.split('*')[2]].point._pixelSize.setValue(200);

                            lastNum = feature.id._id.split('*')[2];
                        } catch (e) {

                        }
                    } else {
                        polygonArr[feature.id.id].polygon.material = Cesium.Color.fromCssColorString('rgba(96,255,238,0.5)');
                        lastPoi = feature.id.id;
                    }
                }
            }
        }

        // alert(feature._id);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
clickEven();

function wheelEven() {
    handlers.setInputAction(function (event) {
        if (Cesium.Ellipsoid.WGS84.cartesianToCartographic(viewer.scene.camera.position).height > 160) {
            document.getElementById('cesiumContainer').style.width = "100%";
            document.getElementById('Area_2D').style.display = 'none';
            document.getElementById('switchQj').style.display = 'none';
        } else {
            document.getElementById('cesiumContainer').style.width = "50%";
            document.getElementById('Area_2D').style.display = 'block';
            document.getElementById('switchQj').style.display = 'block';
        }

    }, Cesium.ScreenSpaceEventType.WHEEL);
}
wheelEven();