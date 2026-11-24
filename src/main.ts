import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#game-root');
if (!root) throw new Error('Game root not found');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba99a);
scene.fog = new THREE.Fog(0x9ba99a, 48, 270);
// Some Android in-app browsers report pointer/orientation media features unreliably.
const isPortraitTouch = () => window.innerHeight > window.innerWidth && window.innerWidth < 1100;
// Apply the simulated landscape layout immediately, before the start screen is shown.
document.body.classList.toggle('portrait-landscape-sim', isPortraitTouch());
const viewWidth = () => isPortraitTouch() ? window.innerHeight : window.innerWidth;
const viewHeight = () => isPortraitTouch() ? window.innerWidth : window.innerHeight;
const camera = new THREE.PerspectiveCamera(76, viewWidth() / viewHeight(), 0.1, 440);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(viewWidth(), viewHeight());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdde8df, 0x51483a, 2.0));
const sun = new THREE.DirectionalLight(0xffe0ad, 2.2);
sun.position.set(-28, 48, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const terrain = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 64, 64), new THREE.MeshStandardMaterial({ color: 0x777b5d, roughness: 1 }));
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// A narrow, stylized dirt track gives the first playable space a readable route.
const trailCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.5, 0.035, 15),
  new THREE.Vector3(0.2, 0.035, 5),
  new THREE.Vector3(-2.4, 0.035, -6),
  new THREE.Vector3(-1.2, 0.035, -17),
  new THREE.Vector3(0, 0.035, -29),
  new THREE.Vector3(2.8, 0.035, -39)
]);
const trail = new THREE.Mesh(
  new THREE.TubeGeometry(trailCurve, 90, 0.72, 8, false),
  new THREE.MeshStandardMaterial({ color: 0x927d5d, roughness: 1 })
);
trail.scale.y = 0.035;
trail.receiveShadow = true;
scene.add(trail);

// Sparse low-poly trees help establish scale without heavy mobile rendering cost.
for (let i = 0; i < 26; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const z = 13 - i * 2.25;
  const x = side * (7 + (i % 4) * 2.1);
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.2, 1.25, 6),
    new THREE.MeshStandardMaterial({ color: 0x554533, roughness: 1 })
  );
  trunk.position.y = 0.62;
  trunk.castShadow = true;
  tree.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 3.2, 6),
    new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x48563d : 0x596447, flatShading: true, roughness: 1 })
  );
  crown.position.y = 2.55;
  crown.castShadow = true;
  tree.add(crown);
  tree.position.set(x, 0, z);
  tree.rotation.y = i * 0.73;
  scene.add(tree);
}


// Extended mountain woodland: distant tree groups create a much larger readable landscape.
for (let i = 0; i < 52; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 24 + Math.random() * 128;
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.7, 6), new THREE.MeshStandardMaterial({ color: 0x554533, roughness: 1 }));
  trunk.position.y = 0.85; trunk.castShadow = true; tree.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35 + Math.random() * 0.8, 3.8 + Math.random() * 1.6, 6), new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x3e5139 : 0x536044, flatShading: true, roughness: 1 }));
  crown.position.y = 3.0; crown.castShadow = true; tree.add(crown);
  tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius - 24);
  tree.rotation.y = Math.random() * Math.PI * 2; scene.add(tree);
}

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
for (let i = 0; i < 62; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 72 + Math.random() * 112;
  ridge(Math.cos(angle) * radius, Math.sin(angle) * radius - 24, 18 + Math.random() * 34, 24 + Math.random() * 58, 20 + Math.random() * 38, i % 3 === 0 ? 0x656c58 : 0x77745f);
}
for (let i = 0; i < 48; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.2, 0), new THREE.MeshStandardMaterial({ color: 0x777263, flatShading: true }));
  rock.position.set((Math.random() - 0.5) * 75, 0.35, (Math.random() - 0.5) * 95);
  rock.scale.y = 0.5 + Math.random();
  rock.castShadow = true;
  scene.add(rock);
}


function addStoneOutpost(x: number, z: number, rotation = 0): void {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x777365, roughness: 1, flatShading: true });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x4d4b42, roughness: 1 });
  const timber = new THREE.MeshStandardMaterial({ color: 0x493724, roughness: 1 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.1, 0.65), stone);
  wall.position.y = 1.55; wall.castShadow = true; wall.receiveShadow = true; group.add(wall);
  const sideA = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.1, 5.2), stone);
  sideA.position.set(-3.25, 1.55, 2.2); sideA.castShadow = true; group.add(sideA);
  const sideB = sideA.clone(); sideB.position.x = 3.25; group.add(sideB);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.3, 4), darkStone);
  roof.position.y = 4.05; roof.rotation.y = Math.PI / 4; roof.scale.set(1,1,0.78); roof.castShadow = true; group.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.25, 0.12), timber);
  door.position.set(0, 1.12, 2.55); group.add(door);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.2), darkStone);
  lintel.position.set(0, 2.35, 2.55); group.add(lintel);
  group.position.set(x, 0, z); group.rotation.y = rotation; scene.add(group);
}
function addSandbagLine(x: number, z: number, count: number, rotation = 0): void {
  const group = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x8c8065, roughness: 1 });
  for (let i = 0; i < count; i++) {
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.62, 3, 6), bagMat);
    bag.rotation.z = Math.PI / 2; bag.position.set((i - (count - 1) / 2) * 0.72, 0.32, 0);
    bag.castShadow = true; bag.receiveShadow = true; group.add(bag);
    if (i % 2 === 0) {
      const upper = bag.clone(); upper.position.y = 0.78; upper.position.x += 0.34; group.add(upper);
    }
  }
  group.position.set(x, 0, z); group.rotation.y = rotation; scene.add(group);
}
function addWatchPost(x: number, z: number): void {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x59432b, roughness: 1 });
  for (const px of [-1.1, 1.1]) for (const pz of [-1.1, 1.1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.8, 6), wood);
    post.position.set(px, 2.9, pz); post.castShadow = true; group.add(post);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.25, 3.1), wood);
  deck.position.y = 3.3; deck.castShadow = true; group.add(deck);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 1.5, 4), new THREE.MeshStandardMaterial({color:0x49483b,roughness:1}));
  roof.position.y = 6.3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; group.add(roof);
  group.position.set(x, 0, z); scene.add(group);
}
addStoneOutpost(11, -23, -0.18);
addStoneOutpost(-13, -39, 0.22);
addSandbagLine(-5.5, -14, 7, 0.12);
addSandbagLine(5.2, -31, 6, -0.18);
addWatchPost(15, -42);

// A prominent Algerian flag anchors the rally point and is built locally (no external asset required).
const flagCanvas = document.createElement('canvas');
flagCanvas.width = 512; flagCanvas.height = 300;
const flagCtx = flagCanvas.getContext('2d');
if (!flagCtx) throw new Error('Flag canvas is unavailable');
flagCtx.fillStyle = '#ffffff'; flagCtx.fillRect(0, 0, 512, 300);
flagCtx.fillStyle = '#006233'; flagCtx.fillRect(0, 0, 256, 300);
flagCtx.fillStyle = '#d21034'; flagCtx.beginPath(); flagCtx.arc(256, 150, 72, 0, Math.PI * 2); flagCtx.fill();
flagCtx.fillStyle = '#ffffff'; flagCtx.beginPath(); flagCtx.arc(282, 128, 61, 0, Math.PI * 2); flagCtx.fill();
const starPoints: number[][] = [];
for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 === 0 ? 34 : 14; starPoints.push([342 + Math.cos(a) * r, 150 + Math.sin(a) * r]); }
flagCtx.fillStyle = '#d21034'; flagCtx.beginPath(); starPoints.forEach(([x,y],i) => i ? flagCtx.lineTo(x,y) : flagCtx.moveTo(x,y)); flagCtx.closePath(); flagCtx.fill();
const flagTexture = new THREE.CanvasTexture(flagCanvas); flagTexture.colorSpace = THREE.SRGBColorSpace;
const flagGroup = new THREE.Group();
const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.16,12,10),new THREE.MeshStandardMaterial({color:0x777b78,metalness:0.55,roughness:0.45}));
flagPole.position.y=6; flagPole.castShadow=true; flagGroup.add(flagPole);
const poleTop = new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8),new THREE.MeshStandardMaterial({color:0xc8a65f,metalness:0.6,roughness:0.3}));
poleTop.position.y=12.1; flagGroup.add(poleTop);
const flagGeometry = new THREE.PlaneGeometry(5.4,3.15,20,12);
flagGeometry.translate(2.7,10.35,0);
const flag = new THREE.Mesh(flagGeometry,new THREE.MeshStandardMaterial({map:flagTexture,side:THREE.DoubleSide,roughness:0.8}));
flag.castShadow=true; flagGroup.add(flag);
flagGroup.position.set(-8,0,-37); scene.add(flagGroup);
const flagRestPositions = flagGeometry.attributes.position.array.slice();

type CoverZone = { position: THREE.Vector3; radius: number };
const coverZones: CoverZone[] = [];
function addConcealmentBush(x:number,z:number):void {
  const bush = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({color:0x344b31,roughness:1,flatShading:true});
  for(let i=0;i<7;i++){
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + Math.random()*0.5,0),green);
    leaf.position.set((Math.random()-0.5)*2.3,0.45+Math.random()*0.8,(Math.random()-0.5)*1.8);
    leaf.scale.y=0.75+Math.random()*0.45; leaf.castShadow=true; bush.add(leaf);
  }
  bush.position.set(x,0,z); scene.add(bush);
  coverZones.push({position:new THREE.Vector3(x,0,z),radius:4.8});
}
for(const [x,z] of [[-5,-18],[9,-11],[-15,-31],[18,-39],[25,-61],[-32,-65],[40,10],[-40,15],[53,-22],[-57,-5],[12,34],[-18,48]] as number[][]) addConcealmentBush(x,z);
// Defensive structures also provide valid cover for crouching and breaking enemy line of sight.
for(const [x,z,radius] of [[11,-23,6],[-13,-39,6],[-5.5,-14,5],[5.2,-31,5],[15,-42,4]] as number[][]) coverZones.push({position:new THREE.Vector3(x,0,z),radius});
function isPlayerInCover():boolean {
  return coverZones.some(zone => Math.hypot(player.position.x-zone.position.x,player.position.z-zone.position.z) < zone.radius);
}

function makePerson(color: number, scale = 1): THREE.Group {
  // Improved temporary historical-inspired silhouettes. These remain procedural placeholders,
  // not scans or representations of named historical people.
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.96 });
  const trousers = new THREE.MeshStandardMaterial({ color: color === 0x354c3b ? 0x4b5140 : 0x4b4a40, roughness: 1 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x493b2b, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9a704f, roughness: 0.95 });
  const wrap = new THREE.MeshStandardMaterial({ color: color === 0x354c3b ? 0xb9a77e : 0x77715f, roughness: 1 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.58, 5, 10), cloth);
  torso.userData.outfitRole = 'cloth'; torso.position.y = 1.18; torso.castShadow = true; group.add(torso);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.32, 0.37), cloth);
  chest.userData.outfitRole = 'cloth'; chest.position.set(0, 1.38, 0); chest.castShadow = true; group.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.225, 14, 12), skin);
  head.position.y = 1.83; head.castShadow = true; group.add(head);
  const headWrap = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), wrap);
  headWrap.userData.outfitRole = 'wrap'; headWrap.position.y = 1.91; headWrap.castShadow = true; group.add(headWrap);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.09), skin);
  nose.position.set(0, 1.79, -0.215); group.add(nose);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.38), leather);
  belt.position.y = 0.91; group.add(belt);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.48, 4, 7), trousers);
    leg.userData.motionRole = side < 0 ? 'leftLeg' : 'rightLeg'; leg.userData.outfitRole = 'trousers';
    leg.position.set(side * 0.17, 0.48, 0); leg.castShadow = true; group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.34), leather);
    boot.position.set(side * 0.17, 0.12, -0.055); boot.castShadow = true; group.add(boot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.48, 4, 7), cloth);
    arm.userData.motionRole = side < 0 ? 'leftArm' : 'rightArm'; arm.userData.outfitRole = 'cloth';
    arm.position.set(side * 0.43, 1.24, 0); arm.rotation.z = side * -0.12; arm.castShadow = true; group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 7), skin);
    hand.position.set(side * 0.45, 0.91, -0.02); group.add(hand);
  }
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.2), leather);
  pack.position.set(0, 1.28, 0.29); pack.castShadow = true; group.add(pack);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.7, 0.08), wrap);
  strap.position.set(-0.22, 1.22, -0.015); strap.rotation.z = -0.2; group.add(strap);

  group.scale.setScalar(scale);
  return group;
}
const player = makePerson(0x354c3b, 1);
player.position.set(0, 0, 9);
scene.add(player);
function setPlayerOutfit(kind: 'algerian' | 'french'): void {
  const palette = kind === 'algerian'
    ? { cloth: 0x526348, trousers: 0x3e4939, wrap: 0xd0bd91 }
    : { cloth: 0x34465a, trousers: 0x303a48, wrap: 0x465365 };
  player.traverse((part) => {
    if (!(part instanceof THREE.Mesh) || !part.userData.outfitRole) return;
    const role = part.userData.outfitRole as keyof typeof palette;
    const material = part.material as THREE.MeshStandardMaterial;
    material.color.setHex(palette[role]);
  });
  if (player.userData.characterModel) tintCharacter(player, kind === 'algerian' ? 0x9aa184 : 0x7f8a9c);
  notify(kind === 'algerian' ? 'تم اختيار الزي الجزائري التمثيلي.' : 'تم اختيار الزي العسكري الفرنسي التمثيلي.');
}
const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x292b28, metalness: 0.45, roughness: 0.65 }));
weapon.position.set(0.38, 1.18, -0.48);
weapon.userData.keepOnCharacter = true;
player.add(weapon);

const enemies: THREE.Group[] = [];
for (let i = 0; i < 6; i++) {
  const enemy = makePerson(0x55594e, 0.95);
  enemy.position.set((i - 1.5) * 5.5, 0, -15 - (i % 2) * 5);
  enemy.userData.health = 2;
  enemy.userData.fireCooldown = 1.2 + i * 0.35;
  enemy.userData.patrolX = enemy.position.x;
  enemy.userData.patrolZ = enemy.position.z;
  enemy.userData.patrolPhase = i * 1.7;
  scene.add(enemy);
  enemies.push(enemy);
}


/*
 * Character upgrade: load a rigged, textured humanoid soldier with Idle/Walk/Run
 * clips. Each actor gets an independent skeleton and AnimationMixer.
 * The procedural body remains only as an offline fallback during loading.
 */
const characterMixers: THREE.AnimationMixer[] = [];
let soldierTemplate: THREE.Group | null = null;
const soldierLoader = new GLTFLoader();

function setCharacterAnimation(actor: THREE.Group, name: 'Idle' | 'Walk' | 'Run'): void {
  const actions = actor.userData.characterActions as Record<string, THREE.AnimationAction> | undefined;
  if (!actions) return;
  const next = actions[name] || actions.Idle;
  const current = actor.userData.currentCharacterAction as THREE.AnimationAction | undefined;
  if (!next || current === next) return;
  next.reset().fadeIn(0.22).play();
  current?.fadeOut(0.22);
  actor.userData.currentCharacterAction = next;
}

function tintCharacter(actor: THREE.Group, tint: number): void {
  actor.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.setHex(tint);
        material.roughness = Math.max(material.roughness, 0.72);
      }
    }
  });
}

function attachSoldierModel(actor: THREE.Group, tint: number): void {
  if (!soldierTemplate) return;
  const oldMixer = actor.userData.characterMixer as THREE.AnimationMixer | undefined;
  if (oldMixer) {
    oldMixer.stopAllAction();
    const oldIndex = characterMixers.indexOf(oldMixer);
    if (oldIndex >= 0) characterMixers.splice(oldIndex, 1);
  }
  for (const child of [...actor.children]) {
    if (child.userData.keepOnCharacter) {
      // The external model includes its own rifle; hide the temporary placeholder weapon.
      child.visible = false;
      continue;
    }
    actor.remove(child);
  }

  const model = cloneSkeleton(soldierTemplate);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const fitScale = size.y > 0.01 ? 1.86 / size.y : 1;
  model.scale.setScalar(fitScale);
  model.position.y = -bounds.min.y * fitScale;
  // Mixamo's sample soldier faces +Z; the game actors face -Z.
  model.rotation.y = Math.PI;
  model.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    part.castShadow = true;
    part.receiveShadow = true;
  });
  // Clone materials per actor so faction colors never leak between soldiers.
  model.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return;
    if (Array.isArray(part.material)) {
      part.material = part.material.map((mat) => {
        const copy = mat.clone();
        if (copy instanceof THREE.MeshStandardMaterial) {
          copy.color.setHex(tint);
          copy.roughness = Math.max(copy.roughness, 0.72);
        }
        return copy;
      });
    } else {
      const copy = part.material.clone();
      if (copy instanceof THREE.MeshStandardMaterial) {
        copy.color.setHex(tint);
        copy.roughness = Math.max(copy.roughness, 0.72);
      }
      part.material = copy;
    }
  });
  actor.add(model);
  actor.userData.characterModel = model;
  const mixer = new THREE.AnimationMixer(model);
  const actions: Record<string, THREE.AnimationAction> = {};
  for (const clip of soldierTemplate.userData.animations as THREE.AnimationClip[] || []) {
    if (['Idle', 'Walk', 'Run'].includes(clip.name)) actions[clip.name] = mixer.clipAction(clip);
  }
  actor.userData.characterMixer = mixer;
  actor.userData.characterActions = actions;
  characterMixers.push(mixer);
  setCharacterAnimation(actor, 'Idle');
}

async function loadSoldierCharacters(): Promise<void> {
  try {
    const gltf = await soldierLoader.loadAsync(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb'
    );
    soldierTemplate = gltf.scene;
    soldierTemplate.userData.animations = gltf.animations;
    soldierTemplate.traverse((part) => {
      if (part instanceof THREE.Mesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
    attachSoldierModel(player, 0x9aa184);
    for (const enemy of enemies) attachSoldierModel(enemy, 0x858b7b);
    enemyMeshes.length = 0;
    enemies.forEach((enemy) => enemy.traverse((part) => {
      if (part instanceof THREE.Mesh) enemyMeshes.push(part);
    }));
    notify('اكتمل تحميل مجسمات الجنود ثلاثية الأبعاد وحركاتهم.');
  } catch (error) {
    console.warn('Soldier model could not be loaded; keeping the offline fallback.', error);
    notify('تعذر تحميل نموذج الجندي من الإنترنت؛ تحقق من الاتصال لإظهار المجسمات البشرية.');
  }
}
void loadSoldierCharacters();

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

// Supply cache: a clearly marked first interaction, built from temporary geometry.
const supplyCache = new THREE.Group();
const cacheBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.25, 0.72, 0.9),
  new THREE.MeshStandardMaterial({ color: 0x72583b, roughness: 0.9 })
);
cacheBody.position.y = 0.42;
cacheBody.castShadow = true;
supplyCache.add(cacheBody);
const cacheLid = new THREE.Mesh(
  new THREE.BoxGeometry(1.3, 0.16, 0.95),
  new THREE.MeshStandardMaterial({ color: 0x9a7b4d, roughness: 0.8 })
);
cacheLid.position.y = 0.86;
cacheLid.castShadow = true;
supplyCache.add(cacheLid);
const cacheMark = new THREE.Mesh(
  new THREE.TorusGeometry(0.95, 0.07, 8, 28),
  new THREE.MeshBasicMaterial({ color: 0xe9c36f })
);
cacheMark.rotation.x = Math.PI / 2;
cacheMark.position.y = 0.12;
supplyCache.add(cacheMark);
supplyCache.position.set(-3, 0, -8);
scene.add(supplyCache);

const keys = new Set<string>();
let started = false;
let paused = false;
let health = 100;
let stamina = 100;
let mobileSprint = false;
let ammo = 12;
let reserveAmmo = 48;
let reloading = false;
let fireHoldTimer: number | null = null;
let missionDone = false;
let suppliesCollected = false;
let goalNeedsSuppliesNotified = false;
let goalNeedsEnemiesNotified = false;
let gameOver = false;
let damageCooldown = 0;
let radarElapsed = 0;
let lookPointer: number | null = null;
let lastTouchX = 0;
let lastTouchY = 0;
let yaw = 0;
let pitch = -0.10;
let cameraDistance = 7.2;
let aiming = false;
let crouching = false;
let playerHidden = false;
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
  $('#stamina-value').textContent = `${Math.round(stamina)}%`;
  $('#stamina-meter').style.width = `${stamina}%`;
  $('#ammo-value').textContent = `${ammo} / ${reserveAmmo}`;
  const progress = missionDone ? 100 : !suppliesCollected ? 0 : enemies.length > 0 ? 33 : 66;
  $('#mission-progress').style.width = `${progress}%`;
  $('#mission-status').textContent = missionDone
    ? 'اكتملت المهمة — وصلت إلى نقطة التجمع!'
    : !suppliesCollected
      ? '1/3: اجمع صندوق الإمدادات (E)'
      : enemies.length > 0
        ? `2/3: حيّد التهديدات المتبقية (${enemies.length})`
        : '3/3: الطريق آمن، توجه إلى نقطة التجمع';
}

function resetEnemies(): void {
  for (const enemy of enemies) {
    const mixer = enemy.userData.characterMixer as THREE.AnimationMixer | undefined;
    if (mixer) { mixer.stopAllAction(); const index = characterMixers.indexOf(mixer); if (index >= 0) characterMixers.splice(index, 1); }
    scene.remove(enemy);
  }
  enemies.length = 0;
  enemyMeshes.length = 0;
  for (let i = 0; i < 4; i++) {
    const enemy = makePerson(0x55594e, 0.95);
    if (soldierTemplate) attachSoldierModel(enemy, 0x858b7b);
    enemy.position.set((i - 1.5) * 5.5, 0, -15 - (i % 2) * 5);
    enemy.userData.health = 2;
    enemy.userData.fireCooldown = 1.2 + i * 0.35;
    enemy.userData.patrolX = enemy.position.x;
    enemy.userData.patrolZ = enemy.position.z;
    enemy.userData.patrolPhase = i * 1.7;
    scene.add(enemy);
    enemies.push(enemy);
    enemy.traverse((part) => { if (part instanceof THREE.Mesh) enemyMeshes.push(part); });
  }
}
function beginGame(): void {
  if (gameOver) {
    health = 100; stamina = 100; damageCooldown = 0; ammo = 12; reserveAmmo = 48; missionDone = false; suppliesCollected = false; goalNeedsSuppliesNotified = false; goalNeedsEnemiesNotified = false; gameOver = false;
    supplyCache.visible = true;
    player.position.set(0, 0, 9); player.rotation.set(0, 0, 0); player.scale.set(1,1,1); crouching = false; playerHidden = false; $('#hide-button').classList.remove('active'); $('#hide-button').textContent = 'اختباء';
    yaw = 0; pitch = -0.10; cameraDistance = 7.2;
    verticalVelocity = 0; onGround = true; resetEnemies(); updateHud();
document.body.classList.toggle('portrait-landscape-sim', isPortraitTouch());
  }
  started = true;
  document.body.classList.add('game-started');
  paused = false;
  // Android browsers generally allow orientation lock after a user gesture/fullscreen.
  if (window.matchMedia('(pointer: coarse)').matches) {
    const rootElement = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    const enterLandscape = async () => {
      try {
        if (!document.fullscreenElement && rootElement.requestFullscreen) await rootElement.requestFullscreen();
        await orientation.lock?.('landscape');
      } catch {
        document.body.classList.add('needs-landscape');
      }
    };
    void enterLandscape();
  }
  $('#pause-screen').classList.remove('visible');
  $('#victory-screen').classList.remove('visible');
  startScreen.style.display = 'none';
  if (window.matchMedia('(pointer:fine)').matches) renderer.domElement.requestPointerLock();
  notify('🇩🇿 العلم الجزائري يحدد نقطة التجمع. ابحث عن الشجيرات والصخور واضغط C للاختباء.');
}
$('#outfit-algerian').addEventListener('click', () => setPlayerOutfit('algerian'));
$('#outfit-french').addEventListener('click', () => setPlayerOutfit('french'));
$('#start-button').addEventListener('click', beginGame);

function pauseGame(): void {
  if (!started || gameOver || paused) return;
  paused = true;
  mobileSprint = false;
  keys.clear();
  releaseJoystick();
  releaseSprint();
  $('#pause-screen').classList.add('visible');
  document.exitPointerLock?.();
}
function resumeGame(): void {
  if (!paused) return;
  paused = false;
  $('#pause-screen').classList.remove('visible');
  if (window.matchMedia('(pointer:fine)').matches) renderer.domElement.requestPointerLock();
}
$('#pause-button').addEventListener('click', pauseGame);
$('#resume-button').addEventListener('click', resumeGame);
$('#victory-restart').addEventListener('click', () => {
  $('#victory-screen').classList.remove('visible');
  paused = false;
  gameOver = true;
  beginGame();
});
$('#restart-button').addEventListener('click', () => {
  paused = false;
  gameOver = true;
  $('#pause-screen').classList.remove('visible');
  beginGame();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement && started) {
    // Keyboard movement remains available after the pointer is released.
  }
});
document.addEventListener('mousemove', (event) => {
  if (!started || document.pointerLockElement !== renderer.domElement) return;
  yaw -= event.movementX * 0.0032;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0026, -0.72, 0.45);
});
// Full-screen touch camera: drag anywhere on the playfield, not just the right half.
// Interactive controls retain their own gestures (joystick, fire, reload, pickup, menus).
const cameraGestureExcluded = '#mobile-controls, button, input, select, textarea, a, .start-card, #pause-screen, #game-over-screen, #victory-screen';
document.addEventListener('contextmenu', (event) => {
  if (started && event.target instanceof Element && !event.target.closest(cameraGestureExcluded)) event.preventDefault();
});
document.addEventListener('pointerdown', (event) => {
  if (!started || paused || gameOver || missionDone || event.button !== 0) return;
  const target = event.target;
  if (target instanceof Element && target.closest(cameraGestureExcluded)) return;
  event.preventDefault();
  lookPointer = event.pointerId;
  lastTouchX = event.clientX;
  lastTouchY = event.clientY;
  try { renderer.domElement.setPointerCapture(event.pointerId); } catch { /* embedded browser fallback: document still receives pointer events */ }
}, { capture: true, passive: false });
document.addEventListener('pointermove', (event) => {
  if (lookPointer !== event.pointerId || !started || paused) return;
  if (event.pointerType !== 'mouse') event.preventDefault();
  const dx = event.clientX - lastTouchX;
  const dy = event.clientY - lastTouchY;
  lastTouchX = event.clientX;
  lastTouchY = event.clientY;
  yaw -= dx * (aiming ? 0.0065 : 0.0085);
  pitch = THREE.MathUtils.clamp(pitch - dy * (aiming ? 0.0048 : 0.006), -0.72, 0.42);
}, { passive: false });
const releaseLook = (event: PointerEvent) => {
  if (lookPointer === event.pointerId) lookPointer = null;
};
document.addEventListener('pointerup', releaseLook, true);
document.addEventListener('pointercancel', releaseLook, true);
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'Space') event.preventDefault();
  if (event.code === 'Escape' && started && !paused && !gameOver) pauseGame();
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
function reloadWeapon(): void {
  if (!started || gameOver || paused || reloading || ammo === 12 || reserveAmmo <= 0) return;
  reloading = true;
  $('#reload-button').classList.add('reloading');
  notify('جارٍ تلقيم السلاح…');
  window.setTimeout(() => {
    if (!started || gameOver) { reloading = false; $('#reload-button').classList.remove('reloading'); return; }
    const loaded = Math.min(12 - ammo, reserveAmmo);
    ammo += loaded; reserveAmmo -= loaded; reloading = false;
    $('#reload-button').classList.remove('reloading');
    updateHud(); notify('اكتمل تلقيم السلاح.');
  }, 1050);
}
function interact(): void {
  if (!started || gameOver || suppliesCollected) return;
  if (player.position.distanceTo(supplyCache.position) > 4.4) {
    notify('اقترب أكثر من صندوق الإمدادات حتى يظهر زر الالتقاط.');
    return;
  }
  suppliesCollected = true;
  supplyCache.visible = false;
  reserveAmmo += 12;
  updateHud();
  notify('جمعت الإمدادات. تابع إلى نقطة التجمع.');
}
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && !event.repeat) reloadWeapon();
  if (event.code === 'KeyE' && !event.repeat) interact();
});
$('#reload-button').addEventListener('click', reloadWeapon);
$('#interact-hint').addEventListener('click', interact);
$('#pickup-button').addEventListener('click', interact);
$('#camera-zoom-in').addEventListener('click', () => { cameraDistance = Math.max(4.8, cameraDistance - 0.7); notify('تم تقريب الكاميرا.'); });
$('#camera-zoom-out').addEventListener('click', () => { cameraDistance = Math.min(11, cameraDistance + 0.8); notify('تم إبعاد الكاميرا.'); });
window.addEventListener('blur', () => keys.clear());

function getAimedEnemy(): THREE.Group | undefined {
  // Raycast the visible meshes themselves: no oversized invisible hit boxes.
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  raycaster.near = 0.1;
  raycaster.far = 90;
  let best: THREE.Group | undefined;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    const meshes: THREE.Object3D[] = [];
    enemy.traverse((part) => { if (part instanceof THREE.Mesh) meshes.push(part); });
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (hit && hit.distance < bestDistance) { best = enemy; bestDistance = hit.distance; }
  }
  return best;
}
function shoot(): void {
  if (!started || gameOver || paused || missionDone || reloading || ammo <= 0) {
    if (ammo <= 0) notify('انتهت الذخيرة في هذا النموذج التجريبي.');
    return;
  }
  ammo--;
  if (playerHidden) { crouching = false; playerHidden = false; player.scale.y = 1; $('#hide-button').classList.remove('active'); $('#hide-button').textContent = 'اختباء'; notify('كشف إطلاق النار موقعك؛ غادر الغطاء أو ابحث عن ساتر جديد.'); }
  // Shoot through the screen reticle so camera aim and hit detection agree.
  // The same centered reticle drives aim feedback and hit detection.
  const target = getAimedEnemy();
  const shotEnd = target
    ? target.position.clone().add(new THREE.Vector3(0, 1.1, 0))
    : raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 32);
  const tracerGeometry = new THREE.BufferGeometry().setFromPoints([camera.position.clone(), shotEnd]);
  const tracer = new THREE.Line(tracerGeometry, new THREE.LineBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.9 }));
  scene.add(tracer);
  window.setTimeout(() => { scene.remove(tracer); tracerGeometry.dispose(); (tracer.material as THREE.Material).dispose(); }, 95);
  $('#crosshair').classList.add('firing');
  window.setTimeout(() => $('#crosshair').classList.remove('firing'), 110);
  if (target) {
      target.userData.health = Math.max(0, (target.userData.health as number) - 1);
      if (target.userData.health > 0) {
        target.traverse((part) => {
          if (!(part instanceof THREE.Mesh)) return;
          const materials = Array.isArray(part.material) ? part.material : [part.material];
          for (const material of materials) {
            const tint = material as THREE.MeshStandardMaterial;
            if (tint.color) tint.color.lerp(new THREE.Color(0x9a4438), 0.38);
          }
        });
        $('#crosshair').classList.add('hit');
        window.setTimeout(() => $('#crosshair').classList.remove('hit'), 180);
        notify('أصبت الهدف! أطلق مرة أخرى لإكمال تحييده.');
      } else {
        scene.remove(target);
        const index = enemies.indexOf(target);
        if (index >= 0) enemies.splice(index, 1);
        const removedMeshes: THREE.Object3D[] = [];
        target.traverse((part) => { if (part instanceof THREE.Mesh) removedMeshes.push(part); });
        for (const part of removedMeshes) {
          const meshIndex = enemyMeshes.indexOf(part);
          if (meshIndex >= 0) enemyMeshes.splice(meshIndex, 1);
        }
        $('#crosshair').classList.add('hit');
        window.setTimeout(() => $('#crosshair').classList.remove('hit'), 220);
        notify('تم تحييد الخصم.');
      }
  }
  updateHud();
}
document.addEventListener('mousedown', (event) => { if (event.button === 0 && window.matchMedia('(pointer:fine)').matches) shoot(); });
const fireButton = $('#fire-button');
const stopFiring = () => {
  if (fireHoldTimer !== null) { window.clearInterval(fireHoldTimer); fireHoldTimer = null; }
  fireButton.classList.remove('active');
};
fireButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (!started || paused || gameOver) return;
  stopFiring();
  fireButton.setPointerCapture(event.pointerId);
  fireButton.classList.add('active');
  shoot();
  fireHoldTimer = window.setInterval(() => shoot(), 165);
});
fireButton.addEventListener('pointerup', stopFiring);
fireButton.addEventListener('pointercancel', stopFiring);
fireButton.addEventListener('lostpointercapture', stopFiring);
window.addEventListener('blur', stopFiring);
function toggleHide(): void {
  if (!started || paused || gameOver) return;
  if (!crouching) {
    if (!isPlayerInCover()) { notify('اقترب من الشجيرات أو التحصينات أولاً حتى تختبئ.'); return; }
    crouching = true; playerHidden = true; player.scale.y = 0.72;
    $('#hide-button').classList.add('active'); $('#hide-button').textContent = 'خروج';
    notify('أنت مختبئ داخل الغطاء؛ الدوريات لن ترصدك ما دمت في منطقة التمويه.');
  } else {
    crouching = false; playerHidden = false; player.scale.y = 1;
    $('#hide-button').classList.remove('active'); $('#hide-button').textContent = 'اختباء';
    notify('خرجت من وضع الاختباء.');
  }
}
$('#hide-button').addEventListener('click', toggleHide);
document.addEventListener('keydown', (event) => { if (event.code === 'KeyC' && !event.repeat) toggleHide(); });
$('#aim-button').addEventListener('click', () => {
  if (!started || paused || gameOver) return;
  aiming = !aiming;
  $('#aim-button').classList.toggle('active', aiming);
  $('#crosshair').classList.toggle('aiming', aiming);
  notify(aiming ? 'وضع التصويب الدقيق: الكاميرا أقرب والحركة أبطأ.' : 'تم إلغاء وضع التصويب.');
});
$('#jump-button').addEventListener('click', () => { if (started && !gameOver && onGround) { verticalVelocity = 6.2; onGround = false; } });
const sprintButton = $('#sprint-button');
sprintButton.addEventListener('pointerdown', (event) => { event.preventDefault(); mobileSprint = true; sprintButton.classList.add('active'); });
const releaseSprint = () => { mobileSprint = false; sprintButton.classList.remove('active'); };
sprintButton.addEventListener('pointerup', releaseSprint);
sprintButton.addEventListener('pointercancel', releaseSprint);
sprintButton.addEventListener('lostpointercapture', releaseSprint);

const joystick = $('#joystick');
const stick = $('#stick');
let touchX = 0;
let touchY = 0;
let joystickPointer: number | null = null;
function updateJoystick(event: PointerEvent): void {
  const rect = joystick.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const max = Math.min(rect.width, rect.height) * 0.31;
  const length = Math.max(1, Math.hypot(dx, dy));
  const scale = Math.min(max / length, 1);
  touchX = (dx * scale) / max;
  touchY = (dy * scale) / max;
  stick.style.transform = `translate(${touchX * max}px,${touchY * max}px)`;
}
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault(); joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId); updateJoystick(event);
});
joystick.addEventListener('pointermove', (event) => {
  if (joystickPointer !== event.pointerId) return;
  updateJoystick(event);
});
const releaseJoystick = () => { joystickPointer = null; touchX = 0; touchY = 0; stick.style.transform = 'translate(0,0)'; };
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

const radarCanvas = $('#radar') as HTMLCanvasElement;
const radarContext = radarCanvas.getContext('2d');
if (!radarContext) throw new Error('Radar canvas is unavailable');
function drawRadar(): void {
  const ctx = radarContext!;
  const w = radarCanvas.width, h = radarCanvas.height;
  const cx = w / 2, cy = h / 2, range = 38, scale = (w * 0.43) / range;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#17251d'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#b7a47755'; ctx.lineWidth = 1;
  for (const radius of [0.33, 0.66, 1]) {
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.43 * radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  const plot = (x: number, z: number, color: string, radius: number) => {
    const px = cx + (x - player.position.x) * scale;
    const py = cy + (z - player.position.z) * scale;
    if (px < 3 || px > w - 3 || py < 3 || py > h - 3) return;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
  };
  if (!suppliesCollected) plot(supplyCache.position.x, supplyCache.position.z, '#e9c36f', 4);
  plot(marker.position.x, marker.position.z, '#8bc18c', 5);
  enemies.forEach((enemy) => plot(enemy.position.x, enemy.position.z, '#e58b77', 3.5));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-yaw);
  ctx.fillStyle = '#f2e6c9'; ctx.strokeStyle = '#17251d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function animate(): void {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  for (const mixer of characterMixers) mixer.update(delta);
  damageCooldown = Math.max(0, damageCooldown - delta);
  radarElapsed += delta;
  if (radarElapsed >= 0.12) { drawRadar(); radarElapsed = 0; }
  marker.position.y = Math.sin(time * 2) * 0.12;
  ring.rotation.z += delta * 0.65;
  const flagPositions = flagGeometry.attributes.position;
  for(let i=0;i<flagPositions.count;i++){
    const x=flagRestPositions[i*3], y=flagRestPositions[i*3+1];
    flagPositions.setZ(i,flagRestPositions[i*3+2] + Math.sin(time*2.1 + x*1.35 + y*0.18) * 0.22 * (x/5.4));
  }
  flagPositions.needsUpdate=true; flagGeometry.computeVertexNormals();

  if (started && !gameOver && !paused) {
    const inputX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + touchX;
    const inputZ = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) - touchY;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    direction.set(0, 0, 0).addScaledVector(right, inputX).addScaledVector(forward, inputZ);
    if (direction.lengthSq() > 0.01) {
      direction.normalize();
      const sprinting = (keys.has('ShiftLeft') || keys.has('ShiftRight') || mobileSprint) && stamina > 1;
      const speed = crouching ? 2.35 : sprinting ? 8.2 : 5.2;
      stamina = THREE.MathUtils.clamp(stamina + (sprinting ? -30 : 19) * delta, 0, 100);
      player.position.addScaledVector(direction, speed * delta);
      setCharacterAnimation(player, sprinting ? 'Run' : 'Walk');
      const stride = Math.sin(time * (sprinting ? 13 : 8)) * (sprinting ? 0.62 : 0.38);
      player.traverse((part) => {
        if (!(part instanceof THREE.Mesh)) return;
        const role = part.userData.motionRole as string | undefined;
        if (role === 'leftLeg' || role === 'rightArm') part.rotation.x = stride;
        if (role === 'rightLeg' || role === 'leftArm') part.rotation.x = -stride;
      });
      player.rotation.y = Math.atan2(-direction.x, -direction.z);
    }
    if (direction.lengthSq() <= 0.01) {
      setCharacterAnimation(player, 'Idle');
      stamina = THREE.MathUtils.clamp(stamina + 24 * delta, 0, 100);
      player.traverse((part) => { if (part instanceof THREE.Mesh && part.userData.motionRole) part.rotation.x *= Math.max(0, 1 - delta * 8); });
    }
    $('#stamina-value').textContent = `${Math.round(stamina)}%`;
    $('#stamina-meter').style.width = `${stamina}%`;
    if (keys.has('Space') && onGround) { verticalVelocity = 6.2; onGround = false; }
    verticalVelocity -= 17 * delta;
    player.position.y += verticalVelocity * delta;
    if (player.position.y <= 0) { player.position.y = 0; verticalVelocity = 0; onGround = true; }
    player.position.x = THREE.MathUtils.clamp(player.position.x, -195, 195);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -195, 175);
    if (crouching && !isPlayerInCover()) { crouching = false; playerHidden = false; player.scale.y = 1; $('#hide-button').classList.remove('active'); $('#hide-button').textContent = 'اختباء'; notify('خرجت من منطقة الغطاء؛ لم تعد مختبئاً.'); }
    else playerHidden = crouching && isPlayerInCover();

    const distanceToGoal = player.position.distanceTo(marker.position);
    if (!missionDone && distanceToGoal < 3.2) {
      if (!suppliesCollected && !goalNeedsSuppliesNotified) {
        goalNeedsSuppliesNotified = true;
        notify('المهمة الأولى: اجمع صندوق الإمدادات قبل التقدم.');
      } else if (suppliesCollected && enemies.length > 0 && !goalNeedsEnemiesNotified) {
        goalNeedsEnemiesNotified = true;
        notify(`لا تزال هناك ${enemies.length} تهديدات. أمّن الطريق أولاً.`);
      } else if (suppliesCollected && enemies.length === 0) {
        missionDone = true;
        paused = true;
        keys.clear();
        releaseJoystick();
        releaseSprint();
        $('#victory-screen').classList.add('visible');
        updateHud();
        notify('اكتملت المهمة: الإمدادات جُمعت والطريق أُمّن ووصلت إلى التجمع.');
      }
    }
    const cacheDistance = player.position.distanceTo(supplyCache.position);
    const nearCache = !suppliesCollected && cacheDistance < 5.2;
    $('#interact-hint').classList.toggle('visible', nearCache);
    const pickupButton = $('#pickup-button') as HTMLButtonElement;
    pickupButton.classList.toggle('visible', nearCache);
    pickupButton.disabled = !nearCache;
    pickupButton.textContent = cacheDistance < 4.4 ? 'التقط صندوق الإمدادات' : `اقترب من الصندوق · ${Math.ceil(cacheDistance)}م`;
    enemies.forEach((enemy, index) => {
      if (enemy.parent === null) return;
      const distance = enemy.position.distanceTo(player.position);
      if (!playerHidden && distance < 22 && distance > 3.0) {
        const toward = player.position.clone().sub(enemy.position).setY(0).normalize();
        enemy.position.addScaledVector(toward, delta * 0.82);
        setCharacterAnimation(enemy, 'Walk');
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
      } else if (distance >= 22) {
        const phase = time * 0.42 + (enemy.userData.patrolPhase as number);
        const patrolX = (enemy.userData.patrolX as number) + Math.sin(phase) * 2.2;
        const patrolZ = (enemy.userData.patrolZ as number) + Math.cos(phase * 0.7) * 1.5;
        enemy.position.x = THREE.MathUtils.damp(enemy.position.x, patrolX, 1.5, delta);
        enemy.position.z = THREE.MathUtils.damp(enemy.position.z, patrolZ, 1.5, delta);
        enemy.rotation.y = Math.atan2(-(enemy.position.x - (enemy.userData.patrolX as number)), -(enemy.position.z - (enemy.userData.patrolZ as number)));
        setCharacterAnimation(enemy, 'Walk');
      }
      enemy.userData.fireCooldown = Math.max(0, (enemy.userData.fireCooldown as number) - delta);
      if (!playerHidden && distance >= 7 && distance < 25 && enemy.userData.fireCooldown <= 0) {
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        const from = enemy.position.clone().add(new THREE.Vector3(0, 1.35, 0));
        const to = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([from, to]);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color:0xd8a76c,transparent:true,opacity:0.7}));
        scene.add(line);
        window.setTimeout(() => { scene.remove(line); lineGeometry.dispose(); (line.material as THREE.Material).dispose(); }, 120);
        enemy.userData.fireCooldown = 2.8 + Math.random() * 1.1;
        if (damageCooldown <= 0 && Math.random() > 0.35) {
          health = Math.max(0, health - 5);
          damageCooldown = 0.7;
          $('#damage-flash').classList.add('active');
          window.setTimeout(() => $('#damage-flash').classList.remove('active'), 130);
          updateHud();
        }
      }
      if (!playerHidden && distance < 3.2 && damageCooldown <= 0) {
        health = Math.max(0, health - 8);
        damageCooldown = 0.9;
        $('#damage-flash').classList.add('active');
        window.setTimeout(() => $('#damage-flash').classList.remove('active'), 180);
        updateHud();
        if (health === 0) {
          gameOver = true; started = false;
          $('#start-button').textContent = 'إعادة المحاولة';
          document.body.classList.remove('game-started');
          startScreen.style.display = 'grid';
          notify('انتهت المحاولة. يمكنك البدء من جديد.');
        }
      }
      enemy.position.y = 0;
      enemy.rotation.y += Math.sin(time + index) * delta * 0.03;
    });

    // Shoulder camera framing keeps the soldier left of the screen reticle.
    const desiredDistance = aiming ? 4.6 : cameraDistance;
    camera.fov = THREE.MathUtils.lerp(camera.fov, aiming ? 58 : 76, 1 - Math.exp(-delta * 9));
    camera.updateProjectionMatrix();
    const shoulder = aiming ? 1.12 : 0.82;
    const cameraOffset = new THREE.Vector3(
      Math.sin(yaw) * desiredDistance + Math.cos(yaw) * shoulder,
      (aiming ? 2.35 : 3.25) + pitch * (aiming ? 1.15 : 1.8),
      Math.cos(yaw) * desiredDistance - Math.sin(yaw) * shoulder
    );
    const cameraTarget = player.position.clone().add(new THREE.Vector3(0, crouching ? 0.92 : aiming ? 1.52 : 1.38, 0));
    const aimForward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const lookTarget = cameraTarget.clone().addScaledVector(aimForward, aiming ? 16 : 8);
    camera.position.lerp(cameraTarget.clone().add(cameraOffset), 1 - Math.pow(0.00008, delta));
    camera.lookAt(lookTarget);
    const aimed = getAimedEnemy();
    $('#crosshair').classList.toggle('targeting', Boolean(aimed));
  } else if (!started) {
    camera.position.set(Math.sin(time * 0.08) * 34, 19, 35);
    camera.lookAt(0, 1, -10);
  }
  renderer.render(scene, camera);
}
animate();

function syncViewport(): void {
  const portrait = isPortraitTouch();
  document.body.classList.toggle('portrait-landscape-sim', portrait);
  camera.aspect = viewWidth() / viewHeight();
  camera.updateProjectionMatrix();
  renderer.setSize(viewWidth(), viewHeight());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
}
window.addEventListener('resize', syncViewport);
window.addEventListener('orientationchange', () => window.setTimeout(syncViewport, 120));
window.visualViewport?.addEventListener('resize', syncViewport);
syncViewport();
updateHud();
