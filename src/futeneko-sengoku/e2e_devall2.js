const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.provs.bingon.owner = KS.player; KS.castles.oasa_1.owner = KS.player; openDomain('yoshida'); });
  await p.waitForTimeout(500);

  for (const m of ['field', 'town', 'saku']) {
    await p.evaluate(m => { DS.mode = m; domPanel(); domRender(); }, m); await p.waitForTimeout(200);
    const cnt = await p.evaluate(() => { var by = {}; Object.keys(DS.valid).forEach(k => { var h = k.split(',').map(Number), pv = worldMap().provAt(h[0], h[1]), rg = regionAt(h[0], h[1]); by[rg] = (by[rg] || 0) + 1; }); return by; });
    console.log(m, JSON.stringify(cnt));
    if (m === 'field') await p.screenshot({ path: 'k_devall2.png' });
  }
  console.log(errs); await b.close();
})();
