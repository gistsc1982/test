/*
var renderer;
function initRender() {
    renderer = new THREE.WebGLRenderer({antialias: true});
    //renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0)); //设置背景颜色
    renderer.setSize(window.innerWidth/2, window.innerHeight);
    document.getElementById("pano").appendChild(renderer.domElement);
    // document.body.appendChild(renderer.domElement);
}

var camera;
function initCamera() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/2 / window.innerHeight, 1, 10000);
    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.position.set(500, 0, 0);
}

var scene;
function initScene() {
    scene = new THREE.Scene();
}

var mesh,loader=new THREE.TextureLoader();
function initModel() {
    //轴辅助 （每一个轴的长度）
    // var helper = new THREE.AxesHelper(500);
    // scene.add(helper);
    //声明一个球体
    var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
    // 反转X轴上的几何图形，使所有的面点向内。
    geometry.scale( - 1, 1, 1 );
    //声明球体纹理
    var material = new THREE.MeshBasicMaterial( {
        map: loader.load( '190628_071412378.jpg' ) //加载一整张纹理图片
    } );
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    console.log(scene);
}

//初始化性能插件
var stats;

function initStats() {
    stats = new Stats();
    document.body.appendChild(stats.dom);
}

//用户交互插件 鼠标左键按住旋转，右键按住平移，滚轮缩放
var controls;

function initControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // 如果使用animate方法时，将此函数删除
    //controls.addEventListener( 'change', render );
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    controls.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度
    //controls.dampingFactor = 0.25;
    //是否可以缩放
    controls.enableZoom = true;
    //是否自动旋转
    controls.autoRotate = false;
    //设置相机距离原点的最远距离
    controls.minDistance = 500;
    //设置相机距离原点的最远距离
    controls.maxDistance = 500;
    //是否开启右键拖拽
    controls.enablePan = true;
}

//生成gui设置配置项
var gui;
function initGui() {
    //声明一个保存需求修改的相关数据的对象
    gui = {

    };
    var datGui = new dat.GUI();
    //将设置属性添加到gui当中，gui.add(对象，属性，最小值，最大值）
}

function render() {
    renderer.render(scene, camera);
}

//窗口变动触发的函数
function onWindowResize() {
    camera.aspect = window.innerWidth/2 / window.innerHeight;
    camera.updateProjectionMatrix();
    render();
    renderer.setSize(window.innerWidth/2, window.innerHeight);

}

function animate() {
    //更新控制器
    // material.map = loader.load('190628_063055608.jpg');
    // controls.update();
    // controls.object.lookAt(new THREE.Vector3(50,50,0));
    // controls.lookAt(new THREE.Vector3(0,0,0));
    render();
    //更新性能插件
    // stats.update();
    requestAnimationFrame(animate);
}

function draw() {
    initRender();
    initScene();
    initCamera();
    initModel();
    initControls();
    // initStats();
    // initGui();
    animate();
    window.onresize = onWindowResize;
}
draw();*/
var opt, tp;
window.onload = function () {
    opt = {
        container: 'panoramaConianer',//容器
        url: './190628_071412378.jpg',
        // lables: [
        //     { position: { lon: -72.00, lat: 9.00 }, logoUrl: '', text: '蓝窗户' },
        //     { position: { lon: 114.12, lat: 69.48 }, logoUrl: '', text: '一片云彩' },
        //     { position: { lon: 132.48, lat: -12.24 }, logoUrl: '', text: '大海' }
        // ],
        widthSegments: 60,//水平切段数
        heightSegments: 40,//垂直切段数（值小粗糙速度快，值大精细速度慢）
        pRadius: 1000,//全景球的半径，推荐使用默认值
        minFocalLength: 6,//镜头最小拉近距离
        maxFocalLength: 100,//镜头最大拉近距离
    }
    tp = new tpanorama(opt);
}