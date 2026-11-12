import * as THREE from "three";

// Procedural circus dressing: striped tent walls, a big-top canopy over the plaza,
// a sawdust ring, bunting, balloons, outer tents and a carousel. No collisions.
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
}
function tex(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function grime(g: CanvasRenderingContext2D, w: number, h: number) {
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(20,10,5,${Math.random() * 0.18})`;
    g.fillRect(Math.random() * w, Math.random() * h, rnd(1, 4), rnd(2, 14));
  }
  const grad = g.createLinearGradient(0, h * 0.6, 0, h);
  grad.addColorStop(0, "rgba(20,10,4,0)");
  grad.addColorStop(1, "rgba(20,10,4,0.75)");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}

/** Red & cream vertical canvas stripes with a scalloped gold trim. */
export function tentWallTexture(a = "#a3161c", b = "#e8d9b5") {
  const [c, g] = canvas(512, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 64, 0, 64, 512); }
  g.fillStyle = "#c9962a";
  g.fillRect(0, 0, 512, 34);
  for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(i * 32 + 16, 34, 16, 0, Math.PI); g.fill(); }
  g.fillStyle = "#3a0d0a";
  g.fillRect(0, 470, 512, 42);
  grime(g, 512, 512);
  return tex(c);
}
function radialStripes(a: string, b: string, n = 16) {
  const [c, g] = canvas(1024, 256);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * 1024) / n, 0, 1024 / n + 1, 256); }
  grime(g, 1024, 256);
  return tex(c);
}

interface Opts { width: number; depth: number; wallH: number; ring: THREE.Vector3; plazaR: number }

export function buildCircus(scene: THREE.Scene, o: Opts) {
  const anim: ((t: number, dt: number) => void)[] = [];
  const W = o.width, D = o.depth;

  // ---- ring in the plaza ----
  const sawdust = new THREE.Mesh(new THREE.CircleGeometry(o.plazaR, 48), new THREE.MeshStandardMaterial({ color: "#6b4a2a", roughness: 1 }));
  sawdust.rotation.x = -Math.PI / 2;
  sawdust.position.set(o.ring.x, 0.012, o.ring.z);
  sawdust.receiveShadow = true;
  scene.add(sawdust);
  const curb = new THREE.Mesh(new THREE.TorusGeometry(o.plazaR, 0.14, 8, 64), new THREE.MeshStandardMaterial({ map: radialStripes("#b3121b", "#f0e2c0", 24), roughness: 0.6 }));
  curb.rotation.x = -Math.PI / 2;
  curb.position.set(o.ring.x, 0.1, o.ring.z);
  scene.add(curb);
  const star = new THREE.Mesh(new THREE.RingGeometry(o.plazaR * 0.35, o.plazaR * 0.42, 5), new THREE.MeshStandardMaterial({ color: "#c9962a", roughness: 0.5, metalness: 0.4 }));
  star.rotation.x = -Math.PI / 2;
  star.position.set(o.ring.x, 0.015, o.ring.z);
  scene.add(star);

  // ---- big-top canopy floating above the plaza ----
  const canopyMat = new THREE.MeshStandardMaterial({ map: radialStripes("#8e1018", "#e5d3a8", 20), side: THREE.DoubleSide, roughness: 0.9 });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(o.plazaR + 5, 5, 20, 1, true), canopyMat);
  canopy.position.set(o.ring.x, o.wallH + 4.2, o.ring.z);
  scene.add(canopy);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), new THREE.MeshStandardMaterial({ color: "#c9962a", metalness: 0.6 }));
  pole.position.set(o.ring.x, o.wallH + 7.6, o.ring.z);
  scene.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), new THREE.MeshStandardMaterial({ color: "#d81f26", side: THREE.DoubleSide }));
  flag.position.set(o.ring.x + 0.55, o.wallH + 8.3, o.ring.z);
  scene.add(flag);
  anim.push((t) => { flag.rotation.y = Math.sin(t * 2.3) * 0.35; });
  // spotlight from the canopy onto the ring
  const ringSpot = new THREE.SpotLight("#ffd9a0", 40, 18, 0.5, 0.6, 1.5);
  ringSpot.position.set(o.ring.x, o.wallH + 3, o.ring.z);
  ringSpot.target.position.set(o.ring.x, 0, o.ring.z);
  scene.add(ringSpot, ringSpot.target);
  anim.push((t) => { ringSpot.intensity = Math.random() < 0.03 ? 4 : 30 + Math.sin(t * 1.3) * 8; });
  // light strings from canopy rim
  const bulbs: THREE.Vector3[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (let k = 0; k <= 8; k++) {
      const f = k / 8;
      bulbs.push(new THREE.Vector3(o.ring.x + Math.cos(a) * (o.plazaR + 4.6) * f, o.wallH + 6.2 - f * 2.6 - Math.sin(f * Math.PI) * 0.4, o.ring.z + Math.sin(a) * (o.plazaR + 4.6) * f));
    }
  }
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbs.length);
  const dummy = new THREE.Object3D();
  const warm = new THREE.Color("#ffc15a").multiplyScalar(2.2), off = new THREE.Color("#140c06");
  bulbs.forEach((p, i) => { dummy.position.copy(p); dummy.updateMatrix(); bulbMesh.setMatrixAt(i, dummy.matrix); bulbMesh.setColorAt(i, warm); });
  scene.add(bulbMesh);
  let chase = 0;
  anim.push((_, dt) => {
    chase += dt * 6;
    for (let i = 0; i < bulbs.length; i++) bulbMesh.setColorAt(i, (i + Math.floor(chase)) % 4 === 0 && Math.random() > 0.05 ? off : warm);
    bulbMesh.instanceColor!.needsUpdate = true;
  });

  // ---- bunting along the outer wall tops ----
  const flagShape = new THREE.Shape();
  flagShape.moveTo(-0.28, 0); flagShape.lineTo(0.28, 0); flagShape.lineTo(0, -0.6); flagShape.closePath();
  const pts: [number, number, number][] = [];
  const step = 1.1, y = o.wallH + 0.9;
  for (let x = 0; x <= W; x += step) { pts.push([x, y, 0], [x, y, D]); }
  for (let z = 0; z <= D; z += step) { pts.push([0, y, z], [W, y, z]); }
  const pennants = new THREE.InstancedMesh(new THREE.ShapeGeometry(flagShape), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), pts.length);
  const pal = ["#c8161e", "#f2d36b", "#2a6fd1", "#ede0c0", "#2f9a4a"];
  pts.forEach(([x, yy, z], i) => {
    dummy.position.set(x, yy, z);
    dummy.rotation.set(0, z === 0 || z === D ? 0 : Math.PI / 2, 0);
    dummy.updateMatrix();
    pennants.setMatrixAt(i, dummy.matrix);
    pennants.setColorAt(i, new THREE.Color(pal[i % pal.length]));
  });
  scene.add(pennants);
  dummy.rotation.set(0, 0, 0);

  // ---- balloons tied to the walls ----
  const balloonGeo = new THREE.SphereGeometry(0.35, 12, 10);
  balloonGeo.scale(1, 1.25, 1);
  const string = new THREE.LineBasicMaterial({ color: "#2a2a2a" });
  for (let i = 0; i < 14; i++) {
    const side = i % 4;
    const f = rnd(0.05, 0.95);
    const base = side === 0 ? new THREE.Vector3(W * f, o.wallH, 0) : side === 1 ? new THREE.Vector3(W * f, o.wallH, D) : side === 2 ? new THREE.Vector3(0, o.wallH, D * f) : new THREE.Vector3(W, o.wallH, D * f);
    const g = new THREE.Group();
    g.position.copy(base);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const col = new THREE.Color(pal[(i + k) % pal.length]);
      const b = new THREE.Mesh(balloonGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.1, emissive: col, emissiveIntensity: 0.15 }));
      const top = new THREE.Vector3(rnd(-0.5, 0.5), rnd(1.6, 2.4), rnd(-0.5, 0.5));
      b.position.copy(top);
      g.add(b, new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), top.clone().setY(top.y - 0.45)]), string));
    }
    scene.add(g);
    const ph = Math.random() * 6;
    anim.push((t) => { g.rotation.z = Math.sin(t * 0.9 + ph) * 0.08; g.rotation.x = Math.cos(t * 0.7 + ph) * 0.08; });
  }

  // ---- tents around the park ----
  const tent = (x: number, z: number, r: number, h: number, a: string, b: string, glow?: string) => {
    const g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), new THREE.MeshStandardMaterial({ map: radialStripes(a, b, 20), side: THREE.DoubleSide, roughness: 0.9 }));
    wall.position.y = h / 2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.12, h * 0.9, 20, 1, true), new THREE.MeshStandardMaterial({ map: radialStripes(a, b, 20), side: THREE.DoubleSide, roughness: 0.9 }));
    roof.position.y = h + h * 0.45;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.06, 8, 6), new THREE.MeshStandardMaterial({ color: "#c9962a", metalness: 0.7, roughness: 0.3 }));
    tip.position.y = h + h * 0.9;
    g.add(wall, roof, tip);
    if (glow) {
      const l = new THREE.PointLight(glow, 25, r * 3, 2);
      l.position.y = h * 0.6;
      g.add(l);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  };
  tent(W * 0.3, -26, 16, 10, "#8e1018", "#e6d4a8", "#ff9a3c");
  tent(-14, D * 0.25, 7, 5, "#1f4d9a", "#e6d4a8");
  tent(-16, D * 0.75, 8, 6, "#8e1018", "#f0c84a", "#ff5a5a");
  tent(W + 14, D * 0.3, 7, 5, "#2f7a3a", "#e6d4a8");
  tent(W + 18, D * 0.8, 9, 6, "#8e1018", "#e6d4a8", "#ffb050");
  tent(W * 0.85, D + 18, 6, 4.5, "#5a1f7a", "#f0c84a");

  // ---- carousel beyond the gate ----
  const car = new THREE.Group();
  car.position.set(W * 0.25, 0, D + 20);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.6, 24), new THREE.MeshStandardMaterial({ color: "#5a2a14", roughness: 0.8 }));
  deck.position.y = 0.3;
  const top = new THREE.Mesh(new THREE.ConeGeometry(7, 3, 24, 1, true), new THREE.MeshStandardMaterial({ map: radialStripes("#b3121b", "#f2d36b", 24), side: THREE.DoubleSide }));
  top.position.y = 6.5;
  const spin = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6), new THREE.MeshStandardMaterial({ color: "#c9962a", metalness: 0.7 }));
    p.position.set(Math.cos(a) * 4.5, 2.9, Math.sin(a) * 4.5);
    const horse = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 1.4), new THREE.MeshStandardMaterial({ color: i % 2 ? "#e8e0d0" : "#3a2418", roughness: 0.6 }));
    horse.position.set(Math.cos(a) * 4.5, 1.8, Math.sin(a) * 4.5);
    horse.rotation.y = -a;
    spin.add(p, horse);
  }
  const carLight = new THREE.PointLight("#ffcf7a", 30, 20, 2);
  carLight.position.y = 4;
  car.add(deck, top, spin, carLight);
  scene.add(car);
  anim.push((t, dt) => { spin.rotation.y += dt * 0.12; carLight.intensity = Math.random() < 0.04 ? 4 : 28 + Math.sin(t * 3) * 4; });

  return { update: (t: number, dt: number) => anim.forEach((f) => f(t, dt)) };
}
