'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(400);
  for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const R = await p.evaluate(() => {
    var id = branchesIn(KS, 'bingon').map(c => c.id)[1]; KS.castles[id].owner = 'mori'; KS.castles[id].units = [newUnit(KS, 'ashigaru')];
    var g0 = KS.clans.mori ? 0 : 0;
    kSel = 'bingon'; kUpdate();
    var w = worldMap(), d = domData(), hx = d.bingon.hexes.filter(h => regionAt(h[0], h[1]) === id)[0];
    var cb = canBuild(KS, 'bingon', hx[0], hx[1], 'field');
    return { id: id, share: branchShare(id), koku: document.getElementById('kKoku').textContent, cb: cb.msg, info: document.getElementById('kInfo') ? document.getElementById('kInfo').innerText.slice(0, 300) : '' };
  });
  console.log(JSON.stringify(R));
  await p.evaluate(() => { var q = kProj(PROV_BY.bingon.pin[0], PROV_BY.bingon.pin[1]); kMap.s = 2.2; kMap.x = kMap.W / 2 - q[0] * kMap.s; kMap.y = kMap.H * 0.35 - q[1] * kMap.s; kRender && kRender(); kUpdate(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'reg_map.png' });
  await p.evaluate(id => kCastleBox(id), R.id); await p.waitForTimeout(200);
  await p.screenshot({ path: 'reg_box.png' });
  console.log('errs', errs);
  await b.close();
})();
