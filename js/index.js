/**
 * Made with help from the three.ar.js examples:
 * https://github.com/google-ar/three.ar.js/tree/master/examples
 * 
 * And with help from Ada's logo test demo:
 * https://glitch.com/edit/#!/logo-test
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
    reticle,
    mixer,
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

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  scene = new THREE.Scene();

  // Show surfaces
  var arDebug = new THREE.ARDebug(vrDisplay, scene, {
    showLastHit: false,
    showPoseStatus: false,
    showPlanes: true,
  });
  document.body.appendChild(arDebug.getElement());

  arView = new THREE.ARView(vrDisplay, renderer);

  camera = new THREE.ARPerspectiveCamera(
    vrDisplay,
    60,
    window.innerWidth / window.innerHeight,
    vrDisplay.depthNear,
    vrDisplay.depthFar
  );

  initReticle();

  vrControls = new THREE.VRControls(camera);

  // Create the panda and add it to the scene.
  var loader = new THREE.GLTFLoader();
  loader.load('models/gltfanimationexporter.gltf', function (gltf) {

    console.log('Loaded panda model', gltf);

    loadingMessage.style.display = 'none';

    panda = gltf.scene;

    console.log('gltf', gltf);

    // Scale to a more sensible size
    panda.scale.set(3, 3, 3);

    // Place far away, until we tap to place on a surface
    //panda.position.set(10000, 10000, 10000);
    panda.position.set(0, 1, 10);

    // Animation

    mixer = new THREE.AnimationMixer( panda );
    var clips = gltf.animations;

    // Play a specific animation
    // var clip = THREE.AnimationClip.findByName( clips, 'dance' );
    // var action = mixer.clipAction( clip );
    // action.play();

    // Play all animations
    clips.forEach( function ( clip ) {
      mixer.clipAction( clip ).play();
    });

    scene.add(panda);

    window.addEventListener('resize', onWindowResize, false);
    canvas.addEventListener('touchstart', onClick, false);

    update();

  });

  // TEMP
  /*
  var cube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshBasicMaterial({
        color: 0xff0000
    })
  );

  cube.position.set(20, 0, 20);

  scene.add(cube);
  */

  // Lights
  ambientLight = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 0, 1).normalize();
  scene.add(directionalLight);

  loadingMessage = document.getElementById('loading');

}

function initReticle() {

  THREE.ARUtils.getARDisplay().then(function (display) {
    if (display) {
      reticle = new THREE.ARReticle(display, 0.03, 0.04, 0xff0077, 0.25);
      scene.add(reticle);
    } else {
      console.log('No AR support');
    }
  });

}

function update() {

  if (reticle) {
    this.reticle.update(0.5, 0.5);
  }

  mixer.update( 0.1 ); // TODO delta seconds

  renderer.clearColor();
  arView.render();

  camera.updateProjectionMatrix();

  vrControls.update();

  renderer.clearDepth();
  renderer.render(scene, camera);

  vrDisplay.requestAnimationFrame(update);
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
