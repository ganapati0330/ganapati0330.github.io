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
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); });
  R.chip = await p.evaluate(() => document.querySelector('.kbr[data-main]').innerText);
  await p.click('.kbr[data-main]'); await p.waitForTimeout(300);
  R.box = await p.evaluate(() => document.getElementById('kBox').innerText.slice(0, 400));
  await p.screenshot({ path: 'cbox_main.png' });
  // 支城へ おくる
  await p.evaluate(() => document.querySelector('[data-tsnd]').click()); await p.waitForTimeout(200);
  await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]');
  await p.click('#kTmOk'); await p.waitForTimeout(300);
  R.after = await p.evaluate(() => ({ main: KS.provs.yoshida.units.length, br: branchesIn(KS, 'yoshida').map(c => c.units.length), title: document.getElementById('kBox').innerText.slice(0, 20) }));
  // 兵糧を かう
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(b => /兵糧を かう/.test(b.textContent)).click()); await p.waitForTimeout(200);
  const f0 = await p.evaluate(() => castleFood(KS, 'yoshida', null));
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(b => /^かう/.test(b.textContent)).click()); await p.waitForTimeout(300);
  R.food = [f0, await p.evaluate(() => castleFood(KS, 'yoshida', null))];
  // 支城の 画面
  await p.evaluate(() => kCastleBox('yoshida_0')); await p.waitForTimeout(200);
  await p.screenshot({ path: 'cbox_branch.png' });
  // 地図で 本城の 絵を タップ
  await p.evaluate(() => kCloseModal());
  const pos = await p.evaluate(() => { var q = kProj(PROV_BY.izumo.pin[0], PROV_BY.izumo.pin[1]); return [kMap.x + q[0] * kMap.s, kMap.y + (q[1] - 10 * kU(1.15)) * kMap.s]; });
  await p.evaluate(([x, y]) => kTap(x, y), pos); await p.waitForTimeout(300);
  R.tapIzumo = await p.evaluate(() => document.getElementById('kBox').classList.contains('on') ? document.getElementById('kBox').innerText.slice(0, 40) : 'nobox ' + kSel);
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
