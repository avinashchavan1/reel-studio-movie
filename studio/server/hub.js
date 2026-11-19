// Publish Hub: export rendered episodes (cuts, posters, per-platform captions) into a static site and deploy it to Netlify.
// CLI: node server/hub.js [--deploy] [--pin 1234]
import './net.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { load, priv, ROOT, mediaPath } from './store.js';
import { ctaFor } from './publish.js';
import { scanEpisode } from './privacy.js';

const HUB = path.join(ROOT, 'hub'), PUB = path.join(HUB, 'public'), DIST = path.join(ROOT, 'hub-dist');
const NETLIFY = 'https://api.netlify.com/api/v1';

const PLATFORMS = {
  instagram: { name: 'Instagram', cut: 'instagram', steps: ['Tap “Share to Instagram” below and pick Instagram → Reels.', 'Tap the caption box and paste (the caption is already copied).', 'Keep “Also share to feed” on, then Share.'] },
  youtube:   { name: 'YouTube', cut: 'youtube', steps: ['Tap “Share to YouTube” and pick YouTube → Short.', 'Paste the title (copy it above), then paste the caption as the description.', 'Visibility: Public → Upload.'] },
  facebook:  { name: 'Facebook', cut: 'instagram', steps: ['Share → Facebook → Reel.', 'Paste the caption → Share.'] },
  moj:       { name: 'Moj', cut: 'instagram', steps: ['Share → Moj.', 'Paste the caption and add the same hashtags → Post.'] },
  josh:      { name: 'Josh', cut: 'instagram', steps: ['Share → Josh.', 'Paste the caption → Post.'] },
  snapchat:  { name: 'Snapchat', cut: 'instagram', steps: ['Share → Snapchat → Spotlight.', 'Paste a short caption → Post.'] },
};

export function buildHub({ pin } = {}) {
  const p = load(); const cfg = priv.read('hub', {});
  if (pin) cfg.pinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
  priv.write('hub', cfg);
  fs.rmSync(path.join(PUB, 'media'), { recursive: true, force: true }); fs.mkdirSync(path.join(PUB, 'media'), { recursive: true });
  const put = (url, name) => { if (!url) return ''; fs.copyFileSync(mediaPath(url), path.join(PUB, 'media', name)); return `/media/${name}`; };
  const episodes = [];
  for (const ep of p.episodes) {
    const renders = ep.renders || (ep.render ? { instagram: ep.render } : null);
    if (!renders) continue;
    const leaks = scanEpisode(ep); if (leaks.length) { console.warn(`Skipping Ep ${ep.num}: real names found`); continue; }
    const tag = crypto.randomBytes(5).toString('hex'); // unguessable file names
    const cuts = {};
    for (const [v, r] of Object.entries(renders)) cuts[v] = { url: put(r.url, `ep${ep.num}-${v}-${tag}.mp4`), poster: put(r.poster, `ep${ep.num}-${v}-${tag}.jpg`), duration: r.duration };
    const tags = (ep.publish.hashtags || []).map(h => '#' + h).join(' ');
    const captions = Object.fromEntries(Object.keys(PLATFORMS).map(k => [k, `${ep.publish.caption || ''}\n${ctaFor(ep, k === 'youtube' ? 'youtube' : 'instagram')}\n\n${tags}${k === 'youtube' ? ' #Shorts' : ''}`.trim()]));
    const first = cuts.instagram || Object.values(cuts)[0];
    episodes.push({ num: ep.num, title: ep.title, synopsis: ep.synopsis, duration: first.duration, poster: first.poster, cuts, captions, hashtags: ep.publish.hashtags, youtubeTitle: ep.publish.youtubeTitle || ep.title });
  }
  const manifest = { series: { title: p.series.title, tagline: p.series.tagline }, builtAt: new Date().toISOString(), pin: cfg.pinHash || null,
    bestTimes: ['7–9 PM', '12–2 PM', 'weekend nights'], platforms: PLATFORMS, episodes: episodes.sort((a, b) => a.num - b.num) };
  fs.writeFileSync(path.join(PUB, 'episodes.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(PUB, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n/media/*\n  Cache-Control: public, max-age=31536000, immutable\n/episodes.json\n  Cache-Control: no-cache\n');
  execFileSync('npx', ['vite', 'build', '--config', 'vite.hub.config.ts', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit' });
  return { episodes: episodes.length, dir: DIST };
}

async function nf(pathname, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (process.env.NETLIFY_AUTH_TOKEN) headers.Authorization = `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`; // else injected by the proxy
  const r = await fetch(NETLIFY + pathname, { ...opts, headers });
  if (!r.ok) throw Object.assign(new Error(`Netlify ${r.status}: ${(await r.text()).slice(0, 300)}`), { status: 502 });
  return r.status === 204 ? {} : r.json();
}

export async function deployHub(onProgress = () => {}) {
  const cfg = priv.read('hub', {});
  if (!cfg.siteId) {
    const site = await nf('/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `stf-hub-${crypto.randomBytes(4).toString('hex')}` }) });
    cfg.siteId = site.id; cfg.url = site.ssl_url || site.url; priv.write('hub', cfg);
  }
  const files = {}, byHash = {};
  const walk = d => { for (const f of fs.readdirSync(d)) { const a = path.join(d, f); if (fs.statSync(a).isDirectory()) walk(a); else { const rel = '/' + path.relative(DIST, a).split(path.sep).join('/'); const h = crypto.createHash('sha1').update(fs.readFileSync(a)).digest('hex'); files[rel] = h; (byHash[h] ||= []).push(rel); } } };
  walk(DIST);
  const dep = await nf(`/sites/${cfg.siteId}/deploys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) });
  const required = dep.required || [];
  for (const [i, h] of required.entries()) {
    const rel = byHash[h][0];
    await nf(`/deploys/${dep.id}/files${rel.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(path.join(DIST, rel)) });
    onProgress((i + 1) / Math.max(1, required.length));
  }
  for (let i = 0; i < 60; i++) { const d = await nf(`/deploys/${dep.id}`); if (d.state === 'ready') break; if (d.state === 'error') throw new Error('Netlify deploy failed: ' + d.error_message); await new Promise(r => setTimeout(r, 2000)); }
  cfg.lastDeploy = new Date().toISOString(); priv.write('hub', cfg);
  return { url: cfg.url, uploaded: required.length, files: Object.keys(files).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pinI = process.argv.indexOf('--pin');
  const r = buildHub({ pin: pinI > 0 ? process.argv[pinI + 1] : undefined });
  console.log(`Built hub with ${r.episodes} episode(s) → ${r.dir}`);
  if (process.argv.includes('--deploy')) deployHub().then(d => console.log(`Deployed: ${d.url} (${d.uploaded} files uploaded)`)).catch(e => { console.error(e.message); process.exit(1); });
}
