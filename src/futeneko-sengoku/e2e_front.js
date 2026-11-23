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
  // 吉田と 東西条を 毛利に、備後北部の 支城を あけて 本城を 2か所から
  await p.evaluate(() => {
    ['yoshida', 'kagami'].forEach(q => { KS.provs[q].owner = 'mori'; KS.provs[q].units = []; for (var i = 0; i < 6; i++) KS.provs[q].units.push(newUnit(KS, i % 2 ? 'yumi' : 'ashigaru')); });
    branchesIn(KS, 'bingon').forEach(c => c.owner = 'mori'); KS.clans.mori.gold = 900; kSel = 'yoshida'; kUpdate();
  });
  R.co = await p.evaluate(() => coFronts(KS, 'yoshida', 'bingon', null));
  await p.evaluate(() => kAttackBox('yoshida', 'bingon', null)); await p.waitForTimeout(300);
  await p.evaluate(() => { var i = coSources(KS, 'yoshida', 'bingon', null).findIndex(c => c.from === 'kagami'); var d = document.querySelectorAll('details.kco')[i]; d.open = true; for (var k = 0; k < 3; k++) d.querySelector('.pm[data-t="ashigaru"][data-d="1"]').click(); });
  R.odds = await p.evaluate(() => document.getElementById('kOdds').innerText);
  await p.screenshot({ path: 'front_box.png', fullPage: false });
  await p.click('#kFight'); await p.waitForTimeout(2500);
  R.battle = await p.evaluate(() => ({ h: G.map.h, w: G.map.w, turns: G.turnLimit, fronts: G.fronts, f1: G.units.filter(u => u.front === 1).length, log: (G.log || []).slice(0, 2) }));
  R.intro = await p.evaluate(() => document.body.innerText.match(/合戦！[^\n]*/) ? document.body.innerText.match(/合戦！[^\n]*/)[0].slice(0, 200) : '');
  await p.evaluate(() => { if (typeof fitCamera === 'function') fitCamera(); }); await p.waitForTimeout(400);
  await p.screenshot({ path: 'front_battle.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
