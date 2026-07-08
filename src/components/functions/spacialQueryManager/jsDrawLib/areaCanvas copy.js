/**
 * WQ
 * 2019.11.8
 **/
function areaCanvas() {
    document.getElementById('pointDIV').style.display = 'block';
    let mycanvas = {};
    let handlerE = new Cesium.ScreenSpaceEventHandler();
    let s = [];
    let sE = 0;
    handlerE.setInputAction(function (event) {
        if (sE == 0) {
            sE++;
            let body = document.querySelector('body');
            let div2 = document.createElement('div');
            let HTML_Inner = '<div class="menu12" id="button18">' +
                '<div id="button18Value" style="margin:auto;">单击绘制<br/>双击结束</div>' +
                '</div>';
            div2.innerHTML = HTML_Inner;
            body.appendChild(div2);
            div2 = document.getElementById("button18");
            div2.style.left = event.endPosition.x + 10 + "px";
            div2.style.top = event.endPosition.y + 10 + "px";
        } else {
            let div2 = document.getElementById("button18");
            div2.style.left = event.endPosition.x + 10 + "px";
            div2.style.top = event.endPosition.y + 10 + "px";
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    let close = false;
    handlerE.setInputAction(function (e) {

        // mycanvas = document.getElementsByTagName('canvas')[1];
        let mycanvas = document.getElementById('mycanvas');
        let ctx = mycanvas.getContext('2d');
        // let ctx = mycanvas.getContext( 'webgl' );
        isDraw = true;
        if (s.length == 0) {
            mycanvas.width = mycanvas.parentElement.clientWidth - 1;
            mycanvas.height = mycanvas.parentElement.clientHeight - 1;
            canvas = new fabric.Canvas(mycanvas, {
                selection: false,
                width: mycanvas.parentElement.clientWidth - 1,
                height: mycanvas.parentElement.clientHeight - 1,
                backgroundColor: '#999'
            });
        }
        ctx.beginPath();
        ctx.arc(e.position.x, e.position.y, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 5;
        ctx.stroke();
        if (s.length == 0) {
            s.push(e.position.x);
            s.push(e.position.y);
        } else {
            s.push(e.position.x);
            s.push(e.position.y);
            // ctx.beginPath();
            // ctx.lineCap = "round";
            // ctx.moveTo(s[s.length - 4], s[s.length - 3]);
            // ctx.lineTo(s[s.length - 2], s[s.length - 1]);
            // ctx.strokeStyle = "#1C86EE";
            // ctx.stroke();

            var line = new fabric.Line([s[s.length - 2], s[s.length - 1], s[s.length - 4], s[s.length - 3]], {
                strokeWidth: 30, //线宽
                stroke: "green", //线的颜色
                selectable: false
            });
            canvas.add(line);
            canvas.renderAll();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handlerE.setInputAction(function (e) {
        isDraw = false;
        let mycanvas = document.getElementById('mycanvas');
        let ctx = mycanvas.getContext('2d');
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.moveTo(s[s.length - 2], s[s.length - 1]);
        ctx.lineTo(s[0], s[1]);
        ctx.strokeStyle = "#1C86EE";
        ctx.stroke();
        handlerE.destroy();
        setTimeout(() => {
            if (s.length >= 10) {
                // alert(((Math.abs(s[4] - s[2]) * Math.abs(s[3] - s[1])) * 0.001).toFixed(2) + '平方米');
            } else {
                alert('请最少输入四个坐标');
            }
            document.getElementById('pointDIV').style.display = 'none';
            let div2 = document.getElementById("button18");
            div2.remove();
            mycanvas.width = mycanvas.parentElement.clientWidth - 0.11;
            // let mycanvas = document.getElementById('mycanvas');
            // let ctx = mycanvas.getContext('2d');
            // ctx.clearRect(0,0,ctx.width,ctx.height);
        }, 500);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}