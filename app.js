// 初始化地图
const map = new AMap.Map('map', {
  zoom: 13,
  center: [111.845428, 33.052892], //内乡县
  viewMode: '3D', //启用3D视图
  pitch: 40,      //倾斜角度
  showIndoorMap: false, //关闭室内地图
  mapStyle: 'amap://styles/light', //自定义地图样式
  resizeEnable: true, //地图容器尺寸变化时自动调整
});

//地图加载完成事件
map.on('complete', function() {
  console.log('地图加载完成');
});

//添加起始点和终点标记
const startMarker = createMarker([114.038680, 32.129779], '起点', 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png');
const endMarker = createMarker([113.820169, 34.797950], '终点', 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png');

//创建可拖动标记点
function createMarker(position, title, icon) {
  const marker = new AMap.Marker({
    position: position,
    icon: icon,
    title: title,
    draggable: true, //允许拖动
    cursor: 'move',
    raiseOnDrag: true, //拖动时升起
    animation: 'bounce', //动画效果
    offset: new AMap.Pixel(-13, -30) //偏移量
  });
  //添加到地图
  map.add(marker);
  //拖动标记点事件
  marker.on('dragend', function(e) {
    document.getElementById('coordinates').textContent = 
      `经度: ${e.lnglat.getLng().toFixed(6)}, 纬度: ${e.lnglat.getLat().toFixed(6)}`;
  });
  //点击标记点事件
  marker.on('click', function(e) {
    document.getElementById('coordinates').textContent = 
      `${marker.getTitle()}坐标: ${e.lnglat.getLng().toFixed(6)}, ${e.lnglat.getLat().toFixed(6)}`;
  });
  
  return marker;
}

//点击地图获取坐标
map.on('click', (e) => {
  document.getElementById('coordinates').textContent = 
    `经度: ${e.lnglat.getLng().toFixed(6)}, 纬度: ${e.lnglat.getLat().toFixed(6)}`;
});

//窗口大小变化时调整地图
window.addEventListener('resize', function() {
  map.resize();
});

//获取按钮元素
const distanceBtn = document.getElementById('distance-btn');
const multiDistanceBtn = document.getElementById('multi-distance-btn');
const inputCoordBtn = document.getElementById('input-coord-btn');
const undoBtn = document.getElementById('undo-btn'); // 获取撤销按钮

//计算两点间距离
distanceBtn.addEventListener('click', function() {
  const startPos = startMarker.getPosition();
  const endPos = endMarker.getPosition();
  const distance = AMap.GeometryUtil.distance(startPos, endPos);
  document.getElementById('result-info').textContent = `两点间距离: ${distance.toFixed(2)} 米`;
});

//多点测距相关变量
let multiDistancePath = [];
let polyline;
let multiMarkers = []; //存储多点标记

//多点测距
multiDistanceBtn.addEventListener('click', function() {
  if (multiDistancePath.length < 2) {
    document.getElementById('result-info').textContent = '至少需要两个点来进行多点测距';
    return;
  }
  let totalDistance = 0;
  for (let i = 0; i < multiDistancePath.length - 1; i++) {
    totalDistance += AMap.GeometryUtil.distance(multiDistancePath[i], multiDistancePath[i + 1]);
  }
  document.getElementById('result-info').textContent = `多点总距离: ${totalDistance.toFixed(2)} 米`;
  //绘制折线
  if (polyline) {
    polyline.setPath(multiDistancePath);
  } else {
    polyline = new AMap.Polyline({
      path: multiDistancePath,
      strokeColor: "#FF33FF",
      strokeWeight: 2,
      strokeOpacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    });
    map.add(polyline);
  }
});

//双击地图记录多点测距的点
map.on('dblclick', function(e) {
  //确保添加的是有效的经纬度对象
  if (e.lnglat && typeof e.lnglat.getLng === 'function' && typeof e.lnglat.getLat === 'function') {
    multiDistancePath.push(e.lnglat);
    console.log('记录的点:', e.lnglat); //调试信息，可查看记录的点
    //创建带序号的标记
    const index = multiDistancePath.length;
    const label = new AMap.Marker({
      position: e.lnglat,
      offset: new AMap.Pixel(-10, -10),
      content: `<div style="background-color: white; border: 1px solid gray; padding: 2px; border-radius: 50%; width: 20px; height: 20px; text-align: center;">${index}</div>`
    });
    map.add(label);
    multiMarkers.push(label);
  }
});

//撤销上一步操作
undoBtn.addEventListener('click', function() {
  if (multiDistancePath.length > 0) {
    multiDistancePath.pop(); //移除最后一个点
    if (multiMarkers.length > 0) {
      const lastMarker = multiMarkers.pop();
      map.remove(lastMarker); //移除最后一个标记
    }
    if (polyline) {
      polyline.setPath(multiDistancePath); //更新折线
    }
    if (multiDistancePath.length < 2) {
      document.getElementById('result-info').textContent = '至少需要两个点来进行多点测距';
    } else {
      let totalDistance = 0;
      for (let i = 0; i < multiDistancePath.length - 1; i++) {
        totalDistance += AMap.GeometryUtil.distance(multiDistancePath[i], multiDistancePath[i + 1]);
      }
      document.getElementById('result-info').textContent = `多点总距离: ${totalDistance.toFixed(2)} 米`;
    }
  }
});

//应用坐标按钮事件
inputCoordBtn.addEventListener('click', function() {
  const startCoordInput = document.getElementById('start-coord').value;
  const endCoordInput = document.getElementById('end-coord').value;
  const startCoord = startCoordInput.split(',').map(Number);
  const endCoord = endCoordInput.split(',').map(Number);
  //验证输入是否为有效的经纬度
  function isValidCoord(coord) {
    return coord.length === 2 && 
           !isNaN(coord[0]) && 
           !isNaN(coord[1]) && 
           coord[0] >= -180 && coord[0] <= 180 && 
           coord[1] >= -90 && coord[1] <= 90;
  }
  if (isValidCoord(startCoord) && isValidCoord(endCoord)) {
    //更新标记点位置
    startMarker.setPosition(startCoord);
    endMarker.setPosition(endCoord);
    //强制刷新地图
    map.setFitView();
    //立即重新计算距离
    calculateAndDisplayDistance();
    document.getElementById('result-info').textContent = '坐标应用成功，已重新计算距离';
  } else {
    document.getElementById('result-info').textContent = '输入的坐标格式不正确或不是有效的经纬度';
  }
});

//计算并显示距离的函数
function calculateAndDisplayDistance() {
  const startPos = startMarker.getPosition();
  const endPos = endMarker.getPosition();
  const distance = AMap.GeometryUtil.distance(startPos, endPos);
  document.getElementById('result-info').textContent = `两点间距离: ${distance.toFixed(2)} 米`;
}