/* ============================================================
   viewer.js  –  Three.js + GLB loader + VR + FPS controls
   WASD para moverse, mouse para mirar (click para activar)
   ============================================================ */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader }          from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }         from 'three/addons/loaders/DRACOLoader.js';
import { VRButton }            from 'three/addons/webxr/VRButton.js';
import { RoomEnvironment }     from 'three/addons/environments/RoomEnvironment.js';

const MODEL_PATH = '../assets/models/modelo.glb';

let scene, camera, renderer, controls, xrButton;
let currentEnvMap = null;

/* ── Movimiento WASD ── */
const keys   = { w:false, a:false, s:false, d:false, q:false, e:false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const SPEED  = 0.8 /* m/s — ajusta a tu gusto */
let prevTime = performance.now();

/* ── Bootstrap ── */
window.addEventListener('DOMContentLoaded', () => {
  initScene();
  initLights();
  initEnvironment();
  loadModel();
  initVR();
  initToolbar();
  initFPSControls();
  animate();
  window.addEventListener('resize', onResize);
});

/* ── Scene ── */
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);
  scene.fog = new THREE.FogExp2(0x0d1117, 0.012);

  const container = document.getElementById('viewer-container');

  camera = new THREE.PerspectiveCamera(
    70,
    container.clientWidth / container.clientHeight,
    0.01, 1000
  );
  camera.position.set(0, 1.6, 6);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById('three-canvas'),
    alpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;

  /* PointerLockControls — controla la cámara con el mouse */
  controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());
}

/* ── FPS Controls (teclado + pointer lock) ── */
function initFPSControls() {
  const canvas    = document.getElementById('three-canvas');
  const lockHint  = document.getElementById('lock-hint');

  /* Click en el canvas → activar pointer lock */
  canvas.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    if (lockHint) lockHint.style.display = 'none';
  });
  controls.addEventListener('unlock', () => {
    if (lockHint) lockHint.style.display = 'flex';
  });

  /* Teclado */
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    keys.w = true; break;
      case 'KeyS': case 'ArrowDown':  keys.s = true; break;
      case 'KeyA': case 'ArrowLeft':  keys.a = true; break;
      case 'KeyD': case 'ArrowRight': keys.d = true; break;
      case 'KeyQ': case 'Space':      keys.q = true; break;  /* subir */
      case 'KeyE': case 'ShiftLeft':  keys.e = true; break;  /* bajar */
    }
  });
  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    keys.w = false; break;
      case 'KeyS': case 'ArrowDown':  keys.s = false; break;
      case 'KeyA': case 'ArrowLeft':  keys.a = false; break;
      case 'KeyD': case 'ArrowRight': keys.d = false; break;
      case 'KeyQ': case 'Space':      keys.q = false; break;
      case 'KeyE': case 'ShiftLeft':  keys.e = false; break;
    }
  });
}

/* ── Lights ── */
function initLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const key = new THREE.DirectionalLight(0x58a6ff, 1.4);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { near:0.1, far:50, top:10, bottom:-10, left:-10, right:10 });
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x3fb950, 0.5);
  fill.position.set(-5, 3, -7);
  scene.add(fill);

  scene.add(new THREE.PointLight(0xffc400, 0.8, 20)).position.set(0, 8, -6);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(60, 60, 0x21262d, 0x21262d);
  grid.position.y = 0.001;
  scene.add(grid);
}

/* ── Environment ── */
function initEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  currentEnvMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = currentEnvMap;
  pmrem.dispose();
}

/* ── Load GLB ── */
function loadModel() {
  const overlay = document.getElementById('loading-overlay');
  const fill    = document.getElementById('progress-fill');
  const loadMsg = document.getElementById('load-msg');
  const noModel = document.getElementById('no-model');

  const loader = new GLTFLoader();
  const draco  = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(draco);

  loader.load(
    MODEL_PATH,
    (gltf) => {
      const model = gltf.scene;
      model.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });

      const box    = new THREE.Box3().setFromObject(model);
      const size   = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = 5 / maxDim;   /* modelo ~5m de largo */

      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      scene.add(model);

      /* Posicionar cámara fuera del modelo mirando hacia él */
      const scaledMax = maxDim * scale;
      camera.position.set(0, size.y * scale * 0.5, scaledMax * 1.4);
      controls.getObject().position.copy(camera.position);

      overlay.classList.add('hidden');
      setTimeout(() => { overlay.style.display = 'none'; }, 600);
      document.getElementById('model-info').textContent =
        `${model.children.length} obj · ${(size.x*scale).toFixed(1)}×${(size.y*scale).toFixed(1)}×${(size.z*scale).toFixed(1)} m`;
    },
    (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        fill.style.width = pct + '%';
        loadMsg.textContent = `Cargando modelo… ${pct}%`;
      }
    },
    () => { overlay.style.display = 'none'; noModel.style.display = 'flex'; }
  );
}

/* ── VR ── */
function initVR() {
  if (!navigator.xr) return;
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    const btn = document.getElementById('btn-vr-enter');
    if (!btn) return;
    if (supported) {
      xrButton = VRButton.createButton(renderer);
      xrButton.style.display = 'none';
      document.body.appendChild(xrButton);
      btn.addEventListener('click', () => xrButton.click());
      const notice = document.getElementById('vr-notice');
      if (notice) notice.classList.remove('d-none');
    } else {
      btn.textContent = 'VR no disponible';
      btn.classList.add('disabled');
    }
  });
}

/* ── Toolbar ── */
function initToolbar() {
  const btnReset  = document.getElementById('btn-reset');
  const btnWire   = document.getElementById('btn-wire');
  const inputFile = document.getElementById('file-input');
  /* btn-rotate ya no aplica con FPS, lo ocultamos */
  const btnRotate = document.getElementById('btn-rotate');
  if (btnRotate) btnRotate.style.display = 'none';

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      controls.getObject().position.set(0, 1.6, 6);
      camera.rotation.set(0, 0, 0);
    });
  }

  let wireMode = false;
  if (btnWire) {
    btnWire.addEventListener('click', () => {
      wireMode = !wireMode;
      scene.traverse(obj => { if (obj.isMesh) obj.material.wireframe = wireMode; });
      btnWire.classList.toggle('active', wireMode);
    });
  }

  if (inputFile) {
    inputFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);

      const toRemove = [];
      scene.traverse(child => {
        if (child.isGroup || (child.isMesh && !child.receiveShadow)) toRemove.push(child);
      });
      toRemove.forEach(o => scene.remove(o));

      const lo = document.getElementById('loading-overlay');
      lo.style.display = 'flex'; lo.classList.remove('hidden');
      document.getElementById('progress-fill').style.width = '0%';
      document.getElementById('no-model').style.display = 'none';

      const l2 = new GLTFLoader();
      const d2 = new DRACOLoader();
      d2.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      l2.setDRACOLoader(d2);

      l2.load(url, (gltf) => {
        const model = gltf.scene;
        const box   = new THREE.Box3().setFromObject(model);
        const size  = box.getSize(new THREE.Vector3());
        const center= box.getCenter(new THREE.Vector3());
        const maxDim= Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDim;

        model.scale.setScalar(scale);
        model.position.set(-center.x*scale, -box.min.y*scale, -center.z*scale);
        model.traverse(c => { if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; }});
        scene.add(model);

        const scaledMax = maxDim * scale;
        controls.getObject().position.set(0, size.y*scale*0.5, scaledMax*1.4);

        lo.classList.add('hidden');
        setTimeout(()=>{ lo.style.display='none'; }, 600);
        document.getElementById('model-info').textContent =
          `${file.name.split('.')[0]} · ${(size.x*scale).toFixed(1)}×${(size.y*scale).toFixed(1)}×${(size.z*scale).toFixed(1)} m`;
        URL.revokeObjectURL(url);
      }, (e) => {
        if (e.lengthComputable)
          document.getElementById('progress-fill').style.width =
            Math.round((e.loaded/e.total)*100) + '%';
      });
    });
  }
}

/* ── Animate ── */
function animate() {
  renderer.setAnimationLoop(() => {
    const now  = performance.now();
    const delta = (now - prevTime) / 1000;
    prevTime = now;

    if (controls.isLocked) {
      /* Fricción */
      velocity.x -= velocity.x * 10 * delta;
      velocity.z -= velocity.z * 10 * delta;
      velocity.y -= velocity.y * 10 * delta;

      direction.set(
  (keys.d ? 1 : 0) - (keys.a ? 1 : 0),
  (keys.q ? 1 : 0) - (keys.e ? 1 : 0),
  (keys.w ? 1 : 0) - (keys.s ? 1 : 0)   // ← corregido
);

      if (keys.w || keys.s) velocity.z -= direction.z * SPEED * delta * 20;
if (keys.a || keys.d) velocity.x -= direction.x * SPEED * delta * 20;
      if (keys.q || keys.e) velocity.y += direction.y * SPEED * delta * 60;

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
      controls.getObject().position.y += velocity.y * delta;

      /* Evitar que la cámara baje del suelo */
      if (controls.getObject().position.y < 0.5)
        controls.getObject().position.y = 0.5;
    }

    renderer.render(scene, camera);
  });
}

/* ── Resize ── */
function onResize() {
  const c = document.getElementById('viewer-container');
  camera.aspect = c.clientWidth / c.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(c.clientWidth, c.clientHeight);
}