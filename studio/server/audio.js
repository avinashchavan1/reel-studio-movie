// Audio helpers: duration, lip-sync envelope, and ElevenLabs (voices + music).
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const run = promisify(execFile);
const EL = 'https://api.elevenlabs.io';

export async function duration(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Math.round(parseFloat(stdout) * 1000) / 1000;
}

// mouth-openness per video frame (0..1) from the audio loudness
export async function envelope(file, fps = 30) {
  const sr = 16000;
  const { stdout } = await run('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { encoding: 'buffer', maxBuffer: 1 << 28 });
  const s = new Float32Array(stdout.buffer, stdout.byteOffset, Math.floor(stdout.length / 4));
  const win = Math.floor(sr / fps), out = [];
  for (let i = 0; i < s.length; i += win) {
    let sum = 0; const n = Math.min(win, s.length - i);
    for (let j = 0; j < n; j++) sum += s[i + j] * s[i + j];
    out.push(Math.sqrt(sum / Math.max(n, 1)));
  }
  const sorted = [...out].sort((a, b) => a - b), peak = sorted[Math.floor(sorted.length * 0.95)] || 1;
  let prev = 0;
  return out.map(v => { const x = Math.min(1, Math.max(0, (v / peak - 0.12) / 0.88)); prev = prev * 0.35 + x * 0.65; return Math.round(prev * 100) / 100; });
}

function elHeaders(json = true) {
  const h = json ? { 'Content-Type': 'application/json' } : {};
  if (process.env.ELEVENLABS_API_KEY) h['xi-api-key'] = process.env.ELEVENLABS_API_KEY; // otherwise injected by the proxy
  return h;
}
async function el(pathname, opts = {}) {
  const r = await fetch(EL + pathname, { ...opts, headers: { ...elHeaders(), ...(opts.headers || {}) } });
  if (!r.ok) throw Object.assign(new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`), { status: 502 });
  return r;
}

export const elevenlabs = {
  async subscription() { return (await el('/v1/user/subscription')).json(); },
  async voices() {
    const d = await (await el('/v2/voices?page_size=100')).json();
    return d.voices.map(v => ({ id: v.voice_id, name: v.name, labels: v.labels || {}, preview: v.preview_url }));
  },
  async search({ q = '', language = 'hi', gender = '', age = '' }) {
    const qs = new URLSearchParams({ page_size: '24', sort: 'usage_character_count_1y' });
    if (q) qs.set('search', q); if (language) qs.set('language', language); if (gender) qs.set('gender', gender); if (age) qs.set('age', age);
    const d = await (await el('/v1/shared-voices?' + qs)).json();
    return d.voices.map(v => ({ id: v.voice_id, ownerId: v.public_owner_id, name: v.name, gender: v.gender, age: v.age, accent: v.accent, descriptive: v.descriptive, useCase: v.use_case, preview: v.preview_url }));
  },
  async addShared(ownerId, voiceId, name) { return (await el(`/v1/voices/add/${ownerId}/${voiceId}`, { method: 'POST', body: JSON.stringify({ new_name: name }) })).json(); },
  async tts(voiceId, text, out, { model = 'eleven_v3', settings = { stability: 0.5, similarity_boost: 0.8 } } = {}) {
    const r = await el(`/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify({ text, model_id: model, voice_settings: settings }) });
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    return out;
  },
  // one continuous score, one section per shot, styled by the shot's mood
  async music(plan, out) {
    const r = await el('/v1/music?output_format=mp3_44100_128', { method: 'POST', body: JSON.stringify({ composition_plan: plan }) });
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    return out;
  },
};

export const MOODS = {
  dreamy:     { label: 'Dreamy intro',      styles: ['dreamy', 'soft piano', 'gentle strings', 'hopeful'] },
  homely:     { label: 'Homely / warm',     styles: ['warm', 'acoustic guitar', 'flute', 'small-town morning'] },
  emotional:  { label: 'Emotional / sad',   styles: ['emotional', 'slow', 'sad piano', 'cello'] },
  journey:    { label: 'Journey',           styles: ['moving forward', 'rhythmic', 'bittersweet', 'strings'] },
  city:       { label: 'Big city buzz',     styles: ['upbeat', 'modern', 'light percussion', 'curious'] },
  playful:    { label: 'Playful / fun',     styles: ['playful', 'pizzicato', 'quirky', 'bright'] },
  romantic:   { label: 'Romantic',          styles: ['romantic', 'tender', 'sitar and piano', 'warm strings'] },
  tension:    { label: 'Tension / curious', styles: ['mysterious', 'suspense', 'soft pulses', 'building'] },
  cliffhanger:{ label: 'Cliffhanger',       styles: ['suspenseful', 'rising', 'magical shimmer', 'unresolved ending'] },
};
