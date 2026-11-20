// Engine v3 characters: young-adult proportions (~6 heads), detailed faces, hair locks, real clothes, cel shading.
// hero3(ctx, x, y, s, L, o): (x, y) = point between the feet. Units: Ishita ≈ 960 tall at s = 1.
// o: { t, emo: neutral|happy|sad|shocked|firm|blush|angry, talk 0..1, look -1..1, pose: idle|talk|wave|hips|sad|shocked|phone, tilt, walking }
const INK3 = '#3b2420';

function sh3(hex, amt) { // shade hex colour: amt -1..1
  const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function P(ctx, pts, close = true) { // smooth path through points using quadratic midpoints
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); if (close) ctx.closePath();
}
function F3(ctx, fill, lw = 3, ink = INK3) { ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); } }
function shadeIn(ctx, clipPath, fn) { ctx.save(); clipPath(); ctx.clip(); fn(); ctx.restore(); }

const CAST3 = {
  ishita: { female: true, H: 960, skin: '#f1c3a1', skinSh: '#d99a7e', hair: '#2b1814', hairHi: '#6b4434', eyes: '#5a3420', lips: '#c4566b',
    style: 'braid', kurta: '#ef7f9e', kurtaSh: '#c95c7b', trim: '#f7c948', salwar: '#fbd3dd', dupatta: '#ffb8cb', shoes: '#9a4a2f', bindi: '#a3123a', earrings: '#f7c948', clip: '#ff4f86', bangles: '#f7c948' },
  vihaan: { female: false, H: 1010, skin: '#d29a72', skinSh: '#a8714f', hair: '#1b1210', hairHi: '#4a3328', eyes: '#3a2416', lips: '#a8605a',
    style: 'quiff', shirt: '#4b86e8', shirtSh: '#2f63bd', plaid: '#bcd5ff', tee: '#ffffff', jeans: '#2f4277', jeansSh: '#1f2d55', shoes: '#f4f4f5', bag: '#59627a', earphones: true },
};

// arm angles: [shoulder, elbow] per side, + = hand moves outward
function pose3(pose, t, talk) {
  const w = Math.sin(t * 5.2), w2 = Math.sin(t * 3.1 + 1);
  switch (pose) {
    case 'wave': return { R: [2.7 + Math.sin(t * 10) * .18, .45 + .3 * Math.sin(t * 10)], L: [.1, .15] };
    case 'talk': return { R: [.28 + .06 * w, -1.25 + .3 * w * (.5 + talk)], L: [.1 + .02 * w2, .12] };
    case 'hips': return { R: [.75, -1.55], L: [.75, -1.55] };
    case 'sad': return { R: [-.04, -.75], L: [-.04, -.75] };
    case 'shocked': return { R: [.4, -2.6], L: [.4, -2.6] };
    case 'phone': return { R: [.02, -2.0], L: [.1, .12] };
    default: return { R: [.09 + .015 * w2, .1], L: [.09 + .015 * w, .1] };
  }
}

function hero3(ctx, x, y, s, L, o = {}) {
  const t = o.t || 0, emo = o.emo || 'neutral', talk = o.talk || 0, look = o.look || 0;
  const pose = o.pose || (emo === 'sad' ? 'sad' : emo === 'shocked' ? 'shocked' : emo === 'firm' ? 'hips' : talk > .05 ? 'talk' : 'idle');
  const H = L.H, k = H / 960, fem = L.female;
  const breathe = Math.sin(t * 2.1 + (o.phase || 0)) * 2.5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.fillStyle = 'rgba(40,20,40,.2)'; ctx.beginPath(); ctx.ellipse(0, 4, 95 * k, 16, 0, 0, 7); ctx.fill();
  // vertical landmarks
  const nk = fem ? 0 : 12 * k;
  const Y = { chin: -800 * k, neckB: -768 * k + breathe - nk, sh: -755 * k + breathe - nk, chest: -690 * k + breathe, waist: -615 * k + breathe * .5, hip: -555 * k, knee: -290 * k, ankle: -42 * k };
  const shW = (fem ? 66 : 84) * k, waW = (fem ? 46 : 62) * k, hiW = (fem ? 64 : 64) * k;
  const arms = pose3(pose, t + (o.phase || 0), talk);

  // ---------- back layers: back hair, dupatta tails, backpack ----------
  if (L.style === 'braid') { // long hair falling behind the shoulders
    ctx.beginPath(); ctx.moveTo(-60 * k, -905 * k); ctx.bezierCurveTo(-92 * k, -820 * k, -96 * k, -760 * k, -84 * k, -690 * k);
    ctx.lineTo(84 * k, -690 * k); ctx.bezierCurveTo(96 * k, -760 * k, 92 * k, -820 * k, 60 * k, -905 * k); ctx.closePath(); F3(ctx, L.hair);
  }
  if (L.dupatta) {
    const sw = Math.sin(t * 2.2) * 6;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * (shW - 6), Y.sh - 4); ctx.bezierCurveTo(sd * (shW + 22 + sw), Y.sh + 120, sd * (shW + 26 + sw), Y.sh + 260, sd * (shW + 16 + sw * 1.4), Y.sh + 380);
      ctx.lineTo(sd * (shW - 34 + sw), Y.sh + 366); ctx.bezierCurveTo(sd * (shW - 26), Y.sh + 250, sd * (shW - 30), Y.sh + 110, sd * (shW - 40), Y.sh + 6); ctx.closePath();
      ctx.globalAlpha = .92; F3(ctx, sh3(L.dupatta, -.08), 2.5); ctx.globalAlpha = 1; }
  }
  if (L.bag) { ctx.beginPath(); ctx.roundRect(-74 * k, Y.sh + 8, 148 * k, 200 * k, 34 * k); F3(ctx, L.bag); }

  // ---------- legs ----------
  const step = o.walking ? Math.sin(t * 8) : 0;
  if (fem) { // salwar: loose, gathered at the ankle
    for (const sd of [-1, 1]) { const ax = sd * 26 * k + sd * step * 16;
      ctx.beginPath(); ctx.moveTo(sd * 4, Y.hip + 20); ctx.bezierCurveTo(sd * 66 * k, Y.hip + 130, sd * 54 * k, Y.knee + 120, ax + sd * 22 * k, Y.ankle - 26);
      ctx.lineTo(ax - sd * 20 * k, Y.ankle - 26); ctx.bezierCurveTo(sd * 10 * k, Y.knee + 80, sd * 2, Y.hip + 160, sd * 2, Y.hip + 20); ctx.closePath(); F3(ctx, L.salwar, 2.5);
      ctx.strokeStyle = sh3(L.salwar, -.18); ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(ax - sd * (14 - i * 12) * k, Y.ankle - 30); ctx.quadraticCurveTo(ax - sd * (10 - i * 12) * k, Y.ankle - 90, ax - sd * (18 - i * 14) * k, Y.ankle - 150); ctx.stroke(); }
      ctx.beginPath(); ctx.roundRect(ax - 21 * k, Y.ankle - 34, 42 * k, 16, 6); F3(ctx, sh3(L.salwar, -.1), 2.5);
      // ankle + jutti (pointed shoe)
      ctx.beginPath(); ctx.roundRect(ax - 9 * k, Y.ankle - 22, 18 * k, Y.ankle * -1 - 2, 6); F3(ctx, L.skin, 2);
      ctx.beginPath(); ctx.moveTo(ax - 22 * k, -6); ctx.quadraticCurveTo(ax - 18 * k, -26, ax, -26); ctx.quadraticCurveTo(ax + sd * 30 * k, -24, ax + sd * 40 * k, -12); ctx.quadraticCurveTo(ax + sd * 20 * k, 0, ax - 22 * k, -6); ctx.closePath(); F3(ctx, L.shoes, 2.5);
      ctx.fillStyle = L.trim; ctx.fillRect(ax - 10 * k, -20, 22 * k, 3); }
  } else { // jeans + sneakers
    for (const sd of [-1, 1]) { const ax = sd * 30 * k + sd * step * 18;
      ctx.beginPath(); ctx.moveTo(sd * 2, Y.hip + 10); ctx.lineTo(sd * (hiW + 4), Y.hip + 20); ctx.bezierCurveTo(sd * (hiW - 2), Y.knee, ax + sd * 30 * k, Y.knee + 60, ax + sd * 26 * k, Y.ankle - 10);
      ctx.lineTo(ax - sd * 24 * k, Y.ankle - 10); ctx.bezierCurveTo(ax - sd * 22 * k, Y.knee + 60, sd * 8, Y.knee, sd * 2, Y.hip + 60); ctx.closePath();
      const g = ctx.createLinearGradient(sd * 0, 0, sd * (hiW + 10), 0); g.addColorStop(0, L.jeans); g.addColorStop(1, L.jeansSh); F3(ctx, g, 2.5);
      ctx.strokeStyle = '#d7a64b'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(sd * (hiW - 4), Y.hip + 30); ctx.bezierCurveTo(sd * (hiW - 10), Y.knee, ax + sd * 22 * k, Y.knee + 70, ax + sd * 20 * k, Y.ankle - 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = sh3(L.jeans, -.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax - sd * 10 * k, Y.knee + 20); ctx.quadraticCurveTo(ax, Y.knee + 34, ax + sd * 16 * k, Y.knee + 18); ctx.stroke();
      // sneaker
      ctx.beginPath(); ctx.moveTo(ax - 28 * k, -4); ctx.lineTo(ax - 28 * k, -30); ctx.quadraticCurveTo(ax - 10 * k, -44, ax + sd * 10 * k, -38); ctx.quadraticCurveTo(ax + sd * 44 * k, -26, ax + sd * 46 * k, -4); ctx.closePath(); F3(ctx, L.shoes, 2.5);
      ctx.fillStyle = '#cfd4dc'; ctx.fillRect(ax - 28 * k, -10, 74 * k * sd > 0 ? 74 * k : 74 * k, 6); ctx.fillStyle = L.shirt; ctx.beginPath(); ctx.arc(ax + sd * 8 * k, -24, 5, 0, 7); ctx.fill(); }
  }

  // ---------- torso + clothes ----------
  if (fem) { // kurta: fitted bodice, flared skirt to the knee, side slits, embroidered neckline + hem
    const hem = -360 * k, flare = 104 * k;
    const body = () => { ctx.beginPath(); ctx.moveTo(-shW, Y.sh); ctx.bezierCurveTo(-shW - 4, Y.chest, -waW - 6, Y.waist - 30, -waW, Y.waist); ctx.bezierCurveTo(-waW - 10, Y.hip, -flare + 10, hem + 80, -flare, hem);
      ctx.quadraticCurveTo(0, hem + 14, flare, hem); ctx.bezierCurveTo(flare - 10, hem + 80, waW + 10, Y.hip, waW, Y.waist); ctx.bezierCurveTo(waW + 6, Y.waist - 30, shW + 4, Y.chest, shW, Y.sh); ctx.quadraticCurveTo(0, Y.sh - 16, -shW, Y.sh); ctx.closePath(); };
    body(); F3(ctx, L.kurta);
    shadeIn(ctx, body, () => { // cel shadow: right side + under the bust + fold shadows
      ctx.fillStyle = L.kurtaSh; ctx.beginPath(); ctx.moveTo(shW * .55, Y.sh); ctx.bezierCurveTo(shW * .5, Y.waist, waW * .7, Y.hip, flare * .7, hem + 10); ctx.lineTo(flare + 20, hem + 20); ctx.lineTo(shW + 20, Y.sh - 20); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = .55; for (const fx of [-.55, -.15, .3]) { ctx.beginPath(); ctx.moveTo(fx * waW, Y.waist + 20); ctx.quadraticCurveTo(fx * flare * 1.1, Y.hip + 80, fx * flare * 1.25, hem + 6); ctx.lineTo(fx * flare * 1.25 + 14, hem + 6); ctx.quadraticCurveTo(fx * flare + 10, Y.hip + 80, fx * waW + 6, Y.waist + 20); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-shW * .45, Y.chest, 14 * k, 40 * k, -.2, 0, 7); ctx.fill(); // sheen
      // hem embroidery band
      ctx.fillStyle = L.trim; ctx.beginPath(); ctx.moveTo(-flare - 10, hem - 26); ctx.quadraticCurveTo(0, hem - 12, flare + 10, hem - 26); ctx.lineTo(flare + 10, hem + 20); ctx.lineTo(-flare - 10, hem + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = L.kurta; for (let xx = -flare; xx < flare; xx += 22 * k) { ctx.beginPath(); ctx.arc(xx, hem - 12 + Math.abs(xx) * .02, 4.5 * k, 0, 7); ctx.fill(); }
    });
    ctx.strokeStyle = INK3; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-flare + 6, hem + 4); ctx.lineTo(-waW - 6, Y.hip - 4); ctx.moveTo(flare - 6, hem + 4); ctx.lineTo(waW + 6, Y.hip - 4); ctx.stroke(); // side slits
    // neckline with embroidery
    ctx.beginPath(); ctx.moveTo(-24 * k, Y.sh - 8); ctx.quadraticCurveTo(0, Y.sh + 44 * k, 24 * k, Y.sh - 8); F3(ctx, L.skin, 2.5);
    ctx.strokeStyle = L.trim; ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.moveTo(-28 * k, Y.sh - 6); ctx.quadraticCurveTo(0, Y.sh + 52 * k, 28 * k, Y.sh - 6); ctx.stroke();
    ctx.fillStyle = L.trim; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, Y.sh + 62 * k + i * 16 * k, 3.5 * k, 0, 7); ctx.fill(); }
  } else { // shirt over tee, plaid, collar, placket
    const hem = Y.hip + 46 * k;
    const body = () => { ctx.beginPath(); ctx.moveTo(-shW, Y.sh); ctx.bezierCurveTo(-shW - 2, Y.chest, -waW - 4, Y.waist, -waW - 2, hem); ctx.lineTo(waW + 2, hem); ctx.bezierCurveTo(waW + 4, Y.waist, shW + 2, Y.chest, shW, Y.sh); ctx.quadraticCurveTo(0, Y.sh - 14, -shW, Y.sh); ctx.closePath(); };
    body(); F3(ctx, L.shirt);
    shadeIn(ctx, body, () => {
      ctx.strokeStyle = L.plaid; ctx.globalAlpha = .55; ctx.lineWidth = 7 * k; for (let xx = -shW; xx < shW; xx += 30 * k) { ctx.beginPath(); ctx.moveTo(xx, Y.sh - 20); ctx.lineTo(xx, hem + 10); ctx.stroke(); }
      for (let yy = Y.sh; yy < hem; yy += 30 * k) { ctx.beginPath(); ctx.moveTo(-shW - 10, yy); ctx.lineTo(shW + 10, yy); ctx.stroke(); }
      ctx.globalAlpha = .3; ctx.lineWidth = 2.5 * k; ctx.strokeStyle = '#ffffff'; for (let xx = -shW + 15 * k; xx < shW; xx += 30 * k) { ctx.beginPath(); ctx.moveTo(xx, Y.sh - 20); ctx.lineTo(xx, hem + 10); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.fillStyle = L.shirtSh; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(shW * .5, Y.sh); ctx.bezierCurveTo(shW * .45, Y.waist, waW * .6, hem, waW * .55, hem + 10); ctx.lineTo(shW + 20, hem + 10); ctx.lineTo(shW + 20, Y.sh - 20); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    });
    // open collar: tee showing, collar flaps, placket buttons
    ctx.beginPath(); ctx.moveTo(-22 * k, Y.sh - 6); ctx.lineTo(0, Y.sh + 86 * k); ctx.lineTo(22 * k, Y.sh - 6); ctx.closePath(); F3(ctx, L.tee, 2.5);
    ctx.beginPath(); ctx.moveTo(-17 * k, Y.sh - 6); ctx.quadraticCurveTo(0, Y.sh + 16 * k, 17 * k, Y.sh - 6); F3(ctx, L.skin, 2);
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 36 * k, Y.sh - 12); ctx.lineTo(sd * 6 * k, Y.sh + 50 * k); ctx.lineTo(sd * 46 * k, Y.sh + 26 * k); ctx.closePath(); F3(ctx, sh3(L.shirt, .12), 2.5); }
    ctx.strokeStyle = INK3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3 * k, Y.sh + 86 * k); ctx.lineTo(3 * k, hem); ctx.stroke();
    ctx.fillStyle = '#f1f5f9'; for (let yy = Y.sh + 110 * k; yy < hem - 10; yy += 44 * k) { ctx.beginPath(); ctx.arc(10 * k, yy, 4 * k, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.roundRect(-46 * k, Y.chest - 10, 30 * k, 26 * k, 4); F3(ctx, sh3(L.shirt, .06), 2); // pocket
    if (L.bag) { ctx.strokeStyle = sh3(L.bag, -.25); ctx.lineWidth = 11 * k; ctx.beginPath(); ctx.moveTo(-shW + 16 * k, Y.sh - 2); ctx.quadraticCurveTo(-shW + 12 * k, Y.chest, -shW + 22 * k, Y.waist); ctx.moveTo(shW - 16 * k, Y.sh - 2); ctx.quadraticCurveTo(shW - 12 * k, Y.chest, shW - 22 * k, Y.waist); ctx.stroke(); }
  }
  if (L.dupatta) { // front drape: soft U over the chest with folds and a border
    const d = () => { ctx.beginPath(); ctx.moveTo(-shW - 6, Y.sh - 6); ctx.bezierCurveTo(-shW + 6, Y.chest + 70, shW - 6, Y.chest + 70, shW + 6, Y.sh - 6); ctx.lineTo(shW - 22, Y.sh + 14); ctx.bezierCurveTo(shW - 30, Y.chest + 30, -shW + 30, Y.chest + 30, -shW + 22, Y.sh + 14); ctx.closePath(); };
    ctx.globalAlpha = .93; d(); F3(ctx, L.dupatta, 2.5); ctx.globalAlpha = 1;
    shadeIn(ctx, d, () => { ctx.strokeStyle = sh3(L.dupatta, -.2); ctx.lineWidth = 2; for (const f of [.3, .55]) { ctx.beginPath(); ctx.moveTo(-shW + 20, Y.sh + 10 + f * 30); ctx.bezierCurveTo(-shW * .5, Y.chest + f * 70, shW * .5, Y.chest + f * 70, shW - 20, Y.sh + 10 + f * 30); ctx.stroke(); }
      ctx.strokeStyle = L.trim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-shW - 6, Y.sh - 2); ctx.bezierCurveTo(-shW + 6, Y.chest + 66, shW - 6, Y.chest + 66, shW + 6, Y.sh - 2); ctx.stroke(); });
  }

  // ---------- neck ----------
  ctx.beginPath(); ctx.moveTo(-15 * k, Y.chin + 4); ctx.lineTo(-17 * k, Y.neckB + 6); ctx.lineTo(17 * k, Y.neckB + 6); ctx.lineTo(15 * k, Y.chin + 4); ctx.closePath(); F3(ctx, L.skin, 2.5);
  ctx.fillStyle = L.skinSh; ctx.beginPath(); ctx.moveTo(-16 * k, Y.chin + 2); ctx.quadraticCurveTo(0, Y.chin + 26 * k, 16 * k, Y.chin + 2); ctx.closePath(); ctx.fill();
  if (L.earphones) { ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-22 * k, Y.neckB); ctx.quadraticCurveTo(-14 * k, Y.sh + 60 * k, -6 * k, Y.sh + 100 * k); ctx.moveTo(22 * k, Y.neckB); ctx.quadraticCurveTo(14 * k, Y.sh + 60 * k, 6 * k, Y.sh + 100 * k); ctx.stroke(); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 6 * k, Y.sh + 104 * k, 5.5, 0, 7); F3(ctx, '#fff', 2); } }

  // ---------- arms ----------
  const sleeve = fem ? { c: L.kurta, len: .62, cuff: L.trim } : { c: L.shirt, len: .2, cuff: sh3(L.shirt, .2), rolled: true };
  for (const [sd, key] of [[-1, 'L'], [1, 'R']]) arm3(ctx, L, sd, sd * (shW - 8 * k), Y.sh + 10, arms[key][0], arms[key][1], sleeve, k);
  if (pose === 'phone') { ctx.save(); ctx.translate((shW - 30 * k), Y.chest + 40 * k); ctx.rotate(-.1); ctx.beginPath(); ctx.roundRect(-20 * k, -38 * k, 40 * k, 76 * k, 8); F3(ctx, '#232326', 2.5); ctx.fillStyle = '#9fd3ff'; ctx.fillRect(-16 * k, -32 * k, 32 * k, 62 * k); ctx.restore(); }

  // braid over the shoulder (in front)
  if (L.style === 'braid') { const sw = Math.sin(t * 2) * 3;
    for (let i = 0; i < 7; i++) { const yy = -790 * k + i * 30 * k, xx = -46 * k + i * 1.6 * k + sw * i / 7;
      ctx.beginPath(); ctx.ellipse(xx, yy, (16 - i * .7) * k, 19 * k, i % 2 ? .45 : -.45, 0, 7); F3(ctx, i % 2 ? L.hair : sh3(L.hair, .12), 2.2);
      ctx.strokeStyle = L.hairHi; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(xx, yy - 4, (10 - i * .5) * k, 9 * k, i % 2 ? .45 : -.45, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(-36 * k + sw, -592 * k, 9 * k, 7 * k, 0, 0, 7); F3(ctx, L.clip, 2);
    ctx.beginPath(); ctx.moveTo(-44 * k + sw, -588 * k); ctx.quadraticCurveTo(-36 * k + sw, -548 * k, -28 * k + sw, -588 * k); ctx.closePath(); F3(ctx, L.hair, 2); }

  // ---------- head ----------
  const tilt = (o.tilt || 0) + (emo === 'sad' ? -.06 : 0) + (talk > .05 ? Math.sin(t * 4.2) * .03 : Math.sin(t * .9) * .015);
  ctx.save(); ctx.translate(0, Y.chin + 8 * k); ctx.rotate(tilt); ctx.translate(0, -(Y.chin + 8 * k)); if (emo === 'sad') ctx.translate(0, 6);
  ctx.translate(0, Y.chin + 8 * k); ctx.scale(1.13, 1.13); ctx.translate(0, -(Y.chin + 8 * k));
  head3(ctx, L, t + (o.phase || 0), emo, talk, look, k);
  ctx.restore();
  ctx.restore();
}

function arm3(ctx, L, sd, sx, sy, a1, a2, sl, k) {
  const u = 150 * k, f = 132 * k;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(-sd * a1);
  // upper arm (tapered)
  const upper = () => { ctx.beginPath(); ctx.moveTo(-17 * k, -6); ctx.bezierCurveTo(-19 * k, u * .4, -15 * k, u * .8, -13 * k, u + 6); ctx.lineTo(13 * k, u + 6); ctx.bezierCurveTo(15 * k, u * .8, 19 * k, u * .4, 17 * k, -6); ctx.closePath(); };
  upper(); F3(ctx, L.skin, 2.5);
  // sleeve over the upper arm
  ctx.beginPath(); const sLen = L.female ? u * 1.12 : u * .92;
  ctx.moveTo(-23 * k, -14); ctx.bezierCurveTo(-24 * k, sLen * .4, -21 * k, sLen * .8, -19 * k, sLen); ctx.quadraticCurveTo(0, sLen + 8, 19 * k, sLen); ctx.bezierCurveTo(21 * k, sLen * .8, 24 * k, sLen * .4, 23 * k, -14); ctx.quadraticCurveTo(0, -26 * k, -23 * k, -14); ctx.closePath(); F3(ctx, sl.c, 2.5);
  ctx.strokeStyle = sh3(sl.c, -.25); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-8 * k, sLen * .25); ctx.quadraticCurveTo(-12 * k, sLen * .6, -6 * k, sLen * .9); ctx.stroke();
  ctx.fillStyle = sl.cuff; ctx.beginPath(); ctx.moveTo(-18 * k, sLen - (L.female ? 10 : 22)); ctx.quadraticCurveTo(0, sLen - 2, 18 * k, sLen - 10); ctx.lineTo(18 * k, sLen); ctx.quadraticCurveTo(0, sLen + 8, -18 * k, sLen); ctx.closePath(); ctx.fill();
  ctx.translate(0, u); ctx.rotate(-sd * a2);
  // forearm
  ctx.beginPath(); ctx.moveTo(-13 * k, -4); ctx.bezierCurveTo(-15 * k, f * .35, -12 * k, f * .8, -9 * k, f); ctx.lineTo(9 * k, f); ctx.bezierCurveTo(12 * k, f * .8, 15 * k, f * .35, 13 * k, -4); ctx.closePath(); F3(ctx, L.skin, 2.5);
  if (L.bangles) { ctx.strokeStyle = L.bangles; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, f - 12 - i * 6, 11 * k, 3.5, 0, 0, 7); ctx.stroke(); } }
  // hand with fingers
  ctx.translate(0, f);
  ctx.beginPath(); ctx.moveTo(-11 * k, 0); ctx.bezierCurveTo(-14 * k, 18 * k, -12 * k, 34 * k, -6 * k, 44 * k); ctx.quadraticCurveTo(0, 50 * k, 6 * k, 44 * k); ctx.bezierCurveTo(12 * k, 34 * k, 14 * k, 18 * k, 11 * k, 0); ctx.closePath(); F3(ctx, L.skin, 2.3);
  ctx.strokeStyle = sh3(L.skin, -.3); ctx.lineWidth = 1.6; for (const fx of [-4, 1, 6]) { ctx.beginPath(); ctx.moveTo(fx * k, 26 * k); ctx.lineTo(fx * k * 1.05, 42 * k); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(sd * -12 * k, 16 * k, 5 * k, 11 * k, sd * .5, 0, 7); F3(ctx, L.skin, 2); // thumb
  ctx.restore();
}

function head3(ctx, L, t, emo, talk, look, k) {
  const fem = L.female, cy = -872 * k; // face centre
  const hc = L.hair;
  // ears
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 57 * k, cy + 8 * k, 9 * k, 15 * k, sd * .15, 0, 7); F3(ctx, L.skin, 2.3);
    ctx.strokeStyle = L.skinSh; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sd * 57 * k, cy + 8 * k, 6 * k, sd > 0 ? -1.2 : 1.9, sd > 0 ? 1.2 : 4.3); ctx.stroke();
    if (L.earrings) { ctx.beginPath(); ctx.arc(sd * 58 * k, cy + 26 * k, 4 * k, 0, 7); F3(ctx, L.earrings, 1.5); ctx.beginPath(); ctx.arc(sd * 58 * k, cy + 34 * k, 2.5 * k, 0, 7); F3(ctx, L.earrings, 1); } }
  // back/top hair mass (behind the face)
  if (L.style === 'braid') { ctx.beginPath(); ctx.moveTo(-62 * k, cy + 10 * k); ctx.bezierCurveTo(-72 * k, cy - 80 * k, -30 * k, cy - 102 * k, 0, cy - 100 * k); ctx.bezierCurveTo(30 * k, cy - 102 * k, 72 * k, cy - 80 * k, 62 * k, cy + 10 * k); ctx.closePath(); F3(ctx, hc); }
  else { ctx.beginPath(); ctx.moveTo(-60 * k, cy); ctx.bezierCurveTo(-66 * k, cy - 76 * k, -28 * k, cy - 96 * k, 4 * k, cy - 96 * k); ctx.bezierCurveTo(40 * k, cy - 96 * k, 68 * k, cy - 70 * k, 60 * k, cy); ctx.closePath(); F3(ctx, hc); }
  // face shape: forehead, cheekbones, soft jaw, chin
  const face = () => { ctx.beginPath(); ctx.moveTo(-56 * k, cy - 40 * k); ctx.bezierCurveTo(-58 * k, cy + 4 * k, -54 * k, cy + 36 * k, -40 * k, cy + 58 * k);
    ctx.bezierCurveTo(-26 * k, cy + 72 * k, -12 * k, cy + (fem ? 76 : 80) * k, 0, cy + (fem ? 76 : 80) * k); ctx.bezierCurveTo(12 * k, cy + (fem ? 76 : 80) * k, 26 * k, cy + 72 * k, 40 * k, cy + 58 * k);
    ctx.bezierCurveTo(54 * k, cy + 36 * k, 58 * k, cy + 4 * k, 56 * k, cy - 40 * k); ctx.bezierCurveTo(50 * k, cy - 80 * k, -50 * k, cy - 80 * k, -56 * k, cy - 40 * k); ctx.closePath(); };
  face(); F3(ctx, L.skin, 2.8);
  shadeIn(ctx, face, () => { // cel shadow on the far cheek + under the hairline
    ctx.fillStyle = L.skinSh; ctx.globalAlpha = .26; ctx.beginPath(); ctx.moveTo(42 * k, cy - 60 * k); ctx.bezierCurveTo(54 * k, cy, 48 * k, cy + 50 * k, 22 * k, cy + 80 * k); ctx.lineTo(80 * k, cy + 90 * k); ctx.lineTo(80 * k, cy - 60 * k); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .22; ctx.beginPath(); ctx.ellipse(0, cy - 54 * k, 70 * k, 20 * k, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    if (!fem) { ctx.fillStyle = 'rgba(60,40,30,.05)'; ctx.beginPath(); ctx.ellipse(0, cy + 64 * k, 34 * k, 16 * k, 0, 0, 7); ctx.fill(); }
  });
  // blush
  const bl = ctx.createRadialGradient(0, 0, 2, 0, 0, 18 * k);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 34 * k, cy + 30 * k); const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 18 * k); g.addColorStop(0, emo === 'blush' ? 'rgba(240,90,110,.55)' : 'rgba(240,110,120,.28)'); g.addColorStop(1, 'rgba(240,110,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 20 * k, 12 * k, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // eyes
  const blink = ((t % 3.7) + 3.7) % 3.7 < .12;
  const ey = cy + 2 * k, ex = 24 * k, lx = look * 4 * k;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(sd * ex, ey);
    const wide = emo === 'shocked' ? 1.3 : emo === 'sad' ? .85 : emo === 'happy' && talk < .05 ? .9 : 1;
    if (blink) { ctx.strokeStyle = INK3; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-15 * k, 0); ctx.quadraticCurveTo(0, 6 * k, 15 * k, 0); ctx.stroke(); ctx.restore(); continue; }
    const eye = () => { ctx.beginPath(); ctx.moveTo(-sd * 13 * k, 1 * k); ctx.bezierCurveTo(-sd * 8 * k, -12 * k * wide, sd * 8 * k, -13 * k * wide, sd * 15 * k, -2 * k); ctx.bezierCurveTo(sd * 8 * k, 8 * k * wide, -sd * 6 * k, 8 * k * wide, -sd * 13 * k, 1 * k); ctx.closePath(); };
    eye(); ctx.fillStyle = '#ffffff'; ctx.fill();
    shadeIn(ctx, eye, () => {
      const g = ctx.createRadialGradient(lx, -1 * k, 1, lx, -1 * k, 10 * k); g.addColorStop(0, sh3(L.eyes, .35)); g.addColorStop(.7, L.eyes); g.addColorStop(1, sh3(L.eyes, -.5));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, -1 * k, 9.5 * k, 0, 7); ctx.fill();
      ctx.fillStyle = '#120806'; ctx.beginPath(); ctx.arc(lx, -1 * k, 4.4 * k, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-20 * k, -16 * k, 40 * k, 7 * k); // lid shadow
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx + 3.5 * k, -5 * k, 2.8 * k, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(lx - 3 * k, 3 * k, 1.4 * k, 0, 7); ctx.fill();
    });
    // upper lash line (thick, with a flick for her), lower lash, crease
    ctx.strokeStyle = INK3; ctx.lineCap = 'round'; ctx.lineWidth = (fem ? 4 : 3) * k;
    ctx.beginPath(); ctx.moveTo(-sd * 14 * k, 1 * k); ctx.bezierCurveTo(-sd * 8 * k, -13 * k * wide, sd * 8 * k, -14 * k * wide, sd * 16 * k, -2 * k); ctx.stroke();
    if (fem) { ctx.beginPath(); ctx.moveTo(sd * 15 * k, -3 * k); ctx.lineTo(sd * 21 * k, -8 * k); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sd * 11 * k, -8 * k); ctx.lineTo(sd * 15 * k, -13 * k); ctx.lineWidth = 2.2 * k; ctx.stroke(); }
    ctx.lineWidth = 1.4 * k; ctx.strokeStyle = 'rgba(59,36,32,.55)'; ctx.beginPath(); ctx.moveTo(-sd * 9 * k, 6 * k * wide); ctx.quadraticCurveTo(sd * 2 * k, 9 * k * wide, sd * 12 * k, 3 * k); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-sd * 9 * k, -14 * k * wide); ctx.quadraticCurveTo(sd * 2 * k, -20 * k * wide, sd * 13 * k, -12 * k * wide); ctx.stroke();
    ctx.restore();
  }
  // brows: tapered filled shapes
  for (const sd of [-1, 1]) {
    const lift = emo === 'shocked' ? -8 * k : emo === 'happy' ? -2 * k : 0, inner = emo === 'sad' ? -7 * k : (emo === 'firm' || emo === 'angry') ? 6 * k : 0;
    ctx.save(); ctx.translate(sd * 24 * k, cy - 26 * k + lift);
    ctx.beginPath(); ctx.moveTo(-sd * 15 * k, 3 * k + inner); ctx.quadraticCurveTo(-sd * 2 * k, -5 * k + inner * .5, sd * 16 * k, 1 * k); ctx.quadraticCurveTo(sd * 2 * k, (fem ? -1 : 2) * k + inner * .3, -sd * 15 * k, (fem ? 6 : 9) * k + inner);
    ctx.closePath(); ctx.fillStyle = sh3(L.hair, .05); ctx.fill(); ctx.restore();
  }
  // nose
  ctx.strokeStyle = sh3(L.skinSh, -.15); ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(2 * k, cy + 17 * k); ctx.quadraticCurveTo(-2 * k, cy + 27 * k, -6 * k, cy + 32 * k); ctx.quadraticCurveTo(0, cy + 36 * k, 6 * k, cy + 33 * k); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-1 * k, cy + 22 * k, 2 * k, 6 * k, 0, 0, 7); ctx.fill();
  // mouth / lips (lip-sync)
  const my = cy + 52 * k;
  if (talk > .06) {
    const h = (6 + talk * 16) * k, w = (13 - talk * 2) * k;
    ctx.beginPath(); ctx.moveTo(-w, my); ctx.quadraticCurveTo(0, my - 5 * k, w, my); ctx.quadraticCurveTo(0, my + h * 1.4, -w, my); ctx.closePath(); F3(ctx, '#6e2234', 2);
    shadeIn(ctx, () => { ctx.beginPath(); ctx.moveTo(-w, my); ctx.quadraticCurveTo(0, my - 5 * k, w, my); ctx.quadraticCurveTo(0, my + h * 1.4, -w, my); ctx.closePath(); }, () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(-w, my - 6 * k, w * 2, 6 * k); ctx.fillStyle = '#e2717f'; ctx.beginPath(); ctx.ellipse(0, my + h, w * .7, h * .45, 0, 0, 7); ctx.fill(); });
    if (fem) { ctx.fillStyle = L.lips; ctx.beginPath(); ctx.moveTo(-w - 1, my); ctx.quadraticCurveTo(-w * .4, my - 7 * k, 0, my - 4 * k); ctx.quadraticCurveTo(w * .4, my - 7 * k, w + 1, my); ctx.quadraticCurveTo(0, my - 2 * k, -w - 1, my); ctx.fill(); }
  } else {
    const smile = emo === 'happy' || emo === 'blush' ? 1 : emo === 'sad' ? -1 : emo === 'shocked' ? 0 : .35;
    if (emo === 'shocked') { ctx.beginPath(); ctx.ellipse(0, my + 2 * k, 6 * k, 8 * k, 0, 0, 7); F3(ctx, '#6e2234', 2); }
    else {
      if (fem) { // shaped lips
        ctx.fillStyle = L.lips; ctx.beginPath(); ctx.moveTo(-13 * k, my - smile * 2 * k); ctx.quadraticCurveTo(-6 * k, my - 6 * k, 0, my - 3.5 * k); ctx.quadraticCurveTo(6 * k, my - 6 * k, 13 * k, my - smile * 2 * k);
        ctx.quadraticCurveTo(0, my + (smile > 0 ? 3 : 1) * k, -13 * k, my - smile * 2 * k); ctx.fill();
        ctx.fillStyle = sh3(L.lips, .18); ctx.beginPath(); ctx.moveTo(-11 * k, my - smile * 1.5 * k + 1); ctx.quadraticCurveTo(0, my + (smile > 0 ? 11 : 7) * k, 11 * k, my - smile * 1.5 * k + 1); ctx.quadraticCurveTo(0, my + 2 * k, -11 * k, my - smile * 1.5 * k + 1); ctx.fill();
      }
      ctx.strokeStyle = sh3(fem ? L.lips : L.skinSh, -.4); ctx.lineWidth = 2.4 * k; ctx.beginPath(); ctx.moveTo(-14 * k, my - smile * 3 * k); ctx.quadraticCurveTo(0, my + smile * 6 * k, 14 * k, my - smile * 3 * k); ctx.stroke();
      if (smile > .5) { ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.arc(-15 * k, my - 3 * k, 3 * k, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(15 * k, my - 3 * k, 3 * k, Math.PI - 1, Math.PI + 1); ctx.stroke(); }
    }
  }
  if (L.bindi) { ctx.fillStyle = L.bindi; ctx.beginPath(); ctx.arc(0, cy - 16 * k, 3.6 * k, 0, 7); ctx.fill(); }
  // ---------- front hair ----------
  if (L.style === 'braid') {
    // centre parting, two face-framing locks sweeping over the forehead and down past the cheeks
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sd * 2 * k, cy - 100 * k); ctx.bezierCurveTo(sd * 40 * k, cy - 98 * k, sd * 66 * k, cy - 70 * k, sd * 64 * k, cy - 20 * k);
      ctx.bezierCurveTo(sd * 64 * k, cy + 20 * k, sd * 60 * k, cy + 50 * k, sd * 58 * k, cy + 74 * k); ctx.bezierCurveTo(sd * 52 * k, cy + 40 * k, sd * 50 * k, cy + 6 * k, sd * 50 * k, cy - 22 * k);
      ctx.bezierCurveTo(sd * 46 * k, cy - 50 * k, sd * 24 * k, cy - 70 * k, sd * 2 * k, cy - 76 * k); ctx.closePath(); F3(ctx, hc, 2.5);
      ctx.strokeStyle = L.hairHi; ctx.lineWidth = 3 * k; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(sd * 14 * k, cy - 94 * k); ctx.bezierCurveTo(sd * 40 * k, cy - 90 * k, sd * 56 * k, cy - 66 * k, sd * 57 * k, cy - 30 * k); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = sh3(hc, -.4); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sd * 30 * k, cy - 84 * k); ctx.quadraticCurveTo(sd * 54 * k, cy - 50 * k, sd * 55 * k, cy + 20 * k); ctx.stroke();
    }
    ctx.beginPath(); ctx.roundRect(28 * k, cy - 84 * k, 26 * k, 10 * k, 5 * k); F3(ctx, L.clip, 2);
  } else if (L.style === 'quiff') {
    // short sides + textured quiff swept up and to the side
    ctx.beginPath(); ctx.moveTo(-60 * k, cy - 2 * k); ctx.bezierCurveTo(-66 * k, cy - 60 * k, -54 * k, cy - 92 * k, -24 * k, cy - 104 * k);
    const tips = [[-8, -118, -2, -104], [14, -122, 16, -106], [34, -116, 36, -100], [52, -102, 54, -88], [62, -80, 64, -58]];
    for (const [tx, ty, bx, by] of tips) { ctx.quadraticCurveTo(tx * k - 6 * k, ty * k + cy + 18 * k, tx * k, ty * k + cy); ctx.quadraticCurveTo(tx * k + 4 * k, by * k + cy - 6 * k, bx * k, by * k + cy); }
    ctx.bezierCurveTo(66 * k, cy - 40 * k, 62 * k, cy - 20 * k, 60 * k, cy - 2 * k);
    ctx.lineTo(54 * k, cy - 30 * k); ctx.bezierCurveTo(40 * k, cy - 60 * k, 10 * k, cy - 66 * k, -16 * k, cy - 58 * k); ctx.bezierCurveTo(-38 * k, cy - 50 * k, -52 * k, cy - 34 * k, -60 * k, cy - 2 * k); ctx.closePath(); F3(ctx, hc, 2.6);
    ctx.strokeStyle = L.hairHi; ctx.lineWidth = 3 * k; ctx.globalAlpha = .75; for (const [x0, y0, x1, y1] of [[-30, -86, 6, -118], [-6, -80, 24, -116], [16, -74, 44, -104]]) { ctx.beginPath(); ctx.moveTo(x0 * k, cy + y0 * k); ctx.quadraticCurveTo((x0 + x1) / 2 * k - 6 * k, cy + (y0 + y1) / 2 * k, x1 * k, cy + y1 * k); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.fillStyle = sh3(L.skinSh, -.1); ctx.globalAlpha = .35; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 56 * k, cy - 6 * k); ctx.lineTo(sd * 52 * k, cy + 22 * k); ctx.lineTo(sd * 57 * k, cy + 22 * k); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1; // sideburns
  }
}
