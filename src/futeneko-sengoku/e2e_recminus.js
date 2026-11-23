const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 1100, height: 850 }, { width: 390, height: 800 }]) {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); kRecruitBox(); }); await p.waitForTimeout(200);
  const v = [];
  const q = (d) => p.click('#kBody .pm[data-t="ashigaru"][data-d="' + d + '"]');
  await q(300); await q(300); await q(10); v.push(await p.inputValue('#rc_ashigaru'));
  await q(-10); v.push(await p.inputValue('#rc_ashigaru'));
  await q(-300); v.push(await p.inputValue('#rc_ashigaru'));
  await q(-1); v.push(await p.inputValue('#rc_ashigaru'));
  await p.screenshot({ path: 'k_recminus_' + vp.width + '.png' });
  await q(0); v.push(await p.inputValue('#rc_ashigaru'));
  console.log(vp.width, JSON.stringify(v), errs);
  await p.close(); }
  await b.close();
})();
