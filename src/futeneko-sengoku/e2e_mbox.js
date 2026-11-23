const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 1900, height: 820 }, { width: 390, height: 800 }]) {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); });
  const acts = await p.$$eval('#kActs button', bs => bs.map(x => x.textContent));
  await p.click('#kActs .katk'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'k_mbox_' + vp.width + '.png' });
  const btns = await p.$$eval('#kBtns button', bs => bs.map(x => x.textContent + (x.disabled ? '(x)' : '')));
  await p.evaluate(() => [...document.querySelectorAll('#kBtns button')].find(x => /出陣/.test(x.textContent)).click()); await p.waitForTimeout(200);
  const mode = await p.evaluate(() => [kMode, [...document.querySelectorAll('#kActs button')].map(x => x.textContent)]);
  console.log(vp.width, JSON.stringify({ acts, btns, mode, errs }));
  await p.close(); }
  await b.close();
})();
