// Strangers to Forever, Ep 1 "Two Strangers" (Storybook 3D, 1080x1920).
// Planning stage: cast + design sheet. Scenes are built after the design sheet is approved.
import { THREE, toon, mesh, sunlight, skyGradient, makePerson, glowMat, keys, seg, ease, lerp, wobble, title } from './kit.js';

export const cast = {
  ishita: () => makePerson({ skin: '#f0c19c', hair: '#2a1a17', hairStyle: 'braid', outfit: 'kurta', outfitColor: '#f28aa6', trim: '#ffd36e',
    pants: '#ffc6d3', shoe: '#8a4b3a', dupatta: '#ffb3c6', bindi: true, earrings: '#ffd36e', clip: '#ff5d8f', height: 1.5 }),
  vihaan: () => makePerson({ skin: '#d29a72', hair: '#1c1311', hairStyle: 'quiff', outfit: 'shirt', outfitColor: '#4f8ff7', check: '#cfe2ff',
    pants: '#3d4f86', shoe: '#f4f4f5', backpack: '#5b6478', earphones: true, height: 1.62 }),
  zoya: () => makePerson({ skin: '#f3c9a8', hair: '#5b3424', hairStyle: 'bun', outfit: 'kurti', outfitColor: '#9d7bff', trim: '#fff1a8',
    pants: '#6f8fd8', shoe: '#ffffff', glasses: true, earrings: '#e5e7eb', height: 1.5 }),
  appa: () => makePerson({ skin: '#c98e66', hair: '#2b2220', hairStyle: 'side', greySides: true, outfit: 'shirt', outfitColor: '#efe0c4',
    pants: '#6b5b4b', shoe: '#3b2a22', moustache: true, specs: true, height: 1.66 }),
  amma: () => makePerson({ skin: '#d9a07a', hair: '#1f1716', hairStyle: 'bunlow', jasmine: true, outfit: 'saree', outfitColor: '#2f9e6b', trim: '#f5c542',
    pants: '#2f9e6b', shoe: '#8a4b3a', bindi: true, bindiColor: '#d61f3c', earrings: '#f5c542', height: 1.52 }),
  phone: () => { // Ishita's first smartphone, screen glowing with the hotspot icon
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.66, 0.05), toon('#27272a', 3)));
    g.add(mesh(new THREE.PlaneGeometry(0.3, 0.6), glowMat('#9fd3ff', 1.2), { pos: [0, 0, 0.026], shadow: false }));
    for (const [r, k] of [[0.05, 0], [0.09, 1], [0.13, 2]]) g.add(mesh(new THREE.TorusGeometry(r, 0.012, 6, 24, Math.PI * 0.5), glowMat('#ff5d8f', 1.4), { pos: [0, -0.05, 0.03], rot: [0, 0, Math.PI * 0.25], shadow: false }));
    return g;
  },
};

export function buildStory(stage, B) {
  // placeholder set so the film builds during planning
  const scene = new THREE.Scene();
  skyGradient(scene, [[0, '#7fb6e8'], [0.55, '#cfe6f2'], [1, '#f6e7c8']]);
  sunlight(scene, { dir: [-6, 9, 6], area: 8 });
  scene.add(mesh(new THREE.CircleGeometry(30, 48), toon('#8cc263', 3), { rot: [-Math.PI / 2, 0, 0] }));
  const ish = cast.ishita(), vih = cast.vihaan();
  ish.root.position.set(-0.45, 0, 0); vih.root.position.set(0.45, 0, 0); scene.add(ish.root, vih.root);
  const sets = { stage: { scene, update: t => { ish.pose({ t, blinkT: t, yaw: 0.3 }); vih.pose({ t, blinkT: t + 1, yaw: -0.3 }); } } };
  const shots = [{ set: 'stage', dur: B.duration, cam: (l, p) => ({ pos: [0, 1.2, 5.5], look: [0, 0.9, 0], fov: 34 }) }];
  const design = [
    { name: 'Ishita', note: 'Lead. Pink kurta, salwar, flowing dupatta, long braid with a pink clip, bindi.', make: () => { const c = cast.ishita(); c.pose({ t: 0.5, smile: 1 }); return c.root; } },
    { name: 'Vihaan', note: 'Lead. Blue checked shirt over a white tee, jeans, backpack, earphones, quiff.', make: () => { const c = cast.vihaan(); c.pose({ t: 0.5 }); return c.root; } },
    { name: 'Zoya', note: "Ishita's roommate & best friend. Lavender kurti, round glasses, high bun.", make: () => { const c = cast.zoya(); c.pose({ t: 0.5, wave: 1, waveT: 0.3 }); return c.root; } },
    { name: 'Dad', note: 'Father. Cream shirt, specs, moustache, greying sides. Strict but loving.', make: () => { const c = cast.appa(); c.pose({ t: 0.5 }); return c.root; } },
    { name: 'Mom', note: 'Mother. Green saree with gold border and pallu, jasmine in a low bun.', make: () => { const c = cast.amma(); c.pose({ t: 0.5 }); return c.root; } },
    { name: "Ishita's phone", note: 'Key object. Her first smartphone; the hotspot icon glows pink when it turns on.', make: () => cast.phone(), float: true, zoom: 0.7 },
  ];
  return { sets, shots, overlay: () => {}, design, designTitle: 'Strangers to Forever · Ep 1 cast', finish: { grain: 0.06, vignette: 0.35, fadeIn: 0.5, fadeOut: 0.8 } };
}
