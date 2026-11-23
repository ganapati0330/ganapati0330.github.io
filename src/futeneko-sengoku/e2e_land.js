const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 1100, height: 850 }, { width: 390, height: 800 }]) {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.provs.bingon.owner = KS.player; KS.castles.bingon_1.owner = KS.player; KS.castles.oasa_1.owner = KS.player; KS.officers.shiji.at = 'yoshida_0'; kUpdate(); });
  await p.click('#kLandBtn'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'k_land_' + vp.width + '.png' });
  const rows = await p.$$eval('.kland tr', rs => rs.map(r => r.innerText.replace(/\s+/g, ' ').slice(0, 90)));
  await p.click('.kland tr.kcrow[data-br="yoshida_0"]'); await p.waitForTimeout(300);
  const t = await p.textContent('#kTitle');
  console.log(vp.width, JSON.stringify({ rows, t, errs }));
  await p.close(); }
  await b.close();
})();
