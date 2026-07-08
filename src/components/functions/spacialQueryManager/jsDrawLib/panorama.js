/**
* wq
* 2019-11-12
* */

let handler_bd = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
let mouse_Position = 0;
handler_bd.setInputAction(function (event) {
    if(document.getElementById("button18") == null){
        mouse_Position = event.endPosition.x;
        if(switchQj){
            if(mouse_Position < (window.innerWidth / 2)){
                //左向右
                krpano.set("view.hlookat", viewer.scene.camera.heading*180/Math.PI-249);//左右
                krpano.set("view.vlookat", viewer.scene.camera.pitch*180/Math.PI*-1);//上下
                // krpano.set("view.fov", viewer.scene.camera.heading*180/Math.PI );//放大缩小？
                // krpano.set("view.distortion", viewer.scene.camera.heading*180/Math.PI);//远近
            }else{
                //右向左
            }
        }
    }
    // console.log(viewer.scene.camera.pitch*180/Math.PI)
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


let bdToCesi,cesTobd,cesTobdPov;
let map,bdUpdata;
function bdjj(){
    document.getElementById('panoramaConianer').style.display = 'none';
    document.getElementById('container').style.display = 'block';
    //百度街景
    if(!map){
        map = new BMap.Map("container");
        let panorama = new BMap.Panorama('container');
        panorama.setPosition(new BMap.Point(114.219459, 22.322483));
        map.enableScrollWheelZoom(true);
        let stCtrl = new BMap.PanoramaControl();
        stCtrl.setOffset(new BMap.Size(20, 20));
        map.addControl(stCtrl);
        // panorama.navigationControl = false;

        function cliQJ() {
            let m = bdto84([panorama.getPosition().lng, panorama.getPosition().lat]);
            viewer.camera.setView({
                destination: new Cesium.Cartesian3.fromDegrees(m[0], m[1], 8.5),
                orientation: {
                    heading: Cesium.Math.toRadians(panorama.getPov().heading), // east, default value is 0.0 (north)
                    pitch: Cesium.Math.toRadians(panorama.getPov().pitch + 3),    // default value (looking down)
                    roll: 0.0                             // default value
                }
            });
        }
        cesTobdPov=function() {
            panorama.setPov({
                heading: viewer.scene.camera.heading * (180 / Math.PI),
                pitch: viewer.scene.camera.pitch * (180 / Math.PI)
            });
        };
        cesTobd=function() {
            let cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(viewer.scene.camera.position);
            let x_bd = Cesium.Math.toDegrees(cartographic.latitude);
            let y_bd = Cesium.Math.toDegrees(cartographic.longitude);
            panorama.setPosition(new BMap.Point(wgs84tobd(y_bd, x_bd)[0], wgs84tobd(y_bd, x_bd)[1]));
            panorama.setPov({
                heading: viewer.scene.camera.heading * (180 / Math.PI),
                pitch: viewer.scene.camera.pitch * (180 / Math.PI)
            });
        };

        /**
         * 鼠标位置监听，true左向右联动，false右向左联动
         * **/
        let jtPosition;
        let jtPov;
        let jt_bool = 3;
        bdToCesi = function() {
            if(document.getElementById('cesiumContainer').style.width != "100%"){
                if (mouse_Position < (window.innerWidth / 2) && mouse_Position != 0) {
                    if (jt_bool != 3 && jt_bool) {
                        return;
                    }
                    jt_bool = true;
                    try {
                        panorama.removeEventListener('position_changed', cliQJ);
                        panorama.removeEventListener('pov_changed', cliQJ);
                    } catch (e) {}
                    jtPosition = setInterval('cesTobd()', 500);
                    jtPov = setInterval('cesTobdPov()', 300);
                } else {
                    if (jt_bool != 3 && !jt_bool) {
                        return;
                    }
                    jt_bool = false;
                    try {
                        clearInterval(jtPosition);
                        clearInterval(jtPov);
                    } catch (e) {}
                    panorama.addEventListener('position_changed', cliQJ);
                    panorama.addEventListener('pov_changed', cliQJ);
                }
            }
        }
    }
    /**
     * cliQJ()单击右侧全景图左侧联动
     * bdto84(lng,lat)百度坐标转wgs84    //返回Array[0,1]
     * wgs84tobd(lng,lat)wgs84转百度坐标   //返回Array[0,1]
     * **/
    bdUpdata = setInterval('bdToCesi()', 200);
}
/*
* 全景初始/切换
* */
//true百度街景  false krpano全景图
let switchQj=false;
function switchFun() {
    if(switchQj){
        switchQj = !switchQj;
        bdjj();

    }else{
        switchQj = !switchQj;
        clearInterval(bdUpdata);
        setTimeout(()=>{
            krpanoFun();
        },400);
    }
}
switchFun();