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
  await p.evaluate(() => { var id = attackTargets(KS, 'yoshida', 'mori').filter(t => t.to === 'bingon')[0].castle; window._id = id; kAttackBox('yoshida', 'bingon', id); });
  await p.waitForTimeout(300);
  R.food0 = await p.evaluate(() => ({ v: document.getElementById('kFood').value, txt: document.getElementById('kFoodV').innerText }));
  await p.evaluate(() => { var f = document.getElementById('kFood'); f.value = 6; f.oninput(); });
  R.food1 = await p.evaluate(() => document.getElementById('kFoodV').innerText);
  await p.screenshot({ path: 'food_box.png' });
  const g0 = await p.evaluate(() => KS.clans.mori.gold);
  await p.click('#kFight'); await p.waitForTimeout(2500);
  R.gold = [g0, await p.evaluate(() => KS.clans.mori.gold)];
  R.hud = await p.evaluate(() => document.getElementById('turnLbl').innerText);
  R.intro = await p.evaluate(() => (document.body.innerText.match(/合戦！[^\n]*/) || [''])[0].slice(0, 90));
  // ターンを すすめて ひきあげ
  for (let i = 0; i < 12; i++) {
    const over = await p.evaluate(() => !G || G.over);
    if (over) break;
    await p.evaluate(() => { if (G.side === G.playerSide) playerEndTurn(); });
    await p.waitForTimeout(400);
    for (let k = 0; k < 40; k++) { const mine = await p.evaluate(() => !G || G.over || (G.side === G.playerSide && phase !== 'cpu')); if (mine) break; await p.waitForTimeout(250); }
    if (i === 2) R.hud3 = await p.evaluate(() => G ? document.getElementById('turnLbl').innerText : '');
  }
  await p.waitForTimeout(2500);
  R.end = await p.evaluate(() => document.getElementById('kBox').classList.contains('on') ? document.getElementById('kBox').innerText.slice(0, 120) : (G && G.reason));
  await p.screenshot({ path: 'food_end.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
