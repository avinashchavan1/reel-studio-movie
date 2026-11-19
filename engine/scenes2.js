// Scenes v2: richer Indian backdrops with depth + soft light. Depends on engine.js + engine2.js.
function S2line(ctx, lw = 4) { ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(58,37,48,.85)'; ctx.lineJoin = 'round'; ctx.stroke(); }
function S2fill(ctx, c, lw = 4) { ctx.fillStyle = c; ctx.fill(); S2line(ctx, lw); }
function S2rect(ctx, x, y, w, h, c, r = 6, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); S2fill(ctx, c, lw); }

function atmosphere(ctx, kind = 'day') {
  const g = ctx.createRadialGradient(W / 2, H * .42, 200, W / 2, H * .5, 1250);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, kind === 'night' ? 'rgba(10,5,30,.55)' : 'rgba(80,40,90,.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (kind === 'warm') { ctx.fillStyle = 'rgba(255,190,120,.10)'; ctx.fillRect(0, 0, W, H); }
}
function sunRays(ctx, x, y, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const a = -.9 + i * .32 + Math.sin(t * .3 + i) * .02; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 1600, y + Math.sin(a) * 1600 + 900); ctx.lineTo(x + Math.cos(a + .1) * 1600, y + Math.sin(a + .1) * 1600 + 900); ctx.closePath(); ctx.fillStyle = 'rgba(255,240,200,.05)'; ctx.fill(); }
  ctx.restore();
}
function pole(ctx, x, top, base) {
  S2rect(ctx, x - 9, top, 18, base - top, '#8b8f9a', 4, 3);
  S2rect(ctx, x - 60, top + 30, 120, 12, '#6b7280', 3, 3);
  [-46, -16, 16, 46].forEach(d => { ctx.beginPath(); ctx.arc(x + d, top + 26, 5, 0, Math.PI * 2); S2fill(ctx, '#e5e7eb', 2); });
}
function wires(ctx, x1, x2, y, sag, t) {
  ctx.strokeStyle = 'rgba(40,30,40,.55)'; ctx.lineWidth = 3;
  [0, 14, 28].forEach(o => { ctx.beginPath(); ctx.moveTo(x1, y + o); ctx.quadraticCurveTo((x1 + x2) / 2, y + o + sag + Math.sin(t + o) * 3, x2, y + o); ctx.stroke(); });
}
function autoRickshaw(ctx, x, y, s = 1, flip = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
  ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(-150, -150); ctx.quadraticCurveTo(-140, -230, -40, -235); ctx.lineTo(90, -235); ctx.quadraticCurveTo(150, -230, 150, -150); ctx.lineTo(150, 0); ctx.closePath(); S2fill(ctx, '#2f9e5b');
  ctx.beginPath(); ctx.moveTo(-150, -150); ctx.quadraticCurveTo(-140, -230, -40, -235); ctx.lineTo(90, -235); ctx.quadraticCurveTo(150, -230, 150, -150); ctx.closePath(); S2fill(ctx, '#f5c518');
  S2rect(ctx, -120, -140, 110, 80, 'rgba(180,220,255,.7)', 10, 3); S2rect(ctx, 10, -140, 110, 80, 'rgba(180,220,255,.7)', 10, 3);
  ctx.fillStyle = '#1f2937'; ctx.fillRect(-150, -44, 300, 14);
  [-100, 100].forEach(wx => { ctx.beginPath(); ctx.arc(wx, 2, 34, 0, Math.PI * 2); S2fill(ctx, '#27272a'); ctx.beginPath(); ctx.arc(wx, 2, 14, 0, Math.PI * 2); S2fill(ctx, '#a1a1aa', 2); });
  ctx.restore();
}
function scooter(ctx, x, y, c = '#e11d48') {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-70, -20); ctx.quadraticCurveTo(-80, -90, -20, -90); ctx.lineTo(30, -90); ctx.lineTo(60, -40); ctx.lineTo(70, -20); ctx.closePath(); S2fill(ctx, c);
  S2rect(ctx, 40, -170, 10, 90, '#52525b', 3, 3); S2rect(ctx, 20, -176, 60, 12, '#3f3f46', 4, 3); S2rect(ctx, -60, -110, 70, 20, '#18181b', 8, 3);
  [-55, 60].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -4, 22, 0, Math.PI * 2); S2fill(ctx, '#27272a'); });
  ctx.restore();
}
function tiledHouse(ctx, x, base, w, h, wall, roof, t, opts = {}) {
  S2rect(ctx, x, base - h, w, h, wall, 4);
  ctx.beginPath(); ctx.moveTo(x - 30, base - h + 6); ctx.lineTo(x + w * .5, base - h - w * .32); ctx.lineTo(x + w + 30, base - h + 6); ctx.closePath(); S2fill(ctx, roof);
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(80,30,20,.35)'; ctx.lineWidth = 3; for (let yy = base - h - w * .32; yy < base - h + 10; yy += 14) { ctx.beginPath(); ctx.moveTo(x - 40, yy); ctx.lineTo(x + w + 40, yy); ctx.stroke(); } ctx.restore();
  if (opts.balcony) { S2rect(ctx, x + 20, base - h + 40, w - 40, 14, '#a16207', 3, 3); for (let bx = x + 30; bx < x + w - 20; bx += 22) { ctx.fillStyle = '#a16207'; ctx.fillRect(bx, base - h + 54, 5, 40); } }
  const dw = 56; S2rect(ctx, x + w / 2 - dw / 2, base - 104, dw, 104, '#8b4a2b', [26, 26, 0, 0]);
  [[x + 18, base - h + 100], [x + w - 70, base - h + 100]].forEach(([wx, wy]) => { S2rect(ctx, wx, wy, 52, 60, '#fde68a', 6, 3); ctx.fillStyle = 'rgba(58,37,48,.6)'; ctx.fillRect(wx + 24, wy, 4, 60); ctx.fillRect(wx, wy + 28, 52, 4); });
  if (opts.rangoli) { ctx.save(); ctx.translate(x + w / 2, base + 30); ctx.scale(1, .35); ['#f43f5e', '#f59e0b', '#22c55e', '#fff'].forEach((c, i) => { ctx.beginPath(); ctx.arc(0, 0, 70 - i * 16, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }); ctx.restore(); }
}
function kiranaShop(ctx, x, base, t) {
  S2rect(ctx, x, base - 330, 300, 330, '#fef3c7', 4);
  S2rect(ctx, x - 10, base - 360, 320, 70, '#dc2626', 8); ctx.fillStyle = '#fff'; ctx.font = '700 40px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KIRANA STORE', x + 150, base - 324);
  // striped awning
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x - 10 + i * 40, base - 290); ctx.lineTo(x + 30 + i * 40, base - 290); ctx.lineTo(x + 26 + i * 40, base - 236); ctx.quadraticCurveTo(x + 10 + i * 40, base - 222, x - 6 + i * 40, base - 236); ctx.closePath(); S2fill(ctx, i % 2 ? '#fff' : '#16a34a', 3); }
  S2rect(ctx, x + 20, base - 210, 260, 120, '#78350f', 4);
  const items = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.roundRect(x + 30 + i * 28, base - 200 + r * 56, 22, 44, 4); ctx.fillStyle = items[(i + r) % items.length]; ctx.fill(); }
  S2rect(ctx, x + 10, base - 90, 280, 90, '#b45309', 4);
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + 50 + i * 66, base - 96, 22, Math.PI, 0); S2fill(ctx, ['#fbbf24', '#f97316', '#84cc16', '#fda4af'][i], 3); }
}
function banyan(ctx, x, base, s = 1) {
  ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-30, -160, -20, -260); ctx.lineTo(24, -260); ctx.quadraticCurveTo(30, -160, 44, 0); ctx.closePath(); S2fill(ctx, '#8b5e3c');
  ctx.strokeStyle = 'rgba(90,60,40,.8)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-160 + i * 60, -300); ctx.lineTo(-150 + i * 60, -120 - (i % 3) * 30); ctx.stroke(); }
  ctx.beginPath(); [[-150, -330, 110], [-40, -390, 130], [90, -340, 120], [180, -290, 90], [-230, -280, 80], [20, -300, 110]].forEach(([a, b, r]) => { ctx.moveTo(a + r, b); ctx.arc(a, b, r, 0, Math.PI * 2); }); S2fill(ctx, '#5fae5a');
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(-60, -430, 70, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- full scenes ----------
function sceneTown(ctx, lt) { // Dharwad street, morning
  gradientBg(ctx, ['#9fd3ff', '#d9ecff', '#fff1d6']); clouds(ctx, lt, [240, 420]);
  sunRays(ctx, 900, 160, lt);
  ctx.fillStyle = '#b8d8a8'; ell(ctx, 300, 1010, 520, 110); ctx.fill(); ctx.fillStyle = '#a6cf95'; ell(ctx, 880, 1030, 480, 120); ctx.fill();
  banyan(ctx, 160, 1120, .95);
  tiledHouse(ctx, 300, 1160, 260, 300, '#fde7c8', '#c2410c', lt, { balcony: true });
  kiranaShop(ctx, 720, 1160, lt);
  pole(ctx, 620, 560, 1180); wires(ctx, -20, 620, 590, 60, lt); wires(ctx, 620, 1100, 590, 70, lt + 1);
  ctx.fillStyle = '#d6c3a5'; ctx.fillRect(0, 1160, W, H); ctx.fillStyle = '#c9b493'; ctx.fillRect(0, 1160, W, 18);
  ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(0, 1380); ctx.lineTo(W, 1380); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  autoRickshaw(ctx, 905 - Math.max(0, lt - 3) * 120, 1395, .75, true);
  atmosphere(ctx, 'warm');
}
function sceneHome(ctx, lt) {
  ctx.fillStyle = '#fbe9d4'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 120) ctx.fillRect(x, 0, 60, 1180);
  ctx.fillStyle = '#e8a87c'; ctx.fillRect(0, 1060, W, 24);
  // window with grill + curtains
  S2rect(ctx, 330, 330, 420, 360, '#bfe3ff', 10); ctx.fillStyle = 'rgba(58,37,48,.55)'; for (let x = 360; x < 750; x += 40) ctx.fillRect(x, 330, 4, 360); ctx.fillRect(330, 505, 420, 6);
  ctx.fillStyle = '#9fd18b'; ell(ctx, 450, 640, 90, 50); ctx.fill();
  const sw = Math.sin(lt * 1.2) * 6; S2rect(ctx, 290 + sw, 300, 80, 430, '#f472b6', 30); S2rect(ctx, 710 - sw, 300, 80, 430, '#f472b6', 30);
  S2rect(ctx, 280, 290, 520, 22, '#a16207', 8);
  // tube light, clock, calendar, photo
  S2rect(ctx, 400, 140, 280, 24, '#f8fafc', 12); ctx.fillStyle = 'rgba(255,255,230,.25)'; ell(ctx, 540, 200, 300, 70); ctx.fill();
  ctx.beginPath(); ctx.arc(150, 360, 56, 0, Math.PI * 2); S2fill(ctx, '#fff'); ctx.strokeStyle = '#3a2530'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 360); ctx.lineTo(150, 322); ctx.moveTo(150, 360); ctx.lineTo(176, 372); ctx.stroke();
  S2rect(ctx, 880, 300, 130, 170, '#fff', 4); S2rect(ctx, 880, 300, 130, 42, '#dc2626', 4); ctx.fillStyle = '#3a2530'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) ctx.fillRect(892 + c * 22, 358 + r * 26, 12, 12);
  S2rect(ctx, 90, 520, 150, 120, '#fef3c7', 6); ctx.fillStyle = '#fb7185'; heart(ctx, 165, 585, .7, '#fb7185');
  // floor + rug + sofa + side table
  ctx.fillStyle = '#d9a774'; ctx.fillRect(0, 1084, W, H); ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 150) ctx.fillRect(x, 1084, 5, H);
  S2rect(ctx, 650, 860, 400, 200, '#7c3aed', 30); S2rect(ctx, 630, 800, 440, 110, '#8b5cf6', 30); S2rect(ctx, 620, 880, 70, 180, '#6d28d9', 24); S2rect(ctx, 1010, 880, 70, 180, '#6d28d9', 24);
  S2rect(ctx, 60, 920, 160, 20, '#92400e', 4); ctx.fillStyle = '#92400e'; ctx.fillRect(80, 940, 12, 140); ctx.fillRect(188, 940, 12, 140);
  [100, 140, 175].forEach((x, i) => S2rect(ctx, x, 880 - i * 4, 28, 40 + i * 4, '#d4d4d8', 6, 3));
  ctx.save(); ctx.translate(540, 1330); ctx.scale(1, .28); ctx.beginPath(); ctx.arc(0, 0, 480, 0, Math.PI * 2); ctx.fillStyle = '#be185d'; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 400, 0, Math.PI * 2); ctx.fillStyle = '#f472b6'; ctx.fill(); ctx.restore();
  atmosphere(ctx, 'warm');
}
function sceneCollege(ctx, lt, name) {
  gradientBg(ctx, ['#a5d8ff', '#e0f0ff', '#fde7f3']); clouds(ctx, lt, [220, 380]);
  skyline(ctx, 980, .45);
  // main building with clock tower
  S2rect(ctx, 140, 640, 800, 440, '#fde3c3', 8);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) S2rect(ctx, 180 + i * 106, 680 + r * 120, 60, 80, '#bfdbfe', [30, 30, 4, 4], 3);
  S2rect(ctx, 460, 420, 160, 240, '#fcd9a8', 6); ctx.beginPath(); ctx.moveTo(440, 425); ctx.lineTo(540, 330); ctx.lineTo(640, 425); ctx.closePath(); S2fill(ctx, '#b91c1c');
  ctx.beginPath(); ctx.arc(540, 500, 46, 0, Math.PI * 2); S2fill(ctx, '#fff'); ctx.strokeStyle = '#3a2530'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(540, 500); ctx.lineTo(540, 468); ctx.moveTo(540, 500); ctx.lineTo(562, 510); ctx.stroke();
  // gate arch with sign
  S2rect(ctx, 30, 580, 80, 600, '#b45309', 6); S2rect(ctx, 970, 580, 80, 600, '#b45309', 6);
  S2rect(ctx, 0, 520, 1080, 100, '#9a3412', 10);
  ctx.fillStyle = '#fff7ed'; let f = 54; do { ctx.font = `700 ${f}px Fredoka, sans-serif`; f -= 2; } while (ctx.measureText(name).width > 980 && f > 20);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, 540, 572);
  // lawns, trees, path
  ctx.fillStyle = '#86c97a'; ctx.fillRect(0, 1160, W, H); ctx.fillStyle = '#e7d7bd'; ctx.beginPath(); ctx.moveTo(380, H); ctx.lineTo(480, 1160); ctx.lineTo(600, 1160); ctx.lineTo(700, H); ctx.fill();
  tree(ctx, 200, 1180, .8); tree(ctx, 880, 1180, .85);
  // distant students walking
  for (let i = 0; i < 4; i++) { const sx = ((lt * 40 + i * 270) % 1300) - 100; ctx.fillStyle = ['#60a5fa', '#f472b6', '#facc15', '#a78bfa'][i]; ctx.beginPath(); ctx.roundRect(sx, 1090, 22, 50, 8); ctx.fill(); ctx.fillStyle = '#3a2520'; ctx.beginPath(); ctx.arc(sx + 11, 1080, 12, 0, Math.PI * 2); ctx.fill(); }
  atmosphere(ctx);
}
function sceneCity(ctx, lt) {
  gradientBg(ctx, ['#93c5fd', '#dbeafe', '#fde2e4']); clouds(ctx, lt, [240, 400]);
  ctx.save(); ctx.translate(-((lt * 20) % 200), 0); skyline(ctx, 1040, .5, ['#b9c3e8', '#a8b4df', '#cbd3f2']); ctx.restore();
  skyline(ctx, 1120, 1, ['#8f9fd6', '#7d8ecb', '#a3b0e0']);
  // metro bridge + train
  S2rect(ctx, -20, 880, 1120, 40, '#cbd5e1', 6); for (let x = 60; x < 1080; x += 260) S2rect(ctx, x, 920, 40, 240, '#cbd5e1', 6);
  const mx = ((lt * 300) % 2200) - 1100; S2rect(ctx, mx, 806, 900, 76, '#e5e7eb', 20); ctx.fillStyle = '#7c3aed'; ctx.fillRect(mx + 10, 846, 880, 10); for (let i = 0; i < 8; i++) S2rect(ctx, mx + 30 + i * 108, 818, 70, 26, '#bae6fd', 6, 3);
  ctx.fillStyle = '#6b7280'; ctx.fillRect(0, 1160, W, H); ctx.fillStyle = '#fff'; for (let x = (-lt * 420) % 160; x < W; x += 160) ctx.fillRect(x, 1230, 80, 10);
  ctx.fillStyle = '#d6d3d1'; ctx.fillRect(0, 1290, W, H);
  autoRickshaw(ctx, ((lt * 260) % 1500) - 200, 1250, .55); scooter(ctx, 1000 - ((lt * 200) % 1300), 1255, '#f59e0b');
  atmosphere(ctx);
}
function sceneHostel(ctx, lt) {
  ctx.fillStyle = '#ece4ff'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { const x = 40 + i * 64, y = 260 + Math.sin(i * .8) * 26; ctx.fillStyle = `rgba(255,${190 + (i % 3) * 25},120,${.55 + .45 * Math.abs(Math.sin(lt * 3 + i))})`; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(58,37,48,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 250); for (let i = 0; i < 16; i++) ctx.lineTo(40 + i * 64, 260 + Math.sin(i * .8) * 26); ctx.stroke();
  S2rect(ctx, 120, 380, 180, 240, '#fda4af', 6); S2rect(ctx, 780, 400, 200, 150, '#93c5fd', 6); heart(ctx, 210, 500, 1, '#fff');
  ctx.fillStyle = '#cdb8f0'; ctx.fillRect(0, 1084, W, H);
  S2rect(ctx, 40, 820, 300, 90, '#f9a8d4', 20); S2rect(ctx, 40, 900, 300, 60, '#a16207', 6);
  S2rect(ctx, 740, 820, 300, 90, '#c4b5fd', 20); S2rect(ctx, 740, 900, 300, 60, '#a16207', 6);
  S2rect(ctx, 820, 660, 120, 150, '#f59e0b', 10);
  atmosphere(ctx, 'warm');
}
function scenePlatform(ctx, lt) {
  gradientBg(ctx, ['#c7d2fe', '#e0e7ff', '#fef3c7']);
  S2rect(ctx, -20, 520, 1120, 40, '#64748b', 4); for (let x = 80; x < 1080; x += 320) S2rect(ctx, x, 560, 24, 520, '#94a3b8', 4);
  S2rect(ctx, 300, 600, 480, 120, '#111827', 10); ctx.fillStyle = '#fbbf24'; ctx.font = '700 34px Fredoka, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('12627  BANGALORE  10:45  P2', 330, 650); ctx.fillText('17311  SHARED     11:05  P3', 330, 696);
  train(ctx, 80 - Math.max(0, lt - 2) * 80, 1080, '#6ea8fe');
  ctx.fillStyle = '#b8b2c6'; ctx.fillRect(0, 1100, W, H); ctx.fillStyle = '#fde047'; ctx.fillRect(0, 1100, W, 18);
  atmosphere(ctx);
}
