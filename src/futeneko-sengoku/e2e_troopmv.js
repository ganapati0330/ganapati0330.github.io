const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  // 吉田・備後北部・備中 を 領地に（備中は 吉田と となりで ない）
  const dl = await p.evaluate(() => { KS.provs.bingon.owner = KS.player; KS.provs.bitchu.owner = KS.player; KS.castles.bingos_0 && (KS.castles.bingos_0.owner = KS.player); kUpdate(); return { y: domainLocs(KS, 'yoshida'), adj: ADJ.yoshida.indexOf('bitchu') }; });
  await p.evaluate(() => kMainCastleBox('yoshida')); await p.waitForTimeout(200);
  const btns = await p.$$eval('#kBtns button', bs => bs.map(x => x.textContent));
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /うつす/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const list = await p.$$eval('#kBody .koff', bs => bs.map(x => x.innerText.split('\n')[0]));
  await p.click('#kBody .koff[data-d="bitchu"]'); await p.waitForTimeout(200);
  await p.click('#kBody .pm[data-p="tm_"][data-t="ashigaru"][data-d="1"]'); await p.click('#kBody .pm[data-p="tm_"][data-t="ashigaru"][data-d="1"]');
  await p.screenshot({ path: 'k_troopmv.png' });
  const w = await p.textContent('#kTmW');
  const b0 = await p.evaluate(() => [KS.provs.yoshida.units.length, KS.provs.bitchu.units.length]);
  await p.click('#kTmOk'); await p.waitForTimeout(200);
  const a0 = await p.evaluate(() => [KS.provs.yoshida.units.length, KS.provs.bitchu.units.length, document.getElementById('kTitle').textContent]);
  // 兵糧も 遠くへ
  const rice = await p.evaluate(() => { var r = moveRice(KS, 'yoshida', 'bitchu', 30); return [r.ok, riceDests(KS, 'yoshida').indexOf('bitchu') >= 0]; });
  console.log(JSON.stringify({ dl, btns, list, w, b0, a0, rice, errs }));
  await b.close();
})();
