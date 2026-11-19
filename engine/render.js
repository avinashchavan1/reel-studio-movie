// Usage: node engine/render.js ep01            -> output/ep01.mp4
//        node engine/render.js ep01 --stills 1,6,12  -> output/stills/ep01-<t>.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ep = process.argv[2] || 'ep01', fps = 30;
const si = process.argv.indexOf('--stills');
const outDir = path.resolve(__dirname, '../output');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'player.html') + '?ep=' + ep);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 20000 });
  const dur = await page.evaluate(() => EP_DURATION);
  if (si > 0) {
    fs.mkdirSync(outDir + '/stills', { recursive: true });
    for (const t of process.argv[si + 1].split(',').map(Number)) {
      const d = await page.evaluate(t => renderFrame(t, 'image/png'), t);
      fs.writeFileSync(`${outDir}/stills/${ep}-${t}.png`, Buffer.from(d.split(',')[1], 'base64'));
    }
  } else {
    const out = `${outDir}/${ep}.mp4`, n = Math.round(dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) {
      const d = await page.evaluate(t => renderFrame(t), i / fps);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log(`wrote ${out} (${dur}s, ${n} frames)`);
  }
  await browser.close();
})();
