const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 1100, height: 900 }, { width: 390, height: 820 }]) {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.provs.bingon.owner = KS.player; KS.castles.bingon_1.owner = KS.player; kMainCastleBox('yoshida'); }); await p.waitForTimeout(200);
  const rows = await p.$$eval('.klink .kbrn', es => es.map(e => e.innerText.split('\n')[0]));
  await p.evaluate(() => document.querySelector('.klink').scrollIntoView()); await p.screenshot({ path: 'k_link_' + vp.width + '.png' });
  // 甲山城 へ おくる
  await p.click('[data-tsnd="bingon"]'); await p.waitForTimeout(200);
  await p.click('#kBody .pm[data-p="tm_"][data-t="ashigaru"][data-d="1"]'); await p.click('#kTmOk'); await p.waitForTimeout(200);
  const t1 = await p.evaluate(() => [KS.provs.yoshida.units.length, KS.provs.bingon.units.length, document.getElementById('kTitle').textContent]);
  // 比叡尾山城から よぶ
  await p.click('[data-tget="bingon_1"]'); await p.waitForTimeout(200);
  await p.click('#kBody .pm[data-p="tm_"][data-t="ashigaru"][data-d="1"]'); await p.click('#kTmOk'); await p.waitForTimeout(200);
  const t2 = await p.evaluate(() => [KS.provs.yoshida.units.length, KS.castles.bingon_1.units.length]);
  // 兵糧を よぶ
  await p.click('[data-rget="bingon"]'); await p.waitForTimeout(200);
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /はこぶ/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const r = await p.evaluate(() => [castleFood(KS, 'yoshida', null), castleFood(KS, 'bingon', null)]);
  console.log(vp.width, JSON.stringify({ rows, t1, t2, r, errs }));
  await p.close(); }
  await b.close();
})();
