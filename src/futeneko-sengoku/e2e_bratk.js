const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.castles.bingon_1.owner = KS.player; KS.castles.bingon_1.units = [0,1,2,3,4].map(() => newUnit(KS, 'ashigaru')); kUpdate(); kCastleBox('bingon_1'); });
  await p.waitForTimeout(300);
  const btns = await p.$$eval('#kBtns button', bs => bs.map(x => x.textContent + (x.disabled ? '(x)' : '')));
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /出陣/.test(x.textContent)).click()); await p.waitForTimeout(300);
  const list = await p.$$eval('#kBody .koff', bs => bs.map(x => x.innerText.replace(/\n/g, ' ')));
  await p.screenshot({ path: 'k_bratk_list.png' });
  await p.click('#kBody .koff >> nth=0'); await p.waitForTimeout(300);
  const box = (await p.textContent('#kBody')).slice(0, 300);
  await p.screenshot({ path: 'k_bratk_box.png' });
  await p.click('#kFight'); await p.waitForTimeout(2500);
  const g = await p.evaluate(() => ({ atk: G.units.filter(u => u.side === 'atk').length, log: LOG[0] && LOG[0].text, src: G.kBattle.srcCastle, left: KS.castles.bingon_1.units.length }));
  await p.screenshot({ path: 'k_bratk_battle.png' });
  console.log(JSON.stringify({ btns, list, box, g, errs }));
  await b.close();
})();
