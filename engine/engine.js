// Strangers to Forever: 2D reel engine (1080x1920 canvas)
const W = 1080, H = 1920;
const C = {
  pink: '#ff8fab', rose: '#ff5d8f', cream: '#fff6ee', ink: '#4a3b52', lav: '#b69cff',
  blue: '#6ea8fe', mint: '#9be3c4', yellow: '#ffe08a', line: '#5a4060',
};
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t, start, dur) => clamp((t - start) / dur);
const lerp = (a, b, k) => a + (b - a) * k;
function rand(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function fillStroke(ctx, fill, lw = 6) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke();
}

// ---------- CAST (character designs) ----------
const CAST = {
  tara:  { name: 'Tara',  style: 'long',  hair: '#3a2420', skin: '#f3c3a0', shirt: '#ff8fab', collar: '#fff1e6', skirt: '#b69cff', clip: '#ff5d8f', bag: '#ffe08a' },
  kabir: { name: 'Kabir', style: 'spiky', hair: '#241817', skin: '#dfa77f', shirt: '#6ea8fe', hood: true, pants: '#3d4b7a', earphones: true, brows: true, bag: '#4a5a8a' },
  zoya:  { name: 'Zoya',  style: 'bun',   hair: '#6b3e2e', skin: '#f6cfae', shirt: '#b69cff', pants: '#6f8fd8', glasses: true },
  pihu:  { name: 'Pihu',  style: 'pigtails', hair: '#4a2c22', skin: '#efbf98', shirt: '#9be3c4', skirt: '#ffb3c6' },
  amma:  { name: 'Amma',  style: 'bun', hair: '#241a1a', skin: '#e3ab84', shirt: '#4fc08d', saree: '#4fc08d', flower: true },
  appa:  { name: 'Appa',  style: 'short', hair: '#241a1a', skin: '#d39b73', shirt: '#ffb347', pants: '#6b5b4b', mustache: true, brows: true },
};

// Chibi character. (x, y) = point between the feet. o: {t, expr, wave, walking, phase, look}
function chibi(ctx, x, y, s, look, o = {}) {
  const t = o.t || 0, ph = o.phase || 0;
  const bob = o.walking ? -Math.abs(Math.sin(t * 9 + ph)) * 14 : Math.sin(t * 3 + ph) * 4;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // shadow
  ctx.fillStyle = 'rgba(70,40,80,.18)'; ell(ctx, 0, 4, 85, 16); ctx.fill();
  ctx.translate(0, bob);
  const lw = 6;
  // legs
  const swing = o.walking ? Math.sin(t * 9 + ph) * 0.35 : 0;
  [[-22, swing], [22, -swing]].forEach(([lx, a]) => {
    ctx.save(); ctx.translate(lx, -70); ctx.rotate(a);
    rr(ctx, -14, 0, 28, 62, 14); fillStroke(ctx, look.pants || look.skin, lw);
    rr(ctx, -20, 52, 40, 20, 10); fillStroke(ctx, '#ffffff', lw);
    ctx.restore();
  });
  // back hair
  ctx.fillStyle = look.hair;
  if (look.style === 'long') { rr(ctx, -100, -310, 200, 230, [60, 60, 50, 50]); fillStroke(ctx, look.hair, lw); }
  // bag (behind body)
  if (look.bag && o.bag !== false) { rr(ctx, 40, -150, 55, 70, 14); fillStroke(ctx, look.bag, lw); }
  // body
  if (look.saree) {
    ctx.beginPath(); ctx.moveTo(-50, -175); ctx.lineTo(50, -175); ctx.lineTo(72, -40); ctx.lineTo(-72, -40); ctx.closePath();
    fillStroke(ctx, look.saree, lw);
    ctx.beginPath(); ctx.moveTo(-50, -175); ctx.lineTo(10, -175); ctx.lineTo(60, -60); ctx.lineTo(30, -55); ctx.closePath();
    fillStroke(ctx, '#ffd36e', 4);
  } else {
    rr(ctx, -55, -180, 110, 120, 38); fillStroke(ctx, look.shirt, lw);
    if (look.collar) { ctx.beginPath(); ctx.moveTo(-30, -180); ctx.lineTo(0, -150); ctx.lineTo(30, -180); fillStroke(ctx, look.collar, 4); }
    if (look.hood) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-4, -160, 3, 40); ctx.fillRect(10, -160, 3, 34); rr(ctx, -30, -110, 60, 26, 10); fillStroke(ctx, '#5b93ea', 4); }
    if (look.skirt) { ctx.beginPath(); ctx.moveTo(-52, -95); ctx.lineTo(52, -95); ctx.lineTo(75, -45); ctx.lineTo(-75, -45); ctx.closePath(); fillStroke(ctx, look.skirt, lw); }
  }
  // arms
  const waveA = o.wave ? -2.5 + Math.sin(t * 12) * 0.35 : -0.25;
  [[-52, 0.25], [52, waveA]].forEach(([sx, a]) => {
    ctx.save(); ctx.translate(sx, -165); ctx.rotate(a);
    rr(ctx, -15, 0, 30, 72, 15); fillStroke(ctx, look.saree || look.shirt, lw);
    ell(ctx, 0, 78, 16, 16); fillStroke(ctx, look.skin, 5);
    ctx.restore();
  });
  if (o.phone) { ctx.save(); ctx.translate(-30, -110); ctx.rotate(-0.2); rr(ctx, -18, -30, 36, 60, 8); fillStroke(ctx, '#3d3a4a', 4); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-12, -24, 24, 44); ctx.restore(); }
  // earphones around neck
  if (look.earphones) { ctx.beginPath(); ctx.arc(0, -185, 48, 0.2, Math.PI - 0.2); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ell(ctx, -44, -168, 10, 10); fillStroke(ctx, '#fff', 4); ell(ctx, 44, -168, 10, 10); fillStroke(ctx, '#fff', 4); }
  // head
  const hy = -285;
  if (look.style === 'bun') { ell(ctx, 0, hy - 118, 40, 38); fillStroke(ctx, look.hair, lw); }
  if (look.style === 'pigtails') { ell(ctx, -100, hy + 10, 30, 42); fillStroke(ctx, look.hair, lw); ell(ctx, 100, hy + 10, 30, 42); fillStroke(ctx, look.hair, lw); }
  ell(ctx, 0, hy - 8, 104, 98); fillStroke(ctx, look.hair, lw);   // hair mass
  ell(ctx, 0, hy + 22, 88, 76); ctx.fillStyle = look.skin; ctx.fill(); // face
  // bangs
  ctx.fillStyle = look.hair;
  if (look.style === 'spiky') {
    ctx.beginPath(); ctx.moveTo(-95, hy - 20);
    [[-70, -150], [-40, -98], [-5, -162], [25, -100], [60, -150], [95, -25]].forEach(([a, b]) => ctx.lineTo(a, hy + b + 60));
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, hy - 100); ctx.quadraticCurveTo(40, hy - 150, 20, hy - 140); ctx.lineWidth = 8; ctx.strokeStyle = look.hair; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-92, hy + 5); ctx.quadraticCurveTo(-60, hy - 20, -20, hy - 30);
    ctx.quadraticCurveTo(30, hy - 10, 92, hy + 5); ctx.lineTo(92, hy - 60); ctx.lineTo(-92, hy - 60); ctx.closePath(); ctx.fill();
  }
  if (look.clip) { rr(ctx, 52, hy - 38, 34, 16, 8); fillStroke(ctx, look.clip, 4); }
  if (look.flower) { ['#fff', '#fff', '#fff'].forEach((c, i) => { ell(ctx, 30 + i * 14, hy - 110, 9, 9); fillStroke(ctx, c, 3); }); }
  // face features
  const ex = 36, ey = hy + 30;
  const blink = ((t + ph) % 3.4) < 0.13;
  const expr = o.expr || 'happy';
  ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  [-1, 1].forEach(sd => {
    if (expr === 'joy') { ctx.beginPath(); ctx.arc(sd * ex, ey + 6, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 7; ctx.stroke(); return; }
    if (blink) { ctx.beginPath(); ctx.moveTo(sd * ex - 13, ey); ctx.lineTo(sd * ex + 13, ey); ctx.lineWidth = 6; ctx.stroke(); return; }
    const big = expr === 'shock' ? 1.25 : 1;
    ell(ctx, sd * ex, ey, 13 * big, 18 * big); ctx.fillStyle = C.ink; ctx.fill();
    ctx.fillStyle = '#fff'; ell(ctx, sd * ex + 4, ey - 7, 5, 6); ctx.fill(); ell(ctx, sd * ex - 4, ey + 6, 2.5, 2.5); ctx.fill();
  });
  // brows
  ctx.lineWidth = look.brows ? 7 : 4; ctx.strokeStyle = C.ink;
  [-1, 1].forEach(sd => {
    const tilt = expr === 'sad' ? -sd * 8 : expr === 'smirk' ? (sd > 0 ? -8 : 2) : 0;
    ctx.beginPath(); ctx.moveTo(sd * ex - 14, ey - 32 + tilt); ctx.lineTo(sd * ex + 14, ey - 32 - tilt); ctx.stroke();
  });
  if (look.glasses) { ctx.lineWidth = 5; [-1, 1].forEach(sd => { ell(ctx, sd * ex, ey, 26, 24); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(-10, ey); ctx.lineTo(10, ey); ctx.stroke(); }
  // blush
  ctx.fillStyle = expr === 'blush' ? 'rgba(255,90,130,.6)' : 'rgba(255,120,150,.4)';
  ell(ctx, -58, ey + 30, 17, 10); ctx.fill(); ell(ctx, 58, ey + 30, 17, 10); ctx.fill();
  // mouth
  const my = ey + 42; ctx.lineWidth = 5; ctx.strokeStyle = C.ink;
  if (expr === 'sad') { ctx.beginPath(); ctx.arc(0, my + 12, 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  else if (expr === 'shock') { ell(ctx, 0, my + 4, 9, 12); ctx.fillStyle = '#7a2e4a'; ctx.fill(); }
  else if (expr === 'smirk') { ctx.beginPath(); ctx.moveTo(-10, my + 2); ctx.quadraticCurveTo(6, my + 8, 16, my - 4); ctx.stroke(); }
  else if (expr === 'joy') { ctx.beginPath(); ctx.arc(0, my - 2, 15, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#7a2e4a'; ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, my - 4, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  if (look.mustache) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(-14, my - 10, 16, 6, 0.2, 0, Math.PI * 2); ctx.ellipse(14, my - 10, 16, 6, -0.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ---------- ENVIRONMENT PIECES ----------
function gradientBg(ctx, stops) { const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function cloud(ctx, x, y, s, a = .92) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); [[0, 0, 60], [60, -28, 72], [130, 0, 56], [65, 22, 60]].forEach(([p, q, r]) => { ctx.moveTo(p + r, q); ctx.arc(p, q, r, 0, Math.PI * 2); }); ctx.fill(); ctx.restore(); }
function clouds(ctx, t, ys = [300, 520, 700]) { ys.forEach((y, i) => cloud(ctx, ((rand(i + 3) * W + t * (18 + i * 9)) % (W + 500)) - 250, y, .7 + rand(i) * .5)); }
function sky(ctx, t) { gradientBg(ctx, ['#bfe3ff', '#e3eeff', '#ffe1ec']); clouds(ctx, t); }
function sunsetSky(ctx, t) { gradientBg(ctx, ['#b9a6ff', '#ffb8c9', '#ffd2a6']); ctx.fillStyle = 'rgba(255,240,200,.9)'; ell(ctx, 780, 820, 110, 110); ctx.fill(); clouds(ctx, t, [380, 600]); }
function nightSky(ctx, t) { gradientBg(ctx, ['#1f1d4a', '#45337a', '#8a5ca8']); for (let i = 0; i < 70; i++) { const tw = .4 + .6 * Math.abs(Math.sin(t * 2 + i)); ctx.fillStyle = `rgba(255,255,255,${tw})`; ell(ctx, rand(i) * W, rand(i + 99) * H * .8, 2 + rand(i + 7) * 3, 2 + rand(i + 7) * 3); ctx.fill(); } }
function ground(ctx, y, color, color2) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y - 50, W, y); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill(); if (color2) { ctx.fillStyle = color2; ctx.fillRect(0, y + 120, W, H); } }
function hills(ctx, y, c1 = '#a9dca0', c2 = '#8fcf8a') { ctx.fillStyle = c1; ell(ctx, 200, y, 450, 200); ctx.fill(); ctx.fillStyle = c2; ell(ctx, 850, y + 20, 500, 220); ctx.fill(); }
function house(ctx, x, y, w, h, wall, roof) {
  rr(ctx, x, y - h, w, h, 12); fillStroke(ctx, wall);
  ctx.beginPath(); ctx.moveTo(x - 24, y - h + 8); ctx.lineTo(x + w / 2, y - h - w * .42); ctx.lineTo(x + w + 24, y - h + 8); ctx.closePath(); fillStroke(ctx, roof);
  rr(ctx, x + w / 2 - 24, y - 76, 48, 76, [24, 24, 0, 0]); fillStroke(ctx, '#b07a68', 5);
  [x + 20, x + w - 60].forEach(wx => { rr(ctx, wx, y - h + 30, 40, 40, 8); fillStroke(ctx, '#fff4c2', 5); });
}
function tree(ctx, x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rr(ctx, -16, -130, 32, 130, 10); fillStroke(ctx, '#b07a58'); ctx.beginPath(); [[-50, -170, 70], [50, -170, 70], [0, -230, 80]].forEach(([a, b, r]) => { ctx.moveTo(a + r, b); ctx.arc(a, b, r, 0, Math.PI * 2); }); fillStroke(ctx, '#8fd694'); ctx.fillStyle = '#ffb347'; [[-40, -160], [30, -200], [55, -150]].forEach(([a, b]) => { ell(ctx, a, b, 10, 12); ctx.fill(); }); ctx.restore(); }
function skyline(ctx, baseY, alpha = 1, palette = ['#c3b6e8', '#a99bdc', '#d4c8f2']) {
  ctx.save(); ctx.globalAlpha = alpha; let x = -20, i = 0;
  while (x < W) { const w = 90 + rand(i) * 90, h = 220 + rand(i + 50) * 420; rr(ctx, x, baseY - h, w, h + 10, [12, 12, 0, 0]); ctx.fillStyle = palette[i % 3]; ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,.8)'; for (let wy = baseY - h + 30; wy < baseY - 30; wy += 46) for (let wx = x + 16; wx < x + w - 24; wx += 34) if (rand(wx * wy) > .35) ctx.fillRect(wx, wy, 16, 22);
    x += w + 8; i++; }
  ctx.restore();
}
function train(ctx, x, y, color = '#ff8fab', face) {
  const L = 740;
  rr(ctx, x, y - 170, L, 160, [30, 80, 20, 20]); fillStroke(ctx, color);
  ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y - 60, L - 12, 16);
  for (let i = 0; i < 5; i++) { const wx = x + 40 + i * 130; rr(ctx, wx, y - 145, 96, 70, 14); fillStroke(ctx, '#cfeeff', 5);
    if (i === 3 && face) { ctx.save(); ctx.beginPath(); ctx.roundRect(wx, y - 145, 96, 70, 14); ctx.clip(); chibi(ctx, wx + 48, y + 70, .42, face.look, { t: face.t, expr: face.expr, bag: false }); ctx.restore(); } }
  [x + 90, x + 260, x + 480, x + 650].forEach(wx => { ell(ctx, wx, y - 4, 26, 26); fillStroke(ctx, '#5a4a6a'); });
}
function college(ctx, cx, baseY, name) {
  const w = 900, h = 520, x = cx - w / 2;
  rr(ctx, x, baseY - h, w, h, 16); fillStroke(ctx, '#ffe6c9');
  ctx.beginPath(); ctx.moveTo(x - 30, baseY - h + 10); ctx.lineTo(cx, baseY - h - 150); ctx.lineTo(x + w + 30, baseY - h + 10); ctx.closePath(); fillStroke(ctx, '#e8826e');
  for (let i = 0; i < 6; i++) { rr(ctx, x + 60 + i * 150, baseY - h + 160, 28, h - 160, 8); fillStroke(ctx, '#fff7ee', 5); }
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { rr(ctx, x + 112 + i * 150, baseY - h + 180 + r * 150, 70, 90, 10); fillStroke(ctx, '#bfe3ff', 5); }
  rr(ctx, cx - 330, baseY - h - 20, 660, 90, 20); fillStroke(ctx, '#5b4a8a');
  ctx.fillStyle = '#fff'; ctx.font = '700 38px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, cx, baseY - h + 25);
}
function room(ctx, wall = '#ffe9d6', floor = '#e8c4a0') {
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 90) ctx.fillRect(x, 0, 40, 1200);
  ctx.fillStyle = floor; ctx.fillRect(0, 1180, W, H); ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 140) ctx.fillRect(x, 1180, 6, H);
  rr(ctx, 360, 380, 360, 300, 20); fillStroke(ctx, '#bfe3ff'); ctx.fillStyle = '#fff'; ctx.fillRect(536, 380, 8, 300); ctx.fillRect(360, 526, 360, 8);
  ctx.fillStyle = '#ff9eb5'; rr(ctx, 320, 360, 70, 360, 30); ctx.fill(); rr(ctx, 690, 360, 70, 360, 30); ctx.fill();
  rr(ctx, 120, 470, 150, 120, 12); fillStroke(ctx, '#fff6dd'); heart(ctx, 195, 530, .7, C.rose);
  ctx.fillStyle = 'rgba(255,143,171,.35)'; ell(ctx, 540, 1300, 460, 70); ctx.fill();
}

// ---------- UI / TEXT ----------
function heart(ctx, x, y, s, color) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-62, -8, -32, -62, 0, -30); ctx.bezierCurveTo(32, -62, 62, -8, 0, 30); ctx.fill(); ctx.restore(); }
function hearts(ctx, t, n = 12, seed = 1, alpha = .55) {
  const cols = ['#ff8fab', '#ff5d8f', '#ffc2d4', '#b69cff'];
  for (let i = 0; i < n; i++) { const r1 = rand(seed + i), r2 = rand(seed + i + 40), r3 = rand(seed + i + 80); const sp = 60 + r2 * 90;
    const y = H + 120 - ((t * sp + r3 * H * 1.6) % (H + 300)); const x = r1 * W + Math.sin(t * 2 + i) * 24;
    ctx.globalAlpha = alpha; heart(ctx, x, y, .35 + r3 * .55, cols[i % 4]); ctx.globalAlpha = 1; }
}
function wrap(ctx, text, maxW) { const words = text.split(' '); const lines = []; let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); return lines; }
function caption(ctx, text, t, o = {}) {
  const a = ease.out(prog(t, o.delay ?? .2, .45)); if (a <= 0) return;
  const size = o.size || 52; ctx.save(); ctx.font = `600 ${size}px Fredoka`;
  const lines = wrap(ctx, text, 840), lh = size * 1.32, h = lines.length * lh + 64, y = (o.y || 1440) - h / 2 + (1 - a) * 40;
  ctx.globalAlpha = a; ctx.shadowColor = 'rgba(120,60,90,.28)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 12;
  rr(ctx, 70, y, 940, h, 46); ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6; ctx.strokeStyle = o.accent || C.pink; ctx.stroke();
  heart(ctx, 110, y + 6, .55, o.accent || C.rose);
  const total = lines.join(' ').length; const shown = Math.floor(prog(t, (o.delay ?? .2) + .15, Math.min(1.5, total * .028)) * (total + 1));
  ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; let used = 0;
  lines.forEach((ln, i) => { const rem = shown - used; used += ln.length + 1; if (rem <= 0) return; const fw = ctx.measureText(ln).width; ctx.fillText(ln.slice(0, rem), W / 2 - fw / 2, y + 32 + lh * (i + .5)); });
  ctx.restore();
}
function bigText(ctx, text, x, y, size, k = 1, fill = '#fff', stroke = C.rose) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.font = `700 ${size}px Fredoka`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * .16; ctx.strokeStyle = stroke; ctx.strokeText(text, 0, 0); ctx.fillStyle = fill; ctx.fillText(text, 0, 0); ctx.restore();
}
function chip(ctx, text, x, y, k = 1, bg = C.rose, fg = '#fff', size = 40) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.font = `700 ${size}px Fredoka`; const w = ctx.measureText(text).width + size * 1.4;
  rr(ctx, -w / 2, -size * .9, w, size * 1.8, size * .9); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2); ctx.restore();
}
function nameTag(ctx, text, x, y, k, color = C.rose) { chip(ctx, text, x, y, ease.back(k), '#fff', color, 36); }
function pin(ctx, x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, -20, 22, Math.PI, 0); ctx.lineTo(0, 22); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ell(ctx, 0, -20, 8, 8); ctx.fillStyle = C.rose; ctx.fill(); ctx.restore(); }
function locationChip(ctx, text, y, k) { if (k <= 0) return; ctx.save(); ctx.font = '700 46px Fredoka'; const w = ctx.measureText(text).width + 120; ctx.translate(W / 2, y); ctx.scale(ease.back(k), ease.back(k)); rr(ctx, -w / 2, -46, w, 92, 46); ctx.fillStyle = C.rose; ctx.fill(); pin(ctx, -w / 2 + 50, 0, .9); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 25, 2); ctx.restore(); }
function bubble(ctx, text, x, y, w, k, tail, o = {}) {
  if (k <= 0) return; const kk = ease.back(k); ctx.save(); ctx.font = `600 ${o.size || 46}px Fredoka`; const lines = wrap(ctx, text, w - 60); const lh = (o.size || 46) * 1.25, h = lines.length * lh + 50;
  ctx.translate(x, y); ctx.scale(kk, kk);
  if (o.thought) { [[tail[0] - x, tail[1] - y, 12], [(tail[0] - x) * .6, (tail[1] - y) * .6 + h * .2, 20]].forEach(([a, b, r]) => { ell(ctx, a, b, r, r); fillStroke(ctx, '#fff', 5); }); }
  rr(ctx, -w / 2, -h / 2, w, h, o.thought ? h / 2 : 36); fillStroke(ctx, '#fff', 6);
  if (!o.thought) { ctx.beginPath(); ctx.moveTo(-20, h / 2 - 3); ctx.lineTo(tail[0] - x, tail[1] - y); ctx.lineTo(20, h / 2 - 3); fillStroke(ctx, '#fff', 6); ctx.fillStyle = '#fff'; ctx.fillRect(-16, h / 2 - 10, 32, 10); }
  ctx.fillStyle = o.color || C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((ln, i) => ctx.fillText(ln, 0, -h / 2 + 25 + lh * (i + .5))); ctx.restore();
}
function wifi(ctx, x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const lit = Math.floor((t * 2.5) % 4); ctx.lineCap = 'round';
  [70, 135, 200].forEach((r, i) => { ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI * .78, -Math.PI * .22); ctx.lineWidth = 34; ctx.strokeStyle = i < lit ? '#ff8fab' : 'rgba(255,255,255,.25)'; ctx.shadowColor = i < lit ? '#ff5d8f' : 'transparent'; ctx.shadowBlur = 30; ctx.stroke(); });
  ell(ctx, 0, 0, 24, 24); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.restore();
}
