const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { noteWar(KS, 'mori', 'takeda'); var q = kMap.labels.yoshida; kMap.s *= 2.0; kMap.x = 550 - q[0] * kMap.s; kMap.y = 330 - q[1] * kMap.s; kRender(); });
  await p.waitForTimeout(300); await p.screenshot({ path: 'k_owner_map.png' });
  await p.evaluate(() => kMainCastleBox('sato')); await p.waitForTimeout(200); await p.screenshot({ path: 'k_owner_box.png', clip: { x: 330, y: 60, width: 440, height: 300 } });
  await p.evaluate(() => kCastleBox('yoshida_0')); await p.waitForTimeout(200); await p.screenshot({ path: 'k_owner_box2.png', clip: { x: 330, y: 60, width: 440, height: 300 } });
  console.log(errs);
  await b.close();
})();
