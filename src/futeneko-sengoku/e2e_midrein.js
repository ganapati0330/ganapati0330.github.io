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
  // まもり：佐東から 吉田へ
  await p.evaluate(() => {
    KS.provs.kagami.owner = 'mori'; KS.provs.kagami.units = [newUnit(KS, 'ashigaru'), newUnit(KS, 'yumi')];
    var en = 'sato'; KS.provs[en].units = [0, 1, 2, 3, 4, 5, 6].map(() => newUnit(KS, 'ashigaru'));
    var bb = makeBattle(KS, en, 'yoshida', KS.provs[en].units.map(u => u.uid), null); startBattle(KS, bb); bb.playerSide = 'def'; kFightBattle(bb);
  });
  await p.waitForTimeout(2500);
  for (let k = 0; k < 40; k++) { const mine = await p.evaluate(() => G.side === G.playerSide && phase !== 'cpu'); if (mine) break; await p.waitForTimeout(300); }
  R.btn = await p.evaluate(() => getComputedStyle(document.getElementById('reinBtn')).display + '/' + document.getElementById('reinBtn').disabled);
  await p.click('#reinBtn'); await p.waitForTimeout(400);
  R.list = await p.evaluate(() => [...document.querySelectorAll('#reinList .kbrn')].map(e => e.innerText.replace(/\n/g, ' ')));
  await p.screenshot({ path: 'midrein_map.png' });
  // 東西条を 地図で タップ
  const pt = await p.evaluate(() => { var i = reinSrcs.findIndex(s => s.src === 'kagami'); var cv = document.getElementById('reinMap'), rc = cv.getBoundingClientRect(), sp = reinSrcs[i].sp; return [rc.left + sp[0] * rc.width / cv.width, rc.top + sp[1] * rc.height / cv.height]; });
  await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(200);
  await p.click('#reinPick .pm[data-p="mr_"][data-t="ashigaru"][data-d="1"]'); await p.click('#reinPick .pm[data-p="mr_"][data-t="yumi"][data-d="1"]');
  await p.screenshot({ path: 'midrein_pick.png' });
  await p.click('#reinGo'); await p.waitForTimeout(500);
  R.after = await p.evaluate(() => ({ pend: G.pendingRein.map(x => [x.due, x.list.length, x.entry]), turn: G.turn, kagami: KS.provs.kagami.units.length }));
  // ターンを すすめて とうちゃく
  for (let i = 0; i < 6; i++) { const over = await p.evaluate(() => !G || G.over); if (over) break; await p.evaluate(() => { if (G.side === G.playerSide && phase !== 'cpu') playerEndTurn(); }); for (let k = 0; k < 40; k++) { const mine = await p.evaluate(() => !G || G.over || (G.side === G.playerSide && phase !== 'cpu')); if (mine) break; await p.waitForTimeout(250); } const n = await p.evaluate(() => G ? G.units.filter(u => u.reinf).length : -1); if (n > 0) { R.arrived = { turn: await p.evaluate(() => G.turn), n }; break; } }
  await p.screenshot({ path: 'midrein_arrive.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
