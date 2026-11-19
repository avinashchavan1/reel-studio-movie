// Style sampler: the same moment (Ishita + Vihaan + her glowing phone on campus) in 10 looks, 3 s each, 1080x1920.
import { THREE, toon, clay, glowMat, mesh, sunlight, skyGradient, scatter, tree, cloud, makePerson, rng, seg, ease, lerp, wobble, title } from './kit.js';

const LOOKS = [
  { name: '3D Storybook', note: 'Real 3D models, toon shading, smooth camera',
    sky: [[0, '#7fb6e8'], [0.55, '#cfe6f2'], [1, '#f6e7c8']], ground: '#8cc263', path: '#e2c98f', fog: '#e9eadb', mat: (c) => toon(c, 3) },
  { name: 'Stop-motion clay', note: 'Clay figures moved by hand, 12 fps on twos', outline: false, stop: true,
    sky: [[0, '#f2c6a8'], [0.6, '#f7e3cf'], [1, '#fbefe0']], ground: '#b7c98b', path: '#e8cfa5', fog: '#f4e6d6', mat: (c) => clay(c, 0.95),
    sun: { intensity: 2.0, ambient: 1.9, dir: [-5, 6, 7] }, grade: 'saturate(1.08) sepia(0.1) contrast(1.04)' },
  { name: 'Isometric diorama', note: 'A tiny 3D miniature world seen from above', iso: true,
    sky: [[0, '#f4ead8'], [1, '#f4ead8']], ground: '#9fd27a', path: '#f0d7a0', fog: '#f4ead8', mat: (c) => toon(c, 3), sun: { intensity: 2.8, ambient: 1.5, dir: [-6, 10, 3] } },
];

function phoneProp(neon) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.3, 0.025), toon('#27272a', 3)));
  g.add(mesh(new THREE.PlaneGeometry(0.135, 0.27), glowMat('#9fd3ff', 1.3), { pos: [0, 0, 0.014], shadow: false }));
  const arcs = [0.025, 0.045, 0.065].map(r => { const a = mesh(new THREE.TorusGeometry(r, 0.006, 6, 20, Math.PI * 0.5), glowMat(neon ? '#ff2bd6' : '#ff5d8f', 1.6), { pos: [0, -0.02, 0.016], rot: [0, 0, Math.PI * 0.25], shadow: false }); g.add(a); return a; });
  g.arcs = arcs; return g;
}

function buildLook(L, i) {
  const scene = new THREE.Scene();
  skyGradient(scene, L.sky);
  scene.fog = L.iso ? new THREE.Fog(L.fog, 60, 140) : new THREE.Fog(L.fog, 10, 34);
  sunlight(scene, { dir: [-6, 9, 6], area: 8, ...(L.sun || {}) });
  const M = L.mat, r = rng(20 + i);
  if (L.iso) { scene.add(mesh(new THREE.BoxGeometry(9, 0.6, 9), M(L.ground), { pos: [0, -0.3, -2] })); scene.add(mesh(new THREE.BoxGeometry(9.02, 0.45, 9.02), M('#8a5a3c'), { pos: [0, -0.5, -2] })); }
  else scene.add(mesh(new THREE.CircleGeometry(40, 48), M(L.ground), { rot: [-Math.PI / 2, 0, 0] }));
  scene.add(mesh(new THREE.PlaneGeometry(1.6, L.iso ? 9 : 30), M(L.path), { pos: [0, 0.004, L.iso ? -2 : -8], rot: [-Math.PI / 2, 0, 0] }));
  // campus blocks in the back (pink Lotus left, blue Orchid right) + trees
  for (const [x, c] of [[-3.4, '#f7b6c8'], [3.4, '#a9cbff']]) {
    const b = mesh(new THREE.BoxGeometry(L.iso ? 2.4 : 3, 2.4, 1.6), M(L.neon ? '#1a0630' : c), { pos: [x, 1.2, L.iso ? -5 : -6] });
    scene.add(b);
    for (let k = 0; k < 3; k++) scene.add(mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), L.night || L.neon ? glowMat(L.neon ? '#33e1ff' : '#ffe7a3', 1.1) : M('#e8f4ff'), { pos: [x - 0.75 + k * 0.75, 1.4, L.iso ? -4.18 : -5.18], shadow: false }));
  }
  if (!L.neon) scene.add(scatter(5 + i, L.iso ? 5 : 7, rr => tree(rr, { leafMat: M(['#5d9b4a', '#6fae52', '#4f8a43'][Math.floor(rr() * 3)]), trunkMat: M('#7a5236') }), L.iso ? [-4, 4] : [-9, 9], L.iso ? [-6, -3.5] : [-12, -4], x => Math.abs(x) < 1.6));
  if (!L.night && !L.neon && !L.paper && !L.iso) { const cl = scatter(8 + i, 4, rr => cloud(rr, { scale: lerp(0.8, 1.3, rr()) }), [-14, 14], [-30, -24]); cl.position.y = 9; scene.add(cl); }
  if (L.neon) { const grid = new THREE.GridHelper(60, 60, '#ff2bd6', '#7a2bff'); grid.position.y = 0.01; scene.add(grid);
    const sun = mesh(new THREE.CircleGeometry(4, 40), glowMat('#ff7a45', 1.2), { pos: [0, 4, -28], shadow: false }); scene.add(sun); }
  let flies = null;
  if (L.night) { flies = new THREE.Group(); const fr = rng(77); for (let k = 0; k < 26; k++) flies.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), glowMat('#fff3a0', 2.2), { pos: [lerp(-3, 3, fr()), lerp(0.4, 2.4, fr()), lerp(-3, 1, fr())], shadow: false })); scene.add(flies);
    const stars = new THREE.Group(); const sr = rng(5); for (let k = 0; k < 60; k++) stars.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), glowMat('#ffffff', 1.5), { pos: [lerp(-25, 25, sr()), lerp(6, 18, sr()), -30], shadow: false })); scene.add(stars); }
  const common = { mat: M, outline: L.outline, outlineWidth: L.outlineWidth, outlineColor: L.outlineColor };
  const ish = makePerson({ ...common, skin: '#f0c19c', hair: '#2a1a17', hairStyle: 'braid', outfit: 'kurta', outfitColor: '#f28aa6', trim: '#ffd36e', pants: '#ffc6d3', shoe: '#8a4b3a', dupatta: '#ffb3c6', bindi: true, earrings: '#ffd36e', clip: '#ff5d8f', height: 1.5 });
  const vih = makePerson({ ...common, skin: '#d29a72', hair: '#1c1311', hairStyle: 'quiff', outfit: 'shirt', outfitColor: '#4f8ff7', check: '#cfe2ff', pants: '#3d4f86', shoe: '#f4f4f5', backpack: '#5b6478', earphones: true, height: 1.62 });
  ish.root.position.set(-0.42, 0, 0); vih.root.position.set(0.42, 0, 0);
  const phone = phoneProp(L.neon); phone.position.set(0, 1.12, 0.25);
  scene.add(ish.root, vih.root, phone);
  const t0 = i * 3;
  const update = tt => {
    const t = L.stop ? Math.floor(tt * 12) / 12 : tt; const l = t - t0;
    if (L.stop) { const f = Math.floor(tt * 12); ish.root.position.x = -0.42 + (Math.sin(f * 12.9898) * 0.5) * 0.008; vih.root.position.x = 0.42 + (Math.sin(f * 78.233) * 0.5) * 0.008; }
    ish.pose({ t, blinkT: t, yaw: lerp(0.15, 0.55, ease.io(seg(l, 0.2, 1.2))), headTilt: 0.05 * Math.sin(t * 2), smile: 1 });
    vih.pose({ t, blinkT: t + 1.3, yaw: lerp(-0.15, -0.55, ease.io(seg(l, 0.4, 1.4))), wave: seg(l, 0.9, 1.2) * (1 - seg(l, 2.3, 2.6)), waveT: t });
    phone.position.y = 1.12 + Math.sin(t * 2.4) * 0.03; phone.rotation.y = Math.sin(t * 1.3) * 0.25;
    phone.arcs.forEach((a, k) => (a.visible = ((l * 2.6) % 4) > k));
    if (flies) flies.children.forEach((f, k) => { f.position.y += Math.sin(t * 1.7 + k) * 0.002; f.visible = Math.sin(t * 3 + k * 1.7) > -0.6; });
  };
  return { scene, update, bloom: L.bloom, grade: L.grade };
}

export function buildStory(stage, B) {
  const sets = {}; const shots = [];
  LOOKS.forEach((L, i) => {
    const s = buildLook(L, i); sets['look' + i] = { scene: s.scene, update: s.update };
    const paper = !!L.paper;
    shots.push({ set: 'look' + i, dur: 3, in: i ? { type: 'dissolve', dur: 0.35 } : undefined, bloom: s.bloom, grade: s.grade,
      cam: (l0, p0) => { const st = L.stop, l = st ? Math.floor(l0 * 12) / 12 : l0, p = st ? Math.floor(p0 * 36) / 36 : p0; const k = ease.io(p), f = Math.floor(l0 * 12), h = st ? [Math.sin(f * 4.1) * 0.012, Math.cos(f * 3.3) * 0.012] : [wobble(l * 0.7, i) * 0.02, wobble(l * 0.6, i + 9) * 0.02];
        if (L.iso) { const a = lerp(-0.75, -0.55, k); return { pos: [Math.sin(a) * 32, 26, Math.cos(a) * 32 - 2], look: [0, 0.4, -1.6], fov: 24 }; }
        return paper ? { pos: [h[0], 1.1, lerp(15, 14, k)], look: [0, 1.05, 0], fov: 15 }
          : { pos: [lerp(-0.6, 0.6, k) + h[0], 1.35 + h[1], lerp(7.6, 6.6, k)], look: [0, 1.05, 0], fov: 32 }; } });
  });
  function overlay(g, t) {
    const i = Math.min(2, Math.floor(t / 3)), L = LOOKS[i], at = i * 3, W = 1080, num = [1, 8, 19][i];
    const k = seg(t, at + 0.05, at + 0.3) * (1 - seg(t, at + 2.7, at + 2.95));
    if (k > 0) { // dark rounded bands so labels read on any sky
      g.save(); g.globalAlpha = 0.55 * k; g.fillStyle = '#120f1f';
      g.beginPath(); g.roundRect(W / 2 - 470, 150, 940, 330, 40); g.fill();
      g.beginPath(); g.roundRect(70, 1590, W - 140, 110, 30); g.fill(); g.restore();
    }
    const col = L.neon ? '#ff9cf0' : '#fffaf0';
    title(g, t, `${num} / 20`, { at: at + 0.05, dur: 2.9, y: 0.12, size: 110, in: 0.25, out: 0.3, color: '#ffc93c' });
    title(g, t, L.name, { at: at + 0.12, dur: 2.8, y: 0.205, size: L.name.length > 14 ? 84 : 100, in: 0.25, out: 0.3, color: col });
    title(g, t, L.note, { at: at + 0.3, dur: 2.6, y: 0.857, size: 40, weight: 500, in: 0.25, out: 0.3 });
  }
  return { sets, shots, overlay, finish: { grain: 0.06, vignette: 0.3, fadeIn: 0.3, fadeOut: 0.6 } };
}
