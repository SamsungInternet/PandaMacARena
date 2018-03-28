/**
 * Made with help from the three.ar.js examples:
 * https://github.com/google-ar/three.ar.js/tree/master/examples
 */
var vrDisplay,
    vrControls,
    arView,
    canvas,
    camera,
    scene,
    renderer,
    panda,
    ambientLight,
    directionalLight,
    loadingMessage,
    raycaster = new THREE.Raycaster();

// TEMP
window.onerror = function(msg, url, linenumber) {
  alert('Error message: ' + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
  return true;
}

THREE.ARUtils.getARDisplay().then(function (display) {
  if (display) {
    vrDisplay = display;
    init();
  } else {
    console.warn('Unsupported');
    THREE.ARUtils.displayUnsupportedMessage();
  }
});

function init() {

  console.log('Initialise');

  //var arDebug = new THREE.ARDebug(vrDisplay);
  //document.body.appendChild(arDebug.getElement());

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  scene = new THREE.Scene();

  arView = new THREE.ARView(vrDisplay, renderer);

  camera = new THREE.ARPerspectiveCamera(
    vrDisplay,
    60,
    window.innerWidth / window.innerHeight,
    vrDisplay.depthNear,
    vrDisplay.depthFar
  );

  vrControls = new THREE.VRControls(camera);

  // Create the panda and add it to the scene.
  var loader = new THREE.GLTFLoader();
  loader.load('models/panda.glb', function (gltf) {

    console.log('Loaded panda model', gltf);

    loadingMessage.style.display = 'none';

    panda = gltf.scene;

    // Scale to a more sensible size
    panda.scale.set(10, 10, 10);

    // Place nearby
    panda.position.set(25, 0, 25);

    panda.rotation.set(0, Math.PI / 2, 0);

    scene.add(panda);

    window.addEventListener('resize', onWindowResize, false);
    canvas.addEventListener('touchstart', onClick, false);

    update();

  });

  // TEMP
  var cube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
  );

  cube.position.set(20, 0, 20);

  scene.add(cube);

  // Lights
  ambientLight = new THREE.AmbientLight(0x660000);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 0, 1).normalize();
  scene.add(directionalLight);

  loadingMessage = document.getElementById('loading');

}

function update() {

  renderer.clearColor();
  arView.render();

  vrControls.update();

  vrDisplay.requestAnimationFrame(update);

  renderer.clearDepth();
  renderer.render(scene, camera);

}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick (e) {

  if (!e.touches[0]) {
    return;
  }

  var x = e.touches[0].pageX;
  var y = e.touches[0].pageY;

  var hit = hitTestSurface(x, y);

  var moveEasingValue = 1;
  var applyOrientation = true;

  if (hit) {
    THREE.ARUtils.placeObjectAtHit(panda, hit, moveEasingValue, applyOrientation);
    panda.rotation.y += Math.PI / 2;
  }
}

function hitTestSurface(x, y) {

  // We need to transform x and y into being between 0 and 1

  var normalisedX = x / window.innerWidth;
  var normalisedY = y / window.innerHeight;

  // Send a ray from point of click to real world surface and attempt to find a hit. Returns an array of potential hits.
  var hits = vrDisplay.hitTest(normalisedX, normalisedY);

  // If a hit is found, just use the first one
  return (hits && hits.length) ? hits[0] : null;

}
