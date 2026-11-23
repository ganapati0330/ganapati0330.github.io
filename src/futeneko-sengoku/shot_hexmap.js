'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  for (const vp of [{ width: 1900, height: 900, name: 'pc' }, { width: 390, height: 844, name: 'sp', m: true }]) {
    const p = await (await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.m ? 2 : 1, hasTouch: !!vp.m, isMobile: !!vp.m })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
    for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    await p.waitForTimeout(800); await p.evaluate(() => kRender());
    const info = await p.evaluate(() => ({ ms: kMap.hexMs, cv: kMap.hexCv && [kMap.hexCv.width, kMap.hexCv.height], hexW: kMap.hexW, s: kMap.s }));
    console.log(vp.name, JSON.stringify(info));
    await p.screenshot({ path: 'hexmap_' + vp.name + '.png' });
    // ズーム
    await p.evaluate(() => { var q = kMap.labels.yoshida; kMap.s = 6; kMap.x = kMap.W / 2 - q[0] * kMap.s; kMap.y = kMap.H * 0.4 - q[1] * kMap.s; kRender(); });
    await p.screenshot({ path: 'hexmap_' + vp.name + '_zoom.png' });
    const t0 = await p.evaluate(() => { var t = performance.now(); for (var i = 0; i < 5; i++) kRender(); return (performance.now() - t) / 5; });
    console.log('render ms zoom', t0.toFixed(1));
  }
  console.log('errs', errs);
  await b.close();
})();
