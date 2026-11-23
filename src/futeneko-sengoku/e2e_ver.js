const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'k_ver_title.png', clip: { x: 0, y: 0, width: 1100, height: 120 } });
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'k_ver_map.png', clip: { x: 0, y: 0, width: 1100, height: 50 } });
  const v = await p.$$eval('.vlbl,#verLbl', es => es.map(e => e.textContent));
  console.log(v, errs); await b.close();
})();
