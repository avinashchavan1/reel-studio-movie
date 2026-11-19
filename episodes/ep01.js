// Episode 1: Two Strangers
window.EPISODE = { num: 1, title: 'Two Strangers', scenes: [

  { dur: 3.5, noBadge: true, draw(ctx, t) { // TITLE
    sky(ctx, t); hearts(ctx, t, 16, 1);
    ground(ctx, 1200, '#ffd1dc', '#ffc2d1');
    bigText(ctx, 'Strangers', W / 2, 430, 150, ease.back(prog(t, .1, .6)));
    bigText(ctx, 'to Forever', W / 2, 590, 130, ease.back(prog(t, .35, .6)), '#fff', C.lav);
    chip(ctx, 'EPISODE 1  ·  TWO STRANGERS', W / 2, 750, ease.back(prog(t, .8, .5)), C.ink, '#fff', 40);
    chibi(ctx, lerp(-200, 250, ease.out(prog(t, .2, 1.2))), 1250, 1.05, CAST.tara, { t, walking: t < 1.4 });
    chibi(ctx, lerp(1280, 830, ease.out(prog(t, .2, 1.2))), 1250, 1.05, CAST.kabir, { t, walking: t < 1.4, phase: 1 });
    bigText(ctx, '?', W / 2, 1020 + Math.sin(t * 4) * 10, 140, ease.back(prog(t, 1.6, .5)), '#fff', C.ink);
  } },

  { dur: 4.5, draw(ctx, t) { // HOMETOWN
    sky(ctx, t); hills(ctx, 1150);
    tree(ctx, 330, 1190, .9); tree(ctx, 760, 1180, .8);
    house(ctx, 40, 1200, 220, 170, '#fff1d6', '#ff9e9e');
    house(ctx, 820, 1200, 210, 160, '#e6f4ff', '#ffb347');
    ground(ctx, 1190, '#c5eab3', '#b6e2a1');
    ctx.fillStyle = '#f2dcb5'; ctx.beginPath(); ctx.moveTo(420, H); ctx.lineTo(500, 1190); ctx.lineTo(580, 1190); ctx.lineTo(700, H); ctx.fill();
    locationChip(ctx, 'Chandangaon', 400, prog(t, .3, .5));
    const walk = t < 1.7;
    chibi(ctx, lerp(-160, 540, ease.out(prog(t, 0, 1.7))), 1250, 1.15, CAST.tara, { t, walking: walk, wave: t > 1.9 });
    nameTag(ctx, 'Tara', 540, 735, prog(t, 1.8, .4));
    caption(ctx, 'Meet Tara, a shy small-town girl from Chandangaon.', t);
  } },

  { dur: 4.8, draw(ctx, t) { // THE DECISION
    room(ctx);
    chibi(ctx, 250, 1260, 1.1, CAST.tara, { t, expr: t > 1.5 ? 'sad' : 'happy', bag: false });
    chibi(ctx, 680, 1260, 1.1, CAST.amma, { t, phase: 2 });
    chibi(ctx, 900, 1260, 1.15, CAST.appa, { t, phase: 1 });
    bubble(ctx, 'Engineering it is!', 760, 560, 480, prog(t, .4, .45), [790, 760]);
    bubble(ctx, "...but I never wanted it", 280, 560, 440, prog(t, 1.8, .45), [250, 790], { thought: true, size: 42 });
    caption(ctx, 'Her parents had already decided her future.', t, { delay: .9 });
  } },

  { dur: 4.2, draw(ctx, t) { // TRAIN TO THE CITY
    sunsetSky(ctx, t);
    skyline(ctx, 1080, .55 + .45 * prog(t, 0, 3), ['#d6b8e8', '#c4a6e0', '#e6c8f0']);
    hills(ctx, 1120, '#c9a8d8', '#b898cc');
    ctx.fillStyle = '#9a86b0'; ctx.fillRect(0, 1130, W, 18); ctx.fillStyle = '#7a6890'; for (let x = (-t * 300) % 60; x < W; x += 60) ctx.fillRect(x, 1148, 30, 10);
    train(ctx, lerp(-700, 600, t / 4.2), 1130, '#ff8fab', { look: CAST.tara, t, expr: 'shock' });
    ground(ctx, 1180, '#b898cc', '#a888bc');
    locationChip(ctx, 'Next stop: Neelpur', 420, prog(t, 1.2, .5));
    caption(ctx, 'One suitcase, a lot of nerves, and a ticket to the big city.', t);
  } },

  { dur: 4.8, draw(ctx, t) { // COLLEGE DAY 1
    sky(ctx, t); skyline(ctx, 1000, .6);
    college(ctx, W / 2, 1180, 'SKYLINE INSTITUTE OF TECHNOLOGY');
    ground(ctx, 1190, '#c5eab3', '#b6e2a1');
    chibi(ctx, lerp(-180, 360, ease.out(prog(t, 0, 1.6))), 1260, 1.05, CAST.tara, { t, walking: t < 1.6, expr: t > 1.8 ? 'joy' : 'happy' });
    chibi(ctx, lerp(1260, 720, ease.out(prog(t, .2, 1.6))), 1260, 1.05, CAST.zoya, { t, walking: t < 1.8, wave: t > 1.9, phase: 2 });
    nameTag(ctx, 'Tara', 360, 780, prog(t, 1.9, .4));
    nameTag(ctx, 'Zoya · roommate', 720, 780, prog(t, 2.1, .4), '#8a6ae0');
    caption(ctx, 'Day 1 of engineering, with her roommate and new bestie, Zoya.', t, { accent: C.lav });
  } },

  { dur: 5, draw(ctx, t) { // SPLIT: DIFFERENT BLOCKS
    const sl = ease.out(prog(t, 0, .7)), sr = ease.out(prog(t, .5, .7));
    ctx.save(); ctx.translate(lerp(-W / 2, 0, sl), 0);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(580, 0); ctx.lineTo(500, H); ctx.lineTo(0, H); ctx.clip();
    gradientBg(ctx, ['#ffd6e7', '#ffe9f1']); hearts(ctx, t, 6, 7, .35);
    ground(ctx, 1190, '#ffc2d4'); chip(ctx, 'LOTUS BLOCK', 270, 470, 1, C.rose, '#fff', 40); chip(ctx, 'Section 7', 270, 560, 1, '#fff', C.rose, 34);
    chibi(ctx, 270, 1260, 1, CAST.tara, { t }); nameTag(ctx, 'Tara', 270, 800, prog(t, 1, .4));
    ctx.restore();
    ctx.save(); ctx.translate(lerp(W / 2, 0, sr), 0);
    ctx.beginPath(); ctx.moveTo(588, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(508, H); ctx.clip();
    gradientBg(ctx, ['#cde9ff', '#e6f3ff']);
    ground(ctx, 1190, '#a9d3ff'); chip(ctx, 'ORCHID BLOCK', 810, 470, 1, '#4a7fd8', '#fff', 40); chip(ctx, 'Section 1', 810, 560, 1, '#fff', '#4a7fd8', 34);
    chibi(ctx, 810, 1260, 1, CAST.kabir, { t, expr: 'smirk', phase: 1 }); nameTag(ctx, 'Kabir', 810, 800, prog(t, 1.5, .4), '#4a7fd8');
    ctx.restore();
    caption(ctx, 'Same college. Different blocks. Total strangers.', t, { delay: 1.4 });
  } },

  { dur: 5.2, noBadge: true, draw(ctx, t) { // CLIFFHANGER
    nightSky(ctx, t); hearts(ctx, t, 8, 21, .35);
    ctx.globalAlpha = prog(t, .2, .6); wifi(ctx, W / 2, 760, t, 1.2); ctx.globalAlpha = 1;
    bigText(ctx, 'But one tiny thing', W / 2, 1000, 72, ease.back(prog(t, .6, .5)), '#fff', '#45337a');
    bigText(ctx, 'was about to change', W / 2, 1100, 72, ease.back(prog(t, 1.1, .5)), '#fff', '#45337a');
    bigText(ctx, 'EVERYTHING...', W / 2, 1220, 100, ease.back(prog(t, 1.7, .5)), '#fff', C.rose);
    chip(ctx, 'NEXT  ·  EP 2: THE SMARTPHONE', W / 2, 1420, ease.back(prog(t, 2.6, .5)), C.rose, '#fff', 40);
    chip(ctx, 'Follow so you don\'t miss it', W / 2, 1530, ease.back(prog(t, 3.1, .5)), 'rgba(255,255,255,.9)', C.ink, 34);
  } },
] };
