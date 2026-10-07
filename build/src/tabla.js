/* SacMusicals — 3D tabla pair for the hero and the scroll dive.
   Drag to turn, tap a head to play. setDive(p) flies the camera into the dayan's syahi. */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, Vector2, Vector3,
  LatheGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3,
  MeshStandardMaterial, HemisphereLight, DirectionalLight, Raycaster,
  CanvasTexture, RepeatWrapping, SRGBColorSpace, PMREMGenerator, ACESFilmicToneMapping,
  CircleGeometry, MeshBasicMaterial, AdditiveBlending, MathUtils,
  SphereGeometry, PlaneGeometry, ShadowMaterial, PCFSoftShadowMap, Curve,
  BufferGeometry, Float32BufferAttribute, DoubleSide, MeshPhysicalMaterial,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const lerp = MathUtils.lerp;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function woodTextures() {
  const W = 512, H = 1024;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const b = document.createElement('canvas'); b.width = W; b.height = H;
  const g = c.getContext('2d'), gb = b.getContext('2d');
  const base = g.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, '#431a0f'); base.addColorStop(0.5, '#5a2414'); base.addColorStop(1, '#461b10');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  gb.fillStyle = '#808080'; gb.fillRect(0, 0, W, H);
  // long flowing grain lines with occasional cathedral arcs
  for (let i = 0; i < 260; i++) {
    const x0 = Math.random() * W, amp = 3 + Math.random() * 10, f = 80 + Math.random() * 160, ph = Math.random() * 6;
    const dark = Math.random() < 0.7;
    g.strokeStyle = dark ? `rgba(30,10,4,${0.12 + Math.random() * 0.28})` : `rgba(160,80,45,${0.08 + Math.random() * 0.14})`;
    gb.strokeStyle = dark ? `rgba(40,40,40,${0.25 + Math.random() * 0.3})` : `rgba(200,200,200,${0.15})`;
    const lw = 0.6 + Math.random() * 2.4; g.lineWidth = gb.lineWidth = lw;
    g.beginPath(); gb.beginPath();
    for (let y = 0; y <= H; y += 8) {
      const x = x0 + Math.sin(y / f + ph) * amp + Math.sin(y / 23 + i) * 0.8;
      if (y === 0) { g.moveTo(x, y); gb.moveTo(x, y); } else { g.lineTo(x, y); gb.lineTo(x, y); }
    }
    g.stroke(); gb.stroke();
  }
  // pores
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    g.fillStyle = `rgba(20,6,2,${Math.random() * 0.25})`; g.fillRect(x, y, 1, 2 + Math.random() * 3);
    gb.fillStyle = 'rgba(0,0,0,0.35)'; gb.fillRect(x, y, 1, 2);
  }
  const map = new CanvasTexture(c), bump = new CanvasTexture(b);
  [map, bump].forEach((t) => { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(2, 1); });
  map.colorSpace = SRGBColorSpace;
  return { map, bump };
}

/* hammered copper: dimples in the bump map, slight colour mottling */
function copperTextures() {
  const N = 512;
  const c = document.createElement('canvas'); c.width = c.height = N;
  const b = document.createElement('canvas'); b.width = b.height = N;
  const g = c.getContext('2d'), gb = b.getContext('2d');
  g.fillStyle = '#b8683a'; g.fillRect(0, 0, N, N);
  gb.fillStyle = '#9a9a9a'; gb.fillRect(0, 0, N, N);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * N, y = Math.random() * N, r = 6 + Math.random() * 14;
    const rg = gb.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(40,40,40,0.55)'); rg.addColorStop(0.7, 'rgba(120,120,120,0.2)'); rg.addColorStop(1, 'rgba(200,200,200,0)');
    gb.fillStyle = rg; gb.beginPath(); gb.arc(x, y, r, 0, Math.PI * 2); gb.fill();
    const cg = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = Math.random() < 0.5 ? '120,52,26' : '214,140,90';
    cg.addColorStop(0, `rgba(${tone},0.18)`); cg.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const map = new CanvasTexture(c), bump = new CanvasTexture(b);
  [map, bump].forEach((t) => { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(3, 2); });
  map.colorSpace = SRGBColorSpace;
  return { map, bump };
}

/* leather: dark, slightly glossy, with fine creases */
function leatherTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ecdcbf'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.6 ? '120,90,55' : '255,248,230'},${Math.random() * 0.18})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 4, 1);
  }
  // worn, darker edges where hands and tuning rub
  const eg = g.createLinearGradient(0, 0, 256, 0);
  eg.addColorStop(0, 'rgba(110,80,50,.35)'); eg.addColorStop(0.18, 'rgba(110,80,50,0)'); eg.addColorStop(0.82, 'rgba(110,80,50,0)'); eg.addColorStop(1, 'rgba(110,80,50,.35)');
  g.fillStyle = eg; g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; return t;
}

/* syahi: fine concentric layers of iron-paste, with a dull sheen */
function syahiTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#0c0a0b'; g.fillRect(0, 0, 16, 512);
  for (let y = 0; y < 512; y += 2 + Math.random() * 6) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '48,44,46' : '0,0,0'},${0.1 + Math.random() * 0.3})`;
    g.fillRect(0, y, 16, 1 + Math.random() * 1.5);
  }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

/* a flat strap that hugs the drum: a ribbon facing outward along the curve */
function ribbonGeometry(curve, segs, w) {
  const pos = [], uv = [], idx = [];
  const p = new Vector3(), t = new Vector3(), n = new Vector3(), s = new Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(u, p); curve.getTangentAt(u, t);
    n.set(p.x, 0, p.z).normalize(); s.crossVectors(t, n).normalize().multiplyScalar(w / 2);
    pos.push(p.x + s.x, p.y + s.y, p.z + s.z, p.x - s.x, p.y - s.y, p.z - s.z);
    uv.push(0, u * 6, 1, u * 6);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* a braid: two strands twisting round the rim */
class BraidCurve extends Curve {
  constructor(R, r, turns, phase, y) { super(); this.R = R; this.r = r; this.turns = turns; this.phase = phase; this.y = y; }
  getPoint(t, out = new Vector3()) {
    const a = t * Math.PI * 2, b = a * this.turns + this.phase;
    const rr = this.R + Math.cos(b) * this.r;
    return out.set(Math.cos(a) * rr, this.y + Math.sin(b) * this.r, Math.sin(a) * rr);
  }
}

/* goatskin with the SacMusicals mark branded near the edge */
function skinTexture(stampUrl, angle) {
  // drawn at 2x so the small kinar stamp stays crisp; coordinates below are in a 512 space
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d'); g.scale(2, 2);
  const paint = () => {
    const grd = g.createRadialGradient(256, 256, 30, 256, 256, 256);
    grd.addColorStop(0, '#efe2c6'); grd.addColorStop(0.78, '#e6d3ad'); grd.addColorStop(0.8, '#d8c195'); grd.addColorStop(1, '#cdb282');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
    // kinar: the outer band of doubled skin, a touch darker and greyer
    const kg = g.createRadialGradient(256, 256, 196, 256, 256, 256);
    kg.addColorStop(0, 'rgba(160,135,100,0)'); kg.addColorStop(0.08, 'rgba(160,135,100,.38)'); kg.addColorStop(1, 'rgba(120,96,66,.5)');
    g.fillStyle = kg; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.arc(256, 256, 198, 0, Math.PI * 2, true); g.fill();
    g.strokeStyle = 'rgba(95,72,45,0.55)'; g.lineWidth = 2.2;
    g.beginPath(); g.arc(256, 256, 198, 0, Math.PI * 2); g.stroke();
    // the cut holes where the straps pass through the kinar
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      g.fillStyle = 'rgba(70,50,30,.45)';
      g.beginPath(); g.ellipse(256 + Math.cos(a) * 246, 256 + Math.sin(a) * 246, 5, 2.4, a, 0, Math.PI * 2); g.fill();
    }
    // fibres and blotches of real goatskin
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * Math.PI, l = 3 + Math.random() * 9;
      g.strokeStyle = `rgba(130,95,55,${Math.random() * 0.08})`; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = 10 + Math.random() * 40;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(170,130,80,0.06)'); rg.addColorStop(1, 'rgba(170,130,80,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };
  paint();
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
  if (stampUrl) {
    const img = new Image();
    img.onload = () => {
      const s = 38, r = 220;
      g.save();
      g.translate(256 + Math.cos(angle) * r, 256 + Math.sin(angle) * r);
      g.rotate(angle + Math.PI / 2);
      // heat-brand look: the mark recoloured a burnt brown, slightly soft
      const m = document.createElement('canvas'); m.width = m.height = 160;
      const mg = m.getContext('2d'); mg.drawImage(img, 0, 0, 160, 160);
      mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#5b3a1f'; mg.fillRect(0, 0, 160, 160);
      g.globalAlpha = 0.85;
      g.drawImage(m, -s / 2, -s / 2, s, s);
      g.restore();
      t.needsUpdate = true;
    };
    img.src = stampUrl;
  }
  return t;
}

function buildDrum({ profile, straps, strapColor, strapW = 0.022, gatteMat, bodyMat, syahiR, syahiOffset, withGatte, stampUrl, stampAngle }) {
  const drum = new Group();
  drum.add(new Mesh(new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 72), bodyMat));

  const [topR, topY] = profile[profile.length - 1];
  const head = new Mesh(new CylinderGeometry(topR, topR, 0.012, 72),
    new MeshStandardMaterial({ map: skinTexture(stampUrl, stampAngle), roughness: 0.85 }));
  head.position.y = topY + 0.004; drum.add(head);

  // syahi: a low dome built up in layers, matte with a soft sheen
  const syahi = new Group();
  const syMat = new MeshPhysicalMaterial({ color: 0xffffff, map: syahiTexture(), roughness: 0.6, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.5, side: DoubleSide });
  const prof = [], h = syahiR * 0.1;
  for (let i = 0; i <= 28; i++) { const r = syahiR * (i / 28); prof.push(new Vector2(r, h * Math.sqrt(Math.max(0, 1 - (r / syahiR) ** 2)) + 0.0006)); }
  prof.reverse(); prof.unshift(new Vector2(syahiR, 0));
  const dome = new Mesh(new LatheGeometry(prof, 96), syMat);
  syahi.add(dome);
  const ring = new Mesh(new TorusGeometry(syahiR, 0.0022, 8, 96), new MeshStandardMaterial({ color: 0x2a2526, roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.0008; syahi.add(ring);
  syahi.position.set(0, topY + 0.01, syahiOffset); drum.add(syahi);
  syahi.traverse((m) => { m.castShadow = false; });

  const leatherMap = leatherTexture();
  const leather = new MeshStandardMaterial({ color: strapColor, map: leatherMap, roughness: 0.62, side: DoubleSide });
  const gajraMat = new MeshStandardMaterial({ color: 0x3a2618, map: leatherMap, roughness: 0.55 });
  // gajra: braided rim, two twisting strands
  [0, Math.PI].forEach((ph) => {
    const braid = new Mesh(new TubeGeometry(new BraidCurve(topR + 0.006, 0.012, 64, ph, topY), 520, 0.013, 6, true), gajraMat);
    braid.castShadow = true; drum.add(braid);
  });
  const base = new Mesh(new TorusGeometry(profile[1][0] + 0.012, 0.026, 12, 60), gajraMat);
  base.rotation.x = Math.PI / 2; base.position.y = 0.03; base.castShadow = true; drum.add(base);

  const radiusAt = (y) => {
    for (let i = 1; i < profile.length; i++) {
      const [r1, y1] = profile[i - 1], [r2, y2] = profile[i];
      if (y >= y1 && y <= y2) return lerp(r1, r2, (y - y1) / (y2 - y1 || 1));
    }
    return topR;
  };
  // baddhi: flat leather straps laced in a V between the rim and the base ring
  const step = (Math.PI * 2) / straps;
  for (let i = 0; i < straps; i++) {
    const a0 = i * step, a1 = a0 + step / 2, p = [];
    for (let s2 = 0; s2 <= 14; s2++) {
      const t = s2 / 14, y = lerp(topY - 0.012, 0.045, t), a = lerp(a0, a1, t);
      const lift = withGatte && y < 0.42 && y > 0.2 ? 0.052 * Math.sin(((y - 0.2) / 0.22) * Math.PI) : 0;
      const r = radiusAt(y) + 0.011 + lift;
      p.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const strap = new Mesh(ribbonGeometry(new CatmullRomCurve3(p), 48, strapW), leather);
    strap.scale.set(1, 1, 1); strap.castShadow = true; drum.add(strap);
    const q = [];
    for (let s2 = 0; s2 <= 14; s2++) {
      const t = s2 / 14, y = lerp(0.045, topY - 0.012, t), a = lerp(a1, a0 + step, t);
      const lift = withGatte && y < 0.42 && y > 0.2 ? 0.052 * Math.sin(((y - 0.2) / 0.22) * Math.PI) : 0;
      const r = radiusAt(y) + 0.011 + lift;
      q.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const back = new Mesh(ribbonGeometry(new CatmullRomCurve3(q), 48, strapW), leather);
    back.castShadow = true; drum.add(back);
    // gatte: wooden tuning blocks wedged under each pair of straps
    if (withGatte) {
      const y = 0.31, r = radiusAt(y) + 0.02, a = a0 + step * 0.5;
      const gt = new Mesh(new CylinderGeometry(0.032, 0.032, 0.115, 24), gatteMat || bodyMat);
      gt.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      // lying horizontally, tangent to the shell, under both legs of the V
      gt.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(-Math.sin(a), 0, Math.cos(a)));
      gt.castShadow = true; drum.add(gt);
    }
  }
  const glow = new Mesh(new CircleGeometry(topR * 1.25, 64),
    new MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = topY + 0.02; drum.add(glow);

  drum.userData = { head, syahi, glow, topR, topY, syahiOffset, syahiR };
  return drum;
}

function cushion(color, r) {
  const m = new Mesh(new TorusGeometry(r, 0.085, 24, 64), new MeshPhysicalMaterial({ color, roughness: 0.92, sheen: 1, sheenRoughness: 0.45, sheenColor: 0xfff4de }));
  m.rotation.x = Math.PI / 2; m.position.y = -0.02; m.scale.z = 0.8;
  return m;
}

export function mountTabla(container, { onBol, reducedMotion, stampUrl } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'tabla-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  const scene = new Scene();
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.65;

  const camera = new PerspectiveCamera(30, 1, 0.01, 50);
  scene.add(new HemisphereLight(0xfff6e8, 0xd9c7a8, 1.1));
  const key = new DirectionalLight(0xfff0dc, 2.8); key.position.set(-2.2, 3.6, 2.4);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0006;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 });
  scene.add(key);
  const ground = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.09; ground.receiveShadow = true; scene.add(ground);
  const fill = new DirectionalLight(0xffe2b8, 0.9); fill.position.set(2.6, 1.6, 1.2); scene.add(fill);

  const wood = woodTextures(), cop = copperTextures();
  const woodMat = new MeshPhysicalMaterial({ map: wood.map, bumpMap: wood.bump, bumpScale: 0.5, roughness: 0.5, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.22 });
  const gatteMat = new MeshPhysicalMaterial({ color: 0xb88553, bumpMap: wood.bump, bumpScale: 0.4, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const copperMat = new MeshStandardMaterial({ map: cop.map, bumpMap: cop.bump, bumpScale: 1.2, roughness: 0.26, metalness: 0.95 });

  const dayan = buildDrum({
    profile: [[0, 0], [0.34, 0], [0.39, 0.05], [0.42, 0.25], [0.42, 0.47], [0.4, 0.66], [0.36, 0.86], [0.335, 0.96], [0.325, 1.0]],
    straps: 16, strapColor: 0xffffff, strapW: 0.021, gatteMat, bodyMat: woodMat, syahiR: 0.13, syahiOffset: 0, withGatte: true,
    stampUrl, stampAngle: Math.PI * 0.62,
  });
  const bayan = buildDrum({
    profile: [[0, 0], [0.22, 0], [0.38, 0.07], [0.51, 0.22], [0.56, 0.4], [0.54, 0.56], [0.49, 0.67], [0.465, 0.72]],
    straps: 12, strapColor: 0xc9a274, strapW: 0.025, bodyMat: copperMat, syahiR: 0.16, syahiOffset: 0.12, withGatte: false,
    stampUrl, stampAngle: -Math.PI * 0.35,
  });
  dayan.position.set(0.56, 0.02, 0.05); dayan.rotation.set(-0.12, 0, -0.06);
  bayan.position.set(-0.6, 0.02, 0);
  const cushD = cushion(0xe2cfa9, 0.34); cushD.position.set(0.56, -0.04, 0.05);
  const cushB = cushion(0xc8a25e, 0.44); cushB.position.set(-0.6, -0.04, 0);
  [dayan, bayan].forEach((d) => d.children[0] && (d.children[0].castShadow = true));
  [cushD, cushB].forEach((c) => { c.castShadow = true; c.receiveShadow = true; });
  const rig = new Group(); rig.add(dayan, bayan, cushD, cushB);
  scene.add(rig);

  /* ---------- camera: hero framing → dive into the dayan syahi ---------- */
  const heroPos = new Vector3(), heroLook = new Vector3(0, 0.42, 0);
  const tmp = new Vector3(), look = new Vector3(), syahiW = new Vector3();
  let dive = 0;
  function frameHero() {
    const w = container.clientWidth, h = container.clientHeight, a = w / h;
    const dist = a >= 1.25 ? 3.9 : 3.9 * Math.pow(1.25 / a, 0.9);
    heroPos.set(0, dist * 0.6, dist);
  }
  function placeCamera() {
    const k = ease(MathUtils.clamp(dive, 0, 1));
    rig.updateMatrixWorld(true);
    dayan.userData.syahi.getWorldPosition(syahiW);
    tmp.copy(syahiW).add(new Vector3(0, 0.05 + (1 - k) * 0.4, 0.0005));
    camera.position.copy(heroPos).lerp(tmp, k);
    look.copy(heroLook).lerp(syahiW, Math.min(1, k * 1.35));
    camera.fov = lerp(30, 46, k);
    camera.updateProjectionMatrix();
    camera.lookAt(look);
  }
  function resize() {
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    camera.aspect = container.clientWidth / container.clientHeight;
    frameHero(); placeCamera(); needs = true; kick();
  }
  new ResizeObserver(resize).observe(container);

  /* ---------- interaction ---------- */
  let rotY = -0.3, rotX = 0.08, velY = 0, dragging = false, moved = 0, lastX = 0, lastY = 0, idle = 3;
  const ray = new Raycaster(), ndc = new Vector2();
  const targets = [dayan.userData.head, dayan.userData.syahi, bayan.userData.head, bayan.userData.syahi];
  const hits = [];
  function bolFor(drum, p) {
    const l = drum.worldToLocal(p.clone()), { topR, syahiOffset, syahiR } = drum.userData;
    const fs = Math.hypot(l.x, l.z - syahiOffset), fc = Math.hypot(l.x, l.z);
    if (drum === dayan) return fs < syahiR ? 'Tun' : fc > topR * 0.78 ? 'Na' : 'Tin';
    return fs < syahiR ? 'Ke' : 'Ge';
  }
  function tap(x, y) {
    if (dive > 0.05) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) return;
    let drum = hit.object; while (drum && drum !== dayan && drum !== bayan) drum = drum.parent;
    if (!drum) return;
    const bol = bolFor(drum, hit.point);
    hits.push({ drum, t: 0 });
    window.smAudio && window.smAudio.play(bol);
    onBol && onBol(bol, x, y);
    kick();
  }
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; velY = 0; kick(); });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (dive < 0.02) { rotY += dx * 0.008; velY = dx * 0.008; if (e.pointerType === 'mouse') rotX = MathUtils.clamp(rotX + dy * 0.004, -0.1, 0.5); }
    lastX = e.clientX; lastY = e.clientY; idle = 0; kick();
  });
  addEventListener('pointerup', (e) => { if (!dragging) return; dragging = false; if (moved < 8) tap(e.clientX, e.clientY); });

  /* ---------- render loop, only while visible ---------- */
  let visible = false, needs = true, raf = 0, last = performance.now();
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let animating = false;
    if (!dragging && dive < 0.02) {
      if (Math.abs(velY) > 0.0004 && !reducedMotion) { rotY += velY; velY *= 0.93; animating = true; }
      idle += dt;
      if (!reducedMotion && idle > 2.5) { rotY += dt * 0.1; animating = true; }
    }
    // during the dive the pair settles to a fixed angle so the camera lands on the syahi
    const settle = ease(MathUtils.clamp(dive * 2.2, 0, 1));
    rig.rotation.y = lerp(rotY, -0.45, settle);
    rig.rotation.x = lerp(rotX, 0.0, settle);
    placeCamera();
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i]; h.t += dt;
      const k = Math.max(0, 1 - h.t / 0.6), u = h.drum.userData;
      const dip = Math.sin(Math.min(1, h.t / 0.12) * Math.PI) * k * 0.012;
      u.head.position.y = u.topY + 0.004 - dip; u.syahi.position.y = u.topY + 0.01 - dip;
      u.glow.material.opacity = k * 0.5;
      if (k <= 0) hits.splice(i, 1); else animating = true;
    }
    renderer.render(scene, camera);
    needs = false;
    if (visible && (animating || dragging || needs)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0.01 }).observe(container);

  resize();
  // keyboard / button strokes: strike the right drum and float the bol above the spot it would be played
  const drumOf = { Na: dayan, Tin: dayan, Tun: dayan, Ge: bayan, Ke: bayan };
  const spot = new Vector3();
  function screenOf(drum, bol) {
    const u = drum.userData;
    if (bol === 'Na') spot.set(u.topR * 0.86, u.topY, 0);
    else if (bol === 'Tin') spot.set(u.topR * 0.6, u.topY, 0);
    else if (bol === 'Ge') spot.set(0, u.topY, u.syahiOffset - u.topR * 0.62);
    else spot.set(0, u.topY, u.syahiOffset);
    drum.localToWorld(spot).project(camera);
    const r = canvas.getBoundingClientRect();
    return [r.left + (spot.x + 1) / 2 * r.width, r.top + (1 - spot.y) / 2 * r.height];
  }
  return {
    setDive(p) { if (Math.abs(p - dive) > 0.0005) { dive = p; needs = true; kick(); } },
    play(bol) {
      const drum = drumOf[bol]; if (!drum || dive > 0.05) return false;
      hits.push({ drum, t: 0 });
      window.smAudio && window.smAudio.play(bol);
      const [x, y] = screenOf(drum, bol);
      onBol && onBol(bol, x, y - 24);
      idle = 0; kick();
      return true;
    },
  };
}
