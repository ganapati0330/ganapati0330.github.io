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
  // 比叡尾山城を おまかせで おとす
  const R = await p.evaluate(() => {
    var A = KS.provs.yoshida; A.units = []; for (var i = 0; i < 9; i++) A.units.push(newUnit(KS, i < 6 ? 'ashigaru' : 'yumi'));
    var id = attackTargets(KS, 'yoshida', 'mori').filter(t => t.to === 'bingon')[0].castle; KS.castles[id].units = [newUnit(KS, 'ashigaru')];
    window._id = id; return id;
  });
  await p.evaluate(id => kAttackBox('yoshida', 'bingon', id), R); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('#kBody .pm[data-t="ashigaru"][data-d="1"]') && 0);
  await p.click('#kAuto'); 
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(300); const t = await p.evaluate(() => document.getElementById('kTitle') ? document.getElementById('kTitle').textContent : document.querySelector('#kBox').innerText.slice(0, 20)); if (/しょうり/.test(t)) break; }
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')][0].click()); await p.waitForTimeout(300);
  const d1 = await p.evaluate(() => ({ box: document.querySelector('#kBox').innerText.slice(0, 260), ok: !document.getElementById('kDepOk').disabled }));
  await p.screenshot({ path: 'deploy.png' });
  // 足軽を 1まで へらす
  for (let i = 0; i < 8; i++) { const btn = await p.$('#kBody .pm[data-t="ashigaru"][data-d="-1"]'); if (btn) await btn.click(); }
  for (let i = 0; i < 8; i++) { const btn = await p.$('#kBody .pm[data-t="yumi"][data-d="-1"]'); if (btn) await btn.click(); }
  const d0 = await p.evaluate(() => ({ txt: document.getElementById('kDep').innerText, dis: document.getElementById('kDepOk').disabled }));
  await p.click('#kBody .pm[data-t="ashigaru"][data-d="1"]');
  await p.click('#kDepOk'); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({ castle: KS.castles[window._id].units.length, home: KS.provs.yoshida.units.length, modal: document.getElementById('kBox').classList.contains('on') }));
  console.log(JSON.stringify({ d1, d0, after }), 'errs', errs);
  await b.close();
})();
