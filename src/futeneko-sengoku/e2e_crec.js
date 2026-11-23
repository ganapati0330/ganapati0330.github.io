const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 850 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const R = {};
  for (const [fn, key] of [['kMainCastleBox', 'yoshida'], ['kCastleBox', 'yoshida_1']]) {
    await p.evaluate(([f, k]) => window[f](k), [fn, key]); await p.waitForTimeout(200);
    R[key + '_btns'] = await p.$$eval('#kBtns button', bs => bs.map(x => x.textContent + (x.disabled ? '(x)' : '')));
    await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /徴兵/.test(x.textContent)).click()); await p.waitForTimeout(200);
    R[key + '_title'] = await p.textContent('#kTitle');
    await p.click('#kBody .pm[data-t="yumi"][data-d="10"]'); await p.click('#kRecOk'); await p.waitForTimeout(300);
    R[key + '_back'] = await p.textContent('#kTitle');
    R[key + '_units'] = await p.evaluate(k => (KS.castles[k] ? KS.castles[k].units : KS.provs[k].units).map(u => u.type + ':' + u.hp).join(','), key);
  }
  console.log(JSON.stringify(R), errs);
  await b.close();
})();
