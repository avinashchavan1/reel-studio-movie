// node render.js --stills         -> stills/sheet.jpg (one frame per style)
// node render.js                  -> seg-NN.mp4 per 2D style (3 s, 24 fps, 1080x1920)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const STYLES = [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'player.html')); await p.waitForFunction(() => window.READY === true);
  if (process.argv.includes('--stills')) {
    fs.mkdirSync('stills', { recursive: true });
    for (const n of STYLES) { const d = await p.evaluate(([n]) => window.renderStyle(n, 1.7), [n]); fs.writeFileSync(`stills/s${String(n).padStart(2, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', 'stills/s*.jpg', '-vf', 'scale=360:-1,tile=6x3:padding=6:color=white', '-frames:v', '1', 'stills/sheet.jpg']);
  } else {
    for (const n of (process.env.ONLY ? process.env.ONLY.split(',').map(Number) : STYLES)) {
      const out = `seg-${String(n).padStart(2, '0')}.mp4`;
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '24', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', '24', out]);
      for (let f = 0; f < 72; f++) { const d = await p.evaluate(([n, t]) => window.renderStyle(n, t), [n, f / 24]); ff.stdin.write(Buffer.from(d.split(',')[1], 'base64')); }
      ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('wrote', out);
    }
  }
  console.log('errors', JSON.stringify(errs.slice(0, 5))); await b.close();
})();
