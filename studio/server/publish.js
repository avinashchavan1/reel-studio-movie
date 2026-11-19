// Publishing: YouTube (OAuth + resumable upload), Instagram Reels (Graph API), and export packs for everything else.
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { priv, MEDIA, mediaPath, mediaUrl } from './store.js';

export const PLATFORMS = {
  youtube:   { name: 'YouTube Shorts',   mode: 'api' },
  instagram: { name: 'Instagram Reels',  mode: 'api' },
  facebook:  { name: 'Facebook Reels',   mode: 'export' },
  tiktok:    { name: 'TikTok',           mode: 'export' },
  moj:       { name: 'Moj',              mode: 'export' },
  josh:      { name: 'Josh',             mode: 'export' },
  snapchat:  { name: 'Snapchat Spotlight', mode: 'export' },
};

export const getSettings = () => priv.read('integrations', { youtube: {}, instagram: {} });
export const setSettings = s => priv.write('integrations', s);
const tokens = () => priv.read('tokens', {});

export function integrationStatus() {
  const s = getSettings(), t = tokens();
  return {
    youtube: { configured: !!(s.youtube?.clientId && s.youtube?.clientSecret), connected: !!t.youtube?.refresh_token, channel: t.youtube?.channel || null },
    instagram: { configured: !!(s.instagram?.igUserId && s.instagram?.accessToken), publicBaseUrl: s.instagram?.publicBaseUrl || '' },
  };
}

// ---------- YouTube ----------
const YT_SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
export function youtubeAuthUrl(redirectUri) {
  const { clientId } = getSettings().youtube || {};
  if (!clientId) throw new Error('Add your YouTube OAuth Client ID and Secret in Settings first.');
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: YT_SCOPE, access_type: 'offline', prompt: 'consent' });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + q;
}
export async function youtubeCallback(code, redirectUri) {
  const { clientId, clientSecret } = getSettings().youtube;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  const tok = await r.json(); if (!r.ok) throw new Error('YouTube auth failed: ' + JSON.stringify(tok));
  const t = tokens(); t.youtube = { refresh_token: tok.refresh_token, access_token: tok.access_token, expires: Date.now() + tok.expires_in * 1000 };
  try {
    const me = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: 'Bearer ' + tok.access_token } })).json();
    t.youtube.channel = me.items?.[0]?.snippet?.title || null;
  } catch {}
  priv.write('tokens', t);
}
async function youtubeAccessToken() {
  const t = tokens(); const y = t.youtube; if (!y?.refresh_token) throw new Error('YouTube is not connected (Settings → Connect YouTube).');
  if (y.access_token && y.expires > Date.now() + 60000) return y.access_token;
  const { clientId, clientSecret } = getSettings().youtube;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: y.refresh_token, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }) });
  const tok = await r.json(); if (!r.ok) throw new Error('YouTube token refresh failed: ' + JSON.stringify(tok));
  y.access_token = tok.access_token; y.expires = Date.now() + tok.expires_in * 1000; priv.write('tokens', t);
  return y.access_token;
}
async function publishYouTube(ep, file) {
  const token = await youtubeAccessToken();
  const p = ep.publish; const size = fs.statSync(file).size;
  const meta = { snippet: { title: (p.youtubeTitle || ep.title).slice(0, 100), description: `${p.caption || ''}\n${ctaFor(ep, 'youtube')}\n\n${(p.hashtags || []).map(h => '#' + h).join(' ')} #Shorts`, tags: p.hashtags || [], categoryId: '24' },
    status: { privacyStatus: p.youtubePrivacy || 'public', selfDeclaredMadeForKids: false } };
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) }, body: JSON.stringify(meta) });
  if (!init.ok) throw new Error('YouTube upload init failed: ' + (await init.text()).slice(0, 300));
  const up = await fetch(init.headers.get('location'), { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) }, body: fs.readFileSync(file) });
  const v = await up.json(); if (!up.ok) throw new Error('YouTube upload failed: ' + JSON.stringify(v).slice(0, 300));
  return { id: v.id, url: `https://youtube.com/shorts/${v.id}` };
}

// ---------- Instagram ----------
async function publishInstagram(ep, renderUrl) {
  const s = getSettings().instagram || {};
  if (!s.igUserId || !s.accessToken) throw new Error('Instagram is not set up (Settings → Instagram).');
  if (!s.publicBaseUrl) throw new Error('Instagram needs the video at a public URL. Set "Public base URL" in Settings (e.g. an ngrok/Cloudflare tunnel to this studio).');
  const G = 'https://graph.facebook.com/v21.0';
  const caption = `${ep.publish.caption || ''}\n${ctaFor(ep, 'instagram')}\n\n${(ep.publish.hashtags || []).map(h => '#' + h).join(' ')}`.trim();
  const videoUrl = s.publicBaseUrl.replace(/\/$/, '') + renderUrl;
  const c = await (await fetch(`${G}/${s.igUserId}/media`, { method: 'POST', body: new URLSearchParams({ media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true', access_token: s.accessToken }) })).json();
  if (!c.id) throw new Error('Instagram container failed: ' + JSON.stringify(c).slice(0, 300));
  for (let i = 0; i < 60; i++) {
    const st = await (await fetch(`${G}/${c.id}?fields=status_code,status&access_token=${s.accessToken}`)).json();
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') throw new Error('Instagram processing failed: ' + (st.status || ''));
    await new Promise(r => setTimeout(r, 5000));
  }
  const pub = await (await fetch(`${G}/${s.igUserId}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: c.id, access_token: s.accessToken }) })).json();
  if (!pub.id) throw new Error('Instagram publish failed: ' + JSON.stringify(pub).slice(0, 300));
  const info = await (await fetch(`${G}/${pub.id}?fields=permalink&access_token=${s.accessToken}`)).json();
  return { id: pub.id, url: info.permalink || null };
}

// ---------- export pack ----------
export async function exportPack(ep) {
  if (!ep.render?.url) throw new Error('Render the episode first.');
  const name = `ep${String(ep.num).padStart(2, '0')}-${ep.title.replace(/[^\w]+/g, '-').toLowerCase()}`;
  const out = path.join(MEDIA, 'exports', `${name}.zip`);
  const tags = (ep.publish?.hashtags || []).map(h => '#' + h).join(' ');
  await new Promise((res, rej) => {
    const zip = archiver('zip'); const ws = fs.createWriteStream(out);
    ws.on('close', res); zip.on('error', rej); zip.pipe(ws);
    for (const [v, r] of Object.entries(ep.renders || { instagram: ep.render })) zip.file(mediaPath(r.url), { name: `${name}-${v}.mp4` });
    if (ep.render.poster) zip.file(mediaPath(ep.render.poster), { name: `${name}-cover.jpg` });
    for (const [k, p] of Object.entries(PLATFORMS))
      zip.append(`${k === 'youtube' ? (ep.publish?.youtubeTitle || ep.title) + '\n\n' : ''}${ep.publish?.caption || ''}\n${ctaFor(ep, k)}\n\n${tags}${k === 'youtube' ? ' #Shorts' : ''}\n\n(Use ${k === 'youtube' ? `${name}-youtube.mp4` : `${name}-instagram.mp4`})\n`, { name: `captions/${p.name}.txt` });
    zip.finalize();
  });
  return mediaUrl(out);
}

export const ctaFor = (ep, platform) => (ep.publish?.cta?.[platform]) || (platform === 'youtube' ? `Subscribe 🔔 for Part ${ep.num + 1}` : `Follow ✨ for Part ${ep.num + 1}`);
const cutFor = (ep, platform) => ep.renders?.[platform === 'youtube' ? 'youtube' : 'instagram'] || ep.render;
export async function publishTo(platform, ep) {
  if (!cutFor(ep, platform)?.url) throw new Error('Render the episode first.');
  if (platform === 'youtube') return publishYouTube(ep, mediaPath(cutFor(ep, 'youtube').url));
  if (platform === 'instagram') return publishInstagram(ep, cutFor(ep, 'instagram').url);
  return { url: await exportPack(ep), export: true };
}
