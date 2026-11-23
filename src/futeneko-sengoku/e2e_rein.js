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
  await p.evaluate(() => {
    KS.provs.kagami.owner = 'mori'; KS.provs.kagami.units = [newUnit(KS, 'ashigaru'), newUnit(KS, 'yumi')];
    var en = 'sato'; KS.provs[en].units = [0, 1, 2, 3, 4, 5, 6].map(() => newUnit(KS, 'ashigaru'));
    var bb = makeBattle(KS, en, 'yoshida', KS.provs[en].units.map(u => u.uid), null); startBattle(KS, bb); bb.playerSide = 'def'; window._b = bb; kDefenseBox(bb);
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'rein_box.png' });
  R.btns = await p.evaluate(() => [...document.querySelectorAll('[data-rs]')].length);
  // 東西条から 足軽1
  await p.click('[data-rs="0"]'); await p.waitForTimeout(200);
  await p.click('#kBody .pm[data-p="rs_"][data-t="ashigaru"][data-d="1"]');
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /けってい/.test(x.textContent)).click()); await p.waitForTimeout(200);
  R.after = await p.evaluate(() => document.querySelector('.kodds').innerText);
  await p.screenshot({ path: 'rein_box2.png' });
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')][0].click()); await p.waitForTimeout(2500);
  // CPU の ばんが おわるまで まつ
  for (let k = 0; k < 40; k++) { const mine = await p.evaluate(() => G.side === G.playerSide && phase !== 'cpu'); if (mine) break; await p.waitForTimeout(300); }
  R.btnVis = await p.evaluate(() => [getComputedStyle(document.getElementById('reinBtn')).display, document.getElementById('reinBtn').disabled]);
  await p.click('#reinBtn'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'rein_mid.png' });
  await p.evaluate(() => reinChoose(0)); await p.waitForTimeout(100);
  await p.evaluate(() => document.querySelector('#reinPick .pm[data-d="1"]').click());
  await p.click('#reinGo'); await p.waitForTimeout(400);
  R.mid = await p.evaluate(() => G.pendingRein.map(x => [x.name, x.list.length, x.due]));
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
