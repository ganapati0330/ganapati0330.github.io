'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  for (const vp of [{ width: 1850, height: 670, name: 'pc' }, { width: 390, height: 844, name: 'sp', m: true }]) {
    const p = await (await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.m ? 2 : 1, hasTouch: !!vp.m, isMobile: !!vp.m })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
    for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    await p.evaluate(() => { KS.castles.bingon_1.owner = 'mori'; openDomain('yoshida'); }); await p.waitForTimeout(500);
    await p.screenshot({ path: 'names_' + vp.name + '.png' });
    if (vp.name === 'pc') { await p.evaluate(() => { var h = llHex(133.05, 35.47), q = domXY(h[0], h[1]); DS.x = DS.W / 2 - q[0] * DS.s; DS.y = DS.H / 2 - q[1] * DS.s; domRender(); }); await p.screenshot({ path: 'names_izumo.png' }); }
    const info = await p.evaluate(() => { var cs = castleHex('yoshida'); DS.sel = [cs[0] + 2, cs[1]]; domPanel(); return document.getElementById('dInfo').innerText.slice(0, 80); });
    console.log(vp.name, info);
  }
  console.log('errs', errs);
  await b.close();
})();
