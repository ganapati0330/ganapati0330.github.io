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
  const R = {};
  R.id = await p.evaluate(() => { var id = 'bingon_1'; KS.castles[id].owner = 'mori'; KS.castles[id].units = [newUnit(KS, 'ashigaru')]; kSel = 'bingon'; kUpdate(); return id; });
  R.chip = await p.evaluate(() => document.querySelector('.kbr[data-br="bingon_1"]').innerText);
  await p.click('.kbr[data-br="bingon_1"]'); await p.waitForTimeout(200);
  R.box = await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].map(b => b.textContent));
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(b => /所領を ひらく/.test(b.textContent)).click()); await p.waitForTimeout(500);
  R.title = await p.evaluate(() => document.getElementById('dTitle').textContent + ' | ' + document.getElementById('dStat').textContent);
  await p.screenshot({ path: 'brdom_view.png' });
  // 田畑を えらんで みどりの マスに たてる
  await p.evaluate(() => [...document.querySelectorAll('#dActs .dbld')].find(b => /田畑/.test(b.innerText)).click()); await p.waitForTimeout(200);
  R.valid = await p.evaluate(() => Object.keys(DS.valid).length);
  const g0 = await p.evaluate(() => KS.clans.mori.gold);
  await p.evaluate(() => { var k = Object.keys(DS.valid)[0].split(',').map(Number), q = domXY(k[0], k[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); });
  R.after = await p.evaluate(() => ({ gold: KS.clans.mori.gold, dev: KS.castles.bingon_1.dev === KS.turn, fields: bldCountIn(KS, 'bingon', 'mori', 'field'), nen: nenguOf(KS, 'bingon', 'mori') }));
  R.g0 = g0;
  await p.screenshot({ path: 'brdom_built.png' });
  // 敵本城側は つくれない
  R.ownerBlocked = await p.evaluate(() => { var d = domData(); var h = d.bingon.hexes.filter(h => regionAt(h[0], h[1]) === 'bingon_1')[0]; return canBuild(KS, 'bingon', h[0], h[1], 'field').msg; });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
