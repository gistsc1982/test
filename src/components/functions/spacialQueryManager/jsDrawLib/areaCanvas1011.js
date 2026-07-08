/**
 * WQ
 * 2019.11.8
 **/
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
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    let close = false;
    handlerE.setInputAction(function (e) {
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
                    strokeWidth: 30, //线宽
                    stroke: "green", //线的颜色
                    selectable: true
                });
                line.on('selected', function () {

                    s = [];
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

        var line = new fabric.Line([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
            strokeWidth: 30, //线宽
            stroke: "green", //线的颜色
            selectable: true
        });
        line.on('selected', function () {
        })

        canvas.add(line);
        canvas.renderAll();

        let pointDIV = document.getElementById('pointDIV')
        pointDIV.oncontextmenu = function () { return false; }

        s = [];

        // handlerE.destroy();
        setTimeout(() => {
            // document.getElementById('pointDIV').style.display = 'none';
            let div2 = document.getElementById("button18");
            div2.remove();
        }, 500);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    handlerE.setInputAction(function (e) {
        isDraw = false;
        handlerE.destroy();
        document.getElementById('pointDIV').style.display = 'none';
        let div2 = document.getElementById("button18");
        div2.remove();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


}