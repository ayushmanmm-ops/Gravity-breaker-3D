
import * as THREE from "three";

// ========================================
// GRAVITY BREAK — 3D GAME ENGINE
// ========================================

// SCENE
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x03030c);

scene.fog = new THREE.FogExp2(
  0x03030c,
  0.008
);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 3, 12);
camera.lookAt(0, 0, 0);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.5)
);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document
  .getElementById("game-container")
  .appendChild(renderer.domElement);

// ========================================
// LIGHTING
// ========================================

const ambientLight = new THREE.AmbientLight(
  0x8299ff,
  1.5
);

scene.add(ambientLight);

const blueLight = new THREE.PointLight(
  0x00aaff,
  100,
  60
);

blueLight.position.set(5, 5, 5);
scene.add(blueLight);

const purpleLight = new THREE.PointLight(
  0x8b35ff,
  120,
  60
);

purpleLight.position.set(-5, -3, -5);
scene.add(purpleLight);

// ========================================
// 3D STARFIELD
// ========================================

const starGeometry = new THREE.BufferGeometry();

const starCount = 2500;
const starPositions = [];

for (let i = 0; i < starCount; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 180,
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 180
  );
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    starPositions,
    3
  )
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xb9dfff,
  size: 0.13,
  transparent: true,
  opacity: 0.9
});

const stars = new THREE.Points(
  starGeometry,
  starMaterial
);

scene.add(stars);

// ========================================
// FUTURISTIC SPACESHIP
// ========================================

const ship = new THREE.Group();

// MAIN BODY
const bodyGeometry = new THREE.ConeGeometry(
  0.65,
  2.8,
  8
);

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x9db8d9,
  metalness: 0.85,
  roughness: 0.22,
  emissive: 0x071b35
});

const body = new THREE.Mesh(
  bodyGeometry,
  bodyMaterial
);

body.rotation.x = -Math.PI / 2;

ship.add(body);

// WINGS
const wingGeometry = new THREE.BoxGeometry(
  1.5,
  0.12,
  0.9
);

const wingMaterial = new THREE.MeshStandardMaterial({
  color: 0x087fff,
  metalness: 0.7,
  roughness: 0.25,
  emissive: 0x002b77
});

const leftWing = new THREE.Mesh(
  wingGeometry,
  wingMaterial
);

leftWing.position.set(-0.85, 0, 0.35);
leftWing.rotation.z = 0.2;

ship.add(leftWing);

const rightWing = leftWing.clone();

rightWing.position.x = 0.85;
rightWing.rotation.z = -0.2;

ship.add(rightWing);

// COCKPIT
const cockpitGeometry = new THREE.SphereGeometry(
  0.38,
  24,
  16
);

const cockpitMaterial = new THREE.MeshStandardMaterial({
  color: 0x00dfff,
  metalness: 0.5,
  roughness: 0.1,
  emissive: 0x0077ff,
  emissiveIntensity: 1.5
});

const cockpit = new THREE.Mesh(
  cockpitGeometry,
  cockpitMaterial
);

cockpit.scale.set(0.7, 0.6, 1.3);
cockpit.position.z = -0.3;

ship.add(cockpit);

// ENGINE GLOW
const engine = new THREE.PointLight(
  0x00aaff,
  15,
  8
);

engine.position.set(0, 0, 1.3);

ship.add(engine);

// SHIP POSITION
ship.position.set(0, 0, 3);

scene.add(ship);

// ========================================
// ASTEROID FIELD
// ========================================

const asteroids = [];

const asteroidGeometry = new THREE.IcosahedronGeometry(
  1,
  1
);

const asteroidMaterial = new THREE.MeshStandardMaterial({
  color: 0x77758c,
  roughness: 0.9,
  metalness: 0.2
});

for (let i = 0; i < 20; i++) {
  const asteroid = new THREE.Mesh(
    asteroidGeometry,
    asteroidMaterial
  );

  asteroid.position.set(
    (Math.random() - 0.5) * 35,
    (Math.random() - 0.5) * 22,
    -Math.random() * 100
  );

  const scale = Math.random() * 1.5 + 0.5;

  asteroid.scale.set(
    scale,
    scale * 0.8,
    scale * 1.2
  );

  scene.add(asteroid);
  asteroids.push(asteroid);
}

// ========================================
// ANIMATION ENGINE
// ========================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // SPACESHIP FLOATING
  ship.position.y = Math.sin(time * 1.5) * 0.18;

  ship.rotation.z = Math.sin(time) * 0.045;

  // STAR MOVEMENT
  stars.rotation.y = time * 0.008;

  // ASTEROID ROTATION
  asteroids.forEach((asteroid, index) => {
    asteroid.rotation.x += 0.002 + index * 0.0001;
    asteroid.rotation.y += 0.003;
  });

  // CAMERA MOVEMENT
  camera.position.y = 3 + Math.sin(time * 0.5) * 0.15;

  renderer.render(scene, camera);
}

animate();

// ========================================
// RESPONSIVE DISPLAY
// ========================================

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );
});

// READY
document.getElementById("status").textContent =
  "3D SPACE ENVIRONMENT ONLINE";

