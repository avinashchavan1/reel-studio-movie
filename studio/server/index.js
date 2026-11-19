import './net.js';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { load, update, newId, findEpisode, MEDIA, ROOT, REPO, mediaUrl } from './store.js';
import { anonymize, findLeaks, getNameMap, setNameMap, scanEpisode } from './privacy.js';
import { elevenlabs, duration, envelope, MOODS } from './audio.js';
import { buildTimeline, musicPlan, enqueue, jobs, renderEpisode, VARIANTS } from './render.js';
import { viralReport } from './viral.js';
import { stageOf } from './stage.js';
import { PLATFORMS, getSettings, setSettings, integrationStatus, youtubeAuthUrl, youtubeCallback, publishTo, exportPack } from './publish.js';

const PORT = Number(process.env.PORT || process.env.STUDIO_PORT || 5174);
const app = express();
app.use(express.json({ limit: '5mb' }));

// Password lock for deployed studios: set STUDIO_PASSWORD. Rendered videos stay fetchable
// (Instagram downloads them from a public URL; file names are unguessable).
if (process.env.STUDIO_PASSWORD) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/media/renders/')) return next();
    const [, b64] = (req.headers.authorization || '').split(' ');
    const [, pass] = Buffer.from(b64 || '', 'base64').toString().split(':');
    if (pass === process.env.STUDIO_PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="Reel Studio"').status(401).send('Password required');
  });
}
app.use('/media', express.static(MEDIA));
app.use('/engine', express.static(path.join(REPO, 'engine')));   // lets the UI preview characters with the same engine
app.use('/fonts', express.static(path.join(REPO, 'fonts')));

const h = fn => async (req, res) => {
  try { res.json(await fn(req, res)); }
  catch (e) { console.error(e); res.status(e.status || 500).json({ error: e.message }); }
};
const bad = msg => Object.assign(new Error(msg), { status: 400 });

// ---------- project ----------
// sections added after v1 get defaults here so older project files keep working
const DOC_DEFAULTS = {
  notes: '',
  activity: [],
  brand: { channel: 'Strangers to Forever', series: 'Strangers to Forever', edition: 'Season 1 · College days', tagline: 'From strangers to lifetime partners', cta: 'Follow for the next part 💕',
    palette: ['#ff8fab', '#6ea8fe', '#b69cff', '#0b1a7a', '#ffc93c'], loudness: '-14 LUFS (Instagram / YouTube)', category: 'Digital creator', keywords: ['love story', 'animated story', 'college love', 'hinglish story', 'engineering love', 'bangalore'], playlist: 'Strangers to Forever (in order)' },
  plan: { items: [] },
  calendar: [],
  world: { relations: [
    { a: 'ishita', b: 'vihaan', label: 'strangers → lifetime partners' }, { a: 'ishita', b: 'zoya', label: 'roommate & best friend' },
    { a: 'ishita', b: 'tanvi', label: 'classmate (borrowed the hotspot)' }, { a: 'ishita', b: 'appa', label: 'father' }, { a: 'ishita', b: 'amma', label: 'mother' },
  ] },
  profiles: {
    instagram: { handle: '', displayName: 'Strangers to Forever', bio: 'Our love story, one reel at a time 💕\nFrom strangers in engineering college to forever\n👇 Start from Part 1', link: '', checklist: {} },
    youtube: { handle: '', displayName: 'Strangers to Forever', bio: 'An animated Hinglish love story told in Shorts. From strangers to lifetime partners. New part every few days. Subscribe 🔔', link: '', checklist: {} },
    facebook: { handle: '', displayName: '', bio: '', link: '', checklist: {} },
    moj: { handle: '', displayName: '', bio: '', link: '', checklist: {} },
  },
  stats: [],
  style: {
    captionTemplates: [
      { id: 't1', name: 'Hook + question', text: '{hook} 💕 Part {num} of our story. {question} 👇' },
      { id: 't2', name: 'POV', text: 'POV: {hook} 😭 Part {num}. Would you have done the same? 👇' },
      { id: 't3', name: 'Callback', text: 'Last part: {previous}… aaj kuch aur hua 👀 Part {num}' },
    ],
    hashtagSets: [
      { id: 'h1', name: 'Core series', tags: ['StrangersToForever', 'lovestory', 'animatedstory', 'hinglishstory', 'reels'] },
      { id: 'h2', name: 'College love', tags: ['collegelove', 'engineeringlove', 'collegelovestory', 'hostellife', 'bangalorelove'] },
      { id: 'h3', name: 'Romance reach', tags: ['couplegoals', 'strangerstolovers', 'lovestorytime', 'cutecouple', 'trendingreels'] },
    ],
  },
};
const withDefaults = p => { for (const [k, v] of Object.entries(DOC_DEFAULTS)) if (p[k] === undefined) p[k] = JSON.parse(JSON.stringify(v)); return p; };
const logActivity = (p, text) => { p.activity = [{ at: new Date().toISOString(), text }, ...(p.activity || [])].slice(0, 200); };
app.get('/api/project', h(() => {
  const p = load(); if (!p) throw Object.assign(new Error('No project yet. Run: npm run seed'), { status: 404 });
  withDefaults(p);
  const episodes = p.episodes.map(e => ({ ...e, code: `STF-${String(e.num).padStart(2, '0')}`, stage: stageOf(e) }));
  return { ...p, episodes, moods: MOODS, platforms: PLATFORMS, variants: VARIANTS };
}));
app.put('/api/doc/:key', h(req => {
  if (!(req.params.key in DOC_DEFAULTS)) throw bad('unknown section');
  return update(p => { withDefaults(p); p[req.params.key] = req.body; return p[req.params.key]; });
}));
// review gate + posting status + plan ideas
app.post('/api/episodes/:id/review', h(req => update(p => { withDefaults(p); const ep = findEpisode(p, req.params.id);
  ep.review = { checked: !!req.body.checked, at: new Date().toISOString() }; logActivity(p, `${req.body.checked ? 'Story checked' : 'Story check removed'} · Ep ${ep.num} ${ep.title}`); return ep.review; })));
app.post('/api/episodes/:id/post', h(req => update(p => { withDefaults(p); const ep = findEpisode(p, req.params.id); const pl = req.body.platform;
  if (!ep.review?.checked && req.body.posted) throw bad('Tick the story check first');
  ep.posts = ep.posts || {};
  if (req.body.posted) { ep.posts[pl] = { state: 'posted', url: req.body.url || '', at: new Date().toISOString() }; logActivity(p, `Posted on ${PLATFORMS[pl]?.name || pl} · Ep ${ep.num} ${ep.title}`); }
  else { delete ep.posts[pl]; logActivity(p, `Marked not posted on ${PLATFORMS[pl]?.name || pl} · Ep ${ep.num}`); }
  ep.status = Object.keys(ep.posts).length ? 'published' : ep.render ? 'rendered' : ep.status; return ep.posts; })));
app.post('/api/plan', h(req => update(p => { withDefaults(p); const num = Math.max(0, ...p.episodes.map(e => e.num), ...p.plan.items.map(i => i.num)) + 1;
  const it = { id: newId('pl_'), num, title: req.body.title, where: req.body.where || '', beats: req.body.beats || '', status: 'idea', at: new Date().toISOString() };
  p.plan.items.push(it); logActivity(p, `Added to the plan · ${it.title}`); return it; })));
app.delete('/api/plan/:id', h(req => update(p => { withDefaults(p); p.plan.items = p.plan.items.filter(i => i.id !== req.params.id); return { ok: true }; })));

app.get('/api/backup', (req, res) => { res.set('Content-Disposition', `attachment; filename="studio-backup-${new Date().toISOString().slice(0, 10)}.json"`); res.json(withDefaults(load())); });
app.put('/api/series', h(req => update(p => { p.series = { ...p.series, ...req.body }; return p.series; })));

// generic CRUD for list collections
for (const coll of ['characters', 'places', 'knowledge']) {
  app.post(`/api/${coll}`, h(req => update(p => { const item = { id: newId(coll[0] + '_'), ...req.body }; p[coll].push(item); return item; })));
  app.put(`/api/${coll}/:id`, h(req => update(p => { const i = p[coll].findIndex(x => x.id === req.params.id); if (i < 0) throw bad('not found'); p[coll][i] = { ...p[coll][i], ...req.body, id: req.params.id }; return p[coll][i]; })));
  app.delete(`/api/${coll}/:id`, h(req => update(p => { p[coll] = p[coll].filter(x => x.id !== req.params.id); return { ok: true }; })));
}

// ---------- story inbox (auto-anonymized) ----------
app.post('/api/anonymize', h(req => anonymize(req.body.text || '')));
app.post('/api/stories', h(req => update(p => {
  const { text, replaced } = anonymize(req.body.text || '');
  const s = { id: newId('s_'), createdAt: new Date().toISOString(), text, tags: req.body.tags || [], replaced: replaced.map(r => r.series), status: 'new' };
  p.stories.unshift(s); return s;
})));
app.put('/api/stories/:id', h(req => update(p => {
  const s = p.stories.find(x => x.id === req.params.id); if (!s) throw bad('not found');
  if (req.body.text !== undefined) s.text = anonymize(req.body.text).text;
  for (const k of ['tags', 'status']) if (req.body[k] !== undefined) s[k] = req.body[k];
  return s;
})));
app.delete('/api/stories/:id', h(req => update(p => { p.stories = p.stories.filter(x => x.id !== req.params.id); return { ok: true }; })));

// ---------- "Ask Claude" queue (Claude Code picks these up) ----------
app.post('/api/claude-requests', h(req => update(p => {
  const r = { id: newId('cr_'), createdAt: new Date().toISOString(), kind: req.body.kind || 'write-episode', storyIds: req.body.storyIds || [], episodeId: req.body.episodeId || null, note: req.body.note || '', status: 'pending' };
  p.claudeRequests.unshift(r); return r;
})));
app.put('/api/claude-requests/:id', h(req => update(p => { const r = p.claudeRequests.find(x => x.id === req.params.id); if (!r) throw bad('not found'); Object.assign(r, req.body); return r; })));
app.delete('/api/claude-requests/:id', h(req => update(p => { p.claudeRequests = p.claudeRequests.filter(x => x.id !== req.params.id); return { ok: true }; })));

// ---------- episodes ----------
const blankEpisode = (num) => ({
  id: newId('ep_'), num, title: `Episode ${num}`, synopsis: '', status: 'draft', createdAt: new Date().toISOString(),
  shots: [
    { id: newId('sh_'), template: 'hook', location: '', characters: [], mood: 'tension', minDuration: 2.5, params: { hook: '' }, lines: [] },
    { id: newId('sh_'), template: 'cliffhanger', location: '', characters: [], mood: 'cliffhanger', minDuration: 4, params: { text: [], next: `EP ${num + 1}` }, lines: [] },
  ],
  publish: { caption: '', hashtags: [], youtubeTitle: '', youtubePrivacy: 'public', history: [], scheduled: [] },
});
app.post('/api/episodes', h(req => update(p => {
  const num = req.body.num || (Math.max(0, ...p.episodes.map(e => e.num)) + 1);
  const ep = { ...blankEpisode(num), ...req.body, num }; p.episodes.push(ep); p.episodes.sort((a, b) => a.num - b.num); return ep;
})));
app.put('/api/episodes/:id', h(req => update(p => {
  const ep = findEpisode(p, req.params.id);
  for (const k of ['title', 'synopsis', 'status', 'shots', 'publish', 'num', 'musicVolume']) if (req.body[k] !== undefined) ep[k] = req.body[k];
  ep.updatedAt = new Date().toISOString(); return ep;
})));
app.delete('/api/episodes/:id', h(req => update(p => { p.episodes = p.episodes.filter(e => e.id !== req.params.id); return { ok: true }; })));
app.post('/api/episodes/:id/duplicate', h(req => update(p => {
  const src = findEpisode(p, req.params.id); const copy = JSON.parse(JSON.stringify(src));
  copy.id = newId('ep_'); copy.num = Math.max(...p.episodes.map(e => e.num)) + 1; copy.title += ' (copy)'; copy.status = 'draft'; delete copy.render; delete copy.music;
  copy.publish = { ...copy.publish, history: [], scheduled: [] }; p.episodes.push(copy); return copy;
})));

app.get('/api/episodes/:id/analysis', h(req => {
  const p = load(); const ep = findEpisode(p, req.params.id); const tl = buildTimeline(p, ep);
  return { duration: tl.total, shots: tl.shots.map(s => ({ id: s.id, start: s.start, dur: s.dur })), viral: viralReport(ep, tl), leaks: scanEpisode(ep) };
}));

// ---------- voices ----------
const charById = (p, id) => p.characters.find(c => c.id === id);
async function voiceLine(epId, shotId, lineId, force) {
  const p = load(); const ep = findEpisode(p, epId);
  const shot = ep.shots.find(s => s.id === shotId); const line = shot?.lines.find(l => l.id === lineId);
  if (!line) throw bad('line not found');
  if (line.audio && !force && line.audio.text === line.text) return line.audio;
  const ch = charById(p, line.speaker); if (!ch?.voice?.id) throw bad(`No voice assigned to ${ch?.name || line.speaker}`);
  if (findLeaks(line.text).length) throw bad('Line contains a real name; fix it first.');
  const file = path.join(MEDIA, 'audio', `${epId}-${lineId}-${Date.now()}.mp3`);
  await elevenlabs.tts(ch.voice.id, line.text, file, { model: ch.voice.model || 'eleven_v3' });
  const audio = { url: mediaUrl(file), duration: await duration(file), env: await envelope(file), text: line.text, at: new Date().toISOString() };
  await update(q => { const l = findEpisode(q, epId).shots.find(s => s.id === shotId).lines.find(x => x.id === lineId); l.audio = audio; });
  return audio;
}
app.post('/api/episodes/:id/lines/:shotId/:lineId/voice', h(req => voiceLine(req.params.id, req.params.shotId, req.params.lineId, req.body?.force)));
app.post('/api/episodes/:id/voices', h(req => {
  const p = load(); const ep = findEpisode(p, req.params.id);
  const todo = ep.shots.flatMap(s => s.lines.filter(l => !l.audio || l.audio.text !== l.text).map(l => [s.id, l.id]));
  return enqueue('voices', `Voices · Ep ${ep.num}`, async prog => {
    let i = 0; for (const [sid, lid] of todo) { await voiceLine(ep.id, sid, lid); prog(++i / todo.length); }
    return { generated: todo.length };
  });
}));
app.get('/api/elevenlabs/credits', h(async () => {
  const s = await elevenlabs.subscription();
  return { tier: s.tier, used: s.character_count, limit: s.character_limit, remaining: s.character_limit - s.character_count, resetsAt: s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString() : null };
}));
app.get('/api/elevenlabs/voices', h(() => elevenlabs.voices()));
app.get('/api/elevenlabs/search', h(req => elevenlabs.search(req.query)));
app.post('/api/elevenlabs/add', h(req => elevenlabs.addShared(req.body.ownerId, req.body.voiceId, req.body.name)));
app.post('/api/elevenlabs/preview', h(async req => {
  const file = path.join(MEDIA, 'previews', `voice-${Date.now()}.mp3`);
  await elevenlabs.tts(req.body.voiceId, req.body.text || 'नमस्ते! ये मेरी आवाज़ है।', file, { model: req.body.model || 'eleven_v3' });
  return { url: mediaUrl(file) };
}));

// ---------- music (background score) ----------
app.post('/api/episodes/:id/music', h(req => {
  const p = load(); const ep = findEpisode(p, req.params.id); const tl = buildTimeline(p, ep);
  return enqueue('music', `Score · Ep ${ep.num}`, async () => {
    const sections = musicPlan(tl).map((s, i) => ({ section_name: `${i + 1}-${s.mood}`, positive_local_styles: MOODS[s.mood]?.styles || [], negative_local_styles: [], duration_ms: s.ms, lines: [] }));
    const plan = { positive_global_styles: p.series.musicStyle || ['Indian cinematic romance', 'instrumental', 'piano', 'strings', 'flute'], negative_global_styles: ['vocals', 'singing', 'lyrics'], sections };
    const file = path.join(MEDIA, 'music', `ep${ep.num}-${Date.now()}.mp3`);
    await elevenlabs.music(plan, file);
    const music = { url: mediaUrl(file), duration: await duration(file), plan: sections.map(s => s.section_name), at: new Date().toISOString(), forDuration: tl.total };
    await update(q => { findEpisode(q, ep.id).music = music; });
    return music;
  });
}));

// ---------- render (one cut per platform: Instagram ends with Follow, YouTube with Subscribe) ----------
app.post('/api/episodes/:id/render', h(req => {
  const p = load(); const ep = findEpisode(p, req.params.id);
  const leaks = scanEpisode(ep); if (leaks.length) throw bad(`Privacy: real names found (${leaks.join(', ')}). Fix before rendering.`);
  const variants = (req.body?.variants || Object.keys(VARIANTS)).filter(v => VARIANTS[v]);
  const music = ep.music?.url ? path.join(MEDIA, ep.music.url.replace('/media/', '')) : null;
  return enqueue('render', `Render · Ep ${ep.num} (${variants.join(' + ')})`, async prog => {
    const out = {};
    for (const [i, v] of variants.entries()) {
      out[v] = await renderEpisode(buildTimeline(p, ep, v), { music, musicVolume: ep.musicVolume ?? 0.22 }, x => prog((i + x) / variants.length));
      out[v].variant = v;
    }
    await update(q => { const e = findEpisode(q, ep.id); e.renders = { ...(e.renders || {}), ...out }; e.render = e.renders.instagram || Object.values(e.renders)[0]; if (['draft', 'voiced'].includes(e.status)) e.status = 'rendered'; });
    return out;
  });
}));
app.post('/api/episodes/:id/stills', h(async req => {
  const p = load(); const ep = findEpisode(p, req.params.id); const tl = buildTimeline(p, ep);
  const times = req.body.times || tl.shots.map(s => s.start + Math.min(s.dur * 0.6, s.dur - 0.2));
  return { stills: await renderEpisode(tl, { stills: times }) };
}));
app.get('/api/jobs', h(() => [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30)));
app.get('/api/jobs/:id', h(req => { const j = jobs.get(req.params.id); if (!j) throw bad('no job'); return j; }));

// ---------- publish ----------
app.get('/api/integrations', h(() => ({ status: integrationStatus(), settings: redact(getSettings()), elevenlabs: true })));
function redact(s) { const c = JSON.parse(JSON.stringify(s)); if (c.youtube?.clientSecret) c.youtube.clientSecret = '••••••'; if (c.instagram?.accessToken) c.instagram.accessToken = '••••••'; return c; }
app.put('/api/integrations', h(req => {
  const cur = getSettings(); const next = { youtube: { ...cur.youtube }, instagram: { ...cur.instagram } };
  for (const k of ['youtube', 'instagram']) for (const [f, v] of Object.entries(req.body[k] || {})) if (v !== '••••••') next[k][f] = v;
  setSettings(next); return { status: integrationStatus() };
}));
const redirectUri = req => `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
app.get('/api/auth/youtube/start', (req, res) => { try { res.redirect(youtubeAuthUrl(redirectUri(req))); } catch (e) { res.status(400).send(e.message); } });
app.get('/api/auth/youtube/callback', async (req, res) => {
  try { await youtubeCallback(req.query.code, redirectUri(req)); res.send('<script>window.close()</script>YouTube connected. You can close this tab.'); }
  catch (e) { res.status(400).send(e.message); }
});

async function doPublish(epId, platform) {
  const p = load(); const ep = findEpisode(p, epId);
  const leaks = scanEpisode(ep); if (leaks.length) throw bad(`Blocked: real names found (${leaks.join(', ')}).`);
  const entry = { id: newId('pub_'), platform, at: new Date().toISOString() };
  try { Object.assign(entry, { status: 'done', ...(await publishTo(platform, ep)) }); }
  catch (e) { Object.assign(entry, { status: 'error', error: e.message }); }
  await update(q => { const e = findEpisode(q, epId); e.publish.history.unshift(entry); if (entry.status === 'done' && !entry.export) e.status = 'published'; });
  return entry;
}
app.post('/api/episodes/:id/publish', h(async req => {
  const { platforms = [], scheduleAt } = req.body;
  if (scheduleAt) return update(p => { const ep = findEpisode(p, req.params.id); for (const pl of platforms) ep.publish.scheduled.push({ id: newId('sc_'), platform: pl, at: scheduleAt }); if (ep.status !== 'published') ep.status = 'scheduled'; return ep.publish.scheduled; });
  const out = []; for (const pl of platforms) out.push(await doPublish(req.params.id, pl)); return out;
}));
app.delete('/api/episodes/:id/schedule/:sid', h(req => update(p => { const ep = findEpisode(p, req.params.id); ep.publish.scheduled = ep.publish.scheduled.filter(s => s.id !== req.params.sid); return ep.publish.scheduled; })));
app.post('/api/episodes/:id/export', h(async req => ({ url: await exportPack(findEpisode(load(), req.params.id)) })));

// scheduler: publish due items every 30s
setInterval(async () => {
  const p = load(); if (!p) return; const now = Date.now();
  for (const ep of p.episodes) for (const s of ep.publish?.scheduled || []) {
    if (new Date(s.at).getTime() > now) continue;
    await update(q => { const e = findEpisode(q, ep.id); e.publish.scheduled = e.publish.scheduled.filter(x => x.id !== s.id); });
    await doPublish(ep.id, s.platform).catch(e => console.error('scheduled publish', e));
  }
}, 30000);

// ---------- Publish Hub (Netlify) ----------
app.get('/api/hub', h(async () => { const { priv, DATA } = await import('./store.js'); const f = path.join(DATA, 'hub.json'); const c = { ...priv.read('hub', {}), ...(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}) }; return { url: c.url || null, lastDeploy: c.lastDeploy || null, pin: !!c.pinHash }; }));
app.post('/api/hub/deploy', h(async req => {
  const { buildHub, deployHub } = await import('./hub.js');
  return enqueue('hub', 'Publish Hub → Netlify', async prog => { buildHub({ pin: req.body?.pin || undefined }); prog(0.2); return deployHub(x => prog(0.2 + 0.8 * x)); });
}));

// ---------- privacy ----------
app.get('/api/privacy/name-map', h(() => getNameMap()));
app.put('/api/privacy/name-map', h(req => { setNameMap(req.body); return getNameMap(); }));

// production build (npm run build && npm start)
const dist = path.join(ROOT, 'dist');
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.get(/^\/(?!api|media).*/, (_, res) => res.sendFile(path.join(dist, 'index.html'))); }

app.listen(PORT, () => console.log(`Reel Studio API on http://localhost:${PORT}`));
