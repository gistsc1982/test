!function () {

    //公共方法
    var getDom = function (id) { return document.getElementById(id) };
    var isNull = function (s) { return s == undefined || typeof (s) == 'undefined' || s == null || s == 'null' || s == '' || s.length < 1 };
    var hideDefRM = function () { document.oncontextmenu = function () { return false } };//屏蔽浏览器默认鼠标事件
    /**绘图容器*/
    var cbtCanvas;
    /**绘图对象*/
    var cxt;
    /**绘制的图形列表*/
    var shapes = new Array();

    var graphkind = { 'cursor': 0, 'pen': 1, 'line': 2, 'trian': 3, 'rect': 4, 'poly': 5, 'circle': 6, 'arrow': 21, 'parallel': 41, 'trapezoid': 42 };
    //背景图片绘制配置
    var bgPictureConfig = {
        pic: null,//背景图片地址或路径
        repaint: true,//是否作为永久背景图，每次清除时会进行重绘
    };
    //加载并绘制图片(src:图片路径或地址),默认重绘背景图
    var loadPicture = function (src) {
        if (isNull(bgPictureConfig.repaint) || bgPictureConfig.repaint) { bgPictureConfig.pic = src }
        var img = new Image();
        img.onload = function () { cxt.drawImage(img, 0, 0) }
        img.src = src;
    }

    //绘图基础配置
    var paintConfig = {
        lineWidth: 1,//线条宽度，默认1
        strokeStyle: 'red',//画笔颜色，默认红色
        fillStyle: 'rgba(255,0,0,0.1)',//填充色（0.1透明度）
        lineJoin: "round",//线条交角样式，默认圆角
        lineCap: "round",//线条结束样式，默认圆角
    };
    //重新载入绘制样式
    var resetStyle = function () {
        cxt.strokeStyle = paintConfig.strokeStyle;
        cxt.lineWidth = paintConfig.lineWidth;
        cxt.lineJoin = paintConfig.lineJoin;
        cxt.lineCap = paintConfig.lineCap;
        cxt.fillStyle = paintConfig.fillStyle;
    }

    //鼠标图形
    var cursors = ['crosshair', 'pointer'];
    /** 切换鼠标样式*/
    var switchCorser = function (b) {
        cbtCanvas.style.cursor = ((isNull(b) ? isDrawing() : b) ? cursors[0] : cursors[1]);
    }
    //操作控制变量组
    var ctrlConfig = {
        kind: 0,//当前绘画分类
        isPainting: false,//是否开始绘制
        startPoint: null,//起始点
        cuGraph: null,//当前绘制的图像
        cuPoint: null,//当前临时坐标点，确定一个坐标点后重新构建
        cuAngle: null,//当前箭头角度
        vertex: [],//坐标点
    }
    /**获取当前坐标点*/
    var getCuPoint = function (i) {
        return ctrlConfig.cuPoint[i];
    }
    /**设置当前坐标点*/
    var setCuPoint = function (p, i) {
        return ctrlConfig.cuPoint[i] = p;
    }
    /**设置当前临时坐标点值*/
    var setCuPointXY = function (x, y, i) {
        if (isNull(ctrlConfig.cuPoint)) {
            var arr = new Array();
            arr[i] = new Point(x, y);
            ctrlConfig.cuPoint = arr;
        } else if (isNull(ctrlConfig.cuPoint[i])) {
            setCuPoint(new Point(x, y), i);
        } else {
            ctrlConfig.cuPoint[i].setXY(x, y);
        }
        return getCuPoint(i);
    }

    /**是否正在绘制*/
    var isDrawing = function () {
        return ctrlConfig.isPainting;
    }
    /**开始绘制状态*/
    var beginDrawing = function () {
        ctrlConfig.isPainting = true;
    }
    /**结束绘制状态*/
    var stopDrawing = function () {
        ctrlConfig.isPainting = false;
    }
    /**是否有开始坐标点*/
    var hasStartPoint = function () {
        return !isNull(ctrlConfig.startPoint);
    }
    /**设置当前绘制的图形*/
    var setCuGraph = function (g) {
        ctrlConfig.cuGraph = g;
    }
    /**获取当前绘制的图形*/
    var getCuGraph = function () {
        return ctrlConfig.cuGraph;
    }
    /**设置开始坐标点（线条的起始点，三角形的顶点，圆形的圆心，四边形的左上角或右下角，多边形的起始点）*/
    var setStartPoint = function (p) {
        ctrlConfig.startPoint = p;
    }
    /**获取开始坐标点*/
    var getStartPoint = function () {
        return ctrlConfig.startPoint;
    }

    /**清空全部*/
    var clearAll = function () {
        cxt.clearRect(0, 0, cbtCanvas.width, cbtCanvas.height);
    }
    /**重绘*/
    var repaint = function () {
        clearAll();
        /*
        if(bgPictureConfig.repaint){
            loadPicture(bgPictureConfig.pic);
        }*/
    }

    /**点（坐标,绘图的基本要素,包含x,y坐标）*/
    var Point = (function (x1, y1) {
        var x = x1, y = y1;
        return {
            set: function (p) {
                x = p.x, y = p.y;
            },
            setXY: function (x2, y2) {
                x = x2; y = y2;
            },
            setX: function (x3) {
                x = x3;
            },
            setY: function (y3) {
                y = y3;
            },
            getX: function () {
                return x;
            },
            getY: function () {
                return y;
            }
        }
    });
    /**多角形（三角形、矩形、多边形），由多个点组成*/
    var Poly = (function (ps1) {
        var ps = isNull(ps1) ? new Array() : ps1;
        var size = ps.length;
        return {
            set: function (ps2) {
                ps = ps2;
            },
            getSize: function () {
                return ps ? ps.length : 0;
            },
            setPoint: function (p, i) {
                if (isNull(p) && isNaN(i)) {
                    return;
                }
                ps[i] = p;
            },
            setStart: function (p1) {
                if (isNull(ps)) {
                    ps = new Array();
                    return ps.push(p1);
                } else {
                    ps[0] = p1;
                }
            },
            add: function (p) {
                if (isNull(ps)) {
                    ps = new Array();
                }
                return ps.push(p);
            },
            pop: function () {
                if (isNull(ps)) {
                    return;
                }
                return ps.pop();
            },
            shift: function () {
                if (isNull(ps)) {
                    return;
                }
                return ps.shift;
            },
            get: function () {
                if (isNull(ps)) {
                    return null;
                }
                return ps;
            },
            draw: function (close) {
                if (close === undefined) close = true;
                cxt.beginPath();
                for (var i in ps) {
                    if (i == 0) {
                        cxt.moveTo(ps[i].getX(), ps[i].getY());
                    } else {
                        cxt.lineTo(ps[i].getX(), ps[i].getY());
                    }
                }
                if (close) { cxt.closePath(); cxt.fill(); }
                cxt.stroke();
            }
        }
    });
    /*线条(由两个点组成，包含方向)*/
    var Line = (function (p1, p2, al) {
        var start = p1, end = p2, angle = al;

        var drawLine = function () {
            cxt.beginPath();
            cxt.moveTo(p1.getX(), p1.getY());
            cxt.lineTo(p2.getX(), p2.getY());
            cxt.stroke();
        }
        //画箭头
        var drawArrow = function () {

            var vertex = ctrlConfig.vertex;
            var x1 = p1.getX(), y1 = p1.getY(), x2 = p2.getX(), y2 = p2.getY();
            var el = 50, al = 15;
            //计算箭头底边两个点（开始点，结束点，两边角度，箭头角度）
            vertex[0] = x1, vertex[1] = y1, vertex[6] = x2, vertex[7] = y2;
            //计算起点坐标与X轴之间的夹角角度值
            var angle = Math.atan2(y2 - y1, x2 - x1) / Math.PI * 180;
            var x = x2 - x1, y = y2 - y1, length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            if (length < 250) {
                el /= 2, al / 2;
            } else if (length < 500) {
                el *= length / 500, al *= length / 500;
            }
            vertex[8] = x2 - el * Math.cos(Math.PI / 180 * (angle + al));
            vertex[9] = y2 - el * Math.sin(Math.PI / 180 * (angle + al));
            vertex[4] = x2 - el * Math.cos(Math.PI / 180 * (angle - al));
            vertex[5] = y2 - el * Math.sin(Math.PI / 180 * (angle - al));
            //获取另外两个顶点坐标
            x = (vertex[4] + vertex[8]) / 2, y = (vertex[5] + vertex[9]) / 2;
            vertex[2] = (vertex[4] + x) / 2;
            vertex[3] = (vertex[5] + y) / 2;
            vertex[10] = (vertex[8] + x) / 2;
            vertex[11] = (vertex[9] + y) / 2;
            //计算完成,开始绘制
            cxt.beginPath();
            cxt.moveTo(vertex[0], vertex[1]);
            cxt.lineTo(vertex[2], vertex[3]);
            cxt.lineTo(vertex[4], vertex[5]);
            cxt.lineTo(vertex[6], vertex[7]);
            cxt.lineTo(vertex[8], vertex[9]);
            cxt.lineTo(vertex[10], vertex[11]);
            cxt.closePath();
            cxt.fill();
            cxt.stroke();
        }
        return {
            setStart: function (s) {
                start = s;
            },
            setEnd: function (e) {
                end = e;
            },
            getStart: function () {
                return start;
            },
            getEnd: function () {
                return end;
            },
            draw: function () {
                if (angle) {
                    drawArrow();
                } else {
                    drawLine();
                }
            }
        }
    });
    /**圆形(包含圆心点和半径)*/
    var Circle = (function (arr) {
        //包含起始点（圆心）和结束点,以及圆半径
        var startPoint = arr.start, endPoint = arr.end, radius = arr.radius, p;
        /*绘制圆*/
        var drawCircle = function () {
            if (!endPoint || isNull(endPoint)) return; // 尚未确定半径，不绘制
            cxt.beginPath();
            var x = startPoint.getX();
            var y = startPoint.getY();
            if (isNull(radius)) {
                radius = calculateRadius(startPoint, endPoint);
            }
            cxt.arc(x, y, radius, 0, Math.PI * 2, false);
            cxt.stroke();
        }
        var calculateRadius = function (p1, p2) {
            if (!p1 || !p2) return 0;
            var width = p2.getX() - p1.getX();
            var height = p2.getY() - p1.getY();
            //如果是负数
            if (width < 0 || height < 0) {
                width = Math.abs(width);
            }
            //计算两点距离=平方根(width^2+height^2)
            var c = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            return c;
        }
        return {
            set: function (params) {
                startPoint = params.start;
                endPoint = params.end;
                radius = params.radius;
            },
            setPoint: function (p1) {
                endPoint = p1;
                p = p1;
            },
            getPoint: function () {
                return p;
            },
            setRadius: function (r1) {
                radius = r1;
            },
            getRadius: function () {
                return radius;
            },
            calcRadius: calculateRadius,
            //绘制
            draw: drawCircle,
        }
    });
    /**绘制线条 工具 方法*/
    var drawLine = function (p) {
        cxt.beginPath();
        cxt.moveTo(startPosition.getX(), startPosition.getY());
        cxt.lineTo(p.getX(), p.getY());
        cxt.stroke();
    }

    /**绘制三角形工具方法*/
    var drawTrian = function (ps) {
        cxt.beginPath();
        var a = ps.get();
        cxt.moveTo(a[0].getX(), a[0].getY());
        cxt.lineTo(a[1].getX(), a[1].getY());
        cxt.lineTo(a[2].getX(), a[2].getY());
        cxt.closePath();
        cxt.stroke();
    }

    /**绘制矩形工具方法*/
    var drawRect = function (p2) {
        var p = getStartPoint();
        var width = p.getX() - p2.getX();
        var height = p.getY() - p2.getY();
        cxt.beginPath();
        cxt.strokeRect(x, y, width, height);//绘制矩形
    }

    /*绘制多边形工具方法*/
    var drawpolygon = function (ps) {
        if (ps.length > 1) {//保证只有两个坐标点才是矩形
            cxt.beginPath();
            var p = ctrlConfig.startPoint;
            var x = p.getX();
            var y = p.getY();
            cxt.moveTo(x, y);
            for (p1 in ps) {
                cxt.lineTo(p1.getX(), p1.getY());
            }
            cxt.stroke();
        }
    }

    /*绘制圆角矩形工具方法*/
    var drawRoundedRect = function (x, y, width, height, radius) {
        cxt.beginPath();
        cxt.moveTo(x, y + radius);
        cxt.lineTo(x, y + height - radius);
        cxt.quadraticCurveTo(x, y + height, x + radius, y + height);
        cxt.lineTo(x + width - radius, y + height);
        cxt.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        cxt.lineTo(x + width, y + radius);
        cxt.quadraticCurveTo(x + width, y, x + width - radius, y);
        cxt.lineTo(x + radius, y);
        cxt.quadraticCurveTo(x, y, x, y + radius);
        cxt.stroke();
    }
    /*绘制圆工具方法*/
    var drawCircle = function (c) {
        var p = c.getPoint();//坐标点
        var x = p.getX();
        var y = p.getY();
        var r = c.getRadius();
        cxt.beginPath();
        //x,y,半径,开始点,结束点,顺时针/逆时针
        cxt.arc(x, y, r, 0, Math.PI * 2, false); // 绘制圆
        cxt.stroke();
    }
    //计算圆半径工具方法
    var calculateRadius = function (p1, p2) {
        var width = p2.getX() - p1.getX();
        var height = p2.getY() - p1.getY();
        //如果是负数
        if (width < 0 || height < 0) {
            width = Math.abs(width);
        }
        //计算两点距离=平方根(width^2+height^2)
        var c = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        return c;
    }

    //鼠标按键点击（首次点击确定开始坐标点，拖动鼠标不断进行图形重绘）
    var mouseDown = function (e) {
        var btnNum = e.button;
        if (btnNum == 0) {

            //设置起始点
            switch (ctrlConfig.kind) {
                case graphkind.pen://画笔（单击即画点，拖动即画线）
                    beginDrawing();//开始绘制
                    cxt.beginPath();
                    cxt.moveTo(e.offsetX, e.offsetY);
                    // 立即画一个小点，防止 mouseOut 中断导致不可见
                    cxt.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2, false);
                    cxt.fillStyle = cxt.strokeStyle;
                    cxt.fill();
                    cxt.beginPath();
                    cxt.moveTo(e.offsetX, e.offsetY);
                    break;
                case graphkind.poly://多边形
                    var p = new Point(e.offsetX, e.offsetY);
                    if (isDrawing()) {
                        getCuGraph().add(p);//添加到
                    } else {//第一次确定开始坐标
                        beginDrawing();//开始绘制
                        setStartPoint(p);
                        var poly = new Poly();
                        poly.add(p);
                        setCuGraph(poly);//设置当前绘制图形
                    }
                    break;
                case graphkind.line://线条
                case graphkind.arrow://方向
                case graphkind.trian://三角形
                case graphkind.rect://矩形
                case graphkind.parallel://平行四边形
                case graphkind.trapezoid://梯形
                    var p = new Point(e.offsetX, e.offsetY);
                    if (isDrawing()) {
                        getCuGraph().add(p);//追加顶点
                    } else {
                        beginDrawing();//开始绘制
                        setStartPoint(p);
                        var poly = new Poly();
                        poly.add(p);
                        setCuGraph(poly);//设置当前绘制图形
                    }
                    break;
                case graphkind.circle://圆
                    var p = new Point(e.offsetX, e.offsetY);
                    if (isDrawing()) {
                        // 第二次点击：设置终点（半径），完成圆
                        var circle = getCuGraph();
                        circle.setPoint(p);
                        repaint();
                        circle.draw();
                        stopDrawing();
                        switchCorser(false);
                    } else {
                        beginDrawing();//开始绘制
                        setStartPoint(p);
                        var circle = new Circle({ 'start': p });
                        setCuGraph(circle);
                    }
                    break;
                case ctrlConfig.cursor: //手型鼠标
                default://默认是手型鼠标，不允许绘制
            }
        } else if (btnNum == 2) {
            if (isDrawing()) {
                if (ctrlConfig.kind == graphkind.poly || ctrlConfig.kind == graphkind.line || ctrlConfig.kind == graphkind.rect) {
                    repaint();
                    if (ctrlConfig.kind == graphkind.rect && getCuGraph().getSize() >= 2) {
                        var pts = getCuGraph().get();
                        var p0 = pts[0], p1 = pts[1];
                        var rectPoly = new Poly();
                        rectPoly.set([p0, new Point(p1.getX(), p0.getY()), p1, new Point(p0.getX(), p1.getY())]);
                        rectPoly.draw();
                    } else {
                        getCuGraph().draw(ctrlConfig.kind != graphkind.line);
                    }
                    stopDrawing();//结束绘制
                    switchCorser(false);//恢复鼠标样式
                }
            }
        }
        hideDefRM();//屏蔽浏览器默认事件
    }
    //鼠标移动（拖动，根据鼠标移动的位置不断重绘图形）
    var mouseMove = function (e) {
        if (isDrawing() && hasStartPoint()) {//检查是否开始绘制，检查是否有开始坐标点
            //画笔不需要重绘
            if (ctrlConfig.kind > 1) {
                repaint();//重绘
            }
            var p = setCuPointXY(e.offsetX, e.offsetY, 0);//设置共享的临时坐标点，用于防止重复创建对象
            switch (ctrlConfig.kind) {
                case graphkind.pen://画笔(一直画)
                    cxt.lineTo(e.offsetX, e.offsetY);
                    cxt.stroke();
                    break;
                case graphkind.poly://多边形（预览不修改存储顶点）
                    var poly = getCuGraph();
                    // 先画已确认的边
                    poly.draw();
                    // 再画最后点到光标的橡皮筋
                    var pts = poly.get();
                    if (pts && pts.length > 0) {
                        var lastPt = pts[pts.length - 1];
                        cxt.save();
                        cxt.strokeStyle = 'rgba(255,0,0,0.4)';
                        cxt.beginPath();
                        cxt.moveTo(lastPt.getX(), lastPt.getY());
                        cxt.lineTo(p.getX(), p.getY());
                        cxt.stroke();
                        // 闭合预览线
                        if (pts.length >= 2) {
                            cxt.strokeStyle = 'rgba(255,0,0,0.2)';
                            cxt.beginPath();
                            cxt.moveTo(p.getX(), p.getY());
                            cxt.lineTo(pts[0].getX(), pts[0].getY());
                            cxt.stroke();
                        }
                        cxt.restore();
                    }
                    break;
                case graphkind.line://线条（折线预览：已确认线段 + 橡皮筋）
                    var linePoly = getCuGraph();
                    // 先画已确认的折线段
                    if (linePoly.getSize() >= 2) {
                        linePoly.draw(false);
                    }
                    // 再画最后点到光标的橡皮筋（半透明区分）
                    var pts = linePoly.get();
                    if (pts && pts.length > 0) {
                        var lastPt = pts[pts.length - 1];
                        cxt.save();
                        cxt.strokeStyle = 'rgba(255,0,0,0.4)';
                        cxt.beginPath();
                        cxt.moveTo(lastPt.getX(), lastPt.getY());
                        cxt.lineTo(p.getX(), p.getY());
                        cxt.stroke();
                        cxt.restore();
                    }
                    break;
                case graphkind.arrow://方向
                    var line = new Line(getStartPoint(), p, true);
                    ctrlConfig.cuGraph = line;
                    line.draw();
                    break;
                case graphkind.trian://三角形
                    var lu = getStartPoint();
                    var x2 = p.getX();
                    var x1 = lu.getX();
                    //三角形左边的点坐标计算方法:(x1-(x2-x1),y2)
                    var x3 = x1 - (x2 - x1);
                    var l = setCuPointXY(x3, p.getY(), 1);//设置共享的临时坐标点，用于防止重复创建对象
                    var poly = getCuGraph();//获取当前图形
                    poly.set([lu, p, l]);
                    poly.draw();//即时绘制
                    break;
                case graphkind.parallel://平行四边形
                    var lu = getStartPoint();
                    var x3 = p.getX();
                    var x1 = lu.getX();
                    //平行四边形两个未知坐标点计算方法:(x1-(x3-x1),y3),(x1+(x3-x1),y1)
                    var x2 = x3 + (x3 - x1);
                    var x4 = x1 - (x3 - x1);
                    var ld = setCuPointXY(x2, lu.getY(), 1);//设置共享的临时坐标点，用于防止重复创建对象
                    var ru = setCuPointXY(x4, p.getY(), 2);//设置共享的临时坐标点，用于防止重复创建对象
                    var poly = getCuGraph();//获取当前图形
                    poly.set([lu, ru, p, ld]);
                    poly.draw();//即时绘制
                    break;
                case graphkind.trapezoid://梯形
                    var lu = getStartPoint();
                    var x3 = p.getX();
                    var x1 = lu.getX();
                    //梯形两个未知坐标点计算方法:(x3-(x3-x1)/2,y1),(x1-(x3-x1)/2,y3)
                    var x2 = x3 - (x3 - x1) / 2;
                    var x4 = x1 - (x3 - x1) / 2;
                    var ld = setCuPointXY(x2, lu.getY(), 1);
                    var ru = setCuPointXY(x4, p.getY(), 2);
                    var poly = getCuGraph();
                    poly.set([lu, ru, p, ld]);
                    poly.draw();
                    break;
                case graphkind.rect://矩形（预览不修改存储顶点）
                    var lu = getStartPoint();
                    var pts = getCuGraph().get();
                    if (pts && pts.length >= 1) {
                        var p0 = pts[0];
                        var tempPoly = new Poly();
                        tempPoly.set([p0, new Point(p.getX(), p0.getY()), p, new Point(p0.getX(), p.getY())]);
                        tempPoly.draw();
                    }
                    break;
                case graphkind.circle://圆
                    var circle = getCuGraph();//获取当前图形
                    circle.set({ 'start': getStartPoint(), 'end': p });
                    circle.draw();//即时绘制
                    break;
            }
        }
    }
    //鼠标按键松开
    var mouseUp = function (e) {
        if (isDrawing()) {
            //console.log("松开鼠标按键:"+e.offsetX+","+e.offsetY);
            if (ctrlConfig.kind > 1) {
                repaint();
                if (ctrlConfig.kind == graphkind.rect && getCuGraph().getSize() >= 2) {
                    var pts = getCuGraph().get();
                    var p0 = pts[0], p1 = pts[1];
                    var rectPoly = new Poly();
                    rectPoly.set([p0, new Point(p1.getX(), p0.getY()), p1, new Point(p0.getX(), p1.getY())]);
                    rectPoly.draw();
                } else if (ctrlConfig.kind != graphkind.line && ctrlConfig.kind != graphkind.circle) {
                    // line/poly 不在 mouseUp 绘制（由 mousemove 预览和右键完成）
                    getCuGraph().draw();
                }
            } else if (ctrlConfig.kind == graphkind.pen) {
                cxt.stroke();
            }
            if (ctrlConfig.kind != graphkind.poly && ctrlConfig.kind != graphkind.line && ctrlConfig.kind != graphkind.rect && ctrlConfig.kind != graphkind.circle) {
                // 多边形、线条、矩形、圆只有右键点击或第二次点击才能结束绘制
                stopDrawing();//结束绘制
            }
        }
    }

    //鼠标移出
    var mouseOut = function (e) {
        if (isDrawing()) {
            if (ctrlConfig.kind > 1) {
                repaint();
                if (ctrlConfig.kind == graphkind.rect && getCuGraph().getSize() >= 2) {
                    var pts = getCuGraph().get();
                    var p0 = pts[0], p1 = pts[1];
                    var rectPoly = new Poly();
                    rectPoly.set([p0, new Point(p1.getX(), p0.getY()), p1, new Point(p0.getX(), p1.getY())]);
                    rectPoly.draw();
                } else if (ctrlConfig.kind != graphkind.line && ctrlConfig.kind != graphkind.circle) {
                    getCuGraph().draw();
                }
            } else if (ctrlConfig.kind == graphkind.pen) {
                cxt.stroke();
            }
            stopDrawing();//停止绘制
        }
    }

    window.DrawingTools = {
        isNull: isNull,
        getDom: getDom,
        clear: function () {
            stopDrawing();//停止绘制
            repaint();
        },
        /**初始化*/
        init: function (params) {
            // 支持直接传 canvas 元素（解决 shadow DOM / 闭包问题）
            cbtCanvas = params.canvas || getDom(params.id);
            //浏览器是否支持Canvas
            if (cbtCanvas && cbtCanvas.getContext) {
                /**绘图对象*/
                cxt = cbtCanvas.getContext("2d");
                cbtCanvas.onmousedown = mouseDown;
                cbtCanvas.onmouseup = mouseUp;
                cbtCanvas.onmousemove = mouseMove;
                cbtCanvas.onmouseout = mouseOut;
                resetStyle();//载入样式
                return true;
            } else {
                return false;
            }
        },
        /**设置背景图片*/
        setBgPic: loadPicture,
        /**选择图形类型*/
        begin: function (k) {
            if (isNaN(k)) {//如果不是数字，先转换为对应字符
                ctrlConfig.kind = graphkind[k];
            } else {
                ctrlConfig.kind = k;
            }
            switchCorser(true);//切换鼠标样式
        },
        /*手型，并停止绘图*/
        hand: function () {
            ctrlConfig.kind = 0;
            stopDrawing();//停止绘制
            switchCorser(false);//切换鼠标样式
        }
    }
}();


