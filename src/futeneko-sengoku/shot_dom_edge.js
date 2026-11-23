const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const info = await p.evaluate(() => {
    // となりの 国の 支城を ひとつ もらう
    var ids = Object.keys(KS.castles).filter(id => ADJ.yoshida.indexOf(KS.castles[id].prov) >= 0 && KS.provs[KS.castles[id].prov].owner !== KS.player);
    var id = 'bingon_1';
    KS.castles[id].owner = KS.player; kSel = 'yoshida'; kMap.provEdge = {};
    var cx = worldMap(), bh = branchHexes()[id];
    return { id, name: castleNameOf ? null : null, bh };
  });
  await p.evaluate(() => { kMap.s = 3.2; var h = kMap.HX ? 0 : 0; });
  // 吉田 へ ズーム
  await p.evaluate(() => { if (typeof kFocusProv === 'function') kFocusProv('yoshida'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { var q = kMap.labels.yoshida; kMap.s *= 1.5; kMap.x = 550 - q[0] * kMap.s; kMap.y = 200 - q[1] * kMap.s; kRender(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'k_domedge.png', clip: { x: 150, y: 40, width: 800, height: 410 } });
  console.log(JSON.stringify({ info, errs }));
  await b.close();
})();
