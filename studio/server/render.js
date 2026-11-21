// Episode → timeline → frames (canvas in headless Chromium) → MP4 with voices + ducked music.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ROOT, MEDIA, mediaUrl, mediaPath, newId } from './store.js';

const require = createRequire(import.meta.url);
const FPS = 30, LEAD = 0.45, GAP = 0.35, TAIL = 0.7;
export const stripTags = t => (t || '').replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();

export const VARIANTS = {
  instagram: { label: 'Instagram', cta: 'FOLLOW', color: '#e1306c', icon: 'plus' },
  youtube:   { label: 'YouTube',   cta: 'SUBSCRIBE', color: '#ff0000', icon: 'bell' },
};
export function buildTimeline(project, ep, variant = 'instagram') {
  let t = 0; const shots = [], audio = [];
  for (const s of ep.shots) {
    const start = t; let lt = start + LEAD; const lines = [];
    for (const l of s.lines) {
      const text = stripTags(l.subtitle || l.text);
      if (l.audio) {
        lines.push({ speaker: l.speaker, emotion: l.emotion, text, start: lt, end: lt + l.audio.duration, env: l.audio.env || [] });
        audio.push({ file: mediaPath(l.audio.url), at: lt });
        lt += l.audio.duration + GAP;
      } else {
        const d = Math.max(1.6, text.length * 0.065);
        lines.push({ speaker: l.speaker, emotion: l.emotion, text, start: lt, end: lt + d, env: [] });
        lt += d + GAP;
      }
    }
    const dur = Math.max(s.minDuration || 3, lt - start - GAP + TAIL);
    shots.push({ ...s, lines, start, dur });
    t += dur;
  }
  return {
    total: Math.round(t * 1000) / 1000, fps: FPS, shots, audio,
    series: project.series, episode: { num: ep.num, title: ep.title }, variant, cta: { ...VARIANTS[variant], text: `${VARIANTS[variant]?.cta || 'FOLLOW'} FOR PART ${ep.num + 1}` },
    characters: project.characters, places: project.places,
  };
}

export function musicPlan(timeline) {
  return timeline.shots.map(s => ({ name: s.id, mood: s.mood || 'dreamy', ms: Math.max(3000, Math.round(s.dur * 1000)) }));
}

// ---------- job queue ----------
export const jobs = new Map();
let busy = false; const queue = [];
export function enqueue(kind, label, fn) {
  const job = { id: newId('job_'), kind, label, status: 'queued', progress: 0, createdAt: Date.now() };
  jobs.set(job.id, job); queue.push({ job, fn }); pump();
  return job;
}
async function pump() {
  if (busy || !queue.length) return;
  busy = true; const { job, fn } = queue.shift();
  job.status = 'running';
  try { job.result = await fn(p => { job.progress = p; }); job.status = 'done'; job.progress = 1; }
  catch (e) { job.status = 'error'; job.error = e.message; console.error(e); }
  busy = false; pump();
}

function loadPlaywright() {
  try { return require('playwright'); }
  catch { throw new Error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium'); }
}

export async function renderEpisode(timeline, { music, musicVolume = 0.22, stills } = {}, onProgress = () => {}) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => console.error('[renderer]', e.message));
    await page.goto('file://' + path.join(ROOT, 'renderer', 'player.html'));
    // painted shot art is embedded as data URLs (file:// images would taint the canvas)
    const spec = { ...timeline, shots: timeline.shots.map(s => {
      if (!s.image) return s; const f = mediaPath(s.image); if (!fs.existsSync(f)) return s;
      const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return { ...s, imageData: `data:${mime};base64,${fs.readFileSync(f).toString('base64')}` };
    }) };
    await page.evaluate(spec => window.boot(spec), spec);
    await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });

    if (stills) { // quick preview frames
      const out = [];
      for (const t of stills) {
        const d = await page.evaluate(t => window.renderFrame(t, 'image/jpeg'), t);
        const f = path.join(MEDIA, 'previews', `${newId('still_')}.jpg`);
        fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
        out.push(mediaUrl(f));
      }
      return out;
    }

    const file = path.join(MEDIA, 'renders', `ep${String(timeline.episode.num).padStart(2, '0')}-${timeline.variant}-${Date.now()}.mp4`);
    const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
    const filters = []; const mixes = []; let idx = 1;
    for (const a of timeline.audio) {
      args.push('-i', a.file);
      const ms = Math.round(a.at * 1000);
      filters.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${idx}]`);
      mixes.push(`[v${idx}]`); idx++;
    }
    let audioOut = null;
    if (mixes.length) {
      filters.push(`${mixes.join('')}amix=inputs=${mixes.length}:normalize=0:duration=longest,apad[voice]`);
      audioOut = '[voice]';
    }
    if (music && fs.existsSync(music)) {
      args.push('-i', music);
      const fadeOut = Math.max(0, timeline.total - 1.5).toFixed(2);
      filters.push(`[${idx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${musicVolume},afade=t=out:st=${fadeOut}:d=1.5[mus]`);
      if (audioOut) { // duck music under the voices
        filters.push(`[voice]asplit=2[vk][vm]`, `[mus][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck]`, `[vm][duck]amix=inputs=2:normalize=0:duration=first[aout]`);
      } else filters.push(`[mus]anull[aout]`);
      audioOut = '[aout]'; idx++;
    }
    if (!audioOut) { args.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo'); audioOut = `${idx}:a`; }
    if (filters.length) args.push('-filter_complex', filters.join(';'));
    args.push('-map', '0:v', '-map', audioOut, '-t', String(timeline.total), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', file);

    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'pipe'] });
    let err = ''; ff.stderr.on('data', d => { err += d; });
    const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg failed: ' + err.slice(-400))))));
    const n = Math.round(timeline.total * FPS);
    for (let i = 0; i < n; i++) {
      const d = await page.evaluate(t => window.renderFrame(t), i / FPS);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 15 === 0) onProgress(i / n);
    }
    ff.stdin.end(); await done;
    // poster frame for cards
    const poster = file.replace(/\.mp4$/, '.jpg');
    await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', file, '-frames:v', '1', '-vf', 'scale=540:-1', poster]).on('close', r));
    return { url: mediaUrl(file), poster: mediaUrl(poster), duration: timeline.total, at: new Date().toISOString() };
  } finally { await browser.close(); }
}
