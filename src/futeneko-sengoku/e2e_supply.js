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
  await p.evaluate(() => { KS.clans.mori.gold = 300; var id = attackTargets(KS, 'yoshida', 'mori').filter(t => t.to === 'bingon')[0].castle; kAttackBox('yoshida', 'bingon', id); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { var f = document.getElementById('kFood'); f.value = 8; f.oninput(); });
  await p.click('#kFight'); await p.waitForTimeout(2500);
  R.btn = await p.evaluate(() => getComputedStyle(document.getElementById('supplyBtn')).display);
  await p.click('#supplyBtn'); await p.waitForTimeout(300);
  R.msg = await p.evaluate(() => document.getElementById('supplyOpts').innerText.replace(/\n/g, ' '));
  await p.screenshot({ path: 'supply_box.png' });
  const g0 = await p.evaluate(() => KS.clans.mori.gold);
  await p.evaluate(() => document.querySelectorAll('#supplyOpts button')[1].click()); await p.waitForTimeout(400);
  R.after = await p.evaluate(() => ({ gold: KS.clans.mori.gold, conv: G.units.filter(u => u.type === 'konida').length, dis: document.getElementById('supplyBtn').disabled }));
  R.g0 = g0;
  // 小荷駄を えらんで 情報
  await p.evaluate(() => { var u = G.units.find(x => x.type === 'konida'); selectUnit(u); });
  R.info = await p.evaluate(() => document.getElementById('info') ? document.getElementById('info').innerText.slice(0, 120) : '');
  await p.screenshot({ path: 'supply_unit.png' });
  // 数ターン AI まかせで すすめて エラーが ないか
  for (let i = 0; i < 6; i++) { const over = await p.evaluate(() => !G || G.over); if (over) break; await p.evaluate(() => { if (G.side === G.playerSide && phase !== 'cpu') playerEndTurn(); }); for (let k = 0; k < 40; k++) { const mine = await p.evaluate(() => !G || G.over || (G.side === G.playerSide && phase !== 'cpu')); if (mine) break; await p.waitForTimeout(250); } }
  R.hud = await p.evaluate(() => G ? document.getElementById('turnLbl').innerText : 'over');
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
