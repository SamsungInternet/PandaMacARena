/**
 * Made with help from the three.ar.js examples:
 * https://github.com/google-ar/three.ar.js/tree/master/examples
 *
 * And with help from Ada's logo test demo:
 * https://glitch.com/edit/#!/logo-test
 */
let arDisplay,
    vrControls,
    arView,
    canvas,
    camera,
    scene,
    renderer,
    panda,
    ambientLight,
    directionalLight,
    reticle,
    mixer,
    clock,
    music;

const raycaster = new THREE.Raycaster();

THREE.ARUtils.getARDisplay().then(display => {
  if (display) {
    arDisplay = display;
    init();
  } else {
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
  const arDebug = new THREE.ARDebug(arDisplay, scene, {
    showLastHit: false,
    showPoseStatus: false,
    showPlanes: false
  });
  document.body.appendChild(arDebug.getElement());

  reticle = new THREE.ARReticle(arDisplay, 0.03, 0.04, 0xff0077, 0.25);
  scene.add(reticle);

  arView = new THREE.ARView(arDisplay, renderer);

  camera = new THREE.ARPerspectiveCamera(
    arDisplay,
    60,
    window.innerWidth / window.innerHeight,
    arDisplay.depthNear,
    arDisplay.depthFar
  );

  vrControls = new THREE.VRControls(camera);

  // Create the panda and add it to the scene.
  const loader = new THREE.GLTFLoader();
  loader.load('models/gltfanimationexporter.gltf', gltf => {

    console.log('Loaded panda model', gltf);

    panda = gltf.scene;

    // Scale to a table-top size for now (in the future could scale based on how far away?)
    panda.scale.set(0.08, 0.08, 0.08);

    // Place far away, until we tap to place on a surface
    panda.position.set(10000, 10000, 10000);

    // Animation

    mixer = new THREE.AnimationMixer( panda );
    const clips = gltf.animations;

    // Play all animations
    clips.forEach( clip => {
      mixer.clipAction( clip ).play();
    });

    scene.add(panda);

    window.addEventListener('resize', onWindowResize, false);
    canvas.addEventListener('touchstart', onClick, false);

    clock = new THREE.Clock();

    update();

  });

  // Lights
  ambientLight = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 0, 1).normalize();
  scene.add(directionalLight);

  // Music
  music = new Howl({
    src: ['music/macarena_s.ogg', 'music/macarena_s.mp3', 'music/macarena_s.wav'],
    preload: true
  });

}

function update() {

  if (reticle) {
    reticle.update(0.5, 0.5);
  }

  mixer.update( clock.getDelta() );

  renderer.clearColor();
  arView.render();

  camera.updateProjectionMatrix();

  vrControls.update();

  renderer.clearDepth();
  renderer.render(scene, camera);

  arDisplay.requestAnimationFrame(update);
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function playMusic() {
  if (!music.playing()) {
    music.play();
  }
}

function onClick(e) {

  if (!e.touches[0]) {
    return;
  }

  const x = e.touches[0].pageX;
  const y = e.touches[0].pageY;

  const hit = hitTestSurface(x, y);

  const moveEasingValue = 1;
  const applyOrientation = true;

  if (hit) {
    THREE.ARUtils.placeObjectAtHit(panda, hit, moveEasingValue, applyOrientation);
    panda.rotation.y += Math.PI;
    playMusic();
  }
}

function hitTestSurface(x, y) {

  // We need to transform x and y into being between 0 and 1

  const normalisedX = x / window.innerWidth;
  const normalisedY = y / window.innerHeight;

  // Send a ray from point of click to real world surface and attempt to find a hit. Returns an array of potential hits.
  const hits = arDisplay.hitTest(normalisedX, normalisedY);

  // If a hit is found, just use the first one
  return (hits && hits.length) ? hits[0] : null;

}
