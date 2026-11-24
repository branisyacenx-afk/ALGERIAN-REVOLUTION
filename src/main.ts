import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#game-root');
if (!root) throw new Error('Game root not found');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba99a);
scene.fog = new THREE.Fog(0x9ba99a, 520, 1900);
// Some Android in-app browsers report pointer/orientation media features unreliably.
const isPortraitTouch = () => window.innerHeight > window.innerWidth && window.innerWidth < 1100;
// Apply the simulated landscape layout immediately, before the start screen is shown.
document.body.classList.toggle('portrait-landscape-sim', isPortraitTouch());
const viewWidth = () => isPortraitTouch() ? window.innerHeight : window.innerWidth;
const viewHeight = () => isPortraitTouch() ? window.innerWidth : window.innerHeight;
const camera = new THREE.PerspectiveCamera(76, viewWidth() / viewHeight(), 0.1, 2200);
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

const terrain = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800, 128, 128), new THREE.MeshStandardMaterial({ color: 0x777b5d, roughness: 1 }));
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

// Vast playable backdrop: distant mountain chains and instanced forest silhouettes.
// Instancing keeps the expanded 1.8 km landscape lightweight on mobile GPUs.
const farRidgeMat = new THREE.MeshStandardMaterial({ color: 0x626c60, roughness: 1, flatShading: true });
const farRidgeMat2 = new THREE.MeshStandardMaterial({ color: 0x73796a, roughness: 1, flatShading: true });
for (let i = 0; i < 54; i++) {
  const angle = (i / 54) * Math.PI * 2;
  const radius = 560 + (i % 5) * 72;
  const height = 110 + (i % 7) * 24;
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 6), i % 3 ? farRidgeMat : farRidgeMat2);
  mountain.position.set(Math.cos(angle) * radius, height * 0.34 - 12, Math.sin(angle) * radius - 24);
  mountain.scale.set(150 + (i % 4) * 36, height, 120 + (i % 3) * 42);
  mountain.rotation.y = angle * 0.3;
  mountain.receiveShadow = true;
  scene.add(mountain);
}
const farTreeGeometry = new THREE.ConeGeometry(1.25, 4.8, 6);
const farTreeTrunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, 1.55, 5);
const farTreeMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x354a37, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x43543d, roughness: 1, flatShading: true }),
  new THREE.MeshStandardMaterial({ color: 0x536047, roughness: 1, flatShading: true })
];
const farTrees = new THREE.InstancedMesh(farTreeGeometry, farTreeMaterials[0], 520);
const farTrunks = new THREE.InstancedMesh(farTreeTrunkGeometry, new THREE.MeshStandardMaterial({ color: 0x51432f, roughness: 1 }), 520);
const treeDummy = new THREE.Object3D();
for (let i = 0; i < 520; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 100 + Math.random() * 620;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius - 40;
  const h = 0.7 + Math.random() * 1.35;
  treeDummy.position.set(x, 2.35 * h, z);
  treeDummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
  treeDummy.scale.set(h, h, h);
  treeDummy.updateMatrix();
  farTrees.setMatrixAt(i, treeDummy.matrix);
  treeDummy.position.set(x, 0.77 * h, z);
  treeDummy.scale.set(h, h, h);
  treeDummy.updateMatrix();
  farTrunks.setMatrixAt(i, treeDummy.matrix);
}
farTrees.instanceMatrix.needsUpdate = true;
farTrunks.instanceMatrix.needsUpdate = true;
scene.add(farTrees, farTrunks);

// Detailed tracked armored vehicles: hull, independent track assemblies, road wheels,
// turret ring, rotating turret, long cannon, hatches, optics and front lamps.
type TankRig = { group: THREE.Group; turret: THREE.Group; wheels: THREE.Mesh[]; phase: number };
const tanks: TankRig[] = [];
function addArmoredTank(x: number, z: number, rotation: number, paint: number, phase: number): void {
  const tank = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.82, metalness: 0.22 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x252a27, roughness: 0.95, metalness: 0.12 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x697064, roughness: 0.72, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x172b2d, roughness: 0.25, metalness: 0.45 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.9, 1.15, 7.1), hullMat);
  hull.position.y = 1.45; hull.castShadow = true; hull.receiveShadow = true; tank.add(hull);
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.58, 2.25), hullMat);
  glacis.position.set(0, 1.83, -2.25); glacis.rotation.x = -0.18; glacis.castShadow = true; tank.add(glacis);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.2, 3.6), edgeMat);
  deck.position.set(0, 2.08, 0.55); deck.castShadow = true; tank.add(deck);
  const wheels: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.35, 7.45), darkMetal);
    track.position.set(side * 2.45, 1.03, 0.02); track.castShadow = true; tank.add(track);
    for (let j = 0; j < 6; j++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.34, 16), edgeMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 2.73, 0.92, -2.72 + j * 1.08);
      wheel.castShadow = true; tank.add(wheel); wheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.37, 12), darkMetal);
      hub.rotation.z = Math.PI / 2; hub.position.copy(wheel.position); tank.add(hub);
    }
    const upperTrack = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 6.9), edgeMat);
    upperTrack.position.set(side * 2.48, 1.72, 0.02); tank.add(upperTrack);
    for (let j = 0; j < 4; j++) {
      const returnRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 10), darkMetal);
      returnRoller.rotation.z = Math.PI / 2;
      returnRoller.position.set(side * 2.75, 1.72, -2.35 + j * 1.55); tank.add(returnRoller);
    }
  }
  const turret = new THREE.Group();
  turret.position.set(0, 2.2, 0.25);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.7, 0.28, 24), darkMetal);
  ring.position.y = 0.05; ring.castShadow = true; turret.add(ring);
  const turretBody = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.25, 3.05), hullMat);
  turretBody.position.set(0, 0.72, 0.05); turretBody.castShadow = true; turretBody.receiveShadow = true; turret.add(turretBody);
  const turretRoof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.16, 2.5), edgeMat);
  turretRoof.position.set(0, 1.42, 0.05); turret.add(turretRoof);
  const mantlet = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), darkMetal);
  mantlet.position.set(0, 0.83, -1.43); mantlet.scale.set(1.2, 0.85, 0.7); turret.add(mantlet);
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 4.9, 12), darkMetal);
  cannon.rotation.x = Math.PI / 2; cannon.position.set(0, 0.85, -3.8); cannon.castShadow = true; turret.add(cannon);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.38, 12), edgeMat);
  muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0.85, -6.25); turret.add(muzzle);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.13, 16), darkMetal);
  hatch.position.set(0.75, 1.55, 0.55); turret.add(hatch);
  const optics = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.35), glassMat);
  optics.position.set(-0.72, 1.5, -0.5); turret.add(optics);
  turret.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  tank.add(turret);
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xe5d7a1, emissive: 0x5b4d22 }));
    lamp.rotation.z = Math.PI / 2; lamp.position.set(side * 1.75, 1.72, -3.58); tank.add(lamp);
    const sideStowage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 1.1), hullMat);
    sideStowage.position.set(side * 2.12, 2.0, 2.2); tank.add(sideStowage);
  }
  tank.position.set(x, 0, z); tank.rotation.y = rotation;
  tank.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(tank);
  tanks.push({ group: tank, turret, wheels, phase });
}
addArmoredTank(31, -74, -0.38, 0x59614a, 0.3);
addArmoredTank(-43, -105, 0.52, 0x6a6a55, 2.1);
addArmoredTank(92, -245, -0.12, 0x565e4b, 1.4);


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
const allies: THREE.Group[] = [];
function addAlgerianBackInsignia(actor: THREE.Group): void {
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.22), new THREE.MeshStandardMaterial({map:flagTexture,side:THREE.DoubleSide,roughness:0.9}));
  patch.position.set(0,1.38,0.405); patch.castShadow=true; patch.userData.keepVisibleOnCharacter=true;
  actor.add(patch);
}
for (let i=0;i<3;i++) {
  const ally=makePerson(0x354c3b,0.94);
  addAlgerianBackInsignia(ally);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.58,0.4),new THREE.MeshStandardMaterial({color:0x4b5a3c,roughness:0.95}));
  vest.position.set(0,1.24,-0.01); vest.castShadow=true; vest.userData.keepVisibleOnCharacter=true; ally.add(vest);
  scene.add(ally); allies.push(ally);
}

// Distinct uniform equipment overlays. These remain visible over either the procedural
// character or the animated rigged soldier model.
const uniformLayer = new THREE.Group();
const algerianKit = new THREE.Group();
const frenchKit = new THREE.Group();
function kitMesh(geometry:THREE.BufferGeometry,color:number,position:THREE.Vector3,parent:THREE.Group,scale?:THREE.Vector3):THREE.Mesh {
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:0.94,metalness:0.02}));
  mesh.position.copy(position); if(scale) mesh.scale.copy(scale); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function kitStrap(a:THREE.Vector3,b:THREE.Vector3,radius:number,color:number,parent:THREE.Group):void {
  const delta=b.clone().sub(a);
  const mesh=kitMesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),color,a.clone().add(b).multiplyScalar(0.5),parent);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
}
const olive=0x536347, sand=0xc1a879, darkLeather=0x302d25, blueGrey=0x46586b, webbing=0x303a43;
kitMesh(new THREE.BoxGeometry(0.69,0.63,0.42),olive,new THREE.Vector3(0,1.23,-0.015),algerianKit);
kitStrap(new THREE.Vector3(-0.31,1.53,-0.24),new THREE.Vector3(0.28,0.93,-0.24),0.045,sand,algerianKit);
kitStrap(new THREE.Vector3(0.31,1.53,-0.24),new THREE.Vector3(-0.28,0.93,-0.24),0.045,sand,algerianKit);
for(const x of [-0.22,0,0.22]) {
  kitMesh(new THREE.BoxGeometry(0.17,0.2,0.12),0x756344,new THREE.Vector3(x,1.12,-0.27),algerianKit);
  kitMesh(new THREE.BoxGeometry(0.16,0.08,0.13),0x9b8354,new THREE.Vector3(x,1.25,-0.28),algerianKit);
}
kitMesh(new THREE.CylinderGeometry(0.12,0.14,0.28,10),0x5d6042,new THREE.Vector3(0.43,0.92,0.12),algerianKit);
kitMesh(new THREE.TorusGeometry(0.24,0.075,8,18),sand,new THREE.Vector3(0,1.73,0),algerianKit).rotation.x=Math.PI/2;
kitMesh(new THREE.SphereGeometry(0.25,12,8),0xb9a77e,new THREE.Vector3(0,1.96,0),algerianKit,new THREE.Vector3(1.12,0.52,1.1));
kitMesh(new THREE.BoxGeometry(0.48,0.08,0.1),darkLeather,new THREE.Vector3(0,0.88,-0.23),algerianKit);

kitMesh(new THREE.BoxGeometry(0.68,0.62,0.42),blueGrey,new THREE.Vector3(0,1.23,-0.02),frenchKit);
kitStrap(new THREE.Vector3(-0.31,1.54,-0.25),new THREE.Vector3(0.28,0.9,-0.25),0.052,webbing,frenchKit);
kitStrap(new THREE.Vector3(0.31,1.54,-0.25),new THREE.Vector3(-0.28,0.9,-0.25),0.052,webbing,frenchKit);
for(const x of [-0.23,0.23]) {
  kitMesh(new THREE.BoxGeometry(0.18,0.23,0.14),0x34404b,new THREE.Vector3(x,1.12,-0.28),frenchKit);
  kitMesh(new THREE.BoxGeometry(0.19,0.07,0.15),0x69717a,new THREE.Vector3(x,1.25,-0.29),frenchKit);
}
kitMesh(new THREE.CylinderGeometry(0.23,0.24,0.16,12),0x344252,new THREE.Vector3(0,2.02,0),frenchKit);
kitMesh(new THREE.BoxGeometry(0.34,0.045,0.25),0x202a34,new THREE.Vector3(0,1.98,-0.08),frenchKit);
kitMesh(new THREE.BoxGeometry(0.08,0.16,0.08),0xc0a15e,new THREE.Vector3(0,1.83,-0.24),frenchKit);
// A visible Algerian flag patch is fixed to the upper back of the field pack.
const backFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.22), new THREE.MeshStandardMaterial({map:flagTexture,side:THREE.DoubleSide,roughness:0.9}));
backFlag.position.set(0,1.38,0.405); backFlag.castShadow=true; algerianKit.add(backFlag);
uniformLayer.userData.keepVisibleOnCharacter = true;
uniformLayer.add(algerianKit,frenchKit); player.add(uniformLayer);
algerianKit.visible=true; frenchKit.visible=false;

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
  algerianKit.visible = kind === 'algerian';
  frenchKit.visible = kind === 'french';
  if (player.userData.characterModel) tintCharacter(player, kind === 'algerian' ? 0x9aa184 : 0x7f8a9c);
  $('#outfit-algerian').classList.toggle('selected',kind === 'algerian');
  $('#outfit-french').classList.toggle('selected',kind === 'french');
  notify(kind === 'algerian' ? 'Équipement algérien sélectionné.' : 'Équipement français sélectionné.');
}
const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x292b28, metalness: 0.45, roughness: 0.65 }));
weapon.position.set(0.38, 1.18, -0.48);
weapon.userData.keepOnCharacter = true;
player.add(weapon);

const enemies: THREE.Group[] = [];
for (let i = 0; i < 6; i++) {
  const enemy = makePerson(0x55594e, 0.95);
  enemy.position.set(base.x + (i - (count - 1) / 2) * 4.4, 0, base.z - 15 - (i % 3) * 5);
  enemy.userData.health = 2;
  enemy.userData.fireCooldown = 1.0 + i * 0.18;
    enemy.userData.role = i % 6 === 0 ? 'sniper' : 'rifle';
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
  // Keep the imported rig's native facing aligned with the procedural soldier (-Z).
  // A 180-degree extra rotation made the uniformed soldier move with his back forward.
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
    allies.forEach((ally) => attachSoldierModel(ally, 0x687957));
    battleAllies.forEach((ally) => attachSoldierModel(ally, 0x687957));
    const factionTints = [0x858b7b, 0x777f70, 0x9a927c, 0x6f796d, 0x8d8877, 0x727a80];
    for (const [index, enemy] of enemies.entries()) {
      attachSoldierModel(enemy, factionTints[index % factionTints.length]);
      enemy.scale.setScalar(0.91 + (index % 3) * 0.045);
    }
    enemyMeshes.length = 0;
    enemies.forEach((enemy) => enemy.traverse((part) => {
      if (part instanceof THREE.Mesh) enemyMeshes.push(part);
    }));
    notify('Modèles 3D et animations des soldats chargés.');
  } catch (error) {
    console.warn('Soldier model could not be loaded; keeping the offline fallback.', error);
    notify('Impossible de charger le modèle 3D du soldat. Vérifiez votre connexion Internet.');
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
let campaignStage = Math.max(1, Math.min(100, Number(localStorage.getItem('algerian-revolution-stage') || 1)));
const campaignSectors = [
  { name:'جبال الأوراس', x:0, z:-25 },
  { name:'ممرات القبائل', x:170, z:-120 },
  { name:'غابات جرجرة', x:350, z:-300 },
  { name:'سهول الحضنة', x:500, z:80 },
  { name:'مرتفعات الونشريس', x:260, z:360 },
  { name:'جبال الظهرة', x:-120, z:470 },
  { name:'غابات الزيبان', x:-410, z:280 },
  { name:'ممرات الونشريس الغربية', x:-560, z:-80 },
  { name:'جبال النمامشة', x:-350, z:-420 },
  { name:'الحدود الشمالية', x:100, z:-600 }
];
const campaignChapters = [
  {year:'1954–1955', title:'شرارة نوفمبر · الأوراس', terrain:0x777b5d, sky:0x9ba99a, fog:0x9ba99a, kind:'mountain', description:'بداية الثورة في جبال الأوراس وممراتها الوعرة.'},
  {year:'1955', title:'الشمال القسنطيني', terrain:0x777b5d, sky:0xa6b4ad, fog:0xa6b4ad, kind:'village', description:'قرى وطرق ريفية في الشرق الجزائري.'},
  {year:'1956', title:'مؤتمر الصومام · القبائل', terrain:0x52634b, sky:0xa2b2a4, fog:0xa2b2a4, kind:'forest', description:'غابات القبائل ومسالك الجبال ومراكز الاتصال.'},
  {year:'1956–1957', title:'معركة الجزائر', terrain:0x77736a, sky:0xb4b3ad, fog:0xb4b3ad, kind:'city', description:'أزقة القصبة والأحياء الحضرية وشبكات المقاومة.'},
  {year:'1957–1958', title:'الغرب والظهرة', terrain:0x8b8068, sky:0xb8b39e, fog:0xb8b39e, kind:'ridge', description:'مرتفعات الظهرة والطرق الريفية الغربية.'},
  {year:'1958–1959', title:'الجنوب والواحات', terrain:0x9a865e, sky:0xc9b58d, fog:0xc9b58d, kind:'desert', description:'مسالك صحراوية وواحات ونقاط إمداد بعيدة.'},
  {year:'1959–1960', title:'خطوط الحدود', terrain:0x77786d, sky:0xaeb7b4, fog:0xaeb7b4, kind:'border', description:'مناطق حدودية وأسلاك ومراكز مراقبة.'},
  {year:'1960', title:'اتساع الانتفاضة', terrain:0x777b68, sky:0xb6b7a6, fog:0xb6b7a6, kind:'plateau', description:'هضاب وبلدات تتسع فيها حركة التحرير.'},
  {year:'1961', title:'عام المفاوضات والمقاومة', terrain:0x77736a, sky:0xb5b8b1, fog:0xb5b8b1, kind:'coast', description:'مدن ساحلية وطرق استراتيجية في مرحلة حاسمة.'},
  {year:'1962', title:'وقف إطلاق النار والاستقلال', terrain:0x66775f, sky:0xb8c8ba, fog:0xb8c8ba, kind:'liberation', description:'المراحل الأخيرة وصولاً إلى استقلال الجزائر.'}
];
const campaignOperations = [
 ['تأمين ممر جبلي','حماية قرية الأوراس','استعادة مخبأ الإمداد','إنقاذ مجموعة محاصرة','تأمين طريق الاتصال','حماية قافلة التموين','السيطرة على المرتفع','إخلاء نقطة طبية','تأمين مخيم الجبل','فتح ممر آمن'],
 ['تأمين مدخل القرية','حماية السكان','استعادة مركز اتصال','تأمين الطريق الريفي','إجلاء المدنيين','حراسة نقطة الإمداد','تعطيل دورية معادية','تأمين المعبر','حماية اجتماع سري','فتح طريق للانسحاب'],
 ['حماية مسلك الغابة','تأمين بيت الاتصال','نقل وثائق المؤتمر','حراسة الممر الجبلي','إنقاذ رسول الثورة','تأمين مخزن المؤن','حماية موقع القيادة','استعادة طريق الغابة','تأمين نقطة مراقبة','حماية طريق الانسحاب'],
 ['عبور أزقة القصبة','حماية شبكة الاتصال','إجلاء عائلة','تأمين سطح مراقبة','استعادة وثائق سرية','حماية ملجأ سري','تأمين ممر ضيق','إخراج مجموعة محاصرة','حماية نقطة إسعاف','تأمين الحي'],
 ['تأمين قرية جبلية','حماية قافلة ريفية','استعادة مركز تموين','تأمين طريق الظهرة','إجلاء الجرحى','حماية نقطة اتصال','فتح طريق جبلي','تأمين معبر الوادي','حماية المخيم','السيطرة على المرتفع'],
 ['حماية بئر الواحة','تأمين قافلة الجنوب','استعادة مخزن الوقود','حراسة ممر صحراوي','إنقاذ دورية تائهة','تأمين نقطة ماء','حماية طريق القوافل','استعادة محطة اتصال','تأمين الواحة','فتح طريق الإمداد'],
 ['رصد خط الحدود','تأمين معبر جبلي','حماية شبكة الإمداد','استعادة نقطة مراقبة','إجلاء مجموعة','تأمين طريق ليلي','حماية مركز اتصال','فتح ممر حدودي','تأمين القافلة','الانسحاب المنظم'],
 ['حماية تجمع شعبي','تأمين الهضبة','استعادة مركز تموين','حماية طريق البلدة','إجلاء المدنيين','تأمين نقطة طبية','حراسة الممر','حماية شبكة الاتصال','تأمين القافلة','فتح الطريق'],
 ['تأمين الطريق الساحلي','حماية الميناء','استعادة مركز اتصال','إجلاء مجموعة','تأمين الحي القديم','حماية قافلة الإمداد','تأمين محطة النقل','حراسة الممر الساحلي','حماية اجتماع','فتح طريق آمن'],
 ['حماية وقف إطلاق النار','تأمين طريق العودة','حماية المدنيين','تأمين مركز المدينة','استعادة آخر نقطة اتصال','حراسة قافلة العودة','فتح الطريق للمدنيين','رفع العلم في البلدة','تأمين الساحة','إعلان الاستقلال']
];
const campaignStageTitle = (stage:number) => campaignOperations[Math.floor((stage-1)/10)][(stage-1)%10];
const campaignChapter = (stage:number) => campaignChapters[Math.floor((stage-1)/10)];
function buildChapterLandmark(index:number, sector:{x:number;z:number}):void {
  const g=new THREE.Group(); const chapter=campaignChapters[index];
  const stone=new THREE.MeshStandardMaterial({color:index===3||index===8?0x8a8275:0x776e5a,roughness:1});
  const wood=new THREE.MeshStandardMaterial({color:0x59452f,roughness:1});
  if(chapter.kind==='desert'){
    for(let i=0;i<7;i++){const dune=new THREE.Mesh(new THREE.SphereGeometry(12+i%3*3,12,8),new THREE.MeshStandardMaterial({color:i%2?0xb79b68:0xc2a875,roughness:1}));dune.position.set(-38+i*13,-8,-58-(i%2)*14);dune.scale.set(1,.22,1.4);g.add(dune);}
    for(let i=0;i<5;i++){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.38,5,7),wood);trunk.position.set(24+i*3,2,-42-i%2*7);g.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(2.4,4,7),new THREE.MeshStandardMaterial({color:0x596b3d}));crown.position.set(24+i*3,6,-42-i%2*7);g.add(crown);}
  } else if(chapter.kind==='city'||chapter.kind==='coast'||chapter.kind==='village'){
    const count=chapter.kind==='city'?12:7;
    for(let i=0;i<count;i++){const w=4+(i%3)*2,h=4+(i%4)*1.5;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,4+(i%2)*2),stone);b.position.set(-38+(i%4)*13,h/2,-65-Math.floor(i/4)*12);b.castShadow=true;g.add(b);const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.22,4.3),wood);roof.position.set(b.position.x,h+.1,b.position.z);g.add(roof);const door=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.12),new THREE.MeshStandardMaterial({color:0x493a2c}));door.position.set(b.position.x,h/2-.9,b.position.z+2.08);g.add(door);}
  } else if(chapter.kind==='border'){
    for(let row=0;row<3;row++){for(let i=0;i<14;i++){const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,2.3,5),wood);post.position.set(-38+i*5,1.15,-62+row*2.2);g.add(post);}const wire=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,68,5),new THREE.MeshStandardMaterial({color:0x8b8b82,metalness:.65}));wire.rotation.z=Math.PI/2;wire.position.set(-5,1.35+row*.35,-62+row*2.2);g.add(wire);}
  } else if(chapter.kind==='forest'){
    for(let i=0;i<18;i++){const x=-42+(i%6)*15,z=-66-Math.floor(i/6)*12;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,5,7),wood);trunk.position.set(x,2.5,z);g.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(3,8,7),new THREE.MeshStandardMaterial({color:0x40583b}));crown.position.set(x,7,z);g.add(crown);}
  } else {
    for(let i=0;i<10;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(3+(i%3),1),stone);rock.position.set(-42+(i%5)*19,1,-66-Math.floor(i/5)*19);rock.scale.y=1.4;g.add(rock);}
  }
  g.position.set(sector.x,0,sector.z);scene.add(g);
}
campaignSectors.forEach((sector,index)=>buildChapterLandmark(index,sector));
for (const [index, sector] of campaignSectors.entries()) {
  addStoneOutpost(sector.x + 22, sector.z - 30, index * 0.17);
  addSandbagLine(sector.x - 13, sector.z - 24, 7 + (index % 3), -0.12);
  addConcealmentBush(sector.x - 9, sector.z - 11);
  addConcealmentBush(sector.x + 12, sector.z - 48);
  coverZones.push({position:new THREE.Vector3(sector.x + 22,0,sector.z - 30),radius:9});
  coverZones.push({position:new THREE.Vector3(sector.x - 13,0,sector.z - 24),radius:7});
}
const campaignSector = (stage:number) => campaignSectors[Math.floor((stage-1)/10)];

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
let cameraDistance = 8.4;
let cameraMode: 'behind' | 'front' = 'behind';
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
  const translations: Record<string,string> = {
    'Vous êtes tombé au combat. Recommencez la mission.':'لقد سقطت في المعركة. أعد المحاولة.',
    'Suivez le marqueur de mission. Utilisez COUVERT près des buissons ou des fortifications.':'اتبع مؤشر المهمة واستخدم زر الاحتماء قرب الصخور والأشجار.',
    'Rechargement en cours…':'جارٍ إعادة التلقيم…','Rechargement terminé.':'اكتمل التلقيم.',
    'Plus de munitions. Rechargez votre arme.':'نفدت الذخيرة. أعد التلقيم.',
    'Cible touchée ! Tirez encore pour la neutraliser.':'أصبت الهدف! أطلق مرة أخرى لإسقاطه.',
    'Ennemi neutralisé — cible éliminée.':'تم إسقاط العدو!',
    'Visée précise activée.':'تم تفعيل التصويب.','Visée désactivée.':'تم إيقاف التصويب.',
    'Mission accomplie !':'اكتملت المهمة!',
    'Approchez-vous des buissons ou des fortifications pour vous mettre à couvert.':'اقترب من الصخور أو الأشجار للاحتماء.',
    'Vous êtes à couvert. Restez dans cette zone pour ne pas être repéré.':'أنت في وضع الاحتماء.',
    'Vous avez quitté votre couverture.':'غادرت مكان الاحتماء.',
    'Objectif : récupérez la caisse avant de continuer.':'الهدف: استرجع صندوق الإمدادات أولاً.'
  };
  const remaining = message.includes('Il reste') ? message.split(' ')[2] : null;
  toast.textContent = translations[message] || (remaining ? 'بقي ' + remaining[1] + ' من الأعداء. أمّن الممر.' : message);
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}
function showGameOver(): void {
  if (gameOver) return;
  gameOver = true; started = false; paused = false;
  releaseJoystick(); releaseSprint(); stopFiring();
  document.body.classList.remove('game-started');
  $('#start-button').textContent = 'إعادة المحاولة';
  startScreen.style.display = 'grid';
  notify('Vous êtes tombé au combat. Recommencez la mission.');
}
function updateHud(): void {
  $('#health-value').textContent = `${health}%`;
  $('#health-meter').style.width = `${health}%`;
  $('#stamina-value').textContent = `${Math.round(stamina)}%`;
  $('#stamina-meter').style.width = `${stamina}%`;
  $('#ammo-value').textContent = `${ammo} / ${reserveAmmo}`;
  const progress = missionDone ? 100 : !suppliesCollected ? 0 : enemies.length > 0 ? 45 : 75;
  $('#mission-progress').style.width = `${progress}%`;
  $('#mission-status').textContent = missionDone
    ? 'اكتملت المهمة — وصلت إلى نقطة التجمع!'
    : !suppliesCollected
      ? '1/3: استرجع صندوق الإمدادات'
      : enemies.length > 0
        ? `2/3: أسقط الأعداء المتبقين (${enemies.length})`
        : '3/3: أمّن الممر وتوجه إلى نقطة التجمع';
}

function updateCampaignHeader(): void {
  const sector = campaignSector(campaignStage);
  const chapter = campaignChapter(campaignStage);
  $('#stage-label').textContent = `المرحلة ${campaignStage} / 100 · ${chapter.year}`;
  $('#mission-title').textContent = campaignStageTitle(campaignStage);
  $('#mission-description').textContent = chapter.description + ' · ' + chapter.title;
  $('#mission-status').textContent = `المنطقة: ${sector.name} · ${chapter.year} · المهمة ${campaignStage}/100`;
  const chapterLabel=$('#chapter-label'); if(chapterLabel) chapterLabel.textContent=chapter.title;
}
function configureCampaignStage(): void {
  const sector = campaignSector(campaignStage);
  const base = new THREE.Vector3(sector.x,0,sector.z);
  const chapter=campaignChapter(campaignStage);
  scene.background = new THREE.Color(chapter.sky);
  scene.fog = new THREE.Fog(chapter.fog, chapter.kind==='desert'?420:300, chapter.kind==='city'?1250:1600);
  (terrain.material as THREE.MeshStandardMaterial).color.setHex(chapter.terrain);
  sun.intensity = chapter.kind==='desert'?2.65:chapter.kind==='city'?1.75:2.2;
  player.position.copy(base).add(new THREE.Vector3(0,0,18));
  allies.forEach((ally,index) => {
    const offsets=[new THREE.Vector3(-2.2,0,4),new THREE.Vector3(2.2,0,4),new THREE.Vector3(0,0,6.5)];
    ally.position.copy(player.position).add(offsets[index]);
    ally.rotation.y=player.rotation.y;
  });
  player.rotation.set(0,0,0);
  supplyCache.position.copy(base).add(new THREE.Vector3(-8,0,-17));
  supplyCache.visible = true;
  marker.position.copy(base).add(new THREE.Vector3(5,0,-54));
  flagGroup.position.copy(base).add(new THREE.Vector3(-8,0,-38));
  missionDone = false; suppliesCollected = false;
  goalNeedsSuppliesNotified = false; goalNeedsEnemiesNotified = false;
  const count = Math.min(24, 8 + Math.floor((campaignStage-1)/4));
  resetEnemies(count, base);
  updateCampaignHeader();
  updateHud();
}
function resetEnemies(count = 4, base = new THREE.Vector3(0,0,-25)): void {
  for (const enemy of enemies) {
    const mixer = enemy.userData.characterMixer as THREE.AnimationMixer | undefined;
    if (mixer) { mixer.stopAllAction(); const index = characterMixers.indexOf(mixer); if (index >= 0) characterMixers.splice(index, 1); }
    scene.remove(enemy);
  }
  enemies.length = 0;
  enemyMeshes.length = 0;
  for (let i = 0; i < count; i++) {
    const enemy = makePerson(0x55594e, 0.95);
    if (soldierTemplate) attachSoldierModel(enemy, 0x858b7b);
    enemy.position.set(base.x + (i - (count - 1) / 2) * 4.4, 0, base.z - 15 - (i % 3) * 5);
    enemy.userData.health = 2;
    enemy.userData.fireCooldown = 1.0 + i * 0.18;
    enemy.userData.role = i % 6 === 0 ? 'sniper' : 'rifle';
    enemy.userData.patrolX = enemy.position.x;
    enemy.userData.patrolZ = enemy.position.z;
    enemy.userData.patrolPhase = i * 1.7;
    scene.add(enemy);
    enemies.push(enemy);
    enemy.traverse((part) => { if (part instanceof THREE.Mesh) enemyMeshes.push(part); });
  }
}
let cinematicTimer: number | null = null;
function launchMissionBriefing(): void {
  if (cinematicTimer !== null) window.clearTimeout(cinematicTimer);
  const chapter = campaignChapter(campaignStage);
  const sector = campaignSector(campaignStage);
  const plan = campaignStage % 3 === 1
    ? 'استرجع الإمدادات، ثم تعامل مع التهديدات قبل التقدم.'
    : campaignStage % 3 === 2
      ? 'تحرك بين نقاط الاحتماء وراقب محاور تقدم العدو.'
      : 'احمِ فريقك، أمّن الطريق، ثم توجه إلى نقطة التجمع.';
  // Start gameplay immediately on the user's tap. The cinematic is an overlay,
  // never a gate that can leave the player stuck on the briefing screen.
  beginGame();
  $('#cinema-counter').textContent = `OPÉRATION ${String(campaignStage).padStart(2,'0')} / 100`;
  $('#cinema-year').textContent = chapter.year;
  $('#cinema-title').textContent = chapter.title;
  $('#cinema-description').textContent = chapter.description;
  $('#cinema-sector').textContent = sector.name;
  $('#cinema-objective').textContent = campaignStageTitle(campaignStage);
  $('#cinema-plan').textContent = plan;
  $('#mission-cinematic').classList.add('visible');
  $('#mission-cinematic').setAttribute('aria-hidden','false');
  cinematicTimer = window.setTimeout(() => {
    $('#mission-cinematic').classList.remove('visible');
    $('#mission-cinematic').setAttribute('aria-hidden','true');
    cinematicTimer = null;
  }, 4200);
}
function closeMissionBriefing(): void {
  if (cinematicTimer !== null) window.clearTimeout(cinematicTimer);
  cinematicTimer = null;
  $('#mission-cinematic').classList.remove('visible');
  $('#mission-cinematic').setAttribute('aria-hidden','true');
}
function beginGame(): void {
  if (cinematicTimer !== null) window.clearTimeout(cinematicTimer);
  cinematicTimer = null;
  $('#mission-cinematic').classList.remove('visible');
  $('#mission-cinematic').setAttribute('aria-hidden','true');
  health = 100; stamina = 100; damageCooldown = 0; ammo = 12; reserveAmmo = 48;
  gameOver = false; reloading = false; aiming = false; crouching = false; playerHidden = false;
  player.scale.set(1,1,1); $('#hide-button').classList.remove('active'); $('#hide-button').innerHTML = '<span>▣</span><small>احتماء</small>';
  yaw = 0; pitch = -0.10; cameraDistance = 8.4; verticalVelocity = 0; onGround = true;
  configureCampaignStage();
  document.body.classList.toggle('portrait-landscape-sim', isPortraitTouch());
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
  notify('Suivez le marqueur de mission. Utilisez COUVERT près des buissons ou des fortifications.');
}
$('#outfit-algerian').addEventListener('click', () => setPlayerOutfit('algerian'));
$('#outfit-french').addEventListener('click', () => setPlayerOutfit('french'));
$('#start-button').addEventListener('click', () => {
  try {
    launchMissionBriefing();
  } catch (error) {
    console.error('Mission start failed:', error);
    closeMissionBriefing();
    try { beginGame(); } catch (fallbackError) { console.error('Direct game start failed:', fallbackError); notify('تعذر بدء المهمة. أعد تحميل الصفحة وحاول مجدداً.'); }
  }
});
$('#cinematic-enter').addEventListener('click', closeMissionBriefing);

function refreshMainMenu(): void {
  const chapter = campaignChapter(campaignStage);
  const sector = campaignSector(campaignStage);
  const title = campaignStageTitle(campaignStage);
  const values: Record<string,string> = {
    '#menu-operation-number': String(campaignStage).padStart(2,'0'),
    '#menu-operation-year': chapter.year + ' · ' + sector.name,
    '#menu-operation-title': title,
    '#menu-operation-description': chapter.description,
    '#menu-progress-text': (campaignStage - 1) + ' / 100',
    '#dossier-index': 'OPERATION ' + String(campaignStage).padStart(2,'0') + ' / 100',
    '#dossier-title': title,
    '#dossier-description': chapter.description,
    '#dossier-region': sector.name,
    '#dossier-year': chapter.year
  };
  for (const [selector,value] of Object.entries(values)) {
    const node = document.querySelector<HTMLElement>(selector);
    if (node) node.textContent = value;
  }
  const progress = document.querySelector<HTMLElement>('#menu-progress-bar');
  if (progress) progress.style.width = Math.max(0,campaignStage - 1) + '%';
}
document.querySelectorAll<HTMLButtonElement>('[data-menu-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.menuTab;
    if (!key) return;
    document.querySelectorAll('.menu-tab').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelectorAll<HTMLElement>('[data-menu-panel]').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.menuPanel === key);
    });
    refreshMainMenu();
  });
});
$('#missions-start').addEventListener('click', () => {
  try { launchMissionBriefing(); }
  catch (error) { console.error('Mission dossier launch failed:',error); beginGame(); }
});
$('#graphics-quality').addEventListener('change', (event) => {
  const quality = (event.currentTarget as HTMLSelectElement).value;
  const ratio = quality === 'low' ? 1 : quality === 'high' ? 1.7 : Math.min(window.devicePixelRatio,1.3);
  renderer.setPixelRatio(ratio);
  renderer.setSize(viewWidth(),viewHeight(),false);
  if (quality === 'low') {
    renderer.shadowMap.enabled = false;
    sun.castShadow = false;
    const shadows = document.querySelector<HTMLInputElement>('#shadows-toggle');
    if (shadows) shadows.checked = false;
  } else {
    const shadows = document.querySelector<HTMLInputElement>('#shadows-toggle');
    const enabled = quality === 'high' && !!shadows?.checked;
    renderer.shadowMap.enabled = enabled;
    sun.castShadow = enabled;
  }
});
$('#shadows-toggle').addEventListener('change', (event) => {
  const enabled = (event.currentTarget as HTMLInputElement).checked;
  renderer.shadowMap.enabled = enabled;
  sun.castShadow = enabled;
  if (enabled && (document.querySelector<HTMLSelectElement>('#graphics-quality')?.value === 'low')) {
    const quality = document.querySelector<HTMLSelectElement>('#graphics-quality');
    if (quality) quality.value = 'medium';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.3));
  }
});
refreshMainMenu();


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
$('#victory-next').addEventListener('click', () => {
  if (campaignStage >= 100) return;
  campaignStage += 1;
  localStorage.setItem('algerian-revolution-stage', String(campaignStage));
  $('#victory-screen').classList.remove('visible');
  paused = false; gameOver = false; launchMissionBriefing();
});
$('#victory-restart').addEventListener('click', () => {
  $('#victory-screen').classList.remove('visible');
  paused = false;
  gameOver = true;
  launchMissionBriefing();
});
$('#restart-button').addEventListener('click', () => {
  paused = false;
  gameOver = true;
  $('#pause-screen').classList.remove('visible');
  launchMissionBriefing();
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement && started) {
    // Keyboard movement remains available after the pointer is released.
  }
});
document.addEventListener('mousemove', (event) => {
  if (!started || document.pointerLockElement !== renderer.domElement) return;
  yaw += event.movementX * 0.0032;
  pitch = THREE.MathUtils.clamp(pitch + event.movementY * 0.0026, -0.72, 0.45);
});
// Full-screen touch camera: drag anywhere on the playfield, not just the right half.
// Interactive controls retain their own gestures (joystick, fire, reload, pickup, menus).
const cameraGestureExcluded = '#joystick, .mobile-actions button, button, input, select, textarea, a, .start-card, #pause-screen, #game-over-screen, #victory-screen';
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
  // The game canvas is rotated 90° on portrait phones; remap physical finger motion
  // into the landscape game axes so horizontal swipes always turn the view naturally.
  const dragX = isPortraitTouch() ? dy : dx;
  const dragY = isPortraitTouch() ? -dx : dy;
  yaw += dragX * (aiming ? 0.0052 : 0.0072);
  pitch = THREE.MathUtils.clamp(pitch + dragY * (aiming ? 0.0038 : 0.0050), -0.72, 0.38);
}, { passive: false });
const releaseLook = (event: PointerEvent) => {
  if (lookPointer === event.pointerId) lookPointer = null;
};
document.addEventListener('pointerup', releaseLook, true);
document.addEventListener('pointercancel', releaseLook, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) { lookPointer = null; releaseJoystick(); stopFiring(); releaseSprint(); } });
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
  notify('Rechargement en cours…');
  window.setTimeout(() => {
    if (!started || gameOver) { reloading = false; $('#reload-button').classList.remove('reloading'); return; }
    const loaded = Math.min(12 - ammo, reserveAmmo);
    ammo += loaded; reserveAmmo -= loaded; reloading = false;
    $('#reload-button').classList.remove('reloading');
    updateHud(); notify('Rechargement terminé.');
  }, 1050);
}
function interact(): void {
  if (!started || gameOver || suppliesCollected) return;
  if (player.position.distanceTo(supplyCache.position) > 4.4) {
    notify('Approchez-vous davantage de la caisse.');
    return;
  }
  suppliesCollected = true;
  supplyCache.visible = false;
  reserveAmmo += 12;
  updateHud();
  notify('Caisse récupérée. Continuez vers le point de ralliement.');
}
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && !event.repeat) reloadWeapon();
  if (event.code === 'KeyE' && !event.repeat) interact();
});
$('#reload-button').addEventListener('click', reloadWeapon);
$('#interact-hint').addEventListener('click', interact);
$('#pickup-button').addEventListener('click', interact);
$('#camera-zoom-in').addEventListener('click', () => { cameraDistance = Math.max(3.8, cameraDistance - 0.65); notify('Caméra rapprochée.'); });
$('#camera-zoom-out').addEventListener('click', () => { cameraDistance = Math.min(14, cameraDistance + 0.8); notify('Caméra éloignée.'); });
$('#camera-mode-toggle').addEventListener('click', () => {
  cameraMode = cameraMode === 'behind' ? 'front' : 'behind';
  $('#camera-mode-toggle').textContent = cameraMode === 'behind' ? 'ARRIÈRE' : 'AVANT';
  notify(cameraMode === 'behind' ? 'Vue arrière : vous regardez devant le soldat.' : 'Vue avant : la caméra montre le visage du soldat.');
});
$('#camera-reset').addEventListener('click', () => {
  cameraMode = 'behind'; cameraDistance = 8.4; yaw = 0; pitch = -0.10;
  $('#camera-mode-toggle').textContent = 'ARRIÈRE';
  notify('Caméra réinitialisée derrière le soldat.');
});
window.addEventListener('blur', () => keys.clear());

function getAimedEnemy(): THREE.Group | undefined {
  // Aim assist makes touch shooting usable on small screens while keeping a visible target requirement.
  camera.updateMatrixWorld();
  const origin = camera.position.clone();
  const view = camera.getWorldDirection(new THREE.Vector3()).normalize();
  let best: THREE.Group | undefined;
  let bestScore = -Infinity;
  for (const enemy of enemies) {
    if (!enemy.parent || enemy.userData.dead) continue;
    const targetPoint = enemy.position.clone().add(new THREE.Vector3(0, 1.15, 0));
    const toTarget = targetPoint.sub(origin);
    const distance = toTarget.length();
    if (distance > 95 || distance < 0.1) continue;
    const alignment = view.dot(toTarget.normalize());
    // A forgiving 18-degree cone replaces the brittle exact-pixel-only hit test.
    if (alignment < 0.95) continue;
    const score = alignment - distance * 0.00045;
    if (score > bestScore) { best = enemy; bestScore = score; }
  }
  return best;
}
function shoot(): void {
  if (!started || gameOver || paused || missionDone || reloading || ammo <= 0) {
    if (ammo <= 0) notify('Plus de munitions. Rechargez votre arme.');
    return;
  }
  ammo--;
  if (playerHidden) { crouching = false; playerHidden = false; player.scale.y = 1; $('#hide-button').classList.remove('active'); $('#hide-button').innerHTML = '<span>▣</span><small>COUVERT</small>'; notify('Votre tir a révélé votre position. Changez de couverture.'); }
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
        notify('Cible touchée ! Tirez encore pour la neutraliser.');
      } else {
        target.userData.dead = true;
        awardCombatPoint();
        const mixer = target.userData.characterMixer as THREE.AnimationMixer | undefined;
        mixer?.stopAllAction();
        const index = enemies.indexOf(target);
        if (index >= 0) enemies.splice(index, 1);
        const removedMeshes: THREE.Object3D[] = [];
        target.traverse((part) => { if (part instanceof THREE.Mesh) removedMeshes.push(part); });
        for (const part of removedMeshes) {
          const meshIndex = enemyMeshes.indexOf(part);
          if (meshIndex >= 0) enemyMeshes.splice(meshIndex, 1);
        }
        // A visible fall/death pose remains in the world briefly instead of vanishing instantly.
        target.position.y = 0.04;
        target.rotation.z = target.position.x < player.position.x ? -1.18 : 1.18;
        target.rotation.x = -0.18;
        target.traverse((part) => {
          if (part instanceof THREE.Mesh) {
            part.castShadow = true;
            const mats = Array.isArray(part.material) ? part.material : [part.material];
            mats.forEach((mat) => { const m = mat as THREE.MeshStandardMaterial; if (m.color) m.color.lerp(new THREE.Color(0x282820), 0.18); });
          }
        });
        window.setTimeout(() => { scene.remove(target); target.clear(); }, 1100);
        $('#crosshair').classList.add('hit');
        window.setTimeout(() => $('#crosshair').classList.remove('hit'), 220);
        notify('Ennemi neutralisé — cible éliminée.');
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
    if (!isPlayerInCover()) { notify('Approchez-vous des buissons ou des fortifications pour vous mettre à couvert.'); return; }
    crouching = true; playerHidden = true; player.scale.y = 0.72;
    $('#hide-button').classList.add('active'); $('#hide-button').innerHTML = '<span>↗</span><small>خروج</small>';
    notify('Vous êtes à couvert. Restez dans cette zone pour ne pas être repéré.');
  } else {
    crouching = false; playerHidden = false; player.scale.y = 1;
    $('#hide-button').classList.remove('active'); $('#hide-button').innerHTML = '<span>▣</span><small>احتماء</small>';
    notify('Vous avez quitté votre couverture.');
  }
}
$('#hide-button').addEventListener('click', toggleHide);
document.addEventListener('keydown', (event) => { if (event.code === 'KeyC' && !event.repeat) toggleHide(); });
$('#aim-button').addEventListener('click', () => {
  if (!started || paused || gameOver) return;
  aiming = !aiming;
  $('#aim-button').classList.toggle('active', aiming);
  $('#crosshair').classList.toggle('aiming', aiming);
  notify(aiming ? 'Visée précise activée.' : 'Visée désactivée.');
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
  const screenDx = event.clientX - (rect.left + rect.width / 2);
  const screenDy = event.clientY - (rect.top + rect.height / 2);
  // The whole app is rotated 90° on portrait phones. Pointer coordinates are
  // still reported in physical screen axes, so convert them back to the
  // joystick's unrotated local axes before calculating movement.
  const dx = isPortraitTouch() ? screenDy : screenDx;
  const dy = isPortraitTouch() ? -screenDx : screenDy;
  const max = Math.min(rect.width, rect.height) * 0.36;
  const rawLength = Math.hypot(dx, dy);
  const deadZone = max * 0.12;
  const length = Math.max(1, rawLength);
  const normalized = rawLength <= deadZone ? 0 : Math.min((rawLength - deadZone) / (max - deadZone), 1);
  touchX = rawLength <= deadZone ? 0 : (dx / length) * normalized;
  touchY = rawLength <= deadZone ? 0 : (dy / length) * normalized;
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
joystick.addEventListener('lostpointercapture', releaseJoystick);

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

// ===== BATTLEFIELD EXPANSION: squads, convoy, horse patrols, aircraft, trenches and grenades =====
type GrenadeState = { mesh: THREE.Group; velocity: THREE.Vector3; fuse: number };
const grenades: GrenadeState[] = [];
type TankShell = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number };
const tankShells: TankShell[] = [];
let tankFireClock = 4.5;
const battleAllies: THREE.Group[] = [];
let grenadeCount = 3;
let rankPoints = Number(localStorage.getItem('ar-rank-points') || 0);
const rankNames = ['مجند','جندي','جندي أول','عريف','رقيب','رقيب أول','مساعد','ملازم','نقيب','رائد','عقيد'];
const rankIndex = () => Math.min(rankNames.length - 1, Math.floor(rankPoints / 8));
const rankPanel = document.createElement('div');
rankPanel.id = 'battle-rank-panel';
rankPanel.style.cssText = 'position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:25;padding:7px 13px;border:1px solid #d5bd82aa;border-radius:12px;background:#101a15dd;color:#f6e8c4;font:700 12px Arial;direction:rtl;pointer-events:none;text-align:center;min-width:132px;box-shadow:0 4px 16px #0008';
rankPanel.innerHTML = '<div>الرتبة: <b id="battle-rank-name">مجند</b></div><small id="battle-rank-progress">0 / 8 نقاط · قنابل 3</small>';
root.appendChild(rankPanel);
function updateRankHud(): void {
  const name = rankNames[rankIndex()];
  const progress = rankIndex() === rankNames.length - 1 ? 8 : rankPoints % 8;
  const n = rankPanel.querySelector('#battle-rank-name');
  const p = rankPanel.querySelector('#battle-rank-progress');
  if (n) n.textContent = name;
  if (p) p.textContent = progress + ' / 8 نقاط · قنابل ' + grenadeCount;
}
function awardCombatPoint(): void {
  rankPoints += 1;
  localStorage.setItem('ar-rank-points', String(rankPoints));
  updateRankHud();
  if (rankPoints % 8 === 0) notify('ترقية جديدة: ' + rankNames[rankIndex()]);
}
function addFieldTent(x:number,z:number,rotation=0):void {
  const g=new THREE.Group();
  const canvas=document.createElement('canvas'); canvas.width=128; canvas.height=128;
  const c=canvas.getContext('2d')!; c.fillStyle='#9a8964'; c.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=12){c.strokeStyle='#74684f';c.lineWidth=2;c.beginPath();c.moveTo(i,0);c.lineTo(i,128);c.stroke();}
  const mat=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide,roughness:1});
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.1,3.1,4),mat); roof.position.y=2.15; roof.rotation.y=Math.PI/4; roof.scale.set(1,1,0.82); roof.castShadow=true; g.add(roof);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,0.22,4),new THREE.MeshStandardMaterial({color:0x665943})); base.position.y=.12; g.add(base);
  const flap=new THREE.Mesh(new THREE.PlaneGeometry(1.45,1.8),mat); flap.position.set(0,1.05,2.75); flap.rotation.y=Math.PI; g.add(flap);
  g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
}
function addTrench(x:number,z:number,length:number,rotation=0):void {
  const g=new THREE.Group();
  const earth=new THREE.MeshStandardMaterial({color:0x625640,roughness:1});
  const inner=new THREE.MeshStandardMaterial({color:0x29291f,roughness:1});
  const pit=new THREE.Mesh(new THREE.BoxGeometry(length,0.85,2.5),inner); pit.position.y=-.34;g.add(pit);
  for(let s of [-1,1]) {
    const berm=new THREE.Mesh(new THREE.BoxGeometry(length,1.05,.9),earth);berm.position.set(0,.2,s*1.55);berm.castShadow=true;g.add(berm);
    for(let i=0;i<Math.floor(length/2);i++){const bag=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.62,3,6),new THREE.MeshStandardMaterial({color:0x9a8969}));bag.rotation.z=Math.PI/2;bag.position.set(-length/2+1+i*2,.8,s*1.55);g.add(bag);}
  }
  g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
  coverZones.push({position:new THREE.Vector3(x,0,z),radius:length*.48+2});
}
function addCaveMouth(x:number,z:number):void {
  const g=new THREE.Group(); const rockMat=new THREE.MeshStandardMaterial({color:0x514f43,roughness:1,flatShading:true});
  const arch=new THREE.Mesh(new THREE.TorusGeometry(3.2,.95,8,12,Math.PI),rockMat);arch.position.y=2.25;arch.rotation.z=Math.PI;g.add(arch);
  const dark=new THREE.Mesh(new THREE.CircleGeometry(2.45,16),new THREE.MeshBasicMaterial({color:0x10110e,side:THREE.DoubleSide}));dark.position.set(0,2.05,-.15);g.add(dark);
  for(let s of [-1,1]){const side=new THREE.Mesh(new THREE.DodecahedronGeometry(2.1,1),rockMat);side.position.set(s*2.5,1.0,0);side.scale.set(.8,1.2,1.2);g.add(side);}
  g.position.set(x,0,z);scene.add(g);coverZones.push({position:new THREE.Vector3(x,0,z),radius:6});
}
function addTruck(x:number,z:number,rotation:number):THREE.Group {
  const g=new THREE.Group(); const green=new THREE.MeshStandardMaterial({color:0x59604a,roughness:.9});const rubber=new THREE.MeshStandardMaterial({color:0x20211f,roughness:1});
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.5,1.8,2.1),green);cab.position.set(0,1.55,-2.0);g.add(cab);
  const windshield=new THREE.Mesh(new THREE.BoxGeometry(2.15,.68,.08),new THREE.MeshStandardMaterial({color:0x273638,metalness:.2,roughness:.25}));windshield.position.set(0,1.95,-3.08);g.add(windshield);
  const bed=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.15,4.1),green);bed.position.set(0,1.25,1.05);g.add(bed);
  const canvas=new THREE.Mesh(new THREE.BoxGeometry(2.9,1.65,4.15),new THREE.MeshStandardMaterial({color:0x8b805f,roughness:1,side:THREE.DoubleSide}));canvas.position.set(0,2.55,1.05);g.add(canvas);
  for(const sx of [-1,1])for(const zz of [-2.35,1.65]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.34,14),rubber);w.rotation.z=Math.PI/2;w.position.set(sx*1.34,.68,zz);g.add(w);}
  g.position.set(x,0,z);g.rotation.y=rotation;g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);return g;
}
const convoy:THREE.Group[]=[];
convoy.push(addTruck(22,-54,-.18),addTruck(30,-61,-.18),addTruck(38,-68,-.18));
function addHorse(x:number,z:number,rotation:number):THREE.Group {
  const g=new THREE.Group();const coat=new THREE.MeshStandardMaterial({color:0x694a32,roughness:1});const dark=new THREE.MeshStandardMaterial({color:0x29231d,roughness:1});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.95,1.0,2.0),coat);body.position.y=1.45;g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.27,.42,1.2,8),coat);neck.position.set(0,2.05,-.78);neck.rotation.x=-.45;g.add(neck);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.42,.58,.7),coat);head.position.set(0,2.55,-1.28);g.add(head);
  const mane=new THREE.Mesh(new THREE.BoxGeometry(.18,.82,.34),dark);mane.position.set(0,2.45,-.72);g.add(mane);
  for(const sx of [-.32,.32])for(const zz of [-.72,.72]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,1.0,7),coat);leg.position.set(sx,.58,zz);leg.name='horse-leg';g.add(leg);const hoof=new THREE.Mesh(new THREE.BoxGeometry(.2,.18,.24),dark);hoof.position.set(sx,.12,zz);g.add(hoof);}
  g.position.set(x,0,z);g.rotation.y=rotation;g.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);return g;
}
const horses=[addHorse(-23,-48,.35),addHorse(-27,-51,.35)];
const aircraft=new THREE.Group();
const planeMat=new THREE.MeshStandardMaterial({color:0x626c5b,metalness:.2,roughness:.8});
const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(.48,.58,9,12),planeMat);fuselage.rotation.x=Math.PI/2;aircraft.add(fuselage);
const wing=new THREE.Mesh(new THREE.BoxGeometry(13,.18,2.1),planeMat);aircraft.add(wing);
const tail=new THREE.Mesh(new THREE.BoxGeometry(4,.15,1.1),planeMat);tail.position.z=3.5;aircraft.add(tail);
const fin=new THREE.Mesh(new THREE.BoxGeometry(.16,1.2,1.4),planeMat);fin.position.set(0,.58,3.55);aircraft.add(fin);
const propeller=new THREE.Mesh(new THREE.BoxGeometry(.12,2.4,.16),new THREE.MeshStandardMaterial({color:0x252724}));propeller.position.z=-4.7;aircraft.add(propeller);
aircraft.position.set(-95,55,-120);aircraft.rotation.y=-.45;aircraft.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=true;});scene.add(aircraft);
addFieldTent(-17,-47,.2);addFieldTent(-8,-51,-.2);addFieldTent(16,-92,.5);
addTrench(-25,-31,19,.18);addTrench(34,-112,24,-.4);addCaveMouth(47,-86);
addArmoredTank(-16,-82,.2,0x59614a,2.8);
for(let i=0;i<10;i++){
  const ally=makePerson(0x354c3b,.94);ally.position.set((i-4.5)*2.2,0,13+(i%3)*2);ally.userData.squadIndex=i;
  scene.add(ally);battleAllies.push(ally);if(soldierTemplate)attachSoldierModel(ally,0x687957);
}
let battleTime=0;
function createGrenade():void {
  if(!started||paused||gameOver||grenadeCount<=0){notify(grenadeCount<=0?'لا توجد قنابل متبقية.':'');return;}
  grenadeCount--;updateRankHud();
  const g=new THREE.Group();const shell=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),new THREE.MeshStandardMaterial({color:0x526047,metalness:.25,roughness:.7}));g.add(shell);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.12,8),new THREE.MeshStandardMaterial({color:0x252821}));cap.position.y=.22;g.add(cap);
  g.position.copy(player.position).add(new THREE.Vector3(0,1.35,0));
  const dir=new THREE.Vector3(Math.sin(yaw),.42,-Math.cos(yaw)).normalize();
  scene.add(g);grenades.push({mesh:g,velocity:dir.multiplyScalar(13).add(new THREE.Vector3(0,3,0)),fuse:2.1});
  notify('تم رمي القنبلة!');
}
document.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat)createGrenade();});
const grenadeButton=document.createElement('button');grenadeButton.id='battle-grenade-button';grenadeButton.textContent='قنبلة G';
grenadeButton.style.cssText='position:absolute;right:14px;bottom:118px;z-index:35;padding:11px 14px;border:1px solid #e6d09a;border-radius:13px;background:#493a24ee;color:#fff1ce;font:800 12px Arial;touch-action:manipulation';
grenadeButton.addEventListener('click',createGrenade);root.appendChild(grenadeButton);
updateRankHud();

function animate(): void {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  battleTime += delta;
  aircraft.position.x = -95 + Math.sin(time * .12) * 130;
  aircraft.position.z = -120 + Math.cos(time * .12) * 95;
  aircraft.rotation.z = Math.sin(time * .12) * .06;
  propeller.rotation.z += delta * 32;
  convoy.forEach((truck,i)=>{truck.position.x += Math.sin(time*.22+i*.6)*delta*.32;truck.position.z += delta*.42;});
  tankFireClock -= delta;
  if(started&&!paused&&!gameOver&&tankFireClock<=0&&tanks.length){
    const rig=tanks[Math.floor(time/8)%tanks.length];
    const muzzle=rig.group.localToWorld(new THREE.Vector3(0,3.05,-6.2));
    const target=player.position.clone().add(new THREE.Vector3(0,1,0));
    const velocity=target.sub(muzzle).normalize().multiplyScalar(34);
    const shell=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:0xffb45b}));
    shell.position.copy(muzzle);scene.add(shell);tankShells.push({mesh:shell,velocity,life:2.8});tankFireClock=7.5+Math.random()*4;
  }
  tankShells.forEach((shell,index)=>{
    shell.life-=delta;shell.mesh.position.addScaledVector(shell.velocity,delta);
    if(shell.life<=0||(started&&shell.mesh.position.distanceTo(player.position.clone().add(new THREE.Vector3(0,1,0)))<1.8)){
      const impact=shell.mesh.position.clone();scene.remove(shell.mesh);shell.mesh.geometry.dispose();(shell.mesh.material as THREE.Material).dispose();
      const flash=new THREE.Mesh(new THREE.SphereGeometry(2.1,12,10),new THREE.MeshBasicMaterial({color:0xff7d32,transparent:true,opacity:.65}));flash.position.copy(impact);scene.add(flash);
      window.setTimeout(()=>{scene.remove(flash);flash.geometry.dispose();(flash.material as THREE.Material).dispose();},280);
      if(started&&!playerHidden&&impact.distanceTo(player.position)<5&&damageCooldown<=0){health=Math.max(0,health-18);damageCooldown=1.1;updateHud();if(health<=0)showGameOver();}
      tankShells.splice(index,1);
    }
  });
  horses.forEach((horse,i)=>{horse.position.x += Math.sin(time*.6+i)*delta*.18;horse.traverse(o=>{if(o instanceof THREE.Mesh&&o.name==='horse-leg')o.rotation.x=Math.sin(time*7+i)*.28;});});
  grenades.forEach((g,index)=>{
    g.fuse-=delta;g.velocity.y-=9.8*delta;g.mesh.position.addScaledVector(g.velocity,delta);
    if(g.mesh.position.y<.22){g.mesh.position.y=.22;g.velocity.y=Math.abs(g.velocity.y)*.34;g.velocity.multiplyScalar(.72);}
    g.mesh.rotation.x+=delta*5;g.mesh.rotation.z+=delta*4;
    if(g.fuse<=0){
      const center=g.mesh.position.clone();scene.remove(g.mesh);
      const blast=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xff9b42,transparent:true,opacity:.72}));
      blast.position.copy(center);scene.add(blast);
      const smoke=new THREE.Mesh(new THREE.SphereGeometry(1.7,12,10),new THREE.MeshBasicMaterial({color:0x39352e,transparent:true,opacity:.42}));
      smoke.position.copy(center);scene.add(smoke);
      enemies.slice().forEach(enemy=>{if(enemy.position.distanceTo(center)<7){enemy.userData.health=Math.max(0,(enemy.userData.health as number)-2);if((enemy.userData.health as number)<=0){enemy.userData.dead=true;awardCombatPoint();const ix=enemies.indexOf(enemy);if(ix>=0)enemies.splice(ix,1);enemy.rotation.z=1.1;window.setTimeout(()=>{scene.remove(enemy);enemy.clear();},850);}}});
      window.setTimeout(()=>{scene.remove(blast,smoke);blast.geometry.dispose();smoke.geometry.dispose();(blast.material as THREE.Material).dispose();(smoke.material as THREE.Material).dispose();},420);
      grenades.splice(index,1);
    }
  });
  battleAllies.forEach((ally,i)=>{
    if(!started||paused||gameOver)return;
    const angle=player.rotation.y+(i%2?-.75:.75);
    const row=Math.floor(i/2)+2;
    const target=player.position.clone().add(new THREE.Vector3(Math.sin(angle)*row,0,Math.cos(angle)*row));
    ally.position.lerp(target,Math.min(1,delta*1.8));
    if(ally.position.distanceTo(target)>.9)setCharacterAnimation(ally,'Run');else setCharacterAnimation(ally,'Idle');
    const foe=enemies.reduce<THREE.Group|undefined>((best,e)=>!best||e.position.distanceTo(ally.position)<best.position.distanceTo(ally.position)?e:best,undefined);
    ally.userData.squadFire=(ally.userData.squadFire||.5)-delta;
    if(foe&&foe.position.distanceTo(ally.position)<38&&ally.userData.squadFire<=0){
      ally.lookAt(foe.position.x,ally.position.y,foe.position.z);ally.rotation.y+=Math.PI;
      const a=ally.position.clone().add(new THREE.Vector3(0,1.25,0)),b=foe.position.clone().add(new THREE.Vector3(0,1.1,0));
      const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const beam=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xc8d6a0,transparent:true,opacity:.62}));scene.add(beam);
      window.setTimeout(()=>{scene.remove(beam);geo.dispose();(beam.material as THREE.Material).dispose();},90);
      ally.userData.squadFire=1.7+Math.random()*1.1;
      if(Math.random()>.42){foe.userData.health=Math.max(0,(foe.userData.health as number)-1);if((foe.userData.health as number)<=0){foe.userData.dead=true;awardCombatPoint();const ix=enemies.indexOf(foe);if(ix>=0)enemies.splice(ix,1);foe.rotation.z=1.0;window.setTimeout(()=>{scene.remove(foe);foe.clear();},900);}}
    }
  });

  for (const mixer of characterMixers) mixer.update(delta);
  damageCooldown = Math.max(0, damageCooldown - delta);
  radarElapsed += delta;
  if (radarElapsed >= 0.12) { drawRadar(); radarElapsed = 0; }
  marker.position.y = Math.sin(time * 2) * 0.12;
  for (const tank of tanks) {
    tank.turret.rotation.y = Math.sin(time * 0.16 + tank.phase) * 0.34;
    tank.group.position.y = Math.sin(time * 0.8 + tank.phase) * 0.018;
  }
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
    // Movement axes are camera-relative: joystick up always advances into the view.
    forward.set(Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(Math.cos(yaw), 0, Math.sin(yaw)).normalize();
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
      // attachSoldierModel rotates the imported +Z rig by PI so the visible
      // character's forward axis is local -Z. Aim that -Z axis along travel.
      const targetHeading = Math.atan2(-direction.x, -direction.z);
      const headingDelta = Math.atan2(Math.sin(targetHeading - player.rotation.y), Math.cos(targetHeading - player.rotation.y));
      player.rotation.y += headingDelta * (1 - Math.exp(-delta * 13));
    }
    if (direction.lengthSq() <= 0.01) {
      setCharacterAnimation(player, 'Idle');
      stamina = THREE.MathUtils.clamp(stamina + 24 * delta, 0, 100);
      player.traverse((part) => { if (part instanceof THREE.Mesh && part.userData.motionRole) part.rotation.x *= Math.max(0, 1 - delta * 8); });
    }
    allies.forEach((ally,index) => {
      const offsets=[new THREE.Vector3(-2.2,0,4),new THREE.Vector3(2.2,0,4),new THREE.Vector3(0,0,6.5)];
      const target=offsets[index].applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y).add(player.position);
      const gap=ally.position.distanceTo(target);
      ally.position.lerp(target,Math.min(1,delta*3.8));
      ally.rotation.y=player.rotation.y;
      setCharacterAnimation(ally,gap>1.25?'Run':'Idle');
    });
    $('#stamina-value').textContent = `${Math.round(stamina)}%`;
    $('#stamina-meter').style.width = `${stamina}%`;
    if (keys.has('Space') && onGround) { verticalVelocity = 6.2; onGround = false; }
    verticalVelocity -= 17 * delta;
    player.position.y += verticalVelocity * delta;
    if (player.position.y <= 0) { player.position.y = 0; verticalVelocity = 0; onGround = true; }
    player.position.x = THREE.MathUtils.clamp(player.position.x, -195, 195);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -195, 175);
    if (crouching && !isPlayerInCover()) { crouching = false; playerHidden = false; player.scale.y = 1; $('#hide-button').classList.remove('active'); $('#hide-button').textContent = 'اختباء'; notify('Vous avez quitté la zone de couverture.'); }
    else playerHidden = crouching && isPlayerInCover();

    const distanceToGoal = player.position.distanceTo(marker.position);
    if (!missionDone && distanceToGoal < 3.2) {
      if (!suppliesCollected && !goalNeedsSuppliesNotified) {
        goalNeedsSuppliesNotified = true;
        notify('Objectif : récupérez la caisse avant de continuer.');
      } else if (suppliesCollected && enemies.length > 0 && !goalNeedsEnemiesNotified) {
        goalNeedsEnemiesNotified = true;
        notify(`Il reste ${enemies.length} ennemis. Sécurisez le passage.`);
      } else if (suppliesCollected && enemies.length === 0) {
        missionDone = true;
        paused = true;
        keys.clear();
        releaseJoystick();
        releaseSprint();
        $('#victory-screen').classList.add('visible');
        const nextButton = $('#victory-next') as HTMLButtonElement;
        nextButton.textContent = campaignStage >= 100 ? 'إنهاء الحملة' : 'المرحلة التالية ←';
        nextButton.disabled = campaignStage >= 100;
        $('#victory-heading').textContent = campaignStage >= 100 ? 'تحررت الجزائر · 5 جويلية 1962' : `اكتملت المرحلة ${campaignStage} من 100`;
        const victoryCopy=$('#victory-copy'); if(victoryCopy) victoryCopy.textContent=campaignStage>=100?'بعد 100 مهمة وصلت الحملة إلى الاستقلال. المجد للشهداء.':'تم تأمين القطاع. استعد للمهمة التالية في منطقة وزمن مختلفين.';
        updateHud();
        notify('Mission accomplie !');
      }
    }
    const cacheDistance = player.position.distanceTo(supplyCache.position);
    const nearCache = !suppliesCollected && cacheDistance < 5.2;
    $('#interact-hint').classList.toggle('visible', nearCache);
    const pickupButton = $('#pickup-button') as HTMLButtonElement;
    pickupButton.classList.toggle('visible', nearCache);
    pickupButton.disabled = !nearCache;
    pickupButton.textContent = cacheDistance < 4.4 ? 'RÉCUPÉRER LA CAISSE' : `APPROCHEZ · ${Math.ceil(cacheDistance)} m`;
    enemies.forEach((enemy, index) => {
      if (enemy.parent === null) return;
      const distance = enemy.position.distanceTo(player.position);
      if (!playerHidden && distance < 22 && distance > 3.0) {
        const toward = player.position.clone().sub(enemy.position).setY(0).normalize();
        enemy.position.addScaledVector(toward, delta * 0.82);
        setCharacterAnimation(enemy, 'Walk');
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        // Soldier model's forward axis is local -Z; lookAt points local +Z at the target.
        enemy.rotation.y += Math.PI;
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
      const enemyRange = enemy.userData.role === 'sniper' ? 78 : 32;
      if (!playerHidden && distance >= 7 && distance < enemyRange && enemy.userData.fireCooldown <= 0) {
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        enemy.rotation.y += Math.PI;
        const from = enemy.position.clone().add(new THREE.Vector3(0, 1.35, 0));
        const to = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([from, to]);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color: enemy.userData.role === 'sniper' ? 0xff5c42 : 0xd8a76c,transparent:true,opacity:0.7}));
        scene.add(line);
        window.setTimeout(() => { scene.remove(line); lineGeometry.dispose(); (line.material as THREE.Material).dispose(); }, 120);
        enemy.userData.fireCooldown = enemy.userData.role === 'sniper' ? 4.2 + Math.random() * 1.5 : 2.1 + Math.random() * 1.1;
        if (damageCooldown <= 0 && Math.random() > 0.35) {
          health = Math.max(0, health - 5);
          damageCooldown = 0.7;
          $('#damage-flash').classList.add('active');
          window.setTimeout(() => $('#damage-flash').classList.remove('active'), 130);
          updateHud();
          if (health <= 0) showGameOver();
        }
      }
      if (!playerHidden && distance < 3.2 && damageCooldown <= 0) {
        health = Math.max(0, health - 8);
        damageCooldown = 0.9;
        $('#damage-flash').classList.add('active');
        window.setTimeout(() => $('#damage-flash').classList.remove('active'), 180);
        updateHud();
        if (health <= 0) showGameOver();
      }
      enemy.position.y = 0;
      enemy.rotation.y += Math.sin(time + index) * delta * 0.03;
    });

    // Shoulder camera framing keeps the soldier left of the screen reticle.
    const desiredDistance = aiming ? Math.min(cameraDistance, 4.8) : cameraDistance;
    camera.fov = THREE.MathUtils.lerp(camera.fov, aiming ? 58 : 76, 1 - Math.exp(-delta * 9));
    camera.updateProjectionMatrix();
    const shoulder = aiming ? 0.88 : 0.58;
    const viewSide = cameraMode === 'front' ? -1 : 1;
    const cameraOffset = new THREE.Vector3(
      -Math.sin(yaw) * desiredDistance * viewSide + Math.cos(yaw) * shoulder,
      (aiming ? 1.72 : 2.05) + pitch * (aiming ? 1.1 : 1.5),
      Math.cos(yaw) * desiredDistance * viewSide + Math.sin(yaw) * shoulder
    );
    const cameraTarget = player.position.clone().add(new THREE.Vector3(0, crouching ? 0.92 : aiming ? 1.52 : 1.34, 0));
    const aimForward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const lookTarget = cameraTarget.clone().addScaledVector(aimForward, (cameraMode === 'front' ? -1 : 1) * (aiming ? 16 : 8));
    // Follow the player from a stable over-the-shoulder anchor; damp rotation and translation.
    const desiredCameraPosition = cameraTarget.clone().add(cameraOffset);
    const followAlpha = 1 - Math.exp(-delta * (aiming ? 15 : 9));
    camera.position.lerp(desiredCameraPosition, followAlpha);
    camera.lookAt(lookTarget);
    const aimed = getAimedEnemy();
    $('#crosshair').classList.toggle('targeting', Boolean(aimed));
  } else if (!started) {
    // Cinematic preview: orbit the actual chapter battlefield before control is handed to the player.
    const previewSector = campaignSector(campaignStage);
    const orbit = time * 0.19;
    camera.position.set(
      previewSector.x + Math.sin(orbit) * 43,
      17 + Math.sin(time * 0.42) * 2.2,
      previewSector.z + 18 + Math.cos(orbit) * 43
    );
    camera.lookAt(previewSector.x, 2.2, previewSector.z - 23);
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
