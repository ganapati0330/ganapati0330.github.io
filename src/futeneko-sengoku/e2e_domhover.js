const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { kSel = 'yoshida'; kUpdate(); openDomain('yoshida'); }); await p.waitForTimeout(600);
  const t = await p.evaluate(() => DS.ctaps.find(t => t.key === 'yoshida_0'));
  await p.mouse.move(t.x, t.y - 10); await p.waitForTimeout(200);
  await p.screenshot({ path: 'k_domhover.png', clip: { x: t.x - 200, y: t.y - 160, width: 400, height: 260 } });
  console.log(JSON.stringify({ hv: await p.evaluate(() => DS.hover), errs }));
  await b.close();
})();
