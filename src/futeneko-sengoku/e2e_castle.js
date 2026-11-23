// 城を おとして いく（支城→本城）
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const errs = [], out = {};
  for (const [tag, vp] of [['pc', { width: 1280, height: 800 }], ['sp', { width: 390, height: 780 }]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(300);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.click('#startBtn'); await p.click('#ngBtn'); await p.click('#kGoBtn'); await p.waitForTimeout(300);
    for (let i = 0; i < 6; i++) { if (!(await p.evaluate(() => document.getElementById('kBox').classList.contains('on')))) break; await p.click('#kBtns .act'); await p.waitForTimeout(150); }
    out[tag] = await p.evaluate(() => {
      var R = {};
      kSel = 'yoshida'; kMode = 'attack'; kUpdate();
      R.targets = kAtkTargets().map(t => targetName(KS, t));
      // 佐東の 入口の 支城を おまかせで せめる（強い 軍で）
      var t = kAtkTargets().filter(t => t.to === 'sato')[0]; R.first = t.castle;
      for (var i = 0; i < 8; i++) KS.provs.yoshida.units.push(newUnit(KS, 'ashigaru'));
      kAttackBox('yoshida', 'sato', t.castle); R.box = document.getElementById('kBody').innerText.slice(0, 120);
      document.getElementById('kAuto').click();
      R.res1 = document.getElementById('kTitle').textContent; [...document.querySelectorAll('#kBtns button')][0].click();
      R.owner1 = KS.castles[t.castle].owner;
      // 本城が せめられるか
      KS.provs.yoshida.done = {}; kSel = 'yoshida'; kMode = 'attack'; kUpdate();
      R.next = kAtkTargets().filter(t => t.to === 'sato').map(t => targetName(KS, t));
      // 支城パネル と 守備兵
      kMode = 'idle'; kCastleBox('yoshida_0'); R.cbox = document.getElementById('kBody').innerText.slice(0, 80);
      for (var j = 0; j < 3; j++) KS.provs.yoshida.units.push(newUnit(KS, 'yumi')); var n0 = KS.castles.yoshida_0.units.length; kGarrisonBox('yoshida_0', 'in', 'yoshida'); document.querySelector('#kBox button.pm[data-d="1"]').click(); [...document.querySelectorAll('#kBtns button')][0].click();
      R.garrison = [n0, KS.castles.yoshida_0.units.length];
      kSel = 'sato'; kUpdate(); R.info = document.getElementById('kInfo').innerText.split('\n').filter(l => l.indexOf('支城') >= 0).join('');
      return R;
    });
    await p.evaluate(() => { kCloseModal(); kSel = 'yoshida'; kMode = 'attack'; kMap.s = 2.2; var q = kMap.labels.yoshida; kMap.x = kMap.W / 2 - q[0] * kMap.s; kMap.y = kMap.H / 2 - q[1] * kMap.s; kUpdate(); });
    await p.waitForTimeout(200); await p.screenshot({ path: `castle_${tag}.png` });
    // 支城の 合戦マップ
    out[tag].battle = await p.evaluate(() => { kMode = 'idle'; var t = attackTargets(KS, 'yoshida').filter(t => t.castle)[0]; var bt = makeBattle(KS, 'yoshida', t.to, KS.provs.yoshida.units.slice(0, 6).map(u => u.uid), t.castle); startBattle(KS, bt); bt.playerSide = 'atk'; kFightBattle(bt); return { castle: G.map.name, log: LOG[0] && LOG[0].text.slice(0, 80) }; });
    await p.waitForTimeout(2600); await p.screenshot({ path: `castle_battle_${tag}.png` });
    await p.close();
  }
  console.log(JSON.stringify({ out, errs }));
  await b.close();
})();
