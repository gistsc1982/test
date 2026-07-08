
function areaCanvas() {
    document.getElementById('pointDIV').style.display = 'block';
    let mycanvas = document.getElementById('mycanvas');
    let ctx = mycanvas.getContext('2d');
    let canvas = new fabric.Canvas(mycanvas, {
        selection: true,
        width: mycanvas.parentElement.clientWidth - 1,
        height: mycanvas.parentElement.clientHeight - 1,
        backgroundColor: '#999'
    });
    let handlerE = new Cesium.ScreenSpaceEventHandler();
    let svgPathString = '<g transform="matrix(1 0 0 1 288.9 397.5) "  >< line style = "stroke: rgb(0,128,0); stroke-width: 5; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;"  x1 = "80.80000305175781" y1 = "-1.1999969482421875" x2 = "-80.80000305175781" y2 = "1.1999969482421875" /></g >'
    fabric.loadSVGFromString(svgPathString, (objects) => {
        const group1 = new fabric.Group(objects);
        canvas.add(group1);
        canvas.setActiveObject(group1);
        canvas.getActiveObject().toActiveSelection();
        canvas.discardActiveObject();
        canvas.renderAll();
    })
    let s = [];
    let sE = 0;
    handlerE.setInputAction(function (event) {
        if (sE == 0) {
            sE++;
            let body = document.querySelector('body');
            let div2 = document.createElement('div');
            let HTML_Inner = '<div class="menu12" id="button18">' +
                '<div id="button18Value" style="margin:auto;font-size:2px">单击绘制,右键结束,双击保存</div>' +
                '</div>';
            div2.innerHTML = HTML_Inner;
            body.appendChild(div2);
            div2 = document.getElementById("button18");
            div2.style.left = event.endPosition.x + 10 + "px";
            div2.style.top = event.endPosition.y + 10 + "px";
        } else {
            let div2 = document.getElementById("button18");
            if (div2 != null) {
                div2.style.left = event.endPosition.x + 10 + "px";
                div2.style.top = event.endPosition.y + 10 + "px";
            }
            if (s.length >= 8) {

                var pts = [];
                let pt = [];
                pt.push(s[s.length - 2]);
                pt.push(s[s.length - 1]);
                pts.push(pt);
                pt = [];
                pt.push(s[s.length - 4]);
                pt.push(s[s.length - 3]);
                pts.push(pt);
                pt = [];
                pt.push(s[s.length - 6]);
                pt.push(s[s.length - 5]);

                let curpt = [];
                curpt.push(event.endPosition.x);
                curpt.push(event.endPosition.y);
                pts.push(curpt);

                let ptLatLngs = [];
                pts.forEach(pt => {
                    let ptLatLng = {};
                    ptLatLng.lat = pt[0];
                    ptLatLng.lng = pt[1];
                    ptLatLngs.push(ptLatLng)
                });

                //初始化箭头线算法属性
                fabric.Line = fabric.Line.extend({
                    initMyAttack_Arrow: new L.Attack_Arrow(ptLatLngs, canvas)
                });



                var line = new fabric.Line([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
                    strokeWidth: 5, //线宽
                    stroke: "green", //线的颜色
                    selectable: true
                });
                line.on('selected', function () {
                    console.log(canvas.toSVG())
                })

                canvas.add(line);
                canvas.renderAll();


                line.initMyAttack_Arrow.points = ptLatLngs;
                line.initMyAttack_Arrow.symbolModeling();
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    let close = false;
    handlerE.setInputAction(function (e) {
        console.log("canvas坐标");
        console.log(e.position);
        if (s.length < 2) {
            isDraw = true;
            mycanvas.width = mycanvas.parentElement.clientWidth - 1;
            mycanvas.height = mycanvas.parentElement.clientHeight - 1;
        }
        if (s.length < 2) {
            s.push(e.position.x);
            s.push(e.position.y);
        } else {
            s.push(e.position.x);
            s.push(e.position.y);
            if (isDraw) {
                var line = new fabric.Line([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
                    strokeWidth: 5, //线宽
                    stroke: "green", //线的颜色
                    selectable: true
                });

                line.on('selected', function () {
                    s = [];
                    console.log(line.toSVG())
                })

                canvas.add(line);
            }

        }
        canvas.renderAll();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handlerE.setInputAction(function (e) {

        isDraw = false;
        s.push(e.position.x);
        s.push(e.position.y);

        var pts = [];
        let pt = [];
        pt.push(s[s.length - 2]);
        pt.push(s[s.length - 1]);
        pts.push(pt);
        pt = [];
        pt.push(s[s.length - 4]);
        pt.push(s[s.length - 3]);
        pts.push(pt);
        pt = [];
        pt.push(s[s.length - 6]);
        pt.push(s[s.length - 5]);

        debugger
        //初始化箭头线算法属性
        fabric.Line = fabric.Line.extend({
            initMyAttack_Arrow: new L.Attack_Arrow(pts, canvas)
        });


        var line = new fabric.Line([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
            strokeWidth: 5, //线宽
            stroke: "green", //线的颜色
            selectable: true
        });
        line.on('selected', function () {
            console.log(canvas.toSVG())
        })

        canvas.add(line);
        canvas.renderAll();

        debugger
        line.initMyAttack_Arrow.points = pts;
        line.initMyAttack_Arrow.symbolModeling();


        let pointDIV = document.getElementById('pointDIV')
        pointDIV.oncontextmenu = function () { return false; }

        s = [];

        // handlerE.destroy();
        setTimeout(() => {
            // document.getElementById('pointDIV').style.display = 'none';
            let div2 = document.getElementById("button18");
            if (div2 != null)
                div2.remove();



            // var line = new fabric.path([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
            //     strokeWidth: 5, //线宽
            //     stroke: "green", //线的颜色
            //     selectable: true
            // });

        }, 500);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    handlerE.setInputAction(function (e) {
        isDraw = false;
        handlerE.destroy();
        document.getElementById('pointDIV').style.display = 'none';
        canvas.clear();
        // canvas = new fabric.Canvas(mycanvas, {
        //     selection: true,
        //     width: mycanvas.parentElement.clientWidth - 1,
        //     height: mycanvas.parentElement.clientHeight - 1,
        //     backgroundColor: '#999'
        // });
        // let div2 = document.getElementById("button18");
        // div2.remove();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


}