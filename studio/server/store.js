// JSON-file storage. Public project data in data/project.json (safe to commit);
// anything private (real names, tokens, API settings) lives in data/private/ (git-ignored).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(ROOT, '..');
export const DATA = path.join(ROOT, 'data');
export const PRIV = path.join(DATA, 'private');
export const MEDIA = path.join(DATA, 'media');
for (const d of [DATA, PRIV, MEDIA, path.join(MEDIA, 'audio'), path.join(MEDIA, 'music'), path.join(MEDIA, 'renders'), path.join(MEDIA, 'exports'), path.join(MEDIA, 'previews')])
  fs.mkdirSync(d, { recursive: true });

const PROJECT = path.join(DATA, 'project.json');

export const newId = (prefix = '') => prefix + Math.random().toString(36).slice(2, 9);

export function load() {
  if (!fs.existsSync(PROJECT)) return null;
  return JSON.parse(fs.readFileSync(PROJECT, 'utf8'));
}
export function save(p) {
  fs.writeFileSync(PROJECT + '.tmp', JSON.stringify(p, null, 2));
  fs.renameSync(PROJECT + '.tmp', PROJECT);
}
// serialise writes so concurrent requests can't clobber each other
let chain = Promise.resolve();
export function update(fn) {
  const run = chain.then(async () => { const p = load(); const r = await fn(p); save(p); return r === undefined ? p : r; });
  chain = run.catch(() => {});
  return run;
}

export const priv = {
  read(name, def) {
    const f = path.join(PRIV, name + '.json');
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : def;
  },
  write(name, v) { fs.writeFileSync(path.join(PRIV, name + '.json'), JSON.stringify(v, null, 2)); },
};

export function findEpisode(p, id) {
  const ep = p.episodes.find(e => e.id === id);
  if (!ep) throw Object.assign(new Error('Episode not found'), { status: 404 });
  return ep;
}
export const mediaUrl = abs => '/media/' + path.relative(MEDIA, abs).split(path.sep).join('/');
export const mediaPath = url => path.join(MEDIA, url.replace(/^\/media\//, ''));
