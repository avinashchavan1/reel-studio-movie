// Data-driven reel renderer. window.boot(spec) then window.renderFrame(t) → data URL.
let SPEC = null; const CH = {}, PL = {};
const ctx = document.getElementById('c').getContext('2d');
const EXPR = { sad: 'sad', happy: 'joy', shocked: 'shock', firm: 'smirk', blush: 'blush', angry: 'sad', neutral: 'happy' };

window.boot = async spec => {
  SPEC = spec;
  const fonts = [['Fredoka', '../../fonts/Fredoka-600.woff2', 600], ['Fredoka', '../../fonts/Fredoka-700.woff2', 700],
    ['NotoDeva', '../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-600-normal.woff2', 600],
    ['NotoDeva', '../node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2', 700]];
  for (const [fam, url, w] of fonts) { try { document.fonts.add(await new FontFace(fam, `url(${url})`, { weight: String(w) }).load()); } catch (e) { console.warn('font', url, e); } }
  spec.characters.forEach(c => { CH[c.id] = c; });
  spec.places.forEach(p => { PL[p.id] = p; });
  // AI-drawn shot art (local Z-Image), served from studio/data/media
  await Promise.all(spec.shots.filter(s => s.image).map(s => new Promise(res => {
    const im = new Image(); im.onload = () => { IMG[s.id] = im; res(); }; im.onerror = () => { console.warn('image missing', s.image); res(); };
    im.src = s.imageData || '../data' + s.image;
  })));
  window.READY = true;
};

// ---------- painted shots: camera move + light + grading ----------
const IMG = {};
const MOVES = { // [scale0, scale1, dx0, dx1, dy0, dy1] (offsets as a share of the frame)
  in: [1.03, 1.14, 0, 0, 0, 0], out: [1.16, 1.04, 0, 0, 0, 0],
  left: [1.13, 1.13, .045, -.045, 0, 0], right: [1.13, 1.13, -.045, .045, 0, 0],
  up: [1.13, 1.13, 0, 0, .04, -.04], down: [1.13, 1.13, 0, 0, -.04, .04],
};
function photo(shot, lt) {
  const im = IMG[shot.id], p = shot.params || {}, m = MOVES[p.move || 'in'];
  const q = clamp(lt / shot.dur), e = q * q * (3 - 2 * q);
  const s = lerp(m[0], m[1], e), dx = lerp(m[2], m[3], e) * W, dy = lerp(m[4], m[5], e) * H;
  const shake = p.shake ? Math.sin(lt * 31) * 2.2 + Math.sin(lt * 17) * 1.4 : 0;
  const base = Math.max(W / im.width, H / im.height), dw = im.width * base * s, dh = im.height * base * s;
  const x = (W - dw) / 2 + dx, y = (H - dh) / 2 + dy + shake;
  ctx.drawImage(im, x, y, dw, dh);
  if (p.blur) { // hide AI pseudo-text (e.g. the admission letter)
    const [x0, y0, x1, y1] = p.blur; ctx.save(); ctx.beginPath(); ctx.rect(x + x0 * dw, y + y0 * dh, (x1 - x0) * dw, (y1 - y0) * dh); ctx.clip();
    ctx.filter = 'blur(10px)'; ctx.drawImage(im, x, y, dw, dh); ctx.filter = 'none'; ctx.restore();
  }
  if (p.glow) { // pulsing light source (wifi icon, phone screen)
    const [gx, gy, col] = p.glow, k = .55 + .45 * Math.sin(lt * 4.5);
    const g = ctx.createRadialGradient(x + gx * dw, y + gy * dh, 0, x + gx * dw, y + gy * dh, 260);
    g.addColorStop(0, `rgba(${col || '120,220,255'},${.42 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // drifting light motes
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const r = Math.sin(i * 91.7) * .5 + .5, r2 = Math.sin(i * 37.3) * .5 + .5;
    const mx = (r * W + Math.sin(lt * .6 + i) * 30) % W, my = H - ((r2 * H + lt * (24 + r * 30)) % H);
    const a = .10 + .14 * (Math.sin(lt * 2 + i) * .5 + .5), rad = 2 + r2 * 4;
    ctx.fillStyle = `rgba(255,240,215,${a})`; ctx.beginPath(); ctx.arc(mx, my, rad, 0, 7); ctx.fill();
  }
  ctx.restore();
  // grading: soft vignette + darker bottom for captions
  const v = ctx.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,5,25,.38)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const b = ctx.createLinearGradient(0, H * .62, 0, H); b.addColorStop(0, 'rgba(10,5,25,0)'); b.addColorStop(1, 'rgba(10,5,25,.5)');
  ctx.fillStyle = b; ctx.fillRect(0, H * .62, W, H * .38);
  if (shot.template === 'cliffhanger') { ctx.fillStyle = `rgba(10,5,25,${.45 * prog(lt, .3, .8)})`; ctx.fillRect(0, 0, W, H); }
}
function paintedDialogue(shot, t) {
  const line = activeLine(shot, t); if (!line || !line.text) return;
  if (shot.template === 'cliffhanger' && line.speaker === 'narrator') return; // the big cliffhanger text already says it
  const lt = t - line.start, y = 1500;
  caption(ctx, line.text, lt, { delay: 0, accent: CH[line.speaker]?.color || C.pink, y });
  if (line.speaker !== 'narrator' && CH[line.speaker]) chip(ctx, CH[line.speaker].name, 230, y - 118, ease.back(prog(lt, 0, .3)), CH[line.speaker].color || C.rose, '#fff', 32);
}

const LOOK2 = { tara: 'ishita', kabir: 'vihaan', zoya: 'zoya', pihu: 'tanvi', appa: 'appa', amma: 'amma' };
const lookOf = id => { const c = CH[id]; if (!c || !c.look) return null; return CAST2[c.look] || CAST2[LOOK2[c.look]] || null; };
const emoOf = (shot, id, t) => { const said = shot.lines.filter(l => l.speaker === id && l.start <= t); return said.length ? said[said.length - 1].emotion || 'neutral' : 'neutral'; };
const activeLine = (shot, t) => shot.lines.find(l => t >= l.start && t < l.end);
function talkAmount(line, t) {
  if (!line) return 0;
  const i = Math.floor((t - line.start) * 30);
  if (line.env && line.env.length) return line.env[Math.min(i, line.env.length - 1)] || 0;
  return 0.35 + 0.35 * Math.sin(t * 22) * Math.sin(t * 7); // no audio yet: fake chatter
}
function moodOf(shot, id, t) { // last emotion this character expressed in the shot
  const said = shot.lines.filter(l => l.speaker === id && l.start <= t);
  const e = said.length ? said[said.length - 1].emotion : 'neutral';
  return EXPR[e] || 'happy';
}

// ---------- backgrounds ----------
function bg(scene, lt, place) {
  switch (scene) {
    case 'town': sceneTown(ctx, lt); break;
    case 'room': sceneHome(ctx, lt); break;
    case 'hostel': sceneHostel(ctx, lt); break;
    case 'city': sceneCity(ctx, lt); break;
    case 'college': sceneCollege(ctx, lt, (place?.name || 'COLLEGE').toUpperCase()); break;
    case 'station': scenePlatform(ctx, lt); break;
    case 'night': nightSky(ctx, lt); atmosphere(ctx, 'night'); break;
    default: sky(ctx, lt); ground(ctx, 1200, '#ffd1dc', '#ffc2d1');
  }
}

function castRow(shot, t, lt, y = 1300, scaleOverride) {
  const ids = (shot.characters || []).filter(lookOf); const n = ids.length; const line = activeLine(shot, t); const pos = {};
  ids.forEach((id, i) => { pos[id] = n === 1 ? 540 : 210 + i * (660 / (n - 1)); });
  const s0 = scaleOverride || (n === 1 ? 1.12 : n === 2 ? 1.05 : .92);
  ids.forEach((id, i) => {
    const x = pos[id]; const speaking = line && line.speaker === id;
    const target = line && pos[line.speaker] !== undefined && !speaking ? pos[line.speaker] : (n > 1 ? 540 : x);
    const look = Math.max(-1, Math.min(1, (target - x) / 200));
    const enter = ease.out(prog(lt, i * .12, .6));
    ctx.globalAlpha = enter;
    hero(ctx, x, y + (1 - enter) * 60, s0, lookOf(id), { t: lt, phase: i * 1.3, emo: emoOf(shot, id, t), talk: speaking ? talkAmount(line, t) : 0, look,
      pose: shot.params?.wave === id && lt > .6 && lt < 2.6 ? 'wave' : undefined });
    ctx.globalAlpha = 1;
  });
  return pos;
}

// ---------- templates (world layer) ----------
const T = {
  hook(shot, t, lt) {
    gradientBg(ctx, ['#2a1f5c', '#6b3fa0', '#ff7aa8']); hearts(ctx, lt, 14, 5, .45);
    const pos = castRow({ ...shot, characters: shot.characters.slice(0, 2) }, t, lt, 1340, .84);
    if (Object.keys(pos).length === 2) { const k = .9 + .12 * Math.sin(lt * 6); heart(ctx, W / 2, 1060, 1.3 * k, C.rose); }
    wifi(ctx, W / 2, 930, lt, .4);
  },
  scene(shot, t, lt) {
    const place = PL[shot.location]; bg(place?.scene, lt, place);
    castRow(shot, t, lt);
    if (shot.params?.showLocation && place) locationChip(ctx, place.name, 420, prog(lt, .2, .5));
  },
  train(shot, t, lt) {
    sunsetSky(ctx, lt);
    skyline(ctx, 1080, .55 + .45 * prog(lt, 0, 3), ['#d6b8e8', '#c4a6e0', '#e6c8f0']);
    hills(ctx, 1120, '#c9a8d8', '#b898cc');
    ctx.fillStyle = '#9a86b0'; ctx.fillRect(0, 1130, W, 18); ctx.fillStyle = '#7a6890'; for (let x = (-lt * 300) % 60; x < W; x += 60) ctx.fillRect(x, 1148, 30, 10);
    const who = lookOf(shot.characters[0]); const line = activeLine(shot, t);
    train(ctx, lerp(-700, 520, Math.min(1, lt / Math.max(shot.dur, 3))), 1130, '#ff8fab', null);
    if (who) { const tx = lerp(-700, 520, Math.min(1, lt / Math.max(shot.dur, 3))) + 40 + 3 * 130; ctx.save(); ctx.beginPath(); ctx.roundRect(tx, 1130 - 145, 96, 70, 14); ctx.clip(); hero(ctx, tx + 48, 1130 + 150, .3, who, { t: lt, emo: emoOf(shot, shot.characters[0], t), look: .6 }); ctx.restore(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.roundRect(tx, 1130 - 145, 96, 70, 14); ctx.stroke(); }
    ground(ctx, 1180, '#b898cc', '#a888bc');
    const place = PL[shot.location]; if (place) locationChip(ctx, place.name, 420, prog(lt, .4, .5));
  },
  split(shot, t, lt) {
    const [a, b] = shot.characters; const p = shot.params || {};
    const sl = ease.out(prog(lt, 0, .6)), sr = ease.out(prog(lt, .35, .6));
    const side = (id, clipPts, colors, gcol, accent, lab, x, off) => {
      ctx.save(); ctx.translate(off, 0); ctx.beginPath(); clipPts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip();
      gradientBg(ctx, colors); ground(ctx, 1190, gcol);
      if (lab) { chip(ctx, lab.label || '', x, 470, 1, accent, '#fff', 40); if (lab.sub) chip(ctx, lab.sub, x, 560, 1, '#fff', accent, 34); }
      if (lookOf(id)) { const line = activeLine(shot, t); hero(ctx, x, 1300, .95, lookOf(id), { t: lt, phase: x, emo: emoOf(shot, id, t), talk: line?.speaker === id ? talkAmount(line, t) : 0, look: x < 540 ? .3 : -.3 });
        nameTag(ctx, CH[id].name, x, 640, prog(lt, .9, .4), accent); }
      ctx.restore();
    };
    side(a, [[0, 0], [580, 0], [500, H], [0, H]], ['#ffd6e7', '#ffe9f1'], '#ffc2d4', C.rose, p.left, 270, lerp(-W / 2, 0, sl));
    side(b, [[588, 0], [W, 0], [W, H], [508, H]], ['#cde9ff', '#e6f3ff'], '#a9d3ff', '#4a7fd8', p.right, 810, lerp(W / 2, 0, sr));
  },
  cliffhanger(shot, t, lt) {
    nightSky(ctx, lt); hearts(ctx, lt, 8, 21, .35);
    ctx.globalAlpha = prog(lt, .1, .5); wifi(ctx, W / 2, 620, lt, 1.1); ctx.globalAlpha = 1;
  },
};

// ---------- UI layer (not affected by camera) ----------
function hookText(text, lt) {
  ctx.save(); ctx.font = '700 86px Fredoka, NotoDeva, sans-serif';
  const lines = wrap(ctx, text, 900);
  lines.forEach((ln, i) => bigText(ctx, ln, W / 2, 470 + i * 112, 86, ease.back(prog(lt, i * .12, .3)), '#fff', C.rose));
  ctx.restore();
}
function cliffText(shot, lt) {
  const p = shot.params || {}; const lines = p.text || [];
  lines.forEach((ln, i) => { let size = i === lines.length - 1 ? 84 : 70; ctx.font = `700 ${size}px Fredoka, NotoDeva, sans-serif`;
    while (ctx.measureText(ln).width * 1.1 > 960 && size > 40) { size -= 4; ctx.font = `700 ${size}px Fredoka, NotoDeva, sans-serif`; }
    bigText(ctx, ln, W / 2, 860 + i * 100, size, ease.back(prog(lt, .4 + i * .5, .5)), '#fff', i === lines.length - 1 ? C.rose : '#45337a'); });
  const ny = 860 + lines.length * 100 + 50, nk = .6 + lines.length * .5;
  if (p.next) chip(ctx, 'NEXT  ·  ' + p.next, W / 2, ny, ease.back(prog(lt, nk, .5)), '#45337a', '#fff', 36);
  if (SPEC.cta) ctaButton(SPEC.cta, W / 2, ny + 120, prog(lt, nk + .4, .5), lt);
}
// platform call-to-action: Instagram "+ FOLLOW", YouTube "🔔 SUBSCRIBE"
function ctaButton(cta, x, y, k, lt) {
  if (k <= 0) return; const pulse = 1 + .05 * Math.sin(lt * 7);
  ctx.save(); ctx.translate(x, y); ctx.scale(ease.back(k) * pulse, ease.back(k) * pulse);
  ctx.font = '700 46px Fredoka, NotoDeva, sans-serif'; const tw = ctx.measureText(cta.text).width, w = tw + 150, hh = 104;
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  rr(ctx, -w / 2, -hh / 2, w, hh, hh / 2);
  if (cta.icon === 'plus') { const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#feda75'); g.addColorStop(.35, '#fa7e1e'); g.addColorStop(.65, '#d62976'); g.addColorStop(1, '#962fbf'); ctx.fillStyle = g; }
  else ctx.fillStyle = cta.color;
  ctx.fill(); ctx.shadowColor = 'transparent';
  const ix = -w / 2 + 62; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  if (cta.icon === 'plus') { ctx.beginPath(); ctx.moveTo(ix - 18, 0); ctx.lineTo(ix + 18, 0); ctx.moveTo(ix, -18); ctx.lineTo(ix, 18); ctx.stroke(); }
  else { const sw = Math.sin(lt * 12) * .25; ctx.save(); ctx.translate(ix, -4); ctx.rotate(sw); ctx.beginPath(); ctx.moveTo(-20, 14); ctx.quadraticCurveTo(-20, -22, 0, -22); ctx.quadraticCurveTo(20, -22, 20, 14); ctx.closePath(); ctx.fill(); ctx.fillRect(-24, 12, 48, 7); ell(ctx, 0, 24, 7, 7); ctx.fill(); ctx.restore(); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(cta.text, ix + 42, 3);
  // tap hand hint
  const tx = w / 2 - 20 + Math.sin(lt * 5) * 8, ty = 40 + Math.abs(Math.sin(lt * 5)) * 10;
  ctx.fillStyle = '#fff'; ell(ctx, tx, ty, 22, 22); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
  ctx.restore();
}
function banner(ep) {
  ctx.save(); ctx.font = '700 40px Fredoka, NotoDeva, sans-serif';
  const a = 'Strangers to ', b = 'Forever', wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, w = wa + wb + 70;
  rr(ctx, W / 2 - w / 2, 214, w, 76, 18); ctx.fillStyle = '#0b1a7a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(a, W / 2 - w / 2 + 35, 254); ctx.fillStyle = '#ffc93c'; ctx.fillText(b, W / 2 - w / 2 + 35 + wa, 254);
  chip(ctx, `EP ${ep.num}`, W / 2 + w / 2 - 10, 300, 1, C.rose, '#fff', 26);
  ctx.restore();
}
function dialogue(shot, t, pos) {
  const line = activeLine(shot, t); if (!line || !line.text) return;
  const lt = t - line.start;
  if (line.speaker === 'narrator' || pos[line.speaker] === undefined) {
    caption(ctx, line.text, lt, { delay: 0, accent: shot.template === 'cliffhanger' ? C.lav : C.pink, y: shot.template === 'cliffhanger' ? 1560 : 1470 });
  } else {
    const x = Math.max(330, Math.min(750, pos[line.speaker]));
    bubble(ctx, line.text, x, 455, 640, prog(lt, 0, .25), [pos[line.speaker], 560], { size: 44 });
    chip(ctx, CH[line.speaker]?.name || '', x - 250, 370, ease.back(prog(lt, 0, .3)), CH[line.speaker]?.color || C.rose, '#fff', 30);
  }
}
function speakerPositions(shot) {
  if (shot.template === 'split') return { [shot.characters[0]]: 270, [shot.characters[1]]: 810 };
  if (shot.template === 'train' || shot.template === 'cliffhanger') return {};
  const ids = (shot.characters || []).filter(lookOf); const n = ids.length; const pos = {};
  const list = shot.template === 'hook' ? ids.slice(0, 2) : ids;
  list.forEach((id, i) => { pos[id] = list.length === 1 ? 540 : 210 + i * (660 / (list.length - 1)); });
  return pos;
}

window.renderFrame = (t, fmt = 'image/jpeg') => {
  const shots = SPEC.shots; let i = shots.findIndex(s => t < s.start + s.dur); if (i < 0) i = shots.length - 1;
  const shot = shots[i], lt = t - shot.start;
  if (IMG[shot.id]) { // painted shot
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); photo(shot, lt);
    const place = PL[shot.location]; if (shot.params?.showLocation && place) locationChip(ctx, place.name, 420, prog(lt, .2, .5));
    if (shot.template === 'hook' && shot.params?.hook) hookText(shot.params.hook, lt);
    if (shot.template === 'cliffhanger') cliffText(shot, lt);
    paintedDialogue(shot, t);
    banner(SPEC.episode);
    const fin = i === 0 ? 1 : clamp(lt / .3), fout = i === shots.length - 1 ? clamp((shot.dur - lt) / .5) : clamp((shot.dur - lt) / .3);
    const a = 1 - Math.min(fin, fout); if (a > 0) { ctx.fillStyle = `rgba(8,4,20,${a})`; ctx.fillRect(0, 0, W, H); }
    return ctx.canvas.toDataURL(fmt, .92);
  }
  ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const z = 1 + 0.045 * Math.min(1, lt / shot.dur); // slow push-in on every shot
  ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-W / 2, -H * 0.55);
  (T[shot.template] || T.scene)(shot, t, lt);
  ctx.restore();
  if (shot.template === 'hook' && shot.params?.hook) hookText(shot.params.hook, lt);
  if (shot.template === 'cliffhanger') cliffText(shot, lt);
  dialogue(shot, t, speakerPositions(shot));
  banner(SPEC.episode);
  const fin = i === 0 ? 1 : clamp(lt / .22), fout = i === shots.length - 1 ? clamp((shot.dur - lt) / .5) : clamp((shot.dur - lt) / .22);
  const a = 1 - Math.min(fin, fout);
  if (a > 0) { ctx.fillStyle = `rgba(255,236,244,${a})`; ctx.fillRect(0, 0, W, H); }
  return ctx.canvas.toDataURL(fmt, .92);
};
