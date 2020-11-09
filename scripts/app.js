import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
import { MTLLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/MTLLoader.js';
import { MtlObjBridge } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';

function main() {
  // подписка на события мыши
  window.onmousedown = mousedown;
  window.onmousemove = mousemove;
  window.onmouseup = mouseup;

  // Получение канвы, создание рендерера
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ canvas });

  // Настройка камеры
  const fov = 45;
  const aspect = 2;
  const near = 0.01;
  const far = 7500;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 100, 200);

  // Настройка управления 3D вида мышью
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  // Создание сцены, задание фонового цвета
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Функция настройки позиции камеры
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * .5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // вектор направления на камеру
    const direction = (new THREE.Vector3())
      .subVectors(camera.position, boxCenter)
      .multiply(new THREE.Vector3(1, -5, 1))
      .normalize();
    // перемещение камеры в новую позицию
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    // настройка поля зрения камеры по глубине
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;
    camera.updateProjectionMatrix();
    // настройка направления камеры
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  // Настройка освещения сцены (небесное)
  {
    const skyColor = 0xFFFFFF;
    const groundColor = 0xa0a0a0;
    const intensity = 0.85;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  // Настройка освещения сцены (направленное)
  {
    const color = 0xFFFFFF;
    const intensity = .15;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target);
  }

  // Функция создания прямоугольной хот-зоны
  function makeRectZone(w, h, x, y, z) {
    var geometry = new THREE.PlaneBufferGeometry(w, h);
    var material = new THREE.MeshPhongMaterial({ color: 0xffff66, opacity: 0., transparent: true, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Функция создания полигональной хот-зоны
  function makeShapeZone(points, x, y, z) {
    var shape = new THREE.Shape();
    shape.moveTo(points[0], points[1]);
    var i;
    for (i = 2; i < points.length; i += 2) {
      shape.lineTo(points[i], points[i + 1]);
    }
    shape.lineTo(points[0], points[1]);
    var geometry = new THREE.ShapeBufferGeometry(shape);
    var material = new THREE.MeshPhongMaterial({ color: 0xffff66, opacity: 0., transparent: true, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(Math.PI / 2);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Создание зон верхнего освещения и добавление их на сцену
  const lightZones = [
    makeRectZone(195, 450, 562.5, 250, 368.5), // кухня
    makeRectZone(134, 452, 391.0, 250, 367.5), // прихожая
    makeRectZone(90.5, 215, 271.0, 250, 212.28), // туалет
    makeRectZone(200, 255, 118.5, 250, 191.65), // ванная
    makeRectZone(338, 265.25, 147.45, 250, 459.4), // детская
    makeShapeZone([294.2, 336.6, 296., 77.0, 219.6, 0., 0., 0., 0., 336.6], // спальня
      -284, 250, -17.4),
    makeShapeZone([0., 0., 0., 218.3, 222.14, 218.1, 303.54, 299.48, 607.7, // зал
      299.64, 607.7, 376.28, 741.4, 376.8, 741.4, 0.],
      -284, 250, -243),
  ];

  lightZones.forEach(function (zone) { scene.add(zone); });

  // Функция создания круговой хот-зоны
  function makeCircleHotZone(r, x, y, z, c = 0xff0000) {
    var geometry = new THREE.CircleBufferGeometry(r, 24);
    var material = new THREE.MeshPhongMaterial({ color: c, opacity: 0., transparent: true, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(Math.PI / 2);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Функция создания конуса света
  function makeLightCone(r, h, x, y, z, ax = -Math.PI / 12, ay = 0, az = 0) {
    var geometry = new THREE.ConeBufferGeometry(r, h, 24, 1, false, 0, Math.PI * 2);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff99, opacity: 0., transparent: true });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotateY(ay);
    mesh.rotateX(ax);
    mesh.rotateZ(az);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Функция создания поля света
  function makeLightField(w, h, x, y, z, ax, ay, az) {
    var shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2 + w / 3, h / 2);
    shape.lineTo(-w / 2 - w / 3, h / 2);
    shape.lineTo(-w / 2, -h / 2);
    var geometry = new THREE.ShapeBufferGeometry(shape);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff99, opacity: 0., transparent: true, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotateY(ay);
    mesh.rotateX(ax);
    mesh.rotateZ(az);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // Функция создания кругового индикатора хот-зоны
  function makeCircleSelection(r, x, y, z) {
    var geometry = new THREE.CircleGeometry(r, 24);
    var material = new THREE.LineBasicMaterial({ color: 0xff0000, visible: false });
    geometry.vertices.shift();
    var line = new THREE.LineLoop(geometry, material);
    line.rotateX(Math.PI / 2);
    line.position.set(x, y, z);
    return line;
  }

  // Функция создания прямоугольного индикатора хот-зоны
  function makeRectSelection(w, h, x, y, z) {
    var geometry = new THREE.PlaneBufferGeometry(w, h);
    var material = new THREE.LineBasicMaterial({ color: 0xff0000, visible: false });
    var line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
    line.rotateX(-Math.PI / 2);
    line.position.set(x, y, z);
    return line;
  }

  // Создание хот-зон и индикаторов освещения от ламп/светильников и добавление их на сцену
  var lamps = [
    makeCircleHotZone(16, 187.5, 182., -180.), // торшер в зале
    makeCircleHotZone(12, 430.5, 115., -207.), // настольная лампа в зале
    makeCircleHotZone(16, -245.5, 207., -140.), // настенная лампа в зале
    makeCircleHotZone(14, -10.5, 198., 98.), // настенная лампа-1 в спальне
    makeCircleHotZone(14, -10.5, 198., 180.), // настенная лампа-2 в спальне
    makeRectZone(20, 100, 472.5, 198, 443.5), // настенная лампа на кухне
    makeRectZone(20, 50, 212.5, 178.5, 192.), // настенная лампа в ванной
  ];

  var selections = [
    makeCircleSelection(16, 187.5, 182., -180.), // торшер в зале
    makeCircleSelection(12, 430.5, 115., -207.), // настольная лампа в зале
    makeCircleSelection(16, -245.5, 207., -140.), // настенная лампа в зале
    makeCircleSelection(14, -10.5, 198., 98.), // настенная лампа-1 в спальне
    makeCircleSelection(14, -10.5, 198., 180.), // настенная лампа-2 в спальне
    makeRectSelection(20, 100, 472.5, 198, 443.5), // настенная лампа на кухне
    makeRectSelection(20, 50, 212.5, 178.5, 192.), // настенная лампа в ванной
  ];

  var lampLights = [
    makeLightCone(50, 150, 186.5, 105., -160.), // торшер в зале
    makeLightCone(15, 30, 430.5, 100., -204.), // настольная лампа в зале
    makeLightField(30, 80, -234.5, 167., -140., Math.PI * 1.1, -Math.PI * .5, 0), // настенная лампа в зале
    makeLightCone(50, 150, -27.5, 123.5, 96., 0, 0, -Math.PI / 12), // настенная лампа-1 в спальне
    makeLightCone(50, 150, -27.5, 123.5, 179.5, 0, 0, -Math.PI / 12), // настенная лампа-2 в спальне
    makeLightField(80, 80, 497.5, 162., 443., Math.PI * 1.2, -Math.PI * .5, 0), // настенная лампа на кухне
    makeLightField(30, 80, 200.5, 138., 192., Math.PI * .9, -Math.PI * .5, 0), // настенная лампа в ванной
  ];

  lamps.forEach(function (lamp) { scene.add(lamp); });
  selections.forEach(function (selection) { scene.add(selection); });
  lampLights.forEach(function (lampLight) { scene.add(lampLight); });

  // Общий выключатель освещения
  var all_lights = makeCircleHotZone(32, 472, 260, 700, 0xf0f000);
  scene.add(all_lights);

  // Какое-либо освещение включено?
  function anyLight() {
    for (var i = 0; i < lightZones.length; i++) {
      if (lightZones[i].material.opacity != 0)
        return true;
    }
    for (var i = 0; i < lampLights.length; i++) {
      if (!lampLights[i].material.transparent)
        return true;
    }
    return false;
  }

  // Кондиционирование
  var snowflakes = [];

  function loadSnowFlake(x, y, z) {
    const objLoader = new OBJLoader2();
    objLoader.load('./model/snowflake.obj', (sf) => {
      sf.scale.set(3, 3, 3);
      sf.position.set(x, y, z);
      snowflakes.push(sf);
      sf.active = false;
      sf.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material.color.setHex(0xf0f0f0);
        }
      });
      scene.add(sf);
    });
  }

  loadSnowFlake(150, 260, 450);
  loadSnowFlake(100, 260, -100);
  loadSnowFlake(-100, 260, 100);
  loadSnowFlake(400, 260, 700);

  var cools = [
    makeCircleHotZone(32, 150, 260, 450),
    makeCircleHotZone(32, 100, 260, -100),
    makeCircleHotZone(32, -100, 260, 100),
  ];
  cools.forEach(function (cool) { scene.add(cool); });

  // Общий выключатель кондиционирования
  var all_cools = makeCircleHotZone(32, 400, 260, 700);
  scene.add(all_cools);

  // Какой-либо кондиционер вклбчен?
  function anyCooler() {
    for (var i = 0; i < cools.length; i++) {
      var sf = snowflakes[i];
      if (sf.active)
        return true;
    }
    return false;
  }

  // Обработка событий мыши (в том числе включение/выключение зон освещения)
  var mousePressed = false;
  var mouseMoveCount = 0;

  function mousedown(event) {
    event.preventDefault();
    mousePressed = true;
    mouseMoveCount = 0;
  }

  function mousemove(event) {
    event.preventDefault();
    if (mousePressed) {
      mouseMoveCount++;
    }
    else {
      var raycaster = getRayCaster(event);
      var i;
      for (i = 0; i < lamps.length; i++) {
        selections[i].material.visible = raycaster.intersectObject(lamps[i]).length > 0;
      }
    }
  }

  function mouseup(event) {
    event.preventDefault();
    mousePressed = false;
    if (mouseMoveCount > 1) {
      return;
    }
    var raycaster = getRayCaster(event);
    
    // Лампы и светильники
    if (raycaster.intersectObject(all_lights).length > 0) {
      lightZones.forEach(function (x) { x.material.opacity = 0 });
      lampLights.forEach(function (x) { x.material.transparent = true });
      all_lights.material.transparent = true;
      return;
    }

    var i;
    for (i = 0; i < lamps.length; i++) {
      if (raycaster.intersectObject(lamps[i]).length > 0) {
        lampLights[i].material.transparent = !lampLights[i].material.transparent;
        all_lights.material.transparent = !anyLight();
        return;
      }
    }

    // Кондиционирование
    if (raycaster.intersectObject(all_cools).length > 0) {
      for (i = 0; i < snowflakes.length; i++) {
        var sf = snowflakes[i];
        sf.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            sf.active = false;
            child.material.color.setHex(0xf0f0f0);
          }
        });
      }
      return;
    }

    for (i = 0; i < cools.length; i++) {
      if (raycaster.intersectObject(cools[i]).length > 0) {
        var sf = snowflakes[i];
        sf.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            sf.active = !sf.active;
            child.material.color.setHex(sf.active ? 0x5050ff : 0xf0f0f0);
            var asf = snowflakes[cools.length];
            asf.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                asf.active = anyCooler();
                child.material.color.setHex(asf.active ? 0x5050ff : 0xf0f0f0);
              }
            });
          }
        });
        return;
      }
    }

    // Верхнее освещение
    var intersected = raycaster.intersectObjects(lightZones);
    intersected.forEach(function (zone) {
      zone.object.material.opacity = zone.object.material.opacity == 0 ? .25 : 0;
    });
    all_lights.material.transparent = !anyLight();
  }

  function getRayCaster(event) {
    const rect = canvas.getBoundingClientRect();
    var position = {
      x: ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1,
      y: ((event.clientY - rect.top) / canvas.clientHeight) * -2 + 1
    }
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(position, camera);
    return raycaster;
  }

  // Импорт 3D плана квартиры
  {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./model/flatplan.mtl', (mtlParseResult) => {
      const objLoader = new OBJLoader2();
      const materials = MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
      for (const material of Object.values(materials)) {
        material.side = THREE.DoubleSide;
      }
      objLoader.addMaterials(materials);
      objLoader.load('./model/flatplan.obj', (root) => {
        scene.add(root);
        // Вычисление размеров загруженных объектов
        const box = new THREE.Box3().setFromObject(root);
        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());
        // Настройка позиции камеры
        frameArea(boxSize * 1.1, boxSize, boxCenter, camera);
        // Настройка управления видом 3D сцены
        controls.maxPolarAngle = Math.PI / 2;
        controls.maxDistance = boxSize * 10;
        controls.target.copy(boxCenter);
        controls.update();
      });
    });
  }


  // Настройка размеров рендерера при изменении размеров канвы
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // Рендеринг сцены
  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();