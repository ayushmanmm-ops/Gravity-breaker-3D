
import * as THREE from "three";

// ==========================================
// GRAVITY BREAK V2
// PART 1 — 3D WORLD AND SPACESHIP
// ==========================================

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030b);
scene.fog = new THREE.FogExp2(0x02030b, 0.004);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);

camera.position.set(0, 4, 13);
camera.lookAt(0, 0, -15);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.5)
);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

document
  .getElementById("game-container")
  .appendChild(renderer.domElement);

// LIGHTING
scene.add(
  new THREE.HemisphereLight(0x9acaff, 0x16052e, 2)
);

const mainLight = new THREE.DirectionalLight(
  0x55ccff,
  3
);

mainLight.position.set(5, 10, 8);
scene.add(mainLight);

// ==========================================
// STARFIELD
// ==========================================

const starPositions = [];

for (let i = 0; i < 1800; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 150,
    (Math.random() - 0.5) * 90,
    -Math.random() * 180
  );
}

const starGeometry = new THREE.BufferGeometry();

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xc4eaff,
    size: 0.15
  })
);

scene.add(stars);

// NEBULA
for (let i = 0; i < 5; i++) {
  const nebula = new THREE.Mesh(
    new THREE.CircleGeometry(12, 40),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0x4920a0 : 0x006b99,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    })
  );

  nebula.position.set(
    (Math.random() - 0.5) * 35,
    (Math.random() - 0.5) * 20,
    -65 - i * 25
  );

  scene.add(nebula);
}

// ==========================================
// SPACESHIP
// ==========================================

const ship = new THREE.Group();
scene.add(ship);

const metal = new THREE.MeshStandardMaterial({
  color: 0xaac9e8,
  metalness: 0.85,
  roughness: 0.2
});

const dark = new THREE.MeshStandardMaterial({
  color: 0x10294c,
  metalness: 0.8,
  roughness: 0.25
});

const cyan = new THREE.MeshStandardMaterial({
  color: 0x00dfff,
  emissive: 0x0088ff,
  emissiveIntensity: 2
});

// MAIN HULL
const hull = new THREE.Mesh(
  new THREE.ConeGeometry(0.6, 2.8, 8),
  metal
);

hull.rotation.x = -Math.PI / 2;
ship.add(hull);

// WINGS
for (const side of [-1, 1]) {
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.13, 1),
    dark
  );

  wing.position.set(side * 0.95, 0, 0.35);
  wing.rotation.z = side * -0.15;
  ship.add(wing);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.04, 0.08),
    cyan
  );

  stripe.position.set(side * 0.95, 0.09, 0.3);
  ship.add(stripe);
}

// COCKPIT
const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(0.38, 24, 16),
  cyan
);

cockpit.scale.set(0.8, 0.65, 1.4);
cockpit.position.set(0, 0.25, -0.35);
ship.add(cockpit);

// ENGINES
for (const side of [-1, 1]) {
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 0.8, 12),
    cyan
  );

  engine.rotation.x = Math.PI / 2;
  engine.position.set(side * 0.38, 0, 1.25);
  ship.add(engine);
}

// ENGINE LIGHT
const engineLight = new THREE.PointLight(
  0x00aaff,
  20,
  10
);

engineLight.position.z = 1.8;
ship.add(engineLight);

// INITIAL POSITION
ship.position.set(0, 0, 4);

// END OF PART 1

// ==========================================
// GAME STATE
// ==========================================

let score = 0;
let energy = 0;
let gameSpeed = 24;
let asteroidTimer = 0;
let orbTimer = 0;
let elapsed = 0;
let gravityReversed = false;
let gameOver = false;
let started = true;

const asteroids = [];
const orbs = [];
const particles = [];

const clock = new THREE.Clock();

const status = document.getElementById("status");

// ==========================================
// GAME INTERFACE
// ==========================================

const interfaceStyle = document.createElement("style");

interfaceStyle.textContent = `
  #game-hud {
    position: fixed;
    top: 105px;
    left: 18px;
    z-index: 10;
    color: white;
    font-family: Arial, sans-serif;
    pointer-events: none;
    text-shadow: 0 0 10px #00cfff;
  }

  .hud-stat {
    font-size: 15px;
    margin: 8px 0;
    letter-spacing: 2px;
  }

  .hud-stat strong {
    color: #00eaff;
    font-size: 22px;
    margin-left: 8px;
  }

  #gravity-button {
    position: fixed;
    bottom: 28px;
    right: 22px;
    z-index: 20;
    padding: 17px 22px;
    border: 2px solid #00eaff;
    border-radius: 12px;
    color: white;
    background: rgba(0, 30, 60, 0.85);
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 2px;
    cursor: pointer;
    touch-action: manipulation;
  }

  #gravity-button:active {
    background: #007baf;
    transform: scale(0.94);
  }

  #control-hint {
    position: fixed;
    bottom: 32px;
    left: 18px;
    z-index: 10;
    color: #9bdfff;
    font: 12px Arial, sans-serif;
    letter-spacing: 1px;
    pointer-events: none;
  }

  #game-over {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: rgba(1, 3, 15, 0.88);
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
  }

  #game-over h1 {
    font-size: clamp(38px, 9vw, 65px);
    color: #ff315b;
    text-shadow: 0 0 25px #ff1744;
    letter-spacing: 5px;
  }

  #game-over p {
    font-size: 20px;
    letter-spacing: 2px;
  }

  #restart-button {
    margin-top: 25px;
    padding: 16px 35px;
    border: 2px solid #00eaff;
    border-radius: 10px;
    background: #062c50;
    color: white;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 2px;
    cursor: pointer;
  }

  #game-hud, #gravity-button, #control-hint {
    user-select: none;
    -webkit-user-select: none;
  }

  @media (max-width: 600px) {
    #game-hud {
      top: 95px;
      left: 12px;
    }

    .hud-stat {
      font-size: 12px;
    }

    .hud-stat strong {
      font-size: 18px;
    }

    #control-hint {
      max-width: 145px;
      line-height: 1.5;
      bottom: 25px;
    }

    #gravity-button {
      right: 12px;
      bottom: 20px;
      padding: 15px;
    }
  }
`;

document.head.appendChild(interfaceStyle);

const hud = document.createElement("div");
hud.id = "game-hud";

hud.innerHTML = `
  <div class="hud-stat">SCORE <strong id="score">0</strong></div>
  <div class="hud-stat">ENERGY <strong id="energy">0</strong></div>
  <div class="hud-stat">SECTOR <strong id="sector">1</strong></div>
`;

document.body.appendChild(hud);

const gravityButton = document.createElement("button");
gravityButton.id = "gravity-button";
gravityButton.textContent = "FLIP GRAVITY";
document.body.appendChild(gravityButton);

const hint = document.createElement("div");
hint.id = "control-hint";
hint.textContent = "DRAG TO MOVE  •  AVOID ASTEROIDS";
document.body.appendChild(hint);

const gameOverScreen = document.createElement("div");
gameOverScreen.id = "game-over";

gameOverScreen.innerHTML = `
  <h1>SHIP DESTROYED</h1>
  <p id="final-score">SCORE: 0</p>
  <p id="final-energy">ENERGY: 0</p>
  <button id="restart-button">PLAY AGAIN</button>
`;

document.body.appendChild(gameOverScreen);

// ==========================================
// ASTEROID CREATION
// ==========================================

function createAsteroid() {
  const geometry = new THREE.IcosahedronGeometry(
    1,
    Math.random() > 0.5 ? 1 : 2
  );

  const material = new THREE.MeshStandardMaterial({
    color: 0x687080,
    roughness: 0.95,
    metalness: 0.2,
    flatShading: true
  });

  const asteroid = new THREE.Mesh(geometry, material);

  const size = 0.65 + Math.random() * 1.15;

  asteroid.scale.set(
    size,
    size * (0.7 + Math.random() * 0.6),
    size
  );

  asteroid.position.set(
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 9,
    -85
  );

  asteroid.rotation.set(
    Math.random() * 3,
    Math.random() * 3,
    Math.random() * 3
  );

  asteroid.userData.rotationSpeed = {
    x: Math.random() * 1.5,
    y: Math.random() * 1.5,
    z: Math.random() * 1.5
  };

  asteroid.userData.size = size;

  scene.add(asteroid);
  asteroids.push(asteroid);
}

// ==========================================
// ENERGY ORB CREATION
// ==========================================

function createOrb() {
  const orb = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.38, 2),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff
    })
  );

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.045, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0x00aaff
    })
  );

  ring.rotation.x = Math.PI / 2;

  orb.add(core);
  orb.add(ring);

  orb.position.set(
    (Math.random() - 0.5) * 13,
    (Math.random() - 0.5) * 7,
    -85
  );

  scene.add(orb);
  orbs.push(orb);
}

// ==========================================
// PARTICLE EFFECT
// ==========================================

function createExplosion(position, color, amount = 20) {
  for (let i = 0; i < amount; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true
      })
    );

    particle.position.copy(position);

    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 5
    );

    particle.userData.life = 0.7 + Math.random() * 0.5;

    scene.add(particle);
    particles.push(particle);
  }
}

// END OF PART 2

// ==========================================
// GRAVITY REVERSAL
// ==========================================

function flipGravity() {
  if (gameOver) return;

  gravityReversed = !gravityReversed;

  gravityButton.textContent = gravityReversed
    ? "GRAVITY: REVERSED"
    : "FLIP GRAVITY";

  scene.fog.color.set(
    gravityReversed ? 0x250b45 : 0x02030b
  );

  gravityButton.style.borderColor = gravityReversed
    ? "#d45bff"
    : "#00eaff";

  gravityButton.style.boxShadow = gravityReversed
    ? "0 0 25px #c000ff"
    : "0 0 20px #008cff";

  createExplosion(
    ship.position.clone(),
    gravityReversed ? 0xc000ff : 0x00dfff,
    12
  );
}

gravityButton.addEventListener("click", flipGravity);

// ==========================================
// PLAYER CONTROLS
// ==========================================

let targetX = 0;
let targetY = 0;

function moveShip(x, y) {
  if (gameOver) return;

  targetX = THREE.MathUtils.clamp(x, -6.5, 6.5);
  targetY = THREE.MathUtils.clamp(y, -3.5, 3.5);
}

renderer.domElement.addEventListener("pointermove", (event) => {
  if (event.buttons === 0 && event.pointerType === "mouse") return;

  const rect = renderer.domElement.getBoundingClientRect();

  const normalizedX =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  const normalizedY =
    ((event.clientY - rect.top) / rect.height) * 2 - 1;

  const x = normalizedX * 6.5;
  let y = -normalizedY * 3.5;

  if (gravityReversed) {
    y *= -1;
  }

  moveShip(x, y);
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  renderer.domElement.setPointerCapture(event.pointerId);

  const rect = renderer.domElement.getBoundingClientRect();

  const normalizedX =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  const normalizedY =
    ((event.clientY - rect.top) / rect.height) * 2 - 1;

  const x = normalizedX * 6.5;
  let y = -normalizedY * 3.5;

  if (gravityReversed) {
    y *= -1;
  }

  moveShip(x, y);
});

// KEYBOARD CONTROLS
const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.code === "Space") {
    event.preventDefault();
    flipGravity();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ==========================================
// GAME OVER
// ==========================================

function endGame() {
  if (gameOver) return;

  gameOver = true;

  createExplosion(ship.position.clone(), 0xff315b, 50);

  document.getElementById("final-score").textContent =
    "SCORE: " + Math.floor(score);

  document.getElementById("final-energy").textContent =
    "ENERGY: " + energy;

  gameOverScreen.style.display = "flex";

  status.textContent = "MISSION FAILED";
}

// ==========================================
// RESTART GAME
// ==========================================

function restartGame() {
  score = 0;
  energy = 0;
  gameSpeed = 24;
  asteroidTimer = 0;
  orbTimer = 0;
  elapsed = 0;
  gravityReversed = false;
  gameOver = false;

  ship.position.set(0, 0, 4);
  ship.rotation.set(0, 0, 0);

  targetX = 0;
  targetY = 0;

  for (const asteroid of asteroids) {
    scene.remove(asteroid);
  }

  for (const orb of orbs) {
    scene.remove(orb);
  }

  for (const particle of particles) {
    scene.remove(particle);
  }

  asteroids.length = 0;
  orbs.length = 0;
  particles.length = 0;

  scene.fog.color.set(0x02030b);

  gravityButton.textContent = "FLIP GRAVITY";
  gravityButton.style.borderColor = "#00eaff";
  gravityButton.style.boxShadow = "0 0 20px #008cff";

  gameOverScreen.style.display = "none";
  status.textContent = "MISSION ACTIVE";
}

document
  .getElementById("restart-button")
  .addEventListener("click", restartGame);

// ==========================================
// HUD UPDATE
// ==========================================

function updateHUD() {
  document.getElementById("score").textContent =
    Math.floor(score);

  document.getElementById("energy").textContent = energy;

  document.getElementById("sector").textContent =
    Math.floor(elapsed / 20) + 1;
}

// END OF PART 3

// ==========================================
// MAIN GAME LOOP
// ==========================================

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  stars.rotation.y += delta * 0.006;

  // ENGINE ANIMATION
  engineLight.intensity = 17 + Math.sin(elapsed * 12) * 5;

  if (!gameOver && started) {
    elapsed += delta;

    // INCREASING DIFFICULTY
    gameSpeed = Math.min(24 + elapsed * 0.55, 65);

    score += delta * 10;

    // KEYBOARD MOVEMENT
    if (keys["arrowleft"] || keys["a"]) targetX -= delta * 8;
    if (keys["arrowright"] || keys["d"]) targetX += delta * 8;
    if (keys["arrowup"] || keys["w"]) targetY += delta * 8;
    if (keys["arrowdown"] || keys["s"]) targetY -= delta * 8;

    targetX = THREE.MathUtils.clamp(targetX, -6.5, 6.5);
    targetY = THREE.MathUtils.clamp(targetY, -3.5, 3.5);

    // SMOOTH SHIP MOVEMENT
    ship.position.x += (targetX - ship.position.x) * delta * 7;
    ship.position.y += (targetY - ship.position.y) * delta * 7;

    ship.rotation.z = -(ship.position.x - targetX) * 0.12;
    ship.rotation.x = (ship.position.y - targetY) * 0.08;

    // ASTEROID SPAWNING
    asteroidTimer += delta;

    const spawnDelay = Math.max(
      0.35,
      1.15 - elapsed * 0.008
    );

    if (asteroidTimer >= spawnDelay) {
      createAsteroid();
      asteroidTimer = 0;
    }

    // ENERGY ORB SPAWNING
    orbTimer += delta;

    if (orbTimer >= 2.8) {
      createOrb();
      orbTimer = 0;
    }

    // ASTEROID MOVEMENT AND COLLISIONS
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const asteroid = asteroids[i];

      asteroid.position.z += gameSpeed * delta;

      asteroid.rotation.x +=
        asteroid.userData.rotationSpeed.x * delta;

      asteroid.rotation.y +=
        asteroid.userData.rotationSpeed.y * delta;

      asteroid.rotation.z +=
        asteroid.userData.rotationSpeed.z * delta;

      const distance = asteroid.position.distanceTo(
        ship.position
      );

      const collisionDistance =
        0.85 + asteroid.userData.size * 0.65;

      if (distance < collisionDistance) {
        endGame();
        break;
      }

      if (asteroid.position.z > 12) {
        scene.remove(asteroid);
        asteroids.splice(i, 1);
      }
    }

    // ENERGY ORB MOVEMENT AND COLLECTION
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];

      orb.position.z += gameSpeed * delta;
      orb.rotation.y += delta * 2.5;

      orb.children[1].rotation.z += delta * 2;

      const distance = orb.position.distanceTo(
        ship.position
      );

      if (distance < 1.5) {
        energy += 1;
        score += 100;

        createExplosion(
          orb.position.clone(),
          0x00ffff,
          18
        );

        scene.remove(orb);
        orbs.splice(i, 1);
        continue;
      }

      if (orb.position.z > 12) {
        scene.remove(orb);
        orbs.splice(i, 1);
      }
    }

    // PARTICLE ANIMATION
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      particle.position.addScaledVector(
        particle.userData.velocity,
        delta
      );

      particle.userData.life -= delta;

      particle.material.opacity = Math.max(
        0,
        particle.userData.life
      );

      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(i, 1);
      }
    }

    // UPDATE HUD
    updateHUD();

    if (elapsed > 0) {
      status.textContent = gravityReversed
        ? "GRAVITY INVERSION ACTIVE"
        : "MISSION ACTIVE";
    }
  } else if (gameOver) {
    // KEEP DESTRUCTION PARTICLES ANIMATING
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      particle.position.addScaledVector(
        particle.userData.velocity,
        delta
      );

      particle.userData.life -= delta;
      particle.material.opacity = Math.max(
        0,
        particle.userData.life
      );

      if (particle.userData.life <= 0) {
        scene.remove(particle);
        particles.splice(i, 1);
      }
    }
  }

  renderer.render(scene, camera);
}

// ==========================================
// SCREEN RESIZING
// ==========================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );
});

// ==========================================
// START GAME
// ==========================================

status.textContent = "MISSION ACTIVE";

animate();

// END OF PART 4 — GAME CODE COMPLETE
