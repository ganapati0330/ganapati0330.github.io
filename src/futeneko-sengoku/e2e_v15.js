const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/dist/index.html'); await p.waitForTimeout(300);
  await p.click('#startBtn'); await p.click('#quickBtn'); await p.waitForTimeout(200);
  const shots = [];
  for (let ci = 0; ci < 7; ci++) {
    await p.click(`#mapList button:nth-child(${ci + 1})`); await p.waitForTimeout(80);
    const el = await p.$('.pvwrap'); await el.screenshot({ path: `pv_${ci}.png` });
  }
  await p.click('#mapList button:nth-child(7)'); await p.click('#sizeList button:nth-child(3)'); await p.waitForTimeout(100);
  const el = await p.$('.pvwrap'); await el.screenshot({ path: 'pv_big.png' });
  const pts = await p.textContent('#ptsInfo');
  await p.screenshot({ path: 'v15_setup.png' });
  await p.click('#goBtn'); await p.waitForTimeout(1600);
  await p.screenshot({ path: 'v15_big_game.png' });
  const info = await p.evaluate(() => ({ w: G.map.w, h: G.map.h, units: G.units.length, s: cam.s.toFixed(2), turnLabel: document.getElementById('turnLbl').textContent }));
  await p.click('#fitBtn'); await p.waitForTimeout(150);
  await p.screenshot({ path: 'v15_big_fit.png' });
  console.log(JSON.stringify({ pts, info, errs }));
  await b.close();
})();
