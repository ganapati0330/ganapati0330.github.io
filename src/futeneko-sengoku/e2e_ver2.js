const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 1100, height: 800 }, { width: 390, height: 800 }]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'k_ver2_title_' + vp.width + '.png' });
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.screenshot({ path: 'k_ver2_map_' + vp.width + '.png' });
  await p.close(); }
  await b.close();
})();
