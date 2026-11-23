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
  R.top0 = await p.evaluate(() => document.getElementById('kProv').textContent);
  await p.evaluate(() => { KS.castles.bingon_1.owner = 'mori'; KS.castles.bingon_1.units = [newUnit(KS, 'ashigaru')]; KS.clans.mori.gold = 500; kSel = 'yoshida'; kUpdate(); });
  R.top1 = await p.evaluate(() => document.getElementById('kProv').textContent);
  await p.evaluate(() => openDomain('yoshida')); await p.waitForTimeout(400);
  R.brOK = await p.evaluate(() => JSON.stringify(DS.brOK));
  await p.evaluate(() => [...document.querySelectorAll('#dActs .dbld')].find(b => /田畑/.test(b.innerText)).click()); await p.waitForTimeout(200);
  R.valid = await p.evaluate(() => { var v = Object.keys(DS.valid); return { all: v.length, br: v.filter(k => { var x = k.split(',').map(Number); return regionAt(x[0], x[1]) === 'bingon_1'; }).length }; });
  await p.screenshot({ path: 'dom2_a.png' });
  // 支城の 所領に 1つ、吉田に 1つ
  R.b1 = await p.evaluate(() => { var k = Object.keys(DS.valid).filter(k => { var x = k.split(',').map(Number); return regionAt(x[0], x[1]) === 'bingon_1'; })[0].split(',').map(Number), q = domXY(k[0], k[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); return bldCountIn(KS, 'bingon', 'mori', 'field'); });
  R.b2 = await p.evaluate(() => { var k = Object.keys(DS.valid).filter(k => { var x = k.split(',').map(Number); return worldMap().provAt(x[0], x[1]) === 'yoshida'; })[0].split(',').map(Number), q = domXY(k[0], k[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); return [bldCount(KS.provs.yoshida, 'field'), KS.castles.bingon_1.dev === KS.turn, didCmd(KS.provs.yoshida, 'develop')]; });
  R.info = await p.evaluate(() => { DS.sel = null; domPanel(); return document.getElementById('dInfo').innerText; });
  await p.evaluate(() => { var h = branchHexes().bingon_1, q = domXY(h[0], h[1]); DS.x = DS.W / 2 - q[0] * DS.s - 60; DS.y = DS.H * 0.4 - q[1] * DS.s; domRender(); });
  await p.screenshot({ path: 'dom2_b.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
