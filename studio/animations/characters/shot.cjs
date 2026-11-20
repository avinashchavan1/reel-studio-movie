const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 1500 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'sheet.html')); const d = await p.evaluate(() => window.draw());
  fs.writeFileSync(process.argv[2] || 'sheet.png', Buffer.from(d.split(',')[1], 'base64')); console.log('errors', JSON.stringify(errs)); await b.close(); })();
