// Delete media files no longer referenced by project.json (old renders, replaced voices/scores, previews).
import fs from 'fs';
import path from 'path';
import { load, MEDIA } from './store.js';
const used = new Set(JSON.stringify(load()).match(/\/media\/[^"]+/g) || []);
let removed = 0;
for (const dir of ['renders', 'audio', 'music', 'previews', 'exports']) {
  const d = path.join(MEDIA, dir); if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (!used.has(`/media/${dir}/${f}`)) { fs.rmSync(path.join(d, f)); removed++; }
}
console.log(`pruned ${removed} unused media file(s)`);
