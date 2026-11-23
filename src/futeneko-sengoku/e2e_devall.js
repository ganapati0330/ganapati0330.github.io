const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300); await p.click('#kBtns .act'); await p.waitForTimeout(300); for (let i = 0; i < 5; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  await p.evaluate(() => { KS.provs.bingon.owner = KS.player; KS.castles.oasa_1.owner = KS.player; KS.clans.mori.gold = 300; openDomain('yoshida'); });
  await p.waitForTimeout(500);
  await p.click('#dFitBtn'); await p.waitForTimeout(400);
  await p.screenshot({ path: 'k_devall.png' });
  const info = await p.textContent('#dInfo');
  // 田畑を 吉田・備後北部・駿河丸城の 所領に たてる
  const res = await p.evaluate(() => {
    DS.mode = 'field'; domRender(); var out = {};
    ['yoshida', 'bingon', 'oasa_1'].forEach(function (key) {
      var vk = Object.keys(DS.valid || {}).map(k => k.split(',').map(Number)).find(h => { var pv = worldMap().provAt(h[0], h[1]); var rg = regionAt(h[0], h[1]); return key.indexOf('_') > 0 ? rg === key : (pv === key && rg === key); });
      if (!vk) { out[key] = 'none'; return; }
      var pv = domHexOK(vk[0], vk[1]); var r = build(KS, pv, vk[0], vk[1], 'field', KS.player); out[key] = r.ok;
    });
    out.cmd = [didCmd(KS.provs.yoshida, 'develop'), didCmd(KS.provs.bingon, 'develop')];
    return out;
  });
  console.log(JSON.stringify({ info: info.slice(-120), res, errs }));
  await b.close();
})();
