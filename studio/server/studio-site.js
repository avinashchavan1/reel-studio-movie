// View-only Studio on Netlify: snapshot the project (no private data) + build the UI in static mode + deploy.
// CLI: node --no-warnings server/studio-site.js
import './net.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { load, priv, ROOT, REPO, DATA, MEDIA } from './store.js';
import { buildTimeline } from './render.js';
import { viralReport } from './viral.js';
import { scanEpisode } from './privacy.js';
import { elevenlabs, MOODS } from './audio.js';
import { PLATFORMS, integrationStatus } from './publish.js';
import { VARIANTS } from './render.js';

const OUT = path.join(ROOT, 'studio-dist');
const CFG = path.join(DATA, 'studio-site.json'); // committed: site id + url (not secret)
const NETLIFY = 'https://api.netlify.com/api/v1';

async function nf(pathname, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (process.env.NETLIFY_AUTH_TOKEN) headers.Authorization = `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`;
  const r = await fetch(NETLIFY + pathname, { ...opts, headers });
  if (!r.ok) throw new Error(`Netlify ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? {} : r.json();
}
const cp = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.cpSync(src, dst, { recursive: true }); };

export async function buildStudioSite() {
  execFileSync('npx', ['vite', 'build', '--outDir', 'studio-dist', '--emptyOutDir', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_STATIC: '1' } });
  const p = load();
  const snap = path.join(OUT, 'snapshot'); fs.mkdirSync(snap, { recursive: true });
  const w = (name, data) => fs.writeFileSync(path.join(snap, name + '.json'), JSON.stringify(data));
  const project = { ...p, moods: MOODS, platforms: PLATFORMS, variants: VARIANTS };
  for (const k of ['plan', 'calendar', 'world', 'profiles', 'stats', 'style']) if (project[k] === undefined) project[k] = k === 'calendar' || k === 'stats' ? [] : k === 'plan' ? { items: [] } : k === 'world' ? { relations: [] } : {};
  if (!project.style.captionTemplates) project.style = { captionTemplates: [], hashtagSets: [] };
  w('project', project);
  for (const ep of p.episodes) { const tl = buildTimeline(p, ep); w(`analysis-${ep.id}`, { duration: tl.total, shots: tl.shots.map(s => ({ id: s.id, start: s.start, dur: s.dur })), viral: viralReport(ep, tl), leaks: scanEpisode(ep) }); }
  try { const s = await elevenlabs.subscription(); w('credits', { tier: s.tier, used: s.character_count, limit: s.character_limit, remaining: s.character_limit - s.character_count, resetsAt: s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString() : null }); } catch { /* offline */ }
  try { w('voices', await elevenlabs.voices()); } catch { w('voices', []); }
  w('integrations', { status: integrationStatus(), settings: { youtube: {}, instagram: {} } });
  const hubCfg = fs.existsSync(path.join(DATA, 'hub.json')) ? JSON.parse(fs.readFileSync(path.join(DATA, 'hub.json'), 'utf8')) : {};
  const pinHash = priv.read('hub', {}).pinHash || null;
  w('hub', { url: hubCfg.url || null, lastDeploy: hubCfg.lastDeploy || null, pin: !!pinHash });
  w('pin', { pin: pinHash });
  for (const d of ['renders', 'audio', 'music']) if (fs.existsSync(path.join(MEDIA, d))) cp(path.join(MEDIA, d), path.join(OUT, 'media', d));
  cp(path.join(REPO, 'engine', 'engine.js'), path.join(OUT, 'engine', 'engine.js'));
  cp(path.join(REPO, 'fonts'), path.join(OUT, 'fonts'));
  fs.writeFileSync(path.join(OUT, '_redirects'), '/*  /index.html  200\n');
  fs.writeFileSync(path.join(OUT, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n/snapshot/*\n  Cache-Control: no-cache\n');
}

export async function deployStudioSite() {
  const cfg = fs.existsSync(CFG) ? JSON.parse(fs.readFileSync(CFG, 'utf8')) : {};
  if (!cfg.siteId) {
    const site = await nf('/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `stf-studio-${crypto.randomBytes(4).toString('hex')}` }) });
    cfg.siteId = site.id; cfg.url = site.ssl_url || site.url;
  }
  const files = {}, byHash = {};
  const walk = d => { for (const f of fs.readdirSync(d)) { const a = path.join(d, f); if (fs.statSync(a).isDirectory()) walk(a); else { const rel = '/' + path.relative(OUT, a).split(path.sep).join('/'); const h = crypto.createHash('sha1').update(fs.readFileSync(a)).digest('hex'); files[rel] = h; (byHash[h] ||= []).push(rel); } } };
  walk(OUT);
  const dep = await nf(`/sites/${cfg.siteId}/deploys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) });
  for (const h of dep.required || []) {
    const rel = byHash[h][0];
    await nf(`/deploys/${dep.id}/files${rel.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(path.join(OUT, rel)) });
  }
  for (let i = 0; i < 60; i++) { const d = await nf(`/deploys/${dep.id}`); if (d.state === 'ready') break; if (d.state === 'error') throw new Error(d.error_message); await new Promise(r => setTimeout(r, 2000)); }
  cfg.lastDeploy = new Date().toISOString(); fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2));
  return { url: cfg.url, uploaded: (dep.required || []).length };
}

if (process.argv[1] && process.argv[1].endsWith('studio-site.js')) {
  await buildStudioSite();
  const r = await deployStudioSite();
  console.log(`Studio (view-only) deployed: ${r.url} (${r.uploaded} files uploaded)`);
}
