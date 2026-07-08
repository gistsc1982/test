/**
 * WQ on 2019/11/1.
 */
		var scene = viewer.scene;
		var canvas = viewer.canvas; // 获取画布
		canvas.setAttribute('tabindex', '0'); // 获取焦点
		canvas.onclick = function() {
			canvas.focus();
		};
		var ellipsoid = viewer.scene.globe.ellipsoid; // 获取地球球体对象
		// 禁用默认的事件处理程序
		// 如果为真，则允许用户旋转相机。如果为假，相机将锁定到当前标题。此标志仅适用于2D和3D。
		scene.screenSpaceCameraController.enableRotate = true;
		// 如果为true，则允许用户平移地图。如果为假，相机将保持锁定在当前位置。此标志仅适用于2D和Columbus视图模式。
		scene.screenSpaceCameraController.enableTranslate = true;
		// 如果为真，允许用户放大和缩小。如果为假，相机将锁定到距离椭圆体的当前距离
		scene.screenSpaceCameraController.enableZoom = true;
		// 如果为真，则允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
		scene.screenSpaceCameraController.enableTilt = true;
		// 如果为true，则允许用户使用免费外观。如果错误，摄像机视图方向只能通过转换或旋转进行更改。此标志仅适用于3D和哥伦布视图模式。
		scene.screenSpaceCameraController.enableLook = true;
		// 鼠标开始位置
		var startMousePosition;
		// 鼠标位置
		var mousePosition;
		// 鼠标状态标志
		var flags = {
			looking: false,
			moveForward: false, // 向前
			moveBackward: false, // 向后
			moveUp: false, // 向上
			moveDown: false, // 向下
			moveLeft: false, // 向左
			moveRight: false // 向右
		};
		var handler = new Cesium.ScreenSpaceEventHandler(canvas);

		function getFlagForKeyCode(keyCode) {
			if(event.keyCode == 65) //左
				return 'moveLeft';
			if(event.keyCode == 87) //上
				return 'moveUp';
			if(event.keyCode == 68) //右
				return 'moveRight';
			if(event.keyCode == 83) //下
				return 'moveDown';
		}
		// 监听键盘按下事件
		document.addEventListener('keydown', function(r) {
			// 获取键盘返回的标志
			var flagName = getFlagForKeyCode(r.keyCode);
			if(typeof flagName !== 'undefined') {
				flags[flagName] = true;
			}
		}, false);
		// 监听键盘弹起时间
		document.addEventListener('keyup', function(r) {
			// 获取键盘返回的标志
			var flagName = getFlagForKeyCode(r.keyCode);
			if(typeof flagName !== 'undefined') {
				flags[flagName] = false;
			}
		}, false);

		viewer.clock.onTick.addEventListener(function(clock) {
			// 获取实例的相机对象
			var camera = viewer.camera;
			if(flags.looking) {
				// 获取画布的宽度
				var width = canvas.clientWidth;
				// 获取画布的高度
				var height = canvas.clientHeight;
				// Coordinate (0.0, 0.0) will be where the mouse was clicked.
				var x = (mousePosition.x - startMousePosition.x) / width;
				var y = -(mousePosition.y - startMousePosition.y) / height;
				var lookFactor = 0.05;
				camera.lookRight(x * lookFactor);
				camera.lookUp(y * lookFactor);
			}
			// 获取相机高度
			// cartesianToCartographic(): 将笛卡尔坐标转化为地图坐标，方法返回Cartographic对象，包含经度、纬度、高度
			var cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
//			var moveRate = cameraHeight / 100.0;
// 			var moveRate = document.getElementById("KeyFlyAuto").value;
// 			moveRate/=1000000;
			moveRate=0.00000003;
			// 如果按下键盘就移动
			if(flags.moveForward) {
				camera.moveForward(moveRate);
			}
			if(flags.moveBackward) {
				camera.moveBackward(moveRate);
			}
			if(flags.moveDown) {
				camera.rotateUp(moveRate);
			}
			if(flags.moveUp) {
				camera.rotateDown(moveRate);
			}
			if(flags.moveLeft) {
				camera.rotateLeft(moveRate);
			}
			if(flags.moveRight) {
				camera.rotateRight(moveRate);
			}
		});
