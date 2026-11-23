const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { var q = kMap.labels.yoshida; kMap.s *= 2.2; kMap.x = 550 - q[0] * kMap.s; kMap.y = 330 - q[1] * kMap.s; kRender(); });
  await p.waitForTimeout(200);
  const pos = await p.evaluate(() => { var rc = document.getElementById('kcv').getBoundingClientRect(); return kMap.cRects.filter(r => r.key === 'yoshida_0' || r.key === 'yoshida').map(r => [r.key, rc.left + ((r.x0 + r.x1) / 2) * kMap.s + kMap.x, rc.top + ((r.y0 + r.y1) / 2) * kMap.s + kMap.y]); });
  const br = pos.find(x => x[0] === 'yoshida_0');
  await p.mouse.move(br[1], br[2]); await p.waitForTimeout(200);
  const hv = await p.evaluate(() => kMap.hover);
  await p.screenshot({ path: 'k_hover.png', clip: { x: br[1] - 200, y: br[2] - 150, width: 400, height: 300 } });
  await p.mouse.click(br[1], br[2]); await p.waitForTimeout(300);
  const t1 = await p.textContent('#kTitle'); const b1 = await p.textContent('#kBody');
  await p.evaluate(() => kCloseModal());
  const mn = pos.find(x => x[0] === 'yoshida');
  await p.mouse.move(mn[1], mn[2]); await p.waitForTimeout(100); await p.mouse.click(mn[1], mn[2]); await p.waitForTimeout(300);
  const t2 = await p.textContent('#kTitle');
  console.log(JSON.stringify({ pos, hv, t1, b1: b1.slice(0, 30), t2, errs }));
  await b.close();
})();
