'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
  for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.waitForTimeout(800);
  await p.evaluate(() => { (KS.fallen = {}).bingon_1 = KS.turn; kRender(); });
  await p.screenshot({ path: 'castle_map.png' });
  await p.evaluate(() => { var q = kMap.labels.yoshida; kMap.s = 4; kMap.x = kMap.W / 2 - q[0] * kMap.s; kMap.y = kMap.H * 0.35 - q[1] * kMap.s; kRender(); });
  await p.screenshot({ path: 'castle_map_zoom.png' });
  await p.evaluate(() => { openDomain('yoshida'); }); await p.waitForTimeout(500);
  await p.screenshot({ path: 'castle_dom.png' });
  console.log('errs', errs);
  await b.close();
})();
