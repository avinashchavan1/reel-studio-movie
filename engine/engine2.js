// Engine v2: semi-realistic 2D characters (≈3.6 heads tall), cel shading, outfits, gestures, lip-sync.
// Depends on engine.js helpers (rr, ell, ease, clamp, prog, W, H).
const LINE2 = '#3a2530';

function shade(hex, amt) { // amt -1..1 (negative darker)
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function fs2(ctx, fill, lw = 4) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = LINE2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function vgrad(ctx, y0, y1, c, amt = .14) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(c, amt)); g.addColorStop(1, shade(c, -amt)); return g; }
function hgrad(ctx, x0, x1, c, amt = .16) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, shade(c, -amt)); g.addColorStop(.35, c); g.addColorStop(.7, shade(c, amt * .5)); g.addColorStop(1, shade(c, -amt)); return g; }

const CAST2 = {
  ishita: { female: true, skin: '#f0c19c', hair: '#2a1a17', hairStyle: 'braid', eyes: '#5a3420', top: { type: 'kurta', color: '#f28aa6', trim: '#ffd36e' }, bottom: { type: 'salwar', color: '#ffc6d3' },
    shoes: '#8a4b3a', dupatta: '#ffb3c6', bindi: true, earrings: '#ffd36e', clip: '#ff5d8f', height: 1 },
  vihaan: { female: false, skin: '#d29a72', hair: '#1c1311', hairStyle: 'quiff', eyes: '#3d2416', top: { type: 'shirt', color: '#6ea8fe', check: '#cfe2ff', inner: '#ffffff' }, bottom: { type: 'jeans', color: '#3d4f86' },
    shoes: '#f4f4f5', earphones: true, backpack: '#5b6478', stubble: true, height: 1.07 },
  zoya: { female: true, skin: '#f3c9a8', hair: '#5b3424', hairStyle: 'bun', eyes: '#4a2c1c', top: { type: 'kurti', color: '#b69cff', trim: '#fff1a8' }, bottom: { type: 'jeans', color: '#6f8fd8' },
    shoes: '#ffffff', glasses: true, earrings: '#e5e7eb', height: .97 },
  tanvi: { female: true, skin: '#e9b892', hair: '#3a221a', hairStyle: 'twobraids', eyes: '#4a2c1c', top: { type: 'kurti', color: '#7fd6b4', trim: '#ffffff' }, bottom: { type: 'leggings', color: '#f5f5f4' },
    shoes: '#f472b6', phone: true, height: .95 },
  appa: { female: false, skin: '#c98e66', hair: '#2b2220', hairGrey: '#9ca3af', hairStyle: 'side', eyes: '#3d2416', top: { type: 'halfshirt', color: '#f1e3c8', inner: '#f1e3c8' }, bottom: { type: 'trousers', color: '#6b5b4b' },
    shoes: '#3b2a22', moustache: true, specs: true, belly: true, height: 1.08 },
  amma: { female: true, skin: '#d9a07a', hair: '#1f1716', hairStyle: 'bunlow', eyes: '#3d2416', top: { type: 'saree', color: '#3fae7a', trim: '#f5c542' }, bottom: { type: 'none' },
    shoes: '#8a4b3a', bindi: true, bindiColor: '#d61f3c', jasmine: true, earrings: '#f5c542', height: .98 },
};

// pose → [rightShoulder, rightElbow, leftShoulder, leftElbow] (radians; + moves the hand outward)
function poseAngles(pose, t, talk) {
  const w = Math.sin(t * 5.2), w2 = Math.sin(t * 3.1 + 1);
  switch (pose) {
    case 'wave': return [2.55 + Math.sin(t * 10) * .2, .35 * Math.sin(t * 10), .12, .1];
    case 'talk': return [.32 + .08 * w, -1.25 + .35 * w * (0.5 + talk), .12 + .03 * w2, .12];
    case 'hips': return [.72, -1.5, .72, -1.5];
    case 'sad': return [-.02, -.68, -.02, -.68];
    case 'shocked': return [.42, -2.55, .42, -2.55];
    case 'phone': return [.05, -2.05, .12, .1];
    case 'point': return [1.35, -.15, .12, .1];
    case 'heart': return [.25, -2.2, .25, -2.2];
    default: return [.12 + .02 * w2, .1, .12 + .02 * w, .1];
  }
}
function autoPose(emo, talking) {
  if (emo === 'sad') return 'sad'; if (emo === 'shocked') return 'shocked'; if (emo === 'firm' || emo === 'angry') return 'hips';
  if (emo === 'blush') return 'heart'; return talking ? 'talk' : 'idle';
}

function drawArm(ctx, L, side, sx, sy, a1, a2, sleeve, len = 1) {
  const u = 118 * len, f = 108 * len;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(-side * a1);
  // upper arm (sleeve)
  rr(ctx, -17, -6, 34, u + 12, 16); fs2(ctx, sleeve.color ? hgrad(ctx, -17, 17, sleeve.color) : L.skin);
  ctx.translate(0, u); ctx.rotate(-side * a2);
  const sl = sleeve.forearm || 0; // how much of the forearm the sleeve covers (0..1)
  rr(ctx, -14, -8, 28, f + 8, 14); fs2(ctx, L.skin);
  if (sl > 0) { rr(ctx, -16, -10, 32, f * sl + 6, [14, 14, 6, 6]); fs2(ctx, sleeve.color); if (sleeve.cuff) { ctx.fillStyle = sleeve.cuff; ctx.fillRect(-15, f * sl - 6, 30, 8); } }
  // hand
  ctx.translate(0, f + 6);
  ctx.beginPath(); ctx.ellipse(0, 6, 16, 19, 0, 0, Math.PI * 2); fs2(ctx, L.skin, 3.5);
  ctx.beginPath(); ctx.ellipse(side * 13, -2, 6, 10, side * .6, 0, Math.PI * 2); fs2(ctx, L.skin, 3);
  ctx.restore();
}

function hero(ctx, x, y, s, L, o = {}) {
  const t = o.t || 0, ph = o.phase || 0, talk = o.talk || 0, emo = o.emo || 'neutral';
  const pose = o.pose || autoPose(emo, talk > .05);
  const Hh = L.height || 1, breathe = Math.sin(t * 2.1 + ph) * 3;
  const walking = !!o.walking, stride = walking ? Math.sin(t * 8 + ph) : 0;
  const bounce = walking ? -Math.abs(Math.cos(t * 8 + ph)) * 10 : (emo === 'happy' && talk > .05 ? -Math.abs(Math.sin(t * 6)) * 4 : 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.fillStyle = 'rgba(40,20,50,.22)'; ell(ctx, 0, 6, 92, 16); ctx.fill();
  ctx.translate(0, bounce);
  const hipY = -255 * Hh, shY = -432 * Hh + breathe, neckY = -455 * Hh + breathe, headY = -548 * Hh + breathe;
  const shW = (L.female ? 64 : 76) * (L.belly ? 1.05 : 1);
  const top = L.top, bot = L.bottom;

  // ---------- back layers ----------
  if (L.backpack) { rr(ctx, -70, shY + 10, 140, 170, 30); fs2(ctx, vgrad(ctx, shY, shY + 180, L.backpack)); }
  if (L.dupatta) { // tails behind the body
    const sw = Math.sin(t * 2.4 + ph) * 10;
    ctx.beginPath(); ctx.moveTo(-shW + 6, shY + 4); ctx.quadraticCurveTo(-shW - 30 + sw, shY + 200, -shW - 18 + sw * 1.6, shY + 330); ctx.lineTo(-shW + 26 + sw, shY + 320); ctx.quadraticCurveTo(-shW + 10, shY + 160, -shW + 34, shY + 6); ctx.closePath(); fs2(ctx, shade(L.dupatta, -.08));
    ctx.beginPath(); ctx.moveTo(shW - 6, shY + 4); ctx.quadraticCurveTo(shW + 30 - sw, shY + 200, shW + 18 - sw * 1.6, shY + 330); ctx.lineTo(shW - 26 - sw, shY + 320); ctx.quadraticCurveTo(shW - 10, shY + 160, shW - 34, shY + 6); ctx.closePath(); fs2(ctx, shade(L.dupatta, -.08));
  }
  if (L.hairStyle === 'braid' || L.hairStyle === 'long') { // long back hair
    ctx.beginPath(); ctx.moveTo(-84, headY); ctx.quadraticCurveTo(-104, headY + 130, -78, shY + 70); ctx.lineTo(78, shY + 70); ctx.quadraticCurveTo(104, headY + 130, 84, headY); ctx.closePath(); fs2(ctx, L.hair);
  }

  // ---------- legs ----------
  const legX = L.female ? 24 : 28;
  [[-1, stride], [1, -stride]].forEach(([side, sw]) => {
    const ax = side * legX + sw * 22, ay = -8 + (walking ? Math.min(0, sw * side) * 8 : 0);
    if (bot.type === 'salwar') { ctx.beginPath(); ctx.moveTo(side * 6, hipY + 70); ctx.quadraticCurveTo(side * 52 + sw * 10, hipY + 150, ax + side * 18, ay - 34); ctx.lineTo(ax - side * 16, ay - 34); ctx.quadraticCurveTo(side * 14, hipY + 170, side * 2, hipY + 70); ctx.closePath(); fs2(ctx, hgrad(ctx, -60, 60, bot.color, .1));
      rr(ctx, ax - 17, ay - 44, 34, 16, 6); fs2(ctx, shade(bot.color, -.12), 3); }
    else if (bot.type !== 'none') { const c = bot.color; const wdt = bot.type === 'leggings' ? 26 : 34;
      ctx.beginPath(); ctx.moveTo(side * 4, hipY + 20); ctx.lineTo(side * (legX + wdt / 2) + sw * 6, hipY + 30); ctx.lineTo(ax + side * wdt / 2, ay - 26); ctx.lineTo(ax - side * wdt / 2, ay - 26); ctx.closePath(); fs2(ctx, hgrad(ctx, -60, 60, c, .14));
      if (bot.type === 'jeans') { ctx.strokeStyle = shade(c, .25); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(side * (legX - 2), hipY + 50); ctx.lineTo(ax, ay - 30); ctx.stroke(); ctx.setLineDash([]); } }
    else { rr(ctx, ax - 13, ay - 60, 26, 56, 12); fs2(ctx, L.skin); }
    // shoe
    ctx.beginPath(); ctx.ellipse(ax + side * 6, ay - 10, 30, 14, 0, 0, Math.PI * 2); fs2(ctx, L.shoes, 3.5);
    if (L.shoes === '#f4f4f5' || L.shoes === '#ffffff') { ctx.fillStyle = '#d4d4d8'; ctx.fillRect(ax + side * 6 - 28, ay - 6, 56, 4); }
  });

  // ---------- torso / outfit ----------
  if (top.type === 'kurta' || top.type === 'kurti') {
    const hem = top.type === 'kurta' ? -120 * Hh : hipY + 70, flare = top.type === 'kurta' ? 92 : 74;
    ctx.beginPath(); ctx.moveTo(-shW, shY); ctx.quadraticCurveTo(-shW - 6, hipY - 40, -flare, hem); ctx.lineTo(flare, hem); ctx.quadraticCurveTo(shW + 6, hipY - 40, shW, shY);
    ctx.quadraticCurveTo(0, shY - 14, -shW, shY); ctx.closePath(); fs2(ctx, hgrad(ctx, -flare, flare, top.color));
    // side slits + neckline + embroidery
    ctx.strokeStyle = shade(top.color, -.25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-flare + 8, hem); ctx.lineTo(-shW + 2, hipY + 20); ctx.moveTo(flare - 8, hem); ctx.lineTo(shW - 2, hipY + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-26, shY - 6); ctx.quadraticCurveTo(0, shY + 46, 26, shY - 6); fs2(ctx, L.skin, 3);
    ctx.fillStyle = top.trim; for (let i = -4; i <= 4; i++) { const a = i / 4; ell(ctx, a * 28, shY + 4 + (1 - a * a) * 40, 3.5, 3.5); ctx.fill(); }
    for (let xx = -flare + 14; xx < flare - 8; xx += 16) { ell(ctx, xx, hem - 10, 3, 3); ctx.fill(); }
  } else if (top.type === 'shirt' || top.type === 'halfshirt') {
    const hem = hipY + 50, bw = L.belly ? shW + 8 : shW - 8;
    ctx.beginPath(); ctx.moveTo(-shW, shY); ctx.quadraticCurveTo(-shW - 4, hipY - 40, -bw, hem); ctx.lineTo(bw, hem); ctx.quadraticCurveTo(shW + 4, hipY - 40, shW, shY); ctx.quadraticCurveTo(0, shY - 12, -shW, shY); ctx.closePath();
    fs2(ctx, hgrad(ctx, -shW, shW, top.color));
    if (top.check) { ctx.save(); ctx.clip(); ctx.strokeStyle = top.check; ctx.globalAlpha = .55; ctx.lineWidth = 5; for (let xx = -shW; xx < shW; xx += 24) { ctx.beginPath(); ctx.moveTo(xx, shY - 10); ctx.lineTo(xx, hem); ctx.stroke(); } for (let yy = shY; yy < hem; yy += 24) { ctx.beginPath(); ctx.moveTo(-shW - 10, yy); ctx.lineTo(shW + 10, yy); ctx.stroke(); } ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = LINE2; ctx.stroke(); }
    // open collar showing inner tee + placket
    if (top.inner && top.type === 'shirt') { ctx.beginPath(); ctx.moveTo(-22, shY - 4); ctx.lineTo(0, shY + 70); ctx.lineTo(22, shY - 4); ctx.closePath(); fs2(ctx, top.inner, 3); }
    ctx.beginPath(); ctx.moveTo(-30, shY - 8); ctx.lineTo(-6, shY + 36); ctx.lineTo(-38, shY + 18); ctx.closePath(); fs2(ctx, shade(top.color, .15), 3);
    ctx.beginPath(); ctx.moveTo(30, shY - 8); ctx.lineTo(6, shY + 36); ctx.lineTo(38, shY + 18); ctx.closePath(); fs2(ctx, shade(top.color, .15), 3);
    ctx.fillStyle = shade(top.color, -.3); for (let yy = shY + 60; yy < hem - 10; yy += 34) { ell(ctx, 0, yy, 3.5, 3.5); ctx.fill(); }
    if (top.type === 'halfshirt') { ctx.fillStyle = shade(top.color, -.2); rr(ctx, -46, shY + 40, 26, 22, 4); ctx.fill(); ctx.fillStyle = '#2563eb'; ctx.fillRect(-40, shY + 34, 3, 16); }
    // belt
    if (bot.type === 'trousers') { ctx.fillStyle = '#3b2a22'; ctx.fillRect(-bw + 4, hem - 6, bw * 2 - 8, 10); }
  } else if (top.type === 'saree') {
    const c = top.color;
    ctx.beginPath(); ctx.moveTo(-shW, shY); ctx.quadraticCurveTo(-shW - 10, hipY, -86, -20); ctx.lineTo(86, -20); ctx.quadraticCurveTo(shW + 10, hipY, shW, shY); ctx.quadraticCurveTo(0, shY - 12, -shW, shY); ctx.closePath(); fs2(ctx, hgrad(ctx, -86, 86, c));
    ctx.strokeStyle = shade(c, -.22); ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 10, hipY + 30); ctx.lineTo(-40 + i * 16, -24); ctx.stroke(); }
    ctx.fillStyle = top.trim; ctx.fillRect(-84, -36, 168, 12);
    // pallu across the chest
    const sw = Math.sin(t * 2 + ph) * 6;
    ctx.beginPath(); ctx.moveTo(-shW + 4, hipY + 10); ctx.lineTo(shW - 4, shY - 6); ctx.lineTo(shW + 22 + sw, shY + 240); ctx.lineTo(shW - 18 + sw, shY + 250); ctx.lineTo(shW - 24, shY + 50); ctx.lineTo(-shW + 30, hipY + 44); ctx.closePath(); fs2(ctx, shade(c, .08));
    ctx.strokeStyle = top.trim; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-shW + 10, hipY + 18); ctx.lineTo(shW - 2, shY + 2); ctx.stroke();
  }
  if (L.dupatta) { // front drape (U across the chest)
    ctx.beginPath(); ctx.moveTo(-shW - 4, shY - 2); ctx.quadraticCurveTo(0, shY + 98, shW + 4, shY - 2); ctx.lineTo(shW - 14, shY + 20); ctx.quadraticCurveTo(0, shY + 70, -shW + 14, shY + 20); ctx.closePath(); fs2(ctx, L.dupatta, 3.5);
    ctx.strokeStyle = shade(L.dupatta, -.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-shW + 20, shY + 18); ctx.quadraticCurveTo(0, shY + 74, shW - 20, shY + 18); ctx.stroke();
  }
  if (L.backpack) { ctx.strokeStyle = shade(L.backpack, -.2); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-shW + 18, shY - 4); ctx.lineTo(-shW + 26, hipY - 10); ctx.moveTo(shW - 18, shY - 4); ctx.lineTo(shW - 26, hipY - 10); ctx.stroke(); }

  // ---------- neck ----------
  rr(ctx, -16, neckY - 30, 32, 52, 10); fs2(ctx, L.skin, 3.5);
  ctx.fillStyle = 'rgba(120,60,40,.18)'; ctx.fillRect(-15, neckY - 28, 30, 16);
  if (L.earphones) { ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, shY - 10); ctx.quadraticCurveTo(-18, shY + 40, -8, shY + 70); ctx.moveTo(26, shY - 10); ctx.quadraticCurveTo(18, shY + 40, 8, shY + 70); ctx.stroke(); ell(ctx, -8, shY + 72, 6, 6); fs2(ctx, '#fff', 2.5); ell(ctx, 8, shY + 72, 6, 6); fs2(ctx, '#fff', 2.5); }

  // ---------- arms ----------
  const [r1, r2, l1, l2] = poseAngles(pose, t + ph, talk);
  const sleeve = top.type === 'kurta' || top.type === 'kurti' ? { color: top.color, forearm: .45, cuff: top.trim } : top.type === 'shirt' ? { color: top.color, forearm: .2, cuff: shade(top.color, .2) } : top.type === 'saree' ? { color: top.color, forearm: 0 } : { color: top.color, forearm: 0 };
  drawArm(ctx, L, -1, -shW + 6, shY + 10, l1, l2, sleeve);
  drawArm(ctx, L, 1, shW - 6, shY + 10, r1, r2, sleeve);
  if (pose === 'phone') { ctx.save(); ctx.translate(shW - 30, shY + 110); rr(ctx, -22, -40, 44, 76, 9); fs2(ctx, '#27272a', 3.5); ctx.fillStyle = '#93c5fd'; ctx.fillRect(-17, -34, 34, 62); ctx.restore(); }

  // braid in front over the left shoulder
  if (L.hairStyle === 'braid') { const sw = Math.sin(t * 2 + ph) * 4; for (let i = 0; i < 8; i++) { const yy = headY + 70 + i * 34; ctx.beginPath(); ctx.ellipse(-44 + i * 1.5 + sw * i / 8, yy, 16 - i * .8, 21, (i % 2 ? .35 : -.35), 0, Math.PI * 2); fs2(ctx, i % 2 ? L.hair : shade(L.hair, .12), 3); } ctx.beginPath(); ctx.ellipse(-33 + sw, headY + 348, 10, 8, 0, 0, Math.PI * 2); fs2(ctx, L.clip || '#ff5d8f', 2.5); }
  if (L.hairStyle === 'twobraids') { [-1, 1].forEach(sd => { for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(sd * (78 - i * 2), headY + 60 + i * 28, 13, 17, sd * .3, 0, Math.PI * 2); fs2(ctx, L.hair, 3); } ell(ctx, sd * 70, headY + 205, 8, 8); fs2(ctx, '#f472b6', 2.5); }); }

  // ---------- head ----------
  const tilt = (emo === 'sad' ? -.07 : 0) + (talk > .05 ? Math.sin(t * 4.3) * .035 : Math.sin(t * .9 + ph) * .02) + (o.tilt || 0);
  ctx.save(); ctx.translate(0, headY); ctx.rotate(tilt); if (emo === 'sad') ctx.translate(0, 8);
  drawHead(ctx, L, t + ph, emo, talk, o.look || 0);
  ctx.restore();
  ctx.restore();
}

function drawHead(ctx, L, t, emo, talk, look) {
  const hc = L.hair;
  // hair volume behind the face
  if (L.hairStyle === 'bun' || L.hairStyle === 'bunlow') { const by = L.hairStyle === 'bun' ? -110 : -40, bx = L.hairStyle === 'bun' ? 0 : 60; ell(ctx, bx, by, 40, 36); fs2(ctx, hc);
    if (L.jasmine) { ctx.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { ell(ctx, bx - 30 + i * 10, by + 26 + Math.sin(i) * 4, 6, 6); ctx.fill(); } } }
  ctx.beginPath(); ctx.ellipse(0, -10, 88, 92, 0, Math.PI * .95, Math.PI * 2.05); fs2(ctx, hc);
  // ears
  [-1, 1].forEach(sd => { ell(ctx, sd * 76, 14, 12, 18); fs2(ctx, L.skin, 3); if (L.earrings) { ell(ctx, sd * 76, 38, 5, 5); fs2(ctx, L.earrings, 2); } });
  // face shape
  ctx.beginPath(); ctx.moveTo(-76, -6); ctx.arc(0, -6, 76, Math.PI, 0); ctx.bezierCurveTo(76, 48, 46, 92, 0, L.female ? 94 : 98); ctx.bezierCurveTo(-46, 92, -76, 48, -76, -6); ctx.closePath();
  const g = ctx.createRadialGradient(-14, 6, 10, 0, 10, 100); g.addColorStop(0, shade(L.skin, .1)); g.addColorStop(1, shade(L.skin, -.08)); fs2(ctx, g);
  if (L.stubble) { ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(60,40,30,.12)'; ell(ctx, 0, 78, 52, 30); ctx.fill(); ctx.restore(); }
  // eyes
  const blink = ((t * 1.0) % 3.6) < .12, ex = 30, ey = 12, lookX = look * 4;
  [-1, 1].forEach(sd => {
    ctx.save(); ctx.translate(sd * ex, ey);
    if (blink || (emo === 'happy' && talk < .05 && ((t % 5) > 3.2))) { ctx.beginPath(); ctx.moveTo(-15, 0); ctx.quadraticCurveTo(0, emo === 'happy' ? -8 : 6, 15, 0); ctx.lineWidth = 4.5; ctx.strokeStyle = LINE2; ctx.stroke(); ctx.restore(); return; }
    const oh = emo === 'shocked' ? 1.25 : emo === 'sad' ? .85 : 1;
    ctx.beginPath(); ctx.moveTo(-17, 2); ctx.quadraticCurveTo(-2, -20 * oh, 17, -1); ctx.quadraticCurveTo(2, 14 * oh, -17, 2); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.save(); ctx.clip();
    const ig = ctx.createRadialGradient(lookX, 0, 2, lookX, 0, 12); ig.addColorStop(0, shade(L.eyes, .25)); ig.addColorStop(1, shade(L.eyes, -.35));
    ell(ctx, lookX, -1, 11.5, 12.5 * oh); ctx.fillStyle = ig; ctx.fill(); ell(ctx, lookX, -1, 5.5, 6); ctx.fillStyle = '#120a08'; ctx.fill();
    ctx.fillStyle = '#fff'; ell(ctx, lookX + 4, -6, 3.5, 3.5); ctx.fill(); ell(ctx, lookX - 3, 4, 1.8, 1.8); ctx.fill();
    ctx.restore();
    // upper lid + lashes
    ctx.beginPath(); ctx.moveTo(-18, 2); ctx.quadraticCurveTo(-2, -21 * oh, 18, -1); ctx.lineWidth = L.female ? 5 : 4; ctx.strokeStyle = LINE2; ctx.stroke();
    if (L.female) { ctx.beginPath(); ctx.moveTo(sd > 0 ? 16 : -16, sd > 0 ? -2 : 1); ctx.lineTo(sd > 0 ? 23 : -23, -7); ctx.lineWidth = 3.5; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-12, 9 * oh); ctx.quadraticCurveTo(0, 13 * oh, 12, 8 * oh); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(58,37,48,.5)'; ctx.stroke();
    ctx.restore();
  });
  // brows
  [-1, 1].forEach(sd => {
    const lift = emo === 'shocked' ? -10 : emo === 'sad' ? (sd > 0 ? 4 : 4) : 0;
    const inner = emo === 'sad' ? -8 : (emo === 'firm' || emo === 'angry') ? 8 : 0;
    ctx.beginPath(); ctx.moveTo(sd * 14, -16 + lift + inner); ctx.quadraticCurveTo(sd * 30, -26 + lift, sd * 46, -18 + lift);
    ctx.lineWidth = L.female ? 4.5 : 7; ctx.strokeStyle = shade(L.hair, .05); ctx.stroke();
  });
  // nose
  ctx.beginPath(); ctx.moveTo(-2, 30); ctx.quadraticCurveTo(-8, 46, 2, 48); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,60,40,.55)'; ctx.stroke();
  // blush
  ctx.fillStyle = emo === 'blush' ? 'rgba(255,90,120,.45)' : 'rgba(255,120,140,.22)'; ell(ctx, -44, 42, 16, 9); ctx.fill(); ell(ctx, 44, 42, 16, 9); ctx.fill();
  // mouth (lip-sync)
  const my = 66;
  if (talk > .06) {
    const h = 5 + talk * 18, w = 15 - talk * 3;
    ctx.beginPath(); ctx.ellipse(0, my, w, h / 2, 0, 0, Math.PI * 2); ctx.fillStyle = '#6b1f33'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-w, my - h / 2, w * 2, Math.min(5, h * .3)); ctx.fillStyle = '#e46a7e'; ell(ctx, 0, my + h * .35, w * .7, h * .3); ctx.fill(); ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = L.female ? '#b4475e' : LINE2; ctx.beginPath(); ctx.ellipse(0, my, w, h / 2, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.lineWidth = 3.5; ctx.strokeStyle = L.female ? '#b4475e' : LINE2; ctx.beginPath();
    if (emo === 'sad') { ctx.moveTo(-12, my + 4); ctx.quadraticCurveTo(0, my - 4, 12, my + 4); }
    else if (emo === 'shocked') { ctx.ellipse(0, my, 7, 9, 0, 0, Math.PI * 2); }
    else if (emo === 'firm' || emo === 'angry') { ctx.moveTo(-12, my); ctx.lineTo(12, my); }
    else if (emo === 'happy' || emo === 'blush') { ctx.moveTo(-15, my - 2); ctx.quadraticCurveTo(0, my + 14, 15, my - 2); }
    else { ctx.moveTo(-11, my); ctx.quadraticCurveTo(0, my + 6, 11, my); }
    ctx.stroke();
    if (L.female && emo !== 'shocked') { ctx.fillStyle = 'rgba(214,80,110,.35)'; ell(ctx, 0, my + 5, 8, 3); ctx.fill(); }
  }
  if (L.moustache) { ctx.beginPath(); ctx.moveTo(-26, 58); ctx.quadraticCurveTo(-12, 46, 0, 54); ctx.quadraticCurveTo(12, 46, 26, 58); ctx.quadraticCurveTo(12, 56, 0, 58); ctx.quadraticCurveTo(-12, 56, -26, 58); fs2(ctx, '#2b2220', 2); }
  if (L.bindi) { ell(ctx, 0, -14, 4.5, 4.5); ctx.fillStyle = L.bindiColor || '#9f1239'; ctx.fill(); }
  // glasses / specs
  if (L.glasses || L.specs) { ctx.lineWidth = L.specs ? 3.5 : 4.5; ctx.strokeStyle = L.specs ? '#57534e' : '#1f1f1f'; [-1, 1].forEach(sd => { ctx.beginPath(); if (L.specs) ctx.roundRect(sd * 30 - 22, -4, 44, 30, 8); else ctx.arc(sd * 30, 10, 24, 0, Math.PI * 2); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(0, 2, 8, 8); ctx.stroke(); }
  // front hair
  ctx.beginPath();
  if (L.hairStyle === 'quiff') {
    ctx.moveTo(-82, 18); ctx.bezierCurveTo(-92, -70, -40, -112, 10, -108); ctx.bezierCurveTo(60, -104, 92, -60, 82, 16);
    ctx.lineTo(70, -20); ctx.lineTo(54, -2); ctx.lineTo(44, -34); ctx.lineTo(22, -14); ctx.lineTo(10, -40); ctx.lineTo(-10, -18); ctx.lineTo(-28, -38); ctx.lineTo(-44, -12); ctx.lineTo(-62, -30); ctx.closePath(); fs2(ctx, hc);
    ctx.beginPath(); ctx.moveTo(-10, -104); ctx.quadraticCurveTo(20, -150, 50, -124); ctx.quadraticCurveTo(30, -120, 22, -100); fs2(ctx, hc);
  } else if (L.hairStyle === 'side') {
    ctx.moveTo(-80, 14); ctx.bezierCurveTo(-90, -70, -30, -104, 14, -100); ctx.bezierCurveTo(64, -96, 90, -56, 80, 14); ctx.lineTo(70, -26); ctx.quadraticCurveTo(10, -50, -40, -30); ctx.quadraticCurveTo(-62, -18, -70, -6); ctx.closePath(); fs2(ctx, hc);
    if (L.hairGrey) { ctx.fillStyle = L.hairGrey; ell(ctx, -76, -4, 7, 16); ctx.fill(); ell(ctx, 76, -4, 7, 16); ctx.fill(); }
  } else {
    // female: centre/side parting with soft fringe framing the face
    ctx.moveTo(-84, 30); ctx.bezierCurveTo(-94, -64, -40, -104, 2, -102); ctx.bezierCurveTo(48, -100, 94, -64, 84, 30);
    ctx.quadraticCurveTo(70, -28, 30, -50); ctx.quadraticCurveTo(6, -40, -2, -60); ctx.quadraticCurveTo(-30, -36, -62, -26); ctx.quadraticCurveTo(-76, -6, -84, 30); ctx.closePath(); fs2(ctx, hc);
  }
  ctx.strokeStyle = shade(hc, .35); ctx.lineWidth = 5; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(-6, -30, 62, Math.PI * 1.2, Math.PI * 1.5); ctx.stroke(); ctx.globalAlpha = 1;
  if (L.clip && L.hairStyle === 'braid') { rr(ctx, 40, -66, 30, 12, 6); fs2(ctx, L.clip, 2.5); }
}
