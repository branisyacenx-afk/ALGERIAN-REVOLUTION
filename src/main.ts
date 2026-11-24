import * as THREE from 'three';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#game-root');
if (!root) throw new Error('Game root not found');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba99a);
scene.fog = new THREE.Fog(0x9ba99a, 34, 150);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdde8df, 0x51483a, 2.0));
const sun = new THREE.DirectionalLight(0xffe0ad, 2.2);
sun.position.set(-28, 48, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const terrain = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 40, 40), new THREE.MeshStandardMaterial({ color: 0x777b5d, roughness: 1 }));
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Low-poly ridgelines are deliberate greybox placeholders, not final scanned locations.
function ridge(x: number, z: number, sx: number, sy: number, sz: number, color: number): void {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 5), new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 }));
  mesh.position.set(x, sy / 2 - 1, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.y = Math.random() * 0.4;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
}
for (let i = 0; i < 34; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  ridge(side * (25 + Math.random() * 55), -35 + Math.random() * 105, 12 + Math.random() * 20, 20 + Math.random() * 42, 15 + Math.random() * 24, i % 3 === 0 ? 0x656c58 : 0x77745f);
}
for (let i = 0; i < 48; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.2, 0), new THREE.MeshStandardMaterial({ color: 0x777263, flatShading: true }));
  rock.position.set((Math.random() - 0.5) * 75, 0.35, (Math.random() - 0.5) * 95);
  rock.scale.y = 0.5 + Math.random();
  rock.castShadow = true;
  scene.add(rock);
}

function makePerson(color: number, scale = 1): THREE.Group {
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9a704f });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 4, 8), cloth);
  body.position.y = 1.05;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin);
  head.position.y = 1.72;
  head.castShadow = true;
  group.add(head);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.34), cloth);
  legs.position.y = 0.38;
  legs.castShadow = true;
  group.add(legs);
  group.scale.setScalar(scale);
  return group;
}

const player = makePerson(0x354c3b, 1);
player.position.set(0, 0, 9);
scene.add(player);
const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x292b28, metalness: 0.45, roughness: 0.65 }));
weapon.position.set(0.38, 1.18, -0.48);
player.add(weapon);

const enemies: THREE.Group[] = [];
for (let i = 0; i < 4; i++) {
  const enemy = makePerson(0x55594e, 0.95);
  enemy.position.set((i - 1.5) * 5.5, 0, -15 - (i % 2) * 5);
  scene.add(enemy);
  enemies.push(enemy);
}

const marker = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.09, 8, 36), new THREE.MeshBasicMaterial({ color: 0xe9c36f }));
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.16;
marker.add(ring);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.55, 5, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xe9c36f, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
beam.position.y = 2.5;
marker.add(beam);
marker.position.set(0, 0, -28);
scene.add(marker);

const keys = new Set<string>();
let started = false;
let health = 100;
let ammo = 12;
let reserveAmmo = 48;
let missionDone = false;
let gameOver = false;
let lookPointer: number | null = null;
let lastTouchX = 0;
let lastTouchY = 0;
let yaw = 0;
let pitch = -0.12;
let verticalVelocity = 0;
let onGround = true;
const clock = new THREE.Clock();
const direction = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const enemyMeshes: THREE.Object3D[] = [];
enemies.forEach((enemy) => enemy.traverse((part) => { if (part instanceof THREE.Mesh) enemyMeshes.push(part); }));

const $ = <T extends HTMLElement>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing UI element: ${selector}`);
  return el;
};
const startScreen = $('#start-screen');
const toast = $('#toast');
let toastTimer = 0;
function notify(message: string): void {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}
function updateHud(): void {
  $('#health-value').textContent = `${health}%`;
  $('#health-meter').style.width = `${health}%`;
  $('#ammo-value').textContent = `${ammo} / ${reserveAmmo}`;
  $('#mission-progress').style.width = missionDone ? '100%' : '0%';
  $('#mission-status').textContent = missionDone ? 'اكتمل الهدف الأول — أحسنت!' : 'الهدف: الوصول إلى نقطة التجمع';
}

function resetEnemies(): void {
  for (const enemy of enemies) scene.remove(enemy);
  enemies.length = 0;
  enemyMeshes.length = 0;
  for (let i = 0; i < 4; i++) {
    const enemy = makePerson(0x55594e, 0.95);
    enemy.position.set((i - 1.5) * 5.5, 0, -15 - (i % 2) * 5);
    scene.add(enemy);
    enemies.push(enemy);
    enemy.traverse((part) => { if (part instanceof THREE.Mesh) enemyMeshes.push(part); });
  }
}
function beginGame(): void {
  if (gameOver) {
    health = 100; ammo = 12; reserveAmmo = 48; missionDone = false; gameOver = false;
    player.position.set(0, 0, 9); player.rotation.set(0, 0, 0);
    verticalVelocity = 0; onGround = true; resetEnemies(); updateHud();
  }
  started = true;
  startScreen.style.display = 'none';
  if (window.matchMedia('(pointer:fine)').matches) renderer.domElement.requestPointerLock();
  notify('تحرّك نحو العلامة الذهبية في الممر.');
}
$('#start-button').addEventListener('click', beginGame);
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement && started) {
    // Keyboard movement remains available after the pointer is released.
  }
});
document.addEventListener('mousemove', (event) => {
  if (!started || document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0018, -0.7, 0.45);
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' || !started) return;
  lookPointer = event.pointerId; lastTouchX = event.clientX; lastTouchY = event.clientY;
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'touch' || lookPointer !== event.pointerId) return;
  const dx = event.clientX - lastTouchX; const dy = event.clientY - lastTouchY;
  lastTouchX = event.clientX; lastTouchY = event.clientY;
  yaw -= dx * 0.006; pitch = THREE.MathUtils.clamp(pitch - dy * 0.004, -0.7, 0.45);
});
const releaseLook = (event: PointerEvent) => { if (lookPointer === event.pointerId) lookPointer = null; };
renderer.domElement.addEventListener('pointerup', releaseLook);
renderer.domElement.addEventListener('pointercancel', releaseLook);
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'Space') event.preventDefault();
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
function reloadWeapon(): void {
  if (!started || ammo === 12 || reserveAmmo <= 0) return;
  const loaded = Math.min(12 - ammo, reserveAmmo);
  ammo += loaded; reserveAmmo -= loaded; updateHud(); notify('تم تلقيم السلاح.');
}
document.addEventListener('keydown', (event) => { if (event.code === 'KeyR' && !event.repeat) reloadWeapon(); });
$('#reload-button').addEventListener('click', reloadWeapon);
window.addEventListener('blur', () => keys.clear());

function shoot(): void {
  if (!started || gameOver || ammo <= 0) {
    if (ammo <= 0) notify('انتهت الذخيرة في هذا النموذج التجريبي.');
    return;
  }
  ammo--;
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  const aim = new THREE.Vector3(Math.sin(yaw), pitch, -Math.cos(yaw)).normalize();
  raycaster.set(origin, aim);
  raycaster.far = 45;
  const hit = raycaster.intersectObjects(enemyMeshes, false)[0];
  if (hit) {
    const target = enemies.find((enemy) => {
      let found = false;
      enemy.traverse((part) => { if (part === hit.object) found = true; });
      return found;
    });
    if (target) {
      scene.remove(target);
      const index = enemies.indexOf(target);
      if (index >= 0) enemies.splice(index, 1);
      const removedMeshes: THREE.Object3D[] = [];
      target.traverse((part) => { if (part instanceof THREE.Mesh) removedMeshes.push(part); });
      for (const part of removedMeshes) {
        const meshIndex = enemyMeshes.indexOf(part);
        if (meshIndex >= 0) enemyMeshes.splice(meshIndex, 1);
      }
      notify('تم تحييد خصم في النموذج التجريبي.');
    }
  }
  updateHud();
}
document.addEventListener('mousedown', (event) => { if (event.button === 0) shoot(); });
$('#fire-button').addEventListener('click', shoot);
$('#jump-button').addEventListener('click', () => { if (started && !gameOver && onGround) { verticalVelocity = 6.2; onGround = false; } });

const joystick = $('#joystick');
const stick = $('#stick');
let touchX = 0;
let touchY = 0;
let joystickPointer: number | null = null;
joystick.addEventListener('pointerdown', (event) => { joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); });
joystick.addEventListener('pointermove', (event) => {
  if (joystickPointer !== event.pointerId) return;
  const rect = joystick.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const length = Math.max(1, Math.hypot(dx, dy));
  const scale = Math.min(34 / length, 1);
  touchX = (dx * scale) / 34;
  touchY = (dy * scale) / 34;
  stick.style.transform = `translate(${touchX * 34}px,${touchY * 34}px)`;
});
const releaseJoystick = () => { joystickPointer = null; touchX = 0; touchY = 0; stick.style.transform = 'translate(0,0)'; };
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

function animate(): void {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  marker.position.y = Math.sin(time * 2) * 0.12;
  ring.rotation.z += delta * 0.65;

  if (started && !gameOver) {
    const inputX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + touchX;
    const inputZ = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) - touchY;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    direction.set(0, 0, 0).addScaledVector(right, inputX).addScaledVector(forward, inputZ);
    if (direction.lengthSq() > 0.01) {
      direction.normalize();
      const speed = keys.has('ShiftLeft') ? 8.5 : 5.2;
      player.position.addScaledVector(direction, speed * delta);
      player.rotation.y = Math.atan2(-direction.x, -direction.z);
    }
    if (keys.has('Space') && onGround) { verticalVelocity = 6.2; onGround = false; }
    verticalVelocity -= 17 * delta;
    player.position.y += verticalVelocity * delta;
    if (player.position.y <= 0) { player.position.y = 0; verticalVelocity = 0; onGround = true; }
    player.position.x = THREE.MathUtils.clamp(player.position.x, -72, 72);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -75, 65);

    const distanceToGoal = player.position.distanceTo(marker.position);
    if (!missionDone && distanceToGoal < 3.2) {
      missionDone = true;
      updateHud();
      notify('اكتملت المهمة التجريبية: وصلت إلى نقطة التجمع.');
    }
    enemies.forEach((enemy, index) => {
      if (enemy.parent === null) return;
      const distance = enemy.position.distanceTo(player.position);
      if (distance < 14 && distance > 3.2) {
        const toward = player.position.clone().sub(enemy.position).setY(0).normalize();
        enemy.position.addScaledVector(toward, delta * 0.65);
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
      }
      if (distance < 3.2 && Math.random() < delta * 0.22) {
        health = Math.max(0, health - 5);
        updateHud();
        if (health === 0) {
          gameOver = true; started = false;
          $('#start-button').textContent = 'إعادة المحاولة';
          startScreen.style.display = 'grid';
          notify('انتهت المحاولة. يمكنك البدء من جديد.');
        }
      }
      enemy.position.y = 0;
      enemy.rotation.y += Math.sin(time + index) * delta * 0.03;
    });

    const cameraOffset = new THREE.Vector3(Math.sin(yaw) * 5.2, 3.1 + pitch * 1.8, Math.cos(yaw) * 5.2);
    const cameraTarget = player.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    camera.position.lerp(cameraTarget.clone().add(cameraOffset), 1 - Math.pow(0.001, delta));
    camera.lookAt(cameraTarget);
  } else {
    camera.position.set(Math.sin(time * 0.08) * 34, 19, 35);
    camera.lookAt(0, 1, -10);
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});
updateHud();
