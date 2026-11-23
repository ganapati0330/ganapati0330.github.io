const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.castles.bingon_1.owner = KS.player; kMainCastleBox('yoshida'); }); await p.waitForTimeout(200);
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /はこぶ/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const list = await p.$$eval('#kBody .koff', bs => bs.map(x => x.innerText.replace(/\n/g, ' ')));
  await p.screenshot({ path: 'k_ricemv_list.png' });
  await p.click('#kBody .koff[data-d="yoshida_0"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'k_ricemv_amt.png' });
  const w = await p.textContent('#kRmW');
  const before = await p.evaluate(() => [castleFood(KS, 'yoshida', null), castleFood(KS, 'yoshida', 'yoshida_0')]);
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /はこぶ/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const after = await p.evaluate(() => [castleFood(KS, 'yoshida', null), castleFood(KS, 'yoshida', 'yoshida_0'), document.getElementById('kTitle').textContent]);
  console.log(JSON.stringify({ list, w, before, after, errs }));
  await b.close();
})();
