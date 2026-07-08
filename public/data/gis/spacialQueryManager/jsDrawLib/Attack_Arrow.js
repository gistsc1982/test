

/**
 * @class Attack_Arrow
 * @aka Attack_Arrow
 * @inherits Polygon
 * 符号建模
 */

L.Attack_Arrow = L.Class.extend({

    Plot: true,
    headHeightFactor: 0.18,
    headWidthFactor: 0.3,
    neckHeightFactor: 0.85,
    neckWidthFactor: 0.15,
    headTailFactor: 0.8,
    initialize: function (latlngs, canvas) {
        debugger
        // L.Path.prototype.initialize.call(this, options);
        this._latlngs = this._convertLatLngs(latlngs);
        this._canvas = canvas;
    },
    includes: [L.Mixin.Events],
    symbolModeling: function () {
        var count = this.points.length;
        if (count <= 2) {
            this.setLatLngs(this.points);
            return;
        };
        var pnts = [];
        for (i in this.points) {
            pnts[i] = [];
            pnts[i][0] = this.points[i].lat;
            pnts[i][1] = this.points[i].lng;
        };
        //有时用户移动过快或者过慢，_onMouseMove捕获到的坐标会和onTouch捕获到的坐标一样。
        //为了防止这种事情发生：
        if (pnts[pnts.length - 1][1] == pnts[pnts.length - 2][1] && pnts[pnts.length - 1][2] == pnts[pnts.length - 2][2]) {
            return;
        }
        //var pnts = this.getPoints();
        // 计算箭尾
        var tailLeft = pnts[0];
        var tailRight = pnts[1];
        if (PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
            tailLeft = pnts[1];
            tailRight = pnts[0];
        }
        var midTail = PlotUtils.mid(tailLeft, tailRight);
        var bonePnts = [midTail].concat(pnts.slice(2));
        // 计算箭头
        var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
        var neckLeft = headPnts[0];
        var neckRight = headPnts[4];
        var tailWidthFactor = PlotUtils.distance(tailLeft, tailRight) / PlotUtils.getBaseLength(bonePnts);
        // 计算箭身
        var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
        // 整合
        var count = bodyPnts.length;
        var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
        leftPnts.push(neckLeft);
        var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
        rightPnts.push(neckRight);

        leftPnts = PlotUtils.getQBSplinePoints(leftPnts);
        rightPnts = PlotUtils.getQBSplinePoints(rightPnts);
        this.setLatLngs(leftPnts.concat(headPnts, rightPnts.reverse()));
    }
    ,

    getArrowHeadPoints: function (points, tailLeft, tailRight) {
        console.log("进攻线···");
        console.log(points);
        console.log(tailLeft);
        console.log(tailRight);

        var len = PlotUtils.getBaseLength(points);
        var headHeight = len * this.headHeightFactor;
        var headPnt = points[points.length - 1];
        len = PlotUtils.distance(headPnt, points[points.length - 2]);
        var tailWidth = PlotUtils.distance(tailLeft, tailRight);
        if (headHeight > tailWidth * this.headTailFactor) {
            headHeight = tailWidth * this.headTailFactor;
        }
        var headWidth = headHeight * this.headWidthFactor;
        var neckWidth = headHeight * this.neckWidthFactor;
        headHeight = headHeight > len ? len : headHeight;
        var neckHeight = headHeight * this.neckHeightFactor;
        var headEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
        var neckEndPnt = PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
        var headLeft = PlotUtils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
        var headRight = PlotUtils.getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
        var neckLeft = PlotUtils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
        var neckRight = PlotUtils.getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
        return [neckLeft, headLeft, headPnt, headRight, neckRight];
    },

    getArrowBodyPoints: function (points, neckLeft, neckRight, tailWidthFactor) {
        var allLen = PlotUtils.wholeDistance(points);
        var len = PlotUtils.getBaseLength(points);
        var tailWidth = len * tailWidthFactor;
        var neckWidth = PlotUtils.distance(neckLeft, neckRight);
        var widthDif = (tailWidth - neckWidth) / 2;
        var tempLen = 0, leftBodyPnts = [], rightBodyPnts = [];
        for (var i = 1; i < points.length - 1; i++) {
            var angle = PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
            tempLen += PlotUtils.distance(points[i - 1], points[i]);
            var w = (tailWidth / 2 - tempLen / allLen * widthDif) / Math.sin(angle);
            var left = PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
            var right = PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
            leftBodyPnts.push(left);
            rightBodyPnts.push(right);
        }
        return leftBodyPnts.concat(rightBodyPnts);
    },

    _initWithHoles: function (latlngs) {
        var i, len, hole;
        if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] == 'number')) {
            this._latlngs = this._convertLatLngs(latlngs[0]);
            this._holes = latlngs.slice(1);

            for (i = 0, len = this._holes.length; i < len; i++) {
                hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
                if (hole[0] == (hole[hole.length - 1])) {
                    hole.pop();
                }
            }
        }

        // filter out last point if its equal to the first one
        latlngs = this._latlngs;

        if (latlngs.length >= 2 &&
            latlngs[0] == (latlngs[latlngs.length - 1])) {
            latlngs.pop();
        }
    },
    setLatLngs: function (latlngs) {

        if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] == 'number')) {
            debugger
            this._initWithHoles(latlngs);
            fabricPoits = [];
            latlngs.forEach(latlng => {
                let fabricPoit = {};
                fabricPoit.x = latlng[0];
                fabricPoit.y = latlng[1];
                fabricPoits.push(fabricPoit);
            });
            console.log(latlngs);
            var polygon = new fabric.Polygon(fabricPoits, {
                fill: "blue", //线的颜色
                selectable: true
            });
            this._canvas.clear();
            this._canvas.add(polygon);
            this._canvas.renderAll();
            // return this.redraw();

        } else {
            return L.Attack_Arrow.prototype.setLatLngs.call(this, latlngs);
        }
    },
    getLatLngs: function () {
        return this._latlngs;
    },
    latLngsToCoords: function (latLngs) {
        var coords = [];

        for (var i = 0, len = latLngs.length; i < len; i++) {
            coords.push(this.latLngToCoords(latLngs[i]));
        }

        return coords;
    },
    _convertLatLngs: function (latlngs, overwrite) {
        var i, len, target = overwrite ? latlngs : [];

        for (i = 0, len = latlngs.length; i < len; i++) {
            if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
                return;
            }
            // target[i] = this.latLng(latlngs[i]);
            target[i] = latlngs[i];
        }
        return target;
    },
    latLng: function (lat, lng, alt) { // (Number, Number, Number)
        lat = parseFloat(lat);
        lng = parseFloat(lng);

        if (isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
        }

        this.lat = lat;
        this.lng = lng;

        if (alt !== undefined) {
            this.alt = parseFloat(alt);
        }
    },
    latLngToCoords: function (latlng) {
        var coords = [latlng.lng, latlng.lat];

        if (latlng.alt !== undefined) {
            coords.push(latlng.alt);
        }
        return coords;
    }
})