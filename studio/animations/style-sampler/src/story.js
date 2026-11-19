// Style sampler: the same moment (Ishita + Vihaan + her glowing phone on campus) in 10 looks, 3 s each, 1080x1920.
import { THREE, toon, clay, glowMat, mesh, sunlight, skyGradient, scatter, tree, cloud, makePerson, rng, seg, ease, lerp, wobble, title } from './kit.js';

const LOOKS = [
  { name: 'Storybook', note: 'Toon shading, ink outlines, bright daylight',
    sky: [[0, '#7fb6e8'], [0.55, '#cfe6f2'], [1, '#f6e7c8']], ground: '#8cc263', path: '#e2c98f', fog: '#e9eadb', mat: (c) => toon(c, 3) },
  { name: 'Soft clay', note: 'Matte clay-toy materials, warm light, no outlines', outline: false,
    sky: [[0, '#f2c6a8'], [0.6, '#f7e3cf'], [1, '#fbefe0']], ground: '#b7c98b', path: '#e8cfa5', fog: '#f4e6d6', mat: (c) => clay(c, 0.9),
    sun: { intensity: 2.2, ambient: 1.8, dir: [-5, 5, 7] }, grade: 'saturate(1.05) sepia(0.08)' },
  { name: 'Low-poly', note: 'Faceted flat-shaded shapes, hard sun', outline: false,
    sky: [[0, '#5aa9e6'], [1, '#c9ecff']], ground: '#7cc576', path: '#f1d07a', fog: '#d6eefc', mat: (c) => toon(c, 3, { flatShading: true }), sun: { intensity: 3.2, ambient: 0.9 } },
  { name: 'Golden hour', note: 'Sunset sky, warm low sun, rich colour',
    sky: [[0, '#3b2a6b'], [0.45, '#e3708a'], [0.8, '#ffb877'], [1, '#ffe2a8']], ground: '#a7a35a', path: '#f0c27a', fog: '#f5b98a', mat: (c) => toon(c, 3),
    sun: { sun: '#ffb26b', sky: '#ffb0c8', intensity: 3.0, ambient: 1.0, dir: [-8, 2.5, 4] }, grade: 'saturate(1.2) contrast(1.05)' },
  { name: 'Night magic', note: 'Night sky, fireflies, glowing phone',
    sky: [[0, '#0b1030'], [0.6, '#1f2a6b'], [1, '#3a3f8f']], ground: '#2c4a3a', path: '#4b4a6a', fog: '#1d2552', mat: (c) => toon(c, 3),
    sun: { sun: '#9fb4ff', sky: '#3b4aa0', ground: '#14202a', intensity: 1.2, ambient: 0.7 }, night: true, bloom: { strength: 0.9, radius: 0.5, threshold: 0.55 } },
  { name: 'Pastel anime', note: 'Bright pastels, 2-band shading, bold lines', outlineWidth: 0.03,
    sky: [[0, '#9ad7ff'], [1, '#fff0f8']], ground: '#b8f0c8', path: '#ffe1ef', fog: '#fff5fb', mat: (c) => toon(c, 2), sun: { intensity: 2.4, ambient: 1.9 }, grade: 'saturate(1.25) brightness(1.05)' },
  { name: 'Ink noir', note: 'Black and white, high contrast, heavy ink', outlineWidth: 0.034, outlineColor: '#000000',
    sky: [[0, '#9aa3ad'], [1, '#e6e6e6']], ground: '#8a8a8a', path: '#cfcfcf', fog: '#cfcfcf', mat: (c) => toon(c, 2), sun: { intensity: 3.4, ambient: 0.6 }, grade: 'grayscale(1) contrast(1.45)' },
  { name: 'Vintage film', note: 'Sepia tone, faded colour, film look',
    sky: [[0, '#8fb3c9'], [1, '#efe2c4']], ground: '#9cb06b', path: '#d9c290', fog: '#e8dcc0', mat: (c) => toon(c, 3), grade: 'sepia(0.6) contrast(1.08) saturate(0.75) brightness(1.03)' },
  { name: 'Paper cut-out', note: 'Flat colour, white paper edges, long lens', outlineWidth: 0.03, outlineColor: '#ffffff', paper: true,
    sky: [[0, '#ffd9c2'], [1, '#ffd9c2']], ground: '#f6a5a5', path: '#ffe9b0', fog: '#ffd9c2', mat: (c) => toon(c, 1), sun: { intensity: 2.0, ambient: 2.2 } },
  { name: 'Neon synthwave', note: 'Dark purple, glowing neon edges and grid', outlineWidth: 0.026, outlineColor: '#ff2bd6', neon: true,
    sky: [[0, '#0a0018'], [0.6, '#2b0a4f'], [1, '#ff3d8b']], ground: '#12001f', path: '#2a0a3f', fog: '#2b0a4f', mat: (c) => toon(c, 2),
    sun: { sun: '#ff6ad5', sky: '#5b2bff', ground: '#120020', intensity: 1.6, ambient: 0.8 }, bloom: { strength: 1.1, radius: 0.55, threshold: 0.5 }, grade: 'saturate(1.3)' },
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
  scene.fog = new THREE.Fog(L.fog, 10, 34);
  sunlight(scene, { dir: [-6, 9, 6], area: 8, ...(L.sun || {}) });
  const M = L.mat, r = rng(20 + i);
  scene.add(mesh(new THREE.CircleGeometry(40, 48), M(L.ground), { rot: [-Math.PI / 2, 0, 0] }));
  scene.add(mesh(new THREE.PlaneGeometry(1.6, 30), M(L.path), { pos: [0, 0.004, -8], rot: [-Math.PI / 2, 0, 0] }));
  // campus blocks in the back (pink Lotus left, blue Orchid right) + trees
  for (const [x, c] of [[-3.4, '#f7b6c8'], [3.4, '#a9cbff']]) {
    const b = mesh(new THREE.BoxGeometry(3, 2.4, 1.6), M(L.neon ? '#1a0630' : c), { pos: [x, 1.2, -6] });
    scene.add(b);
    for (let k = 0; k < 3; k++) scene.add(mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), L.night || L.neon ? glowMat(L.neon ? '#33e1ff' : '#ffe7a3', 1.1) : M('#e8f4ff'), { pos: [x - 0.9 + k * 0.9, 1.4, -5.18], shadow: false }));
  }
  if (!L.neon) scene.add(scatter(5 + i, 7, rr => tree(rr, { leafMat: M(['#5d9b4a', '#6fae52', '#4f8a43'][Math.floor(rr() * 3)]), trunkMat: M('#7a5236') }), [-9, 9], [-12, -4], x => Math.abs(x) < 1.6));
  if (!L.night && !L.neon && !L.paper) { const cl = scatter(8 + i, 4, rr => cloud(rr, { scale: lerp(0.8, 1.3, rr()) }), [-14, 14], [-30, -24]); cl.position.y = 9; scene.add(cl); }
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
  const update = t => {
    const l = t - t0;
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
      cam: (l, p) => { const k = ease.io(p), h = [wobble(l * 0.7, i) * 0.02, wobble(l * 0.6, i + 9) * 0.02];
        return paper ? { pos: [h[0], 1.1, lerp(15, 14, k)], look: [0, 1.05, 0], fov: 15 }
          : { pos: [lerp(-0.6, 0.6, k) + h[0], 1.35 + h[1], lerp(7.6, 6.6, k)], look: [0, 1.05, 0], fov: 32 }; } });
  });
  function overlay(g, t) {
    const i = Math.min(9, Math.floor(t / 3)), L = LOOKS[i], at = i * 3, W = 1080;
    const k = seg(t, at + 0.05, at + 0.3) * (1 - seg(t, at + 2.7, at + 2.95));
    if (k > 0) { // dark rounded bands so labels read on any sky
      g.save(); g.globalAlpha = 0.55 * k; g.fillStyle = '#120f1f';
      g.beginPath(); g.roundRect(W / 2 - 360, 150, 720, 330, 40); g.fill();
      g.beginPath(); g.roundRect(70, 1590, W - 140, 110, 30); g.fill(); g.restore();
    }
    const col = L.neon ? '#ff9cf0' : '#fffaf0';
    title(g, t, `${i + 1} / 10`, { at: at + 0.05, dur: 2.9, y: 0.12, size: 110, in: 0.25, out: 0.3, color: '#ffc93c' });
    title(g, t, L.name, { at: at + 0.12, dur: 2.8, y: 0.205, size: 100, in: 0.25, out: 0.3, color: col });
    title(g, t, L.note, { at: at + 0.3, dur: 2.6, y: 0.857, size: 40, weight: 500, in: 0.25, out: 0.3 });
  }
  return { sets, shots, overlay, finish: { grain: 0.06, vignette: 0.3, fadeIn: 0.3, fadeOut: 0.6 } };
}
