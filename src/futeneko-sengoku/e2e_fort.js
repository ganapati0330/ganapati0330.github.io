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
  await p.evaluate(() => { KS.clans.mori.gold = 900; openDomain('yoshida'); }); await p.waitForTimeout(400);
  R.btns = await p.evaluate(() => [...document.querySelectorAll('#dActs button')].map(b => b.innerText.replace(/\n/g, ' ')));
  // 改築
  await p.evaluate(() => [...document.querySelectorAll('#dActs button')][0].click()); await p.waitForTimeout(200);
  R.lv = await p.evaluate(() => KS.provs.yoshida.clv);
  // 砦
  await p.evaluate(() => [...document.querySelectorAll('#dActs .dbld')].find(b => /砦/.test(b.innerText)).click()); await p.waitForTimeout(200);
  R.validT = await p.evaluate(() => Object.keys(DS.valid).length);
  await p.evaluate(() => { var k = Object.keys(DS.valid)[0].split(',').map(Number), q = domXY(k[0], k[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); });
  // 柵
  await p.evaluate(() => [...document.querySelectorAll('#dActs .dbld')].find(b => /柵/.test(b.innerText)).click()); await p.waitForTimeout(200);
  await p.evaluate(() => { for (var i = 0; i < 3; i++) { var k = Object.keys(DS.valid)[i * 5].split(',').map(Number), q = domXY(k[0], k[1]); domTap(DS.x + q[0] * DS.s, DS.y + q[1] * DS.s); } });
  R.cnt = await p.evaluate(() => ({ toride: bldCountIn(KS, 'yoshida', 'mori', 'toride'), saku: bldCountIn(KS, 'yoshida', 'mori', 'saku'), gold: KS.clans.mori.gold }));
  await p.screenshot({ path: 'fort_dom.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
