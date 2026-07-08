/**
 * 加载倾斜影像
 * **/
let tileset1 = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
    url: 'CesiumViewer/map/OSGB/test1115/tileset.json',
    // url: 'CesiumViewer/map/OSGB/LandsD/tileset.json',
    // url:'CesiumViewer/map/OSGB/PlanD/tileset.json',
    show: true,
    maximumMemoryUsage: 3000,
    maximumScreenSpaceError: 1
}));

// let tileset2 = viewer2.scene.primitives.add(new Cesium.Cesium3DTileset({
//     url: 'CesiumViewer/map/OSGB/test1115/tileset.json',
//     // url:'CesiumViewer/map/OSGB/PlanD/tileset.json',
//     show: true,
//     maximumMemoryUsage: 3000,
//     maximumScreenSpaceError: 1
// }));

let pointArr=[];

for (let i = 0; i < qjtAtt.length; i++) {
    let entity = qjtAtt[i];

    // entity.position.getValue();
    pointArr.push(viewer.entities.add({
        id : ""+entity.Filename.split('.')[0]+"*"+entity.heading+"*"+i,
        position : new Cesium.Cartesian3.fromDegrees(entity.lon,entity.lat,entity.height),
        point : {
            pixelSize : 13,
            color : Cesium.Color.BLUE,
            outlineColor : Cesium.Color.YELLOW,
            // outlineWidth : 2
            scaleByDistance : new Cesium.NearFarScalar(1, 1.2, 500, 0.5)
        }
    }));
}


// Cesium.GeoJsonDataSource.load('CesiumViewer/map/geoJson/travel_line.json');//线路
/*let promisez = Cesium.GeoJsonDataSource.load('CesiumViewer/map/qjt/picJSON.json');//点线
promisez.then(function(dataSource) {
    let entities = dataSource.entities.values;
    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i];
        entity.position.getValue();
        pointArr.push(viewer.entities.add({
            id : "point_"+i,
            position : entity.position.getValue(),
            point : {
                pixelSize : 13,
                color : Cesium.Color.BLUE,
                outlineColor : Cesium.Color.YELLOW,
                // outlineWidth : 2
                scaleByDistance : new Cesium.NearFarScalar(1, 1.2, 500, 0.5)
            }
        }));
    }
}).otherwise(function(error){
    window.alert(error);
});*/

var polygonArr = [];
let promiseE = Cesium.GeoJsonDataSource.load('CesiumViewer/map/geoJson/building.json');
promiseE.then(function(dataSource) {
    viewer.dataSources.add(dataSource);
    let entities = dataSource.entities.values;
    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i];
        entity._id = i;
        entity.polygon.height.setValue(entity.properties.getValue().height+entity.properties.getValue().BASELEVEL);
        entity.polygon.extrudedHeight = entity.properties.getValue().BASELEVEL;
        entity.polygon.outline = false;
        entity.polygon.material = Cesium.Color.fromCssColorString('rgba(0,0,0,0.1)');
        polygonArr.push(entity);
        entity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            '<tr><th>名称</th><td>' + entity._properties.getValue().Name+ '</td></tr>' +
            '<tr><th>用途</th><td>' + entity._properties.getValue().Usage + '</td></tr>' +
            '<tr><th>面积</th><td>' + entity._properties.getValue().Area + '</td></tr>' +
            '<tr><th>始建年份</th><td>' + entity._properties.getValue().Year + '</td></tr>' +
            '<tr><th>商户/住户</th><td>' + entity._properties.getValue().Household+ '户' + '</td></tr>' +
            '</tbody></table>';
    }
}).otherwise(function(error){
    window.alert(error);
});

