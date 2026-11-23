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
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); });
  const R = {};
  R.t0 = await p.evaluate(() => taxOf(KS.provs.yoshida));
  await p.click('.ktx[data-d="1"]'); await p.waitForTimeout(100); await p.click('.ktx[data-d="1"]'); await p.waitForTimeout(100);
  R.t1 = await p.evaluate(() => taxOf(KS.provs.yoshida));
  R.txt = await p.evaluate(() => document.querySelector('.ktax').innerText);
  await p.evaluate(() => { KS.provs.yoshida.fuman = 52; kUpdate(); document.querySelector('.ktax').scrollIntoView(); });
  await p.screenshot({ path: 'ikki_panel.png' });
  R.undo = await p.evaluate(() => { kUndo(); return taxOf(KS.provs.yoshida); });
  // 一揆で 国を うばわれる → しらせ
  await p.evaluate(() => { var P = KS.provs.sato.owner === KS.player ? KS.provs.sato : null; KS.provs.oasa.owner = KS.player; KS.provs.oasa.units = []; KS.provs.oasa.fuman = 100; KS.provs.oasa.tax = 0.7; KS.rng = 5; kSave(); });
  await p.click('#kEnd').catch(() => {}); 
  await p.evaluate(() => { var b = [...document.querySelectorAll('button')].find(x => /きせつを おわる/.test(x.textContent)); if (b) b.click(); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const t = await p.evaluate(() => document.getElementById('kBox').classList.contains('on') ? document.querySelector('#kBox h3, #kBox .ttl, #kBox').innerText.slice(0, 40) : ''); if (/一揆/.test(t)) break; if (/せめてきた/.test(t)) await p.evaluate(() => { [...document.querySelectorAll('#kBtns button')][1].click(); }); else if (t) await p.evaluate(() => { [...document.querySelectorAll('#kBtns button')][0].click(); }); }
  R.modal = await p.evaluate(() => document.getElementById('kBox').innerText.slice(0, 200));
  R.oasa = await p.evaluate(() => KS.provs.oasa.owner);
  await p.screenshot({ path: 'ikki_modal.png' });
  console.log(JSON.stringify(R), 'errs', errs);
  await b.close();
})();
