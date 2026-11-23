// こまかい 徴兵と 補充
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
  const R = await p.evaluate(() => {
    kSel = 'yoshida'; var P = KS.provs.yoshida;
    var a = P.units.filter(u => u.type === 'ashigaru')[0]; a.hp = 6;   // 120人 へっている
    var n0 = P.units.length, g0 = KS.clans[KS.player].gold;
    kRecruitBox();
    var plus = document.querySelector('#kBox button.pm[data-t="ashigaru"][data-d="1"]');
    for (var i = 0; i < 6; i++) plus.click();   // 180人
    var cost = document.getElementById('kCost').textContent, label = document.getElementById('rc_ashigaru').textContent;
    document.getElementById('kRecOk').click();
    return { label, cost, n0, n1: P.units.length, hpA: a.hp, newHp: P.units.slice(n0).map(u => u.type + u.hp), gold: [g0, KS.clans[KS.player].gold] };
  });
  await p.evaluate(() => { kRecruitBox(); document.querySelector('#kBox button.pm[data-t="yumi"][data-d="10"]').click(); });
  await p.waitForTimeout(200); await p.screenshot({ path: 'rec_sp.png' });
  console.log(JSON.stringify({ R, errs }));
  await b.close();
})();
