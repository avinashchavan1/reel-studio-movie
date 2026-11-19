// Brand kit: avatar, YouTube banner, watermark, highlight cover → data/media/brand/
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { ROOT, MEDIA } from './store.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = path.join(MEDIA, 'brand'); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.join(ROOT, 'renderer', 'brand.html'));
for (const [kind, file] of [['avatar', 'avatar_1080.png'], ['banner', 'banner_2560x1440.png'], ['watermark', 'watermark_150.png'], ['highlight', 'highlight_cover.png']]) {
  const d = await p.evaluate(k => window.draw(k), kind);
  fs.writeFileSync(path.join(out, file), Buffer.from(d.split(',')[1], 'base64')); console.log('wrote', file);
}
await b.close();
